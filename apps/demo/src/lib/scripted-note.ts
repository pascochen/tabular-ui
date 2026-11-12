/**
 * Said once, under the visitor's first post, by a system that isn't an agent or
 * a person (docs/agent-voice.md, rule 1). "To your message": the people do still
 * reply, in their threads.
 */
export const SCRIPTED_NOTE = 'The people and the AI are scripted, so nobody will reply to your message.';

/**
 * New chat's notes, from System too. A typed question with no scripted answer
 * gets the nearest ones that have, so it's never a dead end.
 */
export const NO_ANSWER_NOTE = 'The agents are scripted and have no answer for that.';

/** Nothing typed is posted by an agent (`agentRules.never`): where posting happens, as a fact. */
export const POSTING_NOTE = 'Entries are posted from the task, by you.';
