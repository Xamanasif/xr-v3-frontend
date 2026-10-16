'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { ReturnReference, SubmissionId, Technology } from '@xr/domain';
import {
  BackLink,
  ConfirmDialog,
  ErrorSummary,
  FailedState,
  Icon,
  LoadingState,
  Notice,
  PageContent,
  PageHeader,
  Skeleton,
  Stepper,
} from '@xr/ui';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { dateTime } from '@/copy/dates';
import { stateWords } from '@/copy/state-copy';
import {
  changesSavedWords,
  CHECK_STEP,
  courseWords,
  draftSavedWords,
  EDITOR,
  idLineWords,
  noLongerAssignedLine,
  noLongerAssignedTitle,
  overlineWords,
  PREVIEW_STEP,
  SUBMIT_DIALOG,
  submitEffect,
} from '@/copy/vendor-editor';
import { useAppNavigation } from '@/nav/navigation';
import {
  editDraftAddress,
  editorPlacement,
  editorStepOf,
  type EditorStepSlug,
  MY_EXPERIMENTS_ADDRESS,
  MY_EXPERIMENTS_TITLE,
  newExperimentAddress,
  reviseAddress,
} from '@/nav/vendor';
import { usePublicCourse } from '@/queries/catalogue';
import { useExperimentEditor, useVendorRecord } from '@/queries/production';
import { useSession } from '@/queries/session';
import { checkDraftSave, checkEditorStep, checkWholeExperiment } from '@/queries/production-editor';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { ReturnedNotice } from '../shared/returned-notice';
import {
  clearEditorDraft,
  forgetSavedLine,
  leaveSavedLine,
  savedLineFor,
  useEditorDraft,
  useSessionKey,
} from './editor-draft';
import { DoneState, NotEditableView, ReadOnlyView } from './editor-states';
import {
  CheckStep,
  CourseStep,
  type FieldChange,
  FormatsStep,
  PreviewStep,
  type StepActions,
} from './editor-steps';
import {
  checklistRows,
  contentOf,
  DONE_ID,
  draftOf,
  editableMode,
  type EditorError,
  editorErrors,
  type EditorField,
  EMPTY_EDITOR_DRAFT,
  ERRORS_ID,
  fieldId,
  MISSING_ID,
  type MissingItem,
  missingItems,
  type PackageFormat,
  previousStep,
  REASON_ID,
  referenceTarget,
  samplePackageFileName,
  SAVED_ID,
  stepNumber,
  stepOfField,
  summaryRows,
  TITLE_ID,
} from './editor-view';

type Mode = 'create' | 'edit' | 'revise';

/** The errors on show, with the step they belong to (a step shows only its own). */
interface StepErrors {
  readonly step: EditorStepSlug;
  readonly items: readonly EditorError[];
  /** The summary takes focus (a failed Continue or Save); a "Go to …" focuses the field instead. */
  readonly focusSummary: boolean;
}

/** What Submit or Resubmit answered (B5-05 f1; B5-07 f4). */
interface Done {
  readonly kind: 'submitted' | 'resubmitted';
  readonly id: string;
  readonly name: string;
}

/** Where focus goes once the page shows it (the board's `focus(pid + …)`). */
interface FocusRequest {
  readonly id: string;
  readonly seq: number;
}

const STEP_ORDER: readonly EditorStepSlug[] = ['course', 'formats', 'preview', 'submit'];

/**
 * The experiment editor — VE-03 Course and description, VE-04 Formats and delivery, VE-05 Preview
 * and documents, VE-06 Check and submit (boards B5-03, B5-04, B5-05) for a new experiment
 * (`/vendor/experiments/new?step=`), VE-09 for a saved draft (`/[id]/edit?step=`, B5-07 f5) and
 * VE-08 for a returned one (`/[id]/revise?step=`, B5-07 f0 … f4, f7, f8; B5-08 f0).
 *
 * - **Read**: `ProductionService.getEditor` — the record (or none yet), only the courses assigned
 *   to the Vendor's organisation and whether it opens read-only (a draft whose course is no longer
 *   assigned, OD-B5-01: B5-07 f6; any record that is not a draft or returned). Revise mode also
 *   reads the record's last return (`getRecord`): the reason box above the stepper, whose “What it
 *   refers to” opens the step and field (OD-B5-10).
 * - **Four steps** in the address (`?step=`; a saved draft opens where it was last saved,
 *   state-copy `VE-09.opens-at`). Continue checks the step with the contract's own rules first
 *   (`editorStepIssues` after `submissionContentInput`), then asks `continueStep` — the service
 *   answers the name already in use (f4) and a course withdrawn meanwhile (f5). Field errors and
 *   the drawn summary “Check this step” (f3), which takes focus. What is typed is kept per signed-in
 *   person and record for the tab's life (state-copy `VE-03.kept`).
 * - **Save draft** needs only a name; the first save mints the SUB id and the address becomes the
 *   draft's own (f6, state-copy `VE-03.first-save`). Revise mode's **Save changes** keeps them
 *   without resubmitting. **Submit** lists what is missing with a way to each step (B5-05 f5) or
 *   opens DL-1 (f6; “It does not publish anything”), then shows the drawn result (f1); **Resubmit**
 *   through DL-1 shows “Submitted” (B5-07 f4) — the next gate is never named (M-3). Documents and
 *   package files are file names only; nothing is uploaded (OD-B5-11).
 * - Every command carries the record's `rev`. A stale or moved-on record is read again and what was
 *   typed stays; a failure for now keeps everything and says nothing was saved or sent.
 */
export function ExperimentEditor({
  mode,
  submissionId,
}: {
  readonly mode: Mode;
  readonly submissionId: string | null;
}) {
  const navigation = useAppNavigation();
  const step = editorStepOf(navigation.search);
  const hasStep = new URLSearchParams(navigation.search).has('step');
  useShellPage(editorPlacement(mode, step, MY_EXPERIMENTS_TITLE));
  const sessionKey = useSessionKey();
  const session = useSession();
  const sessionOrganisation =
    session.status === 'signed-in' ? (session.session.organisation ?? '') : '';
  const record = submissionId ?? 'new';

  const editorRead = useExperimentEditor(submissionId);
  const editorAnswer = editorRead.data;
  const editor = editorAnswer?.ok ? editorAnswer.value : null;
  const submission = editor?.submission ?? null;
  const returnRead = useVendorRecord(mode === 'revise' ? submissionId : null);
  const recordView = returnRead.data?.ok ? returnRead.data.value : null;

  const base = useMemo(
    () => (editor === null ? null : submission ? draftOf(submission.content) : EMPTY_EDITOR_DRAFT),
    [editor, submission],
  );
  const [draft, , update] = useEditorDraft(record, base);

  const [errors, setErrors] = useState<StepErrors | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState<string | null>(() => savedLineFor(sessionKey, record));
  useEffect(() => forgetSavedLine(sessionKey, record), [sessionKey, record]);
  const [notice, setNotice] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [missing, setMissing] = useState(false);
  // The first save's saved line takes focus on the draft's own address (B5-03 f6 `focus(pid + '-saved')`).
  const [focus, setFocus] = useState<FocusRequest | null>(() =>
    savedLineFor(sessionKey, record) ? { id: SAVED_ID, seq: 1 } : null,
  );
  const handledFocus = useRef(0);

  const saveDraft = useCommand((ports) => ports.production.saveDraft);
  const saveRevision = useCommand((ports) => ports.production.saveRevision);
  const continueStep = useCommand((ports) => ports.production.continueStep);
  const submitForReview = useCommand((ports) => ports.production.submitForReview);
  const resubmit = useCommand((ports) => ports.production.resubmit);

  const requestFocus = useCallback((id: string) => {
    setFocus((current) => ({ id, seq: (current?.seq ?? 0) + 1 }));
  }, []);

  // Focus moves once the element is on show (the step's address may change first).
  useEffect(() => {
    if (focus === null || handledFocus.current === focus.seq) return;
    const element = document.getElementById(focus.id);
    if (!element) return;
    handledFocus.current = focus.seq;
    element.focus();
  });

  // The record's own mode (state-copy `VE-03.mode-address`) and, for a draft opened without a
  // step, the step where it was last saved (`VE-09.opens-at`) — once per opening.
  const opened = useRef(false);
  useEffect(() => {
    if (!submission || !submissionId || done) return;
    const own = editableMode(submission);
    if (own !== null && own !== mode) {
      navigation.navigate(
        own === 'revise' ? reviseAddress(submissionId, step) : editDraftAddress(submissionId, step),
        { replace: true },
      );
      return;
    }
    if (opened.current) return;
    opened.current = true;
    if (mode === 'edit' && !hasStep && submission.lastStepReached !== 'course') {
      navigation.navigate(editDraftAddress(submissionId, submission.lastStepReached), {
        replace: true,
      });
    }
  }, [submission, submissionId, done, mode, navigation, step, hasStep]);

  // A new step: its own errors only, no saved line (B5-03 `go`).
  const [lastStep, setLastStep] = useState(step);
  if (lastStep !== step) {
    setLastStep(step);
    setSaved(null);
    setNotice(null);
    if (errors === null || errors.step !== step) setErrors(null);
  }

  const addressOf = useCallback(
    (target: EditorStepSlug, id: string | null = submissionId) =>
      id === null
        ? newExperimentAddress(target)
        : mode === 'revise'
          ? reviseAddress(id, target)
          : editDraftAddress(id, target),
    [mode, submissionId],
  );
  /** Opens a step; focus goes to its title (B5-03 `go` → `focus(pid + '-h')`) or to `focusId`. */
  const goTo = (target: EditorStepSlug, focusId: string | null = TITLE_ID) => {
    if (focusId !== null) requestFocus(focusId);
    navigation.navigate(addressOf(target));
  };

  /** Shows the errors on the earliest step they belong to, moving there if needed. */
  const fail = (items: readonly EditorError[], focusSummary = true) => {
    if (items.length === 0) return;
    const at = [...items]
      .map((item) => stepOfField(item.field))
      .sort((a, b) => STEP_ORDER.indexOf(a) - STEP_ORDER.indexOf(b))[0]!;
    setErrors({
      step: at,
      items: items.filter((item) => stepOfField(item.field) === at),
      focusSummary,
    });
    setAttempt((count) => count + 1);
    if (at !== step) goTo(at, null);
  };

  const content = contentOf(draft);
  const whole = checkWholeExperiment(content);
  const missingList: readonly MissingItem[] = whole ? missingItems(editorErrors(whole)) : [];

  const refused = (error: ServiceError, action: 'continue' | 'save' | 'submit') => {
    if (error.kind === 'validation-failed') {
      fail(editorErrors(error));
    } else if (error.kind === 'refused' && error.code === 'submit-checklist-incomplete') {
      setTried(true);
      requestFocus(MISSING_ID);
    } else if (error.kind === 'refused' && error.code === 'course-not-assigned') {
      // The draft's course was withdrawn: the read now opens it read-only (B5-07 f6).
      void editorRead.refetch();
    } else if (error.kind === 'stale-version') {
      void editorRead.refetch();
      setNotice(stateWords('VE-03.stale'));
    } else if (error.kind === 'invalid-state') {
      void editorRead.refetch();
      setNotice(stateWords('VE-03.moved-on'));
    } else if (error.kind === 'not-found' || error.kind === 'not-permitted') {
      setMissing(true);
    } else {
      setNotice(unavailableWords(action, mode));
    }
  };

  const onChange: FieldChange = (field, change) => {
    update(change);
    setSaved(null);
    setErrors((current) =>
      current
        ? { ...current, items: current.items.filter((item) => item.field !== field) }
        : current,
    );
  };

  const onToggle = (format: Technology) => {
    onChange('formats', (current) => ({
      ...current,
      formats: current.formats.includes(format)
        ? current.formats.filter((each) => each !== format)
        : [...current.formats, format],
    }));
  };

  const onAttach = (format: PackageFormat, attach: boolean) => {
    onChange(`${format}.packageReference`, (current) => ({
      ...current,
      packages: {
        ...current.packages,
        [format]: {
          ...current.packages[format],
          packageFileName: attach ? samplePackageFileName(current, format) : null,
        },
      },
    }));
  };

  const pool = PREVIEW_STEP.documentPool.filter((name) => !draft.documents.includes(name));
  const onAddDocument =
    pool.length > 0
      ? () =>
          update((current) => {
            const next = PREVIEW_STEP.documentPool.find(
              (name) => !current.documents.includes(name),
            );
            return next ? { ...current, documents: [...current.documents, next] } : current;
          })
      : null;
  const onRemoveDocument = (fileName: string) =>
    update((current) => ({
      ...current,
      documents: current.documents.filter((name) => name !== fileName),
    }));

  const onContinue = () => {
    if (step === 'submit' || continueStep.busy) return;
    setNotice(null);
    const local = checkEditorStep(step, content);
    if (local) {
      fail(editorErrors(local));
      return;
    }
    continueStep.run({ id: submissionId as SubmissionId | null, content, from: step }).then(
      (answer) => {
        if (answer.ok) {
          setErrors(null);
          goTo(answer.value.next);
        } else {
          refused(answer.error, 'continue');
        }
      },
      () => setNotice(stateWords('VE-03.continue-unavailable')),
    );
  };

  const onSave = () => {
    if (saveDraft.busy || saveRevision.busy) return;
    setNotice(null);
    const local = checkDraftSave(content);
    if (local) {
      fail(editorErrors(local));
      return;
    }
    const revising = mode === 'revise' && submission !== null;
    const sent = revising
      ? saveRevision.run({ id: submission.id, content, expectedRev: submission.rev })
      : saveDraft.run({
          id: submissionId as SubmissionId | null,
          content,
          step,
          expectedRev: submission?.rev ?? null,
        });
    sent.then(
      (answer) => {
        if (!answer.ok) {
          refused(answer.error, 'save');
          return;
        }
        const at = dateTime(answer.value.updatedAt);
        const words = revising ? changesSavedWords(at) : draftSavedWords(at);
        clearEditorDraft(sessionKey, record);
        setErrors(null);
        if (submissionId === null) {
          // f6: the first save gives the id; the draft's own address (state-copy `VE-03.first-save`).
          leaveSavedLine(sessionKey, answer.value.id, words);
          navigation.navigate(editDraftAddress(answer.value.id, step), { replace: true });
        } else {
          setSaved(words);
          requestFocus(SAVED_ID);
        }
      },
      () => setNotice(unavailableWords('save', mode)),
    );
  };

  const onSubmit = () => {
    setNotice(null);
    if (missingList.length > 0) {
      setTried(true);
      requestFocus(MISSING_ID);
      return;
    }
    setDialog(true);
  };

  const onConfirm = () => {
    if (submitForReview.busy || resubmit.busy) return;
    const revising = mode === 'revise' && submission !== null;
    const sent = revising
      ? resubmit.run({ id: submission.id, content, expectedRev: submission.rev })
      : submitForReview.run({
          id: submissionId as SubmissionId | null,
          content,
          expectedRev: submission?.rev ?? null,
        });
    sent.then(
      (answer) => {
        setDialog(false);
        if (!answer.ok) {
          refused(answer.error, 'submit');
          return;
        }
        clearEditorDraft(sessionKey, record);
        setErrors(null);
        setDone({
          kind: revising ? 'resubmitted' : 'submitted',
          id: answer.value.id,
          name: answer.value.content.name,
        });
        requestFocus(DONE_ID);
      },
      () => {
        setDialog(false);
        setNotice(unavailableWords('submit', mode));
      },
    );
  };

  /** A missing item's “Go to …”: its step with that step's errors, focus on the field (`m.go`). */
  const onGoTo = (item: MissingItem) => {
    const local = checkEditorStep(item.step, content);
    const items = local ? editorErrors(local) : [];
    setErrors({ step: item.step, items, focusSummary: false });
    goTo(item.step, fieldId(item.field));
  };

  /** A “What it refers to” link (state-copy `VE-08.reference-jump`). */
  const onJump = (reference: ReturnReference) => {
    const target = referenceTarget(reference, draft);
    setErrors(null);
    if (target.step !== step) goTo(target.step, fieldId(target.field));
    else requestFocus(fieldId(target.field));
  };

  const onCancel = () => clearEditorDraft(sessionKey, record);

  // ---- the chosen course's words (a course withdrawn meanwhile is named from the catalogue) ----
  const courses = editor?.assignedCourses ?? [];
  const assigned = courses.find((course) => course.id === draft.courseId) ?? null;
  const withdrawnId =
    draft.courseId !== null && editor !== null && assigned === null ? draft.courseId : null;
  const recordCourseId = submission?.content.courseId ?? null;
  const lookupId = withdrawnId ?? (editor?.readOnly ? recordCourseId : null);
  const lookup = usePublicCourse(lookupId ?? '', { enabled: lookupId !== null });
  const lookedUp = lookup.data?.ok ? lookup.data.value.course : null;
  const withdrawn =
    withdrawnId !== null
      ? { code: lookedUp?.platformCode ?? null, name: lookedUp?.name ?? withdrawnId }
      : null;
  const courseLine = assigned
    ? courseWords(assigned.platformCode, assigned.name)
    : withdrawn
      ? courseWords(withdrawn.code, withdrawn.name)
      : null;

  if (missing) navigation.notFound();
  const readFailed =
    editorRead.isError ||
    (editorAnswer !== undefined && !editorAnswer.ok && editorAnswer.error.kind === 'unavailable');
  if (
    editorAnswer !== undefined &&
    !editorAnswer.ok &&
    (editorAnswer.error.kind === 'not-found' || editorAnswer.error.kind === 'not-permitted')
  ) {
    navigation.notFound();
  }

  const back = <BackLink href={MY_EXPERIMENTS_ADDRESS}>{EDITOR.back}</BackLink>;
  const frame = (children: ReactNode) => (
    <PageContent wrap="form">
      <div className="flex flex-col gap-4">{children}</div>
    </PageContent>
  );

  if (done) {
    return frame(
      <>
        {back}
        <DoneState kind={done.kind} id={done.id} name={done.name} />
      </>,
    );
  }

  // Any other refusal (policy-open ROLE-11 / SUB-15): a calm notice, never an endless skeleton.
  if (
    editorAnswer !== undefined &&
    !editorAnswer.ok &&
    !['not-found', 'not-permitted', 'unavailable'].includes(editorAnswer.error.kind)
  ) {
    return frame(
      <>
        {back}
        <Notice tone="info" title={stateWords('VE-03.policy-open')} />
      </>,
    );
  }

  if (readFailed) {
    return frame(
      <>
        {back}
        <FailedState title={stateWords('VE-03.failed')} onRetry={() => void editorRead.refetch()}>
          {stateWords('VE-03.failed-line')}
        </FailedState>
      </>,
    );
  }

  const lookupPending = lookupId !== null && lookup.isPending;
  if (editor === null || base === null || (editor.readOnly && lookupPending)) {
    return frame(
      <>
        {back}
        <LoadingState
          label={stateWords('VE-03.loading')}
          surface="section"
          className="flex flex-col gap-4 p-6"
          skeleton={
            <>
              <Skeleton className="w-[40%]" />
              <Skeleton />
              <Skeleton className="w-[70%]" />
            </>
          }
        />
      </>,
    );
  }

  if (submission && editor.readOnly) {
    const courseNoLongerAssigned =
      submission.status.state === 'draft' &&
      recordCourseId !== null &&
      !courses.some((course) => course.id === recordCourseId);
    const code = lookedUp?.platformCode ?? null;
    const recordCourse = lookedUp
      ? courseWords(lookedUp.platformCode, lookedUp.name)
      : (recordCourseId ?? CHECK_STEP.notChosen);
    return frame(
      <>
        {back}
        {courseNoLongerAssigned ? (
          <ReadOnlyView
            submission={submission}
            code={code}
            courseLine={recordCourse}
            noticeTitle={noLongerAssignedTitle(code ?? recordCourse)}
            noticeLine={noLongerAssignedLine(recordCourse, submission.vendorOrganisation, null)}
          />
        ) : (
          <NotEditableView submission={submission} code={code} courseLine={recordCourse} />
        )}
      </>,
    );
  }

  // ---- the editor ----
  const shownErrors = errors && errors.step === step ? errors.items : [];
  const errorOf = (field: EditorField) => shownErrors.find((item) => item.field === field)?.message;
  const revising = mode === 'revise';
  const shownMode: Mode = submissionId === null ? 'create' : mode;
  const organisation = submission?.vendorOrganisation ?? sessionOrganisation;
  const actions: StepActions = {
    saveLabel: revising ? EDITOR.saveChanges : EDITOR.saveDraft,
    onSave,
    saving: saveDraft.busy || saveRevision.busy,
    onContinue,
    continuing: continueStep.busy,
    onCancel,
    onBack: () => goTo(previousStep(step)),
  };

  return frame(
    <>
      <PageHeader
        className="[margin:8px_0_0]"
        back={back}
        overline={overlineWords(shownMode, stepNumber(step))}
        title={EDITOR.stepTitles[step]}
        titleId={TITLE_ID}
        titleFocusTarget
        meta={
          <span className="xl-meta">
            {idLineWords(submission?.id ?? null, shownMode, submission?.revision ?? 1)}
          </span>
        }
      />
      {revising && submission && recordView ? (
        <ReturnedNotice
          id={REASON_ID}
          lastReturn={recordView.lastReturn}
          submission={submission}
          onJump={onJump}
        />
      ) : null}
      <Stepper
        label={EDITOR.stepsLabel}
        steps={EDITOR.steps}
        current={stepNumber(step)}
        doneWords={false}
        className="[margin:8px_0_8px]"
      />
      {saved ? (
        <p className="xa-save is-ok m-0" role="status" id={SAVED_ID} tabIndex={-1}>
          <Icon name="done" />
          {saved}
        </p>
      ) : null}
      {shownErrors.length > 0 ? (
        <ErrorSummary
          key={attempt}
          id={ERRORS_ID}
          title={EDITOR.summaryTitle}
          autoFocus={errors?.focusSummary ?? true}
          items={shownErrors.map((item) => ({
            fieldId: fieldId(item.field),
            summaryText: item.summaryText,
          }))}
        />
      ) : null}
      {notice ? <Notice tone="err">{notice}</Notice> : null}
      {step === 'course' ? (
        <CourseStep
          draft={draft}
          courses={courses}
          organisation={organisation}
          withdrawn={withdrawn}
          errorOf={errorOf}
          onChange={onChange}
          actions={actions}
        />
      ) : step === 'formats' ? (
        <FormatsStep
          draft={draft}
          errorOf={errorOf}
          onChange={onChange}
          onToggle={onToggle}
          onAttach={onAttach}
          actions={actions}
        />
      ) : step === 'preview' ? (
        <PreviewStep
          draft={draft}
          errorOf={errorOf}
          onChange={onChange}
          onAddDocument={onAddDocument}
          onRemoveDocument={onRemoveDocument}
          actions={actions}
        />
      ) : (
        <CheckStep
          missing={missingList}
          tried={tried}
          checklist={checklistRows(missingList, draft)}
          summary={summaryRows(draft, courseLine)}
          outcomes={submission?.learningOutcomes ?? []}
          submitLabel={revising ? CHECK_STEP.resubmit : CHECK_STEP.submit}
          onGoTo={onGoTo}
          onChangeStep={(target) => goTo(target)}
          onSubmit={onSubmit}
          actions={actions}
        />
      )}
      <ConfirmDialog
        open={dialog}
        align="end"
        idPrefix="Ve-s"
        title={revising ? SUBMIT_DIALOG.resubmitTitle : SUBMIT_DIALOG.submitTitle}
        effect={
          <strong>
            {revising ? SUBMIT_DIALOG.resubmitEffect : submitEffect(draft.name.trim())}
          </strong>
        }
        notice={<p className="m-0">{SUBMIT_DIALOG.whileReviewed}</p>}
        cancelLabel={revising ? SUBMIT_DIALOG.keepEditing : SUBMIT_DIALOG.cancel}
        confirmLabel={revising ? CHECK_STEP.resubmit : CHECK_STEP.submit}
        busy={submitForReview.busy || resubmit.busy}
        busyLabel={SUBMIT_DIALOG.submitting}
        onConfirm={onConfirm}
        onCancel={() => setDialog(false)}
      />
    </>,
  );
}

function unavailableWords(action: 'continue' | 'save' | 'submit', mode: Mode): string {
  if (action === 'continue') return stateWords('VE-03.continue-unavailable');
  if (action === 'save')
    return mode === 'revise'
      ? stateWords('VE-08.save-unavailable')
      : stateWords('VE-03.save-unavailable');
  return mode === 'revise'
    ? stateWords('VE-08.resubmit-unavailable')
    : stateWords('VE-06.submit-unavailable');
}
