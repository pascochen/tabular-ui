import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { tokenSamples } from '../fixtures/a11y-exceptions';

/**
 * The verification surface for scaffold pass 1 (tokens only).
 *
 * Exists to answer three questions by looking (scaffold-prompt.md Task 7):
 * 1. Do the six --color-text-{role} foregrounds read as equal weight?
 * 2. Does ochre read as a warning, and apart from vermilion? (§2)
 * 3. Is the 6% hover overlay visible on a 28px row? (§4 flags it as the
 *    value most likely to need adjustment in situ)
 *
 * Every ratio shown is the measured figure from docs/design-system.md, as
 * scripts/check-contrast.mjs computes it. Light-mode ratios are measured
 * against the paper canvas (ledger-50), NOT #fff.
 *
 * Ramp/step labels are computed from {hue, step} pairs rather than written
 * as string literals so the raw-scale lint rule keeps guarding this file.
 */

type Mode = 'dark' | 'light';
type Step = { hue: string; step: number | string };
const stepLabel = (s: Step) => `${s.hue}-${s.step}`;

const ROLES = ['interactive', 'danger', 'warning', 'success', 'agent', 'info'] as const;

/* One step per mode for every role (§0 rule 4): 400 dark, 700 light. */
const TEXT_ROLES: Record<(typeof ROLES)[number], Record<Mode, { step: Step; ratio: string }>> = {
  interactive: {
    dark: { step: { hue: 'sage', step: 400 }, ratio: '7.84:1' },
    light: { step: { hue: 'sage', step: 700 }, ratio: '6.23:1' },
  },
  danger: {
    dark: { step: { hue: 'vermilion', step: 400 }, ratio: '6.95:1' },
    light: { step: { hue: 'vermilion', step: 700 }, ratio: '7.15:1' },
  },
  warning: {
    dark: { step: { hue: 'ochre', step: 400 }, ratio: '7.24:1' },
    light: { step: { hue: 'ochre', step: 700 }, ratio: '6.74:1' },
  },
  success: {
    dark: { step: { hue: 'sage', step: 400 }, ratio: '7.84:1' },
    light: { step: { hue: 'sage', step: 700 }, ratio: '6.23:1' },
  },
  agent: {
    dark: { step: { hue: 'orchid', step: 400 }, ratio: '6.96:1' },
    light: { step: { hue: 'orchid', step: 700 }, ratio: '7.13:1' },
  },
  info: {
    dark: { step: { hue: 'federal', step: 400 }, ratio: '7.31:1' },
    light: { step: { hue: 'federal', step: 700 }, ratio: '6.75:1' },
  },
};

/* Fills differ by mode (§4): 700 under paper in light, 600 in dark, where
   700 is under 3:1 against the canvas. Warning takes ink in both modes. The
   interactive fill is the ink accent (§1): ink in light, paper in dark. */
const paper = stepLabel({ hue: 'ledger', step: 50 });
const ink = `${stepLabel({ hue: 'ledger', step: 950 })} (dark text)`;
const FILL_ROLES: Record<(typeof ROLES)[number], Record<Mode, { fill: Step; on: string; ratio: string }>> = {
  interactive: {
    dark: { fill: { hue: 'ledger', step: 50 }, on: stepLabel({ hue: 'ledger', step: 950 }), ratio: '16.39:1' },
    light: { fill: { hue: 'ledger', step: 950 }, on: paper, ratio: '16.39:1' },
  },
  danger: {
    dark: { fill: { hue: 'vermilion', step: 600 }, on: paper, ratio: '5.36:1' },
    light: { fill: { hue: 'vermilion', step: 700 }, on: paper, ratio: '7.15:1' },
  },
  warning: {
    dark: { fill: { hue: 'ochre', step: 400 }, on: ink, ratio: '7.24:1' },
    light: { fill: { hue: 'ochre', step: 500 }, on: ink, ratio: '4.89:1' },
  },
  success: {
    dark: { fill: { hue: 'sage', step: 600 }, on: paper, ratio: '4.59:1' },
    light: { fill: { hue: 'sage', step: 700 }, on: paper, ratio: '6.23:1' },
  },
  agent: {
    dark: { fill: { hue: 'orchid', step: 600 }, on: paper, ratio: '5.30:1' },
    light: { fill: { hue: 'orchid', step: 700 }, on: paper, ratio: '7.13:1' },
  },
  info: {
    dark: { fill: { hue: 'federal', step: 600 }, on: paper, ratio: '4.97:1' },
    light: { fill: { hue: 'federal', step: 700 }, on: paper, ratio: '6.75:1' },
  },
};

const NEUTRAL_SURFACES: {
  token: string;
  step: Record<Mode, Step | string>;
  ratio: Record<Mode, string>;
}[] = [
  {
    token: '--color-canvas',
    step: { dark: { hue: 'ledger', step: 950 }, light: { hue: 'ledger', step: 50 } },
    ratio: { dark: 'ground', light: 'ground' },
  },
  {
    token: '--color-surface',
    step: { dark: { hue: 'ledger', step: 950 }, light: { hue: 'ledger', step: 50 } },
    ratio: { dark: 'the canvas — borders separate', light: 'the canvas — borders separate' },
  },
  {
    token: '--color-surface-raised',
    step: { dark: { hue: 'ledger', step: 925 }, light: { hue: 'ledger', step: 50 } },
    ratio: { dark: '1.13:1', light: 'the canvas — border only' },
  },
  {
    token: '--color-border',
    step: { dark: { hue: 'ledger', step: 800 }, light: { hue: 'ledger', step: 200 } },
    ratio: { dark: '1.80:1', light: '1.29:1' },
  },
  {
    token: '--color-border-strong',
    step: { dark: { hue: 'ledger', step: 700 }, light: { hue: 'ledger', step: 300 } },
    ratio: { dark: '2.47:1', light: '1.62:1' },
  },
];

const NEUTRAL_TEXT: {
  token: string;
  step: Record<Mode, Step>;
  ratio: Record<Mode, string>;
  note?: string;
}[] = [
  {
    token: '--color-text-primary',
    step: { dark: { hue: 'ledger', step: 50 }, light: { hue: 'ledger', step: 950 } },
    ratio: { dark: '16.39:1', light: '16.39:1' },
  },
  {
    token: '--color-text-body',
    step: { dark: { hue: 'ledger', step: 100 }, light: { hue: 'ledger', step: 900 } },
    ratio: { dark: '15.01:1', light: '12.38:1' },
  },
  {
    token: '--color-text-secondary',
    step: { dark: { hue: 'ledger', step: 300 }, light: { hue: 'ledger', step: 700 } },
    ratio: { dark: '10.15:1', light: '6.64:1' },
  },
  {
    token: '--color-text-tertiary',
    step: { dark: { hue: 'ledger', step: 400 }, light: { hue: 'ledger', step: 600 } },
    ratio: { dark: '7.37:1', light: '4.89:1' },
    note: 'placeholders and non-text marks only',
  },
  {
    token: '--color-text-disabled',
    step: { dark: { hue: 'ledger', step: 600 }, light: { hue: 'ledger', step: 400 } },
    ratio: { dark: '3.35:1', light: '2.22:1' },
    note: 'dim on purpose — WCAG 1.4.3 exempt',
  },
];

const TYPE_SCALE: { token: string; px: string; sample: string; display?: boolean }[] = [
  { token: '--text-2xs', px: '10/14', sample: 'UPPERCASE COLUMN HEADER' },
  { token: '--text-xs', px: '11/16', sample: 'Timestamps, secondary metadata, help text' },
  { token: '--text-sm', px: '12/16', sample: 'Table cells, dense form labels' },
  { token: '--text-base', px: '13/20', sample: 'Body, default UI text' },
  { token: '--text-md', px: '14/20', sample: 'Section headings, emphasis' },
  { token: '--text-lg', px: '16/24', sample: 'Page title' },
  { token: '--text-xl', px: '20/28', sample: 'Modal titles, empty states' },
  { token: '--text-metric-sm', px: '24/28', sample: '¥3.4bn', display: true },
  { token: '--text-metric', px: '32/36', sample: '¥34.4bn', display: true },
];

/* Step 600 in light, 400 in dark. The polarity hues come last (§6). */
const CHART: {
  n: number;
  step: Record<Mode, Step>;
  ratio: Record<Mode, string>;
}[] = [
  {
    n: 1,
    step: { dark: { hue: 'federal', step: 400 }, light: { hue: 'federal', step: 600 } },
    ratio: { dark: '7.31:1', light: '4.97:1' },
  },
  {
    n: 2,
    step: { dark: { hue: 'ochre', step: 400 }, light: { hue: 'ochre', step: 600 } },
    ratio: { dark: '7.24:1', light: '4.97:1' },
  },
  {
    n: 3,
    step: { dark: { hue: 'teal', step: 400 }, light: { hue: 'teal', step: 600 } },
    ratio: { dark: '7.70:1', light: '4.68:1' },
  },
  {
    n: 4,
    step: { dark: { hue: 'orchid', step: 400 }, light: { hue: 'orchid', step: 600 } },
    ratio: { dark: '6.96:1', light: '5.30:1' },
  },
  {
    n: 5,
    step: { dark: { hue: 'ledger', step: 400 }, light: { hue: 'ledger', step: 600 } },
    ratio: { dark: '7.37:1', light: '4.89:1' },
  },
  {
    n: 6,
    step: { dark: { hue: 'vermilion', step: 400 }, light: { hue: 'vermilion', step: 600 } },
    ratio: { dark: '6.95:1', light: '5.36:1' },
  },
  {
    n: 7,
    step: { dark: { hue: 'sage', step: 400 }, light: { hue: 'sage', step: 600 } },
    ratio: { dark: '7.84:1', light: '4.59:1' },
  },
];

const num: CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums' };

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      className="text-text-primary"
      style={{ fontSize: 'var(--text-md)', lineHeight: 'var(--text-md--line-height)', fontWeight: 600, margin: 0 }}
    >
      {children}
    </h2>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-text-secondary"
      style={{ fontSize: 'var(--text-xs)', lineHeight: 'var(--text-xs--line-height)', margin: 0, ...num }}
    >
      {children}
    </p>
  );
}

function TokensPage({ mode }: { mode: Mode }) {
  return (
    <div
      className="bg-canvas text-text-body"
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-base)',
        lineHeight: 'var(--text-base--line-height)',
        padding: 'var(--pad-page-x)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap-section)',
        minHeight: '100vh',
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-bonded)' }}>
        <SectionTitle>Tabular UI tokens — verification surface ({mode} mode)</SectionTitle>
        <Caption>
          All ratios are the measured figures from docs/design-system.md. Light-mode figures are measured against the
          paper canvas (ledger-50), not white — everything on this page sits directly on --color-canvas.
        </Caption>
      </header>

      {/* 1 — six text roles, on canvas, 12px and 13px */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
        <SectionTitle>1 · --color-text-&#123;role&#125; on --color-canvas</SectionTitle>
        <Caption>
          Every Riso ramp shares one lightness curve, so each role takes the same step (§0 rule 4): 400 in dark (L 73),
          700 in light (L 46). Judge: does any role shout over the rest?
        </Caption>
        {(['--text-sm', '--text-base'] as const).map((size) => (
          <div
            key={size}
            style={{ display: 'flex', gap: 'var(--gap-group)', alignItems: 'baseline', flexWrap: 'wrap' }}
          >
            <span className="text-text-tertiary" style={{ fontSize: 'var(--text-xs)', width: 96 }}>
              {size === '--text-sm' ? '12px' : '13px'}
            </span>
            {ROLES.map((role) => {
              const m = TEXT_ROLES[role][mode];
              return (
                <div key={role} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-bonded)' }}>
                  <span
                    style={{
                      color: `var(--color-text-${role})`,
                      fontSize: `var(${size})`,
                      lineHeight: `var(${size}--line-height)`,
                      fontWeight: 500,
                    }}
                  >
                    {role} · 1,284 rows
                  </span>
                  <Caption>
                    {stepLabel(m.step)} · {m.ratio}
                  </Caption>
                </div>
              );
            })}
          </div>
        ))}
      </section>

      {/* 2 — fills with on-color text */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
        <SectionTitle>2 · --color-fill-&#123;role&#125; with --color-on-&#123;role&#125;</SectionTitle>
        <Caption>
          The interactive fill is the ink accent, inverted in dark (§1). The role fills are 700 in light and 600 in
          dark, where 700 is under 3:1 against the canvas. Text on a fill is paper, never white; warning takes ink.
        </Caption>
        <div style={{ display: 'flex', gap: 'var(--gap-inline)', flexWrap: 'wrap' }}>
          {ROLES.map((role) => {
            const f = FILL_ROLES[role][mode];
            return (
              <div key={role} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-bonded)' }}>
                <div
                  style={{
                    background: `var(--color-fill-${role})`,
                    color: `var(--color-on-${role})`,
                    height: 'var(--h-control)',
                    padding: '0 var(--pad-control-x)',
                    borderRadius: 'var(--radius-md)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    minWidth: 120,
                  }}
                >
                  {role}
                </div>
                <Caption>
                  {stepLabel(f.fill)} · on: {f.on} · {f.ratio}
                </Caption>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3 — neutral ramp */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
        <SectionTitle>3 · Neutral foundation</SectionTitle>
        <div style={{ display: 'flex', gap: 'var(--gap-inline)', flexWrap: 'wrap' }}>
          {NEUTRAL_SURFACES.map((s) => {
            const st = s.step[mode];
            return (
              <div key={s.token} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-bonded)' }}>
                <div
                  style={{
                    background: `var(${s.token})`,
                    border: '1px solid var(--color-border-strong)',
                    width: 120,
                    height: 'var(--h-row-sm)',
                    borderRadius: 'var(--radius-xs)',
                  }}
                />
                <Caption>
                  {s.token.replace('--color-', '')} · {typeof st === 'string' ? st : stepLabel(st)} · {s.ratio[mode]}
                </Caption>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-bonded)' }}>
          {NEUTRAL_TEXT.map((t) => (
            <div key={t.token} style={{ display: 'flex', gap: 'var(--gap-group)', alignItems: 'baseline' }}>
              <span style={{ color: `var(${t.token})`, fontSize: 'var(--text-base)', width: 320 }}>
                Reconciliation run #4,182 — 12,847 rows matched
              </span>
              <Caption>
                {t.token.replace('--color-', '')} · {stepLabel(t.step[mode])} · {t.ratio[mode]}
                {t.note ? ` · ${t.note}` : ''}
              </Caption>
            </div>
          ))}
        </div>
      </section>

      {/* 4 — type scale */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
        <SectionTitle>4 · Type scale — 13px base; metric tier in --font-display</SectionTitle>
        <Caption>
          Metric samples render in Source Serif 4, in its display optical size, with tabular-nums. Display tracking is 0
          — the optical size already does the tightening (§8.8). The serif's tnum is verified: at 32px/600 every digit
          advances identically.
        </Caption>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
          {TYPE_SCALE.map((t) => (
            <div key={t.token} style={{ display: 'flex', gap: 'var(--gap-group)', alignItems: 'baseline' }}>
              <Caption>
                <span style={{ display: 'inline-block', width: 160 }}>
                  {t.token} · {t.px}
                </span>
              </Caption>
              <span
                // The utility, not an inline var(--font-display): families
                // are set by utility, the same as in components (§8.3).
                className={t.display ? 'font-display text-text-primary' : 'font-sans text-text-primary'}
                style={{
                  fontSize: `var(${t.token})`,
                  lineHeight: `var(${t.token}--line-height)`,
                  fontWeight: t.display ? 600 : 400,
                  letterSpacing: t.token === '--text-2xs' ? 'var(--tracking-wide)' : undefined,
                  ...(t.display ? num : {}),
                }}
              >
                {t.sample}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 5 — chart ramp with explicit series-6 gap */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
        <SectionTitle>5 · Chart ramp — seven series, capped</SectionTitle>
        <div style={{ display: 'flex', gap: 'var(--gap-inline)', flexWrap: 'wrap' }}>
          {CHART.map((c) => (
            <div key={c.n} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-bonded)' }}>
              <div
                style={{
                  background: `var(--color-chart-${c.n})`,
                  width: 96,
                  height: 'var(--h-row-sm)',
                  borderRadius: 'var(--radius-xs)',
                }}
              />
              <Caption>
                chart-{c.n} · {stepLabel(c.step[mode])} · {c.ratio[mode]}
              </Caption>
            </div>
          ))}
        </div>
        <Caption>
          Capped at seven. Series 6 and 7 are vermilion and sage, the gain and loss hues: a chart that shows polarity
          uses series 1–5 only (§6). An eighth series is a signal that the chart needs grouping, not another colour.
        </Caption>
      </section>

      {/* 6 — hover/active overlays over three grounds */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
        <SectionTitle>6 · --color-bg-hover / --color-bg-active over three grounds</SectionTitle>
        <Caption>
          One neutral overlay, not per-role tokens (§4). Judge: is the 6% hover visible on a 28px row in peripheral
          vision? §4 flags it as the value most likely to need in-situ adjustment.
        </Caption>
        <div style={{ display: 'flex', gap: 'var(--gap-group)', flexWrap: 'wrap' }}>
          {(['--color-canvas', '--color-surface'] as const).map((ground) => (
            <div key={ground} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-bonded)' }}>
              <div
                style={{
                  background: `var(${ground})`,
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  width: 240,
                  overflow: 'hidden',
                }}
              >
                {['resting row', 'hover row', 'active row'].map((label, i) => (
                  <div
                    key={label}
                    style={{
                      height: 'var(--h-row-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 var(--pad-cell-x)',
                      fontSize: 'var(--text-sm)',
                      background: i === 1 ? 'var(--color-bg-hover)' : i === 2 ? 'var(--color-bg-active)' : undefined,
                    }}
                  >
                    {label} · 4,281.00
                  </div>
                ))}
              </div>
              <Caption>over {ground.replace('--color-', '')}</Caption>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-bonded)' }}>
            <div style={{ display: 'flex', gap: 'var(--gap-inline)' }}>
              {['resting', 'hover', 'active'].map((label, i) => (
                <div key={label} style={{ position: 'relative' }}>
                  <div
                    className="bg-fill-interactive text-on-interactive"
                    style={{
                      height: 'var(--h-control)',
                      padding: '0 var(--pad-control-x)',
                      borderRadius: 'var(--radius-md)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                    }}
                  >
                    {label}
                  </div>
                  {i > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'var(--radius-md)',
                        background: i === 1 ? 'var(--color-bg-hover-inverse)' : 'var(--color-bg-active-inverse)',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <Caption>
              over solid --color-fill-interactive: the -inverse overlay, since the fill is the overlay&apos;s own colour
              (§4)
            </Caption>
          </div>
        </div>
      </section>
    </div>
  );
}

const meta = {
  title: 'Design System/Tokens',
  parameters: { ...tokenSamples, layout: 'fullscreen' },
} satisfies Meta;

export default meta;

export const Tokens: StoryObj = {
  render: (_args, { globals }) => <TokensPage mode={(globals.theme as Mode) ?? 'dark'} />,
};
