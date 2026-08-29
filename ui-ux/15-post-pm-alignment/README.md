# 15 — Post-PM Alignment & Full-Platform Consolidation Blueprint

**XR Simulation Learning Platform** · Branch `uiux/full-platform-design` · **29 August 2026**

> ### 🟠 This is an alignment phase, not a design batch.
> **No prototype was created. No batch was modified. No commit was made. No open question was closed.**

---

## What this is

A planning and alignment phase between five completed functional UI/UX prototype batches, the consolidated FRD v5, the PM decisions of 18 / 19 / 25 August, and **new PM direction received on 29 August 2026** — including a handwritten role and data diagram.

It answers six questions:

| # | Question | Where |
|---|---|---|
| 1 | What existing work remains valid? | `09_BATCH_01_05_IMPACT_MATRIX.md` |
| 2 | What must change? | `09` + `10_PHASE1_GAP_INVENTORY_PRE_MONDAY.md` |
| 3 | What new UX is required? | `10` |
| 4 | What is still unresolved? | `01` Part D · `02` · `12_PM_CLARIFICATIONS_FOR_MONDAY.md` |
| 5 | How does the whole Phase-1 platform connect? | `03_MASTER_PRODUCT_MODEL.md` + `diagrams/` |
| 6 | What is safe to work on before Monday? | `11_SAFE_WORK_BEFORE_MONDAY.md` |

---

## The five findings that matter most

### 1 · A stage was inserted into the platform that did not previously exist

**The Super Admin decides which experiments a tenant receives** (`PM29-23`). The FRD reaches the tenant through stream-mapped packages and ERP-derived assignment, and **never says who decides which content an institution may use.**

**Batch 03 was built with exactly that blank left open** — its content-access record's origin line deliberately carries **a date and no actor**, *"because no source confirms who records institutional content access."* The 29 August direction supplies the actor. **A design built to accept an answer received it.**

### 2 · Batch 05's Super Admin is correct, and too small in four specific places

Batch 05's audit refuted fourteen candidate capabilities on the explicit ground that **no source named them**. Four of those now have a source:

| Refuted | Now |
|---|---|
| `R-01` institution creation / onboarding | ⚪ **OPEN** — a platform-side step exists (`PM29-07`); the actor does not |
| `R-02` assign the first Institute Admin | ⚪ **OPEN** — authority is directional (`PM29-22`); the mechanism is `QD-02` |
| `R-03` Vendor account administration | ⚪ **OPEN** — scope unknown (`PM29-24`) |
| `R-04` Academic Reviewer administration | ⚪ **OPEN** — scope unknown |

**And two that look similar are NOT reversed:** `R-05` (grant/revoke a **learner** entitlement) and `R-06` (assign content **to learners or cohorts**). The PM spoke about **tenants**. Tenant-level allocation and learner-level assignment are different objects at different altitudes, and two FRD requirements assign the learner-level ones elsewhere.

### 3 · There is a real, shipped terminology inconsistency

`Module` versus `Experiment` is not hypothetical. **Counted in the prototype sources:**

| Batch | `Experiment` | `Module` |
|---|---|---|
| 01 | **11** | 0 |
| 02 | 0 | **61** |
| 03 | **1** *(+26 lowercase)* | 0 |
| 04 | **3** | **23** |
| 05 | 0 | **9** |

**Batch 04 disagrees with itself:** its catalogue card chip reads `Module`, while its My Learning table header reads `Experiment`. A consolidated prototype would surface this on the first click-through — which is why the rename is frozen until `PQ-04` and why consolidation must not start first.

### 4 · Authentication is the quiet blocker

`AUTH-01` (sign in), `AUTH-02` (SSO return), `AUTH-03` (sign up) and `AUTH-08` (workspace resolution) have **never been designed in any batch**. Each used a clearly-labelled non-product index instead — correct for a per-flow prototype, impossible for a product.

**A public catalogue makes it urgent:** the public route's very first action is *sign in / register / apply*, and none of those three destinations exists.

**But it is not buildable yet.** The *screens* are specified by the FRD and PM-10; the **routing between them** intersects five open questions — the Institution/Individual entry fork, tenant authorisation, individual authorisation before payment, SSO fallback behaviour (compounded by the standing `QT-04` collision), and the final Student/Learner label. So the pre-Monday work is **auth coverage mapping, routing requirements analysis, login/register IA, component and state planning, and SSO-vs-normal-login dependency identification** — not the prototype. See `11_SAFE_WORK_BEFORE_MONDAY.md` `S9`.

### 5 · More of this platform is blocked than is missing

**23 gap items are blocked on a PM answer. 17 are simply missing.** Answering twelve questions is worth more than any amount of anticipatory design.

---

## The documents

| # | File | What it holds |
|---|---|---|
| **01** | [`01_PM_2026-08-29_DECISION_EXTRACTION_DRAFT.md`](01_PM_2026-08-29_DECISION_EXTRACTION_DRAFT.md) | **DRAFT — awaiting Monday read-back.** 25 candidate decisions classified; **12 ambiguities preserved**; conflicts with earlier PM decisions; questions resolved, unresolved and newly created |
| **02** | [`02_SOURCE_PRECEDENCE_AND_CONFLICTS.md`](02_SOURCE_PRECEDENCE_AND_CONFLICTS.md) | Precedence order; pre-existing PM-vs-FRD disagreements; new conflicts; the requirement-safety checklist; **how the FRD was actually read** |
| **03** | [`03_MASTER_PRODUCT_MODEL.md`](03_MASTER_PRODUCT_MODEL.md) | One system model, public → B2B / B2C → shared learning core, with every unresolved step marked ⚪ |
| **04** | [`04_ROLE_AND_AUTHORITY_MODEL.md`](04_ROLE_AND_AUTHORITY_MODEL.md) | The role tree; aliases and contexts; authority by role; the four hard boundaries |
| **05** | [`05_CONTENT_HIERARCHY_AND_CATALOGUE_MODEL.md`](05_CONTENT_HIERARCHY_AND_CATALOGUE_MODEL.md) | FRD hierarchy vs PM hierarchy; metadata; **the terminology conflict table with measured evidence** |
| **06** | [`06_B2B_PRIMARY_JOURNEY.md`](06_B2B_PRIMARY_JOURNEY.md) | The primary journey, twelve stages, every open item labelled in place |
| **07** | [`07_B2C_SECONDARY_JOURNEY.md`](07_B2C_SECONDARY_JOURNEY.md) | The secondary journey; what stays unknown; the migration path |
| **08** | [`08_TENANT_ONBOARDING_MODEL.md`](08_TENANT_ONBOARDING_MODEL.md) | The stable portion of tenant onboarding; why the actor cannot be filled in |
| **09** | [`09_BATCH_01_05_IMPACT_MATRIX.md`](09_BATCH_01_05_IMPACT_MATRIX.md) | **32 decisions × impact**, then batch by batch. Keep / modify / add / remove / pending, with magnitude |
| **10** | [`10_PHASE1_GAP_INVENTORY_PRE_MONDAY.md`](10_PHASE1_GAP_INVENTORY_PRE_MONDAY.md) | Pre-Monday inventory — **not** the formal audit. 17 confirmed missing · 23 blocked |
| **11** | [`11_SAFE_WORK_BEFORE_MONDAY.md`](11_SAFE_WORK_BEFORE_MONDAY.md) | Safe now / wait for PM / do not do yet, with a recommendation |
| **12** | [`12_PM_CLARIFICATIONS_FOR_MONDAY.md`](12_PM_CLARIFICATIONS_FOR_MONDAY.md) | **10 must-answer questions**, 5 important-if-time, 6 can-wait — and a three-question version |
| **13** | [`13_CONSOLIDATION_SEQUENCE.md`](13_CONSOLIDATION_SEQUENCE.md) | Ten stages from PM clarification to handoff, and what to reuse from every batch |

### Diagrams

| File | Shows |
|---|---|
| [`diagrams/MASTER_PLATFORM_MAP.md`](diagrams/MASTER_PLATFORM_MAP.md) | The whole product on one page — **read this first** |
| [`diagrams/ROLE_TREE.md`](diagrams/ROLE_TREE.md) | Seven roles, three planes, and how the PM's handwritten diagram maps onto them |
| [`diagrams/CONTENT_TO_LEARNER_FLOW.md`](diagrams/CONTENT_TO_LEARNER_FLOW.md) | Vendor build → learner screen, in fourteen stages, with the five breaks marked |
| [`diagrams/B2B_REQUEST_FLOW.md`](diagrams/B2B_REQUEST_FLOW.md) | The primary journey and the four gates that stop it |
| [`diagrams/B2C_FLOW.md`](diagrams/B2C_FLOW.md) | The secondary journey and the four-move migration |

Every diagram is provided as **both Mermaid and ASCII**, so it renders anywhere.

---

## The twelve things that must stay open

**Verified absent as settled claims from every document in this folder.**

| | |
|---|---|
| 1 | Bundle definition |
| 2 | Super Admin final version-release ownership |
| 3 | Final B2C approval flow |
| 4 | Final B2B approval actor |
| 5 | The paid / free institution classification rule |
| 6 | Seat model — *confirmed to have none*; `OQ-03` open |
| 7 | CSV schema |
| 8 | Technology-specific pricing |
| 9 | Learner-assignment actor |
| 10 | Tenant Admin vs Institute Admin label — **and the reading that they are one role** |
| 11 | Student vs Learner terminology |
| 12 | Internal BITS tenant topology |

---

## Status of the five batches

**All five are READ ONLY in this task and were not touched.**

| Batch | Location | Verdict after 29 August |
|---|---|---|
| **01** Content governance + learner XR access | `ui-ux/13-full-platform-design/` | ✅ **Largely intact.** The best-aligned batch — it already uses *Experiment* |
| **02** Assessment | `.../batch02-assessment/` | ✅ Core intact · 🟠 the Faculty workspace around it is incomplete |
| **03** Institute administration | `.../batch03-institute-admin/` | ✅ **Model validated** · 🔴 people provisioning missing entirely |
| **04** B2C learner access | `.../batch04-b2c-learner-access/` | ✅ Components reusable · 🔵 entry model superseded |
| **05** Super Admin | `.../batch05-super-admin/` | 🟠 **Correct, and too small in four specific places** |

> **No batch needs to be thrown away, and no batch is wrong.** Three of the five are substantially validated by the new direction — and Batch 03's most conservative choices, the ones that looked over-careful at the time, are the ones that now receive their answers cleanly. **What changed is not the quality of the work; it is the size of the platform around it.**

---

## Note on folder numbering

This package is `ui-ux/15-post-pm-alignment/`. **15 is the next unused top-level prefix** — `00`–`14` are all occupied, and `12-` and `14-` each already carry two directories (`12-full-platform-reframe` / `12-presentations`, and `13-full-platform-design`'s sibling `14-presentations`).

It was briefly created as `14-post-pm-alignment` and moved to `15-` before any commit, so **no history, link or reference outside this folder was affected**. `ui-ux/14-presentations/` — which holds `PM_PROGRESS_REVIEW_BATCH01_02` — was **not read, renamed, modified or affected** at any point.

---

## What was not done

| | |
|---|---|
| Prototype created | ❌ **No** |
| Batches 01–05 modified | ❌ **No** |
| Requirements / FRD / `source/` / `branding/` modified | ❌ **No** |
| Review 006 or the PM captures modified | ❌ **No** |
| Figma touched | ❌ **No** |
| Backend, API contract, database schema | ❌ **No** |
| Batch 06 started | ❌ **No** |
| Open question closed | ❌ **No** |
| Git commit made | ❌ **No** |
