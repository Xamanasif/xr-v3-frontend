'use client';

import type { ContentAccessRow } from '@xr/contracts/draft';
import {
  Button,
  ButtonLink,
  ContentStack,
  IaExperimentsMeta,
  IaExperimentsTable,
  type IaFilterChip,
  IaFormatKey,
  IaFormatList,
  IaManageFilters,
  IaManageFoot,
  IaManageSearch,
  IaManageSelect,
  IaManageStatus,
  IaManageSurface,
  IaManageTools,
  IaPlanFacts,
  IaPlanStrip,
  IaPlanStripId,
  IaPlanStripNote,
  IaPlanStripRow,
  IaPlanStripView,
  IaTermBar,
  LinkTabs,
  ListState,
  LoadingRows,
  PageHead,
  Surface,
} from '@xr/ui/v3';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { COURSE_CODES_TAB } from '@/copy/course-codes';
import {
  addCodeLabel,
  CONTENT_ACCESS_WORDS,
  CONTENT_STATUS_FILTERS,
  contentCountWords,
  type ContentStatusFilter,
  endsOnTitle,
  formatsOfLabel,
  giveAccessLabel,
  INSTITUTE_ACTIONS,
  PLAN_NOTICES,
  PLAN_WORDS,
  removeFilterLabel,
  searchChip,
  statusChip,
  studentsGivenLabel,
  studentsWords,
  viewPlanLabel,
} from '@/copy/institute-home';
import { REQUEST_ACTIONS } from '@/copy/institute-requests';
import {
  accessPlanAddress,
  CONTENT_ACCESS_ADDRESS,
  COURSE_CODES_ADDRESS,
  destinationPlacement,
  giveAccessAddress,
  STUDENT_ACCESS_ADDRESS,
  tabPlacement,
} from '@/nav/institute';
import { INSTITUTE_REQUESTS_ADDRESS, instituteRequestAddress } from '@/nav/institute-requests';
import { useAppNavigation } from '@/nav/navigation';
import { useContentAccess, useInstituteOverview } from '@/queries/institute-home';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { CourseCodesTab } from '../ia-16-course-codes/course-codes';
import { useInstitutionPaused } from '../shared/paused';
import { contentAccessView, type CourseGroupView, type PlanStanding } from './content-access-view';
import { formatFactsOf, pausedAtOf, termBarOf } from './plan-facts';
import { PlanPill } from './plan-pills';
import { usePlanToday } from './plan-today';

const TITLE_ID = 'ia-h1';
const SEARCH_ID = 'ca-q';
const STATUS_ID = 'ca-st';
const LIST_ID = 'xs-h';
const NO_CONTENT_ID = 'ca-none-t';
const FAILED_ID = 'ca-fail-t';

type ContentTab = 'experiments' | 'course-codes';

/**
 * IA-02 Content access › Experiments — the V3 Refined B design (the owner-approved export
 * design/v3-refined-b/roles/IA-v1, `Main.dc.html` IA-02 and `vm02core` / `vm02`), at
 * `/institute/content-access`, and the page that hosts its Course codes tab IA-16
 * (`?tab=course-codes`). Any other `tab` shows Experiments and the address becomes the bare
 * `/institute/content-access` (state-copy `IA-16.tab-address`).
 *
 * - **Read**: `InstitutionService.listContentAccess` — per course, the plans that hold its
 *   experiments (status and days left on the sample clock) and one row per plan item: the formats
 *   in the plan, the published formats it leaves out (ACC-10) and how many students an active
 *   grant of that plan gives it to now — people, never licences (T-06). Licences are shown as
 *   approved; there is no amend control (T-08).
 * - **As the export draws it**: the head ("Give students access", secondary here so each row's
 *   action reads as the clear one), the tabs, one plan strip per plan on the plan tint (status,
 *   "120 as approved by BITS", the yearly term bar, View plan; the ending-soon, ended and paused
 *   notes as bands inside it), then one list surface: search and status in one row, the format key
 *   and the count, chips with Clear filters, and the experiments grouped by course (BITS code,
 *   course, your code or "not added" with Add code) — each with its status, its four format badges,
 *   the students given access (a link to Student access) and Give access.
 * - **States**: loading, failed with Try again (focus to the title), no match with "Show all
 *   experiments", and "No content yet" before any plan (not reachable in the sample world,
 *   INST-04), each as the export draws it.
 * - No internal reference (ACC-, REQ-) in its words or names (state-copy `IA-plan.no-reference`):
 *   "View plan" is named by the plan's term.
 */
export function ContentAccess() {
  const navigation = useAppNavigation();
  const tabParam = new URLSearchParams(navigation.search).get('tab');
  const tab: ContentTab = tabParam === 'course-codes' ? 'course-codes' : 'experiments';
  const normalise = tabParam !== null && tab === 'experiments';
  useEffect(() => {
    if (normalise) navigation.replace(CONTENT_ACCESS_ADDRESS);
  }, [normalise, navigation]);
  useShellPage(
    tab === 'course-codes'
      ? tabPlacement('IA-16', COURSE_CODES_TAB.tab)
      : destinationPlacement('IA-02'),
  );
  const titleRef = useRef<HTMLHeadingElement>(null);
  const today = usePlanToday();
  const paused = useInstitutionPaused();
  const read = useContentAccess();
  const rows = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const view = rows === null ? null : contentAccessView(rows, { search: '', status: 'all' });
  // The head's "Give students access" while some plan's experiments can be given (none while
  // paused, ended, loading, failed or before any plan).
  const showGive = view !== null && view.anyGivable && !paused;

  const retry = () => {
    void read.refetch();
    titleRef.current?.focus();
  };

  let body;
  if (tab === 'course-codes') {
    body = <CourseCodesTab paused={paused} titleRef={titleRef} />;
  } else if (failed) {
    body = (
      <Surface labelledBy={FAILED_ID}>
        <ListState
          kind="failed"
          titleAs="h2"
          titleId={FAILED_ID}
          title={CONTENT_ACCESS_WORDS.failedTitle}
          action={<Button onClick={retry}>{CONTENT_ACCESS_WORDS.tryAgain}</Button>}
        >
          {CONTENT_ACCESS_WORDS.failedLine}
        </ListState>
      </Surface>
    );
  } else if (rows === null) {
    body = (
      <Surface label={CONTENT_ACCESS_WORDS.title} busy>
        <LoadingRows message={CONTENT_ACCESS_WORDS.loading} rows={2} cells={[2, 1, 1, 1, 1]} />
      </Surface>
    );
  } else if (rows.length === 0) {
    body = <NoContentYet />;
  } else {
    body = <ContentList rows={rows} />;
  }

  return (
    <>
      <PageHead
        title={CONTENT_ACCESS_WORDS.title}
        titleId={TITLE_ID}
        titleRef={titleRef}
        titleFocusTarget
        date={today.line}
        lead={CONTENT_ACCESS_WORDS.meta}
        actions={
          showGive ? (
            <ButtonLink href={giveAccessAddress()} size="lg">
              {INSTITUTE_ACTIONS.giveStudentsAccess}
            </ButtonLink>
          ) : null
        }
      />
      <ContentStack>
        <LinkTabs
          label={CONTENT_ACCESS_WORDS.tabsLabel}
          tabs={[
            {
              href: CONTENT_ACCESS_ADDRESS,
              label: CONTENT_ACCESS_WORDS.experimentsTab,
              current: tab === 'experiments',
            },
            {
              href: COURSE_CODES_ADDRESS,
              label: COURSE_CODES_TAB.tab,
              current: tab === 'course-codes',
            },
          ]}
        />
        {body}
      </ContentStack>
    </>
  );
}

/** One plan strip on the plan tint: the plan, licences, term, View plan, and its note. */
function PlanStrip({
  standing,
  index,
}: {
  readonly standing: PlanStanding;
  readonly index: number;
}) {
  const { plan, status, daysLeft } = standing;
  const titleId = index === 0 ? 'cp-h' : `cp-h-${index}`;
  const term = termBarOf(plan, status, daysLeft, pausedAtOf(plan));
  const renewal = { label: REQUEST_ACTIONS.requestRenewal, href: INSTITUTE_REQUESTS_ADDRESS };
  return (
    <IaPlanStrip titleId={titleId}>
      <IaPlanStripRow>
        <IaPlanStripId
          title={PLAN_WORDS.accessPlan}
          titleId={titleId}
          status={<PlanPill status={status} />}
        />
        <IaPlanFacts
          place="strip"
          facts={[{ term: PLAN_WORDS.licences, value: plan.licences, sub: PLAN_WORDS.asApproved }]}
        />
        <IaTermBar {...term} place="strip" />
        <IaPlanStripView
          link={{
            label: CONTENT_ACCESS_WORDS.viewPlan,
            href: accessPlanAddress(plan.id),
            accessibleName: viewPlanLabel(plan),
          }}
        />
      </IaPlanStripRow>
      {status === 'ending-soon' ? (
        <IaPlanStripNote
          tone="warn"
          title={endsOnTitle(plan.endsOn)}
          line={PLAN_NOTICES.endingSoonLine}
          action={renewal}
        />
      ) : status === 'access-ended' ? (
        <IaPlanStripNote
          tone="off"
          title={PLAN_NOTICES.contentEndedTitle}
          line={PLAN_NOTICES.contentEndedLine}
          action={renewal}
        />
      ) : status === 'paused' ? (
        <IaPlanStripNote
          tone="paused"
          title={PLAN_NOTICES.pausedTitle}
          line={PLAN_NOTICES.contentPausedLine}
        />
      ) : null}
    </IaPlanStrip>
  );
}

function ContentList({ rows }: { readonly rows: readonly ContentAccessRow[] }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ContentStatusFilter>('all');
  const view = contentAccessView(rows, { search, status });

  const chips: IaFilterChip[] = [];
  if (search.trim() !== '') {
    const label = searchChip(search);
    chips.push({
      key: 'search',
      label,
      removeLabel: removeFilterLabel(label),
      onRemove: () => setSearch(''),
      focusId: SEARCH_ID,
    });
  }
  if (status !== 'all') {
    const label = statusChip(status);
    chips.push({
      key: 'status',
      label,
      removeLabel: removeFilterLabel(label),
      onRemove: () => setStatus('all'),
      focusId: STATUS_ID,
    });
  }
  const clearFilters = () => {
    setSearch('');
    setStatus('all');
  };

  // "Show all experiments" goes with the no-match state: once it has gone, focus moves to the
  // search (the export's `clearAll` → `focusLater('ca-q')`).
  const focusSearch = useRef(false);
  useLayoutEffect(() => {
    if (!focusSearch.current) return;
    focusSearch.current = false;
    document.getElementById(SEARCH_ID)?.focus();
  });

  return (
    <>
      {view.plans.map((standing, index) => (
        <PlanStrip key={standing.plan.id} standing={standing} index={index} />
      ))}
      <IaManageSurface labelledBy={LIST_ID} hiddenTitle={CONTENT_ACCESS_WORDS.listHeading}>
        <IaManageTools>
          <IaManageFilters label={CONTENT_ACCESS_WORDS.toolsLabel}>
            <IaManageSearch
              id={SEARCH_ID}
              label={CONTENT_ACCESS_WORDS.searchLabel}
              placeholder={CONTENT_ACCESS_WORDS.searchPlaceholder}
              value={search}
              onChange={setSearch}
            />
            <IaManageSelect
              id={STATUS_ID}
              label={CONTENT_ACCESS_WORDS.statusLabel}
              value={status}
              options={CONTENT_STATUS_FILTERS.map((value) => ({
                value,
                label: CONTENT_ACCESS_WORDS.statusOptions[value],
              }))}
              onChange={(value) => setStatus(value as ContentStatusFilter)}
            />
          </IaManageFilters>
          <IaExperimentsMeta
            formatKey={
              <IaFormatKey
                label={PLAN_WORDS.formatsKey}
                listLabel={PLAN_WORDS.formatKeyLabel}
                inPlan={PLAN_WORDS.inYourPlan}
                published={PLAN_WORDS.publishedNotInPlan}
                notPublished={PLAN_WORDS.notPublished}
              />
            }
            count={contentCountWords(view.shown, view.total, view.courses, chips.length > 0)}
          />
          {chips.length > 0 ? (
            <IaManageStatus
              chips={chips}
              clearLabel={CONTENT_ACCESS_WORDS.clearFilters}
              onClear={clearFilters}
              clearFocusId={SEARCH_ID}
            />
          ) : null}
        </IaManageTools>
        {view.groups.length > 0 ? (
          <>
            <ExperimentsTable groups={view.groups} />
            <IaManageFoot>{CONTENT_ACCESS_WORDS.foot}</IaManageFoot>
          </>
        ) : (
          <ListState
            kind="nomatch"
            title={CONTENT_ACCESS_WORDS.noMatch}
            action={
              <Button
                onClick={() => {
                  focusSearch.current = true;
                  clearFilters();
                }}
              >
                {CONTENT_ACCESS_WORDS.showAll}
              </Button>
            }
          >
            {CONTENT_ACCESS_WORDS.noMatchLine}
          </ListState>
        )}
      </IaManageSurface>
    </>
  );
}

/** The experiments grouped by course, one row per plan experiment. */
function ExperimentsTable({ groups }: { readonly groups: readonly CourseGroupView[] }) {
  const { columns } = CONTENT_ACCESS_WORDS;
  return (
    <IaExperimentsTable
      caption={CONTENT_ACCESS_WORDS.caption}
      headers={{
        experiment: columns.experiment,
        formats: columns.formats,
        given: columns.studentsGiven,
        action: columns.action,
      }}
      courses={groups.map((group) => {
        const own = group.institutionCode?.code;
        const code = group.course.platformCode;
        return {
          key: group.course.id,
          headId: `ca-c-${group.course.id}`,
          ...(code ? { code } : {}),
          name: group.course.name,
          ownCode: own
            ? { label: PLAN_WORDS.yourCourseCode, code: own }
            : {
                missing: PLAN_WORDS.codeNotAdded,
                add: {
                  label: CONTENT_ACCESS_WORDS.addCode,
                  href: COURSE_CODES_ADDRESS,
                  accessibleName: addCodeLabel(code, group.course.name),
                },
              },
          rows: group.rows.map((row) => ({
            key: `${row.planId}:${row.experimentId}`,
            name: row.name,
            status: <PlanPill status={row.status} />,
            formats: (
              <IaFormatList
                label={formatsOfLabel(row.name)}
                cells={formatFactsOf(row.formats, row.publishedNotInPlan).cells}
              />
            ),
            given:
              row.studentsGiven > 0
                ? {
                    label: columns.studentsGiven,
                    link: {
                      label: studentsWords(row.studentsGiven),
                      href: STUDENT_ACCESS_ADDRESS,
                      accessibleName: studentsGivenLabel(row.studentsGiven, row.name),
                    },
                  }
                : { none: CONTENT_ACCESS_WORDS.noneYet },
            ...(row.givable
              ? {
                  action: {
                    label: CONTENT_ACCESS_WORDS.giveAccess,
                    href: giveAccessAddress({
                      course: group.course.id,
                      experiment: row.experimentId,
                    }),
                    accessibleName: giveAccessLabel(row.name),
                  },
                }
              : {}),
          })),
        };
      })}
    />
  );
}

/**
 * "No content yet" before any plan: nothing to show before access is active. "View request
 * status" opens the request the institution was created from (`getMyOverview`) in Requests.
 */
function NoContentYet() {
  const overview = useInstituteOverview();
  const reference = overview.data?.ok ? overview.data.value.institution.createdFromRequestId : null;
  return (
    <Surface labelledBy={NO_CONTENT_ID}>
      <ListState
        kind="none"
        roomy
        titleAs="h2"
        titleId={NO_CONTENT_ID}
        title={CONTENT_ACCESS_WORDS.noContent}
        action={
          reference ? (
            <ButtonLink href={instituteRequestAddress(reference)}>
              {REQUEST_ACTIONS.viewRequestStatus}
            </ButtonLink>
          ) : null
        }
      >
        {CONTENT_ACCESS_WORDS.noContentLine}
      </ListState>
    </Surface>
  );
}
