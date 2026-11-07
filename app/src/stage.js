// Live drawing: one slot per piece, each with its own confidence and ink.
// A piece that changes is retracted and redrawn; eyes and mouth morph through the rig.
import { hash, mulberry32, toPath } from './geometry.js';
import { K, PAPER, SVG_NS, addSvg, buildArt, chunkPath, clamp, colorOf, lerp, newChunk, renderArt, sketchParams } from './pen.js';
import { LAYERS, catalog } from './pieces.js';
import { SAMPLES, faceShapes, mixWeights } from './rig.js';

const DRAW_OUT = 200;
const DRAW_IN = 480;
const SETTLE = 600;
const MORPH = 450;
const easeOut = (t) => 1 - (1 - t) ** 3;
let stageCount = 0;

function rigStroke(random) {
  return [[0, 10], [7, SAMPLES - 1]].map(([from, to]) => {
    const indices = Array.from({ length: Math.floor((to - from) / 2) + 1 }, (_, i) => Math.min(to, from + i * 2));
    return { indices, ...newChunk(random, indices.map(() => [0, 0])) };
  });
}

// How far each layer slides when the head turns: negative layers sit behind the face and move
// the other way, face features in front move the most. This is what fakes the 2.5D turn.
const LAYER_DEPTH = {
  back: -0.55, body: -0.08, bodyOver: -0.08, earLeft: -0.3, earRight: -0.3, head: 0.12, nose: 0.85, skinDetail: 0.5, facial: 0.45,
  mouth: 0.55, mouthAcc: 0.6, eyes: 0.55, eyewear: 0.68, front: 0.3, lobeLeft: -0.3, lobeRight: -0.3, hat: 0.26, over: 0.36,
};
const TURN_SHIFT = 40;
// Ears change width in opposite directions: turning towards one ear hides it, the other opens up.
const EAR_SWING = { earLeft: { anchor: 170, grow: 0.45 }, earRight: { anchor: 346, grow: -0.45 } };
EAR_SWING.lobeLeft = EAR_SWING.earLeft;
EAR_SWING.lobeRight = EAR_SWING.earRight;

export function createStage(svg, { instant = false, fillScale = 1 } = {}) {
  const timing = instant ? { out: 0, in: 0, settle: 0, morph: 0 } : { out: DRAW_OUT, in: DRAW_IN, settle: SETTLE, morph: MORPH };
  svg.setAttribute('viewBox', '0 0 512 512');
  const background = addSvg(svg, 'rect', { width: 512, height: 512, fill: PAPER });
  const layers = Object.fromEntries(LAYERS.map((name) => [name, addSvg(svg, 'g', { 'data-layer': name })]));
  let colors = {};

  const track = (value) => ({ from: value, to: value, changed: -1e9 });
  const valueOf = (t, at) => lerp(t.from, t.to, easeOut(clamp(timing.settle ? (at - t.changed) / timing.settle : 1)));
  const retarget = (t, value, at) => {
    if (t.to === value) return;
    t.from = valueOf(t, at);
    t.to = value;
    t.changed = at;
  };

  const makeGroup = (slot, variant, at, delay) => {
    const groups = {};
    const containerFor = (part) => {
      groups[part.layer] ??= addSvg(layers[part.layer], 'g', {});
      return groups[part.layer];
    };
    const art = buildArt(containerFor, catalog[slot][variant] ?? [], mulberry32(hash(`${slot}:${variant}`)));
    return { variant, art, groups, enter: at + delay, leave: null };
  };
  const slots = {};

  // Face rig: pupils below, then lids and brows, mouth with its fill.
  const random = mulberry32(99);
  const mouthFill = addSvg(layers.mouth, 'path', {});
  const shadows = [0, 1].map(() => addSvg(layers.skinDetail, 'path', {}));
  const fangs = [0, 1].map(() => addSvg(layers.mouth, 'path', { fill: '#f4f1ea', stroke: '#1b1b1f', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
  const lashes = Array.from({ length: 6 }, () => addSvg(layers.eyes, 'path', { fill: 'none', 'stroke-width': 3.2, 'stroke-linecap': 'round' }));
  // Eye white between the lids; pupil and glint are clipped inside, so the lids can cover them.
  const clipId = `eye${(stageCount += 1)}`;
  const defs = addSvg(svg, 'defs', {});
  // Paper grain: fixed, very faint dots over the background, identical in the PNG.
  const grainRandom = mulberry32(7);
  const grain = addSvg(defs, 'pattern', { id: `${clipId}-grain`, width: 96, height: 96, patternUnits: 'userSpaceOnUse' });
  for (let i = 0; i < 46; i++) {
    addSvg(grain, 'circle', { cx: (grainRandom() * 96).toFixed(1), cy: (grainRandom() * 96).toFixed(1), r: (0.6 + grainRandom() * 1.1).toFixed(2), fill: '#3a2f22', opacity: (0.05 + grainRandom() * 0.07).toFixed(2) });
  }
  addSvg(layers.back, 'rect', { width: 512, height: 512, fill: `url(#${clipId}-grain)` });
  const clips = [0, 1].map((i) => addSvg(addSvg(defs, 'clipPath', { id: `${clipId}-${i}` }), 'path', {}));
  const whites = [0, 1].map(() => addSvg(layers.eyes, 'path', {}));
  const pupils = [0, 1].map((i) => addSvg(layers.eyes, 'circle', { 'clip-path': `url(#${clipId}-${i})` }));
  const glints = [0, 1].map((i) => addSvg(layers.eyes, 'circle', { 'clip-path': `url(#${clipId}-${i})` }));
  const rigStrokes = [];
  for (const side of ['left', 'right']) {
    for (const key of ['brow', 'upper', 'lower']) rigStrokes.push({ key, side, layer: 'eyes', chunks: rigStroke(random) });
  }
  for (const key of ['mouthTop', 'mouthBottom']) rigStrokes.push({ key, side: 'left', layer: 'mouth', chunks: rigStroke(random) });
  for (const stroke of rigStrokes) for (const chunk of stroke.chunks) chunk.element = addSvg(layers[stroke.layer], 'path', {});
  const face = {
    eyes: { from: { neutro: 1 }, to: { neutro: 1 } },
    mouth: { from: { neutro: 1 }, to: { neutro: 1 } },
    scale: { from: [1, 1], to: [1, 1] },
    changed: -1e9,
    browWidth: 7,
    lips: null,
    extras: {},
    blink: 0,
    gaze: [0, 0],
    eyeC: track(0.15),
    mouthC: track(0.15),
  };
  const faceT = (at) => easeOut(clamp(timing.morph ? (at - face.changed) / timing.morph : 1));
  let pupil;

  function positionPupils() {
    if (!pupil) return;
    const [x, y, radius] = pupil;
    const cy = y + face.gaze[1] * 3;
    for (let i = 0; i < pupils.length; i++) {
      const cx = (i ? 516 - x : x) + face.gaze[0] * 6;
      pupils[i].setAttribute('cx', cx);
      pupils[i].setAttribute('cy', cy);
      glints[i].setAttribute('cx', cx - radius * 0.35);
      glints[i].setAttribute('cy', cy - radius * 0.4);
    }
  }

  return {
    // yaw in [-1, 1] turns the head sideways, roll tilts it in degrees, bob moves it up and down.
    setPose({ yaw = 0, roll = 0, bob = 0 } = {}) {
      for (const [name, group] of Object.entries(layers)) {
        const depth = LAYER_DEPTH[name] ?? 0;
        const ear = EAR_SWING[name];
        const squeeze = ear ? Math.max(0.3, 1 + ear.grow * yaw) : depth > 0.4 ? 1 - 0.12 * Math.abs(yaw) : 1;
        const anchor = ear ? ear.anchor : 258;
        group.setAttribute('transform', `translate(${(yaw * TURN_SHIFT * depth).toFixed(2)} ${(bob * (depth >= 0 ? 1 : 0.5)).toFixed(2)}) `
          + `rotate(${(roll * (depth >= 0 ? 1 : 0.4)).toFixed(2)} 258 330) translate(${anchor} 0) scale(${squeeze.toFixed(3)} 1) translate(${-anchor} 0)`);
        // Lobes sit above the hair, so the far one must fade out as its ear turns behind the head.
        if (name.startsWith('lobe')) group.setAttribute('opacity', clamp((squeeze - 0.6) / 0.25).toFixed(2));
      }
    },

    // blink in [0, 1] closes the eyes over the current expression; gaze [x, y] in [-1, 1] moves the pupils.
    setLife({ blink = 0, gaze = [0, 0] } = {}) {
      face.blink = blink;
      face.gaze = gaze;
    },

    // Move the eyes of a finished drawing without redrawing its outlines.
    setGaze(gaze) {
      face.gaze = gaze;
      positionPupils();
    },

    update(scene, at) {
      colors = scene.colors;
      for (const slot of Object.keys(catalog)) {
        const target = scene.slots[slot] ?? { variant: 'none', c: 0.15, ink: 0 };
        let state = slots[slot];
        if (!state) {
          state = slots[slot] = { current: makeGroup(slot, target.variant, -1e9, 0), leaving: [], c: track(target.c), ink: track(target.ink) };
        } else if (state.current.variant !== target.variant) {
          state.current.leave = at;
          state.leaving.push(state.current);
          state.current = makeGroup(slot, target.variant, at, timing.out);
        }
        retarget(state.c, target.c, at);
        retarget(state.ink, target.ink, at);
      }
      const nextEyes = JSON.stringify(scene.face.eyes);
      const nextMouth = JSON.stringify(scene.face.mouth);
      if (nextEyes !== JSON.stringify(face.eyes.to) || nextMouth !== JSON.stringify(face.mouth.to) || scene.face.scale.join() !== face.scale.to.join()) {
        const t = faceT(at);
        face.eyes = { from: mixWeights(face.eyes.from, face.eyes.to, t), to: scene.face.eyes };
        face.mouth = { from: mixWeights(face.mouth.from, face.mouth.to, t), to: scene.face.mouth };
        face.scale = { from: face.scale.from.map((v, i) => lerp(v, face.scale.to[i], t)), to: scene.face.scale };
        face.changed = at;
      }
      face.browWidth = scene.face.browWidth ?? 7;
      face.lips = scene.face.lips ?? null;
      face.extras = { lashes: scene.face.lashes, eyeshadow: scene.face.eyeshadow, fangs: scene.face.fangs, browRaise: scene.face.browRaise };
      retarget(face.eyeC, scene.face.eyeC, at);
      retarget(face.mouthC, scene.face.mouthC, at);
    },

    busy(at) {
      const settling = (t) => at - t.changed < timing.settle;
      return Object.values(slots).some((s) => settling(s.c) || settling(s.ink) || s.leaving.length || at - s.current.enter < timing.in)
        || at - face.changed < timing.morph || settling(face.eyeC) || settling(face.mouthC);
    },

    // faceOnly redraws just the rig (eyes, brows, mouth): enough for blinks and gaze between boil frames.
    draw(at, frame, { faceOnly = false } = {}) {
      background.setAttribute('fill', colors.background ?? PAPER);
      for (const state of faceOnly ? [] : Object.values(slots)) {
        const base = sketchParams(valueOf(state.c, at), valueOf(state.ink, at));
        const p = fillScale === 1 ? base : { ...base, ink: base.ink * fillScale };
        const enter = timing.in ? clamp((at - state.current.enter) / timing.in) : 1;
        renderArt(state.current.art, p, frame, enter, colors);
        state.leaving = state.leaving.filter((group) => {
          const left = timing.out ? 1 - clamp((at - group.leave) / timing.out) : 0;
          if (left === 0) {
            for (const element of Object.values(group.groups)) element.remove();
            return false;
          }
          renderArt(group.art, p, frame, left, colors);
          return true;
        });
      }
      const t = faceT(at);
      const eyeWeights = mixWeights(face.eyes.from, face.eyes.to, t);
      const { shapes, pupil: currentPupil } = faceShapes(
        face.blink > 0 ? mixWeights(eyeWeights, { chiusi: 1 }, face.blink) : eyeWeights,
        mixWeights(face.mouth.from, face.mouth.to, t),
        face.scale.from.map((v, i) => lerp(v, face.scale.to[i], t)),
      );
      const eyeP = sketchParams(valueOf(face.eyeC, at), 1);
      const mouthP = sketchParams(valueOf(face.mouthC, at), 1);
      for (const stroke of rigStrokes) {
        const p = stroke.layer === 'eyes' ? eyeP : mouthP;
        // A raised brow breaks the rig symmetry: only the right one lifts and arches.
        const raise = stroke.key === 'brow' && stroke.side === 'right' && face.extras.browRaise;
        const points = shapes[stroke.key].map(([x, y], index) => (stroke.side === 'right'
          ? [516 - x, y - (raise ? 8 + 6 * Math.sin((Math.PI * index) / (SAMPLES - 1)) : 0)]
          : [x, y]));
        for (const chunk of stroke.chunks) {
          chunk.indices.forEach((index, i) => {
            [chunk.vertices[i].x, chunk.vertices[i].y] = points[index];
          });
          const lip = stroke.layer === 'mouth' && face.lips;
          chunk.element.setAttribute('fill', lip || (colors.ink ?? '#1b1b1f'));
          chunk.element.setAttribute('opacity', p.lineOpacity.toFixed(2));
          chunk.element.setAttribute('d', chunkPath(chunk, p, frame, true, stroke.key === 'brow' ? face.browWidth : lip ? 9 : 7, 1));
        }
      }
      mouthFill.setAttribute('d', toPath([...shapes.mouthTop, ...[...shapes.mouthBottom].reverse()]));
      mouthFill.setAttribute('fill', face.lips ? '#7a1424' : '#3a1f1f');
      mouthFill.setAttribute('opacity', mouthP.lineOpacity);
      // Lashes, eyeshadow and fangs follow the rig shapes, and so the expressions too.
      const side = (points, i) => points.map(([px, py]) => (i ? [516 - px, py] : [px, py]));
      [0, 1].forEach((i) => {
        const upper = side(shapes.upper, i);
        const shade = face.extras.eyeshadow;
        shadows[i].setAttribute('d', shade ? toPath([...upper, ...[...upper].reverse().map(([px, py]) => [px, py - 13])]) : '');
        shadows[i].setAttribute('fill', shade ?? 'none');
        shadows[i].setAttribute('opacity', 0.75 * eyeP.ink);
        [13, 15, 16].forEach((index, k) => {
          const [px, py] = upper[index];
          const dir = i ? -1 : 1;
          // Short, almost vertical lashes, detached from the lid, so the eye still reads as open.
          lashes[i * 3 + k].setAttribute('d', face.extras.lashes ? `M${px + dir * 2} ${py - 3} L${px + dir * (5 + k * 3)} ${py - 13 + k * 3}` : '');
          lashes[i * 3 + k].setAttribute('opacity', eyeP.lineOpacity);
          lashes[i * 3 + k].setAttribute('stroke', colors.ink ?? '#1b1b1f');
        });
      });
      [4, 12].forEach((index, i) => {
        const [px, py] = shapes.mouthTop[index];
        fangs[i].setAttribute('d', face.extras.fangs ? `M${px - 6} ${py} L${px} ${py + 14} L${px + 6} ${py} Z` : '');
      });
      pupil = currentPupil;
      const [, , radius] = pupil;
      [0, 1].forEach((i) => {
        const opening = toPath([...side(shapes.upper, i), ...[...side(shapes.lower, i)].reverse()]);
        clips[i].setAttribute('d', opening);
        whites[i].setAttribute('d', opening);
        whites[i].setAttribute('fill', colors.eyeWhite ?? '#fdfbf6');
        whites[i].setAttribute('opacity', eyeP.ink * eyeP.lineOpacity);
        pupils[i].setAttribute('r', radius);
        pupils[i].setAttribute('fill', colorOf(colors, 'eye'));
        pupils[i].setAttribute('opacity', eyeP.lineOpacity);
        glints[i].setAttribute('r', radius * 0.3);
        glints[i].setAttribute('fill', colors.glint ?? '#ffffff');
        glints[i].setAttribute('opacity', eyeP.ink);
      });
      positionPupils();
    },
  };
}

export const BOIL_FPS = 9;
export const boilFrame = (at) => Math.floor((at * BOIL_FPS) / 1000) % K;
export { SVG_NS };
