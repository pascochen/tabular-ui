import { Fragment, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ChannelMessage, ChannelMessageList, ChannelMessageReply, ChatComposer } from 'tabular-ui';

import { sceneNow } from '../lib/clock';
import { useClose } from '../lib/close-context';
import { close, conversations, memberName, people, type DmReply } from '../lib/kasane';
import { SCRIPTED_NOTE } from '../lib/scripted-note';
import { MemberAvatar } from '../shell/members';
import { MessageBlock } from './blocks';

const authorOf = (key: string) => ({ name: memberName(key), avatar: <MemberAvatar memberKey={key} /> });
const dateTime = (at: string) => `${close.scene.date}T${at}`;
/**
 * A direct message with a teammate: what was said before the visitor landed,
 * from `workspace.json`'s `conversations`, then whatever the visitor writes, and
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
                <MessageBlock key={j} block={b} at={m.at} />
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
