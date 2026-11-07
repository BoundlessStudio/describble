# Changelog

All notable changes to Describble. The version is shown in the website footer.

## 0.4.5 (2026-11-07)

Clearer about AI.

- "No AI" now says what it means: no AI model runs in the app and nothing is generated when you type. The pages and the README also say plainly that the code and the SVG pieces were written with the help of Claude Code, an AI coding assistant.
- The pieces are described as ready-made, in a hand-drawn style, instead of drawn by hand.

## 0.4.4 (2026-11-07)

Words people typed after the r/webdev post.

- "skin" (and "pelle", "pele", "skin tone", "complexion") is a noun: "white skin", "skin tone dark" or "pelle scura" set the skin tone. Yellow and red skin draw nothing on purpose.
- Noses: "round nose", "bulbous nose", "protruding nose"; chins: "strong chin", "mento pronunciato"; "maschera da hockey".
- Moods: "confident", "excited", "horrified" (and "entusiasta", "inorridito").
- Two known words typed together are split: "redglasses", "longbeard", "glassesgray".
- Filler words such as "wearing", "slightly", "fairly", "sulla", "davanti" are no longer reported as unknown.

## 0.4.3 (2026-11-07)

- The moustache sits above the mouth instead of over it.
- The shag haircut is redrawn layered and wavy, with curled ends and a choppy fringe, instead of a mop top.

## 0.4.2 (2026-11-07)

- A colour between two things goes to the one that has no colour yet: "green hat purple t-shirt" gives a purple t-shirt and "blue eyes red hair" gives red hair, without needing "and".

## 0.4.1 (2026-11-06)

- The gallery faces are drawn once at build time as SVG files with descriptive names and alt text in the page's language, and the sitemap lists them, so they can show up in image search. The page also no longer draws twelve faces when it opens.

## 0.4.0 (2026-11-06)

The website speaks Portuguese.

- A Portuguese page at `/pt/`, with its own gallery and examples, and a PT button. Portuguese browsers open it on their own; what was understood is still listed in English.
- "vovó" and "vovô" (and "avó", "avô") lose their accents in the parser and looked the same, so they now only mean an older person; "vovozinha" and "vovozinho" keep grandma and grandpa.
- Word reports from the Portuguese page are sent as `pt`.
- On narrow phones the header no longer pushes the GitHub button off the screen.

## 0.3.0 (2026-11-06)

Easier to find.

- Pages written for what people search: a pfp maker (`/pfp-maker/`), an avatar maker without AI (`/no-ai-avatar-maker/`) and, in Italian, an avatar without a photo (`/it/avatar-senza-foto/`). Each has the live drawing, its own text and its own questions.
- Titles and headings now say what Describble is: a free avatar maker with no AI.
- The footer links every page, and the sitemap lists them all.

## 0.2.2 (2026-11-06)

- Stretched words are understood: "greeen eyes", "loooong hair", "baaald", "eyees". Only runs of three letters or doubled vowels are shortened, so Italian words like "tutta" stay as typed.

## 0.2.1 (2026-11-06)

Words people typed after the Portuguese release, and a way to say thanks.

- After a download, a short line invites a star on GitHub (only when the site has a repository link).
- New words: fair (skin) and fair hair, bold (bald) and bold eyebrows, thick beard, cross necklace, crucifix, cross and triangle earrings, liner, devilish smile, evil grin, windblown hair, drugged, "riga" for a side part.
- Words that change nothing (extremely, three, outside, blush, thick, volto) are no longer reported as unknown.
- The backlog now lists full lips, sunburn, medium-length hair, a big forehead, an energetic expression and beach backgrounds.

## 0.2.0 (2026-11-05)

A real dictionary, and a third language.

- Words now live in `dictionary/`, one file per language, separate from the code, with a checker (`node scripts/dictionary.mjs check | stats | missing <code>`).
- About 550 new Italian and English words and phrases for hair, faces, moods, hats, glasses, beards, clothes and details.
- Understands Portuguese: "menina ruiva com sardas", "cara careca de boné vermelho", "sem óculos". The page itself stays in English and Italian.
- A negation word inside a known phrase no longer negates what follows, so "piercing no nariz e alargadores" keeps both.
- "mascara" means lashes, and "cappello di paglia" is a straw hat, not a cigarette.

## 0.1.1 (2026-11-05)

Words people typed on launch day.

- Understands "dark" as a colour (dark hair, dark jacket) while "dark skin" stays dark skin.
- "blue-eyed", "green-eyed" and friends colour the eyes.
- New synonyms: blouse, button-up, checked, feminine, skinny / slim / thin, magro, "con la riga", woodchopper, ladro / thief.
- Words that change nothing (from, sorry, huge...) are no longer reported as unknown.
- The word backlog now lists bear ears, a Spartan helmet, a camera, drums, tongue out and multicolour hair, plus franchise items left out on purpose.

## 0.1.0 (2026-11-04)

First public release.

- Live drawing: the avatar is drawn while you type, with a 2.5D head that sways, blinks and turns when dragged.
- English and Italian, mixed freely, with honest messages for words it does not know.
- Hundreds of hand-drawn pieces: hair, hats, glasses, piercings and gauges, clothes, moods, jobs and archetypes.
- Download as a 1024 × 1024 PNG, share a link that redraws the same character, or let it surprise you.
- Website at describble.com, in English and Italian, with a clickable gallery and a questions section.
- Private by design: no AI, no accounts, no analytics; only single unknown words can be counted anonymously, and one click turns that off.
