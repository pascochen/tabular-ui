import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { cn } from '../../../lib/utils';
import { badgeTones, badgeVariants, type BadgeTone, type BadgeVariantOptions } from './variants';

export type BadgeProps = Omit<useRender.ComponentProps<'span'>, 'role'> & {
  /** Which of §1's roles the badge shows. Defaults to `neutral`. */
  tone?: BadgeTone;
  shape?: BadgeVariantOptions['shape'];
  /**
   * An ARIA role, passed to the element: `role="status"` for a badge whose
   * change should be announced. A tone name here (`role="danger"`) is the
   * deprecated spelling of `tone`, still honoured and warned about in
   * development.
   */
  role?: React.AriaRole | BadgeTone;
};

const isTone = (value: unknown): value is BadgeTone => (badgeTones as readonly unknown[]).includes(value);

// Once per value, not per render: a table of badges would otherwise flood
// the console with the same line.
const warned = new Set<string>();

/**
 * Badge — foundational.
 *
 * A static marker: run state, validation state, a count. It is not
 * interactive and has no hover or focus state — if it needs one, it is a
 * `Chip`.
 *
 * The tone must be true of the thing the badge is attached to (§0 rule 1). A
 * badge is not decoration and never marks importance.
 *
 * For pipeline and validation state specifically, use `StatusBadge` — it maps
 * run states onto these tones so the mapping lives in one place.
 *
 * **`tone`, not `role`.** Until 2026-10-09 the colour prop was `role`, which is
 * also the HTML attribute that tells assistive technology what an element is:
 * a badge could not carry a real one, and `role="danger"` read as an ARIA
 * role. No ARIA role is named after a tone, so a tone name in `role` is read
 * as the old spelling and anything else goes to the element.
 */
function Badge({ className, tone, role, shape = 'status', render, ...props }: BadgeProps) {
  const legacyTone = isTone(role) ? role : undefined;
  if (import.meta.env.DEV && legacyTone && !warned.has(legacyTone)) {
    warned.add(legacyTone);
    console.warn(`Badge: role="${legacyTone}" is deprecated. Use tone="${legacyTone}"; role is the ARIA attribute.`);
  }
  const resolved = tone ?? legacyTone ?? 'neutral';
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ tone: resolved, shape }), className),
        role: legacyTone ? undefined : (role as React.AriaRole | undefined),
      },
      props,
    ),
    render,
    state: { slot: 'badge', tone: resolved, shape },
  });
}

export { Badge };
