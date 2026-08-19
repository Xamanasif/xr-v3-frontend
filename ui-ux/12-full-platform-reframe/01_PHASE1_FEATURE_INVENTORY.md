# 01 — Phase-1 Feature Inventory (Full Platform)

**Review:** 006 — Full Platform Reframe
**Created:** 2026-08-18
**Authority:** `ui-ux/00-project-context/PM_CONFIRMED_BASELINE_2026-08-18.md` → `source/Platform FRD_v4.pdf` → compatible Review-005 decisions → labelled assumptions
**Scope:** **Every** Phase-1 FRD requirement, re-audited from the complete platform perspective across all seven confirmed roles.

> **This is a re-audit, not a re-labelling.** Review-005 classifications were produced under a Student-only scope in which "no Student surface" and "out of scope" were frequently the same judgement. That equivalence no longer holds. Every row below was re-derived from the FRD text with an **owning role** assigned.

> **Do not quote the Review-005 figure "44 of 78 Student-facing (56%)" as project coverage.** It measured one workspace under a superseded scope. It is not a platform coverage number and is not restated here.

---

## Count verification

| | Count |
|---|---|
| FRD sections | 12 |
| **Phase-1 requirements (all 12 sections)** | **78** |
| Phase-2 requirements | 33 |
| Phase-3 requirements | 20 |
| **Total numbered FRD requirements** | **131** |

Counts verified by direct enumeration of the FRD text. All **78** Phase-1 requirements are itemised individually below.

---

## Legend

**Domain / capability** — see `03_SHARED_CAPABILITY_MAP.md`

`IAM` Identity & Access · `CAT` Content & Catalogue · `LRN` Learning · `ASM` Assessments · `XRD` XR Delivery · `ENT` Licensing & Entitlements · `COM` Commerce & Payments · `GOV` Content Governance · `TEN` Institution / Tenancy · `ERP` ERP / Enterprise Integration · `PRG` Progress · `RPT` Analytics & Reporting · `SEC` Security & Audit · `CFG` Platform Configuration · `NOT` Notifications & Support

**Roles** — `L` Learner · `F` Faculty · `IA` Institute Admin · `CM` Content Manager · `SA` Super Admin · `V` Vendor · `AR` Academic Reviewer · `—` no role-facing surface

**Market** — `B2B` · `B2C` · `Shared`

**Surface** — `UI` needs a screen or screen region · `FLOW` cross-screen flow or state, no screen of its own · `SYS` system behaviour, no role-facing surface · `INT` external integration contract

**R005 reuse** — `KEEP` · `KEEP+REFRAME` · `MODIFY` · `SUPERSEDE` · `DEFER` · `NEW` (nothing exists) · `N/A` (no design artefact applies)

**Status**

| Status | Meaning |
|---|---|
| `FRD-CONFIRMED` | Requirement stands as written in the FRD; no PM intervention needed |
| `PM-CLARIFIED` | PM statement changed the reading, the owner, or the scope of this requirement |
| `PM-DEFERRED` | PM explicitly moved this out of Phase 1 |
| `CONFIRMED` | Settled by a compatible Review-005 decision that survives the reframe |
| `PRODUCT-PENDING` | A product/business answer is required before this can be fully designed |
| `TECHNICAL-PENDING` | An engineering/integration answer is required before this can be fully designed |

---

# Section 1 — Platform Overview (18 Phase-1 requirements)

| FRD | Requirement meaning | Domain | Roles | Market | Surface | PM impact | Current coverage | R005 reuse | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **1.1.1** | Multi-tenant SaaS LMS distributing XR engineering simulation modules to institutions **and** individuals | TEN, CFG | all | Shared | SYS | PM-03 | Learner shell only | KEEP+REFRAME | FRD-CONFIRMED | The platform frame that must now host seven workspaces, not one |
| **1.1.2** | B2B institutional deployments — organisations buy licences; students **and faculty** access under a shared institutional subscription | TEN, ENT | L, F, IA, SA | B2B | FLOW | PM-04 | Learner side only | MODIFY | FRD-CONFIRMED | The FRD names **faculty** here. Faculty access under institutional subscription was never designed |
| **1.1.3** | B2C individual learners independently purchase modules or packages, access via personal accounts | COM, ENT | L, SA | B2C | FLOW | PM-04 | B2C-01 – B2C-05 | KEEP+REFRAME | FRD-CONFIRMED | Learner-side commerce is reusable; the SA-side product/licence view is new |
| **1.1.4** | All hosted XR modules remain under platform-owner ownership and governance; not modifiable or redistributable by institutions | GOV, SEC | SA, CM, IA, V | Shared | SYS | PM-06 | Honoured as a constraint | KEEP | FRD-CONFIRMED | Bounds what IA may do to content and what V retains after submission |
| **1.2.1** | Web simulation support — browser-based, no XR hardware | XRD, LRN | L | Shared | UI | PM-05 | STU-07 Web · STU-08 runtime | KEEP | FRD-CONFIRMED | Only format executable in the portal itself |
| **1.2.2** | VR simulation support via VR headsets such as Meta Quest | XRD | L, IA, SA | Shared | UI | **PM-05** | STU-07 VR — **guidance only** | **MODIFY** | TECHNICAL-PENDING | Guidance-only model is now incomplete; entitlement-aware delivery required |
| **1.2.3** | MR simulation support for MR hardware such as Ajna Lens | XRD | L, IA, SA | Shared | UI | **PM-05** | STU-07 MR — guidance only | **MODIFY** | TECHNICAL-PENDING | Sideloaded (2.1.2) — institutional route, not self-service |
| **1.2.4** | AR simulation support on Android and iOS mobile devices | XRD | L | Shared | UI | **PM-05** | STU-07 AR — guidance only | **MODIFY** | TECHNICAL-PENDING | ⚠ **FRD Section 2 defines no AR application architecture.** See `07_XR_DELIVERY_MODEL.md` §Gaps |
| **1.3.1** | Tenant-wise database isolation — user records, analytics, licensing, institution-specific course mapping | TEN, SEC | IA, SA | B2B | SYS | PM-01 | No tenant switcher (Learner) | KEEP+REFRAME | FRD-CONFIRMED | Must now scope five admin workspaces, not one Learner view |
| **1.3.2** | B2C users maintained in a separate database environment | TEN, SEC | SA | B2C | SYS | PM-04 | Recorded via Q-18 | KEEP | FRD-CONFIRMED | Identity linking remains open |
| **1.3.3** | Additional regional B2C database instances for performance | TEN | — | B2C | SYS | — | none | N/A | FRD-CONFIRMED | Infrastructure only |
| **1.3.4** | Analytics and reporting per institution limited to that tenant's dataset | RPT, TEN | IA, F, SA | B2B | SYS | **PM-11** | Personal-only Learner progress | KEEP+REFRAME | FRD-CONFIRMED | **Hard bound on every reporting surface in every admin workspace** |
| **1.3.5** | Super Admin has controlled cross-tenant access for governance and operational oversight | TEN, SEC, RPT | SA | Shared | UI | PM-01, PM-07 | none | **NEW** | FRD-CONFIRMED | The only FRD-granted cross-tenant access. Frames where V and AR can sit |
| **1.4.1** | Authorized vendors submit XR module builds and assets through a staging environment | GOV | **V**, CM | Shared | UI | **PM-07** | none | **NEW** | PM-CLARIFIED | Vendor promoted from actor to workspace |
| **1.4.2** | All submitted modules undergo academic validation by the BITS Pilani academic team | GOV | **AR** | Shared | UI | **PM-07** | none | **NEW** | PM-CLARIFIED | Academic Reviewer promoted from actor to workspace |
| **1.4.3** | Content Manager reviews metadata, documentation, and platform compatibility before approving for publication | GOV, CAT | CM | Shared | UI | PM-01 | none | **NEW** | FRD-CONFIRMED | Defines the CM workspace's core job |
| **1.4.4** | Only Super Admin may publish approved modules to production | GOV | SA | Shared | UI | PM-01 | none | **NEW** | FRD-CONFIRMED | Publishing authority is exclusive |
| **1.4.5** | Third-party vendors have no direct publishing rights | GOV, SEC | V, SA | Shared | SYS | PM-07 | none | **NEW** | FRD-CONFIRMED | A permission **prohibition** the Vendor workspace must visibly respect |

---

# Section 2 — XR Content Delivery Architecture (11 Phase-1 requirements)

| FRD | Requirement meaning | Domain | Roles | Market | Surface | PM impact | Current coverage | R005 reuse | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **2.1.1** | A centralized master VR application on the Meta Quest Store acts as the container for downloading and launching XR modules | XRD | L, IA, SA | Shared | FLOW | **PM-05** | Named in STU-07 VR copy | **MODIFY** | TECHNICAL-PENDING | Closely matches PM **Concept B**, but the PM made **no selection** |
| **2.1.2** | MR simulations run through a sideloaded application on Ajna Lens devices | XRD | L, IA | B2B | FLOW | **PM-05** | STU-07 MR copy | **MODIFY** | TECHNICAL-PENDING | Sideloading is administratively gated — an IA capability with no designed surface |
| **2.2.1** | Simulation modules packaged as encrypted asset bundles, dynamically downloaded by the master XR application | XRD, SEC | — | Shared | SYS | PM-05 | none | N/A | TECHNICAL-PENDING | Format unspecified; do not invent one |
| **2.2.2** | Modules download **only after licence validation is confirmed by the platform** | XRD, ENT | L, SA | Shared | FLOW | **PM-05** | Restricted state (STATE-01) | **MODIFY** | FRD-CONFIRMED | **This is the FRD basis for PM-05's entitlement-aware delivery.** Not a new requirement |
| **2.3.1** | The XR application automatically downloads updated module versions when available | XRD | L | Shared | FLOW | PM-05 | none | **NEW** | TECHNICAL-PENDING | Creates an *update available* state the Learner may see |
| **2.3.2** | Super Admin controls when new module versions release to production | GOV, CFG | SA | Shared | UI | PM-01 | none | **NEW** | FRD-CONFIRMED | An SA release-control surface; also the origin of mid-course content change |
| **2.3.3** | Modules update independently of the master XR application — no full reinstall | XRD | — | Shared | SYS | PM-05 | none | N/A | TECHNICAL-PENDING | Constrains the delivery model |
| **2.4.1** | Individual (B2C) licences bound to a specific encrypted XR device ID **and** a user account | ENT, XRD | L, SA | B2C | UI | PM-05 | ⚠ **none** (A-14 declined) | **NEW** | PRODUCT-PENDING | Phase-1 requirement with no designed surface in any workspace |
| **2.4.2** | Device replacement requires **Super Admin approval** before licence transfer | ENT, XRD | **L → SA** | B2C | UI | PM-01, PM-07 | ⚠ **none** (A-14 declined) | **NEW** | PRODUCT-PENDING | A **two-role workflow** — Learner request + SA approval. Neither side exists |
| **2.4.3** | Institutional deployments allow multiple students to access simulations on shared XR devices | XRD, TEN | L, IA | B2B | FLOW | PM-05 | STU-07 VR lab guidance | KEEP+REFRAME | FRD-CONFIRMED | Explains why B2B has no personal device binding |
| **2.4.4** | Institutional students must log into the XR application using their **LMS credentials** | IAM, XRD | L, IA | B2B | FLOW | PM-10 | Noted; unresolved under SSO | **MODIFY** | TECHNICAL-PENDING | Under SSO an institutional learner may have no password to type into a headset |

---

# Section 3 — Content Organization & Learning Structure (6 Phase-1 requirements)

| FRD | Requirement meaning | Domain | Roles | Market | Surface | PM impact | Current coverage | R005 reuse | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **3.1.1** | A module is the smallest learning unit and contains a **single** XR simulation experience | CAT, LRN | L, CM, F | Shared | UI | PM-09 | STU-04 module detail | **KEEP** | CONFIRMED | Atomic unit of the whole content model |
| **3.1.2** | Modules **may** include supporting material: theoretical explanations, simulation instructions, and assessments | CAT, LRN, ASM | L, CM, F | Shared | UI | PM-09 | STU-04/05/06 | **KEEP** | CONFIRMED | "May" = all three optional. Every module renderer must tolerate absence |
| **3.2.1** | A course is a collection of modules grouped around an engineering topic or learning objective | CAT, LRN | L, F, IA | Shared | UI | PM-09 | STU-03 course detail | **KEEP** | CONFIRMED | Structural, not commercial (D-21) |
| **3.2.2** | Courses define the sequence in which modules must be completed | LRN, PRG | L, F | Shared | UI | **PM-09** | STU-03 gated list | **KEEP** | CONFIRMED | D-07 enforcement approved by PM-09 |
| **3.3.1** | Certification programs consist of one or more courses in a structured learning pathway | CAT | — | Shared | — | **PM-12** | Hierarchy label only (A-12) | **DEFER** | **PM-DEFERRED** | ⚠ **FRD places this in Phase 1. PM moved it to Phase 2.** Recorded deviation |
| **3.3.2** | Students shall receive certification upon completing all required courses and meeting minimum assessment thresholds | CAT, PRG | — | Shared | — | **PM-12** | Deliberately not designed | **DEFER** | **PM-DEFERRED** | ⚠ **Same deviation.** Thresholds were never quantified anywhere in the FRD |

### Certification deviation — recorded explicitly

| | |
|---|---|
| **FRD position** | 3.3.1 and 3.3.2 are **Phase 1** as written |
| **PM position** | Certification is **Phase 2** (PM-12) |
| **Relationship** | 🔴 **DEVIATION** |
| **Action taken** | Recorded here and in `PM_CONFIRMED_BASELINE_2026-08-18.md` §F-1. **The FRD is not edited.** |
| **Design consequence** | **No Phase-1 certification screens** in any workspace. No certificate artefact, no issuance flow, no eligibility surface |
| **Working-set effect** | FRD Phase-1 count remains **78** as a document fact. The **Phase-1 design working set is 76 + 2 PM-deferred** |
| **Left open for Review 006+** | Whether the *structural* program node (3.3.1) is modelled in the content hierarchy even with no Phase-1 experience. **Not assumed either way** — see `11_OPEN_QUESTIONS_REFRAMED.md` |

---

# Section 4 — User Management & Onboarding (5 Phase-1 requirements)

| FRD | Requirement meaning | Domain | Roles | Market | Surface | PM impact | Current coverage | R005 reuse | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **4.1.1** | Users may create accounts using email registration | IAM | L | B2C | UI | PM-04 | AUTH-03 | **KEEP** | CONFIRMED | Self-registration is the B2C origin path |
| **4.1.2** | Users **may** register using supported social login providers | IAM | L | B2C | UI | PM-04 | AUTH-01/03 (sample providers, A-45) | **KEEP** | PRODUCT-PENDING | Providers never enumerated in the FRD |
| **4.2.1** | Institutions register their organization through the platform's institutional onboarding interface | IAM, TEN | IA, SA | B2B | UI | **PM-01** | ⚠ none — was OUT | **NEW** | FRD-CONFIRMED | Institutional onboarding was excluded purely by Student-only scope |
| **4.2.2** | Institutions shall be able to **configure** SSO through supported identity providers | IAM, TEN, CFG | **IA**, SA | B2B | UI | **PM-10** | Login path only (AUTH-01/02) | **MODIFY** | FRD-CONFIRMED | ⚠ The **configuration** surface has never been designed. Login ≠ configuration |
| **4.3.1** | Users provide profile details including academic institution, specialization, and learning preferences | IAM | L, F | Shared | UI | PM-01 | AUTH-07, STU-14 | KEEP+REFRAME | PRODUCT-PENDING | Q-11 field ownership open; Faculty profile never designed |

---

# Section 5 — Learning Experience Features (7 Phase-1 requirements)

| FRD | Requirement meaning | Domain | Roles | Market | Surface | PM impact | Current coverage | R005 reuse | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **5.1.1** | Faculty upload quiz question banks through structured spreadsheet templates | ASM | **F** | B2B | UI | **PM-08** | ⚠ none — was OUT | **NEW** | FRD-CONFIRMED | The authoring half of the assessment model |
| **5.1.2** | Faculty generate assessment questions using AI tools integrated into the platform | ASM | **F** | B2B | UI | **PM-08** | ⚠ none — excluded via `C-04` | **NEW** | **PRODUCT-PENDING** | ⚠ **Phase-1 requirement.** `C-04` excluded "AI assistant" citing FRD **5.5 (Phase 3)** — a different requirement. **Must be audited, not inherited as excluded** |
| **5.2.1** | System supports MCQ assessments | ASM | L, F | Shared | UI | PM-08 | STU-10 | **KEEP** | CONFIRMED | Single vs multi-select still open (Q-23) |
| **5.2.2** | System supports True/False questions | ASM | L, F | Shared | UI | PM-08 | STU-10 variant | **KEEP** | CONFIRMED | |
| **5.2.3** | System supports short descriptive answer questions | ASM | L, F | Shared | UI | PM-08 | STU-12 awaiting-evaluation | KEEP+REFRAME | **PRODUCT-PENDING** | No Phase-1 grading workflow exists. **Grading ownership must not be invented** |
| **5.3.1** | Quiz questions **may** be randomized for each attempt | ASM | F | Shared | FLOW | **PM-08** | Assumed on | **MODIFY** | FRD-CONFIRMED | "May" = a **configurable** flag, not a constant |
| **5.3.2** | Faculty shall be able to **enable** negative marking for incorrect responses | ASM | **F**, L | Shared | UI | **PM-08** | Fixed −1 in STU-09/10/12 | **SUPERSEDE as global rule** | FRD-CONFIRMED | The FRD makes this **Faculty-configurable**. Fixed −1 is sample configuration only |

### Assessment values — reclassified

The Review-005 values **10 MCQs · 20 minutes · +2 correct · +1 after hint · −1 incorrect · 10/20 pass · unlimited attempts · score floored at 0** are hereby **SAMPLE ASSESSMENT CONFIGURATION**, not platform constants (PM-08).

**The FRD states no question count, no duration, no score weighting, no pass mark, and no attempt limit anywhere.** Those values filled FRD silence; they were never FRD-derived. The *capabilities* they exercise — pre-attempt disclosure, hint-reduces-score, timed attempts, attempt history, correctness-without-key — remain valid as **things the configuration model must support**. See `08_ASSESSMENT_CONFIGURATION_MODEL.md`.

---

# Section 6 — Licensing & Monetization (4 Phase-1 requirements)

| FRD | Requirement meaning | Domain | Roles | Market | Surface | PM impact | Current coverage | R005 reuse | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **6.1.1** | Users may purchase individual simulation modules | COM, ENT | L, SA | B2C | UI | PM-04 | B2C-01/02/03 | **KEEP** | CONFIRMED | D-21: modules and bundles only |
| **6.1.2** | Users may purchase bundles of multiple modules | COM, ENT | L, SA | B2C | UI | PM-04 | B2C-01/02 | **KEEP** | CONFIRMED | A bundle is never sold as a course (D-21) |
| **6.2.1** | Institutions purchase packages mapped to academic streams | ENT, TEN | **IA**, SA | B2B | UI | **PM-01, PM-04** | Learner-side effect only | **MODIFY** | FRD-CONFIRMED | The institutional **purchasing/licence** surface has never been designed |
| **6.2.2** | Institutions may purchase capped licences based on maximum student count | ENT, TEN | **IA**, SA | B2B | UI | **PM-01** | STATE-01 cap-reached (Learner) | **MODIFY** | FRD-CONFIRMED | The Learner sees the wall; **IA must see the seat count before learners hit it** |

---

# Section 7 — Enterprise Integrations (5 Phase-1 requirements)

| FRD | Requirement meaning | Domain | Roles | Market | Surface | PM impact | Current coverage | R005 reuse | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **7.1.1** | Support integration with academic ERP systems including Oracle ERP, Moodle-based environments, and others via standardized API | ERP, INT | IA, SA | B2B | INT | PM-01 | Read-only Learner fields | **MODIFY** | TECHNICAL-PENDING | Provider and contract undetermined |
| **7.1.2** | Platform provides API endpoints for ERP systems to push enrollment data, course mappings, and academic structure | ERP, INT | IA, SA | B2B | INT | PM-01 | Implied only | **NEW** | TECHNICAL-PENDING | An **IA-visible integration status surface** is implied and undesigned |
| **7.1.2** ⟂ | *(surface consequence)* Institutional course structure arrives from ERP, not from in-platform authoring in Phase 1 | ERP, CAT | IA, F | B2B | FLOW | PM-01 | none | **NEW** | FRD-CONFIRMED | Resolves the 8.1.3 ⟷ 3.4.1 tension below |
| **7.2.1** | Scheduled ERP synchronization at configurable intervals updates student records and course assignments | ERP, CFG | **IA** | B2B | UI | PM-01 | STATE-02 (Learner effect) | **MODIFY** | FRD-CONFIRMED | *"configurable intervals"* implies an **IA configuration surface** — undesigned |
| **7.2.2** | Student accounts automatically created when records arrive from ERP synchronization | ERP, IAM | L, IA | B2B | FLOW | PM-01 | AUTH-01/02 first-login | **KEEP** | CONFIRMED | Different origin path from 4.1.1, not a contradiction |
| **7.2.3** | Students automatically assigned simulation packages based on ERP academic stream | ERP, ENT | L, IA | B2B | FLOW | PM-01 | STU-02, STATE-01 | KEEP+REFRAME | CONFIRMED | IA needs stream→package mapping visibility |

> **Row `7.1.2 ⟂`** is a derived surface consequence recorded against its parent requirement, not an invented requirement. It carries no independent FRD number and is **not counted** in the 78.

---

# Section 8 — Administration & Role Management (5 Phase-1 requirements)

| FRD | Requirement meaning | Domain | Roles | Market | Surface | PM impact | Current coverage | R005 reuse | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **8.1.1** | **Super Admin** — full control over platform configuration, module publishing, licensing management, and cross-tenant analytics | CFG, GOV, ENT, RPT | **SA** | Shared | UI | **PM-01, PM-11** | ⚠ none — was OUT | **NEW** | FRD-CONFIRMED | Four distinct capability areas. Analytics is **operational only** in Phase 1 per PM-11 |
| **8.1.2** | **Content Manager** — manage module uploads, metadata updates, and content readiness for publishing | GOV, CAT | **CM** | Shared | UI | **PM-01** | ⚠ none — was OUT | **NEW** | FRD-CONFIRMED | Aligns exactly with 1.4.3 |
| **8.1.3** | **Institute Admin** — manage institutional configuration including course structures, student access, and institutional reporting | TEN, IAM, CAT, RPT | **IA** | B2B | UI | **PM-01, PM-11** | ⚠ none — was OUT | **NEW** | FRD-CONFIRMED | ⚠ Phase tension — see below |
| **8.1.4** | **Faculty** — manage course assignments, assessments, and student performance monitoring | LRN, ASM, RPT | **F** | B2B | UI | **PM-01, PM-08, PM-11** | ⚠ none — was OUT | **NEW** | FRD-CONFIRMED | ⚠ Phase tension — see below |
| **8.1.5** | **Student** — access licensed modules, complete simulations, view personal learning progress | LRN, XRD, PRG | **L** | Shared | UI | PM-01, PM-09 | 29 screens, fully designed | **KEEP+REFRAME** | CONFIRMED | Reclassified from *the product* to *one workspace* |

### Two FRD phase tensions detected in Section 8

Both are **new findings from this re-audit** — they were invisible under Student-only scope because neither role was in scope.

| # | Tension | Detail | Working resolution |
|---|---|---|---|
| **T-1** | **8.1.3 (Phase 1) vs 3.4.1 / 3.4.2 (Phase 2)** | 8.1.3 puts *"course structures"* in the **Phase-1** Institute Admin role definition. But **3.4.1 Institutional Course Creation** and **3.4.2 Course Module Mapping** — the requirements that would let an IA build a course — are **Phase 2**. | In Phase 1, institutional course structure arrives via **ERP** (7.1.2, 7.2.1, 7.2.3), and IA **views, maps, and assigns** rather than **authors**. In-platform course creation stays Phase 2. Recorded as an open question, not silently settled |
| **T-2** | **8.1.4 (Phase 1) vs 11.3.1 (Phase 2)** | 8.1.4 puts *"student performance monitoring"* in the **Phase-1** Faculty role definition. But **11.3.1 Class-Level Performance Reports** is **Phase 2**. | Per **PM-11**, Phase-1 Faculty gets **operational learner status** (who has completed what, who is blocked, attempt state) — **not** aggregated analytics reports. Detailed metrics remain pending |

Neither tension is invented and neither is resolved by fiat. Both are carried into `11_OPEN_QUESTIONS_REFRAMED.md`.

---

# Section 9 — Payment & Billing (4 Phase-1 requirements)

| FRD | Requirement meaning | Domain | Roles | Market | Surface | PM impact | Current coverage | R005 reuse | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **9.1.1** | Support integration with major Indian payment gateways for domestic transactions | COM, INT | L | B2C | INT | PM-04 | B2C-03 → B2C-04 redirect | **KEEP** | TECHNICAL-PENDING | Gateway not chosen (`C-05`) |
| **9.1.2** | Support international payment gateways for global purchases by individual learners | COM, INT | L | B2C | INT | PM-04 | Same surface | **KEEP** | PRODUCT-PENDING | Currency/tax presentation open (Q-35) |
| **9.2.1** | Upon successful payment, licences activate automatically and link to the user account | ENT, COM | L, SA | B2C | FLOW | PM-04 | B2C-05 success | **KEEP** | CONFIRMED | |
| **9.2.2** | Purchased modules or packages automatically assigned to the user's dashboard | ENT | L | B2C | FLOW | PM-04 | B2C-05 → STU-02 | **KEEP** | CONFIRMED | Fulfilled by My Learning |

---

# Section 10 — Security & Compliance (6 Phase-1 requirements)

| FRD | Requirement meaning | Domain | Roles | Market | Surface | PM impact | Current coverage | R005 reuse | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **10.1.1** | All XR simulation asset bundles encrypted before distribution | SEC, XRD | — | Shared | SYS | PM-05 | Constraint honoured | KEEP | FRD-CONFIRMED | Reinforces no download/export affordances |
| **10.1.2** | Modules require licence validation **before execution** within the XR application | SEC, ENT, XRD | L | Shared | FLOW | **PM-05** | STATE-01 launch gate | KEEP+REFRAME | FRD-CONFIRMED | Second entitlement gate — at execution, not only at browse |
| **10.2.1** | Platform enforces secure authentication protocols before granting access | SEC, IAM | all | Shared | UI | PM-10 | AUTH-01 | KEEP+REFRAME | PRODUCT-PENDING | Applies to all seven workspaces now. Password policy/MFA/lockout absent from the FRD |
| **10.2.2** | User sessions automatically expire after inactivity | SEC, IAM | all | Shared | FLOW | PM-01 | AUTH-06 (Learner) | KEEP+REFRAME | CONFIRMED | D-17 protection must extend to admin workspaces with unsaved configuration |
| **10.3.1** | Platform undergoes periodic VAPT | SEC | — | Shared | SYS | — | none | N/A | FRD-CONFIRMED | No UI |
| **10.3.2** | Identified vulnerabilities addressed through timely security patches | SEC | — | Shared | SYS | — | none | N/A | FRD-CONFIRMED | No UI |

---

# Section 11 — Analytics & Reporting (4 Phase-1 requirements)

**All four are *recording* requirements.** None is a dashboard requirement. Dashboards live in **8.2 (Phase 2)**, **11.3 (Phase 2)**, and **11.4 (Phase 3)**. PM-11 therefore **agrees with the FRD's own phasing**.

| FRD | Requirement meaning | Domain | Roles | Market | Surface | PM impact | Current coverage | R005 reuse | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **11.1.1** | System records module completion status for each learner | PRG | L, F, IA | Shared | FLOW | PM-09, PM-11 | STU-04 checklist, STU-03, STU-13 | **KEEP** | CONFIRMED | D-08 defines the trigger |
| **11.1.2** | Platform tracks time spent by students interacting with simulations | PRG | L, F, IA | Shared | FLOW | PM-11 | Course-level only (A-28R) | KEEP+REFRAME | PRODUCT-PENDING | Faculty/IA visibility bounded by 1.3.4 |
| **11.2.1** | Assessment scores stored and associated with the learner's academic profile | PRG, ASM | L, F | Shared | FLOW | PM-08, PM-11 | STU-12, STU-13 | KEEP+REFRAME | CONFIRMED | Score **shape** now depends on assessment configuration |
| **11.2.2** | System records the number of attempts for each simulation or assessment | PRG, ASM | L, F | Shared | FLOW | PM-08 | STU-09/12/13 history | **KEEP** | CONFIRMED | Counting ≠ limiting; limits are configuration |

---

# Section 12 — Platform Infrastructure & Hosting (3 Phase-1 requirements)

| FRD | Requirement meaning | Domain | Roles | Market | Surface | PM impact | Current coverage | R005 reuse | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **12.1.1** | Platform deployed on cloud infrastructure such as AWS, Azure, or Google Cloud | CFG | — | Shared | SYS | — | none | N/A | TECHNICAL-PENDING | Stack not selected |
| **12.1.2** | XR asset bundles stored in encrypted cloud storage | SEC, XRD | — | Shared | SYS | — | none | N/A | FRD-CONFIRMED | |
| **12.2.1** | Simulation assets delivered through a CDN to reduce download latency | XRD | L | Shared | FLOW | PM-05 | STU-08 determinate loading | **KEEP** | CONFIRMED | Latency is Learner-visible; also relevant to device download states |

---

# Roll-up

## Phase-1 requirements by owning workspace

A requirement may name more than one role. This table counts each requirement once against **every** workspace that needs a surface or a decision for it, so the column sums to more than 78 by design. Rows whose Roles cell is `all` (1.1.1, 10.2.1, 10.2.2) count toward every workspace; row 2.4.2 (`L → SA`) counts toward both.

| Workspace | Phase-1 requirements touching it |
|---|---|
| Learner (L) | 43 |
| Super Admin (SA) | 29 |
| Institute Admin (IA) | 26 |
| Faculty (F) | 22 |
| Content Manager (CM) | 9 |
| Vendor (V) | 6 |
| Academic Reviewer (AR) | 4 |
| **No role-facing surface** (system / infrastructure / PM-deferred) | **10** |

**Reading these numbers correctly.** A low count does not mean a small workspace. **Academic Reviewer touches four requirements, one of which (1.4.2) gates every module on the platform** — it is low-volume and high-authority. Conversely, most of the Learner's 43 are consumption surfaces that already exist.

The ten with no role-facing surface: 1.3.3 · 2.2.1 · 2.3.3 · 10.1.1 · 10.3.1 · 10.3.2 · 12.1.1 · 12.1.2 (system/infrastructure), plus **3.3.1 · 3.3.2** (PM-deferred certification).

## Phase-1 requirements by surface type

| Surface | Count |
|---|---|
| `UI` — needs a screen or screen region | 38 |
| `FLOW` — cross-screen flow or state | 20 |
| `SYS` — system behaviour, no role-facing surface | 14 |
| `INT` — external integration contract | 4 |
| `—` — no Phase-1 surface (PM-deferred certification) | 2 |
| **Total** | **78** |

## Phase-1 requirements by status

| Status | Count |
|---|---|
| `FRD-CONFIRMED` | 33 |
| `CONFIRMED` (settled by a surviving Review-005 decision) | 19 |
| `TECHNICAL-PENDING` | 13 |
| `PRODUCT-PENDING` | 9 |
| `PM-CLARIFIED` | 2 |
| `PM-DEFERRED` | 2 |
| **Total** | **78** |

**52 of 78 (67%) are settled** — `FRD-CONFIRMED` or `CONFIRMED`. **22 carry a pending answer**, split 13 technical / 9 product. None of the 22 blocks platform IA; see `11_OPEN_QUESTIONS_REFRAMED.md`.

## Review-005 reuse disposition across the 78

| Disposition | Count |
|---|---|
| `KEEP` | 22 |
| `KEEP+REFRAME` | 14 |
| `MODIFY` | 14 |
| `NEW` (nothing exists) | 18 |
| `SUPERSEDE` (as a global rule) | 1 |
| `DEFER` | 2 |
| `N/A` (no design artefact applies) | 7 |
| **Total** | **78** |

**50 of 78 reuse Review-005 work** in some form (`KEEP` + `KEEP+REFRAME` + `MODIFY`). Only **1** requirement-level rule is superseded outright, and **2** are deferred. The reframe is overwhelmingly additive.

---

# Requirements with **no** designed surface anywhere today

Eighteen Phase-1 requirements are marked `NEW`. Nothing in Reviews 001–005 addresses them, because every one belongs to a workspace that did not exist in scope.

| FRD | What is missing | Workspace |
|---|---|---|
| 1.3.5 | Cross-tenant governance access | SA |
| 1.4.1 | Vendor build/asset submission | **V** |
| 1.4.2 | Academic validation decision | **AR** |
| 1.4.3 | Content Manager approval review | CM |
| 1.4.4 | Production publishing | SA |
| 1.4.5 | Enforced no-direct-publish constraint | V / SA |
| 2.3.1 | *Update available* state for a delivered module | L |
| 2.3.2 | Version release control | SA |
| 2.4.1 | B2C device binding visibility | L |
| 2.4.2 | Device replacement request → approval | **L + SA** |
| 4.2.1 | Institutional onboarding | IA / SA |
| 5.1.1 | Question bank upload | F |
| 5.1.2 | AI question generation | F |
| 7.1.2 | ERP API integration status | IA |
| 8.1.1 | Super Admin workspace | SA |
| 8.1.2 | Content Manager workspace | CM |
| 8.1.3 | Institute Admin workspace | IA |
| 8.1.4 | Faculty workspace | F |

**Six of the eighteen are content governance** (1.4.1 – 1.4.5, 2.3.2) — the single largest undesigned area, and the reason `05_END_TO_END_WORKFLOWS.md` FLOW 1 is treated as the highest-priority new flow.

---

# Deviations and tensions recorded by this inventory

| # | Item | Type | Where recorded |
|---|---|---|---|
| **D-1** | Certification (3.3.1, 3.3.2) moved Phase 1 → Phase 2 | 🔴 PM deviation from FRD | §Section 3, above · baseline §F-1 |
| **D-2** | Vendor and Academic Reviewer promoted to roles beyond FRD 8.1's five | 🟠 PM extension of FRD | §Section 1 (1.4.1, 1.4.2) · baseline §F-2 |
| **T-1** | 8.1.3 Phase-1 course structures vs 3.4.1/3.4.2 Phase-2 course creation | 🟡 FRD internal phase tension | §Section 8 |
| **T-2** | 8.1.4 Phase-1 performance monitoring vs 11.3.1 Phase-2 reports | 🟡 FRD internal phase tension | §Section 8 |
| **G-1** | No AR application architecture in FRD Section 2 | 🟡 FRD gap | §Section 1 (1.2.4) · `07_XR_DELIVERY_MODEL.md` |
| **G-2** | FRD 5.1.2 AI question generation is Phase 1; `C-04` excluded it citing Phase-3 FRD 5.5 | 🟡 Scope catch | §Section 5 |
| **G-3** | 2.4.1 / 2.4.2 device binding and replacement have no surface in any workspace | 🟡 FRD gap | §Section 2 |
| **G-4** | Vendor and Academic Reviewer are unplaced in the tenancy model (1.3.1, 1.3.2, 1.3.5) | 🟡 FRD gap | §Section 1 · `02_ROLE_PERMISSION_MATRIX.md` |
| **R-1** | SSO phase contradiction (4.2.2 Phase 1 vs 7.4.1 Phase 3) | ✅ Resolved by PM-10 | §Section 4 |

**The FRD is not edited by any of the above.**
