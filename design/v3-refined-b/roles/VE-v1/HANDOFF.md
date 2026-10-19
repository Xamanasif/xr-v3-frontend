# Handoff · Vendor role (V3 Refined B · final)

> **Status: FINAL DESIGN · AWAITING OWNER ACCEPTANCE.** Do not start implementation from this package until the owner accepts it.

This file is for the integration owner. The design runs on sample data in a single preview root. The application keeps its real routes, commands, validation, optimistic revisions and repeat-press protection, and binds this design to them. Nothing here replaces a repository contract. Where a command name is unknown it is described, not named.

The refinement R1 patterns, accepted by the owner, now apply to all ten owned screens. Behaviour, permissions, validation and status wording are the same as in the accepted baseline. Only the presentation changed (§7).

## 1. Screens, states and allowed actions

| Screen | States | The Vendor can | The Vendor cannot |
| --- | --- | --- | --- |
| VE-01 Overview | studio band with four real counts (With you, In review, Published, and Read-only when there is one); returned item as the lead (ivory) with the reason in full and what it refers to; “your changes are saved, not resubmitted” on that lead; further returned items and drafts to finish; recent activity (five newest history entries); nothing waiting; no experiments (Create your first experiment) | create an experiment; revise the returned one; finish a draft; open a record from recent activity; open My experiments (all, or Changed in the last 7 days) | see other vendors; see notifications (none exist: OD-B5-12). The per-status links of the baseline are gone: the status tabs on My experiments do that job (R1 choice 2) |
| VE-02 My experiments | status tabs with counts (All, plus each status that has an experiment: Draft includes the read-only draft, Returned includes a Content Manager return, With Academic Reviewer includes a re-check); search (name, ID, course); Changed in the last 7 days; result count; Clear filters; visible sort by last change; no match; no experiments yet; loading; could not load with Try again; row tag “Changes saved, not resubmitted”; three-line cards below 760px | open a record; Revise (returned rows); Edit draft (draft rows); create | act on rows that are not theirs to change (no actions on submitted, decided or published rows) |
| VE-03…VE-06 Create (one editor) | steps 1–4 as titled sections on a six-column field grid; required errors with an error summary; unique name; withdrawn course; draft saved; format selector; one delivery block per chosen format with a live status (Complete / N still needed / N to fix); delivery errors; preview-link rule; documents added and removed, with an empty line; Check and submit with one review section per step, each with its status and a Change button; missing items with Go to; ready; confirmation; busy; outcome card | Save draft (needs a name); Continue (checks the step); Back; move between steps with the stepper or the aside outline; Change from the review; attach sample file names; Submit for academic review | choose a course that is not assigned; upload real files; publish |
| VE-09 Edit draft | the same editor at the saved step with the saved values; read-only when the course is withdrawn; refusal when it is no longer a draft | everything in Create | edit a draft in a withdrawn course |
| VE-07 Record | returned (by the Academic Reviewer or the Content Manager); draft; with Academic Reviewer; with Content Manager; re-check; published; read-only course; submitted (neutral); saved changes not resubmitted, stated inside the returned-reason panel with the changed fields. The status shows once, as the header pill and the notice. The Details sheet opens with a line saying which version is shown. “Where it stands” (formats, revision, dates) stays beside both tabs | read details and history; start Revise or Edit draft; follow a reference into the editor; ask for help | publish; propose an update; add formats to published material; change a published experiment |
| VE-08 Revise & resubmit | returned-reason panel above the editor, focused; references jump to the step and field; referenced fields tagged; changes kept between steps; changes saved privately; nothing changed since the submitted revision; neutral resubmit note and dialog; outcome card; refusals (already submitted, being reviewed, approved, published) | change any field (no course or format restriction is invented: OD-B5-06); Save changes; Resubmit | learn where the revision goes next |
| VE-13 History | timeline newest first, with the date at the right; “Newest first · not an audit log”; the private-changes note; “Where it stands” stays beside it | read it | see other roles' internal steps beyond the v46 Vendor wording |

**Leave without saving?** is a safeguard added in this design; v46 did not have it. It opens when unsaved editor changes would be lost, whether through the rail, the breadcrumbs or the reviewer jump. Keep editing keeps every value. Leave without saving goes to the chosen destination.

## 2. Status wording the Vendor sees

The status pill appears in the list, the record header and the editor header. The plain line under it appears in the list. The notice appears on the record. Who holds the experiment is part of the label or the line, so there is no separate “With” column or row (R1 choice 4). The Overview uses its own short labels: a kind (“Returned to you”, “Draft to finish”) and a line such as “By the Academic Reviewer on 24 Aug”.

| Internal state | Pill | Plain line (list) | Record notice |
| --- | --- | --- | --- |
| draft | Draft | Saved at step N of 4 · only you can see it | Draft — only you can see it · Finish it and submit it for academic review. |
| draft in a withdrawn course | Draft · read-only | Course withdrawn on <date> · read-only | <course> is no longer assigned to you · Withdrawn from <studio> on <date>. This draft is kept, read-only. BITS / WILP decides which courses are yours. |
| first submission with the Academic Reviewer | With Academic Reviewer | Submitted on <date> | With the Academic Reviewer · Nothing is needed from you now. You can edit it again only if it is returned to you. |
| **resubmitted revision (any return)** | **Submitted** | **Revision N · submitted on <date>** | **Submitted · Your changes have been submitted for review. Nothing is needed from you now.** |
| returned by the Academic Reviewer or the Content Manager | Returned | By the <role> on <date> | the returned-reason panel: who, when, the reason in their words, what it refers to |
| approved, with the Content Manager | With Content Manager | Approved on <date> | With the Content Manager · Approved by the Academic Reviewer on <date>. The Content Manager decides whether to publish it. Nothing is needed from you now. |
| back with the Academic Reviewer for a re-check (CM → AR, no Vendor action) | With Academic Reviewer | Back for a re-check | Back with the Academic Reviewer for a re-check · The Content Manager asked the Academic Reviewer to look at it again. Nothing is needed from you. |
| published | Published | Live in the catalogue since <date> | Published · <date> · It is live in the catalogue with the formats below. It is read-only here. |

**Accepted local route, neutral wording.** In the application, a resubmitted revision goes straight back to the Academic Reviewer (owner-approved). The Vendor is never told the next stage. The dialog, outcome, record, list, Overview and history all say “Submitted · revision N” until a reviewer decides.

v46's test-only “route” board control and its Vendor-facing “With Academic Reviewer · revision 2” label are retired. This includes the sample record SUB-0077 (Conduction Through a Composite Wall); see `SCENARIOS.json`. The preview explains the route only in its reviewer bar.

## 3. Privacy of a saved revision

Save changes on a returned experiment stores a **private pending revision**:

- The Vendor sees “Your changes are saved but not resubmitted” with the changed fields. On the record this sits inside the returned-reason panel. The list row is tagged “Changes saved, not resubmitted”.
- The Vendor's history says those changes are not part of the history until resubmitted.
- Every other role keeps seeing the submitted revision. Pending revision data must never appear in Academic Reviewer, Content Manager or Super Admin reads.
- Resubmit turns the pending revision into revision N+1 and clears it.

## 4. Command and data needs (describe → bind to existing names)

| Need | When | Result the UI expects |
| --- | --- | --- |
| list my submissions (assigned courses, plus read-only ones in withdrawn courses) | VE-01, VE-02 | id, name, course, formats, Vendor status, revision, the date and role behind the plain line (returned by and when, saved step, submitted, approved, published, withdrawn), last change, pending-revision flag |
| recent activity | VE-01 | the five newest Vendor-visible history entries across the Vendor's experiments (what, when, which experiment), leaving out “Created”. These come from existing history; no new events |
| get submission (Vendor view) | VE-07, VE-13, editor | fields (prototype set, T-29); delivery per format; preview; documents; outcomes (read-only); returned reason with structured references (OD-B5-10); history (Vendor wording); pending revision (Vendor only) |
| create draft / save draft | Save draft | submission ID on first save (OD-B5-07) and the saved time; a name is required to save |
| check name | Continue on step 1 | unique against the catalogue and the Vendor's own experiments, case-insensitive (OD-B5-04) |
| submit for academic review | Submit (dialog) | status With Academic Reviewer and a history entry; does not publish; protected against repeat presses |
| save revision (private) | Save changes | pending revision stored for the Vendor only, or “Nothing has changed since revision N was submitted” |
| resubmit revision | Resubmit (dialog) | revision N+1, Vendor status Submitted, history “Submitted · revision N”; routed by the accepted local route, which is not exposed |
| refusals | stale links | already submitted · being reviewed · approved · published · course withdrawn, using the existing safe refusal results |
| report a problem (XS) | Help & support | reference SUP-… (shared XS service) |

Validation messages are v46's exact copy (`Main.dc.html`, `e1`/`e2`/`e3`). For example:

- “Enter the web link for WEB”
- “Enter a web link that starts with https://”
- “Enter a package reference for AR, or attach the package file”
- “Add a preview link for “<label>”, or remove the label”

Delivery fields are current stand-ins only:

- a web link;
- a package label, with a reference or a sample file name;
- the device needed;
- install notes.

There is no upload, package processing or technical-assets setting (T-14 provisional, OD-B5-02, OD-B5-11). Each block's status counts only these required fields. Notes stay optional.

## 5. Open policies (safe treatment already designed; decide before production)

| Decision | Treatment in this design |
| --- | --- |
| OD-B5-05 / M-3: whether the Vendor may see the stage after a resubmit | Neutral “Submitted” everywhere, including SUB-0077. Showing the stage would be a wording change on the status map (§2) |
| OD-B5-09: the two Composite Wall records | Kept separate: “Composite Wall Conduction” (catalogue) and “Conduction Through a Composite Wall” (SUB-0077) |
| OD-B5-01: experiments in a withdrawn course | An unsaved new experiment shows the course error; a saved one opens read-only |
| OD-B5-02 / T-14: package fields | label, reference or file, device and install notes required; notes optional |
| OD-B5-03 / T-29: catalogue fields | course, name, one-sentence summary, description, version |
| OD-B5-04: unique-name scope | catalogue plus own experiments, case-insensitive |
| OD-B5-06: changing course or formats while revising | not restricted |
| OD-B5-07: when the ID is given | first save |
| OD-B5-08: preview link rules | a label without a valid link is an error; a link without a label is allowed |
| OD-B5-10: structured references on a return | shown as “What it refers to” chips that open the field in the editor |
| OD-B5-11: documents | sample file names only; nothing uploaded |
| OD-B5-12: telling the Vendor something changed | no notifications; the Overview (lead, counts, recent activity) and the record carry it |
| OD-B5-13: “Changed in the last 7 days” | 20–27 Aug 2026 window, a sample choice |
| LD-4: Vendor updates to published material (VE-10/11/12) | excluded; the published record says changes are not made here |

## 6. Shared surfaces (ASSEMBLY PENDING XS)

Account menu (XS-05), Help & support (XS-07) and “This page isn’t part of your workspace” (XS-06) are borrowed v46 behaviour drawn in V3 tokens. The Report a problem form uses the role's form layout (sections, field grid, actions row) so that it matches the editor. Sign out (XS-03) ends at a preview handoff note.

At assembly, point the account and Help controls at the XS deliverables. Keep the app's existing Help, account and navigation working throughout migration.

## 7. Changes from the v46 visual treatment

**Shell (unchanged since the baseline).** The V3 Refined B shell replaces the v46 shell:

- a 248px navy rail with the gold current marker;
- the reserved WILP logo slot;
- a top row with the date and account menu;
- a drawer below 1024px and phone chrome below 760px.

**The five R1 choices the owner accepted**, now applied role-wide:

1. Recent activity on the Overview, built from existing history.
2. Grouped Overview counts replace the per-status links. The list tabs filter by status.
3. Status tabs replace the status dropdown and the removable filter chips, with the same filter values.
4. The With column becomes part of the status line.
5. App-package guidance is written once, above the delivery blocks.

**Screen by screen.**

- **Overview (VE-01):** a studio band with four counts; the returned item leads with its reason in full and reference chips; drafts to finish; recent activity. On phones, the returned item and drafts come before the counts, so Revise is on the first screen.
- **My experiments (VE-02):** status tabs with counts and one tool row (search, 7-day filter, count, Clear filters, sort). The table has a status pill with one plain line and a single action column. Below 760px it becomes three-line cards with a labelled last-change date. There is no horizontal scroll at any width.
- **Editor (VE-03…VE-06, VE-08, VE-09):** one four-step component reused for create, edit draft and revise.
  - Every step is built from titled sections on a six-column field grid, which becomes one column below 620px.
  - Wide layouts have an aside outline that follows the step: the groups on step 1, the chosen formats on step 2, each with a live status. Narrow layouts have a top stepper.
  - Long forms have sticky actions: the saved message sits next to Back (Cancel on step 1), and the buttons stay right-aligned.
- **Formats and delivery (VE-04):** a compact format selector in the chip grammar. There is one block per chosen format, all built the same way: chip, name, kind and a live status. Attach file is a small button in the Package reference label row.
- **Preview and documents (VE-05):** two sections. Preview has the label and link side by side. Documents has Add document in its header and a dashed “No documents added.” line when the list is empty.
- **Check and submit (VE-06):** one review section per step with its status and a **Change** button. Delivery is shown in the same read-only blocks as the record. The “does not publish” note sits just above the actions row.
- **Outcomes (VE-06 and VE-08):** an outcome card with the result, status, time, formats, the next step and two actions.
- **Record and history (VE-07, VE-13):**
  - The returned reason is a panel with who and when, the reason in their words, and chips that open the field. A private revision is stated inside that panel.
  - Details is one sheet with a “which version is shown” line, and delivery appears in read-only blocks.
  - History rows have the date at the right.
  - “Where it stands” stays beside both tabs and no longer repeats the status.
- **Revise (VE-08):** the same returned-reason panel sits above the editor and takes focus first.
- **Read-only and refusal states:** they keep their kit notices and states. Read-only content uses the same sheet and blocks as the record.

**Kept from the baseline:** the Leave without saving? dialog; the busy state on Submit and Resubmit; the skip link from the v46 workspace shell, which the V3 kit lacks and which is proposed for the central kit.

**Removed:**

- v46's route board control and the “With Academic Reviewer · revision 2” Vendor label (§2);
- duplicate status rows (“Status”, “With”) in “Where it stands” and on the outcome;
- the “Submitted: Not yet” fact on drafts.

Decision IDs never appear in product copy.

## 8. Sources

- `ROLE-SCOPE.json` and these v46 boards:
  - B5-01 Overview
  - B5-02 My experiments
  - B5-03 Create (course and description)
  - B5-04 Formats and delivery
  - B5-05 Preview, check and submit
  - B5-06 Record and history
  - B5-07 Revise and resubmit
  - B5-08 Flow-5 continuity
  - B5-09 Responsive proof
- The v46 handoff files `open-decisions.json`, `entities.json` and `flows.json`.
- `common/01`–`05`, the pack's `FOUNDATION-LOCK.json`, and V3 `core.css`, `rb.css`, `rb-kit.css`, `SA02.dc.html` and `IA02.dc.html` as pattern references.
- The accepted Vendor baseline (18 Oct) and the accepted refinement checkpoint R1 (19 Oct), both superseded by this package.
