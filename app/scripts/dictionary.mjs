// Checks and reports on the dictionary in dictionary/ (repository root).
//
//   node scripts/dictionary.mjs check          every file is well formed and points at real concepts
//   node scripts/dictionary.mjs stats          words per language and section
//   node scripts/dictionary.mjs missing en     concepts that have no English words yet
//
// check() is also run by the tests, so a broken dictionary fails CI.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dictionaryDir = fileURLToPath(new URL('../../dictionary/', import.meta.url));
const readJson = (path) => JSON.parse(readFileSync(join(dictionaryDir, path), 'utf8'));
const SECTIONS = ['concepts', 'colors', 'hairOnlyColors', 'colorNouns', 'contextual'];
const LISTS = ['ignored', 'negations', 'scopeBreakers'];

export function loadDictionary() {
  const concepts = readJson('concepts.json');
  const brands = readJson('brands.json');
  const languages = readdirSync(join(dictionaryDir, 'lang')).filter((file) => file.endsWith('.json')).sort()
    .map((file) => ({ file: `lang/${file}`, ...readJson(`lang/${file}`) }));
  return { concepts, brands, languages };
}

// Returns a list of problems; an empty list means the dictionary is valid.
export function check({ concepts, brands, languages } = loadDictionary()) {
  const problems = [];
  const keysOf = {
    concepts: new Set(concepts.concepts.map((concept) => concept.id)),
    colors: new Set(concepts.colors),
    hairOnlyColors: new Set(concepts.hairOnlyColors),
    colorNouns: new Set(concepts.colorNouns),
    contextual: new Set(concepts.contextual.map((rule) => rule.trait)),
  };
  const seen = new Set();
  for (const { id } of concepts.concepts) {
    if (!/^[a-zA-Z]+:[a-zA-Z0-9.]+$/.test(id)) problems.push(`concepts.json: "${id}" is not slot:variant`);
    if (seen.has(id)) problems.push(`concepts.json: "${id}" is listed twice`);
    seen.add(id);
  }
  for (const rule of concepts.contextual) {
    if (!keysOf.concepts.has(rule.trait)) problems.push(`concepts.json: contextual "${rule.trait}" is not a concept`);
  }
  const checkWord = (where, word) => {
    if (typeof word !== 'string' || !word.trim()) problems.push(`${where}: empty word`);
    else if (word !== word.trim() || /\s{2,}/.test(word)) problems.push(`${where}: "${word}" has extra spaces`);
    else if (word !== word.toLowerCase()) problems.push(`${where}: "${word}" must be lowercase`);
  };
  brands.brands.forEach((brand) => checkWord('brands.json', brand));
  const codes = new Set();
  for (const language of languages) {
    if (!/^[a-z]{2}$/.test(language.language ?? '')) problems.push(`${language.file}: "language" must be a two-letter code`);
    if (codes.has(language.language)) problems.push(`${language.file}: language "${language.language}" appears twice`);
    codes.add(language.language);
    if (`lang/${language.language}.json` !== language.file) problems.push(`${language.file}: file name must match "language"`);
    if (!language.name) problems.push(`${language.file}: missing "name"`);
    for (const section of SECTIONS) {
      for (const [key, words] of Object.entries(language[section] ?? {})) {
        if (!keysOf[section].has(key)) problems.push(`${language.file}: ${section} "${key}" is not defined in concepts.json`);
        if (!Array.isArray(words)) { problems.push(`${language.file}: ${section} "${key}" must be a list`); continue; }
        words.forEach((word) => checkWord(`${language.file} ${section} "${key}"`, word));
        const dupes = words.filter((word, i) => words.indexOf(word) !== i);
        if (dupes.length) problems.push(`${language.file}: ${section} "${key}" repeats ${dupes.join(', ')}`);
      }
    }
    for (const list of LISTS) (language[list] ?? []).forEach((word) => checkWord(`${language.file} ${list}`, word));
  }
  return problems;
}

export function stats({ concepts, languages } = loadDictionary()) {
  return languages.map((language) => {
    const words = Object.values(language.concepts ?? {}).flat().length;
    const covered = concepts.concepts.filter((concept) => language.concepts?.[concept.id]?.length).length;
    return { language: language.language, name: language.name, words, covered, of: concepts.concepts.length };
  });
}

// Concepts with no words in a language, with the English words as a hint for translators.
export function missing(code, { concepts, languages } = loadDictionary()) {
  const language = languages.find((entry) => entry.language === code) ?? { concepts: {} };
  const english = languages.find((entry) => entry.language === 'en') ?? { concepts: {} };
  return concepts.concepts.filter((concept) => !language.concepts?.[concept.id]?.length)
    .map((concept) => ({ id: concept.id, hint: (english.concepts?.[concept.id] ?? []).slice(0, 4) }));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [command, argument] = process.argv.slice(2);
  if (command === 'check') {
    const problems = check();
    problems.forEach((problem) => console.error(`✗ ${problem}`));
    console.log(problems.length ? `${problems.length} problem(s)` : '✓ dictionary is valid');
    process.exit(problems.length ? 1 : 0);
  } else if (command === 'stats') {
    for (const row of stats()) console.log(`${row.language}  ${row.name.padEnd(10)} ${String(row.words).padStart(5)} words, ${row.covered}/${row.of} concepts`);
  } else if (command === 'missing' && argument) {
    const rows = missing(argument);
    for (const row of rows) console.log(`${row.id.padEnd(28)} ${row.hint.join(', ')}`);
    console.log(`${rows.length} concept(s) without words in "${argument}"`);
  } else {
    console.error('Usage: node scripts/dictionary.mjs check | stats | missing <language>');
    process.exit(1);
  }
}
