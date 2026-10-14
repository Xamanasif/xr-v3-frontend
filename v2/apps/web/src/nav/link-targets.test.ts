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
      new Set(['Shell', 'XS-01', 'XS-05', 'XS-06', 'XS-07', 'XS-08', 'PU-15', 'SA-02', 'SA-03']),
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
          ['screen', 'record-screen', 'sign-in'],
          `${entry.screen} ${entry.action} in ${base}`,
        ).toContain(outcome.kind);
      }
    }
  });

  it('a drawn action whose page is not built is not rendered, and names that unbuilt page', () => {
    const hidden = LINK_TARGET_LEDGER.filter((entry) => entry.outcome === 'not-rendered');
    expect(hidden.map((entry) => `${entry.screen} ${entry.action}`)).toEqual([
      'XS-01 Back to experiments',
      'XS-01 Request institutional access',
      'SA-03 View institution',
    ]);
    for (const entry of hidden) {
      const kind = resolveAddress(expandTarget(entry.target!, '/admin')).kind;
      expect(['public-not-found', 'workspace-not-found'], entry.action).toContain(kind);
      expect(entry.note).toMatch(/not built/);
    }
  });

  it('"Back to Home" goes to the interim landing, which lands on that workspace’s Help', () => {
    const homes = LINK_TARGET_LEDGER.filter((item) => item.outcome === 'interim-landing');
    expect(homes.map((entry) => entry.action)).toEqual([
      'Back to Home',
      'Back to Home',
      'Back to Home',
    ]);
    for (const entry of homes) {
      for (const base of BASES) {
        expect(resolveAddress(expandTarget(entry.target!, base))).toEqual({
          kind: 'interim-landing',
          workspace: base.slice(1),
          lands: `${base}/help`,
        });
      }
    }
  });

  it('the one dead link is PU-15’s "Browse experiments" to PU-04, documented', () => {
    const dead = LINK_TARGET_LEDGER.filter((entry) => entry.outcome === 'dead-link');
    expect(dead).toHaveLength(1);
    expect(dead[0]).toMatchObject({
      screen: 'PU-15',
      action: 'Browse experiments',
      target: '/experiments',
    });
    expect(dead[0]!.note).toMatch(/PU-04.*Phase 1/);
    expect(resolveAddress('/experiments')).toEqual({ kind: 'public-not-found' });
  });

  it('Sign out reaches the built sign-in card’s “Signed out” notice (XS-03, Package 1A)', () => {
    const signOut = LINK_TARGET_LEDGER.find((entry) => entry.action === 'Sign out')!;
    expect(signOut).toMatchObject({ outcome: 'built', target: '/sign-in?reason=signed-out' });
    expect(resolveAddress('/sign-in')).toEqual({ kind: 'sign-in' });
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
        return ['/', '/zz-unknown', '/selection'];
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
    ]);
  });
});
