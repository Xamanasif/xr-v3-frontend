'use client';

import type { Submission } from '@xr/domain';
import { FORMAT_META, inDisplayOrder } from '@xr/domain';
import {
  ButtonLink,
  Notice,
  PageHead,
  StatusPill,
  VendorDeliveryView,
  VendorEditorEntered,
  VendorEditorOutcome,
  VendorEditorRefusal,
  VendorFormatChips,
} from '@xr/ui/v3';
import type { Ref } from 'react';

import { dateTime, dayMonthYear } from '@/copy/dates';
import {
  alreadySubmittedLine,
  DONE,
  formatKind,
  formatName,
  formatsNameWords,
  lastSavedWords,
  READ_ONLY,
  READ_ONLY_EYEBROW,
  REFUSAL,
  subLineWords,
} from '@/copy/vendor-editor';
import { helpAddresses } from '@/nav/help';
import { experimentRecordAddress, MY_EXPERIMENTS_ADDRESS } from '@/nav/vendor';

import { vendorPill } from '../shared/status-pill';
import { deliveryRows, DONE_ID, draftOf, ID_PREFIX, refusalKind, TITLE_ID } from './editor-view';

/** The record's two ways on: its record (primary) and My experiments. */
function WaysOn({ id }: { readonly id: string }) {
  return (
    <>
      <ButtonLink variant="primary" size="lg" href={experimentRecordAddress(id)}>
        {DONE.openRecord}
      </ButtonLink>
      <ButtonLink size="lg" href={MY_EXPERIMENTS_ADDRESS}>
        {DONE.backToList}
      </ButtonLink>
    </>
  );
}

/** When it was sent: the status's own time, else the record's last change. */
function sentAt(submission: Submission): string {
  const status = submission.status;
  return dateTime('since' in status ? status.since : submission.updatedAt);
}

// ---- after Submit / Resubmit (VE-06, VE-08) -----------------------------------------------------

/**
 * The outcome card in place of the editor: “Submitted for academic review” after the first submit,
 * “Submitted” after a resubmit — the Vendor reads “Submitted”, never the next stage (HANDOFF §2,
 * M-3). The status, the revision after a resubmit, the time, the formats, what happens next, the
 * record and My experiments. Its H1 takes focus.
 */
export function DoneState({
  kind,
  submission,
  date,
  titleRef,
}: {
  readonly kind: 'submitted' | 'resubmitted';
  /** The record as the command answered it. */
  readonly submission: Submission;
  readonly date?: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
}) {
  const resubmitted = kind === 'resubmitted';
  const formats = inDisplayOrder(submission.content.formats).map(
    (format) => FORMAT_META[format].code,
  );
  return (
    <VendorEditorOutcome
      id={DONE_ID}
      titleId={TITLE_ID}
      titleRef={titleRef}
      date={date}
      eyebrow={subLineWords(submission.content.name)}
      title={resubmitted ? DONE.resubmittedTitle : DONE.submittedTitle}
      text={resubmitted ? DONE.resubmittedText : DONE.submittedText}
      statusTerm={DONE.facts.status}
      status={vendorPill(submission)}
      facts={[
        ...(resubmitted ? [{ term: DONE.facts.revision, value: String(submission.revision) }] : []),
        { term: DONE.facts.submitted, value: sentAt(submission) },
      ]}
      formatsTerm={DONE.facts.formats}
      formats={formats}
      formatsLabel={formatsNameWords(formats)}
      next={resubmitted ? DONE.resubmittedNext : DONE.submittedNext}
      actions={<WaysOn id={submission.id} />}
    />
  );
}

// ---- read-only: the course is no longer assigned (VE-09) ----------------------------------------

/** “What you entered”: course, summary, version, formats, then each format's delivery. */
function WhatYouEntered({
  submission,
  courseLine,
}: {
  readonly submission: Submission;
  readonly courseLine: string;
}) {
  const draft = draftOf(submission.content);
  const formats = inDisplayOrder(submission.content.formats);
  return (
    <VendorEditorEntered
      titleId={`${ID_PREFIX}-rod`}
      title={READ_ONLY.entered}
      items={[
        { term: READ_ONLY.rows.course, value: courseLine },
        { term: READ_ONLY.rows.summary, value: draft.summary.trim() || READ_ONLY.empty },
        { term: READ_ONLY.rows.version, value: draft.version.trim() || READ_ONLY.empty },
        {
          term: READ_ONLY.rows.formats,
          value:
            formats.length > 0 ? (
              <VendorFormatChips formats={formats.map((format) => FORMAT_META[format].code)} />
            ) : (
              READ_ONLY.empty
            ),
        },
      ]}
      delivery={
        formats.length > 0
          ? formats.map((format) => (
              <VendorDeliveryView
                key={format}
                code={FORMAT_META[format].code}
                name={formatName(format)}
                kind={formatKind(format)}
                rows={deliveryRows(draft, format)}
              />
            ))
          : undefined
      }
    />
  );
}

/**
 * A draft whose course is no longer one of the Vendor's (OD-B5-01) opens read-only: the record's
 * head with “Draft · read-only”, the warn notice with My experiments and Ask for help (the XS-07
 * report form, its “Where” filled in from this page, as the record's: LINK-MAP L45), and “What you
 * entered”. Nothing can be changed or submitted.
 */
export function ReadOnlyView({
  submission,
  courseLine,
  noticeTitle,
  noticeLine,
  date,
  titleRef,
}: {
  readonly submission: Submission;
  readonly courseLine: string;
  readonly noticeTitle: string;
  readonly noticeLine: string;
  readonly date?: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <>
      <PageHead
        variant="record"
        title={submission.content.name}
        titleId={TITLE_ID}
        titleFocusTarget
        titleRef={titleRef}
        date={date}
        eyebrow={READ_ONLY_EYEBROW}
        meta={
          <>
            <StatusPill tone="paused" size="lg">
              {READ_ONLY.status}
            </StatusPill>
            <span>{lastSavedWords(dateTime(submission.updatedAt))}</span>
          </>
        }
      />
      <Notice
        tone="warn"
        icon="lock"
        role="status"
        title={noticeTitle}
        actions={
          <>
            <ButtonLink href={MY_EXPERIMENTS_ADDRESS}>{READ_ONLY.backToList}</ButtonLink>
            <ButtonLink variant="ghost" href={helpAddresses('vendor').report}>
              {READ_ONLY.help}
            </ButtonLink>
          </>
        }
      >
        {noticeLine}
      </Notice>
      <WhatYouEntered submission={submission} courseLine={courseLine} />
    </>
  );
}

// ---- refusal: a stale editor address (VE-08, VE-09) ---------------------------------------------

/**
 * An editor address for a record that is not the Vendor's to change now — already submitted,
 * being reviewed, approved or published: the export's refusal with the record and My experiments.
 */
export function RefusalView({
  submission,
  titleRef,
}: {
  readonly submission: Submission;
  readonly titleRef?: Ref<HTMLHeadingElement>;
}) {
  const kind = refusalKind(submission);
  const last = submission.lastResubmittedAt ?? submission.firstSubmittedAt;
  return (
    <VendorEditorRefusal
      titleId={TITLE_ID}
      titleRef={titleRef}
      eyebrow={subLineWords(submission.content.name)}
      title={REFUSAL.titles[kind]}
      text={
        kind === 'already-submitted'
          ? alreadySubmittedLine(last ? dayMonthYear(last) : '')
          : REFUSAL.lines[kind]
      }
      actions={<WaysOn id={submission.id} />}
    />
  );
}
