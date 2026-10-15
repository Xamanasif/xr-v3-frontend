/**
 * The sidebar of each workspace (Appendix F WP-0.8 acceptance 2, 5, 6): built-screen gating — in
 * Phase 0 each sidebar shows only Help, and adding a screen id renders its item in board order —
 * the current item from the explicit map, nothing current on message pages, counts in words.
 */
import { PLATFORM_ROLES, ROLE_LABEL } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { BUILT_SCREENS } from './built-screens';
import { BOARD_ICON, WORKSPACE_NAV } from './nav-config';
import type { ScreenKey } from './screens';
import { countLabel, sidebarModel } from './sidebar-model';

const everyScreen = (role: (typeof PLATFORM_ROLES)[number]): ReadonlySet<ScreenKey> =>
  new Set<ScreenKey>([
    'XS-07',
    ...WORKSPACE_NAV[role].destinations.map((destination) => destination.screen),
  ]);

describe('the built-screen manifest (Phase 0 + Packages 1A and 1D)', () => {
  it('builds Help & support (XS-07) everywhere and the Super Admin’s Overview, Requests and Institutions', () => {
    expect([...BUILT_SCREENS]).toEqual(['XS-07', 'SA-01', 'SA-02', 'SA-03', 'SA-06', 'SA-07']);
  });

  it.each(
    PLATFORM_ROLES.filter((role) => role !== 'super_admin').map(
      (role) => [ROLE_LABEL[role], role] as const,
    ),
  )(
    '%s: the sidebar shows only Help, current on the Help pages, not current on a message page',
    (_label, role) => {
      const help = sidebarModel(role, { screen: 'XS-07' });
      expect(help.destinations).toEqual([]);
      expect(help.help).toEqual({ href: `${WORKSPACE_NAV[role].base}/help`, current: true });
      for (const screen of ['XS-06', 'PU-15'] as const) {
        const message = sidebarModel(role, { screen });
        expect(message.destinations).toEqual([]);
        expect(message.help.current).toBe(false);
      }
    },
  );

  it('Super Admin: Overview, Requests, Institutions, then Help — each current on its own screens, the Requests count in words', () => {
    const help = sidebarModel('super_admin', { screen: 'XS-07' });
    expect(help.destinations.map((item) => [item.label, item.href, item.current])).toEqual([
      ['Overview', '/admin', false],
      ['Requests', '/admin/requests', false],
      ['Institutions', '/admin/institutions', false],
    ]);
    expect(help.help.current).toBe(true);
    const current = (screen: ScreenKey) =>
      sidebarModel('super_admin', { screen })
        .destinations.filter((item) => item.current)
        .map((item) => item.label);
    expect(current('SA-01')).toEqual(['Overview']);
    expect(current('SA-06')).toEqual(['Institutions']);
    expect(current('SA-07')).toEqual(['Institutions']);
    for (const screen of ['SA-02', 'SA-03'] as const) {
      const page = sidebarModel('super_admin', { screen, counts: { requests: 2 } });
      expect(page.destinations.find((item) => item.label === 'Requests')).toEqual({
        label: 'Requests',
        href: '/admin/requests',
        icon: BOARD_ICON.requests,
        current: true,
        count: { value: 2, label: '2 requests under review' },
      });
      expect(page.help.current).toBe(false);
    }
    for (const screen of ['XS-06', 'PU-15'] as const) {
      const message = sidebarModel('super_admin', { screen });
      expect(message.destinations.map((item) => item.current)).toEqual([false, false, false]);
      expect(message.help.current).toBe(false);
    }
    // No count at zero (board 05 `hasCount`).
    expect(
      sidebarModel('super_admin', { screen: 'SA-02', counts: { requests: 0 } }).destinations[1]!
        .count,
    ).toBeUndefined();
  });
});

describe('built-screen gating: adding a screen id renders its item, in board order', () => {
  it.each(PLATFORM_ROLES.map((role) => [ROLE_LABEL[role], role] as const))(
    '%s: every destination once all are built; any subset keeps board order',
    (_label, role) => {
      const config = WORKSPACE_NAV[role];
      const all = sidebarModel(role, { screen: 'XS-07', built: everyScreen(role) });
      expect(all.destinations.map((destination) => destination.label)).toEqual(
        config.destinations.map((destination) => destination.label),
      );
      expect(all.destinations.map((destination) => destination.icon)).toEqual(
        config.destinations.map((destination) => BOARD_ICON[destination.boardIcon]),
      );
      // Every other destination, from the last: the order is the board's, not the manifest's.
      const subset = config.destinations.filter((_destination, index) => index % 2 === 1).reverse();
      const some = sidebarModel(role, {
        screen: 'XS-07',
        built: new Set<ScreenKey>(['XS-07', ...subset.map((destination) => destination.screen)]),
      });
      expect(some.destinations.map((destination) => destination.label)).toEqual(
        config.destinations
          .filter((_destination, index) => index % 2 === 1)
          .map((destination) => destination.label),
      );
    },
  );

  it('a destination stays hidden while only its detail screens are built (it opens its own screen)', () => {
    const model = sidebarModel('faculty', {
      screen: 'FA-19',
      built: new Set<ScreenKey>(['XS-07', 'FA-19']),
    });
    expect(model.destinations).toEqual([]);
  });
});

describe('the current item', () => {
  it('a detail screen marks its destination current; only one item is current', () => {
    const model = sidebarModel('faculty', { screen: 'FA-19', built: everyScreen('faculty') });
    expect(model.destinations.filter((destination) => destination.current)).toEqual([
      expect.objectContaining({ label: 'Marking', href: '/faculty/marking' }),
    ]);
    expect(model.help.current).toBe(false);
  });

  it('message pages (XS-06, in-shell PU-15) and the Student’s My device mark nothing current', () => {
    for (const [role, screen] of [
      ['student', 'XS-06'],
      ['super_admin', 'PU-15'],
      ['student', 'ST-18'],
    ] as const) {
      const model = sidebarModel(role, { screen, built: everyScreen(role) });
      expect(model.destinations.some((destination) => destination.current)).toBe(false);
      expect(model.help.current).toBe(false);
    }
  });
});

describe('counts in words (board 06 "Counts … announced in words")', () => {
  const built = everyScreen('faculty');

  it('a figure with its drawn words; the boards’ singular for 1; nothing at zero or without a figure', () => {
    const count = (value: number | undefined) =>
      sidebarModel('faculty', {
        screen: 'FA-01',
        built,
        counts: { marking: value },
      }).destinations.find((destination) => destination.label === 'Marking')?.count;
    expect(count(12)).toEqual({ value: 12, label: '12 written answers to mark' });
    expect(count(1)).toEqual({ value: 1, label: '1 written answer to mark' });
    expect(count(0)).toBeUndefined();
    expect(count(undefined)).toBeUndefined();
  });

  it('a destination that counts nothing never shows a count', () => {
    const model = sidebarModel('faculty', { screen: 'FA-01', built, counts: { overview: 4 } });
    expect(model.destinations[0]?.count).toBeUndefined();
  });

  it('each workspace’s count words, as board 06 draws its sample figures', () => {
    const words = (role: (typeof PLATFORM_ROLES)[number], key: string) =>
      WORKSPACE_NAV[role].destinations.find((destination) => destination.key === key)!.countWords!;
    expect(countLabel(words('tenant_admin', 'requests'), 2)).toBe('2 device requests to forward');
    expect(countLabel(words('tenant_admin', 'requests'), 1)).toBe('1 device request to forward');
    expect(countLabel(words('academic_reviewer', 'review-queue'), 4)).toBe('4 waiting for review');
    expect(countLabel(words('content_manager', 'ready-to-publish'), 2)).toBe('2 ready to publish');
    expect(countLabel(words('super_admin', 'requests'), 3)).toBe('3 requests under review');
  });
});
