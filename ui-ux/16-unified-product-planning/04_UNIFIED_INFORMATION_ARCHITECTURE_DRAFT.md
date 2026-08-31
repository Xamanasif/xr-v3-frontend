# 04 — Unified Information Architecture (DRAFT)

| | |
|---|---|
| **Status** | 🟠 **IA DRAFT.** One sitemap across every plane. **Not the final IA — that is Stage 6** |
| **Created** | 29 August 2026 |
| **Prohibited by** | `11_SAFE_WORK_BEFORE_MONDAY.md` **N7** — *"Final navigation"* · **N2** — *"Merging the prototypes"* |
| **What makes this safe** | It **assembles existing structure and marks every unresolved joint**. It creates no responsibility, chooses no label, and merges no code |

---

## 1 · The whole product on one page

```
════════════════════════════════════════════════════════════════════════════════
  PUBLIC PLANE                                     🔴 NOTHING HERE IS BUILT
════════════════════════════════════════════════════════════════════════════════
  Landing
     ├── Catalogue ──── ⟦S1 grouping⟧ ──── Course ──── Experiment
     │                    Discipline today      │            │
     │                    ⚪ Programme? PQ-04    │            └── ⟦S2 technology⟧
     │                                          │                 property today
     │                                          │                 ⚪ variant? PQ-08
     │                                          └── Experiment (direct)
     │
     ├── Experiment detail ─── ⟦S3 ACCESS ACTION — ⛔ PENDING PQ-06⟧
     │
     └── Entry fork ──┬── INSTITUTION ──▶ application ──▶ ⚪ review ──▶ ⚪ authorise
                      │                    AUTH-10       PQ-03         PQ-03
                      └── INDIVIDUAL  ──▶ register  ──▶ ⚪ authorise? ──▶ period
                                           AUTH-03       PQ-07            PM29-19
════════════════════════════════════════════════════════════════════════════════
  AUTHENTICATION                                   🔴 9 OF 10 SURFACES MISSING
════════════════════════════════════════════════════════════════════════════════
        Sign in ── SSO return ── Register ── Reset ── Session expired
                              │
                    WORKSPACE RESOLUTION  (AUTH-08)
                    seven roles · one front door
                              │
        ┌─────────────────────┼─────────────────────┬──────────────────┐
        ▼                     ▼                     ▼                  ▼
════════════════════   ═══════════════════   ═══════════════════  ═════════════
 PLATFORM PLANE         TENANT PLANE          LEARNER CORE         INDIVIDUAL
 ✅ built (B01+B05)      ✅ built (B02+B03)     ✅ built (B01+B02)   🟠 B04
════════════════════   ═══════════════════   ═══════════════════  ═════════════
 SUPER ADMIN            TENANT/INST. ADMIN     My Learning ◀───────── converges
  Overview               Overview               │                      here
  Institutions           People 🔴+provision     Experiment
  ⛔ Tenant requests      Academic Structure      ├── Resources
  🔴 Content allocation   Content Access          ├── Simulation
  Releases ⚪PQ-01        Institution Setup       │    web · AR/VR/MR
  Device requests          ├ Institution         └── Assessment
  Licensing                ├ Single sign-on           intro→attempt→
  Platform                 └ Institution data          review→result
   ├ Roles ⛔write            └ Records needing  Progress
   └ Configuration              attention        🔴 Device binding
                                                 🔴 Replacement request
 CONTENT MANAGER        FACULTY                       │
  Review Queue           🔴 Experiments                └──▶ approval end ──▶
  Reviewed Content       Assessments                        SUPER ADMIN
  Published Content      Question Bank                      (already built)
                         AI drafts
 ACADEMIC REVIEWER       ⚪ Progress/usage
  Review Queue           ⛔ Analytics PQ-14
  Review History
                        STUDENT
 VENDOR                  My Learning ─────────────────────┘
  Submissions            Progress
  New Submission
```

---

## 2 · The four planes, and what separates them

| Plane | Isolation rule | Source |
|---|---|---|
| **PUBLIC** | No account, no tenant, no role | `PM29-02` — 🟣 **an FRD extension**; no requirement describes unauthenticated browsing |
| **PLATFORM** | Spans tenants. **Analytics never cross a tenant**, except Super Admin governance access | FRD 1.3.4 · 1.3.5 · `PM-13` |
| **TENANT** | Tenant isolation applies from tenant creation onward. **No institution switcher exists anywhere** — the boundary is structural, not a control | FRD 1.3.1 · Batch 03 |
| **INDIVIDUAL** | A separate B2C data environment | FRD 1.3.2 |

**The learner core is not a fifth plane.** It is the part **TENANT** and **INDIVIDUAL** share — identical screens, reached by two routes. That is why `My Learning` is the convergence point and why B2B-first does not mean B2C-deleted.

---

## 3 · The four hard authority boundaries the IA must preserve

**All four survive 29 August unchanged.**

| # | Boundary | Where the IA enforces it |
|---|---|---|
| 1 | **The Vendor can never publish** — FRD **1.4.5**, the only explicit role prohibition in the document | No publish control anywhere in the Vendor workspace, **and no disabled one either** — the vendor sees *who holds* the submission |
| 2 | **Analytics never cross a tenant** — FRD **1.3.4**, except Super Admin governance (**1.3.5**) | `U-SA-02` shows institutions side by side with **no learner count, seat figure or utilisation percentage** — *five institutions' volumes side by side is the comparison AC-04 exists to prevent* |
| 3 | **Institutions cannot modify or redistribute content** — FRD **1.1.4** | The tenant plane has **no content authoring surface** of any kind |
| 4 | **A learner never authors or configures an assessment, and never sees the answer key** — **PM-15** · **`D-25`** | No authoring control in any learner surface; no per-question correctness |

**Plus one that changed on 25 August and is unchanged by 29 August:** publication is the **Content Manager's**, not the Super Admin's, despite FRD 1.4.4.

---

## 4 · The unresolved joints, marked in place

**Six. Each is a joint between two parts that are themselves settled.**

| # | Joint | Between | Blocked by |
|---|---|---|---|
| **J1** | The **access action** on a public experiment | Public discovery *(settled)* ↔ the transaction *(open)* | `PQ-06` |
| **J2** | The **approval actor** for a tenant application | The application *(directional)* ↔ tenant creation *(settled)* | `PQ-03` |
| **J3** | The **allocation unit** | Super Admin authority *(directional)* ↔ Batch 03's content-access record *(built)* | `PM29-23` |
| **J4** | The **assignment owner** inside a tenant | Content access *(built)* ↔ the learner *(built)* | `PQ-05` |
| **J5** | The **grouping level** above Course | The catalogue *(built)* ↔ Course *(settled)* | `PQ-04(b)` |
| **J6** | Whether **technology** is a level | Experiment *(settled)* ↔ the access record *(built)* | `PQ-08` |

> **Every one of these six joins two things that already exist.** That is the shape of the remaining work: the parts are built, the connectors are unowned. It is also why the connectors are cheap to build **once named** and expensive to guess.

---

## 5 · Depth and breadcrumb rules

| Rule | Source |
|---|---|
| **Nav depth stops at two** | Batch 03 stated it; Batch 05 obeyed it as the first two-level workspace |
| **Breadcrumb depth 2–3 levels; current page is not a link** | Batch 01 |
| **Public breadcrumbs are a content path, not a workspace path** | `Catalogue / Course / Experiment` — new; no batch has this shape |
| **One `<h1>` per view** | Batch 01, enforced across all five |
| **`aria-current="page"` on exactly one element** | Batch 05 — the child, never also the parent |

---

## 6 · Route-namespace plan

**Planning shape only. No router is written; Stage 7 owns that.**

| Plane | Namespace | Existing batch routes it absorbs |
|---|---|---|
| Public | `/` · `/catalogue` · `/course/…` · `/experiment/…` · `/get-started` | `#/explore` · `#/module/…` |
| Auth | `/sign-in` · `/register` · `/sso/…` · `/apply` | `#/sign-in[/…]` *(handoff only)* |
| Platform | `/platform/…` | `#/overview` `#/institutions` `#/releases` `#/device-requests` `#/licensing` `#/platform/…` |
| Governance | `/vendor/…` · `/review/…` · `/content/…` | `#/vendor/…` `#/arv/…` `#/cm/…` |
| Tenant | `/institution/…` | `#/admin/…` |
| Faculty | `/faculty/…` | `#/faculty/…` |
| Learner | `/learning/…` | `#/learner/…` · `#/my-learning` · `#/learn/…` |

⚠ **Three collisions to resolve at Stage 6, all caused by five independent routers:**

| Collision | Detail |
|---|---|
| **`#/my-learning` vs `#/learner/my-learning`** | Batch 04 uses the first; Batches 01, 02, 03 use the second. **The same screen** |
| **`#/module/<id>` vs `#/learner/experiment/:id`** | The same object, two nouns and two namespaces — and in Batch 04 the id is an **offering** id while in `#/learn/<id>` it is a **module** id |
| **`#/overview` (Batch 05, platform) vs `#/admin/overview` (Batch 03, tenant)** | Two different planes, one unqualified name |

---

## 7 · Five state models become one

Each batch carries its own `sessionStorage` key and its own state shape:

| Batch | Key |
|---|---|
| 01 | `xrslp-batch01-proto-v2` |
| 02 | `xrslp-batch02-proto-v1` |
| 03 | `xrslp-batch03-proto-v1` |
| 04 | `xrslp-batch04-proto-v1` |
| 05 | `xrslp-batch05-proto-v1` |

⛔ **They are not merged by this task, and must not be merged before Stage 7.** `09_STATE_AND_DATA_CONVERGENCE_MAP.md` maps what they would have to agree on.

> **The asset worth naming:** the same sample institution, the same people and the same experiments — *Soil Mechanics — Direct Shear Test*, *Surveying — Total Station Basics*, *Fluid Mechanics — Bernoulli Flow Visualisation* — already run through **all five batches**. A consolidated prototype inherits a coherent world rather than five unrelated demos.

---

## 8 · What this IA does not do

| Not done | Why |
|---|---|
| Final navigation | Stage 6 · `N7` |
| Final route table | Stage 7 |
| Merge state models | Stage 7 · `N5` |
| Resolve any terminology | `PQ-04`, `PQ-09`, `PQ-12` — **once, after confirmation** |
| Choose one shell or two | `08_SHARED_SHELL_AND_NAVIGATION_MODEL.md` §2.2 recommends; it does not decide |
| Reconcile against the Review-006 104-screen inventory | Stage 6 — *"Batch-local IDs → the stable inventory"* |
| Resolve `QX-01` / `QX-02` viewport and reflow | Stage 10. ⚠ **Now sharper — a public catalogue is not a desktop-only surface in practice** |
