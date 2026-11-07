// Face rig: every stroke is a single cubic with the same nodes in every expression.
// Left eye, mirrored around x=258. Eyes and mouth are blended separately.
const expressions = {
  neutro: {
    brow: 'M190 236 C202 228 222 228 236 234',
    upper: 'M194 266 C202 258 226 258 234 266',
    lower: 'M194 266 C202 274 226 274 234 266',
    pupil: [214, 266, 9],
    mouthTop: 'M226 352 C244 350 272 350 290 352',
    mouthBottom: 'M226 352 C244 354 272 354 290 352',
  },
  felice: {
    brow: 'M190 228 C202 216 224 216 236 226',
    upper: 'M194 268 C202 254 226 254 234 268',
    lower: 'M194 268 C204 262 224 262 234 268',
    pupil: [214, 262, 8],
    mouthTop: 'M218 342 C240 356 276 356 298 338',
    mouthBottom: 'M218 342 C240 384 276 384 298 338',
  },
  sorriso: {
    brow: 'M190 232 C202 222 222 222 236 230',
    upper: 'M194 266 C202 256 226 256 234 266',
    lower: 'M194 266 C202 272 226 272 234 266',
    pupil: [214, 265, 9],
    mouthTop: 'M222 344 C242 362 274 362 294 342',
    mouthBottom: 'M222 344 C242 366 274 366 294 342',
  },
  sorrisetto: {
    brow: 'M190 234 C202 228 222 228 236 232',
    upper: 'M194 266 C202 260 226 260 234 266',
    lower: 'M194 266 C202 272 226 272 234 266',
    pupil: [216, 266, 8],
    mouthTop: 'M226 354 C246 360 274 356 296 338',
    mouthBottom: 'M226 354 C246 364 276 360 296 338',
  },
  triste: {
    brow: 'M190 240 C204 238 224 228 236 220',
    upper: 'M194 268 C202 262 226 260 234 264',
    lower: 'M194 268 C202 276 226 276 234 264',
    pupil: [214, 270, 8],
    mouthTop: 'M228 364 C244 346 272 346 288 364',
    mouthBottom: 'M228 364 C244 350 272 350 288 364',
  },
  arrabbiato: {
    brow: 'M188 226 C204 230 222 240 240 252',
    upper: 'M194 264 C204 262 224 262 234 270',
    lower: 'M194 264 C202 274 226 276 234 270',
    pupil: [216, 268, 8],
    mouthTop: 'M226 358 C244 350 272 350 290 358',
    mouthBottom: 'M226 358 C244 368 272 368 290 358',
  },
  stanco: {
    brow: 'M190 238 C204 236 222 236 236 238',
    upper: 'M194 268 C202 266 226 266 234 268',
    lower: 'M194 268 C202 278 226 278 234 268',
    pupil: [214, 273, 7],
    mouthTop: 'M228 356 C246 358 270 358 288 354',
    mouthBottom: 'M228 356 C246 360 270 360 288 354',
  },
  chiusi: {
    brow: 'M190 238 C204 234 222 234 236 238',
    upper: 'M194 270 C202 278 226 278 234 270',
    lower: 'M194 270 C202 279 226 279 234 270',
    pupil: [214, 272, 0],
    mouthTop: 'M230 354 C246 356 270 356 286 354',
    mouthBottom: 'M230 354 C246 357 270 357 286 354',
  },
  compiaciuto: {
    brow: 'M190 230 C202 224 222 226 236 232',
    upper: 'M194 270 C202 264 226 262 234 266',
    lower: 'M194 270 C202 278 226 278 234 268',
    pupil: [216, 272, 8],
    mouthTop: 'M220 356 C244 364 278 358 300 334',
    mouthBottom: 'M220 356 C244 366 280 362 300 334',
  },
  vuoto: {
    brow: 'M190 232 C204 232 222 232 236 232',
    upper: 'M194 266 C202 256 226 256 234 266',
    lower: 'M194 266 C202 276 226 276 234 266',
    pupil: [214, 266, 4],
    mouthTop: 'M236 356 C248 356 266 356 280 356',
    mouthBottom: 'M236 356 C248 357 266 357 280 356',
  },
  disperato: {
    brow: 'M190 244 C204 240 222 226 236 216',
    upper: 'M194 268 C202 258 226 258 234 264',
    lower: 'M194 268 C202 280 226 280 234 264',
    pupil: [214, 272, 7],
    mouthTop: 'M226 368 C240 348 276 348 290 368',
    mouthBottom: 'M226 368 C240 392 276 392 290 368',
  },
  sorpreso: {
    brow: 'M190 220 C202 206 224 206 236 218',
    upper: 'M194 266 C200 248 228 248 234 266',
    lower: 'M194 266 C200 284 228 284 234 266',
    pupil: [214, 266, 6],
    mouthTop: 'M240 358 C240 330 278 330 278 358',
    mouthBottom: 'M240 358 C240 390 278 390 278 358',
  },
};

export const EYE_KEYS = ['brow', 'upper', 'lower', 'pupil'];
export const MOUTH_KEYS = ['mouthTop', 'mouthBottom'];
export const STROKE_KEYS = ['brow', 'upper', 'lower', 'mouthTop', 'mouthBottom'];
export const SAMPLES = 17;
const EYE_OPEN = 1.35;

const cubicNumbers = (d) => d.match(/-?\d+(\.\d+)?/g).map(Number);
const rig = Object.fromEntries(Object.entries(expressions).map(([name, face]) => [
  name,
  { ...Object.fromEntries(STROKE_KEYS.map((key) => [key, cubicNumbers(face[key])])), pupil: face.pupil },
]));

// Lexicon moods as weights of the drawn expressions.
export const moodEyes = {
  neutral: { neutro: 1 },
  happy: { felice: 1 },
  sad: { triste: 1 },
  angry: { arrabbiato: 1 },
  tired: { stanco: 1 },
  surprised: { sorpreso: 1 },
  scared: { sorpreso: 0.6, triste: 0.4 },
  bored: { stanco: 0.7, neutro: 0.3 },
  smug: { compiaciuto: 1 },
  blank: { vuoto: 1 },
  despair: { disperato: 1 },
  disgusted: { arrabbiato: 0.5, stanco: 0.3, neutro: 0.2 },
  asleep: { chiusi: 1 },
  excited: { sorpreso: 0.7, felice: 0.3 },
  worried: { triste: 0.65, sorpreso: 0.35 },
};
export const moodMouth = {
  neutral: { neutro: 1 },
  happy: { felice: 1 },
  sad: { triste: 1 },
  angry: { arrabbiato: 1 },
  tired: { stanco: 1 },
  surprised: { sorpreso: 1 },
  scared: { sorpreso: 0.5, triste: 0.5 },
  bored: { stanco: 1 },
  smug: { compiaciuto: 1 },
  blank: { vuoto: 1 },
  despair: { disperato: 1 },
  disgusted: { triste: 0.6, sorrisetto: 0.4 },
  asleep: { chiusi: 1 },
  excited: { felice: 0.6, sorpreso: 0.4 },
  worried: { triste: 0.8, neutro: 0.2 },
};
export const mouthShapes = {
  smile: { sorriso: 1 },
  smirk: { sorrisetto: 1 },
  frown: { triste: 1 },
  open: { sorpreso: 1 },
  flat: { neutro: 1 },
};

function blendKeys(weights, keys) {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0) || 1;
  return Object.fromEntries(keys.map((key) => [
    key,
    rig.neutro[key].map((_, i) => Object.entries(weights).reduce((sum, [name, w]) => sum + rig[name][key][i] * (w / total), 0)),
  ]));
}

function sampleCubic([x0, y0, x1, y1, x2, y2, x3, y3], count) {
  return Array.from({ length: count }, (_, s) => {
    const t = s / (count - 1);
    const u = 1 - t;
    return [
      u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
      u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
    ];
  });
}

// Sampled face shapes. eyeScale [x, y] stretches the eyes around their centre.
export function faceShapes(eyeWeights, mouthWeights, eyeScale = [1, 1]) {
  const face = { ...blendKeys(eyeWeights, EYE_KEYS), ...blendKeys(mouthWeights, MOUTH_KEYS) };
  // The drawn eyes are narrow: open them vertically so they read at small sizes too.
  const [sx, sy] = [eyeScale[0], eyeScale[1] * EYE_OPEN];
  const scale = ([x, y]) => [214 + (x - 214) * sx, 266 + (y - 266) * sy];
  const shapes = {};
  for (const key of STROKE_KEYS) {
    const points = sampleCubic(face[key], SAMPLES);
    shapes[key] = MOUTH_KEYS.includes(key) ? points : points.map(scale);
  }
  const [x, y, r] = face.pupil;
  return { shapes, pupil: [...scale([x, y]), r * Math.min(sx, sy / EYE_OPEN) * 1.15] };
}

export function mixWeights(a, b, t) {
  const result = {};
  for (const name of new Set([...Object.keys(a), ...Object.keys(b)])) {
    result[name] = (a[name] ?? 0) * (1 - t) + (b[name] ?? 0) * t;
  }
  return result;
}
