/**
 * The token parser, kept free of Vite so the tests can run it on the same files
 * (tests/tokens.spec.ts). src/tokens.ts feeds it theme.css and palette.json.
 */
export type Palette = { ramps: Record<string, Record<string, { oklch: string; hex: string }>> };

export type RampStep = { ramp: string; step: string; hex: string; oklch: string; alpha?: string };

export function makeTokens(themeCss: string, palette: Palette) {
  // ---------------------------------------------------------------------------
  // Parsing theme.css
  // ---------------------------------------------------------------------------

  /** The body of the first rule whose selector line matches, braces balanced. */
  function block(css: string, selector: RegExp, mustContain?: string): string {
    const re = new RegExp(selector.source, 'gm');
    for (let match = re.exec(css); match; match = re.exec(css)) {
      const open = css.indexOf('{', match.index);
      let depth = 0;
      for (let i = open; i < css.length; i++) {
        if (css[i] === '{') depth++;
        else if (css[i] === '}' && --depth === 0) {
          const body = css.slice(open + 1, i);
          if (!mustContain || body.includes(mustContain)) return body;
          break;
        }
      }
    }
    throw new Error(`theme.css has no rule matching ${selector} ${mustContain ?? ''}`);
  }

  type Declaration = { value: string; note?: string };

  /** Custom property declarations, each with the comment that follows it on its line. */
  function declarations(body: string): Map<string, Declaration> {
    const found = new Map<string, Declaration>();
    const re = /(--[\w-]+):\s*([^;]+);[ \t]*(?:\/\*\s*(.*?)\s*(\*\/|$))?/gm;
    for (let m = re.exec(body); m; m = re.exec(body)) {
      // A comment that runs on to the next line is cut to its first complete clause,
      // so a note never ends mid-sentence ("… inside a control — must exceed").
      const note = m[4] === '*/' ? m[3] : m[3]?.split(' — ')[0];
      found.set(m[1], { value: m[2].trim(), note: note?.trim() || undefined });
    }
    return found;
  }

  const lightTokens = declarations(block(themeCss, /^:root\s*\{/, '--tui-canvas'));
  const darkTokens = declarations(block(themeCss, /^\[data-theme='dark'\]\s*\{/));
  // The scales live in `@theme` and `@theme static` blocks; `@theme inline` only re-points colours.
  const themeTokens = new Map([
    ...declarations(block(themeCss, /^@theme(?:\s+static)?\s*\{/, '--pad-cell-x')),
    ...declarations(block(themeCss, /^@theme(?:\s+static)?\s*\{/, '--text-2xs')),
  ]);

  // ---------------------------------------------------------------------------
  // The palette
  // ---------------------------------------------------------------------------

  const ramps = palette.ramps;

  /** `var(--color-sage-700)` or `--alpha(var(--color-sage-500) / 8%)` → the step it names. */
  function resolve(value: string): RampStep {
    const m = value.match(/var\(--color-([a-z]+)-(\d+)\)(?:\s*\/\s*(\d+%))?/);
    if (!m) throw new Error(`Not a palette reference: ${value}`);
    const [, ramp, step, alpha] = m;
    const entry = ramps[ramp]?.[step];
    if (!entry) throw new Error(`docs/palette.json has no ${ramp}-${step}`);
    return { ramp, step, hex: entry.hex, oklch: entry.oklch, alpha };
  }

  function tokenStep(name: string, mode: 'light' | 'dark'): RampStep {
    const decl = (mode === 'light' ? lightTokens : darkTokens).get(`--tui-${name}`);
    if (!decl) throw new Error(`theme.css declares no --tui-${name} in ${mode} mode`);
    return resolve(decl.value);
  }

  /** The step's name as the spec writes it: `sage-700`, or `sage-500 / 8%` for a tint. */
  function stepLabel(s: RampStep): string {
    return `${s.ramp}-${s.step}${s.alpha ? ` / ${s.alpha}` : ''}`;
  }

  // ---------------------------------------------------------------------------
  // Contrast (WCAG 2), measured on the canvas of each mode
  // ---------------------------------------------------------------------------

  function luminance(hex: string): number {
    const channel = (i: number) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  }

  function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }

  /** Contrast of an opaque step on the canvas of its mode, as `6.23:1`. */
  function onCanvas(s: RampStep, mode: 'light' | 'dark'): string {
    return `${contrast(s.hex, tokenStep('canvas', mode).hex).toFixed(2)}:1`;
  }

  // ---------------------------------------------------------------------------
  // What the pages list
  // ---------------------------------------------------------------------------

  const roles = ['interactive', 'danger', 'warning', 'success', 'agent', 'info'] as const;

  const rampNames = Object.keys(ramps);
  const rampSteps = (ramp: string) =>
    Object.entries(ramps[ramp])
      .map(([step, value]) => ({ step, ...value }))
      .sort((a, b) => Number(a.step) - Number(b.step));

  /** A token from theme.css's @theme block, with its value and its own comment. */
  function themeToken(name: string): Declaration & { name: string } {
    const decl = themeTokens.get(name);
    if (!decl) throw new Error(`theme.css's @theme declares no ${name}`);
    return { name, ...decl };
  }

  /** Every @theme token whose name starts with the prefix, in source order. */
  function themeTokensWith(prefix: string): (Declaration & { name: string })[] {
    return [...themeTokens.entries()]
      .filter(([name, decl]) => name.startsWith(prefix) && decl.value !== 'initial')
      .map(([name, decl]) => ({ name, ...decl }));
  }

  /** `0.8125rem` → 13, `32px` → 32. */
  function px(value: string): number {
    const m = value.match(/^([\d.]+)(px|rem)$/);
    if (!m) throw new Error(`Not a length: ${value}`);
    return m[2] === 'rem' ? Number(m[1]) * 16 : Number(m[1]);
  }

  return {
    tokenStep,
    stepLabel,
    contrast,
    onCanvas,
    roles,
    rampNames,
    rampSteps,
    themeToken,
    themeTokensWith,
    px,
  };
}
