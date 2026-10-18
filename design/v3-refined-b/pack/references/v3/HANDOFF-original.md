# XR Learning Platform · Design V3 · Batch 01 · Refined Direction B
## Implementation handoff

This package is the presentation layer for the five Batch 01 screens. Behaviour, permissions, mappings and copy are the frozen v46 ones; only layout and visual language change. Implement it in the existing React frontend by restyling the existing screens. Nothing here needs a new backend rule.

| Screen | Status in this set | Main board |
|---|---|---|
| SA-01 Super Admin overview | Approved Refined B, unchanged except links and drawer keys | `SA01.dc.html` |
| SA-02 Requests | New | `SA02.dc.html` |
| SA-03 Request decision | New | `SA03*.dc.html` (opens `SA02` in decision view) |
| IA-01 Institute Admin overview | Approved Refined B, unchanged except links and drawer keys | `IA01.dc.html`, `IA01-calm.dc.html` |
| IA-02 Content access | New | `IA02.dc.html` |

### Files

- `project/core.css`: tokens (`.xr`), status pills, format badges, focus ring. Unchanged from the approved overviews.
- `project/rb.css`: the Refined B shell (`.rb`): rail, top bar, page, buttons, overview components, term timeline. Unchanged.
- `project/rb-kit.css`: the new shared kit, `rk-` prefix. It never restyles `rb-` classes.
- `project/SA02.dc.html`: one component for SA-02 and SA-03, so a decision updates the list and the nav count. Props: `view` (list | decision), `record`, `asOf` (oct23 | oct08), `preset`, `listPreset`.
- `project/IA02.dc.html`: IA-02. Props: `scenario` (ending | active | activated | none | paused | ended), `listPreset` (nomatch | loading | failed | menu).
- Width and state boards (`*-1024`, `*-768`, `*-375`, `SA03-*`, `IA02-*`) are thin wrappers that pass props.
- `project/Kit.dc.html`: every shared component on one board. `project/Main.dc.html`: the title board. `project/canvas.json`: the canvas index.
- `design-tokens.json`: the tokens as data, for the React theme.

In the `.dc.html` files, logic sits in `renderVals()`; the sample records are static getters (`RQ`, `SNAP`, `SC`, `EXPS`). Treat them as fixtures, not as the data model.

### Visual system

- **Colour roles.** Navy `#141B5E` is the identity: rail, headings, decision panel head, formats in the plan. Indigo `#3B49B8` marks selection: chosen option, tab underline, links, dashed published format. Gold `#E9A825` is used once per view for the main action, plus the nav count and the current-page marker. Ivory `#FBF5E6` is used only for urgency (renewal due). Plan tint `#ECEFFB` is used for the access plan band. Semantic colours appear only on status and validation.
- **Type.** Public Sans only.
  - Page title: 40/46. Record title: 38/44. On phones these become 32/38 and 30/36.
  - Section: 20/28. Body: 16/24. Labels: 14.5/20.
- **Status pills** use colour and shape together. Each is listed as label (colour, icon shape).
  - Request statuses:
    - Under review (info, ring).
    - Information requested (error, diamond).
    - Approved — payment required (warn, half disc).
    - Payment not confirmed (warn, half disc).
    - Access active (ok, tick).
  - Plan statuses:
    - Active (ok).
    - Ending soon (warn).
    - Paused (outlined navy, bars).
    - Ended (outlined grey, dash; `rk-st-ended`).
  - There is no Declined status.
- **Formats.** WEB / AR / VR / MR have three appearances everywhere:
  - In plan or requested: solid navy with a gold tick.
  - Published, not in plan or not requested: 2px dashed indigo on white.
  - Not published: flat grey.
  - SA-03 cells show the code and *Requested / Not requested / Not published*.
  - IA-02 cells add the format name (Browser, Augmented reality, Virtual reality, Mixed reality) and *In your plan / Published, not in your plan / Not published*.
  - List rows use compact solid badges for the requested formats only.
- **Codes.** BITS course codes (`ME ZG523`) use the indigo code chip. The institution's own code (`MEC-523`) uses the outlined chip.

### Shared components (rb-kit.css → suggested React components)

| Component | Classes | Notes |
|---|---|---|
| PageHead | `rk-head`, `rb-h1`, `rk-sub`, `rk-head-act` | The date moves from the top bar to an eyebrow on phones. Page actions run full width on phones. |
| Tabs | `rk-tabs`, `rk-tab[aria-current]` | Navigation links, not ARIA tabs. Course codes links to B2-03, outside this batch. |
| FilterToolbar | `rk-toolbar`, `rk-tools`, `rk-field`, `rk-input`, `rk-select`, `rk-toggle`, `rk-more`, `rk-statusline`, `rk-chip`, `rk-clear`, `rk-count`, `rk-sortbar` | `role="search"`. Under 600px Type moves into More filters. More filters shows a count of what it holds. Chips remove one filter each. |
| RequestTable | `rk-table` | A real `<table>` with a caption, `aria-sort` on Received, and the whole row clickable. It has three layouts by width: table, two-line rows, stacked cards. |
| ListState | `rk-state`, `rk-skel-*`, `rk-loading-msg` | No match, empty, loading and failed (with Try again). |
| DetailLayout | `rk-detailwrap`, `rk-detail`, `rk-mainsheet`, `rk-aside` | The aside is sticky on wide screens and bounded to the viewport (it scrolls inside if taller). Single column under 860px, with “Go to decision”. |
| FactStrip, DefinitionList, Timeline, EventsGrid | `rk-factstrip`, `rk-dl`, `rk-tl`, `rk-events` | Facts show only known values; nothing is padded with placeholders. |
| DecisionPanel | `rk-panel`, `rk-errsum`, `rk-fieldset`, `rk-choice`, `rk-locked`, `rk-checks`, `rk-ferr`, `rk-diff`, `rk-pending`, `rk-go`, `rk-done`, `rk-stand` | Navy head. Radio cards, error summary with links, field errors, change summary, pending hint, gold decision button, outcome block. |
| ConfirmDialog | `rk-scrim`, `rk-dialog`, `rk-dlg-*` | “What happens now” (green ticks) against “Only after later events” (amber clocks). |
| Notice, Banner, PlanNote | `rk-notice--warn/paused/off/ok/info`, `rk-banner`, `rk-plan-note--warn/off/paused` | |
| PlanBand | `rk-plan`, `rk-plan-grid`, `rb-term` | Identity on the left, term timeline on the right, one note strip when the plan needs attention. |
| CourseGroup, ExperimentCard, FormatCells | `rk-course`, `rk-exp`, `rk-fstrip`, `rk-fcell--on/pub/none` | Four cells across from 880px. Below that they become rows, two per line, then one per line. |
| Drawer | `rb-menu`, `rb-drawer` | Below 1024px the rail becomes Menu. |

All breakpoints are container queries on the component, not the viewport, so the layouts hold with or without the rail. Values are in `design-tokens.json` under `breakpoints`.

### Behaviour to keep

**SA-02 Requests**
- Columns: institution and contact person, experiments (one title with requested formats, or “N experiments”), type with route, received, status.
- The default sort is newest received first. Received toggles the order, and on narrow widths a Sort control appears beside the count.
- Search matches institution or contact person.
- Filters:
  - Status: the five statuses above.
  - Type: New access, Additional licences, Renewal.
  - Internal or external, under More filters: Internal, External, Not set yet.
- The count reads “N requests”, or “X of N requests” when filtered. Clear filters returns focus to Search.
- Opening a row moves focus to the record title. Back (breadcrumb or nav) returns focus to the Requests heading.
- The Requests nav count is the number of requests under review. It updates after a decision.
- States: no match (with Clear filters), loading (the count is hidden), failed (“Nothing has changed. Try again.”), no requests yet (no toolbar).

**SA-03 Request decision**
- **Choices.**
  - Approve request.
  - Approve a smaller scope. This needs a change and a reason, and it is unavailable for a renewal.
  - Request more information. The request stays open.
  - There is no Decline and no manual “mark paid”.
- **Internal or external.**
  - It is set here, at approval, and only for a new institution.
  - For an existing institution it is shown locked: “Set when this institution was first approved.”
  - Internal: approval activates institutional access at once (status Access active, payment “Not needed (internal)”).
  - External: approval sets Approved — payment required. Access is activated only after the payment is confirmed, which is not recorded on this page.
- **Validation** (exact copy).
  - “Choose a decision”.
  - “Choose internal or external”.
  - “Keep at least one format”.
  - “Enter a whole number of licences”.
  - “Change at least one thing, or choose Approve request”.
  - “Enter the reason for the change”.
  - “Enter what you need from the requester”.
  - Errors appear in a summary that receives focus; each summary link focuses its field. Pending hints explain what is missing before the button is pressed.
- **Confirmation dialog** for approvals.
  - Opening it focuses the title. Tab cycles between Cancel and the confirm button. Escape or Cancel returns focus to the decision button.
  - Confirm records the decision, updates the status, history and “where it stands” list, and focuses the outcome.
  - Request more information sends without a dialog.
- **The four separate events** (institution record, request approval, payment confirmation, institutional access activation) are explained under “What happens after you decide”.
- **Every confirmation ends with:** “Students get access only when the institution’s administrator gives it.”
- **A paused institution** shows no decision form: “This institution is paused. Requests from a paused institution can’t be decided…”
- **No internal IDs.** Super Admin screens never show REQ-, ACC-, UPD-, DTR-, SUP- or SUB- numbers, including in hidden text. Academic course codes stay.

**IA-02 Content access**
- **Plan band:**
  - ACC-0107 and its status.
  - “120 licences, as approved by BITS”, with no used or free counts (D7 open).
  - The yearly term timeline.
  - Ending soon: renewal note with Request renewal.
  - Ended: “This plan has ended…” with Request renewal.
  - Paused: banner, striped term, read-only note. No give actions.
- **Experiments list:**
  - Search covers experiment, course code and course name.
  - The Status filter offers Active, Ending soon and Ended.
  - The count reads “1 experiment in 1 course”.
  - A format key shows the three format appearances.
  - Course group: the BITS code with the institution's own code, or “Your course code: not added” with Add code.
  - Experiment card: format cells, “Students given access” (a count linking to Student access, or “None yet”) and Give access.
- **Kept apart, as v46 requires:**
  - Published formats.
  - Formats in the institution's plan.
  - Student grants, which are only a count here.
- **States:**
  - Populated: active, ending soon, paused, ended.
  - New institution: just activated, with no students and no code yet.
  - No access plan yet: “Request REQ-0042 is approved — payment required”.
  - No match, loading, failed.
- IA screens keep ACC-0107, REQ-0042 and SUP-0213, as in v46.

**Everywhere**
- Body text is about 16px. The focus ring is a visible 2px outline; a focused table row is outlined as a whole.
- Motion is limited to short fades and a shimmer, and both are removed under `prefers-reduced-motion`.
- The drawer opens with focus on Close, keeps Tab inside, closes on Escape and returns focus to Menu.

### Links

| Control | Goes to |
|---|---|
| SA-01 rail Requests, Open Requests | SA-02 |
| SA-01 renewal and request rows | SA-03 (renewal, Konark, Godavari extra licences) |
| SA-02/SA-03 rail Overview | SA-01 |
| IA-01 Content access (rail, Go to, plan footer) | IA-02 |
| IA-02 Overview | IA-01 (IA-01 calm for the 15 Feb 2027 board) |
| Give students access, Give access | B2-05 Give students access (outside this batch) |
| Students given access count | B2-04 Student access (outside) |
| View plan, Add code, Course codes tab | B2-03 Access plan and course codes (outside) |
| View request status | B1-08 Request status (outside) |
| Request renewal | B3-08 IA requests to BITS (outside) |

The canvas preview cannot share state across boards; each board keeps its own state. In the app, a decision must update the request list, the nav count and the institution's records.

### Sample dates

| Boards | As of |
|---|---|
| SA-01, SA-02, SA-03 records other than the new institution | Fri 23 Oct 2026 |
| SA-03 new institution (Godavari, received 2 Oct 2026, 10:14) | Thu 8 Oct 2026, decision at 11:20 |
| IA-01, IA-02 populated (ending soon) | Wed 22 Sep 2027 |
| IA-01 calm, IA-02 active | Mon 15 Feb 2027 |
| IA-02 new institution, no plan yet | Thu 8 Oct 2026 |
| IA-02 paused | Tue 2 Mar 2027 |
| IA-02 ended | Fri 8 Oct 2027 |

### Open records to confirm (flagged, not resolved)

1. **Konark Polytechnic.** v46 B1-11 says it is paused and its term ends 24 Sep 2027. B7-01 and the approved SA-01 say its access ends 2 Nov 2026. SA-03 shows the pause and leaves out the end date.
2. **Godavari, 60 more licences (21 Oct 2026).** This request appears only on SA-01.
   - Its contact person, experiment and formats are taken from Godavari's single plan.
   - Its received time is unknown.
   - The confirmation copy for extra licences at an existing external institution is derived from v46's external copy.
   - On a smaller scope the term stays “Current term” and read-only.
3. **IA-02 course code.** v46's ending-soon, paused and ended boards say “code not added”, but IA-01 and v46's 9 Oct 2026 state show MEC-523. MEC-523 is used from 9 Oct 2026 on.
4. **Renewal confirmation** uses v46's generic internal copy.
5. **Sahyadri.** Its additional-licences request (18 Sep 2026) predates “access active since 30 Sep” on SA-01.
6. **SUP-0213** names two different reports in v46 (3 Oct 2026 and 20 Sep 2027). IA-01 is unchanged.
7. **Internal confirmation example.** As in v46, the internal confirmation is shown on the Godavari record.

### Not touched

The V1 Public Landing (locked), the earlier Batch 01 and Visual Directions canvases, the v46 reference pack and the existing Claude Code frontend were not touched. The official WILP logo has a reserved slot only.

### Verification done

- All 51 boards were rendered at their own widths (1440, 1024, 768 and 375 among them). None scrolls horizontally, no content runs past its container, and the console is clean.
- 92 scripted interaction checks pass. They cover:
  - SA-02: filters, sort, chips and focus.
  - SA-03: validation, focus and dialog keyboard handling, and internal, external, smaller-scope and information outcomes.
  - Renewal and paused rules.
  - That no internal IDs appear on any Super Admin board, and that course codes do.
  - IA-02: filters, states and Try again.
  - The drawer on all four phone boards, and the links between boards.
