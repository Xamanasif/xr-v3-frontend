# Phase-1 Package 1D — Institutions, Institution Detail and the Super Admin Overview (record)

|                   |                                                                                                                                                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package           | Phase-1 Package 1D (owner authorisation, 15 Oct 2026; "Authorize Package 1D ONLY"): SA-06, SA-07 and SA-01 in its Phase-1 scope only                                                                                                   |
| Branch / worktree | `v2/frontend-v46` at `/Users/mymac/Desktop/AR-VR-frontend-v46`, from `cace91d` (Package 1C, conditionally accepted)                                                                                                                    |
| Design authority  | `design/handoff-v46/` (frozen, 178/178): B7-01, B7-02, B7-03, B7-04 f0; B1-11 f14 (SA-03's paused block); B8-06 (Phase-1 sequence)                                                                                                     |
| Safety backup     | `~/Downloads/XR-frontend-v46-cace91d.bundle` (branch `v2/frontend-v46` at `cace91d`, complete history; `git bundle verify` OK and a restore test; SHA-256 `ae9065a9…5e41`, sidecar `.sha256`), made and verified before implementation |
| Environment       | macOS (Darwin 25.5.0), Node 24.21.0, pnpm 12.3.4, Playwright Chromium only                                                                                                                                                             |

Like the 1A–1C records, this one is kept outside `docs/v46/` (the audit evidence there stays
byte-identical). It states what Package 1D built, the three owner decisions it implements, the
evidence and what stays open. Nothing of Package 1E or Phase 2 was started.

## 1 · Screens and routes

| Screen                              | Board                                  | Route                                 | Feature                                    |
| ----------------------------------- | -------------------------------------- | ------------------------------------- | ------------------------------------------ |
| SA-01 Overview — the Requests group | B7-01 f0, f1, f2 (loading), f3         | `/admin`                              | `features/admin/sa-01-overview/`           |
| SA-06 Institutions                  | B7-02 f0 … f6                          | `/admin/institutions`                 | `features/admin/sa-06-institutions/`       |
| SA-07 Institution detail            | B7-03 f0 … f9; B7-04 f0 (its own page) | `/admin/institutions/[institutionId]` | `features/admin/sa-07-institution-detail/` |

`/admin` was the Super Admin's interim base (it led to Help, P0-35); it is now SA-01, where the
Super Admin lands after signing in and where "Back to Home" in the Super Admin's shell leads. The
other roles' bases still land on Help. Route manifest: 51 page files (49 + 2). Document titles:
"Overview · XR Learning Platform", "Institutions · XR Learning Platform", "<institution> ·
Institutions · XR Learning Platform".

Ways in, now rendered (link-target ledger `built`): the Super Admin's sidebar lists Overview,
Requests (with its count) and Institutions in the drawn order, then Help — Content, Academic
structure, Platform roles and Operations stay unrendered (DEV-21, P0-35); SA-01's rows open SA-03
and "Open Requests" opens SA-02; SA-06's rows open SA-07; SA-07's "Back to Institutions" (SA-06),
its "Open request REQ-…" (SA-03 for the request the institution was created from) and its
attention rows' "Requests" (the Requests list, SA-02, as B7-03's `sareq`); SA-03's paused block
now renders B1-11 f14's "View institution" (SA-07), which Package 1A left unrendered. Not rendered: SA-07's Operations links
(device transfers, access ending — Phases 3 and 6) and every Phase-2…6 destination.

## 2 · The owner decisions

### SA-01 scope (approved)

- SA-01 holds one group: the requests under review, read through `AccessRequestService.listRequests`
  — the same read and the same figure as the sidebar's count (`queries/nav-counts.ts`
  `useRequestsUnderReview`; B1-10 "Nav count 3 = requests under review") — newest first, at most
  four rows (B7-01 caption), each opening its decision page (SA-03), and "Open Requests" (SA-02).
  With none under review the group is left out, which leaves B7-01 f1's calm state; loading (f2)
  is the header status and skeleton groups (unit-tested: the sample adapter answers at once in a
  browser build); a failed read has Retry.
- Not built and recorded as the Phase-6 requirement (DEV-34, owner-approved, tracked; state-copy
  `SA-01.scope`): the two figures, the other seven groups and the "15 items waiting across 8 groups
  · <date>" line, all through `OperationsService.getSuperAdminOverview`, which stays a Phase-6
  ledger entry (not delivered). No figure, licence total, expiry date or metric is composed.
- Each row's line is written from the Phase-1 request row: "<type> · under review since <received>"
  (B7-01's REQ-0040 form); B7-01's "60 more licences" and "· access ends 31 Oct 2026" need data the
  Phase-1 rows do not carry, and the calm sentence names requests only — both words for the
  owner's review (DEV-35; state-copy `SA-01.request-line`, `SA-01.calm`).

### P1-14 / VD-10 — decision ids out of the product copy (approved)

- Five ids are no longer shown: "(T-09)" (SA-06's page line), "(T-06)" and "(T-08)" (SA-07's
  licence note), "(T-25)" (SA-07's report note) and "(T-11)" (SA-07's Assign sentence and its
  flash). Each sentence is otherwise as drawn.
- Traceability: `copy/institutions.ts` `STRIPPED` keeps every frozen wording with its ids beside
  the product words; `copy/institutions.test.ts` checks each against the board text and that the
  product words are the drawn words without " (T-nn)" and nothing else; state-copy
  `SA-06.decision-ids` and `SA-07.decision-ids` (owner-approved); DEV-36 (owner-approved) registers
  the visual difference, measured on the sentences themselves (`b7-02-f0-header-line`,
  `b7-03-f0-plans`, `b7-03-f0-report`, `b7-03-f6-assign-sentence`).
- The ids stay in domain logic, tests, the registers, the audit evidence and the documentation.

### P1-08 — assigning an Institute Admin (approved, as documented)

- Assign is offered and accepted only where the existing rule allows it: access active, ending
  soon or paused, while no Institute Admin is assigned — the domain's `assignInstituteAdmin`
  (INST-04; refused `access-not-active` while approved — payment required, INST-05 / OD-B7-11, and
  after access ended) and B7-03's own script (`noIA`). Before activation SA-07 shows B7-03 f3's
  "The Institute Admin is assigned once access is active." No rule was added or changed; SA-06's
  "Needs one" flag (`needsInstituteAdmin`, PC-36) is computed by the service from the same states,
  and a contract case checks that it matches what `assignInstituteAdmin` accepts.

## 3 · Services, contracts and domain

- **Delivered:** `InstitutionService.listInstitutions` — a Phase-0 ledger entry deferred to Phase
  1, now in `PACKAGE_DELIVERIES` for Package 1D (its authorisation quoted; `getSuperAdminOverview`
  named as staying in Phase 6). The Super Admin only (the method's audience is SA-06's workspace;
  every other role is refused, nothing read); B7-02's tabs (its script's `match`: "Access active"
  also holds the institutions ending soon; "No Institute Admin" = the flag); search over the name,
  the plan references and the Institute Admin's name as one line, as B7-02's script joins them;
  the institution created last first (PC-36, DEV-37).
- **Changed (additive, PC-36):** the SA-06 row carries facts, not words — `plans[]` (reference,
  course and experiment counts), `requestedExperimentCount`, `needsInstituteAdmin`, `accessEndsOn`;
  Appendix C's pre-rendered `planSummary` (PC-13) was dropped before anything used it.
- **Changed (additive, PC-37; owner §5):** `InstitutionDetail.people.studentList[].rev`, the student
  record's own revision; SA-07's "Change status" sends it as `expectedRev` to
  `overrideStudentStatus`. Nothing synthesises a revision and nothing bypasses the stale check: a
  stale revision is refused `stale`, writes nothing, and the page reads the record again (P1-21).
- **Reused, unchanged in contract:** `getInstitution`, `assignInstituteAdmin`, `pauseInstitution`,
  `restoreInstitution`, `overrideStudentStatus`, `listRequests`. The domain package is unchanged; no
  permission or business rule was modified. Request, access plan and Student access stay separate
  records (SA-07 reads the plan and the people; it changes neither a request nor a grant).
- **Contract suite:** a new `institution` group of four adapter-independent cases on the walk after
  Flow C — `institutions:list` (every row says what `getInstitution` says; B7-02 f0's tab figures;
  search, also across two of its words), `institutions:scope` (only the Super Admin; every other role refused, nothing written),
  `institutions:actions` (Assign, Pause and Restore show in the list at once; validation, stale and
  invalid-state refusals write nothing; "Needs one" = what `assignInstituteAdmin` accepts) and
  `institutions:student-revision` (the listed revision is the record's; a stale one is refused);
  the 12 invariants run after each. Sample adapter: `handlers/institution.test.ts` (8: the list on
  the spine-start world, refusals, INST-04 / INST-05, PC-37, and the assigned Institute Admin's
  sample sign-in with the work e-mail, P1-01).
- **Web:** `queries/institutions.ts` (the list, one figure query per tab, the detail, and the four
  commands — each receipt invalidates the institution, request and count queries that depend on
  it); `copy/institutions.ts` and `copy/overview.ts` (every phrase checked against B7-01 … B7-03);
  24 state-copy entries (`SA-01.*`, `SA-06.*`, `SA-07.*`) for what no board words: loading,
  failed, order, the Phase-1 attention rows and history, stale and unavailable commands.

## 4 · Evidence

Final `pnpm verify` on the code as committed: **VERIFY PASSED** in 843 s (run
`2026-10-15T07-18-36-963Z-verify`, i.e. 15 Oct 2026, 12:48 IST). The run before it
(`2026-10-15T07-01-20-168Z-verify`) failed one Phase-0 specimen comparison,
`11-tabs-375-faculty-courses-current` (board 11's 375 px tab strip captured before its current tab
was scrolled into view, 1,777 px). It is intermittent and outside this package: 0 px in the two
verify runs before it, and one failure in six separate runs of its spec here; no code, pin or
tolerance was changed for it (owner item 13). Only documents changed after the passing run — this
record's figures and `tools/board-capture/DEVIATIONS.md`, regenerated from that run — and they
were re-checked with prettier and the repository scans.

| Step       | Result                                                                                                                                                                                                                                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format     | prettier clean                                                                                                                                                                                                                                                                                                                              |
| repository | 32 checks · handoff 178/178 · audit evidence 36/36 · v46 copies 27/27 · scans, deny-list, fence wiring                                                                                                                                                                                                                                      |
| workspace  | turbo build 12/12, typecheck / lint / test 40/40 (`--force`) · **4,452 unit tests** (Package 1C: 4,288): web 1,497 (+154), sample-platform 176 (+8), contracts 731 (+2); ui 831, domain 787, testing 11, config 356, validation 20, database 5, api 38 unchanged                                                                            |
| bundle     | 864 product files (1C: 831), 0 test-seam or harness sentinels; the test-hook build carries the bridge (5/5 markers)                                                                                                                                                                                                                         |
| browser    | **2,065 passed** (1C: 2,012; web 926, was 873), 0 failed; 647 skipped, not passed (1C: 644 — width-gated tests); Chromium only                                                                                                                                                                                                              |
| parity     | 95/95 tests · **764 comparisons** (1C: 658), 19 whole frames: 623 within tolerance, 141 on the register, **0 unregistered**, 0 masked, 136/136 board references, 0 external requests; open owner decisions blocking parity: none; not closed by the owner: DEV-21 … DEV-25, DEV-27 … DEV-33, DEV-35, DEV-37, DEV-38, DEV-40, DEV-41, DEV-42 |

New Package-1D tests: web unit `features/admin/institutions.test.tsx` (23: SA-01, SA-06 and SA-07
on the real composition root and sample world — refusals, focus, the revisions a dialog or panel
keeps, SA-06 after an SA-07 command), `sa-07-institution-detail/institution-view.test.ts` (11: the
controls per state against the domain rule, attention rows and history from the record),
`copy/institutions.test.ts` (84 checks against B7-01 … B7-03, P1-14's ids included), and the updated
state-copy, route, place-word, link-target and sidebar tests; sample platform
`handlers/institution.test.ts` (8); contracts: the four `institutions:` cases and the provisional
register (37 items). Browser (`e2e/package-1d/`): `overview.spec.ts`, `institutions.spec.ts` and
`demonstration.spec.ts` at four widths (56 tests: 53 run, 3 width-gated), plus the updated 1A, 1C
and foundation specs (the Super Admin's base, navigation, not-found, workspace guard, cross-role).

### The connected flow, in the browser

- **Product build, one tab, no hooks** (`e2e/package-1d/demonstration.spec.ts`, at 1440, 1024, 768
  and 375), continuing Package 1C's journey on the same sample world: the public request REQ-0042 →
  the Super Admin signs in and lands on SA-01, REQ-0042 first in its group → SA-03, approve
  (External) → SA-06: Godavari "Approved — payment required", no "Needs one" yet → sign out → the
  requester pays (the TE-4 stand-in): Access active, ACC-0107 → the Super Admin again: REQ-0042 has
  left SA-01; SA-06 lists Godavari "External · ACC-0107 · 1 course · 1 experiment", Access active,
  "Needs one" → its "No Institute Admin" tab (the search below 1024 px) → SA-07: Assign — both
  drawn errors, then Meera Iyer → Pause and Restore, a reason each, all in the History → sign out
  → Meera Iyer signs in with the work e-mail just assigned: her own workspace, her institution's
  request at its address, the Super Admin's SA-07 address "This page isn't part of your workspace"
  → sign out → the Super Admin: Godavari with its Institute Admin. One document throughout.
- **Test-hook build** (`institutions.spec.ts`, `overview.spec.ts`, four widths): every drawn state
  of SA-06 and SA-07 from the shared world (B7-02 f0 … f6, B7-03 f0 … f9), tabs by pointer and by
  keyboard, search and "Clear filters", SA-06 → SA-07 and back in one document, Assign / Pause /
  Restore / status override with their checks, a change made in another session showing at once,
  stale commands refused with the world's version unchanged — through the ports and through the
  screen (a dialog or status change opened before the change: refused, nothing written, focus on
  the page) — another role's address of SA-06 or SA-07 answered "Not your workspace", SA-01's rows
  and calm state, and "Back to Home".

### Screens, accessibility, responsiveness

Every drawn state of SA-01, SA-06 and SA-07 passes `checkState` at 1440, 1024, 768 and 375 — axe
(WCAG 2.0 / 2.1 / 2.2 A and AA), one level-1 heading, no invisible focus target, 24 × 24 px
targets, no developer surface, no Slice-1 markup, no sideways page scroll (below 1024 px the tab
strip scrolls inside itself, B7-02 f6) — with real pointer clicks reached by the wheel
(`reachAndClick`) and focus after each move: a dialog's field on opening, the first invalid field
after a refused confirm, the flash after a result, the page title after a refusal because the
record moved on, "Change status" after Cancel or a stale status change, the first row's "Open"
after the no-match "Clear filters", the tabs by ← → (one tab stop); Back / Forward in one document.

### Visual parity (`e2e/parity/b7-package-1d.parity.ts`)

B7-01 f0, f1, f3 (f2 "Loading" is unit-tested: the sample adapter answers at once), B7-02 f0, f2,
f3, f4, f6 (f1 is B7-03 f0's page; f5 "Loading" unit-tested), B7-03 f0 … f9 and B7-04 f0 (f1 … f3 are
other roles' pages of Phases 2 and 4), each at its drawn width × 900 against the test-hook build:
106 comparisons (3 whole frames), 71 within tolerance and 35 on the register. New entries: DEV-34
(owner-approved: SA-01 scope), DEV-35 (Phase-1 row and calm words), DEV-36 (owner-approved: P1-14 /
VD-10, measured on the sentences themselves), DEV-37 (newest first — also the last row's missing
rule on Deccan and Malnad), DEV-38 (Phase-1 attention rows), DEV-39 (approved rule: the sample
labels), DEV-40 (the record's own history), DEV-41 (background institutions without people) and
DEV-42 (the canvas wrapper round words bound into a button, DEV-30's family). DEV-21 also covers
the Super Admin's sidebars on the B7 frames, and DEV-22 SA-01's REQ-0038 date. Pins: 35 added; 3
re-measured because the Super Admin sidebar now lists Overview and Institutions —
`05-super-admin-help-built-sidebar-package-1a` (2,484 → 984 different pixels, sizes unchanged),
`b1-10-f0-sidebar` and `b1-10-f0-whole-frame` (sizes unchanged, the product fingerprints changed by
the two added destinations); the other 104 byte-identical; no tolerance or mask changed. The
spec-level capture steps are in `tools/board-capture/README.md`.

Two product fixes came from the comparisons: SA-01's group title has the word space B7-01 draws
before its count ("Requests 3"), and SA-07's two dialogs have the 14 px B7-03 draws under their
sentence (`p style="margin:0 0 14px"`, a spacing utility on the first field).

### Independent review

One bounded review by a separate agent (read-only; it re-ran the web, contract and sample-platform
unit tests, `tsc` and ESLint): no high-severity finding; nothing reads past its authorisation, no
revision is made up, no figure is invented and no decision id is shown. Its findings, verified here
and all addressed:

| #   | Finding                                                                                                                                                                                                         | Outcome                                                                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Medium: SA-07 sent the revision read at confirm, and the status panel worked out its change at save time — a change shown meanwhile was not refused as stale, and the panel could turn into the opposite change | Fixed: a dialog keeps the institution's revision from when it opened; the panel its change and the student's revision. Two unit tests (both fail on the old code) and a browser test through the screen  |
| 2   | Medium: after a refusal because the record moved on, focus fell to the page body                                                                                                                                | Fixed: focus goes to the page title after a dialog's refusal (also the dialogs' fallback when their trigger is gone) and to the student's "Change status" after the panel's; unit and browser assertions |
| 3   | Medium: SA-06's no-match "Clear filters" dropped focus to the body                                                                                                                                              | Fixed: once the button has gone, focus goes to the first row's "Open" (DataTable's rule on SA-02); keyboard unit test                                                                                    |
| 4   | Low: no test of SA-06's cached rows and figures after an SA-07 command in the same session; the browser's stale checks went through the ports only                                                              | Added: a unit test (SA-06, then Pause on SA-07, then SA-06 shows "Paused 2" and Konark paused) and the browser test of finding 1                                                                         |
| 5   | Low: `b7-01-f0-req-0038-row` named DEV-35 only, but its date (24 against 26 Sep) is sample data                                                                                                                 | Fixed: DEV-22 (which now lists B7-01) named on the row, the group and the whole frame; their three pins re-pinned, measurements unchanged                                                                |
| 6   | Low: this record said SA-07's attention rows open "the request each names"                                                                                                                                      | Wording fixed: they open the Requests list, as B7-03's `sareq` and the link ledger say                                                                                                                   |
| 7   | Plausible: B7-02 searches one joined line (name, plan, Institute Admin); the service matched field by field                                                                                                     | Fixed in the adapter and the contract case; a contract check searching across two words ("Technology ACC-0107") fails on the old code                                                                    |
| 8   | Plausible: an assigned work e-mail that already signs someone in would shadow that person in the sample sign-in                                                                                                 | Not changed — no eligibility rule may be added (P1-08): owner item 10                                                                                                                                    |
| 9   | Note: with more than one plan, each plan row would show the institution's status                                                                                                                                | Not reachable on the sample world (one plan per institution): owner item 11                                                                                                                              |

The repository scan also caught, before the review, the canvas sample label quoted inside a
state-copy rule (bundled, never shown): the rule now describes the labels without their words.

## 5 · Carried forward, not approved (owner items)

Unchanged from 1A–1C: DEV-21 … DEV-33 (DEV-26 no longer observed), OD-B3-09 and the "Access
active" wording for an existing institution's paid request, SA-03's route-choice hint spacing,
the Monthly smaller-scope default, the Institute Admin request-count semantics (DEV-17), SA-03's
unavailable wording, P1-22, PC-31 / PC-32, browser persistence (TE-6), the WILP logo placeholder,
the visual runner (VD-18) and non-Chromium browsers.

New with Package 1D, for the owner's review:

1. DEV-35 — SA-01's rows and calm sentence in Phase-1 words.
2. DEV-37 — SA-06 lists the institutions newest first (B7-02 draws a sample order, no sort
   control); contract PC-36.
3. DEV-38 — SA-07 "Needs attention" in Phase 1: the institution's open requests, its missing
   Institute Admin and its pause; device-transfer and access-ending rows wait for Phases 3 and 6
   (tracked).
4. DEV-40 — SA-07's History is the institution record's own events, each with its recorded time.
5. DEV-41 — the sample world's background institutions hold no people or learning activity
   (fixture state).
6. DEV-42 — words bound into a button: the canvas runtime's wrapper (DEV-30's family).
7. The Package-1D state-copy entries marked provisional (SA-01 request line and calm sentence,
   SA-06 order and empty state, SA-07 attention rows, history, failure and stale handling).
8. PC-36 and PC-37 (provisional engineering contract shapes, reversible while the contract is a
   draft).
9. How an assigned Institute Admin first signs in stays open (T-11): nothing is sent; the sample
   sign-in accepts the assigned work e-mail (P1-01). Replacing an Institute Admin (INST-06) is not
   designed and not offered.
10. Nothing checks an assigned work e-mail against the people who already sign in with it. The
    sample sign-in resolves an e-mail to the first person holding it (people, Institute Admins,
    role holders, Super Admins in that order), so assigning an e-mail already in use would make
    that sign-in land as the new Institute Admin. Whether Assign must refuse it is not designed (T-11
    / P1-01); no rule was added.
11. The "Access plans" Status column shows the institution's status on each plan row (state-copy
    `SA-07.plan-status`, as B7-03 draws its one plan): the read model has no status per plan, so
    with more than one plan an ended plan would read as the institution does. The sample world
    holds one plan per institution.
12. SA-03 (Package 1A) still sends the request's revision as read when the decision is confirmed —
    the pattern SA-07 had before the review. Keeping the revision from when the decision started,
    as SA-07 now does, is a Package-1A change and waits for the owner's go-ahead.
13. An intermittent Phase-0 parity flake: board 11's specimen tab strip at 375 px is sometimes
    captured before its current tab is scrolled into view (`11-tabs-375-faculty-courses-current`;
    one verify run of three since Package 1C, one of six separate runs). The strip aligns its
    current tab on mount and once more after the web fonts load (`@xr/ui` `useCurrentTabInView`);
    the likely cause is that second alignment racing the font swap or the page's first layout.
    Phase-0 code, not changed here; a fix with a stress test needs the owner's go-ahead.

Decided by the owner and recorded: DEV-34 (SA-01 scope; the full overview is a tracked Phase-6
requirement), DEV-36 (P1-14 / VD-10), DEV-39 (the canvas sample labels do not ship — a frozen
rule).

Open and untouched: ND-07, T-01 / R01, T-03, T-05 / R06, P1-04, OD-B3-09, D7.

## 6 · Dependencies for Package 1E (not started)

The Super Admin can now see, assign, pause and restore institutions and override a student's
status on the shared world; an assigned Institute Admin signs in to their own workspace (Help is
still its base) and reads their institution's requests at their address (ADR-0009). The pause's
effects on the institution's people (B7-04 f1 … f3) are pages of later phases. Nothing of
Package 1E's screens, routes or services was added.
