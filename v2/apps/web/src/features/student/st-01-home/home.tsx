'use client';

import type { ExperimentHub, MyAssessmentRow } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';
import {
  PageHead,
  StHomeCover,
  StHomeHow,
  StHomeItems,
  StHomeLayout,
  StHomeLearn,
  StHomeStep,
  StLoading,
  StMessage,
  StOutcomes,
  type StHomeItem,
  type StHomeStepProps,
} from '@xr/ui/v3';
import { useId } from 'react';

import { stateWords } from '@/copy/state-copy';
import {
  NO_LICENCE_TELL_MORE,
  ST_ACTION_WORDS,
  ST_FORMAT_NAMES,
  ST_STATE_WORDS,
} from '@/copy/st-shared';
import { upNextAssessmentSub, upNextAssessmentTitle } from '@/copy/student-assessments';
import {
  assessmentDueLine,
  assessmentReadyItem,
  assessmentReadyWords,
  completedLine,
  continueInWords,
  courseLinkLabel,
  coverOpenLabel,
  feedbackOpenTitle,
  formatCode as codeOf,
  formatWaitingWords,
  giveFeedbackWords,
  greeting,
  HOME_PAGE,
  HOME_V3,
  inProgressLine,
  progressLabel,
  resourcesItemWords,
  resourcesNoneLine,
  resultReleasedItem,
  setUpWords,
  waitingForYouLine,
} from '@/copy/student';
import {
  HOME_TITLE,
  homePlacement,
  MY_COURSES_ADDRESS,
  myCourseAddress,
  myExperimentAddress,
  STUDENT_HELP_ADDRESS,
} from '@/nav/student';
import { studentAssessmentAddress } from '@/nav/student-assessments';
import { formatPageAddress, hubTabAddress } from '@/nav/student-hub';
import { feedbackAddress } from '@/nav/student-progress';
import { experimentHub, type HomeRead, useStudentHome } from '@/queries/student';
import { useMyAssessments } from '@/queries/student-assessments';
import { useXrQuery } from '@/queries/use-xr-query';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { formatChipOf } from '../shared/format-progress';
import { useRetryFocus, useStudentSession } from '../shared/student-states';
import { type Closure, givenFormats, homeState, type UpNextView } from '../shared/student-view';
import {
  type HomeCover,
  homeCoverOf,
  type HomeStep,
  homeStepOf,
  otherUpNext,
  stepToTake,
} from './home-view';
import { useStudentTodayLine } from '../shared/use-today';

/**
 * ST-01 Home — the owner-approved V3 design (Student export ST-v1, `homeVM`), at `/student`: "What
 * should I do next?"
 *
 * - **Reads**: `StudentAccessService.getMyHome` with each listed course's rows (`studentHome`),
 *   the cover experiment's hub (`getExperimentHub`: its description, learning outcomes, resource
 *   count and assessment — one more read on the page), the Student's own assessments when Up next
 *   lists one (its name and deadline), and the session's banner facts (the institution's pause and
 *   an inactive account, XS-08).
 * - **States as drawn**: before access (the message with "How it works" and Help & support), an
 *   inactive account (the message; the banner names it), the cover — "Start here", "Continue
 *   learning" or "Your experiment" — with its one next step, "Also in this experiment" / "In this
 *   experiment" and "What you’re learning"; the institution's pause and a licence wait as the
 *   cover's held step. Earlier work only (SACC-14: no experiment row) is one message with "See
 *   earlier work" (My courses lists the course); loading and failed keep the register's words.
 * - **Next step** (`home-view.ts`, the export's rule): Continue WEB / Open VR, Give feedback on
 *   WEB (ST-16), Open resources (ST-06), Choose a format (ST-07), Open assessment (ST-12),
 *   Continue attempt (ST-13), Open <format>; Up next items of the Student's other experiments stay
 *   in the side column ("Up next", `ST-01.up-next`).
 * - **Not drawn** (no read on the Home holds them): the sample activity's stages (lead decision
 *   1), "Last saved …" and completion dates, the access end date.
 */
export function StudentHome() {
  useShellPage(homePlacement());
  const student = useStudentSession();
  const today = useStudentTodayLine();
  const read = useStudentHome();
  const failedId = useId();
  const home = read.data?.ok === true ? read.data.value : null;
  const cover =
    home && student && homeState(home.home, student.closure) !== 'inactive'
      ? homeCoverOf(home)
      : null;
  const coverId = cover?.experiment.experimentId ?? '';
  const hub = useXrQuery(experimentHub, coverId, { enabled: cover !== null });
  const hubSettled = cover === null || hub.data !== undefined || hub.isError;
  // Up next names an assessment from the Student's own assessments: read only when it lists one,
  // and waited for so the cover is drawn once.
  const listsAssessment = home?.home.upNext.some((item) => item.kind === 'assessment') === true;
  const assessments = useMyAssessments(listsAssessment);
  const assessmentsSettled =
    !listsAssessment || assessments.data !== undefined || assessments.isError;
  const retried = useRetryFocus(read.data?.ok === true);
  const retry = () => {
    retried();
    void read.refetch();
  };

  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  return (
    <>
      <PageHead
        title={student ? greeting(student.firstName) : HOME_TITLE}
        titleFocusTarget
        date={today}
        eyebrow={student?.institutionName ?? undefined}
      />
      {failed ? (
        // The Home answers every signed-in Student; a refusal is the workspace guard's (XS-06).
        <StMessage
          icon="cloudAlert"
          tone="err"
          alert
          title={stateWords('ST-01.failed')}
          titleId={failedId}
          description={ST_STATE_WORDS.failedLine}
          retry={{ label: ST_STATE_WORDS.tryAgain, onRetry: retry }}
        />
      ) : !student || !home || !hubSettled || !assessmentsSettled ? (
        <StLoading variant="card" label={stateWords('ST-01.loading')} />
      ) : (
        <HomeContent
          read={home}
          closure={student.closure}
          cover={cover}
          hub={hub.data?.ok ? hub.data.value : null}
          assessments={assessments.data?.ok ? assessments.data.value : []}
        />
      )}
    </>
  );
}

function HomeContent({
  read,
  closure,
  cover,
  hub,
  assessments,
}: {
  readonly read: HomeRead;
  readonly closure: Closure;
  readonly cover: HomeCover | null;
  readonly hub: ExperimentHub | null;
  readonly assessments: readonly MyAssessmentRow[];
}) {
  const messageId = useId();
  const state = homeState(read.home, closure);
  switch (state) {
    case 'inactive':
      // The page banner already names the inactive account and links to Help & support.
      return (
        <StMessage
          icon="user"
          tone="paused"
          title={HOME_V3.inactiveTitle}
          titleId={messageId}
          description={HOME_V3.inactiveLine}
        />
      );
    case 'none':
      return (
        <StMessage
          icon="myCourses"
          title={HOME_PAGE.noAccessTitle}
          titleId={messageId}
          description={HOME_PAGE.noAccessLine}
          link={{ href: STUDENT_HELP_ADDRESS, label: ST_STATE_WORDS.help }}
        >
          <StHomeHow label={HOME_V3.howItWorks} steps={HOME_V3.how} />
        </StMessage>
      );
    case 'earlier-only':
      return (
        <StMessage
          icon="ended"
          title={stateWords('ST-01.earlier-only')}
          titleId={messageId}
          description={stateWords('ST-01.earlier-only.line')}
          link={{ href: MY_COURSES_ADDRESS, label: HOME_V3.seeEarlierWork }}
        />
      );
    case 'paused':
    case 'given':
      if (cover === null) {
        return state === 'paused' ? (
          <StMessage
            icon="pauseCircle"
            title={HOME_PAGE.pausedTitle}
            titleId={messageId}
            description={HOME_PAGE.pausedLine}
          />
        ) : (
          <StMessage
            icon="progress"
            title={HOME_V3.nothingTitle}
            titleId={messageId}
            description={HOME_V3.nothingLine}
          />
        );
      }
      return (
        <Cover read={read} closure={closure} cover={cover} hub={hub} assessments={assessments} />
      );
  }
}

function Cover({
  read,
  closure,
  cover,
  hub,
  assessments,
}: {
  readonly read: HomeRead;
  readonly closure: Closure;
  readonly cover: HomeCover;
  readonly hub: ExperimentHub | null;
  readonly assessments: readonly MyAssessmentRow[];
}) {
  const kickerId = useId();
  const titleId = useId();
  const alsoId = useId();
  const upNextId = useId();
  const learnId = useId();
  const { experiment, course } = cover;
  const name = experiment.name;
  const step = homeStepOf({ read, cover, closure, hub, assessments });
  const toTake = stepToTake(step);
  // Held for now (the pause, an inactive account, an undecided rule): the experiment and its
  // parts are named but not opened; a licence wait keeps the way in (PC-45: the hub names it).
  const canOpen = !['paused', 'inactive', 'undecided'].includes(step.kind);
  const open = canOpen
    ? {
        href: myExperimentAddress(experiment.experimentId),
        label: HOME_PAGE.openExperimentShort,
        ariaLabel: coverOpenLabel(name),
      }
    : undefined;
  const started = givenFormats(experiment).some((row) => row.progress !== 'not-started');
  const kicker = !toTake
    ? HOME_V3.yourExperiment
    : cover.kind === 'start' || (cover.kind === 'listed' && !started)
      ? HOME_PAGE.startHere
      : HOME_V3.continueLearning;
  const items = alsoItems({ read, cover, closure, hub, assessments, step, canOpen });
  const others = otherUpNext(read, cover);
  const outcomes = hub?.experiment.learningOutcomes ?? [];

  return (
    <StHomeLayout>
      <StHomeCover
        kicker={kicker}
        kickerId={kickerId}
        code={course?.codeShown ?? null}
        course={
          course
            ? {
                name: course.name,
                href: myCourseAddress(course.courseId),
                ariaLabel: courseLinkLabel(course.name),
              }
            : { name: '' }
        }
        open={open}
        title={name}
        titleId={titleId}
        description={hub?.experiment.description}
        step={<StHomeStep {...stepProps(step, experiment.experimentId, name, open)} />}
      />
      {items.length > 0 || others.length > 0 ? (
        <StHomeItems
          title={toTake ? HOME_V3.alsoIn : HOME_V3.inThis}
          titleId={alsoId}
          items={items}
          more={
            others.length > 0
              ? {
                  title: HOME_PAGE.upNext,
                  titleId: upNextId,
                  items: others.map((item, index) => upNextItem(item, index, assessments)),
                }
              : undefined
          }
        />
      ) : null}
      {outcomes.length > 0 ? (
        <StHomeLearn title={HOME_V3.learning} titleId={learnId} note={HOME_V3.sameInEvery}>
          <StOutcomes items={outcomes} />
        </StHomeLearn>
      ) : null}
    </StHomeLayout>
  );
}

/** The step's badge, words and action (the export's `homeVM` step). */
function stepProps(
  step: HomeStep,
  experimentId: string,
  experimentName: string,
  open: StHomeStepProps['open'],
): StHomeStepProps {
  const action = (href: string, label: string) => ({
    href,
    label,
    ariaLabel: ST_ACTION_WORDS.named(label, experimentName),
    primary: true,
  });
  const chip = (format: Technology) => ({ chip: { code: codeOf(format), kind: 'on' as const } });
  switch (step.kind) {
    case 'paused':
      return {
        tone: 'held',
        badge: { icon: 'pauseCircle' },
        title: HOME_PAGE.pausedTitle,
        description: HOME_V3.pausedStep,
      };
    case 'inactive':
      return {
        tone: 'held',
        badge: { icon: 'user' },
        title: HOME_V3.inactiveTitle,
        description: HOME_V3.inactiveLine,
      };
    case 'undecided':
      return {
        tone: 'held',
        badge: { icon: 'unavailable' },
        title: stateWords('ST-19.undecided'),
        description: stateWords('ST-19.undecided.line'),
      };
    case 'waiting':
      return {
        tone: 'held',
        badge: { icon: 'clock' },
        title: HOME_V3.waitingTitle,
        description: NO_LICENCE_TELL_MORE,
        open,
      };
    case 'continue': {
      const label =
        step.format === 'web'
          ? ST_ACTION_WORDS.continue(codeOf(step.format))
          : ST_ACTION_WORDS.open(codeOf(step.format));
      return {
        tone: 'next',
        badge: chip(step.format),
        kicker: HOME_V3.nextStep,
        title: continueInWords(step.format),
        description: inProgressLine(step.format),
        action: action(formatPageAddress(experimentId, step.format), label),
        open,
      };
    }
    case 'feedback':
      return {
        tone: 'next',
        badge: chip(step.format),
        kicker: HOME_V3.nextStep,
        title: feedbackOpenTitle(step.format),
        description: completedLine(step.format),
        action: action(
          feedbackAddress(experimentId, step.format),
          ST_ACTION_WORDS.feedback(codeOf(step.format)),
        ),
        open,
      };
    case 'resources':
      return {
        tone: 'next',
        badge: { icon: 'resources' },
        kicker: HOME_V3.nextStep,
        title: HOME_V3.resourcesTitle,
        description: resourcesNoneLine(step.total),
        action: action(hubTabAddress(experimentId, 'resources'), HOME_V3.resourcesAction),
        open,
      };
    case 'simulation':
      return {
        tone: 'next',
        badge: { icon: 'simulation' },
        kicker: HOME_V3.nextStep,
        title: HOME_V3.simulationTitle,
        description: HOME_V3.simulationLine,
        action: action(hubTabAddress(experimentId, 'simulation'), HOME_V3.simulationAction),
        open,
      };
    case 'assessment':
      return {
        tone: 'next',
        badge: { icon: 'assessments' },
        kicker: HOME_V3.nextStep,
        title: HOME_V3.assessmentTitle,
        description:
          step.name !== null && step.deadline !== null
            ? assessmentDueLine(step.name, step.deadline)
            : step.name !== null
              ? upNextAssessmentTitle(step.name)
              : undefined,
        action: action(studentAssessmentAddress(step.assessmentId), HOME_V3.assessmentAction),
        open,
      };
    case 'attempt':
      return {
        tone: 'next',
        badge: { icon: 'assessments' },
        kicker: HOME_V3.nextStep,
        title: HOME_V3.attemptTitle,
        description: HOME_V3.attemptLine,
        action: action(
          studentAssessmentAddress(step.assessmentId, 'attempt'),
          HOME_V3.attemptAction,
        ),
        open,
      };
    case 'set-up':
      return {
        tone: 'next',
        badge: chip(step.format),
        kicker: HOME_V3.nextStep,
        title: setUpWords(step.format),
        description: waitingForYouLine(step.format),
        action: action(
          formatPageAddress(experimentId, step.format),
          ST_ACTION_WORDS.open(codeOf(step.format)),
        ),
        open,
      };
    case 'nothing':
      return {
        tone: 'plain',
        badge: { icon: 'progress' },
        title: HOME_V3.nothingTitle,
        description: HOME_V3.nothingLine,
        open,
      };
  }
}

/**
 * The rest of the cover experiment, quietly (the export's "Also in this experiment"): its
 * resources, each given format, its assessment — everything except what the step already covers;
 * each a link while it can be opened.
 */
function alsoItems({
  read,
  cover,
  closure,
  hub,
  assessments,
  step,
  canOpen,
}: {
  readonly read: HomeRead;
  readonly cover: HomeCover;
  readonly closure: Closure;
  readonly hub: ExperimentHub | null;
  readonly assessments: readonly MyAssessmentRow[];
  readonly step: HomeStep;
  readonly canOpen: boolean;
}): StHomeItem[] {
  const experiment = cover.experiment;
  const id = experiment.experimentId;
  const items: StHomeItem[] = [];
  if (hub && step.kind !== 'resources') {
    const { total, opened } = hub.resourceSummary;
    items.push({
      key: 'resources',
      badge: { icon: 'resources' },
      label: HOME_V3.resources,
      value: total === 0 ? stateWords('ST-05.no-resources') : resourcesItemWords(total, opened),
      href: canOpen ? hubTabAddress(id, 'resources') : undefined,
    });
  }
  const stepFormat =
    step.kind === 'continue' || step.kind === 'feedback' || step.kind === 'set-up'
      ? step.format
      : null;
  for (const row of givenFormats(experiment)) {
    if (row.format === stepFormat) continue;
    const chip = formatChipOf(row.format, row.availability, experiment.closure, closure);
    const feedbackDue = read.home.upNext.some(
      (item) => item.kind === 'feedback' && item.experimentId === id && item.format === row.format,
    );
    const run =
      row.progress === 'completed' && feedbackDue
        ? `${progressLabel(row.progress)} · ${HOME_V3.feedbackToGive}`
        : progressLabel(row.progress);
    items.push({
      key: row.format,
      badge: { chip: { code: chip.code, kind: chip.kind, glyph: chip.glyph } },
      label: ST_FORMAT_NAMES[chip.code],
      value:
        chip.kind === 'on'
          ? run
          : row.progress === 'not-started'
            ? chip.access
            : `${chip.access} · ${run.charAt(0).toLowerCase()}${run.slice(1)}`,
      href: canOpen ? formatPageAddress(id, row.format) : undefined,
    });
  }
  if (hub && step.kind !== 'assessment' && step.kind !== 'attempt') {
    const set = 'id' in hub.assessment ? hub.assessment : null;
    const row = set ? assessments.find((entry) => entry.assessment.id === set.id) : undefined;
    const value =
      set === null
        ? HOME_V3.noAssessment
        : set.result.kind === 'to-do'
          ? assessmentReadyItem(row?.assessment.rules.deadline ?? null)
          : set.result.kind === 'in-progress'
            ? HOME_V3.attemptInProgress
            : set.result.kind === 'waiting-for-marking'
              ? HOME_V3.waitingForMarking
              : set.result.kind === 'not-released-yet'
                ? HOME_V3.resultNotReleased
                : resultReleasedItem(set.result.releasedAt);
    items.push({
      key: 'assessment',
      badge: { icon: 'assessments' },
      label: HOME_V3.assessment,
      value,
      href: canOpen && set !== null ? hubTabAddress(id, 'assessment') : undefined,
    });
  }
  return items;
}

/** An Up next item of another experiment (state-copy `ST-01.up-next`), as a side-column item. */
function upNextItem(
  item: UpNextView,
  index: number,
  assessments: readonly MyAssessmentRow[],
): StHomeItem {
  switch (item.kind) {
    case 'assessment': {
      // Named from the Student's own assessments (B4-11 f10), else B2-10 f5's words.
      const row = assessments.find((entry) => entry.assessment.id === item.assessmentId);
      return {
        key: `${index} assessment`,
        badge: { icon: 'assessments' },
        label: row
          ? upNextAssessmentTitle(row.assessment.name)
          : assessmentReadyWords(item.experimentName),
        value: row
          ? upNextAssessmentSub(row.experimentName, row.assessment.rules.deadline)
          : HOME_PAGE.assessmentSub,
        href: studentAssessmentAddress(item.assessmentId),
      };
    }
    case 'feedback':
      return {
        key: `${index} feedback`,
        badge: { chip: { code: codeOf(item.format), kind: 'on' } },
        label: item.experimentName,
        value: giveFeedbackWords(item.format),
        href: feedbackAddress(item.experimentId, item.format),
      };
    case 'format':
      return {
        key: `${index} format`,
        badge: { chip: { code: codeOf(item.format), kind: 'on' } },
        label: item.experimentName,
        value: formatWaitingWords(item.format),
        href: myExperimentAddress(item.experimentId),
      };
  }
}
