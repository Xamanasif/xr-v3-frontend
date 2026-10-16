'use client';

import {
  AttentionItem,
  Button,
  Icon,
  Link,
  LoadingState,
  PageContent,
  PageHeader,
  Rows,
  Skeleton,
} from '@xr/ui';
import { useId } from 'react';

import { stateWords } from '@/copy/state-copy';
import {
  attentionCountWords,
  CREATE_EXPERIMENT,
  STATUS_LINE,
  VENDOR_FAILED_WORDS,
  VENDOR_OVERVIEW_WORDS,
} from '@/copy/vendor-home';
import {
  type EditorStepSlug,
  MY_EXPERIMENTS_ADDRESS,
  newExperimentAddress,
  vendorOverviewPlacement,
  VENDOR_OVERVIEW_TITLE,
} from '@/nav/vendor';
import { useMyExperiments, useVendorOverview } from '@/queries/production';
import { useCurrentSession } from '@/queries/session';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { type AttentionRow, attentionRows, type VendorOverviewAnswer } from './overview-view';
import { useRetryFocus } from './retry-focus';

/**
 * VE-01 Overview, the Vendor workspace home (board B5-01: “What needs me now?”), at `/vendor`:
 * the status line, then what needs the Vendor's action — attention only; the list of every
 * experiment is My experiments (VE-02), one link away.
 *
 * - **Reads**: `ProductionService.getVendorOverview` — the four status counts, the attention facts
 *   (each returned experiment with the decision that returned it, then each draft) and whether the
 *   Vendor has any experiment — worded here (`@/copy/vendor-home`); `listMyExperiments` (the same
 *   read VE-02 lists) for the step each draft last reached. The overline is the Vendor's
 *   organisation (the session). Every role's command in the tab refreshes it (the reads' deps):
 *   an Academic Reviewer's or Content Manager's return puts “Revise “<name>”” on top (B5-08 f1).
 * - **As B5-01 draws it**: the overline, “Overview” and `p.xv-statusline` (“2 Draft · 1 With
 *   Academic Reviewer · 1 With Content Manager · 1 Published”, a polite status) with the secondary
 *   “Create experiment” (f0, f1, f3); “Needs your action” with its count and one row per fact, the
 *   first row's action primary (f0, f3; B5-08 f1); “Nothing needs you right now” when nothing
 *   waits (f1); “Create your first experiment” with the primary “Create experiment” before the
 *   Vendor has any experiment (f2: no status line). “See all your experiments” under every state.
 * - Undrawn: loading and failed with “Try again” (state-copy `VE-01.loading`, `VE-01.failed`).
 *   Nothing here changes a record: every action opens the page where the work is done.
 */
export function VendorOverview() {
  useShellPage(vendorOverviewPlacement());
  const session = useCurrentSession();
  const organisation = session.data?.ok ? (session.data.value?.session.organisation ?? null) : null;
  const read = useVendorOverview();
  const list = useMyExperiments();
  const answer = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const retried = useRetryFocus(answer !== null);

  const retry = () => {
    retried();
    void read.refetch();
  };

  // The step a draft last reached, from the list (the editor's address; the first step until known).
  const steps = new Map<string, EditorStepSlug>(
    list.data?.ok
      ? list.data.value.map((row) => [row.submission.id, row.submission.lastStepReached])
      : [],
  );

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-6"
        overline={organisation}
        title={VENDOR_OVERVIEW_TITLE}
        meta={answer?.hasExperiments ? <StatusLine counts={answer.statusCounts} /> : null}
        actions={
          <Link className="xr-btn xr-btn--secondary" href={newExperimentAddress()}>
            <Icon name="add" />
            {CREATE_EXPERIMENT}
          </Link>
        }
      />
      {failed ? (
        <Failed onRetry={retry} />
      ) : answer === null ? (
        <Loading />
      ) : answer.attention.length > 0 ? (
        <Attention rows={attentionRows(answer.attention, (id) => steps.get(id))} />
      ) : answer.hasExperiments ? (
        <NothingNeedsYou />
      ) : (
        <FirstExperiment />
      )}
      <p className="xl-meta [margin:16px_0_0]">
        <Link href={MY_EXPERIMENTS_ADDRESS}>{VENDOR_OVERVIEW_WORDS.seeAll}</Link>
      </p>
    </PageContent>
  );
}

/** `p.xv-statusline[role=status]`: “<n> Draft · <n> With Academic Reviewer · …” (B5-01 f0, f1, f3). */
function StatusLine({ counts }: { readonly counts: VendorOverviewAnswer['statusCounts'] }) {
  return (
    <p className="xv-statusline" role="status">
      {STATUS_LINE.map(([key, label]) => (
        <span key={key}>
          <strong>{counts[key]}</strong> {label}
        </span>
      ))}
    </p>
  );
}

/** “Needs your action” with its count and the rows (f0, f3; B5-08 f1). */
function Attention({ rows }: { readonly rows: readonly AttentionRow[] }) {
  const headingId = useId();
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {VENDOR_OVERVIEW_WORDS.attention}
        </h2>
        <span className="xr-meta">{attentionCountWords(rows.length)}</span>
      </div>
      <Rows>
        {rows.map((row) => (
          <AttentionItem
            key={row.key}
            icon={row.icon}
            tone={row.tone}
            title={row.title}
            sub={row.sub}
            action={row.action}
          />
        ))}
      </Rows>
    </section>
  );
}

/** f1 “Nothing needs you”: the empty pattern, the done icon in the ok tint, a secondary Create. */
function NothingNeedsYou() {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon xr-x-empty-icon--ok">
          <Icon name="done" />
        </span>
        <h2 className="xr-h3 m-0">{VENDOR_OVERVIEW_WORDS.calmTitle}</h2>
        <p className="xr-body m-0">{VENDOR_OVERVIEW_WORDS.calmLine}</p>
        <div className="flex flex-wrap gap-3">
          <Link className="xr-btn xr-btn--secondary" href={newExperimentAddress()}>
            <Icon name="add" />
            {CREATE_EXPERIMENT}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** f2 “First visit — no experiments yet”: the primary “Create experiment” moves in here. */
function FirstExperiment() {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon">
          <Icon name="myExperiments" />
        </span>
        <h2 className="xr-h3 m-0">{VENDOR_OVERVIEW_WORDS.firstTitle}</h2>
        <p className="xr-body m-0">{VENDOR_OVERVIEW_WORDS.firstLine}</p>
        <div className="flex flex-wrap gap-3">
          <Link className="xr-btn xr-btn--primary" href={newExperimentAddress()}>
            <Icon name="add" />
            {CREATE_EXPERIMENT}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Undrawn: failed + retry, the Phase-5 boards' formula (B6-02; state-copy `VE-01.failed`). */
function Failed({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon bg-err-bg text-err">
          <Icon name="failed" />
        </span>
        <h2 className="xr-h3 m-0">{stateWords('VE-01.failed')}</h2>
        <p className="xr-body m-0">{VENDOR_FAILED_WORDS.line}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" icon="tryAgain" onClick={onRetry}>
            {VENDOR_FAILED_WORDS.tryAgain}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Undrawn: loading, skeleton rows in the attention section's shape (`VE-01.loading`). */
function Loading() {
  return (
    <LoadingState
      label={stateWords('VE-01.loading')}
      surface="section"
      skeleton={
        <div aria-hidden="true">
          <div className="xr-section-head">
            <Skeleton className="w-[220px]" />
          </div>
          {[0, 1].map((line) => (
            <div
              key={line}
              className="grid grid-cols-[1fr_160px] gap-5 px-6 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
            >
              <Skeleton />
              <Skeleton />
            </div>
          ))}
        </div>
      }
    />
  );
}
