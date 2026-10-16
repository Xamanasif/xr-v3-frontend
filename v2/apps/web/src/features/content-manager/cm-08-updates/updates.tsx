'use client';

import type { CorrectionUpdate, UpdateState } from '@xr/domain';
import { Icon, Link, PageContent, PageHeader, StatusPill, type StatusTone } from '@xr/ui';
import { useId } from 'react';

import { dayMonthYear } from '@/copy/dates';
import { updateWords, wordsOf } from '@/copy/flow-state-words';
import {
  continuesUpdate,
  updateActionLabel,
  updateLineWords,
  UPDATES_LIST,
  updatesCountWords,
  WITH_WORDS,
} from '@/copy/review-update';
import { stateWords } from '@/copy/state-copy';
import {
  CONTENT_LIBRARY_ADDRESS,
  correctionAddress,
  UPDATES_TITLE,
  updatesPlacement,
} from '@/nav/content-manager';
import type { MyUpdateRow } from '@/queries/correction-view';
import { useMyUpdates } from '@/queries/corrections';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { LoadFailed, LoadingRows, useRetryFocus } from '../cm-02-ready/list-parts';

/** The status chip’s tone (B6-09 script `stk`): draft and withdrawn off, decided ok, … */
const STATE_TONE: Readonly<Record<UpdateState, StatusTone>> = {
  draft: 'off',
  'in-academic-review': 'wait',
  returned: 'err',
  'awaiting-release-decision': 'wait',
  'on-hold': 'paused',
  released: 'ok',
  withdrawn: 'off',
};

/**
 * The “last change” under the status (state-copy `CM-08.list.rows`): the day of the update’s
 * latest step in its history — a draft save writes none, so a draft shows the day it started.
 */
export function lastChangeOf(update: CorrectionUpdate): string {
  return update.history.at(-1)?.at ?? update.updatedAt;
}

/** Who has it now, in words (B6-09 script `withw`): You, the Academic Reviewer, … or “—”. */
export function withWords(withWhom: MyUpdateRow['withWhom']): string {
  return WITH_WORDS[withWhom ?? 'none'];
}

/**
 * CM-08 Updates — board B6-09 f0 (B6-13 f2; B7-11 f2), at `/content-manager/updates`: “Which
 * corrections did I raise, where is each one, and who has it now?”.
 *
 * - **Read**: `CorrectionService.listUpdates` — every correction the Content Manager may see, the
 *   newest change first, each with the experiment’s live name and who has it now (the service’s
 *   `withWhom`). A step in the chain — hers, the Academic Reviewer’s or the Super Admin’s — in the
 *   same tab refreshes it (the read’s deps).
 * - **As B6-09 draws it**: “Updates” with its one-line purpose (“you → Academic Reviewer → Super
 *   Admin release”); “Corrections you raised” · “<n> updates”; the table Update (“<name> · <version>”,
 *   the UPD id) · Status · last change (the role’s words in the board’s tone over the day of the
 *   latest step) · With · the action — “Continue” while it is hers (draft, returned), else “Open”;
 *   both open the correction page. Below 760 px of content the rows become labelled blocks.
 * - **Empty** (`uNoRows`): “You haven’t raised any corrections” with “Open the Content library”.
 * - Undrawn: loading and failed + Try again (state-copy `CM-08.list.loading`, `CM-08.list.failed`).
 *   Nothing here changes a record: every action opens the page where the work is done.
 */
export function Updates() {
  useShellPage(updatesPlacement());
  const headingId = useId();
  const read = useMyUpdates();
  const rows = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const retried = useRetryFocus(rows !== null);

  const retry = () => {
    retried();
    void read.refetch();
  };

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-6"
        title={UPDATES_TITLE}
        meta={<span className="xl-meta">{UPDATES_LIST.lead}</span>}
      />
      <section
        className="xr-section"
        aria-labelledby={headingId}
        aria-busy={rows === null && !failed ? true : undefined}
      >
        <div className="xr-section-head">
          <h2 id={headingId} className="xr-h2">
            {UPDATES_LIST.sectionTitle}
          </h2>
          {rows !== null ? <span className="xr-meta">{updatesCountWords(rows.length)}</span> : null}
        </div>
        {failed ? (
          <LoadFailed title={stateWords('CM-08.list.failed')} onRetry={retry} />
        ) : rows === null ? (
          <LoadingRows
            label={stateWords('CM-08.list.loading')}
            grid="grid-cols-[1.4fr_1fr_.8fr_120px]"
            cells={4}
          />
        ) : rows.length === 0 ? (
          <Empty />
        ) : (
          <UpdatesTable rows={rows} />
        )}
      </section>
    </PageContent>
  );
}

/** f0: the table; stacked labelled blocks below 760 px of content. */
function UpdatesTable({ rows }: { readonly rows: readonly MyUpdateRow[] }) {
  const { columns, labels } = UPDATES_LIST;
  return (
    <div className="xr-table-wrap rounded-none border-x-0 border-b-0">
      <table className="xr-table">
        <thead>
          <tr>
            <th scope="col">{columns.update}</th>
            <th scope="col">{columns.status}</th>
            <th scope="col">{columns.with}</th>
            <th scope="col">
              <span className="xr-sr">{columns.action}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ update, experimentName, withWhom }) => (
            <tr key={update.id}>
              <td className="is-primary">
                <strong>{updateLineWords(experimentName, update.versionLabel)}</strong>
                <span className="xr-meta block">
                  <span className="xr-id">{update.id}</span>
                </span>
              </td>
              <td data-label={labels.status}>
                <StatusPill tone={STATE_TONE[update.state]}>
                  {wordsOf(updateWords(update.state, 'content_manager')) ?? ''}
                </StatusPill>
                <span className="xr-meta xw-nowrap block mt-[2px]">
                  {dayMonthYear(lastChangeOf(update))}
                </span>
              </td>
              <td data-label={labels.with}>{withWords(withWhom)}</td>
              <td>
                <Link
                  className="xr-btn xr-btn--secondary xr-btn--sm"
                  href={correctionAddress(update.id)}
                  aria-label={updateActionLabel(update.state, update.id, experimentName)}
                >
                  {continuesUpdate(update.state) ? UPDATES_LIST.continue : UPDATES_LIST.open}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** `uNoRows`: the Updates icon, “You haven’t raised any corrections” and the Content library. */
function Empty() {
  return (
    <div className="xr-section-body">
      <div className="xr-empty">
        <span className="xr-empty-icon">
          <Icon name="updates" />
        </span>
        <h3 className="xr-h3 m-0">{UPDATES_LIST.emptyTitle}</h3>
        <p className="xr-body m-0 text-ink-2">{UPDATES_LIST.emptyLine}</p>
        <div className="flex flex-wrap gap-3">
          <Link className="xr-btn xr-btn--secondary" href={CONTENT_LIBRARY_ADDRESS}>
            {UPDATES_LIST.openLibrary}
          </Link>
        </div>
      </div>
    </div>
  );
}
