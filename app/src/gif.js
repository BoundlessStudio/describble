// Minimal animated GIF encoder (GIF89a, one global palette, full frames, endless loop).
// The art is flat colour, so a popularity palette without dithering is enough.

// Picks the 256 most frequent colours (on a 5-bit grid) across all frames.
export function popularPalette(frames) {
  const counts = new Map();
  for (const pixels of frames) {
    for (let p = 0; p < pixels.length; p += 4 * 3) {
      const key = ((pixels[p] >> 3) << 10) | ((pixels[p + 1] >> 3) << 5) | (pixels[p + 2] >> 3);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 256)
    .map(([key]) => [((key >> 10) & 31) * 8 + 4, ((key >> 5) & 31) * 8 + 4, (key & 31) * 8 + 4]);
}

export function indexFrame(pixels, palette, cache) {
  const indices = new Uint8Array(pixels.length / 4);
  for (let i = 0, p = 0; i < indices.length; i++, p += 4) {
    const key = (pixels[p] << 16) | (pixels[p + 1] << 8) | pixels[p + 2];
    let index = cache.get(key);
    if (index === undefined) {
      let best = Infinity;
      palette.forEach(([r, g, b], j) => {
        const distance = (pixels[p] - r) ** 2 * 0.3 + (pixels[p + 1] - g) ** 2 * 0.59 + (pixels[p + 2] - b) ** 2 * 0.11;
        if (distance < best) {
          best = distance;
          index = j;
        }
      });
      cache.set(key, index);
    }
    indices[i] = index;
  }
  return indices;
}

function lzw(indices, bytes) {
  const minSize = 8;
  const clear = 1 << minSize;
  const end = clear + 1;
  let size = minSize + 1;
  let next = end + 1;
  let table = new Map();
  let buffer = 0;
  let bits = 0;
  const block = [];
  const flush = () => {
    bytes.push(block.length, ...block);
    block.length = 0;
  };
  const emit = (code) => {
    buffer |= code << bits;
    bits += size;
    while (bits >= 8) {
      block.push(buffer & 0xff);
      if (block.length === 255) flush();
      buffer >>>= 8;
      bits -= 8;
    }
  };
  bytes.push(minSize);
  emit(clear);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = (prefix << 8) | k;
    const known = table.get(key);
    if (known !== undefined) {
      prefix = known;
      continue;
    }
    emit(prefix);
    if (next === 4096) {
      emit(clear);
      table = new Map();
      size = minSize + 1;
      next = end + 1;
    } else {
      if (next >= 1 << size) size += 1;
      table.set(key, next++);
    }
    prefix = k;
  }
  emit(prefix);
  emit(end);
  if (bits > 0) block.push(buffer & 0xff);
  if (block.length) flush();
  bytes.push(0);
}

export function encodeGif(width, height, frames, palette, delayCs) {
  const bytes = [];
  const word = (value) => bytes.push(value & 0xff, (value >> 8) & 0xff);
  bytes.push(...[...'GIF89a'].map((c) => c.charCodeAt(0)));
  word(width);
  word(height);
  bytes.push(0xf7, 0, 0);
  for (let i = 0; i < 256; i++) bytes.push(...(palette[i] ?? [0, 0, 0]));
  bytes.push(0x21, 0xff, 0x0b, ...[...'NETSCAPE2.0'].map((c) => c.charCodeAt(0)), 0x03, 0x01, 0, 0, 0);
  for (const indices of frames) {
    bytes.push(0x21, 0xf9, 0x04, 0x04);
    word(delayCs);
    bytes.push(0, 0, 0x2c);
    word(0);
    word(0);
    word(width);
    word(height);
    bytes.push(0);
    lzw(indices, bytes);
  }
  bytes.push(0x3b);
  return new Uint8Array(bytes);
}
