# checks/

How the evidence in CHECKS.md was produced, so it can be re-run.

- `scripts/` — Node (Playwright 1.56, Chromium) runners and the Python build scripts:
  - `render.mjs` renders board wrappers and records height, horizontal overflow, elements off the page, text under 13 px and console errors;
  - `journey.mjs` drives the live preview through real clicks, typing and keys (`specs/journeys-*.json`);
  - `links.mjs` clicks every visible anchor from each start state and reads where it lands;
  - `scan.mjs` is the structural accessibility scan; `elcmp.mjs` compares single components between two builds;
  - `jsstrings.mjs` lists the string literals in the view logic (used by `consolidate.py` to keep classes built at runtime);
  - `build_final.py` + `build-parts/` assemble Main from the R1 checkpoint; `consolidate.py` makes the single `fa.css`;
    `boards.py`, `coverage.py`, `mkcanvas.py` and `handoff.py` make the boards, the register, the canvas and this package.
- `specs/` — the journey definitions (J1–J9), the documented journey changes, the render and link-crawl start lists.
- `results/` — raw results: journeys per set, links, scan, renders, pixel comparisons (before/after consolidation, published vs final, R1 vs final), element comparisons and the long-text stress run.
