import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

/**
 * The close demo's generated data (apps/demo/data/close.json, people.json,
 * checks.json) must agree with the rest of the demo's data. The export script
 * checks each figure against the Kasane dataset, which isn't in this
 * repository. This checks what CI can see: that every id, file, person,
 * account and amount one file names exists in, and matches, the others.
 *
 * Nothing here needs a browser; it reads tracked files.
 */

const dataDir = path.resolve(import.meta.dirname, '../../demo/data');
const read = <T>(name: string): T => JSON.parse(readFileSync(path.join(dataDir, name), 'utf8')) as T;

type Line = { account: string; name: string; debit: number; credit: number };
type Reply = { author: string; text: string };
type Exception = {
  id: string;
  atLanding: 'open' | 'resolved';
  sources: string[];
  replies: Reply[];
  resolution?: { by: string; log: string };
  waiting?: { followUp: string };
  notChecked: string[];
};
type Close = {
  agent: { reads: string[]; setUpBy: string };
  channels: { id: string; members: string[] }[];
  directMessages: string[];
  exceptions: Exception[];
  hero: { exception: string; options: { id: string }[]; entry: { lines: Line[] } };
};

const close = read<Close>('close.json');
const people = read<Record<string, { name: string }>>('people.json');
const checks = read<{ id: string; before: number; after: number }[]>('checks.json');
const findings = read<{ contradictions: { id: string; evidence: string }[]; followUps: { id: string }[] }>(
  'findings.json',
);
const pack = new Set(read<{ name: string }[]>('pack.json').map((f) => f.name));
const members = new Set([...Object.keys(people), 'agent']);

test('there is one exception per contradiction, and each rests on pack files', () => {
  expect(close.exceptions.map((e) => e.id).sort()).toEqual(findings.contradictions.map((c) => c.id).sort());
  for (const e of close.exceptions) for (const s of e.sources) expect(pack, `${e.id}: ${s}`).toContain(s);
  for (const f of close.agent.reads) expect(pack, `agent reads ${f}`).toContain(f);
});

test('everyone who speaks, resolves or belongs is a person in people.json', () => {
  const named = [
    ...close.exceptions.flatMap((e) => [...e.replies.map((r) => r.author), ...(e.resolution ? [e.resolution.by] : [])]),
    ...close.channels.flatMap((c) => c.members),
    ...close.directMessages,
    close.agent.setUpBy,
  ];
  for (const key of named) expect(members, key).toContain(key);
});

test("every exception says what wasn't checked, [] for nothing", () => {
  for (const e of close.exceptions) expect(Array.isArray(e.notChecked), e.id).toBe(true);
});

test('an unresolved exception waits on a follow-up that exists', () => {
  for (const e of close.exceptions.filter((x) => !x.resolution)) {
    expect(e.waiting, e.id).toBeDefined();
    expect(findings.followUps.map((f) => f.id)).toContain(e.waiting!.followUp);
  }
});

test('the proposed reversal balances and moves exactly the revenue the cut-off check finds', () => {
  const { lines } = close.hero.entry;
  const total = (k: 'debit' | 'credit') => lines.reduce((t, l) => t + l[k], 0);
  expect(total('debit')).toBe(total('credit'));
  const revenue = lines.find((l) => l.account === '4000');
  const cutOff = checks.find((c) => c.id === close.hero.exception);
  expect(revenue?.debit).toBeGreaterThan(0);
  expect(revenue?.debit).toBe(cutOff?.before);
  expect(cutOff?.after).toBe(0);
});

test('every check belongs to an exception and has something to fix', () => {
  for (const c of checks) {
    expect(close.exceptions.map((e) => e.id)).toContain(c.id);
    expect(c.before).toBeGreaterThan(c.after);
  }
});

test('no authored token is left unfilled', () => {
  for (const name of ['close.json', 'people.json', 'checks.json']) {
    expect(readFileSync(path.join(dataDir, name), 'utf8')).not.toMatch(/\{[a-zA-Z]+\}/);
  }
});
