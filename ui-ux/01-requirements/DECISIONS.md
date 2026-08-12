# Confirmed Decisions — Phase 1 Student UI/UX

**Document status:** Living register
**Created:** 2026-08-10 (Review 001) · **Updated:** 2026-08-10 (Review 002)
**Rule:** This file contains **only** decisions explicitly confirmed by the manager. Nothing inferred. Open items live in `OPEN_QUESTIONS.md`; temporary working positions live in `ASSUMPTIONS.md`.

> **Numbering notice.** Review 002 introduced an authoritative decision set numbered **D-01 – D-12**. These numbers **replace** the Review-001 numbering, which used the same identifiers for different content. Review-001 decisions that remain in force and are not covered by D-01 – D-12 have been renumbered **D-13 – D-16**. A mapping table is at the end of this document so the review history stays traceable.

---

## Part A — Product decisions (Review 002, authoritative)

### D-01 · Dual audience — B2B **and** B2C

The Student experience must support **both** B2B institutional Students and B2C individual learners.

A **shared core learning experience** is used wherever possible. Branching is permitted only where the experiences genuinely differ:

| Divergence | B2B institutional | B2C individual |
|---|---|---|
| Onboarding | ERP-provisioned identity (FRD 7.2.2) | Self-registration (FRD 4.1.1) |
| Authentication | Institutional SSO preferred | Email/password + social |
| Entitlement origin | Stream-based licence (FRD 6.2.1, 7.2.3) | Purchase (FRD 6.1.1, 6.1.2) |
| Catalog visibility | Not shown | Explore is a primary destination |
| Purchasing | Hidden | Full commerce path |
| Institutional information | Institution context, admin contact | Not applicable |

**Supersedes:** Q-01 (closed). **Reverses:** nothing — Review 001 branched rather than chose.

---

### D-02 · "Phase 1" means all sections

Phase 1 is the **union of all Phase-1 requirements across the complete FRD** — 78 requirements across 12 sections — not Section 1 alone.

**Supersedes:** assumption A-01, which is now confirmed and removed from `ASSUMPTIONS.md`.

---

### D-03 · Authentication — both paths

Authentication supports **email/password** and **institutional SSO**.

| Audience | Preferred | Secondary |
|---|---|---|
| **B2B** | Institutional SSO when configured | Email/password as fallback where permitted |
| **B2C** | Email/password | Supported social login |

Duplicate-account behaviour must not be created without documenting **identity-linking implications**. Recorded as open question Q-18 (revised), which now has a defined obligation attached rather than being purely speculative.

**Supersedes:** Q-02 (closed as a blocking question). **Resolves:** the FRD's SSO phase contradiction (4.2.2 Phase 1 vs 7.4.1 Phase 3) in favour of **SSO in Phase 1**.

---

### D-04 · B2C purchasing and checkout are **in scope**

B2C purchasing and checkout are included in the current Student Phase-1 UI/UX scope.

B2B Students must **not** see unnecessary commerce functionality when institutional licensing provides their access.

**Supersedes:** Q-04 (closed) and constraint C-09 from Review 001, both now withdrawn. **Reverses:** assumption A-04, removed.

---

### D-05 · Learning resource formats — PDF and video

Student learning resources include at minimum **PDF notes** and **instructional videos**. Both may support download.

| Format | Required UX |
|---|---|
| **Video** | duration · play/pause · progress · resume · **Download** |
| **PDF** | open/view · download |

Downloading must **not** be mandatory for learning completion. Additional formats remain undefined unless later approved.

**Supersedes:** Q-05 (closed). **Reverses:** assumption A-05, which excluded video. Removed.

---

### D-06 · Assessment model

Assessments support the Phase-1 FRD question types (FRD 5.2.1–5.2.3). The **initial MCQ assessment model** is:

| Property | Value |
|---|---|
| Questions | 10 MCQs |
| Correct answer | **+2** |
| Incorrect answer | **−1** (negative marking, FRD 5.3.2) |
| Unanswered | **0** |
| Maximum score | **20** |
| Pass mark | **10 / 20 = 50%** |
| Attempts | **Unlimited**, attempt history recorded (FRD 11.2.2) |
| Timer | **20 minutes total** for the assessment |

**Timer behaviour.** The 20 minutes are a **total budget**, freely distributed by the Student across questions. Questions are **not** hard-locked after two minutes each. At expiry: answered questions are submitted, unanswered questions score 0.

**Hints.** A Student may request a hint. A hint provides **guidance or a clue only — never the answer**.

| Outcome | Score |
|---|---|
| Correct **without** hint | +2 |
| Correct **after** hint | **+1** |
| Incorrect | −1 |
| Unanswered | 0 |

**Mandatory pre-attempt disclosure.** Scoring, negative marking, hint impact, time limit, and pass score must all be disclosed **before** the Student begins the attempt.

**Supersedes:** Q-07, Q-08, Q-09, Q-25 (all closed). **Reverses:** A-07 (kept — unlimited confirmed), A-08 (reversed — a timer now exists), A-09 (reversed — a pass mark now exists). A-25 confirmed and removed.

---

### D-07 · Module completion is **gated**

A Student must complete the current module before the next sequential module unlocks. Module sequence therefore behaves as **mandatory** for this implementation.

This resolves the FRD's internal ambiguity in 3.2.2 ("**recommended** sequence in which modules **must** be completed") in favour of enforcement.

**Supersedes:** Q-22 (closed). **Reverses:** assumption A-22, which treated sequencing as advisory. Removed.

---

### D-08 · Module completion model

A module is **COMPLETED** when all of the following are satisfied:

1. Required learning resources completed / viewed
2. Simulation completed
3. Required assessment submitted
4. Assessment **passed** where an assessment is required

Only then does the next module become **AVAILABLE**.

**Optional / supplementary resources must never block completion.**

| Component | Completion rule |
|---|---|
| PDF | Opened/viewed or manually marked complete — final rule per UX implementation (see A-34) |
| Video | **≈90% watched** |
| Download | Optional; does **not** affect completion |
| Simulation | Completion event returned by the simulation/platform |
| Assessment | Final score **≥ 50%** |

**Failed assessment:** module remains incomplete · Student may retry · attempts are recorded · **next module remains locked**.

**Supersedes:** Q-31 (closed). **Reverses:** assumption A-31, which did not require a passing score. Removed.

---

### D-09 · XR modules stay visible on desktop

Licensed VR/MR/AR modules must **remain visible** in the desktop LMS even when they cannot run there. They must never be hidden.

| Format | Badge | Desktop behaviour |
|---|---|---|
| **Web** | Web | Browser-compatible execution · **Launch Simulation** |
| **VR** (Meta Quest) | VR | Device requirement · instructions · **Continue on Meta Quest** / **View VR Setup Guide** |
| **MR** (Ajna Lens) | MR | Device requirement · institutional lab / shared-device guidance · **Continue on Ajna Lens** / **View Device Instructions** |
| **AR** (Android/iOS) | AR | Mobile OS requirement · QR / deep-link continuation where technically possible · **Continue on Mobile** |

The desktop must **not pretend it can launch** an experience it cannot. Where a web version of the same simulation exists, it may be offered as an alternate supported experience. **No technical deep-link or device-control functionality may be invented** beyond what has been implemented.

**Supersedes:** Q-17 (closed). **Confirms:** assumption A-17, removed.

---

### D-10 · Primary Student goal

> **Access learning resources and continue learning with minimum friction.**

The addition of "**and continue learning with minimum friction**" is material: it makes *resumption* a first-class goal, not only discovery. This directly motivates a Continue Learning entry point (see D-11 of the IA evaluation in `STUDENT_INFORMATION_ARCHITECTURE.md`).

**Supersedes:** Review-001 D-07, extended.

---

### D-11 · Accessibility baseline — WCAG 2.2 AA

**WCAG 2.2 Level AA** is the provisional UI/UX accessibility baseline. This is a **design-quality requirement, not an FRD-derived requirement** — the FRD contains no accessibility requirement at all.

**Supersedes:** Q-33 (closed). **Reverses:** assumption A-33, which proposed WCAG 2.1 AA. Upgraded to 2.2 and removed from assumptions.

---

### D-12 · Branding

The supplied logo is the **only currently confirmed brand asset**. Colours, typography, spacing, and visual direction remain **provisional**.

A palette must **not** be derived mechanically from the logo. A professional provisional visual system is to be created, appropriate for: engineering · university learning · technical education · commercial SaaS · XR-enabled learning.

**Partially supersedes:** Q-13 — the *approach* is now decided; a final approved brand guide is still outstanding (Q-13 remains open, rescoped).

---

### D-17 · Session expiry must not destroy Student work

FRD 10.2.2 requires inactivity expiry. Expiry must **not** silently destroy assessment answers, learning position, or resource progress.

Required behaviour:

- Warning and recovery states are designed, not incidental
- Assessment selections autosave where technically possible
- Video and resource progress persists
- The Student returns to the **same learning context** after re-authentication
- **An assessment attempt is never consumed purely because authentication expired**

**Source:** Review-002 brief §14. **Supersedes:** assumption A-30, removed. **Q-30 closed.**

---

### D-18 · Every error state must answer two questions

Every error, empty, and restricted state must communicate:

1. **What happened**
2. **What the Student can do next**

Coverage is required for: login failure · SSO failure · session expired · network failure · content unavailable · licence/access missing · simulation launch failure · video load failure · PDF download failure · payment failure · assessment submission failure · timer expiry · locked module · module withdrawn/unavailable.

Internal authorization codes must never be exposed (C-07).

**Source:** Review-002 brief §13, §10. **Supersedes:** assumption A-27 in part — the *obligation* is now confirmed; the per-case wording remains design work.

---

### D-19 · Simulation completion is **account-level**, not device-level

A VR/MR/AR simulation may be completed on its supported device. Once the platform records successful completion **for the same Student account**, the LMS treats that simulation as complete and unlocks the next module under D-07.

| Property | Rule |
|---|---|
| Completion authority | The **platform's recorded completion state for the account** — not the device the Student is currently using |
| Desktop role | **Reflects** account state. The desktop does not need to observe the XR session. |
| Gating | D-07 unlocking proceeds normally once completion is recorded, whatever device produced it |
| Constraint | **No cross-device technical mechanism may be invented.** No claimed live handoff, no device control, no invented push channel. |

**What this resolves.** Before D-19 the design had to warn, on every XR simulation panel, that a module completable only on a headset would block every subsequent module — a real dead end created by D-07 ∧ D-09. D-19 removes the dead end: the Student completes on the device, and the desktop reflects it.

**What it changes in the UI.** The XR panel's message inverts from a warning to an instruction: *"Complete this on your Meta Quest. Your progress is recorded to your account."* The module state becomes **Awaiting device completion** rather than a blocked state, and the completion checklist shows the simulation as outstanding rather than unreachable.

**Source:** confirmed instruction, 2026-08-10. **Resolves:** checkpoint issue #1. **Rescopes:** Q-42 — the loss-of-completion-event risk survives, but it is now a recording failure rather than a structural dead end.

---

### D-20 · Module-internal gating is **sequential**

Within a module, the three component groups unlock in a fixed order. This extends D-07 (between-module gating) inward.

```
Required learning resources  →  Simulation  →  Assessment  →  Pass  →  Module completed  →  Next module unlocked
```

| Condition | Simulation | Assessment |
|---|---|---|
| Any **required** resource incomplete | 🔒 **Locked** — states which resources remain | 🔒 Locked |
| Required resources complete, simulation incomplete | ✅ Available | 🔒 **Locked** — states that the simulation must be completed |
| Simulation completion recorded | ✅ Complete | ✅ **Available** |
| Assessment passed (≥10/20) | — | ✅ Complete → **module completed, next module unlocked** |

**Optional resources never gate anything** (D-08 unchanged).

**Required UI behaviour.** A locked component must not present an active action. *Go to simulation* and *Go to assessment* are rendered as **locked states naming the prerequisite**, not as live buttons. A Student must never be able to click into a component whose prerequisites are unmet, and must never have to guess what is blocking them.

**Source:** confirmed instruction, Review-004 correction pass §2. **Extends:** D-07, D-08. **Supersedes:** the earlier Stage-6 rendering of STU-04, which incorrectly showed both actions live.

---

### D-05 · Amendment — video download is unconditional

The original wording "download **where permitted**" is withdrawn.

| Resource | Rule |
|---|---|
| **Video** | **Download** is always offered |
| **PDF** | **Download** is always offered |

Downloading remains **optional** and **does not contribute toward module completion** (D-08 unchanged).

**Source:** Review-004 correction pass §3.

---

## Part B — Scope decisions carried forward from Review 001

Still in force; renumbered to avoid collision with Part A.

| # | Decision | Origin |
|---|---|---|
| **D-13** | **Student role only.** Faculty, Institute Admin, Content Manager, Super Admin, Vendor, and academic reviewer interfaces are out of scope. | Review 001 |
| **D-14** | **LMS web application only.** Native Quest, native Ajna, native Android, and native iOS interfaces are out of scope — but the desktop LMS must communicate access to them (D-09). | Review 001, extended by Review 002 §2 |
| **D-15** | **Desktop-first at ~1440px design width.** No complete mobile/tablet design sets yet, but components and layouts must be able to adapt later. | Review 001, quantified by Review 002 §22 |
| **D-16** | **UI/UX designed from scratch.** No inherited design system or prior product UI. | Review 001 |

---

## Part C — Constraints in force

| # | Constraint | Status |
|---|---|---|
| C-01 | Do not modify `source/Platform FRD_v4.pdf` | Active |
| C-02 | Do not modify `branding/bits-pilani-wilp-logo.png` | Active |
| C-03 | Phase 2 and Phase 3 functionality out of scope | Active |
| C-04 | No gamification, badges, leaderboards, social feed, chat, AI assistant, recommendations, or vanity analytics unless explicitly approved | Active |
| C-05 | Do not invent the actual payment gateway — use generic secure-redirect patterns until confirmed | Active (Review 002 §11) |
| C-06 | Do not invent technical deep-link or device-control functionality | Active (Review 002 §12) |
| C-07 | Do not expose internal authorization codes in Student-facing error states | Active (Review 002 §10) |
| C-08 | Do not show non-functional launch buttons | Active (Review 002 §12) |
| C-09 | ~~B2C checkout excluded from the first Student milestone~~ | **WITHDRAWN by D-04** |
| C-10 | Work only in the current UI/UX branch; do not rewrite git history; do not commit secrets | Active |

---

## Part D — Decisions explicitly **not** made

Tracked in `OPEN_QUESTIONS.md`. Listed to prevent silent promotion.

- Final approved brand guide — palette, typography, tone (Q-13, rescoped)
- Whether identity linking exists between a B2B and a B2C account for one person (Q-18, now carries a documentation obligation from D-03)
- Which profile fields are Student-editable vs institution-controlled (Q-11)
- Whether certification UI appears in Phase 1 (Q-12)
- Whether Students may review submitted assessment answers (Q-10)
- How descriptive answers are graded and how long evaluation takes (Q-24)
- Payment gateway, currency, tax display, invoicing, and refund policy (Q-34 – Q-37, new)
- Hint availability limits — how many hints per assessment or per question (Q-38, new)
- Localization and regional formatting (Q-32)

---

## Review-001 → Review-002 numbering map

| Review 001 | Content | Review 002 status |
|---|---|---|
| D-01 | Phase 1 only | Absorbed into **D-02** (scope clarified) |
| D-02 | Student role first | Renumbered **D-13** |
| D-03 | LMS web only | Renumbered **D-14** |
| D-04 | Desktop first | Renumbered **D-15** |
| D-05 | UI/UX from scratch | Renumbered **D-16** |
| D-06 | Logo supplied, branding open | Superseded by **D-12** |
| D-07 | Primary goal: access learning resources | Superseded and extended by **D-10** |

---

## Change log

| Date | Review | Change |
|---|---|---|
| 2026-08-10 | 001 | Register created with 7 decisions and 10 constraints. |
| 2026-08-10 | 002 | Authoritative decision set **D-01 – D-12** adopted. Review-001 decisions renumbered D-13 – D-16. Constraint C-09 withdrawn by D-04. Assumptions A-01, A-04, A-05, A-08, A-09, A-17, A-22, A-25, A-31, A-33 superseded and removed. Questions Q-01, Q-02, Q-04, Q-05, Q-07, Q-08, Q-09, Q-17, Q-22, Q-25, Q-31, Q-33 closed. Q-03 reclassified (not a contradiction). Q-13 rescoped. |
