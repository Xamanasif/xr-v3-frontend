# 11 — Open Questions, Reframed

**Review:** 006 — Full Platform Reframe
**Created:** 2026-08-18
**Method:** **Started fresh from the full-platform perspective.** Not a migration of the Review-005 register.

---

## Relationship to the Review-005 register

`ui-ux/01-requirements/OPEN_QUESTIONS.md` (38 open items) is **preserved unchanged** as the Learner-scope register. It remains valid for Learner-workspace work.

**This document starts from zero at platform scope.** Where a Review-005 question survives, it is restated in platform terms and cross-referenced. Where the PM answered one, it is **closed here explicitly** rather than silently dropped.

## Numbering

New identifiers by class, so they never collide with `Q-01 – Q-56`:

| Prefix | Class |
|---|---|
| `QP-` | **PRODUCT** — a business or product owner must decide |
| `QT-` | **TECHNICAL** — engineering or architecture must determine |
| `QD-` | **DATA / INTEGRATION** — depends on an external system or data contract |
| `QX-` | **DESIGN** — resolvable within UI/UX once something else is known |
| `QF-` | **FUTURE PHASE** — recorded so it is not mistaken for an omission |

## Priorities

| Priority | Definition |
|---|---|
| **BLOCKER** | **Platform IA genuinely cannot proceed.** Reserved strictly |
| **HIGH** | Changes platform structure, authority, or a legal/compliance position |
| **MEDIUM** | Changes a screen or flow, not the architecture |
| **LOW** | Detail; a labelled reversible position exists |

---

# Part A · Closed by the PM — do not re-ask

These were open, ambiguous, or assumed before 18 August 2026. **They are now settled.** Any document still treating them as open is out of date.

| # | Question | Resolution | Authority |
|---|---|---|---|
| 1 | What is the UI/UX scope? | **All Phase-1 requirements and all Phase-1 roles** | **PM-01** |
| 2 | Is it B2B, B2C, or both? | **Both.** Neither is sequenced ahead of the other | **PM-04** |
| 3 | Is this one platform or several products? | **One central portal with role-based workspaces** | **PM-03** |
| 4 | Is Vendor a real role? | **Yes — actual platform login and workspace** | **PM-07** |
| 5 | Is Academic Reviewer a real role? | **Yes — actual platform login and workspace** | **PM-07** |
| 6 | Are assessment rules fixed or configurable? | **Configurable through the portal, consumed via flexible APIs** | **PM-08** |
| 7 | Is the current learning sequence acceptable? | **Yes** — resources → simulation → assessment → completion | **PM-09** |
| 8 | Is SSO required or deferrable? | **Required.** Keep it in the architecture and institutional auth UX | **PM-10** |
| 9 | How much reporting is needed now? | **Core operations first;** analytics added incrementally | **PM-11** |
| 10 | Is certification in Phase 1? | **No — Phase 2.** Recorded as an FRD deviation | **PM-12** |
| 11 | Do the XR simulations exist? | **Yes.** The team is not building every simulation from scratch | **PM-06** |
| 12 | Must entitled experiments reach the device? | **Yes — confirmed product requirement** | **PM-05** |
| 13 | *(Review-005)* Q-01 audience · Q-02 auth path · Q-04 commerce scope | Absorbed by PM-01, PM-04, PM-10 | PM |
| 14 | *(Review-005)* Q-12 certification UI in Phase 1 | **Closed — no.** Superseded by PM-12 | **PM-12** |
| 15 | *(Review-005)* Q-07/08/09/54 assessment values | **Closed as global constants.** Now configuration fields | **PM-08** |
| **16** | **Where do Vendor, Academic Reviewer, and Content Manager sit in the tenancy model?** | **Central content plane.** Two-plane model confirmed; Super Admin alone retains cross-tenant governance (1.3.5); **no additional cross-tenant permissions for any other role** | **PM-13** |
| **17** | **Is there a reject / revise / resubmit path in the governance chain?** | **Yes.** Approve · changes-required · comments/reason · Vendor correction · resubmission. **No automatic publication path after rejection** | **PM-14** |
| **18** | **Is there an audit trail for governance decisions?** | **Yes — "review history / status traceability" is required.** **Content governance chain only** | **PM-14** |
| **19** | **Who configures assessments for a B2C individual learner?** | **Faculty / institution-authorized side — for both B2B and B2C. The learner never authors or configures** | **PM-15** |

**Nineteen closures — 15 from the 18 August baseline, 4 added by the 19 August closure update.** The `Q-`-numbered ones remain listed in the Review-005 register for history; they must not be reopened here.

---

# Part B · PRODUCT questions — `QP`

## BLOCKER — none

**No product question blocks the platform sitemap.** Every item below has either a safe working position or a surface that can be drawn as a marked gap. This is stated deliberately: calling something a blocker when work can continue is as damaging as missing a real one.

## HIGH

### ~~`QP-01`~~ — ✅ **CLOSED by PM-14 (19 August 2026)**
*Was: is there a reject / revise / resubmit path in the content governance chain?*
**Answer: yes.** Academic Reviewer and Content Manager may each **approve** or **request changes** with comments/reason; the Vendor **corrects and resubmits**; the submission **re-enters review**. **No automatic publication path after rejection.**
**Now designed in** `05` FLOW 1 ⑥ · `02` D7–D10 · `10` `VND-01/03/04/05`, `ARV-01/02`, `CM-01/02`, `SHR-05` · 🟠 recorded as an **FRD extension**
**Residual — new, LOW:** whether **Super Admin** may also return at gate ④. PM-14 names only Academic Reviewer and Content Manager. **Not invented** — see matrix D7 (SA)

### `QP-02` — Who grades descriptive answers, on what turnaround, against what rubric?
FRD 5.2.3 permits short descriptive answers. **No Phase-1 requirement assigns grading to anyone.** Compounded by PM-09 · `D-08` · `D-07`: progression gates on passing, so an ungraded answer strands the learner indefinitely.
**Affects** `FAC-11`, `LRN-12`, FLOW 4 · **Working position** the queue is named and positioned but **explicitly unowned and undesigned** · **Ref** matrix F10 · Review-005 Q-24

### ~~`QP-03`~~ — ✅ **CLOSED by PM-13 (19 August 2026)**
*Was: where do Vendor, Academic Reviewer, and Content Manager sit in the tenancy model?*
**Answer: the central content plane.** The PM confirmed the Review-006 two-plane model.
**Central / platform content & governance side:** Vendor · Academic Reviewer · Content Manager · Super Admin
**Institution / tenant side:** Institute Admin · Faculty · Student / Learner
**B2C individual learners** use shared platform capabilities **without becoming an institutional tenant role**.
**Super Admin retains the FRD-defined cross-tenant governance capability (1.3.5); no additional cross-tenant permissions are granted to any other role.**
**Now confirmed in** `04` §two-plane model · `02` B2/B5 · `03` §9 — **this was the largest structural unknown of the reframe**

### `QP-04` — How is an institutional licence transacted in Phase 1?
FRD 6.2.1 says institutions *"shall purchase"* stream packages — **Phase 1**. But **all** institutional billing (9.3.1 GST invoicing, 9.3.2 subscription billing) is **Phase 2**. Phase 1 needs licences to exist with no defined transaction.
**Affects** `IAD-09`, `SA-11`, FLOW 2 ①, FLOW 9 · **Working position** licences are shown as **existing**; no in-platform purchase flow is invented · **Ref** matrix H2

### ~~`QP-05`~~ — ✅ **CLOSED by PM-15 (19 August 2026)**
*Was: who configures assessments for a B2C individual learner?*
**Answer: the Faculty / institution-authorized side — for both B2B and B2C. The learner does NOT author or configure assessments.**
**This removed a divergence rather than merely answering a question** — ownership is now identical on both sides, so `06` divergence 17 is **deleted from the register** (18 → 17).
**Two rules carried:** do **not** automatically grant Institute Admin authoring permission (Faculty is the FRD-named role); and the learner-side prohibition is now **stated** as matrix `F12`, not merely absent.
**Now recorded in** `08` §Ownership · `02` F12 · `06` §divergence 17 · `05` FLOW 4
**Residual — new, non-blocking:** see **`QP-25`**

### ~~`QP-06`~~ — ✅ **CLOSED by PM-14 (19 August 2026)** *— for the content governance chain*
*Was: is there an audit trail for governance decisions?*
**Answer: yes, for content governance.** PM-14 explicitly requires **"review history / status traceability"** — decisions, comments, returns, and resubmissions must be traceable.
**Now designed as** `SHR-05` Review history & comments — one component, four permission-filtered contexts (V own · AR · CM · SA)
**⚠ Scope limit, deliberately not extended:** PM-14 covers the **content chain only**. Audit trails for licensing changes, entitlement grants, platform configuration, and device-replacement approvals **remain undefined and are not invented** — see matrix `M4` (narrowed)

## MEDIUM

| # | Question | Working position |
|---|---|---|
| `QP-07` | Who creates and manages **Faculty** accounts? 8.1.3 names only *student access*; ERP provisioning (7.2.2) names only students | `IAD-04` drawn as **PENDING** |
| `QP-08` *(narrowed by PM-15)* | Does **Institute Admin** hold any assessment authority at all? | **PM-15 explicitly declines to grant it** — *"do NOT automatically grant every Institute Admin assessment-authoring permission"*. Faculty is the FRD-named role and holds it; IA cells stay `?` |
| `QP-09` | Who creates **bundles** and sets **prices**? 6.1.2 sells them in Phase 1; 6.3.1/6.3.2 configure them in Phase 2 | No Phase-1 authoring screen invented |
| `QP-10` | Is the learning **sequence** per-course configurable, or a platform constant? PM-09 approves the model, not its mutability | Treated as a platform model; no configuration surface drawn |
| `QP-11` | Do **multi-role identities** exist in Phase 1? | `AUTH-09` chooser renders only if they do; costs nothing if not |
| `QP-12` | Are **MCQs** single- or multi-select? Multi-select needs a partial-credit rule no scoring model defines | Single-select; carried from Review-005 Q-23 |
| `QP-13` | Is there an **extended-time accommodation** for assessments, and who grants it? | Improved by PM-08 — becomes an ordinary configuration field |
| `QP-14` | Who authorises and performs **MR sideloading** (2.1.2)? | Plausibly IA; **not assigned** |
| `QP-15` | Is **academic validation** (1.4.2) shown to learners or buyers as a trust signal? | Not shown; adding it unasked would invent a feature |
| `QP-16` | Are assessment **configurations reusable** across courses or cohorts? | Not addressed; no reuse mechanism drawn |
| `QP-17` | What **receipt or invoice** does a B2C buyer get? 9.3.1 is Phase 2 and institution-facing | `B2C-06` drawn; format pending |
| `QP-18` | What are the **refund / cancellation / revocation** rules? | None stated or implied |

## LOW

| # | Question | Working position |
|---|---|---|
| `QP-19` | Which **social login providers** are approved? | Samples, clearly labelled |
| `QP-20` | **Hint limits** — per question or per assessment? | A configuration field with no default |
| `QP-21` | Is there a **platform-default** assessment configuration? | Not invented |
| `QP-22` | May a configuration **change between attempts**? | Not addressed |
| `QP-23` | Is there a real **help destination** behind the consistent Help entry? | Location is consistent (WCAG 3.2.6); destination unconfirmed |
| `QP-24` | Is the **structural** certification node (3.3.1) modelled even though the experience is deferred? | **Not assumed either way** — PM-12 defers the experience, not necessarily the data model |
| **`QP-25`** | **For a pure B2C individual learner, *which* Faculty / institution / content owner supplies the assessment?** *(new — from PM-15)* | **Explicitly deferred by PM-15 as a content / implementation detail. NOT a blocker for platform IA.** Whoever supplies it acts on the Faculty / institution-authorized side, through the same portal surface, producing the same configuration — so no screen, permission, or flow changes |
| **`QP-26`** | **May Super Admin also return a submission at gate ④?** *(new — from PM-14)* | PM-14 names only Academic Reviewer and Content Manager. **Not invented** |

---

# Part C · TECHNICAL questions — `QT`

## HIGH

### `QT-01` — Which XR delivery mechanism? ⚠ *pending by PM instruction*
**PM-05 explicitly declined to select** between direct package delivery, a centralized XR application with entitlement-controlled modules, synchronisation/deep-link mechanisms, or another appropriate solution.
**Affects** `LRN-07`, `LRN-15`, FLOW 5 · **Working position** the UX contract in `07_XR_DELIVERY_MODEL.md` Part 4 is **mechanism-neutral by design** and survives any outcome. **Do not resolve this in UI/UX.**

### `QT-02` — There is no AR application architecture in the FRD
FRD 1.2.4 requires AR on Android/iOS. FRD Section 2 defines application architecture for **VR (2.1.1)** and **MR (2.1.2)** only. **There is no 2.1.3.** AR has no container, distribution channel, packaging requirement, or update path anywhere in the document.
**Affects** `LRN-07` AR variant, `LRN-15`, FLOW 5 · **Working position** **flagged, not filled.** AR is explicitly **not** assumed to behave like VR · **Ref** XR model Gap 1

### `QT-03` — What is the assessment configuration API contract?
PM-08 requires configurations *"consumable by the relevant Web/XR application through flexible platform/API integration"*. Schema, transport, versioning, and result return are all undefined.
**Affects** FLOW 4 ⑥ · **Working position** abstract. **One prohibition recorded now:** the correct answer must never appear in a learner-facing payload — not in the body, not in a debug field, not in a comment (`D-25`)

### `QT-04` — XR sign-in under SSO
FRD 2.4.4 requires institutional students to sign into the XR application with **LMS credentials**. FRD 4.2.2 + PM-10 make institutional **SSO** required. **An SSO-authenticated learner may hold no password to type into a headset.** Both are Phase 1 and they collide.
**Affects** FLOW 5 ⑥, FLOW 6 ⑥ · **Working position** recorded as a collision; **not designed around**

## MEDIUM

| # | Question | Working position |
|---|---|---|
| `QT-05` | What is the **XR package / submission format**? 2.2.1 says only *"encrypted asset bundles"* | `VND-03` upload drawn; format marked pending |
| `QT-06` | Do **web** simulations use the same encrypted-bundle and licence-validation path? | Unstated; affects load and pre-launch UX |
| `QT-07` | What is the **completion reconciliation** behaviour when a completion is never recorded? | Retry + refresh offered; **no manual override** — an override defeats the gate for everyone |
| `QT-08` | How fast does a device completion reach the portal? | Read-on-navigation plus an explicit refresh; cheap to delete if push exists |
| `QT-09` | Is the assessment **timer server-authoritative**, and how often do answers persist? | Server-authoritative assumed in handoff; unconfirmed |
| `QT-10` | How is **video coverage** measured (vs furthest playhead)? | Coverage, not position — furthest-playhead defeats the gate |
| `QT-11` | Which **payment gateway**, and redirect vs embedded? | Generic secure redirect (`C-05`) |
| `QT-12` | What is the **final technology stack**? 12.1.1 lists AWS / Azure / GCP | No dependency in UI/UX |
| `QT-13` | Are **session-expiry** durations per-tenant configurable? | Single behaviour assumed |

## LOW

| # | Question | Working position |
|---|---|---|
| `QT-14` | **Password policy, MFA, lockout** — absent from the FRD entirely | Design-supplied minimum |
| `QT-15` | Is a **storage-constraint** state technically reachable on target devices? | Held as **conditional**; not designed until the mechanism confirms it |

---

# Part D · DATA / INTEGRATION questions — `QD`

## HIGH

### `QD-01` — Which profile fields are user-editable versus ERP-owned?
ERP is authoritative (7.1.1) and scheduled sync (7.2.1) will overwrite local edits — visible data loss. FRD 4.3.1 nonetheless has users *providing* profile details. **Now applies to Faculty profiles too, not just learners.**
**Affects** `AUTH-07`, `LRN-14`, `IAD-02/03` · **Working position** ERP-sourced fields read-only with a provenance note · **Ref** matrix J6

### `QD-02` — What is the Phase-1 origin of role assignment?
FRD 7.4.2 (role mapping from IdP attributes) is **Phase 3**. FRD 8.3 (custom roles) is **Phase 3**. **Phase 1 has no stated mechanism for how a person becomes Faculty, Institute Admin, Vendor, or Academic Reviewer.**
**Affects** `AUTH-08`, `SA-14`, `IAD-04`, FLOW 6 ④ · **Working position** SA assigns platform roles (8.1.1); institutional role origin left `?`

## MEDIUM

| # | Question | Working position |
|---|---|---|
| `QD-03` | Which **ERP provider(s)**, and what is the integration contract? 7.1.1 names Oracle and Moodle-based systems *"and other ERP platforms"* | `IAD-11` drawn generically |
| `QD-04` | Which **identity provider / protocol / attribute mapping** for SSO? **Pending by PM-10** | `IAD-13` drawn generically |
| `QD-05` | Can one person hold **both a B2B and a B2C identity**, and do they link? 1.3.1/1.3.2 keep them in separate environments | One account per context; explicit collision state |
| `QD-06` | Is the learner **informed** when ERP sync adds or removes entitlements? | No Phase-1 notification requirement exists |
| `QD-07` | What **module metadata schema** does 1.4.3 review? | Never enumerated |
| `QD-08` | What **curriculum standards** does academic validation (1.4.2) test against? | **`ARV-04` drawn as PENDING** — this is content someone must own |

## LOW

| # | Question | Working position |
|---|---|---|
| `QD-09` | **Localization, currency, and regional formatting** — no i18n requirement exists despite international gateways (9.1.2) | English / INR with expansion tolerance |
| `QD-10` | **Currency, tax treatment, price presentation** — compliance-adjacent | Neutral "taxes calculated at checkout" |

---

# Part E · DESIGN questions — `QX`

Resolvable within UI/UX once something above is known.

| # | Question | Priority | Working position |
|---|---|---|---|
| `QX-01` | Does the **desktop-first ~1440px** decision (`D-15`) extend to all six new workspaces, or do they need their own viewport analysis? | **HIGH** | Not extended automatically. Admin work is desktop-typical, but this must be **decided, not inherited** |
| `QX-02` | **WCAG 2.2 SC 1.4.10 Reflow remains NOT MET** by agreed scope — six more workspaces now inherit that gap | **HIGH** | Stated plainly; layouts built to reflow when a responsive pass is scoped |
| `QX-03` | Who owns **video captions, transcripts, and audio description**? PM-07 gives it a candidate home: CM readiness review (1.4.3) or Vendor submission (1.4.1) | **HIGH** | Slots specified; content unowned. A video without captions must not be **Required** for completion |
| `QX-04` | Is one **queue component** sufficient for V, AR, CM, and SA, or do the gates differ enough to need variants? | MEDIUM | One component with variants |
| `QX-05` | Is one **configuration-form pattern** sufficient for SSO, ERP, assessment, and platform settings? | MEDIUM | One pattern; validate during design |
| `QX-06` | Does the **shared shell** need per-workspace visual differentiation, or is navigation content enough? | MEDIUM | Navigation content only — differentiated chrome fragments the platform |
| `QX-07` | Is a **vector (SVG) logo** and a reversed/dark variant available? | MEDIUM | Still outstanding; constrains the header lockup and any dark theme |
| `QX-08` | How is **gate position** best expressed visually across the chain? | MEDIUM | Status component with four positions |
| `QX-09` | Should the **B2C learner** see any indication that assessment behaviour differs from an institutional learner's? | LOW | Depends on `QP-05` |

---

# Part F · FUTURE PHASE — `QF`

Recorded so their absence in Phase 1 is understood as scope, not oversight.

| # | Item | FRD | Phase | Note |
|---|---|---|---|---|
| `QF-01` | Certification programs, completion criteria | 3.3.1, 3.3.2 | **PM-DEFERRED → Phase 2** | **FRD places these in Phase 1.** Recorded deviation |
| `QF-02` | Certification progress tracking; eligibility reports | 3.5.1, 3.5.2 | Phase 3 | |
| `QF-03` | In-platform institutional course creation | 3.4.1, 3.4.2 | Phase 2 | Creates tension **T-1** with Phase-1 8.1.3 |
| `QF-04` | Class-level performance reports | 11.3.1 | Phase 2 | Creates tension **T-2** with Phase-1 8.1.4 |
| `QF-05` | Institutional adoption reports | 11.3.2 | Phase 2 | |
| `QF-06` | Institutional usage dashboard; licence utilisation tracking | 8.2.1, 8.2.2 | Phase 2 | |
| `QF-07` | XR device registration and metadata | 2.5.x | Phase 2 | Keeps IA device screens out of Phase 1 |
| `QF-08` | Remote device configuration | 2.6.x | Phase 2 | |
| `QF-09` | Module lifecycle states and version management | 1.5.x, 1.6.x | Phase 2 | Phase-1 governance runs on **gate position** instead |
| `QF-10` | Bundle creation, pricing configuration, coupons | 6.3.x, 6.4.x | Phase 2 | Creates `QP-09` |
| `QF-11` | Institutional invoicing and subscription billing | 9.3.x | Phase 2 | Creates `QP-04` |
| `QF-12` | Real-time ERP provisioning | 7.3.x | Phase 2 | |
| `QF-13` | XR assessment integration and simulation scoring | 5.4.x | Phase 2 | |
| `QF-14` | Custom role creation; permission-level access control | 8.3.x | **Phase 3** | **Why the seven-role set must be fixed now** |
| `QF-15` | SSO role mapping from IdP attributes | 7.4.2 | Phase 3 | Creates `QD-02` |
| `QF-16` | AI learning assistant (learner-facing) | 5.5.x | Phase 3 | **Distinct from 5.1.2, which is Phase 1** |
| `QF-17` | Recommendation engine | 4.5.x | Phase 2 | Only consumer of Phase-1 "learning preferences" |
| `QF-18` | XR telemetry, heatmaps, decision-path analysis | 2.7.x, 11.4.x | Phase 3 | |
| `QF-19` | Data protection compliance and retention policies | 10.4.x | Phase 2 | |

---

# Summary

**Recalculated after the PM closure update of 19 August 2026 (PM-13, PM-14, PM-15).**

## By class and priority

| Class | BLOCKER | HIGH | MEDIUM | LOW | Total open |
|---|---|---|---|---|---|
| `QP` **Product** | 0 | **2** | 12 | 8 | **22** |
| `QT` **Technical** | 0 | **4** | 9 | 2 | **15** |
| `QD` **Data / Integration** | 0 | **2** | 6 | 2 | **10** |
| `QX` **Design** | 0 | **3** | 5 | 1 | **9** |
| `QF` **Future phase** | — | — | — | — | **19** |
| **Total open** | **0** | **11** | **32** | **13** | **56** *(+19 future)* |
| **Closed by PM** | | | | | **19** |

### Movement from the closure update

| | Review 006 (18 Aug) | **After PM-13/14/15 (19 Aug)** |
|---|---|---|
| Open (QP/QT/QD/QX) | 58 | **56** |
| **HIGH** | **15** | **11** |
| Product questions | 24 | 22 |
| Closed by PM | 15 | **19** |

**Four HIGH questions closed; two LOW ones opened** (`QP-25` B2C assessment supplier, `QP-26` Super Admin return authority). Both new ones are residuals of the decisions that closed the larger questions, and both are explicitly non-blocking.

## Still no blockers

**The platform sitemap, role/permission model, capability map, workflows, and screen inventory remain complete with zero blocking questions.**

### The two items closest to blocking are now closed

Review 006 flagged `QP-03` and `QP-01` as the two that would most damage the Rank-1 Figma pass if left unanswered — both sat **inside** FLOW 1, the recommended first flow.

| # | Was | Now |
|---|---|---|
| **`QP-03`** | If the central-content roles were tenant-scoped, the whole plane model restructured | ✅ **CLOSED by PM-13** — central content plane confirmed |
| **`QP-01`** | If a reject path existed, three governance screens gained a decision branch and FLOW 1 stopped being linear | ✅ **CLOSED by PM-14** — the branch is now specified, so it can be designed rather than discovered |

**FLOW 1 can now be taken into detailed Figma complete**, rather than designed forward-only and reworked later. That was the specific de-risking Review 006 recommended, and it has happened.

## The six questions newly surfaced by the reframe — status

| # | Question | Status |
|---|---|---|
| ~~`QP-05`~~ | Who configures assessments for a B2C learner? | ✅ **Closed — PM-15** |
| ~~`QP-01`~~ | Is there a reject path in the governance chain? | ✅ **Closed — PM-14** |
| ~~`QP-03`~~ | Where do the central-content roles sit in the tenancy model? | ✅ **Closed — PM-13** |
| ~~`QP-06`~~ | Is there a governance audit trail? | ✅ **Closed — PM-14** *(content chain only)* |
| `QD-02` | What is the Phase-1 origin of role assignment? | **Open — HIGH** |
| `QP-04` | How is an institutional licence transacted before Phase-2 billing? | **Open — HIGH** |

**Four of six closed in one meeting.** The two that remain are the ones the PM was not asked about.

## The remaining HIGH items

| # | Question | Class |
|---|---|---|
| `QP-02` | Who grades descriptive answers? | Product |
| `QP-04` | How is an institutional licence transacted in Phase 1? | Product |
| `QT-01` | Which XR delivery mechanism? — **pending by PM-05 instruction** | Technical |
| `QT-02` | No AR application architecture exists in the FRD | Technical |
| `QT-03` | Assessment configuration API contract | Technical |
| `QT-04` | XR sign-in under SSO (2.4.4 vs 4.2.2) | Technical |
| `QD-01` | Which profile fields are user-editable vs ERP-owned? | Data |
| `QD-02` | Phase-1 origin of role assignment | Data |
| `QX-01` | Does desktop-first ~1440px extend to all six new workspaces? | Design |
| `QX-02` | WCAG 1.4.10 Reflow remains NOT MET across nine workspaces | Design |
| `QX-03` | Who owns captions, transcripts, audio description? | Design |

**`QP-02` — descriptive-answer grading — is now the single highest-value product question outstanding**, because it is the only remaining open item that can strand a learner mid-progression.

## Deliberately still pending, by PM instruction

Not deficiencies — the PM's stated position:

- **`QT-01`** — the XR delivery mechanism (**PM-05**)
- **`QD-04`** — SSO provider, protocol, attribute mapping (**PM-10**)
- **`QP-25`** — which Faculty/institution supplies a B2C assessment (**PM-15**)
- Detailed reporting metrics and KPI definitions (**PM-11**)
