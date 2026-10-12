/**
 * TopBar — markup contract, behaviour and accessibility (Appendix E §3.5 TopBar, §4.3; Appendix F
 * WP-0.6 acceptance 2–4). Sources: B1-10 "SA-02 Requests · 1440 · interactive" (a destination's own
 * page: the title and a one-level crumb) and B2-05 "IA-05 Give students access · 1440 ·
 * interactive · start here" (a deeper page: the trail), both drawn statically; board 05 "05 ·
 * GL-01 Workspace Shell" (the wired Menu and rail toggle, "Collapse menu" / "Expand menu" and
 * their icons); board 11 "1024 · Super Admin · Request decision" ("Expand menu" in the rail) and
 * "1440 · Institute Admin · People › Students" (a crumb other than the title); board 06
 * "Behaviour" ("The top bar always keeps the page title (or breadcrumbs) and the account menu").
 *
 * jsdom has no container queries: which of the title and the breadcrumbs shows, the navy bar below
 * 1024 and the white bar from 1024 are proven in the browser
 * (apps/specimens e2e/components-shells.spec.ts).
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AccountMenu } from '../overlays/account-menu.js';
import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import { TopBar, type TopBarProps } from './top-bar.js';

const REQUESTS: BoardSource = { board: 'B1-10', frame: 'SA-02 Requests · 1440 · interactive' };
const GIVE_ACCESS: BoardSource = {
  board: 'B2-05',
  frame: 'IA-05 Give students access · 1440 · interactive · start here',
};
const SHELL: BoardSource = { board: '05', frame: '05 · GL-01 Workspace Shell' };
const RAIL_1024: BoardSource = { board: '11', frame: '1024 · Super Admin · Request decision' };
const PEOPLE_1440: BoardSource = {
  board: '11',
  frame: '1440 · Institute Admin · People › Students',
};
const BEHAVIOUR: BoardSource = { board: '06', frame: 'Behaviour' };

const B1_10_HEADER = `<header class="xr-top"><button type="button" class="xr-menu-btn" aria-expanded="false" aria-label="Open menu"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg><span>Menu</span></button>
<button type="button" class="xr-icon-btn xr-top-collapse" aria-label="Collapse menu" aria-expanded="true"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM9.5 5v14M16 10l-2 2 2 2"></path></svg></button>
<div class="xr-top-loc"><span class="xr-top-title">Requests</span><ol class="xr-crumbs" aria-label="You are here"><li><span aria-current="page">Requests</span></li></ol></div>
<div class="xr-acct"><button type="button" class="xr-acct-btn" aria-expanded="false" aria-label="Account menu: Arjun Mehta, Super Admin"><span class="xr-avatar" aria-hidden="true">AM</span><span class="xr-acct-text" aria-hidden="true"><span class="xr-acct-name">Arjun Mehta</span><span class="xr-acct-role">Super Admin</span></span><svg class="xr-ico xr-acct-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"></path></svg></button></div></header>`;

const B2_05_HEADER = `<header class="xr-top"><button type="button" class="xr-menu-btn" aria-expanded="false" aria-label="Open menu"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg><span>Menu</span></button>
<button type="button" class="xr-icon-btn xr-top-collapse" aria-label="Collapse menu" aria-expanded="true"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM9.5 5v14M16 10l-2 2 2 2"></path></svg></button>
<div class="xr-top-loc"><span class="xr-top-title">Give students access</span><ol class="xr-crumbs" aria-label="You are here"><li><a href="B2-04-Student-Access.dc.html">Student access</a><span class="xr-crumb-sep" aria-hidden="true">/</span></li><li><span aria-current="page">Give students access</span></li></ol></div>
<div class="xr-acct"><button type="button" class="xr-acct-btn" aria-expanded="false" aria-label="Account menu: Meera Iyer, Institute Admin, Godavari Institute of Technology"><span class="xr-avatar" aria-hidden="true">MI</span><span class="xr-acct-text" aria-hidden="true"><span class="xr-acct-name">Meera Iyer</span><span class="xr-acct-role">Institute Admin</span></span><svg class="xr-ico xr-acct-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"></path></svg></button></div></header>`;

/** The rendered markup without the account button's `aria-controls` (board 05 completion, VD-13). */
function withoutControls(element: Element): string {
  const copy = element.cloneNode(true) as Element;
  copy.querySelectorAll('[aria-controls]').forEach((node) => node.removeAttribute('aria-controls'));
  return normaliseMarkup(copy.outerHTML);
}

const arjun = (
  <AccountMenu
    name="Arjun Mehta"
    role="Super Admin"
    initials="AM"
    items={[{ kind: 'link', label: 'Help', href: '#help', icon: 'help' }]}
  />
);
const meera = (
  <AccountMenu
    name="Meera Iyer"
    role="Institute Admin"
    organisation="Godavari Institute of Technology"
    initials="MI"
    items={[{ kind: 'link', label: 'Help', href: '#help', icon: 'help' }]}
  />
);

function bar(props: Partial<TopBarProps> = {}) {
  const onOpen = vi.fn();
  const onToggle = vi.fn();
  const view = render(
    <TopBar
      title="Requests"
      account={arjun}
      menuButton={{ expanded: false, onOpen }}
      collapse={{ expanded: true, onToggle }}
      {...props}
    />,
  );
  return { ...view, onOpen, onToggle, header: view.container.querySelector('header')! };
}

describe('TopBar markup contract', () => {
  it('a destination page renders exactly as B1-10 draws it (title, one crumb, account)', () => {
    expectBoardDraws(REQUESTS, B1_10_HEADER);
    const { header } = bar();
    expect(withoutControls(header)).toBe(normaliseMarkup(B1_10_HEADER));
  });

  it('a deeper page renders the trail exactly as B2-05 draws it', () => {
    expectBoardDraws(GIVE_ACCESS, B2_05_HEADER);
    const { header } = bar({
      title: 'Give students access',
      trail: [{ label: 'Student access', href: 'B2-04-Student-Access.dc.html' }],
      account: meera,
    });
    expect(withoutControls(header)).toBe(normaliseMarkup(B2_05_HEADER));
  });

  it('"Expand menu" in the rail: label, aria-expanded and icon as board 05 switches them', () => {
    expectBoardDraws(
      SHELL,
      '<button type="button" class="xr-icon-btn xr-top-collapse" aria-label="{{ collapseLabel }}" aria-expanded="{{ navWide }}" onClick="{{ toggleNav }}"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="{{ collapseIcon }}"></path></svg></button>',
      "collapseLabel: navWide ? 'Collapse menu' : 'Expand menu',",
      "collapseIcon: navWide ? 'M4 5h16v14H4zM9.5 5v14M16 10l-2 2 2 2' : 'M4 5h16v14H4zM9.5 5v14M14 10l2 2-2 2',",
    );
    expectBoardDraws(RAIL_1024, "x.collapseLabel = lg ? 'Collapse menu' : 'Expand menu';");
    const { header } = bar({ collapse: { expanded: false, onToggle: () => undefined } });
    expect(normaliseMarkup(header.querySelector('.xr-top-collapse')!.outerHTML)).toBe(
      normaliseMarkup(
        '<button type="button" class="xr-icon-btn xr-top-collapse" aria-label="Expand menu" aria-expanded="false"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM9.5 5v14M14 10l2 2-2 2"></path></svg></button>',
      ),
    );
  });

  it('a crumb other than the title (board 11 "People › Students")', () => {
    expectBoardDraws(
      PEOPLE_1440,
      "{ cur: 'People', isList: true, menuOpen: true, hasParent: true, parent: 'People', crumb: 'Students', title: 'People' }",
    );
    const { header } = bar({
      title: 'People',
      trail: [{ label: 'People', href: '#people' }],
      current: 'Students',
    });
    expect(header.querySelector('.xr-top-title')).toHaveTextContent('People');
    expect(header.querySelector('.xr-crumbs [aria-current="page"]')).toHaveTextContent('Students');
  });

  it('emits only stylesheet classes (both toggle states, with a trail)', () => {
    expectStylesheetClassesOnly(bar().header);
    expectStylesheetClassesOnly(
      bar({
        collapse: { expanded: false, onToggle: () => undefined },
        trail: [{ label: 'Help & support', href: '#help' }],
      }).header,
    );
  });
});

describe('TopBar behaviour', () => {
  it('always keeps the title, the breadcrumbs and the account menu; the CSS shows one location', () => {
    expectBoardDraws(
      BEHAVIOUR,
      'The top bar always keeps the page title (or breadcrumbs) and the account menu.',
    );
    const { header } = bar();
    const location = header.querySelector('.xr-top-loc')!;
    expect([...location.children].map((child) => child.className)).toEqual([
      'xr-top-title',
      'xr-crumbs',
    ]);
    expect(header.lastElementChild).toHaveClass('xr-acct');
  });

  it('Menu is named "Open menu" and reports the drawer state; a press asks to open it', () => {
    const { onOpen } = bar();
    const menu = screen.getByRole('button', { name: 'Open menu' });
    expect(menu).toHaveTextContent('Menu');
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(menu);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('the rail toggle says what it will do and reports the sidebar state; a press toggles', () => {
    const { onToggle } = bar();
    const toggle = screen.getByRole('button', { name: 'Collapse menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('without a shell or a collapse prop no rail toggle is drawn (board 06 "Drawer · Student · 375 px")', () => {
    expectBoardDraws(
      { board: '06', frame: 'Drawer · Student · 375 px' },
      '<header class="xr-top"> <button type="button" class="xr-menu-btn" aria-expanded="true">',
    );
    const { header } = bar({ collapse: undefined });
    expect(header.querySelector('.xr-top-collapse')).toBeNull();
  });

  it('needs a WorkspaceShell or its menuButton prop', () => {
    expect(() => render(<TopBar title="Home" account={arjun} />)).toThrow(/WorkspaceShell/);
  });
});

describe('TopBar accessibility (axe, WCAG 2.2 AA)', () => {
  it.each<readonly [string, Partial<TopBarProps>]>([
    ['destination page, "Collapse menu"', {}],
    [
      'deeper page, rail ("Expand menu")',
      {
        trail: [{ label: 'Student access', href: '#sa' }],
        collapse: { expanded: false, onToggle: () => undefined },
      },
    ],
    [
      'a crumb other than the title',
      { title: 'People', trail: [{ label: 'People', href: '#people' }], current: 'Students' },
    ],
    [
      'drawer open, no rail toggle',
      { menuButton: { expanded: true, onOpen: () => undefined }, collapse: undefined },
    ],
  ])('%s', async (_name, props) => {
    const { container } = bar(props);
    await assertNoAxeViolations(container);
  });
});
