# Component extensions · Academic Reviewer · FINAL — OWNER APPROVED

Foundation `XR-V3-RB-1.0`. The three shared base styles (`core.css`, `rb.css`, `rb-kit.css`) are copied **byte-identical** (hashes in `FOUNDATION-LOCK.json`). Everything role-specific is in one additive stylesheet, `project/rv.css`, under the `rv-` prefix. This file replaces the completed role's version of 18 Oct 2026.

## Rules kept

- `rv.css` never redefines an `xr-`, `rb-` or `rk-` class, a global token or a custom property. Every selector carries an `rv-` class; where a kit component is adjusted it is through a compound selector on an `rv-` modifier (for example `.rk-table.rv-qtable`, `.rv-idcard .rk-meta`, `.xr-st.rv-st-wrap`).
- Colours come from the existing tokens (`--navy`, `--indigo`, `--indigo-2`, `--indigo-line`, `--ink`, `--ink-2`, `--ink-3`, `--paper`, `--mist-2`, `--rb-canvas`, `--rb-line`, `--rb-line-2`, `--rb-sel`, `--rb-sel-tint`, `--rb-tint`, `--rb-tint-line`, `--rb-ivory`, `--rb-ivory-ico`, `--gold-ink`, `--focus`, `--ok`, `--ok-bg`, `--err`, `--rule-2`). The few literal values are reused from the base files, never invented: `#F7F8FC`, `#F6F7FC`, `#F1F2F7`, `#D4D9F3`, `rgba(59,73,184,.08)`, `#8E97C2`, `#C3C9E4`, `#FFFFFF` and the drawer shadow `rgba(12,18,71,.3)`.
- Type stays on the kit's scale: labels and metadata 13.5–15 px, body 15–17 px, kit headings. No new font, weight family or radius system.
- Every interactive extension has a visible focus style (`--focus` outline) and a target of at least 24 px; standalone text links shorter than that pass WCAG 2.5.8 through its spacing exception.
- No new breakpoint sizes: every container query uses a size the kit already uses (520, 560, 640, 660, 760, 860, 880, 940 px).

## Reused from the kit, unchanged

| Area | Kit patterns |
| --- | --- |
| Shell | `rb` workspace, `rb-rail` (brand, reserved logo slot, `rb-nav`, `rb-count` badge, `rb-rail-foot`), `rb-top` (date, account button), phone/tablet `rb-menu` with `rb-drawer` and `rb-scrim` |
| Page heads | `rb-h1`, `rb-h2`, `rk-head`, `rk-head-act`, `rk-sub`, `rk-eyebrow`, `rk-crumbs`, `rk-meta`, `rk-title`, `rb-note` |
| Actions | `rb-btn`, `rb-btn--primary` (gold, one per screen), `rb-btn--lg`, `rb-btn--ghost`, `rb-link`, `rk-goto` |
| Lists | `rk-tabs` / `rk-tab`, `rk-toolbar`, `rk-tools`, `rk-field`, `rk-search`, `rk-select`, `rk-statusline`, `rk-chip`, `rk-clear`, `rk-count`, `rk-table` with its container-query layouts, `rk-rowlink` |
| List states | `rk-state`, `rk-loading-msg`, `rk-skel` rows, `rb-calm` |
| Detail | `rk-detailwrap` / `rk-detail` / `rk-aside`, `rk-surface`, `rk-sec`, `rk-dl`, `rk-tl`, `rk-quote`, `rk-code`, `rk-fmts` + `xr-fmt` |
| Decision | `rk-panel`, `rk-errsum`, `rk-fieldset` + `rk-choice`, `rk-textarea`, `rk-hint`, `rk-ferr`, `rk-pending`, `rk-done`, `rk-next`, `rk-dialog`, `rk-notice` |
| Status | `xr-st` pills with colour plus shape, `rk-st-lg` |

## Role extensions (`rv.css`)

New in the refinement are marked **new**; the others were in the completed role and are kept or adjusted.

| Extension | Used on | Why the kit could not express it |
| --- | --- | --- |
| **new** `rv-kind`, `rv-kind-ico`, `rv-kind-t`, `rv-kind-d`, `rv-kind--new/resub/recheck/update`, `rv-u-*` icon slots | RV-01, RV-02, RV-05, every item page | One type tag tells the four kinds of review work apart by icon shape and tile tint, with the revision or `1.2 → 1.3` beside it. All four icons are in the markup and the state class shows one. |
| **new** `rv-desk`, `rv-wait`, `rv-next*`, `rv-then`, `rv-wl*`, `rv-age`, `rv-side*`, `rv-types` / `rv-type*`, `rv-courses` / `rv-course*`, `rv-recent*`, `rv-go`, `rv-calm-act` | RV-01 | The review desk: the item waiting longest with the one gold action, the rest oldest first divided by rules, and three side cards (queue by type, scope with course names, last three decisions). |
| **new** `rv-qtabs`, `rv-qtabs--3`, `rv-tabn` | RV-02, RV-05 | Type filters as tabs with counts; on phones an equal-height segmented grid. |
| `rv-qtable`, `rv-rtable`, `rv-c-*`, `rv-cell-course`, `rv-cell-ref`, `rv-focus-t`, `rv-now`, `rv-skel4`, `rv-tools--solo` | RV-02, RV-05 | Reviewer columns and their stacked grid areas at the kit's 880 / 660 px. **Final correction:** `rv-cell-ref` now carries the format badges only — the record ID that sat beside them is gone, and `.rv-cell-ref .rk-small` was removed with it. |
| **new** `rv-idcard`, `rv-id-*`, `rv-meta-main`, `rv-meta-who`, `rv-onpage*` | RV-03, RV-04, RV-06 | The identity card: type, title, summary, status, course, sender, facts and a page map. Separators sit in the gap and the row clips them, so a wrapped line never starts or ends with a divider. **Final correction:** the `rv-id-ref` chip (the record ID) was removed from the markup and its rule from `rv.css`. |
| **new** `rv-main`, `rv-block*`, `rv-band*`, `rv-detail`, `rv-hist`, `rv-hist--card` | RV-03, RV-04, RV-06 | Blocks in three weights; the decision panel spans content and history so it comes before the history on one column. |
| **new** `rv-ready*`, `rv-req*`, `rv-path*` | decision panel | Before you decide, and What happens next. |
| **new** `rv-prose`, `rv-attach`, `rv-files`, `rv-filecard*`, `rv-file-*`, `rv-mini-h` | RV-03, RV-06 | Description at reading width; preview link and documents as cards; one wide card when neither was sent. |
| **new** `rv-fmtline`, `rv-fmtline-row`, `rv-fmtline-in`, `rv-fmtline-k`, `rv-fmtline-out` | RV-03, RV-06 | Formats as one compact line instead of a large tile per format. |
| `rv-deliv`, `rv-dcard*`, `rv-pkg`, `rv-tag`, `rv-ext` | RV-03 | One read-only card per format, and the "Changed in revision 2" tag. |
| `rv-cmpwrap`, `rv-cmp*`, `rv-chg`, `rv-quote` | RV-03, RV-04 | Field-by-field comparison; stacks with labels below 520 px. |
| `rv-lowrap`, `rv-lo*`, `rv-ibtn*`, `rv-lo-ro` | RV-03, RV-06 | The ordered outcome list: numbered items, edit in place, move, delete with undo, live status message. |
| **new** `rv-refgrps`, `rv-refgrp`, `rv-refgrp-h`; kept `rv-refs`, `rv-ref`, `rv-ref-g`, `rv-reflist` | RV-03 | Field references grouped by the vendor editor's sections. |
| `rv-done-q`, `rv-refusal` | RV-03, RV-04, RV-06 | The quoted reason in the outcome block, and a focusable refusal notice. |
| `rv-meta-course`, `rv-from`, `rv-btn-wrap`, `rv-st-wrap`, `rv-st-sm`, `rv-footnote`, `rv-focus` | across the role | Course code with its name; sender line; wrapping variants for 320 px reflow. |

## Borrowed shared surfaces (XS contract, provisional)

Not independent redesigns. They render the existing shared behaviour with V3 tokens; replace them with the Shared Surfaces components at assembly.

| Extension | Surface |
| --- | --- |
| `rv-acctwrap`, `rv-menu*` | Account menu: name and role, Help & support, Sign out. Escape closes and returns focus. |
| `rv-msg*`, `rv-msgpage`, `rv-msgcard` | Message template for refusals and "report sent", framed as one card. |
| `rv-file`, `rv-formact` | File field and form actions on *Report a problem*. |
| `rv-solo*` | Signed-out page with the reserved logo slot. |

## Not changed

No token values, no base selectors, no new colours outside the list above, no icon set change, no new breakpoint sizes.
