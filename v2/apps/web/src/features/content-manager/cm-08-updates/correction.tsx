'use client';

import type { Result, ServiceError, ValidationFailed } from '@xr/contracts/draft';
import type { CorrectionUpdate, Experiment } from '@xr/domain';
import {
  BackLink,
  Button,
  ConfirmDialog,
  ErrorSummary,
  type ErrorSummaryItem,
  Field,
  FieldError,
  Icon,
  Link,
  Notice,
  PageContent,
  PageHeader,
  ReasonDialog,
  Section,
  SectionBody,
  StatusPill,
  Textarea,
  TextInput,
  Timeline,
} from '@xr/ui';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  awaitingLine,
  draftSavedLine,
  inReviewLine,
  LIVE_UNCHANGED,
  NO_UPDATE,
  packageReferenceLabel,
  returnedMeta,
  SEND_DIALOG,
  sendEffect,
  UPDATE_NOTICES,
  UPDATE_PAGE,
  updateOverline,
  updateTitle,
  versionHint,
  versionMeta,
  WITHDRAW_DIALOG,
  withdrawnLine,
} from '@/copy/cm-correction';
import { dateTime, dayMonthYear } from '@/copy/dates';
import { updateHeadingWords, updateWords, wordsOf } from '@/copy/flow-state-words';
import { stateWords } from '@/copy/state-copy';
import {
  CONTENT_LIBRARY_ADDRESS,
  type CorrectionFocus,
  correctionFocusOf,
  correctionPlacement,
  publishedExperimentAddress,
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
  releasedComparison,
  saveInputOf,
  withdrawErrorOf,
} from '@/queries/cm-correction-forms';
import type { CorrectionComparisonRow, CorrectionUpdateView } from '@/queries/correction-view';
import { useCorrectionUpdate } from '@/queries/corrections';
import { usePublishedExperiment } from '@/queries/production';
import { useCommand } from '@/queries/use-command';

import { CorrectionComparison } from '../../shared/correction-comparison/correction-comparison';
import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  clearTypedCorrection,
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
  packageFieldId,
  isOpen,
  lastDecision,
  actorName,
  updateChipTone,
  updateHistory,
} from './correction-view';

const ID = CORRECTION_FIELD_IDS;

interface CorrectionPageView extends CorrectionUpdateView {
  readonly experiment: Experiment;
}

/**
 * CM-08 an update — the correction draft that CM-06 “Edit catalogue details”, CM-07 “Edit delivery
 * link” and “Start a correction” open (B6-09 f1, f2, f4; B6-11 f11), and every later state (f3, f5
 * … f8; B6-11 f10; B7-11 f3), at `/content-manager/updates/[updateId]`.
 *
 * - **Read**: `CorrectionService.getUpdate` — the update and its saved comparison — and the
 *   experiment it corrects (`getPublishedExperiment`: the live version the draft is compared with,
 *   its formats and name). An update the service does not answer is B6-13 f0 “No update open”.
 * - **As B6-09 draws it** (`xr-wrap--read`): “Back to the published experiment”, “<UPD> ·
 *   correction to <name> (live version <base>)”, “Update to version <label>”, the state chip and
 *   “Live version <live> unchanged”; then the returned reason first (f2), or the state notice
 *   (in academic review, awaiting release decision, on hold, released, withdrawn).
 * - **Draft or returned — editable** (`div.xr-section.xg-form`, AR-8): What changes and why, the
 *   catalogue details (Name, Summary, Description) and the delivery of the formats the experiment
 *   has (WEB web link, each package reference), pre-filled with the live version; the version
 *   label; “Current and proposed” from the form as typed (state-copy `CM-08.comparison`); the
 *   update history; Withdraw update (DL-2) · Save draft · Send for academic review (DL-1). Send
 *   checks the three drawn rules at once with the error summary “Check the update” (B6-11 f11),
 *   then saves what is on the page and sends it (`CM-08.send-saves-first`). Typed work is kept in
 *   memory for the tab (`CM-08.kept`); `?focus=` focuses the field the entry names (`CM-08.focus`).
 * - **Sent on — read-only**: what changes and why with the version, the comparison, the history;
 *   Withdraw stays while it is in academic review.
 * - Every command carries the revision it was typed on; a stale or moved-on update is read again
 *   with a calm notice and what was typed stays. Nothing here changes the live version or anyone’s
 *   access: only the Super Admin’s Release does that (BC8, BC9).
 */
export function Correction({ updateId }: { readonly updateId: string }) {
  const navigation = useAppNavigation();
  const read = useCorrectionUpdate(updateId);
  const view = read.data?.ok ? read.data.value : null;
  const experimentRead = usePublishedExperiment(view ? view.update.experimentId : null);
  // The top bar names the destination below 1024 px (f2 … f8); the crumbs name the update.
  useShellPage(correctionPlacement(view ? view.update.id : null));

  const answer = read.data;
  const experimentAnswer = experimentRead.data;
  let data: Result<CorrectionPageView, ServiceError> | undefined;
  if (answer && !answer.ok) data = answer;
  else if (answer?.ok && experimentAnswer && !experimentAnswer.ok) data = experimentAnswer;
  else if (answer?.ok && experimentAnswer?.ok) {
    data = {
      ok: true,
      value: { ...answer.value, experiment: experimentAnswer.value.experiment },
      changed: [],
    };
  }
  const noUpdate = <NoUpdate />;
  return (
    <PageContent wrap="read">
      <RecordGuard
        read={{
          data,
          isPending: read.isPending || (answer?.ok === true && experimentRead.isPending),
          isError: read.isError || experimentRead.isError,
          refetch: () => {
            void read.refetch();
            void experimentRead.refetch();
          },
        }}
        loadingLabel={stateWords('CM-08.loading')}
        failed={{ title: stateWords('CM-08.failed'), line: stateWords('CM-08.failed.line') }}
        refusals={{ 'not-found': noUpdate, 'not-permitted': noUpdate }}
      >
        {(page) => (
          <UpdatePage
            key={page.update.id}
            update={page.update}
            comparison={page.comparison}
            experiment={page.experiment}
            focus={correctionFocusOf(navigation.search)}
            onReread={() => {
              void read.refetch();
              void experimentRead.refetch();
            }}
          />
        )}
      </RecordGuard>
    </PageContent>
  );
}

/** B6-13 f0: no update at this address (state-copy `CM-08.no-update`); its heading is the H1. */
function NoUpdate() {
  return (
    <div className="xr-empty">
      <span className="xr-empty-icon">
        <Icon name="updates" size={20} />
      </span>
      <h1 className="xr-h3 m-0">{NO_UPDATE.title}</h1>
      <p className="xr-body m-0 text-ink-2">{NO_UPDATE.line}</p>
      <div className="flex flex-wrap gap-3">
        <Link className="xr-btn xr-btn--secondary" href={CONTENT_LIBRARY_ADDRESS}>
          {NO_UPDATE.action}
        </Link>
      </div>
    </div>
  );
}

/** A refused or failed command, as the page says it (state-copy `CM-08.*`). */
type PageNotice = 'stale' | 'moved-on' | 'unavailable-save';

interface FocusRequest {
  readonly id: string;
  readonly seq: number;
}

function UpdatePage({
  update,
  comparison,
  experiment,
  focus,
  onReread,
}: {
  readonly update: CorrectionUpdate;
  readonly comparison: readonly CorrectionComparisonRow[];
  readonly experiment: Experiment;
  readonly focus: CorrectionFocus | null;
  readonly onReread: () => void;
}) {
  const sessionKey = useCorrectionSessionKey();
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

  const [errors, setErrors] = useState<{
    readonly title: string;
    readonly fields: CorrectionErrors;
    readonly attempt: number;
  } | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [notice, setNotice] = useState<PageNotice | null>(null);
  const [dialog, setDialog] = useState<'send' | 'withdraw' | null>(null);
  const [dialogNotice, setDialogNotice] = useState<'unavailable' | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

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
  const baseLabel = update.baseVersionLabel;
  const rows: readonly CorrectionComparisonRow[] = editable
    ? formComparison(form, experiment)
    : update.state === 'released'
      ? (releasedComparison(update, experiment) ?? comparison)
      : comparison;
  const history = updateHistory(update);
  const chipWords = wordsOf(updateWords(update.state, 'content_manager')) ?? '';

  const showErrors = (failed: ValidationFailed) => {
    const fields = correctionErrorsOf(failed);
    if (!fields.whatChangesAndWhy && !fields.versionLabel && !fields.change) return false;
    setErrors((current) => ({
      title: failed.summaryTitle ?? UPDATE_PAGE.checkTitle,
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
      setNotice('stale');
      onReread();
      return;
    }
    setNotice('moved-on');
    onReread();
    requestFocus(ID.title);
  };

  const change = (
    field: keyof CorrectionErrors | null,
    next: (current: CorrectionForm) => CorrectionForm,
  ) => {
    typed.change(next);
    setSaved(null);
    if (errors) {
      const fields = { ...errors.fields, change: undefined };
      if (field) fields[field] = undefined;
      setErrors(fields.whatChangesAndWhy || fields.versionLabel ? { ...errors, fields } : null);
    }
  };

  const expectedRev = typed.expectedRev ?? update.rev;

  const onSave = () => {
    if (saveCmd.busy) return;
    setNotice(null);
    saveCmd.run(saveInputOf(update.id, form, expectedRev)).then(
      (answer) => {
        if (!answer.ok) {
          refused(answer.error);
          return;
        }
        clearTypedCorrection(sessionKey, update.id);
        setErrors(null);
        setSaved(draftSavedLine(dateTime(answer.value.updatedAt)));
        requestFocus(ID.saved);
      },
      () => setNotice('unavailable-save'),
    );
  };

  const onSend = () => {
    setNotice(null);
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

  const doSend = async () => {
    if (saveCmd.busy || sendCmd.busy) return;
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
      requestFocus(ID.title);
    } catch {
      setDialogNotice('unavailable');
    }
  };

  const onWithdraw = () => {
    setNotice(null);
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
        requestFocus(ID.title);
      },
      () => setDialogNotice('unavailable'),
    );
  };

  const returned =
    update.state === 'returned' ? lastDecision(update, 'return-to-content-manager') : null;

  return (
    <>
      <PageHeader
        className="[margin:8px_0_16px]"
        back={
          <BackLink
            href={publishedExperimentAddress(update.experimentId)}
            onClick={(event) => {
              // Only a plain click leaves this tab for the experiment (B6-08 f3 says so there).
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
              if (event.altKey || !isOpen(update.state)) return;
              noteBackFromCorrection(sessionKey, update.experimentId);
            }}
          >
            {UPDATE_PAGE.backToPublished}
          </BackLink>
        }
        overline={updateOverline(update.id, experiment.live.catalogue.name, baseLabel)}
        title={updateTitle(editable ? form.versionLabel : update.versionLabel)}
        titleId={ID.title}
        titleFocusTarget
        titleRef={titleRef}
        meta={
          <>
            <StatusPill tone={updateChipTone(update.state)}>{chipWords}</StatusPill>
            {update.state === 'released' ? null : (
              <span className="xg-live">
                <Icon name="readOnly" size={16} />
                {LIVE_UNCHANGED.before} <span>{live}</span> {LIVE_UNCHANGED.after}
              </span>
            )}
          </>
        }
      />
      <div className="flex flex-col gap-5">
        {returned ? (
          <section className="xv-reason" aria-labelledby="cm-urt">
            <div className="xv-reason-head">
              <Icon name="quote" />
              <div>
                <h2 className="xr-h3 m-0" id="cm-urt">
                  {wordsOf(updateHeadingWords(update) ?? '')}
                </h2>
                <span className="xr-meta">
                  {returnedMeta(dateTime(returned.at), actorName(returned.by))}
                </span>
              </div>
            </div>
            <blockquote className="xv-quote">{returned.reason}</blockquote>
          </section>
        ) : null}
        <StateNotice update={update} />
        {notice ? <RefusedNotice notice={notice} /> : null}
        {saved ? (
          <p className="xa-save is-ok m-0" role="status" id={ID.saved} tabIndex={-1}>
            <Icon name="done" />
            {saved}
          </p>
        ) : null}
        {editable ? (
          <DraftForm
            form={form}
            experiment={experiment}
            rows={rows}
            history={history}
            errors={errors}
            saving={saveCmd.busy && dialog !== 'send'}
            onChange={change}
            onSave={onSave}
            onSend={onSend}
            onWithdraw={onWithdraw}
          />
        ) : (
          <>
            <Section
              title={UPDATE_PAGE.whyTitle}
              meta={update.versionLabel ? versionMeta(update.versionLabel) : undefined}
            >
              <SectionBody className="flex flex-col gap-[14px]">
                {update.whatChangesAndWhy ? (
                  <p className="xr-body m-0">{update.whatChangesAndWhy}</p>
                ) : null}
                {rows.length > 0 ? <CorrectionComparison rows={rows} /> : null}
              </SectionBody>
            </Section>
            <Section title={UPDATE_PAGE.historyTitle} meta={UPDATE_PAGE.historyMeta}>
              <SectionBody>
                <Timeline events={history} markLatest={false} />
              </SectionBody>
            </Section>
            {canWithdraw(update.state) ? (
              <div className="xw-actions">
                <Button variant="text" className="xg-del" id={ID.withdraw} onClick={onWithdraw}>
                  {UPDATE_PAGE.withdraw}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
      <ConfirmDialog
        open={dialog === 'send'}
        idPrefix="cm-us"
        align="end"
        title={SEND_DIALOG.title}
        effect={<strong>{sendEffect(live)}</strong>}
        notice={
          dialogNotice === 'unavailable' ? (
            <Notice tone="err" role="alert">
              {stateWords('CM-08.unavailable.send')}
            </Notice>
          ) : undefined
        }
        confirmLabel={SEND_DIALOG.confirm}
        busy={saveCmd.busy || sendCmd.busy}
        busyLabel={SEND_DIALOG.busy}
        onConfirm={() => void doSend()}
        onCancel={() => setDialog(null)}
        returnFocusFallback={titleRef}
      />
      <ReasonDialog
        open={dialog === 'withdraw'}
        idPrefix="cm-uw"
        align="end"
        destructive
        title={WITHDRAW_DIALOG.title}
        effect={WITHDRAW_DIALOG.effect}
        confirmLabel={WITHDRAW_DIALOG.confirm}
        busy={withdrawCmd.busy}
        busyLabel={WITHDRAW_DIALOG.busy}
        onConfirm={doWithdraw}
        onCancel={() => setDialog(null)}
        returnFocusFallback={titleRef}
      >
        {dialogNotice === 'unavailable' ? (
          <Notice tone="err" role="alert" className="mb-[14px]">
            {stateWords('CM-08.unavailable.withdraw')}
          </Notice>
        ) : null}
        <Field id={ID.reason} label={WITHDRAW_DIALOG.reason} error={reasonError ?? undefined}>
          <Textarea
            className="min-h-[96px]"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setReasonError(null);
            }}
          />
        </Field>
      </ReasonDialog>
    </>
  );
}

/** The state notice under the header (B6-09 f3, f5 … f8). */
function StateNotice({ update }: { readonly update: CorrectionUpdate }) {
  const base = update.baseVersionLabel;
  switch (update.state) {
    case 'in-academic-review':
      return (
        <Notice tone="info" role="status" title={UPDATE_NOTICES.reviewTitle}>
          {inReviewLine(dayMonthYear(update.sentForReviewAt ?? update.updatedAt), base)}
        </Notice>
      );
    case 'awaiting-release-decision': {
      const approval = lastDecision(update, 'approve');
      return (
        <Notice tone="info" role="status" title={UPDATE_NOTICES.awaitingTitle}>
          {awaitingLine(
            approval ? actorName(approval.by) : '',
            dayMonthYear(approval?.at ?? update.updatedAt),
            base,
          )}
        </Notice>
      );
    }
    case 'on-hold':
      return (
        <Notice tone="warn" role="status" title={UPDATE_NOTICES.holdTitle}>
          {UPDATE_NOTICES.holdLine}
        </Notice>
      );
    case 'released':
      return (
        <Notice tone="ok" role="status" title={UPDATE_NOTICES.releasedTitle}>
          {UPDATE_NOTICES.releasedLine}
        </Notice>
      );
    case 'withdrawn':
      return (
        <Notice tone="quiet" role="status" title={UPDATE_NOTICES.withdrawnTitle}>
          {withdrawnLine(
            dayMonthYear(update.withdrawal?.at ?? update.updatedAt),
            update.withdrawal?.reason ?? '',
          )}
        </Notice>
      );
    default:
      return null;
  }
}

function RefusedNotice({ notice }: { readonly notice: PageNotice }) {
  if (notice === 'unavailable-save') {
    return (
      <Notice tone="err" role="alert">
        {stateWords('CM-08.unavailable.save')}
      </Notice>
    );
  }
  return (
    <Notice tone="warn" role="alert">
      {stateWords(notice === 'stale' ? 'CM-08.stale' : 'CM-08.moved-on')}
    </Notice>
  );
}

/** The correction draft (B6-09 f1, f2, f4; B6-11 f11): `div.xr-section.xg-form`. */
function DraftForm({
  form,
  experiment,
  rows,
  history,
  errors,
  saving,
  onChange,
  onSave,
  onSend,
  onWithdraw,
}: {
  readonly form: CorrectionForm;
  readonly experiment: Experiment;
  readonly rows: readonly CorrectionComparisonRow[];
  readonly history: ReturnType<typeof updateHistory>;
  readonly errors: {
    readonly title: string;
    readonly fields: CorrectionErrors;
    readonly attempt: number;
  } | null;
  readonly saving: boolean;
  readonly onChange: (
    field: keyof CorrectionErrors | null,
    next: (current: CorrectionForm) => CorrectionForm,
  ) => void;
  readonly onSave: () => void;
  readonly onSend: () => void;
  readonly onWithdraw: () => void;
}) {
  const formats = deliveryFormatsOf(experiment);
  const fields = errors?.fields ?? {};
  const items: ErrorSummaryItem[] = [];
  if (fields.whatChangesAndWhy)
    items.push({ fieldId: ID.why, summaryText: fields.whatChangesAndWhy });
  if (fields.versionLabel) items.push({ fieldId: ID.version, summaryText: fields.versionLabel });
  if (fields.change) items.push({ fieldId: ID.summaryField, summaryText: fields.change });
  const text =
    (
      field: keyof CorrectionErrors | null,
      set: (current: CorrectionForm, value: string) => CorrectionForm,
    ) =>
    (event: { readonly target: { readonly value: string } }) => {
      const value = event.target.value;
      onChange(field, (current) => set(current, value));
    };
  return (
    <div className="xr-section xg-form">
      {errors && items.length > 0 ? (
        <ErrorSummary key={errors.attempt} id={ID.summary} title={errors.title} items={items} />
      ) : null}
      <section aria-labelledby="cm-uw-h" className="flex flex-col gap-3">
        <h2 className="xr-h2 m-0" id="cm-uw-h">
          {UPDATE_PAGE.whyTitle}
        </h2>
        <Field
          id={ID.why}
          label={UPDATE_PAGE.whyLabel}
          hint={UPDATE_PAGE.whyHint}
          error={fields.whatChangesAndWhy}
        >
          <Textarea
            className="min-h-[104px]"
            value={form.whatChangesAndWhy}
            onChange={text('whatChangesAndWhy', (current, value) => ({
              ...current,
              whatChangesAndWhy: value,
            }))}
          />
        </Field>
      </section>
      <section aria-labelledby="cm-uc-h" className="flex flex-col gap-3">
        <h2 className="xr-h2 m-0" id="cm-uc-h">
          {UPDATE_PAGE.catalogueTitle}
        </h2>
        <p className="xl-meta m-0">{UPDATE_PAGE.catalogueLine}</p>
        <Field id={ID.name} label={UPDATE_PAGE.name}>
          <TextInput
            className="max-w-[640px]"
            value={form.name}
            onChange={text(null, (current, value) => ({ ...current, name: value }))}
          />
        </Field>
        <Field id={ID.summaryField} label={UPDATE_PAGE.summary} hint={UPDATE_PAGE.summaryHint}>
          {(control) => (
            <Textarea
              className="min-h-[80px]"
              // "Change at least one …" is described here too: its summary link lands on this field.
              aria-describedby={
                fields.change
                  ? `${control['aria-describedby'] ?? ''} ${ID.change}`.trim()
                  : control['aria-describedby']
              }
              value={form.summary}
              onChange={text(null, (current, value) => ({ ...current, summary: value }))}
            />
          )}
        </Field>
        <Field id={ID.description} label={UPDATE_PAGE.description}>
          <Textarea
            className="min-h-[140px]"
            value={form.description}
            onChange={text(null, (current, value) => ({ ...current, description: value }))}
          />
        </Field>
      </section>
      <section aria-labelledby="cm-ud-h" className="flex flex-col gap-3">
        <h2 className="xr-h2 m-0" id="cm-ud-h">
          {UPDATE_PAGE.deliveryTitle}
        </h2>
        {formats.web ? (
          <Field id={ID.web} label={UPDATE_PAGE.webLink} hint={UPDATE_PAGE.webHint}>
            <TextInput
              className="max-w-[640px]"
              value={form.webLink ?? ''}
              onChange={text(null, (current, value) => ({ ...current, webLink: value }))}
            />
          </Field>
        ) : null}
        {formats.packages.map((format) => (
          <Field
            key={format}
            id={packageFieldId(format)}
            label={packageReferenceLabel(format)}
            hint={UPDATE_PAGE.packageHint}
          >
            <TextInput
              className="max-w-[420px]"
              value={form.packageReferences[format] ?? ''}
              onChange={text(null, (current, value) => ({
                ...current,
                packageReferences: { ...current.packageReferences, [format]: value },
              }))}
            />
          </Field>
        ))}
      </section>
      <Field
        id={ID.version}
        label={UPDATE_PAGE.versionLabel}
        hint={versionHint(experiment.live.label)}
        error={fields.versionLabel}
      >
        <TextInput
          className="max-w-[160px]"
          value={form.versionLabel}
          onChange={text('versionLabel', (current, value) => ({ ...current, versionLabel: value }))}
        />
      </Field>
      {fields.change ? <FieldError id={ID.change}>{fields.change}</FieldError> : null}
      <section aria-labelledby="cm-ucp-h" className="flex flex-col gap-3">
        <h2 className="xr-h2 m-0" id="cm-ucp-h">
          {UPDATE_PAGE.comparisonTitle}
        </h2>
        {rows.length > 0 ? (
          <CorrectionComparison rows={rows} />
        ) : (
          <p className="xl-meta m-0">{UPDATE_PAGE.nothingChanged}</p>
        )}
      </section>
      <HistoryBlock history={history} />
      <div className="xw-flow-foot">
        <Button variant="text" className="xg-del" id={ID.withdraw} onClick={onWithdraw}>
          {UPDATE_PAGE.withdraw}
        </Button>
        <div className="xw-actions">
          <Button
            variant="secondary"
            busy={saving}
            busyLabel={stateWords('CM-08.saving')}
            onClick={onSave}
          >
            {UPDATE_PAGE.saveDraft}
          </Button>
          <Button variant="primary" id={ID.send} onClick={onSend}>
            {UPDATE_PAGE.send}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** “Update history · Newest first” inside the form (B6-09 f1: a plain section, not a card). */
function HistoryBlock({
  history,
}: {
  readonly history: ReturnType<typeof updateHistory>;
}): ReactNode {
  return (
    <section aria-labelledby="cm-hh" className="flex flex-col gap-3">
      <div className="flex flex-wrap justify-between [gap:4px_12px]">
        <h2 id="cm-hh" className="xr-h2 m-0">
          {UPDATE_PAGE.historyTitle}
        </h2>
        <span className="xr-meta">{UPDATE_PAGE.historyMeta}</span>
      </div>
      <Timeline events={history} markLatest={false} />
    </section>
  );
}
