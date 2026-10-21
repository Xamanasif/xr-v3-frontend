import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const OVERVIEW = '/reviewer';
const QUEUE = '/reviewer/queue';
const QUEUE_NEW = '/reviewer/queue?type=new';
const QUEUE_RECHECK = '/reviewer/queue?type=recheck';
const QUEUE_UPDATE = '/reviewer/queue?type=update';
/** The queue on a scope course (the sample’s CHE ZG513 stands for any). */
const QUEUE_COURSE = '/reviewer/queue?course=CHE+ZG513';
const REVIEWED = '/reviewer/reviewed';
/** RV-03 (and RV-06 once decided): the sample’s SUB-0086 stands for any submission. */
const SUBMISSION = '/reviewer/submissions/SUB-0086';
/** RV-06, the decided page, from Reviewed by me: the sample’s SUB-0081. */
const DECIDED = '/reviewer/submissions/SUB-0081';
/** RV-04 Review an update (`/reviewer/updates/[updateId]`): the sample’s UPD ids. */
const UPDATE = '/reviewer/updates/UPD-0005';
const DECIDED_UPDATE = '/reviewer/updates/UPD-0004';

/**
 * Link targets of RV-01 Overview, RV-02 Review queue and RV-05 Reviewed by me in the owner-approved
 * V3 Refined B export (design/v3-refined-b/roles/RV-v1 `LINK-MAP.json`, “RV-01 Overview”, “RV-02
 * Review queue”, “RV-05 Reviewed by me”). RV-01’s one primary is next in line’s gold “Start
 * review” (the queue’s first, whatever its kind: state-copy `RV-01.oldest`); RV-02 and RV-05 draw
 * none (each row is one link). Every update opens RV-04. No action is named by a record’s
 * reference (state-copy `RV-lists.no-reference`).
 */
export const P5_REVIEWER_LISTS_LINK_TARGETS: readonly LedgerEntry[] = [
  // RV-01 Overview.
  ...pageRows('RV-01', OVERVIEW, [
    [
      'Head',
      'Open the review queue',
      'secondary',
      QUEUE,
      'built',
      'RV-v1 LINK-MAP RV-01 “Open the review queue” (`div.rk-head-act > a.rb-btn`)',
    ],
    [
      'Next in line · waiting longest',
      'Start review',
      'primary',
      SUBMISSION,
      'built',
      'RV-v1 LINK-MAP RV-01 “Next in line: Start review (the one gold primary)” — named “Start review: <name>”; RV-03, or RV-04 for an update (state-copy `RV-01.oldest`)',
    ],
    [
      'Then, oldest first (new submission, resubmission, re-check)',
      'Review',
      'secondary',
      SUBMISSION,
      'built',
      'RV-v1 LINK-MAP RV-01 “Row: Review / Review update” (`div.rv-wl-act > a.rb-btn`, named “Review <name>”)',
    ],
    [
      'Then, oldest first (update)',
      'Review update',
      'secondary',
      UPDATE,
      'built',
      'RV-v1 LINK-MAP RV-01 “Row: Review / Review update” (named “Review the update to <name>”)',
    ],
    [
      'Nothing waiting',
      'Open Reviewed by me',
      'secondary',
      REVIEWED,
      'built',
      'RV-v1 LINK-MAP RV-01 (nothing waiting) “Open Reviewed by me” (`div.rv-calm-act > a.rb-btn`)',
    ],
    [
      'In your queue',
      'New submissions',
      'secondary',
      QUEUE_NEW,
      'built',
      'RV-v1 LINK-MAP RV-01 “In your queue: New submissions / Re-checks / Updates” (`a.rv-type`, named “New submissions: <n> items. Open them in the review queue”)',
    ],
    [
      'In your queue',
      'Re-checks',
      'secondary',
      QUEUE_RECHECK,
      'built',
      'RV-v1 LINK-MAP RV-01 “In your queue: … Re-checks …”',
    ],
    [
      'In your queue',
      'Updates',
      'secondary',
      QUEUE_UPDATE,
      'built',
      'RV-v1 LINK-MAP RV-01 “In your queue: … Updates”',
    ],
    [
      'Your review scope',
      '<course code> <course name>',
      'secondary',
      QUEUE_COURSE,
      'built',
      'RV-v1 LINK-MAP RV-01 “Your review scope: a course row” (`a.rv-course`, named “<code> <name>. Open the review queue for this course”; state-copy `RV-02.filters`)',
    ],
    [
      'Recently decided',
      'All decisions',
      'secondary',
      REVIEWED,
      'built',
      'RV-v1 LINK-MAP RV-01 “Recently decided: All decisions” (`a.rb-link`)',
    ],
    [
      'Recently decided',
      '<name>',
      'secondary',
      DECIDED,
      'built',
      'RV-v1 LINK-MAP RV-01 “Recently decided: a decision row” (`a.rv-recent-row`; RV-06, or RV-04 decided for an update)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `RV-01.failed`'],
  ]),
  // RV-02 Review queue.
  ...pageRows('RV-02', QUEUE, [
    [
      'Type tabs',
      'All · New submissions · Re-checks · Updates',
      'secondary',
      null,
      'in-page',
      'RV-v1 LINK-MAP RV-02 “Type tabs …” (the address mirrors `?type=`; state-copy `RV-02.filters`)',
    ],
    [
      'Toolbar',
      'Search the queue / Course',
      'secondary',
      null,
      'in-page',
      'RV-v1 LINK-MAP RV-02 “Search and Course filter” (the address mirrors `?course=`)',
    ],
    [
      'Toolbar status',
      'Remove filter <filter> · Clear filters',
      'secondary',
      null,
      'in-page',
      'RV-v1 LINK-MAP RV-02 “Filter chip ×”, “Clear filters (toolbar)”',
    ],
    [
      'Queue row (new submission, resubmission, re-check)',
      '<name>',
      'secondary',
      SUBMISSION,
      'built',
      'RV-v1 LINK-MAP RV-02 “Row link (item name)” (`a.rk-rowlink`, named “<name>, <type>, waiting since <date>. Review it”)',
    ],
    [
      'Queue row (update)',
      '<name>',
      'secondary',
      UPDATE,
      'built',
      'RV-v1 LINK-MAP RV-02 “Row link (item name)” — RV-04',
    ],
    [
      'No match',
      'Clear filters',
      'secondary',
      null,
      'in-page',
      'RV-v1 LINK-MAP RV-02 (no match) “Clear filters” (focus to the search)',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'RV-v1 LINK-MAP RV-02 (failed to load) “Try again” (focus to the title)',
    ],
    [
      'Nothing waiting',
      'Open Reviewed by me',
      'secondary',
      REVIEWED,
      'built',
      'RV-v1 LINK-MAP RV-02 (nothing waiting) “Open Reviewed by me”',
    ],
  ]),
  // RV-05 Reviewed by me.
  ...pageRows('RV-05', REVIEWED, [
    [
      'Show tabs',
      'All · New submissions · Updates',
      'secondary',
      null,
      'in-page',
      'RV-v1 LINK-MAP RV-05 “Tabs: All, New submissions, Updates …”',
    ],
    [
      'Toolbar',
      'Search your decisions · Remove filter <filter> · Clear filters',
      'secondary',
      null,
      'in-page',
      'RV-v1 LINK-MAP RV-05 “Search, chip ×”',
    ],
    [
      'Decision row (submission)',
      '<name>',
      'secondary',
      DECIDED,
      'built',
      'RV-v1 LINK-MAP RV-05 “Row link” (`a.rk-rowlink`, named “<name>, <decision> on <date>. Open it”; RV-06, read-only)',
    ],
    [
      'Decision row (update)',
      '<name>',
      'secondary',
      DECIDED_UPDATE,
      'built',
      'RV-v1 LINK-MAP RV-05 “Row link” — RV-04 decided, read-only',
    ],
    [
      'No match',
      'Clear filters',
      'secondary',
      null,
      'in-page',
      'RV-v1 LINK-MAP RV-05 (no match) “Clear filters”',
    ],
    [
      'Nothing decided',
      'Open the review queue',
      'secondary',
      QUEUE,
      'built',
      'RV-v1 LINK-MAP RV-05 (nothing decided) “Open the review queue”',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'RV-v1 LINK-MAP RV-05 (failed to load) “Try again” (focus to the title)',
    ],
  ]),
];
