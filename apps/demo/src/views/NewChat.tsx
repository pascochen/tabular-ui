import { Fragment, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  ChannelMessage,
  ChannelMessageList,
  ChatComposer,
  ChatStarter,
  Sources,
  cn,
  type ChatComposerHandle,
} from 'tabular-ui';

import { ExceptionCard } from '../components/ExceptionCard';
import { useHeroReplies } from '../components/HeroThread/useHeroReplies';
import { sceneNow } from '../lib/clock';
import { useClose } from '../lib/close-context';
import { awaitsVisitor, isReopened, notCheckedWith, type CloseState } from '../lib/close-state';
import { useDecisionInView, useExceptionLink } from '../lib/decision-in-view';
import { close, exceptions, lastClosedMonth, memberName } from '../lib/kasane';
import { linkClassName } from '../lib/link';
import {
  NEW_CHAT,
  mentionsPosting,
  nearest,
  scripted,
  suggestions,
  type ScriptedAnswer,
  type ScriptedQuestion,
} from '../lib/new-chat';
import { NO_ANSWER_NOTE, POSTING_NOTE } from '../lib/scripted-note';
import { sourcesOfSlugs } from '../lib/sources';
import { hrefFor, onViewLinkClick, type View } from '../lib/view';
import { MemberAvatar } from '../shell/members';

const hero = exceptions.find((e) => e.id === close.hero.exception)!;
const others = exceptions.filter((e) => e !== hero);
const heroTask: View = { kind: 'tasks', task: hero.id };

const dateTime = (at: string) => `${close.scene.date}T${at}`;
const authorOf = (key: string) => ({ name: memberName(key), avatar: <MemberAvatar memberKey={key} /> });
const system = { name: 'System', avatar: <MemberAvatar memberKey="system" /> };

/** §8.1's micro-label, as the sidebar's group labels. Not a heading: each finding below it has its own. */
function Label({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className="text-2xs font-medium tracking-[var(--tracking-wide)] text-text-secondary uppercase">
      {children}
    </p>
  );
}

function TaskLink({ view }: { view: View }) {
  return (
    <a href={hrefFor(view)} onClick={onViewLinkClick(view)} className={cn(linkClassName, 'w-fit text-sm')}>
      Open the task
    </a>
  );
}

/**
 * What the decision's section is called. It waits on the visitor until it's
 * settled, and then it stays as the record of what they decided.
 */
function decisionLabel(state: CloseState): string {
  if (state.exceptions[hero.id].status === 'resolved') return 'Decided';
  if (state.hero.rounds.at(-1)!.stage === 'skipped') return 'Left open';
  return 'Waiting on you';
}

/** One agent's answer: what it says, the files it rests on and what it didn't check. */
function Answer({ answer, at, state }: { answer: ScriptedAnswer; at: string; state: CloseState }) {
  return (
    <ChannelMessage
      author={authorOf(answer.agent)}
      time={at}
      dateTime={dateTime(at)}
      authorship={memberName(answer.agent)}
    >
      <div className="flex flex-col gap-[var(--gap-group)]">
        <p>{answer.answer}</p>
        <Sources
          numbered={false}
          sources={sourcesOfSlugs(answer.sources)}
          notChecked={notCheckedWith(state, answer.sources, answer.notChecked)}
        />
        {answer.finding ? <TaskLink view={{ kind: 'tasks', task: answer.finding }} /> : null}
      </div>
    </ChannelMessage>
  );
}

/** Who can answer a question, as the label over it: one agent by name, several by count. */
function answeredBy(q: ScriptedQuestion): string {
  return q.answers.length === 1
    ? `${memberName(q.answers[0].agent)} can answer`
    : `${q.answers.length} agents can answer`;
}

/** Questions under the label that says who answers them, in the order given. */
function byAnswerer(found: ScriptedQuestion[]): { label: string; questions: string[] }[] {
  const groups: { label: string; questions: string[] }[] = [];
  for (const q of found) {
    const label = answeredBy(q);
    const group = groups.find((g) => g.label === label);
    if (group) group.questions.push(q.question);
    else groups.push({ label, questions: [q.question] });
  }
  return groups;
}

/**
 * New chat: where the visitor lands. It opens on the work already done, not on
 * an empty field: the decision that waits on them, then what the other agents
 * found, each with its live status. Below that, the questions the agents can
 * answer, and the field.
 *
 * Every answer is scripted. A question typed word for word gets its agents'
 * answers, one message each, since no agent speaks for another. Anything else
 * gets the nearest questions from System, and while the visitor types, the
 * questions that match appear over the field with who can answer them, so a
 * miss is rare and never a dead end.
 */
export function NewChatView() {
  const { state, dispatch } = useClose();
  const heroReplies = useHeroReplies();
  const composer = useRef<ChatComposerHandle>(null);
  const composerBar = useRef<HTMLDivElement>(null);
  useDecisionInView(composerBar);
  useExceptionLink();
  const [draft, setDraft] = useState('');
  const [heard, setHeard] = useState('');
  const decisionId = useId();
  const foundId = useId();

  const posts = state.posts.filter((p) => p.where === NEW_CHAT);
  const fill = (text: string) => composer.current?.fill(text);
  const suggested = suggestions(posts.map((p) => p.text));
  // While a draft is on its way to a question: the ones it's about. Not once it is one.
  const matching = draft.trim() && !scripted(draft) ? byAnswerer(nearest(draft, 4)) : [];

  const send = (text: string) => {
    flushSync(() => dispatch({ type: 'say', where: NEW_CHAT, text, at: sceneNow() }));
    // The post lands at the page's foot, off screen from anywhere above it.
    const scroller = composerBar.current?.closest('[data-slot="app-shell-main-body"]');
    scroller?.scrollTo({ top: scroller.scrollHeight });
    // Focus stays in the field, so what came back is said. Then emptied, or reading the page hears it twice.
    const q = scripted(text);
    setHeard(
      q
        ? q.answers.map((a) => `${memberName(a.agent)}: ${a.answer}`).join(' ')
        : mentionsPosting(text)
          ? POSTING_NOTE
          : NO_ANSWER_NOTE,
    );
    setTimeout(() => setHeard(''), 7000);
  };

  return (
    <div className="flex min-h-full flex-col gap-[var(--gap-section)]">
      <p className="text-sm text-text-secondary">
        {lastClosedMonth} close. {isReopened(state) ? close.period.reopened : close.period.locked}.
      </p>

      <div className="flex flex-col gap-[var(--gap-field)]">
        <Label id={decisionId}>{decisionLabel(state)}</Label>
        <ChannelMessageList aria-labelledby={decisionId}>
          <ExceptionCard
            awaitsYou={awaitsVisitor(state, hero.id)}
            exception={hero}
            state={state.exceptions[hero.id]}
            // The decision the visitor makes: open on arrival, so the question is there.
            defaultRepliesOpen
            extraReplies={heroReplies}
          />
        </ChannelMessageList>
      </div>

      <div className="flex flex-col gap-[var(--gap-field)]">
        <Label id={foundId}>{`Also found at ${others[0].postedAt}`}</Label>
        <ChannelMessageList aria-labelledby={foundId}>
          {others.map((e) => (
            <ExceptionCard key={e.id} exception={e} state={state.exceptions[e.id]} />
          ))}
        </ChannelMessageList>
      </div>

      {posts.length ? (
        <ChannelMessageList aria-label="Your questions and the agents’ answers">
          {posts.map((p, i) => {
            const q = scripted(p.text);
            const near = q ? [] : nearest(p.text, 2).map((x) => x.question);
            return (
              <Fragment key={i}>
                <ChannelMessage author={authorOf('visitor')} time={p.at} dateTime={dateTime(p.at)}>
                  {p.text}
                </ChannelMessage>
                {q ? (
                  q.answers.map((a) => <Answer key={a.agent} answer={a} at={p.at} state={state} />)
                ) : (
                  <ChannelMessage author={system} time={p.at} dateTime={dateTime(p.at)}>
                    {mentionsPosting(p.text) ? (
                      <div className="flex flex-col gap-[var(--gap-field)]">
                        <p>{POSTING_NOTE}</p>
                        <TaskLink view={heroTask} />
                      </div>
                    ) : (
                      <ChatStarter
                        description={NO_ANSWER_NOTE}
                        label="They can answer"
                        suggestions={near.length ? near : suggested}
                        onSelect={fill}
                      />
                    )}
                  </ChannelMessage>
                )}
              </Fragment>
            );
          })}
        </ChannelMessageList>
      ) : null}

      <ChatStarter description={close.newChat.description} suggestions={suggested} onSelect={fill} />

      <p role="status" className="sr-only">
        {heard}
      </p>
      {/*
        The field stays at the page's foot while it scrolls, as a channel's does
        (`ChannelView`): sticky to the scroller's edge, over the canvas. The
        questions a draft matches sit on it, because they belong to what's being
        typed, not to the thread.
      */}
      <div
        ref={composerBar}
        className="sticky bottom-[calc(var(--pad-page-y)*-1)] -mb-[var(--pad-page-y)] mt-auto flex flex-col gap-[var(--gap-group)] bg-canvas pt-[var(--gap-field)] pb-[var(--pad-page-y)]"
      >
        {matching.map((group) => (
          <ChatStarter key={group.label} label={group.label} suggestions={group.questions} onSelect={fill} />
        ))}
        <ChatComposer
          ref={composer}
          label="Ask the agents"
          placeholder={close.newChat.placeholder}
          value={draft}
          onValueChange={setDraft}
          onSend={send}
        />
      </div>
    </div>
  );
}
