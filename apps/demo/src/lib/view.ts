import { useSyncExternalStore, type MouseEvent } from 'react';

import { channels, directMessages, type ChannelId } from './kasane';

/**
 * What the main area shows. Views live in the URL with no router, as Part 1's
 * steps did:
 *
 *   ?view=sep-close (default) · ?view=open-items · ?view=rev-check · ?view=home
 *   ?dm=agent · ?dm=controller · ?dm=apLead
 *   ?at=end, with any of them: the end state, for screenshots and sharing
 *
 * Every view is a real URL, so a sidebar item is a link: it opens in a new tab,
 * copies, and reads as navigation to a screen reader.
 */
export type View = { kind: 'channel'; channel: ChannelId } | { kind: 'home' } | { kind: 'dm'; member: string };

const DEFAULT_CHANNEL: ChannelId = 'sep-close';
export const DEFAULT_VIEW: View = { kind: 'channel', channel: DEFAULT_CHANNEL };

export function parseView(search: string): View {
  const params = new URLSearchParams(search);
  const dm = params.get('dm');
  if (dm && directMessages.includes(dm)) return { kind: 'dm', member: dm };
  const view = params.get('view');
  if (view === 'home') return { kind: 'home' };
  const channel = channels.find((c) => c.id === view);
  return channel ? { kind: 'channel', channel: channel.id } : DEFAULT_VIEW;
}

/** `?at=end`: open on the end state rather than at landing. */
export function parseAtEnd(search: string): boolean {
  return new URLSearchParams(search).get('at') === 'end';
}

export function hrefFor(view: View): string {
  if (view.kind === 'dm') return `?dm=${view.member}`;
  if (view.kind === 'home') return '?view=home';
  return view.channel === DEFAULT_CHANNEL ? '/' : `?view=${view.channel}`;
}

export function sameView(a: View, b: View): boolean {
  return hrefFor(a) === hrefFor(b);
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

export function navigate(view: View) {
  if (sameView(parseView(window.location.search), view)) return;
  window.history.pushState(null, '', hrefFor(view));
  window.dispatchEvent(new Event(NAVIGATE));
}

/**
 * The click handler for a link to a view. A plain click stays in the page; a
 * modified click (new tab, new window) is left to the browser.
 */
export function onViewLinkClick(view: View) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(view);
  };
}
