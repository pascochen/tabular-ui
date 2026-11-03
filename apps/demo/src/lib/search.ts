// Client-side matching over the fixtures (pages spec §5). Case-insensitive, anywhere in the text. No
// ranking beyond the groups, and no answer: results are places to go, each with its view.

import type { CloseState } from './close-state';
import {
  binder,
  channels,
  close,
  directMessages,
  exceptions,
  memberName,
  people,
  type BinderSource,
  type TableExcerpt,
} from './kasane';
import type { View } from './view';

export type SearchGroup = 'Tasks' | 'Sources' | 'Messages' | 'People';
export const SEARCH_GROUPS: readonly SearchGroup[] = ['Tasks', 'Sources', 'Messages', 'People'];

export type SearchResult = {
  group: SearchGroup;
  key: string;
  title: string;
  detail: string;
  view: View;
  /** A message to land on, in the view. */
  hash?: string;
};

const tableRows = (s: BinderSource) => (s.excerpt as TableExcerpt).rows;

const matches = (q: string, ...texts: (string | undefined)[]) =>
  texts.some((text) => text?.toLowerCase().includes(q.toLowerCase()));

/** Where a person is: their direct message if they have one, else the first channel they belong to or own. */
function viewOfPerson(key: string): View {
  if (directMessages.includes(key)) return { kind: 'dm', member: key };
  const channel = channels.find((c) => c.members.includes(key) || c.owner === key)!;
  return { kind: 'channel', channel: channel.id };
}

/**
 * Everything matching `q`, in the groups' order. Messages are read from the store,
 * so a reply that hasn't landed yet isn't found, and a post the visitor has written
 * is. A blank query finds nothing.
 */
export function search(state: CloseState, query: string): SearchResult[] {
  const q = query.trim();
  if (!q) return [];
  const results: SearchResult[] = [];

  for (const e of exceptions) {
    if (matches(q, e.title, e.summary)) {
      results.push({
        group: 'Tasks',
        key: e.id,
        title: e.title,
        detail: e.summary,
        view: { kind: 'tasks', task: e.id },
      });
    }
  }

  for (const s of binder) {
    // A cited record is found by anything in its row, as a supplier's own invoice number.
    const citedValues =
      s.excerpt?.type === 'table' ? s.excerpt.citedRows.flatMap((i) => Object.values(tableRows(s)[i])) : [];
    const inRecord = matches(q, ...s.records, ...citedValues);
    if (matches(q, s.id, s.name) || inRecord) {
      results.push({
        group: 'Sources',
        key: s.id,
        title: `${s.id}, ${s.name}`,
        detail: inRecord ? s.records.join(' and ') : s.covers,
        view: {
          kind: 'sources',
          source: s.id,
          record: inRecord ? (s.records.find((r) => matches(q, r)) ?? s.records[0]) : undefined,
        },
      });
    }
  }

  for (const e of exceptions) {
    const channel: View = { kind: 'channel', channel: e.channel };
    const hash = `#${e.id}`;
    if (matches(q, e.summary)) {
      results.push({
        group: 'Messages',
        key: `${e.id}-message`,
        title: `${memberName(e.agent)} in #${e.channel}, ${e.postedAt}`,
        detail: e.summary,
        view: channel,
        hash,
      });
    }
    state.exceptions[e.id].replies.forEach((r, i) => {
      if (matches(q, r.text)) {
        results.push({
          group: 'Messages',
          key: `${e.id}-reply-${i}`,
          title: `${memberName(r.author)} in #${e.channel}, ${r.at}`,
          detail: r.text,
          view: channel,
          hash,
        });
      }
    });
  }

  // The hero's question is a message too, in its thread.
  const hero = exceptions.find((e) => e.id === close.hero.exception)!;
  if (matches(q, close.hero.question, close.hero.basis)) {
    results.push({
      group: 'Messages',
      key: 'hero-question',
      title: `${memberName(hero.agent)} in #${hero.channel}, ${close.hero.askedAt}`,
      detail: close.hero.question,
      view: { kind: 'channel', channel: hero.channel },
      hash: `#${hero.id}`,
    });
  }

  // What the visitor wrote, in a channel or to an agent.
  state.posts.forEach((p, i) => {
    if (!matches(q, p.text)) return;
    const channel = channels.find((c) => c.id === p.where);
    results.push({
      group: 'Messages',
      key: `post-${i}`,
      title: `${memberName('visitor')} in ${channel ? `#${channel.name}` : memberName(p.where)}, ${p.at}`,
      detail: p.text,
      view: channel ? { kind: 'channel', channel: channel.id } : { kind: 'dm', member: p.where },
    });
  });

  for (const [key, person] of Object.entries(people)) {
    if (matches(q, person.name, person.title)) {
      results.push({ group: 'People', key, title: person.name, detail: person.title, view: viewOfPerson(key) });
    }
  }

  return results;
}
