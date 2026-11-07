# Vignette

Hand-drawn style avatars from a sentence.

Describe a character and watch Vignette draw it as you type. The eyes follow your cursor, and dragging the face turns its head. Pick from 36 ideas in the editor to start, then download a 1024 × 1024 PNG or copy a link to the drawing.

The original Describble contributors built the drawing engine. It uses an English dictionary, rules, and SVG artwork to draw in your browser.

## Run locally

Use Node.js 20.12 or newer.

```sh
cd app
npm start
```

Open [Vignette](http://127.0.0.1:4173/). Set `DESCRIBBLE_PORT` to use another local port.

From `app/`, `npm run build` builds the standalone editor at `dist/index.html`, the site at `dist/site/`, and the chat and debugging page at `dist/chat.html`. `npm test` runs the parser and renderer tests.

For a hosted build, set `AVATAR_SITE_URL` to the public origin for canonical URLs, share previews, and the sitemap.

## WebMCP

Open the editor in Chrome with WebMCP enabled. For local testing, turn on
`chrome://flags/#enable-webmcp-testing` and relaunch Chrome. See the [Chrome WebMCP guide](https://developer.chrome.com/docs/ai/webmcp).

Both tools take an English `description` of up to 500 characters, for example
`{"description":"scarlet cat-eye glasses, blonde hair, hazel eyes"}`.

- `generate_avatar_svg` returns SVG markup in `content[0].text`.
- `generate_avatar_png` returns a base64 PNG image in `content[0].data`.

The results are 1024 × 1024 and include filename, MIME type, width, and height
in `structuredContent`. The tools render in the browser without changing the open editor.

## License

- Code is [MIT](LICENSE).
- Drawn pieces and artwork are [CC0 1.0](LICENSE-ASSETS).
- Bricolage Grotesque is available under the [SIL Open Font License](app/assets/fonts/OFL.txt).
