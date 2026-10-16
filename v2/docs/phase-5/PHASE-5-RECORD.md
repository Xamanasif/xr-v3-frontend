# Phase 5 — record (first publication: Vendor, Academic Reviewer, Content Manager)

|                  |                                                                                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorisation    | Owner, 16 Oct 2026 — "Phase 5 Authorization — Accelerated Content Production and First Publication" (the 21 Phase-5 ids of the frozen register)                                     |
| Base             | `253aa42` (Phase 4B) on `v2/frontend-v46`; safety bundle `~/Downloads/XR-frontend-v46-253aa42-phase5-pre.bundle` (+ `.sha256`; `git bundle verify` OK, restore-tested to `253aa42`) |
| Design authority | `design/handoff-v46/` (frozen, 178/178): B5-01 … B5-08, B6-01 … B6-03, B6-05 … B6-08, B6-10 … B6-12; boards 05 / 06 / 07                                                            |
| Owner decision   | **P5-01 / M-3 / OD-B5-05 (asked in session, 16 Oct 2026): "Drawn-default stand-in"** — §4                                                                                           |
| Verdict          | see §9                                                                                                                                                                              |

## 1 · Screens — the 21 Phase-5 ids (108 of 123 designed ids built)

The frozen register (`SCREEN_PHASE` P5, `handoff/screens.json`) holds exactly these 21 ids; no
inventory discrepancy.

| Id    | Screen                                | Route                                                                           | Board / frames                     |
| ----- | ------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------- |
| VE-01 | Overview (Vendor home)                | `/vendor`                                                                       | B5-01 f0 … f3; B5-08 f1            |
| VE-02 | My experiments                        | `/vendor/experiments` (`?status=`)                                              | B5-02 f0 … f5; B5-08 f3            |
| VE-03 | Create experiment · Course and descr. | `/vendor/experiments/new`                                                       | B5-03 f0 … f6                      |
| VE-04 | Formats and delivery (step 2)         | `…/new?step=formats` · `…/[submissionId]/edit?step=formats`                     | B5-04 f0 … f6                      |
| VE-05 | Preview and documents (step 3)        | `…?step=preview`                                                                | B5-05 f3, f4                       |
| VE-06 | Check and submit (step 4)             | `…?step=submit`                                                                 | B5-05 f0 … f2, f5, f6              |
| VE-07 | Experiment record                     | `/vendor/experiments/[submissionId]`                                            | B5-06 f0 … f10; B5-08 f2; B6-12 f4 |
| VE-08 | Revise and resubmit                   | `/vendor/experiments/[submissionId]/revise` (`?step=`)                          | B5-07 f0 … f4, f6 … f8             |
| VE-09 | Edit draft                            | `/vendor/experiments/[submissionId]/edit` (`?step=`)                            | B5-07 f5                           |
| VE-13 | History                               | `/vendor/experiments/[submissionId]?tab=history` (the record's timeline)        | B5-06; B5-02                       |
| RV-01 | Overview (Academic Reviewer home)     | `/reviewer`                                                                     | B6-01 f0 … f2                      |
| RV-02 | Review queue                          | `/reviewer/queue` (`?type=`)                                                    | B6-02 f0, f2 … f5; B6-11 f13, f14  |
| RV-03 | Review a submission                   | `/reviewer/submissions/[submissionId]`                                          | B6-03 f0 … f3, f5; B6-11 f0 … f3   |
| RV-05 | Reviewed by me                        | `/reviewer/reviewed`                                                            | B6-02 f1                           |
| RV-06 | Review — decided, read-only           | the RV-03 page once decided                                                     | B6-03 f4; B6-12 f1                 |
| CM-01 | Overview (Content Manager home)       | `/content-manager`                                                              | B6-05 f0 … f2                      |
| CM-02 | Ready to publish                      | `/content-manager/ready`                                                        | B6-06 f0, f2, f3; B6-12 f2         |
| CM-03 | Publication decision                  | `/content-manager/decisions/[submissionId]`                                     | B6-07 f0 … f5; B6-11 f4 … f8       |
| CM-04 | Content library                       | `/content-manager/library` (`?tab=ready · in-review · with-vendor · published`) | B6-06 f1, f4                       |
| CM-05 | Published experiment                  | `/content-manager/published/[experimentId]`                                     | B6-08 f0 … f2, f4; B6-11 f9        |
| CM-09 | Course codes                          | `/content-manager/course-codes`                                                 | B6-10 f0 … f2; B6-11 f12           |

The three platform homes replace the interim landing: no `/<base>` lands on Help any more. The
sidebars list every built destination — the Vendor's and the Academic Reviewer's are complete; the
Content Manager's lists all but Updates (CM-08, Phase 6). Counts: "{n} waiting for review" (the
RV-02 items) and "{n} ready to publish" (the CM-02 rows). Not built: CM-05's correction entry and
every action that opens a Phase-6 screen (RV-04 Review an update, CM-06 … CM-08) — their rows show
their words without the action (built-screen-only navigation, P0-35; DEV-21). CM-05 is completed in
Phase 6.

Built by seven parallel builders (Workstream A: VE-01/02, the editor VE-03 … VE-06/08/09, VE-07/13,
RV-01/02/05, RV-03/06; Workstream B: CM-01/02/04/09, CM-03/05) with strict file ownership on
lead-made services, routes, queries, navigation and registers.

## 2 · Services and contracts

- **Delivered (`PACKAGE_DELIVERIES` Phase 5)**: `ProductionService.getVendorOverview`,
  `listMyExperiments`, `getEditor`, `getReviewerOverview`, `getContentManagerOverview`,
  `getLibrary`, `PlatformCourseCodeService.list` — every Phase-5 method; 9 methods stay deferred to
  Phase 6. The submission commands (save, continue, submit, return, revise, resubmit, approve,
  publish, send back, course codes) were WP-0.11 methods and are used as they were.
- **Facts, not words** (provisional register): **PC-62** VE-01 attention (returned with who / when
  / reason, then drafts; `hasExperiments`); **PC-63** RV-01 scope line as codes and the queue's own
  items with the re-check reason; **PC-64** CM-01 attention (ready to publish, corrections returned)
  and "with others"; **PC-65** CM-04 tab counts and rows (a submission's record or a published
  experiment with its open correction's state).
- **PC-66 (owner-approved interim)** — the M-3 drawn-default routing stand-in (§4).
- Who may call: the Vendor reads only their own records (a colleague's is `policy-open` SUB-15;
  `vendorCourses` keeps ROLE-11 open); drafts are the Vendor's only (CM and AR never list them);
  the reviewer, CM and course-code reads refuse every other workspace.
- Fixes found in integration: CM-03's catalogue preview of a published submission names its real
  experiment id.
- Tests: `sample-platform` `production-5.test.ts` (8): the seven reads on the product world and
  Flow E on the product ports with and without the stand-in (publish writes the submission and the
  experiment only; access plans and Student grants unchanged).

## 3 · Flow E on the product build (`e2e/phase-5/demonstration.spec.ts`, one tab, 4 widths)

0. The public request → Super Admin approval → payment stand-in → access active → Meera Iyer
   assigned; Meera adds Rahul Verma and gives him Shell-and-Tube Heat Exchanger. The catalogue lists
   "Composite Wall Conduction" only.
1. Anil Shetty (Vendor): Overview → Create experiment → course ME ZG523, name "Conduction Through a
   Composite Wall", summary, description, version → Save draft ("SUB-0077 · draft") → formats WEB +
   VR with the web link, browser, package label / reference, device, install notes → preview and
   documents → Check and submit "Everything required is provided".
2. Submit for academic review → DL-1 ("It does not publish anything") → "Submitted for academic review".
3. Prof. A. Menon (Academic Reviewer): Review queue → Review → Return to vendor → DL-2 with a reason
   and the reference "Formats & delivery · VR · Device need".
4. Anil: Overview "Revise “Conduction Through a Composite Wall”" → the reason above the editor → the
   reference opens the VR device need (focused) → revise → Save changes → Resubmit → DL-1 →
   "Submitted" (the next gate never named).
5. Prof. A. Menon: the queue holds it as "Resubmitted · revision 2" (the stand-in, PC-66); "What
   changed in revision 2" shows the new device need; he adds three learning outcomes and approves
   → DL-1 ("Approving does not publish it") → "Approved — with the Content Manager". The public
   catalogue still does not list it.
6. Kavya Nair (Content Manager): Ready to publish → Open decision → Publish → DL-1 ("Publishing
   gives no one access") → "Published · Publishing gave no one access."
7. View in the catalogue → PU-06 with the reviewer's outcomes → the course page (PU-05) and the
   catalogue (PU-04) list it beside "Composite Wall Conduction" (two records, BC11).
8. Meera's Content access and Give access (IA-02, IA-05) and Rahul's My courses do not offer it:
   publication, institution access and Student access stay separate (BC9).

Every step by a link or button, one document throughout, no test hook; 4 of 4 widths pass.

## 4 · Policy handling

| Rule / open decision       | What the build does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **P5-01 / M-3 / OD-B5-05** | **Owner answer (16 Oct 2026): drawn-default stand-in.** Local prototype build only (composition root `resubmissionRouting: 'drawn-default-on-resubmit'`): right after a resubmit the sample `system:workflow-routing` stand-in routes the record by the only route the domain's routing policy can answer — back to the Academic Reviewer as revision n (`routeResubmission`). The Vendor still reads "Submitted" (B5-06 f4); no copy names the next gate; nothing skips the reviewer. Other builds and the tests keep the test-only seam. PC-66 |
| BC7 first publication      | Vendor → Academic Reviewer → Content Manager → Published; only the CM publishes, through DL-1; submit, approve and return publish nothing                                                                                                                                                                                                                                                                                                                                                                                                        |
| BC9                        | Publishing writes the submission and the experiment only; no plan, licence, grant or person changes (unit and browser tests compare every institution's plans and grants before and after)                                                                                                                                                                                                                                                                                                                                                       |
| LD-3 / OD-B6-02 / OD-B6-04 | Learning outcomes are the reviewer's; Approve needs at least one; the set travels with the decision                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| OD-B5-01                   | A record whose course is no longer assigned opens read-only ("What you entered")                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| OD-B5-10 / OD-B6-05        | Return references (step · format · field) on the AR return and the CM send-back to the Vendor; the Vendor's notice jumps to the field                                                                                                                                                                                                                                                                                                                                                                                                            |
| OD-B5-11 / T-14            | Documents and package files are names only — nothing is uploaded; package fields provisional                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| T-26 / T-29 / T-30         | Per-format status, no partial approval or "add a format"; the Vendor picks assigned courses only; the reviewer sees delivery details and web links only (a new-tab link)                                                                                                                                                                                                                                                                                                                                                                         |
| OD-B6-01                   | One sample scope per reviewer; the Course filter lists its codes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| OD-B6-03                   | The publication check re-reads only the stated prerequisites; a blocked publish is refused                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| OD-B5-13                   | "Changed in the last 7 days" counts from the session's sign-in time on the sample clock                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| T-34                       | No messages or notifications: the Overviews and records carry every change                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Phase 6                    | No Vendor-originated post-publication correction; the CM correction entry, Updates and RV-04 are not built                                                                                                                                                                                                                                                                                                                                                                                                                                       |

State copy: 142 provisional entries in seven new `copy/state-copy-*.ts` files; decision ids never
appear in visible copy. Typed work (the editor, the reviewer's outcomes, course codes) is kept in
memory per session and record across in-app navigation, never in browser storage.

## 5 · Carry-forward limitations (unchanged)

TE-3 / T-12 (no product completion), P3-03 (first device), P4-01 (answer-key stand-in, PC-60), P4-06
(pinned release terms), SACC-14 (results after access ends), T-11 (identity and invitations) — none
was changed by Phase 5.

## 6 · Visual comparison

Each builder compared its screens with the B5 / B6 frames at the frame width (board renders and
product screenshots in the session scratchpad; not committed). Layout, classes, spacing and words
match; what remains is sample data (dates from the sample clock, SUB-0077 minted at 2 Oct 2026,
seed summaries), recorded choices (§7) and the not-rendered Phase-6 actions. Parity suite: the
Vendor sidebar (board 05 and board 07 f5) and the Academic Reviewer sidebar (board 05) now come
**within tolerance with no deviation**; the Content Manager sidebar (board 05, board 07 f7) differs
only by Updates (DEV-21). Pins 171 → 174, none changed.

## 7 · Recorded choices and deviations (owner review)

- My experiments: newest change first (the board draws a fixed order); status counts put the
  Vendor's "Submitted" under With Academic Reviewer, where it is (M-3).
- VE-13 History is the record's timeline (screens.json "MERGE → VE-07 timeline"): `?tab=history`
  moves focus to it; history shows only entries the Vendor may read.
- The course-withdrawal day is not shown on the read-only states (B5-06 f9, B5-07 f6 "on 15 Aug
  2026"): the record read carries no withdrawal date.
- RV-02 filters on the page from one read: search covers name, id, course code and vendor; Course
  filters by code; only Type is written to the address.
- RV-05: "Returned to vendor" while still returned, "· revision n" once it moved on (B6-02 f1).
- CM chip words from the B6-07 script: "Back with the Academic Reviewer" (re-check), "With the
  vendor" (returned).
- CM-03 adds "View in the catalogue" to the published result (undrawn); a published record's
  approval check reads passed as B6-07 f4 draws it.
- CM-09 sends only the changed rows; a duplicate shows the service's drawn words.
- Scan exceptions (role-name variants): the drawn hints "What learners do and what they find out."
  (B5-03) and B6-03's two outcome sentences ("a learner") — as the Package-1B exception, for the
  owner with OD-1B-04.
- DEV-21 extended to the Content Manager sidebar and the Phase-6 actions.

## 8 · Independent review (one bounded pass) and fixes

No owner-rule violation in publication, access, outcomes, drafts, navigation or the stand-in's
scope. Findings fixed, each with a test:

- **MEDIUM** — VE-01's status line counted a resubmission the Vendor reads as "Submitted" under
  "With Academic Reviewer", naming the next gate (M-3): it is now in none of the four counts, as
  B5-01's script leaves it out.
- **MEDIUM** — other roles saw a Vendor's saved, not-yet-resubmitted revision (the Content library's
  With vendor row, CM-03's catalogue preview, RV-05 / RV-06, SA-12): every reader but the Vendor now
  reads a returned record with the content it was last sent with (`asSentFor`).
- **MEDIUM** — `getVendorOverview` could answer `policy-open` ROLE-11 (a Vendor scoped to an
  experiment or to everything) without declaring it: the ledger and port now declare it as
  `listMyExperiments` does, and the editor shows a calm notice for a `policy-open` read instead of
  its loading state (`VE-03.policy-open`).
- Found in integration: the service test's access check compared tables that do not exist (always
  equal); it now compares plans, grants, licence waits, people, mappings and institutions.

Left as recorded: the routing stand-in runs after the resubmit's commit (as PC-60's marking does);
a Super Admin override return (SUB-38) is not worded on VE-01.

## 9 · Verification and verdict

`pnpm verify`, 16 Oct 2026, run `2026-10-16T15-18-27-470Z-verify`: **VERIFY PASSED** in 2,495 s.
The first run (2,268 s) failed on one stale assertion only — the Package-1A demonstration still
expected the Content Manager to land on Help (the interim landing CM-01 replaced); fixed, re-run.

| Step       | Result                                                                                                                                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format     | prettier clean                                                                                                                                                                                                                |
| repository | 32 checks · handoff 178/178 · audit evidence 36/36 · v46 copies 27/27 · scans clean (three recorded role-name exceptions, §7)                                                                                                 |
| workspace  | build 12/12, typecheck/lint/test 40/40 · **8,344 unit tests** (Phase 4B: 7,359): web 5,237, contracts 775, sample-platform 283, ui 832, domain 787                                                                            |
| bundle     | 1,852 product files, 0 test-seam or harness sentinels; the test-hook build carries the bridge (6/6 markers)                                                                                                                   |
| browser    | **2,980 passed** (Phase 4B: 2,833; web 1,841), 0 failed, 664 skipped (width-gated and the 36 deferred flow skeletons); Chromium only                                                                                          |
| parity     | 95/95 tests · 764 comparisons: 632 within, 132 registered, **0 unregistered**, 0 masked; pins 171 → 174 (the Content Manager sidebar `-phase-5` on board 05 and board 07 f7, DEV-21), none changed; DEV-10 no longer observed |

Phase-5 browser specs (`e2e/phase-5/`, 8 files) at 1440 / 1024 / 768 / 375: the product-build
Flow E demonstration (§3) and seven screen-group suites — every drawn state through `checkState`
(axe WCAG A/AA, one h1, visible focus, 24 × 24 targets, no sideways scroll), the primary
interactions by real clicks and typing (the editor's four steps with validation, Save draft minting
SUB-0077, typed work kept across navigation, DL-1 submit; revise from the reference and resubmit;
the reviewer's Return (DL-2 with references) and Approve (DL-1) with outcomes; the CM's Publish
(DL-1), send-backs, library tabs and search, course codes save and duplicate refusal; filters,
row links, the History address), the public pages listing the published experiment, and each
375 / 768 layout. States the browser seam cannot reach (a fault for now, a blocked publication
check) are proven by the component tests. `DEVIATIONS.md` regenerated from this run.

**Verdict: PASS** — all 21 registered Phase-5 ids are implemented with verified primary
interactions on the one world, and Flow E succeeds end to end on the normal product build with no
test hook: a Vendor creates and submits an experiment, the Academic Reviewer returns it with a
reason, the Vendor revises and resubmits, the reviewer approves it with learning outcomes, the
Content Manager publishes it, the public catalogue and experiment pages list it, and no institution
or Student gains access (108 of 123 designed ids). The one product-build gap (M-3) was closed by the
owner's answer (PC-66). Remaining items are recorded interims and owner reviews (§10), not
Phase-5 defects: PC-62 … PC-66, the provisional state-copy entries, DEV-21; the carried TE-3 /
T-12, P3-03, P4-01, P4-06, SACC-14 and T-11 limits; Chromium-only and same-machine parity.

## 10 · Owner decisions outstanding

- **P5-01 / M-3** — answered for this prototype (drawn-default stand-in, PC-66); the final rule
  (and whether a revision after a CM return needs a fresh academic review) stays the owner's.
- PC-62 … PC-65 (fact-based read models), the 142 provisional state-copy entries, OD-B5-_,
  OD-B6-_ safe treatments, the role-name scan exceptions (OD-1B-04), DEV-21; carried TE-3 / T-12,
  P3-03, P4-01 (PC-60), P4-06, SACC-14, T-11, Chromium-only and same-machine parity.
