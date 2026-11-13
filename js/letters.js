/* Letter shapes (stroke order), letter rendering, and the multi-day mastery rule. */
'use strict';

/* Coordinates are in a 100 x 120 box:
   y=10 top line (tall letters), y=45 middle line, y=85 baseline, y=115 tail line.
   Each stroke is drawn in order; the first point of each stroke is its start dot. */
const ORDER = ['s', 'a', 't', 'p', 'i', 'n'];
const LETTERS = {
  s: { strokes: ['M64 51 C58 43 41 43 38 52 C35 61 47 63 53 65 C63 68 67 76 61 82 C54 89 39 87 34 79'],
       say: 'Start at the top, curve back, curve around, and swoop.' },
  a: { strokes: ['M63 53 C57 43 39 44 37 63 C35 82 55 89 63 71', 'M64 46 L64 85'],
       say: 'Around like a c, then up and down.' },
  t: { strokes: ['M50 20 L50 78 C50 86 57 88 63 83', 'M37 45 L63 45'],
       say: 'Down from the top, then cross it.' },
  p: { strokes: ['M38 45 L38 113', 'M38 57 C45 43 66 44 66 65 C66 86 46 88 38 74'],
       say: 'Down past the line, back up, and around.' },
  i: { strokes: ['M50 45 L50 85', 'M50 29 L50 30'], dot: 1,
       say: 'Down, then a dot on top.' },
  n: { strokes: ['M38 45 L38 85', 'M38 60 C42 46 64 42 64 58 L64 85'],
       say: 'Down, back up, over the hill and down.' },
};

function guideLines(w = 100) {
  return `<line x1="2" y1="10" x2="${w - 2}" y2="10" stroke="#d9cdb4" stroke-width="1" stroke-dasharray="2 3"/>
    <line x1="2" y1="45" x2="${w - 2}" y2="45" stroke="#b9c9e0" stroke-width="1.2" stroke-dasharray="5 4"/>
    <line x1="2" y1="85" x2="${w - 2}" y2="85" stroke="#8aa6c8" stroke-width="1.6"/>
    <line x1="2" y1="115" x2="${w - 2}" y2="115" stroke="#d9cdb4" stroke-width="1" stroke-dasharray="2 3"/>`;
}

/* Static letter as SVG markup. */
function letterSVG(l, { lines = false, color = '#3b3226', width = 9 } = {}) {
  const L = LETTERS[l];
  const paths = L.strokes.map((d, i) =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${L.dot === i ? width * 1.5 : width}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  return `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">${lines ? guideLines() : ''}${paths}</svg>`;
}

/* Animated stroke-order demo: draws each stroke with a moving pen, start dots and numbers. */
async function animateLetter(container, l, { speed = 1 } = {}) {
  const L = LETTERS[l];
  container.innerHTML = `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">${guideLines()}
    <g class="ghost">${L.strokes.map((d, i) => `<path d="${d}" fill="none" stroke="#eee5d3" stroke-width="${L.dot === i ? 13 : 9}" stroke-linecap="round"/>`).join('')}</g>
    <g class="ink"></g><g class="marks"></g><circle class="pen" r="3.5" fill="#cc5a4a" opacity="0"/></svg>`;
  const svg = container.firstElementChild, ink = $('.ink', svg), marks = $('.marks', svg), pen = $('.pen', svg);
  const token = Symbol(); container._anim = token;
  const colors = ['#4f8fc0', '#e69138', '#6aa84f'];
  for (let i = 0; i < L.strokes.length; i++) {
    if (container._anim !== token) return;
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', L.strokes[i]); p.setAttribute('fill', 'none');
    p.setAttribute('stroke', colors[i % 3]); p.setAttribute('stroke-width', L.dot === i ? 13 : 9);
    p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
    ink.append(p);
    const len = p.getTotalLength() || 1;
    const s0 = p.getPointAtLength(0);
    marks.insertAdjacentHTML('beforeend',
      `<circle cx="${s0.x}" cy="${s0.y}" r="5" fill="${colors[i % 3]}"/><text x="${s0.x + 7}" y="${s0.y - 5}" font-size="11" font-weight="700" fill="${colors[i % 3]}" font-family="sans-serif">${i + 1}</text>`);
    p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
    pen.setAttribute('opacity', 1);
    const dur = Math.max(350, len * 22) / speed;
    const t0 = performance.now();
    await new Promise(res => {
      const step = now => {
        if (container._anim !== token) return res();
        const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        p.style.strokeDashoffset = len * (1 - e);
        const pt = p.getPointAtLength(len * e); pen.setAttribute('cx', pt.x); pen.setAttribute('cy', pt.y);
        k < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });
    await sleep(350 / speed);
  }
  pen.setAttribute('opacity', 0);
}

/* ---------- Mastery: eggs and hatching ---------- */
function letterProg(l) {
  if (!S.progress.letters[l]) S.progress.letters[l] = { correct: 0, egg: null, hatched: null, days: {}, stars: 0 };
  return S.progress.letters[l];
}

/* A day counts as "good" when the first N checks of that letter that day were all correct.
   That makes a lucky guess very unlikely to count (with 3 choices and N=2, about 1 in 9 per day). */
function recordLetterAnswer(l, correct) {
  const p = letterProg(l), d = today(), N = S.settings.checksPerDay;
  const day = p.days[d] || (p.days[d] = { n: 0, ok: 0 });
  if (day.n < N) { day.n++; if (correct) day.ok++; }
  if (correct) p.correct++;
  const events = [];
  if (!p.egg && p.correct >= S.settings.eggAfter) { p.egg = d; events.push('egg'); }
  if (p.egg && !p.hatched && hatchReady(l)) { p.hatched = d; events.push('hatch'); }
  save('progress');
  return events;
}
function goodDays(l) {
  const p = letterProg(l), N = S.settings.checksPerDay;
  return Object.entries(p.days).filter(([, v]) => v.n >= N && v.ok >= N).map(([k]) => k).sort();
}
function hatchReady(l) {
  const g = goodDays(l);
  if (g.length < S.settings.hatchDays) return false;
  return dayNum(g[g.length - 1]) - dayNum(g[0]) >= S.settings.hatchSpan;
}
/* How the egg is doing, for the nest display: 0 = no egg yet, 1..hatchDays = cracks, 'hatched'. */
function eggStage(l) {
  const p = letterProg(l);
  if (p.hatched) return 'hatched';
  if (!p.egg) return 0;
  return Math.min(S.settings.hatchDays, goodDays(l).length);
}

/* Decodability: which letters a word needs that aren't unlocked yet. */
function missingLetters(word, known = S.settings.unlocked) {
  const need = [...new Set(word.toLowerCase().replace(/[^a-z]/g, '').split(''))];
  return need.filter(c => !known.includes(c));
}
