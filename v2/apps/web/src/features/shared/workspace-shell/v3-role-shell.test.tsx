/**
 * A migrated role's workspace in the V3 Refined B shell (the Super Admin, owner-approved export
 * design/v3-refined-b/roles/SA-v1): the rail as the export's `sa-core.js` draws it — the reserved
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
import { boardPerson, saExport } from '@/test-support/boards';

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
  it('is the only role moved so far', () => {
    expect([...V3_SHELL_ROLES]).toEqual(['super_admin']);
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

  it('has no axe violations', async () => {
    const { container } = renderShell();
    await assertNoAxeViolations(container);
  });
});
