# UX Review Log — XR Simulation Learning Platform

**Purpose:** Chronological record of UX reviews, findings, and decisions affecting the Student Phase-1 design.
**Created:** 2026-08-10

---

# Review 001 — Initial FRD Analysis

| | |
|---|---|
| **Review ID** | 001 |
| **Date** | 2026-08-10 |
| **Type** | Requirements analysis and UX foundation |
| **Reviewer** | UI/UX |
| **Source reviewed** | `source/Platform FRD_v4.pdf` — all 17 pages, all 12 sections, all 131 numbered requirements |
| **Scope** | Phase-1 Student, LMS web, desktop-first |
| **Status** | ✅ Complete — awaiting manager review |
| **Outcome** | UX foundation established. **4 blocking questions must be answered before wireframing.** |

---

## 1. Method

### First pass — full document read

The complete FRD was extracted and read end to end, not sampled. The source PDF uses subset TrueType fonts with custom encodings; text was decoded via the embedded ToUnicode CMaps with per-font tracking. Page 12 is blank (see Finding 7).

Requirements were then classified against the Phase-1 Student desktop scope using the criteria in `STUDENT_PHASE1_REQUIREMENTS.md`, with each row carrying an explicit "does this need a Student screen" and "is this backend-only" judgement.

### Second pass — verification and absence sweep

Three checks were run after the artefacts were drafted:

1. **Enumeration check** — every numbered requirement extracted mechanically from the source text and reconciled against the coverage matrix. Result: **131 requirements found, 131 accounted for.** 78 are Phase 1.
2. **Section-by-section re-read** — each section's Phase-1 subsection re-read against the drafted artefacts to find requirements captured but under-weighted.
3. **Absence sweep** — the full text searched for UX-critical vocabulary to find what the FRD **never** says. This produced the two most significant new findings (Findings 8 and 9), neither of which could have been found by reading what is present.

---

## 2. Scope interpretation established

The FRD does **not** define global project phases. Each of its 12 sections independently subdivides into Phase 1 / Phase 2 / Phase 3. "Phase 1 only" is therefore interpreted as **the union of the Phase-1 subsection of all 12 sections** — 78 requirements, not the 18 in Section 1.

Recorded as assumption **A-01**. This is the single highest-leverage assumption in the project and should be the first item the manager confirms, even though it was not among the questions originally raised.

---

## 3. Findings

Ordered by consequence.

---

### Finding 1 — A "Dashboard" is not FRD-justified in Phase 1 · *Structural*

The word "dashboard" appears four times in the entire FRD. Only one instance is both Phase 1 and learner-facing — **9.2.2**, where purchased entitlements are "automatically assigned to the user's dashboard" — and that is a B2C purchase context, itself deferred under manager constraint C-09. The instance that would give a Student dashboard real content, certification progress tracking (3.5.1), is **Phase 3**.

There is also nothing to populate it: recommendations are Phase 2 and excluded, certification tracking is Phase 3, and notifications do not exist in Phase 1. A Phase-1 dashboard would summarise a list sitting one click away, while pushing the confirmed primary Student goal (D-07) one level further from the front door.

**Resolution:** Dashboard rejected as a destination; **My Learning** serves as the post-login home and absorbs 9.2.2's only Phase-1 function. This is what reduces the path to the primary goal to **3 clicks** (2 for a standalone module).

---

### Finding 2 — A global "Assessments" destination is not FRD-justified · *Structural*

FRD 3.1.2 places assessments **inside** modules: modules "**may** include supporting learning material such as theoretical explanations, simulation instructions, and assessments." Assessments are an optional component of a module, not a peer of courses and modules.

No Phase-1 requirement gives a Student a cross-course assessment list, due list, or calendar. Those are LMS conventions. Because assessments are optional per module, such a destination would also be empty or near-empty for many Students.

**Resolution:** Rejected as a global destination; demoted to module-level navigation, where the FRD actually locates it.

**Consequence of Findings 1 and 2 together:** the proposed global navigation has **two** primary items, not five.

---

### Finding 3 — Four blocking contradictions and tensions in the FRD · *Blocking*

| # | Conflict | Detail |
|---|---|---|
| 3a | **SSO is in two phases at once** | 4.2.2 (Section 4, **Phase 1**) — institutions shall configure SSO. 7.4.1 (Section 7, **Phase 3**) — the platform shall support institutional SSO via Google Workspace / Azure AD. Same capability, two phases. → **Q-02** |
| 3b | **Two competing account origins, both Phase 1** | 4.1.1 grants email self-registration; 7.2.2 states institutional accounts "**shall be automatically created**" from ERP. For a B2B student these produce different onboarding, and a self-registered duplicate would be unentitled — the Student logs in successfully and sees nothing, with no explanation available. → **Q-03** |
| 3c | **B2C commerce: FRD Phase 1 vs manager exclusion** | 6.1.1, 6.1.2, 9.1.1, 9.1.2, 9.2.1, 9.2.2 are all Phase 1; constraint C-09 excludes checkout from the first milestone. Manager instruction governs, but excluding it leaves the **B2C variant structurally non-functional** — a B2C learner with no purchase path has an empty account by definition. → **Q-04** |
| 3d | **Certification promised in Phase 1, trackable only in Phase 3** | 3.3.2 states students "**shall receive certification**"; student-facing certification progress is Phase 3 (3.5.1), and no requirement anywhere describes issuing, storing, or viewing a certificate. → **Q-12** |

---

### Finding 4 — The FRD is least specific exactly where the primary Student goal lives · *High*

Manager decision **D-07** confirms the primary Student goal is **accessing learning resources**. The FRD's entire description of learning resources is one clause in **3.1.2**: modules "may include supporting learning material such as theoretical explanations, simulation instructions, and assessments."

Nothing specifies format, length, or media type. A PDF viewer, a video player, and a rich-text article are three different screens with different loading, error, and accessibility profiles. Screen **S-11** — which serves the primary goal — therefore cannot be specified.

The only indirect hint is 5.1.1's spreadsheet-based question upload, suggesting plain-text content for assessments. That is inference, not specification. → **Q-05**

---

### Finding 5 — Session expiry can destroy Student work, and the FRD defines no protection · *High*

FRD 10.2.2 mandates automatic session expiry after inactivity. It defines **no duration, no warning, and no treatment of in-progress work**.

Two cases are genuinely destructive. Expiry mid-assessment could discard answers **and** consume a counted attempt (11.2.2) — a real academic cost inflicted by a timeout the Student did not cause. Expiry mid-simulation could discard simulation progress.

"Inactivity" is additionally ill-defined for a simulation: a Student may be deeply engaged inside a canvas emitting no LMS-side events, so a naive passive timer could sign them out precisely while they are working hardest.

**Resolution:** A-30 assumes warning before expiry, work preservation, in-place re-authentication, and explicitly **not** consuming an attempt. None of this is FRD-required, and it should be validated with **engineering**, not only with the manager. → **Q-30**

---

### Finding 6 — Three restricted states are reachable and none is described · *High*

| Case | Cause | FRD |
|---|---|---|
| 13A | Institutional license cap exhausted — the Student is seat N+1 | 6.2.2 |
| 13B | Stream maps to zero modules | 7.2.3 |
| 13C | License validation fails **at launch**, after the Student initiated it | 10.1.2, 2.2.2 |

All three are the Student hitting a wall created by administrative state they cannot influence. Each needs different wording and a different recovery path. A generic error would leave the Student with no available action.

Case 13A carries a specific constraint: **no purchase prompt may appear** — an institutional Student cannot buy their way past their institution's cap. → **Q-27**

---

### Finding 7 — Assessment rules are largely undefined · *High*

Five undefined properties, each affecting the assessment screens:

| Property | FRD status |
|---|---|
| Attempt limit | Attempts are **counted** (11.2.2) and randomization references "each attempt" (5.3.1), confirming multiple attempts exist. **No maximum is ever stated.** → Q-07 |
| Time limit | **Never mentioned.** If limits exist, a timer plus auto-submit is needed, running concurrently with session expiry — two countdowns at once. → Q-08 |
| Passing score | 3.3.2 refers to "minimum assessment performance thresholds" but **never quantifies them anywhere**. → Q-09 |
| Answer review | **Never mentioned.** Disclosure would also leak the Faculty-uploaded question bank (5.1.1) that randomization implies is reused. → Q-10 |
| Descriptive grading | 5.2.3 permits free-text answers that cannot be machine-scored, and **no Phase-1 grading workflow exists**. A Student may reach a result screen with no score at all. → Q-24 |

The passing-score gap drove assumption **A-09**: report the score, state no verdict. Displaying an invented pass mark would misinform a Student about their academic standing — the clearest case in the project of choosing least harm if wrong.

---

### Finding 8 — The FRD contains no accessibility requirement whatsoever · *High · second pass*

An absence sweep found **zero** occurrences of "accessibility", "WCAG", "screen reader", "contrast", or "keyboard" across all 17 pages and all 131 requirements. Section 10 covers compliance in detail — VAPT, data protection, retention — but never accessibility.

This matters for four reasons: the product is educational and built for BITS Pilani WILP learners; assessments are involved, and any timing behavior (Q-08) interacts directly with accommodation requirements; contrast, focus order, keyboard operability, and semantic structure are design-time decisions that cannot be retrofitted cheaply; and `ui-ux/09-accessibility/` exists in the agreed structure with no requirement to populate it.

**Resolution:** A-33 adopts **WCAG 2.1 Level AA** as a working baseline. This should be confirmed **before** Q-13 (brand palette) — a palette chosen without a contrast target may not survive validation. → **Q-33**

---

### Finding 9 — No localization requirement, despite a Phase-1 global user base · *High · second pass*

Zero occurrences of "localization", "language", or "translation" — yet Phase 1 plans for international payment gateways serving "global purchases by individual learners" (9.1.2) and regional B2C database instances for geographic clusters (1.3.3).

Retrofitting internationalization after visual design affects layout tolerance everywhere rather than in one place.

**Resolution:** A-32 assumes English-only and single-locale, **but requires layouts to carry text-expansion tolerance**. The tolerance measure costs nothing now and is what keeps this cheap to reverse. → **Q-32**

---

### Finding 10 — Two smaller structural observations

**10a — "Learning preferences" has no Phase-1 consumer.** FRD 4.3.1 requires collecting learning preferences at profile creation. Its only consumer — the recommendation engine (4.5.1) — is Phase 2 and additionally excluded by C-08. Asking a Student for data nothing uses adds friction and creates an unmet expectation. A-15 marks the field optional with no personalization promise. → Q-15

**10b — Module sequencing contradicts itself within one sentence.** FRD 3.2.2: "Courses shall define the **recommended** sequence in which modules **must** be completed." Advisory and mandatory readings sit in the same clause. A-22 adopts advisory — wrongly gating **blocks** a Student from entitled content, while wrongly permitting merely allows out-of-order study. → Q-22

---

### Finding 11 — FRD page 12 is blank · *Housekeeping*

Page 12 sits between Section 7 (page 11) and Section 8 (page 13) and contains no content. No sentence is truncated across the gap, and requirement numbering is continuous (7.4.2 → 8.1.1), so it is almost certainly a PDF export artefact. Recorded because if a section *was* dropped, requirements are missing from this entire analysis. Trivial to confirm. → **Q-21**

---

## 4. Second-pass verification results

| Check | Result |
|---|---|
| All 17 pages read | ✅ |
| All 131 numbered requirements enumerated and reconciled | ✅ 131 found, 131 covered |
| All 78 Phase-1 requirements classified for Student impact | ✅ |
| Section-by-section re-read for under-weighted requirements | ✅ No missed requirements |
| Absence sweep for UX-critical vocabulary | ✅ **2 new findings (8, 9) → Q-32, Q-33** |
| Requirements invented | ✅ None — gaps escalated to questions, not filled |
| `source/` and `branding/` unmodified | ✅ Verified |

**Second-pass corrections applied:** the Phase-1 requirement count was corrected from an initial estimate of 74 to a verified **78**, with a per-section breakdown added; the coverage matrix total was corrected from 121 to a verified **131**.

**Requirement re-classified on second pass:** FRD 1.4.3 (Content Manager reviews "metadata, documentation, and **platform compatibility**") was strengthened from incidental to supporting evidence — per-module compatibility metadata must exist, which underpins showing hardware requirements on S-10 and S-14 (assumption A-17). A residual ambiguity remains in the same requirement: whether "documentation" means Student-facing material or internal review material is unclear, and is folded into Q-06.

---

## 5. Artefacts produced

| # | File | Purpose |
|---|---|---|
| 1 | `00-project-context/PROJECT_CONTEXT.md` | Product, audience, scope, exclusions, decisions, contradictions |
| 2 | `01-requirements/STUDENT_PHASE1_REQUIREMENTS.md` | All 78 Phase-1 requirements classified for Student impact |
| 3 | `01-requirements/OPEN_QUESTIONS.md` | 33 questions — 4 blocking |
| 4 | `01-requirements/ASSUMPTIONS.md` | 31 assumptions, all marked unconfirmed, with reversal costs (numbered A-01, A-04 – A-33 to align with question IDs) |
| 5 | `01-requirements/DECISIONS.md` | 7 confirmed decisions, 10 constraints, and what is explicitly *not* decided |
| 6 | `02-information-architecture/STUDENT_INFORMATION_ARCHITECTURE.md` | IA with each candidate nav item tested against the FRD |
| 7 | `03-user-flows/STUDENT_USER_FLOWS.md` | 14 flows with B2B/B2C branches preserved |
| 8 | `04-screen-inventory/STUDENT_SCREEN_INVENTORY.md` | 22 core screens + 3 conditional |
| 9 | `10-handoff/FRD_UIUX_COVERAGE.md` | All 131 requirements categorized |
| 10 | `11-reviews/UX_REVIEW_LOG.md` | This log |

Empty directories created and awaiting later stages: `05-wireframes/`, `06-design-system/`, `07-high-fidelity/`, `08-prototype/`, `09-accessibility/`.

---

## 6. Actions required from the manager

### Blocking — wireframing cannot begin

| # | Question | Consequence of no answer |
|---|---|---|
| **Q-01** | B2B/institutional, B2C/individual, or both? | The two variants do not share a home screen structure |
| **Q-02** | Which authentication path is prioritized? | An SSO redirect and a credential form are different screens; the FRD contradicts itself on SSO phasing |
| **Q-03** | Is Student self-registration part of the first institutional experience? | Two competing account origins, both Phase 1 |
| **Q-04** | Is purchasing/checkout excluded from the first Student milestone? | Changes what "Phase 1 complete" means; B2C is non-functional without it |

### Recommended before wireframing

| # | Question | Why now |
|---|---|---|
| **A-01** | Confirm the "Phase 1 = all 12 sections' Phase 1" reading | Highest reversal cost in the project |
| **Q-33** | Accessibility standard | Design-time property; confirm **before** Q-13 |
| **Q-13** | Brand guide beyond the logo | Blocks high-fidelity design; depends on Q-33 |
| **Q-05** | Learning-resource formats | Determines the screen serving the primary Student goal |
| **Q-22** | Sequencing advisory or enforced | Changes the course screen's interaction model |
| **Q-30** | Session expiry during active work | Needs engineering validation, not only manager sign-off |

---

## 7. Outcome

UX foundation established and internally consistent. No requirements were invented; every gap is recorded as an open question with a marked, reversible assumption where design had to continue.

**Next stage — wireframes — is on hold pending explicit manager approval of this UX foundation.**

---

---

# Review 002 — Product Decision Update & FRD-to-Foundation Audit

| | |
|---|---|
| **Review ID** | 002 |
| **Date** | 2026-08-10 |
| **Type** | Confirmed product decisions applied · foundation revision · FRD audit |
| **Input** | Master UI/UX execution prompt — decisions D-01 – D-12, corrections A – H, IA direction, workflow |
| **Status** | ✅ Complete |
| **Outcome** | All four Review-001 blocking questions closed. Foundation revised. Wireframing unblocked. |

---

## 1. Decisions applied

Eighteen decisions are now in force: **D-01 – D-12** from the brief, **D-13 – D-16** carried forward from Review 001 (renumbered), and **D-17 – D-18** derived from brief §14 and §13 respectively, which stated confirmed behavioural requirements rather than open choices.

Constraint **C-09** (B2C checkout excluded) is **withdrawn** by D-04.

---

## 2. Corrections applied

All eight corrections from brief §4 were applied:

| | Correction | Applied |
|---|---|---|
| A | B2C commerce not excluded | D-04. A-04 removed; 6 requirements moved OUT → UI; 5 commerce screens added. |
| B | Self-registration and ERP provisioning are not contradictory | Q-03 closed and **reclassified** — they are different account-origin paths for different audiences, not a conflict. Review-001 Finding 3b is corrected. |
| C | Certification is an ambiguity, not a contradiction | `PROJECT_CONTEXT.md` §7 now lists it as an open ambiguity (Q-12), not contradiction #4. |
| D | Do not permanently reject Home/Dashboard | Both options re-evaluated in `STUDENT_INFORMATION_ARCHITECTURE.md` §3. **Option B (lightweight Home) adopted** — see §4 below. |
| E | Resource formats confirmed | D-05. A-05 removed; STU-05 and STU-06 split with distinct completion rules. |
| F | Module completion no longer an open assumption | D-07 + D-08. A-22 and A-31 removed; six-state module model added. |
| G | Accessibility baseline WCAG 2.2 AA | D-11. A-33 upgraded from 2.1 and removed. |
| H | Do not assume web simulations are embedded | A-16 removed, replaced by **A-39**, which specifies the Student-facing *contract* and leaves the container to engineering. |

---

## 3. Findings

### Finding 1 — The Review-001 Dashboard rejection was correct on its evidence, and D-07 changed that evidence

Review 001 rejected a Dashboard because it would have summarised a list one click away, with nothing Phase-1 to populate it. That reasoning held.

**D-07 changed the input.** With mandatory sequential gating, a Student in a course has exactly **one** next action at any moment — the current unlocked module. That is not a summary; it is a deterministic target no other surface expresses as directly. Combined with D-10's added clause "*and continue learning with minimum friction*", which makes resumption a first-class goal, Home earns its place.

**Measured effect:** resumption drops from **3 clicks to 1**.

The guardrail from brief §5 — "must not become an analytics-heavy vanity dashboard" — is enforced by rule in A-38, not by taste: no charts, no streaks, no badges, no ranking, no peer comparison, no metric tiles beyond a course count and completion summary.

### Finding 2 — D-07 gating makes several previously minor gaps consequential

Gating converts "incomplete" into "blocked", which raises the stakes on three unresolved items that were low-risk at Review 001:

| Item | Why gating raises it |
|---|---|
| **Q-42** — no recovery when a simulation completion event is lost | A telemetry failure now blocks *all subsequent modules*, not just one. A-40 declines a manual override because it would defeat the gate — which leaves the Student stranded. Raised to **High**. |
| **Q-24** — descriptive answers have no Phase-1 grading workflow | D-08 gates on *passing*. An ungraded assessment would lock a Student out **indefinitely**. A-24 therefore defines a **pending** module state, distinct from failed. |
| **Q-47** — does gating apply to standalone purchased modules? | New under D-04. A B2C learner buying a mid-course module has no predecessor to complete; gating them makes the purchase unusable. Raised as a **High** product question. |

### Finding 3 — D-08's PDF rule was delegated, and the safe reading is the stricter one

D-08 leaves PDF completion as "opened/viewed **or** manually marked complete according to final UX implementation". **A-34 chooses explicit mark-complete**, with the control disabled until the document has been opened.

Auto-complete-on-open would let a single mis-click satisfy a gate that unlocks the next module. One extra click is a far smaller cost than silently certifying that a Student read something they did not.

The same logic drove **A-36**: the ≈90% video threshold is measured as **cumulative unique coverage**, not furthest playhead. Furthest-position measurement is satisfied by one drag of the scrubber, which would make the D-08 threshold meaningless as a D-07 gate. Both are engineering-facing tracking decisions and are flagged as such.

### Finding 4 — D-04 introduces commerce questions the FRD never anticipated

Admitting commerce surfaced five new questions with no FRD answer, one of which is compliance-adjacent:

- **Q-35 currency, tax, price presentation — High.** FRD 9.3.1 mandates GST-compliant invoices but is **Phase 2 and institution-facing**, leaving Phase-1 B2C tax presentation entirely undefined. Price display is not styling.
- **Q-46 are courses purchasable? — High.** FRD 6.1.1/6.1.2 name only *modules* and *bundles*, yet Courses sit between them in the hierarchy and are what D-07 gates. If only loose modules are purchasable, the gating model has little to gate for B2C.
- Q-34 gateway · Q-36 receipt/invoice · Q-37 refunds · Q-44 licence expiry · Q-45 bundle overlap.

Two deliberate omissions are recorded so they read as decisions: **no persistent cart** (FRD describes single-object purchase, so a basket would be invented) and **no coupon field** (FRD 6.4 is Phase 2).

### Finding 5 — D-09 creates an obligation the brief does not state, and gating is why

D-09 keeps XR modules visible with device-specific CTAs. Under D-07, an XR module a desktop Student cannot complete will **block every subsequent module**.

STU-07 must therefore state this consequence at the point of access. A Student must not discover at the gate that a module they were entitled to has stalled their entire course. This is not in the brief; it follows from D-07 ∧ D-09 and is recorded as a design requirement.

### Finding 6 — WCAG 2.2 adds six criteria beyond 2.1, and three bite immediately

D-11's upgrade from 2.1 to 2.2 is not cosmetic. Six new criteria apply, and three shape screens already inventoried:

| Criterion | Level | Where it bites |
|---|---|---|
| **3.3.8 Accessible Authentication (Minimum)** | AA | AUTH-01 — no cognitive-function test; paste and password managers must work |
| **2.4.11 Focus Not Obscured (Minimum)** | AA | STU-10 — the sticky assessment timer must never cover the focused control |
| **2.5.8 Target Size (Minimum)** | AA | STU-10 question navigator, STU-06 video controls — ≥24×24 CSS px |
| 3.3.7 Redundant Entry | A | AUTH-07, B2C-03 — never re-request known data |
| 3.2.6 Consistent Help | A | Account menu — Help placed consistently (Q-48) |
| 2.5.7 Dragging Movements | AA | STU-06 video seek needs keyboard equivalents |

---

## 4. FRD-to-foundation audit (Stage 2)

| Check | Result |
|---|---|
| All 131 FRD requirements still accounted for | ✅ |
| All 78 Phase-1 requirements reclassified against D-01 – D-18 | ✅ 19 changed |
| Student-facing reach | 33 → **44 of 78 (56%)** |
| Requirements blocked on a question | 9 → **3** (Q-11, Q-12, Q-24) |
| Every screen traces to an FRD requirement or a decision | ✅ 29/29 |
| Every decision has a screen or state realising it | ✅ D-01 – D-18 |
| Assumptions silently promoted to requirements | ✅ **None** |
| Requirements invented | ✅ **None** — 4 design-supplied items labelled: AUTH-05, STU-11, STATE-03, Help |
| `source/` and `branding/` unmodified | ✅ Verified by checksum |

**Consistency check.** No document now asserts an excluded B2C, an advisory sequence, an absent pass mark, no timer, embedded-by-assumption simulations, or a WCAG 2.1 baseline. Superseded Review-001 tables are marked with delta sections rather than deleted, so the audit trail survives.

---

## 5. Artefact changes

| File | Change |
|---|---|
| `DECISIONS.md` | Rewritten — 18 decisions, C-09 withdrawn, Review-001 numbering mapped |
| `ASSUMPTIONS.md` | Rewritten — 12 retired, 6 revised, 8 added. **31 → 27**, none confirmed |
| `OPEN_QUESTIONS.md` | Rewritten — 14 closed, 5 rescoped, 15 added. **33 → 34**, zero blocking |
| `STUDENT_PHASE1_REQUIREMENTS.md` | Review-002 reclassification table + revised counts |
| `PROJECT_CONTEXT.md` | §3–§8 rewritten |
| `STUDENT_INFORMATION_ARCHITECTURE.md` | Rewritten — Home admitted, Explore added, six-state module model |
| `STUDENT_USER_FLOWS.md` | Rewritten — 14 → **20 flows** |
| `STUDENT_SCREEN_INVENTORY.md` | Rewritten — 22 → **29 screens**, new ID scheme |
| `FRD_UIUX_COVERAGE.md` | Review-002 delta and audit |

---

## 6. Manager review points

**Highest value first:**

1. **Q-46 / Q-47** — are courses purchasable, and does gating apply to standalone purchases? Together they determine whether B2C and B2B share one progression model or two.
2. **Q-35** — currency and tax presentation. Compliance-adjacent; FRD 9.3.1 covers only Phase-2 institutional invoicing.
3. **Q-42, Q-40, Q-43** — simulation completion events, video coverage tracking, server-authoritative timer. **Engineering dependencies**, needed during wireframe review rather than at handoff.
4. **Q-18** — B2B/B2C identity linking. D-03 requires the implication be documented; it is, in A-18R, and must be surfaced before B2C launch.
5. **Q-13** — brand guide. Blocks final high-fidelity sign-off, not structural work. Note there is **no SVG logo and no reversed variant**.
6. **Q-11** — profile field editability.

---

---

# Review 003 — Stages 6–10 Execution

| | |
|---|---|
| **Review ID** | 003 |
| **Date** | 2026-08-10 |
| **Type** | High-fidelity · prototype spec · accessibility · coverage audit · handoff |
| **Input** | Resume instruction + **D-19** (account-level simulation completion) |
| **Status** | ✅ Complete — all ten stages delivered |

---

## 1. D-19 — the decision that mattered most

The resume instruction resolved the highest-severity open issue from the checkpoint.

**Before:** D-07 (gated sequencing) ∧ D-09 (XR modules stay visible) produced a genuine dead end. A licensed VR module that a desktop Student could not complete would block *every subsequent module*. The design mitigated it by warning on STU-07 — an honest mitigation, but a warning about a dead end is still a dead end.

**After:** completion is **account-level**. The Student completes on the supported device, the platform records it against the account, and the desktop reflects it.

**What changed in the design:**

| Surface | Before | After |
|---|---|---|
| STU-07 VR | ⚠ "This must be completed on a Meta Quest before Module 3 unlocks" | ✅ "Complete this on your Meta Quest. Your completion is recorded to your account." |
| Module state | Effectively blocked | **Awaiting device completion** — a labelled variant of *In Progress* (A-43) |
| STU-03 row | Dead-end framing | "Complete Module 2 first · then complete on Meta Quest" |
| STU-13 progress | Read as failure | "Requires a Meta Quest — completes on your headset" |

**What was deliberately not built.** D-19 forbids inventing cross-device mechanisms. No live handoff, no push channel, no device pairing, no polling loop is depicted or specified. A-42 assumes only read-on-navigation plus an explicit **Check for updates** control — an ordinary re-read, the cheapest thing to delete if the platform turns out to push events (Q-49).

---

## 2. Findings

### Finding 1 — The 20-minute timer has no accommodation path *(new, High)*

The most consequential finding of the accessibility review. D-06 sets a fixed 20-minute limit. WCAG 2.2 **2.2.1 Timing Adjustable (Level A)** has an *Essential exception* that a timed assessment very likely satisfies — **so the limit is probably compliant as specified.**

The gap is different: **no accommodation mechanism exists anywhere in the design or the FRD.** Learners entitled to extended time — routine in higher education, and granted by Indian institutions under the Rights of Persons with Disabilities Act 2016 — have no route to it. No per-student multiplier, no Faculty control, no requirement.

Design cannot invent an accommodation system (C-04) and cannot alter a confirmed decision. **Position taken:** the timer reads a **per-attempt allowance** rather than a hard-coded constant, so a multiplier can be added later without touching the screen or the timer logic. Escalated as **Q-50**.

### Finding 2 — Video introduced accessibility obligations nobody owns *(new, High)*

D-05 added instructional video. Captions are Level **A**; **audio description is Level AA** — and a transcript does not satisfy it. For engineering video showing apparatus or on-screen procedure, meaningful visual information *will* be conveyed without narration.

**Position taken:** the player specifies a caption track, transcript panel, and described-audio slot so the capability exists before the content does. Plus a design rule with teeth: **a video without captions must not be marked *Required* for module completion** under D-08 — otherwise a Deaf or hard-of-hearing Student is gated behind inaccessible content. Escalated as **Q-51**.

### Finding 3 — Reflow is unmet by agreed scope *(new, Medium)*

WCAG **1.4.10 Reflow (AA)** requires content at 320px-equivalent without 2D scrolling. D-15 is desktop-first with no mobile set, so **the criterion is not met**. Stated plainly rather than passed. Mitigations are already in place — no fixed-width containers, `minmax()` grids, relative units, text-expansion tolerance — so the eventual pass is a reflow, not a rebuild. Escalated as **Q-52**.

### Finding 4 — Three behaviours are backend contracts, not UI

Building them client-side would pass visual review and fail in production:

| Behaviour | Failure if client-side |
|---|---|
| Assessment timer (A-41) | Defeated by pressing F5 |
| Video coverage (A-36) | Defeated by one drag of the scrubber |
| Module unlock (D-07/D-08) | Gate computed by the client is not a gate |

All three are specified as server responsibilities in the handoff §2 with endpoint shapes.

### Finding 5 — Six issues found in the hi-fi self-review, all resolved

Two competing primaries (STU-07 VR), competing emphasis on Home, missing skeleton specs, confusable badge glyphs, a colour-only hint marker, and two container radii in use. Detail in `HIFI_SELF_REVIEW.md`. **H-03 and H-04 became specification rules** rather than one-off fixes, consistent with how Stage 4 handled recurring issues.

---

## 3. Stage results

| Stage | Deliverable | Result |
|---|---|---|
| **6** | High fidelity | 16 screens rendered; 611 balanced elements; light + dark; logo referenced read-only |
| **6b** | Self-review | 6 findings, all resolved |
| **7** | Interaction spec | 13 sections — states, loading, assessment, gating, D-19, expiry, commerce, keyboard, announcements, motion |
| **8** | Accessibility | WCAG 2.2 AA · **0 failures** · 38 pass · 7 findings · 11 build-time checks |
| **9** | Coverage audit | 131/131 accounted · **44/78 Student-facing, all on named screens** · 19/19 decisions realised |
| **10** | Handoff | Backend contract · components · edge cases · out-of-scope list · definition of done |

---

## 4. Integrity

| Check | Result |
|---|---|
| Requirements invented | ✅ **None** |
| Assumptions silently promoted | ✅ **None** — 29 labelled, all reversible |
| Design-supplied items labelled | ✅ 4 — AUTH-05, STU-11, STATE-03, Help |
| Unsupported cross-device mechanisms depicted | ✅ **None** — D-19 constraint honoured |
| Every decision realised on a screen | ✅ 19/19 |
| `source/` and `branding/` unmodified | ✅ Checksums verified |
| Figma content claimed | ✅ **None claimed, none exists** |

---

## 5. Manager review points

1. **Q-50 assessment time accommodation** and **Q-51 caption/audio-description ownership** — both are accessibility barriers for real learners, both need a product owner, and both are far cheaper now than after build.
2. **Q-46 / Q-47** — are courses purchasable, and does gating apply to standalone purchases? Together they decide whether B2C and B2B share one progression model or two.
3. **Q-40, Q-42, Q-43, Q-49** — engineering questions. Resolve with engineering before build.
4. **Q-35** — currency and tax. Compliance-adjacent.
5. **Q-13** — brand. Blocks final visual sign-off only; token architecture makes the swap a one-file change. Note there is still **no SVG logo and no reversed variant**.
6. **Q-52** — responsive commitment. The WCAG 2.2 AA claim is incomplete until this exists.

---

---

# Review 004 — Correction and Completeness Pass

> **Numbering note.** This pass was requested as "Review 003". That identifier was already assigned to the Stages 6–10 execution log above. To keep the audit trail unambiguous this entry is recorded as **Review 004**; both cover distinct work and neither is overwritten.

| | |
|---|---|
| **Review ID** | 004 (requested as 003) |
| **Date** | 2026-08-10 |
| **Type** | Targeted correction before Figma transfer |
| **Baseline** | Phase-1 Student UX foundation, approved. Not restarted or redesigned. |
| **Status** | ✅ Complete |

---

## 1. Corrections applied

| § | Correction | Result |
|---|---|---|
| 1 | High-fidelity completeness | **12 missing screens added.** All **29/29** now individually rendered — 51 frames |
| 2 | Module-internal gating | **New decision D-20.** Resources → simulation → assessment, enforced |
| 3 | Video download | "Where permitted" withdrawn — **D-05 amendment**; Download unconditional |
| 4 | Lifetime access | **Removed.** Copy is "One-time purchase" only — A-47, Q-53 |
| 5 | Sample commercial data | Prices labelled `SAMPLE` throughout — A-44 |
| 6 | Social providers | Google/Microsoft labelled `SAMPLE` — A-45, Q-55 |
| 7 | Accessibility claim | **Conformance claim withdrawn.** Reflow now counted as **NOT MET** |
| 8 | Negative score | UI made **sign-neutral** — A-46, Q-54 |
| 9 | Descriptive assessment | Awaiting-evaluation preserved and rendered; Q-24 open |
| 10 | Certification | No certificate screens invented; Q-12 open |
| 11 | Profile ownership | Read-only treatment preserved; Q-11 open |
| 12 | Visual polish | In-place; no redesign |
| 13 | Question classification | A/B/C/D added to `OPEN_QUESTIONS.md` |

---

## 2. Findings

### Finding 1 — D-20 exposed an active control that should never have been active

The Stage-6 STU-04 offered **"Go to assessment"** as a live action while required learning and the simulation were both outstanding. Under the newly-stated sequence that is not a styling slip: it invites a Student into a component whose prerequisites are unmet.

**Fixed by structure, not by disabling.** Locked components render as a `.lockbar` — dashed, muted, lock glyph, **prerequisite named specifically** ("1 remaining — Venturi Meter Setup"), never a `<button disabled>`. A disabled button still reads as a button; a lock state reads as a gate. STU-04 is now rendered in **two states** so the transition is visible: A with both locked, B with the simulation unlocked and the assessment still locked.

This also sharpens Home: with D-07 and D-20 together, the Continue Learning target is determined at **component** level, not module level.

### Finding 2 — The accessibility conclusion overclaimed

Stage 8 said the design "meets WCAG 2.2 AA at design stage with **no failures**" while simultaneously recording that **1.4.10 Reflow is unmet**. Those two statements cannot both be true. An unmet AA criterion is a failure, not a finding.

**Corrected.** The review now states that the work is *designed toward* WCAG 2.2 AA, that **full conformance cannot be claimed**, and that Reflow is **NOT MET**. The tally reads 37 satisfied / **1 not met** / 11 unverifiable until build. The word "pass" no longer appears against an unresolved criterion.

This matters beyond wording: a conformance claim carries procurement and legal weight in an education context, and it was not earned.

### Finding 3 — A genuine contrast improvement was available and taken

While reviewing secondary-text legibility (§12), `--n-400` `#8C98A8` measured **2.9:1** — below AA — and was in use for `.xs` metadata across several screens.

**Fixed at token level**, so it cannot regress: `--color-text-secondary` → `--n-600` (**6.7:1**), `--color-text-tertiary` → `--n-500` (**4.6:1**), and `--n-400` bound to `--color-text-disabled` only. Dark-theme equivalents raised to **8.2:1** and **5.8:1**. **No informational text now sits below AA in either theme.**

### Finding 4 — "Lifetime access" was an unearned commercial commitment

Two words in a price panel promised a licence term nobody had agreed. Nothing in the FRD defines a B2C term — 9.2.1 activates a licence without describing its life, and 6.5.2 grace periods are Phase 3 and institution-only.

Removed and replaced with **"One-time purchase"**. No duration, expiry, renewal, or refund policy is stated or implied anywhere. Escalated as **Q-53** (High) — it is a commercial decision, and close to unretractable once published.

### Finding 5 — Sample data was indistinguishable from approved data

Prices and provider names read as settled product decisions. Anyone reviewing the file could reasonably have taken ₹2,499 as approved pricing.

Now carried by an explicit `SAMPLE` chip at every occurrence, a prominent notice at the top of the high-fidelity file, and a dedicated section in the developer handoff. Recorded as A-44 and A-45.

### Finding 6 — Structural defect in the rebuilt high-fidelity file

Rebuilding to 29 screens introduced **9 unbalanced `<div>` elements** across four AUTH sections, plus one over-close that masked the imbalance in the total.

Found by per-section depth analysis rather than a total count — the totals were misleading precisely because the errors partly cancelled. Repaired; the file now validates at **1093/1093 balanced, depth 0, every section at the correct nesting level, all 29 anchors present.**

---

## 3. Verification (§14)

| # | Check | Result |
|---|---|---|
| 1 | All high-fidelity screens re-rendered | ✅ 29 screens · 51 frames |
| 2 | All 29 screen IDs verified | ✅ No missing anchors |
| 3 | B2B / B2C branching | ✅ Login, Home, My Learning, Profile setup, Explore |
| 4 | Module gating | ✅ D-20 states A and B; no active action on a locked component |
| 5 | Assessment rules | ✅ All five D-06 disclosures pre-attempt |
| 6 | Video Download present | ✅ Unconditional on PDF and video |
| 7 | No "lifetime access" | ✅ Zero occurrences in product copy |
| 8 | No sample data described as approved | ✅ 11 `SAMPLE` markers + notice + handoff section |
| 9 | Accessibility review re-run | ✅ Claim corrected; Reflow NOT MET; contrast improved |
| 10 | FRD coverage re-run | ✅ 44/78 Student-facing; 3 still blocked |
| 11 | Developer handoff updated | ✅ D-20 contract, `.lockbar`, sample-data section |
| 12 | Review recorded | ✅ This entry |

**Integrity:** no requirement invented · no assumption silently promoted (33 labelled) · `source/` and `branding/` unmodified · nothing committed.

---

---

# Review 005 — Product Decision Update (D-21 – D-25)

| | |
|---|---|
| **Review ID** | 005 |
| **Date** | 2026-08-10 |
| **Type** | Targeted product-decision update on the approved Review-004 baseline |
| **Status** | ✅ Complete — **4 questions closed, 1 opened** |

---

## 1. Decisions applied

| # | Decision | Design consequence |
|---|---|---|
| **D-21** | B2C sells **Modules and Bundles only** | Courses removed as a commercial concept. No course CTA, price, checkout, or SKU anywhere. Bundle copy rewritten from "Full course · 8 modules" to "Bundle of 8 modules" |
| **D-22** | Standalone modules **immediately Available**, internal gating retained | D-07 applies in a course context only; **D-20 still applies in full** inside a standalone module |
| **D-23** | `reportedScore = max(rawScore, 0)` | New pre-attempt disclosure line; new fourth result frame showing raw −4 → reported 0/20 |
| **D-24** | No universal duration promise | Conditional **access-duration slot** that renders only on authoritative data and collapses when absent |
| **D-25** | Correctness without the key | **New per-question review list** on STU-12, on both passed and failed frames |

---

## 2. Findings

### Finding 1 — D-25 required adding a surface, not removing one

The previous position (A-10) was "score summary only, no per-question review", justified by unlimited attempts making full review gameable. **D-25 shows that reasoning was one step too coarse.** The gameable element is the *answer*, not the *outcome*. A Student can be told **which** questions they got wrong without being told **what was right** — and that is strictly more useful for directing them back to the right learning resource.

The design now shows outcome per question and prohibits the key. Two deliberate choices make the prohibition structural rather than a matter of restraint (**A-49**):

- **Rows are not expandable.** There is no disclosure affordance to leak through, and no later "just show the stem" pressure point.
- **Rows do not link back to the question.** Under unlimited attempts, re-exposing option text *is* the key by elimination.

The prohibition is also carried into the API contract — `questions[]` must never contain the answer, "not in the payload, not in a debug field, not in a comment", because a response body is one DevTools tab away from being a public answer key.

### Finding 2 — D-23 needed the raw arithmetic kept visible

Flooring the total at 0 is straightforward. The judgement call was what to show when raw is negative.

Showing only "0 / 20" would be simplest, but it would make D-06's disclosed scoring rules **unverifiable by the Student**: they were told each wrong answer costs −1, then shown a number that doesn't follow from their answers. The result frame therefore shows the true line items (+4, −8, raw −4) **and** the floored reported score, with one explanatory line.

Transparency here costs three table rows and preserves the credibility of every rule disclosed on STU-09.

### Finding 3 — "Bundle" was one word away from becoming a Course product

D-21 warns against silently redefining a Bundle as a Course. The existing Explore card read **"Fluid Mechanics Complete — Full course · 8 modules"**. That is precisely the drift the decision guards against: a bundle described as a course, with a price attached, is a course SKU by another name.

Renamed to **"Fluid Mechanics Essentials — Bundle of 8 modules · fluid mechanics topic"**. The bundle still contains a course's modules, which D-21 permits; it is simply no longer *sold as* one.

### Finding 4 — D-24 is a data contract, not copy

The earlier fix (Review 004) removed "lifetime access" and stopped there — correct but incomplete. D-24 goes further: duration is **entitlement data**, and the UI must be able to display it truthfully when it exists.

A-48 therefore specifies a **collapsing slot**: it renders `Access until <date>` or `No expiry` on authoritative data, and **renders nothing at all** otherwise — no placeholder, no em-dash. A collapsing slot is the only treatment that satisfies both halves of D-24, since its failure mode is silence, which is exactly what the decision requires in the absence of data.

### Finding 5 — A tooling bug destroyed a file tail mid-pass

While retiring A-47 (the last assumption in `ASSUMPTIONS.md`), a helper that located the *next* `### A-` heading found none and truncated everything after it — losing the reversal-cost summary and change log.

Caught by a post-edit marker check rather than by the edit succeeding. Restored with the new content. Worth recording because the failure was silent: the edit reported success, the assumption count looked plausible, and only an explicit check on expected trailing sections surfaced it.

---

## 3. Validation (§ VALIDATION 1–11)

| # | Check | Result |
|---|---|---|
| 1 | All 29 screen IDs present | ✅ 29/29 anchors resolve |
| 2 | No Course-purchase CTA | ✅ Zero course price, CTA, checkout, or SKU |
| 3 | Standalone modules immediately Available, internal gating retained | ✅ STU-02 shows "Available · no previous-module prerequisite"; D-20 intact |
| 4 | Course sequential gating still works | ✅ STU-03 locked rows unchanged |
| 5 | Assessment total never displays below 0 | ✅ Floored frame shows raw −4 → **0 / 20** |
| 6 | Negative marking remains visible | ✅ STU-09 discloses −1; STU-12 shows −2 / −8 line items |
| 7 | No correct-answer key exposed | ✅ Outcome only; explicit no-key notice on the failed frame |
| 8 | No "lifetime access" product copy | ✅ Two occurrences remain, both **documentation explaining the prohibition** |
| 9 | Sample prices marked as sample | ✅ 11 `SAMPLE` markers + notice + handoff section |
| 10 | D-01 – D-25 mutually consistent | ✅ See §4 |
| 11 | `source/` and `branding/` unchanged | ✅ Checksums verified |

---

## 4. Decision-consistency check (validation item 10)

Four pairs were checked specifically because they touch the same surfaces:

| Pair | Potential conflict | Resolution |
|---|---|---|
| **D-07 vs D-22** | Does "gating is mandatory" contradict "standalone is immediately available"? | **No.** D-07 gates a *sequence*; a standalone module has no predecessor. D-22 states the scope explicitly rather than leaving it inferred. |
| **D-20 vs D-22** | Does immediate availability bypass internal gating? | **No.** D-22 unlocks the module's front door only. D-20 governs inside it and is explicitly retained. |
| **D-06 vs D-23** | Does flooring change the pass mark or negative marking? | **No.** Per-answer −1 is unchanged; only the reported total is floored; 10/20 unchanged and evaluated against the reported score. |
| **A-10 vs D-25** | Did the old "no review" assumption survive anywhere? | **No.** A-10 retired; flows, wireframe spec, screen inventory, interaction spec, and hi-fi all updated. |

Also verified: **D-21 vs FRD 6.1.1/6.1.2** — the FRD names exactly *individual modules* and *bundles*, so D-21 makes the design match the requirement literally. Q-46 closes **without inventing a product type**.

---

## 5. Questions

**Closed (4):** Q-10 answer review · Q-46 courses purchasable · Q-47 standalone gating · Q-54 negative score.
**Rescoped (1):** Q-53 — the UI contract is now set by D-24; only the commercial duration values remain open. Dropped High → Medium.
**Opened (1):** **Q-56** — how a completed standalone module interacts with a later course entitlement. D-22 explicitly forbids inventing this, so **nothing is designed for it**.

**Preserved as instructed, not silently resolved:** Q-11 · Q-12 · Q-13 · Q-16 · Q-18 · Q-34–Q-37 · Q-40 · Q-42 · Q-43 · Q-49 · Q-50 · Q-51 · Q-52. **Certification remains unresolved — no certificate dashboard or downloadable certificate was invented.**

---

## Review history

| Review | Date | Type | Status |
|---|---|---|---|
| 001 | 2026-08-10 | Initial FRD analysis and UX foundation | ✅ Complete |
| 002 | 2026-08-10 | Product decision update and FRD-to-foundation audit | ✅ Complete |
| 003 | 2026-08-10 | Stages 6–10 execution · D-19 applied | ✅ Complete |
| 004 | 2026-08-10 | Correction and completeness pass · D-20 applied *(requested as 003)* | ✅ Complete |
| 005 | 2026-08-10 | Product decision update · **D-21 – D-25** applied | ✅ Complete |
