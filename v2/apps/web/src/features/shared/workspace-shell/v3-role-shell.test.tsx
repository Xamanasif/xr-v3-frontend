/**
 * A migrated role's workspace in the V3 Refined B shell (the Super Admin, owner-approved export
 * design/v3-refined-b/roles/SA-v1, the Vendor, roles/VE-v1, and the Content Manager,
 * roles/CM-v1): the rail as the export's `sa-core.js` draws it — the reserved
 * logo slot, the workspace, the seven destinations with the export's glyphs and the Requests count,
 * "Help & support" in the rail foot — the top line with today's date, the XS account menu with the
 * V3 button, the XS-08 banner first in the page, the skip link to `main#main`. Layout (the drawer
 * below 1024 px) is proved in the browser suites; jsdom has no layout.
 */
import { render, screen, within } from '@testing-library/react';
import { assertNoAxeViolations } from '@xr/testing/axe';
import { V3_ICON_PATHS } from '@xr/ui/v3';
import { describe, expect, it, vi } from 'vitest';

import { WORKSPACE_NAV } from '@/nav/nav-config';
import type { ScreenKey } from '@/nav/screens';
import { boardPerson, cmExport, saExport, veExport } from '@/test-support/boards';

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
  it('is moved, with the Vendor (VE-v1) and the Content Manager (CM-v1); every other role keeps its v46 shell', () => {
    expect([...V3_SHELL_ROLES]).toEqual(['super_admin', 'vendor', 'content_manager']);
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

  it('has no axe violations', async () => {
    const { container } = renderShell();
    await assertNoAxeViolations(container);
  });
});
