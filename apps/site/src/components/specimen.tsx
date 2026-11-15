import { useRef } from 'react';
import { PlayIcon } from '@phosphor-icons/react';
import { Button } from 'tabular-ui';

import { componentPage, type SiteComponent } from '../content';
import { focusRing, standaloneLink } from '../lib/styles';
import { cn } from '../lib/cn';
import { useAnnouncer, usePlayback } from '../lib/playback';
import { LiveRegion } from '../playback';

/**
 * Where a specimen's plate sits (docs/site.md D3, decided (c) on 2026-10-26):
 * dark where one specimen is the subject (the hero, each component page),
 * paper in the grids (the Components cards).
 */
export type Ground = 'paper' | 'dark';

/**
 * The frame and plate every specimen sits in (wireframe `76:45`).
 *
 * A dark plate sets `data-theme="dark"`: theme.css scopes dark mode as
 * `[data-theme='dark']`, so every token recomputes inside it and the components
 * draw in the mode they were designed for. It sets its own ground and text
 * colour, because inherited text comes from the light page (D4). `data-plate`
 * names the plate on either ground, so a test can find it without assuming one.
 *
 * A component that isn't built has a dashed frame, and says so in words: dashed
 * means placeholder (§7.8), and colour or shape is never the only signal.
 *
 * The frame states its ground, as every bordered panel on the site does, so the
 * page's paper never shows inside it (D3, item 4; tests/paper.spec.ts).
 */
export function SpecimenFrame({
  ground = 'paper',
  placeholder = false,
  className,
  children,
}: {
  ground?: Ground;
  placeholder?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col border border-border-strong bg-canvas p-2',
        placeholder && 'border-dashed',
        className,
      )}
    >
      <div
        data-theme={ground === 'dark' ? 'dark' : undefined}
        data-plate={ground}
        className="flex flex-1 flex-col bg-canvas p-[var(--site-gap-tight)] text-base text-text-body"
      >
        {children}
      </div>
    </div>
  );
}

/**
 * A component's card: its specimen, name and decision (wireframe `78:191`).
 *
 * Two rows of a subgrid, so the cards in a row share one frame height and one
 * caption height (owner, 2026-11-02). The parent's `<li>` is the other half of
 * it. The frame's height is a floor, never a cap: a card that opens grows its
 * whole row. The floor, 310px, is the tallest row at 1440px (Sources apart), so
 * every moment's cards share one height there. It was 284px until the sans became
 * Instrument Sans (2026-11-07), whose wider lines wrapped three cards' copy one
 * line more. See docs/site.md, "Components".
 */
export function ComponentCard({
  component,
  ground,
  children,
}: {
  component: SiteComponent;
  ground?: Ground;
  children?: React.ReactNode;
}) {
  return (
    <article className="row-span-2 grid grid-cols-1 grid-rows-subgrid gap-[var(--gap-group)]">
      <SpecimenFrame ground={ground} placeholder={!component.built} className="min-h-[310px]">
        {component.built ? (
          children
        ) : (
          <p className="text-text-secondary">
            <span className="font-medium">To build.</span> Not built yet.
          </p>
        )}
      </SpecimenFrame>
      <div className="flex flex-col gap-[var(--gap-control-icon)]">
        {/* An <h4>: the card sits under its moment's <h3>, in Home's Components section. */}
        <h4 className="text-site-title-sm font-semibold text-text-primary">
          {component.built ? (
            <a href={componentPage(component.name)} className={standaloneLink}>
              {component.title}
            </a>
          ) : (
            component.title
          )}
        </h4>
        <p className="text-site-small text-text-secondary">{component.decision}</p>
      </div>
    </article>
  );
}

/**
 * A component's name as a tag (wireframe `76:98`, "Carried by"). Solid when
 * built, and then a link to its page; dashed and labelled in words when not.
 */
export function ComponentTag({ component }: { component: SiteComponent }) {
  const base = 'inline-flex items-center rounded-xs border px-2 py-0.5 text-site-small';
  if (component.built) {
    return (
      <a
        href={componentPage(component.name)}
        className={cn(base, 'border-border-strong text-text-body hover:bg-bg-hover', focusRing)}
      >
        {component.title}
      </a>
    );
  }
  return (
    <span
      className={cn(
        base,
        component.built
          ? 'border-border-strong text-text-body'
          : 'border-dashed border-border-strong text-text-secondary',
      )}
    >
      {component.title}
      {component.built ? null : <span className="sr-only">, to build</span>}
    </span>
  );
}

/**
 * A component's before/after pair (docs/site.md D2, and "Component page"): two
 * states in one frame, each on a dark plate (D3), with no headings. Each state's
 * own label carries it, and one caption beneath says what changed.
 *
 * It rests on the two states. Play, beneath the frame, steps the after plate
 * from the before state to its own, and a mouse that moves into the frame does
 * the same, once each time it comes in (owner, 2026-11-15). The before plate
 * never moves. Nothing plays on its own, and with reduced motion nothing moves:
 * the player jumps to rest (src/lib/playback.ts).
 *
 * Each plate is inert unless the pair says otherwise (`inert` in
 * src/specimens.tsx), so a press can't turn the before into the after. Play is
 * outside both. A live plate is there to select from or press, so the mouse
 * plays nothing over a pair that has one. While it plays, the after plate is
 * inert and aria-busy. The before state sits invisibly in the after plate's cell
 * at all times, and the after state joins it during a run, so the frame keeps
 * its height: stacked on a phone, the after plate is as tall as the taller state.
 */
export function Pair({
  title,
  states,
  children,
  caption,
  inert = true,
}: {
  title: string;
  states: number;
  children: (index: number) => React.ReactNode;
  caption: string;
  inert?: boolean;
}) {
  const { frame, playing, play } = usePlayback({ frames: states, autoplay: false });
  const { announce, message } = useAnnouncer();
  // One run each time the mouse comes in. Armed again when it leaves.
  const armed = useRef(true);
  const plate = 'flex flex-col justify-center bg-canvas p-[var(--site-gap-tight)] text-base text-text-body';
  const cell = 'col-start-1 row-start-1 min-w-0';
  return (
    <figure className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-[var(--gap-group)]">
      <div
        className="col-span-2 grid grid-cols-1 gap-2 border border-border-strong bg-canvas p-2 md:grid-cols-2"
        // pointermove, not pointerenter: a page scrolled under a still mouse plays nothing.
        onPointerMove={(event) => {
          // A live plate is there to select from or press, so the mouse plays nothing over it.
          if (!inert || event.pointerType !== 'mouse' || !armed.current) return;
          armed.current = false;
          if (!playing) play();
        }}
        onPointerLeave={() => {
          armed.current = true;
        }}
      >
        <div data-theme="dark" inert={inert || undefined} className={plate}>
          {children(0)}
        </div>
        <div data-theme="dark" inert={inert || playing || undefined} aria-busy={playing || undefined} className={plate}>
          <div className="grid grid-cols-1 items-center">
            <div className={cell}>{children(frame)}</div>
            {/* The before state always, so a stacked plate never grows when Play starts; the
                after state while it plays. */}
            {(playing ? [0, states - 1] : [0]).map((index) => (
              <div key={index} aria-hidden="true" className={cn(cell, 'invisible')}>
                {children(index)}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div data-pair-play="" className="col-start-2 row-start-2">
        <Button
          size="sm"
          variant="outline"
          aria-label={`Play ${title}`}
          onClick={() => play(() => announce(`${title} played.`))}
        >
          <PlayIcon aria-hidden="true" />
          Play
        </Button>
        <LiveRegion message={message} />
      </div>
      <figcaption className="col-start-1 row-start-2 text-site-small text-text-secondary">{caption}</figcaption>
    </figure>
  );
}
