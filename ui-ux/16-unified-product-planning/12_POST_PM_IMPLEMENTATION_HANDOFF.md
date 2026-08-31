# 12 — Post-PM Implementation Handoff

| | |
|---|---|
| **Status** | 🟠 **HANDOFF PLAN — DRAFT.** What becomes buildable the moment each answer lands |
| **Created** | 29 August 2026 |
| **Relationship to `13_CONSOLIDATION_SEQUENCE.md`** | That document owns the **stages**. This one owns **what unlocks per answer**, and **what is buildable regardless** |
| **⛔ Nothing here is started.** Stage 1 — PM clarification — is the only stage authorised to begin |

---

## 1 · What is buildable with **no** PM answer at all

**Twenty-two items. This is the most useful list in the document, because it is the work that cannot be wasted.**

### 1.1 Design-system reconciliation — **8 items**

| # | Work | Evidence |
|---|---|---|
| 1 | Collapse **five stylesheet copies to one** | Byte-identical, `md5 8f9fa1b8…`. **Nothing to reconcile** |
| 2 | Apply the **`--text-3` contrast fix once** | 4.30:1 → 5.43:1. Currently in B04/B05 only |
| 3 | Apply **`--control-border`** once | 1.84:1 → 3.51:1. **WCAG 2.1 SC 1.4.11.** B05 only |
| 4 | Apply **`[hidden]`** restoration once | Missing in B01, B02 |
| 5 | Apply the **`.empty h2`** heading-order fix once | Missing in B01, B02, B03 |
| 6 | Apply the **`.tmain`/`.tsub` display** fix once | B05 only, already written as a descendant selector |
| 7 | Resolve the **`.subtle-note` line-height collision** | 1.6 (B02) vs 1.55 (B03/B04) |
| 8 | Remove **B02's `.sample-tag` restyle** | It breaks the batch's own "extensions only" claim |

### 1.2 🔴 Accessibility defects — **3 items**

| # | Defect | Severity |
|---|---|---|
| 9 | **Remove the false `aria-haspopup`/`aria-expanded` from three dead account buttons** — B01, B02, B03 tell a screen-reader user a menu exists and open none | 🔴 **Real defect, on every screen of three batches, cheap to fix** |
| 10 | **Decide Help's consistent location** — SC 3.2.6 is **WCAG 2.2 level A** and the design target is AA. Present in B01–B03, dropped by B04, demoted by B05 | 🟠 |
| 11 | **One nav landmark label** — currently three, and **none matches the shell doc's own specification** | 🟠 |

### 1.3 Component de-duplication — **6 items**

| # | Work |
|---|---|
| 12 | Promote **one** `.tabnav` — B02's and B03's are byte-identical, written independently |
| 13 | Promote **one** attention list — **adopt B05's**, which carries a per-row `aria-label` |
| 14 | Promote **one** state-node row — `.lrow` / `.constat` / `.led` collapse to one primitive with three content variants |
| 15 | Promote **one** label/value pair — `.kv` / `.railkv` / `.sumline` / `.factrow`, four densities |
| 16 | Adopt **B04's account menu** and **B05's sign-out honesty** |
| 17 | Delete **four duplicate `openDialog()` copies**, incl. **B04's, which is never invoked** |

### 1.4 Correctness reconciliation — **5 items**

| # | Work | Why it needs no PM |
|---|---|---|
| 18 | **One experiment id namespace** — `shear` (B01/B02) vs `c_shear` (B03/B04/B05) | Pure identity; the noun question is separate |
| 19 | **Fix the `torsion` contradiction** — `MR`/unsupported in four batches, `VR`/runnable in B02, **where the learner completes it** | A data error |
| 20 | **Reconcile diverging experiment names** — *Bernoulli Flow Visualisation* vs *Bernoulli's Theorem*; *Geotechnical —* vs *Soil Mechanics — Consolidation Test* | Same |
| 21 | **Decide whether the sample tenant joins the platform list** — *Sample Engineering Institute* appears in **no** Batch-05 institution list | Sample-data coherence |
| 22 | **Adopt one progress model** — **`PM-09` already resolves it** in Batch 02's favour; B01's stored enum is the subset | Already answered |

### 1.5 And two copy reconciliations

| # | Work |
|---|---|
| 23 | **`Release`** — B05 firewalled the word to mean *not publication*; **B01's shipped copy still uses it to mean publish**, in four strings. *The smaller side changes.* **Both batches are internally correct** |
| 24 | **The `Licence` leak** — B03 and B04 ban the word and verify zero product-surface hits; **B01 reaches learner copy once** |

> **Twenty-four items, none needing a PM answer, all cheap now and expensive after a merge.** They are Stage 6 work, and they are the reason Stage 6 exists between the corrections and the consolidation.

---

## 2 · What each answer unlocks

### `PQ-01` — version-release ownership

| If | Then |
|---|---|
| **Super Admin keeps it** | `U-SA-07`/`U-SA-08` **KEEP unchanged**. The `Release`/`Version` reconciliation (§1.5 #23, §1.4) proceeds |
| **It moves to the Content Manager** | The pair **moves batch** — Batch 05 loses two screens, `U-CM-03` gains a decision. **The two version schemes must then be connected** (candidate **N-4**) |
| **Unanswered** | ✅ **Both stay.** *Removing on ambiguity is as wrong as adding* |

### `PQ-02` — what a Bundle is

| If | Then |
|---|---|
| **A group of experiments** | `U-IND-07`/`U-IND-08` un-DEFER; a card kind and a filter value are **added** to structures that already accept both |
| **A course-level package** | The **Course becomes an access unit** — this also answers candidate **N-3** |
| **Purely commercial** | It never appears in the catalogue as a content object |
| **Technology-related** | ⚠ It **collapses into `PQ-08`** and both must be answered together |
| **Unanswered** | ⛔ The word stays out of new work. Batch 04 unchanged |

### `PQ-03` — who approves a tenant, and who assigns its first admin

**The single largest unlock in the list.**

| If | Then | Reuse |
|---|---|---|
| **Super Admin, in-product** | `U-SA-04` + `U-SA-05` become buildable. `U-AUTH-09` applicant status becomes buildable | ▶ **Batch 01's queue + review panel + required reason + visible state + history is a near-exact fit — nine of fourteen components map directly** |
| **Another platform ops role** | ⚠ **An eighth role** — PM-07 fixed seven, and FRD 8.3 custom roles is **Phase 3**. **Flag immediately** | — |
| **A manual process** | Only a **request record** and an applicant-visible status. **No queue, no decision UI, no state machine** | Status badge + empty state |
| **Unanswered** | ⛔ **No onboarding surface is designed at all** | — |

### `PQ-04` — Module or Experiment, and what a Programme is

| Part | Unlocks |
|---|---|
| **(a) the noun** | **The rename — once, everywhere.** Corpus scale: **Module 627 · Experiment 266.** Batch 02 (129) and Batch 04 (302) carry the largest label loads. Cluster D2 can then merge |
| **(b) Programme** | ⟦S1⟧ closes. If it **is** the academic stream, **Batch 03 already built it under another name**. If it is a level **above**, Batch 03's structure gains a parent. If it is the deferred certification node, **escalate — that reverses PM-12** |

### `PQ-05` — who assigns an experiment to a student or group

| If | Then |
|---|---|
| **Institute Admin** | ✅ **Nothing changes** — Batch 03 already shows it that way as `DA-07` |
| **Faculty** | The eligibility editor **moves workspace**; `INA-07`'s list becomes read-only |
| **Institutional data** | The editor is replaced by a **provenance line**; `INA-08` becomes read-only reconciliation |
| **A combination** | Each relationship gains an **origin indicator** |
| **Unanswered** | `DA-07` holds, **claiming no assigner** |

> ▶ **In every case the learner-side result is identical.** That is the property Batch 03 was built for, and it is why this answer is cheap to receive late.

### `PQ-06` — cart, request list, or plain enquiry

**Gates the public catalogue's primary button, and therefore the whole public area.**

| If | Adds |
|---|---|
| **Request list** | A request object · a request state · a submit step · an applicant status. ▶ **A different object from a cart**, not a variant |
| **Cart** | A cart surface · cart state · multi-item summary. ⚠ *The PM explicitly said B2B may not behave this way* |
| **Plain enquiry** | **Nothing** — an application form only. **The cheapest answer** |
| **Unanswered** | ⛔ `U-PUB-02` and `U-PUB-04` cannot ship, and `U-IND-02` stays blocked |

### `PQ-07` — B2C authorisation and timing

| If | Then |
|---|---|
| **Approval before payment** | **One state** is added between the action and payment — *not a redesign* |
| **B2C stays Phase 1** | `U-IND-01` period selector becomes buildable |
| **B2C moves later** | Batch 04 is **preserved and deferred as a whole**. Still nothing deleted |

### `PQ-08` — technology, property or variant

| If | Then |
|---|---|
| **A property** *(today)* | ✅ **Nothing changes.** R3 is simply never rendered. **No route, breadcrumb or level was created in the meantime** |
| **A selectable variant** | R3 renders in a slot that already exists; the access record gains a technology; pricing may follow. **The IA does not move** |

> ▶ **This is the answer the IA was specifically constructed to survive** — see `05_PUBLIC_CATALOGUE_IA.md` §4.

### `PQ-09` · `PQ-12` — role and learner terminology

| Answer | Cost |
|---|---|
| **`Institute Admin` stays** | ✅ Zero — 227 occurrences already say it, and **`Tenant Admin` returns zero in every form** |
| **`Tenant Admin` wins** | A mechanical rename across every Batch-03 screen, route, document and string |
| **`Student` and `Learner` are one role** | ✅ Zero — the status quo |
| **They split** | The label becomes **context-dependent** across the **largest, most finished part of the product** |

### `PQ-10` — the learner metadata read-back

| Unlocks | ⚠ Raise at the same time |
|---|---|
| `U-TA-05` CSV columns · `U-TA-07` course code · `U-FAC-05` course/semester | **`Semester` has no Phase-1 basis** — its only v5 appearance is a **Phase-2** version-locking line · **no course-code field exists anywhere** · 🔴 **the ERP is authoritative and sync overwrites, so a CSV route creates a real write conflict (`QD-01`, open since Review 006)** |

### `PQ-15` — Vendor / Reviewer governance scope

Determines whether `U-SA-14` is an **account registry**, an **assignment surface**, or **both** — and at what level: globally, per course, or per experiment.

---

## 3 · Build order once unblocked

**Ordered by dependency, not by workspace. This mirrors `13_CONSOLIDATION_SEQUENCE.md` Stage 5.**

| # | Area | Depends on | Reuse |
|---|---|---|---|
| **1** | **Authentication + workspace resolution** | `PQ-03`, `PQ-07`, `PQ-12` + the entry fork + SSO fallback (`QT-04`) | ▶ **Everything public depends on it, which is why it is first once unblocked** |
| **2** | Public landing · catalogue · course · experiment detail | Structure safe now; **CTA needs `PQ-06`** | **B04's catalogue components** |
| **3** | Entry fork | `PM29-06` clear; downstream branch is not | Shell |
| **4** | Tenant application → validation → authorisation → creation | **`PQ-03`** | ▶ **Batch 01's governance-review pattern, if in-product** |
| **5** | Super Admin tenant content allocation | The **allocation unit** | ▶ **Batch 03's two-direction mapping view. The receiving end already exists** |
| **6** | Tenant Admin people provisioning — manual + CSV | **`PQ-10`** | ▶ **Batch 02's upload → per-row error → commit** + **Batch 03's issue card** |
| **7** | Faculty view of tenant experiments | Nothing structural | ▶ **Batch 04's catalogue components** |
| **8** | Learner device binding + replacement request | — | ▶ **The approval end already exists in Batch 05 — this completes a half-built cross-plane workflow** |
| **9** | B2C access periods | `PQ-07` | Batch 04's access spine |
| **10** | Remaining gap-audit items | Stage 4's backlog | — |

---

## 4 · The handoff rules

| # | Rule | Source |
|---|---|---|
| 1 | **Correct in place, in each batch's own package, before merging anything** | Stage 3 |
| 2 | **A correction is a correction, not a redesign.** Anything that becomes a redesign belongs in Stage 5 | Stage 3 |
| 3 | **The formal gap audit runs after the corrections**, never before | Stage 4 |
| 4 | **Terminology is resolved exactly once**, at Stage 6 | `PQ-04` · `PQ-09` · `PQ-12` |
| 5 | **Merging is not allowed before Stage 7** | `N2` — *the specific mistake this sequence exists to prevent* |
| 6 | **Visual redesign and Figma wait for Stage 9** | PM-02 · `PM29-01` |
| 7 | **Never edit the FRD, `source/`, `requirements/`, the PM captures, or Review 006** | Historical records |
| 8 | **Never close an open question without a PM answer** | Twelve stay visibly open |

---

## 5 · The asset worth protecting

> **The same sample world already runs through all five batches** — *Sample Engineering Institute*, Rahul Verma, Dr. Arjun Mehta, and the six shared experiments beginning with *Soil Mechanics — Direct Shear Test*.
>
> A consolidated prototype inherits **a coherent world rather than five unrelated demos**. That is worth more than any component, and it is the one thing a careless merge would destroy — which is exactly why §1.4 items 18–21 exist.
