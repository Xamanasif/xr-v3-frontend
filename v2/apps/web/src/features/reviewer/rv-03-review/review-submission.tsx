'use client';

import type { Result, ServiceError } from '@xr/contracts/draft';
import type { Submission } from '@xr/domain';
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
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { dateTime } from '@/copy/dates';
import {
  approveEffect,
  approveTitle,
  changedTitle,
  courseWords,
  DECISION_WORDS,
  headerMetaWords,
  OUTCOME_WORDS,
  overlineWords,
  recheckWhenWords,
  referenceOptions,
  REVIEW_PAGE,
  STRIPPED_REVIEW,
} from '@/copy/reviewer-review';
import { stateWords } from '@/copy/state-copy';
import { useAppNavigation } from '@/nav/navigation';
import {
  REVIEW_QUEUE_ADDRESS,
  REVIEW_QUEUE_TITLE,
  reviewSubmissionPlacement,
} from '@/nav/reviewer';
import { useSubmissionForReview } from '@/queries/production';
import {
  approveIssues,
  decisionIssues,
  editedOutcomeIssue,
  newOutcomeIssue,
  returnIssues,
  useReviewCourse,
} from '@/queries/production-review';
import { useCommand } from '@/queries/use-command';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage, useWorkspaceIdentity } from '../../shared/workspace-frame/shell-page';
import { OUTCOME_IDS, OutcomesEditor, OutcomesReadOnly } from './outcomes-editor';
import { type ReviewDraft, startingDraft, useReviewDraft } from './review-draft';
import {
  actorName,
  changedRows,
  chipOf,
  decidedPanelOf,
  deliveryCards,
  formatsOf,
  historyLines,
  isLive,
  previousReturnLine,
  showsChanges,
  type SubmissionForReview,
} from './review-view';

/** The page’s element ids (B6-03 `Rm-…`): the panel, its heading, error and button; the dialogs. */
const PANEL_ID = 'rv-decision';
const PANEL_TITLE_ID = 'rv-dp';
const PANEL_ERROR_ID = 'rv-derr';
const GO_ID = 'rv-rgo';
const DECIDED_ID = 'rv-dec';
const REASON_ID = 'rv-reason';

/** The course as the catalogue names it: its code and the “code · name” line (`null`: unlisted). */
interface CourseView {
  readonly code: string | null;
  readonly line: string | null;
}

/**
 * RV-03 Review a submission and RV-06 its decided read-only state — board B6-03 f0 … f5, B6-11
 * f0 … f3, B6-12 f1 — at `/reviewer/submissions/[submissionId]`.
 *
 * - **Read**: `ProductionService.getSubmissionForReview` — the submission, what the vendor changed
 *   since the revision before, the return that revision answers, the Content Manager’s re-check and
 *   whether it is decided — and the course as the public catalogue names it.
 * - **As B6-03 draws it** (AR-4; the panel beside the content from 860 px of content, under it
 *   below with “Go to decision”, OD-B6-10; `xg-static`): the back link, “SUB-0077 · New
 *   submission”, the name, the chip and “vendor · course”; a re-check’s reason first (f3); “What
 *   changed in revision n” with the previous return (f0); “Learning outcomes”, which the reviewer
 *   sets (LD-3: add, edit, move, delete, undo; “No learning outcomes yet”, f2); “Submission
 *   details”; “Formats and delivery”, read-only — WEB’s link opens in a new tab, a package’s
 *   details on demand (T-30: no device testing here); “Review history”, newest first.
 * - **Decide** (“Your decision”): Approve (the default) or Return to vendor, for the whole
 *   Experiment. Approve checks the working set first (at least one outcome, OD-B6-02; “Save or
 *   cancel the outcome you are editing first”), then DL-1 — “Approving does not publish it” —
 *   sends `approveSubmission` with the set. Return opens DL-2: a reason is required (checked on
 *   “Return to vendor”), references optional (step · format · field, OD-B5-10); it sends
 *   `returnSubmission` with the reason, the references and the set (OD-B6-04). Each carries the
 *   record’s revision from when the work began. Nothing publishes; nothing grants access.
 * - **Kept**: the working set, the choice and a reason stay in memory per session and record while
 *   the reviewer moves around the app (state-copy `RV-03.kept`).
 * - **Refusals**: stale → read again, the work kept, a calm warning (`RV-03.stale.*`); decided
 *   elsewhere → the decided state with `RV-03.moved-on`; failed for now → the dialog stays open
 *   (`RV-03.unavailable`); not found or not permitted → the in-shell not-found page.
 * - **Decided (RV-06, f4)**: the outcomes read-only and the panel: the status, when and by whom,
 *   the reason of a return, where it is now, and “Back to the review queue”.
 */
export function ReviewSubmission({ submissionId }: { readonly submissionId: string }) {
  const read = useSubmissionForReview(submissionId);
  const answer = read.data?.ok ? read.data.value : null;
  const courseId = answer?.submission.content.courseId ?? null;
  const course = useReviewCourse(courseId);
  // The top bar reads “Review queue” below 1024 px and the crumbs “Review queue / SUB-0077” from
  // 1024 px (B6-03 f0 … f5): the placement’s crumbs, with the queue as its title.
  useShellPage({
    ...reviewSubmissionPlacement(
      answer
        ? {
            id: answer.submission.id,
            name: answer.submission.content.name,
            decided: !isLive(answer),
          }
        : null,
    ),
    title: REVIEW_QUEUE_TITLE,
  });

  const courseView = useMemo((): CourseView => {
    if (!course.data?.ok) return { code: null, line: null };
    const card = course.data.value.course;
    return { code: card.platformCode, line: courseWords(card.platformCode, card.name) };
  }, [course.data]);

  const coursePending = courseId !== null && course.isPending;
  const ready = answer !== null && !coursePending;
  return (
    <PageContent wrap="wide">
      {ready ? null : <BareHeader />}
      <RecordGuard
        read={{
          data: coursePending ? undefined : read.data,
          isPending: read.isPending || coursePending,
          isError: read.isError,
          refetch: () => void read.refetch(),
        }}
        loadingLabel={stateWords('RV-03.loading')}
        failed={{ title: stateWords('RV-03.failed'), line: stateWords('RV-03.failed.line') }}
      >
        {(value) => (
          <Review
            key={value.submission.id}
            answer={value}
            course={courseView}
            onReread={() => void read.refetch()}
          />
        )}
      </RecordGuard>
    </PageContent>
  );
}

/** Before the submission is read (or when it can’t be): the back link and the page’s heading. */
function BareHeader() {
  return (
    <PageHeader
      className="[margin:8px_0_16px]"
      back={<BackLink href={REVIEW_QUEUE_ADDRESS}>{REVIEW_QUEUE_TITLE}</BackLink>}
      title={stateWords('RV-03.heading')}
    />
  );
}

/** What the panel says after a refused or failed decision. */
type PanelNotice = 'stale' | 'moved-on' | null;

/** The open dialog: DL-1 Approve or DL-2 Return to vendor. */
type Dialog = 'approve' | 'return' | null;

function Review({
  answer,
  course,
  onReread,
}: {
  readonly answer: SubmissionForReview;
  readonly course: CourseView;
  readonly onReread: () => void;
}) {
  const navigation = useAppNavigation();
  const { personId } = useWorkspaceIdentity();
  const { submission } = answer;
  const live = isLive(answer);
  const recheck =
    live &&
    submission.status.state === 'with-academic-reviewer' &&
    submission.status.reason === 'recheck' &&
    answer.recheck !== null;
  const chip = chipOf(submission);

  const handle = useReviewDraft(submission.id);
  const start = useMemo(() => startingDraft(submission), [submission]);
  const draft: ReviewDraft = live ? (handle.kept ?? start) : start;
  const update = (change: (current: ReviewDraft) => ReviewDraft) => handle.update(start, change);

  const [message, setMessage] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ readonly text: string; readonly index: number } | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [notice, setNotice] = useState<PanelNotice>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [sendFailed, setSendFailed] = useState(false);
  const [gone, setGone] = useState(false);
  const [focusRequest, setFocusRequest] = useState<{ readonly id: string; readonly n: number }>({
    id: '',
    n: 0,
  });
  const decidedFocus = useRef(false);
  const decidedRef = useRef<HTMLDivElement>(null);

  const approve = useCommand((ports) => ports.production.approveSubmission);
  const giveBack = useCommand((ports) => ports.production.returnSubmission);

  // Focus moves as B6-03’s script moves it (`focus(pid + …)`), once the element is on show.
  useEffect(() => {
    if (focusRequest.n === 0) return;
    document.getElementById(focusRequest.id)?.focus();
  }, [focusRequest]);
  const focusOn = (id: string) => setFocusRequest((current) => ({ id, n: current.n + 1 }));

  // Decided here: focus moves to the decided panel (`focus(pid + '-dec')`).
  useEffect(() => {
    if (live || !decidedFocus.current) return;
    decidedFocus.current = false;
    decidedRef.current?.focus();
  });

  // Decided (here or elsewhere): the work kept for it has nothing more to do (`RV-03.kept`).
  const drop = handle.drop;
  useEffect(() => {
    if (!live) drop();
  }, [live, drop]);

  if (gone) return navigation.notFound();

  // ---- the outcomes (B6-03 script `move`, `del`, `saveEd`, `addLo`, `undo`) ----
  const say = (words: string | null, undoable: { text: string; index: number } | null = null) => {
    setMessage(words);
    setUndo(undoable);
  };
  const move = (index: number, by: -1 | 1) => {
    const to = index + by;
    if (draft.editing !== null || to < 0 || to >= draft.outcomes.length) return;
    update((current) => {
      const outcomes = [...current.outcomes];
      [outcomes[index], outcomes[to]] = [outcomes[to]!, outcomes[index]!];
      return { ...current, outcomes };
    });
    say(OUTCOME_WORDS.moved(index + 1, by < 0, to + 1));
    focusOn(by < 0 ? OUTCOME_IDS.up(to) : OUTCOME_IDS.down(to));
  };
  const remove = (index: number) => {
    if (draft.editing !== null) return;
    const text = draft.outcomes[index]!;
    update((current) => ({
      ...current,
      outcomes: current.outcomes.filter((_, at) => at !== index),
    }));
    say(OUTCOME_WORDS.deleted(index + 1), { text, index });
    focusOn(OUTCOME_IDS.message);
  };
  const restore = () => {
    if (!undo) return;
    update((current) => {
      const outcomes = [...current.outcomes];
      outcomes.splice(undo.index, 0, undo.text);
      return { ...current, outcomes };
    });
    say(OUTCOME_WORDS.restored(undo.index + 1));
    focusOn(OUTCOME_IDS.editButton(undo.index));
  };
  const edit = (index: number) => {
    if (draft.editing !== null) return;
    update((current) => ({ ...current, editing: { index, text: current.outcomes[index]! } }));
    setEditError(null);
    say(null);
    focusOn(OUTCOME_IDS.editField(index));
  };
  const saveEdit = () => {
    const editing = draft.editing;
    if (!editing) return;
    const issue = editedOutcomeIssue(editing.text);
    if (issue) {
      setEditError(issue);
      focusOn(OUTCOME_IDS.editField(editing.index));
      return;
    }
    update((current) => ({
      ...current,
      outcomes: current.outcomes.map((text, at) =>
        at === editing.index ? editing.text.trim() : text,
      ),
      editing: null,
    }));
    setEditError(null);
    say(OUTCOME_WORDS.saved(editing.index + 1));
    focusOn(OUTCOME_IDS.editButton(editing.index));
  };
  const cancelEdit = () => {
    const editing = draft.editing;
    if (!editing) return;
    update((current) => ({ ...current, editing: null }));
    setEditError(null);
    focusOn(OUTCOME_IDS.editButton(editing.index));
  };
  const add = () => {
    const issue = newOutcomeIssue(draft.newOutcome);
    if (issue) {
      setAddError(issue);
      focusOn(OUTCOME_IDS.add);
      return;
    }
    const count = draft.outcomes.length + 1;
    update((current) => ({
      ...current,
      outcomes: [...current.outcomes, current.newOutcome.trim()],
      newOutcome: '',
    }));
    setAddError(null);
    setPanelError(null);
    say(OUTCOME_WORDS.added(count));
    focusOn(OUTCOME_IDS.add);
  };

  // ---- the decision (B6-03 script `rvGo`, `doApprove`, `doReturn`) ----
  const expectedRev = draft.basis ?? submission.rev;
  const options = referenceOptions(formatsOf(submission));
  const references = options
    .filter((option) => draft.references.includes(option.key))
    .map(({ step, format, field }) => ({ step, format, field }));

  const go = () => {
    setNotice(null);
    if (draft.editing !== null) {
      setPanelError(DECISION_WORDS.editingFirst);
      focusOn(PANEL_ERROR_ID);
      return;
    }
    if (draft.choice === 'approve') {
      const issues = approveIssues({ id: submission.id, outcomes: draft.outcomes, expectedRev });
      if (issues?.outcomes) {
        setPanelError(issues.outcomes);
        focusOn(PANEL_ERROR_ID);
        return;
      }
    }
    setPanelError(null);
    setReasonError(null);
    setSendFailed(false);
    setDialog(draft.choice);
  };

  const cancel = () => {
    if (dialog === 'return') update((current) => ({ ...current, reason: '', references: [] }));
    setDialog(null);
    setSendFailed(false);
    setReasonError(null);
  };

  /** What an answer to a decision means for the page (refusals are values, ADR-0008). */
  const answered = (result: Result<unknown, ServiceError>) => {
    if (result.ok) {
      setDialog(null);
      decidedFocus.current = true;
      drop();
      return;
    }
    const error = result.error;
    if (error.kind === 'validation-failed') {
      const issues = decisionIssues(error);
      if (issues.reason && dialog === 'return') {
        setReasonError(issues.reason);
        return;
      }
      setDialog(null);
      setPanelError(issues.outcomes ?? issues.reason);
      focusOn(PANEL_ERROR_ID);
      return;
    }
    if (error.kind === 'not-found' || error.kind === 'not-permitted') {
      setGone(true);
      return;
    }
    // Stale, moved on (decided elsewhere) or refused: nothing was written. The record is read
    // again; the work stays and the next attempt is sent on the record as now shown.
    setDialog(null);
    update((current) => ({ ...current, basis: null }));
    setNotice(error.kind === 'invalid-state' ? 'moved-on' : 'stale');
    onReread();
    focusOn(PANEL_TITLE_ID);
  };

  const failed = () => setSendFailed(true);

  const sendApprove = () => {
    setSendFailed(false);
    approve
      .run({ id: submission.id, outcomes: [...draft.outcomes], expectedRev })
      .then(answered, failed);
  };

  const sendReturn = () => {
    setSendFailed(false);
    const input = {
      id: submission.id,
      reason: draft.reason,
      references,
      outcomes: [...draft.outcomes],
      expectedRev,
    };
    const issues = returnIssues(input);
    if (issues?.reason) {
      setReasonError(issues.reason);
      return;
    }
    giveBack.run(input).then(answered, failed);
  };

  // ---- the panel ----
  let panel: ReactNode;
  if (live) {
    panel = (
      <>
        {notice !== null ? <StaleNotice /> : null}
        {panelError !== null ? (
          <Notice tone="err" title={panelError} id={PANEL_ERROR_ID} tabIndex={-1} />
        ) : null}
        <RadioGroup
          legend={DECISION_WORDS.legend}
          legendClass="xr-sr"
          value={draft.choice}
          onValueChange={(value) => {
            update((current) => ({
              ...current,
              choice: value === 'return' ? 'return' : 'approve',
            }));
            setPanelError(null);
          }}
        >
          <ChoiceList>
            <ChoiceCard
              value="approve"
              id="rv-ca"
              title={DECISION_WORDS.approve.title}
              sub={DECISION_WORDS.approve.sub}
            />
            <ChoiceCard
              value="return"
              id="rv-cr"
              title={DECISION_WORDS.return.title}
              sub={DECISION_WORDS.return.sub}
            />
          </ChoiceList>
        </RadioGroup>
        <p className="xr-hint m-0">{DECISION_WORDS.wholeExperiment}</p>
        <Button id={GO_ID} variant="primary" block onClick={go}>
          {draft.choice === 'approve' ? DECISION_WORDS.approve.title : DECISION_WORDS.return.title}
        </Button>
      </>
    );
  } else {
    const decided = decidedPanelOf(submission);
    panel = (
      <div id={DECIDED_ID} ref={decidedRef} tabIndex={-1} className="flex flex-col gap-3">
        {notice === 'moved-on' ? (
          <Notice tone="info" role="status">
            {stateWords('RV-03.moved-on')}
          </Notice>
        ) : null}
        {/* B6-03 f4 draws the chip across the panel (the board loads no xr-admin.css, whose
            `.xr-dpanel .xr-status{align-self:flex-start}` the product carries). */}
        <StatusPill tone={decided.tone} className="self-stretch">
          {decided.title}
        </StatusPill>
        {decided.when ? <p className="xr-small m-0 text-ink-2">{decided.when}</p> : null}
        {decided.reason ? <p className="xr-small m-0">{decided.reason}</p> : null}
        {decided.next ? <p className="xr-body m-0 text-ink">{decided.next}</p> : null}
        <Link className="xr-btn xr-btn--secondary xr-btn--block" href={REVIEW_QUEUE_ADDRESS}>
          {DECISION_WORDS.backToQueue}
        </Link>
      </div>
    );
  }

  const decidedOutcomes = live
    ? draft.outcomes
    : submission.learningOutcomes.map((outcome) => outcome.text);
  const courseLine = course.line;

  return (
    <>
      <PageHeader
        className="[margin:8px_0_16px]"
        back={<BackLink href={REVIEW_QUEUE_ADDRESS}>{REVIEW_QUEUE_TITLE}</BackLink>}
        overline={overlineWords(submission.id, recheck)}
        title={submission.content.name}
        titleId="rv-h"
        titleFocusTarget
        meta={
          <>
            <StatusPill tone={chip.tone}>{chip.words}</StatusPill>
            <span>{headerMetaWords(submission.vendorOrganisation, courseLine)}</span>
          </>
        }
      />
      <JumpLink targetId={PANEL_ID} className="mb-4" />
      <DecisionLayout
        jump={false}
        panel={{
          id: PANEL_ID,
          title: DECISION_WORDS.panelTitle,
          titleId: PANEL_TITLE_ID,
          titleFocusTarget: true,
          position: 'static',
          children: panel,
        }}
      >
        {recheck && answer.recheck ? <RecheckReason recheck={answer.recheck} /> : null}
        {showsChanges(answer) ? (
          <WhatChanged answer={answer} previous={previousReturnLine(answer, personId)} />
        ) : null}
        <Section
          title={REVIEW_PAGE.outcomesTitle}
          meta={REVIEW_PAGE.outcomesMeta}
          headingId="rv-lo"
        >
          <SectionBody className="flex flex-col gap-[14px]">
            {live ? (
              <OutcomesEditor
                draft={draft}
                message={message}
                canUndo={undo !== null}
                addError={addError}
                editError={editError}
                onMove={move}
                onEdit={edit}
                onEditText={(text) =>
                  update((current) =>
                    current.editing
                      ? { ...current, editing: { ...current.editing, text } }
                      : current,
                  )
                }
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onDelete={remove}
                onUndo={restore}
                onNewText={(text) => {
                  update((current) => ({ ...current, newOutcome: text }));
                  setAddError(null);
                }}
                onAdd={add}
              />
            ) : (
              <OutcomesReadOnly outcomes={decidedOutcomes} />
            )}
          </SectionBody>
        </Section>
        <SubmissionDetails submission={submission} course={courseLine} />
        <Delivery answer={answer} />
        <Section title={REVIEW_PAGE.historyTitle} meta={REVIEW_PAGE.historyMeta} headingId="rv-hh">
          <SectionBody>
            <Timeline markLatest={false} events={historyLines(answer, course.code)} />
          </SectionBody>
        </Section>
      </DecisionLayout>
      {live ? (
        <>
          <ConfirmDialog
            open={dialog === 'approve'}
            align="decision"
            idPrefix="rv-a"
            title={approveTitle(submission.content.name)}
            effect={<strong>{approveEffect(draft.outcomes.length)}</strong>}
            notice={sendFailed ? <UnavailableNotice /> : undefined}
            cancelLabel={DECISION_WORDS.cancel}
            confirmLabel={DECISION_WORDS.approve.title}
            busy={approve.busy}
            busyLabel={DECISION_WORDS.approving}
            returnFocusFallback={decidedRef}
            onConfirm={sendApprove}
            onCancel={cancel}
          />
          <ReasonDialog
            open={dialog === 'return'}
            align="decision"
            idPrefix="rv-r"
            title={DECISION_WORDS.returnTitle}
            effect={DECISION_WORDS.returnEffect}
            cancelLabel={DECISION_WORDS.cancel}
            confirmLabel={DECISION_WORDS.return.title}
            busy={giveBack.busy}
            busyLabel={DECISION_WORDS.returning}
            returnFocusFallback={decidedRef}
            onConfirm={sendReturn}
            onCancel={cancel}
          >
            <Field
              id={REASON_ID}
              label={DECISION_WORDS.reasonLabel}
              error={reasonError ?? undefined}
            >
              <Textarea
                className="min-h-[104px]"
                value={draft.reason}
                onChange={(event) => {
                  const reason = event.target.value;
                  update((current) => ({ ...current, reason }));
                  setReasonError(null);
                }}
              />
            </Field>
            <div className="h-[14px]" />
            <CheckboxGroup
              legend={DECISION_WORDS.refsLegend}
              legendClass="xr-label"
              marker={DECISION_WORDS.optional}
              hint={DECISION_WORDS.refsHint}
              hintClassName="block mb-[6px]"
            >
              <div className="xg-refgrid">
                {options.map((option) => (
                  <Checkbox
                    key={option.key}
                    id={`rv-ref-${option.key.replace(':', '-')}`}
                    checked={draft.references.includes(option.key)}
                    onChange={() =>
                      update((current) => ({
                        ...current,
                        references: current.references.includes(option.key)
                          ? current.references.filter((key) => key !== option.key)
                          : [...current.references, option.key],
                      }))
                    }
                  >
                    <span>{option.words}</span>
                  </Checkbox>
                ))}
              </div>
            </CheckboxGroup>
            {sendFailed ? <UnavailableNotice /> : null}
          </ReasonDialog>
        </>
      ) : null}
    </>
  );
}

/** The panel’s warning after a stale or refused decision (state-copy `RV-03.stale.*`). */
function StaleNotice() {
  return (
    <Notice tone="warn" role="alert" title={stateWords('RV-03.stale.title')}>
      {stateWords('RV-03.stale.line')}
    </Notice>
  );
}

/** A decision that failed for now: the dialog stays open (state-copy `RV-03.unavailable`). */
function UnavailableNotice() {
  return (
    <Notice tone="err" role="alert">
      {stateWords('RV-03.unavailable')}
    </Notice>
  );
}

/** f3: the Content Manager’s reason, first on the page (`section.xv-reason`). */
function RecheckReason({
  recheck,
}: {
  readonly recheck: NonNullable<SubmissionForReview['recheck']>;
}) {
  const reason = recheck.kind === 'publish' ? '' : recheck.reason;
  return (
    <section className="xv-reason" aria-labelledby="rv-rc">
      <div className="xv-reason-head">
        <Icon name="quote" />
        <div>
          <h2 className="xr-h3 m-0" id="rv-rc">
            {REVIEW_PAGE.recheckTitle}
          </h2>
          <span className="xr-meta">
            {recheckWhenWords(dateTime(recheck.at), actorName(recheck.by))}
          </span>
        </div>
      </div>
      <blockquote className="xv-quote">{reason}</blockquote>
      <p className="xl-meta m-0">{REVIEW_PAGE.recheckLine}</p>
    </section>
  );
}

/** f0: “What changed in revision n” — only what the vendor changed — with the return it answers. */
function WhatChanged({
  answer,
  previous,
}: {
  readonly answer: SubmissionForReview;
  readonly previous: string | null;
}) {
  return (
    <Section
      className="xg-changed"
      title={changedTitle(answer.submission.revision)}
      meta={REVIEW_PAGE.changedMeta}
      headingId="rv-cg"
    >
      <SectionBody className="flex flex-col gap-3">
        {previous ? <p className="xl-meta m-0">{previous}</p> : null}
        <ul className="xg-chg">
          {changedRows(answer).map((row) => (
            <li key={row.key} className="xg-chg-row">
              <span className="xg-chg-f">{row.field}</span>
              <dl className="xg-chg-dl">
                <dt>{REVIEW_PAGE.was}</dt>
                <dd>{row.was}</dd>
                <dt>{REVIEW_PAGE.now}</dt>
                <dd>
                  <strong>{row.now}</strong>
                </dd>
              </dl>
            </li>
          ))}
        </ul>
      </SectionBody>
    </Section>
  );
}

/** “Submission details” — from the vendor (`dl.xl-kv.xv-kv`). */
function SubmissionDetails({
  submission,
  course,
}: {
  readonly submission: Submission;
  readonly course: string | null;
}) {
  const { content } = submission;
  const formats = formatsOf(submission);
  const documents = content.documents.map((document) => document.fileName);
  return (
    <Section title={REVIEW_PAGE.detailsTitle} meta={REVIEW_PAGE.detailsMeta} headingId="rv-sd">
      <SectionBody>
        <dl className="xl-kv xv-kv">
          <dt>{REVIEW_PAGE.course}</dt>
          <dd>{course ?? REVIEW_PAGE.noValue}</dd>
          <dt>{REVIEW_PAGE.summary}</dt>
          <dd>{content.summary?.trim() || REVIEW_PAGE.noValue}</dd>
          <dt>{REVIEW_PAGE.description}</dt>
          <dd>{content.description?.trim() || REVIEW_PAGE.noValue}</dd>
          <dt>{REVIEW_PAGE.version}</dt>
          <dd>{content.version?.trim() || REVIEW_PAGE.noValue}</dd>
          <dt>{REVIEW_PAGE.formats}</dt>
          <dd>
            <span className="xv-chips">
              {formats.map((format) => (
                <FormatBadge key={format} format={formatCode(format)} compact />
              ))}
            </span>
          </dd>
          <dt>{REVIEW_PAGE.preview}</dt>
          <dd>{content.preview.label?.trim() || REVIEW_PAGE.none}</dd>
          <dt>{REVIEW_PAGE.documents}</dt>
          <dd>{documents.length > 0 ? documents.join(' · ') : REVIEW_PAGE.none}</dd>
        </dl>
      </SectionBody>
    </Section>
  );
}

function formatCode(format: Submission['content']['formats'][number]) {
  return format.toUpperCase() as 'WEB' | 'AR' | 'VR' | 'MR';
}

/** “Formats and delivery” — read-only: what the reviewer sees is delivery details and web links. */
function Delivery({ answer }: { readonly answer: SubmissionForReview }) {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const toggle = (format: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(format)) next.delete(format);
      else next.add(format);
      return next;
    });
  return (
    <Section title={REVIEW_PAGE.deliveryTitle} meta={REVIEW_PAGE.deliveryMeta} headingId="rv-fd">
      <SectionBody className="flex flex-col gap-3">
        {deliveryCards(answer).map((card) => (
          <div key={card.format} className="xv-deliv">
            <div className="xv-deliv-head">
              <FormatBadge format={formatCode(card.format)} compact />
              <span className="font-[700]">
                {card.kind === 'web' ? REVIEW_PAGE.webTitle : STRIPPED_REVIEW.packageTitle.words}
              </span>
            </div>
            {card.kind === 'web' ? (
              <>
                <dl className="xl-kv xv-kv">
                  <dt>{REVIEW_PAGE.webLink}</dt>
                  <dd className="[overflow-wrap:anywhere]">{card.link ?? REVIEW_PAGE.noValue}</dd>
                  <dt>{REVIEW_PAGE.browser}</dt>
                  <dd>{card.browser || REVIEW_PAGE.noValue}</dd>
                </dl>
                {card.link ? (
                  <div>
                    <a
                      className="xr-btn xr-btn--secondary xr-btn--sm"
                      href={card.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon name="externalLink" />
                      {REVIEW_PAGE.openWebLink}
                      <span className="xr-sr">{REVIEW_PAGE.newTab}</span>
                    </a>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <dl className="xl-kv xv-kv">
                  <dt>{REVIEW_PAGE.package}</dt>
                  <dd>{card.label || REVIEW_PAGE.noValue}</dd>
                  <dt>{REVIEW_PAGE.deviceNeeded}</dt>
                  <dd>
                    {card.device || REVIEW_PAGE.noValue}
                    {card.deviceChanged ? (
                      <>
                        {' '}
                        <span className="xw-tag xw-tag--warn">{REVIEW_PAGE.changed}</span>
                      </>
                    ) : null}
                  </dd>
                </dl>
                <div>
                  <Button
                    variant="text"
                    className="[padding-left:0]"
                    icon="chevronDown"
                    aria-expanded={open.has(card.format)}
                    aria-controls={`rv-pkg-${card.format}`}
                    onClick={() => toggle(card.format)}
                  >
                    {open.has(card.format) ? REVIEW_PAGE.hidePackage : REVIEW_PAGE.viewPackage}
                  </Button>
                </div>
                {open.has(card.format) ? (
                  <dl className="xl-kv xv-kv" id={`rv-pkg-${card.format}`}>
                    <dt>{REVIEW_PAGE.packageReference}</dt>
                    <dd>
                      {card.reference ??
                        (card.fileName
                          ? `${card.fileName}${REVIEW_PAGE.fileSuffix}`
                          : REVIEW_PAGE.noValue)}
                    </dd>
                    <dt>{REVIEW_PAGE.installNotes}</dt>
                    <dd>{card.installNotes || REVIEW_PAGE.noValue}</dd>
                  </dl>
                ) : null}
              </>
            )}
          </div>
        ))}
        <p className="xl-open m-0">
          <Icon name="info" />
          <span>{STRIPPED_REVIEW.deliveryOnly.words}</span>
        </p>
      </SectionBody>
    </Section>
  );
}
