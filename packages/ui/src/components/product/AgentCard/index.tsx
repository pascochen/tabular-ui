import { cloneElement, isValidElement } from 'react';
// From Phosphor's types file, not the package root: see `AttachmentRow`.
import type { Icon } from '@phosphor-icons/react/dist/lib/types';

import { cn } from '../../../lib/utils';
import { buttonVariants } from '../../foundational/Button/variants';

export type AgentCardProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  /** The agent's glyph, the one its avatar and its sidebar row draw. */
  icon: Icon;
  /** The agent's name. It is the card's link when `href` or `render` is given. */
  name: string;
  /** Makes the name a link to the agent. */
  href?: string;
  /** Swap the `<a>` for a router link: `render={<Link to="/agents/1" />}`. */
  render?: React.ReactElement<{ className?: string }>;
  /** What the agent checks, as one sentence. */
  rule: React.ReactNode;
  /** One quiet line under the rule: "Reads 3 files". */
  meta?: React.ReactNode;
  /**
   * What the agent found: `AgentCardFinding` rows, under a rule. This is where
   * the card takes a hue, and only for a state. Leave it out for an agent that
   * has raised nothing.
   */
  children?: React.ReactNode;
};

/**
 * AgentCard — product.
 *
 * One agent as an object: its glyph in a square tile, its name, the rule it
 * checks, and what it found. For a page that lists agents, where a reader
 * picks one out by its mark before reading a word.
 *
 * **Neutral, tile included.** An agent is no person, so it takes no identity
 * ground (§1 "Identity colour"), and a card about an agent is not something
 * the agent wrote, so it takes no orchid and no rail: that is `AgentBlock`'s
 * signal, and it means authorship. The glyph, a 1px box and the page's own
 * border are all the card draws. The only hue is the status of a finding in
 * `children`, which is a state (§0 rule 1).
 *
 * **The name is the link. The card is not wholly clickable**, for
 * `AttachmentRow`'s reasons: a stretched overlay eats text selection, and the
 * card holds a second link, to the finding.
 */
function AgentCard({ icon: Glyph, name, href, render, rule, meta, children, className, ...props }: AgentCardProps) {
  const linked = Boolean(href || render);
  const nameClassName = cn(
    'self-start text-sm font-medium',
    linked
      ? [
          // A link in running content: ink, underlined at rest (§1).
          'text-text-interactive underline decoration-1 underline-offset-2',
          'rounded-xs outline-none focus-visible:outline-ring',
          'focus-visible:outline-solid focus-visible:outline-[length:var(--ring-width)]',
          'focus-visible:outline-offset-[var(--ring-offset)]',
        ]
      : 'text-text-primary',
  );

  return (
    <div data-slot="agent-card" {...props} className={cn('flex flex-col rounded-md border border-border', className)}>
      <div className="flex flex-1 gap-[var(--gap-group)] p-[var(--pad-card)]">
        {/* 36px, the ceiling (§0 rule 5): the largest mark the density allows, a step over an avatar's 32px. */}
        <span
          data-slot="agent-card-tile"
          className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-text-primary"
        >
          {/* Above 16px the stroke follows the type beside it (§11.2): the name is 500. */}
          <Glyph weight="regular" aria-hidden="true" className="size-[var(--size-icon-lg)]" />
        </span>
        <div className="flex min-w-0 flex-col gap-[var(--gap-bonded)]">
          {isValidElement(render) ? (
            cloneElement(render, { className: cn(nameClassName, render.props.className) }, name)
          ) : href ? (
            <a href={href} className={nameClassName}>
              {name}
            </a>
          ) : (
            <span className={nameClassName}>{name}</span>
          )}
          <span className="text-sm text-text-body">{rule}</span>
          {meta ? <span className="text-xs text-text-secondary tabular-nums">{meta}</span> : null}
        </div>
      </div>
      {children ? (
        <div data-slot="agent-card-findings" className="flex flex-col border-t border-border">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export type AgentCardFindingProps = {
  /** The finding's title. It truncates before the status does. */
  title: string;
  /** A `StatusBadge`: whose move the finding is. */
  status?: React.ReactNode;
  /** Where the finding opens. */
  href?: string;
  /** Swap the `<a>` for a router link, or pass an `<a>` that carries its own `onClick`. */
  render?: React.ReactElement<{ className?: string }>;
  className?: string;
};

/**
 * One finding in an `AgentCard`'s footer: a link the width of the card, the
 * title at one end and its status at the other.
 *
 * A `ghost` button's shape on a real `<a>`, with the card's inset in place of
 * the control's: the link has a 1px transparent border of its own, so its
 * padding is `--pad-card` less that border, and the title starts where the
 * tile does (`agent-card.spec.ts`).
 */
function AgentCardFinding({ title, status, href, render, className }: AgentCardFindingProps) {
  const rowClassName = cn(
    buttonVariants({ variant: 'ghost' }),
    'w-full shrink justify-between font-normal text-text-body',
    'px-[calc(var(--pad-card)-var(--border-width))]',
    className,
  );
  const content = (
    <>
      <span className="min-w-0 truncate">{title}</span>
      {status}
    </>
  );
  return isValidElement(render) ? (
    cloneElement(
      render,
      { 'data-slot': 'agent-card-finding', className: cn(rowClassName, render.props.className) } as object,
      content,
    )
  ) : (
    <a data-slot="agent-card-finding" href={href} className={rowClassName}>
      {content}
    </a>
  );
}

export { AgentCard, AgentCardFinding };
