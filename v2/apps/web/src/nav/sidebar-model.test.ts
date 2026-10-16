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

describe('the built-screen manifest (Phase 0 + Packages 1A, 1D, 2A, 2B, Phase 3 and Phase 4A)', () => {
  it('builds Help & support (XS-07) everywhere, the Super Admin’s Overview, Requests and Institutions, and Phase 2’s Institute Admin and Student screens (Packages 2A, 2B)', () => {
    expect([...BUILT_SCREENS]).toEqual([
      'ST-01',
      'XS-07',
      // Phase 4A: the faculty base's own page.
      'FA-01',
      'IA-01',
      // Phase 5: the three platform homes.
      'VE-01',
      'RV-01',
      'CM-01',
      'SA-01',
      'SA-02',
      'SA-03',
      'SA-06',
      'SA-07',
      'IA-02',
      'IA-16',
      'IA-03',
      'IA-04',
      'IA-05',
      'IA-06',
      'IA-08',
      'IA-13',
      'IA-15',
      'IA-07',
      'IA-10',
      'ST-02',
      'ST-04',
      'ST-03',
      'ST-05',
      'ST-19',
      'IA-09',
      'IA-11',
      'IA-14',
      // Phase 3.
      'ST-06',
      'ST-07',
      'ST-08',
      'ST-09',
      'ST-10',
      'ST-16',
      'ST-17',
      'ST-15',
      'ST-18',
      'IA-17',
      'IA-18',
      'IA-19',
      'IA-20',
      'SA-18',
      'SA-19',
      // Phase 4A.
      'FA-02',
      'FA-04',
      'FA-03',
      'FA-05',
      'FA-06',
      'FA-07',
      'FA-08',
      'FA-09',
      'FA-10',
      'FA-11',
      'FA-14',
      'FA-15',
      // Phase 4B (ST-13 is focused: no sidebar).
      'ST-11',
      'ST-12',
      'ST-14',
      'FA-12',
      'FA-16',
      'FA-17',
      'FA-18',
      'FA-19',
      'FA-20',
      'FA-21',
      // Phase 5.
      'VE-02',
      'VE-03',
      'VE-04',
      'VE-05',
      'VE-06',
      'VE-07',
      'VE-13',
      'VE-09',
      'VE-08',
      'RV-02',
      'RV-03',
      'RV-06',
      'RV-05',
      'CM-02',
      'CM-03',
      'CM-04',
      'CM-05',
      'CM-09',
    ]);
  });

  it('Phase 5: the Vendor, Academic Reviewer and Content Manager sidebars list their built destinations — not Updates (CM-08, Phase 6) — each current on its own screens, nothing current on a message page', () => {
    const rows = (
      role: (typeof PLATFORM_ROLES)[number],
      screen: Parameters<typeof sidebarModel>[1]['screen'],
    ) =>
      sidebarModel(role, { screen }).destinations.map((item) => [
        item.label,
        item.href,
        item.current,
      ]);
    expect(rows('vendor', 'VE-08')).toEqual([
      ['Overview', '/vendor', false],
      ['My experiments', '/vendor/experiments', true],
    ]);
    expect(rows('academic_reviewer', 'RV-06')).toEqual([
      ['Overview', '/reviewer', false],
      ['Review queue', '/reviewer/queue', true],
      ['Reviewed by me', '/reviewer/reviewed', false],
    ]);
    expect(rows('content_manager', 'CM-05')).toEqual([
      ['Overview', '/content-manager', false],
      ['Ready to publish', '/content-manager/ready', false],
      ['Content library', '/content-manager/library', true],
      ['Course codes', '/content-manager/course-codes', false],
    ]);
    for (const role of ['vendor', 'academic_reviewer', 'content_manager'] as const) {
      const help = sidebarModel(role, { screen: 'XS-07' });
      expect(help.help).toEqual({ href: `${WORKSPACE_NAV[role].base}/help`, current: true });
      for (const screen of ['XS-06', 'PU-15'] as const) {
        const message = sidebarModel(role, { screen });
        expect(message.destinations.some((item) => item.current)).toBe(false);
        expect(message.help.current).toBe(false);
      }
    }
  });

  it('Faculty (Phases 4A, 4B): Overview, My courses, Assessments, Question bank, Marking, Students, then Help — each current on its own screens; the Marking count in words', () => {
    const help = sidebarModel('faculty', { screen: 'XS-07' });
    expect(help.destinations.map((item) => [item.label, item.href, item.current])).toEqual([
      ['Overview', '/faculty', false],
      ['My courses', '/faculty/courses', false],
      ['Assessments', '/faculty/assessments', false],
      ['Question bank', '/faculty/question-bank', false],
      ['Marking', '/faculty/marking', false],
      ['Students', '/faculty/students', false],
    ]);
    // B4-09 f0 "Marking 2, 2 written answers to mark" (board 06 `countText`).
    const counted = sidebarModel('faculty', { screen: 'XS-07', counts: { marking: 2 } });
    expect(counted.destinations.find((item) => item.label === 'Marking')?.count).toEqual({
      value: 2,
      label: '2 written answers to mark',
    });
    expect(help.help.current).toBe(true);
    const current = (screen: ScreenKey) =>
      sidebarModel('faculty', { screen })
        .destinations.filter((item) => item.current)
        .map((item) => item.label);
    expect(current('FA-01')).toEqual(['Overview']);
    for (const screen of ['FA-02', 'FA-03', 'FA-04', 'FA-05'] as const) {
      expect(current(screen)).toEqual(['My courses']);
    }
    for (const screen of ['FA-06', 'FA-07', 'FA-08', 'FA-09', 'FA-10', 'FA-11', 'FA-12'] as const) {
      expect(current(screen)).toEqual(['Assessments']);
    }
    for (const screen of ['FA-14', 'FA-15', 'FA-16', 'FA-17'] as const) {
      expect(current(screen)).toEqual(['Question bank']);
    }
    for (const screen of ['FA-18', 'FA-19'] as const) {
      expect(current(screen)).toEqual(['Marking']);
    }
    for (const screen of ['FA-20', 'FA-21'] as const) {
      expect(current(screen)).toEqual(['Students']);
    }
    for (const screen of ['XS-06', 'PU-15'] as const) {
      expect(current(screen)).toEqual([]);
    }
  });

  it('Institute Admin (Package 2A, Phase 3): Overview, Content access, Student access, People, Requests, Usage, then Help — each current on its own screens; no Requests count (DEV-17)', () => {
    const help = sidebarModel('tenant_admin', { screen: 'XS-07' });
    expect(help.destinations.map((item) => [item.label, item.href, item.current])).toEqual([
      ['Overview', '/institute', false],
      ['Content access', '/institute/content-access', false],
      ['Student access', '/institute/student-access', false],
      ['People', '/institute/people', false],
      ['Requests', '/institute/requests', false],
      ['Usage', '/institute/usage', false],
    ]);
    expect(help.destinations.every((item) => item.count === undefined)).toBe(true);
    expect(help.help.current).toBe(true);
    const current = (screen: ScreenKey) =>
      sidebarModel('tenant_admin', { screen })
        .destinations.filter((item) => item.current)
        .map((item) => item.label);
    expect(current('IA-01')).toEqual(['Overview']);
    expect(current('IA-02')).toEqual(['Content access']);
    expect(current('IA-03')).toEqual(['Content access']);
    expect(current('IA-04')).toEqual(['Student access']);
    expect(current('IA-05')).toEqual(['Student access']);
    for (const screen of ['IA-06', 'IA-07', 'IA-08', 'IA-10'] as const) {
      expect(current(screen)).toEqual(['People']);
    }
    for (const screen of ['IA-17', 'IA-18', 'IA-19', 'institute-request-detail'] as const) {
      expect(current(screen)).toEqual(['Requests']);
    }
    expect(current('IA-20')).toEqual(['Usage']);
    for (const screen of ['XS-06', 'PU-15'] as const) {
      expect(current(screen)).toEqual([]);
    }
  });

  it('Student (Package 2A, Phases 3, 4B): Home, My courses, Assessments and Progress, then Help — My courses current on a course, an experiment, its tabs, format pages, feedback and its refusal; Assessments on ST-11, ST-12 and ST-14; nothing on My device', () => {
    const help = sidebarModel('student', { screen: 'XS-07' });
    expect(help.destinations.map((item) => [item.label, item.href, item.current])).toEqual([
      ['Home', '/student', false],
      ['My courses', '/student/courses', false],
      ['Assessments', '/student/assessments', false],
      ['Progress', '/student/progress', false],
    ]);
    const current = (screen: ScreenKey) =>
      sidebarModel('student', { screen })
        .destinations.filter((item) => item.current)
        .map((item) => item.label);
    expect(current('ST-01')).toEqual(['Home']);
    for (const screen of [
      'ST-02',
      'ST-03',
      'ST-05',
      'ST-06',
      'ST-07',
      'ST-08',
      'ST-09',
      'ST-10',
      'ST-16',
      'ST-17',
      'ST-19',
      'student-hub-assessment',
    ] as const) {
      expect(current(screen)).toEqual(['My courses']);
    }
    for (const screen of ['ST-11', 'ST-12', 'ST-14'] as const) {
      expect(current(screen)).toEqual(['Assessments']);
    }
    expect(current('ST-15')).toEqual(['Progress']);
    expect(current('ST-18')).toEqual([]);
    for (const screen of ['XS-06', 'PU-15'] as const) {
      expect(current(screen)).toEqual([]);
    }
  });

  it('Super Admin: Overview, Requests, Institutions and Operations (Phase 3), then Help — each current on its own screens, the Requests count in words', () => {
    const help = sidebarModel('super_admin', { screen: 'XS-07' });
    expect(help.destinations.map((item) => [item.label, item.href, item.current])).toEqual([
      ['Overview', '/admin', false],
      ['Requests', '/admin/requests', false],
      ['Institutions', '/admin/institutions', false],
      ['Operations', '/admin/operations/device-transfers', false],
    ]);
    expect(help.help.current).toBe(true);
    const current = (screen: ScreenKey) =>
      sidebarModel('super_admin', { screen })
        .destinations.filter((item) => item.current)
        .map((item) => item.label);
    expect(current('SA-01')).toEqual(['Overview']);
    expect(current('SA-06')).toEqual(['Institutions']);
    expect(current('SA-07')).toEqual(['Institutions']);
    expect(current('SA-18')).toEqual(['Operations']);
    expect(current('SA-19')).toEqual(['Operations']);
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
      expect(message.destinations.map((item) => item.current)).toEqual([
        false,
        false,
        false,
        false,
      ]);
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
