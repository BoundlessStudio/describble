import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/parser.js';
import { applyMessage, initialState, sceneFor } from '../src/dialogue.js';
import { createStage } from '../src/stage.js';
import { moodEyes, moodMouth, mouthShapes } from '../src/rig.js';
import { renderSvg } from '../scripts/render-svg.mjs';
import { portraitIdeas } from './portrait-ideas.js';

const grammar = new Set('a add an and few in no on one or the two with without'.split(' '));

test('all 1,000 ideas resolve to their intended traits, colours and omissions', () => {
  assert.equal(portraitIdeas.length, 1000);
  assert.equal(new Set(portraitIdeas.map(({ description }) => description)).size, 1000);
  const themes = new Map();
  for (const { theme } of portraitIdeas) themes.set(theme, (themes.get(theme) ?? 0) + 1);
  assert.equal(themes.size, 20);
  for (const count of themes.values()) assert.equal(count, 50);

  for (const { description, expected } of portraitIdeas) {
    const { found, removed, unknown } = parse(description);
    assert.deepEqual(unknown.filter((word) => !grammar.has(word)), [], description);
    const traits = [...found, ...removed.map((trait) => `-${trait}`)];
    assert.deepEqual(traits.sort(), [...expected].sort(), description);
  }
});

const sceneSlots = {
  face: 'head', hair: 'hair', hat: 'hat', clothes: 'clothes',
  eyewear: 'eyewear', nose: 'nose', ears: 'ears', pattern: 'pattern', print: 'print',
};
const paint = {
  skin: ['skin', 'head'],
  hairColor: ['hair', 'front', 'back'],
  beardColor: ['beard', 'facial', 'mouthAcc'],
  hatColor: ['hat', 'hat', 'back'],
  clothesColor: ['clothes', 'body'],
  eyewearColor: ['frames', 'eyewear'],
  eyeColor: ['eye', 'eyes'],
  backgroundColor: ['background', 'paper'],
};

function collectPaint(root) {
  const fills = new Map();
  function visit(node, layer) {
    const ownLayer = node.attrs['data-layer'] ?? layer;
    if (node.attrs.fill) {
      if (!fills.has(ownLayer)) fills.set(ownLayer, new Set());
      fills.get(ownLayer).add(node.attrs.fill);
    }
    for (const child of node.children) visit(child, ownLayer);
  }
  visit(root, 'paper');
  return fills;
}

function drawsTrait(state, scene, fills, trait) {
  const [slot, value] = trait.split(':');
  if (sceneSlots[slot]) return scene.slots[sceneSlots[slot]].variant === value;
  if (slot === 'facial') return ['beard', 'moustache'].some((key) => {
    const { variant } = scene.slots[key];
    return variant === value || variant === `${value}-${scene.slots.head.variant}`;
  });
  if (slot === 'detail') {
    if (scene.slots[trait]) return scene.slots[trait].variant === 'on';
    if (value === 'eyepatch') return scene.slots.eyewear.variant === 'eyepatch';
    if (value === 'lipstick') return state.lipstick && !!scene.face.lips;
    if (value === 'lashes' || value === 'eyeshadow' || value === 'fangs') return !!scene.face[value];
    return scene.slots.smoke.variant === value;
  }
  if (slot === 'mood') return state.mood === value && isDeepStrictEqual(scene.face.eyes, moodEyes[value])
    && (state.mouth || isDeepStrictEqual(scene.face.mouth, moodMouth[value]));
  if (slot === 'mouth') return isDeepStrictEqual(scene.face.mouth, mouthShapes[value]);
  if (slot === 'eyes') return state.eyeShape === value || state.eyeSize === value;
  if (slot === 'brows') return value === 'raised' ? scene.face.browRaise : scene.face.browWidth === (value === 'thick' ? 11 : 5);
  if (slot === 'itemColor') {
    const [item, color] = value.split('.');
    const eyeshadow = item === 'eyeshadow';
    const layer = eyeshadow ? 'skinDetail' : item === 'earmuffs' ? 'over' : 'bodyOver';
    const fill = eyeshadow ? scene.face.eyeshadow : scene.colors[item];
    return state.itemColors[item] === color && fills.get(layer)?.has(fill);
  }
  if (paint[slot]) {
    const [key, ...layers] = paint[slot];
    const assigned = { hairColor: state.hair.color, hatColor: state.hat.color, clothesColor: state.clothes.color, backgroundColor: state.background };
    const fill = scene.colors[key];
    return (assigned[slot] ?? state[slot]) === value && layers.some((layer) => fills.get(layer)?.has(fill));
  }
  throw new Error(`No drawing assertion for ${trait}`);
}

test('all 1,000 ideas render distinct SVG portraits with the requested visual features', () => {
  const portraits = new Map();
  for (const { description, expected } of portraitIdeas) {
    // Use one seed so a missing trait or a duplicate cannot be hidden by random defaults.
    const { state, action } = applyMessage({ ...initialState(), seed: 42 }, description);
    assert.equal(action, null, description);
    assert.ok(state.started, description);
    const scene = sceneFor({ ...state, confirmed: true });
    let fills;
    const svg = renderSvg((root) => {
      const stage = createStage(root, { instant: true });
      stage.update(scene, 0);
      stage.draw(0, 0);
      fills = collectPaint(root);
    });
    assert.match(svg, /viewBox="0 0 512 512"/, description);
    assert.doesNotMatch(svg, /\b(?:NaN|Infinity|undefined)\b/, description);
    for (const trait of expected) {
      const removed = trait.startsWith('-');
      const name = removed ? trait.slice(1) : trait;
      if (removed) assert.ok(state.removed.includes(name), `${description}: ${name} was not removed`);
      assert.equal(Boolean(drawsTrait(state, scene, fills, name)), !removed, `${description}: drawing differs for ${trait}`);
    }
    const signature = createHash('sha256').update(svg.replace(/\beye\d+(?=-)/g, 'eye')).digest('hex');
    assert.ok(!portraits.has(signature), `${description} draws the same portrait as "${portraits.get(signature)}"`);
    portraits.set(signature, description);
  }
});
