# Phase-1 Student Requirements — Extracted from FRD v4

**Document status:** Living document
**Created:** 2026-08-10
**Source:** `source/Platform FRD_v4.pdf` — all 17 pages read (Review 001)
**Scope filter:** Requirements that **directly or indirectly** affect the Phase-1 **Student** **desktop LMS web** experience.

---

---

# ⚠️ Review 002 reclassification — read this first

The confirmed decisions **D-01 – D-18** changed the classification of 17 requirements. The section tables below were written at Review 001 and are **superseded for these rows only**. Everything not listed here stands as written.

| FRD | Review 001 said | **Review 002 classification** | Driver |
|---|---|---|---|
| 1.1.3 | Indirect / conditional — B2C deferred | **Yes** — B2C is a first-class audience with Explore + commerce | D-01, D-04 |
| 1.2.2 | Yes (informational), ambiguity open | **Yes** — VR badge, device requirement, *Continue on Meta Quest* CTA | D-09 |
| 1.2.3 | Yes (informational), ambiguity open | **Yes** — MR badge, lab/shared-device guidance, *Continue on Ajna Lens* | D-09 |
| 1.2.4 | Yes (informational), ambiguity open | **Yes** — AR badge, QR/deep-link continuation, *Continue on Mobile* | D-09 |
| 3.1.2 | Yes, formats unspecified | **Yes** — formats confirmed as **PDF notes + instructional video**; required vs optional distinction added | D-05, D-08 |
| 3.2.2 | Yes, advisory (A-22) | **Yes — GATED.** Sequential unlock is mandatory; locked module state required | **D-07** |
| 4.2.2 | Yes, phase contradiction unresolved | **Yes** — SSO is **Phase 1**; preferred path for B2B | D-03 |
| 5.2.1 | Yes | **Yes** — 10 MCQs, +2 / −1 / 0, max 20 | D-06 |
| 5.3.1 | Indirect | **Yes** — unlimited attempts, attempt history displayed | D-06 |
| 5.3.2 | Yes, disclosure assumed | **Yes** — disclosure is **mandatory** pre-attempt, alongside timer, pass mark, and hint impact | D-06 |
| 6.1.1 | Deferred | **Yes** — individual module purchase, B2C only | **D-04** |
| 6.1.2 | Deferred | **Yes** — bundle purchase, B2C only | **D-04** |
| 9.1.1 | Deferred | **Yes** — payment via generic secure gateway redirect (C-05) | **D-04** |
| 9.1.2 | Deferred | **Yes** — same surface; currency/tax open (Q-35) | **D-04** |
| 9.2.1 | Deferred | **Yes** — licence activation confirmed on the payment result screen | **D-04** |
| 9.2.2 | Indirect | **Yes** — purchased entitlements land in My Learning; *Start Learning* CTA from payment result | **D-04** |
| 10.2.2 | Yes, handling assumed | **Yes** — warn, autosave, resume in context, **never consume an attempt** | **D-17** |
| 11.1.1 | Yes, trigger undefined | **Yes** — completion = required resources + simulation + assessment **passed** | **D-08** |
| 11.2.2 | Indirect | **Yes** — attempt history is Student-visible on assessment result and progress | D-06 |

**Two new cross-cutting obligations** apply to every screen and are not tied to a single FRD row:

- **D-11** — WCAG 2.2 AA across all screens, states, and components
- **D-18** — every error, empty, and restricted state must say *what happened* and *what to do next*

---

## How to read this document

### Scoping method

The FRD does not define global project phases. Each of its 12 sections independently subdivides into Phase 1 / Phase 2 / Phase 3. "Phase 1 only" is therefore interpreted as **the union of the Phase-1 subsection of all 12 sections** (assumption A-01). Phase-2 and Phase-3 requirements are excluded from the tables below, except where a Phase-1 requirement cannot be understood without naming its later-phase counterpart — those appear in §14 as *phase-boundary notes*.

### Column definitions

| Column | Meaning |
|---|---|
| **FRD** | Section / requirement number |
| **Requirement summary** | Faithful compression of the FRD text. No added intent. |
| **Why it matters to Student UX** | The causal link to the Student's desktop experience — including indirect links |
| **Likely UI implication** | The design consequence, stated as a hypothesis to be validated, not a decision |
| **Screen?** | Does this require a visible Student screen or screen region? |
| **Backend only?** | Is this purely system behavior with no Student-visible surface? |
| **Ambiguity** | What the FRD leaves undefined, with a cross-reference to `OPEN_QUESTIONS.md` |

### Screen? / Backend only? values

- **Yes** — requires a dedicated Student-visible screen or a distinct region of one
- **Indirect** — no screen of its own, but it constrains, gates, or populates a screen
- **State** — surfaces only as a state (loading / empty / error / restricted) within another screen
- **No** — no Student-visible surface in Phase 1

> **No requirement in this document has been invented.** Every row traces to explicit FRD text. Where a design gap exists, it is recorded as an ambiguity and escalated to `OPEN_QUESTIONS.md` — not filled in with a plausible-sounding requirement.

---

## 1. Section 1 — Platform Overview · Phase 1: Core Platform Architecture

| FRD | Requirement summary | Why it matters to Student UX | Likely UI implication | Screen? | Backend only? | Ambiguity |
|---|---|---|---|---|---|---|
| **1.1.1** | Multi-tenant SaaS LMS distributing XR-based engineering simulation modules to **both** institutions and individual learners | Defines the product the Student logs into. The dual audience means one Student UI may have to serve two materially different entitlement models. | A single Student shell that can render either institution-assigned or self-acquired entitlements without structural divergence | Indirect | No | Which audience the *first* design targets is unresolved — **Q-01** |
| **1.1.2** | B2B institutional environment; organizations purchase licenses; students and faculty access under a shared institutional subscription | The institutional Student never transacts. Entitlements arrive from above. Price, cart, and purchase have no place in this variant. | No commerce surfaces; entitlements presented as pre-assigned; institution identity likely visible | Indirect | No | Whether the institutional Student is the first design target — **Q-01** |
| **1.1.3** | B2C environment; individual learners independently purchase modules or packages and access via personal accounts | The individual Student *must* discover and acquire content before any learning surface has anything in it. Implies catalog + purchase. | Catalog / browse surface and purchase path — **only if B2C is in the first milestone** | Indirect | No | Manager has excluded assuming checkout into milestone 1 — **Q-01, Q-04** |
| **1.1.4** | All XR modules remain owned and governed by the platform owner; not modifiable or redistributable by institutions | Content is fixed and authoritative. The Student sees a canonical module, identical across institutions. | No student-side content editing, download, export, or sharing affordances | No | Yes | Whether any offline access is permitted at all — not stated |
| **1.2.1** | **Web simulation support** — browser-based simulations that run in standard web environments without XR hardware | **The single most important Phase-1 Student requirement.** This is the only simulation format a desktop Student can actually execute. | A web-simulation launch and runtime container inside the LMS | **Yes** | No | Launch target (embedded frame vs new tab/window), viewport requirements, and exit/return behavior are all undefined — **Q-06, Q-16** |
| **1.2.2** | VR simulation support via VR headsets (e.g. Meta Quest) | The desktop Student may hold entitlements they cannot run at their desk. Silence would look like a broken product. | Non-launchable module presentation: format badge, hardware requirement, access instructions | **Yes** (informational) | No | The FRD never specifies what the LMS tells a Student about a VR module — **Q-17** |
| **1.2.3** | MR simulation support for MR hardware (e.g. Ajna Lens) | Same as VR. MR additionally runs via a *sideloaded* app (2.1.2), which is not a self-service path. | Same informational treatment; likely "contact your institution" rather than a store link | **Yes** (informational) | No | Sideloading is administratively gated; the Student's route to access is undefined — **Q-17** |
| **1.2.4** | AR simulation support on Android and iOS mobile devices | A desktop Student may need to move to a phone to consume an entitled module. | Cross-device handoff information | **Yes** (informational) | No | No handoff mechanism is specified anywhere in the FRD — **Q-17** |
| **1.3.1** | Tenant-wise database isolation across user records, analytics, licensing, and course mapping | Guarantees the Student only ever sees their own institution's data. Removes any need for tenant-selection UI. | No tenant switcher; institutional context is implicit and fixed after login | Indirect | Yes | Whether a Student can belong to more than one tenant is not addressed — **Q-18** |
| **1.3.2** | B2C users maintained in a database environment separate from institutional databases | Reinforces that a B2C and a B2B identity are distinct. | A person who is both an institutional student and an individual buyer may need two accounts | Indirect | Yes | Account linking / dual identity is entirely unaddressed — **Q-18** |
| **1.3.3** | Support for additional regional B2C database instances to reduce latency | Only reaches the Student as perceived performance. | Performance budgets; no UI | No | Yes | — |
| **1.3.4** | Analytics limited to the institution's own tenant dataset | Constrains any comparative or cohort framing in Student-facing progress. | Progress displays are personal; no cross-institution benchmarking | Indirect | Yes | Whether *within*-cohort comparison is permitted for a Student is not stated |
| **1.3.5** | Super Admin has controlled cross-tenant access for governance | No Student surface. Recorded for completeness. | None | No | Yes | — |
| **1.4.1** | Vendors submit XR module builds through a staging environment | Determines that Students only ever encounter reviewed content. | None directly | No | Yes | — |
| **1.4.2** | All submitted modules undergo BITS Pilani academic validation | A potential trust signal, but the FRD never says it is displayed. | Possible provenance indicator — **not to be added without confirmation** | No | Yes | Whether validation status is student-visible is unstated — **Q-19** |
| **1.4.3** | Content Manager approves metadata, documentation, and compatibility before publication | Implies module metadata and documentation exist as first-class content the Student may consume. | Module detail screen has a defined metadata region | Indirect | No | The metadata schema is never enumerated — **Q-06** |
| **1.4.4** | Only Super Admin publishes approved modules to production | Only *published* modules can appear to a Student. | Catalog and entitlement lists filter to published state | Indirect | Yes | — |
| **1.4.5** | Third-party vendors have no direct publishing rights | No Student surface. | None | No | Yes | — |

---

## 2. Section 2 — XR Content Delivery Architecture · Phase 1: Core XR Delivery Infrastructure

| FRD | Requirement summary | Why it matters to Student UX | Likely UI implication | Screen? | Backend only? | Ambiguity |
|---|---|---|---|---|---|---|
| **2.1.1** | A centralized master VR application on the Meta Quest Store acts as the container for downloading and launching XR modules | The desktop LMS is **not** the launch point for VR. The Student must be told where the real entry point is. | VR module info includes "launch happens in the master VR app"; possible store reference | **Yes** (informational) | No | Whether the LMS links to the store, names the app, or shows install steps is undefined — **Q-17** |
| **2.1.2** | MR simulations run through a sideloaded application on Ajna Lens devices | Sideloading is not self-service. An institutional Student cannot act on this alone. | MR module info directs the Student to institutional support rather than a self-service action | **Yes** (informational) | No | The Student's actual route to an MR session is unspecified — **Q-17** |
| **2.2.1** | Simulation modules packaged as encrypted asset bundles, dynamically downloaded by the master XR application | Explains XR-side latency; no desktop surface. | None on desktop | No | Yes | Whether *web* simulations use the same bundle mechanism — and therefore have a download wait — is not stated — **Q-16** |
| **2.2.2** | Modules download only **after license validation is confirmed** | Entitlement is enforced at access time, so the Student can encounter a licensed/unlicensed boundary. | A restricted / not-licensed state is required wherever a module can be reached | **State** | No | Whether the *web* simulation path performs the same validation is not stated — **Q-16** |
| **2.3.1** | The XR application automatically downloads updated module versions | Device-side behavior. | None on desktop | No | Yes | — |
| **2.3.2** | Super Admin controls when new versions release to production | Content may change beneath a Student mid-course. | Possible version or updated-on indicator; not required by the FRD | No | Yes | Student notification of content change is unaddressed — **Q-20** |
| **2.3.3** | Modules update independently of the master XR application | Device-side behavior. | None on desktop | No | Yes | — |
| **2.4.1** | B2C individual licenses bound to a specific encrypted XR device ID **and** a user account | A B2C Student has a device-binding relationship that must be visible somewhere to be managed. | Possible device/licence region in account settings — B2C only | Indirect | No | The FRD never says the LMS displays the bound device — **Q-14** |
| **2.4.2** | Device replacement requires Super Admin approval before license transfer | Strongly implies a Student-initiated request that a Super Admin acts on. The FRD never names the request surface. | A device-replacement request flow may be required — **not to be designed without confirmation** | Indirect | No | Who initiates, and through which interface, is unspecified — **Q-14** |
| **2.4.3** | Institutional deployments allow multiple students to access simulations on shared XR devices | Institutional Students share hardware; no personal device binding. | No device management UI in the institutional variant | Indirect | Yes | — |
| **2.4.4** | Institutional students must log into the XR application **using their LMS credentials** | The LMS is the identity provider for the XR device. LMS credentials therefore carry weight beyond the browser. | Credential clarity matters more than usual; SSO-only accounts may have no password to type into a headset | Indirect | No | **Significant:** if the institution uses SSO (4.2.2), what does the Student enter on the headset? Unresolved — **Q-02, Q-14** |

---

## 3. Section 3 — Content Organization & Learning Structure · Phase 1: Core Learning Structure

| FRD | Requirement summary | Why it matters to Student UX | Likely UI implication | Screen? | Backend only? | Ambiguity |
|---|---|---|---|---|---|---|
| **3.1.1** | A module is the smallest learning unit and contains **a single XR simulation experience** | Fixes the atomic unit of the entire Student IA. One module = one simulation. | Module detail screen is the primary destination of the learning path | **Yes** | No | — |
| **3.1.2** | Modules **may** include supporting material: theoretical explanations, simulation instructions, and assessments | "May" is decisive: all three are **optional**. A module can be simulation-only. | Module detail must render gracefully with any subset present, including none | **Yes** | No | Formats, length, and media types of the material are entirely undefined — **Q-05** |
| **3.2.1** | A course is a collection of modules grouped around an engineering topic or learning objective | Establishes the container the Student navigates through to reach modules. | Course detail screen listing member modules | **Yes** | No | — |
| **3.2.2** | Courses define the **recommended** sequence in which modules must be completed | "Recommended" and "must be completed" sit uneasily in one sentence. Whether sequence is advisory or enforced changes the interaction model completely. | Ordered module list; gating **only if** sequence is enforced | **Yes** | No | **Direct internal tension in a single requirement** — advisory ordering vs hard prerequisites — **Q-22** |
| **3.3.1** | Certification programs consist of one or more courses in a structured learning pathway | Adds a level above Course. If surfaced, the Student's hierarchy is three deep, not two. | Possible program-level container in navigation | Indirect | No | Whether a Phase-1 Student ever sees a program — **Q-12** |
| **3.3.2** | Students **shall receive certification** upon completing all required courses and meeting minimum assessment performance thresholds | An outcome is promised to the Student in Phase 1, yet no Phase-1 surface is defined to deliver it. Student-facing certification *tracking* is Phase 3 (3.5.1). | Either a minimal certification outcome surface, or explicit deferral | Indirect | No | "Minimum assessment performance thresholds" is **never quantified anywhere in the FRD** — **Q-09, Q-12** |

---

## 4. Section 4 — User Management & Onboarding · Phase 1: Core User Access

| FRD | Requirement summary | Why it matters to Student UX | Likely UI implication | Screen? | Backend only? | Ambiguity |
|---|---|---|---|---|---|---|
| **4.1.1** | Users **shall** be able to create accounts using email registration | The default self-service entry to the platform. | Registration screen with email verification | **Yes** | No | Applies to institutional students too, or B2C only? Conflicts with 7.2.2 — **Q-03** |
| **4.1.2** | Users **may** register using supported social login providers | "May" = optional. Providers are never enumerated. | Social login buttons on login/registration — provider set unknown | Indirect | No | Which providers; whether in the first milestone at all — **Q-02** |
| **4.2.1** | Institutions register their organization through an institutional onboarding interface | Institution-facing, not Student-facing; excluded by D-02. Recorded because it precedes any institutional Student's existence. | None in Student scope | No | No (out of role scope) | — |
| **4.2.2** | Institutions **shall** be able to configure SSO through supported identity providers | If the Student's institution uses SSO, the login screen is fundamentally different — no password field, an IdP redirect instead. | Login screen must support an SSO/redirect path | **Yes** | No | **Contradiction:** listed here in Phase 1, but FRD 7.4.1 places SSO in Phase 3 — **Q-02** |
| **4.3.1** | Users shall provide profile details including **academic institution, specialization, and learning preferences** | The only definition of Student profile content in the FRD. Directly drives the profile screen. | Profile setup and profile edit screens with these three field groups | **Yes** | No | For an ERP-provisioned student, institution is already known — is the field editable, prefilled, or locked? **Q-11.** Also: "learning preferences" has **no Phase-1 consumer** — **Q-15** |

---

## 5. Section 5 — Learning Experience Features · Phase 1: Assessment System

Note: FRD 5.1.1 and 5.1.2 are **Faculty** capabilities. They are included because they determine the shape of what the Student receives.

| FRD | Requirement summary | Why it matters to Student UX | Likely UI implication | Screen? | Backend only? | Ambiguity |
|---|---|---|---|---|---|---|
| **5.1.1** | Faculty upload quiz question banks via structured spreadsheet templates | The Student's questions originate from a bulk template, so question content may lack rich formatting or media. | Question rendering should assume plain text unless confirmed otherwise | Indirect | No | Whether questions can contain images, formulae, or code — **Q-05** |
| **5.1.2** | Faculty may generate assessment questions using integrated AI tools | Faculty-side authoring. No Student surface; explicitly not a Student AI feature. | None | No | Yes (Faculty scope) | Whether AI-generated questions are labelled to the Student — not stated |
| **5.2.1** | System supports MCQ assessments | Defines a required Student answer interaction. | Single/multi-select question component | **Yes** | No | Single-answer vs multi-answer MCQ is not distinguished — **Q-23** |
| **5.2.2** | System supports True/False questions | Second required answer interaction. | Binary choice component | **Yes** | No | — |
| **5.2.3** | System supports **short descriptive answer** questions | A free-text answer cannot be auto-scored. This creates a *pending result* state the FRD never acknowledges. | Text-entry component **plus** an ungraded/awaiting-evaluation result state | **Yes** | No | **Significant gap:** no descriptive grading workflow exists in Phase 1, so a submitted assessment may have no score — **Q-24** |
| **5.3.1** | Quiz questions **may be randomized for each attempt** | The phrase "each attempt" is the FRD's only confirmation that **multiple attempts exist**. Randomization also undermines any answer-key review across attempts. | Attempt-aware assessment presentation | Indirect | No | Attempt limits are never defined — **Q-07** |
| **5.3.2** | Faculty can enable **negative marking** for incorrect responses | A student penalised for guessing must be told before answering. Disclosing it only in results would be a fairness failure. | Pre-assessment disclosure of negative marking, when enabled | **Yes** | No | The FRD never requires disclosure to the Student — **Q-25** |

---

## 6. Section 6 — Licensing & Monetization · Phase 1: Licensing Models

| FRD | Requirement summary | Why it matters to Student UX | Likely UI implication | Screen? | Backend only? | Ambiguity |
|---|---|---|---|---|---|---|
| **6.1.1** | Users shall be able to purchase **individual simulation modules** | B2C only. Requires discovery, pricing, and checkout — all excluded from the first milestone by manager instruction (C-09). | Catalog + module purchase — **deferred pending Q-04** | Deferred | No | FRD says Phase 1; manager says unconfirmed — **Q-04** |
| **6.1.2** | Users shall be able to purchase **bundles** of multiple modules | Same as above, with a bundle as an additional purchasable object. | Bundle detail + purchase — **deferred pending Q-04** | Deferred | No | **Q-04** |
| **6.2.1** | Institutions purchase packages mapped to academic streams | Explains *why* an institutional Student sees the specific content they see: stream-derived, not self-chosen. | Entitlement list is fixed and non-negotiable; possible stream label | Indirect | Yes | Whether the Student is shown their stream — **Q-26** |
| **6.2.2** | Institutions may purchase **capped licenses based on maximum student count** | A cap can be exhausted. The Student then hits a wall the FRD never describes. | A license-unavailable / seat-cap restricted state | **State** | No | **Significant gap:** no defined behavior or message when a cap is reached — **Q-27** |

---

## 7. Section 7 — Enterprise Integrations · Phase 1: Core ERP Synchronization

| FRD | Requirement summary | Why it matters to Student UX | Likely UI implication | Screen? | Backend only? | Ambiguity |
|---|---|---|---|---|---|---|
| **7.1.1** | Support for academic ERP systems including Oracle ERP, Moodle-based environments, and others via standardized API | The Student's record originates externally, so parts of their profile are authoritative elsewhere. | Externally-sourced fields likely read-only | Indirect | Yes | Which fields are ERP-owned — **Q-11** |
| **7.1.2** | API endpoints allow ERP systems to push enrollment data, course mappings, and academic structure into the LMS | The Student's course list is *pushed*, not chosen. There is no self-enrollment for institutional students. | No enroll / join-course action in the institutional variant | Indirect | Yes | Whether any self-enrollment exists at all — **Q-03** |
| **7.2.1** | Scheduled ERP synchronization at configurable intervals updates student records and course assignments | A Student's courses can appear or disappear between sessions without any action by them. | Content changes must not read as an error; possible "updated by your institution" framing | **State** | No | Sync latency and whether the Student is informed — **Q-20** |
| **7.2.2** | Student accounts are **automatically created** when records arrive from ERP synchronization | The institutional Student may already exist before they ever visit. First contact is a *first login*, not a registration. | First-login / account-activation path rather than a signup form | **Yes** | No | **Direct tension with 4.1.1 email registration, both Phase 1** — **Q-03** |
| **7.2.3** | Students automatically assigned simulation packages based on academic stream from ERP | Entitlements are derived, not selected. Confirms the institutional Student's learning home is pre-populated. | Entitlement list rendered as assigned content | Indirect | Yes | What the Student sees if their stream maps to zero modules — empty-state gap — **Q-27** |

---

## 8. Section 8 — Administration & Role Management · Phase 1: Core Administrative Roles

| FRD | Requirement summary | Why it matters to Student UX | Likely UI implication | Screen? | Backend only? | Ambiguity |
|---|---|---|---|---|---|---|
| **8.1.5** | **Student role: access licensed modules, complete simulations, and view personal learning progress** | **The defining requirement of this assignment.** It authorizes exactly three Student capabilities and is the primary test for whether any proposed navigation item belongs in Phase 1. | Global navigation must be justifiable against these three capabilities plus profile (4.3.1) | **Yes** | No | Does not state whether progress is a distinct destination or embedded within learning surfaces — **Q-28** |
| 8.1.1–8.1.4 | Super Admin, Content Manager, Institute Admin, Faculty role definitions | Out of role scope (D-02). Recorded because they establish that the Student is the least-privileged role — every restricted state must be designed from the Student's viewpoint. | Restricted/permission states designed for the least-privileged role | Indirect | Yes | — |

---

## 9. Section 9 — Payment & Billing · Phase 1: Core Payment Processing

| FRD | Requirement summary | Why it matters to Student UX | Likely UI implication | Screen? | Backend only? | Ambiguity |
|---|---|---|---|---|---|---|
| **9.1.1** | Support for major Indian payment gateways | B2C only; deferred by C-09. | Deferred | Deferred | No | **Q-04** |
| **9.1.2** | Support for international payment gateways for global individual learners | B2C only; deferred by C-09. Implies currency and locale variation if ever built. | Deferred | Deferred | No | **Q-04** |
| **9.2.1** | Licenses automatically activate upon successful payment and link to the user account | B2C entitlement timing. If deferred, no Phase-1 surface. | Deferred | Deferred | Yes | **Q-04** |
| **9.2.2** | Purchased modules/packages are **automatically assigned to the user's dashboard** | **The FRD's only Phase-1 use of the word "dashboard" for a learner** — and it appears in a B2C purchase context, not as a general navigation concept. Important evidence when evaluating whether a Student "Dashboard" nav item is FRD-justified. | Entitlements land in the Student's primary learning surface automatically | Indirect | No | "Dashboard" is never defined as a screen anywhere in the FRD — see IA analysis |

---

## 10. Section 10 — Security & Compliance · Phase 1: Core Platform Security

| FRD | Requirement summary | Why it matters to Student UX | Likely UI implication | Screen? | Backend only? | Ambiguity |
|---|---|---|---|---|---|---|
| **10.1.1** | All XR asset bundles encrypted before distribution | Reinforces no download/export affordances. | None | No | Yes | — |
| **10.1.2** | Modules require license validation **before execution** | A second, execution-time entitlement gate. The Student can be stopped at the moment of launch, not only at browse time. | Pre-launch validation state; a launch that can fail after being initiated | **State** | No | Failure messaging is undefined — **Q-27** |
| **10.2.1** | Platform enforces secure authentication protocols before granting access | Sets the baseline expectation for the login screen. | Login screen with secure-credential handling | **Yes** | No | Password policy, MFA, lockout, and — notably — **password reset are never mentioned anywhere in the FRD** — **Q-29** |
| **10.2.2** | **User sessions automatically expire after inactivity** | Directly Student-visible and potentially destructive: expiry during an in-progress assessment or simulation could discard work. | Session-expiry handling, re-authentication path, and in-progress work preservation | **Yes** | No | **Significant gap:** timeout duration undefined; behavior during an active assessment or simulation undefined; whether any warning precedes expiry undefined — **Q-30** |
| **10.3.1** | Periodic VAPT | No Student surface. | None | No | Yes | — |
| **10.3.2** | Vulnerabilities addressed through timely patches | Possible maintenance windows. | None defined | No | Yes | — |

---

## 11. Section 11 — Analytics & Reporting · Phase 1: Core Learning Analytics

These four requirements are the **only** defined sources of Phase-1 progress data. Any Student progress surface may display these and nothing more.

| FRD | Requirement summary | Why it matters to Student UX | Likely UI implication | Screen? | Backend only? | Ambiguity |
|---|---|---|---|---|---|---|
| **11.1.1** | System records **module completion status** for each learner | The primary progress signal, and the basis for any course-level completion roll-up. | Completion state on module and course surfaces | **Yes** | No | What *causes* completion — launching, finishing, or passing an assessment — is **never defined** — **Q-31** |
| **11.1.2** | Platform tracks **time spent** interacting with simulations | Available data, but student-visibility is not required by the FRD. | Possible time-spent display; must not be assumed | Indirect | No | Whether the Student sees this or only administrators — **Q-28** |
| **11.2.1** | Assessment scores stored and associated with the learner's academic profile | Scores exist and are personal, supporting a results surface. | Assessment result display | **Yes** | No | Whether historical scores across attempts are all retained and shown — **Q-10** |
| **11.2.2** | System records the **number of attempts** for each simulation or assessment | Confirms attempts are counted for both simulations and assessments. | Attempt count display on result and module surfaces | Indirect | No | Counting ≠ limiting. No maximum is defined — **Q-07** |

---

## 12. Section 12 — Platform Infrastructure & Hosting · Phase 1: Core Cloud Infrastructure

| FRD | Requirement summary | Why it matters to Student UX | Likely UI implication | Screen? | Backend only? | Ambiguity |
|---|---|---|---|---|---|---|
| **12.1.1** | Platform deployed on cloud infrastructure (AWS, Azure, or Google Cloud) | No Student surface. | None | No | Yes | — |
| **12.1.2** | XR asset bundles stored in encrypted cloud storage | No Student surface. | None | No | Yes | — |
| **12.2.1** | Simulation assets delivered via CDN to reduce download latency | Acknowledges that assets are large enough for latency to matter — which the Student experiences as wait time. | Loading and progress states for simulation asset delivery must be designed deliberately, not as an afterthought | **State** | No | No performance target or expected payload size is given, so loading treatment cannot yet be calibrated — **Q-16** |

---

## 13. Requirement counts

Counts below are from a full enumeration of every numbered Phase-1 requirement in all 12 sections. Every Phase-1 requirement is represented in the tables above (FRD 8.1.1–8.1.4 share a single combined row).

| Category | Review 001 | **Review 002** |
|---|---|---|
| Phase-1 requirements across all 12 sections | 78 | **78** |
| Requiring a visible Student screen or screen region (**Yes**) | 23 | **34** |
| Surfacing only as a state (**State**) | 5 | 5 |
| Constraining without a surface (**Indirect**) | 27 | 21 |
| Backend / system behavior only (**No**) | 18 | 18 |
| Deferred (B2C commerce) | 5 | **0** — D-04 |
| Carrying a recorded ambiguity | 58 | **41** |

**Student-facing reach rose from 33 to 39 of 78 requirements (50%).** The increase comes almost entirely from D-04 admitting commerce (+5) and D-09 confirming XR presentation (+3), with D-06/D-07/D-08 converting several *Indirect* rows into explicit UI obligations. Recorded ambiguities fell from 58 to 41 as fourteen questions closed.

### Phase-1 requirement count by section

| Section | Phase-1 reqs | Yes | State | Indirect | No | Deferred |
|---|---|---|---|---|---|---|
| 1 — Platform Overview | 18 | 4 | 0 | 7 | 7 | 0 |
| 2 — XR Content Delivery | 11 | 2 | 1 | 4 | 4 | 0 |
| 3 — Content Organization | 6 | 4 | 0 | 2 | 0 | 0 |
| 4 — User Management | 5 | 3 | 0 | 1 | 1 | 0 |
| 5 — Learning Experience | 7 | 4 | 0 | 2 | 1 | 0 |
| 6 — Licensing & Monetization | 4 | 0 | 1 | 1 | 0 | 2 |
| 7 — Enterprise Integrations | 5 | 1 | 1 | 3 | 0 | 0 |
| 8 — Administration & Roles | 5 | 1 | 0 | 4 | 0 | 0 |
| 9 — Payment & Billing | 4 | 0 | 0 | 1 | 0 | 3 |
| 10 — Security & Compliance | 6 | 2 | 1 | 0 | 3 | 0 |
| 11 — Analytics & Reporting | 4 | 2 | 0 | 2 | 0 | 0 |
| 12 — Infrastructure & Hosting | 3 | 0 | 1 | 0 | 2 | 0 |
| **Total** | **78** | **23** | **5** | **27** | **18** | **5** |

Sections 3, 5, and 11 have the highest ratio of screen-bearing requirements and carry most of the Student-facing design work. Sections 1 and 12 are largely architectural.

---

## 14. Phase-boundary notes

Phase-2/3 requirements are out of scope, but four of them explain gaps in Phase 1 and are recorded so the gaps are not mistaken for oversights.

| FRD | Phase | Why it matters to a Phase-1 decision |
|---|---|---|
| **3.5.1** — Students track certification progress via dashboard | Phase 3 | Certification is *promised* in Phase 1 (3.3.2) but *trackable* only in Phase 3. The absence of certification progress UI in Phase 1 is by design, not omission — **Q-12** |
| **4.5.1 / 4.5.2** — Recommendation engine | Phase 2 | The sole plausible consumer of "learning preferences" collected in Phase 1 (4.3.1). Collecting them now yields no Phase-1 benefit — **Q-15** |
| **7.4.1** — SSO through Google Workspace / Azure AD | Phase 3 | Contradicts 4.2.2, which places institutional SSO configuration in Phase 1 — **Q-02** |
| **1.5.1** — Module lifecycle states incl. Archived | Phase 2 | Without lifecycle states in Phase 1, there is no defined Student experience when a module is withdrawn mid-course — **Q-20** |

---

## 15. Requirements the design will need but the FRD does not contain

Recorded as **gaps, not requirements**. None has been invented into the tables above; each is escalated to `OPEN_QUESTIONS.md`.

| Gap | Why the design needs it | Question |
|---|---|---|
| Password reset / forgotten credentials | Email registration (4.1.1) and password authentication (10.2.1) exist, but no recovery path is defined anywhere in the FRD | Q-29 |
| Logout | Session expiry is specified (10.2.2) but no explicit sign-out requirement exists | Q-29 |
| Definition of "module completion" | 11.1.1 records completion status without defining the triggering event | Q-31 |
| Behavior when a session expires mid-assessment or mid-simulation | 10.2.2 mandates expiry; consequences for in-progress work are undefined | Q-30 |
| Descriptive-answer grading workflow | 5.2.3 permits ungradeable-by-machine answers with no Phase-1 grading process | Q-24 |
| License-cap-reached and zero-entitlement states | 6.2.2 and 7.2.3 make both reachable; neither is described | Q-27 |
| Student notification of ERP-driven changes | 7.2.1 lets a student's courses change silently between sessions | Q-20 |
| Empty state for a student with no assigned content | A direct consequence of 7.2.3 stream mapping | Q-27 |
