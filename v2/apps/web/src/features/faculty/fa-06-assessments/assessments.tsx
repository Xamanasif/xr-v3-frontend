'use client';

import type { AssessmentListRow, CreateOption } from '@xr/contracts/draft';
import {
  Button,
  ButtonLink,
  FaAssessmentsDaysLeft,
  FaCellMeter,
  FaCellName,
  FaCellSub,
  FaFilters,
  FaMessageCard,
  FaRowLink,
  FaSearchField,
  FaSelectField,
  FaStatusLine,
  FaTable,
  FaToolbar,
  FaWaitLine,
  HiddenHeading,
  ListState,
  LoadingRows,
  PageHead,
  StatusPill,
  Surface,
} from '@xr/ui/v3';
import { useMemo, useRef, useState } from 'react';

import { deadlineWords, READINESS_WORDS } from '@/copy/assessment-words';
import {
  assessmentCountWords,
  ASSESSMENTS_PAGE,
  type AssessmentStateFilter,
  courseChipWords,
  createdByWords,
  draftSubmissionsWords,
  experimentCourseLine,
  LIST_STATES,
  removeFilterLabel,
  rowOpenLabel,
  searchChipWords,
  stateChipWords,
  studentsSubmittedWords,
  waitingForMarkingWords,
} from '@/copy/assessments';
import { assessmentName, faDaysLeftWords } from '@/copy/fa-shared';
import { stateWords } from '@/copy/state-copy';
import {
  assessmentAddress,
  assessmentsPlacement,
  ASSESSMENTS_TITLE,
  createAssessmentAddress,
} from '@/nav/faculty';
import { useSession } from '@/queries/session';
import { useCreateOptions, useFacultyAssessments, useTeachingCourses } from '@/queries/teaching';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  deadlineState,
  otherActor,
  submittedUnits,
  useAssessmentToday,
} from '../shared/assessment-frame';

const SEARCH_ID = 'assessments-search';
const COURSE_ID = 'assessments-course';
const STATE_ID = 'assessments-state';
const HEADING_ID = 'assessments-heading';
const NO_COURSE_ID = 'assessments-no-course';

/** The experiment an assessment is for, as Faculty see it (name, and the course code). */
type ExperimentWords = Pick<CreateOption, 'name' | 'courseCode'>;

interface Filters {
  readonly search: string;
  readonly course: string;
  readonly state: AssessmentStateFilter;
}

function matches(
  row: AssessmentListRow,
  experiment: ExperimentWords | undefined,
  filters: Filters,
): boolean {
  const search = filters.search.trim().toLowerCase();
  if (search !== '') {
    // The search also matches the reference (the service's key), which no row prints.
    const haystack = [
      row.assessment.name,
      row.assessment.id,
      experiment?.name ?? '',
      experiment?.courseCode ?? '',
    ]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(search)) return false;
  }
  if (filters.course !== '' && (experiment?.courseCode ?? '') !== filters.course) return false;
  if (filters.state === 'draft' && row.readiness !== 'draft-not-ready') return false;
  if (filters.state === 'ready' && row.readiness !== 'ready') return false;
  if (filters.state === 'waiting' && row.waitingForMarking + row.waitingToConfirm === 0)
    return false;
  return true;
}

/**
 * FA-06 Assessments in the V3 Refined B design (FA-v1 `Main.dc.html` "FA-06 Assessments",
 * `vmAsmList`), at `/faculty/assessments`.
 *
 * - **Reads**: `AssessmentService.listAssessments` — the institution's assessments of the
 *   experiments the Faculty member teaches, each with its readiness, who has submitted, its reach
 *   and how many submissions wait for a written answer's marks — `getCreateOptions` for each
 *   experiment's name and the course code Faculty see, and `TeachingService.listMyCourses` (one
 *   aggregate read) for the course's name beside its code.
 * - **The list as drawn**: the head with "Create assessment" (once there is an assessment), the
 *   toolbar (Search, Course, State, with the count, a chip per filter and "Clear filters"), and
 *   the table: the name (the whole row opens the record, FA-08), the experiment with "ME ZG523 ·
 *   Thermodynamics & Heat Transfer", the deadline with the days left (Ready and open) or "Deadline
 *   passed", the submissions (a unit meter and "2 of 5 students submitted", or what a draft lacks)
 *   with "2 waiting for marking", and the state. The search and filters narrow the service's list
 *   on the page (state-copy `FA-06.search`, `FA-06.filters`). No row prints the assessment's
 *   reference (the owner's identifier rule); the search still matches it.
 * - **States**: no assessment yet (with "Create assessment"), no course assigned (the message card,
 *   nothing to create), no match (with "Clear filters"), and the existing loading and failed
 *   states (the export draws none for this list). There is no availability or release control
 *   (T-18), and nothing here opens marking.
 */
export function FacultyAssessments() {
  useShellPage(assessmentsPlacement());
  const today = useAssessmentToday();
  const list = useFacultyAssessments();
  const options = useCreateOptions();
  const courses = useTeachingCourses();
  const [filters, setFilters] = useState<Filters>({ search: '', course: '', state: '' });
  const titleRef = useRef<HTMLHeadingElement>(null);

  const reads = [list, options];
  const failed = reads.some((read) => read.isError || (read.data !== undefined && !read.data.ok));
  const loading = !failed && reads.some((read) => read.data === undefined);
  const rows: readonly AssessmentListRow[] = list.data?.ok ? list.data.value : [];
  const teaching = useMemo(() => (options.data?.ok ? options.data.value : []), [options.data]);
  const experiments = useMemo(
    () =>
      new Map<string, ExperimentWords>(
        teaching.map((option) => [
          option.experimentId,
          { name: option.name, courseCode: option.courseCode },
        ]),
      ),
    [teaching],
  );
  const courseNames = useMemo(
    () =>
      new Map<string, string>(
        (courses.data?.ok ? courses.data.value : []).flatMap((entry) =>
          entry.course.platformCode
            ? [[entry.course.platformCode, entry.course.name] as const]
            : [],
        ),
      ),
    [courses.data],
  );

  const create = (withIcon: boolean) => (
    <ButtonLink
      variant="primary"
      size={withIcon ? 'lg' : undefined}
      href={createAssessmentAddress()}
      {...(withIcon ? { icon: 'add' as const, iconSize: 20 as const } : {})}
    >
      {ASSESSMENTS_PAGE.create}
    </ButtonLink>
  );

  const head = (
    <PageHead
      date={today.line}
      title={ASSESSMENTS_TITLE}
      titleFocusTarget
      titleRef={titleRef}
      lead={ASSESSMENTS_PAGE.lead}
      actions={!loading && !failed && rows.length > 0 ? create(true) : undefined}
    />
  );

  if (failed) {
    return (
      <>
        {head}
        <Surface labelledBy={HEADING_ID}>
          <HiddenHeading id={HEADING_ID}>{ASSESSMENTS_PAGE.section}</HiddenHeading>
          <ListState
            kind="failed"
            title={stateWords('FA-06.failed')}
            action={
              <Button
                onClick={() => {
                  for (const read of reads)
                    if (read.isError || read.data?.ok === false) void read.refetch();
                  titleRef.current?.focus();
                }}
              >
                {LIST_STATES.tryAgain}
              </Button>
            }
          >
            {stateWords('FA-06.failed.line')}
          </ListState>
        </Surface>
      </>
    );
  }
  if (loading) {
    return (
      <>
        {head}
        <Surface labelledBy={HEADING_ID} busy>
          <HiddenHeading id={HEADING_ID}>{ASSESSMENTS_PAGE.section}</HiddenHeading>
          <LoadingRows message={stateWords('FA-06.loading')} />
        </Surface>
      </>
    );
  }
  if (teaching.length === 0 && rows.length === 0) {
    return (
      <>
        {head}
        <FaMessageCard
          icon="clipboardCheck"
          title={ASSESSMENTS_PAGE.noCourseTitle}
          titleId={NO_COURSE_ID}
        >
          {ASSESSMENTS_PAGE.noCourseLine}
        </FaMessageCard>
      </>
    );
  }
  return (
    <>
      {head}
      <Surface labelledBy={HEADING_ID}>
        <HiddenHeading id={HEADING_ID}>{ASSESSMENTS_PAGE.section}</HiddenHeading>
        {rows.length === 0 ? (
          <ListState
            kind="empty"
            roomy
            icon="clipboardCheck"
            title={ASSESSMENTS_PAGE.emptyTitle}
            action={create(false)}
          >
            {ASSESSMENTS_PAGE.emptyLine}
          </ListState>
        ) : (
          <AssessmentList
            rows={rows}
            experiments={experiments}
            courseNames={courseNames}
            filters={filters}
            onFilters={setFilters}
            today={today.instant}
          />
        )}
      </Surface>
    </>
  );
}

function AssessmentList({
  rows,
  experiments,
  courseNames,
  filters,
  onFilters,
  today,
}: {
  readonly rows: readonly AssessmentListRow[];
  readonly experiments: ReadonlyMap<string, ExperimentWords>;
  readonly courseNames: ReadonlyMap<string, string>;
  readonly filters: Filters;
  readonly onFilters: (next: Filters) => void;
  readonly today: string | null;
}) {
  const session = useSession();
  const viewer = session.status === 'signed-in' ? session.personId : null;
  const set = (patch: Partial<Filters>) => onFilters({ ...filters, ...patch });
  const filtered = filters.search.trim() !== '' || filters.course !== '' || filters.state !== '';
  const shown = rows.filter((row) =>
    matches(row, experiments.get(row.assessment.experimentId), filters),
  );
  const codes = [
    ...new Set(
      rows
        .map((row) => experiments.get(row.assessment.experimentId)?.courseCode ?? null)
        .filter((code): code is string => code !== null),
    ),
  ].sort();
  const clear = () => onFilters({ search: '', course: '', state: '' });

  const chips = [
    ...(filters.search.trim() !== ''
      ? [
          {
            key: 'search',
            label: searchChipWords(filters.search.trim()),
            onRemove: () => set({ search: '' }),
            focusId: SEARCH_ID,
          },
        ]
      : []),
    ...(filters.course !== ''
      ? [
          {
            key: 'course',
            label: courseChipWords(filters.course),
            onRemove: () => set({ course: '' }),
            focusId: COURSE_ID,
          },
        ]
      : []),
    ...(filters.state !== ''
      ? [
          {
            key: 'state',
            label: stateChipWords(ASSESSMENTS_PAGE.states[filters.state]),
            onRemove: () => set({ state: '' }),
            focusId: STATE_ID,
          },
        ]
      : []),
  ];

  return (
    <>
      <FaToolbar>
        <FaFilters label={ASSESSMENTS_PAGE.toolbarLabel}>
          <FaSearchField
            id={SEARCH_ID}
            label={ASSESSMENTS_PAGE.searchLabel}
            placeholder={ASSESSMENTS_PAGE.searchPlaceholder}
            value={filters.search}
            onChange={(search) => set({ search })}
          />
          <FaSelectField
            id={COURSE_ID}
            label={ASSESSMENTS_PAGE.courseLabel}
            value={filters.course}
            options={[
              { value: '', label: ASSESSMENTS_PAGE.allCourses },
              ...codes.map((code) => ({ value: code, label: code })),
            ]}
            onChange={(course) => set({ course })}
          />
          <FaSelectField
            id={STATE_ID}
            label={ASSESSMENTS_PAGE.stateLabel}
            value={filters.state}
            options={[
              { value: '', label: ASSESSMENTS_PAGE.allStates },
              { value: 'draft', label: ASSESSMENTS_PAGE.states.draft },
              { value: 'ready', label: ASSESSMENTS_PAGE.states.ready },
              { value: 'waiting', label: ASSESSMENTS_PAGE.states.waiting },
            ]}
            onChange={(state) => set({ state: state as AssessmentStateFilter })}
          />
        </FaFilters>
        <FaStatusLine
          count={assessmentCountWords(shown.length, rows.length, filtered)}
          chips={chips}
          removeLabel={removeFilterLabel}
          clearLabel={ASSESSMENTS_PAGE.clearFilters}
          onClearFilters={clear}
          clearFocusId={SEARCH_ID}
        />
      </FaToolbar>
      {shown.length > 0 ? (
        <FaTable
          kind="assessments"
          caption={ASSESSMENTS_PAGE.caption}
          columns={[
            { key: 'name', header: ASSESSMENTS_PAGE.columns.assessment, width: 'name' },
            { key: 'experiment', header: ASSESSMENTS_PAGE.columns.experiment },
            { key: 'deadline', header: ASSESSMENTS_PAGE.columns.deadline },
            { key: 'subs', header: ASSESSMENTS_PAGE.columns.submissions, width: 'subs' },
            { key: 'state', header: ASSESSMENTS_PAGE.columns.state },
          ]}
          rows={shown.map((row) => {
            const { assessment } = row;
            const experiment = experiments.get(assessment.experimentId);
            const ready = row.readiness === 'ready';
            const readiness = READINESS_WORDS[row.readiness];
            const name = assessmentName(assessment.name);
            const creator = otherActor(assessment.createdBy, viewer);
            const own = creator === null;
            const due = deadlineState(assessment.rules.deadline, ready, today);
            const meter = own && ready && row.reach > 0;
            const courseLine = experimentCourseLine(
              experiment?.courseCode ?? null,
              experiment?.courseCode ? (courseNames.get(experiment.courseCode) ?? null) : null,
            );
            const submissions = !own
              ? ASSESSMENTS_PAGE.coTeacherSubmissions
              : ready
                ? studentsSubmittedWords(row.submitted, row.reach)
                : draftSubmissionsWords(assessment.questions.length > 0);
            return {
              key: assessment.id,
              link: true,
              cells: [
                {
                  key: 'name',
                  main: true,
                  children: (
                    <>
                      <FaRowLink
                        href={assessmentAddress(assessment.id)}
                        label={rowOpenLabel(name, readiness.label)}
                      >
                        {name}
                      </FaRowLink>
                      {creator ? <FaCellSub>{createdByWords(creator)}</FaCellSub> : null}
                    </>
                  ),
                },
                {
                  key: 'experiment',
                  wide: true,
                  noLabel: true,
                  label: ASSESSMENTS_PAGE.columns.experiment,
                  children: (
                    <>
                      <FaCellName>
                        {experiment?.name ?? stateWords('FA-08.experiment-unknown')}
                      </FaCellName>
                      {courseLine ? <FaCellSub>{courseLine}</FaCellSub> : null}
                    </>
                  ),
                },
                {
                  key: 'deadline',
                  nowrap: true,
                  label: ASSESSMENTS_PAGE.columns.deadline,
                  children: (
                    <>
                      <FaCellName numeric>
                        {assessment.rules.deadline === null
                          ? ASSESSMENTS_PAGE.notSetYet
                          : deadlineWords(assessment.rules.deadline)}
                      </FaCellName>
                      {due.kind === 'left' ? (
                        <FaAssessmentsDaysLeft>{faDaysLeftWords(due.days)}</FaAssessmentsDaysLeft>
                      ) : null}
                      {due.kind === 'passed' ? (
                        <FaCellSub>{ASSESSMENTS_PAGE.deadlinePassed}</FaCellSub>
                      ) : null}
                    </>
                  ),
                },
                {
                  key: 'subs',
                  label: ASSESSMENTS_PAGE.columns.submissions,
                  children: (
                    <>
                      {meter ? (
                        <FaCellMeter units={submittedUnits(row.submitted, row.reach)}>
                          {submissions}
                        </FaCellMeter>
                      ) : (
                        <FaCellSub first>{submissions}</FaCellSub>
                      )}
                      {/* Every own submission waiting: written answers to mark, and choice-only
                          ones whose automatic marks wait for confirmation (24 Oct 2026). */}
                      {own && row.waitingForMarking + row.waitingToConfirm > 0 ? (
                        <FaWaitLine>
                          {waitingForMarkingWords(row.waitingForMarking + row.waitingToConfirm)}
                        </FaWaitLine>
                      ) : null}
                    </>
                  ),
                },
                {
                  key: 'state',
                  status: true,
                  label: ASSESSMENTS_PAGE.columns.state,
                  children: (
                    <StatusPill tone={ready ? 'ok' : 'neutral'}>{readiness.label}</StatusPill>
                  ),
                },
              ],
            };
          })}
        />
      ) : (
        <ListState
          kind="nomatch"
          live
          title={ASSESSMENTS_PAGE.noMatchTitle}
          action={
            <Button
              onClick={() => {
                clear();
                window.setTimeout(() => document.getElementById(SEARCH_ID)?.focus(), 0);
              }}
            >
              {ASSESSMENTS_PAGE.clearFilters}
            </Button>
          }
        >
          {ASSESSMENTS_PAGE.noMatchLine}
        </ListState>
      )}
    </>
  );
}
