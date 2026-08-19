# 06 — B2B / B2C Journeys

**Review:** 006 — Full Platform Reframe
**Created:** 2026-08-18
**Authority:** **PM-04** — both B2B institutional users and B2C individual learners are required; **B2B-first / B2C-second is NOT a PM-confirmed release sequence**; both must be represented in the platform architecture.

---

## The governing statement

> **PM-04: Both B2B institutional users and B2C individual learners are required.**
> **Do NOT treat B2B-first / B2C-second as a PM-confirmed release sequence.**
> **Both must be represented in the platform architecture.**

### The FRD agrees

| FRD | Phase | Requirement |
|---|---|---|
| **1.1.2** | **Phase 1** | B2B institutional learning environment |
| **1.1.3** | **Phase 1** | B2C individual learning environment |
| 1.3.1 | Phase 1 | Tenant-wise isolation (B2B) |
| 1.3.2 | Phase 1 | Separate B2C database environment |
| 1.3.3 | Phase 1 | Regional B2C database expansion |
| 6.1.1 / 6.1.2 | Phase 1 | B2C module and bundle purchase |
| 6.2.1 / 6.2.2 | Phase 1 | Institutional stream and capped licensing |

**Both environments are Phase 1 in the FRD, with no sequencing between them.** Any B2B-first ordering was an interpretation, never an FRD requirement and never a PM decision. It returns to **pending** unless the FRD explicitly phases something — and on direct enumeration, it does not.

---

## The correct mental model

**Not two products. Not two audiences with a shared skin.**

**One learning core, reached by two different routes, with two different data environments behind it.**

```
        B2B ROUTE                                    B2C ROUTE
   institutional context                       individual context
             │                                          │
   ERP provisioning (7.2.2)                  Self-registration (4.1.1/4.1.2)
   Institutional SSO (4.2.2)                 Password + social
   Stream licence (6.2.1, 7.2.3)             Purchase (6.1.1, 6.1.2)
   Assigned by IA / Faculty                  Chosen and bought by the learner
   Tenant plane (1.3.1)                      Personal plane (1.3.2)
             │                                          │
             └──────────────────┬───────────────────────┘
                                ▼
                    ╔═══════════════════════╗
                    ║  SHARED LEARNING CORE ║   ← identical for both
                    ╚═══════════════════════╝
                                │
             ┌──────────────────┴───────────────────┐
             ▼                                      ▼
   Institutional oversight                 Personal ownership
   Faculty · Institute Admin               Device binding (2.4.1)
   Operational reporting (PM-11)           Purchases · receipts
   Tenant-bounded (1.3.4)                  Individual only
```

---

# Part 1 · The Shared Learning Core

**Everything in this section is identical for a B2B and a B2C learner.** It is the largest part of the learner experience, it is fully designed in Review 005, and **PM-09 approved it**.

| Capability | FRD | Identical? |
|---|---|---|
| Content hierarchy — program → course → module | 3.1.1, 3.2.1 | ✅ |
| One module = one XR simulation | 3.1.1 | ✅ |
| Optional learning components | 3.1.2 | ✅ |
| **Resources → simulation → assessment → completion** | **PM-09** | ✅ |
| Module-internal sequential gating | D-20 | ✅ |
| Learning resources — PDF and video | 3.1.2, D-05 | ✅ |
| Simulation formats — web / VR / MR / AR | 1.2.1–1.2.4 | ✅ |
| Entitlement-aware device delivery | PM-05 | ✅ |
| Assessment attempt, scoring, result | 5.2.x, 11.2.x | ✅ |
| Configuration-driven assessment behaviour | PM-08 | ✅ |
| Correctness without the answer key | D-25 | ✅ |
| Completion model | D-08, 11.1.1 | ✅ |
| Account-level simulation completion | D-19 | ✅ |
| Personal progress | 8.1.5, 11.1.x, 11.2.x | ✅ |
| Design system, accessibility, state grammar | D-11, D-12, D-18 | ✅ |

> **The design rule that follows:** branch **only** where the two genuinely differ. Every divergence must be listed. Anything not listed is shared.

---

# Part 2 · B2B-specific

| # | Element | FRD | Status | Where |
|---|---|---|---|---|
| B1 | Institutional identity and context | 1.1.2 | Learner label exists | LRN header · IAD |
| B2 | Tenant isolation — no tenant switcher | 1.3.1 | ✅ Designed as a constraint | All tenant-plane workspaces |
| B3 | Institutional onboarding | 4.2.1 | 🔴 **NEW** | IAD / SA |
| B4 | **Institutional SSO** — configuration | 4.2.2 · PM-10 | 🔴 **NEW** | IAD |
| B5 | Institutional SSO — authentication | 4.2.2 · D-03 | ✅ Designed | AUTH |
| B6 | ERP integration and API | 7.1.1, 7.1.2 | 🔴 **NEW** | IAD |
| B7 | Scheduled ERP synchronisation | 7.2.1 | 🟡 Learner effect only | IAD |
| B8 | ERP-provisioned accounts | 7.2.2 | ✅ Designed (first login) | AUTH · IAD |
| B9 | Stream-based access assignment | 7.2.3 | 🟡 Learner effect only | IAD · LRN |
| B10 | Stream-based institutional licensing | 6.2.1 | 🟡 Learner effect only | IAD · SA |
| B11 | **Capped licence and seat utilisation** | 6.2.2 | 🟡 Learner wall only | IAD |
| B12 | Faculty course assignment | 8.1.4 | 🔴 **NEW** | FAC |
| B13 | Faculty assessment configuration | 5.1.x, PM-08 | 🔴 **NEW** | FAC |
| B14 | Faculty operational learner status | 8.1.4 · PM-11 | 🔴 **NEW** | FAC |
| B15 | Institute Admin student access management | 8.1.3 | 🔴 **NEW** | IAD |
| B16 | Institutional operational summary | 8.1.3 · PM-11 | 🔴 **NEW** | IAD |
| B17 | Shared institutional XR devices | 2.4.3 | ✅ Learner guidance | LRN · IAD |
| B18 | XR sign-in with LMS credentials | 2.4.4 | ⚠ Unresolved under SSO | LRN |
| B19 | **No commerce surfaces for the learner** | D-01, D-04 | ✅ Designed | LRN |
| B20 | Tenant-bounded reporting | 1.3.4 | ✅ Constraint | FAC · IAD |

**Eleven of twenty B2B elements are new.** Every one of them sits in a workspace that did not exist before PM-01 — Faculty, Institute Admin, or Super Admin. **The B2B learner experience was largely complete; the B2B institution experience did not exist at all.**

---

# Part 3 · B2C-specific

| # | Element | FRD | Status | Where |
|---|---|---|---|---|
| C1 | Self-registration by email | 4.1.1 | ✅ Designed | AUTH |
| C2 | Social login | 4.1.2 | ✅ Designed (sample providers) | AUTH |
| C3 | Separate B2C data environment | 1.3.2 | ✅ Constraint | System |
| C4 | Regional B2C instances | 1.3.3 | — | Infrastructure |
| C5 | Catalogue discovery — Explore | 1.1.3 | ✅ Designed | LRN |
| C6 | Individual module purchase | 6.1.1 | ✅ Designed | LRN |
| C7 | Bundle purchase | 6.1.2 | ✅ Designed | LRN |
| C8 | **Courses are not purchasable** | D-21 | ✅ Prohibition designed | LRN |
| C9 | Checkout | 6.1.x | ✅ Designed | LRN |
| C10 | Payment gateway redirect | 9.1.1, 9.1.2 | ✅ Designed (generic) | LRN |
| C11 | Automatic licence activation | 9.2.1 | ✅ Designed | LRN |
| C12 | Entitlement to My Learning | 9.2.2 | ✅ Designed | LRN |
| C13 | Standalone module immediate availability | D-22 | ✅ Designed | LRN |
| C14 | Access-duration data contract | D-24 | ✅ Designed | LRN |
| C15 | **Personal device binding** | 2.4.1 | 🔴 **NEW** | LRN |
| C16 | **Device replacement request** | 2.4.2 | 🔴 **NEW** | LRN → SA |
| C17 | Purchases / receipts | 9.2.1 | 🟡 Partial | LRN |
| C18 | No institutional context | 1.3.2 | ✅ Designed | LRN |

**Only two B2C elements are genuinely new — C15 and C16, both device-related** (FRD 2.4.1, 2.4.2). Both were Phase-1 requirements that the earlier assumption `A-14` declined to design. Under PM-05's device-delivery requirement they can no longer be deferred.

**B2C is the most complete journey in the platform.** PM-04 changes nothing about it except its framing.

---

# Part 4 · Divergence register

**Every point where B2B and B2C differ. Anything not listed here is shared.** This extended the Review-005 ten-item list to eighteen at Review 006; **PM-15 then removed one, leaving seventeen.** Items 1–10 are carried forward unchanged.

| # | Divergence | B2B institutional | B2C individual | Status |
|---|---|---|---|---|
| 1 | Learner global navigation | No Explore | Explore present | KEEP |
| 2 | Header context | Institution name label | None | KEEP |
| 3 | Sign-up | Not offered — provisioned | Offered | KEEP |
| 4 | Authentication | SSO preferred, password fallback | Password + social | KEEP |
| 5 | Entitlement origin | Assigned by stream | Purchased | KEEP |
| 6 | Empty My Learning | "Contact your institution" | "Explore modules" + CTA | KEEP |
| 7 | Access restricted | Contact administrator, **no purchase prompt** | Purchase path where applicable | KEEP |
| 8 | Profile fields | ERP fields read-only | All editable | KEEP |
| 9 | XR device model | Shared institutional devices (2.4.3) | Personal device binding (2.4.1) | **EXPANDED** |
| 10 | Licence expiry | Institution-managed | Learner-managed | KEEP |
| **11** | **Data plane** | Tenant environment (1.3.1) | Separate B2C environment (1.3.2) | **NEW** |
| **12** | **Administrative oversight** | Faculty + Institute Admin see operational status | No oversight role exists | **NEW** |
| **13** | **Content assignment** | ERP + Faculty/IA assign | Learner self-selects by purchase | **NEW** |
| **14** | **Licence model** | Stream packages, capped seats (6.2.1, 6.2.2) | Per-module / per-bundle (6.1.1, 6.1.2) | **NEW** |
| **15** | **Sequencing scope** | Course context — D-07 applies | Standalone purchase — D-07 does not; D-20 does (D-22) | **NEW** |
| **16** | **Device replacement** | Institutional device fleet, no personal request | Learner requests → Super Admin approves (2.4.2) | **NEW** |
| ~~17~~ | ~~Assessment configuration owner~~ | — | — | ✅ **REMOVED — resolved by PM-15.** Ownership is the **same** on both sides: the Faculty / institution-authorized side. No longer a divergence |
| **17** | **Reporting visibility** | Tenant-bounded operational status (1.3.4, PM-11) | Personal progress only | **NEW** |

### Divergence 17 — ✅ RESOLVED and REMOVED by PM-15 (19 August 2026)

Review 006 surfaced a genuine gap here. FRD 5.1.1, 5.1.2, and 5.3.2 all assign assessment authoring and configuration to **Faculty** — an institutional role. **A B2C individual learner has no Faculty.** Three readings were defensible and none was stated anywhere.

**PM-15 resolved it at product level:**

> **For BOTH B2B and B2C, assessment setup/configuration is the responsibility of Faculty or the institution side. The learner does NOT author or configure assessments.**

**This does not merely answer the divergence — it removes it.** Assessment ownership is no longer a point where the two journeys differ. Both converge on the **Faculty / institution-authorized side**, and in neither journey does the learner author or configure anything.

| | B2B | B2C |
|---|---|---|
| Who owns assessment configuration | Faculty / institution-authorized side | **Faculty / institution-authorized side** |
| Does the learner configure? | ⛔ Never | ⛔ **Never** |

**One interpretation rule carried from PM-15:** do **not** automatically grant every Institute Admin assessment-authoring permission. The FRD names **Faculty** explicitly (8.1.4, 5.1.1, 5.1.2, 5.3.2), so Faculty remains the clearest direct authoring role. Institute Admin authority stays open.

**One non-blocking detail remains.** For a *pure* B2C individual learner, the exact operational mapping — **which** Faculty, institution, or content owner supplies the assessment — is deferred by PM-15 as a **content / implementation detail**. It is explicitly **not a blocker for platform IA**, and it changes no screen, permission, or flow above.

---

# Part 5 · Where the two journeys touch the same objects

```
                    PUBLISHED MODULE            (FLOW 1 · 1.4.4)
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
  B2B: licensed to an institution         B2C: listed in the catalogue
       6.2.1 · stream package                  6.1.1 / 6.1.2
        │                                       │
  IA maps stream → package                Learner purchases
       7.2.3                                    9.1.x
        │                                       │
  Faculty assigns                         Licence activates
       8.1.4                                    9.2.1
        │                                       │
        └───────────────▶ ENTITLEMENT ◀─────────┘
                              │
                    SAME module · SAME content
                    SAME progression (PM-09)
                    SAME completion model (D-08)
                    SAME device delivery (PM-05)
```

**One module, one content object, two entitlement routes.** This is what makes the shared core genuinely shared rather than duplicated — and it is why `ENT` is identified in `03_SHARED_CAPABILITY_MAP.md` as the platform's spine.

**The isolation rule holds regardless.** A person who is both an institutional learner and an individual buyer has **two accounts in two data environments** (1.3.1, 1.3.2). Their institutional progress and their personal purchases do **not** merge. Whether identity linking should exist is a long-standing open question and is **not** resolved by PM-04.

---

# Part 6 · Architectural representation requirement

**PM-04 requires both to be represented in the platform architecture — not sequenced.** Verification that they are:

| Artefact | B2B represented | B2C represented |
|---|---|---|
| `01_PHASE1_FEATURE_INVENTORY.md` | ✅ Market column | ✅ Market column |
| `02_ROLE_PERMISSION_MATRIX.md` | ✅ Tenant scope, IA/F rows | ✅ Personal scope, `COM` domain |
| `03_SHARED_CAPABILITY_MAP.md` | ✅ `TEN`, `ERP`, `ENT` | ✅ `COM`, `ENT` |
| `04_PLATFORM_INFORMATION_ARCHITECTURE.md` | ✅ IAD + FAC workspaces, B2B learner nav | ✅ Explore branch, B2C learner nav |
| `05_END_TO_END_WORKFLOWS.md` | ✅ FLOW 2, 6, 9, 10 | ✅ FLOW 3 |
| `07_XR_DELIVERY_MODEL.md` | ✅ Shared devices (2.4.3) | ✅ Device binding (2.4.1, 2.4.2) |
| `10_FULL_PLATFORM_SCREEN_INVENTORY.md` | ✅ IAD, FAC screens | ✅ B2C screens |

## No sequencing is asserted anywhere

**No document in Review 006 states, implies, or plans a B2B-first or B2C-first release order.**

Where prioritisation appears — the detailed-Figma recommendation in `12_REVIEW006_SUMMARY.md` — it is ordered by **cross-role coverage and design risk**, not by market. That recommendation is explicitly labelled as a recommendation awaiting PM approval, not as a release sequence.

---

# Summary

| | B2B | B2C |
|---|---|---|
| **Phase-1 FRD requirement** | ✅ 1.1.2 | ✅ 1.1.3 |
| **PM-confirmed** | ✅ PM-04 | ✅ PM-04 |
| **Elements identified** | 20 | 18 |
| **Already designed** | 7 | 15 |
| **Partial** | 3 | 2 |
| **New** | **11** | **2** |
| **Learner journey completeness** | High — institutional learner largely designed | **Highest — essentially complete** |
| **Institutional/administrative completeness** | **Zero before this reframe** | n/a — no admin role exists |

**The reframe's real asymmetry is not B2B vs B2C. It is learner vs everyone else.** Both learner journeys are in good shape. What was missing is the institutional machinery behind the B2B journey — and that machinery is missing because the roles that operate it were out of scope, not because B2B was deprioritised.

**Divergence 17 — who configures assessments for B2C — was the one genuinely new product gap this analysis surfaced. ✅ PM-15 closed it on 19 August 2026**, and in doing so removed it from the register entirely rather than merely answering it: ownership is identical on both sides, so it is no longer a point of divergence at all. **The register stands at 17 divergences, down from 18.**
