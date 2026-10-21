'use client';

import type { Result, ServiceError } from '@xr/contracts/draft';
import { FORMAT_META, inDisplayOrder } from '@xr/domain';
import { BackLink, PageContent, PageHeader } from '@xr/ui';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  ChoiceGroup,
  ConfirmDialog,
  DecisionPanel,
  ErrorSummary,
  type ErrorSummaryItem,
  Field,
  MessagePage,
  Notice,
  PendingHint,
  RvBandHead,
  RvBlock,
  RvBlockHead,
  RvComparison,
  RvCourse,
  RvDecisionOutcome,
  RvDetail,
  RvFootnote,
  RvHistory,
  RvIdCard,
  RvKindTag,
  RvLiveExperiment,
  RvPath,
  type RvPageLink,
  RvQuote,
  type RvReadyItem,
  RvReadyList,
  RvRefusal,
  RvStatus,
  Textarea,
  Timeline,
  V46Island,
} from '@xr/ui/v3';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { dateTime, dayMonth, dayMonthYear } from '@/copy/dates';
import {
  APPROVE_DIALOG,
  approveUpdateTitle,
  CHANGES_BLOCK,
  CHANGES_COLUMNS,
  changedFieldsTitle,
  changesNoteWords,
  columnWords,
  goesLiveLater,
  LIVE_BLOCK,
  liveNoteWords,
  liveOutcomesTitle,
  livePathLine,
  liveSinceFact,
  NOT_SENT,
  RELEASED_COLUMNS,
  staysLiveLine,
  staysLiveTitle,
  UPDATE_CARD,
  UPDATE_DECISION,
  UPDATE_REFUSAL,
  WHY_BLOCK,
  whyByWords,
} from '@/copy/review-update';
import {
  formatsFact,
  fromContentManager,
  RV_APPROVE_DIALOG,
  RV_BACK,
  RV_FACT_TERMS,
  RV_ITEM,
  RV_REFUSAL,
  waitingSentFact,
} from '@/copy/rv-shared';
import { stateWords } from '@/copy/state-copy';
import { NOT_YOUR_WORKSPACE } from '@/copy/xs';
import { useAppNavigation } from '@/nav/navigation';
import {
  REVIEW_QUEUE_ADDRESS,
  REVIEW_QUEUE_TITLE,
  REVIEWED_BY_ME_ADDRESS,
  type ReviewerParent,
  reviewerParentCrumb,
  reviewerParentOf,
  reviewUpdatePlacement,
} from '@/nav/reviewer';
import type { UpdateForReviewView } from '@/queries/correction-view';
import { useUpdateForReview } from '@/queries/corrections';
import {
  returnReasonIssue,
  returnUpdateIssue,
  useReviewUpdateExperiment,
} from '@/queries/review-update-forms';
import { useCurrentSession } from '@/queries/session';
import { useCommand } from '@/queries/use-command';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage, useWorkspaceIdentity } from '../../shared/workspace-frame/shell-page';
import { updateKind } from '../shared/kind';
import { updateRecordStanding } from '../shared/standing';
import { useRvToday, useRvTodayLine, waitingAge } from '../shared/waiting';
import {
  actorName,
  changeRowsOf,
  decidedAt,
  historyOf,
  isOpen,
  outcomeOf,
} from './review-update-view';

/** The export's ids (RV-v1 `RV.dc.html` item view). */
const TITLE_ID = 'rv-title';
const PANEL_ID = 'rv-panel';
const PANEL_TITLE_ID = 'rv-panel-h';
const DONE_ID = 'rv-done';
const REFUSAL_ID = 'rv-refusal';
const ERRORS_ID = 'rv-errs';
const GO_ID = 'rv-go';
const CHOICE_ID = 'rv-choice';
/** "Whole update." in Before you decide: it describes each decision (RV-v1 `aria-describedby`). */
const WHOLE_ID = 'rv-whole';
const REASON_ID = 'rv-reason';
const SECTION = { why: 'rv-s-why', changes: 'rv-s-cmp', live: 'rv-s-live', history: 'rv-s-hist' };

/** The experiment as the catalogue lists it: its course and the live learning outcomes. */
interface ExperimentFacts {
  readonly courseCode: string | null;
  readonly courseName: string;
  readonly outcomes: readonly string[];
}

/**
 * RV-04 Review an update, and RV-06 for an update once decided — the owner-approved Academic
 * Reviewer export (V3 Refined B, design/v3-refined-b/roles/RV-v1, `RV.dc.html` item view for an
 * update; boards RV04, RV04-1024/768/375, RV04-return-errors, -confirm, -approved, -returned,
 * -stale-armed, -stale, RV06-update), at `/reviewer/updates/[updateId]`.
 *
 * - **Read**: `CorrectionService.getUpdateForReview` — the update, the comparison of its changed
 *   fields with the live version, the live version and whether it is decided — and the experiment
 *   as the public catalogue lists it (its course and the live learning outcomes). Loading and a
 *   failed read keep the application's existing page states (as CM-v1 HANDOFF §4).
 * - **As the export draws it**: the breadcrumb (the parent list, then the experiment's name), the
 *   identity card (Update · <from> → <to>, the name, the summary, the status, the course, “From
 *   <Content Manager>, Content Manager”; live version, proposed version, waiting or decided,
 *   formats; the page map), then *Why this correction*, *What changes* (live now beside proposed,
 *   removed words struck, added words highlighted), *The live experiment* (its outcomes read-only)
 *   and the update history, beside “Your decision”. No reference (UPD-…) is ever shown; the
 *   Content Manager's reason is quoted as written.
 * - **Decide**: no choice at first; *Before you decide*, the choice, the one gold button, *What
 *   happens next*. Approve update asks first (“Approve the update to <name>?”: it goes to the Super
 *   Admin; the live version stays until a release — approval releases nothing). Return to the
 *   Content Manager takes its required reason in the panel and is sent at once. Errors show in
 *   “Check your decision”, which takes focus, and at their field. Each command carries the update's
 *   revision (`expectedRev`) and ignores a repeated press.
 * - **Refused**: withdrawn under the page → “Nothing was recorded” and the withdrawn outcome;
 *   decided elsewhere → “Nothing new was recorded”; changed but still waiting → “This update changed
 *   since you opened it” with the panel open; failed for now → the dialog (or the panel) says so;
 *   not found or outside the reviewer’s scope → the in-shell not-found page; not sent yet (a draft
 *   the service keeps from the reviewer) → the XS message page (`RV-04.not-sent`).
 * - **Decided** (RV-06): the outcome block — status, when, the reason of a return, where it stands,
 *   what happens next and the way back to the parent list; focus moves to it after a decision made
 *   here.
 */
export function ReviewUpdate({ updateId }: { readonly updateId: string }) {
  const read = useUpdateForReview(updateId);
  const answer = read.data?.ok ? read.data.value : null;
  const experimentId = answer?.update.experimentId ?? null;
  const experiment = useReviewUpdateExperiment(experimentId);
  const session = useCurrentSession();
  const reader = session.data?.ok ? (session.data.value?.session.displayName ?? '') : '';
  // The list the page sits under (RV-v1 `parentOf`): the Review queue while the update waited for
  // the reviewer when the page opened, otherwise Reviewed by me — kept after a decision made here.
  const [parent, setParent] = useState<ReviewerParent | null>(null);
  if (answer && parent === null) setParent(reviewerParentOf(isOpen(answer)));
  useShellPage(
    reviewUpdatePlacement(
      answer ? { name: answer.live.catalogue.name, decided: !isOpen(answer), parent } : null,
    ),
  );

  const facts: ExperimentFacts | null = experiment.data?.ok
    ? {
        courseCode: experiment.data.value.platformCode,
        courseName: experiment.data.value.courseName,
        outcomes: experiment.data.value.learningOutcomes,
      }
    : null;
  const experimentPending = experimentId !== null && experiment.isPending;
  const guard = (
    <RecordGuard
      read={{
        data: experimentPending ? undefined : read.data,
        isPending: read.isPending || experimentPending,
        isError: read.isError,
        refetch: () => void read.refetch(),
      }}
      loadingLabel={stateWords('RV-04.loading')}
      failed={{ title: stateWords('RV-04.failed'), line: stateWords('RV-04.failed.line') }}
      refusals={{ 'invalid-state': <NotSent /> }}
    >
      {(view) => (
        <Review
          key={view.update.id}
          view={view}
          experiment={facts}
          reader={reader}
          parent={parent ?? reviewerParentOf(isOpen(view))}
          onReread={() => read.refetch()}
        />
      )}
    </RecordGuard>
  );
  // While it loads or fails: the application's existing page states, with the page's heading.
  const bare = read.isError || read.data === undefined || experimentPending;
  if (!bare) return guard;
  return (
    <V46Island>
      <PageContent wrap="wide">
        <PageHeader
          className="[margin:8px_0_16px]"
          back={<BackLink href={REVIEW_QUEUE_ADDRESS}>{REVIEW_QUEUE_TITLE}</BackLink>}
          title={NOT_SENT.heading}
        />
        {guard}
      </PageContent>
    </V46Island>
  );
}

/**
 * Not sent yet (a draft the service keeps from the reviewer, UPD-16): the delivered XS message
 * page in the V3 shell, with the product's words (state-copy `RV-04.not-sent`) — nothing about the
 * draft.
 */
function NotSent() {
  const { help } = useWorkspaceIdentity();
  return (
    <MessagePage
      kind="done"
      title={NOT_SENT.title}
      titleId={TITLE_ID}
      primary={{ href: REVIEW_QUEUE_ADDRESS, label: NOT_SENT.openQueue }}
      secondary={{ href: help, label: NOT_YOUR_WORKSPACE.help }}
    >
      {NOT_SENT.line}
    </MessagePage>
  );
}

/** Why a decision was refused: the update had changed, or was no longer waiting (re-read). */
type Refusal = 'stale' | 'moved-on' | null;
type Choice = 'approve' | 'return';
interface PanelErrors {
  readonly choice?: string;
  readonly reason?: string;
}

function Review({
  view,
  experiment,
  reader,
  parent,
  onReread,
}: {
  readonly view: UpdateForReviewView;
  readonly experiment: ExperimentFacts | null;
  readonly reader: string;
  readonly parent: ReviewerParent;
  readonly onReread: () => Promise<unknown>;
}) {
  const navigation = useAppNavigation();
  const { personId } = useWorkspaceIdentity();
  const today = useRvToday();
  const todayLine = useRvTodayLine();
  const { update, live } = view;
  const open = isOpen(view);
  const name = live.catalogue.name;
  const proposedLabel = update.versionLabel ?? '';

  const [choice, setChoice] = useState<Choice | null>(null);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<PanelErrors>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  /** The update’s revision when the dialog opened: approval is sent on it (`expectedRev`). */
  const [decisionRev, setDecisionRev] = useState(update.rev);
  const [refusal, setRefusal] = useState<Refusal>(null);
  const [sendFailed, setSendFailed] = useState(false);
  const [gone, setGone] = useState(false);
  const [focusRefusal, setFocusRefusal] = useState(0);
  const decidedFocus = useRef(false);
  const doneRef = useRef<HTMLDivElement>(null);
  const refusalRef = useRef<HTMLDivElement>(null);
  const errorsRef = useRef<HTMLDivElement>(null);

  const approve = useCommand((ports) => ports.corrections.approveUpdate);
  const giveBack = useCommand((ports) => ports.corrections.returnUpdate);

  // A refusal: focus to the notice at the top of the panel (the export's `focusId('rv-refusal')`).
  useEffect(() => {
    if (focusRefusal > 0) refusalRef.current?.focus();
  }, [focusRefusal]);

  // Decided here: focus moves to the outcome (the export's `focusId('rv-done')`).
  useEffect(() => {
    if (open || !decidedFocus.current) return;
    decidedFocus.current = false;
    doneRef.current?.focus();
  });

  if (gone) return navigation.notFound();

  /** What an answer to a decision means for the page (refusals are values, ADR-0008). */
  const answered = (result: Result<unknown, ServiceError>, returning: boolean) => {
    if (result.ok) {
      setDialogOpen(false);
      setRefusal(null);
      setErrors({});
      decidedFocus.current = true;
      return;
    }
    const error = result.error;
    if (error.kind === 'validation-failed') {
      const issue = returnReasonIssue(error);
      if (issue && returning) {
        setErrors({ reason: issue });
        errorsRef.current?.focus();
        return;
      }
    }
    if (error.kind === 'not-found' || error.kind === 'not-permitted') {
      setGone(true);
      return;
    }
    // Stale, withdrawn or decided elsewhere: nothing was written. The update is read again; the
    // notice then says what happened, from the update as it is now.
    setDialogOpen(false);
    const kind: Refusal = error.kind === 'stale-version' ? 'stale' : 'moved-on';
    void onReread().then(() => {
      setRefusal(kind);
      setFocusRefusal((count) => count + 1);
    });
  };

  const failed = () => setSendFailed(true);

  const go = () => {
    const found: PanelErrors = {
      ...(choice === null ? { choice: UPDATE_DECISION.chooseDecision } : {}),
      ...(choice === 'return'
        ? (() => {
            const issue = returnUpdateIssue({ id: update.id, reason, expectedRev: update.rev });
            return issue ? { reason: issue } : {};
          })()
        : {}),
    };
    setErrors(found);
    if (Object.keys(found).length > 0) {
      errorsRef.current?.focus();
      return;
    }
    setRefusal(null);
    setSendFailed(false);
    if (choice === 'approve') {
      setDecisionRev(update.rev);
      setDialogOpen(true);
      return;
    }
    if (giveBack.busy) return;
    giveBack
      .run({ id: update.id, reason, expectedRev: update.rev })
      .then((result) => answered(result, true), failed);
  };

  const sendApprove = () => {
    if (approve.busy) return;
    setSendFailed(false);
    approve
      .run({ id: update.id, expectedRev: decisionRev })
      .then((result) => answered(result, false), failed);
  };

  // ---- the identity card --------------------------------------------------------------------------
  const kind = updateKind(update);
  const standing = updateRecordStanding(update);
  const formats = inDisplayOrder(live.formats.map((entry) => entry.format)).map(
    (format) => FORMAT_META[format].code,
  );
  const decidedOn = decidedAt(update);
  const waitingSince = update.sentForReviewAt;
  const facts = [
    {
      key: 'live',
      term: UPDATE_CARD.liveVersion,
      value: liveSinceFact(live.label, dayMonth(live.liveFrom)),
    },
    ...(proposedLabel
      ? [{ key: 'proposed', term: UPDATE_CARD.proposedVersion, value: proposedLabel }]
      : []),
    ...(open && waitingSince && today
      ? [
          {
            key: 'waiting',
            term: RV_FACT_TERMS.waiting,
            value: (() => {
              const age = waitingAge(waitingSince, today);
              return waitingSentFact(age.age, age.day);
            })(),
          },
        ]
      : []),
    ...(!open && update.state !== 'withdrawn' && decidedOn
      ? [{ key: 'decided', term: RV_FACT_TERMS.decided, value: dateTime(decidedOn) }]
      : []),
    ...(formats.length > 0
      ? [{ key: 'formats', term: RV_FACT_TERMS.formats, value: formatsFact(formats) }]
      : []),
  ];
  const changeRows = changeRowsOf(view);
  const why = update.whatChangesAndWhy;
  const hasLive = experiment !== null;
  const pageMap: RvPageLink[] = [
    ...(why ? [{ targetId: SECTION.why, label: UPDATE_CARD.anchors.why }] : []),
    ...(changeRows.length > 0
      ? [
          {
            targetId: SECTION.changes,
            label: UPDATE_CARD.anchors.changes,
            count: String(changeRows.length),
          },
        ]
      : []),
    ...(hasLive ? [{ targetId: SECTION.live, label: UPDATE_CARD.anchors.live }] : []),
    { targetId: SECTION.history, label: UPDATE_CARD.anchors.history },
  ];

  // ---- the panel ----------------------------------------------------------------------------------
  let notice: ReactNode = null;
  if (refusal !== null) {
    const [title, detail] =
      update.state === 'withdrawn'
        ? [RV_REFUSAL.stale, UPDATE_REFUSAL.withdrawnLine]
        : open
          ? [stateWords('RV-04.stale.title'), stateWords('RV-04.stale.line')]
          : [RV_REFUSAL.elsewhere, stateWords('RV-04.moved-on')];
    notice = <RvRefusal id={REFUSAL_ID} refusalRef={refusalRef} title={title} detail={detail} />;
  }
  const back =
    parent === 'reviewed'
      ? { href: REVIEWED_BY_ME_ADDRESS, label: RV_BACK.reviewed }
      : { href: REVIEW_QUEUE_ADDRESS, label: RV_BACK.queue };

  let panel: ReactNode;
  if (open) {
    const ready: RvReadyItem[] = [
      {
        id: WHOLE_ID,
        tone: 'info',
        icon: 'layers',
        title: UPDATE_DECISION.wholeTitle,
        detail: UPDATE_DECISION.wholeLine,
      },
      ...(proposedLabel
        ? [
            {
              id: 'rv-ready-1',
              tone: 'info' as const,
              icon: 'live' as const,
              title: staysLiveTitle(live.label),
              detail: staysLiveLine(proposedLabel),
            },
          ]
        : []),
      ...(changeRows.length > 0
        ? [
            {
              id: 'rv-ready-2',
              tone: 'info' as const,
              icon: 'update' as const,
              title: changedFieldsTitle(changeRows.length),
              link: { label: UPDATE_DECISION.seeChanges, targetId: SECTION.changes },
            },
          ]
        : []),
    ];
    const summary: ErrorSummaryItem[] = [
      ...(errors.choice ? [{ fieldId: CHOICE_ID, summaryText: errors.choice }] : []),
      ...(errors.reason ? [{ fieldId: REASON_ID, summaryText: errors.reason }] : []),
    ];
    const returning = choice === 'return';
    const pending =
      returning && reason.trim() === '' && !errors.reason ? UPDATE_DECISION.pendingReason : null;
    panel = (
      <>
        {notice}
        <RvReadyList title={RV_ITEM.beforeYouDecide} items={ready} />
        <ErrorSummary
          ref={errorsRef}
          id={ERRORS_ID}
          title={RV_ITEM.checkYourDecision}
          items={summary}
        />
        <ChoiceGroup<Choice>
          id={CHOICE_ID}
          name={CHOICE_ID}
          legend={RV_ITEM.decision}
          error={errors.choice}
          value={choice}
          onChange={(value) => {
            setChoice(value);
            setErrors({});
          }}
          options={[
            {
              value: 'approve',
              title: UPDATE_DECISION.approve.title,
              description: UPDATE_DECISION.approve.sub,

              describedBy: WHOLE_ID,
            },
            {
              value: 'return',
              title: UPDATE_DECISION.return.title,
              description: UPDATE_DECISION.return.sub,

              describedBy: WHOLE_ID,
            },
          ]}
        />
        {returning ? (
          <Field
            id={REASON_ID}
            label={UPDATE_DECISION.reasonLabel}
            hint={UPDATE_DECISION.reasonHint}
            error={errors.reason}
          >
            <Textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setErrors((current) => (current.choice ? { choice: current.choice } : {}));
              }}
            />
          </Field>
        ) : null}
        {returning && sendFailed ? <UnavailableNotice /> : null}
        {pending ? <PendingHint>{pending}</PendingHint> : null}
        <Button
          id={GO_ID}
          variant="primary"
          className="rk-go"
          busy={giveBack.busy}
          busyLabel={UPDATE_DECISION.returning}
          onClick={go}
        >
          {returning ? UPDATE_DECISION.return.title : UPDATE_DECISION.approve.title}
        </Button>
        <RvPath
          title={RV_ITEM.whatHappensNext}
          steps={[
            {
              key: 'you',
              number: '1',
              title: RV_ITEM.youAcademicDecision,
              detail: UPDATE_DECISION.path.youLine,
              now: true,
            },
            {
              key: 'super-admin',
              number: '2',
              title: UPDATE_DECISION.path.superAdmin.title,
              detail: UPDATE_DECISION.path.superAdmin.line,
            },
            {
              key: 'live',
              number: '3',
              title: UPDATE_DECISION.path.liveTitle,
              detail: livePathLine(live.label),
            },
          ]}
        />
      </>
    );
  } else {
    const outcome = outcomeOf(view, personId);
    panel = (
      <>
        {notice}
        <RvDecisionOutcome
          id={DONE_ID}
          outcomeRef={doneRef}
          status={
            standing ? (
              <RvStatus tone={standing.tone} size="lg">
                {standing.label}
              </RvStatus>
            ) : null
          }
          meta={outcome.meta}
          reason={outcome.reason ? { label: RV_ITEM.yourReason, text: outcome.reason } : undefined}
          stand={outcome.stand}
          next={outcome.next}
          action={<ButtonLink href={back.href}>{back.label}</ButtonLink>}
        />
      </>
    );
  }

  const released = update.state === 'released';
  const columns = released ? RELEASED_COLUMNS : CHANGES_COLUMNS;
  return (
    <>
      <RvIdCard
        date={todayLine}
        breadcrumbs={<Breadcrumbs levels={[reviewerParentCrumb(parent)]} current={name} />}
        kind={<RvKindTag kind={kind.kind} label={kind.label} detail={kind.detail} />}
        title={name}
        titleId={TITLE_ID}
        lead={live.catalogue.summary}
        status={
          standing ? (
            <RvStatus tone={standing.tone} size="lg">
              {standing.label}
            </RvStatus>
          ) : null
        }
        course={
          experiment ? (
            <RvCourse placement="card" code={experiment.courseCode} name={experiment.courseName} />
          ) : null
        }
        who={fromContentManager(actorName(update.startedBy))}
        goTo={{ label: RV_ITEM.goToDecision, targetId: PANEL_ID, focusId: PANEL_TITLE_ID }}
        facts={facts}
        pageMapLabel={RV_ITEM.onThisPage}
        pageMap={pageMap}
      />
      <RvDetail
        panelId={PANEL_ID}
        panelLabelledBy={PANEL_TITLE_ID}
        main={
          <>
            {why ? (
              <RvBlock labelledBy={SECTION.why}>
                <RvBandHead
                  titleId={SECTION.why}
                  icon="message"
                  title={WHY_BLOCK.title}
                  note={WHY_BLOCK.note}
                />
                <RvQuote
                  quote={why}
                  by={whyByWords(
                    actorName(update.startedBy),
                    update.sentForReviewAt ? dateTime(update.sentForReviewAt) : null,
                  )}
                />
              </RvBlock>
            ) : null}
            {changeRows.length > 0 ? (
              <RvBlock labelledBy={SECTION.changes}>
                <RvBlockHead
                  titleId={SECTION.changes}
                  title={CHANGES_BLOCK.title}
                  note={changesNoteWords(changeRows.length, update.baseVersionLabel)}
                />
                <RvComparison
                  label={CHANGES_BLOCK.tableLabel}
                  fieldHeader={CHANGES_BLOCK.field}
                  beforeHeader={columnWords(columns.before, update.baseVersionLabel)}
                  afterHeader={columnWords(columns.after, update.versionLabel)}
                  rows={changeRows}
                />
                <RvFootnote>{CHANGES_BLOCK.footnote}</RvFootnote>
              </RvBlock>
            ) : null}
            {experiment ? (
              <RvLiveExperiment
                titleId={SECTION.live}
                kicker={LIVE_BLOCK.kicker}
                title={LIVE_BLOCK.title}
                note={liveNoteWords(live.label, dayMonthYear(live.liveFrom))}
                outcomesTitle={liveOutcomesTitle(live.label)}
                outcomes={experiment.outcomes}
                footnote={LIVE_BLOCK.footnote}
              />
            ) : null}
          </>
        }
        panel={
          <DecisionPanel title={RV_ITEM.yourDecision} titleId={PANEL_TITLE_ID}>
            {panel}
          </DecisionPanel>
        }
        history={
          <RvHistory
            titleId={SECTION.history}
            title={RV_ITEM.updateHistory}
            note={RV_ITEM.newestFirst}
            variant={open && refusal === null ? 'quiet' : 'card'}
          >
            <Timeline events={historyOf(update, reader)} />
          </RvHistory>
        }
      />
      {open ? (
        <ConfirmDialog
          open={dialogOpen}
          idPrefix="rv-dlg"
          title={approveUpdateTitle(name)}
          description={RV_APPROVE_DIALOG.description}
          groups={[
            {
              kind: 'now',
              title: RV_APPROVE_DIALOG.now,
              items: [APPROVE_DIALOG.toSuperAdmin, RV_APPROVE_DIALOG.leavesQueue],
            },
            {
              kind: 'later',
              title: RV_APPROVE_DIALOG.later,
              items: [goesLiveLater(proposedLabel, live.label), APPROVE_DIALOG.noAccessChange],
            },
          ]}
          cancelLabel={APPROVE_DIALOG.cancel}
          confirmLabel={APPROVE_DIALOG.confirm}
          busy={approve.busy}
          busyLabel={UPDATE_DECISION.approving}
          holdWhileBusy
          returnFocusFallback={doneRef}
          onConfirm={sendApprove}
          onCancel={() => {
            setDialogOpen(false);
            setSendFailed(false);
          }}
        >
          {sendFailed ? <UnavailableNotice /> : null}
        </ConfirmDialog>
      ) : null}
    </>
  );
}

/** A decision that failed for now: nothing was lost (state-copy `RV-04.unavailable`). */
function UnavailableNotice() {
  return (
    <Notice tone="warn" icon="alertCircle" role="alert" title={stateWords('RV-04.unavailable')} />
  );
}
