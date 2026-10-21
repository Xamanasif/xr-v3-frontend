# Start here · Student · final complete-role design · V3 Refined B

| | |
| --- | --- |
| Role | Student (ST) |
| Foundation | `XR-V3-RB-1.0`, Refined Direction B; `core.css`, `rb.css`, `rb-kit.css` byte-identical |
| Owned IDs | **19 of 19**, ST-01 … ST-19 (ST-05's Assessment tab and the ST-08a sample activity are parts of ST-05 and ST-08); ST-20 excluded |
| The design | **One preview root, `project/StudentFinal.dc.html`, and one role stylesheet, `project/v3-student-final.css`.** Nothing earlier is needed or included |
| Live entry | Canvas **Final** page: first board, “Final preview (live) · all 19 screens … · start here” |
| Coverage | 60 subviews in `COVERAGE-REGISTER.md`: every owned screen with its nested pages, tabs, forms, dialogs, tables, states and phone layouts, each marked REDESIGNED or REVIEWED AND UNCHANGED |
| Status | **DESIGN COMPLETE (19 / 19) · CONNECTED PREVIEW COMPLETE · ASSEMBLY PENDING XS · OWNER APPROVED (21 Oct 2026)**. Approved by the owner on 21 Oct 2026 for integration into the existing V3 frontend. This is the one Student design to implement; every earlier generation is superseded. |

**One decision was applied at approval**: internal record identifiers (the access-plan, student-access and device-transfer records) are not labels on Student pages. It is presentation only — the records are still carried in the data and in the view models, and no business rule, route, guard, state transition or mutation changed. Every place it touched, and how to show an identifier again, is listed in `HANDOFF.md` decision 1. The student still sees the course codes and the headset's asset tag.

## Review in fifteen minutes

Press **Play** on the live preview. The dark strip on top is review-only: choose a scenario, or jump to a screen under “Go to screen”.

1. **Learning** (scenario *Learning · Mon 12 Oct 2026*): Home › **Thermodynamics & Heat Transfer** › **Open experiment** › Resources tab › **Open** the pre-lab reading › Simulation tab › **Continue WEB** › **Continue WEB** › **Finish stage 2** › **Finish the activity** › **Back to WEB simulation** › Progress (rail). Look for one gold action per page, the three-stage tracker moving, and “Recorded by the platform” after the last stage.
2. **Feedback**: on the WEB page, **Give feedback on WEB** › **Submit feedback** with nothing rated (error summary) › rate the five statements › **Submit feedback**. Look for the scale named once and the sent page on the same scale.
3. **Assessment** (scenario *Assessment due*): Assessments › **Open** › **Start assessment** › answer › **Next unanswered** › **Submit** › **Submit answers** › **See your result page**. Then switch to *Result released* and open the Result: the score panel, marks by question (click Q2) and the review.
4. **Device** (*Learning*): Simulation › **Open VR** › **My device** › **Request a device transfer** › **Send request**, first empty, then with a device. Then the device scenarios: forwarded, approved, no Institute Admin.
5. **Access restrictions**: scenarios *Institution paused*, *Waiting for a licence*, *Access ended*, *Access withdrawn*, *New student*, *Account inactive*; screens ST-09ar (AR), ST-09mr (MR) and ST-19 under “Go to screen”. Look for the reason said once and what the student can still do.
6. **Widths**: resize, or look at the board rows below the preview. Every screen is shown at 1440, 1024, 768 and 375, with a 320 row.

## What is in this package

| File | What it holds |
| --- | --- |
| `COVERAGE-REGISTER.md` / `.json` | Every owned ID and important subview: REDESIGNED or REVIEWED AND UNCHANGED (measured against the original design), with its evidence |
| `CONSOLIDATION-LEDGER.md` | The five generations, every refinement and what became of it, and the pending items found and finished |
| `ROLE-STATUS.json` | Every owned ID: source, kind, route proposal, subviews, boards, evidence, approval status |
| `HANDOFF.md` | How to integrate: files, screen map, rules, commands to bind, decisions for the owner, open decisions |
| `COMPONENT-EXTENSIONS.md` | The one stylesheet: type roles, colour rules, gutters, components, interaction states, responsive rules |
| `FOUNDATION-LOCK.json` | Foundation hashes; the final design's hashes; every earlier file unchanged (kept on the History page, not in this package) |
| `LINK-MAP.json` | Every visible link on every case page at four widths: destination, class (in-role / shared / in-page) and tested status; comparison with the original |
| `SCENARIOS.json` | The 23 dated sample worlds (illustrative fixtures, unchanged) |
| `CHECKS.md` | What was rendered, inspected by eye, logic-tested and source-checked, at which widths; what was not tested |
| `project/` | The final design: `StudentFinal.dc.html`, `v3-student-final.css`, the three foundation files, the 143 `F-*` boards, `canvas.json` (Final page) |
| `checks/` | Build inputs and sources (`Main.dc.html` as the logic source, `final-src/`), the build and review scripts, raw results |

Screenshots are in a separate archive, with an index that marks which ones were inspected by eye.

## Limits

- Design preview only: no backend, no real resources, no XR runtime. The WEB sample activity and its three stages are illustrative.
- The account menu, Help & support, signed out, not your workspace and the inactive notice are borrowed faithful versions of the XS contract (*assembly pending XS*).
- Checked in headless Chromium with the Design host's runtime. Not checked with real screen readers, on real devices, in Safari or Firefox, or in the Design editor itself (see `CHECKS.md`).
- `support.js` (the design runtime) is not in the package and must never ship in the React app.
