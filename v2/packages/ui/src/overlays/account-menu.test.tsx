/**
 * AccountMenu — markup contract, disclosure behaviour and accessibility (Appendix E §3.4
 * AccountMenu, §4.4; Appendix F WP-0.6 acceptance 2–4; VD-13). Sources: B3-07 "ST-18 My device ·
 * 1440 · interactive · 22 Oct 2026" and B7-01 "SA-01 Overview · 1440 · 23 Oct 2026" (the closed
 * button as the product boards draw it); board 05 "05 · GL-01 Workspace Shell" (`aria-controls`);
 * board 03 "Open · Student with AR / VR / MR" and "Open · platform role (no institution)" (the
 * panel); board 12 "Patterns" (Enter opens · Tab moves through items · Esc closes and returns
 * focus to the button).
 *
 * Real Tab movement and the phone layout (avatar only) are proven in a real browser
 * (apps/specimens/e2e/components-overlays.spec.ts).
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LinkProvider, type LinkRenderProps } from '../link.js';
import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import { AccountMenu, type AccountMenuItem } from './account-menu.js';

const STUDENT_TOP: BoardSource = {
  board: 'B3-07',
  frame: 'ST-18 My device · 1440 · interactive · 22 Oct 2026',
};
const ADMIN_TOP: BoardSource = { board: 'B7-01', frame: 'SA-01 Overview · 1440 · 23 Oct 2026' };
const SHELL: BoardSource = { board: '05', frame: '05 · GL-01 Workspace Shell' };
const OPEN_STUDENT: BoardSource = { board: '03', frame: 'Open · Student with AR / VR / MR' };
const OPEN_PLATFORM: BoardSource = { board: '03', frame: 'Open · platform role (no institution)' };
const PATTERNS: BoardSource = { board: '12', frame: 'Patterns' };

const signOut = vi.fn();

const STUDENT_ITEMS: readonly AccountMenuItem[] = [
  { kind: 'link', label: 'My device', href: '#h-acct', icon: 'myDevice' },
  { kind: 'link', label: 'Help', href: '#h-acct', icon: 'help' },
  { kind: 'separator' },
  { kind: 'button', label: 'Sign out', icon: 'signOut', onSelect: signOut },
];

const PLATFORM_ITEMS: readonly AccountMenuItem[] = [
  { kind: 'link', label: 'Help', href: '#h-acct', icon: 'help' },
  { kind: 'separator' },
  { kind: 'button', label: 'Sign out', icon: 'signOut', onSelect: signOut },
];

function Rahul({ onSignOut }: { readonly onSignOut?: () => void }) {
  const items = onSignOut
    ? STUDENT_ITEMS.map((item) =>
        item.kind === 'button' ? { ...item, onSelect: onSignOut } : item,
      )
    : STUDENT_ITEMS;
  return (
    <AccountMenu
      name="Rahul Verma"
      role="Student"
      organisation="Godavari Institute of Technology"
      initials="RV"
      items={items}
      menuId="acct-menu"
    />
  );
}

function Arjun() {
  return (
    <AccountMenu
      name="Arjun Mehta"
      role="Super Admin"
      initials="AM"
      items={PLATFORM_ITEMS}
      menuId="acct-menu"
    />
  );
}

const accountButton = () => screen.getByRole('button', { name: /^Account menu: / });

/** The rendered element without the `aria-controls` completion (board 05; VD-13). */
function withoutControls(element: Element): Element {
  const copy = element.cloneNode(true) as Element;
  copy.querySelectorAll('[aria-controls]').forEach((node) => node.removeAttribute('aria-controls'));
  return copy;
}

describe('AccountMenu markup contract', () => {
  it('closed, with the institution line in the name, as the product boards draw it (+ aria-controls)', () => {
    expectBoardDraws(
      SHELL,
      'aria-expanded="{{ menuOpen }}" aria-controls="acct-menu" aria-label="Account menu: {{ person }}, {{ ws }}"',
    );
    const { container } = render(<Rahul />);
    expect(accountButton()).toHaveAttribute('aria-controls', 'acct-menu');
    expectRenderedAsDrawn(
      withoutControls(container.firstElementChild!),
      STUDENT_TOP,
      '<div class="xr-acct"><button type="button" class="xr-acct-btn" aria-expanded="false" aria-label="Account menu: Rahul Verma, Student, Godavari Institute of Technology"><span class="xr-avatar" aria-hidden="true">RV</span><span class="xr-acct-text" aria-hidden="true"><span class="xr-acct-name">Rahul Verma</span><span class="xr-acct-role">Student</span></span><svg class="xr-ico xr-acct-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"></path></svg></button></div>',
    );
  });

  it('closed, a platform role (no institution line)', () => {
    const { container } = render(<Arjun />);
    expectRenderedAsDrawn(
      withoutControls(container.firstElementChild!),
      ADMIN_TOP,
      '<div class="xr-acct"><button type="button" class="xr-acct-btn" aria-expanded="false" aria-label="Account menu: Arjun Mehta, Super Admin"><span class="xr-avatar" aria-hidden="true">AM</span><span class="xr-acct-text" aria-hidden="true"><span class="xr-acct-name">Arjun Mehta</span><span class="xr-acct-role">Super Admin</span></span><svg class="xr-ico xr-acct-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"></path></svg></button></div>',
    );
  });

  it.each([
    [
      'Student with AR / VR / MR',
      OPEN_STUDENT,
      <Rahul key="r" />,
      '<div class="xr-menu-head"><span class="xr-menu-name">Rahul Verma</span><span class="xr-menu-meta">Student</span><span class="xr-menu-meta">Godavari Institute of Technology</span></div><a class="xr-menu-item" href="#h-acct"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2"></path></svg>My device</a><a class="xr-menu-item" href="#h-acct"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.4a2.5 2.5 0 0 1 4.9.8c0 1.7-2.5 2.2-2.5 3.8M12 17h.01"></path></svg>Help</a><div class="xr-menu-sep" role="separator"></div><button type="button" class="xr-menu-item"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l4-4-4-4M14 12H4"></path></svg>Sign out</button>',
    ],
    [
      'platform role (no institution)',
      OPEN_PLATFORM,
      <AccountMenu
        key="k"
        name="Kavya Nair"
        role="Content Manager"
        initials="KN"
        items={PLATFORM_ITEMS}
        menuId="acct-menu"
      />,
      '<div class="xr-menu-head"><span class="xr-menu-name">Kavya Nair</span><span class="xr-menu-meta">Content Manager</span></div><a class="xr-menu-item" href="#h-acct"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.4a2.5 2.5 0 0 1 4.9.8c0 1.7-2.5 2.2-2.5 3.8M12 17h.01"></path></svg>Help</a><div class="xr-menu-sep" role="separator"></div><button type="button" class="xr-menu-item"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l4-4-4-4M14 12H4"></path></svg>Sign out</button>',
    ],
  ])('open, %s: the panel holds exactly what board 03 draws', (_case, source, element, inner) => {
    expectBoardDraws(source, inner);
    const { container } = render(element);
    fireEvent.click(accountButton());
    const panel = container.querySelector('.xr-menu')!;
    // Board 05 gives the panel its id; board 03's inline style is canvas presentation.
    expectBoardDraws(SHELL, '<div class="xr-menu" id="acct-menu">');
    expect(panel.getAttribute('class')).toBe('xr-menu');
    expect(panel.id).toBe('acct-menu');
    expect(normaliseMarkup(panel.innerHTML)).toBe(normaliseMarkup(inner));
    expect(panel.previousElementSibling).toBe(accountButton());
  });

  it('not role="menu" (VD-13 disclosure; B3-07 draws role="menu", a recorded variance)', () => {
    expectBoardDraws(
      { board: 'B3-07', frame: 'Entry · account menu (Rahul has VR)' },
      '<div class="xr-menu" role="menu" aria-label="Account">',
    );
    const { container } = render(<Rahul />);
    fireEvent.click(accountButton());
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
    expect(container.querySelectorAll('[tabindex]')).toHaveLength(0);
  });

  it('emits only stylesheet classes, open and closed', () => {
    const { container } = render(<Rahul />);
    expectStylesheetClassesOnly(container.firstElementChild!);
    fireEvent.click(accountButton());
    expectStylesheetClassesOnly(container.firstElementChild!);
  });
});

describe('AccountMenu behaviour (board 12 "Patterns")', () => {
  it('Enter (a button press) opens it; focus stays on the button; the panel follows it for Tab', () => {
    expectBoardDraws(
      PATTERNS,
      '<dt>Account menu</dt><dd><span class="doc-kbd">Enter</span> opens · <span class="doc-kbd">Tab</span> moves through items · <span class="doc-kbd">Esc</span> closes and returns focus to the button</dd>',
    );
    render(<Rahul />);
    const button = accountButton();
    button.focus();
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveFocus();
    const panel = document.getElementById(button.getAttribute('aria-controls')!)!;
    const stops = [...panel.querySelectorAll<HTMLElement>('a[href], button')];
    expect(stops.map((stop) => stop.textContent)).toEqual(['My device', 'Help', 'Sign out']);
    expect(
      button.compareDocumentPosition(stops[0]!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('pressing the button again closes it', () => {
    render(<Rahul />);
    fireEvent.click(accountButton());
    fireEvent.click(accountButton());
    expect(accountButton()).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('acct-menu')).toBeNull();
  });

  it('Esc closes it and returns focus to the button', () => {
    render(<Rahul />);
    fireEvent.click(accountButton());
    const help = screen.getByRole('link', { name: 'Help' });
    help.focus();
    expect(fireEvent.keyDown(help, { key: 'Escape' })).toBe(false);
    expect(accountButton()).toHaveAttribute('aria-expanded', 'false');
    expect(accountButton()).toHaveFocus();
  });

  it('focus leaving the menu closes it', () => {
    render(
      <div>
        <Rahul />
        <a href="#main">Next on the page</a>
      </div>,
    );
    fireEvent.click(accountButton());
    const signOutButton = screen.getByRole('button', { name: 'Sign out' });
    // Tab inside the menu keeps it open…
    fireEvent.blur(screen.getByRole('link', { name: 'Help' }), { relatedTarget: signOutButton });
    expect(accountButton()).toHaveAttribute('aria-expanded', 'true');
    // …Tab past the last item closes it.
    fireEvent.blur(signOutButton, {
      relatedTarget: screen.getByRole('link', { name: 'Next on the page' }),
    });
    expect(accountButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('a press outside closes it; a press inside does not', () => {
    render(
      <div>
        <Rahul />
        <p>Elsewhere on the page</p>
      </div>,
    );
    fireEvent.click(accountButton());
    fireEvent.pointerDown(document.querySelector('.xr-menu-head')!);
    expect(accountButton()).toHaveAttribute('aria-expanded', 'true');
    fireEvent.pointerDown(screen.getByText('Elsewhere on the page'));
    expect(accountButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('a button item runs its action, closes the menu and returns focus to the button', () => {
    const onSignOut = vi.fn();
    render(<Rahul onSignOut={onSignOut} />);
    fireEvent.click(accountButton());
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
    expect(accountButton()).toHaveAttribute('aria-expanded', 'false');
    expect(accountButton()).toHaveFocus();
  });

  it('link items go through the injected link component, and choosing one closes the menu', () => {
    const rendered: string[] = [];
    function RouterLink({ ref, onClick, ...props }: LinkRenderProps) {
      rendered.push(props.href);
      return (
        <a
          ref={ref}
          {...props}
          onClick={(event) => {
            event.preventDefault();
            onClick?.(event);
          }}
        />
      );
    }
    render(
      <LinkProvider component={RouterLink}>
        <Rahul />
      </LinkProvider>,
    );
    fireEvent.click(accountButton());
    expect(rendered).toEqual(['#h-acct', '#h-acct']);
    fireEvent.click(screen.getByRole('link', { name: 'My device' }));
    expect(accountButton()).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('AccountMenu accessibility (axe, WCAG 2.2 AA)', () => {
  it.each([
    ['closed', <Rahul key="a" />, false],
    ['open, institution role', <Rahul key="b" />, true],
    ['open, platform role', <Arjun key="c" />, true],
  ])('%s', async (_state, element, open) => {
    const { container } = render(element);
    if (open) fireEvent.click(accountButton());
    await assertNoAxeViolations(container);
  });
});
