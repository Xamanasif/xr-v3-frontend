# ROLE-STATUS — Content Manager · Design V3 Refined B

Readable summary of `ROLE-STATUS.json` (the machine file is the source of truth).

| | |
| --- | --- |
| Canvas | “XR V3 · Content Manager · Refined B”, version 20 (1792491048-0c95) · https://claude.ai/artifact/2rwpkY5FQ4covnJQ1JRVMr |
| Foundation | XR-V3-RB-1.0 — Design V3 · Refined Direction B |
| Live role entry | `project/Main.dc.html` — board “Content Manager · live role preview”, page “Live role preview”; opens on CM-01 Overview |
| Inspection boards | 85 |
| Sample world | SC-CM-MAIN, as of 2026-08-27 (Thursday); scenarios main, empty, blockers |

## Status

| | |
| --- | --- |
| Design | `DESIGN COMPLETE` — All nine owned IDs and every subview and state in one Refined B publishing-desk design; COVERAGE.md classifies each as REDESIGNED or REVIEWED AND UNCHANGED. |
| Connected preview | `CONNECTED PREVIEW COMPLETE` — Every in-role journey. Cross-role effects are scenario handoffs, by contract. |
| Shared surfaces | `ASSEMBLY PENDING XS` — Contract dependency status (common/04), not a design checkpoint: the borrowed XS surfaces are replaced one-for-one when the Shared Surfaces delivery arrives. |
| Owner acceptance | `OWNER VISUAL ACCEPTANCE PENDING` |
| Direction | Owner, 20 Oct 2026: satisfied with the refined Content Manager direction; the six anchor designs are the baseline for completing the role. This is not an acceptance of version 20. |
| Pending propagation | none |

## Owned screens

| ID | Screen | Kind | Route proposal (v46) | Redesign | Boards |
| --- | --- | --- | --- | --- | --- |
| CM-01 | Overview | page | `/content-manager` | REDESIGNED — version 16 (anchor), reviewed again in version 20 | 5 |
| CM-02 | Ready to publish | page | `/content-manager/ready` | REDESIGNED — version 16 (anchor), reviewed again in version 20; list loading and couldn’t-load states added | 9 |
| CM-03 | Publication decision | page | `/content-manager/decisions/[submissionId]` | REDESIGNED — version 16 (anchor), reviewed again in version 20; busy dialog behaviour corrected | 13 |
| CM-04 | Content library (all statuses incl. published) | page | `/content-manager/library` | REDESIGNED — version 16 (anchor), reviewed again in version 20; list loading and couldn’t-load states added | 10 |
| CM-05 | Published experiment | page | `/content-manager/published/[experimentId]` | REDESIGNED — version 20 | 7 |
| CM-06 | Edit catalogue details → correction (UPD) draft pre-filled with the live fields | step | `→ /content-manager/updates/[updateId] (draft, catalogue fields)` | REDESIGNED — version 20 | 3 |
| CM-07 | Edit a delivery link (with reason) → correction (UPD) draft pre-filled with the live delivery details | step | `→ /content-manager/updates/[updateId] (draft, delivery)` | REDESIGNED — version 20 | 2 |
| CM-08 | Corrections / updates I raised | page | `/content-manager/updates · /content-manager/updates/[updateId]` | REDESIGNED — list in version 16 (anchor), detail in version 20 | 18 |
| CM-09 | Platform course codes | page | `/content-manager/course-codes` | REDESIGNED — version 16 (anchor), reviewed again in version 20; list loading and couldn’t-load states added | 10 |

Excluded: CM-10 Academic groupings · Governance settings — not designed, not linked, no placeholder.

## States per screen

### CM-01 Overview

- Publishing pipeline: first publication (with the vendor → in academic review → ready to publish → in the catalogue) and corrections (draft or returned → in academic review → release decision → released), counted from the records; each stage opens its list; your stages in gold
- Needs your decision: Ready to publish (3, oldest first, “Publish next” on the first, checks and formats on each) and Corrections that need you (returned UPD-0006, the reviewer’s words quoted)
- With others, for information: on hold, re-check with the Academic Reviewer, awaiting the release decision
- In the catalogue: live experiments by course, each opening the library filtered to that course
- Calm: nothing waiting (scenario empty)

Evidence — RENDERED: 5 boards at frame size (CM01-Overview-1440, R-Overview-1024, R-Overview-768, R-Overview-375, L01-OverviewCalm-1440); its states in the 4-width sweep (1440 / 1024 / 768 / 375).

LOGIC TESTED: J1: live role entry; the pipeline count follows the publication; J3: Continue opens the returned correction; J5: Sign in returns to the Overview; refusal page offers one way back; J8: With others shows the re-check; link crawl: 29 controls from 1 starting state, all landed as intended.

### CM-02 Ready to publish

- decision cards, oldest first: days waiting, identity, the four publication checks and the next action; the longest wait marked and given the primary button
- newest first (visible sort; the longest wait stays marked)
- something to resolve: the failing check and “1 thing to resolve” on the card (scenario blockers)
- empty (scenario empty)
- a card leaves the list after Publish or Send back; badge follows
- loading: announced status and card skeleton; no figures
- couldn’t load: “Nothing has changed. Try again.”; Try again reloads and focuses the page title

Evidence — RENDERED: 9 boards at frame size (CM02-Ready-1440, R-Ready-1024, R-Ready-768, R-Ready-375, L02-ReadyEmpty-1440, L03-ReadyNewest-1440, L08-ReadyToResolve-1440, L11-ReadyLoading-1440, L12-ReadyNotLoaded-1440); its states in the 4-width sweep (1440 / 1024 / 768 / 375).

LOGIC TESTED: J1: three cards, the longest wait first and marked; Open decision opens CM-03; rail badge 3 → 2 after Publish; J6: sort oldest/newest, the longest wait stays marked; Send back removes it (badge 2); J4: cards show a changed platform code; link crawl: 10 controls from 1 starting state, all landed as intended; J11: loading and couldn’t load; Try again brings back the 3 cards with focus on the title; leaving and coming back reloads.

### CM-03 Publication decision

- open: identity band with the facts and the stage track (vendor → Academic Reviewer → you → catalogue); the publication check as a gate at the top with its verdict; catalogue preview, review summary, delivery per format, history
- no choice made → error summary with focus
- Send back to the Academic Reviewer (re-check) or to the vendor (revise and resubmit): recipient and reason required; field references offered only for the vendor
- Publish confirmation dialog: what happens now and later; publishing gives no one access
- published result with focus, View the public page
- sent-back results (reviewer, vendor)
- stale: published from another tab or window → refused, nothing changed, Show where it is now
- missing prerequisite (learning outcomes): Publish not offered, the fix named, Send back preselected and the button reads Send back (scenario blockers; v46 B6-11 state 5)
- read-only: in academic review, back with the Academic Reviewer, with the vendor
- publishing: Publishing… on the confirm button, disabled; Cancel and Escape wait; focus held in the dialog

Evidence — RENDERED: 13 boards at frame size (CM03-Decision-1440, R-Decision-1024, R-Decision-768, R-Decision-375, P01-Confirm-1440, P02-Prerequisite-1440, P03-DecisionErrors-1440, P04-SendVendor-1440, P05-SentReviewer-1440, P06-Published-1440, P07-Stale-1440, P08-InReview-1440, P09-WithVendor-1440); its states in the 4-width sweep (1440 / 1024 / 768 / 375).

LOGIC TESTED: J1: error summary and focus; dialog focus trap, Escape returns focus; confirm → result with focus; J5: stale refusal and re-read; missing prerequisite: Publish not offered, Send back preselected, sent back to the Academic Reviewer; J6: send back to the vendor with references → read-only page with the reason in history; J8: send back to the Academic Reviewer for a re-check → In review view, Overview, read-only page; link crawl: 25 controls from 3 starting states, all landed as intended; J10: Publishing… and Sending… while the command runs, buttons disabled; the dialog’s Cancel is disabled and Escape does nothing; focus stays in the dialog.

### CM-04 Content library (all statuses incl. published)

- figures: in the catalogue (across courses) and on the way (ready · in review · with a vendor)
- views Ready · In review · With vendor · Published with counts (V3 switch, aria-pressed); a line under the switch says who holds the items in that view
- rows grouped by course with the course code band and a count
- search, course filter, removable chips, Clear filters
- no match
- empty (scenario empty)
- an open correction on a published row shown as its own status chip
- loading: announced status and table skeleton; count, view counts and figures hidden
- couldn’t load: “Nothing has changed. Try again.”; Try again reloads and focuses the page title

Evidence — RENDERED: 10 boards at frame size (CM04-Library-1440, R-Library-1024, R-Library-768, R-Library-375, L04-LibraryReview-1440, L05-LibraryNoMatch-1440, L06-LibraryEmpty-1440, X02-Drawer-375, L09-LibraryLoading-1440, L10-LibraryNotLoaded-1440); its states in the 4-width sweep (1440 / 1024 / 768 / 375).

LOGIC TESTED: J1: Published count 13 after publishing; search count and chip; J4: the course band shows a changed platform code; J5: switch from the keyboard; course filter no-match; Clear filters; J6: With vendor view; chip removal returns focus to search; link crawl: 35 controls from 3 starting states, all landed as intended; J11: loading and couldn’t load; Try again brings back the 12 published rows with focus on the title.

### CM-05 Published experiment

- identity band: Published, the live version, the vendor; facts — course, live since, formats, corrections; when a correction is open, its status, version change and four stages (mini track)
- live catalogue entry read-only: summary, Available in, learning outcomes (set by the Academic Reviewer), formats and device needs; description and live version
- delivery: one card per format (web link and browser, or package, reference, device and install notes)
- history: versions and updates, newest first
- no open update: Start a correction · Edit catalogue details · Edit delivery link
- open draft or returned: the entries join it
- in review, awaiting release or on hold: only Open update (one open update)
- released today notice; back-from-correction notice
- View the public page (PU-06 handoff)

Evidence — RENDERED: 7 boards at frame size (CM05-Published-1440, R-Published-1024, R-Published-768, R-Published-375, C14-PubAwaiting-1440, C15-PubOnHold-1440, C16-PubReleased-1440); its states in the 4-width sweep (1440 / 1024 / 768 / 375).

LOGIC TESTED: J1: opens from the library; history says no one was given access; public handoff and back; J2: private edits do not leak into the live record; release shows 1.1 with both changes; J3: on hold keeps 1.0 live; release shows the corrected description; link crawl: 31 controls from 3 starting states, all landed as intended.

### CM-06 Edit catalogue details → correction (UPD) draft pre-filled with the live fields

- new draft pre-filled from live, focus on the summary, arrival notice
- joins an open draft or returned update, explained on arrival
- Changed tags on edited fields
- validation and save as CM-08 detail

Evidence — RENDERED: 3 boards at frame size (CM06-EditCatalogue-1440, C02-DraftErrors-1440, C03-DraftSaved-1440); its states in the 4-width sweep (1440 / 1024 / 768 / 375).

LOGIC TESTED: J2: creates UPD-0007; focus on the summary; entry confirmed; pre-filled; Changed tag; errors; save; revisit keeps edits; link crawl: the entry lands on the correction draft (CM-08 detail view, by design).

### CM-07 Edit a delivery link (with reason) → correction (UPD) draft pre-filled with the live delivery details

- new draft pre-filled with live delivery (web link and the package reference of each app format the experiment has), focus on the web link
- joins the open draft (“Your edit joins UPD-…”)
- reason required before sending

Evidence — RENDERED: 2 boards at frame size (CM07-EditDelivery-1440, C01-Joined-1440); its states in the 4-width sweep (1440 / 1024 / 768 / 375).

LOGIC TESTED: J2: joins the same update (no second update), join explained, focus on the web link; J6: Go to the web link moves focus to the field; link crawl: the entry lands on the correction draft (CM-08 detail view, by design).

### CM-08 Corrections / updates I raised

- list: correction tracker grouped by who must act (Need you · With others · Closed), each with its version change, status and four-stage track; closed corrections show their outcome; an unlabelled draft reads “1.0 live → No version label yet”; empty
- detail: identity band with the version change, the facts (live version, proposed, fields changed, started / sent / released / withdrawn) and the four stages with “Your step”; About this correction (reason and version label in one row), catalogue details, delivery (package references side by side), current and proposed, history; the side panel keeps the state and the actions
- detail: draft · returned (reason first) · validation errors with focus · saved · save failed (edits kept, Try again)
- send dialog · in academic review (read-only, Withdraw offered) · awaiting release decision · on hold (reason shown) · hold lifted · released (what changed)
- withdraw dialog (reason required) · withdrawn · stale withdraw (approved meanwhile → refused, re-read)
- list loading and couldn’t load (Try again)
- saving, sending and withdrawing: working label on the button, disabled; in the dialogs Cancel and Escape wait

Evidence — RENDERED: 18 boards at frame size (CM08-Updates-1440, CM08-UpdateDetail-1440, R-UpdateDetail-1024, R-UpdateDetail-768, R-UpdateDetail-375, C04-SaveFailed-1440, C05-SendDialog-1440, C06-InReview-1440, C07-Awaiting-1440, C08-OnHold-1440, C09-Lifted-1440, C10-Released-1440, C11-WithdrawDialog-1440, C12-Withdrawn-1440, C13-StaleWithdraw-1440, L07-UpdatesEmpty-1440, L13-UpdatesLoading-1440, L14-UpdatesNotLoaded-1440); its states in the 4-width sweep (1440 / 1024 / 768 / 375).

LOGIC TESTED: J2: send dialog focus; in review read-only; approved → awaiting; no Release in product UI; released; J3: returned reason first; resend; hold with reason; lift; release; J5: save failure keeps edits; withdraw needs a reason; stale withdraw refused and re-read; J6: returned again shows the new reason first; withdraw from returned; history keeps the reason; J7: unlabelled draft in the list; J9: send and withdraw dialogs — focus inside, Tab and Shift+Tab stay inside, Escape closes and returns focus, closing changes nothing; J2: a saved draft is listed under Need you and Continue opens it; J7: the unlabelled draft shows the live version and “No version label yet”; link crawl: 27 controls from 3 starting states, all landed as intended; J10: Saving…, Sending… and Withdrawing… while each runs; Cancel and Escape wait in the dialogs; J11: list loading and couldn’t load; Try again brings back the 4 corrections.

### CM-09 Platform course codes

- clean: courses grouped by engineering area, with the live experiments under each code; where a code appears; platform versus institution codes
- edited: Changed tags, unsaved count, Undo changes
- duplicate refused: summary and inline error, focus, error link to the field
- save failed: edits kept, Try again
- saved: applies wherever the code is shown
- saving: Saving… on the button and in the footer; Undo changes waits
- loading: announced status and table skeleton; no figures
- couldn’t load: “Nothing has changed. Try again.”; Try again reloads and focuses the page title

Evidence — RENDERED: 10 boards at frame size (CM09-CourseCodes-1440, R-CourseCodes-1024, R-CourseCodes-768, R-CourseCodes-375, K01-CodesEdited-1440, K02-CodesDuplicate-1440, K03-CodesFailed-1440, K04-CodesSaved-1440, K05-CodesLoading-1440, K06-CodesNotLoaded-1440); its states in the 4-width sweep (1440 / 1024 / 768 / 375).

LOGIC TESTED: J4: six courses in three engineering areas; duplicate refused with focus; valid code saves and appears in the library course band, published record, public frame and Ready cards; failed save keeps edits; J6: Undo changes restores the saved codes; link crawl: 6 controls from 1 starting state, all landed as intended; J10: Saving… on the button and in the footer; Undo changes waits; J11: loading and couldn’t load; Try again brings back the 6 courses.

## Shared and out of role

- Borrowed XS surfaces (`ASSEMBLY PENDING XS`, REVIEWED AND UNCHANGED (borrowed XS contract)): v46 shell (board 05) Skip to main content link; XS-05 Account menu: name, role, Help & support, Sign out; XS-07 Help & support: my reports, report a problem, report sent, report detail; XS-06 Not your workspace (v46 AR-10 message-page template); XS-03 Signed out.
- Handoff to PU-06 (PU) from CM-03 result and CM-05: View the public page: dashed handoff frame showing what the public page reads from the record; not a design of PU-06 · REVIEWED AND UNCHANGED — labelled handoff frame in the role’s catalogue-entry card.
- Handoff to XS-01 (XS) from XS-03 signed out: Sign in: returns to CM-01 Overview.
- Handoff to RV-03 (RV) from CM-03 Send back to the Academic Reviewer: result panel; the submission shows Back with the Academic Reviewer, read-only.
- Handoff to VE-07 / VE-08 (VE) from CM-03 Send back to the vendor: result panel; the submission shows With the vendor, read-only, reason and references kept.
- Handoff to RV-04 (RV) from CM-08 Send for academic review: Scenario handoff box: Academic Reviewer approves / returns it.
- Handoff to SA-11 (SA) from CM-08 awaiting release decision: Scenario handoff box: Super Admin releases it / puts it on hold / lifts the hold.

## Evidence summary

- **RENDERED** — 85 inspection boards at frame size from the canvas wrapper files: 80 page boards fit their frame exactly; 5 overlay boards (P01, C05, C11, X01, X02) are window-sized frames by design, with the page continuing under the overlay; on all 85: no horizontal overflow, no console error or warning, no failed request. Width sweep: 69 states × 1440/1024/768/375, full page (276 renders), and 5 overlays at 1440 and 375 (10 renders): no horizontal overflow, no console output, no failed request.
- **LOGIC TESTED** — 11 journeys, 243 scripted steps, 0 failed, and no console error or warning on any page they opened; link crawl 265 clicks from 24 starting states — 208 landed on the declared destination, 5 on the intended page under another ID (Edit catalogue details and Edit delivery link open the correction draft in CM-08; Sign in returns to CM-01), 52 correctly blocked by an open account menu or drawer, 0 failed.
- **SOURCE CHECKED** — base CSS byte-identical; no href="#"; every button has a handler; no tokens added; sample world identical to version 15 (record by record); cm.css selectors all match markup on a board or, where noted in CHECKS.md, in the live preview only; CM-10 absent; no Release or Hold in product UI; no checkpoint or propagation wording in the shipped files.
- **NOT TESTED** — the Claude Design host’s Play mode and board chrome; real screen readers; browsers other than Chromium; touch; 200 % zoom and forced colours.

Details: `CHECKS.md`; register: `COVERAGE.md`.
