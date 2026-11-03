import type { ReactNode } from 'react';

/**
 * A sentence with its citation marks. The marks stay on the line of the word they
 * follow: wrapped alone, they cite nothing.
 */
export function CitedSentence({ text, children }: { text: string; children: ReactNode }) {
  const split = text.lastIndexOf(' ') + 1;
  return (
    <p>
      {text.slice(0, split)}
      <span className="whitespace-nowrap">
        {text.slice(split)}
        {children}
      </span>
    </p>
  );
}
