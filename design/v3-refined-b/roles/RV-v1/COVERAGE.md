# Coverage register · Academic Reviewer · FINAL — OWNER APPROVED

**Status: FINAL — OWNER APPROVED, 21 October 2026.** Every owned screen and important subview, marked **REDESIGNED** or **REVIEWED AND UNCHANGED** against the completed role (18 Oct 2026). Each one was inspected, rendered at its widths and tested. The same register is the *Coverage* board on the canvas; this file is generated from it.

**42 subviews: 30 REDESIGNED, 12 REVIEWED AND UNCHANGED, 0 pending or awaiting propagation.** RV-07 is excluded by the existing decision and not designed.

- **REDESIGNED** — the subview’s own design changed in this refinement.
- **REVIEWED AND UNCHANGED** — inspected against the refined direction and kept; it now renders inside the refined pages.

## Correction applied after acceptance

Internal record IDs (SUB-…, UPD-… and any REQ-/ACC-style identifier) were removed from reviewer-facing labels on all six screens: the queue rows, Reviewed by me rows, the identity card and the breadcrumb, which now names the experiment. The IDs remain in the records, the route proposals, the search and the audit trail. Experiment names, course codes, vendor names and format labels are unchanged. Verified by scanning the rendered text of every board (CHECKS.md).

## RV-01 · Overview

| Subview | Boards | What changed, or why it stays | Status |
| --- | --- | --- | --- |
| Waiting items · review desk | RV.dc.html (1440 live), RV01-375.dc.html (375), RV-375.dc.html (375 live) | Was one panel of identical rows stretched across the page, the gold button away from the item it opened. Now a review desk: the item waiting longest leads with its waiting time and the only gold action, Start review; the rest follow oldest first with type tags and what to look at. Side cards: the queue by type, your scope with course names, your last three decisions. Every figure counts existing records. | **REDESIGNED** |
| Mid widths | RV01-1024.dc.html (1024), RV01-768.dc.html (768) | The desk runs full width; In your queue and Your review scope sit two across beneath it, Recently decided full width. | **REDESIGNED** |
| Nothing waiting | RV01-calm.dc.html (1440) | Was a calm message on an empty page. Now the message and Open Reviewed by me sit beside your scope and recent decisions. A decision whose item is waiting again is left out here, so it can’t contradict the empty queue. | **REDESIGNED** |

## RV-02 · Review queue

| Subview | Boards | What changed, or why it stays | Status |
| --- | --- | --- | --- |
| Everything waiting | RV02.dc.html (1440), RV02-375.dc.html (375) | Type was plain text in a select, and a resubmission read as New submission. Now tabs with counts for the same four filters; arrow keys move between them. Type tags with distinct icons: a resubmission shows its revision, an update 1.2 → 1.3. A What to look at column. Course names with the codes, formats beside the record ID, waiting time in bold. | **REDESIGNED** |
| Mid widths | RV02-1024.dc.html (1024), RV02-768.dc.html (768) | Three-column rows (item · type and what to look at · waiting) carrying the same tags. | **REDESIGNED** |
| Filters applied | RV02-filtered.dc.html (1440) | Search and course chips with Clear filters under the tabs; the tab counts follow the search. | **REDESIGNED** |
| Loading · failed to load | RV02-loading.dc.html (1024), RV02-failed.dc.html (1024) | Loading rows match the new four-column table. The tabs show no counts until the list has loaded, and none when it fails. Try again kept. | **REDESIGNED** |
| No match · nothing waiting | RV02-nomatch.dc.html (1024), RV02-empty.dc.html (1024) | Both messages and their actions (Clear filters; Open Reviewed by me) kept. No match sits under the new tabs; nothing waiting keeps no toolbar and no rail count. Its list area no longer claims to be a tab panel when no tabs are shown (screen readers only). | **REVIEWED AND UNCHANGED** |

## RV-03 · Review a submission

| Subview | Boards | What changed, or why it stays | Status |
| --- | --- | --- | --- |
| Resubmission SUB-0077, revision 2 | RV03.dc.html (1440), RV03-375.dc.html (375) | Every section had the same weight, a fact strip repeated the details and nothing helped you move through a long page. Now an identity card (type, ID, title, summary, status, course, sender, facts) with a page map, then blocks in three weights: what changed, your learning outcomes, the vendor’s material. On phones the decision comes before the history. | **REDESIGNED** |
| Mid widths | RV03-1024.dc.html (1024), RV03-768.dc.html (768) | One column: the identity card with Go to decision, the content, the decision panel, then the history. Separators in the card never start or end a wrapped line. | **REDESIGNED** |
| Description and documents | RV03.dc.html (SUB-0077), RV06.dc.html (none sent) | The description at reading width; the preview link and each document as a card. A record with neither says so once. | **REDESIGNED** |
| Formats and delivery | RV03.dc.html (1440), RV03-375.dc.html (375) | A large tile per format became one line: In this submission WEB · VR, then Not included: AR, MR (its own line on phones). The per-format delivery cards are kept. | **REDESIGNED** |
| Review history | RV03.dc.html (waiting), RV06.dc.html (decided) | Continues the content column on wide screens and follows the decision on narrow ones; a quiet block while the item waits, a card once it is decided. | **REDESIGNED** |
| Decision panel | RV03.dc.html (1440), RV03-375.dc.html (375) | Opens with Before you decide (outcomes, what the decision covers, what changed) and ends with What happens next: you → Content Manager → institutions. Decision wording unchanged. | **REDESIGNED** |
| Learning outcomes needed (SUB-0086) | RV03-outcomes.dc.html (1440), RV03-outcomes-375.dc.html (375) | The rule appeared only after pressing Approve, then three times. Now Before you decide states it up front with Add an outcome; pressing Approve gives one summary and the error at the outcome field, and the hint steps aside. Rule unchanged: at least one outcome to approve. | **REDESIGNED** |
| Re-check, an outcome deleted (SUB-0071) | RV03-recheck.dc.html (1440) | The Content Manager’s reason leads as the why-it-is-here block, the identity card says Re-check, and the deleted outcome offers Undo. | **REDESIGNED** |
| Return: reason required | RV03-return-errors.dc.html (1440) | One error summary in the panel and the error at the reason field; the pending hint steps aside instead of repeating it. | **REDESIGNED** |
| Return: reason and field references | RV03-return-filled.dc.html (1440) | Field references grouped by editor section, each group with its own heading; the two pre-filled ones ticked. The recorded return lists them as section · field. | **REDESIGNED** |
| Editing an outcome | RV03-editing-375.dc.html (375) | Inline edit with Save and Cancel kept; it sits in the new outcomes block. The field now points to its error message only while one is shown (screen readers only). | **REVIEWED AND UNCHANGED** |
| Confirm approval | RV03-confirm.dc.html (1440) | The dialog already separates what happens now from later decisions. Kept. | **REVIEWED AND UNCHANGED** |
| Approved · returned | RV03-approved.dc.html (approved), RV03-returned.dc.html (returned) | The outcome block and its wording kept as the panel’s end state; around it, the redesigned page, now read-only. | **REVIEWED AND UNCHANGED** |

## RV-04 · Review an update

| Subview | Boards | What changed, or why it stays | Status |
| --- | --- | --- | --- |
| UPD-0005, Distillation Column 1.2 → 1.3 | RV04.dc.html (1440), RV04-375.dc.html (375) | The comparison came before the reason; the live version and the release chain only at the bottom. Now why this correction → what changes (live 1.2 against proposed 1.3, changed fields only) → the live experiment and its outcomes, read-only. The vendor joins the facts. What happens next: you → Super Admin, release or hold → live version. | **REDESIGNED** |
| Mid widths | RV04-1024.dc.html (1024), RV04-768.dc.html (768) | One column in the same order, the panel after the content and before the history. The fifth fact wraps flush left, without a stray divider. | **REDESIGNED** |
| Return: reason required | RV04-return-errors.dc.html (1440) | The same single-error pattern as RV-03. No field references on update returns. | **REDESIGNED** |
| Confirm approval | RV04-confirm.dc.html (1440) | Says what happens now and that 1.2 stays live until the Super Admin releases 1.3. Kept. | **REVIEWED AND UNCHANGED** |
| Approved · returned | RV04-approved.dc.html (approved), RV04-returned.dc.html (returned) | Outcome blocks and wording kept; around them, the redesigned page. | **REVIEWED AND UNCHANGED** |
| Stale version refused · stale refusal, live | RV04-stale.dc.html (refused), RV04-stale-armed.dc.html (live) | The refusal and the withdrawn status (no reason shown) kept; nothing is recorded. | **REVIEWED AND UNCHANGED** |

## RV-05 · Reviewed by me

| Subview | Boards | What changed, or why it stays | Status |
| --- | --- | --- | --- |
| All decisions | RV05.dc.html (1440), RV05-375.dc.html (375) | Was a generic table: type as plain text, the outcome pill competing with its Now line. Now tabs for All, New submissions and Updates (the same three Show choices) with counts, and four columns: experiment (name, course code and name, ID) · type (tag with revision or version) · your decision (pill and date) · where it is now, given the weight. | **REDESIGNED** |
| Mid widths | RV05-1024.dc.html (1024), RV05-768.dc.html (768) | Two-column rows: the experiment on the left; type, decision, date and where it is now on the right. | **REDESIGNED** |
| Updates only | RV05-updates.dc.html (1440) | The Updates tab selected, with Clear filters, instead of a select and a chip. | **REDESIGNED** |
| Loading · failed to load | RV05-loading.dc.html (1024), RV05-failed.dc.html (1024) | Loading rows match the four-column table; the tabs show no counts until the list has loaded. Try again kept. | **REDESIGNED** |
| No match · nothing decided yet | RV05-nomatch.dc.html (1024), RV05-empty.dc.html (1024) | Messages and actions kept; no match sits under the new tabs. The empty list no longer claims to be a tab panel (screen readers only). | **REVIEWED AND UNCHANGED** |

## RV-06 · Decided item, read-only

| Subview | Boards | What changed, or why it stays | Status |
| --- | --- | --- | --- |
| Approved submission (SUB-0074) | RV06.dc.html (1440), RV06-375.dc.html (375) | The identity card and page map of RV-03, with the decision date. Outcomes read-only; the panel shows your decision and where the record stands: academic review, outcomes, publication, access. | **REDESIGNED** |
| Returned submission (SUB-0081) | RV06-returned.dc.html (1440) | A record with few details no longer gets a thin block repeating course and formats. The panel quotes your reason with its field references; the history is a card. | **REDESIGNED** |
| Approved update with the Super Admin (UPD-0004) | RV06-update.dc.html (1440) | The same decision-first treatment; it says only that the update is with the Super Admin for a release decision. Hold reasons are never shown. | **REDESIGNED** |
| Already decided elsewhere (SUB-0077) | RV06-elsewhere.dc.html (1440) | The refusal notice kept; under it, the redesigned read-only item. | **REVIEWED AND UNCHANGED** |

## Boundaries · Refusals and scope

| Subview | Boards | What changed, or why it stays | Status |
| --- | --- | --- | --- |
| Outside your scope (UPD-0006) | RV-scope.dc.html (1440), RV-scope-375.dc.html (375) | A message on a large empty page became one card with the heading and two ways on: back to the review queue, Help & support. Nothing of the record shown; wording from the shared message template. | **REDESIGNED** |
| Not available (a draft withdrawn before it was sent) | RV-unavailable.dc.html (1440) | The same card. | **REDESIGNED** |
| Queue after a scope is withdrawn (CHE ZG513) | RV-scope-withdrawn.dc.html (1440) | Shown in the redesigned queue. Behaviour kept: the course’s items leave the queue and the course filter lists two codes. | **REDESIGNED** |

## Shell · Shell and borrowed shared surfaces

| Subview | Boards | What changed, or why it stays | Status |
| --- | --- | --- | --- |
| Rail, page header, phone menu button | every board | The XR-V3-RB-1.0 shell: rail with the queue count, date line, account button. Kept. | **REVIEWED AND UNCHANGED** |
| Account menu · phone menu | RV-account.dc.html (1440), RV-drawer-375.dc.html (375) | Borrowed renderings of the shared contract; Shared Surfaces owns them. Kept. | **REVIEWED AND UNCHANGED** |
| Help & support · report a problem · report sent · signed out | RV-help.dc.html (help), RV-report-375.dc.html (report), RV-report-sent.dc.html (sent), RV-signedout.dc.html (signed out) | Borrowed renderings; Shared Surfaces owns them and replaces them at assembly. Their empty areas are passed on as a note, not restyled here. | **REVIEWED AND UNCHANGED** |

## RV-07 · Courses in scope · Learning outcomes · Reviewer settings

| Subview | Boards | What changed, or why it stays | Status |
| --- | --- | --- | --- |
| Not designed | — | Excluded by the existing decision. Scope is a card on the Overview; outcomes are edited on the review page. | **EXCLUDED** |
