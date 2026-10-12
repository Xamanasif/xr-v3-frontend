/**
 * Sidebar — markup contract, behaviour and accessibility (Appendix E §3.5 "Sidebar + NavItem",
 * §4.1–§4.3, §7.3; Appendix F WP-0.6 acceptance 2–4). Sources: B1-10 "SA-02 Requests · 1440 ·
 * interactive" (a whole Super Admin sidebar, drawn statically); board 05 "05 · GL-01 Workspace
 * Shell" (the head with "Close menu", the workspace block with the institution line); board 06
 * "The seven sidebars · full width (≥ 1280 px)", "Rail · Institute Admin · tooltip on hover and
 * focus", "Behaviour" and "Navigation rules"; board 12 "Consistent help · 3.2.6".
 *
 * jsdom has no container queries: the full sidebar, rail and drawer widths, the hidden parts of
 * the rail and the gold focus ring (PF-07) are proven in the browser
 * (apps/specimens e2e/components-shells.spec.ts).
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AccountMenu } from '../overlays/account-menu.js';
import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import { MAX_DESTINATIONS } from './limits.js';
import type { NavDestination } from './nav-item.js';
import { Sidebar } from './sidebar.js';
import { TopBar } from './top-bar.js';
import { WorkspaceShell } from './workspace-shell.js';

const REQUESTS: BoardSource = { board: 'B1-10', frame: 'SA-02 Requests · 1440 · interactive' };
const SHELL: BoardSource = { board: '05', frame: '05 · GL-01 Workspace Shell' };
const SEVEN: BoardSource = { board: '06', frame: 'The seven sidebars · full width (≥ 1280 px)' };
const RAIL: BoardSource = {
  board: '06',
  frame: 'Rail · Institute Admin · tooltip on hover and focus',
};
const BEHAVIOUR: BoardSource = { board: '06', frame: 'Behaviour' };
const RULES: BoardSource = { board: '06', frame: 'Navigation rules' };
const HELP: BoardSource = { board: '12', frame: 'Consistent help · 3.2.6' };

const SUPER_ADMIN: readonly NavDestination[] = [
  { label: 'Overview', href: 'B7-01-SA-Overview.dc.html', icon: 'overview' },
  {
    label: 'Requests',
    href: 'B1-10-SA-Requests.dc.html',
    icon: 'requests',
    current: true,
    count: { value: 3, label: '3 requests under review' },
  },
  { label: 'Institutions', href: 'B7-02-Institutions.dc.html', icon: 'institutions' },
  { label: 'Content', href: 'B7-05-Content-Updates-Release-Hold.dc.html', icon: 'content' },
  {
    label: 'Academic structure',
    href: 'B7-07-Academic-Structure.dc.html',
    icon: 'academicStructure',
  },
  { label: 'Platform roles', href: 'B7-08-Platform-Roles.dc.html', icon: 'platformRoles' },
  { label: 'Operations', href: 'B7-09-Operations.dc.html', icon: 'operations' },
];

const INSTITUTE_ADMIN: readonly NavDestination[] = [
  { label: 'Overview', href: '#overview', icon: 'overview' },
  { label: 'Content access', href: '#content-access', icon: 'contentAccess' },
  { label: 'Student access', href: '#student-access', icon: 'studentAccess' },
  { label: 'People', href: '#people', icon: 'studentsPeople', current: true },
  {
    label: 'Requests',
    href: '#requests',
    icon: 'requests',
    count: { value: 2, label: '2 device requests to forward' },
  },
  { label: 'Usage', href: '#usage', icon: 'usage' },
];

const STUDENT: readonly NavDestination[] = [
  { label: 'Home', href: '#home', icon: 'home', current: true },
  { label: 'My courses', href: '#my-courses', icon: 'myCourses' },
  { label: 'Assessments', href: '#assessments', icon: 'assessments' },
  { label: 'Progress', href: '#progress', icon: 'progress' },
];

/** B1-10's sidebar as drawn, with the canvas inline style on the logo box. */
const B1_10_SIDEBAR = `<aside class="xr-side" aria-label="Super Admin workspace"><div class="xr-side-head"><div class="xr-side-top"><div class="xr-logo-ph" style="flex: 1 1 auto">BITS Pilani / WILP logo — placeholder</div></div><span class="xr-product">XR Learning Platform</span></div>
<div class="xr-ws"><span class="xr-ws-label">Super Admin</span></div>
<nav aria-label="Super Admin navigation"><ul class="xr-nav"><li><a href="B7-01-SA-Overview.dc.html"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"></path></svg><span class="xr-nav-text">Overview</span><span class="xr-tip">Overview</span></a></li><li><a href="B1-10-SA-Requests.dc.html" aria-current="page"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13.5 6.5 5h11l2.5 8.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 13.5h4.5l1.5 2.5h4l1.5-2.5H20"></path></svg><span class="xr-nav-text">Requests</span><span class="xr-tip">Requests</span><span class="xr-count"><span aria-hidden="true">3</span><span class="xr-sr">, 3 requests under review</span></span></a></li><li><a href="B7-02-Institutions.dc.html"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5 12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18"></path></svg><span class="xr-nav-text">Institutions</span><span class="xr-tip">Institutions</span></a></li><li><a href="B7-05-Content-Updates-Release-Hold.dc.html"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h7.5L20 7.5V17a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM15 3v5h5M4 7v13a1 1 0 0 0 1 1h11"></path></svg><span class="xr-nav-text">Content</span><span class="xr-tip">Content</span></a></li><li><a href="B7-07-Academic-Structure.dc.html"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3h4v4h-4zM3.5 17h4v4h-4zM10 17h4v4h-4zM16.5 17h4v4h-4zM12 7v5M5.5 17v-5h13v5M12 12v5"></path></svg><span class="xr-nav-text">Academic structure</span><span class="xr-tip">Academic structure</span></a></li><li><a href="B7-08-Platform-Roles.dc.html"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6zM9 12l2 2 4-4"></path></svg><span class="xr-nav-text">Platform roles</span><span class="xr-tip">Platform roles</span></a></li><li><a href="B7-09-Operations.dc.html"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h9M17 6h3M15 4v4M4 12h3M11 12h9M9 10v4M4 18h11M19 18h1M17 16v4"></path></svg><span class="xr-nav-text">Operations</span><span class="xr-tip">Operations</span></a></li></ul></nav>
<div class="xr-side-foot"><ul class="xr-nav"><li><a href="07-Help-Support.dc.html"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.4a2.5 2.5 0 0 1 4.9.8c0 1.7-2.5 2.2-2.5 3.8M12 17h.01"></path></svg><span class="xr-nav-text">Help</span><span class="xr-tip">Help</span></a></li></ul></div></aside>`;

/** Drops the canvas `style` attributes (frame and composition glue; Appendix E §2.5). */
const withoutInlineStyles = (html: string) => html.replace(/ style="[^"]*"/g, '');

function SuperAdminSidebar() {
  return (
    <Sidebar
      workspace="Super Admin"
      destinations={SUPER_ADMIN}
      help={{ href: '07-Help-Support.dc.html' }}
    />
  );
}

function InShell({ help = false }: { readonly help?: boolean }) {
  return (
    <WorkspaceShell
      sidebar={
        <Sidebar
          workspace="Student"
          institution="Godavari Institute of Technology"
          destinations={help ? STUDENT.map((item) => ({ ...item, current: false })) : STUDENT}
          help={{ href: '#help', current: help }}
        />
      }
      topBar={
        <TopBar
          title="Home"
          account={
            <AccountMenu
              name="Rahul Verma"
              role="Student"
              organisation="Godavari Institute of Technology"
              initials="RV"
              items={[{ kind: 'link', label: 'Help', href: '#help', icon: 'help' }]}
            />
          }
        />
      }
    >
      <h1 className="xr-h1">Home</h1>
    </WorkspaceShell>
  );
}

describe('Sidebar markup contract', () => {
  it('a standalone sidebar renders exactly as B1-10 draws it (the canvas inline style left out)', () => {
    expectBoardDraws(REQUESTS, B1_10_SIDEBAR);
    const { container } = render(<SuperAdminSidebar />);
    expect(normaliseMarkup(container.innerHTML)).toBe(
      normaliseMarkup(withoutInlineStyles(B1_10_SIDEBAR)),
    );
  });

  it('inside the shell the head carries "Close menu" beside the logo, as board 05 draws it', () => {
    const drawn =
      '<div class="xr-side-head"> <div class="xr-side-top"> <div class="xr-logo-ph" style="flex: 1 1 auto">BITS Pilani / WILP logo — placeholder</div> <button type="button" class="xr-side-btn xr-drawer-close" aria-label="Close menu" ref="{{ closeRef }}" onClick="{{ closeDrawer }}"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg></button> </div> <span class="xr-product">XR Learning Platform</span> </div>';
    expectBoardDraws(SHELL, drawn);
    const { container } = render(<InShell />);
    expect(normaliseMarkup(container.querySelector('.xr-side-head')!.outerHTML)).toBe(
      normaliseMarkup(drawn.replace(/ (?:style|ref|onClick)="[^"]*"/g, '')),
    );
  });

  it('the workspace block: the label, and the institution line only where given (board 05)', () => {
    expectBoardDraws(
      SHELL,
      '<div class="xr-ws"> <span class="xr-ws-label">{{ ws }}</span> <sc-if value="{{ hasInst }}" hint-placeholder-val="{{ true }}"><span class="xr-ws-inst">{{ inst }}</span></sc-if> </div>',
    );
    const { container } = render(<InShell />);
    expectRenderedAsDrawn(
      container.querySelector('.xr-ws')!,
      { board: '06', frame: 'Drawer · Student · 375 px' },
      '<div class="xr-ws"><span class="xr-ws-label">Student</span><span class="xr-ws-inst">Godavari Institute of Technology</span></div>',
    );
    const platform = render(<SuperAdminSidebar />);
    expectRenderedAsDrawn(
      platform.container.querySelector('.xr-ws')!,
      REQUESTS,
      '<div class="xr-ws"><span class="xr-ws-label">Super Admin</span></div>',
    );
  });

  it('the standalone rail: `xr-side--rail`, the logo box only, then the destinations and Help (board 06)', () => {
    expectBoardDraws(
      RAIL,
      '<aside class="xr-side xr-side--rail" aria-label="Institute Admin workspace" style="height: 700px; border-radius: 12px"> <div class="xr-side-head"><div class="xr-logo-ph">BITS Pilani / WILP logo — placeholder</div></div> <nav aria-label="Institute Admin navigation">',
    );
    const { container } = render(
      <Sidebar
        workspace="Institute Admin"
        destinations={INSTITUTE_ADMIN}
        help={{ href: '#h-collapse' }}
        rail
      />,
    );
    const aside = container.querySelector('aside')!;
    expect(aside.className).toBe('xr-side xr-side--rail');
    expect(aside).toHaveAttribute('aria-label', 'Institute Admin workspace');
    expect([...aside.children].map((child) => child.tagName + '.' + child.className)).toEqual([
      'DIV.xr-side-head',
      'NAV.',
      'DIV.xr-side-foot',
    ]);
    expect(aside.querySelector('.xr-side-head')!.outerHTML).toBe(
      '<div class="xr-side-head"><div class="xr-logo-ph">BITS Pilani / WILP logo — placeholder</div></div>',
    );
    expect(aside.querySelector('nav')).toHaveAttribute('aria-label', 'Institute Admin navigation');
    expectRenderedAsDrawn(
      aside.querySelector('.xr-side-foot')!,
      RAIL,
      '<div class="xr-side-foot"><ul class="xr-nav"><li><a href="#h-collapse"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.4a2.5 2.5 0 0 1 4.9.8c0 1.7-2.5 2.2-2.5 3.8M12 17h.01"></path></svg><span class="xr-nav-text">Help</span><span class="xr-tip">Help</span></a></li></ul></div>',
    );
  });

  it('emits only stylesheet classes (standalone, rail, in the shell)', () => {
    expectStylesheetClassesOnly(render(<SuperAdminSidebar />).container.firstElementChild!);
    expectStylesheetClassesOnly(
      render(
        <Sidebar
          workspace="Institute Admin"
          destinations={INSTITUTE_ADMIN}
          help={{ href: '#h' }}
          rail
        />,
      ).container.firstElementChild!,
    );
    expectStylesheetClassesOnly(render(<InShell />).container.querySelector('aside')!);
  });
});

describe('Sidebar behaviour and rules', () => {
  it('names its landmarks after the workspace: aside "<Role> workspace" > nav "<Role> navigation"', () => {
    expectBoardDraws(
      SEVEN,
      '<aside class="xr-side" aria-label="{{ r.ws }} workspace" style="height: 760px; border-radius: 12px; overflow: visible">',
      '<nav aria-label="{{ r.ws }} navigation">',
    );
    render(<SuperAdminSidebar />);
    const aside = screen.getByRole('complementary', { name: 'Super Admin workspace' });
    expect(within(aside).getByRole('navigation', { name: 'Super Admin navigation' })).toBeTruthy();
  });

  it('Help is always the last item, at the bottom, outside the destinations (boards 06, 12)', () => {
    expectBoardDraws(
      HELP,
      'Help is the last sidebar item in all seven workspaces, in the drawer on phones, and in the account menu.',
    );
    expectBoardDraws(
      RULES,
      '<li>Help sits at the bottom, separated by a hairline, in every workspace (WCAG 3.2.6).</li>',
    );
    const { container } = render(<SuperAdminSidebar />);
    const links = [...container.querySelectorAll('aside a')];
    expect(links.at(-1)).toHaveTextContent(/^HelpHelp$/);
    expect(links.at(-1)!.closest('.xr-side-foot')).not.toBeNull();
    expect(container.querySelector('nav')!.textContent).not.toContain('Help');
    expect(links).toHaveLength(SUPER_ADMIN.length + 1);
  });

  it('with no destination built (Phase 0, WP-0.8) there is no empty navigation landmark; Help stays in the foot', () => {
    const { container } = render(
      <Sidebar
        workspace="Vendor"
        institution="Northline Simulation Studio"
        destinations={[]}
        help={{ href: '#help', current: true }}
      />,
    );
    const aside = screen.getByRole('complementary', { name: 'Vendor workspace' });
    expect(within(aside).queryByRole('navigation')).toBeNull();
    expect(container.querySelector('nav, ul.xr-nav:empty')).toBeNull();
    const links = within(aside).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['HelpHelp']);
    expect(links[0]).toHaveAttribute('aria-current', 'page');
    expect(links[0]!.closest('.xr-side-foot')).not.toBeNull();
    expect(aside.querySelector('.xr-ws-label')).toHaveTextContent('Vendor');
  });

  it('only the current item carries aria-current="page"; on the Help pages that is Help', () => {
    const { container, unmount } = render(<SuperAdminSidebar />);
    expect(
      [...container.querySelectorAll('[aria-current]')].map((link) => link.textContent),
    ).toEqual(['RequestsRequests3, 3 requests under review']);
    unmount();
    const help = render(<InShell help />);
    const current = help.container.querySelectorAll('aside [aria-current]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute('aria-current', 'page');
    expect(current[0]!.closest('.xr-side-foot')).not.toBeNull();
  });

  it(`refuses more than ${MAX_DESTINATIONS} destinations (board 06 "At most 8 destinations plus Help")`, () => {
    expectBoardDraws(RULES, '<li>At most 8 destinations plus Help.</li>');
    const nine = Array.from({ length: 9 }, (_, index) => ({
      label: `Destination ${index + 1}`,
      href: `#d${index + 1}`,
      icon: 'overview' as const,
    }));
    expect(() =>
      render(<Sidebar workspace="Super Admin" destinations={nine} help={{ href: '#h' }} />),
    ).toThrow(RangeError);
    expect(() =>
      render(
        <Sidebar workspace="Super Admin" destinations={nine.slice(0, 8)} help={{ href: '#h' }} />,
      ),
    ).not.toThrow();
  });

  it('refuses two current items (one destination owns the current screen, Appendix E §4.2)', () => {
    expect(() =>
      render(
        <Sidebar
          workspace="Super Admin"
          destinations={SUPER_ADMIN}
          help={{ href: '#h', current: true }}
        />,
      ),
    ).toThrow(RangeError);
  });

  it('renders nothing current on a message page (Appendix E §4.2)', () => {
    const { container } = render(
      <Sidebar
        workspace="Student"
        destinations={STUDENT.map((item) => ({ ...item, current: false }))}
        help={{ href: '#help' }}
      />,
    );
    expect(container.querySelectorAll('[aria-current]')).toHaveLength(0);
  });

  it('in the drawer, choosing a destination closes it (board 06 "Behaviour")', () => {
    expectBoardDraws(BEHAVIOUR, 'Drawer: choosing a destination closes it.');
    const { container } = render(<InShell />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(container.querySelector('.xr-shell')).toHaveClass('is-drawer');
    fireEvent.click(screen.getByRole('link', { name: /^My courses/ }));
    expect(container.querySelector('.xr-shell')).not.toHaveClass('is-drawer');
  });

  it('outside a shell there is no "Close menu" (nothing to close)', () => {
    render(<SuperAdminSidebar />);
    expect(screen.queryByRole('button', { name: 'Close menu' })).toBeNull();
  });

  it('refuses the standalone `rail` drawing inside a shell (its drawer would have no "Close menu")', () => {
    expect(() =>
      render(
        <WorkspaceShell
          sidebar={
            <Sidebar
              workspace="Institute Admin"
              destinations={INSTITUTE_ADMIN}
              help={{ href: '#h' }}
              rail
            />
          }
          topBar={<TopBar title="People" account={null} />}
        />,
      ),
    ).toThrow(/WorkspaceShell/);
  });
});

describe('Sidebar accessibility (axe, WCAG 2.2 AA)', () => {
  it.each([
    ['platform role, standalone', () => <SuperAdminSidebar />],
    [
      'rail',
      () => (
        <Sidebar
          workspace="Institute Admin"
          destinations={INSTITUTE_ADMIN}
          help={{ href: '#h' }}
          rail
        />
      ),
    ],
    ['in the shell, Help current', () => <InShell help />],
    [
      'no destination built yet (Help only)',
      () => <Sidebar workspace="Vendor" destinations={[]} help={{ href: '#h', current: true }} />,
    ],
  ] as const)('%s', async (_name, view) => {
    const { container } = render(view());
    await assertNoAxeViolations(container);
  });
});
