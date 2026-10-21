'use client';

import type { ContentAccessRow } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';
import {
  Button,
  ButtonLink,
  HiddenHeading,
  IaCellText,
  IaListTable,
  type IaListRow,
  IaRecordGrid,
  IaSectionBody,
  IaSectionCount,
  IaSectionHead,
  IaSummary,
  IaUsageFormat,
  IaViewSwitch,
  ListState,
  LoadingRows,
  Notice,
  PageHead,
  Surface,
} from '@xr/ui/v3';
import { useEffect, useMemo, useRef, useState } from 'react';

import { calendarDay, dayMonthYear } from '@/copy/dates';
import { formatName } from '@/copy/flow-state-words';
import { CONTENT_ACCESS_WORDS, FORMAT_FULL_NAME } from '@/copy/institute-home';
import { REQUEST_ACTIONS } from '@/copy/institute-requests';
import { stateWords } from '@/copy/state-copy';
import {
  COURSE_TABLE,
  DEFINITIONS,
  endedNoticeTitle,
  EXPERIMENT_SECTION,
  experimentTableCaption,
  NO_ACTIVITY,
  NO_USAGE,
  sessionsByFormat,
  studentsWithAccessWords,
  USAGE_META,
  USAGE_NOTICES,
  USAGE_PAGE,
  usageMetaLine,
} from '@/copy/usage';
import { STUDENT_ACCESS_ADDRESS } from '@/nav/institute';
import { instituteRequestAddress } from '@/nav/institute-requests';
import {
  USAGE_ADDRESS,
  USAGE_PLACEMENT,
  usageAddress,
  type UsageViewKey,
  usageViewOf,
} from '@/nav/institute-usage';
import { useAppNavigation } from '@/nav/navigation';
import { useContentAccess, useInstituteOverview } from '@/queries/institute-home';
import { useUsage } from '@/queries/usage';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { usePlanToday } from '../ia-02-content-access/plan-today';
import { useInstitutionPaused } from '../shared/paused';
import {
  type CourseUsageView,
  type ExperimentUsageView,
  type UsageScreenView,
  usageScreenView,
} from './usage-view';

const TITLE_ID = 'ia-h1';
const COURSES_ID = 'us-c-h';
const DEFINITIONS_ID = 'us-d-h';
const NO_PLAN_ID = 'us-np-t';
const FAILED_ID = 'us-fail-t';

/**
 * IA-20 Usage — the V3 Refined B design (the owner-approved export design/v3-refined-b/roles/IA-v1,
 * `Main.dc.html` IA-20 and `vm20`), at `/institute/usage`: per experiment and format, each figure
 * defined in one line beside it.
 *
 * - **Reads**: `OperationsService.getUsage` (`useUsage(null)`: the "figures up to" instant and,
 *   per experiment the institution's plans hold, the students who can open it today and per format
 *   the students started, the completions reported by the simulation or the headset and the
 *   sessions — P3-04 provisional, computed by the service, so a grant, a runtime report or a
 *   completion in the same tab refreshes it) and `InstitutionService.listContentAccess` for each
 *   experiment's name, course and plans. No figure is added to another — not across formats,
 *   experiments or courses — and there is no feedback column, no export, no chart and no licence
 *   figure (D7 / T-06). No command: the page only reads.
 * - **As the export draws it**: the head ("How your content is being used · figures up to <date>"
 *   once there is activity), the view switch "By experiment and format · By course" (`?view=course`,
 *   state-copy `IA-20.view-address`), the paused or ended notice, then one surface per experiment
 *   (its course code, "N students with access" and its figures per format, or its own "No activity
 *   yet" with Open Student access) — or the by-course table — with "What the figures mean" beside
 *   it. Before access is active: "No usage yet" with View request status.
 * - **Loading and failed** (the export draws neither): the application's loading and its failed
 *   state with Try again (state-copy `IA-20.loading`, `IA-20.failed`); Try again moves focus to the
 *   title.
 */
export function Usage() {
  const navigation = useAppNavigation();
  useShellPage(USAGE_PLACEMENT);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const today = usePlanToday();
  const paused = useInstitutionPaused();

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
      <Surface labelledBy={FAILED_ID}>
        <ListState
          kind="failed"
          titleAs="h2"
          titleId={FAILED_ID}
          title={stateWords('IA-20.failed')}
          action={
            <Button
              onClick={() => {
                void usage.refetch();
                void content.refetch();
                titleRef.current?.focus();
              }}
            >
              {CONTENT_ACCESS_WORDS.tryAgain}
            </Button>
          }
        >
          {CONTENT_ACCESS_WORDS.failedLine}
        </ListState>
      </Surface>
    );
  } else if (screen === null || contentRows === null) {
    body = (
      <Surface label={USAGE_PAGE.title} busy>
        <LoadingRows message={stateWords('IA-20.loading')} rows={2} cells={[2, 1, 1, 1]} />
      </Surface>
    );
  } else if (contentRows.length === 0 && screen.experiments.length === 0) {
    body = <NoUsageYet />;
  } else {
    body = (
      <Figures screen={screen} content={contentRows} paused={paused} view={view} onView={choose} />
    );
  }

  return (
    <>
      <PageHead
        title={USAGE_PAGE.title}
        titleId={TITLE_ID}
        titleRef={titleRef}
        titleFocusTarget
        date={today.line}
        lead={
          answer && screen && !failed && !screen.none
            ? usageMetaLine(dayMonthYear(answer.figuresUpTo))
            : USAGE_META
        }
      />
      {body}
    </>
  );
}

/** The newest plan's end once every plan has ended (the ended notice), else null. */
function endedOn(content: readonly ContentAccessRow[]): string | null {
  const plans = content.flatMap((row) => row.plans);
  if (plans.length === 0 || plans.some((standing) => standing.status !== 'access-ended')) {
    return null;
  }
  const last = plans.reduce((newest, standing) =>
    standing.plan.endsOn > newest.plan.endsOn ? standing : newest,
  );
  return last.plan.endsOn;
}

/** The view switch, the notice, the view's figures and "What the figures mean". */
function Figures({
  screen,
  content,
  paused,
  view,
  onView,
}: {
  readonly screen: UsageScreenView;
  readonly content: readonly ContentAccessRow[];
  readonly paused: boolean;
  readonly view: UsageViewKey;
  readonly onView: (view: UsageViewKey) => void;
}) {
  const ended = paused ? null : endedOn(content);
  return (
    <>
      <IaViewSwitch<UsageViewKey>
        label={USAGE_PAGE.viewLabel}
        options={[
          { key: 'experiment', label: USAGE_PAGE.byExperiment },
          { key: 'course', label: USAGE_PAGE.byCourse },
        ]}
        value={view}
        onChange={onView}
      />
      {paused ? (
        <Notice tone="paused" icon="lock" role="status" title={USAGE_NOTICES.pausedTitle}>
          {USAGE_NOTICES.pausedLine}
        </Notice>
      ) : ended !== null ? (
        <Notice tone="off" role="status" title={endedNoticeTitle(calendarDay(ended))}>
          {USAGE_NOTICES.endedLine}
        </Notice>
      ) : null}
      <IaRecordGrid
        main={
          view === 'course' ? (
            <CourseTable screen={screen} />
          ) : (
            screen.experiments.map((experiment) => (
              <ExperimentSection key={experiment.experimentId} experiment={experiment} />
            ))
          )
        }
        side={
          <Surface labelledBy={DEFINITIONS_ID}>
            <IaSectionBody title={DEFINITIONS.title} titleId={DEFINITIONS_ID}>
              <IaSummary
                definitions
                items={DEFINITIONS.terms.map(({ term, definition }) => ({
                  key: term,
                  term,
                  children: definition,
                }))}
              />
            </IaSectionBody>
          </Surface>
        }
      />
    </>
  );
}

const number = (value: number) => <IaCellText kind="number">{value}</IaCellText>;

/** One experiment: its course code, students with access, and its figures per format. */
function ExperimentSection({ experiment }: { readonly experiment: ExperimentUsageView }) {
  const headingId = `us-e-${experiment.experimentId}`;
  const { columns } = EXPERIMENT_SECTION;
  return (
    <Surface labelledBy={headingId}>
      <IaSectionHead
        title={experiment.name}
        titleId={headingId}
        sub={experiment.courseCode ?? undefined}
        aside={
          <IaSectionCount emphasis>
            {studentsWithAccessWords(experiment.studentsWithAccess)}
          </IaSectionCount>
        }
      />
      {experiment.hasActivity ? (
        <IaListTable
          variant="stats"
          caption={experimentTableCaption(experiment.name)}
          columns={[
            { key: 'format', header: columns.format },
            { key: 'started', header: columns.started, numeric: true },
            { key: 'completed', header: columns.completed, numeric: true },
            { key: 'sessions', header: columns.sessions, numeric: true },
          ]}
          rows={experiment.formats.map((figures): IaListRow => ({
            key: figures.format,
            cells: [
              {
                key: 'format',
                role: 'main',
                children: (
                  <IaUsageFormat
                    code={formatName(figures.format)}
                    name={FORMAT_FULL_NAME[figures.format]}
                  />
                ),
              },
              {
                key: 'started',
                role: 'num',
                label: columns.started,
                children: number(figures.started),
              },
              {
                key: 'completed',
                role: 'num',
                label: columns.completed,
                children: number(figures.completed),
              },
              {
                key: 'sessions',
                role: 'num',
                label: columns.sessions,
                children: number(figures.sessions),
              },
            ],
          }))}
        />
      ) : (
        <ListState
          kind="none"
          icon="clock"
          titleAs="h3"
          title={NO_ACTIVITY.title}
          action={
            <ButtonLink href={STUDENT_ACCESS_ADDRESS}>{NO_ACTIVITY.openStudentAccess}</ButtonLink>
          }
        >
          {NO_ACTIVITY.line}
        </ListState>
      )}
    </Surface>
  );
}

/** A course's sessions, per format of its one experiment: "WEB 11 · VR 4" (never added up). */
function sessionsOf(
  course: CourseUsageView,
  formats: readonly Technology[],
  none: boolean,
): string {
  if (none) return NO_ACTIVITY.title;
  if (course.sessions === null) return COURSE_TABLE.perExperiment;
  return sessionsByFormat(
    formats.flatMap((format, index) => {
      const sessions = course.sessions![index];
      return sessions === null || sessions === undefined
        ? []
        : [{ code: formatName(format), sessions }];
    }),
  );
}

/** "By course": one row per course; started and completed stay per format. */
function CourseTable({ screen }: { readonly screen: UsageScreenView }) {
  const { columns } = COURSE_TABLE;
  return (
    <Surface labelledBy={COURSES_ID}>
      <HiddenHeading id={COURSES_ID}>{COURSE_TABLE.title}</HiddenHeading>
      <IaListTable
        variant="stats"
        caption={COURSE_TABLE.caption}
        columns={[
          { key: 'course', header: columns.course },
          { key: 'given', header: columns.experimentsGiven, numeric: true },
          { key: 'with', header: columns.studentsWithAccess, numeric: true },
          { key: 'sessions', header: columns.sessions },
        ]}
        rows={screen.courses.map((course): IaListRow => ({
          key: course.courseId,
          cells: [
            {
              key: 'course',
              role: 'main',
              children: (
                <>
                  <IaCellText kind="title">{course.name}</IaCellText>
                  {course.code !== null ? <IaCellText kind="sub">{course.code}</IaCellText> : null}
                </>
              ),
            },
            {
              key: 'given',
              role: 'num',
              label: columns.experimentsGiven,
              children: number(course.experimentsGiven),
            },
            {
              key: 'with',
              role: 'num',
              label: columns.studentsWithAccess,
              children:
                course.studentsWithAccess === null ? (
                  <IaCellText kind="text">{COURSE_TABLE.perExperiment}</IaCellText>
                ) : (
                  number(course.studentsWithAccess)
                ),
            },
            {
              key: 'sessions',
              role: 'stat',
              label: columns.sessions,
              children: (
                <IaCellText kind="text">
                  {sessionsOf(course, screen.sessionFormats, screen.none)}
                </IaCellText>
              ),
            },
          ],
        }))}
      />
    </Surface>
  );
}

/**
 * "No usage yet" before access is active: "View request status" opens the request the institution
 * was created from (`getMyOverview`, read only in this state) in Requests.
 */
function NoUsageYet() {
  const overview = useInstituteOverview();
  const reference = overview.data?.ok ? overview.data.value.institution.createdFromRequestId : null;
  return (
    <Surface labelledBy={NO_PLAN_ID}>
      <ListState
        kind="none"
        roomy
        titleAs="h2"
        titleId={NO_PLAN_ID}
        title={NO_USAGE.title}
        action={
          reference ? (
            <ButtonLink href={instituteRequestAddress(reference)}>
              {REQUEST_ACTIONS.viewRequestStatus}
            </ButtonLink>
          ) : null
        }
      >
        {NO_USAGE.line}
      </ListState>
    </Surface>
  );
}
