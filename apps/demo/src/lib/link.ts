import { cn } from 'tabular-ui';

/** A link in running content: ink, underlined at rest, which is its only mark (§1), with `AttachmentRow`'s offset ring. */
export const linkClassName = cn(
  'text-text-interactive underline decoration-1 underline-offset-2',
  'rounded-xs outline-none focus-visible:outline-ring',
  'focus-visible:outline-solid focus-visible:outline-[length:var(--ring-width)]',
  'focus-visible:outline-offset-[var(--ring-offset)]',
);
