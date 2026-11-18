// Writes the token layer as the variable set the Figma kit is built from
// (docs/figma-kit.md). Code is the source and Figma follows it: this reads
// theme.css and docs/palette.json, and types no value of its own.
//
//   node packages/ui/scripts/export-figma-tokens.mjs            prints the JSON
//   node packages/ui/scripts/export-figma-tokens.mjs out.json   writes it
//
// It fails on any colour that is not a palette step, or a palette step at an
// alpha, so a hand-typed value in theme.css cannot reach Figma.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const outPath = process.argv[2];

const css = readFileSync(join(root, 'packages/ui/src/styles/theme.css'), 'utf8');
const palette = JSON.parse(readFileSync(join(root, 'docs/palette.json'), 'utf8')).ramps;

/** The body of the block that starts at `marker` and matches `must`. */
function block(marker, must) {
  for (let at = css.indexOf(marker); at >= 0; at = css.indexOf(marker, at + 1)) {
    const open = css.indexOf('{', at);
    let depth = 0;
    for (let i = open; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}' && --depth === 0) {
        const body = css.slice(open + 1, i);
        if (!must || must.test(body)) return body;
        break;
      }
    }
  }
  throw new Error(`block not found: ${marker} with ${must}`);
}

function declarations(body) {
  const out = {};
  const bare = body.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of bare.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) out[m[1]] = m[2].replace(/\s+/g, ' ').trim();
  return out;
}

// 1. Primitives: every ramp step, as the generated hex.
const primitives = {};
for (const [ramp, steps] of Object.entries(palette)) {
  for (const [step, value] of Object.entries(steps)) {
    primitives[`${ramp}/${step}`] = { hex: value.hex, css: `var(--color-${ramp}-${step})` };
  }
}

// 2. Raw mode values. A Figma alias carries no opacity, so each
// `--alpha(step / N%)` becomes its own primitive, `ramp/step-aN`.
const alpha = {};
function reference(value, where) {
  let m = value.match(/^var\(--color-([a-z]+)-(\d+)\)$/);
  if (m) {
    const name = `${m[1]}/${m[2]}`;
    if (!primitives[name]) throw new Error(`${where}: ${value} is not a palette step`);
    return name;
  }
  m = value.match(/^--alpha\(var\(--color-([a-z]+)-(\d+)\) \/ (\d+)%\)$/);
  if (m) {
    const base = `${m[1]}/${m[2]}`;
    if (!primitives[base]) throw new Error(`${where}: ${value} is not a palette step`);
    const name = `${base}-a${m[3]}`;
    alpha[name] = { hex: primitives[base].hex, alpha: Number(m[3]) / 100, of: base };
    return name;
  }
  throw new Error(`${where}: not a palette reference: ${value}`);
}

const modes = {
  light: declarations(block(':root {', /color-scheme:\s*light/)),
  dark: declarations(block("[data-theme='dark'] {", /color-scheme:\s*dark/)),
};
const raw = { light: {}, dark: {} };
for (const [mode, decls] of Object.entries(modes)) {
  for (const [name, value] of Object.entries(decls)) {
    if (name.startsWith('--tui-')) raw[mode][name] = reference(value, `${mode} ${name}`);
  }
}

// 3. Semantic layer: `--color-X: var(--tui-Y)`, named as the CSS names it.
// A neutral with no role keeps its hyphens: color/surface-raised.
const neutral = new Set([
  'canvas',
  'surface',
  'surface-raised',
  'surface-sunken',
  'border',
  'border-strong',
  'border-control',
  'ring',
]);
function figmaColorName(rest) {
  if (neutral.has(rest)) return `color/${rest}`;
  const i = rest.indexOf('-');
  return `color/${rest.slice(0, i)}/${rest.slice(i + 1)}`;
}
const semantic = [];
for (const [name, value] of Object.entries(declarations(block('@theme inline static {')))) {
  if (!name.startsWith('--color-')) continue; // --shadow-overlay is the effect style
  const m = value.match(/^var\((--tui-[a-z0-9-]+)\)$/);
  if (!m) throw new Error(`${name}: expected var(--tui-*), got ${value}`);
  const dark = raw.dark[m[1]];
  const light = raw.light[m[1]];
  if (!dark || !light) throw new Error(`${name}: ${m[1]} is missing a mode`);
  semantic.push({ name: figmaColorName(name.slice('--color-'.length)), css: `var(${name})`, dark, light });
}

// 4. Numbers: every non-colour token. A height is the px inside its max().
const staticTokens = declarations(block('@theme static {', /--spacing:/));
const numbers = [];
for (const [name, value] of Object.entries(staticTokens)) {
  if (!/^--(radius|h|size-icon|border-width|ring|pad|gap|w)(-|$)/.test(name)) continue;
  if (value === 'initial') continue;
  const m = value.match(/^(\d+(?:\.\d+)?)px$/) || value.match(/^max\((\d+(?:\.\d+)?)px,/);
  if (!m) throw new Error(`${name}: no px value in ${value}`);
  const bare = name.slice(2);
  const i = bare.indexOf('-');
  numbers.push({
    name: i < 0 ? bare : `${bare.slice(0, i)}/${bare.slice(i + 1)}`,
    css: `var(${name})`,
    value: Number(m[1]),
    ...(value.startsWith('max') ? { formula: value } : {}),
  });
}

// 5. The type scale, in px on a 16px root, for the text styles.
const type = {};
for (const [name, value] of Object.entries(staticTokens)) {
  const m = name.match(/^--text-([a-z0-9-]+?)(--line-height)?$/);
  if (!m) continue;
  const rem = value.match(/^(-?\d*\.?\d+)rem$/);
  if (!rem) throw new Error(`${name}: not rem: ${value}`);
  (type[m[1]] ||= {})[m[2] ? 'line' : 'size'] = Number(rem[1]) * 16;
}
const tracking = {};
for (const [name, value] of Object.entries(staticTokens)) {
  if (name.startsWith('--tracking-'))
    tracking[name.slice('--tracking-'.length)] = Number(value.replace('em', '')) * 100;
}

const out = {
  generatedFrom: ['packages/ui/src/styles/theme.css', 'docs/palette.json'],
  counts: {
    primitives: Object.keys(primitives).length,
    alpha: Object.keys(alpha).length,
    semantic: semantic.length,
    numbers: numbers.length,
  },
  primitives,
  alpha,
  semantic,
  numbers,
  type,
  tracking,
};

const json = JSON.stringify(out, null, 2);
if (outPath) {
  writeFileSync(outPath, json + '\n');
  console.error(JSON.stringify(out.counts));
} else {
  console.log(json);
}
