# 05 — Content Hierarchy and Catalogue Model

| | |
|---|---|
| **Status** | 🟠 **ALIGNMENT MODEL — DRAFT.** Terminology is audited, **not decided** |
| **Created** | 29 August 2026 |
| **Rule** | No final taxonomy is invented. Where two terms compete, both are shown with their source |

---

## 1 · The two hierarchies, side by side

### What the FRD says

```
Certification Program        FRD 3.3.1   ⛔ PM-12 DEFERRED TO PHASE 2
        │
     Course                  FRD 3.2.1   "a collection of modules grouped around
        │                                 an engineering topic or learning objective"
     Module                  FRD 3.1.1   "the smallest learning unit, containing a
        │                                 single XR simulation experience"
        ├── theoretical explanations     3.1.2  optional
        ├── simulation instructions      3.1.2  optional
        └── assessment                   3.1.2  optional

  FORMAT is a PROPERTY of the module, not a child node:
     Web 1.2.1 · VR 1.2.2 · MR 1.2.3 · AR 1.2.4
```

### What the PM directed on 29 August

```
PROGRAM
   │
 COURSE          · Course Name
   │             · Course ID / Code   (may vary by institution)
 EXPERIMENT
   │
 AVAILABLE TECHNOLOGY
     AR · VR · Web / WebGL
```

### Where they agree, and where they do not

| Level | FRD | PM 29 Aug | Status |
|---|---|---|---|
| Top | **Certification Program** — Phase-2 deferred | **Program** | 🟣 **COLLISION** — `PM29-A9` |
| Middle | **Course** | **Course** | ✅ **AGREE** |
| Unit | **Module** = one XR simulation | **Experiment** | 🟠 **Same object, two names** — `PM29-16` |
| Below | Format is a **property** | **Available Technology** as a **level** | 🟣 **DIFFERENT SHAPE** — `PM29-A11` |
| Formats | Web · VR · **MR** · AR (four) | AR · VR · Web/WebGL (three) | 🟣 **MR OMITTED** — not read as removal — `PM29-A10` |

> **The high-confidence part of the PM's hierarchy is `Course → Experiment`.** Under the reading *Experiment ≡ Module*, that is the FRD's own model (3.2.1 + 3.1.1), reinforced by `PM29-17` (an Experiment maps to a Course; a Course holds several). **The level above and the level below are both unresolved.**

---

## 2 · The four hierarchy questions, stated precisely

### 2.1 `PM29-A9` — What is "Programme"?

Three readings, all defensible, none stated:

| Reading | Consequence |
|---|---|
| **The certification program** (FRD 3.3.1) under a shorter name | **PM-12 deferred it to Phase 2.** Building it now reverses PM-12 |
| **An academic programme** — e.g. *B.Tech Civil Engineering* | A **new hierarchy level with no FRD basis**. Possibly the same thing as Batch 03's **Academic stream** (FRD 7.2.3), possibly a level above it |
| **A catalogue grouping** — a browse category, not a content object | No structural change; a presentation-layer grouping only |

**This has already been navigated once, deliberately.** Batch 03 refused the word:

> *"The word 'program' is not used. Its only Phase-1 appearance in the FRD is certification programs (3.3.1), which PM-12 defers to Phase 2. Borrowing it here would collide with a term that already means something else in this product."*

Batch 03 uses **Academic stream** and **Group** — both FRD terms (7.2.3; and *"learners and groups"* in the consolidated FRD). **Whether the PM's *Programme* is the stream, a level above it, or the deferred certification node is exactly what must be asked.** → `PQ-04`

### 2.2 `PM29-16` — Module or Experiment?

The PM stated that a Module is effectively the experiment name/context, and that **the final UI terminology still needs explicit read-back confirmation.**

**This is not an academic question — the built work already disagrees with itself.** See §4.

### 2.3 `PM29-A10` — Is MR still in scope?

The FRD defines **four** Phase-1 formats. The PM named **three**.

**Not read as a removal.** MR has its own Phase-1 requirements (1.2.3 runtime, 2.1.2 sideloaded application) and its own open question (`QP-14`, who authorises sideloading). An omission in a spoken list is not a decision — see the corollary in `02_SOURCE_PRECEDENCE_AND_CONFLICTS.md` §1. **Batch 01 designs all four format badges and all four device-compatibility states; none is removed.** → `PQ-13`

### 2.4 `PM29-A11` — Is technology a level or a property?

`PM29-13` places *Available Technology* below *Experiment*, which only makes structural sense if **one experiment has several technology implementations that can be selected between**. `PM29-18` says the PM did discuss institutions selecting a technology, and that **technology may affect access and commercial selection**.

| If technology is a **property** | If technology is a **selectable variant** |
|---|---|
| Today's model. An experiment *is* a VR experiment, or a Web experiment | An experiment has AR, VR and Web implementations; a tenant or individual obtains one or more |
| Format badges, as built in Batches 01, 03, 04 | A **variant selector** on the experiment page, a variant on the access record, and possibly variant-level pricing |
| No commercial consequence | **Direct commercial consequence** — `PM29-18`, `PQ-08` |

⚪ **Not decided here.** The difference changes the catalogue, the detail page and the access record.

---

## 3 · Metadata

### 3.1 Course — as directed

| Field | Basis | Status |
|---|---|---|
| **Course Name** | `PM29-15` · FRD 3.2.1 implies a name | 🔵 Directional; no FRD field definition |
| **Course ID / Code** | `PM29-15` — *"may vary by institution"* | 🟣 **No course-code field exists anywhere in the FRD.** Verified by direct search — zero hits for *course code* / *course id* |

> **"May vary by institution" is a data-model statement, not a UI statement.** If the same course carries a different code per institution, the code belongs to the **tenant's mapping**, not to the central content record. That is a structural consequence and is **not resolved here.**

### 3.2 Experiment — as already supported

Fields that already exist in the built work, so a public detail page is largely re-composition:

| Field | Where it exists today |
|---|---|
| Experiment identity / name | All five batches |
| Supported technology (format badges) | Batch 01 `XR Format Badge`; Batch 04 `fmtBadges` |
| Description / summary | Batch 04 catalogue and detail; Batch 01 submission metadata |
| Device / runtime requirement | Batch 01 `Device Compatibility` — *"VR headset — e.g. Meta Quest"* |
| Contents present — resources, assessment | Batch 04 module detail |
| Discipline | Batch 04 catalogue |
| Version | Batch 01 governance; Batch 05 releases |
| **Learning outcomes** | 🔴 **No surface anywhere** — new from `PM29-03` |
| **Preview / video** | 🔴 **No surface anywhere** — new from `PM29-03`. ⚠ Couples to `QX-03` (caption/transcript ownership), which is **HIGH and open** |

### 3.3 Institutional learner metadata — `PM29-25`

Handwritten as mandatory: Programme · Course Name · Course ID/Code · Semester · Student ID · Student Name · Student Email. Organisation: *not mandatory*.

> 🟠 **NEEDS READ-BACK BEFORE ANY SCHEMA.** A mandatory-field list is a validation contract. **No source contains a person schema**, *Semester* appears once in the whole v5 set (in a **Phase-2** version-locking line), and no course-code field exists. Detail in `01_PM_2026-08-29_DECISION_EXTRACTION_DRAFT.md` `PM29-25`. → `PQ-10`

---

## 4 · Terminology conflict table

**Every "current use" column below was verified by direct inspection of the batch sources, not recalled.**

| Term | Current use | PM direction (29 Aug) | Conflict | Recommended **temporary** position | Final confirmation needed? |
|---|---|---|---|---|---|
| **Course** | FRD 3.2.1 · Batch 02 (13 refs) · Batch 03 academic structure · Batch 04 (6 refs) | **Course** | **None** | **Use `Course`.** Stable everywhere | ❌ No |
| **Module** vs **Experiment** | 🔴 **The batches disagree.** Batch 01 `Experiment` (11 label refs, 89 total) · Batch 02 `Module` (61 label refs) · Batch 03 `Experiment` · Batch 04 **both** · Batch 05 `Module` | **Experiment**, with Module ≈ the experiment name/context | 🔴 **ACTIVE, SHIPPED INCONSISTENCY** | **Freeze. Change nothing.** Audit only, until read-back | ✅ **YES — `PQ-04`** |
| **Bundle** | FRD glossary: *"a purchasable group of simulation modules (6.1.2)"*, no cardinality · Batch 04: id-list granting each module individually | PM **rejected** *"arbitrary group of three"*; **no replacement given** | 🔴 **DEFINITION IN QUESTION** | **Do not use the word in new work.** Batch 04 unchanged | ✅ **YES — `PQ-02`** |
| **Programme** | **Avoided deliberately** in Batch 03. FRD: only *certification program* (3.3.1, PM-12 deferred) | Top hierarchy level | 🟣 **COLLISION with a deferred term** | **Do not introduce.** Use `Academic stream` where a tenant grouping is meant | ✅ **YES — `PQ-04`** |
| **Category / Subcategory** | Not used anywhere. Batch 04 uses **Discipline** as a filter | *"categories / programmes / courses / experiments"* in the discovery description | 🟠 New browse vocabulary | **Use `Discipline`** — it exists and is proven. Treat *category* as browse-only, not a content object | 🟠 Only if it becomes a content object |
| **Technology** | Format / XR format — *Web · VR · MR · AR*, four values | *Available Technology* — AR · VR · Web/WebGL, three values, as a **hierarchy level** | 🟣 **Different shape + MR missing + WebGL unsourced** | **Keep four formats as a property.** Do not say *WebGL* in product copy | ✅ **YES — `PQ-13`, `PQ-08`** |
| **Tenant Admin** / **Institute Admin** | `Institute Admin` — FRD 8.1.3 and every Batch-03 artefact | Both, interchangeably | 🟠 Label only | **Keep `Institute Admin`** until read-back — it is the FRD term and the built term | ✅ **YES — `PQ-09`** |
| **Student** / **Learner** | One role, two words, used interchangeably everywhere | Diagram implies **two** things | 🟠 Possible split | **Keep as one role in two contexts** | ✅ **YES — `PQ-12`** |
| **Experiment** vs **Simulation** | FRD 3.1.1 — a module *contains* a single XR **simulation**. Batch 01 uses both correctly (an experiment has a simulation) | *Experiment* | ⚪ Minor | **Keep the distinction.** The experiment is the learning unit; the simulation is what runs | ❌ No |

### 4.1 The measured evidence for the Module/Experiment conflict

| Batch | Focus | `Experiment` labels | `Module` labels | Reads as |
|---|---|---|---|---|
| **01** | Vendor · Reviewer · CM · Learner XR | **11** | 0 | Experiment |
| **02** | Faculty · Learner assessment | 0 | **61** | Module |
| **03** | Institute Admin | 1 *(+26 lowercase)* | 0 | Experiment |
| **04** | B2C learner | 3 | **23** | **Both — inconsistently** |
| **05** | Super Admin | 0 | **9** | Module |

**Batch 04 says both, on adjacent screens**: its catalogue card chip reads `Module`, while its My Learning table header reads `Experiment` and its caption reads *"Experiments you have access to"*.

> **A consolidated prototype would surface this on the very first click-through.** It is the clearest single reason `PQ-04` belongs in MUST ANSWER — and the clearest reason **not** to start consolidating before Monday.

---

## 5 · Catalogue model — the part that is safe

**Safe because it holds under every plausible Monday answer:**

```
CATALOGUE
   │
   ├── Browse by grouping ......... Discipline (exists, Batch 04)
   │                               ⚪ Programme / Category — PENDING
   │
   ├── Course ..................... name · code ⚪ · experiments it holds
   │      │
   │      └── Experiment .......... identity · supported technology ·
   │                                description · learning outcomes 🔴 ·
   │                                preview/video 🔴 · device requirement ·
   │                                contents · access information
   │
   └── Search + filter ............ four controls, proven in Batch 04
```

**Not safe, and therefore not modelled:**

| Excluded | Reason |
|---|---|
| Pricing visibility on a public page | `PM29-04` — explicitly "do not invent" |
| The CTA on an experiment page | `PM29-A6` — add-to-request? add-to-cart? request access? sign in? **All four imply different products** |
| Bundle as a catalogue object | `PM29-A2` — definition in question |
| Technology as a selectable variant | `PM29-A11` · `PM29-18` |
| A *Programme* browse level | `PM29-A9` |
| How much detail a non-entitled visitor sees | `OQ-05`, partly addressed by `PM29-02` but **not** as to depth. Batch 04's `DA-02` covers this and is reversible |

---

## 6 · What changes for the built catalogue, and what does not

| Batch 04 asset | Under public-first discovery |
|---|---|
| Catalogue card component | ✅ **Reusable.** Six fields, one action, fixed-height blocks |
| Grid + four filter controls | ✅ **Reusable** |
| Module detail page | ✅ **Reusable** — gains learning outcomes and preview |
| Access-state derivation (`none` / `some` / `all`) | ✅ **Reusable** — a signed-out visitor is simply the `none` case with a different CTA |
| Bundle detail page | ⚪ **Blocked** — `PM29-A2` |
| Card **action** (`View details` → `Get access`) | 🔴 **Changes** — `PM29-A6` |
| Catalogue **position** (behind sign-in) | 🔴 **Changes** — `PM29-02` |
| `Module` / `Experiment` labels | 🔴 **Changes**, once, after `PQ-04` |

**The components survive. The journey around them is what moves.**
