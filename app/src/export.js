import { PRODUCT_SLUG } from './brand.js';
import { PAPER, SVG_NS } from './pen.js';
import { createStage } from './stage.js';
import { sceneFor } from './dialogue.js';

export const AVATAR_EXPORT_SIZE = 1024;

// Render the finished drawing without mounting it in the editor.
export function renderAvatarSvg(state, { paint = (colors) => colors, fillScale = 1 } = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('width', AVATAR_EXPORT_SIZE);
  svg.setAttribute('height', AVATAR_EXPORT_SIZE);
  const stage = createStage(svg, { instant: true, fillScale });
  const scene = sceneFor({ ...state, started: true, confirmed: true });
  scene.colors = paint(scene.colors);
  stage.update(scene, 0);
  stage.draw(1, 0);
  return { markup: new XMLSerializer().serializeToString(svg), background: scene.colors.background ?? PAPER };
}

export async function renderAvatarPng(state, options) {
  const signal = options?.signal;
  signal?.throwIfAborted();
  const { markup, background } = renderAvatarSvg(state, options);
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    signal?.throwIfAborted();
    const canvas = Object.assign(document.createElement('canvas'), { width: AVATAR_EXPORT_SIZE, height: AVATAR_EXPORT_SIZE });
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas rendering is unavailable.');
    context.fillStyle = background;
    context.fillRect(0, 0, AVATAR_EXPORT_SIZE, AVATAR_EXPORT_SIZE);
    context.drawImage(image, 0, 0, AVATAR_EXPORT_SIZE, AVATAR_EXPORT_SIZE);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function exportPng(state, paint, fillScale) {
  const png = await renderAvatarPng(state, { paint, fillScale });
  Object.assign(document.createElement('a'), { href: png, download: `${PRODUCT_SLUG}-avatar.png` }).click();
  return png;
}
