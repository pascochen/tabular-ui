import {
  FileCodeIcon,
  FileCsvIcon,
  FileIcon,
  FileImageIcon,
  FileJpgIcon,
  FilePdfIcon,
  FilePngIcon,
  FileSqlIcon,
  FileSvgIcon,
  FileTextIcon,
  FileXlsIcon,
  type Icon,
} from '@phosphor-icons/react';

/**
 * Extension → glyph. Separate module so `index.tsx` exports only the component:
 * react-refresh disables fast refresh for any file mixing component and
 * non-component exports, which is why every `variants.ts` in this repo exists.
 *
 * **Shape carries the file type. Colour never does.** The instinct here is a red
 * PDF and a green spreadsheet — that is brand colour used for hierarchy, which
 * §0 rule 1 forbids outright. Every glyph renders `--color-text-secondary`, and
 * the distinction survives grayscale because it was never chromatic.
 *
 * Exported as a **map plus a string helper**, not as a `getIcon(name)` function.
 * A function returning a component is created during render, which React
 * Compiler flags (`react-hooks/static-components`) because a fresh component
 * identity each render remounts the subtree. Indexing a module-level map is what
 * `StatusBadge` does with `runStatuses`, and it is traceable to a static value.
 */
export const fileTypeIcons: Record<string, Icon> = {
  pdf: FilePdfIcon,
  csv: FileCsvIcon,
  tsv: FileCsvIcon,
  xls: FileXlsIcon,
  xlsx: FileXlsIcon,
  xlsm: FileXlsIcon,
  sql: FileSqlIcon,
  json: FileCodeIcon,
  yml: FileCodeIcon,
  yaml: FileCodeIcon,
  xml: FileCodeIcon,
  txt: FileTextIcon,
  log: FileTextIcon,
  md: FileTextIcon,

  // Images. Attachments in this product are not all machine-readable data —
  // a screenshot of a report, a scanned approval, a photographed invoice are
  // all evidence pinned to a record, and the fallback page glyph told the
  // user nothing about which. The specific glyphs follow the same rule as
  // `csv` and `xls` above: use one where the format has its own mark, and the
  // generic image mark where it does not. Still neutral, still shape-only.
  jpg: FileJpgIcon,
  jpeg: FileJpgIcon,
  png: FilePngIcon,
  svg: FileSvgIcon,
  gif: FileImageIcon,
  webp: FileImageIcon,
  heic: FileImageIcon,
};

/** An unknown or extensionless file is not an error state — it gets a plain page. */
export const fallbackFileIcon: Icon = FileIcon;

/** Lowercased extension, or `''` when there is none. Returns a string, never a component. */
export function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot < 1 ? '' : name.slice(dot + 1).toLowerCase();
}
