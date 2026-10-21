# checks/

Results and harness for the Academic Reviewer FINAL design. Nothing here is part of the design source.

## What is here, and an honest note about dates

| Folder | What it holds |
| --- | --- |
| `results/` | the 21 October re-verification of the exported bytes: `boards-render.json` (all 65 boards, with the internal-ID scan per board), `smoke.json` (32 end-to-end checks at 1440 and 375), `static.json` (15 source checks) |
| `harness/` | the scripts that produced those results: `serve.py`, `harness.py`, `render.py`, `smoke.py`, `build_coverage.py`, and the local font stylesheet |
| `results-completed-role-2026-10-18/`, `harness-completed-role-2026-10-18/` | the completed role's full suites and their raw results (journeys, keyboard, links, reflow, long text). They are the baseline these designs were tested against, and the scripts are the ones to re-point at `project/` if you want to re-run the full set |

The 20 October full-suite run on the refined bytes (journeys 229/229/230/230, keyboard 80, links 146, reflow 11, long text 21, axe 0 violations, source 22) is reported in `CHECKS.md`. Its raw result files were lost when the sandbox holding them was reclaimed before this export; the 21 October run in `results/` was made on the exact bytes shipped here and re-covers rendering, the ID policy, the end-to-end flow and the source rules. Re-running the full suites needs the harness in `harness-completed-role-2026-10-18/` re-pointed at this `project/` folder.

## Running them

Python 3 with Playwright (Chromium) and Node for the fixture extractor. Paths at the top of each script point at the sandbox they ran in; change them to your copy.

1. `serve.py` serves `project/` at `/fin/` and answers any `…/support.js` with the Claude Design type's `dc-runtime.js` — supply your own copy, it is the host's runtime and is not in this package.
2. `harness.py` holds the shared page helpers. Google Fonts is blocked in that sandbox, so requests for it are answered with a local Public Sans (OFL) file, not included here.
3. `python3 render.py` renders every board at its frame width, checks overflow, console and requests, writes the screenshots, and scans the rendered text of each board for SUB-/UPD-/REQ-/ACC-style IDs.
4. `python3 smoke.py` runs the end-to-end reviewer journey at 1440 and 375 and re-checks the ID policy at each step.
5. `build_coverage.py` regenerates `COVERAGE.md` and `COVERAGE.json` from the Coverage board, so the register and the canvas cannot drift apart.
