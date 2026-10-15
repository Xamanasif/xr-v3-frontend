/**
 * The words of IA-20 Usage (board B3-10 f0 … f4), written from the facts `OperationsService.getUsage`
 * answers (per experiment × format: students with access, started, completed, sessions; the
 * "figures up to" instant) and the course and plan facts of `listContentAccess`. Every phrase is
 * the frozen board's own, found verbatim in its markup (`usage.test.ts`); what B3-10 does not word
 * is a provisional entry of the state-copy register (`state-copy-usage.ts`, VD-12). The board's
 * sample counts, course and dates are never copied: they come from the records.
 */

export const USAGE_PAGE = {
  /** `span.xr-top-title`, the crumb and the H1. */
  title: 'Usage',
  /** The segmented control's group name (`div.xr-seg[aria-label]`). */
  viewLabel: 'View',
  byExperiment: 'By experiment and format',
  byCourse: 'By course',
} as const;

/** B3-10 `div.xr-phead-meta`: "How your content is being used · figures up to 24 Oct 2026". */
export const USAGE_META = 'How your content is being used';

/** The meta line with the service's "figures up to" date ("24 Oct 2026", `copy/dates`). */
export function usageMetaLine(figuresUpTo: string): string {
  return `${USAGE_META} · figures up to ${figuresUpTo}`;
}

/** The experiment section's head (f0, f3, f4). */
export const EXPERIMENT_SECTION = {
  /** "ME ZG523 · access plan ACC-0107": the words before the plan's ID. */
  accessPlan: 'access plan',
  /** "5 students with access" after the `xl-num` count. */
  studentsWithAccess: 'students with access',
  columns: {
    format: 'Format',
    started: 'Started',
    completed: 'Completed',
    sessions: 'Sessions',
  },
} as const;

/**
 * "access plan ACC-0107". PROVISIONAL with more than one plan (`IA-20.plans-several`): "access
 * plans ACC-0107 · ACC-0212" — B3-10 draws an experiment held by one plan.
 */
export function accessPlanWords(planIds: readonly string[]): string {
  return planIds.length === 1
    ? `${EXPERIMENT_SECTION.accessPlan} ${planIds[0]}`
    : `access plans ${planIds.join(' · ')}`;
}

/**
 * The words after the count: "students with access". PROVISIONAL in the singular
 * (`IA-20.students-one`): "student with access" — B3-10 draws five.
 */
export function studentsWithAccessWords(count: number): string {
  return count === 1 ? 'student with access' : EXPERIMENT_SECTION.studentsWithAccess;
}

/** `caption.xr-sr`: "Usage by format for Shell-and-Tube Heat Exchanger". */
export function experimentTableCaption(name: string): string {
  return `Usage by format for ${name}`;
}

/** The "By course" table (f1). */
export const COURSE_TABLE = {
  caption: 'Usage by course',
  columns: {
    course: 'Course',
    experimentsGiven: 'Experiments given',
    studentsWithAccess: 'Students with access',
  },
  /**
   * PROVISIONAL (`IA-20.course-several`): a course holding more than one experiment — its students
   * with access and sessions are not added up across experiments; they are read by experiment.
   */
  perExperiment: 'Shown per experiment',
  /** PROVISIONAL (`IA-20.course-format-not-held`): the course holds no such format. */
  notHeld: '–',
} as const;

/**
 * "Sessions (WEB · VR)": the formats of the table in display order. PROVISIONAL beyond WEB · VR
 * (`IA-20.course-sessions-formats`): the formats the institution's usage rows carry.
 */
export function courseSessionsHeader(formats: readonly string[]): string {
  return `Sessions (${formats.join(' · ')})`;
}

/** "What the figures mean" (f0, f1, f3, f4): each figure defined in one line. */
export const DEFINITIONS = {
  title: 'What the figures mean',
  terms: [
    {
      term: 'Students with access',
      definition:
        'Students who can open the experiment today. Each student counts once, however they were given it.',
    },
    {
      term: 'Started',
      definition: 'Students who have opened this format at least once.',
    },
    {
      term: 'Completed',
      definition: 'Students whose format was reported completed by the simulation or the headset.',
    },
    {
      term: 'Sessions',
      definition:
        'Times the format was opened in the browser (WEB) or a session was reported from a headset (VR).',
    },
  ],
} as const;

/** "No activity yet" (f2). */
export const NO_ACTIVITY = {
  title: 'No activity yet',
  line: 'Figures appear when students open the experiments you’ve given them.',
  openStudentAccess: 'Open Student access',
} as const;
