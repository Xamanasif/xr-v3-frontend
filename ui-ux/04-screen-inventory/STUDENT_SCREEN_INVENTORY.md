# Student Screen Inventory — Phase 1, Desktop LMS

**Document status:** Revised (Review 002)
**Created:** 2026-08-10 (Review 001) · **Rewritten:** 2026-08-10 (Review 002)
**Scope:** Phase-1 Student, LMS web, desktop-first at 1440px

---

## Summary

| Group | Count | IDs |
|---|---|---|
| Authentication & onboarding | 7 | AUTH-01 – AUTH-07 |
| Student core | 14 | STU-01 – STU-14 |
| B2C commerce | 5 | B2C-01 – B2C-05 |
| Full-page states | 3 | STATE-01 – STATE-03 |
| **Total** | **29** | |

**Change from Review 001:** 22 → 29. Five commerce screens added (D-04), Home added (D-10/D-07), PDF and video viewers split (D-05), password reset and email verification separated, and the three conditional Review-001 screens promoted to confirmed.

| Audience | Screens reachable |
|---|---|
| Shared core | 22 |
| B2C only | 6 (Explore, Product, Checkout, Payment ×2, Sign up) |
| B2B only | 1 (SSO interstitial) |

---

## High-fidelity rendering status — all 29 verified

Every inventory screen now has a dedicated high-fidelity representation in `07-high-fidelity/student-desktop-hifi.html`. Screens whose design point *is* a state are rendered in multiple states rather than a single frame.

| ID | Screen | Anchor | Frames rendered |
|---|---|---|---|
| AUTH-01 | Login | `#a01` | B2B · B2C |
| AUTH-02 | SSO interstitial | `#a02` | Redirecting |
| AUTH-03 | Sign up | `#a03` | Default · **email collision** |
| AUTH-04 | Email verification | `#a04` | Awaiting · link expired |
| AUTH-05 | Password reset | `#a05` | Request · sent (non-enumerating) · set new |
| AUTH-06 | Session expired | `#a06` | 2-min warning toast · expired during assessment |
| AUTH-07 | Profile setup | `#a07` | B2B read-only · B2C editable |
| STU-01 | Home | `#s01` | Full |
| STU-02 | My Learning | `#s02` | Full |
| STU-03 | Course detail | `#s03` | Full, with gated module list |
| STU-04 | Module detail | `#s04` | **State A — sim + assessment locked** · **State B — sim available** |
| STU-05 | PDF viewer | `#s05` | Not opened (disabled) · opened (enabled) |
| STU-06 | Video viewer | `#s06` | Full, coverage vs position |
| STU-07 | Simulation access | `#s07` | Web · VR · MR · AR |
| STU-08 | Simulation runtime | `#s08` | Loading (determinate) · exit confirmation |
| STU-09 | Assessment overview | `#s09` | Full disclosure |
| STU-10 | Assessment attempt | `#s10` | Full |
| STU-11 | Submit confirmation | `#s11` | Confirm w/ unanswered · **submission failed** |
| STU-12 | Assessment result | `#s12` | Passed + review · not passed + review · **floored at 0** · awaiting evaluation |
| STU-13 | Progress | `#s13` | Full |
| STU-14 | Profile & account | `#s14` | Full |
| B2C-01 | Explore | `#b01` | Full |
| B2C-02 | Product detail | `#b02` | Full |
| B2C-03 | Checkout | `#b03` | Full |
| B2C-04 | Payment processing | `#b04` | Full |
| B2C-05 | Payment result | `#b05` | Success · declined · **indeterminate** |
| STATE-01 | Access restricted | `#e01` | Licence cap (+3 variants documented) |
| STATE-02 | Content unavailable | `#e02` | Delivery failure · withdrawn |
| STATE-03 | System error | `#e03` | Full |

**29 / 29 rendered.** 51 distinct frames across the 29 screens.

---

## ⚠️ Review-004 update — D-20 module-internal gating

Components within a module now unlock **in sequence**:

```
Required learning resources → Simulation → Assessment → Pass → Module complete → Next module
```

Affected screens:

| Screen | Change |
|---|---|
| **STU-04** | Simulation and Assessment render as **locked states naming their prerequisite**, not live actions. "Go to assessment" must not be active while required learning or simulation is outstanding. |
| **STU-05 / STU-06** | Completing the last required resource is what unlocks the simulation — stated on the completion control |
| **STU-07** | Reachable only once required resources are complete |
| **STU-09** | Reachable only once the simulation is complete |
| **STU-01** | Continue Learning targets the next component **in gate order** |

Other Review-004 corrections applied throughout: **Download is unconditional** on PDF and video (D-05 amendment) · **"lifetime access" removed** — copy reads "One-time purchase" only (A-47) · prices and social providers labelled **sample** (A-44, A-45) · score display is **sign-neutral** pending Q-54 (A-46).

---

## ⚠️ Review-005 update — D-21 to D-25

| Decision | Screens affected | Change |
|---|---|---|
| **D-21** product types | **B2C-01, B2C-02, B2C-03** | Explore sells **Modules and Bundles only**. No course CTA, price, checkout, or SKU anywhere. Bundle copy describes contents ("Bundle of 8 modules"), never "course". |
| **D-22** standalone gating | **STU-02, STU-03, STU-04** | A standalone purchased module is **immediately Available** — no previous-module prerequisite — but **retains D-20 internal gating** |
| **D-23** score floor | **STU-09, STU-12** | Pre-attempt disclosure adds *"Negative marking applies. Your final reported score cannot be lower than 0."* Result renders `max(rawScore, 0)`; a **fourth result frame** shows raw −4 → reported 0/20 with the true arithmetic still visible |
| **D-24** access duration | **B2C-02, B2C-05, STU-02** | Conditional **access-duration slot** that renders only on authoritative data (A-48); collapses entirely when absent. "Lifetime/permanent/perpetual" prohibited |
| **D-25** answer review | **STU-12** | **New per-question review list** — number · Correct/Incorrect/Unanswered · hint marker. Rows **not expandable**, **no link back**, **no answer key** (A-49). Present on passed *and* failed frames |

**STU-12 now renders four frames:** passed (with review) · not passed (with review + explicit no-key notice) · **score floored at 0** · awaiting evaluation.

---

## Legend

**✅ Confirmed** — traceable to FRD text or a confirmed decision (D-xx) · **※ Assumed** — rests on an unconfirmed assumption · **⚠ Open** — shaped by an open question

---

# Authentication & onboarding

## AUTH-01 · Login

| Field | Detail |
|---|---|
| **Purpose** | Authenticate a Student by either supported path |
| **FRD / decision** | 10.2.1, 4.1.1, 4.1.2, 4.2.2 · **D-03** |
| **Primary goal** | Get in |
| **Entry** | Platform URL · session expiry · sign-out |
| **Primary action** | Sign in |
| **Secondary** | Continue with institution (SSO) · social login (B2C) · Forgot password · Create account (B2C only) |
| **Required info** | Product identity · credential fields · SSO entry · error messaging |
| **Components** | Logo lockup · email + password inputs · SSO button · social buttons · submit · secondary links |
| **Loading** | Submit pending · SSO redirect pending |
| **Empty** | n/a |
| **Error** | Invalid credentials (inline, non-enumerating) · account not provisioned → STATE-01 · IdP unavailable |
| **Restricted** | n/a |
| **Previous / Next** | — / AUTH-02, AUTH-03, AUTH-05, AUTH-07, STU-01 |
| **Confirmed vs assumed** | ✅ Structure now resolved by **D-03** — both paths on one screen. **No sign-up link in the B2B context** (D-01). WCAG 2.2 **3.3.8** — no cognitive-function test; paste and password managers permitted. |

## AUTH-02 · SSO interstitial *(B2B)*

| Field | Detail |
|---|---|
| **Purpose** | Hand off to and return from the institutional identity provider |
| **FRD / decision** | 4.2.2 · **D-03** (resolves the 4.2.2 / 7.4.1 phase contradiction) |
| **Primary goal** | Authenticate via the institution |
| **Entry** | AUTH-01, SSO path |
| **Primary action** | Continue to provider (usually automatic) |
| **Secondary** | Cancel → AUTH-01 |
| **Required info** | Which institution · that they are leaving the site |
| **Components** | Institution identity · status · cancel |
| **Loading** | Redirect · return handshake |
| **Error** | IdP unreachable · authentication rejected · **authenticated but not ERP-provisioned → STATE-01** (not a login error) |
| **Restricted** | Authenticated with no LMS entitlement → STATE-01 |
| **Previous / Next** | AUTH-01 / AUTH-07, STU-01, STATE-01 |
| **Confirmed vs assumed** | ✅ Confirmed by D-03 |

## AUTH-03 · Sign up *(B2C)*

| Field | Detail |
|---|---|
| **Purpose** | Create an individual learner account |
| **FRD / decision** | 4.1.1, 4.1.2 · **D-01**, **D-03** |
| **Primary goal** | Create an account |
| **Entry** | AUTH-01 · B2C-02 (buy while signed out) |
| **Primary action** | Create account |
| **Secondary** | Social sign-up · back to sign in |
| **Required info** | Name, email, password, verification expectation |
| **Components** | Form · social options · password strength · submit |
| **Loading** | Submission · verification dispatch |
| **Error** | **Email already registered → explicit collision state** ※ A-18R · weak password ⚠ Q-29 |
| **Restricted** | Not offered in the B2B context |
| **Previous / Next** | AUTH-01, B2C-02 / AUTH-04 |
| **Confirmed vs assumed** | ✅ Existence confirmed. **⚠ Q-18** — if the colliding account is institutional, entitlements do **not** merge across environments (FRD 1.3.1/1.3.2); implication documented in A-18R per D-03. |

## AUTH-04 · Email verification *(B2C)*

| Field | Detail |
|---|---|
| **Purpose** | Confirm email ownership before access |
| **FRD / decision** | 4.1.1, 10.2.1 |
| **Primary goal** | Verify and proceed |
| **Entry** | AUTH-03 |
| **Primary action** | Open the emailed link |
| **Secondary** | Resend · change email address |
| **Required info** | Which address · what to do · resend affordance |
| **Components** | Confirmation panel · resend (rate-limited) · support link |
| **Loading** | Resend · verification |
| **Error** | Expired or used token · resend limit reached |
| **Previous / Next** | AUTH-03 / AUTH-07 |
| **Confirmed vs assumed** | ✅ Implied by 4.1.1 + 10.2.1. ⚠ The FRD never specifies a verification requirement explicitly — flagged, and the screen kept minimal. |

## AUTH-05 · Password reset

| Field | Detail |
|---|---|
| **Purpose** | Recover access |
| **FRD / decision** | **None** — design-supplied ※ **A-29R** |
| **Primary goal** | Regain access |
| **Entry** | AUTH-01 |
| **Primary action** | Send reset link · then set new password |
| **Secondary** | Back to sign in |
| **Required info** | Email entry · confirmation · new-password form |
| **Loading** | Request · submission |
| **Error** | Expired/used token · non-enumerating response for unknown email |
| **Restricted** | **Unavailable for SSO-only accounts** — recovery belongs to the IdP |
| **Previous / Next** | AUTH-01 / AUTH-01 |
| **Confirmed vs assumed** | **※ Wholly design-supplied.** The FRD mandates password auth (4.1.1, 10.2.1) but **never mentions reset anywhere**. Without it a Student who forgets a password is permanently locked out. Labelled, not smuggled in. |

## AUTH-06 · Session expired / re-authentication

| Field | Detail |
|---|---|
| **Purpose** | Handle inactivity expiry without destroying work or context |
| **FRD / decision** | 10.2.2 · **D-17** |
| **Primary goal** | Resume exactly where they were |
| **Entry** | Any authenticated screen |
| **Primary action** | Re-authenticate |
| **Secondary** | Sign out fully |
| **Required info** | That the session expired · **that work is preserved** · where they will return |
| **Components** | Pre-expiry warning · expiry notice · credential/SSO re-entry · context indicator |
| **Loading** | Re-auth · context restoration |
| **Error** | Re-auth fails → AUTH-01 · work could not be preserved |
| **Previous / Next** | Any / the originating screen |
| **Confirmed vs assumed** | ✅ **Fully confirmed by D-17.** Warning before expiry, autosaved answers, persisted resource progress, return to the same context, and **an assessment attempt is never consumed by an auth timeout**. ⚠ Q-43 — server-authoritative timer is an engineering dependency. |

## AUTH-07 · Profile setup *(first run)*

| Field | Detail |
|---|---|
| **Purpose** | Collect FRD 4.3.1 profile information with minimum friction |
| **FRD / decision** | 4.3.1, 7.1.1 · **D-10** |
| **Primary goal** | Finish setup and reach learning |
| **Entry** | First login via AUTH-01/02/03 |
| **Primary action** | Continue |
| **Secondary** | Skip optional fields |
| **Required info** | Institution · specialization/stream · display name |
| **Components** | Field groups · read-only treatment with provenance note (B2B) · continue |
| **Loading** | ERP prefill (7.1.1) · save |
| **Empty** | ERP prefill unavailable ⚠ Q-11 |
| **Error** | Save failure · validation |
| **Restricted** | **B2B: institution and stream read-only** ※ A-11 |
| **Previous / Next** | AUTH-01/02/03 / STU-01 |
| **Confirmed vs assumed** | ✅ Fields from 4.3.1. **※ A-15R moves learning preferences OUT of first run** to Account — its only consumer (4.5.1) is Phase 2, so asking here costs friction against D-10 for no Phase-1 benefit. WCAG 2.2 **3.3.7 Redundant Entry** — sign-up data is pre-filled, never re-requested. |

---

# Student core

## STU-01 · Home

| Field | Detail |
|---|---|
| **Purpose** | Return the Student to learning in one click |
| **FRD / decision** | 8.1.5, 9.2.2 · **D-10**, **D-07** |
| **Primary goal** | **Continue learning with minimum friction** |
| **Entry** | Post-login default · logo · nav |
| **Primary action** | **Continue Learning** — one deterministic target |
| **Secondary** | Open a recent item · view progress · Explore (B2C) |
| **Required info** | Current module + next incomplete component · up to 3 recent items · compact course-level progress · Needs Attention when non-empty |
| **Components** | Continue Learning panel · recent list · compact progress · conditional attention block |
| **Loading** | Entitlement + progress retrieval |
| **Empty** | **B2B:** "No modules assigned yet" + contact institution · **B2C:** "Nothing here yet" + Explore CTA |
| **Error** | Retrieval failure → STATE-03 |
| **Restricted** | No active licence → STATE-01 |
| **Previous / Next** | AUTH-01/07 / STU-02, STU-04, STU-13, B2C-01 |
| **Confirmed vs assumed** | ✅ Admitted by the Review-002 IA after evaluating both options. **The 1-click resumption target exists only because D-07's gating makes "the next thing" deterministic.** ※ A-38 governs content and forbids charts, streaks, badges, ranking, and metric tiles (C-04). |

## STU-02 · My Learning

| Field | Detail |
|---|---|
| **Purpose** | The complete set of entitled content |
| **FRD / decision** | 8.1.5, 7.2.3, 6.2.1, 9.2.2, 3.2.1 |
| **Primary goal** | Find and open any entitled course or module |
| **Entry** | Nav · Home · B2C-05 |
| **Primary action** | Open a course or standalone module |
| **Secondary** | Filter by state · Explore (B2C) |
| **Required info** | Courses and standalone modules · titles · **format badges** · completion state · module counts |
| **Components** | Sectioned list — In progress · Not started · Standalone · Completed · course cards · module cards |
| **Loading** | Entitlement retrieval |
| **Empty** | Three causes, three messages ※ A-27R — B2B zero-stream · B2B licence cap → STATE-01 · B2C nothing purchased + Explore CTA |
| **Error** | Retrieval failure → STATE-03 |
| **Restricted** | Entitlement withdrawn between sessions (7.2.1) ※ A-20 |
| **Previous / Next** | STU-01 / STU-03, STU-04 |
| **Confirmed vs assumed** | ✅ Strongly confirmed. Courses and modules are **visually distinguishable card types**, not one card with a label (brief §6). |

## STU-03 · Course detail

| Field | Detail |
|---|---|
| **Purpose** | Present a course and its gated module sequence |
| **FRD / decision** | 3.2.1, 3.2.2 · **D-07** |
| **Primary goal** | Reach the right module |
| **Entry** | STU-02 · STU-13 |
| **Primary action** | Open the current available module |
| **Secondary** | Open a completed module · view course progress |
| **Required info** | Title · topic/objective · **ordered gated module list** · per-module state and format badge · aggregate completion · course-level time spent |
| **Components** | Breadcrumb · course header · Overview / Modules · **module row with state** |
| **Loading** | Course + module retrieval |
| **Empty** | Course with zero modules (possible after 7.2.1 sync) ※ A-20 |
| **Error** | → STATE-02 |
| **Restricted** | **Locked module rows** — reason visible without interaction (D-07) |
| **Previous / Next** | STU-02, STU-13 / STU-04 |
| **Confirmed vs assumed** | ✅ **D-07 resolves the FRD 3.2.2 ambiguity: sequencing is enforced.** Six module states per IA §9, each conveyed by icon + text, never colour alone (WCAG 1.4.1). |

## STU-04 · Module detail

| Field | Detail |
|---|---|
| **Purpose** | The hub for one learning unit and the home of the completion checklist |
| **FRD / decision** | 3.1.1, 3.1.2, 1.4.3, 11.1.1 · **D-08** |
| **Primary goal** | Complete the module |
| **Entry** | STU-03 · STU-02 (standalone) · STU-01 |
| **Primary action** | Continue the next incomplete component |
| **Secondary** | Open any completed component · back to course |
| **Required info** | Title · description · **format + device requirement** · metadata (1.4.3) · **completion checklist** · attempt count |
| **Components** | Breadcrumb · header with format badge · **completion checklist (D-08)** · content-generated sections · primary action |
| **Loading** | Module + component retrieval |
| **Empty** | Module with no resources and no assessment — **legitimate** per 3.1.2 |
| **Error** | → STATE-02 · withdrawn after version change (2.3.2) ※ A-20 |
| **Restricted** | Not licensed → STATE-01 · **module locked → in-place lock state, not a full-page error** |
| **Previous / Next** | STU-03, STU-02, STU-01 / STU-05, 06, 07, 09 |
| **Confirmed vs assumed** | ✅ Strongly confirmed. **The checklist is the single source of truth for D-08** — a Student must never infer why a module is incomplete. Sections are **generated from actual content**; a simulation-only module renders as one section, not empty tabs. Required vs optional resources are visually distinct, and **optional never blocks**. |

## STU-05 · Resource viewer — PDF

| Field | Detail |
|---|---|
| **Purpose** | Deliver PDF learning notes |
| **FRD / decision** | 3.1.2 · **D-05**, **D-08** |
| **Primary goal** | **Access learning resources** — the primary goal (D-10) |
| **Entry** | STU-04 |
| **Primary action** | Open / view |
| **Secondary** | Download · **Mark as complete** · back to module |
| **Required info** | Title · file type · size where known · **required or optional** · view state |
| **Components** | Document viewer · toolbar · download · mark-complete control · required/optional badge |
| **Loading** | Document retrieval |
| **Empty** | n/a |
| **Error** | Download failure → inline retry, viewer state preserved · file unavailable → STATE-02 |
| **Restricted** | Inherits module entitlement → STATE-01 |
| **Previous / Next** | STU-04 / STU-04, STU-06, STU-07 |
| **Confirmed vs assumed** | ✅ Format confirmed by **D-05**. **※ A-34: Mark as complete is disabled until the document is opened.** D-08 delegates this rule; auto-complete-on-open would let a mis-click satisfy a gate that unlocks the next module (D-07). **Download never completes** (D-08). |

## STU-06 · Resource viewer — Video

| Field | Detail |
|---|---|
| **Purpose** | Deliver instructional video |
| **FRD / decision** | 3.1.2 · **D-05**, **D-08** |
| **Primary goal** | Access learning resources |
| **Entry** | STU-04 |
| **Primary action** | Play / continue watching |
| **Secondary** | **Download** · captions · speed · transcript · back to module |
| **Required info** | Title · **duration** · thumbnail · **watched progress** · required or optional · **Download always offered** (D-05 amendment) |
| **Components** | Player · **coverage-aware progress bar** · play/pause · seek · volume · speed · captions · fullscreen · resume prompt · download · transcript panel |
| **Loading** | Manifest + buffering — poster shown, not a blank frame |
| **Empty** | n/a |
| **Error** | Load failure → inline error + retry, **position preserved** · download failure → inline retry |
| **Restricted** | Inherits module entitlement |
| **Previous / Next** | STU-04 / STU-04, STU-05, STU-07 |
| **Confirmed vs assumed** | ✅ **D-05** confirms video and its UX set (duration, play/pause, progress, resume, download). **D-08** sets ≈90% completion. **※ A-36: measured as cumulative unique coverage, not furthest playhead** — otherwise one drag of the scrubber satisfies a D-07 gate. ⚠ Q-40, engineering dependency. Accessibility: captions/transcript placeholders, keyboard-operable controls, **2.5.7 Dragging Movements** — seek has arrow-key equivalents. |

## STU-07 · Simulation access

| Field | Detail |
|---|---|
| **Purpose** | One consistent component for all four simulation formats |
| **FRD / decision** | 1.2.1–1.2.4, 2.1.1, 2.1.2, 2.4.3, 2.4.4, 2.2.2, 10.1.2 · **D-09** |
| **Primary goal** | Reach the simulation on whatever device runs it |
| **Entry** | STU-04 |
| **Primary action** | **Web:** Launch Simulation · **VR:** Continue on Meta Quest · **MR:** Continue on Ajna Lens · **AR:** Continue on Mobile |
| **Secondary** | Setup guide / device instructions · QR code (AR) · alternate web version where one exists |
| **Required info** | **Format · supported device · licence/access status · current availability** (brief §12) · instructions where present |
| **Components** | Format badge · device requirement · status · CTA set · guidance panel · QR block (AR) |
| **Loading** | Licence validation (2.2.2, 10.1.2) |
| **Empty** | n/a |
| **Error** | Validation service unreachable → STATE-02 |
| **Restricted** | **Validation fails after the Student pressed Launch** → STATE-01 case 3 |
| **Previous / Next** | STU-04 / STU-08, STATE-01, STATE-02 |
| **Confirmed vs assumed** | ✅ **D-09 fully confirms this screen.** Licensed XR modules are never hidden; the desktop never claims it can launch what it cannot (C-08); no deep-link behaviour is invented (C-06). **Must state the D-07 consequence:** an XR module that cannot be completed on desktop will block the next module — the Student must learn this here, not at the gate. ⚠ Q-14 — under SSO an institutional Student may have no password for a headset (2.4.4). |

## STU-08 · Web simulation runtime

| Field | Detail |
|---|---|
| **Purpose** | Run the browser-based simulation |
| **FRD / decision** | 1.2.1, 3.1.1, 12.2.1 · **A-39** |
| **Primary goal** | Complete the simulation |
| **Entry** | STU-07 |
| **Primary action** | Interact with the simulation |
| **Secondary** | Exit and return to the module |
| **Required info** | The simulation · exit affordance · session status |
| **Components** | Full-width runtime context · exit control · designed loading state |
| **Loading** | **CDN asset delivery (12.2.1) — a designed loading state, not a bare spinner** |
| **Empty** | n/a |
| **Error** | Assets fail → STATE-02 · connection lost mid-session → **must not silently consume an attempt** · unsupported browser/viewport ⚠ Q-16 · **completion event never arrives** ※ A-40 |
| **Restricted** | Entitlement revoked mid-session → STATE-01 |
| **Previous / Next** | STU-07 / STU-04, STU-09, STATE-02 |
| **Confirmed vs assumed** | ✅ Required by 1.2.1 — the only format a desktop Student can execute. **※ A-39: presentation is NOT assumed** (Correction H). The design specifies the *contract* — full-width context, designed loading, explicit exit, preserved session — leaving embedded vs full-page vs separate route to engineering. **※ A-40: no manual completion override**, because it would defeat the D-07 gate — but this leaves a Student stranded on telemetry failure (⚠ Q-42). |

## STU-09 · Assessment overview

| Field | Detail |
|---|---|
| **Purpose** | Deliver the mandatory pre-attempt disclosure |
| **FRD / decision** | 3.1.2, 5.3.2, 11.2.1, 11.2.2 · **D-06** |
| **Primary goal** | Start the assessment knowing every rule |
| **Entry** | STU-04 · STU-08 · STU-12 (retry) · STU-01 (Needs Attention) |
| **Primary action** | Begin attempt |
| **Secondary** | Review learning resources · back to module |
| **Required info** | **All five mandatory disclosures (D-06):** 10 questions · 20-minute total budget · +2 / −1 / 0, max 20 · hint reduces a correct answer to +1 · pass mark 10/20 · plus unlimited attempts, attempt number, previous best, attempt history |
| **Components** | Assessment header · **rules panel** · attempt history table · begin |
| **Loading** | Assessment retrieval |
| **Empty** | n/a |
| **Error** | Assessment unavailable → STATE-02 |
| **Restricted** | Module locked → cannot be reached |
| **Previous / Next** | STU-04, STU-08, STU-12 / STU-10 |
| **Confirmed vs assumed** | ✅ **Fully confirmed by D-06**, which makes disclosure mandatory *before* the attempt. The timer is explicitly framed as a **total budget freely distributed**, not two minutes per question — the FRD-adjacent misreading D-06 exists to prevent. |

## STU-10 · Assessment attempt

| Field | Detail |
|---|---|
| **Purpose** | Present questions, capture answers, manage time and hints |
| **FRD / decision** | 5.2.1–5.2.3, 5.3.1, 5.3.2 · **D-06**, **D-17** |
| **Primary goal** | Answer and submit |
| **Secondary** | Navigate questions · change answers · request a hint |
| **Primary action** | Submit assessment |
| **Required info** | Question stem · options · **persistent total timer** · current question number · **answered/unanswered map** · hint availability and used-state |
| **Components** | Sticky timer · question navigator (answered / unanswered / hinted) · single-select radio group ※ A-23 · **hint control + confirmation** · prev/next · submit |
| **Loading** | Question retrieval · autosave indicator |
| **Empty** | n/a |
| **Error** | Connection lost — **answers preserved, attempt not consumed** ※ A-41 · submission failure |
| **Restricted** | Session expires → AUTH-06 → **resume the same attempt with remaining time** (D-17) |
| **Previous / Next** | STU-09 / STU-11 |
| **Confirmed vs assumed** | ✅ Question types from 5.2.1–5.2.3; timer, scoring, and hints from **D-06**. **※ A-35: one hint per question, confirmed before applying, irreversible for that attempt**, restored on a fresh attempt — the cost is silent and permanent, so confirmation is required. **Hints give guidance only, never the answer** (D-06). **※ A-41 + ⚠ Q-43: timer must be server-authoritative**, or reloading resets the 20 minutes. Accessibility: proper radio group with arrow-key navigation, timer announced politely at 5 min and 1 min rather than continuously (**4.1.3 Status Messages**), **2.4.11 focus never obscured by the sticky timer**, targets ≥24px (**2.5.8**). |

## STU-11 · Submission confirmation

| Field | Detail |
|---|---|
| **Purpose** | Prevent accidental submission of an incomplete attempt |
| **FRD / decision** | 11.2.2 · brief §8 |
| **Primary goal** | Submit deliberately |
| **Entry** | STU-10 |
| **Primary action** | Confirm submission |
| **Secondary** | Return to the attempt — lands on the **first unanswered question** |
| **Required info** | **Unanswered count** · that unanswered scores 0 · that submission is final |
| **Components** | Summary · unanswered warning · confirm · cancel |
| **Loading** | Submission |
| **Error** | Submission failure — **must not lose answers** |
| **Previous / Next** | STU-10 / STU-12 |
| **Confirmed vs assumed** | ✅ Required by brief §8 ("show unanswered count before final confirmation"). Reviewed as a modal over STU-10 rather than a separate route, preserving attempt context. |

## STU-12 · Assessment result

| Field | Detail |
|---|---|
| **Purpose** | Report the outcome and route to the correct next action |
| **FRD / decision** | 11.2.1, 11.2.2 · **D-06**, **D-08** |
| **Primary goal** | Find out whether they passed and what to do next |
| **Entry** | STU-11 · timer expiry (auto-submit) |
| **Primary action** | **Passed:** Continue · **Failed:** Retry assessment |
| **Secondary** | Review learning resources · view progress · back to module |
| **Required info** | **Final score · pass/fail · attempt number · time used** (brief §8) · score breakdown including hint impact · attempt history |
| **Components** | Result header · score breakdown · attempt history · action set |
| **Loading** | Result retrieval |
| **Empty** | **"Submitted — awaiting evaluation"** for descriptive assessments ※ A-24 |
| **Error** | Result unavailable → STATE-02 |
| **Previous / Next** | STU-11 / STU-04, STU-09, STU-13 |
| **Confirmed vs assumed** | ✅ **D-06 confirms the verdict**: pass at ≥10/20. **D-08**: failure leaves the module incomplete and the next module **locked**. Breakdown shows hint impact concretely (e.g. "1 correct with hint +1"). **※ A-10: no per-question review** — unlimited attempts (D-06) plus full review would make the pass mark trivially gameable; ⚠ Q-10 records a middle option (which questions were wrong, without the answers). **※ A-24:** a descriptive assessment yields a **pending** module state, not failed — otherwise D-07 would lock the Student out indefinitely. On timer expiry the screen explains that time ran out and that unanswered questions scored 0. |

## STU-13 · Progress

| Field | Detail |
|---|---|
| **Purpose** | The Student's view of their own learning progress |
| **FRD / decision** | **8.1.5**, 11.1.1, 11.1.2, 11.2.1, 11.2.2 |
| **Primary goal** | See how far they have got and what remains |
| **Entry** | Nav · STU-01 · STU-12 |
| **Primary action** | Jump to a course or module |
| **Secondary** | Expand assessment history |
| **Required info** | Per-course completion · per-module state · assessment scores · **attempt history** · course-level time spent |
| **Components** | Course progress list · module state rows · assessment history table |
| **Loading** | Progress retrieval |
| **Empty** | No activity yet — distinct from having no entitlements |
| **Error** | → STATE-03 |
| **Previous / Next** | Any / STU-03, STU-04 |
| **Confirmed vs assumed** | ✅ 8.1.5 grants this explicitly; the Review-002 IA confirms it as a destination. **※ A-28R:** time spent at **course level only** — avoids a surveillant reading of data collected for institutional analytics. **Excluded (C-04):** charts, streaks, badges, ranking, peer comparison (1.3.4 scopes analytics to the tenant), certification progress (Phase 3, 3.5.1). ⚠ XR modules the desktop cannot run appear incomplete with a format explanation — **never as failure**. |

## STU-14 · Profile & account

| Field | Detail |
|---|---|
| **Purpose** | Review and, where permitted, update profile information |
| **FRD / decision** | 4.3.1, 7.1.1, 7.2.1, 10.2.2 |
| **Primary goal** | Check or correct details |
| **Entry** | Account menu |
| **Primary action** | Save changes |
| **Secondary** | Learning preferences · Help · Sign out |
| **Required info** | Current values · **which fields the institution controls and why** · academic stream ※ A-26 |
| **Components** | Field groups · read-only treatment with provenance note · preferences · save/cancel |
| **Loading** | Load · save |
| **Error** | Save failure · validation · sync conflict ⚠ Q-11 |
| **Restricted** | **B2B: ERP-sourced fields read-only** ※ A-11 |
| **Previous / Next** | Any / return to origin |
| **Confirmed vs assumed** | ✅ Confirmed by 4.3.1. **※ A-11:** read-only prevents both silent overwrite by sync (7.2.1) and self-granted entitlements via stream (7.2.3). **Help lives here as the consistent location** — WCAG 2.2 **3.2.6 Consistent Help (A)**, ⚠ Q-48. |

---

# B2C commerce — confirmed by D-04

## B2C-01 · Explore

| Field | Detail |
|---|---|
| **Purpose** | Discovery and comparison of purchasable learning |
| **FRD / decision** | 1.1.3, 6.1.1, 6.1.2 · **D-04** |
| **Primary goal** | Find something worth buying |
| **Entry** | Nav (B2C only) · STU-01/STU-02 empty states |
| **Primary action** | Open a product |
| **Secondary** | Filter by topic / format / price · sort |
| **Required info** | Title · **format badge** · price · owned indicator · short description |
| **Components** | Filter bar · sort · product card grid · pagination · empty-results state |
| **Loading** | Catalog retrieval · filter application |
| **Empty** | No results for filters — distinct from an empty catalog |
| **Error** | → STATE-03 |
| **Restricted** | **Absent entirely from B2B navigation** (D-04) |
| **Previous / Next** | Nav / B2C-02 |
| **Confirmed vs assumed** | ✅ Confirmed by D-04. Lists **modules and bundles** per 6.1.1/6.1.2 — **⚠ Q-46: are courses purchasable?** genuinely unresolved. Filtering is catalog navigation, not the global search the IA rejected. **Owned items show "In your learning" instead of a price** ※ A-37, ⚠ Q-45. |

## B2C-02 · Product detail

| Field | Detail |
|---|---|
| **Purpose** | Give a buyer enough to decide |
| **FRD / decision** | 6.1.1, 6.1.2 · **D-04** |
| **Primary goal** | Decide whether to buy |
| **Entry** | B2C-01 |
| **Primary action** | Buy |
| **Secondary** | Back to Explore · view contents (bundle) |
| **Required info** | Title · description · **format AND device requirement** · module list if a bundle · duration · price · what's included |
| **Components** | Product header · **device requirement block placed above the buy action** · contents list · price panel · buy |
| **Loading** | Product retrieval |
| **Empty** | n/a |
| **Error** | Product unavailable → STATE-02 |
| **Restricted** | Already owned → "In your learning" + Start Learning instead of Buy |
| **Previous / Next** | B2C-01 / B2C-03, AUTH-03 (if signed out) |
| **Confirmed vs assumed** | ✅ Confirmed by D-04. **Device requirement sits above the buy action deliberately** — a buyer must not purchase a VR module without understanding they need a headset. ⚠ Q-19: no academic-validation trust signal is shown even though FRD 1.4.2 makes one available, and a B2C buyer has little else to judge quality by. ⚠ Q-45 bundle overlap. |

## B2C-03 · Checkout

| Field | Detail |
|---|---|
| **Purpose** | Confirm the order and hand off to payment |
| **FRD / decision** | 6.1.1, 6.1.2, 9.1.1, 9.1.2 · **D-04**, **C-05** |
| **Primary goal** | Complete the purchase |
| **Entry** | B2C-02 |
| **Primary action** | Proceed to payment |
| **Secondary** | Back to product · change quantity where applicable |
| **Required info** | Order summary · price · tax line · total · what access is granted · terms link |
| **Components** | Order summary · price breakdown · billing identity (from account) · proceed |
| **Loading** | Order preparation |
| **Empty** | n/a |
| **Error** | Order preparation failure → inline retry |
| **Restricted** | Requires an authenticated account → AUTH-03 if signed out |
| **Previous / Next** | B2C-02 / B2C-04 |
| **Confirmed vs assumed** | ✅ Confirmed by D-04. **※ A-37: no card fields are rendered in our UI** — generic secure gateway redirect (C-05), which also avoids implying a PCI-scope decision nobody has made. **No cart** (IA §4.3 — FRD describes single-object purchase). **No coupon field** — FRD 6.4 is Phase 2. ⚠ Q-35 currency/tax is High priority because it is compliance-adjacent. WCAG 2.2 **3.3.7 Redundant Entry** — account details are carried forward, never re-typed. |

## B2C-04 · Payment processing

| Field | Detail |
|---|---|
| **Purpose** | Hold the Student safely across the external payment step |
| **FRD / decision** | 9.1.1, 9.1.2 · **D-04**, **C-05** |
| **Primary goal** | Reach a definite outcome |
| **Entry** | B2C-03 |
| **Primary action** | None — a wait state |
| **Secondary** | None. **Deliberately no cancel and no retry** — either risks a double charge |
| **Required info** | That payment is in progress · not to close the window · what happens next |
| **Components** | Status panel · progress indicator · reassurance copy |
| **Loading** | This screen **is** a loading state |
| **Error** | Timeout → indeterminate variant on B2C-05 |
| **Previous / Next** | B2C-03 / B2C-05 |
| **Confirmed vs assumed** | ✅ Confirmed by D-04. The absence of controls is a deliberate safety decision, not an oversight. |

## B2C-05 · Payment result

| Field | Detail |
|---|---|
| **Purpose** | Report the outcome and activate access |
| **FRD / decision** | 9.2.1, 9.2.2 · **D-04**, **D-18** |
| **Primary goal** | Start learning, or recover from failure |
| **Entry** | B2C-04 |
| **Primary action** | **Success:** Start Learning · **Failure:** Try again |
| **Secondary** | View in My Learning · use a different method · contact support |
| **Required info** | Outcome · what was purchased · **that access is now active** (success) · gateway-reported reason (failure) |
| **Components** | Outcome panel · order summary · action set |
| **Loading** | Indeterminate variant polls for resolution |
| **Empty** | n/a |
| **Error** | **Three variants** — success · declined · **indeterminate** |
| **Previous / Next** | B2C-04 / STU-04, B2C-03 |
| **Confirmed vs assumed** | ✅ **D-04 + 9.2.1/9.2.2**: licence activates automatically and entitlements appear in My Learning; the screen confirms access is active and offers **Start Learning**. **The indeterminate variant is the important one** — it claims neither success nor failure, polls for resolution, and **never offers immediate retry**, because retry on an unresolved payment risks a double charge. Failure shows only the gateway-reported reason, never an internal code (C-07). ⚠ Q-36 receipt · Q-37 refunds. |

---

# Full-page states

## STATE-01 · Access restricted

| Field | Detail |
|---|---|
| **Purpose** | Explain why access is denied and who can resolve it |
| **FRD / decision** | 6.2.2, 7.2.3, 2.2.2, 10.1.2 · **D-18** |
| **Primary goal** | Understand the block and take the only available step |
| **Entry** | AUTH-02 · STU-01 · STU-02 · STU-04 · STU-07 · STU-08 |
| **Primary action** | Contact the responsible party |
| **Secondary** | Back to My Learning · retry (case 3 only) · Explore (B2C only) |
| **Required info** | Which cause · **that it is administrative, not personal** · who can resolve it |
| **Components** | Cause-specific explanation · contact guidance · return path |
| **Restricted** | **Four variants** — (1) institutional licence cap (6.2.2) · (2) no entitlements (7.2.3) · (3) validation failed at launch (10.1.2) · (4) account authenticated but not provisioned |
| **Previous / Next** | Various / STU-02, B2C-01 |
| **Confirmed vs assumed** | ✅ Causes confirmed; **D-18 confirms the obligation** to say what happened and what to do next. **※ A-27R** governs wording. **No purchase prompt in variant 1** — a B2B Student cannot buy past their institution's cap. **Internal authorization codes are never exposed** (C-07). Note: **module locked by sequence is deliberately NOT here** — it is a normal state handled in place on STU-03/STU-04, not a failure page. |

## STATE-02 · Content unavailable

| Field | Detail |
|---|---|
| **Purpose** | Handle content that cannot be delivered — distinct from access being denied |
| **FRD / decision** | 12.2.1, 2.3.2, 7.2.1 · **D-18** |
| **Primary goal** | Retry or move on |
| **Entry** | STU-03 – STU-08, STU-12, B2C-02 |
| **Primary action** | Retry |
| **Secondary** | Back to module or My Learning |
| **Required info** | What failed · whether retry is worthwhile · **that entitlement is not the issue** |
| **Error** | Variants — asset load failure (12.2.1) · content withdrawn after version change (2.3.2) or ERP sync (7.2.1) |
| **Previous / Next** | Any content screen / origin, STU-02 |
| **Confirmed vs assumed** | ✅ Failure modes traceable. **※ A-20: withdrawn content is shown in place with a neutral explanation, never silently removed** — silent disappearance reads as data loss. ⚠ Module lifecycle states including Archived are **Phase 2** (1.5.1), so Phase 1 has no defined withdrawal behaviour. |

## STATE-03 · System error

| Field | Detail |
|---|---|
| **Purpose** | Catch platform failures that are neither permission nor content problems |
| **FRD / decision** | **None** — **D-18** obligation |
| **Primary goal** | Recover or get help |
| **Entry** | Any screen |
| **Primary action** | Back to Home |
| **Secondary** | Retry · contact support |
| **Required info** | **That the platform failed, not the Student** · a recovery path |
| **Previous / Next** | Any / STU-01 |
| **Confirmed vs assumed** | **※ Design-supplied**, required by D-18. Kept distinct from STATE-01 and STATE-02 because the three have different causes, wording, and recovery paths. |

---

# Traceability

| Screen | Basis | Assumptions | Open questions |
|---|---|---|---|
| AUTH-01 Login | ✅ D-03 | A-29R | Q-29 |
| AUTH-02 SSO | ✅ D-03 | — | — |
| AUTH-03 Sign up | ✅ D-01, D-03 | A-18R | **Q-18** |
| AUTH-04 Verification | ✅ implied | — | — |
| AUTH-05 Password reset | ※ design-supplied | A-29R | Q-29 |
| AUTH-06 Session expired | ✅ **D-17** | A-41 | Q-43 |
| AUTH-07 Profile setup | ✅ 4.3.1 | A-11, A-15R | **Q-11**, Q-15 |
| STU-01 Home | ✅ D-10, D-07 | A-38 | Q-41 |
| STU-02 My Learning | ✅ 8.1.5 | A-27R | — |
| STU-03 Course detail | ✅ **D-07** | — | **Q-47** |
| STU-04 Module detail | ✅ **D-08** | A-24 | Q-24, **Q-47** |
| STU-05 PDF viewer | ✅ **D-05** | A-34 | Q-39 |
| STU-06 Video viewer | ✅ **D-05**, D-08 | A-36 | Q-40 |
| STU-07 Simulation access | ✅ **D-09** | A-14 | Q-14, **Q-42** |
| STU-08 Web runtime | ✅ 1.2.1 | A-39, A-40 | Q-16, **Q-42** |
| STU-09 Assessment overview | ✅ **D-06** | — | — |
| STU-10 Assessment attempt | ✅ **D-06**, D-17 | A-23, A-35, A-41 | Q-23, Q-38, Q-43 |
| STU-11 Submit confirm | ✅ brief §8 | — | — |
| STU-12 Result | ✅ **D-06**, D-08 | A-10, A-24 | Q-10, Q-24 |
| STU-13 Progress | ✅ 8.1.5 | A-28R | Q-28 |
| STU-14 Profile | ✅ 4.3.1 | A-11, A-26 | **Q-11**, Q-48 |
| B2C-01 Explore | ✅ **D-04** | A-37 | **Q-46**, Q-45 |
| B2C-02 Product detail | ✅ **D-04** | A-37 | Q-19, Q-45 |
| B2C-03 Checkout | ✅ **D-04** | A-37 | **Q-35**, Q-34 |
| B2C-04 Payment processing | ✅ **D-04** | A-37 | Q-34 |
| B2C-05 Payment result | ✅ **D-04**, D-18 | A-37 | Q-36, Q-37 |
| STATE-01 Access restricted | ✅ **D-18** | A-27R | Q-27 |
| STATE-02 Content unavailable | ✅ **D-18** | A-20 | Q-20 |
| STATE-03 System error | ※ D-18 obligation | — | — |
