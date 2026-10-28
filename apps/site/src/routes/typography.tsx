import { MetricTile } from 'tabular-ui';

import { FoundationsHeader, ModePair, TokenLabel } from '../components/foundations';
import { Rail, Section, SectionHeader } from '../components/layout';
import { pages } from '../content';
import { kasane, packFile } from '../data';
import { cn } from '../lib/cn';
import { exactMoney, money } from '../lib/format';
import { onCanvas, px, stepLabel, themeToken, tokenStep } from '../tokens';
import { pageMeta } from '../lib/meta';
import type { Route } from './+types/typography';

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: 'Typography · Tabular UI',
    description: 'A 13px scale for dense tools, one superfamily, and tabular figures everywhere, prose included.',
    path: '/foundations/typography',
  });

/** The library's scale (§8.1), written out so Tailwind generates each class. */
const scale = [
  { token: '--text-2xs', className: 'text-2xs' },
  { token: '--text-xs', className: 'text-xs' },
  { token: '--text-sm', className: 'text-sm' },
  { token: '--text-base', className: 'text-base' },
  { token: '--text-md', className: 'text-md' },
  { token: '--text-lg', className: 'text-lg' },
  { token: '--text-xl', className: 'text-xl' },
  { token: '--text-metric-sm', className: 'text-metric-sm font-display tabular-nums' },
  { token: '--text-metric', className: 'text-metric font-display tabular-nums' },
];

const firstFamily = (token: string) => themeToken(token).value.split(',')[0].replace(/['"]/g, '');

const texts = [
  { token: 'text-primary', className: 'text-text-primary' },
  { token: 'text-body', className: 'text-text-body' },
  { token: 'text-secondary', className: 'text-text-secondary' },
  { token: 'text-tertiary', className: 'text-text-tertiary' },
];

export default function Typography() {
  const bridge = kasane.operatingBridge;
  return (
    <>
      <FoundationsHeader
        current={pages.typography}
        title="Typography"
        lead="A 13px base for dense tools, sized in rem. One superfamily: sans for reading, serif for headings and the single figure a tile exists to show, mono for identifiers."
      />

      <Section labelledBy="scale-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="scale-title"
            title="Scale"
            lead="Each size carries its own line height, a multiple of 4px. Nothing goes above 32px: these are the sizes of the product, and this site’s larger reading sizes are its own."
          />
          <ul role="list" className="flex flex-col">
            {scale.map(({ token, className }) => {
              const size = themeToken(token);
              const line = themeToken(`${token}--line-height`);
              return (
                <li
                  key={token}
                  className="grid grid-cols-1 items-baseline gap-[var(--gap-inline)] border-t border-border py-[var(--gap-group)] md:grid-cols-[200px_1fr]"
                >
                  <TokenLabel name={token} detail={`${px(size.value)}px / ${px(line.value)}px`} />
                  <div className="flex min-w-0 flex-col gap-[var(--gap-bonded)]">
                    <p className={cn('truncate text-text-primary', className)}>{token.slice(2)}</p>
                    {size.note ? (
                      <p className="text-xs text-text-secondary">{size.note.replace(/^[\d.]+px\s*—\s*/, '')}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </Rail>
      </Section>

      <Section labelledBy="families-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="families-title"
            title="Families"
            lead="Drawn to share proportions. The serif applies by element: every heading, and the metric tier. Text that isn’t a heading never goes serif."
          />
          <ul role="list" className="grid grid-cols-1 gap-[var(--site-gap)] md:grid-cols-3">
            <li className="flex flex-col gap-[var(--gap-group)] border border-border p-[var(--site-gap-tight)]">
              <TokenLabel name="--font-sans" detail={firstFamily('--font-sans')} />
              <p className="text-site-lead text-text-primary">Body and interface text, at every size.</p>
            </li>
            <li className="flex flex-col gap-[var(--gap-group)] border border-border p-[var(--site-gap-tight)]">
              <TokenLabel name="--font-heading" detail={firstFamily('--font-display')} />
              <h3 className="text-site-title font-semibold text-text-primary">Every heading, by element</h3>
            </li>
            <li className="flex flex-col gap-[var(--gap-group)] border border-border p-[var(--site-gap-tight)]">
              <TokenLabel name="--font-mono" detail={firstFamily('--font-mono')} />
              <p className="font-mono text-text-primary">
                {kasane.duplicatePayment.entries[0]} {packFile('trial_balance_monthly.csv')}
              </p>
            </li>
          </ul>
        </Rail>
      </Section>

      <Section labelledBy="display-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="display-title"
            title="The display boundary"
            lead="At 24px and above, text is seen, not read: the one figure a tile exists to show takes the serif’s display cut, through MetricTile."
          />
          <div className="grid grid-cols-1 gap-[var(--site-gap-tight)] md:grid-cols-2">
            <MetricTile
              label="H1 operating profit"
              value={money(bridge.actual)}
              caption={`Budget ${money(bridge.budget)}`}
            />
            <MetricTile
              size="sm"
              label="H1 shortfall"
              value={money(bridge.budget - bridge.actual)}
              caption="Under budget"
            />
          </div>
        </Rail>
      </Section>

      <Section labelledBy="numerals-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="numerals-title"
            title="Numerals"
            lead="Tabular figures everywhere, prose included, so columns of figures line up. Misaligned figures in a financial tool are a correctness hazard."
          />
          <dl className="flex max-w-[var(--site-w-prose)] flex-col">
            {bridge.steps.map((s) => (
              <div key={s.id} className="flex justify-between gap-[var(--site-gap)] border-t border-border py-2">
                <dt className="text-text-body">{s.label}</dt>
                <dd className="text-right text-text-primary">{exactMoney(s.value)}</dd>
              </div>
            ))}
          </dl>
        </Rail>
      </Section>

      <Section labelledBy="text-colour-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="text-colour-title"
            title="Text colours"
            lead="Chosen per mode by lightness, never by mirroring the other mode’s step. Tertiary is never text anyone reads."
          />
          <ModePair>
            {(mode) => (
              <ul role="list" className="flex flex-col gap-[var(--gap-group)]">
                {texts.map((t) => {
                  const step = tokenStep(t.token, mode);
                  return (
                    <li key={t.token} className="flex flex-col gap-[var(--gap-bonded)]">
                      <p className={cn('text-site-body', t.className)}>The month, explained.</p>
                      <TokenLabel name={t.token} detail={`${stepLabel(step)}, ${onCanvas(step, mode)}`} />
                    </li>
                  );
                })}
              </ul>
            )}
          </ModePair>
        </Rail>
      </Section>
    </>
  );
}
