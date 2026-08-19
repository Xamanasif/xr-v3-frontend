# 12 — Review 006 Summary

**Review:** 006 — Full Platform Reframe
**Date:** 18 August 2026 · **updated 19 August 2026** (PM closure — PM-13, PM-14, PM-15)
**Branch:** `uiux/full-platform-review006`
**Status:** ✅ Complete — architecture and planning stage. **No Figma work performed.**

---

# 1 · Why Review 006 was required

Reviews 001–005 produced a complete, high-quality Phase-1 design — for **one role**.

A direct meeting with the Project Manager on **18 August 2026** established that the scope had been read too narrowly. The detailed project scope is not the Student/Learner desktop LMS. It is **the complete platform: all Phase-1 requirements and all Phase-1 roles.**

That single clarification changed the shape of the work from *one workspace* to *nine*, and made the previously planned next step — transferring Learner screens into Figma — the wrong next step.

**Nothing had been built in Figma yet. The reframe therefore cost no high-fidelity rework.**

---

# 2 · What the PM confirmed

Twelve statements, captured in full in `ui-ux/00-project-context/PM_CONFIRMED_BASELINE_2026-08-18.md`.

| # | Confirmation | Effect |
|---|---|---|
| **PM-01** | All Phase-1 requirements **and all Phase-1 roles** are in scope | Scope widened from 1 role to 7 |
| **PM-02** | Sitemap → permissions → workflows → priority flows → **then** Figma | Figma transfer paused |
| **PM-03** | One central portal with role-based workspaces | Not seven products |
| **PM-04** | Both B2B and B2C required; **no** B2B-first sequencing | Sequencing returns to pending |
| **PM-05** | **Entitlement-aware XR delivery to the device is a confirmed product requirement**; the technical mechanism is **not selected** | XR model rebuilt, mechanism-neutral |
| **PM-06** | XR simulations already exist | Platform ingests and governs; it does not author |
| **PM-07** | Vendor and Academic Reviewer get real logins and workspaces | Role set: 5 → **7** |
| **PM-08** | Assessment behaviour is portal-configured, API-consumed | Fixed values → **sample configuration** |
| **PM-09** | Current learning progression is approved | Learner design retained |
| **PM-10** | Institutional SSO is required | Adds the IA configuration surface |
| **PM-11** | Core operations first; analytics incrementally | **Zero analytics dashboards designed** |
| **PM-12** | Certification is **not** Phase 1 — it is Phase 2 | Recorded FRD deviation |

## Closure update — 19 August 2026

Three further confirmations, captured in `13_PM_CLOSURE_DECISIONS.md`. They close the three most structurally significant questions Review 006 surfaced.

| # | Confirmation | Effect |
|---|---|---|
| **PM-13** | **Continue with the Review-006 model** — central-content-plane / tenant-plane architecture | Two-plane model moves from **hypothesis** to **confirmed**. Closes `QP-03` |
| **PM-14** | **Submitted content may be rejected / returned for correction**, with comments, resubmission, and review history | Governance chain gains **return loops**. Closes `QP-01` and `QP-06` |
| **PM-15** | **Assessment configuration is owned by Faculty / the institution side — for both B2B and B2C.** The learner never authors or configures | Closes `QP-05` and **removes** B2B/B2C divergence 17 |

---

# 3 · The new full-platform model

> **One central XR Simulation Learning Platform. One URL, one shell, one design system, one authentication front door — seven role-based workspaces across three planes.**

```
                    ONE PORTAL · authenticate once · resolve role
                                      │
      ┌───────────────┬───────────────┼───────────────┬──────────────┐
      │               │               │               │              │
  TENANT PLANE                  CENTRAL CONTENT PLANE          PLATFORM-WIDE
  Learner                       Vendor                         Super Admin
  Faculty                       Academic Reviewer
  Institute Admin               Content Manager
      │                               │                             │
  institutional users,          module builds, validation,    publishing,
  entitlements, courses,        approval, publication          licensing,
  progress, licences                                           configuration
      │
  PERSONAL PLANE (B2C) — individual accounts, purchases, entitlements
```

**✅ The two-plane split is CONFIRMED by PM-13 (19 August 2026).** It was recorded as a hypothesis at Review 006 because the FRD never states it; the PM confirmed the model. **Super Admin alone retains the FRD-defined cross-tenant governance capability (1.3.5) — no additional cross-tenant permissions are granted to any other role.**

---

# 4 · Confirmed roles

| Role | FRD basis | Status |
|---|---|---|
| Student / Learner | 8.1.5 | Reframed as one workspace |
| Faculty | 8.1.4 | **Newly in scope** |
| Institute Admin | 8.1.3 | **Newly in scope** |
| Content Manager | 8.1.2 | **Newly in scope** |
| Super Admin | 8.1.1, 1.3.5 | **Newly in scope** |
| **Vendor** | 1.4.1, 1.4.5 — *actor only in the FRD* | **New role, PM-07** |
| **Academic Reviewer** | 1.4.2 — *actor only in the FRD* | **New role, PM-07** |

**B2C Individual Learner** is a business context around the Learner role, not an eighth role. External systems (ERP, identity providers, payment gateways, the Meta Quest Store) are **integrations, not roles**.

---

# 5 · Phase-1 scope

**78 Phase-1 requirements** across 12 FRD sections, verified by direct enumeration. Every one re-audited from the platform perspective with an owning role assigned.

| | |
|---|---|
| Settled (`FRD-CONFIRMED` + `CONFIRMED`) | **51 of 78** · plus 3 `PM-CLARIFIED` = **54 of 78 (69%)** |
| Technical pending | 13 |
| Product pending | 9 |
| PM-clarified | 3 |
| **PM-deferred** (certification 3.3.1, 3.3.2) | **2** |
| **Design working set** | **76 + 2 PM-deferred** |
| Requirements with **no** designed surface before this review | **18** |

**The Review-005 figure "44 of 78 Student-facing (56%)" measured one workspace under a superseded scope. It is not a platform coverage number and is not used anywhere in Review 006.**

---

# 6 · B2B / B2C model

**One shared learning core, two entitlement routes, two data environments.**

| | B2B | B2C |
|---|---|---|
| Origin | ERP provisioning (7.2.2) | Self-registration (4.1.1) |
| Authentication | Institutional SSO preferred | Password + social |
| Entitlement | Stream licence (6.2.1, 7.2.3) | Purchase (6.1.1, 6.1.2) |
| Plane | Tenant (1.3.1) | Personal (1.3.2) |
| Oversight | Faculty + Institute Admin | None |
| **Elements identified** | 20 | 18 |
| **Already designed** | 7 | 15 |
| **New** | **11** | **2** |

**17 documented divergences** — the Review-005 list of 10, plus 8 surfaced by the reframe, **less divergence 17 which PM-15 removed** by making assessment ownership identical on both sides. **Everything not listed is shared.**

**No document in Review 006 asserts a release sequence.** The Figma recommendation in §11 is ordered by cross-role coverage and design risk, not by market.

**The real asymmetry is not B2B vs B2C — it is learner vs everyone else.** Both learner journeys are in good shape. The institutional machinery behind the B2B journey did not exist, because the roles that operate it were out of scope.

---

# 7 · Content governance flow

The FRD's most precisely specified sequence — and the least designed.

**Updated by PM-14 — the chain now has return loops.**

```
  VENDOR ──▶ ACADEMIC REVIEWER ──▶ CONTENT MANAGER ──▶ SUPER ADMIN ──▶ PUBLISHED
   1.4.1          1.4.2                 1.4.3             1.4.4
  submit     validate / CHANGES     approve / CHANGES     publish
     │        REQUIRED  │            REQUIRED  │             │
     │◀─────────────────┘                      │             │
     │◀────────────────────────────────────────┘             │
     │   returned with comments + reason         PM-14        │
     │                                                        │
     ├─ correct & resubmit ──▶ RE-ENTERS REVIEW               │
     │   never routes directly to publication      PM-14      │
     │                                                        │
     └── 1.4.5: vendors can NEVER publish ────────────────────┘

  Review history / status traceability throughout            PM-14
```

**Three approvals, three roles, one publisher. No role holds two adjacent gates.**

**PM-14 adds return authority without weakening that.** Academic Reviewer and Content Manager may send work **back**; neither can send it **forward past their own gate**, and neither gains publish authority. A resubmission re-enters review — **there is no automatic publication path after a rejection.**

The vendor sees gate position and the reason for any return, throughout. **There is no disabled Publish control anywhere** — a greyed-out button implies a permission that will never exist.

**Resolved by PM-14:** ~~no reject/revise path~~ (`QP-01`) · ~~no audit trail~~ (`QP-06`, content chain only).
**Known gaps still drawn as gaps:** no validation rubric (`QD-08`) · no package format (`QT-05`) · whether Super Admin may also return at gate ④ (`QP-26`).

🟠 **PM-14 is recorded as an FRD extension** — FRD 1.4.1–1.4.4 contain no rejection, revision, resubmission, or history requirement. **The FRD is not edited.**

---

# 8 · XR delivery model

**Product requirement: CONFIRMED. Technical mechanism: PENDING by PM instruction.**

| Format | FRD | Application architecture |
|---|---|---|
| Web | 1.2.1 | Runs in the portal |
| VR | 1.2.2 | 2.1.1 — centralized master application |
| MR | 1.2.3 | 2.1.2 — sideloaded application |
| **AR** | 1.2.4 | ⚠ **NONE — no requirement exists** |

**Both PM concepts recorded, neither selected:** (A) direct package/application delivery · (B) centralized XR application with entitlement-controlled modules. Synchronisation and deep-link mechanisms remain open too.

FRD 2.1.1, 2.2.1, and 2.3.3 lean toward Concept B **for VR** — that is a fact about the FRD, not a decision by the PM, and no selection is made.

**Delivered instead:** an 8-stage lifecycle and **21 mechanism-neutral states** covering entitlement, delivery, session, completion, and device management. State names deliberately avoid mechanism language — *"Ready on your device"* survives either concept; *"Downloaded"* and *"Unlocked in the app"* do not, and are not used.

**Entitlement-aware delivery is not new.** FRD 2.2.2 (download only after licence validation) and 10.1.2 (validation before execution) already require it. The Student-only reading surfaced it only as a restricted state.

**Six FRD gaps flagged — the absent AR application architecture is the primary one.**

---

# 9 · Configurable assessment model

| | Review 005 | Review 006 |
|---|---|---|
| 10 questions · 20 min · +2/+1/−1/0 · 10/20 pass · unlimited attempts · score floored at 0 | **platform constants** | **SAMPLE CONFIGURATION** |

**The FRD always agreed.** It states no question count, duration, weighting, pass mark, or attempt limit anywhere. What it does state is configurability — 5.1.1 (Faculty uploads banks), 5.3.1 (*"may* be randomized"), 5.3.2 (*"Faculty shall be able to **enable*** negative marking").

**10-stage model:** sourcing → bank → definition → rules → assignment → **API** → application consumption → attempt → scoring → progress.

**7 fields clearly implied by the FRD · 12 fields required with values pending · 8 questions needing product clarification.**

**Structural change to existing screens: zero. Data-binding change: pervasive.** The pre-attempt disclosure must now be *generated from* the configuration, not authored as copy — a hard-coded disclosure would lie when a configuration disables negative marking.

**One prohibition recorded for the eventual API:** the correct answer must never appear in a learner-facing payload — not in the body, not in a debug field, not in a comment.

**PM-15 (19 August) settled ownership.** For **both B2B and B2C**, assessment setup/configuration is the responsibility of **Faculty or the institution side**; **the learner never authors or configures**. This closed `QP-05` and **removed** B2B/B2C divergence 17 — ownership is now identical on both sides rather than different. Institute Admin is **not** automatically granted authoring permission; Faculty is the FRD-named role. The operational question of *which* Faculty/institution supplies a pure-B2C assessment is explicitly deferred as a **non-blocking** content detail (`QP-25`).

**FRD 5.1.2 (AI question generation) reclassified.** It is a **Phase-1 Faculty** requirement. Constraint `C-04` excluded it citing FRD **5.5** — a **Phase-3, learner-facing** requirement. Different requirement, different phase, different user. It is now `PRODUCT-PENDING`, not excluded by inheritance.

---

# 10 · Review-005 disposition

**Nothing was deleted, moved, or rewritten.**

| Disposition | Screens | Documents | Decisions | Total |
|---|---|---|---|---|
| **KEEP** | 17 | 7 | 14 | **38** |
| **KEEP + REFRAME / EXPAND** | 4 | 9 | 6 | **19** |
| **MODIFY** | 8 | 6 | 2 | **16** |
| **SUPERSEDE** | 0 | 0 | 3 | **3** |
| **DEFER** | 0 | 1 | 0 | **1** |
| **Total** | **29** | **23** | **25** | **77** |

**57 of 77 (74%) reused as-is or with only a widened scope statement.**

### What was superseded — three items

| Item | Detail |
|---|---|
| **`D-13` Student role only** | **The one genuinely withdrawn decision.** Everything else survives |
| `D-06` Assessment model | Superseded **as global constants**; retained as sample configuration |
| `D-23` Score floor | Superseded **as a global rule**; becomes a configuration field |

### What was reused

The Learner workspace (21 of 29 screens unchanged or reframed), the design system and tokens, the WCAG 2.2 AA baseline, the `D-18` state grammar, the entire B2C commerce path, and — with PM-09's explicit approval — the learning progression and both gating models.

**The reframe did not reveal that the previous work was wrong. It revealed that six sevenths of the platform had never been looked at.**

---

# 11 · Deliverables

| # | Document | Content |
|---|---|---|
| 01 | Phase-1 feature inventory | **78** requirements re-audited, 11 attributes each |
| 02 | Role / permission matrix | **7** roles × **101** capabilities, 11 permission verbs |
| 03 | Shared capability map | **15** domains separated from roles |
| 04 | Platform IA / sitemap | **9** workspaces, one shell, three planes |
| 05 | End-to-end workflows | **10** cross-role workflows |
| 06 | B2B / B2C journeys | **17** divergences; shared core defined |
| 07 | XR delivery model | 8-stage lifecycle, **21** states, mechanism-neutral |
| 08 | Assessment configuration model | 10-stage model, **19** fields classified, **ownership confirmed** |
| 09 | Review-005 reuse map | **77** items classified |
| 10 | Full platform screen inventory | **104** screens across 9 workspaces |
| 11 | Reframed open questions | **56** open (**0 blockers**), 19 future-phase, **19** PM-closed |
| 12 | This summary | |
| **13** | **PM closure decisions** | **PM-13 · PM-14 · PM-15**, 19 August 2026 |

---

# 12 · Remaining questions

**Zero blockers.** The sitemap, permission model, capability map, workflows, and screen inventory are all complete with no blocking question outstanding.

**Recalculated after the 19 August closure update.**

| Class | HIGH | MEDIUM | LOW | Total |
|---|---|---|---|---|
| Product | **2** | 12 | **8** | **22** |
| Technical | 4 | 9 | 2 | **15** |
| Data / Integration | 2 | 6 | 2 | **10** |
| Design | 3 | 5 | 1 | **9** |
| **Total open** | **11** | **32** | **13** | **56** |
| Future phase | | | | 19 |
| **Closed by the PM** | | | | **19** |

| | 18 Aug | **19 Aug** |
|---|---|---|
| Open | 58 | **56** |
| **HIGH** | **15** | **11** |
| Closed by PM | 15 | **19** |

**Four HIGH questions closed; two LOW residuals opened** — `QP-25` (which Faculty/institution supplies a B2C assessment, explicitly non-blocking) and `QP-26` (whether Super Admin may also return at gate ④).

### Six questions newly surfaced by this reframe — four now closed

| # | Question | Status |
|---|---|---|
| ~~`QP-01`~~ | Is there a reject / revise / resubmit path in the governance chain? | ✅ **Closed — PM-14** |
| ~~`QP-03`~~ | Where do Vendor, Academic Reviewer, and Content Manager sit in the tenancy model? | ✅ **Closed — PM-13** |
| ~~`QP-05`~~ | Who configures assessments for a B2C individual learner? | ✅ **Closed — PM-15** |
| ~~`QP-06`~~ | Is there an audit trail for governance decisions? | ✅ **Closed — PM-14** *(content chain only)* |
| `QP-04` | How is an institutional licence transacted before Phase-2 billing exists? | **Open — HIGH** |
| `QD-02` | What is the Phase-1 origin of role assignment, given 7.4.2 and 8.3 are Phase 3? | **Open — HIGH** |

**`QP-02` — who grades descriptive answers — is now the single highest-value product question outstanding**, because it is the only remaining open item that can strand a learner mid-progression.

### Pending by PM instruction — not deficiencies

XR delivery mechanism (**PM-05**) · SSO provider, protocol, attribute mapping (**PM-10**) · which Faculty/institution supplies a B2C assessment (**PM-15**) · detailed reporting metrics and KPIs (**PM-11**).

---

# 13 · Recommended detailed-Figma priority

> **This is a recommendation for PM consideration. It is not PM approval, and it is not a release sequence.**

Ranked by **cross-role coverage × design risk × requirement clarity** — deliberately not by market, and not by role seniority.

| Rank | Flow | Screens | Roles | Why |
|---|---|---|---|---|
| **1** | **Content to Production** | **13** | V · AR · CM · SA | Four roles, four gates, **zero existing coverage**, and the clearest requirements in the FRD (1.4.1–1.4.5), now completed by **PM-14**'s return loops. Nothing reaches a learner until content is published |
| **2** | **XR Entitlement & Device Delivery** | **6** | L · SA | The PM's own worked example. Largest requirement-to-design gap. Getting the state vocabulary right now prevents a rebuild when the mechanism is chosen |
| **3** | **Assessment Authoring to Result** | **6** | F · L | PM-08 is unambiguous; the authoring half is entirely missing and determines what three existing learner screens can render |
| **4** | **Institutional Identity / SSO** | **4** | IA · L · F | PM-10 makes SSO required; workspace resolution gates every workspace |

## Suggested first pass — Ranks 1 + 2 = **19 screens**

| Covers | |
|---|---|
| Roles | **6 of 7** |
| Workspaces | 6 |
| New content-governance coverage | 100% |
| Rebuild risk if deferred | Highest of any grouping |

Adding **Rank 3** brings Faculty in: **25 screens, all seven roles, four of the six highest-priority flows.**

### ✅ The recommended de-risking has happened

Review 006 flagged **`QP-01`** (reject path) and **`QP-03`** (tenancy placement of the central-content roles) as the two questions sitting **inside Rank 1** that would most damage that Figma pass if left unanswered.

**Both were closed on 19 August** — `QP-03` by PM-13 and `QP-01` by PM-14.

| | Then | Now |
|---|---|---|
| Plane model | Hypothesis; could restructure | ✅ Confirmed |
| Governance chain | Forward-only; a reject path would add a branch, a state, and a return loop | ✅ Branch specified and designed |

**FLOW 1 can now be taken into detailed Figma complete** — approve, request changes with comments, correct, resubmit, and a traceable history — rather than designed forward-only and reworked later.

**Two smaller residuals remain inside Rank 1, both LOW and both drawable as marked gaps:** whether Super Admin may also return at gate ④ (`QP-26`), and the submission package format (`QT-05`).

---

# 14 · Deviations and tensions on record

**`source/Platform FRD_v4.pdf` is unchanged and must remain unchanged.**

| # | Item | Type |
|---|---|---|
| **D-1** | **Certification (3.3.1, 3.3.2) moved from Phase 1 to Phase 2** | 🔴 PM deviation from the FRD |
| **D-2** | **Vendor and Academic Reviewer promoted to roles beyond FRD 8.1's five** — and FRD 8.3, the mechanism for adding roles, is Phase 3 | 🟠 PM extension of the FRD |
| **T-1** | 8.1.3 puts course structures in the **Phase-1** Institute Admin role; 3.4.1/3.4.2 course creation is **Phase 2** | 🟡 FRD internal phase tension |
| **T-2** | 8.1.4 puts performance monitoring in the **Phase-1** Faculty role; 11.3.1 class reports is **Phase 2** | 🟡 FRD internal phase tension |
| **G-1** | **No AR application architecture** anywhere in FRD Section 2 | 🟡 FRD gap |
| **G-2** | FRD 5.1.2 (AI question generation) is Phase 1; `C-04` excluded it citing Phase-3 FRD 5.5 | 🟡 Scope catch |
| **G-3** | 2.4.1 / 2.4.2 device binding and replacement had no surface in any workspace | 🟡 FRD gap |
| ~~G-5~~ | ~~No reject / revise / resubmit path in the governance chain~~ | ✅ **Closed by PM-14** — now a 🟠 **PM extension of the FRD** |
| ~~G-6~~ | ~~No audit trail for governance decisions~~ | ✅ **Closed by PM-14** for the content chain — 🟠 **PM extension**. Audit outside content governance remains undefined |
| ~~G-4~~ | ~~Vendor, Academic Reviewer, and Content Manager unplaced in the tenancy model~~ | ✅ **Closed by PM-13** — central content plane. Fills an FRD silence; **no FRD text contradicted** |
| **D-3** | **Rejection, resubmission, and review history added to a chain the FRD describes as forward-only** | 🟠 **PM extension of the FRD** (PM-14) |
| **R-1** | SSO phase contradiction (4.2.2 Phase 1 vs 7.4.1 Phase 3) | ✅ Resolved by PM-10 |

---

# 15 · Status

| | |
|---|---|
| Review 006 | ✅ **Complete** — architecture and planning |
| Phase-1 requirements audited | **78 of 78** |
| Roles mapped | **7 of 7** |
| Capability domains | **15** |
| End-to-end workflows | **10** |
| Screens inventoried | **104** across 9 workspaces |
| Blocking questions | **0** |
| Open questions | **56** (11 HIGH) — down from 58 (15 HIGH) |
| PM decisions recorded | **15** — PM-01 – PM-15 |
| Figma | ❌ **Untouched — by instruction** |
| `source/` · `branding/` | ❌ **Untouched** |
| Review-005 artefacts | ❌ **Untouched** |
| Git commit | ❌ **None** |

**Next stage is detailed Figma work on PM-approved priority flows — and it does not begin until the PM approves a selection.**

**The 19 August closure update removed the two questions that would have made the Rank-1 pass risky.** Content-to-Production can now be designed end to end, including its return loops, without waiting on a further decision.
