// The Phase-0 baseline inventory (WP-0.15; Appendix F §7.5 "Phase-0 baselines"; Appendix E §9.1):
// the Batch-0 specimen boards 01–08, 10, 11, 12 (direct enumeration: they are not in
// frame-index.json), board 05's role × banner canvas states, and the linked ErrorSummary instance
// of B4-04. Sign-in (B1-09, XS-01/03/04) stays in Phase 1 (owner decision G-8).
//
// `frames` = `.doc-frame` elements, `sections` = `section.doc-sec` elements, counted on the
// rendered board (enumerateBatch0) and pinned here; the reference suite fails on any other count.
// `width` is the board page's own layout width (its `.doc` / `$preview` width).

export const BATCH0_BOARDS = [
  { id: '01', file: '01-Visual-Foundation.dc.html', width: 1440, frames: 0, sections: 5 },
  { id: '02', file: '02-Tokens-Typography.dc.html', width: 1440, frames: 0, sections: 7 },
  { id: '03', file: '03-Core-Components.dc.html', width: 1440, frames: 5, sections: 9 },
  { id: '04', file: '04-Status-Format-States.dc.html', width: 1440, frames: 0, sections: 4 },
  // Board 05 is one shell page driven by canvas props: its frames are the prop states below.
  { id: '05', file: '05-Workspace-Shell.dc.html', width: 1440, frames: 0, sections: 0 },
  { id: '06', file: '06-Sidebar-Variants.dc.html', width: 2080, frames: 5, sections: 5 },
  { id: '07', file: '07-Help-Support.dc.html', width: 2752, frames: 10, sections: 1 },
  { id: '08', file: '08-System-Messages.dc.html', width: 1440, frames: 10, sections: 4 },
  { id: '10', file: '10-Dialogs.dc.html', width: 1440, frames: 7, sections: 4 },
  { id: '11', file: '11-Responsive-Proof.dc.html', width: 2720, frames: 13, sections: 5 },
  { id: '12', file: '12-Accessibility-Motion.dc.html', width: 1440, frames: 1, sections: 5 },
];

/** Board 05's canvas props (its `data-props`): every role × banner, captured at 1440 × 900. */
export const BOARD_05_ROLES = [
  'Student',
  'Faculty',
  'Institute Admin',
  'Vendor',
  'Academic Reviewer',
  'Content Manager',
  'Super Admin',
];
export const BOARD_05_BANNERS = ['None', 'Institution paused', 'Account inactive'];

/**
 * The banners each role can be shown (domain `shellBanner`, XS-08): paused for the institution
 * roles, inactive for a Student. The other canvas combinations are captured, not compared.
 */
export const BOARD_05_APPLICABLE = {
  Student: ['None', 'Institution paused', 'Account inactive'],
  Faculty: ['None', 'Institution paused'],
  'Institute Admin': ['None', 'Institution paused'],
  Vendor: ['None'],
  'Academic Reviewer': ['None'],
  'Content Manager': ['None'],
  'Super Admin': ['None'],
};

/** The linked ErrorSummary product instance (VD-22): B4-04 frame 3 of the 12 indexed frames. */
export const LINKED_ERROR_SUMMARY = {
  file: 'B4-04-Assessments-and-Create.dc.html',
  frames: 12,
  frame: 3,
  caption: 'Step 2 · validation',
};

/**
 * The reference captures one complete run writes (`board-references/`): every Batch-0 frame and
 * section, board 05's 21 role × banner states plus its 7 open account menus and 7 Help states, and
 * the B4-04 summary — 136. `pnpm verify` fails on any other count.
 */
export const EXPECTED_REFERENCES =
  BATCH0_BOARDS.reduce((total, board) => total + board.frames + board.sections, 0) +
  BOARD_05_ROLES.length * BOARD_05_BANNERS.length +
  BOARD_05_ROLES.length * 2 +
  1;
