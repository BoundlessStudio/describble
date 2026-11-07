// Catalog of original pieces, 512x512 canvas, absolute M, C, L, Z commands only.
// catalog[slot][variant] = parts; each part declares the SVG layer it is drawn in.
// Colours are keys (skin, hair, clothes...) resolved at render time, or fixed hex values.
import { flatten, mirror, mulberry32 } from './geometry.js';

export const LAYERS = ['back', 'body', 'bodyOver', 'earLeft', 'earRight', 'head', 'nose', 'skinDetail', 'facial', 'mouth', 'mouthAcc', 'eyes', 'eyewear', 'front', 'lobeLeft', 'lobeRight', 'hat', 'over'];

const twin = (lines) => [...lines, ...lines.map(mirror)];
const twinShapes = (shapes) => [...shapes, ...shapes.map((shape) => ({ ...shape, d: mirror(shape.d) }))];
const ring = (x, y, r) => `M${x - r} ${y} C${x - r} ${y - r * 1.33} ${x + r} ${y - r * 1.33} ${x + r} ${y} C${x + r} ${y + r * 1.33} ${x - r} ${y + r * 1.33} ${x - r} ${y} Z`;

function scatter(seed, count, accept, r, color, opacity) {
  const random = mulberry32(seed);
  const dots = [];
  for (let tries = 0; dots.length < count && tries < count * 40; tries++) {
    const x = 160 + random() * 196;
    const y = 180 + random() * 260;
    if (accept(x, y)) dots.push({ x, y, r: r * (0.7 + random() * 0.6), color, opacity });
  }
  return dots;
}

// ---------- torso and clothes ----------
const torso = {
  shapes: [{ d: 'M204 412 C130 426 76 468 54 524 L462 524 C438 468 384 428 312 414 C282 440 232 438 204 412 Z', color: 'clothes' }],
  blotches: [
    { d: 'M214 424 C240 470 286 470 304 424 C330 450 300 492 258 492 C216 492 190 452 214 424 Z', color: 'clothesDark' },
    { d: 'M110 512 C126 484 150 466 176 456 C162 480 152 496 150 512 Z', color: 'clothesDark' },
  ],
  scratches: ['M120 508 L150 462', 'M136 510 L164 464', 'M372 508 L348 462', 'M392 510 L366 466'],
  lines: ['M204 412 C130 426 76 468 54 516', 'M312 414 C384 428 438 468 462 516'],
};
const neck = { shapes: [{ d: 'M214 380 L214 432 C240 446 278 446 304 432 L304 380 Z', color: 'skin' }], blotches: [{ d: 'M214 400 C240 420 280 420 304 400 L304 424 C278 440 240 440 214 424 Z', color: 'skinShadow' }] };
const crew = { lines: ['M214 424 C240 458 280 458 304 424'] };
const body = (...extra) => [
  { layer: 'body', ...neck },
  { layer: 'body', ...torso },
  ...extra.map((part) => ({ layer: 'body', ...part })),
];

const clothes = {
  tshirt: body(crew),
  hoodie: body(
    { shapes: [{ d: 'M190 420 C200 380 316 380 326 420 C300 446 216 446 190 420 Z', color: 'clothes' }], lines: ['M190 420 C200 380 316 380 326 420', 'M196 424 C230 450 286 450 320 424'] },
    { calm: true, lines: ['M238 446 L234 496', 'M280 446 L284 496'] },
  ),
  jacket: body(
    { shapes: [{ d: 'M214 424 C240 458 280 458 304 424 L280 524 L238 524 Z', color: 'paper', exact: true }], lines: ['M214 424 L240 524', 'M304 424 L278 524', 'M214 424 C240 458 280 458 304 424'] },
    { calm: true, lines: ['M214 424 L196 470 L232 470', 'M304 424 L322 470 L286 470'] },
  ),
  suit: body(
    { shapes: [{ d: 'M214 424 C240 458 280 458 304 424 L280 524 L238 524 Z', color: 'paper', exact: true }], lines: ['M214 424 L240 524', 'M304 424 L278 524'] },
    { lines: ['M236 436 L258 450 L282 436'] },
  ),
  // Black shirt with a white tab in a stand collar.
  clerical: body(
    { shapes: [{ d: 'M212 424 C240 446 278 446 306 424 L308 444 C282 464 236 464 210 444 Z', color: 'clothesDark' }], lines: ['M212 424 C240 446 278 446 306 424', 'M210 444 C236 464 284 464 308 444'] },
    { shapes: [{ d: 'M242 436 L276 436 L276 462 L242 462 Z', color: '#f4f1ea', exact: true }], lines: ['M242 436 L276 436 L276 462 L242 462 Z'] },
  ),
  // Zip-up track jacket with a stand collar and a stripe down each sleeve.
  tracksuit: body(
    { shapes: [{ d: 'M212 400 C240 414 278 414 306 400 L310 428 C284 442 236 442 208 428 Z', color: 'clothesDark' }], lines: ['M212 400 C240 414 278 414 306 400 L310 428', 'M208 428 L212 400', 'M208 428 C236 442 284 442 310 428'] },
    { lines: ['M258 438 L258 524'], dots: [{ x: 258, y: 446, r: 4 }] },
    { calm: true, lineColor: '#f4f1ea', lines: ['M184 436 C140 456 104 486 88 516', 'M334 436 C378 456 414 486 430 516'] },
  ),
  openShirt: body(
    { shapes: [{ d: 'M214 424 L258 492 L304 424 C282 440 236 440 214 424 Z', color: 'skin' }], lines: ['M214 424 L258 492 L304 424'] },
    { shapes: [{ d: 'M214 424 L196 452 L232 466 Z', color: 'clothesDark' }, { d: 'M304 424 L322 452 L286 466 Z', color: 'clothesDark' }], lines: ['M214 424 L196 452 L232 466', 'M304 424 L322 452 L286 466'] },
    { dots: [{ x: 262, y: 500, r: 3.5 }] },
  ),
  shirt: body(
    { lines: ['M214 424 L236 458 L258 440 L282 458 L304 424', 'M258 440 L258 524'] },
    { dots: [{ x: 266, y: 468, r: 3.5 }, { x: 266, y: 496, r: 3.5 }] },
  ),
  sweater: body(
    { shapes: [{ d: 'M206 414 C232 452 286 452 312 414 L316 428 C290 470 228 470 202 428 Z', color: 'clothesDark' }], lines: ['M206 414 C232 452 286 452 312 414', 'M202 428 C228 470 290 470 316 428'] },
    { calm: true, lines: ['M222 446 L218 458', 'M240 452 L238 464', 'M258 454 L258 466', 'M276 452 L278 464', 'M294 446 L298 458'] },
  ),
  turtleneck: body(
    { shapes: [{ d: 'M212 372 C240 386 280 386 306 372 L312 424 C284 444 236 444 206 424 Z', color: 'clothes' }], lines: ['M212 372 C240 386 280 386 306 372 L312 424', 'M206 424 L212 372', 'M206 424 C236 444 284 444 312 424'] },
    { calm: true, lines: ['M222 384 L220 430', 'M240 388 L240 436', 'M258 390 L258 438', 'M276 388 L276 436', 'M294 384 L296 430'] },
  ),
  tank: body(
    { shapes: [{ d: 'M200 414 C180 440 168 480 166 524 L132 524 C136 470 160 430 200 414 Z', color: 'skin' }, { d: 'M316 414 C336 440 348 480 350 524 L384 524 C380 470 356 430 316 414 Z', color: 'skin' }], lines: ['M200 414 C180 440 168 480 166 524', 'M316 414 C336 440 348 480 350 524'] },
    { lines: ['M214 424 C236 470 280 470 304 424'] },
  ),
  dress: body(
    { shapes: [{ d: 'M202 414 C226 478 290 478 314 414 Z', color: 'skin' }], lines: ['M202 414 C226 478 290 478 314 414'] },
    { calm: true, lines: ['M214 426 L226 400', 'M302 426 L290 400'] },
  ),
  armor: body(
    { shapes: [{ d: 'M200 414 C226 446 290 446 316 414 L324 436 C290 470 226 470 192 436 Z', color: 'clothesDark' }], lines: ['M200 414 C226 446 290 446 316 414 L324 436 C290 470 226 470 192 436 L200 414', 'M258 464 L258 524', 'M120 470 C150 440 180 430 200 432', 'M396 470 C366 440 336 430 316 432'] },
    { dots: [[170, 470], [346, 470], [230, 490], [286, 490], [150, 504], [366, 504]].map(([x, y]) => ({ x, y, r: 4.5, color: '#f4f1ea' })) },
  ),
  overalls: body(
    crew,
    { shapes: [{ d: 'M212 452 L304 452 L314 524 L202 524 Z', color: '#4f6fb3' }], lines: ['M212 452 L304 452 L314 524', 'M202 524 L212 452', 'M212 452 L192 416', 'M304 452 L324 416'] },
    { dots: [{ x: 222, y: 462, r: 4.5, color: '#e0b23a' }, { x: 294, y: 462, r: 4.5, color: '#e0b23a' }], calm: true, thin: true, lines: ['M236 480 L280 480 L280 504 L236 504 L236 480'] },
  ),
  puffer: body(
    { shapes: [{ d: 'M198 398 C230 420 288 420 318 398 L324 432 C290 456 226 456 192 432 Z', color: 'clothes' }], lines: ['M198 398 C230 420 288 420 318 398 L324 432 C290 456 226 456 192 432 L198 398', 'M258 440 L258 524'] },
    { lines: ['M96 478 C200 492 316 492 420 478', 'M70 506 C200 520 316 520 446 506'], calm: true },
  ),
  polo: body(
    crew,
    { shapes: [{ d: 'M214 424 L232 456 L258 438 Z', color: 'clothesDark' }, { d: 'M302 424 L284 456 L258 438 Z', color: 'clothesDark' }], lines: ['M214 424 L232 456 L258 438 L284 456 L302 424', 'M258 438 L258 480'] },
    { dots: [{ x: 266, y: 456, r: 3 }, { x: 266, y: 472, r: 3 }] },
  ),
  vest: body(
    { shapes: [{ d: 'M222 424 L294 424 L286 524 L230 524 Z', color: 'paper', exact: true }], lines: ['M222 424 L246 524', 'M294 424 L270 524'] },
    { calm: true, lines: ['M214 424 C240 458 280 458 304 424'], dots: [{ x: 252, y: 480, r: 3.5 }, { x: 255, y: 500, r: 3.5 }] },
  ),
  apron: body(
    crew,
    { shapes: [{ d: 'M212 456 L304 456 L318 524 L198 524 Z', color: '#f4f1ea' }], lines: ['M212 456 L304 456 L318 524', 'M198 524 L212 456', 'M212 456 L222 420', 'M304 456 L294 420'] },
    { calm: true, thin: true, lines: ['M238 484 L278 484 L278 506 L238 506 L238 484'] },
  ),
  varsity: body(
    { shapes: [{ d: 'M54 524 C70 480 100 452 140 440 L166 524 Z', color: '#f4f1ea' }, { d: 'M462 524 C446 480 416 452 376 440 L350 524 Z', color: '#f4f1ea' }], lines: ['M140 440 L166 524', 'M376 440 L350 524'] },
    { shapes: [{ d: 'M206 414 C232 452 286 452 312 414 L316 428 C290 470 228 470 202 428 Z', color: '#f4f1ea' }], lines: ['M206 414 C232 452 286 452 312 414', 'M202 428 C228 470 290 470 316 428', 'M258 450 L258 524'] },
    { dots: [{ x: 266, y: 476, r: 4, color: '#f4f1ea' }, { x: 266, y: 500, r: 4, color: '#f4f1ea' }] },
  ),
  coat: body(
    { shapes: [{ d: 'M196 412 L222 380 L240 440 Z', color: 'clothesDark' }, { d: 'M322 412 L296 380 L278 440 Z', color: 'clothesDark' }], lines: ['M196 412 L222 380 L240 440', 'M322 412 L296 380 L278 440'] },
    { lines: ['M240 440 L246 524', 'M278 440 L272 524'] },
    { dots: [{ x: 230, y: 480, r: 4 }, { x: 288, y: 480, r: 4 }] },
  ),
  uniform: body(
    crew,
    { lines: ['M322 462 L370 458 L372 494 L324 498 L322 462', 'M322 474 L370 470'] },
    { calm: true, lines: ['M150 470 L176 470 L176 486'] },
  ),
  cardigan: body(
    { shapes: [{ d: 'M210 420 L257 471 L306 420 L314 428 L264 484 L264 526 L252 526 L252 483 L202 428 Z', color: 'clothesDark' }],
      calm: true, lines: ['M206 424 L258 480 L258 520', 'M310 424 L258 480', 'M124 492 L184 492 L186 521', 'M392 492 L332 492 L330 521'],
      dots: [487, 501, 515].map((y) => ({ x: 258, y, r: 3.6, color: 'paper' })) },
  ),
  raincoat: body(
    { shapes: [{ d: 'M194 420 L204 393 L229 405 L258 426 L288 405 L312 393 L323 421 L278 449 L278 524 L242 524 L242 449 Z', color: 'clothes' }],
      lines: ['M194 420 L204 393 L258 426 L312 393 L323 421', 'M242 443 L242 524', 'M278 443 L278 524'] },
    { calm: true, lines: twin(['M127 492 L181 476 L186 485 L133 502']), dots: [454, 477, 501].map((y) => ({ x: 260, y, r: 4, color: 'clothesDeep' })) },
  ),
  windbreaker: body(
    { shapes: [{ d: 'M216 409 C240 427 276 427 300 409 L306 429 C280 454 236 454 210 429 Z', color: 'clothesDark' }],
      lines: ['M216 409 C240 427 276 427 300 409', 'M258 433 L258 524'] },
    { calm: true, thin: true, lineColor: 'paper', lines: twin(['M117 475 L188 452 L250 478', 'M126 484 L188 463 L250 489']) },
  ),
  spaceSuit: body(
    { shapes: [{ d: 'M194 422 C224 392 292 392 322 422 L310 446 C280 457 236 457 206 446 Z', color: 'clothesDark' },
      { d: 'M222 461 L294 461 L300 508 L216 508 Z', color: '#d7e4ea', exact: true }],
      lines: ['M194 422 C224 392 292 392 322 422', 'M206 446 C236 457 280 457 310 446', 'M222 461 L294 461 L300 508 L216 508 L222 461',
        ...twin(['M118 478 L153 465 L163 489 L130 503'])],
      dots: [{ x: 238, y: 482, r: 5, color: '#ee713a' }, { x: 258, y: 482, r: 5, color: '#4b9866' }, { x: 278, y: 482, r: 5, color: '#3e7ca4' }] },
  ),
  scrubs: body(
    { calm: true, thin: true, lines: ['M211 423 L258 462 L305 423', 'M218 420 L258 453 L297 421', 'M320 466 L363 466 L362 499 L322 499 L320 466', 'M321 474 L362 474'] },
  ),
  sailorShirt: body(
    { shapes: [{ d: 'M195 417 L216 409 L258 446 L300 409 L321 417 L302 463 L258 478 L214 463 Z', color: 'clothesDark' }],
      lines: ['M195 417 L216 409 L258 446 L300 409 L321 417 L302 463 L258 478 L214 463 L195 417'] },
    { calm: true, thin: true, lineColor: 'paper', lines: ['M201 423 L220 458 L258 470 L296 458 L315 423', 'M211 426 L225 453 L258 462 L291 453 L305 426'] },
  ),
  gown: body(
    { shapes: [{ d: 'M197 418 L220 413 L258 447 L296 413 L319 418 L302 510 L277 516 L281 460 L258 479 L235 460 L239 516 L214 510 Z', color: '#d5a73d' }],
      lines: ['M197 418 L214 510 L239 516 L235 460 L258 479 L281 460 L277 516 L302 510 L319 418', ...twin(['M131 476 L148 516', 'M151 464 L170 514'])] },
  ),
};

// Clothing patterns, drawn over the torso.
const stripeRows = [[466, 100], [490, 74], [514, 58]];
const stripe = ([y, x]) => `M${x} ${y} C200 ${y + 10} 316 ${y + 10} ${516 - x} ${y}`;
// Points inside the torso: below the neck, between the shoulders.
const torsoDots = (step, offset) => {
  const dots = [];
  for (let y = 462; y < 524; y += step) {
    const half = (y - 412) * 2.6 + 70;
    for (let x = 258 - half + ((y / step) % 2) * offset; x < 258 + half; x += step * 1.6) {
      if (!(Math.abs(x - 258) < 56 && y < 470)) dots.push([x, y]);
    }
  }
  return dots;
};
const chest = (part) => [{ layer: 'bodyOver', ...part }];
const fabricRows = [
  [476, [110, 146, 182, 218, 254, 290, 326, 362, 398]],
  [504, [92, 128, 164, 200, 236, 272, 308, 344, 380, 416]],
];
const fabricTiles = (draw) => fabricRows.flatMap(([y, centers], row) => centers.flatMap((x, i) => draw(x, y, i, row)));
const print = {
  none: [],
  code: chest({ calm: true, lineColor: '#f4f1ea', lines: ['M238 476 L222 490 L238 504', 'M278 476 L294 490 L278 504', 'M266 470 L250 510'] }),
  heart: chest({ shapes: [{ d: 'M258 512 C226 492 232 470 248 474 C254 476 258 484 258 484 C258 484 262 476 268 474 C284 470 290 492 258 512 Z', color: '#e8455a' }], calm: true, lines: ['M258 512 C226 492 232 470 248 474 C254 476 258 484 258 484 C258 484 262 476 268 474 C284 470 290 492 258 512'] }),
  star: chest({ shapes: [{ d: 'M258 466 L265 484 L284 484 L269 495 L275 514 L258 503 L241 514 L247 495 L232 484 L251 484 Z', color: '#f2cf4a' }], calm: true, lines: ['M258 466 L265 484 L284 484 L269 495 L275 514 L258 503 L241 514 L247 495 L232 484 L251 484 L258 466'] }),
  skull: chest({ shapes: [{ d: 'M236 488 C236 460 280 460 280 488 C280 500 272 502 270 512 L246 512 C244 502 236 500 236 488 Z', color: '#f4f1ea' }], calm: true, lines: ['M236 488 C236 460 280 460 280 488 C280 500 272 502 270 512 L246 512 C244 502 236 500 236 488'], dots: [{ x: 249, y: 486, r: 5 }, { x: 267, y: 486, r: 5 }] }),
  // Invented brand: the name comes from the scene (brandName key), never a real logo.
  brand: chest({
    shapes: [{ d: 'M214 476 L302 476 C308 476 308 506 302 506 L214 506 C208 506 208 476 214 476 Z', color: '#f4f1ea' }],
    calm: true,
    thin: true,
    lines: ['M214 476 L302 476 C308 476 308 506 302 506 L214 506 C208 506 208 476 214 476'],
    texts: [{ x: 258, y: 498, text: 'brandName', size: 19, color: '#1b1b1f' }],
  }),
  lightning: chest({ shapes: [{ d: 'M266 464 L240 496 L258 496 L248 520 L278 484 L260 484 Z', color: '#f2cf4a' }], calm: true, lines: ['M266 464 L240 496 L258 496 L248 520 L278 484 L260 484 L266 464'] }),
};

const pattern = {
  none: [],
  stripes: [{ layer: 'bodyOver', calm: true, lineColor: 'clothesDeep', lines: stripeRows.map(stripe) }],
  pinstripes: chest({
    calm: true, thin: true, lineColor: 'clothesDark',
    lines: twin([90, 111, 132, 153, 174, 195, 216].map((x, i) => `M${x + 6} ${504 - i * 9} L${x} 524`)),
  }),
  dots: [{ layer: 'bodyOver', dots: torsoDots(22, 18).map(([x, y]) => ({ x, y, r: 5.5, color: 'paper', opacity: 0.95 })) }],
  flowers: [{
    layer: 'bodyOver',
    dots: [[120, 480], [180, 500], [330, 494], [390, 478], [250, 506], [430, 506], [90, 506]].flatMap(([x, y]) => [
      ...[0, 1, 2, 3, 4].map((i) => ({ x: x + Math.cos(i * 1.26) * 8, y: y + Math.sin(i * 1.26) * 8, r: 5.5, color: '#f4f1ea' })),
      { x, y, r: 4, color: '#f2cf4a' },
    ]),
  }],
  plaid: [{ layer: 'bodyOver', calm: true, thin: true, lineColor: 'clothesDeep', lines: [
    ...stripeRows.map(stripe),
    ...[120, 170, 346, 396].map((x) => `M${x} ${466 - Math.abs(x - 258) * 0.2} L${x + (x < 258 ? -14 : 14)} 524`),
  ] }],
  argyle: chest({
    shapes: fabricTiles((x, y, i, row) => [{ d: `M${x} ${y - 13} L${x + 15} ${y} L${x} ${y + 13} L${x - 15} ${y} Z`,
      color: (i + row) % 2 ? 'clothesDark' : 'paper', exact: true }]),
    thin: true, lineColor: 'clothesDeep',
    lines: fabricTiles((x, y) => [`M${x - 16} ${y - 13} L${x + 16} ${y + 13}`, `M${x + 16} ${y - 13} L${x - 16} ${y + 13}`]),
  }),
  checkers: chest({
    shapes: fabricTiles((x, y) => [y === 476 ? x - 16 : x + 2].map((left) => ({
      d: `M${left} ${y - 14} L${left + 18} ${y - 14} L${left + 18} ${y + 14} L${left} ${y + 14} Z`,
      color: 'clothesDeep', exact: true,
    }))),
  }),
  fishnet: chest({
    calm: true, thin: true, lineColor: 'clothesDeep',
    lines: fabricTiles((x, y) => [`M${x - 18} ${y} L${x} ${y - 14} L${x + 18} ${y} L${x} ${y + 14} L${x - 18} ${y}`]),
  }),
  camo: chest({
    blotches: fabricTiles((x, y, i) => i % 3 ? [{ d: `M${x - 17} ${y - 9} C${x - 2} ${y - 16} ${x + 17} ${y - 16} ${x + 11} ${y - 4} C${x + 7} ${y + 5} ${x + 17} ${y + 8} ${x + 6} ${y + 11} C${x - 3} ${y + 14} ${x - 13} ${y + 9} ${x - 17} ${y - 9} Z`,
      color: i % 2 ? 'clothesDeep' : 'clothesDark' }] : []),
  }),
};

// ---------- head ----------
// Face shapes: only the outline changes, eyes and mouth stay in place.
const faceOutlines = {
  oval: 'M168 180 C164 262 164 334 190 386 C210 428 304 432 328 388 C352 342 352 262 346 180',
  round: 'M166 180 C158 272 164 356 200 398 C228 430 290 430 318 398 C354 356 358 272 350 180',
  square: 'M168 180 C166 284 166 360 182 398 C194 424 322 424 334 398 C350 360 350 284 346 180',
  long: 'M170 180 C168 284 172 380 200 420 C222 452 296 452 318 420 C344 380 348 284 346 180',
  pointy: 'M168 180 C166 272 178 360 216 410 C236 438 280 438 300 410 C338 360 350 272 346 180',
  heart: 'M164 180 C158 252 176 330 214 394 C236 428 280 428 302 394 C340 330 358 252 352 180',
  wide: 'M158 180 C148 272 154 352 196 394 C226 426 290 426 320 394 C362 352 368 272 358 180',
};
const polyline = (points) => `M${points.map(([x, y]) => `${x.toFixed(0)} ${y.toFixed(0)}`).join(' L')}`;

// Shadow on the right side of the face, derived from the outline.
function shadeFor(outline) {
  const side = flatten(outline).filter(([x, y]) => x > 292 && y > 250);
  return `${polyline(side)} L${[...side].reverse().map(([x, y]) => `${(x - 24).toFixed(0)} ${(y - 8).toFixed(0)}`).join(' L')} Z`;
}

const makeHead = (outline) => [{
  layer: 'head',
  shapes: [{ d: `${outline} Z`, color: 'skin' }],
  blotches: [
    { d: shadeFor(outline), color: 'skinShadow' },
    { d: 'M180 330 C190 316 214 318 220 332 C210 346 188 346 180 330 Z', color: 'blush' },
    { d: 'M302 332 C308 316 332 316 338 328 C330 346 310 348 302 332 Z', color: 'blush' },
  ],
  scratches: ['M188 342 L198 324', 'M202 344 L212 326', 'M310 344 L320 326', 'M324 342 L334 324'],
  lines: [outline],
}];
const headShapes = Object.fromEntries(Object.entries(faceOutlines).map(([name, outline]) => [name, makeHead(outline)]));

const ears = Object.fromEntries(Object.entries({
  normal: 'M170 246 C142 228 132 288 174 298',
  big: 'M170 232 C120 204 106 304 174 308',
  small: 'M170 256 C154 248 150 286 172 292',
  elf: 'M170 250 C140 236 116 204 100 180 C116 232 134 290 174 298',
}).map(([name, d]) => [name, [
  // Each ear has its own layer so the head turn can widen one and hide the other.
  { layer: 'earLeft', shapes: [{ d: `${d} Z`, color: 'skin' }], lines: [d] },
  { layer: 'earRight', shapes: [{ d: `${mirror(d)} Z`, color: 'skin' }], lines: [mirror(d)] },
]]));
ears.none = [];

const nose = Object.fromEntries(Object.entries({
  hook: ['M264 282 C256 298 252 312 270 312'],
  button: ['M256 300 C246 314 262 322 272 312'],
  long: ['M262 266 C254 298 246 322 270 324'],
  big: ['M252 290 C232 318 256 334 268 320 C284 334 296 306 272 296'],
  pointy: ['M264 274 L246 318 L272 316'],
}).map(([name, lines]) => [name, [{ layer: 'nose', calm: true, lines }]]));

// Skull cap for heads without hair on top (bald, mohawk).
const scalp = {
  layer: 'front',
  shapes: [{ d: 'M168 204 C162 112 352 112 346 204 Z', color: 'skin' }],
  blotches: [{ d: 'M300 130 C330 144 344 170 346 196 L326 196 C324 170 316 150 300 130 Z', color: 'skinShadow' }],
  lines: ['M168 204 C162 112 352 112 346 204'],
};

// ---------- hair ----------
const hairShort = {
  shapes: [{ d: 'M156 226 C132 118 214 78 276 88 C344 80 386 140 356 226 C350 204 338 182 322 170 C282 188 216 184 188 164 C174 178 162 200 156 226 Z', color: 'hair' }],
  blotches: [{ d: 'M196 134 C216 110 250 104 276 110 C252 120 222 130 206 150 Z', color: 'hairLight' }],
  scratches: ['M300 106 L330 150', 'M316 104 L344 146'],
  lines: [
    'M156 226 C132 118 214 78 276 88 C344 80 386 140 356 226',
    'M356 226 C350 204 338 182 322 170 C282 188 216 184 188 164 C174 178 162 200 156 226',
  ],
};
const front = (part) => ({ layer: 'front', ...part });
const back = (part) => ({ layer: 'back', ...part });

const hair = {
  none: [],
  short: [front(hairShort)],
  spiky: [front({
    shapes: [{ d: 'M156 226 L146 150 L182 166 L184 92 L226 138 L248 66 L280 128 L316 76 L324 142 L366 116 L350 178 L360 226 C350 204 338 182 322 170 C282 188 216 184 188 164 C174 178 162 200 156 226 Z', color: 'hair' }],
    blotches: [{ d: 'M206 140 L230 150 L248 96 L240 120 Z', color: 'hairLight' }],
    lines: [
      'M156 226 L146 150 L182 166 L184 92 L226 138 L248 66 L280 128 L316 76 L324 142 L366 116 L350 178 L360 226',
      'M360 226 C350 204 338 182 322 170 C282 188 216 184 188 164 C174 178 162 200 156 226',
    ],
  })],
  long: [
    back({ shapes: [{ d: 'M158 200 C128 300 136 420 146 480 L370 480 C380 420 388 300 356 200 Z', color: 'hair' }], lines: ['M158 200 C128 300 136 420 146 480', 'M356 200 C388 300 380 420 370 480'] }),
    front({
      shapes: [{ d: 'M156 236 C132 118 214 78 276 88 C344 80 386 140 358 236 C350 200 330 174 300 166 C268 176 236 176 214 164 C184 180 164 206 156 236 Z', color: 'hair' }],
      blotches: [{ d: 'M196 134 C216 110 250 104 276 110 C252 120 222 130 206 150 Z', color: 'hairLight' }],
      lines: ['M156 236 C132 118 214 78 276 88 C344 80 386 140 358 236', 'M358 236 C350 200 330 174 300 166 C268 176 236 176 214 164 C184 180 164 206 156 236'],
    }),
  ],
  curly: [front({
    shapes: [{ d: 'M156 232 C122 222 126 168 154 160 C138 118 180 94 206 108 C214 74 262 68 278 94 C302 68 352 88 346 122 C382 128 386 178 360 196 C382 216 370 242 358 234 C350 206 336 184 320 174 C282 190 216 186 188 168 C176 184 164 206 156 232 Z', color: 'hair' }],
    blotches: [{ d: 'M206 120 C220 104 244 104 252 116 C236 118 222 126 214 136 Z', color: 'hairLight' }],
    lines: [
      'M156 232 C122 222 126 168 154 160 C138 118 180 94 206 108 C214 74 262 68 278 94 C302 68 352 88 346 122 C382 128 386 178 360 196 C382 216 370 242 358 234',
      'M358 234 C350 206 336 184 320 174 C282 190 216 186 188 168 C176 184 164 206 156 232',
    ],
    scratches: ['M190 140 C200 130 214 138 206 150', 'M250 116 C262 106 276 116 266 128', 'M306 128 C318 120 330 132 318 142', 'M172 196 C180 186 192 194 184 206'],
  })],
  bald: [scalp],
  ponytail: [
    back({ shapes: [{ d: 'M336 150 C396 150 414 232 398 320 C388 366 356 366 362 322 C374 262 362 204 330 190 Z', color: 'hair' }], lines: ['M336 150 C396 150 414 232 398 320 C388 366 356 366 362 322 C374 262 362 204 330 190'] }),
    front(hairShort),
    front({ shapes: [{ d: 'M336 140 L352 136 L360 160 L344 166 Z', color: 'hatDark' }], calm: true, lines: ['M336 140 L352 136 L360 160 L344 166 L336 140'] }),
  ],
  bun: [
    front({ shapes: [{ d: 'M222 94 C220 46 296 46 294 94 C294 116 222 116 222 94 Z', color: 'hair' }], lines: ['M222 94 C220 46 296 46 294 94 C294 116 222 116 222 94'], scratches: ['M238 72 C252 62 270 64 278 76'] }),
    front({
      shapes: [{ d: 'M158 226 C140 130 210 94 258 96 C306 94 376 130 358 226 C346 196 322 168 258 164 C194 168 170 196 158 226 Z', color: 'hair' }],
      lines: ['M158 226 C140 130 210 94 258 96 C306 94 376 130 358 226', 'M358 226 C346 196 322 168 258 164 C194 168 170 196 158 226'],
      scratches: ['M210 120 L236 160', 'M300 116 L282 160'],
    }),
  ],
  mohawk: [
    scalp,
    front({
      shapes: [{ d: 'M236 184 L224 126 L242 134 L240 72 L260 110 L270 56 L282 112 L300 92 L290 140 L284 184 Z', color: 'hair' }],
      lines: ['M236 184 L224 126 L242 134 L240 72 L260 110 L270 56 L282 112 L300 92 L290 140 L284 184'],
    }),
  ],
  messy: [front({
    shapes: [{ d: 'M154 228 C120 160 160 150 170 140 C150 100 200 100 210 96 C210 60 260 74 268 82 C300 54 330 90 330 96 C370 90 380 140 360 150 C384 180 370 210 358 228 C350 204 338 182 322 170 C300 190 270 176 250 184 C230 176 206 186 188 166 C174 180 162 202 154 228 Z', color: 'hair' }],
    blotches: [{ d: 'M200 128 C220 108 250 104 270 110 C248 122 224 130 210 148 Z', color: 'hairLight' }],
    lines: [
      'M154 228 C120 160 160 150 170 140 C150 100 200 100 210 96 C210 60 260 74 268 82 C300 54 330 90 330 96 C370 90 380 140 360 150 C384 180 370 210 358 228',
      'M358 228 C350 204 338 182 322 170 C300 190 270 176 250 184 C230 176 206 186 188 166 C174 180 162 202 154 228',
    ],
    scratches: ['M226 120 L210 168', 'M290 116 L306 162', 'M258 104 L262 150'],
  })],
  braids: [
    back({
      shapes: twinShapes([{ d: 'M164 230 C148 300 148 380 156 454 L188 454 C182 380 182 300 188 236 Z', color: 'hair' }]),
      lines: twin(['M164 230 C148 300 148 380 156 454 L188 454 C182 380 182 300 188 236']),
      scratches: twin(['M158 300 L186 290', 'M156 340 L184 330', 'M156 380 L184 370', 'M158 420 L186 410']),
    }),
    front({
      shapes: [{ d: 'M158 236 C134 120 214 82 258 88 C302 82 382 120 358 236 C350 200 320 168 262 164 L258 100 L254 164 C196 168 166 200 158 236 Z', color: 'hair' }],
      lines: ['M158 236 C134 120 214 82 258 88 C302 82 382 120 358 236', 'M358 236 C350 200 320 168 262 164', 'M254 164 C196 168 166 200 158 236', 'M258 100 L258 164'],
    }),
  ],
  afro: [front({
    shapes: [{ d: 'M150 250 C96 220 100 120 160 96 C190 50 270 40 316 70 C380 80 420 160 384 220 C392 250 370 262 362 240 C352 206 336 184 320 174 C282 190 216 186 188 168 C176 184 166 214 158 246 C156 254 152 254 150 250 Z', color: 'hair' }],
    blotches: [{ d: 'M190 90 C220 70 260 66 290 76 C260 84 226 96 206 116 Z', color: 'hairLight' }],
    lines: ['M150 250 C96 220 100 120 160 96 C190 50 270 40 316 70 C380 80 420 160 384 220 C392 250 370 262 362 240', 'M362 240 C352 206 336 184 320 174 C282 190 216 186 188 168 C176 184 166 214 158 246'],
    scratches: ['M150 160 C160 150 172 160 164 172', 'M214 100 C226 90 240 100 230 112', 'M300 96 C312 88 326 98 316 110', 'M362 150 C374 144 384 156 372 166', 'M250 130 C262 122 274 132 264 142'],
  })],
  bob: [front({
    shapes: [{ d: 'M150 330 C130 200 160 92 258 88 C356 92 386 200 366 330 C350 334 340 330 338 320 C344 260 340 210 322 176 C282 196 230 196 192 176 C176 210 172 260 178 320 C176 330 166 334 150 330 Z', color: 'hair' }],
    blotches: [{ d: 'M196 120 C220 102 256 98 284 104 C256 114 226 124 210 144 Z', color: 'hairLight' }],
    lines: ['M150 330 C130 200 160 92 258 88 C356 92 386 200 366 330', 'M366 330 C350 334 340 330 338 320 C344 260 340 210 322 176 C282 196 230 196 192 176 C176 210 172 260 178 320 C176 330 166 334 150 330'],
  })],
  bangs: [front({
    shapes: [{ d: 'M156 240 C132 118 214 78 276 88 C344 80 386 140 358 240 C352 230 346 226 340 226 L176 226 C170 226 162 230 156 240 Z', color: 'hair' }],
    blotches: [{ d: 'M196 134 C216 110 250 104 276 110 C252 120 222 130 206 150 Z', color: 'hairLight' }],
    lines: ['M156 240 C132 118 214 78 276 88 C344 80 386 140 358 240', 'M358 240 C352 230 346 226 340 226 L176 226 C170 226 162 230 156 240'],
    scratches: ['M200 190 L198 224', 'M240 190 L240 226', 'M280 190 L282 226', 'M318 190 L320 224'],
  })],
  quiff: [front({
    shapes: [{ d: 'M158 226 C140 150 160 110 200 100 C200 60 280 40 340 70 C320 76 312 84 314 92 C360 104 380 150 356 226 C350 204 338 182 322 170 C282 188 216 184 188 164 C174 178 164 200 158 226 Z', color: 'hair' }],
    blotches: [{ d: 'M214 90 C240 70 280 62 316 72 C284 80 250 90 228 110 Z', color: 'hairLight' }],
    lines: ['M158 226 C140 150 160 110 200 100 C200 60 280 40 340 70 C320 76 312 84 314 92 C360 104 380 150 356 226', 'M356 226 C350 204 338 182 322 170 C282 188 216 184 188 164 C174 178 164 200 158 226'],
    scratches: ['M220 96 C246 76 286 70 318 78', 'M226 120 C252 104 290 100 320 108'],
  })],
  buzz: [front({
    shapes: [{ d: 'M166 214 C160 116 354 116 348 214 C340 190 320 176 258 172 C196 176 176 190 166 214 Z', color: 'hair' }],
    lines: ['M166 214 C160 116 354 116 348 214'],
    dots: scatter(13, 40, (x, y) => y > 130 && y < 176 && ((x - 258) / 92) ** 2 + ((y - 214) / 92) ** 2 < 1, 1.6, 'hairLight', 0.9),
  })],
  pigtails: [
    back({
      shapes: twinShapes([{ d: 'M164 206 C120 214 102 280 112 332 C120 364 142 352 140 330 C136 290 148 250 172 236 Z', color: 'hair' }]),
      lines: twin(['M164 206 C120 214 102 280 112 332 C120 364 142 352 140 330 C136 290 148 250 172 236']),
    }),
    front({
      shapes: [{ d: 'M158 236 C134 120 214 82 258 88 C302 82 382 120 358 236 C350 200 320 168 262 164 L258 100 L254 164 C196 168 166 200 158 236 Z', color: 'hair' }],
      lines: ['M158 236 C134 120 214 82 258 88 C302 82 382 120 358 236', 'M358 236 C350 200 320 168 262 164', 'M254 164 C196 168 166 200 158 236', 'M258 100 L258 164'],
    }),
    front({ dots: [{ x: 166, y: 220, r: 7, color: '#c84b3c' }, { x: 350, y: 220, r: 7, color: '#c84b3c' }] }),
  ],
  sidepart: [front({
    ...hairShort,
    scratches: ['M224 100 C210 120 204 146 206 170', 'M246 96 C234 120 230 146 232 176', 'M330 120 L350 160'],
    lines: [...hairShort.lines, 'M300 92 C296 120 296 150 302 174'],
  })],
  undercut: [
    scalp,
    front({
      shapes: [{ d: 'M168 196 C158 118 222 78 292 82 C352 86 384 130 368 172 C342 150 302 150 272 160 C240 170 200 178 168 196 Z', color: 'hair' }],
      blotches: [{ d: 'M206 108 C236 90 276 86 306 92 C276 100 244 110 222 128 Z', color: 'hairLight' }],
      lines: ['M168 196 C158 118 222 78 292 82 C352 86 384 130 368 172', 'M368 172 C342 150 302 150 272 160 C240 170 200 178 168 196'],
      dots: scatter(17, 36, (x, y) => y > 176 && y < 214 && (x < 196 || x > 330) && x > 166 && x < 350, 1.6, 'hair', 0.8),
    }),
  ],
  emo: [front({
    shapes: [{ d: 'M156 236 C132 118 214 78 276 88 C344 80 386 140 358 236 C352 272 332 298 300 292 C312 262 302 226 272 210 C240 198 198 196 176 210 C168 220 160 228 156 236 Z', color: 'hair' }],
    blotches: [{ d: 'M196 134 C216 110 250 104 276 110 C252 120 222 130 206 150 Z', color: 'hairLight' }],
    lines: ['M156 236 C132 118 214 78 276 88 C344 80 386 140 358 236 C352 272 332 298 300 292', 'M300 292 C312 262 302 226 272 210 C240 198 198 196 176 210 C168 220 160 228 156 236'],
    scratches: ['M262 214 C290 230 300 256 296 282', 'M236 206 C264 220 280 246 284 270'],
  })],
  dreads: [
    back({
      shapes: twinShapes([
        { d: 'M156 214 C138 300 142 380 146 446 L170 446 C168 380 166 300 176 228 Z', color: 'hair' },
        { d: 'M172 236 C164 310 166 390 172 456 L194 456 C190 390 188 310 192 244 Z', color: 'hair' },
      ]),
      lines: twin(['M156 214 C138 300 142 380 146 446 L170 446 C168 380 166 300 176 228', 'M172 236 C164 310 166 390 172 456 L194 456 C190 390 188 310 192 244']),
      scratches: twin(['M146 300 L170 296', 'M146 360 L168 356', 'M168 330 L190 326', 'M170 400 L192 396']),
    }),
    front(hairShort),
  ],
  wavyLong: [
    back({ shapes: [{ d: 'M158 200 C120 260 150 300 132 360 C116 420 150 450 146 480 L370 480 C366 450 400 420 384 360 C366 300 396 260 358 200 Z', color: 'hair' }],
      lines: ['M158 200 C120 260 150 300 132 360 C116 420 150 450 146 480', 'M358 200 C396 260 366 300 384 360 C400 420 366 450 370 480'],
      scratches: ['M140 300 C150 320 140 340 148 360', 'M376 300 C366 320 376 340 368 360'] }),
    front({
      shapes: [{ d: 'M156 236 C132 118 214 78 276 88 C344 80 386 140 358 236 C350 200 330 174 300 166 C268 176 236 176 214 164 C184 180 164 206 156 236 Z', color: 'hair' }],
      blotches: [{ d: 'M196 134 C216 110 250 104 276 110 C252 120 222 130 206 150 Z', color: 'hairLight' }],
      lines: ['M156 236 C132 118 214 78 276 88 C344 80 386 140 358 236', 'M358 236 C350 200 330 174 300 166 C268 176 236 176 214 164 C184 180 164 206 156 236'],
    }),
  ],
  spaceBuns: [
    front({ shapes: twinShapes([{ d: 'M166 118 C150 80 196 54 220 80 C236 98 220 130 196 132 C182 134 170 128 166 118 Z', color: 'hair' }]), lines: twin(['M166 118 C150 80 196 54 220 80 C236 98 220 130 196 132 C182 134 170 128 166 118']), scratches: twin(['M176 96 C188 86 204 90 208 102']) }),
    front({
      shapes: [{ d: 'M158 236 C134 120 214 82 258 88 C302 82 382 120 358 236 C350 200 320 168 262 164 L258 100 L254 164 C196 168 166 200 158 236 Z', color: 'hair' }],
      lines: ['M158 236 C134 120 214 82 258 88 C302 82 382 120 358 236', 'M358 236 C350 200 320 168 262 164', 'M254 164 C196 168 166 200 158 236', 'M258 100 L258 164'],
    }),
  ],
  pixie: [front({
    shapes: [{ d: 'M160 236 C140 140 200 92 262 92 C330 92 376 140 354 220 C340 200 320 188 300 190 C290 176 240 160 200 178 C186 196 170 214 160 236 Z', color: 'hair' }],
    blotches: [{ d: 'M206 120 C230 104 266 102 292 108 C264 116 236 126 220 144 Z', color: 'hairLight' }],
    lines: ['M160 236 C140 140 200 92 262 92 C330 92 376 140 354 220', 'M354 220 C340 200 320 188 300 190 C290 176 240 160 200 178 C186 196 170 214 160 236'],
    scratches: ['M300 120 L280 176', 'M250 110 L230 168'],
  })],
  sidePonytail: [
    back({ shapes: [{ d: 'M350 196 C410 210 420 290 400 360 C390 400 360 396 366 360 C378 300 368 240 340 220 Z', color: 'hair' }], lines: ['M350 196 C410 210 420 290 400 360 C390 400 360 396 366 360 C378 300 368 240 340 220'] }),
    front(hairShort),
    front({ dots: [{ x: 352, y: 206, r: 8, color: '#e8455a' }] }),
  ],
  // The mullet falls on the neck: above the torso but below the head.
  mullet: [
    ({ layer: 'bodyOver', shapes: [{ d: 'M168 226 C156 300 162 362 172 404 L344 404 C354 362 360 300 348 226 Z', color: 'hair' }], lines: ['M168 226 C156 300 162 362 172 404', 'M348 226 C360 300 354 362 344 404'], scratches: ['M176 330 L184 380', 'M340 330 L332 380'] }),
    front(hairShort),
  ],
  middlePart: [front({
    shapes: [{ d: 'M156 240 C134 120 214 82 258 88 C302 82 382 120 360 240 C350 214 330 196 306 196 C290 196 270 180 258 150 C246 180 226 196 210 196 C186 196 166 214 156 240 Z', color: 'hair' }],
    blotches: [{ d: 'M200 120 C222 104 244 100 252 104 C238 116 224 132 214 150 Z', color: 'hairLight' }],
    lines: ['M156 240 C134 120 214 82 258 88 C302 82 382 120 360 240', 'M360 240 C350 214 330 196 306 196 C290 196 270 180 258 150 C246 180 226 196 210 196 C186 196 166 214 156 240', 'M258 92 L258 150'],
  })],
  // A real shag: layered, wavy sides with curled ends and a choppy fringe (not a mop top).
  shag: [front({
    shapes: [{ d: 'M148 318 C126 312 124 290 140 282 C120 272 122 248 138 240 C118 228 120 204 138 196 C120 180 128 152 150 146 C140 124 156 104 178 106 C180 86 206 78 222 90 C232 72 262 70 274 86 C290 72 318 78 322 96 C344 90 366 108 360 130 C382 134 390 162 374 176 C394 188 392 214 376 222 C396 236 392 262 374 266 C392 280 388 306 368 318 C360 330 344 326 348 312 C356 286 344 262 340 240 C348 214 334 192 318 184 C318 206 306 216 296 204 C290 194 280 196 276 208 C268 220 254 218 250 202 C244 192 232 194 228 208 C220 220 206 216 204 198 C200 186 192 186 188 194 C176 206 172 226 178 244 C174 268 162 290 170 312 C174 326 158 332 148 318 Z', color: 'hair' }],
    blotches: [{ d: 'M204 116 C226 98 262 94 292 104 C264 112 234 124 218 142 Z', color: 'hairLight' }],
    lines: ['M148 318 C126 312 124 290 140 282 C120 272 122 248 138 240 C118 228 120 204 138 196 C120 180 128 152 150 146 C140 124 156 104 178 106 C180 86 206 78 222 90 C232 72 262 70 274 86 C290 72 318 78 322 96 C344 90 366 108 360 130 C382 134 390 162 374 176 C394 188 392 214 376 222 C396 236 392 262 374 266 C392 280 388 306 368 318', 'M368 318 C360 330 344 326 348 312 C356 286 344 262 340 240 C348 214 334 192 318 184 C318 206 306 216 296 204 C290 194 280 196 276 208 C268 220 254 218 250 202 C244 192 232 194 228 208 C220 220 206 216 204 198 C200 186 192 186 188 194 C176 206 172 226 178 244 C174 268 162 290 170 312 C174 326 158 332 148 318'],
    scratches: ['M156 206 C166 220 152 234 160 250', 'M360 206 C350 220 364 234 356 250', 'M232 112 C242 100 258 104 252 118', 'M290 108 C302 100 314 110 306 122', 'M156 270 C166 284 154 298 164 308', 'M360 270 C350 284 362 298 352 308'],
  })],
  highPonytail: [
    back({ shapes: [{ d: 'M300 80 C360 50 404 110 396 200 C392 252 368 270 362 240 C372 190 362 130 300 104 Z', color: 'hair' }], lines: ['M300 80 C360 50 404 110 396 200 C392 252 368 270 362 240 C372 190 362 130 300 104'] }),
    front({
      shapes: [{ d: 'M158 226 C140 130 210 94 258 96 C306 94 376 130 358 226 C346 196 322 168 258 164 C194 168 170 196 158 226 Z', color: 'hair' }],
      lines: ['M158 226 C140 130 210 94 258 96 C306 94 376 130 358 226', 'M358 226 C346 196 322 168 258 164 C194 168 170 196 158 226'],
      scratches: ['M210 120 L236 160', 'M290 112 L282 160'],
      dots: [{ x: 302, y: 92, r: 8, color: '#e8455a' }],
    }),
  ],
  afroPuffs: [
    front({ shapes: twinShapes([{ d: 'M148 132 C126 70 210 48 224 100 C234 142 168 172 148 132 Z', color: 'hair' }]), lines: twin(['M148 132 C126 70 210 48 224 100 C234 142 168 172 148 132']), scratches: twin(['M164 100 C172 90 186 94 184 106', 'M196 80 C204 74 214 80 210 90']) }),
    front({
      shapes: [{ d: 'M158 236 C134 120 214 82 258 88 C302 82 382 120 358 236 C350 200 320 168 262 164 L258 100 L254 164 C196 168 166 200 158 236 Z', color: 'hair' }],
      lines: ['M158 236 C134 120 214 82 258 88 C302 82 382 120 358 236', 'M358 236 C350 200 320 168 262 164', 'M254 164 C196 168 166 200 158 236', 'M258 100 L258 164'],
    }),
  ],
  lob: [
    back({
      shapes: [{ d: 'M143 207 C138 117 194 98 258 98 C322 98 378 117 373 207 L384 414 C354 437 319 446 280 427 L230 427 C196 445 155 437 132 414 Z', color: 'hair' }],
      lines: ['M143 207 L132 414 C155 437 196 445 230 427', 'M373 207 L384 414 C354 437 319 446 280 427'],
    }),
    front({
      shapes: [{ d: 'M150 232 C132 138 182 94 250 99 C329 90 377 126 370 234 C367 316 385 385 364 425 C349 427 336 422 330 414 C350 375 338 296 344 239 C345 187 312 156 255 146 C212 181 174 191 176 252 C172 313 168 376 189 423 C172 436 149 430 142 418 C126 369 145 304 150 232 Z', color: 'hair' }],
      lines: ['M150 232 C132 138 182 94 250 99 C329 90 377 126 370 234', 'M364 425 C349 427 336 422 330 414 C350 375 338 296 344 239 C345 187 312 156 255 146 C212 181 174 191 176 252 C172 313 168 376 189 423'],
      scratches: twin(['M154 281 C150 328 149 370 158 399']),
    }),
  ],
  cornrows: [front({
    shapes: [{ d: 'M150 224 C146 144 196 104 258 103 C320 104 370 144 366 224 C348 201 322 186 294 174 C272 162 244 162 222 174 C194 186 168 201 150 224 Z', color: 'hair' }],
    lines: ['M150 224 C146 144 196 104 258 103 C320 104 370 144 366 224', 'M150 224 C182 185 233 163 258 163 C283 163 334 185 366 224'],
  }), front({
    thin: true, lineColor: 'hairLight',
    lines: [...twin(['M164 206 C156 166 198 127 237 113', 'M187 191 C184 158 211 126 246 113', 'M215 176 C215 148 233 126 251 113']), 'M258 164 C258 143 258 121 258 106'],
  })],
  bantuKnots: [
    front(hairShort),
    ...[[172, 151, 23], [211, 113, 24], [257, 98, 24], [303, 113, 23], [344, 151, 22]].map(([x, y, r]) => front({
      shapes: [{ d: ring(x, y, r), color: 'hair', exact: true }],
      lines: [ring(x, y, r)],
      scratches: [`M${x - 11} ${y + 6} C${x + 7} ${y + 13} ${x + 14} ${y - 11} ${x - 4} ${y - 10}`],
    })),
  ],
  lowPonytail: [
    back({ shapes: [{ d: 'M330 301 C378 296 404 343 398 391 C396 420 377 448 350 452 C369 421 359 376 330 338 Z', color: 'hair' }],
      lines: ['M330 301 C378 296 404 343 398 391 C396 420 377 448 350 452 C369 421 359 376 330 338'], scratches: ['M353 321 C386 352 392 406 368 432'] }),
    front(hairShort),
    front({ shapes: [{ d: 'M344 301 L362 299 L368 323 L350 330 Z', color: 'hatDark', exact: true }], lines: ['M344 301 L362 299 L368 323 L350 330 L344 301'] }),
  ],
  widowsPeak: [front({
    shapes: [{ d: 'M154 232 C137 152 170 102 253 100 C332 92 380 144 362 232 C352 198 326 169 299 165 C282 168 268 183 258 202 C249 181 235 168 219 166 C187 174 167 198 154 232 Z', color: 'hair' }],
    lines: ['M154 232 C137 152 170 102 253 100 C332 92 380 144 362 232', 'M154 232 C167 198 187 174 219 166 C235 168 249 181 258 202 C268 183 282 168 299 165 C326 169 352 198 362 232'],
    scratches: ['M209 124 C234 114 261 121 277 132', 'M306 125 L330 145'],
  })],
  // Locks peeking out under a hat that covers the head.
  under: [front({
    shapes: twinShapes([{ d: 'M164 206 C158 236 164 256 172 262 L180 210 Z', color: 'hair' }]),
    lines: twin(['M164 206 C158 236 164 256 172 262']),
  })],
};

// ---------- hats ----------
const hat = {
  none: [],
  trapper: [{
    layer: 'hat',
    shapes: [
      { d: 'M142 222 C131 148 179 102 258 103 C337 102 385 148 374 222 L348 215 L168 215 Z', color: 'hat' },
      ...twinShapes([{ d: 'M142 197 L186 204 L183 293 C182 328 157 340 142 314 L131 256 Z', color: 'hatDark' },
        { d: 'M149 234 L175 239 L172 294 C171 314 158 321 150 307 Z', color: '#d6b998' }]),
      { d: 'M164 170 C188 130 328 130 352 170 L348 223 C305 207 211 207 168 223 Z', color: '#e1c9a6' },
    ],
    lines: ['M142 197 C140 132 198 103 258 103 C318 103 376 132 374 197', 'M164 170 C188 130 328 130 352 170 L348 223 C305 207 211 207 168 223 L164 170',
      ...twin(['M142 197 L131 256 L142 314 C157 340 182 328 183 293 L186 224', 'M156 320 L163 348'])],
    scratches: ['M178 179 L190 164', 'M200 174 L213 158', 'M325 174 L336 186'],
  }],
  spaceHelmet: [{
    layer: 'hat',
    shapes: [
      { d: 'M119 233 C113 134 167 77 258 77 C349 77 403 134 397 233 L369 233 C369 162 331 114 258 114 C185 114 147 162 147 233 Z', color: 'hat' },
      ...twinShapes([{ d: 'M119 226 L146 222 C139 305 151 354 198 404 L181 431 C120 381 107 309 119 226 Z', color: 'hat' },
        { d: 'M111 236 L136 227 L141 295 L113 298 Z', color: 'hatDark' }]),
      { d: 'M181 405 C226 427 290 427 335 405 L353 430 C311 465 205 465 163 430 Z', color: 'hatDark' },
    ],
    lines: ['M119 233 C113 134 167 77 258 77 C349 77 403 134 397 233', 'M147 233 C147 162 185 114 258 114 C331 114 369 162 369 233',
      ...twin(['M119 298 C120 349 142 397 181 431', 'M147 294 C149 341 171 378 198 404']), 'M163 430 C205 465 311 465 353 430'],
    dots: [{ x: 220, y: 437, r: 5, color: '#84c6e9' }, { x: 296, y: 437, r: 5, color: '#e0b23a' }],
  }, {
    layer: 'hat', calm: true, thin: true, lineColor: '#a6d7e8',
    lines: ['M160 220 C163 177 192 141 228 129', 'M170 218 C172 186 192 159 215 148', 'M349 330 C340 359 322 379 301 390'],
  }],
  bikeHelmet: [{
    layer: 'hat',
    shapes: [{ d: 'M121 201 C112 159 156 114 217 105 C286 89 363 111 389 166 L382 200 L329 209 L295 183 L188 193 L148 223 Z', color: 'hat' },
      { d: 'M150 169 C174 142 196 130 228 127 L214 149 L161 180 Z', color: 'hatDark', exact: true },
      { d: 'M239 127 C271 115 302 117 326 129 L302 147 L229 149 Z', color: 'hatDark', exact: true },
      { d: 'M332 139 L360 150 L376 170 L318 161 Z', color: 'hatDark', exact: true }],
    lines: ['M121 201 C112 159 156 114 217 105 C286 89 363 111 389 166 L382 200 L329 209 L295 183 L188 193 L148 223 L121 201'],
    scratches: twin(['M156 209 L169 272 L197 216', 'M169 272 L195 370 L220 400']),
  }],
  crestedHelmet: [{
    layer: 'hat',
    shapes: [{ d: 'M147 164 C150 80 234 45 301 58 C340 64 368 88 385 114 C336 102 292 101 272 139 L223 169 Z', color: '#a63d38' },
      { d: 'M140 224 C126 148 181 113 258 114 C335 113 390 148 376 224 L335 228 L318 187 L198 187 L181 228 Z', color: 'hat' },
      ...twinShapes([{ d: 'M149 202 L182 207 L180 279 L210 352 L184 360 C152 321 141 271 149 202 Z', color: 'hatDark' }])],
    lines: ['M147 164 C150 80 234 45 301 58 C340 64 368 88 385 114', 'M140 224 C126 148 181 113 258 114 C335 113 390 148 376 224',
      'M181 228 L198 187 L318 187 L335 228', ...twin(['M149 202 C141 271 152 321 184 360 L210 352 L180 279 L182 207'])],
    scratches: ['M175 142 C184 105 215 81 247 76', 'M201 137 C218 101 259 83 291 86', 'M236 131 C252 105 291 96 323 99'],
  }],
  sunHat: [{
    layer: 'hat',
    shapes: [{ d: 'M170 177 C159 116 203 101 257 104 C308 101 354 119 349 172 Z', color: 'hat' },
      { d: 'M77 215 C85 177 153 168 237 166 C322 164 399 169 437 201 C449 231 368 246 309 229 C255 206 196 220 146 237 C110 246 85 235 77 215 Z', color: 'hat' },
      { d: 'M164 158 C206 172 309 171 350 156 L354 176 C305 190 208 191 160 178 Z', color: 'hatDark' }],
    lines: ['M170 177 C159 116 203 101 257 104 C308 101 354 119 349 172', 'M77 215 C85 177 153 168 237 166 C322 164 399 169 437 201 C449 231 368 246 309 229 C255 206 196 220 146 237 C110 246 85 235 77 215'],
    scratches: ['M97 208 C119 193 142 189 160 188', 'M356 185 C382 188 407 196 420 209'],
  }],
  rainHat: [{
    layer: 'hat',
    shapes: [{ d: 'M141 197 C136 136 186 108 258 107 C330 108 380 136 375 197 L330 215 L186 215 Z', color: 'hat' },
      { d: 'M111 265 C118 229 126 206 145 180 C209 201 306 201 371 180 C390 206 398 229 405 265 L367 253 C324 220 192 220 149 253 Z', color: 'hatDark' }],
    lines: ['M141 197 C136 136 186 108 258 107 C330 108 380 136 375 197', 'M111 265 C118 229 126 206 145 180 C209 201 306 201 371 180 C390 206 398 229 405 265 L367 253 C324 220 192 220 149 253 L111 265'],
    scratches: twin(['M175 171 C180 149 202 132 228 129']),
  }],
  flatCap: [{
    layer: 'hat',
    shapes: [{ d: 'M138 202 C137 148 187 115 262 119 C326 121 372 148 376 184 C356 205 313 216 260 216 L166 224 Z', color: 'hat' },
      { d: 'M163 210 C223 194 318 192 381 187 C372 213 327 226 267 227 L175 226 Z', color: 'hatDark' }],
    lines: ['M138 202 C137 148 187 115 262 119 C326 121 372 148 376 184', 'M163 210 C223 194 318 192 381 187 C372 213 327 226 267 227 L175 226'],
    scratches: ['M196 177 C216 150 249 132 270 128', 'M162 179 C169 159 184 150 201 147'],
  }],
  boater: [{
    layer: 'hat',
    shapes: [{ d: 'M170 128 C211 112 305 112 346 128 L346 192 L170 192 Z', color: 'hat' },
      { d: 'M103 191 C112 176 404 176 413 191 C422 211 94 211 103 191 Z', color: 'hat' },
      { d: 'M170 163 C209 171 307 171 346 163 L346 183 C306 191 210 191 170 183 Z', color: 'hatDark' }],
    lines: ['M170 192 L170 128 C211 112 305 112 346 128 L346 192', 'M170 128 C211 142 305 142 346 128', 'M103 191 C112 176 404 176 413 191 C422 211 94 211 103 191'],
    scratches: ['M190 152 C231 156 285 156 326 152', 'M125 195 L154 197', 'M362 197 L390 195'],
  }],
  kippah: [{
    layer: 'hat',
    shapes: [{ d: 'M183 151 C200 117 226 107 258 107 C290 107 316 117 333 151 C291 140 225 140 183 151 Z', color: 'hat' }],
    calm: true, lines: ['M183 151 C200 117 226 107 258 107 C290 107 316 117 333 151 C291 140 225 140 183 151'],
    scratches: ['M215 140 C225 128 239 120 257 113', 'M269 114 C282 121 293 129 300 140'],
  }],
  bearEars: [{
    layer: 'hat',
    shapes: twinShapes([{ d: ring(166, 131, 39), color: 'hat', exact: true }, { d: ring(166, 133, 22), color: 'hatDark', exact: true }]),
    lines: twin([ring(166, 131, 39), 'M153 148 C126 128 151 100 170 115']),
  }],
  antlers: [{
    layer: 'hat',
    shapes: twinShapes([{ d: 'M178 185 C153 160 141 120 142 77 L151 60 L159 72 C157 95 158 112 166 124 L179 104 L185 80 L194 75 L198 89 L191 115 L174 143 L191 170 Z', color: 'hat' },
      { d: 'M152 112 C130 102 118 82 116 57 L126 55 C130 75 139 85 156 91 Z', color: 'hat' }]),
    lines: twin(['M178 185 C153 160 141 120 142 77 L151 60 L159 72 C157 95 158 112 166 124 L179 104 L185 80 L194 75 L198 89 L191 115 L174 143 L191 170', 'M152 112 C130 102 118 82 116 57 L126 55 C130 75 139 85 156 91']),
  }],
  sailor: [{
    layer: 'hat',
    shapes: [{ d: 'M151 183 C132 144 159 113 199 112 C227 93 289 93 317 112 C357 113 384 144 365 183 Z', color: 'hat' },
      { d: 'M145 166 C203 185 313 185 371 166 L367 199 C307 217 209 217 149 199 Z', color: '#ecedef', exact: true }],
    lines: ['M151 183 C132 144 159 113 199 112 C227 93 289 93 317 112 C357 113 384 144 365 183',
      'M145 166 C203 185 313 185 371 166 L367 199 C307 217 209 217 149 199 L145 166', 'M155 192 C215 209 301 209 361 192'],
    scratches: ['M208 111 C198 122 193 134 192 147', 'M310 113 C319 125 322 134 323 148'],
  }],
  beanie: [{
    layer: 'hat',
    under: [{ d: 'M168 214 C216 194 300 194 346 214 C300 228 214 228 168 214 Z', color: 'skinShadow' }],
    blotches: [{ d: 'M300 94 C340 110 356 136 356 160 L322 156 C326 130 318 110 300 94 Z', color: 'hatDark' }],
    scratches: ['M312 104 L336 150', 'M328 108 L350 150'],
    shapes: [
      { d: 'M156 170 C156 52 356 52 358 170 Z', color: 'hat' },
      { d: 'M142 164 C206 142 306 142 372 164 L366 214 C304 192 208 192 148 214 Z', color: 'hatDark' },
    ],
    lines: [
      'M156 160 C156 52 356 52 358 160',
      'M142 164 C206 142 306 142 372 164 L366 214 C304 192 208 192 148 214 L142 164',
      'M190 154 L194 198', 'M236 148 L238 190', 'M282 148 L282 190', 'M328 154 L326 198',
    ],
  }],
  cap: [{
    layer: 'hat',
    under: [{ d: 'M168 208 C216 200 300 200 348 208 C300 224 214 224 168 208 Z', color: 'skinShadow' }],
    blotches: [{ d: 'M300 104 C338 116 352 146 350 176 L320 170 C322 142 316 122 300 104 Z', color: 'hatDark' }],
    shapes: [
      { d: 'M162 192 C152 84 362 76 356 192 C300 174 216 174 162 192 Z', color: 'hat' },
      { d: 'M162 192 C216 174 300 174 356 192 C400 204 420 236 388 232 C320 204 206 204 136 228 C104 234 124 202 162 192 Z', color: 'hatDark' },
    ],
    lines: [
      'M162 192 C152 84 362 76 356 192',
      'M162 192 C216 174 300 174 356 192 C400 204 420 236 388 232 C320 204 206 204 136 228 C104 234 124 202 162 192',
      'M258 122 C252 140 250 160 252 178',
    ],
  }],
  hood: [
    { layer: 'back', shapes: [{ d: 'M140 300 C118 160 180 66 258 66 C336 66 398 160 376 300 C372 380 344 426 330 440 L186 440 C172 426 144 380 140 300 Z', color: 'clothes' }], blotches: [{ d: 'M330 120 C370 170 380 250 370 320 L350 320 C356 250 348 180 330 120 Z', color: 'clothesDark' }], lines: ['M140 300 C118 160 180 66 258 66 C336 66 398 160 376 300 C372 380 344 426 330 440', 'M186 440 C172 426 144 380 140 300'] },
    { layer: 'hat', shapes: [{ d: 'M154 240 C140 96 376 96 362 240 C352 150 164 150 154 240 Z', color: 'clothes' }], lines: ['M154 240 C140 96 376 96 362 240', 'M362 240 C352 150 164 150 154 240'] },
  ],
  tophat: [{
    layer: 'hat',
    shapes: [
      { d: 'M196 166 L204 40 L312 40 L320 166 Z', color: 'hat' },
      { d: 'M200 136 L316 136 L318 160 L198 160 Z', color: 'hatDark' },
      { d: 'M142 170 C200 150 316 150 374 170 C378 190 138 190 142 170 Z', color: 'hat' },
    ],
    lines: ['M196 166 L204 40 L312 40 L320 166', 'M200 136 L316 136', 'M142 170 C200 150 316 150 374 170 C378 190 138 190 142 170'],
    scratches: ['M286 52 L298 128'],
  }],
  cowboy: [{
    layer: 'hat',
    shapes: [
      { d: 'M186 160 C182 84 226 66 258 90 C290 66 334 84 330 160 Z', color: 'hat' },
      { d: 'M100 156 C150 196 366 196 416 156 C428 184 380 214 258 214 C136 214 88 184 100 156 Z', color: 'hatDark' },
    ],
    lines: ['M186 160 C182 84 226 66 258 90 C290 66 334 84 330 160', 'M100 156 C150 196 366 196 416 156 C428 184 380 214 258 214 C136 214 88 184 100 156', 'M188 144 C230 156 286 156 328 144'],
  }],
  crown: [{
    layer: 'hat',
    shapes: [{ d: 'M180 168 L174 92 L212 126 L236 72 L258 116 L280 72 L304 126 L342 92 L336 168 Z', color: 'hat' }],
    blotches: [{ d: 'M300 128 L336 104 L332 160 L304 160 Z', color: 'hatDark' }],
    lines: ['M180 168 L174 92 L212 126 L236 72 L258 116 L280 72 L304 126 L342 92 L336 168 L180 168'],
    dots: [{ x: 258, y: 146, r: 8, color: '#c84b3c' }, { x: 214, y: 150, r: 6, color: '#4f6fb3' }, { x: 302, y: 150, r: 6, color: '#4f9a5f' }],
  }],
  generic: [{
    layer: 'hat',
    shapes: [
      { d: 'M172 186 C170 96 346 96 344 186 Z', color: 'hat' },
      { d: 'M128 194 C172 172 344 172 388 194 C394 220 122 220 128 194 Z', color: 'hatDark' },
    ],
    lines: ['M172 186 C170 96 346 96 344 186', 'M128 194 C172 172 344 172 388 194 C394 220 122 220 128 194', 'M174 168 C230 160 290 160 342 168'],
  }],
  bandana: [{
    layer: 'hat',
    shapes: [
      { d: 'M160 198 C200 176 316 176 356 198 L354 226 C316 206 200 206 162 226 Z', color: 'hat' },
      { d: 'M354 208 L394 194 L388 230 L352 222 Z', color: 'hatDark' },
    ],
    lines: ['M160 198 C200 176 316 176 356 198 L354 226 C316 206 200 206 162 226 L160 198', 'M354 208 L394 194 L388 230 L352 222'],
    dots: [{ x: 210, y: 204, r: 3, color: 'paper' }, { x: 258, y: 198, r: 3, color: 'paper' }, { x: 306, y: 204, r: 3, color: 'paper' }],
  }],
  pointy: [{
    layer: 'hat',
    shapes: [
      { d: 'M182 192 C210 140 240 80 266 18 C276 60 300 130 336 192 Z', color: 'hat' },
      { d: 'M136 198 C190 174 326 174 380 198 C386 222 130 222 136 198 Z', color: 'hatDark' },
    ],
    lines: ['M182 192 C210 140 240 80 266 18 C276 60 300 130 336 192', 'M136 198 C190 174 326 174 380 198 C386 222 130 222 136 198'],
    dots: [{ x: 252, y: 120, r: 6, color: '#f2cf4a' }, { x: 284, y: 150, r: 4, color: '#f2cf4a' }],
  }],
  beret: [{
    layer: 'hat',
    shapes: [{ d: 'M152 190 C134 120 230 92 304 102 C374 112 398 160 362 198 C322 176 196 176 152 190 Z', color: 'hat' }],
    blotches: [{ d: 'M300 112 C346 124 370 150 360 182 L336 178 C342 154 326 130 300 112 Z', color: 'hatDark' }],
    lines: ['M152 190 C134 120 230 92 304 102 C374 112 398 160 362 198 C322 176 196 176 152 190', 'M262 102 L266 86'],
  }],
  halo: [{ layer: 'hat', calm: true, lineColor: 'hat', lines: ['M180 62 C180 36 336 36 336 62 C336 88 180 88 180 62'] }],
  horns: [{
    layer: 'hat',
    shapes: twinShapes([{ d: 'M190 130 C168 98 166 62 182 38 C188 74 206 100 226 112 Z', color: 'hat' }]),
    lines: twin(['M190 130 C168 98 166 62 182 38 C188 74 206 100 226 112']),
  }],
  santa: [{
    layer: 'hat',
    shapes: [
      { d: 'M162 196 C168 90 284 46 362 120 C392 150 404 190 396 222 C374 172 344 152 354 196 Z', color: 'hat' },
      { d: 'M150 196 C200 172 316 172 366 196 L362 228 C316 206 200 206 154 228 Z', color: '#f4f1ea' },
    ],
    blotches: [{ d: 'M300 80 C340 100 362 130 360 170 L340 170 C340 136 326 108 300 80 Z', color: 'hatDark' }],
    lines: ['M162 196 C168 90 284 46 362 120 C392 150 404 190 396 222', 'M150 196 C200 172 316 172 366 196 L362 228 C316 206 200 206 154 228 L150 196'],
    dots: [{ x: 396, y: 230, r: 18, color: '#f4f1ea' }],
  }],
  chef: [{
    layer: 'hat',
    shapes: [{ d: 'M178 196 L182 120 C148 110 150 58 192 60 C200 28 252 24 262 52 C282 22 336 30 334 66 C372 64 374 112 336 120 L338 196 Z', color: 'hat' }],
    blotches: [{ d: 'M300 70 C330 74 340 100 326 118 L310 116 C320 100 316 82 300 70 Z', color: 'hatDark' }],
    lines: ['M178 196 L182 120 C148 110 150 58 192 60 C200 28 252 24 262 52 C282 22 336 30 334 66 C372 64 374 112 336 120 L338 196', 'M176 196 C220 186 296 186 340 196', 'M182 160 C224 152 294 152 336 160'],
  }],
  catEars: [{
    layer: 'hat',
    shapes: twinShapes([{ d: 'M178 138 L170 64 L232 108 Z', color: 'hat' }, { d: 'M184 126 L180 84 L216 110 Z', color: '#f29bc0' }]),
    lines: twin(['M178 138 L170 64 L232 108']),
  }],
  viking: [{
    layer: 'hat',
    shapes: [
      ...twinShapes([{ d: 'M170 158 C128 146 112 104 124 66 C138 102 162 118 192 126 Z', color: '#efe6d2' }]),
      { d: 'M160 200 C154 90 362 90 356 200 Z', color: 'hat' },
      { d: 'M150 196 C200 176 316 176 366 196 L362 222 C316 204 200 204 154 222 Z', color: 'hatDark' },
    ],
    lines: [...twin(['M170 158 C128 146 112 104 124 66 C138 102 162 118 192 126']), 'M160 196 C154 90 362 90 356 196', 'M150 196 C200 176 316 176 366 196 L362 222 C316 204 200 204 154 222 L150 196', 'M258 96 L258 180'],
    dots: [{ x: 190, y: 210, r: 4, color: '#1b1b1f' }, { x: 226, y: 204, r: 4, color: '#1b1b1f' }, { x: 290, y: 204, r: 4, color: '#1b1b1f' }, { x: 326, y: 210, r: 4, color: '#1b1b1f' }],
  }],
  pompom: [{
    layer: 'hat',
    under: [{ d: 'M168 214 C216 194 300 194 346 214 C300 228 214 228 168 214 Z', color: 'skinShadow' }],
    shapes: [
      { d: 'M156 170 C156 52 356 52 358 170 Z', color: 'hat' },
      { d: 'M142 164 C206 142 306 142 372 164 L366 214 C304 192 208 192 148 214 Z', color: 'hatDark' },
      { d: 'M234 52 C234 20 282 20 282 52 C282 78 234 78 234 52 Z', color: '#f4f1ea' },
    ],
    lines: ['M156 160 C156 52 356 52 358 160', 'M142 164 C206 142 306 142 372 164 L366 214 C304 192 208 192 148 214 L142 164', 'M234 52 C234 20 282 20 282 52 C282 78 234 78 234 52', 'M210 150 L212 196', 'M258 146 L258 192', 'M306 150 L304 196'],
  }],
  capBack: [{
    layer: 'hat',
    under: [{ d: 'M168 208 C216 200 300 200 348 208 C300 224 214 224 168 208 Z', color: 'skinShadow' }],
    shapes: [
      { d: 'M300 112 C340 92 384 100 394 124 C362 122 332 132 312 146 Z', color: 'hatDark' },
      { d: 'M162 196 C152 84 362 76 356 196 C300 180 216 180 162 196 Z', color: 'hat' },
    ],
    lines: ['M300 112 C340 92 384 100 394 124 C362 122 332 132 312 146', 'M162 196 C152 84 362 76 356 196 C300 180 216 180 162 196', 'M228 182 C240 166 276 166 288 182'],
  }],
  hijab: [
    { layer: 'back', shapes: [{ d: 'M146 300 C126 150 186 70 258 70 C330 70 390 150 370 300 C366 390 352 430 340 470 L176 470 C164 430 150 390 146 300 Z', color: 'hat' }],
      blotches: [{ d: 'M330 130 C368 180 376 260 366 340 L346 340 C352 260 346 190 330 130 Z', color: 'hatDark' }],
      lines: ['M146 300 C126 150 186 70 258 70 C330 70 390 150 370 300 C366 390 352 430 340 470', 'M176 470 C164 430 150 390 146 300'] },
    { layer: 'hat', shapes: [{ d: 'M160 250 C148 112 368 112 356 250 C348 160 168 160 160 250 Z', color: 'hat' }], lines: ['M160 250 C148 112 368 112 356 250', 'M356 250 C348 160 168 160 160 250'], scratches: ['M190 140 C230 128 290 128 330 140'] },
    { layer: 'bodyOver', shapes: [{ d: 'M196 410 C230 440 290 440 322 410 L340 470 L176 470 Z', color: 'hat' }], lines: ['M196 410 C230 440 290 440 322 410'], scratches: ['M220 440 L210 470', 'M300 440 L310 470'] },
  ],
  turban: [{
    layer: 'hat',
    shapes: [{ d: 'M160 206 C142 70 374 70 356 206 C322 184 194 184 160 206 Z', color: 'hat' }],
    blotches: [{ d: 'M300 90 C340 110 360 150 356 190 L330 186 C334 150 320 116 300 90 Z', color: 'hatDark' }],
    lines: ['M160 206 C142 70 374 70 356 206 C322 184 194 184 160 206', 'M170 176 C210 120 280 96 340 110', 'M168 150 C220 160 290 140 330 96', 'M200 120 C240 150 300 160 350 170'],
    dots: [{ x: 258, y: 150, r: 9, color: '#c84b3c' }],
  }],
  bunnyEars: [{
    layer: 'hat',
    shapes: twinShapes([{ d: 'M206 140 C182 60 192 0 214 8 C236 18 236 90 230 140 Z', color: 'hat' }, { d: 'M212 126 C200 70 204 30 214 30 C224 34 226 90 222 126 Z', color: '#f29bc0' }]),
    lines: twin(['M206 140 C182 60 192 0 214 8 C236 18 236 90 230 140']),
  }],
  foxEars: [{
    layer: 'hat',
    shapes: twinShapes([{ d: 'M172 146 L156 52 L236 104 Z', color: 'hat' }, { d: 'M160 72 L156 52 L176 64 Z', color: '#f4f1ea' }, { d: 'M180 130 L172 82 L216 108 Z', color: '#f4f1ea' }]),
    lines: twin(['M172 146 L156 52 L236 104']),
  }],
  flowers: [{
    layer: 'hat',
    calm: true,
    lineColor: '#4f9a5f',
    lines: ['M160 176 C190 120 326 120 356 176'],
    dots: [[166, 168, '#e8455a'], [196, 136, '#f2cf4a'], [232, 122, '#f29bc0'], [270, 120, '#e8455a'], [306, 128, '#f2cf4a'], [338, 148, '#f29bc0'], [356, 174, '#e8455a']]
      .flatMap(([x, y, color]) => [...[0, 1, 2, 3, 4].map((i) => ({ x: x + Math.cos(i * 1.26) * 9, y: y + Math.sin(i * 1.26) * 9, r: 7, color })), { x, y, r: 5, color: '#f4f1ea' }]),
  }],
  alice: [{ layer: 'hat', shapes: [{ d: 'M160 210 C150 112 366 112 356 210 L344 210 C354 128 162 128 172 210 Z', color: 'hat' }], lines: ['M160 210 C150 112 366 112 356 210', 'M344 210 C354 128 162 128 172 210'] }],
  bucket: [{
    layer: 'hat',
    shapes: [{ d: 'M172 192 C170 110 346 110 344 192 Z', color: 'hat' }, { d: 'M142 200 C170 178 346 178 374 200 L390 232 C330 210 186 210 126 232 Z', color: 'hatDark' }],
    lines: ['M172 192 C170 110 346 110 344 192', 'M142 200 C170 178 346 178 374 200 L390 232 C330 210 186 210 126 232 L142 200'],
    scratches: ['M190 170 C230 162 286 162 326 170'],
  }],
  party: [{
    layer: 'hat',
    shapes: [{ d: 'M200 150 L252 20 L306 150 Z', color: 'hat' }],
    lines: ['M200 150 L252 20 L306 150', 'M200 150 C230 160 280 160 306 150'],
    scratches: ['M226 86 L272 100', 'M214 118 L290 130', 'M240 54 L262 60'],
    dots: [{ x: 252, y: 18, r: 12, color: '#f2cf4a' }, { x: 238, y: 110, r: 5, color: '#f4f1ea' }, { x: 270, y: 74, r: 5, color: '#f4f1ea' }],
  }],
  fedora: [{
    layer: 'hat',
    shapes: [{ d: 'M184 182 C178 120 204 96 258 110 C312 96 338 120 332 182 Z', color: 'hat' }, { d: 'M184 162 C230 172 286 172 332 162 L332 180 C286 190 230 190 184 180 Z', color: 'hatDark' }, { d: 'M118 188 C168 166 348 166 398 188 C384 210 132 210 118 188 Z', color: 'hat' }],
    lines: ['M184 182 C178 120 204 96 258 110 C312 96 338 120 332 182', 'M118 188 C168 166 348 166 398 188 C384 210 132 210 118 188', 'M258 112 L256 140'],
  }],
  helmet: [{
    layer: 'hat',
    shapes: [{ d: 'M168 196 C160 96 356 96 348 196 Z', color: 'hat' }, { d: 'M148 196 L368 196 L372 214 L144 214 Z', color: 'hatDark' }],
    blotches: [{ d: 'M300 112 C334 126 348 160 346 190 L328 190 C330 160 320 132 300 112 Z', color: 'hatDark' }],
    lines: ['M168 196 C160 96 356 96 348 196', 'M148 196 L368 196 L372 214 L144 214 L148 196', 'M246 104 L246 196', 'M270 104 L270 196'],
  }],
  bowler: [{
    layer: 'hat',
    shapes: [{ d: 'M190 182 C180 90 336 90 326 182 Z', color: 'hat' }, { d: 'M156 188 C200 172 316 172 360 188 C344 204 172 204 156 188 Z', color: 'hatDark' }],
    lines: ['M190 182 C180 90 336 90 326 182', 'M156 188 C200 172 316 172 360 188 C344 204 172 204 156 188'],
  }],
  // Mortarboard: a flat square seen at an angle over a skull cap, with a tassel.
  graduation: [{
    layer: 'hat',
    shapes: [{ d: 'M180 194 C176 142 340 142 336 194 Z', color: 'hat' }, { d: 'M258 96 L388 140 L258 184 L128 140 Z', color: 'hatDark' }],
    lines: ['M180 194 C176 142 340 142 336 194', 'M258 96 L388 140 L258 184 L128 140 L258 96'],
  }, { layer: 'hat', calm: true, lineColor: '#e0b23a', lines: ['M258 140 L350 156 L352 204'], dots: [{ x: 352, y: 208, r: 5, color: '#e0b23a' }] }],
};
// A veil is the hijab shape with a white band at the forehead.
hat.veil = [...hat.hijab, { layer: 'hat', shapes: [{ d: 'M164 240 C156 168 360 168 352 240 C344 190 172 190 164 240 Z', color: '#f4f1ea', exact: true }], lines: ['M164 240 C156 168 360 168 352 240', 'M352 240 C344 190 172 190 164 240'] }];
// Hats that leave the hair visible; the others show only the locks underneath, some hide everything.
export const hatKeepsHair = new Set(['none', 'bandana', 'crown', 'hood', 'halo', 'horns', 'catEars', 'bunnyEars', 'foxEars', 'flowers', 'alice', 'party', 'spaceHelmet', 'antlers', 'bearEars', 'kippah']);
export const hatHidesAll = new Set(['hijab', 'veil', 'turban']);

// ---------- beard and moustache ----------
// The beard follows the chosen face outline; the long beard stretches it below the chin.
function beardFor(outline, stretch) {
  const outer = flatten(outline).filter(([, y]) => y >= 296).map(([x, y]) => [x, y + (y - 296) * stretch]);
  const [lx, ly] = outer[0];
  const [rx, ry] = outer[outer.length - 1];
  const mouthHole = `C${rx - 10} ${ry + 44} 320 372 302 382 C286 370 232 370 216 382 C198 372 ${lx + 12} ${ly + 44} ${lx} ${ly}`;
  const bottom = Math.max(...outer.map(([, y]) => y));
  return [{
    layer: 'facial',
    shapes: [{ d: `${polyline(outer)} ${mouthHole} Z`, color: 'beard' }],
    blotches: [{ d: `M290 ${bottom - 24} C320 ${bottom - 44} 338 360 344 320 C330 360 312 ${bottom - 40} 284 ${bottom - 34} Z`, color: 'beardLight' }],
    lines: [polyline(outer), 'M216 382 C232 370 286 370 302 382'],
    scratches: [`M226 ${bottom - 40} L232 ${bottom - 18}`, `M258 ${bottom - 36} L258 ${bottom - 12}`, `M290 ${bottom - 40} L284 ${bottom - 18}`],
  }];
}

const beard = {
  none: [],
  soulPatch: [{
    layer: 'facial',
    shapes: [{ d: 'M244 373 C252 370 264 370 272 373 C271 386 265 395 258 397 C251 395 245 386 244 373 Z', color: 'beard', exact: true }],
    calm: true, thin: true, lines: ['M244 373 C252 370 264 370 272 373 C271 386 265 395 258 397 C251 395 245 386 244 373'],
  }],
  braidedBeard: [{
    layer: 'facial',
    shapes: [{ d: 'M180 329 C193 372 217 381 258 382 C299 381 323 372 336 329 C338 395 306 423 285 428 C300 443 274 451 285 466 C289 482 265 494 258 510 C251 494 227 482 231 466 C242 451 216 443 231 428 C210 423 178 395 180 329 Z', color: 'beard' },
      { d: 'M242 469 C251 474 265 474 274 469 L273 480 C263 485 253 485 243 480 Z', color: '#c29a3d', exact: true }],
    lines: ['M180 329 C193 372 217 381 258 382 C299 381 323 372 336 329', 'M180 329 C178 395 210 423 231 428 C216 443 242 451 231 466 C227 482 251 494 258 510 C265 494 289 482 285 466 C274 451 300 443 285 428 C306 423 338 395 336 329',
      'M232 421 L278 443 L236 462', 'M282 422 L238 441 L280 463'],
  }],
  ...Object.fromEntries(Object.entries(faceOutlines).flatMap(([face, outline]) => [
    [`beard-${face}`, beardFor(outline, 0)],
    [`longBeard-${face}`, beardFor(outline, 0.9)],
  ])),
  stubble: [{
    layer: 'facial',
    dots: scatter(41, 110, (x, y) => ((x - 258) / 86) ** 2 + ((y - 344) / 92) ** 2 < 1 && y > 318
      && !(Math.abs(y - 352) < 16 && Math.abs(x - 258) < 44) && !(y < 344 && Math.abs(x - 258) > 64), 1.7, 'beard', 0.75),
  }],
  goatee: [{
    layer: 'facial',
    shapes: [{ d: 'M236 378 C246 370 270 370 280 378 C284 404 270 424 258 424 C246 424 232 404 236 378 Z', color: 'beard' }],
    lines: ['M236 378 C246 370 270 370 280 378 C284 404 270 424 258 424 C246 424 232 404 236 378'],
  }],
};
const moustache = {
  none: [],
  pencilMoustache: [{
    layer: 'mouthAcc', calm: true, thin: true, lineColor: 'beard',
    lines: ['M224 335 C236 328 244 327 253 329', 'M263 329 C272 327 280 328 292 335'],
  }],
  handlebar: [{
    layer: 'mouthAcc',
    shapes: [{ d: 'M218 332 C232 318 250 318 258 326 C266 318 284 318 298 332 C306 332 312 322 308 314 C320 320 316 340 300 340 C284 340 268 334 258 332 C248 334 232 340 216 340 C200 340 196 320 208 314 C204 322 210 332 218 332 Z', color: 'beard' }],
    lines: ['M218 332 C232 318 250 318 258 326 C266 318 284 318 298 332 C306 332 312 322 308 314 C320 320 316 340 300 340 C284 340 268 334 258 332 C248 334 232 340 216 340 C200 340 196 320 208 314 C204 322 210 332 218 332'],
  }],
  moustache: [{
    layer: 'mouthAcc',
    shapes: [{ d: 'M218 332 C232 314 250 316 258 326 C266 316 284 314 298 332 C284 340 268 336 258 332 C248 336 232 340 218 332 Z', color: 'beard' }],
    lines: ['M218 332 C232 314 250 316 258 326 C266 316 284 314 298 332 C284 340 268 336 258 332 C248 336 232 340 218 332'],
  }],
};

// ---------- eyewear ----------
const lens = 'M184 248 C184 238 242 238 242 248 L242 280 C242 292 184 292 184 280 Z';
const aviatorLens = 'M180 252 C184 238 225 238 242 252 C242 277 227 303 207 295 C191 288 180 268 180 252 Z';
const eyewear = {
  none: [],
  catEye: [{
    layer: 'eyewear', lineColor: 'frames',
    lines: [...twin(['M174 233 C192 242 223 239 243 250 C240 278 224 294 204 288 C184 284 177 261 174 233 Z', 'M174 237 L164 245']),
      'M243 253 C251 248 265 248 273 253'],
  }],
  halfRim: [{
    layer: 'eyewear', lineColor: 'frames',
    lines: [...twin(['M179 253 C194 238 226 237 243 250', 'M181 246 L164 244']), 'M243 251 C252 242 264 242 273 251'],
  }, {
    layer: 'eyewear', calm: true, thin: true, lineColor: '#9ca9af',
    lines: twin(['M179 253 L184 278 C193 297 225 296 236 278 L243 250']),
  }],
  aviators: [{
    layer: 'eyewear', lineColor: 'frames',
    shapes: twinShapes([{ d: aviatorLens, color: 'tintedLens', exact: true }]),
    blotches: twinShapes([{ d: 'M183 250 L213 246 L200 261 L185 265 Z', color: '#85818a' }]),
    lines: [...twin([aviatorLens, 'M180 250 L162 242']), 'M237 244 C249 235 267 235 279 244', 'M242 259 C251 254 265 254 274 259'],
  }],
  goggles: [{
    layer: 'eyewear', lineColor: 'frames',
    shapes: [{ d: 'M166 246 C186 218 329 218 350 246 L346 282 C335 309 285 311 270 290 C263 280 253 280 246 290 C231 311 181 309 170 282 Z', color: 'frames', exact: true },
      { d: 'M177 249 C199 229 317 229 339 249 L334 279 C323 296 288 299 275 280 C266 266 250 266 241 280 C228 299 193 296 182 279 Z', color: 'goggleLens', exact: true }],
    lines: ['M166 246 C186 218 329 218 350 246', 'M166 249 L150 241', 'M350 249 L366 241'],
    blotches: [{ d: 'M191 250 L224 244 L208 265 L184 273 Z', color: '#cce5ef' }],
  }],
  glasses: [{
    layer: 'eyewear', lineColor: 'frames',
    lines: [...twin([lens, 'M184 256 L166 250']), 'M242 258 C252 250 264 250 274 258'],
  }],
  round: [{
    layer: 'eyewear', lineColor: 'frames',
    lines: [...twin(['M186 266 C186 238 242 238 242 266 C242 294 186 294 186 266', 'M186 260 L166 252']), 'M242 262 C252 254 264 254 274 262'],
  }],
  // Half-moon reading glasses sit low on the nose, under the eyes.
  // A thin chain hangs from the temples, so they read differently from ordinary glasses.
  reading: [
    {
      layer: 'eyewear', lineColor: 'frames',
      shapes: twinShapes([{ d: 'M192 286 L240 286 C238 312 194 312 192 286 Z', color: '#dfe9ef' }]),
      lines: [...twin(['M192 286 L240 286 C238 312 194 312 192 286', 'M192 286 L166 264']), 'M240 288 C250 280 266 280 276 288'],
    },
    { layer: 'over', calm: true, thin: true, lineColor: '#c9a03a', lines: twin(['M168 266 C150 330 172 398 214 418']) },
  ],
  monocle: [{
    layer: 'eyewear', lineColor: 'frames',
    shapes: [{ d: 'M276 266 C276 238 330 238 330 266 C330 294 276 294 276 266 Z', color: '#dfeaf0' }],
    lines: ['M276 266 C276 238 330 238 330 266 C330 294 276 294 276 266'],
  }, { layer: 'over', calm: true, thin: true, lineColor: '#b8861f', lines: ['M326 280 C344 330 336 380 320 430'] }],
  slim: [{
    layer: 'eyewear', lineColor: 'frames',
    shapes: twinShapes([{ d: 'M192 262 C192 252 236 252 236 262 C236 274 192 274 192 262 Z', color: 'tintedLens', exact: true }]),
    blotches: twinShapes([{ d: 'M198 258 L208 256 L202 266 Z', color: '#55545e' }]),
    lines: [...twin(['M192 262 C192 252 236 252 236 262 C236 274 192 274 192 262', 'M192 260 L166 254']), 'M236 260 C248 254 268 254 280 260'],
  }],
  hearts: [{
    layer: 'eyewear', lineColor: 'frames',
    shapes: twinShapes([{ d: 'M214 292 C174 270 178 236 200 238 C208 239 214 248 214 248 C214 248 220 239 228 238 C250 236 254 270 214 292 Z', color: 'heartLens' }]),
    blotches: twinShapes([{ d: 'M196 248 L206 246 L198 262 Z', color: '#f7a8b6' }]),
    lines: [...twin(['M214 292 C174 270 178 236 200 238 C208 239 214 248 214 248 C214 248 220 239 228 238 C250 236 254 270 214 292']), 'M246 254 C254 248 262 248 270 254'],
  }],
  pixel: [{
    layer: 'eyewear',
    shapes: [
      { d: 'M150 248 L362 248 L362 260 L150 260 Z', color: 'frames', exact: true },
      ...twinShapes([{ d: 'M184 260 L242 260 L242 270 L234 270 L234 280 L224 280 L224 288 L196 288 L196 280 L188 280 L188 270 L184 270 Z', color: 'tintedLens', exact: true }]),
      ...twinShapes([{ d: 'M196 264 L206 264 L206 272 L196 272 Z', color: '#f4f1ea', exact: true }]),
    ],
  }],
  vr: [{
    layer: 'eyewear', lineColor: 'frames',
    shapes: [{ d: 'M172 234 L344 234 C356 234 356 300 344 300 L172 300 C160 300 160 234 172 234 Z', color: '#34343c' }, { d: 'M184 246 L332 246 L332 262 L184 262 Z', color: 'visorDisplay' }],
    lines: ['M172 234 L344 234 C356 234 356 300 344 300 L172 300 C160 300 160 234 172 234', 'M164 256 L150 250', 'M352 256 L366 250'],
  }],
  visor: [{
    layer: 'eyewear',
    shapes: [{ d: 'M164 246 C220 236 296 236 352 246 L348 282 C296 274 220 274 168 282 Z', color: 'visorTint' }],
    blotches: [{ d: 'M190 248 L230 244 L216 262 L186 264 Z', color: '#c9f5fa' }],
    lines: ['M164 246 C220 236 296 236 352 246 L348 282 C296 274 220 274 168 282 L164 246'],
  }],
  sunglasses: [{
    layer: 'eyewear', lineColor: 'frames',
    shapes: twinShapes([{ d: lens, color: 'tintedLens', exact: true }]),
    blotches: twinShapes([{ d: 'M194 252 L206 250 L196 270 Z', color: '#55545e' }]),
    lines: [...twin([lens, 'M184 256 L166 250']), 'M242 258 C252 250 264 250 274 258'],
  }],
  eyepatch: [{
    layer: 'eyewear', lineColor: 'frames',
    shapes: [{ d: 'M188 246 C196 236 236 236 242 248 C246 276 230 292 212 290 C194 288 182 266 188 246 Z', color: 'tintedLens', exact: true }],
    lines: ['M188 246 C196 236 236 236 242 248 C246 276 230 292 212 290 C194 288 182 266 188 246', 'M190 248 L168 210', 'M240 246 L346 200'],
  }],
};

// ---------- mouth items ----------
const smoke = {
  none: [],
  cigarette: [
    {
      layer: 'mouthAcc',
      shapes: [{ d: 'M284 348 L366 364 L363 382 L281 366 Z', color: 'paper', exact: true }, { d: 'M350 361 L366 364 L363 382 L347 379 Z', color: '#e8613a', exact: true }],
      calm: true,
      lines: ['M284 348 L366 364 L363 382 L281 366', 'M350 361 L347 379'],
    },
    { layer: 'over', lineColor: '#9a9aa4', lines: ['M372 364 C396 340 382 314 404 292 C426 270 404 246 426 220 C440 204 432 188 446 176'] },
  ],
  gum: [{ layer: 'mouthAcc', shapes: [{ d: 'M226 366 C226 324 290 324 290 366 C290 404 226 404 226 366 Z', color: '#f29bc0' }], blotches: [{ d: 'M238 352 C242 340 254 336 262 338 C252 344 246 350 244 358 Z', color: '#fbd3e4' }], calm: true, lines: ['M226 366 C226 324 290 324 290 366 C290 404 226 404 226 366'] }],
  lollipop: [
    { layer: 'mouthAcc', calm: true, thin: true, lineColor: '#f4f1ea', lines: ['M286 356 L340 330'] },
    { layer: 'over', shapes: [{ d: 'M328 322 C328 292 372 292 372 322 C372 352 328 352 328 322 Z', color: '#e8455a' }], calm: true, lines: ['M328 322 C328 292 372 292 372 322 C372 352 328 352 328 322', 'M350 322 C350 312 362 312 362 322 C362 336 340 336 340 322 C340 304 368 302 368 322'] },
  ],
  toothpick: [{ layer: 'mouthAcc', calm: true, lineColor: '#8a6430', lines: ['M284 352 L342 338'] }],
  rose: [{
    layer: 'mouthAcc',
    shapes: [{ d: 'M336 330 C336 312 366 310 368 328 C370 346 340 350 336 330 Z', color: '#c8283c' }],
    calm: true,
    lineColor: '#2f6b3a',
    lines: ['M236 356 L340 340', 'M300 346 L310 332'],
    dots: [{ x: 352, y: 328, r: 5, color: '#8f1424' }],
  }],
  pipe: [{
    layer: 'mouthAcc',
    shapes: [{ d: 'M326 368 C324 392 330 412 350 412 C370 412 374 392 372 368 Z', color: '#7a4e33' }],
    calm: true,
    lines: ['M284 358 C300 366 314 372 328 374', 'M326 368 C324 392 330 412 350 412 C370 412 374 392 372 368 L326 368'],
  }],
};

// Piercings: steel studs and rings. Ear pieces sit on the ear layers so they follow the head turn.
const steel = '#6f7780';
// Lobe layers swing like the ears but sit above the hair, so earrings show through long hair.
const onBothEars = (part, [left, right] = ['earLeft', 'earRight']) => [
  { ...part, layer: left },
  {
    ...part,
    layer: right,
    shapes: part.shapes?.map((shape) => ({ ...shape, d: mirror(shape.d) })),
    lines: part.lines?.map(mirror),
    dots: part.dots?.map((dot) => ({ ...dot, x: 516 - dot.x })),
  },
];

// ---------- details (each one is a slot, on or off) ----------
const detail = {
  lapelPin: [{
    layer: 'bodyOver', calm: true, thin: true, lineColor: '#6b5832',
    shapes: [{ d: 'M329 452 L333 462 L344 462 L336 469 L339 480 L329 474 L319 480 L322 469 L314 462 L325 462 Z', color: '#e7b744', exact: true }],
    lines: ['M329 452 L333 462 L344 462 L336 469 L339 480 L329 474 L319 480 L322 469 L314 462 L325 462 L329 452'],
  }],
  nameTag: [{
    layer: 'bodyOver', calm: true, thin: true, lineColor: '#674e32',
    shapes: [{ d: 'M315 459 L367 457 L368 479 L316 481 Z', color: '#d5ae62', exact: true }],
    lines: ['M315 459 L367 457 L368 479 L316 481 L315 459', 'M325 468 L358 467', 'M325 473 L346 472'],
  }],
  camera: [{
    layer: 'bodyOver', calm: true,
    shapes: [{ d: 'M204 455 L228 455 L235 445 L263 445 L271 455 L309 455 L309 503 L204 503 Z', color: '#42434a' },
      { d: ring(257, 478, 21), color: '#bdc5cb', exact: true }, { d: ring(257, 478, 14), color: '#435e78', exact: true }],
    lines: ['M197 414 L216 455', 'M318 414 L301 455', 'M204 455 L228 455 L235 445 L263 445 L271 455 L309 455 L309 503 L204 503 L204 455', ring(257, 478, 21)],
    dots: [{ x: 251, y: 472, r: 4, color: '#b8d6e7' }, { x: 290, y: 466, r: 4, color: '#e3c77d' }],
  }],
  lanyard: [{
    layer: 'bodyOver', calm: true, thin: true, lineColor: 'lanyard',
    lines: ['M213 409 C216 443 230 467 258 480 C287 467 300 443 303 409'],
  }, {
    layer: 'bodyOver', calm: true, thin: true,
    shapes: [{ d: 'M235 476 L281 476 L281 519 L235 519 Z', color: '#eff0ed', exact: true }],
    lines: ['M235 476 L281 476 L281 519 L235 519 L235 476', 'M248 489 L268 489', 'M246 505 L270 505'],
  }],
  headlamp: [{
    layer: 'over', calm: true,
    shapes: [{ d: 'M156 205 C199 190 317 190 360 205 L358 218 C311 207 205 207 158 218 Z', color: '#4b4651', exact: true },
      { d: 'M236 191 L280 191 L284 220 L232 220 Z', color: '#686c74', exact: true }, { d: ring(258, 205, 11), color: '#ffe09a', exact: true }],
    lines: ['M156 205 C199 190 317 190 360 205', 'M236 191 L280 191 L284 220 L232 220 L236 191'],
  }],
  hearingAid: onBothEars({
    calm: true, thin: true,
    shapes: [{ d: 'M139 244 C127 248 133 285 143 288 C150 285 149 252 139 244 Z', color: '#7496a6', exact: true }],
    lines: ['M139 244 C148 225 172 232 164 250 C160 261 153 261 154 271'],
    dots: [{ x: 154, y: 271, r: 4, color: '#cbdde0' }],
  }, ['over', 'over']),
  locket: [{
    layer: 'bodyOver', calm: true, thin: true, lineColor: '#a77e37',
    lines: ['M213 424 C227 458 287 473 303 424'],
    shapes: [{ d: 'M258 481 C230 467 246 445 258 456 C270 445 286 467 258 481 Z', color: '#d7ab58', exact: true }],
  }],
  boloTie: [{
    layer: 'bodyOver', calm: true, thin: true,
    lines: ['M214 422 L253 451 L243 513', 'M302 422 L263 451 L273 513'],
    shapes: [{ d: 'M243 447 L258 434 L273 447 L258 464 Z', color: '#b9bdc0', exact: true },
      { d: ring(258, 449, 8), color: 'boloTie', exact: true }],
    dots: [{ x: 243, y: 513, r: 4, color: steel }, { x: 273, y: 513, r: 4, color: steel }],
  }],
  pearlStuds: onBothEars({
    dots: [{ x: 168, y: 307, r: 7.5, color: '#b7a5a1' }, { x: 168, y: 305, r: 6, color: '#fff2de' }, { x: 166, y: 303, r: 2.1, color: '#fffaf1' }],
  }, ['lobeLeft', 'lobeRight']),
  pearlNecklace: [{
    layer: 'bodyOver',
    dots: Array.from({ length: 11 }, (_, i) => {
      const angle = (i - 5) * 0.17;
      return { x: 258 + 56 * Math.sin(angle), y: 407 + 53 * Math.cos(angle), r: 5.6, color: i % 2 ? '#f2dfd0' : '#fff2de' };
    }),
  }],
  blush: [{
    layer: 'skinDetail',
    dots: [194, 322].flatMap((x) => [
      { x, y: 313, r: 17, color: 'blush', opacity: 0.52 },
      { x: x + 4, y: 313, r: 12, color: 'blush', opacity: 0.48 },
    ]),
  }],
  sunburn: [{
    layer: 'skinDetail',
    dots: [190, 204, 219, 297, 312, 326].map((x) => ({ x, y: 298, r: 15, color: 'blush', opacity: 0.5 })),
  }, {
    layer: 'nose', dots: [{ x: 257, y: 306, r: 13, color: 'blush', opacity: 0.64 }],
  }],
  chinCleft: [{
    layer: 'skinDetail', calm: true, thin: true, lineColor: 'skinShadow',
    lines: ['M258 388 C249 395 253 405 261 408'],
  }],
  faceStars: [{
    layer: 'skinDetail',
    shapes: twinShapes([{ d: 'M199 299 L203 308 L213 307 L205 314 L208 324 L199 318 L190 324 L193 314 L185 307 L195 308 Z', color: '#f0c34a', exact: true }]),
    dots: [{ x: 216, y: 321, r: 3, color: '#ec85ae' }, { x: 300, y: 321, r: 3, color: '#ec85ae' }],
  }],
  // The stretched lobe hangs below the ear, clear of the head outline.
  gauges: onBothEars({
    calm: true,
    shapes: [{ d: ring(156, 306, 13), color: 'skin' }, { d: ring(156, 306, 9), color: '#2a2a30' }, { d: ring(156, 306, 4.5), color: 'skin' }],
    lines: [ring(156, 306, 13), ring(156, 306, 9)],
  }, ['lobeLeft', 'lobeRight']),
  helix: onBothEars({ calm: true, thin: true, lineColor: steel, lines: ['M146 236 C138 244 146 256 152 246'], dots: [{ x: 140, y: 258, r: 3.5, color: steel }, { x: 140, y: 272, r: 3.5, color: steel }] }),
  industrial: onBothEars({ calm: true, lineColor: steel, lines: ['M150 238 L164 280'], dots: [{ x: 150, y: 238, r: 3.5, color: steel }, { x: 164, y: 280, r: 3.5, color: steel }] }),
  septum: [{ layer: 'nose', calm: true, lineColor: steel, lines: ['M256 316 C254 334 276 334 274 316'] }],
  browPiercing: [{ layer: 'eyewear', calm: true, thin: true, lineColor: steel, lines: ['M328 236 L334 254'], dots: [{ x: 328, y: 236, r: 3.5, color: steel }, { x: 334, y: 254, r: 3.5, color: steel }] }],
  bridgePiercing: [{ layer: 'eyewear', calm: true, thin: true, lineColor: steel, lines: ['M248 268 L270 268'], dots: [{ x: 248, y: 268, r: 3.5, color: steel }, { x: 270, y: 268, r: 3.5, color: steel }] }],
  lipRing: [{ layer: 'mouthAcc', calm: true, lineColor: steel, lines: ['M282 360 C278 378 298 380 296 362'] }],
  labret: [{ layer: 'mouthAcc', dots: [{ x: 258, y: 380, r: 4, color: steel }] }],
  monroe: [{ layer: 'mouthAcc', dots: [{ x: 230, y: 332, r: 3.5, color: steel }] }],
  // Braces: a steel wire with small brackets across the mouth.
  braces: [{ layer: 'mouthAcc', shapes: [{ d: 'M232 350 C248 362 270 362 286 350 C276 368 242 368 232 350 Z', color: '#fbf8f1', exact: true }], calm: true, lineColor: steel, lines: ['M236 354 C250 358 268 358 282 354'], dots: [242, 252, 262, 272].map((x) => ({ x, y: 356, r: 3.4, color: steel })) }],
  // Backpack straps over both shoulders.
  backpack: [{
    layer: 'bodyOver',
    shapes: twinShapes([{ d: 'M178 436 L198 430 L208 524 L186 524 Z', color: '#5b6b7d' }]),
    lines: twin(['M178 436 L198 430 L208 524', 'M186 524 L178 436']),
    dots: [{ x: 194, y: 482, r: 4 }, { x: 322, y: 482, r: 4 }],
  }],
  // Stethoscope tubes around the neck with the chest piece hanging on the right.
  stethoscope: [{
    layer: 'bodyOver',
    shapes: [{ d: ring(298, 494, 10), color: steel }],
    calm: true,
    lineColor: '#3a3a42',
    lines: ['M214 426 C206 456 214 478 236 486', 'M304 426 C314 452 310 474 298 484', ring(298, 494, 10)],
  }],
  nostril: [{ layer: 'nose', dots: [{ x: 280, y: 308, r: 3.5, color: steel }] }],
  earring: [{ layer: 'lobeLeft', calm: true, lines: ['M166 296 C156 310 172 324 180 308'], dots: [{ x: 168, y: 318, r: 3, color: '#e0b23a' }] }],
  piercing: [{ layer: 'over', calm: true, thin: true, lines: ['M270 306 C276 318 288 316 284 304'] }],
  scar: [{ layer: 'skinDetail', calm: true, thin: true, lines: ['M298 280 L322 330', 'M304 292 L314 288', 'M310 306 L320 302', 'M316 320 L326 316'] }],
  freckles: [{ layer: 'skinDetail', dots: scatter(7, 22, (x, y) => y > 286 && y < 324 && Math.abs(x - 258) > 18 && Math.abs(x - 258) < 70, 2.6, '#b06a46', 0.8) }],
  headphones: [{
    layer: 'over',
    shapes: [
      { d: 'M144 242 C120 40 396 40 372 242 L356 242 C376 66 140 66 160 242 Z', color: '#3a3a42' },
      ...twinShapes([{ d: 'M138 236 C132 236 128 300 138 306 L164 306 L166 236 Z', color: 'headphones' }]),
    ],
    lines: ['M144 242 C120 40 396 40 372 242', ...twin(['M138 236 C132 236 128 300 138 306 L164 306 L166 236 L138 236'])],
  }],
  tattoo: [{ layer: 'bodyOver', calm: true, thin: true, lines: ['M326 446 L336 470 L360 468 L340 482 L348 506 L328 492 L308 506 L316 482 L296 468 L320 470 Z'] }],
  bags: [{ layer: 'skinDetail', calm: true, thin: true, lineColor: '#8a5a48', lines: twin(['M194 292 C206 302 224 302 236 290']) }],
  mask: [{
    layer: 'mouthAcc',
    shapes: [{ d: 'M176 318 C212 308 304 308 340 318 C342 382 300 420 258 420 C216 420 174 382 176 318 Z', color: 'mask' }],
    lines: ['M176 318 C212 308 304 308 340 318 C342 382 300 420 258 420 C216 420 174 382 176 318', 'M176 322 L160 300', 'M340 322 L356 300'],
    scratches: ['M196 344 C236 336 280 336 320 344', 'M200 366 C238 358 278 358 316 366'],
  }],
  wrinkles: [{ layer: 'skinDetail', calm: true, thin: true, lineColor: '#9a6a52', lines: ['M206 206 C236 198 280 198 310 206', 'M216 220 C240 214 276 214 300 220', ...twin(['M180 262 L168 256', 'M180 272 L168 272', 'M238 318 C228 334 226 344 230 354'])] }],
  scarf: [{
    layer: 'bodyOver',
    shapes: [{ d: 'M198 400 C238 432 280 432 320 400 L332 432 C292 470 226 470 186 432 Z', color: 'scarf' }, { d: 'M288 446 L298 524 L330 524 L316 440 Z', color: 'scarf' }],
    blotches: [{ d: 'M200 430 C240 456 280 456 318 430 L324 444 C286 468 230 468 194 444 Z', color: 'scarfDark' }],
    lines: ['M198 400 C238 432 280 432 320 400 L332 432 C292 470 226 470 186 432 L198 400', 'M288 446 L298 524', 'M316 440 L330 524'],
  }],
  tears: [{ layer: 'eyewear', shapes: twinShapes([{ d: 'M226 290 C218 306 220 320 230 320 C240 320 240 306 226 290 Z', color: '#7ab8e8' }]), calm: true, thin: true, lines: twin(['M226 290 C218 306 220 320 230 320 C240 320 240 306 226 290']) }],
  sweat: [{ layer: 'over', shapes: [{ d: 'M344 192 C332 214 334 232 348 232 C362 232 362 214 344 192 Z', color: '#7ab8e8' }], calm: true, thin: true, lines: ['M344 192 C332 214 334 232 348 232 C362 232 362 214 344 192'] }],
  bandaid: [{ layer: 'skinDetail', shapes: [{ d: 'M288 318 L330 300 L338 318 L296 336 Z', color: '#e8c4a0' }], calm: true, thin: true, lines: ['M288 318 L330 300 L338 318 L296 336 L288 318'], dots: [{ x: 306, y: 314, r: 2 }, { x: 316, y: 316, r: 2 }, { x: 312, y: 324, r: 2 }] }],
  clownNose: [{ layer: 'eyewear', shapes: [{ d: 'M244 306 C244 284 282 284 282 306 C282 328 244 328 244 306 Z', color: '#d8383a' }], calm: true, lines: ['M244 306 C244 284 282 284 282 306 C282 328 244 328 244 306'], dots: [{ x: 256, y: 298, r: 4, color: '#f4a3a3' }] }],
  headset: [{
    layer: 'over',
    shapes: [
      { d: 'M144 242 C120 40 396 40 372 242 L356 242 C376 66 140 66 160 242 Z', color: '#34343c' },
      ...twinShapes([{ d: 'M132 230 C122 230 120 310 132 316 L166 316 L168 230 Z', color: 'headset' }]),
    ],
    lines: ['M144 242 C120 40 396 40 372 242', ...twin(['M132 230 C122 230 120 310 132 316 L166 316 L168 230 L132 230']), 'M150 312 C162 352 196 368 232 364'],
    dots: [{ x: 236, y: 364, r: 8, color: '#34343c' }],
  }],
  cyborg: [{
    layer: 'eyewear',
    shapes: [{ d: 'M276 240 L338 232 L348 292 L284 300 Z', color: '#9aa0a8' }],
    lines: ['M276 240 L338 232 L348 292 L284 300 L276 240', 'M338 232 L360 214', 'M348 292 L366 308'],
    dots: [{ x: 304, y: 266, r: 9, color: '#ff3b3b' }, { x: 288, y: 248, r: 3, color: '#1b1b1f' }, { x: 338, y: 284, r: 3, color: '#1b1b1f' }],
  }],
  ninja: [{
    layer: 'mouthAcc',
    shapes: [{ d: 'M164 288 C210 298 306 298 352 288 C354 380 312 434 258 434 C204 434 162 380 164 288 Z', color: '#2b2a30' }],
    lines: ['M164 288 C210 298 306 298 352 288 C354 380 312 434 258 434 C204 434 162 380 164 288'],
    scratches: ['M200 330 C240 322 280 322 318 330'],
  }],
  warpaint: [{ layer: 'skinDetail', shapes: twinShapes([{ d: 'M186 302 L236 296 L234 308 L188 314 Z', color: '#c84b3c', exact: true }, { d: 'M190 320 L230 316 L228 326 L192 330 Z', color: '#c84b3c', exact: true }]) }],
  beautyMark: [{ layer: 'skinDetail', dots: [{ x: 300, y: 336, r: 3.5, color: '#4a2a22' }] }],
  choker: [{ layer: 'bodyOver', shapes: [{ d: 'M214 396 C240 410 280 410 304 396 L304 410 C280 424 240 424 214 410 Z', color: 'choker', exact: true }], dots: [{ x: 258, y: 424, r: 5, color: '#e0b23a' }] }],
  hoops: onBothEars({ calm: true, thin: true, lineColor: '#e0b23a', lines: ['M168 298 C148 308 152 338 170 336 C188 334 186 306 168 298'] }, ['lobeLeft', 'lobeRight']),
  bow: [{ layer: 'over', shapes: [{ d: 'M330 150 L298 126 L300 176 Z', color: 'bow' }, { d: 'M330 150 L362 126 L360 176 Z', color: 'bow' }], lines: ['M330 150 L298 126 L300 176 L330 150 L362 126 L360 176 L330 150'], dots: [{ x: 330, y: 150, r: 8, color: 'bowDark' }] }],
  hairclip: [{ layer: 'over', shapes: [{ d: 'M298 178 L340 166 L344 178 L302 190 Z', color: '#f2cf4a' }], calm: true, lines: ['M298 178 L340 166 L344 178 L302 190 L298 178'] }],
  cape: [{ layer: 'bodyOver', shapes: twinShapes([{ d: 'M200 414 L150 340 L176 410 L120 420 Z', color: 'cape' }]), lines: twin(['M200 414 L150 340 L176 410 L120 420']) }],
  bowtie: [{ layer: 'bodyOver', shapes: [{ d: 'M258 450 L224 432 L224 468 Z', color: 'bowtie' }, { d: 'M258 450 L292 432 L292 468 Z', color: 'bowtie' }], calm: true, lines: ['M258 450 L224 432 L224 468 L258 450 L292 432 L292 468 L258 450'], dots: [{ x: 258, y: 450, r: 7, color: 'bowtieDark' }] }],
  badge: [{
    layer: 'bodyOver',
    shapes: [{ d: 'M238 482 L278 482 L278 522 L238 522 Z', color: '#f4f1ea' }, { d: 'M244 490 L262 490 L262 506 L244 506 Z', color: '#9aa0a8' }],
    calm: true,
    thin: true,
    lines: ['M224 420 L244 482', 'M292 420 L272 482', 'M238 482 L278 482 L278 522 L238 522 L238 482', 'M266 494 L274 494', 'M266 502 L274 502'],
  }],
  pencilEar: [{ layer: 'over', shapes: [{ d: 'M334 214 L346 208 L382 296 L372 302 Z', color: '#f2c53d' }, { d: 'M372 302 L382 296 L384 316 Z', color: '#e8c4a0' }], calm: true, lines: ['M334 214 L346 208 L382 296 L384 316 L372 302 L334 214'], dots: [{ x: 340, y: 211, r: 6, color: '#ef9ac0' }] }],
  flowerEar: [{
    layer: 'over',
    dots: [...[0, 1, 2, 3, 4].map((i) => ({ x: 350 + Math.cos(i * 1.26) * 13, y: 236 + Math.sin(i * 1.26) * 13, r: 10, color: '#f29bc0' })), { x: 350, y: 236, r: 7, color: '#f2cf4a' }],
  }],
  sunglassesHead: [{
    layer: 'over',
    shapes: twinShapes([{ d: 'M188 146 C188 138 240 138 240 146 L240 166 C240 176 188 176 188 166 Z', color: 'ink' }]),
    lines: [...twin(['M188 146 C188 138 240 138 240 146 L240 166 C240 176 188 176 188 166 Z']), 'M240 154 C250 148 266 148 276 154'],
  }],
  earbuds: [{ layer: 'over', dots: [{ x: 172, y: 274, r: 8, color: '#f4f1ea' }, { x: 344, y: 274, r: 8, color: '#f4f1ea' }], calm: true, thin: true, lineColor: '#d9d4c8', lines: ['M172 282 L170 302', 'M344 282 L346 302'] }],
  doubleChin: [{ layer: 'skinDetail', calm: true, thin: true, lineColor: '#9a6a52', lines: ['M222 434 C240 448 276 448 294 434'] }],
  dimples: [{ layer: 'skinDetail', calm: true, thin: true, lineColor: '#9a6a52', lines: twin(['M214 344 C208 352 210 360 216 366']) }],
  cheekbones: [{ layer: 'skinDetail', calm: true, thin: true, lineColor: '#9a6a52', lines: twin(['M186 298 C196 312 212 320 228 322']) }],
  curlers: [{
    layer: 'over',
    shapes: [
      { d: 'M196 132 L232 120 L240 142 L204 154 Z', color: '#f2a7c3' },
      { d: 'M240 112 L278 112 L278 136 L240 136 Z', color: '#9fd0e8' },
      { d: 'M286 120 L322 132 L314 154 L278 142 Z', color: '#f2a7c3' },
    ],
    calm: true,
    lines: ['M196 132 L232 120 L240 142 L204 154 L196 132', 'M240 112 L278 112 L278 136 L240 136 L240 112', 'M286 120 L322 132 L314 154 L278 142 L286 120'],
    scratches: ['M208 128 L216 150', 'M220 124 L228 146', 'M252 112 L252 136', 'M266 112 L266 136', 'M298 124 L290 146', 'M310 128 L302 150'],
  }],
  earmuffs: [{
    layer: 'over',
    shapes: [{ d: 'M150 244 C130 60 386 60 366 244 L354 244 C374 78 142 78 162 244 Z', color: '#9aa0a8' }, ...twinShapes([{ d: 'M134 270 C134 236 180 236 180 270 C180 304 134 304 134 270 Z', color: 'earmuffs' }])],
    lines: ['M150 244 C130 60 386 60 366 244', ...twin(['M134 270 C134 236 180 236 180 270 C180 304 134 304 134 270'])],
    scratches: twin(['M146 258 C152 252 162 254 164 262', 'M146 282 C152 276 164 278 166 286']),
  }],
  tie: [{ layer: 'bodyOver', shapes: [{ d: 'M250 440 L268 440 L274 500 L259 518 L244 500 Z', color: 'tie' }], lines: ['M250 440 L268 440 L274 500 L259 518 L244 500 L250 440', 'M248 432 L270 432 L268 444 L250 444 L248 432'] }],
  sideburns: [{ layer: 'facial', shapes: twinShapes([{ d: 'M168 214 L182 214 L180 284 L168 272 Z', color: 'hair' }]), lines: twin(['M168 214 L182 214 L180 284 L168 272']) }],
  acne: [{ layer: 'skinDetail', dots: scatter(23, 14, (x, y) => (y > 290 && y < 340 && Math.abs(x - 258) > 30 && Math.abs(x - 258) < 76) || (y > 196 && y < 220 && Math.abs(x - 258) < 60), 3.4, '#d4574e', 0.85) }],
  unibrow: [{ layer: 'eyewear', calm: true, lines: ['M232 234 C246 228 270 228 284 234'] }],
  necklace: [{ layer: 'bodyOver', calm: true, thin: true, lineColor: '#b8861f', lines: ['M214 428 C234 476 282 476 304 428'], dots: [{ x: 258, y: 470, r: 6, color: '#e0b23a' }] }],
};

export const catalog = {
  clothes,
  head: headShapes,
  print,
  ears,
  nose,
  pattern,
  hair,
  hat,
  beard,
  moustache,
  eyewear,
  smoke,
  ...Object.fromEntries(Object.entries(detail).map(([name, parts]) => [`detail:${name}`, { none: [], on: parts }])),
};
