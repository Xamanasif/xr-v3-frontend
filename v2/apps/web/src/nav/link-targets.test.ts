/**
 * The link-target ledger's rules (ADR-0005 §8; Appendix F WP-0.13 acceptance 9): every drawn
 * action reaches a built page in every workspace, except the one documented dead link; no primary
 * action resolves to the page it is on. The browser suite (`e2e/foundation/navigation.spec.ts`)
 * follows the same links for real and checks the ledger lists every action a Phase-0 page renders.
 */
import { WORKSPACES } from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

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
    // Package 1D built SA-07; SA-07's Operations rows wait for Operations (Phases 3 and 6).
    expect(hidden.map((entry) => `${entry.screen} ${entry.action}`)).toEqual([
      'SA-07 Operations · Operations › Access ending',
    ]);
    for (const entry of hidden) {
      const kind = resolveAddress(expandTarget(entry.target!, '/admin')).kind;
      expect(['public-not-found', 'workspace-not-found'], entry.action).toContain(kind);
      expect(entry.note).toMatch(/not built/);
    }
  });

  it('"Back to Home" goes to the interim landing, which lands on that workspace’s Help — or to the Super Admin’s built Overview', () => {
    const homes = LINK_TARGET_LEDGER.filter((item) => item.outcome === 'interim-landing');
    expect(homes.map((entry) => entry.action)).toEqual([
      'Back to Home',
      'Back to Home',
      'Back to Home',
    ]);
    for (const entry of homes) {
      for (const base of BASES) {
        expect(resolveAddress(expandTarget(entry.target!, base))).toEqual(
          base === '/admin'
            ? { kind: 'record-screen', workspace: 'admin', screen: 'SA-01' }
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
        return [`${base}/zz-unknown`, `${base}/courses`];
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
    ]);
  });
});
