# 05 — Content Hierarchy, Metadata and Bundles

| | |
|---|---|
| **Status** | ✅ **CURRENT CONTENT MODEL OF RECORD** |
| **Created** | 31 August 2026 |
| **Governing decisions** | `STK31-08` · `09` · `10` · `11` · `12` · `13` · `14` · `15` · `45` · `46` |

---

## 1 · The current hierarchy

```
PROGRAMME / DEPARTMENT BUNDLE          e.g. "Civil Engineering"
        │
        ▼
   COURSE SUB-BUNDLE                   e.g. "Soil Mechanics"
        │                              · Course Name
        │                              · Course ID / Code  (may vary by institution)
        ▼
     EXPERIMENT                        the learning / simulation unit
        │                              e.g. "Direct Shear Experiment"
        ▼
 AVAILABLE TECHNOLOGIES                AR · VR · Web / WebGL   (+ MR — see §6)
```

### The worked example given in the review

```
Civil Engineering Bundle
   ├── Soil Mechanics ......................... Course sub-bundle
   │      ├── Direct Shear Experiment ......... AR · VR · Web
   │      └── Consolidation Experiment ........ VR · Web
   ├── Surveying .............................. Course sub-bundle
   │      └── Total Station Experiment ........ AR · Web
   └── Structural Analysis .................... Course sub-bundle
          └── Beam Deflection Experiment ...... VR · Web
```

**An institution may select technologies independently** — see §5.

---

## 2 · Two terminology positions, stated so they are never re-litigated

### 2.1 `EXPERIMENT` is the canonical planning term

`STK31-14`. The Experiment is the actual learning/simulation unit.

**There is NO `Course → Module → Experiment` three-level requirement.** Under the current model, what the historical prototypes call a *Module* is the same object the current model calls an *Experiment*.

| Corpus reality, measured | |
|---|---|
| Batch 01 | `Experiment` — 11 label positions |
| Batch 02 | `Module` — 61 label positions |
| Batch 03 | `Experiment` |
| Batch 04 | **Both** — card chip `Module`, My Learning header `Experiment` |
| Batch 05 | `Module` — 9 label positions |
| Whole corpus | `Module` 627 · `Experiment` 266 |

> **The rename is a consolidation task performed exactly once, in the unified build. Historical batches are not modified.** Doing it twice would touch finished, QA-passed packages twice.

### 2.2 `PROGRAMME / DEPARTMENT` is not the deferred certification program

> ### ⚠ Recorded collision — not resolved by inference
>
> **FRD 3.3.1's only Phase-1 *program* is the *certification program*, which PM-12 deferred to Phase 2.** Batch 03 deliberately refused the word for exactly this reason.
>
> The `Programme / Department Bundle` confirmed by `STK31-12` is an **academic-structure grouping over Courses**. It is a **different object**. **PM-12 is not reversed. No Phase-1 certification experience is created.**

### `Programme` · `Department` · `Academic Stream` — ONE grouping level

**Stakeholder language overlaps these three words and does not conclusively define separate hierarchy levels.** They are therefore carried as **one conceptual grouping level**:

```
PROGRAMME / DEPARTMENT / ACADEMIC STREAM
        ↓
     COURSE
        ↓
   EXPERIMENT
        ↓
 TECHNOLOGY AVAILABILITY
```

Batch 03's existing `Academic stream` records — `s_civil`, *B.E. Civil Engineering* — are treated as **this level under the name that batch used**, not as a second level.

> **No implementation dependency requires `Programme` and `Academic Stream` to be separate records.** The final terminology, and whether this level ever needs an internal sub-level, is a **non-blocking terminology / data-model detail** (`ND-02`).

**The three confirmed rules, which are what actually matter — and all three are settled:**

| # | Rule | Decision |
|---|---|---|
| **1** | The **central / platform side controls** the master academic and content structure | `STK31-10` |
| **2** | The **Tenant does not freely redefine** the canonical catalogue | `STK31-10` · `STK31-25` |
| **3** | **Semester is tenant-selectable and OPTIONAL** | `STK31-11` |

**Safe handling:** model **one grouping record** with a terminology-neutral identity. The catalogue browses it; the tenant maps populations against it. If a distinction between a catalogue-side and a tenant-side grouping is later confirmed, it is an **addition to a level that already exists** — not a restructure.

---

## 3 · The Bundle question, answered

| Old model | Current model |
|---|---|
| A Bundle is an arbitrary group of **three** modules — Batch 04's `o_bgeo` and `o_bmech` | Bundling **follows the academic hierarchy**: a **Programme/Department Bundle** contains **Course sub-bundles**, which contain **Experiments** |

`STK31-13`. **Superseded.** The rejected reading was never FRD-sourced — the v5 glossary says only *"a purchasable group of simulation modules (FRD 6.1.2)"*, **with no cardinality anywhere**.

**What is still not decided, and is not invented here:**

| Not decided | Why |
|---|---|
| **What object carries a price** — the Programme bundle, the Course sub-bundle, the Experiment, or a technology variant | FRD **6.3.x** bundle creation and pricing is **Phase 2**; `ND-08` |
| Overlap handling when a tenant already holds part of a bundle | Batch 04's `GUARD-PARTLY-HELD` / `Q-45`, deferred with the B2C route |
| Whether a Course is directly purchasable | `QP-28` — *"direct course purchase is not specified"* in the FRD |

> **The structure is settled. The commerce over the structure is not, and is deferred with the B2C route and with Phase-2 pricing.**

---

## 4 · Metadata ownership

### 4.1 Canonical (central) metadata — `STK31-09`, `STK31-10`

**Both the Content Manager and the Super Admin may manage central canonical content metadata.** Super Admin holds central master-management authority; Content Manager holds canonical content metadata authority.

| Conceptual master | Owner | Note |
|---|---|---|
| Programme / academic structure | **Super Admin** *(master)* · Content Manager | **Platform-controlled — not freely created by tenants** (`STK31-10`) |
| Course — canonical name and identity | Super Admin · Content Manager | |
| Experiment — canonical name and details | Super Admin · Content Manager | Vendor supplies the **technical** description; the canonical record is central |
| Technology availability per Experiment | Super Admin · Content Manager | Derived from what the Vendor submitted, governed centrally |
| **Learning Outcomes** | **Academic Reviewer** *(authorship)* | `STK31-08` — **not the Vendor** |

**Prohibited:** a Tenant Admin redefining the canonical Experiment catalogue (`STK31-10`, `STK31-25`).

**Still open:** the metadata **schema** itself (`ND-05` / `QD-07`). **No schema is created here.** Batch 01's `VND-04` metadata fields remain labelled **SAMPLE**.

### 4.2 Tenant-specific metadata — `STK31-11`

Tenants may maintain institution-specific mappings:

| Field | Status | Note |
|---|---|---|
| **Local Course Code / reference** | Tenant-owned | **No course-code field exists anywhere in the FRD** *(verified — zero hits)*. *"May vary by institution"* means it belongs to the **tenant mapping**, not the central record |
| **Semester** | 🟢 **OPTIONAL — tenant-selectable, NEVER mandatory** | Supersedes the 29 Aug handwritten "mandatory" marking. Its only FRD appearance is **2.19x Academic Version Locking, Phase 2** |
| Local Faculty / Student / group mapping | Tenant-owned | Built in Batch 03 |
| Plan / access context — e.g. `Subscription`, `BITS Community` | Tenant-scoped | `STK31-19`, `STK31-26`. Mandatory status **pending** (`ND-03`) |

> **Semester must not be made mandatory anywhere** — not in the CSV validation contract, not on the person record, not in the assessment assign step.

### 4.3 Vendor-supplied metadata — `STK31-08`, `STK31-37`

Experiment technical description/details · compiled package **or** hosted link as appropriate · supported technology/device/runtime information · technical documentation · version submissions.

**Source code is not required** unless another source explicitly demands it.

---

## 5 · Technology as a selectable dimension — `STK31-15`

An Experiment may be available in **AR · VR · Web/WebGL**. An institution may select:

```
AR only  ·  VR only  ·  Web only  ·  AR + Web  ·  VR + Web  ·  AR + VR  ·  all available
```

Selection depends on **hardware availability · institution requirements · commercial/access arrangement**.

**Access, licensing and pricing may differ by selected technology. No actual prices are invented.**

### What this changes structurally

| Layer | Before | Now |
|---|---|---|
| Catalogue card / detail | An informational format **badge** | A **selectable technology set** |
| Tenant allocation | Course/Experiment only | Course/Experiment **+ technology variant** (`STK31-24`) |
| Access record | No technology dimension | **Carries the granted technologies** |
| Progress | One completion state per Experiment | **Per assigned technology** (`STK31-36`) |
| Assessment | Attached to the Experiment | ⚪ Attached to the Experiment or to a variant — **not asked, not assumed.** Folded into `ND-08` |

> **The IA planned in `ui-ux/16-unified-product-planning/05_PUBLIC_CATALOGUE_IA.md` was explicitly constructed to survive this answer.** Its slot `S2` renders; no route, breadcrumb or level has to move.

---

## 6 · MR — retained, not dropped

`STK31-45`. The 31 Aug review used the shorthand **AR · VR · WebGL**. **An omission in a spoken list is not a decision.**

| FRD | Format | Runtime |
|---|---|---|
| 1.2.1 | **Web** | Standard browser, no XR hardware |
| 1.2.2 | **VR** | VR headsets — master application, FRD 2.1.1 |
| **1.2.3** | **MR** | **MR hardware (e.g. Ajna Lens) — sideloaded application, FRD 2.1.2** |
| 1.2.4 | **AR** | Android / iOS mobile |

> **MR = inherited source-supported capability unless explicitly removed.** MR carries its own Phase-1 requirements and its own open question (`QP-14` — who authorises sideloading). **Batch 01 designs all four format badges and all four device-compatibility states, and none is removed.**
>
> **"WebGL" appears in no source.** The FRD says *"standard web environments"* / *"standard web browser"*. WebGL names a specific rendering technology. **Use `Web` in product copy; carry `Web / WebGL` only as internal planning vocabulary.**

---

## 7 · Experiment ↔ Course mapping — `STK31-46`

An Experiment maps to a Course; a Course may hold several.

> 🔴 **No batch has a course ↔ experiment relationship at all.** Batch 01's Vendor metadata has **no course field**; Batch 03's courses have **no link to any experiment**. This relationship must exist in the unified data model before the catalogue can be assembled.

**The 5–10 experiments-per-course figure from the handwritten notes is SAMPLE CONTEXT, not a cardinality requirement.** No minimum, maximum, validation rule or capacity assumption follows from it — the same treatment PM-08 gave the Review-005 assessment values.

**Still pending** (`PQ-20`, non-blocking): who performs the mapping — the Vendor at submission, the Content Manager at readiness review, or the Super Admin centrally. **Safe handling:** show the mapping on the Vendor submission form **and** as an editable canonical field, with a provenance line, so the authoritative writer can be settled later without moving the field.

---

## 8 · The public content model for an Experiment — `STK31-17`

| Region | Exists today? |
|---|---|
| Experiment title / identity | ✅ all five batches |
| Programme / Course context | 🔴 **new** — no course context exists on any experiment surface |
| Description / summary | ✅ Batch 04 catalogue and detail; Batch 01 submission metadata |
| **Learning Outcomes** | 🔴 **new** — **no surface anywhere.** Authored by the Academic Reviewer (`STK31-08`) |
| **Preview / video** | 🔴 **new** — no surface anywhere. ⚠ couples to `QX-03` caption/transcript/audio-description ownership, **HIGH and open** |
| Supported technologies | ✅ Batch 01 `XR Format Badge`; Batch 04 `fmtBadges` — **now selectable, not just informational** |
| Device / runtime requirements | ✅ Batch 01 `Device Compatibility` |
| Access / request context | 🔴 **new** — the selection/request action (`STK31-18`) |

**No marketing claims may be invented.** **No price is shown on a public page** until the commercial layer is designed (`ND-08`, `ND-12`).

---

## 9 · Terminology decision table — current positions

| Term | Current position | Confirmed by | Final confirmation still needed? |
|---|---|---|---|
| **Course** | Use `Course`. Stable everywhere | FRD 3.2.1 · `STK31-12` | ❌ No |
| **Experiment** | **Canonical planning term** for the learning unit | `STK31-14` | 🟠 UI copy standardisation only |
| **Module** | Historical prototype vocabulary. **Not used in new work** | `STK31-14` | ❌ No |
| **Programme / Department / Academic Stream** | **ONE** top grouping level — an academic grouping, **not** FRD 3.3.1 | `STK31-12` · `STK31-10` | 🟠 final label only — `ND-02` |
| **Bundle** | Follows the hierarchy. **Never "three arbitrary modules"** | `STK31-13` | 🟠 what carries a price — `ND-08` |
| **Academic stream** | **The same level**, under the name Batch 03 used (FRD 7.2.3) | Batch 03 · `STK31-10` | 🟠 final label only — `ND-02`. **Not a second level** |
| **Technology** | AR · VR · Web *(product copy)*. A **selectable dimension** | `STK31-15` | ❌ No |
| **WebGL** | **Internal planning vocabulary only.** Not product copy | No source uses it | ❌ No |
| **MR** | **Retained.** Fourth supported format | `STK31-45` | ❌ No |
| **Institute Admin / Tenant Admin** | One role, both names internally | `STK31-02` | 🟠 final label — `ND-01` |
| **Student / Learner** | One role, both words | `STK31-01` | 🟠 UI copy standardisation only |
| **Publish** | **First publication of a new Experiment. Content Manager only** | `STK31-06` | ❌ No |
| **Release / Hold** | **Later version decision. Super Admin only** | `STK31-07` | ❌ No — **and the firewall is mandatory** |
| **Simulation** | What runs inside an Experiment. The distinction is kept | FRD 3.1.1 | ❌ No |
| **Discipline** | Batch 04's proven catalogue filter | Batch 04 | 🟠 whether it is a facet of the same grouping level or a separate browse dimension — `ND-02` |
