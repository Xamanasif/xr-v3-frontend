# Batch 02 — Source & Scope Audit

**Package:** `ui-ux/13-full-platform-design/batch02-assessment/` · **Branch:** `uiux/full-platform-design` · **Date:** 2026-08-20
**Flow:** Review-006 **FLOW 4 — Assessment Authoring to Result** (Rank 3 in the Review-006 priority list)
**Roles in batch:** **Faculty** · **Learner**. No other role is introduced or detailed.
**Figma:** deferred — unchanged from Batch 01.

This audit was completed **before** design work. Every element in the Batch-02 wireframes and prototype traces to a row below. Classification legend:

| Class | Meaning |
|---|---|
| **CONFIRMED** | Stated by the FRD or a PM decision. Designed as required behaviour. |
| **SUPPORTED CONFIGURATION** | The *field* is supported by the authoritative model; **every value shown is SAMPLE DESIGN DATA**, never a default or recommendation. |
| **DESIGN ASSUMPTION** | Reversible design position taken to make the flow usable; labelled and revisitable. |
| **PRODUCT-PENDING** | Awaiting a product decision. Represented without resolving it, or omitted. |
| **TECHNICAL-PENDING** | Awaiting a technical decision. Kept abstract. |

---

## 1 · Authoritative sources read

1. `requirements/updated-frd/Core frd.pdf` (v5 consolidated) — Chapter 11 Assessment Model, role capability tables, Table 20 configuration-field classification.
2. `requirements/updated-frd/TL frd.pdf` — §7 How Assessments Work; high-priority open questions.
3. `requirements/updated-frd/Detailed frd.pdf` — requirement-level text and acceptance criteria for 5.1.1, 5.1.2, 5.2.1–5.2.3, 5.3.1, 5.3.2, 8.1.4, 11.2.1, 11.2.2.
4. `requirements/updated-frd/Platform_FRD_v5_CHANGE_SUMMARY.md` and `Platform_FRD_v5_OPEN_QUESTIONS.md`.
5. `ui-ux/00-project-context/PM_CONFIRMED_BASELINE_2026-08-18.md` (PM-01 … PM-12, esp. PM-08, PM-09, PM-11, PM-12).
6. All of `ui-ux/12-full-platform-reframe/` — esp. `08_ASSESSMENT_CONFIGURATION_MODEL.md`, `02_ROLE_PERMISSION_MATRIX.md` (§F), `05_END_TO_END_WORKFLOWS.md` (FLOW 4), `10_FULL_PLATFORM_SCREEN_INVENTORY.md`, `11_OPEN_QUESTIONS_REFRAMED.md`, `13_PM_CLOSURE_DECISIONS.md` (PM-15).
7. `ui-ux/13-full-platform-design/` — Batch-01 foundations, shell, component system, prototype (visual & interaction baseline; **not modified**).

**Authority order applied:** PM-confirmed decisions → FRD + consolidated FRD v5 → Review 006 + PM closure → Batch-01 patterns → compatible historical Student design → labelled design assumptions. No unresolved question was converted into a requirement.

---

## 2 · Assessment-related Phase-1 requirements in scope

| Req | Text (abridged) | Class | Batch-02 treatment |
|---|---|---|---|
| **5.1.1** | Faculty shall upload quiz question banks through structured spreadsheet templates | **CONFIRMED** | Question Bank “Upload questions” path; upload report lists **invalid rows individually** (acceptance criterion). Template structure is **TECHNICAL-PENDING** — no format promise made. |
| **5.1.2** | Faculty shall generate assessment questions using AI tools integrated into the platform | **CONFIRMED** — an original FRD **Phase-1 requirement** (PM-clarified 2026-08-20). The final implementation approach, AI provider and technical integration remain to be determined (**TECHNICAL-PENDING**). | Designed as a **secondary, Faculty-owned assistance path**: request → drafts marked **AI-generated · Review required** → Faculty edits/discards/accepts. **No generated question reaches a learner without Faculty acceptance** (v5 acceptance criterion). Prototype-local only; no real AI call; no provider named. |
| **5.2.1** | MCQ assessments supported | **CONFIRMED** | MCQ authoring + attempt rendering + auto-scoring per configuration. **Single vs multi-select is PRODUCT-PENDING** → rendered single-select (design assumption A2). |
| **5.2.2** | True/False questions supported | **CONFIRMED** | Authoring + attempt rendering + auto-scoring. |
| **5.2.3** | Short descriptive answer questions supported | **CONFIRMED** (type) · grading owner **PRODUCT-PENDING** | Authoring + attempt textarea. Submitted descriptive answer → explicit **Result pending evaluation** state (v5 acceptance criterion). **No grading owner asserted, no turnaround, no rubric, no grading workspace.** |
| **5.3.1** | Questions *may* be randomized for each attempt | **CONFIRMED** (per-assessment setting) | Builder toggle; **current value disclosed to the learner before the attempt** (v5 acceptance criterion). |
| **5.3.2** | Faculty shall be able to *enable* negative marking | **CONFIRMED** (per-assessment toggle) | Builder toggle; **pre-attempt disclosure states the configured behaviour** — when disabled, the disclosure does not mention it. Penalty *value* is SAMPLE. |
| **8.1.4** | Faculty role: course assignments, assessments, student performance monitoring | **CONFIRMED** | Faculty owns the assessment workspace; assignment to a learning context; operational result visibility (kept minimal per PM-11). |
| **11.2.1** | Assessment scores stored against the learner profile | **CONFIRMED** (always on) | Result recorded; visible to the learner; shown as recorded state — not a Faculty analytics surface. |
| **11.2.2** | Attempts recorded | **CONFIRMED** (always on) | Attempt history on the learner introduction screen; recording is independent of any configured limit. |
| **PM-08** | Assessment behaviour configured through the portal, consumed by Web/XR applications through flexible APIs; earlier fixed values are sample configuration only | **CONFIRMED** | The entire batch. One local configuration object drives both workspaces (see `02_ASSESSMENT_UX_MODEL.md`). API contract untouched (**TECHNICAL-PENDING**, QT-03). |
| **PM-15** | Faculty / institution-authorized side owns setup for **both** B2B and B2C; the learner **never** authors or configures (F12) | **CONFIRMED** | No learner-side authoring control exists anywhere in the batch. Pure-B2C operational mapping deferred (QP-25) — not designed. |
| **PM-09 / D-08 / D-07** | Resources → Simulation → Assessment → Completion; completion gates progression | **CONFIRMED** | Assessment availability requires the module's simulation completion; module completion requires the final assessment result. |
| **PM-11** | Operational status only; no analytics dashboards | **CONFIRMED** | No Faculty KPI dashboard, no reports. Assessment list + status only. |
| **PM-12** | Certification is Phase 2 | **CONFIRMED** | No certification anywhere. |

## 3 · Role permissions applied (Review-006 matrix, §F)

| Capability | Faculty | Learner |
|---|---|---|
| Question bank upload (F1) | ✅ create/edit/manage (tenant) | — |
| AI question generation (F2) | ✅ create (tenant) | — |
| Assessment configuration (F3) | ✅ create/edit/configure | — |
| Negative marking (F4) / randomization (F5) | ✅ configure | — |
| Assign assessment to learning context (F6) | ✅ | — |
| Attempt assessment (F7) | — | ✅ self |
| View own result & attempt history (F8) | — | ✅ self |
| View learner results (F9) | ✅ tenant (kept minimal per PM-11) | — |
| Grade descriptive answers (F10) | **`?` OWNER UNDEFINED** — not designed | — |
| See the correct-answer key (F11) | ✅ tenant (authoring surfaces only) | ⛔ **never** |
| Author/configure as learner (F12) | — | ⛔ **prohibition** |

---

## 4 · Configuration fields represented

### 4.1 CONFIRMED configurable (explicit FRD basis)

| Field | Source | In Batch 02 |
|---|---|---|
| Question types enabled (via included questions) | 5.2.1–5.2.3 | Builder question selection; types visible per question |
| Question selection / bank source | 5.1.1, 5.1.2 | Builder “Questions” tab ← Question Bank |
| Question randomization | 5.3.1 | Toggle + learner disclosure |
| Negative marking enabled | 5.3.2 | Toggle + configuration-aware disclosure |
| Assignment target (learning context) | 8.1.4 | Builder “Assign” tab (module context; SAMPLE) |
| Attempt recording | 11.2.2 | Always on — shown, not configurable |
| Score recording | 11.2.1 | Always on — shown, not configurable |

### 4.2 SUPPORTED CONFIGURATION — field required by the model, **no approved value exists**

All values in the prototype for these fields are **SAMPLE DESIGN DATA**, and the UI presents them as *assessment-specific settings*, never platform rules. The Review-005 historical bundle (10 questions · 20 min · +2/+1/−1 · 10/20 pass · unlimited attempts) is **not** reused as a set.

| Field | Batch-02 sample usage |
|---|---|
| Question count | Derives from selected questions (5 in sample A, 3 in sample B) |
| Time limit + timing model | Sample A: 25-minute total budget · Sample B: **no time limit** — deliberately different to prove variation |
| Marks per correct / incorrect / unanswered | Sample A: +2 / −0.5 / 0 · Sample B: +2 / — (negative marking off) / 0 |
| Pass threshold | Sample A: 50% · Sample B: 60% |
| Attempt limit | Sample A: 2 · Sample B: 1 |
| Score floor | Sample A/B: reported score not below zero (shown as a setting) |

### 4.3 Not designed as fields (pending — preserved open)

Descriptive grading owner/turnaround/rubric (QP-02) · post-attempt feedback & answer-key policy (QP-27) · **hints** (QP-20 — omitted entirely, in both workspaces) · single vs multi-select MCQ · extended-time accommodation · Institute Admin assessment authority (QP-08) · platform-level default configuration (QP-21 — none invented) · configuration reuse across courses/cohorts · configuration change between attempts (QP-22).

---

## 5 · Screen selection (stable Review-006 IDs)

Target met: **12 base screens** (+ dialog + curated states). Existing IDs used wherever they exist; the two surfaces without inventory IDs are marked.

| Batch ID | Inventory ID | Screen | Role |
|---|---|---|---|
| B01 | `FAC-06` | Assessments (list) | Faculty |
| B02 | `FAC-07` | Assessment Builder — Questions · Settings · Assign (+ status rail) | Faculty |
| B03 | *(new surface — extends `FAC-07`)* | Assessment Preview (learner view) — design assumption A4 | Faculty |
| B04 | `FAC-08` | Question Bank | Faculty |
| B05 | *(new surface — extends `FAC-08`)* | Question Editor (create/edit; also edits AI drafts) | Faculty |
| B06 | `FAC-09` | AI Question Drafts (generate → review → accept/discard) | Faculty |
| B07 | `LRN-04` | Module Detail — assessment step in the learning sequence | Learner |
| B08 | `LRN-09` | Assessment Introduction — disclosure generated from configuration | Learner |
| B09 | `LRN-10` | Assessment Attempt | Learner |
| B10 | `LRN-10` (review state) | Review Answers (pre-submission) | Learner |
| B11 | `LRN-12` | Result — immediate **and** pending-evaluation states | Learner |
| B12 | `LRN-13` | Progress | Learner |
| — | `LRN-11` | Submit Confirmation — **dialog**, not a page | Learner |
| — | `FAC-11` | Descriptive evaluation queue — **not designed**; represented only by a clearly separated annotation ("PROTOTYPE NOTE — NOT PRODUCT UI"), no tool and no product surface | Faculty |

`SHR-02` (shell), `SHR-03` (search/filter), `STATE-05` (empty), `STATE-06` (loading), `STATE-03` (error grammar) are consumed from Batch 01 unchanged.

---

## 6 · Design assumptions introduced (all reversible)

| # | Assumption | Why | Revisit when |
|---|---|---|---|
| **A1** | **Lifecycle terminology: Draft → Configured → Assigned** (assigned = available to learners per the configured learning flow). No publish/governance workflow for assessments. Question-bank status wording (**Ready** · AI-generated draft) is likewise design-assumption lifecycle wording — "Ready" implies no separate approval process. | Review-006 `FAC-07` lists exactly these states; the FRD names none. Conservative, reversible wording. | PM confirms assessment lifecycle vocabulary |
| **A2** | MCQs render **single-select** | Single/multi is a pending decision; single-select is the conservative subset that any resolution can extend | Single/multi decision |
| **A3** | **Manual create/edit of a single question in the portal** | FRD names spreadsheet upload (5.1.1) and AI generation (5.1.2) as sourcing; a minimal editor is required anyway to *review/edit AI drafts* and to fix rows the upload report flags. Extending it to manual creation is a small reversible step consistent with Faculty bank ownership (F1 “create/edit/manage”). | PM review of authoring scope |
| **A4** | **Faculty preview (learner view)** before assigning | PM-08 makes the configuration drive the learner experience; a preview is the only way Faculty can verify what the configuration produces. Renders the same components as the learner screens — zero new learner-facing behaviour. | PM review |
| **A5** | **Review-answers step + submit confirmation** before submission | Retained Review-005 interaction pattern (KEEP per Review-006 screen dispositions); prevents accidental submission (task §30–31) | — |
| **A6** | Timer expiry behaviour: the prototype **prompts** the learner to submit; it does not auto-submit | No requirement defines expiry behaviour; prompting is the least destructive reversible choice | Product decision on timing enforcement |
| **A7** | Answers are saved into the attempt as they are given (“saved” shown); leaving mid-attempt resumes | Removes the unsaved-work failure mode without inventing a save-button policy | Technical design |

## 7 · What Batch 02 deliberately does NOT resolve

- **Who evaluates descriptive answers** — the learner sees *“the required evaluation”*; on the Faculty side the topic appears only as a clearly separated annotation labelled **PROTOTYPE NOTE — NOT PRODUCT UI** (no evaluation queue or grading surface is presented as product UI). **PRODUCT-PENDING (QP-02).**
- **Turnaround time for evaluation** — never stated. **PRODUCT-PENDING.**
- **Answer-key / per-question feedback policy** — result screens show score, pass state and attempt history only, plus: *“Detailed answer feedback depends on the assessment's approved feedback policy.”* Correct answers appear **only** in Faculty authoring surfaces (F11). **PRODUCT-PENDING (QP-27).**
- **Hints** — absent from both workspaces. **PRODUCT-PENDING (QP-20).**
- **Assessment configuration API contract** — nothing in the batch names an endpoint, payload, field name or protocol. The prototype's single JS object is **prototype state, not a schema proposal**. **TECHNICAL-PENDING (QT-03).**
- **Spreadsheet template structure** — upload is simulated; helper copy: *“The upload template will be confirmed by the platform team.”* **TECHNICAL-PENDING.**
- **Pure-B2C assessment authoring operations** (QP-25) — the batch designs the B2B institutional route only, per instruction.
- **Institute Admin assessment authority** (QP-08) — not granted, not designed.
- **Platform default configuration** (QP-21) — new assessments start empty, not pre-filled with platform values.
