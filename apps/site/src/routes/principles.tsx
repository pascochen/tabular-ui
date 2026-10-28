import { Rail, Section } from '../components/layout';
import { ComponentTag } from '../components/specimen';
import { componentGrid, components, moments, principles } from '../content';
import { standaloneLink } from '../lib/styles';
import { pageMeta } from '../lib/meta';
import type { Route } from './+types/principles';

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: 'Principles · Tabular UI',
    description:
      'Three rules every Tabular UI component follows, each with a check a reviewer can run against any component.',
    path: '/principles',
  });

/** Principles (wireframe `77:230`): each rule, its why, its check, and the components that carry it. */
export default function Principles() {
  return (
    <>
      <Section rule={false}>
        <Rail size="reading" className="flex flex-col gap-[var(--gap-group)]">
          <h1 className="text-site-display-sm font-semibold text-text-primary md:text-site-display">Principles</h1>
          <p className="max-w-[var(--site-w-prose)] text-site-lead text-text-secondary">
            Three rules every Tabular component follows. Each one has a check you can run against any component.
          </p>
        </Rail>
      </Section>
      {principles.map((p, i) => (
        <Section key={p.title} labelledBy={`principle-${i}`}>
          <Rail size="reading" className="grid grid-cols-1 gap-[var(--site-gap)] md:grid-cols-[1fr_240px]">
            <div className="flex flex-col gap-[var(--gap-group)]">
              <h2 id={`principle-${i}`} className="text-site-heading-sm font-semibold text-text-primary">
                {p.title}
              </h2>
              <p className="text-site-lead text-text-secondary">{p.why}</p>
              <div className="flex flex-col gap-[var(--gap-bonded)] border border-border p-[var(--site-gap-tight)]">
                <p className="text-site-small font-semibold text-text-secondary">Check</p>
                <p className="text-site-body text-text-body">{p.check}</p>
              </div>
            </div>
            <div className="flex flex-col gap-[var(--gap-inline)]">
              <p className="text-site-small font-semibold text-text-secondary">Carried by</p>
              <ul role="list" className="flex flex-wrap gap-[var(--gap-control-icon)]">
                {p.carriedBy.map((c) => (
                  <li key={c.name}>
                    <ComponentTag component={c} />
                  </li>
                ))}
              </ul>
            </div>
          </Rail>
        </Section>
      ))}
      <Section>
        <Rail size="reading" className="flex flex-wrap items-baseline justify-between gap-[var(--site-gap)]">
          <p className="text-site-body text-text-secondary">Each component’s own decision sits on its card.</p>
          <a href={componentGrid} className={`${standaloneLink} text-site-body text-text-body`}>
            See the {moments.length} moments and {components.length} components
          </a>
        </Rail>
      </Section>
    </>
  );
}
