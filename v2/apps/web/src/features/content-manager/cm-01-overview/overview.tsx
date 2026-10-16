'use client';

import type { contentManagerOverviewOutput, Out } from '@xr/contracts/draft';
import { Icon, Link, PageContent, PageHeader, Row, Rows } from '@xr/ui';
import { useId } from 'react';

import {
  CM_OVERVIEW,
  openDecisionLabel,
  openLabel,
  overviewStatusLine,
  readySub,
  readyTitle,
  recheckSub,
  recheckTitle,
  updateAwaitingSub,
  updateAwaitingTitle,
  updateInReviewSub,
  updateInReviewTitle,
  updateOnHoldSub,
  updateOnHoldTitle,
  updateReturnedSub,
  updateReturnedTitle,
} from '@/copy/cm-lists';
import { stateWords } from '@/copy/state-copy';
import {
  CM_OVERVIEW_TITLE,
  cmOverviewPlacement,
  CONTENT_LIBRARY_ADDRESS,
  correctionAddress,
  publicationDecisionAddress,
} from '@/nav/content-manager';
import { useContentManagerOverview } from '@/queries/production';
import { useCurrentSession } from '@/queries/session';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { LoadFailed, LoadingRows, useRetryFocus } from '../cm-02-ready/list-parts';

type Overview = Out<typeof contentManagerOverviewOutput>;
type Attention = Overview['attention'][number];
type WithOthers = Overview['withOthers'][number];

/**
 * CM-01 Overview, the Content Manager workspace home — board B6-05 f0 … f2, at
 * `/content-manager`: “What is waiting for my publication decision?”.
 *
 * - **Read**: `ProductionService.getContentManagerOverview` — facts (PC-64): each experiment ready
 *   to publish (oldest approval first) and each correction returned to her, then what she sent on
 *   that sits with others (a re-check with the Academic Reviewer, a correction in academic review,
 *   awaiting release or on hold), newest first. Every word is written here from those facts
 *   (`@/copy/cm-lists`); the overline is the session’s name. An approval, a publication, a
 *   send-back or a correction step in the same tab refreshes it (the read’s deps).
 * - **As B6-05 draws it**: the one status line “2 ready to publish · 1 correction needs you · 3
 *   with others” (announced) and “Content library”; “Needs your decision” — the oldest ready item
 *   with the one primary “Open the next ready item”, the others with “Open decision” (CM-03), the
 *   returned corrections; “With others — For information — nothing to do”. f1: “Nothing is waiting
 *   for your publication decision” with “Open the Content library”. At 375 the rows stack (f2).
 * - **Row actions** (state-copy `CM-01.row-actions`): a re-check row’s “Open” opens CM-03
 *   (read-only while the reviewer has it); a returned correction’s “Open update” and every “With
 *   others” correction’s “Open” open the correction page (CM-08, Phase 6).
 * - Undrawn: loading and failed + Try again (state-copy `CM-01.loading`, `CM-01.failed`).
 *   Nothing here changes a record: every action opens the page where the work is done.
 */
export function CmOverview() {
  useShellPage(cmOverviewPlacement());
  const session = useCurrentSession();
  const name = session.data?.ok ? (session.data.value?.session.displayName ?? null) : null;
  const read = useContentManagerOverview();
  const overview = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const retried = useRetryFocus(overview !== null);

  const retry = () => {
    retried();
    void read.refetch();
  };

  const ready = overview?.attention.filter((row) => row.kind === 'ready-to-publish') ?? [];
  const returned = overview?.attention.filter((row) => row.kind === 'update-returned') ?? [];

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-6"
        overline={name}
        title={CM_OVERVIEW_TITLE}
        meta={
          <p className="xv-statusline" role="status">
            {overview
              ? overviewStatusLine({
                  ready: ready.length,
                  corrections: returned.length,
                  withOthers: overview.withOthers.length,
                }).map((fact) => (
                  <span key={fact.t}>
                    <strong>{fact.n}</strong> {fact.t}
                  </span>
                ))
              : null}
          </p>
        }
        actions={
          <Link className="xr-btn xr-btn--secondary" href={CONTENT_LIBRARY_ADDRESS}>
            <Icon name="contentLibrary" />
            {CM_OVERVIEW.contentLibrary}
          </Link>
        }
      />
      {failed ? (
        <div className="xr-section">
          <LoadFailed title={stateWords('CM-01.failed')} onRetry={retry} />
        </div>
      ) : overview === null ? (
        <section className="xr-section" aria-busy="true">
          <div className="xr-section-head">
            <h2 className="xr-h2">{CM_OVERVIEW.needsDecision}</h2>
          </div>
          <LoadingRows label={stateWords('CM-01.loading')} grid="grid-cols-[1fr_180px]" cells={2} />
        </section>
      ) : (
        <>
          {overview.attention.length > 0 ? (
            <NeedsDecision attention={overview.attention} readyCount={ready.length} />
          ) : (
            <NothingWaiting />
          )}
          {overview.withOthers.length > 0 ? <WithOthersSection rows={overview.withOthers} /> : null}
        </>
      )}
    </PageContent>
  );
}

/** “Needs your decision”: the ready items, oldest first, then the returned corrections (f0, f2). */
function NeedsDecision({
  attention,
  readyCount,
}: {
  readonly attention: readonly Attention[];
  readonly readyCount: number;
}) {
  const headingId = useId();
  const oldest = attention.find((row) => row.kind === 'ready-to-publish');
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {CM_OVERVIEW.needsDecision}
        </h2>
      </div>
      <Rows>
        {attention.map((row) => {
          if (row.kind === 'ready-to-publish') {
            const first = row === oldest;
            return (
              <Row
                key={row.submissionId}
                icon="readyToPublish"
                tone="info"
                title={readyTitle(row.name)}
                sub={readySub({
                  id: row.submissionId,
                  courseCode: row.courseCode,
                  approvedAt: row.approvedAt,
                  ...(first ? { oldestOf: readyCount } : {}),
                })}
              >
                {first ? (
                  <Link
                    className="xr-btn xr-btn--primary xr-btn--sm"
                    href={publicationDecisionAddress(row.submissionId)}
                  >
                    {CM_OVERVIEW.openNextReady}
                  </Link>
                ) : (
                  <Link
                    className="xr-btn xr-btn--secondary xr-btn--sm"
                    href={publicationDecisionAddress(row.submissionId)}
                    aria-label={openDecisionLabel(row.name)}
                  >
                    {CM_OVERVIEW.openDecision}
                  </Link>
                )}
              </Row>
            );
          }
          // “Open update” opens the returned correction (CM-08; B6-05 `D.links.cupd`).
          return (
            <Row
              key={row.updateId}
              icon="updates"
              tone="err"
              title={updateReturnedTitle(row.name, row.versionLabel)}
              sub={updateReturnedSub({
                id: row.updateId,
                returnedAt: row.returnedAt,
                reason: row.reason,
              })}
            >
              <Link
                className="xr-btn xr-btn--secondary xr-btn--sm"
                href={correctionAddress(row.updateId)}
              >
                {CM_OVERVIEW.openUpdate}
              </Link>
            </Row>
          );
        })}
      </Rows>
    </section>
  );
}

/** f1 “Nothing waiting”: the calm state, the Content library one click away. */
function NothingWaiting() {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon xr-x-empty-icon--ok">
          <Icon name="done" />
        </span>
        <h2 className="xr-h3 m-0">{CM_OVERVIEW.nothingTitle}</h2>
        <p className="xr-body m-0 text-ink-2">{CM_OVERVIEW.nothingLine}</p>
        <div className="flex flex-wrap gap-3">
          <Link className="xr-btn xr-btn--secondary" href={CONTENT_LIBRARY_ADDRESS}>
            {CM_OVERVIEW.openLibrary}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** “With others — For information — nothing to do” (f0, f2), newest first as the service answers. */
function WithOthersSection({ rows }: { readonly rows: readonly WithOthers[] }) {
  const headingId = useId();
  return (
    <section className="xr-section mt-6" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {CM_OVERVIEW.withOthers}
        </h2>
        <span className="xr-meta">{CM_OVERVIEW.withOthersMeta}</span>
      </div>
      <Rows>
        {rows.map((row) => {
          switch (row.kind) {
            case 'recheck':
              return (
                <Row
                  key={row.submissionId}
                  icon="clock"
                  tone="wait"
                  title={recheckTitle(row.name)}
                  sub={recheckSub(row.submissionId, row.sentAt)}
                >
                  <Link
                    className="xr-btn xr-btn--text xr-btn--sm"
                    href={publicationDecisionAddress(row.submissionId)}
                    aria-label={openLabel(row.name)}
                  >
                    {CM_OVERVIEW.open}
                  </Link>
                </Row>
              );
            // A correction row’s “Open” opens the correction page (CM-08; `D.links.cupd`).
            case 'update-in-review':
              return (
                <Row
                  key={row.updateId}
                  icon="clock"
                  tone="wait"
                  title={updateInReviewTitle(row.name, row.versionLabel)}
                  sub={updateInReviewSub(row.updateId, row.sentAt)}
                >
                  <OpenUpdate id={row.updateId} name={row.name} />
                </Row>
              );
            case 'update-awaiting-release':
              return (
                <Row
                  key={row.updateId}
                  icon="clock"
                  tone="wait"
                  title={updateAwaitingTitle(row.name, row.versionLabel)}
                  sub={updateAwaitingSub(row.updateId, row.approvedAt)}
                >
                  <OpenUpdate id={row.updateId} name={row.name} />
                </Row>
              );
            case 'update-on-hold':
              return (
                <Row
                  key={row.updateId}
                  icon="clock"
                  tone="wait"
                  title={updateOnHoldTitle(row.name, row.versionLabel)}
                  sub={updateOnHoldSub(row.updateId, row.heldAt, row.liveLabel)}
                >
                  <OpenUpdate id={row.updateId} name={row.name} />
                </Row>
              );
          }
        })}
      </Rows>
    </section>
  );
}

/** A “With others” correction’s text link (`a.xr-btn--text.xr-btn--sm`), named “Open <name>”. */
function OpenUpdate({ id, name }: { readonly id: string; readonly name: string }) {
  return (
    <Link
      className="xr-btn xr-btn--text xr-btn--sm"
      href={correctionAddress(id)}
      aria-label={openLabel(name)}
    >
      {CM_OVERVIEW.open}
    </Link>
  );
}
