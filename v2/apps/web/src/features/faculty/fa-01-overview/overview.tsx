'use client';

import type { FacultyOverview as FacultyOverviewAnswer } from '@xr/contracts/draft';
import {
  AttentionItem,
  Row,
  Button,
  Icon,
  Link,
  LoadingState,
  PageContent,
  PageHeader,
  Rows,
  Skeleton,
} from '@xr/ui';
import { useId, useLayoutEffect, useRef } from 'react';

import {
  attentionCountWords,
  FACULTY_FAILED_WORDS,
  FACULTY_OVERVIEW_WORDS,
  scopeLineWords,
} from '@/copy/faculty-overview';
import { stateWords } from '@/copy/state-copy';
import {
  FACULTY_HELP_ADDRESS,
  FACULTY_MY_COURSES_ADDRESS,
  FACULTY_OVERVIEW_TITLE,
  facultyOverviewPlacement,
} from '@/nav/faculty';
import { useCurrentSession } from '@/queries/session';
import { useFacultyOverview } from '@/queries/teaching';

import { MAIN_ID } from '../../shared/workspace-frame/route-focus';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { attentionRows, comingUpRows, type OverviewRow } from './overview-view';

/**
 * FA-01 Overview, the Faculty workspace home (board B4-01: "What needs my attention this week?"),
 * at `/faculty`: one scope line, the attention rows and the deadlines coming up — attention only;
 * none of the Faculty destinations is embedded here.
 *
 * - **Read**: `TeachingService.getFacultyOverview` — the scope line's counts (the courses Faculty
 *   courses, IA-15, map to the Faculty member and the experiments of them the institution holds),
 *   the attention facts and the Ready assessments due in the next 30 days. Every word is written
 *   here from those facts (`@/copy/faculty-overview`). The overline is the session's institution.
 *   An assignment, an assessment or a grant in the same tab refreshes it (the read's deps).
 * - **As B4-01 draws it**: the scope line with "My courses" (f0, f1, f3, f4), "Needs your
 *   attention" with its count and rows or the calm state (f1), "Coming up · at most 3" with "Open"
 *   per assessment or "No deadlines in the next 30 days." (f3), and "No courses yet" before the
 *   Institute Admin assigns one (f2: the message and Help only). At 375 the rows stack (f4).
 * - **Not rendered (DEV-21)**: rows and actions whose page is Phase 4B — the header's "Mark <n>
 *   written answer" and "Mark now" (FA-18), "View students" (FA-20) and the drafts row (FA-16;
 *   the service has no such fact). Phase 4A draws the access-ended row (f3) only (state-copy
 *   `FA-01.not-rendered`). The paused-institution banner is the shell's (XS-08).
 * - Undrawn: loading and failed with "Try again" (state-copy `FA-01.loading`, `FA-01.failed`).
 *   Nothing here changes a record: every action opens the page where the work is done.
 */
export function FacultyOverview() {
  useShellPage(facultyOverviewPlacement());
  const session = useCurrentSession();
  const institutionName = session.data?.ok
    ? (session.data.value?.session.institutionName ?? null)
    : null;
  const read = useFacultyOverview();
  const answer = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const retried = useRetryFocus(answer !== null);

  const retry = () => {
    retried();
    void read.refetch();
  };

  return (
    <PageContent wrap="read">
      <PageHeader
        className="mb-6"
        overline={institutionName}
        title={FACULTY_OVERVIEW_TITLE}
        meta={answer && answer.scopeLine.courses > 0 ? <ScopeLine answer={answer} /> : null}
      />
      <div className="xw-stack">
        {failed ? (
          <Failed onRetry={retry} />
        ) : answer === null ? (
          <Loading />
        ) : answer.scopeLine.courses === 0 ? (
          <NoCourses />
        ) : (
          <>
            <Attention rows={attentionRows(answer.attention)} />
            <ComingUp rows={comingUpRows(answer.comingUp)} />
          </>
        )}
      </div>
    </PageContent>
  );
}

/** "You teach 1 course · 1 experiment · My courses" (`div.xr-phead-meta > p.xr-body`). */
function ScopeLine({ answer }: { readonly answer: FacultyOverviewAnswer }) {
  const { courses, experiments } = answer.scopeLine;
  return (
    <p className="xr-body m-0 text-ink-2">
      {scopeLineWords(courses, experiments)}
      <Link href={FACULTY_MY_COURSES_ADDRESS}>{FACULTY_OVERVIEW_WORDS.myCourses}</Link>
    </p>
  );
}

function RowList({ rows }: { readonly rows: readonly OverviewRow[] }) {
  return (
    <Rows>
      {rows.map((row) =>
        row.action ? (
          <AttentionItem
            key={row.key}
            icon={row.icon}
            tone={row.tone}
            title={row.title}
            sub={row.sub}
            action={row.action}
          />
        ) : (
          <Row key={row.key} icon={row.icon} tone={row.tone} title={row.title} sub={row.sub} />
        ),
      )}
    </Rows>
  );
}

/** "Needs your attention": the rows with their count (f0, f3, f4) or the calm state (f1). */
function Attention({ rows }: { readonly rows: readonly OverviewRow[] }) {
  const headingId = useId();
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {FACULTY_OVERVIEW_WORDS.attention}
        </h2>
        {rows.length > 0 ? (
          <span className="xr-meta">{attentionCountWords(rows.length)}</span>
        ) : null}
      </div>
      {rows.length > 0 ? (
        <RowList rows={rows} />
      ) : (
        <div className="xr-empty">
          <span className="xr-empty-icon xr-x-empty-icon--ok">
            <Icon name="done" />
          </span>
          <h3 className="xr-h3 m-0">{FACULTY_OVERVIEW_WORDS.calmTitle}</h3>
          <p className="xr-body m-0 text-ink-2">{FACULTY_OVERVIEW_WORDS.calmLine}</p>
        </div>
      )}
    </section>
  );
}

/** "Coming up · at most 3": the rows (f0, f1, f4) or "No deadlines in the next 30 days." (f3). */
function ComingUp({ rows }: { readonly rows: readonly OverviewRow[] }) {
  const headingId = useId();
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {FACULTY_OVERVIEW_WORDS.comingUp}
        </h2>
        <span className="xr-meta">{FACULTY_OVERVIEW_WORDS.comingUpMeta}</span>
      </div>
      {rows.length > 0 ? (
        <RowList rows={rows} />
      ) : (
        <div className="xr-section-body">
          <p className="xr-body m-0 text-ink-2">{FACULTY_OVERVIEW_WORDS.noDeadlines}</p>
        </div>
      )}
    </section>
  );
}

/** f2 "No courses yet": `div.xr-section > div.xr-empty` with the My courses icon and Help. */
function NoCourses() {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon">
          <Icon name="myCourses" />
        </span>
        <h2 className="xr-h3 m-0">{FACULTY_OVERVIEW_WORDS.noCoursesTitle}</h2>
        <p className="xr-body m-0 text-ink-2">{FACULTY_OVERVIEW_WORDS.noCoursesLine}</p>
        <div className="flex flex-wrap gap-3">
          <Link className="xr-btn xr-btn--text" href={FACULTY_HELP_ADDRESS}>
            {FACULTY_OVERVIEW_WORDS.help}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Failed + retry as B4-02 f5 draws it for the Faculty pages (state-copy `FA-01.failed`). */
function Failed({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon bg-err-bg text-err">
          <Icon name="failed" />
        </span>
        <h2 className="xr-h3 m-0">{stateWords('FA-01.failed')}</h2>
        <p className="xr-body m-0 text-ink-2">{FACULTY_FAILED_WORDS.line}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" icon="tryAgain" onClick={onRetry}>
            {FACULTY_FAILED_WORDS.tryAgain}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Loading: skeleton rows in the attention section's shape, announced politely (`FA-01.loading`). */
function Loading() {
  return (
    <LoadingState
      label={stateWords('FA-01.loading')}
      surface="section"
      skeleton={
        <div aria-hidden="true">
          <div className="xr-section-head">
            <Skeleton className="w-[220px]" />
          </div>
          {[0, 1, 2].map((line) => (
            <div
              key={line}
              className="grid grid-cols-[1fr_120px] gap-5 px-6 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
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

/**
 * After "Try again" the button is gone with the failed state: once the overview is back, focus
 * moves to the page's main region (`main#main`, the skip link's target) — only if focus was lost
 * with the button.
 */
function useRetryFocus(settled: boolean): () => void {
  const pending = useRef(false);
  useLayoutEffect(() => {
    if (!pending.current || !settled) return;
    pending.current = false;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    document.getElementById(MAIN_ID)?.focus({ preventScroll: true });
  });
  return () => {
    pending.current = true;
  };
}
