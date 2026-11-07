// Character state and chat replies. Pure: no DOM, so it is testable in Node.
import { hash } from './geometry.js';
import { parse, tokenize } from './parser.js';
import { traits } from './lexicon.js';
import { hatHidesAll, hatKeepsHair } from './pieces.js';
import { moodEyes, moodMouth, mouthShapes } from './rig.js';

const NAMED = 0.7;
const REPEATED = 0.2;
const DEFAULT = 0.55;
const START = 0.12;

// lashes, eyeshadow and fangs live in state.details but are not pieces: the rig draws them.
const MOUTH_ITEMS = ['cigarette', 'pipe', 'gum', 'lollipop', 'toothpick', 'rose'];
const MOUSTACHE_STYLES = new Set(['moustache', 'handlebar', 'pencilMoustache']);
export const DETAILS = [
  'earmuffs', 'doubleChin', 'dimples', 'cheekbones', 'bowtie', 'badge', 'pencilEar', 'flowerEar',
  'sunglassesHead', 'earbuds', 'headset', 'cyborg', 'ninja', 'warpaint', 'beautyMark', 'choker',
  'hoops', 'bow', 'hairclip', 'cape', 'earring', 'piercing', 'scar', 'freckles', 'headphones',
  'tattoo', 'bags', 'mask', 'wrinkles', 'scarf', 'necklace', 'tie', 'sideburns', 'acne', 'unibrow',
  'tears', 'sweat', 'bandaid', 'clownNose', 'gauges', 'helix', 'industrial', 'septum', 'browPiercing',
  'bridgePiercing', 'lipRing', 'labret', 'monroe', 'nostril', 'curlers', 'braces', 'backpack', 'stethoscope',
  'camera', 'lanyard', 'headlamp', 'hearingAid', 'locket', 'boloTie', 'pearlStuds', 'pearlNecklace',
  'blush', 'sunburn', 'chinCleft', 'faceStars', 'lapelPin', 'nameTag',
];

export function initialState() {
  return {
    brand: null,
    seed: null,
    beardColor: null,
    itemColors: {},
    hair: { style: null, color: null },
    hat: { type: null, color: null },
    clothes: { type: null, color: null },
    beard: null,
    moustache: null,
    eyewear: null,
    eyewearColor: null,
    smoke: null,
    details: [],
    removed: [],
    mood: null,
    mouth: null,
    eyeSize: null,
    eyeColor: null,
    skin: null,
    age: null,
    face: null,
    nose: null,
    ears: null,
    eyeShape: null,
    pattern: null,
    print: null,
    gender: null,
    background: null,
    brows: null,
    lipstick: false,
    conf: {},
    started: false,
    confirmed: false,
  };
}

// ---------- intents ----------
const intentWords = {
  download: ['download', 'png', 'export', 'save'],
  reset: ['reset', 'restart', 'start over', 'new character'],
  undo: ['undo', 'go back'],
  help: ['help', 'what can'],
  random: ['random', 'surprise me', 'roll', 'randomize'],
  confirm: ['ok', 'okay', 'perfect', 'yes', 'done', 'great', 'nice', 'top'],
};
function intentOf(text) {
  const tokens = tokenize(text).filter((t) => /[a-z]/.test(t));
  const joined = ` ${tokens.join(' ')} `;
  for (const [intent, words] of Object.entries(intentWords)) {
    // The short "roll" command is also part of descriptions like "roll-neck top".
    if (words.some((word) => word === 'roll' ? joined === ' roll ' : joined.includes(` ${word} `))) return intent;
  }
  return null;
}

// ---------- reply labels ----------
const englishOverride = { 'clothes:tshirt': 't-shirt', 'gender:female': 'feminine features', 'hat:generic': 'hat', 'detail:bags': 'eye bags', 'hair:bald': 'bald', 'face:oval': 'oval face', 'eyewear:hearts': 'heart glasses', 'eyewear:round': 'round glasses', 'hat:capBack': 'backwards cap', 'eyes:big': 'big eyes', 'eyes:small': 'small eyes', 'eyes:almond': 'almond eyes', 'eyes:round': 'round eyes', 'print:code': 'code print', 'hair:pigtails': 'pigtails', 'detail:hoops': 'hoop earrings', 'hair:buzz': 'buzz cut', 'clothes:tank': 'tank top', 'clothes:puffer': 'puffer jacket', 'clothes:varsity': 'varsity jacket', 'clothes:openShirt': 'open shirt', 'eyewear:slim': 'slim sunglasses', 'detail:gauges': 'ear gauges', 'detail:helix': 'helix piercing', 'detail:industrial': 'industrial piercing', 'detail:septum': 'septum ring', 'detail:browPiercing': 'eyebrow piercing', 'detail:bridgePiercing': 'bridge piercing', 'detail:lipRing': 'lip ring', 'detail:labret': 'labret', 'detail:monroe': 'monroe piercing', 'detail:nostril': 'nose stud', 'eyewear:reading': 'reading glasses', 'detail:curlers': 'hair curlers', 'clothes:clerical': 'clerical collar', 'hat:helmet': 'hard hat', 'hat:bowler': 'bowler hat', 'hat:graduation': 'graduation cap', 'hat:veil': 'veil', 'detail:braces': 'braces', 'detail:backpack': 'backpack', 'detail:stethoscope': 'stethoscope' };
const words = (value) => value.replace(/([A-Z])/g, ' $1').toLowerCase();
// Leave colours separate for pieces whose labels are plural.
const pluralItems = new Set(['hat:catEars', 'hat:bunnyEars', 'hat:foxEars', 'hat:horns', 'hat:pompom']);

// Combine an item and its colour into one label, such as "red beanie".
// Slots that hold one value: when a message names two, only the last one is drawn and listed.
const singleSlots = new Set(['hat', 'clothes', 'eyewear', 'mood', 'mouth', 'face', 'nose', 'ears', 'skin', 'hair', 'pattern', 'print']);
function labelsFor(allTraits) {
  const traits = allTraits.filter((trait, i) => {
    const slot = trait.split(':')[0];
    return !singleSlots.has(slot) || !allTraits.slice(i + 1).some((later) => later.split(':')[0] === slot);
  });
  const merged = new Set();
  const out = [];
  for (const [itemSlot, colorSlot] of [['hat', 'hatColor'], ['clothes', 'clothesColor']]) {
    const item = traits.find((t) => t.startsWith(`${itemSlot}:`));
    const color = traits.find((t) => t.startsWith(`${colorSlot}:`));
    if (!item || !color || pluralItems.has(item)) continue;
    const value = color.split(':')[1];
    out.push(`${value} ${label(item)}`);
    merged.add(item);
    merged.add(color);
  }
  return [...new Set([...traits.filter((t) => !merged.has(t)).map(label), ...out])];
}

function label(trait) {
  const [slot, value] = trait.split(':');
  if (slot === 'brand') return 'brand';
  const nouns = { hairColor: 'hair', eyeColor: 'eyes', clothesColor: 'clothes', hatColor: 'hat', backgroundColor: 'background', beardColor: 'beard', eyewearColor: 'eyewear' };
  if (slot === 'itemColor') return `${value.split('.')[1]} ${words(value.split('.')[0])}`;
  if (nouns[slot]) return `${value} ${nouns[slot]}`;
  if (englishOverride[trait]) return englishOverride[trait];
  if (slot === 'hair') return `${words(value)} hair`;
  if (slot === 'face' || slot === 'nose' || slot === 'ears') return `${words(value)} ${slot}`;
  return words(value);
}

const copy = {
  done: ['Done:', 'Ok:', 'Drawn:', 'Here:'],
  removed: 'Removed:',
  unknownTail: (list) => `I can't draw "${list}" yet.`,
  hint: 'Type "ok" to finish, "download" for the PNG.',
  reset: 'Starting over. Describe someone.',
  undo: 'Going back.',
  download: 'Here is your PNG, ready for GitHub.',
  help: 'Try: "blond, cigarette in mouth", "beard and black beanie", "tired eyes", "grey hoodie and headphones", "no glasses". Then "download" for the PNG.',
  confirm: 'Inked. Type "download" for the PNG.',
  random: 'Here is someone random. Type to change them, or "surprise me" for another.',
  stray: (color) => `${color}… for what? Hair, hat, eyes or clothes?`,
  guess: (word, guess) => `I don't know "${word}". Did you mean "${guess}"?`,
  unknown: (word) => `I can't draw "${word}" yet. Try hair, beard, glasses, hat, mood or clothes.`,
  empty: 'Describe the character: hair, beard, glasses, hat, mood…',
  brand: (name) => `No real brands: here's "${name}", a made-up one.`,
  greet: 'Describe a character. For example: "blond, cigarette in mouth".',
  resume: 'Picked up where you left off. Keep describing.',
  placeholder: 'blond, cigarette in mouth…',
};
// Text description of the current character, used as the drawing's accessible name.
export function describe(state) {
  const traits = [];
  const add = (condition, trait) => { if (condition) traits.push(trait); };
  add(state.gender, `gender:${state.gender}`);
  add(state.age, `age:${state.age}`);
  add(state.face, `face:${state.face}`);
  add(state.skin, `skin:${state.skin}`);
  add(state.ears, `ears:${state.ears}`);
  add(state.nose, `nose:${state.nose}`);
  add(state.hair?.color, `hairColor:${state.hair?.color}`);
  add(state.hair?.style, `hair:${state.hair?.style}`);
  add(state.hat?.type, `hat:${state.hat?.type}`);
  add(state.hat?.color, `hatColor:${state.hat?.color}`);
  add(state.beard, `facial:${state.beard}`);
  add(state.moustache, `facial:${state.moustache}`);
  add(state.beardColor, `beardColor:${state.beardColor}`);
  add(state.eyewear, `eyewear:${state.eyewear}`);
  add(state.eyewearColor, `eyewearColor:${state.eyewearColor}`);
  add(state.eyeColor, `eyeColor:${state.eyeColor}`);
  add(state.eyeShape || state.eyeSize, `eyes:${state.eyeShape ?? state.eyeSize}`);
  add(state.brows, `brows:${state.brows}`);
  add(state.mood, `mood:${state.mood}`);
  add(state.mouth, `mouth:${state.mouth}`);
  add(state.lipstick, 'detail:lipstick');
  add(state.clothes?.color, `clothesColor:${state.clothes?.color}`);
  add(state.clothes?.type, `clothes:${state.clothes?.type}`);
  add(state.pattern, `pattern:${state.pattern}`);
  add(state.print && state.print !== 'brand', `print:${state.print}`);
  add(state.smoke, `detail:${state.smoke}`);
  for (const name of state.details ?? []) {
    const color = state.itemColors?.[name];
    traits.push(color ? `itemColor:${name}.${color}` : `detail:${name}`);
  }
  add(state.background, `backgroundColor:${state.background}`);
  if (!traits.length) return 'Avatar sketch, nothing described yet';
  const labels = labelsFor(traits);
  if (state.brand) labels.push(`"${state.brand}" print`);
  return `Avatar: ${labels.join(', ')}`;
}

export const greeting = (resumed) => (resumed ? copy.resume : copy.greet);
export const placeholder = copy.placeholder;

// Brands: a real name always maps to the same invented brand.
const fakeBrands = ['ZORP', 'BLAMO', 'KROOK', 'VEXO', 'MUNKO', 'PLIXX', 'GLOOB', 'NUBBO', 'SKREE', 'FOMO', 'YEETO', 'BONKA', 'WOMPA', 'ZAPPO', 'GRUNT', 'FLUFF'];
function fakeBrand(real) {
  let h = 0;
  for (const c of real) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return fakeBrands[h % fakeBrands.length];
}

const pick = (list, seed) => list[seed % list.length];

// Near misses: the parser fixes one typo on its own; here we suggest words up to two edits away.
const knownWords = [...new Set(Object.values(traits).flat().filter((w) => !w.includes(' ') && w.length >= 4))];
function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const kept = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = kept;
    }
  }
  return row[b.length];
}
function closestWord(word) {
  if (word.length < 4) return null;
  let best = null;
  let bestDistance = 3;
  for (const known of knownWords) {
    if (Math.abs(known.length - word.length) > 2) continue;
    const distance = editDistance(word, known);
    if (distance < bestDistance) [best, bestDistance] = [known, distance];
  }
  return best;
}
const stopWords = new Set('the a an with and of in on his her he she is has have very really guy dude man woman person someone looks like mouth hand head face without remove hello hey coffee joint energy drink leather boots neck sides kid framed'.split(' '));

// ---------- state updates ----------
function bump(state, slot) {
  state.conf[slot] = state.conf[slot] ? Math.min(0.9, state.conf[slot] + REPEATED) : NAMED;
}

function applyTrait(state, trait) {
  const [slot, value] = trait.split(':');
  state.removed = state.removed.filter((t) => t !== trait);
  switch (slot) {
    case 'hair': {
      const wavy = (value === 'curly' && state.hair.style === 'long') || (value === 'long' && state.hair.style === 'curly');
      state.hair.style = wavy ? 'wavyLong' : value;
      bump(state, 'hair');
      break;
    }
    case 'gender': state.gender = value; bump(state, 'head'); break;
    case 'brand': state.brand = fakeBrand(value); state.print = 'brand'; bump(state, 'clothes'); break;
    case 'print': state.print = value; bump(state, 'clothes'); break;
    case 'hairColor': state.hair.color = value; bump(state, 'hair'); break;
    case 'hat': state.hat.type = value; bump(state, 'hat'); break;
    case 'hatColor': state.hat.color = value; bump(state, 'hat'); break;
    case 'clothes': state.clothes.type = value; bump(state, 'clothes'); break;
    case 'clothesColor': state.clothes.color = value; bump(state, 'clothes'); break;
    case 'facial':
      if (MOUSTACHE_STYLES.has(value)) state.moustache = value;
      else state.beard = value;
      if (value === 'longBeard') bump(state, 'beard');
      bump(state, MOUSTACHE_STYLES.has(value) ? 'moustache' : 'beard');
      break;
    case 'eyewear': state.eyewear = value; bump(state, 'eyewear'); break;
    case 'eyewearColor': state.eyewearColor = value; bump(state, 'eyewear'); break;
    case 'detail':
      if (MOUTH_ITEMS.includes(value)) {
        state.smoke = value;
        bump(state, 'smoke');
      } else if (value === 'lipstick') {
        state.lipstick = true;
        bump(state, 'mouth');
      } else if (value === 'eyepatch') {
        state.eyewear = 'eyepatch';
        bump(state, 'eyewear');
      } else {
        if (!state.details.includes(value)) state.details.push(value);
        bump(state, `detail:${value}`);
      }
      break;
    case 'mood': state.mood = value; bump(state, 'eyes'); if (!state.mouth) bump(state, 'mouth'); break;
    case 'mouth': state.mouth = value; bump(state, 'mouth'); break;
    case 'eyes':
      if (value === 'almond' || value === 'round') state.eyeShape = value;
      else state.eyeSize = value;
      bump(state, 'eyes');
      break;
    case 'ears': state.ears = value; bump(state, 'ears'); break;
    case 'pattern': state.pattern = value; bump(state, 'clothes'); break;
    case 'backgroundColor': state.background = value; break;
    case 'beardColor': state.beardColor = value; bump(state, 'beard'); break;
    case 'itemColor': {
      const [item, color] = value.split('.');
      state.itemColors = { ...state.itemColors, [item]: color };
      bump(state, `detail:${item}`);
      break;
    }
    case 'eyeColor': state.eyeColor = value; bump(state, 'eyes'); break;
    case 'skin': state.skin = value; bump(state, 'head'); break;
    case 'face': state.face = value; bump(state, 'head'); break;
    case 'nose': state.nose = value; bump(state, 'nose'); break;
    case 'brows': state.brows = value; bump(state, 'eyes'); break;
    case 'age': state.age = value; bump(state, 'head'); break;
    default: return false;
  }
  bump(state, 'head');
  return true;
}

function removeTrait(state, trait) {
  const [slot, value] = trait.split(':');
  if (!state.removed.includes(trait)) state.removed.push(trait);
  switch (slot) {
    case 'hair': state.hair.style = 'bald'; break;
    case 'hat': state.hat.type = null; break;
    case 'pattern': state.pattern = null; break;
    case 'print': state.print = null; break;
    case 'gender': state.gender = null; break;
    case 'clothes': state.pattern = null; break;
    case 'facial': if (MOUSTACHE_STYLES.has(value)) state.moustache = null; else state.beard = null; break;
    case 'brand': state.brand = null; if (state.print === 'brand') state.print = null; break;
    case 'eyewear': state.eyewear = null; break;
    case 'detail':
      if (MOUTH_ITEMS.includes(value)) state.smoke = null;
      else if (value === 'lipstick') state.lipstick = false;
      else if (value === 'eyepatch') state.eyewear = null;
      else state.details = state.details.filter((d) => d !== value);
      break;
    case 'mouth': state.mouth = value === 'smile' ? 'flat' : null; break;
    case 'mood': state.mood = null; break;
    default: return false;
  }
  return true;
}

// "Surprise me": a fresh seed for the base look plus a few random extras.
const randomExtras = {
  hat: ['beanie', 'cap', 'capBack', 'bucket', 'hood', 'catEars', 'crown', 'bandana', 'fedora', 'pompom'],
  eyewear: ['glasses', 'round', 'sunglasses', 'hearts', 'pixel'],
  mood: ['happy', 'smug', 'tired', 'surprised', 'blank', 'sad', 'angry'],
  details: ['freckles', 'earring', 'headphones', 'scarf', 'bags', 'piercing', 'bandaid', 'tattoo'],
  smoke: ['cigarette', 'lollipop', 'gum', 'toothpick'],
  background: ['blue', 'pink', 'green', 'yellow', 'orange', 'purple'],
};
function randomCharacter(entropy) {
  const state = initialState();
  state.started = true;
  state.seed = Math.floor(entropy * 2 ** 31);
  const roll = (salt) => (hash(`${state.seed}:${salt}`) % 1000) / 1000;
  const pick = (list, salt) => list[hash(`${state.seed}:${salt}:pick`) % list.length];
  if (roll('gender') < 0.5) state.gender = 'female';
  if (roll('hat') < 0.45) state.hat.type = pick(randomExtras.hat, 'hat');
  if (roll('eyewear') < 0.3) state.eyewear = pick(randomExtras.eyewear, 'eyewear');
  if (roll('mood') < 0.7) state.mood = pick(randomExtras.mood, 'mood');
  if (roll('detail') < 0.5) state.details = [pick(randomExtras.details, 'detail')];
  if (roll('smoke') < 0.15) state.smoke = pick(randomExtras.smoke, 'smoke');
  if (roll('beard') < 0.3 && state.gender !== 'female') state.beard = pick(['beard', 'stubble', 'goatee'], 'beard');
  if (roll('background') < 0.4) state.background = pick(randomExtras.background, 'background');
  return state;
}

export const MAX_INPUT = 500;

// Unknown words worth reporting: not stop words, numbers or command words.
function meaningfulUnknown(unknown) {
  return unknown.filter((word) => word.length > 3 && !stopWords.has(word) && !/^\d+$/.test(word)
    && !Object.values(intentWords).flat().some((w) => w.split(' ').includes(word)));
}

// Words of a finished sentence that the lexicon does not know, for the local miss log.
export function missesIn(text) {
  return [...new Set(meaningfulUnknown(parse(String(text ?? '').slice(0, MAX_INPUT)).unknown))].filter((w) => w.length <= MAX_ECHO);
}
const MAX_ECHO = 24;
const shorten = (word) => (word.length > MAX_ECHO ? `${word.slice(0, MAX_ECHO)}…` : word);
// For colour traits only the last one per slot matters ("red green hair" ends up green).
const colorSlot = (trait) => (trait.startsWith('itemColor:') ? trait.split('.')[0] : trait.split(':')[0]);
const lastPerColorSlot = (traits) => traits.filter((trait, i) => {
  const slot = colorSlot(trait);
  return !slot.includes('Color') || !traits.slice(i + 1).some((later) => colorSlot(later) === slot);
});

// Rebuilds a valid state from untrusted data (a shared link, an older version of the app).
export function restoreState(raw) {
  const base = initialState();
  if (!raw || typeof raw !== 'object') return base;
  const text = (value) => (typeof value === 'string' && value.length <= 40 ? value : null);
  const strings = (value) => (Array.isArray(value) ? value.filter((v) => typeof v === 'string' && v.length <= 40).slice(0, 80) : []);
  const state = { ...base };
  for (const key of ['hair', 'hat', 'clothes']) {
    for (const field of Object.keys(base[key])) state[key] = { ...state[key], [field]: text(raw[key]?.[field]) };
  }
  for (const [key, value] of Object.entries(base)) {
    if (value === null) state[key] = text(raw[key]);
    else if (typeof value === 'boolean') state[key] = raw[key] === true;
  }
  state.details = strings(raw.details);
  state.removed = strings(raw.removed);
  state.conf = Object.fromEntries(Object.entries(raw.conf && typeof raw.conf === 'object' ? raw.conf : {})
    .filter(([k, v]) => k.length <= 40 && typeof v === 'number' && v >= 0 && v <= 1).slice(0, 80));
  state.seed = Number.isInteger(raw.seed) && raw.seed >= 0 ? raw.seed : null;
  state.itemColors = Object.fromEntries(Object.entries(raw.itemColors && typeof raw.itemColors === 'object' ? raw.itemColors : {})
    .filter(([k, v]) => k.length <= 40 && text(v)).slice(0, 20));
  return state;
}

// Returns the new state, the reply and an optional action for the UI.
export function applyMessage(previous, rawText, turn = 0, entropy = Math.random()) {
  const text = String(rawText ?? '').slice(0, MAX_INPUT);
  const state = structuredClone(previous);
  const intent = intentOf(text);
  // The "surprise me" command takes precedence over traits.
  if (intent === 'random') {
    return { state: randomCharacter(entropy), reply: copy.random, action: 'random' };
  }
  const { found: parsed, removed, unknown } = parse(text);
  const found = lastPerColorSlot(parsed);
  const applied = found.filter((trait) => applyTrait(state, trait));
  const dropped = removed.filter((trait) => removeTrait(state, trait));
  const strays = found.filter((trait) => trait.startsWith('accent:'));
  const unknownWords = meaningfulUnknown(unknown).map(shorten);

  const brandName = applied.some((t) => t.startsWith('brand:')) ? state.brand : null;

  if (!applied.length && !dropped.length) {
    if (intent === 'reset') return { state: initialState(), reply: copy.reset, action: 'reset' };
    if (intent === 'undo') return { state: previous, reply: copy.undo, action: 'undo' };
    if (intent === 'download') return { state: previous, reply: copy.download, action: 'download' };
    if (intent === 'help') return { state: previous, reply: copy.help, action: null };
    if (intent === 'confirm') {
      state.confirmed = true;
      state.started = true;
      return { state, reply: copy.confirm, action: null };
    }
    if (strays.length) return { state: previous, reply: copy.stray(strays[0].split(':')[1]), action: null };
    const word = unknownWords[0];
    const guess = word && closestWord(word);
    return { state: previous, reply: guess ? copy.guess(word, guess) : word ? copy.unknown(word) : copy.empty, action: null };
  }

  state.started = true;
  state.confirmed = false;
  // The first description seeds every trait the user never mentions: same text, same avatar.
  if (state.seed === null || state.seed === undefined) state.seed = hash(text.toLowerCase().trim());
  const parts = [];
  // "green scarf" already says "scarf": skip the bare item when its colour is listed too.
  const coloured = new Set(applied.filter((t) => t.startsWith('itemColor:')).map((t) => `detail:${t.slice(10).split('.')[0]}`));
  const shown = applied.filter((t) => !coloured.has(t));
  if (applied.length) parts.push(`${pick(copy.done, turn)} ${labelsFor(shown).join(', ')}.`);
  if (dropped.length) parts.push(`${copy.removed} ${[...new Set(dropped.map(label))].join(', ')}.`);
  if (brandName) parts.push(copy.brand(brandName));
  if (unknownWords.length) parts.push(copy.unknownTail(unknownWords.slice(0, 2).join('", "')));
  if (turn % 3 === 2) parts.push(copy.hint);
  return { state, reply: parts.join(' '), action: null };
}

// ---------- from state to scene ----------
const hairHex = { black: '#2b2a30', brown: '#6b4430', blond: '#e8c15a', red: '#c4542c', white: '#ecebe6', grey: '#9a9aa2', pink: '#f29bc0', blue: '#4f7fd1', green: '#4fa36a', purple: '#8b5cc4', orange: '#e07a2e', yellow: '#f2cf4a', hazel: '#807348', amber: '#bc712b' };
const stuffHex = { black: '#34343c', white: '#f2efe8', grey: '#9a9aa2', brown: '#7a4e33', red: '#c84b3c', orange: '#f08c1e', yellow: '#f2c53d', green: '#4f9a5f', blue: '#4f6fb3', purple: '#8255b8', pink: '#ef9ac0', blond: '#e8c15a', hazel: '#88764c', amber: '#d49235' };
const eyeHex = { blue: '#3d78c9', green: '#3f8f57', brown: '#6b4430', black: '#1b1b1f', grey: '#7d8590', hazel: '#827744', amber: '#b87224', purple: '#855bb0' };
const skinHex = { default: '#f4cda8', pale: '#fbe3cf', tan: '#d9a777', dark: '#8d5a3b', olive: '#c5a378', deep: '#593827', green: '#9cc97f', blue: '#7fa7e0', grey: '#b3b8ad', purple: '#b8a0d8' };
const hatDefault = { fedora: 'black', helmet: 'yellow', bowler: 'black', graduation: 'black', veil: 'black', beanie: 'orange', cap: 'orange', tophat: 'black', cowboy: 'brown', crown: 'yellow', generic: 'brown', bandana: 'red', hood: null, pompom: 'red', capBack: 'blue', hijab: 'green', turban: 'orange', bunnyEars: 'white', foxEars: 'orange', alice: 'pink', beret: 'black', pointy: 'purple', catEars: 'black',
  trapper: 'brown', spaceHelmet: 'white', bikeHelmet: 'red', crestedHelmet: 'grey', sunHat: 'yellow', rainHat: 'yellow', flatCap: 'brown', boater: 'yellow', kippah: 'blue', bearEars: 'brown', antlers: 'brown', sailor: 'white' };
const hatPaint = {
  crown: ['#e0b23a', '#b8861f'], halo: ['#e0b23a'], horns: ['#c84b3c'],
  santa: ['#c84b3c', '#93362b'], chef: ['#f4f1ea', '#d9d4c8'], viking: ['#9aa0a8', '#6f757d'],
};
const clothesDefault = { clerical: 'black', tracksuit: 'blue', tshirt: 'blue', hoodie: 'grey', jacket: 'black', suit: 'black', shirt: 'white', sweater: 'green', coat: 'brown', uniform: 'white', dress: 'red', armor: 'grey', turtleneck: 'black', tank: 'white', overalls: 'red', puffer: 'orange', polo: 'green', vest: 'grey', apron: 'blue', varsity: 'red', openShirt: 'white',
  cardigan: 'green', raincoat: 'yellow', windbreaker: 'blue', spaceSuit: 'orange', scrubs: 'green', gown: 'black', sailorShirt: 'blue' };

function mix(a, b, t) {
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

// Accessory colours: the one the user gave, otherwise a per-piece default.
const itemDefaults = { scarf: 'red', tie: 'red', bowtie: 'red', bow: 'pink', earmuffs: 'pink', headphones: 'orange', headset: 'orange', cape: null, mask: 'white', choker: 'black', lanyard: 'blue', boloTie: 'blue' };
function itemPalette(chosen, hatColor) {
  const palette = {};
  for (const [item, fallback] of Object.entries(itemDefaults)) {
    const name = chosen[item] ?? fallback;
    const hex = name ? stuffHex[name] : '#7a1424';
    palette[item] = item === 'headphones' && !chosen[item] ? hatColor : hex;
    palette[`${item}Dark`] = mix(palette[item], '#1b1b1f', 0.3);
  }
  return palette;
}

// Unmentioned traits are picked from these lists with the description seed, so avatars differ
// from each other but stay stable while the user keeps typing. Repeated entries weigh more.
const variety = {
  hair: ['short', 'short', 'messy', 'curly', 'sidepart', 'quiff', 'buzz', 'spiky', 'middlePart'],
  hairFemale: ['long', 'long', 'wavyLong', 'bob', 'ponytail', 'bun', 'highPonytail', 'pixie'],
  hairColor: ['black', 'black', 'brown', 'brown', 'blond', 'red'],
  clothes: ['tshirt', 'tshirt', 'hoodie', 'sweater', 'shirt', 'jacket', 'polo', 'turtleneck'],
  clothesColor: ['blue', 'grey', 'green', 'red', 'black', 'white', 'orange', 'purple', 'yellow', 'brown'],
  face: ['oval', 'oval', 'round', 'square', 'long', 'wide'],
  faceFemale: ['pointy', 'heart', 'oval', 'round'],
  nose: ['hook', 'hook', 'button', 'long', 'big', 'pointy'],
  skin: ['default', 'default', 'tan', 'dark', 'pale'],
};

export function sceneFor(state) {
  const started = state.started;
  const final = state.confirmed;
  const confOf = (slot, named) => (final ? 1 : started ? (named ? state.conf[slot] ?? NAMED : DEFAULT) : START);
  const inkOf = () => (started ? 1 : 0);
  const slot = (key, variant, named) => ({ variant, c: confOf(key, named), ink: inkOf() });

  const female = state.gender === 'female';
  const seed = state.seed ?? 0;
  const choose = (list, salt) => (state.seed === null || state.seed === undefined ? list[0] : list[hash(`${seed}:${salt}`) % list.length]);
  const hairStyle = state.hair.style ?? choose(female ? variety.hairFemale : variety.hair, 'hair');
  const hatType = state.hat.type;
  const hairVariant = hatHidesAll.has(hatType) ? 'none'
    : hatType && !hatKeepsHair.has(hatType) ? (hairStyle === 'bald' || hairStyle === 'mohawk' ? 'none' : 'under') : hairStyle;
  const clothesType = state.clothes.type ?? (hatType === 'hood' ? 'hoodie' : choose(variety.clothes, 'clothes'));
  const hairName = state.hair.color ?? (state.age === 'old' ? 'white' : choose(variety.hairColor, 'hairColor'));
  const hairColor = hairHex[hairName] ?? hairHex.black;
  const namedHatColor = stuffHex[state.hat.color];
  const [defaultHatColor, defaultHatShade] = hatPaint[hatType] ?? [];
  const hatColor = namedHatColor ?? defaultHatColor ?? stuffHex[hatDefault[hatType] ?? 'orange'];
  const clothesColor = stuffHex[state.clothes.color ?? (state.clothes.type ? clothesDefault[clothesType] : choose(variety.clothesColor, 'clothesColor')) ?? 'blue'];
  const framesColor = stuffHex[state.eyewearColor];
  const skin = skinHex[state.skin ?? choose(variety.skin, 'skin')];
  const faceShape = state.face ?? choose(female ? variety.faceFemale : variety.face, 'face');
  const details = new Set(state.details);
  if (state.age === 'old' && !state.removed.includes('detail:wrinkles')) details.add('wrinkles');

  const slots = {
    head: slot('head', faceShape, state.conf.head),
    nose: slot('nose', state.nose ?? choose(variety.nose, 'nose'), state.conf.nose ?? state.conf.head),
    clothes: slot('clothes', clothesType, state.conf.clothes),
    hair: slot('hair', hairVariant, state.conf.hair),
    hat: slot('hat', hatType ?? 'none', state.conf.hat),
    ears: slot('ears', hatType === 'hijab' || hatType === 'veil' ? 'none' : state.ears ?? 'normal', state.conf.ears ?? state.conf.head),
    print: slot('print', state.print ?? 'none', state.conf.clothes),
    pattern: slot('pattern', state.pattern ?? 'none', state.conf.clothes),
    beard: slot('beard', state.beard === 'beard' || state.beard === 'longBeard' ? `${state.beard}-${faceShape}` : state.beard ?? 'none', state.conf.beard),
    moustache: slot('moustache', state.moustache ?? 'none', state.conf.moustache),
    eyewear: slot('eyewear', state.eyewear ?? 'none', state.conf.eyewear),
    smoke: slot('smoke', state.smoke ?? 'none', state.conf.smoke),
  };
  // A suit comes with a tie, unless there is already a bow tie.
  if (clothesType === 'suit' && !details.has('bowtie') && !state.removed.includes('detail:tie')) details.add('tie');
  for (const name of DETAILS) slots[`detail:${name}`] = slot(`detail:${name}`, details.has(name) ? 'on' : 'none', state.conf[`detail:${name}`]);

  const mood = state.mood ?? 'neutral';
  const mouth = state.mouth ? mouthShapes[state.mouth] : moodMouth[mood];
  const size = state.eyeSize === 'big' ? 1.2 : state.eyeSize === 'small' ? 0.8 : state.age === 'child' ? 1.15 : 1;
  const shape = state.eyeShape === 'almond' ? [1.08, 0.7] : state.eyeShape === 'round' ? [1, 1.3] : [1, 1];
  const soft = female ? 1.08 : 1;
  const scale = [size * shape[0] * soft, size * shape[1] * soft];
  return {
    slots,
    colors: {
      ink: '#1b1b1f',
      paper: '#fbf6ec',
      skin,
      skinShadow: mix(skin, '#7a3f2a', 0.28),
      blush: mix(skin, '#e8604f', 0.4),
      hair: hairColor,
      hairLight: mix(hairColor, '#ffffff', 0.3),
      hat: hatColor,
      hatDark: !namedHatColor && defaultHatShade ? defaultHatShade : mix(hatColor, '#1b1b1f', 0.28),
      clothes: clothesColor,
      clothesDark: mix(clothesColor, '#1b1b1f', 0.25),
      clothesDeep: mix(clothesColor, '#1b1b1f', 0.55),
      eye: eyeHex[state.eyeColor] ?? stuffHex[state.eyeColor] ?? '#1b1b1f',
      frames: framesColor ?? '#1b1b1f',
      tintedLens: framesColor ? mix(framesColor, '#1b1b1f', 0.36) : '#1b1b1f',
      heartLens: framesColor ?? '#e8455a',
      goggleLens: framesColor ? mix(framesColor, '#d5efff', 0.36) : '#679aba',
      visorTint: framesColor ?? '#3fd0e0',
      visorDisplay: framesColor ?? '#5a6ad8',
      brandName: state.brand ?? 'ZORP',
      beard: state.beardColor ? hairHex[state.beardColor] ?? hairColor : hairColor,
      beardLight: mix(state.beardColor ? hairHex[state.beardColor] ?? hairColor : hairColor, '#ffffff', 0.3),
      ...itemPalette(state.itemColors ?? {}, hatColor),
      ...(state.background ? { background: mix(stuffHex[state.background], '#fbf6ec', 0.35) } : {}),
    },
    face: {
      eyes: moodEyes[mood],
      mouth,
      scale,
      browWidth: state.brows === 'thick' ? 11 : state.brows === 'thin' || (female && (!state.brows || state.brows === 'raised')) ? 5 : 7,
      lips: state.lipstick ? '#b8283c' : state.gender === 'female' ? '#a84a5a' : null,
      lashes: details.has('lashes') || (state.gender === 'female' && !state.removed.includes('detail:lashes')),
      eyeshadow: details.has('eyeshadow') ? stuffHex[state.itemColors?.eyeshadow] ?? mix(hatColor, '#8255b8', 0.5) : null,
      fangs: details.has('fangs'),
      browRaise: state.brows === 'raised' || (mood === 'smug' && state.brows !== 'thick'),
      eyeC: confOf('eyes', state.conf.eyes),
      mouthC: confOf('mouth', state.conf.mouth),
    },
    accent: state.clothes.color || !hatType ? clothesColor : hatColor,
  };
}
