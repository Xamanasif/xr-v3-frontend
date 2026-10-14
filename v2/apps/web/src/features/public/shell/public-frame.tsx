'use client';

import { Icon, Link, LogoPlaceholder, SkipLink } from '@xr/ui';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { PUBLIC_SHELL } from '@/copy/public';
import { selectionLinkName } from '@/copy/request-access';
import {
  PUBLIC_FOOTER_LINKS,
  PUBLIC_MAIN_NAV,
  PUBLIC_REQUEST_ACCESS,
  PUBLIC_SELECTION_LINK,
  PUBLIC_SIGN_IN,
  publicPlaceOf,
} from '@/nav/public-nav';
import { useSelection } from '@/queries/selection';

import { useRouteFocus } from '../../shared/workspace-frame/route-focus';

/** The id of the menu sheet the Menu button controls (B1-01 `aria-controls`). */
const SHEET_ID = 'public-menu';

/**
 * Marks every child of the public root except `keep` inert while an overlay is open (the menu
 * sheet keeps the header; the filter sheet keeps itself), as the workspace drawer does (PF-03):
 * what the scrim covers cannot be reached by Tab, pointer or a screen reader's browse mode.
 */
export function useInertSiblings(
  root: HTMLElement | null,
  open: boolean,
  keep: () => Element | null,
): void {
  useEffect(() => {
    const node = root;
    if (!open || !node) return;
    const kept = keep();
    const changed: Element[] = [];
    for (const child of node.children) {
      if (child === kept || child.contains(kept) || child.hasAttribute('inert')) continue;
      child.setAttribute('inert', '');
      changed.push(child);
    }
    return () => {
      for (const child of changed) child.removeAttribute('inert');
    };
  }, [root, open, keep]);
}

/** The public root element, for overlays that render into it (the catalogue's filter sheet). */
const PublicRootContext = createContext<HTMLDivElement | null>(null);

/** The public root once it is mounted (`null` before, and outside the public frame). */
export function usePublicRoot(): HTMLDivElement | null {
  return useContext(PublicRootContext);
}

/**
 * The public shell (Appendix E §3.5 PublicShell; B1-01 … B1-05; Phase-1 Package 1B): `div.xp` >
 * skip link (VD-16), `header.xp-head` (brand, `nav` Main, Sign in, Menu + sheet), the page's own
 * `main#main`, `footer.xp-foot`. Destinations render only when their page is built (P0-35;
 * `nav/public-nav.ts`): since Package 1C that includes "Selection (n)" — the count of experiments in
 * this browser session's selection — and "Request access", both to PU-07 (HB-02: the board sends
 * "Request access" to the selection, step 1 of the request). After a client-side move, focus goes
 * to the page's `main` (or the `#for-institutions` section, or a flow's own result heading).
 */
export function PublicFrame({
  pathname,
  children,
}: {
  readonly pathname: string;
  readonly children?: ReactNode;
}) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  useRouteFocus(pathname);
  return (
    <PublicRootContext value={root}>
      <div className="xp" ref={setRoot}>
        <SkipLink />
        <PublicHeader pathname={pathname} root={root} />
        {children}
        <PublicFooter />
      </div>
    </PublicRootContext>
  );
}

function PublicHeader({
  pathname,
  root,
}: {
  readonly pathname: string;
  readonly root: HTMLDivElement | null;
}) {
  const place = publicPlaceOf(pathname);
  const { selection } = useSelection();
  const count = selection.items.length;
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement | null>(null);
  const menuButton = useRef<HTMLButtonElement | null>(null);
  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) menuButton.current?.focus();
  }, []);

  // Another page: the sheet closes (choosing a destination moves focus to the page, route focus).
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setOpen(false);
  }

  // Esc closes and returns focus to Menu (Appendix E §3.4, as the workspace drawer).
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  // The sheet exists below 1024 px of the public root only (the Menu button's width). Focus left
  // on Menu or in the sheet would be hidden with them, so it moves to the page's main region —
  // once the sheet has closed and the page is no longer inert.
  const focusMainOnClose = useRef(false);
  useEffect(() => {
    if (open || !focusMainOnClose.current) return;
    focusMainOnClose.current = false;
    focusMain();
  }, [open]);
  useEffect(() => {
    const node = root;
    if (!open || !node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry || entry.contentRect.width < 1024) return;
      const active = document.activeElement;
      focusMainOnClose.current =
        active !== null &&
        (active === menuButton.current ||
          Boolean(document.getElementById(SHEET_ID)?.contains(active)));
      close(false);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [open, root, close]);

  const keepHeader = useCallback(() => header.current, []);
  useInertSiblings(root, open, keepHeader);

  const current = (key: string) =>
    (key === 'browse' && place === 'browse') || (key === 'areas' && place === 'areas')
      ? 'page'
      : undefined;

  return (
    <header className="xp-head" ref={header}>
      <div className="xp-in xp-head-row">
        <Link className="xp-brand" href="/" aria-label={PUBLIC_SHELL.home}>
          <LogoPlaceholder placement="public" />
          <span className="xp-brand-sep" aria-hidden="true" />
          <span className="xp-brand-name">{PUBLIC_SHELL.brandName}</span>
        </Link>
        <nav aria-label={PUBLIC_SHELL.mainNav}>
          <ul className="xp-nav">
            {PUBLIC_MAIN_NAV.map((item) => (
              <li key={item.key}>
                <Link href={item.href} aria-current={current(item.key)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="xp-head-end">
          {PUBLIC_SELECTION_LINK ? (
            <Link
              className="xp-sel"
              href={PUBLIC_SELECTION_LINK.href}
              aria-label={selectionLinkName(count)}
              aria-current={place === 'selection' ? 'page' : undefined}
            >
              <Icon name="checklist" />
              <span className="xp-sel-label">{PUBLIC_SELECTION_LINK.label}</span>
              <span className={count > 0 ? 'xp-sel-n' : 'xp-sel-n is-zero'} aria-hidden="true">
                {count}
              </span>
            </Link>
          ) : null}
          <Link className="xp-signin" href={PUBLIC_SIGN_IN.href}>
            {PUBLIC_SIGN_IN.label}
          </Link>
          {PUBLIC_REQUEST_ACCESS ? (
            <Link className="xr-btn xr-btn--on-dark xp-access" href={PUBLIC_REQUEST_ACCESS.href}>
              {PUBLIC_REQUEST_ACCESS.label}
            </Link>
          ) : null}
          <button
            ref={menuButton}
            type="button"
            className="xp-menu-btn"
            aria-expanded={open}
            aria-controls={SHEET_ID}
            onClick={() => setOpen((shown) => !shown)}
          >
            <Icon name={open ? 'close' : 'menu'} />
            <span>{open ? PUBLIC_SHELL.close : PUBLIC_SHELL.menu}</span>
          </button>
        </div>
      </div>
      {open ? <div className="xp-scrim" aria-hidden="true" onClick={() => close(true)} /> : null}
      <div className="xp-sheet" id={SHEET_ID} hidden={!open}>
        <div className="xp-in">
          <nav aria-label={PUBLIC_SHELL.mainNav}>
            <ul className="xp-sheet-list">
              {PUBLIC_MAIN_NAV.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={current(item.key)}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                    <Icon name="chevronRight" />
                  </Link>
                </li>
              ))}
              {PUBLIC_SELECTION_LINK ? (
                <li>
                  <Link
                    href={PUBLIC_SELECTION_LINK.href}
                    aria-current={place === 'selection' ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <span>
                      {PUBLIC_SELECTION_LINK.label}{' '}
                      <span className={count > 0 ? 'xp-sel-n ml-2' : 'xp-sel-n is-zero ml-2'}>
                        {count}
                      </span>
                    </span>
                    <Icon name="chevronRight" />
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>
          <div className="xp-sheet-actions">
            <Link
              className="xr-btn xr-btn--on-dark"
              href={PUBLIC_SIGN_IN.href}
              onClick={() => setOpen(false)}
            >
              {PUBLIC_SIGN_IN.label}
            </Link>
            {PUBLIC_REQUEST_ACCESS ? (
              <Link
                className="xr-btn xr-btn--primary"
                href={PUBLIC_REQUEST_ACCESS.href}
                onClick={() => setOpen(false)}
              >
                {PUBLIC_REQUEST_ACCESS.label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="xp-foot">
      <div className="xp-in xp-foot-row">
        <div className="xp-foot-brand">
          <LogoPlaceholder placement="public" />
          <span>{PUBLIC_SHELL.brandName}</span>
        </div>
        <nav aria-label={PUBLIC_SHELL.footerNav}>
          <ul className="xp-foot-links">
            {PUBLIC_FOOTER_LINKS.map((item) => (
              <li key={item.key}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

/** Focus the page's main region (a sheet closed by widening the page leaves its controls hidden). */
export function focusMain(): void {
  document.getElementById('main')?.focus({ preventScroll: true });
}

/** The page's main landmark, the skip link's and route focus's target (`main#main`, tabIndex −1). */
export function PublicMain({
  className,
  children,
}: {
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  return (
    <main id="main" tabIndex={-1} className={className}>
      {children}
    </main>
  );
}
