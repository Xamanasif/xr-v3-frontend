'use client';

import {
  Button,
  CellLines,
  CourseCode,
  ListFoot,
  ListState,
  ListSurface,
  LoadingRows,
  RecordTable,
  StatusPill,
  SwitchToolbar,
} from '@xr/ui/v3';
import { useEffect, useState } from 'react';

import { SA_FAILED } from '@/copy/sa-shared';
import { stateWords } from '@/copy/state-copy';
import { CONTENT_HEAD, UPDATES_LIST, updatesCaption, type UpdateShowKey } from '@/copy/sa-content';
import {
  CONTENT_UPDATES_ADDRESS,
  contentUpdatesAddress,
  contentUpdatesPlacement,
  UPDATE_SHOWS,
  type UpdateShow,
  updateShowOf,
} from '@/nav/admin-content';
import { useAppNavigation } from '@/nav/navigation';
import type { ReleaseRow } from '@/queries/correction-view';
import { useUpdatesForRelease } from '@/queries/corrections';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { ContentHead } from './content-head';
import { RELEASE_TAB, type UpdateRowFacts, updateRowFacts } from './updates-view';

/**
 * SA-10 Content updates — the owner-approved Super Admin export's `V.updates`
 * (design/v3-refined-b/roles/SA-v1, renders `<width>_content_updates.png`), at
 * `/admin/content/updates` (the rail's "Content" opens it; `/admin/content` redirects here).
 *
 * - **Reads**: `CorrectionService.listUpdatesForRelease({ tab })` once per segment — each
 *   segment's figure is its own read's length, the rows on show the selected segment's — in the
 *   service's order. The Super Admin sees a correction only once the Academic Reviewer has
 *   approved it (UPD-18): the service decides which corrections each segment holds.
 * - **As the export draws it**: "Content" with its line and the page tabs "Updates · All content"
 *   (SA-12); one surface with the segmented control "Waiting for your decision · On hold ·
 *   Released" and the table Experiment (and its course code) · What changes · Approved by ·
 *   Approved · Status, each row opening the decision (SA-11); the foot line. The table has its
 *   three width layouts. No reference is shown: a correction is its experiment and versions.
 * - **Address**: the segment is mirrored in `?show=` (state-copy `SA-10.show-address`); an
 *   unknown value is replaced by the list's own address.
 * - **States**: loading (the kit's announced skeleton rows), failed with "Try again", no
 *   correction at all, and each segment's calm empty state. Nothing on this page changes a record:
 *   there is no "Publish" anywhere on this path.
 */
export function ContentUpdates() {
  useShellPage(contentUpdatesPlacement());
  const navigation = useAppNavigation();
  const asked = updateShowOf(navigation.search);
  useEffect(() => {
    if (asked === null) navigation.replace(CONTENT_UPDATES_ADDRESS);
  }, [asked, navigation]);

  const [show, setShow] = useState<UpdateShow>(asked ?? 'waiting');
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setShow(updateShowOf(navigation.search) ?? 'waiting');
  }

  const reads = {
    waiting: useUpdatesForRelease(RELEASE_TAB.waiting),
    'on-hold': useUpdatesForRelease(RELEASE_TAB['on-hold']),
    released: useUpdatesForRelease(RELEASE_TAB.released),
  } satisfies Readonly<Record<UpdateShowKey, ReturnType<typeof useUpdatesForRelease>>>;
  const all = Object.values(reads);
  const failed = all.some((read) => read.isError || (read.data !== undefined && !read.data.ok));
  const loading = !failed && all.some((read) => read.data === undefined);
  const rowsOf = (key: UpdateShowKey): readonly ReleaseRow[] => {
    const answer = reads[key].data;
    return answer?.ok ? answer.value : [];
  };

  const select = (next: UpdateShow) => {
    setShow(next);
    if (next !== show) navigation.replace(contentUpdatesAddress(next));
  };

  const retry = () => {
    for (const read of all) {
      if (read.isError || (read.data !== undefined && !read.data.ok)) void read.refetch();
    }
  };

  const rows = rowsOf(show).map((row) => updateRowFacts(row, show));
  const total = UPDATE_SHOWS.reduce((sum, key) => sum + rowsOf(key).length, 0);

  let body;
  if (failed) {
    body = (
      <ListState
        kind="failed"
        title={stateWords('SA-10.failed')}
        action={<Button onClick={retry}>{SA_FAILED.retry}</Button>}
      >
        {SA_FAILED.line}
      </ListState>
    );
  } else if (loading) {
    body = <LoadingRows message={stateWords('SA-10.loading')} />;
  } else {
    body = (
      <>
        <SwitchToolbar
          label={UPDATES_LIST.showLabel}
          value={show}
          onChange={select}
          options={UPDATE_SHOWS.map((key) => ({
            key,
            label: UPDATES_LIST.shows[key],
            count: rowsOf(key).length,
          }))}
        />
        {rows.length > 0 ? (
          <UpdatesTable show={show} rows={rows} />
        ) : (
          <ListState
            kind="empty"
            icon="edit"
            title={total === 0 ? UPDATES_LIST.emptyTitle : UPDATES_LIST.none[show]}
          >
            {UPDATES_LIST.emptyLine}
          </ListState>
        )}
      </>
    );
  }

  return (
    <>
      <ContentHead current="updates" lead={CONTENT_HEAD.updatesLead} />
      <ListSurface label={UPDATES_LIST.surfaceLabel} busy={loading}>
        {body}
        <ListFoot>{UPDATES_LIST.foot}</ListFoot>
      </ListSurface>
    </>
  );
}

/** The corrections of one segment: the record table, each row opening its decision (SA-11). */
function UpdatesTable({
  show,
  rows,
}: {
  readonly show: UpdateShowKey;
  readonly rows: readonly UpdateRowFacts[];
}) {
  return (
    <RecordTable
      caption={updatesCaption(show)}
      headers={UPDATES_LIST.headers}
      whenLabel={UPDATES_LIST.whenLabel}
      rows={rows.map((row) => ({
        key: row.id,
        href: row.href,
        title: row.name,
        titleDetail: row.courseCode ? <CourseCode code={row.courseCode} /> : undefined,
        linkLabel: row.linkLabel,
        what: <CellLines strong={row.versions} small={row.versionsNote} />,
        kind: <CellLines strong={UPDATES_LIST.reviewerRole} small={row.reviewer ?? undefined} />,
        when: row.approvedOn,
        status: <StatusPill tone={row.status.tone}>{row.status.words}</StatusPill>,
      }))}
    />
  );
}
