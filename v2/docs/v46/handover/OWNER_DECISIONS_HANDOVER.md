# Owner decisions, open policies and future-phase requirements — WP-0.16 handover

Branch `v2/frontend-v46`, 14 Oct 2026. This list carries forward everything the Phase-0 build
depends on that is not settled, grouped by the phase in which it must be resolved. It is compiled
from the owner decision record (`../../decisions/README.md`), Appendix F §10.2–§10.4, Appendix G
§D–§E (frozen audit evidence; ids kept), the WP-0.15 deviation register
(`../../../tools/board-capture/DEVIATIONS.md`, `TRACKED`), the sample-platform interpretations
(`../../../packages/sample-platform/README.md`) and this work package's own findings.

**Kinds.** Every item carries one of these, and they are never mixed:

| Kind | Meaning |
|---|---|
| **OA** — owner-approved | The owner decided it in writing (a WP authorisation or the decision record). Only what the record says is decided. |
| **PE** — provisional engineering choice | Built and tested as a stated default; the owner has not objected, but has not approved the choice itself. |
| **UP** — unresolved business policy | The product question is open. The build implements only the designed safe treatment or a named interim, and **a passing test of the interim does not decide the policy**. |
| **FR** — future-phase implementation requirement | Known work a later phase must do (no owner question). |
| **TL** — technical / testing limitation | What the Phase-0 evidence does not cover. |

## 1 · Owner-approved decisions in force (OA) — and what each does not decide

| Decision | Recorded | Decides | Does **not** decide |
|---|---|---|---|
| G-1 option B: external backup, no WIP commit on Slice-1 | 12 Oct | Slice-1 preserved off-repo (`~/Downloads/XR-AR-VR-Uncommitted-Backup-2026-10-12`, 6/6 checksums, 98 paths) | Where Slice-1 goes long-term; P0-01 remote |
| G-6 worktree + branch `v2/frontend-v46` from `1b090c9` | 12 Oct | Location and base | Merge target or landing on `main` (P0-01) |
| G-7 commit the frozen handoff at `design/handoff-v46/` | 12 Oct | The zip `9d33f32e…24bf` is the approved artefact | — |
| G-5 (a) install, (b) axe deps, (c) vendored capture inputs (WP-0.15, capture tooling only) | 12 / 14 Oct | Downloads named | Other browser engines; production font self-hosting (P0-05) |
| G-2: TE-1, TE-2, TE-5, TE-7 and AD-39 (`CompletionPolicy`) | 12 Oct | Mock services, sample identity, sample clock, test-only seams, completion stored as a system record | The completion trigger (T-12); real auth, payment, XR runtime, persistence |
| G-3 option A: v46 CSS verbatim in `xr.v46`, no Preflight, Tailwind layout utilities only | 12 Oct | CSS architecture (ADR-0001) | — |
| G-8: sign-in in Phase 1; test-only access in Phase 0 | 12 Oct | Phase-0 scope | The Phase-1 sign-in policy items (P1-01, P1-19) |
| AD-14 / P1-04 interim: review start comes only from seeded / test-only facts | 12 Oct | No product path decides when review starts | **What starts review (P1-04) stays open** |
| P0-31 interim: My reports title = display-only excerpt of "What happened" | 12 Oct | Phase-0 display | **The final title source stays open** |
| Precedence: boards over handoff JSON, discrepancy documented | 12 Oct | HB-01…HB-24 handling | Board-versus-board contradictions (Appendix G §B.2) |
| Browser persistence deferred (ADR-0004 option A, TE-6 not authorised) | 12 Oct | Phase-0 world lives in memory per tab | **Whether reviewers get persistence (P0-02 / AD-07) stays open** |
| ADR-0008 service-contract shape — acknowledged, limited scope | 13 Oct | Port / result / error shape | — |
| E-alt3: `ProductionService.listAllContent` implemented early | 13 Oct | One method moved to WP-0.11, read-only SA permission | No other Phase-6 method or screen |
| WP-0.15: G-5c + VD-18 **local interim** (same machine, same browser, same run) | 14 Oct | How Phase-0 parity is measured | **The runner (VD-18) stays open** |
| WP-0.15 visual closure: DEV-01, 02, 04, 06 (VD-11), 07, 08 (VD-06), 09, 10 (P0-35 interim), 11, 12 (VD-22), 13, 14, 15, 17, 18, 20 approved; DEV-03, 19 approved rules; DEV-05 acknowledged as measured; DEV-16 deferred to ST-19 | 14 Oct | The 64 registered differences of the frozen-v46 prototype | Business policies or later screens; "the designed screens are implemented" |

Acknowledged by non-objection: the Appendix F §10.2 defaults were presented "proceed unless you
object" (OWNER-REVIEW) and the owner approved the review's recommendations on 12 Oct without
objection. They remain **PE**, not OA. Still requested and not recorded: the owner's
acknowledgement of **ADR-0005** (route conventions; engineering, routes are the implementer's
choice) and sign-off of the **P0-03** WP-0.2 documentation amendments.

## 2 · Before any hosted stakeholder (PM / academic) review — cross-phase gate

These stop an ordinary stakeholder from using the build on their own, whatever phase it is in.

| Item | Kind | Today | What is needed |
|---|---|---|---|
| Sign-in and public entry (XS-01/03/04, PU-01…PU-14) | FR | Not built (G-8). A signed-out visitor sees PU-15 at `/`; workspaces are reached only through the CI-only boot descriptor (test-hook build) | Phase 1 builds them |
| Browser persistence (P0-02 / AD-07 / TE-6) | UP | Option A: a reload or a typed URL resets the world (K-8) | Owner decision before reviewers walk a flow |
| Hosted seed default (DV-6 / X-6 / P1-12) | UP | Spine-start is the boot default | Decide before the Phase-1 review |
| Hosting and remote (P0-01) | UP | No git remote, no CI, no hosted build (K-21: Phase-0 builds are engineering builds, not shown as product) | Owner: remote, PR base, hosting |
| Official BITS Pilani / WILP logo (P0-04 / VD-03 / BC12) | UP | `LogoPlaceholder`; `branding/bits-pilani-wilp-logo.png` not imported | An authorised branding asset from the owner; replace the placeholder only then |
| Live system states in reviewer builds (P1-18 / AD-40) | UP | No product path confirms a payment or completes a format | Decide per Phase 1 (payment) and Phase 3 (completion) |
| Cross-browser (P0-28) | TL | Chromium only; WebKit / Firefox not run | See §9 |

## 3 · Phase 1 — public + access spine (SA-01…03, 06, 07; XS-01/03/04; PU-01…14)

| Item | Kind | Notes |
|---|---|---|
| P1-04 / AD-14 — what moves a request to "Under review" | UP | Interim OA (seeded facts only) stays until answered |
| P1-01 / DV-3 — sample sign-in credential rule on XS-01 (TE-1, AD-03, T-10/T-11 open) | UP | Default: known sample e-mail + any non-empty password |
| P1-02 / O-05 / DV-5 / T-01 — who may open PU-10 and PU-12; cold visits | UP | Routes O-05 recommended; PU-10 today answers only the ticket-holding browser session |
| P1-03 / O-08 — undrawn direct visits | PE | |
| P1-05, P1-06 (TE-4 payment stand-in), P1-07, P1-08, P1-09, P1-10, P1-11 | UP | Request lifecycle; TE-4 must be signed before Phase 1 |
| P1-12 — anchor date and sample conflicts S-1…S-11 | UP | Sample data only; one reading recorded in `sample-platform/README.md` |
| P1-14 / VD-10 — decision ids inside product copy (B7-02/B7-03) | UP | |
| P1-15 / TE-8 — client-rendered public pages | PE | TE-8 to be signed before Phase 1 |
| P1-19 / AD-21 — session expiry and return-address rule | UP | `returnTo` honoured only inside the role's base (PE) |
| P1-20 / AD-19 unsaved changes; P1-21 / AD-20 stale or concurrent changes | UP | |
| P0-12 / VD-05 — decision panel sticky or static | UP | Needed by SA-03, the first DecisionLayout screen |
| VD-04 / P0-11 — B1-10 sort placement | PE | Owner visual acknowledgement on SA-02; the SA-02 route test is written as `fixme` |
| SA-07 student list has no `rev`, which "Change status" (`overrideStudentStatus`) needs as `expectedRev` | FR | Contract gap found in WP-0.14; add `rev` (additive) or decide the flow when SA-07 is built |
| `OperationsService.getSuperAdminOverview` is scheduled for Phase 6, but SA-01's requests group ships in Phase 1 | FR | Confirm the requests group needs no overview figures (else an owner-recorded schedule exception) |
| PU-15 "Browse experiments" → `/experiments` (PU-04): the one documented Phase-0 dead link (P0-35) | FR | Resolves when PU-04 is built |
| P1-17, P1-22, P1-13 (no Campus entity), AD-37, AD-43 stakeholder flags; O-03, O-09 register corrections | PE / UP | Per Appendix F §10.3 |
| P0-03 documentation amendments sign-off | PE | Requested before Phase-1 workspace screens |

## 4 · Phase 2 — campus distribution (IA-01…11, 13…16; ST-01…05, ST-19)

| Item | Kind | Notes |
|---|---|---|
| **Institute Admin "Requests" count semantics** (DEV-17 tracked; WP-0.8 open item: the count opens IA-17 but counts IA-18) | UP | Decide before a counting destination is built |
| **SACC-14** — what stays viewable read-only after the only grant is withdrawn or access ended | UP | Today: no row, `policy-open` SACC-14 (sample-platform interpretation) |
| P2-01 / D7 / T-06 licence counting | UP | No counting rule exists anywhere (verified by scan) |
| P2-02 / DV-1 / OD-B2-01 overlapping grants | UP | `OverlapGrantPolicy` → `undecided` → `policy-open`; overlap fixtures kept out of seeded journeys |
| P2-03…P2-06 (O-07 record guard for ended / withdrawn access), P2-08, P2-10 | UP | |
| P2-11 / O-12 — does an Institute Admin see institution problem reports? | UP | Affects XS-07 and IA-01 |
| P2-07, P2-09 (paused / inactive wordings, §8-31), §8-33 paused IA presentation | PE | |
| **DEV-16** — MessagePage amber (paused) icon tone | FR (owner-deferred) | Required when ST-19 / XS-08 "Access paused" is built |
| Student row has no "Paused" or "Waiting for a licence" word (B2-12 draws "Paused") | FR / UP | Contract gap recorded in `sample-platform/README.md` |
| IA-01 access line is read from the plan (`getMyOverview` is Phase 2) | FR | WP-0.14 note |
| P2-12…P2-16, AD-36 CSV columns (stakeholder flag), CF-06 unreadable term end | PE / UP | |

## 5 · Phase 3 — learning, feedback, device chain

| Item | Kind | Notes |
|---|---|---|
| **T-12 / P3-01 — the learning-completion trigger** | UP | "Completed" is written only by the system completion handler behind `interimCompletionPolicy`; no launch, session, time or user action completes a format. The trigger is not decided, and the interim passing its tests does not decide it |
| TE-3 / DV-4 / AD-05 — WEB runtime stand-in route and FPM §G amendment | UP | Must be signed before Phase 3 |
| P3-02 feedback after access ends (AD-22), P3-03 device chain, P3-05 resources | UP | |
| P3-04 usage figures, P3-06 ST-18 direct visit, P3-07 / O-11 IA-01 device-row target | PE | |
| AD-40 live "Completed" in reviewer builds; AD-42, AD-45 stakeholder flags | UP | |

## 6 · Phase 4 — teaching and assessment

| Item | Kind | Notes |
|---|---|---|
| P4-01 / DV-2 / AD-38 — automatic marking of choice questions vs "no grading automation" | UP | Interim: fixture-supplied marks; `@xr/domain` has no scoring function |
| P4-02…P4-06, O-01 hub Assessment tab, O-04 / AD-15 release by the assessment's own setting, AD-28, AD-35, AD-41 | UP / PE | |
| P4-07 — consistent Help on the ST-13 focused page | PE | |

## 7 · Phase 5 — production and first publication

| Item | Kind | Notes |
|---|---|---|
| P5-01 / M-3 resubmission routing | UP | Interim: routed by a test-only seam; a live walk leaves a resubmission "resubmitted" |
| P5-02…P5-07, P5-09; AD-19, AD-20, AD-23, AD-33; OD-B5-07 | UP | |
| P5-08, P5-10 | PE | |
| OD-B5-09 — "Composite Wall Conduction" and "Conduction Through a Composite Wall" stay two records | UP (BC11) | Invariant enforced; no merge rule |

## 8 · Phase 6 — corrections and governance; Phase 7 — consolidation

| Item | Kind | Notes |
|---|---|---|
| P6-01…P6-05 (held update blocks corrections, correction fields, withdraw reason, SA override, SA dialog validation) | UP | |
| P0-30 / SUP-04 / AD-26 — who reopens a support report | UP | Interim: no reporter Reopen; reopening only as the Super Admin command (B7-09) |
| B7-06 Vendor-override / third content-record variant words | UP | The read rule hides such an update from the Super Admin; the sample never produces the variant (owner review) |
| P6-06 "Ending soon" threshold (15 days, BR-049) | PE | |
| P7-01 final labels; P7-02 sign-off of expected baseline deviations | PE | |
| VD-18 — standardized visual-comparison runner and pinned Linux image; re-run and re-pin the 441 comparisons, 136 references and 64 pins there | UP / FR | DEV-05 rechecked there |
| **DEV-05** — two icon anti-aliasing residuals (2 px clock, 6 px triangle), cause not proven | TL (owner-acknowledged) | Recheck on the runner |
| P0-28 — declared browser policy (Chromium 105+, Safari 16+, Firefox 121+) verified | TL | Needs the runner or a G-5 approval for WebKit / Firefox downloads |
| P0-35 — remove the interim built-screen navigation: each phase adds its destinations; `/<base>` → Help redirect retires when each workspace home is built | FR | Approved as Phase-0 interim only (DEV-10) |

## 9 · Provisional choices and technical limitations that span phases

| Item | Kind | State |
|---|---|---|
| VD-08 dialog alignment mapping (P0-15) | PE | Tracked; dialog box compared on board 10 |
| VD-16 skip link on every shell (P0-22) | PE | Tracked; within tolerance on board 12 |
| VD-04 B1-10 sort design | PE | Tracked (Phase 1, SA-02) |
| P0-31 final report-title source | UP | Interim OA |
| P0-05 / VD-02 Public Sans delivery (Google Fonts link in product, as the boards) | UP | Default chosen |
| P0-16 / P0-21 / DV-8 designed motion and forced colours | UP | Deferred; the v46 reduced-motion guard stays |
| P0-24 / VD-20 / DV-7 rail preference | UP | Memory per tab |
| P0-14, P0-18…P0-20, P0-23, P0-25, P0-27, P0-29, P0-32, P0-33, AD-24, AD-27, §8-32 | PE | As built |
| AD-25 `tenant_admin` id with "Institute Admin" label; WEB·AR·VR·MR order (P0-06, P0-07) | PE | |
| Mock / policy interpretations recorded in `sample-platform/README.md` (RV-03 revision content, experiment-id slugs, `null` answers, pre-rendered words PC-13, Student rows per SACC-12/14, feedback state) | PE | Each reviewable; none decides a policy |
| Hosted-walkthrough gaps: payment never confirmed (TE-4), format never Completed (TE-3), resubmission stays "resubmitted" (M-3), reload resets (TE-6); background institutions have no person records | TL | By design until the owner decides |
| **Cross-browser**: Chromium only. WebKit and Firefox have never been run against this build | TL | P0-28; runner (VD-18) or a G-5 download approval |
| **Parity is same-machine** (macOS, Chromium, local interim): baselines are not portable | TL | VD-18 |
| **Animation-settling test helpers**: 9 of the 10 helpers still treat a cancelled transition as an error (`finished` rejects with AbortError). Stress run in WP-0.16: see the verification record §3 | TL | Fix narrowly only when a failure reproduces |
| CI retries: `@xr/testing` sets `retries: 2` when `CI` is set (0 locally). With no runner, no evidence here used retries; a future runner must not let retries mask flakes | TL | Decide with VD-18 |
| No git remote, no CI: every gate is local (K-17) | TL | P0-01, VD-18 |

## 10 · Production-only (do not block a frontend phase)

Appendix G §E: 106 production-blocking decisions in 11 themes (E1 access requests and payment … E11
notifications), each with a designed safe treatment, plus 22 flagged permission rows and the 41
UNRESOLVED permission rows (`PERMISSION_COVERAGE.md`). Real authentication, payment processing, XR
runtimes, grading automation and backend persistence remain out of scope unless separately
authorised (BC10).
