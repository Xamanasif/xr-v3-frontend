'use client';

import type { ReactNode } from 'react';

import { Breadcrumbs, type BreadcrumbLevel } from '../foundation/breadcrumbs.js';
import { Icon } from '../foundation/icon.js';
import { DrawerMenuButton, type DrawerMenuButtonProps } from '../overlays/drawer.js';
import { useWorkspaceShell } from './workspace-shell.js';

/** The rail toggle's state and press, when the TopBar is used outside a WorkspaceShell. */
export interface TopBarCollapse {
  /** The sidebar is wide (248 px): the control reads "Collapse menu", `aria-expanded="true"`. */
  readonly expanded: boolean;
  readonly onToggle: () => void;
}

export interface TopBarProps {
  /**
   * The page title (`span.xr-top-title`), shown below 1024 px of app width on the navy bar. The
   * same words as the page's H1 or its record id ("Help & support", "SUP-0198").
   */
  readonly title: string;
  /**
   * The levels above the current page, outermost first (board 07 "Help & support" above a report;
   * B2-05 "Student access" above "Give students access"). Empty on a destination's own page: the
   * crumbs then show the page name alone (boards 05, 07, B1-10). Shown from 1024 px.
   */
  readonly trail?: readonly BreadcrumbLevel[];
  /** The current crumb when it differs from the title (board 11 "People › Students"). */
  readonly current?: string;
  /** The account menu (`AccountMenu`, `div.xr-acct`), always last. */
  readonly account: ReactNode;
  /** Menu button wiring outside a WorkspaceShell (the shell supplies it otherwise). */
  readonly menuButton?: DrawerMenuButtonProps;
  /** Rail toggle outside a WorkspaceShell; without it (and without a shell) none is drawn. */
  readonly collapse?: TopBarCollapse;
}

function CollapseButton({ expanded, onToggle }: TopBarCollapse) {
  return (
    <button
      type="button"
      className="xr-icon-btn xr-top-collapse"
      aria-label={expanded ? 'Collapse menu' : 'Expand menu'}
      aria-expanded={expanded}
      onClick={() => onToggle()}
    >
      <Icon name={expanded ? 'collapseMenu' : 'expandMenu'} />
    </button>
  );
}

/**
 * The workspace top bar (Appendix E §3.5 TopBar; boards 05, 11, B1-10, B2-05): `header.xr-top` >
 * Menu (below 1024: visible "Menu", named "Open menu") + the rail toggle `xr-top-collapse` (from
 * 1024: "Collapse menu" / "Expand menu", `aria-expanded`) + `div.xr-top-loc` (the title below
 * 1024, the breadcrumbs `ol.xr-crumbs` from 1024) + the account menu. It always keeps the title
 * or the breadcrumbs and the account menu (board 06 "Behaviour"); the v46 CSS switches them by
 * the `xr-app` width. Inside a WorkspaceShell, Menu and the toggle are wired by the shell.
 */
export function TopBar({ title, trail = [], current, account, menuButton, collapse }: TopBarProps) {
  const shell = useWorkspaceShell();
  const menu = menuButton ?? shell?.drawer.menuButtonProps;
  if (!menu) {
    throw new Error('TopBar needs a WorkspaceShell around it, or its menuButton prop.');
  }
  const toggle =
    collapse ??
    (shell ? { expanded: shell.sidebarWide, onToggle: shell.toggleSidebar } : undefined);
  return (
    <header className="xr-top">
      <DrawerMenuButton {...menu} />
      {toggle ? <CollapseButton {...toggle} /> : null}
      <div className="xr-top-loc">
        <span className="xr-top-title">{title}</span>
        <Breadcrumbs trail={trail} current={current ?? title} />
      </div>
      {account}
    </header>
  );
}
