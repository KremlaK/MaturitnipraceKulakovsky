// Vystřižení auta z fotky: model ISNet (stejný jako v Pythonu v knihovně rembg) běží přímo
// v Node.js přes onnxruntime. Výsledek je PNG s průhledným pozadím oříznuté na auto.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ort = require('onnxruntime-node');

const MODEL = path.join(__dirname, '..', 'models', 'isnet-general-use.onnx');
const SIZE = 1024; // vstup modelu
const MAX_SIDE = 1600; // větší fotky zmenšíme – víc rozlišení garáž nepotřebuje
const MEAN = [0.485, 0.456, 0.406];

let sessionPromise = null;
let queue = Promise.resolve();

function isAvailable() {
  return fs.existsSync(MODEL);
}

function getSession() {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(MODEL, { intraOpNumThreads: 2 }).catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }
  return sessionPromise;
}

async function cutoutNow(input) {
  // .rotate() bez parametru otočí fotku podle EXIF (fotky z mobilu)
  const { data: rgb, info } = await sharp(input, { limitInputPixels: 50e6 })
    .rotate()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;

  // vstup modelu: 1024×1024, hodnoty 0–1 mínus průměr (stejně jako rembg)
  const small = await sharp(rgb, { raw: { width: W, height: H, channels: 3 } })
    .resize(SIZE, SIZE, { fit: 'fill', kernel: 'lanczos3' })
    .raw()
    .toBuffer();
  let max = 1;
  for (const v of small) if (v > max) max = v;
  const plane = SIZE * SIZE;
  const tensor = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    for (let c = 0; c < 3; c++) tensor[c * plane + i] = small[i * 3 + c] / max - MEAN[c];
  }

  const session = await getSession();
  const output = await session.run({ [session.inputNames[0]]: new ort.Tensor('float32', tensor, [1, 3, SIZE, SIZE]) });
  const pred = output[session.outputNames[0]].data;

  // maska 0–255 v rozlišení modelu, pak zpět na velikost fotky
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < plane; i++) {
    if (pred[i] < lo) lo = pred[i];
    if (pred[i] > hi) hi = pred[i];
  }
  const range = hi - lo || 1;
  const mask = Buffer.alloc(plane);
  for (let i = 0; i < plane; i++) mask[i] = Math.round(((pred[i] - lo) / range) * 255);
  // extractChannel(0): sharp by jinak z jednokanálové masky udělal tři kanály a maska by se posunula
  const alpha = await sharp(mask, { raw: { width: SIZE, height: SIZE, channels: 1 } })
    .resize(W, H, { fit: 'fill' })
    .extractChannel(0)
    .raw()
    .toBuffer();

  keepLargestComponent(alpha, W, H);

  let covered = 0;
  for (let i = 0; i < alpha.length; i++) {
    if (alpha[i] < 16) alpha[i] = 0; // slabý šum kolem auta pryč
    else if (alpha[i] > 128) covered++;
  }
  const share = covered / alpha.length;
  if (share < 0.03 || share > 0.97) {
    throw new CutoutError('Na fotce se nepodařilo najít auto. Zkus fotku, kde je auto celé a výrazné.');
  }

  const rgba = await sharp(rgb, { raw: { width: W, height: H, channels: 3 } })
    .joinChannel(alpha, { raw: { width: W, height: H, channels: 1 } })
    .png()
    .toBuffer();
  // oříznout průhledné okraje, ať auto v garáži sedí přesně na podlaze; WebP s průhledností je
  // proti PNG zhruba desetkrát menší
  return sharp(rgba).trim({ threshold: 1 }).webp({ quality: 86, alphaQuality: 90 }).toBuffer();
}

class CutoutError extends Error {}

/** Ponechá v masce jen největší souvislý objekt (auto); samostatné věci kolem (patníky, lidi) zmizí. */
function keepLargestComponent(alpha, W, H, threshold = 64) {
  const labels = new Int32Array(W * H);
  const stack = new Int32Array(W * H);
  let best = 0;
  let bestSize = 0;
  let label = 0;
  for (let start = 0; start < alpha.length; start++) {
    if (alpha[start] < threshold || labels[start]) continue;
    label++;
    let size = 0;
    let top = 0;
    stack[top++] = start;
    labels[start] = label;
    while (top) {
      const i = stack[--top];
      size++;
      const x = i % W;
      const neighbours = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W];
      for (const n of neighbours) {
        if (n >= 0 && n < alpha.length && !labels[n] && alpha[n] >= threshold) {
          labels[n] = label;
          stack[top++] = n;
        }
      }
    }
    if (size > bestSize) {
      bestSize = size;
      best = label;
    }
  }
  // Oblast auta rozšířená o pár pixelů: jemné okraje u auta zůstanou, slabé zbytky dál od něj zmizí
  const R = 6;
  const near = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    let last = -Infinity;
    for (let x = 0; x < W; x++) {
      if (labels[y * W + x] === best) last = x;
      if (x - last <= R) near[y * W + x] = 1;
    }
    last = Infinity;
    for (let x = W - 1; x >= 0; x--) {
      if (labels[y * W + x] === best) last = x;
      if (last - x <= R) near[y * W + x] = 1;
    }
  }
  const nearV = new Uint8Array(W * H);
  for (let x = 0; x < W; x++) {
    let last = -Infinity;
    for (let y = 0; y < H; y++) {
      if (near[y * W + x]) last = y;
      if (y - last <= R) nearV[y * W + x] = 1;
    }
    last = Infinity;
    for (let y = H - 1; y >= 0; y--) {
      if (near[y * W + x]) last = y;
      if (last - y <= R) nearV[y * W + x] = 1;
    }
  }
  for (let i = 0; i < alpha.length; i++) {
    if (!nearV[i] || (labels[i] && labels[i] !== best)) alpha[i] = 0;
  }
}

/** Vystřihne auto z fotky (Buffer) → WebP Buffer s průhledným pozadím. Zpracovává se vždy jen jedna fotka najednou. */
function removeBackground(input) {
  const run = queue.then(() => cutoutNow(input));
  queue = run.catch(() => undefined);
  return run;
}

module.exports = { removeBackground, isAvailable, CutoutError };
