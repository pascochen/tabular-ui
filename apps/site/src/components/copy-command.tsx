import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { IconButton } from 'tabular-ui';

/**
 * A command with a copy button (docs/site.md D9). The command wraps rather than
 * scrolls, so a phone shows all of it with nothing to scroll by keyboard. A copy
 * relabels the button "Copied" and says so once, as ContextSwitcher's does, and
 * only after the clipboard accepted it.
 */
export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
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
        {copied ? <CheckIcon /> : <CopyIcon />}
      </IconButton>
      <span role="status" className="sr-only">
        {copied ? 'Copied' : ''}
      </span>
    </div>
  );
}
