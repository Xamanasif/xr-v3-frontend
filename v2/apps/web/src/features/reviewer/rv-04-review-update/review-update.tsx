'use client';

import type { Result, ServiceError } from '@xr/contracts/draft';
import { FORMAT_META, inDisplayOrder } from '@xr/domain';
import {
  BackLink,
  Button,
  ChoiceCard,
  ChoiceList,
  ConfirmDialog,
  DecisionLayout,
  Field,
  FormatBadge,
  Icon,
  JumpLink,
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
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { COMPARISON } from '@/copy/corrections';
import { dayMonthYear } from '@/copy/dates';
import {
  approveUpdateEffect,
  approveUpdateTitle,
  courseLineWords,
  liveSinceWords,
  RELEASED_COLUMNS,
  REVIEW_UPDATE,
  reviewUpdateMeta,
  reviewUpdateOverline,
  reviewUpdateTitle,
  STRIPPED_UPDATE,
  UPDATE_DECISION,
} from '@/copy/review-update';
import { stateWords } from '@/copy/state-copy';
import { useAppNavigation } from '@/nav/navigation';
import { REVIEW_QUEUE_ADDRESS, REVIEW_QUEUE_TITLE, reviewUpdatePlacement } from '@/nav/reviewer';
import type { UpdateForReviewView } from '@/queries/correction-view';
import { useUpdateForReview } from '@/queries/corrections';
import {
  returnReasonIssue,
  returnUpdateIssue,
  useReviewUpdateExperiment,
} from '@/queries/review-update-forms';
import { useCurrentSession } from '@/queries/session';
import { useCommand } from '@/queries/use-command';

import { CorrectionComparison } from '../../shared/correction-comparison/correction-comparison';
import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { actorName, chipOf, decidedPanelOf, historyOf, isOpen } from './review-update-view';

/** The page’s element ids (B6-04 `Um-…`): the panel, its heading, button and result; the field. */
const PANEL_ID = 'ru-decision';
const PANEL_TITLE_ID = 'ru-dp';
const GO_ID = 'ru-go';
const DECIDED_ID = 'ru-dec';
const REASON_ID = 'ru-reason';
const TITLE_ID = 'ru-h';

/** The experiment as the catalogue lists it: its course and learning outcomes (`null`: unread). */
interface ExperimentFacts {
  readonly courseCode: string | null;
  readonly courseName: string;
  readonly outcomes: readonly string[];
}

/**
 * RV-04 Review an update — board B6-04 f0 … f4, B6-13 f4 and B7-11 f6, at
 * `/reviewer/updates/[updateId]`.
 *
 * - **Read**: `CorrectionService.getUpdateForReview` — the update, the comparison of its changed
 *   fields with the live version, the live version and whether it is decided — and the experiment
 *   as the public catalogue lists it (its course and learning outcomes; the live version only).
 * - **As B6-04 draws it** (AR-4; the panel beside the content from 860 px of content, under it
 *   below with “Go to decision”; `xg-static`): the back link, “UPD-0005 · Update (Content Manager
 *   correction)”, “<name> · <from> → <to>”, the chip and “From <Content Manager> · <course> · live
 *   version <v>”; “What changes · Changed fields only” (the shared comparison, CM-08 / SA-11);
 *   “Why — from the Content Manager”; “About this experiment · Live · read-only” (course, formats,
 *   the live version and since when, the learning outcomes, the open note without its id);
 *   “Update history · Newest first”.
 * - **Decide** (“Your decision”): Approve update (the default) through DL-1 — “It goes to the Super
 *   Admin, who decides when to release it. Version <v> stays live until then.”: approval releases
 *   and publishes nothing — or Return to the Content Manager through DL-2 with a required reason
 *   (no references: open, T-28). Each carries the update’s revision from when its dialog opened.
 * - **Refusals**: stale → read again, a calm warning in the panel (`RV-04.stale.*`); withdrawn or
 *   decided elsewhere → the current state with `RV-04.moved-on`; failed for now → the dialog stays
 *   open (`RV-04.unavailable`); not found or outside the reviewer’s scope → the in-shell not-found
 *   page; not sent yet (a draft the service keeps from the reviewer) → B6-13 f4’s “No update is
 *   waiting for your decision” (`RV-04.not-sent`).
 * - **Decided** (f3, f4; withdrawn, on hold, released): the panel’s result with “Back to the
 *   review queue” (`RV-04.decided`); focus moves to it after a decision made here.
 */
export function ReviewUpdate({ updateId }: { readonly updateId: string }) {
  const read = useUpdateForReview(updateId);
  const answer = read.data?.ok ? read.data.value : null;
  const experimentId = answer?.update.experimentId ?? null;
  const experiment = useReviewUpdateExperiment(experimentId);
  const session = useCurrentSession();
  const reader = session.data?.ok ? (session.data.value?.session.displayName ?? '') : '';
  // The top bar reads “Review queue” below 1024 px and the crumbs “Review queue / UPD-0005” from
  // 1024 px (B6-04 f0 … f4).
  useShellPage(reviewUpdatePlacement(answer ? answer.update.id : null));

  const facts: ExperimentFacts | null = experiment.data?.ok
    ? {
        courseCode: experiment.data.value.platformCode,
        courseName: experiment.data.value.courseName,
        outcomes: experiment.data.value.learningOutcomes,
      }
    : null;
  const experimentPending = experimentId !== null && experiment.isPending;
  // While it loads or fails: the back link and the page’s heading (`RV-04.loading`).
  const bare = read.isError || read.data === undefined || experimentPending;
  return (
    <PageContent wrap="wide">
      {bare ? <BareHeader /> : null}
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
            onReread={() => void read.refetch()}
          />
        )}
      </RecordGuard>
    </PageContent>
  );
}

/** Before the update is read (or when it can’t be): the back link and the page’s heading. */
function BareHeader() {
  return (
    <PageHeader
      className="[margin:8px_0_16px]"
      back={<BackLink href={REVIEW_QUEUE_ADDRESS}>{REVIEW_QUEUE_TITLE}</BackLink>}
      title={REVIEW_UPDATE.heading}
    />
  );
}

/** B6-04 `rvNone`, B6-13 f4: nothing to decide until it is sent (state-copy `RV-04.not-sent`). */
function NotSent() {
  return (
    <>
      <PageHeader
        className="[margin:8px_0_16px]"
        back={<BackLink href={REVIEW_QUEUE_ADDRESS}>{REVIEW_QUEUE_TITLE}</BackLink>}
        title={REVIEW_UPDATE.heading}
        titleId={TITLE_ID}
        titleFocusTarget
      />
      <div className="xr-section">
        <div className="xr-empty">
          <span className="xr-empty-icon xr-x-empty-icon--ok">
            <Icon name="done" />
          </span>
          <h2 className="xr-h3 m-0">{REVIEW_UPDATE.noneTitle}</h2>
          <p className="xr-body m-0 text-ink-2">{REVIEW_UPDATE.noneLine}</p>
          <div className="flex flex-wrap gap-3">
            <Link className="xr-btn xr-btn--secondary" href={REVIEW_QUEUE_ADDRESS}>
              {REVIEW_UPDATE.openQueue}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

/** What the panel says after a refused decision. */
type PanelNotice = 'stale' | 'moved-on' | null;

/** The choice (B6-04 `rvc`) and the open dialog: DL-1 Approve or DL-2 Return. */
type Choice = 'approve' | 'return';

function Review({
  view,
  experiment,
  reader,
  onReread,
}: {
  readonly view: UpdateForReviewView;
  readonly experiment: ExperimentFacts | null;
  readonly reader: string;
  readonly onReread: () => void;
}) {
  const navigation = useAppNavigation();
  const { update, live } = view;
  const open = isOpen(view);
  const chip = chipOf(update);
  const name = live.catalogue.name;

  const [choice, setChoice] = useState<Choice>('approve');
  const [dialog, setDialog] = useState<Choice | null>(null);
  /** The update’s revision when the dialog opened: the decision is sent on it (`expectedRev`). */
  const [decisionRev, setDecisionRev] = useState(update.rev);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [notice, setNotice] = useState<PanelNotice>(null);
  const [sendFailed, setSendFailed] = useState(false);
  const [gone, setGone] = useState(false);
  const [focusTitle, setFocusTitle] = useState(0);
  const decidedFocus = useRef(false);
  const decidedRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const approve = useCommand((ports) => ports.corrections.approveUpdate);
  const giveBack = useCommand((ports) => ports.corrections.returnUpdate);

  // A refusal: focus to the panel’s heading, where the notice is.
  useEffect(() => {
    if (focusTitle > 0) titleRef.current?.focus();
  }, [focusTitle]);

  // Decided here: focus moves to the decided panel (B6-04 `focus(pid + '-r-dec')`).
  useEffect(() => {
    if (open || !decidedFocus.current) return;
    decidedFocus.current = false;
    decidedRef.current?.focus();
  });

  if (gone) return navigation.notFound();

  const go = () => {
    setNotice(null);
    setDecisionRev(update.rev);
    setSendFailed(false);
    setReasonError(null);
    if (choice === 'return') setReason('');
    setDialog(choice);
  };

  const cancel = () => {
    setDialog(null);
    setSendFailed(false);
    setReasonError(null);
  };

  /** What an answer to a decision means for the page (refusals are values, ADR-0008). */
  const answered = (result: Result<unknown, ServiceError>) => {
    if (result.ok) {
      setDialog(null);
      setNotice(null);
      decidedFocus.current = true;
      return;
    }
    const error = result.error;
    if (error.kind === 'validation-failed') {
      const issue = returnReasonIssue(error);
      if (issue && dialog === 'return') {
        setReasonError(issue);
        return;
      }
    }
    if (error.kind === 'not-found' || error.kind === 'not-permitted') {
      setGone(true);
      return;
    }
    // Stale, withdrawn or decided elsewhere: nothing was written. The update is read again and
    // the next attempt is sent on the update as now shown.
    setDialog(null);
    setNotice(error.kind === 'stale-version' ? 'stale' : 'moved-on');
    onReread();
    setFocusTitle((count) => count + 1);
  };

  const failed = () => setSendFailed(true);

  const sendApprove = () => {
    if (approve.busy) return;
    setSendFailed(false);
    approve.run({ id: update.id, expectedRev: decisionRev }).then(answered, failed);
  };

  const sendReturn = () => {
    if (giveBack.busy) return;
    setSendFailed(false);
    const input = { id: update.id, reason, expectedRev: decisionRev };
    const issue = returnUpdateIssue(input);
    if (issue) {
      setReasonError(issue);
      return;
    }
    giveBack.run(input).then(answered, failed);
  };

  // ---- the panel (B6-04 `rvOpen`, `rvClosed`) ----
  let panel: ReactNode;
  if (open) {
    panel = (
      <>
        {notice === 'stale' ? (
          <Notice tone="warn" role="alert" title={stateWords('RV-04.stale.title')}>
            {stateWords('RV-04.stale.line')}
          </Notice>
        ) : null}
        <RadioGroup
          legend={UPDATE_DECISION.legend}
          legendClass="xr-sr"
          value={choice}
          onValueChange={(value) => setChoice(value === 'return' ? 'return' : 'approve')}
        >
          <ChoiceList>
            <ChoiceCard
              value="approve"
              id="ru-ua"
              title={UPDATE_DECISION.approve.title}
              sub={UPDATE_DECISION.approve.sub}
            />
            <ChoiceCard
              value="return"
              id="ru-ur"
              title={UPDATE_DECISION.return.title}
              sub={UPDATE_DECISION.return.sub}
            />
          </ChoiceList>
        </RadioGroup>
        <Button id={GO_ID} variant="primary" block onClick={go}>
          {choice === 'approve' ? UPDATE_DECISION.approve.title : UPDATE_DECISION.return.title}
        </Button>
      </>
    );
  } else {
    const decided = decidedPanelOf(update, live.label);
    panel = (
      <div id={DECIDED_ID} ref={decidedRef} tabIndex={-1} className="flex flex-col gap-3">
        {notice !== null ? (
          <Notice tone="info" role="status">
            {stateWords('RV-04.moved-on')}
          </Notice>
        ) : null}
        {/* B6-04 f3, f4 draw the chip across the panel. */}
        <StatusPill tone={decided.tone} className="self-stretch">
          {decided.title}
        </StatusPill>
        {decided.meta ? <p className="xr-small m-0 text-ink-2">{decided.meta}</p> : null}
        {decided.next ? <p className="xr-body m-0 text-ink">{decided.next}</p> : null}
        <Link className="xr-btn xr-btn--secondary xr-btn--block" href={REVIEW_QUEUE_ADDRESS}>
          {UPDATE_DECISION.backToQueue}
        </Link>
      </div>
    );
  }

  const course = experiment ? courseLineWords(experiment.courseCode, experiment.courseName) : null;
  return (
    <>
      <PageHeader
        className="[margin:8px_0_16px]"
        back={<BackLink href={REVIEW_QUEUE_ADDRESS}>{REVIEW_QUEUE_TITLE}</BackLink>}
        overline={reviewUpdateOverline(update.id)}
        title={reviewUpdateTitle(name, update.baseVersionLabel, update.versionLabel)}
        titleId={TITLE_ID}
        titleFocusTarget
        meta={
          <>
            <StatusPill tone={chip.tone}>{chip.words}</StatusPill>
            <span>
              {reviewUpdateMeta(
                actorName(update.startedBy),
                experiment ? (experiment.courseCode ?? experiment.courseName) : null,
                live.label,
              )}
            </span>
          </>
        }
      />
      <JumpLink targetId={PANEL_ID} className="mb-4" />
      <DecisionLayout
        jump={false}
        panel={{
          id: PANEL_ID,
          title: UPDATE_DECISION.panelTitle,
          titleId: PANEL_TITLE_ID,
          titleFocusTarget: true,
          titleRef,
          position: 'static',
          children: panel,
        }}
      >
        <WhatChanges view={view} />
        <Section title={REVIEW_UPDATE.whyTitle} headingId="ru-ry">
          <SectionBody>
            <blockquote className="xv-quote bg-(--xr-surface-2)">
              {update.whatChangesAndWhy ?? ''}
            </blockquote>
          </SectionBody>
        </Section>
        <AboutExperiment view={view} course={course} outcomes={experiment?.outcomes ?? []} />
        <Section
          title={REVIEW_UPDATE.historyTitle}
          meta={REVIEW_UPDATE.historyMeta}
          headingId="ru-hh"
        >
          <SectionBody>
            <Timeline markLatest={false} events={historyOf(update, reader)} />
          </SectionBody>
        </Section>
      </DecisionLayout>
      {open ? (
        <>
          <ConfirmDialog
            open={dialog === 'approve'}
            align="decision"
            idPrefix="ru-a"
            title={approveUpdateTitle(update.id)}
            effect={<strong>{approveUpdateEffect(live.label)}</strong>}
            notice={sendFailed ? <UnavailableNotice /> : undefined}
            cancelLabel={UPDATE_DECISION.cancel}
            confirmLabel={UPDATE_DECISION.approve.title}
            busy={approve.busy}
            busyLabel={UPDATE_DECISION.approving}
            returnFocusFallback={decidedRef}
            onConfirm={sendApprove}
            onCancel={cancel}
          />
          <ReasonDialog
            open={dialog === 'return'}
            align="decision"
            idPrefix="ru-r"
            title={UPDATE_DECISION.returnTitle}
            effect={UPDATE_DECISION.returnEffect}
            cancelLabel={UPDATE_DECISION.cancel}
            confirmLabel={UPDATE_DECISION.return.title}
            busy={giveBack.busy}
            busyLabel={UPDATE_DECISION.returning}
            returnFocusFallback={decidedRef}
            onConfirm={sendReturn}
            onCancel={cancel}
          >
            <Field
              id={REASON_ID}
              label={UPDATE_DECISION.reasonLabel}
              error={reasonError ?? undefined}
            >
              <Textarea
                className="min-h-[104px]"
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setReasonError(null);
                }}
              />
            </Field>
            {sendFailed ? <UnavailableNotice /> : null}
          </ReasonDialog>
        </>
      ) : null}
    </>
  );
}

/** A decision that failed for now: the dialog stays open (state-copy `RV-04.unavailable`). */
function UnavailableNotice() {
  return (
    <Notice tone="err" role="alert">
      {stateWords('RV-04.unavailable')}
    </Notice>
  );
}

/**
 * “What changes · Changed fields only” — the shared comparison (B6-04 f0; CM-08, SA-11); once
 * released, with the version its release replaced, “Live before · Released” (state-copy
 * `RV-04.released`).
 */
function WhatChanges({ view }: { readonly view: UpdateForReviewView }) {
  return (
    <Section title={COMPARISON.whatChanges} meta={COMPARISON.changedOnly} headingId="ru-rw">
      <SectionBody className="flex flex-col gap-[14px]">
        {view.comparison.length === 0 ? (
          <p className="xr-body m-0 text-ink-2">{COMPARISON.nothingChanged}</p>
        ) : view.update.state === 'released' ? (
          <CorrectionComparison rows={view.comparison} columns={RELEASED_COLUMNS} />
        ) : (
          <CorrectionComparison rows={view.comparison} />
        )}
      </SectionBody>
    </Section>
  );
}

/** “About this experiment · Live · read-only” (`dl.xl-kv.xv-kv`; B6-04 f0). */
function AboutExperiment({
  view,
  course,
  outcomes,
}: {
  readonly view: UpdateForReviewView;
  readonly course: string | null;
  readonly outcomes: readonly string[];
}) {
  const { live } = view;
  const formats = inDisplayOrder(live.formats.map((entry) => entry.format));
  return (
    <Section title={REVIEW_UPDATE.aboutTitle} meta={REVIEW_UPDATE.aboutMeta} headingId="ru-rc">
      <SectionBody>
        <dl className="xl-kv xv-kv">
          <dt>{REVIEW_UPDATE.course}</dt>
          <dd>{course ?? ''}</dd>
          <dt>{REVIEW_UPDATE.formats}</dt>
          <dd>
            <span className="xv-chips">
              {formats.map((format) => (
                <FormatBadge key={format} format={FORMAT_META[format].code} compact />
              ))}
            </span>
          </dd>
          <dt>{REVIEW_UPDATE.liveVersion}</dt>
          <dd>{liveSinceWords(live.label, dayMonthYear(live.liveFrom))}</dd>
          <dt>{REVIEW_UPDATE.outcomes}</dt>
          <dd>
            <ul className="xv-los">
              {outcomes.map((outcome, index) => (
                <li key={index}>{outcome}</li>
              ))}
            </ul>
          </dd>
        </dl>
        <p className="xl-open [margin:12px_0_0]">
          <Icon name="info" size={16} />
          <span>{STRIPPED_UPDATE.openNote.words}</span>
        </p>
      </SectionBody>
    </Section>
  );
}
