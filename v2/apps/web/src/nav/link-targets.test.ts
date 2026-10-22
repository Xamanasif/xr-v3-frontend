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
        // Phase 4B (ST-13 is the focused attempt page; FA-22 is an action of FA-12 and FA-20).
        'ST-11',
        'ST-12',
        'ST-13',
        'ST-14',
        'FA-12',
        'FA-16',
        'FA-17',
        'FA-18',
        'FA-19',
        'FA-20',
        'FA-21',
        // Phase 5 (VE-13 History is the record's timeline, VE-07's; RV-06 the decided review page).
        'VE-01',
        'VE-02',
        'VE-03',
        'VE-04',
        'VE-05',
        'VE-06',
        'VE-07',
        'VE-08',
        'VE-09',
        'RV-01',
        'RV-02',
        'RV-03',
        'RV-05',
        'RV-06',
        'CM-01',
        'CM-02',
        'CM-03',
        'CM-04',
        'CM-05',
        'CM-09',
        // Phase 6 (CM-06 and CM-07 are CM-05's entries into the CM-08 draft; SA-01 is Package 1D's).
        'CM-08',
        'RV-04',
        'SA-10',
        'SA-11',
        'SA-12',
        'SA-13',
        'SA-14',
        'SA-15',
        'SA-16',
        'SA-17',
        'SA-20',
        'SA-21',
        'SA-22',
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
    // Package 1D built SA-07, SA-07's Operations row since Phase 3 built SA-18, and since Phase 6
    // (Support SA-20, Access ending SA-22) nothing on the Super Admin's pages is hidden.
    expect(
      hidden
        .filter((entry) => entry.screen.startsWith('SA-'))
        .map((entry) => `${entry.screen} ${entry.action}`),
    ).toEqual([]);
    // Phase 4B: FA-01's "Review drafts" is the one hidden action whose page is built (the bank's
    // Drafts tab, FA-14 / FA-16): it waits on a service fact — the overview read names no drafts
    // (PC-51) — not on a screen.
    const factWaits = hidden.filter((entry) => /PC-51/.test(entry.note ?? ''));
    expect(factWaits.map((entry) => `${entry.screen} ${entry.action}`)).toEqual([
      'FA-01 Review drafts',
    ]);
    for (const entry of factWaits) {
      expect(resolveAddress(expandTarget(entry.target!, '/faculty')).kind).toBe('record-screen');
    }
    for (const entry of hidden.filter((item) => !factWaits.includes(item))) {
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
    // Every other not-rendered action names what it waits for. Phase 3 built its fifteen ids,
    // Phase 4A thirteen, Phase 4B twelve, Phase 5 twenty-one and Phase 6 the last fifteen: what
    // stays hidden waits on SACC-14 (ST-15's earlier work), not on a screen.
    expect(
      new Set(
        hidden
          .filter((entry) => !factWaits.includes(entry))
          .map((entry) => /\b((?:IA|ST|SA|FA|VE|RV|CM)-\d\d)\b/.exec(entry.note!)?.[1]),
      ),
    ).toEqual(new Set(['ST-15']));
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
        // Built homes (Package 1D: SA-01; Package 2A: IA-01, ST-01; Phase 4A: FA-01; Phase 5:
        // VE-01, RV-01, CM-01) — every base now.
        const home = {
          '/admin': 'SA-01',
          '/institute': 'IA-01',
          '/student': 'ST-01',
          '/faculty': 'FA-01',
          '/vendor': 'VE-01',
          '/reviewer': 'RV-01',
          '/content-manager': 'CM-01',
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

  it('the external links are the experiment’s preview and, for the Academic Reviewer, a submission’s preview link and WEB link (T-30)', () => {
    // RV-v1: the preview-link card (`a.rv-filecard--link`, named by the vendor's preview label, only
    // when the submission holds a preview link) and the WEB card's "Open web link", on the review
    // page and its decided state alike.
    expect(
      LINK_TARGET_LEDGER.filter((entry) => entry.outcome === 'external').map(
        (entry) => `${entry.screen} ${entry.action}`,
      ),
    ).toEqual([
      'PU-06 Open preview',
      'RV-03 <preview label>',
      'RV-03 Open web link',
      'RV-06 <preview label>',
      'RV-06 Open web link',
    ]);
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
      'PU-01: Browse the catalogue',
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
      // V3 (IA-v1): IA-02's head "Give students access" is secondary (each plan row's own action
      // leads), and IA-16 draws only its save bar's "Save course code(s)"; IA-05's ended-plan
      // "Request renewal" is the navy identity action, not a primary.
      'IA-01: Give students access',
      'IA-16: Save course code · Save course codes',
      'IA-03: Give students access',
      'IA-04: Give students access',
      'IA-05: Continue',
      'IA-05: Give access',
      'IA-05: View Student access',
      'IA-06: Add student',
      'IA-08: Add faculty member',
      'IA-07: Give this student access',
      'IA-07: Reactivate account',
      'IA-10: Add student · Add faculty member',
      'IA-10: Give this student access',
      // Package 2B: IA-10's faculty result (B2-07 f3); IA-11 per step and its result; one each on
      // IA-09, IA-13, IA-14 and IA-15. V3 (IA-v1): IA-14's primary is "Give this group access"
      // ("Add students" opens the add panel beside it).
      'IA-10: Assign a course',
      'IA-09: Assign a course',
      'IA-11: Check file · Choose the corrected file · Continue · Import N students',
      'IA-11: Give students access',
      'IA-13: Create group',
      'IA-14: Give this group access',
      'IA-15: Assign course',
      // V3 (ST-v1): Home's one gold action is the cover's next step (the hub's next-step rule);
      // ST-03's empty course leads back to My courses.
      'ST-01: Continue WEB · Open <format> · Give feedback on <format> · Open resources · Choose a format · Open assessment · Continue attempt',
      'ST-03: Back to My courses',
      // Phase 3: ST-05's Next step (one variant at a time), the hub tabs, the format pages,
      // feedback, My device, the Institute Admin's requests and the Super Admin's decision. V3
      // (ST-v1): the hub's next step per state (resources, a format, its feedback, the assessment);
      // ST-06 draws no gold action (its retry is plain); ST-07's and ST-10's per-format progress
      // rows lead with one gold action (continue › feedback › open); ST-16's not-open card leads
      // back to the format; ST-18's "isn't available to you" card leads back to Home.
      'ST-05: Open resources',
      'ST-05: Continue WEB · Open VR · Open <format> · Give feedback on <format>',
      'ST-05: Open assessment · Continue attempt',
      'ST-19: Back to My courses',
      'ST-07: Continue <format> · Give feedback on <format> · Open <format>',
      'ST-10: Continue <format> · Give feedback on <format> · Open <format>',
      'ST-08: Launch WEB · Continue WEB · Try again',
      'ST-08: Give feedback on WEB',
      'ST-09: Give feedback on VR',
      'ST-09: Back to Simulation',
      'ST-16: Submit feedback',
      'ST-16: Back to WEB · Back to VR',
      'ST-17: Back to experiment',
      'ST-18: Request a device transfer',
      'ST-18: Send request',
      'ST-18: Back to Home',
      'IA-17: Ask BITS for a renewal or more licences',
      'IA-17: Send request to BITS',
      'IA-17: Back to Requests',
      'IA-17: Open the payment page',
      'IA-19: Forward to BITS',
      'SA-19: Approve transfer',
      // Phase 4A: one primary per drawn state. V3 (FA-v1): FA-01's priority band "Mark now" (the
      // oldest waiting submission) and the new teacher's "Add a question"; FA-03's and FA-05's
      // assessment panels "Mark <n> written answers" while answers wait, or "Create assessment"
      // with none ("Open assessment · Continue setting up" is the plain button beside it); FA-09's
      // "Add from question bank" is a plain button (FA-09 draws no gold primary).
      'FA-01: Mark now',
      'FA-01: Add a question',
      'FA-03: Mark <n> written answers',
      'FA-03: Create assessment',
      'FA-05: Mark <n> written answers',
      'FA-05: Create assessment',
      'FA-06: Create assessment',
      'FA-06: Create assessment',
      'FA-07: Continue',
      'FA-07: Create assessment',
      'FA-07: Open assessment',
      'FA-08: Add questions',
      'FA-08: Mark next',
      'FA-10: Save settings',
      'FA-14: Add a question',
      'FA-15: Save question',
      'FA-15: Save question',
      // Phase 4B: one primary per drawn state — the hub's Assessment tab (ST-05), Before you
      // start per state (ST-12), the attempt and its DL-1 (ST-13), the result's states (ST-14:
      // V3 ST-v1 leads only "Try again"; its way back is a plain link to the hub's Assessment tab),
      // Mark next (FA-12, FA-18), Confirm marks (FA-19) and, once confirmed, Next submission (V3
      // FA-v1), Mark their answers (FA-21), the tools (FA-17's own-file "Choose another file").
      'ST-05: Open assessment',
      'ST-05: Continue attempt',
      'ST-12: Start assessment',
      'ST-12: Continue attempt',
      'ST-12: Try again',
      'ST-12: See result',
      'ST-12: Back to experiment',
      'ST-13: Submit',
      'ST-13: Submit answers',
      'ST-13: See your result page',
      'ST-14: Try again',
      'FA-12: Mark next',
      'FA-18: Mark next',
      'FA-19: Confirm marks',
      'FA-19: Next submission',
      'FA-21: Mark their answers',
      'FA-16: Draft questions',
      'FA-17: Check file · Choose another file · Continue · Import N questions',
      'FA-17: Open question bank',
      // Phase 5: one primary per drawn state — VE-01's top attention item or Create (first visit),
      // VE-02's Create / the returned row's Revise, the editor's Continue per step and its DL-1
      // submit (VE-06 create, VE-08 resubmit) and result; the record's Edit draft / Revise; RV-01's
      // next in line's gold "Start review" (V3 RV-v1; RV-02 and RV-05 rows are single links, no
      // primary), RV-03's decision; CM-01's first desk row (V3 CM-v1: its gold "Open decision"),
      // CM-02's decision, CM-09's Save codes, CM-03's decision and CM-05's correction entry.
      'VE-01: Revise “<name>”',
      'VE-01: Create experiment',
      'VE-02: Create experiment',
      'VE-02: Create experiment',
      'VE-03: Continue',
      'VE-04: Continue',
      'VE-05: Continue',
      'VE-06: Submit for academic review · Resubmit',
      'VE-06: Open the experiment record',
      'VE-09: Continue',
      'VE-09: Open the experiment record',
      'VE-08: Continue',
      'VE-08: Submit for academic review · Resubmit',
      'VE-08: Open the experiment record',
      'VE-07: Edit draft',
      'VE-07: Revise and resubmit · Continue revising',
      'RV-01: Start review',
      'RV-03: Approve · Return to vendor',
      'CM-01: Open decision',
      'CM-02: Open decision',
      'CM-09: Save codes',
      'CM-03: Publish · Send back',
      'CM-05: Start a correction',
      // Phase 6: one primary per drawn state — CM-05's "Continue the update" (a draft or returned
      // update) and "Open update" (awaiting release), CM-08's Send and the CM-08 list's Need-you
      // "Continue" (V3 CM-v1), RV-04's and SA-11's decisions, SA-13's override (a stuck record; SA-v1
      // `V.record`), SA-14's Add course, SA-16's Register, SA-17's Assign scope and
      // SA-21's Resolve. SA-10, SA-12, SA-15, SA-20 and SA-22 draw no primary.
      'CM-05: Continue the update',
      'CM-05: Open update',
      'CM-08: Send for academic review',
      'CM-08: Continue',
      'RV-04: Approve update · Return to the Content Manager',
      'SA-11: Release update · Hold update',
      'SA-13: Move status',
      'SA-14: Add course',
      'SA-16: Register',
      'SA-17: Assign scope',
      'SA-21: Resolve report',
    ]);
  });
});
