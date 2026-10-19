# Component extensions · Vendor (final)

> **Status: FINAL DESIGN · AWAITING OWNER ACCEPTANCE.**

The base files `core.css`, `rb.css` and `rb-kit.css` are untouched and byte-identical to `FOUNDATION-LOCK.md`. Everything the role adds lives in one stylesheet, `project/v3-vendor.css` (about 440 lines). Refinement R1 had its own stylesheet; that is now folded into this one, and rules that no screen uses any more were removed. The stylesheet follows these rules:

- **Two namespaces, both role-scoped.**
  - `ve-`: role primitives, mostly carried from the baseline.
  - `vr-`: the layout patterns accepted in R1 and now applied to every Vendor screen.
- **Shared classes are never restyled on their own.** `xr-`, `rb-` and `rk-` classes are adjusted only under a `ve-`/`vr-` parent, for example `.vr-hist .rk-tl li`, `.vr-form .rk-field` and `.ve-chips .xr-fmt`.
- **No new tokens or colours.**
  - Every `var(--…)` it uses is defined in the shared files.
  - Every literal colour already appears in the shared files: `#8E97C2`, `#C3C9E4`, `#E1A49D`, `#F1F2FA`, `#F3F4F9`, `#F6F7FC`, `#F7F8FC`, `#F8F9FD`, `#FFFFFF`, `rgba(19,25,56,.10)` and `rgba(59,73,184,.06)`.
  - Both facts were checked by script.
- **Container queries.** It uses the kit's container queries (`rb`, `rkd`) plus four role containers: `vesteps`, `vrform`, `vrhero` and `vrlist`.

## Reused from the kit, unchanged

| Pattern | Used for |
| --- | --- |
| `.rb` shell: rail, brand, nav, gold current marker, rail foot, top bar, drawer below 1024px, phone chrome below 760px | the whole workspace |
| `rb-id`, `rb-figs`/`rb-fig` | Overview identity band and its four counts |
| `rb-split`, `rb-att`, `rb-lead`, `rb-ai`, `rb-calm`, `rb-rows`/`rb-row`, `rb-panel` | Overview: returned lead, drafts to finish, calm state, recent activity |
| `rb-switch`, `rb-switchbar` | status tabs on My experiments |
| `rk-head`, `rk-crumbs`, `rk-meta`, `rk-title`, `rk-tabs` | page heads, breadcrumbs, the record's tabs |
| `rk-detailwrap`, `rk-detail`, `rk-mainsheet`, `rk-aside`, `rk-surface`, `rk-dl`, `rk-stand` | editor and record layout, read-only key/value lists, “Where it stands” |
| `rk-tl` | Submission and version history (laid out as rows under `.vr-hist`) |
| `rk-errsum`, `rk-field`, `rk-label`, `rk-hint`, `rk-ferr`, `rk-input`, `rk-textarea`, `rk-select`, `rk-fieldset`, `rk-tag-warn` | form fields, validation, the “Referred to in the return” tag |
| `rk-notice` (info, ok, warn, off), `rk-dialog` | status notices; submit, resubmit and leave dialogs (focus trap and Escape added in role logic) |
| `rk-state`, `rk-skel`, `rk-loading-msg`, `rk-next` | empty, loading, failed and refusal states; the next-step line |
| `rk-fmts`, `rk-count`, `rk-clear`, `rk-sortbar`, `rk-sortbtn`, `rk-rowlink` | My experiments tools and row links |
| `xr-st` status grammar (ring, tick, half disc, diamond, paused bars), `xr-fmt` chips, `xr-avatar`, `xr-sr` | every status and format mark |

## Layout patterns (`vr-`): accepted in R1, applied to every screen

| Pattern | What it does | Where |
| --- | --- | --- |
| `vr-herocard`, `vr-hero`, `vr-figs`, `vr-ov` | identity band with four counts. On phones the returned item and drafts come before the counts | VE-01 |
| `vr-lead*`, `vr-kind`, `vr-ref`, `vr-reflist`, `vr-ai*`, `vr-act*`, `vr-rows`, `vr-rowlink` | returned lead with the reason in full and its references; drafts to finish; recent activity rows | VE-01 |
| `vr-switchbar`, `vr-list`, `vr-tools`, `vr-search`, `vr-toggle`, `vr-tools-r`, `vr-sortnarrow` | status tabs with counts and one tool row (search, 7-day filter, count, Clear filters) | VE-02 |
| `vr-table`, `vr-c-*`, `vr-name`, `vr-meta`, `vr-stsub`, `vr-pending`, `vr-rowbtn`, `vr-chev`, `vr-datek`/`vr-dated` | the experiment table. Status pill plus one plain line, one action column. Three-line rows below 760px with a labelled last-change date | VE-02 |
| `vr-form`, `vr-errwrap`, `vr-sec*`, `vr-grid`, `vr-w2/3/4`, `vr-ta1/2/4`, `vr-legend`, `vr-foot` | editor and form sections: title, optional one-line description, six-column field grid, one column below 620px | VE-03 to VE-06, VE-08, VE-09, XS-07 form |
| `vr-fmtsel*`, `vr-fmtopt*` | compact format selector in the chip grammar (solid navy chip and tinted tile = included) | VE-04 |
| `vr-guide*` | app-package guidance written once, with the provisional note | VE-04 |
| `vr-dlvs`, `vr-dlv`, `vr-dlv-h/-t/-k/-st/-b`, `vr-labelrow`, `vr-linkbtn`, `vr-file` | one block per chosen format, all built the same way: chip, name, kind and a live status (Complete / N still needed / N to fix). Read-only blocks reuse the same header | VE-04, VE-06 review, VE-07, VE-09 read-only |
| `vr-actions*`, `vr-saved` | sticky actions on long forms. The saved message sits next to Back (Cancel on step 1); the buttons stay right-aligned | editor, XS-07 form |
| `vr-sub`, `vr-sub-b`, `vr-sub-l`, `vr-st-sm` | step outline that follows the step: groups on step 1, chosen formats on step 2, each with a live status | editor aside |
| `vr-ret*` | returned reason: who and when, the reason in their words, reference chips that open the field. A private revision is stated inside it with the changed fields | VE-07, VE-08 |
| `vr-rev-h`, `vr-chg`, `vr-empty` | review sections on Check and submit, each with its status and a **Change** button; dashed empty line | VE-06, VE-05 |
| `vr-outcome*`, `vr-facts` | outcome card: result, status, time, formats, next step and actions | VE-06 and VE-08 outcomes |
| `vr-sheet`, `vr-intro`, `vr-ws`, `vr-hist`, `vr-narrow` | record sheet with the “which version is shown” line, “Where it stands” beside both tabs, history rows with the date right-aligned | VE-07, VE-13 |

## Role primitives (`ve-`)

| Pattern | Why the kit could not express it | Where |
| --- | --- | --- |
| `ve-steps`, `ve-step` (top stepper) and `ve-prog`, `ve-stepnav` (aside step list) | The kit has no multi-step editor. The stepper shows below 860px of detail width and the aside above it, so they never appear together | VE-03…VE-06, VE-08, VE-09 |
| `ve-opt`, `ve-hint-stale`, `ve-errline`, `ve-reftag`, `ve-form .rk-select[aria-invalid]` | optional mark, stale-course hint, error lines with Go to, “Referred to in the return” placement, select error border | editor |
| `ve-files`, `ve-file`, `ve-file-n` | sample-file rows (documents, screenshot), plainly labelled “sample file” | VE-05, XS-07 |
| `ve-saved` | saved-time status that takes focus after saving | editor |
| `ve-submitnote`, `ve-intro`, `ve-los`, `ve-chips` (compact 24px format chips) | the “does not publish” note, intro lines, learning outcomes, format chip rows | VE-06, VE-07, outcomes |
| `ve-ref` | reference chip button (styled in the returned-reason panel) | VE-07, VE-08 |
| `ve-done-actions`, `ve-ico-ok`, `ve-ico-lock` | outcome and refusal actions, state icons | outcomes, refusals, XS-06, XS-07 |
| `ve-skip` | skip link visible only on focus (kept from the v46 shell) | shell |
| `ve-app`, `ve-handoff` | page canvas; preview-only Sign out handoff note | shell |

## Proposed for the central kit (used here, not promoted)

- `ve-skip`: a skip link that is visible only on focus. The v46 shell had one; the V3 kit does not.
- `.ve-form .rk-select[aria-invalid="true"]`: an error border for selects. `rk-input` and `rk-textarea` have one; `rk-select` does not.
- The `vr-` layout patterns, if other roles adopt the same structure, especially:
  - the section and field grid;
  - per-format delivery blocks;
  - sticky actions;
  - the outcome card.

If the central team adopts any of these, they move into `rb-kit.css` under a version bump. Until then they stay role-scoped.

## Borrowed shared surfaces (XS contract, not role-owned redesigns)

| Pattern | Contract followed | Replace at assembly with |
| --- | --- | --- |
| `ve-acct`, `ve-acctmenu`, `ve-acct-item` | XS-05 account menu: name, role, organisation, Help & support, Sign out; no role switcher; Escape closes and returns focus | the XS account menu |
| `ve-reports`, `ve-report` + kit and `vr-` form patterns | XS-07 Help & support: My reports, Report a problem (What happened? required, Where prefilled, screenshot optional), Sending…, “Report sent · Your reference is SUP-…” | the XS Help & support |
| kit `rk-state` | XS-06 “This page isn’t part of your workspace” with Back to Overview | the XS refusal page |
| `ve-handoff` | not a design: a preview-only note where Sign out would open XS-03 Signed out | the XS Signed out page |

## Preview-only tooling (not product)

`ve-preview`, `ve-preview-t`, `ve-pv-tools`, `ve-pv-field`, `ve-pv-btn`, `ve-pv-note` form the dashed reviewer bar at the top of the main column. Do not implement it in the application.
