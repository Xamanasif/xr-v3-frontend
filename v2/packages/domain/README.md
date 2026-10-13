# @xr/domain

The business rules of the XR Learning Platform: types for the 28 models, their state machines,
the permission policy and the read models. Framework-free — no React, Next.js, database, zod or
workspace package at runtime (`src/boundaries.test.ts`; the `@xr/config` boundary matrix and the
`xr/deterministic` lint rule say the same from outside). Every function is pure: it takes the
records, the actor, `now` and an injected `IdSource`, and returns a `Decision<T>` — the next
records, or a refusal that writes nothing. Nothing here reads a clock, a random source, a store or
the network.

**Status (WP-0.9, 13 Oct 2026).** Built from the frozen v46 boards and the candidate appendices
(`docs/v46/audit/` Appendix B permissions, C schemas, D architecture). The candidate matrix is
evidence, not owner approval: CONFIRMED and PROVISIONAL rows are built as v46 draws them, and
every undecided point answers `policy-open` instead of being decided here. Service ports and zod
DTOs (WP-0.10), the sample world (WP-0.11) and UI words are not in this package.

## Layout

| Folder                                               | Models (Appendix C)                                                                                  | Matrix rows                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------- |
| `kernel/`                                            | §1: branded ids, time, record meta, history, `Provided<T>`, decisions, transition tables, `IdSource` | —                               |
| `institution/`                                       | M01 Institution · M02 Institute Admin assignment · M05 Access plan, term clock                       | INST-\*, ACC-\*                 |
| `request/`                                           | M03 Access request + payment attempt · M04 Selection                                                 | REQ-\*, SEL-\*                  |
| `catalogue/`                                         | M06 Area · M07 Course + platform code · M08 Institution code · M09 Experiment                        | CRS-\*, CC-\*, EXP-\*           |
| `submission/`                                        | M10 Submission (first publication)                                                                   | SUB-\*, LO-\*                   |
| `correction/`                                        | M11 Correction (corrected-version release)                                                           | UPD-\*                          |
| `people/`                                            | M12 Person · M13 Group · M14 Faculty course mapping                                                  | PER-\*, GRP-\*, FCM-\*          |
| `access/`                                            | M15 Student access grant, open gate, licence wait (supplied)                                         | SACC-\*                         |
| `runtime/`, `completion/`, `resources/`, `feedback/` | M16 Runtime activity · M17 Format completion + progress · M18 Resource opened · M19 Format feedback  | RUN-\*, CMP-\*, FB-\*           |
| `assessment/`                                        | M20 Assessment · M21 Question bank · M22 Attempt, marking, result                                    | ASMT-\*, Q-\*, ATT-\*           |
| `device/`, `support/`, `platform-roles/`, `session/` | M23 Device transfer · M24 Support report · M25 Platform role holder · M26 Mock session               | DTR-\*, SUP-\*, ROLE-\*, SES-\* |
| `read-models/`                                       | M27 usage, content access, access ending, sidebar counts                                             | RUN-12, ACC-11, …               |
| `policy/`                                            | `may`, `availableActions`, `canRead`; the rule table                                                 | all 347                         |
| `invariants/`                                        | the 12 invariants of Appendix D §5.5                                                                 | —                               |
| `testing/`                                           | test support only — never built (`tsconfig.build.json`) or exported                                  | —                               |

M28 History is `kernel/history.ts`: every record carries its own entries, each with the audience
that may read it. Public is a surface, never a role (`PublicActor`); there are seven roles.
Programme is a field on the Student record only — no navigation level and no Module layer. Formats
always read WEB · AR · VR · MR. The two Composite Wall experiments are two records with two ids.

## The five states never collapse (BC3, BC9)

| State                                    | Written only by                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| ① publication — Submission, Experiment   | the Content Manager's `publish`; the Super Admin's `releaseUpdate`              |
| ② institution access — Institution, plan | the Super Admin's request decisions; `system:payment-provider`; Pause / Restore |
| ③ entitlement — Student access grant     | the Institute Admin's `giveAccess` / `withdrawGrant`                            |
| ④ runtime activity                       | `system:runtime-report` (`recordRuntimeActivity`)                               |
| ⑤ completion — `FormatCompletion`        | the system completion handler (`reportCompletion`)                              |

Publish and Release return the submission or update and the experiment only — no plan, grant or
mapping (`SUB-30`, `SACC-18`; invariant 1). Activation creates no grant; a grant creates no
activity (invariant 8). The open gate (`experimentGate`, `canOpenFormat`) reads ①–③ only.

## Decisions and refusals

`Decision<T> = { ok: true, value } | { ok: false, refusal }`. Refusals: `not-permitted`
(wrong workspace, out of scope, not one's own record), `invalid-state` (the record has moved on),
`refused` (a drawn refusal with a `RefusalCode`), `conflict`, `validation-failed` (field issues)
and `policy-open` (an undecided rule was reached: nothing is written and no can / can't statement
is made). Transition tables are data (`*_TRANSITIONS`); every decision consults its table, and
the tests run every command from every state against it.

## Policy

- `may(context, action, subject)` and `availableActions(context, subject)` — deny by default. Each
  rule names the candidate-matrix ALLOW rows it implements, is offered to exactly the roles of those
  rows, and carries the weakest status of its rows. Each rule checks role and scope, then dry-runs
  the command's own decision, so an offer is exactly what the decision would accept
  (`validation-failed` does not withdraw an offer).
- Scope is read from records, never taken on trust: a Student's open gate is computed by the policy
  from the access records in the subject (`AccessFacts`) — the WEB format gate for Launch and
  Continue WEB (RUN-06) — and a Vendor's courses come from their own active scopes (`vendorCourses`;
  a non-course scope answers `policy-open` ROLE-11). Faculty act only in their own institution, on
  experiments they teach; a question someone else added is open (Q-10, OD-B4-17), and a draft is
  its requester's own (Q-05).
- `OPEN_CAPABILITIES` — the 15 OPEN rows: never in `availableActions`; `may` answers `policy-open`.
- SYSTEM transitions — reachable only through system writers (`SYSTEM_ACTORS`); a system actor is
  offered no user command, and no rule calls a system decision.
- `canRead(context, target)` — the READ rows (P7 scope model).
- `src/policy/matrix.test.ts` covers 347/347 rows, one case per row named with its id, kind and
  status. It reads `v2/docs/v46/permission-matrix.json` and pins its SHA-256 (`34826fec…`): a
  changed row fails until the suite changes with it. The checksum-pinned copy under `test-data/`
  that Appendix F §5.3 suggests [PROVISIONAL] was not made, to keep one copy of the candidate
  matrix; `pnpm verify` runs turbo with `--force`, so a cached replay cannot hide a change.

## Completion (G-2: AD-39, P3-01 (a)/(d))

Completion is its own record, written only by the system completion handler: `reportCompletion`
refuses every person and every other system writer, and the first completion stands.
`completionFromRuntimeEvents` is the handler's decision behind the injected `CompletionPolicy`: the
policy is required (no default), sees only `SIMULATION_COMPLETED` reports of that one format, and
the committed `interimCompletionPolicy` is PROVISIONAL. The completing event is still open (T-12):
nothing infers Completed from a launch, an opening, sessions or time. `formatProgress` reads
Completed only from a completion record.

## Phase-0 interims

- **AD-14 / P1-04 — owner decision (OWNER-REVIEW; ADR-0007 §4).** The requester's "Submitted"
  becomes "Under review" only from a seeded or test-only fact: `recordReviewStarted`, written by
  `system:review-start`. No product path calls it; opening SA-03 changes nothing. **Discrepancy:**
  Appendix F WP-0.9 acceptance (8) still reads "on the first SA-03 decision read"; the owner
  decision supersedes it, and that side effect is not implemented.
- **DV-1.** The overlap of a withdrawn individual grant and an active group grant goes through the
  injected `OverlapGrantPolicy`, which has no default; the interim `UNDECIDED_OVERLAP_POLICY`
  answers `policy-open` (OD-B2-01) — at the gate, through every offer that reads it, and in the
  group-member words, which compute no "Can open it" for that member. No grant wins by default.
- **DV-2.** Objective marks come only from explicitly supplied values (`applyObjectiveMarks`,
  `system:objective-marks`); no code compares an answer with a key, and no scoring function exists.
  Without every choice question's supplied mark, Confirm marks answers `policy-open` (ATT-07) and a
  result shows no figure — no score is made from a missing mark.

## Open decisions answered `policy-open`

T-01 (cold visit to a request status), T-03 (deciding after "Information requested"), T-07
(renewing an until-date plan), OD-B3-09 (plan effect of a renewal or more licences), REQ-19, INST-06,
OD-B2-01 (overlap; group-grant withdrawal, SACC-08), OD-B2-02 (members added after a group grant),
GRP-05 (members removed after it), SACC-11, SACC-14 (earlier work after withdrawal or the end),
PER-07, CC-06, OD-B4-17 (co-teaching, ASMT-17; a colleague's question, Q-10), ATT-07 (automatic
marking), ATT-17 and "no written question" (M22), OD-B3-01
(several authorised devices), ROLE-11, SUB-15, SUP-04, SUP-07, SES-09, and a format "not available
right now" (drawn without a cause). The other OPEN capabilities answer with their register ids
(R06, ND-04, Q-11, OD-B3-05, OD-B7-09).

## Proposed readings [P] (reported to the owner)

Term ends: yearly 8 Oct 2026 → 7 Oct 2027, monthly and quarterly read the same way, dates in UTC;
"Ending soon" inclusive at 15 days (`ENDING_SOON_DAYS`); an unreadable date is invalid data, never
"expired" (CF-06). A student-import course code that names no course is an error. A licence wait
is a supplied fact with no stored message. A smaller scope may not raise licences. A pass mark
keeps its exact fraction (rounding open). A result releases at the later of the setting's moment
and the confirmation. Feedback also needs the open gate (AD-22). Nobody resolves their own support
report (SUP-03), and a Super Admin reopening their own is open (SUP-04). Only Vendors, Academic
Reviewers and Content Managers can be registered as platform-role holders (ROLE-07). Added for the
mock: the seven system writers, the refusal codes, the institution event `licences-requested` and
the plan events `access-given` / `access-withdrawn`. A question-less assessment cannot be Ready
(OD-B4-03), so ASMT-15 does not arise. A question draft records its requester and institution
(Q-05 "own drafts"; Appendix C M21 names no owner field).

## Reuse and exclusions

- **Committed foundation, kept:** the role and format vocabulary (`roles.ts`, `technology.ts`),
  the runtime-event vocabulary, `CompletionPolicy` with `interimCompletionPolicy`, and the session
  fold (`foldSessions`; `deriveSimulationUtilisation` and `SimulationStatus` stay off the package
  root, ADR-0006). `foldSessions` keeps its WP-0.3 default (the interim policy) for a future
  runtime adapter; it writes nothing, and the completion handler takes no default.
- **Slice 1 (read-only, from the original checkout):** two rules of its `term.ts` — the 15-day
  window is inclusive, and an ending-soon plan is live through its end. Nothing else: not its
  campus / learner-places access model, not its licence arithmetic (D7), not its instant-based
  "fail closed as expired" (CF-06 replaces it), no UI and no "demo" naming.

## Tests

`pnpm test` here runs the model and transition suites per family, `status-unions.test.ts`
(acceptance 1), `policy/matrix.test.ts` (acceptance 4), `invariants/invariants.test.ts` (acceptance
3: five fixed seeds × 300 commands, every invariant after every step, and mutation cases) and
`boundaries.test.ts` (acceptance 6, 7; DV-2). Left to WP-0.11: the `afterFlow('E')` and
`stateCoverage()` fixtures of acceptance (5) and invariant 10, and the sample provenance of
invariant 12.
