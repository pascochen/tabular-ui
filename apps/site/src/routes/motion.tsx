import { ArrowLineRightIcon, ArrowRightIcon, CheckIcon, PlayIcon } from '@phosphor-icons/react';
import { Button, DataTable, ProgressBar, Spinner } from 'tabular-ui';

import { bridgeColumns, bridgeLines } from '../bridge';
import { CopyCommand } from '../components/copy-command';
import { FoundationsHeader } from '../components/foundations';
import { Rail, Section, SectionHeader } from '../components/layout';
import { PageKey } from '../components/page-key';
import { SpecimenFrame } from '../components/specimen';
import { install } from '../component-usage';
import { pages } from '../content';
import { pageMeta } from '../lib/meta';
import { useAnnouncer, usePlayback } from '../lib/playback';
import { runWash } from '../lib/styles';
import { motions } from '../motion';
import { LiveRegion } from '../playback';
import { RunLogSpecimen } from '../specimens';
import type { Route } from './+types/motion';

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: 'Motion · Tabular UI',
    description:
      'Motion that answers a press, a run or an agent at work: feedback under 250ms, work on a 1.2s loop, the end state at once under reduced motion.',
    path: '/foundations/motion',
  });

/**
 * The three jobs (docs/explorations/motion-page-spec.md), each drawn with its
 * own mark and named by a timing the Timing section lists. The tracer is the
 * real Spinner, and it moves, as Vocabulary's working badge does: it is the
 * one mark that loops. The fourth row is the lead's last claim, reduced
 * motion, named by the media feature it answers (2026-11-24): it also brings
 * the plate level with the intro, as the other keys are.
 */
function MotionKey() {
  return (
    <PageKey
      label="What motion is for"
      rows={[
        {
          mark: <CheckIcon aria-hidden="true" weight="bold" className="size-[var(--size-icon-md)] text-text-body" />,
          meaning: 'Feedback: something happened, because you did it',
          name: '140ms ease-out',
        },
        {
          mark: (
            <ArrowRightIcon aria-hidden="true" weight="bold" className="size-[var(--size-icon-md)] text-text-body" />
          ),
          meaning: 'Continuity: where it came from, or went',
          name: '150ms ease-out',
        },
        {
          mark: <Spinner className="size-[var(--size-icon-md)] text-text-body" />,
          meaning: 'Work in progress: it loops until the work ends',
          name: '1.2s linear',
        },
        {
          mark: (
            <ArrowLineRightIcon
              aria-hidden="true"
              weight="bold"
              className="size-[var(--size-icon-md)] text-text-body"
            />
          ),
          meaning: 'Reduced motion: the end state, at once',
          name: 'prefers-reduced-motion',
        },
      ]}
    />
  );
}

/** One motion to try: its specimen on a paper plate, then its name, what it does and its timing. */
function MotionCard({
  title,
  caption,
  timing,
  id,
  children,
}: {
  title: string;
  /** Names the card by its title, for a test that needs to find it (the copy wash's table). */
  id?: string;
  caption: string;
  timing: string;
  children: React.ReactNode;
}) {
  return (
    <article aria-labelledby={id} className="flex flex-col gap-[var(--gap-group)]">
      <SpecimenFrame className="flex-1">{children}</SpecimenFrame>
      <div className="flex flex-col gap-[var(--gap-control-icon)]">
        <h3 id={id} className="text-site-title-sm font-medium text-text-primary">
          {title}
        </h3>
        <p className="max-w-[var(--site-w-prose)] text-site-small text-text-secondary">{caption}</p>
        <p className="text-xs text-text-secondary">
          <code>{timing}</code>
        </p>
      </div>
    </article>
  );
}

const grid = 'grid grid-cols-1 gap-[var(--site-gap)] md:grid-cols-2';

/**
 * Play, with its wash, driving a progress bar from empty to full. Nothing plays
 * on its own: the plate rests full, and Play steps it through. With reduced
 * motion the player jumps to the end, so neither the wash nor the fill moves.
 */
function RunDemo() {
  const { frame, rest, playing, play, run } = usePlayback({ frames: 5, autoplay: false });
  const { announce, message } = useAnnouncer();
  return (
    <div className="flex flex-1 flex-col justify-center gap-[var(--gap-group)]">
      <div aria-busy={playing || undefined}>
        <ProgressBar label="Files read" value={(frame / rest) * 100} showValue />
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          aria-label="Play the run"
          data-run={run}
          className={runWash}
          onClick={() => play(() => announce('Run played.'))}
        >
          <PlayIcon aria-hidden="true" />
          Play
        </Button>
      </div>
      <LiveRegion message={message} />
    </div>
  );
}

/** What never moves: the cut list of the spec, as rules, each with its reason. */
const still = [
  ['Figures don’t count up.', 'On the way, a counter shows amounts the books never held.'],
  [
    'Waiting doesn’t pulse.',
    'An agent that waits for you says so in its label. A pulse would hurry a decision about money.',
  ],
  ['One mark for work.', 'The square tracer, and no shimmer beside it: a second loop says nothing new.'],
  ['Text that has arrived is shown.', 'No typewriter over a reply that is already here.'],
  ['Nothing overshoots.', 'No spring and no bounce: a value that overshoots says it went past where it is.'],
  ['No hue arrives with motion.', 'Colour means state, so a glow would claim one.'],
  ['No celebration.', 'Posting an entry is bookkeeping. The label says who posted it, and that is all.'],
] as const;

export default function Motion() {
  return (
    <>
      <FoundationsHeader
        aside={<MotionKey />}
        current={pages.motion}
        title="Motion"
        lead="Motion here answers something: a press, a run, an agent at work. It is short, nothing loops but work in progress, and with reduced motion the end state arrives at once."
      />

      <Section labelledBy="feedback-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="feedback-title"
            title="Feedback"
            lead="Something happened, because you did it. Feedback lands inside 250ms, or it reads as lag. Each of these is live: press it."
          />
          <div className={grid}>
            <MotionCard
              title="Copy is ticked"
              caption="Once the clipboard has the text, the check is drawn in along its stroke. Two seconds later the copy icon fades back. The button’s name says Copied, once."
              timing="140ms ease-out; back after 2s, 120ms"
            >
              <div className="flex flex-1 flex-col justify-center">
                <CopyCommand command={install('agent-block')} />
              </div>
            </MotionCard>
            <MotionCard
              title="Play takes a wash"
              caption="The press tone wipes across the button when a run starts, holds while it plays, and leaves when it ends. Every Play and Replay on the site wears it."
              timing="In 140ms ease-out; out 200ms ease-in"
            >
              <RunDemo />
            </MotionCard>
          </div>
        </Rail>
      </Section>

      <Section labelledBy="gestures-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="gestures-title"
            title="Ticked and washed"
            lead="Two gestures, each with one meaning. A tick is drawn along its stroke: done, and checked. A wash crosses a surface in the press tone: this took. Both come from the copy command above, and both are in the library."
          />
          <div className={grid}>
            <MotionCard
              title="A run is ticked"
              caption="When work you watched running passes, its check is drawn in. A row that loads already passed is still, and a failure lands in place: nothing about it is checked."
              timing="140ms ease-out, on a change seen live"
            >
              <div className="flex flex-1 flex-col justify-center">
                <RunLogSpecimen />
              </div>
            </MotionCard>
            <MotionCard
              id="copy-wash-title"
              title="Copied cells take a wash"
              caption="Select figures and copy them. The cells you copied take the press tone as one band, so a copy that changed nothing on screen now answers. A screen reader hears Copied, once."
              timing="In 140ms, held 400ms, out 200ms"
            >
              <div className="flex flex-1 flex-col justify-center">
                <DataTable columns={bridgeColumns} data={bridgeLines} />
              </div>
            </MotionCard>
          </div>
        </Rail>
      </Section>

      <Section labelledBy="still-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="still-title"
            title="What never moves"
            lead="Each of these is common in agent interfaces, and each says something untrue here."
          />
          <ul role="list" className="flex flex-col">
            {still.map(([rule, reason]) => (
              <li
                key={rule}
                className="grid grid-cols-1 items-baseline gap-[var(--gap-inline)] border-t border-border py-2 md:grid-cols-[280px_1fr]"
              >
                <p className="font-medium text-text-body">{rule}</p>
                <p className="text-site-small text-text-secondary">{reason}</p>
              </li>
            ))}
          </ul>
        </Rail>
      </Section>

      <Section labelledBy="timing-title">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="timing-title"
            title="Timing"
            lead="There is no motion token. Each value is written where it is used, and this list is checked against those files. With reduced motion, each gives the end state, except a fade, which is not movement, and the elapsed figure, which keeps counting."
          />
          {/* A ruled list, as Density's tokens are: a table here brought a sticky head and a
              sideways scroller to a page that needs neither. */}
          <ul role="list" aria-label="Every motion" className="flex flex-col">
            {motions.map((m) => (
              <li
                key={m.name}
                className="grid grid-cols-1 items-baseline gap-x-[var(--site-gap)] gap-y-[var(--gap-control-icon)] border-t border-border py-2 md:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,5fr)]"
              >
                <div>
                  <p className="font-medium text-text-body">{m.name}</p>
                  <p className="text-xs text-text-secondary">{m.where}</p>
                </div>
                <div>
                  <p className="text-xs text-text-body">
                    <code>{m.timing}</code>
                  </p>
                  <p className="text-xs text-text-secondary">{m.purpose}</p>
                </div>
                <p className="text-site-small text-text-secondary">
                  <span className="text-text-body">Reduced motion: </span>
                  {m.reduced}
                </p>
              </li>
            ))}
          </ul>
        </Rail>
      </Section>
    </>
  );
}
