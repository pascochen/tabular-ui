import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { IconButton } from 'tabular-ui';

/**
 * A command with a copy button (docs/site.md D9). The command wraps rather than
 * scrolls, so a phone shows all of it with nothing to scroll by keyboard. A copy
 * relabels the button "Copied" and says so once, as ContextSwitcher's does, and
 * only after the clipboard accepted it.
 *
 * The check is ticked in, left to right, and the copy icon fades back two
 * seconds later (docs/site.md §7, "Motion"). With reduced motion both swap at
 * once.
 */
export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  // The copy icon fades back in only after a copy: on load it is still (D6).
  const [returned, setReturned] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => {
      setCopied(false);
      setReturned(true);
    }, 2000);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <div className="flex items-center gap-[var(--gap-inline)] border border-border bg-surface py-1 pr-1 pl-[var(--pad-card)]">
      <code className="min-w-0 flex-1 text-sm break-all text-text-body">{command}</code>
      <IconButton
        variant="ghost"
        aria-label={copied ? 'Copied' : 'Copy command'}
        onClick={() => {
          navigator.clipboard?.writeText(command).then(
            () => setCopied(true),
            () => {},
          );
        }}
      >
        {/* One icon at a time, and a direct child, so IconButton still sets its
            weight. A key remounts it, which is what starts the animation. */}
        {copied ? (
          <CheckIcon key="check" className="motion-safe:animate-[site-tick_140ms_ease-out]" />
        ) : (
          <CopyIcon
            key={returned ? 'copy-back' : 'copy'}
            className={returned ? 'motion-safe:animate-[site-fade-in_120ms_ease-out]' : undefined}
          />
        )}
      </IconButton>
      <span role="status" className="sr-only">
        {copied ? 'Copied' : ''}
      </span>
    </div>
  );
}
