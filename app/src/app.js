// UI: one drawing and one chat. No buttons: type, press Enter.
import { SVG_NS } from './pen.js';
import { exportPng } from './export.js';
import { encodeGif, indexFrame, popularPalette } from './gif.js';
import { createStage, boilFrame } from './stage.js';
import { applyMessage, describe, greeting, initialState, missesIn, placeholder, restoreState, sceneFor } from './dialogue.js';
import { clearMisses, readMisses, recordMisses } from './misses.js';
import { catalog } from './pieces.js';

function readHash() {
  try {
    const match = location.hash.match(/^#s=(.+)$/);
    return match ? JSON.parse(decodeURIComponent(atob(match[1]))) : null;
  } catch {
    return null;
  }
}
// Some previews (data: pages) cannot write history; the shareable link is only a bonus.
function writeHash(state) {
  try {
    history.replaceState(null, '', `#s=${btoa(encodeURIComponent(JSON.stringify(state)))}`);
  } catch {
    // no shareable link, everything else still works
  }
}

function main() {
  const svg = document.querySelector('#stage');
  const log = document.querySelector('#log');
  const input = document.querySelector('#say');
  const stage = createStage(svg);
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shared = readHash();
  let state = shared ? restoreState(shared) : initialState();
  input.placeholder = placeholder;
  const past = [];
  let turn = 0;
  let shown = -1;

  const say = (who, text) => {
    const line = Object.assign(document.createElement('p'), { className: who, textContent: text });
    log.append(line);
    log.scrollTop = log.scrollHeight;
  };
  const show = (at) => {
    const scene = sceneFor(state);
    stage.update(scene, at);
    svg.setAttribute('aria-label', describe(state));
    document.documentElement.style.setProperty('--accent', scene.accent);
    writeHash(state);
  };

  const send = async (text) => {
    if (!text.trim()) return;
    say('me', text);
    const result = applyMessage(state, text, turn++);
    recordMisses(missesIn(text), text.trim());
    if (result.action === 'undo') state = past.pop() ?? initialState();
    else {
      if (result.state !== state) past.push(state);
      state = result.state;
    }
    say('bot', result.reply);
    show(performance.now());
    if (result.action === 'download') document.body.dataset.png = (await exportPng(state)).length;
  };

  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    send(input.value);
    input.value = '';
  });

  say('bot', greeting(state.started));
  stage.update(sceneFor(state), -1e9);
  show(performance.now());

  function tick(now) {
    const frame = calm ? 0 : boilFrame(now);
    if (stage.busy(now) || frame !== shown) {
      shown = frame;
      stage.draw(now, frame);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // ?say=text|text sends messages in sequence (testing and example links).
  const script = new URLSearchParams(location.search).get('say');
  if (script) script.split('|').reduce((wait, text, i) => wait.then(() => new Promise((r) => setTimeout(r, i ? 900 : 300))).then(() => send(text)), Promise.resolve());
}

// ?mode=catalog: every variant of every slot at full confidence, to review the pieces.
function catalogView() {
  const view = document.querySelector('#catalog');
  const base = { ...initialState(), started: true, confirmed: true };
  const only = new URLSearchParams(location.search).get('only');
  const variants = [];
  for (const [slot, list] of Object.entries(catalog)) {
    for (const variant of Object.keys(list)) {
      if (variant === 'none') continue;
      if (only && !slot.startsWith(only)) continue;
      variants.push([slot, variant]);
    }
  }
  for (const [slot, variant] of variants) {
    const state = structuredClone(base);
    if (slot === 'hair') state.hair.style = variant === 'under' ? 'short' : variant;
    if (variant === 'under') state.hat.type = 'beanie';
    if (slot === 'hat') state.hat.type = variant;
    if (slot === 'clothes') state.clothes.type = variant;
    if (slot === 'beard') [state.beard, state.face] = variant.split('-');
    if (slot === 'moustache') state.moustache = variant;
    if (slot === 'eyewear') state.eyewear = variant;
    if (slot === 'smoke') state.smoke = variant;
    if (slot === 'head') state.face = variant;
    if (slot === 'ears') state.ears = variant;
    if (slot === 'pattern') state.pattern = variant;
    if (slot === 'nose') state.nose = variant;
    if (slot.startsWith('detail:')) state.details = [slot.slice(7)];
    const box = document.createElement('figure');
    const svg = document.createElementNS(SVG_NS, 'svg');
    box.append(svg, Object.assign(document.createElement('figcaption'), { textContent: `${slot} ${variant}` }));
    view.append(box);
    const stage = createStage(svg, { instant: true });
    stage.update(sceneFor(state), 0);
    stage.draw(1, 0);
  }
}

// ?mode=turn&say=text: the same character turned left, straight and right, to review the 2.5D turn.
function turnView() {
  const view = document.querySelector('#catalog');
  const text = new URLSearchParams(location.search).get('say') ?? 'glasses and a beard';
  const state = { ...applyMessage({ ...initialState(), seed: 5 }, text).state, confirmed: true };
  for (const yaw of [-1, -0.5, 0, 0.5, 1]) {
    const box = document.createElement('figure');
    const svg = document.createElementNS(SVG_NS, 'svg');
    box.append(svg, Object.assign(document.createElement('figcaption'), { textContent: `yaw ${yaw}` }));
    view.append(box);
    const stage = createStage(svg, { instant: true });
    stage.update(sceneFor(state), 0);
    stage.setPose({ yaw });
    stage.draw(1, 0);
  }
}

// ?mode=gallery: a fixed set of characters with the sentence that made each one (README image).
const galleryLines = [
  'blond, cigarette in mouth, tired eyes',
  'girl with a pink bob and heart glasses',
  'vampire with a cape',
  'doomer',
  'grandma with curlers and reading glasses',
  'gamer with headset and backwards cap',
  'girl with space buns, a hair bow and freckles',
  'girl with gauges, septum and fuchsia hair',
  'construction worker with a hard hat and a beard',
  'punk with a green mohawk and a leather jacket',
  'fedora, matrix glasses, open black shirt',
  'hijab and round glasses, smiling',
];
function galleryView() {
  document.body.dataset.mode = 'gallery';
  const view = document.querySelector('#catalog');
  galleryLines.forEach((text, i) => {
    const state = { ...applyMessage({ ...initialState(), seed: 1000 + i * 7 }, text).state, confirmed: true };
    const box = document.createElement('figure');
    const svg = document.createElementNS(SVG_NS, 'svg');
    box.append(svg, Object.assign(document.createElement('figcaption'), { textContent: text }));
    view.append(box);
    const stage = createStage(svg, { instant: true });
    stage.update(sceneFor(state), 0);
    stage.setPose({ yaw: [-0.35, 0, 0.35][i % 3] });
    stage.draw(1, 0);
  });
}

// ?mode=record: renders the README demo GIF with a fake clock (typing, settling, a head turn),
// then writes it as base64 into <pre id="gif"> so a headless browser can save it.
async function recordDemo() {
  const WIDTH = 480;
  const HEIGHT = 560;
  const FPS = 12.5;
  const LENGTH = 7600;
  const text = new URLSearchParams(location.search).get('say') ?? 'blond, cigarette in mouth, tired eyes, red beanie';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('width', 512);
  svg.setAttribute('height', 512);
  const stage = createStage(svg);
  const base = { ...initialState(), seed: 1000 };
  const canvas = Object.assign(document.createElement('canvas'), { width: WIDTH, height: HEIGHT });
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const frames = [];
  let typed = null;
  let settled = false;
  for (let n = 0; n < (LENGTH / 1000) * FPS; n++) {
    const at = (n * 1000) / FPS;
    const shown = text.slice(0, Math.max(0, Math.floor((at - 400) / 75)));
    const done = shown.length === text.length;
    const settle = done && at > 400 + text.length * 75 + 1300;
    if (shown !== typed || settle !== settled) {
      typed = shown;
      settled = settle;
      const state = applyMessage(base, shown).state;
      stage.update(sceneFor({ ...state, confirmed: settle }), at);
    }
    const turn = settle ? Math.sin(((at - 400 - text.length * 75 - 1300) / 2200) * Math.PI * 2) * 0.9 : 0;
    stage.setPose({ yaw: 0.3 * Math.sin(at / 1900) + turn, roll: 2 * Math.sin(at / 2300), bob: 3 * Math.sin(at / 1100) });
    stage.setLife({ blink: at > 6200 && at < 6380 ? Math.sin(((at - 6200) / 180) * Math.PI) : 0, gaze: [turn * 0.7, 0] });
    stage.draw(at, boilFrame(at));
    const image = new Image();
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
    await new Promise((resolve) => { image.onload = resolve; image.src = url; });
    URL.revokeObjectURL(url);
    context.fillStyle = '#0d0e12';
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.save();
    context.beginPath();
    context.arc(WIDTH / 2, 230, 210, 0, Math.PI * 2);
    context.clip();
    context.drawImage(image, WIDTH / 2 - 210, 20, 420, 420);
    context.restore();
    context.fillStyle = '#f3efe6';
    context.font = '20px ui-rounded, system-ui, sans-serif';
    context.textAlign = 'center';
    context.fillText(`${typed}${!settled && Math.floor(at / 400) % 2 === 0 ? '|' : ' '}`, WIDTH / 2, 492);
    frames.push(context.getImageData(0, 0, WIDTH, HEIGHT).data);
  }
  const palette = popularPalette(frames);
  const cache = new Map();
  const gif = encodeGif(WIDTH, HEIGHT, frames.map((pixels) => indexFrame(pixels, palette, cache)), palette, Math.round(100 / FPS));
  let binary = '';
  for (const byte of gif) binary += String.fromCharCode(byte);
  document.querySelector('#gif').textContent = btoa(binary);
}

// ?mode=misses: the local log of words that were not understood, most frequent first,
// with a JSON export to paste into an issue or hand to a maintainer.
function missesView() {
  document.body.dataset.mode = 'misses';
  const view = document.querySelector('#catalog');
  const log = Object.entries(readMisses()).sort((a, b) => b[1].count - a[1].count);
  const title = Object.assign(document.createElement('h2'), { textContent: `${log.length} words not understood (stored only in this browser)` });
  const list = document.createElement('ol');
  for (const [word, entry] of log) {
    const item = document.createElement('li');
    item.textContent = `${word} ×${entry.count} — ${entry.examples.join(' | ')}`;
    list.append(item);
  }
  const exported = Object.assign(document.createElement('textarea'), { readOnly: true, value: JSON.stringify(Object.fromEntries(log), null, 1) });
  const clear = Object.assign(document.createElement('button'), { textContent: 'Clear the log' });
  clear.addEventListener('click', () => { clearMisses(); location.reload(); });
  view.append(title, list, exported, clear);
}

if (new URLSearchParams(location.search).get('mode') === 'misses') {
  missesView();
} else if (new URLSearchParams(location.search).get('mode') === 'record') {
  recordDemo();
} else if (new URLSearchParams(location.search).get('mode') === 'gallery') {
  galleryView();
} else if (new URLSearchParams(location.search).get('mode') === 'turn') {
  document.body.dataset.mode = 'catalog';
  turnView();
} else if (new URLSearchParams(location.search).get('mode') === 'catalog') {
  document.body.dataset.mode = 'catalog';
  catalogView();
} else main();
