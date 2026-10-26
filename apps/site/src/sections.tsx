import { buttonVariants } from 'tabular-ui';

import { ExternalMark, Rail, Section, SectionHeader } from './components/layout';
import { ComponentCard, ComponentTag, defaultGround, type Ground, SpecimenFrame } from './components/specimen';
import { components, external, moments, pages, principles } from './content';
import { kasane } from './data';
import { cn } from './lib/cn';
import { focusRing } from './lib/styles';
import { HeroSpecimen } from './specimens';

/**
 * Home's sections (wireframe `76:23`, mobile `77:96`), as parts the plate
 * comparison at /plates reuses with each ground.
 */

export function HeroSection({ ground = defaultGround, as: Heading = 'h1' }: { ground?: Ground; as?: 'h1' | 'h2' }) {
  return (
    <Section rule={false} labelledBy="hero-title">
      <Rail className="grid grid-cols-1 items-start gap-[var(--site-gap)] lg:grid-cols-12">
        <div className="flex flex-col gap-[var(--site-gap)] lg:col-span-5">
          <Heading
            id="hero-title"
            className="text-site-display-sm font-semibold text-text-primary md:text-site-display"
          >
            An agent stops before anything that posts to the ledger.
          </Heading>
          <p className="text-site-lead text-text-secondary">
            Proposals are cheap. Journal entries are not. Only a person can release one.
          </p>
          <div className="flex flex-wrap gap-[var(--gap-inline)]">
            <a href={external.demo.href} className={buttonVariants({ size: 'lg' })}>
              Open the demo
              <ExternalMark />
            </a>
            {pages.components.live ? (
              <a href={pages.components.href} className={buttonVariants({ size: 'lg', variant: 'outline' })}>
                Browse components
              </a>
            ) : null}
          </div>
        </div>
        <SpecimenFrame ground={ground} className="lg:col-span-7">
          <HeroSpecimen />
        </SpecimenFrame>
      </Rail>
    </Section>
  );
}

/**
 * The outline is the menu (wireframe `76:89`): each count jumps to its section.
 * Sans, not the wireframe's serif: these are links, not headings, and only a
 * heading element goes serif (§8.3).
 */
export function OutlineSection() {
  const items = [
    { href: '#principles', label: `${principles.length} principles` },
    { href: '#moments', label: `${moments.length} moments` },
    {
      href: pages.components.live ? pages.components.href : '#moments',
      label: `${components.length} components`,
    },
  ];
  return (
    <Section className="py-[var(--site-gap)]">
      <Rail>
        <nav aria-label="On this page">
          <ul role="list" className="flex flex-wrap gap-x-[var(--site-gap)] gap-y-[var(--gap-group)]">
            {items.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className={cn(
                    'text-site-heading-sm font-semibold text-text-primary underline underline-offset-4',
                    focusRing,
                  )}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Rail>
    </Section>
  );
}

export function PrinciplesSection() {
  return (
    <Section id="principles" labelledBy="principles-title">
      <Rail className="flex flex-col gap-[var(--site-gap)]">
        <SectionHeader
          id="principles-title"
          title={`${principles.length} principles`}
          lead="Every component follows them."
        />
        <ul role="list" className="grid grid-cols-1 gap-[var(--site-gap)] md:grid-cols-3">
          {principles.map((principle) => (
            <li
              key={principle.title}
              className="flex flex-col gap-[var(--gap-group)] border border-border p-[var(--site-gap)]"
            >
              <h3 className="text-site-title-sm font-semibold text-text-primary md:text-site-title">
                {principle.title}
              </h3>
              <div className="flex flex-col gap-[var(--gap-bonded)]">
                <p className="text-site-small font-semibold text-text-secondary">Check</p>
                <p className="text-site-body text-text-body">{principle.check}</p>
              </div>
              <div className="flex flex-col gap-[var(--gap-control-icon)]">
                <p className="sr-only">Carried by</p>
                <ul role="list" className="flex flex-wrap gap-[var(--gap-control-icon)]">
                  {principle.carriedBy.map((c) => (
                    <li key={c.name}>
                      <ComponentTag component={c} />
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </Rail>
    </Section>
  );
}

export function MomentsSection() {
  return (
    <Section id="moments" labelledBy="moments-title">
      <Rail className="flex flex-col gap-[var(--site-gap)]">
        <SectionHeader
          id="moments-title"
          title={`${moments.length} moments`}
          lead={`The life of one agent run. ${components.length} components sit inside them.`}
        />
        <ol role="list" className="grid grid-cols-1 gap-[var(--site-gap-tight)] md:grid-cols-5">
          {moments.map((moment) => {
            const built = moment.components.filter((c) => c.built).length;
            return (
              <li
                key={moment.id}
                className="flex flex-col gap-[var(--gap-group)] border border-border p-[var(--site-gap-tight)]"
              >
                <div className="flex flex-col gap-[var(--gap-bonded)]">
                  <h3 className="text-site-title-sm font-semibold text-text-primary">{moment.title}</h3>
                  <p className="text-site-small text-text-body">{moment.line}</p>
                </div>
                {/* One square per component: filled when built, dashed when not. Decorative:
                    the count beneath says the same in words. */}
                <div aria-hidden="true" className="flex gap-[var(--gap-bonded)]">
                  {moment.components.map((c) => (
                    <span
                      key={c.name}
                      className={cn(
                        'size-4 border border-border-strong',
                        c.built ? 'bg-border-strong' : 'border-dashed',
                      )}
                    />
                  ))}
                </div>
                <p className="text-site-small text-text-secondary">
                  {built} of {moment.components.length} built
                </p>
              </li>
            );
          })}
        </ol>
      </Rail>
    </Section>
  );
}

/** The closing band (D7): Home only. Its ground is decided with the plates (D3). */
export function ClosingBand({ ground = defaultGround }: { ground?: Ground }) {
  return (
    <Section labelledBy="closing-title" className="p-0">
      <div
        data-theme={ground === 'dark' ? 'dark' : undefined}
        className="bg-canvas py-[var(--site-section-y)] text-text-body"
      >
        <Rail size="reading" className="flex flex-col items-center gap-[var(--site-gap)] text-center">
          <h2 id="closing-title" className="text-site-heading-sm font-semibold text-text-primary md:text-site-heading">
            Give an agent a finance team’s files.
          </h2>
          <p className="max-w-[var(--site-w-prose)] text-site-lead text-text-secondary">
            {kasane.company.name} is a fictional printer maker. You play its {kasane.company.persona.title} while a
            scripted agent reads {kasane.pack.length} of its files. The duplicate payment above is one of the
            contradictions it finds.
          </p>
          <a href={external.demo.href} className={buttonVariants({ size: 'lg' })}>
            Open the demo
            <ExternalMark />
          </a>
        </Rail>
      </div>
    </Section>
  );
}

/** One row of Components cards, for the plate comparison (D3): the Thinking moment. */
export function CardRow({ ground, children }: { ground: Ground; children: Record<string, React.ReactNode> }) {
  const row = components.filter((c) => c.moment === 'thinking');
  return (
    <ul role="list" className="grid grid-cols-1 gap-[var(--site-gap)] md:grid-cols-3">
      {row.map((c) => (
        <li key={c.name}>
          <ComponentCard component={c} ground={ground}>
            {children[c.name]}
          </ComponentCard>
        </li>
      ))}
    </ul>
  );
}
