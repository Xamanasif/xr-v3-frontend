# Developer Handoff — Phase 1 Student Desktop LMS

**Document status:** Stage 10 deliverable
**Created:** 2026-08-10
**Audience:** Frontend and backend engineering
**Scope:** 29 Student screens · desktop-first 1440px · WCAG 2.2 AA

---

## 1. Read these first

| # | File | Why |
|---|---|---|
| 1 | `01-requirements/DECISIONS.md` | **D-01 – D-19.** Every behaviour traces here. Nothing overrides these except a newer manager decision. |
| 2 | `06-design-system/tokens.css` | Drop in as-is. **Never hard-code a colour.** |
| 3 | `08-prototype/INTERACTION_SPECIFICATION.md` | All behaviour a static frame can't show |
| 4 | `07-high-fidelity/student-desktop-hifi.html` | Visual target — open in a browser |
| 5 | `09-accessibility/ACCESSIBILITY_REVIEW.md` | §7 is your build-time test checklist |
| 6 | `01-requirements/ASSUMPTIONS.md` | **29 unconfirmed positions.** If one is wrong, the fix is scoped there. |

---

## 2. Backend contract — read before estimating

Six behaviours are **server responsibilities**. Building them client-side will pass review and fail in production.

### 2.1 Assessment timer must be server-authoritative — A-41, ⚠ Q-43

The client displays remaining time; it must not own it.

```
POST /attempts                  → { attemptId, endsAt, questions[] }
GET  /attempts/{id}             → { remainingSeconds, answers[], hintsUsed[] }
PATCH /attempts/{id}/answers    → autosave, idempotent
POST /attempts/{id}/submit      → { score, breakdown, passed }
```

**A page reload must not grant a fresh 20 minutes.** The client reconciles to `remainingSeconds` on every load and after re-authentication. A client-side countdown is defeated by pressing F5.

### 2.2 Session expiry must not consume an attempt — D-17

Attempt lifetime and session lifetime are **independent**. Re-authentication resumes the same `attemptId` with the same `endsAt`. Answers persist server-side on every change.

> This is the single most damaging thing to get wrong: a Student loses their work *and* a scored attempt, to a timeout they did not cause.

### 2.3 Video completion is coverage, not position — A-36, ⚠ Q-40

Two independent values:

| Field | Meaning | Drives |
|---|---|---|
| `coveragePct` | cumulative **unique** seconds watched ÷ duration | completion at ≥90% |
| `positionSec` | current playhead | resume |

Store watched **intervals**, merge overlaps, then compute coverage. Furthest-position tracking is satisfied by one drag of the scrubber and would make the D-08 gate meaningless.

### 2.4 Module gating is server-evaluated — D-07, D-08, **D-20**

The client renders state; it must never compute unlock eligibility. **Two gates now exist**: between modules (D-07) and *within* a module (D-20).

```
GET /modules/{id} → {
  state: "locked"|"available"|"in_progress"|"assessment_required"
        |"retry_required"|"completed",
  awaitingDevice: bool,          // A-43 — label variant, not a 7th state
  pendingEvaluation: bool,       // A-24 — descriptive answers
  lockedBy: { moduleId, reason } | null,      // D-07, between modules

  // D-20 — module-internal sequence
  resources: [{ id, kind:"pdf"|"video", required:bool, complete:bool, title }],
  simulation: {
    unlocked: bool,
    lockedBy: { gate:"required_resources", remaining:[{id,title}] } | null,
    complete: bool
  },
  assessment: {
    unlocked: bool,
    lockedBy: { gate:"simulation" } | null,
    passed: bool, bestScore: number|null, attempts: number
  }
}
```

**Rules the client must not reimplement:**

- `simulation.unlocked` is false while any `required` resource is incomplete. `remaining[]` drives the copy — the UI names the specific outstanding resource, never a generic message.
- `assessment.unlocked` is false until `simulation.complete`.
- **Optional resources are never in `remaining[]`** and never affect either gate.
- `lockedBy.reason` distinguishes *previous module incomplete* from *previous assessment not passed* — the UI renders these differently and must not infer.
- **A locked component must not render an active action.** It renders a lock state naming its prerequisite. This is a correctness requirement, not styling: an active "Go to assessment" while the simulation is outstanding breaks D-20.

### 2.5 Simulation completion is account-level — **D-19**, A-42, ⚠ Q-49

A completion recorded for the **account** completes the simulation, whatever device produced it.

```
GET /modules/{id}/simulation → {
  format: "web"|"vr"|"mr"|"ar",
  licensed: bool,
  completedAt: iso8601 | null,
  lastCheckedAt: iso8601
}
```

The desktop reads this **on navigation** plus on demand via *Check for updates*. **Do not build a polling loop, a push channel, or device pairing** — D-19 forbids inventing cross-device mechanisms, and none is needed.

⚠ **Q-42:** there is deliberately **no manual completion override** (A-40) — it would defeat the gate for everyone. Engineering must define reconciliation for a completion that is never recorded.

### 2.6 Payment is a redirect; the indeterminate state is real — C-05

```
POST /orders                → { orderId, redirectUrl }
GET  /orders/{id}           → { status: "pending"|"paid"|"failed"|"unknown" }
```

**Never render card fields.** `unknown` is a first-class state: the UI claims neither outcome, polls (3s backing off to 15s, 2-minute ceiling), and **never offers immediate retry** — retry on an unresolved payment risks a double charge.

---

## 3. Layout

| Property | Value |
|---|---|
| Canvas | 1440px · 12 col · 24px gutter · 80px margin · 1280px content max |
| Column | 84.67px |
| Detail + rail | 845 / 411 |
| Card grid | 4 × 306 |
| Form | 440 |
| Reading measure | 680 (~68ch) |
| Top bar | 64px, `position: sticky` |

**Build with `minmax()` and relative units, not fixed widths.** Desktop-first is a scope decision (D-15), not a licence to hard-code. Reflow (WCAG 1.4.10) is currently unmet — ⚠ Q-52 — and cheap layouts now make the later responsive pass a reflow rather than a rebuild.

---

## 4. Component notes

Full inventory: `06-design-system/DESIGN_SYSTEM.md` §8. Only the non-obvious ones here.

### Module row — 6 states

State is **icon + text + row treatment**. Never colour alone (WCAG 1.4.1).

| State | Interactive | Notes |
|---|---|---|
| Locked | ❌ | **Stays focusable.** `aria-disabled="true"`, reason in the accessible name. Reason visible without interaction |
| Available / In Progress / Assessment Required | ✅ | |
| Retry Required | ✅ | **Visually distinct from Locked** — your module to fix, not another module's |
| Completed | ✅ | Reviewable |

`awaitingDevice` renders as In Progress + "Awaiting device completion" (A-43). **Do not add a seventh state** — lists, badges, and filters all key off six.

### Completion checklist — STU-04 rail

The single source of truth for D-08. Sticky. Groups: Required learning → Simulation → Assessment. Optional resources render in a visually separate group and **never** affect the count or the gate.

### Format badge

Icon + 2–3 letters + colour, all three. Never render the badge without its text — the letters are what survives greyscale.

### Assessment navigator

38 × 38px (floor is 24px — WCAG 2.5.8). Four states by fill + border + dot glyph. **Every cell needs a full `aria-label`**: `"Question 7, answered, hint used"`.

### Video player

Scrubber renders **two tracks** — coverage and position. Keyboard: `Space`, `←→` ±5s, `↑↓` volume, `F`, `C`. Single-key shortcuts only when the player has focus (WCAG 2.1.4). Caption track, transcript panel, **and a described-audio slot** — ⚠ Q-51.

### PDF viewer

`Mark as complete` is **disabled until the document has been opened** (A-34), with the reason on the disabled control. Download never completes.

### Download — unconditional (D-05 amendment)

**Both PDF and video always offer Download.** The earlier "where permitted" wording is withdrawn. Download is optional, never contributes to completion, and never appears in a D-20 gate condition.

### Locked component (`.lockbar`)

Dashed border · muted surface · lock glyph · **prerequisite named specifically**. It is *not* a disabled button — do not implement it as `<button disabled>`. It carries the prerequisite in its accessible name so the reason is announced without interaction.

---

## 5. Content rules for engineering to enforce

Three rules live in content, not code, but code must not make them impossible.

| Rule | Source |
|---|---|
| **A hint never contains the answer** — guidance only | D-06. Needs a question-bank authoring guideline and review step |
| **A video without captions must not be marked *Required*** for module completion | Accessibility review A-01. Otherwise a Deaf or hard-of-hearing Student is gated behind inaccessible content |
| **Simulation accessibility is a vendor acceptance criterion** — keyboard operability, contrast, no flashing | A-05. FRD 1.4.3 already gives Content Manager a compatibility review step where this fits |

---

## 6. Accessibility — non-negotiable

| # | Requirement | Criterion |
|---|---|---|
| 1 | Skip link first in DOM, visible on focus | 2.4.1 |
| 2 | `:focus-visible` ring never suppressed | 2.4.7 |
| 3 | `scroll-padding-top` on every scroll region under a sticky element | **2.4.11** |
| 4 | 24px minimum target; 40px for primary controls | **2.5.8** |
| 5 | No CAPTCHA, puzzle, or memory test on login; paste and password managers permitted | **3.3.8** |
| 6 | `autocomplete` on email, password, name, organization | 1.3.5 |
| 7 | Never re-request known data | **3.3.7** |
| 8 | Disabled controls stay focusable so their reason is announced | 4.1.2 |
| 9 | Timer announces at 5 min and 1 min only — never per second | 4.1.3 |
| 10 | Only two assertive live regions: timer expiry, payment resolution | 4.1.3 |
| 11 | All motion suppressed under `prefers-reduced-motion` | 2.3.3 |
| 12 | Video seek has keyboard equivalents | **2.5.7** |
| 13 | Timer reads a **per-attempt allowance**, not a constant — accommodation hook | ⚠ Q-50 |

Build-time test checklist: `09-accessibility/ACCESSIBILITY_REVIEW.md` §7.

---

## 7. Edge cases that will otherwise be missed

| Case | Required behaviour |
|---|---|
| Session expires mid-assessment | Answers kept · timer continues server-side · **attempt not consumed** · resume in place |
| Submission fails | Retry twice with backoff · answers retained · attempt not consumed · then manual retry |
| Timer expires | Auto-submit answered, unanswered = 0 · assertive announcement · **1.5s delay before navigation** so it completes |
| Simulation completion never recorded | *Check for updates* → retry → support. **No override** (A-40) |
| Licence validation fails at launch | STATE-01 variant 3 — copy acknowledges success was reasonable to expect |
| Institutional cap reached | STATE-01 variant 1 — **no purchase prompt.** A B2B Student cannot buy past their institution's cap |
| ERP sync removes a course | Shown in place with a neutral explanation, **never silently removed** (A-20) |
| Payment status `unknown` | Neither outcome claimed · poll · **no immediate retry** |
| Descriptive assessment submitted | "Awaiting evaluation" · module **pending**, not failed (A-24) |
| B2C standalone module | ⚠ **Q-47** — assumed always Available; gating applies within a course only |
| Bundle contains an owned module | ⚠ **Q-45** — undefined |

---

## 8. B2B / B2C

**Explore is omitted from the DOM for B2B, not hidden with CSS** — otherwise it stays in tab order and the accessibility tree.

Ten divergences, listed in `02-information-architecture/STUDENT_INFORMATION_ARCHITECTURE.md` §11. **Everything else is identical** (D-01). Do not fork components; branch on an audience flag at the composition level.

⚠ **Q-18:** a person holding both a B2B and a B2C identity has **two accounts**; progress and purchases do not merge (FRD 1.3.1/1.3.2). Registration must surface an explicit collision state rather than silently creating a second identity (D-03).

---

## 8b. Sample data — do not treat as approved

| Item | Status |
|---|---|
| Prices ₹999 / ₹1,499 / ₹2,499 | **Fictional layout placeholders** (A-44). No pricing, currency, or tax treatment is approved — Q-35 |
| Google / Microsoft social buttons | **Illustrative placeholders** (A-45). No provider is confirmed — Q-55. Real providers impose their own button specs |
| Licence duration | **Not stated.** Copy says "One-time purchase" only. "Lifetime access" was withdrawn as unconfirmed (A-47) — Q-53. **Do not reinstate any duration, expiry, renewal, or refund claim** |
| Score sign | **Sign-neutral** (A-46). Do not floor at 0 and do not special-case a negative until Q-54 is answered — the component handles both |
| Learner names, courses, scores | Fictional |

## 9. What is NOT in scope

Do not build, even if it seems natural: charts or analytics graphs · badges, streaks, points, leaderboards · notification centre · **persistent cart** (single-object purchase) · **coupon field** (FRD 6.4 is Phase 2) · global search (Explore filtering is not search) · certification tracking (FRD 3.5.1 is Phase 3) · recommendations (FRD 4.5 is Phase 2) · AI assistant (FRD 5.5 is Phase 3) · offline download library · per-question answer review (A-10) · manual simulation completion override (A-40).

Each is absent on purpose. Adding one silently re-opens a closed decision.

---

## 10. Open questions affecting build

**Resolve before or during build — three are engineering questions:**

| # | Question | Impact if unresolved |
|---|---|---|
| **Q-43** | Server-authoritative timer | Timer defeated by page reload |
| **Q-40** | Video coverage tracking | Completion gate defeated by scrubbing |
| **Q-42** | Unrecorded simulation completion | Student blocked with no self-service recovery |
| **Q-49** | Device-completion latency | Determines whether *Check for updates* is needed at all |
| **Q-50** | Assessment time accommodation | Accessibility barrier for entitled learners |
| **Q-51** | Caption / audio-description ownership | WCAG 1.2.2 (A) and 1.2.5 (AA) unmet |
| **Q-35** | Currency and tax presentation | Compliance-adjacent; affects checkout copy |
| **Q-46 / Q-47** | Courses purchasable? Gating for standalone modules? | Two progression models vs one |

Full register: `01-requirements/OPEN_QUESTIONS.md` — **38 open, none blocking build start.**

---

## 11. Definition of done, per screen

1. Matches the high-fidelity target in both light and dark
2. All six interaction states implemented
3. Loading state matches `08-prototype` §3
4. Every error state says **what happened** and **what next** (D-18)
5. Keyboard-operable end to end; focus order matches visual order
6. Contrast verified against computed values
7. Screen-reader pass on any screen with live regions
8. No hard-coded colours — tokens only
9. B2B and B2C variants both verified where they differ
10. Traces to an FRD requirement or a decision
