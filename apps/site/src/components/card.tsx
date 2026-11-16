import { cn } from '../lib/cn';
import { panel } from '../lib/styles';

/**
 * A titled card: a panel on the page, a title, an optional lead, then
 * whatever the card holds. Vocabulary's two three-column sections share it, so
 * their columns read as one set (owner, 2026-11-15).
 *
 * It is a panel, as every bordered panel on the site is: the paper, with a
 * `--color-border` edge (docs/site.md D3, item 4; tests/paper.spec.ts).
 * The title is an `<h3>`: a card sits under a section's `<h2>`.
 *
 * Not for agent-authored content, which is an `AgentBlock`, and not a
 * specimen's frame, which is `SpecimenFrame`.
 */
export function Card({
  as: Tag = 'div',
  title,
  lead,
  className,
  children,
}: {
  /** `li` when the cards are a list's items. */
  as?: 'div' | 'li';
  title: string;
  lead?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag className={cn('flex flex-col gap-[var(--gap-group)] p-[var(--site-gap)]', panel, className)}>
      <h3 className="text-site-title font-medium text-text-primary">{title}</h3>
      {lead ? <p className="text-site-small text-text-secondary">{lead}</p> : null}
      {children}
    </Tag>
  );
}
