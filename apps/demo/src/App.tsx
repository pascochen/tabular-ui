import { AppBar, AppShell, AppShellPageHeader, AppShellSidebarToggle } from 'tabular-ui';

import { DemoBanner } from './components/DemoBanner';
import { useView } from './lib/view';
import { Sidebar, SidebarFooter, SidebarHeader } from './shell/Sidebar';
import { slotsFor } from './views/slots';

/**
 * The close demo: a team chat for Kasane's September close. One shell, and
 * the view in the URL decides what fills it (`lib/view.ts`). The sidebar,
 * the page header and the right panel follow the view; nothing else is
 * routed.
 */
export function App() {
  const view = useView();
  const slots = slotsFor(view);

  return (
    <AppShell
      className="font-sans text-base text-text-body"
      topNav={
        <AppBar brand={<AppShellSidebarToggle />}>
          <DemoBanner />
        </AppBar>
      }
      sidebarHeader={<SidebarHeader />}
      sidebar={<Sidebar />}
      sidebarFooter={<SidebarFooter />}
      pageHeader={<AppShellPageHeader title={slots.title} />}
      panel={slots.panel?.content}
      panelLabel={slots.panel?.label}
    >
      {slots.body}
    </AppShell>
  );
}
