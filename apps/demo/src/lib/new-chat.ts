// New chat: the questions the agents have a scripted answer for, and how typed text finds them.
// Matching is by keyword, in the browser, with no model. An agent never answers a question it has
// no scripted answer for: text that matches none gets the nearest questions, from System.

import { agents, close, exceptions } from './kasane';

/** Where New chat's posts are kept in the close state (`posts[].where`). */
export const NEW_CHAT = 'new-chat';

export type ScriptedAnswer = {
  agent: string;
  /** Set when the answer is the agent's finding: its task is the way on. */
  finding?: string;
  answer: string;
  sources: string[];
  notChecked: string[];
};

export type ScriptedQuestion = { question: string; suggested: boolean; answers: ScriptedAnswer[] };

/**
 * Every question with an answer: New chat's own, which may take several agents,
 * then each agent's two, which its own chat suggests.
 */
export const questions: ScriptedQuestion[] = [
  ...close.newChat.questions,
  ...agents.flatMap((a) =>
    a.starters.map((q) => ({
      question: q.question,
      suggested: false,
      answers: [{ agent: a.key, answer: q.answer, sources: q.sources, notChecked: q.notChecked }],
    })),
  ),
];

/** How many questions the page suggests at once (`ChatStarter`: three or four). */
const SUGGESTED = 4;

/** The questions to suggest: the first four the visitor hasn't asked yet. */
export function suggestions(asked: readonly string[]): string[] {
  return questions
    .filter((q) => q.suggested && !asked.some((text) => sameQuestion(text, q.question)))
    .slice(0, SUGGESTED)
    .map((q) => q.question);
}

/** Case, a typed apostrophe for a set one, and closing punctuation don't make a different question. */
const normal = (text: string) =>
  text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[?.!\s]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

export const sameQuestion = (a: string, b: string) => normal(a) === normal(b);

/** The scripted question a post asks, word for word, or none. */
export const scripted = (text: string): ScriptedQuestion | undefined =>
  questions.find((q) => sameQuestion(q.question, text));

/**
 * Everything a question is about: its own words, its answer and its agent's
 * finding. A question several agents answer is about its own words only, or any
 * record ID at all would find it.
 */
const haystacks = new Map(
  questions.map((q) => {
    if (q.answers.length > 1) return [q, normal(q.question)];
    const [a] = q.answers;
    const agent = agents.find((x) => x.key === a.agent)!;
    const e = exceptions.find((x) => x.id === agent.finding)!;
    return [q, normal(`${q.question} ${a.answer} ${agent.name} ${e.title} ${e.summary} ${e.evidence}`)];
  }),
);

// Words too common to say what a question is about.
const STOP = new Set(
  'the and for any are was were our with that this what which who how did does not you your have has had from about more than there their into over when where why can will its it is of to in on at an we us me my do be by or as'.split(
    ' ',
  ),
);

const wordsOf = (text: string) =>
  normal(text)
    .split(/[^a-z0-9-]+/)
    .filter((w) => w.length > 1 && !STOP.has(w));

/**
 * The scripted questions nearest to some text, best first: by how many of its
 * words each is about, so a record ID or a name finds its agent's questions. A
 * word matches from its start ("great" finds Great Lakes), which is what lets
 * the same function serve a draft still being typed.
 */
export function nearest(text: string, limit: number): ScriptedQuestion[] {
  const words = wordsOf(text);
  if (words.length === 0) return [];
  return questions
    .map((q, order) => {
      const hay = haystacks.get(q)!;
      const score = words.filter((w) => new RegExp(`(^|[^a-z0-9])${w}`).test(hay)).length;
      return { q, score, order };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map((x) => x.q);
}

/**
 * Text that asks for an entry to be posted or a month reopened. No agent does
 * either (`agentRules.never`), and keywords can't tell a request from a question
 * about one, so the note states where posting happens and refuses nothing.
 */
export const mentionsPosting = (text: string) =>
  /\b(post|posts|posting|reverse|reversal|reopen|reopens|book it)\b/i.test(text);
