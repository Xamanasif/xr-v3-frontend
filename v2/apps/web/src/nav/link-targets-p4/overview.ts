import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

/**
 * Phase 4A link targets: FA-01 Overview (B4-01). A reading page: every action opens the page where
 * the work is done. Phase 4A drew the scope line's "My courses", the access-ended row (f3), "Open"
 * per deadline coming up and f2's "Help"; Phase 4B renders the board's one primary ("Mark <n>
 * written answer") and the rows' "Mark now" (FA-18) and "View students" (FA-20) (state-copy
 * `FA-01.phase-4b-actions`). The draft-questions row stays undrawn: the service has no such fact.
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
      'built',
      'B4-01 f0, f4 `div.xr-phead-actions > a.xr-btn--primary` (→ B4-09 FA-18; shown while a written answer waits)',
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
      '/faculty/marking?assessmentId={assessmentId}',
      'built',
      'B4-01 f0, f4 (→ B4-09 FA-18, for the row’s assessment)',
    ],
    [
      '“Needs your attention” row (draft questions to review)',
      'Review drafts',
      'secondary',
      '/faculty/question-bank?tab=drafts',
      'not-rendered',
      'B4-01 f0, f4 (→ B4-07 “Drafts to review”)',
      'Not drawn: the overview service has no drafts fact (contract `facultyAttention`, PC-51). Phase 4B built FA-16 and the bank’s Drafts tab; the row appears once the service names drafts waiting for review (DEV-21; T-23).',
    ],
    [
      '“Needs your attention” row (students inactive)',
      'View students',
      'secondary',
      '/faculty/students?experimentId={experimentId}',
      'built',
      'B4-01 f0, f4 (→ B4-10 FA-20, for the row’s experiment)',
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
