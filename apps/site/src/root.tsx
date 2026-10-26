import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { TooltipProvider } from 'tabular-ui';

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
  return (
    <TooltipProvider>
      <Outlet />
    </TooltipProvider>
  );
}
