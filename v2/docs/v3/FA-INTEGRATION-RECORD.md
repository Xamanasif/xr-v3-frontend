# FA integration record — Faculty on foundation XR-V3-RB-1.0

Stage C of the owner's master integration instruction of 21 Oct 2026 (Academic Reviewer →
Institute Admin → Faculty → Student), on `v3/refined-b-ui` after IA (`5e102ee`). The 21 owned ids:
FA-01 … FA-12, FA-14 … FA-22. The excluded ids FA-13, FA-23 and FA-24 stay excluded.

## 1. Base and safety

- Worktree `/Users/mymac/Desktop/AR-VR-v3-ui`, HEAD `5e102ee`, clean at the start of the stage.
- No build ran in this worktree; product and test-hook builds ran in an isolated copy (ports
  3310 / 3520); the worktree's test-hook development server used 3510. Port 3330 (the Content
  Manager review build) was left running; port 3300 was not running.
- The protected original checkout was only read (`1b090c9`, 98 paths). The V1 Public Landing, the
  public pages and the XS, SA, VE, CM, RV and IA screens were not modified, except additive shared
  pieces listed in §6.

## 2. Source and approval

| Item        | Value                                                                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source      | `XR-V3-Faculty-Final-Source.zip`, 493,753 bytes, SHA-256 `d11a3d009132b3aca3b69639027016b9bed9abd4056b5075cb1bbddf10435bef`: “FINAL — APPROVED BY THE OWNER” (21 Oct 2026) |
| Screenshots | `XR-V3-Faculty-Final-Screenshots.zip`, 52,421,053 bytes, SHA-256 `02507a27acb0dea28317fd07d5d7c4cd6f0e95548e64d378e591a4b0e67d43c9` (kept by the owner)                    |
| Coverage    | 21 screens and 111 subviews: 102 REDESIGNED, 9 REVIEWED AND UNCHANGED, 0 pending (`ROLE-STATUS.json`, `COVERAGE-REGISTER.json`)                                            |
| Foundation  | `XR-V3-RB-1.0`; `FOUNDATION-LOCK.json` (a seventh lock layout: `baseFilesUsed`) names the base hashes; base sheets byte-identical; one role sheet `fa.css`                 |
| Integrity   | 227 files copied byte for byte to `design/v3-refined-b/roles/FA-v1/`; checksum list beside it: 227 OK                                                                      |
| Approval    | The export's own status and the owner's master instruction of 21 Oct 2026 naming this package. Implementation acceptance pending the owner's browser review                |

## 3. How it sits in the product

- **Shell.** `V3_SHELL_ROLES` adds `faculty`: rail Overview, My courses, Assessments, Question
  bank, Marking (count of written answers waiting), Students; the XS-08 banner (paused / inactive)
  first in the page.
- **Stylesheet.** `fa-scoped.css` from `fa.css` in layer `xr.v3.fa` (after `xr.v3.ia`); left out:
  the bare `fa-msg`, `fa-pub*`, the borrowed XS families (`fa-acctwrap`, `fa-menu*`, `fa-menuscrim`),
  the preview-only pieces, and the one rule without a Faculty class (`.rk-panel-head h2:focus`), which
  the Faculty patch re-adds for Faculty panel heads only.
- **Components.** `fa.tsx` (shared: record and identity bands, figures, unit meters, refined table
  and toolbar, segmented control, record tabs, export band, message cards, stepper, form sections,
  question rows, checklist …) and one module per group: `fa-teaching`, `fa-assessments`, `fa-bank`,
  `fa-marking`. Cross-group helpers in `features/faculty/shared/` with frozen APIs
  (`mark-oldest.ts`: “Mark now / Mark next” open the oldest waiting submission).
- **Inline styles.** The export's 47 `style=` values are accounted for: 39 on product elements carry
  patch classes (V3P-17, 19 new `rk-x-*` classes plus V3P-13's `rk-x-ferr-above` and V3P-12's
  `rk-x-hint-list`), 8 are not product (the icon sprite, three co-teacher lines not drawn, three
  borrowed XS-07 Help pieces, the drawer brand). V3P-17 also confines the panel-head focus rule,
  keeps the FA-16 picker's focus target visible (the rating-scale precedent), lets the FA-09 offer's
  button wrap at 375, spaces the Faculty error summaries' links (axe target size) and restores the
  foundation's 6px focus-ring radius on five Faculty controls (cascade check).

## 4. What was integrated

All 21 ids on their normal routes (`/faculty/*`), bound to the existing services: teaching
(FA-01 … FA-05), assessments (FA-06 … FA-12), the question bank (FA-14 … FA-17), marking and
students (FA-18 … FA-21) and the CSV export (FA-22). The register (`V3-STATUS-REGISTER.json`)
states each id's states.

No service contract, permission, assessment rule, marking rule or workflow changed.

## 5. Decisions and discrepancies

1. **No internal reference** (the owner's rule for every role): no assessment, attempt or question
   reference (ASMT-, ATT-, Q-) nor SUB-/UPD-/REQ-/ACC- in words, accessible names, crumbs, dialogs,
   notices, placeholders or tab titles; named by content (the assessment's name or “Untitled
   draft”, “Attempt 1 of 2”, the question's words). The downloaded CSV keeps the service's file
   name; the words do not show it.
2. **Authoritative behaviour resolves open wording:** “Multiple choice” stays (the domain's CSV
   parser and the Student pages' shared words); the export's “Single choice” is not adopted. No new
   XLSX guard on FA-17. P4-06 wording already matched.
3. **Facts no read holds are left out:** the FA-01 drafts row, FA-14 “None now · earlier versions
   keep it”, FA-16 draft marks/source/date, FA-17 per-type figures, FA-20 “Due …”.
4. **Kept product behaviour:** FA-15 saves every edit as a new version (“Saved as version N.”);
   FA-16 “Review and edit” opens the editor in place (no review-a-draft route); FA-17 refuses a
   file-level problem on step 1; a co-teacher's Summary, Questions, Settings and Preview stay
   refused by the service (a held-back card); Save as draft and Create another stay on FA-07.
5. **Words other roles read unchanged:** `copy/assessment-words.ts` and the other keys Student pages
   share keep their words; new Faculty words are new keys.

6. **Consolidation decisions:** “co-teaching colleagues” (the product's existing words) replaces the
   export's “co-teachers”; FA-18 shows “Attempt n of N” from the page's existing `listAssessments`
   read; the FA-12 export words say the file holds every submission (the service exports every
   row, whatever the filter); FA-01 reads the inactive students once per inactive-students fact
   (bounded by the taught experiments, as its other per-experiment reads); Faculty crumbs name the
   assessment by content (“Assessments”, “Marking › Mark a submission”).
7. **Extra existing reads, one per page:** the teaching courses on FA-06, the submissions on FA-08,
   FA-09 and FA-10 (names in the keep and version lines), the questions on FA-14 and FA-16 (counts and
   side facts). No per-row reads.

## 6. What did not change

Shared code touched, additively: the role shell (role set, rail icons), kit options listed in
`COMPONENT-EXTENSIONS.md`, patch entries, the faculty-only entries of shared registers.

## 7. Tests and results

Builds and browser suites ran in an isolated verification copy (ports 3310 / 3520) on the final
consolidated code.

| Check                                | Result                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit and integration                 | packages/ui 85 files, 1,415 tests; apps/web 168 files, 7,639 tests; packages/config 379 + scans 46 (FA-v1 227 OK, register 90 migrated, map, scope boundary, no stale exception); typecheck and lint clean                                                                                                                                                                                                                                |
| Faculty browser specs                | the eleven Faculty specs (phase-4a overview, courses, experiment, assessments, assessment-record, assessment-settings, question-bank; phase-4b submissions, question-tools, marking, faculty-students): 76/76 at each of 1440, 1024, 768, 375 (test-hook development server)                                                                                                                                                              |
| Whole web browser suite, final build | 1440: 570 passed / 7 skipped, 0 failed. Risk-based at 1024 / 768 / 375 (the owner's acceleration instruction): the changed cross-role specs, flows, foundation, both demonstrations, the Student assessment/attempt/result specs and the package-2a/2b screens — 187 / 188 / 189 passed, 0 failed (skips by design). Cross-role specs moved to the V3 markup with their coverage kept (walkthrough D1/D3, the phase-4a/4b demonstrations) |
| Visual parity (v46 harness)          | `gl-01`, `xs-07`, `xs-06-pu-15-messages`: 10/10, with the Faculty's five v46 Help-shell comparisons retired by name under FA-shell (the help header and paused banner were already superseded by XS)                                                                                                                                                                                                                                      |
| Cascade                              | 81 states × 4 widths at rest / hover / focus: five focus-ring radii restored (V3P-17); otherwise no difference                                                                                                                                                                                                                                                                                                                            |
| Inline styles                        | 47 `style=` in the export accounted for: 39 patched (V3P-17), 8 not product                                                                                                                                                                                                                                                                                                                                                               |
| V3 captures                          | 9 cases × 4 widths: no overflow, no clipped text, all font weights, no console error, no reference (`productEvidenceFA`)                                                                                                                                                                                                                                                                                                                  |
| Identifier sweep                     | every list page, the record pages they link to, the assessment tabs and the marking page, after Flow C and after Flow D: no internal reference (ASMT-, ATT-, Q-, SUB-, REQ-, ACC-, DTR- …) in words, accessible names, placeholders or tab titles                                                                                                                                                                                         |
| Integrity                            | handoff-v46 178 · v3-refined-b 46 · XS-v6 125 · SA-v1 29 · VE-v1 85 · CM-v1 140 · RV-v1 120 · IA-v1 151 · FA-v1 227 OK · protected checkout `1b090c9`, 98 paths                                                                                                                                                                                                                                                                           |

## 8. Limits and items for the owner

- Implementation acceptance is pending the owner's browser review.
- Open items recorded by the consolidation: `FaMarksPanel` not merged into `FaPanel`; the FA-04,
  FA-14, FA-18 and FA-20 no-match states are not live regions (the export marks them
  `role=status`); the error-summary spacing fix is opted into by the Faculty only.

## 9. How to review it

The Faculty exists only after the sample journey: in the review build, follow the walkthrough
(Flow A and B; then, as Meera Iyer, add Faculty **Dr S. Ranganathan —
`s.ranganathan@godavari.edu.in`, any password** and assign ME ZG523). Route: Overview (priority
band, Mark now, coming up, your teaching) → My courses (ledger, course, experiments) → Assessments
(create an assessment: steps; the record's Summary, Questions, Settings, Preview, Submissions;
Export CSV) → Question bank (add, edit, draft with assistance, import a CSV) → Marking (queue, mark
a submission, confirm) → Students (formats, inactivity, Export CSV; a student's record).
