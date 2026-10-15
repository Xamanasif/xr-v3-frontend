# Phase 4A — record (Faculty workspace and assessment authoring)

|                  |                                                                                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorisation    | Owner, 16 Oct 2026 — "Phase 4A Authorization — Accelerated Faculty and Assessment Authoring" (13 designed ids; FA-13 excluded, undesigned)                                          |
| Base             | `f1c6bdb` (Phase 3) on `v2/frontend-v46`; safety bundle `~/Downloads/XR-frontend-v46-f1c6bdb-phase4a-pre.bundle` (+ `.sha256`; `git bundle verify` OK, restore-tested to `f1c6bdb`) |
| Design authority | `design/handoff-v46/` (frozen, 178/178): B4-01 … B4-07; boards 05 / 06 (Faculty shell)                                                                                              |
| Verdict          | see §8                                                                                                                                                                              |

## 1 · Screens — the 13 Phase-4A ids (75 of 123 designed ids built)

| Id    | Screen                          | Route                                                                                 | Board / frames           |
| ----- | ------------------------------- | ------------------------------------------------------------------------------------- | ------------------------ |
| FA-01 | Overview (Faculty home)         | `/faculty`                                                                            | B4-01 f0–f4              |
| FA-02 | My courses (Courses tab)        | `/faculty/courses`                                                                    | B4-02 f0, f6, f7, f8     |
| FA-03 | Course (teaching view)          | `/faculty/courses/[courseId]`                                                         | B4-02 f1                 |
| FA-04 | Experiments (tab of My courses) | `/faculty/courses?tab=experiments`                                                    | B4-02 f2–f5, f8          |
| FA-05 | Experiment (teaching view)      | `/faculty/experiments/[experimentId]`                                                 | B4-03 f0–f4              |
| FA-06 | Assessments                     | `/faculty/assessments`                                                                | B4-04 f0, f9, f10        |
| FA-07 | Create assessment (guided)      | `/faculty/assessments/new?step=experiment·rules·questions·preview` (`?experimentId=`) | B4-04 f1–f8, f11         |
| FA-08 | Assessment · Summary            | `/faculty/assessments/[assessmentId]`                                                 | B4-05 f0, f3, f4, f5     |
| FA-09 | Assessment · Questions          | `/faculty/assessments/[assessmentId]/questions`                                       | B4-05 f1, f2, f6, f7, f8 |
| FA-10 | Assessment · Settings           | `/faculty/assessments/[assessmentId]/settings`                                        | B4-06 f0–f4              |
| FA-11 | Assessment · Preview            | `/faculty/assessments/[assessmentId]/preview` (`?view=key`)                           | B4-06 f5, f6             |
| FA-14 | Question bank                   | `/faculty/question-bank` (`?experimentId=`)                                           | B4-07 f0, f2, f7, f9     |
| FA-15 | Add / edit question             | `/faculty/question-bank/new` · `/faculty/question-bank/[questionId]`                  | B4-07 f3–f6, f8          |

The Faculty sidebar now lists Overview · My courses · Assessments · Question bank (Help in the
foot); `/faculty` is FA-01, no longer the interim landing. Marking (FA-18) and Students (FA-20)
are Phase 4B and are not rendered (DEV-21), nor is any action that opens a Phase-4B screen: the
record's Submissions tab (FA-12), "Mark now / Mark next / Mark n written answer" (FA-18), "View
students / See students on this experiment" (FA-20), "Draft with assistance" and the bank's
"Drafts to review" tab (FA-16), "Import" (FA-17). `/faculty/question-bank/draft` and `/import`
are reserved and resolve to the in-shell not-found.

Built by seven parallel builders with strict file ownership on lead-made scaffolding (routes,
addresses and shell placements `nav/faculty.ts`, the reads `queries/teaching.ts`, the form checks
`queries/faculty-forms.ts`, the shared assessment words, the record frame and the rules form).

## 2 · Services and contracts

- **Delivered (Phase 4A, `PACKAGE_DELIVERIES`)**: `TeachingService.getFacultyOverview`,
  `listMyCourses`, `getTeachingExperiment`; `AssessmentService.listAssessments`,
  `getCreateOptions`, `previewAsStudent`. 183 methods = 159 implemented + 24 deferred to Phases
  4B–6. Create / settings / questions / question-bank commands were already WP-0.11 methods.
  Still deferred: `exportSubmissionsCsv`, `exportStudentsCsv`, `requestDrafts`, `listDrafts`,
  `addDraftToBank`, `discardDraft`, `previewQuestionImport`, `commitQuestionImport` (and Phases 5–6).
- **Scope**: every Faculty read is the Faculty member's own (any other role → not-permitted
  `wrong-workspace`); experiments are Faculty courses (IA-15) ∩ the institution's plans
  (`facultyScope`); an experiment outside it → not-permitted `out-of-scope` (screens: in-shell
  not-found). The answer key is never a Student's (`previewAsStudent` refuses them).
- **Preview** shows each question at the version the assessment pins (never a newer bank version)
  with the answer key and marking guidance; it creates no attempt and writes nothing.
- **Additive contract facts** (provisional register): **PC-51** — FA-01 attention as facts
  (`written-answers-to-mark`, `students-inactive`, `access-ended`) and `comingUp.name`;
  **PC-52** — `teachingExperimentOutput.resources` and `asOf`; **PC-53** —
  `getAssessmentOutput.submittedOnCurrentVersion` (the domain versions a change only while the
  current version has submissions).
- **Contract suite**: + `teaching:authoring` (mapped course reaches the Faculty member → draft with
  nothing pre-filled, invisible to Rahul → settings → a new question added → Ready → preview with
  the key, no attempt, refused to the Student → Ready visible to the Student). Sample-platform
  unit tests + `faculty-4a.test.ts` (14).
- No domain, policy or `@xr/ui` change.

## 3 · Connected workflow (product build, `e2e/phase-4a/demonstration.spec.ts`, one tab, 4 widths)

Request → approval → payment stand-in → access active → Meera assigned → Meera adds Rahul and gives
him Shell-and-Tube → Meera adds Dr S. Ranganathan and assigns ME ZG523 in Faculty courses → **he
signs in**: Overview "You teach 1 course · 1 experiment" → My courses → Open course → Open
experiment (no assessment yet) → Create assessment (experiment carried) → rules typed, every field
empty to start → empty bank → "New question" writes a multiple-choice question and returns with it
ticked, everything typed kept → Preview → Create assessment: Ready → Open assessment: Summary
(reaches 1 student) → Settings: pass mark 50 → 60, saved → Questions: "New question" writes a
true-or-false question; back on Questions it is offered first in the bank panel and added by the
Faculty member (never attached silently) → Preview: both questions, then the answer key → the same
records in Assessments (Ready) and the Question bank (2 questions). Every step by a link or button;
one document throughout.

## 4 · Policy handling (nothing decided by the build)

| Open decision / rule          | What the build does                                                                                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BC6 / T-19 / T-22             | Every rule starts empty (create and a draft's Settings); no option pre-selected; no timer or time limit; no universal settings                                                                |
| T-18 / FA-13 (undesigned)     | No availability control: Ready = visible to Students who have the experiment (the existing interim); drafts are never shown to Students                                                       |
| T-23                          | No drafting provider; FA-16 / FA-17 and the Drafts tab not rendered; FA-01 has no drafts row                                                                                                  |
| T-20 / T-21 (marking)         | No automatic marking or suggestion anywhere; marking screens are Phase 4B                                                                                                                     |
| B4-14 D4                      | Configuration only — no result-release control                                                                                                                                                |
| Versions (OD-B4-17 surrounds) | Bank edits make a new question version; assessments keep their pinned version until "Use updated version"; a change after a submission makes a new assessment version, with the drawn notices |
| OD-B4-01                      | One assessment per experiment per institution: the service refuses a second (`assessment-exists`); B4-04 f8's words                                                                           |
| OD-B4-10 / PC-22              | `students-inactive` follows FA-20's sample rule (no activity counts as inactive); its row is not rendered until FA-20 exists                                                                  |
| OD-B4-17                      | A colleague's question or assessment answers policy-open: a plain provisional message, no form (no fixture reaches it)                                                                        |
| M22                           | "8 of 16 marks" shown as the service computes it; rounding open                                                                                                                               |

192 new provisional state-copy entries (eight `copy/state-copy-*.ts` files), each with its basis
and decision ids; decision ids never appear in visible copy.

## 5 · Phase-3 carry-forward — limitations that still stand

1. **Normal-product WEB simulation completion and feedback remain blocked** without an approved
   TE-3 sample-runtime approach (T-12 open): a product build never reaches In progress, Completed
   or format feedback — only the CI runtime seam or seed fixtures do.
2. **The ordinary Student device-transfer chain remains blocked** without an approved P3-03 device
   registration or demo seed: no product action records an authorised device.

Neither mechanism was invented and Phase 3 was not modified. They do not affect Phase 4A.

## 6 · Visual comparison

Each group compared its pages with the B4 frames at the frame's width (board renders and product
screenshots in the session scratchpad; not committed). Layout, classes, spacing and words match;
every remaining difference is fixture data (dates, counts, "1 student" vs "5"), DEV-21 (Phase-4B
actions and sidebar items not rendered), or a recorded choice (§7). Parity suite: the Faculty
shell on Help (`05-faculty-help-built-sidebar`, DEV-10, Help only) is now measured as
`-phase-4a` under DEV-21; its Phase-0 pin is kept as the record.

## 7 · Recorded choices and deviations (owner review)

- No student names or gendered pronouns where the read carries none (B4-05 f4, B4-06 f1/f2/f5
  name Rahul): neutral provisional words.
- Empty-state lines that advertise drafting / importing (B4-05 f1, B4-07 f7) shortened while
  FA-16 / FA-17 are not built.
- FA-01 shows the calm "Nothing needs you right now." when the only facts open Phase-4B screens.
- FA-14: no one-tab strip while Drafts is not rendered; the delete dialog opens on Cancel (board 10
  / VD-07); after adding, the bank shows "Saved to your question bank as Q-…".
- FA-10's error summary title "Check these settings" comes from the screen's copy (the catalogue
  has no FA-10 title).
- FA-04 at 375: labelled rows (`data-label`); hidden table captions added for screen readers.

## 8 · Independent review (one bounded pass) and fixes

No policy violation in the built behaviour; one latent HIGH and three MEDIUM defects, all fixed
with tests:

- **HIGH (latent)** — `previewAsStudent` returned the answer key of questions a co-teaching
  colleague wrote, which `getQuestion` answers policy-open (OD-B4-17, Q-10). Each pinned question
  is now read under its own rule: such a preview answers policy-open (ledger + port error added)
  and FA-11 shows a provisional "isn’t available to you yet" state. Unit-tested with Dr Anita Desai
  assigned the course (no sample co-teacher otherwise). Still recorded for the owner:
  `getAssessment` (WP-0.11) returns question bodies to a co-teacher; no screen shows a key from it.
- **MEDIUM** — FA-10 warned "This makes a new version" from submissions on any version; it now
  reads the current version's (PC-53), so a second change after versioning warns of nothing.
- **MEDIUM** — a release-only change is versioned by the domain but showed no f1 warning, and f2
  claimed the submitted Student's result moves to the new terms (the domain keeps their
  version's): f1 now shows for release changes too, and f2 / the saved message say what the build
  does (P4-06 stays the owner's).
- **MEDIUM** — FA-01 said "Nothing needs you" while a written answer waited: the row is now drawn
  as the fact (assessment, oldest submission) without "Mark now" until FA-18 exists.
- **LOW** — FA-05's "Formats used by your students" now reads the same Students as the counts;
  FA-10 re-sends a stored deadline unchanged when its typed words are unchanged (no rounding).

Integration fixes: a built-CSS Preflight finding (`border-t` → the arbitrary block-start border,
as IA-20), an arbitrary colour in the record header (→ `--xr-indigo-200`), duplicate query
dependencies, the release error placed before the cards as B4-04 f3 draws it, and the notices
slot of the rules form (screen-reader order).

## 9 · Verification and verdict

`pnpm verify`, 16 Oct 2026, run `2026-10-15T21-52-10-222Z-verify`: **VERIFY PASSED** in 1,669 s,
first run.

| Step       | Result                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| format     | prettier clean                                                                                                                                                           |
| repository | 32 checks · handoff 178/178 · audit evidence 36/36 · v46 copies 27/27 · scans clean                                                                                      |
| workspace  | build 12/12, typecheck/lint/test 40/40 · **6,716 unit tests** (Phase 3: 6,173): web 3,655, contracts 752, sample-platform 260, ui 832, domain 787                        |
| bundle     | 1,464 product files, 0 test-seam or harness sentinels; the test-hook build carries the bridge (6/6 markers)                                                              |
| browser    | **2,646 passed** (Phase 3: 2,442; web 1,507), 0 failed, 650 skipped (width-gated and the 36 deferred flow skeletons); Chromium only                                      |
| parity     | 95/95 tests · 764 comparisons: 623 within, 141 registered, **0 unregistered**, 0 masked; pins 167 → 168 (`05-faculty-help-built-sidebar-phase-4a`, DEV-21), none changed |

Phase-4A browser specs (`e2e/phase-4a/`, 8 files, 204 passes at 1440 / 1024 / 768 / 375): the
product-build demonstration (§3) and seven screen-group suites — every drawn state through
`checkState` (axe WCAG A/AA, one h1, visible focus, 24 × 24 targets, no sideways scroll), the
primary interactions by real clicks and typing (filters and search, the guided create flow with
its validation, Save as draft, settings save with both warnings, Remove / Add / Use updated
version / reordering, the bank panel, add / edit / delete questions with the DL-1 dialog by
keyboard, the preview toggle and its `?view=key` deep link), and each 375 / 768 layout drawn.
After verify only the deviation register's text was refreshed (`DEVIATIONS.md` regenerated from
that run: the Faculty sidebar comparison now `-phase-4a`, 863 px, DEV-21).

**Verdict: CONDITIONAL PASS** — all 13 Phase-4A ids built with verified primary interactions and
connected on the one world; a Faculty member assigned a course by the Institute Admin creates an
assessment, sets its rules, adds questions and previews it through normal product navigation (75
of 123 designed ids). Conditional on: the Phase-3 carry-forward limits (§5: TE-3 / T-12, P3-03);
P4-06 and the other open decisions of §10; the 192 provisional state-copy entries and PC-51 …
PC-53; DEV-21 (Phase-4B actions not rendered); Chromium-only and same-machine parity.

## 10 · Owner decisions outstanding

- **P4-06 (new, UNRESOLVED)** — B4-06 f2 warns that a submitted Student "sees their result on the
  new terms" after a release change, but the sample domain reads the release rule from the
  attempt's own version, so the change never reaches that Student. The drawn warning is shown; the
  domain should follow the owner's answer.
- OD-B4-01, OD-B4-10, OD-B4-17, T-18 (FA-13), T-19 … T-24, M22, DEV-21 for Phase 4A, the 188
  provisional state-copy entries, PC-51, PC-52, PC-53; and the carried TE-3 / T-12, P3-03, SACC-14,
  DEV-43, T-11, Chromium-only and same-machine parity.

## 11 · Remaining Phase-4B scope (needs separate authorisation)

FA-12 Submissions (and FA-22 CSV export), FA-16 Draft with assistance, FA-17 Import, FA-18 Marking
queue, FA-19 Mark a submission, FA-20 Students, FA-21 Student detail; the Student side ST-11
Assessments, ST-12 start, ST-13 attempt, ST-14 result; the hub's Assessment tab. Their services
already exist except `exportSubmissionsCsv`, `exportStudentsCsv`, the drafting and import methods.
