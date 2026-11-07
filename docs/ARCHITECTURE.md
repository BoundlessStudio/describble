# Architecture

Describble is a static web page. Everything from parsing the sentence to rendering the drawing happens in the browser. The only server piece is an optional collector (`collector/`, a Cloudflare Worker) that counts single words the parser did not understand.

## Pipeline

```
text → parser → dialogue state → scene → stage → SVG on screen
                                             └→ PNG export
```

| Module (`app/src/`) | Responsibility |
|---|---|
| `lexicon.js` (built from `dictionary/`) | English words and phrases mapped to traits such as `hair:spiky` or `detail:scarf`. A word that appears in several lists turns on several traits. |
| `parser.js` | Tokenises the text and matches the longest phrase first, exact form before stem. Handles one typo, negations and colour words attached to the nearest noun. Returns found traits, removed traits and unknown words. |
| `dialogue.js` | Pure state machine with no DOM access. Applies traits, detects intents (`ok`, `download`, `undo`, `start over`), picks the reply language, invents brand names, and turns the state into a **scene**: which variant goes in each slot, with which colours and confidence. |
| `pieces.js` | The catalog: `catalog[slot][variant]` is a list of parts. Each part has a `layer` and shapes, lines, dots or text with colour keys resolved at render time. |
| `rig.js` | Eyes, brows and mouth as single cubic curves with the same nodes in every expression, so expressions can be blended and morphed. |
| `pen.js` | Turns clean curves into hand-drawn strokes: splits them into pen strokes, applies seeded jitter, tapers the ends, offsets the colour fills. |
| `stage.js` | Composes slots into 14 fixed SVG layers, animates piece changes (retract, then redraw) and expression morphs, and boils the lines between four variants at 9 fps. |
| `live.js` | The main page: replays the whole text on every keystroke, settles the drawing after a pause, drives the 2.5D head pose and the background lines, and wires the download, share and surprise buttons. |
| `site.js` | English site copy, avatar ideas, the share link (`#s=…&k=…`) and links set at build time. |
| `app.js` | The earlier chat page (one message per Enter), the shareable URL state and the `?mode=catalog` review page. |
| `export.js` | Renders the finished avatar off screen and downloads it as a PNG. |
| `misses.js` | Local log of words not understood, plus the optional anonymous report of single words to the collector (see PRIVACY.md). |
| `gif.js` | GIF encoder used to record the README demo. |

## Key ideas

- **Confidence drives the look.** Each slot has a confidence from 0 to 1. Low confidence means thin, trembling, overlapping strokes; full confidence means the settled ink style.
- **The sketch is derived.** Pieces are stored as clean geometry. The rough style is computed from it, so one drawing serves every stage of the animation.
- **Deterministic.** Every piece has its own seed, so the same description always gives the same avatar.
- **2.5D head turn.** `stage.setPose` slides each SVG layer by its depth (`LAYER_DEPTH`): layers behind the face move the other way, face features move the most and get slightly narrower. It reads as a turn up to about 40° each side.
- **Colours are data.** Parts refer to colour keys (`hair`, `hat`, `scarf`…). Changing a colour never redraws geometry.

## Build and tests

`app/build.mjs` concatenates the modules in dependency order, strips `import`/`export`, and inlines the result into `dist/index.html` and `dist/chat.html`. The display font is inlined from `app/assets/fonts/`. The published folder `dist/site/` includes the prerendered English pages, gallery thumbnails, icons, `robots.txt`, and `sitemap.xml`. Its `_headers` file allows the inline script and style by hash and permits the word collector when configured. CI runs the tests and builds the site on each push. The source modules remain importable by `node --test`.

The test suite covers the dialogue rules, regressions on a labelled corpus of 100 descriptions, and a consistency check that every word in the lexicon leads to a piece that exists.

## Planned structure

The prototype will be split into packages once the data model is stable (see [ROADMAP.md](ROADMAP.md)):

```
packages/core      parser, lexicon, dialogue, scene (TypeScript, no DOM)
packages/pieces    one data file per piece, CC0
packages/render    SVG as a string (Node) and live animation (browser)
packages/element   <describble-avatar text="…"> web component
apps/web           the chat site, static
apps/api           optional stateless endpoint returning an SVG for a description
tools/import-svg   convert drawings made in a vector editor into piece files
```
