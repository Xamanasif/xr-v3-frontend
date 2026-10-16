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
  {
    // Phase 5. The same conflict on the Vendor editor: B5-03 and B5-07 draw the Description field's
    // hint verbatim; "learners" is the generic noun for whoever uses the experiment, not a role
    // label. Kept as drawn, with the conflict visible (as the Package-1B exception above).
    rule: 'role-name-variants',
    file: 'apps/web/src/copy/vendor-editor.ts',
    found: 'What learners do and what they find out.',
    evidence:
      'B5-03 f0 … f6 and B5-07 f0 … f8 — the Description hint "What learners do and what they find out." (VE-03, VE-08)',
    removal:
      'the owner decides the B5-03 wording against B8-03 "Role-name variants 0", with OD-1B-04 (Phase-5 record)',
  },
  {
    // Phase 5. RV-03's learning-outcomes editor: B6-03 draws both sentences verbatim (the empty
    // set's line and the Add field's hint); "a learner" is the generic noun, as above.
    rule: 'role-name-variants',
    file: 'apps/web/src/copy/reviewer-review.ts',
    found: 'hever format a learner uses.',
    evidence:
      'B6-03 f2 "No learning outcomes yet · Add at least one before you approve. One set for the Experiment, whichever format a learner uses." (also B6-11 f2)',
    removal:
      'the owner decides the B6-03 wording against B8-03 "Role-name variants 0", with OD-1B-04 (Phase-5 record)',
  },
  {
    rule: 'role-name-variants',
    file: 'apps/web/src/copy/reviewer-review.ts',
    found: 'What a learner can do after the experiment. Start wi',
    evidence:
      'B6-03 f0 … f5 — the Add a learning outcome hint "What a learner can do after the experiment. Start with a verb."',
    removal:
      'the owner decides the B6-03 wording against B8-03 "Role-name variants 0", with OD-1B-04 (Phase-5 record)',
  },
];
