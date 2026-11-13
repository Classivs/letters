/* Parent panel: recordings, words and photos, letters, writing review, progress, settings, backup. */
'use strict';

let parentTab = 'voice';
function ParentPanel() {
  const tabs = [['voice', '🎙 Voice'], ['words', '🖼 Words'], ['letters', '🔤 Letters'], ['writing', '✏️ Writing'], ['progress', '🥚 Progress'], ['settings', '⚙️ Settings']];
  const body = h('div', { style: 'display:flex;flex-direction:column;gap:16px' });
  const bar = h('div', { class: 'tabs' });
  const show = t => {
    parentTab = t;
    [...bar.children].forEach(b => b.classList.toggle('on', b.dataset.t === t));
    body.innerHTML = '';
    ({ voice: VoiceTab, words: WordsTab, letters: LettersTab, writing: WritingTab, progress: ProgressTab, settings: SettingsTab })[t](body);
  };
  tabs.forEach(([t, label]) => bar.append(h('button', { 'data-t': t, onclick: () => show(t) }, label)));
  const scr = h('div', { class: 'screen parent' }, topbar('Parent panel', () => go(Home)), bar, body);
  show(parentTab);
  return scr;
}

/* One recordable clip: play, record/stop, delete. */
function recRow(key, title, sub, fallback) {
  const row = h('div', { class: 'row' });
  const draw = async () => {
    const has = !!(await Store.blob.get(key));
    row.innerHTML = '';
    const recBtn = h('button', { class: 'pbtn rec' }, '● Record');
    recBtn.addEventListener('click', () => record(key, recBtn, draw));
    row.append(...[
      h('div', { class: 'lbl' }, h('b', {}, title), sub && h('small', {}, sub)),
      h('span', { class: 'badge ' + (has ? 'yes' : 'no') }, has ? 'your voice' : 'robot voice'),
      h('button', { class: 'pbtn', onclick: async () => { if (!(await Audio2.playBlob(key))) await fallback(); } }, '▶ Play'),
      recBtn,
      has && h('button', { class: 'pbtn', onclick: async () => { await Store.blob.del(key); Audio2.invalidate(key); draw(); } }, '🗑')].filter(Boolean));
  };
  draw();
  return row;
}
let activeRec = null;
async function record(key, btn, after) {
  if (activeRec) {
    const blob = await activeRec.stop(); activeRec = null;
    btn.classList.remove('live'); btn.textContent = '…';
    await storeClip(key, blob); after();
    return;
  }
  if (await Recorder.micAvailable()) {
    try {
      activeRec = await Recorder.start();
      btn.classList.add('live'); btn.textContent = '■ Stop';
      return;
    } catch (e) { console.warn('mic refused, using recorder app', e); }
  }
  const file = await Recorder.pickFile('audio/*', 'user');
  if (file) { await storeClip(key, file); after(); }
}
async function storeClip(key, blob) {
  const wav = await trimToWav(blob);
  await Store.blob.set(key, wav);
  Audio2.invalidate(key);
  toast('Saved');
  Audio2.playBlob(key);
}

function panel(title, note, ...kids) {
  return h('div', { class: 'panel' }, h('h2', {}, title), note && h('p', { class: 'note' }, note), ...kids);
}

function VoiceTab(body) {
  body.append(panel('Letter sounds',
    'Record these first; they matter most. Say the pure sound with no "uh" after it. The app trims the silence at the start and end automatically.',
    ...ORDER.map(l => recRow('ph:' + l, `/${l}/`, PHONEMES[l].hint, () => speak(PHONEMES[l].tts, 0.7)))));
  const P = promptClips();
  body.append(panel('Things the app says', 'Until you record them, the tablet\'s built-in voice says the words shown.',
    ...Object.entries(P).map(([k, v]) => recRow('pr:' + k, v.label, `"${v.tts}"`, () => speak(v.tts)))));
  body.append(panel('Creature names', 'Each creature says its name when tapped. You can rename them in the Settings tab.',
    ...ORDER.map(l => recRow('sp:' + l, spriteName(l), `Creature for /${l}/`, () => speak(spriteName(l))))));
  const pics = [];
  for (const list of Object.values(PICTURES)) pics.push(...list);
  pics.push(...ROBOT_WORDS.filter(([w]) => !pics.some(p => p[0] === w)));
  body.append(panel('Picture names', 'Optional: the names of the built-in pictures.',
    ...pics.map(([w, e]) => recRow('w:' + w, `${e} ${w}`, null, () => speak(w)))));
}

function WordsTab(body) {
  const text = h('input', { type: 'text', placeholder: 'Word, e.g. pat or Grandpa' });
  let photo = null;
  const photoBtn = h('button', { class: 'pbtn' }, '📷 Add photo');
  photoBtn.addEventListener('click', async () => {
    const f = await Recorder.pickFile('image/*');
    if (f) { photo = await shrinkImage(f); photoBtn.textContent = '📷 Photo added ✓'; }
  });
  const add = h('button', { class: 'pbtn pri' }, 'Add word');
  add.addEventListener('click', async () => {
    const t = text.value.trim();
    if (!t) return;
    const w = { id: uid(), text: t, first: autoFirst(t), img: null, audio: null, added: today() };
    if (photo) { w.img = 'img:' + w.id; await Store.blob.set(w.img, photo); }
    S.words.unshift(w); save('words');
    text.value = ''; photo = null; photoBtn.textContent = '📷 Add photo';
    list.prepend(wordRow(w));
    countEl.textContent = `Your words (${S.words.length})`;
  });
  const list = h('div');
  S.words.forEach(w => list.append(wordRow(w)));
  body.append(panel('Add a word',
    'Words with a photo show up in First Sound Hunt (if you set a first sound). Words made only from s a t p i n with a photo also join Robot Talk. "Readable" means every letter in it is open in the Letters tab, so it\'ll be ready for reading games later.',
    h('div', { class: 'row' }, h('div', { class: 'field', style: 'flex:1' }, text), photoBtn, add)));
  const wp = panel(`Your words (${S.words.length})`, null, list);
  const countEl = wp.querySelector('h2');
  body.append(wp);
}
function autoFirst(t) {
  const w = t.toLowerCase();
  if (/^(sh|ch|th|ph|wh)/.test(w)) return null;
  return ORDER.includes(w[0]) ? w[0] : null;
}
function wordRow(w) {
  const row = h('div', { class: 'row' });
  const thumb = h('div', { class: 'thumb' }, '—');
  if (w.img) blobURL(w.img).then(u => { if (u) { thumb.replaceWith(h('img', { class: 'thumb', src: u })); } });
  const miss = missingLetters(w.text);
  const firstSel = h('select', {}, h('option', { value: '' }, 'no first sound'), ...ORDER.map(l => h('option', { value: l }, `starts with /${l}/`)));
  firstSel.value = w.first || '';
  firstSel.addEventListener('change', () => { w.first = firstSel.value || null; save('words'); });
  const key = 'uw:' + w.id;
  const recBtn = h('button', { class: 'pbtn rec' }, '● Record');
  const playBtn = h('button', { class: 'pbtn', onclick: () => playWord(w.text, w.audio) }, '▶');
  recBtn.addEventListener('click', () => record(key, recBtn, () => { w.audio = key; save('words'); recBtn.textContent = '● Re-record'; }));
  if (w.audio) recBtn.textContent = '● Re-record';
  const delBtn = h('button', { class: 'pbtn' }, '🗑');
  delBtn.addEventListener('click', async () => {
    if (delBtn.dataset.armed !== '1') { delBtn.dataset.armed = '1'; delBtn.textContent = 'Delete?'; setTimeout(() => { delBtn.dataset.armed = ''; delBtn.textContent = '🗑'; }, 3000); return; }
    S.words = S.words.filter(x => x !== w); save('words');
    if (w.img) Store.blob.del(w.img); if (w.audio) Store.blob.del(w.audio);
    row.remove();
  });
  row.append(thumb,
    h('div', { class: 'lbl' }, h('b', {}, w.text),
      h('small', {}, h('span', { class: 'badge ' + (miss.length ? 'no' : 'yes') }, miss.length ? 'needs ' + miss.join(', ') : 'readable now'))),
    firstSel, playBtn, recBtn, delBtn);
  return row;
}

function LettersTab(body) {
  const chk = h('div', { class: 'chk' });
  for (const l of ORDER) {
    const box = h('input', { type: 'checkbox' });
    box.checked = S.settings.unlocked.includes(l);
    box.addEventListener('change', () => {
      const set = new Set(S.settings.unlocked);
      box.checked ? set.add(l) : set.delete(l);
      S.settings.unlocked = ORDER.filter(x => set.has(x));
      save('settings');
    });
    chk.append(h('label', {}, box, l));
  }
  body.append(panel('Open letters',
    'Open letters appear in the Letters screen and in Sound Match. Sound Garden always uses all six sounds, since it\'s listening only. A common pace is a new letter every few days, once he\'s confident with the ones already open. More letters (m, d, g, o, c, k …) come in a later version.',
    chk));
  const g = h('div', { class: 'letter-grid' });
  ORDER.forEach(l => {
    const card = h('button', { class: 'letter-card' });
    card.innerHTML = letterSVG(l, { lines: true });
    card.append(h('small', {}, LETTERS[l].say));
    card.addEventListener('click', () => animateLetter(card, l).then(() => card.append(h('small', {}, LETTERS[l].say))));
    g.append(card);
  });
  body.append(panel('Letter shapes', 'Tap to watch the stroke order. Each letter starts at the numbered dot.', g));
}

function WritingTab(body) {
  const grid = h('div', { class: 'attempts' });
  if (!S.attempts.length) grid.append(h('p', { class: 'note' }, 'Nothing yet. When he taps ✅ in Letters, his writing appears here.'));
  for (const a of S.attempts) {
    const card = h('div', { class: 'attempt' });
    blobURL('att:' + a.id).then(u => u && card.prepend(h('img', { src: u })));
    const status = h('small', {}, `${a.letter} · ${a.date} · ${({ pending: 'waiting for you', good: '👍 good', again: '🔁 again' })[a.status]}`);
    card.append(status, h('div', { class: 'acts' },
      h('button', { class: 'pbtn ok', onclick: () => { if (a.status !== 'good') judge(a, 'good'); go(ParentPanel); } }, '👍'),
      h('button', { class: 'pbtn', onclick: () => { a.status = 'again'; save('attempts'); go(ParentPanel); } }, '🔁'),
      h('button', { class: 'pbtn', onclick: async () => { S.attempts = S.attempts.filter(x => x !== a); save('attempts'); await Store.blob.del('att:' + a.id); go(ParentPanel); } }, '🗑')));
    grid.append(card);
  }
  body.append(panel('His writing', 'Each 👍 adds a star to that letter (up to 3 show). Stars are only for writing; they don\'t affect the eggs.',
    h('div', { class: 'row' }, h('div', { class: 'lbl' }, h('b', {}, 'Faint guide letter under the writing pad'), h('small', {}, 'Off = writing from memory (better). On = tracing help for the first tries.')),
      toggle(S.settings.ghost, v => { S.settings.ghost = v; save('settings'); })),
    grid));
}
function toggle(val, onChange) {
  const b = h('input', { type: 'checkbox' }); b.checked = val;
  b.addEventListener('change', () => onChange(b.checked));
  return b;
}

function ProgressTab(body) {
  const rows = ORDER.map(l => {
    const p = letterProg(l), g = goodDays(l);
    const st = eggStage(l);
    const resetBtn = h('button', { class: 'pbtn' }, 'Reset');
    resetBtn.addEventListener('click', () => {
      if (resetBtn.dataset.armed !== '1') { resetBtn.dataset.armed = '1'; resetBtn.textContent = 'Tap again'; return; }
      delete S.progress.letters[l]; save('progress'); go(ParentPanel);
    });
    return h('div', { class: 'row' },
      h('div', { class: 'thumb', html: letterSVG(l) }),
      h('div', { class: 'lbl' },
        h('b', {}, st === 'hatched' ? `${spriteName(l)} hatched ${p.hatched}` : p.egg ? `Egg since ${p.egg}` : 'No egg yet'),
        h('small', {}, `${p.correct} correct total · good days: ${g.length ? g.join(', ') : 'none yet'} · writing stars: ${p.stars || 0}`)),
      resetBtn);
  });
  body.append(panel('Eggs and creatures',
    `An egg appears after ${S.settings.eggAfter} correct Sound Match answers. A day counts as "good" when his first ${S.settings.checksPerDay} answers for that letter that day are all right. The egg hatches after ${S.settings.hatchDays} good days spread over at least ${S.settings.hatchSpan} days, so it shows the sound stuck rather than a lucky guess. Change these in Settings.`,
    ...rows));
}

function SettingsTab(body) {
  const field = (label, key, type = 'text', note) => {
    const inp = h('input', { type, value: S.settings[key] });
    inp.addEventListener('change', () => { S.settings[key] = type === 'number' ? Math.max(0, +inp.value || 0) : inp.value.trim(); save('settings'); });
    return h('div', { class: 'row' }, h('div', { class: 'lbl' }, h('b', {}, label), note && h('small', {}, note)), h('div', { class: 'field' }, inp));
  };
  body.append(panel('Names', null,
    field("Child's name", 'childName'), field('What he calls you', 'parentName'),
    ...ORDER.map(l => {
      const inp = h('input', { type: 'text', value: spriteName(l) });
      inp.addEventListener('change', () => { S.settings.spriteNames[l] = inp.value.trim() || SPRITES[l].name; save('settings'); });
      return h('div', { class: 'row' }, h('div', { class: 'lbl', html: `<b>Creature for /${l}/</b>` }), h('div', { class: 'thumb', html: spriteSVG(l, { animate: false }) }), h('div', { class: 'field' }, inp));
    })));
  body.append(panel('Session and eggs', null,
    field('Session length (minutes)', 'sessionMin', 'number', 'After this, the next finished question shows "All done". 0 = no limit.'),
    field('Correct answers before an egg', 'eggAfter', 'number'),
    field('Checks per day', 'checksPerDay', 'number', 'His first N answers for a letter each day must all be right for the day to count.'),
    field('Good days to hatch', 'hatchDays', 'number'),
    field('Minimum spread (days)', 'hatchSpan', 'number', 'Days between the first and last good day.')));

  const status = h('p', { class: 'note' }, Store.persistent
    ? 'Everything is saved in this browser on this tablet. Clearing the browser\'s data, or uninstalling, erases it, so make a backup now and then.'
    : 'Warning: this browser isn\'t allowing storage here, so nothing will be kept after closing. Use the installed version.');
  const exp = h('button', { class: 'pbtn pri' }, '⬇ Make backup file');
  exp.addEventListener('click', exportBackup);
  const imp = h('button', { class: 'pbtn' }, '⬆ Restore from backup');
  imp.addEventListener('click', importBackup);
  body.append(panel('Backup', null, status, h('div', { class: 'row' }, exp, imp)));
}

async function exportBackup() {
  try {
    const data = { app: 'g-letters', version: 1, made: new Date().toISOString(), kv: {}, blobs: {} };
    for (const k of ['settings', 'progress', 'words', 'attempts', 'scenes']) data.kv[k] = S[k];
    for (const key of await Store.blob.keys()) {
      const b = await Store.blob.get(key);
      data.blobs[key] = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
    }
    const file = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(file), download: `letters-backup-${today()}.json` });
    document.body.append(a); a.click(); a.remove();
    if (window.self !== window.top) toast('Backups may be blocked in the preview. Use the installed app.', 4000);
  } catch (e) { toast('Backup failed: ' + e.message, 4000); }
}
async function importBackup() {
  const f = await Recorder.pickFile('application/json,.json');
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (data.app !== 'g-letters') throw new Error('not a backup from this app');
    for (const [key, url] of Object.entries(data.blobs)) await Store.blob.set(key, await (await fetch(url)).blob());
    for (const [k, v] of Object.entries(data.kv)) await Store.kv.set(k, v);
    await loadState();
    toast('Restored');
    go(ParentPanel);
  } catch (e) { toast('Restore failed: ' + e.message, 4000); }
}
