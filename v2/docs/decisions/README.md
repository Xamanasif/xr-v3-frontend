# Architecture decision records — v46 frontend

`OPEN_DECISIONS.md` assigns engineering decisions (Parts B and D) to ADRs in this folder. This folder was created in work package WP-0.2 (12 Oct 2026) on branch `v2/frontend-v46`, under the owner-approved Phase-0 plan (`../v46/audit/Appendix-F-Phase0-Plan.md`).

**Precedence.**

1. Owner binding constraints (`design/handoff-v46/START-HERE.md` BC1–BC14, `FREEZE-RECORD-v46.md`).
2. The frozen v46 boards.
3. The handoff JSON. Where the JSON index differs from the drawn behaviour, the approved board takes precedence and the discrepancy is documented (owner, 12 Oct 2026).

Stakeholder-confirmed requirements govern business behaviour. A stakeholder ↔ v46 conflict stays **open** until the owner decides it (`../v46/audit/Appendix-G-Owner-Decisions.md` §C). No ADR here grants a permission or invents a workflow rule.

## Index

| ADR                                                      | Decision                                                                                                    | Status                               | Owner record                                                                                          |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| [ADR-0001](ADR-0001-css-architecture-and-tailwind.md)    | v46 CSS verbatim in one cascade layer; Tailwind without Preflight, layout utilities only (closes E-19)      | Accepted                             | G-3, Option A, approved 12 Oct 2026; WP-0.5 amendment accepted 12 Oct 2026                            |
| [ADR-0002](ADR-0002-typed-mock-services.md)              | Typed frontend mock services in a separate package; one connected service/data layer (exception TE-2)       | Accepted                             | G-2, approved 12 Oct 2026                                                                             |
| [ADR-0003](ADR-0003-sample-identity-and-session.md)      | Controlled sample identity and session; sign-in form in Phase 1; no account switcher, no DEMO banner (TE-1) | Accepted                             | G-2 and G-8, approved 12 Oct 2026                                                                     |
| [ADR-0004](ADR-0004-sample-world-persistence.md)         | Sample world in memory, one per browser tab (option A); TE-6 browser snapshot for the local prototype build | Accepted (option A); amended Phase 7 | Browser persistence deferred, 12 Oct 2026; TE-6 authorised for the local prototype build, 17 Oct 2026 |
| [ADR-0005](ADR-0005-route-conventions.md)                | Route conventions for the App Router (params, tabs, steps, guards, redirects, unbuilt destinations)         | Accepted (engineering)               | Acknowledgement requested                                                                             |
| [ADR-0006](ADR-0006-system-owned-completion-records.md)  | Learning completion is a system-owned record behind an injectable `CompletionPolicy`; T-12 stays open       | Accepted                             | G-2, approved 12 Oct 2026                                                                             |
| [ADR-0007](ADR-0007-test-only-seams-and-sample-clock.md) | Test-only controls: sample clock, build flags, test hooks, seeded system facts (TE-5, TE-7)                 | Accepted                             | G-2 and AD-14, approved 12 Oct 2026                                                                   |
| [ADR-0008](ADR-0008-service-contract-shape.md)           | Typed service-contract boundaries: one port set, one result/error union, one record-kind union              | Accepted (engineering)               | Acknowledged 13 Oct 2026, limited scope (WP-0.10)                                                     |
| [ADR-0009](ADR-0009-request-status-access.md)            | Request status access: opaque address; tickets held by the browser session, per world and user session      | Accepted (engineering)               | DV-5 / O-05 approved 14 Oct 2026 (Package 1C); two readings for acknowledgement                       |
| [ADR-0010](ADR-0010-v3-presentation-layer.md)            | V3 Refined Direction B layer (XR-V3-RB-1.0): scoped derivative in `xr.v3`, `@xr/ui/v3`, v46 kept beside it  | Accepted (engineering)               | Refined B selected by the owner; foundation only, 19 Oct 2026; acknowledgement requested              |

## Owner decisions of 12 October 2026

The owner reviewed the complete Phase-0 audit and "approved all nine recommendations" in the WP-0.1 authorisation of 12 Oct 2026. The WP-0.2 authorisation of the same day confirmed them and added that browser persistence remains deferred.

| Decision                    | Owner wording (abridged)                                                                                                                                                                                                                                                                                                                                                        | Recorded in                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| G-1 Protect existing work   | Option B, external backup only. Do **not** create a WIP commit on the rejected Slice-1 branch.                                                                                                                                                                                                                                                                                  | WP-0.1 (backup outside the repository, verified)                   |
| G-6 Implementation worktree | Branch `v2/frontend-v46`, worktree `/Users/mymac/Desktop/AR-VR-frontend-v46`, based on `1b090c97b564dae660b87d01c0212ab495347620`                                                                                                                                                                                                                                               | WP-0.1                                                             |
| G-7 Frozen design handoff   | Install and commit the original Design Handoff v46 (zip SHA-256 `9d33f32e…24bf`) at `design/handoff-v46/`                                                                                                                                                                                                                                                                       | Commit `c4860a2`                                                   |
| G-5 Dependencies            | `pnpm install --frozen-lockfile` for the baseline. Accessibility-testing and visual-capture dependencies are approved for their later work packages, not installed in WP-0.1.                                                                                                                                                                                                   | WP-0.1; WP-0.4, WP-0.15                                            |
| G-2 Architecture exceptions | Approved for the later Phase-0 work packages: typed frontend mock services; controlled sample identity and test-only clock; test-only environment switches outside the product UI; separate system-owned completion records behind a `CompletionPolicy`; one connected frontend service/data layer. **No real authentication, payment processing or XR runtime is authorised.** | ADR-0002, ADR-0003, ADR-0006, ADR-0007; `OPEN_DECISIONS.md` Part E |
| G-3 CSS                     | Option A: preserve v46 styling, disable conflicting Tailwind Preflight, retain Tailwind for appropriate layout utilities                                                                                                                                                                                                                                                        | ADR-0001                                                           |
| G-8 Sign-in                 | Sign-in implementation stays in Phase 1. Phase 0 uses the authorised test-only access mechanism, never a developer-facing account switcher.                                                                                                                                                                                                                                     | ADR-0003                                                           |
| AD-14 / P1-04               | Use seeded / test-only review-start facts. Do not invent a rule that opening a request automatically starts review.                                                                                                                                                                                                                                                             | ADR-0007                                                           |
| P0-31                       | For the prototype Help report list, use a display-only excerpt from "What happened" as a provisional title. Do not introduce a new saved title field.                                                                                                                                                                                                                           | This page (interim choice 2)                                       |
| Precedence                  | Where handoff JSON conflicts with the frozen behavioural boards, the approved boards take precedence, with the discrepancy documented. Genuine unresolved business-policy conflicts remain open.                                                                                                                                                                                | This page; `ARCHITECTURE.md` amendments                            |

## Owner decision of 13 October 2026 — E-alt3 phase-schedule exception

The WP-0.11 authorisation (13 Oct 2026, §2) advances one method out of the Appendix F §4.1 phase
schedule. Appendix F stays as frozen audit evidence; the method ledger records the departure in
`PHASE_SCHEDULE_EXCEPTIONS` (`@xr/contracts/draft`), and `ledger.test.ts` allows nothing else to
move.

| Decision                                    | Owner wording (abridged)                                                                                                                                                                                                                                                                                       | Recorded in                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| E-alt3 — `ProductionService.listAllContent` | Implement it during WP-0.11 solely to enable the Super Admin stuck-submission workflow; reuse the WP-0.10 signature; enforce the current domain policy and the Super Admin read-only permission; grant no additional permission; no Phase-6 screen and no other deferred Phase-6 method; record the exception. | `PHASE_SCHEDULE_EXCEPTIONS`; `packages/sample-platform/README.md` (WP-0.11) |

## Owner authorisation of 14 October 2026 — WP-0.15 (G-5c, VD-18 local interim)

The WP-0.15 authorisation ("Authorize WP-0.15 ONLY") approves, narrowly: downloading React 18.3.1,
ReactDOM 18.3.1, Babel Standalone 7.29.0 and the required Public Sans woff2 files **for the local
visual-capture tooling only**; checking the three scripts against the SHA-384 SRI values in the
frozen `runtime/support.js` before use (stop on any mismatch); recording the fonts' provenance,
hashes and licence; running temporary same-machine, same-browser reference-versus-product
comparisons instead of creating a CI runner; and using the documented tolerances. It is recorded
as the **local WP-0.15 interim for VD-18**; the final runner decision stays open. Not authorised:
other browser engines, unrelated libraries, a CI service or Git remote, deploying the tooling,
running the downloaded scripts in the product, altering the frozen handoff, or changing production
font loading without a demonstrated need (none arose: PF-09 still loads the boards' Google Fonts
link, and the capture network serves the same files to board and product).

| Item                                                                      | Where                                                                                    |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Inputs, SRI 3/3, hashes, licences                                         | `../../tools/board-capture/PROVENANCE.md`; re-checked by `pnpm verify` (repository step) |
| Harness, method, tolerances, normalisations                               | `../../tools/board-capture/README.md`                                                    |
| Phase-0 baseline inventory and results                                    | `../../tools/board-capture/BASELINES.md`                                                 |
| Expected-deviation register (owner-approved / provisional / owner review) | `../../tools/board-capture/DEVIATIONS.md`                                                |
| Product corrections made under "fix confirmed regressions"                | `packages/ui/src/styles/product.css` PF-17 … PF-20                                       |

## Owner visual-decision closure of 14 October 2026 — WP-0.15

The owner reviewed all 20 entries of `../../tools/board-capture/DEVIATIONS.md` and decided them for
the **frozen-v46 frontend prototype**. These decisions do not approve unrelated business policies
or future screen designs, and they do not claim that the designed screens are implemented. No
component or style changed: every decision keeps the product as built. The comparisons, pins,
tolerances and the zero-mask policy are unchanged; only the entries' statuses moved.

| Decision                                                        | Entries                                    | Status                                          |
| --------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| Grey busy button (spinner, busy words, no duplicate submission) | DEV-01                                     | Approved (was blocking)                         |
| VD-06: dialog Cancel `xr-btn--secondary`                        | DEV-08                                     | Approved (was blocking)                         |
| VD-22: `xw-errsum` ErrorSummary with field links                | DEV-12                                     | Approved (was blocking)                         |
| VD-11: gold focus ring on navy                                  | DEV-06                                     | Approved                                        |
| P0-35: built-screen-only navigation                             | DEV-10                                     | Approved as the Phase-0 interim                 |
| Product-board patterns and wording                              | DEV-02, 04, 07, 09, 13, 14, 15, 17, 18, 20 | Approved                                        |
| Earlier approvals kept                                          | DEV-03, DEV-11, DEV-19                     | Unchanged                                       |
| Rendering residuals, cause not proven                           | DEV-05                                     | Acknowledged as measured; recheck on the runner |
| Amber paused-message icon                                       | DEV-16                                     | Deferred to the phase that builds ST-19         |

Still tracked (listed in `DEVIATIONS.md` and printed by `pnpm verify`): runner portability (VD-18),
DEV-05, DEV-16, later phases' destinations (P0-35), the Institute Admin request-count semantics
(DEV-17; not decided), and the provisional VD-04, VD-08, VD-16 and the open P0-31 title source.

## Owner authorisation of 14 October 2026 — Phase-1 Package 1C

The Package-1C authorisation ("Authorize Package 1C ONLY") approves two decisions for the public
request flow (PU-07 … PU-13), narrowly; the record is `../phase-1/PACKAGE-1C-RECORD.md`.

| Decision          | Owner wording (abridged)                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Recorded in                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| TE-4              | Provider-neutral payment per B1-08; "Continue to payment" may confirm via the approved sample payment stand-in in local prototype builds; unconfirmed / failed from fixtures or CI unless the frozen behaviour gives an ordinary user action. No actual provider, money movement, payment details, invented amount, method collection or manual "mark paid". Not authorisation to deploy simulated payment behaviour as a real payment system.                             | ADR-0007 amendment; `OPEN_DECISIONS.md` Part E |
| DV-5 / P1-02 O-05 | `/requests/[requestId]`; status and payment pages open only for the submitting browser session using its authorised session-held ticket, or the authenticated Institute Admin authorised for that institution. The request reference alone never grants access; enforced by service and session rules, not by hiding links; unauthorised → the approved not-found treatment, no request details. `sessionStorage` limited to the ticket mechanism; no general persistence. | ADR-0009                                       |

Not decided by it and kept open: ND-07 (internal / external rule — the Super Admin chooses the route
on SA-03), T-01 / R01 (requester identity beyond the browser session), T-03 (reply to an
information request), T-05 / R06 (payment provider), P1-04 (what starts review — AD-14 seam only),
OD-B3-09 (plans after a confirmed payment for an existing institution).

## Owner authorisation of 15 October 2026 — Phase-1 Package 1D

The Package-1D authorisation ("Authorize Package 1D ONLY") decides three questions for the Super
Admin's institution pages (SA-01, SA-06, SA-07), narrowly; the record is
`../phase-1/PACKAGE-1D-RECORD.md`.

| Decision      | Owner wording (abridged)                                                                                                                                                                                                                                                                                                                        | Recorded in                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| SA-01 scope   | Approve only the Phase-1 Requests section of SA-01, from `AccessRequestService.listRequests` and the approved request-count behaviour. `getSuperAdminOverview` is not implemented early; no overview figures, licence totals, expiry dates or metrics absent from the Phase-1 DTOs. The remaining full SA-01 overview is a Phase-6 requirement. | DEV-34 (owner-approved; tracked for Phase 6); state-copy `SA-01.scope`; ledger |
| P1-14 / VD-10 | Remove internal policy identifiers such as `(T-06)`, `(T-08)`, `(T-11)`, `(T-25)` from user-visible copy, keeping the meaningful sentences; keep traceability to the frozen-board wording in the copy register; document the deviation. The identifiers stay in domain logic, tests, audit evidence and technical documentation.                | DEV-36 (owner-approved); `copy/institutions.ts` `STRIPPED`; state-copy         |
| P1-08         | Institute Admin assignment only when the institution has active access, as already documented; no new eligibility rules.                                                                                                                                                                                                                        | domain INST-04 / `assignInstituteAdmin` (unchanged); SA-07 controls            |

Not decided by it and kept open: the full SA-01 overview (Phase 6), the Operations rows of SA-07's
"Needs attention" (Phases 3 and 6), how an assigned Institute Admin first signs in (T-11; the sample
sign-in accepts the assigned work e-mail, P1-01), OD-B3-09.

## Approved interim choices

These are interim treatments the build follows. Where the underlying product question is open, it **stays open**.

| #   | Interim choice                                                                                                                                                                                                                                                                                 | Basis                                                        | Open question kept                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| 1   | The request status "Under review" comes from **seeded or test-only review-start facts**, never from opening a screen. No product code path decides when review starts.                                                                                                                         | Owner, AD-14 (12 Oct 2026); B1-13 draws no control           | P1-04 (what starts review) — open                          |
| 2   | Help & support report titles in "My reports" are a **display-only excerpt** of "What happened", marked provisional. No saved title field exists.                                                                                                                                               | Owner, P0-31 (12 Oct 2026); board 07 form has no title field | P0-31 (title source) — open                                |
| 3   | When the handoff JSON index differs from the drawn behaviour, the **approved v46 board takes precedence**; the discrepancy is documented (`../v46/audit/Appendix-G-Owner-Decisions.md` §B, HB-01…HB-24).                                                                                       | Owner, 12 Oct 2026; START-HERE order of authority            | Board-versus-board contradictions (Appendix G §B.2) — open |
| 4   | **Programme is not a navigation level.** It is a plain attribute of the Student record. There is no Programme entity, route, menu item, filter or grouping, and no Module layer. The navigable chain is Engineering area → Course → Experiment → Technology format.                            | BC2 (owner binding constraint)                               | SC-07 label (ND-02), SC-26 report by stream — open         |
| 5   | **A simulation launch cannot mark a technology format Completed.** "Completed" is written only by the system completion handler (ADR-0006); no Student control, launch, session, time, resource, assessment or other format sets it.                                                           | BC3; B3-03 "You can't mark it yourself"                      | T-12 / A-06 (the completing event) — open                  |
| 6   | **Browser persistence remains deferred.** The sample world lives in memory per tab (ADR-0004).                                                                                                                                                                                                 | Owner, 12 Oct 2026                                           | AD-07 / P0-02 — open                                       |
| 7   | **Seven authenticated roles and the Public surface stay separate:** Student, Faculty, Institute Admin, Vendor, Academic Reviewer, Content Manager, Super Admin. PUBLIC is a surface, not a role. One role per signed-in person; another role's workspace renders "Not your workspace" (XS-06). | BC1; `navigation.json`; P0-10                                | XS-02 (several roles per person) — deferred                |

## Exceptions to the committed architecture

`OPEN_DECISIONS.md` Part E records the exceptions TE-1…TE-8 with their fences and removal triggers. Per G-2, TE-1, TE-2, TE-5 and TE-7 are approved for Phase 0. TE-8 was approved by the owner for Phase-1 Package 1B (14 Oct 2026: client-rendered public pages on the browser-only sample world, one world per tab, not the production SSR / SEO architecture; `../phase-1/PACKAGE-1B-RECORD.md` §2); the Package-1C pages use the same mechanism, for the owner's acknowledgement (`../phase-1/PACKAGE-1C-RECORD.md` §2). TE-4 was approved for Phase-1 Package 1C (14 Oct 2026; ADR-0007 amendment). TE-3 is drafted and must be signed before Phase 3. TE-6 is not authorised. **Phase 7 (17 Oct 2026):** the owner authorised, for the local prototype build only and not as production decisions, TE-3 / T-12 (a sample WEB activity whose own completion is recorded by the system completion handler), P3-03 (one pre-authorised sample device in the local starting world) and TE-6 (the browser snapshot, ADR-0004 amendment); `../phase-7/PHASE-7-RECORD.md`.
