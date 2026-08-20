# Batch 02 — Assessment UX Model

How the assessment experience is structured, and how the design proves PM-08's rule: **assessment behaviour is configuration-driven, never a platform constant.**

---

## 1 · The end-to-end shape (FLOW 4)

```
FACULTY (portal, tenant-scoped)                          LEARNER (web; XR consumes the same configuration)
─────────────────────────────────                        ─────────────────────────────────────────────────
Question Bank                                            Module detail (LRN-04)
  upload via spreadsheet (5.1.1) ·                          resources ✓ → simulation ✓ → ASSESSMENT
  AI drafts, reviewed (5.1.2) ·                             "why is this available" is always answered
  manual add/edit (assumption A3)
        ↓
Assessment Builder (FAC-07)                              Assessment Introduction (LRN-09)
  Questions ← bank ("Ready" only)                           disclosure GENERATED from the configuration
  Settings  = the configuration object                      + attempt history (11.2.2)
  Assign    = learning context (8.1.4)
        ↓ preview (learner view)                          Attempt (LRN-10) → Review answers → Submit (LRN-11 dialog)
Draft → Configured → Assigned (A1)                          timer only if configured · no hints · no correctness
        ↓                                                        ↓
   [ flexible platform/API integration — PENDING, QT-03 ]   Result (LRN-12): immediate  OR  pending evaluation
                                                                 ↓
                                                          Progress (LRN-13): module never completes early
```

## 2 · The configuration object (prototype state, NOT an API schema)

One object per assessment drives both workspaces. In the prototype it is inspectable in
`prototype/batch02-prototype.js` (`S.assessments[id].cfg`):

```js
cfg: {
  randomize: false,        // FRD 5.3.1 — confirmed per-assessment setting, always disclosed
  negativeMarking: true,   // FRD 5.3.2 — confirmed per-assessment toggle
  timeLimitMin: 25,        // SAMPLE — null = no time limit (timing model shown: total budget)
  marksCorrect: 2,         // SAMPLE
  marksIncorrect: 0.5,     // SAMPLE — used only while negativeMarking is on
  marksUnanswered: 0,      // SAMPLE
  passPercent: 50,         // SAMPLE
  attemptLimit: 2,         // SAMPLE
  floorZero: true          // SAMPLE — reported score does not go below zero
}
```

**The two sample assessments are deliberately opposite** so no value can read as a platform rule:

| | Direct Shear Test (objective) | Bernoulli's Theorem (includes descriptive) |
|---|---|---|
| Questions | 5 — MCQ + True/False | 3 — MCQ + descriptive |
| Timing | 25-minute total budget · timer shown | **No time limit · no timer** |
| Negative marking | On (−0.5) · disclosed | **Off · not mentioned in the disclosure** |
| Order | Fixed · disclosed | **Randomized · disclosed** |
| Attempts / pass | 2 · 50% | 1 · 60% |
| Result | Immediate | **Result pending evaluation** |

## 3 · The disclosure generator (the heart of the model)

`LRN-09` renders no authored copy. Every row derives from `cfg`:

- Question count and types → from the included questions.
- Timing → "25 minutes in total" **or** "No time limit" (both are disclosures).
- Attempts → configured limit + attempts used (recording always on, 11.2.2).
- Pass mark and total marks → from `passPercent` and `marksCorrect × n`.
- Marking → mentions the deduction **only while negative marking is on** (a disabled rule is never disclosed as if it existed — Review-006 rule). Randomization is **always** disclosed either way (FRD 5.3.1 acceptance criterion). This asymmetry is source-grounded, not stylistic.
- Descriptive present → the pending-evaluation consequence is disclosed before the attempt.

Faculty **Preview (learner view)** renders the same generator — proof, inside the product, that configuration drives the learner experience.

## 4 · States that matter

| Surface | States designed |
|---|---|
| Assessments list `FAC-06` | populated · empty · filtered-empty · draft rows flag "Setup incomplete" · **Awaiting-evaluation prototype note** ("PROTOTYPE NOTE — NOT PRODUCT UI"; evaluation owner pending, no product surface presented) |
| Builder `FAC-07` | per-tab needs-attention flags · completeness checklist (questions / settings / context) with the **next safe action** · draft vs configured vs assigned · assign disabled until complete · modules already holding an assessment are not selectable |
| Question Bank `FAC-08` | populated · empty · no-matches · **upload report with per-row errors** (5.1.1 acceptance criterion) · Ready vs **AI-generated draft · Review required** |
| Question editor | create · edit · edit-AI-draft · validation (missing text / options / correct answer) |
| AI drafts `FAC-09` | request · generating · drafts for review · **generation failure** · empty |
| Module detail `LRN-04` | assessment available (why) · locked until simulation (why) · in-progress · passed · pending · attempts used |
| Introduction `LRN-09` | available · **not yet available** (sequence) · resume · already submitted/passed · **no attempts remaining** · **couldn't load (retry)** |
| Attempt `LRN-10` | MCQ · True/False · descriptive · answered/unanswered navigator · timer (only when configured) · **time elapsed prompt (A6 — no auto-submit)** · saved-as-you-go |
| Review + submit | all answered · unanswered warning with numbers · configuration-aware consequence dialog |
| Result `LRN-12` | **passed** · **not passed** (+ retry only while attempts remain) · **result pending evaluation** · final-result-received |
| Progress `LRN-13` | per-module simulation/assessment/module status · pending banner · updated banner · **never complete while a result is pending** |

## 5 · Scoring in the prototype

Local sample scoring that *reads the configuration*: correct = `+marksCorrect`; incorrect = `−marksIncorrect` only when negative marking is on; unanswered = `marksUnanswered`; reported score floored at zero when configured; pass when `percentage ≥ passPercent`. Descriptive answers are never auto-scored — submission produces **Result pending evaluation**, and the demo's *"Simulate final result received"* control (marked PROTOTYPE CONTROL) stands in for the completed evaluation without naming who performs it.

## 6 · What the learner can never do or see

No authoring or configuration control anywhere in the learner workspace (PM-15 / F12) · no answer key, no per-question correctness, no explanations (QP-27 pending — replaced by the feedback-policy note) · no hints (QP-20 pending) · no certification (PM-12) · no internal document codes.
