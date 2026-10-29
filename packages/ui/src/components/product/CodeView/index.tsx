import { useLayoutEffect, useRef, useState } from 'react';

import { cn } from '../../../lib/utils';

export type CodeViewProps = {
  children: string;
  /** Shows a gutter. Off by default — a four-line snippet does not need one. */
  showLineNumbers?: boolean;
  /** 1-indexed lines to mark, e.g. the line an error points at. */
  highlightLines?: number[];
  /** Informational only — there is no highlighting to drive. */
  language?: string;
  /**
   * Names the scroll region for assistive technology, used only when long
   * lines overflow. Defaults to the language, e.g. "SQL code".
   */
  label?: string;
  className?: string;
};

/**
 * CodeView — product. SQL and dbt models.
 *
 * **Deliberately not syntax-highlighted.** A highlighter assigns hues to
 * keywords and strings, which is decoration rather than state, and it would
 * spend all five hues on syntax — after which a hue means nothing anywhere
 * else (§0 rule 1). Legibility comes from `--font-mono`, the size step, the
 * slashed zero and the gutter instead.
 *
 * `highlightLines` is the exception, and it is state: the line an error points
 * at takes a `--color-bg-danger` ground.
 *
 * §8.3 — mono runs one step below the adjacent sans, because it reads visually
 * larger at equal px. In a `--text-base` context that is `--text-sm`.
 */
function CodeView({ children, showLineNumbers, highlightLines, language, label, className }: CodeViewProps) {
  const lines = children.replace(/\n$/, '').split('\n');
  const marked = new Set(highlightLines ?? []);

  // WCAG 2.1.1: a region that scrolls must be reachable by keyboard, or a
  // keyboard user can never read past the right edge of a long line. Only
  // when it actually overflows: a tab stop on a snippet that fits is noise.
  // Measured, as in TruncatedText, so a resize that adds or removes overflow
  // adds or removes the stop.
  //
  // Scrollable until measured. A server-rendered or prerendered page shows
  // the HTML before React hydrates and can measure, and a long line was
  // unreachable by keyboard for that whole time (tabularui.com's Getting
  // started, 2026-10-29). A stop on a snippet that fits, until the first
  // measure removes it, is the cheaper mistake.
  const ref = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(true);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScrollable(el.scrollWidth > el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div
      ref={ref}
      data-slot="code-view"
      data-language={language}
      {...(scrollable
        ? { tabIndex: 0, role: 'region', 'aria-label': label ?? (language ? `${language.toUpperCase()} code` : 'Code') }
        : {})}
      className={cn(
        'overflow-x-auto rounded-md border border-border bg-surface',
        'py-[var(--pad-cell-y)] font-mono text-sm text-text-body',
        'outline-none focus-visible:outline-ring',
        'focus-visible:outline-solid focus-visible:outline-[length:var(--ring-width)]',
        // Inset: a CodeView often sits inside a scrolling panel, and an
        // offset ring would be clipped by it (§4).
        'focus-visible:outline-offset-[-2px]',
        className,
      )}
    >
      {/* The size is the root's scale step (§8.3, one below the adjacent
          sans). Inherit it: the base layer's 0.9em for bare <pre> would
          otherwise shrink it a second time. */}
      <pre className="w-fit min-w-full [font-size:inherit]">
        <code>
          {lines.map((line, i) => (
            <span
              key={i}
              className={cn('flex min-h-[var(--text-sm--line-height)] w-full', marked.has(i + 1) && 'bg-bg-danger')}
            >
              {showLineNumbers ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'sticky left-0 shrink-0 select-none bg-surface text-right tabular-nums',
                    'w-[3ch] pr-[var(--pad-cell-x)] pl-[var(--pad-cell-x)] text-text-tertiary',
                  )}
                >
                  {i + 1}
                </span>
              ) : null}
              <span className={cn('whitespace-pre', !showLineNumbers && 'px-[var(--pad-cell-x)]')}>
                {line === '' ? ' ' : line}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

export { CodeView };
