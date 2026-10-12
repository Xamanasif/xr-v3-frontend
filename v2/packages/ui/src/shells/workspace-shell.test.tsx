/**
 * WorkspaceShell — markup contract, behaviour and accessibility (Appendix E §3.5 "WorkspaceShell
 * (GL-01)", §4.3, §5.4, §7.3, §7.4; Appendix F WP-0.6 acceptance 2–4). Sources: board 05 "05 ·
 * GL-01 Workspace Shell" (the shell: skip link, sidebar, scrim, top bar, banner slot, main#main,
 * the rail toggle and its band logic); board 06 "Drawer · Student · 375 px" (the scrim, the open
 * drawer) and "Behaviour"; board 11 "1024 · Super Admin · Request decision" (the rail) and "1440 ·
 * Institute Admin · People › Students" (`div.xr-wrap`); board 12 "Shell tab order" and "Patterns";
 * board 07 "State 1 · Report a problem · Student" (`xr-wrap--form`) and "State 1c · Sent ·
 * reference" (no wrap).
 *
 * jsdom has no layout, container queries or real Tab order: the drawer below 1024, the 72 px rail
 * at 1024–1279, the full sidebar from 1280, the tab order as a browser walks it and the inert
 * page are proven in the browser (apps/specimens e2e/components-shells.spec.ts). Here the width is
 * fed to the shell through a stand-in ResizeObserver.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ShellBanner } from '../foundation/shell-banner.js';
import { AccountMenu } from '../overlays/account-menu.js';
import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import type { NavDestination } from './nav-item.js';
import { Sidebar } from './sidebar.js';
import { TopBar } from './top-bar.js';
import {
  shellBandFor,
  sidebarWideAt,
  WorkspaceShell,
  type PageWrap,
  type SidebarPreference,
  type WorkspaceShellProps,
} from './workspace-shell.js';

const SHELL: BoardSource = { board: '05', frame: '05 · GL-01 Workspace Shell' };
const DRAWER: BoardSource = { board: '06', frame: 'Drawer · Student · 375 px' };
const BEHAVIOUR: BoardSource = { board: '06', frame: 'Behaviour' };
const RAIL_1024: BoardSource = { board: '11', frame: '1024 · Super Admin · Request decision' };
const PEOPLE_1440: BoardSource = {
  board: '11',
  frame: '1440 · Institute Admin · People › Students',
};
const TAB_ORDER: BoardSource = { board: '12', frame: 'Shell tab order' };
const PATTERNS: BoardSource = { board: '12', frame: 'Patterns' };
const REPORT_FORM: BoardSource = { board: '07', frame: 'State 1 · Report a problem · Student' };
const REPORT_SENT: BoardSource = { board: '07', frame: 'State 1c · Sent · reference' };

const INSTITUTE_ADMIN: readonly NavDestination[] = [
  { label: 'Overview', href: '#overview', icon: 'overview', current: true },
  { label: 'Content access', href: '#content-access', icon: 'contentAccess' },
  { label: 'Student access', href: '#student-access', icon: 'studentAccess' },
  { label: 'People', href: '#people', icon: 'studentsPeople' },
  {
    label: 'Requests',
    href: '#requests',
    icon: 'requests',
    count: { value: 2, label: '2 device requests to forward' },
  },
  { label: 'Usage', href: '#usage', icon: 'usage' },
];

/** A stand-in for the browser's ResizeObserver: the test says how wide the `xr-app` is. */
class WidthObserver {
  static current: WidthObserver | null = null;
  readonly callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    WidthObserver.current = this;
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  static resize(width: number): void {
    const observer = WidthObserver.current!;
    act(() => {
      observer.callback(
        [{ contentRect: { width } } as ResizeObserverEntry],
        observer as unknown as ResizeObserver,
      );
    });
  }
}

beforeEach(() => {
  WidthObserver.current = null;
  vi.stubGlobal('ResizeObserver', WidthObserver);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function Shell({
  banner = false,
  ...props
}: Partial<WorkspaceShellProps> & { readonly banner?: boolean }) {
  return (
    <WorkspaceShell
      sidebar={
        <Sidebar
          workspace="Institute Admin"
          institution="Godavari Institute of Technology"
          destinations={INSTITUTE_ADMIN}
          help={{ href: '#help' }}
        />
      }
      topBar={
        <TopBar
          title="Overview"
          account={
            <AccountMenu
              name="Meera Iyer"
              role="Institute Admin"
              organisation="Godavari Institute of Technology"
              initials="MI"
              items={[
                { kind: 'link', label: 'Help', href: '#help', icon: 'help' },
                { kind: 'separator' },
                { kind: 'button', label: 'Sign out', icon: 'signOut', onSelect: () => undefined },
              ]}
            />
          }
        />
      }
      banner={banner ? <ShellBanner kind="paused" helpHref="#help" /> : undefined}
      wrap="read"
      {...props}
    >
      <h1 className="xr-h1">Overview</h1>
      <a href="#first">A link in the page</a>
    </WorkspaceShell>
  );
}

const shellDiv = (container: HTMLElement) => container.querySelector('.xr-shell')!;
const menuButton = () => screen.getByRole('button', { name: 'Open menu', hidden: true });
const toggle = () => screen.getByRole('button', { name: /^(Collapse|Expand) menu$/ });

describe('WorkspaceShell markup contract', () => {
  it('the frame: xr-app > skip link + xr-shell > [sidebar, scrim, xr-main > (top bar, main)]', () => {
    expectBoardDraws(
      SHELL,
      '<a class="xr-skip" href="#main">Skip to main content</a> <div class="xr-shell {{ shellCls }}" style="min-height: 100vh"> <aside class="xr-side" aria-label="{{ ws }} workspace" ref="{{ sideRef }}" onKeyDown="{{ onSideKey }}">',
      '</aside> <div class="xr-scrim" aria-hidden="true" onClick="{{ closeDrawer }}"></div> <div class="xr-main"> <header class="xr-top">',
    );
    const { container } = render(<Shell />);
    const app = container.firstElementChild!;
    const children = (element: Element) =>
      [...element.children].map((child) => `${child.tagName.toLowerCase()}.${child.className}`);
    expect(app.className).toBe('xr-app');
    expect(children(app)).toEqual(['a.xr-skip', 'div.xr-shell']);
    expect(children(shellDiv(container))).toEqual(['aside.xr-side', 'div.xr-scrim', 'div.xr-main']);
    expect(children(container.querySelector('.xr-main')!)).toEqual([
      'header.xr-top',
      'main.xr-page',
    ]);
    expectRenderedAsDrawn(
      app.firstElementChild!,
      SHELL,
      '<a class="xr-skip" href="#main">Skip to main content</a>',
    );
    expectRenderedAsDrawn(
      container.querySelector('.xr-scrim')!,
      DRAWER,
      '<div class="xr-scrim" aria-hidden="true"></div>',
    );
  });

  it('main is `main.xr-page#main` (+ tabindex="-1" for the skip link, VD-16) around the page width', () => {
    expectBoardDraws(
      SHELL,
      '<main class="xr-page" id="main"> <div class="xr-wrap--read xr-content">',
    );
    const { container } = render(<Shell />);
    const main = container.querySelector('main')!;
    expect(normaliseMarkup(main.outerHTML)).toMatch(
      /^<main class="xr-page" id="main" tabindex="-1"><div class="xr-wrap--read xr-content"><h1 class="xr-h1">Overview<\/h1>/,
    );
  });

  it.each([
    ['wide', PEOPLE_1440, '<div class="xr-wrap xr-content">', 'xr-wrap xr-content'],
    ['form', REPORT_FORM, '<div class="xr-wrap--form xr-content">', 'xr-wrap--form xr-content'],
  ] as const)('wrap "%s" as drawn', (wrap, source, drawn, classes) => {
    expectBoardDraws(source, drawn);
    const { container } = render(<Shell wrap={wrap as PageWrap} />);
    expect(container.querySelector('main')!.firstElementChild!.className).toBe(classes);
  });

  it('wrap "none": the content straight in main (board 07 "State 1c · Sent · reference")', () => {
    expectBoardDraws(
      REPORT_SENT,
      '</sc-if> <sc-if value="{{ f.isSent }}" hint-placeholder-val="{{ false }}"> <div class="xr-msg">',
    );
    const { container } = render(<Shell wrap="none" />);
    expect(container.querySelector('main')!.firstElementChild!.tagName).toBe('H1');
  });

  it('the banner slot sits between the top bar and main, as board 05 draws it', () => {
    expectBoardDraws(
      SHELL,
      '</header> <sc-if value="{{ isPaused }}" hint-placeholder-val="{{ false }}"> <div class="xr-banner xr-banner--paused" role="status">',
    );
    const { container } = render(<Shell banner />);
    expect(
      [...container.querySelector('.xr-main')!.children].map((child) => child.className),
    ).toEqual(['xr-top', 'xr-banner xr-banner--paused', 'xr-page']);
  });

  it.each([
    ['auto', 'xr-shell'],
    ['expanded', 'xr-shell is-expanded'],
    ['rail', 'xr-shell is-rail'],
  ] as const)('preference %s → class "%s"', (preference, classes) => {
    const { container } = render(<Shell sidebarPreference={preference} />);
    expect(shellDiv(container).className).toBe(classes);
  });

  it('emits only stylesheet classes (closed, drawer open, with the banner)', () => {
    const { container } = render(<Shell banner />);
    expectStylesheetClassesOnly(container.firstElementChild!);
    fireEvent.click(menuButton());
    expectStylesheetClassesOnly(container.firstElementChild!);
  });
});

describe('WorkspaceShell widths (board 05 bands; Appendix E §4.3)', () => {
  it('bands at the v46 `xr-app` thresholds: drawer < 1024 ≤ rail < 1280 ≤ full', () => {
    expectBoardDraws(SHELL, "const band = s.w >= 1280 ? 'lg' : (s.w >= 1024 ? 'md' : 'sm');");
    expect([375, 768, 1023.98, 1024, 1100, 1279.98, 1280, 1440].map(shellBandFor)).toEqual([
      'drawer',
      'drawer',
      'drawer',
      'rail',
      'rail',
      'rail',
      'full',
      'full',
    ]);
  });

  it('the sidebar is wide: from 1280 unless railed, at 1024–1279 only when expanded, never below', () => {
    const table = (['auto', 'expanded', 'rail'] as const).map((preference: SidebarPreference) =>
      (['drawer', 'rail', 'full'] as const).map((band) => sidebarWideAt(band, preference)),
    );
    expect(table).toEqual([
      [false, false, true],
      [false, true, true],
      [false, false, false],
    ]);
  });

  it('from 1280: "Collapse menu" (expanded) narrows it to the rail; "Expand menu" widens it again', () => {
    const { container } = render(<Shell />);
    WidthObserver.resize(1440);
    expect(toggle()).toHaveAccessibleName('Collapse menu');
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle());
    expect(shellDiv(container).className).toBe('xr-shell is-rail');
    expect(toggle()).toHaveAccessibleName('Expand menu');
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle());
    expect(shellDiv(container).className).toBe('xr-shell is-expanded');
    expect(toggle()).toHaveAccessibleName('Collapse menu');
  });

  it('1024–1279: the rail by default, "Expand menu" widens it and pushes the content (board 06)', () => {
    expectBoardDraws(
      { board: '06', frame: 'Collapsed rail and mobile drawer' },
      '1024–1279 px: the sidebar starts as a 72 px icon rail; “Expand menu” in the top bar widens it to 248 px and pushes the content.',
    );
    expectBoardDraws(
      RAIL_1024,
      "'Rail 72 (icons, tooltips) · “Expand menu” in the top bar · panel 29%'",
    );
    const { container } = render(<Shell />);
    WidthObserver.resize(1100);
    expect(shellDiv(container).className).toBe('xr-shell');
    expect(toggle()).toHaveAccessibleName('Expand menu');
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle());
    expect(shellDiv(container).className).toBe('xr-shell is-expanded');
    expect(toggle()).toHaveAccessibleName('Collapse menu');
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
  });

  it('the choice carries across widths: railed at 1440 stays the rail at 1100', () => {
    const { container } = render(<Shell />);
    WidthObserver.resize(1440);
    fireEvent.click(toggle());
    WidthObserver.resize(1100);
    expect(shellDiv(container).className).toBe('xr-shell is-rail');
    expect(toggle()).toHaveAccessibleName('Expand menu');
  });

  it('controlled: the caller keeps the choice in memory (VD-20) and the shell only reports presses', () => {
    expectBoardDraws(BEHAVIOUR, 'The expand / collapse choice is remembered per person.');
    const onChange = vi.fn();
    const { container, rerender } = render(
      <Shell sidebarPreference="auto" onSidebarPreferenceChange={onChange} />,
    );
    WidthObserver.resize(1440);
    fireEvent.click(toggle());
    expect(onChange).toHaveBeenCalledWith('rail');
    expect(shellDiv(container).className).toBe('xr-shell');
    rerender(<Shell sidebarPreference="rail" onSidebarPreferenceChange={onChange} />);
    expect(shellDiv(container).className).toBe('xr-shell is-rail');
    expect(toggle()).toHaveAccessibleName('Expand menu');
  });

  it('starts from `defaultSidebarPreference` when the shell keeps the choice itself', () => {
    const { container } = render(<Shell defaultSidebarPreference="rail" />);
    expect(shellDiv(container).className).toBe('xr-shell is-rail');
  });

  it('measures its width before paint: at 1100 the first frame already says "Expand menu"', () => {
    const measure = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 1100,
      height: 900,
      top: 0,
      left: 0,
      right: 1100,
      bottom: 900,
    } as DOMRect);
    try {
      render(<Shell />);
      // No ResizeObserver callback has run: the layout-effect measurement named the toggle.
      expect(toggle()).toHaveAccessibleName('Expand menu');
      expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    } finally {
      measure.mockRestore();
    }
  });

  it('without a measurement (no layout) the toggle is named for the board default, 1440', () => {
    render(<Shell />);
    expect(toggle()).toHaveAccessibleName('Collapse menu');
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('WorkspaceShell behaviour', () => {
  it('the drawer: Menu moves focus to "Close menu"; the skip link and xr-main are inert while open', () => {
    expectBoardDraws(
      BEHAVIOUR,
      'Drawer: opens from the left, focus moves to “Close menu”, Escape or the scrim closes it, focus returns to “Menu”.',
    );
    const { container } = render(<Shell />);
    WidthObserver.resize(375);
    menuButton().focus();
    fireEvent.click(menuButton());
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveFocus();
    expect(shellDiv(container).className).toBe('xr-shell is-drawer');
    expect(menuButton()).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('.xr-main')).toHaveAttribute('inert');
    expect(container.querySelector('.xr-skip')).toHaveAttribute('inert');
    expect(container.querySelector('aside')).not.toHaveAttribute('inert');
  });

  it('Esc closes it and focus returns to Menu; nothing stays inert (board 12 "Patterns")', () => {
    expectBoardDraws(
      PATTERNS,
      '<dt>Drawer</dt><dd>Focus moves to Close · <span class="doc-kbd">Esc</span> closes · focus returns to Menu</dd>',
    );
    const { container } = render(<Shell />);
    fireEvent.click(menuButton());
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(shellDiv(container).className).toBe('xr-shell');
    expect(menuButton()).toHaveFocus();
    expect(container.querySelector('.xr-main')).not.toHaveAttribute('inert');
    expect(container.querySelector('.xr-skip')).not.toHaveAttribute('inert');
  });

  it('the scrim closes it and focus returns to Menu', () => {
    const { container } = render(<Shell />);
    fireEvent.click(menuButton());
    fireEvent.click(container.querySelector('.xr-scrim')!);
    expect(shellDiv(container).className).toBe('xr-shell');
    expect(menuButton()).toHaveFocus();
  });

  it('when the app grows to 1024 or more the drawer closes and nothing stays inert', () => {
    const { container } = render(<Shell />);
    WidthObserver.resize(900);
    fireEvent.click(menuButton());
    const close = screen.getByRole('button', { name: 'Close menu' });
    expect(close).toHaveFocus();
    expect(container.querySelector('.xr-main')).toHaveAttribute('inert');
    WidthObserver.resize(1100);
    expect(shellDiv(container).className).toBe('xr-shell');
    expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('.xr-main')).not.toHaveAttribute('inert');
    expect(container.querySelector('.xr-skip')).not.toHaveAttribute('inert');
    // Focus is not pulled back to Menu, nor left on "Close menu": the v46 CSS hides both from
    // 1024. It moves to the persistent sidebar's current destination.
    expect(menuButton()).not.toHaveFocus();
    expect(close).not.toHaveFocus();
    const overview = container.querySelector('aside a[href="#overview"]')!;
    expect(overview).toHaveAttribute('aria-current', 'page');
    expect(overview).toHaveFocus();
  });

  it('focus dropped to the page as the app grows past 1024 also moves to the current destination', () => {
    const { container } = render(<Shell />);
    WidthObserver.resize(900);
    fireEvent.click(menuButton());
    screen.getByRole('button', { name: 'Close menu' }).blur();
    expect(document.body).toHaveFocus();
    WidthObserver.resize(1300);
    expect(container.querySelector('aside a[aria-current="page"]')).toHaveFocus();
  });

  it('a sidebar link focused in the drawer keeps focus as the app grows past 1024', () => {
    const { container } = render(<Shell />);
    WidthObserver.resize(900);
    fireEvent.click(menuButton());
    const people = container.querySelector<HTMLElement>('aside a[href="#people"]')!;
    people.focus();
    expect(people).toHaveFocus();
    WidthObserver.resize(1100);
    expect(people).toHaveFocus();
  });

  it('a drawer opened below 1024 stays open while the app stays below 1024', () => {
    const { container } = render(<Shell />);
    WidthObserver.resize(375);
    fireEvent.click(menuButton());
    WidthObserver.resize(900);
    expect(shellDiv(container).className).toBe('xr-shell is-drawer');
  });

  it('the drawer class follows the sidebar preference class (board 05 `shellCls` order)', () => {
    expectBoardDraws(
      SHELL,
      "const shellCls = [s.navToggled ? 'is-expanded is-rail' : '', s.drawerOpen ? 'is-drawer' : ''].join(' ');",
    );
    const { container } = render(<Shell sidebarPreference="expanded" />);
    fireEvent.click(menuButton());
    expect(shellDiv(container).className).toBe('xr-shell is-expanded is-drawer');
  });

  it('the skip link moves focus into main#main', () => {
    render(<Shell />);
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    skip.focus();
    fireEvent.click(skip);
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('a custom main id is the skip link target', () => {
    const { container } = render(<Shell mainId="page-main" />);
    expect(container.querySelector('.xr-skip')).toHaveAttribute('href', '#page-main');
    expect(container.querySelector('main')).toHaveAttribute('id', 'page-main');
  });

  it('landmarks: aside "<Role> workspace" > nav "<Role> navigation", the header, main', () => {
    render(<Shell />);
    expect(screen.getByRole('complementary', { name: 'Institute Admin workspace' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Institute Admin navigation' })).toBeTruthy();
    expect(screen.getByRole('banner')).toHaveClass('xr-top');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
  });

  it('DOM order gives the board 12 tab order: skip, sidebar + Help, Menu / Collapse, account, banner Help, main', () => {
    expectBoardDraws(
      TAB_ORDER,
      '<li><strong>Skip to main content</strong> — first stop, visible when focused (2.4.1).</li>',
      '<li>Sidebar destinations in order, then Help.</li>',
      '<li>Top bar: Menu / Collapse, then the account menu.</li>',
      '<li>Banner action (Help), when a banner shows.</li>',
      '<li>Main content, top to bottom.</li>',
    );
    const { container } = render(<Shell banner />);
    const stops = [...container.querySelectorAll<HTMLElement>('a[href], button')].map(
      (element) =>
        element.getAttribute('aria-label') ??
        element.querySelector('.xr-nav-text')?.textContent ??
        element.textContent,
    );
    // "Close menu" is displayed only in the open drawer (v46 `.xr-drawer-close`), where focus starts.
    expect(stops).toEqual([
      'Skip to main content',
      'Close menu',
      'Overview',
      'Content access',
      'Student access',
      'People',
      'Requests',
      'Usage',
      'Help',
      'Open menu',
      'Collapse menu',
      'Account menu: Meera Iyer, Institute Admin, Godavari Institute of Technology',
      'Help',
      'A link in the page',
    ]);
  });
});

describe('WorkspaceShell accessibility (axe, WCAG 2.2 AA)', () => {
  it.each([
    ['closed', false, false],
    ['drawer open', true, false],
    ['with the banner', false, true],
  ] as const)('%s', async (_name, open, banner) => {
    const { container } = render(<Shell banner={banner} />);
    if (open) fireEvent.click(menuButton());
    await assertNoAxeViolations(container);
  });

  it.each([
    ['rail band (1100), "Expand menu"', 1100, 'auto', 'Expand menu'],
    ['rail band (1100) expanded, "Collapse menu"', 1100, 'expanded', 'Collapse menu'],
    ['full (1440) railed, "Expand menu"', 1440, 'rail', 'Expand menu'],
  ] as const)('%s', async (_name, width, preference, name) => {
    const { container } = render(<Shell sidebarPreference={preference} />);
    WidthObserver.resize(width);
    expect(toggle()).toHaveAccessibleName(name);
    await assertNoAxeViolations(container);
  });
});
