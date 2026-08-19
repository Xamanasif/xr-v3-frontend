# 09 — Review-005 Reuse Map

**Review:** 006 — Full Platform Reframe
**Created:** 2026-08-18
**Authority:** PM-confirmed baseline §A — *Review 005 becomes "Reusable Learner Workspace baseline created under the earlier Student-first interpretation."*

---

## Rules

> **No Review-005 artefact is deleted, moved, overwritten, or rewritten by Review 006.**
> Everything in `ui-ux/01-` through `ui-ux/11-` remains exactly as it was.

This document **classifies** that work. It does not touch it.

| Disposition | Meaning |
|---|---|
| **KEEP** | Reusable as-is. No change required |
| **KEEP + REFRAME** | Content unchanged; its **scope statement** changes from "the product" to "one workspace" |
| **MODIFY** | Substantive change required, but the artefact survives |
| **SUPERSEDE** | The position is withdrawn. The artefact stays as history |
| **DEFER** | Correct, but out of Phase 1 by PM decision |
| **NEW REPLACEMENT REQUIRED** | Nothing exists; must be built from scratch |

---

# Part 1 · The four framing statements

The PM-confirmed baseline named these explicitly.

| # | Item | Disposition | Detail |
|---|---|---|---|
| 1 | **Student-only project framing** | 🔴 **SUPERSEDE** | PM-01. Phase 1 covers all Phase-1 requirements **and all Phase-1 roles**. `D-13` withdrawn |
| 2 | **The Learner UX itself** | ✅ **REUSE — largely intact** | PM-09 approves the progression. 29 screens survive with 3 data-source changes and 1 expansion |
| 3 | **XR device-guidance-only model** | 🟠 **MODIFY** | PM-05. Guidance alone is incomplete; entitlement-aware delivery states required |
| 4 | **Fixed assessment rules** | 🔴 **SUPERSEDE as global rules** → retain as **SAMPLE CONFIGURATION** | PM-08 |

Plus the four the task brief called out:

| # | Item | Disposition | Detail |
|---|---|---|---|
| 5 | **Certification Phase-1 surfaces** | 🟡 **DEFER** | PM-12 → Phase 2. Review 005 correctly declined to invent them; that restraint now has PM backing |
| 6 | **SSO** | ✅ **KEEP / EXPAND** | PM-10. Login path kept; **Institute Admin configuration surface is new** |
| 7 | **Commerce** | ✅ **KEEP / REFRAME** | PM-04. Unchanged; reframed as one branch of a multi-role platform |
| 8 | **Design-system foundations** | ✅ **KEEP / EXPAND** | Must now serve seven workspaces. Foundations hold; component set grows |

---

# Part 2 · Screen-by-screen — all 29 Review-005 screens

## Authentication — 7 screens

| ID | Screen | Disposition | Detail |
|---|---|---|---|
| AUTH-01 | Login | ✅ **KEEP + REFRAME** | Becomes the **single front door for all seven roles**. Layout and both auth paths unchanged. SSO ordering (`D-03`) retained |
| AUTH-02 | SSO interstitial | ✅ **KEEP** | Unchanged |
| AUTH-03 | Sign up | ✅ **KEEP + REFRAME** | Remains **B2C learners only**. Faculty, admins, vendors, reviewers are provisioned, never self-registered |
| AUTH-04 | Email verification | ✅ **KEEP** | Unchanged |
| AUTH-05 | Password reset | ✅ **KEEP + REFRAME** | Now serves all seven roles. Still design-supplied — no FRD requirement |
| AUTH-06 | Session expired | 🟠 **MODIFY** | `D-17` protects a learner's attempt. Must generalise to **unsaved administrative state** — SSO config, ERP settings, in-progress uploads, assessment configuration |
| AUTH-07 | Profile setup | 🟠 **MODIFY** | Learner variants kept. Faculty and admin profiles are new; ERP field-authority question (`J6`) now applies to Faculty too |

**Also new in this area:** workspace resolution after sign-in, and a workspace chooser for multi-role identities. Neither existed when there was one role.

## Learner core — 14 screens

| ID | Screen | Disposition | Detail |
|---|---|---|---|
| STU-01 | Home | ✅ **KEEP** | `D-10` one-click resumption. PM-09 approves the progression it resumes into |
| STU-02 | My Learning | ✅ **KEEP** | Courses, standalone modules (`D-22`), completed |
| STU-03 | Course detail | ✅ **KEEP** | Gated module list (`D-07`, 3.2.2) |
| STU-04 | Module detail | ✅ **KEEP** | Completion checklist (`D-08`), internal gating (`D-20`). Both PM-09 approved |
| STU-05 | PDF viewer | ✅ **KEEP** | Unchanged |
| STU-06 | Video viewer | ✅ **KEEP** | Coverage-vs-position rule retained |
| **STU-07** | **Simulation access** | 🟠 **MODIFY** | **The most-changed learner screen.** Web/VR/MR/AR variants kept; must now carry **entitlement-aware delivery states** (PM-05) instead of guidance alone |
| STU-08 | Simulation runtime (web) | ✅ **KEEP** | Determinate loading (12.2.1) |
| STU-09 | Assessment overview | 🟠 **MODIFY — data source** | Structure unchanged. **Disclosure must be generated from configuration**, not authored as copy (PM-08) |
| STU-10 | Assessment attempt | 🟠 **MODIFY — data source** | Structure unchanged. Timer, count, hints, navigator all parameterised |
| STU-11 | Submit confirmation | ✅ **KEEP** | Unanswered count derives from configured length |
| STU-12 | Assessment result | 🟠 **MODIFY — data source** | Structure unchanged. Score, breakdown, pass/fail from configuration. `D-25` correctness-without-key **strengthens** |
| STU-13 | Progress | ✅ **KEEP** | Personal progress. Cohort-facing views are new, not a change to this one |
| STU-14 | Profile & account | 🟠 **MODIFY** | Add **My devices** (2.4.1) and **device replacement request** (2.4.2) — Phase-1 requirements with no prior surface |

## B2C commerce — 5 screens

| ID | Screen | Disposition | Detail |
|---|---|---|---|
| B2C-01 | Explore | ✅ **KEEP** | Modules and bundles only (`D-21`) |
| B2C-02 | Product detail | ✅ **KEEP** | Access-duration slot (`D-24`) |
| B2C-03 | Checkout | ✅ **KEEP** | Direct purchase, no cart |
| B2C-04 | Payment processing | ✅ **KEEP** | Generic secure redirect (`C-05`) |
| B2C-05 | Payment result | ✅ **KEEP** | Success · declined · indeterminate |

**All five KEEP.** PM-04 reinforces B2C; nothing PM-confirmed touches these screens.

## System states — 3 screens

| ID | Screen | Disposition | Detail |
|---|---|---|---|
| STATE-01 | Access restricted | 🟠 **MODIFY** | Four learner variants kept. Add **device-related denials** (PM-05) and **role/permission denials** for six new workspaces |
| STATE-02 | Content unavailable | ✅ **KEEP + REFRAME** | Now also covers version-release changes (2.3.2) and governance-driven withdrawal |
| STATE-03 | System error | ✅ **KEEP** | `D-18` grammar applies platform-wide |

## Screen roll-up

| Disposition | Count | Screens |
|---|---|---|
| **KEEP** | 17 | AUTH-02, AUTH-04 · STU-01–06, 08, 11, 13 · B2C-01–05 · STATE-03 |
| **KEEP + REFRAME** | 4 | AUTH-01, AUTH-03, AUTH-05, STATE-02 |
| **MODIFY** | 8 | AUTH-06, AUTH-07 · STU-07, 09, 10, 12, 14 · STATE-01 |
| **SUPERSEDE** | 0 | — |
| **DEFER** | 0 | — |
| **Total** | **29** | |

> **No Review-005 screen is superseded or discarded.** **21 of 29 need no structural change at all**; of the 8 modified, **3 are data-source changes only** (STU-09, STU-10, STU-12).

---

# Part 3 · Documents and specifications

| Artefact | Disposition | Detail |
|---|---|---|
| `00-project-context/PROJECT_CONTEXT.md` | 🟠 **MODIFY** | §3 scope and §4 exclusions are superseded by PM-01/PM-07. Content model, FRD analysis, and contradiction register remain accurate and valuable |
| `01-requirements/STUDENT_PHASE1_REQUIREMENTS.md` | ✅ **KEEP + REFRAME** | Excellent per-requirement FRD analysis. Reframed as the **Learner-lens** read; `01_PHASE1_FEATURE_INVENTORY.md` is the platform-lens read. **Both are valid; neither replaces the other** |
| `01-requirements/DECISIONS.md` | 🟠 **MODIFY** | See Part 4 — D-01–D-25 individually classified |
| `01-requirements/OPEN_QUESTIONS.md` | ✅ **KEEP + REFRAME** | Preserved as the Learner-scope register. `11_OPEN_QUESTIONS_REFRAMED.md` starts fresh at platform scope and maps back |
| `01-requirements/ASSUMPTIONS.md` | ✅ **KEEP + REFRAME** | 30 labelled reversible assumptions, all still Learner-valid. `A-14` (no device UI) is effectively overtaken by PM-05 |
| `02-information-architecture/STUDENT_INFORMATION_ARCHITECTURE.md` | ✅ **KEEP + REFRAME** | Becomes the **Learner workspace IA** inside `04_PLATFORM_INFORMATION_ARCHITECTURE.md`. Navigation, six-state module model, and B2B/B2C divergence all survive |
| `03-user-flows/STUDENT_USER_FLOWS.md` | ✅ **KEEP + REFRAME** | 20 learner flows remain valid. They are now the learner segments of the cross-role flows in `05_END_TO_END_WORKFLOWS.md` |
| `04-screen-inventory/STUDENT_SCREEN_INVENTORY.md` | ✅ **KEEP + REFRAME** | 29 screens become the `LRN`/`AUTH`/`B2C` sections of the platform inventory |
| `05-wireframes/WIREFRAME_SPECIFICATION.md` | ✅ **KEEP + EXPAND** | Layout patterns P1–P4 and the grid are workspace-agnostic. Admin workspaces will need **queue** and **configuration-form** patterns |
| `05-wireframes/lofi-wireframes.html` | ✅ **KEEP** | Historical artefact, unchanged |
| `06-design-system/tokens.css` | ✅ **KEEP** | **Token source of truth, unchanged.** Contrast-validated, light + dark |
| `06-design-system/DESIGN_SYSTEM.md` | ✅ **KEEP + EXPAND** | See Part 5 |
| `07-high-fidelity/student-desktop-hifi.html` | ✅ **KEEP** | 29 screens, 51+ frames. **The visual target for the Learner workspace.** Untouched |
| `08-prototype/INTERACTION_SPECIFICATION.md` | 🟠 **MODIFY** | Behaviour spec is sound. Assessment section must become configuration-driven; XR section must gain delivery states; session expiry must generalise |
| `09-accessibility/ACCESSIBILITY_REVIEW.md` | ✅ **KEEP + EXPAND** | WCAG 2.2 AA baseline holds platform-wide. Six new workspaces need their own review. **1.4.10 Reflow remains NOT MET** by agreed scope |
| `10-handoff/FRD_UIUX_COVERAGE.md` | 🟠 **MODIFY** | Requirement→screen mapping is valuable. **The "44 of 78 (56%)" figure is scope-bound and must not be quoted as platform coverage** |
| `10-handoff/DEVELOPER_HANDOFF.md` | 🟠 **MODIFY** | Backend contract (server-authoritative timer, gating evaluation, coverage tracking, `D-19`) remains correct. Assessment section becomes configuration-driven; scope section is superseded |
| `11-reviews/UX_REVIEW_LOG.md` | ✅ **KEEP** | **Historical record. Never rewritten.** Review 006 appends; it does not amend |
| `11-reviews/WIREFRAME_SELF_REVIEW.md` | ✅ **KEEP** | Historical |
| `11-reviews/HIFI_SELF_REVIEW.md` | ✅ **KEEP** | Historical |
| `FIGMA_TRANSFER_CHECKPOINT.md` | 🟡 **DEFER** | **On hold by PM-02**, not cancelled. File key, page structure, connection status, and transfer method all remain valid for step 14 |
| `PROJECT_CHECKPOINT.md` | 🟠 **MODIFY** | Scope statement superseded |

---

# Part 4 · Decisions D-01 – D-25

| # | Decision | Disposition | Reason |
|---|---|---|---|
| **D-01** | Dual audience B2B + B2C | ✅ **KEEP** | **Reinforced by PM-04** |
| **D-02** | Phase 1 = all 78 Phase-1 requirements | ✅ **KEEP** | **Reinforced by PM-01** |
| **D-03** | Email/password **and** institutional SSO | ✅ **KEEP + EXPAND** | **Reinforced by PM-10.** Add IA configuration surface |
| **D-04** | B2C purchasing in scope | ✅ **KEEP** | Reinforced by PM-04 |
| **D-05** | PDF + video, download unconditional | ✅ **KEEP** | Untouched |
| **D-06** | Assessment model — 10 MCQ, 20 min, +2/+1/−1/0, 10/20, unlimited | 🔴 **SUPERSEDE as global constants** → **SAMPLE CONFIGURATION** | **PM-08.** Capabilities survive; values do not |
| **D-07** | Sequential module gating | ✅ **KEEP** | **PM-09 approved** |
| **D-08** | Four-part completion model | ✅ **KEEP** | **PM-09 approved** |
| **D-09** | XR modules visible with badges and device CTAs | 🟠 **MODIFY** | **PM-05.** Visibility kept; guidance-only is incomplete |
| **D-10** | Primary goal — resume with minimum friction | ✅ **KEEP** | Learner-scoped, still true |
| **D-11** | WCAG 2.2 AA | ✅ **KEEP + EXPAND** | Now applies to seven workspaces |
| **D-12** | Logo is the only confirmed brand asset | ✅ **KEEP** | Unchanged |
| **D-13** | **Student role only** | 🔴 **SUPERSEDE** | **PM-01, PM-07.** The single decision this reframe overturns |
| **D-14** | LMS web application only | ✅ **KEEP + REFRAME** | Still web-only — but PM-03 makes it a **portal with seven workspaces**, and PM-05 adds device delivery the portal initiates |
| **D-15** | Desktop-first ~1440px | 🟠 **MODIFY** | Set for one surface; six workspaces would inherit it silently. Needs revalidation, not automatic extension |
| **D-16** | Designed from scratch | ✅ **KEEP** | Unchanged |
| **D-17** | Session expiry must not destroy work | ✅ **KEEP + EXPAND** | Principle generalises to unsaved admin state |
| **D-18** | Every error says what happened + what next | ✅ **KEEP + EXPAND** | Platform-wide grammar |
| **D-19** | Simulation completion is account-level | ✅ **KEEP** | **Essential to PM-05's delivery model** |
| **D-20** | Module-internal sequential gating | ✅ **KEEP** | **PM-09 approved** |
| **D-21** | B2C sells modules and bundles only | ✅ **KEEP** | Matches FRD 6.1.1/6.1.2 literally |
| **D-22** | Standalone modules immediately available | ✅ **KEEP** | Untouched |
| **D-23** | `reportedScore = max(raw, 0)` | 🔴 **SUPERSEDE as a global rule** → **configuration field** | **PM-08** |
| **D-24** | No universal duration promise | ✅ **KEEP** | Data contract, still correct |
| **D-25** | Correctness without the answer key | ✅ **KEEP + STRENGTHEN** | Under configurable attempts the prohibition matters **more**. Extends to the API payload |

## Decision roll-up

| Disposition | Count | Decisions |
|---|---|---|
| **KEEP** | 14 | D-01, D-02, D-04, D-05, D-07, D-08, D-10, D-12, D-16, D-19, D-20, D-21, D-22, D-24 |
| **KEEP + EXPAND / REFRAME / STRENGTHEN** | 6 | D-03, D-11, D-14, D-17, D-18, D-25 |
| **MODIFY** | 2 | D-09, D-15 |
| **SUPERSEDE** | 3 | **D-06**, **D-13**, **D-23** |
| **Total** | **25** | |

**20 of 25 decisions survive unchanged or with only a widened scope. Three are superseded — and two of those three (D-06, D-23) are superseded only *as global constants*, retained as sample configuration.**

**The single genuinely withdrawn decision is `D-13` — Student role only.**

---

# Part 5 · Design system and accessibility

## Design system — **KEEP + EXPAND**

| Element | Disposition | Detail |
|---|---|---|
| `tokens.css` | ✅ **KEEP** | Unchanged. Light + dark, contrast-validated. Becomes Figma variables |
| Colour system | ✅ **KEEP** | Semantic aliases are workspace-agnostic. Teal reserved for simulation/XR still holds |
| Typography scale | ✅ **KEEP** | Unchanged |
| Spacing & grid | ✅ **KEEP** | Admin workspaces use the same grid |
| Radius, borders, elevation | ✅ **KEEP** | Unchanged |
| Focus treatment | ✅ **KEEP** | WCAG 2.2 focus-appearance compliance |
| Motion | ✅ **KEEP** | Unchanged |
| Loading treatment | ✅ **KEEP** | Extends naturally to delivery progress |
| Colour is never the only signal | ✅ **KEEP** | More important with queue states across four governance roles |
| **Primitives** | ✅ **KEEP** | Buttons, inputs, badges, cards all reusable |
| **Learning components** | ✅ **KEEP** | Module row, format badge, completion checklist, lockbar |
| **Assessment components** | 🟠 **MODIFY** | Must accept variable counts and parameters |
| **Commerce components** | ✅ **KEEP** | Unchanged |
| **Feedback components** | ✅ **KEEP + EXPAND** | Same grammar, more states |
| **Queue / worklist component** | 🔴 **NEW** | Required by V, AR, CM, SA — four workspaces, one pattern |
| **Configuration form component** | 🔴 **NEW** | Required by IA (SSO, ERP), FAC (assessment), SA (platform) — five surfaces, one pattern |
| **Data table component** | 🔴 **NEW** | Required by IA (people, licences), SA (institutions, modules) |
| **Status / gate-position component** | 🔴 **NEW** | The governance chain's core visual |
| **Approval-decision component** | 🔴 **NEW** | Required at gates ②, ③, ④ |

**The foundations hold entirely. Five new component families are needed — all of them shared across multiple workspaces, none of them workspace-specific.** That is the strongest evidence the design system was built at the right altitude.

## Accessibility — **KEEP + EXPAND**

| Item | Disposition |
|---|---|
| WCAG 2.2 AA baseline (`D-11`) | ✅ **KEEP** — platform-wide |
| Learner-workspace review, 0 failures | ✅ **KEEP** — remains valid for that workspace |
| **1.4.10 Reflow NOT MET** | ✅ **KEEP as a stated gap** — unchanged by this reframe, and now **six more workspaces inherit the same desktop-first scope** (`D-15`) |
| Q-50 extended-time accommodation | ✅ **KEEP** — the per-attempt allowance hook becomes a natural **configuration field** under PM-08 |
| Q-51 captions / transcripts / audio description | ✅ **KEEP + EXPAND** — ownership question now has a candidate home: **Content Manager readiness review (1.4.3)** or **Vendor submission (1.4.1)** |
| No conformance claim | ✅ **KEEP** — the honest position stands |
| Six new workspace reviews | 🔴 **NEW REQUIRED** |

**PM-08 quietly improves accessibility.** Q-50's extended-time accommodation had no home when the 20-minute limit was a constant. As a configuration field, a per-attempt time allowance becomes an ordinary parameter rather than a redesign.

---

# Part 6 · What must be built entirely new

Nothing below reuses any Review-005 artefact.

| Area | Why nothing exists | Scale |
|---|---|---|
| **Content governance** — V, AR, CM, SA gates | Three of four roles were out of scope | **9 capabilities, ~30 screens** |
| **Platform configuration** — SSO, ERP, platform, version release | No admin role was in scope | **6 capabilities, ~12 screens** |
| **Faculty workspace** | Out of scope | ~10 screens |
| **Institute Admin workspace** | Out of scope | ~14 screens |
| **Super Admin workspace** | Out of scope | ~14 screens |
| **Vendor workspace** | Not a role until PM-07 | ~7 screens |
| **Academic Reviewer workspace** | Not a role until PM-07 | ~6 screens |
| **Entitlement-aware XR delivery states** | Guidance-only model | ~3 screens + states |
| **Device binding & replacement** | `A-14` declined to design it | ~4 screens |
| **Assessment authoring & configuration** | Faculty out of scope | ~5 screens |
| **Workspace resolution & chooser** | One role needed no resolution | 1–2 screens |
| **Five shared component families** | Only learner patterns existed | Design-system work |

---

# Summary

## Reuse disposition across everything classified

| Disposition | Screens | Documents | Decisions | **Total** |
|---|---|---|---|---|
| **KEEP** | 17 | 7 | 14 | **38** |
| **KEEP + REFRAME / EXPAND / STRENGTHEN** | 4 | 9 | 6 | **19** |
| **MODIFY** | 8 | 6 | 2 | **16** |
| **SUPERSEDE** | 0 | 0 | 3 | **3** |
| **DEFER** | 0 | 1 | 0 | **1** |
| **Totals classified** | **29** | **23** | **25** | **77** |

## The headline

- **57 of 77 classified items (74%) are reused as-is or with only a widened scope statement.**
- **16 need substantive modification** — and 3 of those are data-source changes only.
- **3 are superseded**, of which **only one — `D-13`, Student-role-only — is genuinely withdrawn**. The other two (`D-06`, `D-23`) survive as sample configuration.
- **1 is deferred** — the Figma transfer checkpoint, on hold rather than cancelled.
- **Zero Review-005 artefacts are deleted or rewritten.**

## What the reframe actually cost

**Almost nothing already built was wasted.**

The Learner workspace, the design system, the accessibility baseline, the state grammar, the commerce path, and the approved learning progression all survive. Nothing had reached Figma, so no high-fidelity rework was created by pausing.

**What the reframe revealed is not that the previous work was wrong — it is that six sevenths of the platform had never been looked at.**
