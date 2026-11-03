import {
  AgentBlock,
  AppShellPanelBody,
  CountBadge,
  DataTable,
  InlineCitation,
  Sources,
  buttonVariants,
  cn,
  type DataTableProps,
  type Source,
} from 'tabular-ui';

import { ExceptionStatus } from '../components/ExceptionStatus';
import { useClose } from '../lib/close-context';
import { awaitsVisitor, openCount } from '../lib/close-state';
import {
  close,
  exceptions,
  exhibitOf,
  findings,
  memberName,
  selectedTask,
  sourcesOf,
  type ChannelId,
  type Exception,
} from '../lib/kasane';
import { linkClassName } from '../lib/link';
import { usePanelSheet } from '../lib/panel-sheet';
import { hrefFor, navigate, onViewLinkClick, useView, type View } from '../lib/view';

type Item = { id: string; text: string; sources: string[] };

const taskView = (e: Exception): View => ({ kind: 'tasks', task: e.id });
const channelOfGap = (id: string) => close.channels.find((c) => c.gaps.includes(id));

function useSelectedTask(): Exception {
  const view = useView();
  return selectedTask(view.kind === 'tasks' ? view.task : undefined);
}

/**
 * A wrapped cell has no padding of its own, so its content carries --pad-cell-y,
 * less the row's 1px rule (as the proposed entry's table does in `HeroThread`).
 */
const wrappedCell = 'block py-[calc(var(--pad-cell-y)-1px)]';

/**
 * One finding's row: its title, summary, and who raised it, where and about what.
 * One cell, not five columns: at the 1280 floor with the panel open, main holds
 * 552px, and five columns left the summary 137px and pushed the status past the
 * edge. The title is the row's link, so the keyboard has a way in.
 */
function TaskCell({ task }: { task: Exception }) {
  const openPanel = usePanelSheet();
  const view = taskView(task);
  const selected = useSelectedTask().id === task.id;
  return (
    <div className={cn(wrappedCell, 'flex flex-col gap-[var(--gap-bonded)]')}>
      <a
        href={hrefFor(view)}
        aria-current={selected ? 'true' : undefined}
        onClick={(event) => {
          onViewLinkClick(view)(event);
          if (event.defaultPrevented) openPanel();
        }}
        className={cn(linkClassName, 'w-fit text-base font-medium')}
      >
        {task.title}
      </a>
      <span className="text-sm text-text-body">{task.summary}</span>
      <span className="text-xs text-text-secondary">
        {/* An actor label: the one hue on the row besides its status, and it says who wrote this (§5). */}
        <span className="text-text-agent">{memberName(task.agent)}</span>, #{task.channel}, {task.scope}
      </span>
    </div>
  );
}

function TaskStatus({ task }: { task: Exception }) {
  const { state } = useClose();
  return <ExceptionStatus status={state.exceptions[task.id].status} awaitsYou={awaitsVisitor(state, task.id)} />;
}

const taskColumns: DataTableProps<Exception>['columns'] = [
  { id: 'task', header: 'Task', meta: { truncate: false }, cell: ({ row }) => <TaskCell task={row.original} /> },
  { id: 'status', header: 'Status', size: 144, cell: ({ row }) => <TaskStatus task={row.original} /> },
];

function Exhibits({ sources }: { sources: string[] }) {
  // Mono runs one step below adjacent sans (§8.3).
  return <span className="font-mono text-xs">{sources.map(exhibitOf).join(', ')}</span>;
}

const itemColumns = (label: string, withChannel: boolean): DataTableProps<Item>['columns'] => [
  // The sentence is the whole item, so it wraps rather than truncates.
  {
    accessorKey: 'text',
    header: label,
    meta: { truncate: false },
    cell: ({ getValue }) => <span className={wrappedCell}>{getValue<string>()}</span>,
  },
  ...(withChannel
    ? ([
        {
          id: 'channel',
          header: 'Channel',
          size: 112,
          cell: ({ row }) => {
            const channel = channelOfGap(row.original.id);
            if (!channel) return null;
            const view: View = { kind: 'channel', channel: channel.id as ChannelId };
            return (
              <a href={hrefFor(view)} onClick={onViewLinkClick(view)} className={linkClassName}>
                #{channel.name}
              </a>
            );
          },
        },
      ] satisfies DataTableProps<Item>['columns'])
    : []),
  {
    id: 'sources',
    header: 'Sources',
    size: 96,
    cell: ({ row }) => <Exhibits sources={row.original.sources} />,
  },
];

const gapColumns = itemColumns('Gap', true);
const questionColumns = itemColumns('Question', false);
const channelGapColumns = itemColumns('Gap', false);

/** Gaps as rows: the sentence and its exhibits. In a channel, whose name would only repeat the page's. */
export function ChannelGaps({ gaps }: { gaps: Item[] }) {
  return <DataTable columns={channelGapColumns} data={gaps} />;
}

function Heading({ children }: { children: string }) {
  return <h2 className="text-md font-semibold text-text-primary">{children}</h2>;
}

/**
 * Tasks: the inbox. Every finding, with the way to the channel that holds it,
 * then the gaps and the questions. One list under three headings, with every row
 * showing: the headings do what filter chips would. It stores nothing, so a
 * decision made in #revenue shows here.
 */
export function TasksView() {
  const { state } = useClose();
  const openPanel = usePanelSheet();
  const selected = useSelectedTask().id;
  const open = openCount(state);

  return (
    <div className="flex flex-col gap-[var(--gap-section)]">
      <div className="flex flex-wrap gap-[var(--gap-inline)]">
        <CountBadge label="Open" count={open} />
        <CountBadge label="Gaps" count={findings.gaps.length} />
        <CountBadge label="Questions" count={findings.followUps.length} />
      </div>
      <section className="flex flex-col gap-[var(--gap-field)]">
        {/* Once nothing is open the rows stay, each with its status. */}
        <Heading>{open ? 'Open' : 'Nothing open.'}</Heading>
        <DataTable
          columns={taskColumns}
          data={exceptions}
          // The selected row is §4's single-selection tint, never a new hue.
          rowClassName={(row) => (row.original.id === selected ? 'bg-bg-interactive' : undefined)}
          onRowClick={(row) => {
            navigate(taskView(row.original));
            openPanel();
          }}
        />
      </section>
      <section className="flex flex-col gap-[var(--gap-field)]">
        <Heading>Gaps</Heading>
        <DataTable columns={gapColumns} data={findings.gaps} />
      </section>
      <section className="flex flex-col gap-[var(--gap-field)]">
        <Heading>Questions</Heading>
        <DataTable columns={questionColumns} data={findings.followUps} />
      </section>
    </div>
  );
}

/** A part's name inside agent output, as `Sources` labels its lists. */
function Part({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[var(--gap-bonded)] px-[var(--pad-cell-x)]">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      {children}
    </div>
  );
}

/**
 * The selected finding, in the right panel, inside the raising agent's
 * `AgentBlock`: what a person said, what the books show, and what it rests on,
 * with the required "not checked" list. Then the way to its channel.
 */
export function TaskPanel({ task }: { task: Exception }) {
  const { state } = useClose();
  const sources: Source[] = sourcesOf(task);
  const channel: View = { kind: 'channel', channel: task.channel };
  const hash = `#${task.id}`;
  return (
    <AppShellPanelBody className="flex flex-col items-start gap-[var(--gap-group)]">
      <AgentBlock
        className="w-full"
        authorship={awaitsVisitor(state, task.id) ? close.hero.authorship.asked : memberName(task.agent)}
      >
        <div className="flex flex-col gap-[var(--gap-group)]">
          <Part label="What was said">
            <p>
              {task.claim}
              <InlineCitation number={1} source={sources[0]} locator={task.citations[0].locator} />
            </p>
          </Part>
          <Part label="What the books show">
            <p>
              {task.evidence}
              <InlineCitation number={2} source={sources[1]} locator={task.citations[1].locator} />
            </p>
          </Part>
          <Sources sources={sources} notChecked={task.notChecked} />
        </div>
      </AgentBlock>
      <a
        // Through cn: bare, the variant's border loses to the base's `border-transparent` (CLAUDE.md, failure log).
        className={cn(buttonVariants({ variant: 'outline' }))}
        href={`${hrefFor(channel)}${hash}`}
        onClick={onViewLinkClick(channel, hash)}
      >
        Open in #{task.channel}
      </a>
    </AppShellPanelBody>
  );
}
