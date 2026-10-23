// From Phosphor's types file, not the package root: Storybook's react-docgen
// follows a type import into the package, and the root re-exports ~1,500
// icons. That cost 2.1s of blocked dev server per cold load wherever this
// component is in the graph (found 2026-10-15). Same type, erased at build.
import type { Icon } from '@phosphor-icons/react/dist/lib/types';

import { cn } from '../../../lib/utils';

export type EmptyStateProps = {
  title: string;
  description?: React.ReactNode;
  /** Rendered at --size-icon-display in `thin` weight (§11.2). */
  icon?: Icon;
  /** Primary action. A dead end with no way forward is a worse empty state. */
  action?: React.ReactNode;
  /**
   * `sm` inside a panel, `default` inside a card, table or drop zone, `page`
   * when the empty state stands in for a whole page: same content as
   * `default`, with the frame tier's vertical air (§7.3).
   */
  size?: 'sm' | 'default' | 'page';
  className?: string;
};

/**
 * EmptyState — product.
 *
 * The one place a display-size icon appears. `--size-icon-display` (48px) at
 * `thin` weight, per §11.2: a stroke tuned to read at 16px looks heavy at 48px,
 * the same correction §8.3 makes for type when it narrows the metric tier.
 *
 * **Everything here is neutral** (§0 rule 1, which names empty states
 * explicitly). An empty table is not an error, a warning or a success — it is
 * an absence, and absence has no state to communicate. Reach for a hue here
 * and it stops meaning anything elsewhere.
 */
function EmptyState({ title, description, icon: IconComponent, action, size = 'default', className }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        // p-4 (16px) by the §7.4 fallback rule: no role token fits. This
        // borrowed --gap-section until 2026-10-08, when that gap became 32px
        // and every empty state in a panel would have doubled its padding.
        'gap-[var(--gap-field)] p-4',
        size === 'page' && 'py-[var(--pad-frame-empty)]',
        className,
      )}
    >
      {IconComponent ? (
        <IconComponent
          weight="thin"
          aria-hidden="true"
          className={cn(
            'text-text-tertiary',
            size === 'sm' ? 'size-[var(--size-icon-lg)]' : 'size-[var(--size-icon-display)]',
          )}
        />
      ) : null}

      <div className="flex flex-col gap-[var(--gap-bonded)]">
        <span className={cn('font-medium text-text-primary', size === 'sm' ? 'text-sm' : 'text-md')}>{title}</span>
        {description ? <span className="max-w-[46ch] text-sm text-text-secondary">{description}</span> : null}
      </div>

      {action ? <div className="flex items-center gap-[var(--gap-inline)]">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
