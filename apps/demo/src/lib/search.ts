// Client-side matching over the fixtures (pages spec §5). Case-insensitive, anywhere in the text. No
// ranking beyond the groups, and no answer: results are places to go, each with its view.

import type { CloseState } from './close-state';
import {
  channels,
  conversations,
  close,
  directMessages,
  documents,
  exceptions,
  memberName,
  people,
  type Ref,
  type SourceDocument,
} from './kasane';
import { NEW_CHAT } from './new-chat';
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

const matches = (q: string, ...texts: (string | undefined)[]) =>
  texts.some((text) => text?.toLowerCase().includes(q.toLowerCase()));

/** A document's extract as lines of text: a table's rows, or a text file's lines. */
const extractLines = (doc: SourceDocument): string[][] =>
  doc.table ? doc.table.rows : (doc.text?.lines ?? []).map((line) => [line]);

/** What a finding's ref selects in a document, as lines of `extractLines`. */
function selected(doc: SourceDocument, ref: Ref): string[][] {
  if (ref.rows) return ref.rows.map((i) => doc.table!.rows[i]);
  const [from, to] = ref.lines!;
  const first = doc.text!.firstLine;
  return doc.text!.lines.slice(from - first, to - first + 1).map((line) => [line]);
}

/** Where a person is: their direct message if they have one, else the first channel they belong to. */
function viewOfPerson(key: string): View {
  if (directMessages.includes(key)) return { kind: 'dm', member: key };
  const channel = channels.find((c) => c.members.includes(key))!;
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

  for (const doc of documents) {
    // Anything in the extract finds the file, as a supplier's own invoice number. Inside a finding's
    // records, it opens with that finding's records selected.
    const inExtract = extractLines(doc).some((line) => matches(q, ...line));
    if (!matches(q, doc.file, doc.about) && !inExtract) continue;
    const owner = exceptions.find((e) =>
      e.refs.some((r) => r.doc === doc.slug && selected(doc, r).some((line) => matches(q, ...line))),
    );
    results.push({
      group: 'Sources',
      key: doc.slug,
      title: doc.file,
      detail: owner ? owner.title : doc.about,
      view: { kind: 'sources', source: doc.slug, item: owner?.id },
    });
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

  // What was said in each direct message before landing, replies included.
  for (const [key, messages] of Object.entries(conversations)) {
    const dm: View = { kind: 'dm', member: key };
    messages
      .flatMap((m) => [m, ...m.replies])
      .forEach((m, i) => {
        if (!matches(q, m.text)) return;
        results.push({
          group: 'Messages',
          key: `dm-${key}-${i}`,
          // "Mei Tachibana in Mei Tachibana" says nothing: the place is the pair.
          title:
            m.author === key
              ? `${memberName(key)}, direct message, ${m.at}`
              : `${memberName(m.author)} to ${memberName(key)}, ${m.at}`,
          detail: m.text,
          view: dm,
        });
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

  // What the visitor wrote: in a channel, to an agent, or in New chat.
  state.posts.forEach((p, i) => {
    if (!matches(q, p.text)) return;
    const channel = channels.find((c) => c.id === p.where);
    const inNewChat = p.where === NEW_CHAT;
    const place = inNewChat ? 'New chat' : channel ? `#${channel.name}` : memberName(p.where);
    results.push({
      group: 'Messages',
      key: `post-${i}`,
      title: `${memberName('visitor')} in ${place}, ${p.at}`,
      detail: p.text,
      view: inNewChat
        ? { kind: 'new-chat' }
        : channel
          ? { kind: 'channel', channel: channel.id }
          : { kind: 'dm', member: p.where },
    });
  });

  for (const [key, person] of Object.entries(people)) {
    if (matches(q, person.name, person.title)) {
      results.push({ group: 'People', key, title: person.name, detail: person.title, view: viewOfPerson(key) });
    }
  }

  return results;
}
