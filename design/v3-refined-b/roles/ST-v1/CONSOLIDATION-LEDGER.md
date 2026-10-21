# Consolidation ledger · Student · from the original design to the one final design

The final Student design is **one preview root and one role stylesheet**: `project/StudentFinal.dc.html` and `project/v3-student-final.css`, on top of the locked foundation (`core.css`, `rb.css`, `rb-kit.css`). Every earlier generation stays on the canvas, unchanged, on the **History** page. None of them is part of the integration package.

## The five generations

| # | Generation | Files | Scope | Status now |
| --- | --- | --- | --- | --- |
| 1 | Original complete-role design | `Main.dc.html`, `v3-student.css`, 112 boards (`ST*`, `XS*`, `MENU*`) | All 19 IDs, functional baseline | Superseded visually. Its data, routing, guards and mutations are still the final's code, verbatim |
| 2 | Checkpoint 1 · visual refinement | `MainRefined.dc.html`, `v3-student-refine.css`, 38 `CP*` boards | ST-01 Home, ST-05 Overview | Not approved; superseded by checkpoint 2 |
| 3 | Checkpoint 2 · correction | `MainC2.dc.html`, `v3-student-c2.css`, 63 `C2*` boards | ST-01, ST-05 Overview, ST-11 empty state, ST-15 | Superseded by R2 |
| 4 | R2 · complete-role redesign | `StudentR2.dc.html`, `v3-student-r2.css` (loaded after `v3-student.css`), 108 `R2-*` boards | All 19 IDs | Consolidated into the final; kept for reference |
| 5 | **Final** | `StudentFinal.dc.html`, `v3-student-final.css`, 143 `F-*` boards | **All 19 IDs and every subview** | **Approved by the owner, 21 Oct 2026 — the one design to implement** |

## How the stylesheets became one

R2 drew with two role stylesheets layered on the foundation: the original's `v3-student.css` and R2's `v3-student-r2.css`. The final has one, `v3-student-final.css`:

- **Part A**: the 115 rules of `v3-student.css` that the final screens can still match, carried verbatim. These are the shell, the review controls, the focused-task shell and the borrowed XS surfaces. The other 244 rules belong to retired layouts and are not carried: the 72 px format tiles, the old band, rows, cards, scale and score.
- **Part B**: the Student components (`sv-`), from R2, with the final-pass changes below.

**Proof.** Before any final-pass change, `StudentFinal` with the one stylesheet was rendered against `StudentR2` with the two layered stylesheets. All 155 cases at 1440 and 375 were pixel-identical: **310 / 310**. A rule was dropped only when it needs a class that the final source never produces. The script checks the two verbatim view-model fields that still produce retired classes (`hubVM.cells`, `hubVM.note`) and confirms that no template reads them.

## Every refinement and what became of it

| Introduced in | Refinement | In the final |
| --- | --- | --- |
| Checkpoint 1 | Home as a navy cover card: next step and a three-part path | Superseded by checkpoint 2, then by R2's *Continue learning* card. **Final: R2's card** |
| Checkpoint 1 | Overview as a reading column with the next step pinned beside it | Superseded by checkpoint 2's Overview. **Final: checkpoint 2's Overview**, re-checked |
| Checkpoints 1–2 | Home's gold action goes straight to the next step (Continue WEB opens the WEB page) | **Carried** |
| Checkpoints 1–2 | Next-step titles reworded (Start with the resources, Run a simulation, Feedback on VR is open); same rule | **Carried** |
| Checkpoints 1–2 | New-student *How it works* (three steps) | **Carried** |
| Checkpoint 1 | *Up next* became *Also waiting for you* | Superseded by R2's *Also in this experiment* list. **Carried** |
| Checkpoint 2 | Home drops the shortcut links to the hub tabs and *View all courses* | **Carried**; listed as a decision for the owner |
| Checkpoint 2 | Overview splits formats into yours (with your progress) and not available (with the reason); each action once | **Carried** |
| Checkpoint 2 | Overview's *Choose a format* link replaced by the format rows | **Carried** |
| Checkpoint 2 | ST-11 compact empty state | Superseded by R2's ST-11 (empty tabs say where the assessment is). **Final: R2's** |
| Checkpoint 2 | ST-15 as a table with 56 × 24 chips, dated facts and one action | **Carried**; the final removes the box inside the card and adds medium-width rows |
| Checkpoint 2 | Internal identifiers hidden on four screens | Reverted in R2 to the original's identifiers (owner decision 6; R2 brief: preserve the baseline), and the final candidate kept them as an open decision. **Settled at approval: internal record identifiers are not labels on Student pages.** Checkpoint 2's intent is therefore carried, by the owner's decision rather than silently — see `HANDOFF.md` decision 1 for each place and how to restore it |
| Checkpoint 2 | *Pending*: “ST-07 and ST-10 still use the large format tiles — to align once approved” | **Done in R2** (chips everywhere). Verified in the final: no tile is rendered, and the tile CSS is not carried |
| R2 | All 19 screens redesigned: one main surface plus one aside, gold once per view, one format chip, date blocks, stage trackers, compact refusals | **Carried** |
| R2 | ST-05 Overview and ST-15 *carried from checkpoint 2* | **Consolidated**: both are in the one stylesheet. Reviewed in the final pass; ST-15 updated |
| R2 | Reference identifiers as in the original (ACC-0107, SACC-0310, DTR-0018) | Carried through the final candidate (155 / 155 cases identical to the original), then **removed from Student's labels at approval** (presentation only; the records stay in the data and the view models) |
| R2 | Message title 30/36 for refusals and withheld results | **Carried** |
| R2 | AR / MR refusals lead with the formats you can use | **Carried** |
| R2 | Experiment sections wrap as chips on phones | **Carried** |

## Pending, incomplete or awaiting propagation: found and finished

| Item | Where it came from | Resolution |
| --- | --- | --- |
| Two role stylesheets layered, with old components still loaded | R2 | One stylesheet. Pixel identity proven first; the rules for retired layouts are not carried |
| ST-05 Overview and ST-15 still marked *carried from checkpoint 2* | R2 register | Reviewed and consolidated. The register now marks every subview REDESIGNED or REVIEWED AND UNCHANGED |
| ST-15: experiment box inside the card (a card inside a card, against the R2 rule) | Checkpoint 2 carry | Flat experiment groups with a tinted header band |
| ST-10 / ST-15 table wider than its card at 768–1024 (both formats completed). In R2 the card clipped the *Give feedback on VR* button by about 10 px. The earlier viewport-only overflow check missed it | R2 | Rows below 766 px, one 24 / 18 px gutter. A new box-spill check runs on every render |
| Progress gutters 22 / 18 px, not the 24 / 18 px of lists and card headers | Checkpoint 2 carry | One gutter |
| ST-05 Assessment tab: a full-width gold bar on tablets | R2 | The button keeps its own width under the content; full width only on phones |
| ST-12: six facts in one long column on phones | R2 | Two columns (one below 330 px) |
| Stage checks hidden at 375, although the breakpoint was meant for 320 | R2 | Hidden only below 330 px |
| Hover missing on the setup disclosure, answered navigator numbers and full-mark chips | Original / R2 | Hover states added; a hover check now covers every control on 23 pages |
| ST-17 at 320: the answer words clipped beside the dots | R2 | The words wrap under the dots when the row is too narrow; 1440–375 unchanged |
| ST-12 *Not passed* on phones: *Try again* and *See result* stopped about 67 px short of the card edge, because the action row shrank to its two short labels (the other ST-12 states have longer labels, so they looked right) | R2 | The action row stretches. A full-width button check now runs on every case at 375 and 320 |
| ST-11 at 320: *Results* and its count cut off at the edge of the scrolling tab strip | R2 | Tighter tabs below a 330 px page. A scroll-container check now runs on every case at all five widths |
| A hook class with no styling on held format cards | R2 | Removed |
| ST-04 and ST-06 loading and failure states never rendered | R2 case list | Added to the cases, rendered at every width, on boards |
| 1024 and 768 rendered only for a subset | R2 | Every case rendered at 1440, 1024, 768 and 375 |
| *Assembly pending XS*: account menu, Help, signed out, not your workspace, inactive notice | Contract | Not Student design work. Kept as faithful borrowed surfaces, unchanged, with the status said plainly |
| Internal record identifiers in Student sentences, the Progress grant line and the My device request (open decision at the candidate stage) | Original design / R2 | **Settled by the owner at approval**: none appears in a Student label. Applied in presentation only and documented place by place (`HANDOFF.md` decision 1); a rendered scan of every case confirms the only identifier-shaped strings left are the two course codes and the headset asset tag |

## Retired from the final, kept on the History page

`Main.dc.html`, `MainRefined.dc.html`, `MainC2.dc.html`, `StudentR2.dc.html`; `v3-student.css`, `v3-student-refine.css`, `v3-student-c2.css`, `v3-student-r2.css`; the 112 original, 38 checkpoint 1, 63 checkpoint 2 and 108 R2 boards. Every file is byte-identical to its earlier delivery (hashes in `FOUNDATION-LOCK.json`). `Main.dc.html` is still the build input for the final's logic (`checks/build/`). It is not a design to implement.
