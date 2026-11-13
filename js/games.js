/* Child-facing screens: home, Sound Garden, Letter Workshop, Creatures. */
'use strict';

/* Built-in pictures, grouped by first sound. A parent's own words with photos join these. */
const PICTURES = {
  s: [['sun', '☀️'], ['sock', '🧦'], ['snake', '🐍'], ['seal', '🦭'], ['spoon', '🥄'], ['star', '⭐']],
  a: [['apple', '🍎'], ['ant', '🐜'], ['alligator', '🐊'], ['axe', '🪓']],
  t: [['tiger', '🐅'], ['tent', '⛺'], ['tooth', '🦷'], ['tomato', '🍅'], ['turtle', '🐢'], ['taco', '🌮']],
  p: [['pig', '🐖'], ['pizza', '🍕'], ['pear', '🍐'], ['penguin', '🐧'], ['pumpkin', '🎃']],
  i: [['iguana', '🦎']],
  n: [['nose', '👃'], ['nest', '🪺'], ['nine', '9️⃣'], ['net', '🥅'], ['noodles', '🍜']],
};
/* Words made only from s a t p i n, for Robot Talk. */
const ROBOT_WORDS = [['pan', '🍳'], ['pin', '📌'], ['tap', '🚰'], ['nap', '😴'], ['sip', '🥤'], ['ant', '🐜']];
const FLOWERS = ['🌷', '🌼', '🌻', '🌸', '🍄', '🌱', '🌺', '🪻'];

/* Combines built-in pictures with the parent's photo words. */
async function picturePool() {
  const pool = [];
  for (const [snd, list] of Object.entries(PICTURES)) for (const [w, e] of list) pool.push({ word: w, emoji: e, first: snd });
  for (const w of S.words) {
    if (!w.img || !w.first) continue;
    pool.push({ word: w.text, img: await blobURL(w.img), first: w.first, audio: w.audio });
  }
  return pool;
}
async function robotPool() {
  const pool = ROBOT_WORDS.map(([w, e]) => ({ word: w, emoji: e }));
  for (const w of S.words) {
    if (!w.img) continue;
    const clean = w.text.toLowerCase();
    if (/^[satpin]{2,4}$/.test(clean)) pool.push({ word: w.text, img: await blobURL(w.img), audio: w.audio });
  }
  return pool;
}
function choiceEl(item, onTap) {
  const el = h('button', { class: 'choice', 'aria-label': item.word });
  if (item.img) el.append(h('img', { src: item.img, alt: item.word }));
  else el.textContent = item.emoji;
  el.addEventListener('click', () => onTap(el));
  return el;
}

/* ---------- Shared bits ---------- */
function topbar(title, onBack) {
  return h('div', { class: 'topbar' },
    h('button', { class: 'back', onclick: () => { Audio2.stop(); onBack(); }, 'aria-label': 'Back' }, '⬅'),
    h('h1', {}, title));
}
function gardenStrip() {
  const g = h('div', { class: 'garden' });
  S.progress.garden.forEach((f, i) => g.append(h('span', { class: 'fl' + (f.fresh ? ' new' : ''), style: `left:${f.x}%` }, f.e)));
  S.progress.garden.forEach(f => delete f.fresh);
  return g;
}
function growFlower(gardenEl) {
  const f = { e: pick(FLOWERS), x: Math.round(2 + Math.random() * 92), fresh: true };
  S.progress.garden.push(f);
  if (S.progress.garden.length > 40) S.progress.garden.shift();
  save('progress');
  if (gardenEl) { gardenEl.append(h('span', { class: 'fl new', style: `left:${f.x}%` }, f.e)); delete f.fresh; }
}
async function afterCorrect(next) {
  if (Session.over()) return showDone();
  setTimeout(next, 900);
}
function showDone() {
  const lock = h('button', { class: 'bigbtn' }, '🔒', h('small', {}, `${S.settings.parentName}: hold`));
  const ov = h('div', { class: 'overlay' },
    h('div', { class: 'hero', html: hatchedLetters().length ? spriteSVG(pick(hatchedLetters())) : EGG_SVG(0, 1) }),
    h('h2', {}, 'All done for today!'),
    lock);
  holdButton(lock, 2000, () => { Session.reset(); ov.remove(); go(Home); });
  document.body.append(ov);
  playPrompt('done');
}
const hatchedLetters = () => ORDER.filter(l => letterProg(l).hatched);

/* ---------- Home ---------- */
function Home() {
  const lock = h('button', { class: 'parent-lock', 'aria-label': 'Parent panel (press and hold)' }, '🔒', h('span', { class: 'ring' }));
  holdButton(lock, 2000, () => go(ParentPanel));
  return h('div', { class: 'screen' },
    h('div', { class: 'hello' }, h('button', { class: 'bigbtn', onclick: () => playPrompt('hello') }, '👋', h('small', {}, `Hi ${S.settings.childName}!`))),
    h('div', { class: 'home-grid' },
      h('button', { class: 'zone sg', onclick: () => go(SoundGarden) }, h('span', { class: 'big' }, '🌷'), 'Sound Garden'),
      h('button', { class: 'zone lw', onclick: () => go(LetterWorkshop) }, h('span', { class: 'big' }, '✏️'), 'Letters'),
      h('button', { class: 'zone cr', onclick: () => go(Creatures) }, h('span', { class: 'big' }, '🥚'), 'My Creatures')),
    lock);
}

/* ---------- Sound Garden ---------- */
function SoundGarden() {
  return h('div', { class: 'screen' },
    topbar('Sound Garden', () => go(Home)),
    gardenStrip(),
    h('div', { class: 'menu-grid' },
      h('button', { class: 'menu-card', onclick: () => go(SoundHunt) }, h('span', { class: 'ic' }, '👂'), 'First Sound Hunt'),
      h('button', { class: 'menu-card', onclick: () => go(RobotTalk) }, h('span', { class: 'ic' }, '🤖'), 'Robot Talk')));
}

/* "Find the one that starts with /s/." Sounds only, no letters on screen. */
function SoundHunt() {
  const scr = h('div', { class: 'screen' }, topbar('First Sound Hunt', () => go(SoundGarden)));
  const garden = gardenStrip();
  const area = h('div', { class: 'choices' });
  let target = null;
  const listen = async () => { await playPrompt('find'); await sleep(150); await playPhoneme(target); };
  const row = h('div', { class: 'prompt-row' }, h('button', { class: 'bigbtn go', onclick: listen }, '🔊'));
  scr.append(garden, row, area);

  async function round() {
    const pool = await picturePool();
    const sounds = [...new Set(pool.map(p => p.first))];
    const prev = target;
    target = pick(sounds.length > 1 ? sounds.filter(s => s !== prev) : sounds);
    const right = pick(pool.filter(p => p.first === target));
    const others = shuffle(pool.filter(p => p.first !== target));
    const used = new Set([target]), wrongs = [];
    for (const o of others) { if (!used.has(o.first)) { used.add(o.first); wrongs.push(o); } if (wrongs.length === 2) break; }
    area.innerHTML = '';
    let done = false;
    for (const item of shuffle([right, ...wrongs])) {
      area.append(choiceEl(item, async el => {
        if (done || el.classList.contains('wrong')) return;
        if (item === right) {
          done = true;
          el.classList.add('right');
          await playWord(item.word, item.audio);
          growFlower(garden);
          await praise();
          afterCorrect(round);
        } else {
          el.classList.add('wrong');
          await playWord(item.word, item.audio);
          await playPrompt('again');
          await playPhoneme(target);
        }
      }));
    }
    await sleep(300);
    listen();
  }
  round();
  return scr;
}

/* Oral blending: robot says /p/ /a/ /n/, child picks the pan. */
function RobotTalk() {
  const scr = h('div', { class: 'screen' }, topbar('Robot Talk', () => go(SoundGarden)));
  const garden = gardenStrip();
  const robot = h('div', { class: 'robot' }, '🤖');
  const area = h('div', { class: 'choices' });
  let word = null;
  const say = async () => {
    await playPrompt('robot');
    robot.classList.add('talk');
    for (const ch of word.word.toLowerCase()) { await playPhoneme(ch); await sleep(380); }
    robot.classList.remove('talk');
    await playPrompt('robotq');
  };
  scr.append(garden, robot, h('div', { class: 'prompt-row' }, h('button', { class: 'bigbtn go', onclick: say }, '🔊')), area);

  async function round() {
    const pool = await robotPool();
    const prev = word;
    word = pick(pool.filter(p => !prev || p.word !== prev.word));
    const wrongs = shuffle(pool.filter(p => p.word !== word.word)).slice(0, 2);
    area.innerHTML = '';
    let done = false;
    for (const item of shuffle([word, ...wrongs])) {
      area.append(choiceEl(item, async el => {
        if (done || el.classList.contains('wrong')) return;
        if (item === word) {
          done = true;
          el.classList.add('right');
          await playWord(item.word, item.audio);
          growFlower(garden);
          await praise();
          afterCorrect(round);
        } else {
          el.classList.add('wrong');
          await playWord(item.word, item.audio);
          await playPrompt('again');
          await say();
        }
      }));
    }
    await sleep(300);
    say();
  }
  round();
  return scr;
}

/* ---------- Letter Workshop ---------- */
function LetterWorkshop() {
  const grid = h('div', { class: 'letter-grid' });
  for (const l of ORDER) {
    const open = S.settings.unlocked.includes(l);
    const stars = Math.min(3, letterProg(l).stars || 0);
    grid.append(h('button', {
      class: 'letter-card' + (open ? '' : ' locked'), html: letterSVG(l),
      onclick: () => open ? go(() => LetterPage(l)) : toast(`${S.settings.parentName} will open this one soon!`),
    }, h('div', { class: 'stars' }, open ? '⭐'.repeat(stars) : '🔒')));
  }
  return h('div', { class: 'screen' },
    topbar('Letters', () => go(Home)),
    h('div', { class: 'menu-grid' },
      h('button', { class: 'menu-card', onclick: () => go(SoundMatch) }, h('span', { class: 'ic' }, '🔤'), 'Sound Match')),
    grid);
}

function LetterPage(l) {
  const L = LETTERS[l];
  const model = h('div', { class: 'tile-letter', html: letterSVG(l, { lines: true }) });
  const watch = async () => { await animateLetter(model, l); };
  const box = h('div', { class: 'draw-box' });
  const bg = h('canvas'), ink = h('canvas');
  box.append(bg, ink);
  const pad = makePad(box, bg, ink, l);
  const forDad = h('div', { class: 'draw-tools' });

  const done = async () => {
    if (!pad.hasInk()) return;
    const png = await pad.snapshot();
    const id = uid();
    await Store.blob.set('att:' + id, png);
    const att = { id, letter: l, date: today(), status: 'pending' };
    S.attempts.unshift(att); S.attempts = S.attempts.slice(0, 120); save('attempts');
    forDad.innerHTML = '';
    forDad.append(
      h('button', { class: 'bigbtn go', onclick: async () => { judge(att, 'good'); forDad.innerHTML = ''; pad.clear(); await praise(); } }, '👍', h('small', {}, S.settings.parentName)),
      h('button', { class: 'bigbtn', onclick: () => { judge(att, 'again'); forDad.innerHTML = ''; pad.clear(); playPrompt('write'); } }, '🔁', h('small', {}, 'Again')),
      h('button', { class: 'bigbtn', onclick: () => { forDad.innerHTML = ''; pad.clear(); toast('Saved for later'); } }, '⏳'));
  };

  const scr = h('div', { class: 'screen' },
    topbar('', () => go(LetterWorkshop)),
    h('div', { class: 'lw-stage' },
      h('div', { class: 'model-box' }, model,
        h('div', { class: 'draw-tools' },
          h('button', { class: 'bigbtn go', onclick: () => playPhoneme(l), 'aria-label': 'Hear the sound' }, '🔊'),
          h('button', { class: 'bigbtn blue', onclick: watch, 'aria-label': 'Watch' }, '▶'))),
      h('div', { style: 'display:flex;flex-direction:column;gap:14px' }, box,
        h('div', { class: 'draw-tools' },
          h('button', { class: 'bigbtn', onclick: () => pad.clear(), 'aria-label': 'Clear' }, '🧽'),
          h('button', { class: 'bigbtn go', onclick: done, 'aria-label': 'Done' }, '✅')),
        forDad)));
  setTimeout(async () => { pad.layout(); await playPhoneme(l); await watch(); await playPrompt('write'); }, 200);
  return scr;
}
function judge(att, status) {
  att.status = status;
  if (status === 'good') { const p = letterProg(att.letter); p.stars = (p.stars || 0) + 1; save('progress'); }
  save('attempts');
}

/* Writing pad: guide lines in the 100x120 letter box, smooth ink, stylus-first palm rejection. */
function makePad(box, bg, ink, l) {
  let k = 1, ox = 0, oy = 0, dpr = 1, penSeen = false, strokes = [], cur = null;
  const ctx = ink.getContext('2d'), bctx = bg.getContext('2d');
  function layout() {
    const r = box.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    for (const c of [bg, ink]) { c.width = r.width * dpr; c.height = r.height * dpr; }
    k = Math.min(r.width / 100, r.height / 124); ox = (r.width - 100 * k) / 2; oy = (r.height - 120 * k) / 2;
    drawGuides(); redraw();
  }
  function drawGuides() {
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.clearRect(0, 0, bg.width, bg.height);
    const W = bg.width / dpr;
    const line = (y, color, w, dash) => { bctx.beginPath(); bctx.setLineDash(dash); bctx.strokeStyle = color; bctx.lineWidth = w; bctx.moveTo(10, oy + y * k); bctx.lineTo(W - 10, oy + y * k); bctx.stroke(); };
    line(10, '#d9cdb4', 1.5, [4, 6]); line(45, '#b9c9e0', 2, [10, 8]); line(85, '#8aa6c8', 3, []); line(115, '#d9cdb4', 1.5, [4, 6]);
    bctx.setLineDash([]);
    if (S.settings.ghost) {
      bctx.save(); bctx.translate(ox, oy); bctx.scale(k, k);
      bctx.strokeStyle = '#ece4d4'; bctx.lineCap = 'round'; bctx.lineJoin = 'round';
      LETTERS[l].strokes.forEach((d, i) => { bctx.lineWidth = LETTERS[l].dot === i ? 13 : 9; bctx.stroke(new Path2D(d)); });
      bctx.restore();
    }
  }
  function redraw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, ink.width, ink.height);
    ctx.strokeStyle = '#3b3226'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 8 * k;
    for (const s of strokes) drawStroke(s);
  }
  function drawStroke(s) {
    if (s.length === 1) { ctx.beginPath(); ctx.arc(s[0][0], s[0][1], 4 * k, 0, 7); ctx.fillStyle = '#3b3226'; ctx.fill(); return; }
    ctx.beginPath(); ctx.moveTo(s[0][0], s[0][1]);
    for (let i = 1; i < s.length - 1; i++) { const mx = (s[i][0] + s[i + 1][0]) / 2, my = (s[i][1] + s[i + 1][1]) / 2; ctx.quadraticCurveTo(s[i][0], s[i][1], mx, my); }
    const last = s[s.length - 1]; ctx.lineTo(last[0], last[1]); ctx.stroke();
  }
  const pos = e => { const r = ink.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  ink.addEventListener('pointerdown', e => {
    if (e.pointerType === 'pen') penSeen = true;
    if (penSeen && e.pointerType === 'touch') return;
    ink.setPointerCapture(e.pointerId);
    cur = [pos(e)]; strokes.push(cur); redraw();
  });
  ink.addEventListener('pointermove', e => {
    if (!cur) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of evs) cur.push(pos(ev));
    redraw();
  });
  const end = () => { cur = null; };
  ink.addEventListener('pointerup', end); ink.addEventListener('pointercancel', end);
  window.addEventListener('resize', () => { if (box.isConnected) { strokes = []; layout(); } });
  return {
    layout,
    clear() { strokes = []; redraw(); },
    hasInk: () => strokes.length > 0,
    snapshot() {
      const c = h('canvas'); c.width = ink.width; c.height = ink.height;
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(bg, 0, 0); x.drawImage(ink, 0, 0);
      const s = Math.min(1, 480 / c.width), out = h('canvas'); out.width = c.width * s; out.height = c.height * s;
      out.getContext('2d').drawImage(c, 0, 0, out.width, out.height);
      return new Promise(res => out.toBlob(res, 'image/png'));
    },
  };
}

/* "Tap the letter that says /t/." This is what grows eggs and hatches creatures. */
function SoundMatch() {
  const scr = h('div', { class: 'screen' }, topbar('Sound Match', () => go(LetterWorkshop)));
  const area = h('div', { class: 'choices' });
  let target = null;
  const listen = async () => { await playPrompt('letter'); await sleep(150); await playPhoneme(target); };
  scr.append(h('div', { class: 'prompt-row' }, h('button', { class: 'bigbtn go', onclick: listen }, '🔊')), area);
  const open = S.settings.unlocked.filter(l => ORDER.includes(l));
  if (open.length < 2) {
    area.append(h('div', { class: 'hello' }, `${S.settings.parentName} needs to open at least two letters first.`));
    return scr;
  }
  async function round() {
    // Letters still working toward hatching come up more often.
    const weights = open.map(l => (letterProg(l).hatched ? 1 : 3) + (l === target ? -0.9 : 0));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    target = open[weights.findIndex(w => (r -= w) < 0)] || open[0];
    const opts = shuffle([target, ...shuffle(open.filter(l => l !== target)).slice(0, 2)]);
    area.innerHTML = '';
    let first = true, done = false;
    for (const l of opts) {
      const el = h('button', { class: 'choice', html: letterSVG(l), 'aria-label': l });
      el.firstElementChild.style.width = '70%';
      el.addEventListener('click', async () => {
        if (done || el.classList.contains('wrong')) return;
        const correct = l === target;
        const events = first ? recordLetterAnswer(target, correct) : [];
        first = false;
        if (correct) {
          done = true;
          el.classList.add('right');
          await playPhoneme(target);
          await praise();
          if (events.includes('hatch')) await showHatch(target);
          else if (events.includes('egg')) await showEgg(target);
          afterCorrect(round);
        } else {
          el.classList.add('wrong');
          await playPhoneme(l);
          await playPrompt('again');
          await playPhoneme(target);
        }
      });
      area.append(el);
    }
    await sleep(300);
    listen();
  }
  round();
  return scr;
}

function overlayWait(ov) {
  return new Promise(res => {
    ov.append(h('button', { class: 'bigbtn go', onclick: () => { ov.remove(); res(); } }, '✔'));
    document.body.append(ov);
  });
}
async function showEgg(l) {
  const hero = h('div', { class: 'hero', html: EGG_SVG(0, 1) });
  const ov = h('div', { class: 'overlay' }, hero, h('h2', {}, 'A new egg!'));
  const p = overlayWait(ov);
  hero.querySelector('.anim').classList.add('egg-shake');
  playPrompt('egg');
  return p;
}
async function showHatch(l) {
  const hero = h('div', { class: 'hero', html: EGG_SVG(3, 3) });
  const title = h('h2', {}, '…');
  const ov = h('div', { class: 'overlay' }, hero, title);
  document.body.append(ov);
  hero.querySelector('.anim').classList.add('egg-shake');
  await playPrompt('hatch');
  await sleep(800);
  hero.innerHTML = spriteSVG(l);
  title.textContent = spriteName(l) + '!';
  poke(hero, l);
  ov.remove();
  return overlayWait(ov);
}

/* ---------- Creatures ---------- */
function Creatures() {
  const nest = h('div', { class: 'nest' });
  for (const l of ORDER) {
    const st = eggStage(l);
    if (st === 'hatched') {
      const c = h('button', { class: 'critter', html: spriteSVG(l) }, spriteName(l));
      c.addEventListener('click', () => poke(c, l));
      nest.append(c);
    } else if (st > 0 || letterProg(l).egg) {
      const c = h('button', { class: 'critter', html: EGG_SVG(st, S.settings.hatchDays) },
        h('div', { class: 'cracks' }, '●'.repeat(st) + '○'.repeat(Math.max(0, S.settings.hatchDays - st))));
      c.addEventListener('click', () => { const a = c.querySelector('.anim'); a.classList.remove('egg-shake'); void a.getBoundingClientRect(); a.classList.add('egg-shake'); });
      nest.append(c);
    } else {
      nest.append(h('div', { class: 'critter empty', html: EGG_SVG(0, 1) }, '?'));
    }
  }
  const hasAny = hatchedLetters().length > 0;
  return h('div', { class: 'screen' },
    topbar('My Creatures', () => go(Home)),
    nest,
    h('div', { class: 'menu-grid' },
      hasAny && h('button', { class: 'menu-card', onclick: () => go(() => SceneMaker()) }, h('span', { class: 'ic' }, '🖼️'), 'Make a picture'),
      S.scenes.length > 0 && h('button', { class: 'menu-card', onclick: () => go(Gallery) }, h('span', { class: 'ic' }, '📚'), 'My pictures')));
}

function sceneMarkup(scene, { animate = false, selected = -1 } = {}) {
  const items = scene.items.map((it, i) => {
    const k = it.s / 100, sx = it.flip ? -k : k;
    const inner = SPRITES[it.l].svg.replace('BODY', animate ? SPRITES[it.l].idle : '');
    const sel = i === selected ? `<rect x="-4" y="-4" width="108" height="108" rx="12" fill="none" stroke="#e69138" stroke-width="${3 / k}" stroke-dasharray="${8 / k} ${6 / k}"/>` : '';
    return `<g data-i="${i}" transform="translate(${it.x} ${it.y}) scale(${sx} ${k}) translate(-50 -50)">${sel}<rect width="100" height="100" fill="transparent"/>${inner}</g>`;
  }).join('');
  return `<svg class="scene" viewBox="0 0 1000 625" xmlns="http://www.w3.org/2000/svg">${BACKDROPS[scene.bg].svg}${items}</svg>`;
}

function SceneMaker(existing) {
  const scene = existing ? JSON.parse(JSON.stringify(existing)) : { id: uid(), bg: 'meadow', items: [] };
  let sel = -1;
  const wrap = h('div', { class: 'scene-wrap' });
  const tools = h('div', { class: 'draw-tools' });
  const render = () => {
    wrap.innerHTML = sceneMarkup(scene, { animate: true, selected: sel });
    tools.innerHTML = '';
    if (sel >= 0) {
      const it = scene.items[sel];
      tools.append(
        h('button', { class: 'bigbtn', onclick: () => { it.s = Math.max(80, it.s / 1.2); render(); } }, '➖'),
        h('button', { class: 'bigbtn', onclick: () => { it.s = Math.min(600, it.s * 1.2); render(); } }, '➕'),
        h('button', { class: 'bigbtn', onclick: () => { it.flip = !it.flip; render(); } }, '↔'),
        h('button', { class: 'bigbtn', onclick: () => { scene.items.splice(sel, 1); sel = -1; render(); } }, '🗑'));
    }
  };
  // Dragging creatures around the picture.
  let drag = null;
  wrap.addEventListener('pointerdown', e => {
    const g = e.target.closest('g[data-i]');
    const svg = wrap.firstElementChild;
    if (!g) { sel = -1; render(); return; }
    sel = +g.dataset.i;
    const pt = svgPoint(svg, e), it = scene.items[sel];
    drag = { dx: it.x - pt.x, dy: it.y - pt.y, moved: false };
    wrap.setPointerCapture(e.pointerId);
    render();
  });
  wrap.addEventListener('pointermove', e => {
    if (!drag || sel < 0) return;
    const pt = svgPoint(wrap.firstElementChild, e), it = scene.items[sel];
    it.x = Math.max(0, Math.min(1000, pt.x + drag.dx)); it.y = Math.max(0, Math.min(625, pt.y + drag.dy));
    drag.moved = true;
    const g = wrap.querySelector(`g[data-i="${sel}"]`);
    const k = it.s / 100;
    g.setAttribute('transform', `translate(${it.x} ${it.y}) scale(${it.flip ? -k : k} ${k}) translate(-50 -50)`);
  });
  wrap.addEventListener('pointerup', () => {
    if (drag && !drag.moved && sel >= 0) { const g = wrap.querySelector(`g[data-i="${sel}"]`); poke(g, scene.items[sel].l); }
    drag = null;
  });

  const tray = h('div', { class: 'tray' });
  for (const l of hatchedLetters()) {
    tray.append(h('button', { html: spriteSVG(l, { animate: false }), onclick: () => {
      scene.items.push({ l, x: 300 + Math.random() * 400, y: 380 + Math.random() * 100, s: 220, flip: false });
      sel = scene.items.length - 1; render(); playWord(spriteName(l), 'sp:' + l);
    } }));
  }
  const bgs = h('div', { class: 'draw-tools' }, ...Object.entries(BACKDROPS).map(([k, b]) =>
    h('button', { class: 'pbtn', style: 'font-size:20px;padding:12px 18px', onclick: () => { scene.bg = k; render(); } }, b.name)));

  const saveIt = async () => {
    const png = await rasterize(sceneMarkup(scene));
    if (png) await Store.blob.set('scene:' + scene.id, png);
    const i = S.scenes.findIndex(s => s.id === scene.id);
    const rec = { id: scene.id, bg: scene.bg, items: scene.items, date: today() };
    if (i >= 0) S.scenes[i] = rec; else S.scenes.unshift(rec);
    save('scenes');
    await praise();
    go(Gallery);
  };
  render();
  return h('div', { class: 'screen' },
    topbar('Make a picture', () => go(Creatures)),
    bgs, wrap, tools, tray,
    h('div', { class: 'draw-tools' }, h('button', { class: 'bigbtn go', onclick: saveIt }, '💾')));
}
function svgPoint(svg, e) {
  const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}
async function rasterize(markup) {
  try {
    const blob = new Blob([markup.replace('class="scene"', 'width="1000" height="625"')], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const c = h('canvas'); c.width = 1000; c.height = 625;
    c.getContext('2d').drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    return await new Promise(res => c.toBlob(res, 'image/png'));
  } catch (e) { console.warn('rasterize failed', e); return null; }
}

function Gallery() {
  const g = h('div', { class: 'gallery' });
  (async () => {
    for (const sc of S.scenes) {
      const url = await blobURL('scene:' + sc.id);
      const b = h('button', { onclick: () => go(() => SceneMaker(sc)) });
      b.append(url ? h('img', { src: url, alt: 'picture' }) : h('div', { html: sceneMarkup(sc) }));
      g.append(b);
    }
  })();
  return h('div', { class: 'screen' }, topbar('My pictures', () => go(Creatures)), g);
}
