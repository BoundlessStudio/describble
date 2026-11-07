// Pen-stroke engine: every stroke has a fixed shape and K boil variants,
// both scaled by confidence. Colours are read on every render, so changing them never redraws.
import { flatten, resample, toPath } from './geometry.js';

export const K = 4;
export const PAPER = '#fbf6ec';
export const SVG_NS = 'http://www.w3.org/2000/svg';

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (value) => Math.min(1, Math.max(0, value));

// The scribble settles straight into the reference rough style; it never passes through a clean line.
export function sketchParams(c, ink) {
  const loose = (1 - c) ** 1.7;
  const tight = 1 - loose;
  return {
    wobble: lerp(18, 6, tight),
    boil: 0.6 + 4 * loose,
    taper: 1,
    gap: 1,
    width: lerp(3.5, 9.5, tight),
    passTwo: 0.6,
    loose,
    lineOpacity: lerp(0.55, 1, tight),
    ink,
  };
}

export function strokeModel(d, random) {
  const points = resample(flatten(d), 5);
  const last = points.length - 1;
  const chunks = [];
  let start = 0;
  while (start < last) {
    const span = last < 14 ? last : Math.round((50 + random() * 80) / 5);
    let end = Math.min(start + span, last);
    if (last - end < 12) end = last;
    const slice = points.slice(start, end + 1);
    const every = Math.max(1, Math.round(Math.min(32, Math.max(13, (slice.length * 5) / 5.5)) / 5));
    const picked = slice.filter((_, index) => index % every === 0);
    picked.push(slice[slice.length - 1]);
    if (picked.length < 3) picked.splice(1, 0, slice[Math.floor(slice.length / 2)]);
    chunks.push(newChunk(random, picked));
    if (end === last) break;
    start = end - 3;
  }
  return chunks;
}

export function newChunk(random, points) {
  return {
    shift: [random() - 0.5, random() - 0.5],
    pull: [random() * 2 - 0.5, random() * 2 - 0.5],
    roll: random(),
    vertices: points.map(([x, y]) => ({
      x,
      y,
      shape: [random() - 0.5, random() - 0.5],
      boil: Array.from({ length: K }, () => [random() - 0.5, random() - 0.5]),
      grain: 0.8 + random() * 0.4,
    })),
  };
}

export function chunkPath(chunk, p, frame, calm, width, wobbleScale, reveal = 1) {
  const wobble = p.wobble * (calm ? 0.42 : 1) * wobbleScale;
  const boil = p.boil * (calm ? 0.5 : 1);
  const moved = chunk.vertices.map((v) => [
    v.x + (chunk.shift[0] + v.shape[0]) * wobble + v.boil[frame][0] * boil,
    v.y + (chunk.shift[1] + v.shape[1]) * wobble + v.boil[frame][1] * boil,
  ]);
  // The stroke-dashoffset equivalent for strokes that are filled polygons.
  moved.length = Math.max(2, Math.ceil(moved.length * reveal));
  const count = moved.length;
  if (count > 3) {
    const pull = (from, to, amount) => {
      const size = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
      const by = Math.min(size * 0.8, amount * 12 * p.gap);
      from[0] += ((to[0] - from[0]) / size) * by;
      from[1] += ((to[1] - from[1]) / size) * by;
    };
    pull(moved[0], moved[1], chunk.pull[0]);
    pull(moved[count - 1], moved[count - 2], chunk.pull[1]);
  }
  const left = [];
  const right = [];
  moved.forEach(([x, y], index) => {
    const [ax, ay] = moved[Math.max(0, index - 1)];
    const [bx, by] = moved[Math.min(count - 1, index + 1)];
    const size = Math.hypot(bx - ax, by - ay) || 1;
    const profile = 0.2 + 0.8 * Math.sin((Math.PI * index) / (count - 1)) ** 0.6;
    const half = (width / 2) * lerp(1, profile * chunk.vertices[index].grain, p.taper);
    left.push([x - ((by - ay) / size) * half, y + ((bx - ax) / size) * half]);
    right.unshift([x + ((by - ay) / size) * half, y - ((bx - ax) / size) * half]);
  });
  return toPath([...left, ...right]);
}

export function addSvg(parent, name, attributes) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  parent.append(element);
  return element;
}

function roughShape(d, random, jitter) {
  return toPath(resample(flatten(d), 18)
    .map(([x, y]) => [x + (random() - 0.5) * jitter, y + (random() - 0.5) * jitter]));
}

// parts: [{ under, shapes, blotches, scratches, lines, dots, calm, thin, lineColor }]
// containerFor(part) picks the SVG layer each part ends up in.
export function buildArt(containerFor, parts, random) {
  const covers = [];
  const fills = [];
  const strokes = [];
  const dots = [];
  const texts = [];
  for (const part of parts) {
    const parent = containerFor(part);
    const fill = (d, color, jitter, moved) => {
      const element = addSvg(parent, 'path', { d: roughShape(d, random, jitter) });
      if (moved) element.setAttribute('transform', 'translate(14 10)');
      fills.push({ element, color });
    };
    for (const blotch of part.under ?? []) fill(blotch.d, blotch.color, 9, false);
    for (const shape of part.shapes ?? []) {
      covers.push(addSvg(parent, 'path', { d: shape.d, fill: PAPER }));
      const exact = shape.exact || shape.color === 'ink' || shape.color === 'paper';
      fill(shape.d, shape.color, exact ? 2 : 7, !exact);
    }
    for (const blotch of part.blotches ?? []) fill(blotch.d, blotch.color, 9, true);
    const line = (d, kind) => {
      for (const chunk of strokeModel(d, random)) {
        strokes.push({ chunk, kind, calm: part.calm, thin: part.thin, color: part.lineColor ?? 'ink', element: addSvg(parent, 'path', {}) });
      }
    };
    for (const d of part.scratches ?? []) line(d, 'scratch');
    for (const d of part.lines ?? []) {
      line(d, 'main');
      if (!part.calm && !part.thin) {
        line(d, 'second');
        line(d, 'third');
      }
    }
    for (const dot of part.dots ?? []) {
      dots.push({ ...dot, element: addSvg(parent, 'circle', { cx: dot.x, cy: dot.y, r: dot.r }) });
    }
    for (const text of part.texts ?? []) {
      texts.push({ ...text, element: addSvg(parent, 'text', {
        x: text.x, y: text.y, 'text-anchor': 'middle', 'font-size': text.size, 'font-weight': 900,
        'font-family': 'ui-rounded, system-ui, sans-serif', 'letter-spacing': 1.5,
      }) });
    }
  }
  strokes.forEach((stroke, index) => { stroke.order = index / strokes.length; });
  return { covers, fills, strokes, dots, texts };
}

export const colorOf = (colors, key) => colors[key] ?? key;

export function renderArt(art, p, frame, reveal, colors) {
  for (const cover of art.covers) {
    cover.setAttribute('fill', colors.background ?? PAPER);
    cover.setAttribute('opacity', clamp(reveal * 1.5 - 0.5));
  }
  for (const { element, color } of art.fills) {
    element.setAttribute('fill', colorOf(colors, color));
    element.setAttribute('opacity', p.ink * reveal);
  }
  // The text is a scene value (e.g. brandName), not a fixed string of the piece.
  for (const text of art.texts) {
    text.element.textContent = colors[text.text] ?? text.text;
    text.element.setAttribute('fill', colorOf(colors, text.color));
    text.element.setAttribute('opacity', p.ink * reveal);
  }
  for (const dot of art.dots) {
    dot.element.setAttribute('fill', colorOf(colors, dot.color ?? 'ink'));
    dot.element.setAttribute('opacity', reveal > 0.6 ? (dot.opacity ?? 1) * (dot.inked ? p.ink : p.lineOpacity) : 0);
  }
  for (const { chunk, kind, calm, thin, color, element, order } of art.strokes) {
    let opacity = p.lineOpacity;
    let width = thin ? 4.5 : p.width;
    let scale = 1;
    if (kind === 'scratch') {
      opacity = p.ink;
      width = 4;
      scale = 0.3;
    } else if (kind === 'second') {
      opacity *= chunk.roll < p.passTwo ? 1 : p.loose;
      width = Math.min(4, p.width);
      scale = 1.5;
    } else if (kind === 'third') {
      opacity *= p.loose;
      width = 3;
      scale = 1.9;
    }
    const shown = clamp((reveal * 1.35 - order) / 0.35);
    if (opacity < 0.02 || shown === 0) {
      element.setAttribute('d', '');
      continue;
    }
    element.setAttribute('fill', colorOf(colors, color));
    element.setAttribute('opacity', opacity.toFixed(2));
    element.setAttribute('d', chunkPath(chunk, p, frame, calm, width, scale, shown));
  }
}
