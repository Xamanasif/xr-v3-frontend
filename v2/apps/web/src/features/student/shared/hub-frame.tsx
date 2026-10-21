'use client';

import type { ExperimentHub as HubAnswer, MyCourseRow, ServiceError } from '@xr/contracts/draft';
import {
  Breadcrumbs,
  InstitutionCode,
  StatusPill,
  StLoading,
  StMessage,
  StRecordHead,
  StTabs,
} from '@xr/ui/v3';
import { Fragment, type ReactNode, useId } from 'react';

import { HUB_HEAD, HUB_TABS, hubTabsLabel } from '@/copy/learning-hub';
import { ST_ACCESS_WORDS, ST_STATE_WORDS } from '@/copy/st-shared';
import { stateWords } from '@/copy/state-copy';
import { courseLine } from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import {
  experimentPlacement,
  MY_COURSES_ADDRESS,
  MY_COURSES_TITLE,
  myCourseAddress,
  notAvailablePlacement,
} from '@/nav/student';
import { type HubTab, hubTabAddress, hubTabPlacement } from '@/nav/student-hub';
import { useExperimentHub, useMyCourses, usePublishedName } from '@/queries/student';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { NOT_AVAILABLE_TITLE, NotAvailable } from './not-available';
import { useRetryFocus, useStudentSession } from './student-states';
import { useStudentTodayLine } from './use-today';
import { type Closure, type NotAvailableKind, notAvailableKind } from './student-view';

/**
 * The experiment hub's frame, shared by its five pages — ST-05 Overview, ST-06 Resources, ST-07
 * Simulation, the Assessment tab (the assess group's body) and ST-10 Progress — as the V3 Student
 * export draws it (ST-v1 `StudentFinal.dc.html`, the `is.hub` region, `hubVM`): the breadcrumbs
 * (My courses › the course › the experiment), the record head (the course code shown in its chip,
 * the course, the experiment's name as the page's one H1, and a licence wait's pill with "Your
 * institution can tell you more."), then the five section tabs (`nav.rk-tabs.sv-tabs--chips`,
 * named "<experiment> sections"). A pause or an inactive account is said once, by the shell's
 * banner (XS-08); the formats' availability is each tab's own.
 *
 * - **Read**: `StudentAccessService.getExperimentHub` (the published page, availability and
 *   progress per format, read side by side — BC3), the course's code as the Student's course row
 *   shows it (T-17, `listMyCourses`), the closure from the session's banner facts (XS-08).
 * - **ST-19**: a refusal or an open decision — of the hub read or of the tab's own read — renders
 *   the message page in place (shell placement "My courses / Not available"), as ST-05 always
 *   did; an answer that is neither (an unknown address) is the in-shell not-found.
 * - **Loading / failed** are not drawn by the export for the hub: the shared V3 loading block and
 *   the compact failed message (`ST-05.loading`, `ST-05.failed`).
 */
export interface HubView {
  readonly hub: HubAnswer;
  readonly code: string | null;
  readonly course: string;
  readonly closure: Closure;
}

export type HubPageState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed'; readonly retry: () => void }
  | { readonly kind: 'not-found' }
  | {
      readonly kind: 'not-available';
      readonly refusal: NotAvailableKind;
      readonly name: string | null;
      readonly pending: boolean;
    }
  | { readonly kind: 'ready'; readonly view: HubView };

/**
 * The hub's reads and the page's place in the shell. `tabError` is the tab's own read refusing
 * (`listResources`, `getSimulationChooser`): it reads as the hub's refusal would.
 */
export function useHubPage(
  experimentId: string,
  tab: HubTab,
  tabError: ServiceError | null = null,
): HubPageState {
  const read = useExperimentHub(experimentId);
  const courses = useMyCourses();
  const student = useStudentSession();
  const answer = read.data;
  const error = answer && !answer.ok ? answer.error : tabError;
  const refusal = error ? notAvailableKind(error) : null;
  const published = usePublishedName(experimentId, refusal !== null);
  const hub = answer?.ok ? answer.value : null;
  const code = hub ? codeShown(hub, courses.data?.ok ? courses.data.value : []) : null;
  const experiment = hub
    ? {
        id: experimentId,
        name: hub.experiment.name,
        course: { crumb: code ?? hub.experiment.courseName, courseId: hub.experiment.courseId },
      }
    : null;

  useShellPage(
    refusal !== null
      ? notAvailablePlacement(NOT_AVAILABLE_TITLE)
      : tab === 'overview'
        ? experimentPlacement(experiment)
        : hubTabPlacement(tab, experiment),
  );
  const ready = hub !== null && courses.data !== undefined && student !== null;
  const retried = useRetryFocus(ready);

  if (read.isError || (hub && courses.isError)) {
    return {
      kind: 'failed',
      retry: () => {
        retried();
        void read.refetch();
        if (courses.isError) void courses.refetch();
      },
    };
  }
  if (error) {
    if (refusal === null) return { kind: 'not-found' };
    return {
      kind: 'not-available',
      refusal,
      name: published.name,
      pending: published.isPending,
    };
  }
  if (!ready || !hub) return { kind: 'loading' };
  return {
    kind: 'ready',
    view: {
      hub,
      code,
      course: courseLine(code, hub.experiment.courseName),
      closure: student.closure,
    },
  };
}

/** The course code the Student's course row shows (T-17), else the platform code (`ST-05.code`). */
function codeShown(hub: HubAnswer, courses: readonly MyCourseRow[]): string | null {
  const row = courses.find((course) => course.courseId === hub.experiment.courseId);
  return row ? row.codeShown : hub.experiment.platformCode;
}

/** Every state of a hub page but `ready`: loading, failed + retry, ST-19, not found. */
export function HubFallback({
  state,
}: {
  readonly state: Exclude<HubPageState, { kind: 'ready' }>;
}) {
  const navigation = useAppNavigation();
  switch (state.kind) {
    case 'not-found':
      return navigation.notFound();
    case 'failed':
      return <HubFailed title={stateWords('ST-05.failed')} onRetry={state.retry} />;
    case 'not-available':
      if (state.pending) return <HubLoading />;
      return <NotAvailable kind={state.refusal} name={state.name} />;
    case 'loading':
      return <HubLoading />;
  }
}

function HubLoading() {
  return <StLoading variant="card" label={stateWords('ST-05.loading')} />;
}

/** A read of a hub page failed for now: the compact failed message with "Try again". */
export function HubFailed({
  title,
  onRetry,
}: {
  readonly title: string;
  readonly onRetry: () => void;
}) {
  const titleId = useId();
  return (
    <StMessage
      icon="cloudAlert"
      tone="err"
      alert
      title={title}
      titleId={titleId}
      description={ST_STATE_WORDS.failedLine}
      retry={{ label: ST_STATE_WORDS.tryAgain, onRetry }}
    />
  );
}

/**
 * The hub's head (`hubVM`): the breadcrumbs, the course code and course above the experiment's
 * name, and — while the Student waits for a licence, not paused — the pill "Waiting for a
 * licence" with "Your institution can tell you more." (said once here; the tabs' notes stop at
 * the reason).
 */
function HubHead({ view }: { readonly view: HubView }) {
  const today = useStudentTodayLine();
  const { hub, code, closure } = view;
  const waiting = hub.row.closure?.kind === 'waiting-for-a-licence';
  const paused = closure === 'paused' || hub.row.closure?.kind === 'institution-paused';
  return (
    <StRecordHead
      breadcrumbs={
        <Breadcrumbs
          levels={[
            { label: MY_COURSES_TITLE, href: MY_COURSES_ADDRESS },
            { label: hub.experiment.courseName, href: myCourseAddress(hub.experiment.courseId) },
          ]}
          current={hub.experiment.name}
        />
      }
      date={today}
      lead={code ? <InstitutionCode code={code} /> : null}
      context={hub.experiment.courseName}
      title={hub.experiment.name}
      meta={
        waiting && !paused ? (
          <>
            <StatusPill tone="warn">{ST_ACCESS_WORDS.waiting}</StatusPill>
            <span>{HUB_HEAD.tellMore}</span>
          </>
        ) : undefined
      }
    />
  );
}

const TABS: readonly HubTab[] = ['overview', 'resources', 'simulation', 'assessment', 'progress'];

/** The hub's five sections (`nav.rk-tabs.sv-tabs.sv-tabs--chips`), the page's tab current. */
function HubSections({
  experimentId,
  name,
  current,
}: {
  readonly experimentId: string;
  readonly name: string;
  readonly current: HubTab;
}) {
  return (
    <StTabs
      chips
      label={hubTabsLabel(name)}
      tabs={TABS.map((tab) => ({
        href: hubTabAddress(experimentId, tab),
        label: HUB_TABS[tab],
        current: tab === current,
      }))}
    />
  );
}

/** A hub page: the head, the section tabs, then the tab's content. */
export function HubTabPage({
  experimentId,
  view,
  tab,
  children,
}: {
  readonly experimentId: string;
  readonly view: HubView;
  readonly tab: HubTab;
  readonly children: ReactNode;
}) {
  return (
    <Fragment>
      <HubHead view={view} />
      <HubSections experimentId={experimentId} name={view.hub.experiment.name} current={tab} />
      {children}
    </Fragment>
  );
}
