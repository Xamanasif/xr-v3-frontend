# Batch 01 — Full-Platform UI/UX Design

**XR Simulation Learning Platform · Content Governance + Learner XR Access**
Branch `uiux/full-platform-design` · 2026-08-20 · **Figma deferred — this package is reviewable entirely in the browser.**

## What Batch 01 covers

Two end-to-end experiences of the one shared platform, designed on the rebuilt multi-role shell:

- **Flow A — Content to Production:** Vendor submission → Academic Review (approve / changes required) → Content Readiness Review (approve / changes required) → Super Admin publication, with correction, resubmission at the returning gate, and traceable review history (FRD 1.4.1–1.4.5 · PM-14).
- **Flow B — Entitled XR content to a learner device:** entitlement → device compatibility → get on device → availability states → completion pending → completion received → progress updated (PM-05, mechanism-neutral).

14 base screens + 31 curated state variants across Vendor, Academic Reviewer, Content Manager, Super Admin and Learner. Details: [01_BATCH01_SCOPE.md](01_BATCH01_SCOPE.md).

## What it does not cover

Faculty, Institute Admin, authentication/workspace resolution, B2C commerce/checkout, assessment authoring **and** attempt screens, device binding/replacement, SSO/ERP administration, version releases, certification (PM-12), analytics dashboards (PM-11). The XR delivery mechanism remains unselected (PM-05) — all device copy is mechanism-neutral and may change once the implementation is chosen.

## Where things are

| Item | Location |
|---|---|
| Scope & screen/state table | `01_BATCH01_SCOPE.md` |
| Foundations decisions + shared shell spec | `02_FOUNDATIONS_AND_SHELL.md` |
| Component system | `03_COMPONENT_SYSTEM.md` |
| **Low-fi wireframes** | `wireframes/batch01-wireframes.html` — open directly in a browser |
| **High-fidelity interactive prototype** (primary deliverable) | `prototype/batch01-prototype.html` — open directly, or serve the repo root (`python3 -m http.server`); see `prototype/README.md` for the five demo paths |
| Accessibility & UX QA findings | `qa/ACCESSIBILITY_AND_UX_QA.md` |
| Visual QA captures (1440px + 1280px) | `qa/screenshots/` (state seeding utilities: `qa/qa-seed.html`, `qa/seed-states/`) |
| Future Figma notes | `FIGMA_HANDOFF_LATER.md` |

Everything in the prototype is **SAMPLE DESIGN DATA**; review it at 1440px width.

## After approval — next logical batch

**Batch 02: Assessment authoring to result (Flow 4)** — Faculty question bank, assessment configuration (PM-08/PM-15) and the configuration-driven rework of the learner attempt screens; it is the Rank-3 flow in the Review-006 priority list and primarily brings **Faculty** into detailed design (six of the seven roles after Batch 02). **Institute Admin still requires a later institutional administration/integrations batch** (SSO/ERP configuration, licences, people — Flow 6 / Rank 4 territory).
