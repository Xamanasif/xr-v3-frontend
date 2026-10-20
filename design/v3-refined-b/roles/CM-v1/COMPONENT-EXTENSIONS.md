# Component extensions — Content Manager (XR-V3-RB-1.0)

No design token was added or changed. `core.css`, `rb.css` and `rb-kit.css` are byte-identical to the owner pack (hashes in `FOUNDATION-LOCK.json`). Everything new lives in two additive files:

- `project/cm.css` — role components, `cm-` prefix.
- `project/xs-borrowed.css` — borrowed shared surfaces, `xsb-` prefix, to be replaced by the Shared Surfaces (XS) delivery.

Neither file restyles a base class on its own. A few kit elements are sized **inside** a role container only; they are listed under each component. Every container query belongs to the component that owns it (`rbpage`, `rkmain` or the component's own container), as the foundation contract asks.

## Reused from the V3 kit unchanged

| Pattern | Kit classes | Where |
| --- | --- | --- |
| Shell: rail, gold current marker, count badge, top bar, drawer below 1024 px | `rb`, `rb-rail`, `rb-nav`, `rb-count`, `rb-top`, `rb-menu`, `rb-acct`, `rb-drawer`, `rb-scrim` | every screen |
| Page head with figures | `rb-head`, `rb-figs`, `rb-fig` | CM-02, CM-04, CM-08 list, CM-09 |
| Identity band | `rb-id`, `rb-id-top`, `rb-id-text`, `rb-id-name`, `rb-id-status`, `rb-id-act` | CM-03, CM-05, CM-08 detail (and the CM-06 / CM-07 entries) |
| Queue groups and rows, calm state | `rb-queue`, `rb-g`, `rb-rows`, `rb-row`, `rb-calm` | CM-01 |
| Category switch with counts (SA-01 pattern) | `rb-switchbar`, `rb-switch` (`aria-pressed`) | CM-04 views |
| Request table with its container-query layouts | `rk-table`, `rk-rowlink`, `rk-strong`, `rk-small`, `rk-fmts`, `rk-inlabel` | CM-04 |
| Toolbar, search, select, chips, count, clear, sort | `rk-toolbar`, `rk-field`, `rk-input`, `rk-select`, `rk-chip`, `rk-count`, `rk-clear`, `rk-sortbtn` | CM-02, CM-04 |
| List states (ListState): empty, no match, loading, couldn’t load | `rk-state`, `rk-state--roomy`, `rk-state-ico--err`, `rk-loading-msg`, `rk-skel`, `rk-skel-row`, `rk-skel-ca`, `rk-skel-band`, `rk-skel-card`, `rk-skel-cells` | CM-02, CM-04, CM-08 list, CM-09 |
| Detail page and sticky aside | `rk-detailwrap`, `rk-detail`, `rk-mainsheet`, `rk-aside`, `rk-dl`, `rk-tl` | CM-03, CM-05, CM-08 detail |
| Decision panel and form controls | `rk-panel`, `rk-choice`, `rk-check`, `rk-errsum`, `rk-ferr`, `rk-pending`, `rk-go`, `rk-done`, `rk-stand`, `rk-hint`, `rk-goto` | CM-03, CM-05, CM-08 detail |
| Notices | `rk-notice--info` / `--ok` / `--warn` / `--paused` / `--off` | stale, saved, hold, read-only, released, back from a correction |
| Dialog with scrim | `rk-dialog`, `rk-scrim`, `rk-dlg-*` | Publish, Send for academic review, Withdraw |
| Status grammar and format badges | `xr-st--info/ok/err/paused`, `rk-st-ended`, `rk-st-lg`, `xr-fmt`, `rk-code` | everywhere |

Status mapping used: submissions *Ready to publish* / *In academic review* / *Back with the Academic Reviewer* = info ring; something to resolve = error; *With the vendor* = neutral; *Published* = ok. Corrections: *Draft* neutral, *In academic review* info, *Returned* error, *Awaiting release decision* info, *On hold* paused, *Released* ok, *Withdrawn* ended.

List states follow the SA-02 and IA-02 seeds: loading shows an announced status (“Loading the content library…”) and a skeleton, and hides the count and the figures; couldn’t load says “Nothing has changed. Try again.” and *Try again* reloads the list and moves focus to the page title.

Deviation from a first draft, recorded: the library first used `rk-tabs`; at 375 px the four tabs overflowed and hid the selected one. It uses the existing `rb-switch` (as on SA-01), and the pressed button is scrolled into view.

The kit’s format cells (`rk-fstrip`) and fact strip (`rk-factstrip`) are no longer used: the published record shows its formats in the identity band and in the catalogue entry, as the anchors do.

## Publishing-desk components

The Content Manager sits at two gates: between the Academic Reviewer and the public catalogue for first publication, and first in line for corrections to live content. These components show that position — who holds an item, how long it has waited, what decides it, and which step is yours (gold). Tokens only.

### A. Stage track — `cm-flowwrap`, `cm-flow`, `cm-step` (`is-done`, `is-now`, `is-you`, `is-held`, `is-back`, `is-off`), `cm-step-dot`, `cm-step-k/t/d`, `cm-you`, `cm-flow--mini`
One item's journey as numbered stages: who holds it, what the stage is, when. The current stage carries `aria-current="step"`; each stage also says its state in words for screen readers (“Done:”, “Your step, now:”, “Returned:”, “On hold:”, “Closed:”, “Next:”).
- CM-03 identity band: vendor → Academic Reviewer → you → public catalogue.
- CM-08 list (mini), CM-08 detail and the CM-05 band (mini, when a correction is open): you → Academic Reviewer → Super Admin → everyone. `is-off` draws the stages of a withdrawn correction dashed and muted (detail page); in the list, released and withdrawn corrections show their outcome line instead.
- Container `cmflow`: below 560 px the stages run vertically; the mini variant puts who · what on one line.

### B. Publishing pipeline — `cm-pipe`, `cm-pipe-head`, `cm-lanes`, `cm-lane`, `cm-lane-t`, `cm-tiles`, `cm-tile` (`is-you`, `is-quiet`), `cm-tile-a/n/t/d`
Both lifecycles counted from the records on CM-01. Each tile is a link to the list that holds those items; the tile name says what the link opens.
- Container `cmpipe`: below 720 px a compact four-up; below 480 px one row per stage. Inside its container only: `.rb .cm-tile-a`.

### C. Decision card — `cm-qlist`, `cm-qbody`, `cm-qcard` (`is-first`), `cm-age`, `cm-age-n/t/d`, `cm-qmain`, `cm-qname`, `cm-qline`, `cm-qmeta`, `cm-qchecks`, `cm-qcheck` (`is-no`), `cm-qsum` (`is-no`), `cm-qact`, `cm-next`
CM-02: one approved submission per card — days waiting, identity, the four publication checks, the next action. The longest wait is marked and gets the primary button.
- Container `cmq`: below 600 px the card stacks and keeps only the checks that fail (the summary line states the rest). Inside its container only: `.cm-qmeta .rk-fmts`.

### D. Version change — `cm-ver`, `cm-ver-live`, `cm-ver-new`, `cm-ver-old`
What is live and what is proposed, released or withdrawn (CM-01, CM-05 band, CM-08 list and detail).

### E. Correction tracker — `cm-trklist`, `cm-trk` (`is-you`, `is-closed`), `cm-trk-id`, `cm-trk-meta`, `cm-trk-st`, `cm-trk-act`, `cm-trk-flow`, `cm-trk-res` (`is-ok`), `cm-trk-note`, `cm-trksec`, `cm-trkcount`, `cm-trkfoot`
CM-08 list grouped by who must act: Need you, With others, Closed. Container `cmtrk`: below 700 px the status leads and the action goes full width.

### F. Group head with count — `cm-grp-head`, `cm-grp-n` (`is-you`)

### G. Main and side columns — `cm-cols`, `cm-side`, `cm-sidecard` (`--ivory`), `cm-sidecard-t`, `cm-says`, `cm-says-ico`, `cm-feed`, `cm-feed-t/d`, `cm-sidefoot`
Context beside the work: what publishing does, the latest catalogue changes, where a course code appears. Below 940 px page width one column with the side cards two-up; below 640 px stacked.

### H. Overview side panels — `cm-hold`, `cm-hold-t/d/st` (who has it now), `cm-catlist`, `cm-catlist-t`, `cm-catlist-n`, `cm-cattotal` (the catalogue by course)

### I. Decision desk rows — `cm-queue-top`, `cm-orow` (`is-first`), `cm-orow-x`, `cm-orow-q`
On the kit queue rows of CM-01. Inside its container only: `.rb-rows > li.cm-orow.is-first` (ivory band for the next to publish), `.cm-orow-x .rk-fmts`.

### J. Identity band — `cm-idband` (on kit `rb-id`), `cm-idtext`, `cm-idfacts` (`--ends`), `cm-idflow`, `cm-idflow-h`, `cm-idflow-t`
A record's facts and its stage track in the band, on CM-03, CM-05 and the CM-08 correction detail.
- `cm-idfacts`: four facts across; two across below 760 px page width. `--ends` (CM-05, CM-08 detail): on a phone (below 560 px) the first and last facts — course, corrections, dates — take the full width.
- `cm-idtext` (CM-05, CM-08 detail): the text column grows and shrinks (`flex: 1 1 440px`) so the band's action stays at the top right while there is room, and the status line wraps instead.
- `cm-idflow-h` / `cm-idflow-t` (CM-05): “Correction in progress” with the correction's status chip and version change above the mini track.

### K. Publication gate — `cm-gate`, `cm-gateline` (`is-ok`, `is-no`)
CM-03: the four checks as a two-by-two gate at the top of the main sheet (one column below 560 px).

### L. Library course bands and stage line — `cm-grp-h` (`th scope="rowgroup"`), `cm-grp-row`, `cm-grp-c`, `cm-grp-name`, `cm-grp-k`, `cm-stageline`, `cm-stageline-d`, `cm-own` (`is-you`, `is-vendor`, `is-live`), `cm-stcell`, `cm-utag`
CM-04 grouped by course, as the catalogue is; the line under the switch says who holds the items in that view; a published row with an open correction shows the correction's state as its own chip (kit `xr-st` grammar).
- Inside its container only: `.rk-table tbody tr.cm-grp-h` (no row hover; block row under 880 px).

### M. Course codes by engineering area — `cm-area` (`th scope="rowgroup"`), `cm-c-live`, `cm-livecount` (`is-zero`)
CM-09 grouped by engineering area (read-only here; Academic structure is the Super Admin's), with the number of live experiments under each code.

### N. Published record — `cm-cat-hs`, `cm-p-dl`, `cm-delgrid`, `cm-delcard`, `cm-delcard-h`, `cm-delcard-t`, `cm-deldl`
CM-05: the live catalogue entry says who sets the learning outcomes (`cm-cat-hs`, on its own line below 620 px); the description and live version follow as a kit definition list (`rk-dl` with `cm-p-dl` spacing); delivery is one card per format with its link or package, device needs and install notes in a two-column list (one column below 560 px of main sheet).

### O. Correction form grid — `cm-formgrid`, `cm-formgrid--about`
CM-06, CM-07, CM-08 detail: the reason and the version label share a row (`--about`: the reason gets the room, the label 200–260 px); app package references sit side by side. One column below 640 px of main sheet.

## Earlier role components (`cm.css`)

### 1. Catalogue entry — `cm-cat`, `cm-cat-top`, `cm-cat-course`, `cm-cat-body`, `cm-cat-name`, `cm-cat-sum`, `cm-cat-avail`, `cm-cat-h`
The entry as the public catalogue shows it: course code chip and name, title, summary, “Available in” formats, learning outcomes, formats and device needs. Tag reads *Preview — not public yet* before publication and *In the public catalogue* after.
- Used on CM-03, CM-05 and the PU-06 handoff frame.
- Own container `cmcat`: below 620 px tighter padding and a 21 px title.
- Reuse: the Public workstream may adopt it for PU-06; until then it is role-local.

### 2. Formats and device needs — `cm-devswrap`, `cm-devs`, `cm-dev` (`--head`), `cm-dev-d`
Three columns (format · how it runs · device needs) with a header row. Container `cmdevs`: below 540 px rows stack and each value gets a visible label (`cm-inlabel`, screen-reader-only on wide).

### 3. Publication check — `cm-checks`, `cm-check`, `cm-check--ok` / `--no`, `cm-check-ico`, `cm-check-t`, `cm-check-d`, `cm-check-fix`
The four v46 prerequisites read from the record: approved by the Academic Reviewer, learning outcomes, catalogue details, delivery details per format. A failed check shows what to do and disables Publish. Icon and words both carry the state (“Met:” / “Not met:” for screen readers). Shown as the gate (K) on CM-03.

### 4. Change comparison — `cm-cmpwrap`, `cm-cmp`, `cm-cmp-f`, `cm-cmp-now`, `cm-cmp-new`, `cm-cmp-empty`
Changed fields only, *Live now* against *Proposed* (or *Live before* against *Released*), proposed column tinted. Container `cmcmp`: below 640 px each field becomes a labelled block.
- **Proposed for the shared kit**: the Academic Reviewer’s *Review an update* (RV-04) and the Super Admin’s *Release or hold* (SA-11) show the same comparison. Promote it to `rk-` centrally rather than copying it.

### 5. Correction form — `cm-form`, `cm-label-row`, `cm-retbox`, `cm-retbox-h`, `cm-retbox-m`, `cm-tag`
The form gets the main column; the aside carries state and actions. `cm-tag` marks a field *Changed*; `cm-retbox` shows the Academic Reviewer’s return reason first.
- Inside its container only: `.cm-form .rk-field{max-width:46em}`.

### 6. Platform course codes table — `cm-codeswrap`, `cm-codes`, `cm-c-course`, `cm-course-t`, `cm-course-s`, `cm-codes-foot`, `cm-codes-state`
One editable table (course · live experiments · platform code), *Changed — not saved yet* tags, blank-code hint, inline duplicate errors, footer with unsaved-change count, *Undo changes* (shown only when something changed) and *Save codes*. Container `cmcodes`: below 640 px each course becomes a labelled block.
- Inside its container only: `.cm-codes .rk-input{max-width:240px}` (none on phone), `.cm-codes .rk-field{gap:8px}`, `.cm-codes-foot .rb-btn` full width on phone.

### 7. Small pieces
`cm-stack` (`--lg`), `cm-btnrow`, `.rb .cm-wide` (full-width secondary buttons in the aside), `cm-ol` (numbered learning outcomes), `cm-fmtname`, `cm-sub-strong`.

### Preview-only — never product UI
- **Scenario handoff box — `cm-dock`, `cm-dock-row`, `cm-dock-k`, `cm-dock-d`** (dashed): stands in for RV-04 and SA-11 decisions so the correction lifecycle can be exercised. Hidden on inspection boards (`handoffs="false"`). Must not ship. Inside its container only: `.cm-dock .rk-field{flex:1 1 320px}`.
- **Public-page handoff frame — `cm-pub`, `cm-pubbar`, `cm-publogo`, `cm-pubprod`, `cm-pubbody`**: what *View the public page* opens in this preview. It shows what PU-06 reads from the published record; it is not a design of PU-06.

## Behaviour notes for these components

- While a command runs, the button that started it shows its working label (*Publishing…*, *Sending…*, *Saving…*, *Withdrawing…*) and is disabled. In the Publish, Send for academic review and Withdraw dialogs, Cancel is disabled and Escape is ignored until the result, and focus is held on the dialog title; *Undo changes* waits while course codes save. A sent command is not taken back by closing its dialog.
- Every list state change is announced: loading through the status message, couldn’t load through `role="alert"`, counts through `role="status"`.

## Borrowed shared surfaces (`xs-borrowed.css`)

Implemented from the frozen v46 shared contract (boards 05, 07, 08, 10) in V3 tokens so the role is navigable. Owner: Shared Surfaces (XS). Replace one-for-one when XS delivers; the markup sits in clearly commented blocks in `Main.dc.html`.

| Surface | Classes | Contract |
| --- | --- | --- |
| Skip to main content: first Tab stop, hidden until focused, moves focus to `main` | `xsb-skip` | v46 workspace shell (board 05) — the V3 kit has no skip-link class |
| Account menu: name and role, Help & support, Sign out | `xsb-acctwrap`, `xsb-veil`, `xsb-menu`, `xsb-item` | XS-05 |
| Message page: one explanation, one way forward, Help as a quiet link | `xsb-msg`, `xsb-msg-ico`, `xsb-msg-act` | XS-06 Not your workspace (v46 AR-10 message-page template) |
| Help & support: my reports, report a problem, report sent, report detail | `xsb-form`, `xsb-file`, `xsb-foot`, `xsb-ref` | XS-07 |
| Signed-out page outside the workspace | `xsb-out`, `xsb-outbar`, `xsb-outbody` | XS-03 |

Inside their containers only: `.xsb-msg-act .rb-btn` and `.xsb-foot .rb-btn` go full width on phone, matching the kit’s own phone rule for head actions.
