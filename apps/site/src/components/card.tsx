import { cn } from '../lib/cn';

/**
 * A titled card: a 1px frame on the canvas, a title, an optional lead, then
 * whatever the card holds. Vocabulary's two three-column sections share it, so
 * their columns read as one set (owner, 2026-11-15).
 *
 * It states its ground, as every bordered panel on the site does, so the page's
 * paper never shows inside it (docs/site.md D3, item 4; tests/paper.spec.ts).
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
    <Tag
      className={cn(
        'flex flex-col gap-[var(--gap-group)] border border-border bg-canvas p-[var(--site-gap)]',
        className,
      )}
    >
      <h3 className="text-site-title font-semibold text-text-primary">{title}</h3>
      {lead ? <p className="text-site-small text-text-secondary">{lead}</p> : null}
      {children}
    </Tag>
  );
}
