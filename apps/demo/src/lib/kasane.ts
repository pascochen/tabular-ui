// The Kasane app's script: Kasane's people, its agents, its channels and their checks.
// The data is in apps/demo/data/, written by scripts/export-fixtures.mjs from the full Kasane
// dataset, which is not in this repository. Kasane Corporation is fictional.
//
// Five files: the workspace, its members, their checks, the items the checks raised, and the
// documents they read. This module is the only one that imports them, and it hands the screens
// the shapes they were written against: an agent with its check, a `close` with its decision.

import checksData from '../../data/checks.json' with { type: 'json' };
import documentsData from '../../data/documents.json' with { type: 'json' };
import itemsData from '../../data/items.json' with { type: 'json' };
import membersData from '../../data/members.json' with { type: 'json' };
import workspace from '../../data/workspace.json' with { type: 'json' };

const { company, ...script } = workspace;

export const kasaneCompany = company;

export type Person = {
  key: string;
  id: string;
  name: string;
  shortName: string;
  title: string;
  entity: string;
  email: string;
  /** One letter: the first of the name. */
  initials: string;
  /** Position in the member list, from 1. `Avatar` turns it into an identity ground. */
  identity: number;
};

/** A question an agent suggests, with the answer it gives and what that rests on. */
type Starter = { question: string; answer: string; sources: string[]; notChecked: string[] };
type AgentMember = { key: string; name: string; ask: string; starters: Starter[] };
/** `members.json`: people and agents in one list. */
const members = membersData as (({ kind: 'person' } & Person) | ({ kind: 'agent' } & AgentMember))[];
/** What `Tasks` and the close panel show of a check: its figure before and after the fix. */
type CheckFigure = {
  label: string;
  meaning: string;
  currency: string;
  before: number;
  after: number;
  beforeLabel: string;
  afterLabel: string;
};
/** One check an agent: its rule, the documents it reads, and the item it raised. */
type Check = { agent: string; rule: string; reads: string[]; raised: string; figure?: CheckFigure };
const agentChecks = checksData as Check[];

/** The people in the script, by role: `visitor`, `apLead`, `fpaHead`… */
export const people: Record<string, Person> = Object.fromEntries(
  members.flatMap((m) => (m.kind === 'person' ? [[m.key, m]] : [])),
);

/** The visitor plays this person. */
export const visitor = people.visitor;

/** The agents are members like any other, each keyed by its role: `cutoff-ai`… Each carries its check. */
export const agents = members.flatMap((m) => {
  if (m.kind !== 'agent') return [];
  const check = agentChecks.find((c) => c.agent === m.key);
  if (!check) throw new Error(`No check for ${m.key} in checks.json`);
  return [{ ...m, checks: check.rule, reads: check.reads, finding: check.raised }];
});
export type Agent = (typeof agents)[number];

/** The checks the close panel shows a figure for, each under the id of the item it raised. */
export const checks = agentChecks.flatMap((c) => (c.figure ? [{ id: c.raised, ...c.figure }] : []));

/** The one item with a decision: what the agent asks, the two answers, and what each would do. */
const decided = itemsData.find((i) => 'decision' in i && i.decision);
if (!decided?.decision) throw new Error('No item in items.json has a decision');

/** The workspace's script, the items as `exceptions`, and the decision as `hero`, under the item it belongs to. */
export const close = {
  ...script,
  agents,
  exceptions: itemsData,
  hero: { exception: decided.id, ...decided.decision },
};

export type Channel = (typeof close.channels)[number];
export type ChannelId = 'close' | 'receivables' | 'payables' | 'revenue';

export const channels = close.channels as (Channel & { id: ChannelId })[];

export type Exception = Omit<(typeof close.exceptions)[number], 'channel'> & { channel: ChannelId };

/** The findings, the hero first. Each is a task, raised by one agent, and sits in one channel. */
export const exceptions = close.exceptions as Exception[];

/**
 * The task Tasks' panel shows. Nothing chosen: the hero, which is first. An id
 * that matches no task selects nothing: showing the hero for it would say the
 * link chose a task it didn't.
 */
export const selectedTask = (id?: string): Exception | undefined =>
  id === undefined ? exceptions[0] : exceptions.find((e) => e.id === id);

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
  if (!m) throw new Error(`No member "${key}" in members.json`);
  return m.kind === 'agent' ? m.agent.name : m.person.name;
}

export const directMessages = close.directMessages;

/** A figure as a `MetricTile` shows it, formatted by the export. */
export type DmTile = {
  label: string;
  value: string;
  /** With its number or not at all, as `MetricTile` takes it. A figure with nothing to compare has neither. */
  delta?: string;
  deltaValue?: number;
  /** False where a rise is bad news: days outstanding, a share past due. */
  higherIsBetter?: boolean;
  caption: string;
};
/** One company's receivables by age, in yen. The three ages add up to `total`. */
export type AgingFigures = { notDue: number; days1to60: number; over60: number; total: number };
/** What a direct message carries under its text. The export resolves each from the data. */
export type DmBlock =
  | { type: 'tiles'; tiles: DmTile[] }
  | { type: 'bridge'; rows: { id: string; label: string; yen: number }[]; total: { label: string; yen: number } }
  | {
      type: 'entries';
      currency: string;
      rows: {
        entry: string;
        date: string;
        description: string;
        amount: string;
        payment: string;
        paidOn: string;
        duplicate: boolean;
      }[];
    }
  | { type: 'code'; language: 'sql'; label: string; code: string }
  /** A finding's files, as its card lists them. */
  | { type: 'sources'; finding: string }
  /** `bytes` only for a file the dataset holds: an invented one has no size to state. */
  | { type: 'attachment'; name: string; bytes?: number }
  | { type: 'thread'; finding: string }
  /** External receivables by company and age. `total` is the file's own, so the table can check its rows against it. */
  | { type: 'aging'; rows: (AgingFigures & { entity: string })[]; total: AgingFigures }
  /** One customer's month-end balance against its credit limit. `over` is negative while it is within the limit. */
  | {
      type: 'limitHistory';
      customer: string;
      currency: string;
      limit: number;
      rows: { month: string; balance: number; over: number }[];
    }
  /** One payment run a company, each in its own currency, so the amounts are never added. */
  | {
      type: 'paymentRuns';
      rows: { entity: string; method: string; payments: number; amount: number; currency: string }[];
    }
  /** A supplier's invoice number, each entry of it, and the payment against each. */
  | {
      type: 'paymentTrail';
      finding: string;
      number: string;
      supplier: string;
      entries: {
        entry: string;
        entered: string;
        amount: string;
        payment: string;
        paidOn: string;
        method: string;
        duplicate: boolean;
      }[];
    }
  /** Where the close stands, as the close calendar states it. */
  | { type: 'calendar'; rows: { item: string; when: string; status: 'passed' | 'open' | 'queued' }[] }
  /** An agent's rule over the manual entries, one row a company. No entries: the rule didn't run there. */
  | { type: 'controlRun'; rows: { entity: string; entries: number; failed: { entry: string; by: string }[] }[] };
export type DmReply = { author: string; at: string; text: string };
export type DmMessage = DmReply & { blocks: DmBlock[]; replies: DmReply[] };

/** Each direct message's history before the visitor lands, by member. */
export const conversations = close.conversations as Record<string, DmMessage[]>;

/**
 * What was said in a channel before the visitor lands, beside its finding. A
 * channel with none has no entry. An author is a person or an agent.
 */
export const channelHistory = close.channelHistory as Partial<Record<ChannelId, DmMessage[]>>;

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
