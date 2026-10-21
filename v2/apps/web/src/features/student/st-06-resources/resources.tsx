'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { LearningResource } from '@xr/domain';
import {
  StAside,
  StList,
  StLoading,
  StOverview,
  StResourceCard,
  StResourceCount,
  StResourceRow,
  type StResourceStatus,
  StSideSection,
  StSideText,
  StSideTitle,
  StStateRow,
  type V3IconName,
} from '@xr/ui/v3';
import { useEffect, useId, useRef, useState } from 'react';

import {
  openedWords,
  openResourceLabel,
  RESOURCES_PAGE,
  RESOURCES_V3,
  resourcesNoteWords,
  resourcesOpenedCount,
  retryOpenResourceLabel,
} from '@/copy/learning-hub';
import { ST_STATE_WORDS } from '@/copy/st-shared';
import { stateWords } from '@/copy/state-copy';
import { useExperimentResources } from '@/queries/learning';
import { useExperimentHub } from '@/queries/student';
import { useCommand } from '@/queries/use-command';

import { HubFallback, HubTabPage, type HubView, useHubPage } from '../shared/hub-frame';
import { openPendingTab } from '../shared/new-tab';

/**
 * ST-06 Resources — a tab of the experiment hub, at `/student/experiments/[experimentId]/resources`,
 * as the V3 Student export draws it (ST-v1 `StudentFinal.dc.html`, `HB.isResources`, `resVM`): a
 * reading list (each resource's kind icon, title, kind and length, when the Student opened it and
 * "Open" in a new tab) beside one aside — "Before you run a simulation" and "Opened isn’t
 * progress" with the count opened.
 *
 * - **Read**: `LearningService.listResources` — the experiment's resources and when the Student
 *   first opened each; the hub frame reads the head (`getExperimentHub`, `shared/hub-frame`).
 * - **Command**: `LearningService.openResource` → "Opening…", then the answer's `href` opens in a
 *   new tab and the row reads "Opened in a new tab just now" (later visits: "Opened <date, time>",
 *   the first opening the service keeps); focus moves to the row's status. Opening marks "Opened"
 *   and nothing else — never progress (T-13, T-15). A failed opening says so in the row with "Try
 *   again"; a refusal also re-reads, so a closure that arrived meanwhile shows.
 * - **States**: not opened · opening · opened · couldn't open + try again; none attached; loading;
 *   list failed + retry (focus back on "Resources"); paused, a licence wait, an inactive account —
 *   said once above the list, nothing opens. A refusal is ST-19.
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
      <ResourcesBody
        view={state.view}
        rows={answer?.ok ? answer.value : null}
        failed={list.isError}
        retry={() => void list.refetch()}
        reread={() => {
          void list.refetch();
          void hub.refetch();
        }}
      />
    </HubTabPage>
  );
}

type Row = { readonly resource: LearningResource; readonly openedAt: string | null };

/** Per row, this visit only: the opening under way, its failure, or its success just now. */
type Attempt = 'busy' | 'failed' | 'opened';

function ResourcesBody({
  view,
  rows,
  failed,
  retry,
  reread,
}: {
  readonly view: HubView;
  /** `null` while loading or failed. */
  readonly rows: readonly Row[] | null;
  readonly failed: boolean;
  readonly retry: () => void;
  /** Re-reads the list and the hub after a refusal (a refusal's receipt invalidates nothing). */
  readonly reread: () => void;
}) {
  const ids = { title: useId(), status: useId(), before: useId(), opened: useId() };
  const titleRef = useRef<HTMLHeadingElement>(null);
  const open = useCommand((ports) => ports.learning.openResource);
  const [attempts, setAttempts] = useState<Readonly<Record<string, Attempt>>>({});
  const focusRow = useRef<string | null>(null);
  const focusTitle = useRef(false);
  const held = heldWords(view);

  // After an opening settles, focus moves to the row's status (`focusId('st-res-st-' + id)`), once
  // the settled words are on screen; after "Try again", to the list's title.
  useEffect(() => {
    if (focusRow.current !== null) {
      document.getElementById(`${ids.status}-${focusRow.current}`)?.focus();
      focusRow.current = null;
    }
    if (focusTitle.current && rows !== null) {
      titleRef.current?.focus();
      focusTitle.current = false;
    }
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

  const opened = rows
    ? rows.filter((row) => row.openedAt !== null || attempts[row.resource.id] === 'opened').length
    : 0;

  return (
    <StOverview>
      <StResourceCard
        title={RESOURCES_V3.title}
        titleId={ids.title}
        titleRef={titleRef}
        note={rows && rows.length > 0 ? resourcesNoteWords(rows.length) : RESOURCES_V3.eachNewTab}
        held={rows !== null && rows.length > 0 ? held : null}
      >
        {failed ? (
          <StStateRow
            icon="cloudAlert"
            tone="err"
            alert
            title={RESOURCES_PAGE.failedTitle}
            description={ST_STATE_WORDS.failedLine}
            action={{
              label: ST_STATE_WORDS.tryAgain,
              onClick: () => {
                focusTitle.current = true;
                retry();
              },
            }}
          />
        ) : rows === null ? (
          <StLoading label={RESOURCES_V3.loading} />
        ) : rows.length === 0 ? (
          <StStateRow
            icon="resources"
            title={RESOURCES_PAGE.noneTitle}
            description={RESOURCES_V3.noneLine}
          />
        ) : (
          <StList>
            {rows.map(({ resource, openedAt }) => {
              const attempt = attempts[resource.id];
              return (
                <StResourceRow
                  key={resource.id}
                  icon={kindIcon(resource.kind)}
                  title={resource.title}
                  kind={resource.kind}
                  size={resource.sizeLabel}
                  statusId={`${ids.status}-${resource.id}`}
                  status={rowStatus(attempt, openedAt)}
                  action={
                    held !== null
                      ? undefined
                      : {
                          label:
                            attempt === 'failed' ? ST_STATE_WORDS.tryAgain : RESOURCES_PAGE.open,
                          ariaLabel:
                            attempt === 'failed'
                              ? retryOpenResourceLabel(resource.title)
                              : openResourceLabel(resource.title),
                          busy: attempt === 'busy',
                          onOpen: () => void openRow(resource),
                        }
                  }
                />
              );
            })}
          </StList>
        )}
      </StResourceCard>
      <StAside label={RESOURCES_V3.asideLabel}>
        <StSideSection labelledBy={ids.before}>
          <StSideTitle id={ids.before}>{RESOURCES_V3.beforeTitle}</StSideTitle>
          <StSideText>{RESOURCES_V3.beforeLine}</StSideText>
        </StSideSection>
        <StSideSection labelledBy={ids.opened}>
          <StSideTitle id={ids.opened}>{RESOURCES_V3.openedTitle}</StSideTitle>
          <StSideText>{RESOURCES_V3.openedLine}</StSideText>
          {rows !== null && rows.length > 0 ? (
            <StResourceCount>{resourcesOpenedCount(opened, rows.length)}</StResourceCount>
          ) : null}
        </StSideSection>
      </StAside>
    </StOverview>
  );
}

/** Not opened yet · Opening… · Opened (just now, or the first opening) · It didn't open. */
function rowStatus(attempt: Attempt | undefined, openedAt: string | null): StResourceStatus {
  if (attempt === 'busy') return { kind: 'busy', words: RESOURCES_PAGE.opening };
  if (attempt === 'failed') return { kind: 'failed', words: RESOURCES_PAGE.openFailed };
  if (attempt === 'opened') return { kind: 'opened', words: RESOURCES_PAGE.justOpened };
  if (openedAt !== null) return { kind: 'opened', words: openedWords(openedAt) };
  return { kind: 'not-opened', words: RESOURCES_PAGE.notOpened };
}

/**
 * Listed, not openable, said once (`resVM` `heldText`): the institution's pause, a licence wait;
 * an inactive account the same way (`ST-06.closed`, the register's words).
 */
function heldWords(view: HubView): string | null {
  const closure = view.hub.row.closure;
  if (view.closure === 'paused' || closure?.kind === 'institution-paused') {
    return RESOURCES_V3.heldPaused;
  }
  if (view.closure === 'inactive' || closure?.kind === 'student-inactive') {
    return stateWords('ST-05.inactive-resources');
  }
  if (closure?.kind === 'waiting-for-a-licence') return RESOURCES_V3.heldWaiting;
  return null;
}

/** The kind's glyph (`RES.ico`: `sti-doc`, `sti-web`, `sti-sheet`), by the resource's kind. */
function kindIcon(kind: string): V3IconName {
  if (/web/i.test(kind)) return 'globe';
  if (/sheet/i.test(kind)) return 'spreadsheet';
  return 'documentText';
}
