import { FoundationsHeader, ModePair, TokenLabel } from '../components/foundations';
import { Rail, Section, SectionHeader } from '../components/layout';
import { pages } from '../content';
import { cn } from '../lib/cn';
import { contrast, onCanvas, rampNames, rampSteps, type Role, roles, stepLabel, tokenStep } from '../tokens';
import type { Route } from './+types/color';

export const meta: Route.MetaFunction = () => [
  { title: 'Color · Tabular UI' },
  {
    name: 'description',
    content:
      'Five hues and a neutral, each named by the state it marks, in both modes, with every ratio measured on its ground.',
  },
];

/**
 * Every swatch paints the real token's utility, so the page shows what the
 * token resolves to, not a copied value. Written out in full because Tailwind
 * only generates classes it finds in the source.
 */
const roleClasses: Record<Role, { text: string; fill: string; tint: string }> = {
  interactive: {
    text: 'text-text-interactive',
    fill: 'bg-fill-interactive text-on-interactive',
    tint: 'bg-bg-interactive border-border-interactive text-text-interactive',
  },
  danger: {
    text: 'text-text-danger',
    fill: 'bg-fill-danger text-on-danger',
    tint: 'bg-bg-danger border-border-danger text-text-danger',
  },
  warning: {
    text: 'text-text-warning',
    fill: 'bg-fill-warning text-on-warning',
    tint: 'bg-bg-warning border-border-warning text-text-warning',
  },
  success: {
    text: 'text-text-success',
    fill: 'bg-fill-success text-on-success',
    tint: 'bg-bg-success border-border-success text-text-success',
  },
  agent: {
    text: 'text-text-agent',
    fill: 'bg-fill-agent text-on-agent',
    tint: 'bg-bg-agent border-border-agent text-text-agent',
  },
  info: {
    text: 'text-text-info',
    fill: 'bg-fill-info text-on-info',
    tint: 'bg-bg-info border-border-info text-text-info',
  },
};

const surfaces = [
  { token: 'canvas', className: 'bg-canvas' },
  { token: 'surface', className: 'bg-surface' },
  { token: 'surface-raised', className: 'bg-surface-raised' },
  { token: 'border', className: 'bg-border' },
  { token: 'border-strong', className: 'bg-border-strong' },
  // A swatch, not a text sample: it is for disabled labels only, which WCAG exempts,
  // and as readable text on this page it would fail 1.4.3.
  { token: 'text-disabled', className: 'bg-text-disabled' },
];

const texts = [
  { token: 'text-primary', className: 'text-text-primary', use: 'Headings, figures' },
  { token: 'text-body', className: 'text-text-body', use: 'Body text' },
  { token: 'text-secondary', className: 'text-text-secondary', use: 'Everything else that’s read' },
  { token: 'text-tertiary', className: 'text-text-tertiary', use: 'Placeholders and non-text marks only' },
];

const elevation = [
  { name: 'Inline', detail: 'surface, border', className: 'bg-surface border-border' },
  { name: 'Raised', detail: 'surface-raised, border-strong', className: 'bg-surface-raised border-border-strong' },
  {
    name: 'Overlay',
    detail: 'surface-raised, border-strong, the overlay sheet',
    className: 'bg-surface-raised border-border-strong shadow-overlay',
  },
];

function RoleRow({ role }: { role: Role }) {
  const c = roleClasses[role];
  return (
    <div className="flex flex-col gap-[var(--gap-group)]">
      <h3 className="text-site-title-sm font-semibold text-text-primary capitalize">{role}</h3>
      <ModePair>
        {(mode) => {
          const text = tokenStep(`text-${role}`, mode);
          const fill = tokenStep(`fill-${role}`, mode);
          const on = tokenStep(`on-${role}`, mode);
          const tint = tokenStep(`bg-${role}`, mode);
          return (
            <div className="grid grid-cols-1 gap-[var(--gap-group)] sm:grid-cols-3">
              <div className="flex flex-col gap-[var(--gap-control-icon)]">
                <p className={cn('text-site-title font-semibold', c.text)}>Aa</p>
                <TokenLabel name={`text-${role}`} detail={`${stepLabel(text)}, ${onCanvas(text, mode)}`} />
              </div>
              <div className="flex flex-col gap-[var(--gap-control-icon)]">
                <p className={cn('px-[var(--pad-card)] py-2 text-site-title font-semibold', c.fill)}>Aa</p>
                <TokenLabel
                  name={`fill-${role}`}
                  detail={`${stepLabel(fill)}, text ${stepLabel(on)} at ${contrast(on.hex, fill.hex).toFixed(2)}:1`}
                />
              </div>
              <div className="flex flex-col gap-[var(--gap-control-icon)]">
                <p className={cn('border px-[var(--pad-card)] py-2 text-site-title font-semibold', c.tint)}>Aa</p>
                <TokenLabel name={`bg-${role}`} detail={stepLabel(tint)} />
              </div>
            </div>
          );
        }}
      </ModePair>
    </div>
  );
}

export default function Color() {
  return (
    <>
      <FoundationsHeader
        current={pages.color}
        title="Color"
        lead="Each color is named by what it marks: a state of the data, the run or your focus, never a level of importance. Five hues and a neutral, measured in both modes."
      />

      <Section labelledBy="roles-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="roles-title"
            title="Roles"
            lead="Six roles from five hues: the interactive role’s fill and ring are ink, its text and tint the same green as success. Each shows its text on the canvas, its solid fill with the text that sits on it, and its tint."
          />
          {roles.map((role) => (
            <RoleRow key={role} role={role} />
          ))}
        </Rail>
      </Section>

      <Section labelledBy="neutral-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="neutral-title"
            title="Neutral"
            lead="The ledger ramp: paper at the light end, blue-black ink at the dark end. Every surface, border and reading colour."
          />
          <ModePair>
            {(mode) => (
              <div className="flex flex-col gap-[var(--site-gap-tight)]">
                <ul role="list" className="grid grid-cols-1 gap-[var(--gap-group)] sm:grid-cols-2">
                  {surfaces.map((s) => (
                    <li key={s.token} className="flex items-center gap-[var(--gap-group)]">
                      <span
                        aria-hidden="true"
                        className={cn('size-8 shrink-0 border border-border-strong', s.className)}
                      />
                      <TokenLabel name={s.token} detail={stepLabel(tokenStep(s.token, mode))} />
                    </li>
                  ))}
                </ul>
                <ul role="list" className="flex flex-col gap-[var(--gap-group)]">
                  {texts.map((t) => {
                    const step = tokenStep(t.token, mode);
                    return (
                      <li key={t.token} className="flex flex-col gap-[var(--gap-bonded)]">
                        <p className={cn('text-site-body', t.className)}>{t.use}</p>
                        <TokenLabel name={t.token} detail={`${stepLabel(step)}, ${onCanvas(step, mode)}`} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </ModePair>
        </Rail>
      </Section>

      <Section labelledBy="elevation-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="elevation-title"
            title="Surfaces and elevation"
            lead="Depth is a surface step and a 1px rule. Only an overlay adds the sheet: a second ruled page 4px below it, never a blur."
          />
          <ModePair>
            {() => (
              <ul role="list" className="grid grid-cols-1 gap-[var(--site-gap-tight)] pr-1 pb-1 sm:grid-cols-3">
                {elevation.map((e) => (
                  <li
                    key={e.name}
                    className={cn('flex flex-col gap-[var(--gap-bonded)] border p-[var(--pad-card)]', e.className)}
                  >
                    <p className="font-medium text-text-primary">{e.name}</p>
                    <p className="text-xs text-text-secondary">{e.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </ModePair>
        </Rail>
      </Section>

      <Section labelledBy="ramps-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="ramps-title"
            title="Ramps"
            lead="The Riso Ledger palette: seven ramps on one shared lightness curve, so a step number means the same contrast in every hue. Generated, never typed."
          />
          <ul role="list" className="flex flex-col gap-[var(--site-gap-tight)]">
            {rampNames.map((ramp) => (
              <li key={ramp} className="flex flex-col gap-[var(--gap-control-icon)]">
                <p className="text-site-small font-semibold text-text-primary capitalize">
                  {ramp}
                  {ramp === 'teal' ? (
                    <span className="font-normal text-text-secondary"> (chart series only)</span>
                  ) : null}
                  {ramp === 'ledger' ? <span className="font-normal text-text-secondary"> (the neutral)</span> : null}
                </p>
                <ol role="list" className="grid grid-cols-6 gap-[var(--gap-bonded)] md:grid-cols-12">
                  {rampSteps(ramp).map((s) => (
                    <li key={s.step} className="flex flex-col gap-[var(--gap-bonded)]">
                      {/* The measured hex from palette.json, read at build time: painting
                          the palette is this page's one job that no token can do. */}
                      <span aria-hidden="true" className="h-8 border border-border" style={{ background: s.hex }} />
                      <code className="text-2xs text-text-secondary">{s.step}</code>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </Rail>
      </Section>
    </>
  );
}
