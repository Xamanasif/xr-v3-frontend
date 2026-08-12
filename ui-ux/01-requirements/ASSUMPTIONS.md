# Assumptions — Phase 1 Student UI/UX

**Document status:** Living register
**Created:** 2026-08-10 (Review 001) · **Rewritten:** 2026-08-10 (Review 002)

---

## ⚠️ Status of every item in this document

> **EVERY assumption below is UNCONFIRMED.** Nothing here is a project decision and nothing may be cited as a requirement. These are temporary working positions adopted so design can continue while `OPEN_QUESTIONS.md` is resolved. Each is chosen to be the **safest reversible option**.
>
> Confirmed decisions live **only** in `DECISIONS.md`. Promotion requires explicit manager confirmation and is recorded there — never here.

---

## Review 002 — assumptions retired

Twelve Review-001 assumptions were superseded by confirmed decisions and have been **removed** from this register. They are listed once, here, so the audit trail survives.

| Retired | Was | Superseded by |
|---|---|---|
| A-01 | "Phase 1" = union of all 12 sections' Phase 1 | **D-02** — confirmed |
| A-04 | B2C commerce excluded from milestone 1 | **D-04** — reversed, commerce is in scope |
| A-05 | Resources are text/HTML; no video | **D-05** — reversed, PDF **and** video confirmed |
| A-08 | No assessment time limit | **D-06** — reversed, 20-minute total timer |
| A-09 | Score only, no pass/fail verdict | **D-06** — reversed, pass mark 10/20 |
| A-16 | Web simulation renders embedded in the LMS | **Correction H** — reversed, presentation not assumed (see A-39) |
| A-17 | XR modules shown with badge + guidance, no launch | **D-09** — confirmed |
| A-22 | Sequencing advisory; nothing locked | **D-07** — reversed, sequencing is **gated** |
| A-25 | Negative marking disclosed before the attempt | **D-06** — confirmed and extended |
| A-30 | Expiry warns, preserves work, doesn't consume an attempt | **D-17** — confirmed |
| A-31 | Complete = simulation + assessment submitted | **D-08** — reversed, assessment must be **passed** |
| A-33 | WCAG 2.1 AA baseline | **D-11** — upgraded to **WCAG 2.2 AA** |

### Retired at Review 005

| Retired | Was | Superseded by |
|---|---|---|
| A-10 | Score summary only; no per-question review | **D-25** — per-question **correctness** is now shown; the answer key remains prohibited |
| A-46 | Score display sign-neutral | **D-23** — `reportedScore = max(rawScore, 0)` |
| A-47 | Licence duration not stated at all | **D-24** — duration is entitlement data, displayed **only when authoritative data supplies it** (see A-48) |

A-27 was **partially** retired: the obligation to design distinct restricted states is now confirmed (D-18); the per-case content remains design work and stays below as A-27R.

---

## Selection principle

Where the FRD and the confirmed decisions are silent, the option adopted is chosen by:

1. **Least harm if wrong** — prefer a failure mode that inconveniences rather than misinforms or blocks a Student
2. **Least structural commitment** — prefer adding/removing a component over reshaping the IA
3. **Least invented surface** — prefer omitting an unrequested feature (C-04)
4. **Most reversible** — prefer what can change after wireframing without invalidating completed work

---

## Register

### Carried forward from Review 001

---

### A-06R — Simulation pre-launch information

| | |
|---|---|
| **Assumption** | Before a **web** simulation launches, the Student sees: module title · format and device · simulation instructions if present · licence/access status · attempt number where the platform counts simulation attempts (FRD 11.2.2). |
| **Because** | Every element traces to an existing requirement; none is invented. D-06 confirmed an equivalent disclosure obligation for assessments, which makes the parallel for simulations reasonable but not automatic. |
| **Question** | Q-06 |
| **Reversal cost** | Low — content of one screen region |
| **Harm if wrong** | A Student enters a simulation under-informed |

---

### A-11 — Profile field editability

| | |
|---|---|
| **Assumption** | For **B2B**: ERP-sourced fields (institution, stream/specialization, enrolment) are **read-only** with a short note that they are managed by the institution. Only genuinely personal fields are editable. For **B2C**: all profile fields are editable. |
| **Because** | ERP is authoritative (FRD 7.1.1) and scheduled sync (7.2.1) would silently overwrite local edits. Entitlements derive from stream (7.2.3), so an editable stream would let a Student alter their own entitlements. |
| **Question** | Q-11 |
| **Reversal cost** | Low — field-level state |
| **Harm if wrong** | A Student must contact their institution to fix a field. Recoverable; far safer than silent overwrite. |

---

### A-12 — Certification UI

| | |
|---|---|
| **Assumption** | Phase 1 renders the **content hierarchy only**. Certification Program appears as a grouping label above Course where one exists, but there is **no** certification progress tracker, eligibility display, certificate artefact, or download. |
| **Because** | Student-facing certification tracking is explicitly **Phase 3** (FRD 3.5.1). Building it now would breach D-02's phase boundary. |
| **Question** | Q-12 |
| **Reversal cost** | Low–Medium |
| **Harm if wrong** | FRD 3.3.2 promises students "shall receive certification" with no Phase-1 way to see it |

---

### A-14 — XR device management

| | |
|---|---|
| **Assumption** | No device-binding display and no device-replacement request UI. |
| **Because** | FRD 2.4.1 and 2.4.2 describe binding and Super Admin approval without naming a Student-facing request surface. Building one would invent a workflow (C-04). |
| **Question** | Q-14 |
| **Reversal cost** | Low — additive settings region |
| **Harm if wrong** | A B2C Student with a broken headset has no in-product path to request transfer |

---

### A-15R — Learning preferences

| | |
|---|---|
| **Assumption** | Learning preferences are collected as FRD 4.3.1 requires, presented as **optional**, and live under **Account** (per the Review-002 IA) rather than blocking first-run onboarding. Copy makes **no personalization promise**. |
| **Because** | The only consumer — the recommendation engine (FRD 4.5.1) — is Phase 2 and excluded by C-04. Moving them out of the first-run path serves D-10's "minimum friction". |
| **Question** | Q-15 |
| **Reversal cost** | Low |
| **Harm if wrong** | Preference data captured less completely than Phase 2 would like |

---

### A-18R — Identity model and linking

| | |
|---|---|
| **Assumption** | One account = one context. A Student is either institutional **or** individual, and belongs to one institution. **No account switcher.** Where an email already exists in the other environment, registration surfaces an explicit "this email is already registered" state rather than silently creating a second identity. |
| **Because** | Separate database environments (FRD 1.3.1, 1.3.2) imply separate accounts. **D-03 explicitly requires identity-linking implications to be documented rather than duplicate-account behaviour created silently** — the collision state is the minimum honest response. |
| **Question** | Q-18 (revised) |
| **Reversal cost** | Medium–High — a context switcher affects the global shell |
| **Harm if wrong** | A learner who is both an institutional student and an individual buyer manages two logins manually |
| **Documented linking implication** | If the same person holds both identities, progress, purchases, and certification eligibility do **not** merge. A B2C-purchased module does not appear in their institutional account, and vice versa. This must be stated to the manager before B2C launch. |

---

### A-19 — Academic validation visibility

| | |
|---|---|
| **Assumption** | BITS Pilani academic validation status (FRD 1.4.2) is **not** displayed. |
| **Because** | The FRD requires the validation *process*, not its display. Adding a trust badge would invent a feature (C-04). |
| **Question** | Q-19 |
| **Reversal cost** | Low |
| **Harm if wrong** | A genuine trust signal goes unused — more consequential now that B2C buyers must judge quality before purchase (D-04) |

---

### A-20 — Content and entitlement change

| | |
|---|---|
| **Assumption** | No notification system. Content that becomes unavailable is shown **in place** with a neutral explanatory state, never silently removed. |
| **Because** | No Phase-1 requirement defines Student notifications (FRD 9.4.2 is Phase 3 and institution-facing). Silent removal after ERP sync (7.2.1) would read as data loss. |
| **Question** | Q-20 |
| **Reversal cost** | Low |
| **Harm if wrong** | A Student learns of changes only on their next visit |

---

### A-21 — Blank FRD page

| | |
|---|---|
| **Assumption** | Blank page 12 is a PDF export artefact, not missing content. |
| **Because** | Section 7 closes cleanly on page 11, Section 8 opens cleanly on page 13, and numbering runs continuously 7.4.2 → 8.1.1. |
| **Question** | Q-21 |
| **Reversal cost** | Potentially high if content is genuinely missing |
| **Harm if wrong** | An entire requirement section absent from the analysis. Trivial to verify. |

---

### A-23 — MCQ answer model

| | |
|---|---|
| **Assumption** | MCQ questions are **single-select** — one correct answer, radio semantics. |
| **Because** | D-06's scoring (+2 / −1 / 0) has no defined partial-credit rule, which single-select does not require and multi-select would. "Standard MCQ" (FRD 5.2.1) conventionally means single-answer. |
| **Question** | Q-23 |
| **Reversal cost** | Low — a component variant |
| **Harm if wrong** | Multi-answer questions cannot be represented, and the scoring model would need a partial-credit rule |

---

### A-24 — Descriptive answer result state

| | |
|---|---|
| **Assumption** | An assessment containing descriptive questions (FRD 5.2.3) produces an explicit **"Submitted — awaiting evaluation"** result rather than a score. Module completion for such a module is **pending**, not failed, until evaluation returns. |
| **Because** | Free text cannot be machine-scored and no Phase-1 grading workflow exists. D-08 gates the next module on *passing*, so an unevaluated assessment would otherwise lock a Student out indefinitely through no fault of their own. |
| **Question** | Q-24 |
| **Reversal cost** | Low — a result variant plus one module state |
| **Harm if wrong** | Wording may not match the eventual grading turnaround |
| **Note** | D-06's initial model is MCQ-only, so this state may not be reachable in the first release. It is designed because FRD 5.2.3 remains a Phase-1 requirement. |

---

### A-26 — Stream visibility

| | |
|---|---|
| **Assumption** | The Student's academic stream is displayed **read-only** in their profile where available. |
| **Because** | Stream determines entitlements (FRD 7.2.3, 6.2.1). Showing it lets a Student understand their content set and recognise an ERP mapping error; read-only prevents self-granted entitlements. |
| **Question** | Q-26 |
| **Reversal cost** | Low |
| **Harm if wrong** | Minor over-disclosure of an attribute the Student already knows |

---

### A-27R — Restricted-state content

| | |
|---|---|
| **Assumption** | Four distinct restricted states, each with its own explanation and next step: (1) institutional licence cap reached (FRD 6.2.2) · (2) no entitlements assigned (7.2.3) · (3) licence validation failed at launch (10.1.2, 2.2.2) · (4) **module locked by sequence** (D-07). B2B states direct to the institution administrator; B2C states direct to Explore or support. **No purchase prompt appears in a B2B licence-cap state.** |
| **Because** | D-18 confirms the obligation; the FRD describes none of the cases. A Student who cannot influence the cause must at minimum be told who can. |
| **Question** | Q-27 |
| **Reversal cost** | Low — copy and routing per state |
| **Harm if wrong** | Wording may not match actual support processes |

---

### A-28R — Progress metrics

| | |
|---|---|
| **Assumption** | Progress shows module completion (FRD 11.1.1), assessment scores and attempt history (11.2.1, 11.2.2), and course-level **time spent** (11.1.2). Time spent is **not** shown per session or per module. |
| **Because** | Progress as a destination is now confirmed by the Review-002 IA, so only the *metric set* remains assumed. Restricting time-spent granularity avoids a surveillant reading of data collected mainly for institutional analytics, and honours C-04's ban on vanity analytics. |
| **Question** | Q-28 (rescoped) |
| **Reversal cost** | Low |
| **Harm if wrong** | A metric the Student wanted is missing, or one they found intrusive is present |

---

### A-29R — Password reset

| | |
|---|---|
| **Assumption** | A standard password-reset path is included, flagged in all artefacts as **design-supplied, not FRD-derived**. It is unavailable for SSO-authenticated accounts, where recovery belongs to the identity provider. |
| **Because** | The FRD mandates password authentication (4.1.1, 10.2.1) but never provides recovery — without reset, a Student who forgets a password is permanently locked out. Logout is no longer assumed: the Review-002 IA places it under Account. |
| **Question** | Q-29 (rescoped to reset only) |
| **Reversal cost** | Low |
| **Harm if wrong** | A duplicate recovery path alongside an institutional one |

---

### A-32 — Localization

| | |
|---|---|
| **Assumption** | English-only, single locale. **However**, layouts are built with **text-expansion tolerance**, and currency/date formatting is centralised rather than hard-coded. |
| **Because** | No FRD localization requirement exists, but Phase 1 plans for global learners (FRD 9.1.2, 1.3.3) — and D-04 now puts real prices in front of them. Tolerance costs nothing now and preserves the option. |
| **Question** | Q-32 |
| **Reversal cost** | Low **with** the tolerance measure; High without it |
| **Harm if wrong** | Non-English learners unserved; the tolerance measure is what keeps the fix cheap |

---

### New in Review 002

---

### A-34 — PDF resource completion rule

| | |
|---|---|
| **Assumption** | A PDF is complete when the Student **opens it and then explicitly marks it complete**. Opening alone does not complete it. Download never completes it (D-08). |
| **Because** | D-08 delegates this choice ("opened/viewed or manually marked complete according to final UX implementation"). Open-alone is unreliable — a mis-click would silently satisfy a gate that unlocks the next module (D-07). An explicit action is honest, auditable, and takes one click. The **Mark as complete** control is disabled until the document has actually been opened, so it cannot be satisfied without engagement. |
| **Question** | Q-39 |
| **Reversal cost** | Low — a control and one state |
| **Harm if wrong** | One extra click per PDF. The alternative failure — auto-completing a resource the Student never read, then unlocking the next module — is materially worse. |

---

### A-35 — Hint model

| | |
|---|---|
| **Assumption** | **One hint per question**, available at any time during the attempt. Requesting it is **irreversible for that question in that attempt** and is confirmed before it applies. Hint state does not carry across attempts — a fresh attempt restores +2 eligibility for every question. Hints are unlimited across the assessment (a Student may hint all 10 questions). |
| **Because** | D-06 defines hint *scoring* but not hint *availability*. One-per-question is the simplest model consistent with the stated scoring, which has exactly two correct-answer values (+2, +1) and therefore no room for graduated multi-hint penalties. Confirmation before applying is required because the cost is silent and permanent. |
| **Question** | Q-38 |
| **Reversal cost** | Low — a counter and a confirmation step |
| **Harm if wrong** | Students get more or fewer hints than intended |

---

### A-36 — Video completion measurement

| | |
|---|---|
| **Assumption** | The ≈90% threshold (D-08) measures **cumulative unique playback coverage**, not furthest playhead position. Scrubbing to the end does not complete a video. Resume position is stored separately from coverage. |
| **Because** | D-08 gates module progression on video completion (D-07). Furthest-position measurement is satisfied by a single drag of the scrubber, which would make the gate meaningless. Coverage-based measurement is the only reading that makes the 90% figure mean anything. |
| **Question** | Q-40 |
| **Reversal cost** | Medium — it is a tracking-model requirement, so it must reach engineering early |
| **Harm if wrong** | Either the gate is trivially bypassable, or students who legitimately skip a known section are blocked |

---

### A-37 — Commerce presentation

| | |
|---|---|
| **Assumption** | Prices display in **INR (₹)** with an explicit tax line reading "Inclusive of applicable taxes" **only if confirmed**; otherwise the checkout shows a neutral "Taxes calculated at checkout" line. Payment uses a **generic secure gateway redirect** pattern (C-05). No card fields are ever rendered in our UI. No coupon field (FRD 6.4 is Phase 2). No saved cards, no subscriptions, no refunds UI. |
| **Because** | FRD 9.1.1 names Indian gateways first and 9.1.2 adds international, so INR is the safest default; C-05 forbids inventing the gateway. Rendering card fields ourselves would imply a PCI scope decision nobody has made. |
| **Questions** | Q-34 (gateway), Q-35 (currency/tax), Q-36 (invoice), Q-37 (refunds) |
| **Reversal cost** | Low–Medium — a redirect pattern converts to embedded fields without restructuring the flow |
| **Harm if wrong** | Currency or tax presentation is wrong for some buyers — a compliance-adjacent risk, which is why Q-35 is High priority |

---

### A-38 — Home content set

| | |
|---|---|
| **Assumption** | Home contains, in priority order: **Continue Learning** (single primary resumption target) · **Recent Learning** (up to 3) · **Current Progress** (compact, course-level) · **Needs Attention** (only when a failed assessment or locked-by-failure module exists). Home shows **no charts** and no metric tiles beyond a course-count and completion summary. |
| **Because** | D-10 makes resumption a first-class goal; the Review-002 IA prefers a lightweight Home only where it materially reduces Student effort, and explicitly forbids an analytics-heavy vanity dashboard. "Needs Attention" is conditional so Home stays empty of noise for a Student in good standing. |
| **Question** | Q-41 |
| **Reversal cost** | Low — module composition on one screen |
| **Harm if wrong** | Home is slightly over- or under-populated; the IA does not change |

---

### A-39 — Web simulation presentation

| | |
|---|---|
| **Assumption** | The Student-facing behaviour is designed **without depending on the technical container**. The design assumes only: a dedicated full-width learning context, a designed loading state, an explicit exit that returns to the module, and preserved session continuity. Whether this is realised as an embedded frame, a full-page application, or a separate browser route is left to engineering. |
| **Because** | Correction H explicitly forbids assuming embedding. All three patterns satisfy the same Student-facing contract, so the design specifies the contract rather than the container. |
| **Question** | Q-16 (rescoped) |
| **Reversal cost** | Low for the contract; the *return path* differs materially between patterns, so it is specified as a requirement rather than a mechanism |
| **Harm if wrong** | If a separate browser context is chosen, the return path and session continuity need engineering attention — flagged rather than designed around |

---

### A-40 — Simulation completion signal

| | |
|---|---|
| **Assumption** | The LMS treats simulation completion as an **event returned by the simulation/platform** (D-08), not as anything the Student self-reports. Where no completion event arrives, the module shows simulation as **not complete** and offers a retry — it does **not** offer a manual override. |
| **Because** | D-08 states the rule; the failure case is undefined. A manual override would let a Student unlock the next module (D-07) without running the simulation, defeating the gate. |
| **Question** | Q-42 |
| **Reversal cost** | Low — one state |
| **Harm if wrong** | A Student blocked by a telemetry failure has no self-service recovery and must contact support. This is a real risk and is why Q-42 is raised rather than buried. |

---

### A-41 — Assessment autosave

| | |
|---|---|
| **Assumption** | Answer selections persist on every change, plus on navigation between questions. Timer state is **server-authoritative** — a page reload or re-authentication resumes the same attempt with the remaining time, not a fresh 20 minutes. |
| **Because** | D-17 requires that expiry not destroy answers and that an attempt not be consumed by an auth timeout. A client-authoritative timer would make the 20-minute limit (D-06) trivially resettable by reloading. |
| **Question** | Q-43 |
| **Reversal cost** | Medium — a tracking and state-ownership requirement for engineering |
| **Harm if wrong** | Either lost answers or a defeatable timer |

---

### A-42 — How the desktop LMS learns that a device completion happened

| | |
|---|---|
| **Assumption** | The desktop reads the platform's recorded completion state **on navigation / page load**. In addition, XR simulation panels carry an explicit **"Check for updates"** control that re-reads server state on demand. **No live push channel, no background polling, and no device-to-browser handoff is assumed or depicted.** |
| **Because** | D-19 makes completion account-level but deliberately forbids inventing cross-device mechanisms. Re-reading server state is not a new mechanism — it is an ordinary fetch. It gives a Student who has just taken off a headset a way to see their progress without waiting or guessing, using only capability that must already exist. |
| **Question** | Q-49 |
| **Reversal cost** | **Low** — if the platform later pushes completion events, the manual control becomes redundant and is removed; nothing else changes. |
| **Harm if wrong** | A Student may need one extra click, or may see stale state until they navigate. Both are recoverable and visible, unlike silent staleness. |

---

### A-43 — Module state while a device completion is outstanding

| | |
|---|---|
| **Assumption** | A module whose only outstanding requirement is an XR simulation displays as **"Awaiting device completion"** — a labelled variant of *In Progress*, **not** a seventh module state and **not** a blocked or error state. The completion checklist shows the simulation row as outstanding with the device named. |
| **Because** | D-19 removes the dead end, so the state must not read as a failure. Reusing *In Progress* with a qualifier avoids expanding the six-state model (IA §9) that every list, badge, and filter depends on — the smallest change that carries the meaning. |
| **Question** | Q-49 |
| **Reversal cost** | **Low** — a label variant, not a state-machine change |
| **Harm if wrong** | The qualifier may be unnecessary if the platform records completion fast enough to be effectively instant |

---

### A-44 — Commercial figures are **sample data**

| | |
|---|---|
| **Assumption** | Every price shown in any artefact — **₹999, ₹1,499, ₹2,499** — is **fictional sample data for layout purposes only**. No price, price band, currency, or tax treatment is approved. The tax line reads "Calculated at checkout" and states no rate, inclusion, or exclusion. |
| **Because** | D-04 puts commerce in scope but no requirement sets a price, and FRD 9.3.1 (GST-compliant invoicing) is **Phase 2 and institution-facing**, leaving Phase-1 B2C tax presentation entirely undefined. Sample figures are needed to design a price panel; presenting them as approved would be inventing commercial policy. |
| **Questions** | Q-35 currency/tax · Q-53 licence duration |
| **Reversal cost** | **Nil** — they are placeholders and labelled as such in every document |
| **Harm if wrong** | Only if someone mistakes them for approved pricing, which is why this assumption exists and why the artefacts say so on their face |

---

### A-45 — Social login providers are **sample placeholders**

| | |
|---|---|
| **Assumption** | **Google** and **Microsoft** appear as illustrative provider placeholders. Neither is confirmed. The B2C login layout accommodates **two to four** providers without structural change. |
| **Because** | FRD 4.1.2 permits social login but enumerates no providers. These two are the most plausible for an Indian engineering-education context, which makes them useful for layout and misleading if left unlabelled. |
| **Question** | Q-55 |
| **Reversal cost** | **Low** — button labels and icons; the layout already flexes |
| **Harm if wrong** | Real provider brand guidelines impose specific button treatments, so final visuals will need a pass once providers are chosen |

---


### A-48 — Access-duration display is data-driven

| | |
|---|---|
| **Assumption** | The product-detail price panel, the payment result, and My Learning each carry a **conditional access-duration slot**. It renders **only** when authoritative entitlement data supplies a value — as `Access until <date>` or `No expiry`. **When no data is present the slot renders nothing at all** — no placeholder, no "unlimited", no em-dash. Sample designs therefore show only **"One-time purchase"**. |
| **Because** | D-24 forbids a universal duration promise *and* forbids inventing either state. A slot that collapses when empty is the only treatment satisfying both: it can display truth when truth exists, and stays silent when it does not. |
| **Question** | Q-53 *(commercial values still open)* |
| **Reversal cost** | **Nil** — the slot already exists; supplying data fills it |
| **Harm if wrong** | None. The failure mode of a collapsing slot is silence, which is exactly what D-24 requires in the absence of data. |

---

### A-49 — Per-question review presentation

| | |
|---|---|
| **Assumption** | The result screen lists every question as **number · outcome (Correct / Incorrect / Unanswered) · hint-used marker**, and nothing more. Rows are **not expandable**, carry **no link back to the question**, and show **no stem, no option text, and no answer**. Outcome is icon + word, never colour alone. |
| **Because** | D-25 permits correctness and prohibits the key. A non-expandable row makes the prohibition **structural rather than a matter of restraint** — there is no disclosure affordance to leak through, and no later "just show the stem" pressure point. Linking back to the question would re-expose option text, which under unlimited attempts is the key by elimination. |
| **Question** | — (D-25 confirmed; this is presentation detail) |
| **Reversal cost** | **Low** — if review is later widened, rows gain disclosure |
| **Harm if wrong** | A Student may want more detail than they get. That is the intended trade under unlimited attempts. |

---

## Reversal-cost summary

| Cost | Assumptions | Implication |
|---|---|---|
| **Medium–High** | A-18R | Confirm before shell design |
| **Medium** | A-36, A-37, A-41 | Involve **engineering**, not only the manager — tracking and state-ownership models |
| **Low** | A-06R, A-11, A-12, A-14, A-15R, A-19, A-20, A-23, A-24, A-26, A-27R, A-28R, A-29R, A-32, A-34, A-35, A-38, A-39, A-40, A-42, A-43, A-44, A-45, A-48, A-49 | Safe to carry into build |
| **Conditional** | A-21 | Low likelihood, high consequence, trivial to verify |

**A-32 remains cheap only if adopted now** — text-expansion tolerance is a design-time property.

---

## Change log

| Date | Review | Change |
|---|---|---|
| 2026-08-10 | 001 | Register created with A-01, A-04 – A-33. |
| 2026-08-10 | 002 | 12 assumptions retired as confirmed decisions; A-27 partially retired. A-06/15/18/27/28/29 revised (suffix R). A-34 – A-41 added. **31 → 27.** |
| 2026-08-10 | 003 | A-42, A-43 added following D-19 (account-level simulation completion). **27 → 29.** |
| 2026-08-10 | 004 | A-44 – A-47 added (sample data, sample providers, sign-neutral score, licence duration). **29 → 33.** |
| 2026-08-10 | **005** | **A-10, A-46, A-47 retired** as confirmed decisions (D-25, D-23, D-24). **A-48, A-49 added.** **33 → 30.** None confirmed. |
