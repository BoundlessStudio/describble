# The Vignette dictionary

Everything Vignette understands is here, as data, separate from the code.

- `concepts.json` defines drawable traits such as `hat:beanie`, plus the rules that attach colours and adjectives to them.
- `lang/en.json` contains English synonyms, colour words, negations such as “without”, and words the parser can ignore.
- `brands.json`: real brand names. They are recognised only to print an invented name instead; they are never drawn.
- `schema/`: JSON Schemas for the files above, so editors can autocomplete and flag mistakes.

The website bundles the English dictionary at build time.

## Tools

From `app/`:

```bash
node scripts/dictionary.mjs check        # is everything well formed?
node scripts/dictionary.mjs stats        # English word and concept counts
node scripts/dictionary.mjs missing en   # concepts that need English words
```

`check` also runs with the tests. See [CONTRIBUTING.md](../CONTRIBUTING.md) for adding words.

## English portrait coverage

The [portrait corpus](../app/test/portrait-ideas.js) pairs 200 subjects with five
looks each across 20 themes, from winter hats and hairstyles to work accessories
and explicit omissions like “without a tie.” Shade names such as “sage green”
map to the closest colour in the drawing palette. Hazel and amber have their
own colours.

Run `node --test test/portrait-ideas.test.js` from `app/` to verify all 1,000
descriptions. The tests check the intended traits, colours and omissions, then
render each portrait with the same seed to catch missing details and duplicate
drawings. The [word backlog](../app/lexicon-backlog.json) tracks requests that
still need vocabulary or artwork.

## License

The dictionary is part of the code and released under the MIT License. Please add only words you wrote yourself: do not copy lists from other dictionaries, whose licenses may not allow it.
