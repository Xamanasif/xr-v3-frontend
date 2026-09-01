# 15 — Implementation Strategy, Backlog and Sequence

| | |
|---|---|
| **Status** | ✅ **RECOMMENDED IMPLEMENTATION STRATEGY** |
| **Created** | 31 August 2026 |
| **Governing decisions** | `STK31-47` *(design from the complete journey; one product)* · `STK31-48` *(historical prototypes preserved unchanged)* · `PM29-01` · **PM-02** · **PM-03** |
| **⛔ Nothing here is started.** | This document plans the work. It does not begin it, and **no commit is made** |

---

# 1 · The strategy decision

## 1.1 The two options, compared

| | **OPTION A — patch all five batches, then merge** | **OPTION B — preserve the batches, build ONE corrected unified prototype** |
|---|---|---|
| **What happens to Batches 01–05** | Each is corrected **in place, in its own package**, then the five are merged | **Untouched.** They become reference implementations |
| **Where corrections land** | Five times, once per package | **Once**, in the unified build |
| **The Module → Experiment rename** | Performed in **five** packages, then re-verified after the merge | **Once** |
| **The five stylesheet copies** | Corrected five times *(they are byte-identical, `md5 8f9fa1b8…`)* | **Collapsed to one, then corrected once** |
| **The three known accessibility defects** | Applied per batch — the `--text-3` contrast fix, `--control-border` (**WCAG 2.1 SC 1.4.11**), the false `aria-haspopup` on three dead account buttons | **Applied once** |
| **The four duplicated components** | Two `.tabnav` implementations, two attention lists, four `openDialog()` copies, four label/value primitives — each fixed in place, then de-duplicated **again** at merge | **De-duplicated once, at construction** |
| **The split id namespace** — `shear` vs `c_shear` | Reconciled at merge, **after** five packages have been edited against the old ids | **Chosen once, before anything is written** |
| **The `torsion` data contradiction** — `MR`/unsupported in four batches, `VR`/runnable in Batch 02 **where the learner completes it** | Survives until the merge, because each batch is internally consistent | **Cannot exist** — one content pool |
| **The three incompatible entitlement models** *(B01 enum · B03 two-level · B04 transaction grant)* | Three models are corrected separately, then reconciled — and the reconciliation changes all three again | **One record, designed once, from the corrected requirements** |
| **Screens that must MERGE** | 9 built screens → 3 canonical. Under A they are **corrected 9 times, then merged** | **Built 3 times, once each** |
| **New capability areas** *(support, tenant allocation, tenant requests, provisioning, public catalogue, per-technology progress)* | Have **no home batch.** They must be built somewhere and then merged anyway | Built in place, in the product |
| **Historical validation** | 🔴 **Destroyed by editing.** The QA-passed state of each batch stops being the state that was reviewed | ✅ **Preserved.** Every batch remains exactly what was signed off |
| **Risk of the known-wrong being baked in** | 🔴 High — merging five navigations, a superseded catalogue position, a shipped terminology inconsistency and a missing auth layer | Low — the corrections are the **input**, not a later pass |
| **Wasted work** | Every correction to a screen that then MERGEs, is REFRAMEd, or is SUPERSEDEd | Near zero |

## 1.2 The recommendation

> ## ▶ **OPTION B.**
> **Preserve Batches 01–05 untouched as reference implementations, and build ONE corrected unified functional prototype from the stakeholder-confirmed requirements — reusing the validated screen patterns, components and state logic.**

### Why — five reasons, each evidenced

**1 · Option A pays for every correction twice, and the second payment is the expensive one.**
Correcting a screen inside its batch, then merging, means the merge re-touches it. **9 built screens collapse into 3 canonical ones**; under Option A those 9 are corrected first and merged second. The correction of the 6 that disappear is pure waste.

**2 · Four of the largest corrections have no home batch at all.**
Public catalogue, tenant request/approval, Super Admin tenant allocation, and support are **new capability areas**. Nothing to patch. Under Option A they would be built *outside* the batch structure and then merged — which is Option B, performed accidentally and without a plan.

**3 · Editing the batches destroys the only thing they are still good for.**
Batches 01–05 are **QA-passed, accessibility-reviewed, screenshot-documented records of what was validated**. `STK31-48` preserves them. Their value now is as **reference and as evidence**, not as a codebase. An edited batch is neither the old validated artefact nor the new product.

**4 · The known cross-batch defects are cheaper to avoid than to fix.**
Twenty-four reconciliation items need **no decision at all** — five identical stylesheets, three accessibility defects, six duplicate components, five data-correctness items, two copy collisions. Under Option A each is fixed per batch and then reconciled. Under Option B **the unified build simply never creates them.**

**5 · The prior sequence already reached this conclusion and stopped one step short.**
`ui-ux/15-post-pm-alignment/13_CONSOLIDATION_SEQUENCE.md` says plainly: *"Merging prototypes today would bake in a `Module`/`Experiment` inconsistency that is already shipped, five separate navigations, a catalogue in a superseded position, a Super Admin workspace known to be too small, and a missing authentication layer."* Its Stage 3 nevertheless prescribed patch-then-merge. **With the answers now in hand, the patch stage buys nothing that the unified build does not buy once.**

### What would have contradicted this

Recorded so the recommendation is falsifiable rather than assumed:

| Evidence that would favour Option A | Present? |
|---|---|
| Batches shipping to real users, so each needs a correct interim state | ❌ No. All five are internal functional prototypes |
| Corrections that are small, local, and never MERGE or SUPERSEDE | ❌ No. **7 architectural and 13 superseded items** in `02_PREVIOUS_DECISIONS_SUPERSEDED.md` |
| Independent codebases with independent lifecycles | ❌ No. **Five byte-identical stylesheets** and one shared sample world |
| Most new work fitting inside an existing batch's boundary | ❌ No. Four new capability areas have no home |

**None is present. Option B stands.**

## 1.3 What Option B explicitly does NOT mean

| It does not mean | Because |
|---|---|
| Deleting or archiving Batches 01–05 | `STK31-48` — they are preserved, referenced, and cited throughout this package |
| Rebuilding from scratch | **63 of 101 screens already exist**, and ~120 canonical components are proven. This is **reconstitution, not re-invention** |
| Discarding the sample world | ⚠ **The single most valuable asset to protect.** *Sample Engineering Institute*, Rahul Verma, Dr. Arjun Mehta and the six shared experiments already run through all five batches. **A careless merge destroys it; a deliberate build inherits it** |
| Redesigning the visual layer | **Visual redesign and Figma still wait** — PM-02, reinforced by `PM29-01`. Structure and behaviour first |

---

# 2 · Dependency analysis — what the sequence is derived from

The order below is **derived from dependencies, not from workspaces**.

> ### ⚠ Stage numbers and P0–P3 are IMPLEMENTATION PRIORITIES, not project phases
> **They are not equivalent to Phase 1 / Phase 2 / Phase 3.** Stages 0–10 and priorities P0–P2 are **all inside the current B2B delivery**. Building something later in the sequence never makes it *deferred*, *optional*, or *outside Phase 1*.
>
> **Stage 12 / P3 is the only genuinely deferred work**, and it contains only the **B2C secondary rollout** (`STK31-04`).

| # | Hard dependency | Consequence |
|---|---|---|
| **1** | Every workspace needs **one shell, one router, one state model** | Foundation first |
| **2** | Every authenticated surface needs **sign-in and workspace resolution** | Auth precedes all seven workspaces |
| **3** | The public catalogue's CTA is the **selection basket**, which prepares the **request** | Public and request are one unit |
| **4** | A tenant cannot exist before **Super Admin approval**; a Tenant Admin cannot act before **assignment** | Super Admin precedes Tenant Admin |
| **5** | A Tenant Admin cannot assign content that has not been **allocated** | Allocation precedes tenant assignment |
| **6** | Faculty cannot assess an Experiment no learner can reach | Tenant people + assignment precede Faculty |
| **7** | A learner cannot complete an assessment that no Faculty configured | Faculty precedes the learner assessment chain |
| **8** | The **catalogue needs published content**; the production chain fills it | The first B2B slice may use **seeded** content, so production can run **in parallel**. 🔴 **It is not thereby optional** — it is required for the current complete delivery |
| **9** | **Per-technology progress** depends on technology being carried on the access record | Technology dimension precedes progress |
| **10** | The **device-transfer approval already exists**; the learner end completes it | Device lifecycle can land late |
| **11** | Support depends on nothing except the shell | Support can land any time after Foundation |
| **12** | B2C depends on the B2B model being proven | Last (`STK31-04`) |

---

# 3 · The recommended implementation sequence

## Stage 0 — Foundation *(no dependencies)*

| Work | Detail |
|---|---|
| **One design system** | Collapse **five byte-identical stylesheet copies to one**; apply the `--text-3` contrast fix (4.30:1 → 5.43:1) and `--control-border` (1.84:1 → 3.51:1, **WCAG 2.1 SC 1.4.11**) **once**; restore `[hidden]`; fix `.empty h2` heading order and `.tmain`/`.tsub`; resolve the `.subtle-note` collision |
| **One shell + navigation** (`U-X-01`) | Batch 01's shell, used unchanged by all five batches. **One nav landmark label** — there are three today, and none matches the shell doc's own spec |
| **Component de-duplication** | One `.tabnav` · one attention list *(**adopt Batch 05's** — per-row `aria-label`)* · one state-node row · one label/value primitive · **adopt Batch 04's account menu** · delete four duplicate `openDialog()` copies |
| 🔴 **Accessibility defect fixes** | **Remove the false `aria-haspopup`/`aria-expanded` from three dead account buttons** (B01, B02, B03 announce a menu that never opens) |
| **One conceptual data model** | `17_CONCEPTUAL_DATA_AND_STATE_MODEL.md`. **One experiment id namespace** · **one technology enum, one label set, one device sentence per format** · fix the `torsion` contradiction · reconcile diverging experiment names · **decide whether the sample tenant joins the platform institution list** · **one progress model** (PM-09 already resolves it) |
| **Terminology — once** | `Module` → `Experiment` (`STK31-14`) · **`Release` vs `Publish` firewall** (`STK31-06`/`07`) — Batch 01's four *"release"* strings become *publish* · the `Licence` leak in Batch 01 learner copy |

> **Every item in Stage 0 needs no decision from anyone.** It is the work that cannot be wasted, and it is the reason Stage 0 exists before anything is drawn.

## Stage 1 — Authentication and workspace resolution · **P0**

`U-AUTH-01` sign in *(incl. the platform-authentication fallback state)* · `U-AUTH-06` workspace resolution · `U-AUTH-02` SSO redirect/return · `U-X-04` Help in one consistent location.

**Why first:** seven roles, one front door. **Everything public hands off to it**, and no batch ever built it.

## Stage 2 — Public and the B2B request · **P0**

`U-PUB-02` catalogue · `U-PUB-03` Programme/Department · `U-PUB-04` Course · `U-PUB-05` Experiment detail + technology selection · `U-PUB-06` selection basket · `U-AUTH-08` institution application · `U-AUTH-09` applicant status · `U-PUB-01` landing · `U-PUB-07` entry fork.

**Reuse:** Batch 04's catalogue card, grid, four filter controls, module detail and access-state derivation. **A signed-out visitor is the `none` case with a different CTA.**

## Stage 3 — Super Admin: approval, tenant, allocation · **P0**

`U-SA-04` request queue · `U-SA-05` decision · `U-SA-06` tenant creation · `U-SA-07` Tenant Admin assignment · `U-SA-08` content + technology allocation.

**Reuse:** ▶ **Batch 01's governance-review pattern is a near-exact fit** — queue, detail, decision with a required reason, a state the submitter sees, a history trail. ▶ **Batch 03's `INA-08` two-direction mapping** for allocation; **the receiving end already exists.**

## Stage 4 — Tenant Admin: people, provisioning, assignment · **P0**

`U-TA-01`…`U-TA-06` *(overview, people, person detail, manual add, CSV import, error report)* · `U-TA-09`/`U-TA-10` content access and assignment.

**Reuse:** ▶ **Batch 02's upload → per-row validation → error report → commit** · ▶ **Batch 03's `Issue Card` and Records Needing Attention.**
⚠ **The CSV ↔ ERP write conflict becomes reachable here.** Never overwrite silently; surface it as attention.

## Stage 5 — Faculty · **P0 / P1**

`U-FAC-02`…`U-FAC-05`, `U-FAC-07`, `U-FAC-08` **(P0)** · `U-FAC-01` tenant experiments, `U-FAC-09` AI drafts with source material, `U-FAC-10` descriptive evaluation queue, `U-FAC-11` progress/usage **(P1)**.

## Stage 6 — Learner core · **P0**

`U-LRN-01`…`U-LRN-09`. Mostly **MERGE** work — 9 built screens into 3 canonical ones, plus the **per-technology progress axis**, which is the one real shape change.

## Stage 7 — Content production · **P1** *(parallelisable with Stages 2–6 if the first slice uses seeded content)*

> 🔴 **REQUIRED FOR THE CURRENT DELIVERY, NOT DEFERRED.** Sequencing this after the first B2B vertical slice is an **implementation-order** decision. **Before the current complete B2B platform can be considered delivered, the Vendor → Academic Reviewer → Content Manager → Published workflow must be integrated.** It is **not** optional, **not** Phase 2, and **not** in the same category as the B2C rollout.

`U-VND-01`…`U-VND-04` · `U-ARV-01`…`U-ARV-03` *(incl. **Learning Outcomes authorship**)* · `U-CM-01`…`U-CM-04` *(incl. **Content Library** and canonical content metadata)*.

**The most intact block in the corpus — zero new screens.** Its corrections are field additions and the publish/release rewording.

## Stage 8 — Platform operations · **P1 / P2**

`U-SA-01`…`U-SA-03` *(overview, institutions, institution profile/report)* · `U-SA-09`/`U-SA-10` version release/hold · `U-SA-13` licensing and terms · `U-SA-14`/`U-SA-15` role governance and per-content assignment · `U-SUP-01`…`U-SUP-04` support · `U-COM-01`…`U-COM-03` payment where applicable.

## Stage 9 — Device lifecycle and operational completeness · **P2**

`U-LRN-10`/`U-LRN-11` device binding and transfer request *(completing a half-built cross-plane workflow)* · `U-SA-11`/`U-SA-12` · `U-SA-16` canonical metadata · `U-SA-17` configuration register · `U-SA-18` tenant deactivation · `U-TA-16`/`U-TA-17` · `U-AUTH-04`/`05`/`07`.

## Stage 10 — Consolidation QA

Cross-workspace continuity on **one sample world** · full state-model verification · **WCAG 2.2 AA pass on the consolidated product** · resolve `QX-01` *(does desktop-first ~1440px extend to every workspace — **a public catalogue is not a desktop-only surface in practice**)* and `QX-02` *(SC 1.4.10 Reflow, currently **NOT MET** by agreed scope)*.

## Stage 11 — Visual redesign and Figma

**Still deferred**, per **PM-02** and `PM29-01`. Everything before this stage is structure, behaviour and correctness.

## Stage 12 — B2C rollout · **P3**

`U-IND-01`…`U-IND-05`. **Only if and when the B2B model succeeds** (`STK31-04`). **Batch 04 is preserved intact until then.**

---

# 4 · The sequence in one view

```
 STAGE 0  FOUNDATION ......................... design system · shell · components · data model · terminology
    │                                          ⚠ needs no decision from anyone
    ▼
 STAGE 1  AUTH + WORKSPACE RESOLUTION ........ P0   everything hands off to it
    ▼
 STAGE 2  PUBLIC + B2B REQUEST ............... P0   catalogue → programme → course → experiment
    │                                               → technology → selection → request
    ▼
 STAGE 3  SUPER ADMIN APPROVAL + TENANT ...... P0   queue → decision → tenant → admin → ALLOCATION
    ▼
 STAGE 4  TENANT ADMIN ....................... P0   people · CSV · assignment from the approved set
    ▼
 STAGE 5  FACULTY ............................ P0/P1  assessment · question bank · descriptive evaluation
    ▼
 STAGE 6  LEARNER CORE ....................... P0   merge 9 → 3 · per-technology progress
    ▼
 STAGE 7  CONTENT PRODUCTION ................. P1   Vendor → Reviewer → CM   ‹‹ parallelisable
    │                                          🔴 REQUIRED for the current delivery — not deferred
    ▼
 STAGE 8  PLATFORM OPERATIONS ................ P1/P2  governance · release/hold · licensing · SUPPORT
    ▼
 STAGE 9  DEVICE + OPERATIONAL COMPLETENESS .. P2
    ▼
 STAGE 10 CONSOLIDATION QA ................... WCAG 2.2 AA · QX-01 · QX-02
    ▼
 STAGE 11 VISUAL REDESIGN + FIGMA ............ deferred by PM-02
    ▼
 STAGE 12 B2C ROLLOUT ........................ P3   only if the B2B model succeeds
```

---

# 5 · Reuse summary — what the unified build inherits

| From | Asset | Where it goes |
|---|---|---|
| **Batch 01** | Application shell · side nav · header · breadcrumb · page header | **The shell for the whole product** |
| **Batch 01** | Governance queue · review panel · decision dialog · **required reason** · history timeline · stage indicator | ▶ **Tenant request review · support issue resolution** — near-exact fits |
| **Batch 01** | Status badge grammar · alerts · toasts · empty states · loading · error grammar | Platform-wide |
| **Batch 01** | File upload with no format promise · metadata group (read-only and editable twins) | CSV import · the application form |
| **Batch 01** | XR access components — entitlement · compatibility · availability · completion | The learner core |
| **Batch 01** | **`Experiment` terminology** | ✅ **The winning term** |
| **Batch 02** | Assessment builder · question bank · question editor · AI drafts · completeness rail | Unchanged |
| **Batch 02** | **Upload → per-row validation → error report → commit** | ▶ **CSV people import** — near-exact fit |
| **Batch 02** | Attempt · review · submit · result · pending evaluation · **the derived progress model** | The learner core (**PM-09 confirms it**) |
| **Batch 03** | **Content access → eligibility → learner spine** | ✅ **Architectural — `STK31-24` fills its one blank** |
| **Batch 03** | People directory · person detail · academic structure · SSO · institution data | The tenant workspace |
| **Batch 03** | **Records Needing Attention** · `Issue Card` | ▶ CSV errors · ERP conflicts · **support attention** |
| **Batch 03** | **Two-direction mapping view** | ▶ **Super Admin tenant allocation** |
| **Batch 04** | **Access record as the single spine** · card · grid · four filters · module detail · access-state derivation | ✅ **The public catalogue's basis** |
| **Batch 04** | Payment outcomes (all three FRD 9.1.x) · **only success writes** · duplicate blocked at the route · functional **account menu** | Commerce · platform-wide |
| **Batch 05** | Institutions list + detail · version release/hold · device approval · **configuration register** · attention list with per-row `aria-label` | Platform operations |
| **Batch 05** | **The authority-audit method** · *"a gap is shown as a gap, never as a disabled control"* | ✅ **Adopt both platform-wide** |
| **All five** | **One coherent sample world** — the same institution, people and experiments | ⚠ **Protect it. It is worth more than any component** |

---

# 6 · What must not happen

| # | Prohibited | Why |
|---|---|---|
| **1** | Editing Batches 01–05, `15-post-pm-alignment/`, `16-unified-product-planning/`, the PM captures, Review 006, the FRD, `source/`, `requirements/` or `branding/` | Historical records · `STK31-48` |
| **2** | Renaming anything more than **once** | `STK31-14` — the corpus is 627 `Module` / 266 `Experiment` |
| **3** | Merging the five prototypes as code | **That is Option A's failure mode.** Build the corrected product; reference the batches |
| **4** | Visual redesign or Figma before Stage 11 | **PM-02**, reinforced by `PM29-01` |
| **5** | Inventing a price, an SLA, a priority formula, a payment provider, or an auto-review algorithm | `STK31-39` · `ND-08` · `ND-09` · `ND-12` |
| **6** | Building a payment screen on the internal / BITS-community route | `STK31-19` — **explicitly prohibited** |
| **7** | Restoring a seat cap that does not come from an approved request | `STK31-27` |
| **8** | Closing a `ND-nn` item without an answer | Fifteen stay visibly open |
| **9** | Shipping a disabled control where a capability does not exist | **A gap is shown as a gap** — Batch 05's rule |
| **10** | Committing without being asked | Standing instruction |
