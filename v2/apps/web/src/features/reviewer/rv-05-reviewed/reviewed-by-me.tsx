'use client';

import type { Out, reviewedByMeOutput } from '@xr/contracts/draft';
import { Field, Icon, Link, PageContent, PageHeader, Section, Select, StatusPill } from '@xr/ui';
import { type ReactNode, useRef, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import { reviewedByMeWords, wordsOf } from '@/copy/flow-state-words';
import {
  approvedOnlyWords,
  decisionsCountWords,
  openLabel,
  REVIEWED_BY_ME,
  type ReviewedFilter,
} from '@/copy/reviewer-lists';
import { stateWords } from '@/copy/state-copy';
import {
  REVIEWED_BY_ME_TITLE,
  reviewedByMePlacement,
  reviewSubmissionAddress,
  reviewUpdateAddress,
} from '@/nav/reviewer';
import { useReviewedByMe } from '@/queries/production';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { ReviewerFailed, ReviewerLoading, useRetryFocus } from '../rv-02-queue/list-states';

export type DecidedRow = Out<typeof reviewedByMeOutput>[number];

/** The Show filter (`rbShown`): an update, else a new submission (a re-check included). */
export function showsRow(filter: ReviewedFilter, row: DecidedRow): boolean {
  if (filter === 'update') return row.type === 'update';
  if (filter === 'new') return row.type !== 'update';
  return true;
}

/** The decision’s words and tone (B6-02 f1 `dec`, `kind`): approved ok, returned err. */
export function decisionView(row: DecidedRow): { readonly words: string; readonly ok: boolean } {
  const ok = row.decision.decision === 'approve';
  const words =
    wordsOf(reviewedByMeWords(row)) ?? (ok ? approvedOnlyWords(row.type === 'update') : null);
  // A return is always drawn (`reviewedByMeWords`); the fallback is for an approval only.
  return { words: words ?? '', ok };
}

/** When the reviewer decided: a submission decision’s `decidedAt`, an update decision’s `at`. */
function decidedAt(row: DecidedRow): string {
  const decision = row.decision as { readonly decidedAt?: string; readonly at?: string };
  return decision.decidedAt ?? decision.at ?? '';
}

const FILTERS: readonly ReviewedFilter[] = ['all', 'new', 'update'];

/**
 * RV-05 Reviewed by me — board B6-02 f1, at `/reviewer/reviewed`.
 *
 * - **Read**: `ProductionService.listReviewedByMe` — each record the reviewer decided, with the
 *   last decision on it, newest first, and where the record is now.
 * - **As B6-02 draws it**: “Reviewed by me” with its one-line purpose; “Your decisions” ·
 *   “Read-only · newest first”; the Show filter (Everything I decided · New submissions ·
 *   Updates), the polite count “<n> of <n> decisions”; the table Item (name, “ID · code”) · Type ·
 *   Your decision (the decision and where it is now, in words: `reviewedByMeWords`, ok or err) ·
 *   Decided on · Open — the decided page (RV-06) for a submission, RV-04’s decided view for an
 *   update (Phase 6; state-copy `RV-05.update-row`). “Nothing decided yet” when the filter leaves
 *   nothing.
 * - Undrawn: loading and failed with “Try again” (state-copy `RV-05.loading`, `RV-05.failed`);
 *   an approval whose record is now somewhere the board draws no line for (`RV-05.approved`).
 */
export function ReviewedByMe() {
  useShellPage(reviewedByMePlacement());
  const read = useReviewedByMe();
  const [filter, setFilter] = useState<ReviewedFilter>('all');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const rows = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const retried = useRetryFocus(rows !== null, headingRef);

  const retry = () => {
    retried();
    void read.refetch();
  };

  let body: ReactNode;
  if (failed) {
    body = (
      <div className="xr-section-body">
        <ReviewerFailed title={stateWords('RV-05.failed')} onRetry={retry} />
      </div>
    );
  } else if (rows === null) {
    body = <ReviewerLoading label={stateWords('RV-05.loading')} />;
  } else {
    const shown = rows.filter((row) => showsRow(filter, row));
    body = (
      <>
        <div className="xr-toolbar [padding:0_24px_16px]">
          <Field id="rb-f" label={REVIEWED_BY_ME.show}>
            <Select
              value={filter}
              onChange={(event) => setFilter(event.target.value as ReviewedFilter)}
              options={FILTERS.map((value) => ({
                value,
                label: REVIEWED_BY_ME.filters[value],
              }))}
            />
          </Field>
        </div>
        <div className="xr-toolbar-status [padding:0_24px_12px]">
          <span className="xr-meta" role="status">
            {decisionsCountWords(shown.length, rows.length)}
          </span>
        </div>
        {shown.length > 0 ? <DecisionsTable rows={shown} /> : <NothingDecided />}
      </>
    );
  }

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-6"
        title={REVIEWED_BY_ME_TITLE}
        meta={<span className="xl-meta">{REVIEWED_BY_ME.lead}</span>}
      />
      <Section
        title={REVIEWED_BY_ME.sectionTitle}
        headingId="rb-rh"
        headingFocusTarget
        headingRef={headingRef}
        meta={REVIEWED_BY_ME.meta}
      >
        {body}
      </Section>
    </PageContent>
  );
}

/** B6-02 f1 table: Item · Type · Your decision · Decided on · Open. */
function DecisionsTable({ rows }: { readonly rows: readonly DecidedRow[] }) {
  const { columns } = REVIEWED_BY_ME;
  return (
    <div className="xr-table-wrap rounded-none border-x-0 border-b-0">
      <table className="xr-table">
        <thead>
          <tr>
            <th scope="col">{columns.item}</th>
            <th scope="col">{columns.type}</th>
            <th scope="col">{columns.decision}</th>
            <th scope="col">{columns.decidedOn}</th>
            <th scope="col">
              <span className="xr-sr">{columns.action}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const decision = decisionView(row);
            const at = decidedAt(row);
            return (
              <tr key={`${row.recordRef.kind}:${row.recordRef.id}`}>
                <td className="is-primary">
                  <strong>{row.name}</strong>
                  <span className="xr-meta block">
                    <span className="xr-id">{row.recordRef.id}</span>
                    {row.courseCode ? (
                      <>
                        {' · '}
                        <span className="xw-nowrap">{row.courseCode}</span>
                      </>
                    ) : null}
                  </span>
                </td>
                <td data-label={columns.type}>
                  {row.type === 'update' ? REVIEWED_BY_ME.typeUpdate : REVIEWED_BY_ME.typeNew}
                </td>
                <td data-label={columns.decision}>
                  <StatusPill tone={decision.ok ? 'ok' : 'err'}>{decision.words}</StatusPill>
                </td>
                <td data-label={columns.decidedOn}>
                  <span className="xw-nowrap">{at ? dayMonthYear(at) : null}</span>
                </td>
                <td>
                  <Link
                    className="xr-btn xr-btn--secondary xr-btn--sm"
                    href={
                      row.recordRef.kind === 'UPD'
                        ? reviewUpdateAddress(row.recordRef.id)
                        : reviewSubmissionAddress(row.recordRef.id)
                    }
                    aria-label={openLabel(row.name)}
                  >
                    {REVIEWED_BY_ME.open}
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

/** B6-02 `rbNone`: the Reviewed-by-me icon and “Nothing decided yet”. */
function NothingDecided() {
  return (
    <div className="xr-section-body">
      <div className="xr-empty">
        <span className="xr-empty-icon">
          <Icon name="reviewedByMe" />
        </span>
        <h3 className="xr-h3 m-0">{REVIEWED_BY_ME.emptyTitle}</h3>
        <p className="xr-body m-0 text-ink-2">{REVIEWED_BY_ME.emptyLine}</p>
      </div>
    </div>
  );
}
