import type { Column, Row } from '@tanstack/react-table';
import { useEffect, useLayoutEffect, type RefObject } from 'react';

const TEXT_CELL = 'td[data-text-cell]';

/**
 * Characters in each text column's longest value, across every row. For a windowed
 * table, which renders only some: its cells follow nothing, or a column would move
 * as rows scroll in. It reads the value, so a value that isn't text reserves nothing.
 */
export function longestText<TData>(rows: Row<TData>[], columns: Column<TData, unknown>[]) {
  const longest = new Map<string, number>();
  for (const column of columns) {
    const meta = column.columnDef.meta;
    if (meta?.align === 'numeric' || meta?.figure || meta?.truncate === false) continue;
    let length = 0;
    for (const row of rows) {
      const value = row.getValue(column.id);
      if (typeof value === 'string' || typeof value === 'number') length = Math.max(length, String(value).length);
    }
    longest.set(column.id, length);
  }
  return longest;
}

/**
 * What a cell has cut, if anything: the cell's own text, or a control's inside it.
 * `text-overflow` tells a cut from `sr-only`, which clips too and shows nothing.
 */
export function cutElement(cell: Element) {
  return [cell, ...cell.querySelectorAll('*')].find(
    (el) => el.scrollWidth > el.clientWidth && getComputedStyle(el).textOverflow === 'ellipsis',
  );
}

/**
 * Whether a cell gets the table's keyboard stop: it has cut something, and nothing
 * in it takes focus. A control in a cell already opens the tooltip when focused.
 */
function takesStop(cell: Element, controls: string) {
  return cell.matches(TEXT_CELL) && cutElement(cell) !== undefined && cell.querySelector(controls) === null;
}

/**
 * Keeps one cut cell in the tab order. A stop on every cut cell never ends in a
 * virtualized table, because each one tabbed to renders more. The stop stays where
 * it was while it's on screen or focused; otherwise it takes the first on screen,
 * so Tab doesn't jump the table back to a row that has scrolled away.
 */
function placeStop(scroller: Element, controls: string) {
  const cells = [...scroller.querySelectorAll(TEXT_CELL)];
  const stops = cells.filter((cell) => takesStop(cell, controls));
  const view = scroller.getBoundingClientRect();
  const onScreen = (cell: Element) => {
    const { top, bottom } = cell.getBoundingClientRect();
    return bottom > view.top && top < view.bottom;
  };
  const current = stops.find((cell) => cell.hasAttribute('tabindex'));
  const stop =
    current && (current === document.activeElement || onScreen(current)) ? current : (stops.find(onScreen) ?? stops[0]);
  for (const cell of cells) if (cell !== stop) cell.removeAttribute('tabindex');
  stop?.setAttribute('tabindex', '0');
}

/**
 * The keyboard's way to what a table has cut: one tab stop, and arrow keys between
 * cut cells. The tooltip follows focus, Escape closes it and Tab leaves the table.
 * It carries no `grid` role, because that promises a pattern this isn't. Returns
 * the handler for the `<tbody>`.
 */
function useCutTextStop(scrollRef: RefObject<HTMLElement | null>, controls: string) {
  // Every commit: a scroll, a sort or new data can each change what is cut and where.
  useLayoutEffect(() => {
    if (scrollRef.current) placeStop(scrollRef.current, controls);
  });

  // And what changes with no commit: a resize, a scroll with nothing to window, and
  // the face loading, which changes what fits without changing the table's box.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const place = () => placeStop(scroller, controls);
    const observer = new ResizeObserver(place);
    observer.observe(scroller);
    const table = scroller.querySelector('table');
    if (table) observer.observe(table);
    scroller.addEventListener('scrollend', place);
    void document.fonts?.ready.then(place);
    return () => {
      observer.disconnect();
      scroller.removeEventListener('scrollend', place);
    };
  }, [scrollRef, controls]);

  return (event: React.KeyboardEvent<HTMLTableSectionElement>) => {
    const cell = event.target as HTMLTableCellElement;
    if (!cell.matches(`${TEXT_CELL}[tabindex]`)) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const vertical = event.key === 'ArrowDown' || event.key === 'ArrowUp';
    if (!vertical && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const sibling =
      event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 'nextElementSibling' : 'previousElementSibling';

    let next: Element | null = null;
    if (vertical) {
      for (let row = cell.parentElement?.[sibling]; row && !next; row = row[sibling]) {
        const candidate = row.children[cell.cellIndex];
        if (candidate && takesStop(candidate, controls)) next = candidate;
      }
    } else {
      for (let candidate = cell[sibling]; candidate && !next; candidate = candidate[sibling]) {
        if (takesStop(candidate, controls)) next = candidate;
      }
    }
    // Nothing further is cut, or it isn't rendered yet: the key scrolls, as it would.
    if (!next) return;

    event.preventDefault();
    next.setAttribute('tabindex', '0');
    (next as HTMLElement).focus();
    cell.removeAttribute('tabindex');
  };
}

export { useCutTextStop };
