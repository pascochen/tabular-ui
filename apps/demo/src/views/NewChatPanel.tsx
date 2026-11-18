import { XIcon } from '@phosphor-icons/react';
import { AppShellPanelBody, AppShellPanelHeader, Button, IconButton, cn, useAppShell } from 'tabular-ui';

import { Section } from '../components/ClosePanel';
import { useClose } from '../lib/close-context';
import { isReopened, isSourceOn } from '../lib/close-state';
import { agents, close, documents, kasaneCompany, lastClosedMonth } from '../lib/kasane';
import { linkClassName } from '../lib/link';
import { NEW_CHAT, citedIn } from '../lib/new-chat';
import { documentView } from '../lib/sources';
import { hrefFor, onViewLinkClick, type View } from '../lib/view';
import { useNoRoomForPanel } from '../lib/viewport';
import { MemberAvatar } from '../shell/members';

/** The panel's name: its header, its region and the button that opens it. */
export const NEW_CHAT_PANEL = 'Chat details';

/**
 * Opens and closes New chat's panel, from the page header. Beside main only:
 * where the panel is a sheet, `PanelSheet` draws its own button with this name.
 * Closing the panel from inside it returns focus here (`aria-controls`).
 */
export function NewChatPanelToggle() {
  const { panelOpen, togglePanel, panelId } = useAppShell();
  if (useNoRoomForPanel()) return null;
  return (
    <Button variant="outline" aria-expanded={panelOpen} aria-controls={panelId} onClick={togglePanel}>
      {NEW_CHAT_PANEL}
    </Button>
  );
}

/** The panel's own way out. Not in the sheet, where the dialog has its close button. */
function ClosePanelButton() {
  const { setPanelOpen } = useAppShell();
  if (useNoRoomForPanel()) return null;
  return (
    <IconButton aria-label="Close panel" onClick={() => setPanelOpen(false)}>
      <XIcon />
    </IconButton>
  );
}

const answers = (n: number) => (n === 1 ? '1 answer' : `${n} answers`);

/**
 * New chat's right panel: what a question here can draw on. The period it's
 * about, the agents that answer and what each checks, the files they read, and
 * what none of them does. It's said before the first question, so the visitor
 * asks for what the agents can answer.
 *
 * A file is marked once an answer in this chat rests on it, and one turned off
 * in Sources says so. Plain rows: nothing here is a state of the close, so
 * nothing takes a hue (§0 rule 1).
 */
export function NewChatPanel() {
  const { state } = useClose();
  const cited = citedIn(state.posts.filter((p) => p.where === NEW_CHAT).map((p) => p.text));

  return (
    <>
      <AppShellPanelHeader title={NEW_CHAT_PANEL} actions={<ClosePanelButton />} />
      <AppShellPanelBody className="flex flex-col gap-[var(--gap-section)]">
        <Section title="Scope">
          <div className="flex flex-col gap-[var(--gap-bonded)] text-sm text-text-body">
            <p>{kasaneCompany.legalName}</p>
            <p className="tabular-nums">
              {lastClosedMonth} close. {isReopened(state) ? close.period.reopened : close.period.locked}.
            </p>
          </div>
        </Section>

        <Section title="Agents">
          <ul role="list" className="flex flex-col gap-[var(--gap-group)]">
            {agents.map((agent) => {
              const chat: View = { kind: 'dm', member: agent.key };
              return (
                <li key={agent.key} className="flex gap-[var(--gap-control-icon)]">
                  <MemberAvatar memberKey={agent.key} />
                  <div className="flex min-w-0 flex-col gap-[var(--gap-bonded)] text-sm">
                    <a href={hrefFor(chat)} onClick={onViewLinkClick(chat)} className={cn(linkClassName, 'w-fit')}>
                      {agent.name}
                    </a>
                    <span className="text-text-secondary">{agent.checks}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="Sources">
          <ul role="list" className="flex flex-col gap-[var(--gap-field)] text-sm text-text-body">
            {documents.map((doc) => {
              const view = documentView(doc.slug);
              const count = cited[doc.slug] ?? 0;
              return (
                <li key={doc.slug} className="flex min-w-0 flex-col gap-[var(--gap-bonded)]">
                  <a
                    href={hrefFor(view)}
                    onClick={onViewLinkClick(view)}
                    className={cn(linkClassName, 'min-w-0 break-all font-mono text-xs')}
                  >
                    {doc.file}
                  </a>
                  {isSourceOn(state, doc.slug) ? null : (
                    <span className="text-xs text-text-secondary">Not read: turned off in Sources</span>
                  )}
                  {count ? (
                    <span className="text-xs text-text-secondary tabular-nums">Used in {answers(count)} here</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="Never">
          <ul role="list" className="flex flex-col gap-[var(--gap-field)] text-sm text-text-body">
            {close.agentRules.never.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </Section>
      </AppShellPanelBody>
    </>
  );
}
