// Rule-based parser: text → found traits, negated traits and unknown words.
import { traits, hairOnlyColors, colors, colorNouns, contextual, ignored, negations, scopeBreakers } from './lexicon.js';

const stripAccents = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '');
const COLOR_REACH = 3;
const CONTEXT_BREAKS = new Set([...scopeBreakers, 'and', 'or', 'with']);

// Drops a final s to merge singular and plural forms.
function stem(word) {
  if (word.length < 5) return word;
  if (/s$/.test(word)) return word.slice(0, -1);
  return word;
}

function tokenize(text) {
  const clean = stripAccents(text.toLowerCase()).replace(/['’`]/g, ' ').replace(/-/g, ' ');
  return clean.match(/[a-z0-9]+|[,.;:!?()]|\p{Extended_Pictographic}/gu) ?? [];
}

const isBreak = (token) => /^[,.;:!?()]$/.test(token);
const phraseKey = (tokens) => tokens.map(stem).join(' ');

// The exact form wins. When words share a stem, keep only the traits they share.
const exactIndex = new Map();
function buildIndex() {
  const built = new Map();
  const add = (phrase, entry) => built.set(phraseKey(tokenize(phrase)), entry);
  const byStem = new Map();
  for (const [trait, words] of Object.entries(traits)) {
    for (const word of words) {
      const raw = tokenize(word).join(' ');
      exactIndex.set(raw, { traits: [...(exactIndex.get(raw)?.traits ?? []), trait] });
      const key = phraseKey(tokenize(word));
      if (!byStem.has(key)) byStem.set(key, new Set());
      byStem.get(key).add(raw);
    }
  }
  for (const [key, raws] of byStem) {
    const lists = [...raws].map((raw) => exactIndex.get(raw).traits);
    built.set(key, { traits: lists.reduce((shared, list) => shared.filter((t) => list.includes(t))) });
  }
  for (const [value, words] of Object.entries(hairOnlyColors)) for (const word of words) add(word, { hairDye: value });
  for (const [value, words] of Object.entries(colors)) for (const word of words) add(word, { color: value });
  for (const [noun, words] of Object.entries(colorNouns)) for (const word of words) add(word, { noun });
  for (const { trait, near, words } of contextual) {
    for (const word of words) {
      const rules = built.get(phraseKey(tokenize(word)))?.contextual ?? [];
      add(word, { contextual: [...rules, { trait, near }] });
    }
  }
  for (const phrase of ignored) add(phrase, { ignored: true });
  return built;
}

const lexiconIndex = buildIndex();
const MAX_PHRASE = [...exactIndex.keys(), ...lexiconIndex.keys()]
  .reduce((longest, phrase) => Math.max(longest, phrase.split(' ').length), 1);
const typoWords = new Map();
for (const words of [...Object.values(traits), ...Object.values(hairOnlyColors), ...Object.values(colors), ...Object.values(colorNouns)]) {
  for (const word of words) {
    if (!word.includes(' ') && word.length >= 6) typoWords.set(stripAccents(word), lexiconIndex.get(phraseKey(tokenize(word))));
  }
}

// Edit distance <= 1, transpositions included.
function nearOne(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.slice(i + 1) === b.slice(i + 1)) return true;
  if (a.slice(i) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i)) return true;
  return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
}

function lookupTypo(token) {
  if (token.length < 6) return null;
  const match = [...typoWords.keys()].find((word) => word[0] === token[0] && nearOne(token, word));
  return match ? typoWords.get(match) : null;
}

// Stretched words: "greeen", "loooong", "eyees". Only runs of three or more letters, or a doubled
// vowel in a word of five letters or more, are shortened.
// The shortened form is used only when the dictionary knows it.
const knownToken = (token) => exactIndex.has(token) || lexiconIndex.has(phraseKey([token]));
function destretch(token) {
  if (knownToken(token)) return token;
  const runs = [...token.matchAll(/(.)\1+/g)].map((m) => {
    const keep = m[0].length >= 3 ? [2, 1] : /[aeiou]/.test(m[1]) && token.length >= 5 ? [1] : [];
    return { at: m.index, length: m[0].length, letter: m[1], keep };
  }).filter((run) => run.keep.length);
  if (!runs.length || runs.length > 4) return token;
  let variants = [{ text: '', from: 0 }];
  for (const run of runs) {
    variants = variants.flatMap((v) => [run.length, ...run.keep].map((n) => ({
      text: v.text + token.slice(v.from, run.at) + run.letter.repeat(n), from: run.at + run.length,
    })));
  }
  const candidates = variants.map((v) => v.text + token.slice(v.from)).filter((v) => v !== token);
  candidates.sort((a, b) => b.length - a.length);
  return candidates.find(knownToken) ?? token;
}

// Two known words typed together: "redglasses", "longbeard", "mancap". Only when the whole word is
// unknown (not even a typo) and both halves are real entries, not filler words.
const isContent = (part) => exactIndex.has(part) || (lexiconIndex.get(phraseKey([part])) && !lexiconIndex.get(phraseKey([part])).ignored);
function splitJoined(token) {
  if (token.length < 6 || knownToken(token) || lookupTypo(token)) return [token];
  for (let at = 3; at <= token.length - 3; at++) {
    const [left, right] = [token.slice(0, at), token.slice(at)];
    if (isContent(left) && isContent(right)) return [left, right];
  }
  return [token];
}

// Accessories with their own colour: "green scarf" becomes itemColor:scarf.green.
const COLORABLE = ['scarf', 'tie', 'bowtie', 'bow', 'earmuffs', 'headphones', 'headset', 'cape', 'mask', 'choker', 'lanyard', 'boloTie', 'eyeshadow'].map((d) => `detail:${d}`);
// "white skin", "skin tone dark": a colour next to "skin" picks the nearest skin tone we draw.
// Yellow and red have no tone on purpose (they read as stereotypes), so they draw nothing.
const SKIN_TONES = { white: 'pale', pink: 'pale', black: 'dark', brown: 'dark', orange: 'tan', green: 'green', blue: 'blue', grey: 'grey', purple: 'purple' };
const hasTrait = (hit, prefix) => hit.traits?.some((trait) => trait.startsWith(prefix));

// "uncolored": the colour belongs to this piece, but the catalog has no colour slot for it.
const nounOf = (hit) => {
  if (hit.noun) return hit.noun;
  if (hasTrait(hit, 'clothes:')) return 'clothes';
  if (hasTrait(hit, 'hat:') && !hasTrait(hit, 'hat:hood')) return 'hat';
  if (hasTrait(hit, 'hair:')) return 'hair';
  if (hasTrait(hit, 'facial:')) return 'beard';
  if (hasTrait(hit, 'eyewear:') || hit.traits?.includes('detail:eyepatch')) return 'eyewear';
  if (hasTrait(hit, 'eyes:')) return 'eye';
  const item = hit.traits?.find((trait) => COLORABLE.includes(trait))?.slice(7);
  if (item) return `item.${item}`;
  if (hasTrait(hit, 'detail:')) return 'uncolored';
  return null;
};

export { tokenize };

export function parse(text) {
  const tokens = tokenize(text).map(destretch).flatMap(splitJoined);
  const hits = [];
  const consumed = new Array(tokens.length).fill(false);
  for (let i = 0; i < tokens.length; i++) {
    if (isBreak(tokens[i])) continue;
    let found = null;
    for (let size = Math.min(MAX_PHRASE, tokens.length - i); size >= 1 && !found; size--) {
      const slice = tokens.slice(i, i + size);
      const entry = exactIndex.get(slice.join(' ')) ?? lexiconIndex.get(phraseKey(slice));
      if (entry) found = { ...entry, start: i, end: i + size };
    }
    if (!found) {
      const typo = lookupTypo(tokens[i]);
      if (typo) found = { ...typo, start: i, end: i + 1, typo: true };
    }
    if (found) {
      hits.push(found);
      consumed.fill(true, found.start, found.end);
      i = found.end - 1;
    }
  }

  const negated = new Set();
  tokens.forEach((token, i) => {
    // A negation word inside a known phrase belongs to that phrase.
    if (!negations.includes(token) || consumed[i]) return;
    for (let j = i + 1; j < Math.min(tokens.length, i + 7); j++) {
      if (isBreak(tokens[j]) || scopeBreakers.includes(tokens[j])) break;
      negated.add(j);
    }
  });

  const found = new Set();
  const removed = new Set();
  const place = (hit, trait) => (negated.has(hit.start) ? removed : found).add(trait);
  const crossesBreak = (a, b) => tokens.slice(Math.min(a, b), Math.max(a, b)).some(isBreak);
  const distance = (a, b) => Math.max(b.start - a.end, a.start - b.end) + 1;

  const refined = new Set();
  // Nouns that already took a colour: "green hat purple t-shirt" gives purple to the t-shirt, not the hat.
  const coloured = new Set();
  for (const hit of hits) {
    for (const trait of hit.traits ?? []) place(hit, trait);
    if (hit.contextual) {
      // The same adjective can qualify different nouns, as in "long hair" and "long white beard".
      const nearby = hits.filter((other) => other !== hit && distance(hit, other) <= COLOR_REACH
        && !tokens.slice(Math.min(hit.end, other.end), Math.max(hit.start, other.start)).some((word) => isBreak(word) || CONTEXT_BREAKS.has(word)))
        .sort((a, b) => distance(hit, a) - distance(hit, b) || b.start - a.start);
      for (const other of nearby) {
        const rule = hit.contextual.find(({ near }) => near.includes(':') ? other.traits?.includes(near) : nounOf(other) === near);
        if (!rule) continue;
        place(hit, rule.trait);
        if (rule.near.includes(':')) refined.add(rule.near);
        break;
      }
    }
    if (hit.hairDye) {
      // Blond, brunette and ginger refer to hair by default, or to a beard they directly qualify.
      const beard = hits.some((other) => nounOf(other) === 'beard' && distance(hit, other) === 1);
      place(hit, `${beard ? 'beardColor' : 'hairColor'}:${hit.hairDye}`);
    }
    if (!hit.color) continue;
    const owners = hits
      .filter((other) => nounOf(other) && !crossesBreak(hit.start, other.start))
      .map((other) => ({ other, reach: distance(hit, other) }))
      .filter(({ reach }) => reach <= COLOR_REACH)
      .sort((a, b) => coloured.has(a.other) - coloured.has(b.other) || a.reach - b.reach || a.other.start - b.other.start);
    const owner = owners[0]?.other;
    if (owner) coloured.add(owner);
    const noun = owner && nounOf(owner);
    if (noun === 'skin') {
      if (SKIN_TONES[hit.color]) place(hit, `skin:${SKIN_TONES[hit.color]}`);
    } else if (noun?.startsWith('item.')) place(hit, `itemColor:${noun.slice(5)}.${hit.color}`);
    else if (noun && noun !== 'uncolored') place(hit, `${noun}Color:${hit.color}`);
    else if (!owner) place(hit, `accent:${hit.color}`);
  }

  const unknown = tokens.filter((token, i) => !consumed[i] && !isBreak(token));
  for (const trait of refined) found.delete(trait);
  // "cappello" alone never replaces a specific hat named in the same text ("cuoco con il cappello").
  if (found.has('hat:generic') && [...found].some((t) => t.startsWith('hat:') && t !== 'hat:generic')) found.delete('hat:generic');
  return { found: [...found], removed: [...removed], unknown };
}
