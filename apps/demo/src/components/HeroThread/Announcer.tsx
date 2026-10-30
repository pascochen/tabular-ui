import { useClose } from '../../lib/close-context';
import { checks, close } from '../../lib/kasane';

const hero = close.hero;
const cutOff = checks.find((c) => c.id === hero.exception)!;

/**
 * What changed in the hero decision, said once for assistive technology (§5:
 * "New messages and status changes are announced"). One line per step, in a
 * live region App always renders, so it is heard from any view. The Tool line
 * announces its own read, so the region stays quiet while the agent reads.
 */
export function HeroAnnouncer() {
  const { state } = useClose();
  const { rounds } = state.hero;
  // A stop asks again at once, so the stopped round is the one before the
  // open question: that's the change to say.
  const asking = !rounds[rounds.length - 1].answer && rounds.length > 1;
  const round = asking ? rounds[rounds.length - 2] : rounds[rounds.length - 1];
  const copy = round.answer === 'reopen' ? hero.entry : hero.record;
  const message =
    round.stage === 'proposed'
      ? `${close.agent.name} proposes: ${copy.title}`
      : round.stage === 'rerunning'
        ? `${copy.outcome} The ${cutOff.label.toLowerCase()} check is rerunning.`
        : round.stage === 'done'
          ? round.answer === 'reopen'
            ? `${hero.rerun}. ${cutOff.meaning}: ${cutOff.afterLabel}.`
            : copy.outcome
          : round.stage === 'stopped'
            ? copy.stopped
            : '';
  return (
    <p role="status" className="sr-only">
      {message}
    </p>
  );
}
