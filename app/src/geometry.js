// Path geometry helpers (absolute M, C, L, Z commands only).
export function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function mirror(d) {
  let isX = true;
  return d.replace(/[MCLZ]|-?\d+(\.\d+)?/g, (token) => {
    if (/[MCLZ]/.test(token)) { isX = true; return token; }
    const value = isX ? 516 - Number(token) : Number(token);
    isX = !isX;
    return String(value);
  });
}

export function flatten(d) {
  const tokens = d.match(/[MCLZ]|-?\d+(\.\d+)?/g);
  const points = [];
  let i = 0;
  let cursor = [0, 0];
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    const command = tokens[i++];
    if (command === 'M' || command === 'L') {
      cursor = [num(), num()];
      points.push(cursor);
    } else if (command === 'C') {
      const [x0, y0] = cursor;
      const [x1, y1, x2, y2, x3, y3] = [num(), num(), num(), num(), num(), num()];
      const steps = Math.max(8, Math.ceil(Math.hypot(x3 - x0, y3 - y0) / 10));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const u = 1 - t;
        points.push([
          u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
          u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
        ]);
      }
      cursor = [x3, y3];
    }
  }
  return points;
}

export function resample(points, step) {
  const result = [points[0]];
  let carried = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const size = Math.hypot(bx - ax, by - ay);
    let at = step - carried;
    while (at <= size) {
      result.push([ax + ((bx - ax) * at) / size, ay + ((by - ay) * at) / size]);
      at += step;
    }
    carried = size - (at - step);
  }
  result.push(points[points.length - 1]);
  return result;
}

export const toPath = (points) => 'M' + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L') + ' Z';
