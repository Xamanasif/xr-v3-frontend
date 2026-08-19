# 08 — Assessment Configuration Model

**Review:** 006 — Full Platform Reframe
**Created:** 2026-08-18
**Authority:** **PM-08** · **PM-15** · FRD 5.1.1, 5.1.2, 5.2.1–5.2.3, 5.3.1, 5.3.2, 8.1.4, 11.2.1, 11.2.2

---

## The change PM-08 makes

> **PM-08: Assessment behaviour must be configurable/setup through the portal and linked to the application through flexible APIs.**
> **Do NOT treat the previous prototype values as universal platform constants.**

### Before and after

| | Review 005 | **Review 006** |
|---|---|---|
| Question count | 10 MCQs — a **constant** | **configuration field** |
| Time limit | 20 minutes — a **constant** | **configuration field** |
| Correct answer | +2 — a **constant** | **configuration field** |
| Correct after hint | +1 — a **constant** | **configuration field** |
| Incorrect | −1 — a **constant** | **configuration field** |
| Pass mark | 10/20 — a **constant** | **configuration field** |
| Attempts | Unlimited — a **constant** | **configuration field** |
| Score floor | `max(raw, 0)` — a **constant** | **configuration field** |

**All of the above are now SAMPLE ASSESSMENT CONFIGURATION unless independently confirmed later.**

### The FRD always agreed

This is a correction of an interpretation, not a reversal of a requirement. **The FRD states no question count, no duration, no score weighting, no pass mark, and no attempt limit anywhere in its 17 pages.** What it does state is configurability:

| FRD | Text | Implication |
|---|---|---|
| 5.1.1 | *"Faculty shall be able to upload quiz question banks through structured spreadsheet templates"* | Content is **authored**, not fixed |
| 5.1.2 | *"Faculty shall be able to generate assessment questions using AI tools integrated into the platform"* | Content is **authored**, not fixed |
| 5.3.1 | *"Quiz questions **may** be randomized for each attempt"* | **"may"** = a setting |
| 5.3.2 | *"Faculty shall be able to **enable** negative marking for incorrect responses"* | **"enable"** = a toggle, owned by Faculty |

**The Review-005 values filled FRD silence. They were legitimate design interpretation, never FRD constants, and PM-08 now confirms they must not be platform constants either.**

### What survives unchanged

The **capabilities** those values exercised remain valid — they are what the configuration model must be able to express:

- Mandatory pre-attempt disclosure of scoring, penalties, hints, timing, and pass mark
- Hints that reduce a correct answer's value rather than giving the answer
- A timed attempt with a total budget freely distributed across questions
- Attempt history recorded and shown
- Per-question **correctness** after submission, **never** the answer key (`D-25`)
- A reported score that cannot fall below zero (`D-23`) — now itself a setting

---

## Ownership — confirmed by PM-15 (19 August 2026)

PM-08 said assessment behaviour is **configurable**. It did not say **by whom**, and Review 006 surfaced a real gap: FRD 5.1.1, 5.1.2, and 5.3.2 assign authoring to **Faculty** — an institutional role — while **a B2C individual learner has no Faculty**.

> **PM-15: for BOTH B2B and B2C, assessment setup/configuration is the responsibility of Faculty or the institution side.**
> **The learner does NOT author or configure assessments.**

| | Owner |
|---|---|
| **B2B institutional learner** | Faculty / institution-authorized side |
| **B2C individual learner** | **Faculty / institution-authorized side** — the same |
| **Learner, either context** | ⛔ **Never authors or configures** |

**Assessment ownership is therefore not a B2B/B2C divergence at all.** It converges on the same authorized side, and `06_B2B_B2C_JOURNEYS.md` divergence 17 has been **removed** rather than merely answered.

### Two rules carried from PM-15

1. **Do NOT automatically grant every Institute Admin assessment-authoring permission** unless supported by the FRD or another PM decision. The FRD names **Faculty** explicitly (8.1.4, 5.1.1, 5.1.2, 5.3.2), so **Faculty remains the clearest direct assessment-authoring role**. Institute Admin authority stays open (`QP-08`).
2. **The learner-side prohibition is now a stated rule, not an absence.** It is recorded in `02_ROLE_PERMISSION_MATRIX.md` as **`F12`** so it cannot drift back in.

### The one detail deliberately left open

For a **pure B2C individual learner**, *which* Faculty, institution, or content owner supplies the assessment is **deferred by PM-15 as a content / implementation detail**. It is explicitly **not a blocker for platform IA**.

**It changes nothing in the model below.** Whoever supplies the configuration acts on the Faculty / institution-authorized side, through the same portal surface, producing the same configuration consumed by the same API. Only the operational assignment of *who that person is* remains to be settled — see `11_OPEN_QUESTIONS_REFRAMED.md` `QP-25`.

**Closes `QP-05`.**

---

# Part 1 · The model

```
┌──────────────────────────────────────────────────────────────────┐
│  ①  QUESTION SOURCING                                    [FAC]   │
│      Spreadsheet upload  5.1.1   ·   AI generation  5.1.2        │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ②  QUESTION BANK                                        [FAC]   │
│      Stored questions, typed and reusable                        │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ③  ASSESSMENT DEFINITION                          [FAC] PM-08   │
│      Which questions · which types · which rules                 │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ④  RULE CONFIGURATION                             [FAC] PM-08   │
│      Scoring · timing · attempts · hints · randomization ·       │
│      negative marking · pass threshold                           │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ⑤  PUBLICATION / ASSIGNMENT                             [FAC]   │
│      Attached to a module, course, or cohort            8.1.4    │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ⑥  PLATFORM API                                      ⚠ PENDING  │
│      "linked to the application through flexible APIs"   PM-08   │
│      Contract and schema are NOT defined here                    │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ⑦  APPLICATION CONSUMPTION                                      │
│      Web application · XR application                            │
│      Reads the configuration; renders the assessment             │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ⑧  LEARNER ATTEMPT                                      [LRN]   │
│      Disclosure → attempt → submit                               │
│      EVERY displayed rule is READ FROM ④, never compiled in      │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ⑨  SCORING & RESULT                                     [LRN]   │
│      Auto-scored: MCQ 5.2.1 · True/False 5.2.2                   │
│      ⚠ Descriptive 5.2.3 → awaiting evaluation, OWNER UNDEFINED  │
│      Correctness without the key                          D-25   │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ⑩  PROGRESS                                                     │
│      Score 11.2.1 · attempts 11.2.2 · completion 11.1.1 · D-08   │
│      → [FAC] operational learner status  (8.1.4 · PM-11)         │
└──────────────────────────────────────────────────────────────────┘
```

---

# Part 2 · Question types — FRD-supported

| Type | FRD | Phase | Auto-scorable | Design status |
|---|---|---|---|---|
| **Multiple choice** | 5.2.1 | 1 | ✅ Yes | ✅ Designed — ⚠ single vs multi-select undefined |
| **True / False** | 5.2.2 | 1 | ✅ Yes | ✅ Designed |
| **Descriptive (short answer)** | 5.2.3 | 1 | ❌ **No** | 🟡 Awaiting-evaluation state only |
| XR simulation performance scoring | 5.4.1 | **2** | — | ⛔ Phase 2 |

**No other question type exists in the FRD and none may be invented.**

## The descriptive-question problem

FRD 5.2.3 permits short descriptive answers. **No Phase-1 requirement defines who grades them, on what turnaround, or against what rubric.**

This is materially worse under the approved progression:

```
PM-09 · D-08 · D-07:  assessment passed → module complete → next module unlocks
                              ▲
                              │
        an ungraded descriptive answer never reaches "passed"
                              │
                              ▼
                  the learner is stranded indefinitely
```

**Faculty is the plausible owner** — FRD 8.1.4 names *"assessments"* among Faculty responsibilities. **But the FRD does not say so, and PM-08 does not resolve it.**

**Per instruction, grading ownership is not invented.** The Faculty workspace shows a **descriptive grading queue as a known-pending surface** — named, positioned, and explicitly marked unowned — rather than a designed grading tool. The learner-facing *awaiting evaluation* state already exists and is retained.

---

# Part 3 · Configuration fields

Fields are separated by evidentiary strength. **This separation is the point of the document** — it prevents a plausible field from being promoted into a requirement.

## 3.1 · Clearly implied by the FRD — configurable

Each has explicit FRD text making it a setting.

| Field | FRD basis | Type | Notes |
|---|---|---|---|
| **Question types enabled** | 5.2.1, 5.2.2, 5.2.3 | multi-select | Exactly the three Phase-1 types |
| **Question selection / bank source** | 5.1.1, 5.1.2 | reference | Which bank, which questions |
| **Question randomization** | **5.3.1** *"may be randomized for each attempt"* | boolean | "may" makes it a setting |
| **Negative marking enabled** | **5.3.2** *"Faculty shall be able to enable"* | boolean | Explicitly Faculty-owned |
| **Assessment assignment target** | 8.1.4 | reference | Module / course / cohort |
| **Attempt recording** | 11.2.2 | always on | Recording is required, not optional |
| **Score recording** | 11.2.1 | always on | Required |

## 3.2 · Required by the model but with **no FRD value** — configurable, values pending

PM-08 requires *"appropriate assessment parameters"*. These are the parameters the Review-005 design proved necessary to render an assessment at all. **Each becomes a field; none carries an FRD-supplied default.**

| Field | Why it must exist | Review-005 sample value | Status |
|---|---|---|---|
| **Question count** | An assessment must have a length | 10 | **SAMPLE** |
| **Time limit** | Review-005 established a total budget | 20 minutes | **SAMPLE** |
| **Timing model** | Total budget vs per-question | total budget | **SAMPLE** |
| **Score — correct** | Weighting must exist if scoring exists | +2 | **SAMPLE** |
| **Score — incorrect** | Required if negative marking is enabled (5.3.2) | −1 | **SAMPLE** |
| **Score — unanswered** | Must be defined | 0 | **SAMPLE** |
| **Score — correct after hint** | Required if hints exist | +1 | **SAMPLE** |
| **Pass threshold** | Progression gates on passing (D-08) | 10 / 20 = 50% | **SAMPLE** |
| **Attempt limit** | 5.3.1's *"each attempt"* confirms multiples exist; no limit is stated | unlimited | **SAMPLE** |
| **Score floor** | `reportedScore = max(raw, 0)` (D-23) | floored at 0 | **SAMPLE** |
| **Hints enabled** | Hints exist in the approved design | on | **SAMPLE** |
| **Hint limit** | Per question or per assessment — never defined | undefined | **SAMPLE** |

> **Every value in the third column is SAMPLE ASSESSMENT CONFIGURATION.** No screen, spec, or handoff may present them as platform defaults, recommended values, or approved settings.

## 3.3 · Requiring product clarification before they can be fields

Genuinely undecided. **Not designed as fields until answered.**

| Question | Why it matters |
|---|---|
| **Who grades descriptive answers?** | Blocks progression under PM-09 · D-08 |
| **Are MCQs single or multi-select?** | Multi-select requires a partial-credit rule that no scoring model defines |
| **Is there an extended-time accommodation, and who grants it?** | A per-attempt allowance hook exists in the Review-005 timer; the policy owner does not |
| **Does Institute Admin hold any assessment authority?** | FRD names only Faculty |
| **Are configurations reusable across courses or cohorts?** | Not addressed anywhere |
| **Is there a platform-level default configuration?** | Not addressed. Do not invent one |
| **May a configuration change mid-attempt or between attempts?** | Not addressed; affects fairness and attempt history |

## 3.4 · Explicitly out of scope

| Item | Reason |
|---|---|
| XR simulation performance scoring | FRD 5.4.1 — **Phase 2** |
| Simulation attempt tracking | FRD 5.4.2 — **Phase 2** |
| AI learning assistant for learners | FRD 5.5.x — **Phase 3** |
| Certification thresholds | FRD 3.3.2 — **PM-12 deferred to Phase 2** |

---

# Part 4 · FRD 5.1.2 — AI question generation

**This requires an explicit audit and must not be inherited as excluded.**

| | |
|---|---|
| **Requirement** | FRD 5.1.2 — *"Faculty shall be able to generate assessment questions using AI tools integrated into the platform"* |
| **Phase in the FRD** | **Phase 1** — it sits under *Section 5 · Phase 1 – Assessment System* |
| **User** | **Faculty** — an authoring tool |
| **Current treatment** | Excluded by constraint `C-04` |
| **Why `C-04` does not apply** | `C-04` excluded *"AI assistant"*, citing **FRD 5.5** — the **AI Learning Assistant**, which is **Phase 3** and **learner-facing**. **Different requirement, different phase, different user** |
| **Correct status** | **PRODUCT-PENDING** — an in-scope Phase-1 Faculty capability awaiting a decision on whether to build it in Phase 1 |

**Why the confusion arose.** Under a Student-only scope, every Faculty capability was out of scope anyway, so 5.1.2 was never examined on its own terms — it was swept up with the learner-facing AI exclusion. PM-01 removes that cover.

**Position taken:** 5.1.2 is recorded as an **in-scope Phase-1 Faculty requirement**, given a named position in the Faculty workspace (`FAC · Question bank → AI question generation`), and flagged for a product decision. **It is not designed in detail, and it is not excluded by inheritance.**

---

# Part 5 · The API contract — deliberately abstract

> **PM-08: "The configured assessment must be consumable by the relevant Web/XR application through flexible platform/API integration."**

**The requirement is confirmed. The contract is not defined here.**

| Defined by this document | Not defined by this document |
|---|---|
| That a configuration is **authored in the portal** | Endpoint, method, or transport |
| That applications **consume** it rather than embed it | Payload schema or field names |
| That **both Web and XR** applications are consumers | Authentication or versioning scheme |
| That results **return** to the platform for progress | Sync vs async, polling vs push |
| **One prohibition that must survive into the contract** | Everything else |

## The one hard constraint on the contract

**The correct answer must never appear in a payload delivered to a learner-facing client** (`D-25`).

> Not in the payload, not in a debug field, not in a comment.

A response body is one browser DevTools tab away from becoming a public answer key. Under a configuration that permits unlimited attempts, that converts retry into memorisation and destroys the assessment.

**This is a design-level constraint on the eventual API, recorded now so it is not discovered late.**

---

# Part 6 · Effect on existing Review-005 screens

**The consumption screens survive almost untouched.** What changes is where their numbers come from.

| Screen | Change | Disposition |
|---|---|---|
| Assessment overview + pre-attempt disclosure | Every disclosed value read from configuration | **MODIFY — data source only** |
| Assessment attempt | Timer, question count, hints, navigator all parameterised | **MODIFY — data source only** |
| Submit confirmation | Unanswered count derives from configured length | **KEEP** |
| Assessment result | Score, breakdown, pass/fail read from configuration | **MODIFY — data source only** |
| Per-question correctness review (`D-25`) | Unchanged — the prohibition strengthens | **KEEP** |
| Attempt history | Unchanged | **KEEP** |
| Awaiting-evaluation state | Unchanged; grading owner still pending | **KEEP** |

**Structural change: none. Data-binding change: pervasive.**

Two consequences that must be carried into any spec or handoff:

1. **The pre-attempt disclosure must be generated from the configuration**, not authored as copy. If a configuration disables negative marking, the disclosure must not mention it. A hard-coded disclosure would lie.
2. **Layouts must tolerate variation.** 5 questions or 50; 5 minutes or none; a pass mark of 40% or 80%. Fixed-count navigators and hard-coded maxima break.

---

# Summary

| | |
|---|---|
| **Model stages** | 10 — sourcing → bank → definition → rules → assignment → API → consumption → attempt → scoring → progress |
| **FRD-supported question types** | 3 — MCQ (5.2.1) · True/False (5.2.2) · Descriptive (5.2.3) |
| **Fields clearly implied by the FRD** | 7 |
| **Fields required by the model, values pending** | 12 — **all Review-005 values reclassified as SAMPLE** |
| **Questions requiring product clarification** | **7** — down from 8; **PM-15 closed the B2C ownership question** |
| **Items explicitly out of scope** | 4 — all Phase 2/3 or PM-deferred |
| **Screens structurally changed** | **0** |
| **Screens requiring a data-source change** | 3 |
| **New surfaces required** | Faculty question bank · assessment configuration · assignment · descriptive grading queue *(pending owner)* |
| **API contract** | ⚠ **PENDING** — one prohibition recorded: **the answer key must never reach a learner-facing payload** |
| **FRD 5.1.2** | **Reclassified from excluded to PRODUCT-PENDING** — a Phase-1 Faculty requirement wrongly covered by a Phase-3 exclusion |
