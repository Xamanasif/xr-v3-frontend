'use client';

import { type Technology } from '@xr/domain';
import {
  StExperimentListPanel,
  StExperimentListToolbar,
  StList,
  StLoading,
  StMessage,
  StStateRow,
  type StExperimentListChip,
} from '@xr/ui/v3';
import { useId, useLayoutEffect, useRef, useState } from 'react';

import { stateWords } from '@/copy/state-copy';
import { ST_STATE_WORDS } from '@/copy/st-shared';
import {
  ALL_EXPERIMENTS_PAGE,
  experimentsCountWords,
  experimentSearchChip,
  formatChip,
  formatCode,
  MY_COURSES_PAGE,
  MY_COURSES_V3,
  removeFilterLabel,
} from '@/copy/student';
import { MY_COURSES_TITLE, STUDENT_HELP_ADDRESS } from '@/nav/student';
import { type MyExperimentEntry, useMyExperiments } from '@/queries/student';

import { ExperimentRow } from '../shared/experiment-row';
import { useRetryFocus, useStudentSession } from '../shared/student-states';
import { type Closure, givenFormats } from '../shared/student-view';

const SEARCH_ID = 'all-experiments-search';
const FORMAT_ID = 'all-experiments-format';

/** The given formats of the listed experiments, in display order (the export's Format options). */
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

/** My courses' no-access message (the export's `C.none`), on both tabs: Help & support. */
export function NoAccessYet({ line }: { readonly line: string }) {
  const titleId = useId();
  return (
    <StMessage
      icon="myCourses"
      title={MY_COURSES_PAGE.noAccessTitle}
      titleId={titleId}
      description={line}
      link={{ href: STUDENT_HELP_ADDRESS, label: ST_STATE_WORDS.help }}
    />
  );
}

/**
 * ST-04 My courses › All experiments — the owner-approved V3 design (Student export ST-v1, the
 * `coursesVM` experiments tab), the My courses page's `?tab=experiments`: "Which experiments are
 * given to me?"
 *
 * - **Read**: `listMyCourses`, then `getMyCourse` per listed course — only the experiments the
 *   service gives the Student, one row per experiment (never one per format). An experiment
 *   published but not given is never listed (searching for it is "No experiments match");
 *   opening one by address answers ST-19 on the hub.
 * - **Each row** (`xcard`): the course code and course, the name, each given format with its
 *   words and "Open experiment" (the hub). A supplied licence wait, the institution's pause and an
 *   inactive account read on the formats ("Waiting for a licence", "Paused", "Inactive"); the pause
 *   and an inactive account leave no way in; an undecided gate shows no can / can't statement.
 * - **Toolbar**: Search ("Experiment or course", ignoring case) and Format (the given formats), the
 *   count ("1 experiment in 1 course", "1 of 3 experiments" while filtered), one chip per filter
 *   and "Clear filters"; removing a chip returns focus to its field, clearing to the search.
 * - **States**: nothing given (the page's no-access message), nothing given now but earlier work
 *   (ST-02's words, state-copy `ST-04.nothing-now`), no match ("Clear filters"), loading and
 *   failed with "Try again".
 */
export function AllExperiments() {
  const student = useStudentSession();
  const read = useMyExperiments();
  const failedId = useId();
  const retried = useRetryFocus(read.data?.ok === true);
  const retry = () => {
    retried();
    void read.refetch();
  };
  if (read.isError || (read.data && !read.data.ok)) {
    return (
      <StMessage
        icon="cloudAlert"
        tone="err"
        alert
        title={ALL_EXPERIMENTS_PAGE.failedTitle}
        titleId={failedId}
        description={ST_STATE_WORDS.failedLine}
        retry={{ label: ST_STATE_WORDS.tryAgain, onRetry: retry }}
      />
    );
  }
  if (!student || read.isPending || !read.data) {
    return (
      <StLoading variant="card" name={MY_COURSES_TITLE} label={MY_COURSES_V3.loadingExperiments} />
    );
  }
  const { rows, earlierWork } = read.data.value;
  if (rows.length === 0) {
    return earlierWork ? (
      <StMessage
        icon="myCourses"
        title={MY_COURSES_PAGE.nothingNowTitle}
        titleId={failedId}
        description={stateWords('ST-04.nothing-now')}
      />
    ) : (
      <NoAccessYet line={MY_COURSES_V3.experimentsNone} />
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
  const panelId = useId();
  const [search, setSearch] = useState('');
  const [format, setFormat] = useState<Technology | 'all'>('all');
  const wanted = search.trim().toLocaleLowerCase('en');
  const listed = rows.filter((row) => matches(row, wanted, format));
  const courses = new Set(rows.map((row) => row.course.courseId)).size;

  const chips: StExperimentListChip[] = [];
  if (wanted !== '') {
    const label = experimentSearchChip(search);
    chips.push({
      key: 'search',
      label,
      removeLabel: removeFilterLabel(label),
      onRemove: () => {
        setSearch('');
        document.getElementById(SEARCH_ID)?.focus();
      },
    });
  }
  if (format !== 'all') {
    const label = formatChip(format);
    chips.push({
      key: 'format',
      label,
      removeLabel: removeFilterLabel(label),
      onRemove: () => {
        setFormat('all');
        document.getElementById(FORMAT_ID)?.focus();
      },
    });
  }
  const clear = () => {
    setSearch('');
    setFormat('all');
  };

  // "Clear filters" goes with the state it sits in: focus moves to the search box once the
  // button has gone, and only if focus was lost (as IA-02 and SA-06 do).
  const pressed = useRef<boolean>(false);
  useLayoutEffect(() => {
    if (!pressed.current) return;
    pressed.current = false;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    document.getElementById(SEARCH_ID)?.focus();
  });
  const clearAndFocus = () => {
    pressed.current = true;
    clear();
  };

  return (
    <StExperimentListPanel title={MY_COURSES_V3.allHeading} titleId={panelId}>
      <StExperimentListToolbar
        label={MY_COURSES_V3.filterLabel}
        search={{
          id: SEARCH_ID,
          label: ALL_EXPERIMENTS_PAGE.searchLabel,
          placeholder: ALL_EXPERIMENTS_PAGE.searchPlaceholder,
          value: search,
          onChange: setSearch,
        }}
        format={{
          id: FORMAT_ID,
          label: ALL_EXPERIMENTS_PAGE.formatLabel,
          value: format,
          options: [
            { value: 'all', label: ALL_EXPERIMENTS_PAGE.allFormats },
            ...formatOptions(rows).map((value) => ({ value, label: formatCode(value) })),
          ],
          onChange: (value) => setFormat(value as Technology | 'all'),
        }}
        count={experimentsCountWords(listed.length, rows.length, courses, chips.length > 0)}
        chips={chips}
        clear={
          chips.length > 0
            ? { label: ALL_EXPERIMENTS_PAGE.clearFilters, onClear: clearAndFocus }
            : undefined
        }
      />
      {listed.length > 0 ? (
        <StList label={MY_COURSES_V3.listLabel}>
          {listed.map((row) => (
            <ExperimentRow
              key={row.experiment.experimentId}
              experiment={row.experiment}
              course={row.course}
              closure={closure}
              place="list"
            />
          ))}
        </StList>
      ) : (
        <StStateRow
          icon="search"
          titleAs="p"
          title={ALL_EXPERIMENTS_PAGE.noMatchTitle}
          description={MY_COURSES_V3.noMatchLine}
          action={{ label: ALL_EXPERIMENTS_PAGE.clearFilters, onClick: clearAndFocus }}
        />
      )}
    </StExperimentListPanel>
  );
}
