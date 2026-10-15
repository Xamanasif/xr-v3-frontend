import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

/**
 * Phase 4A link targets: FA-01 Overview (B4-01). A reading page: every action opens the page where
 * the work is done. The board's one primary ("Mark <n> written answer") and the rows whose page is
 * Phase 4B are not rendered (DEV-21; state-copy `FA-01.not-rendered`): Phase 4A draws the scope
 * line's "My courses", the access-ended row (f3), "Open" per deadline coming up and f2's "Help".
 */
export const P4_FACULTY_OVERVIEW_LINK_TARGETS: readonly LedgerEntry[] = pageRows(
  'FA-01',
  '/faculty',
  [
    [
      'Header',
      'Mark <n> written answer',
      'primary',
      '/faculty/marking',
      'not-rendered',
      'B4-01 f0, f4 `div.xr-phead-actions > a.xr-btn--primary`',
      'FA-18 Marking is not built (Phase 4B): the action appears with it (DEV-21).',
    ],
    [
      'Header scope line',
      'My courses',
      'secondary',
      '/faculty/courses',
      'built',
      'B4-01 f0, f1, f3, f4 (`div.xr-phead-meta` link → B4-02 FA-02)',
    ],
    [
      '“Needs your attention” row (written answers to mark)',
      'Mark now',
      'secondary',
      '/faculty/marking',
      'not-rendered',
      'B4-01 f0, f4',
      'FA-18 Marking is not built (Phase 4B): the row appears with it (DEV-21).',
    ],
    [
      '“Needs your attention” row (draft questions to review)',
      'Review drafts',
      'secondary',
      '/faculty/question-bank?tab=drafts',
      'not-rendered',
      'B4-01 f0, f4 (→ B4-07 “Drafts to review”)',
      'FA-16 Draft questions with assistance is not built (no provider is named, T-23): the bank has no drafts and the service no such fact, so the row appears with it (DEV-21).',
    ],
    [
      '“Needs your attention” row (students inactive)',
      'View students',
      'secondary',
      '/faculty/students',
      'not-rendered',
      'B4-01 f0, f4',
      'FA-20 Students is not built (Phase 4B): the row appears with it (DEV-21).',
    ],
    [
      '“Needs your attention” row (access ended)',
      'My courses',
      'secondary',
      '/faculty/courses',
      'built',
      'B4-01 f3 (→ B4-02 FA-02, where the course reads “Access ended”)',
    ],
    [
      'Coming up row',
      'Open',
      'secondary',
      '/faculty/assessments/{assessmentId}',
      'built',
      'B4-01 f0, f1, f4 (→ B4-05 FA-08 Summary)',
    ],
    ['No courses yet', 'Help', 'secondary', '/faculty/help', 'built', 'B4-01 f2 `a.xr-btn--text`'],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-01.failed`'],
  ],
);
