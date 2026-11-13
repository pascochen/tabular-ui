import { useEffect, useId, useMemo, type ReactNode } from 'react';
import { AgentBlock, AttachmentRow, DataTable, Switch, cn, type DataTableProps } from 'tabular-ui';

import { ThreadLink } from '../components/ThreadLink';

import { useClose } from '../lib/close-context';
import { isSourceOn, notCheckedWith } from '../lib/close-state';
import {
  docsOf,
  documents,
  exceptions,
  memberName,
  refOf,
  usedBy,
  type DocumentTable,
  type DocumentText,
  type Exception,
  type Ref,
  type SourceDocument,
} from '../lib/kasane';
import { linkClassName } from '../lib/link';
import { restsOnLine, leftOutLine, readersOf, switchEffect } from '../lib/source-facts';
import { hrefFor, onViewLinkClick, type View } from '../lib/view';

type Row = string[];

const number = (n: number) => n.toLocaleString('en-US');

/** "42,720,000". A file's figures as the screen writes them, the negative with a true minus (§8.6). Blank stays blank. */
function figure(value: string) {
  if (value === '') return '';
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  const text = Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
  return n < 0 ? `−${text}` : text;
}

/** How much of the file the extract shows. Trimmed, so it says so. */
function extractCount(doc: SourceDocument) {
  if (doc.table) {
    const { rows, rowCount, columns, columnCount, rowsFor } = doc.table;
    const shown = `Showing ${number(rows.length)} of ${number(rowCount)} rows, ${number(columns.length)} of ${number(columnCount)} columns`;
    return rowsFor ? `${shown}: every row for ${rowsFor}` : shown;
  }
  const { section, lines, lineCount } = doc.text!;
  return `Showing ${section ? `the ${section} section: ` : ''}${number(lines.length)} of ${number(lineCount)} lines`;
}

/**
 * The first cell of a selected row. The row's tint is the state; the weight and the
 * hidden word say it without colour (§11.1), and the mark is what a finding's link
 * scrolls to.
 */
function SelectedMark({ children }: { children: ReactNode }) {
  return (
    <span data-selected-record="" className="scroll-mt-[var(--pad-page-y)]">
      <span className="sr-only">Selected: </span>
      {children}
    </span>
  );
}

const columnsOf = (table: DocumentTable, selected: readonly number[]): DataTableProps<Row>['columns'] =>
  table.columns.map((c, i) => ({
    id: c.name,
    accessorFn: (row) => row[i],
    header: c.name,
    // Headers are the file's own names. Nothing truncates: a cut record can't be
    // checked, so a wide file scrolls inside its table.
    meta: {
      truncate: false,
      ...(c.style === 'figure' ? { align: 'numeric' } : {}),
      ...(c.style === 'id' ? { content: 'mono' } : {}),
    },
    cell: ({ getValue, row }) => {
      const value = c.style === 'figure' ? figure(getValue<string>()) : getValue<string>();
      const text = <span className="whitespace-nowrap">{value}</span>;
      return i === 0 && selected.includes(row.index) ? <SelectedMark>{text}</SelectedMark> : text;
    },
  }));

function TextLines({ text, selected }: { text: DocumentText; selected?: readonly number[] }) {
  const isSelected = (n: number) => !!selected && n >= selected[0] && n <= selected[1];
  return (
    <ol role="list" className="flex flex-col border border-border text-sm">
      {text.lines.map((line, i) => {
        const n = text.firstLine + i;
        return (
          <li
            key={n}
            data-selected-record={selected && n === selected[0] ? '' : undefined}
            className={cn(
              'flex scroll-mt-[var(--pad-page-y)] gap-[var(--gap-inline)] px-[var(--pad-cell-x)] py-[var(--gap-bonded)]',
              isSelected(n) && 'bg-bg-interactive font-medium',
            )}
          >
            {/* §8.3: line numbers are a figure beside the text, one step down. */}
            <span className="w-[3ch] shrink-0 text-right text-xs leading-[var(--text-sm--line-height)] tabular-nums text-text-secondary">
              {n}
            </span>
            <span className="min-w-0 whitespace-pre-wrap break-words text-text-body">
              {isSelected(n) ? <span className="sr-only">Selected: </span> : null}
              {line}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Lands a finding's link on its records, once the fonts have stopped moving the rows. */
function useRecordInView(selected: boolean) {
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      // Nearest, not centre: the claim sits over the records, and centring a row
      // that already shows would push the claim off the top.
      document.querySelector('[data-selected-record]')?.scrollIntoView({ block: 'nearest' });
    });
    return () => {
      cancelled = true;
    };
  }, [selected]);
}

const GROUPS = [
  { label: 'Documents', holds: (d: SourceDocument) => !!d.text },
  { label: 'Data', holds: (d: SourceDocument) => !!d.table },
];

/**
 * The list says who reads each file and, in words, when it's off: a switch
 * shown only on the open file is a switch forgotten on the other eight. The
 * agent's name is an actor label, the one hue on the row (§5).
 */
function DocumentList({ selected }: { selected: string }) {
  const { state } = useClose();
  return (
    <nav aria-label="Sources" className="flex flex-col gap-[var(--gap-group)]">
      {GROUPS.map(({ label, holds }) => {
        const labelId = `sources-${label.toLowerCase()}`;
        return (
          <div key={label} className="flex flex-col gap-[var(--gap-bonded)]">
            <p
              id={labelId}
              className="px-[var(--pad-cell-x)] text-2xs font-medium uppercase tracking-[var(--tracking-wide)] text-text-secondary"
            >
              {label}
            </p>
            <ul role="list" aria-labelledby={labelId} className="flex flex-col">
              {documents.filter(holds).map((d) => {
                const view: View = { kind: 'sources', source: d.slug };
                return (
                  <li
                    key={d.slug}
                    className={cn('flex items-center hover:bg-bg-hover', d.slug === selected && 'bg-bg-interactive')}
                  >
                    <AttachmentRow
                      className="min-w-0 flex-1 hover:bg-transparent"
                      name={d.file}
                      render={
                        <a
                          href={hrefFor(view)}
                          aria-current={d.slug === selected ? 'page' : undefined}
                          onClick={onViewLinkClick(view)}
                        />
                      }
                    />
                    <span className="shrink-0 pr-[var(--pad-cell-x)] text-xs text-text-secondary">
                      <span className="text-text-agent">
                        {readersOf(d.slug)
                          .map((a) => a.name)
                          .join(', ')}
                      </span>
                      {isSourceOn(state, d.slug) ? null : (
                        <>
                          {' · '}
                          <span className="font-medium text-text-primary">Off</span>
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

/** The way back from a file to the findings that rest on it. Nothing to say for a file none uses. */
function UsedBy({ slug }: { slug: string }) {
  const findings = usedBy(slug);
  if (findings.length === 0) return null;
  return (
    <div className="flex flex-col gap-[var(--gap-bonded)] text-sm">
      <p className="text-xs font-medium text-text-secondary">Used by</p>
      <ul role="list" className="flex flex-col gap-[var(--gap-bonded)]">
        {findings.map((e) => {
          const task: View = { kind: 'tasks', task: e.id };
          return (
            <li key={e.id}>
              <a href={hrefFor(task)} onClick={onViewLinkClick(task)} className={linkClassName}>
                {e.title}, raised by {memberName(e.agent)}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** A part's name inside agent output, as `Sources` labels its lists. */
function Part({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[var(--gap-bonded)] px-[var(--pad-cell-x)]">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      {children}
    </div>
  );
}

/**
 * The finding a reviewer came from, over the records it rests on: a tinted row
 * says "selected", and only the claim beside it says what it is meant to prove.
 * The agent's words sit in its `AgentBlock`. Under it, the page's own facts:
 * how much the finding rests on, what the extract leaves out, and the way back to answer.
 */
function Claim({ task, doc, on }: { task: Exception; doc: SourceDocument; on: Ref }) {
  const { state } = useClose();
  const notChecked = notCheckedWith(state, docsOf(task), task.notChecked);
  const leftOut = leftOutLine(doc);
  return (
    <section aria-label={`Finding: ${task.title}`} className="flex flex-col items-start gap-[var(--gap-field)]">
      <AgentBlock className="w-full" authorship={memberName(task.agent)}>
        <div className="flex flex-col gap-[var(--gap-group)]">
          <Part label={task.title}>
            <p className="tabular-nums">{task.evidence}</p>
          </Part>
          <Part label="Rule">
            <p>{task.rule}</p>
          </Part>
          {notChecked.length ? (
            <Part label="Not checked">
              <ul role="list" className="flex flex-col gap-[var(--gap-bonded)]">
                {notChecked.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Part>
          ) : null}
        </div>
      </AgentBlock>
      <p className="text-sm text-text-body tabular-nums">
        {restsOnLine(doc, on)}
        {leftOut ? ` ${leftOut}` : null}
      </p>
      <ThreadLink task={task} />
    </section>
  );
}

function OpenDocument({ doc, item }: { doc: SourceDocument; item?: string }) {
  const { state, dispatch } = useClose();
  const ref = refOf(item, doc.slug);
  const selectedRows = ref?.rows;
  useRecordInView(!!ref);
  const on = isSourceOn(state, doc.slug);
  const task = ref ? exceptions.find((e) => e.id === item) : undefined;
  const effectId = useId();
  // Stable for one selection, so TanStack keeps its cells mounted (DataTable README).
  const columns = useMemo(() => (doc.table ? columnsOf(doc.table, selectedRows ?? []) : []), [doc.table, selectedRows]);
  return (
    <section aria-label={doc.file} className="flex min-w-0 flex-col gap-[var(--gap-group)]">
      <div className="flex flex-wrap items-start justify-between gap-[var(--gap-group)]">
        <div className="flex min-w-0 flex-col gap-[var(--gap-bonded)]">
          <h2 className="min-w-0 break-all text-md font-semibold text-text-primary">{doc.file}</h2>
          <p className="text-sm text-text-secondary tabular-nums">{doc.about}</p>
        </div>
        <div className="flex max-w-[20rem] flex-col gap-[var(--gap-bonded)]">
          <label className="flex items-center gap-[var(--gap-inline)] text-sm text-text-body">
            <Switch
              checked={on}
              aria-describedby={effectId}
              onCheckedChange={(next) => dispatch({ type: 'source', id: doc.slug, on: next })}
            />
            Agents read this
          </label>
          {/* What the switch does, before and after: its effect lands on other pages. */}
          <p id={effectId} className="text-xs text-text-secondary">
            {switchEffect(state, doc.slug)}
          </p>
        </div>
      </div>
      {task && ref ? <Claim task={task} doc={doc} on={ref} /> : <UsedBy slug={doc.slug} />}
      <p className="text-sm text-text-secondary tabular-nums">{extractCount(doc)}</p>
      {doc.table ? (
        <DataTable
          columns={columns}
          data={doc.table.rows}
          // The highlight is state: §4's single-selection tint, never a new hue.
          rowClassName={(row) => (selectedRows?.includes(row.index) ? 'bg-bg-interactive font-medium' : undefined)}
        />
      ) : (
        <TextLines text={doc.text!} selected={ref?.lines} />
      )}
    </section>
  );
}

/**
 * Sources: every file the agents read, so a reviewer can check a finding against
 * its record. The list and the open file sit side by side from 1024px. A finding's
 * link selects its records, and browsing to the same file selects nothing. Keyed,
 * so a new selection lands on its own record.
 */
export function SourcesView({ source, item }: { source?: string; item?: string }) {
  const open = documents.find((d) => d.slug === source) ?? documents[0];
  return (
    <div className="grid grid-cols-1 items-start gap-[var(--gap-section)] lg:grid-cols-[22rem_minmax(0,1fr)]">
      <DocumentList selected={open.slug} />
      <OpenDocument key={`${open.slug}:${item ?? ''}`} doc={open} item={item} />
    </div>
  );
}
