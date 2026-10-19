'use client';

import { useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';

import { useDrawer } from '../overlays/drawer.js';
import { useLinkComponent } from '../link.js';
import { Icon, type V3IconName } from './icons.js';

/** The product name in the rail and the drawer head. */
export const PRODUCT_NAME = 'XR Learning Platform';

/**
 * The reserved logo slot's words, as the Refined B boards draw them. The official WILP image is
 * pending (owner decision 10): the slot is kept and no crest is drawn.
 */
export const V3_LOGO_SLOT_TEXT = 'Official WILP logo';

/** The thin rule between the page and the date in the top line (`span.rb-top-sep`; IA-01). */
export function TopLineSeparator() {
  return <span className="rb-top-sep" aria-hidden="true" />;
}

export interface ShellDestination {
  readonly label: string;
  readonly href: string;
  readonly icon: V3IconName;
  readonly current?: boolean;
  /**
   * The count beside a destination (`span.rb-count`, gold): the figure is decorative and the
   * words say what it counts (", 3 requests under review").
   */
  readonly count?: { readonly value: number | string; readonly label: string };
}

export interface ShellHelp {
  readonly href: string;
  readonly current?: boolean;
  /** "Help & support". */
  readonly label?: string;
}

export interface WorkspaceShellProps {
  /** The workspace role: "Super Admin" (`span.rb-ws-role`; names the rail and its navigation). */
  readonly workspace: string;
  /** The institution line, where the role has one (`span.rb-ws-inst`). */
  readonly institution?: string;
  /** The sidebar destinations, in order — the same model the v46 sidebar takes. */
  readonly destinations: readonly ShellDestination[];
  readonly help: ShellHelp;
  /**
   * The top bar's line (`p.rb-top-date`): the date, from the application's clock — or "Overview ·
   * date" as IA-01 draws it. Hidden on phones, where the page head shows the date.
   */
  readonly topLine?: ReactNode;
  /** The account chrome: `AccountMenu` (XS-05; shell patch XS-P3). */
  readonly account: ReactNode;
  /**
   * The XS-08 banner (`Banner`: paused institution, inactive account), the first thing in the page
   * column as the XS export and the IA-02 seed place it.
   */
  readonly banner?: ReactNode;
  /** The main region's id: the skip link's target. */
  readonly mainId?: string;
  readonly children?: ReactNode;
}

const DRAWER_TAB_STOPS = 'a[href], button:not([disabled])';

function NavLinks({
  destinations,
  withIcons,
}: {
  readonly destinations: readonly ShellDestination[];
  readonly withIcons: boolean;
}) {
  const Link = useLinkComponent();
  if (destinations.filter((destination) => destination.current).length > 1) {
    throw new Error('WorkspaceShell: at most one destination is current.');
  }
  return destinations.map((destination) => (
    <Link
      key={destination.label}
      href={destination.href}
      aria-current={destination.current ? 'page' : undefined}
    >
      {withIcons ? <Icon name={destination.icon} /> : null}
      <span>{destination.label}</span>
      {destination.count ? (
        <span className="rb-count">
          <span aria-hidden="true">{destination.count.value}</span>
          <span className="xr-sr">, {destination.count.label}</span>
        </span>
      ) : null}
    </Link>
  ));
}

function Brand({
  workspace,
  institution,
  product,
}: {
  readonly workspace: string;
  readonly institution?: string;
  readonly product: boolean;
}) {
  return (
    <div className="rb-brand">
      <div className="rb-logo">{V3_LOGO_SLOT_TEXT}</div>
      {product ? <p className="rb-product">{PRODUCT_NAME}</p> : null}
      <p className="rb-ws">
        <span className="rb-ws-role">{workspace}</span>
        {institution ? <span className="rb-ws-inst">{institution}</span> : null}
      </p>
    </div>
  );
}

/**
 * "Skip to main content" (`a.xs-skip`, the XS export's shell patch XS-P1): the first Tab stop,
 * shown when it has focus (WCAG 2.4.1). Activating it moves focus into the main region.
 */
function SkipLink({
  targetId,
  inert,
}: {
  readonly targetId: string;
  readonly inert: boolean | undefined;
}) {
  const Link = useLinkComponent();
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = event.currentTarget.ownerDocument.getElementById(targetId);
    if (!target?.hasAttribute('tabindex')) return;
    event.preventDefault();
    target.focus();
  };
  return (
    <Link className="xs-skip" href={`#${targetId}`} onClick={onClick} inert={inert}>
      Skip to main content
    </Link>
  );
}

/**
 * The Refined B workspace shell (`div.xr.rb`; rb.css): the 248 px navy rail with the reserved logo
 * slot, the workspace and its destinations, Help in the rail foot; the top row with the date and
 * the account chrome; the page. Below 1024 px of app width the rail becomes "Menu" and a drawer:
 * opening it moves focus to "Close menu", Tab stays inside it, Esc / the scrim / "Close menu"
 * close it and return focus to "Menu", the page behind is inert, and if the window grows past
 * 1024 px it closes and focus moves to the rail's current destination (the shared `useDrawer`).
 * The element is the V3 root: every V3 style applies inside it and nowhere else.
 */
export function WorkspaceShell({
  workspace,
  institution,
  destinations,
  help,
  topLine,
  account,
  banner,
  mainId = 'main',
  children,
}: WorkspaceShellProps) {
  const Link = useLinkComponent();
  const railRef = useRef<HTMLElement>(null);
  const drawer = useDrawer({ persistentNavigation: () => railRef.current });
  const helpLabel = help.label ?? 'Help & support';
  const helpLink = (withIcon: boolean) => (
    <nav className="rb-nav" aria-label="Help">
      <Link href={help.href} aria-current={help.current ? 'page' : undefined}>
        {withIcon ? <Icon name="help" /> : null}
        <span>{helpLabel}</span>
      </Link>
    </nav>
  );

  // Tab stays inside the open drawer (the page behind is inert as well).
  const onDrawerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const stops = [...event.currentTarget.querySelectorAll<HTMLElement>(DRAWER_TAB_STOPS)];
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (!first || !last) return;
    const active = event.currentTarget.ownerDocument.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="xr rb">
      <SkipLink targetId={mainId} inert={drawer.backgroundProps.inert} />
      <aside ref={railRef} className="rb-rail" aria-label={`${workspace} workspace`}>
        <Brand workspace={workspace} institution={institution} product />
        {destinations.length > 0 ? (
          <nav className="rb-nav" aria-label={`${workspace} navigation`}>
            <NavLinks destinations={destinations} withIcons />
          </nav>
        ) : null}
        <div className="rb-rail-foot">{helpLink(true)}</div>
      </aside>
      <div className="rb-main" inert={drawer.backgroundProps.inert}>
        <header className="rb-top">
          <button
            ref={drawer.menuButtonProps.ref}
            type="button"
            className="rb-menu"
            aria-expanded={drawer.open}
            onClick={drawer.openDrawer}
          >
            <Icon name="menu" />
            Menu
          </button>
          {topLine ? <p className="rb-top-date">{topLine}</p> : null}
          {account}
        </header>
        <main className="rb-page xs-nofocus" id={mainId} tabIndex={-1}>
          {banner}
          {children}
        </main>
      </div>
      {drawer.open ? (
        <>
          <div
            ref={drawer.scrimProps.ref}
            className="rb-scrim"
            aria-hidden="true"
            onClick={() => drawer.closeDrawer()}
          />
          <div
            className="rb-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            onKeyDown={onDrawerKeyDown}
            onClick={drawer.sideProps.onClick}
          >
            <div className="rb-drawer-head">
              <p className="rb-product">{PRODUCT_NAME}</p>
              <button
                ref={drawer.closeButtonProps.ref}
                type="button"
                className="rb-close"
                aria-label="Close menu"
                onClick={() => drawer.closeDrawer()}
              >
                <Icon name="close" />
              </button>
            </div>
            <Brand workspace={workspace} institution={institution} product={false} />
            {destinations.length > 0 ? (
              <nav className="rb-nav" aria-label={`${workspace} navigation`}>
                <NavLinks destinations={destinations} withIcons={false} />
              </nav>
            ) : null}
            <div className="rb-rail-foot">{helpLink(false)}</div>
          </div>
        </>
      ) : null}
    </div>
  );
}
