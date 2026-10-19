# @xr/ui/v3 — components, central patches and extensions (foundation XR-V3-RB-1.0)

The V3 Refined Direction B presentation layer (`docs/decisions/ADR-0010-v3-presentation-layer.md`).
Sources: `design/v3-refined-b/pack/references/v3/` — `core.css`, `rb.css`, `rb-kit.css`, the SA01,
SA02 (SA-02 + SA-03), IA01 and IA02 boards and `HANDOFF-original.md`. This file is the central
register the foundation contract asks for (`pack/common/02-V3-FOUNDATION-CONTRACT.md` "Immutable
base, controlled extensions"): every component, every patch, every product class, every source
defect not copied, and what the foundation does not provide yet. A role export that adds a
component or needs a shared change adds a row here; it never redefines a base class or a token.

## Components

Every component emits only Refined B classes (`expectV3ClassesOnly`), takes all words, figures,
dates and destinations from its caller and holds no sample record or business rule. "Exact" means
a test renders it and compares it element for element with the static board markup.

| Component                                                                                                                                                                   | Refined B classes                                                                                                                                                                                                                                                                                                                              | Source                                                  | Shared behaviour / notes                                                                                                                                                   | Tests                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `WorkspaceShell`                                                                                                                                                            | `xr rb`, `rb-rail`, `rb-brand`, `rb-logo`, `rb-nav`, `rb-count`, `rb-rail-foot`, `rb-main`, `rb-top`, `rb-menu`, `rb-top-date`, `rb-page`, `rb-scrim`, `rb-drawer`, `rb-close`; `xs-skip`, `xs-nofocus`                                                                                                                                        | SA01, IA01 rails; HANDOFF "Drawer"                      | `useDrawer` (v46) with `persistentNavigation`; Tab kept inside the drawer; XS skip link `xs-skip` (XS-P1); `main.xs-nofocus`; the XS-08 banner first in `main` (XS)        | structure (rail exact vs SA01), e2e drawer/rail |
| `AccountMenu`                                                                                                                                                               | `xs-acct-slot`, `xs-acct`, `rb-acct`, `xr-avatar`, `rb-acct-text/-name/-role`; panel `xs-catch`, `xs-menu`, `xs-nofocus`, `xs-menu-head/-name/-role/-org`, `xs-menu-list`, `xs-menu-item`, `xs-menu-foot`                                                                                                                                      | SA01/IA01 trigger; XS-v6 `XsAccountMenu` (XS-05, XS-P3) | `useAccountMenu` (v46) + the XS keys: first item focused on open, ArrowDown on the button, arrows / Home / End wrap, Tab out closes, the outside-click layer returns focus | structure, xs, e2e                              |
| `AccountMenuInV46Shell`                                                                                                                                                     | the v46 trigger (`xr-acct`, `xr-acct-btn`, `xr-acct-text/-name/-role/-chev`) + the XS panel in `div.xr.rb.rk-x-popover` (V3P-10)                                                                                                                                                                                                               | XS-v6 `XsAccountMenu` in a v46 top bar                  | the same XS disclosure; transitional — retired when the last role has its V3 shell                                                                                         | xs, apps/web unit + e2e                         |
| `V3Region`                                                                                                                                                                  | `xr rb rk-x-region` (+ `rk-x-region--banner`) (V3P-09)                                                                                                                                                                                                                                                                                         | ADR-0010 (mirror of `V46Island`)                        | an XS surface inside a v46 page; measures the app's width                                                                                                                  | xs, apps/web unit + e2e                         |
| `EntryPage`, `EntryCard`, `EntryHeading`, `EntryForm`, `OrRule`, `RefusalSummary`, `PasswordInput`, `FieldRow`, `TroubleLinks`, `Disclosure`, `LiveStatus`, `PrototypeNote` | `xr rb`, `xs-entry`, `xs-entry-top`, `xs-back`, `xs-entry-main`, `xs-card`, `xs-card-head`, `xs-logo-box`, `rb-logo`, `rb-product`, `xs-card-body`, `xs-card-foot`, `rb-h1 xs-fit`, `xs-or`, `xs-form`, `rk-errsum` + `xs-errsum-d`, `xs-pw`, `xs-pw-toggle`, `xs-field-row`, `xs-trouble`, `xs-linkbtn`, `xs-disclose`, `xs-live`, `xs-proto` | XS-v6 `XsSignIn` (XS-01, XS-03, XS-04)                  | words, states and the sign-in decision from the caller (the session service)                                                                                               | xs, apps/web unit + e2e                         |
| `MessagePage`                                                                                                                                                               | `xs-msg`, `xs-msg-ico` (`--paused`, `--off`, `--ok`), `rb-h1 xs-fit`, `xs-msg-d`, `xs-msg-act`                                                                                                                                                                                                                                                 | XS-v6 `XsMessage`, `XsHelp` sent                        | XS-06, the XS-08 refusals (component only), "Report sent"                                                                                                                  | xs, apps/web unit + e2e                         |
| `HelpColumn`, `ReportListSurface`, `ReportRows`, `ReportFormSurface`, `OptionalMark`, `FileInput`, `FormActions`, `ReportSection`, `HelpFoot`                               | `xs-read`, `rk-surface`, `xs-sec-h`, `xs-reports`, `xs-report`, `xs-report-main/-t/-m`, `xs-form-surface`, `xs-opt`, `xs-file`, `xs-form-act`, `rk-sec`, `rk-sec-h`, `rk-h3`, `xs-help-foot`                                                                                                                                                   | XS-v6 `XsHelp` (XS-07)                                  | the records and commands are the application's; no reference for a Super Admin (caller)                                                                                    | xs, apps/web unit + e2e                         |

### Extended for the XS export (additive; the foundation's defaults unchanged)

- `Field` `errorPlacement: 'before'` — the error line between the label (and hint) and the control,
  as XS draws it (`after`, the SA-03 default, unchanged).
- `PageHead` `titleFit` — `xs-fit` on the H1 (the focus ring hugs the title).
- `Button` / `ButtonLink` `block` (`xs-block`) and `Button` `spinner` (busy: `xs-spin` + `xs-busy`).
- `Notice` `id` (a focus target); `Banner` `tone: 'inactive'` (`xs-banner--inactive`, grey).
- `Breadcrumbs` `tight` (V3P-11); `LoadingRows` `cells` (XS: `[2, 1]`).
- Icons: `back`, `signOut`, `retry`, `checkCircle` (the v46 paths) and `info` (new).
- Stylesheet: `xs-scoped.css` in layer `xr.v3.xs`, GENERATED from the export's `xs-shared.css`
  (selectors confined like the foundation's; its preview-only scaffolding left out).
  | `TopLineSeparator` | `rb-top-sep` | IA01 top line | — | specimens |
  | `PageHead`, `MetaSeparator`, `Breadcrumbs` | `rk-head`, `rk-head-text`, `rb-h1` / `rk-title`, `rb-eyebrow-date`, `rk-eyebrow`, `rk-sub`, `rk-meta`, `rk-meta-sep`, `rk-head-act`, `rk-goto`, `rk-crumbs` | SA02 (list and decision), IA02 | title focus target | structure, e2e (Go to decision) |
  | `OverviewHead` | `rb-head`, `rb-figs`, `rb-fig(-t/-n/-s)` | SA01 | — | exact (SA01 `header.rb-head`) |
  | `CategorySwitch` | `rb-switchbar`, `rb-switch` | SA01 | concise polite announcement | structure |
  | `PriorityBand` | `rb-prio`, `rb-prio-list`, `rb-pi(-when/-big/-rel/-kind/-title/-d/-act)` | SA01 | — | exact (SA01 `section.rb-prio`) |
  | `QueueGroups` | `rb-queue`, `rb-g`, `rb-g-head`, `rb-ico-tile`, `rb-g-name`, `rb-rows`, `rb-row(-main/-t/-d/-when/-act)` | SA01 | sections named by their headings | structure |
  | `IdentityBand` | `rb-id`, `rb-id-top/-text/-name/-status/-act`, `rb-go`, `rb-go-label` | IA01 | — | exact (IA01 `section.rb-id`) |
  | `AttentionPanel`, `CalmState` | `rb-panel`, `rb-att`, `rb-att-head`, `rb-lead(-ico/-t/-d/-act)`, `rb-ai(-n/-t/-d/-act)`; `rb-calm(-ico/-t/-d)` | IA01; calm: rb.css only | `CalmState` is DERIVED from rb.css — the IA01-calm board was not supplied | exact (IA01 `section.rb-att`) |
  | `PlanSheet` | `rb-plan`, `rb-plan-head/-body/-exp/-foot`, `rb-facts`, `rb-exp-t/-c/-code` | IA01 | the code chip comes from the caller (see O-3) | exact (IA01 `section.rb-plan`) |
  | `Split` | `rb-split`, `rb-split--calm` | IA01 | — | specimens |
  | `TermTrack` | `rb-term`, `rb-term-top/-label/-left(--calm)`, `rb-term-track/-fill/-rest/-today/-ends`, `rk-plan-term`, `rk-track-paused/-full`, `rk-term-paused` | IA01, IA02 | the one data-driven inline style (scan exception) | exact (within IA01 band), unit |
  | `PlanBand`, `PlanNote`, `ContentStack`, `LegendBar`, `CourseGroup`, `CodeKey`, `ExperimentCard` | `rk-plan`, `rk-plan-grid/-k/-name/-line/-link`, `rk-plan-note(--warn/--off/--paused)`, `rk-ca`, `rk-legendbar`, `rk-course(-h/-id/-t/-codes)`, `rk-own-k`, `rk-exp(-name/-t/-act)`, `rk-given(-k/-v)` | IA02 | — | structure, specimens |
  | `FormatBadges`, `FormatCells`, `FormatKey`, `FORMAT_ORDER` | `rk-fmts`, `xr-fmt`; `rk-fstrip`, `rk-fcell(--on/--pub/--none)`, `rk-fcell-n/-s`; `rb-fcells`, `rb-fc(--on/--pub/--none)`, `rb-fc-code/-name/-state`; `rk-legend`, `rk-legend-i`, `rk-swatch(--on/--pub/--none)` | SA02, IA01, IA02 | WEB/AR/VR/MR order enforced; words always from the caller | exact (IA01 cells, IA02 key) |
  | `StatusPill`, `toV3Tone` | `xr-st`, `xr-st--info/ok/warn/err/paused`, `rk-st-ended`, `rk-st-lg` | core.css, rb-kit.css | v46 tones map: `wait` → `warn`, `off` → `ended`; `live` has no V3 drawing | unit |
  | `CourseCode`, `InstitutionCode`, `MissingTag` | `rk-code(--plain)`, `rb-code`, `rk-owncode`, `rk-tag-warn` | SA02, IA01, IA02 | academic course codes stay visible in every role | exact (IA02 tag) |
  | `Button`, `ButtonLink`, `TextLink` | `rb-btn`, `rb-btn--primary/--navy/--ghost/--lg`, `rb-link` | rb.css | busy: words + `aria-disabled` (no V3 busy look) | unit |
  | `Surface`, `SurfaceSection`, `SectionHead`, `VisuallyHidden`, `HiddenHeading` | `rk-surface`, `rk-sec`, `rk-sec-h`, `rb-h2`, `rb-sec-head`, `rb-note`, `xr-sr` | rb-kit.css, rb.css | — | structure |
  | `LinkTabs`, `Tabs`, `TabPanel` | `rk-tabs`, `rk-tab` | IA02 (links); rb-kit.css `[aria-selected]` | in-page tabs: roving Tab stop, arrows/Home/End | exact (IA02 link tabs), unit |
  | `Field`, `FieldError`, `TextInput`, `SearchInput`, `Select`, `Textarea`, `Hint` | `rk-field`, `rk-label`, `rk-hint`, `rk-ferr`, `rk-input`, `rk-inputwrap`, `rk-selwrap`, `rk-select`, `rk-textarea` | SA02 | only existing hint/error ids are referenced; `aria-invalid` only with an error | unit |
  | `ChoiceGroup`, `CheckGroup` | `rk-fieldset(.is-invalid)`, `rk-choices`, `rk-choice(.is-off)`, `rk-choice-t/-d`, `rk-checks`, `rk-check` | SA02 | radio named by its title, described by its line; group error in the fieldset's description | unit, e2e |
  | `ErrorSummary` | `rk-errsum`, `rk-errsum-t` | SA02 | v46 `focusField` (links focus the field, or the chosen / first radio) | unit, e2e |
  | `PendingHint`, `ChangeSummary`, `LockedValue` | `rk-pending`, `rk-diff`, `rk-locked` | SA02 | `rk-diff` is not a live region | unit |
  | `ListSurface`, `FilterToolbar`, `SortBar`, `RecordTable`, `CellLines`, `ListState`, `LoadingRows`, `LoadingCards`, `ListFoot` | `rk-toolbar(--ca)`, `rk-tools`, `rk-search`, `rk-field--st/--type/--route`, `rk-btnfield`, `rk-toggle`, `rk-more`, `rk-more-type`, `rk-statusline`, `rk-count`, `rk-chip`, `rk-clear`, `rk-break`, `rk-sortbar`, `rk-sortbtn`, `rk-sort-l/-s`, `rk-tablewrap`, `rk-table`, `rk-c-inst/-exp/-type/-date/-st`, `rk-rowlink`, `rk-strong`, `rk-small`, `rk-inlabel`, `rk-state(--roomy)`, `rk-state-ico(--err)`, `rk-state-t/-d`, `rk-loading-msg`, `rk-skel-row`, `rk-skel`, `rk-skel-ca/-band/-card/-cells`, `rk-ca-foot` | SA02, IA02 | sort bar follows the table's measured head (V3P-02); chip removal keeps focus; Clear returns to Search | unit, e2e |
  | `DetailLayout`, `FactStrip`, `DefinitionList`, `AskList`, `AskRow`, `Quote`, `Timeline`, `EventSteps`, `RecordLine` | `rk-detailwrap`, `rk-detail`, `rk-mainsheet`, `rk-aside`, `rk-factstrip`, `rk-fact`, `rk-dl`, `rk-ask`, `rk-askrow(-t/-c)`, `rk-quote(-by)`, `rk-tl(-w/-t/-n)`, `rk-events`, `rk-event(-n/-t/-d/-note)`, `rk-next` | SA02 decision | facts show known values only | exact (SA02 `ol.rk-events`) |
  | `DecisionPanel`, `DecisionOutcome` | `rk-panel`, `rk-panel-head/-body`, `rk-done`, `rk-done-meta`, `rk-stand` | SA02 decision | outcome takes focus | structure, e2e |
  | `ConfirmDialog` | `rk-dialog`, `rk-dlg-head/-body/-group/-list/-now/-later/-foot` | SA02 decision | `useModalDialog` (shared with v46): title focused on open, Tab cycle, Esc = Cancel, focus back to the trigger | unit, e2e |
  | `Notice`, `Banner` | `rk-notice(--warn/--paused/--off/--ok/--info)`, `rk-notice-t/-d/-act`, `rk-banner` | SA02, IA02 | — | structure |
  | `V46Island` | `div[data-xr-v46]` | ADR-0010 | V3 excludes it; V3P-05 container and text defaults | unit, e2e (computed styles equal) |
  | `Icon`, `Glyph`, `V3_ICON_PATHS` | `xr-ico(--16/--18)` | rails and symbols of the four boards | 22 paths taken from the v46 registry, 17 new | unit (every path drawn on a board) |

## Central patches (`src/styles/v3/patch.css`, layer `xr.v3.patch`)

| Id     | What                                                                                          | Why                                                                                           | Consumers                               |
| ------ | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------- |
| V3P-01 | `dialog.rk-dialog` reset of the user-agent dialog box; `::backdrop` = the drawn scrim         | the confirmation is a native modal dialog (page inert, Esc is a cancel request)               | `ConfirmDialog`                         |
| V3P-02 | `.rk-sortbar.rk-x-sort-shown/-hidden`                                                         | one sort control at the table's own breakpoint (measured before paint), never two, never none | `SortBar`, `RecordTable`, `ListSurface` |
| V3P-03 | `.rb-drawer`, `.rb-scrim` hidden from 1024 px                                                 | the drawer cannot outlive its breakpoint; focus moves to the rail                             | `WorkspaceShell`                        |
| V3P-04 | `a:not([class]):hover` thickness back to `auto`                                               | isolation from v46 PF-19                                                                      | every V3 class-less link                |
| V3P-05 | `[data-xr-v46]`: `xr-app` container, v46 text defaults, no V3 text rendering                  | v46 islands render as v46                                                                     | `V46Island`                             |
| V3P-06 | retired (XS)                                                                                  | the skip link is now the XS export's `a.xs-skip` (shell patch XS-P1)                          | —                                       |
| V3P-07 | retired (XS)                                                                                  | the account wrapper is now the XS export's `xs-acct-slot` / `xs-acct` (XS-P3)                 | —                                       |
| V3P-08 | `.xr-avatar` `letter-spacing: normal`                                                         | isolation: v46 `.xr-avatar` adds `.02em`, V3 declares none (found by the board comparison)    | `AccountMenu`                           |
| V3P-09 | `.rb.rk-x-region` (+ `--banner`); `container-name: xr-app rb` on the v46 app root holding one | an XS surface inside a v46 page: a V3 root but no shell; V3 breakpoints on the app width      | `V3Region`                              |
| V3P-10 | `.rb.rk-x-popover` `display: contents`                                                        | the XS account panel under the v46 account button, placed by `div.xr-acct`                    | `AccountMenuInV46Shell`                 |
| V3P-11 | `.rk-crumbs.rk-x-crumbs-tight` `margin-bottom: -12px`                                         | XS "Report sent" draws its breadcrumb 12 px above the card with an inline style               | `Breadcrumbs` (`tight`)                 |

Product V3 classes: exactly `V3_PRODUCT_CLASS_ALLOW_LIST` (`@xr/config/policy-terms`):
`rk-x-sort-shown`, `rk-x-sort-hidden`, `rk-x-region`, `rk-x-region--banner`, `rk-x-popover`,
`rk-x-crumbs-tight`. XS extension classes (`xs-*`) come from the owner-approved export's
`xs-shared.css` (lint `xr/v3-class-names`); its preview-only scaffolding (`xs-slot*`, `xs-pub*`,
`xs-spec`, `xs-kit*`) is canvas-only and refused everywhere (`CANVAS_CLASS_PATTERNS`).

## Source defects not copied (confirmed accessibility or correctness fixes)

1. Confirmation: a `div` over an `aria-hidden` scrim left the page in the tab order and the
   accessibility tree → native `showModal()` (V3P-01).
2. Drawer: the scrim was a second "Close menu" button; the page behind stayed reachable; an open
   drawer stayed over the rail after growing → `aria-hidden` scrim, inert page, V3P-03.
3. SA-01 queue: the whole queue was a polite live region (every row read on each switch) → one
   short announcement ("Requests, 3 items").
4. Format badges named by an `aria-label` on a plain `span` (ignored) → visually hidden words.
5. `aria-describedby` pointing at error ids that do not exist → only existing ids.
6. Choice errors not associated with their group → the fieldset's description.
7. Radio cards named by title and consequence together, then described by the consequence again →
   named by the title, described by the line.
8. Category buttons named "Requests3" → "Requests 3" (a space the flex layout does not draw).
9. "Different from the request" as a live region updated per keystroke → plain text.
10. "No match" as a live region repeating the count's announcement → not live.
11. The narrow sort bar keyed to the toolbar's width (correct only through padding arithmetic) and
    shown after an asynchronous measure → keyed to the table head, measured before paint (V3P-02).
12. Removing a filter chip dropped focus to the page → next chip, previous chip or Search.
13. "More filters" counted only Internal/External after Type moved into it (< 600 px) → counts
    what it holds.
14. No skip link → the product's is kept (V3P-06; since the XS export, its `xs-skip`, XS-P1).
15. Narrow table layouts change the cells' display → explicit table roles keep the semantics.

## Board items reproduced as drawn, flagged for the owner

- O-1 · SA02 draws `p.rk-note` ("Four separate events") and IA02 `div.rk-plan-id`; no V3 sheet
  defines either class, so they render as plain text / a plain box. The components emit the
  elements without the undefined classes; the look is the board's.
- O-2 · Logo slot: the V3 boards read "Official WILP logo"; the v46 placeholder (BC12) reads
  "BITS Pilani / WILP logo — placeholder". V3 surfaces use the V3 words. No crest is drawn.
- O-3 · IA01 draws the institution's own code MEC-523 with `rb-code` (indigo chip) while the HANDOFF
  rule gives the institution's code the outlined chip (`rk-owncode`, as IA02 draws it).
  `PlanSheet` takes the chip from the caller; the specimen follows IA01.
- O-4 · SA01 orders the priority band "Soonest deadline first, then the longest wait" — a design
  proposal, not an approved service ranking (`pack/common/03` "Pending presentation proposals").
  The component renders the order it is given and the note it is given.
- O-5 · Icons: SA boards draw "Requests" with an inbox tray (`inbox`), IA boards with the v46
  requests icon (`requests`). Both are kept as drawn.

## Not provided yet (no V3 source in the foundation or the XS export)

Stepper / guided steps, a danger button, a "live / current version" status tone, list tables
other than the SA-02 request layout, the public shells and the calm overview board (IA01-calm).
Role exports bring these; they are added here centrally, once, and reused. Delivered by the XS
export (XS-v6): the sign-in page, Help & support, the account menu panel (XS-05), the message page
and the access banner and notices (XS-08).
