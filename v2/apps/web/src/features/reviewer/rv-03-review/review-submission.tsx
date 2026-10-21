'use client';

import type { Result, ServiceError } from '@xr/contracts/draft';
import { BackLink, PageHeader } from '@xr/ui';
import {
  Breadcrumbs,
  ButtonLink,
  ChoiceGroup,
  ConfirmDialog,
  DecisionPanel,
  ErrorSummary,
  type ErrorSummaryItem,
  Field,
  FieldError,
  GoButton,
  Notice,
  PendingHint,
  RecordLine,
  RvBandHead,
  RvBlock,
  RvBlockHead,
  RvChangedTag,
  RvChangeSet,
  RvComparison,
  RvCourse,
  RvDecisionOutcome,
  RvDeliveryCard,
  RvDeliveryCards,
  RvDetail,
  RvExternalLink,
  type RvFact,
  type RvFileCard,
  RvFileCards,
  RvFootnote,
  RvFormatLine,
  RvHistory,
  RvIdCard,
  RvKindTag,
  RvOutcomesBlock,
  RvOutcomesEditor,
  RvOutcomesReadOnly,
  type RvPageLink,
  RvPath,
  RvProse,
  RvQuote,
  type RvReadyItem,
  RvReadyList,
  type RvReferenceGroup,
  RvReferenceGroups,
  RvRefusal,
  RvRequirement,
  RvStatus,
  Textarea,
  Timeline,
  V46Island,
} from '@xr/ui/v3';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { dateTime } from '@/copy/dates';
import {
  approveGoes,
  APPROVE_DIALOG,
  approveTitle,
  BUSY_WORDS,
  changedInRevision,
  changedTitle,
  DECISION_WORDS,
  FORMAT_TITLES,
  IDENTITY_WORDS,
  inThisSubmissionWords,
  notIncludedWords,
  OUTCOME_WORDS,
  PAGE_MAP,
  PATH_WORDS,
  previousReturnBy,
  quoted,
  READY_WORDS,
  readyChanges,
  readyOutcomes,
  readyWhole,
  recheckByWords,
  referenceOptions,
  REVIEW_PAGE,
  revisionFact,
} from '@/copy/reviewer-review';
import {
  formatsFact,
  fromSender,
  RV_APPROVE_DIALOG,
  RV_FACT_TERMS,
  RV_ITEM,
  RV_REFUSAL,
  waitingFact,
} from '@/copy/rv-shared';
import { stateWords } from '@/copy/state-copy';
import { useAppNavigation } from '@/nav/navigation';
import {
  REVIEW_QUEUE_ADDRESS,
  REVIEW_QUEUE_TITLE,
  reviewerParentCrumb,
  type ReviewerParent,
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
import { submissionKind } from '../shared/kind';
import { rvBackOf, useRvParent } from '../shared/parent';
import { useRvToday, useRvTodayLine, waitingAge } from '../shared/waiting';
import { type ReviewChoice, type ReviewDraft, startingDraft, useReviewDraft } from './review-draft';
import {
  actorName,
  changedRows,
  decidedView,
  deliveryCards,
  formatCode,
  formatsOf,
  historyLines,
  isLive,
  isRecheck,
  lastDecision,
  previousReturnOf,
  resubmittedDay,
  showsChanges,
  statusOf,
  type SubmissionForReview,
} from './review-view';

/** The export's ids (RV-v1 `RV.dc.html` item view). */
const IDS = {
  title: 'rv-title',
  panel: 'rv-panel',
  panelTitle: 'rv-panel-h',
  refusal: 'rv-refusal',
  errors: 'rv-errs',
  choice: 'rv-choice',
  /** "Whole Experiment." in Before you decide: it describes each decision (RV-v1 `aria-describedby`). */
  whole: 'rv-whole',
  reason: 'rv-reason',
  go: 'rv-go',
  done: 'rv-done',
  recheck: 'rv-s-recheck',
  changed: 'rv-s-chg',
  outcomes: 'rv-s-lo',
  details: 'rv-s-det',
  delivery: 'rv-s-del',
  history: 'rv-s-hist',
  outcomeMessage: 'rv-lo-msg',
  addOutcome: 'rv-lo-new',
  editButton: (index: number) => `rv-lo-${index}-ed`,
  editField: (index: number) => `rv-lo-ta-${index}`,
  up: (index: number) => `rv-lo-${index}-up`,
  down: (index: number) => `rv-lo-${index}-dn`,
} as const;

/** The course as the catalogue names it: its code and name (`null`: unlisted). */
interface CourseView {
  readonly code: string | null;
  readonly name: string | null;
}

/**
 * RV-03 Review a submission and RV-06 its decided read-only state — the owner-approved Academic
 * Reviewer export (V3 Refined B, design/v3-refined-b/roles/RV-v1, `RV.dc.html` item view; boards
 * RV03, RV03-outcomes, -recheck, -editing, -return-errors, -return-filled, -confirm, -approved,
 * -returned, RV06, RV06-returned, RV06-elsewhere), at `/reviewer/submissions/[submissionId]`.
 *
 * - **Read**: `ProductionService.getSubmissionForReview` — the submission, what the vendor changed
 *   since the revision before, the return that revision answers, the Content Manager's re-check
 *   and whether it is decided — and the course as the public catalogue names it. Loading and a
 *   failed read keep the application's existing page states.
 * - **As the export draws it**: the date, the breadcrumb (the parent list, then the experiment's
 *   name — never a record reference), the identity card (type tag, name, summary, status, course,
 *   sender; facts; the page map), then the blocks in three weights — why it is here (the re-check
 *   request, or what changed in revision n with the earlier reason), the reviewer's work (the
 *   learning outcomes, LD-3), the vendor's reference (description and documents, formats and
 *   delivery) — the decision panel and the history.
 * - **Decide**: no decision is chosen at first. "Before you decide", the error summary, Approve
 *   (sends it to the Content Manager with its outcomes; at least one, OD-B6-02) or Return to vendor
 *   (a reason, required, and the fields it refers to, grouped by the vendor editor's sections,
 *   OD-B5-10 — completed in the panel), the one gold button and "What happens next". Approve opens
 *   the confirmation; Return sends at once. Each carries the record's revision from when the work
 *   began and is protected against a repeated press. Nothing publishes; nothing grants access.
 * - **Kept**: the working set, the choice and a reason stay in memory per session and record while
 *   the reviewer moves around the app (state-copy `RV-03.kept`).
 * - **Refusals**: stale → read again, the work kept, "Nothing was recorded" (`RV-03.stale.line`);
 *   decided elsewhere → the decided state with "Nothing new was recorded" (`RV-03.moved-on.line`);
 *   failed for now → the confirmation stays open, or the panel says so (`RV-03.unavailable`); not
 *   found or not permitted → the in-shell not-found page (`RV-03.not-yours`).
 * - **Decided (RV-06)**: the outcomes read-only and the outcome block — the status, when and by
 *   whom, the reason and references of a return, where it stands, what happens next and the way
 *   back to the parent list.
 */
export function ReviewSubmission({ submissionId }: { readonly submissionId: string }) {
  const read = useSubmissionForReview(submissionId);
  const answer = read.data?.ok ? read.data.value : null;
  const courseId = answer?.submission.content.courseId ?? null;
  const course = useReviewCourse(courseId);
  const parent = useRvParent(submissionId, answer ? isLive(answer) : null);
  useShellPage(
    reviewSubmissionPlacement(
      answer ? { name: answer.submission.content.name, decided: !isLive(answer), parent } : null,
    ),
  );

  const courseView = useMemo((): CourseView => {
    if (!course.data?.ok) return { code: null, name: null };
    const card = course.data.value.course;
    return { code: card.platformCode, name: card.name };
  }, [course.data]);

  const coursePending = courseId !== null && course.isPending;
  const ready = answer !== null && !coursePending;
  const guard = (
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
          parent={parent ?? 'queue'}
          onReread={() => void read.refetch()}
        />
      )}
    </RecordGuard>
  );
  // The application's existing loading and failed states keep their look (RV-v1 draws none for
  // the item page), under the page's heading.
  return ready ? (
    guard
  ) : (
    <V46Island>
      <PageHeader
        className="[margin:8px_0_16px]"
        back={<BackLink href={REVIEW_QUEUE_ADDRESS}>{REVIEW_QUEUE_TITLE}</BackLink>}
        title={stateWords('RV-03.heading')}
      />
      {guard}
    </V46Island>
  );
}

/** A refused decision: stale (read again, the work kept) or decided elsewhere. */
type Refusal = 'stale' | 'moved-on' | null;

interface DecisionErrors {
  readonly editing?: string;
  readonly choice?: string;
  readonly outcomes?: string;
  readonly reason?: string;
}

function Review({
  answer,
  course,
  parent,
  onReread,
}: {
  readonly answer: SubmissionForReview;
  readonly course: CourseView;
  readonly parent: ReviewerParent;
  readonly onReread: () => void;
}) {
  const navigation = useAppNavigation();
  const { personId } = useWorkspaceIdentity();
  const today = useRvToday();
  const todayLine = useRvTodayLine();
  const { submission } = answer;
  const live = isLive(answer);
  const recheck = isRecheck(answer);
  const formats = formatsOf(submission);
  const codes = formats.map(formatCode);

  const handle = useReviewDraft(submission.id);
  const start = useMemo(() => startingDraft(submission), [submission]);
  const draft: ReviewDraft = live ? (handle.kept ?? start) : start;
  const update = (change: (current: ReviewDraft) => ReviewDraft) => handle.update(start, change);

  const [message, setMessage] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ readonly text: string; readonly index: number } | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [errors, setErrors] = useState<DecisionErrors>({});
  const [refusal, setRefusal] = useState<Refusal>(null);
  const [dialog, setDialog] = useState(false);
  const [approveFailed, setApproveFailed] = useState(false);
  const [returnFailed, setReturnFailed] = useState(false);
  const [decidedHere, setDecidedHere] = useState(false);
  const [gone, setGone] = useState(false);
  const [focusRequest, setFocusRequest] = useState<{ readonly id: string; readonly n: number }>({
    id: '',
    n: 0,
  });
  const [summaryFocus, setSummaryFocus] = useState(0);
  const decidedFocus = useRef(false);
  const decidedRef = useRef<HTMLDivElement>(null);
  const panelTitleRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const approve = useCommand((ports) => ports.production.approveSubmission);
  const giveBack = useCommand((ports) => ports.production.returnSubmission);

  // Focus moves as the export's script moves it (`focusId(…)`), once the element is on show.
  useEffect(() => {
    if (focusRequest.n === 0) return;
    document.getElementById(focusRequest.id)?.focus();
  }, [focusRequest]);
  const focusOn = (id: string) => setFocusRequest((current) => ({ id, n: current.n + 1 }));

  // A refused press while the summary is already shown: focus it again.
  useEffect(() => {
    if (summaryFocus > 0) summaryRef.current?.focus();
  }, [summaryFocus]);

  // Decided here: focus moves to the outcome (`focusId('rv-done')`).
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

  const clearError = (key: keyof DecisionErrors) =>
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });

  // ---- the outcomes (the export's `up`, `dn`, `edit`, `del`, `save`, `cancel`, `addLo`, `loUndo`) ----
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
    // Focus stays with the same move on the item's new place; at an end, where that move is
    // disabled, it goes to the other one.
    const last = draft.outcomes.length - 1;
    if (by < 0) focusOn(to === 0 ? IDS.down(to) : IDS.up(to));
    else focusOn(to === last ? IDS.up(to) : IDS.down(to));
  };
  const remove = (index: number) => {
    if (draft.editing !== null) return;
    const text = draft.outcomes[index]!;
    update((current) => ({
      ...current,
      outcomes: current.outcomes.filter((_, at) => at !== index),
    }));
    say(OUTCOME_WORDS.deleted(index + 1), { text, index });
    focusOn(IDS.outcomeMessage);
  };
  const restore = () => {
    if (!undo) return;
    update((current) => {
      const outcomes = [...current.outcomes];
      outcomes.splice(undo.index, 0, undo.text);
      return { ...current, outcomes };
    });
    say(OUTCOME_WORDS.restored(undo.index + 1));
    focusOn(IDS.editButton(undo.index));
  };
  const edit = (index: number) => {
    if (draft.editing !== null) return;
    update((current) => ({ ...current, editing: { index, text: current.outcomes[index]! } }));
    setEditError(null);
    say(null);
    focusOn(IDS.editField(index));
  };
  const saveEdit = () => {
    const editing = draft.editing;
    if (!editing) return;
    const issue = editedOutcomeIssue(editing.text);
    if (issue) {
      setEditError(issue);
      focusOn(IDS.editField(editing.index));
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
    clearError('editing');
    say(OUTCOME_WORDS.saved(editing.index + 1));
    focusOn(IDS.editButton(editing.index));
  };
  const cancelEdit = () => {
    const editing = draft.editing;
    if (!editing) return;
    update((current) => ({ ...current, editing: null }));
    setEditError(null);
    clearError('editing');
    focusOn(IDS.editButton(editing.index));
  };
  const add = () => {
    const issue = newOutcomeIssue(draft.newOutcome);
    if (issue) {
      setAddError(issue);
      focusOn(IDS.addOutcome);
      return;
    }
    const count = draft.outcomes.length + 1;
    update((current) => ({
      ...current,
      outcomes: [...current.outcomes, current.newOutcome.trim()],
      newOutcome: '',
    }));
    setAddError(null);
    clearError('outcomes');
    say(OUTCOME_WORDS.added(count));
    focusOn(IDS.addOutcome);
  };

  // ---- the decision (the export's `validate`, `go`, `record`, `doConfirm`) ----
  const expectedRev = draft.basis ?? submission.rev;
  const options = referenceOptions(formats, Boolean(submission.content.preview.link?.trim()));
  const references = options
    .filter((option) => draft.references.includes(option.key))
    .map((option) => option.reference);
  const returnInput = {
    id: submission.id,
    reason: draft.reason,
    references,
    outcomes: [...draft.outcomes],
    expectedRev,
  };

  const showErrors = (found: DecisionErrors) => {
    setErrors(found);
    setSummaryFocus((count) => count + 1);
  };

  /** What an answer to a decision means for the page (refusals are values, ADR-0008). */
  const answered = (result: Result<unknown, ServiceError>) => {
    setDialog(false);
    if (result.ok) {
      setErrors({});
      setRefusal(null);
      setDecidedHere(true);
      decidedFocus.current = true;
      drop();
      return;
    }
    const error = result.error;
    if (error.kind === 'validation-failed') {
      const issues = decisionIssues(error);
      showErrors({
        ...(issues.outcomes ? { outcomes: issues.outcomes } : {}),
        ...(issues.reason ? { reason: issues.reason } : {}),
      });
      return;
    }
    if (error.kind === 'not-found' || error.kind === 'not-permitted') {
      setGone(true);
      return;
    }
    // Stale, or decided elsewhere: nothing was written. The record is read again; the work stays
    // and the next attempt is sent on the record as now shown.
    update((current) => ({ ...current, basis: null }));
    setErrors({});
    setRefusal(error.kind === 'invalid-state' ? 'moved-on' : 'stale');
    onReread();
    focusOn(IDS.refusal);
  };

  const sendReturn = () => {
    if (giveBack.busy) return;
    setReturnFailed(false);
    giveBack.run(returnInput).then(answered, () => setReturnFailed(true));
  };

  const go = () => {
    if (giveBack.busy || approve.busy) return;
    setRefusal(null);
    const found: { editing?: string; choice?: string; outcomes?: string; reason?: string } = {};
    if (draft.editing !== null) found.editing = DECISION_WORDS.editingFirst;
    if (draft.choice === null) found.choice = DECISION_WORDS.chooseDecision;
    if (draft.choice === 'approve') {
      const issues = approveIssues({ id: submission.id, outcomes: draft.outcomes, expectedRev });
      if (issues?.outcomes) found.outcomes = issues.outcomes;
    }
    if (draft.choice === 'return') {
      const issues = returnIssues(returnInput);
      if (issues?.reason) found.reason = issues.reason;
    }
    if (found.editing || found.choice || found.outcomes || found.reason) {
      showErrors(found);
      return;
    }
    setErrors({});
    if (draft.choice === 'approve') {
      setApproveFailed(false);
      setDialog(true);
      return;
    }
    sendReturn();
  };

  const sendApprove = () => {
    if (approve.busy) return;
    setApproveFailed(false);
    approve
      .run({ id: submission.id, outcomes: [...draft.outcomes], expectedRev })
      .then(answered, () => setApproveFailed(true));
  };

  const choose = (choice: ReviewChoice) => {
    update((current) => ({ ...current, choice }));
    setErrors((current) => {
      const next = { ...current };
      delete next.choice;
      delete next.reason;
      if (choice !== 'approve') delete next.outcomes;
      return next;
    });
  };

  // ---- what the page shows ----
  const revision = submission.revision;
  const changes = showsChanges(answer);
  const previous = previousReturnOf(answer, personId);
  const decision = lastDecision(submission);
  const status = statusOf(answer);
  const kind = submissionKind(submission);
  const cards = deliveryCards(answer);
  const content = submission.content;
  const outcomes = live ? draft.outcomes : submission.learningOutcomes.map((entry) => entry.text);
  const hasOutcomes = live || outcomes.length > 0;
  const crumb = reviewerParentCrumb(parent);
  const back = rvBackOf(parent);

  const facts: RvFact[] = [];
  if (live && submission.status.state === 'with-academic-reviewer' && today !== null) {
    const age = waitingAge(submission.status.since, today);
    facts.push({
      key: 'waiting',
      term: RV_FACT_TERMS.waiting,
      value: waitingFact(age.age, age.day),
    });
  } else if (!live && decision) {
    facts.push({
      key: 'decided',
      term: RV_FACT_TERMS.decided,
      value: dateTime(decision.decidedAt),
    });
  }
  facts.push({
    key: 'revision',
    term: IDENTITY_WORDS.revision,
    value: revisionFact(revision, resubmittedDay(submission)),
  });
  if (content.version?.trim()) {
    facts.push({ key: 'version', term: IDENTITY_WORDS.version, value: content.version.trim() });
  }
  facts.push({ key: 'formats', term: RV_FACT_TERMS.formats, value: formatsFact(codes) });

  const pageMap: RvPageLink[] = [];
  if (recheck) pageMap.push({ targetId: IDS.recheck, label: PAGE_MAP.recheck });
  if (changes) pageMap.push({ targetId: IDS.changed, label: PAGE_MAP.changed });
  if (hasOutcomes) {
    pageMap.push({
      targetId: IDS.outcomes,
      label: PAGE_MAP.outcomes,
      count: String(outcomes.length),
    });
  }
  pageMap.push({ targetId: IDS.details, label: PAGE_MAP.details });
  if (cards.length > 0) {
    pageMap.push({ targetId: IDS.delivery, label: PAGE_MAP.delivery, count: String(cards.length) });
  }
  pageMap.push({ targetId: IDS.history, label: RV_ITEM.reviewHistory });

  // ---- the panel ----
  const refusalNotice =
    refusal === 'stale' ? (
      <RvRefusal
        id={IDS.refusal}
        title={RV_REFUSAL.stale}
        detail={stateWords('RV-03.stale.line')}
      />
    ) : refusal === 'moved-on' ? (
      <RvRefusal
        id={IDS.refusal}
        title={RV_REFUSAL.elsewhere}
        detail={stateWords('RV-03.moved-on.line')}
      />
    ) : null;

  let panel: ReactNode;
  if (live) {
    const ready: RvReadyItem[] = [
      draft.outcomes.length > 0
        ? {
            id: 'rv-ready-0',
            tone: 'ok',
            icon: 'check',
            title: readyOutcomes(draft.outcomes.length),
            detail: READY_WORDS.outcomesRule,
          }
        : {
            id: 'rv-ready-0',
            tone: 'need',
            icon: 'alert',
            title: READY_WORDS.noOutcomes,
            detail: READY_WORDS.outcomesRule,
            link: { label: READY_WORDS.addOutcome, targetId: IDS.addOutcome, mode: 'field' },
          },
      {
        id: IDS.whole,
        tone: 'info',
        icon: 'layers',
        title: READY_WORDS.whole,
        detail: readyWhole(codes),
      },
    ];
    if (recheck) {
      ready.push({
        id: 'rv-ready-2',
        tone: 'info',
        icon: 'recheck',
        title: READY_WORDS.recheck,
        detail: READY_WORDS.recheckLine,
        link: { label: READY_WORDS.readWhy, targetId: IDS.recheck },
      });
    } else if (changes) {
      ready.push({
        id: 'rv-ready-2',
        tone: 'info',
        icon: 'resub',
        title: readyChanges(answer.whatChanged.length),
        link: { label: READY_WORDS.seeChanged, targetId: IDS.changed },
      });
    }
    const summary: ErrorSummaryItem[] = (['editing', 'choice', 'outcomes', 'reason'] as const)
      .filter((key) => errors[key])
      .map((key) => ({
        fieldId:
          key === 'editing'
            ? IDS.editField(draft.editing?.index ?? 0)
            : key === 'choice'
              ? IDS.choice
              : key === 'outcomes'
                ? IDS.addOutcome
                : IDS.reason,
        summaryText: errors[key]!,
      }));
    const isReturn = draft.choice === 'return';
    // The hint before the button; left out while the same problem is shown as an error.
    const pendingKey =
      draft.choice === null
        ? null
        : draft.editing !== null
          ? 'editing'
          : draft.choice === 'approve' && draft.outcomes.length === 0
            ? 'outcomes'
            : isReturn && draft.reason.trim() === ''
              ? 'reason'
              : null;
    const pending =
      pendingKey === null || errors[pendingKey]
        ? null
        : pendingKey === 'editing'
          ? DECISION_WORDS.pendingEditing
          : pendingKey === 'outcomes'
            ? DECISION_WORDS.pendingOutcomes
            : DECISION_WORDS.pendingReason;
    const groups = new Map<string, RvReferenceGroup['options'][number][]>();
    for (const entry of options) {
      const list = groups.get(entry.group) ?? [];
      list.push({
        id: `rv-ref-${entry.key.replace(':', '-')}`,
        label: entry.field,
        checked: draft.references.includes(entry.key),
      });
      groups.set(entry.group, list);
    }
    const toggle = (id: string) => {
      const key = options.find((entry) => `rv-ref-${entry.key.replace(':', '-')}` === id)?.key;
      if (!key) return;
      update((current) => ({
        ...current,
        references: current.references.includes(key)
          ? current.references.filter((item) => item !== key)
          : [...current.references, key],
      }));
    };
    panel = (
      <>
        {refusalNotice}
        <RvReadyList title={RV_ITEM.beforeYouDecide} items={ready} />
        <ErrorSummary
          ref={summaryRef}
          id={IDS.errors}
          title={RV_ITEM.checkYourDecision}
          items={summary}
        />
        {returnFailed ? (
          <Notice
            tone="warn"
            icon="alertCircle"
            role="alert"
            title={stateWords('RV-03.unavailable')}
          />
        ) : null}
        <ChoiceGroup<ReviewChoice>
          id={IDS.choice}
          name={IDS.choice}
          legend={RV_ITEM.decision}
          value={draft.choice}
          error={errors.choice}
          onChange={choose}
          options={[
            {
              value: 'approve',
              title: DECISION_WORDS.approve,
              description: recheck ? DECISION_WORDS.approveSubRecheck : DECISION_WORDS.approveSub,

              describedBy: IDS.whole,
            },
            {
              value: 'return',
              title: DECISION_WORDS.returnToVendor,
              description: DECISION_WORDS.returnSub,

              describedBy: IDS.whole,
            },
          ]}
        />
        {errors.editing ? <FieldError>{errors.editing}</FieldError> : null}
        {isReturn ? (
          <>
            <Field
              id={IDS.reason}
              label={DECISION_WORDS.reasonLabel}
              hint={DECISION_WORDS.reasonHint}
              error={errors.reason}
            >
              <Textarea
                value={draft.reason}
                onChange={(event) => {
                  const reason = event.target.value;
                  update((current) => ({ ...current, reason }));
                  clearError('reason');
                }}
              />
            </Field>
            {options.length > 0 ? (
              <RvReferenceGroups
                legend={DECISION_WORDS.refsLegend}
                hint={DECISION_WORDS.refsHint}
                groups={[...groups].map(([title, list]) => ({ title, options: list }))}
                onToggle={toggle}
              />
            ) : null}
          </>
        ) : null}
        {pending ? <PendingHint>{pending}</PendingHint> : null}
        <GoButton id={IDS.go} busy={giveBack.busy} busyLabel={BUSY_WORDS.returning} onClick={go}>
          {isReturn ? DECISION_WORDS.returnToVendor : DECISION_WORDS.approve}
        </GoButton>
        <RvPath
          title={RV_ITEM.whatHappensNext}
          steps={[
            {
              key: 'you',
              number: '1',
              title: RV_ITEM.youAcademicDecision,
              detail: recheck ? PATH_WORDS.youLineRecheck : PATH_WORDS.youLine,
              now: true,
            },
            {
              key: 'cm',
              number: '2',
              title: PATH_WORDS.contentManager,
              detail: PATH_WORDS.contentManagerLine,
            },
            {
              key: 'institutions',
              number: '3',
              title: PATH_WORDS.institutions,
              detail: PATH_WORDS.institutionsLine,
            },
          ]}
        />
      </>
    );
  } else {
    const done = decidedView(answer, personId, {
      here: decidedHere,
      elsewhere: refusal === 'moved-on',
    });
    panel = (
      <>
        {refusalNotice}
        <RvDecisionOutcome
          id={IDS.done}
          outcomeRef={decidedRef}
          status={
            <RvStatus tone={done.tone} size="lg">
              {done.status}
            </RvStatus>
          }
          meta={done.meta}
          reason={
            done.reason
              ? {
                  label: RV_ITEM.yourReason,
                  text: done.reason.text,
                  references: done.reason.references,
                }
              : undefined
          }
          stand={done.stand}
          next={done.next}
          action={<ButtonLink href={back.href}>{back.label}</ButtonLink>}
        />
      </>
    );
  }

  const fileCards = attachmentCards(answer);
  const notIncluded = (['WEB', 'AR', 'VR', 'MR'] as const).filter((code) => !codes.includes(code));
  const changedTag = <RvChangedTag>{changedInRevision(revision)}</RvChangedTag>;
  const withTag = (value: string, changed: boolean) =>
    changed ? (
      <>
        {value}
        {changedTag}
      </>
    ) : (
      value
    );

  return (
    <>
      <RvIdCard
        date={todayLine}
        breadcrumbs={<Breadcrumbs levels={[crumb]} current={content.name} />}
        kind={<RvKindTag kind={kind.kind} label={kind.label} detail={kind.detail} />}
        title={content.name}
        titleId={IDS.title}
        lead={content.summary?.trim() || null}
        status={
          <RvStatus tone={status.tone} size="lg">
            {status.words}
          </RvStatus>
        }
        course={
          course.code || course.name ? (
            <RvCourse code={course.code} name={course.name} placement="card" />
          ) : null
        }
        who={fromSender(submission.vendorOrganisation)}
        goTo={{ label: RV_ITEM.goToDecision, targetId: IDS.panel, focusId: IDS.panelTitle }}
        facts={facts}
        pageMapLabel={RV_ITEM.onThisPage}
        pageMap={pageMap}
      />
      <RvDetail
        panelId={IDS.panel}
        panelLabelledBy={IDS.panelTitle}
        main={
          <>
            {recheck && answer.recheck && answer.recheck.kind !== 'publish' ? (
              <RvBlock weight="attn" labelledBy={IDS.recheck}>
                <RvBandHead
                  titleId={IDS.recheck}
                  icon="kindRecheck"
                  title={REVIEW_PAGE.recheckTitle}
                  note={dateTime(answer.recheck.at)}
                />
                <RvQuote
                  quote={answer.recheck.reason}
                  by={recheckByWords(actorName(answer.recheck.by))}
                />
                <RecordLine space="above">{REVIEW_PAGE.recheckLine}</RecordLine>
              </RvBlock>
            ) : null}
            {changes ? (
              <RvBlock labelledBy={IDS.changed}>
                <RvBandHead
                  titleId={IDS.changed}
                  icon="kindResubmission"
                  title={changedTitle(revision)}
                  note={REVIEW_PAGE.changedNote}
                />
                <RvChangeSet>
                  {previous ? (
                    <RvQuote
                      quote={quoted(previous.reason)}
                      by={previousReturnBy(previous.revision, previous.day, previous.by)}
                    />
                  ) : null}
                  <RvComparison
                    label={changedTitle(revision)}
                    fieldHeader={REVIEW_PAGE.field}
                    beforeHeader={REVIEW_PAGE.was}
                    afterHeader={REVIEW_PAGE.now}
                    rows={changedRows(answer).map((row) => ({
                      key: row.key,
                      field: row.field,
                      before: [{ text: row.was, marked: true }],
                      after: [{ text: row.now }],
                    }))}
                  />
                </RvChangeSet>
              </RvBlock>
            ) : null}
            {hasOutcomes ? (
              <RvOutcomesBlock
                title={OUTCOME_WORDS.title}
                titleId={IDS.outcomes}
                sub={live ? OUTCOME_WORDS.subEditable : OUTCOME_WORDS.subReadOnly}
                invalid={live && Boolean(errors.outcomes)}
                requirement={
                  live ? (
                    draft.outcomes.length > 0 ? (
                      <RvRequirement state="ok">{OUTCOME_WORDS.requirementMet}</RvRequirement>
                    ) : (
                      <RvRequirement state="need">{OUTCOME_WORDS.requirementNeeded}</RvRequirement>
                    )
                  ) : (
                    <RvRequirement state="ro">{OUTCOME_WORDS.requirementReadOnly}</RvRequirement>
                  )
                }
              >
                {live ? (
                  <RvOutcomesEditor
                    words={OUTCOME_WORDS}
                    outcomes={draft.outcomes}
                    editing={draft.editing}
                    message={message}
                    canUndo={undo !== null}
                    editError={editError}
                    newText={draft.newOutcome}
                    addError={addError}
                    setError={errors.outcomes ?? null}
                    onMove={move}
                    onEdit={edit}
                    onEditText={(text) =>
                      update((current) =>
                        current.editing
                          ? { ...current, editing: { ...current.editing, text } }
                          : current,
                      )
                    }
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                    onDelete={remove}
                    onUndo={restore}
                    onNewText={(text) => {
                      update((current) => ({ ...current, newOutcome: text }));
                      setAddError(null);
                    }}
                    onAdd={add}
                  />
                ) : (
                  <RvOutcomesReadOnly outcomes={outcomes} label={OUTCOME_WORDS.listLabel} />
                )}
              </RvOutcomesBlock>
            ) : null}
            <RvBlock labelledBy={IDS.details}>
              <RvBlockHead
                titleId={IDS.details}
                kicker={fromSender(submission.vendorOrganisation)}
                title={REVIEW_PAGE.detailsTitle}
                note={RV_ITEM.readOnly}
              />
              {content.description?.trim() ? (
                <RvProse title={REVIEW_PAGE.description}>{content.description.trim()}</RvProse>
              ) : null}
              <RvFileCards title={REVIEW_PAGE.previewAndDocuments} cards={fileCards} />
            </RvBlock>
            {cards.length > 0 ? (
              <RvBlock labelledBy={IDS.delivery}>
                <RvBlockHead
                  titleId={IDS.delivery}
                  kicker={fromSender(submission.vendorOrganisation)}
                  title={REVIEW_PAGE.deliveryTitle}
                  note={RV_ITEM.readOnly}
                />
                <RvFormatLine
                  label={REVIEW_PAGE.inThisSubmission}
                  formats={codes}
                  formatsLabel={inThisSubmissionWords(codes)}
                  notIncluded={notIncluded.length > 0 ? notIncludedWords(notIncluded) : undefined}
                />
                <RvDeliveryCards>
                  {cards.map((card) =>
                    card.kind === 'web' ? (
                      <RvDeliveryCard
                        key={card.format}
                        code="WEB"
                        title={FORMAT_TITLES.web}
                        kind={REVIEW_PAGE.webKind}
                        rows={[
                          {
                            term: REVIEW_PAGE.webLink,
                            value: withTag(
                              card.link ?? REVIEW_PAGE.noValue,
                              card.changed.has('link'),
                            ),
                          },
                          {
                            term: REVIEW_PAGE.browser,
                            value: withTag(
                              card.browser || REVIEW_PAGE.noValue,
                              card.changed.has('browser'),
                            ),
                          },
                        ]}
                        action={
                          card.link ? (
                            <RvExternalLink href={card.link} newTab={REVIEW_PAGE.newTab}>
                              {REVIEW_PAGE.openWebLink}
                            </RvExternalLink>
                          ) : undefined
                        }
                      />
                    ) : (
                      <PackageCard
                        key={card.format}
                        card={card}
                        tag={(value, changed) => withTag(value, changed)}
                      />
                    ),
                  )}
                </RvDeliveryCards>
                <RvFootnote>{REVIEW_PAGE.deliveryOnly}</RvFootnote>
              </RvBlock>
            ) : null}
          </>
        }
        panel={
          <DecisionPanel
            title={RV_ITEM.yourDecision}
            titleId={IDS.panelTitle}
            titleRef={panelTitleRef}
          >
            {panel}
          </DecisionPanel>
        }
        history={
          <RvHistory
            titleId={IDS.history}
            title={RV_ITEM.reviewHistory}
            note={RV_ITEM.newestFirst}
            variant={live && refusal === null ? 'quiet' : 'card'}
          >
            <Timeline
              events={historyLines(answer, course.code).map((line) => ({
                what: line.what,
                when: line.when,
                note: line.note ?? undefined,
              }))}
            />
          </RvHistory>
        }
      />
      {live ? (
        <ConfirmDialog
          open={dialog}
          idPrefix="rv-dlg"
          title={approveTitle(content.name)}
          description={RV_APPROVE_DIALOG.description}
          groups={[
            {
              kind: 'now',
              title: RV_APPROVE_DIALOG.now,
              items: [approveGoes(draft.outcomes.length, recheck), RV_APPROVE_DIALOG.leavesQueue],
            },
            {
              kind: 'later',
              title: RV_APPROVE_DIALOG.later,
              items: [APPROVE_DIALOG.contentManagerDecides, APPROVE_DIALOG.noAccess],
            },
          ]}
          cancelLabel={DECISION_WORDS.cancel}
          confirmLabel={DECISION_WORDS.approve}
          busy={approve.busy}
          busyLabel={BUSY_WORDS.approving}
          // While it approves, Cancel (disabled) and Escape wait for the result: a decision once
          // sent is not taken back by closing its dialog.
          holdWhileBusy
          onConfirm={sendApprove}
          onCancel={() => {
            if (approve.busy) return;
            setDialog(false);
            setApproveFailed(false);
          }}
          returnFocusFallback={decidedRef}
        >
          {approveFailed ? (
            <Notice
              tone="warn"
              icon="alertCircle"
              role="alert"
              title={stateWords('RV-03.unavailable')}
            />
          ) : null}
        </ConfirmDialog>
      ) : null}
    </>
  );
}

/** "Preview and documents": the preview link, each document, and what was not sent. */
function attachmentCards(answer: SubmissionForReview): RvFileCard[] {
  const { preview, documents } = answer.submission.content;
  const link = preview.link?.trim() || null;
  const files = documents.map((document) => document.fileName);
  if (!link && files.length === 0) {
    return [{ kind: 'none', icon: 'document', title: REVIEW_PAGE.noAttachments, wide: true }];
  }
  const cards: RvFileCard[] = [];
  if (link) {
    cards.push({
      kind: 'link',
      title: preview.label?.trim() || link,
      note: REVIEW_PAGE.previewNote,
      href: link,
    });
  } else {
    cards.push({ kind: 'none', icon: 'preview', title: REVIEW_PAGE.noPreview });
  }
  for (const file of files) cards.push({ kind: 'document', title: file });
  if (files.length === 0)
    cards.push({ kind: 'none', icon: 'document', title: REVIEW_PAGE.noDocuments });
  return cards;
}

/** A package format's card: its fields, and its reference and install notes on demand. */
function PackageCard({
  card,
  tag,
}: {
  readonly card: Extract<ReturnType<typeof deliveryCards>[number], { kind: 'package' }>;
  readonly tag: (value: string, changed: boolean) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const reference =
    card.reference ??
    (card.fileName ? `${card.fileName}${REVIEW_PAGE.fileSuffix}` : REVIEW_PAGE.noValue);
  const hasMore = Boolean(card.reference || card.fileName || card.installNotes);
  return (
    <RvDeliveryCard
      code={formatCode(card.format)}
      title={FORMAT_TITLES[card.format]}
      kind={REVIEW_PAGE.packageKind}
      rows={[
        {
          term: REVIEW_PAGE.package,
          value: tag(card.label || REVIEW_PAGE.noValue, card.changed.has('label')),
        },
        {
          term: REVIEW_PAGE.deviceNeeded,
          value: tag(card.device || REVIEW_PAGE.noValue, card.changed.has('device')),
        },
      ]}
      more={
        hasMore
          ? {
              id: `rv-pkg-${formatCode(card.format)}`,
              open,
              showLabel: REVIEW_PAGE.viewPackage,
              hideLabel: REVIEW_PAGE.hidePackage,
              rows: [
                {
                  term: REVIEW_PAGE.packageReference,
                  value: tag(reference, card.changed.has('reference')),
                },
                {
                  term: REVIEW_PAGE.installNotes,
                  value: tag(card.installNotes || REVIEW_PAGE.noValue, card.changed.has('install')),
                },
              ],
              onToggle: () => setOpen((current) => !current),
            }
          : undefined
      }
    />
  );
}
