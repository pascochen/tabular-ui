// The onboarding demo's script: the files a visitor loads and what the agent finds in them.
// The data is in apps/demo/data/, written by scripts/export-fixtures.mjs from the full Kasane
// dataset, which is not in this repository. Kasane Corporation is fictional.

import company from '../../data/company.json';
import discovery from '../../data/discovery.json';
import findingsData from '../../data/findings.json';
import pack from '../../data/pack.json';
import type { FileKind } from './files';

/** A file in Kasane's pack. Only what the screens read: no contents. */
export type PackFile = {
  name: string;
  kind: FileKind;
  /** The real file's size, which the file list and the run estimate show. */
  bytes: number;
  /** A spreadsheet's first line, which the header check reads. */
  firstLine?: string;
};

/** A statement and the files it rests on: it counts only once all of them were read. */
type Sourced = { id: string; sources: string[] };

export const kasanePack = pack as PackFile[];

export const kasaneCompany = company;

export const discoveryBullets: (Sourced & { text: string })[] = discovery;

export const findings: {
  contradictions: (Sourced & { claim: string; evidence: string })[];
  gaps: (Sourced & { text: string })[];
  followUps: (Sourced & { text: string })[];
} = findingsData;
