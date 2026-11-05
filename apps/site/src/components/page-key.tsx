import { Rail, Section } from './layout';
import { SpecimenFrame } from './specimen';

/**
 * PROTOTYPE, the frontispiece (docs/reviews/inner-page-heads-2026-11-05.md).
 * Not decided, and not in D10's list of site components.
 *
 * A page head split as Home's hero is, 5/7: the intro on the left, and on the
 * right a key that shows what the lead claims. Every key has the same three
 * columns, the mark, what it means and its name, so the pages read as one
 * system while the marks change. The key shows from `lg` only: below that it
 * stacks under a lead that has just said the same thing in words.
 */
export function KeyedHead({
  above,
  intro,
  keyPlate,
}: {
  /** Full width, over both columns: Foundations' links. The plate then starts at the title, as Home's does. */
  above?: React.ReactNode;
  intro: React.ReactNode;
  keyPlate: React.ReactNode;
}) {
  return (
    <Section rule={false}>
      <Rail className="flex flex-col gap-[var(--site-gap)]">
        {above}
        <div className="grid grid-cols-1 items-start gap-[var(--site-gap)] lg:grid-cols-12">
          <div className="flex flex-col gap-[var(--gap-group)] lg:col-span-5">{intro}</div>
          <div className="hidden lg:col-span-7 lg:block">{keyPlate}</div>
        </div>
      </Rail>
    </Section>
  );
}

export type KeyRow = {
  /** The mark, drawn with the real token or component. Decorative marks set their own aria-hidden. */
  mark: React.ReactNode;
  meaning: string;
  name: string;
};

/**
 * The key: one paper plate, one row per thing the lead names, ruled like a
 * ledger. The meaning takes the spare width and the name sits at the plate's
 * right edge, so the plate fills its seven columns on every page; the rules
 * carry the eye across the gap, as a spreadsheet's do. Rows are DataTable's
 * height, the hero sheet's pitch, and grow for a taller mark. A subgrid lines
 * each column up.
 */
export function PageKey({ label, rows }: { label: string; rows: KeyRow[] }) {
  return (
    <SpecimenFrame className="bg-canvas">
      <ul role="list" aria-label={label} className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-[var(--site-gap)]">
        {rows.map((row) => (
          <li
            key={row.name}
            className="col-span-3 grid min-h-[var(--h-row-sm)] grid-cols-subgrid items-center border-t border-border py-1 first:border-t-0"
          >
            <span className="flex items-center">{row.mark}</span>
            <span className="text-site-small text-text-body">{row.meaning}</span>
            <code className="text-right text-xs text-text-secondary">{row.name}</code>
          </li>
        ))}
      </ul>
    </SpecimenFrame>
  );
}
