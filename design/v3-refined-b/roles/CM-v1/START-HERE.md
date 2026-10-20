# XR Learning Platform · Design V3 · Content Manager — final role design

| | |
| --- | --- |
| Foundation | `XR-V3-RB-1.0` — Design V3 Refined Direction B. `core.css`, `rb.css`, `rb-kit.css` are byte-identical copies (hashes in `FOUNDATION-LOCK.json`). |
| Role | Content Manager (sample user Kavya Nair). Single-manager scope, as today. |
| Owned designed IDs | **9 of 9 designed**: CM-01 · CM-02 · CM-03 · CM-04 · CM-05 · CM-06 · CM-07 · CM-08 · CM-09. |
| Excluded | CM-10 — not designed, not linked, no placeholder. |
| Canvas | Claude Design canvas “XR V3 · Content Manager · Refined B”, **version 20** (id `1792491048-0c95`; private until the owner shares it). The files in `project/` are exactly what that canvas holds. |
| Live role entry | `project/Main.dc.html` — board **“Content Manager · live role preview”** on the page **Live role preview**. Press Play. It opens on CM-01 Overview. |

## Status

- `DESIGN COMPLETE` — all nine owned IDs and every subview and state are in one Refined B publishing-desk design. `COVERAGE.md` classifies each as REDESIGNED or REVIEWED AND UNCHANGED; nothing is waiting for propagation and no part of this package is a checkpoint.
- `CONNECTED PREVIEW COMPLETE` — every in-role journey: one role-preview root, one store, state kept across screens until reload.
- `ASSEMBLY PENDING XS` — the Skip to main content link, Account menu, Help & support, the refusal page and the signed-out page are **borrowed**: faithful implementations of the frozen v46 shared contract in V3 tokens (`xs-borrowed.css`), to be replaced one-for-one by the Shared Surfaces (XS) components. This is the contract's dependency status, not a design checkpoint.
- `OWNER VISUAL ACCEPTANCE PENDING` — the owner confirmed the refined direction and the six anchor designs as the baseline on 20 Oct 2026. Acceptance of this final version is not recorded until the owner gives it.

## Every rail destination

| Rail item | Screen | What you can do there |
| --- | --- | --- |
| Overview | CM-01 | The publishing pipeline for both lifecycles, what needs a decision (ready to publish, corrections returned or still drafts), what is with others, and the catalogue by course. |
| Ready to publish | CM-02 | Decision cards for approved submissions, oldest first (sortable): days waiting, the four checks, Open decision → CM-03. |
| Content library | CM-04 | Ready · In review · With vendor · Published, grouped by course, with search, course filter, chips, no-match and empty states. Published row → CM-05. |
| Updates | CM-08 | Corrections you raised, grouped by who must act, each with its four-stage track. Continue / Open → correction detail (draft, returned, review, awaiting, hold, released, withdrawn). |
| Course codes | CM-09 | Platform course codes by engineering area — the Content Manager is the only writer. |
| Help & support (foot) | XS-07 (borrowed) | My reports, Report a problem, report detail. |
| Account menu (top right) | XS-05 (borrowed) | Help & support, Sign out → XS-03 signed-out page. |

Nested destinations: CM-03 from Overview / Ready / Library rows · CM-05 from Library (Published) rows and from the published result · CM-06 **Edit catalogue details** and CM-07 **Edit delivery link** from the CM-05 Corrections panel (they open, or join, the one correction draft) · CM-08 detail from Updates, Overview and CM-05 “Open update”.

## Ten-minute review path (in Play)

1. **Ready to publish** → **Open decision** on *Conduction Through a Composite Wall* → choose **Publish** → **Publish**. Read the dialog (“Publishing gives no one access”), confirm. The rail badge drops 3 → 2.
2. **View the public page** (from the result) → the dashed handoff frame for PU-06 → **Back to the published experiment**: the identity band shows the live version, course, formats and corrections.
3. **Content library** → **Published** → *Fin-Tube Bundle* → **Edit catalogue details**. Change the summary, add a reason and version 1.1 → **Save draft**. Leave and come back through **Updates**: the draft is kept, the live record is unchanged.
4. Back on the published record: **Edit delivery link** joins the same draft (“Your edit joins UPD-0007”). Change the link → **Send for academic review**.
5. In the dashed *Scenario handoff* box: **Academic Reviewer approves** → **Super Admin releases it**. Open the published record: version 1.1 is live with both changes.
6. **Overview** → **Continue** on *Induction Motor Loading* (returned) → read the reason, fix the description, resend → handoff: approve, **hold** with a reason, **lift**, **release**.
7. **Course codes** → type `ME ZG523` for Process Instrumentation & Control → **Save codes** (refused: duplicate) → `CHE ZG514` → saved. Library, published record and public page now show CHE ZG514.
8. Page **Responsive**: the same screens at 1024, 768 and 375. Below 1024 px the rail becomes **Menu** with a drawer (page **Shared surfaces**, X02).
9. Page **Lists & course codes**, bottom row: the four lists while loading and when they couldn’t load.

The other canvas pages are inspection boards: the same `Main.dc.html` opened at a fixed state (screens at 1440, responsive 1024/768/375, publication states, correction states, lists & codes, shared surfaces) — 85 in all.

## What is in this package

| Path | Contents |
| --- | --- |
| `project/` | The canvas exactly as published: `canvas.json`, `Main.dc.html` (role preview root, all logic inline), 85 inspection wrappers, base CSS (unchanged) and the two local stylesheets. `support.js` is the design host's runtime and is not shipped. |
| `ROLE-STATUS.json` · `ROLE-STATUS.md` | Each owned ID: source, kind, v46 route proposal, states, boards, redesign status and evidence. The `.md` is the readable summary of the `.json`. |
| `FOUNDATION-LOCK.json` · `FOUNDATION-LOCK.md` | Base version, shared-file hashes, local additions and wrappers with hashes. |
| `COVERAGE.md` | Every screen, subview and state, classified REDESIGNED or REVIEWED AND UNCHANGED, and what changed in version 20. |
| `COMPONENT-EXTENSIONS.md` | Kit components reused and the `cm-` / borrowed `xsb-` additions. |
| `LINK-MAP.json` | Every control that declares a destination, where it actually landed when clicked, plus command controls and handoffs. |
| `SCENARIOS.json` | The sample world SC-CM-MAIN, record by record, with provenance (v46 fixture or illustrative). Unchanged. |
| `HANDOFF.md` | States, allowed actions, command/read-model needs, open policies, changes from v46. |
| `CHECKS.md` | What was rendered, exercised and only source-checked; widths; keyboard; open findings. |
| `checks/` | Machine results of the final run (`results/`) and the scripts that produced them (`scripts/`). |

Screenshots and evidence are in the separate archive `XR-V3-CM-Role-screenshots.zip`.

## Limits

- No backend, no authentication, no production policy. Data is sample data as of **Thursday 27 August 2026**; times advance 15 minutes per action in the preview.
- The **Scenario handoff** boxes stand in for the Academic Reviewer’s *Review an update* (RV-04) and the Super Admin’s *Release or hold* (SA-11). They are preview controls, never product UI.
- **View the public page** lands on a handoff frame, not a design of PU-06 (Public workstream). The V1 Public Landing and PU-14 were not touched.
- Cross-role effects (vendor, reviewer, Super Admin, institutions, students) are documented handoffs; nothing propagates to other canvases.
- The React frontend was not touched and no Claude Code integration was started.
