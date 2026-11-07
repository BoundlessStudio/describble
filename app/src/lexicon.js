// The words live in dictionary/ at the repository root: concepts.json lists what can be drawn,
// lang/<language>.json gives the words for each concept, brands.json the real brands to replace.
// This module merges every language into the tables the parser reads. Multi-word phrases take
// precedence; real brands are recognised only to replace them with an invented one (see dialogue.js).
// build.mjs inlines these JSON files, since the published page loads nothing else.
import conceptsFile from '../../dictionary/concepts.json' with { type: 'json' };
import brandsFile from '../../dictionary/brands.json' with { type: 'json' };
import dictionaryEn from '../../dictionary/lang/en.json' with { type: 'json' };

const wordsFor = (section, key) => dictionaryEn[section]?.[key] ?? [];
const tableFor = (section, keys) => Object.fromEntries(keys.map((key) => [key, wordsFor(section, key)]));

export const traits = {
  ...Object.fromEntries(brandsFile.brands.map((brand) => [`brand:${brand.replace(/ /g, '')}`, [brand]])),
  ...tableFor('concepts', conceptsFile.concepts.map(({ id }) => id)),
};

// Words that already are a hair colour, even without mentioning hair.
export const hairOnlyColors = tableFor('hairOnlyColors', conceptsFile.hairOnlyColors);
export const colors = tableFor('colors', conceptsFile.colors);
// Nouns a nearby colour attaches to. Garments and hats in the catalog already count.
export const colorNouns = tableFor('colorNouns', conceptsFile.colorNouns);
// Adjectives that only count next to the right noun: "long coat" is not long hair.
export const contextual = conceptsFile.contextual.map(({ trait, near }) => ({ trait, near, words: wordsFor('contextual', trait) }));
// Words that are understood but change nothing, so they are not reported as misses.
export const { ignored, negations, scopeBreakers } = dictionaryEn;
