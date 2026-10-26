import { useRef } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { buttonVariants, TooltipProvider } from 'tabular-ui';

import { SiteFooter } from './components/site-footer';
import { SiteNav } from './components/site-nav';
import { cn } from './lib/cn';

import './index.css';

/**
 * The document every route renders into. The page is light only (docs/site.md
 * D4): `data-theme="light"` ships in the prerendered HTML and the site never
 * calls `useTheme()`, so nothing switches on load.
 */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* The Tabular favicons, used as files and unchanged (§1, "Brand assets"). */}
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// TooltipProvider at the root: IconButton labels itself with a tooltip, and
// tooltips share their timing through the provider (packages/ui/README.md).
export default function App() {
  const mainRef = useRef<HTMLElement>(null);
  return (
    <TooltipProvider>
      {/* The first focusable element (§11). Parked above the viewport rather
          than sr-only, as AppShell's is: buttonVariants carries `relative`,
          which tailwind-merge doesn't resolve against sr-only's `absolute`,
          but does against `fixed` (CLAUDE.md failure log). */}
      <a
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'fixed top-2 left-2 z-50 -translate-y-[200%] bg-surface-raised focus-visible:translate-y-0',
        )}
      >
        Skip to content
      </a>
      <SiteNav />
      <main id="main" ref={mainRef} tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <SiteFooter />
    </TooltipProvider>
  );
}
