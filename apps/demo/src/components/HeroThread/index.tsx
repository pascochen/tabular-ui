import {
  Badge,
  ChannelMessageReply,
  Confirmation,
  DataTable,
  Question,
  RunLogRow,
  Tool,
  type DataTableProps,
} from 'tabular-ui';

import { sceneNow } from '../../lib/clock';
import { useClose } from '../../lib/close-context';
import type { HeroRound } from '../../lib/close-state';
import { agent, checks, close } from '../../lib/kasane';
import { MemberAvatar } from '../../shell/members';

const hero = close.hero;
type Line = (typeof hero.entry.lines)[number];

const agentAuthor = { name: agent.name, avatar: <MemberAvatar memberKey="agent" /> };
const dateTime = (at: string) => `${close.scene.date}T${at}`;

/** ¥42,720,000. Yen has no minor unit; the figure is whole. */
const yen = (n: number) => (n === 0 ? '' : `¥${n.toLocaleString('en-US')}`);

// Fixed widths for the code and the figures, so the account name takes the
// rest and no name truncates at the thread's width.
const columns: DataTableProps<Line>['columns'] = [
  { accessorKey: 'account', header: 'Account', size: 80, meta: { content: 'mono' } },
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'debit',
    header: 'Debit',
    size: 128,
    meta: { align: 'numeric' },
    cell: ({ getValue }) => yen(getValue<number>()),
  },
  {
    accessorKey: 'credit',
    header: 'Credit',
    size: 128,
    meta: { align: 'numeric' },
    cell: ({ getValue }) => yen(getValue<number>()),
  },
];

/** "30 Sep 2026", as the channel writes dates. Not toLocaleDateString: en-GB writes "Sept". */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const longDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

const optionLabel = (id: string) => hero.options.find((o) => o.id === id)!.label;

/** The line that takes the question's buttons' place once it's answered. */
function answeredLine(round: HeroRound) {
  if (round.answer === 'skip') return hero.skipped;
  const label = optionLabel(round.answer!);
  return round.delegated ? `Chosen by AI: ${label}. ${hero.delegate.reason}` : `Answered by you: ${label}.`;
}

export function QuestionReply({ round }: { round: HeroRound }) {
  const { dispatch } = useClose();
  return (
    <ChannelMessageReply
      author={agentAuthor}
      time={round.askedAt}
      dateTime={dateTime(round.askedAt)}
      authorship={round.answer ? hero.authorship.done : hero.authorship.asked}
    >
      <div className="flex flex-col gap-[var(--gap-field)]">
        <p className="text-text-secondary">{hero.basis}</p>
        <Question
          title={hero.question}
          options={hero.options}
          onAnswer={(a) =>
            dispatch({
              type: 'answer',
              answer:
                a.kind === 'option' ? (a.id as 'reopen' | 'keep-locked') : a.kind === 'skip' ? 'skip' : 'delegate',
              at: sceneNow(),
            })
          }
          outcome={round.answer ? answeredLine(round) : undefined}
        />
      </div>
    </ChannelMessageReply>
  );
}

export function ProposalReply({ round }: { round: HeroRound }) {
  const { dispatch } = useClose();
  const reopen = round.answer === 'reopen';
  const copy = reopen ? hero.entry : hero.record;
  const reading = round.stage === 'reading';
  const settled = round.stage === 'stopped' ? copy.stopped : round.postedAt ? copy.outcome : undefined;
  const debits = hero.entry.lines.reduce((t, l) => t + l.debit, 0);
  return (
    <ChannelMessageReply
      author={agentAuthor}
      time={round.answeredAt!}
      dateTime={dateTime(round.answeredAt!)}
      authorship={round.stage === 'proposed' ? hero.authorship.proposed : hero.authorship.done}
    >
      <div className="flex flex-col gap-[var(--gap-group)]">
        <Tool
          status={reading ? 'running' : 'done'}
          running={hero.tool.running.replace(/…$/, '')}
          done={hero.tool.done}
        />
        {reading ? null : (
          <>
            <p>{copy.reason}</p>
            {reopen ? (
              <div className="flex flex-col gap-[var(--gap-field)]">
                <DataTable columns={columns} data={hero.entry.lines} />
                <p className="text-sm text-text-secondary">
                  {hero.entry.entity}, dated {longDate(hero.entry.postingDate)}. Debits and credits both{' '}
                  <span className="tabular-nums">{yen(debits)}</span>.
                </p>
              </div>
            ) : null}
            <Confirmation
              title={copy.title}
              changes={copy.changes}
              reaches={copy.reaches}
              confirmLabel={copy.postLabel}
              stopLabel={copy.cancelLabel}
              onConfirm={() => dispatch({ type: 'post', at: sceneNow() })}
              onStop={() => dispatch({ type: 'stop', at: sceneNow() })}
              outcome={settled}
            />
          </>
        )}
      </div>
    </ChannelMessageReply>
  );
}

const cutOffCheck = checks.find((c) => c.id === hero.exception)!;

/** The deterministic check, posting as "System" (docs/agent-voice.md, rule 1). */
export function RerunReply({ round }: { round: HeroRound }) {
  const done = round.stage === 'done';
  return (
    <ChannelMessageReply
      author={{
        name: `${cutOffCheck.label} check`,
        avatar: <MemberAvatar memberKey="system" />,
        badge: <Badge>System</Badge>,
      }}
      time={round.postedAt!}
      dateTime={dateTime(round.postedAt!)}
    >
      <div className="flex flex-col gap-[var(--gap-bonded)]">
        {/* No timestamp on the row: the reply's header already gives the time. */}
        <RunLogRow status={done ? 'passed' : 'running'} name={hero.exception} duration={done ? '2s' : undefined} />
        {done ? (
          <p className="text-sm">
            {cutOffCheck.meaning}: <span className="tabular-nums">{cutOffCheck.afterLabel}</span>.
          </p>
        ) : null}
      </div>
    </ChannelMessageReply>
  );
}
