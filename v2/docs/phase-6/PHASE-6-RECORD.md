# Phase 6 — record (corrections, governance and operations)

|                  |                                                                                                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorisation    | Owner, 16 Oct 2026 — "Phase 6 Authorization — Final Screen Implementation: Corrections, Governance and Operations" (the 15 remaining designed ids; SA-01 completed in place)       |
| Base             | `6bc036f` (Phase 5) on `v2/frontend-v46`; safety bundle `~/Downloads/XR-frontend-v46-6bc036f-phase6-pre.bundle` (+ `.sha256`; `git bundle verify` OK, restore-tested to `6bc036f`) |
| Design authority | `design/handoff-v46/` (frozen, 178/178): B6-04, B6-08, B6-09, B6-11, B6-13, B7-01, B7-05 … B7-12                                                                                   |
| Verdict          | see §7                                                                                                                                                                             |

## 1 · Screens — the 15 Phase-6 ids (123 of 123 designed ids built)

The frozen register (`SCREEN_PHASE` P6, `handoff/screens.json`) holds exactly these 15 ids; no
inventory discrepancy. VE-10 … VE-12 stay deferred (not designed for this build).

| Id    | Screen                         | Route                                                                     | Primary actions                                                                      | Boards / frames                              |
| ----- | ------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------- |
| CM-06 | Edit catalogue details (entry) | CM-05 → `/content-manager/updates/[updateId]?focus=summary`               | opens or joins the one correction draft (`openCorrection`)                           | B6-08 f0 … f4; B6-13 f1                      |
| CM-07 | Edit delivery link (entry)     | CM-05 → `/content-manager/updates/[updateId]?focus=web-link`              | opens or joins the one draft, the WEB link focused                                   | B6-08; B6-13                                 |
| CM-08 | Updates · an update            | `/content-manager/updates` · `/content-manager/updates/[updateId]`        | Save draft · Send for academic review (DL-1) · Withdraw (DL-2, reason)               | B6-09 f0 … f8; B6-11 f9 … f11; B6-13; B7-11  |
| RV-04 | Review an update               | `/reviewer/updates/[updateId]`                                            | Approve update (DL-1) · Return to the Content Manager (DL-2, reason)                 | B6-04 f0 … f4; B6-13 f3, f4; B7-11 f5, f6    |
| SA-10 | Content › Updates              | `/admin/content/updates` (`?show=waiting·on-hold·released`)               | Review / Open → SA-11                                                                | B7-05 f0, f2 … f4; B7-11 f0                  |
| SA-11 | Release or hold an update      | `/admin/content/updates/[updateId]`                                       | Release update (DL-1) · Hold (DL-2, reason) · Lift hold (DL-1)                       | B7-05 f1, f5 … f11; B7-10 f0 … f4; B7-11 f1  |
| SA-12 | Content › All content          | `/admin/content/all` (`?show=&q=`)                                        | Show stuck records · search · Open → SA-13                                           | B7-06 f0, f7                                 |
| SA-13 | Content record                 | `/admin/content/records/[recordId]` (a SUB or an EXP id)                  | Move status (override, DL-2, stuck records only) · Open the release decision         | B7-06 f1 … f6, f8; B7-10 f5, f6              |
| SA-14 | Academic structure             | `/admin/structure`                                                        | Add course · Add area (DL-3)                                                         | B7-07 f0, f6, f7; B7-12                      |
| SA-15 | Area / course record           | `/admin/structure/areas/[areaId]` · `/admin/structure/courses/[courseId]` | Rename · Edit description (DL-3) · Move to another area (blocked while people filed) | B7-07 f1 … f5, f8; B7-10 f9                  |
| SA-16 | Platform roles                 | `/admin/roles` (`?tab=reviewers·content-managers`)                        | Register a Vendor / Reviewer / Content Manager                                       | B7-08 f0, f3, f6, f7                         |
| SA-17 | Role holder                    | `/admin/roles/[holderId]`                                                 | Assign scope · Withdraw scope (reason) · Restore                                     | B7-08 f1, f2, f4, f5, f7, f8; B7-10 f10, f11 |
| SA-20 | Operations › Support           | `/admin/operations/support` (`?show=open·resolved·all`)                   | Open → SA-21                                                                         | B7-09 f7, f13                                |
| SA-21 | Support report                 | `/admin/operations/support/[reportId]`                                    | Resolve (note to the reporter) · Reopen (DL-1)                                       | B7-09 f8 … f12, f14; B7-10 f12               |
| SA-22 | Operations › Access ending     | `/admin/operations/access-ending`                                         | Open request · Open institution (no status action)                                   | B7-09 f4 … f6; B7-10 f8, f13                 |

Completed in place (not counted again): **SA-01 Overview** — the two figures, the summary line and
the eight drawn groups (requests, corrections waiting for the release decision, device transfers,
support, access ending within 15 days, institutions without an Institute Admin, stuck content,
role holders without scope), every row opening the page where it is handled; **CM-05** — its
correction entry and "Back from the correction" notice; the Phase-5 rows that waited on Phase-6
pages (RV-01, RV-02, RV-05 update rows; CM-01 update links), **SA-18**'s three Operations tabs and
**SA-07**'s access-ending reminder row. `/admin/content` redirects to Updates (Appendix A §3.7 row
15, board-forced). Every sidebar now lists every designed destination.

Built by seven parallel builders with strict file ownership (A: the correction draft; the Updates
list, RV-04 and the update rows; Release/Hold — B: SA-01, SA-12, SA-13; structure; roles — C:
operations) on lead-made services, contracts, routes, addresses, queries, the shared comparison
component and per-group registers.

## 2 · Services and contracts

- **Delivered (`PACKAGE_DELIVERIES` Phase 6)** — the last nine deferred methods:
  `CorrectionService.listUpdates`, `listUpdatesForRelease`; `AcademicStructureService.getArea`,
  `getCourse`; `PlatformRoleService.listHolders`, `getHolder`; `OperationsService.listSupportReports`,
  `listAccessEnding`, `getSuperAdminOverview`. **No product method is left deferred.** The commands
  (correction chain, Release / Hold / Lift hold, override, structure, scopes, support) were WP-0.11
  methods and are used as they were.
- **Facts, not words** (provisional register, `provisional-engineering`): **PC-67** SA-01's
  figures and eight groups, each from the same records and rules as the list it opens; **PC-68**
  SA-22 rows with the institution's name and kind; **PC-69** SA-15 "What uses this course" named;
  **PC-70** SA-16 / SA-17 scopes as facts (replacing Appendix C's `canActOn` words; PC-13's trace
  updated); **PC-71** SA-12 / SA-13 live version, open update state, who can act, withdrawn
  reviewer scopes; **PC-72** a comparison row names its package format.
- **Fixes found in integration**: a released update is compared with the version its release
  replaced (it compared with itself); a course move's history names the two areas ("From … to …");
  the correction's "started" and "sent" history entries are the whole chain's, as B6-04 and B7-05
  draw them.
- **Who may call**: every new Super Admin read refuses other workspaces; `listUpdates` is the
  Content Manager's; `getHolder` the Super Admin's. Each correction read and command answers the
  update **as its reader's audience may read it** (`updateForAudience`): history entries by
  `visibleTo`; the hold and its lifts for the Content Manager and Super Admin only; the withdrawal
  for the Content Manager only; a return's reason never to the Super Admin. A draft withdrawn
  before it was sent is never the reviewer's (UPD-16).
- Tests: `sample-platform/src/handlers/phase-6.test.ts` — the nine reads (shapes, order, refusals),
  Flow F released / held / returned on the product ports with plans, grants, waits, people,
  mappings and institutions compared before and after, the audience rules, scope assign / withdraw
  / restore, a registered reviewer, structure changes reaching the public reads and CM-09, support
  resolve / reopen.

## 3 · Demonstrations on the product build (`e2e/phase-6/demonstration.spec.ts`, 4 widths)

**Flow F — released, then held** (one tab, no test hook): the public request → approval →
payment stand-in → Meera Iyer assigned → Rahul Verma given Shell-and-Tube Heat Exchanger; Kavya
Nair opens the published experiment (CM-04 → CM-05) and "Edit catalogue details" opens the draft
(CM-06 → CM-08), she corrects the name and summary, saves (the public page still shows the live
version) and sends it (DL-1); Prof. A. Menon approves it from the Review queue (RV-02 → RV-04,
DL-1 — the public page still shows the live version); Arjun Mehta finds it on his Overview,
opens Content › Updates → SA-11 and releases it (DL-1, never "Publish"); the public experiment
page and Rahul's My courses and experiment page show the released version and Meera's Content
access and Student access are unchanged. A second correction ("Start a correction") is sent,
approved and **held** with a reason: Release is not offered, the public page and Rahul keep the
released version, and Kavya reads "On hold" with the Super Admin's reason.

**Governance**: a course renamed on SA-15 reaches the public course page and CM-09; Prof. A.
Menon's CHE ZG513 scope withdrawn on SA-17 removes Flash Distillation from his queue and its
address shows him nothing to act on; restored, it is back.

**Operations**: Kavya's report from Help is resolved on SA-21 with a note she reads on her report,
then reopened (DL-1) and she reads "Reopened"; Access ending lists Malnad's "Reminder due"
(nothing is sent) and opens the institution.

All three pass at 1440, 1024, 768 and 375. Each Phase-6 group spec (`e2e/phase-6/*.spec.ts`) adds
the cross-role proofs of its screens on the
test-hook build (e.g. a held update refused Release until lifted; Hold reason required; stale
decisions refused and re-read; the stuck SUB-0085 override back to the vendor; the duplicate
e-mail refused, PC-49; structure moves blocked / allowed and visible on the public area pages).

## 4 · Policy handling

| Rule / open decision                                             | What the build does                                                                                                                                                          |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BC8 / LD-4 / M-1 corrections                                     | Content Manager → Academic Reviewer → Super Admin Release / Hold; the one draft is opened or joined, pre-filled from live; nothing is public before Release; never "Publish" |
| BC9                                                              | Release writes the update and the experiment's live version only (unit and browser tests compare plans, grants, waits, people, mappings, institutions)                       |
| UPD-18 / UPD-16 / UPD-17 / UPD-21                                | Super Admin sees an update only once approved; the reviewer never a draft or a never-sent withdrawal; reasons only to their audience (`updateForAudience`)                   |
| UPD-23 / OD-B7-03                                                | No Release from On hold (refused `hold-must-be-lifted`); Lift hold returns it to waiting                                                                                     |
| T-28 (format change, hold effects, withdrawal agreement, bypass) | Not invented: the open sentences are shown without their ids; formats are never changed by a correction (UPD-07)                                                             |
| OD-B7-09 / M-1 override                                          | Only stuck records with the Academic Reviewer, back to the vendor, reason required; published records read-only                                                              |
| M-2 / D3 / BC2                                                   | Platform codes read-only on SA screens; no Retire, no artwork, no Module level; the move rule (blocked while people are filed) is the service's                              |
| OD-B7-13                                                         | A new area or course stays off the public explorer until it has published experiments                                                                                        |
| T-11 / ROLE-11 / ROLE-09 / PC-49                                 | Nothing sent on registration; a non-course Vendor scope shown as held, its meaning open; work in flight untouched; duplicate identities refused                              |
| SUP-03 / SUP-04 / ND-14 / T-31 / T-34                            | Nobody resolves their own report; the reporter has no reopen; no response-time target; "Reminder due" a status only; nothing sent                                            |
| DEV-17 / DEV-43                                                  | The Institute Admin's request-count meaning is not decided; SA-01 counts requests under review only                                                                          |
| P1-14 / VD-10                                                    | Decision ids taken out of visible copy (e.g. "(T-11)", "(T-14)", "(T-28)", "(T-31)", "(D3)", "(ND-14)"); each stripped string keeps the board's wording in its copy table    |

Carried, unchanged: TE-3 / T-12 (no product completion), P3-03 (first device), P4-01 (answer-key
stand-in, PC-60), P4-06, SACC-14, T-11, TE-6 (no browser persistence: one world per tab), and the
remaining T-28 correction-governance questions.

## 5 · Visual comparison

Each builder compared its screens with the board frames at the frame width (product screenshots
in the session scratchpad, not committed). Layout, classes, spacing and words match; what remains
is sample data (dates from the sample clock, the walk's records), recorded choices and owner
policy — each in its group's state-copy register.

Parity suite (same machine, Chromium): the comparisons Phase 6 changes are measured under
`-phase-6` names, their earlier pins kept as the record. Board 05's Super Admin and Content
Manager sidebars now come **within tolerance with no deviation** (every destination built).
SA-01 against B7-01 on the world after Flow E: the figures, the calm state (f1), the mobile parts
(f3) and the Access ending, Institutions without an Institute Admin, Stuck content and Role holders
groups are within tolerance (0 px); the Requests, Corrections, Device transfers and Support
groups, the header line and the frame differ by the world's records only (new **DEV-45**, owner
review; REQ-0058's line DEV-35). The Super Admin frames of B1-10, B7-02 and B7-03 and the board-07
Content Manager frame are measured as `-phase-6` (DEV-22, DEV-36 … DEV-41, DEV-11 / DEV-13, DEV-17
for the world's "Ready to publish" count). Pins 174 → 188, none changed (merged for the named
comparisons only).

## 6 · Independent review (one bounded pass) and fixes

Findings, each fixed with a test: **HIGH** "(T-14)" shown on CM-08's package hint (and on CM-05 /
CM-03's package title) — stripped (P1-14); **HIGH** correction reads and decision results carried
facts beyond the reader's audience (hold reason to the reviewer, withdrawal reason to the reviewer,
return reasons to the Super Admin, through SA-01, SA-13, SA-10/11 and command results) — one
audience view (`updateForAudience`) on every read and command; **MEDIUM** a draft withdrawn before
it was sent was readable by the reviewer — hidden (UPD-16); **LOW** SA-15's area name could break
the contract shape — read as a found record. Left as recorded (LOW): CM-08's "Corrections you
raised" lists every update in the Content Manager's scope (one Content Manager in the sample world);
SA-01's date is the session's sign-in day and SA-22's "as of" is derived (no `asOf` fact); SA-11 /
SA-07 show their failed state when a side read fails (fault plans only).

## 7 · Verification and verdict

`pnpm verify`, run `2026-10-16T19-33-36-631Z-verify`: **VERIFY PASSED** in 3,046 s. The first run
(2,947 s) failed on one stale assertion only — the Package-1A session spec still counted four
Content Manager destinations (Updates is the fifth since Phase 6); fixed, re-run.

| Step       | Result                                                                                                                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format     | prettier clean                                                                                                                                                                                                   |
| repository | 32 checks · handoff 178/178 · audit evidence 36/36 · v46 copies 27/27 · scans, deny-list, fence wiring                                                                                                           |
| workspace  | build 12/12, typecheck / lint / test 40/40 · **9,269 unit tests** (Phase 5: 8,344): web 6,143, ui 832, domain 787, contracts 781, config 356, sample-platform 296, api 38, validation 20, testing 11, database 5 |
| bundle     | 2,084 product files, 0 test-seam or harness sentinels; the test-hook build carries the bridge (6/6 markers)                                                                                                      |
| browser    | **3,124 passed** (Phase 5: 2,980; web 1,985), 0 failed, 664 skipped (width-gated and the 36 deferred flow skeletons); Chromium only                                                                              |
| parity     | 95/95 tests · 770 comparisons: 641 within, 129 registered, **0 unregistered**, 0 masked; pins 174 → 188, none changed; new DEV-45 (7 comparisons)                                                                |

Phase-6 browser specs (`e2e/phase-6/`, 8 files) at 1440 / 1024 / 768 / 375: the three product-build
demonstrations (§3) and seven screen-group suites — every drawn state through `checkState` (axe
WCAG A/AA, one h1, visible focus, 24 × 24 targets, no sideways scroll), the primary interactions by
real clicks and typing, and each group's cross-role effect. States the browser seam cannot reach
(a fault for now, SA-22's "nothing ending") are proven by the component tests. `DEVIATIONS.md`
regenerated from this run.

**Verdict: PASS** — all 15 remaining designed screen ids are implemented with their primary
functionality on the one shared world, SA-01 is completed in place (not counted again), and Flow F
succeeds end to end on the normal product build with both outcomes: a correction released (the
public pages and an entitled Student see the new version; institution and Student access
unchanged) and another held (the released version stays live for everyone). Governance (academic
structure, role scopes) and operations (support, access ending) run on the shared services and
propagate across roles. **123 of 123 designed screen ids are implemented.** This is
screen-implementation completion, not approval of demo readiness (Phase 7). Remaining items are
recorded interims and owner reviews (§8), not Phase-6 defects.

## 8 · Owner decisions outstanding

PC-67 … PC-72 (fact-based read models), the Phase-6 provisional state-copy entries, DEV-45 (SA-01
sample data), the T-28 residual questions, ROLE-11, T-11, SUP-04, UPD-17, OD-B7-01 / OD-B7-03 /
OD-B7-09 / OD-B7-13 safe treatments, the role-holder history's scope matching (no scope id on the
entry), multiple Content Managers on CM-08; carried TE-3 / T-12, P3-03, P4-01 (PC-60), P4-06,
SACC-14, TE-6, Chromium-only and same-machine parity.

## 9 · Repository and backups

Work stayed in `/Users/mymac/Desktop/AR-VR-frontend-v46` on `v2/frontend-v46`; no push, merge,
reset or remote change. After the phase: `design/handoff-v46` 178/178; the original checkout
`/Users/mymac/Desktop/AR-VR` still at `1b090c9` with its 98 uncommitted paths identical to the
12 Oct 2026 backup (status list and the 98 files' SHA-256 from `MANIFEST.json`); the backup's own
`SHA256SUMS.txt` OK; the separate Claude Design prototype (`~/Downloads/XR-Platform-Design-Prototype`,
57 files) byte-identical to before the phase; the Phase-5 and pre-Phase-6 bundles verify. The
post-commit bundle is `~/Downloads/XR-frontend-v46-<sha>.bundle` (+ `.sha256`).
