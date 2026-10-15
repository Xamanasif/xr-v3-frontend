# Phase 3 — record (learning, feedback, the device chain, requests to BITS and usage)

|                   |                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorisation     | Owner, 15 Oct 2026 — "Phase 3 Authorization — Accelerated Student Learning, Simulation, Progress and Device Workflows" (all 15 designed Phase-3 ids)                     |
| Base              | `dba79ae` (Package 2B) on `v2/frontend-v46`; safety bundle `~/Downloads/XR-frontend-v46-dba79ae-phase3-pre.bundle` (+ `.sha256`; `git bundle verify` OK, restore-tested) |
| Design authority  | `design/handoff-v46/` (frozen, 178/178): B3-01 … B3-13, B2-10 … B2-12 (hub, Home), B2-01 … B2-05 (IA actions), B7-03, B7-09, B7-10, boards 05 / 06                       |
| Verdict (summary) | see §9                                                                                                                                                                   |

## 1 · Screens — the 15 Phase-3 ids (62 of 123 designed ids built)

| Id    | Screen                                | Route (Appendix A register)                                                | Board(s)                        |
| ----- | ------------------------------------- | -------------------------------------------------------------------------- | ------------------------------- |
| ST-06 | Resources (hub tab)                   | `/student/experiments/[experimentId]/resources`                            | B3-01 f0–f7                     |
| ST-07 | Simulation — choose a format (tab)    | `/student/experiments/[experimentId]/simulation`                           | B3-02 f0–f7                     |
| ST-08 | WEB simulation (launch / resume)      | `/student/experiments/[experimentId]/simulation/web`                       | B3-03 f0–f7                     |
| ST-09 | AR / VR / MR format (setup, progress) | `/student/experiments/[experimentId]/simulation/[format]` (ar·vr·mr)       | B3-04 f0–f7                     |
| ST-10 | Progress for this experiment (tab)    | `/student/experiments/[experimentId]/progress`                             | B3-01 f8–f12                    |
| ST-15 | Progress (all experiments)            | `/student/progress`                                                        | B3-05 f0–f9                     |
| ST-16 | Format feedback                       | `/student/experiments/[experimentId]/feedback/[format]`                    | B3-06 f0–f2, f5, f6             |
| ST-17 | Feedback sent (read-only)             | a state of ST-16's route                                                   | B3-06 f3, f4                    |
| ST-18 | My device (AR/VR/MR holders)          | `/student/device` (account menu "My device")                               | B3-07 f0–f9                     |
| IA-17 | Requests to BITS (+ request detail)   | `/institute/requests`; detail `/institute/requests/[requestId]` (O-02)     | B3-08 f0–f7                     |
| IA-18 | Device requests                       | `/institute/requests?tab=devices`                                          | B3-09 f0                        |
| IA-19 | Device request — review & forward     | `/institute/requests/devices/[transferId]`                                 | B3-09 f1–f5                     |
| IA-20 | Usage                                 | `/institute/usage` (`?view=course`)                                        | B3-10 f0–f4                     |
| SA-18 | Operations › Device transfers         | `/admin/operations/device-transfers` (`?show=`; `/admin/operations` → 307) | B3-11 f0, f2, f3, f6, f7; B7-09 |
| SA-19 | Device transfer decision              | `/admin/operations/device-transfers/[transferId]`                          | B3-11 f1, f4, f5; B7-10 f14     |

Actions of earlier screens that waited for these now render: ST-05's tab strip (Overview ·
Resources · Simulation · Progress), "Next step" and step-card actions; ST-01's Up next "Give
feedback"; the sidebar items Progress (Student), Requests and Usage (Institute Admin), Operations
(Super Admin); "My device" in a VR/AR/MR Student's account menu; IA-01's device-request row (→ IA-18,
P3-07) and "Request renewal"; IA-02 / IA-03 / IA-05 "Request renewal" / "Ask BITS from Requests";
SA-07's forwarded-transfer attention row. Still not rendered (DEV-21): everything assessment
(Phase 4: the hub's Assessment tab, Assessments in the sidebar), SA-18's Support and Access ending
tabs and SA-07's access-ending row (Phase 6); ST-01 / ST-02 "earlier work" (SACC-14, §6).

Built by seven parallel builders with strict file ownership on lead-made scaffolding (pages, routes,
queries, per-group state-copy and link-target files, the runtime seam), then integrated by the lead.

## 2 · Services and contracts

- **Delivered**: `LearningService.getSimulationChooser` (ST-07: one progress view per published
  format, the same reading as each format page) — the one deferred Phase-3 method
  (`PACKAGE_DELIVERIES`, "Phase 3"). Every Phase-3 method is now implemented: 183 = 153 implemented
  - 30 deferred to Phases 4–6. All other Phase-3 reads and commands were WP-0.11 methods.
- **Additive contract fact**: **PC-50** `requesterRequestView.message` (the requester's own
  message, `null` when none) — IA-17's detail "Message to BITS" (B3-08 f4).
- **Contract suite**: + `learning:chooser` (83 cases): the chooser and each format page read the
  same per-format progress; only the runtime's completion report completes a format, one format
  never another.
- **Test-only seam** (CI/Playwright builds only, never a product control): the bridge's
  `reportRuntime` — the sample runtime's own activity / completion report through the
  `RuntimeReportPort` stand-in (`system:runtime-report`, sample provenance). Marker
  `xr-web-test-runtime-seam` is a verify bundle sentinel and a test-hook build marker.
- No domain, policy or `@xr/ui` change. Query modules: `queries/learning.ts`, `devices.ts`,
  `institute-requests.ts`, `usage.ts` (+ two `*-extra.ts`), each read declaring the record kinds it
  depends on, so a command receipt refreshes every role's reads in the same tab.

## 3 · Learning workflow — what each build proves

**Product build** (`e2e/phase-3/demonstration.spec.ts`, one tab, no test hooks, 4 widths): request
→ approval → payment stand-in (TE-4) → access active → Meera assigned → Meera adds Rahul (IA-10) and
gives him Shell-and-Tube (IA-05) → Rahul signs in → Home → hub (ST-05, "Next step: open the
resources") → Resources (ST-06): the lab brief opens in a new tab and reads "Opened" → Simulation
(ST-07: WEB, VR; AR "Not included for your institution"; MR "Not available for this experiment") →
WEB (ST-08): "Launch WEB" opens the published WEB link in a new tab and **records nothing** →
Progress (ST-10, ST-15): every format **Not started**, no feedback offered → My device (ST-18):
"No authorised device is recorded for you yet." (no request possible) → Meera asks BITS for 60 more
licences (IA-17; the same REQ appears in the Super Admin's Requests) → Usage "No activity yet" →
Device requests empty → the Super Admin's Device transfers: nothing forwarded.

**Test-hook build** (`demonstration-hooks.spec.ts`, one tab, 4 widths; **CI-only fixtures marked**):
the setup world (8 Oct; Rahul's VR device GIT-VR-03 **supplied by the seed**) → Meera gives Rahul the
experiment (IA-07 → IA-05) → Rahul signs in → hub → Resources → Simulation → WEB → Launch (still Not
started) → **[runtime report: WEB opened]** → In progress, "Continue WEB" → **[runtime report: WEB
completed]** → "Give feedback on WEB" → ST-16: "5 ratings are missing", then sent → ST-17 "Feedback
on WEB sent" → ST-15: WEB completed + feedback sent; VR not started, no feedback offer.

## 4 · Device workflow

Test-hook build, same tab, every step a product command: Rahul requests a transfer (ST-18, "With
your Institute Admin") → Meera: IA-01's device row → Device requests (IA-18 "Waiting on you") →
Review (IA-19) → "Forward to BITS" (DL-1) → Arjun Mehta: Operations › Device transfers (SA-18) →
Review (SA-19) → "Approve transfer" (DL-1) → Rahul's My device: Approved, authorised device
GIT-VR-07 → Meera's Device requests: "Decided · approved by BITS". One DTR record throughout; the
Institute Admin can only forward, the Super Admin can only approve (T-32: no decline). Nothing is
shipped or provisioned. **In a product build the chain cannot start**: no product action records
an authorised device (no device registry is designed: D20b, P3-03 open) — the seed supplies one.

## 5 · Completion and feedback behaviour

- "Completed" shows only when the service's progress view carries a completion record (system
  completion handler; here only the seed and the CI runtime seam write one). No launch, resource,
  visit, time or feedback marks anything; no "I have finished" control; "In progress" only from
  runtime activity. TE-3 is **unsigned**: there is no runtime page or simulator — the WEB launch
  opens the published delivery link (sample links end `.example`).
- Feedback is offered and accepted only when `getFeedbackState` for **that** format is eligible
  (its own completion); a completed WEB never offers VR. One record per Student × experiment ×
  format; sent feedback is read-only; no staff view (T-25). Unit, contract and browser tests assert
  each of these.

## 6 · Policy handling (nothing decided by the build)

| Open decision               | What the build does                                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| T-12 / P3-01, TE-3          | Completion only from the system record; no runtime route; the product build never reaches In progress / Completed                         |
| T-13                        | Per-format words only; no %, no experiment verdict; opening a resource is never progress                                                  |
| T-14, P3-03, D20b, OD-B3-01 | Setup steps are information; no delivery promise; device first recorded only by the seed; several devices → listed, no request            |
| T-15, P3-05                 | Resources open in a new tab and read "Opened"; seeded per experiment, no authoring                                                        |
| T-16                        | "Nothing is locked"; the undrawn "Next step" choices are a provisional rule (`ST-05.next-step`)                                           |
| SACC-14                     | Withdrawn / ended access keeps the ST-19 page; "earlier work" actions stay unrendered (no rows from the service)                          |
| P3-02 / AD-22               | Feedback eligibility as the service answers it                                                                                            |
| P3-04                       | IA-20 shows the service's figures per experiment × format; never summed; a course with several experiments says "Shown per experiment"    |
| P3-06 / O-08, P3-07 / O-11  | My device offered to a Student given AR/VR/MR (or with an open request); direct visit otherwise → in-shell not-found; IA-01's row → IA-18 |
| DEV-17 → **DEV-43**         | The Institute Admin's Requests count is not drawn while what it counts is open                                                            |
| OD-B3-03                    | After an approval "Request a device transfer" shows again (the service allows a new request); B3-07 f6 draws none                         |
| OD-B3-09, T-03, T-07        | An approved renewal / more licences never claims a plan change; "Information requested" has no reply flow                                 |
| D7 / T-06                   | No licence counting anywhere; waits are supplied                                                                                          |

140 new provisional state-copy entries (seven `copy/state-copy-*.ts` files), every one with its
basis and decision ids; decision ids never appear in visible copy.

## 7 · Visual comparison

Each group captured its frames beside the board at the frame's width × 900 (scratch board-capture
tool; not committed): hub 0.5–0.8 % (2.7–4.7 % where no fixture holds the drawn state), formats
0–0.4 %, progress/feedback 0–2.4 %, My device 0–0.24 %, IA requests 0–1.9 %, Usage 0.04–0.43 %,
operations 0–3.8 % (pixels differing visibly). Every reviewed remainder is fixture data (dates,
MEC-523 vs ME ZG523, sample rows), DEV-21 (no Assessments item / tab), a live confirmation, a
capture artefact, or a recorded choice: one h1 per page where B3-03/04 draw none (accessibility),
ST-16's rating radios and error-summary links sized for keyboard and target-size rules, B3-07 f6
(OD-B3-03), SA-18's tab strip from B3-11.

Parity suite: the 17 existing comparisons whose sidebar or whole frame now shows the Phase-3
destinations (B1-10, B7-01/02/03 f0, board 05 Student / Institute Admin / Super Admin, board 07
f0/f1/f3) are measured under `-phase-3` names (DEV-21; the Institute Admin's also **DEV-43**, new,
owner review); their earlier pins stay unchanged as the record; 17 pins added (150 → 167), none
changed. Foundation and parity specs that used `/student/progress`, `/institute/requests` or
`/admin/operations/device-transfers` as "unbuilt" addresses now use unbuilt ones.

## 8 · Independent review (one bounded pass)

No policy violation, no high-severity defect. Fixed with tests: ST-06 / ST-08 opened the new tab
after the service answered (a popup blocker could block it while the page said "opened") — the tab
now opens blank in the click and gets the link, or closes; a blocked tab reads "didn't open";
ST-06 could leave a row on "Opening…" after an unexpected rejection; SA-19 titled the page with
the raw address before its read; ST-01's "Give feedback" found its experiment by name (now by id).
Integration fixes: XS-03's return words named any Phase-3 page "Requests". Recorded for the owner:
a refusal while sending feedback (e.g. a pause meanwhile) re-reads and shows the not-found pattern
(`ST-16.refused`), discarding the typed answers.

## 9 · Verification and verdict

`pnpm verify`, 16 Oct 2026, run `2026-10-15T19-26-31-571Z-verify`: **VERIFY PASSED** in 1,438 s
(the first run failed only in nine Phase-0 foundation browser tests that listed the Phase-2
sidebar and account menu; corrected, repeated once).

| Step       | Result                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| format     | prettier clean                                                                                                                                   |
| repository | 32 checks · handoff 178/178 · audit evidence 36/36 · v46 copies 27/27 · scans clean                                                              |
| workspace  | build 12/12, typecheck/lint/test 40/40 · **6,173 unit tests** (2B: 5,553): web 3,131, contracts 748, sample-platform 245, ui 832, domain 787     |
| bundle     | 1,285 product files, 0 test-seam sentinels; the test-hook build carries the bridge (6/6 markers, incl. the runtime seam)                         |
| browser    | **2,442 passed** (2B: 2,234; web 1,303), 0 failed, 650 skipped (width-gated and the 36 deferred flow skeletons); Chromium only                   |
| parity     | 95/95 tests · 764 comparisons: 623 within, 141 registered, **0 unregistered**, 0 masked; DEV-43 new (owner review); pins 150 → 167, none changed |

Phase-3 browser specs (`e2e/phase-3/`, 9 files, 4 widths): the two demonstrations and the seven
groups' state suites (each state through `checkState`: axe WCAG A/AA, one h1, visible focus, 24 ×
24 targets, no sideways scroll; dialogs keyboard-checked). After verify only the deviation
register's text was refreshed (DEV-21 wording, `DEVIATIONS.md` regenerated from that run).

**Verdict: CONDITIONAL PASS** — all 15 Phase-3 ids built, connected on the one world and verified
(62 of 123 designed ids). Conditional on: TE-3 unsigned and T-12 open (the product build reaches
no In progress, Completed or feedback — only the CI runtime seam does); P3-03 (the device chain
starts only from a seed-supplied authorised device); the provisional state copy and PC-50;
DEV-43 and the other open register entries; Chromium-only and same-machine parity.

## 10 · Owner decisions outstanding

TE-3 (sign, or keep "Launch WEB" opening the published link only); T-12 / P3-01 (the completion
event); P3-03 (how an authorised device is first recorded — blocks the device chain in product
builds); P3-02; SACC-14 (earlier work); DEV-43 (Institute Admin Requests count); OD-B3-03 (request
again after approval); P3-04 per-course figures for several experiments; `ST-16.refused`; 140
provisional state-copy entries; PC-50; and the earlier T-11 (before any hosted demonstration),
T-24, Chromium-only and same-machine parity.
