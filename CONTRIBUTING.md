# Contributing

Thanks for helping! You can contribute an English synonym or draw a new piece.

## Setup

You only need Node.js 20 or newer. There are no dependencies to install.

```bash
cd app
node build.mjs        # builds dist/index.html and dist/chat.html
node --test test/     # runs the test suite
```

Open `dist/index.html` in a browser for the live page. `dist/chat.html?mode=catalog` shows every piece, and `&only=hat` filters by slot.

## Adding a word

Open `dictionary/lang/en.json`, find the concept and add the English word to its list.

```json
"hat:beanie": ["beanie", "knit hat", "wool hat", "your word"],
```

- Words are lowercase. Multi-word phrases are fine and win over single words.
- A word listed under several concepts turns all of them on: that is how archetypes like `vampire` work.
- The concepts themselves (what can be drawn) are listed in `dictionary/concepts.json`; each one is backed by a piece in `app/src/pieces.js`.
- Run `node scripts/dictionary.mjs check` from `app/`: it tells you if something is off. Then `node --test test/`.
- Add a case to `app/test/parser.test.js` if the word fixes a real sentence that used to fail.
- If the word is listed in `app/lexicon-backlog.json`, remove it there: a test checks that the backlog only holds words that are still unknown.

## The word backlog

`app/lexicon-backlog.json` keeps the words people wrote that Describble does not understand yet, so they are not lost between releases. Each one is `todo` (waiting for a synonym or a new piece) or `skip` (left out on purpose, with the reason). Picking a `todo` word is a good first contribution.

## Reporting words it does not understand

Every time you pause while typing, the words the parser does not know are saved in your browser (localStorage). Open `dist/chat.html?mode=misses` to see them, most frequent first, with the sentence you wrote. Builds that have a collector also send those single words anonymously, as described in [PRIVACY.md](PRIVACY.md).

To suggest a word, open a **Word not understood** issue. If a word was understood but drawn wrong, open a **Drawn wrong** issue with what you wrote and a screenshot.

Maintainers turn the collector counts into a to-do list with:

```bash
cd app && EXPORT_TOKEN=… node scripts/triage.mjs https://<your-worker>/export --min=3
```

It lists the words still not understood, most frequent first, and sets apart the ones the current lexicon already handles. Each word ends as a synonym, a new piece, an entry in `ignored` (neutral words like "person"), or a deliberate gap (real brands, offensive words), always with a test.

## Adding a piece

1. Draw it in `app/src/pieces.js` on the 512×512 grid, using only absolute `M`, `C`, `L`, `Z` path commands. Keep the shared anchors: eyes at y≈266, mouth at y≈352, chin at y≈430.
2. Give every part a `layer` from `LAYERS` and use colour keys (`hair`, `hat`, `clothes`…) instead of fixed colours when the user should be able to recolour it.
3. Add the words for it in `lexicon.js` and, if it is a new kind of trait, a branch in `applyTrait` in `dialogue.js`.
4. Run the tests: one of them fails if a word points to a piece that does not exist.
5. Check it in the catalog page and attach a screenshot to your pull request.

All artwork must be **original** and is released under CC0 (see [LICENSE-ASSETS](LICENSE-ASSETS)). Do not trace or copy existing artwork, logos, mascots or characters. Read the [content policy](CONTENT_POLICY.md) before adding pieces.

## Code style

- Plain modern JavaScript, no runtime dependencies.
- The files in `app/src/` are concatenated into one script at build time, so top-level names must be unique across files.
- Keep `parser.js` and `dialogue.js` free of DOM code so they stay testable in Node.

## Pull requests

- One topic per pull request.
- Make sure `node --test test/` passes.
- Describe what you changed and, for visual changes, include a before/after screenshot.

By contributing you agree to license your code under MIT and your artwork under CC0.

## License of contributions

By opening a pull request you agree that your code is released under the MIT License and your drawings under CC0, like the rest of the project. Please contribute only work you made yourself: no traced artwork, logos or existing characters (see [CONTENT_POLICY.md](CONTENT_POLICY.md)).
