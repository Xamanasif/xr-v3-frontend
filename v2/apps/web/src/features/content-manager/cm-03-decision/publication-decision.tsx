'use client';

import type { ServiceError } from '@xr/contracts/draft';
import { FORMAT_META, type ReturnReference } from '@xr/domain';
import {
  Breadcrumbs,
  Button,
  CheckGroup,
  ChoiceGroup,
  CmBlockers,
  CmCatalogueEntry,
  CmCourseName,
  CmFormatRows,
  CmIdentityBand,
  CmPublicationChecks,
  CmSheetSection,
  CmStageTrack,
  CmSubHeading,
  CmWideLink,
  ConfirmDialog,
  DecisionOutcome,
  DecisionPanel,
  DefinitionList,
  DetailLayout,
  ErrorSummary,
  type ErrorSummaryItem,
  Field,
  GoButton,
  Hint,
  Notice,
  PendingHint,
  Quote,
  RecordLine,
  StandList,
  StatusPill,
  Textarea,
  Timeline,
  V46Island,
} from '@xr/ui/v3';
import { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';

import {
  blockerLine,
  blockersTitle,
  CHECK_STATE,
  DECISION_PAGE,
  DECISION_PANEL,
  DECISION_RESULT,
  decisionOverline,
  formatsLabel,
  fromVendor,
  listedUnder,
  PUBLISH_DIALOG,
  publishedByYou,
  publishTitle,
  publishWhere,
  quoted,
  referenceWords,
  requiredLabel,
  sentBackByYou,
  STALE_NOTICE,
  staleLine,
  submissionsLine,
  vendorChoiceSub,
  withReviewer,
} from '@/copy/cm-decision';
import { STAGE_TRACK_LABEL, YOUR_STEP } from '@/copy/cm-shared';
import { dateTime, dayMonthYear } from '@/copy/dates';
import { stateWords } from '@/copy/state-copy';
import {
  CONTENT_LIBRARY_TITLE,
  libraryAddress,
  publicationDecisionPlacement,
  publishedExperimentAddress,
  READY_TO_PUBLISH_ADDRESS,
  READY_TO_PUBLISH_TITLE,
} from '@/nav/content-manager';
import { usePublicationDecision } from '@/queries/production';
import {
  checkSendBack,
  type PublicationDecisionView,
  type SendBackDraft,
  sendBackErrorsOf,
  type SendBackTo,
} from '@/queries/production-cm-decision';
import { useCommand } from '@/queries/use-command';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage, useWorkspaceIdentity } from '../../shared/workspace-frame/shell-page';
import { CM_STAGE_STATE_WORDS, submissionStages } from '../shared/stages';
import { useCmTodayLine } from '../shared/today-line';
import {
  type DecisionFacts,
  decisionFacts,
  referenceOptions,
  sameReference,
} from './decision-view';

/** The export's ids (CM-v1 `Main.dc.html` CM-03). */
const TITLE_ID = 'cm-h-decision';
const PANEL_ID = 'cm-panel';
const PANEL_TITLE_ID = 'cm-panel-h';
const DONE_ID = 'cm-d-done';
const STALE_ID = 'cm-d-stale';
const PUBLIC_EXPERIMENT = (experimentId: string) =>
  `/experiments/${encodeURIComponent(experimentId)}`;

/**
 * CM-03 Publication decision — the owner-approved Content Manager export (V3 Refined B,
 * design/v3-refined-b/roles/CM-v1, `Main.dc.html` `v.decision`; boards CM03-Decision,
 * P01 … P09), at `/content-manager/decisions/[submissionId]`.
 *
 * - **Read**: `ProductionService.getPublicationDecision` — the submission, the publication check
 *   (the service's verdict, the same for every role) and the catalogue preview as the public page
 *   would list it (only the formats that passed review). Loading and a failed read are the
 *   application's existing page states (CM-v1 HANDOFF §4).
 * - **As the export draws it**: the breadcrumb, the identity band (the record kind, the name, the
 *   status, the vendor and the course; formats, learning outcomes, version, submission; the stage
 *   track vendor → Academic Reviewer → you → public catalogue), then the record's sheet — the
 *   publication check as a gate with its verdict, the catalogue preview, the submission and review
 *   summary with the delivery by format, the history — beside the "Your decision" panel.
 * - **Decide** (with the Content Manager only): no choice is made at first (state-copy
 *   `CM-03.choice`); Publish asks in DL-1 what publishing does now and later ("Publishing gives no
 *   one access"); Send back takes who (the Academic Reviewer or the vendor), a reason and, toward
 *   the vendor only, the fields it refers to (OD-B6-05), and sends at once. Errors show in the
 *   summary, which takes focus. While a check fails, Publish is not offered, Send back is
 *   preselected and the panel lists the failing checks (OD-B6-03). Both commands carry the
 *   record's revision (state-copy `CM-03.decision-rev`) and are protected against a repeated
 *   press; while one runs its button reads "Publishing…" / "Sending…", and the dialog's Cancel
 *   and Escape wait. Publishing grants and changes no access (BC9).
 * - **Refused**: changed meanwhile → "This page is out of date" under the band (the page keeps
 *   what it showed, the choices typed included) with "Show where it is now" (state-copy
 *   `CM-03.stale.changed`); moved on → the panel says so and shows the record as it is now.
 * - **After**: the result in the panel, focused — "Published" with where it stands, "Open the
 *   published experiment", "View the public page" (PU-06) and "Back to Ready to publish"; or the
 *   send back with its reason. Read-only (in academic review, back with the Academic Reviewer,
 *   with the vendor): the notice, "Nothing to decide yet." and "Back to the Content library".
 */
export function PublicationDecision({ submissionId }: { readonly submissionId: string }) {
  const read = usePublicationDecision(submissionId);
  const view = read.data?.ok ? read.data.value : null;
  useShellPage({
    ...publicationDecisionPlacement(
      view ? { id: view.submission.id, name: view.submission.content.name } : null,
    ),
    title: READY_TO_PUBLISH_TITLE,
  });
  const guard = (
    <RecordGuard
      read={read}
      loadingLabel={stateWords('CM-03.loading')}
      failed={{ title: stateWords('CM-03.failed'), line: stateWords('CM-03.failed.line') }}
    >
      {(page) => <Decision key={page.submission.id} view={page} onReread={() => read.refetch()} />}
    </RecordGuard>
  );
  // The application's existing loading and failed states keep their v46 look (CM-v1 HANDOFF §4).
  return view ? guard : <V46Island>{guard}</V46Island>;
}

type FocusTarget = 'decided' | 'title' | 'stale';

function Decision({
  view,
  onReread,
}: {
  readonly view: PublicationDecisionView;
  readonly onReread: () => Promise<unknown>;
}) {
  // After a refusal because the record changed meanwhile, the page keeps what it showed until
  // "Show where it is now" (state-copy `CM-03.stale.changed`); the record is read again behind it.
  const [frozen, setFrozen] = useState<PublicationDecisionView | null>(null);
  const shown = frozen ?? view;
  const facts = decisionFacts(shown);
  const { submission } = shown;
  const [movedOn, setMovedOn] = useState(false);
  /** Decided on this page: the send back's result shows here, not the read-only notice. */
  const [decidedHere, setDecidedHere] = useState(false);
  const today = useCmTodayLine();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const staleRef = useRef<HTMLDivElement>(null);
  const [focusTo, setFocusTo] = useState<{ readonly target: FocusTarget; readonly n: number }>({
    target: 'title',
    n: 0,
  });
  useEffect(() => {
    if (focusTo.n === 0) return;
    const target =
      focusTo.target === 'decided'
        ? doneRef.current
        : focusTo.target === 'stale'
          ? staleRef.current
          : titleRef.current;
    target?.focus();
  }, [focusTo, facts.kind, frozen]);
  const focus = (target: FocusTarget) => setFocusTo((current) => ({ target, n: current.n + 1 }));

  const fresh = view.submission.status;
  const stale = frozen
    ? staleLine(
        submission.content.name,
        fresh.state === 'published' ? (dateTime(fresh.at).split(', ')[1] ?? '') : null,
      )
    : null;

  const toLibrary = !decidedHere && (facts.kind === 'read-only' || facts.kind === 'sent');
  const crumb = toLibrary
    ? { label: CONTENT_LIBRARY_TITLE, href: libraryAddress(facts.libraryTab) }
    : { label: READY_TO_PUBLISH_TITLE, href: READY_TO_PUBLISH_ADDRESS };

  let panel: ReactNode;
  if (facts.kind === 'open') {
    panel = (
      <OpenPanel
        view={shown}
        facts={facts}
        doneRef={doneRef}
        onDecided={() => {
          setMovedOn(false);
          setDecidedHere(true);
          focus('decided');
        }}
        onMovedOn={() => {
          setFrozen(null);
          setMovedOn(true);
          void onReread();
          focus('title');
        }}
        onStale={() => {
          setFrozen((current) => current ?? view);
          void onReread();
          focus('stale');
        }}
      />
    );
  } else if (facts.kind === 'published' && facts.published) {
    panel = <PublishedResult view={shown} facts={facts} doneRef={doneRef} />;
  } else if (facts.kind === 'sent' && facts.sentBack && decidedHere) {
    panel = <SentResult view={shown} facts={facts} doneRef={doneRef} />;
  } else {
    panel = <ReadOnlyPanel facts={facts} />;
  }

  return (
    <>
      <CmIdentityBand
        breadcrumbs={<Breadcrumbs levels={[crumb]} current={submission.content.name} />}
        date={today}
        eyebrow={decisionOverline(submission.id)}
        title={submission.content.name}
        titleId={TITLE_ID}
        status={
          <>
            <StatusPill tone={facts.pill.tone} size="lg">
              {facts.pill.words}
            </StatusPill>
            <span>{fromVendor(submission.vendorOrganisation)}</span>
            <CmCourseName code={facts.courseCode} name={facts.courseName} />
          </>
        }
        goTo={{ label: DECISION_PAGE.goTo, targetId: PANEL_ID, focusId: PANEL_TITLE_ID }}
        facts={facts.bandFacts}
        track={
          <CmStageTrack
            placement="band"
            label={STAGE_TRACK_LABEL.submission}
            steps={submissionStages(submission, facts.blockers.length)}
            stateWords={CM_STAGE_STATE_WORDS}
            youLabel={YOUR_STEP}
          />
        }
      />
      {stale ? (
        <Notice
          ref={staleRef}
          id={STALE_ID}
          tone="warn"
          icon="alertCircle"
          role="alert"
          title={STALE_NOTICE.title}
          actions={
            <Button
              onClick={() => {
                setFrozen(null);
                setMovedOn(false);
                void onReread();
                focus('title');
              }}
            >
              {STALE_NOTICE.action}
            </Button>
          }
        >
          {stale}
        </Notice>
      ) : null}
      <DetailLayout
        main={<RecordSheet view={shown} facts={facts} />}
        asideId={PANEL_ID}
        asideLabelledBy={PANEL_TITLE_ID}
        aside={
          <DecisionPanel title={DECISION_PANEL.title} titleId={PANEL_TITLE_ID} titleRef={titleRef}>
            {movedOn ? (
              <Notice
                tone="warn"
                icon="alertCircle"
                role="alert"
                title={stateWords('CM-03.moved-on')}
              />
            ) : null}
            {panel}
          </DecisionPanel>
        }
      />
    </>
  );
}

// ---- the record's sheet ----------------------------------------------------------------------------

function RecordSheet({
  view,
  facts,
}: {
  readonly view: PublicationDecisionView;
  readonly facts: DecisionFacts;
}) {
  const { submission, cataloguePreview: preview } = view;
  const content = submission.content;
  const availableIn = preview.availableIn.map((format) => FORMAT_META[format].code);
  const documents = content.documents.map((document) => document.fileName).join(' · ');
  return (
    <>
      <CmSheetSection title={DECISION_PAGE.checkTitle} titleId="cm-d-check" verdict={facts.verdict}>
        <CmPublicationChecks
          label={DECISION_PAGE.checkTitle}
          stateWords={CHECK_STATE}
          items={facts.checks.map((row) => ({
            key: row.check,
            title: row.title,
            detail: row.line,
            met: row.ok,
            fix: row.fix,
          }))}
        />
      </CmSheetSection>
      <CmSheetSection
        title={DECISION_PAGE.previewTitle}
        titleId="cm-d-cat"
        note={DECISION_PAGE.previewMeta}
      >
        <CmCatalogueEntry
          nameId="cm-d-cat-name"
          tag={
            facts.kind === 'published'
              ? { words: DECISION_PAGE.inCatalogueTag, tone: 'ok' }
              : { words: DECISION_PAGE.previewTag, tone: 'neutral' }
          }
          course={{ code: preview.platformCode, name: preview.courseName }}
          name={preview.name}
          summary={preview.summary}
          availableIn={DECISION_PAGE.availableIn}
          formats={availableIn}
          formatsLabel={formatsLabel(availableIn)}
          outcomesTitle={DECISION_PAGE.outcomesTitle}
          outcomes={preview.learningOutcomes}
          noOutcomes={DECISION_PAGE.noOutcomes}
          formatsTitle={DECISION_PAGE.formatsTitle}
        >
          <CmFormatRows
            head={[DECISION_PAGE.columnFormat, DECISION_PAGE.columnHow, DECISION_PAGE.columnDevice]}
            rows={preview.formats.map((entry) => ({
              key: entry.format,
              code: FORMAT_META[entry.format].code,
              name: FORMAT_META[entry.format].name,
              cells: [
                { label: DECISION_PAGE.columnHow, lines: [entry.howItRuns] },
                {
                  label: DECISION_PAGE.columnDevice,
                  lines: [entry.deviceNeeds.trim() || DECISION_PAGE.notGivenYet],
                },
              ],
            }))}
          />
        </CmCatalogueEntry>
      </CmSheetSection>
      <CmSheetSection title={DECISION_PAGE.summaryTitle} titleId="cm-d-sum">
        <DefinitionList
          items={[
            { term: DECISION_PAGE.fromVendor, value: facts.fromVendor },
            {
              term: DECISION_PAGE.submissions,
              value: submissionsLine(
                submission.firstSubmittedAt ? dayMonthYear(submission.firstSubmittedAt) : '',
                submission.lastResubmittedAt ? dayMonthYear(submission.lastResubmittedAt) : null,
                submission.revision,
              ),
            },
            { term: DECISION_PAGE.academicReview, value: facts.reviewLine },
            { term: DECISION_PAGE.version, value: content.version ?? '' },
            { term: DECISION_PAGE.description, value: content.description ?? '' },
            ...(content.preview.label
              ? [{ term: DECISION_PAGE.preview, value: content.preview.label }]
              : []),
            ...(documents ? [{ term: DECISION_PAGE.documents, value: documents }] : []),
          ]}
        />
        <CmSubHeading>{DECISION_PAGE.deliveryTitle}</CmSubHeading>
        <CmFormatRows
          head={[
            DECISION_PAGE.columnFormat,
            DECISION_PAGE.columnDelivery,
            DECISION_PAGE.columnStatus,
          ]}
          rows={facts.delivery.map((row) => ({
            key: row.format,
            code: row.code,
            name: row.name,
            cells: [
              { label: DECISION_PAGE.columnDelivery, lines: row.lines },
              { label: DECISION_PAGE.columnStatus, lines: [row.status] },
            ],
          }))}
        />
        <Hint under="list">{DECISION_PAGE.allFormats}</Hint>
      </CmSheetSection>
      <CmSheetSection
        title={DECISION_PAGE.historyTitle}
        titleId="cm-d-hist"
        note={DECISION_PAGE.historyMeta}
      >
        <Timeline events={facts.history} />
      </CmSheetSection>
    </>
  );
}

// ---- the decision panel: results and read-only -----------------------------------------------------

function PublishedResult({
  view,
  facts,
  doneRef,
}: {
  readonly view: PublicationDecisionView;
  readonly facts: DecisionFacts;
  readonly doneRef: RefObject<HTMLDivElement | null>;
}) {
  const identity = useWorkspaceIdentity();
  const published = facts.published!;
  const status = view.submission.status;
  const experimentId = status.state === 'published' ? status.experimentId : null;
  const when = dateTime(published.at);
  const by = published.by;
  const meta =
    by && by.kind === 'person' && by.personId !== identity.personId
      ? stateWords('CM-03.published-by').replace('{name}', by.displayName).replace('{when}', when)
      : publishedByYou(when);
  return (
    <DecisionOutcome
      id={DONE_ID}
      outcomeRef={doneRef}
      status={
        <StatusPill tone="ok" size="lg">
          {DECISION_RESULT.published}
        </StatusPill>
      }
      meta={meta}
    >
      <StandList
        items={[
          { term: DECISION_RESULT.catalogue, value: listedUnder(facts.courseShort, facts.codes) },
          {
            term: DECISION_RESULT.institutionAccess,
            value: DECISION_RESULT.institutionUnchanged,
          },
          { term: DECISION_RESULT.studentAccess, value: DECISION_RESULT.studentUnchanged },
          { term: DECISION_RESULT.vendorAndReviewer, value: DECISION_RESULT.seePublished },
        ]}
      />
      <RecordLine>{DECISION_RESULT.publishedNext}</RecordLine>
      {experimentId ? (
        <>
          <CmWideLink variant="navy" href={publishedExperimentAddress(experimentId)}>
            {DECISION_RESULT.openPublished}
          </CmWideLink>
          <CmWideLink icon="externalLink" href={PUBLIC_EXPERIMENT(experimentId)}>
            {DECISION_RESULT.viewPublic}
          </CmWideLink>
        </>
      ) : null}
      <CmWideLink href={READY_TO_PUBLISH_ADDRESS}>{DECISION_PANEL.backToReady}</CmWideLink>
    </DecisionOutcome>
  );
}

function SentResult({
  view,
  facts,
  doneRef,
}: {
  readonly view: PublicationDecisionView;
  readonly facts: DecisionFacts;
  readonly doneRef: RefObject<HTMLDivElement | null>;
}) {
  const sent = facts.sentBack!;
  const toReviewer = sent.to === 'academic-reviewer';
  return (
    <DecisionOutcome
      id={DONE_ID}
      outcomeRef={doneRef}
      status={
        <StatusPill tone={toReviewer ? 'info' : 'neutral'} size="lg">
          {toReviewer ? DECISION_RESULT.backWithReviewer : DECISION_RESULT.withVendor}
        </StatusPill>
      }
      meta={sentBackByYou(dateTime(sent.at))}
    >
      <Quote>{quoted(sent.reason)}</Quote>
      <StandList
        items={[
          { term: DECISION_RESULT.catalogue, value: DECISION_RESULT.notPublished },
          { term: DECISION_RESULT.readyToPublish, value: DECISION_RESULT.removedUntilApproved },
          {
            term: DECISION_RESULT.nowWith,
            value: toReviewer
              ? withReviewer(facts.reviewerName)
              : view.submission.vendorOrganisation,
          },
        ]}
      />
      <RecordLine>
        {toReviewer ? DECISION_RESULT.sentReviewerNext : DECISION_RESULT.sentVendorNext}
      </RecordLine>
      <CmWideLink href={READY_TO_PUBLISH_ADDRESS}>{DECISION_PANEL.backToReady}</CmWideLink>
    </DecisionOutcome>
  );
}

function ReadOnlyPanel({ facts }: { readonly facts: DecisionFacts }) {
  const notice = facts.readOnly;
  return (
    <>
      {notice ? (
        <Notice tone={notice.tone} icon={notice.icon} role="status" title={notice.title}>
          {notice.line}
        </Notice>
      ) : null}
      <Hint>{DECISION_PANEL.nothingYet}</Hint>
      <CmWideLink href={libraryAddress(facts.libraryTab)}>
        {DECISION_PANEL.backToLibrary}
      </CmWideLink>
    </>
  );
}

// ---- the decision panel: open --------------------------------------------------------------------

type Choice = 'publish' | 'send';

interface DecisionErrors {
  readonly choice?: string;
  readonly to?: string;
  readonly reason?: string;
}

const EMPTY_DRAFT: SendBackDraft = { to: null, reason: '', references: [] };

/** The ids the error summary's links focus (the choices, who, the reason). */
const FIELD_IDS = { choice: 'cm-d-choice', to: 'cm-d-to', reason: 'cm-d-reason' } as const;

/** The open decision: Publish or Send back (CM-v1 `decVM` `open`). */
function OpenPanel({
  view,
  facts,
  doneRef,
  onDecided,
  onMovedOn,
  onStale,
}: {
  readonly view: PublicationDecisionView;
  readonly facts: DecisionFacts;
  readonly doneRef: RefObject<HTMLDivElement | null>;
  readonly onDecided: () => void;
  readonly onMovedOn: () => void;
  readonly onStale: () => void;
}) {
  const { submission } = view;
  const blocked = facts.blockers.length > 0;
  const publishCmd = useCommand((ports) => ports.production.publish);
  const sendCmd = useCommand((ports) => ports.production.sendBack);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [dialog, setDialog] = useState(false);
  /** The record's revision when the confirmation opened (state-copy `CM-03.decision-rev`). */
  const [decisionRev, setDecisionRev] = useState(submission.rev);
  const [draft, setDraft] = useState<SendBackDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<DecisionErrors>({});
  const [dialogNotice, setDialogNotice] = useState(false);
  const [sendNotice, setSendNotice] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [summaryFocus, setSummaryFocus] = useState(0);
  // A refused press while the summary is already shown: focus it again.
  useEffect(() => {
    if (summaryFocus > 0) summaryRef.current?.focus();
  }, [summaryFocus]);

  const shown: Choice | null = blocked ? 'send' : choice;
  const options = referenceOptions(submission, 'cm-d-ref');

  const showErrors = (found: DecisionErrors) => {
    setErrors(found);
    setSummaryFocus((count) => count + 1);
  };

  const send = () => {
    if (sendCmd.busy || draft.to === null) return;
    setSendNotice(false);
    const input =
      draft.to === 'vendor'
        ? {
            id: submission.id,
            to: 'vendor' as const,
            reason: draft.reason,
            references: draft.references,
            expectedRev: submission.rev,
          }
        : {
            id: submission.id,
            to: 'academic-reviewer' as const,
            reason: draft.reason,
            expectedRev: submission.rev,
          };
    sendCmd.run(input).then(
      (answer) => {
        if (answer.ok) {
          setDraft(EMPTY_DRAFT);
          onDecided();
          return;
        }
        const error: ServiceError = answer.error;
        if (error.kind === 'validation-failed') {
          showErrors(sendBackErrorsOf(error));
          return;
        }
        // The record changed meanwhile (another revision, or decided from another tab or window):
        // what was chosen and typed stays (state-copy `CM-03.stale.changed`).
        if (error.kind === 'stale-version' || error.kind === 'invalid-state') {
          onStale();
          return;
        }
        onMovedOn();
      },
      () => setSendNotice(true),
    );
  };

  const go = () => {
    if (sendCmd.busy) return;
    const found: { choice?: string; to?: string; reason?: string } = {};
    if (shown === null) found.choice = DECISION_PANEL.chooseDecision;
    if (shown === 'send') Object.assign(found, checkSendBack(draft) ?? {});
    if (found.choice || found.to || found.reason) {
      showErrors(found);
      return;
    }
    setErrors({});
    if (shown === 'publish') {
      setDecisionRev(submission.rev);
      setDialogNotice(false);
      setDialog(true);
      return;
    }
    send();
  };

  const doPublish = () => {
    if (publishCmd.busy) return;
    setDialogNotice(false);
    publishCmd.run({ id: submission.id, expectedRev: decisionRev }).then(
      (answer) => {
        setDialog(false);
        if (answer.ok) {
          onDecided();
          return;
        }
        // Changed meanwhile (another revision, or decided from another tab or window): the page is
        // out of date (`CM-03.stale.changed`); any other refusal: it moved on (`CM-03.moved-on`).
        const kind = answer.error.kind;
        if (kind === 'stale-version' || kind === 'invalid-state') onStale();
        else onMovedOn();
      },
      () => setDialogNotice(true),
    );
  };

  const setTo = (to: SendBackTo) => {
    setDraft((current) => ({ ...current, to }));
    setErrors((current) => ({ ...current, to: undefined }));
  };

  const summary: ErrorSummaryItem[] = (['choice', 'to', 'reason'] as const)
    .filter((key) => errors[key])
    .map((key) => ({ fieldId: FIELD_IDS[key], summaryText: errors[key]! }));

  const reasonLabel =
    draft.to === 'vendor'
      ? DECISION_PANEL.reasonForVendor
      : draft.to === 'academic-reviewer'
        ? DECISION_PANEL.reasonForReviewer
        : DECISION_PANEL.reasonForEither;
  const pending =
    shown === null
      ? DECISION_PANEL.pendingChoose
      : shown === 'send' && (draft.to === null || draft.reason.trim() === '')
        ? blocked
          ? DECISION_PANEL.pendingBlocked
          : DECISION_PANEL.pendingSend
        : null;

  return (
    <>
      {blocked ? (
        <CmBlockers
          title={blockersTitle(facts.blockers.length)}
          items={facts.blockers.map((row) => blockerLine(row.title, row.line, row.fix))}
        />
      ) : null}
      <ErrorSummary
        ref={summaryRef}
        id="cm-d-errs"
        title={DECISION_PANEL.errorsTitle}
        items={summary}
      />
      {sendNotice ? (
        <Notice
          tone="warn"
          icon="alertCircle"
          role="alert"
          title={stateWords('CM-03.unavailable.send')}
        />
      ) : null}
      <ChoiceGroup<Choice>
        id={FIELD_IDS.choice}
        name="cm-d-choice"
        legend={DECISION_PANEL.legend}
        value={shown}
        error={errors.choice}
        onChange={(value) => {
          setChoice(value);
          setErrors({});
        }}
        options={[
          {
            value: 'publish',
            title: DECISION_PANEL.publish,
            description: blocked ? DECISION_PANEL.publishOff : DECISION_PANEL.publishSub,
            unavailable: blocked,
          },
          {
            value: 'send',
            title: DECISION_PANEL.sendBack,
            description: DECISION_PANEL.sendBackSub,
          },
        ]}
      />
      {shown === 'send' ? (
        <>
          <ChoiceGroup<SendBackTo>
            id={FIELD_IDS.to}
            name="cm-d-to"
            legend={DECISION_PANEL.to}
            legendHint={DECISION_PANEL.toHint}
            value={draft.to}
            error={errors.to}
            onChange={setTo}
            options={[
              {
                value: 'academic-reviewer',
                title: DECISION_PANEL.reviewer,
                description: DECISION_PANEL.reviewerSub,
              },
              {
                value: 'vendor',
                title: DECISION_PANEL.vendor,
                description: vendorChoiceSub(submission.vendorOrganisation),
              },
            ]}
          />
          <Field
            id={FIELD_IDS.reason}
            label={requiredLabel(reasonLabel)}
            hint={DECISION_PANEL.reasonHint}
            error={errors.reason}
          >
            <Textarea
              value={draft.reason}
              onChange={(event) => {
                const reason = event.target.value;
                setDraft((current) => ({ ...current, reason }));
                setErrors((current) => ({ ...current, reason: undefined }));
              }}
            />
          </Field>
          {draft.to === 'vendor' ? (
            <CheckGroup<string>
              id="cm-d-refs"
              legend={DECISION_PANEL.references}
              legendHint={DECISION_PANEL.referencesHint}
              options={options.map((option) => ({
                value: option.id,
                label: referenceWords(option.reference, option.formatCode),
              }))}
              values={options
                .filter((option) =>
                  draft.references.some((entry) => sameReference(entry, option.reference)),
                )
                .map((option) => option.id)}
              onChange={(values) =>
                setDraft((current) => ({
                  ...current,
                  references: options
                    .filter((option) => values.includes(option.id))
                    .map((option): ReturnReference => option.reference),
                }))
              }
            />
          ) : null}
        </>
      ) : null}
      {pending ? <PendingHint>{pending}</PendingHint> : null}
      <GoButton id="cm-d-go" busy={sendCmd.busy} busyLabel={DECISION_PANEL.sending} onClick={go}>
        {shown === 'send' ? DECISION_PANEL.sendBack : DECISION_PANEL.publish}
      </GoButton>
      <ConfirmDialog
        open={dialog}
        idPrefix="cm-dlg-pub"
        title={publishTitle(submission.content.name)}
        description={PUBLISH_DIALOG.description}
        groups={[
          {
            kind: 'now',
            title: PUBLISH_DIALOG.now,
            items: [
              publishWhere(facts.courseFull, facts.codes),
              PUBLISH_DIALOG.readOnly,
              PUBLISH_DIALOG.corrections,
            ],
          },
          {
            kind: 'later',
            title: PUBLISH_DIALOG.later,
            items: [PUBLISH_DIALOG.institutions, PUBLISH_DIALOG.students],
          },
        ]}
        confirmLabel={PUBLISH_DIALOG.confirm}
        busy={publishCmd.busy}
        busyLabel={PUBLISH_DIALOG.busy}
        // While it publishes, Cancel (disabled) and Escape wait for the result and focus is held
        // on the title (CM-v1 COMPONENT-EXTENSIONS "Behaviour notes"): a command once sent is not
        // taken back by closing its dialog.
        holdWhileBusy
        onConfirm={doPublish}
        onCancel={() => {
          if (publishCmd.busy) return;
          setDialog(false);
          setDialogNotice(false);
        }}
        returnFocusFallback={doneRef}
      >
        {dialogNotice ? (
          <Notice
            tone="warn"
            icon="alertCircle"
            role="alert"
            title={stateWords('CM-03.unavailable.publish')}
          />
        ) : null}
      </ConfirmDialog>
    </>
  );
}
