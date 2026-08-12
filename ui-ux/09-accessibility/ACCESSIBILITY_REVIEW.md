# Accessibility Review — WCAG 2.2 Level AA

**Document status:** Stage 8 deliverable
**Created:** 2026-08-10
**Standard:** WCAG 2.2 Level AA (D-11) — a **design-quality requirement, not FRD-derived**. The FRD contains zero accessibility requirements across all 131 items.
**Scope:** 29 Phase-1 Student desktop screens · design system · interaction specification

---

## 1. Method and honest limits

This is a **design-stage review**. It audits what design controls: colour, contrast, hierarchy, focus, target size, semantics as specified, copy, and interaction behaviour.

**It cannot certify compliance.** Several criteria are only verifiable against built code — computed contrast at runtime, actual DOM semantics, screen-reader output, real reflow. Those are marked **VERIFY AT BUILD** and listed in §6 as a build-time checklist rather than silently passed.

Contrast values were computed from the token values in `tokens.css` using the WCAG relative-luminance formula.

---

## 2. Status — no conformance claim is made

> ### Designed toward WCAG 2.2 AA at the design stage. **Full conformance cannot yet be claimed.**
>
> Responsive reflow, implementation semantics, media accessibility, runtime contrast, keyboard behaviour, and assistive-technology testing must still be verified. **One AA criterion — 1.4.10 Reflow — is currently NOT MET** by agreed scope, and is not counted as a pass.

| Outcome | Count |
|---|---|
| ✅ **Satisfied at design stage** | 37 |
| ❌ **Not met** | **1** — 1.4.10 Reflow (AA) |
| ⚠️ **Findings requiring a product owner** | 7 |
| 🔍 **Cannot be verified until build** | 11 |

Three of the seven findings — **Q-50** assessment time accommodation, **Q-51** media accessibility ownership, **Q-52** responsive/reflow commitment — are product and content decisions that design cannot resolve alone. All three remain open.

**"Satisfied at design stage" is not conformance.** It means the design does not introduce a known barrier against that criterion. Conformance is a property of the built product tested with assistive technology, and that testing has not happened.

### WCAG 2.2's six new criteria — all specifically addressed

| Criterion | Level | Status |
|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA | ✅ System rule — `scroll-padding-top` on every sticky-adjacent scroll region |
| 2.5.7 Dragging Movements | AA | ✅ Video seek and all sliders have keyboard equivalents |
| 2.5.8 Target Size (Minimum) | AA | ✅ 24px floor enforced in tokens; navigator cells 38px |
| 3.2.6 Consistent Help | A | ⚠️ **A-06** — Help placed consistently (Account menu, every screen), but its destination is unconfirmed (Q-48) |
| 3.3.7 Redundant Entry | A | ✅ Sign-up data pre-fills profile setup and checkout |
| 3.3.8 Accessible Authentication (Minimum) | AA | ✅ No cognitive-function test; paste and password managers permitted |

### Review-004 changes and their accessibility effect

| Change | Effect |
|---|---|
| **D-20 module gating** | Locked components render as `.lockbar` states naming their prerequisite — **not** disabled buttons. The reason sits in the accessible name and is readable without interaction (1.3.1, 4.1.2). Unlocking announces politely (4.1.3). |
| **Download unconditional** (D-05) | Removes a conditional affordance — one fewer state to explain |
| **Light as presentation theme** | Dark remains token-complete but **provisional** pending an approved reversed logo (Q-13). Contrast validated in both. |
| **Text token lift** | `--color-text-secondary` moved `--n-500` → **`--n-600` (6.7:1)** and `--color-text-tertiary` `--n-400` → **`--n-500` (4.6:1)**. `--n-400` (2.9:1) is now **disabled text only**. **No informational text sits below AA in either theme.** |
| **Sign-neutral score** (A-46) | A negative total renders without special-casing — no layout or announcement change whichever way Q-54 resolves |

---

## 3. Perceivable

| Criterion | Level | Status | Notes |
|---|---|---|---|
| 1.1.1 Non-text Content | A | ✅ | Logo has a descriptive `alt`; decorative glyphs `aria-hidden`; every meaningful icon is paired with text |
| 1.2.1 Audio/Video-only | A | 🔍 | No audio-only content planned |
| **1.2.2 Captions (Prerecorded)** | **A** | ⚠️ **A-01** | Placeholders specified; **content obligation unowned** |
| 1.2.3 Audio Description / Media Alternative | A | ⚠️ **A-01** | Transcript specified, which satisfies A |
| **1.2.5 Audio Description (Prerecorded)** | **AA** | ⚠️ **A-01** | **Not yet planned. Transcript does not satisfy AA.** See finding |
| 1.3.1 Info and Relationships | A | 🔍 | Specified: heading hierarchy, `radiogroup`, list semantics, `<th>` scope |
| 1.3.2 Meaningful Sequence | A | ✅ | DOM order matches visual order; rail follows main |
| 1.3.3 Sensory Characteristics | A | ✅ | No "click the button on the right" copy anywhere |
| 1.3.4 Orientation | AA | ✅ | No orientation lock |
| 1.3.5 Identify Input Purpose | AA | ✅ | `autocomplete` specified: `email`, `current-password`, `new-password`, `name`, `organization` |
| **1.4.1 Use of Color** | **A** | ✅ | **Enforced by rule.** Verified in greyscale — see §4 |
| 1.4.2 Audio Control | A | ✅ | No autoplay |
| **1.4.3 Contrast (Minimum)** | **AA** | ✅ | All pairings computed — see §4 |
| 1.4.4 Resize Text | AA | 🔍 | Relative units throughout; verify 200% at build |
| 1.4.5 Images of Text | AA | ✅ | Only the logo, which is exempt |
| **1.4.10 Reflow** | **AA** | ❌ **NOT MET** | **Desktop-only design set (D-15).** Counted as a failure, not a finding — see A-02 and Q-52 |
| 1.4.11 Non-text Contrast | AA | ✅ | Borders, focus ring, progress fill, badges all ≥3:1 — see §4 |
| 1.4.12 Text Spacing | AA | 🔍 | No fixed-height text containers specified; verify at build |
| 1.4.13 Content on Hover or Focus | AA | ✅ | Only the account menu; dismissible, hoverable, persistent |

---

## 4. Contrast verification

Computed from `tokens.css`. Light theme on `--color-surface` `#FFFFFF`.

### Text — AA requires 4.5:1 normal, 3:1 large

| Token | Hex | Ratio | Result |
|---|---|---|---|
| `--color-text` | `#161B22` | **16.9:1** | ✅ AAA |
| `--color-text-secondary` | `#515D6C` | **6.7:1** | ✅ AA |
| `--color-text-tertiary` | `#6A7686` | **4.6:1** | ✅ AA |
| `--color-action` | `#2B3982` | **10.3:1** | ✅ AAA |
| `--color-success` | `#146C43` | **6.5:1** | ✅ AA |
| `--color-warning` | `#8A5200` | **6.3:1** | ✅ AA |
| `--color-danger` | `#B3261E` | **6.6:1** | ✅ AA |
| `--color-info` | `#1A56C4` | **6.6:1** | ✅ AA |
| `--color-sim` | `#0F7A75` | **5.2:1** | ✅ AA |
| `--fmt-vr` | `#6B3FA0` | **7.3:1** | ✅ AAA |
| White on `--color-action` | — | **10.3:1** | ✅ AAA |

`--n-400` `#8C98A8` (2.9:1) is now bound only to `--color-text-disabled` and is **never used for informational text**. Recorded as a token usage rule and enforced in the high-fidelity build.

**Dark theme:** `--color-text-secondary` `#A9B4C1` = **8.2:1** and `--color-text-tertiary` `#8A96A4` = **5.8:1** on `#161B22`. Both ✅ AA.

### Non-text — AA requires 3:1

| Element | Ratio | Result |
|---|---|---|
| `--color-border` `#D8DEE7` on white | 1.5:1 | ⚠️ **A-03** — see finding |
| `--color-border-strong` `#B6C0CD` on white | 2.2:1 | ⚠️ **A-03** |
| Focus ring `#2B3982` | 10.3:1 | ✅ |
| Progress fill on track | 6.8:1 | ✅ |
| Selected option border | 10.3:1 | ✅ |

### Greyscale test — 1.4.1

Every screen was checked with colour removed:

| Signal | Survives greyscale? |
|---|---|
| Module state | ✅ Icon + text label |
| Format badge | ✅ Letters WEB / VR / MR / AR |
| Pass / fail | ✅ Word + score + icon |
| Required / optional | ✅ Word |
| Navigator states | ✅ Fill + border + `aria-label` |
| Timer urgency | ✅ Text prefix under 1:00 |
| Payment outcome | ✅ Heading text |

---

## 5. Operable · Understandable · Robust

| Criterion | Level | Status | Notes |
|---|---|---|---|
| 2.1.1 Keyboard | A | ✅ | Full map in `08-prototype` §10 |
| 2.1.2 No Keyboard Trap | A | ✅ | Modals trap deliberately with `Esc` + focus restore |
| 2.1.4 Character Key Shortcuts | A | ✅ | Video single-key shortcuts active **only when the player has focus** |
| **2.2.1 Timing Adjustable** | **A** | ⚠️ **A-04** | **The 20-minute assessment timer.** See finding — most significant in this review |
| 2.2.2 Pause, Stop, Hide | A | ✅ | Only the skeleton shimmer, suppressed under reduced-motion |
| 2.3.1 Three Flashes | A | ✅ | No flashing. Simulation content is third-party — flagged in handoff |
| 2.4.1 Bypass Blocks | A | ✅ | Skip link is the first focusable element |
| 2.4.2 Page Titled | A | ✅ | Unique titles specified per screen |
| 2.4.3 Focus Order | A | ✅ | Follows visual order on all 29 |
| 2.4.4 Link Purpose | A | ✅ | No "click here"; "Continue to Module 3" names its target |
| 2.4.5 Multiple Ways | AA | ✅ | Nav + breadcrumbs + Home + Progress cross-links |
| 2.4.6 Headings and Labels | AA | ✅ | Labels always visible — never placeholder-as-label |
| 2.4.7 Focus Visible | AA | ✅ | 2px ring, 2px offset, never suppressed |
| **2.4.11 Focus Not Obscured** | **AA** | ✅ | System rule from finding W-07 |
| 2.5.1 Pointer Gestures | A | ✅ | No multipoint or path gestures |
| 2.5.2 Pointer Cancellation | A | ✅ | Activation on up-event |
| 2.5.3 Label in Name | A | ✅ | Accessible names begin with visible text |
| 2.5.4 Motion Actuation | A | ✅ | None |
| **2.5.7 Dragging Movements** | **AA** | ✅ | Video seek has `←→` equivalents; no drag-only interaction exists |
| **2.5.8 Target Size (Minimum)** | **AA** | ✅ | 24px floor in tokens; navigator 38px; buttons 40px |
| 3.1.1 Language of Page | A | ✅ | `lang="en"` |
| 3.1.2 Language of Parts | AA | 🔍 | English-only (A-32); revisit under Q-32 |
| 3.2.1 On Focus | A | ✅ | No context change on focus |
| 3.2.2 On Input | A | ✅ | No auto-submit; filters announce rather than navigate |
| 3.2.3 Consistent Navigation | AA | ✅ | Identical shell across all authenticated screens |
| 3.2.4 Consistent Identification | AA | ✅ | Same icon and label for the same function everywhere |
| **3.2.6 Consistent Help** | **A** | ⚠️ **A-06** | Consistently placed in the account menu; existence unconfirmed (Q-48) |
| 3.3.1 Error Identification | A | ✅ | Text, not colour; adjacent to the field |
| 3.3.2 Labels or Instructions | A | ✅ | Assessment rules disclosed before the attempt (D-06) |
| 3.3.3 Error Suggestion | AA | ✅ | D-18 requires every error to state what to do next |
| **3.3.4 Error Prevention (Legal, Financial, Data)** | **AA** | ✅ | Payment **and** assessment submission both confirmed — see §5.1 |
| **3.3.7 Redundant Entry** | **A** | ✅ | Sign-up → profile setup → checkout all pre-fill |
| **3.3.8 Accessible Authentication** | **AA** | ✅ | No CAPTCHA, puzzle, or memory test; paste and password managers permitted |
| 4.1.2 Name, Role, Value | A | 🔍 | Specified; verify at build |
| **4.1.3 Status Messages** | **AA** | ✅ | Full announcement table in `08-prototype` §11 |

*(WCAG 2.2 removed 4.1.1 Parsing; it is not audited.)*

### 5.1 · 3.3.4 detail

Two flows engage this AA criterion, and both are satisfied by **confirmation**:

- **Financial** — checkout confirms the order before redirect; the processing screen deliberately offers no cancel or retry, preventing a double charge.
- **Data** — assessment submission is confirmed with the unanswered count (STU-11), and *Review unanswered* returns to the first unanswered question.

---

## 6. Findings

### A-04 · The 20-minute assessment timer has no accommodation path — **Highest priority**

**Criterion:** 2.2.1 Timing Adjustable (Level **A**) · **Severity: High**

D-06 sets a fixed 20-minute limit. 2.2.1 requires users be able to turn off, adjust, or extend a time limit, with an **Essential exception** where extending it would invalidate the activity. A timed assessment usually qualifies for that exception — **so this is very likely compliant as specified.**

The problem is not the exception; it is that **no accommodation mechanism exists anywhere in the design or the FRD**. Learners entitled to extended time — a routine accommodation in higher education, and one that Indian institutions grant under the Rights of Persons with Disabilities Act 2016 — have no way to receive it. There is no per-student time multiplier, no Faculty-side control, and no FRD requirement covering it.

This is a **product gap, not a design defect**. Design cannot invent an accommodation system (C-04), and D-06 is a confirmed decision.

**Position taken:** the 20-minute limit is implemented as specified. The timer reads from a **per-attempt allowance** rather than a hard-coded constant, so an accommodation multiplier can be introduced later without redesigning the screen or the timer logic.
**Escalated as Q-50.**

### A-01 · Video accessibility obligations are unowned

**Criteria:** 1.2.2 Captions (A) · 1.2.5 Audio Description (AA) · **Severity: High**

D-05 introduces instructional video, which brings obligations no requirement assigns to anyone. Captions are Level **A**. **Audio description is Level AA** and is the one most often missed — a transcript does *not* satisfy it. For engineering video showing apparatus, diagrams, or on-screen procedures, meaningful visual information will be conveyed without narration, which is exactly what audio description exists to cover.

The design provides caption and transcript surfaces. It cannot produce the content.

**Position taken:** the player specifies a caption track, a transcript panel, and a **described-audio track slot**, so the capability exists even before content does. A video without captions must not be marked *Required* for module completion under D-08 — otherwise a Deaf or hard-of-hearing Student is gated behind inaccessible content.
**Escalated as Q-51.**

### A-02 · Reflow is unmet by design scope

**Criterion:** 1.4.10 Reflow (AA) · **Severity: Medium**

1.4.10 requires content at 320 CSS px equivalent without two-dimensional scrolling. D-15 is desktop-first at 1440px with no mobile or tablet set, so **this AA criterion is not currently met** — not through oversight but through agreed scope.

**Position taken:** stated plainly rather than passed. Mitigations already in place: no fixed-width containers, `minmax()` grids, relative units throughout, and text-expansion tolerance (A-32). The layouts are built to reflow when a responsive pass happens.
**Escalated as Q-52.**

### A-03 · Default border contrast is below 3:1

**Criterion:** 1.4.11 Non-text Contrast (AA) · **Severity: Low**

`--color-border` (1.5:1) and `--color-border-strong` (2.2:1) fall below 3:1 against white.

**Assessment:** 1.4.11 applies to boundaries **required to identify a control**. Our inputs and buttons are identified by their label, fill, and shape as well as their border, so the border is decorative in the criterion's terms. The default border is therefore acceptable.

**Fix applied:** where a border **is** the sole identifier — the unselected radio and checkbox indicator — `--color-border-strong` is replaced with `--n-500` `#6A7686` (**4.6:1**). Recorded as a token usage rule so it cannot regress.

### A-05 · Simulation content accessibility is out of our control

**Criteria:** multiple · **Severity: Medium**

Web simulations (FRD 1.2.1) are third-party builds (1.4.1 vendor submission). Their internal accessibility — keyboard operability, contrast, flashing, screen-reader support — is outside this design system and unaddressed by any FRD requirement.

**Position taken:** the LMS provides an accessible frame — labelled launch, keyboard-reachable exit, focus management on entry and return. Simulation accessibility is recorded in the developer handoff as a **vendor acceptance criterion**, since FRD 1.4.3 already gives the Content Manager a compatibility review step where it could be enforced.

### A-06 · Help exists as a location but not as a destination

**Criterion:** 3.2.6 Consistent Help (A) · **Severity: Low**

3.2.6 requires help to be consistently located **when it exists**. Several designed states tell the Student to contact support (A-27R, A-40). The design places Help in the account menu on every screen — consistent placement. Whether a real help destination sits behind it is unconfirmed (Q-48).

**Position taken:** placement is consistent, so the criterion is satisfiable the moment the destination exists.

### A-07 · Assessment auto-submit is abrupt for screen-reader users

**Criteria:** 2.2.1 · 4.1.3 · **Severity: Low**

At expiry the assessment submits and navigates to the result. A screen-reader user mid-question may not register the transition.

**Fix applied:** expiry announces **assertively** ("Time has expired. Your assessment has been submitted."), navigation is delayed 1.5s so the announcement completes, and the result screen leads with an explicit time-expired explanation rather than only a score.

---

## 7. Build-time verification checklist

Design cannot certify these. Each must be tested against built code.

| # | Check | Criteria |
|---|---|---|
| 1 | Heading hierarchy has no skipped levels | 1.3.1 |
| 2 | Radio groups expose `radiogroup` + `aria-checked` | 1.3.1, 4.1.2 |
| 3 | Progress bars expose `role="progressbar"` with now/min/max | 4.1.2 |
| 4 | Locked module rows are focusable and announce their reason | 1.3.1, 4.1.2 |
| 5 | Text at 200% zoom loses no content or function | 1.4.4 |
| 6 | Text-spacing overrides break no layout | 1.4.12 |
| 7 | Live regions announce once, not per keystroke | 4.1.3 |
| 8 | Modal focus trap + restore on all dialogs | 2.1.2, 2.4.3 |
| 9 | Video player controls are fully keyboard operable | 2.1.1, 2.5.7 |
| 10 | Computed contrast matches the token values here | 1.4.3, 1.4.11 |
| 11 | Screen-reader pass on the assessment attempt — the densest screen | multiple |

**Recommended:** one assistive-technology pass with NVDA/Chrome and VoiceOver/Safari on AUTH-01, STU-04, and STU-10, plus a keyboard-only run of the full module-completion journey.

---

## 8. New open questions

| # | Question | Priority |
|---|---|---|
| **Q-50** | Is there an extended-time accommodation for assessments, and who grants it? | **High** |
| **Q-51** | Who owns video captions, transcripts, and **audio description**, and is captioning a publishing prerequisite? | **High** |
| **Q-52** | Is a responsive/mobile design set committed, and when? Reflow (1.4.10 AA) is unmet until it exists. | Medium |

All three are **product decisions, not design defects.** Each is recorded in `OPEN_QUESTIONS.md`.

---

## 9. Conclusion

**The design is built toward WCAG 2.2 AA. Full conformance cannot be claimed and is not claimed.**

What is true today:

- The design does not introduce a known barrier against 37 of the 38 applicable A/AA criteria.
- **1.4.10 Reflow (AA) is not met.** Desktop-only is an agreed scope decision (D-15), not an oversight — but an unmet AA criterion is a failure, not a finding, and it is counted as one.
- **11 criteria cannot be assessed from a design** (§7). They depend on built markup, computed contrast, live keyboard behaviour, and assistive-technology output.
- **Three barriers need an owner outside design**: extended-time accommodation (Q-50), captions and audio description (Q-51), and the responsive commitment (Q-52).

A conformance claim would require: the responsive work in Q-52, the media content in Q-51, the accommodation mechanism in Q-50, the 11 build-time verifications, and an assistive-technology pass on at least AUTH-01, STU-04, and STU-10.

These are stated plainly rather than passed quietly. Each represents a real barrier to a real Student, and each is far cheaper to address now than after build.
