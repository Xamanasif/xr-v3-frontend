'use client';

import type { GiveAccessOptions, ServiceError } from '@xr/contracts/draft';
import {
  BackLink,
  ErrorSummary,
  FailedState,
  Icon,
  Link,
  LoadingState,
  Notice,
  PageContent,
  PageHeader,
  Skeleton,
  Stepper,
  stepCountText,
} from '@xr/ui';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { stateWords } from '@/copy/state-copy';
import {
  GIVE_ACCESS,
  type GiveStep,
  planEndedLine,
  planEndedTitle,
  requestAwaitingPaymentWords,
  studentsChosenWords,
} from '@/copy/student-access';
import {
  CONTENT_ACCESS_ADDRESS,
  INSTITUTE_HELP_ADDRESS,
  STUDENT_ACCESS_ADDRESS,
  underPlacement,
} from '@/nav/institute';
import { useAppNavigation } from '@/nav/navigation';
import {
  type GiveChoice,
  giveInput,
  useGiveAccessOptions,
  useGiveAccessPlan,
  useGiveAccessPreview,
  useGiveAccessStudents,
  useInstituteStanding,
} from '@/queries/student-access';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  ExperimentsStep,
  ResultSection,
  ReviewStep,
  SelectionSummary,
  StudentsStep,
  type GivenResult,
} from './give-access-steps';
import {
  checkExperiments,
  checkTarget,
  choiceOf,
  chosenOf,
  type Draft,
  draftOf,
  EMPTY_DRAFT,
  FIELD_IDS,
  type Prefill,
  prefillOf,
  reachableStep,
  STEPS,
  stepAddress,
  type StepErrors,
  stepNumber,
  stepOf,
} from './give-access-view';

const TITLE_ID = 'give-access-title';

/**
 * IA-05 Give students access — board B2-05, at `/institute/student-access/give`
 * (`?step=experiments|students|review`; pre-filled by `?student=`, `?group=`, `?course=`,
 * `?experiment=`).
 *
 * - **Read**: `StudentAccessService.getGiveAccessOptions` — the plan, the course's experiments in
 *   the plan (formats inherited, LD-1) and the ones published but not in it, the students and the
 *   groups, each with whether the service offers it (already has it, inactive, an empty group;
 *   f9) — with each student's ID and groups from `PeopleService.listStudents` and the plan's status
 *   from `InstitutionService.getAccessPlan`. Refused while paused (f15), after the plan has ended
 *   (f16) and before anything is held (f17): the drawn message page, named from the institution's
 *   own overview.
 * - **Three steps** in the address: experiments → students or a group → review. "Continue" checks
 *   the step with the contract's own input schema (the drawn summary, focus on it; f10); the
 *   review is the service's preview (`previewGiveAccess`, which writes nothing): what will be
 *   created, whom it reaches and how each stands — a wait only where the service supplies one (D7).
 * - **Act**: "Give access" sends `giveAccess` once, with the plan's revision as read
 *   (`expectedPlanRev`). The result names each new grant ("Access given · SACC-0310") with its
 *   status; "View Student access" and "Give more access". A failure keeps every choice (f12); a
 *   refusal says so and reads the options again.
 * - Not rendered (DEV-21): "Request renewal" (IA-17) on f16. "Import students" (f14) opens IA-11.
 */
export function GiveAccess() {
  useShellPage(underPlacement('IA-05', GIVE_ACCESS.title));
  const navigation = useAppNavigation();
  const step = stepOf(navigation.search);
  const [prefill, setPrefill] = useState<Prefill>(() => prefillOf(navigation.search));
  const [draft, setDraft] = useState<Draft>(() => draftOf(navigation.search));
  const [errors, setErrors] = useState<StepErrors | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [given, setGiven] = useState<GivenResult | null>(null);
  const [focusTitle, setFocusTitle] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const give = useCommand((ports) => ports.studentAccess.giveAccess);

  // One read for the course the page names; with no course named and more than one in access, the
  // first course's experiments are read on their own (an experiment carries no course).
  // Package 2B (PC-48): the experiments chosen in step 1 go with the read, so "Already has it" is
  // answered per chosen experiment from the grant records — never per course.
  const base = useGiveAccessOptions(draft.courseId, draft.experimentIds);
  const firstCourse =
    draft.courseId === null && base.data?.ok && base.data.value.courses.length > 1
      ? base.data.value.courses[0]!.id
      : null;
  const scoped = useGiveAccessOptions(firstCourse, draft.experimentIds, firstCourse !== null);
  const options = firstCourse !== null ? scoped : base;
  const students = useGiveAccessStudents();
  const answer = options.data;
  const offered = answer?.ok ? answer.value : null;
  const plan = useGiveAccessPlan(offered?.plan.id ?? null);
  const refusal = answer && !answer.ok ? answer.error : null;
  const standing = useInstituteStanding();

  const chosen = useMemo(() => (offered ? chosenOf(offered, draft) : null), [offered, draft]);
  const choice = chosen ? choiceOf(draft, chosen) : null;
  const preview = useGiveAccessPreview(step === 'review' && given === null ? choice : null);

  // The title takes focus when the step changes in the page, and after the result (B2-05
  // `focus(pid + '-h')`); a failed check focuses its summary instead (ErrorSummary).
  const shownStep = useRef(step);
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    setErrors(null);
    setFocusTitle((count) => count + 1);
  }, [step]);
  useEffect(() => {
    if (focusTitle > 0) titleRef.current?.focus();
  }, [focusTitle]);

  // A step's address reached without the earlier steps' choices goes back to the first step that
  // is not complete (state-copy IA-05.step-address).
  const reachable = chosen && given === null ? reachableStep(step, draft, chosen) : step;
  const redirected = useRef<string | null>(null);
  useEffect(() => {
    if (reachable === step) {
      redirected.current = null;
      return;
    }
    const target = stepAddress(navigation.search, reachable);
    if (redirected.current === target) return;
    redirected.current = target;
    navigation.navigate(target, { replace: true });
  }, [reachable, step, navigation]);

  const update = (patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setErrors(null);
  };
  const fail = (found: StepErrors) => {
    setErrors(found);
    setAttempt((count) => count + 1);
  };
  const goTo = (next: GiveStep) => navigation.navigate(stepAddress(navigation.search, next));

  const onContinue = () => {
    if (!chosen) return;
    const found = step === 'experiments' ? checkExperiments(chosen) : checkTarget(draft, chosen);
    if (found) {
      fail(found);
      return;
    }
    goTo(step === 'experiments' ? 'students' : 'review');
  };
  const onBack = () => goTo(STEPS[Math.max(stepNumber(step) - 2, 0)]!);

  const refused = (error: ServiceError) => {
    if (
      error.kind === 'refused' &&
      (error.code === 'institution-paused' ||
        error.code === 'plan-ended' ||
        error.code === 'nothing-held')
    ) {
      // The options are refused the same way now: the page shows the drawn message (f15–f17).
      void options.refetch();
      return;
    }
    fail({
      title: GIVE_ACCESS.errorTitle,
      items: [{ fieldId: FIELD_IDS.give, summaryText: stateWords('IA-05.give.refused') }],
    });
    void options.refetch();
    void preview.refetch();
  };

  const onGive = async (current: GiveChoice) => {
    if (!offered || !chosen) return;
    setErrors(null);
    let result;
    try {
      result = await give.run({ ...giveInput(current), expectedPlanRev: offered.plan.rev });
    } catch {
      // Unavailable: nothing was given, every choice is kept (B2-05 f12).
      fail({
        title: GIVE_ACCESS.errorTitle,
        items: [{ fieldId: FIELD_IDS.give, summaryText: GIVE_ACCESS.giveFailed }],
      });
      return;
    }
    if (!result.ok) {
      refused(result.error);
      return;
    }
    setGiven({
      results: result.value,
      planId: offered.plan.id,
      group: current.target.kind === 'group' ? (chosen.group?.name ?? null) : null,
      experiments: chosen.experiments,
    });
    setFocusTitle((count) => count + 1);
  };

  const restart = () => {
    setGiven(null);
    setDraft(EMPTY_DRAFT);
    setPrefill({ student: null, group: null });
    setErrors(null);
    give.reset();
    navigation.navigate(stepAddress('', 'experiments'));
    setFocusTitle((count) => count + 1);
  };

  // ---- refusals: the drawn message pages (f15, f16, f17) ----
  if (refusal?.kind === 'refused' && refusal.code === 'institution-paused') {
    return (
      <Message
        title={GIVE_ACCESS.paused.title}
        line={GIVE_ACCESS.paused.line}
        actions={
          <>
            <Link className="xr-btn xr-btn--secondary" href={STUDENT_ACCESS_ADDRESS}>
              {GIVE_ACCESS.paused.back}
            </Link>
            <Link className="xr-btn xr-btn--text" href={INSTITUTE_HELP_ADDRESS}>
              {GIVE_ACCESS.paused.help}
            </Link>
          </>
        }
      />
    );
  }
  if (
    refusal?.kind === 'refused' &&
    (refusal.code === 'plan-ended' || refusal.code === 'nothing-held')
  ) {
    const overview = standing.data?.ok ? standing.data.value : null;
    if (overview === null) {
      return standing.isError || (standing.data && !standing.data.ok) ? (
        <Failed onRetry={() => void standing.refetch()} />
      ) : (
        <Loading />
      );
    }
    if (refusal.code === 'plan-ended' && overview.plan) {
      return (
        <Message
          title={planEndedTitle(overview.plan.id)}
          line={planEndedLine(overview.plan.endsOn)}
          actions={
            <Link className="xr-btn xr-btn--text" href={CONTENT_ACCESS_ADDRESS}>
              {GIVE_ACCESS.contentAccess}
            </Link>
          }
        />
      );
    }
    return (
      <Message
        title={GIVE_ACCESS.nothingHeld.title}
        line={
          overview.status === 'approved-payment-required'
            ? `${GIVE_ACCESS.nothingHeld.line} ${requestAwaitingPaymentWords(overview.institution.createdFromRequestId)}`
            : GIVE_ACCESS.nothingHeld.line
        }
        actions={
          <Link className="xr-btn xr-btn--secondary" href={CONTENT_ACCESS_ADDRESS}>
            {GIVE_ACCESS.contentAccess}
          </Link>
        }
      />
    );
  }

  const failed =
    refusal !== null ||
    options.isError ||
    students.isError ||
    plan.isError ||
    (plan.data && !plan.data.ok);
  const loading =
    !failed && (offered === null || students.data === undefined || plan.data === undefined);
  const done = given !== null;
  const current = done ? null : reachable;

  return (
    <PageContent wrap="wide">
      <BackLink href={STUDENT_ACCESS_ADDRESS}>{GIVE_ACCESS.back}</BackLink>
      <PageHeader
        className="mt-2 mb-4"
        overline={current === null ? GIVE_ACCESS.title : stepCountText(stepNumber(current), 3)}
        title={current === null ? GIVE_ACCESS.doneTitle : GIVE_ACCESS.stepTitles[current]}
        titleId={TITLE_ID}
        titleFocusTarget
        titleRef={titleRef}
      />
      {current !== null ? (
        <Stepper
          label={GIVE_ACCESS.title}
          steps={GIVE_ACCESS.steps}
          current={stepNumber(current)}
          doneWords={false}
          className="mb-6"
        />
      ) : (
        <div className="mb-5">
          <Notice tone="ok" title={GIVE_ACCESS.doneTitle}>
            {GIVE_ACCESS.doneLine}
          </Notice>
        </div>
      )}
      <div className="xw-flow">
        <div className="xw-flow-main">
          {errors ? (
            <ErrorSummary
              key={attempt}
              id="give-access-errors"
              title={errors.title}
              items={errors.items}
            />
          ) : null}
          {failed ? (
            <Failed
              inline
              onRetry={() => {
                for (const read of [options, students, plan]) void read.refetch();
              }}
            />
          ) : loading || !offered || !chosen ? (
            <LoadingState
              label={GIVE_ACCESS.loading}
              surface="section"
              className="flex flex-col gap-4 p-6"
              skeleton={
                <>
                  <Skeleton className="w-[40%]" />
                  <Skeleton />
                  <Skeleton className="w-[70%]" />
                  <Skeleton className="w-[55%]" />
                </>
              }
            />
          ) : (
            <Flow
              step={current}
              offered={offered}
              chosen={chosen}
              draft={draft}
              prefill={prefill}
              planStatus={plan.data?.ok ? plan.data.value.status : null}
              directory={students.data?.ok ? students.data.value : []}
              preview={preview}
              given={given}
              busy={give.busy}
              update={update}
              onContinue={onContinue}
              onBack={onBack}
              onGive={(next) => void onGive(next)}
              onRestart={restart}
              choice={choice}
            />
          )}
        </div>
        {current !== null && offered && chosen && !failed && !loading ? (
          <SelectionSummary offered={offered} chosen={chosen} draft={draft} variant="aside" />
        ) : null}
      </div>
    </PageContent>
  );
}

/** The flow's body once the options are read: the prefill notice, the step, the summary bar. */
function Flow({
  step,
  offered,
  chosen,
  draft,
  prefill,
  planStatus,
  directory,
  preview,
  given,
  busy,
  update,
  onContinue,
  onBack,
  onGive,
  onRestart,
  choice,
}: {
  readonly step: GiveStep | null;
  readonly offered: GiveAccessOptions;
  readonly chosen: ReturnType<typeof chosenOf>;
  readonly draft: Draft;
  readonly prefill: Prefill;
  readonly planStatus: Parameters<typeof ExperimentsStep>[0]['planStatus'];
  readonly directory: Parameters<typeof StudentsStep>[0]['directory'];
  readonly preview: ReturnType<typeof useGiveAccessPreview>;
  readonly given: GivenResult | null;
  readonly busy: boolean;
  readonly update: (patch: Partial<Draft>) => void;
  readonly onContinue: () => void;
  readonly onBack: () => void;
  readonly onGive: (choice: GiveChoice) => void;
  readonly onRestart: () => void;
  readonly choice: GiveChoice | null;
}) {
  if (step === null && given !== null) {
    return <ResultSection given={given} onRestart={onRestart} />;
  }
  const prefilledStudent =
    draft.who === 'students' &&
    prefill.student !== null &&
    chosen.students.some((student) => student.id === prefill.student);
  const prefilledGroup =
    draft.who === 'group' && prefill.group !== null && chosen.group?.id === prefill.group;
  return (
    <>
      {prefilledStudent ? (
        <Notice tone="quiet" icon="person">
          {GIVE_ACCESS.prefillStudent.before}
          <strong>{studentsChosenWords(chosen.students.map((student) => student.name))}</strong>
          {GIVE_ACCESS.prefillStudent.after}
        </Notice>
      ) : null}
      {prefilledGroup && chosen.group ? (
        <Notice tone="quiet" icon="person">
          {GIVE_ACCESS.prefillGroup.before}
          <strong>{chosen.group.name}</strong>
          {GIVE_ACCESS.prefillGroup.after}
        </Notice>
      ) : null}
      {step === 'experiments' ? (
        <ExperimentsStep
          offered={offered}
          chosen={chosen}
          draft={draft}
          planStatus={planStatus}
          update={update}
          onContinue={onContinue}
        />
      ) : step === 'students' ? (
        <StudentsStep
          offered={offered}
          chosen={chosen}
          draft={draft}
          directory={directory}
          update={update}
          onBack={onBack}
          onContinue={onContinue}
        />
      ) : step === 'review' && choice !== null ? (
        <ReviewStep
          offered={offered}
          chosen={chosen}
          draft={draft}
          choice={choice}
          preview={preview}
          busy={busy}
          onBack={onBack}
          onGive={() => onGive(choice)}
        />
      ) : null}
      <SelectionSummary offered={offered} chosen={chosen} draft={draft} variant="bar" />
    </>
  );
}

/** B2-05 f15–f17: the message page in place of the flow (`xr-wrap--read`, `xr-msg`). */
function Message({
  title,
  line,
  actions,
}: {
  readonly title: string;
  readonly line: string;
  readonly actions: ReactNode;
}) {
  return (
    <PageContent wrap="read">
      <div className="xr-msg mx-0 my-6">
        <span className="xr-msg-icon">
          <Icon name="readOnly" />
        </span>
        <h1 className="xr-msg-title">{title}</h1>
        <p className="xr-lead">{line}</p>
        <div className="xr-msg-actions">{actions}</div>
      </div>
    </PageContent>
  );
}

/** The options could not be read (state-copy IA-05.failed): in the flow, or alone. */
function Failed({
  onRetry,
  inline = false,
}: {
  readonly onRetry: () => void;
  readonly inline?: boolean;
}) {
  const state = (
    <FailedState title={stateWords('IA-05.failed')} onRetry={onRetry}>
      {stateWords('IA-05.failed.line')}
    </FailedState>
  );
  return inline ? state : <PageContent wrap="read">{state}</PageContent>;
}

function Loading() {
  return (
    <PageContent wrap="read">
      <LoadingState label={GIVE_ACCESS.loading} surface="section" className="p-6" lines={3} />
    </PageContent>
  );
}
