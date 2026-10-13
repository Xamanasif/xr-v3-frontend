'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { SkipLink } from '../foundation/skip-link.js';
import { joinClasses } from '../internal/classes.js';
import { DrawerScrim, useDrawer, type DrawerController } from '../overlays/drawer.js';
import { V46_CONTAINER_THRESHOLDS } from '../tokens/v46-constants.js';

/**
 * The person's sidebar choice from 1024 px of app width (board 06 "Behaviour": "The expand /
 * collapse choice is remembered per person"; VD-20: kept in memory by the caller, never stored
 * here):
 * - `auto` — the board default: the 72 px rail at 1024–1279, the full 248 px sidebar from 1280;
 * - `expanded` — the full sidebar at both widths (`.xr-shell.is-expanded`);
 * - `rail` — the rail at both widths (`.xr-shell.is-rail`).
 */
export type SidebarPreference = 'auto' | 'expanded' | 'rail';

/** What the sidebar is at an app width: drawer below 1024, rail band 1024–1279, full from 1280. */
export type ShellBand = 'drawer' | 'rail' | 'full';

/**
 * The page width inside `main.xr-page` (Appendix E §3.5): `wide` = `div.xr-wrap` (1160; board 11,
 * B1-10), `read` = `div.xr-wrap--read` (1040; boards 05, 07 lists and details), `form` =
 * `div.xr-wrap--form` (720; board 07 "Report a problem"), each with `xr-content` (the `xr-content`
 * container); `none` = the content straight in `main` (board 07 "State 1c · Sent · reference").
 */
export type PageWrap = 'wide' | 'read' | 'form' | 'none';

const WRAP_CLASS: Readonly<Record<Exclude<PageWrap, 'none'>, string>> = {
  wide: 'xr-wrap',
  read: 'xr-wrap--read',
  form: 'xr-wrap--form',
};

/**
 * The page width wrapper (`div.xr-wrap… .xr-content`), for a page that sits in a shell rendered
 * with `wrap="none"` — a shell that stays mounted while its pages change (the workspace layouts
 * of apps/web, WP-0.13), so each page chooses its own width (board 07: `read` for My reports and
 * the detail, `form` for the form, none for the sent confirmation).
 */
export function PageContent({
  wrap,
  children,
}: {
  readonly wrap: Exclude<PageWrap, 'none'>;
  readonly children?: ReactNode;
}) {
  return <div className={joinClasses(WRAP_CLASS[wrap], 'xr-content')}>{children}</div>;
}

/** The band at an app width, with the v46 container thresholds (`xr-app`, Appendix E §6.1). */
export function shellBandFor(appWidth: number): ShellBand {
  if (appWidth < V46_CONTAINER_THRESHOLDS.sidebar.px) return 'drawer';
  if (appWidth < V46_CONTAINER_THRESHOLDS.fullSidebar.px) return 'rail';
  return 'full';
}

/**
 * Whether the sidebar is wide (248 px) at a band under a preference. Below 1024 it is a drawer and
 * never "wide" (the collapse control is not displayed there).
 */
export function sidebarWideAt(band: ShellBand, preference: SidebarPreference): boolean {
  if (band === 'full') return preference !== 'rail';
  if (band === 'rail') return preference === 'expanded';
  return false;
}

/** What the shell gives the Sidebar and TopBar it holds (they read it with `useWorkspaceShell`). */
export interface WorkspaceShellContextValue {
  /** The drawer below 1024 (overlays/drawer.tsx): Menu, Close menu, scrim, inert background. */
  readonly drawer: DrawerController;
  /** The sidebar is 248 px wide now: drives "Collapse menu" / "Expand menu" and `aria-expanded`. */
  readonly sidebarWide: boolean;
  /** The top-bar collapse toggle: narrows a wide sidebar to the rail, or widens the rail. */
  readonly toggleSidebar: () => void;
}

const WorkspaceShellContext = createContext<WorkspaceShellContextValue | null>(null);

/** The enclosing WorkspaceShell's drawer and sidebar state, or `null` outside a shell. */
export function useWorkspaceShell(): WorkspaceShellContextValue | null {
  return useContext(WorkspaceShellContext);
}

export interface WorkspaceShellProps {
  /** The sidebar slot: a `Sidebar` (it picks up "Close menu" and the drawer from the shell). */
  readonly sidebar: ReactNode;
  /** The top-bar slot: a `TopBar` (it picks up Menu and the collapse toggle from the shell). */
  readonly topBar: ReactNode;
  /**
   * The XS-08 banner slot under the top bar: a `ShellBanner` when the institution is paused or the
   * account is inactive (board 05). It comes after the account menu in the tab order (board 12).
   */
  readonly banner?: ReactNode;
  /** The page width inside `main` (default `wide`). */
  readonly wrap?: PageWrap;
  /** The id of `main`, the skip link's target (default `main`, as board 05 draws it). */
  readonly mainId?: string;
  /** The sidebar choice, controlled by the caller (VD-20: in memory; no storage here). */
  readonly sidebarPreference?: SidebarPreference;
  /** The starting choice when the shell keeps it itself (uncontrolled; default `auto`). */
  readonly defaultSidebarPreference?: SidebarPreference;
  /** Called with the new choice when the person presses "Collapse menu" / "Expand menu". */
  readonly onSidebarPreferenceChange?: (preference: SidebarPreference) => void;
  /** The page content. */
  readonly children?: ReactNode;
}

/**
 * The workspace shell (GL-01; Appendix E §3.5; boards 05, 06, 11, 12): `div.xr-app` (the `xr-app`
 * container) > `a.xr-skip` + `div.xr-shell` > [sidebar + `div.xr-scrim` + `div.xr-main` > (top
 * bar + banner + `main.xr-page#main` > `div.xr-wrap… .xr-content`)].
 *
 * - Below 1024 px of app width the sidebar is the drawer (useDrawer): "Menu" opens it and focus
 *   moves to "Close menu"; Esc, the scrim or "Close menu" close it and focus returns to "Menu";
 *   choosing a destination closes it; the skip link and `div.xr-main` are inert while it is open;
 *   when the app grows to 1024 px or more it closes (nothing stays inert) and focus on the now
 *   hidden "Close menu" moves to the sidebar's current destination.
 * - 1024–1279 the sidebar is the 72 px rail, widened by "Expand menu" (`is-expanded`); from 1280
 *   it is 248 px, narrowed by "Collapse menu" (`is-rail`). The shell measures its own width (the
 *   `xr-app` container, first before paint) to name the toggle; the CSS does the layout.
 * - `main` takes `tabIndex={-1}` so the skip link can move focus into it (VD-16, PROVISIONAL).
 *
 * No role configuration, routes or persistence: the slots come from the caller (WP-0.8).
 */
export function WorkspaceShell({
  sidebar,
  topBar,
  banner,
  wrap = 'wide',
  mainId = 'main',
  sidebarPreference,
  defaultSidebarPreference = 'auto',
  onSidebarPreferenceChange,
  children,
}: WorkspaceShellProps) {
  const drawer = useDrawer();
  const { open: drawerOpen, closeDrawer } = drawer;
  const appRef = useRef<HTMLDivElement>(null);
  // `null` until the shell has measured itself. Until then (server render, no layout, no
  // ResizeObserver) the toggle is named for the board default, 1440.
  const [measuredBand, setMeasuredBand] = useState<ShellBand | null>(null);
  const band = measuredBand ?? 'full';
  const [ownPreference, setOwnPreference] = useState<SidebarPreference>(defaultSidebarPreference);
  const preference = sidebarPreference ?? ownPreference;
  const sidebarWide = sidebarWideAt(band, preference);

  // The thresholds are the `xr-app` container's (its content box; `.xr-app` has no padding or
  // border), as board 05 measures them. The first measurement is taken before paint, so after
  // hydration at 1024–1279 the toggle never shows "Collapse menu" for a frame; a zero width (no
  // layout) is not a measurement.
  useLayoutEffect(() => {
    const app = appRef.current;
    if (!app) return undefined;
    const width = app.getBoundingClientRect().width;
    if (width > 0) setMeasuredBand(shellBandFor(width));
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) setMeasuredBand(shellBandFor(entry.contentRect.width));
    });
    observer.observe(app);
    return () => observer.disconnect();
  }, []);

  // From 1024 px of app width the sidebar is no longer a drawer (the v46 CSS hides the scrim,
  // Menu and "Close menu"), so an open drawer closes and nothing stays inert, also when the app
  // grows without a window resize. Focus is not pulled back to the hidden Menu; focus left on the
  // hidden "Close menu" (where opening put it), or dropped to the page, moves to the now
  // persistent sidebar's current destination (else its first one). Focus on a sidebar control
  // that is still rendered stays where it is.
  useEffect(() => {
    if (drawerOpen && measuredBand !== null && measuredBand !== 'drawer') {
      closeDrawer({ returnFocus: 'sidebar' });
    }
  }, [drawerOpen, measuredBand, closeDrawer]);

  // The skip link is behind the open drawer too (useDrawer `backgroundProps`). SkipLink takes no
  // attributes, so its `inert` is set on the element itself.
  useEffect(() => {
    const skip = appRef.current?.firstElementChild;
    if (skip instanceof HTMLElement && skip.classList.contains('xr-skip')) {
      skip.toggleAttribute('inert', drawerOpen);
    }
  }, [drawerOpen]);

  const toggleSidebar = useCallback(() => {
    const next: SidebarPreference = sidebarWide ? 'rail' : 'expanded';
    if (sidebarPreference === undefined) setOwnPreference(next);
    onSidebarPreferenceChange?.(next);
  }, [sidebarWide, sidebarPreference, onSidebarPreferenceChange]);

  const context: WorkspaceShellContextValue = { drawer, sidebarWide, toggleSidebar };

  return (
    <WorkspaceShellContext value={context}>
      <div ref={appRef} className="xr-app">
        <SkipLink targetId={mainId} />
        <div
          className={joinClasses(
            'xr-shell',
            preference === 'expanded' && 'is-expanded',
            preference === 'rail' && 'is-rail',
            drawer.shellClassName,
          )}
        >
          {sidebar}
          <DrawerScrim {...drawer.scrimProps} />
          <div className="xr-main" {...drawer.backgroundProps}>
            {topBar}
            {banner}
            <main className="xr-page" id={mainId} tabIndex={-1}>
              {wrap === 'none' ? children : <PageContent wrap={wrap}>{children}</PageContent>}
            </main>
          </div>
        </div>
      </div>
    </WorkspaceShellContext>
  );
}
