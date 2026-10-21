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
    // XS integration. The owner-approved Entry & shared export draws one quiet line under the
    // sign-in card of a local prototype build, saying the sign-in is a stand-in: it names no
    // account and lists none (the B1-09 rule this term enforces is "no sample accounts" to pick
    // from). The same sentence is the one recorded DOM exception (`RECORDED_DOM_TERM_EXCEPTIONS`).
    rule: 'sample-accounts',
    file: 'apps/web/src/copy/sign-in.ts',
    found: 'Sample accounts open with any password.',
    evidence:
      'design/v3-refined-b/roles/XS-v6/project/XsSignIn.dc.html `p.xs-proto` "Prototype sign-in. … Sample accounts open with any password."; XS HANDOFF.md §1.1 "Prototype line"; owner approval of the XS export, 19 Oct 2026',
    removal:
      'real sign-in exists (the line is switched off, XS `prototypeNote = false`), or the owner rewords the line',
  },
  {
    // V3 foundation XR-V3-RB-1.0 (ADR-0010). The Refined Direction B term timeline places its fill,
    // remainder and today marker by the share of the plan's term that has passed — a value only
    // the plan's dates decide, which the boards draw as `style="width: 95.88%"` / `left: …`. The
    // one data-driven inline style of the V3 layer, isolated in this file; the look stays in the
    // frozen rb.css / rb-kit.css rules.
    rule: 'inline-style',
    file: 'packages/ui/src/v3/term-track.tsx',
    found: 'style={…}',
    evidence:
      'design/v3-refined-b/pack/references/v3/project/IA01.dc.html `span.rb-term-fill` style="width: 95.88%", `span.rb-term-today` style="left: 95.88%"; IA02.dc.html `style="width: {{ T.fill }}"`',
    removal:
      'typed CSS attr() (or another style-free way to set a data-driven length) is supported by every browser the product supports, or the owner approves another rendering of the term timeline',
  },
  {
    // V3 (IA-v1), the same data-driven length in the Institute Admin export's term bar (the TermTrack
    // precedent above): the elapsed fill, the gold remainder while the plan ends soon and today's
    // marker are placed by the share of the plan's term that has passed — a value only the plan's
    // dates decide, which the owner-approved export draws as `style="width: {{ V.T2.fill }}"` /
    // `left: …` (IA-01, IA-02, IA-03: nine values in all). Isolated in `IaTermBar`, the one place in
    // the Institute Admin's V3 layer that sets an inline style; the look stays in the frozen
    // ia-role.css rules (`ia-tt-fill`, `ia-tt-rest`, `ia-tt-today`).
    rule: 'inline-style',
    file: 'packages/ui/src/v3/ia-plan.tsx',
    found: 'style={…}',
    evidence:
      'design/v3-refined-b/roles/IA-v1/project/Main.dc.html lines 256 (IA-01 plan card), 312 (IA-02 plan strip), 527 (IA-03 plan head): `span.ia-tt-fill` style="width: {{ V.T2.fill }}", `span.ia-tt-rest` style="width: {{ V.T2.rest }}", `span.ia-tt-today` style="left: {{ V.T2.fill }}"',
    removal:
      'typed CSS attr() (or another style-free way to set a data-driven length) is supported by every browser the product supports, or the owner approves another rendering of the term bar',
  },
  {
    // Phase 7. The owner authorised TE-6 browser persistence for the local prototype build with
    // "an explicit, safe “Reset demo data” action", naming it in those words. The phrase is kept
    // once, as the action's label on the prototype's own support page (`/prototype/reset`, not a
    // designed screen); every other line of that page avoids the word.
    rule: 'demo-wording',
    file: 'apps/web/src/copy/prototype.ts',
    found: 'Reset demo data',
    evidence:
      'Owner authorisation of Phase 7, 17 Oct 2026 (TE-6): "Provide an explicit, safe “Reset demo data” action."',
    removal:
      'TE-6 is decided for production, or the owner renames the action (Phase-7 record, TE-6)',
  },
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
    // Phase 5, V3 (RV-v1). RV-03's learning-outcomes editor: the owner-approved Academic Reviewer
    // export draws both sentences verbatim (the empty set's notice and the Add field's hint);
    // "a learner" is the generic noun, as above.
    rule: 'role-name-variants',
    file: 'apps/web/src/copy/reviewer-review.ts',
    found: 'Add what a learner can do after this experiment; the sam',
    evidence:
      'design/v3-refined-b/roles/RV-v1/project/RV.dc.html `p.rk-notice-d` "No learning outcomes yet · Approve needs at least one. Add what a learner can do after this experiment; the same list applies to every format." (RV-03, earlier B6-03 f2 "… whichever format a learner uses.")',
    removal:
      'the owner decides the B6-03 wording against B8-03 "Role-name variants 0", with OD-1B-04 (Phase-5 record)',
  },
  {
    rule: 'role-name-variants',
    file: 'apps/web/src/copy/reviewer-review.ts',
    found: 'What a learner can do after the experiment. Start wi',
    evidence:
      'B6-03 f0 … f5 and design/v3-refined-b/roles/RV-v1/project/RV.dc.html `p#rv-lo-new-hint` — the Add a learning outcome hint "What a learner can do after the experiment. Start with a verb."',
    removal:
      'the owner decides the B6-03 wording against B8-03 "Role-name variants 0", with OD-1B-04 (Phase-5 record)',
  },
];
