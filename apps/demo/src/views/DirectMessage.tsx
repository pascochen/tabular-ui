import { Fragment, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  AttachmentRow,
  ChannelMessage,
  ChannelMessageList,
  ChannelMessageReply,
  ChatComposer,
  CodeView,
  DataTable,
  MetricTile,
  Sources,
  StatusBadge,
  type DataTableProps,
} from 'tabular-ui';

import { ThreadLink } from '../components/ThreadLink';
import { sceneNow } from '../lib/clock';
import { useClose } from '../lib/close-context';
import { notCheckedWith } from '../lib/close-state';
import {
  close,
  conversations,
  docsOf,
  exceptions,
  memberName,
  people,
  type DmBlock,
  type DmReply,
} from '../lib/kasane';
import { SCRIPTED_NOTE } from '../lib/scripted-note';
import { sourcesOf } from '../lib/sources';
import { MemberAvatar } from '../shell/members';

const authorOf = (key: string) => ({ name: memberName(key), avatar: <MemberAvatar memberKey={key} /> });
const dateTime = (at: string) => `${close.scene.date}T${at}`;
const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('en-US')} KB`;

type BridgeRow = Extract<DmBlock, { type: 'bridge' }>['rows'][number];
type EntryRow = Extract<DmBlock, { type: 'entries' }>['rows'][number];

/** A wrapped cell has no padding of its own: --pad-cell-y less the row's 1px rule, as the hero's entry does. */
const wrapped = (text: string) => <span className="block py-[calc(var(--pad-cell-y)-1px)]">{text}</span>;

const bridgeColumns: DataTableProps<BridgeRow>['columns'] = [
  {
    accessorKey: 'label',
    header: 'H1 operating profit',
    meta: { truncate: false },
    cell: ({ getValue }) => wrapped(getValue<string>()),
  },
  { accessorKey: 'yen', header: 'Yen', size: 132, meta: { figure: { decimals: 0, unit: 'JPY' } } },
];

const entryColumns: DataTableProps<EntryRow>['columns'] = [
  { accessorKey: 'entry', header: 'Entry', size: 150, meta: { content: 'mono' } },
  {
    accessorKey: 'date',
    header: 'Entered',
    size: 96,
    // A text column, so the table doesn't set it: the two dates stack, digit over digit.
    cell: ({ getValue }) => <span className="tabular-nums">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'description',
    header: 'Description',
    meta: { truncate: false },
    cell: ({ getValue }) => wrapped(getValue<string>()),
  },
  { accessorKey: 'amount', header: 'Amount', size: 96, meta: { align: 'numeric' } },
  {
    id: 'check',
    header: 'Check',
    size: 104,
    // The second entry is the one paid again. The first was the invoice.
    cell: ({ row }) => (row.original.duplicate ? <StatusBadge status="failed">Duplicate</StatusBadge> : null),
  },
];

function Block({ block, at }: { block: DmBlock; at: string }) {
  switch (block.type) {
    case 'tiles':
      return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-[var(--gap-group)]">
          {block.tiles.map((t) => (
            <MetricTile
              key={t.label}
              size="sm"
              label={t.label}
              value={t.value}
              delta={t.delta}
              deltaValue={t.deltaValue}
              caption={t.caption}
            />
          ))}
        </div>
      );
    case 'bridge':
      return (
        <DataTable
          columns={bridgeColumns}
          data={block.rows}
          totals={{ label: block.total.label, stated: { yen: block.total.yen } }}
        />
      );
    case 'entries':
      return <DataTable columns={entryColumns} data={block.rows} />;
    case 'code':
      return (
        <CodeView language="sql" label={block.label} showLineNumbers>
          {block.code}
        </CodeView>
      );
    case 'sources':
      return <FindingSources finding={block.finding} />;
    case 'attachment':
      return (
        <AttachmentRow
          name={block.name}
          size={block.bytes === undefined ? undefined : kb(block.bytes)}
          timestamp={at}
        />
      );
    case 'thread': {
      const finding = exceptions.find((e) => e.id === block.finding)!;
      return (
        <div>
          <ThreadLink task={finding} />
        </div>
      );
    }
  }
}

/** A finding's files, each opening at what it rests on, with what wasn't checked: as its card lists them. */
function FindingSources({ finding }: { finding: string }) {
  const { state } = useClose();
  const e = exceptions.find((x) => x.id === finding)!;
  return (
    <Sources numbered={false} sources={sourcesOf(e)} notChecked={notCheckedWith(state, docsOf(e), e.notChecked)} />
  );
}

/**
 * A direct message with a teammate: what was said before the visitor landed,
 * from `close.json`'s `conversations`, then whatever the visitor writes, and
 * the composer. Nobody replies to a post: the first one gets the System note,
 * as a channel's does.
 *
 * Each message is a `ChannelMessage`, so a run from one author in one minute
 * groups, and a reply folds beneath its message. What a teammate shares rides
 * in the body: figures as `MetricTile`s, records as a `DataTable`, a rule as
 * `CodeView`, a finding's files as `Sources`, a file as an `AttachmentRow`, and the way to the thread where
 * the decision is made.
 *
 * App keys this by member, so a half-typed message stays with the person it was for.
 */
export function DirectMessageView({ memberKey }: { memberKey: string }) {
  const { state, dispatch } = useClose();
  const composerBar = useRef<HTMLDivElement>(null);
  const [heard, setHeard] = useState('');
  const messages = conversations[memberKey];
  const posts = state.posts.filter((p) => p.where === memberKey);
  const person = people[memberKey];
  const reply = (r: DmReply, i: number) => (
    <ChannelMessageReply key={i} author={authorOf(r.author)} time={r.at} dateTime={dateTime(r.at)}>
      {r.text}
    </ChannelMessageReply>
  );
  return (
    <div className="flex min-h-full flex-col gap-[var(--gap-group)]">
      <ChannelMessageList aria-label={`Messages with ${person.name}`}>
        {messages.map((m, i) => (
          <ChannelMessage
            key={i}
            author={authorOf(m.author)}
            time={m.at}
            dateTime={dateTime(m.at)}
            // A run is the same author in the same minute (ChannelMessage README).
            continued={i > 0 && messages[i - 1].author === m.author && messages[i - 1].at === m.at}
            replies={m.replies.length > 0 ? m.replies.map(reply) : undefined}
          >
            <div className="flex flex-col gap-[var(--gap-field)]">
              <p>{m.text}</p>
              {m.blocks.map((b, j) => (
                <Block key={j} block={b} at={m.at} />
              ))}
            </div>
          </ChannelMessage>
        ))}
        {posts.map((p, i) => (
          <Fragment key={`post-${i}`}>
            <ChannelMessage
              author={authorOf('visitor')}
              time={p.at}
              dateTime={dateTime(p.at)}
              // The second post follows the note: headerless, it would read as System's.
              continued={i > 1 && posts[i - 1].at === p.at}
            >
              {p.text}
            </ChannelMessage>
            {i === 0 ? (
              <ChannelMessage
                author={{ name: 'System', avatar: <MemberAvatar memberKey="system" /> }}
                time={p.at}
                dateTime={dateTime(p.at)}
              >
                {SCRIPTED_NOTE}
              </ChannelMessage>
            ) : null}
          </Fragment>
        ))}
      </ChannelMessageList>
      {/* Focus stays in the composer, so the note is said as well. Then emptied, or reading the thread hears it twice. */}
      <p role="status" className="sr-only">
        {heard}
      </p>
      {/* The composer stays at the foot while the messages scroll, as a channel's does (Channel.tsx). */}
      <div
        ref={composerBar}
        className="sticky bottom-[calc(var(--pad-page-y)*-1)] -mb-[var(--pad-page-y)] mt-auto bg-canvas pb-[var(--pad-page-y)]"
      >
        <ChatComposer
          label={`Message ${person.name}`}
          placeholder={`Message ${person.shortName}`}
          onSend={(text) => {
            flushSync(() => dispatch({ type: 'say', where: memberKey, text, at: sceneNow() }));
            const scroller = composerBar.current?.closest('[data-slot="app-shell-main-body"]');
            scroller?.scrollTo({ top: scroller.scrollHeight });
            if (posts.length === 0) {
              setHeard(SCRIPTED_NOTE);
              setTimeout(() => setHeard(''), 7000);
            }
          }}
        />
      </div>
    </div>
  );
}
