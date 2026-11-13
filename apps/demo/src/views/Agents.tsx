import { agents } from '../lib/kasane';
import { linkClassName } from '../lib/link';
import { hrefFor, onViewLinkClick, type View } from '../lib/view';

/**
 * Every agent, from the sidebar's More: what each checks and how many files it
 * reads, each a link to its own view. The Accountant Workspace story ends the
 * Agents group with More, for adding an agent. The demo has no such flow, and
 * a sidebar item that opens nothing is where a visitor leaves (`lib/view.ts`),
 * so More opens this page and says so.
 */
export function AgentsView() {
  return (
    <div className="flex flex-col gap-[var(--gap-section)]">
      <p className="text-sm text-text-secondary">
        Each agent checks one rule and reads only its own files. Adding an agent isn’t part of this demo.
      </p>
      <ul role="list" className="flex flex-col border-t border-border">
        {agents.map((a) => {
          const view: View = { kind: 'dm', member: a.key };
          return (
            <li
              key={a.key}
              className="flex flex-col gap-[var(--gap-bonded)] border-b border-border px-[var(--pad-cell-x)] py-[var(--pad-cell-y)]"
            >
              <a
                href={hrefFor(view)}
                onClick={onViewLinkClick(view)}
                className={`${linkClassName} self-start text-sm font-medium`}
              >
                {a.name}
              </a>
              <span className="text-sm text-text-body">{a.checks}</span>
              <span className="text-xs text-text-secondary tabular-nums">
                Reads {a.reads.length} {a.reads.length === 1 ? 'file' : 'files'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
