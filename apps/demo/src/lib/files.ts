import type { RunStatus } from 'tabular-ui';

import { kasanePack } from './kasane';

/** What onboarding accepts, per the journey spec. */
export const ACCEPTED_EXTENSIONS = ['.txt', '.md', '.jpg', '.jpeg', '.png', '.csv'] as const;
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB per file

export type FileKind = 'transcript' | 'document' | 'spreadsheet' | 'image';

export const fileKinds: Record<FileKind, { label: string; plural: string }> = {
  transcript: { label: 'Transcript', plural: 'Transcripts' },
  document: { label: 'Document', plural: 'Documents' },
  spreadsheet: { label: 'Spreadsheet', plural: 'Spreadsheets' },
  image: { label: 'Image', plural: 'Images' },
};

/**
 * A selected file plus what onboarding knows about it. Validation state
 * reuses Tabular UI's run statuses — READY/CHECK/QUEUED from the sketches map onto
 * `passed` / `needs-review` / `queued`. No new statuses, no sixth hue.
 */
export type JourneyFile = {
  id: string;
  file: File;
  name: string;
  bytes: number;
  kind: FileKind;
  status: RunStatus;
  /** Present when status is `needs-review` — the reason, e.g. "no header row". */
  flag?: string;
};

export type RejectedFile = { name: string; reason: string };

export function classify(name: string): FileKind | null {
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
  switch (ext) {
    case '.txt':
      return 'transcript';
    case '.md':
      return 'document';
    case '.csv':
      return 'spreadsheet';
    case '.jpg':
    case '.jpeg':
    case '.png':
      return 'image';
    default:
      return null;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/** One CSV line into cells, honouring double quotes ("" escapes a quote). */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      cells.push(cell);
      cell = '';
    } else {
      cell += ch;
    }
  }
  cells.push(cell);
  return cells;
}

/**
 * Cell contents that are data, never a column name: decimal or currency
 * amounts, ISO-style dates, and percentages. Bare integers are deliberately
 * NOT here — `2024` is a legitimate year column in a wide-format sheet
 * (`region,2024,2025,2026`), and the two failure directions are asymmetric:
 * a missed flag means a file simply passes, a false flag tells a user their
 * valid file is broken.
 */
const dataOnlyCell = /^-?[\d,. ]*\.\d+$|^[-+]?[$€£]\s?-?[\d,. ]+$|^-?[\d,. ]+%$|^\d{4}-\d{2}(-\d{2})?$/;

/**
 * Heuristic header sniff for CSVs: flag only when the first row contains a
 * cell that could not be a column name — an amount, a date, a percentage, or
 * an empty cell. Cheap, runs on the first line only, and honest — the flag in
 * the pre-flight dialog reflects the actual file, not a canned message.
 */
export async function csvLacksHeader(file: File): Promise<boolean> {
  try {
    const head = (await file.slice(0, 4096).text()).split(/\r?\n/, 1)[0] ?? '';
    if (head.trim() === '') return true;
    const cells = splitCsvLine(head).map((c) => c.trim());
    return cells.some((c) => c === '' || dataOnlyCell.test(c));
  } catch {
    return false;
  }
}

let nextId = 0;
export function toJourneyFile(file: File, kind: FileKind): JourneyFile {
  nextId += 1;
  return {
    id: `f${nextId}`,
    file,
    name: file.name,
    bytes: packFileBytes.get(file) ?? file.size,
    kind,
    status: 'queued',
  };
}

/** Simulated wall-clock formatting: 168 → "2 h 48 m". */
/**
 * How long a real run of these files would take, in minutes: the demo's
 * pretend clock. About 4 minutes a file plus 30 a megabyte, so Kasane's 20
 * files (2.9 MB) come to about 2 h 47 m, and one small file to a few minutes.
 * Until 2026-10-21 every run claimed 2 h 48 m, a 27-byte file included.
 */
export function estimateRunMinutes(files: readonly JourneyFile[]): number {
  const megabytes = files.reduce((sum, f) => sum + f.bytes, 0) / (1024 * 1024);
  return Math.max(1, Math.round(files.length * 4 + megabytes * 30));
}

/** The recap's evidence-sheet figure: "20", or "20, 1 flagged for review". */
export function evidenceSheetCount({
  evidenceSheets,
  flaggedSheets,
}: {
  evidenceSheets: number;
  flaggedSheets: number;
}) {
  return flaggedSheets > 0 ? `${evidenceSheets}, ${flaggedSheets} flagged for review` : String(evidenceSheets);
}

export function formatMinutes(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest} m`;
  return `${h} h ${rest} m`;
}

/** The type a pack file carries, as a browser would set it on a dropped one. */
const MIME: Record<string, string> = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  '.png': 'image/png',
};

/**
 * A stand-in's size is the real file's, recorded in the pack: the file list and the run estimate
 * show what Kasane's files weigh, not the few bytes a stand-in holds.
 */
const packFileBytes = new WeakMap<File, number>();

/**
 * The Kasane demo pack as `File`s, built from `data/pack.json`. The pack's contents are not in this
 * repository, so each is a stand-in holding only what the demo reads: a spreadsheet's first line.
 * They go through the same validation as a dropped file: the bank export really has no header row,
 * and the check really reads its first line.
 */
export async function loadKasanePack(): Promise<File[]> {
  return kasanePack.map(({ name, bytes, firstLine }) => {
    const type = MIME[name.slice(name.lastIndexOf('.')).toLowerCase()] ?? '';
    const file = new File(firstLine === undefined ? [] : [`${firstLine}\n`], name, { type });
    packFileBytes.set(file, bytes);
    return file;
  });
}
