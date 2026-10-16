'use client';

import type { Technology } from '@xr/domain';
import {
  BackLink,
  Button,
  EmptyState,
  FormatBadge,
  type FormatCode,
  Icon,
  Link,
  LoadingState,
  Notice,
  PageContent,
  PageHeader,
  Section,
  SectionBody,
  Skeleton,
  StatusPill,
  Timeline,
} from '@xr/ui';
import { Fragment, type ReactNode, useEffect, useRef } from 'react';

import { dayMonthYear } from '@/copy/dates';
import { formatName } from '@/copy/flow-state-words';
import { stateWords } from '@/copy/state-copy';
import {
  courseWithdrawnLine,
  courseWithdrawnTitle,
  courseWords,
  documentsWords,
  formatsPublishedLine,
  previewWords,
  publishedTitle,
  RECORD,
  recordOverline,
  valueOrDash,
  withContentManagerLine,
} from '@/copy/vendor-record';
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
import { ReturnedNotice } from '../shared/returned-notice';
import {
  approvedAt,
  chipOf,
  formatsOf,
  historyEvents,
  recordStateOf,
  type VendorRecordView,
} from './record-view';

/** The board’s id prefix (`Rm-h`, `Rm-dh`, `Rm-lo`, `Rm-hh`, `Rm-reason` …; B5-06 f0). */
const PREFIX = 'vr';
const HISTORY_ID = `${PREFIX}-hh`;

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
 * VE-07 Experiment record, with VE-13 History — board B5-06 f0 … f10, at
 * `/vendor/experiments/[submissionId]` (`?tab=history`). “Where is it, who has it, and what came
 * back?”
 *
 * - **Reads**: `ProductionService.getRecord` — the submission, its guards (a course no longer
 *   assigned) and the decision that last returned it; the course’s code and name
 *   (`production-vendor-record.ts`). Every role’s command refreshes it in the same tab (BC14).
 * - **As B5-06 draws it** (AR-3, `xr-wrap--read`): back to My experiments; “SUB-0077 · ME ZG523 ·
 *   revision 2”, the name as the H1 and the status in the Vendor’s words; the banner by state;
 *   Details (course, summary, description, version, formats, preview, documents; Delivery per
 *   format); Learning outcomes — the Academic Reviewer’s, read-only (LD-3); Submission and version
 *   history, newest first (VE-13 merged into the record: the entries the Vendor may see).
 * - **Banner by state**: Draft → “Edit draft” (the editor where the Vendor stopped); With the
 *   Academic Reviewer, Submitted (after a resubmit — no gate named, M-3), back for a re-check, With
 *   the Content Manager → nothing is needed; Returned (by either role) → the reason, what it refers
 *   to and “Revise & resubmit”; Published → read-only, the formats published; a course no longer
 *   assigned → read-only. Nothing else is the Vendor’s to do (state-copy `VE-07.no-other-actions`).
 * - Not found, another vendor’s record (not permitted) and a colleague’s (policy-open SUB-15) show
 *   calm states; a failed read offers “Try again”.
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
        <LoadFailed
          onRetry={() => {
            void read.refetch();
            if (course.isError) void course.refetch();
          }}
        />
      </BarePage>
    );
  }
  if (read.data && !read.data.ok) {
    return (
      <BarePage>
        <CalmState kind={read.data.error.kind === 'policy-open' ? 'policy-open' : 'not-found'} />
      </BarePage>
    );
  }
  if (view === null || (courseId !== null && course.data === undefined)) {
    return (
      <BarePage>
        <LoadingState
          label={stateWords('VE-07.loading')}
          surface="section"
          skeleton={
            <div aria-hidden="true" className="flex flex-col gap-4 p-6">
              <Skeleton className="w-[240px]" />
              <Skeleton />
              <Skeleton />
            </div>
          }
        />
      </BarePage>
    );
  }
  const courseFacts = course.data?.ok ? course.data.value : null;
  return <Record key={view.submission.id} view={view} course={courseFacts} tab={tab} />;
}

/** The page before the record is read (or when it can’t be shown): back link and heading. */
function BarePage({ children }: { readonly children: ReactNode }) {
  return (
    <PageContent wrap="read">
      <PageHeader
        className="[margin:8px_0_20px]"
        back={<BackLink href={MY_EXPERIMENTS_ADDRESS}>{MY_EXPERIMENTS_TITLE}</BackLink>}
        title={RECORD_CRUMB}
      />
      {children}
    </PageContent>
  );
}

function Record({
  view,
  course,
  tab,
}: {
  readonly view: VendorRecordView;
  readonly course: RecordCourse | null;
  readonly tab: RecordTab;
}) {
  const { submission } = view;
  const state = recordStateOf(view);
  const chip = chipOf(view);
  const formats = formatsOf(submission);
  const courseName = course ? (course.code ?? course.name) : null;
  const historyRef = useRef<HTMLHeadingElement>(null);

  // VE-13: arriving on `?tab=history`, focus moves to the history (and it scrolls into view).
  useEffect(() => {
    if (tab === 'history') historyRef.current?.focus();
  }, [tab]);

  return (
    <PageContent wrap="read">
      <PageHeader
        className="[margin:8px_0_20px]"
        back={<BackLink href={MY_EXPERIMENTS_ADDRESS}>{MY_EXPERIMENTS_TITLE}</BackLink>}
        overline={recordOverline(submission.id, courseName, submission.revision)}
        title={submission.content.name}
        titleId={`${PREFIX}-h`}
        titleFocusTarget
        meta={<StatusPill tone={chip.tone}>{chip.words}</StatusPill>}
      />
      <div className="flex flex-col gap-6">
        <Banner view={view} courseName={courseName} />
        <Section title={RECORD.details} headingId={`${PREFIX}-dh`}>
          <SectionBody className="flex flex-col gap-[18px]">
            {state === 'published' ? (
              <p className="xl-meta [margin:0_0_10px]">{formatsPublishedLine(formats)}</p>
            ) : null}
            <dl className="xl-kv xv-kv">
              <dt>{RECORD.keys.course}</dt>
              <dd>
                {submission.content.courseId === null || course ? courseWords(course) : RECORD.dash}
              </dd>
              <dt>{RECORD.keys.summary}</dt>
              <dd>{submission.content.summary ?? ''}</dd>
              <dt>{RECORD.keys.description}</dt>
              <dd>{submission.content.description ?? ''}</dd>
              <dt>{RECORD.keys.version}</dt>
              <dd>{valueOrDash(submission.content.version)}</dd>
              <dt>{RECORD.keys.formats}</dt>
              <dd>
                {formats.map((format) => (
                  <FormatBadge key={format} format={formatName(format) as FormatCode} compact />
                ))}
              </dd>
              <dt>{RECORD.keys.preview}</dt>
              <dd>{previewWords(submission.content.preview)}</dd>
              <dt>{RECORD.keys.documents}</dt>
              <dd>{documentsWords(submission.content.documents)}</dd>
            </dl>
            <h3 className="xr-h3 m-0">{RECORD.delivery}</h3>
            {formats.map((format) => (
              <DeliveryBox key={format} format={format} submission={submission} />
            ))}
          </SectionBody>
        </Section>
        <Section
          title={RECORD.outcomes}
          headingId={`${PREFIX}-lo`}
          meta={
            <>
              <Icon name="readOnly" size={16} /> {RECORD.outcomesMeta}
            </>
          }
        >
          <SectionBody>
            {submission.learningOutcomes.length > 0 ? (
              <>
                <p className="xl-meta [margin:0_0_10px]">{RECORD.outcomesLead}</p>
                <ul className="xv-los">
                  {submission.learningOutcomes.map((outcome) => (
                    <li key={outcome.id}>{outcome.text}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="xl-meta m-0">{RECORD.outcomesNone}</p>
            )}
          </SectionBody>
        </Section>
        <Section
          title={RECORD.history}
          headingId={HISTORY_ID}
          meta={RECORD.historyMeta}
          headingFocusTarget
          headingRef={historyRef}
        >
          <SectionBody>
            <Timeline events={historyEvents(view)} markLatest={false} />
          </SectionBody>
        </Section>
      </div>
    </PageContent>
  );
}

/** The banner by state (B5-06 doc “Banner by state”; f0 … f9). */
function Banner({
  view,
  courseName,
}: {
  readonly view: VendorRecordView;
  readonly courseName: string | null;
}) {
  const { submission } = view;
  const state = recordStateOf(view);
  const words = RECORD.banner;
  switch (state) {
    case 'draft':
      return (
        <Notice
          title={words.draftTitle}
          actions={
            <Link
              className="xr-btn xr-btn--primary"
              href={editDraftAddress(submission.id, submission.lastStepReached)}
            >
              {words.editDraft}
            </Link>
          }
        >
          {words.draftLine}
        </Notice>
      );
    case 'draft-read-only':
      return (
        <Notice tone="warn" title={courseWithdrawnTitle(courseName ?? RECORD.dash)}>
          {courseWithdrawnLine(submission.vendorOrganisation, 'draft')}
        </Notice>
      );
    case 'with-reviewer':
      return <Notice title={words.withReviewerTitle}>{words.withReviewerLine}</Notice>;
    case 'submitted':
      return <Notice title={words.submittedTitle}>{words.submittedLine}</Notice>;
    case 'recheck':
      return <Notice title={words.recheckTitle}>{words.recheckLine}</Notice>;
    case 'with-content-manager':
      return (
        <Notice title={words.withContentManagerTitle}>
          {withContentManagerLine(dayMonthYear(approvedAt(submission)))}
        </Notice>
      );
    case 'published':
      return (
        <Notice
          tone="ok"
          title={publishedTitle(
            dayMonthYear(
              submission.status.state === 'published' ? submission.status.at : submission.updatedAt,
            ),
          )}
        >
          {words.publishedLine}
        </Notice>
      );
    case 'returned':
    case 'returned-read-only':
      return (
        <div className="flex flex-col gap-3">
          <ReturnedNotice
            lastReturn={view.lastReturn}
            submission={submission}
            id={`${PREFIX}-reason`}
          />
          {state === 'returned' ? (
            <div className="xw-actions">
              <Link className="xr-btn xr-btn--primary" href={reviseAddress(submission.id)}>
                {RECORD.revise}
              </Link>
            </div>
          ) : (
            <Notice tone="warn" title={courseWithdrawnTitle(courseName ?? RECORD.dash)}>
              {courseWithdrawnLine(submission.vendorOrganisation, 'returned')}
            </Notice>
          )}
        </div>
      );
  }
}

/** One format’s delivery (`div.xv-deliv`; script `delivery`): a web link, or an app package. */
function DeliveryBox({
  format,
  submission,
}: {
  readonly format: Technology;
  readonly submission: VendorRecordView['submission'];
}) {
  const delivery = submission.content.delivery[format];
  const rows: [string, string][] = [];
  if (format === 'web') {
    const web = delivery?.format === 'web' ? delivery : null;
    rows.push(
      [RECORD.rows.webLink, valueOrDash(web?.webLink)],
      [RECORD.rows.browserAndComputer, valueOrDash(web?.browserAndComputer)],
    );
    if (web?.notes?.trim()) rows.push([RECORD.rows.notes, web.notes.trim()]);
  } else {
    const pkg = delivery && delivery.format !== 'web' ? delivery : null;
    rows.push(
      [RECORD.rows.packageLabel, valueOrDash(pkg?.packageLabel)],
      [RECORD.rows.packageReference, valueOrDash(pkg?.packageReference)],
    );
    if (pkg?.packageFileName?.trim()) rows.push([RECORD.rows.packageFile, pkg.packageFileName]);
    rows.push(
      [RECORD.rows.deviceNeeded, valueOrDash(pkg?.deviceNeeded)],
      [RECORD.rows.installNotes, valueOrDash(pkg?.installNotes)],
    );
    if (pkg?.notes?.trim()) rows.push([RECORD.rows.notes, pkg.notes.trim()]);
  }
  return (
    <div className="xv-deliv">
      <div className="xv-deliv-head">
        <FormatBadge format={formatName(format) as FormatCode} compact />
        <span className="font-[700]">
          {format === 'web' ? RECORD.webLinkTitle : RECORD.appPackageTitle}
        </span>
      </div>
      <dl className="xl-kv xv-kv">
        {rows.map(([key, value]) => (
          <Fragment key={key}>
            <dt>{key}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}

/** Not found, not permitted (another vendor’s) or a colleague’s (policy-open SUB-15): calm. */
function CalmState({ kind }: { readonly kind: 'not-found' | 'policy-open' }) {
  return (
    <div className="xr-section">
      <EmptyState
        icon="info"
        title={stateWords(
          kind === 'policy-open' ? 'VE-07.policy-open.title' : 'VE-07.not-found.title',
        )}
      >
        {stateWords(kind === 'policy-open' ? 'VE-07.policy-open.line' : 'VE-07.not-found.line')}
      </EmptyState>
    </div>
  );
}

/** Undrawn: failed + Try again (`VE-07.failed`), B2-11 f10’s formula. */
function LoadFailed({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon bg-err-bg text-err">
          <Icon name="failed" />
        </span>
        <h2 className="xr-h3 m-0">{stateWords('VE-07.failed')}</h2>
        <p className="xr-body m-0 text-ink-2">{stateWords('VE-07.failed.line')}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" icon="tryAgain" onClick={onRetry}>
            {stateWords('VE-07.try-again')}
          </Button>
        </div>
      </div>
    </div>
  );
}
