# 03 — Shared Capability / Domain Map

**Review:** 006 — Full Platform Reframe
**Created:** 2026-08-18
**Companion:** `01_PHASE1_FEATURE_INVENTORY.md` · `02_ROLE_PERMISSION_MATRIX.md` · `04_PLATFORM_INFORMATION_ARCHITECTURE.md`

---

## Why this document exists

Seven roles do not mean seven products. If the platform is designed role-first, the same capability gets rebuilt seven times in seven idioms — seven ways to view a module, seven progress models, seven entitlement checks.

**This document separates *what the platform does* from *who is allowed to do it*.**

> **Capability = what the platform can do.**
> **Role = who may invoke it and in what scope.**

A capability is defined once, consumed by many roles. `02_ROLE_PERMISSION_MATRIX.md` says *who*; this document says *what*, *what it depends on*, and *whether Review-005 already built usable UX for it*.

---

## The fifteen domains

| # | Domain | Code | One-line definition | Phase-1 weight |
|---|---|---|---|---|
| 1 | Identity & Access | `IAM` | Who a user is, how they prove it, what workspace they land in | **Heavy** |
| 2 | Content & Catalogue | `CAT` | Modules, courses, metadata, the published content model | **Heavy** |
| 3 | Learning | `LRN` | Consuming content in sequence toward completion | **Heavy** |
| 4 | Assessments | `ASM` | Authoring, configuring, delivering, and scoring assessments | **Heavy** |
| 5 | XR Delivery | `XRD` | Getting an entitled experience onto the device that runs it | **Heavy** |
| 6 | Licensing & Entitlements | `ENT` | Who is allowed to access what, and for how long | **Heavy** |
| 7 | Commerce & Payments | `COM` | B2C discovery, purchase, payment, activation | Medium |
| 8 | Content Governance | `GOV` | Submission → validation → approval → publication | **Heavy** |
| 9 | Institution & Tenancy | `TEN` | Institutional identity, isolation, and boundaries | Medium |
| 10 | ERP & Enterprise Integration | `ERP` | Automated provisioning and academic structure sync | Medium |
| 11 | Progress | `PRG` | Recording and reflecting what a learner has done | Medium |
| 12 | Analytics & Reporting | `RPT` | Operational status now; analytics incrementally later | **Light — PM-11** |
| 13 | Security & Audit | `SEC` | Protecting assets, sessions, and decisions | Medium |
| 14 | Platform Configuration | `CFG` | Platform-wide settings and release control | Medium |
| 15 | Notifications & Support | `NOT` | Telling people things and helping them when stuck | **Minimal — see §15** |

---

## Legend

**Phase status** — `P1` Phase 1 · `P2` Phase 2 · `P3` Phase 3 · `PM-DEF` PM-deferred · `PEND-T` technical pending · `PEND-P` product pending

**R005 reuse** — `✅ Reusable` substantial existing UX · `🟡 Partial` exists for one role only, or needs modification · `🔴 None` nothing exists

---

# 1 · IDENTITY & ACCESS — `IAM`

| Capability | FRD | Roles consuming | System dependencies | Phase | R005 UX |
|---|---|---|---|---|---|
| Email/password authentication | 4.1.1, 10.2.1 | All 7 | Identity store | `P1` | ✅ Reusable — AUTH-01 |
| Social login | 4.1.2 | L (B2C) | External IdPs | `P1` | ✅ Reusable — providers are samples |
| Institutional SSO authentication | **4.2.2**, PM-10 | L, F, IA | Institutional IdP | `P1` | 🟡 Partial — login path only |
| **Institutional SSO configuration** | **4.2.2** | IA, SA | Institutional IdP, tenant config | `P1` | 🔴 **None** |
| Institutional onboarding | 4.2.1 | IA, SA | Tenant provisioning | `P1` | 🔴 **None** |
| ERP-provisioned account creation | 7.2.2 | L (passive), IA | ERP sync | `P1` | ✅ Reusable — first-login path |
| Profile management | 4.3.1 | All 7 | ERP (authority conflict) | `P1` | 🟡 Partial — Learner only |
| Session lifecycle & expiry protection | 10.2.2, D-17 | All 7 | Session store | `P1` | 🟡 Partial — Learner only; admin drafts unprotected |
| Password reset / recovery | *absent from FRD* | All 7 | Mail | `P1` design-supplied | ✅ Reusable — AUTH-05 |
| Workspace resolution after sign-in | PM-03, 8.1.x | All 7 | Role store | `P1` | 🔴 **None** |
| Role mapping from IdP attributes | 7.4.2 | IA, SA | IdP | `P3` | — |

**Cross-cutting note.** Every role authenticates through **one** front door. Workspace resolution after sign-in is a **new shared capability** created entirely by PM-01/PM-03 — with one role there was nothing to resolve. It is the first genuinely new IAM surface.

**Session protection must generalise.** `D-17` protects a learner's assessment attempt from expiry. An Institute Admin half-way through SSO configuration or a Vendor mid-upload has equivalent unsaved state. The *principle* transfers; the *screens* do not.

---

# 2 · CONTENT & CATALOGUE — `CAT`

| Capability | FRD | Roles consuming | System dependencies | Phase | R005 UX |
|---|---|---|---|---|---|
| Module definition — one XR simulation | 3.1.1 | L, F, IA, CM, SA, V, AR | Content store | `P1` | ✅ Reusable |
| Module learning components (optional) | 3.1.2 | L, F, CM | Content store | `P1` | ✅ Reusable |
| Module metadata | 1.4.3 | CM, SA, V, L | Content store | `P1` | 🟡 Partial — consumer view only |
| Course composition | 3.2.1 | L, F, IA | Content store, ERP | `P1` | ✅ Reusable |
| Course module sequencing | 3.2.2 | L, F | Content store | `P1` | ✅ Reusable |
| Published-only visibility | 1.4.4 | All consumers | Governance state | `P1` | ✅ Reusable |
| Central content ownership constraint | 1.1.4 | IA (as a limit), SA | — | `P1` | ✅ Reusable as a constraint |
| Certification program structure | 3.3.1 | — | — | **`PM-DEF`** | Deferred |
| In-platform course creation | 3.4.1, 3.4.2 | IA | — | `P2` | — |
| Module lifecycle states (Draft…Archived) | 1.5.1 | CM, SA | — | `P2` | — |
| Version history & rollback | 1.6.1, 1.6.2 | CM, SA | — | `P2` | — |

**The absence that shapes Phase 1.** Module **lifecycle states** are `P2` (1.5.1) but the **governance chain** is `P1` (1.4.x). Phase 1 therefore moves modules through four approval gates **without a formally defined state machine**. The governance workspaces need *some* status vocabulary to function. Review 006 uses **gate position** (submitted / validated / approved / published) as the minimum honest vocabulary — this is derived from 1.4.1–1.4.4 themselves, not borrowed from the Phase-2 lifecycle list.

---

# 3 · LEARNING — `LRN`

| Capability | FRD / PM | Roles consuming | System dependencies | Phase | R005 UX |
|---|---|---|---|---|---|
| Consume entitled learning content | 8.1.5 | L | `ENT`, `CAT` | `P1` | ✅ **Fully reusable** |
| Learning resources — PDF | 3.1.2, D-05 | L | Content delivery | `P1` | ✅ Fully reusable |
| Learning resources — video | 3.1.2, D-05 | L | Content delivery | `P1` | ✅ Fully reusable |
| Resource → simulation → assessment sequence | **PM-09**, D-20 | L | `PRG` | `P1` | ✅ **PM-approved, fully reusable** |
| Between-module sequential gating | 3.2.2, D-07 | L, F | `PRG` | `P1` | ✅ Fully reusable |
| Standalone module availability | D-22 | L (B2C) | `ENT` | `P1` | ✅ Reusable |
| Course / module assignment to learners | 8.1.4, 7.2.3 | F, IA | `ERP`, `ENT` | `P1` | 🔴 **None — assigner side** |
| Per-course sequencing configuration | *absent* | F, IA | — | `PEND-P` | 🔴 None |

**This is the platform's most complete domain and PM-09 confirmed it.** The entire learner-side of `LRN` is reusable essentially unchanged. What is missing is the **other end of the same capability**: someone has to *assign* the content a learner consumes. Faculty (8.1.4) and Institute Admin (7.2.3, 8.1.3) hold that authority and neither has a surface.

---

# 4 · ASSESSMENTS — `ASM`

| Capability | FRD / PM | Roles consuming | System dependencies | Phase | R005 UX |
|---|---|---|---|---|---|
| Question bank upload (spreadsheet) | **5.1.1** | F | File processing | `P1` | 🔴 **None** |
| AI question generation | **5.1.2** | F | AI service | `P1` | 🔴 **None** — see catch below |
| MCQ question type | 5.2.1 | L, F | — | `P1` | ✅ Reusable |
| True/False question type | 5.2.2 | L, F | — | `P1` | ✅ Reusable |
| Descriptive question type | 5.2.3 | L, F | Grading workflow **(undefined)** | `P1` | 🟡 Partial — awaiting-evaluation state only |
| Question randomization | 5.3.1 | F | — | `P1` | 🟡 Partial — assumed on, must become a setting |
| Negative marking toggle | **5.3.2** | F | — | `P1` | 🟡 Partial — hard-coded, must become a setting |
| **Assessment configuration** | **PM-08** | F | `ASM` schema | `P1` | 🔴 **None** |
| **Configuration → application API contract** | **PM-08** | F, L, system | Web/XR apps | `PEND-T` | 🔴 **None** |
| Assessment attempt delivery | 5.2.x | L | Timer authority | `P1` | ✅ Reusable |
| Pre-attempt disclosure | D-06, D-23 | L | Configuration | `P1` | ✅ Reusable — must read from config |
| Hints | D-06 | L | Configuration | `P1` | ✅ Reusable — must read from config |
| Scoring & result | 11.2.1, D-23 | L, F | `PRG` | `P1` | ✅ Reusable |
| Correctness-without-key review | D-25 | L | — | `P1` | ✅ Reusable |
| Attempt history | 11.2.2 | L, F | `PRG` | `P1` | ✅ Reusable |
| Descriptive answer grading | 5.2.3 | **?** | — | `PEND-P` | 🔴 None — **owner undefined** |
| XR simulation performance scoring | 5.4.1 | L, F | XR runtime | `P2` | — |

**The PM-08 inversion.** Review 005 built the **consumption** end of assessment very thoroughly and treated the *rules* as constants. PM-08 states the rules are **configuration**. The consumption screens survive almost untouched — but every value they display must now be **read from a configuration** rather than compiled in. See `08_ASSESSMENT_CONFIGURATION_MODEL.md`.

**The FRD 5.1.2 catch.** Constraint `C-04` excluded "AI assistant" from scope, citing FRD **5.5** — which is **Phase 3** and is a *learner-facing* assistant. FRD **5.1.2** is **Phase 1** and is a *Faculty authoring tool*. Different requirement, different phase, different user. **It must be audited on its own merits, not inherited as excluded.**

---

# 5 · XR DELIVERY — `XRD`

| Capability | FRD / PM | Roles consuming | System dependencies | Phase | R005 UX |
|---|---|---|---|---|---|
| Web simulation execution | 1.2.1 | L | Browser, CDN | `P1` | ✅ Reusable |
| VR simulation support | 1.2.2 | L | VR device, master app | `P1` | 🟡 Guidance only |
| MR simulation support | 1.2.3 | L | MR device, sideloaded app | `P1` | 🟡 Guidance only |
| AR simulation support | 1.2.4 | L | Mobile device | `P1` | 🟡 Guidance only — **no FRD app architecture** |
| Master VR application container | 2.1.1 | L | Meta Quest Store | `P1` | 🟡 Referenced in copy |
| Encrypted asset bundle packaging | 2.2.1, 10.1.1, 12.1.2 | — | Content pipeline | `P1` | — |
| **Licence-validated download** | **2.2.2** | L | `ENT` | `P1` | 🟡 Restricted state only |
| **Entitlement-aware device delivery** | **PM-05** | L, SA | **mechanism pending** | `P1` | 🔴 **None** |
| Automatic module updates | 2.3.1 | L | Device app | `P1` | 🔴 None |
| Version release control | 2.3.2 | SA | Content pipeline | `P1` | 🔴 **None** |
| Update without app reinstall | 2.3.3 | — | Device app | `P1` | — |
| B2C device binding | 2.4.1 | L, SA | Device ID | `P1` | 🔴 **None** |
| Device replacement approval | 2.4.2 | L → SA | Device ID | `P1` | 🔴 **None** |
| Shared institutional devices | 2.4.3 | L, IA | Device fleet | `P1` | ✅ Reusable as guidance |
| XR login with LMS credentials | 2.4.4 | L | Identity, SSO | `PEND-T` | 🟡 Noted, unresolved |
| Completion returned to the account | D-19 | L, F | Platform recording | `P1` | ✅ Reusable |
| Device registration & metadata | 2.5.x | IA | — | `P2` | — |
| Remote module enable/disable | 2.6.x | IA, SA | — | `P2` | — |

**`XRD` is the domain with the largest gap between requirement and design.** Ten Phase-1 capabilities, five with **no** UX at all, and the central one — entitlement-aware delivery (PM-05) — deliberately mechanism-free. See `07_XR_DELIVERY_MODEL.md`.

---

# 6 · LICENSING & ENTITLEMENTS — `ENT`

| Capability | FRD | Roles consuming | System dependencies | Phase | R005 UX |
|---|---|---|---|---|---|
| Personal entitlement record | 6.1.1, 9.2.2 | L | `COM` | `P1` | ✅ Reusable |
| Institutional stream-based licence | 6.2.1 | IA, SA | `TEN`, `ERP` | `P1` | 🟡 Learner effect only |
| Capped licence / seat count | 6.2.2 | IA, SA | `TEN` | `P1` | 🟡 Learner wall only — **no admin view** |
| Stream → package mapping | 7.2.3, 6.2.1 | IA, F | `ERP` | `P1` | 🔴 **None** |
| Entitlement grant / revoke | 8.1.3 | IA, SA | `TEN` | `P1` | 🔴 **None** |
| Licence validation at browse | 2.2.2 | L | — | `P1` | ✅ Reusable |
| Licence validation at execution | 10.1.2 | L | — | `P1` | ✅ Reusable |
| Automatic activation on payment | 9.2.1 | L | `COM` | `P1` | ✅ Reusable |
| Access-duration data contract | D-24 | L, IA, SA | Entitlement data | `P1` | ✅ Reusable |
| Institutional purchase transaction | 6.2.1 vs 9.3.x | IA, SA | Billing **(P2)** | `PEND-P` | 🔴 None |
| Licence lifecycle & grace period | 6.5.x | IA, SA | — | `P3` | — |

**`ENT` is the platform's true spine.** Every other consumption domain gates on it: `LRN` reads it, `XRD` validates against it twice (2.2.2 and 10.1.2), `COM` creates it, `ERP` populates it, `TEN` scopes it. It is the single capability most worth modelling once and reusing everywhere.

**The asymmetry to fix.** Review 005 designed the *consumption* of entitlements thoroughly and the *administration* of them not at all. A capped licence (6.2.2) is visible to a learner only as a wall — the Institute Admin who could have prevented that wall has no seat-count view.

---

# 7 · COMMERCE & PAYMENTS — `COM`

| Capability | FRD / PM | Roles consuming | System dependencies | Phase | R005 UX |
|---|---|---|---|---|---|
| B2C catalogue discovery | 1.1.3 | L | `CAT`, published state | `P1` | ✅ Reusable |
| Individual module purchase | 6.1.1 | L | Gateway | `P1` | ✅ Reusable |
| Bundle purchase | 6.1.2 | L | Gateway | `P1` | ✅ Reusable |
| Domestic payment gateway | 9.1.1 | L | Gateway **(unchosen)** | `PEND-T` | ✅ Reusable — generic redirect |
| International payment gateway | 9.1.2 | L | Gateway, currency | `PEND-P` | ✅ Reusable |
| Licence activation on payment | 9.2.1 | L | `ENT` | `P1` | ✅ Reusable |
| Entitlement to My Learning | 9.2.2 | L | `ENT` | `P1` | ✅ Reusable |
| Courses are **not** products | D-21 | L | — | `P1` | ✅ Reusable as a prohibition |
| Bundle creation | 6.3.1 | SA | — | `P2` | — |
| Pricing configuration | 6.3.2 | SA | — | `P2` | — |
| Coupons | 6.4.x | SA, L | — | `P2` | — |
| Institutional invoicing / GST | 9.3.x | IA, SA | — | `P2` | — |

**Most reusable domain after `LRN`.** Nothing PM-confirmed changes B2C commerce; PM-04 reinforces it. The only reframe is contextual — it is now one branch of a multi-role platform rather than a co-equal half of a two-audience product.

---

# 8 · CONTENT GOVERNANCE — `GOV`

| Capability | FRD | Roles consuming | System dependencies | Phase | R005 UX |
|---|---|---|---|---|---|
| Vendor build & asset submission | **1.4.1** | V, CM | Staging environment | `P1` | 🔴 **None** |
| Staging environment | 1.4.1 | V, CM, AR | Storage, scanning | `P1` | 🔴 **None** |
| Academic validation | **1.4.2** | **AR** | Curriculum criteria | `P1` | 🔴 **None** |
| Metadata / documentation / compatibility review | **1.4.3** | CM | `CAT` | `P1` | 🔴 **None** |
| Production publishing | **1.4.4** | SA | `CAT`, CDN | `P1` | 🔴 **None** |
| Vendor publishing prohibition | **1.4.5** | V, SA | — | `P1` | 🔴 **None** |
| Version release control | 2.3.2 | SA | `XRD` | `P1` | 🔴 **None** |
| Reject / revise / resubmit | *absent from FRD* | V, AR, CM | — | `PEND-P` | 🔴 None |
| Governance audit trail | *absent from FRD* | All governance roles | — | `PEND-P` | 🔴 None |
| Content lifecycle states | 1.5.1 | CM, SA | — | `P2` | — |

**`GOV` is 100% new.** Not one capability in this domain has any existing UX, because three of its four roles did not exist in scope and the fourth (Super Admin) did not either. It is simultaneously the **least designed** and the **most precisely specified** domain in the FRD — 1.4.1 through 1.4.5 define an unusually explicit authority ladder.

**That combination makes `GOV` the highest-value target for detailed Figma.** See `12_REVIEW006_SUMMARY.md`.

---

# 9 · INSTITUTION & TENANCY — `TEN`

| Capability | FRD | Roles consuming | System dependencies | Phase | R005 UX |
|---|---|---|---|---|---|
| Multi-tenant platform frame | 1.1.1 | All | — | `P1` | 🟡 Implicit |
| Tenant-wise data isolation | 1.3.1 | IA, SA | Data layer | `P1` | ✅ Reusable as a constraint |
| B2C separate data environment | 1.3.2 | L, SA | Data layer | `P1` | ✅ Reusable as a constraint |
| Regional B2C instances | 1.3.3 | — | Infrastructure | `P1` | — |
| Tenant-scoped analytics boundary | **1.3.4** | IA, F, SA | Data layer | `P1` | ✅ Reusable as a constraint |
| Cross-tenant governance access | **1.3.5** | SA | Data layer | `P1` | 🔴 **None** |
| Institutional identity & context | 1.1.2 | L, F, IA | — | `P1` | 🟡 Learner header label only |
| Institutional configuration | 8.1.3 | IA | — | `P1` | 🔴 **None** |
| Shared institutional subscription | 1.1.2 | L, F, IA | `ENT` | `P1` | 🟡 Learner side only |
| **Plane placement of V / AR / CM** | *absent* | V, AR, CM | — | `PEND-P` | 🔴 None |

**The unresolved structural question of the whole reframe.** See `02_ROLE_PERMISSION_MATRIX.md` §B2. The **two-plane working hypothesis** — a central content plane plus tenant planes — is the only reading consistent with every FRD sentence, but the FRD never states it. It is recorded as a hypothesis, used to keep the IA coherent, and flagged for confirmation.

---

# 10 · ERP & ENTERPRISE INTEGRATION — `ERP`

| Capability | FRD | Roles consuming | System dependencies | Phase | R005 UX |
|---|---|---|---|---|---|
| ERP system integration | 7.1.1 | IA, SA | External ERP | `P1` | 🔴 **None** |
| ERP API endpoints (inbound push) | 7.1.2 | IA, SA | External ERP | `P1` | 🔴 **None** |
| Scheduled synchronization | 7.2.1 | IA | External ERP | `P1` | 🟡 Learner-visible effect only |
| Sync interval configuration | 7.2.1 | IA | — | `P1` | 🔴 **None** |
| Sync status & history | 7.2.1 | IA | — | `P1` | 🔴 **None** |
| Account auto-provisioning | 7.2.2 | L, IA | ERP | `P1` | ✅ Reusable — learner first-login |
| Stream-based access assignment | 7.2.3 | L, IA, F | ERP, `ENT` | `P1` | 🟡 Learner effect only |
| Field authority / overwrite protection | 7.1.1 vs 4.3.1 | L, F, IA | ERP | `PEND-P` | 🟡 Partial — read-only fields |
| Real-time provisioning at first login | 7.3.x | L, IA | ERP | `P2` | — |

**Every `ERP` capability has a learner-visible consequence that Review 005 already handles, and an administrator-facing control surface that does not exist.** The pattern is identical to `ENT`: the effect was designed, the cause was not.

---

# 11 · PROGRESS — `PRG`

| Capability | FRD | Roles consuming | System dependencies | Phase | R005 UX |
|---|---|---|---|---|---|
| Module completion recording | 11.1.1 | L, F, IA | `LRN`, `ASM`, `XRD` | `P1` | ✅ Reusable |
| Completion definition (D-08) | 11.1.1 | L, F | — | `P1` | ✅ **PM-09 approved** |
| Time-spent tracking | 11.1.2 | L, F, IA | Runtime telemetry | `P1` | ✅ Reusable |
| Assessment score recording | 11.2.1 | L, F | `ASM` | `P1` | ✅ Reusable |
| Attempt recording | 11.2.2 | L, F | `ASM`, `XRD` | `P1` | ✅ Reusable |
| Account-level completion from device | D-19 | L, F | `XRD` | `P1` | ✅ Reusable |
| Learner-facing progress view | 8.1.5 | L | — | `P1` | ✅ Fully reusable |
| **Cohort-facing progress view** | 8.1.4 | F, IA | `TEN` 1.3.4 bound | `P1` operational | 🔴 **None** |

**`PRG` is where PM-11's line falls most sharply.** Recording (11.1.x, 11.2.x) is Phase 1. Learner-facing display is Phase 1 and built. **Cohort-facing display is where "operational status" ends and "analytics" begins** — Faculty may see *who is blocked and who has completed* (operational, 8.1.4); they may not get *class performance reports* (11.3.1, Phase 2).

---

# 12 · ANALYTICS & REPORTING — `RPT`

> **PM-11: build core functionality and core operations first. Do not invent large analytics dashboards now. Do not remove reporting from the long-term FRD.**

| Capability | FRD / PM | Roles consuming | Phase | R005 UX |
|---|---|---|---|---|
| Operational learner status | 8.1.4 | F, IA, SA | `P1` **operational** | 🔴 None |
| Institutional operational summary | 8.1.3, 6.2.2 | IA, SA | `P1` **operational** | 🔴 None |
| Content pipeline status | 1.4.x | V, AR, CM, SA | `P1` **operational** | 🔴 None |
| Cross-tenant operational oversight | 8.1.1, 1.3.5 | SA | `P1` **operational** | 🔴 None |
| Tenant-scoping enforcement | **1.3.4** | IA, F, SA | `P1` | ✅ Reusable as a constraint |
| Institutional usage dashboard | 8.2.1 | IA | `P2` | — |
| Licence utilisation tracking | 8.2.2 | IA, SA | `P2` | — |
| Class-level performance reports | 11.3.1 | F | `P2` | — |
| Institutional adoption reports | 11.3.2 | IA | `P2` | — |
| XR heatmaps / decision paths | 11.4.x | F, SA | `P3` | — |
| **Detailed metrics & KPI definitions** | **PM-11** | All | **`PEND-P`** | — |

### The operational / analytical test

Applied to every proposed reporting element in Phase 1:

| Question the element answers | Classification | Phase 1? |
|---|---|---|
| *"What is the state of the thing I operate right now?"* | **Operational** | ✅ Yes |
| *"Which of my learners are blocked today?"* | **Operational** | ✅ Yes |
| *"How many seats of our licence are in use?"* | **Operational** | ✅ Yes |
| *"What is in my review queue?"* | **Operational** | ✅ Yes |
| *"How is this cohort performing over the semester?"* | **Analytical** | ❌ Phase 2 (11.3.1) |
| *"What is our module adoption trend?"* | **Analytical** | ❌ Phase 2 (11.3.2) |
| *"Where do learners make mistakes inside a simulation?"* | **Analytical** | ❌ Phase 3 (11.4.x) |

**Every Phase-1 reporting element is also bounded by FRD 1.3.4** — an institution's reporting sees only that institution's data.

---

# 13 · SECURITY & AUDIT — `SEC`

| Capability | FRD | Roles consuming | Phase | R005 UX |
|---|---|---|---|---|
| XR asset encryption | 10.1.1 | — | `P1` | ✅ Constraint honoured |
| Encrypted cloud storage | 12.1.2 | — | `P1` | — |
| Module authorization before execution | 10.1.2 | L | `P1` | ✅ Reusable |
| Secure authentication | 10.2.1 | All 7 | `P1` | 🟡 Learner login only |
| Session expiry | 10.2.2 | All 7 | `P1` | 🟡 Learner only |
| VAPT | 10.3.1 | — | `P1` | — |
| Patch management | 10.3.2 | — | `P1` | — |
| No internal codes in error states | C-07, D-18 | All 7 | `P1` | ✅ Reusable as a rule |
| **Governance audit trail** | *absent* | All governance roles | `PEND-P` | 🔴 None |
| Data access controls | 10.4.1 | SA | `P2` | — |
| Data retention policies | 10.4.2 | SA | `P2` | — |

---

# 14 · PLATFORM CONFIGURATION — `CFG`

| Capability | FRD | Roles consuming | Phase | R005 UX |
|---|---|---|---|---|
| Platform configuration | 8.1.1 | SA | `P1` | 🔴 **None** |
| Version release control | 2.3.2 | SA | `P1` | 🔴 **None** |
| Tenant configuration | 8.1.3 | IA | `P1` | 🔴 **None** |
| SSO configuration | 4.2.2 | IA, SA | `P1` | 🔴 **None** |
| ERP sync configuration | 7.2.1 | IA | `P1` | 🔴 **None** |
| Assessment configuration | PM-08 | F | `P1` | 🔴 **None** |
| Cloud infrastructure | 12.1.1 | — | `PEND-T` | — |
| Custom role configuration | 8.3.x | SA | `P3` | — |

**`CFG` is the second wholly-new domain after `GOV`.** Six Phase-1 configuration capabilities, none with any UX. They share a single interaction pattern — *set parameters, validate, save, show effect* — which makes them a strong candidate for one shared configuration component set rather than six bespoke designs.

---

# 15 · NOTIFICATIONS & SUPPORT — `NOT`

**This domain is included for completeness and is deliberately near-empty in Phase 1.**

| Capability | FRD basis | Phase | Justified for Phase 1? |
|---|---|---|---|
| Grace-period renewal notifications | **9.4.2 — Phase 3**, institution-facing | `P3` | ❌ No |
| Learner notifications | *none* | — | ❌ **No FRD basis** |
| In-workflow status communication (queue state, submission outcome) | Derived from 1.4.1–1.4.4 | `P1` | ⚠️ **Implied, not stated** |
| Help destination | *none* — WCAG 2.2 SC 3.2.6 only | `P1` | ⚠️ Design-supplied, consistent location |

**Honest position.** The word *"notification"* appears **once** in the entire FRD — at 9.4.2, which is **Phase 3** and institution-facing. There is **no Phase-1 notification requirement of any kind**.

But the governance chain hands work between four people across four gates. A Vendor who submits and hears nothing, or an Academic Reviewer with no queue, cannot do the job FRD 1.4.1–1.4.2 assigns them. Review 006 therefore treats **in-workflow status** (a queue, a state on an object, an outcome on a submission) as **implied by the workflow requirements themselves** — and treats **push notification** (email, alerts, digests) as **not justified** and **not designed**.

The distinction is deliberate: *seeing the state of your own work when you look at it* is part of the workflow. *Being told about it when you are not looking* is a notification system, and no requirement asks for one.

---

# Cross-domain view

## Which domains each role consumes

| Domain | L | F | IA | CM | SA | V | AR |
|---|---|---|---|---|---|---|---|
| `IAM` Identity & Access | ● | ● | ● | ● | ● | ● | ● |
| `CAT` Content & Catalogue | ● | ● | ● | ● | ● | ● | ● |
| `LRN` Learning | ● | ● | ● | ○ | ○ | — | ○ |
| `ASM` Assessments | ● | ● | ○ | — | ○ | — | ○ |
| `XRD` XR Delivery | ● | ○ | ● | — | ● | — | ○ |
| `ENT` Licensing & Entitlements | ● | ○ | ● | — | ● | — | — |
| `COM` Commerce & Payments | ● | — | ○ | — | ● | — | — |
| `GOV` Content Governance | — | — | — | ● | ● | ● | ● |
| `TEN` Institution & Tenancy | ○ | ○ | ● | — | ● | — | — |
| `ERP` Enterprise Integration | ○ | ○ | ● | — | ● | — | — |
| `PRG` Progress | ● | ● | ● | — | ○ | — | — |
| `RPT` Analytics & Reporting | ○ | ● | ● | ● | ● | ○ | ○ |
| `SEC` Security & Audit | ○ | ○ | ○ | ○ | ● | ○ | ○ |
| `CFG` Platform Configuration | — | ● | ● | — | ● | — | — |
| `NOT` Notifications & Support | ○ | ○ | ○ | ○ | ○ | ○ | ○ |

● primary consumer · ○ secondary or read-only · — not consumed

**Super Admin touches 14 of 15 domains** — it is the platform-wide role by definition, and its workspace must be structured by domain rather than by task or it becomes unnavigable.

**Content governance is cleanly separated.** `GOV` is consumed by exactly four roles and by **none** of the three tenant-plane roles (L, F, IA). This is the strongest evidence for the two-plane hypothesis in §9.

## Reuse position across all fifteen domains

| Domain | Reusable | Partial | None |
|---|---|---|---|
| `LRN` Learning | 6 | 0 | 2 |
| `COM` Commerce | 8 | 0 | 0 (4 are Phase 2) |
| `ASM` Assessments | 7 | 4 | 4 |
| `PRG` Progress | 7 | 0 | 1 |
| `IAM` Identity & Access | 3 | 4 | 3 |
| `CAT` Content & Catalogue | 5 | 1 | 0 (4 later phase) |
| `ENT` Entitlements | 5 | 2 | 2 |
| `SEC` Security | 3 | 2 | 1 |
| `TEN` Tenancy | 3 | 3 | 3 |
| `XRD` XR Delivery | 3 | 5 | 5 |
| `ERP` Integration | 1 | 3 | 4 |
| `RPT` Reporting | 1 | 0 | 4 |
| **`CFG` Configuration** | **0** | **0** | **6** |
| **`GOV` Governance** | **0** | **0** | **9** |
| `NOT` Notifications | 0 | 0 | 2 |

**Two domains are entirely unbuilt: `GOV` and `CFG`.** Together they account for 15 of the platform's undesigned Phase-1 capabilities. They are also the two domains where the FRD is most explicit — which means they can be designed now, without waiting for a pending answer.
