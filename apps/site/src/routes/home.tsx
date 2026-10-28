import { ComponentsSection } from '../component-grid';
import { ClosingBand, HeroSection } from '../sections';
import { pageMeta } from '../lib/meta';
import type { Route } from './+types/home';

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: 'Tabular UI',
    description: 'Components that show how the agent reasoned, what it proposes and what a person approved.',
    path: '/',
  });

/**
 * Home (wireframe `76:23`, mobile `77:96`): the hero, the component grid, and the
 * closing band. The outline, principles and moments sections were removed
 * 2026-10-26 (owner): the outline mixed in-page anchors with a link to another
 * page, and the grid shows the moments and principles' components itself.
 */
export default function Home() {
  return (
    <>
      <HeroSection />
      <ComponentsSection />
      <ClosingBand />
    </>
  );
}
