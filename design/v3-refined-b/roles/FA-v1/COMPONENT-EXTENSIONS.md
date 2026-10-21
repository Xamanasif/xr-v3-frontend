# Faculty — component reuse and the role stylesheet

Foundation `XR-V3-RB-1.0` (Refined Direction B). The three shared stylesheets are byte-identical to the pack (`core.css`, `rb.css`, `rb-kit.css`; hashes in `FOUNDATION-LOCK.json`). All Faculty styling is in **one additive file, `project/fa.css`** (sha256 `e8aa113a30a4059f857344bac809114e8c293d673ee0f33efd069e34aa800f8d`), with the `fa-` prefix.

`fa.css` never redefines an `.xr`, `.rb`, `rb-` or `rk-` class or a token outside an `fa-` context. Its values are existing tokens or literals already used in `rb-kit.css`; there are no new colours, fonts, radius families or shadows. Extensions exist only where the kit has no pattern for a Faculty task.

## Reused from the V3 kit unchanged

- **Shell:** `rb-rail` with `rb-nav` and `rb-count`; `rb-top`, `rb-menu`, `rb-drawer` and `rb-scrim` (drawer below 1024 px); `rb-acct`, `xr-avatar`; the `rb-logo` reserved slot.
- **Page heads:** `rk-crumbs`, `rk-head`, `rk-head-text`, `rk-head-act`, `rb-h1`, `rk-title`, `rk-eyebrow`, `rb-eyebrow-date`, `rk-sub`, `rk-meta`.
- **Surfaces and layout:** `rk-surface`, `rk-sec`, `rk-sec-h`, `rk-detailwrap` / `rk-detail` / `rk-aside` (single column below 860 px), `rk-mainsheet`, `rk-panel` (navy head).
- **Lists:** `rk-toolbar`, `rk-tools`, `rk-search`, `rk-selwrap` / `rk-select`, `rk-statusline`, `rk-chip`, `rk-clear`, `rk-count`, `rk-table`, `rk-rowlink`, `rk-tabs` / `rk-tab`.
- **Forms:** `rk-field`, `rk-label`, `rk-hint`, `rk-input`, `rk-textarea`, `rk-fieldset`, `rk-choices` / `rk-choice`, `rk-checks` / `rk-check`, `rk-errsum`, `rk-ferr`.
- **Feedback:** `rk-notice` variants, `rk-pending`, `rk-locked`, `rk-state`, `rk-skel`, `rk-done`, `rk-tag-warn`.
- **Dialog:** `rk-scrim` and `rk-dialog` (Delete question, Confirm marks) — the V3 SA02 pattern and focus handling.
- **Status and format grammar:** `xr-st` pills and the compact `xr-fmt` WEB / AR / VR / MR chips (12 px kit component, unchanged).
- **Buttons:** `rb-btn` with `--primary` (gold, one per view), `--lg`, `--ghost`, and `rb-link`.

## `fa.css` components

Part 1 holds the components kept from the published Faculty build; part 2 the components of the refined design. Classes are listed as they appear in the file.

| Part | Component | Why the kit could not express it | Where | Classes |
| --- | --- | --- | --- | --- |
| 1 | Layout helpers | Action rows, a narrow column, quiet supporting text, numbered markers and surface heads. | Throughout | `fa-actions` `fa-narrow` `fa-num` `fa-quiet` `fa-row` `fa-single` `fa-surfhead` |
| 1 | Tags and quiet identifiers | A neutral tag (for example “Drafted with assistance”), the quiet identifier line — which since the owner’s 21 Oct 2026 decision carries a version or the student’s own institution id, never an internal technical id — and an in-panel record link. | FA-14, FA-15, FA-21 | `fa-exp-link` `fa-id` `fa-tag` |
| 1 | Stepper | Guided-flow steps: current, done and to do, with screen-reader suffixes. | FA-07, FA-17 | `fa-step` `fa-step-n` `fa-steps` |
| 1 | Responsive tables | Container-query tables that become labelled rows below 760 px; static rows with explicit actions; a keyboard-focusable sideways-scroll region for CSV previews. | FA-04, 06, 12, 14, 17, 18, 20 | `fa-c-main` `fa-cellacts` `fa-cellline` `fa-cellsub` `fa-desk` `fa-lbl` `fa-mob` `fa-nowrap` `fa-scrollx` `fa-static` `fa-table` `fa-tablewrap` |
| 1 | Segmented control | A filter or view switch with aria-pressed and counts; fixed-width select fields in toolbars. | FA-11, FA-12, FA-18; toolbars | `fa-field-sel` `fa-seg` |
| 1 | Record tabs | Tabs with counts on the assessment record and the question bank. | FA-08…FA-12, FA-14 | `fa-recordtabs` `fa-tabn` `fa-tabs` |
| 1 | Checklist | Ready checklist and learning outcomes. | FA-05, FA-07, FA-08 | `fa-check` |
| 1 | Question list | Ordered question rows with move, remove and “Use updated version”; preview option rows; the written-answer box; the saved note. | FA-07, FA-09, FA-11, FA-19 | `fa-avail` `fa-iconbtn` `fa-opt` `fa-opt-dot` `fa-opt-ok` `fa-opts` `fa-q` `fa-qact` `fa-qlist` `fa-qm` `fa-qn` `fa-qnote` `fa-qt` `fa-res` `fa-res--no` `fa-res--ok` `fa-savednote` `fa-wbox` |
| 1 | Form helpers | Form column and footer (primary first on phones), option rows with a Correct radio, the file picker and summary lists. | FA-07, FA-10, FA-15, FA-17 | `fa-file` `fa-file-name` `fa-form` `fa-formfoot` `fa-formfoot-l` `fa-formfoot-r` `fa-optrow` `fa-sumdl` |
| 1 | Deleted list | Deleted questions, history kept. | FA-14 | `fa-deleted` |
| 1 | Account menu (borrowed XS-05) | The shared account menu, rebuilt with V3 tokens. | Shell | `fa-acctwrap` `fa-menu` `fa-menu-list` `fa-menu-name` `fa-menu-sub` `fa-menu-who` `fa-menuscrim` |
| 1 | Message and refusal template (borrowed XS-06) | Scoped refusals, in-panel refusals, message cards and the signed-out page. | Shared | `fa-inlinemsg` `fa-msg` `fa-msg-act` `fa-msg-d` `fa-msg-ico` `fa-msg-ico--lock` `fa-pubbody` `fa-publogo` `fa-pubname` `fa-pubpage` `fa-pubtop` |
| 1 | Export band (FA-22) | The export confirmation above the list it exported. | FA-12, FA-20 | `fa-export` |
| 1 | Marking helpers | “Go to the marks” when the panel sits under the answer; a date line in a format cell. | FA-19, FA-20 | `fa-fmtcell-d` `fa-gomark` |
| 1 | Responsive rules (part 1) | Below 760 px: stacked form footers (primary first), full-width segmented controls, simpler message layouts. | Throughout | `fa-actions` `fa-export` `fa-field-sel` `fa-formfoot` `fa-formfoot-l` `fa-formfoot-r` `fa-iconbtn` `fa-inlinemsg` `fa-msg` `fa-msg-act` `fa-msg-ico` `fa-pubbody` `fa-pubtop` `fa-seg` `fa-step` `fa-surfhead` |
| 2 | R1 shared patterns | P4 unit meters (one unit per student; dense above 24), P2 figures, P9 date tiles and panes. | FA-01…FA-06, FA-08, FA-12, FA-20 | `fa-date` `fa-fig` `fa-figs` `fa-hidden-lbl` `fa-k` `fa-pane` `fa-pane-head` `fa-prog` `fa-prog-row` `fa-prog-t` `fa-units` `fa-units--dense` |
| 2 | FA-01 Overview | P1 priority band sized to 1–3 items, Coming up, Your teaching, get-ready steps and the P8 message card. | FA-01 (message card everywhere) | `fa-calm` `fa-date` `fa-msgcard` `fa-ovgrid` `fa-pi-list` `fa-pi-more` `fa-prio--1` `fa-prio--2` `fa-ready` `fa-ready-act` `fa-ready-d` `fa-ready-i` `fa-ready-list` `fa-ready-n` `fa-ready-t` `fa-tc` `fa-tc-h` `fa-tc-t` `fa-te` `fa-te-asm` `fa-te-h` `fa-te-n` `fa-te-t` `fa-upi` `fa-upi-d` `fa-upi-meter` `fa-upi-none` `fa-upi-rel` `fa-upi-t` `fa-uplist` |
| 2 | FA-02 course ledger | P3 ledger: tinted course header with figures and aligned experiment rows. | FA-02 | `fa-cid` `fa-course` `fa-course-act` `fa-course-body` `fa-course-h` `fa-course-id` `fa-course-src` `fa-course-t` `fa-courses` `fa-fig` `fa-figs` `fa-foot` `fa-hidden-lbl` `fa-listcount` `fa-xasm` `fa-xasm-c` `fa-xasm-d` `fa-xasm-n` `fa-xcell` `fa-xcols` `fa-xhead` `fa-xname` `fa-xrow` `fa-xrows` `fa-xt` `fa-xwait` |
| 2 | FA-03 identity band and experiment panels | P2 identity band; one panel per experiment with activity and assessment columns. | FA-03 (band also FA-05, FA-08…FA-12) | `fa-asm-d` `fa-asm-n` `fa-asm-note` `fa-asm-subs` `fa-asm-wait` `fa-cid` `fa-cid-eyebrow` `fa-cid-src` `fa-cid-t` `fa-cid-text` `fa-cid-top` `fa-fig` `fa-figs` `fa-k` `fa-prog-row` `fa-prog-t` `fa-xp` `fa-xp-about` `fa-xp-acts` `fa-xp-body` `fa-xp-col` `fa-xp-colh` `fa-xp-fm` `fa-xp-foot` `fa-xp-head` `fa-xp-id` `fa-xp-t` `fa-xps` |
| 2 | FA-19 reading sheet and marks panel | P5: automatic-marks strip, answer at reading width, guidance note, score field, live total, save and confirm. | FA-19 | `fa-ans-h` `fa-answer` `fa-auto-q` `fa-autolist` `fa-autos` `fa-autos-h` `fa-confirm` `fa-done` `fa-done-acts` `fa-done-total` `fa-fb` `fa-final` `fa-guide` `fa-guide-k` `fa-guide-t` `fa-mbody` `fa-mpanel` `fa-msec` `fa-ph-note` `fa-qpos` `fa-save` `fa-save-d` `fa-savednote` `fa-score` `fa-score-lbl` `fa-score-q` `fa-scorebox` `fa-scorein` `fa-scoreof` `fa-sheet` `fa-sheetq` `fa-sheetq-h` `fa-sheetq-k` `fa-sheetq-m` `fa-sheetq-t` `fa-total` `fa-total-d` `fa-total-k` |
| 2 | FA-16 authoring layout | P6 sectioned authoring with a side panel; draft review cards (also on FA-14). | FA-14, FA-15, FA-16 | `fa-author` `fa-choice-t` `fa-dcard` `fa-dcard-act` `fa-dcard-m` `fa-dcard-t` `fa-dcard-tags` `fa-dcard-top` `fa-dkey` `fa-dl-done` `fa-dlist` `fa-dopt` `fa-dopt-k` `fa-dopts` `fa-draftfoot` `fa-draftfoot-note` `fa-draftfoot-primary` `fa-formcol` `fa-howto` `fa-nstep` `fa-nstep-body` `fa-nstep-hint` `fa-nstep-n` `fa-nsteps` `fa-paste` `fa-sample` `fa-segpick` `fa-side` `fa-side-acts` `fa-side-sec` `fa-sidefacts` `fa-srcgrid` `fa-typegrid` |
| 2 | Responsive rules (R1) | Page-level container rules for the R1 compositions. | FA-01, 02, 03, 16, 19 | `fa-author` `fa-cid` `fa-ovgrid` `fa-pane` `fa-prio--1` `fa-prio--2` `fa-qpos` `fa-ready` `fa-ready-act` `fa-scorebox` `fa-segpick` |
| 2 | Final-pass shared components | List toolbars, refined table cells and compact phone rows (`fa-ptable`), the record band (`fa-rec`), sectioned forms with aligned fields (`fa-fsec`, `fa-fields3` subgrid), the assessment panel (`fa-apanel`), aside-first on narrow widths (`fa-asidefirst`), the rules list and question type tags. | FA-04…FA-21 | `fa-apanel` `fa-apanel-id` `fa-asidefirst` `fa-asm-d` `fa-asm-n` `fa-c-inl` `fa-c-main` `fa-c-nolbl` `fa-c-st` `fa-c-wide` `fa-cellfm` `fa-cellfoot` `fa-cellline` `fa-cellmeter` `fa-cellname` `fa-cellsub` `fa-cellsub0` `fa-choices3` `fa-exp-link` `fa-fhead` `fa-fields3` `fa-fig` `fa-fig--fm` `fa-fig-v` `fa-fig-v--date` `fa-fmsg` `fa-formcol` `fa-fsec` `fa-fsec--tint` `fa-fsec--warn` `fa-fsec-t` `fa-id` `fa-introbox` `fa-introtext` `fa-k` `fa-lbl` `fa-left` `fa-panel-acts` `fa-panel-lead` `fa-panel-x` `fa-prog--cell` `fa-prog-row` `fa-prog-t` `fa-ptable` `fa-ptable2` `fa-qmeta` `fa-qmeta-m` `fa-qtype` `fa-qtype--w` `fa-rec` `fa-rec-meta` `fa-rec-sep` `fa-rec-t` `fa-rec-wait` `fa-reldate` `fa-rules` `fa-table` `fa-tabs` `fa-units` `fa-waitlist` `fa-xwait` |
| 2 | FA-04 | Experiments table columns. | FA-04 | `fa-c-act` `fa-c-exp` `fa-xtable` |
| 2 | FA-05 | About grid and resource list. | FA-05, FA-21 | `fa-about` `fa-aboutgrid` `fa-check` `fa-reslist` |
| 2 | FA-06 | Assessments table columns. | FA-06 | `fa-atable` `fa-c-name` `fa-c-subs` |
| 2 | FA-07 | Experiment choice cards, question picker, result card, step summary and a stepper that fits a phone. | FA-07 | `fa-author--one` `fa-expchoice` `fa-expchoice-m` `fa-pick` `fa-pickcount` `fa-qhead` `fa-qhead-t` `fa-result` `fa-result-t` `fa-side-note` `fa-side-ver` `fa-sidecheck` `fa-step` `fa-step-l` `fa-steps--fit` `fa-sum-i` `fa-sum-ico` `fa-sum-v` `fa-sumlist` |
| 2 | FA-22 | The export preview keeps one line per row and scrolls sideways. | FA-12, FA-20 | `fa-export` `fa-scrollx` |
| 2 | FA-08…FA-12 record | Questions head and add actions, the bank panel, the preview sheet and stage, the submissions toolbar and table. | FA-08…FA-12 | `fa-avail--panel` `fa-avail-t` `fa-expl` `fa-expl-k` `fa-expl-t` `fa-guide` `fa-order` `fa-pvbar` `fa-pvhead` `fa-pvhead--key` `fa-pvhead-d` `fa-pvhead-k` `fa-pvhead-t` `fa-pvintro` `fa-pvlist` `fa-pvopts` `fa-pvq` `fa-pvq-t` `fa-pvsheet` `fa-pvstage` `fa-pvsurf` `fa-q` `fa-qact--order` `fa-qadd` `fa-qfoot` `fa-qlist--spaced` `fa-qmore` `fa-relsub` `fa-res` `fa-seg--bar` `fa-stable` `fa-tbar` `fa-tbar-act` `fa-tbar-t` `fa-wbox` |
| 2 | Responsive rules (final pass) | Phone and tablet rules for the final-pass compositions. | FA-04…FA-22 | `fa-cellmeter` `fa-fhead` `fa-field-sel` `fa-fig` `fa-fig--fm` `fa-fmsg` `fa-formfoot-r` `fa-fsec` `fa-panel-acts` `fa-prog--sum` `fa-prog-row` `fa-prog-t` `fa-pvbar` `fa-pvhead` `fa-pvhead--key` `fa-pvq` `fa-pvsheet` `fa-pvstage` `fa-qact--order` `fa-qadd` `fa-qmore` `fa-rec-sep` `fa-rules` `fa-seg` `fa-seg--bar` `fa-seg-long` `fa-tbar-act` `fa-tools` `fa-units` |
| 2 | FA-14 | Bank table columns, deleted box and the no-course message card. | FA-14 | `fa-author` `fa-btable` `fa-c-q` `fa-c-used` `fa-deletedbox` `fa-dlist` `fa-formcol` `fa-fsec` `fa-msg-act` `fa-msgcard` `fa-qmeta` |
| 2 | FA-15 | Answer hint, option list, the facts list and “What students see”. | FA-15 | `fa-answerhint` `fa-fmsg--stack` `fa-optlist` `fa-seelist` `fa-sidedl` |
| 2 | FA-17 | File row, check figures, row-check table and the template reference. | FA-17 | `fa-boxtable` `fa-deletedbox` `fa-dest` `fa-dl` `fa-file--import` `fa-filerow` `fa-repfigs` `fa-rowcheck` `fa-tpl` |
| 2 | FA-18 | Queue count, oldest wait and filters. | FA-18 | `fa-mqasm` `fa-mqcount` `fa-mqtools` `fa-oldest` |
| 2 | FA-20 | Per-format summary, roster columns and last-activity cell. | FA-20 | `fa-c-asm` `fa-c-fm` `fa-c-who` `fa-fmcell` `fa-lastv` `fa-prog--sum` `fa-prog-row` `fa-rtable` `fa-slsum` |
| 2 | FA-21 | Per-format list and resource status list. | FA-21 | `fa-fmlist` `fa-fmlist-d` `fa-quiet` `fa-reslist--status` |

## Container queries

Kit and published: `rb` (<1024 / <760), `rbpage`, `rkd` (detail goes single column below 860 px), `rkmain`, `rktool`, `fatable` (stacked tables below 760 px), `farec`. Added by the refined design: `faprog`, `faready`, `facourse`, `facid`, `faxp`, `faauthor`, `faform`.

## Consolidation record

- The R1 checkpoint and the final pass worked in a second file with an `fr-` prefix. For integration it was merged into `fa.css`: 301 names renamed (`rename-map.json`), with explicit names where a plain rename would have met a live published class (for example `fr-form` → `fa-formcol`, `fr-step` → `fa-nstep`, `fr-seg` → `fa-seg--bar`).
- One deliberate merge: `fr-cellline` was a copy of the published `fa-cellline` and now uses it.
- 84 selectors that no screen uses any more were removed (82 from the published file, 2 from the refinement rules); the list is in `checks/results/consolidation-report.json`. Liveness was read from the templates and from every string literal in the view logic (a real JavaScript parser), so classes assembled at runtime were kept.
- Every one of the 219 board and responsive renders is pixel-identical before and after the consolidation.

## Borrowed shared surfaces (XS contract, not redesigned)

- XS-05 account menu and menu drawer; XS-07 Help & support (My reports, Report a problem); XS-03 Signed out; XS-06 Not your workspace and the scoped “isn’t available to you” refusals. Replace them with the delivered XS components when the shared package lands.
