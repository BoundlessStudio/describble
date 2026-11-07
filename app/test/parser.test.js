import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/parser.js';
import { corpus } from './corpus.js';

// The labelled corpus must not regress: coverage of in-catalog traits over the whole corpus.
test('corpus coverage stays at 92% or more', () => {
  let wanted = 0;
  let caught = 0;
  for (const [text, expected] of corpus) {
    const { found, removed } = parse(text);
    for (const trait of expected) {
      wanted += 1;
      if (trait.startsWith('-') ? removed.includes(trait.slice(1)) : found.includes(trait)) caught += 1;
    }
  }
  assert.ok(caught / wanted >= 0.92, `coverage ${(caught / wanted * 100).toFixed(1)}%`);
});

test('realistic English phrases stay recognised', () => {
  const cases = { 'cute anime girl with twin tails': 'hair:pigtails', 'guy with a man bun': 'hair:bun', 'dreadlocks': 'hair:dreads', 'pixel glasses': 'eyewear:pixel' };
  for (const [text, trait] of Object.entries(cases)) assert.ok(parse(text).found.includes(trait), text);
});

test('the fedora and open shirt retain their specific styles', () => {
  const { found } = parse('fedora, matrix glasses, open black shirt');
  assert.deepEqual(found, ['hat:fedora', 'eyewear:slim', 'clothes:openShirt', 'clothesColor:black']);
  assert.ok(!parse('open jacket').found.includes('clothes:openShirt'));
});

test('piercings and stretched lobes', () => {
  const cases = { 'ear gauges': 'detail:gauges', 'septum ring': 'detail:septum', 'eyebrow piercing': 'detail:browPiercing', 'snake bites': 'detail:lipRing',
    'labret': 'detail:labret', 'nose stud': 'detail:nostril', 'industrial': 'detail:industrial', 'helix': 'detail:helix' };
  for (const [text, trait] of Object.entries(cases)) assert.ok(parse(text).found.includes(trait), text);
  const many = parse('lots of piercings').found;
  for (const trait of ['detail:gauges', 'detail:septum', 'detail:lipRing', 'detail:browPiercing']) assert.ok(many.includes(trait), trait);
});

test('everyday words: tracksuit, curlers, reading glasses, side shave, biker', () => {
  const cases = {
    'tracksuit': 'clothes:tracksuit', 'grandma with curlers': 'detail:curlers', 'reading glasses': 'eyewear:reading',
    'side shave': 'hair:undercut', 'half shaved head': 'hair:undercut', 'biker': 'clothes:jacket',
  };
  for (const [text, trait] of Object.entries(cases)) assert.ok(parse(text).found.includes(trait), `${text}: ${parse(text).found}`);
  assert.ok(!parse('half shaved head').found.includes('hair:bald'));
});

test('colour synonyms map to the nearest drawable colour', () => {
  const cases = { 'fuchsia hair': 'hairColor:pink', 'lavender hair': 'hairColor:purple', 'burgundy hoodie': 'clothesColor:red', 'silver hair': 'hairColor:grey',
    'jet black hair': 'hairColor:black', 'hoodie teal': 'clothesColor:blue', 'army green hoodie': 'clothesColor:green', 'platinum blonde hair': 'hairColor:blond' };
  for (const [text, trait] of Object.entries(cases)) assert.ok(parse(text).found.includes(trait), text);
  assert.ok(!parse('army green hoodie').found.includes('clothes:uniform'));
  assert.ok(parse('clerical collar').found.includes('clothes:clerical'));
  assert.ok(!parse("i don't know").found.includes('clothes:clerical'));
});

test('more headwear: hard hat, bowler, graduation cap, nun veil', () => {
  const cases = { 'hard hat': 'hat:helmet', 'bowler hat': 'hat:bowler', 'graduation cap': 'hat:graduation', 'nun': 'hat:veil', 'tiara': 'hat:crown', 'hijab': 'hat:hijab' };
  for (const [text, trait] of Object.entries(cases)) assert.ok(parse(text).found.includes(trait), `${text}: ${parse(text).found}`);
});

test('everyday english: perm, aviators, denim, braces', () => {
  const cases = { 'old lady with a perm': 'hair:curly', 'mullet and aviators': 'eyewear:aviators', 'denim jacket': 'clothesColor:blue', 'kid with braces': 'detail:braces' };
  for (const [text, trait] of Object.entries(cases)) assert.ok(parse(text).found.includes(trait), `${text}: ${parse(text).found}`);
  assert.deepEqual(parse('person with rosy cheeks').unknown.filter((w) => !['with'].includes(w)), []);
});

test('pajamas are a striped shirt unless another pattern is named', () => {
  assert.ok(parse('pajamas').found.includes('pattern:stripes'));
  const dots = parse('pajamas with polka dots').found.filter((t) => t.startsWith('pattern:'));
  assert.equal(dots.at(-1), 'pattern:dots');
  assert.ok(parse('messy bun and a scrunchie').found.includes('detail:hairclip'));
});

test('a generic hat leaves an occupation’s hat in place', () => {
  assert.ok(parse('chef with a hat').found.includes('hat:chef'));
  assert.ok(!parse('chef with a hat').found.includes('hat:generic'));
  assert.ok(parse('a hat').found.includes('hat:generic'));
  const cases = { 'student with a backpack': 'detail:backpack', 'doctor with a stethoscope': 'detail:stethoscope',
    'fireman': 'hat:helmet', 'painter': 'hat:beret', 'waiter': 'detail:bowtie', 'mechanic': 'clothes:overalls', 'footballer': 'clothes:tshirt' };
  for (const [text, trait] of Object.entries(cases)) assert.ok(parse(text).found.includes(trait), text);
});

test('words people typed on launch day', () => {
  const cases = {
    'dark hair': 'hairColor:black', 'dark jacket': 'clothesColor:black', 'blue-eyed girl': 'eyeColor:blue', 'girl in a blouse': 'clothes:shirt',
    'checked shirt': 'pattern:plaid', 'feminine guy': 'gender:female', 'skinny guy': 'face:long',
    'woodchopper': 'facial:beard', 'burglar': 'pattern:stripes',
  };
  for (const [text, trait] of Object.entries(cases)) assert.ok(parse(text).found.includes(trait), `${text}: ${parse(text).found}`);
  assert.ok(parse('dark skin').found.includes('skin:dark'));
  assert.ok(!parse('dark skin').found.includes('hairColor:black'));
  assert.deepEqual(parse('glasses from describble').unknown, []);
});

test('the parser uses the English vocabulary', () => {
  assert.ok(parse('pink curly hair and round glasses').found.includes('hair:curly'));
  assert.deepEqual(parse('capelli ricci').found, []);
  assert.deepEqual(parse('cabelo cacheado').found, []);
  assert.deepEqual(parse('no glasses').removed, ['eyewear:glasses']);
});

test('more English style synonyms', () => {
  const cases = {
    'fair hair': 'hairColor:blond', 'fair, freckles': 'skin:pale', 'bold guy': 'hair:bald', 'bold eyebrows': 'brows:thick',
    'cross necklace': 'detail:necklace', 'triangle earrings': 'detail:earring', 'liner': 'detail:eyeshadow', 'devilish smile': 'mouth:smirk',
    'windblown hair': 'hair:messy', 'drugged': 'mood:tired',
  };
  for (const [text, trait] of Object.entries(cases)) assert.ok(parse(text).found.includes(trait), `${text}: ${parse(text).found}`);
  assert.deepEqual(parse('extremely tired').unknown, []);
  assert.ok(!parse('bold eyebrows').found.includes('hair:bald'));
});

test('stretched words are read as the word they stretch', () => {
  const cases = { 'greeen eyes': 'eyeColor:green', 'loooong hair': 'hair:long', 'baaald': 'hair:bald', 'glassses': 'eyewear:glasses', 'happpy': 'mood:happy' };
  for (const [text, trait] of Object.entries(cases)) assert.ok(parse(text).found.includes(trait), `${text}: ${parse(text).found}`);
  assert.deepEqual(parse('eyees').unknown, []);
});

test('a colour between two nouns goes to the one that has no colour yet', () => {
  const cases = {
    'green hat purple t-shirt': ['hatColor:green', 'clothesColor:purple'], 'blue eyes red hair': ['eyeColor:blue', 'hairColor:red'],
    'red scarf blue jacket': ['itemColor:scarf.red', 'clothesColor:blue'],
  };
  for (const [text, traits] of Object.entries(cases)) {
    const { found } = parse(text);
    for (const trait of traits) assert.ok(found.includes(trait), `${text}: ${found}`);
  }
  assert.ok(!parse('green hat purple t-shirt').found.includes('hatColor:purple'));
  // With a single noun, both colours still belong to it.
  assert.deepEqual(parse('red and blue scarf').found.filter((t) => t.startsWith('itemColor')).sort(), ['itemColor:scarf.blue', 'itemColor:scarf.red']);
});

test('words people typed on the r/webdev day: skin as a noun, noses, moods, joined words', () => {
  const cases = {
    'white skin': 'skin:pale', 'skin tone dark': 'skin:dark', 'light brown skin': 'skin:tan',
    'round nose': 'nose:button', 'bulbous nose': 'nose:big', 'big nouse': 'nose:big', 'strong chin': 'face:square',
    'confident guy': 'mood:smug', 'excited girl': 'mood:happy', 'horrified man': 'mood:scared',
    'redglasses': 'eyewear:glasses', 'longbeard': 'facial:longBeard',
  };
  for (const [text, trait] of Object.entries(cases)) assert.ok(parse(text).found.includes(trait), `${text}: ${parse(text).found}`);
  // A colour next to skin never becomes a hair or accent colour, and yellow skin draws nothing.
  assert.deepEqual(parse('yellow skin').found, []);
  assert.ok(!parse('white skin').found.some((t) => t.startsWith('accent:')));
  for (const text of ['wearing a hat', 'slightly tired', 'fairly long hair']) {
    assert.deepEqual(parse(text).unknown.filter((w) => w !== 'a'), [], text);
  }
  // Joined words split only into real entries: "leather" stays one word.
  assert.ok(parse('leather jacket').found.includes('clothes:jacket'));
});
