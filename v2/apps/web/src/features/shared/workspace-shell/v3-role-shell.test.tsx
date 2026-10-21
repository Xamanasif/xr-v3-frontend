/**
 * A migrated role's workspace in the V3 Refined B shell (the Super Admin, owner-approved export
 * design/v3-refined-b/roles/SA-v1, the Vendor, roles/VE-v1, the Content Manager, roles/CM-v1, the
 * Academic Reviewer, roles/RV-v1, the Institute Admin, roles/IA-v1, the Faculty member,
 * roles/FA-v1, and the Student, roles/ST-v1): the rail as the export's
 * `sa-core.js` draws it — the reserved
 * logo slot, the workspace, the seven destinations with the export's glyphs and the Requests count,
 * "Help & support" in the rail foot — the top line with today's date, the XS account menu with the
 * V3 button, the XS-08 banner first in the page, the skip link to `main#main`. Layout (the drawer
 * below 1024 px) is proved in the browser suites; jsdom has no layout.
 */
import { act, render, screen, within } from '@testing-library/react';
import { assertNoAxeViolations } from '@xr/testing/axe';
import { V3_ICON_PATHS } from '@xr/ui/v3';
import { describe, expect, it, vi } from 'vitest';

import { WORKSPACE_NAV } from '@/nav/nav-config';
import type { ScreenKey } from '@/nav/screens';
import {
  boardPerson,
  cmExport,
  faExport,
  iaExport,
  rvExport,
  saExport,
  stExport,
  veExport,
} from '@/test-support/boards';

import { V3_SHELL_ROLES, V3RoleShell, type V3RoleShellProps } from './v3-role-shell';

const ALL_BUILT: ReadonlySet<ScreenKey> = new Set<ScreenKey>([
  'XS-07',
  ...WORKSPACE_NAV.super_admin.destinations.map((item) => item.screen),
]);

function renderShell(overrides: Partial<V3RoleShellProps> = {}) {
  const onSignOut = vi.fn();
  const view = render(
    <V3RoleShell
      role="super_admin"
      person={boardPerson('super_admin')}
      screen="XS-07"
      built={ALL_BUILT}
      today="2026-10-23T09:30:00+05:30"
      onSignOut={onSignOut}
      {...overrides}
    >
      <h1 tabIndex={-1}>Page</h1>
    </V3RoleShell>,
  );
  const rail = screen.getByRole('complementary', { name: 'Super Admin workspace' });
  return { ...view, rail, onSignOut };
}

describe('the Super Admin workspace in the V3 shell (SA-v1)', () => {
  it('is moved, with the Vendor (VE-v1), the Content Manager (CM-v1), the Academic Reviewer (RV-v1), the Institute Admin (IA-v1), the Faculty member (FA-v1) and the Student (ST-v1): every role', () => {
    expect([...V3_SHELL_ROLES]).toEqual([
      'super_admin',
      'vendor',
      'content_manager',
      'academic_reviewer',
      'tenant_admin',
      'faculty',
      'student',
    ]);
  });

  it('is a V3 root with the rail, no v46 sidebar, and the skip link first', () => {
    const { container, rail } = renderShell();
    expect(container.firstElementChild).toHaveClass('xr', 'rb');
    expect(container.querySelector('aside.xr-side')).toBeNull();
    expect(rail).toHaveClass('rb-rail');
    expect(within(rail).getByText('Official WILP logo')).toHaveClass('rb-logo');
    expect(container.querySelector('a')).toHaveAttribute('href', '#main');
    expect(container.querySelector('main#main')).toHaveClass('rb-page');
  });

  it("draws the export's seven destinations, in order, with its glyphs; Help & support in the foot", () => {
    const { rail } = renderShell();
    const nav = within(rail).getByRole('navigation', { name: 'Super Admin navigation' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.querySelector('span')!.textContent)).toEqual([
      'Overview',
      'Requests',
      'Institutions',
      'Content',
      'Academic structure',
      'Platform roles',
      'Operations',
    ]);
    // The export's rail glyphs, path for path (`sa-core.js` NAV).
    const core = saExport('sa-core.js');
    for (const link of links) {
      const path = link.querySelector('svg path')!.getAttribute('d')!;
      expect(core, link.textContent!).toContain(path);
    }
    expect(links[1]!.querySelector('svg path')!.getAttribute('d')).toBe(V3_ICON_PATHS.inbox);
    const help = within(within(rail).getByRole('navigation', { name: 'Help' })).getByRole('link');
    expect(help).toHaveTextContent('Help & support');
    expect(help).toHaveAttribute('href', '/admin/help');
    expect(help).toHaveAttribute('aria-current', 'page');
    expect(nav.querySelector('[aria-current]')).toBeNull();
  });

  it('marks the screen’s rail owner current and counts requests under review, singular and plural', () => {
    const { rail, rerender } = renderShell({ screen: 'SA-02', counts: { requests: 1 } });
    const requests = within(rail).getByRole('link', { name: /^Requests/ });
    expect(requests).toHaveAttribute('aria-current', 'page');
    expect(requests).toHaveAccessibleName('Requests, 1 request under review');
    rerender(
      <V3RoleShell
        role="super_admin"
        person={boardPerson('super_admin')}
        screen="SA-01"
        built={ALL_BUILT}
        counts={{ requests: 3 }}
        today={null}
        onSignOut={vi.fn()}
      />,
    );
    expect(within(rail).getByRole('link', { name: /^Requests/ })).toHaveAccessibleName(
      'Requests, 3 requests under review',
    );
    expect(within(rail).getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows today on the sample clock in the top line, in words', () => {
    const { container } = renderShell();
    expect(container.querySelector('header.rb-top p.rb-top-date')).toHaveTextContent(
      'Friday 23 October 2026',
    );
  });

  it('carries the XS account menu with its V3 button: name, role, no organisation', () => {
    renderShell();
    const button = screen.getByRole('button', { name: 'Account menu, Arjun Mehta, Super Admin' });
    expect(button).toHaveClass('rb-acct');
    expect(button.closest('.xs-acct-slot')).not.toBeNull();
  });

  it('opens the page with the XS-08 banner when the session reports one', () => {
    const { container } = renderShell({ banner: 'paused' });
    const main = container.querySelector('main#main')!;
    expect(main.firstElementChild).toHaveClass('rk-banner');
    expect(
      within(main.firstElementChild as HTMLElement).getByRole('link', { name: 'Help' }),
    ).toHaveAttribute('href', '/admin/help');
  });

  it("the Vendor's rail: Overview and My experiments with the export's glyphs, the studio, Help & support", () => {
    render(
      <V3RoleShell
        role="vendor"
        person={boardPerson('vendor')}
        screen="VE-02"
        built={new Set<ScreenKey>(['XS-07', 'VE-01', 'VE-02'])}
        today="2026-08-27T10:40:00+05:30"
        onSignOut={vi.fn()}
      >
        <h1 tabIndex={-1}>Page</h1>
      </V3RoleShell>,
    );
    const rail = screen.getByRole('complementary', { name: 'Vendor workspace' });
    const nav = within(rail).getByRole('navigation', { name: 'Vendor navigation' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Overview', 'My experiments']);
    expect(links[1]).toHaveAttribute('aria-current', 'page');
    // The export's rail glyphs, path for path (`Main.dc.html` rail and its `vei-flask` symbol).
    const root = veExport('Main.dc.html');
    for (const link of links) {
      expect(root, link.textContent!).toContain(link.querySelector('svg path')!.getAttribute('d')!);
    }
    expect(within(rail).getByText('Northline Simulation Studio')).toHaveClass('rb-ws-inst');
    // Not on the Overview: the date alone.
    expect(document.querySelector('header.rb-top p.rb-top-date')).toHaveTextContent(
      /^Thursday 27 August 2026$/,
    );
    expect(
      within(within(rail).getByRole('navigation', { name: 'Help' })).getByRole('link'),
    ).toHaveTextContent('Help & support');
  });

  it("names the Vendor's Overview before the date on that page, as the export draws it", () => {
    render(
      <V3RoleShell
        role="vendor"
        person={boardPerson('vendor')}
        screen="VE-01"
        built={new Set<ScreenKey>(['XS-07', 'VE-01', 'VE-02'])}
        today="2026-08-27T10:40:00+05:30"
        onSignOut={vi.fn()}
      />,
    );
    const line = document.querySelector('header.rb-top p.rb-top-date')!;
    expect(line).toHaveTextContent('OverviewThursday 27 August 2026');
    expect(line.querySelector('span.rb-top-sep')).toHaveAttribute('aria-hidden', 'true');
    expect(veExport('Main.dc.html')).toContain(
      'Overview<span class="rb-top-sep" aria-hidden="true"></span></sc-if>{{ A.dateLong }}',
    );
  });

  it("the Content Manager's rail: five destinations with the export's glyphs and its Ready to publish count", () => {
    const built = new Set<ScreenKey>([
      'XS-07',
      ...WORKSPACE_NAV.content_manager.destinations.map((item) => item.screen),
    ]);
    const { rerender } = render(
      <V3RoleShell
        role="content_manager"
        person={boardPerson('content_manager')}
        screen="CM-01"
        built={built}
        counts={{ 'ready-to-publish': 3 }}
        today="2026-08-27T10:40:00+05:30"
        onSignOut={vi.fn()}
      >
        <h1 tabIndex={-1}>Page</h1>
      </V3RoleShell>,
    );
    const rail = screen.getByRole('complementary', { name: 'Content Manager workspace' });
    const nav = within(rail).getByRole('navigation', { name: 'Content Manager navigation' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.querySelector('span')!.textContent)).toEqual([
      'Overview',
      'Ready to publish',
      'Content library',
      'Updates',
      'Course codes',
    ]);
    expect(links[0]).toHaveAttribute('aria-current', 'page');
    // The export's rail glyphs, path for path (`Main.dc.html` rail and its `cmi-*` symbols).
    const root = cmExport('Main.dc.html');
    for (const link of links) {
      const path = link.querySelector('svg path')!.getAttribute('d')!;
      expect(root, link.textContent!).toContain(`<path d="${path}"></path></symbol>`);
    }
    // The count in the export's words (`navVM`), singular at 1; the figure itself is decorative.
    expect(links[1]).toHaveAccessibleName('Ready to publish, 3 experiments ready to publish');
    expect(links[1]!.querySelector('.rb-count > [aria-hidden="true"]')).toHaveTextContent('3');
    expect(root).toContain("this.plural(n, 'experiment') + ' ready to publish'");
    rerender(
      <V3RoleShell
        role="content_manager"
        person={boardPerson('content_manager')}
        screen="CM-02"
        built={built}
        counts={{ 'ready-to-publish': 1 }}
        today="2026-08-27T10:40:00+05:30"
        onSignOut={vi.fn()}
      />,
    );
    expect(within(rail).getByRole('link', { name: /^Ready to publish/ })).toHaveAccessibleName(
      'Ready to publish, 1 experiment ready to publish',
    );
    // The date alone in the top line, as the export draws it on every page.
    expect(document.querySelector('header.rb-top p.rb-top-date')).toHaveTextContent(
      /^Thursday 27 August 2026$/,
    );
    expect(
      within(within(rail).getByRole('navigation', { name: 'Help' })).getByRole('link'),
    ).toHaveAttribute('href', '/content-manager/help');
  });

  it("the Academic Reviewer's rail: three destinations with the export's glyphs and its Review queue count", () => {
    const built = new Set<ScreenKey>([
      'XS-07',
      ...WORKSPACE_NAV.academic_reviewer.destinations.map((item) => item.screen),
    ]);
    const { rerender } = render(
      <V3RoleShell
        role="academic_reviewer"
        person={boardPerson('academic_reviewer')}
        screen="RV-01"
        built={built}
        counts={{ 'review-queue': 3 }}
        today="2026-08-27T10:40:00+05:30"
        onSignOut={vi.fn()}
      >
        <h1 tabIndex={-1}>Page</h1>
      </V3RoleShell>,
    );
    const rail = screen.getByRole('complementary', { name: 'Academic Reviewer workspace' });
    const nav = within(rail).getByRole('navigation', { name: 'Academic Reviewer navigation' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.querySelector('span')!.textContent)).toEqual([
      'Overview',
      'Review queue',
      'Reviewed by me',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/reviewer',
      '/reviewer/queue',
      '/reviewer/reviewed',
    ]);
    expect(links[0]).toHaveAttribute('aria-current', 'page');
    // The export's rail glyphs, path for path (`RV.dc.html` rail, drawn inline).
    const root = rvExport('RV.dc.html');
    for (const link of links) {
      const path = link.querySelector('svg path')!.getAttribute('d')!;
      expect(root, link.textContent!).toContain(
        `<path d="${path}"></path></svg><span>${link.querySelector('span')!.textContent}</span>`,
      );
    }
    // The count in the export's words (`navCountLabel`), singular at 1; the figure is decorative.
    expect(links[1]).toHaveAccessibleName('Review queue, 3 items waiting for review');
    expect(links[1]!.querySelector('.rb-count > [aria-hidden="true"]')).toHaveTextContent('3');
    expect(root).toContain("navCountLabel: this.plural(qn, 'item') + ' waiting for review'");
    rerender(
      <V3RoleShell
        role="academic_reviewer"
        person={boardPerson('academic_reviewer')}
        screen="RV-02"
        built={built}
        counts={{ 'review-queue': 1 }}
        today="2026-08-27T10:40:00+05:30"
        onSignOut={vi.fn()}
      />,
    );
    expect(within(rail).getByRole('link', { name: /^Review queue/ })).toHaveAccessibleName(
      'Review queue, 1 item waiting for review',
    );
    // The date alone in the top line, as the export draws it on every page.
    expect(document.querySelector('header.rb-top p.rb-top-date')).toHaveTextContent(
      /^Thursday 27 August 2026$/,
    );
    expect(root).toContain('<p class="rb-top-date">Thursday 27 August 2026</p>');
    expect(
      within(within(rail).getByRole('navigation', { name: 'Help' })).getByRole('link'),
    ).toHaveAttribute('href', '/reviewer/help');
  });

  it("the Institute Admin's rail: six destinations with the export's glyphs, the institution, no count", () => {
    const built = new Set<ScreenKey>([
      'XS-07',
      ...WORKSPACE_NAV.tenant_admin.destinations.map((item) => item.screen),
    ]);
    const { rerender } = render(
      <V3RoleShell
        role="tenant_admin"
        person={boardPerson('tenant_admin')}
        screen="IA-01"
        built={built}
        today="2026-10-22T09:30:00+05:30"
        onSignOut={vi.fn()}
      >
        <h1 tabIndex={-1}>Page</h1>
      </V3RoleShell>,
    );
    const root = iaExport('Main.dc.html');
    const rail = screen.getByRole('complementary', { name: 'Institute Admin workspace' });
    expect(root).toContain('<aside class="rb-rail" aria-label="Institute Admin workspace">');
    const nav = within(rail).getByRole('navigation', { name: 'Institute Admin navigation' });
    expect(root).toContain('<nav class="rb-nav" aria-label="Institute Admin navigation">');
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.querySelector('span')!.textContent)).toEqual([
      'Overview',
      'Content access',
      'Student access',
      'People',
      'Requests',
      'Usage',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/institute',
      '/institute/content-access',
      '/institute/student-access',
      '/institute/people',
      '/institute/requests',
      '/institute/usage',
    ]);
    expect(links[0]).toHaveAttribute('aria-current', 'page');
    // The export's rail glyphs, path for path (`Main.dc.html` rail, drawn inline).
    for (const link of links) {
      const path = link.querySelector('svg path')!.getAttribute('d')!;
      expect(root, link.textContent!).toContain(
        `<path d="${path}"></path></svg><span>${link.querySelector('span')!.textContent}</span>`,
      );
    }
    // Requests is the kit's tray here (`rbi-inbox`), not the Super Admin's inbox.
    expect(links[4]!.querySelector('svg path')!.getAttribute('d')).toBe(V3_ICON_PATHS.requests);
    expect(V3_ICON_PATHS.requests).not.toBe(V3_ICON_PATHS.inbox);
    // No count on any rail item (HANDOFF §2: "No count badge on Requests").
    expect(rail.querySelector('.rb-count')).toBeNull();
    expect(within(rail).getByText('Godavari Institute of Technology')).toHaveClass('rb-ws-inst');
    // The Overview's name before the date on that page only, as the export draws it.
    const line = document.querySelector('header.rb-top p.rb-top-date')!;
    expect(line).toHaveTextContent(/^OverviewThursday 22 October 2026$/);
    expect(line.querySelector('span.rb-top-sep')).toHaveAttribute('aria-hidden', 'true');
    expect(root).toContain(
      '{{ S.topLabel }}<span class="rb-top-sep" aria-hidden="true"></span></sc-if>{{ S.dateLong }}',
    );
    expect(root).toContain("hasTopLabel: rid === 'IA-01', topLabel: 'Overview'");
    rerender(
      <V3RoleShell
        role="tenant_admin"
        person={boardPerson('tenant_admin')}
        screen="IA-02"
        built={built}
        today="2026-10-22T09:30:00+05:30"
        onSignOut={vi.fn()}
      />,
    );
    expect(document.querySelector('header.rb-top p.rb-top-date')).toHaveTextContent(
      /^Thursday 22 October 2026$/,
    );
    expect(within(rail).getByRole('link', { name: 'Content access' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const help = within(within(rail).getByRole('navigation', { name: 'Help' })).getByRole('link');
    expect(help).toHaveTextContent('Help & support');
    expect(help).toHaveAttribute('href', '/institute/help');
  });

  it("opens the Institute Admin's page with the XS-08 banner, paused or inactive", () => {
    const { container, rerender } = render(
      <V3RoleShell
        role="tenant_admin"
        person={boardPerson('tenant_admin')}
        screen="IA-01"
        banner="paused"
        today="2026-10-22T09:30:00+05:30"
        onSignOut={vi.fn()}
      >
        <h1 tabIndex={-1}>Page</h1>
      </V3RoleShell>,
    );
    const banner = () => container.querySelector('main#main')!.firstElementChild as HTMLElement;
    expect(banner()).toHaveClass('rk-banner');
    expect(banner()).toHaveTextContent('Your institution’s access is paused — your work is kept.');
    expect(within(banner()).getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '/institute/help',
    );
    expect(iaExport('Main.dc.html')).toContain(
      '<p>Your institution’s access is paused — your work is kept.</p><a class="rb-link"',
    );
    rerender(
      <V3RoleShell
        role="tenant_admin"
        person={boardPerson('tenant_admin')}
        screen="IA-01"
        banner="inactive"
        today="2026-10-22T09:30:00+05:30"
        onSignOut={vi.fn()}
      >
        <h1 tabIndex={-1}>Page</h1>
      </V3RoleShell>,
    );
    expect(banner()).toHaveClass('rk-banner');
    expect(banner()).toHaveTextContent(
      'Your account is inactive. Contact your institution administrator.',
    );
  });

  it("the Faculty member's rail: six destinations with the export's glyphs, the institution, the Marking count", () => {
    const built = new Set<ScreenKey>([
      'XS-07',
      ...WORKSPACE_NAV.faculty.destinations.map((item) => item.screen),
    ]);
    const { rerender } = render(
      <V3RoleShell
        role="faculty"
        person={boardPerson('faculty')}
        screen="FA-01"
        built={built}
        counts={{ marking: 2 }}
        today="2026-11-07T10:15:00+05:30"
        onSignOut={vi.fn()}
      >
        <h1 tabIndex={-1}>Page</h1>
      </V3RoleShell>,
    );
    const root = faExport('Main.dc.html');
    const rail = screen.getByRole('complementary', { name: 'Faculty workspace' });
    expect(root).toContain('<aside class="rb-rail" aria-label="Faculty workspace">');
    const nav = within(rail).getByRole('navigation', { name: 'Faculty navigation' });
    expect(root).toContain('<nav class="rb-nav" aria-label="Faculty navigation">');
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.querySelector('span')!.textContent)).toEqual([
      'Overview',
      'My courses',
      'Assessments',
      'Question bank',
      'Marking',
      'Students',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/faculty',
      '/faculty/courses',
      '/faculty/assessments',
      '/faculty/question-bank',
      '/faculty/marking',
      '/faculty/students',
    ]);
    expect(links[0]).toHaveAttribute('aria-current', 'page');
    // The export's rail glyphs, path for path (`Main.dc.html` rail: `<use href="#fai-…">` of its
    // sprite).
    const symbol = (id: string) =>
      new RegExp(`<symbol id="${id}" viewBox="0 0 24 24"><path d="([^"]+)"></path>`).exec(
        root,
      )?.[1];
    for (const link of links) {
      const label = link.querySelector('span')!.textContent!;
      const id = new RegExp(`<use href="#(fai-[\\w-]+)"></use></svg><span>${label}</span>`).exec(
        root,
      )?.[1];
      expect(id, label).toBeDefined();
      expect(link.querySelector('svg path')!.getAttribute('d'), label).toBe(symbol(id!));
    }
    // The Marking pen, the Question bank stack and the Assessments clipboard are the export's own,
    // not the Content Manager's or the v46 sidebar's.
    expect(links[4]!.querySelector('svg path')!.getAttribute('d')).toBe(V3_ICON_PATHS.pen);
    expect(links[3]!.querySelector('svg path')!.getAttribute('d')).toBe(V3_ICON_PATHS.stack);
    expect(links[2]!.querySelector('svg path')!.getAttribute('d')).toBe(
      V3_ICON_PATHS.clipboardCheck,
    );
    // The Marking count: the figure, decorative, then ", N written answers to mark" (`vmShell`
    // `countLabel`), singular at 1; none on any other item.
    expect(links[4]).toHaveAccessibleName('Marking, 2 written answers to mark');
    expect(links[4]!.querySelector('.rb-count > [aria-hidden="true"]')).toHaveTextContent('2');
    expect(links[4]!.querySelector('.rb-count > .xr-sr')).toHaveTextContent(
      ', 2 written answers to mark',
    );
    expect(root).toContain(
      '<span class="rb-count"><span aria-hidden="true">{{ sh.count }}</span><span class="xr-sr">, {{ sh.countLabel }}</span></span>',
    );
    expect(root).toContain("countLabel: this.plural(w, 'written answer') + ' to mark'");
    expect(rail.querySelectorAll('.rb-count')).toHaveLength(1);
    expect(within(rail).getByText('Faculty')).toHaveClass('rb-ws-role');
    expect(within(rail).getByText('Godavari Institute of Technology')).toHaveClass('rb-ws-inst');
    expect(root).toContain(
      '<p class="rb-ws"><span class="rb-ws-role">Faculty</span><span class="rb-ws-inst">Godavari Institute of Technology</span></p>',
    );
    // The date alone in the top line, on the Overview too (`sh.date`, the clock's long date).
    expect(document.querySelector('header.rb-top p.rb-top-date')).toHaveTextContent(
      /^Saturday 7 November 2026$/,
    );
    expect(root).toContain('<p class="rb-top-date">{{ sh.date }}</p>');
    expect(root).toContain("long: 'Saturday 7 November 2026'");
    rerender(
      <V3RoleShell
        role="faculty"
        person={boardPerson('faculty')}
        screen="FA-19"
        built={built}
        counts={{ marking: 1 }}
        today="2026-11-07T10:15:00+05:30"
        onSignOut={vi.fn()}
      />,
    );
    expect(within(rail).getByRole('link', { name: /^Marking/ })).toHaveAccessibleName(
      'Marking, 1 written answer to mark',
    );
    expect(within(rail).getByRole('link', { name: /^Marking/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    rerender(
      <V3RoleShell
        role="faculty"
        person={boardPerson('faculty')}
        screen="FA-18"
        built={built}
        counts={{ marking: 0 }}
        today="2026-11-07T10:15:00+05:30"
        onSignOut={vi.fn()}
      />,
    );
    // Hidden at 0 (`hasCount: w > 0`).
    expect(rail.querySelector('.rb-count')).toBeNull();
    expect(within(rail).getByRole('link', { name: 'Marking' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const help = within(within(rail).getByRole('navigation', { name: 'Help' })).getByRole('link');
    expect(help).toHaveTextContent('Help & support');
    expect(help).toHaveAttribute('href', '/faculty/help');
    expect(root).toContain(
      '<use href="#fai-help"></use></svg><span>Help &amp; support</span></a></nav>',
    );
    expect(help.querySelector('svg path')!.getAttribute('d')).toBe(symbol('fai-help'));
  });

  it("opens the Faculty member's page with the XS-08 banner, paused or inactive", () => {
    const { container, rerender } = render(
      <V3RoleShell
        role="faculty"
        person={boardPerson('faculty')}
        screen="FA-01"
        banner="paused"
        today="2026-11-07T10:15:00+05:30"
        onSignOut={vi.fn()}
      >
        <h1 tabIndex={-1}>Page</h1>
      </V3RoleShell>,
    );
    const banner = () => container.querySelector('main#main')!.firstElementChild as HTMLElement;
    expect(banner()).toHaveClass('rk-banner');
    expect(banner()).toHaveTextContent('Your institution’s access is paused — your work is kept.');
    expect(within(banner()).getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '/faculty/help',
    );
    rerender(
      <V3RoleShell
        role="faculty"
        person={boardPerson('faculty')}
        screen="FA-01"
        banner="inactive"
        today="2026-11-07T10:15:00+05:30"
        onSignOut={vi.fn()}
      >
        <h1 tabIndex={-1}>Page</h1>
      </V3RoleShell>,
    );
    expect(banner()).toHaveClass('rk-banner');
    expect(banner()).toHaveTextContent(
      'Your account is inactive. Contact your institution administrator.',
    );
  });

  it("the Student's rail: four destinations with the export's glyphs, the institution, no count", () => {
    const built = new Set<ScreenKey>([
      'XS-07',
      ...WORKSPACE_NAV.student.destinations.map((item) => item.screen),
    ]);
    const { rerender } = render(
      <V3RoleShell
        role="student"
        person={boardPerson('student')}
        screen="ST-01"
        built={built}
        today="2026-10-12T09:00:00+05:30"
        onSignOut={vi.fn()}
      >
        <h1 tabIndex={-1}>Page</h1>
      </V3RoleShell>,
    );
    const root = stExport('StudentFinal.dc.html');
    const rail = screen.getByRole('complementary', { name: 'Student workspace' });
    expect(root).toContain('<aside class="rb-rail" aria-label="Student workspace">');
    const nav = within(rail).getByRole('navigation', { name: 'Student navigation' });
    expect(root).toContain('<nav class="rb-nav" aria-label="Student navigation">');
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.querySelector('span')!.textContent)).toEqual([
      'Home',
      'My courses',
      'Assessments',
      'Progress',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/student',
      '/student/courses',
      '/student/assessments',
      '/student/progress',
    ]);
    expect(links[0]).toHaveAttribute('aria-current', 'page');
    // The export's rail glyphs, path for path: its shell's `nav` list names each item's
    // `sti-…` symbol (`[key, label, glyph, link]`).
    const symbol = (id: string) =>
      new RegExp(`<symbol id="${id}" viewBox="0 0 24 24"><path d="([^"]+)"></path>`).exec(
        root,
      )?.[1];
    for (const link of links) {
      const label = link.querySelector('span')!.textContent!;
      const id = new RegExp(`\\['\\w+', '${label}', '(sti-[\\w-]+)'`).exec(root)?.[1];
      expect(id, label).toBeDefined();
      expect(link.querySelector('svg path')!.getAttribute('d'), label).toBe(symbol(id!));
    }
    // My courses and Assessments are the Student's own book and clipboard (the v46 Student
    // sidebar's), not the Faculty member's.
    expect(links[1]!.querySelector('svg path')!.getAttribute('d')).toBe(V3_ICON_PATHS.myCourses);
    expect(links[1]!.querySelector('svg path')!.getAttribute('d')).not.toBe(V3_ICON_PATHS.book);
    expect(links[2]!.querySelector('svg path')!.getAttribute('d')).toBe(V3_ICON_PATHS.assessments);
    expect(links[2]!.querySelector('svg path')!.getAttribute('d')).not.toBe(
      V3_ICON_PATHS.clipboardCheck,
    );
    // No count on any item.
    expect(rail.querySelectorAll('.rb-count')).toHaveLength(0);
    expect(within(rail).getByText('Student')).toHaveClass('rb-ws-role');
    expect(within(rail).getByText('Godavari Institute of Technology')).toHaveClass('rb-ws-inst');
    expect(root).toContain(
      '<p class="rb-ws"><span class="rb-ws-role">Student</span><span class="rb-ws-inst">{{ S.inst }}</span></p>',
    );
    // The date alone in the top line, on Home too (`S.dateLong`, the clock's long date).
    expect(document.querySelector('header.rb-top p.rb-top-date')).toHaveTextContent(
      /^Monday 12 October 2026$/,
    );
    expect(root).toContain('<p class="rb-top-date">{{ S.dateLong }}</p>');
    // Every page of a hub, a format or feedback marks My courses; the attempt's neighbours
    // (Before you start, Result) mark Assessments; Progress marks Progress.
    for (const [owner, current] of [
      ['ST-05', 'My courses'],
      ['ST-12', 'Assessments'],
      ['ST-15', 'Progress'],
    ] as const) {
      rerender(
        <V3RoleShell
          role="student"
          person={boardPerson('student')}
          screen={owner}
          built={built}
          today="2026-10-12T09:00:00+05:30"
          onSignOut={vi.fn()}
        />,
      );
      expect(within(nav).getByRole('link', { name: current }), owner).toHaveAttribute(
        'aria-current',
        'page',
      );
    }
    const help = within(within(rail).getByRole('navigation', { name: 'Help' })).getByRole('link');
    expect(help).toHaveTextContent('Help & support');
    expect(help).toHaveAttribute('href', '/student/help');
    expect(root).toContain(
      '<use href="#sti-help"></use></svg><span>Help &amp; support</span></a></nav>',
    );
    expect(help.querySelector('svg path')!.getAttribute('d')).toBe(symbol('sti-help'));
  });

  it("offers My device in the Student's account menu while the Student holds AR, VR or MR (as the v46 shell)", () => {
    const built = new Set<ScreenKey>([
      'XS-07',
      'ST-18',
      ...WORKSPACE_NAV.student.destinations.map((item) => item.screen),
    ]);
    const menuItems = (deviceEligible: boolean) => {
      const view = render(
        <V3RoleShell
          role="student"
          person={boardPerson('student')}
          screen="ST-01"
          built={built}
          deviceEligible={deviceEligible}
          today="2026-10-12T09:00:00+05:30"
          onSignOut={vi.fn()}
        >
          <h1 tabIndex={-1}>Page</h1>
        </V3RoleShell>,
      );
      const button = screen.getByRole('button', { name: /^Account menu, / });
      expect(button).toHaveClass('rb-acct');
      act(() => button.click());
      const panel = document.getElementById(button.getAttribute('aria-controls')!)!;
      const items = within(panel)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]);
      view.unmount();
      return items;
    };
    expect(menuItems(true)).toEqual([
      ['My device', '/student/device'],
      ['Help & support', '/student/help'],
    ]);
    // The export's menu: My device first, while the Student's access allows it (`devEligible`).
    const root = stExport('StudentFinal.dc.html');
    expect(root).toContain("acctItems.push(Object.assign({ t: 'My device', ico: 'sti-vr'");
    expect(menuItems(false)).toEqual([['Help & support', '/student/help']]);
  });

  it("opens the Student's page with the XS-08 banner, paused or inactive", () => {
    const { container, rerender } = render(
      <V3RoleShell
        role="student"
        person={boardPerson('student')}
        screen="ST-01"
        banner="paused"
        today="2026-10-12T09:00:00+05:30"
        onSignOut={vi.fn()}
      >
        <h1 tabIndex={-1}>Page</h1>
      </V3RoleShell>,
    );
    const banner = () => container.querySelector('main#main')!.firstElementChild as HTMLElement;
    expect(banner()).toHaveClass('rk-banner');
    expect(banner()).toHaveTextContent('Your institution’s access is paused — your work is kept.');
    expect(within(banner()).getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '/student/help',
    );
    rerender(
      <V3RoleShell
        role="student"
        person={boardPerson('student')}
        screen="ST-01"
        banner="inactive"
        today="2026-10-12T09:00:00+05:30"
        onSignOut={vi.fn()}
      >
        <h1 tabIndex={-1}>Page</h1>
      </V3RoleShell>,
    );
    expect(banner()).toHaveClass('rk-banner');
    expect(banner()).toHaveTextContent(
      'Your account is inactive. Contact your institution administrator.',
    );
    // The export's two banners, the same words.
    const root = stExport('StudentFinal.dc.html');
    expect(root).toContain('<p>Your institution’s access is paused — your work is kept.</p>');
    expect(root).toContain(
      '<p>Your account is inactive. Contact your institution administrator.</p>',
    );
  });

  it('has no axe violations', async () => {
    const { container } = renderShell();
    await assertNoAxeViolations(container);
  });
});
