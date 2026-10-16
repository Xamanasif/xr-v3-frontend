'use client';

import type { Out, readyToPublishOutput } from '@xr/contracts/draft';
import { Icon, Link, PageContent, PageHeader, StatusPill } from '@xr/ui';
import { useId } from 'react';

import {
  blockerWords,
  openDecisionLabel,
  READY_TO_PUBLISH,
  readyCountWords,
} from '@/copy/cm-lists';
import { dayMonthYear } from '@/copy/dates';
import { stateWords } from '@/copy/state-copy';
import {
  CONTENT_LIBRARY_ADDRESS,
  publicationDecisionAddress,
  READY_TO_PUBLISH_TITLE,
  readyToPublishPlacement,
} from '@/nav/content-manager';
import { usePlatformCourseCodes, useReadyToPublish } from '@/queries/production';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { FormatChips, LoadFailed, LoadingRows, useRetryFocus } from './list-parts';

/** One approved submission, its approval and the service’s publication check. */
export type ReadyRow = Out<typeof readyToPublishOutput>[number];

/** The conditions of a row’s publication check that are not met, in the service’s order. */
export function openChecks(check: ReadyRow['check']) {
  return check.filter((item) => !item.ok).map((item) => item.check);
}

/**
 * CM-02 Ready to publish — board B6-06 f0, f2, f3 (and B6-12 f2), at `/content-manager/ready`:
 * “What is approved and waiting for my publication decision?”.
 *
 * - **Read**: `ProductionService.listReadyToPublish` — every submission the Academic Reviewer
 *   approved that is with the Content Manager, with its approval and the service’s publication
 *   check (the sidebar counts the same read). Oldest approval first; each row’s course code is
 *   the platform code of its course (`PlatformCourseCodeService.list`). Approving, publishing,
 *   sending back or a code saved in the same tab refreshes it (the reads’ deps).
 * - **As B6-06 draws it**: “Approved by the Academic Reviewer” with “<n> experiments approved and
 *   waiting · oldest first”, and the table Experiment (name, id · course · vendor) · Formats ·
 *   Approved (date, reviewer) · Publication check (“Ready”, or f2’s “1 to resolve: learning
 *   outcomes”, state-copy `CM-02.blockers`) · “Open decision” (each row’s primary, to CM-03).
 *   Below 760 px of content the rows become labelled blocks (f2). f3: “Nothing is ready to
 *   publish” with “Open the Content library”.
 * - Nothing here changes a record: the decision is made on CM-03, through DL-1.
 * - Undrawn: loading and failed + Try again (state-copy `CM-02.loading`, `CM-02.failed`).
 */
export function ReadyToPublish() {
  useShellPage(readyToPublishPlacement());
  const headingId = useId();
  const read = useReadyToPublish();
  const courses = usePlatformCourseCodes();
  const rows = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const retried = useRetryFocus(rows !== null);
  const codeOf = (courseId: string | null): string | null =>
    (courses.data?.ok
      ? courses.data.value.find((row) => row.course.id === courseId)?.course.platformCode
      : null) ?? null;

  const retry = () => {
    retried();
    void read.refetch();
  };

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-6"
        title={READY_TO_PUBLISH_TITLE}
        meta={<span className="xl-meta">{READY_TO_PUBLISH.meta}</span>}
      />
      <section
        className="xr-section"
        aria-labelledby={headingId}
        aria-busy={rows === null && !failed ? true : undefined}
      >
        <div className="xr-section-head">
          <h2 id={headingId} className="xr-h2">
            {READY_TO_PUBLISH.sectionTitle}
          </h2>
          {rows !== null ? <span className="xr-meta">{readyCountWords(rows.length)}</span> : null}
        </div>
        {failed ? (
          <LoadFailed title={stateWords('CM-02.failed')} onRetry={retry} />
        ) : rows === null ? (
          <LoadingRows
            label={stateWords('CM-02.loading')}
            grid="grid-cols-[1.8fr_.8fr_.8fr_.8fr_140px]"
            cells={5}
          />
        ) : rows.length === 0 ? (
          <Empty />
        ) : (
          <ReadyTable rows={rows} codeOf={codeOf} />
        )}
      </section>
    </PageContent>
  );
}

/** f0, f2: the table; stacked labelled blocks below 760 px of content. */
function ReadyTable({
  rows,
  codeOf,
}: {
  readonly rows: readonly ReadyRow[];
  readonly codeOf: (courseId: string | null) => string | null;
}) {
  const { columns } = READY_TO_PUBLISH;
  return (
    <div className="xr-table-wrap rounded-none border-x-0 border-b-0">
      <table className="xr-table">
        <thead>
          <tr>
            <th scope="col">{columns.experiment}</th>
            <th scope="col">{columns.formats}</th>
            <th scope="col">{columns.approved}</th>
            <th scope="col">{columns.check}</th>
            <th scope="col">
              <span className="xr-sr">{columns.action}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const { submission } = row;
            const name = submission.content.name;
            const open = openChecks(row.check);
            const code = codeOf(submission.content.courseId);
            return (
              <tr key={submission.id}>
                <td className="is-primary">
                  <strong>{name}</strong>
                  <span className="xr-meta block">
                    <span className="xr-id">{submission.id}</span>
                    {code ? (
                      <>
                        {' · '}
                        <span className="xw-nowrap">{code}</span>
                      </>
                    ) : null}
                    {submission.vendorOrganisation ? ` · ${submission.vendorOrganisation}` : null}
                  </span>
                </td>
                <td data-label={columns.formats}>
                  <FormatChips formats={submission.content.formats} />
                </td>
                <td data-label={columns.approved}>
                  <span className="xw-nowrap">{dayMonthYear(row.approvedAt)}</span>
                  <span className="xr-meta block">{row.approvedBy}</span>
                </td>
                <td data-label={columns.check}>
                  {open.length === 0 ? (
                    <StatusPill tone="ok">{READY_TO_PUBLISH.ready}</StatusPill>
                  ) : (
                    <StatusPill tone="err">{blockerWords(open)}</StatusPill>
                  )}
                </td>
                <td>
                  <Link
                    className="xr-btn xr-btn--primary xr-btn--sm"
                    href={publicationDecisionAddress(submission.id)}
                    aria-label={openDecisionLabel(name)}
                  >
                    {READY_TO_PUBLISH.openDecision}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** f3 “Empty”: the done icon in the ok tint, the line and “Open the Content library”. */
function Empty() {
  return (
    <div className="xr-section-body">
      <div className="xr-empty">
        <span className="xr-empty-icon xr-x-empty-icon--ok">
          <Icon name="done" />
        </span>
        <h3 className="xr-h3 m-0">{READY_TO_PUBLISH.emptyTitle}</h3>
        <p className="xr-body m-0 text-ink-2">{READY_TO_PUBLISH.emptyLine}</p>
        <div className="flex flex-wrap gap-3">
          <Link className="xr-btn xr-btn--secondary" href={CONTENT_LIBRARY_ADDRESS}>
            {READY_TO_PUBLISH.openLibrary}
          </Link>
        </div>
      </div>
    </div>
  );
}
