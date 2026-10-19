# Role status · Vendor (final)

> **FINAL DESIGN · AWAITING OWNER ACCEPTANCE.** The design is complete and connected. Claude Code implementation has **not** started.

This file is the authoritative status record. `ROLE-STATUS.json` is generated from the same data in the same build.

| | |
| --- | --- |
| Role | Vendor (owner code `VE`) |
| Foundation | `XR-V3-RB-1.0` |
| Delivered | 19 October 2026 · Design canvas version 14 (70 boards on one page) |
| Owned designed IDs | **10 of 10**: VE-01, VE-02, VE-03, VE-04, VE-05, VE-06, VE-07, VE-08, VE-09, VE-13 |
| Excluded, not designed | VE-10, VE-11, VE-12, VE-14, VE-15. Nothing links to them |
| Pre-existing V3 seeds | none |
| Live entry | `project/Main.dc.html`, the first board on the canvas |
| Supersedes | XR-V3-Vendor-Complete-Role-Source.zip (18 Oct 2026, the pre-refinement baseline); XR-V3-Vendor-Refinement-R1-Source.zip (19 Oct 2026, refinement checkpoint R1) |

## Role status

| Status | State |
| --- | --- |
| DESIGN COMPLETE | yes: all ten owned screens, with the accepted refinement R1 applied role-wide |
| CONNECTED PREVIEW COMPLETE | yes: one role-preview root with connected subviews; changes persist until Reset |
| ASSEMBLY PENDING | XS: the account menu (XS-05), Help & support (XS-07), not-your-workspace (XS-06) and Sign out → Signed out (XS-03) are borrowed v46 shared behaviour in V3 tokens, not the delivered XS components |
| OWNER ACCEPTANCE PENDING | yes: this is the final design, awaiting the owner’s acceptance |
| IMPLEMENTATION | NOT STARTED: Claude Code integration has not begun |

## Refinement R1

Accepted by the owner, with its five presentation choices, and applied to all ten owned screens and the borrowed Help form:

1. Recent activity on the Overview, built from existing history
2. Grouped Overview counts replace the per-status links; the list tabs filter by status
3. Status tabs replace the status dropdown and the removable filter chips (same filter values)
4. The With column becomes part of the status line
5. App-package guidance written once, above the delivery blocks

The four R1 screens are kept as accepted. For VE-01…VE-04, 77 of 80 renders are pixel-identical to the R1 checkpoint. The other 3 are VE-03 “draft saved” at 1440, 1024 and 768, where the saved message now sits next to Cancel (`evidence/r1-vs-final-pixels.json` in the screenshot archive).

## Evidence key

| Mark | Meaning |
| --- | --- |
| RENDERED | rendered with the Design type’s runtime at 1440, 1024, 768 and 375; checked for horizontal overflow, elements beyond the viewport, clipped text, overlapping text, text under 13px and console errors; screenshots inspected |
| EXERCISED | clicked and typed through in a real browser at all four widths by tools/journeys_f.py (J1, J2, J3, L, S) and tools/links_f.py (LK-xx); see CHECKS.md |
| BOARD | inspection board on the canvas (project/<name>.dc.html) |

Totals: journeys 99/99 at 1440, 99/99 at 1024, 102/102 at 768, 102/102 at 375; links 54/54 at 1440, 51/51 at 1024, 53/53 at 768, 53/53 at 375; 236 renders with 0 overflow, 0 clipped, 0 overlapping and 0 console errors; 70 boards measured; hosted files 75 of 75 byte-identical.

## Screens at a glance

| ID | Screen | Kind | Route proposal | Refinement | Boards | States rendered | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VE-01 | Overview | page | `/vendor` | R1 screen as accepted, merged into the role root | 6 | 6 | DESIGN COMPLETE · CONNECTED |
| VE-02 | My experiments (all, any status) | page | `/vendor/experiments` | R1 screen as accepted, merged into the role root | 9 | 7 | DESIGN COMPLETE · CONNECTED |
| VE-03 | Create experiment · Course & description | step | `/vendor/experiments/new?step=course` | R1 screen as accepted, merged into the role root | 6 | 6 | DESIGN COMPLETE · CONNECTED |
| VE-04 | Create experiment · Formats & delivery | step | `/vendor/experiments/[submissionId]/edit?step=formats` | R1 screen as accepted, merged into the role root | 7 | 5 | DESIGN COMPLETE · CONNECTED |
| VE-05 | Create experiment · Preview & documents | step | `/vendor/experiments/[submissionId]/edit?step=preview` | final pass: R1 patterns applied | 3 | 2 | DESIGN COMPLETE · CONNECTED |
| VE-06 | Check & submit | step | `/vendor/experiments/[submissionId]/edit?step=submit` | final pass: R1 patterns applied | 5 | 4 | DESIGN COMPLETE · CONNECTED |
| VE-07 | Experiment record (status, details, timeline) | page | `/vendor/experiments/[submissionId]` | final pass: R1 patterns applied | 13 | 12 | DESIGN COMPLETE · CONNECTED |
| VE-08 | Revise & resubmit (after a return) | step | `/vendor/experiments/[submissionId]/revise` | final pass: R1 patterns applied | 8 | 8 | DESIGN COMPLETE · CONNECTED |
| VE-09 | Edit draft | step | `/vendor/experiments/[submissionId]/edit` | final pass: R1 patterns applied | 3 | 2 | DESIGN COMPLETE · CONNECTED |
| VE-13 | Submission & version history | tab | `/vendor/experiments/[submissionId]?tab=history` | final pass: R1 patterns applied | 3 | 2 | DESIGN COMPLETE · CONNECTED |

Route proposals are v46 proposals. The application keeps its real routes.

## VE-01 · Overview

| | |
| --- | --- |
| Kind | page |
| Navigation | Sidebar · Overview (role home) |
| Route proposal | `/vendor` |
| v46 source | `B5-01-Vendor-Overview.dc.html` (REFINE) |
| Designed in | Main.dc.html · Overview view |
| Refinement | R1 screen as accepted, merged into the role root |
| Status | **DESIGN COMPLETE · CONNECTED** |

**States**

- studio band with four real counts: With you, In review, Published, and Read-only when there is one
- returned item as the lead (ivory): kind, name, who and when, the reason in full, what it refers to, Revise
- returned item with saved-but-unsent changes (“your changes are saved, not resubmitted”)
- drafts to finish (and any further returned items)
- recent activity: the five newest history entries, newest first; each opens its record; Changed in the last 7 days
- nothing needs you (calm)
- first visit: no experiments, Create your first experiment
- after a submission the draft leaves the attention list and moves to In review
- after a resubmission the revise item leaves the attention list
- phones: the returned item and drafts come before the counts, so Revise is on the first screen

**Boards (BOARD):** `VE-01-1440`, `VE-01-1024`, `VE-01-768`, `VE-01-375`, `VE-01-calm`, `VE-01-first-visit`

**Rendered (RENDERED, all four widths):** `VE-01_overview`, `VE-01_calm`, `VE-01_first-visit`, `BAND_overview`, `SHELL_account-menu`, `SHELL_drawer`

**Exercised (EXERCISED):** J1 start and persistence (attention list, recent activity, counts); J2 lead → VE-08; LK-01; LK-02; LK-03; LK-04; LK-05; LK-06; LK-07; LK-08

## VE-02 · My experiments (all, any status)

| | |
| --- | --- |
| Kind | page |
| Navigation | Sidebar · My experiments |
| Route proposal | `/vendor/experiments` |
| v46 source | `B5-02-My-Experiments.dc.html` (MERGE) |
| Designed in | Main.dc.html · list view |
| Refinement | R1 screen as accepted, merged into the role root |
| Status | **DESIGN COMPLETE · CONNECTED** |

**States**

- populated (6 experiments)
- status tabs with counts: All, plus each status that has an experiment (Draft includes the read-only draft; Returned includes a Content Manager return; With Academic Reviewer includes a re-check)
- search by name, submission ID or course
- Changed in the last 7 days (the VE-13 filter)
- result count and Clear filters (focus returns to Search)
- visible sort by last change, both directions
- no match
- no experiments yet
- loading
- could not load + Try again
- status pill with one plain line; one action column (Revise / Edit draft)
- row tag “Changes saved, not resubmitted”
- table at wide widths; three-line cards below 760px with a labelled last-change date

**Boards (BOARD):** `VE-02-1440`, `VE-02-1024`, `VE-02-768`, `VE-02-375`, `VE-02-returned`, `VE-02-empty`, `VE-02-nomatch`, `VE-02-loading`, `VE-02-failed`

**Rendered (RENDERED, all four widths):** `VE-02_list`, `VE-02_filtered-returned`, `VE-02_recent`, `VE-02_nomatch`, `VE-02_loading`, `VE-02_failed`, `VE-02_empty`

**Exercised (EXERCISED):** L search, tabs, 7-day filter, sort, no match, Clear filters, failed; J1 list keeps the new draft and the submission; J2 list keeps the private revision and the resubmission; LK-09; LK-10; LK-11; LK-12; LK-13; LK-N6; LK-N7

## VE-03 · Create experiment · Course & description

| | |
| --- | --- |
| Kind | step |
| Navigation | Create flow, step 1 (Create experiment on Overview and My experiments) |
| Route proposal | `/vendor/experiments/new?step=course` |
| v46 source | `B5-03-Create-Course-and-Description.dc.html` (NEW) |
| Designed in | Main.dc.html · editor, step 1 (shared four-step editor) |
| Refinement | R1 screen as accepted, merged into the role root |
| Status | **DESIGN COMPLETE · CONNECTED** |

**States**

- empty, in two sections (Course and name; Catalogue text) on the field grid
- five required fields missing: error summary focused, links focus each field
- name already used (catalogue or own experiment, case-insensitive)
- course no longer assigned
- draft saved: submission ID SUB-0087 on first save, time shown next to Cancel
- save needs a name
- only assigned courses offered (ME ZG523)
- aside outline: the two groups with a live status (wide layouts)

**Boards (BOARD):** `VE-03-1440`, `VE-03-375`, `VE-03-validation`, `VE-03-name-taken`, `VE-03-course-withdrawn`, `VE-03-draft-saved`

**Rendered (RENDERED, all four widths):** `VE-03_new`, `VE-03_validation`, `VE-03_name-taken`, `VE-03_course-withdrawn`, `VE-03_saved`, `BAND_editor-fill`

**Exercised (EXERCISED):** J1 validation, unique-name rule, assigned courses, Save draft, ID on first save, focus to saved status; J3 withdrawn course error; LK-14; LK-P1; LK-F4

## VE-04 · Create experiment · Formats & delivery

| | |
| --- | --- |
| Kind | step |
| Navigation | Create flow, step 2 |
| Route proposal | `/vendor/experiments/[submissionId]/edit?step=formats` |
| v46 source | `B5-04-Formats-and-Delivery.dc.html` (NEW) |
| Designed in | Main.dc.html · editor, step 2 |
| Refinement | R1 screen as accepted, merged into the role root |
| Status | **DESIGN COMPLETE · CONNECTED** |

**States**

- compact format selector (WEB, AR, VR, MR) in the chip grammar
- one delivery block per chosen format: chip, name, kind and a live status (Complete / N still needed / N to fix)
- WEB: web link (https://), browser and computer needed, optional notes
- AR/VR/MR app-package stand-in: package label, package reference or a sample file name (Attach file), device needed, install notes, optional notes; guidance written once above the blocks
- WEB complete with AR partly filled (2 still needed)
- no format chosen
- delivery fields to fix (exact v46 messages)
- aside outline lists the chosen formats with their status; a format moves focus to its block
- leave without saving? when unsaved changes would be lost

**Boards (BOARD):** `VE-04-1440`, `VE-04-375`, `VE-04-two-formats`, `VE-04-validation`, `VE-04-1024`, `VE-04-768`, `VE-04-leave-guard`

**Rendered (RENDERED, all four widths):** `VE-04_all-formats`, `VE-04_two-formats`, `VE-04_validation`, `VE-04_no-format`, `VE-04_leave-guard`

**Exercised (EXERCISED):** J1 no format, WEB block, https rule, leave guard (focus, Keep editing keeps values); J2 AR fields revised; LK-E1; LK-E3; LK-N1; LK-N2; LK-N3; LK-N4; LK-N5

## VE-05 · Create experiment · Preview & documents

| | |
| --- | --- |
| Kind | step |
| Navigation | Create flow, step 3 |
| Route proposal | `/vendor/experiments/[submissionId]/edit?step=preview` |
| v46 source | `B5-05-Preview-Check-and-Submit.dc.html` (NEW) |
| Designed in | Main.dc.html · editor, step 3 |
| Refinement | final pass: R1 patterns applied |
| Status | **DESIGN COMPLETE · CONNECTED** |

**States**

- Preview section: label and link side by side (the link starts with https://); a preview reaches the public only if the experiment is published
- a label without a valid link is an error
- Documents section: sample file names, Add document in the section header, Remove on each row, a dashed “No documents added.” line when empty; nothing is uploaded

**Boards (BOARD):** `VE-05-1440`, `VE-05-375`, `VE-05-preview-error`

**Rendered (RENDERED, all four widths):** `VE-05_preview`, `VE-05_preview-error`

**Exercised (EXERCISED):** J1 preview rule and Add document; LK-F3

## VE-06 · Check & submit

| | |
| --- | --- |
| Kind | step |
| Navigation | Create flow, step 4 |
| Route proposal | `/vendor/experiments/[submissionId]/edit?step=submit` |
| v46 source | `B5-05-Preview-Check-and-Submit.dc.html` (NEW) |
| Designed in | Main.dc.html · editor, step 4 + dialog + outcome |
| Refinement | final pass: R1 patterns applied |
| Status | **DESIGN COMPLETE · CONNECTED** |

**States**

- one review section per step with its status and a Change button
- Formats and delivery shown in the same read-only blocks as the record
- learning outcomes: added by the Academic Reviewer, read-only
- steps still to complete, with Go to links
- ready to submit
- note: submitting does not publish
- confirmation dialog (focus on title, Tab trapped, Escape returns focus)
- busy state against repeat presses
- outcome card: Submitted for academic review · status · time · formats · what happens next · Open the experiment record / Back to My experiments

**Boards (BOARD):** `VE-06-1440`, `VE-06-375`, `VE-06-missing`, `VE-06-confirm`, `VE-06-submitted`

**Rendered (RENDERED, all four widths):** `VE-06_ready`, `VE-06_missing`, `VE-06_dialog`, `VE-06_submitted`

**Exercised (EXERCISED):** J1 submit: dialog focus, Tab cycle, Escape, busy, outcome, record, history; LK-E2; LK-F1; LK-F2; LK-16

## VE-07 · Experiment record (status, details, timeline)

| | |
| --- | --- |
| Kind | page |
| Navigation | Detail from My experiments, Overview, editor outcomes |
| Route proposal | `/vendor/experiments/[submissionId]` |
| v46 source | `B5-06-Experiment-Record-and-History.dc.html` (REFINE) |
| Designed in | Main.dc.html · record view, Details tab |
| Refinement | final pass: R1 patterns applied |
| Status | **DESIGN COMPLETE · CONNECTED** |

**States**

- returned by the Academic Reviewer: the returned-reason panel with who, when, the reason in their words and reference chips into the editor
- returned by the Content Manager
- draft (only you can see it)
- with the Academic Reviewer after a first submission
- with the Content Manager (approved)
- back with the Academic Reviewer for a re-check
- published: read-only vendor information, formats published; publishing is not a Vendor command; changes are not made here
- course no longer assigned: read-only, Ask for help
- submitted revision 2 (neutral; Conduction Through a Composite Wall)
- saved changes not resubmitted: stated inside the returned-reason panel with the changed fields; everyone else still sees the submitted revision
- the status is stated once (header pill and notice); the Details sheet says which version is shown
- “Where it stands”: formats, revision and dates, beside both tabs

**Boards (BOARD):** `VE-07-1440`, `VE-07-1024`, `VE-07-768`, `VE-07-375`, `VE-07-draft`, `VE-07-with-reviewer`, `VE-07-with-content-manager`, `VE-07-published`, `VE-07-read-only`, `VE-07-returned-by-cm`, `VE-07-recheck`, `VE-07-private-revision`, `VE-07-submitted`

**Rendered (RENDERED, all four widths):** `VE-07_returned`, `VE-07_draft`, `VE-07_with-rv-first`, `VE-07_submitted-rev2-composite-wall`, `VE-07_with-cm`, `VE-07_published`, `VE-07_readonly`, `VE-07_returned-by-cm`, `VE-07_recheck`, `VE-07_private-revision`, `VE-07_submitted-after-resubmit`, `BAND_resubmitted-handoff`

**Exercised (EXERCISED):** J1 record after submit; J2 private revision, record after resubmit; J3 published read-only, CM return; LK-04; LK-11; LK-17; LK-21; LK-22; LK-23; LK-24; LK-25; LK-26; LK-F5; LK-F6

## VE-08 · Revise & resubmit (after a return)

| | |
| --- | --- |
| Kind | step |
| Navigation | Flow from a returned record, the Overview lead or a My experiments row |
| Route proposal | `/vendor/experiments/[submissionId]/revise` |
| v46 source | `B5-07-Revise-and-Resubmit.dc.html` (REFINE (heavy)) |
| Designed in | Main.dc.html · editor in revise mode |
| Refinement | final pass: R1 patterns applied |
| Status | **DESIGN COMPLETE · CONNECTED** |

**States**

- the returned-reason panel above the editor, focused
- references jump to the step and field; referenced fields tagged
- changes kept through step navigation
- Save changes: private revision, not resubmitted
- nothing changed since the submitted revision
- neutral resubmit note and dialog
- outcome card: Submitted, “Your changes have been submitted for review.”
- refusals: already submitted, being reviewed, approved, published
- Content Manager return revised the same way

**Boards (BOARD):** `VE-08-1440`, `VE-08-375`, `VE-08-reason-first`, `VE-08-changes-saved`, `VE-08-confirm`, `VE-08-submitted`, `VE-08-already-submitted`, `VE-08-already-decided`

**Rendered (RENDERED, all four widths):** `VE-08_revise-step1`, `VE-08_ref-jump`, `VE-08_changes-saved`, `VE-08_check`, `VE-08_dialog`, `VE-08_submitted`, `VE-08_cm-return`, `VE-08_already-submitted`

**Exercised (EXERCISED):** J2 end to end; J3 stale and decided refusals; LK-R1; LK-02; LK-12; LK-22; LK-23

## VE-09 · Edit draft

| | |
| --- | --- |
| Kind | step |
| Navigation | Flow from a draft record, the Overview or a My experiments row |
| Route proposal | `/vendor/experiments/[submissionId]/edit` |
| v46 source | `B5-07-Revise-and-Resubmit.dc.html` (MERGE → VE-03…06 editor) |
| Designed in | Main.dc.html · the same four-step editor in draft mode (no duplicated form) |
| Refinement | final pass: R1 patterns applied |
| Status | **DESIGN COMPLETE · CONNECTED** |

**States**

- opens at the saved step with the saved values
- save, continue and submit as in create
- course no longer assigned: read-only sheet “What you entered”, nothing can be submitted, Ask for help
- decided or in review: refusal

**Boards (BOARD):** `VE-09-1440`, `VE-09-375`, `VE-09-read-only`

**Rendered (RENDERED, all four widths):** `VE-09_edit-draft`, `VE-09_readonly`

**Exercised (EXERCISED):** J1 reopen draft (VE-09) and finish it; J3 read-only and decided refusal; LK-R2; LK-R3; LK-03; LK-13; LK-15; LK-19; LK-20; LK-21

## VE-13 · Submission & version history

| | |
| --- | --- |
| Kind | tab |
| Navigation | Record tab, plus the “Changed in the last 7 days” filter on VE-02 |
| Route proposal | `/vendor/experiments/[submissionId]?tab=history` |
| v46 source | `B5-02-My-Experiments.dc.html`, `B5-06-Experiment-Record-and-History.dc.html` (MERGE → VE-07 timeline (+ recently changed filter on VE-02)) |
| Designed in | Main.dc.html · record view, history tab |
| Refinement | final pass: R1 patterns applied |
| Status | **DESIGN COMPLETE · CONNECTED** |

**States**

- timeline newest first: what, when (at the right) and note; “Newest first · not an audit log”
- entries: draft saved, submitted, returned with a reason, submitted · revision N, approved, published, course withdrawn
- saved-but-unsent changes are named as not part of the history until resubmitted
- “Where it stands” stays beside the history; the history heading takes focus when the tab opens

**Boards (BOARD):** `VE-13-1440`, `VE-13-375`, `VE-13-published`

**Rendered (RENDERED, all four widths):** `VE-13_history-rev2`, `VE-13_history-published`

**Exercised (EXERCISED):** J1 history after submit; J2 history after resubmit and Composite Wall history; L Changed in the last 7 days; LK-26; LK-F5; LK-P2

## Borrowed shared surfaces (ASSEMBLY PENDING XS)

| ID | What | State | Boards |
| --- | --- | --- | --- |
| XS-05 | Account menu | borrowed: name, role, organisation, Help & support, Sign out; no role switcher; Escape closes and returns focus | `XS-05-account-menu` |
| XS-07 | Help & support | borrowed: My reports (empty → Report a problem), report form in the role form layout, validation, sending, sent with reference, report detail | `XS-07-help`, `XS-07-report-error`, `XS-07-report-sent` |
| XS-06 | This page isn’t part of your workspace | borrowed: Back to Overview, Help & support | `XS-06-not-your-workspace` |
| XS-03 | Signed out | not drawn; Sign out leads to a preview handoff note | — |
| shell | Phone menu (drawer) | V3 Refined B shell below 1024px: focus on Close, trapped, Escape returns focus to Menu | `menu-375` |

The XS states rendered at all four widths are `XS-07_help`, `XS-07_form`, `XS-07_error`, `XS-07_sent`, `XS-06_not-your-workspace`. They were exercised by suite S (account menu, Help, report, Sign out handoff, not your workspace, phone menu) and by LK-19, LK-24 and LK-27…LK-32.
