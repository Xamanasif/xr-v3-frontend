'use client';

import type { FormatCode } from '@xr/ui';
import {
  Button,
  ContentStack,
  FaCourseCard,
  FaCourseCount,
  FaCourseFoot,
  FaCourseLedger,
  FaCourseRow,
  FaFigure,
  FaFigures,
  FaFormatBadges,
  FaMessageCard,
  FaWaitLine,
  HiddenHeading,
  LinkTabs,
  ListState,
  LoadingRows,
  PageHead,
  StatusPill,
} from '@xr/ui/v3';
import { type RefObject, useEffect, useRef } from 'react';

import { FACULTY_FAILED_WORDS } from '@/copy/fa-shared';
import { courseCountWords, MY_COURSES_PAGE } from '@/copy/faculty-courses';
import { formatsHeldLabel } from '@/copy/faculty-overview';
import { stateWords } from '@/copy/state-copy';
import {
  FACULTY_EXPERIMENTS_ADDRESS,
  FACULTY_MY_COURSES_ADDRESS,
  FACULTY_MY_COURSES_TITLE,
  facultyExperimentsPlacement,
  facultyMyCoursesPlacement,
  MY_COURSES_TABS,
} from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { useSession } from '@/queries/session';
import { useTeachingCourses } from '@/queries/teaching';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { useFacultyToday } from '../shared/use-today';
import { FacultyExperiments } from '../fa-04-experiments/experiments';
import { useTaughtExperiments } from '../fa-04-experiments/taught-experiments';
import { ledgerViews } from './courses-view';

const TITLE_ID = 'fa-h1';

/**
 * FA-02 My courses — the V3 Refined B design (the owner-approved export design/v3-refined-b/roles/
 * FA-v1, `Main.dc.html` FA-02 · FA-04 and its `vmCourses`), at `/faculty/courses`, with its
 * Experiments tab FA-04 (`?tab=experiments`; any other `tab` is normalised to the bare address,
 * `FA-02.tab-address`).
 *
 * - **Reads**: `TeachingService.listMyCourses` — the courses the Institute Admin's Faculty courses
 *   (IA-15) map to the Faculty member and the institution's plans hold, with the experiments, the
 *   Students who can open them and the assessments, and the date access ended once it has — and
 *   the taught experiments (`useTaughtExperiments`: `getCreateOptions`, `listAssessments`, each
 *   experiment's `getTeachingExperiment`) for the ledger's experiment rows.
 * - **As the export draws it**: the date, "My courses" and its line; the tabs "Courses ·
 *   Experiments" (links); the course ledger — the count, one card per course with its code, name,
 *   source, figures and "Open course" (FA-03), then its experiments (formats, Students with
 *   access, the assessment's status, name, deadline and written answers waiting) — and the foot
 *   line. No course: the message card under the tabs (the Experiments tab draws its own).
 * - **Loading and failed** (the export draws none for this tab): the application's loading and the
 *   failed state with Try again, which reads again and moves focus to the title (`FA-02.loading`,
 *   `FA-02.failed`). A course whose access ended says so in place of its source line (f7).
 */
export function FacultyMyCourses() {
  const navigation = useAppNavigation();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const tabParam = new URLSearchParams(navigation.search).get('tab');
  const experiments = tabParam === 'experiments';
  // Any other tab is the bare address.
  const normalise = tabParam !== null && !experiments;
  useEffect(() => {
    if (normalise) navigation.replace(FACULTY_MY_COURSES_ADDRESS);
  }, [normalise, navigation]);
  useShellPage(experiments ? facultyExperimentsPlacement() : facultyMyCoursesPlacement());
  const date = useFacultyToday()?.line;

  return (
    <>
      <PageHead
        title={FACULTY_MY_COURSES_TITLE}
        titleId={TITLE_ID}
        titleRef={titleRef}
        titleFocusTarget
        date={date}
        lead={MY_COURSES_PAGE.lead}
      />
      <ContentStack>
        <LinkTabs
          label={MY_COURSES_PAGE.tabsLabel}
          tabs={[
            { href: FACULTY_MY_COURSES_ADDRESS, label: MY_COURSES_TABS[0], current: !experiments },
            { href: FACULTY_EXPERIMENTS_ADDRESS, label: MY_COURSES_TABS[1], current: experiments },
          ]}
        />
        {experiments ? <FacultyExperiments /> : <CoursesTab titleRef={titleRef} />}
      </ContentStack>
    </>
  );
}

/** FA-02's own tab: the course ledger, no course, loading and failed. */
function CoursesTab({ titleRef }: { readonly titleRef: RefObject<HTMLHeadingElement | null> }) {
  const read = useTeachingCourses();
  const { read: taught, probes } = useTaughtExperiments();
  const session = useSession();
  const me = session.status === 'signed-in' ? session.personId : null;
  const courses = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  // With no course, the taught experiments are not needed to say so.
  const taughtFailed = taught.kind === 'failed' && courses !== null && courses.length > 0;
  const ready = courses !== null && (courses.length === 0 || taught.kind === 'ready');

  // Try again moves focus to the title, and keeps it there once the courses are back.
  const refocus = useRef(false);
  useEffect(() => {
    if (!ready || !refocus.current) return;
    refocus.current = false;
    titleRef.current?.focus();
  }, [ready, titleRef]);

  if (failed || taughtFailed) {
    return (
      <>
        {probes}
        <ListState
          kind="failed"
          titleAs="h2"
          title={stateWords('FA-02.failed')}
          action={
            <Button
              onClick={() => {
                if (failed) void read.refetch();
                if (taught.kind === 'failed') taught.retry();
                refocus.current = true;
                titleRef.current?.focus();
              }}
            >
              {FACULTY_FAILED_WORDS.tryAgain}
            </Button>
          }
        >
          {FACULTY_FAILED_WORDS.line}
        </ListState>
      </>
    );
  }
  if (!ready || courses === null) {
    return (
      <>
        {probes}
        <LoadingRows message={stateWords('FA-02.loading')} cells={[2, 1, 2]} />
      </>
    );
  }
  if (courses.length === 0) {
    return (
      <>
        {probes}
        <FaMessageCard icon="book" title={MY_COURSES_PAGE.noneAssignedTitle} titleId="fa-crs-none">
          {MY_COURSES_PAGE.noneAssignedLine}
        </FaMessageCard>
      </>
    );
  }

  const ledger = ledgerViews(courses, taught.kind === 'ready' ? taught.experiments : [], me);
  const experiments = courses.reduce((sum, row) => sum + row.experiments, 0);
  return (
    <>
      {probes}
      <HiddenHeading id="fa-crs-h">{MY_COURSES_PAGE.coursesHeading}</HiddenHeading>
      <FaCourseCount>{courseCountWords(courses.length, experiments)}</FaCourseCount>
      <FaCourseLedger>
        {ledger.map((course) => (
          <FaCourseCard
            key={course.courseId}
            code={course.code ?? undefined}
            title={course.name}
            titleId={`fa-c-${course.courseId}`}
            source={course.source}
            figures={
              <FaFigures>
                <FaFigure
                  term={MY_COURSES_PAGE.figures.experiments}
                  value={course.figures.experiments}
                />
                <FaFigure term={MY_COURSES_PAGE.figures.students} value={course.figures.students} />
                <FaFigure
                  term={MY_COURSES_PAGE.figures.assessments}
                  value={course.figures.assessments}
                />
              </FaFigures>
            }
            open={{
              href: course.href,
              label: MY_COURSES_PAGE.openCourse,
              accessibleName: course.openLabel,
            }}
            columns={[
              MY_COURSES_PAGE.columns.experiment,
              MY_COURSES_PAGE.columns.students,
              MY_COURSES_PAGE.columns.assessment,
            ]}
            listLabel={course.listLabel}
          >
            {course.rows.map((row) => (
              <FaCourseRow
                key={row.experimentId}
                title={row.name}
                href={row.href}
                formats={
                  <FaFormatBadges
                    formats={row.formats as FormatCode[]}
                    label={formatsHeldLabel(row.formats)}
                  />
                }
                labels={{
                  students: MY_COURSES_PAGE.columns.students,
                  assessment: MY_COURSES_PAGE.columns.assessment,
                }}
                students={row.students}
                status={<StatusPill tone={row.status.tone}>{row.status.words}</StatusPill>}
                assessment={row.assessment ?? undefined}
                detail={row.detail}
                waiting={row.waiting ? <FaWaitLine>{row.waiting}</FaWaitLine> : undefined}
              />
            ))}
          </FaCourseCard>
        ))}
      </FaCourseLedger>
      <FaCourseFoot>{MY_COURSES_PAGE.foot}</FaCourseFoot>
    </>
  );
}
