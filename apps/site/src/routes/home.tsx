import { ComponentsSection } from '../component-grid';
import { ClosingBand, HeroSection } from '../sections';
import type { Route } from './+types/home';

export const meta: Route.MetaFunction = () => [
  { title: 'Tabular UI' },
  {
    name: 'description',
    content: 'Dense React components and design tokens for finance and operations data tools, agentic UI included.',
  },
];

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
