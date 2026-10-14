// The WP-0.15 expected-deviation register (machine-readable half; `DEVIATIONS.md` is the
// reviewed text with the measured differences of the recorded run). A comparison that names an
// entry here is still made and measured; it never passes silently (parity.mjs `compareAll`), and
// a decision never changes what is measured: the comparisons, pins, tolerances and the zero-mask
// policy stay as they are.
//
// `status`:
//   'owner-approved'     — an owner decision or authorisation covers the difference (the 14 Oct
//                          2026 visual-decision closure decided all open WP-0.15 entries but two);
//   'approved-rule'      — excluded by a frozen owner rule (START-HERE "Not product features",
//                          Appendix E §10 canvas-only list), not a product choice;
//   'owner-acknowledged' — accepted only as measured; its cause is not proven and stays tracked;
//   'owner-deferred'     — deferred to a named later phase; a tracked implementation requirement;
//   'provisional'        — a documented provisional design choice that awaits the owner;
//   'owner-review'       — newly identified; the owner must decide. Never approved by the harness.
// `class` (the WP-0.15 mismatch classes): 'capture-environment' | 'fixture-state' |
//   'approved-accessibility' | 'product-regression' | 'design-conflict' | 'canvas-only' |
//   'phase-0-scope' | 'phase-1-scope' (a Phase-1 package builds a screen whose drawn links lead
//   to pages of a later package).
// `blocksParity`: whether the entry kept Phase-0 parity acceptance open until the owner decided.
// `tracked`: what stays to be done or rechecked after the decision (runner, later phase, open
//   question) — listed in DEVIATIONS.md and by `pnpm verify`.

/** Statuses that are approvals. */
export const APPROVED_STATUSES = ['owner-approved', 'approved-rule'];
/** Statuses the owner has closed for Phase-0 parity acceptance (approved, or qualified/deferred). */
export const CLOSED_STATUSES = [...APPROVED_STATUSES, 'owner-acknowledged', 'owner-deferred'];

export const DEVIATIONS = [
  {
    id: 'DEV-01',
    title:
      'Busy button look: grey (aria-disabled) in the product vs full colour (aria-busy) on Batch-0 boards',
    class: 'design-conflict',
    status: 'owner-approved',
    blocksParity: true,
    boards: [
      '03 "Actions" busy column (Give access, Save draft, Withdraw access)',
      '07 "State 1b · Sending"',
      '10 "DL-2 · Confirm with reason · destructive · busy"',
    ],
    product:
      '@xr/ui Button `busy` (and every busy confirm built on it: Help "Send report", dialogs)',
    expected:
      'Batch-0 boards 03, 07, 10 (8 buttons): `class="… is-busy" aria-busy="true"`, no aria-disabled — the variant keeps its colour, spinner + busy words.',
    actual:
      'The product sets aria-disabled="true" while busy (WP-0.6 ledger), so the verbatim v46 rule `.xr-btn[aria-disabled="true"]` greys it — as the 590 busy buttons on the product boards (B1…B7) are drawn.',
    accessibility:
      'Either look keeps the busy words as the accessible name. aria-disabled also announces "unavailable"; aria-busy does not. No contrast failure either way.',
    decision:
      'Owner visual-decision closure, 14 Oct 2026 (WP-0.15; frozen-v46 prototype only — not an approval of unrelated business policies or future screen designs): retain the grey busy-button styling and behaviour of the product boards (`aria-disabled`, `is-busy`), keeping the spinner, the busy wording and duplicate-submission prevention. Closes the WP-0.13 open item ("Button busy = aria-disabled vs board 07 aria-busy").',
    proposal:
      'Decided: no change. Implemented as decided — @xr/ui Button `busy` (button.test.tsx) and the Help "Send report" press guard (report-sending.test.tsx: two presses while busy, one call).',
  },
  {
    id: 'DEV-02',
    title:
      'Read-only value: label outside the box with a lock note (board 03) vs label inside the box (product boards)',
    class: 'design-conflict',
    status: 'owner-approved',
    blocksParity: false,
    boards: ['03 "Form controls · Text input" (Student ID, "Read-only · set at import")'],
    product: '@xr/ui ReadOnlyValue',
    expected:
      'Board 03: `span.xr-label` above `div.xr-ro`, the note as `xr-meta` with a 16 px lock icon.',
    actual:
      'ReadOnlyValue follows the product boards: `div.xr-ro` holding `span.xr-label` + `span.xr-ro-val` (54 drawn instances on B2/B3/B7, e.g. "Licences", "Access plan", "Moving from"); the note has no lock icon. 2 px shorter.',
    accessibility: 'None: both expose the label and the value as text.',
    decision:
      'Owner visual-decision closure, 14 Oct 2026 (WP-0.15; frozen-v46 prototype only — not an approval of unrelated business policies or future screen designs): use the product-board ReadOnlyValue pattern.',
    proposal: 'Decided: no change (the board-03 variant is not added).',
  },
  {
    id: 'DEV-03',
    title: 'Board 03 "Full name · focused": static `.is-focus` on an input',
    class: 'canvas-only',
    status: 'approved-rule',
    blocksParity: false,
    boards: ['03 "Form controls · Text input" (second field)'],
    product: '@xr/ui TextInput with real keyboard focus',
    expected:
      'Board: generic `.is-focus` (outline 2 px, offset 2 px) plus an inline border colour — a canvas specimen state.',
    actual:
      'Real `:focus-visible` from the verbatim v46 rule `.xr-input:focus-visible{outline:2px solid var(--xr-focus);outline-offset:0;border-color:#1F4FD8}`.',
    accessibility: 'None: the product ring is the stylesheet’s own, 6.6:1 on white (board 02).',
    decision:
      'START-HERE known exception 4 / Appendix E §10 item 7 (static `.is-focus` states are canvas-only); visual-system.json specimenStates: "focus the element instead".',
    proposal: 'None. Kept as a measured comparison so the input focus look stays visible.',
  },
  {
    id: 'DEV-04',
    title: 'Batch-0 specimen-only inline layout that the product boards do not draw',
    class: 'design-conflict',
    status: 'owner-approved',
    blocksParity: false,
    boards: [
      '03 "Notices, empty, error, loading and read-only" (Empty)',
      '03 "List rows and attention items" (the students table)',
      '03 "Decision panel and editable table" (Your decision)',
      '04 "State grammar · one pattern per state" (Paused · shell banner)',
    ],
    product: '@xr/ui EmptyState, DataTable, DecisionPanel + RadioGroup/ChoiceList',
    expected:
      'Board 03 only: `div.xr-empty style="padding-top: 8px"`; an action column `th style="width: 120px"`; the decision choices as labels straight in a `fieldset style="gap: 10px"`. Board 04 only: the paused banner with `style="border-top: 1px solid #E8D3A3"` (1 px taller).',
    actual:
      'The product draws them as the product boards do: `div.xr-empty` with no inline padding (570 of 574 drawings); action headers with no width (123 of 124); decision panels with `div.xr-choice-list` (29 of 29 product-board panels); the paused banner with no top border (24 of 25 drawings, board 05 and B2-10 among them).',
    accessibility: 'None.',
    decision:
      'Owner visual-decision closure, 14 Oct 2026 (WP-0.15; frozen-v46 prototype only — not an approval of unrelated business policies or future screen designs): follow the product-board layout, not the specimen-only inline styles.',
    proposal:
      'Decided: no change. The DataTable column-width API stays a later-phase need if a screen draws one.',
  },
  {
    id: 'DEV-05',
    title: 'Icon anti-aliasing residuals in two Batch-0 board contexts (capture environment)',
    class: 'capture-environment',
    status: 'owner-acknowledged',
    blocksParity: false,
    boards: [
      '02 "Icon sizing and working icon set · Sizes" (the 24 px clock)',
      '03 "Notices, empty, error, loading and read-only" (the warn notice’s 20 px triangle)',
    ],
    product: '@xr/ui Icon (`waiting`, 24 px; `attention` in a warn Notice, 20 px)',
    expected:
      'The boards draw `svg.xr-ico.xr-ico--24` with the waiting path in a flex row, and `svg.xr-ico` with the attention triangle at the start of the warn notice (stretched by the board’s two-column grid).',
    actual:
      'Same elements, paths, classes and computed styles (colour #8A5A05 / ink, 1.75 px stroke, round caps) at the same sub-pixel offset (alignment 0, 0); the rasters differ by a fraction of a pixel: 2 pixels at the top of the 24 px circle and 6 pixels along the triangle’s edges exceed the 0.1 threshold (the triangle drawn about a quarter pixel higher). The 24 px clock is pixel-identical in the 48-icon working set of the same board (`02-icon-waiting`, also tried at x 89 and at the board’s y mod 256). The triangle’s 6 pixels were already there when the whole warn notice was compared (0.008 %, inside the notice’s tolerance); compared on its own, as the stretched notice requires, they exceed the icon’s.',
    accessibility: 'None.',
    decision:
      'Owner visual-decision closure, 14 Oct 2026 (WP-0.15; frozen-v46 prototype only — not an approval of unrelated business policies or future screen designs): the measured, pinned rendering residuals are acknowledged — only as measured. Their root cause is not proven and is not claimed.',
    proposal: 'No product change. Recheck on the eventual standardized runner (VD-18).',
    tracked:
      'Recheck both residuals (2 px clock, 6 px triangle) on the standardized runner (VD-18); their cause is unknown.',
  },
  {
    id: 'DEV-06',
    title: 'Focus ring on the navy sidebar and drawer: gold (PF-07) instead of the drawn blue',
    class: 'approved-accessibility',
    status: 'owner-approved',
    blocksParity: false,
    boards: [
      '06 "Drawer · Student · 375 px" ("Close menu" drawn with `.is-focus`)',
      '11 "375 · Drawer open" (the same drawer head)',
    ],
    product: 'Sidebar / drawer "Close menu" with real keyboard focus (WorkspaceShell)',
    expected:
      'Board 06 draws the focused "Close menu" with the static `.is-focus` inside `aside.xr-side` (no `.xr-dark`), i.e. the blue #1F4FD8 ring on navy: 2.35:1.',
    actual:
      'PF-07 `.xr-side :focus-visible{outline-color:var(--xr-focus-dark)}`: the gold #F7C95B ring board 02 specifies for navy ("Focus on navy · Ring #F7C95B · 10 : 1"), 9.98:1.',
    accessibility: 'Positive: WCAG 1.4.11 non-text contrast is met (2.35:1 → 9.98:1).',
    decision:
      'Owner visual-decision closure, 14 Oct 2026 (WP-0.15; frozen-v46 prototype only — not an approval of unrelated business policies or future screen designs): VD-11 decided — the accessible gold focus ring on navy (PF-07). Supersedes the provisional status of VD-11 / P0-17.',
    proposal: 'Decided: no change (PF-07 stays).',
  },
  {
    id: 'DEV-07',
    title: 'Rail: board 06 static `.xr-side--rail` specimen vs the live container-query rail',
    class: 'design-conflict',
    status: 'owner-approved',
    blocksParity: false,
    boards: ['06 "Rail · Institute Admin · tooltip on hover and focus"'],
    product: 'WorkspaceShell rail at 1024–1279 px of app width (Sidebar in the shell)',
    expected:
      'Board 06 draws the rail with the static class `.xr-side--rail`, whose verbatim v46 rules include `.xr-side--rail .xr-nav{padding:8px 12px 0}` (nav 282 px, Help foot 81 px).',
    actual:
      'The product rail is the shell’s own: the verbatim v46 container query `@container xr-app (min-width:1024px) and (max-width:1279.98px){ .xr-shell:not(.is-expanded) > .xr-side … }`, which has no `.xr-nav` padding rule — as board 11 "1024 · Super Admin · Request decision" draws a live shell (nav 4 px taller, foot 8 px shorter). Tooltip identical.',
    accessibility: 'None: same targets, names and tooltip.',
    decision:
      'Owner visual-decision closure, 14 Oct 2026 (WP-0.15; frozen-v46 prototype only — not an approval of unrelated business policies or future screen designs): retain the live responsive rail (the shell’s container-query rail, as board 11 draws it).',
    proposal: 'Decided: no change.',
  },
  {
    id: 'DEV-08',
    title:
      'Dialog Cancel: secondary button (product boards) vs quiet text button (board 10) — VD-06',
    class: 'design-conflict',
    status: 'owner-approved',
    blocksParity: true,
    boards: [
      '10 "States · focus, validation, busy" (6 dialogs)',
      '10 "Keyboard path and phone layout" (375 px)',
    ],
    product: '@xr/ui ConfirmDialog / ReasonDialog / EditDialog footer (`xr-dialog-foot`)',
    expected: 'Board 10: Cancel as `xr-btn--text` ("Cancel first (quiet)").',
    actual:
      'The product draws Cancel as `xr-btn--secondary`, as 397 Cancel + 12 "Keep answering" + 47 keepLabel buttons on 44 product boards do (Appendix E V-2).',
    accessibility: 'None either way: both meet the 24 × 24 target and contrast.',
    decision:
      'Owner visual-decision closure, 14 Oct 2026 (WP-0.15; frozen-v46 prototype only — not an approval of unrelated business policies or future screen designs): VD-06 decided — `xr-btn--secondary` for dialog Cancel actions, as the product boards draw them.',
    proposal: 'Decided: no change (dialog.tsx keeps `variant="secondary"`).',
  },
  {
    id: 'DEV-09',
    title:
      'DL-3 width: 520 px (board 10 state frames, v46 `.xr-dialog`) vs 440 px (board 10 live demo)',
    class: 'design-conflict',
    status: 'owner-approved',
    blocksParity: false,
    boards: [
      '10 "States · focus, validation, busy" (DL-3 · Small edit · default / validation: 520 px)',
      '10 "Try it · keyboard and pointer" (live DL-3 "Rename group": `dialog style="width: min(440px, 100%)"`)',
    ],
    product: '@xr/ui EditDialog',
    expected:
      'Board 10 draws DL-3 at two widths: 520 px in its state frames (xr-foundation.css `.xr-dialog{width:min(520px,100%)}`) and 440 px in its live demo (inline style).',
    actual:
      'The product EditDialog is 520 px wide, as the state frames and the stylesheet; height equal to the live demo (246 px; the state frames add a 16 px gap for an empty templated paragraph). Measured: 80 px narrower on the live demo; no pixel comparison is made against it.',
    accessibility: 'None.',
    decision:
      'Owner visual-decision closure, 14 Oct 2026 (WP-0.15; frozen-v46 prototype only — not an approval of unrelated business policies or future screen designs): keep the 520 px EditDialog.',
    proposal: 'Decided: no change.',
  },
  {
    id: 'DEV-10',
    title:
      'Phase-0 sidebars list no destination (P0-35): Help alone, as no destination screen is built',
    class: 'phase-0-scope',
    status: 'owner-approved',
    blocksParity: false,
    boards: [
      '07 every frame (full sidebar, Help current)',
      '08 "In context · Student workspace · 1312 px", "At 375 px"',
    ],
    product:
      'apps/web RoleWorkspaceShell on the built Phase-0 screens (XS-07, XS-06, in-shell PU-15)',
    expected: 'The boards draw every workspace destination in the sidebar.',
    actual:
      'Navigation items render only for built screens (ADR-0005 §8, register P0-35); Phase 0 builds only XS-07, so the sidebar shows Help alone and no navigation landmark (owner-kept refinement, WP-0.9 authorisation). Every other sidebar part — head, workspace label and institution, Help foot — is compared strictly and matches; the full sidebar is proven against boards 05, 06 and 11 in the specimen suite.',
    accessibility: 'None: no link to an unbuilt screen; Help keeps its place (WCAG 3.2.6).',
    decision:
      'Owner visual-decision closure, 14 Oct 2026 (WP-0.15; frozen-v46 prototype only — not an approval of unrelated business policies or future screen designs): P0-35 approved as the Phase-0 interim — navigation lists built screens only.',
    proposal: 'Decided: no change in Phase 0.',
    tracked:
      'Each later phase adds its built destinations to the sidebars (P0-35 is approved as the Phase-0 interim only).',
  },
  {
    id: 'DEV-11',
    title:
      'XS-07 content comes from the sample world: P0-31 title excerpts, walk dates, who holds reports',
    class: 'fixture-state',
    status: 'owner-approved',
    blocksParity: false,
    boards: [
      '07 "State 1c · Sent · reference" (SUP-0213 drawn)',
      '07 "State 3a · Report detail · reopened · Content Manager" (title)',
      '07 "Phone · 375 · My reports" (row title and date)',
      '05 Help state (two sample reports drawn for every workspace)',
    ],
    product: 'XS-07 My reports and report detail (apps/web) on the after-flow-d world',
    expected:
      'Board 07 illustrates the reports with drawn titles ("Delivery link preview showed an empty frame", "VR simulation stopped loading at step 2") and dates ("sent 3 Oct").',
    actual:
      'The product shows the world’s records: the title is the display-only excerpt of "What happened" (P0-31) — "The preview of the WEB delivery link showed an empty frame.", "The VR simulation stopped loading at the second step." — and SUP-0213 is sent on its walk date (16 Oct). The walk has already issued SUP-0213, so the report sent in State 1c is given the next reference, SUP-0214 — the same on every run (the id source hands out the walk’s reservations first; no mask). Only Rahul (SUP-0213) and Kavya (SUP-0207) hold reports, so the other workspaces’ Help pages show the empty state and their header has no "Report a problem" (board 07 "Rules": with nothing to list the action moves into the empty state), where board 05 draws two sample reports for every workspace. In State 3a the back link, the reopened notice, the history and "Report another problem" are compared strictly; the header and "What you reported" carry the words and are registered. In the 375 list (07-f9) the two-line title makes the section 24 px taller, so the list is registered as a whole: it is not compared strictly, but its content fingerprint is pinned, so its row, chip and date cannot change silently.',
    accessibility: 'None.',
    decision:
      'P0-31 approved by the owner as the Phase-0 interim (12 Oct 2026: display-only excerpt, no saved title field; P0-31 stays open for the final title source). G-2 (12 Oct 2026): the screens show the typed mock services’ sample world (ADR-0002, ADR-0003), whose walk dates and report holders are WP-0.11’s.',
    proposal: 'None for Phase 0; P0-31’s final decision may change the title words.',
  },
  {
    id: 'DEV-12',
    title:
      'ErrorSummary drawn as `xr-notice--err` (Batch-0 boards) vs the product `xw-errsum` (VD-22)',
    class: 'design-conflict',
    status: 'owner-approved',
    blocksParity: true,
    boards: ['07 "State 1a · Validation"', '03 "Form controls" (summary, not compared: VD-22)'],
    product: '@xr/ui ErrorSummary (XS-07 report form)',
    expected:
      'Board 07 draws the validation summary as `div.xr-notice.xr-notice--err` with a link, held 20 px above the form by an inline `style="margin-bottom: 20px"`; board 03 draws the same notice.',
    actual:
      'The product ErrorSummary emits `xw-errsum`, as 192 summaries on 25 product boards do (Appendix E V-13), none with an inline margin; its baseline is B4-04 "Step 2 · validation" (compared in the specimen suite). In the page it sits in the `xr-stack` (24 px gap), so the 1280 frame is 4 px taller (964 → 968 px) and its sidebar with it.',
    accessibility: 'Both link to the field and take focus (VD-21).',
    decision:
      'Owner visual-decision closure, 14 Oct 2026 (WP-0.15; frozen-v46 prototype only — not an approval of unrelated business policies or future screen designs): VD-22 decided — the product `xw-errsum` ErrorSummary pattern, including its accessible field-link behaviour (links move focus to the field; the summary takes focus on a failed submit).',
    proposal: 'Decided: no change (ErrorSummary keeps `xw-errsum`).',
  },
  {
    id: 'DEV-13',
    title: 'Report detail "What you reported": canvas `doc-kv` on board 07 vs product `xl-kv`',
    class: 'design-conflict',
    status: 'owner-approved',
    blocksParity: false,
    boards: [
      '07 "State 3 · Report detail · resolved with note · Faculty"',
      '07 "State 3a · Report detail · reopened · Content Manager"',
    ],
    product: 'XS-07 report detail (apps/web `report-detail.tsx`)',
    expected:
      'Board 07 lists the reported facts in `dl.doc-kv` — a canvas documentation class (Appendix E §10 item 4).',
    actual:
      'The product uses the KeyValueList class `xl-kv` (Appendix E §3), as the product boards do.',
    accessibility: 'None.',
    decision:
      'Owner visual-decision closure, 14 Oct 2026 (WP-0.15; frozen-v46 prototype only — not an approval of unrelated business policies or future screen designs): use `xl-kv`, not the canvas-only `doc-kv`.',
    proposal: 'Decided: no change.',
  },
  {
    id: 'DEV-14',
    title: 'Report form at 375 px: board 07 "Phone · 375" and board 11 "375 · AR-8 form" disagree',
    class: 'design-conflict',
    status: 'owner-approved',
    blocksParity: false,
    boards: ['07 "Phone · 375 · Report a problem"', '11 "375 · AR-8 form"'],
    product: 'XS-07 Report a problem at 375 px (PF-14 phone rule)',
    expected:
      'Board 07 m1: the 1280 frame’s words and layout at 375 (all three hints, 24 px card padding, "Send report" at its own width). Board 11 m-form: 20 px card padding, "Send report" growing (`flex: 1 1 160px`), and no hint under "Where did it happen?" or "Screenshot".',
    actual:
      'The product takes board 07’s words (all hints) and board 11’s phone layout (PF-14, WP-0.13 "followed 11"): 8 px shorter than board 07 m1 (padding and button) and 76 px taller than board 11 m-form (the two hints board 11 leaves out).',
    accessibility: 'None.',
    decision:
      'Owner visual-decision closure, 14 Oct 2026 (WP-0.15; frozen-v46 prototype only — not an approval of unrelated business policies or future screen designs): retain board 07’s form wording with board 11’s mobile layout.',
    proposal: 'Decided: no change (PF-14 phone rule stays).',
  },
  {
    id: 'DEV-15',
    title: 'Help & support lead sentence: board 05 vs board 07 words',
    class: 'design-conflict',
    status: 'owner-approved',
    blocksParity: false,
    boards: [
      '05 Help state (Help in the sidebar)',
      '07 "State 2 · My reports …" (the GL-03 template)',
    ],
    product: 'XS-07 Help & support header (HelpSupportHome lead)',
    expected:
      'Board 05: "Something isn’t working? Report it here and follow what happens to your report." Board 07: "Something isn’t working? Report it here and follow what happens."',
    actual: 'The product uses board 07’s sentence (the Help & support template board).',
    accessibility: 'None.',
    decision:
      'Owner visual-decision closure, 14 Oct 2026 (WP-0.15; frozen-v46 prototype only — not an approval of unrelated business policies or future screen designs): use board 07’s Help lead sentence.',
    proposal: 'Decided: no change.',
  },
  {
    id: 'DEV-16',
    title:
      'MessagePage has no amber (paused) icon tint for the later-phase "Access paused" message',
    class: 'phase-0-scope',
    status: 'owner-deferred',
    blocksParity: false,
    boards: ['08 "The family" — "Access paused" (XS-08 · ST-19)'],
    product: '@xr/ui MessagePage (tones: neutral, ok)',
    expected:
      'Board 08 tints the "Access paused" icon circle amber (#FBF3E0 / #8A5A05), the waiting tone.',
    actual:
      'MessagePage (WP-0.6) draws the neutral and success tints only; the paused message is a Phase-2 screen (ST-19), so no Phase-0 screen needs it. The other seven family messages match.',
    accessibility: 'None: the words carry the meaning.',
    decision:
      'Owner visual-decision closure, 14 Oct 2026 (WP-0.15; frozen-v46 prototype only — not an approval of unrelated business policies or future screen designs): deferred to the phase that implements ST-19; kept as a tracked implementation requirement.',
    proposal:
      'Deferred: add a `warn` (amber) tone to MessagePage with the ST-19 / XS-08 "Access paused" screen.',
    tracked:
      'MessagePage amber (paused) icon tone — required when ST-19 / XS-08 "Access paused" is built.',
  },
  {
    id: 'DEV-17',
    title: 'Board 07 draws its sidebars without count badges',
    class: 'design-conflict',
    status: 'owner-approved',
    blocksParity: false,
    boards: [
      '07 "State 2 · My reports · … · Institute Admin" (Requests, no count)',
      '07 "State 3 · Report detail · … · Faculty" (Marking, no count)',
    ],
    product:
      '@xr/ui Sidebar with board 06 counts (the harness shell; no destination is built in Phase 0)',
    expected:
      'Board 07’s frames list the destinations with no count badge (its nav data carries no counts).',
    actual:
      'Boards 05, 06 and 11 draw the same sidebars with counts — Institute Admin "Requests 2", Faculty "Marking 12" — and the shell follows them (board 06 is the navigation authority). Everything else in the board 07 sidebars matches; no Phase-0 screen shows a count (no counting destination is built).',
    accessibility: 'None.',
    decision:
      'Owner visual-decision closure, 14 Oct 2026 (WP-0.15; frozen-v46 prototype only — not an approval of unrelated business policies or future screen designs): retain board 06’s navigation authority (counts as boards 05, 06 and 11 draw them). The unresolved Institute Admin request-count semantics are not invented or decided here.',
    proposal: 'Decided: no change.',
    tracked:
      'Institute Admin request-count semantics stay unresolved (WP-0.8 open item: the Requests count opens IA-17 but counts IA-18); decide before a counting destination is built.',
  },
  {
    id: 'DEV-18',
    title:
      'Success notice icon: Done tick (product boards) vs Reviewed-by-me circle tick (Batch-0 boards)',
    class: 'design-conflict',
    status: 'owner-approved',
    blocksParity: false,
    boards: [
      '03 "Notices, empty, error, loading and read-only" ("Access given")',
      '04 "State grammar · one pattern per state" ("Submitted")',
      '07 "State 3 · Report detail" (resolution note) and 10 "Try it" (result notice): circle tick, matched by the product',
    ],
    product: '@xr/ui Notice tone "ok" (default icon, `NOTICE_TONE_ICONS.ok`)',
    expected:
      'Batch-0 boards 03, 04, 07 and 10 draw every `xr-notice--ok` (4) with the Reviewed-by-me circle tick (`M12 21a9 9 0 1 0 0-18 … M8 12.5l2.7 2.7L16 9.8`).',
    actual:
      'The product default is the Done tick (`M5 12.5l4.5 4.5L19 7.5`), as all 241 ok notices of the 128 product boards draw it (WP-0.6 ledger). The Help resolution note passes the circle tick explicitly (board 07 and its product board agree). Pixels: 41 px each, inside the 0.001 ratio of a 420-px notice — the icon check of the comparator reports it.',
    accessibility: 'None: the icon is decorative (`aria-hidden`); the words carry the meaning.',
    decision:
      'Owner visual-decision closure, 14 Oct 2026 (WP-0.15; frozen-v46 prototype only — not an approval of unrelated business policies or future screen designs): Done is the default success tick; the circled tick is used where a drawing explicitly requires it (e.g. the Help resolution note).',
    proposal:
      'Decided: no change (Notice keeps `done` for ok; `icon` reproduces the circled tick where drawn).',
  },
  {
    id: 'DEV-19',
    title: 'Board 08 family frames hold a message at the canvas frame’s width (562 px)',
    class: 'canvas-only',
    status: 'approved-rule',
    blocksParity: false,
    boards: [
      '08 "The family" — "Page not found · public" and "This page isn’t part of your workspace" (the sentence)',
    ],
    product: 'PU-15 public and XS-06 message pages (apps/web, `xr-msg`)',
    expected:
      'The family members share one template: each message sits in a presentation frame (`div.doc-frame style="background: #F4F5FB"`, a placeholder strip, a padded wrapper), which holds the sentence paragraph at 562 px.',
    actual:
      'On the page the message reaches its own `max-width: 600px` (verbatim v46 `.xr-msg`), so the sentence is 600 px wide and wraps one word later (public: “…Published experiments / are all in the catalogue.”; still two lines, 48 px) — as board 08’s own "In context" frame draws the message at 600 px (`08-in-context-message`, 600 × 232, 0 px different). Icon, title and actions are compared strictly; the workspace PU-15 sentence (one line, in the shell) matches; the full message block at the drawn width is compared in the specimen suite (b07-b08). The two registered sentences are pinned by content fingerprint, so their words, colour and wrapping cannot change silently.',
    accessibility: 'None.',
    decision:
      'START-HERE “Not product features”: the presentation frames themselves are canvas chrome (Appendix E §2.5 group 1, §10 item 2).',
    proposal: 'None.',
  },
  {
    id: 'DEV-20',
    title: 'Public PU-15 page background: the public shell’s white vs board 08’s #F4F5FB frame',
    class: 'design-conflict',
    status: 'owner-approved',
    blocksParity: false,
    boards: ['08 "The family" — "Page not found · public" (PU-15)'],
    product: 'PU-15 public message page (apps/web root not-found, public shell `.xp`)',
    expected:
      'Board 08 — the only drawing of the public PU-15 — shows it in the family template’s frame painted #F4F5FB by an inline style, under a placeholder strip ("Public header · Batch 1").',
    actual:
      'The product page sits on the public shell’s white (`.xp{background:#FFFFFF}`, xr-public.css, as every `xp` page of the product boards); measured in the captures: #F4F5FB on the board, #FFFFFF on the product around the icon, title, sentence and actions. The 0.1 comparator threshold does not separate the two (about 4 % luminance), so no comparison fails on it — this entry records it so the threshold does not hide it.',
    accessibility: 'None: the text contrast is higher on white.',
    decision:
      'Owner visual-decision closure, 14 Oct 2026 (WP-0.15; frozen-v46 prototype only — not an approval of unrelated business policies or future screen designs): retain the public shell’s white background.',
    proposal: 'Decided: no change.',
  },
  // ---- Phase-1 Package 1A (14 Oct 2026): newly identified, for the owner's review ----------------
  {
    id: 'DEV-21',
    title:
      'Package 1A: drawn links and destinations whose pages are not built yet are not rendered (P0-35, Phase-1 extension)',
    class: 'phase-1-scope',
    status: 'owner-review',
    blocksParity: false,
    boards: [
      'B1-09 f0, f11 — "Back to experiments" (top row, to B1-01) and "Need access for your institution? Request institutional access" (under the card, to B1-06)',
      'B1-10 f0 — the Super Admin sidebar: Overview, Requests, Institutions, Content, Academic structure, Platform roles, Operations',
      '05 "Super Admin" shell on Help — the same seven destinations. The Phase-0 comparison `05-super-admin-help-built-sidebar` (DEV-10, Help only) is now measured as `05-super-admin-help-built-sidebar-package-1a`; its Phase-0 pin is kept unchanged and is no longer observed',
    ],
    product:
      'XS-01 `AuthFrame` / `SignIn` (apps/web features/shared/xs-01-sign-in); the Super Admin sidebar from the built-screen manifest (nav/built-screens.ts)',
    expected:
      'B1-09 draws the two links on the sign-in page; B1-10 and board 05 draw the Super Admin sidebar with all seven destinations.',
    actual:
      'The Super Admin sidebar lists Requests (built in 1A, with its count of requests under review read from the world) and Help only. On the sign-in card the top row\'s "Back to experiments" renders since Package 1B built the Landing (PU-01; its back icon is DEV-23), and the card foot\'s "Request institutional access" since Package 1C built the Selection (PU-07): the sign-in comparisons no longer name this entry. Measured per comparison in DEVIATIONS.md.',
    accessibility:
      'None: an unbuilt address would show the public not-found page and, as a document load, restart the tab’s sample world (ADR-0004).',
    decision:
      'Rule: owner P0-35 interim, extended to Phase 1 in the Package-1A authorisation (14 Oct 2026: "Keep built-screen-only navigation and avoid links to unavailable pages"). The measured difference itself is for the owner’s review — not approved by the harness.',
    proposal:
      'Close as covered by P0-35 for Package 1A; each link and destination appears with the package that builds its page (1B–1D), and the comparisons then come within tolerance.',
  },
  {
    id: 'DEV-22',
    title:
      'Package 1A: the spine-start sample world’s requests differ from the B1 boards’ sample data',
    class: 'fixture-state',
    status: 'owner-review',
    blocksParity: false,
    boards: [
      'B1-10 f0 — seven requests from REQ-0042 (2 Oct) to REQ-0036, count "3 requests under review"',
      'B1-11 f16 — REQ-0038: 3 experiments, 860 licences, Yearly, received 24 Sep 2026; ACC-0081',
      'B1-09 f9 — "Sign in again to go back to where you were: My courses › Shell-and-Tube Heat Exchanger."',
    ],
    product: 'SA-02 / SA-03 on the spine-start world; XS-03 with a built return address',
    expected: 'The B1 boards’ own sample records (the S-1/S-2 "B1 variant").',
    actual:
      'The world holds one answer per record (P1-12 reading, sample-platform README): the B7 variant — REQ-0038 renews ACC-0098 (2 experiments, 80 licences, Monthly, received 26 Sep 2026, 16:02); REQ-0042 does not exist until the public request path (Package 1C), so the list holds the ten seeded requests (with the origin requests REQ-0027/0029/0031/0033) and two are under review. The expired notice names a built page ("Requests › REQ-0038"); "My courses" is a Phase-2 page. Layout, type and colour of the same parts are compared strictly where the words are the same (organisation, message, panel, toolbar, table head).',
    accessibility: 'None.',
    decision:
      'Sample data only (P1-12, S-1/S-2 B7 reading recorded in the sample-platform README); no product rule. For the owner’s review — not approved by the harness.',
    proposal:
      'Acknowledge as fixture state; recheck B1-10 / B1-11 f0 against REQ-0042 once Package 1C creates it.',
  },
  {
    id: 'DEV-23',
    title:
      'Back-link icon: the Batch-1 boards’ chevron (`M15 6l-6 6 6 6`) vs board 02’s Back icon (`M14.5 6 8.5 12l6 6`)',
    class: 'design-conflict',
    status: 'owner-review',
    blocksParity: false,
    boards: [
      'B1-11 f0, f9, f15, f16 — `a.xr-back` "Requests" (and B1-05, B1-07, B1-08, B1-09, B1-12, B1-13: 55 back links on the Batch-1 boards)',
      '02 "Icon sizing and working icon set" (Back) and every Batch 2–7 board (456 back links)',
    ],
    product:
      '@xr/ui BackLink (WP-0.6), on SA-03; since Package 1B also on PU-06 ("Back to VR experiments", B1-05 f5) and the sign-in top row ("Back to experiments", B1-09)',
    expected: 'B1-11 draws the back link with the chevron path `M15 6l-6 6 6 6`.',
    actual:
      'BackLink draws board 02’s Back icon `M14.5 6 8.5 12l6 6`, as all 456 back links on the other product boards and the Phase-0 Help pages do; the 20 px glyph differs by a few pixels (measured in DEVIATIONS.md) and the icon check reports the different path.',
    accessibility: 'None: the icon is decorative (`aria-hidden`); the link names its destination.',
    decision:
      'Board versus board (Batch 1 against board 02 and Batches 2–7). For the owner’s review — not approved by the harness.',
    proposal:
      'Keep board 02’s Back icon everywhere (one icon set, Appendix E §3); no per-screen icon.',
  },
  {
    id: 'DEV-24',
    title:
      'Sign-in page height: the product page fills the viewport (PF-02, VD-23) where B1-09’s frame ends at `.xp-auth{min-height:820px}`',
    class: 'design-conflict',
    status: 'provisional',
    blocksParity: false,
    boards: [
      'B1-09 f0 "GL-02 Sign in · 1440 · interactive" (the whole frame, 825 px high)',
      'B1-06 f3 "Empty selection" at 720 (Package 1C): the frame ends at 893 px; the product page fills the 900 px viewport by the same rule',
    ],
    product:
      'XS-01 `/sign-in` (`div.xp` > `div.xp-auth`); since Package 1C also PU-07 Your selection when it is short (empty); product.css PF-02 `.xp:not(.xr-app .xp){min-height:100dvh}`',
    expected:
      'The canvas frame is as tall as the drawn page: the 76 px top row and the gradient `.xp-auth` at its 820 px minimum (825 px in the capture).',
    actual:
      'PF-02 gives every public page root the viewport’s height, so at 1440 × 900 the page is 900 px high: the gradient keeps its 820 px minimum and the root’s white shows under it — the white band PF-02 already records for the owner under VD-23. The card and its parts are compared strictly and match.',
    accessibility: 'None.',
    decision:
      'Documented provisional choice PF-02 / VD-23 (product.css): "on B1-09 sign-in a white band shows under the gradient — for the owner under VD-23".',
    proposal: 'The owner decides VD-23 (public page height); the sign-in page follows it.',
  },
  {
    id: 'DEV-25',
    title:
      'B1-11 f16 (1060 px): the static frame keeps the expanded shell’s "Collapse menu" button in the rail band',
    class: 'canvas-only',
    status: 'owner-review',
    blocksParity: false,
    boards: [
      'B1-11 f16 "Renewal · 1060" — `button.xr-top-collapse aria-label="Collapse menu" aria-expanded="true"` with the collapse icon, while the frame’s container query shows the 72 px rail',
      '11 "Responsive proof" — the live shell: "Expand menu" and the expand icon in the rail',
    ],
    product: 'WorkspaceShell top bar at 1024–1279 px of app width (WP-0.8)',
    expected: 'B1-11 f16: the collapse icon (`M4 5h16v14H4zM9.5 5v14M16 10l-2 2 2 2`).',
    actual:
      'The live shell in the rail band offers "Expand menu" with the expand icon, as board 11 draws it; the top bar is otherwise identical (measured in DEVIATIONS.md).',
    accessibility:
      'The product’s name and `aria-expanded` state what the button does in the rail; the static frame’s do not.',
    decision:
      'A static template state inside a fixed-width canvas frame (START-HERE Known exception 4 family). For the owner’s review — not approved by the harness.',
    proposal: 'Follow board 11’s live shell (no change).',
  },
  // ---- Phase-1 Package 1B (14 Oct 2026): newly identified, for the owner's review ----------------
  {
    id: 'DEV-26',
    title:
      'Package 1B: the public ways into the Selection and the request (PU-07, Package 1C) are not rendered (P0-35, Phase-1 extension)',
    class: 'phase-1-scope',
    status: 'owner-review',
    blocksParity: false,
    boards: [
      'B1-01 … B1-05 header — `a.xp-sel` "Selection (n)" and `a.xp-access` "Request access" (and at 375 px the Selection link beside Menu)',
      'B1-01 "Mobile 375 · menu open" — the sheet’s Selection row and its Request access button',
      'B1-01 hero `li.xp-path` "Institutions · Request institutional access" and the For institutions `div.xp-inst-foot` button',
      'B1-05 "In your selection" — `a.xr-btn--primary` "Go to selection"',
    ],
    product:
      'apps/web features/public (PublicFrame header and menu sheet, Landing, SelectionPanel); nav/public-nav.ts renders only built destinations',
    expected: 'The boards draw each of these links, all leading to B1-06 (PU-07 Selection).',
    actual:
      'PU-07 is Package 1C: the links are not rendered, so the header end holds Sign in (and Menu) only, the hero lists one audience line, the For institutions section ends after its four steps, and the panel goes from "In your selection" straight to Change formats. Measured per comparison in DEVIATIONS.md.',
    accessibility:
      'None: an unbuilt address would show the public not-found page and, as a document load, restart the tab’s sample world (ADR-0004). Adding to the selection works and is shown in the panel and on catalogue rows.',
    decision:
      'Rule: owner P0-35 interim, extended to Phase 1 (Package 1A and 1B authorisations: "keep the Public navigation within implemented destinations"). The measured difference is for the owner’s review — not approved by the harness.',
    proposal:
      'Close as covered by P0-35 for Package 1B; the links appear with PU-07 in Package 1C and the comparisons then come within tolerance.',
    tracked:
      'Package 1C (14 Oct 2026) built PU-07 and rendered every link listed: the comparisons that named this entry are within tolerance (no longer observed) and name it no more. The 1-px height of the B1-03 and B1-05 whole frames, measured under this entry since Package 1B, is DEV-31.',
  },
  {
    id: 'DEV-27',
    title:
      'Package 1B: the spine-start world holds no preview link, so PU-06 shows the drawn poster where B1-05’s default frame draws a preview',
    class: 'fixture-state',
    status: 'owner-review',
    blocksParity: false,
    boards: [
      'B1-05 "PU-06 Experiment · 1440 · interactive" — `div.xp-preview` with the browser-format art and "Open preview" (href `#Dd-preview`, a canvas anchor)',
    ],
    product: 'PU-06 Preview section (features/public/pu-06-experiment)',
    expected:
      'B1-05’s default frame: the preview art, "Preview · Browser format" and Open preview.',
    actual:
      'No seeded experiment has a preview link (the sample world draws none; inventing one would be fabricated data), so every PU-06 shows B1-05’s own "Preview · poster only" state — compared strictly against that frame. The preview-with-link state is unit-tested only.',
    accessibility: 'None.',
    decision:
      'Sample data only; no product rule. For the owner’s review — not approved by the harness.',
    proposal:
      'Acknowledge as fixture state; add a preview link to the sample world only if the owner supplies one.',
  },
  {
    id: 'DEV-28',
    title:
      'Package 1B: PU-06 "How it runs" for VR and MR uses the domain’s B6-07 words ("…supported VR headset.", "…mixed-reality device.") where B1-05 / B1-01 draw "…supported headset." / "…supported device."',
    class: 'design-conflict',
    status: 'owner-review',
    blocksParity: false,
    boards: [
      'B1-05 "Formats and device needs" — VR "The experiment in a virtual lab, on a supported headset."',
      'B1-01 Formats cards (the same sentences; the landing renders B1-01’s words)',
      'B6-07 `fmtText` (the source of `@xr/domain` FORMAT_META.howItRuns, WP-0.3)',
    ],
    product:
      'CatalogueService.getExperiment `formats[].howItRuns` (sample-platform views.ts → FORMAT_META), rendered by PU-06',
    expected: 'B1-05: "The experiment in a virtual lab, on a supported headset."',
    actual:
      'The read model answers FORMAT_META’s sentence: "The experiment in a virtual lab, on a supported VR headset." The landing’s format cards keep B1-01’s own words (copy/public.ts).',
    accessibility: 'None.',
    decision:
      'Board versus board (B1-05 / B1-01 against B6-07); one vocabulary feeds several screens. For the owner’s review — not approved by the harness.',
    proposal:
      'Owner chooses one sentence per format for every screen; FORMAT_META then follows it (one change in @xr/domain).',
  },
  {
    id: 'DEV-29',
    title:
      'Package 1B: concept art drawn as the boards’ live `div.xp-bgart` background where B1 static frames draw `<img>` — the SVG edges rasterise differently (0.1–0.4 % of a part)',
    class: 'design-conflict',
    status: 'owner-review',
    blocksParity: false,
    boards: [
      'B1-02 explorer and B1-04 rows — the live markup: `div.xp-ex-art|xp-erow-media > div.xp-bgart.xp-art--<key>` (compared at 0–13 px)',
      'B1-01 hero, Formats cards; B1-03 area cards and course rows; B1-05 hero and preview — the static frames: `img src="art/<key>.svg"` with `object-fit`',
    ],
    product:
      'apps/web features/public/shared/art.tsx `Drawing` (one mechanism for every public drawing); product.css PF-22 `background-size:contain` where the static frame contains',
    expected: 'The static frames’ `<img>` rendering of the same SVG files.',
    actual:
      'The same drawing at the same size and position, scaled as a background image: anti-aliased edges differ by a few hundred pixels per part (B1-01 hero figure 1,213 px · 0.37 %, Formats cards 2,413 px · 0.24 %, B1-03 course rows 749 px · 0.11 %, B1-05 poster 981 px · 0.42 %); colours, layout and words are identical. Where a board describes the drawing, the product names it (`role="img"` + the drawn description).',
    accessibility:
      'None: the drawings are decorative except the hero, which keeps its drawn description.',
    decision:
      'Board versus board (static `<img>` frames against the live bound frames of B1-02 / B1-04). For the owner’s review — not approved by the harness.',
    proposal:
      'Keep one mechanism (the live boards’ background art). Alternative: an `<img>` for the static placements, which needs the art served as files by @xr/ui.',
  },
  {
    id: 'DEV-30',
    title:
      'Package 1B: B1-04 f9 "Show 7 experiments" — on the canvas the bound words sit in a runtime wrapper and overflow the button to the right; the product centres them inside the button',
    class: 'canvas-only',
    status: 'owner-review',
    blocksParity: false,
    boards: [
      'B1-04 "Mobile 375 · filter sheet" — `div.xp-fsheet-foot` `button.xr-btn--primary` `{{ c.showN }}`',
    ],
    product: 'PU-04 filter sheet foot (features/public/shell/filter-sheet.tsx; @xr/ui Button)',
    expected:
      'The canvas frame: the words start at the button’s left padding and run past its right padding to the edge.',
    actual:
      'At 375 px the words are wider than the button’s content box (two 165.5 px buttons); the product’s text is the button’s own flex item and is centred, so it stays inside the border on both sides (558 px · 2.2 % of the foot).',
    accessibility: 'None: the product keeps the whole label inside the button.',
    decision:
      'The canvas runtime’s binding wrapper (START-HERE Known exception 6 family), not the drawn design. For the owner’s review — not approved by the harness.',
    proposal: 'Keep the centred label (no change).',
  },
  // ---- Phase-1 Package 1C (14 Oct 2026): newly identified, for the owner's review ----------------
  {
    id: 'DEV-31',
    title:
      'Whole-frame captures of a page whose height is fractional: the board frame rasterises one pixel row taller than the product page',
    class: 'capture-environment',
    status: 'owner-review',
    blocksParity: false,
    boards: [
      'B1-03 "PU-02 All engineering areas · 1440" (page 1036.38 px: board 1037 rows, product 1036)',
      'B1-05 "PU-06 Experiment · 1440 · interactive" (board 2207 rows, product 2206; with DEV-27, DEV-28)',
      'B1-06 "Mobile 375" header, B1-07 "Mobile 375 · details" and "· sent" headers, B1-08 "Mobile 375" header (board 66 rows, product 65; the frames sit 0.125–0.25 px off the pixel grid)',
      'B1-06 "Mobile 375" bottom bar (its 1-px top border falls on the next row: 375 px, one row)',
    ],
    product:
      'Whole frames and a few parts of the public pages, where the board frame sits off the pixel grid',
    expected: 'The board frame’s capture height.',
    actual:
      'Every element box of the page is the same to 0.01 px on the board frame and on the product page (measured element by element on B1-03 f0: header 76, page head 326.88, page 496.50, footer 136; footer bottom 1036.38). The board frame sits at a fractional offset inside its canvas, so its clip covers 1037 device-pixel rows; the product page starts at 0 and covers 1036. The comparator then reports a size mismatch with no pixel count — the harness’s sub-pixel alignment moves the product by the offset (0.125–0.25 px here) but cannot add the row. Since Package 1B this was measured under DEV-26 (the missing Selection links), which Package 1C resolved; it is registered on its own now, with the Package-1C parts it also affects.',
    accessibility: 'None.',
    decision:
      'Capture environment (sub-pixel position of the canvas frame), not a product difference. For the owner’s review — not approved by the harness.',
    proposal:
      'Acknowledge as measured. Alternative: align the board frame to a whole pixel in the harness before the whole-frame capture (a harness normalisation, recorded in README "Capture normalisations").',
  },
  {
    id: 'DEV-32',
    title:
      'PU-10 history and status line: B1-08 writes the review start and the information request with a date only ("5 Oct 2026"); the product writes the time the world recorded ("5 Oct 2026, 10:00")',
    class: 'design-conflict',
    status: 'owner-review',
    blocksParity: false,
    boards: [
      'B1-08 f0, f2, f3, f4, f6, f7, f8, f10 — history "BITS started reviewing · 5 Oct 2026"; f3 "BITS asked for more information · 6 Oct 2026"',
      'B1-08 f2 "Updated 5 Oct 2026", f3 "Updated 6 Oct 2026" (the status head after those two events)',
      'B3-08 — the same information request written with its time: "BITS asked for more information · 22 Oct 2026, 11:00 · BITS"',
    ],
    product:
      'PU-10 Request status (apps/web features/public/pu-10-request-status; copy/request-access.ts `requesterHistory`, `updatedWords`)',
    expected:
      'B1-08: a date without a time for the review start and the information request, and for "Updated" after either; every other event with its time ("2 Oct 2026, 10:14", "8 Oct 2026, 11:20").',
    actual:
      'The product writes every history line and the status line from the instant the world recorded, in the one date-time form the requester pages use ("5 Oct 2026, 10:00"). The review start is a seeded or test-only fact (AD-14), recorded with a time like every other event. The words are compared line by line (`.xr-tl-when`, the status line): inside the whole history or status head the added ", 10:00" (about 56 pixels) is under the tolerance, which those parts keep. Measured per comparison in DEVIATIONS.md.',
    accessibility: 'None.',
    decision:
      'Board versus board (B1-08 against B3-08); no rule says which events have no time. For the owner’s review — not approved by the harness.',
    proposal:
      'Keep one date-time form for every event (no change), or the owner names the events written with a date only and the copy follows (one change in `requesterHistory` / `updatedWords`).',
  },
  {
    id: 'DEV-33',
    title:
      'B1-08 f9 "Internal route" draws the B1 variant of REQ-0039; the spine-start world holds the B7 variant',
    class: 'fixture-state',
    status: 'owner-review',
    blocksParity: false,
    boards: [
      'B1-08 f9 — REQ-0039, BITS Pilani — Hyderabad Campus: Composite Wall Conduction — WEB, AR; Fin-Tube Bundle — WEB, VR; 860 licences; Until 30 Jun 2027; submitted 26 Sep, review started 27 Sep, approved and active 29 Sep 2026, 09:40; ACC-0098',
    ],
    product:
      'PU-10 / PU-13 for REQ-0039, read by its Institute Admin (Dr P. Srinivas) on the spine-start world',
    expected: 'The B1 boards’ sample record (S-1/S-2 "B1 variant").',
    actual:
      'The world holds one answer per record (P1-12; sample-platform README; DEV-22): REQ-0039 activated ACC-0098 on 26 Sep 2026 for Distillation Column + Boiler Drum Level, WEB + VR, 80 licences, Monthly 1–31 Oct 2026 (the B7 variant). The world records it submitted at 09:00 and approved and active at 11:00 that day, with no review-start fact (B1-08 f9 draws "BITS started reviewing · 27 Sep 2026"). The status head — "Access active", the plan, Sign in — is the same; the table and history follow the world’s record.',
    accessibility: 'None.',
    decision:
      'Sample data only (S-1/S-2, as DEV-22); no product rule. For the owner’s review — not approved by the harness.',
    proposal: 'Acknowledge as fixture state (one sample answer per record).',
  },
];

export const DEVIATION_BY_ID = new Map(DEVIATIONS.map((entry) => [entry.id, entry]));

/**
 * The corrections decided before WP-0.15 and the canvas-only exclusions, and how the parity run
 * treats each (owner list of the WP-0.15 authorisation). `status` repeats the decision record in
 * substance; the harness approves none of them (only VD-11 was since decided, by the owner's
 * 14 Oct 2026 visual-decision closure). `comparisons` (a RegExp source)
 * selects the run's comparisons that exercise the correction; the register counts their outcomes.
 */
export const PRIOR_CORRECTIONS = [
  {
    id: 'PF-01 · B1-10 sort',
    title: 'DataTable sort: header button from 760 px, sort bar in the toolbar status row below',
    status:
      'Need CONFIRMED (START-HERE BC13, owner-mandated); design VD-04 PROVISIONAL. Owner accepted WP-0.7 on 13 Oct 2026 (toolbar-status placement: an accessibility correction and a documented v46 deviation) and authorised the PF-01 header correction (a975382).',
    parity:
      "Not baselined: B1-10 is a Phase-1 screen (SA-02). Board 03's ListToolbar + DataTable specimens at 1112, 720 and 343 px draw no sortable column.",
    comparisons: null,
  },
  {
    id: 'PF-07 · sidebar focus indicator',
    title: 'Gold focus ring on the navy sidebar and drawer',
    status:
      'VD-11 / P0-17 was PROVISIONAL; decided by the owner on 14 Oct 2026 (visual-decision closure): the gold ring is approved (DEV-06).',
    parity: 'Registered as DEV-06 where board 06/11 draw the static blue ring.',
    comparisons: '^(06-drawer-student-head|11-m-drawer-head)$',
  },
  {
    id: 'VD-16 · skip link',
    title: 'Skip link on every shell, focus moved to `main#main` (tabindex -1)',
    status: 'VD-16 PROVISIONAL (Appendix E §13 recommendation, as built in WP-0.6).',
    parity: 'Compared on keyboard focus against board 12 at the component tolerance.',
    comparisons: '^12-skip-link',
  },
  {
    id: 'PF-03 · fixed drawer and scrim',
    title: 'Workspace drawer and scrim fixed to the viewport below 1024 px of app width',
    status:
      'Viewport-fixed overlays: need CONFIRMED (Appendix E §2.3, §6.3); ADR-0001 decision 2 (gate G-3, 12 Oct 2026).',
    parity:
      'The drawer is compared part by part (head, workspace, destinations, Help) on boards 06 and 11 at 375 px; the harness crops inside a fixed ancestor from the viewport and 1 px inside left and right (the board draws the drawer over a bordered canvas frame) — a capture normalisation, not a product change.',
    comparisons: '^(06-drawer-student-|11-m-drawer-)',
  },
  {
    id: 'PF-04 · dialog positioning and bottom sheet',
    title:
      'Native `dialog.xr-dialog` in the top layer, fixed to the viewport; stacked buttons below 600 px',
    status:
      'Need CONFIRMED (Appendix E §2.3); the product classes accepted (ADR-0001 amendment 4); the alignment mapping VD-08 / P0-15 PROVISIONAL.',
    parity:
      'Board 10 draws each dialog frame-absolute over a canvas scrim, so the dialog is compared part by part (head, effect, field, confirm, footer) and by size, including the 375 px bottom sheet; differences are registered (DEV-01, DEV-03, DEV-08; DEV-09 for the live demo width).',
    comparisons: '^10-',
  },
  {
    id: 'PF-14 · PF-15 · PF-16 · Help corrections',
    title:
      'Help & support form card, back link, empty rule; message sentence and tints; empty-state line',
    status:
      'WP-0.13 owner-authorised narrow corrections (board 07 / 08 inline styles, WP-0.6 ledger rows 10 and 42).',
    parity:
      'Compared on the built XS-07, XS-06 and PU-15 screens and the board 07/08 specimens (form, page, message, empty state, history, back links); the remaining differences there are registered for other reasons (DEV-11, DEV-12, DEV-14, DEV-19).',
    comparisons:
      '^(07-f\\d+-.*(page|form|message|reference|history|report-another|back-link|list)|08-(family-|in-context-message|f\\d+-.*message))',
  },
  {
    id: 'Canvas-only exclusions',
    title: 'Board controls, captions, annotations, presentation frames and the canvas runtime',
    status:
      'START-HERE “Not product features” and Appendix E §10 (frozen owner rules); CLAUDE.md: never copied into the product.',
    parity:
      'Never compared as product: the reference-only captures are listed in BASELINES.md; static `.is-focus` states are produced by real focus (DEV-03); presentation-frame widths and backgrounds are DEV-19 (DEV-20 asks the owner about the public background); frame min-heights become the 900 px capture height in the harness only. No canvas control or runtime code is in a product bundle (verify bundle sentinels).',
    comparisons: null,
  },
];

/**
 * What stays tracked beyond the register entries' own `tracked` items: runner portability and the
 * provisional decisions the 14 Oct 2026 closure did not decide.
 */
export const TRACKED = [
  {
    id: 'VD-18 · runner portability',
    item: 'All measurements are this machine’s (macOS, Chromium 153, local interim). On the standardized runner the 136 references, the 441 comparisons and the 64 pins (sizes, pixel counts, content fingerprints) must be re-run and re-pinned after review; DEV-05 is rechecked there.',
  },
  {
    id: 'VD-04 · B1-10 sort design',
    item: 'PROVISIONAL (PF-01): the B1-10 sort placement awaits owner visual acknowledgement on the Phase-1 screen (SA-02).',
  },
  {
    id: 'VD-08 · dialog alignment mapping',
    item: 'PROVISIONAL (PF-04 / P0-15): the `xr-x-dialog--start/--end/--decision/--marks` mapping is not decided; the dialog box itself is compared on board 10.',
  },
  {
    id: 'VD-16 · skip link',
    item: 'PROVISIONAL: skip link on every shell, focus to `main#main`; compared within tolerance on board 12.',
  },
  {
    id: 'P0-31 · Help report title',
    item: 'Phase-0 interim approved (DEV-11); the final title source stays open.',
  },
];
