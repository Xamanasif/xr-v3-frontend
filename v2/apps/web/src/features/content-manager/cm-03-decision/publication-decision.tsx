'use client';

import type { ServiceError } from '@xr/contracts/draft';
import { FORMAT_META, type ReturnReference } from '@xr/domain';
import {
  BackLink,
  Button,
  Checkbox,
  CheckboxGroup,
  ChoiceCard,
  ChoiceList,
  ConfirmDialog,
  DecisionLayout,
  Field,
  FormatBadge,
  Icon,
  Link,
  Notice,
  PageContent,
  PageHeader,
  RadioGroup,
  ReasonDialog,
  Section,
  SectionBody,
  StatusPill,
  Textarea,
  Timeline,
} from '@xr/ui';
import { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';

import {
  blockerLine,
  blockersTitle,
  DECISION_PAGE,
  DECISION_PANEL,
  decisionMetaLine,
  decisionOverline,
  PUBLISH_DIALOG,
  publishedLine,
  publishedWhen,
  publishEffect,
  publishTitle,
  referenceWords,
  reviewLine,
  SEND_BACK_DIALOG,
  sentBackMeta,
  submissionsLine,
  vendorChoiceSub,
} from '@/copy/cm-decision';
import { dateTime, dayMonthYear } from '@/copy/dates';
import { courseLine } from '@/copy/public';
import { stateWords } from '@/copy/state-copy';
import { FormatChips } from '@/features/public/shared/blocks';
import {
  CONTENT_LIBRARY_ADDRESS,
  publicationDecisionPlacement,
  READY_TO_PUBLISH_ADDRESS,
  READY_TO_PUBLISH_TITLE,
} from '@/nav/content-manager';
import { usePublicationDecision } from '@/queries/production';
import {
  checkSendBack,
  type PublicationDecisionView,
  type SendBackDraft,
  type SendBackErrors,
  sendBackErrorsOf,
  type SendBackTo,
} from '@/queries/production-cm-decision';
import { useCommand } from '@/queries/use-command';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  type DecisionFacts,
  decisionFacts,
  referenceOptions,
  sameReference,
} from './decision-view';

/** The board’s ids, with the product prefix (`Dm-decision`, `Dm-cdec`, `Dm-to-rv`; B6-07). */
const PANEL_ID = 'cm-decision';
const DECIDED_ID = 'cm-cdec';
const PUBLIC_EXPERIMENT = (experimentId: string) =>
  `/experiments/${encodeURIComponent(experimentId)}`;

/**
 * CM-03 Publication decision — boards B6-07 f0 … f5, B6-11 f4 … f8 and B6-12 f3, at
 * `/content-manager/decisions/[submissionId]`.
 *
 * - **Read**: `ProductionService.getPublicationDecision` — the submission, the publication check
 *   (the service’s verdict, the same for every role) and the catalogue preview as the public page
 *   would list it (only the formats that passed review).
 * - **As B6-07 draws it** (AR-4, ~72 / 28 from 860 px of content, the static panel under the
 *   content below with “Go to decision” first): the back link, “<SUB id> · First publication”,
 *   the name, the status chip and “<organisation> · <course> · approved by … on …”; then the
 *   catalogue preview (`div.xp.xg-preview`), the publication check, the submission and review
 *   summary with each format’s status, and the history, newest first.
 * - **Decide** (with the Content Manager only): Publish (DL-1, “Publishing gives no one access”)
 *   or Send back (DL-2: to the Academic Reviewer with a reason, or to the vendor with a reason and
 *   optional references, OD-B6-05). While a check fails, Publish is not offered and the panel
 *   lists only the record’s own failing checks (OD-B6-03). Both commands carry the revision from
 *   when their confirmation opened; publishing grants and changes no access (BC9).
 * - **After**: the result in the panel — “Published” with when and by whom, “Publishing gave no
 *   one access”, the public page (state-copy `CM-03.published.view`) and “Open the Content
 *   library”; or “Sent back to …” with its reason and “Back to Ready to publish”. Focus moves to
 *   the result. Still in academic review (or with the vendor): read-only, “Nothing to decide yet.”
 */
export function PublicationDecision({ submissionId }: { readonly submissionId: string }) {
  const read = usePublicationDecision(submissionId);
  const view = read.data?.ok ? read.data.value : null;
  // The top bar names the destination below 1024 px (f2 … f5); the crumbs name the record.
  useShellPage({
    ...publicationDecisionPlacement(
      view ? { id: view.submission.id, name: view.submission.content.name } : null,
    ),
    title: READY_TO_PUBLISH_TITLE,
  });
  return (
    <PageContent wrap="wide">
      <RecordGuard
        read={read}
        loadingLabel={stateWords('CM-03.loading')}
        failed={{ title: stateWords('CM-03.failed'), line: stateWords('CM-03.failed.line') }}
      >
        {(page) => (
          <Decision key={page.submission.id} view={page} onReread={() => read.refetch()} />
        )}
      </RecordGuard>
    </PageContent>
  );
}

/** A refused decision, as the panel says it (state-copy `CM-03.stale.*`, `CM-03.moved-on`). */
type PanelNotice = 'stale' | 'moved-on';

function Decision({
  view,
  onReread,
}: {
  readonly view: PublicationDecisionView;
  readonly onReread: () => Promise<unknown>;
}) {
  const facts = decisionFacts(view);
  const { submission } = view;
  const [notice, setNotice] = useState<PanelNotice | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const decidedRef = useRef<HTMLDivElement>(null);
  // Focus to the result once the decision is read back (B6-07 `focus(pid + '-cdec')`), or to the
  // panel’s heading after a refusal (the record moved on).
  const [focusTo, setFocusTo] = useState<{
    readonly target: 'decided' | 'title';
    readonly n: number;
  }>({ target: 'title', n: 0 });
  useEffect(() => {
    if (focusTo.n === 0) return;
    (focusTo.target === 'decided' ? decidedRef.current : titleRef.current)?.focus();
  }, [focusTo, facts.kind]);
  const focus = (target: 'decided' | 'title') =>
    setFocusTo((current) => ({ target, n: current.n + 1 }));

  const metaApproval = facts.approval;
  let panel: ReactNode;
  if (facts.kind === 'open') {
    panel = (
      <OpenPanel
        view={view}
        facts={facts}
        decidedRef={decidedRef}
        onDecided={() => {
          setNotice(null);
          focus('decided');
        }}
        onRefused={(kind) => {
          setNotice(kind);
          void onReread();
          focus('title');
        }}
        onStale={() => void onReread()}
      />
    );
  } else if (facts.kind === 'published' && facts.published) {
    const when = dateTime(facts.published.at);
    const experimentId =
      submission.status.state === 'published' ? submission.status.experimentId : null;
    panel = (
      <div id={DECIDED_ID} ref={decidedRef} tabIndex={-1} className="flex flex-col gap-3">
        {/* B6-07 f4 draws the pill across the panel (the board loads no xr-admin.css). */}
        <StatusPill tone="ok" className="self-stretch">
          {DECISION_PANEL.published}
        </StatusPill>
        <p className="xr-small m-0 text-ink-2">
          {publishedWhen(
            dayMonthYear(facts.published.at),
            when.split(', ')[1] ?? '',
            facts.published.by,
          )}
        </p>
        <p className="xr-body m-0 text-ink">{publishedLine(facts.course, facts.codes)}</p>
        {experimentId ? (
          <p className="xr-body m-0">
            <Link href={PUBLIC_EXPERIMENT(experimentId)}>{stateWords('CM-03.published.view')}</Link>
          </p>
        ) : null}
        <Link className="xr-btn xr-btn--secondary xr-btn--block" href={CONTENT_LIBRARY_ADDRESS}>
          {DECISION_PANEL.openLibrary}
        </Link>
      </div>
    );
  } else if (facts.kind === 'sent' && facts.sentBack) {
    const sent = facts.sentBack;
    panel = (
      <div id={DECIDED_ID} ref={decidedRef} tabIndex={-1} className="flex flex-col gap-3">
        <StatusPill tone="wait" className="self-stretch">
          {sent.to === 'academic-reviewer'
            ? DECISION_PANEL.sentToReviewer
            : DECISION_PANEL.sentToVendor}
        </StatusPill>
        <p className="xr-small m-0 text-ink-2">
          {sentBackMeta(dateTime(sent.at), sent.by, sent.reason)}
        </p>
        <p className="xr-body m-0 text-ink">{DECISION_PANEL.sentLine}</p>
        <Link className="xr-btn xr-btn--secondary xr-btn--block" href={READY_TO_PUBLISH_ADDRESS}>
          {DECISION_PANEL.backToReady}
        </Link>
      </div>
    );
  } else {
    panel = (
      <div id={DECIDED_ID} ref={decidedRef} tabIndex={-1} className="flex flex-col gap-3">
        <p className="xr-body m-0 text-ink-2">{DECISION_PANEL.nothingYet}</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        className="[margin:8px_0_16px]"
        back={<BackLink href={READY_TO_PUBLISH_ADDRESS}>{READY_TO_PUBLISH_TITLE}</BackLink>}
        overline={decisionOverline(submission.id)}
        title={submission.content.name}
        meta={
          <>
            <StatusPill tone={facts.chip.tone}>{facts.chip.words}</StatusPill>
            <span>
              {decisionMetaLine(submission.vendorOrganisation, facts.course, metaApproval)}
            </span>
          </>
        }
      />
      <DecisionLayout
        panel={{
          id: PANEL_ID,
          title: DECISION_PANEL.title,
          titleFocusTarget: true,
          titleRef,
          position: 'static',
          children: (
            <>
              {notice ? <RefusedNotice notice={notice} /> : null}
              {panel}
            </>
          ),
        }}
      >
        {facts.readOnly ? (
          <Notice tone="info" role="status" title={facts.readOnly.title}>
            {facts.readOnly.line}
          </Notice>
        ) : null}
        <CataloguePreview view={view} />
        <PublicationCheck facts={facts} />
        <Summary view={view} facts={facts} />
        <Section title={DECISION_PAGE.historyTitle} meta={DECISION_PAGE.historyMeta}>
          <SectionBody>
            <Timeline events={facts.history} markLatest={false} />
          </SectionBody>
        </Section>
      </DecisionLayout>
    </>
  );
}

function RefusedNotice({ notice }: { readonly notice: PanelNotice }) {
  if (notice === 'stale') {
    return (
      <Notice tone="warn" role="alert" title={stateWords('CM-03.stale.title')}>
        {stateWords('CM-03.stale.line')}
      </Notice>
    );
  }
  return (
    <Notice tone="warn" role="alert">
      {stateWords('CM-03.moved-on')}
    </Notice>
  );
}

// ---- the main column (B6-07 AR-4, ~72 %) ----

/** The catalogue preview as the public will see it (`div.xp.xg-preview`, B6-07 f0, f2, f5). */
function CataloguePreview({ view }: { readonly view: PublicationDecisionView }) {
  const preview = view.cataloguePreview;
  return (
    <Section title={DECISION_PAGE.previewTitle} meta={DECISION_PAGE.previewMeta}>
      <SectionBody>
        <div className="xp xg-preview">
          <span className="xg-preview-tag">{DECISION_PAGE.previewTag}</span>
          <span className="xp-erow-course">
            {courseLine(preview.platformCode, preview.courseName)}
          </span>
          <h3 className="xp-erow-title [margin:2px_0_6px]">{preview.name}</h3>
          <p className="xp-erow-sum [margin:0_0_10px]">{preview.summary}</p>
          <FormatChips formats={preview.availableIn} label={DECISION_PAGE.availableIn} />
          <h4 className="xg-preview-h">{DECISION_PAGE.previewOutcomes}</h4>
          {preview.learningOutcomes.length > 0 ? (
            <ul className="xp-outcomes">
              {preview.learningOutcomes.map((outcome, index) => (
                <li key={index}>
                  <Icon name="done" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="xl-meta m-0">{DECISION_PAGE.noOutcomes}</p>
          )}
          <h4 className="xg-preview-h">{DECISION_PAGE.previewFormats}</h4>
          <table className="xp-ftable">
            <thead>
              <tr>
                <th>{DECISION_PAGE.columnFormat}</th>
                <th>{DECISION_PAGE.columnHow}</th>
                <th>{DECISION_PAGE.columnDevice}</th>
              </tr>
            </thead>
            <tbody>
              {preview.formats.map((entry) => (
                <tr key={entry.format}>
                  <td data-label={DECISION_PAGE.columnFormat}>
                    <FormatBadge format={FORMAT_META[entry.format].code} />
                    <span className="xp-fname">{FORMAT_META[entry.format].name}</span>
                  </td>
                  <td data-label={DECISION_PAGE.columnHow}>{entry.howItRuns}</td>
                  <td data-label={DECISION_PAGE.columnDevice}>{entry.deviceNeeds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionBody>
    </Section>
  );
}

/** “Publication check · Read from the record” (`ul.xa-check.xv-checklist`, B6-07 f0, f2, f3). */
function PublicationCheck({ facts }: { readonly facts: DecisionFacts }) {
  return (
    <Section title={DECISION_PAGE.checkTitle} meta={DECISION_PAGE.checkMeta}>
      <SectionBody>
        <ul className="xa-check xv-checklist" aria-label={DECISION_PAGE.checkTitle}>
          {facts.checks.map((row) => (
            <li key={row.check} className="xv-check-row">
              <span className={row.ok ? 'is-ok' : 'is-no'}>
                <Icon name={row.ok ? 'done' : 'failed'} />
              </span>
              <span className="xv-check-t">
                {row.title}
                <span className="xr-meta block">{row.line}</span>
                {row.fix ? <span className="xr-meta block text-err">{row.fix}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </SectionBody>
    </Section>
  );
}

/** “Submission and review summary” with each format’s status (B6-07 f0, f3, f4). */
function Summary({
  view,
  facts,
}: {
  readonly view: PublicationDecisionView;
  readonly facts: DecisionFacts;
}) {
  const { submission } = view;
  const content = submission.content;
  return (
    <Section title={DECISION_PAGE.summaryTitle}>
      <SectionBody className="flex flex-col gap-4">
        <dl className="xl-kv xv-kv">
          <dt>{DECISION_PAGE.fromVendor}</dt>
          <dd>{facts.fromVendor}</dd>
          <dt>{DECISION_PAGE.submissions}</dt>
          <dd>
            {submissionsLine(
              submission.firstSubmittedAt ? dayMonthYear(submission.firstSubmittedAt) : '',
              submission.lastResubmittedAt ? dayMonthYear(submission.lastResubmittedAt) : null,
              submission.revision,
            )}
          </dd>
          <dt>{DECISION_PAGE.academicReview}</dt>
          <dd>
            {facts.approval
              ? reviewLine(facts.approval.by, facts.approval.on, facts.returns)
              : DECISION_PAGE.notDecided}
          </dd>
          <dt>{DECISION_PAGE.version}</dt>
          <dd>{content.version ?? ''}</dd>
          <dt>{DECISION_PAGE.description}</dt>
          <dd>{content.description ?? ''}</dd>
        </dl>
        <div className="xr-table-wrap">
          <table className="xr-table">
            <thead>
              <tr>
                <th>{DECISION_PAGE.columnFormat}</th>
                <th>{DECISION_PAGE.columnDelivery}</th>
                <th>{DECISION_PAGE.columnStatus}</th>
              </tr>
            </thead>
            <tbody>
              {facts.formats.map((row) => (
                <tr key={row.format}>
                  <td data-label={DECISION_PAGE.columnFormat}>
                    <FormatBadge format={FORMAT_META[row.format].code} />
                  </td>
                  <td data-label={DECISION_PAGE.columnDelivery}>{row.delivery}</td>
                  <td data-label={DECISION_PAGE.columnStatus}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="xl-open m-0">
          <Icon name="info" size={16} />
          <span>{DECISION_PAGE.allFormats}</span>
        </p>
      </SectionBody>
    </Section>
  );
}

// ---- the decision panel (B6-07 AR-4, ~28 %) ----

type Choice = 'publish' | 'send';

const EMPTY_DRAFT: SendBackDraft = { to: null, reason: '', references: [] };

/** The open decision: Publish or Send back (B6-07 f0, f2; B6-11 f4, f6, f7). */
function OpenPanel({
  view,
  facts,
  decidedRef,
  onDecided,
  onRefused,
  onStale,
}: {
  readonly view: PublicationDecisionView;
  readonly facts: DecisionFacts;
  readonly decidedRef: RefObject<HTMLDivElement | null>;
  readonly onDecided: () => void;
  readonly onRefused: (notice: PanelNotice) => void;
  readonly onStale: () => void;
}) {
  const { submission } = view;
  const blocked = facts.blockers.length > 0;
  const publishCmd = useCommand((ports) => ports.production.publish);
  const sendCmd = useCommand((ports) => ports.production.sendBack);
  const [choice, setChoice] = useState<Choice>('publish');
  const [dialog, setDialog] = useState<Choice | null>(null);
  /** The record’s revision when the confirmation opened (state-copy `CM-03.decision-rev`). */
  const [decisionRev, setDecisionRev] = useState(submission.rev);
  const [draft, setDraft] = useState<SendBackDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<SendBackErrors>({});
  const [dialogNotice, setDialogNotice] = useState<'stale' | 'unavailable' | null>(null);
  const [focusWho, setFocusWho] = useState(0);
  const whoRef = useRef<HTMLInputElement>(null);
  const shown: Choice = blocked ? 'send' : choice;

  // A failed Send back with no one chosen: focus to “Academic Reviewer” (B6-07 `doSend`), after
  // the dialog’s own move to the first invalid field.
  useEffect(() => {
    if (focusWho > 0) whoRef.current?.focus();
  }, [focusWho]);

  const open = () => {
    setDecisionRev(submission.rev);
    setDialogNotice(null);
    if (shown === 'send') {
      setDraft(EMPTY_DRAFT);
      setErrors({});
      setDialog('send');
    } else {
      setDialog('publish');
    }
  };

  const close = () => {
    setDialog(null);
    setDialogNotice(null);
  };

  /** A refusal of either command (the dialog closes; the record is read again). */
  const refused = (error: ServiceError) => {
    setDialog(null);
    onRefused(error.kind === 'stale-version' ? 'stale' : 'moved-on');
  };

  const doPublish = () => {
    if (publishCmd.busy) return;
    setDialogNotice(null);
    publishCmd.run({ id: submission.id, expectedRev: decisionRev }).then(
      (answer) => {
        if (!answer.ok) {
          refused(answer.error);
          return;
        }
        setDialog(null);
        onDecided();
      },
      () => setDialogNotice('unavailable'),
    );
  };

  const doSend = () => {
    if (sendCmd.busy) return;
    const checked = checkSendBack(draft);
    if (checked) {
      setErrors(checked);
      if (checked.to) setFocusWho((count) => count + 1);
      return;
    }
    setErrors({});
    setDialogNotice(null);
    const input =
      draft.to === 'vendor'
        ? {
            id: submission.id,
            to: 'vendor' as const,
            reason: draft.reason,
            references: draft.references,
            expectedRev: decisionRev,
          }
        : {
            id: submission.id,
            to: 'academic-reviewer' as const,
            reason: draft.reason,
            expectedRev: decisionRev,
          };
    sendCmd.run(input).then(
      (answer) => {
        if (answer.ok) {
          setDialog(null);
          setDraft(EMPTY_DRAFT);
          onDecided();
          return;
        }
        const error = answer.error;
        if (error.kind === 'validation-failed') {
          const fields = sendBackErrorsOf(error);
          setErrors(fields);
          if (fields.to) setFocusWho((count) => count + 1);
          return;
        }
        if (error.kind === 'stale-version') {
          // What was chosen and typed stays; the record is read again and the next press sends
          // with its current revision (state-copy `CM-03.stale.*`).
          setDecisionRev(error.currentRev);
          setDialogNotice('stale');
          onStale();
          return;
        }
        refused(error);
      },
      () => setDialogNotice('unavailable'),
    );
  };

  const setTo = (to: SendBackTo) => {
    setDraft((current) => ({ ...current, to }));
    setErrors((current) => ({ ...current, to: undefined }));
  };

  const toggleReference = (reference: ReturnReference) =>
    setDraft((current) => ({
      ...current,
      references: current.references.some((entry) => sameReference(entry, reference))
        ? current.references.filter((entry) => !sameReference(entry, reference))
        : [...current.references, reference],
    }));

  const reasonLabel =
    draft.to === 'vendor'
      ? SEND_BACK_DIALOG.reasonForVendor
      : draft.to === 'academic-reviewer'
        ? SEND_BACK_DIALOG.reasonForReviewer
        : SEND_BACK_DIALOG.reasonForEither;

  return (
    <>
      {blocked ? (
        <div className="xr-notice xr-notice--err" role="status">
          <Icon name="failed" />
          <div className="xr-notice-body">
            <span className="xr-notice-title">{blockersTitle(facts.blockers.length)}</span>
            <ul className="[margin:2px_0_0] [padding-left:18px]">
              {facts.blockers.map((row) => (
                <li key={row.check}>{blockerLine(row.title, row.line, row.fix)}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      <RadioGroup
        legend={DECISION_PANEL.legend}
        legendClass="xr-sr"
        value={shown}
        onValueChange={(value) => setChoice(value as Choice)}
      >
        <ChoiceList>
          {blocked ? (
            <ChoiceCard
              id="cm-cpx"
              value="publish-off"
              title={DECISION_PANEL.publish}
              sub={DECISION_PANEL.publishOff}
              unavailable
            />
          ) : (
            <ChoiceCard
              id="cm-cp"
              value="publish"
              title={DECISION_PANEL.publish}
              sub={DECISION_PANEL.publishSub}
            />
          )}
          <ChoiceCard
            id="cm-cs"
            value="send"
            title={DECISION_PANEL.sendBack}
            sub={DECISION_PANEL.sendBackSub}
          />
        </ChoiceList>
      </RadioGroup>
      <Button id="cm-cgo" variant="primary" block onClick={open}>
        {shown === 'send' ? DECISION_PANEL.sendBack : DECISION_PANEL.publish}
      </Button>
      <ConfirmDialog
        open={dialog === 'publish'}
        idPrefix="cm-p"
        align="decision"
        title={publishTitle(submission.content.name)}
        effect={<strong>{publishEffect(facts.course, facts.codes)}</strong>}
        notice={
          dialogNotice === 'unavailable' ? (
            <Notice tone="err" role="alert">
              {stateWords('CM-03.unavailable.publish')}
            </Notice>
          ) : undefined
        }
        confirmLabel={PUBLISH_DIALOG.confirm}
        busy={publishCmd.busy}
        busyLabel={PUBLISH_DIALOG.busy}
        onConfirm={doPublish}
        onCancel={close}
        returnFocusFallback={decidedRef}
      />
      <ReasonDialog
        open={dialog === 'send'}
        idPrefix="cm-s"
        align="decision"
        title={SEND_BACK_DIALOG.title}
        effect={SEND_BACK_DIALOG.effect}
        confirmLabel={SEND_BACK_DIALOG.confirm}
        busy={sendCmd.busy}
        busyLabel={SEND_BACK_DIALOG.busy}
        onConfirm={doSend}
        onCancel={close}
        returnFocusFallback={decidedRef}
      >
        {dialogNotice === 'stale' ? (
          <Notice
            tone="warn"
            role="alert"
            title={stateWords('CM-03.stale.title')}
            className="mb-[14px]"
          >
            {stateWords('CM-03.stale.line')}
          </Notice>
        ) : dialogNotice === 'unavailable' ? (
          <Notice tone="err" role="alert" className="mb-[14px]">
            {stateWords('CM-03.unavailable.send')}
          </Notice>
        ) : null}
        <RadioGroup
          id="cm-to"
          className="mb-[14px]"
          legend={SEND_BACK_DIALOG.to}
          legendClass="xr-label"
          value={draft.to}
          onValueChange={(value) => setTo(value as SendBackTo)}
          error={errors.to}
        >
          <ChoiceList>
            <ChoiceCard
              ref={whoRef}
              id="cm-to-rv"
              value="academic-reviewer"
              title={SEND_BACK_DIALOG.reviewer}
              sub={SEND_BACK_DIALOG.reviewerSub}
            />
            <ChoiceCard
              id="cm-to-ven"
              value="vendor"
              title={SEND_BACK_DIALOG.vendor}
              sub={vendorChoiceSub(submission.vendorOrganisation)}
            />
          </ChoiceList>
        </RadioGroup>
        <Field id="cm-creason" label={reasonLabel} error={errors.reason}>
          <Textarea
            className="min-h-[104px]"
            value={draft.reason}
            onChange={(event) => {
              const reason = event.target.value;
              setDraft((current) => ({ ...current, reason }));
              setErrors((current) => ({ ...current, reason: undefined }));
            }}
          />
        </Field>
        {draft.to === 'vendor' ? (
          <CheckboxGroup
            className="mt-[14px]"
            legend={SEND_BACK_DIALOG.references}
            legendClass="xr-label"
            marker={SEND_BACK_DIALOG.optional}
            hint={SEND_BACK_DIALOG.referencesHint}
            hintClassName="block mb-[6px]"
          >
            <div className="xg-refgrid">
              {referenceOptions(submission, 'cm-ref').map((option) => (
                <Checkbox
                  key={option.id}
                  id={option.id}
                  checked={draft.references.some((entry) => sameReference(entry, option.reference))}
                  onChange={() => toggleReference(option.reference)}
                >
                  <span>{referenceWords(option.reference, option.formatCode)}</span>
                </Checkbox>
              ))}
            </div>
          </CheckboxGroup>
        ) : null}
      </ReasonDialog>
    </>
  );
}
