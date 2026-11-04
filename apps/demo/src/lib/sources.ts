import { createElement, type ReactElement } from 'react';
import type { Source } from 'tabular-ui';

import { exhibitOf, packFile, type Exception } from './kasane';
import { hrefFor, onViewLinkClick, type View } from './view';

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('en-US')} KB`;

/** A link to a view as an element, for a component's `render` slot: it stays in the page, and a modified click doesn't. */
const linkTo = (view: View) =>
  createElement('a', { href: hrefFor(view), onClick: onViewLinkClick(view) }) as ReactElement<{ className?: string }>;

/** The binder's view of one exhibit, on one record when given. */
export const exhibitView = (id: string, record?: string): View => ({ kind: 'sources', source: id, record });

/** A file as a `Sources` row: its name links to its exhibit, and its exhibit ID goes where a size would. */
export function sourceRow(name: string): Source {
  const id = exhibitOf(name);
  const file = packFile(name);
  return {
    id: name,
    name,
    size: file ? `${id}, ${kb(file.bytes)}` : id,
    render: linkTo(exhibitView(id)),
  };
}

export const sourcesOfNames = (names: readonly string[]): Source[] => names.map(sourceRow);

/** A finding's files as `Sources` rows, numbered in the order the finding cites them. */
export const sourcesOf = (e: Exception): Source[] => sourcesOfNames(e.sources);

/** What `InlineCitation` needs for one of a finding's citations: where in the file, and the link to that record. */
export function citationOf(e: Exception, index: number) {
  const c = e.citations[index];
  return { locator: c.locator, locatorRender: linkTo(exhibitView(c.exhibit, c.record)) };
}
