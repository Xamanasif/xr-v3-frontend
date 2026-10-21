# XR Learning Platform · V3 Faculty — final complete-role design (FINAL)

**Role:** Faculty · **Foundation:** `XR-V3-RB-1.0` (Refined Direction B) · **Owned IDs:** 21 of 21 redesigned · **Date:** 21 Oct 2026 · **Approved by the owner:** 21 Oct 2026

**Status:** DESIGN COMPLETE · CONNECTED PREVIEW COMPLETE · ASSEMBLY PENDING XS · FINAL — APPROVED BY THE OWNER.


## Open it

- **Live role preview:** `project/Main.dc.html` — the board “Live role preview · 7 Nov 2026 · start here”, top-left of the canvas. Every rail destination, tab, step, dialog and action routes inside it; records you change stay changed while you move around.
- **Live starting points** (row 2), each with its own state: 26 Oct (before the assessment exists), new teacher, co-teacher, and the 7 Nov world at **1024**, **768** and **375** px.
- **Coverage register:** `COVERAGE-REGISTER.md` (and the board of the same name) — every owned ID and its 111 important subviews, each REDESIGNED or REVIEWED AND UNCHANGED, with the boards that show it.
- **Inspection boards:** one canvas row per owned ID: its states at 1440, then 375. Every ID is also rendered at 1440, 1024, 768 and 375 in the screenshot package (`responsive/`).
- **Changing the sample state:** on the Main board the properties panel (“Preview state”) switches scenario, starting screen, record and preset.

## What this design is

One visually consistent Refined B design for the whole Faculty role: the five R1 checkpoint screens (FA-01, FA-02, FA-03, FA-16, FA-19) carried over as they were, and the same patterns applied to the other sixteen IDs. Presentation only — every function, route, permission, business rule, state transition, source ownership and shared contract is the one in the published V3 build. See `WHAT-CHANGED.md`.

## Package contents

| File | What it holds |
| --- | --- |
| `project/` | The canvas as published: `canvas.json`, `Main.dc.html` (the live root with all views and logic), **`fa.css` (the one role stylesheet)**, byte-identical `core.css`, `rb.css`, `rb-kit.css`, 6 live starting points, 129 inspection boards and 3 review boards. |
| `COVERAGE-REGISTER.md` / `.json` | Every owned ID and subview with status, what changed, patterns and boards. |
| `WHAT-CHANGED.md` | The consolidated refinements, the wording changes a tester will notice, and what stays exactly as it was. |
| `ROLE-STATUS.json` | Per ID: route, source, states, boards, responsive screenshots, evidence and status. |
| `FOUNDATION-LOCK.json` | Foundation hashes (identical to the pack) and the hash of every local file. |
| `COMPONENT-EXTENSIONS.md` | Kit components reused, and every `fa-` component in `fa.css` with its purpose. |
| `rename-map.json` | The checkpoint’s working `fr-` class names and their final `fa-` names. |
| `LINK-MAP.json` | Every crawled link and button-driven navigation, with the result. |
| `SCENARIOS.json` | The six sample worlds (unchanged), the inspection presets and every board’s starting state. |
| `HANDOFF.md` | States, allowed actions, data and command needs, open decisions, and integration notes. |
| `CHECKS.md` | What was rendered and exercised, at which widths, the results, and what was not tested. |
| `checks/` | The scripts, journey definitions and raw results. |

## Limits

- Design source only, with no backend. Each live board keeps its own sample records; reloading resets them.
- Exports show a confirmation and the exported rows; no file is written, except the import template (a `data:` CSV link).
- Drafting assistance is a labelled, deterministic sample stand-in. No provider is connected.
- Cross-role effects (a student seeing a released result, an Institute Admin giving access) are documented, not live.
- The official WILP logo is still pending, so the reserved slot is kept.
