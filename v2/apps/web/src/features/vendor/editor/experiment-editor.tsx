'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { ReturnReference, Submission, SubmissionId, Technology } from '@xr/domain';
import { inDisplayOrder } from '@xr/domain';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  ConfirmDialog,
  ErrorSummary,
  ListState,
  LoadingRows,
  Notice,
  PageHead,
  StatusPill,
  Surface,
  VendorEditorActions,
  VendorEditorErrors,
  VendorEditorLayout,
  type VendorEditorPart,
  type VendorEditorStep,
} from '@xr/ui/v3';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { dateTime, dayMonthYear } from '@/copy/dates';
import { stateWords } from '@/copy/state-copy';
import {
  changesSavedWords,
  CHECK_STEP,
  COURSE_STEP,
  courseWords,
  DONE,
  draftSavedWords,
  EDITOR,
  formatPartLabel,
  goToReferenceLabel,
  idLineWords,
  lastSavedWords,
  LEAVE_DIALOG,
  noLongerAssignedLine,
  noLongerAssignedTitle,
  outlineChangesSaved,
  outlineKicker,
  overlineWords,
  partsLabel,
  PREVIEW_STEP,
  READ_ONLY,
  RETURNED,
  reviseVisibility,
  revisionSentWords,
  stepButtonLabel,
  SUBMIT_DIALOG,
  submitEffect,
  todayAt,
} from '@/copy/vendor-editor';
import { useAppNavigation } from '@/nav/navigation';
import {
  editDraftAddress,
  editorPlacement,
  editorStepOf,
  type EditorStepSlug,
  EDITOR_STEPS,
  experimentRecordAddress,
  MY_EXPERIMENTS_ADDRESS,
  MY_EXPERIMENTS_TITLE,
  newExperimentAddress,
  reviseAddress,
} from '@/nav/vendor';
import { usePublicCourse } from '@/queries/catalogue';
import { noCourseAssigned, useExperimentEditor, useVendorRecord } from '@/queries/production';
import { checkDraftSave, checkEditorStep, checkWholeExperiment } from '@/queries/production-editor';
import { useSession } from '@/queries/session';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { ReturnedReasonPanel, returnFactsOf } from '../shared/returned-reason';
import { savedChangesAt } from '../shared/saved-changes';
import { vendorPill } from '../shared/status-pill';
import { useTodayLine } from '../shared/today-line';
import {
  clearEditorDraft,
  forgetSavedLine,
  leaveSavedLine,
  savedLineFor,
  useEditorDraft,
  useSessionKey,
} from './editor-draft';
import { DoneState, ReadOnlyView, RefusalView } from './editor-states';
import {
  blockTitleId,
  CheckStep,
  CourseStep,
  type FieldChange,
  FormatsStep,
  PreviewStep,
  SECTION_IDS,
} from './editor-steps';
import {
  checklistRows,
  contentOf,
  COURSE_PARTS,
  deliveryFields,
  draftOf,
  editableMode,
  type EditorError,
  editorErrors,
  type EditorField,
  EMPTY_EDITOR_DRAFT,
  ERRORS_ID,
  fieldId,
  ID_PREFIX,
  liveErrorFields,
  MISSING_ID,
  type MissingItem,
  missingItems,
  type PackageFormat,
  partStatus,
  previousStep,
  REASON_ID,
  REFERENCE_FIELD_PARAM,
  referencedFields,
  referenceFieldKey,
  referenceTarget,
  sameDraft,
  samplePackageFileName,
  SAVED_ID,
  stepNumber,
  stepOfField,
  stepStates,
  SUBMIT_ID,
  TITLE_ID,
} from './editor-view';
import { useLeaveGuard } from './leave-guard';

type Mode = 'create' | 'edit' | 'revise';

/** The errors on show, with the step they belong to (a step shows only its own). */
interface StepErrors {
  readonly step: EditorStepSlug;
  readonly items: readonly EditorError[];
  /** The summary takes focus (a failed Continue or Save); a "Go to …" focuses the field instead. */
  readonly focusSummary: boolean;
}

/** What Submit or Resubmit answered: the outcome card's record. */
interface Done {
  readonly kind: 'submitted' | 'resubmitted';
  readonly submission: Submission;
}

/** Where focus goes once the page shows it (the export's `focusId`). */
interface FocusRequest {
  readonly id: string;
  readonly seq: number;
}

const OUTLINE_KICKER_ID = `${ID_PREFIX}-prog-k`;

/**
 * The experiment editor — the one four-step editor of the V3 Vendor design (VE-v1 `Main.dc.html`):
 * VE-03 Course and description, VE-04 Formats and delivery, VE-05 Preview and documents, VE-06
 * Check and submit for a new experiment (`/vendor/experiments/new?step=`), VE-09 for a saved draft
 * (`/[id]/edit?step=`) and VE-08 for a returned one (`/[id]/revise?step=`).
 *
 * - **Read**: `ProductionService.getEditor` — the record (or none yet), only the courses assigned
 *   to the Vendor's organisation and whether it opens read-only (a draft whose course is no longer
 *   assigned, OD-B5-01; any record that is not a draft or returned: the export's refusal). Revise
 *   mode also reads the record's last return (`getRecord`): the returned reason above the editor,
 *   which takes focus first, whose references open the step and field and tag it (OD-B5-10).
 * - **Four steps** in the address (`?step=`; a saved draft opens where it was last saved,
 *   state-copy `VE-09.opens-at`), as titled sections on the field grid; the top stepper (narrow)
 *   and the aside outline (wide) move between them with the values kept, and show each step's —
 *   and the current step's parts' — live status. Continue checks the step with the contract's own
 *   rules first (`editorStepIssues` after `submissionContentInput`), then asks `continueStep` — the
 *   service answers the name already in use and a course withdrawn meanwhile. Field errors and the
 *   summary “Check this step”, which takes focus. What is typed is kept per signed-in person and
 *   record for the tab's life (state-copy `VE-03.kept`); leaving through a link with unsaved
 *   changes asks first (“Leave without saving?”, `VE-04.leave-guard`).
 * - **Save draft** needs only a name; the first save mints the SUB id and the address becomes the
 *   draft's own (state-copy `VE-03.first-save`); the saved line sits next to Cancel or Back and
 *   takes focus. Revise mode's **Save changes** keeps them privately without resubmitting.
 *   **Submit** lists what is missing with a way to each step or opens the confirmation (“It does
 *   not publish anything”), then shows the outcome card; **Resubmit** reads “Submitted” — the next
 *   stage is never named (M-3). Documents and package files are file names only (OD-B5-11).
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
  // Today on the sample clock (the session's sign-in instant): the head's date on phones.
  const date = useTodayLine();
  const record = submissionId ?? 'new';
  const titleRef = useRef<HTMLHeadingElement>(null);

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
  const [draft, typed, update] = useEditorDraft(record, base);

  const [errors, setErrors] = useState<StepErrors | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState<string | null>(() => savedLineFor(sessionKey, record));
  useEffect(() => forgetSavedLine(sessionKey, record), [sessionKey, record]);
  const [notice, setNotice] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [missing, setMissing] = useState(false);
  // The first save's saved line takes focus on the draft's own address.
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

  // A new step: its own errors only, no saved line.
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
  /** Opens a step; focus goes to its title or to `focusId`. */
  const goTo = (target: EditorStepSlug, focusId: string | null = TITLE_ID) => {
    if (focusId !== null) requestFocus(focusId);
    if (target !== step) navigation.navigate(addressOf(target));
  };

  /** Shows the errors on the earliest step they belong to, moving there if needed. */
  const fail = (items: readonly EditorError[], focusSummary = true) => {
    if (items.length === 0) return;
    const at = [...items]
      .map((item) => stepOfField(item.field))
      .sort((a, b) => EDITOR_STEPS.indexOf(a) - EDITOR_STEPS.indexOf(b))[0]!;
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
      // The draft's course was withdrawn: the read now opens it read-only.
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
          // The first save gives the id: the draft's own address (state-copy `VE-03.first-save`).
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
        setDone({ kind: revising ? 'resubmitted' : 'submitted', submission: answer.value });
        requestFocus(TITLE_ID);
      },
      () => {
        setDialog(false);
        setNotice(unavailableWords('submit', mode));
      },
    );
  };

  /** A missing item's “Go to …”: its step with that step's errors, focus on the field. */
  const onGoTo = (item: MissingItem) => {
    const local = checkEditorStep(item.step, content);
    const items = local ? editorErrors(local) : [];
    setErrors({ step: item.step, items, focusSummary: false });
    goTo(item.step, fieldId(item.field));
  };

  /** A “What it refers to” chip (state-copy `VE-08.reference-jump`). */
  const onJump = (reference: ReturnReference) => {
    const target = referenceTarget(reference, draft);
    setErrors(null);
    goTo(target.step, fieldId(target.field));
  };

  // ---- leaving with unsaved changes (state-copy `VE-04.leave-guard`) ----
  const revising = mode === 'revise';
  const formShown =
    editor !== null && base !== null && done === null && !(submission !== null && editor.readOnly);
  const unsaved = typed && base !== null && !sameDraft(draft, base);
  useLeaveGuard({
    active: formShown && unsaved && leaveTo === null,
    here: `${navigation.pathname}${navigation.search}`,
    onLeave: setLeaveTo,
  });
  const onLeave = () => {
    const destination = leaveTo;
    if (destination === null) return;
    clearEditorDraft(sessionKey, record);
    setLeaveTo(null);
    navigation.navigate(destination);
  };
  /** Cancel drops what was typed — unless the guard held the click back to ask first. */
  const onCancel = (event: { readonly defaultPrevented: boolean }) => {
    if (!event.defaultPrevented) clearEditorDraft(sessionKey, record);
  };

  // ---- the returned reason (revise): focused first once it shows — or, when the address names one
  // of its references (`field=`, the record's chips: state-copy `VE-08.reference-jump`), that field.
  const facts =
    revising && submission && recordView ? returnFactsOf(recordView.lastReturn, submission) : null;
  const askedField = new URLSearchParams(navigation.search).get(REFERENCE_FIELD_PARAM);
  // Once, when the reason first shows (the step comes with the record's link: `step=`).
  const [reasonOpened, setReasonOpened] = useState(false);
  if (formShown && facts !== null && !reasonOpened) {
    setReasonOpened(true);
    const asked = askedField
      ? facts.references.find((reference) => referenceFieldKey(reference) === askedField)
      : undefined;
    const target = asked ? referenceTarget(asked, draft) : null;
    requestFocus(target && target.step === step ? fieldId(target.field) : REASON_ID);
  }

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
  // Create experiment with no course assigned (owner decision PD-3): a calm explanation, never
  // "We can't find that page". Any other refusal — another Vendor's record, a colleague's of the
  // same studio included (PD-1) — is not found.
  const noCourse = submissionId === null && noCourseAssigned(editorAnswer);
  if (
    !noCourse &&
    editorAnswer !== undefined &&
    !editorAnswer.ok &&
    (editorAnswer.error.kind === 'not-found' || editorAnswer.error.kind === 'not-permitted')
  ) {
    navigation.notFound();
  }

  const shownMode: Mode = submissionId === null ? 'create' : mode;
  /** “My experiments › <the saved record> › <where this is>”. */
  const crumbs = (current: string, named: Submission | null = submission) => (
    <Breadcrumbs
      levels={[
        { label: MY_EXPERIMENTS_TITLE, href: MY_EXPERIMENTS_ADDRESS },
        ...(named
          ? [
              {
                label: named.content.name.trim() || EDITOR.untitled,
                href: experimentRecordAddress(named.id),
              },
            ]
          : []),
      ]}
      current={current}
    />
  );
  const frame = (current: string, children: ReactNode, named: Submission | null = submission) => (
    <>
      {crumbs(current, named)}
      {children}
    </>
  );

  if (done) {
    const resubmitted = done.kind === 'resubmitted';
    return frame(
      resubmitted ? DONE.resubmittedTitle : DONE.submittedTitle,
      <DoneState kind={done.kind} submission={done.submission} date={date} titleRef={titleRef} />,
      done.submission,
    );
  }

  if (noCourse) {
    // The page keeps its heading (“Create experiment”); the calm state says why nothing can start.
    return (
      <>
        <PageHead
          breadcrumbs={crumbs(EDITOR.modeWords.create)}
          date={date}
          title={EDITOR.modeWords.create}
          titleId={TITLE_ID}
          titleFocusTarget
          titleRef={titleRef}
        />
        <Surface>
          <ListState
            kind="none"
            roomy
            titleAs="h2"
            icon="myExperiments"
            title={stateWords('VE-01.no-course.title')}
          >
            {stateWords('VE-01.no-course.line')}
          </ListState>
        </Surface>
      </>
    );
  }

  // Any other refusal (signed out meanwhile): a calm notice, never an endless skeleton.
  if (
    editorAnswer !== undefined &&
    !editorAnswer.ok &&
    !['not-found', 'not-permitted', 'unavailable'].includes(editorAnswer.error.kind)
  ) {
    return frame(
      EDITOR.modeWords[shownMode],
      <Notice tone="info" title={stateWords('VE-03.refused')} />,
    );
  }

  if (readFailed) {
    return frame(
      EDITOR.modeWords[shownMode],
      <Surface>
        <ListState
          kind="failed"
          title={stateWords('VE-03.failed')}
          action={<Button onClick={() => void editorRead.refetch()}>{EDITOR.tryAgain}</Button>}
        >
          {stateWords('VE-03.failed-line')}
        </ListState>
      </Surface>,
    );
  }

  const lookupPending = lookupId !== null && lookup.isPending;
  if (editor === null || base === null || (editor.readOnly && lookupPending)) {
    return frame(
      EDITOR.modeWords[shownMode],
      <Surface busy>
        <LoadingRows message={stateWords('VE-03.loading')} rows={3} cells={[2, 1]} />
      </Surface>,
    );
  }

  if (submission && editor.readOnly) {
    const courseNoLongerAssigned =
      submission.status.state === 'draft' &&
      recordCourseId !== null &&
      !courses.some((course) => course.id === recordCourseId);
    if (!courseNoLongerAssigned) {
      return frame(
        EDITOR.modeWords[mode],
        <RefusalView submission={submission} titleRef={titleRef} />,
      );
    }
    const code = lookedUp?.platformCode ?? null;
    const recordCourse = lookedUp
      ? courseWords(lookedUp.platformCode, lookedUp.name)
      : (recordCourseId ?? CHECK_STEP.notChosen);
    return frame(
      READ_ONLY.crumb,
      <ReadOnlyView
        submission={submission}
        courseLine={recordCourse}
        noticeTitle={noLongerAssignedTitle(code ?? recordCourse)}
        noticeLine={noLongerAssignedLine(recordCourse, submission.vendorOrganisation, null)}
        date={date}
        titleRef={titleRef}
      />,
    );
  }

  // ---- the editor ----
  const shownErrors = errors && errors.step === step ? errors.items : [];
  const errorOf = (field: EditorField) => shownErrors.find((item) => item.field === field)?.message;
  const organisation = submission?.vendorOrganisation ?? sessionOrganisation;
  const referred = facts ? referencedFields(facts.references, draft) : new Set<EditorField>();
  const shownFields = new Set(shownErrors.map((item) => item.field));
  const liveCourse = liveErrorFields('course', content);
  const liveFormats = liveErrorFields('formats', content);
  const blockStatus = (format: Technology) =>
    partStatus(deliveryFields(format), shownFields, liveFormats);
  const states = stepStates(draft);

  const partsOf = (slug: EditorStepSlug): readonly VendorEditorPart[] => {
    if (slug !== step) return [];
    if (slug === 'course')
      return [
        {
          key: 'course-and-name',
          label: COURSE_STEP.sections.courseAndName,
          status: partStatus(COURSE_PARTS.courseAndName, shownFields, liveCourse),
          onSelect: () => requestFocus(SECTION_IDS.courseAndName),
        },
        {
          key: 'catalogue',
          label: COURSE_STEP.sections.catalogue,
          status: partStatus(COURSE_PARTS.catalogue, shownFields, liveCourse),
          onSelect: () => requestFocus(SECTION_IDS.catalogue),
        },
      ];
    if (slug === 'formats')
      return inDisplayOrder(draft.formats).map((format) => ({
        key: format,
        label: formatPartLabel(format),
        status: blockStatus(format),
        onSelect: () => requestFocus(blockTitleId(format)),
      }));
    return [];
  };
  const steps: VendorEditorStep[] = EDITOR_STEPS.map((slug) => {
    const number = stepNumber(slug);
    const title = EDITOR.stepTitles[slug];
    const state = states[slug];
    return {
      key: slug,
      number,
      short: EDITOR.steps[slug],
      title,
      state: state.words,
      done: state.complete && slug !== step,
      current: slug === step,
      label: stepButtonLabel(number, title, state.words),
      onSelect: () => {
        setErrors(null);
        goTo(slug);
      },
      parts: partsOf(slug),
      partsLabel: partsLabel(title),
    };
  });

  const savedOutline = !submission
    ? EDITOR.notSaved
    : revising
      ? revisionSavedWords(submission, session.status === 'signed-in' ? session.signedInAt : null)
      : lastSavedWords(dateTime(submission.updatedAt));
  const visibility = !submission
    ? EDITOR.newVisibility
    : revising
      ? reviseVisibility(submission.revision)
      : EDITOR.draftVisibility;
  const pill = submission ? vendorPill(submission) : null;
  const status = pill ? <StatusPill tone={pill.tone}>{pill.words}</StatusPill> : null;

  const saving = saveDraft.busy || saveRevision.busy;
  const saveButton = (
    <Button size="lg" onClick={onSave} busy={saving}>
      {revising ? EDITOR.saveChanges : EDITOR.saveDraft}
    </Button>
  );

  return (
    <>
      <PageHead
        breadcrumbs={crumbs(EDITOR.modeWords[shownMode])}
        date={date}
        eyebrow={overlineWords(shownMode, stepNumber(step))}
        title={EDITOR.stepTitles[step]}
        titleId={TITLE_ID}
        titleFocusTarget
        titleRef={titleRef}
        meta={
          <>
            {status}
            <span>{idLineWords(submission !== null, shownMode, submission?.revision ?? 1)}</span>
          </>
        }
      />
      {facts ? (
        <ReturnedReasonPanel
          id={REASON_ID}
          facts={facts}
          references={{
            label: RETURNED.refersTo,
            nameOf: goToReferenceLabel,
            onSelect: onJump,
          }}
        />
      ) : null}
      <VendorEditorLayout
        stepsLabel={EDITOR.stepsLabel}
        steps={steps}
        formLabelledBy={TITLE_ID}
        outline={{
          kicker: submission ? outlineKicker(shownMode, submission.revision) : EDITOR.newKicker,
          kickerId: OUTLINE_KICKER_ID,
          name: draft.name.trim() || EDITOR.untitled,
          saved: savedOutline,
          visibility,
        }}
      >
        {shownErrors.length > 0 || notice ? (
          <VendorEditorErrors>
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
            {notice ? <Notice tone="warn" icon="alertCircle" role="alert" title={notice} /> : null}
          </VendorEditorErrors>
        ) : null}
        {step === 'course' ? (
          <CourseStep
            draft={draft}
            courses={courses}
            organisation={organisation}
            withdrawn={withdrawn}
            errorOf={errorOf}
            onChange={onChange}
            referred={referred}
          />
        ) : step === 'formats' ? (
          <FormatsStep
            draft={draft}
            errorOf={errorOf}
            onChange={onChange}
            onToggle={onToggle}
            onAttach={onAttach}
            referred={referred}
            blockStatus={blockStatus}
          />
        ) : step === 'preview' ? (
          <PreviewStep
            draft={draft}
            errorOf={errorOf}
            onChange={onChange}
            referred={referred}
            onAddDocument={onAddDocument}
            onRemoveDocument={onRemoveDocument}
          />
        ) : (
          <CheckStep
            draft={draft}
            courseLine={courseLine}
            missing={missingList}
            tried={tried}
            checklist={checklistRows(missingList, draft)}
            outcomes={submission?.learningOutcomes ?? []}
            revising={revising}
            onGoTo={onGoTo}
            onChangeStep={(target) => goTo(target)}
          />
        )}
        <VendorEditorActions
          savedId={SAVED_ID}
          saved={saved}
          start={
            step === 'course' ? (
              <ButtonLink variant="ghost" href={MY_EXPERIMENTS_ADDRESS} onClick={onCancel}>
                {EDITOR.cancel}
              </ButtonLink>
            ) : (
              <Button
                variant="ghost"
                icon="back"
                iconSize={18}
                onClick={() => goTo(previousStep(step))}
              >
                {EDITOR.previous}
              </Button>
            )
          }
          end={
            step === 'submit' ? (
              <>
                {saveButton}
                <Button variant="primary" size="lg" id={SUBMIT_ID} onClick={onSubmit}>
                  {revising ? CHECK_STEP.resubmit : CHECK_STEP.submit}
                </Button>
              </>
            ) : (
              <>
                {saveButton}
                <Button
                  variant="primary"
                  size="lg"
                  icon="chevronRight"
                  iconSize={18}
                  iconPosition="end"
                  onClick={onContinue}
                  busy={continueStep.busy}
                >
                  {EDITOR.continue}
                </Button>
              </>
            )
          }
        />
      </VendorEditorLayout>
      <ConfirmDialog
        open={dialog}
        idPrefix={`${ID_PREFIX}-s`}
        title={revising ? SUBMIT_DIALOG.resubmitTitle : SUBMIT_DIALOG.submitTitle}
        description={revising ? SUBMIT_DIALOG.resubmitEffect : submitEffect(draft.name.trim())}
        groups={[
          {
            kind: 'now',
            title: SUBMIT_DIALOG.nowTitle,
            items: revising
              ? [revisionSentWords((submission?.revision ?? 1) + 1), SUBMIT_DIALOG.whileReviewed]
              : SUBMIT_DIALOG.submitNow,
          },
          { kind: 'later', title: SUBMIT_DIALOG.laterTitle, items: [SUBMIT_DIALOG.later] },
        ]}
        cancelLabel={revising ? SUBMIT_DIALOG.keepEditing : SUBMIT_DIALOG.cancel}
        confirmLabel={revising ? CHECK_STEP.resubmit : CHECK_STEP.submit}
        busy={submitForReview.busy || resubmit.busy}
        busyLabel={SUBMIT_DIALOG.submitting}
        onConfirm={onConfirm}
        onCancel={() => setDialog(false)}
        returnFocusFallback={titleRef}
      />
      <ConfirmDialog
        open={leaveTo !== null}
        idPrefix={`${ID_PREFIX}-l`}
        title={LEAVE_DIALOG.title}
        description={revising ? LEAVE_DIALOG.reviseLine : LEAVE_DIALOG.draftLine}
        cancelLabel={LEAVE_DIALOG.keepEditing}
        confirmLabel={LEAVE_DIALOG.leave}
        // Navy, as the export draws "Leave without saving" (`rb-btn--navy`); no body.
        confirmVariant="navy"
        onConfirm={onLeave}
        onCancel={() => setLeaveTo(null)}
        returnFocusFallback={titleRef}
      />
    </>
  );
}

/**
 * Revise mode's outline line (state-copy `VE-08.private-revision`): changes saved privately once
 * the returned record changed after its return (`savedChangesAt`, the rule the record and the lists
 * read too).
 */
function revisionSavedWords(submission: Submission, today: string | null): string {
  const savedAt = savedChangesAt(submission);
  if (savedAt === null) return EDITOR.noChangesSaved;
  const at = dateTime(savedAt);
  const sameDay = today !== null && dayMonthYear(today) === dayMonthYear(savedAt);
  return outlineChangesSaved(sameDay ? todayAt(at.split(', ')[1] ?? at) : at);
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
