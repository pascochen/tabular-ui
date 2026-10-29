// The close demo's script: Kasane's people, the #sep-close channel and its checks.
// The data is in apps/demo/data/, written by scripts/export-fixtures.mjs from the full Kasane
// dataset, which is not in this repository. Kasane Corporation is fictional.

import checksData from '../../data/checks.json' with { type: 'json' };
import closeData from '../../data/close.json' with { type: 'json' };
import company from '../../data/company.json' with { type: 'json' };
import findingsData from '../../data/findings.json' with { type: 'json' };
import pack from '../../data/pack.json' with { type: 'json' };
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

/** The people in the script, by role: `visitor`, `controller`, `apLead`… */
export const people: Record<string, Person> = peopleData;

/** The visitor plays this person. */
export const visitor = people.visitor;

export const close = closeData;

export type Channel = (typeof close.channels)[number];
export type ChannelId = 'sep-close' | 'open-items' | 'rev-check';

export const channels = close.channels as (Channel & { id: ChannelId })[];

/** The agent is a member like any other, keyed `agent`. */
export const agent = close.agent;

/** A member of a channel or a direct message: a person, or the agent. */
export type Member = { kind: 'person'; person: Person } | { kind: 'agent' };

export function member(key: string): Member | null {
  if (key === 'agent') return { kind: 'agent' };
  const person = people[key];
  return person ? { kind: 'person', person } : null;
}

/** A member's display name: the person's full name, or the agent's. */
export function memberName(key: string): string {
  const m = member(key);
  if (!m) throw new Error(`No member "${key}" in close.json or people.json`);
  return m.kind === 'agent' ? agent.name : m.person.name;
}

export const directMessages = close.directMessages;

export const checks = checksData;

/** A file in Kasane's pack: its name and size, for a `Sources` row. No contents. */
export function packFile(name: string): { name: string; bytes: number } | undefined {
  return pack.find((f) => f.name === name);
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
