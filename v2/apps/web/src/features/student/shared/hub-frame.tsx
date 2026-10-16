'use client';

import type { ExperimentHub as HubAnswer, MyCourseRow, ServiceError } from '@xr/contracts/draft';
import { FormatBadge, LoadingState, PageContent, RecordHubTabs } from '@xr/ui';
import type { ReactNode } from 'react';

import { HUB_TABS } from '@/copy/learning-hub';
import { stateWords } from '@/copy/state-copy';
import { courseLine, formatCode, HUB_AVAILABILITY, HUB_PAGE, STUDENT_WORDS } from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import { experimentPlacement, notAvailablePlacement } from '@/nav/student';
import { type HubTab, hubTabAddress, hubTabPlacement } from '@/nav/student-hub';
import { useExperimentHub, useMyCourses, usePublishedName } from '@/queries/student';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { NOT_AVAILABLE_TITLE, NotAvailable } from '../st-19-not-available/not-available';
import { StudentFailed, useRetryFocus, useStudentSession } from './student-states';
import {
  type Closure,
  hubFormatOrder,
  isGiven,
  type NotAvailableKind,
  notAvailableKind,
  policyOpenOf,
} from './student-view';

/**
 * The experiment hub's frame, shared by its four built pages — ST-05 Overview (B2-12), ST-06
 * Resources and ST-10 Progress (B3-01), ST-07 Simulation (B3-02): the dark header
 * (`div.xw-hubhead.xr-dark`: course line, name, the Student's availability per format) and the
 * tab strip (`nav.xr-tabs.xr-tabs--on-white.xw-hubtabs`, link tabs Overview · Resources ·
 * Simulation · Progress). The Overview's header also carries the description and the Next step
 * (B2-12 f0); the tabs' header is the compact `xl-hubhead` without them (B3-01 f0, B3-02 f0).
 * "Assessment" (B4-11, Phase 4) is not rendered (DEV-21).
 *
 * - **Read**: `StudentAccessService.getExperimentHub` (the published page, availability and
 *   progress per format, read side by side — BC3), the course's code as the Student's course row
 *   shows it (T-17, `listMyCourses`), the closure from the session's banner facts (XS-08).
 * - **ST-19**: a refusal or an open decision — of the hub read or of the tab's own read — renders
 *   the message page in place (shell placement "My courses / Not available"), as ST-05 always
 *   did; an answer that is neither (an unknown address) is the in-shell not-found.
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
      return (
        <PageContent wrap="wide">
          <StudentFailed title={stateWords('ST-05.failed')} onRetry={state.retry} />
        </PageContent>
      );
    case 'not-available':
      if (state.pending) return <HubLoading />;
      return <NotAvailable kind={state.refusal} name={state.name} />;
    case 'loading':
      return <HubLoading />;
  }
}

function HubLoading() {
  return (
    <PageContent wrap="wide">
      <LoadingState label={stateWords('ST-05.loading')} surface="section" />
    </PageContent>
  );
}

/**
 * The dark header. Overview (B2-12 f0): course line, name, description, then the formats beside
 * the Next step (`div.xw-hubrow`). A tab (B3-01 f0; B3-02 f0): `xl-hubhead`, course line, name and
 * the formats only.
 */
export function HubHeader({
  view,
  overview,
}: {
  readonly view: HubView;
  /** The Overview's description and Next step (`null`: none, B2-12 f3). */
  readonly overview?: { readonly nextStep: ReactNode };
}) {
  const { hub, course, closure } = view;
  const formats = (
    <ul className="xw-fav" aria-label={HUB_PAGE.formatsLabel}>
      {hubFormatOrder(hub.row).map((entry) => {
        const words = hubFormatWords(entry.availability, closure);
        return (
          <li key={entry.format} className={words.off ? 'is-off' : undefined}>
            <FormatBadge
              format={formatCode(entry.format)}
              variant={words.off ? 'off' : 'on-dark'}
              compact
            />
            <span>{words.text}</span>
          </li>
        );
      })}
    </ul>
  );
  if (!overview) {
    return (
      <div className="xw-hubhead xr-dark xl-hubhead">
        <span className="xr-overline">{course}</span>
        <h1 className="xr-h1 m-0">{hub.experiment.name}</h1>
        {formats}
      </div>
    );
  }
  return (
    <div className="xw-hubhead xr-dark">
      <span className="xr-overline">{course}</span>
      <h1 className="xr-h1 m-0">{hub.experiment.name}</h1>
      <p>{hub.experiment.description}</p>
      <div className="xw-hubrow">
        {formats}
        {overview.nextStep}
      </div>
    </div>
  );
}

/**
 * B2-12's header words per format, the same on every tab (B3-01 f6, B3-02 f5): the given formats
 * read "Paused" while paused (f3), "Inactive" for an inactive account (`ST-05.inactive-format`); a
 * licence wait keeps "Available to you" (B3-02 f4); an undecided rule reads "Not settled yet".
 */
export function hubFormatWords(
  availability: HubAnswer['row']['formats'][number]['availability'],
  closure: Closure,
): { readonly text: string; readonly off: boolean } {
  if (policyOpenOf(availability) !== null) {
    return { text: stateWords('ST-05.format-policy-open'), off: true };
  }
  if (typeof availability === 'object') return { text: '', off: true };
  if (isGiven(availability) && closure === 'paused')
    return { text: STUDENT_WORDS.paused, off: true };
  if (isGiven(availability) && closure === 'inactive') {
    return { text: stateWords('ST-05.inactive-format'), off: true };
  }
  return { text: HUB_AVAILABILITY[availability], off: availability !== 'available-to-you' };
}

/**
 * The hub's tab strip (B2-12 f0; B3-01 f0, f8; B3-02 f0), named by the experiment, the page's tab
 * current; the Assessment tab since Phase 4B (B4-11 f7).
 */
export function HubTabs({
  experimentId,
  name,
  current,
}: {
  readonly experimentId: string;
  readonly name: string;
  readonly current: HubTab;
}) {
  const tabs: readonly HubTab[] = ['overview', 'resources', 'simulation', 'assessment', 'progress'];
  return (
    <RecordHubTabs
      label={name}
      tabs={tabs.map((tab) => ({
        href: hubTabAddress(experimentId, tab),
        label: HUB_TABS[tab],
        current: tab === current,
      }))}
    />
  );
}

/** A tab page: the compact header, the strip, then the tab's content (B3-01, B3-02). */
export function HubTabPage({
  experimentId,
  view,
  tab,
  children,
}: {
  readonly experimentId: string;
  readonly view: HubView;
  readonly tab: Exclude<HubTab, 'overview'>;
  readonly children: ReactNode;
}) {
  return (
    <PageContent wrap="wide">
      <HubHeader view={view} />
      <HubTabs experimentId={experimentId} name={view.hub.experiment.name} current={tab} />
      {children}
    </PageContent>
  );
}
