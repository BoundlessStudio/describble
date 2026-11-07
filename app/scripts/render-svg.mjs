// The drawing engine only needs these three DOM operations to render in Node.
const svgNode = (name) => ({
  name,
  attrs: {},
  children: [],
  parent: null,
  textContent: '',
  setAttribute(key, value) { this.attrs[key] = String(value); },
  append(...nodes) {
    for (const node of nodes) {
      node.parent = this;
      this.children.push(node);
    }
  },
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this);
  },
});

export const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function serialize(node) {
  const attributes = Object.entries(node.attrs).map(([key, value]) => ` ${key}="${escapeHtml(value)}"`).join('');
  const body = node.textContent ? escapeHtml(node.textContent) : node.children.map(serialize).join('');
  return `<${node.name}${attributes}>${body}</${node.name}>`;
}

export function renderSvg(draw, title) {
  const svg = svgNode('svg');
  const previousDocument = globalThis.document;
  try {
    globalThis.document = { createElementNS: (namespace, name) => svgNode(name) };
    draw(svg);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
  Object.assign(svg.attrs, { xmlns: 'http://www.w3.org/2000/svg', width: '512', height: '512' });
  if (title) svg.children.unshift({ ...svgNode('title'), textContent: title });
  return serialize(svg);
}
