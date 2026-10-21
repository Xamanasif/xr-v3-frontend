import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

/**
 * Link targets: FA-01 Overview, as the owner-approved V3 export draws it (FA-v1 LINK-MAP FA-01;
 * `Main.dc.html` FA-01 and `vmOverview`). A reading page: every action opens the page where the work
 * is done. The priority band's "Mark now" (its one primary) opens the oldest waiting submission
 * (FA-19; FA-18 until the queue answers), "View students" Students (FA-20) for the inactive
 * Students' experiment; "Get your course ready" (a new teacher) opens FA-15, FA-07 and FA-05; the
 * drafts item stays undrawn: the service has no such fact.
 */
export const P4_FACULTY_OVERVIEW_LINK_TARGETS: readonly LedgerEntry[] = pageRows(
  'FA-01',
  '/faculty',
  [
    [
      'Needs your attention · written answers to mark',
      'Mark now',
      'primary',
      '/faculty/marking/{attemptId}',
      'built',
      'FA-v1 LINK-MAP FA-01 “Mark now” → FA-19 (the oldest waiting submission)',
      'The oldest waiting submission from the marking queue (oldest first); Marking (FA-18) until the queue answers.',
    ],
    [
      'Needs your attention · draft questions to review',
      'Review drafts',
      'secondary',
      '/faculty/question-bank?tab=drafts',
      'not-rendered',
      'FA-v1 LINK-MAP FA-01 “Review drafts” → FA-14 Drafts to review',
      'Not drawn: the overview service has no drafts fact (contract `facultyAttention`, PC-51). FA-16 and the bank’s Drafts tab are built; the item appears once the service names drafts waiting for review (T-23).',
    ],
    [
      'Needs your attention · students to follow up',
      'View students',
      'secondary',
      '/faculty/students?experimentId={experimentId}',
      'built',
      'FA-v1 LINK-MAP FA-01 “View students” → FA-20',
      'FA-20 for the first experiment the inactive-Students facts name.',
    ],
    [
      'Needs your attention · course access ended',
      'My courses',
      'secondary',
      '/faculty/courses',
      'built',
      'B4-01 f3 (a product state the FA-v1 export does not draw; state-copy `FA-01.access-ended-kind`)',
    ],
    [
      'Coming up',
      '<assessment name>',
      'secondary',
      '/faculty/assessments/{assessmentId}',
      'built',
      'FA-v1 LINK-MAP FA-01 Coming up → FA-08 Summary',
    ],
    [
      'Your teaching',
      'Open course',
      'secondary',
      '/faculty/courses/{courseId}',
      'built',
      'FA-v1 LINK-MAP FA-01 “Open course” → FA-03',
    ],
    [
      'Your teaching',
      '<experiment name>',
      'secondary',
      '/faculty/experiments/{experimentId}',
      'built',
      'FA-v1 LINK-MAP FA-01 experiment name → FA-05',
    ],
    [
      'Get your course ready',
      'Add a question',
      'primary',
      '/faculty/question-bank/new?experimentId={experimentId}',
      'built',
      'FA-v1 LINK-MAP FA-01 (new teacher) “Add a question” → FA-15',
    ],
    [
      'Get your course ready',
      'Create assessment',
      'secondary',
      '/faculty/assessments/new?experimentId={experimentId}',
      'built',
      'FA-v1 LINK-MAP FA-01 (new teacher) “Create assessment” → FA-07',
    ],
    [
      'Get your course ready',
      'Open experiment',
      'secondary',
      '/faculty/experiments/{experimentId}',
      'built',
      'FA-v1 LINK-MAP FA-01 (new teacher) “Open experiment” → FA-05',
    ],
    [
      'No courses yet',
      'Help & support',
      'secondary',
      '/faculty/help',
      'built',
      'FA-v1 LINK-MAP FA-01 (no courses) “Help & support” → XS-07',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-01.failed`'],
  ],
);
