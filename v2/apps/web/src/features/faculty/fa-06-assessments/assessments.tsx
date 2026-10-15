'use client';

import type { AssessmentListRow, CreateOption } from '@xr/contracts/draft';
import type { AssessmentRules } from '@xr/domain';
import {
  Button,
  EmptyState,
  Field,
  Icon,
  Link,
  LoadingState,
  NoMatch,
  PageContent,
  PageHeader,
  Section,
  Select,
  Skeleton,
  StatusPill,
  TextInput,
} from '@xr/ui';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { deadlineWords, READINESS_WORDS } from '@/copy/assessment-words';
import {
  assessmentCountWords,
  ASSESSMENTS_PAGE,
  type AssessmentStateFilter,
  draftLineWords,
  dueAndSubmittedWords,
  LIST_STATES,
  rowActionLabel,
  waitingForMarkingWords,
} from '@/copy/assessments';
import { stateWords } from '@/copy/state-copy';
import {
  assessmentAddress,
  assessmentsPlacement,
  ASSESSMENTS_TITLE,
  createAssessmentAddress,
} from '@/nav/faculty';
import { useCreateOptions, useFacultyAssessments } from '@/queries/teaching';

import { useShellPage } from '../../shared/workspace-frame/shell-page';

const SEARCH_ID = 'assessments-search';
const COURSE_ID = 'assessments-course';
const STATE_ID = 'assessments-state';

/** How many of the assessment's rules are set (a draft's line, `FA-06.draft-line`). */
function rulesSet(rules: AssessmentRules): 'all' | 'some' | 'none' {
  const set = [
    rules.passMarkPercent !== null,
    rules.attemptsAllowed !== null,
    rules.deadline !== null,
    rules.release !== null,
  ].filter(Boolean).length;
  return set === 4 ? 'all' : set === 0 ? 'none' : 'some';
}

/** The experiment an assessment is for, as Faculty see it (name, and the course code). */
type ExperimentWords = Pick<CreateOption, 'name' | 'courseCode'>;

function matches(
  row: AssessmentListRow,
  experiment: ExperimentWords | undefined,
  filters: { readonly search: string; readonly course: string; readonly state: string },
): boolean {
  const search = filters.search.trim().toLowerCase();
  if (search !== '') {
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
  if (filters.state === 'waiting' && row.waitingForMarking === 0) return false;
  return true;
}

/**
 * FA-06 Assessments — board B4-04 f0, f9, f10, at `/faculty/assessments`.
 *
 * - **Read**: `AssessmentService.listAssessments` — the institution's assessments of the
 *   experiments the Faculty member teaches, each with its readiness, who has submitted, its reach
 *   and how many submissions wait for a written answer's marks — and `getCreateOptions` for each
 *   experiment's name and the course code Faculty see.
 * - **The list as drawn**: "All assessments" with its count, the toolbar (Search, Course, State)
 *   and the table — the name opens the record (FA-08), with its ASMT number; the experiment and
 *   its code; the state in words ("Ready", "Draft — not ready"); "Due … · 1 of 5 submitted ·" with
 *   the wait pill, or what a draft still lacks; "Open" or "Continue setting up". The search and
 *   filters narrow the service's list on the page (state-copy `FA-06.search`, `FA-06.filters`).
 * - **Create assessment** (FA-07) is the page's one primary action; f9 draws it again in "No
 *   assessments yet". There is no availability or release control (T-18; B4-14 D4), and nothing
 *   here opens marking (FA-18, Phase 4B).
 */
export function FacultyAssessments() {
  useShellPage(assessmentsPlacement());
  const list = useFacultyAssessments();
  const options = useCreateOptions();
  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('');
  const [state, setState] = useState<AssessmentStateFilter>('');

  const reads = [list, options];
  const failed = reads.some((read) => read.isError || (read.data !== undefined && !read.data.ok));
  const loading = !failed && reads.some((read) => read.data === undefined);
  const rows: readonly AssessmentListRow[] = list.data?.ok ? list.data.value : [];
  const experiments = useMemo(
    () =>
      new Map<string, ExperimentWords>(
        (options.data?.ok ? options.data.value : []).map((option) => [
          option.experimentId,
          { name: option.name, courseCode: option.courseCode },
        ]),
      ),
    [options.data],
  );

  const create = (
    <Link className="xr-btn xr-btn--primary" href={createAssessmentAddress()}>
      <Icon name="add" />
      {ASSESSMENTS_PAGE.create}
    </Link>
  );

  return (
    <PageContent wrap="wide">
      <PageHeader
        title={ASSESSMENTS_TITLE}
        meta={<span className="xl-meta">{ASSESSMENTS_PAGE.meta}</span>}
        actions={create}
      />
      {failed ? (
        <div className="xr-section">
          <div className="xr-empty">
            <span className="xr-empty-icon bg-err-bg text-err">
              <Icon name="failed" />
            </span>
            <h2 className="xr-h3 m-0">{stateWords('FA-06.failed')}</h2>
            <p className="xr-body m-0">{stateWords('FA-06.failed.line')}</p>
            <div className="xw-actions">
              <Button
                variant="primary"
                icon="tryAgain"
                onClick={() => {
                  for (const read of reads)
                    if (read.isError || read.data?.ok === false) void read.refetch();
                }}
              >
                {LIST_STATES.tryAgain}
              </Button>
            </div>
          </div>
        </div>
      ) : loading ? (
        <Section title={ASSESSMENTS_PAGE.section} headingId="assessments-heading">
          <LoadingState
            label={stateWords('FA-06.loading')}
            skeleton={[0, 1, 2].map((row) => (
              <div
                key={row}
                className="grid grid-cols-[1.4fr_1.2fr_0.8fr_1.6fr_120px] gap-5 px-4 py-[18px]"
              >
                {[0, 1, 2, 3, 4].map((cell) => (
                  <Skeleton key={cell} />
                ))}
              </div>
            ))}
          />
        </Section>
      ) : rows.length === 0 ? (
        <div className="xr-section">
          <EmptyState
            icon="assessments"
            title={ASSESSMENTS_PAGE.emptyTitle}
            actions={
              // f9 draws this one without the plus.
              <div className="flex flex-wrap gap-3">
                <Link className="xr-btn xr-btn--primary" href={createAssessmentAddress()}>
                  {ASSESSMENTS_PAGE.create}
                </Link>
              </div>
            }
          >
            {ASSESSMENTS_PAGE.emptyLine}
          </EmptyState>
        </div>
      ) : (
        <AssessmentList
          rows={rows}
          experiments={experiments}
          search={search}
          course={course}
          state={state}
          onSearch={setSearch}
          onCourse={setCourse}
          onState={setState}
        />
      )}
    </PageContent>
  );
}

function AssessmentList({
  rows,
  experiments,
  search,
  course,
  state,
  onSearch,
  onCourse,
  onState,
}: {
  readonly rows: readonly AssessmentListRow[];
  readonly experiments: ReadonlyMap<string, ExperimentWords>;
  readonly search: string;
  readonly course: string;
  readonly state: AssessmentStateFilter;
  readonly onSearch: (value: string) => void;
  readonly onCourse: (value: string) => void;
  readonly onState: (value: AssessmentStateFilter) => void;
}) {
  const filtered = search.trim() !== '' || course !== '' || state !== '';
  const shown = rows.filter((row) =>
    matches(row, experiments.get(row.assessment.experimentId), { search, course, state }),
  );
  const codes = [
    ...new Set(
      rows
        .map((row) => experiments.get(row.assessment.experimentId)?.courseCode ?? null)
        .filter((code): code is string => code !== null),
    ),
  ].sort();

  // "Clear filters" goes with the no-match state: focus moves to the search once the rows are
  // back, only if it had focus and nothing else took it.
  const searchRef = useRef<HTMLInputElement>(null);
  const pressed = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const control = pressed.current;
    if (control === null || control.isConnected) return;
    pressed.current = null;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    searchRef.current?.focus();
  });
  const clear = () => {
    const active = document.activeElement;
    pressed.current = active instanceof HTMLElement ? active : null;
    onSearch('');
    onCourse('');
    onState('');
  };

  return (
    <Section
      title={ASSESSMENTS_PAGE.section}
      headingId="assessments-heading"
      meta={assessmentCountWords(shown.length, rows.length, filtered)}
      metaLive
    >
      <div className="xr-toolbar [padding:0_24px_16px]">
        <Field id={SEARCH_ID} label={ASSESSMENTS_PAGE.searchLabel} className="xr-toolbar-search">
          <TextInput
            ref={searchRef}
            type="search"
            placeholder={ASSESSMENTS_PAGE.searchPlaceholder}
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
        </Field>
        <Field id={COURSE_ID} label={ASSESSMENTS_PAGE.courseLabel}>
          <Select
            options={[
              { value: '', label: ASSESSMENTS_PAGE.allCourses },
              ...codes.map((code) => ({ value: code, label: code })),
            ]}
            value={course}
            onChange={(event) => onCourse(event.target.value)}
          />
        </Field>
        <Field id={STATE_ID} label={ASSESSMENTS_PAGE.stateLabel} className="xr-filter-2">
          <Select
            options={[
              { value: '', label: ASSESSMENTS_PAGE.allStates },
              { value: 'draft', label: ASSESSMENTS_PAGE.states.draft },
              { value: 'ready', label: ASSESSMENTS_PAGE.states.ready },
              { value: 'waiting', label: ASSESSMENTS_PAGE.states.waiting },
            ]}
            value={state}
            onChange={(event) => onState(event.target.value as AssessmentStateFilter)}
          />
        </Field>
      </div>
      {shown.length > 0 ? (
        <AssessmentTable rows={shown} experiments={experiments} />
      ) : (
        <NoMatch title={stateWords('FA-06.no-match')} onClearFilters={clear}>
          {stateWords('FA-06.no-match.line')}
        </NoMatch>
      )}
    </Section>
  );
}

/** B4-04 f0 / f10 table: Assessment · Experiment · State · Deadline and submissions · Action. */
function AssessmentTable({
  rows,
  experiments,
}: {
  readonly rows: readonly AssessmentListRow[];
  readonly experiments: ReadonlyMap<string, ExperimentWords>;
}) {
  const { columns } = ASSESSMENTS_PAGE;
  return (
    <div className="xr-table-wrap">
      <table className="xr-table">
        <thead>
          <tr>
            <th scope="col">{columns.assessment}</th>
            <th scope="col">{columns.experiment}</th>
            <th scope="col">{columns.state}</th>
            <th scope="col">{columns.deadline}</th>
            <th scope="col">
              <span className="xr-sr">{columns.action}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const { assessment } = row;
            const experiment = experiments.get(assessment.experimentId);
            const readiness = READINESS_WORDS[row.readiness];
            const ready = row.readiness === 'ready';
            const action = ready ? ASSESSMENTS_PAGE.open : ASSESSMENTS_PAGE.continueSettingUp;
            const href = assessmentAddress(assessment.id);
            return (
              <tr key={assessment.id}>
                <td>
                  <Link href={href}>
                    <strong>{assessment.name}</strong>
                  </Link>
                  <span className="xr-meta block">{assessment.id}</span>
                </td>
                <td>
                  {experiment?.name ?? assessment.experimentId}
                  {experiment?.courseCode ? (
                    <span className="xr-meta block">{experiment.courseCode}</span>
                  ) : null}
                </td>
                <td>
                  <StatusPill tone={readiness.tone}>{readiness.label}</StatusPill>
                </td>
                <td>
                  {ready && assessment.rules.deadline !== null ? (
                    <>
                      {dueAndSubmittedWords(
                        deadlineWords(assessment.rules.deadline),
                        row.submitted,
                        row.reach,
                      )}
                      {row.waitingForMarking > 0 ? (
                        <>
                          {' · '}
                          <StatusPill tone="wait">
                            {waitingForMarkingWords(row.waitingForMarking)}
                          </StatusPill>
                        </>
                      ) : null}
                    </>
                  ) : (
                    draftLineWords(rulesSet(assessment.rules), assessment.questions.length)
                  )}
                </td>
                <td>
                  <Link
                    className="xr-btn xr-btn--secondary xr-btn--sm"
                    href={href}
                    aria-label={rowActionLabel(action, assessment.name)}
                  >
                    {action}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
