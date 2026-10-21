# Faculty V3 — complete coverage register

**Foundation:** XR-V3-RB-1.0 · **Status:** DESIGN COMPLETE · FINAL — APPROVED BY THE OWNER

**Totals:** 21 owned IDs, all redesigned (5 in the R1 checkpoint, 16 in the final pass) · 111 important subviews: 102 redesigned, 9 reviewed and unchanged · 8 shared XS surfaces reviewed and unchanged.

**Owner decision applied in this pass.** Owner decision, 21 Oct 2026 — internal technical IDs (ASMT-, ATT-, Q-, D-) are out of every ordinary user-facing label, placeholder, dialog title, notice and accessible name. Academic course codes and institution-issued student IDs stay. Stable keys stay in routing, element ids and the question search, so no business rule changed.

**Legend.** REDESIGNED — changed in this redesign. REVIEWED AND UNCHANGED — reviewed at 1440 and 375 and kept; its board is pixel-identical to the published V3 Faculty build, or the scope note says which surrounding part changed.

Every owned ID was also rendered at 1440, 1024, 768 and 375 (screenshots in `responsive/`). Boards named below are in the canvas and in the screenshot ZIP.

## FA-01 Overview — REDESIGNED

*page · R1 checkpoint, carried into the final design · patterns P1, P4, P8, P9*

Priority band sized to its items with one gold Mark now and the names and dates behind each count; Coming up with date tiles, days left and the release rule; Your teaching with one unit meter per format; composed new-teacher and no-course states.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| Populated · needs attention, coming up, your teaching | REDESIGNED | `FA01-Overview` | — |
| One item needs attention · 26 Oct | REDESIGNED | `FA01-One-item` | — |
| New teacher, no students yet | REDESIGNED | `FA01-New-teacher`, `FA01-New-phone` | — |
| No courses assigned | REDESIGNED | `FA01-No-courses` | — |
| Co-teacher | REDESIGNED | `FA01-Coteach` | — |
| Phone 375 | REDESIGNED | `FA01-Phone` | — |

## FA-02 My courses (Courses tab) — REDESIGNED

*page · R1 checkpoint, carried into the final design · patterns P3, P8*

Course ledger: tinted course header with code, title, assignment source and three figures; one aligned row per experiment with formats, students, assessment, deadline and marking waiting; no nested cards.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| Populated | REDESIGNED | `FA02-My-courses` | — |
| New teacher, no students yet | REDESIGNED | `FA02-New` | — |
| No courses assigned | REDESIGNED | `FA02-None` | — |
| Phone 375 | REDESIGNED | `FA02-Phone` | — |

## FA-03 Course (teaching view) — REDESIGNED

*page · R1 checkpoint, carried into the final design · patterns P2, P4*

Plan-tint identity band with figures; one panel per experiment with its description and held formats in the header, then Student activity (meters and words) and Assessment side by side, with one Mark action.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| Populated | REDESIGNED | `FA03-Course` | — |
| No assessment yet · 26 Oct | REDESIGNED | `FA03-No-assessment` | — |
| New teacher, no students yet | REDESIGNED | `FA03-New` | — |
| Co-teacher | REDESIGNED | `FA03-Coteach` | — |
| Phone 375 | REDESIGNED | `FA03-Phone` | — |

## FA-04 Experiments (tab of My courses) — REDESIGNED

*tab · Final pass · patterns P7, P4, P8*

Refined table: experiment with its course and the formats your institution holds; student activity as one unit meter per format with counts in words (was plain “WEB: 2 of 5 completed” lines); assessment cell with state, name and deadline. Without an experiment: the compact message card used across the role, without filters.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| Populated | REDESIGNED | `FA04-Experiments` | — |
| No experiment matches the filters | REVIEWED AND UNCHANGED | `FA04-No-match` | pixel-identical to the published build |
| Loading | REVIEWED AND UNCHANGED | `FA04-Loading` | pixel-identical to the published build |
| Couldn’t load | REVIEWED AND UNCHANGED | `FA04-Failed` | pixel-identical to the published build |
| No student activity yet (new teacher) | REDESIGNED | `FA04-New` | — |
| No courses assigned | REDESIGNED | `FA04-No-courses` | compact message card (P8) replaces the filters and an empty table |
| Phone 375 | REDESIGNED | `FA04-Phone` | — |

## FA-05 Experiment (teaching view) — REDESIGNED

*page · Final pass · patterns P2, P4, P5*

Plan-tint identity band: course code, “Experiment you teach · course”, the name and three figures (formats held, formats your students have used, students with access). Student activity as meters with a link to the students; About with learning outcomes and resources; navy Assessment panel with deadline and days left, submissions meter, marking waiting, a gold Mark that opens the oldest waiting submission, and Open assessment — or Create assessment. The assessment panel names the attempt (“Attempt 1 of 2 · submitted …”) instead of its internal id.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| Populated | REDESIGNED | `FA05-Experiment` | — |
| No assessment yet · 26 Oct | REDESIGNED | `FA05-No-assessment` | — |
| No students with access yet | REDESIGNED | `FA05-New` | — |
| Co-teacher | REDESIGNED | `FA05-Coteach` | — |
| Phone 375 | REDESIGNED | `FA05-Phone` | — |

## FA-06 Assessments — REDESIGNED

*page · Final pass · patterns P7, P9, P8*

Refined table with Deadline (date and days left) and Submissions (unit meter, students submitted, marking waiting) in their own columns, and the state on the right. Without a course: the compact message card. Rows carry the assessment’s name, with “Created by …” only for a colleague’s assessment; the internal id has gone.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| Populated | REDESIGNED | `FA06-Assessments` | — |
| No assessment yet, with Create · 26 Oct | REVIEWED AND UNCHANGED | `FA06-None-yet` | pixel-identical to the published build |
| No courses assigned | REDESIGNED | `FA06-No-courses` | compact message card (P8) |
| Phone 375 | REDESIGNED | `FA06-Phone` | — |

## FA-07 Create assessment (4 steps) — REDESIGNED

*step · Final pass · patterns P6*

A stepper that fits a phone (only the current step is labelled there); every step a sectioned form: experiment cards with formats and reach; name and introduction, then the three rules aligned in one row and the release options side by side; questions as checkbox cards with other ways to add below; preview as a rules list and numbered questions with type tags. The side summary ticks what is done and, at step 4, lists what happens when you create it. Questions are chosen and previewed by their text, type and marks, and the result card says the assessment is created and ready without printing its id.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| Step 1 · experiment | REDESIGNED | `FA07-Step1` | — |
| Step 2 · rules with errors | REDESIGNED | `FA07-Step2-errors`, `FA07-Phone` | — |
| Step 3 · questions | REDESIGNED | `FA07-Step3` | — |
| Step 4 · preview and create | REDESIGNED | `FA07-Step4`, `FA07-Step4-phone` | — |
| Created and ready | REDESIGNED | `FA07-Created` | — |
| Saved as a draft | REDESIGNED | `FA07-Saved-draft` | — |
| Experiment already has an assessment | REDESIGNED | `FA07-One-per-experiment` | — |
| No courses assigned | REDESIGNED | `FA07-No-courses` | compact message card (P8) instead of an empty step 1 |

## FA-08 Assessment · Summary — REDESIGNED

*tab · Final pass · patterns P2, P4*

Tinted record band shared by FA-08 to FA-12: course and experiment, the name (balanced wrap), state · ID · version · marking waiting, and figures for the deadline (days left), students submitted (meter) and questions. Summary: readiness, rules as set, who it reaches; navy Submissions panel with the waiting names oldest first and one gold Mark next. Tabs scroll on a phone with the current tab kept in view. The band shows the state, version, who created it and what is waiting — not the assessment id.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| Ready, 2 waiting | REDESIGNED | `FA08-Summary` | — |
| Draft, no questions yet | REDESIGNED | `FA08-Draft` | — |
| Version 2 after submissions | REDESIGNED | `FA08-Version2` | — |
| Co-teacher | REDESIGNED | `FA08-Coteach` | — |
| Phone 375 | REDESIGNED | `FA08-Phone` | — |

## FA-09 Assessment · Questions — REDESIGNED

*tab · Final pass · patterns P7, P2*

Head with total marks and the split between automatic and written marks; actions in order of use (Add from question bank, New question, then Draft with assistance · Import); numbered rows with type tag, marks and ID; larger move controls; navy bank panel whose close button returns focus. Rows, the add-from-bank panel and every message name questions by their position or text; move, remove and “use updated version” read “question 2” rather than a bank id.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| 4 questions | REDESIGNED | `FA09-Questions` | — |
| Add from question bank panel | REDESIGNED | `FA09-Add-from-bank` | — |
| Added after submissions · version 2 | REDESIGNED | `FA09-New-version` | — |
| Co-teacher, read only | REDESIGNED | `FA09-Coteach` | — |
| Phone 375 | REDESIGNED | `FA09-Phone` | — |

## FA-10 Assessment · Settings — REDESIGNED

*tab · Final pass · patterns P6*

Sectioned form (Name and introduction · Rules · When students see results) with the three rules aligned in one row; a How changes apply panel: the current version, who submitted it and which changes make a new version.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| Settings | REDESIGNED | `FA10-Settings` | — |
| Errors | REDESIGNED | `FA10-Errors` | — |
| Rule change after submissions | REDESIGNED | `FA10-Rule-change` | — |
| Release change warning | REDESIGNED | `FA10-Release-change` | — |
| Co-teacher, read only | REDESIGNED | `FA10-Coteach` | — |
| Phone 375 | REDESIGNED | `FA10-Phone` | — |

## FA-11 Assessment · Preview — REDESIGNED

*tab · Final pass · patterns P5*

A reading sheet at reading width with a Student view / Answer key switch and the no-attempt note; an “As students see it” head with facts and the introduction; numbered question cards. Answer key mode: one band saying only you see the key and the guidance; explanations and guidance as ruled notes.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| As students see it | REDESIGNED | `FA11-Student-view` | — |
| With the answer key | REDESIGNED | `FA11-Answer-key`, `FA11-Phone` | — |
| Preview couldn’t load | REVIEWED AND UNCHANGED | `FA11-Failed` | the state itself; it sits under the redesigned record band |
| Co-teacher refusal | REVIEWED AND UNCHANGED | `FA11-Coteach` | the existing refusal; it sits under the redesigned record band |

## FA-12 Assessment · Submissions — REDESIGNED

*tab · Final pass · patterns P7, P4*

Toolbar with the count, a gold Mark next and Export CSV; the filter as one segmented control; while waiting the score shows “— of 16” with the automatic part; the release column says Not yet or Released with the rule beneath. The student column reads “Attempt 1 of 2”, and an export is named after the assessment (submissions-heat-exchanger-post-lab.csv).

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| 2 waiting | REDESIGNED | `FA12-Submissions` | — |
| One marked, result not released | REDESIGNED | `FA12-Marked` | — |
| Co-teacher refusal | REVIEWED AND UNCHANGED | `FA12-Coteach` | the existing refusal; it sits under the redesigned record band |
| Phone 375 | REDESIGNED | `FA12-Phone` | — |

## FA-14 Question bank (Questions · Drafts to review) — REDESIGNED

*page · Final pass · patterns P7, P6*

Head actions in order of use (Add a question, Draft with assistance, Import); the questions table shows a type tag and the ID with its version, and a compact Used in; drafts become review cards with options, key and guidance beside How review works. The quiet line under a question carries its version (and the experiment, when there is more than one) instead of its bank id; search is by words in the question; the delete dialog and its confirmation name the question.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| Questions | REDESIGNED | `FA14-Question-bank` | — |
| Drafts to review | REDESIGNED | `FA14-Drafts`, `FA14-Drafts-phone` | — |
| Delete a used question · dialog | REDESIGNED | `FA14-Delete` | the kit dialog and its focus handling are unchanged; its title and confirmation name the question instead of its id |
| Question deleted, history kept | REDESIGNED | `FA14-Deleted` | — |
| No question matches | REDESIGNED | `FA14-No-match` | — |
| Empty bank (new teacher) | REVIEWED AND UNCHANGED | `FA14-Empty` | the empty state itself; the head actions above follow the new order |
| Phone 375 | REDESIGNED | `FA14-Phone` | — |

## FA-15 Add / edit question — REDESIGNED

*page · Final pass · patterns P6*

Sectioned form (type cards in one row; question and answer; marks and explanation) with a side panel: this question’s facts (version, where it is used, when added — or when its ID is given) and what students see, when. The meta line and the side facts show the version; the id and the “Question ID · given when you save” fact have gone, and saving reports “Saved as version 2.”

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| Add a question | REDESIGNED | `FA15-New` | — |
| Errors | REDESIGNED | `FA15-Errors`, `FA15-Phone` | — |
| Edit a used question | REDESIGNED | `FA15-Used` | — |
| Review a draft | REDESIGNED | `FA15-Draft-review` | — |

## FA-16 Draft questions with assistance — REDESIGNED

*step · R1 checkpoint, carried into the final design · patterns P6*

Numbered steps (material · types · count) with type cards and a 3/5 choice; How drafting works at the side; drafts show options and the key for review and collapse into a bank line once added. Final pass: the no-course state uses the role’s compact message card. An added draft collapses to “In your question bank · …” instead of showing the id it was given.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| Choices | REDESIGNED | `FA16-Draft` | — |
| Nothing chosen | REDESIGNED | `FA16-Errors` | — |
| Drafting | REDESIGNED | `FA16-Busy` | — |
| Drafts to review | REDESIGNED | `FA16-Drafts-list`, `FA16-List-phone` | — |
| Drafting failed | REDESIGNED | `FA16-Failed` | — |
| No courses assigned | REDESIGNED | `FA16-No-courses` | final pass: compact message card (P8) |
| Phone 375 | REDESIGNED | `FA16-Phone` | — |

## FA-17 Import questions (CSV) — REDESIGNED

*step · Final pass · patterns P6, P7*

Stepper; the file picker with the template’s columns as a side reference; the check as four figures (rows, ready, with errors, with warnings) above the row table; confirm with counts by type; a done card. The finished notice says how many questions were added, without listing the ids assigned.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| Choose a file | REDESIGNED | `FA17-Choose` | — |
| Not a CSV file | REDESIGNED | `FA17-Not-CSV` | — |
| Row errors block the import | REDESIGNED | `FA17-Row-errors`, `FA17-Phone` | — |
| Confirm | REDESIGNED | `FA17-Confirm` | — |
| Imported | REDESIGNED | `FA17-Done` | — |

## FA-18 Marking queue — REDESIGNED

*page · Final pass · patterns P7, P1, P8*

Toolbar with the waiting count, the oldest wait and one gold Mark next; assessment filter and a segmented Waiting / Marked / All; rows show when each answer was submitted and how long ago. Rows read “Attempt 1 of 2”, and the row action is announced as “Mark Rahul Verma”.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| 2 waiting | REDESIGNED | `FA18-Marking` | — |
| All, one marked | REDESIGNED | `FA18-All` | — |
| Nothing waiting · 26 Oct | REDESIGNED | `FA18-Nothing-waiting` | — |
| No courses assigned | REDESIGNED | `FA18-No-courses` | compact message card (P8) |
| Phone 375 | REDESIGNED | `FA18-Phone` | — |

## FA-19 Mark a submission — REDESIGNED

*page · R1 checkpoint, carried into the final design · patterns P5*

Automatic marks as a strip; the answer at reading width; guidance as a quiet ruled note; a panel with a large score field, feedback, the live total and Save mark, then Confirm marks last with its lock note. Same calculation and dialog. The band reads “Waiting for marking · Submitted … · attempt 1 of 2”, and the confirm dialog names the assessment — neither shows the attempt id.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| Waiting for marking | REDESIGNED | `FA19-Mark` | — |
| Mark out of range | REDESIGNED | `FA19-Invalid-mark` | — |
| Mark saved, not confirmed | REDESIGNED | `FA19-Saved`, `FA19-Phone` | — |
| Confirm marks · dialog | REDESIGNED | `FA19-Confirm` | the kit dialog, its wording and its focus handling are unchanged apart from the sub-line, which names the assessment instead of the attempt id |
| Confirmed, read only | REDESIGNED | `FA19-Confirmed` | — |
| Result released · 15 Nov | REDESIGNED | `FA19-Released` | — |

## FA-20 Students (progress and follow-up) — REDESIGNED

*page · Final pass · patterns P7, P4, P8*

Per-format summary meters for all students with access above the roster; the roster shows per-format status, assessment status and last activity with the inactivity tag; Export CSV in the toolbar.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| All students | REDESIGNED | `FA20-Students` | — |
| Inactive 14 days or more | REDESIGNED | `FA20-Inactive` | — |
| No student matches | REDESIGNED | `FA20-No-match` | — |
| No students yet | REVIEWED AND UNCHANGED | `FA20-No-students` | the empty state itself; only the as-of line above it was reworded |
| No courses assigned | REDESIGNED | `FA20-No-courses` | compact message card (P8) |
| Phone 375 | REDESIGNED | `FA20-Phone` | — |

## FA-21 Student detail (per experiment) — REDESIGNED

*page · Final pass · patterns P4*

A person page keeps the plain head (name, ID, last activity, inactivity tag) with no aggregate figures. Progress by format as compact rows — per format only, no overall verdict; resources with opened status; navy Assessment panel with the attempt, the total “11 of 16 marks · Passed · pass mark 8”, the release note, and Mark their answers or View marks. The assessment panel names the attempt; the student’s own institution id (GIT-2026-0418) stays, because it is not an internal technical id.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| Waiting for marking | REDESIGNED | `FA21-Student` | — |
| Marked, result not released | REDESIGNED | `FA21-Marked` | — |
| Result released · 15 Nov | REDESIGNED | `FA21-Released` | — |
| Inactive student | REDESIGNED | `FA21-Inactive` | — |
| Co-teacher | REDESIGNED | `FA21-Coteach` | — |
| Phone 375 | REDESIGNED | `FA21-Phone` | — |

## FA-22 Export CSV (action on FA-12 and FA-20) — REDESIGNED

*action · Final pass · patterns P7*

The export confirmation band lines up with the refined toolbars, and the preview of exported rows scrolls sideways without wrapping cells. Same columns and rows; CSV only.

| Subview | Status | Boards | Note |
| --- | --- | --- | --- |
| On Submissions (FA-12) | REDESIGNED | `FA12-Export` | — |
| On Students (FA-20) | REDESIGNED | `FA20-Export`, `FA20-Export-phone` | — |

## Shared surfaces (borrowed XS contract) — REVIEWED AND UNCHANGED

| ID | Subview | Boards | Note |
| --- | --- | --- | --- |
| XS-05 Account menu and menu drawer | Account menu | `XS-Account-menu` | the menu itself; the Overview behind it is FA-01 |
| XS-05 Account menu and menu drawer | Menu drawer · 375 | `XS-Menu-phone` | the drawer itself; the Overview behind it is FA-01 |
| XS-07 Help & support | Help & support | `XS-Help` | pixel-identical |
| XS-07 Help & support | Report a problem | `XS-Help-report` | pixel-identical |
| XS-03 Signed out | Signed out | `XS-Signed-out` | pixel-identical |
| XS-06 Not your workspace and scoped refusals | Not your workspace | `XS-Not-your-workspace` | pixel-identical |
| XS-06 Not your workspace and scoped refusals | Course not assigned to you | `Refusal-Course` | pixel-identical |
| XS-06 Not your workspace and scoped refusals | Co-teacher opens a submission | `Refusal-Co-teacher-marking` | pixel-identical |

## Patterns

- **P1** Priority band sized to its items, with the people or records behind each count; ivory only for urgent work
- **P2** Plan-tint identity band for a record (course, experiment, assessment) with fact figures
- **P3** Course ledger: tinted group header, column-aligned rows, no nested cards
- **P4** Unit meter beside counts in words, one per format; never a percentage
- **P5** Reading sheet at reading width with an action panel; the final action last with its note
- **P6** Sectioned authoring with a guidance and facts side panel; one primary in the footer
- **P7** Refined table: count, filters and actions in one toolbar; compact sub-lines; phone rows without repeated labels
- **P8** Sparse states: get-ready steps and compact message cards sized to their content
- **P9** Deadlines with days left and the release rule
- **P10** Records are identified by their name, the student’s name, the question’s text or its position — never by an internal technical id

FA-13, FA-23 and FA-24 are excluded in the pack and not designed.
