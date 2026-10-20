# Coverage — Content Manager · final role design

Canvas “XR V3 · Content Manager · Refined B”, version 20. Every owned screen (CM-01 to CM-09), every subview and every state the role designs, each with one of two statuses:

- **REDESIGNED** — built in the Refined B publishing-desk design and checked at 1440, 1024, 768 and 375. The six anchors were redesigned in version 16; the rest of the role in version 20.
- **REVIEWED AND UNCHANGED** — looked at again in version 20 against the same bar and kept as it is: kit patterns, the borrowed shared surfaces (XS) and the PU-06 handoff frame.

No screen or state is waiting for propagation. On 20 Oct 2026 the owner confirmed the refined direction and asked to keep the six anchor designs as the baseline; this register does not record acceptance of version 20, which is the owner's to give.

Version numbers are the canvas service's own (version 20 is id `1792491048-0c95`). The role's files last changed in version 16; the version just before 20 (`1792484313-74a5`) still held them unchanged.

Board names are the canvas inspection boards (`project/*.dc.html`). “Sweep” names are the extra states rendered at all four widths (`checks/results/sweep-*.json`).

## CM-01 Overview

| Subview or state | Boards · sweep | Status | Version |
| --- | --- | --- | --- |
| Publishing pipeline (both lifecycles, each stage a link to its list), decision desk, with others, catalogue by course | CM01 · R-Overview 1024 / 768 / 375 | REDESIGNED | 16 (anchor) |
| Calm: nothing waiting | L01 · sweep 14-empty-overview | REDESIGNED | 16 |
| Something to resolve (blocked submission) | sweep 02c-overview-blocked | REDESIGNED | 16 |
| Loading | — no separate state, as on the SA-01 seed; see HANDOFF §4 | REVIEWED AND UNCHANGED | 20 |

## CM-02 Ready to publish

| Subview or state | Boards · sweep | Status | Version |
| --- | --- | --- | --- |
| Decision cards, oldest first, the longest wait marked | CM02 · R-Ready 1024 / 768 / 375 | REDESIGNED | 16 (anchor) |
| Newest first | L03 · sweep 02d-ready-newest | REDESIGNED | 16 |
| Something to resolve | L08 · sweep 02b-ready-blocked | REDESIGNED | 16 |
| Empty | L02 · sweep 14b-empty-ready | REDESIGNED | 16 |
| Loading | L11 · sweep ls-ready-loading | REDESIGNED (added) | 20 |
| Couldn’t load, Try again | L12 · sweep ls-ready-failed | REDESIGNED (added) | 20 |

## CM-03 Publication decision

| Subview or state | Boards · sweep | Status | Version |
| --- | --- | --- | --- |
| Open: identity band with the stage track, publication check as a gate, preview, delivery, review summary, history, decision panel | CM03 · R-Decision 1024 / 768 / 375 | REDESIGNED | 16 (anchor) |
| Missing prerequisite (Publish not offered, Send back preselected) | P02 · sweep 03c-blocked | REDESIGNED | 16 |
| Send back incomplete (both errors at once) | P03 · sweep 03g-send-errors | REDESIGNED | 16 |
| Send back to the vendor, filled in, with field references | P04 · sweep 03d-sendback | REDESIGNED | 16 |
| Sent back to the Academic Reviewer (result) | P05 · sweep 03h-sent-rv | REDESIGNED | 16 |
| Published (result) | P06 · sweep 03e-done | REDESIGNED | 16 |
| Out of date (published elsewhere) | P07 · sweep 03f-stale | REDESIGNED | 16 |
| Read-only: in academic review · with the vendor | P08, P09 · sweep 03i-ro-review, 03j-ro-vendor | REDESIGNED | 16 |
| Publish confirmation dialog | P01 · overlays at 1440 and 375 | REVIEWED AND UNCHANGED (kit dialog) | 20 — while it publishes, Cancel and Escape now wait |
| Busy: Publishing… · Sending… | journey J10 | REVIEWED AND UNCHANGED | 20 |

## CM-04 Content library

| Subview or state | Boards · sweep | Status | Version |
| --- | --- | --- | --- |
| Published view: figures, view switch, course bands, open correction as its own chip | CM04 · R-Library 1024 / 768 / 375 · sweep 04b-lib-pub | REDESIGNED | 16 (anchor) |
| Ready view | sweep 04-library | REDESIGNED | 16 |
| In review view | L04 · sweep 04d-lib-review | REDESIGNED | 16 |
| With vendor view | sweep 04e-lib-vendor | REDESIGNED | 16 |
| No match, Clear filters | L05 · sweep 04c-lib-nomatch | REDESIGNED | 16 |
| Empty | L06 · sweep 14c-empty-library | REDESIGNED | 16 |
| Loading (count and figures hidden) | L09 · sweep ls-lib-loading | REDESIGNED (added) | 20 |
| Couldn’t load, Try again | L10 · sweep ls-lib-failed | REDESIGNED (added) | 20 |

## CM-05 Published experiment

| Subview or state | Boards · sweep | Status | Version |
| --- | --- | --- | --- |
| Live record, no open correction: identity band (course, live since, formats, corrections), catalogue entry, delivery cards, history, Corrections panel | CM05 · sweep 05b-pub-e2 | REDESIGNED | 20 |
| Open correction shown in the band with its stage track | R-Published 1024 / 768 / 375 · sweep 05-pub-e10 | REDESIGNED | 20 |
| Draft or returned correction open: edits join it | C01 · sweep 05c-pub-e6, 07b-join-del | REDESIGNED | 20 |
| Update awaiting release · on hold (only Open update) | C14, C15 · sweep 05d-pub-e11 | REDESIGNED | 20 |
| Released today notice | C16 · sweep 05e-pub-released | REDESIGNED | 20 |
| Back from an open correction notice | sweep 05f-pub-back · in Play: Back to the published experiment | REDESIGNED | 20 |
| View the public page | handoff to PU-06, see below | REDESIGNED | 20 |

## CM-06 Edit catalogue details (step into the correction draft)

| Subview or state | Boards · sweep | Status | Version |
| --- | --- | --- | --- |
| New draft from Edit catalogue details, focus on the summary | CM06 · sweep 06-new-cat | REDESIGNED | 20 |
| Send refused with errors | C02 · sweep 06b-draft-errors | REDESIGNED | 20 |
| Draft saved | C03 · sweep 06c-draft-saved | REDESIGNED | 20 |

## CM-07 Edit a delivery link (step into the correction draft)

| Subview or state | Boards · sweep | Status | Version |
| --- | --- | --- | --- |
| New draft from Edit delivery link, focus on the web link | CM07 · sweep 07-new-del | REDESIGNED | 20 |
| Joins the open correction | C01 · sweep 07b-join-del | REDESIGNED | 20 |

## CM-08 Updates and the correction detail

| Subview or state | Boards · sweep | Status | Version |
| --- | --- | --- | --- |
| List grouped by who must act (Need you · With others · Closed), each with its version change and stage track | CM08-Updates · sweep 08-updates | REDESIGNED | 16 (anchor) |
| List empty | L07 · sweep 14d-empty-updates | REDESIGNED | 16 |
| List loading | L13 · sweep ls-upd-loading | REDESIGNED (added) | 20 |
| List couldn’t load, Try again | L14 · sweep ls-upd-failed | REDESIGNED (added) | 20 |
| Detail returned to you (reason first) | CM08-UpdateDetail · R-UpdateDetail 1024 / 768 / 375 · sweep 08b-upd-returned | REDESIGNED | 20 |
| Save failed (edits kept) | C04 · sweep 08g-upd-savefail | REDESIGNED | 20 |
| In academic review (read-only, Withdraw offered) | C06 · sweep 08h-upd-inreview | REDESIGNED | 20 |
| Awaiting release decision | C07 · sweep 08c-upd-awaiting | REDESIGNED | 20 |
| On hold (reason shown) · hold lifted | C08, C09 · sweep 08d-upd-hold, 08i-upd-lifted | REDESIGNED | 20 |
| Released (what changed) | C10 · sweep 08e-upd-released | REDESIGNED | 20 |
| Withdrawn (closed stages shown dashed) | C12 · sweep 08k-upd-withdrawn-detail, 08f-upd-withdrawn | REDESIGNED | 20 |
| Withdraw refused, approved meanwhile | C13 · sweep 08j-upd-stale-wd | REDESIGNED | 20 |
| Send for academic review dialog · Withdraw dialog (reason required) | C05, C11 · overlays at 1440 and 375 | REVIEWED AND UNCHANGED (kit dialog) | 20 — while sending or withdrawing, Cancel and Escape now wait |
| Busy: Saving… · Sending… · Withdrawing… | journey J10 | REVIEWED AND UNCHANGED | 20 |

## CM-09 Platform course codes

| Subview or state | Boards · sweep | Status | Version |
| --- | --- | --- | --- |
| Courses by engineering area, live experiments per code, side panels | CM09 · R-CourseCodes 1024 / 768 / 375 · sweep 09-codes | REDESIGNED | 16 (anchor) |
| Unsaved change, Undo | K01 · sweep 09c-codes-edit | REDESIGNED | 16 |
| Duplicate refused | K02 · sweep 09b-codes-dup | REDESIGNED | 16 |
| Save failed (edits kept) | K03 · sweep 09d-codes-fail | REDESIGNED | 16 |
| Saved | K04 · sweep 09e-codes-saved | REDESIGNED | 16 |
| Empty sample world (no live experiments) | sweep 14e-empty-codes | REDESIGNED | 16 |
| Loading | K05 · sweep ls-codes-loading | REDESIGNED (added) | 20 |
| Couldn’t load, Try again | K06 · sweep ls-codes-failed | REDESIGNED (added) | 20 |
| Busy: Saving… (Undo waits) | journey J10 | REVIEWED AND UNCHANGED | 20 |

## Handoff, shell and shared surfaces

| Surface | Boards · sweep | Status | Notes |
| --- | --- | --- | --- |
| PU-06 public page — handoff frame | P10 · sweep 11-public | REVIEWED AND UNCHANGED | A labelled handoff showing what the public page reads from the record, in the role’s catalogue-entry card. The Public workstream owns PU-06. |
| Scenario handoff box (preview only) | live preview | REVIEWED AND UNCHANGED | Stands in for RV-04 and SA-11 decisions; never product UI; hidden on boards. |
| Shell: rail, gold marker, count badge, top bar | every board | REVIEWED AND UNCHANGED | Kit shell, unchanged. |
| Navigation drawer below 1024 px | X02 · overlays at 1440 and 375 | REVIEWED AND UNCHANGED | Kit drawer. |
| Skip to main content | journey J9 | REVIEWED AND UNCHANGED (borrowed XS) | |
| XS-05 Account menu | X01 | REVIEWED AND UNCHANGED (borrowed XS) | |
| XS-07 Help & support: my reports, report a problem, sent, detail | X03, X04, X05, X06 · sweep 10-help, 10b-report, 10c–10e, 14f-empty-help | REVIEWED AND UNCHANGED (borrowed XS) | |
| XS-06 Not your workspace | X07 · sweep 12-refusal | REVIEWED AND UNCHANGED (borrowed XS) | |
| XS-03 Signed out | X08 · sweep 13-signedout | REVIEWED AND UNCHANGED (borrowed XS) | |

## What changed in version 20

1. **CM-05 Published experiment** now uses the anchors’ identity band: the live version, course, live-since date, formats and corrections as facts, and — when a correction is open — its four-stage track. The catalogue entry says who sets the learning outcomes; delivery is one card per format; the Corrections panel keeps its behaviour.
2. **CM-06, CM-07 and the CM-08 correction detail** use the same band with the version change and the four stages (“Your step” in gold). The form gives the reason and the version label one row, the package references side by side, and the comparison and history below; the side panel keeps only the state and the actions. A withdrawn correction shows its closed stages dashed.
3. **Band details**: on the published record and the correction detail the action stays at the top right when the status line is long; on a phone the first and last facts take the full width.
4. **List states**: Ready to publish, Content library, Updates and Course codes gain the kit’s loading and couldn’t-load states (announced status and skeleton; “Nothing has changed. Try again.”).
5. **Busy commands**: while Publish, Send for academic review or Withdraw runs, the dialog’s Cancel and Escape wait and focus stays in the dialog; Undo changes waits while codes save.

Routes, permissions, decisions, course-code ownership, the publication and correction workflows and the sample world are unchanged: the world inside `Main.dc.html` was compared with the version-15 world and is identical, and every earlier journey runs on the final markup.
