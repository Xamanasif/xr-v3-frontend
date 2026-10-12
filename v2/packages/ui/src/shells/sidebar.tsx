'use client';

import { LogoPlaceholder } from '../foundation/logo-placeholder.js';
import { joinClasses } from '../internal/classes.js';
import { DrawerCloseButton } from '../overlays/drawer.js';
import { MAX_DESTINATIONS, PRODUCT_NAME } from './limits.js';
import { NavItem, type NavDestination } from './nav-item.js';
import { useWorkspaceShell } from './workspace-shell.js';

/** Help, always the last item, in `div.xr-side-foot` (board 06; WCAG 3.2.6). */
export interface SidebarHelp {
  /** The Help & support page of this workspace. */
  readonly href: string;
  /** On the Help pages Help is the current item (board 05 `helpCurrent`, board 07). */
  readonly current?: boolean;
}

export interface SidebarProps {
  /**
   * The workspace label, gold capitals in `span.xr-ws-label` ("Institute Admin"). It also names
   * the landmarks: `aside` "<workspace> workspace" > `nav` "<workspace> navigation".
   */
  readonly workspace: string;
  /**
   * The institution or organisation line under the label (`span.xr-ws-inst`) for the roles that
   * have one ("Godavari Institute of Technology", "Northline Simulation Studio"); none for the
   * platform roles (board 06).
   */
  readonly institution?: string;
  /**
   * The destinations in the order of the caller's navigation config (at most 8; only real
   * destinations, never disabled placeholders). At most one is current; none on message pages.
   */
  readonly destinations: readonly NavDestination[];
  /** Help, drawn last in `div.xr-side-foot`, separated by the hairline. */
  readonly help: SidebarHelp;
  /**
   * The standalone 72 px rail as board 06 "Rail · Institute Admin · tooltip on hover and focus"
   * draws it (`xr-side--rail`: the logo box only, no product name or workspace block). Inside a
   * WorkspaceShell the rail comes from the shell's width and preference instead; there this
   * throws, because the drawing has no "Close menu" for the drawer below 1024.
   */
  readonly rail?: boolean;
  /** Board context classes. */
  readonly className?: string;
}

function assertDestinations(destinations: readonly NavDestination[], help: SidebarHelp): void {
  if (destinations.length > MAX_DESTINATIONS) {
    throw new RangeError(
      `A sidebar holds at most ${MAX_DESTINATIONS} destinations plus Help (board 06 "Navigation rules"); got ${destinations.length}.`,
    );
  }
  const current = destinations.filter((destination) => destination.current).length;
  if (current + (help.current ? 1 : 0) > 1) {
    throw new RangeError('At most one sidebar item is current (Appendix E §4.2).');
  }
}

/**
 * The workspace sidebar (Appendix E §3.5 "Sidebar + NavItem"; boards 05, 06, B1-10): the logo
 * placeholder and product name, the workspace label and institution line, the destinations
 * (`nav` > `ul.xr-nav`) and Help last in `div.xr-side-foot`. Role identity comes from the label,
 * the destinations and the content, never from a theme (board 06).
 *
 * Inside a WorkspaceShell it also carries "Close menu" beside the logo (board 05; shown only in
 * the drawer, below 1024) and closes the drawer when a destination is chosen. The full sidebar,
 * the rail and the drawer are the same markup; the v46 CSS and the shell's classes decide which
 * one shows. The gold focus ring on navy is PF-07 (product.css).
 */
export function Sidebar({
  workspace,
  institution,
  destinations,
  help,
  rail = false,
  className,
}: SidebarProps) {
  assertDestinations(destinations, help);
  const shell = useWorkspaceShell();
  if (rail && shell) {
    // The standalone rail drawing has no "Close menu", so the drawer below 1024 would open with
    // nowhere to put focus. Inside a shell the rail comes from its width and preference.
    throw new Error(
      'Sidebar `rail` is the standalone board-06 rail; inside a WorkspaceShell leave it off.',
    );
  }
  return (
    <aside
      className={joinClasses('xr-side', rail && 'xr-side--rail', className)}
      aria-label={`${workspace} workspace`}
      onClick={shell?.drawer.sideProps.onClick}
    >
      <div className="xr-side-head">
        {rail ? (
          <LogoPlaceholder />
        ) : (
          <>
            <div className="xr-side-top">
              <LogoPlaceholder />
              {shell ? <DrawerCloseButton {...shell.drawer.closeButtonProps} /> : null}
            </div>
            <span className="xr-product">{PRODUCT_NAME}</span>
          </>
        )}
      </div>
      {rail ? null : (
        <div className="xr-ws">
          <span className="xr-ws-label">{workspace}</span>
          {institution ? <span className="xr-ws-inst">{institution}</span> : null}
        </div>
      )}
      <nav aria-label={`${workspace} navigation`}>
        <ul className="xr-nav">
          {destinations.map((destination, index) => (
            <NavItem key={`${index}-${destination.href}`} {...destination} />
          ))}
        </ul>
      </nav>
      <div className="xr-side-foot">
        <ul className="xr-nav">
          <NavItem label="Help" href={help.href} icon="help" current={help.current} />
        </ul>
      </div>
    </aside>
  );
}
