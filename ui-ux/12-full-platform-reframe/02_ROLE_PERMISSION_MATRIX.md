# 02 — Role / Permission Matrix

**Review:** 006 — Full Platform Reframe
**Created:** 2026-08-18
**Authority:** PM-confirmed baseline → FRD → compatible Review-005 decisions
**Companion:** `01_PHASE1_FEATURE_INVENTORY.md` · `03_SHARED_CAPABILITY_MAP.md`

---

## Governing rule for this document

> **Every permission below is derived from explicit FRD text or an explicit PM statement.**
> Where neither source defines a permission, the cell reads **`?`** (PENDING) — **never a plausible guess.**

A `?` is a finding, not a blank. Each one is carried into `11_OPEN_QUESTIONS_REFRAMED.md`.

---

## The seven roles

| Code | Role | FRD basis | Plane |
|---|---|---|---|
| **L** | Student / Learner | 8.1.5 | Tenant (B2B) or personal (B2C) |
| **F** | Faculty | 8.1.4 | Tenant |
| **IA** | Institute Admin | 8.1.3 | Tenant |
| **CM** | Content Manager | 8.1.2 | Central content |
| **SA** | Super Admin | 8.1.1, 1.3.5 | Platform-wide (cross-tenant) |
| **V** | Vendor | 1.4.1, 1.4.5 — **actor only in FRD**; role confirmed by **PM-07** | Central content (own submissions) |
| **AR** | Academic Reviewer | 1.4.2 — **actor only in FRD**; role confirmed by **PM-07** | Central content |

**B2C Individual Learner** is the Learner role operating in the personal (non-institutional) context — **not an eighth role**.

**External systems are integrations, not roles.** ERP (7.1.1), identity providers (4.2.2), payment gateways (9.1.1/9.1.2), and the Meta Quest Store (2.1.1) appear in the matrix only as the systems a permission acts through.

---

## Permission verbs

| Code | Verb | Meaning |
|---|---|---|
| `V` | **VIEW** | Can see the object or its state |
| `C` | **CREATE** | Can bring a new object into existence |
| `E` | **EDIT** | Can change an existing object |
| `A` | **ASSIGN** | Can attach an object to a person, cohort, stream, or device |
| `R` | **REVIEW** | Can formally examine and record findings, without deciding release |
| `Ap` | **APPROVE** | Can record a gate decision that advances an object |
| `Pb` | **PUBLISH** | Can release an object to production |
| `M` | **MANAGE** | Full lifecycle control including removal |
| `Pu` | **PURCHASE** | Can execute a commercial transaction |
| `Cf` | **CONFIGURE** | Can set parameters, rules, or integration settings |
| `Rp` | **REPORT** | Can read aggregated or operational status |
| `—` | none | No permission |
| **`?`** | **PENDING** | **Not defined by the FRD or the PM. Must not be invented** |

**Scope suffixes** — `⁰` own only · `ᵗ` own tenant only · `ˣ` cross-tenant

---

# A · Identity & Access

| # | Capability | FRD | L | F | IA | CM | SA | V | AR | Tenant scope |
|---|---|---|---|---|---|---|---|---|---|---|
| A1 | Own profile | 4.3.1 | `V⁰ E⁰` | `V⁰ E⁰` | `V⁰ E⁰` | `V⁰ E⁰` | `V⁰ E⁰` | `V⁰ E⁰` | `V⁰ E⁰` | Self |
| A2 | Authenticate to the platform | 10.2.1 | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | All |
| A3 | Institutional SSO configuration | **4.2.2** | — | — | **`V Cf`ᵗ** | — | `V Cf`ˣ | — | — | Tenant |
| A4 | Institutional onboarding (register the organisation) | **4.2.1** | — | — | `V E`ᵗ | — | `C M`ˣ | — | — | Tenant |
| A5 | Institutional user accounts (students) | 8.1.3, 7.2.2 | — | `V`ᵗ | **`V M A`ᵗ** | — | `V M`ˣ | — | — | Tenant |
| A6 | Institutional user accounts (faculty) | 8.1.3 | — | — | **`?`** | — | `V M`ˣ | — | — | Tenant |
| A7 | Platform role assignment (CM / SA / V / AR) | 8.1.1 | — | — | — | — | **`M A`ˣ** | — | — | Platform |
| A8 | Session & password policy | 10.2.1, 10.2.2 | — | — | `?` | — | `Cf`ˣ | — | — | Platform |

**A6 — why PENDING.** FRD 8.1.3 gives the Institute Admin *"student access"* explicitly and says nothing about faculty account creation. FRD 1.1.2 confirms faculty exist under the institutional subscription but names no provisioning owner. ERP provisioning (7.2.2) speaks only of *student* records. **Who creates a Faculty account is genuinely undefined.**

**A8 — why partly PENDING.** The FRD mandates secure authentication (10.2.1) and inactivity expiry (10.2.2) but defines **no** password policy, MFA, lockout, or reset — and never states whether expiry duration is per-tenant configurable.

---

# B · Tenancy & Cross-Tenant Governance

| # | Capability | FRD | L | F | IA | CM | SA | V | AR | Tenant scope |
|---|---|---|---|---|---|---|---|---|---|---|
| B1 | Operate within own tenant | 1.3.1 | ✔ᵗ | ✔ᵗ | ✔ᵗ | n/a | ✔ˣ | n/a | n/a | Tenant |
| B2 | Cross-tenant governance access | **1.3.5** | — | — | — | **`?`** | **`V M`ˣ** | — | **`?`** | Platform |
| B3 | B2C data environment | 1.3.2 | ✔⁰ | — | — | — | `V M`ˣ | — | — | Separate |
| B4 | Tenant-scoped analytics boundary | **1.3.4** | ✔⁰ | ✔ᵗ | ✔ᵗ | — | ✔ˣ | — | — | Enforced everywhere |

### B2 is the most important unresolved item in this matrix

FRD **1.3.5 names only the Super Admin** as holding controlled cross-tenant access. FRD 1.3.1 and 1.3.2 isolate institutional and B2C data. **Content Manager, Vendor, and Academic Reviewer are given no position in that model at all** — yet PM-07 requires all three to have working logins, and their work (module submission, academic validation, readiness approval) is inherently **not tenant-scoped**.

**Working position — requires confirmation, not adopted as fact:**

> The platform has **two planes**. A **central content plane** where modules are submitted, validated, approved, and published (FRD 1.4.x, 1.1.4 — all modules owned centrally by the platform owner), and **tenant planes** holding institutional user, licensing, and analytics data (FRD 1.3.1). Vendor, Academic Reviewer, and Content Manager operate **only on the central content plane** and therefore never need tenant access at all. Super Admin spans both.

This reading is consistent with every FRD sentence and invents nothing — but the FRD never states it. **It is recorded as a design hypothesis and escalated as a question.** Until confirmed, B2 stays `?` for CM, V, and AR.

---

# C · Content & Catalogue

| # | Capability | FRD | L | F | IA | CM | SA | V | AR | Tenant scope |
|---|---|---|---|---|---|---|---|---|---|---|
| C1 | Published module catalogue | 1.4.4 | `V`⁰ | `V`ᵗ | `V`ᵗ | `V`ˣ | `V M`ˣ | `V⁰` | `V`ˣ | Central |
| C2 | Module metadata | **1.4.3**, 8.1.2 | `V` | `V` | `V` | **`V E M`** | `V M` | `C E⁰` | `V` | Central |
| C3 | Module builds & assets | 1.4.1, 1.1.4 | — | — | — | `V R` | `V M` | **`C E⁰`** | `V R` | Central |
| C4 | Course structure | 3.2.1, 8.1.3 | `V` | `V A`ᵗ | **`V A`ᵗ** | — | `V`ˣ | — | — | Tenant |
| C5 | **Create** a course in-platform | **3.4.1 — Phase 2** | — | — | **⛔ Phase 2** | — | ⛔ Phase 2 | — | — | — |
| C6 | Certification program structure | **3.3.1** | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | **PM-DEFERRED → Phase 2** |
| C7 | Content ownership constraint — no modification or redistribution by institutions | **1.1.4** | — | — | **⛔ prohibited** | — | — | — | — | Central |

**C4 vs C5 — tension T-1 from the inventory.** FRD 8.1.3 puts *"course structures"* in the **Phase-1** Institute Admin role, but the requirements that let an IA **author** a course (3.4.1 Institutional Course Creation, 3.4.2 Course Module Mapping) are **Phase 2**. In Phase 1 the IA therefore **views, maps, and assigns** structure that arrives from **ERP** (7.1.2, 7.2.1, 7.2.3) — it does not create courses in the platform. This is the narrowest reading that satisfies both requirements without inventing authoring tools. Carried as an open question.

---

# D · Content Governance — the publishing chain

This is the FRD's most explicit permission sequence and the platform's most rigid authority boundary.

| # | Capability | FRD | L | F | IA | CM | SA | V | AR | Gate |
|---|---|---|---|---|---|---|---|---|---|---|
| D1 | Submit module build + assets to staging | **1.4.1** | — | — | — | `V` | `V` | **`C`** | — | ① |
| D2 | Academic validation against curriculum standards | **1.4.2** | — | — | — | `V` | `V` | `V⁰` | **`R Ap`** | ② |
| D3 | Metadata / documentation / compatibility review | **1.4.3** | — | — | — | **`R Ap`** | `V` | `V⁰` | — | ③ |
| D4 | Publish to production | **1.4.4** | — | — | — | — | **`Pb`** | **⛔** | — | ④ |
| D5 | Direct vendor publishing | **1.4.5** | — | — | — | — | — | **⛔ explicitly prohibited** | — | — |
| D6 | Version release control to production | **2.3.2** | — | — | — | `?` | **`Cf Pb`** | — | — | — |
| D7 | Reject / return a submission with feedback | *not in FRD* | — | — | — | **`?`** | `?` | — | **`?`** | — |

### D7 — a real gap

The FRD describes a **forward-only** chain: submit → validate → approve → publish. **It never describes rejection, revision, or resubmission.** Yet a review gate with no reject path is not a gate. Vendor, Academic Reviewer, and Content Manager all plausibly need to return work — but no FRD text authorises it and no PM statement covers it.

**This must not be invented.** `07`/`05` show the chain forward; the return path is drawn as a **known-missing edge**, not a designed one.

### The chain as a permission ladder

```
V submits ──▶ AR validates ──▶ CM approves ──▶ SA publishes ──▶ live
   ①              ②                 ③              ④
   │              │                 │              │
   C            R Ap              R Ap             Pb
   │              │                 │              │
   └── can never publish (1.4.5) ───┴──────────────┘
                  AR cannot publish · CM cannot publish
                  Only SA holds Pb (1.4.4)
```

**Three distinct approvals, three distinct roles, one publisher.** No role holds two adjacent gates. This is the single strongest permission statement in the FRD and the design must not soften it.

---

# E · Learning

| # | Capability | FRD | L | F | IA | CM | SA | V | AR | Tenant scope |
|---|---|---|---|---|---|---|---|---|---|---|
| E1 | Consume entitled learning content | **8.1.5** | **`V`⁰** | `V`ᵗ | `V`ᵗ | `V`ˣ | `V`ˣ | — | `V`ˣ | Entitlement-bound |
| E2 | Learning resources — PDF, video | 3.1.2 | `V⁰` | `V`ᵗ | `V`ᵗ | `V E`ˣ | `V`ˣ | `C⁰` | `V`ˣ | Central |
| E3 | Assign course / module to learners or cohorts | **8.1.4**, 7.2.3 | — | **`A`ᵗ** | **`A`ᵗ** | — | `A`ˣ | — | — | Tenant |
| E4 | Module sequencing / prerequisite behaviour | 3.2.2 | `V⁰` | `V`ᵗ | `V`ᵗ | — | `V`ˣ | — | — | Tenant |
| E5 | Configure sequencing rules per course | *not in FRD* | — | `?` | `?` | — | `?` | — | — | — |

**E5 — PENDING.** PM-09 approves the **current** progression model (resources → simulation → assessment → completion). It does **not** say whether that sequence is a platform constant or a per-course setting a Faculty member can change. **Do not assume configurable; do not assume fixed.**

---

# F · Assessments

| # | Capability | FRD | L | F | IA | CM | SA | V | AR | Tenant scope |
|---|---|---|---|---|---|---|---|---|---|---|
| F1 | Question bank upload (spreadsheet template) | **5.1.1** | — | **`C E M`ᵗ** | `?` | — | `V`ˣ | — | — | Tenant |
| F2 | AI-assisted question generation | **5.1.2** | — | **`C`ᵗ** | — | — | `V`ˣ | — | — | Tenant |
| F3 | Assessment configuration — types, rules, parameters | **PM-08**, 5.2.x, 5.3.x | — | **`C E Cf`ᵗ** | `?` | — | `V Cf`ˣ | — | — | Tenant |
| F4 | Enable negative marking | **5.3.2** | — | **`Cf`ᵗ** | — | — | `V`ˣ | — | — | Tenant |
| F5 | Enable question randomization | **5.3.1** | — | **`Cf`ᵗ** | — | — | `V`ˣ | — | — | Tenant |
| F6 | Publish / assign an assessment to learners | 8.1.4 | — | **`A`ᵗ** | `?` | — | `V`ˣ | — | — | Tenant |
| F7 | Attempt an assessment | 5.2.x | **`C⁰`** | — | — | — | — | — | — | Self |
| F8 | View own result and attempt history | 11.2.1, 11.2.2 | **`V⁰`** | — | — | — | — | — | — | Self |
| F9 | View learner results | 8.1.4, 11.2.1 | — | **`V`ᵗ** | `V`ᵗ | — | `V`ˣ | — | — | Tenant |
| F10 | Grade descriptive answers | **5.2.3** | — | **`?`** | — | — | `?` | — | — | **Owner undefined** |
| F11 | See the correct-answer key | **D-25** | **⛔ never** | `V`ᵗ | `?` | — | `?` | — | — | Prohibition |

**F10 — grading ownership must not be invented.** FRD 5.2.3 permits short descriptive answers. **No Phase-1 requirement anywhere defines who grades them, on what turnaround, or against what rubric.** Faculty is the *plausible* owner (8.1.4 names assessments) but the FRD does not say so. This is compounded because sequencing (3.2.2, PM-09) gates the next module on completion — an ungraded assessment can strand a learner.

**F11 — a prohibition, not an omission.** Review-005 `D-25` established that a learner sees per-question **correctness** but never the answer. Under configurable attempts (PM-08) this becomes stronger, not weaker: if a configuration permits unlimited attempts, exposing the key turns retry into memorisation. Whether **Institute Admin** or **Super Admin** may see keys is undefined and left `?` rather than assumed.

---

# G · XR Delivery & Devices

| # | Capability | FRD / PM | L | F | IA | CM | SA | V | AR | Tenant scope |
|---|---|---|---|---|---|---|---|---|---|---|
| G1 | Launch a web simulation | 1.2.1 | **`V⁰`** | `V`ᵗ | — | `V`ˣ | `V`ˣ | — | `V`ˣ | Entitlement-bound |
| G2 | Access entitled VR / MR / AR simulation on a supported device | 1.2.2–1.2.4, **PM-05** | **`V⁰`** | `V`ᵗ | — | — | `V`ˣ | — | `V`ˣ | Entitlement-bound |
| G3 | Entitlement-aware delivery of an experiment to a device | **2.2.2, 10.1.2, PM-05** | `V⁰` | — | `?` | — | `V M`ˣ | — | — | **Mechanism pending** |
| G4 | Personal device binding (B2C) | **2.4.1** | **`V⁰`** | — | — | — | `V M`ˣ | — | — | Personal |
| G5 | Request device replacement | **2.4.2** | **`C⁰`** | — | — | — | — | — | — | Personal |
| G6 | Approve device replacement / licence transfer | **2.4.2** | — | — | — | — | **`Ap`ˣ** | — | — | Platform |
| G7 | Shared institutional device access | 2.4.3 | `V⁰` | — | `V`ᵗ | — | `V`ˣ | — | — | Tenant |
| G8 | Sideloaded MR application deployment | 2.1.2 | — | — | **`?`** | — | `?` | — | — | Tenant |
| G9 | Register / manage XR devices | **2.5.x — Phase 2** | — | — | **⛔ Phase 2** | — | ⛔ Phase 2 | — | — | — |
| G10 | Remote enable/disable of modules on devices | **2.6.x — Phase 2** | — | — | ⛔ Phase 2 | — | ⛔ Phase 2 | — | — | — |

**G5 + G6 is the platform's only Phase-1 two-role, cross-plane approval workflow outside content governance** — a Learner in the B2C plane requesting an action only a platform-wide Super Admin can grant. Neither end exists today.

**G8 — PENDING.** Sideloading (2.1.2) is administratively gated by definition; the FRD never says who performs or authorises it.

**G9/G10 are Phase 2 and must not appear in Phase-1 admin workspaces.** This is the clearest boundary preventing IA device-management screens from being over-built.

---

# H · Licensing & Entitlements

| # | Capability | FRD | L | F | IA | CM | SA | V | AR | Tenant scope |
|---|---|---|---|---|---|---|---|---|---|---|
| H1 | Hold and view personal entitlements | 6.1.1, 7.2.3, 9.2.2 | **`V⁰`** | — | `V`ᵗ | — | `V`ˣ | — | — | Self / tenant |
| H2 | Institutional stream-based licence | **6.2.1** | — | — | **`V`ᵗ `Pu?`** | — | `V M`ˣ | — | — | Tenant |
| H3 | Capped licence — seat count and utilisation | **6.2.2** | — | — | **`V`ᵗ** | — | `V M`ˣ | — | — | Tenant |
| H4 | Stream → package mapping | 7.2.3, 6.2.1 | — | `V`ᵗ | **`V A`ᵗ** | — | `V M`ˣ | — | — | Tenant |
| H5 | Grant / revoke a learner entitlement | 8.1.3 | — | `?` | **`A`ᵗ** | — | `M`ˣ | — | — | Tenant |
| H6 | Licence validation at access and at execution | 2.2.2, 10.1.2 | — | — | — | — | `V`ˣ | — | — | System-enforced |
| H7 | Licence activation on payment | 9.2.1 | — | — | — | — | `V`ˣ | — | — | System-enforced |
| H8 | Licence / access duration values | **D-24** | `V⁰` | — | `V`ᵗ | — | `M`ˣ | — | — | Data-driven, never invented |

**H2 `Pu?` — genuinely ambiguous.** FRD 6.2.1 says *"Institutions **shall purchase** packages mapped to academic streams"*, which implies an institutional purchase. But every institutional **billing** requirement — GST invoicing (9.3.1) and subscription billing (9.3.2) — is **Phase 2**. So Phase 1 requires institutional licences to *exist* without defining how they are transacted in-platform. **Whether an IA executes a purchase in Phase 1, or licences are provisioned by Super Admin after an offline commercial agreement, is undefined.**

---

# I · Commerce & Payments (B2C)

| # | Capability | FRD | L | F | IA | CM | SA | V | AR | Tenant scope |
|---|---|---|---|---|---|---|---|---|---|---|
| I1 | Browse the B2C catalogue | 1.1.3, 6.1.1 | **`V⁰`** | — | — | — | `V`ˣ | — | — | B2C |
| I2 | Purchase an individual module | **6.1.1** | **`Pu⁰`** | — | — | — | — | — | — | B2C |
| I3 | Purchase a bundle | **6.1.2** | **`Pu⁰`** | — | — | — | — | — | — | B2C |
| I4 | Purchase a **course** | **D-21** | **⛔ not a product** | — | — | — | — | — | — | Prohibition |
| I5 | Execute payment via gateway | 9.1.1, 9.1.2 | `Pu⁰` | — | — | — | `V`ˣ | — | — | B2C |
| I6 | Bundle creation | **6.3.1 — Phase 2** | — | — | — | — | ⛔ Phase 2 | — | — | — |
| I7 | Pricing configuration | **6.3.2 — Phase 2** | — | — | — | — | ⛔ Phase 2 | — | — | — |
| I8 | Coupons | **6.4.x — Phase 2** | ⛔ | — | — | — | ⛔ Phase 2 | — | — | — |

**I6/I7 create a real Phase-1 question.** B2C purchase of modules and bundles is **Phase 1** (6.1.1, 6.1.2), but bundle **creation** and pricing **configuration** are **Phase 2** (6.3.1, 6.3.2). Phase 1 therefore sells bundles that no Phase-1 requirement lets anyone create. Recorded as a question; **no Phase-1 bundle-authoring screen is invented.**

---

# J · ERP & Enterprise Integration

| # | Capability | FRD | L | F | IA | CM | SA | V | AR | Tenant scope |
|---|---|---|---|---|---|---|---|---|---|---|
| J1 | ERP integration configuration | **7.1.1, 7.1.2** | — | — | **`V Cf`ᵗ** | — | `V Cf`ˣ | — | — | Tenant |
| J2 | Scheduled sync interval configuration | **7.2.1** | — | — | **`Cf`ᵗ** | — | `V`ˣ | — | — | Tenant |
| J3 | Sync status / last-run visibility | 7.2.1 | — | `?` | **`V Rp`ᵗ** | — | `V`ˣ | — | — | Tenant |
| J4 | ERP-provisioned account creation | 7.2.2 | — | — | `V`ᵗ | — | `V`ˣ | — | — | System-driven |
| J5 | ERP-derived stream assignment | 7.2.3 | `V⁰` | `V`ᵗ | `V`ᵗ | — | `V`ˣ | — | — | Tenant |
| J6 | Override an ERP-sourced field | 7.1.1 vs 4.3.1 | **`?`** | — | **`?`** | — | `?` | — | — | **Conflict risk** |

**J6 — the sync-authority problem.** ERP is authoritative (7.1.1) and sync runs on a schedule (7.2.1), so any local edit can be silently overwritten. FRD 4.3.1 nonetheless has users *providing* profile details. **Which fields are user-editable versus ERP-owned is undefined** — and it now applies to Faculty profiles too, not just learners.

---

# K · Progress

| # | Capability | FRD | L | F | IA | CM | SA | V | AR | Tenant scope |
|---|---|---|---|---|---|---|---|---|---|---|
| K1 | View own progress | **8.1.5**, 11.1.1 | **`V⁰`** | — | — | — | — | — | — | Self |
| K2 | Module completion status | 11.1.1 | `V⁰` | `V`ᵗ | `V`ᵗ | — | `V`ˣ | — | — | Tenant-bounded |
| K3 | Time spent | 11.1.2 | `V⁰` | `V`ᵗ | `V`ᵗ | — | `V`ˣ | — | — | Tenant-bounded |
| K4 | Assessment scores | 11.2.1 | `V⁰` | `V`ᵗ | `V`ᵗ | — | `V`ˣ | — | — | Tenant-bounded |
| K5 | Attempt counts | 11.2.2 | `V⁰` | `V`ᵗ | `V`ᵗ | — | `V`ˣ | — | — | Tenant-bounded |
| K6 | Simulation completion recorded to the account | **D-19** | `V⁰` | `V`ᵗ | `V`ᵗ | — | `V`ˣ | — | — | Account-level |

---

# L · Analytics & Reporting

> **PM-11 governs this entire domain.** Core operations first. **No large analytics dashboards are designed now.** Detailed metrics and KPIs are pending. FRD Phase-1 analytics requirements (11.1.x, 11.2.x) are **recording** requirements; every **dashboard** requirement is Phase 2 or Phase 3.

| # | Capability | FRD | L | F | IA | CM | SA | V | AR | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| L1 | Operational learner status (who is blocked, who has completed) | 8.1.4 | — | **`Rp`ᵗ** | `Rp`ᵗ | — | `Rp`ˣ | — | — | Phase 1 — **operational only** |
| L2 | Institutional operational summary (licence use, active learners) | 8.1.3, 6.2.2 | — | — | **`Rp`ᵗ** | — | `Rp`ˣ | — | — | Phase 1 — **operational only** |
| L3 | Cross-tenant operational oversight | **8.1.1, 1.3.5** | — | — | — | — | **`Rp`ˣ** | — | — | Phase 1 — **operational only** |
| L4 | Content pipeline status (submissions, validations, publishes) | 1.4.x | — | — | — | **`Rp`** | `Rp`ˣ | `Rp⁰` | `Rp` | Phase 1 — **operational only** |
| L5 | Class-level performance reports | **11.3.1 — Phase 2** | — | ⛔ Phase 2 | ⛔ | — | ⛔ | — | — | Phase 2 |
| L6 | Institutional adoption reports | **11.3.2 — Phase 2** | — | — | ⛔ Phase 2 | — | ⛔ | — | — | Phase 2 |
| L7 | Institutional usage dashboard | **8.2.1 — Phase 2** | — | — | ⛔ Phase 2 | — | ⛔ | — | — | Phase 2 |
| L8 | Licence utilisation tracking | **8.2.2 — Phase 2** | — | — | ⛔ Phase 2 | — | ⛔ Phase 2 | — | — | Phase 2 |
| L9 | XR heatmaps / decision-path analysis | **11.4.x — Phase 3** | — | ⛔ | ⛔ | — | ⛔ | — | — | Phase 3 |
| L10 | Detailed report metrics and KPI definitions | **PM-11** | `?` | `?` | `?` | `?` | `?` | `?` | `?` | **PENDING by PM instruction** |

**The distinction that keeps Phase 1 honest.** L1–L4 answer *"what is the current state of the thing I operate?"* — that is operations. L5–L9 answer *"how is the cohort performing over time?"* — that is analytics, and every one of them is a later phase in the FRD's own numbering. **Every reporting surface in Phase 1 is additionally bounded by FRD 1.3.4** (tenant-scoped data only).

---

# M · Security, Audit & Platform Configuration

| # | Capability | FRD | L | F | IA | CM | SA | V | AR | Tenant scope |
|---|---|---|---|---|---|---|---|---|---|---|
| M1 | Platform configuration | **8.1.1** | — | — | — | — | **`Cf M`ˣ** | — | — | Platform |
| M2 | Asset encryption / secure storage | 10.1.1, 12.1.2 | — | — | — | — | `V`ˣ | — | — | System |
| M3 | Module authorization before execution | 10.1.2 | — | — | — | — | `V`ˣ | — | — | System |
| M4 | Audit trail of governance decisions | *not in FRD* | — | — | `?` | `?` | **`?`** | `?` | `?` | **Undefined** |
| M5 | Custom role creation / granular permissions | **8.3.x — Phase 3** | — | — | ⛔ | — | **⛔ Phase 3** | — | — | Phase 3 |
| M6 | Role mapping from IdP attributes | **7.4.2 — Phase 3** | — | — | ⛔ | — | ⛔ Phase 3 | — | — | Phase 3 |

**M4 — a four-gate chain with no recorded history.** The governance chain (D1–D4) makes four separate authority decisions per module, across four roles. **No FRD requirement stores or displays who decided what, when.** For an academically-validated engineering curriculum this is a conspicuous absence. Recorded as a question; **not invented**.

**M5 is the reason the seven-role model must be fixed in Phase 1.** FRD 8.3 — the mechanism for defining new roles — is **Phase 3**. There is no Phase-1 way to add a role, which is exactly why PM-07's confirmation was necessary and why no further role may be invented.

---

# Summary

## Permission coverage by role

**96 capability rows** across 13 domains (A–M). Counts are per-cell within those rows.

| Role | Cells with a defined Phase-1 permission | Cells `?` PENDING | Cells ⛔ prohibited or out-of-phase |
|---|---|---|---|
| **Super Admin** | 65 | 8 | 14 |
| **Institute Admin** | 33 | 13 | 12 |
| **Learner** | 32 | 2 | 4 |
| **Faculty** | 30 | 5 | 3 |
| **Content Manager** | 12 | 5 | 1 |
| **Academic Reviewer** | 11 | 4 | 1 |
| **Vendor** | 10 | 2 | 3 — including the FRD's **only explicit role prohibition** (1.4.5) |

**Reading the ⛔ column.** Most prohibitions are **phase boundaries**, not permission denials — G9/G10 device management (Phase 2), L5–L9 analytics (Phase 2/3), M5/M6 role configuration (Phase 3), C5/C6 course and certification authoring (Phase 2). They are counted because a Phase-1 screen must not offer them. Only two are true authority prohibitions: **1.4.5** (Vendor may never publish) and **1.1.4** (institutions may not modify content).

**Institute Admin carries the most uncertainty** — 13 pending cells against 33 defined. That is the direct consequence of FRD 8.1.3 defining the role in one sentence while the requirements that would give it tools (3.4.x course creation, 8.2.x dashboards, 2.5.x device registration, 9.3.x billing) all sit in Phase 2.

## The four hard authority boundaries

These are stated by the FRD in unambiguous terms and must survive into every screen:

1. **Only Super Admin publishes** (1.4.4). No other role holds `Pb`.
2. **Vendors can never publish** (1.4.5). An explicit prohibition, not merely an absent permission.
3. **Analytics never cross a tenant** (1.3.4), except for Super Admin governance access (1.3.5).
4. **Institutions cannot modify or redistribute content** (1.1.4).

## PENDING items raised by this matrix

**19 capability rows contain at least one `?` cell**, plus **2 further questions raised in prose** where the blocking factor is a phase boundary rather than an undefined permission (C4/C5, I6/I7).

| Ref | Question |
|---|---|
| A6 | Who creates and manages Faculty accounts? |
| A8 | Password policy, MFA, lockout, session-expiry configurability |
| **B2** | **Where do Vendor, Academic Reviewer, and Content Manager sit in the tenancy model?** |
| D6 | Does Content Manager hold any version-release authority, or Super Admin only? |
| **D7** | **Is there a reject / revise / resubmit path in the governance chain?** |
| E5 | Is the learning sequence per-course configurable or a platform constant? |
| F1 · F3 · F6 | Does Institute Admin hold any assessment authority, or Faculty only? |
| **F10** | **Who grades descriptive answers?** |
| F11 | May Institute Admin or Super Admin see answer keys? |
| G3 | Institute Admin's role in entitlement-aware device delivery |
| G8 | Who authorises and performs MR sideloading? |
| **H2** | **How is an institutional licence transacted in Phase 1, given Phase-2 billing?** |
| H5 | Does Faculty hold any entitlement-granting authority? |
| J3 | Does Faculty see ERP sync status? |
| **J6** | **Which profile fields are user-editable vs ERP-owned?** |
| L10 | Detailed reporting metrics and KPIs — pending by PM instruction |
| **M4** | **Is there an audit trail for governance decisions?** |
| *C4 / C5* | *(prose)* Phase-1 Institute Admin course-structure authority vs Phase-2 course creation — tension **T-1** |
| *I6 / I7* | *(prose)* Who creates bundles and sets prices in Phase 1, given Phase-2 configuration? |

**Six are bolded as the ones most likely to change platform structure rather than screen detail.** All are carried into `11_OPEN_QUESTIONS_REFRAMED.md` with priorities. **None blocks the platform sitemap.**
