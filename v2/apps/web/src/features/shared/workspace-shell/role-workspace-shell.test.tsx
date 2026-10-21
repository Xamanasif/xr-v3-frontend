/**
 * One role's workspace shell, composed (Appendix F WP-0.8; Appendix A §3.1 "StudentShell" …
 * "SuperAdminShell"; boards 05, 06, 08, 12): landmarks, workspace label and line, built-screen
 * gating (Phase 0: Help only), the current item from the explicit map and none on message pages,
 * Help last, the top bar with XS-05 (the owner-approved XS panel under the v46 account button), the
 * XS-08 banner at the top of the page column, the skip link to `main#main`, and the
 * rail choice kept per person in memory. Layout and the responsive drawer / rail / full sidebar
 * are proved in a real browser on the specimen harness (apps/specimens/e2e/role-shells.spec.ts);
 * jsdom has no layout.
 */
import { act, render, screen, within } from '@testing-library/react';
import { DEVELOPER_SURFACE_TERMS } from '@xr/config/policy-terms';
import { PLATFORM_ROLES, ROLE_LABEL, type Role } from '@xr/domain';
import { assertNoAxeViolations } from '@xr/testing/axe';
import { ICON_PATHS } from '@xr/ui';
import { describe, expect, it, vi } from 'vitest';

import { helpPlacement } from '@/nav/help';
import { BOARD_ICON, WORKSPACE_NAV } from '@/nav/nav-config';
import { railPreference } from '@/nav/rail-preference';
import type { ScreenKey } from '@/nav/screens';
import { BOARD_ACCOUNT_ROWS, boardPerson } from '@/test-support/boards';

import { RoleWorkspaceShell, type RoleWorkspaceShellProps } from './role-workspace-shell';

const ALL_BUILT = (role: Role): ReadonlySet<ScreenKey> =>
  new Set<ScreenKey>(['XS-07', ...WORKSPACE_NAV[role].destinations.map((item) => item.screen)]);

function renderShell(role: Role, overrides: Partial<RoleWorkspaceShellProps> = {}) {
  const help = helpPlacement(role, { kind: 'reports' });
  const onSignOut = vi.fn();
  const view = render(
    <RoleWorkspaceShell
      role={role}
      person={boardPerson(role)}
      screen="XS-07"
      title={help.title}
      trail={help.trail}
      wrap="read"
      onSignOut={onSignOut}
      {...overrides}
    >
      <h1 className="xr-h1">Page</h1>
    </RoleWorkspaceShell>,
  );
  const aside = screen.getByRole('complementary', { name: `${ROLE_LABEL[role]} workspace` });
  return { ...view, aside, onSignOut };
}

const ROLES = PLATFORM_ROLES.map((role) => [ROLE_LABEL[role], role] as const);

describe('built so far: Help in every workspace and, since Phase 6, every designed destination', () => {
  it('Super Admin on Help & support: Overview, Requests, Institutions, Content, Academic structure, Platform roles, Operations, then Help (current)', () => {
    const { aside, container } = renderShell('super_admin');
    const nav = within(aside).getByRole('navigation', { name: 'Super Admin navigation' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.querySelector('.xr-nav-text')!.textContent)).toEqual([
      'Overview',
      'Requests',
      'Institutions',
      'Content',
      'Academic structure',
      'Platform roles',
      'Operations',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/admin',
      '/admin/requests',
      '/admin/institutions',
      '/admin/content/updates',
      '/admin/structure',
      '/admin/roles',
      '/admin/operations/device-transfers',
    ]);
    for (const link of links) expect(link).not.toHaveAttribute('aria-current');
    const help = within(aside).getAllByRole('link').at(-1)!;
    expect(help).toHaveAttribute('aria-current', 'page');
    expect(help.closest('.xr-side-foot')).not.toBeNull();
    const hrefs = [...container.querySelectorAll('a[href]')].map((link) =>
      link.getAttribute('href'),
    );
    expect(new Set(hrefs)).toEqual(
      new Set([
        '#main',
        '/admin',
        '/admin/requests',
        '/admin/institutions',
        '/admin/content/updates',
        '/admin/structure',
        '/admin/roles',
        '/admin/operations/device-transfers',
        '/admin/help',
      ]),
    );
  });

  // Phase 5 builds the last three workspaces' homes: every sidebar now lists its built
  // destinations (below); the platform roles keep no institution line (board 06).
  it.each([
    ['Vendor', 'vendor'],
    ['Academic Reviewer', 'academic_reviewer'],
    ['Content Manager', 'content_manager'],
  ] as const)('%s: the workspace label and no institution line', (label, role) => {
    const { aside } = renderShell(role);
    expect(aside.querySelector('.xr-ws-label')).toHaveTextContent(label);
    const row = BOARD_ACCOUNT_ROWS.get(label)!;
    if (row.line) expect(aside.querySelector('.xr-ws-inst')).toHaveTextContent(row.line);
    else expect(aside.querySelector('.xr-ws-inst')).toBeNull();
  });

  it.each([
    [
      'Institute Admin',
      'tenant_admin',
      ['Overview', 'Content access', 'Student access', 'People', 'Requests', 'Usage'],
    ],
    ['Student', 'student', ['Home', 'My courses', 'Assessments', 'Progress']],
    [
      'Faculty',
      'faculty',
      ['Overview', 'My courses', 'Assessments', 'Question bank', 'Marking', 'Students'],
    ],
    ['Vendor', 'vendor', ['Overview', 'My experiments']],
    ['Academic Reviewer', 'academic_reviewer', ['Overview', 'Review queue', 'Reviewed by me']],
    // Phase 6 adds Updates (CM-08).
    [
      'Content Manager',
      'content_manager',
      ['Overview', 'Ready to publish', 'Content library', 'Updates', 'Course codes'],
    ],
  ] as const)(
    '%s on Help & support (Package 2A, Phases 3 … 6): the built destinations, then Help (current)',
    (label, role, built) => {
      const { aside, container } = renderShell(role);
      const nav = within(aside).getByRole('navigation', { name: `${label} navigation` });
      const links = within(nav).getAllByRole('link');
      expect(links.map((link) => link.querySelector('.xr-nav-text')!.textContent)).toEqual([
        ...built,
      ]);
      for (const link of links) expect(link).not.toHaveAttribute('aria-current');
      const help = aside.querySelector('.xr-side-foot a')!;
      expect(help).toHaveAttribute('href', WORKSPACE_NAV[role].help.href);
      expect(help).toHaveAttribute('aria-current', 'page');
      // No link anywhere in the shell leads to an unbuilt screen.
      const hrefs = [...container.querySelectorAll('a[href]')].map((link) =>
        link.getAttribute('href'),
      );
      const destinations = WORKSPACE_NAV[role].destinations
        .filter((destination) => (built as readonly string[]).includes(destination.label))
        .map((destination) => destination.href);
      expect(new Set(hrefs)).toEqual(
        new Set(['#main', ...destinations, WORKSPACE_NAV[role].help.href]),
      );
    },
  );
});

describe('with every destination built (later phases): board 06 order, icons, Help last', () => {
  it.each(ROLES)('%s', (_label, role) => {
    const config = WORKSPACE_NAV[role];
    const first = config.destinations[0]!;
    const { aside } = renderShell(role, { screen: first.screen, built: ALL_BUILT(role) });
    const nav = within(aside).getByRole('navigation', { name: `${ROLE_LABEL[role]} navigation` });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.querySelector('.xr-nav-text')!.textContent)).toEqual(
      config.destinations.map((destination) => destination.label),
    );
    expect(links.map((link) => link.querySelector('path')!.getAttribute('d'))).toEqual(
      config.destinations.map((destination) => ICON_PATHS[BOARD_ICON[destination.boardIcon]]),
    );
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      config.destinations.map((destination) => destination.href),
    );
    // The first destination's own screen: it alone is current; Help comes after the nav.
    expect(links.map((link) => link.getAttribute('aria-current'))).toEqual([
      'page',
      ...config.destinations.slice(1).map(() => null),
    ]);
    const help = within(aside.querySelector('.xr-side-foot')!).getByRole('link');
    expect(help).not.toHaveAttribute('aria-current');
    expect(nav.compareDocumentPosition(help) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('the current item', () => {
  it('a detail screen marks its destination (B2-12 Experiment hub → My courses)', () => {
    const { aside } = renderShell('student', { screen: 'ST-05', built: ALL_BUILT('student') });
    expect(
      [...aside.querySelectorAll('[aria-current="page"]')].map((link) => link.textContent),
    ).toEqual(['My coursesMy courses']);
  });

  it.each(['XS-06', 'PU-15'] as const)(
    'message page %s: nothing is current, Help included (board 08)',
    (message) => {
      for (const role of PLATFORM_ROLES) {
        const { aside, unmount } = renderShell(role, {
          screen: message,
          title: 'Not your workspace',
          trail: [],
          built: ALL_BUILT(role),
        });
        expect(aside.querySelectorAll('[aria-current]')).toHaveLength(0);
        unmount();
      }
    },
  );
});

describe('the top bar, the account menu (XS-05), the skip link and main', () => {
  it.each(ROLES)('%s', (label, role) => {
    const { container, onSignOut } = renderShell(role);
    const app = container.querySelector('.xr-app')!;
    // Board 12 "Shell tab order": the skip link first, to main#main, which can take focus.
    expect(app.firstElementChild).toHaveClass('xr-skip');
    expect(app.firstElementChild).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('xr-top');
    expect(header.querySelector('.xr-top-title')).toHaveTextContent('Help & support');
    const row = BOARD_ACCOUNT_ROWS.get(label)!;
    const account = within(header).getByRole('button', { name: /^Account menu, / });
    expect(account).toHaveAccessibleName(
      `Account menu, ${[row.name, row.role, row.line].filter(Boolean).join(', ')}`,
    );
    // The v46 account button, the owner-approved XS panel (in a V3 root without a box).
    expect(account).toHaveClass('xr-acct-btn');
    act(() => account.click());
    const panel = header.querySelector('.rk-x-popover > .xs-menu') as HTMLElement;
    expect(panel).not.toBeNull();
    expect(within(panel).getByRole('link', { name: 'Help & support' })).toHaveAttribute(
      'href',
      WORKSPACE_NAV[role].help.href,
    );
    act(() => within(panel).getByRole('button', { name: 'Sign out' }).click());
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('a Help view names itself in the top bar; its own breadcrumb is in the page (XS)', () => {
    const report = helpPlacement('faculty', { kind: 'report' });
    const { container } = renderShell('faculty', { title: report.title, trail: report.trail });
    expect(container.querySelector('.xr-top-title')).toHaveTextContent('Report a problem');
    expect(report.trail).toEqual([]);
  });
});

describe('the XS-08 banner', () => {
  it.each([
    ['paused', 'Your institution’s access is paused — your work is kept.', 'rk-banner'],
    [
      'inactive',
      'Your account is inactive. Contact your institution administrator.',
      'rk-banner xs-banner--inactive',
    ],
  ] as const)(
    '%s: the XS words with this workspace’s Help, first in the page column',
    (kind, words, classes) => {
      const { container } = renderShell('student', { banner: kind });
      const banner = screen.getByRole('status');
      expect(banner).toHaveTextContent(words);
      expect(banner.className).toBe(classes);
      expect(within(banner).getByRole('link', { name: 'Help' })).toHaveAttribute(
        'href',
        '/student/help',
      );
      const region = container.querySelector('main .rk-x-region--banner');
      expect(region?.firstElementChild).toBe(banner);
      expect(region?.parentElement?.firstElementChild).toBe(region);
    },
  );

  it('no banner when the facts give none', () => {
    renderShell('student', { banner: null });
    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('the rail choice, kept in memory per person in this tab', () => {
  // jsdom has no layout, so the band here is always the full sidebar: this proves the store and
  // its wiring to WorkspaceShell's controlled preference. The bands themselves (rail, expand,
  // drawer) are proved in a browser (apps/specimens/e2e/role-shells.spec.ts, components-shells).
  it('"Collapse menu" records the choice for this person only; it outlives the shell', () => {
    // A role that keeps its v46 shell (the Institute Admin moved to the V3 shell with IA-v1).
    const person = { ...boardPerson('faculty'), id: 'rail-shell-person' };
    const { container, unmount } = renderShell('faculty', { person });
    expect(container.querySelector('.xr-shell')).not.toHaveClass('is-rail');
    act(() => screen.getByRole('button', { name: 'Collapse menu' }).click());
    expect(container.querySelector('.xr-shell')).toHaveClass('is-rail');
    expect(railPreference('rail-shell-person')).toBe('rail');
    unmount();
    // The same person's next shell keeps the choice; another person's does not.
    const again = renderShell('faculty', { person });
    expect(again.container.querySelector('.xr-shell')).toHaveClass('is-rail');
    again.unmount();
    const other = renderShell('faculty', {
      person: { ...person, id: 'rail-shell-other-person' },
    });
    expect(other.container.querySelector('.xr-shell')).not.toHaveClass('is-rail');
  });
});

describe('no developer surfaces and no unapproved controls (owner constraint; ADR-0003 §5)', () => {
  it.each(ROLES)(
    '%s: no DEMO, "Viewing as", switcher, selector or sample-account list',
    (_label, role) => {
      const { container } = renderShell(role, { built: ALL_BUILT(role), screen: 'XS-07' });
      act(() => screen.getByRole('button', { name: /^Account menu, / }).click());
      const text = [
        container.textContent ?? '',
        ...[...container.querySelectorAll('[aria-label]')].map((element) =>
          element.getAttribute('aria-label'),
        ),
      ].join(' ');
      for (const term of DEVELOPER_SURFACE_TERMS.filter((candidate) =>
        candidate.scope.includes('dom'),
      )) {
        expect(text, term.id).not.toMatch(term.pattern);
      }
      // The shell's only controls (boards 05, 06, 12; XS-05): the skip link, the sidebar's links
      // (the built destinations, then Help), Close menu, Menu, the rail toggle, the account button,
      // its outside-click layer (not a Tab stop) and its items (Help & support, Sign out). Nothing
      // else takes focus.
      const config = WORKSPACE_NAV[role];
      expect(
        within(container)
          .getAllByRole('link')
          .map((link) => link.getAttribute('href')),
      ).toEqual([
        '#main',
        ...config.destinations.map((destination) => destination.href),
        config.help.href,
        config.help.href,
      ]);
      expect(
        within(container)
          .getAllByRole('button')
          .map((button) => button.getAttribute('aria-label') ?? button.textContent),
      ).toEqual([
        'Close menu',
        'Open menu',
        'Collapse menu',
        expect.stringMatching(/^Account menu, /),
        'Close account menu',
        'Sign out',
      ]);
      expect(
        container.querySelectorAll(
          'input, select, textarea, [contenteditable], [tabindex]:not([tabindex="-1"])',
        ),
      ).toHaveLength(0);
    },
  );
});

describe('accessibility (axe, WCAG 2.2 AA)', () => {
  it.each(ROLES)('%s: Phase 0 and every destination built', async (_label, role) => {
    const phaseZero = renderShell(role);
    await assertNoAxeViolations(phaseZero.container);
    phaseZero.unmount();
    const built = renderShell(role, {
      screen: WORKSPACE_NAV[role].destinations[0]!.screen,
      built: ALL_BUILT(role),
      banner: 'paused',
    });
    await assertNoAxeViolations(built.container);
  });
});
