# Batch 02 — Assessment: Faculty Configuration → Learner Result & Progress

**XR Simulation Learning Platform · Full-Platform UI/UX Design — Batch 02**
Branch `uiux/full-platform-design` · 2026-08-20 · **Figma deferred — reviewable entirely in the browser.**

## Scope

The end-to-end assessment experience (Review-006 **FLOW 4**, PM-08 · PM-15 · FRD 5.x, 8.1.4, 11.2.x):

**Faculty** — Question Bank (spreadsheet upload with per-row error reporting; AI-generated drafts under mandatory faculty review; question editor) → Assessment Builder (questions · settings · learning-context assignment, with a completeness rail) → learner-view preview → assigned to the module's learning sequence.

**Learner** — a natural continuation of the Batch-01 learner workspace: module sequence (resources → simulation → **assessment** → completion) → introduction whose every rule is **generated from the assessment's configuration** → attempt (MCQ, True/False, descriptive; timer only when configured) → review answers → submit confirmation → **immediate result** or **Result pending evaluation** → progress that never marks a module complete while a result is pending.

**Roles:** Faculty and Learner only. 12 base screens + curated state variants; stable Review-006 screen IDs (`FAC-06/07/08/09`, `LRN-04/09/10/11/12/13`).

## The point the batch proves

Assessment behaviour is **configuration-driven, not hard-coded**: one local configuration object per assessment feeds both workspaces, the learner disclosure is generated (negative marking off ⇒ never mentioned; randomization always disclosed), and the two sample assessments carry deliberately opposite settings. Path E demonstrates a Faculty settings change appearing in the learner introduction. All values are **SAMPLE DESIGN DATA**; whether the platform provides any default configuration remains a pending product decision (QP-21), and none is asserted or invented here.

## Deliberately still pending (not resolved here)

Descriptive-grading owner, turnaround and rubric (learner sees "the required evaluation"; on the Faculty side the topic appears only as a "PROTOTYPE NOTE — NOT PRODUCT UI" annotation, never as product UI) · answer-key / detailed-feedback policy (score + pass state + policy note only) · hints (absent) · single- vs multi-select MCQ (single shown) · assessment configuration API contract and upload template format (nothing named) · pure-B2C authoring operations · Institute Admin assessment authority.

## Where things are

| Item | Location |
|---|---|
| Source & scope audit (classifications, assumptions A1–A7) | `01_SOURCE_AND_SCOPE.md` |
| Assessment UX model (config object, disclosure generator, states) | `02_ASSESSMENT_UX_MODEL.md` |
| Component extensions over Batch 01 | `03_COMPONENT_EXTENSIONS.md` |
| Low-fi wireframes | `wireframes/batch02-wireframes.html` — open directly |
| **High-fidelity interactive prototype** (primary deliverable) | `prototype/batch02-prototype.html` — see `prototype/README.md` for the five demo paths A–E |
| Accessibility & UX QA + visual QA record | `qa/ASSESSMENT_UX_QA.md` |
| QA captures (1440px + 1280px) | `qa/screenshots/` (seeding: `qa/qa-seed.html`, `qa/seed-states/`) |
| Future Figma notes | `FIGMA_HANDOFF_LATER.md` |

## Relationship to Batch 01

Batch 01 (content governance + learner XR access) is **frozen and untouched**. Batch 02 consumes the Batch-01 stylesheet as a verbatim, byte-identical snapshot (`prototype/batch01-design-system.css` — required for reliable double-click `file://` loading in Safari; Batch 01 remains the source of truth) and adds only assessment-specific components — Faculty appears as another workspace of the same platform, and the learner assessment continues the same learner workspace (same shell, same Soil Mechanics sample story, same Rahul Verma).

## Next likely batch

**Batch 03 — Institutional administration & identity (Institute Admin):** SSO configuration (`IAD-13`, Flow 6 / Rank 4), ERP connection & sync, licences and seat utilisation, people/entitlement management — plus the auth/workspace-resolution screens (`AUTH-01/02/08`) they depend on.
