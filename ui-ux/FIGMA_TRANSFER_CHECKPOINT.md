# Figma Transfer Checkpoint

**Created:** 2026-08-10 · **Status:** Ready to begin transfer · **Nothing built in Figma yet**

> **This document is self-contained.** A new Claude session can start from this file alone — it depends on no prior conversation history. Everything needed is either stated here or pointed to by exact repository path.

---

## 1. Project

**XR Simulation Learning Platform — Phase 1 Student Desktop LMS**

A multi-tenant SaaS LMS distributing XR-based engineering simulation modules to institutional (B2B) and individual (B2C) learners. Product requirements originate from `source/Platform FRD_v4.pdf` (17 pages, 12 sections, 131 requirements — 78 in Phase 1).

Scope of this design work: **Student role only · LMS web only · desktop-first at 1440px.**

---

## 2. Approved baseline

**Review 005 — decisions D-01 through D-25.**

`ui-ux/01-requirements/DECISIONS.md` is **authoritative**. Read it in full before any Figma work. §9 below summarises it, but the file governs where they differ.

| Register | Current count |
|---|---|
| Confirmed decisions | **25** (D-01 – D-25) |
| Unconfirmed assumptions | **30** |
| Open questions | **38** (8 High) |

---

## 3. Git

| | |
|---|---|
| **Branch** | `uiux/student-phase1` |
| **Working directory** | `/Users/mymac/Desktop/AR-VR` |
| **Last commit touching `ui-ux/`** | `5cf6485` "Complete Review 004 Student Phase 1 UIUX" |
| **Uncommitted** | Review-005 changes are uncommitted working-tree modifications |

**Do not commit automatically.** Commit only when the user explicitly asks.

---

## 4. Source files the next session MUST read

All paths relative to the repository root.

### Read first — governs everything

| # | Path | Why |
|---|---|---|
| 1 | `ui-ux/01-requirements/DECISIONS.md` | **D-01 – D-25. Authoritative.** Nothing overrides these except a newer manager decision |
| 2 | `ui-ux/01-requirements/OPEN_QUESTIONS.md` | 38 open items — **must not be silently resolved** |
| 3 | `ui-ux/01-requirements/ASSUMPTIONS.md` | 30 unconfirmed positions, each reversible and labelled |

### Structure and behaviour

| # | Path | Why |
|---|---|---|
| 4 | `ui-ux/02-information-architecture/STUDENT_INFORMATION_ARCHITECTURE.md` | Navigation, six-state module model, B2B/B2C divergence (10 documented differences) |
| 5 | `ui-ux/03-user-flows/STUDENT_USER_FLOWS.md` | 20 flows |
| 6 | `ui-ux/04-screen-inventory/STUDENT_SCREEN_INVENTORY.md` | **All 29 screen IDs**, full field set per screen, rendering-status table |
| 7 | `ui-ux/05-wireframes/WIREFRAME_SPECIFICATION.md` | Layout patterns P1–P4, region structure, grid |
| 8 | `ui-ux/08-prototype/INTERACTION_SPECIFICATION.md` | All behaviour: states, loading, gating, timer, hints, expiry, commerce, keyboard, announcements, motion |

### Visual system

| # | Path | Why |
|---|---|---|
| 9 | `ui-ux/06-design-system/tokens.css` | **Token source of truth.** Light + dark, contrast-validated. Becomes Figma **variables** |
| 10 | `ui-ux/06-design-system/DESIGN_SYSTEM.md` | Component inventory, type scale, spacing, grid, radius, elevation, motion, exclusions |
| 11 | `ui-ux/07-high-fidelity/student-desktop-hifi.html` | **Visual target — 29 screens, 51+ frames.** Open in a browser. Rebuild natively; do **not** screenshot |

### Verification and handoff

| # | Path | Why |
|---|---|---|
| 12 | `ui-ux/09-accessibility/ACCESSIBILITY_REVIEW.md` | WCAG 2.2 AA review. **No conformance claim.** 1.4.10 Reflow **NOT MET** |
| 13 | `ui-ux/10-handoff/FRD_UIUX_COVERAGE.md` | 131 requirements mapped; requirement → screen table |
| 14 | `ui-ux/10-handoff/DEVELOPER_HANDOFF.md` | Backend contract, component notes, edge cases, out-of-scope list |
| 15 | `ui-ux/11-reviews/UX_REVIEW_LOG.md` | Reviews 001–005 with findings and rationale |

### Supporting context (read if time allows)

`ui-ux/00-project-context/PROJECT_CONTEXT.md` · `ui-ux/01-requirements/STUDENT_PHASE1_REQUIREMENTS.md` · `ui-ux/05-wireframes/lofi-wireframes.html` · `ui-ux/11-reviews/WIREFRAME_SELF_REVIEW.md` · `ui-ux/11-reviews/HIFI_SELF_REVIEW.md` · `ui-ux/PROJECT_CHECKPOINT.md`

---

## 5. Figma connection status — all verified

Tested 2026-08-10 via the official Figma MCP.

| Capability | Status |
|---|---|
| **Authenticated** | ✅ `gnan_kankanala` · `gnankankanala143r@gmail.com` |
| **Native read** | ✅ `get_metadata` + Plugin API both returned document structure |
| **Native create** | ✅ Frame + text layer created successfully |
| **Read-back** | ✅ Independent `get_metadata` call confirmed both nodes |
| **Delete** | ✅ Test frame removed; page verified empty afterwards |

**Plan/seat note.** `whoami` reports seat **`View`** on plan `team::1668572394859397240` (tier `starter`). **This did NOT block writing.** An earlier session inferred it would — that inference was wrong and the write test disproved it. If a future write *does* fail, run `whoami` first; the seat label alone is not a reliable predictor here.

---

## 6. Figma target

| | |
|---|---|
| **File name** | XR Simulation Learning Platform - Student LMS - Phase 1 |
| **File key** | `xLo6fcqhdcAnOhmWdG6X1x` |
| **URL** | `https://www.figma.com/design/xLo6fcqhdcAnOhmWdG6X1x/XR-Simulation-Learning-Platform---Student-LMS---Phase-1` |
| **Editor type** | `figma` (design file — design-mode API surface) |

### Pages — exactly three, verified

| Order | Page name | Node ID |
|---|---|---|
| 0 | `01 - UX & Wireframes` | `0:1` |
| 1 | `02 - Design System` | `1:3216` |
| 2 | `03 - Student Desktop` | `1:3217` |

> **Note on page listing:** `get_metadata` called *without* a `nodeId` returns **only one page** (`0:1`) because Figma loads pages lazily. This is a tool artefact, **not** a missing page. To enumerate all pages reliably, run a read-only `use_figma` script: `return figma.root.children.map(p => ({id: p.id, name: p.name}))`.

---

## 7. Hard constraints on the Figma file

- ✅ **All three pages are currently EMPTY.** `02 - Design System` had 0 children; the other two are bare canvases. The transfer builds into empty pages — there is **no existing file convention to match**.
- ❌ **Do NOT create another Figma file.** Use `xLo6fcqhdcAnOhmWdG6X1x` only.
- ❌ **Do NOT create additional pages.** Three pages exist and are sufficient.
- ❌ **Do NOT rename, reorder, or move any page.**
- ❌ **Do NOT delete anything that already exists.**

---

## 8. Write test record

| | |
|---|---|
| **Date** | 2026-08-10 |
| **Page** | `02 - Design System` (`1:3216`) |
| **Created** | Frame `6:2` `__MCP_WRITE_TEST__` — 240 × 80, neutral fill, 8px radius · Text `6:3` "MCP write test", Inter Regular 14 |
| **Read-back** | ✅ Confirmed via independent `get_metadata` |
| **Deleted** | ✅ `removedNodeIds: ["6:2"]`, node no longer resolvable |
| **Post-delete state** | ✅ `02 - Design System` verified empty |
| **Errors** | **None.** No permission or plan error at any point |

The test deliberately used a raw hex fill and stock Inter — **not** project tokens — so it could not contaminate the design system. The delete script carried a guard requiring the node's name to equal `__MCP_WRITE_TEST__` *and* its parent to be `1:3216`.

**No `__MCP_WRITE_TEST__` frame remains in the file.**

---

## 9. Product rules D-01 – D-25

> ⚠️ **`ui-ux/01-requirements/DECISIONS.md` is authoritative.** This is a summary for orientation. Where the two differ, the file wins. Read it in full before building.

| # | Decision |
|---|---|
| **D-01** | **B2B and B2C.** Shared core; branch only at onboarding, auth, entitlement origin, catalog visibility, purchasing, institutional info (**10 documented divergences** — IA §11) |
| **D-02** | Phase 1 = all Phase-1 requirements across the complete FRD (78) |
| **D-03** | Auth: email/password **and** institutional SSO. SSO **preferred for B2B** — expressed by *order* on the login screen |
| **D-04** | **B2C purchasing and checkout in scope.** B2B sees no commerce |
| **D-05** | Resources: **PDF notes + instructional video**. **Download always offered** (amendment), optional, never affects completion |
| **D-06** | **10 MCQ · 20-min TOTAL timer** (freely distributed, *not* 2 min/question) · **+2** correct · **+1** correct after hint · **−1** incorrect · **0** unanswered · max 20 · **pass 10/20** · unlimited attempts · **all five disclosures mandatory pre-attempt** |
| **D-07** | **Sequential module unlocking is mandatory** (between modules) |
| **D-08** | Completion = required resources + simulation + assessment **passed**. Optional resources never gate. PDF: open then mark complete. Video: **≈90% coverage** |
| **D-09** | **XR modules stay visible on desktop.** Format badges + device-specific CTAs. Never a non-functional launch button |
| **D-10** | Primary goal: access learning resources **and continue learning with minimum friction** |
| **D-11** | **WCAG 2.2 AA** baseline (design-quality requirement, not FRD-derived) |
| **D-12** | Logo is the **only** approved brand asset. Palette/type **provisional**; never derived mechanically from the logo |
| **D-13 – D-16** | Student role only · LMS web only · desktop-first ~1440px · designed from scratch |
| **D-17** | Session expiry must **never** destroy work or consume an assessment attempt |
| **D-18** | Every error state says **what happened** and **what to do next**. No internal codes |
| **D-19** | **Simulation completion is account-level.** Complete on the supported device; once recorded for the account, the LMS unlocks. **No cross-device mechanism may be invented** |
| **D-20** | **Module-internal gating:** required resources → simulation → assessment. A locked component **never renders an active action** — it names its prerequisite |
| **D-21** | **B2C sells Modules and Bundles only.** **No course CTA, price, checkout, or SKU.** A Bundle may contain a course's modules but is never sold *as* a course |
| **D-22** | **Standalone purchased modules are immediately Available** (no previous-module prerequisite) but **retain D-20 internal gating** |
| **D-23** | **`reportedScore = max(rawScore, 0)`.** Negative marking still applies per answer. Pass mark unchanged. Disclosure: *"Negative marking applies. Your final reported score cannot be lower than 0."* |
| **D-24** | **No universal duration promise.** "Lifetime/permanent/perpetual" **prohibited**. Access duration is entitlement data — shown **only** when authoritative data supplies it; the slot **collapses** otherwise |
| **D-25** | **Per-question correctness shown; the correct answer / key NEVER shown.** Rows not expandable, no link back to the question. Applies **especially to failed attempts** |

### Standing constraints

No Faculty / Institute Admin / Content Manager / Super Admin / Vendor UI · no native Quest / Ajna / Android / iOS UI · no Phase 2 or 3 · **no gamification, badges, streaks, leaderboards, social feed, chat, AI assistant, recommendations, charts, or vanity analytics** · no persistent cart · no coupon field · no global search · no certification tracking UI · do not invent the payment gateway · do not invent device-control functionality.

---

## 10. Transfer method — mandatory

| Required | Forbidden |
|---|---|
| ✅ **Native editable Figma layers** | ❌ **Screenshots or images of the HTML** |
| ✅ **Auto Layout** for every container with structurally related children | ❌ Absolute x/y for related children |
| ✅ **Components** for every repeated element | ❌ Copy-pasted detached duplicates |
| ✅ **Variants** where useful (button, module row, badge, status, result) | ❌ Separate components per state |
| ✅ **Variables / tokens** from `tokens.css` where supported | ❌ Hard-coded hex, spacing, or type values |
| ✅ Consistent naming matching token names one-for-one | ❌ Ad-hoc layer names |

**The HTML is a visual reference, not a source to import.** Rebuild everything natively.

**Load the `figma-use` skill before every `use_figma` call.** Key API rules: colours are **0–1** not 0–255 · `await figma.setCurrentPageAsync(page)` (the sync setter throws) · **at most one page switch per call** — fan multi-page work out in parallel · load fonts before any text mutation · return all created/mutated node IDs · never `figma.notify()` · max ~10 logical operations per call, work incrementally and validate.

---

## 11. Execution checkpoints

Build in this order. **Complete and verify each before starting the next.**

| # | Checkpoint | Target page | Contents |
|---|---|---|---|
| **A** | **Design System** | `02 - Design System` (`1:3216`) | Variables from `tokens.css` (colour, spacing, radius, type) · type ramp · component library with variants: button, input, badge, format badge, status, module row, resource row, course card, progress, checklist, lockbar, timer, question navigator, alert, modal, skeleton, empty state |
| **B** | **UX & Wireframes** | `01 - UX & Wireframes` (`0:1`) | 20 user flows · 29-screen inventory map · low-fidelity frames |
| **C** | **Authentication + Student Core** | `03 - Student Desktop` (`1:3217`) | AUTH-01 – 07 · STU-01 – 06, STU-13, STU-14 |
| **D** | **Assessment + XR** | `03 - Student Desktop` | STU-07, STU-08 · STU-09 – STU-12 (incl. **4 result variants**: passed + review, failed + review, floored at 0, awaiting evaluation) |
| **E** | **B2C Commerce + States** | `03 - Student Desktop` | B2C-01 – 05 · STATE-01 – 03 |
| **F** | **Prototype + Final QA** | all | Prototype links per `INTERACTION_SPECIFICATION.md` · verify all 29 IDs · verify D-01 – D-25 · accessibility spot-check |

**Checkpoint A must come first.** Everything else consumes its variables and components; building screens before the system guarantees rework.

---

## 12. Screen coverage requirement

**All 29 approved screen IDs must ultimately be represented.**

```
AUTH-01  Login                    STU-01  Home                B2C-01  Explore
AUTH-02  SSO interstitial         STU-02  My Learning         B2C-02  Product detail
AUTH-03  Sign up                  STU-03  Course detail       B2C-03  Checkout
AUTH-04  Email verification       STU-04  Module detail       B2C-04  Payment processing
AUTH-05  Password reset           STU-05  PDF viewer          B2C-05  Payment result
AUTH-06  Session expired          STU-06  Video viewer
AUTH-07  Profile setup            STU-07  Simulation access   STATE-01  Access restricted
                                  STU-08  Simulation runtime  STATE-02  Content unavailable
                                  STU-09  Assessment overview STATE-03  System error
                                  STU-10  Assessment attempt
                                  STU-11  Submit confirmation
                                  STU-12  Assessment result
                                  STU-13  Progress
                                  STU-14  Profile & account
```

**7 AUTH + 14 STU + 5 B2C + 3 STATE = 29.** Several require multiple state frames — see the rendering-status table in `STUDENT_SCREEN_INVENTORY.md`.

---

## 13. Unresolved items — do NOT silently invent

**38 questions are open.** Full register: `ui-ux/01-requirements/OPEN_QUESTIONS.md`. None blocks the transfer, but **none may be resolved by design decision during it.**

### High priority (8)

| # | Question | Effect on transfer |
|---|---|---|
| **Q-13** | Approved brand guide / vector + reversed logo | Palette and type are **provisional**. Build via variables so a rebrand is a token swap. **No SVG or dark logo exists** |
| **Q-11** | Student-editable vs ERP-controlled profile fields | Keep the provisional read-only treatment with provenance note |
| **Q-18** | B2B/B2C identity linking | One account = one context. No account switcher |
| **Q-32** | Localization, currency, regional formatting | English/INR, text-expansion tolerance |
| **Q-35** | Currency, tax, price presentation | Compliance-adjacent. Keep "Calculated at checkout" |
| **Q-42** | Recovery when a simulation completion is never recorded | **No manual override** |
| **Q-50** | Assessment extended-time accommodation | Timer reads a per-attempt allowance, not a constant |
| **Q-51** | Captions / transcripts / **audio description** ownership | Slots specified; content unowned |

### Also explicitly unresolved

**Q-12 certification** — **do not invent a certificate dashboard or downloadable certificate.** Content hierarchy only.
**Q-16** web simulation container · **Q-24** descriptive-answer grading (keep "Awaiting evaluation"; module **pending**, never failed) · **Q-34/36/37/44/45** gateway, receipt, refunds, expiry, bundle overlap · **Q-40** video coverage tracking · **Q-43** server-authoritative timer · **Q-49** device-completion latency · **Q-52** responsive/reflow commitment · **Q-53** licence duration values · **Q-55** social providers · **Q-56** standalone module vs later course entitlement — **deliberately undesigned**.

### Sample data — never present as approved

- **Prices** ₹999 / ₹1,499 / ₹2,499 — fictional placeholders (A-44)
- **Social providers** Google / Microsoft — illustrative placeholders (A-45)
- **Learner names, courses, scores** — fictional

Carry a visible `SAMPLE` marker into Figma wherever these appear.

---

## 14. Protected assets

**`source/` and `branding/` must NEVER be modified.**

| File | MD5 |
|---|---|
| `source/Platform FRD_v4.pdf` | `6c3c5fa5e91ec98cf282d2e291e79a73` |
| `branding/bits-pilani-wilp-logo.png` | `633ba520f5b5cc606300eb76f7b8b52a` |

The logo may be **read** and placed into Figma. It must never be edited, recoloured, or re-exported. Verify these checksums are unchanged at the end of any session.

---

## 15. Exact first action for the new session

> **1.** Read this checkpoint in full.
> **2.** Read the Review-005 source documents in §4 — at minimum items 1–11.
> **3.** Verify the Figma connection: run `whoami`, then a read-only `use_figma` page list against `xLo6fcqhdcAnOhmWdG6X1x` to confirm the file and all three pages (`0:1`, `1:3216`, `1:3217`) with unchanged names.
> **4.** Begin **CHECKPOINT A — Design System** on page `02 - Design System` (`1:3216`) **only.**

**Do not begin B–F.** Complete A, verify it, and report before continuing.

### Reminders for the new session

- Load the `figma-use` skill **before every** `use_figma` call
- Work incrementally — ~10 operations per call, validate after each
- Return all created node IDs from every call
- **Do not commit automatically**
- Do not create a new Figma file or new pages
- Do not resolve an open question by design decision — record it and continue

---

## Appendix — verified session state

| Fact | Value |
|---|---|
| Figma file key | `xLo6fcqhdcAnOhmWdG6X1x` |
| Pages | `0:1`, `1:3216`, `1:3217` — all **empty** |
| Write test | Passed and cleaned up; **no residue** |
| Decisions | D-01 – D-25 |
| Assumptions | 30, all unconfirmed and labelled |
| Open questions | 38 (8 High) |
| Screens | 29 |
| Repo files under `ui-ux/` | 22 |
| Branch | `uiux/student-phase1` |
| Figma content built | **None — transfer has not started** |
