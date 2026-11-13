/* Creatures (one per letter sound) and backdrops for the picture maker. All original drawings. */
'use strict';

const SPRITES = {
  s: { name: 'Snail', word: 'snail', idle: 'idle-slide', react: 'react-squish', svg: `
    <g class="anim BODY">
      <path d="M14 82 C14 72 30 70 46 72 L80 72 C88 72 90 82 84 84 L18 86 C15 86 14 84 14 82Z" fill="#c9d977"/>
      <path d="M74 72 L72 52 M82 72 L84 54" stroke="#9fb34f" stroke-width="3" stroke-linecap="round"/>
      <circle cx="72" cy="50" r="4.5" fill="#fff" stroke="#3b3226" stroke-width="1.5"/><circle cx="72.8" cy="50.5" r="2" fill="#3b3226"/>
      <circle cx="84" cy="52" r="4.5" fill="#fff" stroke="#3b3226" stroke-width="1.5"/><circle cx="84.8" cy="52.5" r="2" fill="#3b3226"/>
      <path d="M77 66 Q81 69 85 66" stroke="#3b3226" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <circle cx="44" cy="54" r="24" fill="#e69138"/>
      <path d="M44 54 m0 -4 a4 4 0 1 1 -4 4 a8 8 0 1 1 8 8 a12 12 0 1 1 -12 -12 a16 16 0 1 1 16 16" fill="none" stroke="#a8601d" stroke-width="3" stroke-linecap="round"/>
    </g>` },
  a: { name: 'Ant', word: 'ant', idle: 'idle-wiggle', react: 'react-jump', svg: `
    <g class="anim BODY">
      <g stroke="#3b3226" stroke-width="3" stroke-linecap="round" fill="none">
        <path d="M42 64 L32 80 M46 66 L44 84 M54 66 L58 84 M58 64 L70 80"/>
        <path d="M74 44 Q78 30 86 28 M78 46 Q86 36 94 38"/>
      </g>
      <ellipse cx="28" cy="58" rx="16" ry="13" fill="#b04a3a"/>
      <ellipse cx="51" cy="58" rx="10" ry="8" fill="#c25a48"/>
      <circle cx="72" cy="52" r="11" fill="#cc5a4a"/>
      <circle cx="75" cy="49" r="3.5" fill="#fff"/><circle cx="76" cy="49.5" r="1.8" fill="#3b3226"/>
      <path d="M72 57 Q76 60 80 56" stroke="#3b3226" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    </g>` },
  t: { name: 'Turtle', word: 'turtle', idle: 'idle-bob', react: 'react-spin', svg: `
    <g class="anim BODY">
      <ellipse cx="26" cy="80" rx="8" ry="6" fill="#8fbf5a"/><ellipse cx="66" cy="80" rx="8" ry="6" fill="#8fbf5a"/>
      <path d="M14 72 Q14 76 10 76" stroke="#8fbf5a" stroke-width="5" stroke-linecap="round"/>
      <circle cx="82" cy="60" r="11" fill="#8fbf5a"/>
      <circle cx="85" cy="57" r="3.5" fill="#fff"/><circle cx="86" cy="57.5" r="1.8" fill="#3b3226"/>
      <path d="M82 65 Q86 68 90 64" stroke="#3b3226" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M12 74 Q14 36 46 34 Q78 36 80 74 Z" fill="#4e8a37"/>
      <path d="M46 40 L56 50 L52 64 L40 64 L36 50 Z M24 56 L36 50 M68 56 L56 50 M22 72 L40 64 M70 72 L52 64" stroke="#2f5d1e" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
      <rect x="10" y="72" width="72" height="5" rx="2.5" fill="#d9c27a"/>
    </g>` },
  p: { name: 'Penguin', word: 'penguin', idle: 'idle-waddle', react: 'react-jump', svg: `
    <g class="anim BODY">
      <ellipse cx="40" cy="90" rx="9" ry="4" fill="#e69138"/><ellipse cx="60" cy="90" rx="9" ry="4" fill="#e69138"/>
      <ellipse cx="50" cy="58" rx="27" ry="33" fill="#2f3a4a"/>
      <ellipse cx="50" cy="64" rx="18" ry="25" fill="#fffdf7"/>
      <path d="M24 52 Q14 66 20 76" stroke="#2f3a4a" stroke-width="8" stroke-linecap="round" fill="none"/>
      <path d="M76 52 Q86 66 80 76" stroke="#2f3a4a" stroke-width="8" stroke-linecap="round" fill="none"/>
      <circle cx="42" cy="40" r="4" fill="#fff"/><circle cx="43" cy="40.5" r="2" fill="#3b3226"/>
      <circle cx="58" cy="40" r="4" fill="#fff"/><circle cx="59" cy="40.5" r="2" fill="#3b3226"/>
      <path d="M44 48 L56 48 L50 56 Z" fill="#e69138"/>
    </g>` },
  i: { name: 'Inchworm', word: 'inchworm', idle: 'idle-inch', react: 'react-squish', svg: `
    <g class="anim BODY">
      <path d="M12 84 Q20 84 26 76 Q34 52 46 52 Q58 52 64 76 Q70 84 80 82" fill="none" stroke="#6aa84f" stroke-width="15" stroke-linecap="round"/>
      <path d="M12 84 Q20 84 26 76 Q34 52 46 52 Q58 52 64 76 Q70 84 80 82" fill="none" stroke="#9fcf7f" stroke-width="15" stroke-linecap="round" stroke-dasharray="1 9"/>
      <circle cx="84" cy="76" r="10" fill="#6aa84f"/>
      <circle cx="87" cy="73" r="3.5" fill="#fff"/><circle cx="88" cy="73.5" r="1.8" fill="#3b3226"/>
      <path d="M84 80 Q88 83 92 79" stroke="#3b3226" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M84 66 L82 58 M88 67 L91 60" stroke="#4e8a37" stroke-width="2.5" stroke-linecap="round"/>
    </g>` },
  n: { name: 'Newt', word: 'newt', idle: 'idle-bob', react: 'react-jump', svg: `
    <g class="anim BODY">
      <g class="anim idle-swish"><path d="M30 70 Q14 72 6 60" fill="none" stroke="#e69138" stroke-width="8" stroke-linecap="round"/></g>
      <path d="M38 74 L32 86 M50 74 L48 86 M64 72 L66 84 M74 70 L80 80" stroke="#d0782a" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="54" cy="66" rx="26" ry="10" fill="#e69138"/>
      <circle cx="44" cy="62" r="2.5" fill="#cc5a4a"/><circle cx="56" cy="60" r="2.5" fill="#cc5a4a"/><circle cx="66" cy="63" r="2.5" fill="#cc5a4a"/>
      <ellipse cx="82" cy="62" rx="12" ry="9" fill="#e69138"/>
      <circle cx="85" cy="58" r="3.5" fill="#fff"/><circle cx="86" cy="58.5" r="1.8" fill="#3b3226"/>
      <path d="M84 66 Q88 68 92 64" stroke="#3b3226" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    </g>` },
};
const EGG_SVG = (stage, max) => {
  const cracks = [
    '', 'M42 40 L48 46 L44 52',
    'M42 40 L48 46 L44 52 M58 58 L54 64 L60 68',
    'M42 40 L48 46 L44 52 M58 58 L54 64 L60 68 M36 66 L42 70 L38 76',
  ];
  const k = Math.min(cracks.length - 1, Math.round(stage / Math.max(1, max) * (cracks.length - 1)));
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g class="anim EGG">
    <ellipse cx="50" cy="58" rx="27" ry="34" fill="#fbf1d8" stroke="#d9c7a0" stroke-width="2"/>
    <circle cx="40" cy="44" r="4" fill="#e9d7ae"/><circle cx="60" cy="72" r="5" fill="#e9d7ae"/><circle cx="62" cy="40" r="3" fill="#e9d7ae"/>
    <path d="${cracks[k]}" stroke="#8a7a62" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
};

function spriteName(l) { return S.settings.spriteNames[l] || SPRITES[l].name; }
function spriteSVG(l, { animate = true } = {}) {
  const sp = SPRITES[l];
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${sp.svg.replace('BODY', animate ? sp.idle : '')}</svg>`;
}
/* Tap reaction: plays the creature's little animation and says its name. */
function poke(el, l) {
  const g = el.querySelector('.anim');
  if (!g) return;
  const sp = SPRITES[l];
  g.classList.remove(sp.idle, sp.react); void g.getBoundingClientRect();
  g.classList.add(sp.react);
  setTimeout(() => { g.classList.remove(sp.react); g.classList.add(sp.idle); }, 800);
  playWord(spriteName(l), 'sp:' + l);
}

const BACKDROPS = {
  meadow: { name: 'Meadow', svg: `
    <defs><linearGradient id="skyM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3f5"/><stop offset="1" stop-color="#eaf6fb"/></linearGradient></defs>
    <rect width="1000" height="625" fill="url(#skyM)"/>
    <circle cx="840" cy="110" r="62" fill="#ffd966"/>
    <ellipse cx="220" cy="120" rx="90" ry="28" fill="#fff"/><ellipse cx="280" cy="100" rx="60" ry="30" fill="#fff"/>
    <path d="M0 420 Q250 330 520 400 T1000 380 L1000 625 L0 625 Z" fill="#9fcf7f"/>
    <path d="M0 500 Q300 430 620 500 T1000 480 L1000 625 L0 625 Z" fill="#7fb85e"/>
    <g fill="#f4b6c2"><circle cx="120" cy="560" r="9"/><circle cx="380" cy="590" r="9"/><circle cx="700" cy="560" r="9"/><circle cx="900" cy="600" r="9"/></g>
    <g fill="#ffe08a"><circle cx="240" cy="600" r="8"/><circle cx="560" cy="575" r="8"/><circle cx="820" cy="545" r="8"/></g>` },
  pond: { name: 'Pond', svg: `
    <rect width="1000" height="625" fill="#d8eef0"/>
    <path d="M0 300 Q500 260 1000 300 L1000 625 L0 625 Z" fill="#9fcf7f"/>
    <ellipse cx="500" cy="470" rx="430" ry="130" fill="#6fb3c8"/>
    <ellipse cx="500" cy="470" rx="380" ry="100" fill="#86c4d4"/>
    <g fill="#5e9e45"><path d="M330 470 a48 22 0 1 0 1 0 Z"/><path d="M640 430 a40 18 0 1 0 1 0 Z"/><path d="M560 520 a34 15 0 1 0 1 0 Z"/></g>
    <g stroke="#4e8a37" stroke-width="7" stroke-linecap="round"><path d="M90 420 L80 250 M120 430 L130 270 M150 420 L160 300"/><path d="M880 420 L870 260 M910 430 L925 290"/></g>
    <g fill="#8a5a2b"><rect x="73" y="240" width="14" height="44" rx="7"/><rect x="123" y="260" width="14" height="44" rx="7"/><rect x="865" y="250" width="14" height="44" rx="7"/></g>` },
  night: { name: 'Night', svg: `
    <rect width="1000" height="625" fill="#24304a"/>
    <circle cx="800" cy="130" r="58" fill="#f5edd0"/><circle cx="826" cy="116" r="54" fill="#24304a"/>
    <g fill="#f5edd0"><circle cx="120" cy="90" r="3"/><circle cx="260" cy="160" r="2"/><circle cx="400" cy="70" r="3"/><circle cx="560" cy="140" r="2"/><circle cx="660" cy="60" r="3"/><circle cx="920" cy="240" r="2"/><circle cx="180" cy="250" r="2"/><circle cx="480" cy="230" r="3"/></g>
    <path d="M0 440 Q260 380 540 440 T1000 420 L1000 625 L0 625 Z" fill="#344a3a"/>
    <path d="M0 520 Q320 470 640 520 T1000 510 L1000 625 L0 625 Z" fill="#2b3d30"/>
    <g fill="#ffe08a" opacity=".9"><circle cx="300" cy="470" r="5"/><circle cx="620" cy="400" r="5"/><circle cx="760" cy="500" r="5"/></g>` },
};
