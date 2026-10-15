/**
 * The link-target ledger's rules (ADR-0005 §8; Appendix F WP-0.13 acceptance 9): every drawn
 * action reaches a built page in every workspace, except the one documented dead link; no primary
 * action resolves to the page it is on. The browser suite (`e2e/foundation/navigation.spec.ts`)
 * follows the same links for real and checks the ledger lists every action a Phase-0 page renders.
 */
import { WORKSPACES } from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

import { BUILT_SCREENS } from './built-screens';
import { expandTarget, LINK_TARGET_LEDGER } from './link-targets';
import { resolveAddress } from './routes';

const BASES = WORKSPACES.map((workspace) => `/${workspace}`);

describe('the link-target ledger', () => {
  it('names the built screens and the shell, each action once per place', () => {
    expect(new Set(LINK_TARGET_LEDGER.map((entry) => entry.screen))).toEqual(
      new Set([
        'Shell',
        'Public shell',
        'XS-01',
        'XS-05',
        'XS-06',
        'XS-07',
        'XS-08',
        'PU-01',
        'PU-02',
        'PU-03',
        'PU-04',
        'PU-05',
        'PU-06',
        'PU-07',
        'PU-08',
        'PU-09',
        'PU-10',
        'PU-12',
        'PU-15',
        'SA-01',
        'SA-02',
        'SA-03',
        'SA-06',
        'SA-07',
        // Package 2A.
        'IA-01',
        'IA-02',
        'IA-03',
        'IA-04',
        'IA-05',
        'IA-06',
        'IA-07',
        'IA-08',
        'IA-10',
        'ST-01',
        'ST-02',
        'ST-03',
        'ST-05',
        'ST-19',
        // Package 2B.
        'IA-09',
        'IA-11',
        'IA-13',
        'IA-14',
        'IA-15',
        'IA-16',
        'ST-04',
        // Phase 3.
        'ST-06',
        'ST-07',
        'ST-08',
        'ST-09',
        'ST-10',
        'ST-15',
        'ST-16',
        'ST-17',
        'ST-18',
        'IA-17',
        'IA-18',
        'IA-19',
        'IA-20',
        'SA-18',
        'SA-19',
        // Phase 4A.
        'FA-01',
        'FA-02',
        'FA-03',
        'FA-04',
        'FA-05',
        'FA-06',
        'FA-07',
        'FA-08',
        'FA-09',
        'FA-10',
        'FA-11',
        'FA-14',
        'FA-15',
      ]),
    );
    const keys = LINK_TARGET_LEDGER.map(
      (entry) => `${entry.screen}|${entry.where}|${entry.action}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
    for (const entry of LINK_TARGET_LEDGER) expect(entry.board.length).toBeGreaterThan(0);
  });

  it('every link marked built reaches a built page in all seven workspaces', () => {
    for (const entry of LINK_TARGET_LEDGER.filter((item) => item.outcome === 'built')) {
      for (const base of BASES) {
        const target = expandTarget(entry.target!, base).split('?')[0]!;
        const outcome = resolveAddress(target);
        expect(
          ['screen', 'record-screen', 'sign-in', 'public-screen'],
          `${entry.screen} ${entry.action} in ${base}`,
        ).toContain(outcome.kind);
      }
    }
  });

  it('a drawn action whose page is not built is not rendered, and names that unbuilt page', () => {
    const hidden = LINK_TARGET_LEDGER.filter((entry) => entry.outcome === 'not-rendered');
    // Every way into PU-07 renders since Package 1C built it, SA-03's "View institution" since
    // Package 1D built SA-07, SA-07's Operations row since Phase 3 built SA-18; what stays hidden
    // on the Super Admin's pages waits for Phase 6 (Support SA-20, Access ending SA-22).
    expect(
      hidden
        .filter((entry) => entry.screen.startsWith('SA-'))
        .map((entry) => `${entry.screen} ${entry.action}`),
    ).toEqual(['SA-07 Operations › Access ending', 'SA-18 Support · Access ending']);
    for (const entry of hidden) {
      expect(entry.note, `${entry.screen} ${entry.action}`).toMatch(/not built/);
      const target = expandTarget(entry.target!, '/admin');
      const kind = resolveAddress(target).kind;
      if (target.includes('?tab=')) {
        // A tab of a built page (Package 2A: Course codes, Groups, Faculty courses, All
        // experiments): the screen the note names is not built.
        const named = /\b((?:IA|ST|FA)-\d\d)\b/.exec(entry.note!)?.[1];
        expect(named, entry.action).toBeDefined();
        expect(BUILT_SCREENS.has(named as never), `${entry.screen} ${entry.action}`).toBe(false);
      } else if (kind === 'record-screen' && /SACC-14/.test(entry.note!)) {
        // Phase 3: a built page whose view of this action waits on an open decision (ST-01 / ST-02
        // "earlier work" → ST-15 while SACC-14 is open: the service gives no earlier-work row).
        expect(entry.target, entry.action).toBe('/student/progress');
      } else {
        expect(['public-not-found', 'workspace-not-found'], entry.action).toContain(kind);
      }
    }
    // Every not-rendered action names the screen it waits for. Phase 3 built its fifteen ids, Phase
    // 4A thirteen: what stays hidden waits for Phase 4B (ST-11 assessments, FA-12 submissions,
    // FA-16 drafting, FA-17 import, FA-18 marking, FA-20 students), Phase 6 (SA-20, SA-22) or
    // SACC-14 (ST-15's earlier work).
    expect(
      new Set(hidden.map((entry) => /\b((?:IA|ST|SA|FA)-\d\d)\b/.exec(entry.note!)?.[1])),
    ).toEqual(
      new Set(['SA-22', 'ST-11', 'ST-15', 'SA-20', 'FA-12', 'FA-16', 'FA-17', 'FA-18', 'FA-20']),
    );
  });

  it('"Back to Home" goes to the interim landing, which lands on that workspace’s Help — or to a built home (SA-01, IA-01, ST-01, FA-01)', () => {
    const homes = LINK_TARGET_LEDGER.filter((item) => item.outcome === 'interim-landing');
    expect(homes.map((entry) => entry.action)).toEqual([
      'Back to Home',
      'Back to Home',
      'Back to Home',
    ]);
    for (const entry of homes) {
      for (const base of BASES) {
        // Built homes (Package 1D: SA-01; Package 2A: IA-01, ST-01; Phase 4A: FA-01); the other
        // bases land on Help.
        const home = {
          '/admin': 'SA-01',
          '/institute': 'IA-01',
          '/student': 'ST-01',
          '/faculty': 'FA-01',
        }[base];
        expect(resolveAddress(expandTarget(entry.target!, base))).toEqual(
          home
            ? { kind: 'record-screen', workspace: base.slice(1), screen: home }
            : { kind: 'interim-landing', workspace: base.slice(1), lands: `${base}/help` },
        );
      }
    }
  });

  it('no dead link remains: PU-15’s "Browse experiments" reaches the built catalogue (Package 1B)', () => {
    expect(LINK_TARGET_LEDGER.filter((entry) => entry.outcome === 'dead-link')).toEqual([]);
    expect(
      LINK_TARGET_LEDGER.find(
        (entry) => entry.screen === 'PU-15' && entry.action === 'Browse experiments',
      ),
    ).toMatchObject({ outcome: 'built', target: '/experiments' });
    expect(resolveAddress('/experiments')).toEqual({ kind: 'public-screen', screen: 'PU-04' });
  });

  it('the one external link is the experiment’s preview, and no seeded experiment has one', () => {
    expect(
      LINK_TARGET_LEDGER.filter((entry) => entry.outcome === 'external').map(
        (entry) => `${entry.screen} ${entry.action}`,
      ),
    ).toEqual(['PU-06 Open preview']);
  });

  it('Sign out reaches the built sign-in card’s “Signed out” notice (XS-03, Package 1A)', () => {
    const signOut = LINK_TARGET_LEDGER.find((entry) => entry.action === 'Sign out')!;
    expect(signOut).toMatchObject({ outcome: 'built', target: '/sign-in?reason=signed-out' });
    expect(resolveAddress('/sign-in')).toEqual({ kind: 'sign-in' });
  });

  it('every public page pattern resolves to its public screen', () => {
    const patterns: Readonly<Record<string, string>> = {
      'PU-01': '/',
      'PU-02': '/areas',
      'PU-03': '/areas/{areaId}',
      'PU-04': '/experiments',
      'PU-05': '/courses/{courseId}',
      'PU-06': '/experiments/{experimentId}',
      'PU-07': '/selection',
      'PU-08': '/request-access',
      'PU-09': '/request-access/sent',
      'PU-10': '/requests/{routeId}',
      'PU-12': '/requests/{routeId}/payment',
    };
    for (const entry of LINK_TARGET_LEDGER.filter((item) => item.screen in patterns)) {
      expect(entry.on).toBe(patterns[entry.screen]);
      expect(resolveAddress(expandTarget(entry.on, '/admin'))).toEqual({
        kind: 'public-screen',
        screen: entry.screen,
      });
    }
  });

  it('in-page actions are commands, jumps or not rendered at all', () => {
    for (const entry of LINK_TARGET_LEDGER.filter((item) => item.outcome === 'in-page')) {
      expect(entry.target === null || entry.target.startsWith('#'), entry.action).toBe(true);
    }
  });

  /**
   * A concrete address of the page an action is on, for its pattern: XS-06 shows on another
   * workspace's page (its Help, and its bare base), the in-shell PU-15 on an unknown address, the
   * public PU-15 anywhere outside the workspaces.
   */
  function pagesFor(on: string, base: string): string[] {
    const other = BASES.find((candidate) => candidate !== base)!;
    switch (on) {
      case '<other-base>/*':
        return [`${other}/help`, other, `${other}/help/report`];
      case '<base>/[...unmatched]':
        return [`${base}/zz-unknown`, `${base}/zz-unknown/deeper`];
      case '/*':
        return ['/zz-unknown', '/requests', '/request-access/other'];
      case '<public>/*':
        return [
          '/',
          '/areas',
          '/areas/mechanical-manufacturing',
          '/experiments',
          '/courses/thermodynamics-heat-transfer',
          '/experiments/shell-and-tube-heat-exchanger',
          '/selection',
          '/request-access',
          '/request-access/sent',
          '/requests/rq-0012',
          '/requests/rq-0012/payment',
          '/zz-unknown',
        ];
      case '/admin/*':
        return ['/admin/help', '/admin/requests', '/admin/requests/REQ-0038'];
      case '/institute/*':
        return ['/institute', '/institute/help', '/institute/people/students/per-0002'];
      case '/student/*':
        return ['/student', '/student/help', '/student/courses'];
      case '/faculty/*':
        return ['/faculty', '/faculty/help', '/faculty/courses'];
      case '<base>/*':
        return [`${base}/help`, `${base}/help/report`, `${base}/help/reports/SUP-0213`];
      default:
        return [expandTarget(on, base)];
    }
  }

  it('the page patterns name real pages of the kind the entry says', () => {
    for (const entry of LINK_TARGET_LEDGER) {
      for (const base of BASES) {
        for (const page of pagesFor(entry.on, base)) {
          expect(page.includes('<') || page.includes('*'), `${entry.action}: ${page}`).toBe(false);
          const kind = resolveAddress(page).kind;
          if (entry.screen === 'PU-15' && entry.on === '/*') expect(kind).toBe('public-not-found');
          if (entry.on === '<base>/[...unmatched]') expect(kind).toBe('workspace-not-found');
        }
      }
    }
  });

  it('no primary action resolves to the page it is on (acceptance 9)', () => {
    for (const entry of LINK_TARGET_LEDGER.filter((item) => item.role === 'primary')) {
      if (entry.target === null) continue; // a command (Send report), not a link
      for (const base of BASES) {
        const target = expandTarget(entry.target, base);
        const resolved = resolveAddress(target);
        const lands = resolved.kind === 'interim-landing' ? resolved.lands : target;
        for (const page of pagesFor(entry.on, base)) {
          expect(lands, `${entry.screen} ${entry.action} on ${page}`).not.toBe(page);
          expect(target, `${entry.screen} ${entry.action} on ${page}`).not.toBe(page);
        }
      }
    }
  });

  it('every page has exactly one primary action, where board 08 draws one', () => {
    const primaries = LINK_TARGET_LEDGER.filter((entry) => entry.role === 'primary');
    expect(primaries.map((entry) => `${entry.screen}: ${entry.action}`)).toEqual([
      'XS-06: Back to Home',
      'PU-15: Back to Home',
      'PU-15: Browse experiments',
      'XS-07: Report a problem',
      'XS-07: Send report',
      'XS-07: View my reports',
      'XS-01: Sign in',
      'SA-03: (the panel’s button: Approve request · Approve smaller scope · Send request for information)',
      // Package 1D: SA-07's one primary per drawn state — no Institute Admin (B7-03 f1), paused (f2).
      'SA-07: Assign Institute Admin',
      'SA-07: Restore access',
      'PU-01: Browse experiments',
      'PU-03: Browse N experiments',
      'PU-06: Add to selection',
      // Package 1C: one primary per drawn state — PU-07 the summary's (from 1024 px) or the bottom
      // bar's (below it), or the empty state's; PU-08 per step; PU-10 per status (B1-08 f0/f4, f7,
      // f8/f9, and the not-found page); PU-12 its one button.
      'PU-07: Continue to request',
      'PU-07: Continue to request',
      'PU-07: Browse experiments',
      'PU-08: Review request',
      'PU-08: Submit request',
      'PU-09: Check request status',
      'PU-10: Continue to payment',
      'PU-10: Try payment again',
      'PU-10: Sign in',
      'PU-10: Browse experiments',
      'PU-12: Continue to payment',
      // Package 2A: one primary per drawn state — IA-05 per step and its result; IA-06 per tab
      // (Students, and Faculty as IA-08); IA-07 active or inactive; IA-10 the form and its result.
      'IA-01: Give students access',
      'IA-02: Give students access',
      // Package 2B: IA-16 draws two (B2-03 f6: the header's and the form's "Save course codes").
      'IA-16: Give students access',
      'IA-16: Save course codes',
      'IA-03: Give students access',
      'IA-04: Give students access',
      'IA-05: Continue',
      'IA-05: Give access',
      'IA-05: View Student access',
      // Phase 3: f16's "Request renewal" opens Requests to BITS (IA-17).
      'IA-05: Request renewal',
      'IA-06: Add student',
      'IA-08: Add faculty member',
      'IA-07: Give this student access',
      'IA-07: Reactivate account',
      'IA-10: Add student · Add faculty member',
      'IA-10: Give this student access',
      // Package 2B: IA-10's faculty result (B2-07 f3); IA-11 per step and its result; one each on
      // IA-09, IA-13, IA-14 and IA-15.
      'IA-10: Assign a course',
      'IA-09: Assign a course',
      'IA-11: Check file · Choose the corrected file · Continue · Import N students',
      'IA-11: Give students access',
      'IA-13: Create group',
      'IA-14: Add students',
      'IA-15: Assign course',
      'ST-01: Open <experiment> · Continue <experiment>',
      // Phase 3: ST-05's Next step (one variant at a time), the hub tabs, the format pages,
      // feedback, My device, the Institute Admin's requests and the Super Admin's decision.
      'ST-05: Open resources',
      'ST-05: Continue WEB',
      'ST-05: Choose a format',
      'ST-19: Back to My courses',
      'ST-06: Try again',
      'ST-07: Open WEB · Continue WEB',
      'ST-08: Launch WEB · Continue WEB · Try again',
      'ST-08: Give feedback on WEB',
      'ST-09: Give feedback on VR',
      'ST-09: Back to Simulation',
      'ST-16: Submit feedback',
      'ST-17: Back to experiment',
      'ST-18: Request a device transfer',
      'ST-18: Send request',
      'IA-17: Ask BITS for a renewal or more licences',
      'IA-17: Send request to BITS',
      'IA-17: Back to Requests',
      'IA-17: Open the payment page',
      'IA-19: Forward to BITS',
      'SA-19: Approve transfer',
      // Phase 4A: one primary per drawn state; FA-01's and FA-08's marking actions are drawn
      // primaries that are not rendered until FA-18 is built (DEV-21).
      'FA-01: Mark <n> written answer',
      'FA-05: Open assessment',
      'FA-05: Create assessment',
      'FA-05: Continue setting up',
      'FA-06: Create assessment',
      'FA-06: Create assessment',
      'FA-07: Continue',
      'FA-07: Create assessment',
      'FA-07: Open assessment',
      'FA-08: Add questions',
      'FA-08: Mark next',
      'FA-09: Add from question bank',
      'FA-09: Add from question bank',
      'FA-10: Save settings',
      'FA-14: Add a question',
      'FA-15: Save question',
      'FA-15: Save question',
    ]);
  });
});
