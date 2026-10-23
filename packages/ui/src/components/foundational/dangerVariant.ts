/**
 * `destructive` → `danger`, renamed 2026-10-10.
 *
 * Button, IconButton, MenuItem and ContextSwitcher's actions called the red
 * variant `destructive`; Badge, ProgressBar and every token call the same role
 * `danger` (§1). One word per state, and the system's own: `danger`. The old
 * spelling still renders the same, and warns once per component in
 * development. Lint rejects it in new code.
 */

// Once per component, not per render: a table of row actions would otherwise
// flood the console with the same line.
const warned = new Set<string>();

export function dangerVariant<V extends string | null | undefined>(
  component: string,
  variant: V,
): Exclude<V, 'destructive'> | 'danger' {
  if (variant !== 'destructive') return variant as Exclude<V, 'destructive'>;
  if (import.meta.env.DEV && !warned.has(component)) {
    warned.add(component);
    console.warn(
      `${component}: variant="destructive" is deprecated. Use variant="danger", the system's name for the red role (§1).`,
    );
  }
  return 'danger';
}
