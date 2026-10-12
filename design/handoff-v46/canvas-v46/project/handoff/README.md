# XR Learning Platform — design-to-code handoff (Batch 8)

This package indexes the approved Claude Design canvas (Batches 0–8) for the separate build phase in
**React · Next.js (App Router) · TypeScript**. It does not contain application code, and Batch 8 did not start one.

**The boards are the visual and behavioural authority.** The JSON files only index them. Where a board and a
file differ, the board wins and the difference is a defect to report.

## How to read the canvas

| Boards | What they are |
|---|---|
| `01`–`13` (Batch 0) | Visual foundation: tokens, components, states, shell, sidebars, help, system messages, archetypes, dialogs, responsive and accessibility rules |
| `B1-…` to `B7-…` | Approved screens per batch. Each board shows one screen family in its states, at 1440 / 1024 / 768 / 375 |
| `B?-00` | Batch index · `B?-1x` flow boards (one shared record per board) · change logs |
| `B8-00`…`B8-08` | Consistency sweep and this handoff: register, corrections, terminology, traceability, responsive proof, specs, open decisions |

Inside every board, captions, annotations, board controls (“Restart”, “Sample: …”) and the frames themselves are
**not product features**. Do not copy them, and do not copy the rejected Slice-1 connected UI.

## Files

| File | Holds |
|---|---|
| `screens.json` | Every Inventory v3 screen ID: surface, type (page · tab · step · state · menu · action), navigation place, proposed route, approved boards, disposition |
| `navigation.json` | Sidebar / header destinations per role and what is reached from them |
| `flows.json` | Flows A–F and the device-transfer chain, step by step |
| `entities.json` | Shared records, owners, exact status words, relations; the business rules |
| `tokens.json` · `tokens.css` | Design tokens, copied unchanged from `xr-foundation.css` |
| `open-decisions.json` | Every open decision with its safe treatment and classification (0 frontend build blockers) |
| `assets.json` | Real assets vs placeholders |
| `files.json` | Every deliverable file with md5 and size |

## Rules that are not negotiable

1. Published ≠ access. Publishing or releasing never grants anyone access.
2. Institution access ≠ Student access. Available technology ≠ entitlement.
3. Progress is per format. No overall completion verdict.
4. Scores and pass criteria belong to one assessment.
5. First publication: Content Manager. Correction Release / Hold: Super Admin (never called “Publish”).
6. Device transfer is authorisation of a different device, not shipping. Approve only.
7. Feedback: one record per Student × Experiment × format, offered only after that format is Completed.
8. “Composite Wall Conduction” and “Conduction Through a Composite Wall” stay two records until OD-B5-09 is decided.
9. No real authentication, payment processing, XR runtime, grading automation or backend persistence until decided —
   build typed mock services that return the sample world.
10. The BITS Pilani / WILP logo is a labelled placeholder; Public Sans is the working font.

## What the build must add that the canvas cannot show

- **One shared application state** for every record in `entities.json`, so a decision in one role’s screen is
  what every other role sees. On the canvas each board keeps its own state.
- Role guards per workspace; actions offered only where the design offers them.
- Validation exactly as drawn: field errors plus an error summary; required reasons where shown.
- Tests: flows A–F and the device chain across roles; keyboard and focus; 1440 / 1024 / 768 / 375;
  and a **real-pointer reach test for every confirm button** (wheel + click, not programmatic scroll).

## Build order (Inventory §U)

0 Foundation → 1 Public + access spine → 2 Campus distribution → 3 Learning, feedback, device chain →
4 Teaching & assessment → 5 Production + first publication → 6 Corrections + governance → 7 Consolidation.
B8-06 lists the boards for each phase.

## Done, for one screen

Matches its board at all four widths · every state drawn on the board exists (loading, empty, failed, no match,
read-only, success, decided) · every link goes where B8-01 says · labels and status words match the board ·
keyboard and focus behaviour as on boards 10 and 12 · no control the board does not show.
