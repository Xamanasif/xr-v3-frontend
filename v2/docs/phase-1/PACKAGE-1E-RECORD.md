# Phase-1 Package 1E — Cross-Role Integration, Regression Corrections and Handover (record)

|                   |                                                                                                                                                                                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Package           | Phase-1 Package 1E (owner authorisation, 15 Oct 2026; "Authorize Package 1E ONLY"): integration of the 21 Phase-1 and 5 Phase-0 screen ids, two narrow corrections (SA-03 stale revision, board-11 tab strip), regression proof and the Phase-1 handover                                                                                   |
| Branch / worktree | `v2/frontend-v46` at `/Users/mymac/Desktop/AR-VR-frontend-v46`, from `7b0b7a1` (Package 1D, conditionally accepted)                                                                                                                                                                                                                        |
| Design authority  | `design/handoff-v46/` (frozen, 178/178): B1-01 … B1-11, B7-01 … B7-04, boards 10, 11 and 12, B8-04 / B8-06; `handoff/flows.json` (Flow A, B1)                                                                                                                                                                                              |
| Safety backup     | `~/Downloads/XR-frontend-v46-7b0b7a1.bundle` (branch `v2/frontend-v46` at `7b0b7a1`, complete history, 57 commits; `git bundle verify` OK; restore test: clone at `7b0b7a1`, tree `104aface…` equal to the worktree's, `git fsck` clean, handoff 178/178; SHA-256 `cecd93c6…93a8`, sidecar `.sha256`), made and verified before any change |
| Environment       | macOS (Darwin 25.5.0), Node 24.21.0, pnpm 12.3.4, Playwright Chromium only                                                                                                                                                                                                                                                                 |

Like the 1A–1D records, this one is kept outside `docs/v46/` (the audit evidence there stays
byte-identical). The Phase-1 verification and handover is `PHASE-1-HANDOVER.md`, beside it. No
screen, route, service method, permission or business rule was added, and nothing of Phase 2 was
started.

## 1 · The SA-03 stale-revision correction (owner §3)

**Before** (Package 1A): the panel sent the request's revision as read when the decision was sent
or confirmed, and built the command's inputs (route, narrowed items, licences, term) from the page
as read at that moment. A change shown meanwhile — the review start, recorded while a decision was
being composed or a confirmation was open — was therefore not refused: the decision went out with
the newer revision and was accepted.

**Now** (`features/admin/sa-03-request-decision/request-decision.tsx`, `decision-view.ts`):

- A decision keeps the request's revision from when it **began**: the first change to the panel's
  form, or the press that sends it or opens its confirmation, whichever comes first. It is kept
  through the confirmation and never replaced by a newer read.
- The command is built once (`decisionCommand`) from the page and the decision as they stand when
  it is sent or its confirmation opens; an open confirmation keeps that page, decision and command,
  so **what it names is what it sends**. Closed, the dialog names the panel's current decision, as
  before (its DOM is unchanged in every state the parity suite captures).
- A refusal because the request moved on (`stale-version`; decided, paused or not adjustable
  meanwhile; not found) writes nothing — the service's existing check decides — and the page is
  read again. The decision being composed stays in the form while the request is still open, its
  revision is released, and the next attempt begins from the request as now shown (no refusal
  loop). Focus goes to the decision panel's heading, requested by the panel and moved in an effect
  that runs after the confirmation's own close (SA-07's pattern). Field refusals keep the revision;
  `unavailable` changes nothing (state-copy `SA-03.unavailable`, unchanged); an open policy (T-03,
  REQ-19) writes nothing, the page is read again and the decision and focus stay as they are — as
  before Package 1E (state-copy `SA-03.policy-open`, unchanged).
- A change made elsewhere that ends the open panel while one of its controls has focus (the
  request decided, or its institution paused, in another session) no longer drops focus to the
  page: the panel reports it as it goes (a layout cleanup, before its elements leave the document)
  and focus moves to the panel's heading; an open confirmation's own fallback is the same heading.
- The rule is registered as provisional state copy `SA-03.moved-on` (P1-21; no words, as
  `SA-07.moved-on`). No permission, eligibility, lifecycle rule or drawn word changed.

Regression tests — seven of the eight new behaviour tests **fail on the `7b0b7a1` component**
(verified by running them against the committed file): three accepted the stale decision (world
version 1 → 2), one let a newer read change what an open confirmation named and sent, three lost
focus to the page body; the eighth guards the unchanged open-policy behaviour and passes on both.

| Test                                                                                                                        | Where                                                                    | Change made meanwhile                               |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------- |
| Request more information composed before a change: refused as stale, nothing written, the question kept                     | `request-decision.test.tsx` (jsdom, real composition root, sample world) | AD-14 review start (CI-only seam), panel open       |
| A confirmation open while the request changes: keeps its revision; refused                                                  | same                                                                     | review start, dialog open                           |
| A smaller scope confirmed after a change: refused, its scope kept                                                           | same                                                                     | review start, panel open                            |
| Decided in another session while the confirmation is open: the decided panel, focus on its heading                          | same                                                                     | another Super Admin session's decision, dialog open |
| Paused in another session while the confirmation is open                                                                    | same                                                                     | another session's pause, dialog open                |
| Paused in another session while a question is typed                                                                         | same                                                                     | another session's pause, panel open                 |
| The confirmation sends the decision it names, the page read again with other facts meanwhile                                | same                                                                     | a newer read written into the cache, dialog open    |
| An open policy (REQ-19): nothing written, the decision kept, focus back on its button (as before 1E)                        | same                                                                     | —                                                   |
| The command a decision sends (3 cases: revision, smaller scope inputs, route)                                               | `decision-view.test.ts` (pure)                                           | —                                                   |
| The same three journeys through the screen, at 1440, 1024, 768 and 375                                                      | `e2e/package-1e/decision-revision.spec.ts` (test-hook build)             | `startReview` seam; `actAs` (another session)       |
| Stale `approveRequest`, `approveSmallerScope`, `requestMoreInformation` at the port: `stale-version`, the record deep-equal | `sample-platform` `handlers/access-request.test.ts`                      | review start                                        |

## 2 · Board 11's 375 px tab strip (owner §4)

**Symptom.** `11-tabs-375-faculty-courses-current` failed in one of three verify runs since
Package 1C (1,777 px). The failed capture shows the strip **unscrolled** (`scrollLeft` 0, "Faculty
c…" cut at the edge); of the four strips only "Faculty courses" needs a scroll, so the other three
match either way.

**Method.** A temporary diagnostic spec (kept in the session scratchpad, never committed) loaded
the real specimen page on the parity suite's own capture network and recorded, at every alignment
(`scrollTabIntoView` reads the strip's computed style first), the strip's overflow, scroll and
sizes, the font set's status and loaded faces, and every `fonts.ready` read and resolution; then
the same loads with one input delayed at a time (the product CSS, the font CSS, the woff2 files,
the JS).

| Candidate cause                      | Evidence                                                                                                                                                                     | Verdict       |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Font readiness                       | Every failing load, and only those: `fonts.ready` resolved after the first font batch (weight 400) while the tab labels' 600/700 faces loaded in a later batch               | **Confirmed** |
| Delayed (single) alignment           | The hook re-aligned once, at that first `ready`, with fallback widths (`scrollWidth` = `clientWidth` = 343: nothing to scroll); the later batch widened the strip to 434 px  | The mechanism |
| Hydration / capture before hydration | Alignment ran in every load; the failing item is the fourth compared, seconds after the page loaded                                                                          | Rejected      |
| CSS not applied at alignment         | `overflow-x: auto` and the 48 px scroll padding were in place at every alignment of every load                                                                               | Rejected      |
| Scrolling (a later reset)            | No scroll change after the last alignment in any timeline                                                                                                                    | Rejected      |
| Capture harness                      | The harness waits for `fonts.ready` and checks every Public Sans weight the element uses before capturing: the fonts were loaded; the strip had simply never been re-aligned | Rejected      |

| Loads on the capture network (375 × 900) | Before the correction                | After the correction  |
| ---------------------------------------- | ------------------------------------ | --------------------- |
| No delay                                 | 0 of 104 misaligned                  | 0 of 64               |
| Product CSS delayed 400 ms               | **14 of 64** misaligned (14 exposed) | 0 of 128 (17 exposed) |
| Product CSS delayed 1,500 ms             | **7 of 64** misaligned (7 exposed)   | 0 of 128 (17 exposed) |

"Exposed" = the strip's first alignment came before the bold face and a font batch then finished
without it — the condition the single re-alignment misses. Before: every exposed load failed (21 of
21). After: none of 34 did.

**Correction** (`@xr/ui` `data/tabs.tsx`, `useCurrentTabInView`): re-align after **every** batch of
web fonts that finishes loading (`FontFaceSet` `loadingdone`), still skipped once the strip has
been scrolled by someone else; the listener is removed on unmount. The same rule board 11's own
script states ("re-aligns after the font swap"), without its fixed 400 ms. Unit test
`tabs.test.tsx` "re-aligned after every batch of fonts, not only when `fonts.ready` first
resolves" models the measured two-batch order and **fails on the old hook**; the 22 earlier tab
tests pass on both.

**Stability.** After the correction: the full specimens parity suite once (independent run 1),
then six concurrent independent runs of `b11-responsive.parity.ts` against one specimens server
(load comparable to `pnpm verify`'s parity step), and the final `pnpm verify` — every
`11-tabs-375-*` comparison within tolerance at **0 px** with the product fingerprints of
Package 1D's passing run (`88c49bf7…` for Faculty courses). No board, pin, mask or tolerance was
changed, no sleep added, the comparison kept. Residual risk: the fix covers font batches; a strip
whose width changed for another reason after mount would not re-align (not observed).

## 3 · The connected Phase-1 proof (owner §5)

`e2e/package-1e/journey.spec.ts` — the **product build** (no test hooks, no boot descriptor, the
spine-start world the build composes), **one document** per test, at 1440, 1024, 768 and 375 (12
tests, all passing). Each step is an ordinary product interaction unless marked.

| #   | Step (flows.json)                                                                                                                                                                                               | How                                                                        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | Public landing (PU-01)                                                                                                                                                                                          | the only document load                                                     |
| 2   | Areas → Mechanical & Manufacturing → Thermodynamics & Heat Transfer → catalogue → Shell-and-Tube (PU-02 → 03 → 05 → 04 → 06)                                                                                    | links                                                                      |
| 3   | WEB + VR into the selection (A1; availability, never access)                                                                                                                                                    | the panel                                                                  |
| 4   | Your selection (PU-07), edited: VR off and on, Remove, Undo                                                                                                                                                     | the record's controls                                                      |
| 5–6 | PU-08 details → review → Submit → PU-09 "REQ-0042", status address `/requests/rq-…` (A2)                                                                                                                        | the form                                                                   |
| 7   | "Check request status" → PU-10 "Submitted" (the session-held ticket, ADR-0009)                                                                                                                                  | PU-09's link                                                               |
| 8   | The Super Admin signs in on this tab → SA-01 with REQ-0042                                                                                                                                                      | XS-01 (sample sign-in, P1-01)                                              |
| 9   | SA-02 → SA-03: Approve, External, confirm (A3)                                                                                                                                                                  | sidebar, row, panel, dialog                                                |
| 10  | Sign out; the requester's PU-10 "Approved — payment required"                                                                                                                                                   | **test navigation** (below)                                                |
| 11  | PU-12 → Continue to payment (A4)                                                                                                                                                                                | **development-only stand-in** (TE-4): the sample provider confirms at once |
| 12  | PU-13 "Access active · Access plan ACC-0107"                                                                                                                                                                    | —                                                                          |
| 13  | The Super Admin: SA-06 "External · ACC-0107 · 1 course · 1 experiment", "Needs one"; SA-07: one plan (ACC-0107, Shell-and-Tube, 120, Yearly), People "0 students · 0 Faculty" — no Student access was created   | sign-in, sidebar, search, row link                                         |
| 14  | Assign Institute Admin (B1): the drawn check, then Meera Iyer with a work e-mail nobody else holds (§5)                                                                                                         | the dialog                                                                 |
| 15  | Meera Iyer signs in: her workspace (`/institute/help`), no Super Admin destination; her institution's request readable at its address; SA-07, SA-03 and SA-01 answered "This page isn't part of your workspace" | XS-01; the addresses by **test navigation**                                |

Also in the product build, four widths: an **internal approval** of the same request — access
active at once, ACC-0107, no payment step, its payment address returns to the status, SA-06
"Internal · ACC-0107" — and the **A-info alternate** (information requested, the question shown to
the requester, no reply field: T-03).

- **Test navigation** — the requester's way back to their status page. No product page lists a
  request (R01 open), and a typed address loads a new document, which resets the in-memory world
  (TE-6): the test opens the address PU-09 handed out through the app router, as a saved link
  inside the app would. It writes nothing; the service still decides who may read.
- **Development-only stand-in** — TE-4: confirmation on start in the local prototype build only;
  staging and production builds leave the payment unconfirmed; no money moves.
- **CI-only fixtures, not reachable through any ordinary interaction**: the AD-14 review start (the
  requester's "Under review"), the provider's pending and failed outcomes (`e2e/package-1c/status.spec.ts`),
  and the concurrency cases of §1.

## 4 · Security, permission and request access (owner §5)

| Scenario                                            | Evidence (new in 1E in bold)                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A reference or opaque route id alone grants nothing | `e2e/package-1c/access.spec.ts` (test-hook, 4 widths; product build: server HTML holds no request); contract `request-access:session-gate`                                                                                                                                                                                                       |
| Foreign sessions and institutions                   | `access.spec.ts` (another person in the tab, another institution's Institute Admin); adapter tests; **journey step 15**                                                                                                                                                                                                                          |
| A copied or forged ticket                           | `access.spec.ts` (copied storage, forged entry, reload); **adapter: a visitor's own ticket opens no other request and pays for none; a well-formed ticket planted after the world started — this world, a real token — opens nothing** (storage is read once, when the world starts; in the browser the world instance is minted at random then) |
| The Super Admin's answers carry no ticket           | 1C adapter test (decision page and receipts); **adapter: `listRequests` and an `approveSmallerScope` receipt; browser `security.spec.ts`: SA-02 and SA-03 pages and the bridge's answers hold no ticket** (4 widths)                                                                                                                             |
| Sign-out clears identity-specific query data        | `session-store.test.tsx`; `e2e/package-1a/session.spec.ts` (1440); **`security.spec.ts` at 4 widths: none of the Super Admin's answers cached after sign-out, and Back shows nothing of his**                                                                                                                                                    |
| Wrong-workspace routes                              | `e2e/foundation/workspace-guard.spec.ts` (42 pairs, 4 widths); **journey step 15**                                                                                                                                                                                                                                                               |
| Repeated requests and payments                      | contract `request-access:duplicates`; **adapter: a repeated command id answers the first receipt for `submitPublicRequest` and `approveRequest` (one request, one decision, no second write); browser: Submit pressed twice sends one request, Continue to payment pressed twice starts one payment**                                            |
| Stale approval and student-status commands          | **§1 (approval: port, jsdom, browser)**; student status: 1D (`institutions:student-revision`, SA-07 browser)                                                                                                                                                                                                                                     |
| Institution access never creates Student grants     | invariant 8, one-world steps A3–B1, contract `flow:A`; **journey step 13 (SA-07 People: none)**                                                                                                                                                                                                                                                  |
| No launch or activity completes a format            | invariants 2, 3, 11; `world.test.ts`; no Phase-1 screen offers a launch                                                                                                                                                                                                                                                                          |

The 12 domain invariants are checked by the sample pipeline on every committed command
(`pipeline/invariants.ts`), so every browser journey above ran under them.

## 5 · The Institute Admin e-mail collision (owner §6; T-11 / P1-01)

Reproduced, not resolved (`sample-platform` `handlers/institution.test.ts`, "T-11 / P1-01 open"):
the sample sign-in resolves an e-mail to the first holder in a fixed order — people, Institute
Admins, role holders, Super Admins — and `assignInstituteAdmin` checks a work e-mail for its form
only. Assigning Sahyadri's Institute Admin, on the walk after Flow C:

| Assigned work e-mail                               | What the sample sign-in then does                                                              |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| The Super Admin's (`arjun.mehta@wilp.example`)     | signs the Super Admin in as Sahyadri's Institute Admin — locked out of `/admin` until a reload |
| A role holder's (the Content Manager's)            | the same: her sign-in lands as the Institute Admin                                             |
| Another institution's Institute Admin (Meera Iyer) | she now lands in Sahyadri's workspace                                                          |
| A Student's (Rahul Verma)                          | the Student keeps signing in; the new Institute Admin never can                                |

No record is overwritten (the collision is the resolution only). The approved demonstration uses
Meera Iyer's e-mail on the spine-start world, where nobody holds it (a test pins that). **Owner
decision required (T-11 / P1-01):** whether Assign must refuse a work e-mail already held by any
sample person (and with which words), or how the sample sign-in resolves a shared e-mail.
**Blocker** for any hosted demonstration that lets reviewers assign arbitrary e-mails, unless the
owner approves such a rule.

## 6 · Accessibility and four widths (owner §9)

`e2e/package-1e/accessibility.spec.ts` closes the gaps the coverage review found: in SA-03's
external and smaller-scope confirmations and SA-07's Assign dialog, Tab and Shift+Tab stay inside
the dialog round its controls, Esc is Cancel and focus returns to the trigger (world unchanged),
axe and 24 × 24 targets with the dialog open; SA-03's composed smaller-scope state and an unknown
reference (`checkState`); SA-07's Restore dialog (the same keyboard checks) and the restored state;
the PU-01 area explorer swiped at 375 px; PU-08 "Until a fixed date" with its end date and the refused review (focus
on the error summary). The journey runs `checkState` (axe WCAG 2.0 / 2.1 / 2.2 A and AA, one
level-1 heading, no invisible focus target, targets, no developer surface, no Slice-1 markup, no
sideways scroll) on every page it opens, at all four widths, with pointer clicks reached by the
wheel. Mobile menus: the public menu sheet and the workspace drawer are used by the journey below
1024 px. No earlier test was disabled or weakened.

## 7 · Visual parity (owner §8)

No product markup changed for any captured state (SA-03's closed dialog and the tab strips render
as before), so no pin, tolerance, mask or register entry changed. Independent run 1 (both suites,
15 Oct 2026): **95/95 tests, 764 comparisons** (19 whole frames), **623 within tolerance, 141 on
the register, 0 unregistered, 0 masked**, 136/136 board references, 0 external requests — equal to
Package 1D's final figures; the final verify: §9. The open entries and their decisions are in
`PHASE-1-HANDOVER.md` §7.

## 8 · Independent review

Before the corrections, a separate read-only agent mapped the existing Phase-1 tests against the
owner's §5 and §9 lists; the gaps it found are what §§3–6 close. After them, one bounded review by
another read-only agent (it re-ran Prettier, ESLint, `tsc` for web, ui and sample-platform, the
repository scans, the copy and state-copy tests, the SA-03, admin, queries and platform tests, all
of `@xr/ui` and the sample-platform handlers; no Playwright): **no high or medium finding** — no
path sends a newer revision, no refusal loops, the confirmation's content matches its command, the
tabs hook is sound. Its findings, verified here and all addressed:

| #   | Finding                                                                                                                       | Outcome                                                                                                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Low: the heading-focus move also applied to an open policy (REQ-19), beyond the authorised correction                         | Fixed: an open policy reads the page again and keeps the decision and focus as before Package 1E; a jsdom test (passes on the old component and the new one, failed on the pre-review change) |
| 2   | Low, plausible: the heading focus after a refusal from the confirmation relied on timer order                                 | Fixed: SA-07's pattern — a focus request on the page, moved in an effect that runs after the dialog's close in the same commit                                                                |
| 3   | Low: "keeps its lines" could not fail on the old code (the review start changes nothing the dialog names)                     | Fixed: a jsdom test reads the page again with other facts while the confirmation is open — it fails on the old component; two test titles no longer claim the lines                           |
| 4   | Low: the double-press payment check could not see a second send (it would be refused as stale)                                | Reworded as an outcome check (one payment started); the port-level tests count commands                                                                                                       |
| 5   | Note: "Back shows nothing of his" rested on the cache keys                                                                    | Reworded to say so                                                                                                                                                                            |
| 6   | Note, plausible: the lost-focus recovery could take focus a person had not lost from the panel                                | Fixed: the panel reports, as it goes, whether one of its controls had focus                                                                                                                   |
| 7   | Note, plausible: a specimen test (`components-data.spec.ts`, the 375 strip) measured once after `fonts.ready` — the same race | Fixed: it polls the strip's geometry (bounded, no sleep); 5 repeats pass                                                                                                                      |
| 8   | Note: the hook assumed `document.fonts` is an event target                                                                    | Guarded                                                                                                                                                                                       |
| 9   | Note: wording — the world instance is minted per page load; a circular test title; two test navigations unlabelled            | Corrected                                                                                                                                                                                     |

## 9 · Evidence — final `pnpm verify`

Final `pnpm verify` on the code as committed: **VERIFY PASSED** in 1,087 s (run
`2026-10-15T11-04-15-586Z-verify`, i.e. 15 Oct 2026, 16:34 IST). Only documents changed after it —
this record's and `PHASE-1-HANDOVER.md`'s figures and `tools/board-capture/DEVIATIONS.md`,
regenerated from that run (its run name only: every measured value equals Package 1D's register)
— and they were re-checked with Prettier and the repository scans.

| Step       | Result                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format     | prettier clean                                                                                                                                                                                                                                                                                                                                                       |
| repository | 32 checks · handoff 178/178 · audit evidence 36/36 · v46 copies 27/27 · scans (1 recorded exception, OD-1B-04), deny-list, fence wiring                                                                                                                                                                                                                              |
| workspace  | turbo build 12/12, typecheck / lint / test 40/40 (`--force`) · **4,478 unit tests** (Package 1D: 4,452): web 1,509 (+12), sample-platform 189 (+13), ui 832 (+1); contracts 731, domain 787, config 356, testing 11, validation 20, database 5, api 38 unchanged                                                                                                     |
| bundle     | 864 product files, 0 test-seam or harness sentinels; the test-hook build carries the bridge (5/5 markers)                                                                                                                                                                                                                                                            |
| browser    | **2,122 passed** (Package 1D: 2,065; web 983, was 926), 0 failed; 650 skipped, not passed (1D: 647 — width-gated tests and the 36 deferred flow skeletons at four widths); Chromium only                                                                                                                                                                             |
| parity     | 95/95 tests · **764 comparisons** (19 whole frames): 623 within tolerance, 141 on the register, **0 unregistered**, 0 masked, 136/136 board references, 0 external requests; the four `11-tabs-375-*` at 0 px; open owner decisions blocking parity: none; not closed by the owner: DEV-21 … DEV-25, DEV-27 … DEV-33, DEV-35, DEV-37, DEV-38, DEV-40, DEV-41, DEV-42 |

Also measured after the final run: the original checkout `/Users/mymac/Desktop/AR-VR` still 98
paths, 98/98 byte-identical to the G-1 manifest and its status identical, no root `.turbo`; the
external backup 6/6; the safety bundle's checksum and `git bundle verify` OK; no git remote in
either checkout, nothing pushed or merged; `design/handoff-v46/` 178/178 with no change.

**Verdict: CONDITIONAL PASS.** Package 1E's acceptance items are met with evidence — the 21 Phase-1
ids integrated with the 5 Phase-0 ids on one world at four widths, the SA-03 correction verified,
the board-11 cause measured and corrected, no security or permission regression, every suite
green, the product bundle free of test code. The conditions are owner decisions, not defects
(`PHASE-1-HANDOVER.md` §8–§9): the sample identity and the payment stand-in, no persistence or
hosting, Chromium-only and same-machine parity, 18 visual entries and the provisional state copy
awaiting the owner, and the T-11 e-mail rule before any hosted demonstration that assigns
Institute Admins freely.
