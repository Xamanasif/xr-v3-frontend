import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const MY_COURSES = '/faculty/courses';
const EXPERIMENTS_TAB = '/faculty/courses?tab=experiments';
const COURSE = '/faculty/courses/{courseId}';
const EXPERIMENT = '/faculty/experiments/{experimentId}';

/**
 * Phase 4A link targets: FA-02 My courses, FA-03 Course and FA-04 Experiments (B4-02). No page
 * draws a primary action outside its failed state; "Try again" is recorded as a command, as the
 * other list pages record it. FA-03's "Students on this experiment" opens FA-20 for that
 * experiment since Phase 4B built it.
 */
export const P4_FACULTY_COURSES_LINK_TARGETS: readonly LedgerEntry[] = [
  ...pageRows('FA-02', MY_COURSES, [
    ['Section tabs', 'Courses', 'secondary', MY_COURSES, 'built', 'B4-02 f0, f2, f7 `nav.xr-tabs`'],
    [
      'Section tabs',
      'Experiments',
      'secondary',
      EXPERIMENTS_TAB,
      'built',
      'B4-02 f0, f2, f7 `nav.xr-tabs` (→ FA-04, Appendix A rule T2)',
    ],
    [
      'Course row',
      'Open course',
      'secondary',
      COURSE,
      'built',
      'B4-02 f0, f7 `a.xr-btn--secondary.xr-btn--sm` (→ FA-03)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-02.failed`'],
  ]),
  ...pageRows('FA-04', EXPERIMENTS_TAB, [
    [
      'Toolbar',
      'Search experiments · Format · Activity · Remove (chip) · Clear filters',
      'secondary',
      null,
      'in-page',
      'B4-02 f2, f3, f8 (script: chips for Format and Activity)',
      'Filters apply at once; nothing is stored.',
    ],
    [
      'Experiment row',
      '<experiment name>',
      'secondary',
      EXPERIMENT,
      'built',
      'B4-02 f2, f8 (`td a strong` → B4-03 FA-05)',
    ],
    [
      'Experiment row',
      'Open',
      'secondary',
      EXPERIMENT,
      'built',
      'B4-02 f2, f8 `a.xr-btn--secondary.xr-btn--sm` (→ B4-03 FA-05)',
    ],
    ['No match', 'Clear filters', 'secondary', null, 'in-page', 'B4-02 f3'],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'B4-02 f5'],
  ]),
  ...pageRows('FA-03', COURSE, [
    ['Back link', 'My courses', 'secondary', MY_COURSES, 'built', 'B4-02 f1 `a.xr-back`'],
    [
      'Experiment card',
      '<experiment name>',
      'secondary',
      EXPERIMENT,
      'built',
      'B4-02 f1 (`h3.xl-exp-title a` → B4-03 FA-05)',
    ],
    [
      'Experiment card',
      'Open experiment',
      'secondary',
      EXPERIMENT,
      'built',
      'B4-02 f1 `a.xr-btn--secondary` (→ B4-03 FA-05)',
    ],
    [
      'Experiment card',
      'Students on this experiment',
      'secondary',
      '/faculty/students?experimentId={experimentId}',
      'built',
      'B4-02 f1 `a.xr-btn--text` (→ B4-10 FA-20)',
      'FA-20 for that experiment (Phase 4B).',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-03.failed`'],
  ]),
];
