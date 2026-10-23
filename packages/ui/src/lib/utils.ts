import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge, taught our type scale.
 *
 * Without this, `cn('text-text-primary', 'text-metric')` resolves to
 * `text-metric` alone — the colour is silently dropped. tailwind-merge only
 * knows Tailwind's stock font sizes, so it reads an unrecognised `text-*` as a
 * **colour** and treats the two as conflicting. Reversing the order does not
 * help; it drops the size instead.
 *
 * The failure is invisible: no error, no warning, and the element renders in
 * whatever colour it inherits. It surfaced because a 32px KPI figure came out
 * `--color-text-body` instead of `--color-text-primary`.
 *
 * Every size in §8.1 is listed, not only the two that collide today, so the
 * next token added to the scale cannot reintroduce this.
 *
 * The same holds for §4's one shadow. Untaught, `shadow-overlay` reads as a
 * shadow **colour**, so `cn('shadow-overlay', 'shadow-border-strong')` kept
 * only the second, and Dialog rendered with no sheet at all (found
 * 2026-10-19, planting a violation to prove the elevation sweep).
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['2xs', 'xs', 'sm', 'base', 'md', 'lg', 'xl', 'metric', 'metric-sm'] }],
      shadow: [{ shadow: ['overlay'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
