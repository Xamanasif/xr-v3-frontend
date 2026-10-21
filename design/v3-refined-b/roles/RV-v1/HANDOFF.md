# Handoff · Academic Reviewer (RV-01 to RV-06) · FINAL — OWNER APPROVED

For the integration owner (Claude Code). **Approved by the owner on 21 October 2026.** Integration has not been started. This is a presentation design: bind it to the **existing** routes, services, commands, revisions and audience filtering in the current repository. Nothing here is a new policy or a new service. Where this file names a service need, it describes behaviour the screens rely on; use the repository's existing names.

## The review chain (do not blur)

- First publication: Vendor → **Academic Reviewer** → Content Manager → Published. *Approve* is never *Publish*.
- Post-publication correction: Content Manager → **Academic Reviewer** → Super Admin release or hold. *Approve update* never releases and never changes the live version.
- Publishing and releasing grant no institution or Student access. The screens say so where the decision is made.
- An opened link is not a hardware or physics test. The reviewer sees delivery details and web links only (T-30); there is no device certification and no partial-format approval (T-26 residual).

## Screens: states and allowed actions

### RV-01 Overview (the review desk)
- **Waiting for your decision**: the item waiting longest leads (*Next in line · waiting longest*): type tag, title, course code and name, revision and sender, formats, what to look at (for example *No learning outcomes yet*), its waiting time, and the one gold primary, **Start review**. The rest follow oldest first, divided by rules: waiting time, type tag, title, course, sender, what to look at, *Review* or *Review update*.
- **In your queue**: counts by type (new submissions, with how many are resubmissions; re-checks; updates); each row opens the queue on that tab.
- **Your review scope**: the effective scope's course codes with names; each row opens the queue filtered to that course. RV-07 is still not a destination.
- **Recently decided**: the last three decisions with pill, date and where each is now; a row opens it read-only (RV-06); *All decisions* opens RV-05.
- Nothing waiting: the calm message with *Open Reviewed by me*, beside scope and recent decisions. A decision whose item is waiting again is left out here, so it cannot contradict the empty queue.
- Every figure is a count of existing records from the same source as RV-02 and the rail badge. No new metrics.

### RV-02 Review queue
- Items waiting for this reviewer's decision, inside the effective course scope only, oldest first. Drafts are never listed.
- **Type tabs** with counts: All, New submissions, Re-checks, Updates (the same four filters as the completed role's Type select). WAI-ARIA tabs: arrow keys, Home and End move and select; roving tabindex; the list area is the tab panel, labelled by the selected tab; when no tabs are shown it is not a tab panel. Counts appear only once the list has loaded.
- Search (name, course or sender — it still matches a record ID, which is no longer displayed) and Course (scope courses only), chips and *Clear filters*. Tab counts follow the filters.
- Columns: Experiment (title, course code and name, format badges) · Review type (type tag with revision or `1.2 → 1.3`, sender) · What to look at (missing outcomes, the re-check reason, changed fields) · Waiting (bold age, since date). Three-column rows at mid widths, stacked rows on phones.
- States: populated, filters applied, no match, loading (skeleton rows matching the four columns, count hidden), failed (*Try again*), nothing waiting (no toolbar, no rail count). When a scope is withdrawn, that course's items leave the queue and the Course filter.

### RV-03 Review a submission
- **Identity card**: type tag and revision, title, summary, status pill, course code and name, sender; facts (waiting, revision, version, formats; once decided: decided date); a page map (*On this page*) whose links focus the section and scroll it to the top; *Go to decision* when the panel sits below the content. No record ID is printed.
- Blocks in three weights, in this order: why it is here (*Re-check request* with the Content Manager's reason, or *What changed in revision N* with the earlier return reason and field-by-field was / now), your work (*Learning outcomes*: one set for the Experiment, every format, LD-3; add, edit in place, save, cancel, delete with *Undo*, move up/down, a live message for each change; the requirement chip or the rule), then reference (*Description and documents* at reading width, with the preview link and each document as a card; *Formats and delivery*: one line naming the formats in this submission and those not included, then one card per format; WEB opens the vendor's link in a new tab; AR/VR/MR show package, device need and install notes on demand; changed fields carry *Changed in revision N*).
- **Review history** follows the content on wide screens and comes after the decision panel on one column.
- **Decision panel**: *Before you decide* (outcome count and the rule that approving needs at least one, OD-B6-02; the reviewer decides for the whole Experiment, every format together; what changed since the return, with a link), the decision (*Approve*: sends it to the Content Manager with its outcomes, approving does not publish; or *Return to vendor*: reason required, optional field references grouped by the vendor editor's sections, OD-B5-10), the one gold button, and *What happens next* (You · academic decision → Content Manager · publication → Institutions · student access, publishing gives no one access).
- Errors: one error summary in the panel, the error at its field, and the pending hint steps aside rather than repeating it. Approve opens a confirmation dialog (approving does not publish; how many outcomes go).
- After deciding: the outcome block (status, when, reason and references, where it stands now, what happens next), decision controls gone, outcomes read-only; *Back to the review queue*.

### RV-04 Review an update
- Identity card: *Update · 1.2 → 1.3*, title, summary, status, course, from the Content Manager; facts: live version and since when, proposed version, waiting, formats, vendor; page map.
- Order: *Why this correction* (the Content Manager's reason, with time) → *What changes* (changed fields only, live 1.2 beside proposed 1.3, removed text struck and added text highlighted) → *The live experiment* (version 1.2, live since, its learning outcomes read-only; outcomes are not part of the correction) → update history.
- No learning-outcome editor (OD-B6-09).
- Decision panel: *Before you decide* (whole update; version 1.2 stays live until the Super Admin releases 1.3; changed fields, with a link), *Approve update* (confirmation: goes to the Super Admin; 1.2 stays live until a release; releasing changes no one's access) or *Return to the Content Manager* (reason required; no field references, T-28); *What happens next* (You → Super Admin · release or hold → live version).
- The word "Publish" never appears on the update path.

### RV-05 Reviewed by me
- Everything this reviewer decided inside the effective scope, newest first, audience filtered.
- **Tabs** with counts: All, New submissions, Updates (the same three choices as the completed role's Show select), same keyboard pattern as RV-02; search; chip; *Clear filters*.
- Columns: Experiment (title, course code and name) · Type (tag with revision or target version) · Your decision (pill and date) · Where it is now, given the weight: "With the Content Manager · not published", "Published on…", "With the vendor to revise", "With the Super Admin for a release decision", "Released on… · version … is live", "Revision 2 is in your queue", "Back in your queue for a re-check". Never a hold or withdrawal reason. No record ID is printed.
- States: no match, loading (counts hidden), failed (*Try again*), nothing decided yet.

### RV-06 Decided item (read-only)
- The RV-03/RV-04 page in its decided state, reached from Reviewed by me, the Overview's Recently decided, or right after deciding: the same identity card (with the decided date), outcomes read-only, and the panel holding the decision, its reason and references, and where the record stands (academic review, outcomes, publication, access). No second chance to change it.
- Records with only list-level facts show only those facts: no block repeating course and formats, and "No preview link or documents" said once. History is a card.
- The breadcrumb names the experiment.

### Refusals and boundaries (shared message pattern)
- **Outside your review scope**: one card with the title and explanation; nothing of the record is shown; *Back to the review queue*, *Help & support*.
- **Not available** (for example a draft withdrawn before it was ever sent, UPD-16): the same card.
- **Stale version** (withdrawn after the page was opened): "Nothing was recorded"; the page re-reads and shows "Withdrawn by the Content Manager" without a reason; the item leaves the queue.
- **Already decided** (another window): "Nothing new was recorded"; the existing decision is shown read-only.

## Internal technical identifiers (policy, applied 21 October 2026)

The owner extended the hidden-ID policy to this role with the acceptance.

- **Not printed anywhere a reviewer reads**: SUB-…, UPD-… and any REQ-/ACC-style identifier. That covers the queue rows, Reviewed by me rows, the identity card, breadcrumbs, dialogs, outcome blocks, refusals and the browser title of every board.
- **Kept, unchanged**: the identifiers in the records, in the route proposals (`/reviewer/submissions/[submissionId]`, `/reviewer/updates/[updateId]`), in the search index — searching a record ID still finds its item — and in anything the service records for audit. Permissions, reviewer scope and business rules are untouched.
- **Still visible to the reviewer**: experiment names, course codes and course names, vendor and sender names, revision numbers, version numbers and format labels.
- **When building the React app**: bind the row and page identity to the experiment name plus course; keep the ID in the route, the data layer and any logging. If a reviewer ever needs to quote a record, add a deliberate, labelled affordance and agree it with the owner first — do not reintroduce the ID as a passive label.
- **Flagged exceptions**: the `Main` and `Coverage` boards (integration documentation, not product UI); the support reference SUP-0214 on Help & support (a borrowed shared surface, and a reference the reviewer needs to quote); the vendor build name `NSS-CW-VR-1.0` on a VR delivery card (vendor data, not a platform record ID).

## Service needs (bind to existing names)


Known existing names from the supplied reports: the per-role correction filter `updateForAudience`, rule UPD-16 (unsent withdrawn drafts hidden from the reviewer), revision checks on every correction command, PC-66 (a vendor resubmission returns to the reviewer). Other names are not in this pack; use the repository's.

| Need | Used by | Behaviour the screens rely on |
| --- | --- | --- |
| Reviewer queue read | RV-01, RV-02, rail count | items waiting for this reviewer inside the effective scope, with kind (submission, re-check, update), revision, sender, course, formats, waiting since; oldest first; one source for list, counts and badge |
| Reviewed-by-me read | RV-05 | this reviewer's decisions inside the effective scope, newest first, with an audience-filtered "now" status |
| Submission review read | RV-03, RV-06 | details, formats and delivery, preview, document names, outcomes, history, previous return reason, changes since the last revision, re-check reason; refuses out-of-scope and unavailable records |
| Update review read | RV-04, RV-06 | live versus proposed changed fields, reason, live experiment summary and outcomes, history; through `updateForAudience` (no hold or withdrawal reasons) |
| Approve submission | RV-03 | expected revision, the outcome set (≥1); result: status With Content Manager, refusal flags for stale or already decided |
| Return submission | RV-03 | expected revision, reason (required), structured references (step · format · field); result: status Returned |
| Approve update | RV-04 | expected revision; result: Awaiting release decision; live version unchanged |
| Return update | RV-04 | expected revision, reason (required); result: Returned to the Content Manager |
| Repeated-command protection | all decisions | a second identical command records nothing and returns the existing outcome |

## Shared XS dependency (assembly pending)

Account menu (XS-05), Help & support with report a problem and my reports (XS-07), signed out (XS-03) with sign-in (XS-01) and the refusal messages are borrowed renderings of the existing shared behaviour, styled with V3 tokens (`rv-menu`, `rv-msg`, `rv-solo`, `rv-file`, `rv-formact`). Replace them with the XS team's components when delivered; keep the role's own pages unchanged. The real app keeps its working Help, account and navigation throughout.

## Open policies (designed safe treatment in place)

| ID | Question | Treatment here |
| --- | --- | --- |
| OD-B6-01 | Who assigns reviewer course scope | one scope line; Course filter lists that scope only |
| OD-B6-02 | Outcomes required before approval | at least one; no other rule |
| OD-B6-04 | When others see outcome edits | at the decision |
| OD-B5-10 | Structured references on a return | offered on submission returns, for the submission's own formats |
| T-28 residual | References on update returns; hold effects | reason only on update returns; hold never shown to the reviewer |
| OD-B6-09 | May a correction change outcomes | no outcome editor on updates |
| OD-B5-05 / PC-66 | Next gate after a resubmit | resubmission returns to the reviewer as the next revision |
| T-26 residual, T-30 | Format hold-back; who tests on a real device | no partial approval; delivery details and links only |
| OD-B7-15 | UPD-0006 scope history (sample data) | left out of Reviewed by me; used as the out-of-scope refusal; owner to confirm |
| — | SUB-0070 outcome count conflict (sample data) | outcome list omitted; owner to confirm |

## What changed from the completed role (18 Oct 2026)

- One visual language across the role: type tags with distinct icons; course codes always with names; formats as one compact line instead of large WEB/AR/VR/MR tiles.
- RV-01 rebuilt as a review desk. RV-02 and RV-05 filters became tabs with counts (same filters). The queue gained a What to look at column; Reviewed by me gives where each item is now the weight.
- RV-03, RV-04 and RV-06 share an identity card with a page map, blocks in three weights, and a decision panel that opens with what is ready and ends with what happens next. On one column the decision comes before the history.
- The outcome rule is stated before the attempt; errors show once in the panel and once at the field. Return references are grouped by editor section.
- Decided items with few facts no longer repeat course and formats; refusals are one card with two ways on.
- Accessibility fixes: separators never start or end a wrapped line; an empty list is not a tab panel when no tabs are shown; the outcome edit field references its error only while one is shown.
- **21 October, after acceptance:** internal record IDs removed from reviewer-facing labels (see the policy section above).
- Unchanged: records, statuses, wording of decisions, rules, routes, permissions, reviewer scope, flows, validation, keyboard behaviour, and the sample world (fixtures identical to the completed role).

## Data discrepancies to verify at integration

Neither was invented or silently changed; the design shows the safe reading and flags it.

- **UPD-0006 (EEE ZC341) — scope (OD-B7-15).** v46 lists this update in Reviewed by me, but EEE ZC341 is not on the 27 August 2026 scope line, and Batch 7 records that scope withdrawn on 1 October 2026. The design leaves it out of Reviewed by me (8 decisions, not 9) and uses it as the out-of-scope refusal example. Verify against the live scope records; if the course was in scope on 27 August, the list is 9 and the refusal example needs another record.
- **SUB-0070 — learning outcomes.** The v46 queue data gives 3 learning outcomes; board B6-11 shows none. The decided page omits the outcome list and count rather than choosing one. Verify against the live record and restore the list once the true count is known.

## Integration notes

- The canvas boards are inspection states of one component (`project/RV.dc.html`); presets (`preset`, `listPreset`, `overlay`, `helpPreset`, `scope`) only choose a starting state. In the React app every state comes from data.
- Tabs: follow the WAI-ARIA tabs pattern exactly as built (roving tabindex; `aria-controls` on each tab; the panel labelled by the selected tab; no `role="tabpanel"` when the tabs are not shown).
- Separators in wrapping rows: draw them as a pseudo-element of the item after the gap and clip the row (`overflow: hidden`), as `rv.css` does for the identity card, its facts and the formats line.
- Page map and readiness links move focus to the section heading and scroll it to the top; keep that focus behaviour.
- Canvas frames carry a ~24 px allowance below the content for font differences between hosts; it is not a layout rule.
- `support.js` is the design host's runtime. Never ship it in the React app.

## Sources

`ROLE-SCOPE.json` boards B6-01, B6-02, B6-03, B6-04, B6-11, B6-12, B6-13, B7-11; v46 `handoff/` (entities, flows E and F, open decisions); `common/01` to `common/05`; V3 references `core.css`, `rb.css`, `rb-kit.css`, SA01/SA02/IA01/IA02 for patterns; Phase-6 and Phase-7 reports for the implemented interims (audience filtering, UPD-16, revision checks, scope withdrawal, PC-66); the completed role (18 Oct 2026) and checkpoint 1 (19 Oct 2026) as the baseline.
