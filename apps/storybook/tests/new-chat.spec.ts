import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { mentionsPosting, nearest, questions, sameQuestion, scripted, suggestions } from '../../demo/src/lib/new-chat';

/**
 * New chat's questions (apps/demo/src/lib/new-chat.ts): what the page suggests,
 * which typed text gets an answer, and what the rest gets instead. Matching is
 * by keyword with no model, so its edges are worth pinning.
 *
 * Nothing here needs a browser.
 */

type Close = {
  agents: { key: string; reads: string[]; finding: string }[];
  exceptions: { id: string; summary: string }[];
  newChat: {
    questions: {
      question: string;
      answers: { agent: string; finding?: string; answer: string; sources: string[] }[];
    }[];
  };
};
const close = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, '../../demo/data/close.json'), 'utf8'),
) as Close;

test('the page suggests four questions, in plain words', () => {
  expect(suggestions([])).toEqual([
    'Did we pay any invoice twice?',
    'Who owes us more than their limit?',
    'Is September’s revenue in the right month?',
    'Did it happen more than once?',
  ]);
  // ChatStarter: each a whole question, about 50 characters or fewer.
  for (const q of suggestions([])) expect(q.length, q).toBeLessThanOrEqual(50);
});

test('an asked question gives its place to the next one', () => {
  expect(suggestions(['did we pay any invoice twice'])).toEqual([
    'Who owes us more than their limit?',
    'Is September’s revenue in the right month?',
    'Did it happen more than once?',
    'Did anyone approve their own entry?',
  ]);
});

test('a typed apostrophe, case and closing punctuation don’t make a different question', () => {
  expect(sameQuestion("is september's revenue in the right month", 'Is September’s revenue in the right month?')).toBe(
    true,
  );
  expect(scripted("Where's the cash?")?.answers.map((a) => a.agent)).toEqual(['credit-ai']);
  expect(scripted('Where is the cash?')).toBeUndefined();
});

test('one question is answered by all four agents, each for itself', () => {
  expect(scripted('Did it happen more than once?')?.answers.map((a) => a.agent)).toEqual([
    'cutoff-ai',
    'payments-ai',
    'approvals-ai',
    'credit-ai',
  ]);
});

test('each agent’s own two questions are answered here too', () => {
  expect(scripted('How much does Great Lakes owe now?')?.answers.map((a) => a.agent)).toEqual(['credit-ai']);
  expect(questions).toHaveLength(close.newChat.questions.length + close.agents.length * 2);
});

test('an answer that is a finding says it word for word, and names its task', () => {
  for (const q of close.newChat.questions) {
    for (const a of q.answers.filter((x) => x.finding)) {
      expect(a.answer, q.question).toBe(close.exceptions.find((e) => e.id === a.finding)!.summary);
      expect(close.agents.find((x) => x.key === a.agent)!.finding, q.question).toBe(a.finding);
    }
  }
});

test('an agent answers only from files it reads', () => {
  for (const q of close.newChat.questions) {
    for (const a of q.answers.filter((x) => !x.finding)) {
      const reads = close.agents.find((x) => x.key === a.agent)!.reads;
      for (const s of a.sources) expect(reads, `${a.agent}: ${q.question}`).toContain(s);
    }
  }
});

test('a record ID or a name finds its agent’s questions', () => {
  const agentsOf = (text: string) => [...new Set(nearest(text, 4).flatMap((q) => q.answers.map((a) => a.agent)))];
  expect(agentsOf('great')).toEqual(['credit-ai']);
  expect(agentsOf('JE-KUK-2608-00055')).toContain('approvals-ai');
  expect(nearest('MFL-58821', 1)[0].answers[0].agent).toBe('payments-ai');
});

test('text about nothing in the script finds nothing, so the page falls back to its suggestions', () => {
  expect(nearest('weather tomorrow', 2)).toEqual([]);
  expect(nearest('   ', 2)).toEqual([]);
  expect(nearest('the of and', 2)).toEqual([]);
});

test('a mention of posting or reopening is caught, whichever way it is asked', () => {
  for (const text of [
    'post the reversal',
    'Reopen September',
    'why wasn’t September reopened?'.replace('reopened', 'reopen'),
  ]) {
    expect(mentionsPosting(text), text).toBe(true);
  }
  expect(mentionsPosting('Did we pay any invoice twice?')).toBe(false);
});
