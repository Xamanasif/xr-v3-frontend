'use client';

/**
 * The Student's own access (ST-01 Home, ST-02 My courses, ST-03 Course, ST-05 Experiment hub and
 * its ST-19 state; boards B2-10 … B2-13), through `StudentAccessService`. The port resolves the
 * Student from the session and answers from the records: which courses and experiments are given
 * (entitlement), what the institution's access allows (pause, the plan's formats), what the
 * Student has done (runtime activity, completions) — read side by side, never one derived from
 * another (BC3). The screens render the answers; nothing here decides access.
 *
 * Every read depends on the grants and plans (SACC, ACC), the institution's pause (INST), the
 * Student's account and groups (PER, GRP), the course codes (CCODE, T-17) and the catalogue
 * (EXP, CRS), so an Institute Admin's grant, withdrawal or code — or a Super Admin's pause — in the
 * same tab refreshes them (BC14).
 */
import type {
  MyCourseRow,
  MyExperimentRow,
  ProductPorts,
  Result,
  StudentHome,
} from '@xr/contracts/draft';
import type { CourseId, ExperimentId } from '@xr/domain';

import { publicExperiment } from './catalogue';
import { defineQuery, useXrQuery } from './use-xr-query';

const ACCESS_DEPS = ['SACC', 'ACC', 'INST', 'PER', 'GRP', 'CCODE', 'EXP', 'CRS'] as const;

/** One course of the Home with the experiments the Student is shown in it (ST-03's rows). */
export interface HomeCourse {
  readonly course: MyCourseRow;
  readonly experiments: readonly MyExperimentRow[];
}

/** What the Home reads: `getMyHome`, each listed course's rows and — for an assessment item — its name. */
export interface HomeRead {
  readonly home: StudentHome;
  readonly courses: readonly HomeCourse[];
  /** The experiment each Up-next assessment belongs to, by assessment id (`listMyAssessments`). */
  readonly assessmentExperiments: Readonly<Record<string, string>>;
}

/**
 * ST-01: `getMyHome`, then `getMyCourse` for each listed course (which course an experiment is
 * in, its name and formats — the Home's card and Up next name them, B2-10), and the Student's own
 * assessments when Up next lists one (`listMyAssessments`, for its experiment's name). A course
 * that stopped being listed between the reads is left out; any other failure is the read's.
 */
export const studentHome = defineQuery({
  family: 'student',
  view: 'home',
  deps: [...ACCESS_DEPS, 'RUN', 'COMP', 'FB', 'ASMT', 'ATT'],
  read: async (ports: ProductPorts): Promise<Result<HomeRead>> => {
    const home = await ports.studentAccess.getMyHome();
    if (!home.ok) return home;
    const pages = await Promise.all(
      home.value.myCourses.map((course) => ports.studentAccess.getMyCourse(course.courseId)),
    );
    const courses: HomeCourse[] = [];
    for (const page of pages) {
      if (!page.ok && page.error.kind === 'not-found') continue;
      if (!page.ok) return page;
      courses.push({ course: page.value.course, experiments: page.value.experiments });
    }
    const assessmentExperiments: Record<string, string> = {};
    if (home.value.upNext.some((item) => item.kind === 'assessment')) {
      const mine = await ports.assessments.listMyAssessments();
      if (!mine.ok) return mine;
      for (const row of mine.value) {
        assessmentExperiments[row.assessment.id] = row.experimentName;
      }
    }
    return {
      ok: true,
      value: { home: home.value, courses, assessmentExperiments },
      changed: [],
    };
  },
});

export function useStudentHome() {
  return useXrQuery(studentHome, null);
}

/** ST-02: the courses with an experiment given to the Student, or earlier work (`listMyCourses`). */
export const myCourses = defineQuery({
  family: 'student',
  view: 'my-courses',
  deps: [...ACCESS_DEPS, 'RUN', 'COMP'],
  read: (ports: ProductPorts) => ports.studentAccess.listMyCourses(),
});

export function useMyCourses() {
  return useXrQuery(myCourses, null);
}

/** ST-03: one course and the experiments given in it (`getMyCourse`); not given → not found. */
export const myCourse = defineQuery({
  family: 'student',
  view: 'my-course',
  deps: [...ACCESS_DEPS, 'RUN', 'COMP'],
  // The address is untrusted text: existence is the adapter's answer (lenient ids).
  read: (ports: ProductPorts, courseId: string) =>
    ports.studentAccess.getMyCourse(courseId as CourseId),
});

export function useMyCourse(courseId: string) {
  return useXrQuery(myCourse, courseId);
}

/**
 * ST-05: the experiment hub (`getExperimentHub`): the published page, the Student's per-format
 * availability and progress, the resource count and the assessment. Refused (`not-given`, …) or
 * `policy-open` (OD-B2-01, OD-B2-02, GRP-05, SACC-14) is the ST-19 family.
 */
export const experimentHub = defineQuery({
  family: 'student',
  view: 'experiment-hub',
  deps: [...ACCESS_DEPS, 'AREA', 'RUN', 'COMP', 'RES', 'ASMT', 'ATT'],
  read: (ports: ProductPorts, experimentId: string) =>
    ports.studentAccess.getExperimentHub(experimentId as ExperimentId),
});

export function useExperimentHub(experimentId: string) {
  return useXrQuery(experimentHub, experimentId);
}

/**
 * ST-19 names the experiment it refuses (B2-11 f12, B2-12 f4): its published name, from the
 * public catalogue every session may read — an unknown or unpublished experiment has none (the
 * hub answers "not given" for it, so its existence is not revealed).
 */
export function usePublishedName(experimentId: string, enabled: boolean) {
  const page = useXrQuery(publicExperiment, experimentId, { enabled });
  return {
    isPending: enabled && page.isPending,
    name: page.data?.ok ? page.data.value.name : null,
  };
}
