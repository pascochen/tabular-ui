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
//   apps/demo/data/close.json            the scripted workspace: agents, channels, exceptions, replies,
//                                        the hero decision and its proposed entry (copy from
//                                        onboarding/close-demo.json, figures from the data)
//   apps/demo/data/checks.json           each close check's figure before and after its fix
//   apps/demo/data/sources.json          the binder: each file a finding cites or an agent reads, its
//                                        exhibit ID and a trimmed excerpt
//   apps/site/data/kasane.json           the public site's specimen records (docs/site.md §5)
//
// Only what the demo's screens read is written: no whole files, only the binder's excerpts.
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
const transcript = (file) => readFileSync(join(data, 'onboarding/transcripts', file), 'utf8').replace(/\s+/g, ' ');
const SAID = {
  'self-approved-entry': [T.controller, 'You cannot approve your own entry. Group-wide.'],
  'revenue-cut-off': [T.controller, 'September cut-off was clean.'],
  'credit-limit': [T.arap, 'They were never over their limit until August.'],
  'duplicate-payment': [T.arap, 'The system blocks a duplicate supplier invoice number'],
};
for (const [id, [file, words]] of Object.entries(SAID)) {
  must(transcript(file).includes(words), `${file} still says "${words}" (${id})`);
}

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

const contradictions = [
  {
    id: 'self-approved-entry',
    // The visitor is the controller (D2): the agents check what you told them against the books.
    claim: 'You said every manual journal has a different approver, enforced group-wide.',
    evidence: `${sa.je_id} (${sa.entity_id}, ${fmtDate(sa.posting_date)}) moves ${money(num(sa.debit), sa.currency)} from advertising to prepaid expenses. The same person, ${sa.created_by}, created and approved it. Whether it was over their limit needs the employee master, which isn't in this material.`,
    sources: [T.controller, P.manualJournals],
  },
  {
    id: 'revenue-cut-off',
    claim: `You said the ${longMonth(LAST_CLOSED)} cut-off was clean, in the controller interview on ${shortDate(T.controller.match(/\d{4}-\d{2}-\d{2}/)[0])}.`,
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
const manualRows = journal.filter((l) => l.je_type === 'Manual' && H1.includes(l.period));
const supplierRows = supplierInvoices.filter((r) => H1.includes(r.period));
const salesRows = salesInvoices.filter((r) => r.period === LAST_CLOSED);
addPack(P.manualJournals, 'spreadsheet', writeText(toCsv(manualRows, jeCols)));
addPack(P.supplierInvoices, 'spreadsheet', writeText(toCsv(supplierRows, Object.keys(supplierInvoices[0]))));
addPack(P.salesInvoices, 'spreadsheet', writeText(toCsv(salesRows, Object.keys(salesInvoices[0]))));
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
// The Kasane app: the scripted workspace. The copy is authored in onboarding/close-demo.json; every
// figure in it is a {token} filled here from the data, and the people are employee ids.
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
    [P.forecastMemo]: 'docs/commentary/FY2026_6+6_forecast_memo.md',
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
const auditFieldwork = calendarText.match(/Auditor interim review fieldwork \| ([^(|]+?) \(/)?.[1];
must(auditFieldwork, "close_calendar.md gives the auditors' interim fieldwork dates");
const legalDecision = packText(P.closeMemo).match(/legal decision on recovery by (\d+ \w{3})/)?.[1];
must(legalDecision, 'the close memo gives the date legal decides on Great Lakes');
const glOverBeforeAugust = glOverLimit.filter((r) => r.period < '2026-08');
// What the agents' scripted answers claim, each read from the file the answer cites.
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
  glOverCount: String(glOverBeforeAugust.length),
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
  glOverPeriods: fmtPeriods(glOverBeforeAugust.map((r) => r.period)),
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

// The binder (pages spec, D6): every file a finding, gap or question cites, or an agent reads. Each
// gets an exhibit ID in a fixed order: transcripts, then documents (an image sorts with them), then
// CSVs, each alphabetical. The same dataset always produces the same IDs.
const BINDER_GROUP = { transcript: 0, document: 1, image: 1, spreadsheet: 2 };
const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const binderFiles = [
  ...new Set([
    ...[...contradictions, ...gaps, ...followUps].flatMap((f) => f.sources),
    ...closeSource.agents.flatMap((a) => a.reads),
  ]),
]
  .map((name) => {
    const file = pack.find((f) => f.name === name);
    must(file, `${name} (a finding's source or an agent's read) is a pack file`);
    return file;
  })
  .sort((a, b) => BINDER_GROUP[a.kind] - BINDER_GROUP[b.kind] || byCodeUnit(a.name, b.name));
const exhibitOf = Object.fromEntries(binderFiles.map((f, i) => [f.name, `S-${i + 1}`]));

// What each CSV excerpt shows. Only the columns a reader needs to follow the citation: the count above
// the excerpt says how many were left out. Headers are the file's own names (docs/agent-voice.md).
const mono = (key) => ({ key, mono: true });
const text = (key) => ({ key });
const figure = (key) => ({ key, numeric: true });
const CSV_TABLES = {
  [P.aging]: {
    rows: arAging,
    all: Object.keys(arAging[0]).length,
    columns: [
      text('period'),
      mono('customer_id'),
      text('currency'),
      figure('current'),
      figure('past_due_1_30'),
      figure('past_due_31_60'),
      figure('total_open'),
      text('oldest_due_date'),
    ],
  },
  [P.bank]: {
    rows: bankRows,
    all: 6,
    columns: [text('date'), mono('ref'), text('desc'), figure('out'), figure('in'), figure('balance')],
    covers: `KJP, ${fmtPeriod(LAST_CLOSED)}`,
  },
  [P.budget]: {
    rows: plan,
    all: Object.keys(plan[0]).length,
    columns: [
      mono('version_id'),
      text('entity_id'),
      text('period'),
      text('measure'),
      mono('account_id'),
      text('product_line'),
      figure('value'),
      text('currency'),
    ],
  },
  [P.coa]: {
    rows: readCsv('01_master_data/chart_of_accounts.csv'),
    all: Object.keys(readCsv('01_master_data/chart_of_accounts.csv')[0]).length,
    columns: [
      mono('account_id'),
      text('account_name'),
      text('account_class'),
      text('statement'),
      text('normal_balance'),
    ],
  },
  [P.manualJournals]: {
    rows: manualRows,
    all: jeCols.length,
    columns: [
      mono('je_id'),
      figure('line_no'),
      text('entity_id'),
      text('posting_date'),
      mono('account_id'),
      text('account_name'),
      figure('debit'),
      figure('credit'),
      text('currency'),
      mono('created_by'),
      mono('approved_by'),
    ],
  },
  [P.salesInvoices]: {
    rows: salesRows,
    all: Object.keys(salesInvoices[0]).length,
    columns: [
      mono('invoice_id'),
      text('entity_id'),
      mono('customer_id'),
      text('invoice_date'),
      text('delivery_date'),
      figure('net_amount'),
      text('currency'),
    ],
  },
  [P.supplierInvoices]: {
    rows: supplierRows,
    all: Object.keys(supplierInvoices[0]).length,
    columns: [
      mono('ap_invoice_id'),
      text('entity_id'),
      mono('supplier_id'),
      mono('supplier_invoice_number'),
      text('invoice_date'),
      text('description'),
      figure('gross_amount'),
      figure('amount_paid'),
      text('currency'),
    ],
  },
};

// Which records in a CSV a finding cites. When they aren't next to each other, the excerpt is the
// file's rows for `whole` instead (pages spec §4), and the count says so.
const dupSupplierName = readCsv('01_master_data/suppliers.csv').find(
  (r) => r.supplier_id === dupFirst.supplier_id,
)?.supplier_name;
must(dupSupplierName, `supplier ${dupFirst.supplier_id} in suppliers.csv`);
const CITED_RECORDS = {
  'revenue-cut-off': {
    file: P.salesInvoices,
    ids: [cutoff.invoice_id],
    isCited: (r) => r.invoice_id === cutoff.invoice_id,
  },
  'duplicate-payment': {
    file: P.supplierInvoices,
    ids: dup.map((d) => d.ap_invoice_id),
    isCited: (r) => dup.some((d) => d.ap_invoice_id === r.ap_invoice_id),
    whole: { label: dupSupplierName, match: (r) => r.supplier_id === dupFirst.supplier_id },
  },
  'self-approved-entry': { file: P.manualJournals, ids: [sa.je_id], isCited: (r) => r.je_id === sa.je_id },
  'credit-limit': {
    file: P.aging,
    ids: [gl.customer_id],
    isCited: (r) => r.customer_id === gl.customer_id && glOverBeforeAugust.some((m) => m.period === r.period),
    whole: { label: gl.customer_name, match: (r) => r.customer_id === gl.customer_id },
  },
};

const EXCERPT_ROWS_EITHER_SIDE = 10;
const EXCERPT_LINES_EITHER_SIDE = 5;
const EXCERPT_FIRST_ROWS = 21;
const count = (n) => n.toLocaleString('en-US');

function csvExcerpt(name) {
  const table = CSV_TABLES[name];
  must(table, `an excerpt layout for ${name}`);
  const citedBy = Object.values(CITED_RECORDS).find((c) => c.file === name);
  let rows = table.rows.slice(0, EXCERPT_FIRST_ROWS);
  let whole;
  if (citedBy) {
    const hits = table.rows.flatMap((r, i) => (citedBy.isCited(r) ? [i] : []));
    must(hits.length > 0, `${name} holds what it is cited for (${citedBy.ids.join(', ')})`);
    if (hits.at(-1) - hits[0] + 1 === hits.length) {
      rows = table.rows.slice(
        Math.max(0, hits[0] - EXCERPT_ROWS_EITHER_SIDE),
        hits.at(-1) + EXCERPT_ROWS_EITHER_SIDE + 1,
      );
    } else {
      must(citedBy.whole, `${name}'s cited rows are apart, so its excerpt needs whole rows to show`);
      rows = table.rows.filter(citedBy.whole.match);
      whole = citedBy.whole.label;
    }
  }
  const columns = table.columns.map((c) => c.key);
  return {
    type: 'table',
    count:
      `Showing ${count(rows.length)} of ${count(table.rows.length)} rows, ` +
      `${count(columns.length)} of ${count(table.all)} columns` +
      (whole ? `: every row for ${whole}` : ''),
    columns: table.columns,
    rows: rows.map((r) => Object.fromEntries(columns.map((k) => [k, r[k]]))),
    citedRows: citedBy ? rows.flatMap((r, i) => (citedBy.isCited(r) ? [i] : [])) : [],
  };
}

function fileLines(name) {
  const lines = packText(name).split('\n');
  return lines.at(-1) === '' ? lines.slice(0, -1) : lines;
}

// The cited lines plus up to five either side. Which lines a finding rests on is authored: its claim
// is a paraphrase. A line range that doesn't exist, or that no longer holds the words, stops the build.
function transcriptExcerpt(name) {
  const lines = fileLines(name);
  const ranges = closeSource.exceptions.filter((e) => e.quote.file === name).map((e) => e.quote.lines);
  if (ranges.length === 0) return textExcerpt(lines, 0, EXCERPT_FIRST_ROWS, []);
  const shown = new Set();
  const cited = new Set();
  for (const [from, to] of ranges) {
    for (
      let n = Math.max(1, from - EXCERPT_LINES_EITHER_SIDE);
      n <= Math.min(lines.length, to + EXCERPT_LINES_EITHER_SIDE);
      n++
    )
      shown.add(n);
    for (let n = from; n <= to; n++) cited.add(n);
  }
  return {
    type: 'text',
    count: `Showing ${count(shown.size)} of ${count(lines.length)} lines`,
    lines: [...shown]
      .sort((a, b) => a - b)
      .map((n) => ({ n, text: lines[n - 1], ...(cited.has(n) ? { cited: true } : {}) })),
  };
}

function textExcerpt(lines, from, to, cited, label = '') {
  const shown = lines.slice(from, to);
  return {
    type: 'text',
    count: `Showing ${label}${count(shown.length)} of ${count(lines.length)} lines`,
    lines: shown.map((text, i) => ({
      n: from + i + 1,
      text,
      ...(cited.includes(from + i + 1) ? { cited: true } : {}),
    })),
  };
}

// A document's named section, as close-demo.json gives it, or its first section. A section runs to the
// next heading at its level or above.
function documentExcerpt(name) {
  const lines = fileLines(name);
  const section = closeSource.sources[name]?.section;
  const level = (line) => line.match(/^(#+) /)?.[1].length ?? 0;
  if (section) {
    const start = lines.findIndex((l) => level(l) > 0 && l.replace(/^#+ /, '').startsWith(section));
    must(start >= 0, `${name} has a section named "${section}"`);
    const rest = lines.slice(start + 1).findIndex((l) => level(l) > 0 && level(l) <= level(lines[start]));
    return textExcerpt(lines, start, rest < 0 ? lines.length : start + 1 + rest, [], `the ${section} section: `);
  }
  const second = lines.slice(1).findIndex((l) => level(l) > 0);
  return textExcerpt(lines, 0, second < 0 ? lines.length : second + 1, []);
}

// A transcript says what it covers on its second line and in its file name.
function transcriptCovers(name) {
  const subject = fileLines(name)[1].split(': ').slice(1).join(': ').replace(' — ', ': ');
  must(subject, `${name} names its session on its second line`);
  return `${subject}, ${fmtDate(name.match(/\d{4}-\d{2}-\d{2}/)[0])}`;
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

const SOURCE_KIND = { transcript: 'transcript', document: 'document', image: 'image', spreadsheet: 'csv' };
const binder = binderFiles.map((file, i) => {
  const kind = SOURCE_KIND[file.kind];
  const authored = closeSource.sources[file.name]?.covers;
  const excerpt =
    kind === 'csv'
      ? csvExcerpt(file.name)
      : kind === 'transcript'
        ? transcriptExcerpt(file.name)
        : kind === 'document'
          ? documentExcerpt(file.name)
          : null;
  const covers = authored
    ? fill(authored)
    : kind === 'transcript'
      ? transcriptCovers(file.name)
      : kind === 'csv'
        ? csvCovers(file.name)
        : undefined;
  must(covers, `close-demo.json says what ${file.name} covers`);
  const records = [
    ...Object.values(CITED_RECORDS)
      .filter((c) => c.file === file.name)
      .flatMap((c) => c.ids),
    ...closeSource.exceptions.filter((e) => e.quote.file === file.name).map((e) => lineRecord(e.quote.lines)),
  ];
  return {
    id: `S-${i + 1}`,
    name: file.name,
    kind,
    covers,
    total:
      kind === 'csv'
        ? { count: CSV_TABLES[file.name].rows.length, unit: 'rows' }
        : kind === 'image'
          ? null
          : { count: fileLines(file.name).length, unit: 'lines' },
    records,
    excerpt,
  };
});

function lineRecord([from, to]) {
  return from === to ? `L${from}` : `L${from}-${to}`;
}

// How a finding cites each of its files: the exhibit, and the record or the lines in it.
function citationsOf(e, finding) {
  return finding.sources.map((name) => {
    const exhibit = exhibitOf[name];
    if (name === e.quote.file) {
      const [from, to] = e.quote.lines;
      return {
        source: name,
        exhibit,
        record: lineRecord(e.quote.lines),
        locator: from === to ? `${exhibit}, line ${from}` : `${exhibit}, lines ${from} to ${to}`,
      };
    }
    const cited = CITED_RECORDS[e.id];
    must(cited?.file === name, `${e.id} says which record in ${name} it cites`);
    return { source: name, exhibit, record: cited.ids[0], locator: `${exhibit}, ${cited.ids.join(' and ')}` };
  });
}

// A claim rests on what someone said, so the lines it cites must still say it.
const said = (e) => {
  const [file, words] = SAID[e.id];
  must(e.quote?.file === file, `${e.id} quotes ${file}`);
  const lines = fileLines(file);
  const [from, to] = e.quote.lines;
  must(from >= 1 && to >= from && to <= lines.length, `${file} has lines ${from} to ${to} (${e.id})`);
  must(
    lines
      .slice(from - 1, to)
      .join(' ')
      .includes(words),
    `${file} says "${words}" in lines ${from} to ${to}`,
  );
};

// Exceptions: one per contradiction, in the order the channel shows them, each with its evidence.
const agentKeys = closeSource.agents.map((a) => a.key);
const memberKeys = new Set([...Object.keys(closePeople), ...agentKeys]);
const mustBeMember = (key, where) =>
  must(memberKeys.has(key), `${key} (${where}) is a person or an agent in close-demo.json`);
const channelIds = closeSource.channels.map((c) => c.id);
must(
  closeSource.exceptions.length === contradictions.length &&
    contradictions.every((c) => closeSource.exceptions.some((e) => e.id === c.id)),
  'close-demo.json has one exception per contradiction',
);
const closeExceptions = closeSource.exceptions.map((e) => {
  const finding = contradictions.find((c) => c.id === e.id);
  must(agentKeys.includes(e.agent), `${e.id} is raised by an agent in close-demo.json`);
  must(channelIds.includes(e.channel), `${e.id} sits in a channel in close-demo.json`);
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
  said(e);
  const { quote: _quote, ...authored } = e;
  return fillAll({
    ...authored,
    scope: FINDING_SCOPE[e.id],
    claim: finding.claim,
    evidence: finding.evidence,
    sources: finding.sources,
    citations: citationsOf(e, finding),
  });
});

for (const c of closeSource.channels) {
  for (const m of c.members) mustBeMember(m, `#${c.name}`);
  mustBeMember(c.owner, `#${c.name}'s owner`);
  for (const g of c.gaps)
    must(
      gaps.some((x) => x.id === g),
      `gap ${g} (#${c.name}) exists`,
    );
}
for (const m of closeSource.directMessages) must(m in closePeople, `${m} (direct messages) is a person`);
must(closeSource.agentRules.setUpBy in closePeople, 'the agents are set up by a person');
for (const a of closeSource.agents) {
  must(
    contradictions.some((c) => c.id === a.finding),
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
must(Number.isInteger(closeSource.typingMs) && closeSource.typingMs > 0, 'close-demo.json gives typingMs');

await writeJson('apps/demo/data/people.json', closePeople);
await writeJson('apps/demo/data/sources.json', binder);
await writeJson('apps/demo/data/close.json', {
  scene: closeSource.scene,
  period: fillAll(closeSource.period),
  agentRules: closeSource.agentRules,
  agents: fillAll(closeSource.agents),
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

console.log(
  `kasane fixtures: ${pack.length} pack files (${(sum(pack.map((f) => f.bytes)) / 1024 / 1024).toFixed(1)} MB), ` +
    `${contradictions.length} contradictions, ${gaps.length} gaps, ${followUps.length} follow-ups; ` +
    `H1 operating profit ¥${(h1.operatingProfit.actual / 1e6).toFixed(0)}m vs budget ¥${(h1.operatingProfit.budget / 1e6).toFixed(0)}m`,
);
