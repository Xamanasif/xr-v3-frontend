# Phase 4B — record (Faculty assessment, Student attempts and marking)

|                  |                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorisation    | Owner, 16 Oct 2026 — "Phase 4B Authorization — Complete Faculty Assessment, Student Attempts and Marking" (12 designed ids; FA-13 excluded, undesigned)                              |
| Base             | `41b3ab9` (Phase 4A) on `v2/frontend-v46`; safety bundle `~/Downloads/XR-frontend-v46-41b3ab9-phase4b-pre.bundle` (+ `.sha256`; `git bundle verify` OK, restore-tested to `41b3ab9`) |
| Design authority | `design/handoff-v46/` (frozen, 178/178): B4-06 f7 … f11, B4-08 … B4-14; boards 05 / 06 / 07                                                                                          |
| Owner decision   | **P4-01 / DV-2 (asked in session, 16 Oct 2026): "Answer-key stand-in"** — §4                                                                                                         |
| Verdict          | see §9                                                                                                                                                                               |

## 1 · Screens — the 12 Phase-4B ids (87 of 123 designed ids built)

| Id    | Screen                          | Route                                                        | Board / frames        |
| ----- | ------------------------------- | ------------------------------------------------------------ | --------------------- |
| ST-11 | Assessments                     | `/student/assessments` (`?tab=submitted · results`)          | B4-11 f0 … f6         |
| ST-12 | Assessment — before you start   | `/student/assessments/[assessmentId]`                        | B4-11 f11 … f16       |
| ST-13 | Assessment attempt (focused)    | `/student/assessments/[assessmentId]/attempt`                | B4-12 f0 … f6         |
| ST-14 | Result                          | `/student/assessments/[assessmentId]/result`                 | B4-13 f0 … f5         |
| FA-12 | Assessment · Submissions        | `/faculty/assessments/[assessmentId]/submissions`            | B4-06 f7 … f11        |
| FA-16 | Draft questions with assistance | `/faculty/question-bank/draft` (`?experimentId=`)            | B4-08 f0 … f4         |
| FA-17 | Import questions (CSV)          | `/faculty/question-bank/import` (`?experimentId=`)           | B4-08 f5 … f9         |
| FA-18 | Marking queue                   | `/faculty/marking` (`?assessmentId=`, `?state=marked · all`) | B4-09 f0, f4, f5      |
| FA-19 | Mark a submission               | `/faculty/marking/[attemptId]`                               | B4-09 f1 … f3, f7, f8 |
| FA-20 | Students                        | `/faculty/students` (`?experimentId=`)                       | B4-10 f0, f1, f6, f7  |
| FA-21 | Student detail (per experiment) | `/faculty/students/[studentId]?experimentId=`                | B4-10 f3 … f5         |
| FA-22 | Export CSV (action)             | "Export CSV" on FA-12 and FA-20                              | B4-06 f10, B4-10 f2   |

Also built from the same boards: the experiment hub's Assessment tab
(`/student/experiments/[experimentId]/assessment`, B4-11 f7 … f9, a tab of ST-05), Home's "Up next"
assessment link (B4-11 f10), and every Phase-4A action that waited for these screens (DEV-21): the
record's Submissions tab, FA-08 "Mark next" / "See submissions", FA-01 "Mark <n> written answer" /
"Mark now" / "View students", FA-03 "Students on this experiment", FA-05 "Mark <n> written answer" /
"See students on this experiment", FA-07 step 3 and FA-09 "Draft with assistance" / "Import", FA-14's
"Drafts to review" tab. The Student sidebar gains Assessments and the Faculty sidebar Marking (with
the count of written answers waiting) and Students — both sidebars are now complete. ST-13 is a new
route kind `focused`: the session gate and workspace guard without the shell (B4-12 draws no
sidebar). Not built: FA-13 (undesigned), B4-09 f6 (the Institute Admin's "no Faculty marker" row, a
later sample), FA-01's "Review drafts" row (no drafts fact, §7).

Built by seven parallel builders (Workstream A: ST-11 … ST-14, FA-12, FA-18, FA-19; Workstream B:
FA-16, FA-17, FA-20 … FA-22) with strict file ownership on lead-made services, routes, queries,
navigation and the focused frame.

## 2 · Services and contracts

- **Delivered (`PACKAGE_DELIVERIES` Phase 4B)**: `AssessmentService.exportSubmissionsCsv`,
  `TeachingService.exportStudentsCsv`, `QuestionBankService.requestDrafts`, `listDrafts`,
  `addDraftToBank`, `discardDraft`, `previewQuestionImport`, `commitQuestionImport`. Every Phase-4
  method is now implemented (183 methods; 16 deferred to Phases 5–6). The attempt, marking and
  teaching reads/commands were WP-0.11 methods; Phase 4B completed their outputs.
- **No new method** (the 183-method contract, ADR-0008, is unchanged); additive provisional facts
  instead: **PC-54** pinned release terms; **PC-55** the Student's own attempts, the attempt sheet
  (questions WITHOUT key, explanation or guidance) and the pinned version's facts, the released
  review's question words; **PC-56** Student list facts; **PC-57** submissions `outOf` / `release`;
  **PC-58** marking numbering and names, written questions as the attempt's version pins them;
  **PC-59** FA-20 / FA-21 facts and the Progress filter, the co-teacher `policy-open` row; **PC-60**
  the answer-key stand-in (owner-approved interim); **PC-61** import-problem parameters and two
  undrawn file keys (`FA-17.file.columns`, `FA-17.file.no-rows`).
- **CSV (FA-22)**: produced by the service — RFC 4180 quoting; a cell starting with `=`, `+`, `-`,
  `@`, tab or CR gets a leading apostrophe; the list on screen only (FA-20's filters travel with
  the export); downloaded in the tab (`downloadCsv`, UTF-8 BOM). Nothing is sent anywhere.
- **Drafting (FA-16)**: a deterministic sample stand-in in the sample platform (no provider, T-23),
  labelled on screen as sample drafts; drafts are adapter state, never in the bank until the
  Faculty member adds a reviewed one (marks set by them); 5 of one type are 5 distinct drafts.
- **Import (FA-17)**: the ten-column template; the service parses the file, reports errors /
  warnings per row; all or nothing (T-24 interim); the staged file is its Faculty member's own;
  questions go into the bank only.
- Tests: `sample-platform` `faculty-4b.test.ts` (14) and the updated 4A / pipeline tests; contract
  suite unchanged (`flow:D` with the seam, `flow:D-objective-marks-interim` still policy-open).

## 3 · Flow D on the product build (`e2e/phase-4b/demonstration.spec.ts`, one tab, 4 widths)

Request → approval → payment stand-in → access active → Meera assigned → Meera adds Rahul and gives
him Shell-and-Tube → adds Dr S. Ranganathan and assigns ME ZG523 → **he** creates "Heat Exchanger —
post-lab" with its own rules (nothing pre-filled; results "Immediately after marking"), writes a
multiple-choice, a true-or-false and a written question, adds them (3 questions · 14 marks), previews
it, the Submissions tab says "No submissions yet" → **Rahul**: Home "Up next" → Before you start →
Start → the attempt (a focused page, no key on it): answers save ("All answers saved", 3 of 3) →
Submit → DL-1 → "Answers submitted" → his result page "Submitted — waiting for marking", no figure;
Assessments › Submitted (1) → **Dr Ranganathan**: Overview "1 written answer to mark" → Marking →
"Mark Rahul Verma" → FA-19 ("Marked automatically · 4 of 4 marks" by the stand-in) → mark 7 +
feedback → Confirm marks → DL-1 → "Marks confirmed", read-only → Submissions: Marked · 11 of 14 ·
Released (no release control anywhere) → Export CSV (file checked) → Students → Rahul's detail
("Marked 11 of 14") → Export CSV → **Rahul**: Assessments › Results (1) → "You passed · 11 of 14
marks", every answer with its correct answer, "Feedback from Dr S. Ranganathan". Every step by a
link or button; one document throughout; no test hook.

## 4 · Policy handling (nothing decided by the build beyond the owner's answer)

| Rule / open decision         | What the build does                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P4-01 / DV-2 / ATT-07**    | **Owner answer (16 Oct 2026): answer-key stand-in.** Local prototype build only (composition root `objectiveMarks: 'answer-key-on-submit'`): on submit `system:objective-marks` awards each single-choice / true-or-false question full marks when the answer equals the pinned version's key, else 0, through `applyObjectiveMarks`. `@xr/domain` has no scoring function; other builds and the tests keep DV-2 (`supplied-only`). PC-60 |
| M22 / ATT-17                 | Unchanged: an attempt with no written question, or several, cannot be confirmed (`policy-open`); FA-19 says so calmly                                                                                                                                                                                                                                                                                                                     |
| T-22 / BC6                   | Three question types, no timer, explicit Submit through DL-1 only; leaving the page saves pending answers but never submits                                                                                                                                                                                                                                                                                                               |
| P4-06 (open)                 | A submitted attempt keeps its version's terms: release, deadline, marks and questions are read from the pinned version everywhere (ST-11 … ST-14, FA-12, FA-19, FA-21; ST-12 shows the attempt's pinned facts beside its notice)                                                                                                                                                                                                          |
| T-20 / ATT-10                | Confirmed marks read-only (domain and UI); no re-marking                                                                                                                                                                                                                                                                                                                                                                                  |
| B4-14 D4                     | No release button anywhere; a result shows only when the pinned version's setting allows it (`resultView`)                                                                                                                                                                                                                                                                                                                                |
| OD-B4-17 (co-teaching, open) | Narrow protective refusals, tested: a colleague's assessment answers `policy-open` for its record (when it pins their questions), preview, submissions, export, marking page, marks; the queue and FA-01 leave it out; FA-20 rows and FA-21 withhold its results; every screen shows a calm "isn't available to you yet"                                                                                                                  |
| Student reads                | Faculty reads (`getAssessment`, `listSubmissions`, `listQueue`, `getAttemptForMarking`, `getStudentDetail`, the exports, drafts) refuse a Student; `getResult` answers only the Student; no key, explanation or guidance before release                                                                                                                                                                                                   |
| T-23 / OD-B4-12              | Sample drafting stand-in, visibly labelled; drafts carry no marks (the board's "· 2 marks" not shown); never added silently                                                                                                                                                                                                                                                                                                               |
| T-24 / OD-B4-11              | CSV only, all or nothing, errors block, missing explanation warns                                                                                                                                                                                                                                                                                                                                                                         |
| OD-B4-10 (sample rule)       | Inactivity: days since the last activity, or since the experiment was given when there is none (B4-10 f0 "None since access was given … · Inactive 26 days")                                                                                                                                                                                                                                                                              |
| T-18 / FA-13                 | Not built; Ready = visible (existing interim)                                                                                                                                                                                                                                                                                                                                                                                             |
| TE-3 / T-12, P3-03           | Not implemented (§5)                                                                                                                                                                                                                                                                                                                                                                                                                      |

State copy: every undrawn state of the new screens is a provisional entry of the one register (seven
new `copy/state-copy-*.ts` files); decision ids never appear in visible copy.

## 5 · Carry-forward limitations (unchanged)

1. **TE-3 / T-12** — normal-product WEB simulation completion and format feedback stay blocked: no
   product action reaches In progress / Completed; only the CI runtime seam or fixtures do.
2. **P3-03** — the Student device-transfer chain starts only from a seed-supplied device.

Neither was implemented in Phase 4B.

## 6 · Visual comparison

Each group compared its screens with the B4 frames at the frame width (board renders and product
screenshots in the session scratchpad; not committed). Layout, classes, spacing and words match;
remaining differences are sample data (dates from the fixture clock, attempt ids, "MEC-523" the
institution's own code, alphabetical rows), recorded choices (§7) or the dev indicator in dev-server
shots. Parity suite: the Student shell on Help (board 05) and the three Student board-07 frames now
come **within tolerance with no deviation** (DEV-21 no longer applies to the Student); the Faculty
sidebar on Help differs only in its Marking count's figure (**DEV-44**, new, sample data); the two
board-07 validation comparisons keep DEV-12. Pins 168 → 171, none changed.

## 7 · Recorded choices and deviations (owner review)

- ST-13 adds a skip link and gives the avatar `role="img"` (axe); its back link opens the experiment
  hub. ST-12's "You have used" counts submitted attempts (f12 draws "none" beside attempt 1 in
  progress).
- FA-12: the export holds every submission whatever the on-screen filter (the board script and the
  service); rows stack at narrow widths as the 720 frames draw. FA-21 "See submission" opens FA-12
  (as B4-10 f4 links it); "Mark their answers" FA-19.
- FA-16: drafts show their type without marks; the lab brief line has no "· PDF document" (the read
  carries titles only); the inline review editor is not drawn on a board (B4-07's editor fields).
- FA-17 step 2 uses labelled rows at 375 (no frame drawn); error-summary links are 24 px tall (axe).
- FA-01 "Review drafts" stays not rendered: the overview read names no drafts (PC-51), and drafts are
  adapter state outside the record-change refresh — a count could go stale.
- FA-19's top bar reads "Mark a submission" below 1024 px (B4-09 f2 … f8); FA-20's Experiment filter
  is hidden below 600 px, as drawn.

## 8 · Independent review (one bounded pass) and fixes

No owner-rule violation in the Student reads, the release rules, the stand-in's scope, CSV safety
or drafting. Findings fixed, each with a test:

- **HIGH** — FA-01 showed a co-teacher a colleague's waiting submission (Student name, time) and its
  buttons led to an empty queue: the overview and `listAssessments.waitingForMarking` now leave a
  colleague's assessment out.
- **MEDIUM** — ST-13 could hold a cached sheet and keep a stale revision after a refused Submit
  (Submit locked until reload); a save refused for good stayed queued: the page now holds a settled
  read, adopts the re-read revision, and drops refused saves.
- **MEDIUM** — FA-05 showed a co-teacher "failed — Try again" forever: now the calm held-back row.
- **MEDIUM** — ST-12 showed the current version's facts beside a pinned attempt's notice: the
  attempt's own pinned facts are now shown (PC-55 `pinned`); ST-11 / the hub use its deadline.
- **LOW** — FA-12 "Mark next" never offers a choice-only submission once the queue answers; ST-14's
  waiting line drops "Your faculty marks written answers" when there is none; drafts are distinct.

Also found during integration (B6, A3): FA-20 inactivity now counts from access when there is no
activity; FA-21 answers not-found for a Student never given the experiment (after a withdrawal the
Faculty member still reads their work, WP-0.14). Left as recorded: FA-06's submitted count on a
colleague's assessment (co-teachers "see the same assessment", ASMT-13); FA-20 last activity counts
opening a colleague's assessment (OD-B4-10 activity).

## 9 · Verification and verdict

`pnpm verify`, 16 Oct 2026, run `2026-10-16T09-09-21-420Z-verify`: **VERIFY PASSED** in 2,109 s,
first run.

| Step       | Result                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format     | prettier clean                                                                                                                                                                                    |
| repository | 32 checks · handoff 178/178 · audit evidence 36/36 · v46 copies 27/27 · scans clean                                                                                                               |
| workspace  | build 12/12, typecheck/lint/test 40/40 · **7,359 unit tests** (Phase 4A: 6,716): web 4,269, contracts 767, sample-platform 274, ui 832, domain 787                                                |
| bundle     | 1,649 product files, 0 test-seam or harness sentinels; the test-hook build carries the bridge (6/6 markers)                                                                                       |
| browser    | **2,833 passed** (Phase 4A: 2,646; web 1,694), 0 failed, 659 skipped (width-gated and the 36 deferred flow skeletons); Chromium only                                                              |
| parity     | 95/95 tests · 764 comparisons: 628 within, 136 registered, **0 unregistered**, 0 masked; pins 168 → 171 (the Faculty sidebar `-phase-4b`, DEV-44; two board-07 `-phase-4b`, DEV-12), none changed |

Phase-4B browser specs (`e2e/phase-4b/`, 8 files) at 1440 / 1024 / 768 / 375: the product-build
Flow D demonstration (§3) and seven screen-group suites — every drawn state through `checkState`
(axe WCAG A/AA, one h1, visible focus, 24 × 24 targets, no sideways scroll), the primary
interactions by real clicks and typing (state tabs, Start / Continue / Try again, autosave and the
strip, DL-1 submit, marking with validation and DL-1 confirm, filters and chips, both CSV downloads
read back, drafting add / review / discard, the import's three steps with a real file), and each
375 / 768 layout. States the browser seam cannot reach (a fault for now, a moved clock) are proven by
the component tests. `DEVIATIONS.md` regenerated from this run.

**Verdict: CONDITIONAL PASS** — all 12 Phase-4B ids built with verified primary interactions on the
one world, and Flow D verified end to end on the normal product build with no test hook: a Faculty
member assigned a course by the Institute Admin creates and fills an assessment, the eligible
Student attempts and submits it, the Faculty member marks and confirms, and the Student sees the
result as the assessment's own release setting allows (87 of 123 designed ids). Conditional on:
the owner's P4-01 answer being an interim (PC-60); P4-06 and OD-B4-17 (§10); the carried TE-3 /
T-12 and P3-03 limits (§5); the provisional state-copy entries and PC-54 … PC-61; DEV-44;
Chromium-only and same-machine parity.

## 10 · Owner decisions outstanding

- **P4-01** — answered for this prototype (answer-key stand-in, PC-60); the final rule (automatic
  marking vs BC10 "grading automation") stays the owner's.
- **P4-06** — release changes after a submission (the domain keeps the attempt's version's terms).
- **OD-B4-17** — co-teaching ownership (protective refusals only).
- **Released results after access ends** (new): `getAssessmentIntro` refuses a Student whose access
  was withdrawn or ended, so an already released result is no longer reachable (ST-19 shows).
- T-18 (FA-13), T-19 … T-24, OD-B4-01 … OD-B4-16, M22, ATT-17, the provisional state-copy entries,
  PC-51 … PC-61, DEV-21 (Super Admin and Institute Admin only), DEV-44; carried TE-3 / T-12, P3-03,
  SACC-14, DEV-43, T-11, Chromium-only and same-machine parity.
