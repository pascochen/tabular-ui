import { useEffect, type ReactNode } from 'react';
import { ImageIcon } from '@phosphor-icons/react';
import { AttachmentRow, DataTable, EmptyState, Switch, cn, type DataTableProps } from 'tabular-ui';

import { useClose } from '../lib/close-context';
import { isSourceOn } from '../lib/close-state';
import { binder, type BinderSource, type TableExcerpt, type TextExcerpt } from '../lib/kasane';
import { hrefFor, onViewLinkClick, type View } from '../lib/view';

type Row = Record<string, string>;

/** "42,720,000". A file's figures as the screen writes them, the negative with a true minus (§8.6). Blank stays blank. */
function figure(value: string) {
  if (value === '') return '';
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  const text = Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
  return n < 0 ? `−${text}` : text;
}

/**
 * A cited cell. The row's tint is the state; the weight and the hidden word say it
 * without colour (§11.1), and the mark is what a citation's link scrolls to.
 */
function CitedMark({ children }: { children: ReactNode }) {
  return (
    <span data-cited="" className="scroll-mt-[var(--pad-page-y)]">
      <span className="sr-only">Cited: </span>
      {children}
    </span>
  );
}

const columnsOf = (excerpt: TableExcerpt): DataTableProps<Row>['columns'] =>
  excerpt.columns.map((c, i) => ({
    accessorKey: c.key,
    header: c.key,
    // Headers are the file's own names. Nothing truncates: a cut record can't be
    // checked, so a wide file scrolls inside its table.
    meta: { truncate: false, ...(c.numeric ? { align: 'numeric' } : {}), ...(c.mono ? { content: 'mono' } : {}) },
    cell: ({ getValue, row }) => {
      const value = c.numeric ? figure(getValue<string>()) : getValue<string>();
      const text = <span className="whitespace-nowrap">{value}</span>;
      return i === 0 && excerpt.citedRows.includes(row.index) ? <CitedMark>{text}</CitedMark> : text;
    },
  }));

// One set per source, built once, so TanStack keeps its cells mounted (DataTable README).
const tableColumns = new Map(
  binder.flatMap((s) => (s.excerpt?.type === 'table' ? [[s.id, columnsOf(s.excerpt as TableExcerpt)] as const] : [])),
);

function TextLines({ excerpt, record }: { excerpt: TextExcerpt; record?: string }) {
  const first = record?.startsWith('L') ? Number(record.slice(1).split('-')[0]) : undefined;
  return (
    <ol role="list" className="flex flex-col border border-border text-sm">
      {excerpt.lines.map((line, i) => (
        <li
          key={line.n}
          id={line.n === first ? 'cited-record' : undefined}
          className={cn(
            'flex scroll-mt-[var(--pad-page-y)] gap-[var(--gap-inline)] px-[var(--pad-cell-x)] py-[var(--gap-bonded)]',
            // Lines the excerpt skips: a rule says the file goes on between them.
            i > 0 && excerpt.lines[i - 1].n !== line.n - 1 && 'border-t border-border',
            line.cited && 'bg-bg-interactive font-medium',
          )}
        >
          {/* §8.3: line numbers are a figure beside the text, one step down. */}
          <span className="w-[3ch] shrink-0 text-right text-xs leading-[var(--text-sm--line-height)] tabular-nums text-text-secondary">
            {line.n}
          </span>
          <span className="min-w-0 whitespace-pre-wrap break-words text-text-body">
            {line.cited ? <span className="sr-only">Cited: </span> : null}
            {line.text}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Lands a citation on its record, once the fonts have stopped moving the rows. */
function useRecordInView(source: string, record?: string) {
  useEffect(() => {
    if (!record) return;
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      const target = document.getElementById('cited-record') ?? document.querySelector('[data-cited]');
      target?.scrollIntoView({ block: 'center' });
    });
    return () => {
      cancelled = true;
    };
  }, [source, record]);
}

const KINDS = [
  { label: 'Transcripts', kinds: ['transcript'] },
  { label: 'Documents', kinds: ['document', 'image'] },
  { label: 'Data', kinds: ['csv'] },
];

function SourceList({ selected }: { selected: string }) {
  return (
    <nav aria-label="Binder" className="flex flex-col gap-[var(--gap-group)]">
      {KINDS.map(({ label, kinds }) => {
        const labelId = `binder-${label.toLowerCase()}`;
        return (
          <div key={label} className="flex flex-col gap-[var(--gap-bonded)]">
            <p
              id={labelId}
              className="px-[var(--pad-cell-x)] text-2xs font-medium uppercase tracking-[var(--tracking-wide)] text-text-secondary"
            >
              {label}
            </p>
            <ul role="list" aria-labelledby={labelId} className="flex flex-col">
              {binder
                .filter((s) => kinds.includes(s.kind))
                .map((s) => {
                  const view: View = { kind: 'sources', source: s.id };
                  return (
                    <li
                      key={s.id}
                      className={cn('flex items-center hover:bg-bg-hover', s.id === selected && 'bg-bg-interactive')}
                    >
                      <span className="w-[5ch] shrink-0 pl-[var(--pad-cell-x)] font-mono text-xs box-content">
                        {s.id}
                      </span>
                      <AttachmentRow
                        className="min-w-0 flex-1 hover:bg-transparent"
                        name={s.name}
                        render={
                          <a
                            href={hrefFor(view)}
                            aria-current={s.id === selected ? 'page' : undefined}
                            onClick={onViewLinkClick(view)}
                          />
                        }
                      />
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

function OpenSource({ source, record }: { source: BinderSource; record?: string }) {
  const { state, dispatch } = useClose();
  useRecordInView(source.id, record);
  const excerpt = source.excerpt;
  const on = isSourceOn(state, source.id);
  return (
    <section aria-label={`${source.id}, ${source.name}`} className="flex min-w-0 flex-col gap-[var(--gap-group)]">
      <div className="flex flex-wrap items-start justify-between gap-[var(--gap-group)]">
        <div className="flex min-w-0 flex-col gap-[var(--gap-bonded)]">
          <h2 className="flex flex-wrap items-baseline gap-x-[var(--gap-inline)] text-md font-semibold text-text-primary">
            <span className="font-mono text-sm font-normal">{source.id}</span>
            {/* A flex gap isn't a word break, so the heading's name needs its own. */}
            <span className="sr-only">, </span>
            <span className="min-w-0 break-all">{source.name}</span>
          </h2>
          <p className="text-sm text-text-secondary tabular-nums">{source.covers}</p>
        </div>
        <label className="flex shrink-0 items-center gap-[var(--gap-inline)] text-sm text-text-body">
          <Switch checked={on} onCheckedChange={(next) => dispatch({ type: 'source', id: source.id, on: next })} />
          Agents read this
        </label>
      </div>
      {excerpt ? <p className="text-sm text-text-secondary tabular-nums">{excerpt.count}</p> : null}
      {excerpt?.type === 'table' ? (
        <DataTable
          columns={tableColumns.get(source.id)!}
          data={(excerpt as TableExcerpt).rows}
          // The highlight is state: §4's single-selection tint, never a new hue.
          rowClassName={(row) =>
            (excerpt as TableExcerpt).citedRows.includes(row.index) ? 'bg-bg-interactive font-medium' : undefined
          }
        />
      ) : excerpt?.type === 'text' ? (
        <TextLines excerpt={excerpt as TextExcerpt} record={record} />
      ) : (
        <EmptyState
          icon={ImageIcon}
          title="No excerpt"
          description="This file is an image, so there's no text to show."
        />
      )}
    </section>
  );
}

/**
 * Sources: the binder. Every file the findings rest on, so a reviewer can follow
 * a citation to the record. The list and the open source sit side by side from
 * 1024px, and the open source is keyed so a new one lands on its own record.
 */
export function SourcesView({ source, record }: { source?: string; record?: string }) {
  const open = binder.find((s) => s.id === source) ?? binder[0];
  return (
    <div className="grid grid-cols-1 items-start gap-[var(--gap-section)] lg:grid-cols-[22rem_minmax(0,1fr)]">
      <SourceList selected={open.id} />
      <OpenSource key={open.id} source={open} record={record} />
    </div>
  );
}
