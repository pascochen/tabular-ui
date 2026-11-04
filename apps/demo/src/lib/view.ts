import { useSyncExternalStore, type MouseEvent } from 'react';

import { directMessages, type ChannelId } from './kasane';

/**
 * What the main area shows. Views live in the URL with no router, as Part 1's
 * steps did:
 *
 *   ?view=revenue (default, `/`) and the other channels
 *   ?view=tasks · ?view=tasks&task=revenue-cut-off
 *   ?view=sources · ?view=sources&source=S-17&record=INV-KJP-2609-00363
 *   ?view=search · ?view=search&q=cut-off
 *   ?dm=fpaHead · ?dm=apLead · ?dm=cutoff-ai
 *   ?at=end, with any of them: the end state, for screenshots and sharing
 *
 * Every view is a real URL, so a sidebar item is a link: it opens in a new tab,
 * copies, and reads as navigation to a screen reader.
 *
 * Only built views are reachable: a view that only says it isn't built yet is
 * a dead end (docs/reviews/demo-first-pass-2026-10-30.md, issue 1). Old URLs
 * (?view=sep-close, ?view=rev-check) open the default.
 */
export type View =
  | { kind: 'channel'; channel: ChannelId }
  | { kind: 'dm'; member: string }
  | { kind: 'tasks'; task?: string }
  | { kind: 'sources'; source?: string; record?: string }
  | { kind: 'search'; q?: string };

/** The channels a visitor can open, in sidebar order. */
export const BUILT_CHANNELS: readonly ChannelId[] = ['revenue', 'open-items'];

/** The places above the channels that are built, in sidebar order. */
export const BUILT_PLACES: readonly ('search' | 'tasks' | 'sources')[] = [];

const DEFAULT_CHANNEL: ChannelId = 'revenue';
export const DEFAULT_VIEW: View = { kind: 'channel', channel: DEFAULT_CHANNEL };

export function parseView(search: string): View {
  const params = new URLSearchParams(search);
  const dm = params.get('dm');
  if (dm && directMessages.includes(dm)) return { kind: 'dm', member: dm };
  const view = params.get('view');
  if (view === 'tasks' && BUILT_PLACES.includes('tasks')) {
    return { kind: 'tasks', task: params.get('task') ?? undefined };
  }
  if (view === 'sources' && BUILT_PLACES.includes('sources')) {
    return { kind: 'sources', source: params.get('source') ?? undefined, record: params.get('record') ?? undefined };
  }
  if (view === 'search' && BUILT_PLACES.includes('search')) {
    return { kind: 'search', q: params.get('q') ?? undefined };
  }
  const channel = BUILT_CHANNELS.find((c) => c === view);
  return channel ? { kind: 'channel', channel } : DEFAULT_VIEW;
}

/** `?at=end`: open on the end state rather than at landing. */
export function parseAtEnd(search: string): boolean {
  return new URLSearchParams(search).get('at') === 'end';
}

const query = (entries: Record<string, string | undefined>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(entries)) if (value) params.set(key, value);
  return `?${params.toString()}`;
};

export function hrefFor(view: View): string {
  switch (view.kind) {
    case 'dm':
      return query({ dm: view.member });
    case 'tasks':
      return query({ view: 'tasks', task: view.task });
    case 'sources':
      return query({ view: 'sources', source: view.source, record: view.record });
    case 'search':
      return query({ view: 'search', q: view.q });
    case 'channel':
      return view.channel === DEFAULT_CHANNEL ? '/' : query({ view: view.channel });
  }
}

export function sameView(a: View, b: View): boolean {
  return hrefFor(a) === hrefFor(b);
}

/** The sidebar item a view belongs to, whatever it has selected inside: a task, a record, a query. */
export function placeOf(view: View): string {
  switch (view.kind) {
    case 'channel':
      return view.channel;
    case 'dm':
      return `dm:${view.member}`;
    default:
      return view.kind;
  }
}

// The URL is the store: a navigation pushes history and tells subscribers.
const NAVIGATE = 'demo:navigate';
const subscribe = (onChange: () => void) => {
  window.addEventListener('popstate', onChange);
  window.addEventListener(NAVIGATE, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(NAVIGATE, onChange);
  };
};
const getSearch = () => window.location.search;

/** The current view, live: following a link or pressing Back re-renders. */
export function useView(): View {
  return parseView(useSyncExternalStore(subscribe, getSearch, () => ''));
}

/** Goes to a view. `hash` lands on a message in it (`useExceptionLink`). */
export function navigate(view: View, hash = '') {
  if (sameView(parseView(window.location.search), view) && !hash) return;
  window.history.pushState(null, '', `${hrefFor(view)}${hash}`);
  window.dispatchEvent(new Event(NAVIGATE));
}

/**
 * The click handler for a link to a view. A plain click stays in the page; a
 * modified click (new tab, new window) is left to the browser.
 */
export function onViewLinkClick(view: View, hash = '') {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(view, hash);
  };
}
