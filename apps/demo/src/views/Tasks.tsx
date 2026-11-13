import { AgentBlock, AppShellPanelBody, DataTable, Sources, buttonVariants, cn, type DataTableProps } from 'tabular-ui';

import { TaskStepStatus } from '../components/ExceptionStatus';
import { useClose } from '../lib/close-context';
import { heroProposal, notCheckedWith, settledBy, taskStep, tasksSummary, type CloseState } from '../lib/close-state';
import { checks, close, docsOf, exceptions, memberName, selectedTask, type Exception } from '../lib/kasane';
import { linkClassName } from '../lib/link';
import { sourcesOf } from '../lib/sources';
import { usePanelSheet } from '../lib/panel-sheet';
import { hrefFor, navigate, onViewLinkClick, useView, type View } from '../lib/view';

const taskView = (e: Exception): View => ({ kind: 'tasks', task: e.id });

function useSelectedTask(): Exception {
  const view = useView();
  return selectedTask(view.kind === 'tasks' ? view.task : undefined);
}

/**
 * A wrapped cell has no padding of its own, so its content carries --pad-cell-y,
 * less the row's 1px rule (as the proposed entry's table does in `HeroThread`).
 */
const wrappedCell = 'block py-[calc(var(--pad-cell-y)-1px)]';

const who = (key: string) => (key === 'visitor' ? 'you' : memberName(key));

/**
 * What happens next on a finding, or how it ended: the row's answer to "whose
 * move is it". The question itself while it waits on the visitor, since the
 * badge alone didn't say what was asked. Nothing for an open finding nobody has
 * replied to: the data names no owner, and a guessed one would state a fact.
 */
function nextStep(state: CloseState, task: Exception): string | null {
  const { hero } = close;
  switch (taskStep(state, task.id)) {
    case 'needs-answer':
      return hero.question;
    case 'agent-reading':
      return hero.tool.running;
    case 'needs-confirmation':
      return heroProposal(state).title;
    case 'rerunning':
      return `${checks.find((c) => c.id === task.id)!.label} check is rerunning.`;
    case 'skipped':
      return hero.skipped;
    case 'waiting':
      return 'waiting' in task && task.waiting ? `Waiting on: ${task.waiting.on}.` : null;
    case 'resolved': {
      const entry = settledBy(state, task.id);
      return entry ? `Resolved by ${who(entry.by)} at ${entry.at}.` : null;
    }
    case 'open': {
      const replies = state.exceptions[task.id].replies;
      const last = replies.at(-1);
      if (!last) return null;
      const from = `${who(last.author)} at ${last.at}`;
      return replies.length === 1 ? `1 reply, from ${from}.` : `${replies.length} replies, last from ${from}.`;
    }
  }
}

/**
 * One finding's row: its title, summary, what happens next, and who raised it,
 * where and about what. The last line counts what the agent didn't check: the
 * row is where the claim is made, so the caution sits with it, as plain text.
 * One cell, not five columns: at the 1280 floor with the panel open, main holds
 * 552px, and five columns left the summary 137px and pushed the status past the
 * edge. The title is the row's link, so the keyboard has a way in.
 */
function TaskCell({ task }: { task: Exception }) {
  const { state } = useClose();
  const openPanel = usePanelSheet();
  const view = taskView(task);
  const selected = useSelectedTask().id === task.id;
  const next = nextStep(state, task);
  const notChecked = notCheckedWith(state, docsOf(task), task.notChecked).length;
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
      {next ? <span className="text-sm font-medium text-text-primary tabular-nums">{next}</span> : null}
      <span className="text-xs text-text-secondary tabular-nums">
        {/* An actor label: the one hue on the row besides its status, and it says who wrote this (§5). */}
        <span className="text-text-agent">{memberName(task.agent)}</span>, #{task.channel}, {task.scope}
        {notChecked ? ` · ${notChecked} not checked` : null}
      </span>
    </div>
  );
}

function TaskStatus({ task }: { task: Exception }) {
  const { state } = useClose();
  return <TaskStepStatus step={taskStep(state, task.id)} />;
}

const taskColumns: DataTableProps<Exception>['columns'] = [
  { id: 'task', header: 'Task', meta: { truncate: false }, cell: ({ row }) => <TaskCell task={row.original} /> },
  { id: 'status', header: 'Status', size: 200, cell: ({ row }) => <TaskStatus task={row.original} /> },
];

function Heading({ children }: { children: string }) {
  return <h2 className="text-md font-semibold text-text-primary tabular-nums">{children}</h2>;
}

/**
 * Tasks: the inbox. Every finding, whose move it is, and the way to the channel
 * that holds it. It stores nothing, so a decision made in #revenue shows here.
 * The rows keep the data's order: a row that sank as it resolved would move
 * under the reader.
 */
export function TasksView() {
  const { state } = useClose();
  const openPanel = usePanelSheet();
  const selected = useSelectedTask().id;

  return (
    <div className="flex flex-col gap-[var(--gap-section)]">
      <section className="flex flex-col gap-[var(--gap-field)]">
        {/* Once nothing is open the rows stay, each with its status. */}
        <Heading>{tasksSummary(state)}</Heading>
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
 * The selected finding, in the right panel. First where it stands, which is the
 * store's fact and not the agent's. Then the raising agent's `AgentBlock`: the
 * rule it checks, what the books show, what it rests on with the required "not
 * checked" list, and the question or proposal while one waits on the visitor.
 * Then the way to its channel, which is the primary action while the visitor
 * owes an answer: the decision stays in the thread, so there is one place to
 * answer and one record.
 */
export function TaskPanel({ task }: { task: Exception }) {
  const { state } = useClose();
  const channel: View = { kind: 'channel', channel: task.channel };
  const hash = `#${task.id}`;
  const step = taskStep(state, task.id);
  const { hero } = close;
  const next = nextStep(state, task);
  const settled = step === 'resolved' ? settledBy(state, task.id) : undefined;
  const proposal = heroProposal(state);
  const yours = step === 'needs-answer' || step === 'needs-confirmation';
  return (
    <AppShellPanelBody className="flex flex-col items-start gap-[var(--gap-group)]">
      <div className="flex flex-col items-start gap-[var(--gap-bonded)]">
        <TaskStepStatus step={step} />
        {/* The question and the proposal are in the block below, in the agent's voice. */}
        {next && !yours ? <p className="text-sm text-text-body tabular-nums">{next}</p> : null}
        {/* The log's line without its title, as #close's panel captions a check. */}
        {settled ? (
          <p className="text-sm text-text-body tabular-nums">{settled.text.slice(settled.text.indexOf(': ') + 2)}</p>
        ) : null}
      </div>
      <AgentBlock
        className="w-full"
        authorship={
          step === 'needs-answer'
            ? hero.authorship.asked
            : step === 'needs-confirmation'
              ? hero.authorship.proposed
              : memberName(task.agent)
        }
      >
        <div className="flex flex-col gap-[var(--gap-group)]">
          <Part label="Rule">
            <p>{task.rule}</p>
          </Part>
          <Part label="What the books show">
            <p>{task.evidence}</p>
          </Part>
          <Sources
            numbered={false}
            sources={sourcesOf(task)}
            notChecked={notCheckedWith(state, docsOf(task), task.notChecked)}
          />
          {step === 'needs-answer' ? (
            <Part label="Question">
              <p>{hero.basis}</p>
              <p className="font-medium text-text-primary">{hero.question}</p>
              <dl className="flex flex-col gap-[var(--gap-bonded)]">
                {hero.options.map((option) => (
                  <div key={option.id}>
                    <dt className="font-medium">{option.label}</dt>
                    <dd className="text-text-secondary">{option.description}</dd>
                  </div>
                ))}
              </dl>
            </Part>
          ) : null}
          {step === 'needs-confirmation' ? (
            <Part label="Proposed">
              <p className="font-medium text-text-primary">{proposal.title}</p>
              <dl className="flex flex-col gap-[var(--gap-bonded)]">
                {(['changes', 'reaches'] as const).map((key) => (
                  <div key={key}>
                    <dt className="font-medium">{key === 'changes' ? 'Changes' : 'Reaches'}</dt>
                    <dd className="text-text-secondary">{proposal[key]}</dd>
                  </div>
                ))}
              </dl>
            </Part>
          ) : null}
        </div>
      </AgentBlock>
      <a
        className={buttonVariants({ variant: yours ? 'default' : 'outline' })}
        href={`${hrefFor(channel)}${hash}`}
        onClick={onViewLinkClick(channel, hash)}
      >
        {step === 'needs-answer' ? 'Answer' : step === 'needs-confirmation' ? 'Review' : 'Open'} in #{task.channel}
      </a>
    </AppShellPanelBody>
  );
}
