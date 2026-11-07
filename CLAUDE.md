# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Early prototype of an open-source, local-first avatar generator: the user describes a character in a chat and a hand-drawn avatar is drawn live. The project is called Describble (describe + scribble); the site lives at describble.com, with `www` redirecting to it. It is a git repository being prepared for a public release on GitHub, so nothing personal, no secrets and no third-party artwork may be added. Commits are authored by the maintainer. Words people wrote that are not understood yet are kept in `app/lexicon-backlog.json` (`todo` or `skip`); a test fails when a backlog word becomes understood, so remove it there when you teach it.

Internal research notes and throwaway experiments live in `.private/` (git-ignored, Italian). They explain past decisions (style choice, experiments E1-E10, parser corpus) but are not part of the product and must not be referenced from public files.

## Commands

All code lives in `app/`. Node 20+, no dependencies.

```bash
cd app && node build.mjs
```

```bash
cd app && node --test test/
```

The build writes two pages. `dist/index.html` is the website: the live drawing is the hero (the text box is the whole description, replayed on every keystroke in `live.js`, with the head turning in 2.5D via `stage.setPose`), followed by a clickable gallery, how it works, how to use the avatar, open source and support. Its English copy, gallery sentences, links and the share link (`#s=<sentence>&k=<seed>`, read on load; the hash never reaches a server) live in `site.js`; the numbers on the page (phrases, pieces, size) are counted by `build.mjs`. The display face (Bricolage Grotesque, SIL OFL, `app/assets/fonts/`) is inlined as base64, so the page makes no font requests; everything else uses system fonts. The site lives at https://describble.com, deployed by Cloudflare Workers Builds from `main` (`wrangler.jsonc`, build command `cd app && node build.mjs`, build variables `DESCRIBBLE_REPO_URL` and `DESCRIBBLE_REPORT_ENDPOINT`); CI only runs tests and the build. The build publishes the English homepage and two English search pages to `app/dist/site/`. It writes gallery thumbnails under `avatars/`, lists them in the sitemap, and generates a hash-based Content Security Policy in `_headers`. Optional links come from `DESCRIBBLE_REPO_URL` and `DESCRIBBLE_SUPPORT_URL` at build time; when empty, the parts that need them stay hidden. `dist/chat.html` is the earlier chat with Enter (`app.js`) and hosts the debug pages.

Single test: `node --test --test-name-pattern="brand" test/`. Debug pages: `dist/chat.html?mode=catalog` shows every piece (`&only=hair` filters by slot); `?mode=turn&say=text` shows one character at five head turns; `?mode=gallery` renders the README image (`docs/gallery.png`); `?mode=misses` lists the local log of words not understood (`misses.js`, localStorage only, recorded after a typing pause on the live page and per message in the chat); `?mode=record` renders the README GIF into `<pre id="gif">` as base64 (save it from a headless `--dump-dom`, then decode to `docs/demo.gif`); `?say=text|text` sends messages in sequence. These static pages also work in headless Chrome screenshots, unlike the animated ones.

`collector/` is the Cloudflare Worker that counts reported words at https://words.describble.com (D1 database `describble-words`, one atomic upsert per word, reports accepted only from `ALLOWED_ORIGIN`, export behind the `EXPORT_TOKEN` secret). Its `wrangler.toml` (with the database id) is git-ignored; always deploy it with `npx wrangler deploy --config collector/wrangler.toml`, because the repository root has the website's own `wrangler.jsonc`. The site gets the address from the Workers Builds build variable `DESCRIBBLE_REPORT_ENDPOINT`. `app/scripts/triage.mjs` turns its export (a URL with `EXPORT_TOKEN`, or a saved JSON file) into a Markdown to-do list, setting apart words the current lexicon already understands. Issue templates for words and wrong drawings live in `.github/ISSUE_TEMPLATE/`.

## Architecture

See `docs/ARCHITECTURE.md` for the full description and `docs/ROADMAP.md` for the planned TypeScript monorepo. In short: `parser.js` (text → traits, using `lexicon.js`, which builds its tables from the data in `dictionary/`: `concepts.json` for what can be drawn, `lang/<code>.json` for each language's words, `brands.json`; `build.mjs` inlines those JSON files, and `app/scripts/dictionary.mjs check|stats|missing <code>` validates and reports on them) → `dialogue.js` (pure state, intents, replies, `sceneFor`) → `stage.js` (slots in fixed SVG layers, redraw and morph animations) → `pen.js` (hand-drawn strokes). Pieces are `catalog[slot][variant]` in `pieces.js`; eyes and mouth are a blendable rig in `rig.js`.

Things that are not obvious from a single file:
- `build.mjs` concatenates `src/` into one script, so top-level names must be unique across files.
- Words go in `dictionary/lang/<code>.json`, never in code; a new concept also needs an entry in `dictionary/concepts.json`, a branch in `applyTrait` and a variant in the catalog. Tests fail when a lexicon word leads to a missing piece or slot.
- A word listed under several traits turns all of them on; that is how archetypes ("vampire", "developer") work.
- The parser tries the exact form before the stem; when different words share a stem ("ragazzo"/"ragazza"), the stem keeps only the traits they share.
- Colour words attach to the nearest noun: hair, eyes, clothes, hat, background, beard (`beardColor`) or a colourable accessory (`itemColor:scarf.green`).
- Feminine features are independent traits, never a preset; gender words only set defaults the text can override.
- English replies live in `copy`.
- Real brand names (`brand:*`) are recognised only to print an invented, stable name (`fakeBrand`). Never draw real logos or names.
- The 2.5D turn is layer parallax: `LAYER_DEPTH` in `stage.js` decides how far each layer slides. Layers behind the face have negative depth.
- The live page fixes one seed per visit, so unmentioned traits do not change while the text grows.
- Headless Chrome with `--virtual-time-budget` does not run the animation loop; check visuals with `?mode=catalog` or a real browser.

## Product constraints

- No AI models, no accounts, no analytics. The only network call is the anonymous word report in `misses.js` (single lowercase words, no sentences or identifiers, off with one click, off under Global Privacy Control). Its endpoint is injected at build time from `DESCRIBBLE_REPORT_ENDPOINT` and must stay empty in the source; `PRIVACY.md` must always describe exactly what is sent. Never make collection invisible or undocumented.
- The parser is rule-based and must say honestly when it does not understand.
- Code is MIT, artwork is CC0 (`LICENSE`, `LICENSE-ASSETS`). All pieces are original; follow `CONTENT_POLICY.md`.
- Pieces use only absolute `M`, `C`, `L`, `Z` commands on a 512×512 grid, with shared anchors (eyes y≈266, mouth y≈352, chin y≈430).
- Rig curves must keep the same nodes across expressions so they can be blended; rough strokes are tied to point indices, not lengths.
- With `prefers-reduced-motion` the boil animation is disabled.
