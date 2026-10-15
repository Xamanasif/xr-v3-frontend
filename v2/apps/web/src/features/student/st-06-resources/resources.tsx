'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { LearningResource } from '@xr/domain';
import { Icon, type IconName, LoadingState, Skeleton, StatusPill } from '@xr/ui';
import { useEffect, useId, useRef, useState } from 'react';

import {
  openedWords,
  openResourceLabel,
  RESOURCES_PAGE,
  resourceCountWords,
  retryResourceLabel,
} from '@/copy/learning-hub';
import { stateWords } from '@/copy/state-copy';
import { STUDENT_WORDS } from '@/copy/student';
import { useExperimentResources } from '@/queries/learning';
import { useExperimentHub } from '@/queries/student';
import { useCommand } from '@/queries/use-command';

import { HubFallback, HubTabPage, type HubView, useHubPage } from '../shared/hub-frame';
import { openPendingTab } from '../shared/new-tab';

/**
 * ST-06 Resources — a tab of the experiment hub, board B3-01 f0 … f7, at
 * `/student/experiments/[experimentId]/resources`.
 *
 * - **Read**: `LearningService.listResources` — the experiment's resources and when the Student
 *   first opened each; the hub frame reads the header (`getExperimentHub`, `shared/hub-frame`).
 * - **Command**: `LearningService.openResource` → "Opening…", then the answer's `href` opens in a
 *   new tab and the row reads "Opened in a new tab just now" (later visits: "Opened <date, time>",
 *   the first opening the service keeps). Opening marks "Opened" and nothing else — never
 *   progress, never the Progress tab (T-13, T-15). A failed opening says so in words with
 *   "Try again" (f1); a refusal also re-reads, so a closure that arrived meanwhile shows.
 * - **States**: not opened · opening · opened · couldn't open + try again (f0, f1, f2); none
 *   attached (f3); loading (f4); list failed + retry (f5); paused — listed, not openable (f6;
 *   inactive and a licence wait the same, `ST-06.closed`); mobile (f7). A refusal is ST-19.
 */
export function Resources({ experimentId }: { readonly experimentId: string }) {
  const list = useExperimentResources(experimentId);
  const hub = useExperimentHub(experimentId);
  const answer = list.data;
  const listError: ServiceError | null = answer && !answer.ok ? answer.error : null;
  const state = useHubPage(experimentId, 'resources', listError);
  if (state.kind !== 'ready') return <HubFallback state={state} />;
  return (
    <HubTabPage experimentId={experimentId} view={state.view} tab="resources">
      {list.isError ? (
        <ListFailed onRetry={() => void list.refetch()} />
      ) : answer?.ok ? (
        answer.value.length === 0 ? (
          <NoneAttached />
        ) : (
          <ResourceList
            rows={answer.value}
            view={state.view}
            reread={() => {
              void list.refetch();
              void hub.refetch();
            }}
          />
        )
      ) : (
        <ListLoading />
      )}
    </HubTabPage>
  );
}

type Row = { readonly resource: LearningResource; readonly openedAt: string | null };

/** Per row, this visit only: the opening under way, its failure, or its success just now. */
type Attempt = 'busy' | 'failed' | 'opened';

function ResourceList({
  rows,
  view,
  reread,
}: {
  readonly rows: readonly Row[];
  readonly view: HubView;
  /** Re-reads the list and the hub after a refusal (a refusal's receipt invalidates nothing). */
  readonly reread: () => void;
}) {
  const headingId = useId();
  const statusPrefix = useId();
  const open = useCommand((ports) => ports.learning.openResource);
  const [attempts, setAttempts] = useState<Readonly<Record<string, Attempt>>>({});
  const focusRow = useRef<string | null>(null);
  const closed = closedWords(view);

  // After an opening settles, focus moves to the row's status line (B3-01 `stId`, tabindex -1),
  // once the settled words are on screen.
  useEffect(() => {
    if (focusRow.current === null) return;
    document.getElementById(`${statusPrefix}-${focusRow.current}`)?.focus();
    focusRow.current = null;
  });

  const settle = (id: string, attempt: Attempt) => {
    focusRow.current = id;
    setAttempts((current) => ({ ...current, [id]: attempt }));
  };

  const openRow = async (resource: LearningResource) => {
    setAttempts((current) => ({ ...current, [resource.id]: 'busy' }));
    // The tab opens in the click's own task; it gets the resource's link once the service answers.
    const tab = openPendingTab();
    try {
      const answer = await open.run({ resourceId: resource.id });
      if (answer.ok && tab) {
        tab.go(answer.value.href);
        settle(resource.id, 'opened');
      } else {
        tab?.cancel();
        settle(resource.id, 'failed');
        // Refused (paused, ended, withdrawn meanwhile): the re-read shows why (`ST-06.open-refused`).
        if (!answer.ok) reread();
      }
    } catch {
      // `unavailable`, or the session ended mid-flight: the row offers "Try again", never a spinner.
      tab?.cancel();
      settle(resource.id, 'failed');
    }
  };

  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {RESOURCES_PAGE.heading}
        </h2>
        <span className="xr-meta">{resourceCountWords(rows.length)}</span>
      </div>
      <ul className="xr-rows">
        {rows.map(({ resource, openedAt }) => {
          const attempt = attempts[resource.id];
          return (
            <li key={resource.id} className="xr-row">
              <div className="xr-row-main">
                <span className="xr-row-icon">
                  <Icon name={kindIcon(resource.kind)} />
                </span>
                <div className="xr-row-text">
                  <span className="xr-row-title">{resource.title}</span>
                  <span className="xr-row-sub">{`${resource.kind} · ${resource.sizeLabel}`}</span>
                  {closed === null ? (
                    <span
                      id={`${statusPrefix}-${resource.id}`}
                      tabIndex={-1}
                      className="xl-meta mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1.5"
                    >
                      <RowStatus attempt={attempt} openedAt={openedAt} />
                    </span>
                  ) : null}
                </div>
              </div>
              {closed !== null ? (
                <StatusPill tone={closed.tone}>{closed.words}</StatusPill>
              ) : attempt === 'busy' ? null : attempt === 'failed' ? (
                <button
                  type="button"
                  className="xr-btn xr-btn--secondary xr-btn--sm"
                  aria-label={retryResourceLabel(resource.title)}
                  onClick={() => void openRow(resource)}
                >
                  <Icon name="tryAgain" />
                  {RESOURCES_PAGE.tryAgain}
                </button>
              ) : (
                <button
                  type="button"
                  className="xr-btn xr-btn--secondary xr-btn--sm"
                  aria-label={openResourceLabel(resource.title)}
                  onClick={() => void openRow(resource)}
                >
                  {RESOURCES_PAGE.open}
                  <Icon name="externalLink" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** B3-01 f0 / f1: not opened yet · opening · opened (just now, or the first opening) · failed. */
function RowStatus({
  attempt,
  openedAt,
}: {
  readonly attempt: Attempt | undefined;
  readonly openedAt: string | null;
}) {
  if (attempt === 'busy') {
    return (
      <span className="xl-inline" role="status">
        <span className="xr-spin" aria-hidden="true" />
        {RESOURCES_PAGE.opening}
      </span>
    );
  }
  if (attempt === 'failed') {
    return (
      <span className="xw-ferr" role="alert">
        <Icon name="failed" />
        {RESOURCES_PAGE.openFailed}
      </span>
    );
  }
  if (attempt === 'opened' || openedAt !== null) {
    return (
      <span className="xl-inline">
        <Icon name="done" size={16} />
        {attempt === 'opened' ? RESOURCES_PAGE.justOpened : openedWords(openedAt!)}
      </span>
    );
  }
  return <span>{RESOURCES_PAGE.notOpened}</span>;
}

/**
 * Listed, not openable (B3-01 f6): the paused chip in place of Open, no opened line; an inactive
 * account and a licence wait read the same way with their own chip (`ST-06.closed`).
 */
function closedWords(
  view: HubView,
): { readonly tone: 'paused' | 'wait' | 'off'; readonly words: string } | null {
  if (view.closure === 'paused') return { tone: 'paused', words: RESOURCES_PAGE.paused };
  if (view.closure === 'inactive')
    return { tone: 'off', words: stateWords('ST-05.inactive-format') };
  if (view.hub.row.closure?.kind === 'waiting-for-a-licence') {
    return { tone: 'wait', words: stateWords('ST-06.waiting') };
  }
  return null;
}

/** B3-01 `isPdf` / `isWeb` / `isSheet` by the resource's kind (`ST-06.kind-icon`). */
function kindIcon(kind: string): IconName {
  if (/web/i.test(kind)) return 'link';
  if (/sheet/i.test(kind)) return 'table';
  return 'fileText';
}

/** B3-01 f3: "No resources are attached to this experiment yet". */
function NoneAttached() {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon">
          <Icon name="fileText" />
        </span>
        <h2 className="xr-h3 m-0">{RESOURCES_PAGE.noneTitle}</h2>
        <p className="xr-body m-0 text-ink-2">{RESOURCES_PAGE.noneLine}</p>
      </div>
    </div>
  );
}

/** B3-01 f4: the list loading — four rows of two bars (`1.6fr 140px`). */
function ListLoading() {
  return (
    <LoadingState
      label={RESOURCES_PAGE.loading}
      skeleton={[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          aria-hidden="true"
          className="grid grid-cols-[1.6fr_140px] gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
        >
          <Skeleton />
          <Skeleton />
        </div>
      ))}
    />
  );
}

/** B3-01 f5: "We couldn’t load the resources" — "Nothing has changed. Try again." */
function ListFailed({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon bg-err-bg text-err">
          <Icon name="failed" />
        </span>
        <h2 className="xr-h3 m-0">{RESOURCES_PAGE.failedTitle}</h2>
        <p className="xr-body m-0 text-ink-2">{STUDENT_WORDS.failedLine}</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="xr-btn xr-btn--primary" onClick={onRetry}>
            <Icon name="tryAgain" />
            {STUDENT_WORDS.tryAgain}
          </button>
        </div>
      </div>
    </div>
  );
}
