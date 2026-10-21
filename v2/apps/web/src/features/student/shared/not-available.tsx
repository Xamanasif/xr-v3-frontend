'use client';

import {
  Breadcrumbs,
  ButtonLink,
  StLoading,
  StRefuse,
  type StRefuseItem,
  type V3IconName,
} from '@xr/ui/v3';
import { useId } from 'react';

import { stateWords } from '@/copy/state-copy';
import { openExperimentName, ST_OPEN_EXPERIMENT, ST_STATE_WORDS } from '@/copy/st-shared';
import {
  courseLine,
  endedTitle,
  HOME_PAGE,
  NOT_AVAILABLE,
  NOT_AVAILABLE_V3,
  noLongerLine,
  notGivenLine,
  notGivenShortLine,
} from '@/copy/student';
import {
  MY_COURSES_ADDRESS,
  MY_COURSES_TITLE,
  myExperimentAddress,
  STUDENT_HELP_ADDRESS,
} from '@/nav/student';
import { useMyExperiments } from '@/queries/student';

import { useStudentTodayLine } from './use-today';
import type { NotAvailableKind } from './student-view';

/** The page's title and current crumb on ST-19 ("My courses › Not available"). */
export const NOT_AVAILABLE_TITLE = NOT_AVAILABLE.title;

interface Message {
  readonly icon: V3IconName;
  readonly off: boolean;
  readonly title: string;
  readonly line: string;
}

/**
 * ST-19 Experiment not available — a state of the experiment hub, not a route (Appendix A §3.6),
 * as the owner-approved V3 design draws it (Student export ST-v1, `msg('notgiven' | 'withdrawn' |
 * 'ended')`): the crumb "My courses › Not available", then one compact card — the experiment it is
 * about, the page's one H1, one sentence, what the Student can still open, "Back to My courses"
 * and Help & support. The experiment is named from the public catalogue; one it does not name
 * (unknown or unpublished) reads "this experiment", so its existence is not revealed.
 *
 * "Not given" lists the experiments the Student can open instead (the All experiments read, one
 * more aggregate read): with any, the sentence drops "Experiments you can open are in My
 * courses." and "Back to My courses" is the secondary button. Not drawn (no read holds them while
 * SACC-14 is open, `ST-19.sacc-14`): the end date, "Your work, as recorded" and "See your
 * earlier work". The paused, inactive and undecided answers keep their register words in the
 * same card (`ST-19.other-refusals`, `ST-19.undecided`).
 */
export function NotAvailable({
  kind,
  name,
}: {
  readonly kind: NotAvailableKind;
  readonly name: string | null;
}) {
  const titleId = useId();
  const altId = useId();
  const today = useStudentTodayLine();
  const given = useMyExperiments(kind === 'not-given');
  if (kind === 'not-given' && given.isPending) {
    return <StLoading variant="card" label={stateWords('ST-05.loading')} />;
  }
  const others: StRefuseItem[] =
    kind === 'not-given' && given.data?.ok
      ? given.data.value.rows
          .filter((row) => row.experiment.name !== name)
          .map((row) => ({
            key: row.experiment.experimentId,
            title: row.experiment.name,
            meta: courseLine(row.course.codeShown, row.course.name),
            link: {
              href: myExperimentAddress(row.experiment.experimentId),
              label: ST_OPEN_EXPERIMENT,
              ariaLabel: openExperimentName(row.experiment.name),
            },
          }))
      : [];
  const { icon, off, title, line } = messageOf(kind, name, others.length > 0);
  return (
    <>
      <Breadcrumbs
        levels={[{ label: MY_COURSES_TITLE, href: MY_COURSES_ADDRESS }]}
        current={NOT_AVAILABLE.title}
      />
      <StRefuse
        date={today}
        icon={icon}
        off={off}
        kicker={name ?? undefined}
        title={title}
        titleId={titleId}
        description={line}
        alt={
          others.length > 0
            ? { title: NOT_AVAILABLE_V3.openInstead, titleId: altId, items: others }
            : undefined
        }
        actions={
          <ButtonLink
            href={MY_COURSES_ADDRESS}
            variant={others.length > 0 ? 'default' : 'primary'}
            size="lg"
          >
            {NOT_AVAILABLE.back}
          </ButtonLink>
        }
        help={{ href: STUDENT_HELP_ADDRESS, label: ST_STATE_WORDS.help }}
      />
    </>
  );
}

function messageOf(kind: NotAvailableKind, name: string | null, listsOthers: boolean): Message {
  switch (kind) {
    case 'not-given':
      return {
        icon: 'unavailable',
        off: true,
        title: NOT_AVAILABLE.notGivenTitle,
        line: name
          ? listsOthers
            ? notGivenShortLine(name)
            : notGivenLine(name)
          : stateWords('ST-19.unnamed'),
      };
    case 'no-longer-given':
      return {
        icon: 'ended',
        off: true,
        title: NOT_AVAILABLE.noLongerTitle,
        line: name ? noLongerLine(name) : stateWords('ST-19.no-longer-unnamed'),
      };
    case 'access-ended':
      return {
        icon: 'ended',
        off: true,
        title: name ? endedTitle(name) : stateWords('ST-19.ended-unnamed'),
        line: stateWords('ST-19.ended-line'),
      };
    case 'paused':
      return {
        icon: 'pauseCircle',
        off: false,
        title: HOME_PAGE.pausedTitle,
        line: HOME_PAGE.pausedLine,
      };
    case 'inactive':
      return {
        icon: 'user',
        off: false,
        title: HOME_PAGE.inactiveTitle,
        line: HOME_PAGE.inactiveLine,
      };
    case 'undecided':
      return {
        icon: 'unavailable',
        off: true,
        title: stateWords('ST-19.undecided'),
        line: stateWords('ST-19.undecided.line'),
      };
  }
}
