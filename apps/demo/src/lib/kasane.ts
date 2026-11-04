// The Kasane app's script: Kasane's people, its agents, its channels and their checks.
// The data is in apps/demo/data/, written by scripts/export-fixtures.mjs from the full Kasane
// dataset, which is not in this repository. Kasane Corporation is fictional.

import checksData from '../../data/checks.json' with { type: 'json' };
import closeData from '../../data/close.json' with { type: 'json' };
import company from '../../data/company.json' with { type: 'json' };
import findingsData from '../../data/findings.json' with { type: 'json' };
import pack from '../../data/pack.json' with { type: 'json' };
import peopleData from '../../data/people.json' with { type: 'json' };
import sourcesData from '../../data/sources.json' with { type: 'json' };

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

/** The contradictions, the hero first. Each is a task, raised by one agent, and sits in one channel. */
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

/** A file in Kasane's pack: its name and size, for a `Sources` row. No contents. */
export function packFile(name: string): { name: string; bytes: number } | undefined {
  return pack.find((f) => f.name === name);
}

export type TableExcerpt = {
  type: 'table';
  count: string;
  columns: { key: string; mono?: boolean; numeric?: boolean }[];
  rows: Record<string, string>[];
  citedRows: number[];
};
export type TextExcerpt = { type: 'text'; count: string; lines: { n: number; text: string; cited?: boolean }[] };
export type BinderSource = {
  id: string;
  name: string;
  kind: string;
  covers: string;
  total: { count: number; unit: string } | null;
  records: string[];
  excerpt: TableExcerpt | TextExcerpt | null;
};

/** The binder: every file a finding, gap or question cites, or an agent reads (`sources.json`). */
export const binder = sourcesData as BinderSource[];

/** The findings that cite a file, for its exhibit's way back. A gap or question names files too, but isn't a finding. */
export const citedBy = (name: string): Exception[] => exceptions.filter((e) => e.sources.includes(name));

/** A file's exhibit ID: "S-17". The export puts every cited file in the binder, so one that isn't is a bug. */
export function exhibitOf(name: string): string {
  const source = binder.find((s) => s.name === name);
  if (!source) throw new Error(`${name} isn't in sources.json`);
  return source.id;
}

export const findings: {
  contradictions: { id: string; claim: string; evidence: string; sources: string[] }[];
  gaps: { id: string; text: string; sources: string[] }[];
  followUps: { id: string; text: string; sources: string[] }[];
} = findingsData;

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
