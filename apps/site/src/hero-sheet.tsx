import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { MicrophoneIcon, PauseIcon, PlayIcon } from '@phosphor-icons/react';
import { AgentBlock, Button, buttonVariants } from 'tabular-ui';

import { duplicatePayment, fileNamed } from './data';
import { cn } from './lib/cn';
import { money } from './lib/format';
import { panel } from './lib/styles';
import { question } from './specimens';

/**
 * The hero (docs/site.md D6, reopened 2026-11-17; the motion spec is
 * docs/explorations/hero-sheet-motion-spec.md): the duplicate payment (D5),
 * told on a spreadsheet.
 *
 * A mic is pressed and the question is heard. The agent looks at one amount,
 * reads down to its duplicate and flags it, and its card opens, waiting. Then
 * Post entry is pressed and the card reads "posted by you". It loops, so it
 * has a Pause button (WCAG 2.2.2).
 *
 * - **The prerendered HTML is the waiting card**, and so is the hero with
 *   reduced motion, where nothing runs and there is no Pause.
 * - **Nothing moves for the first 2.5 seconds**, on load and in every cycle,
 *   so script never clears a frame someone is reading.
 * - **The DOM never changes shape.** A pass changes classes and two labels, so
 *   the frame keeps its height and a screen reader keeps its place. What a
 *   pass hides is transparent, not removed.
 * - **The mic, Post entry, Don't post and the sheet's tabs are drawn as
 *   controls and are inert** (owner, 2026-11-17): the animation presses them.
 *   The Agent block card is where a visitor decides for themself.
 * - **Every row is from kasane.json** (§5): the entity's invoices from the
 *   first entry of the duplicate to the second.
 */

/** The hero's question (D5), a word at a time: it arrives as it is heard. */
const QUESTION = question.split(' ');
/** "Question:" and the six words. */
const WORDS = QUESTION.length + 1;

type Mic = 'rest' | 'ring' | 'pressed' | 'on';
type Card = 'hidden' | 'waiting' | 'ring' | 'pressed' | 'posted' | 'leaving';

/** One frame of the loop: what shows, and for how long. */
type Shot = {
  name: string;
  ms: number;
  mic: Mic;
  /** How many of the question's words have arrived. */
  words: number;
  /** The first duplicate: its row outlined, its amount highlighted. */
  first: boolean;
  /** The row the cell cursor is on, or none. */
  cursor: number | null;
  /** The second duplicate's row, outlined. */
  second: boolean;
  /** The second duplicate's amount, flagged. */
  flag: boolean;
  card: Card;
};

/**
 * The loop, from its rest frame (motion spec, "Sequence"). Durations are the
 * prototype's, written in place: there is no motion token.
 */
function script(rows: number): Shot[] {
  const last = rows - 1;
  const found = { mic: 'rest' as Mic, words: WORDS, first: true, cursor: last, second: true, flag: true };
  const blank = { first: false, cursor: null, second: false, flag: false, card: 'hidden' as Card };
  return [
    // The agent has stopped. Nothing moves for 2.5s, on load and in every cycle.
    { name: 'waiting', ms: 2500, ...found, card: 'waiting' },
    // The person posts the entry: selected, pressed, posted.
    { name: 'post-ring', ms: 600, ...found, card: 'ring' },
    { name: 'post-pressed', ms: 150, ...found, card: 'pressed' },
    { name: 'posted', ms: 2500, ...found, card: 'posted' },
    // The card leaves with the fade it arrives with, and the pass starts again.
    { name: 'leaving', ms: 200, ...found, card: 'leaving' },
    { name: 'empty', ms: 300, mic: 'rest', words: 0, ...blank },
    // The mic is selected, then pressed.
    { name: 'mic-ring', ms: 400, mic: 'ring', words: 0, ...blank },
    { name: 'mic-pressed', ms: 150, mic: 'pressed', words: 0, ...blank },
    // The question is heard, a word at a time, while the wave runs.
    { name: 'listening', ms: 350, mic: 'on', words: 0, ...blank },
    ...Array.from({ length: WORDS }, (_, i) => ({
      name: 'listening',
      ms: i === WORDS - 1 ? 300 : 170,
      mic: 'on' as Mic,
      words: i + 1,
      ...blank,
    })),
    { name: 'heard', ms: 350, mic: 'rest', words: WORDS, ...blank },
    // The agent looks at the first amount, then reads down to its duplicate.
    { name: 'looking', ms: 650, mic: 'rest', words: WORDS, ...blank, first: true, cursor: 0 },
    ...Array.from({ length: last }, (_, i) => ({
      name: i + 1 === last ? 'found' : 'reading',
      ms: i + 1 === last ? 200 : 90,
      mic: 'rest' as Mic,
      words: WORDS,
      ...blank,
      first: true,
      cursor: i + 1,
      second: i + 1 === last,
    })),
    { name: 'flagged', ms: 350, ...found, card: 'hidden' },
  ];
}

/** The system's focus ring, drawn on the control the animation is about to press. */
const ring = 'outline-solid outline-ring outline-[length:var(--ring-width)]';

/** How the card leaves, and with it the question and the sheet's marks: 200ms, as it arrives. */
const fadeOut = 'opacity-0 motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out';

/**
 * A cell: the row's height is on the cell (docs/failure-log.md), and the text truncates in a
 * block child. Each cell draws its right and bottom edge only, in a table with separate borders:
 * collapsed, Chromium gave the line between the thead and the tbody an extra half pixel or more,
 * and it read as a thicker rule under the header (owner, 2026-11-17).
 */
const cell = 'relative h-[var(--h-row-sm)] border-r border-b border-border px-[var(--pad-cell-x)] align-middle';
/** Hidden while the sheet is narrow, as a spreadsheet hides columns. The evidence, B and E, never is. */
const wide = 'hidden @lg:table-cell';
/** Under the pointer a cell takes the neutral tint at once, and it fades over 400ms. */
const tint =
  'bg-surface-raised hover:bg-bg-hover motion-safe:transition-[background-color] motion-safe:duration-[400ms] motion-safe:ease-out motion-safe:hover:duration-0';

/** The sheet's own edge cells: the column letters and the row numbers. */
const axis = 'text-center font-normal';

/** Each bar's place in the wave's cycle, in ms: fixed, so the wave is the same every pass. */
const WAVE = [120, 380, 40, 460, 220, 520, 300, 160, 420, 80];

/**
 * Whether the loop may run: never on the server, so the prerendered HTML has no
 * Pause button, and never with reduced motion.
 */
const reducedMotion = '(prefers-reduced-motion: reduce)';
const motionAllowed = () => !window.matchMedia(reducedMotion).matches;
function watchMotion(changed: () => void) {
  const query = window.matchMedia(reducedMotion);
  query.addEventListener('change', changed);
  return () => query.removeEventListener('change', changed);
}

export function HeroSheet({ className }: { className?: string }) {
  const d = duplicatePayment;
  const rows = d.sheet;
  const shots = useMemo(() => script(rows.length), [rows.length]);

  const [index, setIndex] = useState(0);
  // The loop runs only once the page has hydrated, motion is allowed, and the hero is on screen.
  const ready = useSyncExternalStore(watchMotion, motionAllowed, () => false);
  const [seen, setSeen] = useState(false);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let onScreen = false;
    const visible = () => setSeen(document.visibilityState === 'visible' && onScreen);
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        visible();
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    document.addEventListener('visibilitychange', visible);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', visible);
    };
  }, []);

  const running = ready && seen && !paused;
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % shots.length), shots[index].ms);
    return () => clearTimeout(timer);
  }, [running, index, shots]);

  const shot = shots[index];
  const posted = shot.card === 'posted' || shot.card === 'leaving';
  const cardShown = shot.card !== 'hidden' && shot.card !== 'leaving';
  // The question and the sheet's marks leave with the card, on its fade (owner, 2026-11-17): the
  // frame after is the empty one, and by then nothing is left to cut.
  const leaving = shot.card === 'leaving';
  const [invoices, payments] = d.sources.map(fileNamed);

  return (
    <div ref={ref} className={cn(panel, 'p-2', className)}>
      <div
        data-plate="paper"
        data-hero={shot.name}
        className="@container flex flex-col border border-border bg-canvas text-base text-text-body"
      >
        {/* The question bar: the question as it was heard, the sound wave, the mic. */}
        <div className="flex items-center border-b border-border bg-surface-raised pl-[var(--pad-card)]">
          <p data-question="" className={cn('min-w-0 flex-1 truncate text-text-secondary', leaving && fadeOut)}>
            <span className={cn('font-medium text-text-body', shot.words < 1 && 'opacity-0')}>Question:</span>
            {QUESTION.map((word, i) => (
              <span key={word} className={cn(shot.words < i + 2 && 'opacity-0')}>
                {' '}
                {word}
              </span>
            ))}
          </p>
          <span
            aria-hidden="true"
            data-wave=""
            className={cn('items-center gap-0.5 px-[var(--gap-inline)]', shot.mic === 'on' ? 'flex' : 'hidden')}
          >
            {WAVE.map((delay, i) => (
              <span
                key={delay}
                style={{ animationDelay: `-${delay}ms` }}
                className={cn(
                  'h-4 w-0.5 scale-y-[0.2] bg-text-primary motion-safe:animate-[site-wave_560ms_ease-in-out_infinite_alternate]',
                  paused && '[animation-play-state:paused]',
                  i > 5 && 'hidden @lg:block',
                )}
              />
            ))}
          </span>
          <span
            aria-hidden="true"
            data-mic={shot.mic}
            className={cn(
              'grid size-[var(--h-control)] shrink-0 place-items-center border-l border-border text-text-primary',
              // Against the frame's edge, so the ring is drawn inside (docs/failure-log.md).
              shot.mic === 'ring' && cn(ring, 'outline-offset-[calc(var(--ring-width)*-1)]'),
              shot.mic === 'pressed' && 'bg-bg-active',
              shot.mic === 'on' && 'bg-fill-interactive text-on-interactive',
            )}
          >
            <MicrophoneIcon weight="bold" className="size-[var(--size-icon-md)]" />
          </span>
        </div>

        {/* The sheet. Its letters and row numbers are a spreadsheet's dress, and say nothing a
            screen reader needs. */}
        <div className="[--sheet-axis:28px] @lg:[--sheet-axis:32px]">
          <table className="w-full table-fixed border-separate border-spacing-0 text-sm tabular-nums">
            <caption className="sr-only">{invoices}</caption>
            <thead>
              <tr aria-hidden="true" className="text-xs text-text-secondary">
                <td className={cn(cell, axis, 'w-[var(--sheet-axis)]')} />
                <td className={cn(cell, axis, wide, '@lg:w-[27%]')}>A</td>
                <td className={cn(cell, axis, 'w-24 @lg:w-[17%]')}>B</td>
                <td className={cn(cell, axis)}>C</td>
                <td className={cn(cell, axis, wide, '@lg:w-[15%]')}>D</td>
                <td className={cn(cell, axis, 'w-24 border-r-0 @lg:w-[16%]')}>E</td>
              </tr>
              <tr>
                <td aria-hidden="true" className={cn(cell, axis, 'text-xs text-text-secondary')}>
                  1
                </td>
                {(['Entry', 'Invoice', 'Supplier', 'Date', 'Amount'] as const).map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className={cn(
                      cell,
                      'bg-surface-raised text-left font-semibold text-text-primary',
                      (label === 'Entry' || label === 'Date') && wide,
                      label === 'Amount' && 'border-r-0 text-right',
                    )}
                  >
                    <span className="block truncate">{label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const lastRow = i === rows.length - 1;
                const outlined = (i === 0 && shot.first) || (lastRow && shot.second);
                const edge = lastRow && 'border-b-0';
                return (
                  <tr key={row.entry}>
                    <td aria-hidden="true" className={cn(cell, axis, edge, 'text-xs text-text-secondary')}>
                      {i + 2}
                      {i === 0 || lastRow ? (
                        // The dashed outline around a row the agent is reading (design-system.md §7.8).
                        // It hangs from the row's number, the one cell every width shows, and is
                        // drawn left to right. It is drawn by its clip, and leaves by fading.
                        <span
                          data-outline={outlined ? 'on' : 'off'}
                          className={cn(
                            // Placed from the number cell's padding box, which stops short of its right and
                            // bottom edge: one border's width is added back, so the outline sits on the row.
                            'pointer-events-none absolute top-0 left-[calc(100%+var(--border-width))] z-10 h-[calc(100%+var(--border-width))] w-[calc(100cqw-var(--sheet-axis))] border border-dashed border-border-strong',
                            !outlined
                              ? '[clip-path:inset(0_100%_0_0)]'
                              : leaving
                                ? fadeOut
                                : '[clip-path:inset(0)] motion-safe:transition-[clip-path] motion-safe:duration-200 motion-safe:ease-out',
                          )}
                        />
                      ) : null}
                    </td>
                    <td className={cn(cell, tint, edge, wide)}>
                      <code className="block truncate text-xs">{row.entry}</code>
                    </td>
                    <td className={cn(cell, tint, edge)}>
                      <code className="block truncate text-xs">{row.invoice}</code>
                    </td>
                    {/* The supplier's first word (owner, 2026-11-17), so no name is cut short. */}
                    <td className={cn(cell, tint, edge)}>
                      <span className="block truncate">{row.supplier.split(' ')[0]}</span>
                    </td>
                    <td className={cn(cell, tint, edge, wide)}>
                      <code className="block truncate text-xs">{row.date}</code>
                    </td>
                    <td
                      data-cell={
                        leaving
                          ? undefined
                          : lastRow && shot.flag
                            ? 'flagged'
                            : i === 0 && shot.first
                              ? 'looked'
                              : undefined
                      }
                      data-cursor={shot.cursor === i ? '' : undefined}
                      className={cn(
                        cell,
                        edge,
                        // The weight is in the transition: the sans is a variable font, so the flagged figure's
                        // weight arrives and leaves with its colour, not on a cut after it.
                        'border-r-0 text-right tabular-nums motion-safe:transition-[color,background-color,outline-color,font-weight] motion-safe:duration-[140ms] motion-safe:ease-out',
                        // Leaving, the tints, the weight and the cursor's ring fade to the plain cell.
                        leaving
                          ? 'bg-surface-raised motion-safe:duration-200'
                          : lastRow && shot.flag
                            ? 'bg-bg-danger font-semibold text-text-danger'
                            : i === 0 && shot.first
                              ? 'bg-bg-hover'
                              : tint,
                        // The cell cursor is the sheet's focus ring, drawn inside its cell: the amounts
                        // are the last column, against the sheet's edge. It steps, and never glides.
                        shot.cursor === i &&
                          cn(ring, 'outline-offset-[calc(var(--ring-width)*-1)]', leaving && 'outline-transparent'),
                      )}
                    >
                      {money(row.amount, d.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* The agent's card. Its space is always held, so the frame never changes height. */}
        <div className="border-t border-border p-[var(--pad-card)]">
          <div
            data-card={shot.card}
            className={cn(
              'motion-safe:transition-[opacity,translate] motion-safe:duration-200 motion-safe:ease-out',
              !cardShown && '-translate-y-1 opacity-0',
            )}
          >
            <AgentBlock
              authorship={posted ? 'AI · Posted' : 'AI · Awaiting review'}
              // Always there, so the label's row keeps one height; shown once the entry is posted.
              meta={<span className={cn(!posted && 'invisible')}>posted by you</span>}
            >
              <div className="flex flex-col gap-[var(--gap-bonded)]">
                <p>
                  Yes. Invoice <code>{d.supplierInvoice}</code> was entered twice and{' '}
                  {d.paid.every(Boolean) ? 'paid twice' : 'paid once'}, {d.amountLabel} each time.
                </p>
                <p className="text-text-secondary">
                  I can reverse the second entry, <code>{d.reverse}</code>, so the supplier owes it back.
                </p>
                {/* The person's part. As every decision in the library, right-aligned with the action
                    last. The outcome takes the buttons' place, at their height. */}
                <div className="mt-2 grid grid-cols-1 items-center">
                  <div
                    aria-hidden="true"
                    className={cn(
                      'pointer-events-none col-start-1 row-start-1 flex flex-wrap justify-end gap-[var(--gap-inline)]',
                      posted && 'invisible',
                    )}
                  >
                    <span className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }))}>Don’t post</span>
                    <span
                      data-post={shot.card}
                      className={cn(
                        buttonVariants({ size: 'sm' }),
                        (shot.card === 'ring' || shot.card === 'pressed') &&
                          cn(ring, 'outline-offset-[length:var(--ring-offset)]'),
                        shot.card === 'pressed' && 'after:bg-bg-active',
                      )}
                    >
                      Post entry
                    </span>
                  </div>
                  <p className={cn('col-start-1 row-start-1 text-text-secondary', !posted && 'invisible')}>
                    Posted as <code>{d.nextJournalId}</code>.
                  </p>
                </div>
              </div>
            </AgentBlock>
          </div>
        </div>

        {/* The sheet's tabs, named for the two files the finding rests on. Labels, not controls. */}
        <div className="flex h-[var(--h-control)] items-stretch border-t border-border text-xs text-text-secondary">
          <span className="flex min-w-0 shrink-0 items-center border-r border-border bg-surface-raised px-[var(--pad-card)] font-medium text-text-primary">
            <span className="truncate">{invoices}</span>
          </span>
          <span className="flex min-w-0 items-center border-r border-border px-[var(--pad-card)]">
            <span className="truncate">{payments}</span>
          </span>
          {ready ? (
            <span className="ml-auto flex shrink-0 items-center px-1">
              <Button
                size="sm"
                variant="ghost"
                aria-label={paused ? 'Play animation' : 'Pause animation'}
                onClick={() => setPaused((p) => !p)}
              >
                {paused ? <PlayIcon aria-hidden="true" /> : <PauseIcon aria-hidden="true" />}
                {paused ? 'Play' : 'Pause'}
              </Button>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
