# Faculty V3 — what changed in the final complete-role design

Status: DESIGN COMPLETE · CONNECTED PREVIEW COMPLETE · ASSEMBLY PENDING XS · FINAL — APPROVED BY THE OWNER.

Per-screen detail (what changed on each ID and subview) is in `COVERAGE-REGISTER.md`. This page summarises across the role.

## Refinements, by pattern

- **P1** — Priority band sized to its items, with the people or records behind each count; ivory only for urgent work.
- **P2** — Plan-tint identity band for a record (course, experiment, assessment) with fact figures.
- **P3** — Course ledger: tinted group header, column-aligned rows, no nested cards.
- **P4** — Unit meter beside counts in words, one per format; never a percentage.
- **P5** — Reading sheet at reading width with an action panel; the final action last with its note.
- **P6** — Sectioned authoring with a guidance and facts side panel; one primary in the footer.
- **P7** — Refined table: count, filters and actions in one toolbar; compact sub-lines; phone rows without repeated labels.
- **P8** — Sparse states: get-ready steps and compact message cards sized to their content.
- **P9** — Deadlines with days left and the release rule.
- **P10** — Records are identified by their name, the student’s name, the question’s text or its position — never by an internal technical id.

Where they apply: P1 FA-01 and the FA-18 toolbar · P2 FA-03, FA-05 and the FA-08…FA-12 record band (person pages FA-19 and FA-21 keep the plain head) · P3 FA-02 · P4 FA-01, 03, 04, 05, 06, 08, 12, 20 · P5 FA-19, FA-11 and the FA-05 panel · P6 FA-07, 10, 15, 16, 17 · P7 FA-04, 06, 12, 14, 17, 18, 20 and the FA-22 band · P8 every no-course state · P9 FA-01, 05, 06 and the record band · P10 every owned screen.

## Internal technical IDs leave ordinary labels

Owner decision, 21 October 2026, extending owner decision 6 (Super Admin) to Faculty. Presentation only.

- **Out of every visible label, placeholder, dialog title, notice and accessible name:** `ASMT-`, `ATT-`, `Q-` and `D-` identifiers. Records are named instead — the assessment or experiment by its name, the submission as “Attempt 1 of 2”, a question by its text, its type or its position.
- **Kept:** academic course codes (ME ZG523) and institution-issued student IDs (GIT-2026-0418); a roll number is not an internal technical id, and the CSV keeps its “student ID” column.
- **Kept out of sight, not removed:** stable keys still drive routing, element ids, the preview’s record selector and the question search, so searching the bank by an id still works.
- **No business rule changed:** versions, attempts, one assessment per experiment, marking, release and import behave exactly as before. An imported batch still gets its ids; the finished notice no longer lists them.
- **Where it shows:** the assessment band and FA-06 rows drop the assessment id; FA-12 and FA-18 read “Attempt 1 of 2”; FA-19’s band and the confirm dialog name the student and the assessment; the bank’s quiet line reads “Version 2”; search is “Words in the question”; the delete dialog asks “Delete this question?”; FA-15 drops the “Question ID” fact; FA-16 shows “In your question bank”; FA-17 reports the count without the ids; an export is named after the assessment.
- **One identifier remains in the role, on a borrowed surface:** Help & support answers a sent report with “Your reference is SUP-0231”. XS-07 is owned by the shared XS contract, so it is flagged for its owner rather than changed here.

## What stays exactly as it was

- Functions, routes and screen IDs; every in-role link is a real anchor (no `#` placeholder).
- Permissions: co-teachers see the existing refusals and no answer key reaches a student view. Internal ids are hidden, never dropped — the same records, routes and keys sit behind the labels.
- Business rules and state transitions: three question types, CSV only, rules per assessment, versions on change after submissions, no re-marking, the release policy.
- The six sample worlds; nothing was added to fill a layout.
- The foundation: `core.css`, `rb.css`, `rb-kit.css` byte-identical to the pack; the shared XS surfaces untouched.

## Wording and layout changes a tester will notice

- FA-05 **Mark** opens the oldest waiting submission (FA-19), as FA-03 does; it used to open the marking queue (FA-18).
- FA-04 “Completed, by format” text lines became one unit meter per format with counts in words.
- FA-06 the deadline has its own Deadline column with days left (it was a “Due …” sub-line).
- FA-08 the submissions panel no longer repeats “2 of 5 students submitted”; it is a figure in the record band.
- FA-12 waiting rows show “— of 16” and “Marked automatically: 4 of 6”; release shows “Not yet” with “after the deadline, 14 Nov 2026, 23:59” beneath.
- FA-14 a question’s sub-line is a type tag, with “Version 2” when there is more than one version (was “Q-0102 · Single choice · version 2”); drafts are review cards.
- FA-17 the row check shows Rows, Ready, With errors and With warnings as figures (was “2 with errors” pills).
- FA-15 gains a side panel (this question’s facts and what students see).
- FA-21 the total reads “11 of 16 marks” with “Passed · pass mark 8”, as FA-19 does.
- Hints shortened: “A whole number from 0 to 100.”, “For example 14 Nov 2026, 23:59”.
- No-course states on FA-04, FA-06, FA-07 and FA-16 use the compact message card used elsewhere in the role.

Journey checks that read the old wording were re-pointed; each change is recorded with the reason in `checks/specs/journey-changes.json`:

- J2-bank-chain · “used question saves version 2” — FA-14 rows show the question type as a tag and the version as a quiet line; with internal IDs out of user-facing labels (owner decision, 21 Oct 2026) the bank id is no longer part of that line.
- J2-bank-chain · “own CSV row validation” — FA-17 check report shows Rows, Ready, With errors and With warnings as figures instead of pill counts.
- J2-bank-chain · “sample file: 2 errors block, 1 warning” — Same figures as above; the row messages and the blocking rule are unchanged.
- J2-bank-chain · “corrected file: 8 ready” — Same figures as above.
- J3-marking-chain · “Submissions reflect the confirmed mark” — FA-12 release column shows “Not yet” with the release rule underneath, instead of one long line.
- J3-marking-chain · “student detail reflects the outcome” — FA-21 assessment panel shows the total in the same form as the R1 marking total (FA-19).
- J1-create-chain · “created and ready” — FA-07's result card no longer prints the new assessment's internal id (owner decision, 21 Oct 2026); it is created and ready, which the card still says.
- J2-bank-chain · “bank panel lists imported questions” — The add-from-bank panel lists questions by their text rather than by their bank id.

## One role stylesheet

- All Faculty styling is in one additive file, `project/fa.css`, loaded after `core.css` → `rb.css` → `rb-kit.css`. Part 1 holds the published components still in use; part 2 the refined components. The R1 checkpoint’s separate `fa-r1.css` is gone.
- The checkpoint’s working prefix `fr-` became `fa-` (301 names, `rename-map.json`; container names `fr*` became `fa*`). 84 selectors that no screen uses any more were removed (`checks/results/consolidation-report.json`).
- Proof: all 219 board and responsive renders are pixel-identical before and after the consolidation, and no rule used by a rendered state was lost.
