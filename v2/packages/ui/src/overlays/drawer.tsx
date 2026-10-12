'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent, type Ref } from 'react';

import { Icon } from '../foundation/icon.js';

export interface DrawerCloseOptions {
  /**
   * Where focus goes once the drawer has closed:
   * - `true` (default): back to "Menu" (Esc, the scrim, "Close menu");
   * - `false`: it stays where it is (a destination was chosen);
   * - `'sidebar'`: the drawer stopped being one because the app grew to 1024 px or more. The v46
   *   sheet hides "Close menu" from there (`.xr-shell .xr-drawer-close{display:none}`), so focus
   *   left on it (where opening the drawer put it), dropped to the page, or on anything else in
   *   the sidebar that is no longer rendered moves to the now persistent sidebar: its current
   *   destination (`aria-current="page"`), else its first destination. Focus on a sidebar control
   *   that is still rendered stays where it is.
   */
  readonly returnFocus?: boolean | 'sidebar';
}

/** Whether an element is rendered; without `checkVisibility` (jsdom) it is taken as rendered. */
function isRendered(element: Element): boolean {
  return typeof element.checkVisibility === 'function' ? element.checkVisibility() : true;
}

/**
 * After the drawer closed because the app grew to 1024 px or more: hands focus on to the
 * persistent sidebar when it was on "Close menu", on the page itself (a browser's focus fixup
 * when "Close menu" stopped being displayed) or on another sidebar control no longer rendered.
 */
function focusPersistentSidebar(closeButton: HTMLButtonElement | null): void {
  const side = closeButton?.closest('.xr-side');
  if (!closeButton || !side) return;
  const active = document.activeElement;
  const lost =
    active === null ||
    active === document.body ||
    active === closeButton ||
    (side.contains(active) && !isRendered(active));
  if (!lost) return;
  const target =
    side.querySelector<HTMLElement>('a[href][aria-current="page"]') ??
    side.querySelector<HTMLElement>('nav a[href]') ??
    side.querySelector<HTMLElement>('a[href]');
  target?.focus();
}

/** Props of the top-bar "Menu" button; `useDrawer().menuButtonProps` supplies them. */
export interface DrawerMenuButtonProps {
  readonly ref?: Ref<HTMLButtonElement>;
  /** `aria-expanded`: whether the drawer is open. */
  readonly expanded: boolean;
  readonly onOpen: () => void;
}

/** Props of "Close menu"; `useDrawer().closeButtonProps` supplies them. */
export interface DrawerCloseButtonProps {
  readonly ref?: Ref<HTMLButtonElement>;
  readonly onClose: () => void;
}

/** Props of the scrim; `useDrawer().scrimProps` supplies them. */
export interface DrawerScrimProps {
  readonly ref?: Ref<HTMLDivElement>;
  readonly onClose: () => void;
}

/**
 * The sidebar drawer below 1024 px of app width (boards 05, 06, 12; Appendix E §3.4 Drawer,
 * §4.3): `.xr-shell.is-drawer > aside.xr-side + div.xr-scrim`, opened from `button.xr-menu-btn`.
 * The shells (WP-0.8) compose it; this is the behaviour they share.
 */
export interface DrawerController {
  readonly open: boolean;
  /** Opens the drawer and moves focus to "Close menu" (board 06 "Behaviour"). */
  readonly openDrawer: () => void;
  /** Closes the drawer; by default focus returns to "Menu". */
  readonly closeDrawer: (options?: DrawerCloseOptions) => void;
  /** `is-drawer` while open, for `div.xr-shell` (the class the v46 drawer rules key on). */
  readonly shellClassName: 'is-drawer' | undefined;
  /** For `<DrawerMenuButton {...menuButtonProps} />`. */
  readonly menuButtonProps: DrawerMenuButtonProps;
  /** For `<DrawerCloseButton {...closeButtonProps} />` in `div.xr-side-top`. */
  readonly closeButtonProps: DrawerCloseButtonProps;
  /** For `<DrawerScrim {...scrimProps} />` after `aside.xr-side`. */
  readonly scrimProps: DrawerScrimProps;
  /** Spread on `aside.xr-side`: choosing a destination closes the drawer (board 06). */
  readonly sideProps: { readonly onClick: (event: MouseEvent<HTMLElement>) => void };
  /**
   * Spread on everything behind the drawer — `div.xr-main` and the skip link: `inert` while open
   * (PF-03: "Inert background, Esc and scrim close are JS").
   */
  readonly backgroundProps: { readonly inert: boolean | undefined };
}

/**
 * Drawer behaviour (board 06 "Behaviour"; board 12 "Patterns": "Focus moves to Close · Esc closes
 * · focus returns to Menu"): opening moves focus to "Close menu"; Esc, the scrim or "Close menu"
 * close it and focus returns to "Menu"; choosing a destination closes it; the rest of the shell is
 * inert while it is open. When the app grows to 1024 px or more the scrim is no longer displayed
 * (v46 `.xr-shell > .xr-scrim{display:none}`), so the drawer closes, nothing stays inert, and focus
 * left on the now hidden "Close menu" moves to the persistent sidebar (`returnFocus: 'sidebar'`).
 */
export function useDrawer(): DrawerController {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<'close' | 'menu' | 'sidebar' | null>(null);

  const openDrawer = useCallback(() => {
    pendingFocus.current = 'close';
    setOpen(true);
  }, []);

  const closeDrawer = useCallback((options?: DrawerCloseOptions) => {
    const returnFocus = options?.returnFocus ?? true;
    pendingFocus.current =
      returnFocus === 'sidebar' ? 'sidebar' : returnFocus === true ? 'menu' : null;
    setOpen(false);
  }, []);

  const close = useCallback(() => closeDrawer(), [closeDrawer]);

  // Focus moves after the commit that shows the drawer (or removes `inert` from the Menu button).
  useEffect(() => {
    const target = pendingFocus.current;
    pendingFocus.current = null;
    if (open && target === 'close') closeButtonRef.current?.focus();
    if (!open && target === 'menu') menuButtonRef.current?.focus();
    if (!open && target === 'sidebar') focusPersistentSidebar(closeButtonRef.current);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      closeDrawer();
    };
    const onResize = () => {
      const scrim = scrimRef.current;
      if (scrim && getComputedStyle(scrim).display === 'none') {
        closeDrawer({ returnFocus: 'sidebar' });
      }
    };
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [open, closeDrawer]);

  const onSideClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!open) return;
      const target = event.target;
      if (target instanceof Element && target.closest('a[href]')) {
        closeDrawer({ returnFocus: false });
      }
    },
    [open, closeDrawer],
  );

  return {
    open,
    openDrawer,
    closeDrawer,
    shellClassName: open ? 'is-drawer' : undefined,
    menuButtonProps: { ref: menuButtonRef, expanded: open, onOpen: openDrawer },
    closeButtonProps: { ref: closeButtonRef, onClose: close },
    scrimProps: { ref: scrimRef, onClose: close },
    sideProps: { onClick: onSideClick },
    backgroundProps: { inert: open ? true : undefined },
  };
}

/**
 * The top-bar "Menu" button below 1024 (boards 05, 11 and the product boards: 841 instances of
 * `<button type="button" class="xr-menu-btn" aria-expanded="false" aria-label="Open menu">`),
 * visible text "Menu", name "Open menu". Hidden by the v46 CSS from 1024.
 */
export function DrawerMenuButton({ ref, expanded, onOpen }: DrawerMenuButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      className="xr-menu-btn"
      aria-expanded={expanded}
      aria-label="Open menu"
      onClick={() => onOpen()}
    >
      <Icon name="menu" />
      <span>Menu</span>
    </button>
  );
}

/** "Close menu" in `div.xr-side-top` (board 05; board 06 "Drawer · Student · 375 px"). */
export function DrawerCloseButton({ ref, onClose }: DrawerCloseButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      className="xr-side-btn xr-drawer-close"
      aria-label="Close menu"
      onClick={() => onClose()}
    >
      <Icon name="close" />
    </button>
  );
}

/** The scrim behind the open drawer (`div.xr-scrim`, `aria-hidden`); a press closes the drawer. */
export function DrawerScrim({ ref, onClose }: DrawerScrimProps) {
  return <div ref={ref} className="xr-scrim" aria-hidden="true" onClick={() => onClose()} />;
}
