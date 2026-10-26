import { Rail, Section, SectionHeader } from '../components/layout';
import type { Ground } from '../components/specimen';
import { CardRow, ClosingBand, HeroSection } from '../sections';
import { PlanSpecimen, ReasoningSpecimen } from '../specimens';
import type { Route } from './+types/plates';

/**
 * The plate comparison (docs/site.md D3). The owner chooses the specimens'
 * ground from this page, with real components, at 1440 and 390. Not linked
 * from anywhere and not indexed; removed once the choice is made.
 */
export const meta: Route.MetaFunction = () => [
  { title: 'Plate comparison · Tabular UI' },
  { name: 'robots', content: 'noindex' },
];

const variants: { id: string; title: string; lead: string; hero: Ground; cards: Ground; band: Ground }[] = [
  {
    id: 'a',
    title: '(a) Paper plates',
    lead: 'A 1px frame on paper, everywhere. Nothing new, and every contrast figure is already measured.',
    hero: 'paper',
    cards: 'paper',
    band: 'paper',
  },
  {
    id: 'b',
    title: '(b) Dark plates',
    lead: 'Every specimen draws in dark mode, the mode the components were designed for. The closing band is dark too.',
    hero: 'dark',
    cards: 'dark',
    band: 'dark',
  },
  {
    id: 'c',
    title: '(c) Dark for single specimens',
    lead: 'Dark where one specimen is the subject (the hero, and each component page); paper in the grids.',
    hero: 'dark',
    cards: 'paper',
    band: 'dark',
  },
];

export default function Plates() {
  return (
    <>
      <Section rule={false}>
        <Rail size="reading" className="flex flex-col gap-[var(--gap-group)]">
          <h1 className="text-site-heading-sm font-semibold text-text-primary md:text-site-heading">
            Plate comparison
          </h1>
          <p className="text-site-lead text-text-secondary">
            Three grounds for the specimens, with real components (docs/site.md D3). Each shows the hero, a row of
            Components cards and the closing band.
          </p>
        </Rail>
      </Section>
      {variants.map((v) => (
        <div key={v.id} id={`variant-${v.id}`}>
          <Section labelledBy={`variant-${v.id}-title`} className="pb-0">
            <Rail>
              <SectionHeader id={`variant-${v.id}-title`} title={v.title} lead={v.lead} />
            </Rail>
          </Section>
          <HeroSection ground={v.hero} as="h2" />
          <Section rule={false} className="pt-0">
            <Rail>
              <CardRow ground={v.cards}>
                {{ 'agent-reasoning': <ReasoningSpecimen />, 'agent-plan': <PlanSpecimen /> }}
              </CardRow>
            </Rail>
          </Section>
          <ClosingBand ground={v.band} />
        </div>
      ))}
    </>
  );
}
