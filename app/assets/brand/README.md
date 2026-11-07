# Brand

- `mark.svg` is the Vignette mark, an ink portrait on a folded page. It is the favicon and sits next to the wordmark in the site header.
- `apple-touch-icon.png` (180×180) renders the mark. `og.png` (1200×630) shows the wordmark, tagline, and three portraits drawn by the engine. `build.mjs` copies both into `dist/site/`.
- `docs/social-preview.png` (1280×640) is the repository preview image.

Vignette uses its own branding. The upstream license and attribution are in `LICENSE-ASSETS`.

Regenerate the PNGs after changing the mark or the gallery: render the same layout with a headless browser at the sizes above.
