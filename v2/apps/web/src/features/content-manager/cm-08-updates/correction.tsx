'use client';

import type { Result, ServiceError, ValidationFailed } from '@xr/contracts/draft';
import type { CorrectionEntry, CorrectionUpdate, Experiment } from '@xr/domain';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  CmComparison,
  CmCorrectionField,
  CmCourseName,
  CmForm,
  CmFormGrid,
  CmFormSection,
  type CmIdentityFact,
  CmIdentityBand,
  CmReturnedReason,
  CmSaveFailed,
  CmStageTrack,
  CmStateNotice,
  type CmStateNoticeProps,
  CmVersionChange,
  CmWideButton,
  CmWideLink,
  ConfirmDialog,
  DecisionPanel,
  DetailLayout,
  ErrorSummary,
  type ErrorSummaryItem,
  Field,
  GoButton,
  ListState,
  Notice,
  PageHead,
  PendingHint,
  Quote,
  StandList,
  StatusPill,
  Surface,
  Textarea,
  TextInput,
  Timeline,
} from '@xr/ui/v3';
import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ARRIVAL_GO,
  ARRIVAL_JOIN_TITLE,
  arrivalJoinBody,
  arrivalNewBody,
  arrivalNewTitle,
  approvedMeanwhileLine,
  awaitingLine,
  changesWords,
  comparisonCaption,
  draftLine,
  fieldsWords,
  holdLine,
  holdReason,
  inReviewLine,
  lastSavedWords,
  liftedLine,
  liveUnchanged,
  liveUntilReleased,
  NO_UPDATE,
  packageHint,
  packageReferenceLabel,
  PENDING_PARTS,
  pendingLine,
  quotedReason,
  releasedFact,
  releasedLine,
  returnedBy,
  returnedLine,
  returnedMeta,
  savedLine,
  SEND_DIALOG,
  sendStaysLive,
  sendTitle,
  STALE_NOTICE,
  startedFact,
  STATE_NOTICE,
  UPDATE_BAND,
  UPDATE_FACTS,
  UPDATE_PANEL,
  UPDATE_SHEET,
  updateTitle,
  versionHint,
  versionNote,
  WITHDRAW_DIALOG,
  withdrawnLine,
  withdrawTitle,
} from '@/copy/cm-correction';
import { STAGE_TRACK_LABEL, YOUR_STEP } from '@/copy/cm-shared';
import { comparisonFieldLabel } from '@/copy/corrections';
import { dateTime, dayMonthYear, weekdayDate } from '@/copy/dates';
import { stateWords } from '@/copy/state-copy';
import {
  CONTENT_LIBRARY_ADDRESS,
  type CorrectionFocus,
  correctionFocusOf,
  correctionPlacement,
  publishedExperimentAddress,
  UPDATES_ADDRESS,
  UPDATES_TITLE,
} from '@/nav/content-manager';
import { useAppNavigation } from '@/nav/navigation';
import {
  checkCorrection,
  checkWithdrawReason,
  type CorrectionErrors,
  type CorrectionForm,
  correctionErrorsOf,
  correctionFormOf,
  deliveryFormatsOf,
  formComparison,
  type PackageFormat,
  releasedComparison,
  saveInputOf,
  withdrawErrorOf,
} from '@/queries/cm-correction-forms';
import type { CorrectionComparisonRow, CorrectionUpdateView } from '@/queries/correction-view';
import { useCorrectionUpdate } from '@/queries/corrections';
import { usePlatformCourseCodes, usePublishedExperiment } from '@/queries/production';
import { useSession } from '@/queries/session';
import { useCommand } from '@/queries/use-command';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { awaitingSince, cmActorName, lastUpdateDecision } from '../shared/records';
import { CM_STAGE_STATE_WORDS, correctionStages } from '../shared/stages';
import { cmUpdatePill } from '../shared/status';
import { correctionVersionChange } from '../shared/version-change';
import {
  type CorrectionArrival,
  clearTypedCorrection,
  correctionArrivalFor,
  forgetCorrectionArrival,
  noteBackFromCorrection,
  rebaseTypedCorrection,
  useCorrectionSessionKey,
  useTypedCorrection,
} from './correction-draft';
import {
  canWithdraw,
  CORRECTION_FIELD_IDS,
  correctionFocusTarget,
  isEditable,
  isOpen,
  packageFieldId,
  updateHistory,
} from './correction-view';

const ID = CORRECTION_FIELD_IDS;

/** The course a correction's experiment is listed under (the platform code and name). */
interface CourseFacts {
  readonly code: string | null;
  readonly name: string;
}

interface CorrectionPageView extends CorrectionUpdateView {
  readonly experiment: Experiment;
  readonly course: CourseFacts | null;
}

/** Today's date on phones (`p.rb-eyebrow-date`), from the session's clock. */
function useTodayLine(): string | undefined {
  const session = useSession();
  return session.status === 'signed-in' ? weekdayDate(session.signedInAt) : undefined;
}

/**
 * CM-08 a correction — the owner-approved Content Manager export's correction detail
 * (design/v3-refined-b/roles/CM-v1, `Main.dc.html` “CM-08 Correction detail”, boards CM06, CM07,
 * CM08-UpdateDetail, C01 … C13), at `/content-manager/updates/[updateId]`: the draft CM-06 “Edit
 * catalogue details”, CM-07 “Edit delivery link” and “Start a correction” open on CM-05, and every
 * later state.
 *
 * - **Reads**: `CorrectionService.getUpdate` — the update and its saved comparison — and the
 *   experiment it corrects (`getPublishedExperiment`: its live version, formats and name), and the
 *   platform course codes (`platformCourseCodes.list`: the course's code and name in the band; left
 *   out if that read fails). An update the service does not answer is “No update open”. Loading and
 *   a failed read are the application's record guard (HANDOFF §4: no separate design).
 * - **As the export draws it**, without the update's reference (the owner's correction of 20 Oct
 *   2026, state-copy `CM-08.no-reference`: the reference stays in the address, keys and service
 *   calls): the crumbs “Updates › Update to <experiment>” (the browser tab too); the identity band —
 *   “Correction to a published experiment”, the stable title “Update to <experiment>”, the status,
 *   the version change and the course; “Back to the published experiment” and “Go to actions”; the
 *   facts (live version, proposed, fields changed, started / sent / released / withdrawn) and the
 *   four stages with “Your step”. Then a stale refusal's notice, the arrival from CM-05 (a new
 *   draft or a joined one, with “Go to …” the field the entry names), the sheet — the returned
 *   reason first; while editable “About this correction” (reason and version label), the catalogue
 *   details and the delivery (WEB's link, each app format's package reference) pre-filled with the
 *   live version, each with its Changed tag; once sent the reason quoted — the comparison (changed
 *   fields only: Live now · Proposed, or once released Live before · Released) and the history;
 *   and the panel: where it stands (with the hold or withdrawal reason), the check, the save
 *   failure, Draft saved, Changes and Last saved, what is missing before sending, Send for academic
 *   review · Save draft · Withdraw update — read-only, Withdraw (in academic review) and Open the
 *   published experiment.
 * - **Commands** (each with the revision it was typed on, repeat-press protected): Save draft
 *   (`saveCorrection`), Send for academic review through its dialog (checks the three rules at
 *   once, saves what is typed, then `sendForAcademicReview`), Withdraw through its dialog (a reason
 *   is required; `withdrawUpdate`). While a dialog's command runs its confirm shows the working
 *   words and Cancel and Esc wait. A stale or moved-on update is refused calmly: the page reads it
 *   again, what was typed stays, and “Show where it is now” moves to where it stands. Typed work is
 *   kept in memory for the tab (`CM-08.kept`). Nothing here changes the live version or anyone's
 *   access: only the Super Admin's release does that (BC8, BC9).
 */
export function Correction({ updateId }: { readonly updateId: string }) {
  const navigation = useAppNavigation();
  const read = useCorrectionUpdate(updateId);
  const view = read.data?.ok ? read.data.value : null;
  const experimentRead = usePublishedExperiment(view ? view.update.experimentId : null);
  const codes = usePlatformCourseCodes();
  // The top bar names the destination below 1024 px; the crumbs and the browser tab name the update
  // by the page's H1 (“Update to <experiment>”), never by its reference (`CM-08.no-reference`).
  const experimentName =
    view && experimentRead.data?.ok
      ? experimentRead.data.value.experiment.live.catalogue.name
      : null;
  useShellPage(correctionPlacement(experimentName === null ? null : updateTitle(experimentName)));

  const answer = read.data;
  const experimentAnswer = experimentRead.data;
  let data: Result<CorrectionPageView, ServiceError> | undefined;
  if (answer && !answer.ok) data = answer;
  else if (answer?.ok && experimentAnswer && !experimentAnswer.ok) data = experimentAnswer;
  else if (answer?.ok && experimentAnswer?.ok) {
    const experiment = experimentAnswer.value.experiment;
    const row = codes.data?.ok
      ? codes.data.value.find((entry) => entry.course.id === experiment.courseId)
      : undefined;
    data = {
      ok: true,
      value: {
        ...answer.value,
        experiment,
        course: row ? { code: row.course.platformCode, name: row.course.name } : null,
      },
      changed: [],
    };
  }
  return (
    <RecordGuard
      read={{
        data,
        isPending:
          read.isPending ||
          (answer?.ok === true && experimentRead.isPending) ||
          (codes.isPending && !codes.isError),
        isError: read.isError || experimentRead.isError,
        refetch: () => {
          void read.refetch();
          void experimentRead.refetch();
        },
      }}
      loadingLabel={stateWords('CM-08.loading')}
      failed={{ title: stateWords('CM-08.failed'), line: stateWords('CM-08.failed.line') }}
      refusals={{
        'not-found': <NoUpdate />,
        'not-permitted': <NoUpdate />,
      }}
    >
      {(page) => (
        <UpdatePage
          key={page.update.id}
          update={page.update}
          comparison={page.comparison}
          experiment={page.experiment}
          course={page.course}
          focus={correctionFocusOf(navigation.search)}
          onReread={() => {
            void read.refetch();
            void experimentRead.refetch();
          }}
        />
      )}
    </RecordGuard>
  );
}

/**
 * No update at this address (state-copy `CM-08.no-update`); its heading is the page's H1, and the
 * current crumb says the same words — never the address's reference (`CM-08.no-reference`).
 */
function NoUpdate() {
  return (
    <>
      <PageHead
        variant="record"
        title={NO_UPDATE.title}
        titleFocusTarget
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: UPDATES_TITLE, href: UPDATES_ADDRESS }]}
            current={NO_UPDATE.title}
          />
        }
      />
      <Surface>
        <ListState
          kind="none"
          icon="updates"
          title={NO_UPDATE.line}
          action={<ButtonLink href={CONTENT_LIBRARY_ADDRESS}>{NO_UPDATE.action}</ButtonLink>}
        />
      </Surface>
    </>
  );
}

/** A refused command, as the page says it (state-copy `CM-08.stale`, `CM-08.moved-on`). */
type Refusal = 'stale' | 'moved-on';

interface FocusRequest {
  readonly id: string;
  readonly seq: number;
}

interface FormErrors {
  readonly title: string;
  readonly fields: CorrectionErrors;
  readonly attempt: number;
}

/** The entry a CM-05 address names (`?focus=`), when CM-05 left no arrival note. */
function entryOfFocus(focus: CorrectionFocus | null): CorrectionEntry | null {
  if (focus === 'summary') return 'edit-catalogue-details';
  if (focus === 'web-link') return 'edit-delivery-link';
  return null;
}

/** The last time the draft was saved: its start or last save (a draft), the send before a return. */
function lastSavedAt(update: CorrectionUpdate): string {
  if (update.state !== 'returned') return update.updatedAt;
  const returned = lastUpdateDecision(update, 'return-to-content-manager');
  if (returned && update.updatedAt > returned.at) return update.updatedAt;
  return update.sentForReviewAt ?? update.startedAt;
}

/** The comparison rows' changed fields, as keys (“name”, “packageReferences:vr”); no “Version”. */
function changedKeys(rows: readonly CorrectionComparisonRow[]): Set<string> {
  return new Set(
    rows
      .filter((row) => row.field !== 'version')
      .map((row) => (row.format ? `${row.field}:${row.format}` : row.field)),
  );
}

function UpdatePage({
  update,
  comparison,
  experiment,
  course,
  focus,
  onReread,
}: {
  readonly update: CorrectionUpdate;
  readonly comparison: readonly CorrectionComparisonRow[];
  readonly experiment: Experiment;
  readonly course: CourseFacts | null;
  readonly focus: CorrectionFocus | null;
  readonly onReread: () => void;
}) {
  const sessionKey = useCorrectionSessionKey();
  const today = useTodayLine();
  const editable = isEditable(update.state);
  const savedForm = useMemo(() => correctionFormOf(update, experiment), [update, experiment]);
  const base = useMemo(
    () => (editable ? { form: savedForm, rev: update.rev } : null),
    [editable, savedForm, update.rev],
  );
  const typed = useTypedCorrection(update.id, base);
  const form = typed.form ?? savedForm;

  const saveCmd = useCommand((ports) => ports.corrections.saveCorrection);
  const sendCmd = useCommand((ports) => ports.corrections.sendForAcademicReview);
  const withdrawCmd = useCommand((ports) => ports.corrections.withdrawUpdate);

  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [dialog, setDialog] = useState<'send' | 'withdraw' | null>(null);
  const [dialogNotice, setDialogNotice] = useState<'unavailable' | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // CM-06 / CM-07 / Start a correction: how the page was reached, explained once (CM-05's note;
  // without one, the entry its `?focus=` names — joined when the update was not started by it).
  const [arrival] = useState<CorrectionArrival | null>(() => {
    const noted = correctionArrivalFor(sessionKey, update.id);
    if (noted) return noted;
    const entry = entryOfFocus(focus);
    if (!entry) return null;
    return { entry, joined: update.state === 'returned' || update.entry !== entry };
  });
  useEffect(() => forgetCorrectionArrival(sessionKey, update.id), [sessionKey, update.id]);

  // Focus requests are met once their element is on show (after the update is read again).
  const [focusTo, setFocusTo] = useState<FocusRequest | null>(null);
  const handledFocus = useRef(0);
  const requestFocus = useCallback((id: string) => {
    setFocusTo((current) => ({ id, seq: (current?.seq ?? 0) + 1 }));
  }, []);
  useEffect(() => {
    if (focusTo === null || handledFocus.current === focusTo.seq) return;
    const element = document.getElementById(focusTo.id);
    if (!element) return;
    handledFocus.current = focusTo.seq;
    element.focus();
  });

  // CM-06 / CM-07: the field the entry names, once the draft is on show (state-copy `CM-08.focus`).
  const focusedEntry = useRef(false);
  useEffect(() => {
    if (focusedEntry.current || !editable) return;
    focusedEntry.current = true;
    const target = correctionFocusTarget(focus, experiment);
    if (target) document.getElementById(target)?.focus();
  }, [editable, focus, experiment]);

  // Typed work belongs to a draft she can edit: once it is sent on, it is not kept.
  useEffect(() => {
    if (!editable && typed.isTyped) clearTypedCorrection(sessionKey, update.id);
  }, [editable, typed.isTyped, sessionKey, update.id]);

  const live = experiment.live.label;
  const rows: readonly CorrectionComparisonRow[] = editable
    ? formComparison(form, experiment)
    : update.state === 'released'
      ? (releasedComparison(update, experiment) ?? comparison)
      : comparison;
  const changed = changedKeys(rows);
  const versionLabel = (editable ? form.versionLabel : (update.versionLabel ?? '')).trim();
  const history = updateHistory(update);
  const pill = cmUpdatePill(update.state);
  const formats = deliveryFormatsOf(experiment);
  const livePackage = (format: PackageFormat) =>
    experiment.live.formats.find((entry) => entry.format === format)?.delivery;

  const showErrors = (failed: ValidationFailed) => {
    const fields = correctionErrorsOf(failed);
    if (!fields.whatChangesAndWhy && !fields.versionLabel && !fields.change) return false;
    setErrors((current) => ({
      title: failed.summaryTitle ?? UPDATE_PANEL.checkTitle,
      fields,
      attempt: (current?.attempt ?? 0) + 1,
    }));
    return true;
  };

  /** A refusal of any command: the update is read again and the page says what happened. */
  const refused = (error: ServiceError) => {
    if (error.kind === 'validation-failed' && showErrors(error)) return;
    if (error.kind === 'stale-version') {
      rebaseTypedCorrection(sessionKey, update.id, error.currentRev);
      setRefusal('stale');
    } else {
      setRefusal('moved-on');
    }
    onReread();
    requestFocus(ID.stale);
  };

  const change = (
    field: keyof CorrectionErrors | null,
    next: (current: CorrectionForm) => CorrectionForm,
  ) => {
    typed.change(next);
    setSaved(null);
    setSaveFailed(false);
    if (errors) {
      const fields = { ...errors.fields, change: undefined };
      if (field) fields[field] = undefined;
      setErrors(fields.whatChangesAndWhy || fields.versionLabel ? { ...errors, fields } : null);
    }
  };

  const expectedRev = typed.expectedRev ?? update.rev;

  const onSave = () => {
    if (saveCmd.busy) return;
    setRefusal(null);
    setSaved(null);
    setSaveFailed(false);
    saveCmd.run(saveInputOf(update.id, form, expectedRev)).then(
      (answer) => {
        if (!answer.ok) {
          refused(answer.error);
          return;
        }
        clearTypedCorrection(sessionKey, update.id);
        setErrors(null);
        setSaved(dateTime(answer.value.updatedAt));
        requestFocus(ID.saved);
      },
      () => {
        setSaveFailed(true);
        requestFocus(ID.saveFailed);
      },
    );
  };

  const onSend = () => {
    setRefusal(null);
    setSaved(null);
    const failed = checkCorrection(form, experiment);
    if (failed) {
      showErrors(failed);
      return;
    }
    setErrors(null);
    setDialogNotice(null);
    setDialog('send');
  };

  const sending = saveCmd.busy || sendCmd.busy;

  const doSend = async () => {
    if (sending) return;
    setDialogNotice(null);
    try {
      let rev = update.rev;
      if (typed.isTyped) {
        const savedAnswer = await saveCmd.run(saveInputOf(update.id, form, expectedRev));
        if (!savedAnswer.ok) {
          setDialog(null);
          refused(savedAnswer.error);
          return;
        }
        clearTypedCorrection(sessionKey, update.id);
        rev = savedAnswer.value.rev;
      }
      const sent = await sendCmd.run({ id: update.id, expectedRev: rev });
      setDialog(null);
      if (!sent.ok) {
        refused(sent.error);
        return;
      }
      setErrors(null);
      setSaved(null);
      setSaveFailed(false);
      requestFocus(ID.state);
    } catch {
      setDialogNotice('unavailable');
    }
  };

  const onWithdraw = () => {
    setRefusal(null);
    setReason('');
    setReasonError(null);
    setDialogNotice(null);
    setDialog('withdraw');
  };

  const doWithdraw = () => {
    if (withdrawCmd.busy) return;
    const missing = checkWithdrawReason(reason);
    if (missing) {
      setReasonError(missing);
      return;
    }
    setDialogNotice(null);
    withdrawCmd.run({ id: update.id, reason, expectedRev: update.rev }).then(
      (answer) => {
        if (!answer.ok) {
          if (answer.error.kind === 'validation-failed') {
            const words = withdrawErrorOf(answer.error);
            if (words) {
              setReasonError(words);
              return;
            }
          }
          setDialog(null);
          refused(answer.error);
          return;
        }
        clearTypedCorrection(sessionKey, update.id);
        setDialog(null);
        setErrors(null);
        setSaved(null);
        setSaveFailed(false);
        requestFocus(ID.state);
      },
      () => setDialogNotice('unavailable'),
    );
  };

  /** Esc and Cancel wait while the dialog's command runs (CM-v1 behaviour notes). */
  const closeDialog = () => {
    if (sending || withdrawCmd.busy) return;
    setDialog(null);
  };

  const reread = () => {
    setRefusal(null);
    onReread();
    requestFocus(ID.state);
  };

  // “Back to the published experiment” / “Open the published experiment”: a plain click on an open
  // update leaves the tab for the experiment, which says “Back from the correction” once.
  const backToPublished = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    if (event.altKey || !isOpen(update.state)) return;
    noteBackFromCorrection(sessionKey, update.experimentId);
  };
  const publishedHref = publishedExperimentAddress(update.experimentId);

  const returned =
    update.state === 'returned' ? lastUpdateDecision(update, 'return-to-content-manager') : null;
  const fieldErrors = errors?.fields ?? {};

  return (
    <>
      <CmIdentityBand
        variant="record"
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: UPDATES_TITLE, href: UPDATES_ADDRESS }]}
            current={updateTitle(experiment.live.catalogue.name)}
          />
        }
        date={today}
        eyebrow={UPDATE_BAND.eyebrow}
        title={updateTitle(experiment.live.catalogue.name)}
        titleId={ID.title}
        titleRef={titleRef}
        status={
          <>
            <StatusPill tone={pill.tone} size="lg">
              {pill.words}
            </StatusPill>
            <CmVersionChange
              {...correctionVersionChange({ ...update, versionLabel: versionLabel || null }, live)}
            />
            {course ? <CmCourseName code={course.code} name={course.name} /> : null}
          </>
        }
        actions={
          <ButtonLink href={publishedHref} onClick={backToPublished}>
            {UPDATE_BAND.backToPublished}
          </ButtonLink>
        }
        goTo={{ label: UPDATE_BAND.goToActions, targetId: ID.panel, focusId: ID.panelTitle }}
        facts={factsOf(update, live, versionLabel, changed.size)}
        track={
          <CmStageTrack
            placement="band"
            label={STAGE_TRACK_LABEL.correction}
            steps={correctionStages({ ...update, versionLabel: versionLabel || null }, live)}
            stateWords={CM_STAGE_STATE_WORDS}
            youLabel={YOUR_STEP}
          />
        }
      />

      {refusal ? (
        <Notice
          tone="warn"
          icon="alertCircle"
          role="alert"
          id={ID.stale}
          title={STALE_NOTICE.title}
          actions={<Button onClick={reread}>{STALE_NOTICE.action}</Button>}
        >
          {staleLine(update, refusal)}
        </Notice>
      ) : null}

      {arrival && editable ? (
        <Notice
          tone="info"
          icon="edit"
          role="status"
          id={ID.entry}
          title={arrival.joined ? ARRIVAL_JOIN_TITLE : arrivalNewTitle(arrival.entry)}
          actions={
            arrival.entry === 'start-a-correction' ? undefined : (
              <Button
                onClick={() => {
                  const target = correctionFocusTarget(
                    arrival.entry === 'edit-delivery-link' ? 'web-link' : 'summary',
                    experiment,
                  );
                  if (target) document.getElementById(target)?.focus();
                }}
              >
                {arrival.entry === 'edit-delivery-link' ? ARRIVAL_GO.webLink : ARRIVAL_GO.catalogue}
              </Button>
            )
          }
        >
          {arrival.joined ? arrivalJoinBody(arrival.entry) : arrivalNewBody(arrival.entry, live)}
        </Notice>
      ) : null}

      <DetailLayout
        asideId={ID.panel}
        asideLabelledBy={ID.panelTitle}
        main={
          <>
            {returned ? (
              <CmReturnedReason
                title={UPDATE_SHEET.returnedTitle}
                titleId={ID.returned}
                meta={returnedMeta(dateTime(returned.at), cmActorName(returned.by))}
                reason={returned.reason}
                by={cmActorName(returned.by) ? returnedBy(cmActorName(returned.by)) : undefined}
                hint={UPDATE_SHEET.returnedHint}
              />
            ) : null}
            {editable ? (
              <DraftSheet
                form={form}
                experiment={experiment}
                changed={changed}
                errors={fieldErrors}
                onChange={change}
                livePackageReference={(format) => {
                  const delivery = livePackage(format);
                  return delivery && delivery.format !== 'web' ? delivery.packageReference : null;
                }}
                formats={formats}
              />
            ) : update.whatChangesAndWhy ? (
              <CmFormSection
                title={UPDATE_SHEET.whyTitle}
                titleId={ID.readOnlyWhyTitle}
                note={update.versionLabel ? versionNote(update.versionLabel) : undefined}
              >
                <Quote>{update.whatChangesAndWhy}</Quote>
              </CmFormSection>
            ) : null}
            <ComparisonSection
              rows={rows}
              released={update.state === 'released'}
              changeError={editable ? fieldErrors.change : undefined}
            />
            <CmFormSection
              title={UPDATE_SHEET.historyTitle}
              titleId={ID.historyTitle}
              note={UPDATE_SHEET.historyNote}
            >
              <Timeline events={history} />
            </CmFormSection>
          </>
        }
        aside={
          <DecisionPanel title={UPDATE_PANEL.title} titleId={ID.panelTitle}>
            <CmStateNotice id={ID.state} {...stateNoticeOf(update, live)} />
            {editable ? (
              <>
                {errors ? (
                  <ErrorSummary
                    key={errors.attempt}
                    id={ID.summary}
                    title={errors.title}
                    items={summaryItems(fieldErrors)}
                  />
                ) : null}
                {saveFailed ? (
                  <CmSaveFailed
                    id={ID.saveFailed}
                    title={UPDATE_PANEL.saveFailedTitle}
                    retryLabel={UPDATE_PANEL.tryAgain}
                    busy={saveCmd.busy}
                    busyLabel={UPDATE_PANEL.saving}
                    onRetry={onSave}
                  >
                    {UPDATE_PANEL.saveFailedLine}
                  </CmSaveFailed>
                ) : null}
                {saved ? (
                  <Notice
                    tone="ok"
                    icon="check"
                    role="status"
                    id={ID.saved}
                    title={UPDATE_PANEL.savedTitle}
                  >
                    {savedLine(saved)}
                  </Notice>
                ) : null}
                <StandList
                  items={[
                    { term: UPDATE_PANEL.changes, value: changesWords(changed.size) },
                    {
                      term: UPDATE_PANEL.lastSaved,
                      value: lastSavedWords(dateTime(lastSavedAt(update)), typed.isTyped),
                    },
                  ]}
                />
                {pendingOf(form, live, changed.size) ? (
                  <PendingHint>{pendingOf(form, live, changed.size)}</PendingHint>
                ) : null}
                <GoButton id={ID.send} onClick={onSend}>
                  {UPDATE_PANEL.send}
                </GoButton>
                <CmWideButton
                  id={ID.save}
                  busy={saveCmd.busy && dialog !== 'send'}
                  busyLabel={UPDATE_PANEL.saving}
                  onClick={onSave}
                >
                  {UPDATE_PANEL.saveDraft}
                </CmWideButton>
                <CmWideButton variant="ghost" id={ID.withdraw} onClick={onWithdraw}>
                  {UPDATE_PANEL.withdraw}
                </CmWideButton>
              </>
            ) : (
              <>
                {canWithdraw(update.state) ? (
                  <CmWideButton id={ID.withdraw} onClick={onWithdraw}>
                    {UPDATE_PANEL.withdraw}
                  </CmWideButton>
                ) : null}
                <CmWideLink href={publishedHref} onClick={backToPublished}>
                  {UPDATE_PANEL.openPublished}
                </CmWideLink>
              </>
            )}
          </DecisionPanel>
        }
      />

      <ConfirmDialog
        open={dialog === 'send'}
        idPrefix="cm-dlg-send"
        title={sendTitle(experiment.live.catalogue.name)}
        description={SEND_DIALOG.description}
        groups={[
          {
            kind: 'now',
            title: SEND_DIALOG.now,
            items: [SEND_DIALOG.reviewerCanReview, sendStaysLive(live)],
          },
          {
            kind: 'later',
            title: SEND_DIALOG.later,
            items: [SEND_DIALOG.ifApproved, SEND_DIALOG.releasing],
          },
        ]}
        cancelLabel={SEND_DIALOG.cancel}
        confirmLabel={SEND_DIALOG.confirm}
        busy={sending}
        busyLabel={SEND_DIALOG.busy}
        holdWhileBusy
        onConfirm={() => void doSend()}
        onCancel={closeDialog}
        returnFocusFallback={titleRef}
      >
        {dialogNotice === 'unavailable' && dialog === 'send' ? (
          <ErrorSummary alwaysShown title={stateWords('CM-08.unavailable.send')} items={[]} />
        ) : undefined}
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === 'withdraw'}
        idPrefix="cm-dlg-wd"
        title={withdrawTitle(experiment.live.catalogue.name)}
        description={WITHDRAW_DIALOG.description}
        initialFocus="field"
        cancelLabel={WITHDRAW_DIALOG.cancel}
        confirmLabel={WITHDRAW_DIALOG.confirm}
        confirmVariant="navy"
        tightBody
        busy={withdrawCmd.busy}
        busyLabel={WITHDRAW_DIALOG.busy}
        holdWhileBusy
        onConfirm={doWithdraw}
        onCancel={closeDialog}
        returnFocusFallback={titleRef}
      >
        {dialogNotice === 'unavailable' && dialog === 'withdraw' ? (
          <ErrorSummary alwaysShown title={stateWords('CM-08.unavailable.withdraw')} items={[]} />
        ) : null}
        <Field
          id={ID.reason}
          label={WITHDRAW_DIALOG.reason}
          hint={WITHDRAW_DIALOG.reasonHint}
          error={reasonError ?? undefined}
        >
          <Textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setReasonError(null);
            }}
          />
        </Field>
      </ConfirmDialog>
    </>
  );
}

/** The band's facts by state (the export's `facts`), the label and changes as typed while editable. */
function factsOf(
  update: CorrectionUpdate,
  live: string,
  versionLabel: string,
  changedCount: number,
): CmIdentityFact[] {
  const fieldsFact: CmIdentityFact = {
    key: 'fields',
    term: UPDATE_FACTS.fieldsChanged,
    value: changedCount > 0 ? fieldsWords(changedCount) : UPDATE_FACTS.noneYet,
    quiet: changedCount === 0,
  };
  switch (update.state) {
    case 'draft':
    case 'returned':
      return [
        { key: 'live', term: UPDATE_FACTS.liveVersion, value: liveUntilReleased(live) },
        {
          key: 'proposed',
          term: UPDATE_FACTS.proposed,
          value: versionLabel || UPDATE_FACTS.notSetYet,
          quiet: !versionLabel,
        },
        fieldsFact,
        {
          key: 'started',
          term: UPDATE_FACTS.started,
          value: startedFact(dayMonthYear(update.startedAt), update.entry),
        },
      ];
    case 'released':
      return [
        { key: 'before', term: UPDATE_FACTS.liveBefore, value: update.baseVersionLabel },
        { key: 'version', term: UPDATE_FACTS.releasedVersion, value: versionLabel },
        fieldsFact,
        {
          key: 'released',
          term: UPDATE_FACTS.released,
          value: update.release
            ? releasedFact(dayMonthYear(update.release.at), cmActorName(update.release.by))
            : '',
        },
      ];
    case 'withdrawn':
      return [
        { key: 'live', term: UPDATE_FACTS.liveVersion, value: liveUnchanged(live) },
        {
          key: 'proposed',
          term: UPDATE_FACTS.proposed,
          value: versionLabel || UPDATE_FACTS.notSet,
          quiet: !versionLabel,
        },
        fieldsFact,
        {
          key: 'withdrawn',
          term: UPDATE_FACTS.withdrawn,
          value: update.withdrawal ? dayMonthYear(update.withdrawal.at) : '',
        },
      ];
    default:
      return [
        { key: 'live', term: UPDATE_FACTS.liveVersion, value: liveUntilReleased(live) },
        { key: 'proposed', term: UPDATE_FACTS.proposed, value: versionLabel },
        fieldsFact,
        {
          key: 'sent',
          term: UPDATE_FACTS.sent,
          value: update.sentForReviewAt ? dayMonthYear(update.sentForReviewAt) : '',
        },
      ];
  }
}

/** Where the correction stands, first in the panel (the export's `N` by state). */
function stateNoticeOf(
  update: CorrectionUpdate,
  live: string,
): Omit<CmStateNoticeProps, 'id' | 'ref'> {
  switch (update.state) {
    case 'draft':
      return { tone: 'info', icon: 'edit', title: STATE_NOTICE.draft, children: draftLine(live) };
    case 'returned': {
      const returned = lastUpdateDecision(update, 'return-to-content-manager');
      return {
        tone: 'info',
        icon: 'alertCircle',
        title: STATE_NOTICE.returned,
        children: returnedLine(
          returned ? cmActorName(returned.by) : null,
          returned ? dayMonthYear(returned.at) : null,
          live,
        ),
      };
    }
    case 'in-academic-review':
      return {
        tone: 'info',
        icon: 'clock',
        title: STATE_NOTICE.review,
        children: inReviewLine(dayMonthYear(update.sentForReviewAt ?? update.updatedAt), live),
      };
    case 'awaiting-release-decision': {
      const approval = lastUpdateDecision(update, 'approve');
      const lifted = update.holdLifts.at(-1);
      return {
        tone: 'info',
        icon: 'clock',
        title: STATE_NOTICE.awaiting,
        children: awaitingLine(
          approval ? cmActorName(approval.by) : '',
          dayMonthYear(approval?.at ?? awaitingSince(update) ?? update.updatedAt),
          live,
        ),
        ...(lifted ? { extra: liftedLine(dayMonthYear(lifted.at)) } : {}),
      };
    }
    case 'on-hold':
      return {
        tone: 'paused',
        icon: 'pauseCircle',
        title: STATE_NOTICE.hold,
        children: holdLine(dayMonthYear(update.hold?.at ?? update.updatedAt), live),
        ...(update.hold
          ? {
              reason: {
                label: UPDATE_PANEL.reason,
                text: holdReason(update.hold.reason, cmActorName(update.hold.by)),
              },
            }
          : {}),
      };
    case 'released':
      return {
        tone: 'ok',
        icon: 'check',
        title: STATE_NOTICE.released,
        children: releasedLine(
          update.versionLabel ?? '',
          dayMonthYear(update.release?.at ?? update.updatedAt),
          update.baseVersionLabel,
        ),
      };
    case 'withdrawn':
      return {
        tone: 'off',
        icon: 'ended',
        title: STATE_NOTICE.withdrawn,
        children: withdrawnLine(dayMonthYear(update.withdrawal?.at ?? update.updatedAt)),
        ...(update.withdrawal
          ? {
              reason: { label: UPDATE_PANEL.reason, text: quotedReason(update.withdrawal.reason) },
            }
          : {}),
      };
  }
}

/**
 * The stale notice's words: approved meanwhile (the export's `staleText`, with the approval's time)
 * once the update read again has been approved; else the register's words for the refusal.
 */
function staleLine(update: CorrectionUpdate, refusal: Refusal): string {
  const approval = lastUpdateDecision(update, 'approve');
  if (approval && !isEditable(update.state) && update.state !== 'in-academic-review') {
    return approvedMeanwhileLine(dateTime(approval.at).split(', ')[1] ?? '');
  }
  return stateWords(refusal === 'stale' ? 'CM-08.stale' : 'CM-08.moved-on');
}

/** What is still missing before it can be sent (`pending`), from the form as typed. */
function pendingOf(form: CorrectionForm, live: string, changedCount: number): string | null {
  const parts: string[] = [];
  if (form.whatChangesAndWhy.trim() === '') parts.push(PENDING_PARTS.why);
  const label = form.versionLabel.trim();
  if (label === '' || label === live) parts.push(PENDING_PARTS.version);
  if (changedCount === 0) parts.push(PENDING_PARTS.change);
  return parts.length > 0 ? pendingLine(parts) : null;
}

/** The check's links, in page order; the change link lands on the summary. */
function summaryItems(fields: CorrectionErrors): ErrorSummaryItem[] {
  const items: ErrorSummaryItem[] = [];
  if (fields.whatChangesAndWhy)
    items.push({ fieldId: ID.why, summaryText: fields.whatChangesAndWhy });
  if (fields.versionLabel) items.push({ fieldId: ID.version, summaryText: fields.versionLabel });
  if (fields.change) items.push({ fieldId: ID.summaryField, summaryText: fields.change });
  return items;
}

/** The editable sheet: About this correction, Catalogue details, Delivery (the export's `E.edit`). */
function DraftSheet({
  form,
  experiment,
  changed,
  errors,
  onChange,
  livePackageReference,
  formats,
}: {
  readonly form: CorrectionForm;
  readonly experiment: Experiment;
  readonly changed: ReadonlySet<string>;
  readonly errors: CorrectionErrors;
  readonly onChange: (
    field: keyof CorrectionErrors | null,
    next: (current: CorrectionForm) => CorrectionForm,
  ) => void;
  readonly livePackageReference: (format: PackageFormat) => string | null;
  readonly formats: ReturnType<typeof deliveryFormatsOf>;
}) {
  const text =
    (
      field: keyof CorrectionErrors | null,
      set: (current: CorrectionForm, value: string) => CorrectionForm,
    ) =>
    (value: string) =>
      onChange(field, (current) => set(current, value));
  const tag = (key: string) => (changed.has(key) ? UPDATE_SHEET.changed : undefined);
  return (
    <>
      <CmFormSection
        title={UPDATE_SHEET.aboutTitle}
        titleId={ID.aboutTitle}
        note={UPDATE_SHEET.aboutNote}
      >
        <CmFormGrid about>
          <Field
            id={ID.why}
            label={UPDATE_SHEET.whyLabel}
            hint={UPDATE_SHEET.whyHint}
            error={errors.whatChangesAndWhy}
          >
            <Textarea
              value={form.whatChangesAndWhy}
              onChange={(event) =>
                text('whatChangesAndWhy', (current, value) => ({
                  ...current,
                  whatChangesAndWhy: value,
                }))(event.target.value)
              }
            />
          </Field>
          <Field
            id={ID.version}
            label={UPDATE_SHEET.versionLabel}
            hint={versionHint(experiment.live.label)}
            error={errors.versionLabel}
          >
            <TextInput
              value={form.versionLabel}
              autoComplete="off"
              onChange={(event) =>
                text('versionLabel', (current, value) => ({ ...current, versionLabel: value }))(
                  event.target.value,
                )
              }
            />
          </Field>
        </CmFormGrid>
      </CmFormSection>
      <CmFormSection
        title={UPDATE_SHEET.catalogueTitle}
        titleId={ID.catalogueTitle}
        note={UPDATE_SHEET.catalogueNote}
      >
        <CmForm>
          <CmCorrectionField
            id={ID.name}
            label={UPDATE_SHEET.name}
            changed={tag('name')}
            value={form.name}
            onChange={text(null, (current, value) => ({ ...current, name: value }))}
          />
          <CmCorrectionField
            id={ID.summaryField}
            label={UPDATE_SHEET.summary}
            hint={UPDATE_SHEET.summaryHint}
            changed={tag('summary')}
            multiline
            height="short"
            // "Change at least one …" is described here too: its summary link lands on this field.
            describedBy={errors.change ? ID.change : undefined}
            value={form.summary}
            onChange={text(null, (current, value) => ({ ...current, summary: value }))}
          />
          <CmCorrectionField
            id={ID.description}
            label={UPDATE_SHEET.description}
            changed={tag('description')}
            multiline
            height="long"
            value={form.description}
            onChange={text(null, (current, value) => ({ ...current, description: value }))}
          />
        </CmForm>
      </CmFormSection>
      <CmFormSection
        title={UPDATE_SHEET.deliveryTitle}
        titleId={ID.deliveryTitle}
        note={UPDATE_SHEET.deliveryNote}
      >
        <CmForm>
          {formats.web ? (
            <CmCorrectionField
              id={ID.web}
              label={UPDATE_SHEET.webLink}
              hint={UPDATE_SHEET.webHint}
              changed={tag('webLink')}
              type="url"
              code
              value={form.webLink ?? ''}
              onChange={text(null, (current, value) => ({ ...current, webLink: value }))}
            />
          ) : null}
          {formats.packages.length > 0 ? (
            <CmFormGrid>
              {formats.packages.map((format) => (
                <CmCorrectionField
                  key={format}
                  id={packageFieldId(format)}
                  label={packageReferenceLabel(format)}
                  hint={packageHint(livePackageReference(format))}
                  changed={tag(`packageReferences:${format}`)}
                  code
                  value={form.packageReferences[format] ?? ''}
                  onChange={text(null, (current, value) => ({
                    ...current,
                    packageReferences: { ...current.packageReferences, [format]: value },
                  }))}
                />
              ))}
            </CmFormGrid>
          ) : null}
        </CmForm>
      </CmFormSection>
    </>
  );
}

/**
 * “Current and proposed” (Live now · Proposed), or once released “What changed” (Live before ·
 * Released): the changed fields only; the change error sits above it.
 */
function ComparisonSection({
  rows,
  released,
  changeError,
}: {
  readonly rows: readonly CorrectionComparisonRow[];
  readonly released: boolean;
  readonly changeError: string | undefined;
}) {
  const title = released ? UPDATE_SHEET.releasedComparisonTitle : UPDATE_SHEET.comparisonTitle;
  return (
    <CmFormSection
      title={title}
      titleId={ID.comparisonTitle}
      note={released ? UPDATE_SHEET.releasedComparisonNote : UPDATE_SHEET.comparisonNote}
    >
      <CmComparison
        {...(changeError ? { error: { id: ID.change, text: changeError } } : {})}
        caption={comparisonCaption(title)}
        columns={{
          field: UPDATE_SHEET.field,
          before: released ? UPDATE_SHEET.liveBefore : UPDATE_SHEET.liveNow,
          after: released ? UPDATE_SHEET.releasedColumn : UPDATE_SHEET.proposed,
        }}
        empty={UPDATE_SHEET.nothingChanged}
        rows={rows.map((row) => ({
          key: `${row.field}-${row.format ?? ''}`,
          field: comparisonFieldLabel(row),
          before: row.liveNow ?? '',
          after: row.proposed ?? '',
        }))}
      />
    </CmFormSection>
  );
}
