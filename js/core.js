/* Core: storage, audio, speech, recording, helpers. */
'use strict';

const $ = (sel, el = document) => el.querySelector(sel);
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const dayNum = s => Math.round(new Date(s + 'T12:00:00').getTime() / 86400000);

function toast(msg, ms = 2600) {
  const t = h('div', { class: 'toast' }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), ms);
}

/* ---------- Storage (IndexedDB, falls back to memory) ---------- */
const Store = (() => {
  let db = null;
  const mem = { kv: new Map(), blobs: new Map() };
  let persistent = false;

  function open() {
    return new Promise(resolve => {
      try {
        const req = indexedDB.open('g-letters', 1);
        req.onupgradeneeded = () => {
          req.result.createObjectStore('kv');
          req.result.createObjectStore('blobs');
        };
        req.onsuccess = () => { db = req.result; persistent = true; resolve(true); };
        req.onerror = () => resolve(false);
      } catch (e) { resolve(false); }
    });
  }
  function tx(store, mode, fn) {
    if (!db) {
      return Promise.resolve(fn(null, mem[store]));
    }
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const os = t.objectStore(store);
      const out = fn(os, null);
      t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : out);
      t.onerror = () => reject(t.error);
    });
  }
  const get = (store, key) => db
    ? new Promise((res, rej) => { const r = db.transaction(store).objectStore(store).get(key); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); })
    : Promise.resolve(mem[store].get(key));
  const put = (store, key, val) => tx(store, 'readwrite', (os, m) => os ? os.put(val, key) : m.set(key, val));
  const del = (store, key) => tx(store, 'readwrite', (os, m) => os ? os.delete(key) : m.delete(key));
  const keys = store => db
    ? new Promise((res, rej) => { const r = db.transaction(store).objectStore(store).getAllKeys(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); })
    : Promise.resolve([...mem[store].keys()]);

  return {
    open, get, put, del, keys,
    get persistent() { return persistent; },
    kv: { get: k => get('kv', k), set: (k, v) => put('kv', k, v) },
    blob: { get: k => get('blobs', k), set: (k, v) => put('blobs', k, v), del: k => del('blobs', k), keys: () => keys('blobs') },
  };
})();

/* App state, loaded once and saved on change. */
const DEFAULT_SETTINGS = {
  childName: 'G', parentName: 'Dad',
  unlocked: ['s', 'a', 't'],
  checksPerDay: 2,     // first N questions for a letter on a day must all be right for that day to count
  hatchDays: 3,        // number of good days needed
  hatchSpan: 3,        // days between first and last good day
  eggAfter: 3,         // correct answers before an egg appears
  sessionMin: 15,
  ghost: false,        // show faint model under the writing canvas
  spriteNames: {},
};
const S = { settings: null, progress: null, words: null, attempts: null, scenes: null };

async function loadState() {
  S.settings = Object.assign({}, DEFAULT_SETTINGS, (await Store.kv.get('settings')) || {});
  S.progress = (await Store.kv.get('progress')) || { letters: {}, garden: [] };
  S.progress.letters = S.progress.letters || {};
  S.progress.garden = S.progress.garden || [];
  S.words = (await Store.kv.get('words')) || [];
  S.attempts = (await Store.kv.get('attempts')) || [];
  S.scenes = (await Store.kv.get('scenes')) || [];
}
const save = name => Store.kv.set(name, S[name]).catch(e => console.warn('save failed', name, e));

/* ---------- Audio ---------- */
const Audio2 = (() => {
  const urlCache = new Map();
  let current = null;

  async function playBlob(key) {
    const blob = await Store.blob.get(key);
    if (!blob) return false;
    let url = urlCache.get(key);
    if (!url || url.blob !== blob) { url = { u: URL.createObjectURL(blob), blob }; urlCache.set(key, url); }
    stop();
    const a = new Audio(url.u);
    current = a;
    await new Promise(res => {
      a.onended = res; a.onerror = res;
      a.play().catch(res);
      setTimeout(res, 8000);
    });
    return true;
  }
  function invalidate(key) { const u = urlCache.get(key); if (u) { URL.revokeObjectURL(u.u); urlCache.delete(key); } }
  function stop() {
    if (current) { try { current.pause(); } catch (e) {} current = null; }
    try { speechSynthesis.cancel(); } catch (e) {}
  }
  return { playBlob, invalidate, stop };
})();

let voice = null;
function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices();
    voice = vs.find(v => /en[-_]US/i.test(v.lang) && /female|google/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang)) || null;
  } catch (e) {}
}
try { speechSynthesis.onvoiceschanged = pickVoice; pickVoice(); } catch (e) {}

function speak(text, rate = 0.9) {
  return new Promise(res => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.rate = rate; u.pitch = 1.1;
      u.onend = res; u.onerror = res;
      speechSynthesis.speak(u);
      setTimeout(res, 1500 + text.length * 120);
    } catch (e) { res(); }
  });
}

/* Clips: each has a storage key and a spoken fallback until a parent recording exists. */
const PHONEMES = {
  s: { tts: 'sss', hint: 'Hiss like a snake. Long and steady, no "uh" after it.' },
  a: { tts: 'a', hint: 'Short a, as in apple. Not "ay".' },
  t: { tts: 't', hint: 'Short and whispered, a quick tap of the tongue. No "tuh".' },
  p: { tts: 'p', hint: 'A little puff of air, whispered. No "puh".' },
  i: { tts: 'ih', hint: 'Short i, as in itch. Not "eye".' },
  n: { tts: 'nnn', hint: 'Hum through your nose. Long and steady, no "uh".' },
};
function promptClips() {
  const c = S.settings.childName, p = S.settings.parentName;
  return {
    hello: { label: 'Greeting on the home screen', tts: `Hi ${c}! Let's play!` },
    find: { label: 'First Sound Hunt: before the sound', tts: 'Find the one that starts with' },
    robot: { label: 'Robot Talk: before the sounds', tts: 'Robot says' },
    robotq: { label: 'Robot Talk: after the sounds', tts: 'What did robot say?' },
    letter: { label: 'Sound Match: before the sound', tts: 'Tap the letter that says' },
    yay1: { label: 'Praise 1', tts: 'Yes! Great listening!' },
    yay2: { label: 'Praise 2', tts: 'You got it!' },
    yay3: { label: 'Praise 3', tts: `Nice job, ${c}!` },
    again: { label: 'Gentle "listen again"', tts: "Let's listen again." },
    write: { label: 'Letter Workshop: "now you try"', tts: 'Now you try!' },
    egg: { label: 'A new egg appears', tts: 'Look! A new egg in your nest!' },
    hatch: { label: 'An egg hatches', tts: 'Your egg is hatching!' },
    done: { label: 'Session is over', tts: `All done for today, ${c}! ${p} is proud of you.` },
  };
}
async function playPhoneme(l) { if (!(await Audio2.playBlob('ph:' + l))) await speak(PHONEMES[l].tts, 0.7); }
async function playPrompt(k) { if (!(await Audio2.playBlob('pr:' + k))) await speak(promptClips()[k].tts); }
async function playWord(word, key) {
  if (key && await Audio2.playBlob(key)) return;
  if (await Audio2.playBlob('w:' + word)) return;
  await speak(word);
}
const praise = () => playPrompt(pick(['yay1', 'yay2', 'yay3']));

/* ---------- Recording ---------- */
/* Tries the microphone directly; if the page isn't allowed to use it, falls back to the
   tablet's own recorder app through a file input. Either way the clip is trimmed of
   leading/trailing silence and stored as WAV, so sounds blend without gaps. */
const Recorder = {
  async micAvailable() {
    try { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder && window.isSecureContext); }
    catch (e) { return false; }
  },
  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true } });
    const rec = new MediaRecorder(stream);
    const chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    rec.start();
    return {
      stop: () => new Promise(res => {
        rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); res(new Blob(chunks, { type: rec.mimeType || 'audio/webm' })); };
        rec.stop();
      }),
    };
  },
  pickFile(accept, capture) {
    return new Promise(res => {
      const inp = h('input', { type: 'file', accept, capture: capture || null, style: 'display:none' });
      inp.onchange = () => { res(inp.files[0] || null); inp.remove(); };
      document.body.append(inp);
      inp.click();
    });
  },
};

async function trimToWav(blob) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    ctx.close && ctx.close();
    const ch = buf.getChannelData(0), sr = buf.sampleRate;
    let peak = 0;
    for (let i = 0; i < ch.length; i++) peak = Math.max(peak, Math.abs(ch[i]));
    if (peak < 0.01) return blob;
    const thr = peak * 0.06, win = Math.floor(sr * 0.01);
    const loud = i => { let m = 0; for (let j = i; j < Math.min(i + win, ch.length); j++) m = Math.max(m, Math.abs(ch[j])); return m > thr; };
    let start = 0, end = ch.length;
    for (let i = 0; i < ch.length; i += win) if (loud(i)) { start = i; break; }
    for (let i = ch.length - win; i > 0; i -= win) if (loud(i)) { end = i + win; break; }
    start = Math.max(0, start - Math.floor(sr * 0.02));
    end = Math.min(ch.length, end + Math.floor(sr * 0.06));
    const gain = Math.min(4, 0.89 / peak);
    const n = end - start, out = new DataView(new ArrayBuffer(44 + n * 2));
    const ws = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
    ws(0, 'RIFF'); out.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ');
    out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
    out.setUint32(24, sr, true); out.setUint32(28, sr * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true);
    ws(36, 'data'); out.setUint32(40, n * 2, true);
    const fadeN = Math.floor(sr * 0.008);
    for (let i = 0; i < n; i++) {
      let v = ch[start + i] * gain;
      if (i < fadeN) v *= i / fadeN;
      if (n - i < fadeN) v *= (n - i) / fadeN;
      out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 32767, true);
    }
    return new Blob([out], { type: 'audio/wav' });
  } catch (e) {
    console.warn('trim failed, keeping original', e);
    return blob;
  }
}

/* Shrinks a photo so storage stays small. */
async function shrinkImage(file, max = 900) {
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const sc = Math.min(1, max / Math.max(img.width, img.height));
    const c = h('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    return await new Promise(res => c.toBlob(b => res(b || file), 'image/jpeg', 0.85));
  } catch (e) { return file; }
}

async function blobURL(key) {
  const b = await Store.blob.get(key);
  return b ? URL.createObjectURL(b) : null;
}

/* ---------- Session timer ---------- */
const Session = {
  started: Date.now(),
  over() { return S.settings.sessionMin > 0 && (Date.now() - this.started) / 60000 >= S.settings.sessionMin; },
  reset() { this.started = Date.now(); },
};

/* ---------- Press-and-hold helper (parent gate) ---------- */
function holdButton(el, ms, onDone) {
  let t = null;
  const start = e => { e.preventDefault(); el.classList.add('holding'); t = setTimeout(() => { el.classList.remove('holding'); onDone(); }, ms); };
  const cancel = () => { clearTimeout(t); el.classList.remove('holding'); };
  el.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => el.addEventListener(ev, cancel));
  return el;
}
