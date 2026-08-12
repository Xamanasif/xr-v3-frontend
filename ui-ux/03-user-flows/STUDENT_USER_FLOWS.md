# Student User Flows — Phase 1, Desktop LMS

**Document status:** Revised (Review 002)
**Created:** 2026-08-10 (Review 001) · **Rewritten:** 2026-08-10 (Review 002)

---

## Conventions

| Notation | Meaning |
|---|---|
| `[XXX-nn]` | Screen ID — see `04-screen-inventory/STUDENT_SCREEN_INVENTORY.md` |
| `→` | Student-initiated · `⇢` system-initiated · `◆` decision point |
| **B2B** / **B2C** | Branch applies to that audience only (D-01) |
| `※ A-xx` | Depends on an unconfirmed assumption |
| `⚠ Q-xx` | Unresolved question — work continues around it |

**All four Review-001 blocking questions are closed.** Flows now resolve to concrete paths; B2B/B2C branches are real product differences (D-01), not unresolved ambiguity.

---

## Flow index

| # | Flow | Screens |
|---|---|---|
| 1 | Authentication — B2B SSO | AUTH-01, 02, 06 |
| 2 | Authentication — B2C email/social | AUTH-01, 03, 04, 05 |
| 3 | First-run profile setup | AUTH-07 |
| 4 | Home and resumption | STU-01 |
| 5 | My Learning → Course → Module | STU-02, 03, 04 |
| 6 | Learning resources — PDF | STU-05 |
| 7 | Learning resources — Video | STU-06 |
| 8 | Web simulation | STU-07, 08 |
| 9 | XR simulation continuation | STU-07 |
| 10 | Assessment attempt | STU-09, 10, 11 |
| 11 | Assessment result and retry | STU-12 |
| 12 | Module completion and unlock | STU-04 |
| 13 | Progress | STU-13 |
| 14 | Profile and account | STU-14 |
| 15 | B2C Explore → purchase | B2C-01 – 05 |
| 16 | B2B access restriction | STATE-01 |
| 17 | Session expiry | AUTH-06 |
| 18 | Locked module | STU-03, 04 |
| 19 | Network and content failure | STATE-02, 03 |
| 20 | Payment failure and retry | B2C-04, 05 |

---

## Flow 1 — Authentication · B2B institutional

**FRD** 4.2.2, 7.2.2, 10.2.1 · **D-03** SSO preferred for B2B

```
Student arrives at platform URL
  ⇢ [AUTH-01] Login
      Institutional email entry OR "Sign in with your institution"
      │
      ◆ Is SSO configured for this institution?  (D-03)
      │
      ├─ YES → PREFERRED PATH
      │    → "Continue with [Institution]"
      │    ⇢ [AUTH-02] SSO interstitial
      │    ⇢ redirect to identity provider (external)
      │    ⇢ returns authenticated
      │    ◆ Account provisioned by ERP? (FRD 7.2.2)
      │      ├─ Yes ⇢ Flow 3 (first login) or Flow 4 (returning)
      │      └─ No  ⇢ [STATE-01] "Your institution hasn't enabled access
      │                for this account yet" + admin contact  ※ A-27R
      │                NOT a login error — the credentials were correct
      │
      └─ NO / fallback where permitted (D-03)
           → email + password
           ◆ Valid?
             ├─ Yes ⇢ Flow 3 or Flow 4
             └─ No  ⇢ inline error, non-enumerating
                     → "Forgot password"  ⇢ [AUTH-05]  ※ A-29R
                        (unavailable for SSO-only accounts)

  NO SIGN-UP LINK IS SHOWN in the B2B context (D-01, D-04)
```

**Accessible authentication** — WCAG 2.2 **3.3.8 (AA)** forbids a cognitive function test with no alternative. No CAPTCHA, no puzzle, no memory challenge. Password fields permit paste and password-manager autofill. → §15 of the accessibility review.

**Cross-surface note.** FRD 2.4.4 requires institutional Students to sign into the **XR headset app with LMS credentials**. An SSO-only Student may have no password to type into a headset. Unresolved — **⚠ Q-14**; surfaced as guidance text on `[STU-07]` for VR/MR modules rather than silently ignored.

---

## Flow 2 — Authentication · B2C individual

**FRD** 4.1.1, 4.1.2 · **D-03** email/password + social

```
  ⇢ [AUTH-01] Login
      → email + password  ⇢ Flow 4
      → social provider   ⇢ external OAuth ⇢ Flow 3 or 4   ⚠ providers not enumerated
      → "Create an account"  ⇢ [AUTH-03] Sign up
           → email, password, name
           ◆ Email already registered?
             ├─ Yes ⇢ explicit collision state  ※ A-18R
             │        "This email is already registered. Sign in instead."
             │        Never silently creates a second identity (D-03)
             │        ⚠ Q-18 — if the existing account is INSTITUTIONAL,
             │              entitlements do NOT merge across environments
             │              (FRD 1.3.1/1.3.2). Implication documented in A-18R.
             └─ No  → submit
                    ⇢ [AUTH-04] Verify email
                    ⇢ verified ⇢ Flow 3
      → "Forgot password" ⇢ [AUTH-05]
```

WCAG 2.2 **3.3.7 Redundant Entry (A)** — information already supplied during sign-up is never re-requested in profile setup; it is pre-filled and editable.

---

## Flow 3 — First-run profile setup

**FRD** 4.3.1 · **D-10** minimum friction

```
First successful login
  ⇢ ◆ Profile complete?
      ├─ Yes ⇢ Flow 4
      └─ No  ⇢ [AUTH-07] Profile setup — ONE screen, minimal
          │
          ├─ B2B  ※ A-11
          │    Institution ......... prefilled, READ-ONLY (FRD 7.1.1)
          │    Stream / specialization prefilled, READ-ONLY (7.2.3)
          │      └─ read-only: sync (7.2.1) would overwrite edits, and
          │         stream determines entitlements
          │    Display name ........ editable
          │
          └─ B2C
               Name ................ prefilled from sign-up (WCAG 3.3.7)
               Institution ......... optional free entry
               Specialization ...... optional
          │
          Learning preferences → NOT collected here  ※ A-15R
            Moved to Account. Its only consumer (FRD 4.5.1) is Phase 2,
            so asking now adds friction against D-10 for no Phase-1 benefit.
          │
          → Continue ⇢ [STU-01] Home
```

---

## Flow 4 — Home and resumption

**D-10** · **D-07** · A-38

```
Authenticated ⇢ [STU-01] Home
  │
  ◆ Does the Student have an in-progress module?
  │
  ├─ YES ⇢ CONTINUE LEARNING — the primary target
  │    Shows: course · module · sequence position · next incomplete component
  │    → Continue  ⇢ jumps DIRECTLY to that component
  │                   (resource / simulation / assessment) — 1 click to content
  │    D-07 gating is what makes this target deterministic
  │
  ├─ NO, but entitlements exist ⇢ "Start Module 1 of [Course]"
  │
  └─ NO entitlements ⇢ empty state
       ├─ B2B: "No modules assigned yet" + contact institution  ※ A-27R
       └─ B2C: "Nothing here yet" + [Explore modules] ⇢ [B2C-01]

  Also on Home:
    Recent Learning ..... up to 3            → any ⇢ [STU-04]
    Current Progress .... compact             → ⇢ [STU-13]
    Needs Attention ..... ONLY when non-empty → ⇢ [STU-09]
        Populated by: failed assessment (Retry Required)
        Absent entirely for a Student in good standing — no zero-state noise
```

---

## Flow 5 — My Learning → Course → Module

**FRD** 8.1.5, 3.2.1, 3.1.1 · **D-07**

```
[STU-02] My Learning
  Sections: In progress · Not started · Standalone modules · Completed
  → select course ⇢ [STU-03] Course detail
       Overview: title · objective · module count · aggregate completion
       Modules:  ORDERED + GATED list (D-07)
       │
       ◆ Module state?  (see IA §9)
         ├─ Completed ........... → open, review
         ├─ In Progress ......... → continue
         ├─ Available ........... → start
         ├─ Assessment Required . → go to assessment
         ├─ Retry Required ...... → retry assessment
         └─ Locked .............. NOT selectable
              Row states: "Locked — complete Module 2 first"
              ⇢ Flow 18
  → select module ⇢ [STU-04] Module detail
       Overview + COMPLETION CHECKLIST (D-08) — see Flow 12
       Sections generated from actual content (FRD 3.1.2 "may include")
```

**B2C standalone modules — D-22.** Sequential gating applies **within a course context only**. A standalone purchased module is **immediately Available** with no previous-module prerequisite, but **retains D-20 internal gating** (resources → simulation → assessment). ⚠ Q-56: how a completed standalone later interacts with a separately acquired course entitlement is **deliberately undesigned**.

---

## Flow 6 — Learning resources · PDF

**D-05** · **D-08** · A-34

```
[STU-04] → Learning Resources → select PDF
  ⇢ [STU-05] PDF viewer
      Shows: title · type · size if known · required|optional · view state
      Actions: Open/view · Download (optional — never gates, D-08)
      │
      ◆ Completion  ※ A-34
        "Mark as complete" is DISABLED until the document has been opened
        → open → read → Mark as complete → ✓
        Download alone NEVER completes (D-08)
        Rationale: auto-complete-on-open would let a mis-click satisfy a
        gate that unlocks the next module (D-07)
      │
      ◆ Optional resource? → completion recorded but does not gate
      │
      Error: download fails ⇢ inline retry, viewer state preserved
             file unavailable ⇢ [STATE-02]
  → back ⇢ [STU-04] — checklist updates
```

---

## Flow 7 — Learning resources · Video

**D-05** · **D-08** ≈90% · A-36

```
[STU-04] → Learning Resources → select video
  ⇢ [STU-06] Video viewer
      Shows: title · duration · thumbnail · watched % · required|optional
      Controls: play/pause · seek · volume · speed · captions · fullscreen
      │
      ◆ Prior progress exists?
        └─ Yes → "Continue watching from 4:12"  +  "Start over"
                 (resume position persists — D-17)
      │
      ◆ Completion  ※ A-36
        ≈90% CUMULATIVE UNIQUE COVERAGE — not furthest playhead
        Scrubbing to the end does NOT complete the video
        Progress bar distinguishes WATCHED coverage from current position
        ⚠ Q-40 — tracking model; engineering dependency
      │
      Accessibility (D-11):
        captions/transcript placeholders · keyboard-operable controls ·
        no auto-play · no seizure-inducing content · 2.5.7 Dragging
        Movements — the seek bar has keyboard arrow equivalents
      │
      Error: video fails to load ⇢ inline error + retry; position preserved
  → back ⇢ [STU-04]
```

---

## Flow 8 — Web simulation

**FRD** 1.2.1, 2.2.2, 10.1.2, 12.2.1 · **D-09** · A-39

```
[STU-04] → Simulation ⇢ [STU-07] Simulation access — format WEB
    Format: Web · Device: Browser · Status: Ready
    Shows: instructions if present · browser requirement ⚠ Q-16 ·
           licence status · attempt number where counted
    → [Launch Simulation]
        ⇢ licence validation (FRD 2.2.2, 10.1.2)
        ◆ Valid?
          ├─ No  ⇢ [STATE-01] case 3 — validation failed AT LAUNCH.
          │        Wording acknowledges the Student had every reason to
          │        expect success. Retry once, then support.  ※ A-27R
          └─ Yes ↓
        ⇢ [STU-08] Web simulation runtime  ※ A-39
            Presentation NOT assumed (Correction H) — the design specifies
            the CONTRACT: full-width context · designed loading state ·
            explicit exit · preserved session
            │
            Asset loading via CDN (12.2.1) — designed loading state,
            not a bare spinner; payload unknown ⚠ Q-16
            │
            ◆ Loads? ├─ No ⇢ [STATE-02] + retry
                     └─ Yes ↓
            Student completes simulation
            ⇢ completion EVENT returned by the platform (D-08)  ※ A-40
            ◆ Event received?
              ├─ Yes ⇢ simulation ✓ on the checklist
              └─ No  ⇢ simulation remains incomplete + Retry
                       NO manual override — it would defeat the D-07 gate
                       ⚠ Q-42 — a Student blocked by telemetry failure has
                             no self-service recovery. Raised, not buried.
            → Exit ⇢ [STU-04]
                 ◆ Assessment present? → prompt to continue ⇢ Flow 10
```

---

## Flow 9 — XR simulation continuation

**FRD** 1.2.2–1.2.4, 2.1.1, 2.1.2, 2.4.3, 2.4.4 · **D-09**

Licensed XR modules are **never hidden** (D-09). The desktop never pretends it can launch them (C-08).

```
[STU-04] → Simulation ⇢ [STU-07] — format VR / MR / AR
  │
  ├─ VR · Meta Quest (FRD 1.2.2, 2.1.1)
  │    Format: VR   Device: Meta Quest   Status: Licensed
  │    Guidance: runs in the master VR application (2.1.1)
  │      B2B: shared institutional lab devices (2.4.3); sign in with LMS
  │           credentials (2.4.4)  ⚠ Q-14 if SSO-only
  │      B2C: licence bound to your device (2.4.1)  ※ A-14
  │    → [Continue on Meta Quest]   → [View VR Setup Guide]
  │
  ├─ MR · Ajna Lens (FRD 1.2.3, 2.1.2)
  │    Runs via a SIDELOADED app — not self-service
  │    Institutional lab / shared-device guidance
  │    → [Continue on Ajna Lens]    → [View Device Instructions]
  │
  └─ AR · Android / iOS (FRD 1.2.4)
       → [QR code] where technically supported   → [Continue on Mobile]
       → [Setup Guide]
       C-06: no deep-link behaviour is claimed beyond what exists

  ◆ A web version of the same simulation exists?  (D-09)
    └─ Yes → offered as an alternate supported experience,
             clearly labelled as an alternative, not a replacement

  COMPLETION CONSEQUENCE
  An XR module cannot be completed from the desktop, so under D-07 it
  will BLOCK the next module until completed on the device. This must be
  stated on [STU-07] — a Student must not discover it at the gate.
```

---

## Flow 10 — Assessment attempt

**D-06** · FRD 5.2.1–5.2.3, 5.3.1, 5.3.2, 11.2.2

```
[STU-04] → Assessment ⇢ [STU-09] Assessment overview
    MANDATORY PRE-ATTEMPT DISCLOSURE (D-06) — all five, before Begin:
      • 10 questions
      • 20 minutes total (distribute freely; NOT 2 min per question)
      • +2 correct · −1 incorrect · 0 unanswered · max 20
      • Hint available — a hint reduces a correct answer to +1
      • Pass mark 10/20 (50%) · unlimited attempts
    Also: attempt number · previous best score · attempt history
    → [Begin attempt]
    │
    ⇢ [STU-10] Assessment attempt
        Persistent: total timer · question n of 10 · answered/unanswered map
        Per question: stem · single-select options ※ A-23 · Hint · Prev/Next
        │
        ◆ Hint requested?  ※ A-35
          → confirmation: "Using a hint reduces this question's maximum
                           score from +2 to +1. Continue?"
             (irreversible for this question in this attempt; confirmed
              because the cost is silent and permanent)
          → hint shown — GUIDANCE ONLY, never the answer (D-06)
          → question is permanently marked "Hint used"
          One hint per question; a fresh attempt restores +2 eligibility
        │
        Autosave on every change and on navigation  ※ A-41
        Timer is SERVER-authoritative — reload does not reset it ⚠ Q-43
        │
        ◆ Timer expires?
          └─ ⇢ auto-submit: answered questions submitted, unanswered = 0 (D-06)
             ⇢ [STU-12] with an explicit "time expired" explanation
        │
        → [Submit] ⇢ [STU-11] Submission confirmation
             Shows UNANSWERED COUNT before final confirm (§8 of the brief)
             "3 questions unanswered — they will score 0."
             → Review  ⇢ back to [STU-10] at the first unanswered question
             → Confirm ⇢ [STU-12]

    Accessibility (D-11): options are a proper radio group with arrow-key
    navigation · timer announced politely at 5 min / 1 min, not every second ·
    2.5.8 target size ≥24px · 2.4.11 focus never obscured by the sticky timer
```

---

## Flow 11 — Assessment result and retry

**D-06** · **D-08**

```
⇢ [STU-12] Assessment result
    Score 15 / 20 · PASSED · Attempt 2 · Time used 12:41
    ◆ Raw score negative? (D-23)
      └─ reportedScore = max(rawScore, 0) — e.g. raw −4 shows as 0 / 20
         Negative marking still applied per answer; the TOTAL is floored
    Breakdown: 8 correct (+16) · 1 correct with hint (+1) · 2 incorrect (−2)
               ↑ the breakdown is where hint impact becomes concrete
    Attempt history (FRD 11.2.2)
    │
    ◆ Passed (≥10/20)?
      ├─ YES → module assessment ✓
      │        ◆ All other D-08 requirements met?
      │          ├─ Yes ⇢ MODULE COMPLETED → [Continue to Module 4]
      │          └─ No  → returns to checklist showing what remains
      │
      └─ NO  → "Score 8/20 · Pass mark 10/20"
               Module remains incomplete · next module REMAINS LOCKED (D-08)
               → [Retry assessment] ⇢ [STU-09]   (unlimited — D-06)
               → [Review learning resources] ⇢ [STU-04]
                  ↑ offered deliberately: retrying without restudying is
                    the failure mode unlimited attempts invites
    │
    ◆ Descriptive questions present? (FRD 5.2.3)  ※ A-24
      └─ ⇢ "Submitted — awaiting evaluation". No score.
           Module state = PENDING, not failed — otherwise D-07 would lock
           the Student out indefinitely through no fault of their own.
           ⚠ Q-24 — no Phase-1 grading workflow exists

    PER-QUESTION REVIEW — correctness only (D-25)
      Shown:      Q1 ✓ Correct · Q2 ✕ Incorrect · Q3 ○ Unanswered
                  Q7 ✓ Correct (hint used)
      NEVER shown: the correct option · an answer key · answer text
      Rows are NOT expandable and do NOT link back to the question ※ A-49 —
      under unlimited attempts, option text is the key by elimination.
      Applies ESPECIALLY to failed attempts.
```

---

## Flow 12 — Module completion and unlock

**D-07** · **D-08** · **D-20**

```
[STU-04] — components unlock IN SEQUENCE (D-20)

  ① REQUIRED LEARNING RESOURCES ......... always available
       → open each · PDF: open then mark complete (A-34)
                     Video: ≈90% coverage (A-36)
       ◆ All required complete?
         ├─ NO  → ② and ③ remain LOCKED
         │        ② shows: "Complete all required learning resources to
         │                  unlock the simulation. 1 remaining — <name>."
         │        ③ shows: "Complete the simulation to unlock the assessment."
         │        NEITHER renders an active action
         └─ YES ↓
  ② SIMULATION .......................... becomes AVAILABLE
       → launch (web) or complete on device (VR/MR/AR, D-19)
       ◆ Completion recorded for the ACCOUNT? (D-19)
         ├─ NO  → ③ remains LOCKED
         └─ YES ↓
  ③ ASSESSMENT .......................... becomes AVAILABLE
       ⇢ Flow 10 → Flow 11
       ◆ Passed (≥10/20)?
         ├─ NO  → module incomplete · next module LOCKED · retry
         └─ YES ⇢ MODULE COMPLETED ⇢ next module Locked → Available

  Optional resources sit outside the sequence entirely and never gate.
```



```
[STU-04] Module detail — completion checklist, always visible

    REQUIRED LEARNING
      ✓ Introduction to Fluid Dynamics (PDF)
      ✓ Bernoulli Principle (Video · 12:40)
      ○ Venturi Meter Setup (PDF)          ← outstanding
    OPTIONAL
      ○ Further Reading (PDF)               ← marked optional, never blocks
    SIMULATION
      ✓ Simulation completed
    ASSESSMENT
      ✓ Passed — 15/20

  ◆ All REQUIRED items complete? (D-08)
    ├─ NO  → module In Progress / Assessment Required / Retry Required
    │        Next module LOCKED
    └─ YES ⇢ MODULE COMPLETED
             ⇢ next module transitions Locked → Available
             → [Continue to Module 4]  ← the resumption target on Home

  The checklist is the single source of truth for D-08. A Student must
  never have to infer why a module is incomplete.
```

---

## Flow 13 — Progress

**FRD** 8.1.5, 11.1.1, 11.2.1, 11.2.2 · A-28R

```
Nav → Progress ⇢ [STU-13]
    Per course: modules completed / total · aggregate % · time spent
    Per module: state · assessment score · attempts
    Assessment history: every attempt, score, date, pass/fail

    NOT shown (C-04): charts · streaks · badges · ranking ·
    peer comparison (FRD 1.3.4 scopes analytics to the tenant) ·
    per-session or per-module time

    ◆ XR modules the desktop cannot run?
      └─ shown incomplete WITH format explanation — never as failure
    → select course ⇢ [STU-03]
```

---

## Flow 14 — Profile and account

**FRD** 4.3.1 · A-11, A-15R

```
Account ▾ → Profile ⇢ [STU-14]
    B2B: institution + stream READ-ONLY with "Managed by your institution"
         (A-11 — sync would overwrite edits; stream drives entitlements)
    B2C: all fields editable
    Learning preferences — optional, no personalization promise (A-15R)
Account ▾ → Help ......... consistent location — WCAG 2.2 3.2.6 (A)
Account ▾ → Sign out
```

---

## Flow 15 — B2C Explore and purchase

**D-04** · FRD 1.1.3, 6.1.1, 6.1.2, 9.1.1, 9.1.2, 9.2.1, 9.2.2 · A-37

**B2B Students never enter this flow** — Explore is absent from their navigation (D-04).

```
Nav → Explore ⇢ [B2C-01] Catalog
    Lists MODULES and BUNDLES only (FRD 6.1.1, 6.1.2 · D-21)
      Courses are NOT purchasable — no course CTA, price, checkout, or SKU.
      A Bundle may contain a course's modules but is never sold AS a course.
    Filter: topic · format (Web/VR/MR/AR) · price      Sort: relevance · price · newest
    Each card: title · format badge · price · owned indicator
    ◆ Already owned? → "In your learning" instead of a price (A-37, ⚠ Q-45)
  → select ⇢ [B2C-02] Product detail
       Title · description · format + DEVICE REQUIREMENT · module list if a
       bundle · duration · price · what's included
       ⚠ Q-19 — no academic-validation trust signal is shown, though FRD 1.4.2
             makes one available; a B2C buyer has little else to judge quality by
       ⚠ Format matters commercially here: a buyer must not purchase a VR module
             without understanding they need a headset. Device requirement is
             shown ABOVE the buy action, not below it.
  → [Buy] ⇢ [B2C-03] Checkout
       Order summary · price · "Taxes calculated at checkout" ※ A-37 ⚠ Q-35
       No cart (IA §4.3) · no coupon field (FRD 6.4 is Phase 2)
       No card fields in our UI — generic secure gateway redirect ※ A-37, C-05
  → [Proceed to payment]
       ⇢ [B2C-04] Payment processing — external gateway
       ◆ Outcome?
         ├─ SUCCESS ⇢ licence activated (9.2.1), entitlement assigned (9.2.2)
         │           ⇢ [B2C-05] "Access is active"  → [Start Learning] ⇢ [STU-04]
         ├─ FAILED  ⇢ [B2C-05] failure ⇢ Flow 20
         └─ ABANDONED ⇢ returns to [B2C-02], nothing charged, state preserved

  ⚠ Q-36 receipt/invoice · Q-37 refunds · Q-44 licence expiry · Q-45 bundle overlap
```

---

## Flow 16 — B2B access restriction

**FRD** 6.2.2, 7.2.3, 10.1.2 · **D-18** · A-27R

Four causes, four distinct messages. Every one is administrative state the Student cannot influence, so every one names who can.

```
16A · Institutional licence cap reached (FRD 6.2.2)
      ⇢ [STATE-01] "Your institution's licence limit has been reached."
        → Contact your institution administrator
        NO purchase prompt — a B2B Student cannot buy past their
        institution's cap (D-04)

16B · No entitlements assigned (FRD 7.2.3)
      ⇢ [STU-02] empty state — "No modules assigned yet"
        → Contact your institution administrator

16C · Licence validation failed at launch (FRD 10.1.2)
      ⇢ [STATE-01] — entered AFTER the Student pressed Launch.
        Wording acknowledges that success was reasonable to expect.
        → Retry once → then contact support

16D · Module locked by sequence (D-07)
      ⇢ handled in place on [STU-03]/[STU-04], NOT as a full-page error.
        "Complete Module 2 to unlock this module." → [Go to Module 2]
        This is a normal state, not a failure. ⇢ Flow 18

C-07: internal authorization codes are never exposed in any of these.
```

---

## Flow 17 — Session expiry

**FRD** 10.2.2 · **D-17**

```
Inactivity threshold approaching
  ⇢ WARNING before expiry (D-17)
      "Your session expires in 2 minutes." → [Stay signed in] → extended
  ⇢ expires
      ◆ What was in progress?
      ├─ Browsing ......... ⇢ [AUTH-06] → re-auth → SAME screen
      │
      ├─ ASSESSMENT ....... highest-risk case
      │     Answers autosaved ※ A-41 · timer server-authoritative ⚠ Q-43
      │     ATTEMPT IS NOT CONSUMED (D-17)
      │     ⇢ [AUTH-06] → re-auth → resume the SAME attempt with the
      │       remaining time, not a fresh 20 minutes
      │
      ├─ VIDEO ............ position persisted; resumes at the same second
      │
      └─ SIMULATION ....... state preserved where technically possible
            ⚠ "Inactivity" is ill-defined inside a simulation canvas that
              emits no LMS events — a passive timer could sign a Student
              out while they are most engaged. Engineering dependency.
```

---

## Flow 18 — Locked module

**D-07** · **D-18**

```
[STU-03] Course detail — locked module row
    "Module 3 · Pipe Friction and Head Loss   🔒 Locked"
    Sub-line names the blocker: "Complete Module 2 first"
    Row is not selectable; the reason is visible WITHOUT interaction —
    a Student should never have to click a locked thing to learn why

  ◆ Blocked because the previous module's assessment was FAILED?
    └─ distinct wording: "Module 2 assessment not yet passed (8/20)"
       → [Retry Module 2 assessment] ⇢ [STU-09]
       Retry Required is deliberately distinct from Locked — one is the
       Student's own module to fix, the other is about a different module

  Accessibility (D-11): lock is conveyed by icon + text + disabled
  semantics, never colour alone (1.4.1); disabled rows remain reachable
  by screen reader so the reason is announced
```

---

## Flow 19 — Network and content failure

**D-18** · FRD 12.2.1, 2.3.2, 7.2.1

```
19A Simulation assets fail (12.2.1) ⇢ [STATE-02] → Retry
19B Connection lost mid-simulation  → pause + surface; must NOT silently
                                       consume an attempt (11.2.2)
19C Connection lost mid-assessment  → answers preserved ※ A-41; resume
19D Video fails to load             → inline error; position preserved
19E PDF download fails              → inline retry; viewer state preserved
19F Content withdrawn (7.2.1 sync / 2.3.2 version) ⇢ shown IN PLACE with a
      neutral explanation ※ A-20 — never silently removed, which would
      read as data loss. ⚠ Lifecycle states incl. Archived are Phase 2 (1.5.1),
      so Phase 1 has no defined withdrawal behaviour at all.
19G Generic platform failure ⇢ [STATE-03]

Three distinct screens by cause: STATE-01 access denied · STATE-02 content
undeliverable · STATE-03 platform failure. Different causes, different
wording, different recovery — collapsing them would strand the Student.
```

---

## Flow 20 — Payment failure and retry

**D-04** · **D-18** · A-37

```
[B2C-04] Payment processing
  ◆ Outcome?
  ├─ Declined ......... ⇢ [B2C-05] failure
  │     "Your payment was declined by your bank." (gateway-reported reason
  │      only — never an internal code, C-07)
  │     → [Try again] ⇢ [B2C-03]   → [Use a different method]
  │     Nothing charged · no licence activated · order state preserved
  │
  ├─ Timeout / unknown ⇢ [B2C-05] indeterminate — the hardest case
  │     "We're confirming your payment." Does NOT claim success or failure.
  │     Polls; on resolution routes to success or failure.
  │     NEVER offers an immediate retry — that risks a double charge.
  │
  └─ Success .......... ⇢ licence active ⇢ [Start Learning]

⚠ Q-34 gateway · Q-36 receipt · Q-37 refund path
```

---

## Coverage

| Priority flow (brief §19) | Flow |
|---|---|
| 1 Authentication | 1, 2 |
| 2 Home | 4 |
| 3 My Learning | 5 |
| 4 Course | 5 |
| 5 Module | 5, 12 |
| 6 Learning resources | 6, 7 |
| 7 Simulation access | 8, 9 |
| 8 Assessment | 10 |
| 9 Result | 11 |
| 10 Progress | 13 |
| 11 B2B access states | 16 |
| 12 B2C Explore | 15 |
| 13 Product details | 15 |
| 14 Checkout | 15 |
| 15 Payment states | 15, 20 |

All 14 error/recovery situations required by brief §13 are covered across Flows 16, 17, 19, and 20.
