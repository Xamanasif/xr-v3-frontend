'use client';

import type { ServiceError } from '@xr/contracts/draft';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  ErrorSummary,
  IaGiveLayout,
  IaMessageCard,
  IaStack,
  IaSteps,
  ListState,
  LoadingRows,
  Notice,
  PageHead,
  TextLink,
} from '@xr/ui/v3';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import {
  IA05,
  planEndedLine,
  prefillGroupTitle,
  prefillStudentTitle,
  stepOfWords,
} from '@/copy/ia-access';
import { stateWords } from '@/copy/state-copy';
import { GIVE_ACCESS, type GiveStep } from '@/copy/student-access';
import {
  CONTENT_ACCESS_ADDRESS,
  INSTITUTE_HELP_ADDRESS,
  STUDENT_ACCESS_ADDRESS,
  underPlacement,
} from '@/nav/institute';
import { INSTITUTE_REQUESTS_ADDRESS } from '@/nav/institute-requests';
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
import { useInstituteTodayLine } from '../shared/use-today-line';
import {
  ExperimentsStep,
  type GivenResult,
  ResultSection,
  ReviewStep,
  SelectionFold,
  SelectionPanel,
  StudentsStep,
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

const TITLE_ID = 'ia-h1';

/**
 * IA-05 Give students access — the owner-approved V3 design (design/v3-refined-b/roles/IA-v1,
 * `Main.dc.html` `R.rIA05`, `vm05`), at `/institute/student-access/give`
 * (`?step=experiments|students|review`; pre-filled by `?student=`, `?group=`, `?course=`,
 * `?experiment=`).
 *
 * - **Read**: `StudentAccessService.getGiveAccessOptions` — the plan, the course's experiments in
 *   the plan (formats inherited, LD-1) and the ones published but not in it, the students and the
 *   groups, each with whether the service offers it (already has it, inactive, an empty group) —
 *   with each student's ID and groups from `PeopleService.listStudents` and the plan's status from
 *   `InstitutionService.getAccessPlan`. Refused while paused, after the plan has ended and before
 *   anything is held: the message in place of the flow, named from the institution's overview.
 * - **Three steps** in the address, with the numbered step indicator and "Your selection" beside
 *   steps 1 and 2 (folded into one line under the steps on narrow pages): experiments → students
 *   or a group → review. "Continue" checks the step with the contract's own input schema (the error
 *   summary takes focus); the review is the service's preview (`previewGiveAccess`, which writes
 *   nothing): what will be created, whom it reaches and how each stands — a wait only where the
 *   service supplies one (D7).
 * - **Act**: "Give access" sends `giveAccess` once, with the plan's revision as read
 *   (`expectedPlanRev`). The result lists each grant by who, what and its status — never by its
 *   id — with a link to the student or the group; "View Student access" and "Give more access". A
 *   failure keeps every choice; a refusal says so and reads the options again.
 */
export function GiveAccess() {
  useShellPage(underPlacement('IA-05', GIVE_ACCESS.title));
  const navigation = useAppNavigation();
  const date = useInstituteTodayLine();
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

  // The title takes focus when the step changes in the page, and after the result (the export's
  // `focusLater('ia-h1')`); a failed check focuses its summary instead (ErrorSummary).
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
      // The options are refused the same way now: the page shows the message.
      void options.refetch();
      return;
    }
    fail({
      title: IA05.errorTitle,
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
      // Unavailable: nothing was given, every choice is kept.
      fail({
        title: IA05.errorTitle,
        items: [{ fieldId: FIELD_IDS.give, summaryText: IA05.giveFailed }],
      });
      return;
    }
    if (!result.ok) {
      refused(result.error);
      return;
    }
    setGiven({
      results: result.value,
      group:
        current.target.kind === 'group' && chosen.group
          ? { id: chosen.group.id, name: chosen.group.name }
          : null,
      students: chosen.students.map((student) => ({ id: student.id, name: student.name })),
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

  const crumbs = (
    <Breadcrumbs
      levels={[{ label: IA05.crumb, href: STUDENT_ACCESS_ADDRESS }]}
      current={IA05.title}
    />
  );

  // ---- refusals: the message in place of the flow (paused, ended, nothing held) ----
  if (refusal?.kind === 'refused' && refusal.code === 'institution-paused') {
    return (
      <>
        {crumbs}
        <IaMessageCard
          icon="pauseCircle"
          title={IA05.paused.title}
          actions={
            <>
              <ButtonLink variant="navy" href={STUDENT_ACCESS_ADDRESS}>
                {IA05.paused.back}
              </ButtonLink>
              <TextLink href={INSTITUTE_HELP_ADDRESS}>{IA05.paused.help}</TextLink>
            </>
          }
        >
          {IA05.paused.line}
        </IaMessageCard>
      </>
    );
  }
  if (
    refusal?.kind === 'refused' &&
    (refusal.code === 'plan-ended' || refusal.code === 'nothing-held')
  ) {
    const overview = standing.data?.ok ? standing.data.value : null;
    if (overview === null) {
      return (
        <>
          {crumbs}
          {standing.isError || (standing.data && !standing.data.ok) ? (
            <Failed onRetry={() => void standing.refetch()} />
          ) : (
            <LoadingRows message={GIVE_ACCESS.loading} rows={1} cells={[1]} />
          )}
        </>
      );
    }
    if (refusal.code === 'plan-ended' && overview.plan) {
      return (
        <>
          {crumbs}
          <IaMessageCard
            icon="ended"
            title={IA05.ended.title}
            actions={
              <>
                {/* "Request renewal" opens Requests (IA-17). */}
                <ButtonLink variant="navy" href={INSTITUTE_REQUESTS_ADDRESS}>
                  {IA05.ended.renewal}
                </ButtonLink>
                <TextLink href={CONTENT_ACCESS_ADDRESS}>{IA05.contentAccess}</TextLink>
              </>
            }
          >
            {planEndedLine(overview.plan.endsOn)}
          </IaMessageCard>
        </>
      );
    }
    return (
      <>
        {crumbs}
        <IaMessageCard
          icon="contentAccess"
          title={IA05.nothingHeld.title}
          actions={
            <ButtonLink variant="navy" href={CONTENT_ACCESS_ADDRESS}>
              {IA05.contentAccess}
            </ButtonLink>
          }
        >
          {overview.status === 'approved-payment-required'
            ? `${IA05.nothingHeld.line} ${IA05.nothingHeld.approved}`
            : IA05.nothingHeld.line}
        </IaMessageCard>
      </>
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
  const ready = !failed && !loading && offered !== null && chosen !== null;
  // The running summary helps while choosing (steps 1–2); the review and the result say all of it.
  const summary = ready && (current === 'experiments' || current === 'students');

  let sheet: ReactNode;
  if (failed) {
    sheet = (
      <IaStack sec>
        <Failed
          onRetry={() => {
            for (const read of [options, students, plan]) void read.refetch();
          }}
        />
      </IaStack>
    );
  } else if (!ready) {
    sheet = (
      <IaStack sec>
        <LoadingRows message={GIVE_ACCESS.loading} rows={2} cells={[2, 1]} />
      </IaStack>
    );
  } else if (done) {
    sheet = <ResultSection given={given} onRestart={restart} />;
  } else {
    sheet = (
      <>
        {errors ? (
          <IaStack sec>
            <ErrorSummary
              key={attempt}
              id="give-access-errors"
              title={errors.title}
              items={errors.items}
            />
          </IaStack>
        ) : null}
        <Prefilled prefill={prefill} draft={draft} chosen={chosen} />
        {current === 'experiments' ? (
          <ExperimentsStep
            offered={offered}
            chosen={chosen}
            draft={draft}
            planStatus={plan.data?.ok ? plan.data.value.status : null}
            update={update}
            onContinue={onContinue}
          />
        ) : current === 'students' ? (
          <StudentsStep
            offered={offered}
            chosen={chosen}
            draft={draft}
            directory={students.data?.ok ? students.data.value : []}
            update={update}
            onBack={onBack}
            onContinue={onContinue}
          />
        ) : current === 'review' && choice !== null ? (
          <ReviewStep
            offered={offered}
            chosen={chosen}
            draft={draft}
            choice={choice}
            preview={preview}
            busy={give.busy}
            onBack={onBack}
            onGive={() => void onGive(choice)}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      {crumbs}
      <PageHead
        title={current === null ? IA05.doneTitle : IA05.stepTitles[current]}
        titleId={TITLE_ID}
        titleRef={titleRef}
        titleFocusTarget
        date={date}
        eyebrow={current === null ? IA05.title : stepOfWords(stepNumber(current))}
      />
      <IaSteps
        label={IA05.stepsLabel}
        steps={IA05.steps.map((label, index) => ({ key: STEPS[index]!, label }))}
        current={current === null ? IA05.steps.length + 1 : stepNumber(current)}
        stateWords={{ done: IA05.stepDone, current: IA05.stepCurrent }}
      />
      {summary ? <SelectionFold offered={offered} chosen={chosen} draft={draft} /> : null}
      <IaGiveLayout
        asideLabel={IA05.selection}
        aside={summary ? <SelectionPanel offered={offered} chosen={chosen} draft={draft} /> : null}
      >
        {sheet}
      </IaGiveLayout>
    </>
  );
}

/** The pre-fill notice: who was chosen from the student record or the group page (until step 3). */
function Prefilled({
  prefill,
  draft,
  chosen,
}: {
  readonly prefill: Prefill;
  readonly draft: Draft;
  readonly chosen: NonNullable<ReturnType<typeof chosenOf>>;
}) {
  const student =
    draft.who === 'students' && prefill.student !== null
      ? (chosen.students.find((entry) => entry.id === prefill.student) ?? null)
      : null;
  const group =
    draft.who === 'group' && prefill.group !== null && chosen.group?.id === prefill.group
      ? chosen.group
      : null;
  if (!student && !group) return null;
  return (
    <IaStack sec>
      <Notice
        tone="info"
        icon="infoNote"
        role="status"
        title={student ? prefillStudentTitle(student.name) : prefillGroupTitle(group!.name)}
      >
        {student ? IA05.prefillStudentLine : IA05.prefillGroupLine}
      </Notice>
    </IaStack>
  );
}

/** The options could not be read (state-copy IA-05.failed): Try again reads them again. */
function Failed({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <ListState
      kind="failed"
      title={stateWords('IA-05.failed')}
      action={<Button onClick={onRetry}>{IA05.tryAgain}</Button>}
    >
      {stateWords('IA-05.failed.line')}
    </ListState>
  );
}
