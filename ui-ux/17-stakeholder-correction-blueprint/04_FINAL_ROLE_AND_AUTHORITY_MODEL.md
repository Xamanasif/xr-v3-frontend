# 04 — Final Role and Authority Model

| | |
|---|---|
| **Status** | ✅ **CURRENT ROLE MODEL OF RECORD** |
| **Created** | 31 August 2026 |
| **Governing decisions** | `STK31-01` · `STK31-02` · `STK31-03` · `STK31-06` · `STK31-07` · `STK31-08` · `STK31-21` · `STK31-24` · `STK31-25` · `STK31-40` · `STK31-41` |
| **Hard boundary** | **SEVEN formal roles. No eighth role exists, and none may be created.** PM-07 fixed the set; FRD 8.3 (custom roles) is **Phase 3** and cannot be used to add one |

---

## 1 · The seven roles

```
1. Student / Learner              ONE role, two contexts (B2B institutional · B2C individual)
2. Faculty
3. Institute Admin / Tenant Admin ONE role, two names — final label pending (ND-01)
4. Vendor                         content producer/submitter: external OR internal BITS/WILP team
5. Academic Reviewer
6. Content Manager
7. Super Admin
```

### The three identity rules that must not be broken

| # | Rule | Decision |
|---|---|---|
| **1** | **`Student` and `Learner` are the SAME formal role.** B2B = institutional Student/Learner under a Tenant. B2C = individual Student/Learner. **No separate role, no separate permission set.** Planning term: `Student / Learner` | `STK31-01` |
| **2** | **`Institute Admin` and `Tenant Admin` are the SAME formal role.** Internal term: `Institute Admin / Tenant Admin`. **No eighth role** | `STK31-02` |
| **3** | **Internal BITS/WILP content teams operate through the VENDOR role.** No `Internal Content Developer`, no `BITS Content Developer`, no `Faculty Content Uploader` | `STK31-03` |

---

## 2 · The authority tree

```
                        ┌──────────────────────────┐
                        │       SUPER ADMIN        │  platform-wide · spans both planes
                        │   FRD 8.1.1 · 1.3.5      │  STK31-21 · 24 · 40 · 41 · 07
                        └────────────┬─────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
 ═══════▼═══════════════════  ═══════▼════════════════  ══════════▼══════════
  CENTRAL CONTENT PLANE        TENANT PLANE               INDIVIDUAL CONTEXT
  ═══════════════════════      ════════════════           ═══════════════════
                                                          ▷ DEFERRED (STK31-04)
  ┌───────────────────┐      ┌───────────────────────┐   ┌──────────────────┐
  │ CONTENT MANAGER   │      │ INSTITUTE ADMIN /     │   │ Student/Learner  │
  │ FRD 8.1.2         │      │ TENANT ADMIN          │   │ in the INDIVIDUAL│
  │ • Content Library │      │ FRD 8.1.3 · STK31-02  │   │ context          │
  │ • FIRST PUBLISH   │◀─────┤ • people provisioning │   │                  │
  │   STK31-06        │      │ • CSV bulk import     │   │ a CONTEXT of the │
  │ • canonical       │      │ • Course/Experiment   │   │ SAME role —      │
  │   metadata        │      │   assignment from the │   │ NOT an 8th role  │
  └───────────────────┘      │   APPROVED SET only   │   └──────────────────┘
  ┌───────────────────┐      │ • local mappings      │
  │ ACADEMIC REVIEWER │      │ • SSO / institution   │
  │ FRD 1.4.2·PM-07   │      │   data                │
  │ • academic        │      │ • student deactivate  │
  │   validation      │      │ ✗ CANNOT redefine the │
  │ • LEARNING        │      │   canonical catalogue │
  │   OUTCOMES        │      └───────────┬───────────┘
  │   STK31-08        │                  │
  └───────────────────┘        ┌─────────┴──────────┐
  ┌───────────────────┐        ▼                    ▼
  │ VENDOR            │   ┌──────────┐      ┌─────────────────┐
  │ FRD 1.4.1 · 1.4.5 │   │ FACULTY  │      │ STUDENT/LEARNER │
  │ external OR       │   │ 8.1.4    │      │ institutional   │
  │ internal team     │   │ • assess │      │ FRD 8.1.5       │
  │   STK31-03        │   │   config │      │                 │
  │ • package OR link │   │ • Q bank │      │ ✗ never authors │
  │ • version submits │   │ • DESCRIP│      │   an assessment │
  │ ✗ CAN NEVER       │   │   TIVE   │      │ ✗ never sees the│
  │   PUBLISH (1.4.5) │   │   GRADING│      │   answer key    │
  └───────────────────┘   │   STK31- │      └─────────────────┘
                          │   31     │
                          │ • feedback policy STK31-32
                          └──────────┘
```

---

## 3 · Authority by role

Legend — ✅ confirmed · 🔵 confirmed area, surface to design · 🟠 confirmed with a named pending detail · ⛔ prohibited or out of phase

### 3.1 Super Admin

| Capability | Status | Basis |
|---|---|---|
| Review a tenant/institution request | ✅ | `STK31-20`, `STK31-21` |
| Approve / authorise a tenant | ✅ | `STK31-20`, `STK31-21` |
| Create and govern a tenant | ✅ | `STK31-21` |
| **Assign the Tenant / Institute Admin** | ✅ | `STK31-21` |
| Deactivate / terminate a tenant | ✅ 🟠 *(prefer reversible — `STK31-22`)* | `STK31-21`, `STK31-22` |
| **Allocate Courses, Experiments and technology variants to a tenant** | ✅ | `STK31-24` |
| **Release / hold a LATER version** of a published Experiment | ✅ | `STK31-07` · FRD 2.3.2 |
| Manage canonical / master metadata | ✅ 🟠 *(schema `ND-05`)* | `STK31-09` |
| Govern platform roles — Vendor · Academic Reviewer · Content Manager | ✅ | `STK31-41` |
| **Assign role-holders per Course and per Experiment; multiple people per Experiment** | ✅ | `STK31-41` |
| Approve a device-replacement / transfer request | ✅ | `STK31-38` · FRD 2.4.2 |
| Licensing / subscription / access-term visibility | ✅ | `STK31-27`, `STK31-28`, `STK31-42` |
| Institution profile / operational report | ✅ 🔵 | `STK31-42` |
| Platform support / issue visibility, tracking and resolution | ✅ 🔵 | `STK31-39` |
| Student deactivation as a **platform override** | ✅ | `STK31-25` |
| **FIRST publication of a new Experiment** | ⛔ **NOT Super Admin** | `STK31-06` · PM-16/17/18 |
| Grant/revoke an individual **learner** entitlement | ⛔ Tenant-plane — Tenant Admin | `STK31-25` · Batch 05 `R-05` **still refuted** |
| Assign content **to learners or cohorts** | ⛔ Tenant-plane — Tenant Admin | `STK31-25` · Batch 05 `R-06` **still refuted** |
| Custom roles · analytics dashboards · bundle pricing · revenue metrics | ⛔ Phase 2/3 or prohibited | FRD 8.3.x · 8.2.x · 6.3.x · `STK31-40` |
| Return a submission at the **first-publication** gate | ⚪ **OPEN** — `ND-13` (`QP-26`) | Not addressed by the 31 Aug review |

> **The altitude rule is load-bearing.** Super Admin decides **what a tenant may use**. The Tenant Admin decides **which learner gets what**. Collapsing the two grants a capability nobody described and that two FRD requirements assign elsewhere.

### 3.2 Institute Admin / Tenant Admin

| Capability | Status | Basis |
|---|---|---|
| **Manual creation of Faculty and Students** | ✅ 🔵 *(no control exists today)* | `STK31-25` |
| **Bulk CSV import of people** | ✅ 🟠 *(`Plan Terms` status `ND-03`; ERP conflict `ND-04`)* | `STK31-25`, `STK31-26` |
| Faculty mapping · Student/group mapping | ✅ | `STK31-25` |
| **Course/Experiment assignment to students and groups — from the tenant's approved set only** | ✅ | `STK31-25` |
| Institution-specific mappings — local Course Code, **optional** Semester, plan/access context | ✅ | `STK31-11`, `STK31-25` |
| Institutional SSO configuration | ✅ *(built — Batch 03 `INA-10`)* | FRD 4.2.2 · PM-10 · `STK31-44` |
| Institution data / ERP connection, schedule, history, retry | ✅ *(built — `INA-11`/`INA-12`)* | FRD 7.1.x, 7.2.1 |
| Reporting/visibility over assigned students and content | ✅ | `STK31-25`, `STK31-43` |
| Student removal / deactivation | ✅ 🟠 *(prefer deactivate — `STK31-22`)* | `STK31-25` |
| See subscription/access term and the **15-day expiry** state | ✅ | `STK31-28` |
| **Redefine the canonical Experiment catalogue** | ⛔ **Prohibited** | `STK31-10`, `STK31-25` |
| Assign content **outside** the tenant's approved set | ⛔ **Prohibited** | `STK31-24` |
| Create academic programmes/streams freely | ⛔ Platform-controlled | `STK31-10` |
| In-platform course creation | ⛔ Phase 2 | FRD 3.4.x |
| Author or configure an assessment | ⛔ Faculty-owned | PM-15 · `STK31-30` |
| Seat / cap management | ⛔ **No universal model** | `STK31-27` |

### 3.3 Faculty

| Capability | Status | Basis |
|---|---|---|
| **See Experiments available to the tenant** | ✅ 🔵 *(no browse surface exists)* | `STK31-29` |
| Assessment configuration — MCQ · True/False · Descriptive | ✅ *(built — Batch 02)* | `STK31-30` · PM-08 · PM-15 |
| Question Bank — add · edit · **delete** · import | ✅ 🔵 *(delete is new)* | `STK31-34` |
| **AI question generation from uploaded source material and/or prompt**, drafts marked AI-generated, **Faculty review mandatory** | ✅ 🔵 *(source input is new)* | `STK31-33` · FRD 5.1.2 |
| **Descriptive-answer evaluation — the ONLY human evaluator** | ✅ 🟠 *(auto-review mechanics `ND-09`)* | `STK31-31` |
| **Answer / explanation visibility policy** — immediately · after deadline · custom date | ✅ 🟠 *(BITS = Taxila-reference `ND-10`)* | `STK31-32` |
| Student results · completion/progress · Experiment usage · time spent · assessment outcomes | ✅ 🔵 | `STK31-29`, `STK31-43` |
| Student/group assignment context | ✅ | `STK31-29` |
| **Broad executive analytics / KPI dashboards** | ⛔ **Prohibited** | `STK31-29` · PM-11 · FRD 8.2.x/11.3.x/11.4.x are Phase 2/3 |
| Course creation | ⛔ Phase 2 | FRD 3.4.x |
| Publish, release, or allocate content | ⛔ Not a Faculty capability | `STK31-06`, `STK31-07`, `STK31-24` |

### 3.4 Student / Learner — one role, two contexts

| Capability | Status | Basis |
|---|---|---|
| See Experiments made available to them | ✅ *(built)* | FRD 8.1.5 |
| Learning resources → simulation → assessment → result → completion | ✅ *(built)* | PM-09 |
| Web/WebGL experience in browser | ✅ *(built)* | FRD 1.2.1 · `STK31-37` |
| AR / VR / **MR** on device, entitlement-aware, mechanism-neutral | ✅ *(built)* | PM-05 · `STK31-37` · `STK31-45` |
| **Progress per assigned technology** | ✅ 🔵 *(new dimension)* | `STK31-36` |
| Public discovery before login | ✅ 🔵 | `STK31-16` |
| **Device binding; request a device transfer** | ✅ 🔵 *(learner end not built)* | `STK31-38` · FRD 2.4.1, 2.4.2 |
| **Report an operational issue** | ✅ 🔵 *(new)* | `STK31-39` |
| Author or configure an assessment | ⛔ **Never**, in either context | PM-15 · `STK31-30` |
| See the correct-answer key | ⛔ **Never** | `D-25` — untouched by `STK31-32` |
| Assign content to themselves or others | ⛔ | `STK31-25` |

### 3.5 Content Manager · Academic Reviewer · Vendor

| Role | Confirmed authority | Boundary |
|---|---|---|
| **Content Manager** | Content Library control · readiness review (FRD 1.4.3) · request changes (PM-14) · **FIRST PUBLICATION of a new Experiment** (`STK31-06`) · canonical content metadata (`STK31-09`) | ⛔ **Does not release later versions** — that is Super Admin (`STK31-07`). Governed by Super Admin (`STK31-41`) |
| **Academic Reviewer** | Academic validation (FRD 1.4.2) · Course/Experiment academic alignment · **Learning Outcomes** (`STK31-08`) · approve or request changes (PM-14) | ⛔ **Does not grade descriptive answers** — that is Faculty (`STK31-31`). Assignable per Course/Experiment (`STK31-41`) |
| **Vendor** | Develops/submits the Experiment · technical description · **compiled package OR hosted link** by technology · supported technology/device/runtime information · technical documentation · version submissions · correct and resubmit (PM-14) | ⛔ **CAN NEVER PUBLISH** — FRD 1.4.5, the only explicit role prohibition, and it applies to **internal** submitters too (`STK31-03`). ⛔ **Does not own Learning Outcomes** (`STK31-08`). ⛔ Source code is **not** required (`STK31-37`) |

---

## 4 · The hard authority boundaries

**All still hold. Any unified design must preserve every one.**

| # | Boundary | Source | Status after 31 Aug |
|---|---|---|---|
| **1** | **A Vendor can never publish** | FRD 1.4.5 | ✅ Untouched — and now explicitly covers internal teams |
| **2** | **Analytics never cross a tenant** | FRD 1.3.4, except Super Admin governance access 1.3.5 | ✅ Untouched |
| **3** | **Institutions cannot modify or redistribute content** | FRD 1.1.4 | ✅ Untouched — reinforced by `STK31-10` |
| **4** | **A learner never authors or configures an assessment, and never sees the answer key** | PM-15 · `D-25` | ✅ Untouched |
| **5** | **First publication is the Content Manager's, not the Super Admin's** | PM-16/17/18 · `STK31-06` | ✅ **Re-confirmed** |
| **6** | **NEW — later version release/hold is the Super Admin's, not the Content Manager's** | `STK31-07` · FRD 2.3.2 | ✅ **Confirmed.** The terminology firewall is mandatory |
| **7** | **NEW — the Tenant Admin cannot assign content outside the tenant's approved set** | `STK31-24` | ✅ Confirmed |
| **8** | **NEW — the Tenant Admin cannot redefine the canonical Experiment catalogue** | `STK31-10`, `STK31-25` | ✅ Confirmed |
| **9** | **NEW — no external B2B access before Super Admin approval** | `STK31-20` | ✅ Confirmed |
| **10** | **NEW — no payment screen on the internal / BITS-community route** | `STK31-19` | ✅ Confirmed |
| **11** | **Seven roles. No eighth** | PM-07 · `STK31-01`, `02`, `03` | ✅ Reinforced three times |

---

## 5 · The two terminology firewalls

### 5.1 Publish vs Release — the one that will cause real bugs

| Event | Object | Owner | Word |
|---|---|---|---|
| A **new** Experiment reaches production for the first time | The Experiment | **Content Manager** | **Publish** |
| A **newer approved version** of an already-published Experiment replaces the live one | The Version | **Super Admin** | **Release** / **Hold** |

> 🔴 **A known live collision.** Batch 05 firewalled *"release"* to mean *not publication*. **Batch 01's shipped copy uses *"release"* to mean publish, in four strings.** Both batches are internally correct. In the unified build **the smaller side changes**: Batch 01's four strings become *publish*. This is recorded in `13` Part A and in the reconciliation backlog.

### 5.2 Module vs Experiment

`Experiment` is the canonical planning term (`STK31-14`). `Module` survives only as historical prototype vocabulary. **The rename happens exactly once, in the unified build. Historical batches are not touched.**

---

## 6 · Where a role's identity comes from — the one gap that remains

`QD-02` asked *how does anyone become a role-holder in Phase 1?* The 31 Aug review answers **who assigns** (`STK31-21`, `STK31-41`) but not **how an identity first exists** — invited, created, imported, or mapped from an IdP. FRD 7.4.2 (IdP role mapping) and 8.3 (custom roles) are both **Phase 3**.

**Safe handling:** design the assignment surface around an identity that already exists, and show identity origin as a **provenance line** rather than inventing an invitation or account-creation mechanism. Recorded in `16_REMAINING_NONBLOCKING_DETAILS.md`.
