# Wireframe Self-Review — Stage 4

**Date:** 2026-08-10 · **Reviewer:** UI/UX · **Subject:** Stage 3 low-fidelity wireframes
**Method:** Every screen checked against the 13-point rubric in Review-002 brief §24.

---

## Rubric results

| # | Check | Result |
|---|---|---|
| 1 | Requirement correctness | ✅ 29/29 trace to an FRD requirement or a decision |
| 2 | User goal | ✅ Each screen states one primary goal |
| 3 | Primary action | ✅ One unambiguous primary per screen |
| 4 | Hierarchy | ⚠️ 2 issues found — W-01, W-02 |
| 5 | Navigation | ✅ Max depth 3; breadcrumb on every nested screen |
| 6 | B2B / B2C context | ⚠️ 1 issue — W-03 |
| 7 | Completion logic | ✅ D-08 checklist present and authoritative on STU-04 |
| 8 | Error recovery | ⚠️ 1 gap — W-04 |
| 9 | Loading state | ⚠️ 1 gap — W-05 |
| 10 | Accessibility | ⚠️ 2 issues — W-06, W-07 |
| 11 | Copy | ✅ Plain language; no internal codes exposed |
| 12 | Consistency | ⚠️ 1 issue — W-08 |
| 13 | FRD traceability | ✅ Recorded per screen in the inventory |

**8 findings. All resolved before Stage 5.**

---

## Findings

### W-01 · STU-04 competes with itself for the primary action — **fixed**

The module detail screen offered "Continue: [next item]" in the rail *and* per-resource actions in the main column *and* section-level "Go to simulation / assessment" buttons. Three plausible primaries.

**Fix:** the rail button is the single primary (filled). Section buttons become secondary (outline). Resource rows are navigational rows, not buttons. The rail always names the *next* incomplete item, so the primary is deterministic — the same principle that justifies Home.

### W-02 · Home progress and Recent Learning read as equal weight — **fixed**

Recent Learning (8 cols) and Your Progress (4 cols) sat at the same visual level, competing with the Continue panel above.

**Fix:** Continue Learning gets heavier treatment — larger type, thicker border, filled primary. The two panels below drop to secondary weight. A returning Student's eye must land on the resumption target first, which is the entire argument for Home (IA §3).

### W-03 · B2B/B2C divergence was under-specified on two screens — **fixed**

The Explore removal was specified, but STU-01 and STU-02 empty states did not visibly differ by audience in the wireframes, and the B2B institution label was missing from the top bar in three renders.

**Fix:** empty-state variants annotated per audience on both screens; institution label added to the shell spec as a B2B-only element and marked in the frame annotations. Full divergence list is IA §11 — ten differences, everything else identical (D-01).

### W-04 · No wireframe for "assessment submission fails" — **fixed**

Brief §13 requires it. Flow 19 covers connection loss *during* an attempt, but not a failure at the moment of submission — the worst possible moment, since the Student believes they are finished.

**Fix:** added to the STU-11 spec as an inline modal state: submission is retried automatically, answers are held, and the attempt is **not** consumed. Copy: "We couldn't submit your answers. They're saved — trying again…" Explicit failure after retries offers a manual retry and states that nothing was lost.

### W-05 · Skeleton vs spinner was unspecified — **fixed**

Loading states existed as labels but not as a rule, risking inconsistent treatment across 29 screens.

**Fix:** rule added to the design system — **skeletons** for content whose shape is known (lists, cards, checklist, progress), **inline progress** for determinate operations (video buffering, simulation asset download), **button-local spinners** for submissions. A full-page spinner is used only on B2C-04, where the wait is genuinely opaque.

### W-06 · Assessment navigator relied on shape alone at small size — **fixed**

Four states (answered / unanswered / hint used / current) were distinguished by border style only. At 32px the double-border "hint used" and solid "answered" are hard to tell apart, and WCAG 1.4.1 compliance was being carried by a very thin margin.

**Fix:** each state now carries **shape + fill + a text label in `aria-label`**, and hint-used adds a small dot glyph. Verified legible at the specified 32×32 (above the 2.5.8 minimum of 24×24).

### W-07 · Sticky assessment timer could obscure the focused option — **fixed**

WCAG 2.2 **2.4.11 Focus Not Obscured (Minimum)** is exactly the failure mode of a sticky bar plus keyboard navigation through a long radio group.

**Fix:** `scroll-padding-top` equal to the sticky bar height on the scroll container, so a focused option never scrolls beneath it. Recorded as a design-system rule for every sticky element, not just this screen.

### W-08 · Two different "back" patterns — **fixed**

Resource viewers used "← Back to module" in a sticky bar; other nested screens used a breadcrumb. Inconsistent for the same action.

**Fix:** breadcrumbs everywhere for hierarchy; the resource viewers additionally keep the explicit back control because they are P4 focus screens with reduced chrome — and that exception is now stated as a rule rather than left as drift.

---

## Verified good

- **The D-08 checklist earns its place.** It is the only element that makes gating legible, and it is present on the one screen that needs it.
- **Locked vs Retry Required are visibly different.** Collapsing them would have told a Student who just failed an assessment that something unrelated is "locked".
- **STU-07 states the D-07 consequence up front** — an XR module that cannot be completed on desktop will block the next module. Not in the brief; it follows from D-07 ∧ D-09.
- **B2C-04 has no controls at all.** Deliberate: cancel or retry mid-payment risks a double charge.
- **The indeterminate payment result claims nothing.** The hardest of the three variants and the one most often got wrong.
- **STU-12 puts "Review learning resources" before "Retry"** — unlimited attempts (D-06) invite retry-without-restudy, and order is the cheapest available intervention.

---

## Deliberately not addressed

| Item | Why |
|---|---|
| Empty Explore catalog with zero products | Not reachable in any realistic seeded state; the no-results-for-filters state covers the real case |
| Multi-item cart | No FRD basis — single-object purchase (IA §4.3) |
| Bulk resource download | Would contradict FRD 1.1.4 and 10.1.1 |
| Dark theme wireframes | Fidelity-inappropriate at Stage 3; the design system defines both themes |

---

## Outcome

✅ **Approved to proceed to Stage 5.** All 8 findings resolved. Three became **design-system rules** rather than one-off fixes — loading treatment (W-05), sticky-focus offset (W-07), and back-navigation (W-08) — which is the right outcome for issues that would otherwise recur across 29 screens.
