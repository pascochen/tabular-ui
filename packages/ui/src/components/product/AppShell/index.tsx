import { SidebarSimpleIcon } from '@phosphor-icons/react';
import { cloneElement, isValidElement, useContext, useEffect, useId, useRef, useState, type ReactElement } from 'react';

import { cn } from '../../../lib/utils';
import { buttonVariants } from '../../foundational/Button/variants';
import { IconButton } from '../../foundational/IconButton';
import { iconWeightForSize } from '../../foundational/IconButton/variants';
import { TruncatedText } from '../TruncatedText';
import { AppShellContext, type AppShellContentWidth, type AppShellContextValue } from './context';

/**
 * Tailwind's stock `xl` breakpoint — 80rem, 1280px at the default root size.
 * Stock deliberately: a custom breakpoint would be a new token. Kept in rem
 * so it moves with the user's font-size setting exactly as `xl:` does.
 */
const WIDE_QUERY = '(min-width: 80rem)';

const matchesWide = () => (typeof window === 'undefined' ? true : window.matchMedia(WIDE_QUERY).matches);

/**
 * How long the peek survives the pointer leaving it. Long enough to cross
 * the gap between the top-nav toggle and the peek, or to overshoot the
 * peek's edge and come back; short enough that it does not linger.
 */
const PEEK_CLOSE_DELAY = 300;

/**
 * One band height for every header in the shell — top nav, sidebar header,
 * panel header, page header — so their bottom rules form a single line.
 * Same recipe as `AppBar`: --pad-band-y (8px) around a 32px --h-control
 * child, plus the 1px rule, measures 49px. The height stays emergent on
 * purpose — §7.4 says why there is no --h-band — so a band's child must be
 * at least --h-control tall. --h-control-lg is the floor for an empty band.
 */
const headerBand =
  'flex min-h-[var(--h-control-lg)] shrink-0 items-center border-b border-border py-[var(--pad-band-y)]';

/**
 * Sidebar horizontal padding is the page gutter, not a sidebar token, so the
 * sidebar's edges line up with the top nav's.
 */
const sidebarGutter = 'px-[var(--pad-page-x)]';

/**
 * Every region's first content sits one --pad-page-y below the shared header
 * rule, so sidebar, main and panel open on one line (§7.4).
 */
const regionInsetY = 'py-[var(--pad-page-y)]';

/**
 * Main's side gutter, shared by the page header and the body so the title
 * starts on the body's x. Narrow, it is --pad-content-x. Once <main> is at
 * least 672px wide (the stock @2xl container size), the frame tier takes
 * over (§7.3): --pad-frame-x, widened by whatever centres a --w-content
 * column (§7.9) on a wide monitor. `full` keeps the frame gutter and drops
 * the centring, for table pages where extra width is extra columns.
 *
 * A module-level map indexed by the prop, not a function returning classes:
 * the page header reads the same entry from context, so the two can never
 * disagree.
 *
 * Centred with padding, not a max-width wrapper. A wrapper inside the scroll
 * container would sit between it and the page, and a child's `flex-1
 * min-h-0` would stop being bounded by the scroll container: a virtualized
 * table would render every row (failure log). `100%` in padding resolves
 * against <main>'s width, which is the same for header and body.
 */
const mainGutter: Record<AppShellContentWidth, string[]> = {
  contained: [
    'px-[var(--pad-content-x)]',
    '@2xl/main:px-[max(var(--pad-frame-x),calc((100%_-_var(--w-content))/2_+_var(--pad-frame-x)))]',
  ],
  full: ['px-[var(--pad-content-x)]', '@2xl/main:px-[var(--pad-frame-x)]'],
};

/**
 * Main body's top inset. --pad-page-y like the other regions while narrow;
 * --pad-frame-top once the frame is on, switching with the gutter so a page
 * never gets the frame's sides without its top. The bottom stays
 * --pad-page-y.
 */
const mainInsetY = [regionInsetY, '@2xl/main:pt-[var(--pad-frame-top)]'];

/**
 * Both footer bands carry py-3 (12px), primitive scale per §7.4's fallback
 * rule. The sidebar's is 56px around its 32px --h-control account row. The
 * panel's grows with ChatComposer's two-row box, so the two no longer share
 * a line (decided 2026-10-13: Send belongs inside the composer).
 */
const footerBand = 'shrink-0 py-3';

export type AppShellProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  /**
   * The top band over main and panel — normally an `AppBar` whose `brand`
   * slot starts with `<AppShellSidebarToggle />` and a breadcrumb.
   */
  topNav: React.ReactNode;
  /** Sidebar header, leading edge — the company or workspace switcher. The toggle is added after it. */
  sidebarHeader?: React.ReactNode;
  /** Sidebar body — project selector, `AppShellNav`. Scrolls on its own. */
  sidebar?: React.ReactNode;
  /** Sidebar footer — account, settings. Pinned to the bottom. */
  sidebarFooter?: React.ReactNode;
  /** Whether the sidebar starts pinned at ≥1280px. Below it, it always starts collapsed. */
  defaultSidebarOpen?: boolean;
  /**
   * Trailing panel content — the chat drawer. Compose it from
   * `AppShellPanelHeader` / `AppShellPanelBody` / `AppShellPanelFooter`.
   */
  panel?: React.ReactNode;
  /** Accessible name for the panel's `complementary` landmark. Required when `panel` is set. */
  panelLabel?: string;
  /** Controlled panel state. Omit to let the shell hold it. */
  panelOpen?: boolean;
  defaultPanelOpen?: boolean;
  onPanelOpenChange?: (open: boolean) => void;
  /**
   * The page's title band, an `AppShellPageHeader`. Rendered at the top of
   * `<main>`, above its scrolling body, so its rule lines up with the panel
   * header's. Omit it and main starts with its body.
   */
  pageHeader?: React.ReactNode;
  /**
   * `contained` (default) centres the page in a --w-content column (1280px)
   * once main is wider than that. `full` drops the cap and keeps the frame
   * gutter: for table pages, where extra width is extra columns (§7.9).
   * Prose, forms, dashboards and detail pages stay `contained`.
   */
  contentWidth?: AppShellContentWidth;
  /** The page itself, in `<main>`'s scrolling body. */
  children: React.ReactNode;
};

/**
 * AppShell — product.
 *
 * The application frame, in three columns:
 *
 *   ┌──────────┬────────────────────────────┬──────────┐
 *   │ sidebar  │ top nav                               │
 *   │ header   ├────────────────────────────┬──────────┤
 *   │──────────│ page header                │ panel    │
 *   │ sidebar  │────────────────────────────│ header   │
 *   │ body     │ main body                  │──────────│
 *   │          │ (scrolls)                  │ (chat)   │
 *   │──────────│                            │          │
 *   │ footer   │                            │          │
 *   └──────────┴────────────────────────────┴──────────┘
 *
 * The sidebar runs the full height with its own header band; the top nav
 * spans main and panel only. Every header band shares one height, so their
 * rules line up: sidebar header with top nav, page header with panel header. The shell owns geometry, scroll containment and the
 * sidebar and panel state — never content. Every region is a slot.
 *
 * **The sidebar has two states, and the overlay is never a click target:**
 *
 * - **Pinned** — docked in flow, full height. The toggle sits in the sidebar
 *   header. Clicking either toggle always pins or unpins; it never opens an
 *   overlay.
 * - **Collapsed** — gone, no rail. The toggle moves to the top nav. Hovering
 *   it with a mouse *peeks* the sidebar: a floating overlay over main that
 *   closes when the pointer leaves. Clicking — the toggle, or the peek's own
 *   header toggle — pins it.
 *
 * Peek is a mouse affordance on top of a keyboard- and touch-complete
 * model: Enter or a tap pins, which reaches everything the peek shows.
 *
 * Width only sets the default: ≥1280px starts pinned, below it starts
 * collapsed, and crossing below the floor collapses. Pinning below the floor
 * docks the sidebar there too — it pushes main, it does not cover it.
 *
 * The panel docks at every width and pushes main rather than covering it.
 *
 * **The shell has a bounded height (`h-dvh`) and only regions scroll.** That
 * bound is what `DataTable`'s virtualizer measures against.
 */
function AppShell({
  topNav,
  sidebarHeader,
  sidebar,
  sidebarFooter,
  defaultSidebarOpen = true,
  panel,
  panelLabel,
  panelOpen: panelOpenProp,
  defaultPanelOpen = true,
  onPanelOpenChange,
  pageHeader,
  contentWidth = 'contained',
  children,
  className,
  ...props
}: AppShellProps) {
  const [wide, setWide] = useState(matchesWide);
  // Pinned state is kept per width class: a user who collapses the sidebar
  // on a wide screen gets it back collapsed after a trip below the floor,
  // and a pin made below the floor does not outlive the narrow window.
  const [pinnedWide, setPinnedWide] = useState(defaultSidebarOpen);
  const [pinnedNarrow, setPinnedNarrow] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [panelOpenState, setPanelOpenState] = useState(defaultPanelOpen);

  useEffect(() => {
    const mql = window.matchMedia(WIDE_QUERY);
    const onChange = () => {
      setWide(mql.matches);
      setPinnedNarrow(false);
      setPeeking(false);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const sidebarId = useId();
  const panelId = useId();
  const mainId = useId();
  const mainRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const headerToggleRef = useRef<HTMLButtonElement>(null);
  // Element refs fed by callback refs, read only in effects and handlers.
  const navToggleRef = useRef<HTMLButtonElement | null>(null);
  const focusAfterPinChange = useRef(false);
  const focusAfterPanelClose = useRef(false);
  const peekCloseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Set when a mouse enters the top-nav toggle; the first real move over it
  // spends it and opens the peek. See onTogglePointerMove.
  const peekArmed = useRef(false);

  useEffect(() => () => clearTimeout(peekCloseTimer.current), []);

  const hasSidebar = sidebar != null || sidebarHeader != null || sidebarFooter != null;
  const pinned = hasSidebar && (wide ? pinnedWide : pinnedNarrow);
  const peek = hasSidebar && !pinned && peeking;
  const panelOpen = panel != null && (panelOpenProp ?? panelOpenState);

  // The toggle changes places: pinning removes the one the user pressed
  // (top nav) and reveals the other (sidebar header), and unpinning does the
  // reverse. Without this hand-off, focus falls to <body> on every toggle.
  useEffect(() => {
    if (!focusAfterPinChange.current) return;
    focusAfterPinChange.current = false;
    (pinned ? headerToggleRef.current : navToggleRef.current)?.focus();
  }, [pinned]);

  // Closing the panel from inside it unmounts the focused element. Return
  // focus to whatever opens the panel.
  useEffect(() => {
    if (panelOpen || !focusAfterPanelClose.current) return;
    focusAfterPanelClose.current = false;
    document.querySelector<HTMLElement>(`[aria-controls="${CSS.escape(panelId)}"]`)?.focus();
  }, [panelOpen, panelId]);

  const setPanelOpen = (open: boolean) => {
    if (!open && panelRef.current?.contains(document.activeElement)) {
      focusAfterPanelClose.current = true;
    }
    if (panelOpenProp === undefined) setPanelOpenState(open);
    onPanelOpenChange?.(open);
  };

  const setPinned = (next: boolean) => {
    focusAfterPinChange.current = true;
    clearTimeout(peekCloseTimer.current);
    setPeeking(false);
    if (wide) setPinnedWide(next);
    else setPinnedNarrow(next);
  };

  const openPeek = () => {
    clearTimeout(peekCloseTimer.current);
    setPeeking(true);
  };

  const scheduleClosePeek = () => {
    clearTimeout(peekCloseTimer.current);
    peekCloseTimer.current = setTimeout(() => {
      // A menu or select opened from inside the peek portals its popup out
      // of the sidebar, so moving onto it reads as leaving. Its trigger
      // still carries aria-expanded="true" — stay open while one does.
      const popupOpen = sidebarRef.current?.querySelector(
        '[aria-expanded="true"]:not([data-slot="app-shell-sidebar-header-toggle"])',
      );
      if (!popupOpen) setPeeking(false);
    }, PEEK_CLOSE_DELAY);
  };

  const context: AppShellContextValue = {
    contentWidth,
    sidebarOpen: pinned,
    toggleSidebar: () => setPinned(!pinned),
    panelOpen,
    setPanelOpen,
    togglePanel: () => setPanelOpen(!panelOpen),
    panelId,
    hasSidebar,
    sidebarId,
    registerToggle: (el) => {
      navToggleRef.current = el;
    },
    // Mouse only: a touch "hover" is a tap, and a tap pins.
    //
    // Enter arms the peek; only a real move over the toggle opens it. The
    // toggle mounts wherever the sidebar collapses — after an unpin by
    // keyboard, or crossing below the floor — and Chromium then fires
    // trusted pointerover/pointerenter at a pointer that never moved, a
    // frame later. Opening on enter popped a peek the user never asked for,
    // straight after they collapsed the sidebar. Those layout-driven
    // boundary events carry no pointermove.
    onTogglePointerEnter: (event) => {
      peekArmed.current = event.pointerType === 'mouse';
    },
    onTogglePointerMove: (event) => {
      if (!peekArmed.current || event.pointerType !== 'mouse' || pinned) return;
      peekArmed.current = false;
      openPeek();
    },
    onTogglePointerLeave: () => {
      peekArmed.current = false;
      if (peek) scheduleClosePeek();
    },
  };

  return (
    <AppShellContext.Provider value={context}>
      <div
        data-slot="app-shell"
        data-sidebar={pinned ? 'pinned' : peek ? 'peek' : 'collapsed'}
        className={cn(
          // Two columns, two rows. The pinned sidebar spans both rows in
          // column 1; the top nav and body sit in column 2. A peeking sidebar
          // moves into the body cell and overlaps main — same element, so its
          // scroll position and any open state survive.
          'grid h-dvh grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)]',
          'bg-canvas text-text-body',
          className,
        )}
        {...props}
      >
        {/*
          Skip link. Focus is moved by hand rather than by following the
          fragment: a hash router would read "#main" as a route.
        */}
        <a
          href={`#${mainId}`}
          onClick={(event) => {
            event.preventDefault();
            mainRef.current?.focus();
          }}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            // Parked above the viewport, not `sr-only`: buttonVariants carries
            // `relative`, which tailwind-merge does not know conflicts with
            // sr-only's `absolute` — the link stayed in flow and took a grid
            // cell. `fixed` does conflict with `relative`, so it wins, and a
            // fixed child never occupies a grid cell.
            'fixed top-2 left-2 z-50 -translate-y-[200%] bg-surface-raised',
            'focus-visible:translate-y-0',
          )}
        >
          Skip to content
        </a>

        <div data-slot="app-shell-top-nav" className="col-start-2 row-start-1 min-w-0">
          {topNav}
        </div>

        <div data-slot="app-shell-body" className="col-start-2 row-start-2 flex min-h-0 min-w-0">
          {/*
            <main> is a column: the page header band, then the scrolling
            body. The header sits inside the landmark, so the skip link and
            a screen reader's "main" landmark both land on the page title,
            but outside the scroll, so it stays put and its rule lines up
            with the panel header's by construction.
          */}
          <main
            ref={mainRef}
            id={mainId}
            tabIndex={-1}
            data-slot="app-shell-main"
            data-content-width={contentWidth}
            // A size container: the frame tier keys off main's own width,
            // which pinning and the panel change while the viewport stays put.
            className="@container/main flex min-w-0 flex-1 flex-col outline-none"
          >
            {pageHeader}
            <div
              data-slot="app-shell-main-body"
              className={cn(
                'flex min-h-0 flex-1 flex-col overflow-auto',
                // Wider than the chrome's 16px at every width, and the frame
                // tier's 48px once main is wide (§7.3). The gutter is also
                // what gives a focus ring room to paint inside this scroll
                // container (§4 — "Room").
                mainGutter[contentWidth],
                mainInsetY,
              )}
            >
              {children}
            </div>
          </main>

          {panelOpen ? (
            <aside
              ref={panelRef}
              id={panelId}
              aria-label={panelLabel}
              data-slot="app-shell-panel"
              className={cn(
                // --w-panel (440px), from the shell sketch (§7.9). No padding
                // and no scroll here: header and footer pin, and only
                // AppShellPanelBody scrolls.
                'flex w-[var(--w-panel)] min-h-0 shrink-0 flex-col border-l border-border bg-surface',
              )}
            >
              {panel}
            </aside>
          ) : null}
        </div>

        {/*
          After the body in source order, so a peek paints over main without
          a z-index war. Sidebar landmarks come from its content (AppShellNav).
        */}
        {hasSidebar ? (
          <div
            ref={sidebarRef}
            id={sidebarId}
            data-slot="app-shell-sidebar"
            data-state={pinned ? 'pinned' : peek ? 'peek' : 'collapsed'}
            hidden={!pinned && !peek}
            onPointerEnter={() => {
              if (peek) clearTimeout(peekCloseTimer.current);
            }}
            onPointerLeave={() => {
              if (peek) scheduleClosePeek();
            }}
            onKeyDown={(event) => {
              if (peek && event.key === 'Escape') setPeeking(false);
            }}
            onClick={(event) => {
              // Following a link out of a peek is the end of the glance.
              if (peek && (event.target as Element).closest('a[href]')) setPeeking(false);
            }}
            className={cn(
              // --w-sidebar (240px), §7.9.
              'w-[var(--w-sidebar)] min-h-0 flex-col',
              // `flex` only while shown — a display utility would beat the
              // `hidden` attribute.
              (pinned || peek) && 'flex',
              pinned && [
                'col-start-1 row-span-2 row-start-1',
                // §4 elevation, inline panel: a background step plus a rule.
                'border-r border-border bg-surface',
              ],
              peek && [
                // Floats over main, below the top nav, so the toggle that
                // summoned it stays visible and clickable to pin.
                'z-30 col-start-2 row-start-2 m-2 justify-self-start',
                // §4 elevation, overlay: raised surface, strong border, and
                // the overlay sheet, as Dialog. The 8px margin leaves the
                // sheet 4px clear of the window edge. §7.7: drawer radius.
                'rounded-lg border border-border-strong bg-surface-raised',
                'shadow-overlay',
                // On a raised ground --color-border is invisible in dark mode
                // (§3, failure log); dividers inside the peek take the strong
                // step. Overrides the --tui-* layer, as Dialog does.
                '[--tui-border:var(--tui-border-strong)]',
              ],
            )}
          >
            <div
              data-slot="app-shell-sidebar-header"
              className={cn(headerBand, sidebarGutter, 'gap-[var(--gap-inline)]')}
            >
              <div className="flex min-w-0 flex-1 items-center">{sidebarHeader}</div>
              <IconButton
                ref={headerToggleRef}
                aria-label="Toggle sidebar"
                aria-expanded={pinned}
                aria-controls={sidebarId}
                data-slot="app-shell-sidebar-header-toggle"
                // In a peek this pins; pinned it collapses.
                onClick={() => setPinned(!pinned)}
              >
                <SidebarSimpleIcon />
              </IconButton>
            </div>
            <div
              data-slot="app-shell-sidebar-body"
              className={cn('min-h-0 flex-1 overflow-y-auto', regionInsetY, sidebarGutter)}
            >
              {sidebar}
            </div>
            {sidebarFooter != null ? (
              <div data-slot="app-shell-sidebar-footer" className={cn(footerBand, sidebarGutter)}>
                {sidebarFooter}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </AppShellContext.Provider>
  );
}

export type AppShellSidebarToggleProps = Omit<
  React.ComponentProps<typeof IconButton>,
  'aria-label' | 'children' | 'onClick' | 'onPointerEnter' | 'onPointerMove' | 'onPointerLeave'
> & {
  'aria-label'?: string;
};

/**
 * The top-nav sidebar toggle. Place it first in `AppBar`'s `brand` slot.
 *
 * Renders only while the sidebar is collapsed — pinned, the sidebar's own
 * header carries the toggle. Click pins. Mouse hover peeks.
 *
 * One stable name, "Toggle sidebar", with the pinned state in
 * `aria-expanded` — a name that flips between "Open" and "Close" is
 * announced as a different control each time. Peek does not change it:
 * peek is a pointer preview, not a state assistive technology acts on.
 */
function AppShellSidebarToggle({ 'aria-label': ariaLabel = 'Toggle sidebar', ...props }: AppShellSidebarToggleProps) {
  const ctx = useContext(AppShellContext);
  if (!ctx) return null;
  // Destructured first: passing a context member as a ref makes React
  // Compiler treat the whole object as a ref, and every other read of it
  // fails react-hooks/refs.
  const {
    hasSidebar,
    sidebarOpen,
    sidebarId,
    toggleSidebar,
    registerToggle,
    onTogglePointerEnter,
    onTogglePointerMove,
    onTogglePointerLeave,
  } = ctx;
  if (!hasSidebar || sidebarOpen) return null;
  return (
    <IconButton
      ref={registerToggle}
      aria-label={ariaLabel}
      aria-expanded={false}
      aria-controls={sidebarId}
      data-slot="app-shell-sidebar-toggle"
      onClick={toggleSidebar}
      onPointerEnter={onTogglePointerEnter}
      onPointerMove={onTogglePointerMove}
      onPointerLeave={onTogglePointerLeave}
      // The peek would otherwise show IconButton's tooltip on top of itself.
      tooltip={false}
      {...props}
    >
      <SidebarSimpleIcon />
    </IconButton>
  );
}

export type AppShellPanelHeaderProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  /** Panel title — "Chat". Rendered as a heading. */
  title: React.ReactNode;
  /** Trailing controls — new thread, history, close. */
  actions?: React.ReactNode;
};

/**
 * The panel's header band. Same height as the top nav and sidebar header,
 * so the three rules line up across the shell.
 */
function AppShellPanelHeader({ title, actions, className, ...props }: AppShellPanelHeaderProps) {
  return (
    <div
      data-slot="app-shell-panel-header"
      // Page gutter, not --pad-panel: the panel is a shell column, and its
      // edges line up with the top nav's actions above it.
      className={cn(headerBand, 'gap-[var(--gap-inline)] px-[var(--pad-page-x)]', className)}
      {...props}
    >
      {/* min-h --h-control: the 32px child the band's 49px is built around. */}
      <h2 className="flex min-h-[var(--h-control)] min-w-0 flex-1 items-center text-base font-semibold text-text-primary">
        {/* Inner span for the ellipsis — see AppShellPageHeader. */}
        <span className="truncate">{title}</span>
      </h2>
      {actions ? <div className="flex shrink-0 items-center gap-[var(--gap-inline)]">{actions}</div> : null}
    </div>
  );
}

export type AppShellPageHeaderProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  /**
   * The page title — "Analysis". Rendered as the page's `<h1>`. A string,
   * because a title cut off at the band's edge repeats in a tooltip
   * (`TruncatedText`).
   */
  title: string;
  /** Trailing page-level controls — share, overflow menu. */
  actions?: React.ReactNode;
};

/**
 * The page's title band. Pass it to `AppShell`'s `pageHeader`.
 *
 * The same band as the panel header beside it — `headerBand`, 49px — and
 * placed by the shell directly under the top nav, so the two rules form one
 * line across main and panel. The title is §8.1's page-title tier
 * (--text-lg, 16/24) at 600 with --tracking-tight (§8.8): one step above the
 * 14px section headings, so a 13px screen has somewhere for the eye to
 * start. Its side gutter is main's (`mainGutter`, picked by the shell's
 * `contentWidth`: --pad-content-x, or the frame tier once main is wide), so
 * the title starts on the same x as the page body below it, centred column
 * included. The rule still spans main.
 *
 * Tabs stay in the page body, not here: they belong to the content they
 * switch, and a band holds one --h-control row.
 */
function AppShellPageHeader({ title, actions, className, ...props }: AppShellPageHeaderProps) {
  // Outside a shell (a story rendering the band alone), the default.
  const contentWidth = useContext(AppShellContext)?.contentWidth ?? 'contained';
  return (
    <div
      data-slot="app-shell-page-header"
      className={cn(headerBand, 'gap-[var(--gap-inline)]', mainGutter[contentWidth], className)}
      {...props}
    >
      {/* min-h --h-control: the 32px child the band's 49px is built around. */}
      {/*
        The ellipsis lives on an inner element: `text-overflow` applies to
        block containers only, so `truncate` on the flex <h1> itself clips
        with no ellipsis. TruncatedText adds the full title in a tooltip,
        below the title, only when it is cut off.
      */}
      <h1 className="flex min-h-[var(--h-control)] min-w-0 flex-1 items-center text-lg font-semibold tracking-[var(--tracking-tight)] text-text-primary">
        <TruncatedText side="bottom">{title}</TruncatedText>
      </h1>
      {actions ? <div className="flex shrink-0 items-center gap-[var(--gap-inline)]">{actions}</div> : null}
    </div>
  );
}

export type AppShellPanelBodyProps = React.ComponentProps<'div'>;

/** The panel's scrolling region — the chat thread. */
function AppShellPanelBody({ className, ...props }: AppShellPanelBodyProps) {
  return (
    <div
      data-slot="app-shell-panel-body"
      className={cn('min-h-0 flex-1 overflow-y-auto px-[var(--pad-page-x)]', regionInsetY, className)}
      {...props}
    />
  );
}

export type AppShellPanelFooterProps = React.ComponentProps<'div'>;

/** Pinned below the body — the chat composer. */
function AppShellPanelFooter({ className, ...props }: AppShellPanelFooterProps) {
  return (
    <div
      data-slot="app-shell-panel-footer"
      className={cn(footerBand, 'px-[var(--pad-page-x)]', className)}
      {...props}
    />
  );
}

export type AppShellNavProps = React.ComponentProps<'nav'>;

/**
 * Sidebar navigation. A `<nav>` landmark holding `AppShellNavItem`s directly,
 * or `AppShellNavGroup`s when the items need section labels.
 */
function AppShellNav({ 'aria-label': ariaLabel = 'Primary', className, children, ...props }: AppShellNavProps) {
  return (
    <nav
      data-slot="app-shell-nav"
      aria-label={ariaLabel}
      // --gap-nav-group (24px): 2.5× the in-group text rhythm, so groups
      // read as sections rather than one run of links (§7.4).
      className={cn('flex flex-col gap-[var(--gap-nav-group)]', className)}
      {...props}
    >
      {children}
    </nav>
  );
}

export type AppShellNavGroupProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  /** Section label. Omit for an unlabelled group. */
  label?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * A run of nav items, optionally under a section label. The label names the
 * list (`aria-labelledby`), so a screen reader announces "Workspace, list,
 * 4 items" rather than reading the label as stray text.
 *
 * `role="list"` is explicit for the same reason as in `AppBarNav`: Safari
 * drops list semantics from a `list-style: none` list.
 */
function AppShellNavGroup({ label, className, children, ...props }: AppShellNavGroupProps) {
  const labelId = useId();
  return (
    <div data-slot="app-shell-nav-group" className={cn('flex flex-col gap-[var(--gap-bonded)]', className)} {...props}>
      {label ? (
        <div
          id={labelId}
          className={cn(
            // §8.1 micro-label tier, as popup group labels and MetricTile use —
            // but the secondary step, not tertiary. A section label is
            // navigation the user reads, and tertiary measured 3.78:1 on the
            // sidebar's --color-surface in dark mode (§3, §10).
            'text-2xs font-medium uppercase tracking-[var(--tracking-wide)] text-text-secondary',
            // Aligned with the item labels, not the item edges. Items are
            // `buttonVariants`, which carry a 1px transparent border inside
            // the padding; without the same border here the label sits 1px
            // short of every item's icon.
            'border-x border-transparent px-[var(--pad-sidebar-item)]',
          )}
        >
          {label}
        </div>
      ) : null}
      <ul role="list" aria-labelledby={label ? labelId : undefined} className="flex flex-col">
        {children}
      </ul>
    </div>
  );
}

type IconWeight = (typeof iconWeightForSize)[keyof typeof iconWeightForSize];

export type AppShellNavItemProps = React.ComponentProps<'a'> & {
  /** Marks the current page. Drives `aria-current` as well as the styling. */
  active?: boolean;
  /** A single Phosphor icon. Weight is set per §11.2 (`fill` when active, else `bold`) unless given explicitly. */
  icon?: ReactElement;
  /** Swap the `<a>` for a router link, as `AppBarNavItem` does. */
  render?: React.ReactElement<{ className?: string }>;
};

/**
 * One sidebar link. A real `<a>` styled with `buttonVariants`, for the reason
 * `AppBarNavItem` documents: Base UI's `Button` would announce it as a button.
 *
 * Active is neutral, matching `AppBarNavItem` — `aria-current`, weight and
 * text step, no hue and no ground — plus the icon switching to `fill` (§11.2).
 * Survives grayscale.
 */
function AppShellNavItem({ className, active = false, icon, render, children, ...props }: AppShellNavItemProps) {
  const linkClassName = cn(
    buttonVariants({ variant: 'ghost' }),
    'w-full min-w-0 justify-start px-[var(--pad-sidebar-item)]',
    '[&_svg]:size-[var(--size-icon-md)]',
    'text-text-secondary hover:text-text-body',
    // Bracketed data-[active] — the shorthand compiles inside :where() and
    // loses to the base colour on source order.
    'data-[active]:font-semibold data-[active]:text-text-primary',
    className,
  );

  const linkProps = {
    'data-slot': 'app-shell-nav-item',
    'data-active': active ? '' : undefined,
    'aria-current': active ? ('page' as const) : undefined,
    ...props,
  };

  // §11.2, in its order: the state treatment wins outright — active nav is
  // `fill`, a shape change that survives grayscale — then the size band, where
  // a 16px icon takes `bold` (the mapping IconButton applies).
  const glyph =
    isValidElement<{ weight?: IconWeight | 'fill' }>(icon) && icon.props.weight === undefined
      ? cloneElement(icon, { weight: active ? 'fill' : iconWeightForSize.default })
      : icon;

  const content = (
    <>
      {glyph}
      <span className="min-w-0 truncate">{children}</span>
    </>
  );

  return (
    <li className="flex">
      {isValidElement(render) ? (
        cloneElement(render, { ...linkProps, className: cn(linkClassName, render.props.className) }, content)
      ) : (
        <a className={linkClassName} {...linkProps}>
          {content}
        </a>
      )}
    </li>
  );
}

export {
  AppShell,
  AppShellSidebarToggle,
  AppShellPageHeader,
  AppShellPanelHeader,
  AppShellPanelBody,
  AppShellPanelFooter,
  AppShellNav,
  AppShellNavGroup,
  AppShellNavItem,
};
