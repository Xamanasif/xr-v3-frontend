'use client';

import { type Technology } from '@xr/domain';
import { Button, EmptyState, type FilterChip, ListToolbar } from '@xr/ui';
import { useLayoutEffect, useRef, useState } from 'react';

import { stateWords } from '@/copy/state-copy';
import {
  ALL_EXPERIMENTS_PAGE,
  allExperimentsCountWords,
  experimentSearchChip,
  formatChip,
  formatCode,
  MY_COURSES_PAGE,
} from '@/copy/student';
import { type MyExperimentEntry, useMyExperiments } from '@/queries/student';

import { ExperimentRow } from '../shared/experiment-row';
import {
  StudentFailed,
  StudentLoading,
  useRetryFocus,
  useStudentSession,
} from '../shared/student-states';
import { type Closure, givenFormats } from '../shared/student-view';

const SEARCH_ID = 'all-experiments-search';

/** The given formats of the listed experiments, in display order (B2-11 Format options). */
function formatOptions(rows: readonly MyExperimentEntry[]): Technology[] {
  const seen = new Set<Technology>();
  for (const row of rows) for (const entry of givenFormats(row.experiment)) seen.add(entry.format);
  return [...seen];
}

function matches(row: MyExperimentEntry, search: string, format: Technology | 'all'): boolean {
  const text = `${row.experiment.name} ${row.course.codeShown ?? ''} ${row.course.name}`;
  return (
    (search === '' || text.toLocaleLowerCase('en').includes(search)) &&
    (format === 'all' || givenFormats(row.experiment).some((entry) => entry.format === format))
  );
}

/**
 * ST-04 My courses › All experiments — board B2-11 f2, f4, f15, the My courses page's
 * `?tab=experiments` (Appendix A rule T2): "Which experiments are given to me?"
 *
 * - **Read**: `listMyCourses`, then `getMyCourse` per course with something given — only the
 *   experiments the service gives the Student, one row per experiment (never one per format). An
 *   experiment published but not given is never listed (f4: searching for it is "No experiments
 *   match"); opening one by address answers ST-19 on the hub.
 * - **Each row** is ST-03's: the formats available to the Student and each given format's own
 *   progress, "Open" (the hub). A supplied licence wait reads "No licence is available for you on
 *   ACC-… right now." with the formats off (PC-45); a paused institution or an inactive account
 *   shows the formats off with their words and no "Open"; an undecided gate shows no can / can't
 *   statement (OD-B2-01).
 * - **Toolbar** (f2): Search ("Experiment or course", ignoring case) and Format (the given formats),
 *   the count, chips and "Clear filters"; no match (f4) offers "Clear filters".
 * - **States**: nothing given (the drawn empty state, no toolbar), nothing given now but earlier
 *   work (ST-02's words, state-copy `ST-04.nothing-now`), loading and failed with "Try again".
 */
export function AllExperiments() {
  const student = useStudentSession();
  const read = useMyExperiments();
  const retried = useRetryFocus(read.data?.ok === true);
  const retry = () => {
    retried();
    void read.refetch();
  };
  if (read.isError || (read.data && !read.data.ok)) {
    return <StudentFailed title={ALL_EXPERIMENTS_PAGE.failedTitle} onRetry={retry} />;
  }
  if (!student || read.isPending || !read.data) {
    return <StudentLoading label={ALL_EXPERIMENTS_PAGE.loading} />;
  }
  const { rows, earlierWork } = read.data.value;
  if (rows.length === 0) {
    return earlierWork ? (
      <div className="xr-section">
        <EmptyState icon="myCourses" title={MY_COURSES_PAGE.nothingNowTitle}>
          {stateWords('ST-04.nothing-now')}
        </EmptyState>
      </div>
    ) : (
      <div className="xr-section">
        <EmptyState icon="myCourses" title={ALL_EXPERIMENTS_PAGE.noAccessTitle}>
          {ALL_EXPERIMENTS_PAGE.noAccessLine}
        </EmptyState>
      </div>
    );
  }
  return <ExperimentList rows={rows} closure={student.closure} />;
}

function ExperimentList({
  rows,
  closure,
}: {
  readonly rows: readonly MyExperimentEntry[];
  readonly closure: Closure;
}) {
  const [search, setSearch] = useState('');
  const [format, setFormat] = useState<Technology | 'all'>('all');
  const wanted = search.trim().toLocaleLowerCase('en');
  const listed = rows.filter((row) => matches(row, wanted, format));

  const chips: FilterChip[] = [];
  if (wanted !== '') {
    chips.push({
      key: 'search',
      label: experimentSearchChip(search),
      onRemove: () => setSearch(''),
    });
  }
  if (format !== 'all') {
    chips.push({ key: 'format', label: formatChip(format), onRemove: () => setFormat('all') });
  }
  const clear = () => {
    setSearch('');
    setFormat('all');
  };

  // "Clear filters" in the no-match state goes with that state: focus moves to the search box
  // once the button has gone, and only if focus was lost (as IA-02 and SA-06 do).
  const pressed = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const control = pressed.current;
    if (control === null || control.isConnected) return;
    pressed.current = null;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    document.getElementById(SEARCH_ID)?.focus();
  });

  return (
    <>
      <ListToolbar
        search={{
          id: SEARCH_ID,
          label: ALL_EXPERIMENTS_PAGE.searchLabel,
          placeholder: ALL_EXPERIMENTS_PAGE.searchPlaceholder,
          value: search,
          onChange: setSearch,
        }}
        filters={[
          {
            id: 'all-experiments-format',
            label: ALL_EXPERIMENTS_PAGE.formatLabel,
            options: [
              { value: 'all', label: ALL_EXPERIMENTS_PAGE.allFormats },
              ...formatOptions(rows).map((value) => ({ value, label: formatCode(value) })),
            ],
            value: format,
            onChange: (value) => setFormat(value as Technology | 'all'),
          },
        ]}
        status={allExperimentsCountWords(listed.length, rows.length, chips.length > 0)}
        chips={chips}
        clearLabel={ALL_EXPERIMENTS_PAGE.clearFilters}
        onClearFilters={chips.length > 0 ? clear : undefined}
      />
      {listed.length > 0 ? (
        <div className="xr-section">
          {listed.map((row) => (
            <ExperimentRow
              key={row.experiment.experimentId}
              experiment={row.experiment}
              course={row.course}
              closure={closure}
            />
          ))}
        </div>
      ) : (
        <div className="xr-section">
          <EmptyState
            icon="search"
            title={ALL_EXPERIMENTS_PAGE.noMatchTitle}
            actions={
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  onClick={(event) => {
                    pressed.current = event.currentTarget;
                    clear();
                  }}
                >
                  {ALL_EXPERIMENTS_PAGE.clearFilters}
                </Button>
              </div>
            }
          />
        </div>
      )}
    </>
  );
}
