import { FoundationsHeader, TokenLabel } from '../components/foundations';
import { Rail, Section, SectionHeader } from '../components/layout';
import { pages } from '../content';
import { themeToken, themeTokensWith } from '../tokens';
import { pageMeta } from '../lib/meta';
import type { Route } from './+types/density';

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: 'Density · Tabular UI',
    description: 'Spacing capped at 32px, controls at 36px, rows at 28px, and square corners. The cap is the design.',
    path: '/foundations/density',
  });

/** A token's own comment from theme.css, first line only. */
const note = (text?: string) => text?.split(/\s{2,}/)[0];

/** Each radius tier's own utility, so the sample is the tier itself (§7.7). */
const radiusClass: Record<string, string> = {
  '--radius-xs': 'rounded-xs',
  '--radius-sm': 'rounded-sm',
  '--radius-md': 'rounded-md',
  '--radius-lg': 'rounded-lg',
  '--radius-full': 'rounded-full',
};

/** A token drawn at its own size: the bar's width is the token itself, read by the browser. */
function Measure({ token, axis = 'width' }: { token: string; axis?: 'width' | 'height' }) {
  return (
    <span
      aria-hidden="true"
      className={axis === 'width' ? 'block h-2 shrink-0 bg-border-strong' : 'block w-8 shrink-0 bg-border-strong'}
      style={axis === 'width' ? { width: `var(${token})` } : { height: `var(${token})` }}
    />
  );
}

function TokenRows({
  tokens,
  axis,
}: {
  tokens: { name: string; value: string; note?: string }[];
  axis?: 'width' | 'height';
}) {
  return (
    <ul role="list" className="flex flex-col">
      {tokens.map((t) => (
        <li
          key={t.name}
          className="grid grid-cols-1 items-center gap-[var(--gap-inline)] border-t border-border py-2 md:grid-cols-[220px_80px_1fr]"
        >
          <TokenLabel name={t.name} detail={t.value} />
          <Measure token={t.name} axis={axis} />
          <p className="text-xs text-text-secondary">{note(t.note)}</p>
        </li>
      ))}
    </ul>
  );
}

export default function Density() {
  const spacing = [...themeTokensWith('--pad-'), ...themeTokensWith('--gap-')].filter(
    // eslint-disable-next-line no-restricted-syntax -- Density documents the frame tier: it lists the tokens and draws each at its size; it spaces nothing with them.
    (t) => !t.name.startsWith('--pad-frame-'),
  );
  return (
    <>
      <FoundationsHeader
        current={pages.density}
        title="Density"
        lead="Generous spacing is how a dense product quietly becomes a sparse one, so the cap is the design: no component spacing above 32px, no control above 36px, every corner square."
      />

      <Section labelledBy="spacing-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="spacing-title"
            title="Spacing"
            lead="Reach for the role first: a cell’s padding is --pad-cell-x, not a number. Every role token below is under the 32px cap, and each is drawn at its own width."
          />
          <TokenRows tokens={spacing} />
        </Rail>
      </Section>

      <Section labelledBy="frame-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="frame-title"
            title="The frame tier"
            lead="The one tier above 32px, capped at 64px. It is paid once per page, not once per row, so only shells use it: the space around a page, never inside a table, card or form."
          />
          {/* eslint-disable-next-line no-restricted-syntax -- Density documents the frame tier: it lists the tokens and draws each at its size; it spaces nothing with them. */}
          <TokenRows tokens={themeTokensWith('--pad-frame-')} />
        </Rail>
      </Section>

      <Section labelledBy="heights-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="heights-title"
            title="Control and row heights"
            lead="The real definition of density. A 32px control, a 28px row, and nothing above 36px."
          />
          <TokenRows tokens={themeTokensWith('--h-')} axis="height" />
        </Rail>
      </Section>

      <Section labelledBy="shape-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="shape-title"
            title="Shape"
            lead="Square. Every rectangle names its tier, so re-rounding stays a one-line change, and round marks stay round."
          />
          <ul role="list" className="flex flex-col">
            {themeTokensWith('--radius-').map((t) => (
              <li
                key={t.name}
                className="grid grid-cols-1 items-center gap-[var(--gap-inline)] border-t border-border py-2 md:grid-cols-[220px_80px_1fr]"
              >
                <TokenLabel name={t.name} detail={t.value} />
                <span
                  aria-hidden="true"
                  className={`block size-6 border border-border-strong bg-surface ${radiusClass[t.name] ?? ''}`}
                />
                <p className="text-xs text-text-secondary">{note(t.note)}</p>
              </li>
            ))}
          </ul>
        </Rail>
      </Section>

      <Section labelledBy="borders-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="borders-title"
            title="Borders"
            lead="Borders do the work whitespace does elsewhere. Every line is 1px; 2px is kept for the agent rail, the focus ring and the active tab. Dashed means a placeholder."
          />
          <TokenRows
            tokens={[themeToken('--border-width'), themeToken('--border-width-2'), themeToken('--ring-width')]}
          />
          <p className="max-w-[var(--site-w-prose)] border border-dashed border-border-strong p-[var(--pad-card)] text-text-secondary">
            A dashed frame marks something still to come: a to-build component, a slot a row will fill.
          </p>
        </Rail>
      </Section>

      <Section labelledBy="widths-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="widths-title"
            title="Shell widths"
            lead="Widths carry no cap. They exist because the same number was written in more than one place."
          />
          <ul role="list" className="flex flex-col">
            {themeTokensWith('--w-').map((t) => (
              <li
                key={t.name}
                className="grid grid-cols-1 items-baseline gap-[var(--gap-inline)] border-t border-border py-2 md:grid-cols-[220px_1fr]"
              >
                <TokenLabel name={t.name} detail={t.value} />
                <p className="text-xs text-text-secondary">{note(t.note)}</p>
              </li>
            ))}
          </ul>
        </Rail>
      </Section>
    </>
  );
}
