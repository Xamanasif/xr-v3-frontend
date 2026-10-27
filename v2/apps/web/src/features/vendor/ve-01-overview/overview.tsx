'use client';

import {
  Button,
  ButtonLink,
  ListState,
  LoadingRows,
  Surface,
  VendorAttention,
  VendorOverviewColumn,
  VendorRecentActivity,
  VendorStudioBand,
  VendorWorkSplit,
} from '@xr/ui/v3';
import { useRef } from 'react';

import { weekdayDate } from '@/copy/dates';
import { stateWords } from '@/copy/state-copy';
import {
  attentionCountWords,
  courseLine,
  courseWords,
  CREATE_EXPERIMENT,
  VENDOR_FAILED_WORDS,
  VENDOR_OVERVIEW_WORDS,
} from '@/copy/vendor-home';
import {
  MY_EXPERIMENTS_ADDRESS,
  newExperimentAddress,
  vendorOverviewPlacement,
  VENDOR_OVERVIEW_TITLE,
} from '@/nav/vendor';
import {
  noCourseAssigned,
  useExperimentEditor,
  useMyExperiments,
  useVendorOverview,
} from '@/queries/production';
import { useCurrentSession, useSession } from '@/queries/session';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { myExperimentsFilterAddress } from '../ve-02-my-experiments/experiment-rows';
import { attentionOf, figuresOf, recentActivity } from './overview-view';
import { useRetryFocus } from './retry-focus';

const TITLE_ID = 've-h1';
const ATTENTION_ID = 've-att-h';
const ACTIVITY_ID = 've-act-h';
const FIRST_ID = 've-first-t';

/**
 * VE-01 Overview, the Vendor workspace home — the owner-approved Vendor export (V3 Refined B,
 * VE-v1 `Main.dc.html` overview view; HANDOFF §1, §7), at `/vendor`.
 *
 * - **Reads**: `ProductionService.getVendorOverview` — the attention facts (each returned
 *   experiment with the decision that returned it, then each draft) and whether the Vendor has any
 *   experiment; `listMyExperiments` (the read VE-02 lists) for the four counts, who returned an
 *   item and what it refers to, the step each draft last reached, whether a returned item holds
 *   saved changes, and Recent activity (the records' own history, no new events); `getEditor` for
 *   a new experiment, for the assigned courses of the course line. The H1 is the studio (the
 *   session's organisation). Every role's command in the tab refreshes them.
 * - **As the export draws it**: the studio band (today, the studio's name, the course line, Create
 *   experiment, the four counts: With you, In review, Published and Read-only when there is one);
 *   “Needs your action” — the returned item as the ivory lead (kind, name, who and when, the reason
 *   in full, what it refers to, “your changes are saved, not resubmitted” when the product can
 *   tell, the gold Revise), then further returned items and drafts to finish — or the calm block;
 *   Recent activity (the five newest entries, each opening its record) with “Changed in the last 7
 *   days” and “See all your experiments”; the first visit's “Create your first experiment”. On
 *   phones the attention panel comes before the counts (the export's container rules).
 * - No course assigned (owner decision PD-3; state-copy `VE-01.no-course.*`): no Create
 *   experiment anywhere on the page; the first visit explains it instead of offering it.
 * - Undrawn: loading and failed with Try again (state-copy `VE-01.loading`, `VE-01.failed`).
 *   Nothing here changes a record: every action opens the page where the work is done.
 */
export function VendorOverview() {
  useShellPage(vendorOverviewPlacement());
  const current = useCurrentSession();
  const organisation = current.data?.ok ? (current.data.value?.session.organisation ?? null) : null;
  const session = useSession();
  const now = session.status === 'signed-in' ? session.signedInAt : null;

  const read = useVendorOverview();
  const list = useMyExperiments();
  const editor = useExperimentEditor(null);
  const failedRead = (query: typeof read | typeof list) =>
    query.isError || (query.data !== undefined && !query.data.ok);
  const failed = failedRead(read) || failedRead(list);
  const answer = read.data?.ok ? read.data.value : null;
  const rows = list.data?.ok ? list.data.value : null;
  // The course line waits for the editor's read, or goes without it if that read fails.
  const coursesSettled = editor.data !== undefined || editor.isError;
  const loading = !failed && (answer === null || rows === null || !coursesSettled);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const retried = useRetryFocus(!loading && !failed, titleRef);
  const retry = () => {
    retried();
    if (failedRead(read)) void read.refetch();
    if (failedRead(list)) void list.refetch();
  };

  const courses = editor.data?.ok
    ? editor.data.value.assignedCourses.map((course) =>
        courseWords(course.platformCode, course.name),
      )
    : [];
  const ready = !loading && !failed && answer !== null && rows !== null;
  const hasAny = ready && answer.hasExperiments;
  // No course assigned (PD-3): nothing to create — no Create experiment, a calm explanation.
  const noCourse = noCourseAssigned(editor.data);

  const band = (
    <VendorStudioBand
      title={organisation ?? VENDOR_OVERVIEW_TITLE}
      titlePrefix={organisation ? VENDOR_OVERVIEW_WORDS.titlePrefix : undefined}
      titleId={TITLE_ID}
      titleRef={titleRef}
      date={now ? weekdayDate(now) : undefined}
      status={
        ready && courses.length > 0
          ? courseLine(courses)
          : hasAny && noCourse
            ? stateWords('VE-01.no-course.status')
            : undefined
      }
      action={
        (ready && !answer.hasExperiments) || noCourse
          ? undefined
          : { href: newExperimentAddress(), label: CREATE_EXPERIMENT }
      }
      figures={hasAny ? figuresOf(rows) : []}
      figuresLabel={VENDOR_OVERVIEW_WORDS.figuresLabel}
    />
  );

  if (failed) {
    return (
      <VendorOverviewColumn>
        {band}
        <Surface>
          <ListState
            kind="failed"
            title={stateWords('VE-01.failed')}
            action={<Button onClick={retry}>{VENDOR_FAILED_WORDS.tryAgain}</Button>}
          >
            {VENDOR_FAILED_WORDS.line}
          </ListState>
        </Surface>
      </VendorOverviewColumn>
    );
  }

  if (!ready) {
    return (
      <VendorOverviewColumn>
        {band}
        <Surface>
          <LoadingRows message={stateWords('VE-01.loading')} cells={[2, 1]} />
        </Surface>
      </VendorOverviewColumn>
    );
  }

  if (!answer.hasExperiments && noCourse) {
    return (
      <VendorOverviewColumn>
        {band}
        <Surface labelledBy={FIRST_ID}>
          <ListState
            kind="none"
            roomy
            titleAs="h2"
            titleId={FIRST_ID}
            icon="myExperiments"
            title={stateWords('VE-01.no-course.title')}
          >
            {stateWords('VE-01.no-course.line')}
          </ListState>
        </Surface>
      </VendorOverviewColumn>
    );
  }

  if (!answer.hasExperiments) {
    return (
      <VendorOverviewColumn>
        {band}
        <Surface labelledBy={FIRST_ID}>
          <ListState
            kind="none"
            roomy
            titleAs="h2"
            titleId={FIRST_ID}
            icon="myExperiments"
            title={VENDOR_OVERVIEW_WORDS.firstTitle}
            action={
              <ButtonLink href={newExperimentAddress()} variant="primary" size="lg">
                {CREATE_EXPERIMENT}
              </ButtonLink>
            }
          >
            {VENDOR_OVERVIEW_WORDS.firstLine}
          </ListState>
        </Surface>
      </VendorOverviewColumn>
    );
  }

  const attention = attentionOf(answer.attention, rows, now);
  return (
    <VendorOverviewColumn>
      {band}
      <VendorWorkSplit>
        <VendorAttention
          title={VENDOR_OVERVIEW_WORDS.attention}
          titleId={ATTENTION_ID}
          note={attentionCountWords(attention.count)}
          lead={attention.lead ?? undefined}
          rows={attention.rows}
          calm={
            attention.count === 0
              ? { title: VENDOR_OVERVIEW_WORDS.calmTitle, line: VENDOR_OVERVIEW_WORDS.calmLine }
              : undefined
          }
        />
        <VendorRecentActivity
          title={VENDOR_OVERVIEW_WORDS.activity}
          titleId={ACTIVITY_ID}
          note={VENDOR_OVERVIEW_WORDS.newestFirst}
          rows={recentActivity(rows, now)}
          links={[
            {
              href: myExperimentsFilterAddress(null, true),
              label: VENDOR_OVERVIEW_WORDS.changedRecently,
            },
            { href: MY_EXPERIMENTS_ADDRESS, label: VENDOR_OVERVIEW_WORDS.seeAll },
          ]}
        />
      </VendorWorkSplit>
    </VendorOverviewColumn>
  );
}
