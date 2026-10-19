import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const STRUCTURE = '/admin/structure';
/** SA-15, by course id: Thermodynamics & Heat Transfer stands for any course. */
const COURSE = '/admin/structure/courses/thermodynamics-heat-transfer';
/** SA-15, by area id: Chemical & Process stands for any area. */
const AREA = '/admin/structure/areas/chemical-process';
/** SA-07 and SA-17 from “What uses this course”: an institution, a Vendor holder. */
const INSTITUTION = '/admin/institutions/{institutionId}';
const VENDOR = '/admin/roles/role-anil-shetty';

/**
 * SA-14 Academic structure and SA-15 Area / course record in the owner-approved V3 design (SA-v1
 * LINK-MAP; `sa-views-c.js` `V.structure`, `V.area`, `V.course`). SA-14's head holds Add area and
 * Add course (navy; each opens its dialog, whose confirm is a command); every area's “Open area”
 * opens its record, every course row (named by its content) the course's. SA-15's crumbs return
 * to Academic structure and the area; the course page's panel “Change this course” holds Rename,
 * Edit description and Move to another area (dialogs, commands); “What uses this course” links
 * each institution (SA-07) and Vendor holder (SA-17). No Retire, no artwork, no Module level, no
 * platform code edit (D3, BC2, M-2).
 */
export const P6_STRUCTURE_LINK_TARGETS: readonly LedgerEntry[] = [
  // SA-14 Academic structure (`V.structure`).
  ...pageRows('SA-14', STRUCTURE, [
    [
      'Page head',
      'Add area',
      'secondary',
      null,
      'in-page',
      'SA-v1 `V.structure` `div.rk-head-act > button.rb-btn` → `SA.DLG.area` “Add an engineering area”',
    ],
    [
      'Page head',
      'Add course',
      'primary',
      null,
      'in-page',
      'SA-v1 `V.structure` `div.rk-head-act > button.rb-btn--navy` → `SA.DLG.course` “Add a course”',
    ],
    [
      'Each engineering area',
      'Open area',
      'secondary',
      AREA,
      'built',
      'SA-v1 LINK-MAP SA-14 → SA-15 “Open the area …” (`div.rk-course-h > a.rb-link`; named “Open area <area>”, state-copy `SA-14.open-area-name`)',
    ],
    [
      'Each course row',
      '<course name, platform code, published experiments>',
      'secondary',
      COURSE,
      'built',
      'SA-v1 LINK-MAP SA-14 → SA-15 “Thermodynamics & Heat TransferME ZG5234 published experiments” (`ul.sa-list > a.sa-list-row`)',
    ],
    [
      'Dialogs (Add area, Add course)',
      'Add area · Add course · Cancel',
      'secondary',
      null,
      'in-page',
      'SA-v1 `sa-core.js` `dialogHtml` `div.rk-dlg-foot` (commands; Cancel and Esc write nothing)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `SA-14.failed`'],
  ]),
  // SA-15 Course record (`V.course`).
  ...pageRows('SA-15', COURSE, [
    [
      'Course record — breadcrumb',
      'Academic structure',
      'secondary',
      STRUCTURE,
      'built',
      'SA-v1 LINK-MAP SA-15 → SA-14 (`nav.rk-crumbs`)',
    ],
    [
      'Course record — breadcrumb',
      '<area name>',
      'secondary',
      '/admin/structure/areas/{areaId}',
      'built',
      'SA-v1 LINK-MAP SA-15 course → SA-15 area “Mechanical & Manufacturing” (`nav.rk-crumbs`)',
    ],
    [
      'Course record — Course › Engineering area',
      '<area name>',
      'secondary',
      '/admin/structure/areas/{areaId}',
      'built',
      'SA-v1 `V.course` `dl.rk-dl` “Engineering area” (`dd > a`)',
    ],
    [
      'Course record — What uses this course › Institutions',
      '<institution name>',
      'secondary',
      INSTITUTION,
      'built',
      'SA-v1 LINK-MAP SA-15 → SA-07 “Godavari Institute of Technology” (`dd > a`; state-copy `SA-15.uses.institutions`)',
    ],
    [
      'Course record — What uses this course › Vendors in scope',
      '<holder name>',
      'secondary',
      VENDOR,
      'built',
      'SA-v1 LINK-MAP SA-15 → SA-17 “Anil Shetty” (`dd > a`; state-copy `SA-15.uses.vendors`)',
    ],
    [
      'Course record — head (under 860 px)',
      'Go to changes',
      'secondary',
      '#structure-course-panel',
      'in-page',
      'SA-v1 LINK-MAP SA-15 “Go to changes” → #co-panel (`a.rb-btn.rk-goto`)',
    ],
    [
      'Course record — Change this course',
      'Rename · Edit description',
      'secondary',
      null,
      'in-page',
      'SA-v1 `V.course` `div.sa-act > button.rb-btn` → `SA.DLG.course` rename, desc',
    ],
    [
      'Course record — Change this course › Move to another area (nobody filed)',
      'Move to another area',
      'secondary',
      null,
      'in-page',
      'SA-v1 `V.course` `div.sa-act > button.rb-btn` → `SA.DLG.course` move; blocked while people are filed (`rk-notice--off`, no button; state-copy `SA-15.move-rule`)',
    ],
    [
      'Course record — dialogs (Rename, Edit description, Move)',
      'Save name · Save description · Move course · Cancel',
      'secondary',
      null,
      'in-page',
      'SA-v1 `sa-core.js` `dialogHtml` `div.rk-dlg-foot` (commands; Cancel and Esc write nothing)',
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
  // SA-15 Area record (`V.area`).
  ...pageRows('SA-15', AREA, [
    [
      'Area record — breadcrumb',
      'Academic structure',
      'secondary',
      STRUCTURE,
      'built',
      'SA-v1 LINK-MAP SA-15 → SA-14 (`nav.rk-crumbs`)',
    ],
    [
      'Area record — head',
      'Rename · Edit description',
      'secondary',
      null,
      'in-page',
      'SA-v1 `V.area` `div.rk-head-act > button.rb-btn` → `SA.DLG.area` rename, desc (no artwork, no Retire)',
    ],
    [
      'Area record — Courses',
      'Add course',
      'secondary',
      null,
      'in-page',
      'SA-v1 `V.area` `div.rk-sec-h > button.rb-btn--ghost` → `SA.DLG.course` add, this area chosen',
    ],
    [
      'Area record — each course row',
      '<course name, platform code>',
      'secondary',
      COURSE,
      'built',
      'SA-v1 LINK-MAP SA-15 area → SA-15 course “Thermodynamics & Heat TransferME ZG523” (`ul.sa-list > a.sa-list-row`)',
    ],
    [
      'Area record — dialogs (Rename, Edit description, Add course)',
      'Save name · Save description · Add course · Cancel',
      'secondary',
      null,
      'in-page',
      'SA-v1 `sa-core.js` `dialogHtml` `div.rk-dlg-foot` (commands; Cancel and Esc write nothing)',
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
