import type { Dispatch } from 'react';

import { sceneNow, useScriptedStep } from './clock';
import type { CloseAction, CloseState } from './close-state';

/** How long the agent reads the delivery note, and the check takes to rerun ("reran in 2s"). */
const READ_MS = 1500;
const RERUN_MS = 2000;

/**
 * The agent's side of the hero decision, after the visitor's answer: read the
 * delivery note, then propose; after the visitor posts a reopen, rerun the
 * cut-off check. App runs it, so a step still lands if the visitor has moved
 * to another view meanwhile.
 */
export function useHeroScript(state: CloseState, dispatch: Dispatch<CloseAction>) {
  const round = state.hero.rounds[state.hero.rounds.length - 1];
  useScriptedStep(round.stage === 'reading', READ_MS, () => dispatch({ type: 'read' }));
  useScriptedStep(round.stage === 'rerunning', RERUN_MS, () => dispatch({ type: 'rerun', at: sceneNow() }));
}
