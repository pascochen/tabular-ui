import { cloneElement, isValidElement, type ReactElement } from 'react';

import { Badge } from '../../foundational/Badge';
import { cn } from '../../../lib/utils';

export type PresenceMember = {
  /** Stable key. */
  id: string;
  /** Read by assistive technology in the avatar's place. */
  name: string;
  /** An `Avatar`. The stack sets its size (24px) and hides it from assistive technology. */
  avatar: ReactElement<{ size?: 'sm' | 'default'; 'aria-hidden'?: boolean | 'true'; className?: string }>;
};

/** The ground the stack sits on. Its colour draws the gap between overlapping avatars. */
export type PresenceGround = 'canvas' | 'surface' | 'raised';

export type PresenceStackProps = {
  members: readonly PresenceMember[];
  /** Avatars drawn before the rest fold into a "+N" count. Default 3. */
  max?: number;
  /** What the list is: "Here now", "In this channel". It names the list for assistive technology. */
  label?: string;
  /** Default `canvas`, the ground of a page header. */
  ground?: PresenceGround;
  className?: string;
};

// Static strings, one per ground, so Tailwind sees each class whole.
const gaps: Record<PresenceGround, string> = {
  canvas: 'outline-canvas',
  surface: 'outline-surface',
  raised: 'outline-surface-raised',
};

/**
 * PresenceStack — product. Who is here, as overlapping avatars: the first few
 * drawn, the rest folded into a "+N" count.
 *
 * **The gap between avatars is an outline in the ground's colour**, never a
 * `ring` (`Avatar` README: its group part was dropped for exactly that, a
 * `ring-2` box-shadow). The outline is drawn outside each avatar, so the
 * overlap reads as a cut-out and the 24px footprint doesn't change. It has to
 * know the ground, hence `ground`.
 *
 * **No hue, and no presence dot.** Being here is who someone is, not a state
 * of the data (§0 rule 1). A dot in the success hue would say "passed".
 *
 * **A list, named.** Each avatar is `aria-hidden` and its member's name is
 * visually hidden text, so a screen reader hears "Here now, list, 5 items",
 * then every name, the folded ones included.
 */
function PresenceStack({ members, max = 3, label = 'Here now', ground = 'canvas', className }: PresenceStackProps) {
  const shown = members.slice(0, max);
  const folded = members.slice(max);
  return (
    <ul role="list" aria-label={label} data-slot="presence-stack" className={cn('flex items-center', className)}>
      {shown.map((m, i) => (
        <li
          key={m.id}
          // 4px of each avatar under the next, plus the 2px gap: 6px covered.
          // Initials sit about 5px in from the edge, so at 6px of overlap
          // (8px covered) "DO" read as "DC".
          className={cn('flex', i > 0 && '-ml-1')}
        >
          {isValidElement(m.avatar)
            ? cloneElement(m.avatar, {
                size: 'sm',
                'aria-hidden': true,
                className: cn('outline-2 outline-solid', gaps[ground], m.avatar.props.className),
              })
            : m.avatar}
          <span className="sr-only">{m.name}</span>
        </li>
      ))}
      {/* Each folded member is still an item, read and counted; only the badge is seen. */}
      {folded.map((m) => (
        <li key={m.id} className="sr-only">
          {m.name}
        </li>
      ))}
      {folded.length ? (
        <li aria-hidden="true" className="ml-[var(--gap-bonded)] flex">
          <Badge shape="count">+{folded.length}</Badge>
        </li>
      ) : null}
    </ul>
  );
}

export { PresenceStack };
