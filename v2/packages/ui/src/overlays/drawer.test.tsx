/**
 * Drawer (useDrawer, DrawerMenuButton, DrawerCloseButton, DrawerScrim) — markup contract, behaviour
 * and accessibility (Appendix E §3.4 Drawer, §4.3; Appendix F WP-0.6 acceptance 2–4). Sources: board
 * 06 "Drawer · Student · 375 px" and its "Behaviour" list; board 05 "05 · GL-01 Workspace Shell"
 * (the wired Menu, Close menu and scrim); board 12 "Patterns" ("Focus moves to Close · Esc closes ·
 * focus returns to Menu"); B3-07 "ST-18 My device · 1440 · interactive · 22 Oct 2026" (the Menu
 * button as every product board draws it).
 *
 * jsdom has no container queries: the drawer's look below 1024 and PF-03's fixed position are
 * proven in a real browser (apps/specimens/e2e/components-overlays.spec.ts).
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Icon } from '../foundation/icon.js';
import { joinClasses } from '../internal/classes.js';
import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import { DrawerCloseButton, DrawerMenuButton, DrawerScrim, useDrawer } from './drawer.js';

const DRAWER: BoardSource = { board: '06', frame: 'Drawer · Student · 375 px' };
const BEHAVIOUR: BoardSource = { board: '06', frame: 'Behaviour' };
const SHELL: BoardSource = { board: '05', frame: '05 · GL-01 Workspace Shell' };
const PATTERNS: BoardSource = { board: '12', frame: 'Patterns' };
const PRODUCT_TOP: BoardSource = {
  board: 'B3-07',
  frame: 'ST-18 My device · 1440 · interactive · 22 Oct 2026',
};

/** The board 06 drawer frame, composed the way the shells (WP-0.8) will compose it. */
function DrawerShell() {
  const drawer = useDrawer();
  return (
    <div className="xr-app">
      <a className="xr-skip" href="#main" {...drawer.backgroundProps}>
        Skip to main content
      </a>
      <div className={joinClasses('xr-shell', drawer.shellClassName)} data-testid="shell">
        <aside className="xr-side" aria-label="Student workspace" {...drawer.sideProps}>
          <div className="xr-side-head">
            <div className="xr-side-top">
              <div className="xr-logo-ph">BITS Pilani / WILP logo — placeholder</div>
              <DrawerCloseButton {...drawer.closeButtonProps} />
            </div>
            <span className="xr-product">XR Learning Platform</span>
          </div>
          <nav aria-label="Student navigation">
            <ul className="xr-nav">
              <li>
                <a href="#main" aria-current="page">
                  <Icon name="home" />
                  <span className="xr-nav-text">Home</span>
                </a>
              </li>
              <li>
                <a href="#progress">
                  <Icon name="progress" />
                  <span className="xr-nav-text">Progress</span>
                </a>
              </li>
            </ul>
          </nav>
        </aside>
        <DrawerScrim {...drawer.scrimProps} />
        <div className="xr-main" {...drawer.backgroundProps} data-testid="main">
          <header className="xr-top">
            <DrawerMenuButton {...drawer.menuButtonProps} />
            <div className="xr-top-loc">
              <span className="xr-top-title">Home</span>
            </div>
          </header>
          <main className="xr-page" id="main" tabIndex={-1}>
            <h1 className="xr-h1">Home</h1>
          </main>
        </div>
      </div>
    </div>
  );
}

const menuButton = () => screen.getByRole('button', { name: 'Open menu' });
const closeButton = () => screen.getByRole('button', { name: 'Close menu' });

function openDrawer(): void {
  menuButton().focus();
  fireEvent.click(menuButton());
}

/** What the v46 sheet does from 1024 px of app width: the scrim is no longer displayed. */
function growPast1024(container: HTMLElement): void {
  container.querySelector<HTMLElement>('.xr-scrim')!.style.display = 'none';
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
}

describe('Drawer markup contract', () => {
  it('the Menu button renders exactly as the product boards draw it (closed)', () => {
    render(<DrawerShell />);
    expectRenderedAsDrawn(
      menuButton(),
      PRODUCT_TOP,
      '<button type="button" class="xr-menu-btn" aria-expanded="false" aria-label="Open menu"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg><span>Menu</span></button>',
    );
  });

  it('open: aria-expanded="true" on Menu and `is-drawer` on the shell (board 06)', () => {
    expectBoardDraws(
      DRAWER,
      '<div class="xr-shell is-drawer" style="min-height: 700px">',
      '<button type="button" class="xr-menu-btn" aria-expanded="true">',
    );
    expectBoardDraws(SHELL, 'aria-expanded="{{ drawerOpen }}" aria-label="Open menu"');
    render(<DrawerShell />);
    expect(screen.getByTestId('shell').className).toBe('xr-shell');
    openDrawer();
    expect(screen.getByTestId('shell').className).toBe('xr-shell is-drawer');
    expect(screen.getByRole('button', { name: 'Open menu', hidden: true })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('Close menu and the scrim render as board 06 draws them (the canvas `is-focus` left out)', () => {
    const { container } = render(<DrawerShell />);
    const drawn =
      '<button type="button" class="xr-side-btn xr-drawer-close is-focus" aria-label="Close menu"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg></button>';
    expectBoardDraws(DRAWER, drawn);
    expect(normaliseMarkup(closeButton().outerHTML)).toBe(
      normaliseMarkup(drawn.replace(' is-focus', '')),
    );
    expectRenderedAsDrawn(
      container.querySelector('.xr-scrim')!,
      DRAWER,
      '<div class="xr-scrim" aria-hidden="true"></div>',
    );
  });

  it('emits only stylesheet classes, open and closed', () => {
    const { container } = render(<DrawerShell />);
    expectStylesheetClassesOnly(container.firstElementChild!);
    openDrawer();
    expectStylesheetClassesOnly(container.firstElementChild!);
  });
});

describe('Drawer behaviour (board 06 "Behaviour", board 12 "Patterns")', () => {
  it('opening moves focus to "Close menu" and makes the rest of the shell inert', () => {
    expectBoardDraws(
      BEHAVIOUR,
      'Drawer: opens from the left, focus moves to “Close menu”, Escape or the scrim closes it, focus returns to “Menu”.',
    );
    render(<DrawerShell />);
    openDrawer();
    expect(closeButton()).toHaveFocus();
    expect(screen.getByTestId('main')).toHaveAttribute('inert');
    expect(screen.getByText('Skip to main content')).toHaveAttribute('inert');
  });

  it('Esc closes it and focus returns to Menu', () => {
    expectBoardDraws(
      PATTERNS,
      '<dt>Drawer</dt><dd>Focus moves to Close · <span class="doc-kbd">Esc</span> closes · focus returns to Menu</dd>',
    );
    render(<DrawerShell />);
    openDrawer();
    fireEvent.keyDown(closeButton(), { key: 'Escape' });
    expect(screen.getByTestId('shell').className).toBe('xr-shell');
    expect(menuButton()).toHaveFocus();
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('main')).not.toHaveAttribute('inert');
  });

  it('Esc anywhere on the page closes it (focus may sit on a non-focusable part)', () => {
    render(<DrawerShell />);
    openDrawer();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(menuButton()).toHaveFocus();
  });

  it('the scrim closes it and focus returns to Menu', () => {
    const { container } = render(<DrawerShell />);
    openDrawer();
    fireEvent.click(container.querySelector('.xr-scrim')!);
    expect(screen.getByTestId('shell').className).toBe('xr-shell');
    expect(menuButton()).toHaveFocus();
  });

  it('"Close menu" closes it and focus returns to Menu', () => {
    render(<DrawerShell />);
    openDrawer();
    fireEvent.click(closeButton());
    expect(menuButton()).toHaveFocus();
  });

  it('choosing a destination closes it without pulling focus back to Menu', () => {
    expectBoardDraws(BEHAVIOUR, 'Drawer: choosing a destination closes it.');
    render(<DrawerShell />);
    openDrawer();
    const home = screen.getByRole('link', { name: 'Home' });
    home.focus();
    fireEvent.click(home);
    expect(screen.getByTestId('shell').className).toBe('xr-shell');
    expect(menuButton()).not.toHaveFocus();
  });

  it('closes once the scrim is no longer displayed (the app grew to 1024 or more); focus moves from the hidden "Close menu" to the current destination', () => {
    const { container } = render(<DrawerShell />);
    openDrawer();
    expect(closeButton()).toHaveFocus();
    growPast1024(container);
    expect(screen.getByTestId('shell').className).toBe('xr-shell');
    expect(screen.getByTestId('main')).not.toHaveAttribute('inert');
    // Not Menu (hidden from 1024 too) and not the hidden "Close menu": the current destination.
    expect(menuButton()).not.toHaveFocus();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus();
  });

  it('focus the browser dropped to the page (the focus fixup on the hidden "Close menu") moves to the current destination', () => {
    const { container } = render(<DrawerShell />);
    openDrawer();
    closeButton().blur();
    expect(document.body).toHaveFocus();
    growPast1024(container);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus();
  });

  it('a sidebar control that is still rendered keeps focus; one no longer rendered hands it on', () => {
    const { container } = render(<DrawerShell />);
    openDrawer();
    const progress = screen.getByRole('link', { name: 'Progress' });
    progress.focus();
    growPast1024(container);
    expect(screen.getByTestId('shell').className).toBe('xr-shell');
    expect(progress).toHaveFocus();
    openDrawer();
    progress.focus();
    Object.defineProperty(progress, 'checkVisibility', { value: () => false });
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(screen.getByTestId('shell').className).toBe('xr-shell');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus();
  });
});

describe('Drawer accessibility (axe, WCAG 2.2 AA)', () => {
  it.each([false, true])('drawer open: %s', async (open) => {
    const { container } = render(<DrawerShell />);
    if (open) openDrawer();
    await assertNoAxeViolations(container);
  });
});
