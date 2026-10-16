'use client';

import type { MyAssessmentRow, MyCourseRow } from '@xr/contracts/draft';
import { EmptyState, FormatSet, Icon, type IconName, Link, PageContent, Row, Rows } from '@xr/ui';
import { Fragment, type ReactNode, useId } from 'react';

import { UP_NEXT_FEEDBACK } from '@/copy/progress-feedback';
import { stateWords } from '@/copy/state-copy';
import {
  UP_NEXT_OPEN_ASSESSMENT,
  upNextAssessmentSub,
  upNextAssessmentTitle,
} from '@/copy/student-assessments';
import {
  assessmentReadyWords,
  continueExperimentWords,
  courseLine,
  feedbackSubWords,
  formatCode,
  formatWaitingSub,
  formatWaitingWords,
  giveFeedbackWords,
  greeting,
  HOME_PAGE,
  openExperimentWords,
  progressLabel,
  STUDENT_WORDS,
  upNextMeta,
} from '@/copy/student';
import {
  HOME_TITLE,
  homePlacement,
  MY_COURSES_ADDRESS,
  myExperimentAddress,
  STUDENT_HELP_ADDRESS,
} from '@/nav/student';
import { studentAssessmentAddress } from '@/nav/student-assessments';
import { feedbackAddress } from '@/nav/student-progress';
import { type HomeRead, useStudentHome } from '@/queries/student';
import { useMyAssessments } from '@/queries/student-assessments';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { CourseRow } from '../shared/course-row';
import {
  StudentFailed,
  StudentLoading,
  useRetryFocus,
  useStudentSession,
} from '../shared/student-states';
import {
  availableFormats,
  type Closure,
  givenFormats,
  type HomeCard,
  homeCard,
  homeState,
  upNextItems,
  type UpNextView,
} from '../shared/student-view';

/**
 * ST-01 Home — board B2-10 (with B2-13 f1, f4, f6), at `/student`: "What should I do next?"
 *
 * - **Read**: `StudentAccessService.getMyHome` (Continue, Up next, My courses, "no access yet"),
 *   each listed course's experiments (`getMyCourse`, to name the card's experiment and course) and
 *   the session's banner facts (the institution's pause and an inactive account, XS-08). Nothing
 *   is derived from another fact: the card names what the service says the Student worked on last
 *   or — with nothing opened yet — the first format it lists as waiting ("Start here").
 * - **States as drawn**: before access (f0), first time (f1, f9 with the institution's code,
 *   T-17), continue (f4), Up next items (f5), institution paused (f6), inactive (f7), earlier work
 *   only (f8, SACC-14 open — see `ST-01.earlier-only`), loading and failed (undrawn, provisional).
 * - **Links**: the card and "Open experiment" open the hub (ST-05), "Open course" the course
 *   (ST-03), "View all courses" My courses (ST-02), Help the Student's Help; Up next's "Give
 *   feedback" opens that format's feedback (ST-16, Phase 3) — the service lists the item only for a
 *   format with its own completion and no feedback yet (BC5). Up next's assessment (an assessment
 *   to do, Phase 4B) reads as B4-11 f10 draws it — "<assessment> is ready", "<experiment> ·
 *   assessment · due <deadline>" — named from the Student's own assessments (`listMyAssessments`),
 *   and "Open assessment" opens "Before you start" (ST-12; state-copy `ST-01.up-next-assessment`);
 *   f8's "See earlier work" stays unrendered while SACC-14 is open (Progress has no earlier-work
 *   rows to show, `ST-01.earlier-only`).
 */
export function StudentHome() {
  useShellPage(homePlacement());
  const student = useStudentSession();
  const read = useStudentHome();
  // Up next names an assessment from the Student's own assessments (B4-11 f10): read only when it
  // lists one, and waited for so the row is drawn once.
  const listsAssessment =
    read.data?.ok === true &&
    read.data.value.home.upNext.some((item) => item.kind === 'assessment');
  const assessments = useMyAssessments(listsAssessment);
  const assessmentsSettled =
    !listsAssessment || assessments.data !== undefined || assessments.isError;
  const retried = useRetryFocus(read.data?.ok === true);

  const retry = () => {
    retried();
    void read.refetch();
  };

  return (
    <PageContent wrap="read">
      <div className="xw-stack">
        <div className="xw-greet">
          {student?.institutionName ? (
            <span className="xr-overline">{student.institutionName}</span>
          ) : null}
          <h1 className="xr-h1">{student ? greeting(student.firstName) : HOME_TITLE}</h1>
        </div>
        {read.isError ? (
          <StudentFailed title={stateWords('ST-01.failed')} onRetry={retry} />
        ) : !student || read.isPending || !read.data || !assessmentsSettled ? (
          <StudentLoading label={stateWords('ST-01.loading')} />
        ) : read.data.ok ? (
          <HomeContent
            read={read.data.value}
            closure={student.closure}
            assessments={assessments.data?.ok ? assessments.data.value : []}
          />
        ) : (
          // The Home answers every signed-in Student; a refusal is the workspace guard's (XS-06).
          <StudentFailed title={stateWords('ST-01.failed')} onRetry={retry} />
        )}
      </div>
    </PageContent>
  );
}

function HomeContent({
  read,
  closure,
  assessments,
}: {
  readonly read: HomeRead;
  readonly closure: Closure;
  /** The Student's own assessments, naming Up next's assessment (empty: not read or not readable). */
  readonly assessments: readonly MyAssessmentRow[];
}) {
  const state = homeState(read.home, closure);
  const help = (
    <div className="flex flex-wrap gap-3">
      <Link className="xr-btn xr-btn--text" href={STUDENT_HELP_ADDRESS}>
        {STUDENT_WORDS.help}
      </Link>
    </div>
  );
  switch (state) {
    case 'inactive':
      return (
        <Notice icon="notAvailable" title={HOME_PAGE.inactiveTitle} actions={help}>
          {HOME_PAGE.inactiveLine}
        </Notice>
      );
    case 'none':
      return (
        <Notice icon="myCourses" title={HOME_PAGE.noAccessTitle} actions={help}>
          {HOME_PAGE.noAccessLine}
        </Notice>
      );
    case 'paused':
      return (
        <>
          <Notice icon="paused" title={HOME_PAGE.pausedTitle} actions={help}>
            {HOME_PAGE.pausedLine}
          </Notice>
          {read.home.myCourses.length > 0 ? (
            <MyCoursesSection courses={read.home.myCourses} paused allLink={false} />
          ) : null}
        </>
      );
    case 'earlier-only':
      return (
        <>
          <Notice icon="notAvailable" title={stateWords('ST-01.earlier-only')}>
            {stateWords('ST-01.earlier-only.line')}
          </Notice>
          <MyCoursesSection courses={read.home.myCourses} paused={false} allLink={false} />
        </>
      );
    case 'given': {
      const card = homeCard(read);
      return (
        <>
          {card ? <ContinueCard card={card} /> : null}
          <UpNext items={upNextItems(read, card)} assessments={assessments} />
          <MyCoursesSection courses={read.home.myCourses} paused={false} allLink />
        </>
      );
    }
  }
}

/** B2-10's message in place of the experiments: `div.xr-section > div.xr-empty` (f0, f6, f7, f8). */
function Notice({
  icon,
  title,
  children,
  actions,
}: {
  readonly icon: IconName;
  readonly title: string;
  readonly children: string;
  readonly actions?: ReactNode;
}) {
  return (
    <div className="xr-section">
      <EmptyState icon={icon} title={title} actions={actions}>
        {children}
      </EmptyState>
    </div>
  );
}

/** "Start here" (f1) or "Continue where you left off" (f4): `section.xw-continue`. */
function ContinueCard({ card }: { readonly card: HomeCard }) {
  const headingId = useId();
  const { experiment, course } = card;
  const name = experiment.name;
  return (
    <section className="xw-continue" aria-labelledby={headingId}>
      <div className="xw-continue-main">
        <span className="xr-overline text-gold-700">
          {card.kind === 'start' ? HOME_PAGE.startHere : HOME_PAGE.continueWhere}
        </span>
        <h2 className="xw-continue-title" id={headingId}>
          {name}
        </h2>
        {course ? (
          <span className="xw-continue-meta">{courseLine(course.codeShown, course.name)}</span>
        ) : null}
        <span className="xw-continue-meta">
          {card.kind === 'start' ? (
            <>
              {STUDENT_WORDS.availableToYou}{' '}
              <FormatSet
                formats={availableFormats(experiment).map(formatCode)}
                variant="yours"
                compact
              />
            </>
          ) : (
            <span className="xw-inherit">
              {givenFormats(experiment).map((row, index) => (
                <Fragment key={row.format}>
                  {index > 0 ? ' · ' : null}
                  <span>
                    <strong className="text-ink">{formatCode(row.format)}</strong>{' '}
                    {progressLabel(row.progress)}
                  </span>
                </Fragment>
              ))}
            </span>
          )}
        </span>
      </div>
      <Link className="xr-btn xr-btn--primary" href={myExperimentAddress(experiment.experimentId)}>
        {card.kind === 'start' ? openExperimentWords(name) : continueExperimentWords(name)}
        <Icon name="next" />
      </Link>
    </section>
  );
}

/** Up next (f1, f4: honestly empty; f5: the three item types, at most three). */
function UpNext({
  items,
  assessments,
}: {
  readonly items: readonly UpNextView[];
  readonly assessments: readonly MyAssessmentRow[];
}) {
  const headingId = useId();
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {HOME_PAGE.upNext}
        </h2>
        {items.length > 0 ? <span className="xr-meta">{upNextMeta(items.length)}</span> : null}
      </div>
      {items.length === 0 ? (
        <div className="xr-section-body">
          <p className="xr-body m-0 text-ink-2">{HOME_PAGE.upNextEmpty}</p>
        </div>
      ) : (
        <Rows>
          {items.map((item, index) => (
            <UpNextRow key={index} item={item} assessments={assessments} />
          ))}
        </Rows>
      )}
    </section>
  );
}

function UpNextRow({
  item,
  assessments,
}: {
  readonly item: UpNextView;
  readonly assessments: readonly MyAssessmentRow[];
}) {
  switch (item.kind) {
    case 'assessment': {
      // B4-11 f10: named from the Student's own assessments; "Open assessment" opens "Before you
      // start" (ST-12). Without that list, B2-10 f5's words (`ST-01.up-next-assessment`).
      const row = assessments.find((entry) => entry.assessment.id === item.assessmentId);
      return (
        <Row
          icon="assessments"
          tone="info"
          title={
            row
              ? upNextAssessmentTitle(row.assessment.name)
              : assessmentReadyWords(item.experimentName)
          }
          sub={
            row
              ? upNextAssessmentSub(row.experimentName, row.assessment.rules.deadline)
              : HOME_PAGE.assessmentSub
          }
        >
          <Link
            className="xr-btn xr-btn--secondary xr-btn--sm"
            href={studentAssessmentAddress(item.assessmentId)}
          >
            {UP_NEXT_OPEN_ASSESSMENT}
          </Link>
        </Row>
      );
    }
    case 'feedback': {
      // "Give feedback" opens ST-16 for that experiment's format (B2-10 f5 → B3-06; Phase 3).
      return (
        <Row
          icon="flag"
          tone="ok"
          title={giveFeedbackWords(item.format)}
          sub={feedbackSubWords(item.experimentName, item.format)}
        >
          <Link
            className="xr-btn xr-btn--secondary xr-btn--sm"
            href={feedbackAddress(item.experimentId, item.format)}
          >
            {UP_NEXT_FEEDBACK}
          </Link>
        </Row>
      );
    }
    case 'format':
      return (
        <Row
          icon="monitor"
          title={formatWaitingWords(item.format)}
          sub={formatWaitingSub(item.experimentName, item.format, item.progress)}
        >
          <Link
            className="xr-btn xr-btn--secondary xr-btn--sm"
            href={myExperimentAddress(item.experimentId)}
          >
            {HOME_PAGE.openExperimentShort}
          </Link>
        </Row>
      );
  }
}

/** My courses on the Home (f1, f6, f8): each course with its code and what it gives now. */
function MyCoursesSection({
  courses,
  paused,
  allLink,
}: {
  readonly courses: readonly MyCourseRow[];
  readonly paused: boolean;
  readonly allLink: boolean;
}) {
  const headingId = useId();
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {HOME_PAGE.myCourses}
        </h2>
      </div>
      <Rows>
        {courses.map((course) => (
          <CourseRow key={course.courseId} course={course} paused={paused} />
        ))}
      </Rows>
      {allLink ? (
        <div className="xr-section-body pt-3">
          <Link href={MY_COURSES_ADDRESS}>{HOME_PAGE.viewAllCourses}</Link>
        </div>
      ) : null}
    </section>
  );
}
