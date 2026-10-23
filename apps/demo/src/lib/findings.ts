import { findings } from './kasane';
import type { JourneyFile } from './files';

type Finding = { sources: string[] };

/**
 * A finding counts only when every file it rests on was read. Cancel the run
 * halfway and the counts shrink with it; load your own files and they are
 * zero, because the scripted agent only knows Kasane's material.
 */
export function foundIn<T extends Finding>(list: readonly T[], read: readonly JourneyFile[]): T[] {
  const names = new Set(read.map((f) => f.name));
  return list.filter((f) => f.sources.every((s) => names.has(s)));
}

export function findingsIn(read: readonly JourneyFile[]) {
  return {
    contradictions: foundIn(findings.contradictions, read),
    gaps: foundIn(findings.gaps, read),
    followUps: foundIn(findings.followUps, read),
  };
}
