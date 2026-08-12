# Student Information Architecture — Phase 1, Desktop LMS

**Document status:** Revised proposal (Review 002)
**Created:** 2026-08-10 (Review 001) · **Rewritten:** 2026-08-10 (Review 002)
**Scope:** Phase-1 Student, LMS web, desktop-first at 1440px (D-13 – D-16)

---

## 1. What changed from Review 001

| Review 001 | Review 002 | Driver |
|---|---|---|
| Dashboard **rejected** | **Home admitted** as a lightweight resumption surface | D-10 + D-07 — see §3 |
| 2 primary nav items | **4** (B2C) / **3** (B2B) | D-01, D-04 |
| No catalog | **Explore** admitted for B2C | D-04 |
| Modules ungated, order advisory | **Sequential gating** with a Locked state | D-07 |
| Progress provisional | **Progress confirmed** as a destination | Review-002 §5 |
| Profile in account menu only | **Account** menu formalised with Profile, Preferences, Help, Logout | Review-002 §5 |

The Review-001 rejection of a Dashboard was correct **on the evidence then available**. Two later decisions changed that evidence, and §3 sets out the reasoning rather than simply reversing.

---

## 2. Method

The IA is derived from the FRD and the confirmed decisions, not from LMS convention. Three inputs govern:

**FRD 8.1.5 — the Student role:** access licensed modules · complete simulations · view personal learning progress.
**D-10 — the primary goal:** *access learning resources **and continue learning with minimum friction***.
**D-01 — dual audience:** shared core, branch only where experiences genuinely differ.

Admission test — a destination must pass all four:

| | Test |
|---|---|
| **T1** | Traceable to a Phase-1 FRD requirement or a confirmed decision |
| **T2** | Necessary — it fails if merged into another destination |
| **T3** | Not invented — absent from the C-04 exclusion list, not present merely because competitors have it |
| **T4** | Actionable by a Phase-1 desktop Student |

---

## 3. Home vs My Learning — the decision

Review-002 §5 requires both options to be evaluated, with a **lightweight Home preferred if it materially reduces Student effort**.

### Option A — My Learning as home

Post-login lands on the entitlement list. To resume study: **My Learning → Course → Module → resource** = **3 clicks** before content.

### Option B — lightweight Home

Post-login lands on a Home carrying a single **Continue Learning** target. To resume: **1 click**.

### Why Option B wins — and it is D-07 that decides it

At Review 001 a dashboard failed test T2 because it would have summarised a list one click away. **D-07 changed that.** With mandatory sequential gating, a Student in a course has exactly **one** next action at any moment: the current unlocked module. That is not a summary of a list — it is a deterministic single target that no other surface can express as directly.

D-10's added clause, "*and continue learning with minimum friction*", makes resumption a first-class goal rather than a convenience. Option A costs a returning Student two extra navigations and two decisions ("which course?", "which module?") to reach an answer the system already knows.

**Decision: Option B.** Home is admitted as the landing surface.

### The guardrail

Review-002 §5 warns that Home "must not become an analytics-heavy vanity dashboard", and C-04 bans vanity analytics. Home is therefore constrained by rule, not by taste:

| Home **may** contain | Home **must not** contain |
|---|---|
| Continue Learning — one primary target | Charts or graphs of any kind |
| Recent Learning — up to 3 items | Streaks, badges, points, ranking |
| Current Progress — compact, course-level | Peer or cohort comparison (FRD 1.3.4 scopes analytics to the tenant) |
| Needs Attention — **only when non-empty** | Recommendations (FRD 4.5.1 is Phase 2) |
| — | Metric tiles beyond a course count and completion summary |

Recorded as A-38. If Home ever fails this test, the correct remedy is to shrink it, not to add a filter.

---

## 4. Evaluation of every candidate destination

| Candidate | T1 | T2 | T3 | T4 | Verdict |
|---|---|---|---|---|---|
| **Home** | ✅ D-10, D-07 | ✅ deterministic resumption target | ✅ constrained by rule | ✅ | **Admitted** — landing |
| **My Learning** | ✅ FRD 8.1.5, 7.2.3, 9.2.2 | ✅ full entitlement set; Home shows only 1–3 | ✅ | ✅ | **Admitted** |
| **Explore** | ✅ FRD 1.1.3, 6.1.1, 6.1.2 + D-04 | ✅ discovery ≠ owned content | ✅ | ✅ B2C | **Admitted — B2C only** |
| **Progress** | ✅ FRD 8.1.5 + §5 | ✅ cross-course history has no other home | ✅ | ✅ | **Admitted** |
| **Account** | ✅ FRD 4.3.1, 10.2.2 | ✅ utility, not learning | ✅ | ✅ | **Admitted — menu, not primary** |
| **Assessments** | ❌ contained in modules (FRD 3.1.2) | ❌ | ❌ LMS convention | ✅ | **Rejected** — see §4.1 |
| Certification / Programs | ⚠️ FRD 3.3.1 Phase 1, tracking Phase 3 | ❌ | ✅ | ⚠️ | **Excluded** (A-12, Q-12) |
| Notifications | ❌ no Phase-1 requirement | — | ❌ | — | **Excluded** (A-20) |
| Search | ❌ zero FRD mentions | — | ❌ | — | **Excluded** — but see §4.2 |
| Help | ⚠️ WCAG 2.2 **3.2.6 Consistent Help** | ❌ | ✅ | ⚠️ | **Admitted to Account menu only** — consistent location, per D-11 (Q-48) |
| Calendar / Deadlines | ❌ no Phase-1 Student date exists | — | ❌ | — | **Excluded** |
| Downloads / Offline library | ❌ contradicts FRD 1.1.4, 10.1.1 | — | — | — | **Excluded** — download stays a per-resource action (D-05) |
| Cart | ⚠️ implied by D-04 | ⚠️ | ✅ | ✅ | **Deferred** — see §4.3 |

### 4.1 Why "Assessments" remains rejected

FRD 3.1.2 places assessments **inside** modules as an optional component. D-08 reinforces this: an assessment is a completion gate *for its module*, not an independent object. A global Assessments list would duplicate module state, be empty for modules without assessments, and — under D-07 — mostly list items the Student cannot reach because their module is locked.

Cross-course assessment **history** is a genuine need, and it is served by **Progress**, not by a separate destination. Review-002 §5 reaches the same conclusion independently.

### 4.2 Why Search is excluded — with a caveat

The FRD mentions Student search zero times, so admitting it would invent a feature. The caveat is honest: **D-04 changes the argument for Explore only.** A catalog with more than roughly 30 purchasable items becomes difficult to browse without filtering. The design therefore includes **filtering and sorting within Explore** — which is catalog navigation, not a global search destination. If the catalog grows large, a scoped Explore search is the correct next addition, and it does not disturb this IA.

### 4.3 Why there is no Cart in navigation

FRD 6.1.1 and 6.1.2 describe purchasing *a module* or *a bundle* — both single objects. Nothing describes accumulating a basket. A persistent cart would therefore be invented (T3), and it adds a step to a two-step purchase. The design uses **direct purchase**: Product Detail → Checkout. If multi-item purchase is later confirmed, a cart attaches to the header without restructuring the IA.

---

## 5. Global navigation

### B2C individual learner

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [WILP logo]   Home   My Learning   Explore   Progress        [Account ▾]  │
└────────────────────────────────────────────────────────────────────────────┘
```

### B2B institutional student

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [WILP logo]   Home   My Learning   Progress    [Institution]  [Account ▾]  │
└────────────────────────────────────────────────────────────────────────────┘
```

**One structural difference, and it is the right one.** B2B drops **Explore** — the entire commerce branch — per D-04's rule that institutional Students must not see unnecessary commerce functionality. Everything else is identical, satisfying D-01's shared-core requirement. The institution name appears as a **non-interactive context label**, not a menu: it tells the Student whose licence they are studying under, which matters when they hit a restricted state (A-27R).

| Item | FRD / decision basis | Role |
|---|---|---|
| **Home** | D-10, D-07 | Landing. Resumption. |
| **My Learning** | FRD 8.1.5, 7.2.3, 6.2.1, 9.2.2 | Complete entitled content |
| **Explore** *(B2C)* | FRD 1.1.3, 6.1.1, 6.1.2 · D-04 | Discovery and purchase |
| **Progress** | FRD 8.1.5, 11.1.1, 11.2.1, 11.2.2 | Personal learning progress and attempt history |
| **Account ▾** | FRD 4.3.1, 10.2.2 · D-11 | Profile · Learning preferences · Help · Sign out |

---

## 6. Course-level navigation

```
Home  ›  My Learning  ›  [Course name]
────────────────────────────────────────────────
  Overview        Modules (8)
────────────────────────────────────────────────
```

| Section | Basis | Content |
|---|---|---|
| **Overview** | FRD 3.2.1 | Title · engineering topic / learning objective · module count · aggregate completion (11.1.1) · course-level time spent (11.1.2, A-28R) |
| **Modules** | FRD 3.2.1, 3.2.2 · **D-07** | **Ordered, gated** module list. Each row: sequence number · title · **format badge** · **module state** · assessment presence |

**Not present at course level:** announcements, discussion, participants, course-level resources, grades-as-a-tab. None has a Phase-1 basis. Learning material attaches to **modules** (FRD 3.1.2), never to courses — a course-level resources tab would contradict the content model.

---

## 7. Module-level navigation

The module is where D-10's primary goal is fulfilled and where D-08's completion model lives.

```
Home  ›  My Learning  ›  [Course]  ›  [Module 3]
──────────────────────────────────────────────────────────────────────
  Overview     Learning Resources     Simulation     Assessment
                    (3 required)                      (required)
──────────────────────────────────────────────────────────────────────
```

| Section | Basis | Present when |
|---|---|---|
| **Overview** | FRD 3.1.1, 1.4.3 | Always — includes the **completion checklist** (§9) |
| **Learning Resources** | FRD 3.1.2 · D-05 | Only if the module has resources |
| **Simulation** | FRD 3.1.1, 1.2.1–1.2.4 · D-09 | Always — one XR simulation per module |
| **Assessment** | FRD 3.1.2, 5.x · D-06 | Only if the module has an assessment |

**Sections are generated from actual content.** FRD 3.1.2's "**may** include" makes resources and assessments optional. A simulation-only module renders as a single section, never a four-tab frame with two empty tabs.

### Module-internal gating — D-20

Components unlock **in sequence**, extending D-07's between-module gating inward:

```
① Required learning resources  →  ② Simulation  →  ③ Assessment  →  Pass  →  Module complete
```

| Condition | Simulation | Assessment |
|---|---|---|
| Any **required** resource incomplete | 🔒 Locked — names which remain | 🔒 Locked |
| Required complete, simulation incomplete | ✅ Available | 🔒 Locked — names the simulation |
| Simulation completion recorded | ✅ Complete | ✅ Available |
| Assessment passed | — | ✅ Complete → next module unlocks |

**Optional resources never gate anything.**

**A locked component never renders an active action.** It renders as a locked state naming its prerequisite. The numbered ①②③ ordering in the module body and in the rail checklist is what makes the sequence legible before a Student hits it — the same principle as D-07's "reason readable without interaction".

This makes the Home resumption target (§3) more precise, not less: with both D-07 and D-20 in force, *the next thing* is determined at component level, not merely module level.

---

## 8. Learning hierarchy

Certification Program and Course must be visually distinguishable from each other and from Module — different card treatments, not just different labels.

```
Certification Program ............ FRD 3.3.1  (grouping label only in Phase 1 — A-12)
└── Course ...................... FRD 3.2.1
     └── Module .................. FRD 3.1.1  — exactly one XR simulation
          ├── Learning Resources . FRD 3.1.2 · D-05
          │     ├── PDF notes ..... required | optional
          │     └── Video ......... required | optional
          ├── Simulation .......... FRD 1.2.1–1.2.4 · D-09
          │     └── Web | VR | MR | AR
          └── Assessment .......... FRD 5.x · D-06  (optional per module)
```

**Only required resources gate completion** (D-08). Optional resources are visibly marked and never block.

---

## 9. Module state model

D-07 and D-08 make module state the backbone of the Student experience. Six states:

| State | Meaning | Entry condition | Student action |
|---|---|---|---|
| **Locked** | Sequence gate not met | Previous module incomplete | None — explains which module to complete first |
| **Available** | Ready to start | Previous module complete, or module 1, or standalone (Q-47) | Start |
| **In Progress** | Started, requirements outstanding | Any component begun | Continue |
| **Assessment Required** | Everything else done | Resources + simulation complete, assessment not passed | Take assessment |
| **Retry Required** | Assessment failed | Score < 50% (D-06) | Retry assessment |
| **Completed** | All requirements met | D-08 satisfied in full | Review · continue to next |

Displayed as, for example:

```
Module 1   Bernoulli's Principle — Fundamentals        ✓ Completed
Module 2   Flow Measurement Using a Venturi Meter      ● In Progress
Module 3   Pipe Friction and Head Loss                 🔒 Locked — complete Module 2 first
```

**Every state is conveyed by icon + text + shape, never colour alone** — WCAG 2.2 **1.4.1 Use of Color** (D-11).

**Retry Required is deliberately distinct from Locked.** Both prevent progression, but one is the Student's own module to fix while the other is about a different module. Collapsing them would tell a Student who just failed an assessment that something is "locked", which is both confusing and demoralising.

---

## 10. Complete architecture

```
Authenticated Student shell
│
├── HOME ......................................... landing (D-10)
│   ├── Continue Learning ........ one deterministic target (D-07)
│   ├── Recent Learning .......... up to 3
│   ├── Current Progress ......... compact, course-level
│   └── Needs Attention .......... only when non-empty (A-38)
│
├── MY LEARNING .................................. FRD 8.1.5
│   ├── Courses ......................... in-progress first
│   ├── Standalone modules .............. B2C purchases, or assigned singles
│   └── Completed learning .............. separated, not hidden
│       │
│       └── COURSE ....................... FRD 3.2.1
│           ├── Overview
│           └── Modules  ← ordered + GATED (D-07)
│               │
│               └── MODULE .............. FRD 3.1.1
│                   ├── Overview + completion checklist (D-08)
│                   ├── Learning Resources ...... PDF · Video (D-05)
│                   ├── Simulation .............. Web | VR | MR | AR (D-09)
│                   └── Assessment .............. 10 MCQ · 20 min (D-06)
│                       ├── Overview + mandatory disclosure
│                       ├── Attempt (timer · hints · navigation)
│                       └── Result (score · pass/fail · attempt history)
│
├── EXPLORE ...................................... B2C only (D-04)
│   ├── Catalog ......................... modules + bundles, filter/sort
│   └── Product Detail .................. → Checkout → Payment → Result
│
├── PROGRESS ..................................... FRD 8.1.5
│   ├── Course progress · module completion (11.1.1)
│   ├── Assessment scores + attempt history (11.2.1, 11.2.2)
│   └── Time spent — course level only (11.1.2, A-28R)
│
└── ACCOUNT ▾ .................................... utility
    ├── Profile ......................... FRD 4.3.1 (ERP fields read-only, A-11)
    ├── Learning preferences ............ optional (A-15R)
    ├── Help ............................ consistent location, WCAG 3.2.6
    └── Sign out

Unauthenticated
├── Login ............................... email/password + SSO (D-03)
├── Sign up ............................. B2C only (D-01)
├── Email verification .................. B2C
└── Password reset ...................... design-supplied (A-29R)
```

### Click depth to the primary goal

| Path | Clicks |
|---|---|
| Home → Continue Learning → **content** | **1** |
| Home → My Learning → Course → Module | 3 |
| Home → My Learning → standalone module | 2 |

The 1-click resumption path is the entire justification for Home, and it exists only because D-07's gating makes the next action deterministic.

---

## 11. B2B / B2C divergence — complete list

Every difference, so nothing diverges silently. **Everything not listed is identical** (D-01).

| # | Divergence | B2B | B2C |
|---|---|---|---|
| 1 | Global nav | No Explore | Explore present |
| 2 | Header context | Institution name label | None |
| 3 | Sign-up | Not offered | Offered |
| 4 | Auth | SSO preferred, password fallback | Password + social |
| 5 | Entitlement origin | Assigned by stream | Purchased |
| 6 | Empty My Learning | "No modules assigned — contact your institution" | "Nothing yet — Explore modules" + CTA |
| 7 | Access restricted | Contact institution administrator; **no purchase prompt** | Purchase path offered where applicable |
| 8 | Profile fields | ERP fields read-only (A-11) | All editable |
| 9 | XR device guidance | Shared institutional lab devices (FRD 2.4.3) | Personal device binding (2.4.1) |
| 10 | Licence expiry | Institution-managed | Learner-managed (Q-44) |

---

## 12. Naming

FRD vocabulary is used where it exists. These labels have no FRD source and need confirmation:

| Label | FRD term | Note |
|---|---|---|
| Home | — | No FRD term for a landing surface |
| My Learning | — | Covers courses **and** standalone modules, which "My Courses" would not |
| Explore | — | Preferred over "Store"/"Shop" — reads as academic discovery rather than retail, appropriate for a university-affiliated product |
| Learning Resources | "supporting learning material" (3.1.2) | FRD phrasing is descriptive, not a label |
| Simulation | "XR simulation experience" (3.1.1) | Shortened |
| Assessment | "assessment" (3.1.2, 5.x) | Direct FRD term |
| Progress | "personal learning progress" (8.1.5) | Closest FRD phrasing |
