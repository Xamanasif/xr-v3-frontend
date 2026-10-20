'use client';

import type { libraryOutput, Out, platformCodesOutput } from '@xr/contracts/draft';
import {
  Button,
  type CmCourseGroup,
  CmFormatBadges,
  CmLibraryLayout,
  type CmLibraryRow,
  CmLibraryTable,
  CmPageHead,
  CmStageLine,
  CmStatusCell,
  type CmOwnerTone,
  CmViewSwitch,
  type Figure,
  FilterToolbar,
  ListFoot,
  ListState,
  LoadingRows,
  Surface,
  type ToolbarChip,
} from '@xr/ui/v3';
import { useRef, useState } from 'react';

import {
  acrossCourses,
  CONTENT_LIBRARY,
  courseBandCount,
  courseChip,
  courseLabel,
  formatsLabel,
  libraryCaption,
  libraryCountWords,
  libraryPanelLabel,
  LIST_FAILED,
  noMatchTitle,
  onTheWayDetail,
  overrideTag,
  publishedRowLabel,
  revisionWords,
  rowToResolve,
  searchChip,
  submissionRowLabel,
  versionWords,
} from '@/copy/cm-lists';
import { CM_SUBMISSION_STATUS } from '@/copy/cm-shared';
import { dayMonthYear } from '@/copy/dates';
import { stateWords } from '@/copy/state-copy';
import {
  CONTENT_LIBRARY_TITLE,
  contentLibraryPlacement,
  LIBRARY_TABS,
  type LibraryTab,
  libraryTabOf,
  publicationDecisionAddress,
  publishedExperimentAddress,
} from '@/nav/content-manager';
import { useAppNavigation } from '@/nav/navigation';
import { useContentLibrary, usePlatformCourseCodes, useReadyToPublish } from '@/queries/production';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  formatCodes,
  libraryCourseOf,
  libraryViewAddress,
  useToday,
} from '../cm-02-ready/list-facts';
import { openChecks } from '../cm-02-ready/ready-to-publish';
import { lastApproval } from '../shared/records';
import { cmSubmissionPill, cmUpdateTone } from '../shared/status';

type Library = Out<typeof libraryOutput>;
type LibraryRow = Library['rows'][number];
type SubmissionRow = Extract<LibraryRow, { kind: 'submission' }>;
type ExperimentRow = Extract<LibraryRow, { kind: 'experiment' }>;
type Course = Out<typeof platformCodesOutput>[number]['course'];

const TITLE_ID = 'cm-h-library';
const SEARCH_ID = 'cm-lib-q';
const COURSE_ID = 'cm-lib-course';
const ALL = 'all';

const OWNER_TONE: Readonly<Record<LibraryTab, CmOwnerTone>> = {
  ready: 'you',
  'in-review': 'other',
  'with-vendor': 'vendor',
  published: 'live',
};

/**
 * The line under a submission's status in "Where it is" (the export's `x.tag`): how it came to be
 * with the Academic Reviewer or the vendor. A resubmission has none (state-copy `CM-04.resubmitted`).
 */
export function submissionTag(row: SubmissionRow): string | null {
  const { status } = row.submission;
  switch (status.state) {
    case 'with-academic-reviewer':
      if (status.reason === 'recheck') return CONTENT_LIBRARY.tags.recheck;
      if (status.reason === 'resubmission') return null;
      return CONTENT_LIBRARY.tags.newSubmission;
    case 'returned':
      if (status.by === 'content-manager') return CONTENT_LIBRARY.tags.sentBack;
      if (status.by === 'super-admin-override') return overrideTag();
      return CONTENT_LIBRARY.tags.returnedByReviewer;
    case 'with-content-manager':
    case 'resubmitted':
    case 'draft':
    case 'published':
      return null;
  }
}

/** Since when a submission is where it is: its approval for a ready one, else its status' date. */
function sinceOf(row: SubmissionRow): string | null {
  const { status } = row.submission;
  if (status.state === 'with-content-manager') return row.approvedAt ?? status.since;
  if (status.state === 'draft') return null;
  if (status.state === 'published') return status.at;
  return status.since;
}

/** A submission's row (Ready, In review, With vendor). */
export function submissionRow(row: SubmissionRow, blockers: number): CmLibraryRow {
  const { submission } = row;
  const name = submission.content.name;
  const ready = submission.status.state === 'with-content-manager';
  const pill = ready
    ? blockers > 0
      ? { tone: 'err' as const, words: rowToResolve(blockers) }
      : { tone: 'info' as const, words: CM_SUBMISSION_STATUS.ready }
    : cmSubmissionPill(submission.status);
  const codes = formatCodes(submission.content.formats);
  const since = sinceOf(row);
  const tag = submissionTag(row);
  return {
    key: submission.id,
    href: publicationDecisionAddress(submission.id),
    title: name,
    linkLabel: submissionRowLabel(name, pill.words, ready),
    formats: <CmFormatBadges formats={codes} label={formatsLabel(codes)} />,
    kind: ready
      ? { strong: lastApproval(submission)?.by ?? '', small: CONTENT_LIBRARY.reviewer }
      : { strong: submission.vendorOrganisation, small: revisionWords(submission.revision) },
    whenLabel: ready
      ? CONTENT_LIBRARY.headers.when.ready
      : CONTENT_LIBRARY.headers.when['in-review'],
    when: since ? dayMonthYear(since) : '',
    status: (
      <CmStatusCell status={{ tone: pill.tone, label: pill.words }} {...(tag ? { tag } : {})} />
    ),
  };
}

/** A published experiment's row, its open correction as its own chip. */
export function experimentRow(row: ExperimentRow, course: Course | null): CmLibraryRow {
  const { experiment } = row;
  const name = experiment.live.catalogue.name;
  const codes = formatCodes(experiment.live.formats.map((entry) => entry.format));
  const state = row.openUpdate?.state;
  const tag =
    state && state !== 'released' && state !== 'withdrawn'
      ? CONTENT_LIBRARY.updateTags[state]
      : null;
  return {
    key: experiment.id,
    href: publishedExperimentAddress(experiment.id),
    title: name,
    linkLabel: publishedRowLabel(
      name,
      row.courseCode ?? course?.name ?? '',
      experiment.live.label,
      tag,
    ),
    formats: <CmFormatBadges formats={codes} label={formatsLabel(codes)} />,
    kind: { strong: versionWords(experiment.live.label), small: experiment.vendorOrganisation },
    whenLabel: CONTENT_LIBRARY.headers.when.published,
    when: dayMonthYear(experiment.live.liveFrom),
    status: (
      <CmStatusCell
        status={{ tone: 'ok', label: CM_SUBMISSION_STATUS.published }}
        {...(tag && state ? { update: { tone: cmUpdateTone(state), label: tag } } : {})}
      />
    ),
  };
}

/** The course a row is listed under. */
function courseIdOf(row: LibraryRow): string | null {
  return row.kind === 'submission' ? row.submission.content.courseId : row.experiment.courseId;
}

/**
 * CM-04 Content library — the V3 Refined B design (the owner-approved export
 * design/v3-refined-b/roles/CM-v1, `Main.dc.html` CM-04 and `libVM`), at `/content-manager/library`
 * (`?tab=in-review | with-vendor | published`, `&course=<id>`; state-copy `CM-04.address`).
 *
 * - **Read**: `ProductionService.getLibrary` — the four views' counts and the chosen view's rows,
 *   searched by the service (the typed words: name, ID or course code): a submission with its
 *   record (Ready: approved; In review: with the Academic Reviewer, a re-check included; With
 *   vendor: returned) or a published experiment with its live version and its open correction's
 *   state. Drafts stay with the Vendor and are not listed. The course filter narrows the rows on
 *   the page. The platform course codes
 *   name and order the courses; the Ready view's publication check is `listReadyToPublish`'s.
 * - **As the export draws it**: the head with its figures (in the catalogue, on the way); the
 *   view switch Ready · In review · With vendor · Published with counts (the pressed view kept in
 *   sight on a phone); the line saying who holds the view's items; the list surface — search,
 *   course, the count, chips and Clear filters — and the table grouped by course (a band with the
 *   code, name and count), each row a link: a submission to its decision (CM-03; read-only unless
 *   ready), a published experiment to CM-05, its open correction as its own chip. No internal
 *   reference (SUB-, UPD-) in a row's words or its link's name (state-copy `CM-lists.no-reference`):
 *   nothing under the experiment's name; the references stay in the rows' addresses and keys.
 * - **States**: no match (Clear filters), empty view, loading (no count, view counts or figures),
 *   couldn't load (Try again reads again and moves focus to the title).
 * - Nothing here changes a record.
 */
export function ContentLibrary() {
  useShellPage(contentLibraryPlacement());
  const today = useToday();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const navigation = useAppNavigation();
  const addressedTab = libraryTabOf(navigation.search);
  const addressedCourse = libraryCourseOf(navigation.search);
  const [tab, setTab] = useState<LibraryTab>(addressedTab);
  const [course, setCourse] = useState<string | null>(addressedCourse);
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setTab(addressedTab);
    setCourse(addressedCourse);
  }
  const [search, setSearch] = useState('');

  // The search is the service's (state-copy `CM-04.address`): name, ID or course code.
  const read = useContentLibrary({ tab, search });
  const ready = useReadyToPublish(tab === 'ready');
  const courses = usePlatformCourseCodes();
  const library = read.data?.ok ? read.data.value : null;
  const courseRows = courses.data?.ok ? courses.data.value : null;
  const failed =
    read.isError ||
    (read.data !== undefined && !read.data.ok) ||
    courses.isError ||
    (courses.data !== undefined && !courses.data.ok);
  const loading = !failed && (library === null || courseRows === null);

  // The view the rows on show belong to (the previous view's while the next one loads).
  const [rowsTab, setRowsTab] = useState<LibraryTab>(tab);
  if (library !== null && !read.isPlaceholderData && rowsTab !== tab) setRowsTab(tab);

  const courseById = (id: string | null): Course | null =>
    courseRows?.find((row) => row.course.id === id)?.course ?? null;
  const blockersOf = (submissionId: string): number => {
    const row = ready.data?.ok
      ? ready.data.value.find((entry) => entry.submission.id === submissionId)
      : undefined;
    return row ? openChecks(row.check).length : 0;
  };

  const move = (nextTab: LibraryTab, nextCourse: string | null) => {
    setTab(nextTab);
    setCourse(nextCourse);
    navigation.replace(libraryViewAddress(nextTab, nextCourse));
  };

  const retry = () => {
    if (read.isError || (read.data !== undefined && !read.data.ok)) void read.refetch();
    if (courses.isError || (courses.data !== undefined && !courses.data.ok)) void courses.refetch();
    titleRef.current?.focus();
  };

  const filtered = search.trim() !== '' || course !== null;
  // The course filter narrows the service's rows on the page.
  const shown = (library?.rows ?? []).filter(
    (row) => course === null || courseIdOf(row) === course,
  );
  const total = library ? library.counts[rowsTab] : 0;

  // The count is announced (`role="status"`): while the next view's rows load, the rows on show
  // are the previous answer's, so the count keeps its last settled words.
  const settled =
    library === null || read.isPlaceholderData
      ? null
      : libraryCountWords(rowsTab, shown.length, total, filtered);
  const [countWords, setCountWords] = useState('');
  if (settled !== null && settled !== countWords) setCountWords(settled);

  const groups: CmCourseGroup<CmLibraryRow>[] = [];
  if (library && courseRows) {
    const order = [...courseRows.map((row) => row.course.id), null];
    const toRow = (row: LibraryRow) =>
      row.kind === 'submission'
        ? submissionRow(row, blockersOf(row.submission.id))
        : experimentRow(row, courseById(row.experiment.courseId));
    for (const id of order) {
      const inGroup = shown.filter((row) =>
        id === null
          ? !courseRows.some((entry) => entry.course.id === courseIdOf(row))
          : courseIdOf(row) === id,
      );
      if (inGroup.length === 0) continue;
      const named = courseById(id);
      groups.push({
        key: id ?? 'other',
        code: named?.platformCode ?? null,
        name: named?.name ?? CONTENT_LIBRARY.otherCourses,
        count: courseBandCount(rowsTab, inGroup.length),
        rows: inGroup.map(toRow),
      });
    }
  }

  const chips: ToolbarChip[] = [];
  if (search.trim() !== '') {
    chips.push({ key: 'q', label: searchChip(search.trim()), onRemove: () => setSearch('') });
  }
  if (course !== null) {
    const named = courseById(course);
    chips.push({
      key: 'course',
      label: courseChip(named ? courseLabel(named.platformCode, named.name) : course),
      onRemove: () => move(tab, null),
    });
  }

  const nCourses = courseRows ? courseRows.filter((row) => row.publishedExperiments > 0).length : 0;
  const figures: Figure[] =
    library && courseRows
      ? [
          {
            title: CONTENT_LIBRARY.inCatalogue,
            value: library.counts.published,
            details: [acrossCourses(library.counts.published, nCourses)],
          },
          {
            title: CONTENT_LIBRARY.onTheWay,
            value:
              library.counts.ready + library.counts['in-review'] + library.counts['with-vendor'],
            details: [
              onTheWayDetail(
                library.counts.ready,
                library.counts['in-review'],
                library.counts['with-vendor'],
              ),
            ],
          },
        ]
      : [];

  return (
    <>
      <CmPageHead
        title={CONTENT_LIBRARY_TITLE}
        titleId={TITLE_ID}
        titleRef={titleRef}
        date={today.line}
        lead={CONTENT_LIBRARY.lead}
        figures={failed ? [] : figures}
        figuresLabel={CONTENT_LIBRARY.figuresLabel}
      />
      <CmLibraryLayout>
        <CmViewSwitch
          id="cm-lib-switch"
          label={CONTENT_LIBRARY.switchLabel}
          value={tab}
          onChange={(next) => move(next, course)}
          options={LIBRARY_TABS.map((key) => ({
            key,
            label: CONTENT_LIBRARY.views[key],
            ...(library && !failed && !loading ? { count: library.counts[key] } : {}),
          }))}
        />
        <CmStageLine owner={CONTENT_LIBRARY.stage[tab].owner} tone={OWNER_TONE[tab]}>
          {CONTENT_LIBRARY.stage[tab].note}
        </CmStageLine>
        <Surface label={libraryPanelLabel(tab)}>
          <FilterToolbar
            label={CONTENT_LIBRARY.filterLabel}
            search={{
              id: SEARCH_ID,
              label: CONTENT_LIBRARY.searchLabel,
              placeholder: stateWords('CM-04.search.placeholder'),
              value: search,
              onChange: setSearch,
            }}
            filters={[
              {
                id: COURSE_ID,
                label: CONTENT_LIBRARY.courseLabel,
                size: 'status',
                value: course ?? ALL,
                onChange: (value) => move(tab, value === ALL ? null : value),
                options: [
                  { value: ALL, label: CONTENT_LIBRARY.allCourses },
                  ...(courseRows ?? []).map((row) => ({
                    value: row.course.id,
                    label: courseLabel(row.course.platformCode, row.course.name),
                  })),
                ],
              },
            ]}
            {...(loading || failed ? {} : { count: countWords })}
            chips={chips}
            onClearFilters={() => {
              setSearch('');
              if (course !== null) move(tab, null);
            }}
          />
          {failed ? (
            <ListState
              kind="failed"
              titleAs="h2"
              title={CONTENT_LIBRARY.failed}
              action={<Button onClick={retry}>{LIST_FAILED.retry}</Button>}
            >
              {LIST_FAILED.line}
            </ListState>
          ) : loading ? (
            <LoadingRows message={CONTENT_LIBRARY.loading} cells={[2, 1, 2, 1, 1]} rows={4} />
          ) : total === 0 ? (
            <ListState
              kind="empty"
              icon="contentLibrary"
              titleAs="h2"
              title={CONTENT_LIBRARY.empty[rowsTab].title}
            >
              {CONTENT_LIBRARY.empty[rowsTab].line}
            </ListState>
          ) : groups.length === 0 ? (
            <ListState
              kind="nomatch"
              titleAs="h2"
              title={noMatchTitle(rowsTab)}
              action={
                <Button
                  onClick={() => {
                    setSearch('');
                    if (course !== null) move(tab, null);
                  }}
                >
                  {CONTENT_LIBRARY.clearFilters}
                </Button>
              }
            >
              {stateWords('CM-04.search.no-match')}
            </ListState>
          ) : (
            <CmLibraryTable
              caption={libraryCaption(rowsTab, shown.length, total, filtered)}
              headers={{
                who: CONTENT_LIBRARY.headers.experiment,
                what: CONTENT_LIBRARY.headers.formats,
                kind: CONTENT_LIBRARY.headers.kind[rowsTab],
                when: CONTENT_LIBRARY.headers.when[rowsTab],
                status: CONTENT_LIBRARY.headers.whereItIs,
              }}
              groups={groups}
            />
          )}
          <ListFoot>{CONTENT_LIBRARY.foot}</ListFoot>
        </Surface>
      </CmLibraryLayout>
    </>
  );
}
