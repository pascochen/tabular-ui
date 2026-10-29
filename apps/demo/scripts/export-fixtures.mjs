#!/usr/bin/env node
// Builds everything the UI reads about Kasane Corporation from the full Kasane dataset.
// No number in the outputs is typed by hand: each one is computed here from the CSVs.
//
//   KASANE_DATA_DIR=/path/to/kasane pnpm --filter tabular-ui-demo export-fixtures
//
// The dataset is not in this repository. KASANE_DATA_DIR points at its root: the folder holding
// 01_master_data/ … 05_reporting/, docs/ and onboarding/ (the transcripts, the org chart and
// close-demo.json).
//
// Writes:
//   packages/ui/src/fixtures/kasane.ts   story fixtures (never exported from src/index.ts)
//   apps/demo/data/pack.json             the files a visitor "uploads": name, kind, size, and a
//                                        spreadsheet's first line, which the header check reads
//   apps/demo/data/company.json          the company and the visitor's persona
//   apps/demo/data/discovery.json        what the agent says it learned, and from which files
//   apps/demo/data/findings.json         contradictions, gaps and follow-ups, and their files
//   apps/demo/data/people.json           the close demo's people, by role, from employees.csv
//   apps/demo/data/close.json            the scripted #sep-close channel: exceptions, replies, the hero
//                                        decision and its proposed entry (copy from
//                                        onboarding/close-demo.json, figures from the data)
//   apps/demo/data/checks.json           each close check's figure before and after its fix
//   apps/site/data/kasane.json           the public site's specimen records (docs/site.md §5)
//
// Only what the demo's screens read is written: no file contents, no rows.
// Re-running it on an unchanged dataset produces no diff.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';

// The repo root: this script writes into apps/demo, apps/site and packages/ui.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
if (!process.env.KASANE_DATA_DIR) {
  throw new Error('Set KASANE_DATA_DIR to the root of the Kasane dataset. It is not in this repository.');
}
const data = resolve(process.env.KASANE_DATA_DIR);
for (const dir of ['01_master_data', '03_general_ledger', '05_reporting', 'docs', 'onboarding']) {
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

const SALES_ACCTS = ['4000', '4100', '4200', '4300', '4900'];
const isPl = (a) => /^[4-8]/.test(a);
const isOperating = (a) => /^[456]/.test(a);
function ledger(entity, periods, accounts) {
  return sum(
    journal
      .filter((l) => l.entity_id === entity && periods.includes(l.period) && accounts(l.account_id))
      .map((l) => num(l.credit) - num(l.debit)),
  );
}
function planned(entity, periods, accounts, version = BUDGET) {
  return -sum(
    plan
      .filter(
        (r) =>
          r.version_id === version &&
          r.measure === 'amount' &&
          r.entity_id === entity &&
          periods.includes(r.period) &&
          accounts(r.account_id),
      )
      .map((r) => num(r.value)),
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
// Findings: what the material contradicts, what it lacks, what to ask. Every evidence value is read
// from the data. `sources` are pack file names: a finding counts only if all its sources were read.
// ---------------------------------------------------------------------------

const T = {
  cfo: '01_kickoff_cfo_2026-10-12.txt',
  fpa: '02_interview_fpa_2026-10-13.txt',
  controller: '03_interview_controller_2026-10-13.txt',
  treasury: '04_interview_treasury_2026-10-14.txt',
  arap: '05_interview_ar_ap_2026-10-14.txt',
  plant: '06_interview_plant_cost_2026-10-15.txt',
};
const P = {
  trialBalance: 'trial_balance_monthly.csv',
  coa: 'chart_of_accounts.csv',
  aging: 'ar_aging_monthly.csv',
  manualJournals: `manual_journal_entries_fy${FY}_h1.csv`,
  supplierInvoices: `supplier_invoices_fy${FY}_h1.csv`,
  salesInvoices: `sales_invoices_${LAST_CLOSED}.csv`,
  budget: 'budget_forecast_monthly.csv',
  bank: `bank_export_kjp_${LAST_CLOSED}.csv`,
  profile: 'company_profile.md',
  policies: 'accounting_policies.md',
  closeCalendar: 'close_calendar.md',
  closeMemo: `close_memo_${LAST_CLOSED}.md`,
  forecastMemo: `forecast_memo_fy${FY}_6+6.md`,
  orgChart: 'org_chart_finance_2026-10.png',
};

// 1. Self-approved manual entry over the approver's limit (KUK).
const selfApproved = journal.filter((l) => l.je_type === 'Manual' && l.created_by && l.created_by === l.approved_by);
const sa = selfApproved.find((l) => num(l.debit) > 0);
const saPerson = employees.find((e) => e.employee_id === sa?.created_by);
// 2. Revenue cut-off: invoiced in the closed month, delivered after it.
const cutoff = salesInvoices.find(
  (r) => r.period === LAST_CLOSED && r.delivery_date > r.invoice_date && r.delivery_date.slice(0, 7) !== LAST_CLOSED,
);
// 3. Great Lakes over its credit limit before August.
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
// 5. Close length: the CFO says five days; the calendar says business day six.
const lastClose = calendar.find((r) => r.period === LAST_CLOSED);
const closeDay = (() => {
  const d = new Date(`${lastClose.close_completed_date}T00:00:00Z`);
  let n = 0;
  for (let x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); x <= d; x.setUTCDate(x.getUTCDate() + 1)) {
    if (x.getUTCDay() !== 0 && x.getUTCDay() !== 6) n++;
  }
  return n;
})();
// 6. "Europe is on plan in euros."
const kdeSales = ledger('KDE', H1, (a) => SALES_ACCTS.includes(a));
const kdeSalesBudget = planned('KDE', H1, (a) => SALES_ACCTS.includes(a));
const kdeEquipment = ledger('KDE', H1, (a) => a === '4000');
const kdeEquipmentBudget = planned('KDE', H1, (a) => a === '4000');
const kdeProfit = ledger('KDE', H1, isOperating);
const kdeProfitBudget = planned('KDE', H1, isOperating);

// Each contradiction must still be true, on both sides: the data shows it, and the transcript still
// says the thing the data contradicts. Change either one and the build stops here.
must(sa, 'a manual journal entry created and approved by the same person');
const saLines = journal.filter((l) => l.je_id === sa.je_id);
must(
  saLines.some((l) => l.account_id === '1300' && num(l.debit) > 0) &&
    saLines.some((l) => l.account_id === '6100' && num(l.credit) > 0),
  `${sa.je_id} moves advertising (6100) to prepaid expenses (1300)`,
);
must(saPerson && num(sa.debit) > num(saPerson.approval_limit_local), `${sa.je_id} is over its approver's limit`);
must(cutoff, `a ${LAST_CLOSED} invoice delivered after the month`);
must(
  glOverLimit.some((r) => r.period < '2026-08'),
  'Great Lakes Duplicating Supply over its credit limit before August 2026',
);
must(glLastReceipt, 'a receipt from Great Lakes Duplicating Supply');
must(dup && dupPaid.some(Boolean), 'a supplier invoice number entered twice and paid');
must(closeDay > 5, `${LAST_CLOSED} locked after business day 5 (it was day ${closeDay})`);
must(kdeSales < kdeSalesBudget, 'Kasane Europe H1 external sales under budget');
must(kdeEquipment < kdeEquipmentBudget, 'Kasane Europe H1 equipment sales under budget');
must(kdeProfit > kdeProfitBudget, 'Kasane Europe H1 operating profit above budget');
const transcript = (file) => readFileSync(join(data, 'onboarding/transcripts', file), 'utf8').replace(/\s+/g, ' ');
const SAID = {
  'self-approved-entry': [T.controller, 'You cannot approve your own entry. Group-wide.'],
  'revenue-cut-off': [T.controller, 'September cut-off was clean.'],
  'credit-limit': [T.arap, 'They were never over their limit until August.'],
  'duplicate-payment': [T.arap, 'The system blocks a duplicate supplier invoice number'],
  'close-length': [T.cfo, 'We close in five working days.'],
  'europe-on-plan': [T.fpa, 'Europe is on plan in euros.'],
};
for (const [id, [file, words]] of Object.entries(SAID)) {
  must(transcript(file).includes(words), `${file} still says "${words}" (${id})`);
}

const pct = (a, b) => Math.round(((a - b) / Math.abs(b)) * 1000) / 10;
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

const contradictions = [
  {
    id: 'self-approved-entry',
    claim: 'The controller says every manual journal has a different approver, enforced group-wide.',
    evidence: `${sa.je_id} (${sa.entity_id}, ${fmtDate(sa.posting_date)}) moves ${money(num(sa.debit), sa.currency)} from advertising to prepaid expenses. The same person, ${sa.created_by}, created and approved it. Whether it was over their limit needs the employee master, which isn't in this material.`,
    sources: [T.controller, P.manualJournals],
  },
  {
    id: 'revenue-cut-off',
    claim: `The controller says the ${fmtPeriod(LAST_CLOSED)} cut-off was clean.`,
    evidence: `${cutoff.invoice_id} (${money(num(cutoff.net_amount), 'JPY')} net) is dated ${fmtDate(cutoff.invoice_date)} but delivered ${fmtDate(cutoff.delivery_date)}. Revenue belongs to the next month.`,
    sources: [T.controller, P.salesInvoices],
  },
  {
    id: 'credit-limit',
    claim: 'US credit says Great Lakes Duplicating Supply was within its credit limit until August.',
    evidence: `Its balance was over the ${money(glLimit, 'USD')} limit in ${fmtPeriods(
      glOverLimit.filter((r) => r.period < '2026-08').map((r) => r.period),
    )}. The last payment arrived ${fmtDate(glLastReceipt)}.`,
    sources: [T.arap, P.aging],
  },
  {
    id: 'duplicate-payment',
    claim: 'AP says the system blocks a duplicate supplier invoice number, in every entity.',
    evidence: `${dup[0].entity_id} entered supplier invoice ${dup[0].supplier_invoice_number} twice (${dup.map((d) => d.ap_invoice_id).join(' and ')}), ${money(num(dup[0].gross_amount), dup[0].currency)} each, and ${dupPaid.every(Boolean) ? 'paid both' : 'paid one'}.`,
    sources: [T.arap, P.supplierInvoices],
  },
  {
    id: 'close-length',
    claim: 'The CFO says the group closes in five working days.',
    evidence: `${fmtPeriod(LAST_CLOSED)} was locked on ${fmtDate(lastClose.close_completed_date)}, business day ${closeDay}, not 5.`,
    sources: [T.cfo, P.closeCalendar],
  },
  {
    id: 'europe-on-plan',
    claim: 'FP&A says Europe is on plan in euros.',
    evidence: `Kasane Europe's H1 external sales were ${money(kdeSales, 'EUR')} against a budget of ${money(kdeSalesBudget, 'EUR')} (${-pct(kdeSales, kdeSalesBudget)}% under). Equipment was ${-pct(kdeEquipment, kdeEquipmentBudget)}% under. Profit is above plan; sales are not.`,
    sources: [T.fpa, P.trialBalance, P.budget],
  },
];

const gaps = [
  {
    id: 'inventory-reserve',
    text: 'No reserve for slow-moving or expired stock, though ink has a shelf life.',
    sources: [T.plant, P.policies],
  },
  {
    id: 'lease-inventory',
    text: 'No lease inventory yet, and the new lease standard applies from April 2027.',
    sources: [T.plant, P.policies],
  },
  {
    id: 'october-open',
    text: `${fmtPeriod(OPEN.period)} is open: no month-end entries, data through ${fmtDate(OPEN.data_loaded_through)}.`,
    sources: [T.controller, P.closeCalendar],
  },
  {
    id: 'shanghai-mapping',
    text: "Shanghai's local account codes are mapped in a spreadsheet nobody has sent.",
    sources: [T.cfo, T.fpa],
  },
  {
    id: 'cash-forecast',
    text: 'No 13-week cash forecast inputs: treasury builds it by hand from aging and AP due dates.',
    sources: [T.treasury],
  },
  {
    id: 'product-line-tags',
    text: 'Subsidiaries tag product lines differently, so equipment, consumables and service can drift.',
    sources: [T.fpa, P.coa],
  },
  {
    id: 'transfer-price-policy',
    text: 'Quarterly transfer-price resets are under discussion with no decision recorded.',
    sources: [T.treasury, P.policies],
  },
  {
    id: 'forecast-customers',
    text: 'The forecast has no customer dimension, so the Great Lakes adjustment sits on a whole entity.',
    sources: [P.forecastMemo, P.budget],
  },
];

const followUps = [
  {
    id: 'great-lakes-decision',
    text: 'When does legal decide on Great Lakes, and who approves a write-off of the remaining 40%?',
    sources: [T.arap, P.closeMemo],
  },
  {
    id: 'rate-per-screen',
    text: 'Which rate should each converted figure show: average, closing or budget?',
    sources: [T.treasury],
  },
  {
    id: 'audience',
    text: 'Who sees the group view, who sees one entity, and what do auditors see?',
    sources: [T.cfo, P.orgChart],
  },
  {
    id: 'japanese-terms',
    text: 'Which Japanese finance terms should I recognise in questions?',
    sources: [T.cfo],
  },
  {
    id: 'approval-limits',
    text: 'Where are subsidiary approval limits kept, and are they enforced or advisory?',
    sources: [T.controller, P.manualJournals],
  },
  {
    id: 'cut-off-evidence',
    text: `Is there a delivery confirmation for ${cutoff.invoice_id}?`,
    sources: [T.controller, P.salesInvoices],
  },
  {
    id: 'variance-by-product',
    text: 'Should plant variances split price and usage by product, monthly?',
    sources: [T.plant],
  },
  {
    id: 'unexplained-remainder',
    text: 'How should the bridge show what it cannot explain?',
    sources: [T.fpa, P.forecastMemo],
  },
  {
    id: 'rebate-release',
    text: 'Should quarterly rebate releases be shown apart from sales?',
    sources: [T.fpa, P.policies],
  },
  {
    id: 'bank-header',
    text: 'Can the bank portal export a header row, or is the six-column layout fixed?',
    sources: [T.treasury, P.bank],
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

for (const f of readdirSync(join(data, 'onboarding/transcripts')).sort())
  addPack(f, 'transcript', copy(`onboarding/transcripts/${f}`));
addPack(P.profile, 'document', copy('docs/01_company_profile.md'));
addPack(P.policies, 'document', copy('docs/06_accounting_policies.md'));
addPack(P.closeCalendar, 'document', copy('docs/07_close_calendar.md'));
addPack(P.closeMemo, 'document', copy('docs/commentary/2026-09_month_end_close_memo.md'));
addPack(P.forecastMemo, 'document', copy('docs/commentary/FY2026_6+6_forecast_memo.md'));
addPack(P.trialBalance, 'spreadsheet', copy('03_general_ledger/trial_balance_monthly.csv'));
addPack(P.coa, 'spreadsheet', copy('01_master_data/chart_of_accounts.csv'));
addPack(P.aging, 'spreadsheet', copy('05_reporting/ar_aging_monthly.csv'));
addPack(P.budget, 'spreadsheet', copy('04_planning/budget_forecast_monthly.csv'));
const jeCols = Object.keys(journal[0]);
addPack(
  P.manualJournals,
  'spreadsheet',
  writeText(
    toCsv(
      journal.filter((l) => l.je_type === 'Manual' && H1.includes(l.period)),
      jeCols,
    ),
  ),
);
addPack(
  P.supplierInvoices,
  'spreadsheet',
  writeText(
    toCsv(
      supplierInvoices.filter((r) => H1.includes(r.period)),
      Object.keys(supplierInvoices[0]),
    ),
  ),
);
addPack(
  P.salesInvoices,
  'spreadsheet',
  writeText(
    toCsv(
      salesInvoices.filter((r) => r.period === LAST_CLOSED),
      Object.keys(salesInvoices[0]),
    ),
  ),
);
// The bank export has no header row, as the bank portal produces it (treasury interview).
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
addPack(P.orgChart, 'image', copy(`onboarding/${P.orgChart}`));

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
  Object.fromEntries(
    Object.entries(item).map(([k, v]) => [k, ['text', 'claim', 'evidence'].includes(k) ? curly(v) : v]),
  );

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

await writeJson('apps/demo/data/pack.json', pack);
await writeJson('apps/demo/data/company.json', {
  ...fixtures.company,
  persona: { name: people.fpa.name, title: people.fpa.title },
});
// Each bullet names the files it rests on, as the findings do, so a run
// that stops early shows only what it read (foundIn, apps/demo/src/lib/findings.ts).
await writeJson(
  'apps/demo/data/discovery.json',
  [
    {
      id: 'company',
      text: `${fixtures.company.legalName} is a Tokyo maker of stencil duplicators and inkjet printers. FY${FY - 1} net sales were ¥${(fyPrior.netSales / 1e9).toFixed(1)}bn, and ${Math.round(consumablesShareFyPrior)}% came from ink and masters, so the ${Math.round(fixtures.company.installedBase / 1000)}k machines in the field drive the business.`,
      sources: [P.profile],
    },
    {
      id: 'group',
      text: `Five companies report to the group in yen: the Tokyo parent, which also makes every product, and sales subsidiaries in the US, Germany, the UK and China. The fiscal year runs April to March, and ${fmtPeriod(LAST_CLOSED)} closed the first half.`,
      sources: [P.profile, P.closeCalendar],
    },
    {
      id: 'brief',
      text: `Finance wants the month explained, not only reported: every figure traced to its journal entries, a budget bridge that separates exchange rates from performance, and early warning on customers who pay later each month. I can propose entries; people post them.`,
      sources: [T.cfo, T.fpa],
    },
  ].map(curlyCopy),
);
await writeJson('apps/demo/data/findings.json', {
  contradictions: contradictions.map(curlyCopy),
  gaps: gaps.map(curlyCopy),
  followUps: followUps.map(curlyCopy),
});

// The public site (apps/site, docs/site.md §5 and D5): exactly the records its specimens show, and
// nothing it would have to type. The hero proposes reversing the duplicate supplier invoice; once a
// person posts it, the entry takes the next journal number in that entity's open month. Numbers run
// per entity per month (JE-KUK-2608-00055), so the next one is computed from the journal, never assumed.
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
    persona: { name: people.fpa.name, title: people.fpa.title },
  },
  pack: pack.map(({ name, kind, bytes }) => ({ name, kind, bytes })),
  findings: { contradictions: contradictions.length, gaps: gaps.length, followUps: followUps.length },
  duplicatePayment: {
    entity: dup[0].entity_id,
    supplierInvoice: dup[0].supplier_invoice_number,
    entries: dup.map((d) => d.ap_invoice_id),
    amount: num(dup[0].gross_amount),
    currency: dup[0].currency,
    paid: dupPaid,
    sources: [T.arap, P.supplierInvoices],
    nextJournalId: `${jePrefix}${String(Math.max(0, ...openNumbers) + 1).padStart(5, '0')}`,
  },
  operatingBridge: fixtures.operatingBridge,
});

// ---------------------------------------------------------------------------
// Close demo: the scripted #sep-close channel. The copy is authored in onboarding/close-demo.json;
// every figure in it is a {token} filled here from the data, and the people are employee ids.
// ---------------------------------------------------------------------------

const closeSource = JSON.parse(readFileSync(join(data, 'onboarding/close-demo.json'), 'utf8'));
const packNames = new Set(pack.map((f) => f.name));
const packText = (name) => readFileSync(join(data, ...packPath(name)), 'utf8');
function packPath(name) {
  if (name.endsWith('.txt')) return ['onboarding/transcripts', name];
  const docs = {
    [P.policies]: 'docs/06_accounting_policies.md',
    [P.closeCalendar]: 'docs/07_close_calendar.md',
    [P.closeMemo]: 'docs/commentary/2026-09_month_end_close_memo.md',
  };
  must(docs[name], `a path for ${name}`);
  return [docs[name]];
}

// People: each must be an employee, and must attend one of the interviews.
const attendees = readdirSync(join(data, 'onboarding/transcripts'))
  .map((f) => readFileSync(join(data, 'onboarding/transcripts', f), 'utf8').match(/^Attendees: (.*)$/m)?.[1] ?? '')
  .join(' ');
const closePeople = Object.fromEntries(
  Object.entries(closeSource.people).map(([key, id]) => {
    must(
      employees.some((e) => e.employee_id === id),
      `employee ${id} (${key}) in employees.csv`,
    );
    const p = person(id);
    must(attendees.includes(p.name), `${p.name} (${key}) attends an interview in onboarding/transcripts/`);
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
const legalDecision = packText(P.closeMemo).match(/legal decision on recovery by (\d+ \w{3})/)?.[1];
must(legalDecision, 'the close memo gives the date legal decides on Great Lakes');
const glOverBeforeAugust = glOverLimit.filter((r) => r.period < '2026-08');
const longMonth = (p) =>
  new Date(`${p}-01T00:00:00Z`).toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const shortDate = (iso) => fmtDate(iso).replace(/ \d{4}$/, '');

const closeTokens = {
  lastClosedLabel: longMonth(LAST_CLOSED).split(' ')[0],
  openLabel: longMonth(OPEN.period).split(' ')[0],
  closeDate: shortDate(lastClose.close_completed_date),
  closeDay: String(closeDay),
  exceptionCount: String(closeSource.exceptions.length),
  resolvedAtLanding: String(closeSource.exceptions.filter((e) => e.atLanding === 'resolved').length),
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
  glOverCount: String(glOverBeforeAugust.length),
  legalDecision,
  europeSalesGap: `${Math.abs(pct(kdeSales, kdeSalesBudget))}%`,
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

// Exceptions: one per contradiction, in the order the channel shows them, each with its evidence.
const memberKeys = new Set([...Object.keys(closePeople), 'agent']);
const mustBeMember = (key, where) => must(memberKeys.has(key), `${key} (${where}) is a person in close-demo.json`);
must(
  closeSource.exceptions.length === contradictions.length &&
    contradictions.every((c) => closeSource.exceptions.some((e) => e.id === c.id)),
  'close-demo.json has one exception per contradiction',
);
const closeExceptions = closeSource.exceptions.map((e) => {
  const finding = contradictions.find((c) => c.id === e.id);
  for (const r of e.replies) mustBeMember(r.author, `${e.id} reply`);
  if (e.resolution) mustBeMember(e.resolution.by, `${e.id} resolution`);
  if (e.waiting)
    must(
      followUps.some((f) => f.id === e.waiting.followUp),
      `follow-up ${e.waiting.followUp} exists`,
    );
  for (const s of finding.sources) must(packNames.has(s), `${s} (${e.id}) is a pack file`);
  // Sources needs it (docs/agent-voice.md principle 4): [] says every part was checked.
  must(Array.isArray(e.notChecked), `${e.id} says what wasn't checked (notChecked, [] for nothing)`);
  return fillAll({ ...e, claim: finding.claim, evidence: finding.evidence, sources: finding.sources });
});

for (const c of closeSource.channels) for (const m of c.members) mustBeMember(m, `#${c.name}`);
for (const m of closeSource.directMessages) mustBeMember(m, 'direct messages');
mustBeMember(closeSource.agent.setUpBy, 'agent profile');
for (const f of closeSource.agent.reads) must(packNames.has(f), `${f} (agent profile) is a pack file`);

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

// Checks: the before and after figure of each tie-out the close panel shows.
const closeChecks = [
  {
    id: 'revenue-cut-off',
    label: 'Revenue cut-off',
    meaning: `${fmtPeriod(LAST_CLOSED)} revenue on invoices delivered after the month`,
    currency: 'JPY',
    before: cutoffBefore,
    after: 0,
    sources: [P.salesInvoices],
  },
  {
    id: 'duplicate-payment',
    label: 'Supplier payments',
    meaning: 'Paid twice on one supplier invoice number',
    currency: dup[0].currency,
    before: num(dup[0].gross_amount) * (dupPaid.filter(Boolean).length - 1),
    after: 0,
    sources: [P.supplierInvoices],
  },
].map((c) => ({ ...c, beforeLabel: money(c.before, c.currency), afterLabel: money(c.after, c.currency) }));
for (const c of closeChecks) must(c.before > 0, `the ${c.id} check has something to fix`);

await writeJson('apps/demo/data/people.json', closePeople);
await writeJson('apps/demo/data/close.json', {
  scene: closeSource.scene,
  agent: fillAll(closeSource.agent),
  channels: fillAll(closeSource.channels),
  directMessages: closeSource.directMessages,
  catchUp: fillAll(closeSource.catchUp),
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

console.log(
  `kasane fixtures: ${pack.length} pack files (${(sum(pack.map((f) => f.bytes)) / 1024 / 1024).toFixed(1)} MB), ` +
    `${contradictions.length} contradictions, ${gaps.length} gaps, ${followUps.length} follow-ups; ` +
    `H1 operating profit ¥${(h1.operatingProfit.actual / 1e6).toFixed(0)}m vs budget ¥${(h1.operatingProfit.budget / 1e6).toFixed(0)}m`,
);
