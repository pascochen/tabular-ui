import { ClosingBand, HeroSection, MomentsSection, OutlineSection, PrinciplesSection } from '../sections';
import type { Route } from './+types/home';

export const meta: Route.MetaFunction = () => [
  { title: 'Tabular UI' },
  {
    name: 'description',
    content: 'Dense React components and design tokens for finance and operations data tools, agentic UI included.',
  },
];

/** Home (wireframe `76:23`, mobile `77:96`): one moment, 3 principles, 5 moments, one closing band. */
export default function Home() {
  return (
    <>
      <HeroSection />
      <OutlineSection />
      <PrinciplesSection />
      <MomentsSection />
      <ClosingBand />
    </>
  );
}
