// What Sources says about a file beyond its contents: who reads it, what a
// finding rests on in it, what the extract leaves out, and what its switch does.
// Every line is derived from the generated data and the close state
// (docs/reviews/sources-2026-11-12.md).

import { isSourceOn, type CloseState } from './close-state';
import { agents, usedBy, type Agent, type Ref, type SourceDocument } from './kasane';

const number = (n: number) => n.toLocaleString('en-US');

/** "A", "A and B", "A, B and C". */
function list(names: readonly string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

/** The agents that read a file. A file can be read without any finding resting on it. */
export const readersOf = (slug: string): Agent[] => agents.filter((a) => (a.reads as string[]).includes(slug));

/**
 * How much of what's on screen a finding rests on: its rows, or its run of lines.
 * "Rests on", the demo's word for it everywhere (close-data.spec.ts holds that).
 */
export function restsOnLine(doc: SourceDocument, ref: Ref): string {
  if (ref.rows && doc.table) {
    return `This finding rests on ${number(ref.rows.length)} of the ${number(doc.table.rows.length)} rows shown.`;
  }
  if (ref.lines) {
    const [first, last] = ref.lines;
    return first === last ? `This finding rests on line ${first}.` : `This finding rests on lines ${first} to ${last}.`;
  }
  return '';
}

/**
 * What the extract can't show. The selected records support a claim about what is in
 * the file. A claim about the whole file ("the only one", "paid once") rests on
 * the rows that aren't here, and the page says so rather than let a short
 * extract read as proof. Nothing when the extract is the whole file.
 */
export function leftOutLine(doc: SourceDocument): string | null {
  const left = doc.table ? doc.table.rowCount - doc.table.rows.length : doc.text!.lineCount - doc.text!.lines.length;
  if (left <= 0) return null;
  const unit = doc.table ? (left === 1 ? 'row' : 'rows') : left === 1 ? 'line' : 'lines';
  const verb = left === 1 ? "isn't" : "aren't";
  return `The file's other ${number(left)} ${unit} ${verb} shown, so a claim about the whole file can't be checked here.`;
}

/**
 * What a file's switch does, as fact: who reads the file and which findings
 * rest on it, and, once it's off, what that leaves. It stays beside the switch
 * after the change, because the change itself lands on other pages: the
 * agent's profile, the finding's panel and Tasks' "not checked" count.
 */
export function switchEffect(state: CloseState, slug: string): string {
  const readers = list(readersOf(slug).map((a) => a.name));
  const findings = list(usedBy(slug).map((e) => e.title));
  const reads = readersOf(slug).length === 1 ? 'reads' : 'read';
  const rests = usedBy(slug).length === 1 ? 'rests' : 'rest';
  if (isSourceOn(state, slug)) {
    return findings
      ? `${readers} ${reads} it. ${findings} ${rests} on it.`
      : `${readers} ${reads} it. No finding rests on it.`;
  }
  const off = `Off. ${readers} ${readersOf(slug).length === 1 ? "doesn't" : "don't"} read it.`;
  return findings ? `${off} ${findings} can't be rechecked.` : off;
}
