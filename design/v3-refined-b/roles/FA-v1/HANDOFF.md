# Faculty — design handoff (V3 Refined B)

**Status:** DESIGN COMPLETE · CONNECTED PREVIEW COMPLETE · ASSEMBLY PENDING XS · FINAL — APPROVED BY THE OWNER

**Design:** the final complete-role design — one consistent Refined B layout language across all 21 owned IDs (see `COVERAGE-REGISTER.md` and `WHAT-CHANGED.md`). Everything below about states, actions, data and decisions is unchanged from the published build unless marked *final design*.

This is a presentation design for the existing Faculty functions. It adds no backend, changes no route, and its sample records stay illustrative. When implementing, keep the application's current services, routes, permissions and shared world. Reproduce the layouts and states with the app's own facts.

## 1. How the preview is built

`project/Main.dc.html` is the single role-preview root.
- A screen-ID router (`R.s` = `FA-01`…`FA-21`, `XS-03/06/07`, `NF`) selects one view inside the V3 shell: the 248 px navy rail, which becomes a drawer below 1024 px, the top bar with the date and the account menu, and the page.
- All in-role links are real anchors (`href="#FA-14"` and so on) handled in place. The address does not change.
- Records live in one per-board world. Navigating keeps every change: new questions, versions, confirmed marks and exports.
- The `scenario`, `start`, `rec` and `preset` props choose a documented starting state (`SCENARIOS.json`).
- Six live starting points and the inspection boards import Main with those props. The boards don't share state with one another. This is a property of the design host, so connected journeys run inside one live board.

The current screen is exposed as `#fa-root[data-screen]` for testing.

## 2. Screens, states and allowed actions

### Teaching (FA-01…FA-05)

**FA-01 Overview** shows only genuine work. *Final design (R1):* a priority band sized to its items (one, two or three), with the people or records behind each count:
- written answers to mark, with **Mark now** opening the oldest;
- drafts needing review, with **Review drafts** opening the Drafts tab;
- students inactive for 14 days or more, with **View students** opening the filter.

It also shows **Coming up** (deadlines in the next 30 days, 3 at most, as date tiles with days left and the release rule) and **Your teaching** (courses and experiments with one unit meter per format).
- A new teacher with a course but no students gets **Get your course ready** with three real entry actions: Add a question, Create assessment, Open experiment.
- No courses → a calm explanation that the Institute Admin assigns courses.
- There are no KPI tiles and no percentages.

**FA-02 My courses** has the tabs Courses (*final design:* a course ledger with figures and aligned experiment rows) and **FA-04 Experiments** (*final design:* a refined table with one unit meter per format and the assessment state, name and deadline).
- FA-04 has search, a format filter (only formats the institution holds) and an activity filter, with chips.
- States: no match, loading (skeleton), could not load (try again) and empty.

**FA-03 Course** — *final design (R1):* an identity band with figures, then one panel per experiment with Student activity (meters and words) and Assessment side by side and one Mark action. A course not assigned to you → scoped refusal.

**FA-05 Experiment** — *final design:* an identity band with figures (formats held, formats used, students with access), Student activity, About, and a navy Assessment panel whose **Mark** opens the oldest waiting submission (FA-19). It shows:
- formats held versus formats your students used, as two separate facts;
- reach (students with access, from Student access) and the assessment block (Create assessment, Continue setting up, Open assessment, or Mark N written answers);
- per-format activity counts, about, outcomes and resources.

### Assessments (FA-06…FA-12, FA-22)

**FA-06** list with search, course and state filters (Draft — not ready / Ready / Waiting for marking). Every row links to its record. *Final design:* Deadline (with days left) and Submissions (meter, submitted, waiting) are columns of their own.

**FA-07 Create (guided):**
1. Experiment. A second assessment for one experiment is refused, with a link to the existing one (OD-B4-01).
2. Rules. Every value starts empty (no defaults). The release option has no pre-selection. Validation uses an error summary with links.
3. Questions from the bank. **New question**, **Draft with assistance** and **Import** go out and come back with the step state kept; a question written here comes back ticked.
4. Preview of what students see before they start. No attempt is created.

Then **Create assessment** (Ready) or **Save as draft**. A draft needs only a name (OD-B4-03).

The record has five tabs under one tinted record band (*final design:* course and experiment, the name, state · ID · version · waiting, and figures for the deadline, students submitted and questions). On phones the tabs scroll and the current tab stays in view.

- **FA-08 Summary:** the ready checklist, the versions note ("Version 2 since …"), who it reaches, the rules as set and the submissions panel (Mark next).
- **FA-09 Questions:**
  - move up and down, remove (the question stays in the bank), add from the bank panel, and **Use updated version** when the bank has a newer version;
  - a question deleted from the bank stays in the assessment as its copy;
  - a change made while attempts are pinned to the current version makes a new version, and pinned submissions keep theirs;
  - a question written from this tab is *offered* back ("Add Q-xxxx to this assessment"), never attached silently.
- **FA-10 Settings:** the same rules, with an error summary.
  - A rule change after submissions warns "This makes a new version".
  - A release-option change after submissions warns that **submitted attempts keep the result terms of the version they answered** (the domain behaviour; P4-06 stays open).
  - Also: Cancel changes, nothing to save, and saved / saved as version N.
- **FA-11 Preview:** Student view and Answer key (key, explanations and marking guidance, Faculty only). Also: nothing to preview, the failed state (Try again) and the co-teacher refusal.
- **FA-12 Submissions:** Waiting / Marked / All, Mark next, the score (*final design:* “— of 16” with “Marked automatically: 4 of 6” while waiting), pass outcome, "Result released to student" per row (*final design:* “Not yet” or “Released” with the rule beneath), and a version column when attempts span versions.
  - **FA-22 Export CSV** confirms the export above the list and shows the exported rows. The columns are student, student ID, submitted, status, score and result released to student.

### Question bank (FA-14…FA-17)

**FA-14** has two tabs.
- **Questions:** search, type filter, chips; the columns Question (ID, type, version, "From a draft you reviewed"), Marks, Used in (assessments, or "earlier versions keep it"), Added; and the actions Edit and Delete.
  - **Delete** opens DL-1: the question leaves the bank, its history is kept, and assessments that use it keep their copy. Deleted questions are listed as "deleted … · history kept".
- **Drafts to review:** each draft is a review card tagged "Draft — needs your review" and "Drafted with assistance", showing its options with the key (or the answer, or the marking guidance), with Review and edit, Add to bank and Discard, beside “How review works”.
- States: empty, no match, no courses, and co-teacher (colleague questions are not shown).

**FA-15 Add / edit question:**
- three types only: single choice (up to 4 options, one Correct), true or false, and written answer with free-text marking guidance;
- marks are a whole number of 1 or more, and the explanation is optional;
- an error summary links to each field;
- editing a *used* question saves a **new version**; the assessment switches only through Use updated version;
- **Review a draft** saves with **Add to bank**;
- cancel or save returns to where the editor was opened.

**FA-16 Draft with assistance:**
- form: lab brief or pasted text, the types, and 3 or 5 drafts;
- states: validation, Drafting… (busy), the drafts list (add, discard, review and edit) and Drafting didn't work (choices kept, try again);
- the stand-in is labelled in the UI: "Drafts here come from a fixed set of sample questions… No drafting service is connected or named";
- nothing enters the bank on its own.

**FA-17 Import (CSV only):**
1. Choose a file: the template columns, a template download, **Choose a CSV file** (real file input) or **Use the sample file**. XLSX and other non-CSV files are refused with a plain instruction to save as CSV.
2. Check rows: rows with errors block the whole file (all or nothing, labelled interim); warnings (a missing explanation) do not. File-level problems (missing columns, empty file) are reported. *Final design:* Rows, Ready, With errors and With warnings are shown as figures above the row table.
3. Confirm, then **Import N questions**. The questions get sequential IDs and are not added to any assessment.

### Marking (FA-18, FA-19)

**FA-18 Marking queue:** oldest first, an assessment filter and Waiting / Marked / All, with "Mark saved — not confirmed yet" on saved rows. *Final design:* the toolbar shows the waiting count, the oldest wait and one gold Mark next; rows show how long ago each answer was submitted. Empty: "Nothing is waiting for you". The co-teacher sees a note instead of colleagues' answers.

**FA-19 Mark a submission:**
- The student's **answer is primary**. Marking guidance is marked "only you see this".
- The Marks panel lists the automatic marks per choice question (a local stand-in from the pinned key), then **Mark for question N** "out of N" and optional feedback.
- **Save mark** keeps it editable. **Confirm marks** opens a dialog with:
  - the mark;
  - the total and pass outcome against the assessment's own pass mark;
  - "read-only after you confirm";
  - when the student sees the result, according to the *pinned* version's release terms.
- Afterwards the page is read-only: confirmed by and when, the marks, the feedback, the total, a result-release line, **Next submission** and See submissions.
- Errors: "Enter a mark for question 4" and "Enter a whole number from 0 to 10".
- There is no re-marking control (T-20). Below 860 px a **Go to the marks** link jumps to the panel.

### Students (FA-20, FA-21, FA-22)

**FA-20:**
- progress by format in words, with completion dates (no percentage and no verdict);
- the assessment state per student; last activity with an "Inactive N days" tag at 14 days or more;
- filters: experiment (when there is more than one), progress, and inactive for 7 / 14 / 30 days or more;
- **FA-22 Export CSV** of the filtered list. The columns are student, student ID, experiment, one per format, assessment, result released to student, and last activity;
- states: no students yet, no match, no courses, and co-teacher (assessment details not shown).

**FA-21 Student detail (per experiment):**
- progress by format, resources opened, and the "feedback isn't shown to Faculty" note;
- an assessment panel: waiting → Mark their answers; marked → the total (*final design:* “11 of 16 marks” with “Passed · pass mark 8”) and "Result not released to Rahul yet — after the deadline …";
- the inactive variant (Karthik) and the co-teacher lock.

### Shared and refusals (borrowed XS contract)

These follow v46 shared behaviour, rebuilt with V3 tokens:
- the account menu (Escape closes; tabbing out closes) and the drawer (focus trapped; Escape returns focus);
- Help & support: My reports and Report a problem (validation; a sent report gets a preview reference, SUP-0231);
- Signed out (Sign in returns to Overview);
- Not your workspace;
- scoped refusals for a course, assessment, student, submission or question that isn't yours.

## 3. Data and commands

Names below come from the supplied Phase-4A/4B reports. Bind the existing contract; do not add methods for the design.

| Screen | Existing reads and commands (named in the reports) | Facts the design needs |
| --- | --- | --- |
| FA-01 | `getFacultyOverview` | Written answers waiting (count, oldest), drafts waiting for review (Phase 4B noted the overview had no drafts field yet: a provisional read addition), students inactive 14+ days (OD-B4-10), deadlines in the next 30 days. |
| FA-02…05 | `listMyCourses`, `getTeachingExperiment` | Formats held vs used, per-format counts, reach, assessment line. |
| FA-06…12 | `listAssessments`, `getCreateOptions`, `getAssessment`, `previewAsStudent`; create, save, update and version commands are in the 183-method contract | Version pinning, current-version submission count (PC-53), release terms per version, co-teacher refusal flags. |
| FA-12 / FA-22 | `exportSubmissionsCsv` | Rows as on screen, including "result released to student". |
| FA-14 / FA-15 | Bank list, add, edit (versioned) and delete (history kept), in the contract | Used-in assessments, version number, from-draft flag. |
| FA-16 | `requestDrafts`, `listDrafts`, `addDraftToBank`, `discardDraft` | Draft source label, status. |
| FA-17 | `previewQuestionImport`, `commitQuestionImport` | Row problems (row, question, message, error/warning), counts, new IDs. |
| FA-18 / FA-19 | Queue, save mark and confirm marks, in the contract | Pinned version, automatic marks (P4-01 local interim), release terms of the pinned version. |
| FA-20 / FA-21 / FA-22 | `exportStudentsCsv` plus the students read | Per-format state and date, last activity, inactivity, assessment state per student. |

## 4. Decisions applied and still open

| Item | How the design handles it | Open? |
| --- | --- | --- |
| OD-B4-01 one assessment per experiment | Refused at step 1 with a link to the existing one. | Open (owner) |
| OD-B4-02 / T-18 lifecycle | Ready means visible to students who have the experiment. No Make available, open, close or "closed" state (FA-13 excluded). The deadline is shown as a date only. | Open |
| OD-B4-03 rules required for Ready | Name, pass mark, attempts, deadline and release option, plus at least one question. A draft needs only a name. | Open |
| OD-B4-04 / T-19 release | Immediately after marking, after the deadline, or on a date. No pre-selection. Before release, no figure is shown to the student (other role). | Open |
| P4-06 release terms after a change | Submitted attempts keep their pinned version's terms (domain behaviour), and the wording says exactly that. | **Owner decision pending** |
| OD-B4-06 feedback | Optional; the mark is required (0 to max). | Open |
| OD-B4-07 marks on question | Marks belong to the bank question, shown everywhere. | Open |
| OD-B4-08 guidance | Faculty only, labelled "only you see this". | Open |
| OD-B4-09 explanation | Optional; a warning on import. | Open |
| OD-B4-10 inactivity | 7 / 14 / 30 days; activity = opening a format or the assessment (sample). | Open |
| OD-B4-11 / T-24 import | CSV with the ten-column template; all or nothing while any row has an error (labelled interim). XLSX refused. | Open |
| OD-B4-12 / T-23 assistance | Lab brief or pasted text, 3 or 5 drafts, no provider, no suggested marks. Labelled stand-in. | Open |
| OD-B4-13 versions | "This made version N"; "Version N since …"; versions shown on attempts when they differ. | Open |
| OD-B4-14 / ND-15 delete | Label "Delete"; history kept; assessments keep their copy. | Open |
| OD-B4-17 co-teaching | A colleague's assessment rules are readable. Answer key, guidance, submissions, marks, results and colleague bank questions are refused with the existing wording. | Open |
| P4-01 objective marks | Local stand-in from the pinned key; Faculty marks written answers and confirms. | Interim (kept) |
| T-20 re-marking | Confirmed marks are read-only; no re-mark control. | Kept |
| T-22 types, no timer | Three types; no timer or countdown anywhere. | Kept |
| T-25 format feedback | Not shown to Faculty (stated on FA-20 and FA-21). | Kept |
| T-33 / T-34 | Export only; no Reports page; no messages or reminders. "Contacting a student happens outside the platform." | Kept |

## 5. Changes from the v46 visual treatment

- The shell and components are V3 Refined B throughout: navy rail with gold current marker, Public Sans scale, kit buttons, notices, tables and the dialog. No v46 `xa-` styles are used.
- Assessment record pages use record tabs with counts on Questions and Submissions (in the final design they scroll on phones with the current tab in view).
- Marking groups all scoring in one Marks panel beside the answer (v46 kept "Marked automatically" in the main column). Confirmation states the total, the pass outcome and the release timing.
- Students show progress by format as chips plus words in one column (v46 had WEB and VR columns), so any number of held formats fits and phones stay readable. The CSV still has one column per format.
- The question type label is **"Single choice"** (your brief). v46 said "Multiple choice (one correct)". The CSV import accepts both spellings.
- The Bank "Used" column is headed "Used in" ("1 assessment", "Not yet", "None now · earlier versions keep it").
- Overview attention is limited to three rows plus Coming up and Your teaching, as in v46 B4-01, in V3 components.

## 5b. The final complete-role design

- One layout language across the role, from the R1 patterns (P1–P9): priority bands, identity bands with figures for records, a course ledger, unit meters with counts in words, reading sheets with action panels, sectioned authoring with side panels, refined tables with compact phone rows, compact message cards for sparse states, and deadlines with days left. Where each applies, and every subview’s status, is in `COVERAGE-REGISTER.md`.
- Object records (course, experiment, assessment) get the tinted identity band with figures; person pages (FA-19, FA-21) keep the plain head with no aggregate figures — per format only, no overall verdict.
- The wording changes a tester will notice are listed in `WHAT-CHANGED.md`; the journeys were re-pointed accordingly.

## 5c. Integration notes (for the V3 frontend)

- Replace the published `fa.css` with this `project/fa.css` — the only Faculty stylesheet. Do not load the R1 checkpoint’s `fa-r1.css`; it no longer exists. `core.css`, `rb.css` and `rb-kit.css` stay as they are.
- Take the markup of each view from `Main.dc.html` (one `<!-- ═══ FA-xx … ═══ -->` section per screen) and keep the class names as they are: every `fa-` class used there has a rule in `fa.css`, and no screen depends on a class from the old build.
- Container queries name their containers (`faprog`, `facid`, `faxp`, `faauthor`, `faform`, plus the kit’s `rb`, `rkd`, `fatable` …); keep the `container` declarations with the elements that carry them.
- Values the view model computes for presentation (days left, unit meters, “— of 16”, “Marked automatically: 4 of 6”, “Oldest waiting N days”) come from facts the existing reads already return (see section 3); no new command or read is needed.
- **Internal technical IDs:** keep sending them. The design hides them in labels only — `ASMT-`, `ATT-`, `Q-` and `D-` values are still the keys the views route and act on, and `Main.dc.html` keeps them on elements (`id="fa-mk-Q-0106"`), in the record selector and in the bank's search index. When binding, do not strip them from the API, and do not print them into a label, a placeholder, a dialog title, a notice or an `aria-label`. The guard that proves this is `checks/scripts/idscan.mjs` plus the J10 journey set; run both after any label change.

## 6. Known limitations (honest)

- **Exports:** the preview shows the confirmation and the exported rows; it does not write a file. The import template is a real `data:` CSV link.
- **Drafting:** the stand-in returns fixed sample drafts whatever the material, and says so on screen.
- **CSV:** the preview parser applies the rules above. A 1 MB limit is a preview guard only. Production uses `previewQuestionImport` / `commitQuestionImport`.
- **Cross-role effects:** the student's result page and the Institute Admin's access grants are other roles' screens. They are described here and in `SCENARIOS.json`, not linked.
- **Course access ended:** a later sample would need invented 2027 facts, so it was not built.
- **Format chips:** the only text under 13 px is the kit's `xr-fmt` chips (12–12.5 px bold capitals), a foundation component left unchanged.
- **Logo:** the reserved logo slot is kept until the official WILP image arrives.

## 7. Sources

- Pack:
  - `common/01…05`;
  - `ROLE-SCOPE.*` and `SCREEN-OWNERSHIP.json`;
  - v46 boards B4-01…B4-10 and B4-16, plus shared 05, 07 and 08;
  - V3 `references/v3/project` (SA02 dialog, IA02 tabs, shell);
  - the Phase-4A, 4B, 6 and 7 reports.
- The current repository was not available to this design task. Claude Code must inspect it before binding.
