import { Button, buttonVariants } from 'tabular-ui';

import { demoSoonLabel, external } from '../content';
import { ExternalMark } from './layout';

/**
 * The primary "try the demo" action, in the nav, the hero and the closing band.
 * A link while the demo is ready; until then a disabled button reading
 * "Demo (soon)", because a link has no disabled state and must not lead to a
 * demo that isn't there (`external.demo.ready` in src/content.ts).
 */
export function DemoAction({ label = external.demo.label }: { label?: string }) {
  if (external.demo.ready) {
    return (
      <a href={external.demo.href} className={buttonVariants({ size: 'lg' })}>
        {label}
        <ExternalMark />
      </a>
    );
  }
  return (
    <Button size="lg" disabled>
      {demoSoonLabel}
    </Button>
  );
}
