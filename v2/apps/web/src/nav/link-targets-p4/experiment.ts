import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

/**
 * Link targets: FA-05 Experiment, the teaching view, as the owner-approved V3 export draws it
 * (FA-v1 LINK-MAP FA-05; `Main.dc.html` FA-05 and `asmSum`). The navy Assessment panel draws one
 * primary per state — "Mark <n> written answers" (the oldest waiting submission, FA-19) while own
 * answers wait, "Create assessment" (FA-07 with the experiment chosen) with none yet — and "Open
 * assessment" / "Continue setting up" (FA-08) as the panel's other action.
 */
export const P4_FACULTY_EXPERIMENT_LINK_TARGETS: readonly LedgerEntry[] = pageRows(
  'FA-05',
  '/faculty/experiments/{experimentId}',
  [
    [
      'Breadcrumb',
      'My courses',
      'secondary',
      '/faculty/courses',
      'built',
      'FA-v1 LINK-MAP FA-05 `nav.rk-crumbs`',
    ],
    [
      'Breadcrumb',
      '<course code>',
      'secondary',
      '/faculty/courses/{courseId}',
      'built',
      'FA-v1 LINK-MAP FA-05 “ME ZG523” `nav.rk-crumbs` (→ FA-03)',
    ],
    [
      'Student activity',
      'Students on this experiment',
      'secondary',
      '/faculty/students?experimentId={experimentId}',
      'built',
      'FA-v1 LINK-MAP FA-05 `a.rb-link` under the meters (→ FA-20)',
      'FA-20 for this experiment.',
    ],
    [
      'Assessment panel',
      '<assessment name>',
      'secondary',
      '/faculty/assessments/{assessmentId}',
      'built',
      'FA-v1 LINK-MAP FA-05 `p.fa-asm-n a.fa-exp-link` (→ FA-08)',
    ],
    [
      'Assessment panel · written answers waiting',
      'Mark <n> written answers',
      'primary',
      '/faculty/marking/{attemptId}',
      'built',
      'FA-v1 LINK-MAP FA-05 “Mark 2 written answers for …” `a.rb-btn--primary` (→ FA-19)',
      'The oldest waiting submission of the assessment (`listQueue` for it, oldest first); Marking (FA-18) for it until the queue answers.',
    ],
    [
      'Assessment panel',
      'Open assessment · Continue setting up',
      'secondary',
      '/faculty/assessments/{assessmentId}',
      'built',
      'FA-v1 LINK-MAP FA-05 “Open assessment” `a.rb-btn` (→ FA-08)',
    ],
    [
      'Assessment panel · none yet',
      'Create assessment',
      'primary',
      '/faculty/assessments/new?experimentId={experimentId}',
      'built',
      'FA-v1 LINK-MAP FA-05 (No assessment) “Create assessment” `a.rb-btn--primary` (→ FA-07)',
      'FA-07 with the experiment chosen (register: optional `?experimentId=` from FA-05).',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'state-copy `FA-05.failed`, `FA-05.assessment-states`',
    ],
  ],
);
