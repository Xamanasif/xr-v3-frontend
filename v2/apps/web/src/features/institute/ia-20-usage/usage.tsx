'use client';

import type { Technology } from '@xr/domain';
import {
  FormatBadge,
  type FormatCode,
  Icon,
  Link,
  PageContent,
  PageHeader,
  SegmentedControl,
  Skeleton,
} from '@xr/ui';
import { Fragment, useEffect, useId, useMemo, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import { stateWords } from '@/copy/state-copy';
import {
  accessPlanWords,
  COURSE_TABLE,
  courseSessionsHeader,
  DEFINITIONS,
  EXPERIMENT_SECTION,
  experimentTableCaption,
  NO_ACTIVITY,
  studentsWithAccessWords,
  USAGE_META,
  USAGE_PAGE,
  usageMetaLine,
} from '@/copy/usage';
import { STUDENT_ACCESS_ADDRESS } from '@/nav/institute';
import {
  USAGE_ADDRESS,
  USAGE_PLACEMENT,
  usageAddress,
  type UsageViewKey,
  usageViewOf,
} from '@/nav/institute-usage';
import { useAppNavigation } from '@/nav/navigation';
import { useContentAccess } from '@/queries/institute-home';
import { useUsage } from '@/queries/usage';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { LoadFailed } from '../ia-02-content-access/institute-parts';
import {
  type CourseUsageView,
  type ExperimentUsageView,
  type UsageScreenView,
  usageScreenView,
} from './usage-view';

const code = (format: Technology) => format.toUpperCase() as FormatCode;

/**
 * IA-20 Usage — board B3-10 ("How much is our content being used?"), at `/institute/usage`, the
 * Institute Admin's reading page: per experiment and format, each figure defined in one line.
 *
 * - **Reads**: `OperationsService.getUsage` (`useUsage(null)`: the "figures up to" instant and,
 *   per experiment the institution's plans hold, the students who can open it today and per
 *   format the students started, the completions reported by the simulation or the headset and
 *   the sessions — P3-04 provisional, computed by the service from grants, runtime activity and
 *   completion records, so a grant, a runtime report or a completion in the same tab refreshes
 *   it) and `InstitutionService.listContentAccess` for each experiment's name, course, platform
 *   code and plans. No figure is added to another — not across formats, experiments or courses —
 *   and there is no feedback column, no export, no chart and no licence figure (B3-10 "Not
 *   designed"; T-25; D7 / T-06). No command: the page only reads.
 * - **As B3-10 draws it**: the header ("How your content is being used · figures up to <date>"),
 *   the view switch "By experiment and format · By course" (`div.xr-seg`), one section per
 *   experiment with its course code, plan and students with access and a table of Format ·
 *   Started · Completed · Sessions (f0; tablet f3; at 375 the table becomes labelled rows, f4),
 *   or the by-course table Course · Experiments given · Students with access · Sessions (WEB · VR)
 *   (f1, `?view=course`, register PROPOSED; state-copy `IA-20.view-address`), then "What the
 *   figures mean". "No activity yet" with "Open Student access" (f2) replaces all of it while no
 *   figure is above zero (state-copy `IA-20.no-activity`).
 * - **States B3-10 does not draw**: loading and failed with "Try again" (state-copy `IA-20.loading`,
 *   `IA-20.failed`), several experiments or plans, a course with several experiments (its figures
 *   stay per experiment: `IA-20.course-several`).
 */
export function Usage() {
  const navigation = useAppNavigation();
  useShellPage(USAGE_PLACEMENT);

  // The view lives here while the page is on show; the address mirrors it (replaced, no history
  // entry). An address that differs from the view came from outside (the browser's Back): it is
  // read again. Any other `view` is normalised to the bare address.
  const addressed = usageViewOf(navigation.search);
  const [view, setView] = useState<UsageViewKey>(addressed.view);
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setView(addressed.view);
  }
  const { normalise } = addressed;
  useEffect(() => {
    if (normalise) navigation.replace(USAGE_ADDRESS);
  }, [normalise, navigation]);
  const choose = (next: UsageViewKey) => {
    setView(next);
    navigation.replace(usageAddress(next));
  };

  const usage = useUsage(null);
  const content = useContentAccess();
  const answer = usage.data?.ok ? usage.data.value : null;
  const contentRows = content.data?.ok ? content.data.value : null;
  const failed =
    usage.isError ||
    content.isError ||
    (usage.data !== undefined && !usage.data.ok) ||
    (content.data !== undefined && !content.data.ok);
  const screen = useMemo(
    () => (answer && contentRows ? usageScreenView(answer.rows, contentRows) : null),
    [answer, contentRows],
  );

  let body;
  if (failed) {
    body = (
      <LoadFailed
        title={stateWords('IA-20.failed')}
        onRetry={() => {
          void usage.refetch();
          void content.refetch();
        }}
      />
    );
  } else if (screen === null) {
    body = <LoadingFigures />;
  } else if (screen.none) {
    body = <NoActivity />;
  } else {
    body = <Figures screen={screen} view={view} onView={choose} />;
  }

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-4"
        title={USAGE_PAGE.title}
        meta={answer && !failed ? usageMetaLine(dayMonthYear(answer.figuresUpTo)) : USAGE_META}
      />
      {body}
    </PageContent>
  );
}

/** The view switch, the view's figures and "What the figures mean" (f0, f1, f3, f4). */
function Figures({
  screen,
  view,
  onView,
}: {
  readonly screen: UsageScreenView;
  readonly view: UsageViewKey;
  readonly onView: (view: UsageViewKey) => void;
}) {
  return (
    <>
      <SegmentedControl<UsageViewKey>
        label={USAGE_PAGE.viewLabel}
        options={[
          { value: 'experiment', label: USAGE_PAGE.byExperiment },
          { value: 'course', label: USAGE_PAGE.byCourse },
        ]}
        value={view}
        onValueChange={onView}
      />
      <div className="h-5" />
      {view === 'course' ? (
        <CourseTable courses={screen.courses} formats={screen.sessionFormats} />
      ) : (
        <div className="flex flex-col gap-6">
          {screen.experiments.map((experiment) => (
            <ExperimentSection key={experiment.experimentId} experiment={experiment} />
          ))}
        </div>
      )}
      <div className="h-6" />
      <Definitions />
    </>
  );
}

/** One experiment (B3-10 f0): its name, course code and plan, students with access, its formats. */
function ExperimentSection({ experiment }: { readonly experiment: ExperimentUsageView }) {
  const headingId = useId();
  const { columns } = EXPERIMENT_SECTION;
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <div>
          <h2 id={headingId} className="xr-h2">
            {experiment.name}
          </h2>
          {experiment.courseCode !== null || experiment.planIds.length > 0 ? (
            <span className="xl-meta">
              {experiment.courseCode !== null ? (
                <span className="xr-id">{experiment.courseCode}</span>
              ) : null}
              {experiment.courseCode !== null && experiment.planIds.length > 0 ? ' · ' : null}
              {experiment.planIds.length > 0 ? accessPlanWords(experiment.planIds) : null}
            </span>
          ) : null}
        </div>
        <span className="xl-meta">
          <span className="xl-num">{experiment.studentsWithAccess}</span>{' '}
          {studentsWithAccessWords(experiment.studentsWithAccess)}
        </span>
      </div>
      <div className="px-6 pb-6">
        <div className="xr-table-wrap">
          <table className="xr-table">
            <caption className="xr-sr">{experimentTableCaption(experiment.name)}</caption>
            <thead>
              <tr>
                <th scope="col">{columns.format}</th>
                <th scope="col">{columns.started}</th>
                <th scope="col">{columns.completed}</th>
                <th scope="col">{columns.sessions}</th>
              </tr>
            </thead>
            <tbody>
              {experiment.formats.map((figures) => (
                <tr key={figures.format}>
                  <td className="is-primary">
                    <FormatBadge format={code(figures.format)} compact />
                    <span className="ml-1.5">{code(figures.format)}</span>
                  </td>
                  <td data-label={columns.started}>
                    <span className="xl-num">{figures.started}</span>
                  </td>
                  <td data-label={columns.completed}>
                    <span className="xl-num">{figures.completed}</span>
                  </td>
                  <td data-label={columns.sessions}>
                    <span className="xl-num">{figures.sessions}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/** "By course" (B3-10 f1): one row per course; started and completed stay per format. */
function CourseTable({
  courses,
  formats,
}: {
  readonly courses: readonly CourseUsageView[];
  readonly formats: readonly Technology[];
}) {
  const { columns } = COURSE_TABLE;
  const sessionsHeader = courseSessionsHeader(formats.map(code));
  return (
    <div className="xr-table-wrap">
      <table className="xr-table">
        <caption className="xr-sr">{COURSE_TABLE.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{columns.course}</th>
            <th scope="col">{columns.experimentsGiven}</th>
            <th scope="col">{columns.studentsWithAccess}</th>
            <th scope="col">{sessionsHeader}</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.courseId}>
              <td className="is-primary">
                {course.name}
                {course.code !== null ? <span className="xr-sub xr-id">{course.code}</span> : null}
              </td>
              <td data-label={columns.experimentsGiven}>
                <span className="xl-num">{course.experimentsGiven}</span>
              </td>
              <td data-label={columns.studentsWithAccess}>
                {course.studentsWithAccess === null ? (
                  COURSE_TABLE.perExperiment
                ) : (
                  <span className="xl-num">{course.studentsWithAccess}</span>
                )}
              </td>
              <td data-label={sessionsHeader}>
                {course.sessions === null
                  ? COURSE_TABLE.perExperiment
                  : course.sessions.map((sessions, index) => (
                      <span key={formats[index]}>
                        {index > 0 ? ' · ' : null}
                        {sessions === null ? (
                          COURSE_TABLE.notHeld
                        ) : (
                          <span className="xl-num">{sessions}</span>
                        )}
                      </span>
                    ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** "What the figures mean": each figure defined in one line (`dl.xl-defs`). */
function Definitions() {
  const headingId = useId();
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {DEFINITIONS.title}
        </h2>
      </div>
      <div className="xr-section-body">
        <dl className="xl-defs">
          {DEFINITIONS.terms.map(({ term, definition }) => (
            <Fragment key={term}>
              <dt>{term}</dt>
              <dd>{definition}</dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** "No activity yet" (B3-10 f2): the Usage icon, one line, "Open Student access". */
function NoActivity() {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon">
          <Icon name="usage" />
        </span>
        <h2 className="xr-h3 m-0">{NO_ACTIVITY.title}</h2>
        <p className="xr-body m-0 text-ink-2">{NO_ACTIVITY.line}</p>
        <div className="flex flex-wrap gap-3">
          <Link className="xr-btn xr-btn--secondary" href={STUDENT_ACCESS_ADDRESS}>
            {NO_ACTIVITY.openStudentAccess}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Loading (undrawn; state-copy `IA-20.loading`): skeleton rows, announced to screen readers. */
function LoadingFigures() {
  return (
    <div className="xr-table-wrap" aria-busy="true">
      <span className="xr-sr" role="status">
        {stateWords('IA-20.loading')}
      </span>
      {[0, 1, 2].map((line) => (
        <div
          key={line}
          className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
        >
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ))}
    </div>
  );
}
