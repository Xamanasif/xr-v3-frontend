# v46 reference documents — Phase-0 audit evidence

| | |
|---|---|
| **Status** | **Candidate — owner review.** Read-only evidence from the Phase-0 architecture audit of the frozen v46 design. Nothing in this folder is a product decision unless an owner decision record says so (`../decisions/README.md`). |
| **Added** | 12 Oct 2026, work package WP-0.2 (branch `v2/frontend-v46`) |
| **Source** | The owner-reviewed audit package `~/Downloads/XR-v46-Phase0-Review/` (its `SHA256SUMS.txt` verified 35/35 OK before copying). Every file below is a byte-identical copy of the package file named in the mapping table; `SHA256SUMS.txt` in this folder pins them. |
| **Design authority** | `design/handoff-v46/START-HERE.md` (frozen canvas v46, committed in `c4860a2`). Where an audit document and a v46 board differ, the board wins (owner precedence, confirmed 12 Oct 2026). |
| **Formatting** | This folder is listed in `v2/.prettierignore`. Never reformat these files: the checksums are the integrity check. |

## Contents

| Path (under `v2/docs/v46/`) | What it is | Status |
|---|---|---|
| `audit/XR-v46-Phase0-Audit-Report.md` | Main audit report, sections 1–10 | Candidate — owner review |
| `audit/Appendix-A-Routes.md` | Screen and route coverage: 147 screen IDs (123 designed, 24 excluded), App Router tree, guards, redirects | Candidate — owner review |
| `audit/Appendix-B-Permissions.md` | Candidate role × action permission matrix, 347 rows | Candidate — owner review (grants nothing) |
| `audit/Appendix-C-Schemas-and-Contracts.md` | 28 candidate domain models, 22 service ports + 6 test/seed-only stand-ins | Candidate — owner review |
| `audit/Appendix-D-Architecture.md` | Shared-state architecture, five-state separation, flows A–F + device chain, exceptions TE-1…TE-8 | Candidate — owner review |
| `audit/Appendix-E-Visual-Strategy.md` | v46 visual implementation strategy (tokens, CSS layers, components, B1-10, accessibility, visual regression) | Candidate — owner review |
| `audit/Appendix-F-Phase0-Plan.md` | Phase-0 implementation plan, work packages WP-0.1…WP-0.16 | Approved plan (owner, 12 Oct 2026) |
| `audit/Appendix-G-Owner-Decisions.md` | Owner decision register (gates, handoff defects, stakeholder conflicts, later-phase and production decisions) | Register — open items stay open |
| `audit/OWNER-REVIEW.md` | Owner-review summary: every issue classified "must decide before Phase 0" or "can safely defer" | Reviewed by the owner, 12 Oct 2026 |
| `permission-matrix.json` | Machine-readable candidate permission matrix (347 rows; the twin of Appendix B) | Candidate — owner review (grants nothing) |
| `routes.json` | Machine-readable twin of Appendix A | Candidate — owner review |
| `understand/*.json` | Understand-stage extraction evidence (boards, handoff JSON, repository, historical prototype), 17 files | Evidence |
| `verify/*.json` | Adversarial verifier reports for each deliverable, 7 files | Evidence |
| `SHA256SUMS.txt` | SHA-256 of every file in this folder except itself | Integrity check |

## How the audit's `wf/…` citations resolve in this repository

The audit documents cite its scratch workspace as `wf/…`. Those files are preserved here; read every citation through this map:

| Citation in the audit documents | Repository path |
|---|---|
| `wf/final/routes.md` (and the draft `wf/design/routes.md`) | `v2/docs/v46/audit/Appendix-A-Routes.md` |
| `wf/final/permissions.md` (and the drafts `wf/design/permissions.*`) | `v2/docs/v46/audit/Appendix-B-Permissions.md` |
| `wf/final/schemas.md` (and the draft `wf/design/schemas.md`) | `v2/docs/v46/audit/Appendix-C-Schemas-and-Contracts.md` |
| `wf/final/architecture.md` (and the draft `wf/design/architecture.md`) | `v2/docs/v46/audit/Appendix-D-Architecture.md` |
| `wf/final/visual.md` (and the draft `wf/design/visual.md`) | `v2/docs/v46/audit/Appendix-E-Visual-Strategy.md` |
| `wf/design/phase0.md` | `v2/docs/v46/audit/Appendix-F-Phase0-Plan.md` |
| `wf/design/owner-decisions.md` | `v2/docs/v46/audit/Appendix-G-Owner-Decisions.md` |
| `wf/final/permissions.json` | `v2/docs/v46/permission-matrix.json` |
| `wf/final/routes.json` | `v2/docs/v46/routes.json` |
| `wf/understand/<file>.json` | `v2/docs/v46/understand/<file>.json` |
| `wf/verify/<file>.json` | `v2/docs/v46/verify/<file>.json` |

The drafts under `wf/design/` were superseded by the final appendices, which carry the verifier corrections and a verification log.

**Not preserved:** a few verification logs name audit-time helper scripts and probe files (`wf/design/tools/*.py`, `wf/design/_owner/*.py`, `wf/final/_tools/…`, `wf/final/_visual_tools/`, `wf/verify/_perm/…`, `wf/verify/_schemas/…`, `wf/verify/_visual/cq-fixed-test.html`). They were scratch tooling, not evidence, and they were not part of the owner-reviewed package. The results they produced are recorded in each document's verification log.

## Integrity check

From this folder:

```bash
shasum -a 256 -c SHA256SUMS.txt
```

Every line must say `OK`. `permission-matrix.json` must hash to `34826fec5420440afb55223fd22c363c29a4e1f58408761796bf0a9e20f3b3fa`, the value the audit package records for `evidence/final/permissions.json`. A one-byte change to any file makes the check fail.
