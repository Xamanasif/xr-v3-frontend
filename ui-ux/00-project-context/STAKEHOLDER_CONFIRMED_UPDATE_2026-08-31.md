# Stakeholder Confirmed Update — 31 August 2026

| | |
|---|---|
| **Document ID** | `STAKEHOLDER_CONFIRMED_UPDATE_2026-08-31` |
| **Review date** | **31 August 2026** |
| **Document created** | 31 August 2026 |
| **Status** | ✅ **AUTHORITATIVE** for the statements it contains |
| **Type** | Stakeholder confirmation capture. **Not** a design document, not a review, not an FRD amendment, not a redesign |
| **Source** | The **31 Aug stakeholder review** — a second detailed review attended by the project intern/designer, a second project intern, the Project Manager, and a primary project stakeholder to whom the product is being presented/delivered — **plus written follow-up answers from that stakeholder**, plus handwritten meeting notes and direct user clarification of what was said |
| **Extends** | `PM_CONFIRMED_BASELINE_2026-08-18.md` (PM-01 – PM-12) · `ui-ux/12-full-platform-reframe/13_PM_CLOSURE_DECISIONS.md` (PM-13 – PM-15) · `PM_CONFIRMED_UPDATE_2026-08-25.md` (PM-16 – PM-18) |
| **Supersedes** | Only where a decision below says so **explicitly**, in its own `Supersedes` row |
| **Does not supersede** | `source/Platform FRD_v4.pdf` · `requirements/updated-frd/*` · the 18 / 19 / 25 August captures · Review 005 · Review 006 — **all unchanged and unedited** |
| **Applies to** | The whole platform. Batches 01–05 (`ui-ux/13-full-platform-design/`) are **read-only**; impact is recorded in `ui-ux/17-stakeholder-correction-blueprint/` |
| **Files modified by this document** | **0** |

---

## A note on attribution — read this first

> **The stakeholder's formal company title is deliberately not asserted anywhere in this document or in any document that cites it.**
>
> The source is referred to as the **"31 Aug stakeholder review"** or the **"stakeholder-confirmed follow-up"**. Where a statement came specifically from the written answers supplied after the meeting, it is marked **written follow-up**. Where it came from the meeting itself, it is marked **31 Aug review**. Where it came from the co-intern's handwritten notes or the user's direct clarification of what was said, it is marked as such.
>
> Nothing in this document should be read as a claim about anyone's role, seniority or authority within any organisation.

---

## Authority rule

The rules established by the 18 August baseline continue to apply unchanged, with one addition.

1. These statements are **stakeholder-confirmed** and take precedence over prior assumptions, assistant recommendations, and Review-005 / Review-006 decisions **on the specific point they address**.
2. **The original FRD is never rewritten.** `source/Platform FRD_v4.pdf` and `requirements/updated-frd/*` remain unchanged.
3. **FRD deviations, extensions and gaps are recorded, not silently applied.** Every one is listed in §D.
4. **Earlier documents are not edited to hide a superseded model.** The 18 / 19 / 25 August captures, Review 006, and `ui-ux/15-post-pm-alignment/` are historical records and remain as written.
5. **NEW — an override is written down as an override.** Where a decision below reverses or replaces an earlier PM decision or an FRD position, the `Supersedes` row names it. **Nothing is silently reconciled.**

### Standing of this document

> **The written stakeholder follow-up is the highest-precedence current source for this project.** Together with the 31 Aug stakeholder + PM review, the meeting notes and the clarification of the previously ambiguous portions, it was supplied specifically so that these decisions could be settled.
>
> **The decisions recorded here are therefore the current project source of truth. They are not provisional, and they are not to be reopened.**
>
> Only the genuinely unresolved **implementation details** listed in §C remain pending. This documentation is based on stakeholder input supplied for the project; **no independent external verification of that input was performed or is claimed.**

### What this document does *not* do

- It does **not** edit `PM_CONFIRMED_BASELINE_2026-08-18.md`, `PM_CONFIRMED_UPDATE_2026-08-25.md`, or `PROJECT_CONTEXT.md`.
- It does **not** modify Batches 01–05, `ui-ux/15-post-pm-alignment/`, or `ui-ux/16-unified-product-planning/`.
- It does **not** create a prototype, a screen, a schema, an API contract, or a price.
- It does **not** delete B2C work. Batch 04 is preserved in full.
- It does **not** create an eighth role.

---

## Source precedence applied throughout

```
1.  Explicit written stakeholder follow-up answers, 31 Aug 2026
2.  Explicit, unambiguous decisions from the 31 Aug stakeholder / PM review
3.  User clarification of what was said in that meeting, incl. co-intern handwritten notes
4.  PM_CONFIRMED_UPDATE_2026-08-25          (PM-16 · PM-17 · PM-18)
5.  PM_CONFIRMED_BASELINE_2026-08-18        (PM-01 … PM-12)
    + 13_PM_CLOSURE_DECISIONS               (PM-13 · PM-14 · PM-15)
6.  FRD v5 consolidated set (Core · TL · Detailed) over source/Platform FRD_v4.pdf
7.  Review 006 (ui-ux/12-full-platform-reframe/)
8.  Historical prototype assumptions (Batches 01–05, DA-nn / D-nn)
```

**Relationship to `ui-ux/15-post-pm-alignment/01_PM_2026-08-29_DECISION_EXTRACTION_DRAFT.md`.** That document is a **draft extraction** of the 29 August discussion. It deliberately preserved **twelve ambiguities** (`PM29-A1` … `PM29-A12`) and raised **ten must-answer questions** (`PQ-01` … `PQ-10`, plus `PQ-11` … `PQ-21`). **The 31 Aug review and written follow-up answer most of them.** This document records those answers. The draft is **not edited**; its status changes to *superseded on the points answered below*, which is recorded here and not in that file.

### Confidence legend

| | |
|---|---|
| ✅ **CONFIRMED** | Settled outright by the written follow-up or by an explicit, unambiguous statement in the 31 Aug review. Safe to build against |
| 🔵 **DIRECTIONAL** | A clear instruction about what the product must do. Safe to design toward. The exact surface still requires design work |
| 🟠 **CONFIRMED — DETAIL PENDING** | The rule is settled; one named implementation detail is not. The detail is listed in §C and in `17/16_REMAINING_NONBLOCKING_DETAILS.md`, and **is not a blocker** |

---

# B · The decision register

**48 decisions, `STK31-01` … `STK31-48`.**

---

## Roles

### `STK31-01` — Seven formal roles. Student and Learner are ONE role
✅ **CONFIRMED**

The platform has **seven formal roles**, and no eighth:

```
1. Student / Learner        5. Academic Reviewer
2. Faculty                  6. Content Manager
3. Institute Admin /        7. Super Admin
   Tenant Admin
4. Vendor
```

**Student and Learner are the same formal role.** Only the *context* differs — **B2B**: an institutional Student/Learner under a Tenant. **B2C**: an individual Student/Learner. **No separate `Student` role and `Learner` role, and no separate permission sets, may be created.**

Until final UI copy is standardised, the canonical **planning** term is **`Student / Learner`**.

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up |
| **Previous position** | `PM29-A8` / `PQ-12` — **OPEN.** The 29 Aug handwritten diagram showed `Super Admin → Learner` and `Tenant Admin → Student`, which *suggested* a split. `ui-ux/15-post-pm-alignment/04_ROLE_AND_AUTHORITY_MODEL.md` §5 recorded the split as possible and expensive |
| **Affected areas** | Every learner-facing surface across Batches 01–04; the role matrix; the unified IA; all learner copy |
| **Supersedes** | **`PM29-A8` is CLOSED.** No supersession of a confirmed rule — it **reinforces** `PM_CONFIRMED_BASELINE_2026-08-18` §B (*"B2C Individual Learner is a business/user context, not an eighth role"*) and **reinforces PM-07** |

---

### `STK31-02` — Institute Admin and Tenant Admin are the same formal role
✅ **CONFIRMED** *(role identity)* · 🟠 **DETAIL PENDING** *(final product-facing label)*

**Institute Admin** and **Tenant Admin** refer to **the same conceptual formal role**. Internally, continue writing **`Institute Admin / Tenant Admin`** until the final product-facing label is standardised.

**No eighth role is created by this.**

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up |
| **Previous position** | `PM29-09` — **PM-DIRECTION, HIGH CONFIDENCE, not read back.** `PQ-09(a)` asked exactly this and is now answered. `PQ-09(b)` (the label) remains a naming choice |
| **Affected areas** | Batch 03 in full (`INA-01`…`INA-13`, every route and string); the role matrix; the unified IA |
| **Supersedes** | Closes the **interpretation** half of `PQ-09`. The **label** half stays open as a non-blocking detail (`ND-01`) |

---

### `STK31-03` — Internal content teams operate through the Vendor role
✅ **CONFIRMED**

If BITS / WILP or any other internal team develops an Experiment, **they operate through the VENDOR role and the Vendor workflow.**

**`Vendor` means: content producer / submitter.** It may represent an external vendor **or** an internal BITS/WILP content-development team.

**Do not create** `Internal Content Developer`, `BITS Content Developer`, or `Faculty Content Uploader` as additional formal roles.

| | |
|---|---|
| **Source** | 31 Aug review — explicitly resolved |
| **Previous position** | Not previously asked. Implicit risk: an internal-content path could have been read as needing its own role, which PM-07 (seven roles) and FRD 8.3 (custom roles, **Phase 3**) both forbid |
| **Affected areas** | Batch 01 Vendor workspace copy; the role model; Super Admin role governance |
| **Supersedes** | Nothing. **Reinforces PM-07** and FRD 1.4.5 (*a vendor never publishes*) — which applies to internal submitters too |

---

## Delivery priority

### `STK31-04` — B2B is the current delivery priority; direct self-service B2C is deferred
✅ **CONFIRMED** *(priority)* · 🔵 **DIRECTIONAL** *(scope handling)*

**WILP / institutional B2B is the immediate focus.** The B2B model is to be proved and stabilised first. **B2C may be launched later if the B2B model succeeds.**

Therefore:

| | |
|---|---|
| **B2B** | **CURRENT DELIVERY PRIORITY** |
| **B2C** | **DEFERRED / SECONDARY ROLLOUT** |

**Direct B2C self-service commerce is NOT the current primary implementation path**, and **B2C checkout architecture must not drive the unified Phase-1 build**.

**B2C designs are not deleted.** Batch 04 remains reusable historical work and a preserved secondary route.

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up |
| **Previous position** | **`PM-04` (18 Aug), verbatim:** *"Both B2B institutional users and B2C individual learners are required. **Do NOT treat B2B-first / B2C-second as a PM-confirmed release sequence.** Both must be represented in the platform architecture."* `PM29-05` (29 Aug) pointed against it at direction level; `ui-ux/15-post-pm-alignment/` resolved that conflict only **partially** and left the Phase-1 *scope* of B2C **OPEN** (`PQ-07(b)`) |
| **Affected areas** | Batch 04 in full (classification, not artefact); the unified implementation sequence; the public catalogue's primary action; all commercial modelling |
| **Supersedes** | 🔴 **YES — this explicitly overrides the PM-04 prohibition on B2B-first sequencing.** The override is deliberate and is recorded here rather than reconciled away. **`PM-04`'s other half — that both audiences must be *represented in the architecture* — is NOT overridden**; B2C remains in the architecture as a deferred route |

> **FRD relationship — recorded.** FRD 1.1.2 (B2B) and 1.1.3 (B2C) are **both Phase 1** with no sequencing between them, as are 1.3.2, 1.3.3, 6.1.1, 6.1.2, 6.2.1, 6.2.2. **This decision sequences delivery; it does not remove any requirement from Phase 1.** The FRD is not edited.

---

### `STK31-05` — Known future B2C commercial periods are preserved
✅ **CONFIRMED**

Future B2C access periods: **Monthly · Quarterly · Yearly**. **There is no Lifetime access option.**

These are **preserved for the deferred B2C rollout**. They are not built into the current B2B Phase-1 delivery.

| | |
|---|---|
| **Source** | 31 Aug review, reaffirming `PM29-19` (29 Aug) |
| **Previous position** | `PM29-19` — ✅ confirmed period set, ⚪ timing open. Batch 04 deliberately shows **no** term, renewal, recurrence or cancellation anywhere |
| **Affected areas** | Batch 04 access spine (an **addition**, not a retraction); `U-IND-01` period selector |
| **Supersedes** | Nothing. Timing is now settled by `STK31-04` — **deferred, preserved** |

> **FRD relationship — recorded.** FRD 6.1.1 / 6.1.2 are **purchase** requirements; recurring **subscription billing (9.3.2) is Phase 2**. A period model therefore either pulls part of 9.3.2 forward or describes a fixed-term grant. **That distinction is still not stated** — see `ND-06`.

---

## Content production and release

### `STK31-06` — First publication of a NEW Experiment is owned by the Content Manager
✅ **CONFIRMED** — **RESOLVED**

For a **new** Experiment:

```
Vendor  →  Academic Reviewer  →  Content Manager  →  Published
```

The **Content Manager**:

- controls the **Content Library**
- handles **new Experiment approval at the first instance**
- performs the **first publication** of new Experiments

**Super Admin is NOT the first-publication owner.**

| | |
|---|---|
| **Source** | stakeholder-confirmed follow-up — explicitly resolved |
| **Previous position** | **FRD 1.4.4** — *"Only the Super Admin shall have permission to publish approved modules to the production environment."* Overridden on 25 Aug by **PM-16 / PM-17 / PM-18**. The 29 Aug transcript reopened the area as `PM29-A1` / `PQ-01` |
| **Affected areas** | Batch 01 `S07` (`CM-02` Content Readiness & Publication), `S10` (`CM-03` Published Content); Batch 05 boundary; all governance copy |
| **Supersedes** | 🔴 **Explicitly reinforces and re-states the PM-16/17/18 override of FRD 1.4.4**, and **closes `PM29-A1` / `PQ-01` on the first-publication half.** Any historical ambiguity placing Super Admin at the first publication gate is **superseded** |

---

### `STK31-07` — Release / hold of a LATER version is owned by the Super Admin
✅ **CONFIRMED** — **RESOLVED**

For an **already-published** Experiment, a **separate version lifecycle** applies:

```
current released version  →  newer approved version  →  SUPER ADMIN Release / Hold decision
```

**Super Admin controls release/hold of later versions.**

**Reason stated in the 31 Aug review:** the Super Admin has platform-wide visibility into who is using the existing version, and can manage or notify affected users before the replacement lands.

**The terminology firewall must be preserved in the unified UX:**

| Event | Owner | Word to use |
|---|---|---|
| **FIRST PUBLICATION** of a new Experiment | **Content Manager** | *Publish* |
| **LATER VERSION RELEASE / HOLD** | **Super Admin** | *Release* / *Hold* |

**These are two different actions on two different objects. The words must not be used interchangeably anywhere.**

| | |
|---|---|
| **Source** | stakeholder-confirmed follow-up — explicitly resolved, with the reason stated |
| **Previous position** | `PM29-A1` / `PQ-01` — ⚪ **OPEN, highest-priority ambiguity of the 29 Aug meeting.** Batch 05 kept `SA-04` / `SA-05` (FRD 2.3.2) isolated and explicitly reversible, pending exactly this answer |
| **Affected areas** | Batch 05 `SA-04` / `SA-05` — **KEEP, confirmed, no longer provisional**; Batch 01's four *"release"* strings that currently mean *publish* — **must be re-worded**; the version-scheme reconciliation |
| **Supersedes** | **Closes `PM29-A1` / `PQ-01`.** Confirms **FRD 2.3.2** as live and Super-Admin-owned. **Does not disturb PM-16/17/18 or `STK31-06`** |

> **Recorded, still open:** `QP-26` — *may the Super Admin return a submission at the first-publication gate?* The 31 Aug review states **who releases later versions**. It says nothing about return authority at the publication gate. **`QP-26` remains OPEN** and is listed as `ND-13`.

---

### `STK31-08` — Content ownership and responsibility model
✅ **CONFIRMED**

| Role | Owns |
|---|---|
| **Vendor** | Develops/submits the Experiment · Experiment technical description/details · compiled package **or** hosted link as appropriate · supported technology / device / runtime information · technical documentation · version submissions |
| **Academic Reviewer** | Academic validation · Course/Experiment academic alignment · **Learning Outcomes** · the academic review decision |
| **Content Manager** | Content Library control · first approval/publication · canonical content / master metadata management |
| **Super Admin** | Canonical/master metadata management (also permitted) · tenant governance · later-version Release/Hold · platform-level role and content allocation governance |

**No additional approval gates may be invented.**

| | |
|---|---|
| **Source** | stakeholder-confirmed follow-up |
| **Previous position** | **Learning-outcome ownership was undefined.** `ui-ux/16-unified-product-planning/01_EXISTING_SCREEN_REUSE_MAP.md` records *"candidate home for learning outcomes"* on the **Vendor** submission screen (`S02`) with an explicit `N-1` flag — *who authors outcomes*. FRD 1.4.2 assigns **academic validation** to the BITS academic team but names no outcome author |
| **Affected areas** | Batch 01 `S02` (Vendor metadata) and `S05` (Academic Review); the public Experiment detail page; canonical metadata surfaces |
| **Supersedes** | 🔴 **Resolves the learning-outcome ownership ambiguity in favour of the Academic Reviewer.** **Vendor does NOT own Learning Outcomes.** Closes `N-1` |

---

## Metadata

### `STK31-09` — Canonical metadata may be managed by Content Manager AND Super Admin
✅ **CONFIRMED**

**Both** the **Content Manager** and the **Super Admin** may manage central **canonical content metadata**.

Central catalogue data includes conceptual masters such as: **Programme / academic structure · Course · Experiment canonical names and details · technology availability.**

**Super Admin** holds central **master-management** authority. **Content Manager** also holds canonical **content** metadata authority.

| | |
|---|---|
| **Source** | stakeholder-confirmed follow-up |
| **Previous position** | `QD-07` — *what metadata schema does FRD 1.4.3 review?* — **open since Review 006.** The **owner** was equally undefined; FRD 8.1.2 gives the Content Manager *"metadata"* with no scope |
| **Affected areas** | A new canonical-metadata surface (Super Admin **and** Content Manager); Batch 01 `S07`; Batch 05 |
| **Supersedes** | Nothing. Answers the **ownership** half of `QD-07`; the **schema** half stays open (`ND-05`) |

---

### `STK31-10` — Academic streams / programmes are platform-controlled
✅ **CONFIRMED**

Academic streams / programmes are **platform-controlled**, not freely created by every tenant.

**Tenant Admin may NOT redefine the canonical Experiment catalogue.**

| | |
|---|---|
| **Source** | stakeholder-confirmed follow-up |
| **Previous position** | Undefined. Batch 03 shows academic structure as **view-only, sourced from institution data**, with no authoring control — a conservative choice now validated |
| **Affected areas** | Batch 03 `INA-04` / `INA-05` — **validated as-is**; the canonical metadata surface; tenant content allocation |
| **Supersedes** | Nothing. **Validates Batch 03's read-only academic structure** |

---

### `STK31-11` — Tenant-specific metadata exists; Semester is OPTIONAL
✅ **CONFIRMED**

Tenants may maintain **institution-specific mappings** where relevant, including:

- local **Course Code / reference**
- **Semester**, where relevant
- local Faculty / Student / group mapping

**SEMESTER is tenant-selectable, OPTIONAL, and NOT mandatory. It must not be made mandatory anywhere.**

| | |
|---|---|
| **Source** | stakeholder-confirmed follow-up |
| **Previous position** | 🔴 **The 29 Aug handwritten notes marked `Semester` as MANDATORY** (`PM29-25`). `ui-ux/15-post-pm-alignment/` refused to build a schema from handwriting and flagged that *Semester*'s only appearance in the whole FRD v5 set is **FRD 2.19x Academic Version Locking — a Phase-2 requirement about locking a module version, not a learner record** |
| **Affected areas** | CSV import columns; Batch 03 person record; Batch 02 `B02-assign` course/semester slot; validation rules |
| **Supersedes** | 🔴 **YES — any previous assumption that Semester is mandatory is SUPERSEDED.** The handwritten `PM29-25` mandatory marking on Semester is overridden by the written follow-up |

---

## Content hierarchy

### `STK31-12` — The current content hierarchy
✅ **CONFIRMED**

```
PROGRAMME / DEPARTMENT / ACADEMIC STREAM      ← ONE grouping level (see the note below)
        ↓
   COURSE SUB-BUNDLES
        ↓
     EXPERIMENTS
        ↓
 AVAILABLE TECHNOLOGIES        (at minimum: AR · VR · Web / WebGL)
```

**Worked example given in the review:**

```
Civil Engineering Bundle
   ├── Soil Mechanics (Course)
   │      ├── Direct Shear Experiment
   │      └── Consolidation Experiment
   ├── Surveying (Course)
   │      └── Total Station Experiment
   └── Structural Analysis (Course)
          └── Beam Deflection Experiment
```

Each Experiment can expose its supported technologies (AR / VR / WebGL). **The institution may select technologies independently.**

| | |
|---|---|
| **Source** | 31 Aug review, with the worked example · stakeholder-confirmed follow-up |
| **Previous position** | `PM29-13` gave `Program → Course → Experiment → Available Technology` at direction level, with **two flagged conflicts**: `PM29-A9` (what *Programme* is) and `PM29-A11` (is technology a level or a property?). `PQ-04(b)` asked the first; `PQ-08` asked the second. Both were **OPEN** |
| **Affected areas** | The public catalogue IA (slots `S1` and `S2` in `16/05_PUBLIC_CATALOGUE_IA.md` now have fillings); the whole catalogue; the access record; Batch 04 |
| **Supersedes** | 🔴 **Closes `PM29-A9` and `PM29-A11`.** *Programme / Department* is an **academic-structure grouping**, and technology is an **exposed, selectable dimension** of an Experiment, not merely an informational badge |

> ### ⚠ Terminology collision — recorded, NOT resolved by inference
>
> **FRD 3.3.1's only Phase-1 *program* is the *certification program*, which PM-12 deferred to Phase 2.** Batch 03 avoided the word deliberately for exactly this reason.
>
> **The `Programme / Department Bundle` confirmed here is a DIFFERENT object from FRD 3.3.1.** It is an academic-structure grouping over Courses. **Nothing in this decision reverses PM-12, and no Phase-1 certification experience is created.**

> ### `Programme` · `Department` · `Academic Stream` — ONE grouping level
>
> The stakeholder language **overlaps** these three words and does **not** conclusively define separate hierarchy levels. **They are therefore carried as one conceptual grouping level:**
>
> ```
> PROGRAMME / DEPARTMENT / ACADEMIC STREAM
>          ↓
>       COURSE
>          ↓
>     EXPERIMENT
>          ↓
>  TECHNOLOGY AVAILABILITY
> ```
>
> **The confirmed rules are the ones that matter, and all three are settled:**
> - the **central / platform side controls** the master academic and content structure (`STK31-10`);
> - the **Tenant does not freely redefine** the canonical catalogue (`STK31-10`, `STK31-25`);
> - **Semester is tenant-selectable and OPTIONAL** (`STK31-11`).
>
> **No implementation dependency requires `Programme` and `Academic Stream` to be separate records.** The final terminology, and whether this level ever needs an internal sub-level, is a **non-blocking terminology / data-model detail** — `ND-02`.
>
> Batch 03's existing `Academic stream` records are treated as **this level under the name that batch used**, not as a second level.

---

### `STK31-13` — The old "Bundle = exactly three arbitrary modules" model is superseded
✅ **CONFIRMED**

The Batch-04-era concept **"a Bundle is exactly three arbitrary modules"** is **not** the final model.

The current model is the **Programme / Department Bundle → Course sub-bundle** structure of `STK31-12`. Bundling follows the academic hierarchy; it is not an arbitrary grouping with a fixed count.

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up |
| **Previous position** | `PM29-A2` / `PQ-02` — ⚪ **OPEN.** The PM rejected *"a bundle is an arbitrary group of three modules"* on 29 Aug **without naming a replacement**, and four candidate meanings were recorded. **The FRD's own glossary carries no cardinality** — *"A purchasable group of simulation modules (FRD 6.1.2)"* — so the rejected reading was never sourced. Batch 04 built `o_bgeo` and `o_bmech` as three-module id-lists |
| **Affected areas** | Batch 04 `B2C-03` Bundle detail, `GUARD-PARTLY-HELD`, `Q-45` overlap handling; the catalogue; what object carries a price |
| **Supersedes** | 🔴 **YES — closes `PM29-A2` / `PQ-02` structurally.** The three-module bundle is superseded as the model. **Bundle *pricing* is a separate matter and remains uninvented** — FRD 6.3.x (bundle creation and pricing) is **Phase 2** |

---

### `STK31-14` — `Experiment` is the canonical planning term; there is no Course → Module → Experiment triple
✅ **CONFIRMED** *(the model)* · 🟠 **DETAIL PENDING** *(final UI copy standardisation)*

The **Experiment** is the actual learning / simulation unit.

**Do NOT create `Course → Module → Experiment` as three separate required levels.**

For the current implementation model, use **`EXPERIMENT`** as the canonical planning term. Global terminology migration is recorded as a **consolidation task**. **Historical batches are not modified.**

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up |
| **Previous position** | `PM29-16` / `PQ-04(a)` — 🟠 **needed read-back.** 🔴 **A measured, shipped inconsistency exists:** Batch 01 uses `Experiment` (11 label positions), Batch 02 uses `Module` (61), Batch 03 `Experiment`, Batch 05 `Module` (9), and **Batch 04 uses both — card chip `Module`, My Learning header `Experiment`.** Corpus scale: `Module` 627 · `Experiment` 266 |
| **Affected areas** | **All five batches.** The largest mechanical change in the platform — Batch 02 and Batch 04 carry the heaviest label loads |
| **Supersedes** | 🔴 **Closes `PM29-16` / `PQ-04(a)` at planning level.** *Module* is retained only as historical prototype vocabulary. **The rename happens ONCE, in the unified build — not in the historical batches** |

---

### `STK31-15` — Technology-specific access and selection
✅ **CONFIRMED** *(the model)* · 🟠 **DETAIL PENDING** *(commercial construction)*

An Experiment may be available in **AR**, **VR**, and **Web / WebGL**.

An institution may select any combination: **AR only · VR only · Web only · AR + Web · VR + Web · AR + VR · all available technologies.**

Selection depends on: **hardware availability · institution requirements · commercial / access arrangement.**

**Access, licensing and pricing may differ by selected technology.** **No actual prices are invented.**

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up |
| **Previous position** | `PM29-18` / `PM29-A11` / `PQ-08` — 🟠 **read-back required, OPEN.** All five batches treat format as an **informational property** (`fmt ∈ Web\|VR\|MR\|AR`), redefined as a private constant map in each prototype |
| **Affected areas** | Public catalogue and Experiment detail (a technology selector); the access record (gains a technology dimension); tenant content allocation; progress (`STK31-32`); Batch 04's access spine |
| **Supersedes** | 🔴 **Closes `PM29-A11` / `PQ-08` structurally** in favour of *selectable variant*. **The commercial rule remains uninvented** (`ND-08`) |

---

## Public catalogue and access

### `STK31-16` — Public discovery before login is required
✅ **CONFIRMED**

Users must be able to **browse content before login**.

The marketplace comparison (Flipkart / Amazon style) means:

- public browsing
- categories / programmes
- courses
- experiments
- detail pages
- selection / cart-like collection

**It does NOT mean copying those products visually.**

| | |
|---|---|
| **Source** | 31 Aug review, reaffirming `PM29-02` (29 Aug) |
| **Previous position** | `PM29-02` — 🔵 directional. **No FRD requirement describes unauthenticated browsing.** FRD v5 **FLOW 3** orders **register (①) before browse (②)**. Batch 04's Explore catalogue sits **behind sign-in** |
| **Affected areas** | Batch 04's catalogue **position** (artefact preserved, position superseded); the entire public area; authentication, which becomes the entry hand-off |
| **Supersedes** | 🟣 **FRD EXTENSION — recorded, not applied to the FRD.** Batch 04's *authenticated-first Explore* position is **superseded**; its components are not |

---

### `STK31-17` — What a public Experiment detail page may show
✅ **CONFIRMED**

Experiment title · Programme/Course context · description · **Learning Outcomes** · preview/video where available · supported technologies · device/runtime requirements · access/request context.

**No marketing claims may be invented.**

| | |
|---|---|
| **Source** | 31 Aug review, extending `PM29-03` |
| **Previous position** | `PM29-03` — 🔵 directional on the facts, 🟠 unconfirmed as a complete set. **Learning outcomes and preview/video have no surface in any batch** (`A5`, `A6` in the 29 Aug gap inventory) |
| **Affected areas** | A new public Experiment detail page; Batch 04 `B2C-02` and Batch 01 `S12` as the reuse sources; `QX-03` (caption / transcript / audio-description ownership) becomes sharper because video moves to a **public** page |
| **Supersedes** | Nothing. **Adds two content regions that exist nowhere** |

---

### `STK31-18` — The B2B cart is a selection basket and request preparation, not a checkout
✅ **CONFIRMED** — **RESOLVED**

For B2B, use an **ecommerce-style selection / cart experience** — **but the cart does NOT grant direct checkout or access.**

```
Public catalogue
   → select Course / Experiments
      → select required technologies
         → add to selection / cart
            → specify access requirements
               → submit institutional request
                  → SUPER ADMIN review / approval
                     → payment when applicable
                        → tenant access activation
```

**The cart is therefore: a selection basket + request preparation, before payment.**

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up |
| **Previous position** | `PM29-A6` / `PQ-06` — ⚪ **OPEN, and identified as *the question that gates the public catalogue's primary button*.** The 29 Aug transcript contained both an ecommerce analogy and an explicit statement that B2B may **not** behave like direct cart → payment. FRD v5 itself labels the cart model **DESIGN-PENDING** — *"Whether checkout is single-item or basket-based is DESIGN-PENDING — no requirement specifies a cart model"* |
| **Affected areas** | The public catalogue's CTA — **now decidable**; Batch 04 `DA-01` (direct single-item access); the whole B2B transaction surface |
| **Supersedes** | 🔴 **Closes `PM29-A6` / `PQ-06`.** Batch 04's `DA-01` direct-checkout emphasis is **superseded as the B2B model.** A selection/request object is a **different object** from a cart, and is **new** |

---

### `STK31-19` — Internal / collaborator B2B flow may skip payment
✅ **CONFIRMED** *(both branches exist)* · 🟠 **DETAIL PENDING** *(the classification rule)*

Internal BITS / WILP / community and approved collaboration contexts may follow:

```
Catalogue → selection → request / subscription → SUPER ADMIN approval → access activation
```

**Payment may be SKIPPED. Do NOT create a payment screen for internal / BITS-community access where payment is not required.** The request/access must still be **tracked**.

Plan / access context may distinguish: **`Subscription`** and **`BITS Community`**. Approved collaborators may also receive non-paid access depending on their arrangement.

**The commercial classification algorithm is NOT invented.**

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up, reaffirming and extending `PM29-08` |
| **Previous position** | `PM29-08` — 🔵 both branches exist, ⚪ the rule open. `PQ-11` coupled it to the BITS/WILP topology question. **FRD 6.2.1** says *"Institutions shall purchase packages mapped to academic streams"* — **no free route exists** |
| **Affected areas** | The tenant request flow (a branch with no payment screen); the access record (gains a plan/access context); CSV import (`Plan Terms`); Super Admin approval |
| **Supersedes** | 🟣 **FRD EXTENSION — recorded.** Adds a non-paid institutional route the FRD does not contain. The **rule** stays open as `ND-07` |

---

### `STK31-20` — External B2B flow; no access before approval
✅ **CONFIRMED**

```
Browse → select content/technology → provide licence/user quantity
      → choose/request access duration → submit request
         → SUPER ADMIN approves → payment → tenant receives access
```

**Access is never granted before approval.**

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up |
| **Previous position** | `PM29-07` gave the shape; `PM29-A4` / `PQ-03` left the **approving actor** ⚪ **OPEN** — *"the three answers differ by roughly a workspace."* **No FRD requirement names an approver**; FRD 4.2.1 has no approval, rejection, pending or SLA behaviour |
| **Affected areas** | A new tenant request → approval workspace; Batch 01's governance-review pattern becomes the reuse source; Batch 05 `R-01` |
| **Supersedes** | 🔴 **Closes `PM29-A4` / `PQ-03` on the actor: SUPER ADMIN, in-product.** 🟣 **FRD EXTENSION — recorded**: approval / rejection / pending states are new |

---

## Tenants

### `STK31-21` — Super Admin owns tenant creation, approval, governance and termination
✅ **CONFIRMED**

The **Super Admin**:

- reviews a new institution/tenant application
- approves / authorises the tenant
- creates and governs the tenant
- **assigns the Tenant / Institute Admin**
- can terminate / remove / deactivate a tenant
- decides which content and technologies the tenant receives

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up |
| **Previous position** | Batch 05's authority audit **refuted** `R-01` (institution creation/onboarding) and `R-02` (assign the first Institute Admin) *"on the explicit ground that no source named them."* `PM29-22` made both **OPEN**; `QD-02` (Phase-1 role-assignment mechanism) withheld the mechanism |
| **Affected areas** | Batch 05 `SA-02`, `SA-03`, `SA-09` — all three move from read-only to write; four new Super Admin surfaces |
| **Supersedes** | 🔴 **Batch 05 `R-01` and `R-02` are REVERSED — they are now confirmed capabilities, not refutations.** Closes the actor half of `QD-02` |

---

### `STK31-22` — Prefer reversible deactivation over destruction
✅ **CONFIRMED** *(as a design rule)*

Destructive-vs-deactivate semantics must be **designed safely**. **Prefer reversible status change / deactivation over physical deletion**, unless requirements explicitly demand deletion.

> ### ⚠ Scope of this rule — it governs the MECHANISM, not the label
> This rule makes destruction **recoverable**. It does **not** rename an action the stakeholders explicitly asked for.
>
> Where the review named an action — **`Delete` in the Question Bank** (`STK31-34`), **student removal/deactivation** (`STK31-25`), **tenant termination** (`STK31-21`) — **the requested user-facing action stands.** `STK31-22` decides what happens underneath it: a reversible state and preserved history, rather than an irreversible destructive operation.

| | |
|---|---|
| **Source** | 31 Aug review — stated as a design instruction |
| **Previous position** | No source addressed it. Batch 05's device-transfer record has **only two states** (`awaiting`/`approved`) *"because no rejection path exists in the requirement"* — a gap shown as a gap |
| **Affected areas** | Tenant termination; student removal (`STK31-25`); **the Question Bank `Delete` mechanism** (`STK31-34`); every destructive-looking control in the unified build |
| **Supersedes** | Nothing. Establishes a platform-wide **implementation** safety rule. ⚠ **It does not override an explicitly requested user-facing action** |

---

### `STK31-23` — A campus/unit may be its own Tenant
✅ **CONFIRMED** *(the topology is permitted)* · 🟠 **DETAIL PENDING** *(which real institutions map how)*

An **individual operational campus/unit can be its own Tenant**. Examples discussed: **WILP · Pilani · Goa · Hyderabad · Dubai**.

High-level categorisation may include **On-campus** and **Off-campus**.

**Sample institutions must NOT be hardcoded as production records.**

| | |
|---|---|
| **Source** | 31 Aug review · handwritten notes |
| **Previous position** | `PM29-A7` / `PQ-11` — ⚪ **OPEN**, with three readings each producing a different platform. One reading (*one tenant with organisational units*) would have required a **campus/unit level no source contains and no batch designs** |
| **Affected areas** | The tenant model; FRD 1.3.1 isolation now applies **between** campuses; Batch 05 `SA-02`; sample data |
| **Supersedes** | 🔴 **Closes `PM29-A7` structurally: separate tenants, NOT a sub-tenant level.** **No campus/unit hierarchy below the Tenant is created.** Which specific institutions are internal vs external remains `ND-07` |

---

### `STK31-24` — Super Admin controls tenant content and technology allocation
✅ **CONFIRMED**

The **Super Admin** controls which **Courses**, **Experiments** and **technology variants** are available to a Tenant.

**The Tenant Admin cannot assign content outside the Tenant's approved set.**

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up, reaffirming `PM29-23` |
| **Previous position** | `PM29-23` — 🔵 high confidence, ⚪ **allocation unit open.** Batch 03's institution content-access record deliberately carries **a date and no actor**, *"because no source confirms who records institutional content access"* |
| **Affected areas** | 🔴 **A new Super Admin allocation surface — the granting end exists nowhere.** Batch 03 `INA-06` gains its origin actor (**one line**); Batch 05 gains a capability area; Batch 03 `INA-08`'s two-direction mapping view is the reuse pattern |
| **Supersedes** | **Fills a blank Batch 03 was built to accept.** The unit is now **Course · Experiment · technology variant** — closing the open half of `PM29-23` |

---

### `STK31-25` — Tenant Admin responsibilities
✅ **CONFIRMED**

The Tenant Admin manages the high-volume institution-side work:

Faculty · Students · groups · people provisioning · **manual user addition** · **CSV bulk import** · Faculty mapping · Student/group mapping · **Course/Experiment assignment from the tenant's approved content** · institution-specific mappings · SSO / institution setup as already supported · reporting and visibility over assigned students and content.

**The Tenant Admin does NOT redefine the global Experiment library.**

**Student removal / deactivation:** the Tenant Admin may perform it; the **Super Admin may also perform it** as a platform override.

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up |
| **Previous position** | Two things were open. **(a)** `PM29-10` gave manual + CSV provisioning at direction level; **Batch 03 has no provisioning control of any kind** (`DA-04`) — the largest single gap in the built work. **(b)** `PM29-A3` / `PQ-05` left the **learner content-assignment owner** ⚪ **OPEN**; the Review-006 matrix grants *"assign content to learners or cohorts"* to **both** Faculty (FRD 8.1.4) and Institute Admin (FRD 8.1.3, 7.2.3) |
| **Affected areas** | Batch 03 — a whole new capability area (manual add, CSV import, error report); `INA-07`'s eligibility editor (`DA-07`, reversible) is **confirmed in place**; the Faculty/Tenant Admin split |
| **Supersedes** | 🔴 **Closes `PM29-A3` / `PQ-05`: the Tenant Admin is a confirmed content-assignment owner.** **Any earlier assumption that the Tenant Admin could NOT be the learner-content assignment owner is superseded.** 🟣 **FRD EXTENSION — recorded**: manual creation and CSV import of people exist nowhere in the FRD, which provisions people by **ERP (7.2.2)** only |

---

### `STK31-26` — Bulk CSV provisioning fields
✅ **CONFIRMED** *(the accepted set)* · 🟠 **DETAIL PENDING** *(`Plan Terms` mandatory status)*

CSV bulk import is **required**. Currently confirmed/accepted fields:

| Field | Status |
|---|---|
| Programme | accepted |
| Course Name | accepted |
| Course ID / Code | accepted |
| Student ID | accepted |
| Student Name | accepted |
| Student Email | accepted |
| **Semester** | **OPTIONAL** |
| **Organisation** | **OPTIONAL** |
| **Plan Terms / Access Context** *(e.g. `Subscription`, `BITS Community`)* | 🟠 **requested "if possible" — mandatory status = implementation-detail confirmation PENDING** |

**`Plan Terms` is included in the UX and data-planning model. It must NOT be silently classified as technically mandatory.**

**No database schema is created by this decision.**

| | |
|---|---|
| **Source** | stakeholder-confirmed follow-up · handwritten notes |
| **Previous position** | `PM29-25` / `PQ-10` — 🟠 read-back required; the handwritten list marked **Programme, Course Name, Course ID/Code, Semester, Student ID, Student Name, Student Email** as **mandatory** and **Organisation** as not mandatory. **No person schema exists in any FRD source**, and **no course-code field exists anywhere** |
| **Affected areas** | The CSV import surface and its validation contract; Batch 03's person record; Batch 02 `B02-assign` |
| **Supersedes** | 🔴 **Semester's mandatory marking is SUPERSEDED** (see `STK31-11`). The rest of the handwritten list is **accepted**. `Plan Terms` is **added** |

> ### ⚠ Recorded conflict — not resolved, and now reachable
> **The institution's ERP is authoritative (FRD 7.1.1) and scheduled sync overwrites (FRD 7.2.1).** Adding manual and CSV routes creates a **real write conflict** on the same person. `QD-01` — *which fields are user-editable vs institution-owned?* — has been open since Review 006. **Listed as `ND-04`. Not invented here.**

---

### `STK31-27` — Licence / user quantity comes from the request; there is no universal cap
✅ **CONFIRMED**

An institutional access request includes a **quantitative requirement** (e.g. 10 users, 100 users).

**There is no universal fixed seat cap.** The requested quantity is **specific to the institutional request / access agreement**.

Future UI may show **Requested licences/users · Assigned students · Remaining allocation** — **only when those values derive from the actual approved request.**

**Do NOT restore arbitrary sample caps such as 5,400.**

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up, reaffirming `PM29-20` |
| **Previous position** | `OQ-03` (seat model) — **OPEN.** `PM29-20` confirmed *no single seat model*. **FRD 6.2.2** — *"Institutions **may** purchase capped licenses based on maximum student count"* — exists as a Phase-1 line, and FRD 8.2.2 (licence-utilisation tracking) is **Phase 2**. Batches 03 and 05 had already removed every seat, cap, quota and capacity figure |
| **Affected areas** | Batch 05 `SA-08`; the tenant request form; institution reporting |
| **Supersedes** | Nothing. **Validates the Batch 03 / Batch 05 removals** and confirms that a quantity now has a legitimate origin — the approved request — where before it had none |

---

### `STK31-28` — Subscription / access term, and the REQUIRED 15-day expiry reminder
✅ **CONFIRMED** *(the lifecycle **and the reminder requirement**)* · 🟠 **DETAIL PENDING** *(delivery channel · renewal mechanics)*

A normal subscription / access lifecycle applies. Known durations discussed: **Monthly · Quarterly · Yearly.**

> ### ✅ REQUIRED CAPABILITY — stated verbatim by the stakeholder
> **"We will send reminders to Tenants 15 days ahead."**
>
> **15 days before an institutional subscription/access term expires, the Tenant must receive an expiry reminder.**
>
> **This is a required platform capability. An in-product attention state does not discharge it.**

| Layer | Status |
|---|---|
| **The reminder itself** — a reminder event 15 days before expiry, reaching the Tenant | ✅ **REQUIRED** |
| **An in-product `Expiring soon` attention state** on the Tenant overview and the Super Admin institution report | 🔵 **RECOMMENDED SUPPORTING UX — a design/implementation choice, NOT a separately stakeholder-required rule.** Safe and useful; it may be built, but **it does not itself discharge the reminder requirement** |
| **The delivery channel / mechanism** | 🟠 **PENDING** — `ND-16` |

**Do NOT invent the channel.** Not e-mail, not SMS, not push, not an external notification provider. **The requirement is the reminder; the mechanism is not stated.**

States to model carefully: **Active · Expiring soon · Expired · Renewed.**

**Do NOT assume automatic payment, automatic renewal, or automatic charge** unless explicitly confirmed later.

| | |
|---|---|
| **Source** | stakeholder-confirmed follow-up — **the reminder is stated explicitly** |
| **Previous position** | `PQ-21` — *should institutional access have a duration, as individual access does?* — **CAN WAIT / open.** `PM29-19` gave periods for **individuals only**. Batch 03's content-access record has effective dates with **nothing derived from them**; Batch 04's access record is **perpetual** |
| **Affected areas** | Batch 03 `INA-06` / `INA-07` / `INA-01`; Batch 05 `SA-01` / `SA-03` / `SA-08`; the tenant overview; the access record's shape; **a new reminder capability with a pending channel** |
| **Supersedes** | Nothing. **Adds an institutional access term and a required expiry reminder where neither existed.** 🟣 **FRD PHASE NOTE — recorded**: FRD 9.3.2 institutional subscription billing is **Phase 2**; this decision concerns the **access term and its reminder**, not billing mechanics. 🟠 **FRD EXTENSION — recorded**: no Phase-1 FRD requirement describes a notification or reminder capability, so **the reminder itself is an extension** and is listed as `S-21` |

---

## Faculty, assessment and learning

### `STK31-29` — Faculty workspace scope
✅ **CONFIRMED**

Faculty should be able to see: Experiments available to their Tenant · student/group assignment context · assessment configuration · Question Bank · student results · completion/progress · Experiment usage · time spent / usage indicators · assessment outcomes.

**Do NOT invent broad executive analytics.** Focus on **operational learning analytics**.

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up |
| **Previous position** | `PM29-11` used the word *"analytics"*, which pointed against **PM-11** (*"do not invent large analytics dashboards now… detailed report metrics/KPIs remain pending"*). `PQ-14` asked what it meant and was **OPEN**. **Every FRD dashboard requirement (8.2.x, 11.3.x, 11.4.x) is Phase 2 or 3.** No Faculty browse surface exists in any batch |
| **Affected areas** | 🔴 A new Faculty view of tenant Experiments; Batch 02's minimal progress surface expands to operational scope; `FAC-05` / `FAC-10` (inventoried, never built) |
| **Supersedes** | 🔴 **Closes `PQ-14`: *analytics* means OPERATIONAL LEARNING ANALYTICS.** **PM-11's prohibition on invented dashboards and undefined KPIs is NOT overridden** — it is scoped |

---

### `STK31-30` — Faculty owns assessment configuration
✅ **CONFIRMED**

**Faculty owns assessment configuration. A Student/Learner does not configure assessment.** Continue supporting **MCQ · True/False · Descriptive** where already required.

| | |
|---|---|
| **Source** | 31 Aug review |
| **Previous position** | Already confirmed — **PM-08**, **PM-15**, FRD 5.1.1 / 5.2.1–5.2.3 / 5.3.1 / 5.3.2 / 8.1.4. Built in Batch 02 |
| **Affected areas** | None — Batch 02 is validated as-is |
| **Supersedes** | Nothing. **Reinforces PM-08 and PM-15** |

---

### `STK31-31` — Descriptive-answer evaluation is Faculty-owned
✅ **CONFIRMED** — **RESOLVED**

**FACULTY is the ONLY human role responsible for descriptive-answer evaluation.**

Faculty **may optionally use AUTO REVIEW**, similar to the referenced Taxila model.

- If exact Taxila auto-review behaviour is not available in the repository, **do NOT invent it**.
- Safe future UX must **preserve Faculty ownership**.
- Auto-review **may assist** Faculty.
- **Do NOT assume an AI-generated score is automatically final** unless a source confirms it.

| | |
|---|---|
| **Source** | stakeholder-confirmed follow-up — explicitly resolved |
| **Previous position** | 🔴 **`QP-02` — HIGH, open since Review 006, and repeatedly identified as *the only open item that can strand a learner mid-progression through no fault of their own*.** FRD 5.2.3 permits descriptive answers; **no requirement said who grades them**; the approved progression (PM-09) gates the next Experiment on completion. Batch 02 models `result.state: 'pending'` with **no evaluator, rubric, turnaround, queue or grading record** — a deliberate hole |
| **Affected areas** | Batch 02's pending-evaluation state gains an owner; a **new Faculty descriptive-evaluation queue** becomes buildable; learner result copy |
| **Supersedes** | 🔴 **Closes `QP-02` on the owner. Descriptive grading is NOT the Academic Reviewer's.** The exact auto-review mechanics remain `ND-09` |

---

### `STK31-32` — Answer / explanation visibility is Faculty-controlled
✅ **CONFIRMED** *(policy ownership and the general option set)* · 🟠 **DETAIL PENDING** *(BITS behaviour)*

**Faculty controls this policy.** For general / non-BITS contexts, support configurable options:

- **Show immediately**
- **Show after assessment deadline**
- **Show on custom date**

For **BITS cases**, the 31 Aug review explicitly said to **refer to Taxila behaviour**. Taxila's implementation is not available in the current sources, so this is recorded as:

> **BITS feedback timing = TAXILA-REFERENCE PENDING IMPLEMENTATION DETAIL**

**The Taxila rule is NOT invented.**

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up |
| **Previous position** | 🔴 **`QP-27` — HIGH, open.** *What post-attempt feedback may a learner see?* Batch 02 shows a score and per-question correctness **without the key** (`D-25`), and blocks the assessment API payload on this |
| **Affected areas** | Batch 02 `B02-settings` (a new policy control), `B11` Result; the assessment configuration record; the assessment API boundary |
| **Supersedes** | 🔴 **Closes `QP-27` for general contexts.** **`D-25` — a learner never sees the answer key — is NOT overridden;** these options govern *when explanations become visible*, not whether the key is exposed during an attempt |

---

### `STK31-33` — AI-assisted question generation takes source material
✅ **CONFIRMED**

Do **NOT** rely only on random / local AI question generation. Faculty must be able to supply source material and context:

```
Upload source document/material  and/or  prompt/context
   → AI generates draft questions
      → clearly marked AI GENERATED / REVIEW REQUIRED
         → Faculty reviews  →  edit  →  delete/discard  →  accept
            → Question Bank
```

**No real AI integration yet. The provider remains technically pending.**

| | |
|---|---|
| **Source** | 31 Aug review |
| **Previous position** | FRD **5.1.2** *AI Question Generation* is **Phase 1** and Faculty-owned. Batch 02 `B06` builds request → generating → drafts → accept/edit/discard **with mandatory Faculty review** — but **from a prompt only**, with no source-material upload |
| **Affected areas** | Batch 02 `B06` gains a source-material input; the AI-draft flow otherwise unchanged |
| **Supersedes** | Nothing. **Extends** an existing, correct design. **Faculty review remains mandatory** |

---

### `STK31-34` — Question Bank enhancements
✅ **CONFIRMED**

**Add question · Edit question · Delete question** · AI-generated draft acceptance · Upload/import questions or material where appropriate.

> ### ✅ The user-facing requirement is `Add` · `Edit` · `DELETE`
> **`Delete` is what the stakeholders asked for and `Delete` is what the product offers.** It must **not** be replaced in the requirement by `Retire` or `Archive`.
>
> **Safe future UX:**
> ```
> Delete → confirmation → the question is removed from the ACTIVE Question Bank
>                       → historical attempts and results are PRESERVED
> ```
>
> **Implementation may use a reversible / soft-delete mechanism underneath**, especially where a question already carries historical assessment usage. That is an **implementation choice** (`ND-15`), invisible in the requirement.
>
> **Do NOT invent a permanent destructive database operation.**

**Existing Question Bank work is preserved.** File formats are not invented beyond planning until an implementation detail is selected.

| | |
|---|---|
| **Source** | 31 Aug review · handwritten notes — **`Delete` was explicitly requested** |
| **Previous position** | Batch 02 `B04` / `B05` build add, edit, upload-with-per-row-errors, and AI-draft acceptance. **Delete is absent** |
| **Affected areas** | Batch 02 `B04` gains a **`Delete`** affordance with a confirmation step; historical attempts and results remain intact |
| **Supersedes** | Nothing. **One additive gap.** ⚠ **`STK31-22`'s "prefer reversible" rule applies to the MECHANISM, not to the label** — it does not downgrade `Delete` to `Retire` or `Archive` |

---

### `STK31-35` — Assessment may sit outside or inside the Experiment
🔵 **DIRECTIONAL** *(the integration boundary is documented, not built)*

Assessment may exist:

- **A** — outside the Experiment, in the portal, **and/or**
- **B** — embedded inside the Experiment / application

Portal-configured assessment information may need **API / integration support** so it can appear inside XR/Web applications. The Experiment/application should return operational information such as **completion · time spent · progress/results where applicable**.

**Do NOT implement any API or backend now. Document the required future integration boundary.**

| | |
|---|---|
| **Source** | 31 Aug review |
| **Previous position** | **PM-08** already required assessment to be *"consumable by the relevant Web/XR application through flexible platform/API integration"*. `QT-03` (assessment configuration API contract) is **HIGH and open**; `Q-42` (recovery when a completion event never arrives) is open |
| **Affected areas** | The assessment configuration record; Batch 01's XR access states; Batch 02's result model; the integration boundary document |
| **Supersedes** | Nothing. **Reinforces PM-08** and makes the two placements explicit |

---

### `STK31-36` — Progress must be expressible per assigned technology
✅ **CONFIRMED**

If the same Experiment is assigned in multiple formats (**AR / VR / WebGL**), the learner/progress experience must be able to show **progress per assigned technology/format**.

**Three assigned technology experiences must NOT collapse into one ambiguous completion state.**

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up |
| **Previous position** | Not previously raised. **All five batches treat format as a single property of one experiment record**, and progress is modelled per experiment — Batch 01 as a stored enum, Batch 02 as a derived four-part state (PM-09 confirms Batch 02's derivation) |
| **Affected areas** | 🔴 The progress model gains a **technology dimension** — a real shape change to the most finished part of the product; Batch 01 `S14` / Batch 02 `B12` (which merge); the access record |
| **Supersedes** | Nothing. **Adds a dimension.** Downstream of `STK31-15` |

---

## XR delivery, devices, support

### `STK31-37` — XR and Web delivery model
✅ **CONFIRMED** *(the conceptual distinction)* · 🟠 **DETAIL PENDING** *(the mechanism)*

| Technology | Delivery |
|---|---|
| **AR / VR** | Downloadable / authorised **package** model |
| **Web / WebGL** | **Hosted / deployed** experience represented by a **link** |

Vendor submission may include a **compiled package** or a **hosted link**, depending on the technology.

**Source code is NOT required from the Vendor** unless another source explicitly demands it. **No backend or storage provider is selected here.**

| | |
|---|---|
| **Source** | 31 Aug review |
| **Previous position** | **PM-05** confirmed the **product requirement** — entitlement-aware XR delivery — and explicitly did **not** select between Concept A (direct package download) and Concept B (centralized XR app with downloadable modules). `QT-01` remains **HIGH and open by PM instruction**. **FRD Section 2 defines no AR application architecture** (`QT-02`), and the web bundle/licence path is unstated (`Q-16`) |
| **Affected areas** | Batch 01 `S02` (Vendor submission gains a package-or-link choice by technology), `S13` XR device access (already mechanism-neutral) |
| **Supersedes** | Nothing. **Refines PM-05 at the packaging level without selecting the delivery mechanism.** `QT-01` stays open |

---

### `STK31-38` — Device licensing and transfer
✅ **CONFIRMED**

Preserve **one authorised licence/device relationship** where already supported.

Device replacement:

```
Student requests transfer → SUPER ADMIN reviews / approves → authorised device binding changes
```

**Do not generalise into arbitrary licence administration.**

| | |
|---|---|
| **Source** | 31 Aug review, reaffirming FRD 2.4.1 / 2.4.2 |
| **Previous position** | **Half-built.** Batch 05 has the **approval end** (`SA-06` / `SA-07`); the **learner end** (`LRN-16` / `LRN-17`) *"is not built"*. **There is no device registry anywhere** — the platform has a device-TRANSFER approval with no device REGISTRY |
| **Affected areas** | 🔴 Two new learner screens complete a half-built cross-plane workflow; the device binding record |
| **Supersedes** | Nothing. **Confirms both FRD 2.4.1 and 2.4.2 as live** |

---

### `STK31-39` — Help / support is required
✅ **CONFIRMED** *(the capability)* · 🟠 **DETAIL PENDING** *(SLA and provider)*

Users must be able to report operational problems: **Experiment not opening · package/link issue · login issue · access issue · device issue · other technical issue.**

The platform / Super Admin side must be able to: **see the reported issue · understand the affected user / Experiment / Tenant · track status · resolve/close the issue.**

**Do NOT invent** an SLA, a priority formula, an external ticket provider, or a chatbot implementation unless source-supported. Manuals/guides may be added later.

| | |
|---|---|
| **Source** | 31 Aug review |
| **Previous position** | **No support or issue-reporting capability exists in any source or any batch.** `ui-ux/16-unified-product-planning/12_POST_PM_IMPLEMENTATION_HANDOFF.md` records a related, separate accessibility finding: **WCAG 2.2 SC 3.2.6 *Consistent Help* is level A**, and Help is present in Batches 01–03, **dropped by Batch 04 and demoted by Batch 05** |
| **Affected areas** | 🔴 A **wholly new capability area** — a learner/user report path and a platform-side issue queue; the shell's Help placement |
| **Supersedes** | 🟣 **FRD EXTENSION — recorded.** No FRD requirement describes support |

---

## Governance, reporting, authentication

### `STK31-40` — Super Admin capability expansion
✅ **CONFIRMED** *(the areas)* · 🔵 **DIRECTIONAL** *(exact controls)*

Super Admin capability set now includes:

Tenant requests · tenant approval · tenant creation · tenant deactivation/termination · Tenant Admin assignment · tenant content allocation · technology allocation · platform role assignment/governance · Course/Experiment-specific Vendor/Reviewer/Content Manager mapping · later-version Release/Hold · device-transfer requests · existing licensing/subscription visibility · institution profile/report · streams/programmes used · students/users per stream · active Courses/Experiments · requested/approved licences/users · subscription/access term · Experiment usage · platform support/issues.

**No fake financial analytics may be created.**

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up |
| **Previous position** | Batch 05 was **intentionally conservative** — *"exactly two clean write actions plus one bounded read"* — and its audit **refuted fourteen candidate capabilities** on the explicit ground that no source named them. `R-01`, `R-02`, `R-03`, `R-04` were already reopened on 29 Aug |
| **Affected areas** | Batch 05 in full — the most-changed batch |
| **Supersedes** | 🔴 **Batch 05 `R-01`, `R-02`, `R-03`, `R-04` are REVERSED.** 🟢 **`R-05` (grant/revoke a *learner* entitlement) and `R-06` (assign content to *learners or cohorts*) are NOT reversed** — those sit at tenant altitude and `STK31-25` assigns them to the Tenant Admin |

---

### `STK31-41` — Platform role assignment may be Course- or Experiment-specific
✅ **CONFIRMED**

Super Admin governs **Vendor · Academic Reviewer · Content Manager**. Assignments may be **Course-specific** or **Experiment-specific**. **Multiple people may be associated with one Experiment** where required.

**Do NOT assume assignment is global-only.**

| | |
|---|---|
| **Source** | stakeholder-confirmed follow-up |
| **Previous position** | `PM29-24` / `PQ-15` — 🟠 **scope unknown: global? per course? per experiment?** Batch 05 `SA-09` is **read-only** (`DA-04`) and states on-screen *"No institutional person appears on this screen."* Batch 05 refuted `R-03` / `R-04` |
| **Affected areas** | Batch 05 `SA-09` becomes writeable; a **new per-content assignment surface**; Batch 01's review queues gain an assignment origin |
| **Supersedes** | 🔴 **Closes `PQ-15`: BOTH account governance AND per-content assignment, at Course and Experiment level.** Reverses `R-03` / `R-04` |

---

### `STK31-42` — Super Admin institution reporting content
✅ **CONFIRMED** *(the content)* · 🔵 **DIRECTIONAL** *(the surface)*

Institution profile / dashboard visibility includes: **Tenant identity · Tenant Admin · active content/access · number and names of streams · student/user counts · students/users by stream where available · licence/user quantity · subscription/access term · assigned Courses/Experiments · technology selection · usage/completion indicators · issues requiring attention.**

**No revenue metrics may be invented.**

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up |
| **Previous position** | **PM-11** — core operations first, no invented dashboards, KPIs pending. Batch 05 `SA-03` shows an institution with **three readiness booleans** and *"cannot say which experiments"* |
| **Affected areas** | Batch 05 `SA-03` expands materially; Batch 05 `SA-01` overview |
| **Supersedes** | **Scopes PM-11 rather than overriding it.** Every item listed is an **operational fact the platform already holds or will hold** — none is a derived KPI |

---

### `STK31-43` — Faculty / tenant reporting content
✅ **CONFIRMED** *(the content)*

Which Courses/Experiments the Faculty is delivering · how many Students are assigned · Student groups · completion · assessment outcomes · Experiment usage · time spent.

**Metrics must map to source-supported data. Do not create decorative dashboards.**

| | |
|---|---|
| **Source** | 31 Aug review · stakeholder-confirmed follow-up |
| **Previous position** | FRD Phase-1 analytics are **recording** requirements — 11.1.1 completion, 11.1.2 time spent, 11.2.1 scores, 11.2.2 attempts. **Every dashboard requirement is Phase 2 or 3.** FRD 1.3.4 limits reporting to the tenant's own dataset |
| **Affected areas** | Batch 02's Faculty surfaces; `FAC-05` / `FAC-10` |
| **Supersedes** | Nothing. **Each listed item maps to an existing Phase-1 recording requirement** |

---

### `STK31-44` — SSO with a platform-authentication fallback
✅ **CONFIRMED** *(the fallback rule)* · 🟠 **DETAIL PENDING** *(password policy / routing)*

- If an institution **has** SSO → use the configured institutional SSO.
- If an institution **does not have** SSO → platform authentication may be provided.

**Exact password policy and routing are not finalised in this documentation task.**

| | |
|---|---|
| **Source** | 31 Aug review |
| **Previous position** | **PM-10** — institutional SSO required, provider/protocol/attribute mapping pending. Batch 03 `INA-10` configures SSO; **the learner-facing sign-in path has never been built in any batch.** `QT-04` (XR sign-in under SSO, FRD 2.4.4 vs 4.2.2) is **HIGH and open** |
| **Affected areas** | The whole authentication area — `AUTH-01`, `AUTH-02`, `AUTH-03`, `AUTH-08` are all still unbuilt |
| **Supersedes** | Nothing. **Reinforces PM-10 and adds the fallback rule**, which resolves part of the auth routing question |

---

### `STK31-45` — MR is retained
✅ **CONFIRMED**

MR is **NOT removed** merely because the 31 Aug review used the shorthand *AR · VR · WebGL*.

> **MR = inherited source-supported capability, unless explicitly removed.**

**It must not be silently dropped.**

| | |
|---|---|
| **Source** | Precedence rule applied to the 31 Aug review: *an omission in a spoken list is not a decision* |
| **Previous position** | `PM29-14` / `PM29-A10` / `PQ-13` — the same omission occurred on 29 Aug and was **not read as a removal**. **The FRD defines four Phase-1 formats** — Web 1.2.1, VR 1.2.2, **MR 1.2.3**, AR 1.2.4 — with **FRD 2.1.2** specifying a sideloaded MR application on Ajna Lens, plus its own open question `QP-14` (*who authorises MR sideloading*). Batch 01 designs **all four** format badges and device-compatibility states |
| **Affected areas** | Batch 01's four format badges — **all retained**; the technology enum |
| **Supersedes** | Nothing. **Explicitly prevents a silent scope reduction** |

---

### `STK31-46` — Experiments map to Courses
✅ **CONFIRMED** *(the relationship)* · 🟠 **DETAIL PENDING** *(who performs the mapping)*

An Experiment is mapped to a Course; a Course may hold several Experiments (`STK31-12`).

| | |
|---|---|
| **Source** | 31 Aug review · the worked Civil Engineering example, reaffirming `PM29-17` |
| **Previous position** | `PM29-17` — 🔵 high confidence. 🔴 **No batch has a course ↔ experiment relationship at all.** Batch 01's Vendor metadata (`S02` / `S04`) has **no course field**; Batch 03's courses have **no link to any experiment**. `PQ-20` — *who maps it* — was **CAN WAIT / open** |
| **Affected areas** | Batch 01 `S02`; the canonical metadata record; the whole catalogue |
| **Supersedes** | Nothing. The **5–10 experiments per course** figure from the 29 Aug handwritten notes remains **SAMPLE CONTEXT, not a cardinality requirement** |

---

### `STK31-47` — The platform is one unified product built from the complete journey
✅ **CONFIRMED**

The design proceeds from the **complete user journey**, and the five prototype batches are **functional design modules of one platform**, not five finished products.

| | |
|---|---|
| **Source** | 31 Aug review, reaffirming `PM29-01` (29 Aug) and **PM-03** |
| **Previous position** | `PM29-01` — ✅ high confidence. **PM-02** ordered the architecture work; `PM29-01` added the consolidation stage |
| **Affected areas** | The implementation strategy in `ui-ux/17-stakeholder-correction-blueprint/15_IMPLEMENTATION_BACKLOG_AND_SEQUENCE.md` |
| **Supersedes** | Nothing. **Reinforces PM-02, PM-03 and `PM29-01`** |

---

### `STK31-48` — Historical prototypes are preserved unchanged
✅ **CONFIRMED**

Batches 01–05, `ui-ux/15-post-pm-alignment/` and `ui-ux/16-unified-product-planning/` are **preserved as historical validated work** and are **not modified** by this update or by the correction blueprint.

| | |
|---|---|
| **Source** | Task instruction, consistent with the authority rule every prior capture applied to its own predecessors |
| **Previous position** | The same rule, applied by the 18 / 19 / 25 August captures and by `ui-ux/15-post-pm-alignment/` |
| **Affected areas** | All historical packages |
| **Supersedes** | Nothing |

---

# C · What remains pending — and none of it blocks implementation

**Sixteen non-blocking details.** Full handling, including the safest reversible UX treatment for each, is in `ui-ux/17-stakeholder-correction-blueprint/16_REMAINING_NONBLOCKING_DETAILS.md`.

> **These are implementation details, not unconfirmed decisions.** Every `STK31-nn` decision above is **current and authoritative**; the items below are the specific mechanics those decisions deliberately left to implementation.

| ID | Pending detail | Related |
|---|---|---|
| `ND-01` | Final product-facing label — `Institute Admin` or `Tenant Admin` | `STK31-02` |
| `ND-02` | Final terminology and internal structure of `Programme / Department / Academic Stream` — **one grouping level; whether it later needs sub-levels is a data-model detail** | `STK31-12`, `STK31-10` |
| `ND-03` | `Plan Terms` mandatory-vs-optional validation status | `STK31-26` |
| `ND-04` | CSV ↔ ERP write-conflict resolution on the same person (`QD-01`) | `STK31-26` |
| `ND-05` | Canonical metadata **schema** (`QD-07`) | `STK31-09` |
| `ND-06` | B2C periods — recurring subscription or fixed-term grant (`PQ-18`) | `STK31-05` |
| `ND-07` | The internal-vs-external institution classification rule | `STK31-19`, `STK31-23` |
| `ND-08` | Technology-specific pricing construction | `STK31-15` |
| `ND-09` | Exact Taxila auto-review mechanics | `STK31-31` |
| `ND-10` | BITS feedback-timing behaviour — Taxila reference | `STK31-32` |
| `ND-11` | Automatic vs manual renewal | `STK31-28` |
| `ND-12` | Payment provider and actual pricing (`C-05`, `Q-34`, `Q-35`) | `STK31-20` |
| `ND-13` | May Super Admin return a submission at the first-publication gate? (`QP-26`) | `STK31-06`, `STK31-07` |
| `ND-14` | Support SLA / priority model | `STK31-39` |
| `ND-15` | Permanent-delete vs reversible/soft-delete **technical implementation** — the **user-facing action stays `Delete`** | `STK31-22`, `STK31-34` |
| `ND-16` | **Delivery channel / mechanism for the 15-day expiry reminder** — the reminder itself is **REQUIRED** | `STK31-28` |

**Also still pending from earlier registers, untouched by this update:** `QT-01` XR delivery mechanism (pending by explicit PM-05 instruction) · `QT-02` AR application architecture · `QT-03` assessment configuration API contract · `QT-04` XR sign-in under SSO · `QP-14` MR sideloading authority · `QX-01` / `QX-02` viewport and reflow across all workspaces · `QX-03` caption / transcript / audio-description ownership · `QD-08` curriculum validation rubric.

---

# D · FRD deviation, extension and gap register

**Required by Authority rule 3.** `source/Platform FRD_v4.pdf` and `requirements/updated-frd/*` are **unchanged and must remain unchanged.**

| # | Decision | FRD reference | Relationship | Record |
|---|---|---|---|---|
| **S-1** | `STK31-06` | **1.4.4** — *"Only the Super Admin shall have permission to publish approved modules to the production environment"* | 🔴 **DEVIATION** *(re-stated, not new)* | First publication is the **Content Manager's**. This restates the PM-16/17/18 override and removes the historical ambiguity. FRD unedited |
| **S-2** | `STK31-04` | **1.1.2 / 1.1.3** — both Phase 1, unsequenced | 🔴 **DEVIATION from PM-04, not from the FRD's requirement set** | Delivery is sequenced B2B-first. **No requirement leaves Phase 1**; B2C remains in the architecture |
| **S-3** | `STK31-11` | **2.19x** *Academic Version Locking* — **Phase 2**, the only *semester* mention in the v5 set | 🟡 **GAP** | *Semester* has **no Phase-1 learner-record basis**. Made **optional**, which is the safe direction |
| **S-4** | `STK31-12` | **3.3.1** *certification program* — **Phase 1 in the FRD, PM-12-deferred to Phase 2** | 🟣 **TERMINOLOGY COLLISION — recorded** | The `Programme / Department Bundle` is a **different object**. **PM-12 is not reversed** |
| **S-5** | `STK31-12`, `STK31-15` | **1.2.1–1.2.4** — format is a **property** of a module | 🟠 **EXTENSION** | Technology becomes a **selectable, separately licensable dimension** |
| **S-6** | `STK31-16` | **No requirement describes unauthenticated browsing.** v5 FLOW 3 orders register → browse | 🟠 **EXTENSION** | Public pre-login discovery is a **new capability** |
| **S-7** | `STK31-18` | v5 accuracy corrections name *"a cart-free checkout"* as an inherited position wrongly presented as a requirement; the cart model is **DESIGN-PENDING** | ✅ **RESOLVES a DESIGN-PENDING item** | Selection basket + request preparation. No FRD conflict |
| **S-8** | `STK31-19` | **6.2.1** — *"Institutions shall purchase packages mapped to academic streams"*; no free route | 🟠 **EXTENSION** | A non-paid institutional route now exists |
| **S-9** | `STK31-20`, `STK31-21` | **4.2.1** — its subject is the institution; **no approval, rejection, pending or SLA behaviour exists** | 🟠 **EXTENSION** | Approval states and a named approver are new |
| **S-10** | `STK31-25`, `STK31-26` | **7.2.2** ERP auto-creation is the only people-provisioning route; **5.1.1** is the only spreadsheet upload and it uploads **questions** | 🟠 **EXTENSION** | Manual creation and CSV people import are new. ⚠ Creates the `QD-01` write conflict (`ND-04`) |
| **S-11** | `STK31-26` | **No course-code field exists anywhere in the FRD** *(verified — zero hits)* | 🟡 **GAP** | Course ID/Code is new, and *"varies by institution"* implies it belongs to the **tenant mapping**, not the central record |
| **S-12** | `STK31-28` | **9.3.2** institutional subscription billing — **Phase 2** | 🟣 **PHASE NOTE** | An access **term** is confirmed; **billing mechanics are not** |
| **S-13** | `STK31-27` | **6.2.2** — *"Institutions **may** purchase capped licenses based on maximum student count"* | ✅ **ALIGNMENT** | The FRD says *may*. A per-request quantity is consistent; **no universal cap** |
| **S-14** | `STK31-31` | **5.2.3** permits descriptive answers; **no requirement names a grader** | ✅ **FILLS A SILENCE** | Faculty is the human evaluator. Closes `QP-02` |
| **S-15** | `STK31-39` | **No support or issue-reporting requirement exists anywhere** | 🟠 **EXTENSION** | A wholly new capability area |
| **S-16** | `STK31-45` | **1.2.3 / 2.1.2** — MR is Phase 1 with its own application requirement | ✅ **ALIGNMENT** | MR retained. **No scope reduction** |
| **S-17** | `STK31-07` | **2.3.2** — *"Super Admin shall control when new versions of modules are released to production environments"* | ✅ **ALIGNMENT** | Confirmed live and Super-Admin-owned. Resolves the `PM29-A1` ambiguity **in the FRD's own direction** |
| **S-18** | `STK31-08` | **1.4.2** assigns academic validation to the BITS academic team; **no requirement names a learning-outcome author** | ✅ **FILLS A SILENCE** | Academic Reviewer owns Learning Outcomes |
| **S-19** | `STK31-41` | **7.4.2** IdP role mapping and **8.3** custom roles are both **Phase 3** | 🟡 **GAP — partially filled** | The **authority** and **granularity** are now confirmed; the Phase-1 **mechanism** (`QD-02`) is answered only for who assigns, not how identities originate |
| **S-20** | `STK31-36` | **11.1.1 / 11.1.2** record completion and time spent per module; **no per-format dimension exists** | 🟠 **EXTENSION** | Progress gains a technology dimension |
| **S-21** | `STK31-28` | **No Phase-1 FRD requirement describes a notification or reminder capability** | 🟠 **EXTENSION** | **The 15-day expiry reminder to the Tenant is REQUIRED** and is therefore a recorded extension. **The delivery channel is not stated and is not invented** (`ND-16`) |

**Legend.** 🔴 deviation from the FRD or from a prior confirmed decision · 🟠 extension beyond the FRD as written · 🟣 collision or phase note · 🟡 gap · ✅ alignment or a silence legitimately filled.

---

# E · Document control

| | |
|---|---|
| **Decisions recorded** | **48** — `STK31-01` … `STK31-48` |
| ✅ CONFIRMED | **41** |
| 🔵 DIRECTIONAL | **3** *(`STK31-35`, and the surface halves of `STK31-40`, `STK31-42`)* |
| 🟠 CONFIRMED — DETAIL PENDING | **10** *(counted where a decision carries a named pending detail; several decisions carry both a confirmed and a pending half)* |
| **Decisions carrying a 🔴 / 🟣 supersession marker** | **23** — `STK31-04`, `06`, `08`, `11`, `12`, `13`, `14`, `15`, `16`, `18`, `19`, `20`, `21`, `23`, `25`, `26`, `28`, `29`, `31`, `32`, `39`, `40`, `41` |
| **Of those, decisions that override a specific NAMED prior rule** | **11** — `STK31-04` *(PM-04)* · `06` *(FRD 1.4.4, restating PM-16/17/18)* · `11` and `26` *(the `PM29-25` handwritten "Semester mandatory")* · `13` *(the 3-module Bundle model)* · `16` *(Batch 04's authenticated-first Explore position)* · `18` *(Batch 04 `DA-01` direct checkout as the B2B model)* · `21` and `40` *(Batch 05 `R-01`, `R-02`, `R-03`, `R-04`)* · `25` *(the assumption that Tenant Admin could not own learner-content assignment)* · `41` *(Batch 05 `DA-04` read-only role governance)* |
| **The remaining 12 marked rows** | Close a preserved ambiguity or record an FRD extension/phase note — **they override nothing that was previously confirmed** |
| **Prior ambiguities closed** | **12** — `PM29-A1` · `A2` · `A3` · `A4` · `A6` · `A7` · `A8` · `A9` · `A10` · `A11` · `A12` *(via `PQ-14`)*, plus `QP-02` |
| **Prior open questions closed** | **13** — `PQ-01`…`PQ-06`, `PQ-08`, `PQ-09(a)`, `PQ-10`, `PQ-14`, `PQ-15`, `QP-02`, `QP-27` |
| **Prior open questions deliberately left open** | **8+** — `QP-26`, `QT-01`…`QT-04`, `QP-14`, `QD-01`, `QD-07`, `QD-08`, `QX-01`…`QX-03` |
| **FRD deviations / extensions / gaps recorded** | **21** (`S-1` … `S-21`) |
| **New non-blocking details registered** | **16** (`ND-01` … `ND-16`) |
| **Files created by this document** | **1** — this document |
| **Files modified by this document** | **0** |
| **FRD modified** | ❌ No — `source/` and `requirements/` unchanged |
| **Earlier PM captures modified** | ❌ No |
| **Batches 01–05 modified** | ❌ No |
| `15-post-pm-alignment` / `16-unified-product-planning` modified | ❌ No |
| **Prototype / HTML / JS / CSS created** | ❌ No |
| **Backend / API / database schema created** | ❌ No |
| **Figma touched** | ❌ No |
| **Git commit made** | ❌ No |

**Precedence after this document:**

1. **This document** — stakeholder-confirmed, 31 August 2026
2. `PM_CONFIRMED_UPDATE_2026-08-25.md` (PM-16 – PM-18)
3. `PM_CONFIRMED_BASELINE_2026-08-18.md` (PM-01 – PM-12) + `13_PM_CLOSURE_DECISIONS.md` (PM-13 – PM-15)
4. FRD v5 consolidated set over `source/Platform FRD_v4.pdf` — **read-only**, deviations recorded in §D
5. Review 006
6. Historical prototype assumptions (Batches 01–05)

**An assumption is never silently converted into a confirmed requirement.**
