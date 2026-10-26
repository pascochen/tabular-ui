import { Tabs, TabsContent, TabsList, TabsTrigger } from 'tabular-ui';

import { ExternalMark, Rail, Section, SectionHeader } from './components/layout';
import { ComponentCard } from './components/specimen';
import { components, external, moments, type SiteComponent } from './content';
import { textLink } from './lib/styles';
import {
  AgentBlockSpecimen,
  AttachmentSpecimen,
  ChatStarterSpecimen,
  ComposerSpecimen,
  LineageSpecimen,
  PlanSpecimen,
  ReasoningSpecimen,
  RunLogSpecimen,
  StatusSpecimen,
  ThreadSpecimen,
} from './specimens';

/** Each built component's specimen, at rest (docs/site.md §6). */
const specimens: Record<string, () => React.ReactNode> = {
  'chat-starter': ChatStarterSpecimen,
  'chat-composer': ComposerSpecimen,
  'agent-reasoning': ReasoningSpecimen,
  'agent-plan': PlanSpecimen,
  'lineage-tree': LineageSpecimen,
  'attachment-row': AttachmentSpecimen,
  'agent-block': AgentBlockSpecimen,
  'chat-thread': ThreadSpecimen,
  'run-log-row': RunLogSpecimen,
  'status-badge': StatusSpecimen,
};

const built = components.filter((c) => c.built);
const filters = [
  { value: 'all', label: `All ${components.length}`, keep: () => true },
  { value: 'built', label: `Built ${built.length}`, keep: (c: SiteComponent) => c.built },
  { value: 'to-build', label: `To build ${components.length - built.length}`, keep: (c: SiteComponent) => !c.built },
];

function MomentSections({ keep }: { keep: (c: SiteComponent) => boolean }) {
  return moments.map((moment) => {
    const shown = moment.components.filter(keep);
    if (shown.length === 0) return null;
    return (
      <section
        key={moment.id}
        id={moment.id}
        aria-labelledby={`${moment.id}-title`}
        className="flex flex-col gap-[var(--site-gap)] border-t border-border pt-[var(--site-section-y)]"
      >
        <div className="flex flex-col gap-[var(--gap-bonded)]">
          <h3 id={`${moment.id}-title`} className="text-site-heading-sm font-semibold text-text-primary">
            {moment.title}
          </h3>
          <p className="text-site-body text-text-secondary">{moment.line}</p>
        </div>
        <ul role="list" className="grid grid-cols-1 gap-[var(--site-gap)] md:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => {
            const Specimen = specimens[c.name];
            return (
              <li key={c.name} id={c.name} className="scroll-mt-[var(--site-gap)]">
                <ComponentCard component={c}>{Specimen ? <Specimen /> : null}</ComponentCard>
              </li>
            );
          })}
        </ul>
      </section>
    );
  });
}

/**
 * The component grid (wireframe `78:191`), on Home since 2026-10-26 (owner): it
 * replaced Home's outline, principles and moments, and /components redirects
 * here. The jump index, the filter, and one section per moment.
 */
export function ComponentsSection() {
  return (
    <Section id="components" labelledBy="components-title">
      <Rail className="flex flex-col gap-[var(--site-gap)]">
        <SectionHeader
          id="components-title"
          title={`${components.length} components`}
          lead="Try each one with data from Kasane, a fictional printer maker. Grouped by the moment of the run they belong to."
        />
        <p className="max-w-[var(--site-w-prose)] text-site-small text-text-secondary">
          These are the {components.length} components of an agent run. The library has more: the controls, tables and
          shell they sit in are all in{' '}
          <a href={external.storybook.href} className={textLink}>
            {external.storybook.label}
            <ExternalMark />
          </a>
          .
        </p>

        <nav aria-label="Components by moment" className="border border-border p-[var(--site-gap-tight)]">
          <ul role="list" className="grid grid-cols-2 gap-[var(--site-gap-tight)] md:grid-cols-5">
            {moments.map((moment) => (
              <li key={moment.id} className="flex flex-col gap-[var(--gap-control-icon)]">
                <a
                  href={`#${moment.id}`}
                  className={`${textLink} text-site-small font-semibold text-text-primary no-underline hover:underline`}
                >
                  {moment.title}
                </a>
                {/* 6px apart, so each 20px link keeps a 24px target circle (WCAG 2.5.8). */}
                <ul role="list" className="flex flex-col gap-[var(--gap-control-icon)]">
                  {moment.components.map((c) => (
                    <li key={c.name} className="text-site-small">
                      {c.built ? (
                        <a href={`#${c.name}`} className={textLink}>
                          {c.title}
                        </a>
                      ) : (
                        <span className="text-text-secondary">{c.title} (to build)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        {/* A filter switches the view on one page, so it is the library's Tabs,
            segmented, as §4 sets them for view modes. Only the chosen view is
            mounted; the prerendered HTML is "All". */}
        <Tabs defaultValue="all" className="flex flex-col gap-[var(--site-gap)]">
          <TabsList variant="segmented" aria-label="Show" className="self-start">
            {filters.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {filters.map((f) => (
            <TabsContent key={f.value} value={f.value} className="flex flex-col gap-[var(--site-section-y)]">
              <MomentSections keep={f.keep} />
            </TabsContent>
          ))}
        </Tabs>
      </Rail>
    </Section>
  );
}
