import { createElement, type ReactElement } from 'react';
import type { Source } from 'tabular-ui';

import { documentOf, type Exception } from './kasane';
import { hrefFor, onViewLinkClick, type View } from './view';

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('en-US')} KB`;

/** A link to a view as an element, for a component's `render` slot: it stays in the page, and a modified click doesn't. */
const linkTo = (view: View) =>
  createElement('a', { href: hrefFor(view), onClick: onViewLinkClick(view) }) as ReactElement<{ className?: string }>;

/** A document's view, with one finding's records selected when given. */
export const documentView = (slug: string, item?: string): View => ({ kind: 'sources', source: slug, item });

/** A document as a `Sources` row. Its name links to the file, at the finding's records when given. */
export function sourceRow(slug: string, item?: string): Source {
  const doc = documentOf(slug);
  return { id: slug, name: doc.file, size: kb(doc.size), render: linkTo(documentView(slug, item)) };
}

export const sourcesOfSlugs = (slugs: readonly string[]): Source[] => slugs.map((slug) => sourceRow(slug));

/** A finding's documents as `Sources` rows, each opening at what the finding rests on. */
export const sourcesOf = (e: Exception): Source[] => e.refs.map((r) => sourceRow(r.doc, e.id));
