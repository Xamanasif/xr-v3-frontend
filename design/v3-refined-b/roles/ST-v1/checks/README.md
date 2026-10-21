# checks/ · how the final Student design was built and verified

Status of this package: DESIGN COMPLETE (19 / 19) · CONNECTED PREVIEW COMPLETE · ASSEMBLY PENDING XS · OWNER APPROVED (21 Oct 2026).

- `build/`: the inputs that reproduce `project/StudentFinal.dc.html` and `project/v3-student-final.css`. `Main.dc.html` (the original design, its logic carried verbatim) and `v3-student.css` (the source of Part A) are build inputs only, not designs to implement. `final-src/` holds the final templates, view models and the Part B stylesheet. Run `fx_build.py`, then `fx_consolidate.py`.
- `scripts/`: the review scripts behind `CHECKS.md` (rendering, journeys, logic parity, links, accessibility, keyboard, hover, states, scroll containers, full-width buttons, stress, boards, documents). They use the original workspace paths and need the Claude Design host's runtime file, which is not included and must never ship.
- `results/`: the raw results those scripts wrote (JSON and logs; images are in the screenshot archive).
