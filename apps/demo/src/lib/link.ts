import { cn } from 'tabular-ui';

/** A link in running content: the interactive role, underlined on hover, with `AttachmentRow`'s offset ring. */
export const linkClassName = cn(
  'text-text-interactive hover:underline',
  'rounded-xs outline-none focus-visible:outline-ring',
  'focus-visible:outline-solid focus-visible:outline-[length:var(--ring-width)]',
  'focus-visible:outline-offset-[var(--ring-offset)]',
);
