import { useCallback, useEffect, useRef, useState } from 'react';

import { WASH_HOLD_MS, WASH_IN_MS, WASH_OUT_MS, WASH_STILL_MS } from '../../../lib/gestures';
import { prefersReducedMotion } from '../../../lib/motion';
import { ANNOUNCEMENT_MS } from '../announcement';

/**
 * Copied cells take a wash (docs/explorations/motion-page-spec.md, M2). A copy
 * from a table changed nothing on screen, and it is what people do most in a
 * finance tool: figures go to a spreadsheet all day.
 *
 * On a copy, the body cells the selection touches take the press tone,
 * `--color-bg-active`, as one band: it crosses them from the left in 140ms,
 * holds 400ms and leaves to the right in 200ms. Each cell's share of the band
 * is set by its place in it (`--tui-wash-delay`, `--tui-wash-duration`), so
 * cells side by side read as one sweep, not as one wipe per cell. Under
 * reduced motion the tone shows for 600ms, still, then goes.
 *
 * The cells are marked with `data-copied` directly, not through React state:
 * a copy re-rendering every row of a large table would cost more than the
 * gesture is worth. React never writes that attribute, so it never clears it.
 *
 * It also says "Copied" once, in a polite live region: a screen reader's own
 * copy gives no confirmation. The region exists only from the copy until the
 * announcement is cleared (`null` otherwise): it mounts empty and takes its
 * word a frame later, so it is a change a screen reader reads.
 */

/** The classes every body cell carries, inert until `data-copied` is set. */
export const washCell = [
  // Positioned and isolated only during the wash, so a cell's layout is otherwise untouched.
  'data-[copied]:relative data-[copied]:isolate',
  // Under the text, over the row: the selection tint stays visible through it.
  "data-[copied]:after:pointer-events-none data-[copied]:after:absolute data-[copied]:after:inset-0 data-[copied]:after:-z-10 data-[copied]:after:bg-bg-active data-[copied]:after:content-['']",
  'data-[copied=in]:after:origin-left data-[copied=in]:after:animate-[tui-wash-in_var(--tui-wash-duration)_linear_var(--tui-wash-delay)_both]',
  'data-[copied=out]:after:origin-right data-[copied=out]:after:animate-[tui-wash-out_var(--tui-wash-duration)_linear_var(--tui-wash-delay)_both]',
].join(' ');

/** The body cells a selection touches, and only cells with something in them. */
function copiedCells(table: HTMLTableElement): HTMLTableCellElement[] {
  const selection = document.getSelection();
  if (!selection || selection.isCollapsed) return [];
  return [...table.querySelectorAll<HTMLTableCellElement>('tbody td')].filter(
    (cell) => cell.textContent?.trim() && selection.containsNode(cell, true),
  );
}

/** Spreads one band across the cells: each starts when the band reaches it and lasts while it crosses. */
function placeBand(cells: HTMLTableCellElement[], totalMs: number) {
  const boxes = cells.map((cell) => cell.getBoundingClientRect());
  const left = Math.min(...boxes.map((b) => b.left));
  const width = Math.max(...boxes.map((b) => b.right)) - left || 1;
  cells.forEach((cell, i) => {
    cell.style.setProperty('--tui-wash-delay', `${((boxes[i].left - left) / width) * totalMs}ms`);
    cell.style.setProperty('--tui-wash-duration', `${(boxes[i].width / width) * totalMs}ms`);
  });
}

function clear(cells: HTMLTableCellElement[]) {
  for (const cell of cells) {
    cell.removeAttribute('data-copied');
    cell.style.removeProperty('--tui-wash-delay');
    cell.style.removeProperty('--tui-wash-duration');
  }
}

export function useCopyWash() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const washed = useRef<HTMLTableCellElement[]>([]);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  // Its own timer: the wash's end clears the wash's timers, and must not cut the announcement short.
  const announced = useRef<ReturnType<typeof setTimeout>>(undefined);

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    clear(washed.current);
    washed.current = [];
  }, []);

  useEffect(
    () => () => {
      stop();
      clearTimeout(announced.current);
    },
    [stop],
  );

  const wash = useCallback(
    (table: HTMLTableElement) => {
      const cells = copiedCells(table);
      if (cells.length === 0) return;
      stop();
      washed.current = cells;
      const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

      // Emptied first, then said a frame later, so a second copy is a change too.
      setAnnouncement('');
      requestAnimationFrame(() => setAnnouncement('Copied'));

      if (prefersReducedMotion()) {
        cells.forEach((cell) => cell.setAttribute('data-copied', 'still'));
        later(WASH_STILL_MS, stop);
      } else {
        placeBand(cells, WASH_IN_MS);
        cells.forEach((cell) => cell.setAttribute('data-copied', 'in'));
        later(WASH_IN_MS + WASH_HOLD_MS, () => {
          placeBand(cells, WASH_OUT_MS);
          cells.forEach((cell) => cell.setAttribute('data-copied', 'out'));
        });
        later(WASH_IN_MS + WASH_HOLD_MS + WASH_OUT_MS, stop);
      }
      clearTimeout(announced.current);
      announced.current = setTimeout(() => setAnnouncement(null), ANNOUNCEMENT_MS);
    },
    [stop],
  );

  return { wash, announcement };
}
