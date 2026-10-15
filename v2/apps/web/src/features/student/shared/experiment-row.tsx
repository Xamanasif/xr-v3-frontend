'use client';

import type { MyCourseRow, MyExperimentRow } from '@xr/contracts/draft';
import { FormatSet, Link } from '@xr/ui';
import { Fragment } from 'react';

import { stateWords } from '@/copy/state-copy';
import {
  COURSE_PAGE,
  formatCode,
  noLicenceForYouWords,
  openExperimentLabel,
  progressLabel,
  STUDENT_WORDS,
} from '@/copy/student';
import { myExperimentAddress } from '@/nav/student';

import { CodeThen } from './student-states';
import { availableFormats, type Closure, givenFormats, undecidedOf } from './student-view';

/**
 * One given experiment (B2-11 f1 `div.xw-erow`; ST-03, and ST-04 since Package 2B): name, "<code> ·
 * <course>", the formats available to the Student, each given format's progress word, and "Open"
 * (the hub). Paused (f6): the given formats off with "Paused — …. Your work is kept." and no
 * "Open". A supplied licence wait keeps "Open" with the Student's words (PC-45); an undecided gate
 * shows no can / can't statement.
 */
export function ExperimentRow({
  experiment,
  course,
  closure,
}: {
  readonly experiment: MyExperimentRow;
  readonly course: MyCourseRow;
  readonly closure: Closure;
}) {
  const undecided = undecidedOf(experiment);
  const given = givenFormats(experiment);
  const available = availableFormats(experiment);
  // A supplied licence wait (B3-02) closes the experiment for now: its formats read off with the
  // Student's words; the hub still opens (PC-45).
  const waitingPlan =
    experiment.closure?.kind === 'waiting-for-a-licence' ? experiment.closure.planId : null;
  const closedLine =
    closure === 'paused'
      ? COURSE_PAGE.pausedRow
      : closure === 'inactive'
        ? stateWords('ST-03.inactive-row')
        : waitingPlan !== null
          ? noLicenceForYouWords(waitingPlan)
          : null;
  return (
    <div className="xw-erow">
      <div className="xw-erow-main">
        <h3 className="xw-erow-title">{experiment.name}</h3>
        <span className="xr-meta">
          <CodeThen code={course.codeShown}>{course.name}</CodeThen>
        </span>
        {undecided !== null ? (
          <span className="xw-inherit">{stateWords('ST-03.policy-open')}</span>
        ) : closedLine !== null ? (
          <span className="xw-inherit">
            <FormatSet formats={given.map((row) => formatCode(row.format))} variant="off" compact />
            <span>{closedLine}</span>
          </span>
        ) : (
          <>
            {available.length > 0 ? (
              <span className="xw-inherit">
                {STUDENT_WORDS.availableToYou}{' '}
                <FormatSet formats={available.map(formatCode)} variant="yours" compact />
              </span>
            ) : null}
            {given.length > 0 ? (
              <span className="xw-inherit">
                {given.map((row, index) => (
                  <Fragment key={row.format}>
                    {index > 0 ? ' · ' : null}
                    <span>
                      <strong className="text-ink">{formatCode(row.format)}</strong>{' '}
                      {progressLabel(row.progress)}
                    </span>
                  </Fragment>
                ))}
              </span>
            ) : null}
          </>
        )}
      </div>
      {undecided === null && (closedLine === null || waitingPlan !== null) ? (
        <Link
          className="xr-btn xr-btn--secondary"
          href={myExperimentAddress(experiment.experimentId)}
          aria-label={openExperimentLabel(experiment.name)}
        >
          {COURSE_PAGE.open}
        </Link>
      ) : null}
    </div>
  );
}
