import { useState } from 'react';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { EmptyState, Field, FilterChip, Input, TruncatedText, cn } from 'tabular-ui';

import { useClose } from '../lib/close-context';
import { close } from '../lib/kasane';
import { linkClassName } from '../lib/link';
import { SEARCH_GROUPS, search, type SearchGroup } from '../lib/search';
import { hrefFor, onViewLinkClick, replaceView, type View } from '../lib/view';

/**
 * Search: find anything in the workspace by its record ID or a name, which is
 * also the reviewer's second way to the evidence. No answer and no ranking beyond
 * the groups. The query is in the URL, so a search can be shared and Back works.
 */
export function SearchView({ q = '' }: { q?: string }) {
  const { state } = useClose();
  const [group, setGroup] = useState<SearchGroup | null>(null);
  const results = search(state, q);
  const countOf = (g: SearchGroup) => results.filter((r) => r.group === g).length;
  const setQuery = (next: string) => replaceView({ kind: 'search', q: next || undefined });
  return (
    <div className="flex flex-col gap-[var(--gap-group)]">
      <Field label="Search tasks, sources, messages and people">
        {(props) => <Input {...props} type="search" value={q} onChange={(event) => setQuery(event.target.value)} />}
      </Field>
      {q.trim() === '' ? (
        <EmptyState
          icon={MagnifyingGlassIcon}
          title="Search by record ID or name"
          description={
            <span className="flex flex-wrap justify-center gap-[var(--gap-inline)]">
              {close.searchSuggestions.map((s) => {
                const view: View = { kind: 'search', q: s };
                return (
                  <a key={s} href={hrefFor(view)} onClick={onViewLinkClick(view)} className={linkClassName}>
                    {s}
                  </a>
                );
              })}
            </span>
          }
        />
      ) : results.length === 0 ? (
        <EmptyState icon={MagnifyingGlassIcon} title={`Nothing matches ‘${q.trim()}’.`} />
      ) : (
        <>
          <div className="flex flex-wrap gap-[var(--gap-chip)]">
            {SEARCH_GROUPS.map((g) => (
              <FilterChip
                key={g}
                field={g}
                value={String(countOf(g))}
                selected={group === g}
                // Nothing to show under an empty group.
                disabled={countOf(g) === 0}
                aria-pressed={group === g}
                onClick={() => setGroup(group === g ? null : g)}
              />
            ))}
          </div>
          {SEARCH_GROUPS.filter((g) => (group === null || group === g) && countOf(g) > 0).map((g) => (
            <section key={g} className="flex flex-col gap-[var(--gap-field)]">
              <h2 className="text-md font-semibold text-text-primary">{g}</h2>
              <ul role="list" className="flex flex-col gap-[var(--gap-field)]">
                {results
                  .filter((r) => r.group === g)
                  .map((r) => (
                    <li key={r.key} className="flex min-w-0 flex-col gap-[var(--gap-bonded)]">
                      <a
                        href={`${hrefFor(r.view)}${r.hash ?? ''}`}
                        onClick={onViewLinkClick(r.view, r.hash)}
                        className={cn(linkClassName, 'w-fit max-w-full text-base')}
                      >
                        <TruncatedText>{r.title}</TruncatedText>
                      </a>
                      <span className="text-sm text-text-body">{r.detail}</span>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
