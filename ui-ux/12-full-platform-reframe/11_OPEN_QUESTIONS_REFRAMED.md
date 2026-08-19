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

**Fifteen closures. The `Q-`-numbered ones remain listed in the Review-005 register for history; they must not be reopened here.**

---

# Part B · PRODUCT questions — `QP`

## BLOCKER — none

**No product question blocks the platform sitemap.** Every item below has either a safe working position or a surface that can be drawn as a marked gap. This is stated deliberately: calling something a blocker when work can continue is as damaging as missing a real one.

## HIGH

### `QP-01` — Is there a reject / revise / resubmit path in the content governance chain?
The FRD describes a **forward-only** chain: submit (1.4.1) → validate (1.4.2) → approve (1.4.3) → publish (1.4.4). **No requirement describes rejection, revision, or resubmission.** A review gate with no reject path is not a gate.
**Affects** `VND-01/05`, `ARV-02`, `CM-02`, FLOW 1 · **Working position** the return path is drawn as a **known-missing edge**, never as a designed feature · **Ref** matrix D7

### `QP-02` — Who grades descriptive answers, on what turnaround, against what rubric?
FRD 5.2.3 permits short descriptive answers. **No Phase-1 requirement assigns grading to anyone.** Compounded by PM-09 · `D-08` · `D-07`: progression gates on passing, so an ungraded answer strands the learner indefinitely.
**Affects** `FAC-11`, `LRN-12`, FLOW 4 · **Working position** the queue is named and positioned but **explicitly unowned and undesigned** · **Ref** matrix F10 · Review-005 Q-24

### `QP-03` — Where do Vendor, Academic Reviewer, and Content Manager sit in the tenancy model?
FRD 1.3.1 and 1.3.2 isolate institutional and B2C data. FRD 1.3.5 grants cross-tenant access to **Super Admin only**. **The three central-content roles are given no position at all**, yet PM-07 requires them to work.
**Affects** the whole IA · **Working position** the **two-plane hypothesis** (central content plane + tenant planes) — the only reading consistent with every FRD sentence, **recorded as a hypothesis, not adopted as fact** · **Ref** matrix B2

### `QP-04` — How is an institutional licence transacted in Phase 1?
FRD 6.2.1 says institutions *"shall purchase"* stream packages — **Phase 1**. But **all** institutional billing (9.3.1 GST invoicing, 9.3.2 subscription billing) is **Phase 2**. Phase 1 needs licences to exist with no defined transaction.
**Affects** `IAD-09`, `SA-11`, FLOW 2 ①, FLOW 9 · **Working position** licences are shown as **existing**; no in-platform purchase flow is invented · **Ref** matrix H2

### `QP-05` — Who configures assessments for a B2C individual learner?
FRD 5.1.1, 5.1.2, 5.3.2 assign assessment authoring and configuration to **Faculty** — an institutional role. **A B2C learner has no Faculty.** Central configuration would need CM or SA assessment authority the FRD does not grant; a platform default is nowhere defined; no assessments at all contradicts 3.1.2.
**Affects** `FAC-07`, `LRN-09/10/12`, FLOW 3, FLOW 4 · **Working position** none — **an unresolved structural gap** · **Ref** journeys divergence 17
**Newly surfaced by this reframe.** Invisible while assessment rules were global constants.

### `QP-06` — Is there an audit trail for governance decisions?
The chain makes **four** authority decisions per module across four roles. **No requirement records who decided what, when.** For an academically validated engineering curriculum this is a conspicuous absence.
**Affects** all governance workspaces · **Working position** not invented; decision history is shown only where a role sees **its own** past decisions (`ARV-05`) · **Ref** matrix M4

## MEDIUM

| # | Question | Working position |
|---|---|---|
| `QP-07` | Who creates and manages **Faculty** accounts? 8.1.3 names only *student access*; ERP provisioning (7.2.2) names only students | `IAD-04` drawn as **PENDING** |
| `QP-08` | Does **Institute Admin** hold any assessment authority, or Faculty only? | Faculty only; IA cells left `?` |
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

## By class and priority

| Class | BLOCKER | HIGH | MEDIUM | LOW | Total |
|---|---|---|---|---|---|
| `QP` **Product** | 0 | **6** | 12 | 6 | **24** |
| `QT` **Technical** | 0 | **4** | 9 | 2 | **15** |
| `QD` **Data / Integration** | 0 | **2** | 6 | 2 | **10** |
| `QX` **Design** | 0 | **3** | 5 | 1 | **9** |
| `QF` **Future phase** | — | — | — | — | **19** |
| **Total open** | **0** | **15** | **32** | **11** | **58** *(+19 future)* |
| **Closed by PM** | | | | | **15** |

## No blockers — and that is a finding, not an oversight

**The platform sitemap, role/permission model, capability map, workflows, and screen inventory are all complete in Review 006 with zero blocking questions outstanding.**

Every HIGH item either has a safe working position, or is drawn into the architecture as a **named, marked gap** — a pending screen, an undesigned edge, a `?` cell. None prevents the next stage of work.

**The two items closest to blocking**, if left unanswered when detailed design of those areas begins:

| # | Why it would bite |
|---|---|
| **`QP-03`** | If Vendor / Academic Reviewer / Content Manager turn out to be **tenant-scoped**, the entire central-content plane restructures and the governance workspaces change shape |
| **`QP-01`** | If a reject path exists, **three governance screens gain a decision branch, a state, and a notification need** — and FLOW 1 stops being linear |

Both sit in **FLOW 1**, the Rank-1 Figma recommendation. **Answering them before that Figma pass would materially de-risk it.**

## The six questions newly surfaced by this reframe

Invisible under a Student-only scope, and none is a restatement of a Review-005 question:

| # | Question |
|---|---|
| `QP-05` | Who configures assessments for a B2C learner? |
| `QP-01` | Is there a reject path in the governance chain? |
| `QP-03` | Where do the central-content roles sit in the tenancy model? |
| `QP-06` | Is there a governance audit trail? |
| `QD-02` | What is the Phase-1 origin of role assignment? |
| `QP-04` | How is an institutional licence transacted before Phase-2 billing? |

## Deliberately still pending, by PM instruction

Not deficiencies — the PM's stated position:

- **`QT-01`** — the XR delivery mechanism (**PM-05**)
- **`QD-04`** — SSO provider, protocol, attribute mapping (**PM-10**)
- Detailed reporting metrics and KPI definitions (**PM-11**)
