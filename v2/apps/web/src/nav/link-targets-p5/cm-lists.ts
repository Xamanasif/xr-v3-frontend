import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const OVERVIEW = '/content-manager';
const READY = '/content-manager/ready';
const LIBRARY = '/content-manager/library';
const LIBRARY_REVIEW = '/content-manager/library?tab=in-review';
const LIBRARY_VENDOR = '/content-manager/library?tab=with-vendor';
const LIBRARY_PUBLISHED = '/content-manager/library?tab=published';
/** The library's Published view filtered to a course (the sample's Thermodynamics stands for any). */
const LIBRARY_COURSE = '/content-manager/library?tab=published&course=thermodynamics-heat-transfer';
const UPDATES = '/content-manager/updates';
const COURSE_CODES = '/content-manager/course-codes';
/** CM-03, by submission id: the sample’s ready, re-check and returned records stand for any. */
const DECISION_READY = '/content-manager/decisions/SUB-0074';
const DECISION_NEXT = '/content-manager/decisions/SUB-0070';
const DECISION_RECHECK = '/content-manager/decisions/SUB-0071';
const DECISION_RETURNED = '/content-manager/decisions/SUB-0081';
/** CM-05, by experiment id. */
const PUBLISHED = '/content-manager/published/distillation-column';
/** CM-08, a correction’s page: the sample’s returned UPD-0006 and on-hold UPD-0004. */
const UPDATE = '/content-manager/updates/UPD-0006';
const UPDATE_WITH_OTHERS = '/content-manager/updates/UPD-0004';

/**
 * Link targets of CM-01 Overview, CM-02 Ready to publish, CM-04 Content library and CM-09 Platform
 * course codes in the owner-approved V3 Refined B export (design/v3-refined-b/roles/CM-v1
 * `LINK-MAP.json`, “CM-01 Overview”, “CM-02 Ready to publish”, “CM-04 Library · …”; the CM-09
 * controls in `Main.dc.html` `codesVM`). CM-01’s one primary is the first desk row’s gold “Open
 * decision” (the oldest ready item; with nothing ready, the first correction’s “Continue”); CM-02’s
 * is the longest wait’s “Open decision”; CM-04 draws none (each row is a link); CM-09’s is “Save
 * codes” (a command). State-copy `CM-01.row-actions`, `CM-04.address`.
 */
export const P5_CM_LISTS_LINK_TARGETS: readonly LedgerEntry[] = [
  // CM-01 Overview.
  ...pageRows('CM-01', OVERVIEW, [
    [
      'Publishing pipeline · First publication',
      'With the vendor',
      'secondary',
      LIBRARY_VENDOR,
      'built',
      'CM-v1 LINK-MAP CM-01 “1 With the vendor. Vendor revising. Open the Content library, With vendor” (`a.cm-tile-a`)',
    ],
    [
      'Publishing pipeline · First publication',
      'In academic review',
      'secondary',
      LIBRARY_REVIEW,
      'built',
      'CM-v1 LINK-MAP CM-01 “2 In academic review. Academic Reviewer. Open the Content library, In review”',
    ],
    [
      'Publishing pipeline · First publication (your step)',
      'Ready to publish',
      'secondary',
      READY,
      'built',
      'CM-v1 LINK-MAP CM-01 “3 Ready to publish. Oldest approved 14 Aug. Your step. Open Ready to publish”',
    ],
    [
      'Publishing pipeline · First publication',
      'In the catalogue',
      'secondary',
      LIBRARY_PUBLISHED,
      'built',
      'CM-v1 LINK-MAP CM-01 “12 In the catalogue. Live today. Open the Content library, Published”',
    ],
    [
      'Publishing pipeline · Corrections (each stage)',
      'Draft or returned · In academic review · Release decision · Released',
      'secondary',
      UPDATES,
      'built',
      'CM-v1 LINK-MAP CM-01 “1 Draft or returned. With you. Your step. Open Updates” … “1 Released. Live for everyone. Open Updates”',
    ],
    [
      'Needs your decision · Ready to publish (group)',
      'Open Ready to publish',
      'secondary',
      READY,
      'built',
      'CM-v1 LINK-MAP CM-01 “Open Ready to publish” (`div.rb-g-head > a.rb-link`)',
    ],
    [
      'Needs your decision (the first row: the oldest ready item, “Publish next”)',
      'Open decision',
      'primary',
      DECISION_READY,
      'built',
      'CM-v1 LINK-MAP CM-01 “Open the publication decision for Transient Cooling” (`a.rb-btn.rb-btn--primary`, the desk’s first row)',
    ],
    [
      'Needs your decision (every other ready item)',
      'Open decision',
      'secondary',
      DECISION_NEXT,
      'built',
      'CM-v1 LINK-MAP CM-01 “Open the publication decision for Packed Bed Pressure Drop” (`a.rb-btn`)',
    ],
    [
      'Needs your decision · Corrections that need you (group)',
      'Open Updates',
      'secondary',
      UPDATES,
      'built',
      'CM-v1 LINK-MAP CM-01 “Open Updates” (`div.rb-g-head > a.rb-link`)',
    ],
    [
      'Needs your decision (a returned correction or an unsent draft)',
      'Continue',
      'secondary',
      UPDATE,
      'built',
      'CM-v1 LINK-MAP CM-01 Continue (`a.rb-btn`; the gold primary only when nothing is ready), named “Continue the update to Induction Motor Loading” (the LINK-MAP’s name without its reference: state-copy `CM-lists.no-reference`)',
    ],
    [
      'Nothing waiting (calm)',
      'Open the Content library',
      'secondary',
      LIBRARY,
      'built',
      'CM-v1 Main.dc.html CM-01 calm (`a.rb-link`, `goLibrary`)',
    ],
    [
      'With others (a re-check, or a submission she sent back to its vendor)',
      'Open',
      'secondary',
      DECISION_RECHECK,
      'built',
      'CM-v1 LINK-MAP CM-01 “Open Venturi Meter Calibration” (`ul.cm-hold a.rb-link`; CM-03 read-only)',
    ],
    [
      'With others (a correction in academic review, awaiting release or on hold)',
      'Open',
      'secondary',
      UPDATE_WITH_OTHERS,
      'built',
      'CM-v1 LINK-MAP CM-01 With others Open (`ul.cm-hold a.rb-link`), named “Open the update to Boiler Drum Level” (the LINK-MAP’s name without its reference: state-copy `CM-lists.no-reference`)',
    ],
    [
      'In the catalogue (each course)',
      '<course>',
      'secondary',
      LIBRARY_COURSE,
      'built',
      'CM-v1 LINK-MAP CM-01 “Thermodynamics & Heat Transfer, 3 published experiments. Open in the Content library” (`a.cm-catlist-t`; state-copy `CM-04.address`)',
    ],
    [
      'In the catalogue',
      'Open the Content library',
      'secondary',
      LIBRARY_PUBLISHED,
      'built',
      'CM-v1 LINK-MAP CM-01 “Open the Content library” (`p.cm-sidefoot > a.rb-link`, `goLibraryPublished`)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `CM-01.failed`'],
  ]),
  // CM-02 Ready to publish.
  ...pageRows('CM-02', READY, [
    [
      'Toolbar',
      'Sort: approved, oldest first · newest first',
      'secondary',
      null,
      'in-page',
      'CM-v1 Main.dc.html CM-02 `button.rk-sortbtn` (`Q.toggleSort`; state-copy `CM-02.order`)',
    ],
    [
      'Decision card (the longest wait, “Waiting longest”)',
      'Open decision',
      'primary',
      DECISION_READY,
      'built',
      'CM-v1 LINK-MAP CM-02 “Open the publication decision for Transient Cooling” (`div.cm-qact > a.rb-btn.rb-btn--primary`)',
    ],
    [
      'Decision card (every other)',
      'Open decision',
      'secondary',
      DECISION_NEXT,
      'built',
      'CM-v1 LINK-MAP CM-02 “Open the publication decision for Packed Bed Pressure Drop” (`a.rb-btn`)',
    ],
    [
      'Empty',
      'Open the Content library',
      'secondary',
      LIBRARY,
      'built',
      'CM-v1 Main.dc.html CM-02 empty `div.rk-state a.rb-btn` (`goLibrary`)',
    ],
    [
      'Latest in the catalogue',
      'Open the Content library',
      'secondary',
      LIBRARY_PUBLISHED,
      'built',
      'CM-v1 LINK-MAP CM-02 “Open the Content library” (`p.cm-sidefoot > a.rb-link`, `goLibraryPublished`)',
    ],
    [
      'Couldn’t load',
      'Try again',
      'secondary',
      null,
      'in-page',
      'CM-v1 Main.dc.html CM-02 `button#cm-q-retry` (re-reads; focus on the title)',
    ],
  ]),
  // CM-04 Content library.
  ...pageRows('CM-04', LIBRARY, [
    [
      'View switch',
      'Ready · In review · With vendor · Published',
      'secondary',
      null,
      'in-page',
      'CM-v1 Main.dc.html CM-04 `div.rb-switch[role=group] > button[aria-pressed]` (the address follows; state-copy `CM-04.address`)',
    ],
    [
      'Toolbar',
      'Search · Course',
      'secondary',
      null,
      'in-page',
      'CM-v1 Main.dc.html CM-04 `input#cm-lib-q[type=search]`, `select#cm-lib-course` (the course in the address)',
    ],
    [
      'Toolbar status',
      'Remove filter … · Clear filters',
      'secondary',
      null,
      'in-page',
      'CM-v1 Main.dc.html CM-04 `span.rk-chip > button`, `button.rk-clear`',
    ],
    [
      'Ready row',
      '<experiment>',
      'secondary',
      DECISION_READY,
      'built',
      'CM-v1 LINK-MAP CM-04 Library · Ready (`a.rk-rowlink`, the whole row), named “Transient Cooling, ready to publish. Open the decision” (the LINK-MAP’s name without its reference: state-copy `CM-lists.no-reference`)',
    ],
    [
      'In review row',
      '<experiment>',
      'secondary',
      DECISION_RECHECK,
      'built',
      'CM-v1 LINK-MAP CM-04 Library · In review (CM-03 read-only), named “Venturi Meter Calibration, back with the academic reviewer. Open” (the LINK-MAP’s name without its reference: state-copy `CM-lists.no-reference`)',
    ],
    [
      'With vendor row',
      '<experiment>',
      'secondary',
      DECISION_RETURNED,
      'built',
      'CM-v1 Main.dc.html CM-04 With vendor row (`a.rk-rowlink`, CM-03 read-only)',
    ],
    [
      'Published row',
      '<experiment>',
      'secondary',
      PUBLISHED,
      'built',
      'CM-v1 LINK-MAP CM-04 Library · Published “Distillation Column, CHE ZG513, version 1.2, published, update awaiting release. Open the published experiment”',
    ],
    [
      'No match',
      'Clear filters',
      'secondary',
      null,
      'in-page',
      'CM-v1 Main.dc.html CM-04 no match `div.rk-state button.rb-btn` (`L.clear`)',
    ],
    [
      'Couldn’t load',
      'Try again',
      'secondary',
      null,
      'in-page',
      'CM-v1 Main.dc.html CM-04 `button#cm-lib-retry` (re-reads; focus on the title)',
    ],
  ]),
  // CM-09 Platform course codes.
  ...pageRows('CM-09', COURSE_CODES, [
    [
      'Foot',
      'Save codes',
      'primary',
      null,
      'in-page',
      'CM-v1 Main.dc.html CM-09 `div.cm-codes-foot button#cm-k-save.rb-btn--primary` (“Codes saved”, or “Check the codes”)',
    ],
    [
      'Foot',
      'Undo changes',
      'secondary',
      null,
      'in-page',
      'CM-v1 Main.dc.html CM-09 `button#cm-k-undo` (while a code is changed; waits while the codes save)',
    ],
    [
      'Check the codes',
      '<code> is already the code for <course>. Each course needs its own code.',
      'secondary',
      '#cc-code-5',
      'in-page',
      'CM-v1 Main.dc.html CM-09 `div.rk-errsum li > a` (moves focus to the row’s field)',
    ],
    [
      'We couldn’t save the codes',
      'Try again',
      'secondary',
      null,
      'in-page',
      'CM-v1 Main.dc.html CM-09 `div#cm-k-fail button.rb-btn` (`K.save`; the edits kept)',
    ],
    [
      'Couldn’t load',
      'Try again',
      'secondary',
      null,
      'in-page',
      'CM-v1 Main.dc.html CM-09 `button#cm-k-retry` (re-reads; focus on the title)',
    ],
  ]),
];
