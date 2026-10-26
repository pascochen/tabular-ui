import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * The library's cn(), taught the site's reading sizes as well (src/index.css).
 *
 * tailwind-merge only knows the sizes it is told about, and reads any other
 * `text-*` as a colour. With the library's cn(), `cn('text-text-primary',
 * 'text-site-heading')` keeps only the size, and the heading renders in an
 * inherited colour with no error (CLAUDE.md failure log, `text-metric`).
 * The library's scale is listed too, so both work in one call.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            '2xs',
            'xs',
            'sm',
            'base',
            'md',
            'lg',
            'xl',
            'metric',
            'metric-sm',
            'site-display',
            'site-display-sm',
            'site-heading',
            'site-heading-sm',
            'site-title',
            'site-title-sm',
            'site-lead',
            'site-body',
            'site-small',
          ],
        },
      ],
      shadow: [{ shadow: ['overlay'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
