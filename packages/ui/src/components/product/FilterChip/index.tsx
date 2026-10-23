import { cn } from '../../../lib/utils';
import { Chip, type ChipProps } from '../../foundational/Chip';

export type FilterChipProps = Omit<ChipProps, 'children'> & {
  /** The facet being filtered — "Owner", "Status". */
  field: string;
  /** The value applied — "a.kanzaki", "failed". */
  value: React.ReactNode;
};

/**
 * FilterChip — product. Composes `Chip`.
 *
 * A chip that names an applied filter. The field/value split is the whole
 * point: "Owner: a.kanzaki" is legible out of context, where a bare "a.kanzaki"
 * in a filter bar is a guess.
 *
 * Neutral, like `Chip`. A filter is not state (§0 rule 1) — a chip filtering
 * for failed runs still carries no hue, because the chip is not itself failing.
 * Selection is the one exception, and it uses the interactive role.
 */
function FilterChip({ field, value, className, ...props }: FilterChipProps) {
  return (
    <Chip className={cn(className)} {...props}>
      <span className="text-text-secondary">{field}:</span>
      <span className="truncate">{value}</span>
    </Chip>
  );
}

export { FilterChip };
