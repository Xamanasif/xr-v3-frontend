'use client';

import type { MyCourseRow, MyExperimentRow } from '@xr/contracts/draft';
import {
  ButtonLink,
  StExperimentListFormats,
  StExperimentListKicker,
  StListRow,
  StRowText,
  StRowTitle,
  type StExperimentFormat,
} from '@xr/ui/v3';
import { useId } from 'react';

import { stateWords } from '@/copy/state-copy';
import { openExperimentName, ST_FORMAT_NAMES, ST_OPEN_EXPERIMENT } from '@/copy/st-shared';
import { progressLabel, yourFormatsLabel } from '@/copy/student';
import { myExperimentAddress } from '@/nav/student';

import { formatChipOf } from './format-progress';
import { type Closure, givenFormats, undecidedOf } from './student-view';

/**
 * Where a row sits (the export's `xcard`): inside a course section on My courses (`course`, an
 * `h4` under the course's `h3`), on the course page (`course-page`, an `h3`) or in All
 * experiments (`list`, an `h3` after its course code and course).
 */
export type ExperimentRowPlace = 'course' | 'course-page' | 'list';

/**
 * The formats of a given experiment as the row draws them (`fmtStatus`): each given format's chip
 * and one line — its own progress when it opens now, the hold first when it is held (paused, an
 * inactive account, a supplied licence wait, not right now), then the progress once started.
 */
export function rowFormatsOf(experiment: MyExperimentRow, closure: Closure): StExperimentFormat[] {
  return givenFormats(experiment).map((row) => {
    const chip = formatChipOf(row.format, row.availability, experiment.closure, closure);
    const run = progressLabel(row.progress);
    const text =
      chip.kind === 'held'
        ? row.progress === 'not-started'
          ? chip.access
          : `${chip.access} · ${run.toLowerCase()}`
        : run;
    return {
      chip: { code: chip.code, kind: chip.kind, glyph: chip.glyph },
      name: ST_FORMAT_NAMES[chip.code],
      text,
    };
  });
}

/**
 * One given experiment (the export's `xcard`: `li.sv-li.sv-xli`; ST-02 inside its course, ST-03,
 * ST-04): its name, each given format with its words and "Open experiment" (the hub). The
 * institution's pause or an inactive account keeps it listed with no way in (the shell's banner
 * says why); a supplied licence wait keeps "Open experiment" (PC-45: the hub names the wait); an
 * undecided gate shows no format and no can / can't statement (`ST-03.policy-open`). The read
 * holds no description, so none is drawn (`ST-02.v3-rows`).
 */
export function ExperimentRow({
  experiment,
  course,
  closure,
  place,
}: {
  readonly experiment: MyExperimentRow;
  readonly course: MyCourseRow;
  readonly closure: Closure;
  readonly place: ExperimentRowPlace;
}) {
  const titleId = useId();
  const undecided = undecidedOf(experiment) !== null;
  const canOpen = !undecided && closure === null;
  return (
    <StListRow
      variant="experiment"
      end={
        canOpen ? (
          <ButtonLink
            href={myExperimentAddress(experiment.experimentId)}
            aria-label={openExperimentName(experiment.name)}
          >
            {ST_OPEN_EXPERIMENT}
          </ButtonLink>
        ) : undefined
      }
    >
      {place === 'list' ? (
        <StExperimentListKicker code={course.codeShown} course={course.name} />
      ) : null}
      <StRowTitle id={titleId} level={place === 'course' ? 4 : 3}>
        {experiment.name}
      </StRowTitle>
      {undecided ? (
        <StRowText>{stateWords('ST-03.policy-open')}</StRowText>
      ) : (
        <StExperimentListFormats
          label={yourFormatsLabel(experiment.name)}
          formats={rowFormatsOf(experiment, closure)}
        />
      )}
    </StListRow>
  );
}
