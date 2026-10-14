// The WP-0.15 expected-deviation register (machine-readable half; `DEVIATIONS.md` is the
// reviewed text with the measured differences of the recorded run). A comparison that names an
// entry here is still made and measured; it never passes silently (parity.mjs `compareAll`).
//
// `status`:
//   'owner-approved'  — an owner decision or authorisation already covers the difference;
//   'approved-rule'   — excluded by a frozen owner rule (START-HERE "Not product features",
//                       Appendix E §10 canvas-only list), not a product choice;
//   'provisional'     — a documented provisional design choice that awaits the owner (P0-35, VD-*);
//   'owner-review'    — newly identified in WP-0.15; the owner must decide. Never approved here.
// `class` (the WP-0.15 mismatch classes): 'capture-environment' | 'fixture-state' |
//   'approved-accessibility' | 'product-regression' | 'design-conflict' | 'canvas-only' |
//   'phase-0-scope'.
// `blocksParity`: whether the entry keeps Phase-0 parity acceptance open until the owner decides.

export const DEVIATIONS = [
  {
    id: 'DEV-01',
    title:
      'Busy button look: grey (aria-disabled) in the product vs full colour (aria-busy) on Batch-0 boards',
    class: 'design-conflict',
    status: 'owner-review',
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
      'Open owner item from WP-0.13 ("Button busy = aria-disabled (WP-0.6) vs board 07 aria-busy"). No decision id.',
    proposal:
      'Owner chooses: (a) keep the product-board look (no change), or (b) the Batch-0 look — drop aria-disabled while busy (a Button change) or restore each variant colour for `.is-busy` in xr.product. Not applied.',
  },
  {
    id: 'DEV-02',
    title:
      'Read-only value: label outside the box with a lock note (board 03) vs label inside the box (product boards)',
    class: 'design-conflict',
    status: 'owner-review',
    blocksParity: false,
    boards: ['03 "Form controls · Text input" (Student ID, "Read-only · set at import")'],
    product: '@xr/ui ReadOnlyValue',
    expected:
      'Board 03: `span.xr-label` above `div.xr-ro`, the note as `xr-meta` with a 16 px lock icon.',
    actual:
      'ReadOnlyValue follows the product boards: `div.xr-ro` holding `span.xr-label` + `span.xr-ro-val` (54 drawn instances on B2/B3/B7, e.g. "Licences", "Access plan", "Moving from"); the note has no lock icon. 2 px shorter.',
    accessibility: 'None: both expose the label and the value as text.',
    decision: 'None. Board 03 vs product boards; the ledger (WP-0.6) cites 03 "Read-only".',
    proposal:
      'Owner confirms the product-board form (no change) or asks for the board-03 variant as a second ReadOnlyValue form. Phase-0 screens draw no read-only value.',
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
    status: 'owner-review',
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
      'None. Board 03 vs the product boards (Appendix E §2.5: inline styles are not copied).',
    proposal:
      'No change proposed: the product follows the drawings it will be built against. Owner acknowledgement requested; the DataTable has no column-width API (a later-phase need if a screen draws one).',
  },
  {
    id: 'DEV-05',
    title: 'Icon anti-aliasing residuals in two Batch-0 board contexts (capture environment)',
    class: 'capture-environment',
    status: 'owner-review',
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
      'None. The clock’s residual belongs to its board context (the same glyph is pixel-identical elsewhere on board 02). The triangle’s cause is not established: no other Batch-0 board draws the 20 px attention triangle to cross-check it, so "capture environment" is the likely class, not a proven one.',
    proposal:
      'No product change. Kept as registered comparisons with their measurements and content pinned (2 px, 6 px), so they stay visible and cannot grow or change; whether they vanish on the pinned runner (VD-18) is not known — the pins and the stale-entry rule will ask for review there. The warn notice’s border and padding are the shared `.xr-notice` rules, compared whole on the info, ok and err notices of the same board.',
  },
  {
    id: 'DEV-06',
    title: 'Focus ring on the navy sidebar and drawer: gold (PF-07) instead of the drawn blue',
    class: 'approved-accessibility',
    status: 'provisional',
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
      'VD-11 / register P0-17 — PROVISIONAL: Appendix E asks the owner to record the gold ring as a build correction and that record is outstanding. ADR-0001 decision 2 (gate G-3, 12 Oct 2026) lists "the gold focus ring on the navy sidebar" among the product-layer deltas, but does not decide VD-11. Not approved here.',
    proposal:
      'Owner records VD-11 (gold ring, as board 02 specifies for navy). If the drawn blue ring were chosen instead, PF-07 would be removed — a WCAG 1.4.11 failure (2.35:1), so WP-0.15 recommends the gold ring.',
  },
  {
    id: 'DEV-07',
    title: 'Rail: board 06 static `.xr-side--rail` specimen vs the live container-query rail',
    class: 'design-conflict',
    status: 'owner-review',
    blocksParity: false,
    boards: ['06 "Rail · Institute Admin · tooltip on hover and focus"'],
    product: 'WorkspaceShell rail at 1024–1279 px of app width (Sidebar in the shell)',
    expected:
      'Board 06 draws the rail with the static class `.xr-side--rail`, whose verbatim v46 rules include `.xr-side--rail .xr-nav{padding:8px 12px 0}` (nav 282 px, Help foot 81 px).',
    actual:
      'The product rail is the shell’s own: the verbatim v46 container query `@container xr-app (min-width:1024px) and (max-width:1279.98px){ .xr-shell:not(.is-expanded) > .xr-side … }`, which has no `.xr-nav` padding rule — as board 11 "1024 · Super Admin · Request decision" draws a live shell (nav 4 px taller, foot 8 px shorter). Tooltip identical.',
    accessibility: 'None: same targets, names and tooltip.',
    decision:
      'None. Two rail rule sets inside the frozen v46 stylesheet disagree; the product uses the live-shell one.',
    proposal:
      'No change proposed (a product-layer rule would contradict board 11). Owner acknowledgement requested.',
  },
  {
    id: 'DEV-08',
    title:
      'Dialog Cancel: secondary button (product boards) vs quiet text button (board 10) — VD-06',
    class: 'design-conflict',
    status: 'provisional',
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
      'VD-06 — UNRESOLVED owner decision (Appendix E §13; register P0-13). The product follows the provisional recommendation "Secondary"; WP-0.15 does not approve it.',
    proposal:
      'Owner decides VD-06. If board 10 wins, the footer Cancel becomes `variant="text"` in one place (dialog.tsx); no other change.',
  },
  {
    id: 'DEV-09',
    title:
      'DL-3 width: 520 px (board 10 state frames, v46 `.xr-dialog`) vs 440 px (board 10 live demo)',
    class: 'design-conflict',
    status: 'owner-review',
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
    decision: 'None. Board 10 against itself.',
    proposal:
      'No change proposed; owner acknowledgement requested (a product-layer width would contradict the state frames).',
  },
  {
    id: 'DEV-10',
    title:
      'Phase-0 sidebars list no destination (P0-35): Help alone, as no destination screen is built',
    class: 'phase-0-scope',
    status: 'provisional',
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
      'P0-35 (PROVISIONAL, Appendix G D.1; ADR-0005 §8, acknowledgement requested); the omitted landmark kept by the owner (WP-0.9 authorisation, 13 Oct 2026).',
    proposal: 'None: each phase adds its destinations. Owner acknowledgement of P0-35 closes it.',
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
    status: 'owner-review',
    blocksParity: true,
    boards: ['07 "State 1a · Validation"', '03 "Form controls" (summary, not compared: VD-22)'],
    product: '@xr/ui ErrorSummary (XS-07 report form)',
    expected:
      'Board 07 draws the validation summary as `div.xr-notice.xr-notice--err` with a link, held 20 px above the form by an inline `style="margin-bottom: 20px"`; board 03 draws the same notice.',
    actual:
      'The product ErrorSummary emits `xw-errsum`, as 192 summaries on 25 product boards do (Appendix E V-13), none with an inline margin; its baseline is B4-04 "Step 2 · validation" (compared in the specimen suite). In the page it sits in the `xr-stack` (24 px gap), so the 1280 frame is 4 px taller (964 → 968 px) and its sidebar with it.',
    accessibility: 'Both link to the field and take focus (VD-21).',
    decision:
      'VD-22 — UNRESOLVED owner decision (emitted class; recommendation `xw-errsum`, baseline from a linked product instance). Not approved here.',
    proposal:
      'Owner decides VD-22. If the Batch-0 form wins, ErrorSummary changes its classes in one place and the 20 px gap comes with it (a board-07-only inline style otherwise; Appendix E §2.5: inline styles are not copied).',
  },
  {
    id: 'DEV-13',
    title: 'Report detail "What you reported": canvas `doc-kv` on board 07 vs product `xl-kv`',
    class: 'design-conflict',
    status: 'owner-review',
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
    decision: 'Open owner item from WP-0.13 ("doc-kv (board 07) vs xl-kv").',
    proposal: 'No change proposed; owner decision requested with the WP-0.13 item.',
  },
  {
    id: 'DEV-14',
    title: 'Report form at 375 px: board 07 "Phone · 375" and board 11 "375 · AR-8 form" disagree',
    class: 'design-conflict',
    status: 'owner-review',
    blocksParity: false,
    boards: ['07 "Phone · 375 · Report a problem"', '11 "375 · AR-8 form"'],
    product: 'XS-07 Report a problem at 375 px (PF-14 phone rule)',
    expected:
      'Board 07 m1: the 1280 frame’s words and layout at 375 (all three hints, 24 px card padding, "Send report" at its own width). Board 11 m-form: 20 px card padding, "Send report" growing (`flex: 1 1 160px`), and no hint under "Where did it happen?" or "Screenshot".',
    actual:
      'The product takes board 07’s words (all hints) and board 11’s phone layout (PF-14, WP-0.13 "followed 11"): 8 px shorter than board 07 m1 (padding and button) and 76 px taller than board 11 m-form (the two hints board 11 leaves out).',
    accessibility: 'None.',
    decision: 'Open owner item from WP-0.13 ("board 07 m1 vs board 11 at 375 (followed 11)").',
    proposal: 'No change proposed; owner decision requested with the WP-0.13 item.',
  },
  {
    id: 'DEV-15',
    title: 'Help & support lead sentence: board 05 vs board 07 words',
    class: 'design-conflict',
    status: 'owner-review',
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
    decision: 'None. Board 05 vs board 07.',
    proposal: 'No change proposed; owner confirms board 07’s words.',
  },
  {
    id: 'DEV-16',
    title:
      'MessagePage has no amber (paused) icon tint for the later-phase "Access paused" message',
    class: 'phase-0-scope',
    status: 'owner-review',
    blocksParity: false,
    boards: ['08 "The family" — "Access paused" (XS-08 · ST-19)'],
    product: '@xr/ui MessagePage (tones: neutral, ok)',
    expected:
      'Board 08 tints the "Access paused" icon circle amber (#FBF3E0 / #8A5A05), the waiting tone.',
    actual:
      'MessagePage (WP-0.6) draws the neutral and success tints only; the paused message is a Phase-2 screen (ST-19), so no Phase-0 screen needs it. The other seven family messages match.',
    accessibility: 'None: the words carry the meaning.',
    decision: 'None.',
    proposal:
      'Add a `warn` tone to MessagePage when the ST-19 / XS-08 message screens are built (Phase 2); no Phase-0 change.',
  },
  {
    id: 'DEV-17',
    title: 'Board 07 draws its sidebars without count badges',
    class: 'design-conflict',
    status: 'owner-review',
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
    decision: 'None. Board 07 vs boards 05/06/11.',
    proposal: 'No change proposed; owner acknowledgement requested.',
  },
  {
    id: 'DEV-18',
    title:
      'Success notice icon: Done tick (product boards) vs Reviewed-by-me circle tick (Batch-0 boards)',
    class: 'design-conflict',
    status: 'owner-review',
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
    decision: 'None. Batch-0 boards vs the product boards.',
    proposal:
      'No change proposed: the product follows the 241 product-board drawings. Owner acknowledgement requested.',
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
    status: 'owner-review',
    blocksParity: false,
    boards: ['08 "The family" — "Page not found · public" (PU-15)'],
    product: 'PU-15 public message page (apps/web root not-found, public shell `.xp`)',
    expected:
      'Board 08 — the only drawing of the public PU-15 — shows it in the family template’s frame painted #F4F5FB by an inline style, under a placeholder strip ("Public header · Batch 1").',
    actual:
      'The product page sits on the public shell’s white (`.xp{background:#FFFFFF}`, xr-public.css, as every `xp` page of the product boards); measured in the captures: #F4F5FB on the board, #FFFFFF on the product around the icon, title, sentence and actions. The 0.1 comparator threshold does not separate the two (about 4 % luminance), so no comparison fails on it — this entry records it so the threshold does not hide it.',
    accessibility: 'None: the text contrast is higher on white.',
    decision:
      'None. Board 08’s background belongs to the family template’s frame (canvas) and the white to the public shell, but no drawing shows PU-15 inside the public shell, so the owner confirms.',
    proposal: 'No change proposed; owner acknowledgement requested.',
  },
];

export const DEVIATION_BY_ID = new Map(DEVIATIONS.map((entry) => [entry.id, entry]));

/**
 * The corrections decided before WP-0.15 and the canvas-only exclusions, and how the parity run
 * treats each (owner list of the WP-0.15 authorisation). `status` repeats the decision record
 * word for word in substance — WP-0.15 approves none of them. `comparisons` (a RegExp source)
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
    status: 'VD-11 / P0-17 PROVISIONAL (see DEV-06).',
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
