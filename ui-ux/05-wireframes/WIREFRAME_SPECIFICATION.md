# Low-Fidelity Wireframe Specification — Phase 1 Student Desktop

**Document status:** Stage 3 deliverable (Review 002)
**Created:** 2026-08-10
**Canvas:** 1440 × auto · 12 columns · 24px gutter · 80px page margin · 1280 content max (D-15)
**Fidelity:** Structure, hierarchy, and behaviour only. **No colour, no type choices, no imagery.**

**Companion file:** [`lofi-wireframes.html`](lofi-wireframes.html) — rendered greyscale wireframes.

---

## Global shell

Applies to every authenticated screen.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR                                                              h: 64   │
│  ┌────────┐                                                                  │
│  │ LOGO   │  Home   My Learning   [Explore]   Progress    [Inst.]  Account ▾ │
│  └────────┘         ▔▔▔▔▔▔▔▔▔▔▔                                              │
│                     active indicator: 2px underline + weight, not colour     │
└──────────────────────────────────────────────────────────────────────────────┘
   ├ 80 ─┤                        1280 content                        ├─ 80 ─┤

   Breadcrumb (contextual)                                            h: 40
   Page title block                                                   h: 72
   Content region                                                     auto
```

| Rule | Detail |
|---|---|
| `Explore` | **B2C only** (D-04) |
| `[Inst.]` | **B2B only** — institution name, non-interactive context label |
| No sidebar | Nav depth is 2; a sidebar would add chrome without reducing clicks |
| Skip link | First focusable element, visible on focus → `#main` (WCAG 2.4.1) |
| Focus | Never obscured by sticky elements (**WCAG 2.2 · 2.4.11**) |

---

## Layout patterns

Four patterns cover all 29 screens. Reuse over invention.

| Pattern | Structure | Screens |
|---|---|---|
| **P1 · Centred form** | 440px card, vertically centred, no top bar | AUTH-01 – 07 |
| **P2 · List** | Full width, sectioned list, optional filter bar | STU-02, 13, B2C-01 |
| **P3 · Detail + rail** | 8-col main / 4-col sticky rail | STU-03, 04, 07, B2C-02, 03 |
| **P4 · Focus** | Reduced chrome, single task | STU-05, 06, 08, 10, B2C-04 |

---

# AUTH-01 · Login — P1

```
                    ┌────────────────────────────────────┐
                    │            [ LOGO ]                │
                    │                                    │
                    │   Sign in                          │  H1
                    │   Continue to your learning        │  body
                    │                                    │
                    │   ┌──────────────────────────────┐ │
                    │   │ Email address                │ │  input, h 44
                    │   └──────────────────────────────┘ │
                    │   ┌──────────────────────────────┐ │
                    │   │ Password              [show] │ │  input, h 44
                    │   └──────────────────────────────┘ │
                    │                    Forgot password?│  link
                    │   ┌──────────────────────────────┐ │
                    │   │        Sign in               │ │  primary, h 44
                    │   └──────────────────────────────┘ │
                    │   ──────────  or  ──────────       │
                    │   ┌──────────────────────────────┐ │
                    │   │ 🏛  Continue with your        │ │  secondary
                    │   │     institution              │ │  ← B2B path
                    │   └──────────────────────────────┘ │
                    │   ┌───────────┐  ┌───────────┐     │
                    │   │  Google   │  │ Microsoft │     │  B2C social
                    │   └───────────┘  └───────────┘     │
                    │                                    │
                    │   New here?  Create an account     │  B2C ONLY
                    └────────────────────────────────────┘
```

**Behaviour**

- **B2B context:** social buttons and "Create an account" are **absent** (D-01). Institution SSO moves **above** the credential form — D-03 makes it the preferred path, and preference must be expressed by order, not just presence.
- Errors are inline, above the submit, non-enumerating ("Email or password is incorrect") — never "no such user".
- **WCAG 2.2 · 3.3.8** — no CAPTCHA, no puzzle. `autocomplete="current-password"`, paste permitted.
- Not-provisioned SSO returns route to **STATE-01**, not to a login error — the credentials were correct.

---

# AUTH-06 · Session expired — modal over the current screen

```
   ┌────────────────────────────────────────────┐
   │  Your session has expired                  │  H3
   │                                            │
   │  Your answers have been saved.             │  ← the reassurance IS
   │  Sign in to continue where you left off.   │    the point of this screen
   │                                            │
   │  ┌──────────────────────────────────────┐  │
   │  │ Password                             │  │
   │  └──────────────────────────────────────┘  │
   │  ┌──────────────┐  ┌────────────────────┐  │
   │  │  Sign out    │  │  Continue          │  │
   │  └──────────────┘  └────────────────────┘  │
   │                                            │
   │  Time remaining on your attempt: 08:14     │  ← assessment context only
   └────────────────────────────────────────────┘
```

Preceded by a **2-minute warning toast** with "Stay signed in" (D-17). Modal, not a route — preserving the underlying screen is what makes "continue where you left off" true rather than a claim. The attempt is **not** consumed (D-17).

---

# STU-01 · Home

```
Good afternoon, Priya                                                    H1

┌──────────────────────────────────────────────────────────────────────┐
│  CONTINUE LEARNING                                          8 cols   │
│  ┌────────┐                                                          │
│  │ thumb  │  Fluid Mechanics · Module 2 of 8                         │
│  │ 96×96  │  Flow Measurement Using a Venturi Meter                  │  H2
│  └────────┘  Next: Venturi Meter Setup (PDF)          ← next COMPONENT,
│              [ ▸ Continue ]                              not just module
└──────────────────────────────────────────────────────────────────────┘
     ↑ ONE deterministic target. 1 click to content. Exists because D-07
       gating makes "the next thing" unambiguous.

┌─────────────────────────────────────┐  ┌───────────────────────────────┐
│ RECENT LEARNING              8 cols │  │ YOUR PROGRESS          4 cols │
│ ┌─────────────────────────────────┐ │  │ Fluid Mechanics               │
│ │ [fmt] Module title      state   │ │  │ ▓▓▓▓▓░░░░░  2/8               │
│ ├─────────────────────────────────┤ │  │                               │
│ │ [fmt] Module title      state   │ │  │ Thermodynamics                │
│ ├─────────────────────────────────┤ │  │ ▓░░░░░░░░░  1/10              │
│ │ [fmt] Module title      state   │ │  │                               │
│ └─────────────────────────────────┘ │  │ View all progress →           │
│              max 3                  │  └───────────────────────────────┘
└─────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ ⚠ NEEDS ATTENTION                                                    │
│   Heat Transfer · Module 3 assessment not yet passed (8/20)          │
│   [ Retry assessment ]                                               │
└──────────────────────────────────────────────────────────────────────┘
     ↑ RENDERED ONLY WHEN NON-EMPTY. A Student in good standing sees no
       block at all — no "nothing to see here" zero-state (A-38).
```

**Forbidden on this screen** (A-38, C-04): charts · streaks · badges · ranking · peer comparison · metric tiles beyond course count and completion.

**Empty variants** — B2B: "No modules assigned yet" + institution contact. B2C: "Nothing here yet" + **Explore modules**.

---

# STU-02 · My Learning — P2

```
My Learning                                                              H1
[ All ]  [ In progress ]  [ Not started ]  [ Completed ]      filter chips

IN PROGRESS
┌─────────────────────────────┐ ┌─────────────────────────────┐
│ COURSE CARD          4 cols │ │ COURSE CARD                 │
│ ┌─────────────────────────┐ │ │                             │
│ │      thumbnail 16:9     │ │ │                             │
│ └─────────────────────────┘ │ │                             │
│ Fluid Mechanics             │ │ Thermodynamics              │
│ 8 modules · Mechanical      │ │ 10 modules · Mechanical     │
│ ▓▓▓▓▓░░░░░  2 of 8          │ │ ▓░░░░░░░░░  1 of 10         │
└─────────────────────────────┘ └─────────────────────────────┘

STANDALONE MODULES                          ← B2C purchases / assigned singles
┌────────────────────────────────────────────────────────────┐
│ MODULE ROW — visually distinct from a course card          │
│ [VR]  Robotic Arm Kinematics      ● In Progress            │
└────────────────────────────────────────────────────────────┘

COMPLETED                                   ← separated, never hidden
```

**Course cards and module rows are deliberately different objects** (brief §6) — card with thumbnail and progress bar vs compact row with format badge and state. A Student must never have to read a label to tell which level of the hierarchy they are looking at.

---

# STU-03 · Course detail — P3

```
Home › My Learning › Fluid Mechanics                              breadcrumb

Fluid Mechanics                                                         H1
Mechanical Engineering · 8 modules · 2 completed

┌──────────────────────────────────────────┐ ┌──────────────────────────┐
│ [ Overview ]  [ Modules (8) ]     tabs   │ │ COURSE PROGRESS  4 cols  │
├──────────────────────────────────────────┤ │ ▓▓▓▓▓░░░░░  25%          │
│ ① ✓ Bernoulli's Principle                │ │ 2 of 8 modules           │
│    [Web] 3 resources · assessment        │ │ Time spent 4h 12m        │
│    Completed · 15/20                     │ │  ↑ COURSE level only     │
├──────────────────────────────────────────┤ │    (A-28R)               │
│ ② ● Flow Measurement — Venturi Meter     │ │                          │
│    [Web] 3 resources · assessment        │ │ [ Continue Module 2 ]    │
│    In Progress · 2 of 4 steps            │ └──────────────────────────┘
├──────────────────────────────────────────┤
│ ③ 🔒 Pipe Friction and Head Loss         │  ← LOCKED
│    [VR] 2 resources · assessment         │
│    Locked — complete Module 2 first      │  ← reason visible WITHOUT
├──────────────────────────────────────────┤     interaction
│ ④ 🔒 Pump Performance                    │
│    Locked                                │
└──────────────────────────────────────────┘
```

**Module row anatomy:** sequence number · state icon · title · format badge · component summary · state text. **State = icon + text + row treatment. Never colour alone** (WCAG 1.4.1).

Locked rows are non-interactive but remain in the accessibility tree so the reason is announced.

**Retry Required** renders distinctly from Locked: "Assessment not yet passed (8/20)" + **Retry assessment**. One is your own module to fix; the other is about a different module.

---

# STU-04 · Module detail — P3 · the completion hub

```
Home › My Learning › Fluid Mechanics › Module 2

Module 2 of 8                                                     eyebrow
Flow Measurement Using a Venturi Meter                                  H1
[Web simulation]  ·  Est. 45 min                                    badges

┌──────────────────────────────────────────┐ ┌──────────────────────────┐
│ OVERVIEW                                 │ │ TO COMPLETE THIS MODULE  │
│ Description paragraph…                   │ │                          │
│                                          │ │ REQUIRED LEARNING        │
│ LEARNING RESOURCES                       │ │  ✓ Introduction (PDF)    │
│ ┌──────────────────────────────────────┐ │ │  ✓ Bernoulli (Video)     │
│ │ 📄 Introduction to Venturi Meters    │ │ │  ○ Venturi Setup (PDF)   │
│ │    PDF · 1.2 MB · Required     ✓     │ │ │                          │
│ ├──────────────────────────────────────┤ │ │ SIMULATION               │
│ │ ▶ Bernoulli Principle Explained      │ │ │  ○ Not started           │
│ │    Video · 12:40 · Required    ✓     │ │ │                          │
│ ├──────────────────────────────────────┤ │ │ ASSESSMENT               │
│ │ 📄 Venturi Meter Setup               │ │ │  ○ Not attempted         │
│ │    PDF · 0.8 MB · Required     ○     │ │ │                          │
│ ├──────────────────────────────────────┤ │ │ ─────────────────────    │
│ │ 📄 Further Reading                   │ │ │ 2 of 4 complete          │
│ │    PDF · Optional              ○     │ │ │                          │
│ └──────────────────────────────────────┘ │ │ [ Continue: Venturi      │
│      ↑ optional visibly distinct;        │ │   Meter Setup ]          │
│        never blocks (D-08)               │ └──────────────────────────┘
│                                          │        ↑ STICKY rail
│ SIMULATION            → STU-07           │
│ ASSESSMENT            → STU-09           │
└──────────────────────────────────────────┘
```

**The rail checklist is the single source of truth for D-08.** A Student must never infer why a module is incomplete.

**Sections are generated from actual content** (FRD 3.1.2 "may include"). A simulation-only module renders one section — never empty tabs.

**On completion:** the rail becomes `MODULE COMPLETED` + **Continue to Module 3**, and Module 3 transitions Locked → Available.

---

# STU-05 · PDF viewer — P4

```
← Back to module          Introduction to Venturi Meters       ✓ Required

┌──────────────────────────────────────────┐ ┌──────────────────────────┐
│                                          │ │ PDF · 1.2 MB · 8 pages   │
│         DOCUMENT VIEWPORT                │ │                          │
│                                          │ │ [ ⭳ Download ]           │
│                                          │ │   optional — never       │
│                                          │ │   completes (D-08)       │
│                                          │ │                          │
│  ┌──────────────────────────────────┐    │ │ ┌──────────────────────┐ │
│  │ ◂  Page 3 of 8  ▸       − 100% + │    │ │ │ ✓ Mark as complete   │ │
│  └──────────────────────────────────┘    │ │ └──────────────────────┘ │
└──────────────────────────────────────────┘ │  DISABLED until opened   │
                                             │  (A-34)                  │
                                             └──────────────────────────┘
```

**A-34:** open-then-mark, not auto-complete-on-open. A mis-click must not satisfy a gate that unlocks the next module (D-07). The disabled state carries a hint: "Open the document to mark it complete."

---

# STU-06 · Video viewer — P4

```
← Back to module          Bernoulli Principle Explained         ✓ Required

┌──────────────────────────────────────────┐ ┌──────────────────────────┐
│                                          │ │ Video · 12:40            │
│            VIDEO SURFACE                 │ │ Watched 68%              │
│              (poster until play)         │ │                          │
│                                          │ │ [ ⭳ Download ]           │
│ ┌──────────────────────────────────────┐ │ │                          │
│ │ ▓▓▓▓▓▓▓▓▓░░▓▓▓░░░░░░░░░░░░░░░░░░░░░ │ │ │ ○ 90% required to        │
│ │ ▲ coverage (watched)  ▲ position     │ │ │   complete               │
│ │ ⏵ 08:31 / 12:40   ⚙ CC ⛶  1.0×      │ │ │   ↑ threshold stated     │
│ └──────────────────────────────────────┘ │ │     up front             │
└──────────────────────────────────────────┘ │                          │
                                             │ TRANSCRIPT               │
  ┌────────────────────────────────────┐     │ [scrollable placeholder] │
  │ Continue from 8:31?                │     └──────────────────────────┘
  │ [ Continue ]  [ Start over ]       │
  └────────────────────────────────────┘
```

**The progress bar renders two distinct tracks: coverage and position** (A-36). Scrubbing to the end moves position but not coverage, so it does not complete the video — otherwise one drag satisfies a D-07 gate.

**Accessibility:** keyboard seek via arrow keys (**2.5.7 Dragging Movements**) · controls ≥24px (**2.5.8**) · captions and transcript · no autoplay.

---

# STU-07 · Simulation access — one component, four formats

```
Home › … › Module 2 › Simulation

┌────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  FORMAT      Web simulation                                  │  │
│  │  DEVICE      Any modern browser                              │  │
│  │  ACCESS      ✓ Licensed                                      │  │
│  │  STATUS      Ready                                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  Before you start · attempt 1 · instructions…                      │
│  [ ▸ Launch Simulation ]                                           │
└────────────────────────────────────────────────────────────────────┘

VR variant ────────────────────────────────────────────────────────────
│  FORMAT   VR simulation      DEVICE  Meta Quest                     │
│  ACCESS   ✓ Licensed         STATUS  Not available on this device   │
│                                                                     │
│  ⓘ This module runs in the XR Simulation app on your Meta Quest.    │
│    B2B: use a lab headset and sign in with your LMS credentials.    │
│                                                                     │
│  ⚠ This module must be completed on a Meta Quest before             │
│    Module 3 unlocks.               ← D-07 ∧ D-09 consequence,       │
│                                      stated HERE, not at the gate   │
│  [ Continue on Meta Quest ]  [ View VR Setup Guide ]                │
│  ── A web version of this simulation is also available ──           │

MR variant → Ajna Lens · lab guidance · [Continue on Ajna Lens] [Instructions]
AR variant → Android/iOS · [QR block] · [Continue on Mobile] [Setup Guide]
```

**No disabled-looking launch button ever appears** (C-08). The CTA is always real and format-appropriate. Status reads "Not available on this device" — not "unavailable", which would imply the entitlement is broken.

---

# STU-09 · Assessment overview — mandatory disclosure

```
Home › … › Module 2 › Assessment

Module 2 Assessment                                                     H1

┌──────────────────────────────────────────┐ ┌──────────────────────────┐
│ BEFORE YOU BEGIN                         │ │ YOUR ATTEMPTS            │
│                                          │ │ Attempt 1  8/20  Failed  │
│  10   questions, multiple choice         │ │ Best score 8/20          │
│  20   minutes total for the whole        │ │ Attempts remaining ∞     │
│       assessment — distribute the time   │ └──────────────────────────┘
│       as you like                        │
│  +2   correct answer                     │  ← all five D-06
│  −1   incorrect answer                   │    disclosures, before
│   0   unanswered                         │    Begin is reachable
│  20   maximum score                      │
│  +1   correct answer after using a hint  │
│ 10/20 pass mark (50%)                    │
│                                          │
│ ⓘ A hint gives guidance, never the       │
│   answer. Using one lowers that          │
│   question's maximum from +2 to +1.      │
│                                          │
│ [ Begin attempt 2 ]  [ Review resources ]│
└──────────────────────────────────────────┘
```

"20 minutes **total**… distribute the time as you like" is stated explicitly because the natural misreading — two minutes per question — is exactly what D-06 exists to prevent.

---

# STU-10 · Assessment attempt — P4

```
┌──────────────────────────────────────────────────────────────────────┐
│ Module 2 Assessment          ⏱ 14:22 remaining        [ Submit ]     │  sticky
└──────────────────────────────────────────────────────────────────────┘
     ↑ sticky bar must never obscure focus (WCAG 2.2 · 2.4.11)

┌──────────────────────────────────────────┐ ┌──────────────────────────┐
│ Question 4 of 10                         │ │ QUESTIONS                │
│                                          │ │  ① ② ③ ④ ⑤              │
│ A venturi meter measures flow rate by…   │ │  ⑥ ⑦ ⑧ ⑨ ⑩              │
│                                          │ │                          │
│  ○  Option A                             │ │  ● answered              │
│  ●  Option B              ← selected     │ │  ○ unanswered            │
│  ○  Option C                             │ │  ◆ hint used             │
│  ○  Option D                             │ │  ▭ current               │
│                                          │ │  ↑ 4 shapes, not 4       │
│ ┌──────────────────────────────────────┐ │ │    colours (1.4.1)       │
│ │ 💡 Use a hint  (max becomes +1)      │ │ │                          │
│ └──────────────────────────────────────┘ │ │ Answered 3 of 10         │
│                                          │ └──────────────────────────┘
│ [ ◂ Previous ]              [ Next ▸ ]   │
└──────────────────────────────────────────┘     Saved ✓  ← autosave
```

**Hint confirmation dialog:** "Using a hint reduces this question's maximum score from +2 to +1. This cannot be undone for this attempt. [Cancel] [Use hint]" — the cost is silent and permanent, so it is confirmed (A-35).

**Timer announcements** are polite and threshold-based (5 min, 1 min), never per-second — **WCAG 4.1.3 Status Messages**. Options are a real radio group with arrow-key navigation. Navigator targets ≥24px (**2.5.8**).

---

# STU-11 · Submit confirmation — modal

```
   ┌────────────────────────────────────────────┐
   │  Submit your assessment?                   │
   │                                            │
   │  ⚠ 3 questions are unanswered.             │  ← brief §8 requirement
   │    Unanswered questions score 0.           │
   │                                            │
   │  Answered      7 of 10                     │
   │  Hints used    1                           │
   │  Time used     05:38                       │
   │                                            │
   │  [ Review unanswered ]  [ Submit ]         │
   └────────────────────────────────────────────┘
```

**Review unanswered** returns to the **first** unanswered question, not to question 1.

---

# STU-12 · Assessment result

```
┌──────────────────────────────────────────┐ ┌──────────────────────────┐
│              15 / 20                     │ │ ATTEMPT HISTORY          │
│              PASSED                      │ │ 2 · 15/20 · Passed       │
│              icon + text, not colour     │ │ 1 ·  8/20 · Failed       │
│                                          │ └──────────────────────────┘
│ Attempt 2 · Time used 12:41              │
│                                          │
│ 8 correct                       +16      │
│ 1 correct with hint             +1       │  ← hint impact made
│ 2 incorrect                     −2       │    concrete here
│ 0 unanswered                     0       │
│ ────────────────────────────────────     │
│ Total                            15      │
│                                          │
│ [ Continue to Module 3 ]                 │
└──────────────────────────────────────────┘

FAILED variant ────────────────────────────────────────────────────────
│      8 / 20   ·   NOT PASSED   ·   Pass mark 10/20                   │
│  Module 2 is not yet complete. Module 3 stays locked until you pass. │
│  [ Review learning resources ]   [ Retry assessment ]                │
│    ↑ deliberately FIRST — retrying without restudying is the         │
│      failure mode unlimited attempts invites                          │

AWAITING EVALUATION variant (descriptive questions, A-24) ─────────────
│  Submitted — awaiting evaluation.  No score yet.                     │
│  Module state PENDING, not failed — otherwise D-07 locks the         │
│  Student out indefinitely through no fault of their own.             │

TIME EXPIRED variant ──────────────────────────────────────────────────
│  Time ran out. Answered questions were submitted; 3 unanswered       │
│  questions scored 0.                                                 │
```

**Per-question review — correctness only (D-25).** The result lists every question as *number · Correct / Incorrect / Unanswered · hint marker*. It never shows the correct option, an answer key, or answer text — **especially on failed attempts**. Rows are **not expandable** and do **not** link back to the question (A-49): under unlimited attempts, exposing option text is the key by elimination.

**Score floor (D-23).** `reportedScore = max(rawScore, 0)`. A raw −4 renders as **0 / 20** with the true arithmetic still shown plus an explicit floor note — hiding the arithmetic would make the disclosed scoring rules unverifiable.

---

# B2C-01 · Explore — P2 · B2C only

```
Explore                                                                 H1

[ Topic ▾ ] [ Format ▾ ] [ Price ▾ ]              Sort: Relevance ▾   24 results

┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│ ┌───────────────┐ │ │                   │ │                   │
│ │  thumb 16:9   │ │ │                   │ │                   │
│ └───────────────┘ │ │                   │ │                   │
│ [Web]  MODULE     │ │ [VR]   MODULE     │ │ [Web] BUNDLE      │
│ Venturi Meter     │ │ Robotic Arm       │ │ Fluid Mechanics   │
│ Fluid Mechanics   │ │ Requires Quest ⓘ  │ │ 8 modules         │
│ ₹1,499            │ │ ₹2,499            │ │ ✓ In your learning│
└───────────────────┘ └───────────────────┘ └───────────────────┘
                            ↑ device requirement           ↑ owned:
                              on the CARD, not only          no price
                              the detail page                (A-37)
```

Filtering is **catalog navigation**, not the global search the IA rejected.

---

# B2C-02 · Product detail — P3

```
┌──────────────────────────────────────────┐ ┌──────────────────────────┐
│ [VR simulation]                          │ │ ₹2,499                   │
│ Robotic Arm Kinematics                H1 │ │ One-time purchase        │
│  MODULE product (D-21 — courses are      │ │ [access-duration slot —  │
│  not purchasable)                        │ │  renders only on data]   │
│                                          │ │ access                   │
│ ┌──────────────────────────────────────┐ │ │                          │
│ │ ⚠ REQUIRES A META QUEST HEADSET      │ │ │ [ Buy now ]              │
│ │   Not playable in a browser.         │ │ │                          │
│ └──────────────────────────────────────┘ │ │ Includes:                │
│   ↑ ABOVE the buy action, deliberately   │ │  · 1 VR simulation       │
│                                          │ │  · 3 resources           │
│ About · What you'll learn · Contents     │ │  · 1 assessment          │
└──────────────────────────────────────────┘ └──────────────────────────┘
```

**Device requirement sits above the purchase decision.** A buyer must not discover after paying that they need hardware they do not own — the single most costly error available on this screen.

---

# B2C-03 / 04 / 05 · Checkout → Processing → Result

```
CHECKOUT ────────────────────────────────────────────────────────────
│ Order summary          Robotic Arm Kinematics       ₹2,499         │
│ Taxes                  Calculated at checkout    ← A-37, Q-35      │
│ Total                                               ₹2,499         │
│ ⓘ You'll be redirected to our secure payment provider.             │
│   No card details are entered on this site.      ← C-05            │
│ [ Proceed to payment ]                                             │

PROCESSING ──────────────────────────────────────────────────────────
│              ◐  Completing your payment                            │
│              Please don't close this window.                       │
│              NO cancel. NO retry. ← both risk a double charge      │

RESULT · success ────────────────────────────────────────────────────
│  ✓ Payment successful · Access is now active                       │
│  [ Start Learning ]   [ View in My Learning ]                      │

RESULT · declined ───────────────────────────────────────────────────
│  Your payment was declined by your bank.  ← gateway reason only,   │
│  Nothing has been charged.                   never an internal     │
│  [ Try again ]  [ Use a different method ]   code (C-07)           │

RESULT · indeterminate ──────────────────────────────────────────────
│  ◐ We're confirming your payment.                                  │
│  This usually takes under a minute. We'll email you either way.    │
│  Claims NEITHER success NOR failure. Polls. NO immediate retry.    │
```

---

# STATE-01 · Access restricted — four variants

```
┌────────────────────────────────────────────────────────────┐
│                        🔒                                  │
│         Your institution's licence limit                   │
│                  has been reached                          │
│                                                            │
│   Your institution has used all available seats for this   │
│   module. Your administrator can request more.             │
│                                                            │
│   [ Contact your administrator ]  [ Back to My Learning ]  │
└────────────────────────────────────────────────────────────┘
```

| Variant | Message | Actions |
|---|---|---|
| 1 · Licence cap (6.2.2) | Institutional limit reached | Contact administrator · **no purchase prompt** — a B2B Student cannot buy past their institution's cap |
| 2 · No entitlements (7.2.3) | No modules assigned yet | B2B: contact administrator · B2C: Explore |
| 3 · Validation failed at launch (10.1.2) | "We couldn't verify access **just now**" — acknowledges that success was reasonable to expect | Try again · then support |
| 4 · Not provisioned | Signed in, but the institution hasn't enabled this account | Contact administrator |

**Module locked by sequence is deliberately NOT here.** It is a normal state handled in place on STU-03/STU-04, not a failure page.

---

## Wireframe coverage

| Group | Specified | Rendered in `lofi-wireframes.html` |
|---|---|---|
| AUTH (7) | AUTH-01, 06 in full; 02–05, 07 as P1 variants | AUTH-01, AUTH-06 |
| STU (14) | All 14 | STU-01, 02, 03, 04, 05, 06, 07, 09, 10, 11, 12, 13 |
| B2C (5) | All 5 | B2C-01, 02, 03, 05 |
| STATE (3) | All 3 | STATE-01 |

Screens not individually rendered are structural variants of a rendered pattern (P1–P4) and are fully specified above.
