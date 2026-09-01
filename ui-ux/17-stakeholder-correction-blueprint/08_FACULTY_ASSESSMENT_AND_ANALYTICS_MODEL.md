# 08 — Faculty, Assessment and Analytics Model

| | |
|---|---|
| **Status** | ✅ **CURRENT FACULTY / ASSESSMENT MODEL OF RECORD** |
| **Created** | 31 August 2026 |
| **Governing decisions** | `STK31-29` · `30` · `31` · `32` · `33` · `34` · `35` · `43` |
| **Standing constraints preserved** | **PM-08** *(assessment is configurable; earlier values are SAMPLE)* · **PM-15** *(a learner never authors or configures an assessment)* · **PM-11** *(no invented dashboards or KPIs)* · **`D-25`** *(a learner never sees the answer key)* |

---

## 1 · The Faculty workspace — `STK31-29`

Faculty should be able to see:

| Area | Built? |
|---|---|
| **Experiments available to their Tenant** | 🔴 **No Faculty browse surface exists in any batch** |
| Student / group assignment context | 🟠 Partly — Batch 02 `B02-assign` |
| Assessment configuration | ✅ Batch 02 `B01` / `B02-*` |
| Question Bank | ✅ Batch 02 `B04` / `B05` / `B06` |
| Student results | ✅ Batch 02 `B11` (learner side); Faculty-side roll-up minimal |
| Completion / progress | 🟠 Minimal, deliberately kept small per PM-11 |
| Experiment usage | 🔴 Not built |
| Time spent / usage indicators | 🔴 Not built — FRD 11.1.2 records it |
| Assessment outcomes | 🟠 Partly |

> ### What *"analytics"* means — `PQ-14` closed
> **Operational learning analytics only.** Not broad executive analytics, not KPI dashboards, not vanity metrics.
>
> **PM-11 is scoped, not overridden.** Every item above maps to a Phase-1 FRD **recording** requirement — 11.1.1 completion, 11.1.2 time spent, 11.2.1 scores, 11.2.2 attempts — and stays inside FRD 1.3.4's tenant boundary. **Every FRD dashboard requirement (8.2.x, 11.3.x, 11.4.x) is Phase 2 or 3 and remains deferred.**

### Faculty / tenant reporting content — `STK31-43`

Which Courses/Experiments the Faculty is delivering · how many Students are assigned · Student groups · completion · assessment outcomes · Experiment usage · time spent.

> **Metrics must map to source-supported data. Do not create decorative dashboards.**
> A number with no recording requirement behind it does not get displayed.

---

## 2 · Assessment ownership — `STK31-30`

**Faculty owns assessment configuration. A Student/Learner does not configure assessment.**

Question types supported: **MCQ · True/False · Descriptive** (FRD 5.2.1 / 5.2.2 / 5.2.3).

**Unchanged and validated:**

| Preserved | Source |
|---|---|
| Assessment Builder — Questions · Settings · Assign, with a completeness rail | Batch 02, PM-08 |
| Configuration-generated learner disclosure — the learner is told what the assessment is before starting | Batch 02, `D-06` structural behaviour |
| Every parameter is **SAMPLE**, never a platform constant | **PM-08** |
| A learner never authors or configures an assessment | **PM-15** · matrix `F12` |
| A learner never sees the correct-answer key | **`D-25`** · matrix `F11` |
| Progress never marks an Experiment complete while a result is pending | Batch 02 |

---

## 3 · Descriptive-answer evaluation — `STK31-31`

> ### 🔴 This closes `QP-02` — the only open item that could strand a learner mid-progression.

**FACULTY is the ONLY human role responsible for descriptive-answer evaluation.**

```
Learner submits a descriptive answer
        ▼
RESULT: PENDING EVALUATION                      ← Batch 02 already models this state
        ▼
   ┌────────────────────────────────────────┐
   │  FACULTY EVALUATION                    │   ← 🔴 no queue surface exists yet
   │                                        │
   │  optional: AUTO REVIEW assists          │   ← "similar to the referenced Taxila model"
   │            · marked as assistance       │
   │            · NEVER auto-final           │
   │                                        │
   │  FACULTY decides                        │   ← the human decision is the outcome
   └────────────────────────────────────────┘
        ▼
RESULT: FINAL — progression continues
```

### The four rules that govern auto-review

| # | Rule |
|---|---|
| **1** | **Faculty ownership is preserved.** Auto-review **assists**; it does not replace |
| **2** | **If exact Taxila auto-review behaviour is not available in the repo, do NOT invent it.** It is not available — recorded as `ND-09` |
| **3** | **Do NOT assume an AI-generated score is automatically final** unless a source confirms it. No source does |
| **4** | An auto-review output must be **visibly attributed as machine-assisted** before a human confirms it — the same discipline Batch 02 already applies to AI question drafts (*"AI generated · review required"*) |

**Safe reversible UX until `ND-09` resolves:** build the **Faculty evaluation queue and the manual decision**. Leave auto-review as an **optional, clearly-labelled assist affordance whose absence changes nothing** — if it never arrives, the queue still works.

---

## 4 · Answer / explanation visibility — `STK31-32`

> ### 🔴 This closes `QP-27`.

**Faculty controls this policy.** For general / non-BITS contexts, support:

| Option | Meaning |
|---|---|
| **Show immediately** | Explanations become visible as soon as the attempt is submitted/graded |
| **Show after assessment deadline** | Visible once the assessment's deadline passes |
| **Show on custom date** | Visible from a date the Faculty sets |

For **BITS cases**, the review said to **refer to Taxila behaviour**. Taxila's implementation is not in the current sources, so this is recorded as:

> **BITS feedback timing = TAXILA-REFERENCE PENDING IMPLEMENTATION DETAIL** (`ND-10`)

**The Taxila rule is NOT invented.**

> ⚠ **`D-25` is untouched.** These options govern **when explanations become visible after an attempt**. They do **not** expose the correct-answer key during an attempt, and they do not change Batch 02's per-question-correctness-without-the-key result model.

**Safe handling for the BITS case until `ND-10` resolves:** make the policy a **configuration value with an explicitly-labelled institutional default**, so a BITS-specific behaviour can be selected later **without changing the control**.

---

## 5 · AI-assisted question generation — `STK31-33`

**Do NOT rely only on random / local AI question generation.**

```
FACULTY SUPPLIES INPUT
   · upload source document / material          ← 🔴 NEW. Batch 02 takes a prompt only
   · and/or a prompt / context                  ← ✅ exists (Batch 02 B06)
        ▼
AI GENERATES DRAFT QUESTIONS
        ▼
CLEARLY MARKED "AI GENERATED / REVIEW REQUIRED"  ← ✅ exists, and is mandatory
        ▼
FACULTY REVIEWS
   · edit            ← ✅ exists (B05 edit-AI-draft)
   · delete / discard ← ✅ exists
   · accept           ← ✅ exists
        ▼
QUESTION BANK
```

| | |
|---|---|
| **What is new** | The **source-material input** |
| **What is unchanged** | Everything else. **Faculty review remains mandatory** |
| **What is not built** | Any real AI integration. **The provider remains technically pending** |

**FRD basis.** FRD **5.1.2** *AI Question Generation* is **Phase 1** and Faculty-owned — a requirement the original Student-only scope never surfaced, caught during the 18 August capture (`F-6`).

---

## 6 · Question Bank enhancements — `STK31-34`

| Capability | Status |
|---|---|
| Add question | ✅ Batch 02 `B05` |
| Edit question | ✅ Batch 02 `B05` |
| **Delete question** | 🔴 **NEW** — absent from Batch 02. **The user-facing action is `Delete`** |
| AI-generated draft acceptance | ✅ Batch 02 `B06` |
| Upload / import questions or material | ✅ Batch 02 `B04` — spreadsheet upload with **per-row error reporting** (FRD 5.1.1); 🔵 extends to **source material** for AI generation |

**Existing Question Bank work is preserved.** **File formats are not invented beyond planning** until an implementation detail is selected.

> ### The delete affordance — `Delete` is the requirement
> **Stakeholders explicitly requested a DELETE option.** The user-facing requirement is **`Add` · `Edit` · `Delete`**, and it must **not** be replaced by `Retire` or `Archive`.
>
> **Safe future UX:**
> ```
> Delete -> confirmation -> the question is removed from the ACTIVE Question Bank
>                        -> historical attempts and results are PRESERVED
> ```
>
> **`STK31-22` applies to the MECHANISM, not to the label.** Implementation may use a reversible / soft-delete mechanism underneath — especially where a question already carries historical assessment usage — so that deleting a question never destroys the attempts and results that reference it. **Do not invent a permanent destructive database operation**, and never delete silently from under a live assessment (`ND-15`).

---

## 7 · Assessment placement and the integration boundary — `STK31-35`

Assessment may exist:

```
   A.  OUTSIDE the Experiment, in the portal          ✅ built (Batch 02)
             and / or
   B.  EMBEDDED inside the Experiment / application   🔵 new — boundary only
```

**Portal-configured assessment information may need API/integration support so it can appear inside XR/Web applications.**

The Experiment/application should return operational information such as:

- **completion**
- **time spent**
- **progress / results where applicable**

> ### ⛔ Do NOT implement any API or backend now.
> **Document the required future integration boundary. That is the whole deliverable here.**

### The boundary, stated conceptually

```
   PLATFORM (portal)                          EXPERIMENT / APPLICATION
   ─────────────────                          ────────────────────────
   assessment configuration      ──────────▶  rendered inside the app (case B)
   entitlement / technology      ──────────▶  what this learner may run
                                 ◀──────────  completion
                                 ◀──────────  time spent
                                 ◀──────────  progress / result where applicable
```

**Standing open items this touches, none of them resolved here:** `QT-03` (assessment configuration API contract, HIGH) · `Q-42` (recovery when a completion event never arrives) · `Q-43` (server-authoritative assessment timer) · `QT-01` (the XR delivery mechanism itself, pending by explicit PM-05 instruction).

**PM-08 already required this**: *"the configured assessment must be consumable by the relevant Web/XR application through flexible platform/API integration."* `STK31-35` makes the two placements explicit and adds the return direction.

---

## 8 · What this model deliberately does NOT contain

| Not modelled | Why |
|---|---|
| Any analytics KPI, index, score or composite metric | **PM-11** · `STK31-29`. A number without a recording requirement behind it is not displayed |
| Executive / revenue / cross-tenant dashboards | PM-11 · FRD 1.3.4 · `STK31-29` |
| The Taxila auto-review algorithm | `ND-09` — **explicitly not invented** |
| The BITS feedback-timing rule | `ND-10` — **explicitly not invented** |
| An AI provider, model, or prompt contract | `STK31-33` — technically pending |
| A rubric for descriptive grading | `QD-08`-adjacent; no source contains one |
| A turnaround time or SLA for descriptive evaluation | No source states one. The learner-facing wording stays *"the required evaluation"* |
| Any API endpoint, payload or schema | `STK31-35` — **boundary only** |
| A file format for question or material import | `STK31-34` — planning only |
