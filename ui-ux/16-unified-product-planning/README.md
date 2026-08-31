# 16 — Unified Screen + Component Reuse Map · Public Catalogue IA

**XR Simulation Learning Platform** · Branch `uiux/full-platform-design` · **29 August 2026**

> ### 🟠 This is a planning phase, not a design batch.
> **No prototype was created. No batch was modified. Batch 06 was not started. No open question was closed. No commit was made.**

---

## What this is

The work `15-post-pm-alignment/11_SAFE_WORK_BEFORE_MONDAY.md` identified as **safe to do before Monday** — `S3` screen-coverage mapping, `S5` component reuse mapping, `S6` public catalogue IA, `S7` public detail content inventory — actually done.

It answers five questions:

| # | Question | Where |
|---|---|---|
| 1 | What exists, and what happens to each piece of it? | `01` · `02` |
| 2 | What would a unified inventory actually look like? | `03` · `04` |
| 3 | What can the public catalogue safely be, before Monday? | `05` · `06` · `07` · `11` |
| 4 | Where do five prototypes contradict each other? | `09` · `10` |
| 5 | What becomes buildable the moment each answer lands? | `12` |

---

## The five findings that matter most

### 1 · Seventy-nine percent of the built work carries forward, and only two screens are removed — both already withdrawn

**78 surfaces inventoried · 71 product screens.** 39 KEEP · 11 KEEP+EXPAND · 6 KEEP+REFRAME · 8 MERGE → 3 canonical · 2 DEFER · 1 SUPERSEDE · 2 BLOCKED · 2 REMOVE.

**Both REMOVE rows are the Super Admin publish screens withdrawn by the 2026-08-25 publication correction.** Nothing in this analysis deletes a screen that currently exists — including Batch 04's, whose **position** is superseded and whose **artefact** is `KEEP + REFRAME`.

### 2 · Fifteen of twenty duplication clusters need no PM answer at all

Twenty clusters where two or more batches solve the same problem. **Fifteen are pure reconciliation** — decidable at Stage 6 without the PM.

**And twenty-four specific items are buildable today with no answer whatsoever** (`12` §1), including three real accessibility defects:

> 🔴 **Batch 01, 02 and 03 render `aria-haspopup="menu"` and `aria-expanded="false"` on an account button that opens nothing.** A screen-reader user is told a menu exists and finds none. It is *"visual-only by declared scope"* — **but the ARIA is not scoped with it**. Present on every screen of three batches. Batch 04 and Batch 05 both built the real thing; adopting either fixes it.

### 3 · Two terminology collisions that the previous audit did not have

Beyond the known `Module` (627) vs `Experiment` (266) split:

| | |
|---|---|
| **`Release`** | Batch 05 **firewalled** the word — *"This is a version decision, not a publication decision."* **Batch 01's shipped copy still uses it to mean publish**: *"will be released to production"*, *"The Content Manager has released this experiment."* **4 occurrences against 368 — the smaller side changes, and no PM answer is needed** |
| **`Version`** | **Two objects, two numbering schemes.** Batch 01: an **integer** counting resubmission rounds. Batch 05: a **dotted semver** on a published module. **No document connects them** |

### 4 · The identity namespace is split, and one data contradiction is live

**Batches 01 and 02 key content as `shear`, `bernoulli`, `torsion`. Batches 03, 04 and 05 use `c_shear`, `c_bern`, `c_torsion`.** The same experiment has two identities; **a consolidated prototype breaks on the first cross-batch link.**

And:

> 🔴 **`torsion` is `MR` / device-unsupported in Batches 01, 03, 04 and 05 — and `VR` / runnable in Batch 02, where the learner completes its simulation.** Batch 02's learner runs an experiment Batch 01 says their device cannot run.

Plus one that reads as a joke until you check it: **Sample Engineering Institute — the institution every other batch names — is not one of Batch 05's five institutions. The platform's only tenant list does not contain the platform's only designed tenant.**

### 5 · The public catalogue IA was built to survive the one answer that could otherwise force a rebuild

`PQ-08` asks whether **technology** is a property of an experiment or a selectable variant. Drawing it as a **hierarchy level** now would create routes (`/experiment/x/vr`) and a breadcrumb depth that **cannot be undone** if the answer is *property*.

So `05` models technology **once**, as an availability set on the experiment, with **three independent renderings**: a badge row, a filter facet, and a selection control that **renders only under the variant reading**. Under the property reading the third is simply absent — **no level, no route, no breadcrumb, nothing to remove later.**

**The same construction is applied to the grouping level above Course (`PQ-04b`) and the access action (`PQ-06`.)** Three slots, each with a defined shape and a defined consequence per filling. *A slot is not a gap.*

---

## The documents

| # | File | What it holds |
|---|---|---|
| **01** | [`01_EXISTING_SCREEN_REUSE_MAP.md`](01_EXISTING_SCREEN_REUSE_MAP.md) | **78 surfaces**, batch by batch — route, states, reuse class, unified destination, modifications, and PM / terminology / visual dependency |
| **02** | [`02_COMPONENT_REUSE_MAP.md`](02_COMPONENT_REUSE_MAP.md) | **194 component records → ~120 canonical**, in eleven categories · **24 consolidation findings** |
| **03** | [`03_UNIFIED_SCREEN_INVENTORY_DRAFT.md`](03_UNIFIED_SCREEN_INVENTORY_DRAFT.md) | **89 draft screens** across nine areas, each with a status and an existing source |
| **04** | [`04_UNIFIED_INFORMATION_ARCHITECTURE_DRAFT.md`](04_UNIFIED_INFORMATION_ARCHITECTURE_DRAFT.md) | One sitemap · four planes · the four hard authority boundaries · **six unresolved joints** · three route collisions |
| **05** | [`05_PUBLIC_CATALOGUE_IA.md`](05_PUBLIC_CATALOGUE_IA.md) | The safe spine, and **the three slots that make it answer-proof** |
| **06** | [`06_PUBLIC_CATALOGUE_SCREEN_MODEL.md`](06_PUBLIC_CATALOGUE_SCREEN_MODEL.md) | Landing · catalogue · course · Institution-vs-Individual entry |
| **07** | [`07_PUBLIC_DETAIL_CONTENT_MODEL.md`](07_PUBLIC_DETAIL_CONTENT_MODEL.md) | **Ten of twelve content regions already exist.** Two do not. One is blocked |
| **08** | [`08_SHARED_SHELL_AND_NAVIGATION_MODEL.md`](08_SHARED_SHELL_AND_NAVIGATION_MODEL.md) | Four planes · two shells, one design system · a **draft** role navigation map with confidence per entry |
| **09** | [`09_STATE_AND_DATA_CONVERGENCE_MAP.md`](09_STATE_AND_DATA_CONVERGENCE_MAP.md) | **24 records** · three incompatible entitlement models · **why PUBLISHED ≠ LEARNER-ENTITLED**, traced record by record |
| **10** | [`10_DUPLICATION_AND_TERMINOLOGY_AUDIT.md`](10_DUPLICATION_AND_TERMINOLOGY_AUDIT.md) | **20 duplication clusters** · **31 terms counted per batch** · the consolidation table |
| **11** | [`11_SAFE_WIREFRAME_SCOPE_BEFORE_PM.md`](11_SAFE_WIREFRAME_SCOPE_BEFORE_PM.md) | **Five ASCII structural wireframes**, every unresolved control drawn as a pending region |
| **12** | [`12_POST_PM_IMPLEMENTATION_HANDOFF.md`](12_POST_PM_IMPLEMENTATION_HANDOFF.md) | **24 items buildable with no answer** · what each `PQ` unlocks · the build order |

### Diagrams

| File | Shows |
|---|---|
| [`diagrams/UNIFIED_SITE_MAP.md`](diagrams/UNIFIED_SITE_MAP.md) | The whole product on one page — **read this first** |
| [`diagrams/SCREEN_REUSE_FLOW.md`](diagrams/SCREEN_REUSE_FLOW.md) | Where every batch's screens go, and the reuse level per batch |
| [`diagrams/PUBLIC_TO_TENANT_TO_LEARNING.md`](diagrams/PUBLIC_TO_TENANT_TO_LEARNING.md) | Vendor build → learner screen, **with the five breaks marked** |

**Every diagram is provided as both Mermaid and ASCII**, so it renders anywhere.

---

## Reuse by batch

| Batch | Reuse | Verdict |
|---|---|---|
| **01** Content governance + XR access | **VERY HIGH** | The shell, the governance chain, the learner core — **and the queue + decision + required-reason + history pattern that fits tenant-application review almost exactly** |
| **02** Assessment | **VERY HIGH** | The assessment core is untouched by 29 August — **and its upload → per-row validation → commit pattern is the CSV import** |
| **03** Institute administration | **HIGH** | The access → eligibility → learner spine, **whose one deliberate blank `PM29-23` fills** — and the two-direction mapping view that becomes tenant allocation |
| **04** B2C learner access | **HIGH** | Card, grid, filter bar, access derivation, three payment outcomes, the account menu — **and the access record as one spine** |
| **05** Super Admin | **MEDIUM–HIGH** | Institutions, releases, device approvals, the configuration **register** — and the scope bar, boundary note and source gap, **which are platform-wide rules, not Super Admin components** |

---

## The twelve things that stay open

**Unchanged from `15-post-pm-alignment`. Nothing here closes any of them.**

Bundle · version-release ownership · B2C approval flow · B2B approval actor · the paid/free rule · the seat model *(confirmed absent)* · the CSV schema · technology pricing · the learner-assignment actor · the Tenant/Institute Admin label *(and the one-role reading)* · Student vs Learner · internal BITS topology.

### Five candidate questions this task surfaced

**Recorded, not asked** — `15/12_PM_CLARIFICATIONS_FOR_MONDAY.md` owns the question list and was not edited.

| # | Candidate |
|---|---|
| **N-1** | **Who authors learning outcomes?** `PM29-03` requires them publicly; no batch has a surface, no FRD field exists, **and no role owns producing them** |
| **N-2** | **Does a public course page show a course code at all?** *"May vary by institution"* — and a public page has no institution |
| **N-3** | **Is a Course an access unit?** The course page's action region is **double-blocked** |
| **N-4** | **How do submission revisions relate to production versions?** Two objects, two schemes, no connection |
| **N-5** | **Is `Discipline` a property of content and `Academic stream` a property of people, or one axis seen twice?** |

---

## What was not done

| | |
|---|---|
| Prototype created | ❌ **No** |
| HTML · CSS · JS written | ❌ **No** |
| Batches 01–05 modified | ❌ **No** |
| `15-post-pm-alignment` modified | ❌ **No** |
| Batch 06 started | ❌ **No** |
| Consolidated prototype created | ❌ **No** |
| Anything renamed | ❌ **No** |
| Bundle defined | ❌ **No** |
| Transaction action finalised | ❌ **No** |
| Role label resolved | ❌ **No** |
| Figma touched | ❌ **No** |
| Backend · API · schema | ❌ **No** |
| Open question closed | ❌ **No** |
| Git commit made | ❌ **No** |

---

## Note on folder numbering

This package is `ui-ux/16-unified-product-planning/`. **16 is the next unused top-level prefix** — `00`–`15` are all occupied, with `12-` and `14-` each already carrying two directories. **No existing directory was reused, renamed or touched.**
