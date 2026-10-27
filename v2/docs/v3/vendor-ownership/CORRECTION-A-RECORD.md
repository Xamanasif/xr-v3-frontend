# Vendor ownership and course permission — correction A (27 Oct 2026)

Correction A of the read-only Vendor ownership audit
(`~/Downloads/XR-V3-Vendor-Ownership-Audit-2026-10-27/VENDOR-OWNERSHIP-AUDIT.md`), on the owner
decisions approved in chat on 27 Oct 2026 (`../../decisions/README.md`, "Owner decisions of 27
October 2026"). **Correction B (the Engineering area step, PD-5) is not part of this change** and
waits for its own authorisation. The frontend is not stakeholder-approved and not frozen. No
backend, no seed change, no snapshot-format change, no merge, push or deployment.

## 1. Base and safety

- Branch `v3/vendor-ownership` in its own worktree (`/Users/mymac/Desktop/AR-VR-v3-vendor`),
  from `v3/refined-b-ui` at `fa0ce78`, which is unchanged and clean.
- Not touched: the browser-local saved worlds, the servers on 3360–3363 (and 3369), the recovery
  bundles, the source handoff ZIP, the frozen design folders, the protected original checkout
  (`/Users/mymac/Desktop/AR-VR`, `1b090c9`, 98 paths). Checks ran on ports 3310 / 3410 / 3520.

## 2. Decisions implemented

| Decision                                 | What the product now does                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PD-1 ownership per person                | A Vendor lists, opens and edits only the submissions they created. Another Vendor — the same studio (identical organisation text) included — gets "We can't find that experiment" on the record and "We can't find that page" on edit / revise; nothing says "colleague". Creator stamp and per-status edit rules unchanged.                                                                                                                                                 |
| PD-2 Vendor any-course permission        | For a Vendor only, an active "All experiments" scope = every existing course, now and later; course scopes = those courses. It decides submission only, never another Vendor's records. `scopeCovers` (Academic Reviewer, Content Manager, SA-15, "stuck") is unchanged.                                                                                                                                                                                                     |
| PD-3 option C + safe no-scope            | Register a Vendor (SA-16) asks "What can they submit to?" — "Any course" selected when it opens, "Assign courses next" the alternative — and writes the scope with the registration (history: registered, then scope assigned). No active scope (none, or every one withdrawn) = no submission rights. Overview, My experiments and Create experiment then say "No course is assigned to you yet" with no Create experiment; own records stay readable and drafts read-only. |
| PD-4 no one-experiment scope for Vendors | SA-17 offers a Vendor "All experiments" and "A course" only; the domain refuses assigning or restoring a one-experiment scope to a Vendor (`not-for-vendor`). One already held stays recorded and withdrawable, grants nothing, is not counted as a scope and does not block a course scope. Reviewers and Content Managers keep the three kinds.                                                                                                                            |

## 3. Changes by layer

- **Domain** (`packages/domain`): `vendorCourseGrant` / `grantCovers` / `grantIsEmpty` replace
  `vendorCourses` (no `policy-open` ROLE-11 any more); `assignScope` / `restoreScope` refuse a
  Vendor one-experiment scope; submission decisions take the grant; `canRead` answers not-own for
  a same-studio colleague (SUB-15); `OWNER_DECIDED_OPEN_ROWS` gains ROLE-11 (PD-2, 27 Oct 2026);
  `OPEN_CAPABILITIES` loses `vendor.non-course-scope`. The frozen matrix JSON is unchanged.
- **Contracts** (`packages/contracts`): `registerHolderInput.anyCourse` (optional, Vendors only;
  PC-75, owner-approved interim); Vendor methods no longer answer `policy-open` (ledger and port
  error types); `SA-17.target.not-for-vendor` registered as undrawn (no invented words).
- **Prototype services** (`packages/sample-platform`): the Vendor's courses come from the grant
  ("All experiments" expands to the courses that exist, so a non-existent course is refused with
  the existing `course-not-assigned`); no Vendor read is refused for the scope kind any more; the
  same-studio flag is gone; registration writes the "Any course" scope in the same write.
- **Web** (`apps/web`): VE-07 one not-found state for every refusal; the no-course state on
  VE-01, VE-02 and Create experiment (with its own page heading); SA-16 radio cards; SA-17 Vendor
  choices, "Can act on" words, inert one-experiment scope (no Restore), Vendor no-scope line.
  New state-copy entries (provisional, VD-12): `VE-01.no-course.*`, `VE-03.refused`,
  `SA-16.vendor-start*`, `SA-16.register-any-course`, `SA-17.vendor-any-course`,
  `SA-17.vendor-experiment-inert`, `SA-17.vendor-choices`, `SA-17.vendor-no-scope-line`. Retired:
  `VE-07.policy-open.*`, `VE-03.policy-open`, `SA-17.vendor-open`.
- **Docs**: this record; the decisions README; the domain README; the hands-on guide's Vendor
  notes (step 4 now chooses "Assign courses next"; the ROLE-11 warning is gone).

## 4. Deviations from the frozen design (recorded, for sign-off)

The approved VE-v1 and SA-v1 exports do not draw: the no-course state (VE-01, VE-02, Create
experiment), the "What can they submit to?" choice in Register a Vendor, the Vendor-only scope
kinds and their lines on SA-17, and the inert one-experiment line. Each is built from the kit's
existing components (ListState, ChoiceGroup, Notice) and its words are provisional state copy.

## 5. Existing accounts and saved worlds

No data is rewritten and the seed is unchanged, so every saved browser world loads as before.
Course-scoped Vendors (Anil, Ritu) behave as before. A Vendor that already held "All experiments"
regains their workspace and records with any-course submission. A held one-experiment scope grants
nothing. Every record keeps its creator.

## 6. Tests and results

| Check                                                                                               | Result                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm verify` (isolated ports)                                                                      | format PASS · repository PASS (46 checks, handoff 178/178) · workspace PASS (11,708 unit tests: domain 794, contracts 785, sample-platform 349, ui 1,506, web 7,818, …) · bundle PASS · browser: 3,500 passed, **8 failed** = two older specs × four widths that registered a Vendor without choosing and expected no scope (`phase-5/vendor-home.spec.ts` "first visit", `phase-6/platform-roles.spec.ts` "Register a Vendor") |
| Those two specs, updated to choose explicitly, + the new spec, four widths                          | 50 passed, 6 skipped by design (single-width tests), 0 failed                                                                                                                                                                                                                                                                                                                                                                   |
| Parity (run separately; the gate stops before it on a failure)                                      | specimens 32/32; web 43 passed, 4 failed = the five recorded Public artwork comparisons (§7)                                                                                                                                                                                                                                                                                                                                    |
| New service tests (`vendor-ownership.test.ts`)                                                      | 8: same studio and other studio not-own on record / editor / revision; Anil with All experiments; non-existent course refused; registration with and without Any course; every scope withdrawn; one-experiment refused and inert                                                                                                                                                                                                |
| New browser spec (`phase-7/vendor-ownership.spec.ts`, product build, real screens, typed addresses) | no-course at 1440 / 1024 / 768 / 375 (axe, one h1, targets, overflow); two Northline Vendors and one Harbour Labs Vendor never open each other's records; Anil with All experiments keeps his records and creates under CHE ZG513; every scope withdrawn → no Create, the draft read-only                                                                                                                                       |

## 7. Visual parity

Run separately on this build (the gate stops before parity when a browser test fails): specimens
32 / 32 passed; web 43 passed, 4 failed — **exactly the five recorded Public artwork comparisons**
of the baseline (B1-03 f0 whole frame, B1-03 f2 experiments, B1-05 f0 preview and whole frame,
B1-05 f6 poster). No new difference. The changed Vendor and Super Admin screens have no v46 parity
board (their v46 comparisons are retired for the V3 screens), so the new states are covered by the
browser checks above, not by parity.

## 8. Known limitations

- The Engineering area step (PD-5) is correction B — not done.
- A Vendor with "Any course" can submit to a course no Academic Reviewer covers; it shows as
  "Stuck — nobody can act" on SA-12 (existing behaviour).
- The contract suite has one sample Vendor, so two-Vendor ownership is proved by the service tests
  and the browser spec, not by a contract case.
- A held one-experiment scope cannot be created through the UI any more; it is proved by service
  and component tests on a world saved before the change.
