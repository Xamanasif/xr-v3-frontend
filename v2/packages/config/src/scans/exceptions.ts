/**
 * Recorded exceptions to the static scans. Each one is explicit (rule + file + the exact text
 * found), cites its evidence and names when it ends. The repository scan fails when an
 * exception no longer matches a finding, so a stale exception cannot linger.
 *
 * The WP-0.4 exception for `@import 'tailwindcss'` (Preflight) in apps/web/src/app/globals.css
 * ended in WP-0.5: globals.css now imports only Tailwind's theme and utilities (ADR-0001, G-3
 * Option A).
 */
export interface ScanException {
  readonly rule: string;
  readonly file: string;
  readonly found: string;
  readonly evidence: string;
  readonly removal: string;
}

export const RECORDED_SCAN_EXCEPTIONS: readonly ScanException[] = [
  {
    // Phase-1 Package 1B. The frozen boards draw this sentence verbatim under PU-06 "Learning
    // outcomes", while B8-03 / Appendix F §7.6 count "Learner" as a role-name variant. Here it is
    // the generic noun for whoever uses the experiment, not a role label; which authority wins is
    // the owner's call (Package-1B record §7), so the drawn words stay and the conflict is visible.
    rule: 'role-name-variants',
    file: 'apps/web/src/copy/public.ts',
    found: 'What learners can do after this experiment.',
    evidence:
      'B1-05 "Learning outcomes · What learners can do after this experiment. One set for the experiment, whichever format they use." (also drawn on B1-12 and B1-13)',
    removal:
      'the owner decides the B1-05 wording against B8-03 "Role-name variants 0" (Package-1B record §7, OD-1B-04)',
  },
];
