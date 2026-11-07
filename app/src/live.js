// Live page: the text box is the whole description. Every keystroke redraws the character,
// pausing lets the lines settle, and the head keeps turning in 2.5D on a paper disc over a dark page.
// The rest of the website (copy, gallery, links) lives in site.js.
import { applyMessage, describe, initialState, missesIn, sceneFor } from './dialogue.js';
import { recordMisses, reportingOn, setReporting, REPORT_ENDPOINT } from './misses.js';
import { exportPng } from './export.js';
import { createLivePortrait, DRAWING_SETTLE_MS, trackPortraitPointer } from './live-portrait.js';
import { siteCopy, applySiteLinks, buildSiteGallery, shareLink, readSharedLink, copyText, statusLine } from './site.js';
import { registerAvatarTools } from './webmcp.js';

const FILL_SCALE = 1;
const EXAMPLE_EVERY = 3200;
const TYPE_SPEED = 28;
const CONFIRM_FOR = 1600;
// build.mjs fills this with the descriptions from the portrait corpus.
const SURPRISE_IDEAS = [];

// Placeholder ideas that rotate while the box is empty, to show what can be written.
const examples = [
  'blond, cigarette in mouth, tired eyes…',
  'girl with a pink bob and heart glasses…',
  'vampire with a cape…',
  'doomer…',
  'bald grandpa with a moustache and a pipe…',
  'gamer with headset and backwards cap…',
  'surprise me…',
];

// The character keeps its normal hand-drawn look (dark ink, full colours) on a round paper
// disc, the same crop a profile picture gets; only the page around it is dark.
function darken(colors) {
  return colors;
}

// Flowing background lines that get livelier while the user types.
function startLines(canvas, calm) {
  const context = canvas.getContext('2d');
  const lines = Array.from({ length: 11 }, (_, i) => ({ phase: i * 1.7, speed: 0.15 + (i % 4) * 0.05, height: (i + 0.5) / 11 }));
  let energy = 0.2;
  // Lines drift towards the character's main colour, mixed with the page white.
  let tint = [243, 239, 230];
  let target = tint;
  const resize = () => {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
  };
  resize();
  addEventListener('resize', resize);
  return {
    kick: () => { energy = Math.min(1, energy + 0.18); },
    burst: () => { energy = 1; },
    setTint(hex) {
      const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      target = rgb.map((v) => Math.round(v * 0.55 + 243 * 0.45));
    },
    draw(now) {
      const { width, height } = canvas;
      context.clearRect(0, 0, width, height);
      context.lineWidth = devicePixelRatio;
      energy = Math.max(0.2, energy * 0.985);
      tint = tint.map((v, i) => v + (target[i] - v) * 0.03);
      const time = calm ? 0 : now / 1000;
      for (const line of lines) {
        context.strokeStyle = `rgba(${tint.map(Math.round).join(', ')}, ${0.04 + energy * 0.08})`;
        context.beginPath();
        for (let x = 0; x <= width; x += 12 * devicePixelRatio) {
          const u = x / width;
          const y = line.height * height
            + Math.sin(u * 7 + time * line.speed * 3 + line.phase) * (10 + energy * 40) * devicePixelRatio
            + Math.sin(u * 17 - time * line.speed * 5) * (2 + energy * 8) * devicePixelRatio;
          if (x === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }
    },
  };
}

function liveMain() {
  const svg = document.querySelector('#stage');
  const input = document.querySelector('#say');
  const downloadButton = document.querySelector('#download');
  const shareButton = document.querySelector('#share');
  const status = document.querySelector('#status');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const portrait = createLivePortrait(svg, { calm, fillScale: FILL_SCALE });
  const pointer = trackPortraitPointer();
  const lines = startLines(document.querySelector('#lines'), calm);
  // One seed per visit: unmentioned traits stay put while the text grows.
  let base = { ...initialState(), seed: Math.floor(Math.random() * 2 ** 31) };
  let state = base;
  let lastTyped = -1e9;
  let settled = false;
  let loggedText = '';
  let pendingLog = null;
  let traitCount = 0;
  let needsRedraw = false;
  let typing = null;
  // Drawing every frame is only worth it while the character is on screen.
  let heroVisible = true;
  new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; }).observe(svg);
  const show = (now, confirmed) => {
    const scene = sceneFor({ ...state, confirmed });
    scene.colors = darken(scene.colors);
    portrait.update(scene, now);
    if (state.started) {
      lines.setTint(scene.accent);
      document.documentElement.style.setProperty('--accent', scene.accent);
    }
    svg.setAttribute('aria-label', state.started ? describe(state) : siteCopy.stageLabel);
  };

  const redraw = (now = performance.now()) => {
    needsRedraw = false;
    const text = input.value;
    // The whole text is replayed on a fresh state, so deleting words also removes them.
    const result = applyMessage(base, text, 0);
    if (result.action === 'random') base = { ...result.state, seed: result.state.seed };
    state = result.action ? base : result.state;
    const count = describe(state).split(',').length;
    if (count > traitCount && text.trim()) {
      lines.burst();
      portrait.glance(now);
    }
    traitCount = count;
    status.textContent = text.trim() ? statusLine(result, state) : '';
    // Nothing to download or share until something has been drawn.
    downloadButton.disabled = !state.started;
    shareButton.disabled = !text.trim();
    settled = false;
    show(now, calm);
  };

  // The box grows with the text (up to its CSS max-height), so no line is cut off on narrow screens.
  const fitInput = () => {
    input.style.height = 'auto';
    const borderHeight = input.offsetHeight - input.clientHeight;
    input.style.height = `${input.scrollHeight + borderHeight}px`;
  };
  input.addEventListener('input', (event) => {
    if (event.isTrusted) clearInterval(typing);
    fitInput();
    lastTyped = performance.now();
    lines.kick();
    needsRedraw = true;
    // After a pause the words are complete: log the ones the lexicon does not know.
    clearTimeout(pendingLog);
    pendingLog = setTimeout(() => {
      if (!input.value.trim() || input.value === loggedText) return;
      loggedText = input.value;
      recordMisses(missesIn(loggedText), loggedText.trim());
    }, DRAWING_SETTLE_MS);
  });

  // A button briefly says what just happened, then goes back to its label.
  const confirm = (button, key, back) => {
    button.textContent = siteCopy[key];
    setTimeout(() => { button.textContent = siteCopy[back]; }, CONFIRM_FOR);
  };
  const download = async () => {
    redraw();
    if (!state.started) return;
    await exportPng(state, darken, FILL_SCALE);
    confirm(downloadButton, 'downloaded', 'download');
    // The happiest moment of a visit: invite a star, once, only when the repository link is configured.
    const afterSave = document.querySelector('#after-save');
    if (afterSave.querySelector('a[href^="http"]')) afterSave.hidden = false;
  };
  input.addEventListener('keydown', async (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    const word = input.value.trim().toLowerCase();
    if (/^(download|save|png)$/.test(word.split(/\s+/).pop() ?? '')) {
      input.value = input.value.replace(/\s*\S+\s*$/, '');
      await download();
    }
  });
  downloadButton.addEventListener('click', download);
  // On phones the share sheet is the natural place for a link; elsewhere it goes to the clipboard.
  shareButton.addEventListener('click', async () => {
    const url = shareLink(input.value.trim(), base.seed);
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ url, title: siteCopy.title });
        return;
      } catch {}
    }
    if (await copyText(url)) confirm(shareButton, 'shared', 'share');
  });

  // Writes a sentence into the box letter by letter, so the drawing builds up as if typed.
  const typeInto = (text, seed) => {
    clearInterval(typing);
    if (seed !== undefined) base = { ...initialState(), seed };
    traitCount = 0;
    document.querySelector('#hero').scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
    if (calm) {
      input.value = text;
      input.dispatchEvent(new Event('input'));
      return;
    }
    input.value = '';
    let i = 0;
    typing = setInterval(() => {
      i += 1;
      input.value = text.slice(0, i);
      input.dispatchEvent(new Event('input'));
      if (i >= text.length) clearInterval(typing);
    }, TYPE_SPEED);
  };
  // Typing by hand stops any sentence being written for you.
  input.addEventListener('keydown', () => clearInterval(typing));
  document.querySelector('#surprise').addEventListener('click', () => {
    const pool = SURPRISE_IDEAS.filter((text) => text !== input.value);
    typeInto(pool[Math.floor(Math.random() * pool.length)], Math.floor(Math.random() * 2 ** 31));
  });

  const drawGallery = buildSiteGallery(typeInto, calm);
  show(-1e9, false);

  function tick(now) {
    if (needsRedraw) redraw(now);
    if (!calm && !settled && now - lastTyped > DRAWING_SETTLE_MS && state.started) {
      settled = true;
      show(now, true);
    }
    if (heroVisible) {
      if (!calm) lines.draw(now);
      portrait.draw(now, pointer);
    }
    drawGallery(now, pointer);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // A switch for anonymous word reports, in the privacy note, shown only when reporting is configured.
  const toggle = document.querySelector('#report');
  const reportLabel = () => {
    toggle.textContent = siteCopy.reports(reportingOn());
    toggle.setAttribute('aria-pressed', String(reportingOn()));
  };
  if (REPORT_ENDPOINT) {
    toggle.hidden = false;
    document.querySelector('#privacy-reports').hidden = false;
    reportLabel();
    toggle.addEventListener('click', () => { setReporting(!reportingOn()); reportLabel(); });
  }

  let example = 0;
  applySiteLinks();
  input.placeholder = examples[example];
  redraw();
  // Opening a shared link writes its sentence, with its seed, so the same face appears.
  const shared = readSharedLink();
  if (shared) typeInto(shared.text, shared.seed);
  // On phones the keyboard would cover the drawing before anyone has seen it.
  if (!matchMedia('(pointer: coarse)').matches) input.focus({ preventScroll: true });
  if (!calm) {
    setInterval(() => {
      if (input.value) return;
      example = (example + 1) % examples.length;
      input.placeholder = examples[example];
    }, EXAMPLE_EVERY);
  }
}

liveMain();
registerAvatarTools().catch((error) => console.warn('Could not register the WebMCP avatar tools.', error));
