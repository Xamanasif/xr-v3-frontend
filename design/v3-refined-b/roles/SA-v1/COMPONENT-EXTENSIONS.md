# Component extensions — Super Admin role

Base files `core.css`, `rb.css`, `rb-kit.css` are byte-identical copies (hashes in `FOUNDATION-LOCK.json`). No global token, `rb-` class or `rk-` class is redefined. Everything new lives in `project/sa-role.css` under the `sa-` prefix and uses existing tokens.

## Reused unchanged from the kit

| Kit component | Used on |
|---|---|
| Rail, top bar, Menu drawer, account button (`rb-rail`, `rb-top`, `rb-drawer`, `rb-acct`) | every screen |
| Overview header, figures, category switch, priority band, queue groups, calm block (`rb-head`, `rb-figs`, `rb-switch`, `rb-prio`, `rb-queue`, `rb-calm`) | SA-01 |
| PageHead, breadcrumbs, Tabs (`rk-head`, `rk-crumbs`, `rk-tabs` as links with `aria-current`) | all pages; Content and Operations and Platform roles tabs |
| FilterToolbar, chips, count line, sort (`rk-toolbar` … `rk-sortbtn`) | SA-02, SA-06, SA-12 |
| RequestTable with its three width layouts (`rk-table`, column classes `rk-c-*`) | SA-02, SA-06, SA-10, SA-12, SA-16, SA-18, SA-20 (columns re-labelled; grid areas unchanged) |
| ListState (`rk-state`, skeleton, loading message, failed with Try again) | every list and the Overview |
| DetailLayout, FactStrip, DefinitionList, Timeline, EventsGrid (`rk-detail`, `rk-factstrip`, `rk-dl`, `rk-tl`, `rk-events`) | every record page |
| DecisionPanel, error summary, choices, locked note, diff, pending hint, outcome, “where it stands” (`rk-panel` …) | SA-03, SA-07, SA-11, SA-13, SA-15, SA-17, SA-19, SA-21 |
| ConfirmDialog (`rk-dialog`, “What happens now” / “Only after later events”) | every confirmed action |
| Notice, Banner (`rk-notice--*`, `rk-banner`) | flashes, refusals, paused, stuck, no-scope |
| PlanBand, term timeline, plan notes (`rk-plan`, `rb-term`, `rk-plan-note--*`) | SA-07 |
| Format cells (`rk-fstrip`, `rk-fcell--on/pub/none`), legend, badges (`xr-fmt`), course code chip (`rk-code`) | SA-03, SA-07, lists |

## New role-level patterns (`sa-role.css`)

| Class | Purpose | States | Reuse |
|---|---|---|---|
| `sa-acctwrap`, `sa-acctmenu` | Places the **borrowed XS account menu** (name/e-mail, Help & support, Sign out) under the existing account button | open/closed, focus on first item, arrow keys, Escape returns focus | Replace with the XS component when delivered |
| `sa-quietrow` | Quiet line inside an Overview group whose filter has nothing | — | SA-01 only |
| `sa-tabs`, `sa-tabn` | Spacing for page tabs; count inside a tab | — | Content, Operations, Platform roles |
| `sa-seg` | Wraps the existing `rb-switch` segmented control inside a list toolbar | pressed | SA-10, SA-18, SA-20 |
| `sa-act`, `sa-act-k`, `sa-act-v`, `sa-attn` | Groups several permitted actions inside a DecisionPanel when the page is not one decision | — | SA-07, SA-15 |
| `sa-plan-exps`, `sa-plan-exp` | Lists a plan's experiments with the shared format strip inside `rk-plan` | stacks under 760 / 480 container | SA-07 |
| `sa-tablewrap`, `sa-table`, `sa-table--rows`, `sa-compare` | Read-only (not row-clickable) tables; stack into labelled rows under 640 px container | — | SA-07 activity, SA-11 comparison and institutions, SA-22 |
| `sa-list`, `sa-list-row` | Record rows that open a page (courses, My reports) | hover, focus | SA-14, SA-15, Help |
| `sa-people`, `sa-scopes`, `sa-inline` | Rows with an inline reason form beside the item it changes | closed / open / error | SA-07 student override, SA-17 withdraw |
| `sa-msg`, `sa-msg-ico`, `sa-out` | GL-04 message template (refusal / not available) and the borrowed signed-out page | — | shared pattern |
| `sa-help`, `sa-form`, `sa-file` | Layout of the borrowed GL-03 Help & support page | validation, sent | Replace with XS delivery |
| `sa-stack`, `sa-single`, `sa-btnrow`, `sa-pad`, `sa-footnote`, `sa-bullets`, `sa-term-only` | Small layout helpers | — | role-wide |
| `sa-pv-*` | **Design-only** preview controls (scenario, list state, stale-decision simulation, screen jump, reset). Hidden with `?clean=1`. Never part of the product. | open / closed | preview only — do not port |

## Behaviour added in the runtime (no visual change)

- One in-tab role state; decisions persist while you navigate.
- Focus: route change → page heading; dialog → title or first field; Escape/Cancel → opener; error summary receives focus and its links focus fields; drawer and dialog trap Tab.
- Text fields never re-render on blur (a blur re-render would swallow the next click).
- The selected tab or category scrolls into view in horizontally scrolling tab rows.
