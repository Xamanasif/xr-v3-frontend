import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const STRUCTURE = '/admin/structure';
/** SA-15, by course id: Thermodynamics & Heat Transfer stands for any course (B7-07 f3, f6). */
const COURSE = '/admin/structure/courses/thermodynamics-heat-transfer';
/** SA-15, by area id: Chemical & Process stands for any area (B7-07 f5). */
const AREA = '/admin/structure/areas/chemical-process';

/**
 * Phase 6 link targets: SA-14 Academic structure and SA-15 Area / course record (B7-07, B7-10,
 * B7-12). SA-14’s one primary is “Add course” (a DL-3 dialog, a command); its rows open SA-15.
 * SA-15 draws no primary on the page: Rename and Edit description open DL-3 dialogs, “Move to
 * another area” the inline move panel, whose buttons are commands; the back link and the crumb
 * return to Academic structure. No Retire, no artwork, no Module level (D3, BC2).
 */
export const P6_STRUCTURE_LINK_TARGETS: readonly LedgerEntry[] = [
  // SA-14 Academic structure (B7-07 f0, f7; B7-12 f12 … f15).
  ...pageRows('SA-14', STRUCTURE, [
    [
      'Page actions',
      'Add area',
      'secondary',
      null,
      'in-page',
      'B7-07 f0 `div.xr-phead-actions > button.xr-btn--secondary` → DL-3 “Add an engineering area”',
    ],
    [
      'Page actions',
      'Add course',
      'primary',
      null,
      'in-page',
      'B7-07 f0, f7 `div.xr-phead-actions > button.xr-btn--primary` → DL-3 “Add a course”',
    ],
    [
      'Each engineering area',
      'Open area',
      'secondary',
      AREA,
      'built',
      'B7-07 f0 `div.xr-section-head a.xr-btn--text.xr-btn--sm` (SA-15 area record)',
    ],
    [
      'Each course row',
      'Open',
      'secondary',
      COURSE,
      'built',
      'B7-07 f0 `li.xr-row a.xr-btn--secondary.xr-btn--sm` (SA-15 course record)',
    ],
    [
      'Dialogs (Add area, Add course)',
      'Add area · Add course · Cancel · Close',
      'secondary',
      null,
      'in-page',
      'B7-07 f7 `div.xr-dialog-foot`, `div.xr-dialog-head` (commands; Cancel and Close write nothing)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `SA-14.failed`'],
  ]),
  // SA-15 Course record (B7-07 f1 … f4, f6, f8; B7-10 f9).
  ...pageRows('SA-15', COURSE, [
    [
      'Course record — back link',
      'Academic structure',
      'secondary',
      STRUCTURE,
      'built',
      'B7-07 f1 … f4, f6, f8 `a.xr-back`',
    ],
    [
      'Course record — top-bar crumb (from 1024 px)',
      'Academic structure',
      'secondary',
      STRUCTURE,
      'built',
      'B7-07 f1, f3, f4, f6, f8 `ol.xr-crumbs`',
    ],
    [
      'Course record — actions',
      'Rename · Edit description',
      'secondary',
      null,
      'in-page',
      'B7-07 f1 `div.xw-actions > button.xr-btn--secondary` → DL-3 “Rename course” (f6), “Edit the description of …”',
    ],
    [
      'Course record — actions',
      'Move to another area',
      'secondary',
      null,
      'in-page',
      'B7-07 f1 `div.xw-actions > button.xr-btn--secondary` → the inline move panel (f3, f4)',
    ],
    [
      'Move panel — allowed',
      'Move course · Cancel',
      'secondary',
      null,
      'in-page',
      'B7-07 f4 `div.xw-inline-panel div.xw-actions` (a command; Cancel writes nothing)',
    ],
    [
      'Move panel — blocked',
      'Close',
      'secondary',
      null,
      'in-page',
      'B7-07 f3; B7-10 f9 `div.xw-inline-panel div.xw-actions` (nothing to decide)',
    ],
    [
      'Course record — dialogs (Rename, Edit description)',
      'Save name · Save description · Cancel · Close',
      'secondary',
      null,
      'in-page',
      'B7-07 f6 `div.xr-dialog-foot`, `div.xr-dialog-head` (commands; Cancel and Close write nothing)',
    ],
    [
      'Course record — failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'state-copy `SA-15.failed`',
    ],
  ]),
  // SA-15 Area record (B7-07 f5).
  ...pageRows('SA-15', AREA, [
    [
      'Area record — back link',
      'Academic structure',
      'secondary',
      STRUCTURE,
      'built',
      'B7-07 f5 `a.xr-back`',
    ],
    [
      'Area record — top-bar crumb (from 1024 px)',
      'Academic structure',
      'secondary',
      STRUCTURE,
      'built',
      'B7-07 f5 `ol.xr-crumbs`',
    ],
    [
      'Area record — actions',
      'Rename · Edit description',
      'secondary',
      null,
      'in-page',
      'B7-07 f5 `div.xw-actions > button.xr-btn--secondary` → DL-3 “Rename area”, “Edit the description of …” (no artwork, no Retire)',
    ],
    [
      'Area record — dialogs (Rename, Edit description)',
      'Save name · Save description · Cancel · Close',
      'secondary',
      null,
      'in-page',
      'B7-07 script `doRename`, `doDesc` `div.xr-dialog-foot` (commands; Cancel and Close write nothing)',
    ],
    [
      'Area record — failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'state-copy `SA-15.failed`',
    ],
  ]),
];
