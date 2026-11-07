import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyMessage, describe, initialState, missesIn, restoreState, sceneFor } from '../src/dialogue.js';
import { catalog } from '../src/pieces.js';

const run = (...messages) => messages.reduce((acc, text, turn) => applyMessage(acc.state, text, turn), { state: initialState() });
const visible = (state) => Object.fromEntries(Object.entries(sceneFor(state).slots).filter(([, s]) => s.variant !== 'none').map(([k, s]) => [k, s.variant]));

test('the GitHub avatar example gives blond hair and a cigarette', () => {
  const { state, reply } = run('blond, cigarette in mouth');
  assert.equal(sceneFor(state).colors.hair, '#e8c15a');
  assert.equal(visible(state).smoke, 'cigarette');
  assert.doesNotMatch(reply, /I can't draw/);
});

test('a hat that covers the head leaves only the locks', () => {
  const { state } = run('long hair', 'black beanie');
  assert.equal(visible(state).hair, 'under');
  assert.equal(visible(state).hat, 'beanie');
});

test('a negation removes a piece', () => {
  const { state } = run('beard and glasses', 'no glasses');
  assert.equal(visible(state).eyewear, undefined);
  assert.match(visible(state).beard, /^beard-/);
});

test('ok finishes: everything at full confidence', () => {
  const { state } = run('tired eyes', 'ok');
  const scene = sceneFor(state);
  assert.ok(Object.values(scene.slots).every((s) => s.c === 1));
});

test('actions do not change the state', () => {
  const before = run('beard').state;
  for (const text of ['download', 'undo', 'help']) assert.equal(applyMessage(before, text).state, before);
  assert.equal(applyMessage(before, 'download').action, 'download');
});

test('an unknown word gets an honest reply', () => {
  const { reply, state } = run('spaceship');
  assert.match(reply, /(?:I can't draw|I don't know) "spaceship"/);
  assert.equal(state.started, false);
});

test('every catalog concept has a drawable English alias', async () => {
  const { traits } = await import('../src/lexicon.js');
  for (const [trait, [text]] of Object.entries(traits)) {
    assert.ok(text, trait);
    const { state } = run(text);
    assert.ok(state.started, text);
    for (const [slot, { variant }] of Object.entries(sceneFor(state).slots)) {
      assert.ok(catalog[slot]?.[variant], text + ": " + slot + "/" + variant);
    }
  }
});

test('new pieces come from the text', () => {
  const scene = sceneFor(run('round face, big nose, red bangs, lipstick and horns').state);
  assert.equal(scene.slots.head.variant, 'round');
  assert.equal(scene.slots.nose.variant, 'big');
  assert.equal(scene.slots.hair.variant, 'bangs');
  assert.equal(scene.slots.hat.variant, 'horns');
  assert.ok(scene.face.lips);
});

test('the beard follows the face shape', () => {
  assert.equal(sceneFor(run('square face and beard').state).slots.beard.variant, 'beard-square');
  assert.match(sceneFor(run('long beard').state).slots.beard.variant, /^longBeard-/);
});

test('a coloured background ends up in the scene colours', () => {
  assert.ok(sceneFor(run('green background').state).colors.background);
});

test('archetypes turn on several traits with one word', () => {
  const vampire = sceneFor(run('vampire').state);
  assert.equal(vampire.slots['detail:cape'].variant, 'on');
  assert.ok(vampire.face.fangs);
  const dev = sceneFor(run('developer').state);
  assert.equal(dev.slots.clothes.variant, 'hoodie');
  assert.equal(dev.slots.print.variant, 'code');
});

test('girl: lashes and long hair by default, but chosen hair wins', () => {
  const girl = sceneFor(run('girl').state);
  assert.ok(girl.face.lashes);
  assert.ok(['long', 'wavyLong', 'bob', 'ponytail', 'bun', 'highPonytail', 'pixie'].includes(girl.slots.hair.variant));
  assert.equal(sceneFor(run('girl with a mohawk').state).slots.hair.variant, 'mohawk');
});

test('long + wavy become long wavy hair', () => {
  assert.equal(sceneFor(run('long hair', 'wavy').state).slots.hair.variant, 'wavyLong');
});

test('a hijab covers hair and ears', () => {
  const scene = sceneFor(run('red hair', 'hijab').state);
  assert.equal(scene.slots.hair.variant, 'none');
  assert.equal(scene.slots.ears.variant, 'none');
});

test('meme expressions and archetypes', () => {
  const doomer = sceneFor(run('doomer').state);
  assert.equal(doomer.slots.hat.variant, 'beanie');
  assert.equal(doomer.colors.hat, '#34343c');
  assert.deepEqual(doomer.face.eyes, { vuoto: 1 });
  assert.deepEqual(sceneFor(run('chad').state).face.mouth, { compiaciuto: 1 });
  assert.equal(sceneFor(run('sobbing').state).slots['detail:tears'].variant, 'on');
});

test('smug raises an eyebrow', () => {
  assert.ok(sceneFor(run('smug').state).face.browRaise);
  assert.ok(sceneFor(run('raised eyebrow').state).face.browRaise);
  assert.ok(!sceneFor(run('happy').state).face.browRaise);
});

test('job and style archetypes', () => {
  const cop = sceneFor(run('cop').state);
  assert.equal(cop.slots.clothes.variant, 'uniform');
  assert.equal(cop.slots.hat.variant, 'cap');
  assert.equal(sceneFor(run('surfer').state).slots.hair.variant, 'wavyLong');
  assert.equal(sceneFor(run('grandma').state).slots.hair.variant, 'bun');
});

test('a near-miss word gets a suggestion', () => {
  assert.match(applyMessage(initialState(), 'chignonne').reply, /Did you mean/);
});

test('a real brand becomes an invented brand on the shirt', () => {
  const { state, reply } = run('nike hoodie');
  const scene = sceneFor(state);
  assert.equal(scene.slots.print.variant, 'brand');
  assert.notEqual(scene.colors.brandName.toLowerCase(), 'nike');
  assert.equal(sceneFor(run('nike t-shirt').state).colors.brandName, scene.colors.brandName);
  assert.match(reply, /made-up/);
});

test('the dialogue describes the avatar and offers the PNG in English', () => {
  const { reply, state } = run('blond guy with a beanie and a cigarette');
  assert.match(reply, /blond hair/);
  assert.match(reply, /beanie/);
  assert.match(applyMessage(state, 'download').reply, /PNG/);
});

test('every lexicon detail has a slot in the scene', async () => {
  const { traits } = await import('../src/lexicon.js');
  const special = ['cigarette', 'pipe', 'gum', 'lollipop', 'toothpick', 'rose', 'eyepatch', 'lipstick', 'lashes', 'eyeshadow', 'fangs'];
  for (const trait of Object.keys(traits).filter((t) => t.startsWith('detail:'))) {
    const name = trait.slice(7);
    if (special.includes(name)) continue;
    assert.ok(sceneFor(initialState()).slots[trait], `missing slot ${trait}`);
  }
});

test('colours reach accessories, beard and moustache', () => {
  const scene = sceneFor(run('green scarf, pink earmuffs, white beard').state);
  assert.equal(scene.colors.scarf, '#4f9a5f');
  assert.equal(scene.colors.earmuffs, '#ef9ac0');
  assert.equal(scene.colors.beard, '#ecebe6');
  assert.notEqual(scene.colors.hair, scene.colors.beard);
});

test('a suit has a tie, but not together with a bow tie', () => {
  assert.equal(sceneFor(run('suit').state).slots['detail:tie'].variant, 'on');
  assert.equal(sceneFor(run('suit with a bow tie').state).slots['detail:tie'].variant, 'none');
});

test('a broken or tampered shared state never crashes the scene', () => {
  for (const raw of [null, 'x', 42, {}, { hair: null }, { hair: { style: 5 } }, { details: 'x' }, { conf: { head: 9 } }, { started: true, hat: { type: 'x'.repeat(1000) } }]) {
    const state = restoreState(raw);
    assert.ok(sceneFor(state).slots.head);
    assert.ok(applyMessage(state, 'beard').reply);
  }
  const kept = restoreState({ ...run('blond with a beard').state, lang: 'it' });
  assert.equal(sceneFor(kept).colors.hair, '#e8c15a');
});

test('edge-case inputs stay short and sensible', () => {
  assert.ok(applyMessage(initialState(), 'x'.repeat(20000)).reply.length < 200);
  assert.equal(applyMessage(initialState(), 'no no no').state.started, false);
  assert.match(applyMessage(initialState(), 'red').reply, /for what/);
  assert.match(applyMessage(initialState(), 'red green hair').reply, /green hair/);
  assert.doesNotMatch(applyMessage(initialState(), 'red green hair').reply, /red hair/);
});

test('the drawing has a readable description', () => {
  assert.match(describe(initialState()), /nothing described/);
  const description = describe(run('blond guy with a beanie').state);
  assert.match(description, /blond hair/);
  assert.match(description, /beanie/);
});

test('unmentioned traits vary between descriptions but stay stable for one', () => {
  const looks = new Set();
  for (const text of ['glasses', 'beard', 'sad', 'cigarette', 'red beanie', 'happy', 'headphones', 'beauty mark']) {
    const scene = sceneFor(run(text).state);
    looks.add(`${scene.slots.hair.variant}|${scene.colors.hair}|${scene.slots.clothes.variant}|${scene.slots.head.variant}`);
  }
  assert.ok(looks.size >= 5, `only ${looks.size} different looks`);
  const first = run('glasses').state;
  const later = applyMessage(first, 'smile').state;
  assert.equal(sceneFor(later).slots.hair.variant, sceneFor(first).slots.hair.variant);
  assert.equal(sceneFor(later).colors.clothes, sceneFor(first).colors.clothes);
  assert.equal(restoreState(later).seed, later.seed);
});

test('surprise me makes a random but valid character', () => {
  const looks = new Set();
  for (let i = 0; i < 20; i++) {
    const { state, action } = applyMessage(initialState(), 'surprise me', 0, i / 20);
    assert.equal(action, 'random');
    const scene = sceneFor(state);
    for (const [slot, { variant }] of Object.entries(scene.slots)) assert.ok(catalog[slot]?.[variant], `${slot}/${variant}`);
    looks.add(JSON.stringify(Object.values(scene.slots).map((s) => s.variant)));
  }
  assert.ok(looks.size >= 15);
  assert.match(applyMessage(initialState(), 'surprise me', 0, 0.3).reply, /random/);
});

test('misses are only the meaningful unknown words', () => {
  assert.deepEqual(missesIn('bald person with a blender on his head'), ['blender']);
  assert.deepEqual(missesIn('blond, cigarette in mouth'), []);
  assert.deepEqual(missesIn('ok download'), []);
});

test('reports carry single lowercase words only, never names', async () => {
  globalThis.navigator ??= {};
  const { reportableWords, REPORT_ENDPOINT } = await import('../src/misses.js');
  assert.deepEqual(reportableWords(['blender', 'maria', 'x', 'ab12'], 'Maria with a blender'), ['blender']);
  assert.equal(REPORT_ENDPOINT, '', 'the published code must not point to a collector until it is deployed on purpose');
});

test('the description includes colours, background and print', () => {
  const text = describe(run('red beanie, green scarf, white beard, striped nike hoodie, blue background').state);
  for (const part of ['red beanie', 'green scarf', 'white beard', 'blue background', 'stripes', 'print']) assert.ok(text.includes(part), `${part} in ${text}`);
});

test('item and colour merge in the reply', () => {
  assert.match(run('red beanie').reply, /red beanie/);
  const { reply } = run('black hoodie and red beanie');
  assert.match(reply, /black hoodie/);
  assert.match(reply, /red beanie/);
});
