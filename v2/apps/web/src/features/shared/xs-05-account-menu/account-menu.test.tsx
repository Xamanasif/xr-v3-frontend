/**
 * XS-05, the account menu of each workspace, in the owner-approved Entry & shared design
 * (design/v3-refined-b/roles/XS-v6, `XsAccountMenu`; SHARED-CONTRACT `items_by_role`): name, role
 * line, the institution or organisation line where the role has one (board 06's lines), "My
 * device" only for a Student with AR / VR / MR and only once ST-18 is built, Help & support, then
 * Sign out in the panel's foot — and board 05's people (names and initials are sample data: test
 * fixtures only, never product defaults).
 */
import { act, render, screen, within } from '@testing-library/react';
import { PLATFORM_ROLES, ROLE_LABEL, type Role } from '@xr/domain';
import { assertNoAxeViolations } from '@xr/testing/axe';
import { describe, expect, it, vi } from 'vitest';

import { BUILT_SCREENS } from '@/nav/built-screens';
import { WORKSPACE_NAV } from '@/nav/nav-config';
import type { ScreenKey } from '@/nav/screens';
import { BOARD_ACCOUNT_ROWS, boardPerson as person, xsContract } from '@/test-support/boards';

import { accountMenuLinks, organisationLine, WorkspaceAccountMenu } from './account-menu';

const ST18_BUILT = new Set<ScreenKey>([...BUILT_SCREENS, 'ST-18']);

function openMenu(
  role: Role,
  options: { deviceEligible?: boolean; built?: ReadonlySet<ScreenKey> } = {},
) {
  const onSignOut = vi.fn();
  const { unmount } = render(
    <WorkspaceAccountMenu role={role} person={person(role)} onSignOut={onSignOut} {...options} />,
  );
  const button = screen.getByRole('button', { name: /^Account menu, / });
  act(() => button.click());
  const panel = document.getElementById(button.getAttribute('aria-controls')!)!;
  return { button, panel, onSignOut, unmount };
}

const itemNames = (panel: HTMLElement) =>
  [...panel.querySelectorAll('.xs-menu-item')].map((item) => item.textContent);

/** The XS contract's items for a workspace (the Student with AR, VR or MR access). */
const XS_ITEMS = (() => {
  const menu = xsContract().components.find((component) => component.id === 'XsAccountMenu')!;
  const byRole = menu.items_by_role!;
  return (label: string) => byRole[label === 'Student' ? 'Student (with AR/VR/MR)' : label]!;
})();

describe('the same pattern in every workspace (XS-05; board 06 lines)', () => {
  it('board 06 lists the seven workspaces; board 05 gives every sample person initials', () => {
    expect([...BOARD_ACCOUNT_ROWS.keys()]).toEqual(PLATFORM_ROLES.map((role) => ROLE_LABEL[role]));
    for (const row of BOARD_ACCOUNT_ROWS.values())
      expect(row.initials, row.name).toMatch(/^[A-Z]{2}$/);
  });

  it.each(PLATFORM_ROLES.map((role) => [ROLE_LABEL[role], role] as const))(
    '%s: the button names who, the role and the line; the menu shows the board’s lines and items',
    (label, role) => {
      const row = BOARD_ACCOUNT_ROWS.get(label)!;
      // The Student holds VR (board 05 `device: true`) and ST-18 is built: board 06's full list.
      const { button, panel } = openMenu(role, { deviceEligible: true, built: ST18_BUILT });
      expect(button).toHaveAccessibleName(
        `Account menu, ${[row.name, row.role, row.line].filter(Boolean).join(', ')}`,
      );
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button.querySelector('.xr-avatar')).toHaveTextContent(row.initials);
      expect(panel.querySelector('.xs-menu-head .xr-avatar')).toHaveTextContent(row.initials);
      expect(
        [...panel.querySelectorAll('.xs-menu-head > p')].map((line) => line.textContent),
      ).toEqual([row.name, row.role, ...(row.line ? [row.line] : [])]);
      expect(itemNames(panel)).toEqual(XS_ITEMS(label));
      // Focus is on the first item; Help & support is this workspace's own Help page.
      expect(panel.querySelector('.xs-menu-item')).toHaveFocus();
      expect(within(panel).getByRole('link', { name: 'Help & support' })).toHaveAttribute(
        'href',
        WORKSPACE_NAV[role].help.href,
      );
    },
  );

  it('the platform roles get no institution line, whatever the record carries; nothing is invented', () => {
    for (const role of ['academic_reviewer', 'content_manager', 'super_admin'] as const) {
      expect(organisationLine(role, person(role))).toBeUndefined();
    }
    expect(organisationLine('vendor', person('vendor'))).toBe('Northline Simulation Studio');
    expect(
      organisationLine('faculty', { ...person('faculty'), organisation: undefined }),
    ).toBeUndefined();
  });
});

describe('"My device": a Student with AR / VR / MR, once ST-18 is built', () => {
  it('hidden while ST-18 is not built, even for a Student who holds VR', () => {
    const unbuilt = new Set<ScreenKey>([...BUILT_SCREENS].filter((screen) => screen !== 'ST-18'));
    const { panel } = openMenu('student', { deviceEligible: true, built: unbuilt });
    expect(itemNames(panel)).toEqual(['Help & support', 'Sign out']);
  });

  it('ST-18 is built since Phase 3: the manifest offers it to a Student who holds VR (B3-07 f1)', () => {
    expect(BUILT_SCREENS.has('ST-18')).toBe(true);
    const { panel } = openMenu('student', { deviceEligible: true });
    expect(itemNames(panel)).toEqual(['My device', 'Help & support', 'Sign out']);
  });

  it('hidden for a Student without AR / VR / MR (B3-07 frame 2 "Entry hidden")', () => {
    const { panel } = openMenu('student', { deviceEligible: false, built: ST18_BUILT });
    expect(itemNames(panel)).toEqual(XS_ITEMS('Student (WEB only or inactive)'));
  });

  it('shown first, to /student/device, when both hold', () => {
    const { panel } = openMenu('student', { deviceEligible: true, built: ST18_BUILT });
    expect(itemNames(panel)).toEqual(['My device', 'Help & support', 'Sign out']);
    expect(within(panel).getByRole('link', { name: 'My device' })).toHaveAttribute(
      'href',
      '/student/device',
    );
  });

  it('never for another role, even when eligible and built', () => {
    for (const role of PLATFORM_ROLES.filter((candidate) => candidate !== 'student')) {
      const links = accountMenuLinks(role, {
        deviceEligible: true,
        built: ST18_BUILT,
        onSignOut: () => {},
      });
      expect(links.map((link) => link.label)).toEqual(['Help & support']);
    }
  });
});

describe('Sign out and the absence of developer controls', () => {
  it('Sign out calls the injected callback once, closes the menu and returns focus to the button', () => {
    const { button, panel, onSignOut } = openMenu('faculty');
    act(() => within(panel).getByRole('button', { name: 'Sign out' }).click());
    expect(onSignOut).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });

  it('no switcher, selector, "Viewing as" or sample-account list in any menu', () => {
    for (const role of PLATFORM_ROLES) {
      const { panel, button, unmount } = openMenu(role, {
        deviceEligible: true,
        built: ST18_BUILT,
      });
      const text = `${button.getAttribute('aria-label')} ${panel.textContent}`;
      expect(text).not.toMatch(/switch|viewing as|demo|sample|choose a workspace|another role/i);
      expect(panel.querySelectorAll('select, input, [role="menu"], [role="listbox"]')).toHaveLength(
        0,
      );
      unmount();
    }
  });

  it.each(PLATFORM_ROLES.map((role) => [ROLE_LABEL[role], role] as const))(
    'axe (WCAG 2.2 AA): %s menu open',
    async (_label, role) => {
      const { panel } = openMenu(role, { deviceEligible: true, built: ST18_BUILT });
      await assertNoAxeViolations(panel.closest('.xr-acct')!.parentElement!);
      expect(panel.closest('.rk-x-popover')).not.toBeNull();
    },
  );
});
