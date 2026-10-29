import { CaretRightIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { cn } from '../../../lib/utils';
import { Button } from '../../foundational/Button';
import { IconButton } from '../../foundational/IconButton';
import { StatusBadge } from '../StatusBadge';
import type { RunStatus } from '../StatusBadge/statuses';

export type LineageNode = {
  id: string;
  name: string;
  status?: RunStatus;
  /** Free text beside the name — row count, materialization, schema. */
  meta?: React.ReactNode;
  children?: LineageNode[];
};

export type LineageTreeProps = {
  nodes: LineageNode[];
  /** Ids expanded initially. Omit to expand everything. */
  defaultExpanded?: string[];
  selectedId?: string;
  onSelect?: (node: LineageNode) => void;
  className?: string;
};

/**
 * LineageTree — product. Nested dbt dependencies.
 *
 * 24px rows (`--h-row-xs`) with **12px of indent per level**
 * (`--gap-tree-indent`). 12px is enough to read the nesting and tight enough
 * that a six-deep lineage still fits a panel — at 16px it would not.
 *
 * Renders nested lists, so depth is announced rather than being purely
 * visual: a screen reader names each list's nesting level. Indentation alone
 * tells it nothing. Not `role="tree"`: that role promises one tab stop and
 * arrow-key movement, which this does not implement. Each caret is a
 * disclosure button carrying `aria-expanded`, and the selected node's name
 * carries `aria-current`. See the README.
 *
 * Status is optional per node and comes from `StatusBadge`; the tree does not
 * decide what a failed model looks like.
 */
function LineageTree({ nodes, defaultExpanded, selectedId, onSelect, className }: LineageTreeProps) {
  const allIds = collectIds(nodes);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(defaultExpanded ?? allIds));

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    // role="list": Preflight's `list-style: none` drops list semantics in
    // Safari, and the nesting level is the point.
    <ul role="list" data-slot="lineage-tree" className={cn('w-full', className)}>
      {nodes.map((node) => (
        <LineageBranch
          key={node.id}
          node={node}
          depth={0}
          expanded={expanded}
          toggle={toggle}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

function LineageBranch({
  node,
  depth,
  expanded,
  toggle,
  selectedId,
  onSelect,
}: {
  node: LineageNode;
  depth: number;
  expanded: Set<string>;
  toggle: (id: string) => void;
  selectedId?: string;
  onSelect?: (node: LineageNode) => void;
}) {
  const hasChildren = !!node.children?.length;
  const isOpen = expanded.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <li>
      <div
        className={cn(
          'flex h-[var(--h-row-xs)] items-center gap-[var(--gap-control-icon)]',
          'pr-[var(--pad-cell-x)] text-sm',
          'hover:bg-bg-hover',
          // Selection is the interactive role (§4) — no --color-bg-selected.
          isSelected && 'bg-bg-interactive',
        )}
        style={{
          // Indent scales with depth, so it cannot be a static utility.
          paddingLeft: `calc(var(--pad-cell-x) + ${depth} * var(--gap-tree-indent))`,
        }}
      >
        {hasChildren ? (
          // `inline`: the row sets the grid, so the caret box is the icon
          // scale, not --h-control. No tooltip: the row already shows the name.
          <IconButton
            variant="inline"
            tooltip={false}
            aria-expanded={isOpen}
            onClick={() => toggle(node.id)}
            aria-label={isOpen ? `Collapse ${node.name}` : `Expand ${node.name}`}
            className={cn(
              'size-[var(--size-icon-sm)] rounded-xs text-text-tertiary hover:text-text-body',
              'focus-visible:outline-offset-[-2px]',
            )}
          >
            <CaretRightIcon
              weight="bold"
              aria-hidden="true"
              className={cn('size-[var(--size-icon-xs)] transition-transform', isOpen && 'rotate-90')}
            />
          </IconButton>
        ) : (
          // A leaf has nothing to expand: a spacer keeps the names aligned,
          // and there is no control to tab past.
          <span aria-hidden="true" className="size-[var(--size-icon-sm)] shrink-0" />
        )}

        <Button
          variant="inline"
          aria-current={isSelected ? 'true' : undefined}
          onClick={() => onSelect?.(node)}
          className={cn(
            // `shrink` beats Button's shrink-0, or the name never truncates.
            'min-w-0 flex-1 shrink justify-start gap-[var(--gap-control-icon)] rounded-xs text-left',
            'focus-visible:outline-offset-[-2px]',
          )}
        >
          {/* §8.3 — identifiers in mono, one step below adjacent sans. */}
          <span className={cn('truncate font-mono text-xs', isSelected ? 'text-text-primary' : 'text-text-body')}>
            {node.name}
          </span>
          {node.meta ? <span className="shrink-0 text-xs text-text-secondary">{node.meta}</span> : null}
        </Button>

        {node.status ? <StatusBadge status={node.status} /> : null}
      </div>

      {hasChildren && isOpen ? (
        <ul role="list">
          {node.children!.map((child) => (
            <LineageBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              toggle={toggle}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function collectIds(nodes: LineageNode[]): string[] {
  return nodes.flatMap((n) => [n.id, ...(n.children ? collectIds(n.children) : [])]);
}

export { LineageTree };
