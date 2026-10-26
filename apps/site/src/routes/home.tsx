import type { Route } from './+types/home';

export const meta: Route.MetaFunction = () => [
  { title: 'Tabular UI' },
  {
    name: 'description',
    content: 'Dense React components and design tokens for finance and operations data tools, agentic UI included.',
  },
];

// The library's focus ring, as controlBase draws it on every control.
const link = [
  'text-text-interactive underline',
  'outline-none focus-visible:outline-ring focus-visible:outline-solid',
  'focus-visible:outline-[length:var(--ring-width)] focus-visible:outline-offset-[length:var(--ring-offset)]',
].join(' ');

const elsewhere = [
  { href: 'https://storybook.tabularui.com', label: 'Storybook' },
  { href: 'https://demo.tabularui.com', label: 'Demo' },
  { href: 'https://github.com/pascochen/tabular-ui', label: 'Source on GitHub' },
];

/**
 * The bare Home of the first deploy (docs/site.md §13, step 1). Its job is to
 * stand behind the registry rewrite in vercel.json; the page itself is built
 * in step 2. The heading and lead are the wireframe's (`76:45`).
 */
export default function Home() {
  return (
    <main className="mx-auto flex max-w-[680px] flex-col gap-[var(--gap-section)] px-4 py-8">
      <div className="flex flex-col gap-[var(--gap-group)]">
        <h1 className="text-xl text-text-primary">An agent stops before anything that posts to the ledger.</h1>
        <p className="text-base text-text-secondary">
          Proposals are cheap. Journal entries are not. Only a person can release one.
        </p>
      </div>
      <ul role="list" className="flex flex-wrap gap-[var(--gap-group)] text-base">
        {elsewhere.map(({ href, label }) => (
          <li key={href}>
            <a href={href} className={link}>
              {label}
              <span aria-hidden="true"> ↗</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
