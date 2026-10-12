# XR Learning Platform — design handoff v46 (frozen)

This package is the frozen frontend design reference for building the XR Learning Platform in **React · Next.js (App Router) · TypeScript**. It contains the design source, not application code. Read this file, then `FREEZE-RECORD-v46.md`, then `canvas-v46/project/handoff/README.md`.

## Order of authority

1. Owner decisions — the freeze record and the binding constraints below.
2. The v46 boards (`canvas-v46/project/*.dc.html`) — the visual and behavioural authority.
3. The handoff data (`canvas-v46/project/handoff/*.json`) — indexes the boards; on any difference the board wins and the difference is a defect to report.
4. `derived/` — mechanical extracts for searching; never authoritative.

## Where each part of the handoff is

| Need | Where |
|---|---|
| Screen register (147 IDs: 123 designed, 24 not designed by decision) | `handoff/screens.json`, board `B8-01` |
| Roles, surfaces, navigation hierarchy | `handoff/navigation.json`, `B8-01`, boards `05`, `06` |
| Screen → source file | `handoff/screens.json` (`boards[].file`); frame level: `derived/screen-frames.json` |
| Design system: tokens, CSS, type, components, layout, responsive | `xr-foundation.css` + 7 stylesheets, `handoff/tokens.json` · `tokens.css`, boards `01`–`04`, `09a`, `09b`, `10`, `11`, `12`, `B8-07`, `B8-05` |
| States, interactions, validation, dialogs, errors | Each board’s frames (one frame per state) and its inline script; rules in `B8-07`, boards `04`, `08`, `10`, `12`; index of every frame in `derived/frame-index.json` |
| Cross-role workflows, shared records | `handoff/flows.json` (Flows A–F + device chain), `handoff/entities.json`, `B8-04` |
| Roles’ permissions and visibility | `navigation.json`, `entities.json` (owner / writer), `flows.json` (actor), `B8-06` (role guards). No permission matrix was designed — see `HANDOFF-AUDIT-v46.md` |
| Open decisions and safe treatments | `handoff/open-decisions.json`, `B8-08` |
| Accessibility findings and exceptions | `B8-03`, `B8-08`, board `12`, and “Known exceptions” below |
| What to build, build order, definition of done | `handoff/README.md`, `B8-06` |
| Terminology and status words | `B8-03`, `handoff/entities.json` |
| Assets: real vs placeholder | `handoff/assets.json`, `art/` |
| Previewing boards outside the canvas | `runtime/README.md` (top level of this package) |

(Paths above are under `canvas-v46/project/`.)

## Binding constraints (owner, 9 Oct 2026)

1. **PUBLIC is a surface, not an authenticated role.** There are seven authenticated roles: Student, Faculty, Institute Admin, Vendor, Academic Reviewer, Content Manager, Super Admin.
2. **Hierarchy: Programme / Course / Experiment / Technology format.** Do not add a mandatory Module layer (v46 has none anywhere). In v46, Programme is held on the Student record (B2-07), Course → Experiment → format is the navigable chain, and Engineering area is a catalogue grouping of courses set in Academic structure (B7-07). Do not make Programme a navigation level — it is not designed.
3. **Published, institution access, Student entitlement, runtime activity and learning completion are five different states.** Never derive one from another. The event that marks a format Completed is still open (T-12): “Completed” is set by the system, never by the Student, and never inferred from a launch.
4. **Student progress is per technology format**, with no aggregate completion verdict.
5. **Feedback is one record per Student + Experiment + Technology format**, offered only after that format is Completed.
6. **Faculty owns assessment creation and marking.** Pass mark and rules belong to each assessment; no universal assessment settings.
7. **First publication:** Vendor → Academic Reviewer → Content Manager → Published.
8. **Corrections:** Content Manager → Academic Reviewer → Super Admin Release / Hold (never called “Publish”).
9. **Publishing or releasing never grants institution or Student access.**
10. **Out of scope unless separately authorised:** real authentication, payment processing, XR runtimes, grading automation and backend persistence. Build typed mock services that return the sample world.
11. **“Composite Wall Conduction” and “Conduction Through a Composite Wall” stay two separate records** while OD-B5-09 is open. No merge, no duplicate-content rule.
12. **The BITS Pilani / WILP logo is an unapproved placeholder**, not an official asset. Public Sans is a working font only.
13. **B1-10 accessibility defect — must be fixed in the build** (see Known exceptions, item 1).
14. **One connected application state** for every shared record. On the canvas each board keeps its own state; the product must not.

## Known exceptions requiring attention

1. **B1-10 (Super Admin Requests) below 760 px:** the table header becomes visually hidden (labelled-row mode) but its “Received” sort button stays in the tab order, so keyboard users can focus an invisible control. Fix: show the sort as a visible control above the rows at that width (or take the hidden header’s controls out of the tab order and provide a visible equivalent). Recorded on B8-03 and B8-08.
2. **Board state is per board.** Flow boards share one record inside the board only; cross-board continuity is a build requirement (B8-04, B8-06).
3. **Batches 1–3 frames scroll inside a fixed height.** That is canvas presentation (a viewport crop), not product behaviour: product pages grow with their content, as in Batches 4–8.
4. **Not product features:** board controls (“Restart”, “Sample: …”), captions, annotations, sample-data labels, the frames themselves, and the rejected Slice-1 connected UI.
5. **Routes are proposals** (`screens.json` `proposedRoute`); the screen, its type and navigation place are fixed, the URL is the implementer’s choice.
6. **Canvas runtime.** Every board loads `./support.js`, which the Claude Design host supplies; it is not a design file. A copy from the owner’s File-35 package is in `runtime/` for offline preview only (`runtime/README.md`); never copy it into the product.
7. **Fonts are external:** Public Sans from Google Fonts. Sample links ending in `.example` and the three CSV-template `data:` links are intentional.
8. **Three proof frames** (B1-12 × 2, B2-14) run 1–3 px past their fixed height (sub-pixel; nothing hidden). No action.
9. **Batch-0 specimen boards** log SVG template warnings while filling template values. Not product screens; no action.

## Using this package with Claude Code

1. Unzip into the frontend repository as `design/handoff-v46/` and commit it as read-only reference.
2. Check integrity from that folder: `shasum -a 256 -c SHA256SUMS.txt` (macOS) or `sha256sum -c SHA256SUMS.txt` (Linux) — every line must say OK.
3. Add to the repository’s `CLAUDE.md`: “Frontend design reference: `design/handoff-v46/START-HERE.md` (frozen canvas v46). Never edit files under `design/handoff-v46/`.”
4. Start implementation in a separate Claude Code session with: “Read `design/handoff-v46/START-HERE.md`, `FREEZE-RECORD-v46.md` and `canvas-v46/project/handoff/README.md`, then propose the plan for phase 0 (foundation) only.”
