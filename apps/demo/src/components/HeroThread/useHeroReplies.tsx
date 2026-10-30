import type { ReactElement } from 'react';

import { useClose } from '../../lib/close-context';
import { ProposalReply, QuestionReply, RerunReply } from './index';

/**
 * The hero exception's thread beyond its people's replies: each time the agent
 * asked, its proposal, and the check's rerun. Rendered after the replies in
 * the close state, in the order they happened.
 */
export function useHeroReplies(): ReactElement[] {
  const { state } = useClose();
  return state.hero.rounds.flatMap((round, i) => {
    const out = [<QuestionReply key={`q${i}`} round={round} />];
    if (round.answer && round.answer !== 'skip') out.push(<ProposalReply key={`p${i}`} round={round} />);
    if (round.answer === 'reopen' && round.postedAt) out.push(<RerunReply key={`r${i}`} round={round} />);
    return out;
  });
}
