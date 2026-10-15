# Phase 1 — verification and handover (frozen canvas v46)

|                   |                                                                                                                                                                                                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope             | Phase 1 of the v46 frontend plan (B8-06; Appendix F §9): the public surface and the access spine — 21 screen ids, on the Phase-0 foundation's 5                                                                                                                                                                   |
| Packages          | 1A `ea0665d` · 1B `b1479d8` · 1C `cace91d` · 1D `7b0b7a1` · 1E (this commit) — records `PACKAGE-1A-RECORD.md` … `PACKAGE-1E-RECORD.md` beside this file                                                                                                                                                           |
| Branch / worktree | `v2/frontend-v46` at `/Users/mymac/Desktop/AR-VR-frontend-v46`; no remote, nothing pushed or merged                                                                                                                                                                                                               |
| Design authority  | `design/handoff-v46/` (frozen, 178/178)                                                                                                                                                                                                                                                                           |
| Verdict           | **CONDITIONAL PASS** — every Phase-1 id built and integrated with the Phase-0 ids, every suite green (§6); conditional on the owner decisions and interims of §8 and §9 (sample identity and payment stand-in, no persistence or hosting, Chromium only, same-machine parity, open visual and copy entries, T-11) |

This build is a **local, connected sample prototype**: one in-memory sample world per browser tab,
sample sign-in, a payment stand-in. It is not production-ready, and a hosted stakeholder
walkthrough waits on the owner decisions in §9. Phase 2 is not started.

## 1 · Screens — 26 of the 123 designed ids are built

The frozen register (`handoff/screens.json`, board B8-01) holds **147 ids: 123 designed and 24 not
designed by decision**. Built: the 5 Phase-0 ids and the 21 Phase-1 ids below; the other 97
designed ids are scheduled for Phases 2–6 (21 · 15 · 25 · 21 · 15), not failed; the 24 undesigned
ids are excluded (in Phase-1's area: PU-11 reply to an information request — OPEN; XS-02 choose a
workspace — DEFER; SA-04 decline a request — OPEN R21 / D10; SA-05 record a payment manually —
OPEN R06). `SCREEN_PHASE` (`@xr/contracts/draft`) and the route manifest agree with the register:
P0 5, P1 21, P2 21, P3 15, P4 25, P5 21, P6 15 = 123.

### Phase 1 (21)

| Id    | Screen (register)                       | Route / state                                                        | Board           | Package |
| ----- | --------------------------------------- | -------------------------------------------------------------------- | --------------- | ------- |
| PU-01 | Landing                                 | `/`                                                                  | B1-01, B1-02    | 1B      |
| PU-02 | All engineering areas                   | `/areas` (`/courses` → 307)                                          | B1-03           | 1B      |
| PU-03 | Engineering area                        | `/areas/[areaId]`                                                    | B1-03           | 1B      |
| PU-04 | Catalogue                               | `/experiments?area=&course=&format=&q=&sort=&view=`                  | B1-04           | 1B      |
| PU-05 | Course                                  | `/courses/[courseId]`                                                | B1-03           | 1B      |
| PU-06 | Experiment                              | `/experiments/[experimentId]` (`?format=`)                           | B1-05           | 1B      |
| PU-14 | How institutional access works          | `/#for-institutions` (a section of PU-01)                            | B1-01           | 1B      |
| PU-07 | Your selection                          | `/selection`                                                         | B1-06           | 1C      |
| PU-08 | Request institutional access            | `/request-access?step=details` · `?step=review`                      | B1-07           | 1C      |
| PU-09 | Request sent                            | `/request-access/sent`                                               | B1-07 f2, f8    | 1C      |
| PU-10 | Request status                          | `/requests/[requestId]` (opaque route id, ADR-0009)                  | B1-08           | 1C      |
| PU-12 | Payment (external route only)           | `/requests/[requestId]/payment` (TE-4 stand-in)                      | B1-08 f5        | 1C      |
| PU-13 | Access activated                        | a state of PU-10                                                     | B1-08 f8, f9    | 1C      |
| XS-01 | Sign in                                 | `/sign-in` (sample sign-in, P1-01)                                   | B1-09           | 1A      |
| XS-03 | Signed out / session expired            | `/sign-in?reason=signed-out\|expired&returnTo=`; `/signed-out` → 307 | B1-09 f9, f10   | 1A      |
| XS-04 | First-time activation · Forgot password | a state of `/sign-in` (the disclosure; the flows stay OPEN)          | B1-09           | 1A      |
| SA-01 | Overview                                | `/admin` — the Requests group only (owner SA-01 scope; DEV-34)       | B7-01           | 1D      |
| SA-02 | Requests                                | `/admin/requests`                                                    | B1-10           | 1A      |
| SA-03 | Request decision                        | `/admin/requests/[requestId]` (the reference)                        | B1-11           | 1A (1E) |
| SA-06 | Institutions                            | `/admin/institutions`                                                | B7-02           | 1D      |
| SA-07 | Institution detail                      | `/admin/institutions/[institutionId]`                                | B7-03, B7-04 f0 | 1D      |

### Phase 0, reused (5)

| Id    | Screen                                        | Where                                                         |
| ----- | --------------------------------------------- | ------------------------------------------------------------- |
| XS-05 | Account menu                                  | every workspace top bar                                       |
| XS-06 | Not your workspace                            | an address of another role's workspace, in the person's shell |
| XS-07 | Help & support (report a problem, my reports) | `/<base>/help`, `/help/report`, `/help/reports/[reportId]`    |
| XS-08 | Institution paused / account inactive notice  | the shell banners                                             |
| PU-15 | Not found                                     | unknown addresses (public and in-shell)                       |

Routes: **51 page files** (35 Phase-0 + 16 Phase-1) plus the `(auth)` and `(public)` layouts and 9
static redirects; every rendered link leads to a built screen, and links to unbuilt destinations
are not rendered (link-target ledger; DEV-21). The workspace bases other than `/admin` still land
on Help (P0-35): their destinations are Phases 2–6.

## 2 · The connected application

Verified in Package 1E as one application on one shared world (`PACKAGE-1E-RECORD.md` §3):
Flow A steps 1–4, the A-info alternate and Flow B step 1, in one tab of the **product build**, at
1440, 1024, 768 and 375 — public browsing (areas, course, catalogue, experiment), the selection
edited, the request sent and its reference, its status through the session-held ticket, the
Super Admin's sign-in, SA-01 → SA-02 → SA-03 approval (external, and internal with no payment
step), the requester's status, the payment stand-in, activation (ACC-0107), SA-06 / SA-07 with the
plan and no Student access, the Institute Admin assigned and signed in to her own workspace, and
the Super Admin's pages refused to her. One kind of step needs a mechanism no ordinary
interaction offers: the requester's return to their status page after leaving it (a **test
navigation** through the app router — no page lists a request, and a typed address resets the
world). The payment confirmation is the **development-only TE-4 stand-in**. The requester's
"Under review" (AD-14 review start) and the provider's pending / failed outcomes are **CI-only
fixtures**.

Earlier package proofs still run: 1A–1D demonstrations (product build), the 1B public journey,
the 1C access and status specs, the 1D institutions specs, `e2e/foundation/cross-role.spec.ts`.

## 3 · Services and contracts

| Ledger                     | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product methods            | 22 ports, **183** methods (84 commands, 94 reads, 5 previews): **143 implemented** — the 139 of Phase 0 (incl. the owner's `listAllContent` exception) and the **4 Phase-1** methods, `CatalogueService.listAreas`, `getArea`, `getCourse` (1B) and `InstitutionService.listInstitutions` (1D) (`PACKAGE_DELIVERIES`) — and **40 deferred**: P2 9, P3 1, P4 14, P5 7, P6 9                                                                                                                                                                            |
| Phase-2 methods (deferred) | `InstitutionService.getMyOverview`; `PeopleService.listStudents`, `previewStudentImport`, `listFaculty`, `getFaculty`; `GroupService.listGroups`, `getGroup`; `FacultyCourseService.list`; `InstitutionCourseCodeService.list`                                                                                                                                                                                                                                                                                                                        |
| Advanced in Phase 1        | Reused Phase-0 methods given their screens: `SessionService.signIn / signOut / getSession / checkWorkspace`; `SelectionService.*`; `AccessRequestService.submitPublicRequest / getRequestStatus / startPayment / listRequests / getRequestForDecision / approveRequest / approveSmallerScope / requestMoreInformation`; `InstitutionService.getInstitution / assignInstituteAdmin / pauseInstitution / restoreInstitution / overrideStudentStatus`; `CatalogueService.searchCatalogue / getExperiment`; the TE-4 `PaymentOutcomePort.report` stand-in |
| Contract shapes            | Provisional register PC-01 … PC-37 (Phase 1: PC-30 course area, PC-31 artwork key, PC-32 featured, PC-33 route id, PC-34 the ticket never crosses a port, PC-35 undo position, PC-36 SA-06 row facts, PC-37 student revision; PC-29 from WP-0.13) — reversible while the contract is a draft                                                                                                                                                                                                                                                          |
| Contract suite             | **79 cases** (Phase 0: 63; Phase 1: catalogue 4, access 8, institution 4), adapter-independent, all passing on the sample adapter, the 12 invariants after each                                                                                                                                                                                                                                                                                                                                                                                       |
| Domain                     | Additive model fields only (`routeId`, `lastRemovedAt`, `artworkKey`); `policy/` unchanged since Phase 0                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Permissions                | The 347-row candidate matrix unchanged (176 CONFIRMED, 130 PROVISIONAL, 41 UNRESOLVED; 15 OPEN never offered; 11 SYSTEM); no provisional row was turned into an approved one; no rule added for Phase 1                                                                                                                                                                                                                                                                                                                                               |

## 4 · Security and request access

ADR-0009 holds: a request's pages open for the browser session (and user session) that sent it, or
the requesting institution's signed-in Institute Admin; anyone else gets the not-found page and
learns nothing. The reference, the route id and copied or planted tickets open nothing; the Super
Admin's pages and answers carry no ticket; sign-out clears the person's cached answers; repeated
commands are answered once; stale commands are refused without a write; institutional access
creates no Student access; nothing completes a format. Evidence: `PACKAGE-1E-RECORD.md` §4. These
are properties of the **sample adapter and the browser session**, not production security: there
is no real authentication, no server and no token issuer (§9).

## 5 · Accessibility and responsiveness

Every drawn Phase-1 page state is checked at the four widths with `checkState` (axe WCAG 2.0 / 2.1
/ 2.2 A and AA, one level-1 heading, no invisible focus target, 24 × 24 targets, no developer
surface, no Slice-1 markup, no sideways scroll), and every Phase-1 dialog and sheet with axe, the
target sizes and the keyboard (Tab and Shift+Tab kept inside, Esc, focus back to the trigger) — with
real keyboard and wheel-reached pointer input, focus after each move, error summaries, and the
loading / empty / failed / refused / unavailable states (loading and failed in unit tests where the
sample adapter answers at once).
**Chromium only**: WebKit and Firefox have not been run (P0-28).

## 6 · Test totals (final `pnpm verify`)

`pnpm verify`, 15 Oct 2026, run `2026-10-15T11-04-15-586Z-verify`: **VERIFY PASSED** in 1,087 s.

| Step       | Result                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format     | prettier clean                                                                                                                                                                                                                                                                                                                                                       |
| repository | 32 checks · handoff 178/178 · audit evidence 36/36 · v46 copies 27/27 · scans (1 recorded exception, OD-1B-04), deny-list, fence wiring                                                                                                                                                                                                                              |
| workspace  | turbo build 12/12, typecheck / lint / test 40/40 (`--force`) · **4,478 unit tests** (Package 1D: 4,452): web 1,509 (+12), sample-platform 189 (+13), ui 832 (+1); contracts 731, domain 787, config 356, testing 11, validation 20, database 5, api 38 unchanged                                                                                                     |
| bundle     | 864 product files, 0 test-seam or harness sentinels; the test-hook build carries the bridge (5/5 markers)                                                                                                                                                                                                                                                            |
| browser    | **2,122 passed** (Package 1D: 2,065; web 983, was 926), 0 failed; 650 skipped, not passed (1D: 647 — width-gated tests and the 36 deferred flow skeletons at four widths); Chromium only                                                                                                                                                                             |
| parity     | 95/95 tests · **764 comparisons** (19 whole frames): 623 within tolerance, 141 on the register, **0 unregistered**, 0 masked, 136/136 board references, 0 external requests; the four `11-tabs-375-*` at 0 px; open owner decisions blocking parity: none; not closed by the owner: DEV-21 … DEV-25, DEV-27 … DEV-33, DEV-35, DEV-37, DEV-38, DEV-40, DEV-41, DEV-42 |

Cumulative since Phase 0 (`c572917`): unit 3,580 → 4,478; browser 1,774 → 2,122 passed; parity
441 → 764 comparisons (64 → 141 registered, 0 unregistered throughout).

## 7 · Visual baseline and deviation status

Same-machine parity (VD-18 local interim; not portable): 95/95 tests · 764 comparisons (19 whole frames), 623 within tolerance, 141 on the register, 0 unregistered, 0 masked, 136/136 board references, 0 external requests (final run `2026-10-15T11-04-15-586Z-verify`). The register is
`tools/board-capture/DEVIATIONS.md` (regenerated from the final run). No entry was added, changed,
approved or discarded in Package 1E.

| Entry                  | What                                                                                 | Status                 | Decision asked of the owner                                    |
| ---------------------- | ------------------------------------------------------------------------------------ | ---------------------- | -------------------------------------------------------------- |
| DEV-21                 | Unbuilt destinations and links not rendered (P0-35, Phase-1 extension; SA sidebar)   | owner review           | Accept as the phase interim (each phase adds its destinations) |
| DEV-22, DEV-33         | The spine-start world's requests differ from the B1 boards' sample records           | owner review           | Acknowledge as fixture state (one answer per record)           |
| DEV-23                 | Back icon: Batch-1 chevron vs board 02's Back icon (3 px)                            | owner review           | Choose the icon for every back link                            |
| DEV-24                 | Sign-in page fills the viewport (PF-02 / VD-23)                                      | provisional            | Confirm VD-23                                                  |
| DEV-25, DEV-30, DEV-42 | Canvas-runtime artefacts (static "Collapse menu"; bound words in a wrapper)          | owner review           | Accept as canvas-only (no change)                              |
| DEV-27, DEV-41         | No preview link in the world; background institutions hold no people                 | owner review           | Acknowledge as fixture state, or authorise sample data         |
| DEV-28                 | VR / MR "How it runs" wording (OD-1B-02)                                             | owner review           | One sentence per format                                        |
| DEV-29, DEV-31         | Rasterisation: live background art; fractional page heights                          | owner review           | Acknowledge as capture environment                             |
| DEV-32, DEV-40         | Event times written with the time recorded (PU-10, SA-07 history)                    | owner review           | Date only, or date and time                                    |
| DEV-35                 | SA-01 rows and calm sentence in Phase-1 words                                        | owner review           | Keep until the Phase-6 overview read                           |
| DEV-37                 | SA-06 newest first (B7-02 draws a sample order)                                      | owner review           | Keep newest first, or name an order                            |
| DEV-38                 | SA-07 "Needs attention" without device-transfer and access-ending rows (Phases 3, 6) | owner review (tracked) | Keep the Phase-1 rows                                          |
| DEV-34, DEV-36, DEV-39 | SA-01 scope; decision ids out of copy; canvas sample labels                          | owner-approved / rule  | —                                                              |

Board frames outside the built scope stay references only (`tools/board-capture/BASELINES.md`):
B7-04 f1 … f3 (other roles' pause pages, Phases 2 and 4), the B1-07 "Submitting" / "Failed +
retry" and B7-01 / B7-02 loading frames (no browser state; unit-tested), and every later-phase
board.

## 8 · Owner decisions outstanding

Nothing below was decided by the build; each path it touches is marked conditional where it is
reached.

| Decision                                                                                              | Where it bites                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OD-B3-09 — plan effect of a paid or internal request of an existing institution                       | SA-03 internal confirmation for renewals / more licences (state-copy `SA-03.internal-confirm-plan`); PU-10 "Access active" while no plan changes — **conditional path** |
| The smaller-scope Monthly default (P1-10 / P1-11)                                                     | SA-03 when a request asked for its current term or an end date                                                                                                          |
| Institute Admin request-count semantics (DEV-17)                                                      | before IA-17 / IA-18 (Phase 2) count anything                                                                                                                           |
| SA-03 unavailable copy (`SA-03.unavailable`, provisional)                                             | a decision command failing for now (test fault plans only)                                                                                                              |
| P1-22 featured content (seeded list, PC-32)                                                           | PU-01 featured experiments                                                                                                                                              |
| PC-31 / PC-32, PC-36 / PC-37 and the other provisional contract shapes                                | reversible while the contract is a draft                                                                                                                                |
| **T-11 / P1-01 — an assigned work e-mail already held by someone**                                    | **blocks a hosted demonstration that lets reviewers assign any e-mail** (`PACKAGE-1E-RECORD.md` §5)                                                                     |
| P0-31 — the Help report title (display-only excerpt, interim)                                         | XS-07                                                                                                                                                                   |
| T-12 — what completes a learning format (`interimCompletionPolicy`)                                   | no Phase-1 path; blocks Phase 3                                                                                                                                         |
| TE-6 — browser persistence                                                                            | a reload or typed address resets the world; requesters cannot return by address — **conditional for any hosted walkthrough**                                            |
| P1-04 / AD-14 — what starts review                                                                    | the requester never sees "Under review" in an ordinary flow                                                                                                             |
| TE-8 on the Package-1C pages; ADR-0009's two readings (user-session binding; HTTP 200 not-found page) | acknowledgement requested since 1C                                                                                                                                      |
| ND-07, T-01 / R01, T-03, T-05 / R06, D7                                                               | untouched (no reply to an information request, no reference lookup, no provider, no licence counting)                                                                   |
| 86 provisional state-copy entries of the Phase-1 screens (of 95; 5 owner-approved, 4 drawn)           | `apps/web/src/copy/state-copy.ts`, for sign-off                                                                                                                         |
| The visual entries of §7                                                                              | as listed                                                                                                                                                               |

## 9 · Readiness — what works where

1. **Local development sample build** (`pnpm build`, then `pnpm --filter @xr/web start`;
   `NEXT_PUBLIC_APP_ENV` defaults to `development`): every Phase-1 screen and the whole of §2, the
   TE-4 stand-in confirming payments, in one tab.
2. **The product build without test hooks**: the same — the product build is what §2's journeys
   run; the bundle carries no test seam (verify bundle step). In a staging or production
   environment build the stand-in leaves a payment unconfirmed, so Flow A stops at "Payment not
   confirmed".
3. **Needs CI-only fixture preparation** (test-hook build, never shipped): the review start
   ("Under review"), the provider's pending and failed outcomes, any other identity or world than
   the spine-start seed, time travel, changes "made elsewhere" (another session's commands).
4. **Needs owner approval before a hosted PM demonstration**: hosting and a remote (P0-01), the
   hosted seed (DV-6 / P1-12), browser persistence (TE-6), the sample sign-in being acceptable on
   a hosted URL (P1-01 / DV-3: any non-empty password signs a known sample e-mail in), the
   Institute Admin e-mail rule (T-11), live system states for reviewers (P1-18 / AD-40: payment),
   the official WILP logo (P0-04), and the provisional copy and visual entries above.
5. **Needs a production backend or real authentication later**: real identity and sessions
   (T-10 / A-01), persistence (`apps/api`), a payment provider (T-05 / R06), server rendering of
   the public pages (TE-8 removal), real request tickets and access control, e-mail delivery
   (T-11), multi-browser verification on a CI runner (VD-18, P0-28).

Known limitations, visible: a browser reload resets the in-memory world; the payment confirmation
is a development-only stand-in; public discovery is client-rendered (TE-8); no production
authentication; the BITS Pilani / WILP logo is a placeholder; visual pins are this machine's;
browser verification is Chromium only.

## 10 · Phase 2 — dependencies and first decisions

Phase 2 (campus distribution: IA-01 … IA-11, IA-13 … IA-16, ST-01 … ST-05, ST-19 — 21 ids)
builds on: the activated institution and plan (ACC-0107) and its assigned Institute Admin (B1),
whose workspace today lands on Help; SA-07's people and student-status override; the shared
world, sessions and guards. It needs the 9 deferred Phase-2 methods (§3). Decisions to take
first (`docs/v46/handover/OWNER_DECISIONS_HANDOVER.md` §4): the Institute Admin request-count
semantics (DEV-17), SACC-14 (what stays viewable after access ends), licence counting (P2-01 / D7 /
T-06), overlapping grants (P2-02 / DV-1 / OD-B2-01), P2-03 … P2-06 / P2-08 / P2-10, P2-11 (problem
reports for Institute Admins), the paused / inactive wordings, DEV-16 (amber paused message), and
T-11 (how an assigned Institute Admin first signs in). Phase 2 is not started and waits for the
owner's authorisation; its package boundaries are not set here.
