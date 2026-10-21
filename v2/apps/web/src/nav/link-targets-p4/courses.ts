import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const MY_COURSES = '/faculty/courses';
const EXPERIMENTS_TAB = '/faculty/courses?tab=experiments';
const COURSE = '/faculty/courses/{courseId}';
const EXPERIMENT = '/faculty/experiments/{experimentId}';

/**
 * Link targets: FA-02 My courses, FA-04 Experiments and FA-03 Course, as the owner-approved V3
 * export draws them (FA-v1 LINK-MAP FA-02, FA-03, FA-04; `Main.dc.html`). FA-02 and FA-04 draw no
 * primary; FA-03's experiment panels draw "Mark <n> written answers" (the oldest waiting
 * submission, FA-19) or "Create assessment" (FA-07) as each Assessment column's primary. "Try
 * again" is recorded as a command, as the other list pages record it.
 */
export const P4_FACULTY_COURSES_LINK_TARGETS: readonly LedgerEntry[] = [
  ...pageRows('FA-02', MY_COURSES, [
    ['Tabs', 'Courses', 'secondary', MY_COURSES, 'built', 'FA-v1 LINK-MAP FA-02 `nav.rk-tabs`'],
    [
      'Tabs',
      'Experiments',
      'secondary',
      EXPERIMENTS_TAB,
      'built',
      'FA-v1 LINK-MAP FA-02 `nav.rk-tabs` (→ FA-04, Appendix A rule T2)',
    ],
    [
      'Course ledger · course head',
      'Open course',
      'secondary',
      COURSE,
      'built',
      'FA-v1 LINK-MAP FA-02 “Open course ME ZG523 …” `a.rb-btn` (→ FA-03)',
    ],
    [
      'Course ledger · experiment row',
      '<experiment name>',
      'secondary',
      EXPERIMENT,
      'built',
      'FA-v1 LINK-MAP FA-02 `a.fa-exp-link` (→ FA-05)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-02.failed`'],
  ]),
  ...pageRows('FA-04', EXPERIMENTS_TAB, [
    [
      'Toolbar',
      'Search · Format · Student activity · Remove filter (chip) · Clear filters',
      'secondary',
      null,
      'in-page',
      'FA-v1 Main.dc.html FA-04 (`vmCourses`: chips for search, format and activity)',
      'Filters apply at once; nothing is stored.',
    ],
    [
      'Experiment row',
      '<experiment name>',
      'secondary',
      EXPERIMENT,
      'built',
      'FA-v1 LINK-MAP FA-04 “Open Shell-and-Tube Heat Exchanger” `a.rk-rowlink` (the row press follows it; → FA-05)',
    ],
    [
      'No match',
      'Clear filters',
      'secondary',
      null,
      'in-page',
      'FA-v1 Main.dc.html FA-04 `div.rk-state`',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'FA-v1 Main.dc.html FA-04 `div.rk-state[role=alert]`',
    ],
  ]),
  ...pageRows('FA-03', COURSE, [
    [
      'Breadcrumb',
      'My courses',
      'secondary',
      MY_COURSES,
      'built',
      'FA-v1 LINK-MAP FA-03 `nav.rk-crumbs`',
    ],
    [
      'Experiment panel',
      'Open experiment',
      'secondary',
      EXPERIMENT,
      'built',
      'FA-v1 LINK-MAP FA-03 “Open experiment Shell-and-Tube Heat Exchanger” `a.rb-btn` (→ FA-05)',
    ],
    [
      'Experiment panel · Student activity',
      'Students on this experiment',
      'secondary',
      '/faculty/students?experimentId={experimentId}',
      'built',
      'FA-v1 LINK-MAP FA-03 `a.rb-link` (→ FA-20)',
      'FA-20 for that experiment.',
    ],
    [
      'Experiment panel · Assessment',
      'Mark <n> written answers',
      'primary',
      '/faculty/marking/{attemptId}',
      'built',
      'FA-v1 LINK-MAP FA-03 “Mark 2 written answers for …” `a.rb-btn--primary` (→ FA-19)',
      'The oldest waiting submission of that assessment (one marking-queue read for the page); Marking (FA-18) for it until the queue answers.',
    ],
    [
      'Experiment panel · Assessment',
      'Open assessment · Continue setting up',
      'secondary',
      '/faculty/assessments/{assessmentId}',
      'built',
      'FA-v1 LINK-MAP FA-03 “Open assessment” `a.rb-btn` (→ FA-08)',
    ],
    [
      'Experiment panel · no assessment yet',
      'Create assessment',
      'primary',
      '/faculty/assessments/new?experimentId={experimentId}',
      'built',
      'FA-v1 LINK-MAP FA-03 (No assessment) “Create assessment” `a.rb-btn--primary` (→ FA-07)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-03.failed`'],
  ]),
];
