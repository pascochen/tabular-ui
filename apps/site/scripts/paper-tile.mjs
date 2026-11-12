/**
 * Writes src/paper/paper-1x.webp and paper-2x.webp, the page's paper
 * (docs/site.md D3, item 4): a seamless tile of ledger bond, baked on the
 * page ground. Three layers, each a change in lightness only: tooth, formation
 * clouds and a wire mesh.
 *
 * The ground is `ledger-50`, read from docs/palette.json, the generated
 * palette: no colour is typed here. Run it when the palette's paper or a value
 * below changes, then run the site's tests, which measure the result:
 *
 *   node apps/site/scripts/paper-tile.mjs
 *
 * It draws in Playwright's Chromium, which the site already has, because the
 * browser encodes WebP and Node does not. The files are lossless, and the
 * script fails if one isn't: at quality 0.95 the encoder softened the tooth
 * and added marks of its own, 70 to 120 isolated dots per 100,000 pixels over
 * 1.05:1, where the lossless tile has none.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { chromium } from '@playwright/test';

/**
 * The owner's setting (2026-11-12), chosen with live sliders on a Retina
 * screen. Strengths are percent of the ground's lightness, either side of it;
 * sizes are CSS pixels. Each strength is half the slider's figure, because the
 * layer was chosen at 50% opacity and the files carry that.
 */
const paper = {
  tooth: 1, // ±%
  toothSize: 2,
  clouds: 0.5, // ±%
  cloudSize: 200,
  mesh: 1, // ±%
  meshPeriod: 3,
  // Not a slider: where tooth and mesh peak together they are held to this, ±%.
  // Unheld they reach 2.5%, and the strongest mark measures 1.055:1 against what
  // surrounds it; held, 1.05:1, the line D3 draws for a mark that reads as dirt.
  limit: 2,
  seed: 1,
};

/**
 * The tile's side in CSS pixels, and `background-size` in index.css.
 * - A whole number of mesh periods (142 × 3). At 1,024, the size it was chosen
 *   at, the period came to 3.003px, and at 1× the mesh drifted from light lines
 *   to dark ones across the tile.
 * - As small as the clouds allow, because a lossless tile of noise costs about
 *   3 bits a pixel: 1,023px came to 455 KB at 1× and 1,448 KB at 2×. Two clouds
 *   fit across this one. At 255px the repeat showed as a grid when the contrast
 *   was multiplied by 8.
 */
const tile = 426;

const root = new URL('../../../', import.meta.url);
const hex = JSON.parse(readFileSync(new URL('docs/palette.json', root), 'utf8')).paper50;
const ground = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
const out = new URL('apps/site/src/paper/', root);

/** Runs in the page. Returns the tile as a lossless WebP data URL, with what it measured. */
async function draw({ paper, tile, scale, ground }) {
  const N = tile * scale;

  // A seeded generator (mulberry32), so the tile is the same on every run.
  let state = paper.seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // A lattice of `cells`, smoothly interpolated to N, wrapping at the edges.
  const interpolate = (lattice, cells) => {
    const field = new Float32Array(N * N);
    const low = new Int32Array(N);
    const high = new Int32Array(N);
    const weight = new Float32Array(N);
    for (let x = 0; x < N; x++) {
      const u = (x * cells) / N;
      const floor = Math.floor(u);
      const t = u - floor;
      low[x] = floor % cells;
      high[x] = (floor + 1) % cells;
      weight[x] = t * t * (3 - 2 * t);
    }
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const top = lattice[low[y] * cells + low[x]] * (1 - weight[x]) + lattice[low[y] * cells + high[x]] * weight[x];
        const bottom =
          lattice[high[y] * cells + low[x]] * (1 - weight[x]) + lattice[high[y] * cells + high[x]] * weight[x];
        field[y * N + x] = top * (1 - weight[y]) + bottom * weight[y];
      }
    }
    return field;
  };
  const noise = (cells) => {
    const count = Math.max(1, Math.min(N, Math.round(cells)));
    return interpolate(Float32Array.from({ length: count * count }, random), count);
  };

  // Blurred white noise, wrapping. It has no lattice to show: plain value noise
  // at this size drew a visible grid when the tile repeated.
  const blurred = (sigma) => {
    const cells = 128;
    const s = Math.max(0.6, sigma / (tile / cells));
    const radius = Math.min(cells >> 1, Math.ceil(s * 3));
    const kernel = Float32Array.from({ length: radius * 2 + 1 }, (_, i) =>
      Math.exp(-((i - radius) ** 2) / (2 * s * s)),
    );
    const total = kernel.reduce((sum, k) => sum + k, 0);
    let from = Float32Array.from({ length: cells * cells }, random);
    let to = new Float32Array(cells * cells);
    for (const horizontal of [true, false]) {
      for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
          let value = 0;
          for (let k = -radius; k <= radius; k++) {
            const xx = horizontal ? (x + k + cells * 4) % cells : x;
            const yy = horizontal ? y : (y + k + cells * 4) % cells;
            value += from[yy * cells + xx] * kernel[k + radius];
          }
          to[y * cells + x] = value / total;
        }
      }
      [from, to] = [to, from];
    }
    return interpolate(from, cells);
  };

  const mix = (a, b, wa, wb) => a.map((value, i) => value * wa + b[i] * wb);

  // Adds a field so that ±percent is two standard deviations, clamped at 1.5×.
  const delta = new Float32Array(N * N);
  const add = (field, percent) => {
    const amplitude = percent / 100;
    const mean = field.reduce((sum, v) => sum + v, 0) / field.length;
    const deviation = Math.sqrt(field.reduce((sum, v) => sum + (v - mean) ** 2, 0) / field.length);
    const gain = amplitude / (2 * deviation);
    const limit = amplitude * 1.5;
    for (let i = 0; i < field.length; i++) delta[i] += Math.max(-limit, Math.min(limit, (field[i] - mean) * gain));
  };

  // Tooth: two lattices at unrelated pitches, so neither shows as a grid.
  const cells = tile / paper.toothSize;
  add(mix(noise(cells), noise(cells * 0.61), 0.65, 0.35), paper.tooth);

  // Wire mesh: a whole number of cycles, so it tiles.
  const cycles = Math.round(tile / paper.meshPeriod);
  const wave = Float32Array.from({ length: N }, (_, x) => Math.cos((2 * Math.PI * x * cycles) / N));
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) delta[y * N + x] += (paper.mesh / 100 / 2) * (wave[x] + wave[y]);
  }
  const limit = paper.limit / 100;
  let held = 0;
  for (let i = 0; i < delta.length; i++) {
    if (Math.abs(delta[i]) > limit) held++;
    delta[i] = Math.max(-limit, Math.min(limit, delta[i]));
  }

  // Formation clouds, in two sizes, added after the limit: they are too broad to read as marks.
  add(mix(blurred(paper.cloudSize / 2.5), blurred(paper.cloudSize / 6), 1, 0.45), paper.clouds);

  // Bake on the ground. Every channel takes the same factor, so the hue holds.
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = N;
  const context = canvas.getContext('2d');
  const image = context.createImageData(N, N);
  let min = 0;
  let max = 0;
  let clipped = 0;
  for (let i = 0; i < delta.length; i++) {
    for (const channel of [0, 1, 2]) image.data[i * 4 + channel] = Math.min(255, ground[channel] * (1 + delta[i]));
    image.data[i * 4 + 3] = 255;
    if (ground[0] * (1 + delta[i]) > 255) clipped++;
    min = Math.min(min, delta[i]);
    max = Math.max(max, delta[i]);
  }
  context.putImageData(image, 0, 0);

  // Quality 1 is lossless in Chromium. Read the file back to be sure of it.
  const url = canvas.toDataURL('image/webp', 1);
  const decoded = new Image();
  decoded.src = url;
  await decoded.decode();
  const check = document.createElement('canvas');
  check.width = check.height = N;
  const checkContext = check.getContext('2d');
  checkContext.drawImage(decoded, 0, 0);
  const read = checkContext.getImageData(0, 0, N, N).data;
  return {
    url,
    lossless: read.every((value, i) => value === image.data[i]),
    darkest: min * 100,
    lightest: max * 100,
    clipped: (clipped * 100) / delta.length,
    held: (held * 100) / delta.length,
  };
}

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const scale of [1, 2]) {
  const result = await page.evaluate(draw, { paper, tile, scale, ground });
  if (!result.lossless) throw new Error(`The ${scale}x tile did not survive encoding: it is not lossless.`);
  const bytes = Buffer.from(result.url.split(',')[1], 'base64');
  const file = new URL(`paper-${scale}x.webp`, out);
  writeFileSync(file, bytes);
  console.log(
    `Wrote ${file.pathname}: ${tile * scale}px, ${Math.round(bytes.length / 1024)} KB, lossless, ` +
      `${result.darkest.toFixed(1)}% to +${result.lightest.toFixed(1)}% around ${hex}, ` +
      `${result.clipped.toFixed(2)}% clipped at white, ${result.held.toFixed(2)}% held at the limit`,
  );
}
await browser.close();
