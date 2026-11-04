import { useRef } from 'react';
import {
  AgentBlock,
  AppShellPanelBody,
  ChannelMessage,
  ChatComposer,
  ChatStarter,
  ChatThread,
  InlineCitation,
  Sources,
  ToolGroup,
  cn,
  type ChatComposerHandle,
  type ChatTurn,
} from 'tabular-ui';

import { CitedSentence } from '../components/CitedSentence';
import { Section } from '../components/ClosePanel';
import { sceneNow } from '../lib/clock';
import { useClose } from '../lib/close-context';
import { close, exceptions, sourcesOf, sourcesOfNames, visitor, type Agent } from '../lib/kasane';
import { linkClassName } from '../lib/link';
import { SCRIPTED_NOTE } from '../lib/scripted-note';
import { hrefFor, onViewLinkClick, type View } from '../lib/view';
import { MemberAvatar } from '../shell/members';

/** A file name, set as the identifier it is (§8.3): mono, one step down. */
function FileName({ children }: { children: string }) {
  return <span className="font-mono text-xs">{children}</span>;
}

const sameQuestion = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * What an agent ran, as one `AgentBlock`: the files it read, folded, then its
 * finding in short form with a link to the task. It's what makes the agent a
 * specialist: this much, read from these files.
 */
function AgentRun({ agent }: { agent: Agent }) {
  const finding = exceptions.find((e) => e.id === agent.finding)!;
  const sources = sourcesOf(finding);
  const task: View = { kind: 'tasks', task: finding.id };
  return (
    <AgentBlock authorship={agent.name} meta={finding.postedAt}>
      <div className="flex flex-col gap-[var(--gap-field)]">
        <ToolGroup
          summary={agent.reads.length === 1 ? 'Read 1 file' : `Read ${agent.reads.length} files`}
          calls={agent.reads.map((name) => ({
            id: name,
            status: 'done',
            running: (
              <>
                Reading <FileName>{name}</FileName>
              </>
            ),
            done: (
              <>
                Read <FileName>{name}</FileName>
              </>
            ),
          }))}
        />
        <CitedSentence text={finding.summary}>
          {sources.map((s, i) => (
            <InlineCitation key={s.id} number={i + 1} source={s} locator={finding.citations[i].locator} />
          ))}
        </CitedSentence>
        <a href={hrefFor(task)} onClick={onViewLinkClick(task)} className={cn(linkClassName, 'w-fit text-sm')}>
          Open the task
        </a>
      </div>
    </AgentBlock>
  );
}

/**
 * An agent's direct-message view: its run, then its two suggested questions and
 * their scripted answers. Nothing is stored beyond what the visitor posted: a
 * post that matches a suggested question gets that answer, and anything else gets
 * the System note, because nobody replies to what the visitor types.
 *
 * Fills main's height, as `ChatThread` needs: its scroller is bounded here, and
 * main's own never scrolls.
 */
export function AgentView({ agent }: { agent: Agent }) {
  const { state, dispatch } = useClose();
  const composer = useRef<ChatComposerHandle>(null);
  const posts = state.posts.filter((p) => p.where === agent.key);
  const asked = new Set(
    posts.flatMap((p) => agent.starters.filter((q) => sameQuestion(q.question, p.text)).map((q) => q.question)),
  );
  const remaining = agent.starters.map((q) => q.question).filter((q) => !asked.has(q));
  const typedFreely = posts.some((p) => !agent.starters.some((q) => sameQuestion(q.question, p.text)));

  const turns: ChatTurn[] = posts.flatMap((p, i): ChatTurn[] => {
    const user: ChatTurn = { id: `q${i}`, role: 'user', text: p.text };
    const starter = agent.starters.find((q) => sameQuestion(q.question, p.text));
    if (!starter) return [user];
    const sources = sourcesOfNames(starter.sources);
    return [
      user,
      {
        id: `a${i}`,
        role: 'assistant',
        authorship: agent.name,
        meta: p.at,
        text: (
          <div className="flex flex-col gap-[var(--gap-group)] whitespace-normal">
            <CitedSentence text={starter.answer}>
              {sources.map((s, n) => (
                <InlineCitation key={s.id} number={n + 1} source={s} />
              ))}
            </CitedSentence>
            <Sources sources={sources} notChecked={starter.notChecked} />
          </div>
        ),
      },
    ];
  });

  const starter = (
    <ChatStarter description={agent.ask} suggestions={remaining} onSelect={(text) => composer.current?.fill(text)} />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[var(--gap-group)]">
      <AgentRun agent={agent} />
      {/* The thread's insets are the panel's, so it reaches out by them to keep main's edges. */}
      <ChatThread
        className="-mx-[var(--pad-page-x)] min-h-0 w-[calc(100%+var(--pad-page-x)*2)]"
        label={`Messages with ${agent.name}`}
        turns={turns}
        empty={starter}
      />
      {turns.length > 0 && remaining.length > 0 ? starter : null}
      {typedFreely ? (
        <ChannelMessage
          author={{ name: 'System', avatar: <MemberAvatar memberKey="system" /> }}
          time={posts.at(-1)!.at}
          dateTime={`${close.scene.date}T${posts.at(-1)!.at}`}
        >
          {SCRIPTED_NOTE}
        </ChannelMessage>
      ) : null}
      <ChatComposer
        ref={composer}
        label={`Message ${agent.name}`}
        placeholder={`Message ${agent.name}`}
        onSend={(text) => dispatch({ type: 'say', where: agent.key, text, at: sceneNow() })}
      />
    </div>
  );
}

/**
 * An agent's profile, in the right panel: what it checks, what it reads and what
 * it never does. A narrow scope, said plainly. Plain rows: nothing here is a
 * state, so nothing takes a hue (§0 rule 1).
 */
export function AgentProfile({ agent }: { agent: Agent }) {
  return (
    <AppShellPanelBody className="flex flex-col gap-[var(--gap-section)]">
      <div className="flex items-center gap-[var(--gap-control-icon)]">
        <MemberAvatar memberKey={agent.key} size="default" />
        <span className="text-sm font-semibold text-text-primary">{agent.name}</span>
      </div>
      <Section title="Checks">
        <p className="text-sm text-text-body">{agent.checks}</p>
      </Section>
      <Section title="Reads">
        <ul role="list" className="flex flex-col gap-[var(--gap-field)] text-sm text-text-body">
          {agent.reads.map((name) => (
            <li key={name}>
              <FileName>{name}</FileName>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Never">
        <ul role="list" className="flex flex-col gap-[var(--gap-field)] text-sm text-text-body">
          {close.agentRules.never.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </Section>
      <Section title="Set up by">
        <p className="text-sm text-text-body">
          You<span className="sr-only">, {visitor.name}</span>
        </p>
      </Section>
    </AppShellPanelBody>
  );
}
