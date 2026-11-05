// The Kasane app's script: Kasane's people, its agents, its channels and their checks.
// The data is in apps/demo/data/, written by scripts/export-fixtures.mjs from the full Kasane
// dataset, which is not in this repository. Kasane Corporation is fictional.

import checksData from '../../data/checks.json' with { type: 'json' };
import closeData from '../../data/close.json' with { type: 'json' };
import company from '../../data/company.json' with { type: 'json' };
import documentsData from '../../data/documents.json' with { type: 'json' };
import peopleData from '../../data/people.json' with { type: 'json' };

export const kasaneCompany = company;

export type Person = {
  key: string;
  id: string;
  name: string;
  shortName: string;
  title: string;
  entity: string;
  email: string;
  initials: string;
  handle: string;
};

/** The people in the script, by role: `visitor`, `apLead`, `fpaHead`… */
export const people: Record<string, Person> = peopleData;

/** The visitor plays this person. */
export const visitor = people.visitor;

export const close = closeData;

export type Channel = (typeof close.channels)[number];
export type ChannelId = 'close' | 'cash' | 'receivables' | 'payables' | 'revenue' | 'intercompany';

export const channels = close.channels as (Channel & { id: ChannelId })[];

export type Exception = Omit<(typeof close.exceptions)[number], 'channel'> & { channel: ChannelId };

/** The findings, the hero first. Each is a task, raised by one agent, and sits in one channel. */
export const exceptions = close.exceptions as Exception[];

/** The task Tasks' panel shows. Nothing chosen, or a task that doesn't exist: the hero, which is first. */
export const selectedTask = (id?: string): Exception => exceptions.find((e) => e.id === id) ?? exceptions[0];

/** The agents are members like any other, each keyed by its role: `cutoff-ai`… */
export const agents = close.agents;
export type Agent = (typeof agents)[number];

/** A member of a channel or a direct message: a person, or an agent. */
export type Member = { kind: 'person'; person: Person } | { kind: 'agent'; agent: Agent };

export function member(key: string): Member | null {
  const agent = agents.find((a) => a.key === key);
  if (agent) return { kind: 'agent', agent };
  const person = people[key];
  return person ? { kind: 'person', person } : null;
}

/** A member's display name: the person's full name, or the agent's. */
export function memberName(key: string): string {
  const m = member(key);
  if (!m) throw new Error(`No member "${key}" in close.json or people.json`);
  return m.kind === 'agent' ? m.agent.name : m.person.name;
}

export const directMessages = close.directMessages;

export const checks = checksData;

export type TableColumn = { name: string; style?: 'id' | 'figure' };
export type DocumentTable = {
  rowCount: number;
  columnCount: number;
  /** Set when the extract is every row for one party, not a run of the file. */
  rowsFor?: string;
  columns: TableColumn[];
  rows: string[][];
};
export type DocumentText = { section?: string; firstLine: number; lineCount: number; lines: string[] };
/** A file the agents read, with a trimmed extract: `text` or `table`, never both. It knows nothing about the findings. */
export type SourceDocument = {
  slug: string;
  file: string;
  about: string;
  size: number;
  text?: DocumentText;
  table?: DocumentTable;
};

export const documents = documentsData as SourceDocument[];

export function documentOf(slug: string): SourceDocument {
  const found = documents.find((d) => d.slug === slug);
  if (!found) throw new Error(`${slug} isn't in documents.json`);
  return found;
}

/** The documents a finding rests on, in its order. */
export const docsOf = (e: Exception): string[] => e.refs.map((r) => r.doc);

/** The findings that rest on a document, for its way back. */
export const usedBy = (slug: string): Exception[] => exceptions.filter((e) => docsOf(e).includes(slug));

export type Ref = { doc: string; lines?: number[]; rows?: number[] };

/** Where a finding points into a document. None: browsing to the file selects nothing. */
export const refOf = (item: string | undefined, slug: string): Ref | undefined =>
  exceptions.find((e) => e.id === item)?.refs.find((r) => r.doc === slug);

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "September", from the last closed period, `2026-09`. */
export const lastClosedMonth = MONTHS[Number(company.lastClosedPeriod.slice(5)) - 1];
