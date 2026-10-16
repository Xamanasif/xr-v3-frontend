'use client';

import type { Submission, Technology } from '@xr/domain';
import { FORMAT_META, inDisplayOrder } from '@xr/domain';
import { FormatBadge, Icon, Link, Notice } from '@xr/ui';
import { Fragment, type Ref } from 'react';

import { stateWords } from '@/copy/state-copy';
import {
  DONE,
  joinedWords,
  READ_ONLY,
  recordMetaWords,
  resubmittedLine,
  submittedLead,
} from '@/copy/vendor-editor';
import { experimentRecordAddress, MY_EXPERIMENTS_ADDRESS, VENDOR_HELP_ADDRESS } from '@/nav/vendor';

import { DONE_ID, ID_PREFIX, TITLE_ID } from './editor-view';

// ---- after Submit / Resubmit (B5-05 f1; B5-07 f4) -----------------------------------------------

/**
 * The drawn result in place of the editor (`div.xr-msg#Vm-done`, left-aligned): “Submitted for
 * academic review” after the first submit (f1, the ok tint), “Submitted” after a resubmit — the
 * Vendor reads “Submitted”, never the next gate (M-3; B5-07 f4, the neutral tint). Its actions: the
 * record (VE-07) and My experiments.
 */
export function DoneState({
  kind,
  id,
  name,
  ref,
}: {
  readonly kind: 'submitted' | 'resubmitted';
  readonly id: string;
  readonly name: string;
  readonly ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      className="xr-msg [margin:16px_0] items-start text-left"
      id={DONE_ID}
      tabIndex={-1}
      ref={ref}
    >
      {kind === 'submitted' ? (
        <>
          <span className="xr-msg-icon xr-x-msg-icon--ok">
            <Icon name="done" />
          </span>
          <h1 className="xr-msg-title">{DONE.submittedTitle}</h1>
          <p className="xr-lead m-0">{submittedLead(id, name)}</p>
        </>
      ) : (
        <>
          <span className="xr-msg-icon">
            <Icon name="done" />
          </span>
          <h1 className="xr-msg-title">{DONE.resubmittedTitle}</h1>
          <p className="xr-lead m-0">{DONE.resubmittedLead}</p>
          <p className="xl-meta m-0">{resubmittedLine(id, name)}</p>
        </>
      )}
      <div className="xr-msg-actions">
        <Link className="xr-btn xr-btn--primary" href={experimentRecordAddress(id)}>
          {DONE.openRecord}
        </Link>
        <Link className="xr-btn xr-btn--text" href={MY_EXPERIMENTS_ADDRESS}>
          {DONE.backToList}
        </Link>
      </div>
    </div>
  );
}

// ---- read-only (B5-07 f6) and not editable here (the board's idle notices) ----------------------

/** One format's delivery as entered (`div.xv-deliv`, the script's `o.delivery`). */
function deliveryRows(submission: Submission, format: Technology): readonly [string, string][] {
  const entry = submission.content.delivery[format];
  const value = (text: string | null | undefined) => text?.trim() || READ_ONLY.empty;
  if (format === 'web') {
    const web = entry?.format === 'web' ? entry : null;
    return [
      [READ_ONLY.webLink, value(web?.webLink)],
      [READ_ONLY.browser, value(web?.browserAndComputer)],
      ...(web?.notes?.trim() ? [[READ_ONLY.notes, web.notes.trim()] as [string, string]] : []),
    ];
  }
  const pkg = entry && entry.format !== 'web' ? entry : null;
  return [
    [READ_ONLY.packageLabel, value(pkg?.packageLabel)],
    [READ_ONLY.packageReference, value(pkg?.packageReference)],
    ...(pkg?.packageFileName
      ? [[READ_ONLY.packageFile, pkg.packageFileName] as [string, string]]
      : []),
    [READ_ONLY.device, value(pkg?.deviceNeeded)],
    [READ_ONLY.install, value(pkg?.installNotes)],
    ...(pkg?.notes?.trim() ? [[READ_ONLY.notes, pkg.notes.trim()] as [string, string]] : []),
  ];
}

/** “What you entered” (`section.xr-section#Vm-rod`): course, summary, version, formats, delivery. */
function WhatYouEntered({
  submission,
  courseLine,
}: {
  readonly submission: Submission;
  readonly courseLine: string;
}) {
  const titleId = `${ID_PREFIX}-rod`;
  const formats = inDisplayOrder(submission.content.formats);
  const rows: readonly [string, string][] = [
    [READ_ONLY.rows.course, courseLine],
    [READ_ONLY.rows.summary, submission.content.summary?.trim() || READ_ONLY.empty],
    [READ_ONLY.rows.version, submission.content.version?.trim() || READ_ONLY.empty],
    [
      READ_ONLY.rows.formats,
      joinedWords(
        formats.map((format) => FORMAT_META[format].code),
        READ_ONLY.empty,
      ),
    ],
  ];
  return (
    <section className="xr-section" aria-labelledby={titleId}>
      <div className="xr-section-head">
        <h2 id={titleId} className="xr-h2">
          {READ_ONLY.entered}
        </h2>
      </div>
      <div className="xr-section-body">
        <dl className="xl-kv xv-kv">
          {rows.map(([term, value]) => (
            <Fragment key={term}>
              <dt>{term}</dt>
              <dd>{value}</dd>
            </Fragment>
          ))}
        </dl>
        {formats.map((format) => (
          <div key={format} className="xv-deliv">
            <div className="xv-deliv-head">
              <FormatBadge format={FORMAT_META[format].code} compact />
              <span className="font-[700]">
                {format === 'web' ? READ_ONLY.webTitle : READ_ONLY.packageTitle}
              </span>
            </div>
            <dl className="xl-kv xv-kv">
              {deliveryRows(submission, format).map(([term, value]) => (
                <Fragment key={term}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

/** The record's header in the read-only views: “SUB-0083 · MEL ZG512” over the name (`m.recMeta`). */
function RecordHeader({
  submission,
  code,
  titleRef,
  spaced = false,
}: {
  readonly submission: Submission;
  readonly code: string | null;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** The read-only draft's header keeps 16 px below it (B5-07 f6 `margin:8px 0 16px`). */
  readonly spaced?: boolean;
}) {
  return (
    <div className={spaced ? 'xr-phead [margin:8px_0_16px]' : 'xr-phead [margin:8px_0_0]'}>
      <div className="xr-phead-main">
        <span className="xr-overline">
          {recordMetaWords(submission.id, code, submission.revision)}
        </span>
        <h1 className="xr-h1" id={TITLE_ID} tabIndex={-1} ref={titleRef}>
          {submission.content.name}
        </h1>
      </div>
    </div>
  );
}

/**
 * B5-07 f6: a draft whose course is no longer one of the Vendor's (OD-B5-01) opens read-only —
 * the warn notice, “What you entered” and the ways out (My experiments, Help). Nothing can be
 * changed or submitted.
 */
export function ReadOnlyView({
  submission,
  code,
  courseLine,
  noticeTitle,
  noticeLine,
  titleRef,
}: {
  readonly submission: Submission;
  readonly code: string | null;
  readonly courseLine: string;
  readonly noticeTitle: string;
  readonly noticeLine: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <>
      <RecordHeader submission={submission} code={code} titleRef={titleRef} spaced />
      <Notice tone="warn" title={noticeTitle}>
        {noticeLine}
      </Notice>
      <WhatYouEntered submission={submission} courseLine={courseLine} />
      <div className="xw-actions">
        <Link className="xr-btn xr-btn--secondary" href={MY_EXPERIMENTS_ADDRESS}>
          {READ_ONLY.backToList}
        </Link>
        <Link className="xr-btn xr-btn--text" href={VENDOR_HELP_ADDRESS}>
          {READ_ONLY.help}
        </Link>
      </div>
    </>
  );
}

/**
 * An editor address for a record that is with others now (the board's `idle` notices): with the
 * Academic Reviewer, Submitted (after a resubmit, M-3), else the register's notice — each with
 * “Open the experiment record” — then “What you entered”. Nothing can be changed here.
 */
export function NotEditableView({
  submission,
  code,
  courseLine,
  titleRef,
}: {
  readonly submission: Submission;
  readonly code: string | null;
  readonly courseLine: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
}) {
  const state = submission.status.state;
  const resubmitted =
    state === 'resubmitted' ||
    (state === 'with-academic-reviewer' &&
      submission.status.reason === 'resubmission' &&
      submission.revision > 1);
  const [title, line] = resubmitted
    ? [READ_ONLY.submittedTitle, READ_ONLY.submittedLine]
    : state === 'with-academic-reviewer'
      ? [READ_ONLY.withReviewerTitle, READ_ONLY.withReviewerLine]
      : [stateWords('VE-09.not-editable-title'), stateWords('VE-09.not-editable-line')];
  return (
    <>
      <RecordHeader submission={submission} code={code} titleRef={titleRef} />
      <Notice
        tone="info"
        title={title}
        actions={
          <Link
            className="xr-btn xr-btn--secondary xr-btn--sm"
            href={experimentRecordAddress(submission.id)}
          >
            {READ_ONLY.openRecord}
          </Link>
        }
      >
        {line}
      </Notice>
      <WhatYouEntered submission={submission} courseLine={courseLine} />
    </>
  );
}
