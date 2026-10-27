'use client';

import { FORMAT_META, inDisplayOrder } from '@xr/domain';
import {
  Button,
  ButtonLink,
  ListState,
  LoadingRows,
  PageHead,
  VendorExperimentTable,
  type VendorExperimentRow,
  VendorListSurface,
  VendorListTools,
  type VendorSort,
  type VendorSortDirection,
  VendorStatusTabs,
} from '@xr/ui/v3';
import { type ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { dayMonthYear, weekdayDate } from '@/copy/dates';
import { stateWords } from '@/copy/state-copy';
import {
  CREATE_EXPERIMENT,
  experimentCountWords,
  experimentRowName,
  formatsName,
  MY_EXPERIMENTS_SEARCH,
  MY_EXPERIMENTS_WORDS,
  STATUS_TABS,
  statusTabName,
  type StatusTabKey,
  VENDOR_FAILED_WORDS,
} from '@/copy/vendor-home';
import { useAppNavigation } from '@/nav/navigation';
import {
  experimentRecordAddress,
  MY_EXPERIMENTS_TITLE,
  myExperimentsPlacement,
  newExperimentAddress,
} from '@/nav/vendor';
import { usePublicStructure } from '@/queries/catalogue';
import {
  type MyExperimentsStatus,
  noCourseAssigned,
  useExperimentEditor,
  useMyExperiments,
} from '@/queries/production';
import { useSession } from '@/queries/session';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { hasSavedChanges } from '../shared/saved-changes';
import { useRetryFocus } from '../ve-01-overview/retry-focus';
import {
  changedRecently,
  inTab,
  type MyExperimentRow,
  myExperimentsFilterAddress,
  oldestFirst,
  recentFilterOf,
  rowAction,
  rowStatus,
  statusFilterOf,
  statusLine,
} from './experiment-rows';

const TITLE_ID = 've-h1';
const SEARCH_ID = 've-q';
const RECENT_ID = 've-recent';

/**
 * VE-02 My experiments — the owner-approved Vendor export (V3 Refined B, VE-v1 `Main.dc.html`
 * list view; HANDOFF §1, §2, §7), at `/vendor/experiments` (`?status=`, `?changed=last-7-days`).
 *
 * - **Reads**: `ProductionService.listMyExperiments` three times — every experiment the Vendor
 *   created (the count's whole, which tabs show, the empty state), the search alone (each tab's
 *   count) and the rows on show (the tab's status and the search: the service filters and
 *   searches, newest change first) — and the public catalogue's course cards for each course's
 *   platform code (state-copy `VE-02.course-code`). Every role's command in the tab refreshes them.
 * - **As the export draws it**: the head (today, “My experiments”, its line, the gold Create
 *   experiment); the status tabs with counts (All and each status the Vendor has); one tool row —
 *   the search, “Changed in the last 7 days”, the count, “Clear filters” while a filter is applied
 *   (focus returns to the search) and, below 760 px, the sort; the table — Experiment (the name
 *   opens the record; the course code under it — never the submission's reference, state-copy
 *   `VE-02.no-reference`), Formats, Status (pill, one plain line, “Changes saved,
 *   not resubmitted” when the product can tell), Last change (sortable), one action (Revise / Edit
 *   draft / the chevron) — three-line rows below 760 px with a labelled last change. No match;
 *   no experiments yet; loading; could not load with Try again. No course assigned (owner
 *   decision PD-3; the editor's read for a new experiment): no Create experiment, and the empty
 *   state says why (state-copy `VE-01.no-course.*`).
 * - The tab and the 7-day filter live in the address (replaced, no history entry); an address from
 *   outside (Back, the Overview's “Changed in the last 7 days”) is read again. The search and the
 *   sort stay on the page. Nothing here changes a record: every action opens the page where the
 *   work is done.
 */
export function MyExperiments() {
  useShellPage(myExperimentsPlacement());
  const navigation = useAppNavigation();
  const session = useSession();
  const now = session.status === 'signed-in' ? session.signedInAt : null;

  const addressedStatus = statusFilterOf(navigation.search);
  const addressedRecent = recentFilterOf(navigation.search);
  const [status, setStatus] = useState<MyExperimentsStatus | null>(addressedStatus);
  const [recent, setRecent] = useState(addressedRecent);
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setStatus(addressedStatus);
    setRecent(addressedRecent);
  }
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState<VendorSortDirection>('desc');

  const everything = useMyExperiments();
  const searched = useMyExperiments({ status: null, search });
  const list = useMyExperiments({ status, search });
  const structure = usePublicStructure();
  // No course assigned (PD-3): no Create experiment; the empty state explains it.
  const editor = useExperimentEditor(null);
  const noCourse = noCourseAssigned(editor.data);
  const editorSettled = editor.data !== undefined || editor.isError;

  const failedRead = (read: typeof list) =>
    read.isError || (read.data !== undefined && !read.data.ok);
  const failed = failedRead(everything) || failedRead(searched) || failedRead(list);
  const all = everything.data?.ok ? everything.data.value : null;
  const matching = searched.data?.ok ? searched.data.value : null;
  const rows = list.data?.ok ? list.data.value : null;
  const codesSettled = structure.data !== undefined || structure.isError;
  const loading =
    !failed &&
    (all === null || matching === null || rows === null || !codesSettled || !editorSettled);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const retried = useRetryFocus(!loading && !failed, titleRef);

  const codes = useMemo(
    () =>
      new Map<string, string | null>(
        structure.data?.ok
          ? structure.data.value.flatMap((entry) =>
              entry.courses.map((course) => [course.id, course.platformCode] as const),
            )
          : [],
      ),
    [structure.data],
  );

  const recentOnly = (row: MyExperimentRow) =>
    !recent || now === null || changedRecently(row.submission.updatedAt, now);
  const shownNewestFirst = (rows ?? []).filter(recentOnly);
  const shown = direction === 'desc' ? shownNewestFirst : oldestFirst(shownNewestFirst);
  const total = all?.length ?? 0;
  const filtered = search.trim() !== '' || status !== null || recent;

  // The count is announced (`role="status"`): while a new search's or tab's rows load, the rows on
  // show are the previous answer's, so the count keeps its last settled words.
  const settled =
    loading || failed || list.isPlaceholderData
      ? null
      : experimentCountWords(shown.length, total, filtered);
  const [countWords, setCountWords] = useState('');
  if (settled !== null && settled !== countWords) setCountWords(settled);

  const applyFilters = (next: { status: MyExperimentsStatus | null; recent: boolean }) => {
    setStatus(next.status);
    setRecent(next.recent);
    navigation.replace(myExperimentsFilterAddress(next.status, next.recent));
  };

  // “Clear filters” returns focus to the search box once the filters have gone (the export's
  // `focusId('ve-q')`), from the tool row and from the no-match state alike.
  const searchRef = useRef<HTMLInputElement>(null);
  const focusSearch = useRef(false);
  useLayoutEffect(() => {
    if (!focusSearch.current) return;
    focusSearch.current = false;
    searchRef.current?.focus();
  });
  const clear = () => {
    focusSearch.current = true;
    setSearch('');
    applyFilters({ status: null, recent: false });
  };

  const retry = () => {
    retried();
    for (const read of [everything, searched, list]) {
      if (failedRead(read)) void read.refetch();
    }
    if (structure.isError) void structure.refetch();
  };

  const sort: VendorSort = {
    direction,
    words: { desc: MY_EXPERIMENTS_WORDS.newestFirst, asc: MY_EXPERIMENTS_WORDS.oldestFirst },
    prefix: MY_EXPERIMENTS_WORDS.sortPrefix,
    changeOrder: MY_EXPERIMENTS_WORDS.changeOrder,
    onToggle: () => setDirection((current) => (current === 'desc' ? 'asc' : 'desc')),
  };

  const empty = !loading && !failed && total === 0;
  const head = (
    <PageHead
      title={MY_EXPERIMENTS_TITLE}
      titleId={TITLE_ID}
      titleRef={titleRef}
      titleFocusTarget
      date={now ? weekdayDate(now) : undefined}
      lead={MY_EXPERIMENTS_WORDS.lead}
      actions={
        empty || noCourse ? undefined : (
          <ButtonLink href={newExperimentAddress()} variant="primary" size="lg" icon="add">
            {CREATE_EXPERIMENT}
          </ButtonLink>
        )
      }
    />
  );

  const ready = !loading && !failed;
  const tabs = STATUS_TABS.filter(
    ([key]) => key === 'all' || key === status || (all ?? []).some((row) => inTab(row, key)),
  ).map(([key, label]) => {
    const count = (matching ?? []).filter((row) => recentOnly(row) && inTab(row, key)).length;
    return { key, label, count, accessibleName: statusTabName(label, count) };
  });

  let body: ReactNode;
  if (empty && noCourse) {
    body = (
      <ListState
        kind="none"
        roomy
        titleAs="h2"
        icon="myExperiments"
        title={stateWords('VE-01.no-course.title')}
      >
        {stateWords('VE-01.no-course.line')}
      </ListState>
    );
  } else if (empty) {
    body = (
      <ListState
        kind="none"
        roomy
        titleAs="h2"
        icon="myExperiments"
        title={MY_EXPERIMENTS_WORDS.emptyTitle}
        action={
          <ButtonLink href={newExperimentAddress()} variant="primary" size="lg">
            {CREATE_EXPERIMENT}
          </ButtonLink>
        }
      >
        {MY_EXPERIMENTS_WORDS.emptyLine}
      </ListState>
    );
  } else if (failed) {
    body = (
      <ListState
        kind="failed"
        title={stateWords('VE-02.failed')}
        action={<Button onClick={retry}>{VENDOR_FAILED_WORDS.tryAgain}</Button>}
      >
        {VENDOR_FAILED_WORDS.line}
      </ListState>
    );
  } else if (loading) {
    body = <LoadingRows message={stateWords('VE-02.loading')} cells={[2, 1, 1, 1, 1]} />;
  } else if (shown.length === 0) {
    body = (
      <ListState
        kind="nomatch"
        title={MY_EXPERIMENTS_WORDS.noMatchTitle}
        action={<Button onClick={clear}>{MY_EXPERIMENTS_WORDS.clearFilters}</Button>}
      >
        {MY_EXPERIMENTS_SEARCH.noMatchLine}
      </ListState>
    );
  } else {
    body = (
      <VendorExperimentTable
        caption={MY_EXPERIMENTS_WORDS.listLabel}
        headers={MY_EXPERIMENTS_WORDS.columns}
        sort={sort}
        lastChangeLabel={MY_EXPERIMENTS_WORDS.lastChange}
        rows={shown.map((row) => tableRow(row, codes, now))}
      />
    );
  }

  return (
    <>
      {head}
      {ready && !empty ? (
        <VendorStatusTabs<StatusTabKey>
          label={MY_EXPERIMENTS_WORDS.tabsLabel}
          tabs={tabs}
          value={status ?? 'all'}
          onChange={(key) => applyFilters({ status: key === 'all' ? null : key, recent })}
        />
      ) : null}
      <VendorListSurface label={MY_EXPERIMENTS_WORDS.listLabel}>
        {empty ? null : (
          <VendorListTools
            label={MY_EXPERIMENTS_WORDS.toolsLabel}
            search={{
              id: SEARCH_ID,
              label: MY_EXPERIMENTS_SEARCH.label,
              placeholder: MY_EXPERIMENTS_SEARCH.label,
              value: search,
              onChange: setSearch,
              ref: searchRef,
            }}
            toggle={{
              id: RECENT_ID,
              label: MY_EXPERIMENTS_WORDS.recent,
              checked: recent,
              onChange: (checked) => applyFilters({ status, recent: checked }),
            }}
            count={ready ? countWords : undefined}
            clear={
              ready && filtered
                ? { label: MY_EXPERIMENTS_WORDS.clearFilters, onClick: clear }
                : undefined
            }
            sort={ready ? sort : undefined}
          />
        )}
        {body}
      </VendorListSurface>
    </>
  );
}

/** One row of the table, in the export's words (HANDOFF §2). */
function tableRow(
  row: MyExperimentRow,
  codes: ReadonlyMap<string, string | null>,
  now: string | null,
): VendorExperimentRow {
  const { submission } = row;
  const name = submission.content.name;
  const code = submission.content.courseId
    ? (codes.get(submission.content.courseId) ?? null)
    : null;
  const pill = rowStatus(row);
  const action = rowAction(row);
  const formats = inDisplayOrder(submission.content.formats).map(
    (format) => FORMAT_META[format].code,
  );
  const lastChange = dayMonthYear(submission.updatedAt);
  return {
    key: submission.id,
    href: experimentRecordAddress(submission.id),
    name,
    accessibleName: experimentRowName(name, pill.label, lastChange),
    course: code ?? undefined,
    formats,
    formatsLabel: formatsName(formats),
    status: pill,
    statusLine: statusLine(row, now) ?? undefined,
    pending: hasSavedChanges(submission) ? MY_EXPERIMENTS_WORDS.savedNotResubmitted : undefined,
    lastChange,
    action: action
      ? { href: action.href, label: action.label, accessibleName: action.name }
      : undefined,
  };
}
