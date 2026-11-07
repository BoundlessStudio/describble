# Roadmap

## Now: prototype

- [x] Live page: the avatar is drawn while you type, on a paper disc over a dark page
- [x] 2.5D head that sways, glances and can be dragged
- [x] Chat that turns Italian and English descriptions into an avatar
- [x] Hand-drawn renderer with confidence-driven boil and stroke-by-stroke redraws
- [x] Expression rig with blends (happy, sad, smug, blank stare…)
- [x] About 200 piece variants, archetype words, made-up brand logos
- [x] PNG export, share link and a website with a clickable gallery, in English and Italian
- [x] A backlog of words not understood yet, kept in the repository

## Next: foundations

- [x] Choose a final, unique name: Describble
- [ ] Move to a TypeScript monorepo (`core`, `pieces`, `render`, `element`, `web`) once more people contribute
- [ ] One data file per piece with a schema checked at build time
- [ ] Renderer that outputs an SVG string without a browser
- [x] README demo GIF recorded from the app itself
- [x] CI that runs the tests on every push; the site deploys to describble.com on Cloudflare from `main`

## Then: growth

- [ ] `<describble-avatar>` web component
- [ ] Optional endpoint returning an SVG for a description, usable in an `<img>` tag
- [ ] Import pieces drawn in a vector editor, so artists can contribute without code
- [ ] GIF export of the drawing process
- [ ] More languages for the lexicon
- [ ] Mobile performance pass
- [ ] Full 360° turn (profile and back views, or a 3D line-art head)
