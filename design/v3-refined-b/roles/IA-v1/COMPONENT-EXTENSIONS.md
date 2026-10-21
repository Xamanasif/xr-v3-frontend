# Component extensions · Institute Admin · XR-V3-RB-1.0 · final complete-role design

The role uses the foundation files unchanged (`core.css`, `rb.css`, `rb-kit.css`, byte-identical; hashes in `FOUNDATION-LOCK.json`). Everything the role adds lives in one file, `project/ia-role.css`, with the `ia-` prefix. It defines no global token and redefines no `xr-`, `rb-` or `rk-` class.

**Tokens used:** the foundation's custom properties only: `--sans`, `--navy`, `--indigo`, `--indigo-2`, `--ink`, `--ink-2`, `--ink-3`, `--paper`, `--mist`, `--mist-2`, `--rule`, `--gold`, `--gold-ink`, `--ok`, `--warn`, `--err`, `--focus`, `--rb-canvas`, `--rb-rail`, `--rb-line`, `--rb-line-2`, `--rb-sel`, `--rb-sel-tint`, `--rb-ivory`, `--rb-ivory-line`, `--rb-tint`, `--rb-tint-line`. A few literal values are copied from the kit's own rules rather than invented: table head `#F7F8FC`, row hover `#F8F9FD`, muted row `#FAFBFD`, the kit's paused and "off" notice tints (`#F1F2FA`/`#CDD2EC`, `#F4F5F8`/`#DFE2EA`), the danger hover `#912018`, and the term-track shades on the plan tint (`#CDD3EE`, `#D7DCF0`).

**Contextual adjustments, not redefinitions.** A handful of selectors size a foundation part inside an `ia-` container and nowhere else, for example 36px row buttons (`.ia-lt .ia-lt-act .rb-btn`, `.ia-gt-act .rb-btn`, `.ia-xt-act .rb-btn`), full-width phone buttons in `.ia-actions` and `.ia-cc-save`, badge spacing in `.ia-cell-line .rk-fmts` and `.ia-item .rk-fmts`, swatch size in `.ia-xs-key .rk-swatch`, heading spacing in `.ia-sbody > .rb-h2`/`.rk-h3`, 4px between error-summary items in role forms (`.ia-form .rk-errsum li + li`, so single-line links keep the 24px target spacing of WCAG 2.2), and the focus outline of link rows that contain an `rk-rowlink`. Rules written as `.rb .ia-…` style new `ia-` classes only; the `.rb` prefix just matches the foundation's own specificity for links and buttons.

## Reused from the foundation without change

| Layer | Parts used |
|---|---|
| `core.css` (`.xr`) | `xr` root, `xr-ico`, `xr-sr`, `xr-avatar`, `xr-fmt` / `xr-fmts` format badges (solid, `--pub` dashed, `--none` grey), `xr-st` status words |
| `rb.css` (shell) | 248px navy rail, nav, brand, reserved logo slot, Help at the rail foot; top bar, date, account button; phone drawer and scrim; `rb-h1`, `rb-h2`, `rb-eyebrow-date`; buttons (`rb-btn`, primary, navy, ghost, large); `rb-lead` ivory urgency band, `rb-calm`, `rb-panel`, `rb-note`, `rb-link`, `rb-code`; `rb-switch` segmented control |
| `rb-kit.css` | Page head (`rk-head`, `rk-eyebrow`, `rk-title`, `rk-sub`, `rk-meta`, `rk-crumbs`); `rk-surface`, `rk-sec`, `rk-panel` decision panel, `rk-detail` (Give students access); tabs; fields, `rk-errsum`, `rk-fieldset`, `rk-choice`, `rk-check`; notices; states (`rk-state`, skeleton, error icon); timeline `rk-tl`; `rk-dl`, `rk-stand`, `rk-quote`; chips and Clear filters; dialog; `rk-rowlink`; `rk-code`, `rk-owncode`, `rk-tag-warn`; `rk-swatch` format key; `rk-fmts` small badges; `rk-askrow` |

**Format semantics** follow the foundation everywhere: solid navy = in your plan (with a tick where all four states are shown) or given with a grant; dashed indigo = published, not in your plan; muted grey = not published. Order is always WEB, AR, VR, MR. Formats are never chosen per student; lists say "Formats come from your access plan".

**Action hierarchy.** One gold primary per page, for the page's main task. A row action is a secondary (outlined) button when it is what the list is for: Give access on Content access, Withdraw… on Student access, Review on Device requests. It is quiet (ghost) when it is a shortcut or upkeep on a list that is mainly read: Give access on People › Students, Assign a course on Faculty courses, Remove… on a faculty member's courses, a group's members and Faculty courses. Destructive confirms are red only inside their dialog.

**Plan tint.** The access-plan context uses the foundation's plan tint (`--rb-tint`, `--rb-tint-line`), as the contract assigns it: the Overview plan card, the Content access plan strip and the Access plan page strip. Work surfaces stay white.

## Role patterns in `ia-role.css`

Each block says why the kit could not express it, its states, and who should own it after assembly.

### Page layouts

| Pattern | Classes | Why · states · owner |
|---|---|---|
| **Record grid** | `ia-rec`, `ia-rec-grid`, `--sidefirst`, `--wide`, `ia-rec-main`, `ia-rec-side`, `ia-rec-more` | `rk-detail` puts its aside after the whole main sheet on narrow widths, so a record's summary would fall below a long history. Three named areas: main, a 340–384px summary column, and what follows (history). Below 860px of page width: main → summary → more; `--sidefirst` puts the summary first (a group's grants); `--wide` keeps the panel beside the table only from 1,060px of content and narrows it to about 28% (Faculty courses, B2-09). Used by IA-03, IA-07, IA-14, IA-15, IA-17 detail, IA-19, IA-20. Owner: central kit candidate. |
| **Surface sections** | `ia-shead`, `--line`, `ia-shead-n`, `ia-shead-key`, `ia-shead-sub`, `ia-sbody`, `ia-sfoot`, `ia-empty-t` | `rk-sec` pads 28px while every list starts its cells at 22px. Heading row (title + count, link or key), body and footnote on the 22px edge; 16px on phones. Owner: kit candidate. |
| **Overview** | `ia-ov-head`, `ia-ov-id`, `ia-ov-status`, `ia-ov-grid`, `ia-att…`, `ia-plan…`, `ia-tt…`, `ia-fmt-key` | Compact identity head (name, access status, actions) instead of the tall identity band; attention list (count tile, words, one quiet action; phone layout stacks the action); access-plan card in the plan tint with the yearly term bar (`ia-tt`: elapsed, remaining in gold when ending, today marker; striped when paused; full when ended). Owner: role. |
| **Content access plan strip** | `ia-cp`, `ia-cp-row`, `--plan`, `is-noask`, `ia-cp-k`, `ia-cp-name`, `ia-cp-code`, `ia-cp-facts`, `ia-cp-sub`, `ia-cp-term…`, `ia-cp-view`, `ia-cp-ask`, `ia-cp-foot`, `ia-cp-note` (`--warn`, `--off`, `--paused`) | One strip in the plan tint: plan and status, licences "as approved by BITS", the term bar, View plan (IA-02) or where to ask BITS (IA-03); ending, ended and paused notes as bands inside it. Two columns below 820px, one below 480px. Owner: role. |
| **Management surface** | `ia-gm`, `ia-gm-tools`, `ia-gm-row`, `ia-gm-search`, `ia-gm-sel`, `ia-gm-segs`, `ia-gm-status`, `ia-gm-shown`, `ia-gm-count`, `ia-gm-foot` | Search and one supporting select in one row, the status switch with counts (`rb-switch`), chips with "Showing x of y" and Clear filters, a count beside the search where there is no switch, a footnote. Stacks below 640px; the selected status scrolls into view on phones. Owner: kit candidate. |
| **Course codes editor** | `ia-cc…` | One block per course: read-only BITS code beside the editable institution code and semester, a preview line, a save bar with the unsaved-changes state; explainer beside it. Owner: role. |
| **People tabs** | `ia-tabs`, `ia-tab`, `ia-tab-n` | Underline tabs with counts; a 2 × 2 grid on phones so every tab is visible. Owner: role. |

### Lists and tables

| Pattern | Classes | Why · states · owner |
|---|---|---|
| **List table** | `ia-ltwrap`, `ia-lt`, `ia-lt-main`, `ia-lt-act`, `ia-lt-pri`, `ia-lt-lab`, `ia-lt-num`, `ia-lt-numv`, `ia-lt-stat`, `--stats`, list modifiers (`--fac`, `--fc`, `--grp`, `--gm`, `--sr`, `--fr`, `--rq`, `--dv`, `--imp`, `--pv`) | The one table language for lists that are not grouped: Faculty, Faculty courses, Groups, group members, a student's experiments, a faculty member's courses, Requests, Device requests, Usage, Import errors, the preview index and the borrowed Help list. Header 14/20 on `#F7F8FC`, cells 15/22, 22px outer padding, whole-row link focus, muted rows, 36px row actions. Below 640px of table width each row is a short block: identity with its one action beside it, the status next (`ia-lt-pri`), then the other cells with an inline label only where the value needs one (`ia-lt-lab`). `--stats` shows Usage figures three across with the label above each figure. Replaces the earlier labelled-row `ia-table`. Owner: central kit candidate. |
| **Grouped table** | `ia-gt`, `ia-gt-grp`, `ia-gt-gh`, `ia-gt-gt`, `ia-gt-gn`, `ia-gt-row`, `ia-gt-who`, `ia-gt-how`, `ia-gt-st`, `ia-gt-act`, `--ro` | One group per experiment (title, course code, formats, count), one row per student (who, how given, status in words with its reason, action). Phones: who and action, status, how given. `--ro` is the read-only plan version without actions. Owner: role. |
| **Roster** | `ia-rt…` | Students list where the whole row opens the record; group and access columns; one Give access shortcut. Owner: role. |
| **Experiments table** | `ia-xs-meta`, `ia-xs-key`, `ia-xs-count`, `ia-xt…`, `--plan` | One group per course (BITS code, course, your code or "not added" + Add code), one row per experiment: name and status, 28px format badges with ticks, students given access, Give access. Two-line rows below 860px, phone rows below 640px. `--plan` is the plan page's version (experiment and formats only). Owner: role. |
| **Cell parts** | `ia-cell-name`, `ia-cell-sub`, `ia-cell-t`, `ia-cell-title`, `ia-cell-note`, `ia-cell-also`, `ia-cell-line`, `ia-cell-muted`, `ia-cell-courses`, `ia-cell-exp`, `ia-inline` | Name link and sub line, text, a strong title, the reason under a status, the "Also in …" note, a line of chips or badges, muted "None yet". Owner: with the tables. |
| **Summary items** | `ia-items`, `ia-item`, `ia-item-t`, `ia-item-meta` | Short stacked items in a summary column (a group's grants: experiment, course code, formats, status, when and which grant). Owner: role. |

### Guided steps, forms and pickers

| Pattern | Classes | Why · states · owner |
|---|---|---|
| **Step indicator** | `ia-steps`, `ia-step`, `ia-step-n`, `ia-step-l` | The kit has none. Done (navy with tick), current (indigo tint), later (neutral); number plus words. On phones every step keeps its number and only the current one keeps its words (the others stay readable to screen readers). Owner: kit candidate. |
| **Selection fold** | `ia-selsum`, `ia-selsum-k`, `ia-selsum-v`, `ia-gv-aside` | Give students access: "Your selection" beside the steps on wide pages; below 860px it folds into one line under the step indicator that opens to the full summary (B2-05). Not shown beside the review and the result, which already say all of it. Owner: role. |
| **Pick list** | `ia-pick…` | Dense rows to choose students, a group or members: identity line, checked state, keyboard focus, unavailable rows with the reason in words. Owner: role. |
| **Form column** | `ia-form`, `ia-fgrid`, `--2`, `ia-actions`, `--start`, `ia-file`, `ia-file-name`, `ia-cols` | Readable form column (max 860px, two fields per row from 640px), action bar (full-width 46px buttons on phones), file chooser row and CSV column list. Add student/faculty, Import students, the request form, Report a problem. Owner: kit candidate (AR-8 add/edit page). |
| **Assign panel** | `ia-fcform`, `ia-fc-grid`, `ia-fc-go` | Faculty courses: a stacked panel beside the table; one compact row (two selects and Assign course) when it sits under the table; stacked again on phones (B2-09). Owner: role. |
| **Destructive confirm** | `ia-btn--danger`, `ia-btn--busy` | `rb.css` has no destructive button. Red only on the destructive confirm itself; busy state with `aria-disabled`. Dialogs with a reason open on the field; others open on Cancel; focus returns to the trigger. Owner: kit candidate. |
| **Small row button** | `ia-btn--sm` | 32px quiet Remove… beside a course chip in Faculty courses. Owner: role. |

### Notices, shared and preview parts

| Pattern | Classes | Notes |
|---|---|---|
| Lead variants | `ia-lead--paused`, `ia-lead--off` | Paused and ended are not urgency: same geometry as `rb-lead`, the kit's paused and "off" tints. |
| Account menu | `ia-acctwrap`, `ia-menu…` | **Borrowed XS-05 contract** (name, role, institution, Help & support, Sign out). Replace with the XS component at assembly. |
| Signed out | `ia-out…` | **Borrowed XS-03**. Replace at assembly. |
| Helpers | `ia-stack`, `ia-row`, `ia-sum`, `ia-sum--defs`, `ia-lines`, `ia-flow`, `ia-arrow`, `ia-gap-top`, `ia-gap-top-s`, `ia-gap-xs`, `ia-block`, `ia-wrap`, `ia-nowrap`, `ia-num-t` | Gaps, definition lists, outcome lines with icons, "who → what → grant" flows, IDs that never break at hyphens. |
| Preview chrome (not product UI) | `ia-pv…` | Role start page, the floating "Preview IA-xx" button, in-page notes that link to documented handoffs. Dashed indigo = scaffolding. Disappears with `chrome="off"`; must not be implemented in the app. |

## Not added on purpose

- No new colours, gradients, charts, KPIs or decorative counts.
- No request count in the navigation (v46 DEV-17); no export controls (OD-B3-08).
- No invitation, Reports or Settings entry (IA-12, IA-21, IA-22 excluded).
- No new filters or actions: every control on a redesigned screen existed in the delivered role; layouts changed, behaviour did not.
