# Open Questions — Phase 1 Student UI/UX

**Document status:** Living register
**Created:** 2026-08-10 (Review 001) · **Rewritten:** 2026-08-10 (Review 002)

---

## Review 002 — questions closed

Fourteen questions were answered by the confirmed decisions. **All four Review-001 blocking questions are now closed.**

| Closed | Question | Answered by |
|---|---|---|
| Q-01 | B2B, B2C, or both? | **D-01** — both, shared core with defined branch points |
| Q-02 | Which authentication path? | **D-03** — both; SSO preferred for B2B, email/password + social for B2C. Resolves the FRD's 4.2.2 / 7.4.1 phase contradiction in favour of Phase 1. |
| Q-03 | Institutional self-registration? | **Correction B + D-01/D-03** — self-registration and ERP provisioning are different account-origin paths, not a contradiction. B2C self-registers; B2B is provisioned. |
| Q-04 | Is checkout in the milestone? | **D-04** — yes, B2C commerce is in scope |
| Q-05 | Learning-resource formats | **D-05** — PDF notes and instructional videos |
| Q-07 | Attempt limits | **D-06** — unlimited, history recorded |
| Q-08 | Time limits | **D-06** — 20-minute total budget, not per-question |
| Q-09 | Passing score | **D-06** — 10/20 = 50% |
| Q-17 | XR module information on desktop | **D-09** — visible, badged, device-specific CTAs, never hidden |
| Q-22 | Sequencing advisory or enforced | **D-07** — gated/enforced |
| Q-25 | Negative marking disclosure | **D-06** — mandatory pre-attempt disclosure |
| Q-30 | Session expiry during active work | **D-17** — warn, preserve, resume, never consume an attempt |
| Q-31 | Module completion definition | **D-08** — four-part model with a passing assessment |
| Q-33 | Accessibility standard | **D-11** — WCAG 2.2 AA |

**Rescoped rather than closed:** Q-13 (approach decided by D-12; final brand guide still outstanding) · Q-16 (technical container no longer assumed) · Q-18 (now carries a documentation obligation from D-03) · Q-27, Q-28, Q-29 (obligation confirmed; content still open).

---

## Priority summary

| Priority | Count |
|---|---|
| **High** | 10 |
| Medium | 15 |
| Low | 13 |
| **Total open** | **38** |

**No question blocks build start.** Ten are High because they would change product behaviour, carry compliance risk, or represent an accessibility barrier. Counts include Q-49 (from D-19) and Q-50 – Q-52 (from the Stage 8 accessibility review).

**Four carry engineering dependencies as much as product ones:** Q-40 video coverage tracking · Q-42 unrecorded simulation completion · Q-43 server-authoritative timer · Q-49 device-completion latency.

---

# High priority

### Q-13 — Is there an approved visual brand guide beyond the logo? *(rescoped)*

**Why it matters** D-12 decides the *approach* — a professional provisional system, not a mechanically derived palette — but no approved palette, typeface, or tone of voice exists. Two practical gaps remain: **no vector (SVG) logo** and **no reversed/dark variant**, both of which constrain the header lockup and any future dark theme.
**Affects** Design system, high-fidelity, contrast validation under D-11.
**Continue?** Yes — the provisional system in `06-design-system/` is explicitly labelled provisional and contrast-validated, so a later brand decision replaces token *values* without restructuring.

### Q-18 — Can one person hold both a B2B and a B2C identity, and do they link? *(rescoped, raised priority)*

**Why it matters** D-03 requires that duplicate-account behaviour not be created without documenting identity-linking implications, and D-04 makes the case real: a BITS Pilani WILP learner could plausibly also buy modules individually. Under separate database environments (FRD 1.3.1, 1.3.2) their progress, purchases, and certification eligibility would **not** merge — a module bought personally would not appear in their institutional account.
**Affects** Login disambiguation, registration collision state, profile identity, Explore visibility, entitlement presentation.
**Continue?** Yes — A-18R assumes one account per context and specifies an explicit collision state. The linking implication is documented in A-18R and must be surfaced to the manager **before B2C launch**.

### Q-32 — Localization, currency, and regional formatting

**Why it matters** The FRD contains no i18n requirement, yet Phase 1 plans for international payment gateways serving "global purchases by individual learners" (FRD 9.1.2) and regional B2C databases (1.3.3). D-04 now puts real prices in front of those learners.
**Affects** Every layout's text tolerance, price display, date/number formatting.
**Continue?** Yes — A-32 assumes English/INR with text-expansion tolerance and centralised formatting.

### Q-35 — What currency, tax treatment, and price presentation apply?

**Why it matters** Prices are legally sensitive. Whether displayed prices include GST, whether international buyers see a different currency, and whether tax is shown as a line item are compliance-adjacent decisions, not styling. FRD 9.3.1 mandates GST-compliant invoices but is **Phase 2** and institution-facing, leaving Phase-1 B2C tax presentation undefined.
**Affects** B2C-02 Product Detail, B2C-03 Checkout, B2C-05 Payment Result.
**Continue?** Yes — A-37 shows INR with a neutral "Taxes calculated at checkout" line until confirmed.

### Q-11 — Which profile fields are Student-editable vs institution-controlled?

**Why it matters** ERP is authoritative (FRD 7.1.1) and scheduled sync (7.2.1) would silently overwrite local edits — visible data loss. Entitlements derive from stream (7.2.3), so an editable stream implies self-granted entitlements.
**Affects** AUTH-07 profile setup, STU-14 profile, sync-conflict messaging.
**Continue?** Yes — A-11 makes ERP-sourced fields read-only with a provenance note.

### Q-46 — Are **courses** purchasable, or only modules and bundles?

**Why it matters** FRD 6.1.1 and 6.1.2 name only *individual modules* and *bundles*. But the content hierarchy has Courses (3.2.1) between modules and programs, and D-07 gates progression **within a course**. If a B2C learner can only buy loose modules, they may never experience a coherent course sequence — and the gating model has nothing to gate. If bundles *are* courses in commercial clothing, that should be said, because it changes what Explore lists and how a product detail page is structured.
**Affects** B2C-01 Explore taxonomy, B2C-02 Product Detail, My Learning grouping, the whole gating model for B2C.
**Continue?** Yes — Explore is designed to list **modules and bundles** per the FRD, with bundles able to *contain* a full course. Flagged as a genuine product question.

### Q-47 — Does sequential gating (D-07) apply to individually purchased modules?

**Why it matters** D-07 gates modules within a course sequence. A B2C learner who buys a single module from the middle of a course has no predecessor to complete. Gating them would make their purchase unusable; not gating them creates two different progression models in one product.
**Affects** STU-04 module detail, module state model, B2C entitlement presentation.
**Continue?** Yes — assumed: gating applies **within a course context only**; a standalone purchased module is always Available. Recorded in the flows and screen inventory as an explicit branch.

### Q-42 — What recovery exists when a simulation completion is never *recorded*? *(rescoped by D-19)*

**Why it matters** D-19 removed the structural dead end: completion is account-level, so a headset-only module no longer strands a desktop Student by design. What survives is narrower but still real — if the platform **fails to record** a completion (telemetry loss, crash at session end, device offline), the Student has done the work and the account does not reflect it. D-07 still gates on recorded state, and A-40 still declines a manual override because an override would defeat the gate for everyone.
**Affects** STU-07 simulation access, module state, STATE-01, support routing.
**Continue?** Yes — A-40 (retry, no override) plus A-42 (explicit "Check for updates") give the Student two honest actions before support. **Still an engineering question:** what is the platform's reconciliation behaviour for an unrecorded completion?

### Q-49 — How, and how quickly, does a device completion reach the LMS? *(new — from D-19)*

**Why it matters** D-19 makes completion account-level but deliberately forbids inventing a cross-device mechanism, which leaves *timing* undefined. A Student who removes a headset and opens their laptop expects to see progress. If recording is near-instant, A-42's manual "Check for updates" control is redundant clutter; if it takes minutes, the control is essential and the copy must set that expectation. Whether the platform can push completion or the LMS must re-read on demand is an engineering fact nobody has stated.
**Affects** STU-07 XR panels, module state labelling (A-43), completion checklist, Home's Continue Learning target.
**Continue?** Yes — A-42 assumes read-on-navigation plus an explicit refresh control; A-43 labels the interim state. Both are deliberately the cheapest things to delete if the platform turns out to push events.

---

# Medium priority

### Q-10 — Can Students review submitted assessment answers?
No FRD requirement grants review; disclosure would leak the reused question bank (FRD 5.1.1, 5.3.1). **Unlimited attempts (D-06) sharpen this** — full review plus unlimited retries makes the 50% pass mark trivially gameable. A middle option is worth considering: reveal *which* questions were wrong without revealing correct answers. → A-10

### Q-12 — Is certification UI required in Phase 1?
FRD 3.3.2 promises students "shall receive certification" in Phase 1, but student-facing tracking is Phase 3 (3.5.1), and nothing describes issuing, storing, or viewing a certificate artefact. → A-12

### Q-14 — XR device binding, replacement, and headset credentials
FRD 2.4.1/2.4.2 imply a Student-initiated device-replacement request with no named surface. **2.4.4 requires institutional Students to sign into the XR app with LMS credentials** — under SSO (D-03) they may have no password to type into a headset. → A-14

### Q-16 — Web simulation technical characteristics *(rescoped)*
Correction H removes the embedding assumption. Still undefined: minimum viewport, WebGL and browser requirements, expected asset payload and load time (FRD 12.2.1 implies latency matters), whether web simulations use the same encrypted bundles (2.2.1) and licence validation as XR builds, and how the return path behaves in a separate browser context. → A-39

### Q-19 — Is BITS Pilani academic validation shown to the Student?
**Raised relevance under D-04:** a B2C buyer judging a module before purchase has no quality signal, and FRD 1.4.2's academic validation is the strongest one available. Displaying it would be a genuine trust signal — but adding it unasked would invent a feature. → A-19

### Q-20 — Is the Student informed when entitlements or content change?
ERP sync (FRD 7.2.1) can add or remove courses between sessions; version releases (2.3.2) change content mid-course; module lifecycle states including Archived are **Phase 2** (1.5.1), so Phase 1 has no defined withdrawal behaviour. → A-20

### Q-23 — Are MCQs single-select or multi-select?
D-06's +2 / −1 / 0 scoring defines no partial-credit rule, which multi-select would require. → A-23

### Q-24 — How are descriptive answers graded, and what does the Student see meanwhile?
FRD 5.2.3 permits free text; no Phase-1 grading workflow exists. **D-07/D-08 make this materially worse than at Review 001** — the next module is gated on *passing*, so an ungraded assessment could lock a Student out indefinitely. → A-24

### Q-34 — Which payment gateway, and what is the integration pattern?
C-05 forbids inventing it. Redirect vs embedded vs hosted fields changes the checkout screen structure and determines whether PCI scope touches our UI at all. → A-37

### Q-36 — What receipt or invoice does a B2C buyer receive?
FRD 9.3.1 mandates GST-compliant invoices but is Phase 2 and institution-facing. Phase-1 B2C receipting is undefined — yet a purchase without any record is a poor and probably non-compliant experience. → A-37

### Q-37 — What are the refund, cancellation, and access-revocation rules?
FRD 9.2.1 activates licences on payment but no requirement describes reversing one. Affects post-purchase copy, terms links, and whether any self-service cancellation exists. → A-37

### Q-40 — How is the 90% video completion threshold measured?
D-08 states the threshold but not the method. Furthest-playhead measurement is satisfied by one drag of the scrubber, making the D-07 gate meaningless. **This is a tracking-model question for engineering.** → A-36

### Q-43 — Is the assessment timer server-authoritative, and how often do answers persist?
D-17 forbids losing answers or consuming an attempt on auth expiry; D-06 sets a 20-minute limit. A client-side timer would be resettable by reloading. **Engineering question.** → A-41

---

# Low priority

| # | Question | Assumption |
|---|---|---|
| Q-06 | What exactly is shown before a web simulation launches? | A-06R |
| Q-15 | What consumes "learning preferences" in Phase 1? Its only consumer (FRD 4.5.1) is Phase 2. | A-15R |
| Q-21 | Is FRD page 12 intentionally blank? | A-21 |
| Q-26 | Is the Student's academic stream displayed? | A-26 |
| Q-27 | Exact wording and routing of each restricted state | A-27R |
| Q-28 | Which progress metrics are Student-visible? | A-28R |
| Q-29 | Password-reset policy, password rules, MFA, lockout — **none appear anywhere in the FRD** | A-29R |
| Q-38 | How many hints are available — per question, per assessment? | A-35 |
| Q-39 | Confirm the PDF completion rule: open-only vs explicit mark-complete | A-34 |
| Q-41 | Confirm the Home content set and its priority order | A-38 |
| Q-44 | What does a B2C learner see when a purchased licence expires mid-course? FRD 6.5.2 grace periods are **Phase 3** and institution-only. | A-37 |
| Q-45 | What happens when a purchased bundle contains a module the Student already owns? | A-37 |
| Q-48 | Is there a Student-facing help or support destination? WCAG 2.2 **3.2.6 Consistent Help (Level A)** expects help to be consistently located when it exists — and several restricted states direct Students to "contact support". | — see note |

**Note on Q-48.** D-11 adopts WCAG 2.2 AA, which includes 3.2.6 Consistent Help at Level A. Several designed states (A-27R, A-40) tell the Student to contact someone. If any help mechanism exists, its placement must be consistent across screens. The design places a single **Help** entry in the Account menu as the consistent location; whether a real help destination exists behind it is a product question.

---

---

# Part F — Questions raised by the Stage 8 accessibility review

Three barriers that **design cannot resolve alone**. Each needs a product decision or content ownership.

### Q-50 — Is there an extended-time accommodation for assessments, and who grants it? · **High**

**Why it matters** D-06 sets a fixed 20-minute limit. WCAG 2.2 **2.2.1 Timing Adjustable (Level A)** requires time limits be adjustable, with an *Essential exception* that a timed assessment usually qualifies for — so the limit is very likely compliant as specified. The problem is different: **no accommodation mechanism exists anywhere in the design or the FRD.** Learners entitled to extended time — a routine accommodation in higher education, and one Indian institutions grant under the Rights of Persons with Disabilities Act 2016 — have no way to receive it. There is no per-student multiplier, no Faculty control, and no FRD requirement covering it.

**Affects** STU-09 disclosure copy, STU-10 timer, and whether Faculty tooling (out of current scope) must expose a control.
**Continue?** Yes — the timer reads from a **per-attempt allowance** rather than a hard-coded constant, so a multiplier can be introduced later without redesigning the screen or the timer logic. Deliberately the cheapest possible hook.

### Q-51 — Who owns video captions, transcripts, and audio description? · **High**

**Why it matters** D-05 introduced instructional video and with it obligations no requirement assigns to anyone. Captions are Level **A**. **Audio description is Level AA**, and a transcript does not satisfy it — for engineering video showing apparatus, diagrams, or on-screen procedure, meaningful visual information is conveyed without narration, which is exactly what audio description covers. The design can provide the surfaces; it cannot produce the content. FRD 1.4.3 already gives the Content Manager a pre-publication review step where captioning could be made a prerequisite.

**Affects** STU-06 player, module completion under D-08, vendor and Content Manager acceptance criteria.
**Continue?** Yes — the player specifies a caption track, transcript panel, and described-audio slot so the capability exists before the content does. **Design position:** a video without captions must not be marked *Required* for completion, or a Deaf or hard-of-hearing Student is gated behind inaccessible content.

### Q-52 — Is a responsive/mobile design set committed, and when? · Medium

**Why it matters** WCAG 2.2 **1.4.10 Reflow (AA)** requires content at 320 CSS px equivalent without two-dimensional scrolling. D-15 is desktop-first at 1440px with no mobile or tablet set, so **this AA criterion is not currently met** — by agreed scope, not oversight. It is stated plainly rather than passed.

**Affects** The AA claim itself, and eventual layout work.
**Continue?** Yes — mitigations are already in place: no fixed-width containers, `minmax()` grids, relative units throughout, and text-expansion tolerance (A-32). The layouts are built to reflow when a responsive pass happens.

---

# Part G — Questions raised by the Review-004 correction pass

### Q-53 — What is the licence duration for a B2C purchase? · **High**

**Why it matters** The Stage-6 product detail screen said "One-time purchase · **lifetime access**". **Lifetime access was never confirmed** and has been removed. Nothing in the FRD defines a B2C licence term: 9.2.1 activates a licence on payment but no requirement describes its duration, expiry, renewal, or revocation. FRD 6.5.2 grace periods are **Phase 3 and institution-only**.

This is a commercial commitment, not copy. "Lifetime access" is close to unretractable once published.

**Affects** B2C-02 price panel, B2C-05 confirmation, My Learning (does a lapsed purchase disappear?), Q-44.
**Continue?** Yes — neutral wording only: **"One-time purchase"**. No duration, expiry, renewal, or refund policy is stated or implied anywhere.

### Q-54 — Can the displayed assessment score be negative, or is it floored at 0? · **High**

**Why it matters** D-06 scoring is +2 / +1 after hint / **−1** / 0. A Student answering 10 questions incorrectly scores **−10**. Whether that is displayed as −10 or floored at 0 is undecided, and it is not a presentation detail:

- It changes the **result screen** (can `.big` render a negative number?)
- It changes the **progress record** (11.2.1 stores scores — signed or floored?)
- It changes **attempt history** and any future aggregate
- A negative score shown to a learner carries a different emotional weight from zero, and that is a pedagogical decision, not a UI one

**Affects** STU-12, STU-13, the stored score model.
**Continue?** Yes — **the UI is kept neutral.** The score is rendered as a value with no assumption about sign, no minimum, and no special-casing. Whichever answer arrives, no redesign is required.

### Q-55 — Which social login providers are confirmed? · Medium

**Why it matters** FRD 4.1.2 permits social login but **enumerates no providers**. Google and Microsoft appear throughout the designs as **sample placeholders** — they are the two most plausible for an Indian engineering-education context, but neither is approved. Each real provider carries its own brand guidelines, button specifications, and consent implications.

**Affects** AUTH-01 B2C, AUTH-03.
**Continue?** Yes — providers are marked as sample throughout (A-45). The layout accommodates two to four providers without change.

---

# Open-question classification (Review-004 §13)

Every High and Medium question, classified by **who can answer it**. None is silently closed.

### A · Manager / product decision

| # | Question |
|---|---|
| Q-13 | Approved brand system + **vector logo** and reversed variant |
| Q-35 | Currency, tax treatment, price presentation *(compliance-adjacent)* |
| Q-46 | Are **courses** purchasable, or only modules and bundles? |
| Q-47 | Does sequential gating apply to standalone purchased modules? |
| Q-53 | **B2C licence duration** — replaces the withdrawn "lifetime access" |
| Q-54 | **Is a negative assessment score displayed, or floored at 0?** |
| Q-12 | Is any certification presentation required in Phase 1? |
| Q-10 | May Students review submitted answers? |
| Q-34 · Q-36 · Q-37 · Q-44 · Q-45 | Gateway · receipt · refunds · expiry · bundle overlap |
| Q-55 | Social login provider selection |
| Q-19 | Is BITS academic validation shown to buyers? |

### B · Engineering dependency

| # | Question |
|---|---|
| Q-40 | Video **coverage** tracking model — furthest-position defeats the gate |
| Q-42 | Reconciliation when a simulation completion is never recorded |
| Q-43 | Server-authoritative assessment timer |
| Q-49 | Device-completion latency and surfacing mechanism |
| Q-16 | Web simulation container, viewport, payload, return path |
| Q-18 | **B2B/B2C identity linking** — data model, not UI |
| Q-11 | **Student vs ERP profile field ownership** — sync authority |

### C · Content / accessibility ownership

| # | Question |
|---|---|
| Q-51 | **Captions, transcripts, audio description** — who produces and funds them |
| Q-50 | **Assessment extended-time accommodation** — policy + mechanism owner |
| Q-24 | **Descriptive-answer grading** — who grades, in what turnaround |
| Q-52 | **Responsive / reflow commitment** — WCAG 1.4.10 unmet until scoped |
| Q-05 → closed, but resource authoring standards follow from Q-51 |

### D · Safe to defer

Q-06 · Q-14 · Q-15 · Q-20 · Q-21 · Q-23 · Q-26 · Q-27 · Q-28 · Q-29 · Q-32 · Q-38 · Q-39 · Q-41 · Q-48

Each has a labelled reversible assumption and a low reversal cost. None blocks build or Figma transfer.

---

## Consolidated register

| ID | Question | Priority | Assumption |
|---|---|---|---|
| Q-06 | Pre-launch simulation information | Low | A-06R |
| Q-10 | Assessment answer review | Medium | A-10 |
| Q-11 | Profile field editability | **High** | A-11 |
| Q-12 | Certification UI in Phase 1 | Medium | A-12 |
| Q-13 | Approved brand guide | **High** | — |
| Q-14 | XR device binding / headset credentials | Medium | A-14 |
| Q-15 | Consumer of learning preferences | Low | A-15R |
| Q-16 | Web simulation technical characteristics | Medium | A-39 |
| Q-18 | B2B/B2C identity linking | **High** | A-18R |
| Q-19 | Academic validation visibility | Medium | A-19 |
| Q-20 | Entitlement / content change notification | Medium | A-20 |
| Q-21 | Blank FRD page 12 | Low | A-21 |
| Q-23 | MCQ single vs multi-select | Medium | A-23 |
| Q-24 | Descriptive answer grading | Medium | A-24 |
| Q-26 | Stream visibility | Low | A-26 |
| Q-27 | Restricted-state wording | Low | A-27R |
| Q-28 | Progress metric set | Low | A-28R |
| Q-29 | Password reset / password policy | Low | A-29R |
| Q-32 | Localization and formatting | **High** | A-32 |
| Q-34 | Payment gateway and integration pattern | Medium | A-37 |
| Q-35 | Currency, tax, price presentation | **High** | A-37 |
| Q-36 | Receipt / invoice | Medium | A-37 |
| Q-37 | Refunds and cancellation | Medium | A-37 |
| Q-38 | Hint availability limits | Low | A-35 |
| Q-39 | PDF completion rule | Low | A-34 |
| Q-40 | Video completion measurement | Medium | A-36 |
| Q-41 | Home content set | Low | A-38 |
| Q-42 | Simulation completion failure recovery | **High** | A-40 |
| Q-43 | Timer authority and autosave | Medium | A-41 |
| Q-44 | B2C licence expiry mid-course | Low | A-37 |
| Q-45 | Bundle containing an already-owned module | Low | A-37 |
| Q-46 | Are courses purchasable? | **High** | — |
| Q-47 | Does gating apply to standalone purchased modules? | **High** | — |
| Q-48 | Student help destination | Low | — |
| Q-49 | Device-completion latency and surfacing mechanism | Medium | A-42, A-43 |
| Q-50 | **Extended-time accommodation for assessments** | **High** | per-attempt allowance hook |
| Q-51 | **Ownership of captions, transcripts, audio description** | **High** | caption/AD slots specified |
| Q-52 | Responsive/mobile commitment — Reflow 1.4.10 unmet until then | Medium | A-32 tolerance |

**Three questions have engineering dependencies as much as product ones:** Q-40 (video coverage tracking), Q-42 (simulation completion events), Q-43 (server-authoritative timer). These should reach engineering during wireframe review, not at handoff.
