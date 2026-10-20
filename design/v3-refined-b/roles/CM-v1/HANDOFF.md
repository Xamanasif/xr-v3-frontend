# HANDOFF — Content Manager · Design V3 Refined B

For the Claude Code integration owner. The design runtime (`support.js`) and the preview store in `Main.dc.html` are design tools; the React app keeps its own routes, services and state. Route strings below are the historical v46 proposals, used for identification only. This package is the final role design (canvas version 20): every screen is in one Refined B publishing-desk design, and nothing in it is a checkpoint or waits for propagation.

## 1. Screens, entries and states

| ID | Preview view (`screen` prop) | Entered from | States designed |
| --- | --- | --- | --- |
| CM-01 Overview `/content-manager` | `overview` | rail; sign-in return; refusal page | publishing pipeline (first publication: with the vendor · in academic review · ready to publish · in the catalogue; corrections: draft or returned · in academic review · release decision · released — each stage opens its list) · decision desk (Ready to publish with “Publish next”, checks and formats · Corrections that need you with the reviewer’s words) · With others (re-checks, sent back, review, awaiting, hold) · in the catalogue by course · calm (nothing waiting) · counts follow publication |
| CM-02 Ready to publish `/content-manager/ready` | `ready` | rail (badge = count); Overview group link and pipeline stage | decision cards (days waiting, the four checks, Open decision; the longest wait marked) · oldest first / newest first · something to resolve · empty · **loading** · **couldn’t load** (Try again) |
| CM-03 Publication decision `/content-manager/decisions/[submissionId]` | `decision` + record | CM-02 cards, Overview rows, CM-04 rows | identity band with the submission’s stage track (vendor → Academic Reviewer → you → catalogue) · publication check as a gate at the top · open (choose) · choice error · send back to reviewer or vendor (reason required; references only for the vendor) · send-back errors · Publish confirmation dialog · **publishing busy** (the dialog’s Cancel and Escape wait) · published result · sent-back result · **stale** (published from another tab or window → refused, re-read) · **missing prerequisite** (Publish not offered, the fix named, Send back preselected and the button reads Send back — v46 B6-11 state 5) · read-only: in academic review / back with the reviewer / with the vendor |
| CM-04 Content library `/content-manager/library` | `library` | rail; Overview (pipeline stages, catalogue by course); results | figures (in the catalogue, on the way) · views Ready · In review · With vendor · Published (counts) with who holds them · rows grouped by course · search · course filter · chips · clear · no match · empty · an open correction on a published row as its own status · **loading** (count, view counts and figures hidden) · **couldn’t load** (Try again) |
| CM-05 Published experiment `/content-manager/published/[experimentId]` | `published` + record | CM-04 Published rows; published result; correction pages | identity band (course, live since, formats, corrections; the open correction’s status, version change and four stages) · live catalogue entry read-only (summary, formats, learning outcomes set by the Academic Reviewer, device needs, description, live version) · delivery, one card per format · history · no open update (three entries) · open draft or returned (entries join it) · in review / awaiting / on hold (only **Open update**) · released today notice · back-from-correction notice · **View the public page** |
| CM-06 Edit catalogue details (step) | from CM-05 | CM-05 Corrections panel | new draft pre-filled from the live record, focus on the summary · or joins the open draft/returned update, explained on arrival |
| CM-07 Edit a delivery link (step) | from CM-05 | CM-05 Corrections panel | new draft pre-filled with live delivery, focus on the web link · or joins; the reason is required before sending |
| CM-08 Updates `/content-manager/updates` · detail `/[updateId]` | `updates` · `update` + record | rail; Overview; CM-05 Open update; CM-06/07 | list grouped by who must act (Need you · With others · Closed), most recent change first, each with its version change and four-stage track; closed ones show their outcome · empty · **loading** · **couldn’t load** (Try again) · detail: identity band with the version change, facts and the four stages (“Your step” in gold) · draft · returned (reason first) · validation errors · saving · saved · save failed (edits kept) · send dialog (sending busy: Cancel and Escape wait) · in academic review (read-only, withdraw offered) · awaiting release · on hold (reason shown) · hold lifted · released (what changed) · withdraw dialog (reason required; withdrawing busy) · withdrawn (closed stages dashed) · **stale** (approved meanwhile → refused, re-read) |
| CM-09 Platform course codes `/content-manager/course-codes` | `codes` | rail | clean (grouped by engineering area, live experiments per code) · edited (unsaved count, Undo) · duplicate refused (summary + inline, focus) · saving (Undo waits) · save failed (edits kept, Try again) · saved · **loading** · **couldn’t load** (Try again) |

Shared, borrowed (XS owns them): the shell's Skip to main content link (v46 board 05), account menu (XS-05), Help & support with report flow (XS-07), signed out (XS-03), not your workspace (XS-06, built on the v46 AR-10 message-page template). Handoffs out of role: PU-06 public experiment page, XS-01 sign-in, RV-04 review an update, SA-11 release or hold (reached from the SA-10 queue); a submission sent back goes to RV-03 (re-check) or VE-07 / VE-08 (revise and resubmit).

Inspection-board presets used for states the live preview reaches only through another role or a failure: `load:<view>` and `fail:<view>` (list reads), `savefail`, `codes-fail`, `stale`, `stale-wd`, and the `rv-*` / `sa-*` handoff steps. They are design controls, not product parameters.

## 2. Allowed actions

| Action | Who / when | Effect | Refused when |
| --- | --- | --- | --- |
| Publish submission | Content Manager; submission approved and all four checks met | Listed in the public catalogue under its course with **all** its formats; vendor and reviewer see it Published (read-only); later changes go through corrections; **no institution or student access changes** | a check is not met (Publish not offered; Send back preselected); the submission changed elsewhere (stale → re-read) |
| Send back | approved submission | to the Academic Reviewer (re-check, reason) or to the vendor (reason + optional field references); leaves Ready to publish | reason or recipient missing |
| Start / join a correction | published experiment without an update in review, awaiting or on hold | one draft (UPD) pre-filled from live: name, summary, description, web link, package reference of each app format the experiment already has | an update is in review / awaiting / on hold → only *Open update* (OD-B6-07) |
| Save draft | draft or returned update | saved privately; **live record unchanged** | save failure → message, edits kept |
| Send for academic review | draft or returned | read-only for the CM, with the reviewer; live unchanged | no reason, no version label, version equals live, nothing changed |
| Withdraw | draft, returned or in academic review (OD-B6-06) | closed with a reason kept in the update’s history; live unchanged | no reason; approved meanwhile (stale) |
| Save course codes | Content Manager only (OD-B6-13) | applies at once wherever the platform code is shown | duplicate code (ignoring case and spaces); save failure keeps edits |
| Report a problem | XS-07 borrowed | report with a reference (SUP-0186 in the sample) | nothing described |

While any of these runs, the button that started it shows its working label and is disabled; in a dialog, Cancel and Escape wait for the result. A command once sent is not taken back by closing its dialog — the integration should keep that rule with the real command (repeated-command protection).

*Try again* on a list that couldn’t load re-reads that list; it changes nothing.

Not available to the Content Manager, by design: Release, Hold, Lift hold, approve or return (other roles); direct edits to the live catalogue; publishing some formats only; giving access to institutions or students.

## 3. Commands and read models needed

The React repository is not in this pack, so names are **proposals** to match against existing services:

- Reads: `CmOverview` (ready list with checks met, corrections needing the CM, with-others list, pipeline counts per stage for both lifecycles, published count per course) · `ReadyToPublishList` (approval date for the waiting time, the four checks per item) · `PublicationDecision` (submission, catalogue preview, checks[], review summary, delivery per format, history, the dates of each stage) · `ContentLibrary` (four sets with counts, course of each row; filters search/course; open-correction state on published rows) · `PublishedExperiment` (live fields, formats, outcomes, delivery, history, open update summary with its stage dates) · `CorrectionList` (state, version change, sent / approved / returned / held / released dates and who, return or hold reason) · `Correction` (fields, live values, changed set, status, history, return/hold reasons) · `PlatformCourseCodes` (engineering area and published-experiment count per course).
- Commands: `PublishSubmission(submissionId, expectedVersion)` · `SendBackSubmission(submissionId, to, reason, fieldRefs[])` · `StartOrJoinCorrection(experimentId, entry)` · `SaveCorrectionDraft(updateId, fields, expectedVersion)` · `SendCorrectionForReview(updateId, expectedVersion)` · `WithdrawCorrection(updateId, reason, expectedVersion)` · `SavePlatformCourseCodes(rows[], expectedVersion)`.
- Every write carries an `expectedVersion` (or equivalent) so the stale refusals in the design can happen: the preview models them with an “unseen external change” queue.
- The four list reads (Ready to publish, Content library, Updates, Course codes) each need a pending and a failed outcome for the loading and couldn’t-load states.

## 4. Open policies and integration decisions

| Decision | What the design does |
| --- | --- |
| Several Content Managers (scope policy unresolved) | Single-manager scope as today: no ownership filter, no “assigned to”. Stale copy says “from another tab or window”, not “by another manager”. |
| OD-B6-09 — what a correction may change | Name, summary, description, web link, package references. Learning outcomes are not in the draft. Package reference is offered for **each** app format the experiment already has (v46 showed the VR one on a WEB + VR experiment); no format can be added or removed. |
| OD-B6-08 — version label | Required and different from live; no format rule. |
| OD-B6-06 / OD-B6-07 — withdraw and join | As designed in v46 (withdraw in draft/returned/review; join only draft/returned). |
| OD-B6-13 — changing a platform code | Saved directly by the CM, applies at once; institution codes untouched; notifications or review not designed. |
| OD-B7-01 — hold reason | Shown to the CM on the update and the published record. |
| OD-B7-04 — what a hold blocks | Not designed: a held update keeps the experiment “in progress”, so no second correction can start (one open update rule). Whether it should block more is open. |
| OD-B7-05 — is the version public | The PU-06 handoff frame shows the live version label (for example “version 1.2”), as the v46 reference frames do. Whether the public page shows it stays a Public-workstream decision. |
| OD-B5-09 / OD-B6-12 — sample names and timing | “Conduction Through a Composite Wall” (SUB-0077) and the published “Composite Wall Conduction” are kept as two separate sample records; in this preview SUB-0077 is published on 27 Aug, not 28 Aug. No duplicate rule invented. |
| Withdrawal reason audience | v46 copy said “The Academic Reviewer sees your reason”; the later audience rule (withdrawal and hold reasons are not shown to the reviewer) wins, so the dialog says “Kept in this update’s history”. |
| Loading on the Overview and record pages | Designed for the four list reads only, as on the SA-02 and IA-02 seeds. CM-01, CM-03, CM-05 and the CM-08 detail have no separate loading or couldn’t-load design, as on the SA-01 and SA-03 seeds: integrate them with the application’s existing page loading and keep the shell in place. |

## 5. Changes from the v46 visual treatment

- Rebuilt in the V3 Refined B shell and kit: navy rail with gold current marker, V3 tables with container-query layouts, decision panel, status grammar, format badges.
- Library categories use the V3 switch (`rb-switch`) instead of tabs; the pressed view stays visible on phones.
- Overview shows the publishing pipeline instead of loose figures: eight counts, each computed from the records and each a link to the list that holds those items; no decorative KPIs.
- Publishing-desk redesign, complete across the role (versions 16 and 20): decision cards on Ready to publish; a stage track on the decision page, the Updates list, the published record and the correction detail; identity bands with the record's facts on CM-03, CM-05 and CM-08; the library and course codes grouped as the catalogue is; delivery cards per format on the published record; list loading and couldn’t-load states. `COVERAGE.md` classifies every screen and state; behaviour, permissions and data are unchanged.
- Correction pages: stable title “Update to *experiment*”; arrival notice for CM-06/CM-07 entries and for joins; “Last saved” row; comparison shows changed fields only.
- No internal decision IDs in product copy. Submission and update IDs (SUB-, UPD-) stay visible in this role, as in v46; the Super Admin ID-hiding decision was not extended.

## 6. Sources

Owner pack `XR-V3-Content-Manager-Reference-Pack.zip` (identical copy re-sent on 18 Oct 2026): `common/01–05`, `FOUNDATION-LOCK.json`, `ROLE-SCOPE.*`, v46 boards B6-03…B6-15 and B7-11 with `handoff/*.json`, V3 `references/v3/*` (SA01, SA02, IA01, IA02, their handoff and the three CSS files). The owner's full-role visual redesign brief and final role completion brief (20 Oct 2026).
