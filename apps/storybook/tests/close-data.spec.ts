import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

/**
 * The Kasane app's generated data (apps/demo/data/close.json, people.json,
 * checks.json, documents.json) must agree with the rest of the demo's data. The export script
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
type Ref = { doc: string; lines?: [number, number]; rows?: number[] };
type Exception = {
  id: string;
  summary: string;
  agent: string;
  channel: string;
  scope: string;
  rule: string;
  evidence: string;
  refs: Ref[];
  replies: Reply[];
  resolution?: { by: string; log: string };
  waiting?: { on: string };
  notChecked: string[];
};
type Agent = {
  key: string;
  name: string;
  checks: string;
  finding: string;
  reads: string[];
  starters: { question: string; answer: string; sources: string[]; notChecked: string[] }[];
};
type Channel = { id: string; topic: string; owner: string; members: string[] };
type Close = {
  period: { open: string; locked: string; reopened: string };
  agentRules: { never: string[]; setUpBy: string };
  agents: Agent[];
  channels: Channel[];
  directMessages: string[];
  exceptions: Exception[];
  hero: {
    exception: string;
    authorship: { asked: string };
    tool: { running: string; done: string };
    options: { id: string; description: string }[];
    entry: { lines: Line[] };
    delegate: { reason: string };
  };
};
type Doc = {
  slug: string;
  file: string;
  about: string;
  size: number;
  text?: { section?: string; firstLine: number; lineCount: number; lines: string[] };
  table?: {
    rowCount: number;
    columnCount: number;
    rowsFor?: string;
    columns: { name: string; style?: string }[];
    rows: string[][];
  };
};

const close = read<Close>('close.json');
const people = read<Record<string, { id: string; name: string }>>('people.json');
const checks = read<{ id: string; before: number; after: number }[]>('checks.json');
const documents = read<Doc[]>('documents.json');
const docOf = (slug: string) => documents.find((d) => d.slug === slug);
const slugs = new Set(documents.map((d) => d.slug));
const members = new Set([...Object.keys(people), ...close.agents.map((a) => a.key)]);

test('every finding and agent names documents that exist', () => {
  for (const e of close.exceptions) for (const r of e.refs) expect(slugs, `${e.id}: ${r.doc}`).toContain(r.doc);
  for (const a of close.agents) for (const f of a.reads) expect(slugs, `${a.key} reads ${f}`).toContain(f);
});

test('everyone who speaks, resolves or belongs is a person in people.json', () => {
  const named = [
    ...close.exceptions.flatMap((e) => [...e.replies.map((r) => r.author), ...(e.resolution ? [e.resolution.by] : [])]),
    ...close.channels.flatMap((c) => c.members),
    ...close.directMessages,
    ...close.channels.map((c) => c.owner),
    close.agentRules.setUpBy,
  ];
  for (const key of named) expect(members, key).toContain(key);
});

test("every exception says what wasn't checked, [] for nothing", () => {
  for (const e of close.exceptions) expect(Array.isArray(e.notChecked), e.id).toBe(true);
});

test('an unresolved exception says what it waits on', () => {
  for (const e of close.exceptions.filter((x) => !x.resolution)) expect(e.waiting?.on, e.id).toBeTruthy();
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
  for (const name of ['close.json', 'people.json', 'checks.json', 'documents.json']) {
    expect(readFileSync(path.join(dataDir, name), 'utf8')).not.toMatch(/\{[a-zA-Z]+\}/);
  }
});

test('each answer says what it does before it is pressed', () => {
  for (const option of close.hero.options) expect(option.description, option.id).toBeTruthy();
});

// The basis says the policy doesn't settle a locked month, so the reason for
// "Choose for me" must not read as if it did.
test('a choice the policy leaves open is said to be the agent’s own', () => {
  expect(close.hero.delegate.reason).toMatch(/^The policy doesn’t decide this\. I chose/);
});

test('the decision comes first in the channel, so it opens above the fold', () => {
  // User tests, 2026-11: every tester missed the options when it was fourth.
  expect(close.exceptions[0].id).toBe(close.hero.exception);
});

// ---------------------------------------------------------------------------
// The Kasane app: the decisions in its pages spec, D1 to D6
// ---------------------------------------------------------------------------

test('D1: four agents, each a role word and "AI", and "AI" comes last', () => {
  expect(close.agents.map((a) => a.name)).toEqual(['Cut-off AI', 'Payments AI', 'Approvals AI', 'Credit AI']);
  expect(close.hero.authorship.asked).toBe('Cut-off AI · Awaiting your answer');
});

test('each agent raises one finding, and every finding has one agent', () => {
  expect(close.agents.map((a) => a.finding).sort()).toEqual(close.exceptions.map((e) => e.id).sort());
  for (const e of close.exceptions) {
    expect(close.agents.find((a) => a.key === e.agent)?.finding, e.id).toBe(e.id);
  }
});

test('D2: the visitor is Daisuke Onodera, and Mei is a teammate', () => {
  expect(people.visitor).toMatchObject({ id: 'E0010', name: 'Daisuke Onodera' });
  expect(Object.values(people).map((p) => p.name)).toContain('Mei Tachibana');
  expect(close.agentRules.setUpBy).toBe('visitor');
});

test('each finding states a rule and what the books show, and quotes nobody', () => {
  for (const e of close.exceptions) {
    expect(e.rule, e.id).toBeTruthy();
    expect(e.evidence, e.id).toBeTruthy();
    expect(`${e.rule} ${e.evidence} ${e.summary}`, e.id).not.toMatch(/\b(you said|says|said)\b/i);
  }
});

test('a finding’s ref holds lines into a text file, or rows into a table, and only a stated rule has lines', () => {
  const shape = Object.fromEntries(
    close.exceptions.map((e) => [e.id, e.refs.map((r) => (r.lines ? 'lines' : r.rows ? 'rows' : 'neither'))]),
  );
  expect(shape).toEqual({
    'revenue-cut-off': ['lines', 'rows'],
    'duplicate-payment': ['rows', 'rows'],
    'self-approved-entry': ['lines', 'rows'],
    'credit-limit': ['lines', 'rows'],
  });
});

test('the data stays on checks and ledgers: no interview source, no claim, no gap or question list', () => {
  const names = readdirSync(dataDir);
  for (const gone of ['discovery.json', 'findings.json', 'pack.json', 'sources.json'])
    expect(names).not.toContain(gone);
  for (const name of names) {
    const text = readFileSync(path.join(dataDir, name), 'utf8');
    expect(text, name).not.toMatch(/\.txt"|"claim"|"gaps"|"followUp"|contradict|interview|transcript/i);
  }
});

test('a document knows nothing about the findings, and nothing marks a record as cited', () => {
  for (const name of readdirSync(dataDir)) {
    const text = readFileSync(path.join(dataDir, name), 'utf8');
    expect(text, name).not.toMatch(/"cited"|"citedRows"|"citations"|"exhibit"|"locator"|"records"|"S-\d+"/);
  }
  for (const d of documents) {
    expect(Object.keys(d).sort(), d.slug).toEqual(['about', 'file', 'size', 'slug', d.table ? 'table' : 'text'].sort());
  }
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : [],
    );
  const demoSrc = path.resolve(dataDir, '../src');
  for (const file of walk(demoSrc)) {
    expect(readFileSync(file, 'utf8'), file).not.toMatch(/CitedSentence|citedBy|Cited by|InlineCitation|\bcited\b/i);
  }
});

test('D2: nobody replies or resolves as the visitor but the visitor’s own decision', () => {
  for (const e of close.exceptions) {
    for (const r of e.replies) expect(r.author, e.id).not.toBe('visitor');
    if (e.id !== close.hero.exception && e.resolution) expect(e.resolution.by, e.id).not.toBe('visitor');
  }
});

test('D3: four findings, the two resolved at landing are gone', () => {
  expect(close.exceptions.map((e) => e.id)).toEqual([
    'revenue-cut-off',
    'duplicate-payment',
    'self-approved-entry',
    'credit-limit',
  ]);
});

test('each finding sits in its channel, with its entity and period', () => {
  const where = Object.fromEntries(close.exceptions.map((e) => [e.id, [e.channel, e.scope]]));
  expect(where).toEqual({
    'revenue-cut-off': ['revenue', 'KJP, Sep 2026'],
    'duplicate-payment': ['payables', 'KUS, Jul 2026'],
    'self-approved-entry': ['close', 'KUK, Aug 2026'],
    'credit-limit': ['receivables', 'KUS, up to Sep 2026'],
  });
});

test('six channels, in the sidebar’s order, each with a topic and an owner', () => {
  expect(close.channels.map((c) => c.id)).toEqual([
    'close',
    'cash',
    'receivables',
    'payables',
    'revenue',
    'intercompany',
  ]);
  for (const c of close.channels) {
    expect(c.topic, c.id).toBeTruthy();
    expect(Object.keys(people), c.id).toContain(c.owner);
    expect(c.members, c.id).toContain('visitor');
  }
});

test('every channel’s owner belongs to it', () => {
  for (const c of close.channels) expect(c.members, c.id).toContain(c.owner);
});

test('the quiet channels hold no finding', () => {
  const quiet = close.channels.filter((c) => !close.exceptions.some((e) => e.channel === c.id)).map((c) => c.id);
  expect(quiet).toEqual(['cash', 'intercompany']);
});

test('direct messages are people only, and the visitor isn’t one of them', () => {
  expect(close.directMessages).toEqual(['fpaHead', 'apLead']);
});

test('two suggested questions an agent, 8 in all, each with its sources and what wasn’t checked', () => {
  expect(close.agents.flatMap((a) => a.starters)).toHaveLength(8);
  for (const a of close.agents) {
    expect(a.starters, a.key).toHaveLength(2);
    for (const q of a.starters) {
      expect(q.answer, q.question).toBeTruthy();
      expect(q.sources.length, q.question).toBeGreaterThan(0);
      expect(Array.isArray(q.notChecked), q.question).toBe(true);
      for (const f of q.sources) expect(a.reads, q.question).toContain(f);
    }
  }
});

test('the hero’s tool line claims only what the material holds', () => {
  // The material has an invoice's delivery date and no delivery note, as "not checked" says.
  const { tool } = close.hero;
  expect(tool.done).toMatch(/^Read the delivery date on /);
  expect(tool.running).toMatch(/^Reading the delivery date on /);
  expect(close.exceptions.find((e) => e.id === close.hero.exception)?.notChecked[0]).toMatch(/^The delivery note: /);
});

test('nine documents, text files then tables, each group in file-name order', () => {
  const files = (group: Doc[]) => group.map((d) => d.file);
  const text = documents.filter((d) => d.text);
  const tables = documents.filter((d) => d.table);
  expect(documents).toHaveLength(9);
  expect(new Set(documents.map((d) => d.slug)).size).toBe(9);
  expect([...files(text), ...files(tables)]).toEqual(files(documents));
  expect(files(text)).toEqual([...files(text)].sort());
  expect(files(tables)).toEqual([...files(tables)].sort());
  expect(docOf('sales-invoices')?.file).toBe('sales_invoices_2026-09.csv');
  expect(files(documents)).not.toContain('trial_balance_monthly.csv');
  expect(files(documents)).not.toContain('company_profile.md');
});

test('every document a finding rests on or an agent reads is there, and nothing else is', () => {
  const named = [...close.exceptions.flatMap((e) => e.refs.map((r) => r.doc)), ...close.agents.flatMap((a) => a.reads)];
  expect([...new Set(named)].sort()).toEqual(documents.map((d) => d.slug).sort());
});

test('every ref points inside what its document shows', () => {
  for (const e of close.exceptions) {
    for (const r of e.refs) {
      const d = docOf(r.doc)!;
      if (r.rows) {
        expect(r.rows.length, e.id).toBeGreaterThan(0);
        for (const i of r.rows) expect(d.table?.rows[i], `${e.id}: row ${i}`).toBeDefined();
      } else {
        const [from, to] = r.lines!;
        expect(from, e.id).toBeGreaterThanOrEqual(d.text!.firstLine);
        expect(to, e.id).toBeLessThan(d.text!.firstLine + d.text!.lines.length);
      }
    }
  }
});

test('a document is trimmed, and its figures are the truth about how much', () => {
  for (const d of documents) {
    expect(d.size, d.slug).toBeGreaterThan(0);
    if (d.table) {
      expect(d.table.rows.length, d.slug).toBeLessThan(d.table.rowCount);
      expect(d.table.columns.length, d.slug).toBeLessThanOrEqual(d.table.columnCount);
      for (const row of d.table.rows) expect(row, d.slug).toHaveLength(d.table.columns.length);
    } else {
      expect(d.text!.lines.length, d.slug).toBeLessThan(d.text!.lineCount);
    }
  }
});

test('each ref selects the record its finding is about', () => {
  const ref = (id: string, doc: string) =>
    close.exceptions.find((e) => e.id === id)?.refs.find((r) => r.doc === doc) as Ref;
  const cell = (doc: string, column: string, row: number) => {
    const t = docOf(doc)!.table!;
    return t.rows[row][t.columns.findIndex((c) => c.name === column)];
  };
  // The invoice is the file's last row, so only the rows above it exist.
  expect(docOf('sales-invoices')?.table?.rows).toHaveLength(11);
  expect(ref('revenue-cut-off', 'sales-invoices').rows!.map((i) => cell('sales-invoices', 'invoice_id', i))).toEqual([
    'INV-KJP-2609-00363',
  ]);
  // Its eight month-ends over the limit aren't next to each other.
  expect(docOf('ar-aging')?.table?.rowsFor).toBe('Great Lakes Duplicating Supply');
  expect(ref('credit-limit', 'ar-aging').rows).toHaveLength(8);
  for (const row of docOf('ar-aging')!.table!.rows) expect(row[1]).toBe('C-KUS-0001');
  // The two payments of the duplicate, in the payment file.
  expect(
    ref('duplicate-payment', 'supplier-payments').rows!.map((i) => cell('supplier-payments', 'ap_invoice_id', i)),
  ).toEqual(['API-KUS-2607-00007', 'API-KUS-2607-00011']);
});

test('a rule’s lines say the rule', () => {
  const line = (doc: string, n: number) => docOf(doc)!.text!.lines[n - docOf(doc)!.text!.firstLine];
  expect(line('accounting-policies', 26)).toContain('revenue belongs to the period in which delivery occurs');
  expect(line('close-memo', 39)).toContain('credit hold since 10 Sep');
  expect(line('finance-team', 68)).toContain('must be created by one person and approved by another');
});

test('the period lines say what #close’s panel and the header show (D7)', () => {
  expect(close.period).toEqual({
    open: 'October 2026, open',
    locked: 'Locked 8 Oct 2026, business day 6',
    reopened: 'Reopened 16 Oct 2026',
  });
});
