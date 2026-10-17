# Phase 7 — final integration, functional demo readiness and handover

|             |                                                                                                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Base        | `24fe53e` (Phase 6) on `v2/frontend-v46`; safety bundle `~/Downloads/XR-frontend-v46-24fe53e-phase7-pre.bundle` (+ `.sha256`; `git bundle verify` OK, restore-tested to `24fe53e`, handoff 178/178 in the restored tree) |
| Authority   | Owner authorisation of Phase 7 and the additional authorisation of TE-3 / T-12, P3-03 and TE-6, 17 Oct 2026 — for the **local prototype build only**; their production requirements stay open                            |
| Walkthrough | [`MANAGER-WALKTHROUGH.md`](MANAGER-WALKTHROUGH.md) — the 10–15 minute live demonstration, identities, actions, expected results and start-up                                                                             |

## 1 · What was built

**TE-3 / T-12 — sample WEB activity.** In a local prototype build, "Launch WEB" (ST-08) opens
`/prototype/web-activity` in a new tab. The page is labelled "Simulated for this prototype" and says
that no real simulation or XR runtime runs. The activity has three steps:

1. Three trials at different rig levels, with deterministic readings.
2. A check question, which must be answered correctly.
3. **Finish activity**.

The launching tab holds the launch in memory: never a world record, never browser storage. The
activity reports to that tab over a same-origin `BroadcastChannel` (`platform/sample-web-relay.ts`).
Reports go through `SamplePlatform.sampleWebRuntime`. The platform accepts the completion only
after `opened` and three `saved` reports, the activity's own steps. The system runtime-report handler writes them
with `sample-standin` provenance (`handlers/runtime-report.ts`, moved out of the stand-ins so the
product path reaches it, as TE-4 did). Each report gets the same checks a real runtime's would get:
the format must be open to the Student now, and the first completion stands.

- Opening the activity records activity ("In progress"), and each trial saves progress.
- Only **Finish**, after the conditions are met, records the completion.
- A launch, a visit or an unknown launch never completes WEB. A withdrawn grant refuses the report.

Feedback then follows the existing per-format rule. Test-hook builds keep the published link and
their CI runtime seam.

**P3-03 — pre-authorised sample device.** The local prototype build's starting world carries one
seeded fact: GIT-VR-03 (B3-07) is authorised for the Godavari Student whose institution e-mail is
`rahul.verma@godavari.edu.in`. It applies once that Student exists, which happens in Flow B. The
reads and approval use `authorisedDevices` / `authorisedDeviceOf` (world queries), so the drawn
chain ST-18 → IA-18/19 → SA-18/19 runs through the product on one shared transfer record. The
approved record then wins over the fact. Nothing registers, provisions or manages a device. Other
builds and tests supply no device.

**TE-6 — local browser persistence** (ADR-0004 amendment). The world is kept as one versioned
`localStorage` snapshot (`persistence/snapshot.ts`) with:

- the format, the schema and version, the build's compatibility fingerprint, the lineage, the world
  version and a checksum;
- a damaged, foreign or older save rejected for a clean start.

Nothing sensitive is kept: no password, credential, session or command receipt. Request status
tokens are withheld, and tickets stay in `sessionStorage`, bound to the page load. The tabs of one
browser share the world, each with its own session: Web Locks serialise writers, a command adopts a
newer save first, and the `storage` event adopts it elsewhere. **Reset demo data**
(`/prototype/reset`) asks once (DL-1, destructive), then starts every tab again, signed out. The
owner's wording carries a recorded `demo-wording` scan exception (one string, `copy/prototype.ts`).
Both prototype pages are served by a local prototype build only.

**Flow tests.** The 36 deferred `test.fixme` skeletons are gone. `e2e/flows/registry.ts` `COVERAGE`
names the product-build test for each entry, and `skeletons.spec.ts` checks that each one exists and
uses no test hook.

**Bounded review (one, of the new and changed behaviour): no high-severity findings.** Six findings
were fixed, each with unit tests:

- (M) A Strict-Mode stale "hello" timer could disconnect the activity in `next dev`. Its questions
  are now dropped on cleanup.
- (M) A browser that refuses writes made a reload loop: a missing save was read as a reset. A
  missing save is now foreign only if this page load has stored one.
- (L) A restored page load no longer writes back on the way in, so a concurrent reset or newer save
  stands. A started page also adopts a save made before it listened.
- (L) A tab gets back only the token of the very request it created (same address and creation).
- (L) The platform now refuses a completion until the activity has opened and saved its three
  trials, so a hand-posted message cannot skip them.
- (L) The prototype pages are gated at build time (any other build answers not-found), and a
  refresh after an adoption cannot raise an unhandled rejection.

**Test race fixed.** Under verify's parallel load, the first verify run failed on one pre-Phase-7
component test (`student/all-experiments.test.tsx`, ST-04 after a withdrawal). It waited for "no
rows", which is also true while the tab is loading, and then read the text. It now waits for the
empty state itself; the assertion is unchanged.

**Defect fixed during integration.** In the production bundle the minifier inlined the activity
hook's default channel factory into a fresh closure on every render, so the hook reconnected on
every render. The factory is now held in a ref.

## 2 · Flows A–F on the product build

`e2e/flows/walkthrough.spec.ts` runs A → B → C → Device → D → E → F on ONE sample world, through the
screens, in three tabs that share it:

- the requester (never signed in);
- the Super Admin;
- a desk where the other roles sign in and out.

Each flows.json step is one `test.step` and asserts the board's role-relative words. A change made
in one tab is read in the others. A reload keeps the world and signs the tab out. At the end no
password or session is in storage. Every step passes. Detail:

| Flow   | Status on the product build                                                                                                                                                                                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | **Pass.** Discover → select → request → Super Admin approves (External) → TE-4 sample payment confirmation → Access active (ACC-0107); the requester's open status page follows the decision made in the Super Admin's tab                                                          |
| B      | **Pass.** Institute Admin assigned → IA-01/02/03 → Student added and given access → ST-01/02/05/07; withdrawal (B-withdraw) in `package-2a/demonstration.spec.ts`                                                                                                                   |
| C      | **Pass.** Resources → WEB launched → sample activity → In progress → finished → Completed ("Reported by the simulation at …") → feedback only then → Feedback on WEB sent; FA-21 shows the completion                                                                               |
| Device | **Pass.** Pre-authorised GIT-VR-03 → request → Institute Admin forwards → Super Admin approves → GIT-VR-07, one record across three roles                                                                                                                                           |
| D      | **Pass.** Faculty creates and configures (FA-07 … FA-11, "Immediately after marking") → Student attempts and submits → Faculty marks and confirms → Student sees "You passed"                                                                                                       |
| E      | **Pass.** Vendor submits → Reviewer returns with a reason → Vendor revises and resubmits (revision 2) → Reviewer approves with outcomes → Content Manager publishes ("Publishing gave no one access") → public catalogue lists it; the institution's access is unchanged            |
| F      | **Pass.** Content Manager proposes a correction → Reviewer approves (nothing released) → Super Admin releases → public page and the entitled Student see the new version; Hold and Lift hold, Return and Withdraw in `flows/alternates.spec.ts`; Release vs Hold on separate worlds |

Governance and operations (academic structure, role scopes, support resolution and reopening,
access ending) run on the product build in `phase-6/demonstration.spec.ts`.

## 3 · The 36 previously deferred flow cases

| Cases                                                           | Status                                                                                                                                                                |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 27 flows.json steps (A1 … F4, Device 1–3)                       | **Active** — `test.step`s of `flows/walkthrough.spec.ts` (product build)                                                                                              |
| E-alt1, E-alt2, E-alt3, Lift hold, F-alt return, F-alt withdraw | **Active** — new `flows/alternates.spec.ts` (product build, one world each; a refused empty reason in each)                                                           |
| A-info, B-withdraw, Hold                                        | **Active** — already driven on the product build by `package-1e/journey.spec.ts`, `package-2a/demonstration.spec.ts`, `phase-6/demonstration.spec.ts`; now registered |

None remains deferred. Some board words cannot be reached on the product build. They stay asserted
on the test-hook build and need an owner decision before the product can show them:

- **"Under review"** (A2, SA-02 / PU-10). AD-14 says a review start is seeded or test-only.
- **"Result not released yet"** (D3, ST-11 / ST-14). It needs a release rule that is not immediate
  and a moving sample clock (TE-5).
- **VR "In progress" / "Completed" / "Give feedback on VR"** (C2, C3). No headset runtime exists:
  TE-3 covers WEB only.

## 4 · Demo-only capabilities (implemented and authorised)

| Id               | What the product build does                                                                                  | Production requirement |
| ---------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------- |
| TE-3 / T-12      | Sample WEB activity; its own completion is recorded by the system completion handler                         | Open (T-12)            |
| P3-03            | One pre-authorised sample VR headset for Rahul Verma (seeded fact)                                           | Open (D20b)            |
| TE-6             | Versioned browser snapshot, per-tab sessions, Reset demo data                                                | Open (AD-07 / P0-02)   |
| TE-4, P4-01, M-3 | Earlier owner-approved stand-ins, unchanged: payment confirmation, answer-key marking, drawn-default routing | Open                   |

## 5 · Verification

`pnpm verify`, run `2026-10-16T23-15-00-676Z-verify`: **VERIFY PASSED** in 2,887 s. This was
the second run: the first (142 s) stopped at the workspace step on the ST-04 test race described in
§1.

| Step       | Result                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format     | prettier clean                                                                                                                                                                                                               |
| repository | 32 checks · handoff 178/178 · audit evidence 36/36 · v46 copies 27/27 · scans (0 unexpected, 5 under recorded exceptions — the new `demo-wording` one is the owner's "Reset demo data") · deny-list · fence wiring           |
| workspace  | build 12/12, typecheck / lint / test 40/40 (`--force`) · **9,306 unit tests** (Phase 6: 9,269): web 6,156, ui 832, domain 787, contracts 781, config 356, sample-platform 320, api 38, validation 20, testing 11, database 5 |
| bundle     | 2,118 built product files, 0 test-seam or harness sentinels; the test-hook build carries the bridge (6/6 markers)                                                                                                            |
| browser    | **3,145 passed** (web 2,006, specimens 1,071, testing 68), **0 failed**, 559 skipped (width-gated; no `fixme` remains); Chromium only. A separate full web run before the review fixes: 2,006 passed / 0 failed (43 min)     |
| parity     | 95/95 tests · 770 comparisons: 641 within, 129 registered, **0 unregistered**, 0 masked · no open owner decision blocks parity; no pin changed (no designed screen changed)                                                  |

Phase-7 browser specs:

- `e2e/flows/` (product build, 1440):
  - the shared-world walkthrough (27 steps, three tabs, about 3.5 min);
  - the six alternates (a refused empty reason in each);
  - the register (36 entries → existing product-build tests).
- `e2e/phase-7/prototype.spec.ts` (TE-6 / TE-3):
  - a reload keeps the world, signed out, with the ticket not kept;
  - tabs share the world, each with its own session;
  - a damaged save is rejected;
  - "Reset demo data" asks once and restarts every tab;
  - the activity page is not connected without its launching tab;
  - the activity page's steps meet the screen checks at 1440, 1024, 768 and 375.
- `e2e/phase-3/demonstration.spec.ts` now walks the TE-3 activity ("In progress") and the P3-03
  device at four widths.

**123 of 123 designed screen ids remain implemented.** Phase 7 added two non-screen support pages
and changed no designed screen. Every one of the 123 ids is named in product source and in a
browser spec (ledger `SCREEN_PHASE`, 123). No parity pin changed.

**Verdict: CONDITIONAL PASS for manager-demo readiness, as a LOCAL demonstration.** Every critical
journey — Flows A–F, the device chain, governance and operations — completes through the product
build's normal navigation, with no test-only control. The conditions:

- It runs on this Mac only (`next start`), on sample data in one browser.
- It is not deployed and not production-ready.
- A few board words remain unreachable on the product build (§3).
- The owner reviews of earlier phases stay open.

## 6 · Repository and backups

Work stayed in `/Users/mymac/Desktop/AR-VR-frontend-v46` on `v2/frontend-v46`, with no push, merge,
reset or remote change. Before the work, the safety bundle `XR-frontend-v46-24fe53e-phase7-pre.bundle`
was made, verified and restore-tested. After the commit, checked:

- `design/handoff-v46` is 178/178.
- The original checkout `/Users/mymac/Desktop/AR-VR` is still at `1b090c9`. Its 98 uncommitted
  paths match the 12 Oct 2026 backup: the status list, and the SHA-256 of all 98 files from
  `MANIFEST.json`.
- The backup's own `SHA256SUMS.txt` is OK (6/6).
- The separate Claude Design prototype (`~/Downloads/XR-Platform-Design-Prototype`, 57 files) is
  byte-identical to the start of the phase.
- The post-commit bundle is `~/Downloads/XR-frontend-v46-<sha>.bundle` (+ `.sha256`), verified and
  restore-tested.
