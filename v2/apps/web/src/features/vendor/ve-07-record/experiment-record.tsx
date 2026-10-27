'use client';

import {
  Breadcrumbs,
  Button,
  ButtonLink,
  DefinitionList,
  LinkTabs,
  ListState,
  LoadingRows,
  MetaSeparator,
  Notice,
  PageHead,
  type StandItem,
  StatusPill,
  Surface,
  VendorDeliveryList,
  VendorDeliveryView,
  VendorFormatChips,
  VendorLearningOutcomes,
  VendorRecordHistory,
  VendorRecordLayout,
  VendorRecordSheet,
  VendorRecordStand,
  VendorSection,
} from '@xr/ui/v3';
import { Fragment, type ReactNode, useEffect, useRef } from 'react';

import { dateTime, dayMonthYear } from '@/copy/dates';
import { formatName } from '@/copy/flow-state-words';
import { stateWords } from '@/copy/state-copy';
import {
  courseWithdrawnLine,
  courseWithdrawnTitle,
  courseWords,
  documentsWords,
  formatsLabel,
  formatsPublishedLine,
  historyPrivateNote,
  INTRO,
  lastChangeMeta,
  previewWords,
  publishedTitle,
  RECORD,
  RECORD_EYEBROW,
  returnedStandWords,
  reviseGoToLabel,
  revisionMeta,
  savedChangesLine,
  valueOrDash,
  withContentManagerLine,
} from '@/copy/vendor-record';
import { referenceWords } from '@/copy/vendor-editor';
import { helpAddresses } from '@/nav/help';
import { useAppNavigation } from '@/nav/navigation';
import {
  editDraftAddress,
  experimentRecordAddress,
  experimentRecordPlacement,
  MY_EXPERIMENTS_ADDRESS,
  MY_EXPERIMENTS_TITLE,
  RECORD_CRUMB,
  reviseAddress,
} from '@/nav/vendor';
import { useVendorRecord } from '@/queries/production';
import { type RecordCourse, useRecordCourse } from '@/queries/production-vendor-record';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { reviseReferenceAddress } from '../editor/editor-view';
import { ReturnedReasonPanel, type ReturnFacts, returnFactsOf } from '../shared/returned-reason';
import { savedChangesAt } from '../shared/saved-changes';
import { useTodayLine } from '../shared/today-line';
import { approvedAt, lastApprovalAt } from '../shared/approval';
import {
  deliveryBlocks,
  formatsOf,
  historyEvents,
  lastSubmittedAt,
  pillOf,
  publishedAt,
  type RecordState,
  recordStateOf,
  type VendorRecordView,
} from './record-view';

/** The page's ids (the export's `ve-h1`, `ve-reason`, `r-hh`, `r-ws`, `r-cd` …). */
const PREFIX = 'vr';
const TITLE_ID = `${PREFIX}-h`;
const REASON_ID = `${PREFIX}-reason`;
const HISTORY_ID = `${PREFIX}-hh`;
const STAND_ID = `${PREFIX}-ws`;

type RecordTab = 'details' | 'history';

/** `?tab=history` is VE-13 (state-copy `VE-13.address`); anything else is the record. */
function tabOf(search: string): { readonly tab: RecordTab; readonly normalise: boolean } {
  const param = new URLSearchParams(search).get('tab');
  return {
    tab: param === 'history' ? 'history' : 'details',
    normalise: param !== null && param !== 'history',
  };
}

/**
 * VE-07 Experiment record, with VE-13 Submission and version history — the owner-approved Vendor
 * export's record view (design/v3-refined-b/roles/VE-v1, `Main.dc.html` `V.record`; renders
 * `VE-07_*`, `VE-13_*`), at `/vendor/experiments/[submissionId]` (`?tab=history`).
 *
 * - **Reads**: `ProductionService.getRecord` — the submission, its guards (a course no longer
 *   assigned) and the decision that last returned it; the course’s code and name
 *   (`production-vendor-record.ts`). Every role’s command refreshes it in the same tab (BC14).
 * - **As the export draws it**: the breadcrumb, “Experiment” (the export's eyebrow without the
 *   submission's reference, state-copy `VE-02.no-reference`), the name, the status pill
 *   and the course, revision and last change; at most one action (Edit draft · Revise and
 *   resubmit · Continue revising). The status is stated once more, and only once: the
 *   returned-reason panel (who, when, the reason, “What it refers to” chips into the editor, the
 *   changes saved and not resubmitted) or the notice by state (HANDOFF §2). Then the tabs —
 *   Details (one sheet: which version is shown, course and description, the delivery of each
 *   format, preview and documents, the Academic Reviewer’s learning outcomes) and the history
 *   (newest first, the private-changes note) — with “Where it stands” (formats, revision, dates)
 *   beside both. Nothing else is the Vendor’s to do (state-copy `VE-07.no-other-actions`).
 * - Not found and another vendor’s record — a colleague of the same studio included (not
 *   permitted; owner decision PD-1) — show the same calm state; a failed read offers “Try again”.
 */
export function ExperimentRecord({ submissionId }: { readonly submissionId: string }) {
  const navigation = useAppNavigation();
  const { tab, normalise } = tabOf(navigation.search);
  useShellPage(experimentRecordPlacement(tab, RECORD_CRUMB));
  useEffect(() => {
    if (normalise) navigation.replace(experimentRecordAddress(submissionId));
  }, [normalise, navigation, submissionId]);

  const read = useVendorRecord(submissionId);
  const view = read.data?.ok ? read.data.value : null;
  const courseId = view?.submission.content.courseId ?? null;
  const course = useRecordCourse(submissionId, view ? courseId : null);

  if (read.isError || course.isError) {
    return (
      <BarePage>
        <ListState
          kind="failed"
          titleAs="h2"
          title={stateWords('VE-07.failed')}
          action={
            <Button
              onClick={() => {
                void read.refetch();
                if (course.isError) void course.refetch();
              }}
            >
              {RECORD.tryAgain}
            </Button>
          }
        >
          {RECORD.failedLine}
        </ListState>
      </BarePage>
    );
  }
  if (read.data && !read.data.ok) {
    return (
      <BarePage>
        <ListState
          kind="none"
          icon="infoNote"
          titleAs="h2"
          title={stateWords('VE-07.not-found.title')}
        >
          {stateWords('VE-07.not-found.line')}
        </ListState>
      </BarePage>
    );
  }
  if (view === null || (courseId !== null && course.data === undefined)) {
    return (
      <BarePage>
        <LoadingRows message={stateWords('VE-07.loading')} />
      </BarePage>
    );
  }
  const courseFacts = course.data?.ok ? course.data.value : null;
  return <Record key={view.submission.id} view={view} course={courseFacts} tab={tab} />;
}

/** The page before the record is read (or when it can’t be shown): breadcrumb, heading, a sheet. */
function BarePage({ children }: { readonly children: ReactNode }) {
  const today = useTodayLine();
  return (
    <>
      <PageHead
        variant="record"
        title={RECORD_CRUMB}
        titleId={TITLE_ID}
        titleFocusTarget
        date={today}
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: MY_EXPERIMENTS_TITLE, href: MY_EXPERIMENTS_ADDRESS }]}
            current={RECORD_CRUMB}
          />
        }
      />
      <Surface>{children}</Surface>
    </>
  );
}

const DRAFT_STATES: ReadonlySet<RecordState> = new Set(['draft', 'draft-read-only']);

function Record({
  view,
  course,
  tab,
}: {
  readonly view: VendorRecordView;
  readonly course: RecordCourse | null;
  readonly tab: RecordTab;
}) {
  const navigation = useAppNavigation();
  const today = useTodayLine();
  const { submission } = view;
  const state = recordStateOf(view);
  const pill = pillOf(view);
  const courseName = course ? (course.code ?? course.name) : null;
  const savedAt = savedChangesAt(submission);
  const returned = state === 'returned' || state === 'returned-read-only';
  const facts = returned ? returnFactsOf(view.lastReturn, submission) : null;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const historyRef = useRef<HTMLHeadingElement>(null);
  const shownTab = useRef<RecordTab | null>(null);

  // Each tab's heading takes focus when it opens (LINK-MAP L55): the history's on `?tab=history`
  // — arriving there too — and the page heading back on Details. After the timeout, so that a
  // tab link's own route focus (the page heading) comes first.
  useEffect(() => {
    const before = shownTab.current;
    shownTab.current = tab;
    if (tab === 'details' && before !== 'history') return;
    const timer = window.setTimeout(() => {
      (tab === 'history' ? historyRef : titleRef).current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [tab]);

  const meta = [
    courseName ?? RECORD.dash,
    ...(DRAFT_STATES.has(state) ? [] : [revisionMeta(submission.revision)]),
    lastChangeMeta(dayMonthYear(submission.updatedAt)),
  ];
  const action =
    state === 'draft' ? (
      <ButtonLink
        variant="primary"
        size="lg"
        href={editDraftAddress(submission.id, submission.lastStepReached)}
      >
        {RECORD.editDraft}
      </ButtonLink>
    ) : state === 'returned' ? (
      <ButtonLink variant="primary" size="lg" href={reviseAddress(submission.id)}>
        {savedAt ? RECORD.continueRevising : RECORD.revise}
      </ButtonLink>
    ) : undefined;

  return (
    <>
      <PageHead
        variant="record"
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: MY_EXPERIMENTS_TITLE, href: MY_EXPERIMENTS_ADDRESS }]}
            current={submission.content.name}
          />
        }
        date={today}
        eyebrow={RECORD_EYEBROW}
        title={submission.content.name}
        titleId={TITLE_ID}
        titleRef={titleRef}
        titleFocusTarget
        meta={
          <>
            <StatusPill tone={pill.tone} size="lg">
              {pill.words}
            </StatusPill>
            {meta.map((item, index) => (
              <Fragment key={index}>
                <MetaSeparator />
                <span>{item}</span>
              </Fragment>
            ))}
          </>
        }
        actions={action}
      />
      {facts ? (
        <ReturnedReasonPanel
          id={REASON_ID}
          facts={facts}
          // Each chip opens its field in the editor (LINK-MAP L53): `revise?step=…&field=…`.
          references={
            state === 'returned'
              ? {
                  label: RECORD.refersTo,
                  nameOf: (reference) => reviseGoToLabel(referenceWords(reference)),
                  onSelect: (reference) =>
                    navigation.navigate(reviseReferenceAddress(submission.id, reference)),
                }
              : undefined
          }
          saved={
            savedAt
              ? {
                  title: RECORD.savedTitle,
                  line: savedChangesLine(dateTime(savedAt), submission.revision),
                }
              : undefined
          }
        />
      ) : null}
      <StateNotice view={view} state={state} courseName={courseName} />
      <LinkTabs
        label={RECORD.tabsLabel}
        tabs={[
          {
            label: RECORD.tabs.details,
            href: experimentRecordAddress(submission.id),
            current: tab === 'details',
          },
          {
            label: RECORD.tabs.history,
            href: experimentRecordAddress(submission.id, 'history'),
            current: tab === 'history',
          },
        ]}
      />
      <VendorRecordLayout
        main={
          tab === 'history' ? (
            <VendorRecordHistory
              title={RECORD.history}
              titleId={HISTORY_ID}
              titleRef={historyRef}
              note={RECORD.historyMeta}
              privateNote={savedAt ? historyPrivateNote(dateTime(savedAt)) : undefined}
              events={historyEvents(view)}
            />
          ) : (
            <Details view={view} state={state} course={course} savedAt={savedAt} />
          )
        }
        aside={<WhereItStands view={view} state={state} facts={facts} />}
        asideLabelledBy={STAND_ID}
      />
    </>
  );
}

/** The notice by state (HANDOFF §2 “Record notice”); a returned record has its panel instead. */
function StateNotice({
  view,
  state,
  courseName,
}: {
  readonly view: VendorRecordView;
  readonly state: RecordState;
  readonly courseName: string | null;
}) {
  const { submission } = view;
  const words = RECORD.notice;
  const askForHelp = (
    <ButtonLink href={helpAddresses('vendor').report}>{RECORD.askForHelp}</ButtonLink>
  );
  switch (state) {
    case 'draft':
      return (
        <Notice tone="off" icon="edit" role="status" title={words.draftTitle}>
          {words.draftLine}
        </Notice>
      );
    case 'draft-read-only':
    case 'returned-read-only':
      return (
        <Notice
          tone="warn"
          icon="lock"
          role="status"
          title={courseWithdrawnTitle(courseName ?? RECORD.dash)}
          actions={askForHelp}
        >
          {courseWithdrawnLine(
            submission.vendorOrganisation,
            state === 'draft-read-only' ? 'draft' : 'returned',
          )}
        </Notice>
      );
    case 'with-reviewer':
      return (
        <Notice tone="info" icon="clock" role="status" title={words.withReviewerTitle}>
          {words.withReviewerLine}
        </Notice>
      );
    case 'submitted':
      return (
        <Notice tone="info" icon="check" role="status" title={words.submittedTitle}>
          {words.submittedLine}
        </Notice>
      );
    case 'recheck':
      return (
        <Notice tone="info" icon="clock" role="status" title={words.recheckTitle}>
          {words.recheckLine}
        </Notice>
      );
    case 'with-content-manager':
      return (
        <Notice tone="info" icon="clock" role="status" title={words.withContentManagerTitle}>
          {withContentManagerLine(dayMonthYear(approvedAt(submission)))}
        </Notice>
      );
    case 'published':
      return (
        <Notice
          tone="ok"
          icon="check"
          role="status"
          title={publishedTitle(dayMonthYear(publishedAt(submission) ?? submission.updatedAt))}
        >
          {words.publishedLine}
        </Notice>
      );
    case 'returned':
      return null;
  }
}

/** Which version Details shows (`recView` `intro`). */
function introOf(view: VendorRecordView, state: RecordState, savedAt: string | null): string {
  const { submission } = view;
  if (state === 'draft') return INTRO.draft(dateTime(submission.updatedAt));
  if (state === 'draft-read-only') return INTRO.readOnly(dateTime(submission.updatedAt));
  const published = publishedAt(submission);
  if (state === 'published' && published) return INTRO.published(dayMonthYear(published));
  if (savedAt) return INTRO.savedChanges(dateTime(savedAt));
  const submitted = lastSubmittedAt(submission);
  return INTRO.submitted(submission.revision, submitted ? dayMonthYear(submitted) : null);
}

/** The Details tab: one sheet, read-only (`div.rk-surface.vr-sheet`). */
function Details({
  view,
  state,
  course,
  savedAt,
}: {
  readonly view: VendorRecordView;
  readonly state: RecordState;
  readonly course: RecordCourse | null;
  readonly savedAt: string | null;
}) {
  const { submission } = view;
  const { content } = submission;
  const formats = formatsOf(submission);
  const published = state === 'published';
  return (
    <VendorRecordSheet intro={introOf(view, state, savedAt)}>
      <VendorSection as="section" title={RECORD.sections.course} titleId={`${PREFIX}-cd`}>
        <DefinitionList
          items={[
            {
              term: RECORD.keys.course,
              value: content.courseId === null || course ? courseWords(course) : RECORD.dash,
            },
            { term: RECORD.keys.summary, value: valueOrDash(content.summary) },
            { term: RECORD.keys.description, value: valueOrDash(content.description) },
            { term: RECORD.keys.version, value: valueOrDash(content.version) },
          ]}
        />
      </VendorSection>
      <VendorSection
        as="section"
        title={RECORD.sections.delivery}
        titleId={`${PREFIX}-fd`}
        row
        status={published ? formatsPublishedLine(formats) : undefined}
        note={published ? RECORD.publishedFoot : undefined}
      >
        <VendorDeliveryList>
          {deliveryBlocks(submission).map((block) => (
            <VendorDeliveryView
              key={block.format}
              code={formatName(block.format)}
              name={block.name}
              kind={block.kind}
              rows={block.rows}
            />
          ))}
        </VendorDeliveryList>
      </VendorSection>
      <VendorSection as="section" title={RECORD.sections.preview} titleId={`${PREFIX}-pd`}>
        <DefinitionList
          items={[
            { term: RECORD.keys.preview, value: previewWords(content.preview) },
            { term: RECORD.keys.documents, value: documentsWords(content.documents) },
          ]}
        />
      </VendorSection>
      <VendorLearningOutcomes
        title={RECORD.sections.outcomes}
        titleId={`${PREFIX}-lo`}
        by={RECORD.outcomesMeta}
        line={RECORD.outcomesLead}
        outcomes={submission.learningOutcomes.map((outcome) => ({
          key: outcome.id,
          text: outcome.text,
        }))}
        empty={RECORD.outcomesNone}
      />
    </VendorRecordSheet>
  );
}

/**
 * “Where it stands” beside both tabs (`recView` `standLite`): the formats, the revision and the
 * dates — never the status again. The day a course was withdrawn is not in the record’s read
 * (state-copy `VE-07.course-withdrawn.line`).
 */
function WhereItStands({
  view,
  state,
  facts,
}: {
  readonly view: VendorRecordView;
  readonly state: RecordState;
  /** The return a returned record shows (`returnFactsOf`). */
  readonly facts: ReturnFacts | null;
}) {
  const { submission } = view;
  const formats = formatsOf(submission);
  const words = RECORD.stand;
  const items: StandItem[] = [];
  if (!DRAFT_STATES.has(state)) {
    items.push({ term: words.revision, value: String(submission.revision) });
  }
  const submitted = lastSubmittedAt(submission);
  if (submitted) items.push({ term: words.lastSubmitted, value: dayMonthYear(submitted) });
  if (facts && facts.by !== 'super-admin-override') {
    items.push({
      term: words.returned,
      value: returnedStandWords(dayMonthYear(facts.at), facts.by),
    });
  }
  const approval = lastApprovalAt(submission);
  if (
    approval &&
    (state === 'with-content-manager' ||
      state === 'recheck' ||
      state === 'published' ||
      facts?.by === 'content-manager')
  ) {
    items.push({ term: words.approved, value: dayMonthYear(approval) });
  }
  const published = publishedAt(submission);
  if (state === 'published' && published) {
    items.push({ term: words.published, value: dayMonthYear(published) });
  }
  items.push({ term: words.lastChange, value: dayMonthYear(submission.updatedAt) });
  return (
    <VendorRecordStand
      title={words.title}
      titleId={STAND_ID}
      formats={{
        term: words.formats,
        value: (
          <VendorFormatChips
            formats={formats.map((format) => formatName(format))}
            label={formatsLabel(formats)}
          />
        ),
      }}
      items={items}
    />
  );
}
