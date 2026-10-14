# Phase-0 frontend verification record — frozen canvas v46 (WP-0.16)

| | |
|---|---|
| Work package | WP-0.16 — Phase-0 verification record and handover (Appendix F §8.2, §11.2) |
| Branch / worktree | `v2/frontend-v46` at `/Users/mymac/Desktop/AR-VR-frontend-v46` (G-6), from `1b090c9` |
| Starting point | `a6d369d` (WP-0.15 closure), clean worktree, no remote |
| Date | 14 Oct 2026 |
| Environment | macOS (Darwin 25.5.0), Node 24.21.0, pnpm 12.3.4, Playwright Chromium (the only engine installed), same machine for every run |
| Design authority | `design/handoff-v46/` (frozen, 178/178) |
| Verdict | **CONDITIONAL PASS** — 16 of 19 definition-of-done items PASS, 3 CONDITIONAL on interims the plan itself permits (Chromium only; same-machine parity; local merge review instead of a PR), 0 NOT MET. See §6 |

This is the "Phase 0" of the **v46 frontend plan** (Appendix F), not the platform foundation's
earlier `docs/PHASE0_VERIFICATION.md` (K-16). Phase-0 scope is the **foundation**: five implemented
screen ids (XS-05, XS-06, XS-07, XS-08, PU-15), the component library, shells, domain, contracts,
sample world, composition and the proofs. The other 118 designed screens are **scheduled for
Phases 1–6, not failed**; the 24 undesigned ids are excluded. **This build is not production-ready
and not ready for PM or academic stakeholder review**: there is no sign-in or public entry (Phase 1),
no persistence (a reload resets the world), no hosting, and only Chromium was tested (§7).

Companion handover documents (`handover/`): `CAPABILITY_LEDGER.md` (147 ids),
`METHOD_LEDGER.md` (183 + 8 methods), `PERMISSION_COVERAGE.md` (347 rows),
`OWNER_DECISIONS_HANDOVER.md` (open decisions by phase), `LOCAL_MERGE_REVIEW.md` (no remote, no PR).

## 1 · Evidence inventory and method

Every result below was measured in this work package unless it says "as recorded". Commands ran
from `v2/` unless stated. Earlier work packages' own records are cited where their evidence is a
committed test that the final `pnpm verify` re-ran. Read-only cross-checks used scratch scripts
outside the repository (never committed); each check's sources and result are stated where used.

## 2 · Independent review of the supplementary `productContent` fingerprint

**Verdict: one genuine defect found and corrected; PASS after the correction.**

| Question | Finding | Evidence |
|---|---|---|
| Do the original 64 registered comparisons keep their ids, sizes, pixel counts and primary fingerprints? | **Yes.** Between `8677c5b` (WP-0.15) and `a6d369d` only `productContent` was added and the `run` label changed; `deviations`, `reference`, `product`, `iconsSame`, `productFingerprint` and `pixels` are identical for 64/64. After this WP's re-pin they are still identical for 64/64 | Scripted field-by-field comparison of `pinned.json` at `8677c5b`, `a6d369d` and now; `git diff` of `pinned.json` = 128 lines = 64 × (`productContent`, `run`) |
| Does the supplement cover form values, placeholders, input padding, checked / selected states and pseudo-elements? | Values, placeholder words, `::placeholder`, padding, checked / indeterminate / disabled, selected options, `::before` / `::after` / `::marker`, `::file-selector-button`: **yes**. **Defect:** neither fingerprint recorded `border-*-style` or `accent-color` (v46 uses dashed borders 13× and `accent-color` on 6 control rules). A solid → dashed border keeps its width and colour, so on a size-mismatched registered comparison (no pixel count) it was absorbed silently | End-to-end negative control on `03-read-only-value` (DEV-02, captures differ in size): before the fix, `border-style: dashed` on the product box **passed as registered** (capture inspected: dashed border visible); after it, it fails with "control values, pseudo-elements or drawn styles ≠ pinned content fingerprint" |
| Correction | `contentFingerprintOf` now also hashes `borderTopStyle` … `borderLeftStyle` and `accentColor` for every element, and the three missing side styles for pseudo-elements; `fingerprintOf` is unchanged. Both functions are exported for the regression test. Test-only tool code, inside the existing capture infrastructure | `tools/board-capture/src/parity.mjs` |
| Re-pin, without regenerating to obtain a pass | With the corrected supplement and the old pins, the full parity run gave 441 comparisons: 377 within tolerance and **all 64 registered comparisons failed, each with only the supplementary-fingerprint message** (failed set = pinned set; sizes, icons, primary fingerprint and pixels all still matched). `productContent` was then re-pinned from that reviewed run (`pin.mjs`), and only `productContent` and `run` changed | Runs `tools/board-capture/.runs/2026-10-14-wp016-repin` (pinning) and `…-wp016-confirm` (reproduction) |
| Is every registered item pinned deterministically? | **Yes.** The reproduction run measured 441 / 377 / 64 / 0 unregistered / 0 masked with all 64 pins matching, and the final `pnpm verify` run matched them again (§5). Product origins are fixed (3100, 3200), so image and `url()` values in the hash are stable | `…-wp016-confirm`; final verify run |
| Do mutation tests detect meaningful changes to form content and styling? | **Yes, now committed.** The closure review's negative controls were run by hand and not committed. `apps/specimens/e2e/parity/fingerprint-sensitivity.parity.ts` now proves on real `@xr/ui` controls that 12 changes each alter the supplement — text-input value, placeholder words, placeholder colour, 1 px padding, disabled, textarea value, selected option, checkbox checked, radio checked, checkbox accent colour, border style, timeline `::before` colour — and that undoing each restores both fingerprints. Against the pre-fix supplement it fails on exactly border style and accent colour. It passed 5/5 repeats | Spec + `--repeat-each=5`; pre-fix run |
| Does the system still detect unexpected deviations? | **Yes.** A 1-px padding change on a registered comparison fails (both fingerprints); a border-colour change on an unregistered, within-tolerance comparison (`03-text-input-empty`) fails as an unregistered difference; the unmutated replay passes | Temporary negative-control spec (not committed), runs before and after the fix |
| Was any tolerance weakened? | **No.** `TOLERANCES` is identical at `8677c5b`, `a6d369d` and now: specimen 0.1 / 0.001, screen 0.2 / 0.005 (whole frames only) | `parity.mjs` at the three revisions |
| Was a mask introduced? | **No.** No parity spec passes `masks`; since `8677c5b` the only mask-related change *forbids* masking a registered comparison; every run reports 0 masked | grep of both parity suites; run summaries |
| Was a reference or baseline silently replaced? | **No.** References are captured fresh from the frozen boards on every run, never committed (0 images in git), `updateSnapshots: 'none'` in both parity configs (unchanged since `8677c5b`), each reference re-hashed after its comparison. The only pin change is the documented `productContent` re-pin above | Configs; `git ls-files` |

## 3 · Test reliability — the animation-settling helpers

WP-0.15 fixed one `settle()` (in `apps/specimens/e2e/role-shells.spec.ts`): a transition cancelled by
the next style change rejects `finished` with an `AbortError`. Ten other helpers use the same
pattern without the catch: nine identical `settle()` copies in `apps/specimens/e2e/`
(`components-foundation-content`, `components-foundation-structure`, `components-data`,
`components-shells`, `components-overlays`, `components-forms-a`, `components-forms-b`,
`datatable-sort`, `v46-styles`; about 80 call sites) and one inline wait in
`apps/web/e2e/styles.spec.ts`.

**Exposure.** Every helper runs under reduced motion, where the v46 backstop sets
`transition-duration: .01ms !important` on every element while `transition-property` stays `all`,
so any animatable style change starts a 0.01 ms transition. The race needs a second style change
to cancel one of those transitions between `getAnimations()` and its `finished` (a re-render, a
container-query change or a focus move right after an interaction). Helpers called after page
load are least exposed; those called straight after an interaction (shell collapse, dialog open,
sort) are most exposed — the one observed failure was a Super Admin rail collapse at 1440.

**Measured in WP-0.16:** the nine specimen spec files ×3 repeats at the four widths — 3,144
executions: 2,595 passed, 549 skipped (width-gated tests that run in one project only), **0 failed,
0 AbortError** (10.7 min); `apps/web/e2e/styles.spec.ts` ×5 — 180/180, 0 AbortError. Local runs use
0 retries, so nothing was hidden by retries. No failure reproduced, so per the authorisation no helper
was rewritten. **Risk: low, not zero** — recorded as a technical limitation; if an `AbortError`
from a `settle()` ever appears, the fix is the one-line `.catch(() => undefined)` already used in
`role-shells.spec.ts`, applied to that helper only. The new fingerprint-sensitivity spec uses the
safe form from the start.

## 4 · Definition of done (Appendix F §11.2) — 19 items

| # | Requirement | Result | Evidence (test, command or file) | Measured | Accepted interim / remaining limitation |
|---|---|---|---|---|---|
| 1 | **Repository.** Worktree and branch exist (G-6); the main checkout's status is unchanged since G-1; Slice-1 preserved as chosen; nothing under `apps/api` or `packages/database` changed | PASS | `git worktree list`; scratch check of `/Users/mymac/Desktop/AR-VR` against the G-1 backup manifest; `shasum -c` in the backup; `git diff v2/platform-foundation HEAD -- v2/apps/api v2/packages/database` | Branch `v2/frontend-v46`, base `1b090c9`. Original: `v2/connected-frontend-slice1` @ `1b090c9`, 98 status lines, 98/98 paths byte-identical to the manifest, 0 stashes, no remote. Backup 6/6 OK. API / database diff empty | G-1 option B (external backup) is the owner's choice; Slice-1 exists only there and in the original checkout (P0-01) |
| 2 | **Handoff.** Committed (G-7); 178 OK from a fresh checkout; `CLAUDE.md` holds the START-HERE line; unchanged since | PASS | `shasum -a 256 -c SHA256SUMS.txt` in place and in a fresh `git archive HEAD design/handoff-v46` export; `git log -- design/handoff-v46`; repository scan | 178/178 OK both; only `c4860a2` touches it; `git status` empty; zip `9d33f32e…24bf` = G-7 | — |
| 3 | **Baseline.** Foundation checks green before any change (WP-0.1); all suites green at the end (`pnpm verify` with the uncached handoff step) | PASS | WP-0.1 baseline as recorded in the WP-0.1 report (12 Oct): build 9/9, typecheck 9/9, lint 9/9, 218 unit tests, test:db 1 passed + 1 skipped, e2e 2/2 Chromium, format clean. Final `pnpm verify`: §5 | Final verify: §5 | The WP-0.1 numbers were reported, not committed; this record is their first committed copy |
| 4 | **Decisions.** ADR-0001…0008 committed; G-2 signed, G-3 acknowledged; TE-1, TE-2, TE-5, TE-7 and AD-39 recorded with removal triggers; no Part-A decision marked resolved; §10.2 defaults acknowledged; G-8 answered | PASS | `docs/decisions/` (8 ADRs + README index), `docs/OPEN_DECISIONS.md` Part E (exception, fence, removal trigger, status), ADR-0006 (AD-39, removal trigger), Part A "v46 positions recorded — not resolved" | 8/8 ADRs; G-1, G-2, G-3, G-5, G-6, G-7, G-8 recorded 12 Oct; TE-1/2/5/7 "Approved", TE-3/4/8 drafted, TE-6 not authorised | §10.2 defaults acknowledged by non-objection (they stay PROVISIONAL). Still requested: ADR-0005 acknowledgement, P0-03 sign-off |
| 5 | **Foundation conflicts.** No `ROLE_PLANNING_LABEL`, `TECHNOLOGY_META`, "Tenant Admin" or "Learner"; WEB·AR·VR·MR order; completion only through `CompletionPolicy`; foundation `/`, `/system` and API probe gone; smoke test green | PASS | `git grep` over `packages` and `apps/web` (WP-0.16); scan rule `role-name-variants` (`packages/config/policy/terms.mjs`, `rules.test.ts`); `packages/domain/src/vocabulary.test.ts`; `completion/policy.test.ts`, `completion.test.ts`; `apps/web/e2e/smoke.spec.ts`; `nav/routes.test.ts` | `ROLE_PLANNING_LABEL` / `TECHNOLOGY_META`: 0 hits. "Tenant Admin": only the scan rule and its test. "Learners …": 7 hits, all sample experiment descriptions drawn on the boards (B1-03, B5/B6/B7) or a contract-suite paraphrase of one — data, never a role label; the scan scopes them deliberately | No automated scan names the two retired constants (checked by grep here) |
| 6 | **Visual layer.** 8 sheets + 19 SVGs byte-identical with a mutation check; one `xr.v46` layer; no Preflight; each product-layer rule cites its PF id; computed-style assertions pass | PASS | `packages/ui/src/styles/v46-provenance.test.ts` (incl. mutation cases); repository scan "v46 copies"; `apps/web/e2e/styles.spec.ts` (layer order, no Preflight); `globals.test.ts`; `apps/specimens/e2e/v46-styles.spec.ts`; `foundation/visual-corrections.spec.ts`; scratch parse of `product.css` | Copies 27/27 (§5). `product.css`: 43 top-level blocks, 38 with their own PF comment, 5 under the preceding PF comment, 0 uncited | PF citation is checked by this record's parse, not by a committed test |
| 7 | **Components.** 42 (no G-8 additions) with markup-contract, behaviour and axe tests; no canvas classes, raw hex or Tailwind classes in `@xr/ui`; Slice-1 provenance test passes | PASS | `packages/ui/LEDGER.md` + `src/ledger.test.ts` (exactly the 42 Phase-0 rows, each with unit test citing its boards, browser spec and real classes); ESLint fences `xr/no-raw-hex`, `xr/no-canvas-classes`, `xr/v46-class-names`, `xr/product-class-allow-list`; `slice1-provenance.test.ts` | 42/42 implemented; 14 later-phase and 2 not-built rows listed | Icon has no axe test of its own; it is axe-checked inside every specimen that draws it (IconButton, Notice, …) |
| 8 | **B1-10.** DataTable tests at content widths 343/759/760/1112, no invisible focus target, one visible sort control below 760 px; the Phase-1 SA-02 route test written | PASS | `apps/specimens/e2e/datatable-sort.spec.ts` ("B1-10 sort at the four content widths", `expectNoInvisibleFocusTargets`, "exactly one visible sort control …"); `v46-styles.spec.ts` with its negative control; `apps/web/e2e/a11y/datatable-sort.spec.ts` (`describe.fixme`, Phase 1) | Passed in the final verify; SA-02 test reported as skipped, not passed | VD-04 (sort placement) awaits owner visual acknowledgement on SA-02 |
| 9 | **Shells and navigation.** 7 nav configs + public header equal `navigation.json` after HB-02 / HB-19; icon keys equal board 06; Help last; account menus per board 06; drawer / rail / full; built-screen gating | PASS | `apps/web/src/nav/nav-config.test.ts`; `sidebar-model.test.ts`; `features/shared/xs-05-account-menu/account-menu.test.tsx`; `e2e/foundation/account-menu.spec.ts`, `navigation.spec.ts`; `packages/ui/src/shells/workspace-shell.test.tsx`; `apps/specimens/e2e/role-shells.spec.ts` | 7 configs + header; Phase-0 sidebars show Help only (DEV-10, P0-35) | P0-35 interim: destinations appear as each phase builds them |
| 10 | **Domain.** 28 models; exhaustive transitions; 12 invariants (10 reworded); 347/347 rows; 15 OPEN never offered; five-state separation; no counting rule; §10.2 interims implemented and named | PASS | `packages/domain/src/status-unions.test.ts` ("28 models"); per-model transition suites; `invariants/invariants.test.ts` (numbered 1…12, seeded random sequences, mutation cases); `policy/matrix.test.ts` (347 rows by kind, coverage 347/347, OPEN → `policy-open`); `boundaries.test.ts` (no counting; DV-2 no scoring); interim tests for AD-14, DV-1, DV-2, P0-31, M-3, CF-06 | Matrix 347: ALLOW 103, DENY 156, READ 62, OPEN 15, SYSTEM 11 | Five-state separation is enforced by the invariant set (BC3–BC11), not a separately named suite. Interims are not decisions (`handover/OWNER_DECISIONS_HANDOVER.md`) |
| 11 | **Contracts.** 22 product ports (183 methods) and 6 stand-in ports (8 methods) typed with zod DTOs; framework-free contract suite on its own subpath; method ledger complete | PASS | `packages/contracts/src/draft/ledger/ledger.test.ts` (22 ports, 183 methods, Appendix C lists, 8 stand-in methods); compile-time `portLedger` checks; `kernel/typed.test.ts`; `contract-suite/suite.test.ts` (no runner/browser/React imports; four entry points) | 183 = 139 implemented + 44 deferred; 6 stand-in ports / 8 methods | `handover/METHOD_LEDGER.md` |
| 12 | **Mock and world.** Contract suite green against the mock for the Phase-0 set; deterministic seed; the walk reproduces the board references; refusals write nothing; idempotent commands; stand-in events carry sample provenance | PASS | `packages/sample-platform/src/contract.test.ts` ("passes every case; none fails and none is left not run"); `world.test.ts` (determinism, board references, provenance); `pipeline.test.ts` (refusal leaves the world deep-equal; idempotent command id); `one-world-checks.test.ts` | Passed in the final verify | E-alt3 `listAllContent` is the one early method (owner, 13 Oct) |
| 13 | **Composition and session.** One world and one QueryClient per tab; invalidation by changed kind; cache cleared on identity change; test hooks absent from non-CI bundles (alias, sentinel check) | PASS | `apps/web/src/platform/platform-provider.test.tsx`; `queries/invalidation.test.ts`; `session-store.test.tsx`; `next.config.ts` alias + `build-alias.test.ts`; `scripts/verify.mjs` bundle step; `e2e/platform/test-hook-isolation.spec.ts` | Bundle step: §5 | — |
| 14 | **Screens.** XS-05, XS-06, XS-07, XS-08, PU-15 "Done, for one screen" at 1440/1024/768/375; no account selector, DEMO banner or "Viewing as"; only Phase-0 routes; link-target ledger complete | PASS | `apps/web/e2e/foundation/{a11y,help,not-found,banners,account-menu,workspace-guard,routes,navigation}.spec.ts` at the four projects; parity suite (XS-07, XS-06, PU-15, shells, banners); `nav/routes.test.ts` (page files = manifest); `nav/link-targets.ts` + test; scans for developer surfaces | 35 page files, only Phase-0 routes; link-target ledger 24 actions: 14 built, 5 in-page, 3 interim landing, 1 sign-in exit (Phase 1), 1 documented dead link (PU-15 "Browse experiments" → PU-04) | Visual match is measured where the boards draw these screens (1440 and 375; shells at all four widths on board 11); 1024/768 are covered by the functional and accessibility suites. G-8: no sign-in in Phase 0 |
| 15 | **Cross-role proof.** Port-level suites cover all 27 `flows.json` steps and the drawn alternates on one world; browser proofs at 4 widths; flow skeletons exist | PASS | `packages/sample-platform/src/one-world.test.ts` (coverage of every step, alternate, cross-cutting command and interim); `contract-suite/suite.test.ts` (27 steps, alternates); `apps/web/e2e/foundation/cross-role.spec.ts` (report → resolve → note; pause → banners; deactivate → banner; role change in one tab keeps the world); `e2e/flows/skeletons.spec.ts` (27 steps + 9 alternates as `fixme`) | Passed in the final verify; the 36 flow skeletons are reported as skipped, never as passed | Skeletons go green in Phase 7 |
| 16 | **Accessibility and reach.** Keyboard and focus suites, `expectNoInvisibleFocusTargets`, axe and `reachAndClick` on every Phase-0 route and the harness confirm button at 4 widths in Chromium; targets ≥ 24×24; the record states the browser policy | CONDITIONAL | `apps/web/e2e/foundation/a11y.spec.ts` (`checkState`: axe, invisible focus, targets ≥ 24×24, developer surfaces, Slice-1; `reachAndClick` on "Send report"); `packages/testing/e2e/{focus,reach,axe-and-surfaces}.spec.ts`; `apps/specimens/e2e/harness.spec.ts` (Confirm via `reachAndClick`) | All passed in Chromium at the four widths (§5) | **WebKit and Firefox have not been run.** The declared policy (P0-28: Chromium 105+, Safari 16+, Firefox 121+) is verified only when a runner exists (Phase 7 / VD-18) or a G-5 download is approved |
| 17 | **Scans.** B8-03 policy words, owner-constraint, canvas-leakage and Slice-1 scans at 0 | PASS | `packages/config/src/scans/repository.scan.test.ts` ("finds nothing outside the recorded exceptions"), rules in `policy/terms.mjs` and `src/scans/rules.ts` | 49 rules (owner constraints 10, canvas 8, Slice-1 6, B8-03 words 12, styling 5, imports 3, CSS 2, test seams 2, identity query parameter 1); recorded exceptions: none; findings 0 (§5) | — |
| 18 | **Visual parity.** Phase-0 baselines captured; within tolerance or covered by approved deviations — in CI if VD-18 is decided, otherwise in a recorded same-machine run | CONDITIONAL | `pnpm verify` parity step; `tools/board-capture/{BASELINES,DEVIATIONS}.md`; §2 | §5: 441 comparisons, 377 within tolerance, 64 registered (all owner-closed), 0 unregistered, 0 masked, 136/136 references, 0 external requests | Same-machine local interim (VD-18 open): baselines are not portable and must be re-run and re-pinned on the runner. Acceptance covers the **Phase-0 scope and its registered deviations only**, not the 123 designed screens |
| 19 | **Handover.** Capability, method, permission and link-target ledgers committed; owner-decision list updated; PR opened or a local review recorded | CONDITIONAL | `handover/` (this WP); link-target ledger in code (`apps/web/src/nav/link-targets.ts`, tested); `handover/LOCAL_MERGE_REVIEW.md` | 147 / 183 + 8 / 347 / 24 entries | **No PR:** no remote (P0-01). The local review is the plan's permitted alternative; the PR waits for the owner |

## 5 · Final verification (`pnpm verify`)

`pnpm verify` at `v2/`, run on the committed WP-0.16 tree (clean worktree, `NEXT_PUBLIC_XR_TEST_HOOKS`
unset, ports 3000/3100/3200 free), 14 Oct 2026: **VERIFY PASSED in 451 s**. The only later edit to
this commit is documentation — this section and the regenerated `DEVIATIONS.md` (its run name only;
every measured value is identical to the pre-WP-0.16 register) — after which the repository step
(`pnpm --filter @xr/config run test:scans`) and `prettier --check .` were run again (§5.1).

| Step | Result | Measured |
|---|---|---|
| format | PASS | `prettier --check .` clean |
| repository (uncached) | PASS | 32 checks · frozen handoff **178/178** · audit evidence **36/36** · v46 copies **27/27** (0 unexpected) · static scans (49 rules, 0 findings, no recorded exceptions), dependency deny-list, lint-fence wiring |
| workspace | PASS | `turbo build` 12/12 + typecheck / lint / test 40/40 tasks, `--force` (no cached replay) · **3,580 unit tests** in 10 packages: validation 20, testing 11, config 356, domain 784, database 5, contracts 720, api 38, sample-platform 142, ui 826, web 678 |
| bundle | PASS | 604 built product files, **0** test-seam or harness sentinels; positive control: the test-hook build carries the bridge (4/4 markers) |
| browser (4 widths, Chromium) | PASS | **1,774 passed** (testing 64, web 639, specimens 1,071) · **634 skipped, not passed**: 176 deferred (`fixme`: 144 flow skeletons = 36 × 4 widths, Phase 7; 32 SA-02 route sort tests = 8 × 4, Phase 1) and 458 width-gated (a test that applies to one width range is skipped in the other projects: web 101, specimens 357) · 0 failed, 0 flaky, 0 retries |
| parity (same machine) | PASS | 42/42 tests · **441 comparisons** (6 whole frames): **377 within tolerance**, **64 registered** (statuses counted per entry named: owner-approved 70, approved-rule 5, owner-acknowledged 2, owner-deferred 1), **0 unregistered** · 20 icon differences, all registered · **0 masked** · 136/136 board references · 0 external requests · not closed by the owner: none · run `tools/board-capture/.runs/2026-10-14T09-38-56-342Z-verify` (git-ignored artefacts) |

Also measured in WP-0.16 outside `pnpm verify`: the fingerprint review runs (§2), the helper stress
runs (§3), the fresh-export handoff check (178/178), and after the final run: the original checkout
still 98 paths, 98/98 byte-identical to the G-1 manifest, nothing new in its `v2/.turbo` and no root
`.turbo` (Turbo cache stays in this worktree's `v2/.turbo/cache`); external backup 6/6; no git remote
in either checkout; nothing pushed.

Against the last recorded figures (WP-0.14 record: 3,580 unit tests, 1,774 Playwright passed, 634
skipped; WP-0.15: 41 parity tests, 441 / 377 / 64 / 0 / 0 masked) the only change is the 42nd parity
test, the fingerprint-sensitivity test added here (it compares nothing). No Playwright test failed,
was flaky or was retried (the log has no retry).

### 5.1 · After the documentation-only amendment

The commit was amended once, for documentation only: this section and the regenerated
`tools/board-capture/DEVIATIONS.md`. On the amended tree the repository step (`pnpm --filter
@xr/config run test:scans`, which also requires a clean `git status` under `v2/docs/v46` and
`design/handoff-v46`) and `pnpm exec prettier --check .` were run again; no code, test, pin or
configuration changed after the final `pnpm verify`.

## 6 · Verdict

**WP-0.16: CONDITIONAL PASS.** Phase 0 meets its definition of done with evidence: 16 items PASS
and 3 CONDITIONAL, each on an interim that Appendix F §11.2 itself permits — Chromium-only proof
(item 16), a same-machine parity run (item 18), a local merge review instead of a PR (item 19).
Nothing is NOT MET. The conditions are owner decisions, not defects: a remote and PR base (P0-01),
the visual-comparison runner (VD-18), and WebKit / Firefox runs (P0-28). One genuine closure defect
was found and corrected in this WP (the supplementary fingerprint, §2); no product code, component,
style, permission or frozen file changed.

## 7 · Capability, method and permission summary

| Ledger | Result |
|---|---|
| Screen ids | 147 = 123 designed + 24 excluded. Implemented in Phase 0: 5 (XS-05, XS-06, XS-07, XS-08, PU-15). Scheduled: Phase 1 21, Phase 2 21, Phase 3 15, Phase 4 25, Phase 5 21, Phase 6 15 (= 118). 13 cross-checks between `screens.json`, `routes.json`, `SCREEN_PHASE`, the route manifest and the page files all pass. Specimen-harness pages, test-hook seams and canvas boards are not counted |
| Routes | 35 Phase-0 page files (7 workspaces × help, report, report detail, interim landing, `[...unmatched]`) + root and workspace layouts / not-founds + `/healthz`; 7 redirects (`/<base>/help/reports` → `/<base>/help`). No public page (`/` shows PU-15) |
| Methods | 22 product ports, 183 methods (84 commands, 94 reads, 5 previews): 139 implemented in Phase 0 (incl. the owner-authorised `listAllContent`), 44 deferred — Phase 1 4, Phase 2 9, Phase 3 1, Phase 4 14, Phase 5 7, Phase 6 9. 6 stand-in ports, 8 methods (test / seed only) |
| Permissions | 347 candidate rows (176 CONFIRMED, 130 PROVISIONAL, 41 UNRESOLVED); 15 OPEN rows never offered (`policy-open`); 11 SYSTEM rows written only by system writers; 22 stakeholder-conflict rows kept open. **No provisional row was turned into an approved one** |
| Navigation and links | 7 role nav configs + public header; Phase-0 sidebars show Help only; link-target ledger 24 actions, 1 documented dead link |

## 8 · Accessibility and browser coverage

All Phase-0 accessibility evidence is **Chromium only**, at 1440×900, 1024×768, 768×1024 and
375×812: axe (tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `@xr/testing`), keyboard and focus order, no invisible focus
target, targets ≥ 24×24, real-pointer reach (`reachAndClick`), the B1-10 correction. WebKit
(Safari 16+) and Firefox (121+) have **not** been run against this build; the plan defers them to
the runner (VD-18) or a G-5 download approval. The parity measurements are one machine's
(macOS, Chromium) and are not portable. Designed motion and forced-colours support are deferred
(DV-8); the v46 reduced-motion backstop stays.

## 9 · What limits ordinary stakeholder access today

1. No sign-in or public entry (XS-01/03/04, PU-01…PU-14 are Phase 1, G-8): in the product build a
   visitor sees "Page not found" at `/`, and a workspace address leads to the unbuilt sign-in. The
   workspaces are reachable only through the CI-only test-hook build.
2. No persistence: a reload or typed URL resets the sample world (ADR-0004 option A; P0-02 open).
3. No hosting, no remote, no CI (P0-01, VD-18); Phase-0 builds are engineering builds (K-21).
4. Only five foundation screen ids exist; every other destination is hidden or shows PU-15 (P0-35).
5. The BITS Pilani / WILP logo is a placeholder until an authorised asset is supplied (P0-04).
6. Chromium only.

## 10 · Phase 1 readiness

Phase 1 can start on this foundation without rebuilding it (Appendix F §9): shells, guards,
session, pipeline, query keys, copy tables, test helpers, the method ledger and the parity harness
are in place. The owner should first settle the Phase-1 items in
`handover/OWNER_DECISIONS_HANDOVER.md` §3 — above all P1-04 (review start), P1-02 / DV-5 (PU-10 and
PU-12 access), P1-01 (sample sign-in), VD-05 (decision panel, needed by SA-03), TE-4 and TE-8
signatures, the hosted seed default and browser persistence if reviewers will walk Flow A — and
P0-01 if the PR should precede Phase 1. Phase 1 is **not** started by this work package.
