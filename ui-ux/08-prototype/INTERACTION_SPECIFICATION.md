# Interaction & Prototype Specification — Stage 7

**Document status:** Stage 7 deliverable
**Created:** 2026-08-10
**Scope:** Phase-1 Student desktop · all 29 screens
**Companions:** `07-high-fidelity/student-desktop-hifi.html` · `06-design-system/DESIGN_SYSTEM.md`

This document specifies **behaviour** — what a static frame cannot show. Where behaviour depends on an unresolved question, the safest reversible position is stated and labelled.

---

## 1. Global shell

### Navigation

| Element | Behaviour |
|---|---|
| Logo | Returns to Home. Never a "reload" affordance. |
| Nav item | Full page navigation. Active item gets a 2px underline **and** weight 640 — never colour alone. |
| Explore | **Rendered only for B2C** (D-04). Not hidden with CSS — omitted from the DOM, so it is absent from tab order and screen readers too. |
| Institution label | **B2B only.** Non-interactive `<span>`, never a button. It answers "whose licence am I studying under?", which matters when a restricted state appears. |
| Account menu | Click or `Enter`/`Space` opens. `Esc` closes and restores focus to the trigger. Arrow keys move between items. |

### Skip link

First focusable element on every page. Visually hidden until focused, then pinned top-left above all content. Targets `#main`.

### Breadcrumbs

Present on every screen deeper than a primary destination. Last item is plain text with `aria-current="page"`. Never truncated with an ellipsis — a Student must always be able to read where they are.

---

## 2. Interaction states

Every interactive element defines all six. Values from `tokens.css`.

| State | Treatment |
|---|---|
| Rest | As specified |
| Hover | Surface darkens one step (`--color-action` → `--color-action-hover`); no size change |
| Focus-visible | 2px `--color-focus` outline, 2px offset. **Keyboard only** — never suppressed |
| Active/pressed | No transform. Background darkens one further step |
| Disabled | `--color-sunken` fill, `--color-text-3` text, `aria-disabled="true"`, **remains focusable** so its reason can be announced |
| Loading | Label changes ("Sign in" → "Signing in…"), spinner replaces the leading icon, `aria-busy="true"`, width locked to prevent reflow |

**Disabled controls stay in the tab order.** A control removed from focus order cannot explain why it is unavailable — which matters most for the PDF *Mark as complete* button (A-34) and locked module rows.

---

## 3. Loading — per screen (resolves finding H-03)

Per the W-05 system rule: skeletons for known shapes, inline progress for determinate work, button-local spinners for submissions, full-page status only where the wait is genuinely opaque.

| Screen | Treatment |
|---|---|
| STU-01 Home | Skeleton: 1 continue panel (120px), 3 recent rows (64px), 2 progress bars. Needs Attention renders **only after data arrives** — never a skeleton, since it is usually absent |
| STU-02 My Learning | Skeleton: 3 course cards preserving 16:9 thumb + 2 text lines + bar |
| STU-03 Course detail | Skeleton: header block + 5 module rows at 68px |
| STU-04 Module detail | Skeleton main column and rail **independently** — the checklist usually resolves first and is the more useful information |
| STU-05 PDF | Page-count-aware placeholder; first page renders as soon as available |
| STU-06 Video | Poster frame + buffering indicator on the scrubber. **Never a blank black frame** |
| STU-07 Simulation | Licence validation shows a button-local spinner on Launch |
| STU-08 Runtime | **Determinate asset progress with percentage** where the platform reports it; indeterminate bar plus "Preparing simulation…" otherwise (⚠ Q-16 — payload unknown) |
| STU-09/10 Assessment | Skeleton question card + navigator grid. Timer does **not** start until the first question is interactive |
| STU-12 Result | Skeleton score block; **never render a partial score** |
| STU-13 Progress | Skeleton per course card |
| B2C-01 Explore | 8 skeleton product cards; filters remain interactive during load |
| B2C-04 Payment | Full-page status — the one legitimate opaque wait |

Skeletons shimmer at 1.4s, suppressed under `prefers-reduced-motion`. Regions carry `aria-busy="true"`; completion announces politely once, not per item.

---

## 4. Assessment — the most behaviour-dense screen

### Timer

| Property | Behaviour |
|---|---|
| Source of truth | **Server** (A-41, ⚠ Q-43). Client displays; it does not own the value |
| Reconciliation | On load and after re-authentication, client takes the server's remaining time |
| Reload | Resumes the same attempt with time elapsed — **a reload never grants a fresh 20 minutes** |
| Display | `mm:ss`, tabular numerals, sticky top bar |
| Announcements | `aria-live="polite"` at **5:00 and 1:00 only** — never per second (WCAG 4.1.3) |
| Under 1:00 | Timer switches to `--color-danger` **and** prefixes "Less than 1 minute remaining" — not colour alone |
| Expiry | Auto-submit. Answered questions submit; unanswered score 0 (D-06). Result explains that time ran out |

### Answering

- Options are a `radiogroup`; arrow keys move **and** select; `Tab` exits the group.
- Selection persists immediately (A-41) with a quiet "Saved ✓". No toast — a per-answer toast on a 10-question assessment is 10 interruptions.
- `scroll-padding-top: calc(var(--sticky-h) + 12px)` on the scroll region so a focused option never hides beneath the sticky timer (**2.4.11**).

### Hints (A-35)

```
Use hint → confirmation dialog
  "Using a hint reduces this question's maximum score from +2 to +1.
   This cannot be undone for this attempt."
  [Cancel]  [Use hint]
```

Confirmed because the cost is **silent and permanent**. On confirm: hint text appears inline below the stem; the control becomes a static "Hint used" marker; the navigator cell gains its marker and updated `aria-label`. One hint per question; a fresh attempt restores +2 eligibility for all questions.

**A hint never contains the answer** (D-06). This is a content rule that must reach whoever authors the bank — recorded in the handoff.

### Scoring and result disclosure — D-23 / D-25

**Score floor.** `reportedScore = max(rawScore, 0)`. Negative marking applies per answer; only the **reported total** is floored.

| Raw | Reported | Breakdown shows |
|---|---|---|
| +14 | 14 / 20 | line items summing to +14 |
| −4 | **0 / 20** | line items summing to **−4**, plus an explicit floor note |

When the raw total is negative the breakdown still shows the true arithmetic and adds one line — *"Reported score floored at 0"*. Hiding the raw arithmetic would make the disclosed scoring rules unverifiable by the Student.

**Pre-attempt disclosure adds one line** (D-23): *"Negative marking applies. Your final reported score cannot be lower than 0."*

**Answer review.** After submission the Student sees, per question: number · **Correct / Incorrect / Unanswered** · hint-used marker. They **never** see the correct option, an answer key, or answer text — **especially on failed attempts**. Rows are **not expandable** and do **not** link back to the question (A-49): under unlimited attempts, exposing option text is the key by elimination.

### Submission

`Submit` opens the confirmation modal (STU-11) showing the **unanswered count** (brief §8). *Review unanswered* returns to the **first** unanswered question, not question 1.

**Submission failure** (finding W-04): answers are retained; the system retries automatically twice with backoff; the modal shows "We couldn't submit your answers. They're saved — trying again…". After the final retry, an explicit manual retry appears and the copy states that nothing was lost. **The attempt is not consumed by a submission failure.**

---

## 5. Resource completion

### PDF (A-34)

`Mark as complete` is **disabled until the document has been opened**, with a hint on the disabled control: "Open the document to mark it complete." Download never completes (D-08). On completion the checklist row updates and the rail progress advances — **no toast**; the state change is its own feedback.

**Download is always offered** on both PDF and video (D-05 amendment). It never contributes to completion and never appears in a gate condition.

### Video (A-36)

Two independent values:

| Value | Meaning | Drives |
|---|---|---|
| **Coverage** | Cumulative unique seconds watched | Completion at ≈90% |
| **Position** | Current playhead | Resume point |

Scrubbing moves position, never coverage. The scrubber renders both tracks. At ≥90% coverage the resource marks complete automatically — **this is the one auto-completion in the product**, and it is safe because coverage cannot be faked by scrubbing.

Resume prompt appears when position > 5s. `Continue from 8:31` and `Start over` are both offered — never assume.

---

## 6. Module gating (D-07 / D-08 / **D-20**)

### 6.0 Module-internal sequence — D-20

Within a module the three component groups unlock in order. **A locked component never renders an active action.**

| Gate | Unlocks when | Locked copy |
|---|---|---|
| ① Required resources | always available | — |
| ② Simulation | **all required resources complete** | "Complete all required learning resources to unlock the simulation. *N* remaining — *name*." |
| ③ Assessment | **simulation completion recorded** | "Complete the simulation to unlock the assessment." |

Rules:

- The locked component renders as a **`.lockbar`** — dashed border, muted surface, lock glyph, prerequisite named. It is **not** a disabled button.
- The prerequisite is named **specifically** ("1 remaining — Venturi Meter Setup"), never generically ("complete previous steps").
- The rail checklist mirrors the same ①②③ numbering, so the sequence is legible before the Student reaches a gate.
- **Optional resources are outside the sequence** and never appear in a gate condition.
- Completing the final required resource announces politely: *"Simulation unlocked."*
- Server-evaluated (§2.4). The client renders `state` and `lockedBy`; it never computes eligibility.

### State transitions

```
Locked ──(previous module Completed)──> Available
Available ──(any component started)──> In Progress
In Progress ──(all required resources + simulation done)──> Assessment Required
Assessment Required ──(score ≥ 10/20)──> Completed
                     ──(score < 10/20)──> Retry Required
Retry Required ──(score ≥ 10/20)──> Completed
In Progress ──(only XR simulation outstanding)──> Awaiting device completion   [A-43]
Assessment Required ──(descriptive answers)──> Pending evaluation              [A-24]
```

`Awaiting device completion` and `Pending evaluation` are **labelled variants of In Progress**, not new states. This keeps the six-state model that every list, badge, and filter depends on (IA §9).

### Unlock feedback

When a module completes, the next module transitions Locked → Available **on the result screen**, and the primary action becomes *Continue to Module N*. The transition is announced politely once. No confetti, no celebration animation (C-04).

---

## 7. XR device completion (D-19 / A-42)

```
Student opens STU-07 for a VR/MR/AR module
  → status reads "Awaiting device completion"
  → [Continue on Meta Quest]  — instruction only; no technical handoff is performed
  → Student completes on the device
  → platform records completion against the ACCOUNT

Desktop reflects it by:
  a) reading recorded state on navigation / page load   (primary)
  b) [Check for updates] — explicit re-read on demand   (A-42)
```

**No polling loop, no push channel, no device pairing is implemented or implied** (D-19 constraint). *Check for updates* shows a button-local spinner, then either updates the panel and checklist, or reports "No change yet — completions can take a few moments to appear" with the last-checked time.

⚠ **Q-49 open:** latency is unspecified. If the platform records near-instantly, this control becomes redundant clutter and should be removed — which is exactly why it is a ghost button and not a prominent one.

⚠ **Q-42 open:** if a completion is genuinely never recorded, there is **no manual override** (A-40) because an override would defeat the gate for everyone. The path is *Check for updates* → retry the simulation → contact support.

---

## 8. Session expiry (D-17)

```
T-2:00  toast, polite live region:
          "Your session expires in 2 minutes."  [Stay signed in]
T-0     modal over the current screen (NOT a route change)
          "Your session has expired. Your answers have been saved."
          [Sign out]  [Continue]
        → re-authenticate → modal dismisses → SAME screen, SAME scroll position
```

| Context | Preserved |
|---|---|
| Assessment | Answers, hint states, **remaining time**. **Attempt not consumed** (D-17) |
| Video | Position and coverage |
| PDF | Page and open-state |
| Forms | Field values |
| Simulation | Platform-side state where it exists (⚠ Q-16) |

A modal rather than a route is what makes "continue where you left off" literally true instead of a claim.

⚠ **"Inactivity" is ill-defined inside a simulation canvas** that emits no LMS events. A naive passive timer would sign a Student out precisely while they are most engaged. Flagged for engineering — the simulation context must either suppress the timer or emit heartbeats.

---

## 9. Commerce (D-04)

| Step | Behaviour |
|---|---|
| Product types | **Modules and Bundles only (D-21).** No course product exists — no course CTA, price, checkout, or SKU anywhere in the flow |
| Standalone purchase | Purchased module is **immediately Available** (D-22) — no previous-module prerequisite. **D-20 internal gating still applies.** |
| Access duration | Rendered **only** when authoritative entitlement data supplies it — `Access until <date>` or `No expiry`. **The slot collapses entirely when absent** (A-48, D-24). Never "lifetime", "permanent", or "perpetual" |
| Explore filter | Applies without a page reload; result count announces politely; filters stay interactive during load |
| Owned product | Shows "In your learning" + *Start learning*, never a price or buy action (A-37) |
| Buy → Checkout | Direct. **No cart** (IA §4.3). Signed-out buyers route to AUTH-03 and return to the same product |
| Checkout | Account details pre-filled, never re-typed (WCAG 2.2 **3.3.7 Redundant Entry**) |
| Proceed to payment | Full-page redirect to the gateway. **No card fields in our UI** (C-05) |
| Processing | **No cancel, no retry, no back.** Browser back is intercepted with "Your payment is being processed" |
| Success | Licence active (9.2.1), entitlement in My Learning (9.2.2), *Start learning* is primary |
| Declined | Gateway-reported reason only (C-07). Nothing charged. Retry returns to checkout with the order intact |
| **Indeterminate** | Claims neither outcome. Polls at 3s, backing off to 15s, for 2 minutes. **Never offers immediate retry** — retry on an unresolved payment risks a double charge. Then: "We'll email you either way" |

---

## 10. Keyboard map

| Context | Keys |
|---|---|
| Global | `Tab` / `Shift+Tab` · skip link first · `Esc` closes overlays |
| Account menu | `Enter`/`Space` open · `↑↓` navigate · `Esc` close + restore focus |
| Tabs | `←→` move, `Home`/`End` jump, roving tabindex |
| Module list | `Tab` between rows · `Enter` opens · **locked rows focusable, reason announced** |
| Assessment options | `↑↓` move and select within the radiogroup · `Tab` exits |
| Question navigator | `Tab` in, `←→↑↓` between cells, `Enter` jumps |
| Video | `Space` play/pause · `←→` ±5s · `↑↓` volume · `F` fullscreen · `C` captions. **Seek has full keyboard equivalents** (WCAG 2.2 **2.5.7**) |
| Modal | Focus trapped · initial focus on the least-destructive action · `Esc` cancels · focus restored on close |
| PDF | `←→` pages · `+`/`−` zoom |

**Focus order follows visual order on every screen.** Where a rail sits beside main content, the rail follows main in DOM order, matching how the screen is read.

---

## 11. Announcements (`aria-live`)

| Event | Politeness | Text |
|---|---|---|
| Answer saved | polite, throttled 2s | "Answer saved" |
| Timer 5 min / 1 min | polite | "5 minutes remaining" |
| Timer expired | **assertive** | "Time has expired. Your assessment has been submitted." |
| Resource completed | polite | "Marked complete. 3 of 4 requirements done." |
| Module unlocked | polite | "Module 3 is now available." |
| Filter applied | polite | "24 results" |
| Session warning | polite | "Your session expires in 2 minutes." |
| Payment resolved | **assertive** | Outcome |
| Load complete | polite, once | "Content loaded" |

Only two assertive announcements exist. Both interrupt because both are irreversible.

---

## 12. Motion

| Transition | Duration | Notes |
|---|---|---|
| Hover / focus | 120ms | Colour only |
| Accordion, tab | 180ms | Height + opacity |
| Modal enter | 240ms | Opacity + 8px rise |
| Toast enter | 240ms | Slide from top |
| Skeleton shimmer | 1400ms loop | |
| Progress bar fill | 400ms | Width only |

Easing `cubic-bezier(.2,.8,.3,1)`. **All suppressed under `prefers-reduced-motion: reduce`.** Nothing in the product conveys meaning through motion alone — state changes are always accompanied by text.

---

## 13. Behaviour depending on open questions

| Behaviour | Position taken | Question | Reversal |
|---|---|---|---|
| Server-authoritative timer | Assumed (A-41) | Q-43 | Low — display change if client-side |
| Video coverage tracking | Assumed (A-36) | Q-40 | **Medium** — a tracking-model requirement, not UI |
| Device-completion refresh | Read-on-navigation + manual control (A-42) | Q-49 | Low — delete the control if the platform pushes |
| No simulation completion override | Assumed (A-40) | Q-42 | Low — but leaves no self-service recovery |
| Payment polling window | 2 minutes, then email | Q-34 | Low |
| PDF mark-complete | Explicit, gated on open (A-34) | Q-39 | Low |
| One hint per question | Assumed (A-35) | Q-38 | Low — a counter |
| No per-question review | Assumed (A-10) | Q-10 | Low — additive screen |

**Three carry engineering dependencies rather than product ones** — Q-40, Q-42, Q-43. They should be resolved with engineering before build, not at handoff.
