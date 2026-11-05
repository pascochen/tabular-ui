#!/usr/bin/env node
// Builds everything the UI reads about Kasane Corporation from the full Kasane dataset.
// No number in the outputs is typed by hand: each one is computed here from the CSVs.
//
//   KASANE_DATA_DIR=/path/to/kasane pnpm --filter tabular-ui-demo export-fixtures
//
// The dataset is not in this repository. KASANE_DATA_DIR points at its root: the folder holding
// 01_master_data/ … 05_reporting/, docs/ and demo/ (close-demo.json).
//
// Writes:
//   packages/ui/src/fixtures/kasane.ts   story fixtures (never exported from src/index.ts)
//   apps/demo/data/company.json          the company and the visitor's persona
//   apps/demo/data/people.json           the close demo's people, by role, from employees.csv
//   apps/demo/data/close.json            the scripted workspace: agents, channels, exceptions, replies,
//                                        the hero decision and its proposed entry (copy from
//                                        demo/close-demo.json, figures from the data)
//   apps/demo/data/checks.json           each close check's figure before and after its fix
//   apps/demo/data/documents.json        each file a finding rests on or an agent reads, with a trimmed
//                                        extract. A document knows nothing about the findings
//   apps/site/data/kasane.json           the public site's specimen records and closing band (docs/site.md §5)
//
// Only what the demo's screens read is written: no whole files, only the documents' extracts.
// Re-running it on an unchanged dataset produces no diff.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';

// The repo root: this script writes into apps/demo, apps/site and packages/ui.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
if (!process.env.KASANE_DATA_DIR) {
  throw new Error('Set KASANE_DATA_DIR to the root of the Kasane dataset. It is not in this repository.');
}
const data = resolve(process.env.KASANE_DATA_DIR);
for (const dir of ['01_master_data', '03_general_ledger', '05_reporting', 'docs', 'demo']) {
  if (!existsSync(join(data, dir))) throw new Error(`KASANE_DATA_DIR has no ${dir}/: is ${data} the dataset's root?`);
}
const MAX_PACK_FILE_BYTES = 5 * 1024 * 1024; // the demo's per-file limit (apps/demo/src/lib/files.ts)

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch !== '\r') cell += ch;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function readCsv(rel) {
  const [header, ...rows] = parseCsv(readFileSync(join(data, rel), 'utf8'));
  return rows.filter((r) => r.length === header.length).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

function toCsv(rows, cols, { header = true } = {}) {
  const esc = (v) => {
    const s = v === undefined || v === null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const lines = rows.map((r) => cols.map((c) => esc(r[c])).join(','));
  return (header ? [cols.join(','), ...lines] : lines).join('\n') + '\n';
}

const num = (v) => (v === '' || v === undefined ? 0 : Number(v));
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
// Stops the build when the data no longer says what the outputs claim, so no stale finding is written.
const must = (ok, message) => {
  if (!ok) throw new Error(`Kasane data no longer supports this: ${message}`);
};

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

const entities = readCsv('01_master_data/entities.csv');
const employees = readCsv('01_master_data/employees.csv');
const customers = readCsv('01_master_data/customers.csv');
const calendar = readCsv('01_master_data/fiscal_calendar.csv');
const fxRates = readCsv('01_master_data/fx_rates.csv');
const products = readCsv('01_master_data/products.csv');
const salesInvoices = readCsv('02_subledgers/sales_invoices.csv');
const supplierInvoices = readCsv('02_subledgers/supplier_invoices.csv');
const supplierPayments = readCsv('02_subledgers/supplier_payments.csv');
const installedBase = readCsv('02_subledgers/installed_base_monthly.csv');
const journal = readCsv('03_general_ledger/journal_entries.csv');
const trialBalance = readCsv('03_general_ledger/trial_balance_monthly.csv');
const plan = readCsv('04_planning/budget_forecast_monthly.csv');
const incomeStatement = readCsv('05_reporting/consolidated_income_statement_monthly.csv');
const balanceSheet = readCsv('05_reporting/consolidated_balance_sheet_monthly.csv');
const segments = readCsv('05_reporting/segment_results_monthly.csv');
const kpis = readCsv('05_reporting/kpi_monthly.csv');
const arAging = readCsv('05_reporting/ar_aging_monthly.csv');

// ---------------------------------------------------------------------------
// Periods
// ---------------------------------------------------------------------------

const closed = calendar.filter((r) => r.period_status === 'closed').map((r) => r.period);
const LAST_CLOSED = closed.at(-1); // 2026-09
const OPEN = calendar.find((r) => r.period_status === 'open');
const fyMonths = (fy) =>
  Array.from({ length: 12 }, (_, i) => {
    const m = ((3 + i) % 12) + 1;
    const y = m >= 4 ? fy : fy + 1;
    return `${y}-${String(m).padStart(2, '0')}`;
  });
const FY = Number(calendar.find((r) => r.period === LAST_CLOSED).fiscal_year.slice(2)); // 2026
const H1 = fyMonths(FY).slice(0, 6);
const H1_PY = fyMonths(FY - 1).slice(0, 6);
const FY_PY = fyMonths(FY - 1);
const FY_NOW = fyMonths(FY);

// ---------------------------------------------------------------------------
// Consolidated figures (JPY)
// ---------------------------------------------------------------------------

function isLine(scenario, periods, line) {
  return sum(
    incomeStatement
      .filter((r) => r.scenario === scenario && periods.includes(r.period) && r.line_item === line)
      .map((r) => num(r.amount_jpy)),
  );
}
const LINES = {
  netSales: 'Net sales',
  equipment: 'Net sales - equipment',
  consumables: 'Net sales - consumables',
  service: 'Net sales - maintenance and service',
  rental: 'Net sales - rental income',
  grossProfit: 'Gross profit',
  sga: 'Selling, general and administrative expenses',
  personnel: 'Personnel expenses',
  operatingProfit: 'Operating profit',
  ordinaryProfit: 'Ordinary profit',
  netIncome: 'Net income attributable to owners of parent',
};
const BUDGET = `BUD-FY${FY}`;
const FORECAST = `FC-FY${FY}-6+6`;
const FORECAST_JULY = `FC-FY${FY}-3+9`;

function figureSet(periods, pyPeriods) {
  return Object.fromEntries(
    Object.entries(LINES).map(([k, line]) => [
      k,
      {
        actual: isLine('ACTUAL', periods, line),
        budget: isLine(BUDGET, periods, line),
        priorYear: isLine('ACTUAL', pyPeriods, line),
      },
    ]),
  );
}
const h1 = figureSet(H1, H1_PY);
const lastMonth = figureSet([LAST_CLOSED], [H1_PY.at(-1)]);
const fyPrior = Object.fromEntries(Object.entries(LINES).map(([k, line]) => [k, isLine('ACTUAL', FY_PY, line)]));
const fyOutlook = Object.fromEntries(
  Object.entries(LINES).map(([k, line]) => [
    k,
    {
      budget: isLine(BUDGET, FY_NOW, line),
      forecastJuly: isLine(FORECAST_JULY, FY_NOW, line),
      forecast: isLine(FORECAST, FY_NOW, line),
    },
  ]),
);

const kpi = (id, period = LAST_CLOSED, scope = 'GROUP') =>
  num(kpis.find((r) => r.scope === scope && r.period === period && r.kpi_id === id)?.value);
const bsLine = (line, period = LAST_CLOSED) =>
  num(balanceSheet.find((r) => r.period === period && r.line_item === line)?.amount_jpy);

const segmentH1 = Object.values(
  segments
    .filter((r) => H1.includes(r.period))
    .reduce((acc, r) => {
      const s = (acc[r.segment] ??= { segment: r.segment, externalSales: 0, operatingProfit: 0 });
      s.externalSales += num(r.external_sales_jpy);
      s.operatingProfit += num(r.segment_operating_profit_jpy);
      return acc;
    }, {}),
);

// ---------------------------------------------------------------------------
// Exchange rates
// ---------------------------------------------------------------------------

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CNY'];
const rate = (cur, type, period = '', fy = `FY${FY}`) =>
  num(
    fxRates.find(
      (r) => r.currency === cur && r.rate_type === type && (period ? r.period === period : r.fiscal_year === fy),
    )?.jpy_per_unit,
  );
const fx = Object.fromEntries(
  CURRENCIES.map((c) => [
    c,
    {
      budget: rate(c, 'BUDGET'),
      h1Average: Math.round((sum(H1.map((p) => rate(c, 'MONTHLY_AVERAGE', p))) / H1.length) * 100) / 100,
      closing: rate(c, 'MONTH_END_CLOSING', LAST_CLOSED),
    },
  ]),
);

// ---------------------------------------------------------------------------
// Entity ledgers (local currency, credit-positive P&L)
// ---------------------------------------------------------------------------

const isOperating = (a) => /^[456]/.test(a);
function ledger(entity, periods, accounts) {
  return sum(
    journal
      .filter((l) => l.entity_id === entity && periods.includes(l.period) && accounts(l.account_id))
      .map((l) => num(l.credit) - num(l.debit)),
  );
}
// ---------------------------------------------------------------------------
// H1 operating profit bridge, budget → actual (JPY). Each step computed, "other" is the remainder.
// ---------------------------------------------------------------------------

const SUBS = entities.filter((e) => e.parent_entity_id).map((e) => e.entity_id);
const funcCur = Object.fromEntries(entities.map((e) => [e.entity_id, e.functional_currency]));
let fxSubsidiaries = 0;
for (const e of SUBS) {
  const c = funcCur[e];
  for (const p of H1) {
    fxSubsidiaries += ledger(e, [p], isOperating) * (rate(c, 'MONTHLY_AVERAGE', p) - fx[c].budget);
  }
}
let fxIntercompany = 0;
for (const l of journal) {
  if (l.entity_id === 'KJP' && l.account_id === '4500' && H1.includes(l.period)) {
    const jpy = num(l.credit) - num(l.debit);
    fxIntercompany += jpy - (jpy / num(l.fx_rate)) * fx[l.txn_currency].budget;
  }
}
const allowanceKusLastMonth = -ledger('KUS', [LAST_CLOSED], (a) => a === '6800');
const greatLakesReserve = allowanceKusLastMonth * rate('USD', 'MONTHLY_AVERAGE', LAST_CLOSED);
const vacancy = h1.rental.actual - h1.rental.budget;
const personnel = h1.personnel.actual - h1.personnel.budget;
const bridgeSteps = [
  ['fx-subsidiaries', 'Exchange rates: subsidiary profits worth fewer yen', fxSubsidiaries],
  ['fx-intercompany', 'Exchange rates: KJP margin on intercompany sales', fxIntercompany],
  ['bad-debt', 'Great Lakes Duplicating Supply reserve (US)', -greatLakesReserve],
  ['vacancy', 'Seventh-floor vacancy (real estate)', vacancy],
  ['personnel', 'Personnel costs (hiring freeze)', personnel],
].map(([id, label, value]) => ({ id, label, value: Math.round(value) }));
const explained = sum(bridgeSteps.map((s) => s.value));
const operatingBridge = {
  budget: h1.operatingProfit.budget,
  steps: [
    ...bridgeSteps,
    {
      id: 'other',
      label: 'Gross profit at constant rates and other',
      value: h1.operatingProfit.actual - h1.operatingProfit.budget - explained,
    },
  ],
  actual: h1.operatingProfit.actual,
};

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

const person = (id) => {
  const e = employees.find((r) => r.employee_id === id);
  const parts = e.full_name.split(' ');
  return {
    id,
    name: e.full_name,
    shortName: parts[0],
    title: e.job_title,
    entity: e.entity_id,
    email: e.email,
    initials: (parts[0][0] + parts.at(-1)[0]).toUpperCase(),
    handle: `${parts[0][0]}.${parts.at(-1)}`.toLowerCase(),
  };
};
const PEOPLE_IDS = {
  ceo: 'E0001',
  cfo: 'E0002',
  controller: 'E0010',
  fpa: 'E0011',
  consolidation: 'E0012',
  treasury: 'E0013',
  tax: 'E0014',
  receivables: 'E0015',
  payables: 'E0016',
  plantCost: 'E0017',
  dataAnalyst: 'E0018',
  generalLedger: 'E0019',
  fpaAnalyst: 'E0020',
  fixedAssets: 'E0021',
  usController: 'E1002',
  usCredit: 'E1003',
  deFinance: 'E2002',
  ukController: 'E3002',
  ukAccountant: 'E3003',
  cnFinance: 'E4002',
  longName: 'E2021',
};
const people = Object.fromEntries(Object.entries(PEOPLE_IDS).map(([k, id]) => [k, person(id)]));

// ---------------------------------------------------------------------------
// Findings: what the checks raise. Every evidence value is read from the data, and `sources` are
// pack file names.
// ---------------------------------------------------------------------------

const P = {
  trialBalance: 'trial_balance_monthly.csv',
  coa: 'chart_of_accounts.csv',
  aging: 'ar_aging_monthly.csv',
  manualJournals: `manual_journal_entries_fy${FY}_h1.csv`,
  supplierInvoices: `supplier_invoices_fy${FY}_h1.csv`,
  supplierPayments: `supplier_payments_fy${FY}_h1.csv`,
  salesInvoices: `sales_invoices_${LAST_CLOSED}.csv`,
  budget: 'budget_forecast_monthly.csv',
  bank: `bank_export_kjp_${LAST_CLOSED}.csv`,
  profile: 'company_profile.md',
  policies: 'accounting_policies.md',
  closeCalendar: 'close_calendar.md',
  closeMemo: `close_memo_${LAST_CLOSED}.md`,
  forecastMemo: `forecast_memo_fy${FY}_6+6.md`,
  financeTeam: 'finance_team.md',
};

// 1. Self-approved manual entry over the approver's limit (KUK).
const selfApproved = journal.filter((l) => l.je_type === 'Manual' && l.created_by && l.created_by === l.approved_by);
const sa = selfApproved.find((l) => num(l.debit) > 0);
const saPerson = employees.find((e) => e.employee_id === sa?.created_by);
// 2. Revenue cut-off: invoiced in the closed month, delivered after it.
const cutoff = salesInvoices.find(
  (r) => r.period === LAST_CLOSED && r.delivery_date > r.invoice_date && r.delivery_date.slice(0, 7) !== LAST_CLOSED,
);
// 3. Great Lakes over its credit limit before its credit hold.
const gl = customers.find((c) => c.customer_name === 'Great Lakes Duplicating Supply');
const glLimit = num(gl.credit_limit);
const glHistory = arAging
  .filter((r) => r.customer_id === gl.customer_id)
  .map((r) => ({ period: r.period, open: num(r.total_open) }));
const glOverLimit = glHistory.filter((r) => r.open > glLimit);
const glLastReceipt = readCsv('02_subledgers/customer_receipts.csv')
  .filter((r) => r.customer_id === gl.customer_id)
  .map((r) => r.receipt_date)
  .sort()
  .at(-1);
// 4. Same supplier invoice number entered and paid twice.
const byKey = {};
for (const s of supplierInvoices) (byKey[`${s.supplier_id}|${s.supplier_invoice_number}`] ??= []).push(s);
const dup = Object.values(byKey).find((g) => g.length > 1 && !g[0].supplier_invoice_number.startsWith('INV-'));
const dupPaid = (dup ?? []).map((d) => supplierPayments.filter((p) => p.ap_invoice_id === d.ap_invoice_id).length > 0);
// The September lock: #close's panel says when it happened, and on which business day.
const lastClose = calendar.find((r) => r.period === LAST_CLOSED);
const closeDay = (() => {
  const d = new Date(`${lastClose.close_completed_date}T00:00:00Z`);
  let n = 0;
  for (let x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); x <= d; x.setUTCDate(x.getUTCDate() + 1)) {
    if (x.getUTCDay() !== 0 && x.getUTCDay() !== 6) n++;
  }
  return n;
})();

// Each finding must still be true: change the data and the build stops here.
must(sa, 'a manual journal entry created and approved by the same person');
const saLines = journal.filter((l) => l.je_id === sa.je_id);
must(
  saLines.some((l) => l.account_id === '1300' && num(l.debit) > 0) &&
    saLines.some((l) => l.account_id === '6100' && num(l.credit) > 0),
  `${sa.je_id} moves advertising (6100) to prepaid expenses (1300)`,
);
must(saPerson && num(sa.debit) > num(saPerson.approval_limit_local), `${sa.je_id} is over its approver's limit`);
must(cutoff, `a ${LAST_CLOSED} invoice delivered after the month`);
must(glLastReceipt, 'a receipt from Great Lakes Duplicating Supply');
must(dup && dupPaid.some(Boolean), 'a supplier invoice number entered twice and paid');

const SYMBOL = { JPY: '¥', USD: '$', EUR: '€', GBP: '£', CNY: 'CN¥' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Whole units below a million; one decimal in millions (two for non-yen) above it. Yen never shows decimals.
const money = (v, cur) => {
  const s = SYMBOL[cur];
  const a = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (a >= 1e9) return `${sign}${s}${(a / 1e9).toFixed(cur === 'JPY' ? 1 : 2)}bn`;
  if (a >= 1e6) return `${sign}${s}${(a / 1e6).toFixed(cur === 'JPY' ? 1 : 2)}m`;
  const digits = cur === 'JPY' || Number.isInteger(a) ? 0 : 2;
  return `${sign}${s}${a.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
};
const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const fmtPeriod = (p) => `${MONTHS[Number(p.slice(5)) - 1]} ${p.slice(0, 4)}`;
const longMonth = (p) =>
  new Date(`${p}-01T00:00:00Z`).toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const shortDate = (iso) => fmtDate(iso).replace(/ \d{4}$/, '');
// "Sep 2025, Nov 2025 and every month from Mar 2026 to Jul 2026"
const fmtPeriods = (ps) => {
  const idx = (p) => Number(p.slice(0, 4)) * 12 + Number(p.slice(5));
  const runs = [];
  for (const p of ps) {
    const last = runs.at(-1);
    if (last && idx(p) === idx(last.at(-1)) + 1) last.push(p);
    else runs.push([p]);
  }
  const parts = runs.map((r) =>
    r.length > 2 ? `every month from ${fmtPeriod(r[0])} to ${fmtPeriod(r.at(-1))}` : r.map(fmtPeriod).join(', '),
  );
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0];
};

// The credit hold, from the close memo: the months over the limit are the month-ends before it.
const closeMemoFile = 'docs/commentary/2026-09_month_end_close_memo.md';
const glHold = readFileSync(join(data, closeMemoFile), 'utf8').match(/credit hold since (\d+) (\w{3})/);
must(glHold, 'the close memo gives the date Great Lakes went on credit hold');
must(
  fmtPeriod(LAST_CLOSED).startsWith(glHold[2]),
  `Great Lakes went on credit hold in ${LAST_CLOSED}, the month its month-ends are counted up to`,
);
const glHoldDate = `${glHold[1]} ${fmtPeriod(LAST_CLOSED)}`;
const glOverBeforeHold = glOverLimit.filter((r) => r.period < LAST_CLOSED);
must(glOverBeforeHold.length > 0, 'Great Lakes Duplicating Supply over its credit limit before its credit hold');

// The payment behind each entry of the duplicate, in the same order.
const dupPayments = (dup ?? []).map((d) => supplierPayments.find((p) => p.ap_invoice_id === d.ap_invoice_id));
must(dupPayments.every(Boolean), 'a payment against each entry of the duplicate');

// A finding states the rule the check applies, then what the books show. `words` must still be in the
// lines of the document that close-demo.json gives for the rule. A rule no document states has none.
const findings = [
  {
    id: 'self-approved-entry',
    rule: 'One person creates a manual journal entry, and another approves it.',
    words: 'must be created by one person and approved by another',
    evidence: `${sa.je_id} (${sa.entity_id}, ${fmtDate(sa.posting_date)}) moves ${money(num(sa.debit), sa.currency)} from advertising to prepaid expenses. The same person, ${sa.created_by}, created and approved it. Whether it was over their limit needs the employee master, which isn't in these files.`,
    sources: [P.financeTeam, P.manualJournals],
  },
  {
    id: 'revenue-cut-off',
    rule: 'Revenue belongs to the month of delivery.',
    words: 'revenue belongs to the period in which delivery occurs',
    evidence: `${cutoff.invoice_id} (${money(num(cutoff.net_amount), 'JPY')} net) is dated ${fmtDate(cutoff.invoice_date)} but delivered ${fmtDate(cutoff.delivery_date)}. Revenue belongs to the next month.`,
    sources: [P.policies, P.salesInvoices],
  },
  {
    id: 'credit-limit',
    rule: "A customer's balance stays within its credit limit.",
    words: `credit hold since ${glHold[1]} ${glHold[2]}`,
    evidence: `Its balance was over the ${money(glLimit, 'USD')} limit in ${fmtPeriods(
      glOverBeforeHold.map((r) => r.period),
    )}. The account went on credit hold on ${glHoldDate}, and the last payment arrived ${fmtDate(glLastReceipt)}.`,
    sources: [P.closeMemo, P.aging],
  },
  {
    id: 'duplicate-payment',
    rule: 'A supplier invoice number is entered and paid once.',
    evidence: `${dup[0].entity_id} entered supplier invoice ${dup[0].supplier_invoice_number} twice (${dup.map((d) => d.ap_invoice_id).join(' and ')}), ${money(num(dup[0].gross_amount), dup[0].currency)} each, and ${dupPaid.every(Boolean) ? 'paid both' : 'paid one'}.`,
    sources: [P.supplierInvoices, P.supplierPayments],
  },
];

// ---------------------------------------------------------------------------
// Demo pack
// ---------------------------------------------------------------------------

// Each file is built in memory and recorded, never written: the demo needs its name, kind and size,
// and a spreadsheet's first line, which the header check really reads.
const pack = [];
const addPack = (name, kind, buf) => {
  const bytes = buf.length;
  if (bytes > MAX_PACK_FILE_BYTES) throw new Error(`${name} is ${bytes} bytes, over the demo's 5 MB limit`);
  const entry = { name, kind, bytes };
  if (kind === 'spreadsheet') entry.firstLine = buf.toString('utf8').split(/\r?\n/, 1)[0];
  pack.push(entry);
};
const copy = (from) => readFileSync(join(data, from));
const writeText = (text) => Buffer.from(text);

addPack(P.profile, 'document', copy('docs/01_company_profile.md'));
addPack(P.policies, 'document', copy('docs/06_accounting_policies.md'));
addPack(P.closeCalendar, 'document', copy('docs/07_close_calendar.md'));
addPack(P.financeTeam, 'document', copy('docs/08_finance_team.md'));
addPack(P.closeMemo, 'document', copy(closeMemoFile));
addPack(P.forecastMemo, 'document', copy('docs/commentary/FY2026_6+6_forecast_memo.md'));
addPack(P.trialBalance, 'spreadsheet', copy('03_general_ledger/trial_balance_monthly.csv'));
addPack(P.coa, 'spreadsheet', copy('01_master_data/chart_of_accounts.csv'));
addPack(P.aging, 'spreadsheet', copy('05_reporting/ar_aging_monthly.csv'));
addPack(P.budget, 'spreadsheet', copy('04_planning/budget_forecast_monthly.csv'));
const jeCols = Object.keys(journal[0]);
const manualRows = journal.filter((l) => l.je_type === 'Manual' && H1.includes(l.period));
const supplierRows = supplierInvoices.filter((r) => H1.includes(r.period));
const salesRows = salesInvoices.filter((r) => r.period === LAST_CLOSED);
addPack(P.manualJournals, 'spreadsheet', writeText(toCsv(manualRows, jeCols)));
addPack(P.supplierInvoices, 'spreadsheet', writeText(toCsv(supplierRows, Object.keys(supplierInvoices[0]))));
addPack(P.salesInvoices, 'spreadsheet', writeText(toCsv(salesRows, Object.keys(salesInvoices[0]))));
const paymentRows = supplierPayments.filter((r) => H1.includes(r.payment_date.slice(0, 7)));
addPack(P.supplierPayments, 'spreadsheet', writeText(toCsv(paymentRows, Object.keys(supplierPayments[0]))));
// The bank export has no header row, as a bank portal produces it.
const opening = num(
  trialBalance.find((r) => r.entity_id === 'KJP' && r.period === LAST_CLOSED && r.account_id === '1000')
    .opening_balance,
);
const cashLines = journal.filter((l) => l.entity_id === 'KJP' && l.period === LAST_CLOSED && l.account_id === '1000');
let balance = opening;
const bankRows = cashLines.map((l) => {
  const out = num(l.credit);
  const inn = num(l.debit);
  balance += inn - out;
  return {
    date: l.posting_date,
    ref: l.document_ref,
    desc: l.je_description.replace(/ - \d{4}-\d{2}-\d{2}/, '').replace(/ \(\d+ documents\)/, ''),
    out: out || '',
    in: inn || '',
    balance,
  };
});
const closing = num(
  trialBalance.find((r) => r.entity_id === 'KJP' && r.period === LAST_CLOSED && r.account_id === '1000')
    .closing_balance,
);
if (balance !== closing) throw new Error(`bank export balance ${balance} does not tie to GL cash ${closing}`);
addPack(
  P.bank,
  'spreadsheet',
  writeText(toCsv(bankRows, ['date', 'ref', 'desc', 'out', 'in', 'balance'], { header: false })),
);

// ---------------------------------------------------------------------------
// Fixture values for stories
// ---------------------------------------------------------------------------

const ENTITY_ORDER = ['KJP', 'KUS', 'KDE', 'KUK', 'KCN'];
const orgs = ENTITY_ORDER.map((id) => {
  const e = entities.find((r) => r.entity_id === id);
  return {
    // Opaque ids, as the product issues them; the entity code is in entityId.
    id: `org_01HZX4J${'BCDEF'[ENTITY_ORDER.indexOf(id)]}`,
    entityId: id,
    name: e.legal_name,
    localName: e.local_name,
    currency: e.functional_currency,
    city: e.city,
  };
});
const ib = (period) => sum(installedBase.filter((r) => r.period === period).map((r) => num(r.closing_units)));
const consumablesShareFyPrior = Math.round((fyPrior.consumables / fyPrior.netSales) * 1000) / 10;
const groupHeadcount = kpi('headcount');

// Workspace projects as Kasane's finance team would name them. Periods come from the calendar.
const projects = [
  { id: 'prj_01J8Q4', name: `FY${FY} H1 close` },
  { id: 'prj_01J8Q3', name: `FY${FY} 6+6 forecast` },
  { id: 'prj_01J8Q2', name: `Q2 FY${FY} dealer rebates` },
  { id: 'prj_01J8Q1', name: `FY${FY - 1} year-end close` },
];
const longProjects = [
  { id: 'prj_01J8Q4', name: `FY${FY} H1 close — consolidation, eliminations and FX translation` },
  { id: 'prj_01J8Q3', name: `FY${FY} 6+6 forecast` },
  { id: 'prj_01J8Q5', name: `${gl.customer_name} — credit exposure and reserve review` },
];

const fixtures = {
  company: {
    name: 'Kasane',
    legalName: entities.find((e) => e.entity_id === 'KJP').legal_name,
    localName: entities.find((e) => e.entity_id === 'KJP').local_name,
    headquarters: 'Tokyo',
    fiscalYear: `FY${FY}`,
    fiscalYearLabel: `April ${FY} – March ${FY + 1}`,
    reportingCurrency: 'JPY',
    lastClosedPeriod: LAST_CLOSED,
    openPeriod: OPEN.period,
    dataLoadedThrough: OPEN.data_loaded_through,
    entities: ENTITY_ORDER.length,
    employees: groupHeadcount,
    installedBase: ib(LAST_CLOSED),
    fyPriorNetSales: fyPrior.netSales,
    consumablesSharePct: consumablesShareFyPrior,
  },
  orgs,
  projects,
  longProjects,
  people,
  products: products.map((p) => ({ sku: p.sku, name: p.product_name, line: p.product_line })),
  h1,
  lastMonth: { period: LAST_CLOSED, ...lastMonth },
  fyOutlook,
  operatingBridge,
  segmentsH1: segmentH1,
  balance: {
    period: LAST_CLOSED,
    cash: bsLine('Cash and deposits'),
    tradeReceivables: bsLine('Trade receivables'),
    inventories: bsLine('Inventories'),
    netAssets: bsLine('Total net assets (equity)'),
    netCash: kpi('net_cash'),
    dsoDays: Math.round(kpi('dso_days') * 10) / 10,
    contractRenewalPct: Math.round(kpi('contract_renewal_rate_ttm_pct') * 10) / 10,
    // At the end of the previous fiscal year (March), for a like-for-like delta.
    contractRenewalPctFyStart: Math.round(kpi('contract_renewal_rate_ttm_pct', `${FY}-03`) * 10) / 10,
    dioDays: Math.round(kpi('dio_days') * 10) / 10,
  },
  fx,
  greatLakes: {
    customerId: gl.customer_id,
    name: gl.customer_name,
    creditLimit: glLimit,
    openAtClose: glHistory.at(-1).open,
    lastReceipt: glLastReceipt,
    reserveUsd: Math.round(allowanceKusLastMonth * 100) / 100,
    reserveJpy: Math.round(greatLakesReserve),
  },
};

// ---------------------------------------------------------------------------
// Write the fixtures
// ---------------------------------------------------------------------------

// The demo shows these strings as copy, so apostrophes are typographic (’),
// matching the hand-written UI around them. Applied to the copy fields only.
const curly = (text) => text.replace(/(\p{L})'(\p{L})/gu, '$1\u2019$2');
const curlyCopy = (item) =>
  Object.fromEntries(Object.entries(item).map(([k, v]) => [k, ['rule', 'evidence'].includes(k) ? curly(v) : v]));

const banner = (purpose) =>
  `// GENERATED by apps/demo/scripts/export-fixtures.mjs from the Kasane dataset. Do not edit by hand.\n// ${purpose}\n// Kasane Corporation is fictional. Amounts are in each entity's currency; group figures are JPY.\n\n`;

async function writeFormatted(rel, body) {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  const config = (await prettier.resolveConfig(path)) ?? {};
  writeFileSync(path, await prettier.format(body, { ...config, filepath: path }));
}

const writeJson = (rel, value) => writeFormatted(rel, JSON.stringify(value));

const asConst = (name, value) => `export const ${name} = ${JSON.stringify(value, null, 2)};\n\n`;

await writeFormatted(
  'packages/ui/src/fixtures/kasane.ts',
  banner('Story fixtures only. Never export this module from src/index.ts.') +
    Object.entries(fixtures)
      .map(([k, v]) => asConst(k, v))
      .join(''),
);

await writeJson('apps/demo/data/company.json', {
  ...fixtures.company,
  persona: { name: people.fpa.name, title: people.fpa.title },
});
// ---------------------------------------------------------------------------
// The Kasane app: the scripted workspace. The copy is authored in demo/close-demo.json; every
// figure in it is a {token} filled here from the data, and the people are employee ids.
// ---------------------------------------------------------------------------

const closeSource = JSON.parse(readFileSync(join(data, 'demo/close-demo.json'), 'utf8'));
const packNames = new Set(pack.map((f) => f.name));
const packText = (name) => readFileSync(join(data, ...packPath(name)), 'utf8');
function packPath(name) {
  const docs = {
    [P.policies]: 'docs/06_accounting_policies.md',
    [P.closeCalendar]: 'docs/07_close_calendar.md',
    [P.closeMemo]: closeMemoFile,
    [P.financeTeam]: 'docs/08_finance_team.md',
    [P.forecastMemo]: 'docs/commentary/FY2026_6+6_forecast_memo.md',
  };
  must(docs[name], `a path for ${name}`);
  return [docs[name]];
}

// People: each must be an employee.
const closePeople = Object.fromEntries(
  Object.entries(closeSource.people).map(([key, id]) => {
    must(
      employees.some((e) => e.employee_id === id),
      `employee ${id} (${key}) in employees.csv`,
    );
    const p = person(id);
    return [key, { key, ...p }];
  }),
);

// The figures the copy may use.
const cutoffLine = readCsv('02_subledgers/sales_invoice_lines.csv').filter((l) => l.invoice_id === cutoff.invoice_id);
must(cutoffLine.length === 1, `${cutoff.invoice_id} has one invoice line`);
const [cutoffItem] = cutoffLine;
must(
  num(cutoffItem.net_amount) === num(cutoff.net_amount),
  `${cutoff.invoice_id}'s line and header agree on the net amount`,
);
const cutoffShipped = cutoff.note.match(/shipped from Tsukuba (\d+ \w{3})/)?.[1];
must(cutoffShipped, `${cutoff.invoice_id}'s note says when it shipped from Tsukuba`);
const cutoffBefore = sum(
  salesInvoices
    .filter((r) => r.period === LAST_CLOSED && r.delivery_date.slice(0, 7) > LAST_CLOSED)
    .map((r) => num(r.net_amount)),
);
must(
  cutoffBefore === num(cutoff.net_amount),
  `${cutoff.invoice_id} is the only ${LAST_CLOSED} invoice delivered later`,
);
const calendarText = packText(P.closeCalendar);
const earningsRelease = calendarText.match(/earnings release[^|]*\| \w{3} (\d+ \w{3}) \d{4}/)?.[1];
must(earningsRelease, 'close_calendar.md gives the H1 earnings release date');
const auditFieldwork = calendarText.match(/Auditor interim review fieldwork \| ([^(|]+?) \(/)?.[1];
must(auditFieldwork, "close_calendar.md gives the auditors' interim fieldwork dates");
const legalDecision = packText(P.closeMemo).match(/legal decision on recovery by (\d+ \w{3})/)?.[1];
must(legalDecision, 'the close memo gives the date legal decides on Great Lakes');
// What the agents' scripted answers claim, each read from the file the answer names.
const lateInvoices = salesRows.filter((r) => r.delivery_date.slice(0, 7) > LAST_CLOSED);
must(lateInvoices.length === 1, `one ${LAST_CLOSED} invoice delivered after the month`);
const numbersEnteredTwice = Object.values(
  supplierRows.reduce((acc, r) => {
    (acc[`${r.supplier_id}|${r.supplier_invoice_number}`] ??= []).push(r);
    return acc;
  }, {}),
).filter((g) => g.length > 1);
must(numbersEnteredTwice.length === 1, `one supplier invoice number entered twice in FY${FY} H1`);
const [dupFirst, dupSecond] = dup;
must(
  dup.length === 2 &&
    dupFirst.supplier_id === dupSecond.supplier_id &&
    num(dupFirst.gross_amount) === num(dupSecond.gross_amount) &&
    dupFirst.invoice_date !== dupSecond.invoice_date &&
    dupFirst.description !== dupSecond.description,
  'the two duplicate entries differ only in date and description',
);
const selfApprovedInFile = new Set(manualRows.filter((l) => l.created_by === l.approved_by).map((l) => l.je_id));
must(selfApprovedInFile.size === 1 && selfApprovedInFile.has(sa.je_id), `${sa.je_id} is the one self-approved entry`);
const manualEntryCount = new Set(manualRows.map((l) => l.je_id)).size;
const agingPeriods = arAging.map((r) => r.period).sort();
must(
  glHistory.at(-1).period === agingPeriods.at(-1) && glHistory[0].period === agingPeriods[0],
  'the aging file and the Great Lakes history span the same months',
);
must(
  /revenue belongs to the period in which delivery occurs/i.test(packText(P.policies)) &&
    /`delivery_date` on each invoice is the control field/.test(packText(P.policies)),
  'the accounting policies still put revenue in the month of delivery, with the delivery date as the control',
);

const closeTokens = {
  lastClosedLabel: longMonth(LAST_CLOSED).split(' ')[0],
  openLabel: longMonth(OPEN.period).split(' ')[0],
  closeDay: String(closeDay),
  cutoffInvoice: cutoff.invoice_id,
  cutoffNet: money(num(cutoff.net_amount), 'JPY'),
  cutoffInvoiceDate: shortDate(cutoff.invoice_date),
  cutoffDeliveryDate: shortDate(cutoff.delivery_date),
  cutoffShipped,
  earningsRelease,
  dupEntity: dup[0].entity_id,
  dupNumber: dup[0].supplier_invoice_number,
  dupAmount: money(num(dup[0].gross_amount), dup[0].currency),
  saEntry: sa.je_id,
  saAmount: money(num(sa.debit), sa.currency),
  glLimit: money(glLimit, 'USD'),
  glOverCount: String(glOverBeforeHold.length),
  glHoldDate,
  legalDecision,
  auditFieldwork,
  openPeriod: longMonth(OPEN.period),
  lastClosedPeriod: longMonth(LAST_CLOSED),
  lockDate: fmtDate(lastClose.close_completed_date),
  sceneDate: fmtDate(closeSource.scene.date),
  fiscalYear: `FY${FY}`,
  fiscalHalf: `FY${FY} H1`,
  sepInvoiceCount: salesRows.length.toLocaleString('en-US'),
  supplierInvoiceCount: supplierRows.length.toLocaleString('en-US'),
  dupFirst: dupFirst.ap_invoice_id,
  dupFirstDate: fmtDate(dupFirst.invoice_date),
  dupFirstDescription: dupFirst.description,
  dupSecond: dupSecond.ap_invoice_id,
  dupSecondDate: fmtDate(dupSecond.invoice_date),
  dupSecondDescription: dupSecond.description,
  manualEntryCount: manualEntryCount.toLocaleString('en-US'),
  saCreator: sa.created_by,
  saDate: fmtDate(sa.posting_date),
  saDebitAccount: saLines.find((l) => num(l.debit) > 0).account_id,
  saCreditAccount: saLines.find((l) => num(l.credit) > 0).account_id,
  glOverPeriods: fmtPeriods(glOverBeforeHold.map((r) => r.period)),
  glFirstPeriod: fmtPeriod(glHistory[0].period),
  glLastPeriod: fmtPeriod(glHistory.at(-1).period),
  glOpen: money(glHistory.at(-1).open, 'USD'),
};
const fill = (text) =>
  curly(
    text.replace(/\{(\w+)\}/g, (_, k) => {
      must(k in closeTokens, `a value for {${k}} in close-demo.json`);
      return closeTokens[k];
    }),
  );
const fillAll = (v) =>
  typeof v === 'string'
    ? fill(v)
    : Array.isArray(v)
      ? v.map(fillAll)
      : v && typeof v === 'object'
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fillAll(x)]))
        : v;

// Each finding's entity and period, for its task row.
const FINDING_SCOPE = {
  'revenue-cut-off': `${cutoff.entity_id}, ${fmtPeriod(cutoff.period)}`,
  'duplicate-payment': `${dupFirst.entity_id}, ${fmtPeriod(dupFirst.period)}`,
  'self-approved-entry': `${sa.entity_id}, ${fmtPeriod(sa.period)}`,
  'credit-limit': `${gl.entity_id}, up to ${fmtPeriod(glHistory.at(-1).period)}`,
};

// The documents: every file a finding rests on or an agent reads, in a fixed order: text files, then
// CSVs, each alphabetical. The same dataset always produces the same order.
const DOCUMENT_ORDER = { document: 0, spreadsheet: 1 };
const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const documentFiles = [
  ...new Set([...findings.flatMap((f) => f.sources), ...closeSource.agents.flatMap((a) => a.reads)]),
]
  .map((name) => {
    const file = pack.find((f) => f.name === name);
    must(file, `${name} (a finding's source or an agent's read) is a pack file`);
    return file;
  })
  .sort((a, b) => DOCUMENT_ORDER[a.kind] - DOCUMENT_ORDER[b.kind] || byCodeUnit(a.name, b.name));
const SLUGS = {
  [P.policies]: 'accounting-policies',
  [P.closeCalendar]: 'close-calendar',
  [P.closeMemo]: 'close-memo',
  [P.financeTeam]: 'finance-team',
  [P.aging]: 'ar-aging',
  [P.manualJournals]: 'manual-journals',
  [P.salesInvoices]: 'sales-invoices',
  [P.supplierInvoices]: 'supplier-invoices',
  [P.supplierPayments]: 'supplier-payments',
};
const slugOf = (name) => {
  must(SLUGS[name], `a slug for ${name}`);
  return SLUGS[name];
};

// What each CSV extract shows. Only the columns a reader needs to check a finding, the evidence
// first, so it's on screen before the table has to scroll: the count above the extract says how many
// were left out. Headers are the file's own names (docs/agent-voice.md).
const mono = (name) => ({ name, style: 'id' });
const text = (name) => ({ name });
const figure = (name) => ({ name, style: 'figure' });
const CSV_TABLES = {
  [P.aging]: {
    rows: arAging,
    all: Object.keys(arAging[0]).length,
    columns: [
      text('period'),
      mono('customer_id'),
      figure('total_open'),
      text('currency'),
      figure('current'),
      figure('past_due_1_30'),
      figure('past_due_31_60'),
      text('oldest_due_date'),
    ],
  },
  [P.manualJournals]: {
    rows: manualRows,
    all: jeCols.length,
    columns: [
      mono('je_id'),
      figure('line_no'),
      mono('created_by'),
      mono('approved_by'),
      figure('debit'),
      figure('credit'),
      text('currency'),
      mono('account_id'),
      text('account_name'),
      text('posting_date'),
      text('entity_id'),
    ],
  },
  [P.salesInvoices]: {
    rows: salesRows,
    all: Object.keys(salesInvoices[0]).length,
    columns: [
      mono('invoice_id'),
      text('invoice_date'),
      text('delivery_date'),
      figure('net_amount'),
      text('currency'),
      text('entity_id'),
      mono('customer_id'),
    ],
  },
  [P.supplierInvoices]: {
    rows: supplierRows,
    all: Object.keys(supplierInvoices[0]).length,
    columns: [
      mono('ap_invoice_id'),
      mono('supplier_invoice_number'),
      text('invoice_date'),
      text('description'),
      figure('gross_amount'),
      figure('amount_paid'),
      text('currency'),
      text('entity_id'),
      mono('supplier_id'),
    ],
  },
  [P.supplierPayments]: {
    rows: paymentRows,
    all: Object.keys(supplierPayments[0]).length,
    columns: [
      mono('payment_id'),
      mono('ap_invoice_id'),
      text('payment_date'),
      figure('amount'),
      text('currency'),
      text('entity_id'),
      mono('supplier_id'),
    ],
    covers: `All ${entities.length} entities, payments dated ${fmtPeriod(H1[0])} to ${fmtPeriod(H1.at(-1))}`,
  },
};

// The records in a CSV each finding rests on. When they aren't next to each other, the extract is the
// file's rows for `whole` instead, and the count says so.
const dupSupplierName = readCsv('01_master_data/suppliers.csv').find(
  (r) => r.supplier_id === dupFirst.supplier_id,
)?.supplier_name;
must(dupSupplierName, `supplier ${dupFirst.supplier_id} in suppliers.csv`);
const supplierRowsOfDup = { label: dupSupplierName, match: (r) => r.supplier_id === dupFirst.supplier_id };
const ITEM_RECORDS = [
  {
    finding: 'revenue-cut-off',
    file: P.salesInvoices,
    ids: [cutoff.invoice_id],
    isRecord: (r) => r.invoice_id === cutoff.invoice_id,
  },
  {
    finding: 'duplicate-payment',
    file: P.supplierInvoices,
    ids: dup.map((d) => d.ap_invoice_id),
    isRecord: (r) => dup.some((d) => d.ap_invoice_id === r.ap_invoice_id),
    whole: supplierRowsOfDup,
  },
  {
    finding: 'duplicate-payment',
    file: P.supplierPayments,
    ids: dupPayments.map((p) => p.payment_id),
    isRecord: (r) => dupPayments.some((p) => p.payment_id === r.payment_id),
    whole: supplierRowsOfDup,
  },
  { finding: 'self-approved-entry', file: P.manualJournals, ids: [sa.je_id], isRecord: (r) => r.je_id === sa.je_id },
  {
    finding: 'credit-limit',
    file: P.aging,
    ids: [gl.customer_id],
    isRecord: (r) => r.customer_id === gl.customer_id && glOverBeforeHold.some((m) => m.period === r.period),
    whole: { label: gl.customer_name, match: (r) => r.customer_id === gl.customer_id },
  },
];

const EXTRACT_ROWS_EITHER_SIDE = 10;
const count = (n) => n.toLocaleString('en-US');

// The extract, and which of its rows hold the record: the finding's ref keeps those, not the document.
const recordRows = {};
function csvTable(name) {
  const table = CSV_TABLES[name];
  must(table, `an extract layout for ${name}`);
  const record = ITEM_RECORDS.find((c) => c.file === name);
  must(record, `the record ${name} is read for`);
  const hits = table.rows.flatMap((r, i) => (record.isRecord(r) ? [i] : []));
  must(hits.length > 0, `${name} holds its record (${record.ids.join(', ')})`);
  let rows;
  let rowsFor;
  if (hits.at(-1) - hits[0] + 1 === hits.length) {
    rows = table.rows.slice(
      Math.max(0, hits[0] - EXTRACT_ROWS_EITHER_SIDE),
      hits.at(-1) + EXTRACT_ROWS_EITHER_SIDE + 1,
    );
  } else {
    must(record.whole, `${name}'s records are apart, so its extract needs whole rows to show`);
    rows = table.rows.filter(record.whole.match);
    rowsFor = record.whole.label;
  }
  recordRows[name] = rows.flatMap((r, i) => (record.isRecord(r) ? [i] : []));
  const names = table.columns.map((c) => c.name);
  return {
    rowCount: table.rows.length,
    columnCount: table.all,
    ...(rowsFor ? { rowsFor } : {}),
    columns: table.columns,
    rows: rows.map((r) => names.map((k) => r[k])),
  };
}

function fileLines(name) {
  const lines = packText(name).split('\n');
  return lines.at(-1) === '' ? lines.slice(0, -1) : lines;
}

// A document's named section, as close-demo.json gives it, or its first section. A section runs to the
// next heading at its level or above.
function documentText(name) {
  const lines = fileLines(name);
  const section = closeSource.sources[name]?.section;
  const level = (line) => line.match(/^(#+) /)?.[1].length ?? 0;
  let from = 0;
  let to;
  if (section) {
    from = lines.findIndex((l) => level(l) > 0 && l.replace(/^#+ /, '').startsWith(section));
    must(from >= 0, `${name} has a section named "${section}"`);
    const rest = lines.slice(from + 1).findIndex((l) => level(l) > 0 && level(l) <= level(lines[from]));
    to = rest < 0 ? lines.length : from + 1 + rest;
  } else {
    const second = lines.slice(1).findIndex((l) => level(l) > 0);
    to = second < 0 ? lines.length : second + 1;
  }
  for (const e of closeSource.exceptions.filter((x) => x.quote?.file === name))
    must(
      e.quote.lines[0] > from && e.quote.lines[1] <= to,
      `${name}'s extract shows lines ${e.quote.lines.join(' to ')}, which ${e.id}'s rule rests on`,
    );
  return {
    ...(section ? { section } : {}),
    firstLine: from + 1,
    lineCount: lines.length,
    lines: lines.slice(from, to),
  };
}

function csvCovers(name) {
  const { rows, covers } = CSV_TABLES[name];
  if (covers) return covers;
  const ents = [...new Set(rows.map((r) => r.entity_id))];
  const periods = rows.map((r) => r.period).sort();
  must(ents[0] && periods[0], `${name} has entity and period columns, or close-demo.json says what it covers`);
  const who = ents.length === entities.length ? `All ${entities.length} entities` : ents.join(', ');
  const when =
    periods[0] === periods.at(-1) ? fmtPeriod(periods[0]) : `${fmtPeriod(periods[0])} to ${fmtPeriod(periods.at(-1))}`;
  return `${who}, ${when}`;
}

const documents = documentFiles.map((file) => {
  const csv = file.kind === 'spreadsheet';
  const authored = closeSource.sources[file.name]?.covers;
  const about = authored ? fill(authored) : csv ? csvCovers(file.name) : undefined;
  must(about, `close-demo.json says what ${file.name} covers`);
  return {
    slug: slugOf(file.name),
    file: file.name,
    about,
    size: file.bytes,
    ...(csv ? { table: csvTable(file.name) } : { text: documentText(file.name) }),
  };
});

// A finding owns its links: the lines its rule rests on, and the rows that show the evidence.
function refsOf(e, finding) {
  return finding.sources.map((name) => {
    if (name === e.quote?.file) return { doc: slugOf(name), lines: e.quote.lines };
    must(
      ITEM_RECORDS.some((c) => c.finding === e.id && c.file === name),
      `${e.id} says which record in ${name} it rests on`,
    );
    return { doc: slugOf(name), rows: recordRows[name] };
  });
}

// A rule a document states: its lines must still say it.
const ruleStands = (e, finding) => {
  must(!finding.words === !e.quote, `${e.id} quotes a document exactly when its rule rests on one`);
  if (!e.quote) return;
  must(e.quote.file === finding.sources[0], `${e.id} quotes ${finding.sources[0]} for its rule`);
  const lines = fileLines(e.quote.file);
  const [from, to] = e.quote.lines;
  must(from >= 1 && to >= from && to <= lines.length, `${e.quote.file} has lines ${from} to ${to} (${e.id})`);
  must(
    lines
      .slice(from - 1, to)
      .join(' ')
      .toLowerCase()
      .includes(finding.words.toLowerCase()),
    `${e.quote.file} says "${finding.words}" in lines ${from} to ${to}`,
  );
};

// Exceptions: one per finding, in the order the channel shows them, each with its evidence.
const agentKeys = closeSource.agents.map((a) => a.key);
const memberKeys = new Set([...Object.keys(closePeople), ...agentKeys]);
const mustBeMember = (key, where) =>
  must(memberKeys.has(key), `${key} (${where}) is a person or an agent in close-demo.json`);
const channelIds = closeSource.channels.map((c) => c.id);
must(
  closeSource.exceptions.length === findings.length &&
    findings.every((c) => closeSource.exceptions.some((e) => e.id === c.id)),
  'close-demo.json has one exception per finding',
);
const closeExceptions = closeSource.exceptions.map((e) => {
  const finding = findings.find((c) => c.id === e.id);
  must(agentKeys.includes(e.agent), `${e.id} is raised by an agent in close-demo.json`);
  must(channelIds.includes(e.channel), `${e.id} sits in a channel in close-demo.json`);
  for (const r of e.replies) mustBeMember(r.author, `${e.id} reply`);
  if (e.resolution) mustBeMember(e.resolution.by, `${e.id} resolution`);
  for (const s of finding.sources) must(packNames.has(s), `${s} (${e.id}) is a pack file`);
  // Sources needs it (docs/agent-voice.md principle 4): [] says every part was checked.
  must(Array.isArray(e.notChecked), `${e.id} says what wasn't checked (notChecked, [] for nothing)`);
  ruleStands(e, finding);
  const { quote: _quote, ...authored } = e;
  return fillAll({
    ...authored,
    scope: FINDING_SCOPE[e.id],
    rule: curly(finding.rule),
    evidence: curly(finding.evidence),
    refs: refsOf(e, finding),
  });
});

for (const c of closeSource.channels) {
  for (const m of c.members) mustBeMember(m, `#${c.name}`);
  mustBeMember(c.owner, `#${c.name}'s owner`);
}
for (const m of closeSource.directMessages) must(m in closePeople, `${m} (direct messages) is a person`);
must(closeSource.agentRules.setUpBy in closePeople, 'the agents are set up by a person');
for (const a of closeSource.agents) {
  must(
    findings.some((c) => c.id === a.finding),
    `${a.key}'s finding ${a.finding} exists`,
  );
  must(a.starters.length === 2, `${a.key} has two suggested questions`);
  for (const f of a.reads) must(packNames.has(f), `${f} (${a.key} reads) is a pack file`);
  for (const q of a.starters) {
    // Sources needs it (docs/agent-voice.md principle 4).
    must(Array.isArray(q.notChecked), `${a.key}: "${q.question}" says what wasn't checked`);
    for (const f of q.sources) must(a.reads.includes(f), `${f} (${a.key}: "${q.question}") is in ${a.key}'s reads`);
  }
}

// The proposed reversal: the invoice's own lines, from the chart of accounts. Debits equal credits.
const coa = readCsv('01_master_data/chart_of_accounts.csv');
const account = (id) => {
  const a = coa.find((r) => r.account_id === id);
  must(a, `account ${id} in chart_of_accounts.csv`);
  return { account: id, name: a.account_name };
};
must(cutoffItem.revenue_account_id === '4000', `${cutoff.invoice_id} is equipment revenue (4000)`);
const reversal = [
  { ...account('4000'), debit: num(cutoff.net_amount), credit: 0 },
  { ...account('2300'), debit: num(cutoff.tax_amount), credit: 0 },
  { ...account('1100'), debit: 0, credit: num(cutoff.gross_amount) },
  { ...account('1200'), debit: num(cutoffItem.cost_amount_local), credit: 0 },
  { ...account('5000'), debit: 0, credit: num(cutoffItem.cost_amount_local) },
];
must(
  sum(reversal.map((l) => l.debit)) === sum(reversal.map((l) => l.credit)),
  `the ${cutoff.invoice_id} reversal balances`,
);
must(closeSource.hero.exception === 'revenue-cut-off', 'the hero decision is the revenue cut-off');
must(
  closeSource.hero.options.some((o) => o.id === closeSource.hero.delegate.option),
  'the option "Choose for me" picks is one of the hero options',
);

// Checks: the before and after figure of each tie-out the close panel shows.
const closeChecks = [
  {
    id: 'revenue-cut-off',
    label: 'Revenue cut-off',
    meaning: `${fmtPeriod(LAST_CLOSED)} revenue on invoices delivered after the month`,
    currency: 'JPY',
    before: cutoffBefore,
    after: 0,
  },
  {
    id: 'duplicate-payment',
    label: 'Supplier payments',
    meaning: 'Paid twice on one supplier invoice number',
    currency: dup[0].currency,
    before: num(dup[0].gross_amount) * (dupPaid.filter(Boolean).length - 1),
    after: 0,
  },
].map((c) => ({ ...c, beforeLabel: money(c.before, c.currency), afterLabel: money(c.after, c.currency) }));
for (const c of closeChecks) must(c.before > 0, `the ${c.id} check has something to fix`);
must(Number.isInteger(closeSource.typingMs) && closeSource.typingMs > 0, 'close-demo.json gives typingMs');

await writeJson('apps/demo/data/people.json', closePeople);
await writeJson('apps/demo/data/documents.json', documents);
await writeJson('apps/demo/data/close.json', {
  scene: closeSource.scene,
  period: fillAll(closeSource.period),
  agentRules: closeSource.agentRules,
  agents: fillAll(closeSource.agents).map((a) => ({
    ...a,
    reads: a.reads.map(slugOf),
    starters: a.starters.map((q) => ({ ...q, sources: q.sources.map(slugOf) })),
  })),
  channels: fillAll(closeSource.channels),
  directMessages: closeSource.directMessages,
  typingMs: closeSource.typingMs,
  searchSuggestions: fillAll(closeSource.searchSuggestions),
  exceptions: closeExceptions,
  hero: fillAll({
    ...closeSource.hero,
    entry: {
      ...closeSource.hero.entry,
      entity: cutoff.entity_id,
      postingDate: `${LAST_CLOSED}-${cutoff.invoice_date.slice(8)}`,
      currency: 'JPY',
      lines: reversal,
    },
  }),
});
await writeJson('apps/demo/data/checks.json', closeChecks);

// The public site (apps/site, docs/site.md §5 and D5): exactly the records it shows, and nothing it
// would have to type. It comes after the workspace because the closing band (D7) names the workspace's
// agents and visitor. The hero proposes reversing the duplicate supplier invoice; once a person posts
// it, the entry takes the next journal number in that entity's open month. Numbers run per entity per
// month (JE-KUK-2608-00055), so the next one is computed from the journal, never assumed.
const JE_ID = /^JE-[A-Z]{3}-\d{4}-\d{5}$/;
must(
  journal.some((l) => JE_ID.test(l.je_id)),
  'journal entry IDs in the JE-<entity>-<YYMM>-<number> form',
);
const jePrefix = `JE-${dup[0].entity_id}-${OPEN.period.slice(2, 4)}${OPEN.period.slice(5, 7)}-`;
const openNumbers = journal.filter((l) => l.je_id.startsWith(jePrefix)).map((l) => Number(l.je_id.slice(-5)));
await writeJson('apps/site/data/kasane.json', {
  company: {
    name: fixtures.company.name,
    legalName: fixtures.company.legalName,
    lastClosedPeriod: fixtures.company.lastClosedPeriod,
    openPeriod: fixtures.company.openPeriod,
    visitor: { title: closePeople.visitor.title },
  },
  agents: closeSource.agents.length,
  pack: pack.map(({ name, kind, bytes }) => ({ name, kind, bytes })),
  findings: findings.length,
  duplicatePayment: {
    entity: dup[0].entity_id,
    supplierInvoice: dup[0].supplier_invoice_number,
    entries: dup.map((d) => d.ap_invoice_id),
    amount: num(dup[0].gross_amount),
    currency: dup[0].currency,
    paid: dupPaid,
    sources: [P.supplierInvoices, P.supplierPayments],
    payments: dupPayments.map((p) => p.payment_id),
    nextJournalId: `${jePrefix}${String(Math.max(0, ...openNumbers) + 1).padStart(5, '0')}`,
  },
  operatingBridge: fixtures.operatingBridge,
});

console.log(
  `kasane fixtures: ${pack.length} pack files (${(sum(pack.map((f) => f.bytes)) / 1024 / 1024).toFixed(1)} MB), ` +
    `${findings.length} findings; ` +
    `H1 operating profit ¥${(h1.operatingProfit.actual / 1e6).toFixed(0)}m vs budget ¥${(h1.operatingProfit.budget / 1e6).toFixed(0)}m`,
);
