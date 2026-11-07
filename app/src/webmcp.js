import { PRODUCT_NAME, PRODUCT_SLUG } from './brand.js';
import { applyMessage, initialState, MAX_INPUT } from './dialogue.js';
import { AVATAR_EXPORT_SIZE, renderAvatarPng, renderAvatarSvg } from './export.js';

const avatarInputSchema = {
  type: 'object',
  properties: {
    description: {
      type: 'string',
      minLength: 1,
      maxLength: MAX_INPUT,
      description: 'English description of the avatar, such as “scarlet cat-eye glasses, blonde hair, hazel eyes”.',
    },
  },
  required: ['description'],
  additionalProperties: false,
};

const pngDataPrefix = 'data:image/png;base64,';
const avatarToolError = (text) => ({ isError: true, content: [{ type: 'text', text }] });

function avatarTool(format) {
  const isSvg = format === 'svg';
  const mimeType = isSvg ? 'image/svg+xml' : 'image/png';
  const label = format.toUpperCase();
  return {
    name: `generate_avatar_${format}`,
    title: `Generate ${label} avatar`,
    description: `Draw a hand-drawn style avatar in ${PRODUCT_NAME} from an English description. Returns ${isSvg ? 'SVG markup as text' : 'a PNG image'} at ${AVATAR_EXPORT_SIZE} × ${AVATAR_EXPORT_SIZE}.`,
    inputSchema: avatarInputSchema,
    annotations: { readOnlyHint: true },
    async execute(input, options) {
      const signal = options?.signal;
      signal?.throwIfAborted();
      const raw = input?.description;
      if (typeof raw !== 'string' || !raw.trim() || raw.length > MAX_INPUT) {
        return avatarToolError(`Provide an English avatar description between 1 and ${MAX_INPUT} characters.`);
      }
      const { state, action } = applyMessage(initialState(), raw.trim());
      if (action || !state.started || state.confirmed) {
        return avatarToolError('Describe a drawable feature, such as curly hair, round glasses, or a green scarf.');
      }

      const structuredContent = {
        filename: `${PRODUCT_SLUG}-avatar.${format}`,
        mimeType,
        width: AVATAR_EXPORT_SIZE,
        height: AVATAR_EXPORT_SIZE,
      };
      if (isSvg) {
        return { content: [{ type: 'text', text: renderAvatarSvg(state).markup }], structuredContent };
      }

      const png = await renderAvatarPng(state, { signal });
      if (!png.startsWith(pngDataPrefix) || png.length === pngDataPrefix.length) {
        return avatarToolError('The avatar could not be encoded as PNG. Try requesting SVG.');
      }
      return { content: [{ type: 'image', mimeType, data: png.slice(pngDataPrefix.length) }], structuredContent };
    },
  };
}

export async function registerAvatarTools() {
  // Chrome's earlier WebMCP experiments exposed the same registration method on navigator.
  const modelContext = document.modelContext ?? navigator.modelContext;
  if (typeof modelContext?.registerTool !== 'function') return;
  for (const format of ['svg', 'png']) await modelContext.registerTool(avatarTool(format));
}
