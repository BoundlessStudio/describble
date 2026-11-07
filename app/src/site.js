// English site copy, avatar ideas and the links configured at build time.

import { PRODUCT_NAME, PRODUCT_TAGLINE } from './brand.js';
import { applyMessage, describe, initialState, sceneFor } from './dialogue.js';
import { createBlink, idlePose } from './live-portrait.js';
import { createStage, SVG_NS } from './stage.js';

// Filled in by build.mjs from DESCRIBBLE_REPO_URL and DESCRIBBLE_SUPPORT_URL; empty links stay hidden.
export const SITE_LINKS = { repo: '', support: '' };

export const siteCopy = {
  title: `${PRODUCT_NAME} · ${PRODUCT_TAGLINE}`,
  kicker: 'Free avatar maker · no AI generation, no sign-up',
  description: 'Type a description and get a sketchy, hand-drawn style avatar in seconds. Free pfp maker: no AI generation, no photo, no sign-up. Download a PNG for Discord, GitHub or WhatsApp.',
  headline: 'Describe someone. Watch them get drawn.',
  lede: `${PRODUCT_TAGLINE}. No AI model, no account, nothing to install.`,
  inputLabel: 'Describe the character',
  stageLabel: 'The character you are describing',
  download: 'Download PNG',
  downloaded: 'Saved',
  afterSave: `Like it? A star on GitHub helps other people find ${PRODUCT_NAME}.`,
  share: 'Copy link',
  shared: 'Link copied',
  surprise: 'Surprise me',
  github: 'GitHub',
  viewOnGithub: 'View on GitHub',
  supportShort: 'Support',
  galleryTitle: 'Avatar ideas to start from',
  galleryNote: 'Tap a face to write its sentence, then change any word.',
  avatarAlt: 'Hand-drawn style avatar',
  howTitle: 'An avatar maker with no AI model. Just words and rules.',
  how: [
    'Every word you write picks a ready-made piece: hair, hats, glasses, piercings, moods. If it does not know a word, it tells you.',
    'Change a word and only that piece is redrawn. The lines keep wobbling a little, like a sketch that is still alive.',
    'It runs in your browser and keeps working offline. Your sentence never leaves your device.',
  ],
  useTitle: 'Make your profile picture (pfp)',
  use: ['Describe yourself, or anyone.', 'Download the PNG: 1024 × 1024, ready for a round crop.', 'Upload it on GitHub, Discord, Slack or wherever you have a face.'],
  openTitle: 'Open source, and free to use',
  open: 'The code is MIT and every drawing is CC0: use your avatar anywhere, no credit needed. Missing a word or a hat? Suggest it, or draw it.',
  suggest: 'Suggest a word',
  code: 'Read the code',
  supportTitle: 'Keep it free',
  support: `${PRODUCT_NAME} has no ads and no paid plan. If it made you smile, you can buy the drawings a coffee.`,
  supportLink: 'Support on Ko-fi',
  privacy: 'Your sentence stays in your browser.',
  privacyReports: 'To grow the dictionary, single words it did not understand are counted anonymously. Never your sentence.',
  reports: (on) => `Word reports: ${on ? 'on' : 'off'}`,
  license: 'Code MIT, drawings CC0.',
  footerPrivacy: 'Privacy',
  footerCode: 'Source code',
  footerIssue: 'Report a problem',
  faqTitle: 'Questions about the avatar maker',
  faqQ1: `Is ${PRODUCT_NAME} really free?`,
  faqA1: 'Yes. No sign-up, no watermark, no paid plan. Describe someone, download the PNG and it is yours.',
  faqQ2: 'Does it use AI?',
  faqA2: 'Not when you use it. No AI model runs: your words are matched against a curated dictionary, each match picks a ready-made piece, and the same sentence always gives the same face, all in your browser.',
  faqQ3: 'Can I use my avatar anywhere?',
  faqA3: 'Yes. Every drawing is CC0: use it as your profile picture on GitHub, Discord, WhatsApp, Twitch or Slack, in a game or a project, even a commercial one, with no credit needed.',
  faqQ4: 'How do I set it as my profile picture?',
  faqA4: 'Describe the character, press Download PNG (1024 × 1024, fits a round crop), then upload the image in your profile settings.',
  faqQ5: 'Is what I write private?',
  faqA5: 'Your sentence never leaves your browser. To learn new words, single words it did not understand can be counted anonymously, never the sentence, and one click turns that off.',
  faqQ6: 'What language can I use?',
  faqA6: 'Write your description in English.',
  faqQ7: 'Can browser agents create avatars with WebMCP?',
  faqA7: 'On vignette.rgbknights.com, an agent using a browser with WebMCP support can turn an English description into a 1024 × 1024 avatar in SVG or PNG.',
  noscript: `${PRODUCT_NAME} draws with JavaScript. Turn it on to describe your character.`,
};

// Pages written for one search: the same live drawing, with their own title, text and questions.
// Each one is published at its path. Copy it leaves out comes from siteCopy.
export const sitePages = {
  pfp: {
    path: '/pfp-maker/',
    title: `Free PFP Maker: Draw Your Profile Picture from Text, No AI Generation · ${PRODUCT_NAME}`,
    description: 'Make a hand-drawn style pfp for Discord, Steam, Twitch or X by typing what you look like. Free, no AI generation, no photo, no sign-up.',
    kicker: 'Free pfp maker · no AI generation',
    headline: 'Describe yourself. Get a sketchy pfp.',
    lede: 'Type what you, or your character, look like and a profile picture draws itself. Free, no AI model, no account.',
    pageTitle: 'A pfp that looks like you, not like everyone else\'s',
    pageText: [
      'Most pfp makers hand you a random face or a long list of sliders. Here you just write it down: "headset, backwards cap, tired eyes", "pink bob, heart glasses, freckles", "grumpy pirate grandma". Every word picks a ready-made piece.',
      'The PNG is 1024 × 1024 with the face in the middle, so it survives the round crop of Discord, Twitch, X and Steam. Keep the link to redraw the same face later, or change one word for an alt.',
      'It is free with no watermark, the drawings are CC0, and nothing you type leaves your browser.',
    ],
    faqQ1: 'Is this pfp maker really free?',
    faqA1: 'Yes. No sign-up, no watermark, no credits to buy. Describe your character, download the PNG and it is yours.',
    faqQ2: 'Will it work on Discord, Steam or Twitch?',
    faqA2: 'Yes. The PNG is a 1024 × 1024 square with the face centred, so it fits the round and square crops those sites use. Upload it in your profile settings.',
  },
  noai: {
    path: '/no-ai-avatar-maker/',
    title: `No-AI Avatar Maker: No Model, Just a Dictionary and Drawings · ${PRODUCT_NAME}`,
    description: 'An avatar maker with no AI model inside: type a description and ready-made pieces are put together while you type. Free, open source, runs in your browser.',
    kicker: 'Avatar maker without an AI model',
    headline: 'An avatar maker with no AI model inside.',
    lede: 'No image generation and no prompt: a dictionary and a fixed set of drawings, put together in your browser while you type.',
    pageTitle: 'Why no AI model?',
    pageText: [
      'No model trained on anyone\'s art draws your avatar. Every hair style, hat and pair of glasses is one of a fixed set of original SVG pieces, released as CC0. They were written as code with the help of Claude Code, an AI coding assistant, and you can read every one of them on GitHub.',
      'There is no prompt guessing. Your words are looked up in a dictionary, so the same sentence always gives the same kind of face, and when it does not know a word it says so instead of making something up.',
      'Because there is no model, it runs entirely in your browser, works offline and sends nothing anywhere: no photo, no account, no server drawing for you.',
    ],
    faqQ1: 'How does it work without AI?',
    faqA1: 'A rule-based parser matches your words and short phrases against a curated dictionary. Each match turns on a ready-made piece, and a small renderer draws the pieces as wobbly pen strokes.',
    faqQ2: 'Is the result AI art?',
    faqA2: 'Nothing is generated by a model when you type: the same sentence always gives the same face from the same fixed pieces.',
  },
};

// A page's own copy takes precedence over the default copy.
export const pageCopy = (page) => ({ ...siteCopy, ...sitePages[page] });

// Gallery sentences: each one is a real input, so tapping it shows exactly how it was made.
export const siteGallery = [
  'pearl-white space helmet, pumpkin-orange spacesuit, square jaw, firm frown',
  'copper-red cornrows, deep brown skin, sage-green cardigan',
  'scarlet cat-eye spectacles, ice-blond shoulder-length lob, hazel eyes',
  'slate-blue trapper hat, berry-red puffer coat, rosy nose',
  'cocoa-brown bear ear headband, grape-purple dress, face star stickers',
  'vintage camera on a neck strap, black high-neck jumper, pearl-white bob',
  'cobalt bicycle helmet, silver shell jacket, salt-white chin beard',
  'Bantu knots, aubergine hair, coffee-brown turtleneck, enamel pin',
  'seafoam wraparound visor, purple checkerboard vest, ash-brown goatee',
  'cream straw boater, mulberry blouse, string of pearls',
  'pewter crested helmet, plate armour, worried expression',
  'auburn widow’s peak, navy diamond-knit sweater, orange backdrop',
  'amber aviator sunglasses, jet-black buzz cut, white scrub top, blue ID lanyard',
  'moss-green camouflage jacket, cobalt bowl-cut bob, lilac eye shadow',
  'ivory antler crown, lilac frock, rosy complexion, tiny nose',
  'navy sou\'wester, butter-yellow raincoat, olive complexion',
  'grey pinstriped suit without a tie, chestnut soul patch, amber irises',
  'red flat cap, white pencil moustache, aubergine fishnet shirt',
  'plum high pony, lilac button-down, behind-the-ear hearing aids',
  'blue yarmulke, gray cardigan, coffee-brown browline glasses',
  'long plaited beard, mustard western shirt, amber bolo tie, violet backdrop',
  'cinnamon low ponytail, powder-blue collared top, small pearl studs',
  'jittery wide-awake expression, auburn hair, lemon-yellow tracksuit, amber backdrop',
  'powder-blue ski goggles, head torch, burgundy puffer coat, ginger buzzcut',
  'navy sailor cap, white sailor shirt, gold heart locket, cobalt backdrop',
  'wine-red wool beret, oatmeal cardigan, hazel eyes',
  'fluorescent orange safety helmet, denim dungarees, freckles, small round nose',
  'blush-pink wide-brimmed sunhat, blue striped Breton top, button nose',
  'double space buns in bubblegum pink hair, coral polka-dot blouse, violet irises',
  'raspberry razor shag, black mock-neck sweater, beauty spot',
  'silver hair, cartilage helix ring, cream open-collar shirt, star tattoo',
  'periwinkle complexion, cheek star decals, green sleeveless jersey, muted pink backdrop',
  'heavy-lidded eyes, tired frown, brown plaid waistcoat, hook nose',
  'bottle-green headscarf hijab, white rollneck, rosy complexion, tiny nose',
  'white chef toque, crimson kitchen apron, oval face, one raised eyebrow',
  'platinum undercut, butter-yellow floral-print dress, nose hoop',
];

// Under the text: what was understood, as a quiet list; honest messages only for unknown words.
export function statusLine(result, state) {
  if (/I don't know|I can't|Did you mean|for what/.test(result.reply)) return result.reply;
  return state.started ? describe(state).replace(/^Avatar: /, '') : '';
}

// A shared link carries the sentence and the seed after the #, which browsers never send to a server.
export function shareLink(text, seed) {
  const url = new URL(location.href);
  url.hash = new URLSearchParams({ s: text, k: seed.toString(36) }).toString();
  return url.href;
}

export function readSharedLink() {
  const params = new URLSearchParams(location.hash.slice(1));
  const text = (params.get('s') ?? '').slice(0, 400);
  const seed = parseInt(params.get('k') ?? '', 36);
  return text.trim() ? { text, seed: Number.isFinite(seed) ? seed : undefined } : null;
}

// Copies with the clipboard API where allowed (https), with the old selection trick as a fallback (file://).
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = Object.assign(document.createElement('textarea'), { value: text });
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const done = document.execCommand('copy');
    area.remove();
    return done;
  }
}

// Links are shown only when configured, so a fork never points at someone else's page.
export function applySiteLinks() {
  const repo = SITE_LINKS.repo.replace(/\/+$/, '');
  const targets = { repo, releases: repo && `${repo}/releases`, issues: repo && `${repo}/issues/new/choose`, privacy: repo && `${repo}/blob/main/PRIVACY.md`, support: SITE_LINKS.support };
  for (const element of document.querySelectorAll('[data-link]')) {
    const href = targets[element.dataset.link];
    if (href) element.href = href;
    else element.hidden = true;
  }
  for (const block of document.querySelectorAll('[data-needs]')) {
    if (!targets[block.dataset.needs]) block.hidden = true;
  }
}

const galleryYaws = [-0.3, 0, 0.3];

// The gallery uses the same seeded artwork in the build and in the browser.
export function createGalleryPortrait(svg, sentence, seed, index) {
  const { state } = applyMessage({ ...initialState(), seed }, sentence);
  const stage = createStage(svg, { instant: true });
  stage.update(sceneFor({ ...state, confirmed: true }), 0);
  stage.setPose({ yaw: galleryYaws[index % galleryYaws.length] });
  stage.draw(1, 0);
  return stage;
}

export function buildSiteGallery(onPick, calm) {
  const tiles = new Map();
  for (const [index, button] of document.querySelectorAll('#gallery button').entries()) {
    const sentence = siteGallery[index];
    const seed = Number(button.dataset.seed);
    button.addEventListener('click', () => onPick(sentence, seed));
    tiles.set(button, { image: button.querySelector('img'), sentence, seed, index, portrait: null });
  }
  if (calm) return () => {};

  const visible = new Set();
  const observer = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      const tile = tiles.get(target);
      if (isIntersecting) {
        visible.add(tile);
      } else {
        visible.delete(tile);
        if (tile.portrait) {
          tile.portrait.svg.replaceWith(tile.image);
          tile.portrait = null;
        }
      }
    }
  });
  for (const button of tiles.keys()) observer.observe(button);

  let lastSwayFrame = -1;
  return (now, { clientX, clientY }) => {
    if (!visible.size) return;
    // Small portraits can sway at 30 fps while gaze and blinks still use every frame.
    const swayFrame = Math.floor(now / (1000 / 30));
    const swayDue = swayFrame !== lastSwayFrame;
    lastSwayFrame = swayFrame;
    const bounds = Array.from(visible, (tile) => ({
      tile,
      rect: clientX === null ? null : (tile.portrait?.svg ?? tile.image).getBoundingClientRect(),
    }));
    // Spread the first drawing of a newly visible row over a few frames.
    let remaining = 4;
    for (const { tile, rect } of bounds) {
      if (!tile.portrait) {
        if (!remaining) continue;
        remaining -= 1;
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('aria-hidden', 'true');
        const stage = createGalleryPortrait(svg, tile.sentence, tile.seed, tile.index);
        tile.image.replaceWith(svg);
        tile.portrait = {
          svg, stage, gaze: [0, 0], blinkAt: createBlink(now), lastBlink: 0, appearedAt: now,
        };
      }

      const portrait = tile.portrait;
      const { stage, gaze } = portrait;
      if (swayDue) {
        // Stagger the sway and ease in from the still thumbnail's angle.
        const { yaw, roll, bob } = idlePose(now + tile.index * 1700);
        const blend = Math.min(1, (now - portrait.appearedAt) / 450);
        stage.setPose({
          yaw: galleryYaws[tile.index % galleryYaws.length] + yaw * blend,
          roll: roll * blend,
          bob: bob * blend,
        });
      }

      let gazeChanged = false;
      if (rect) {
        const dx = clientX - rect.left - rect.width / 2;
        const dy = clientY - rect.top - rect.height / 2;
        const distance = Math.max(1, rect.width / 2, Math.hypot(dx, dy));
        const x = dx / distance - gaze[0];
        const y = dy / distance - gaze[1];
        gazeChanged = Math.abs(x) >= 0.01 || Math.abs(y) >= 0.01;
        if (gazeChanged) {
          gaze[0] += x * 0.15;
          gaze[1] += y * 0.15;
        }
      }

      const blink = portrait.blinkAt(now);
      if (blink !== portrait.lastBlink) {
        // The eyelids need the face rig; gaze alone only moves the pupils.
        stage.setLife({ blink, gaze });
        stage.draw(now, 0, { faceOnly: true });
        portrait.lastBlink = blink;
      } else if (gazeChanged) {
        stage.setGaze(gaze);
      }
    }
  };
}
