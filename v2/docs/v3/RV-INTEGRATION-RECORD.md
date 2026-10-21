# RV integration record — Academic Reviewer on foundation XR-V3-RB-1.0

The fifth owner-approved V3 role export, the Academic Reviewer (RV), integrated into the normal
product on `v3/refined-b-ui` after XS (`d9b7e87`), SA (`cbe6f6d`), VE (`9856946`) and CM (`ff58c5c`,
accepted, record `984efe3`), as Stage A of the owner's master integration instruction of 21 Oct 2026
(Academic Reviewer → Institute Admin → Faculty → Student). The 6 owned ids: RV-01 … RV-06. The
excluded id RV-07 stays excluded.

## 1. Base and safety

- Worktree `/Users/mymac/Desktop/AR-VR-v3-ui`, branch `v3/refined-b-ui`, HEAD `984efe3`, clean.
- Port 3300 (the owner's demo) was not running when the run began; port 3330 (the Content Manager
  review build) was kept, and restarted from its unchanged build after an interruption. No build ran
  in this worktree; product and test-hook builds ran in an isolated copy (ports 3310 / 3520); the
  worktree's test-hook development server used 3510.
- The protected original checkout `/Users/mymac/Desktop/AR-VR` was only read (`1b090c9`, 98 paths).
- The V1 Public Landing, every public page and the XS, SA, VE and CM screens were not modified,
  except shared, additive pieces listed in §6.

## 2. Source and approval

| Item        | Value                                                                                                                                                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source      | `XR-V3-RV-Academic-Reviewer-FINAL-source.zip`, 239,917 bytes, SHA-256 `6db794fd619534e4f2bc80096bae65a7a3143e5662ef19a914bb95856dca37dc`: “FINAL — OWNER APPROVED, 21 October 2026”; canvas https://claude.ai/artifact/UoN1uXrBjqxqNtKTXLb3rF |
| Screenshots | `XR-V3-RV-Academic-Reviewer-FINAL-screenshots.zip`, 15,761,505 bytes, SHA-256 `d596a85db7073cbfeb47cc375641c51c5f2f5cc56bf06fc48d874ad5cb2b3885`: 65 boards (kept by the owner, not copied)                                                   |
| Supersedes  | the completed role of 18 Oct and refinement checkpoint 1 (refused for integration 21 Oct, not imported)                                                                                                                                       |
| Coverage    | 6 of 6 owned ids; 42 subviews (30 REDESIGNED, 12 REVIEWED AND UNCHANGED), none pending (`COVERAGE.md`)                                                                                                                                        |
| Foundation  | `XR-V3-RB-1.0`; `FOUNDATION-LOCK.json` (a fifth lock layout, `copiedBaseFiles`) names the ten base hashes; `core.css`, `rb.css`, `rb-kit.css` byte-identical; one role sheet `rv.css`                                                         |
| Integrity   | 120 files copied byte for byte to `design/v3-refined-b/roles/RV-v1/`; checksum list recorded beside it (`RV-v1.SHA256SUMS.txt`): 120 OK                                                                                                       |
| Approval    | The export's own status (“FINAL — OWNER APPROVED, 21 October 2026”, owner's words in `ROLE-STATUS.md`) and the owner's master instruction of 21 Oct 2026 naming this package. Implementation acceptance is pending the owner's browser review |

Not product UI and not imported: the live root's sample world and handlers, the boards (presets of
`project/RV.dc.html`), and the borrowed XS renderings (`rv-acctwrap`, `rv-menu*`, `rv-msg*`,
`rv-file`, `rv-formact`, `rv-solo*` — the delivered XS components draw them).

## 3. How it sits in the product (ADR-0010)

- **Shell.** `V3_SHELL_ROLES` adds `academic_reviewer`: rail Overview, Review queue (gold count, the
  export's words “N items waiting for review”), Reviewed by me; Help & support in the rail foot; the
  date alone in the top line.
- **Stylesheet.** `rv-scoped.css` generated from `rv.css` (fifth lock layout) in layer `xr.v3.rv`
  between `xr.v3.cm` and `xr.v3.patch`; the borrowed XS families and the two grouping rules they
  emptied are left out.
- **Icons.** 30 `rvi-*` glyphs: 17 already in the kit, `reviewQueue` from the v46 registry, 13 new
  (review kinds, document, play, message, layers, live, flag, outside scope, unavailable, trash).
- **Components.** `rv.tsx` (19 shared: kind tag, course, status, format badges, identity card with
  page map, detail layout, blocks, comparison, read-only outcomes, readiness list, path, refusal,
  decision outcome, history); `rv-lists.tsx` (17), `rv-submission.tsx` (14), `rv-update.tsx` (1).
  The app's shared models (`features/reviewer/shared/`) derive kind, standing, course names (one
  aggregate read), waiting age on the sample clock and the parent list. `ChoiceGroup` gained an
  additive per-option `describedBy`.
- **Patches.** V3P-15: two cascade restorations (focus radius 6 px of `rv-filecard` links and the
  outcome message, where core.css outranks `rv.css` in the export). Every one of the export's 7
  `style=` is accounted for (`rk-next` 12 px is V3P-12's `RecordLine space="above"`).

## 4. What was integrated

| Id       | Product                                                                                                                                                                                                                                                                                  | Where                        |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| RV shell | V3 shell, rail with the Review queue count, Menu drawer below 1024 px                                                                                                                                                                                                                    | `/reviewer/*`                |
| RV-01    | Overview: the review desk (oldest first, waiting time, the one gold action), next in line, the queue by type, scope with course names, recent decisions, calm                                                                                                                            | `/reviewer`                  |
| RV-02    | Review queue: type tabs with counts (arrow keys), course filter (`?course=`), type tags, waiting time; filtered, no match, loading, couldn't load, empty                                                                                                                                 | `/reviewer/queue`            |
| RV-03    | Review a submission: identity card and page map; why it is here; learning outcomes (editor, the rule before Approve); reference blocks and delivery cards; decision panel (return inline with reasons and references, approve confirmation); re-check, approved, returned, errors, stale | `/reviewer/submissions/{id}` |
| RV-04    | Review an update: why, live against proposed comparison, the live experiment, approve confirmation (approving releases nothing), return inline; approved, returned, stale                                                                                                                | `/reviewer/updates/{id}`     |
| RV-05    | Reviewed by me: decisions with type tags and where each is now; updates only, no match, loading, couldn't load, empty                                                                                                                                                                    | `/reviewer/reviewed`         |
| RV-06    | Decided item, read-only: approved, returned, update with the Super Admin, decided elsewhere                                                                                                                                                                                              | the item pages, decided      |

The behaviour is the product's own: `getReviewerOverview`, `getReviewQueue`,
`getSubmissionForReview`, `approveSubmission`, `returnSubmission`, `listReviewedByMe`,
`getUpdateForReview`, `approveUpdate`, `returnUpdate`; their validation, refusals, stale checks
(`expectedRev`) and repeat-press protection; the reviewer's course scope (`scopeCovers`); what
other roles see. No service contract, permission, workflow or publication rule changed.

## 5. Decisions and discrepancies

1. **Owner's known issues.** UPD-0006: the reviewer's EEE ZC341 scope was withdrawn (sample world),
   and the domain shows an update only while an active scope covers its course — the product hides
   it from Reviewed by me and refuses its page (not found); nothing is hard-coded, a restored scope
   brings it back. SUB-0070: the page shows the three outcomes, the count and the dates its record
   holds.
2. **Data the list reads do not hold is left out** (no per-row reads): outcome counts and changed
   fields on queue rows, a re-check's revision and sender, update versions and the release date on
   Reviewed by me (“Released by the Super Admin”), the vendor fact on RV-04, the withdrawal date the
   reviewer's read hides.
3. **Interactions as the export draws them.** No decision preselected (“Choose a decision”); return
   to the vendor / to the Content Manager completed in the decision panel (v46 had dialogs); Approve
   keeps its confirmation (busy: Cancel disabled, focus on the title).
4. **Refusals keep the product's behaviour.** An item outside scope or not sent is not found (its
   existence is not revealed — state copy `RV-03.not-yours`, `RV-04.not-sent`), drawn with the XS
   message page; the export's “isn't in your review scope” / “isn't available” cards are not
   adopted.
5. **No internal reference** (the owner's rule for every role): no SUB-/UPD-/REQ-/ACC-/DTR-/SUP-
   reference in reviewer words, accessible names, dialogs (“Approve the update to <experiment>?”),
   breadcrumbs (they name the experiment), tab titles or the Report a problem prefill. Exceptions:
   seeded text quoted as written (“Correction UPD-000n.”) and support references on Help (XS).
6. **Navigation context.** The breadcrumb and tab title name the parent list (Review queue or
   Reviewed by me); the rail keeps Review queue current for decided items (active-item map).

## 6. What did not change

The V1 Public Landing; every public page; the XS, SA, VE and CM screens. Shared code touched,
additively: the role shell's role set and count words, `ChoiceGroup`'s `describedBy`, icons, a patch
entry, the reviewer entries of `nav/place-words.ts`; the unused `features/shared/correction-comparison/`
was removed. Other roles' pages and shells keep their presentation; the domain, contracts, sample
platform and services are unchanged.

## 7. Tests and results

Builds and browser suites ran in an isolated verification copy (ports 3310 / 3520); the owner's
servers were not touched. The full platform gate (`pnpm verify`) runs once at the end of the
four-role run (the owner's fast-track protocol); this stage ran the focused checks below.

| Check                       | Result                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit and integration        | packages/ui 75 files, 1,191 tests; apps/web 161 files, 7,012 tests; packages/config 379 + scans 46 (V3 reference: RV-v1 120 OK, register 50 migrated, map, scope boundary); typecheck and lint clean                                                                                                                                                                                                                    |
| RV browser specs            | reviewer-lists, reviewer-review, review-update: 10/10 at 1440, 1024, 768 and 375 (test-hook development server), and again on the product/test-hook builds                                                                                                                                                                                                                                                              |
| Whole web browser suite     | 1440: 555 passed / 7 skipped; 1024: 494 / 68; 768: 494 / 68; 375: 499 / 63 — 0 failed (skips by design, as before). Before the cross-role update, 10 tests failed at 1440, all in five specs that drove reviewer pages through v46 markup (`flows/alternates`, `flows/walkthrough`, `phase-5/demonstration`, `phase-6/demonstration`, `phase-6/platform-roles`); they now assert the V3 markup with their coverage kept |
| Final build, focused re-run | after the last kit changes: the RV specs, flows, both demonstrations, platform-roles and navigation at 1440 and 1024: 61 passed, 17 skipped, 0 failed                                                                                                                                                                                                                                                                   |
| Visual parity (v46 harness) | `gl-01` and `xs-07` 8/8 with the five v46 reviewer-shell comparisons retired by name under RV-shell                                                                                                                                                                                                                                                                                                                     |
| Cascade                     | about 100 states per width at four widths, at rest / hover / focus: two differences (focus radius), restored by V3P-15                                                                                                                                                                                                                                                                                                  |
| V3 product captures         | 9 cases × 4 widths: no overflow, no clipped text, all font weights, no console error (`productEvidenceRV`)                                                                                                                                                                                                                                                                                                              |
| Identifier sweep            | every reviewer screen, dialogs and tab titles: no internal reference except the seeded “Correction UPD-000n.” quotes                                                                                                                                                                                                                                                                                                    |
| Integrity                   | design/handoff-v46 178 OK · v3-refined-b 46 OK · XS-v6 125 · SA-v1 29 · VE-v1 85 · CM-v1 140 · RV-v1 120 OK · protected checkout `1b090c9`, 98 paths                                                                                                                                                                                                                                                                    |

## 8. Limits and items for the owner

- Implementation acceptance is pending the owner's browser review.
- Sign-in stays the prototype stand-in.

## 9. How to review it

The review build for the four-role run is started once all four roles are integrated (the owner
reviews them together). Seeded account: **Prof. A. Menon, Academic Reviewer —
`a.menon@wilp.example`, any password**. Route: Overview (the desk, Start review) → Review queue
(type tabs, course filter) → a new submission (Flash Distillation: add learning outcomes, Approve
with its confirmation; or Return to vendor inline with a reason and a reference) → the re-check
(Venturi Meter Calibration) → Reviewed by me → a decided submission (Packed Bed Pressure Drop, its
three outcomes) and the update with the Super Admin (Boiler Drum Level).
