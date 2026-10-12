/**
 * The explicit sidebar active-item map (Appendix F WP-0.8; Appendix A §3.6; ADR-0005 §9) against
 * the route register's `sidebarActiveMap` (docs/v46/routes.json): every listed screen marks its
 * destination current, Help is current on XS-07, and the message pages mark nothing current
 * (board 08; Appendix E §4.2).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PLATFORM_ROLES, ROLE_LABEL, type Role } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { activeItemOwners, currentItem } from './active-item';
import { WORKSPACE_NAV } from './nav-config';
import { WORKSPACE_SCREEN_IDS, type ScreenKey } from './screens';

const REGISTER = JSON.parse(
  readFileSync(
    join(import.meta.dirname, '..', '..', '..', '..', 'docs', 'v46', 'routes.json'),
    'utf8',
  ),
) as { readonly sidebarActiveMap: Readonly<Record<string, Readonly<Record<string, string>>>> };

/** The register's words for the two views without an id (Appendix A §4.2). */
const UNNUMBERED: Readonly<Record<string, ScreenKey>> = {
  'hub Assessment tab': 'student-hub-assessment',
  'IA request detail': 'institute-request-detail',
};

/** "ST-05…ST-10, hub Assessment tab, ST-16 (B2-12 …)" → the screen keys it names. */
function screensIn(cell: string): ScreenKey[] {
  const keys: ScreenKey[] = [];
  const text = cell.replace(/\(even when[^)]*\)|\(B[^)]*\)|\(ST-13 has no sidebar\)/g, '');
  for (const [phrase, key] of Object.entries(UNNUMBERED)) if (text.includes(phrase)) keys.push(key);
  for (const [, prefix, from, to] of text.matchAll(/([A-Z]{2})-(\d{2})(?:…[A-Z]{2}-(\d{2}))?/g)) {
    const last = Number(to ?? from);
    for (let number = Number(from); number <= last; number += 1) {
      keys.push(`${prefix}-${String(number).padStart(2, '0')}` as ScreenKey);
    }
  }
  return keys;
}

describe('the active-item map equals the route register (Appendix A §3.6)', () => {
  it.each(PLATFORM_ROLES.map((role) => [ROLE_LABEL[role], role] as const))(
    '%s: each destination owns exactly the register’s screens; Help owns XS-07',
    (label, role) => {
      const register = REGISTER.sidebarActiveMap[label]!;
      const config = WORKSPACE_NAV[role];
      const owners = activeItemOwners(role);
      expect(Object.keys(owners)).toEqual(
        config.destinations.map((destination) => destination.key),
      );
      for (const destination of config.destinations) {
        // CM-08 "list + detail (incl. drafts opened by CM-06 / CM-07; B6-09)".
        const expected = screensIn(register[destination.label]!);
        expect([...owners[destination.key]!].sort(), destination.label).toEqual(
          [...new Set(expected)].sort(),
        );
        // A destination's own screen marks it current.
        expect(currentItem(role, destination.screen)).toBe(destination.key);
        for (const screen of expected)
          expect(currentItem(role, screen), screen).toBe(destination.key);
      }
      expect(screensIn(register['Help']!)).toEqual(['XS-07']);
      expect(currentItem(role, 'XS-07')).toBe('help');
      // "(none)" (Student: ST-18 My device and XS-06) and the in-shell not-found page.
      for (const screen of screensIn(register['(none)'] ?? 'XS-06')) {
        expect(currentItem(role, screen), screen).toBeNull();
      }
      expect(currentItem(role, 'XS-06')).toBeNull();
      expect(currentItem(role, 'PU-15')).toBeNull();
    },
  );

  it('every workspace screen has exactly one owner in its own workspace (or nothing current)', () => {
    const shared = new Set<ScreenKey>(['XS-06', 'XS-07', 'PU-15']);
    const prefix: Readonly<Record<string, Role>> = {
      ST: 'student',
      FA: 'faculty',
      IA: 'tenant_admin',
      VE: 'vendor',
      RV: 'academic_reviewer',
      CM: 'content_manager',
      SA: 'super_admin',
    };
    for (const screen of WORKSPACE_SCREEN_IDS) {
      if (shared.has(screen)) continue;
      const role = prefix[screen.slice(0, 2)]!;
      const owners = Object.entries(activeItemOwners(role)).filter(([, screens]) =>
        screens.includes(screen),
      );
      if (screen === 'ST-18') expect(owners).toEqual([]);
      else
        expect(
          owners.map(([key]) => key),
          screen,
        ).toHaveLength(1);
    }
  });

  it('a screen of another workspace is refused (the workspace guard shows XS-06 instead)', () => {
    expect(() => currentItem('student', 'FA-01')).toThrow(
      'Screen FA-01 is not part of the student workspace.',
    );
    expect(() => currentItem('super_admin', 'ST-19')).toThrow(/not part of the super_admin/);
  });

  it('ST-19 follows the register (My courses); the board-08 variance stays open for Phase 2', () => {
    expect(currentItem('student', 'ST-19')).toBe('my-courses');
  });
});
