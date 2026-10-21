'use client';

import type { ExperimentHub } from '@xr/contracts/draft';
import type { FormatProgressView, Technology } from '@xr/domain';

import { useFeedbackState, useFormatPage, useSimulationChooser } from '@/queries/learning';
import { useExperimentHub, useMyCourses, usePublishedName } from '@/queries/student';

import { useStudentSession } from '../shared/student-states';
import { type Closure, notAvailableKind } from '../shared/student-view';
import {
  codeShown,
  type FormatPageAnswer,
  type FormatView,
  formatView,
  unansweredView,
} from './format-view';

/** A format page's reads, settled into one view (or loading, failed, not found). */
export interface FormatModel {
  /** A read failed for now (`unavailable`): the drawn "failed, try again". */
  readonly failed: boolean;
  /** `null` while loading; `'not-found'` for the in-shell PU-15. */
  readonly outcome: FormatView | 'not-found' | null;
  readonly page: FormatPageAnswer | null;
  readonly hub: ExperimentHub | null;
  /** The course code the Student sees for the experiment (T-17), once read. */
  readonly code: string | null;
  /** ST-19 names the experiment from the public catalogue (`null` = unnamed or still reading). */
  readonly publishedName: string | null;
  readonly publishedPending: boolean;
  /** The session's closure (XS-08 banner facts): the format chip's hold. */
  readonly session: Closure;
  /**
   * The experiment's progress views (`getSimulationChooser`), read only for the AR / MR refusals'
   * "Formats you can use" (`null` until answered or when not read).
   */
  readonly formats: readonly FormatProgressView[] | null;
  /** Reads every failed read again ("Try again"). */
  retry(): void;
  /** Reads the format page again (after a launch refusal). */
  refetchPage(): void;
}

/**
 * ST-08 / ST-09 reads, side by side (BC3): `LearningService.getFormatPage` (progress, delivery,
 * gate, authorised device), `StudentAccessService.getExperimentHub` (the experiment's name, its
 * published formats, the Student's availability per format and the closure), the Student's course
 * rows for the code shown (T-17) and — for a completed format only — `FeedbackService
 * .getFeedbackState` for this format (BC5); for the AR / MR refusals only, the experiment's progress
 * views (`getSimulationChooser`, one aggregate read: "Formats you can use"). A refusal of the hub or
 * the page is ST-19's.
 */
export function useFormatModel(experimentId: string, format: Technology): FormatModel {
  const page = useFormatPage(experimentId, format);
  const hub = useExperimentHub(experimentId);
  const courses = useMyCourses();
  const pageAnswer = page.data;
  const hubAnswer = hub.data;
  const pageValue = pageAnswer?.ok ? pageAnswer.value : null;
  const hubValue = hubAnswer?.ok ? hubAnswer.value : null;
  const completed =
    pageValue !== null &&
    pageValue.progress.status === 'completed' &&
    pageValue.progress.completion !== null;
  const feedback = useFeedbackState(experimentId, format, completed);
  const feedbackAnswer = feedback.data;

  let outcome: FormatView | 'not-found' | null = null;
  if (hubAnswer && !hubAnswer.ok) {
    const refusal = notAvailableKind(hubAnswer.error);
    outcome = refusal === null ? 'not-found' : { kind: 'not-available', refusal };
  } else if (pageAnswer && !pageAnswer.ok) {
    outcome = hubValue ? unansweredView(pageAnswer.error, format, hubValue) : null;
  } else if (pageValue && hubValue && courses.data !== undefined) {
    if (!completed) outcome = formatView(pageValue, hubValue, null);
    else if (feedbackAnswer) {
      outcome = formatView(pageValue, hubValue, feedbackAnswer.ok ? feedbackAnswer.value : null);
    }
  }
  const refused = outcome !== null && outcome !== 'not-found' && outcome.kind === 'not-available';
  const published = usePublishedName(experimentId, refused);
  const message =
    outcome !== null &&
    outcome !== 'not-found' &&
    (outcome.kind === 'not-included' || outcome.kind === 'not-published');
  const chooser = useSimulationChooser(experimentId, message);
  const student = useStudentSession();

  return {
    failed: page.isError || hub.isError || courses.isError || (completed && feedback.isError),
    outcome,
    page: pageValue,
    hub: hubValue,
    code: hubValue && courses.data?.ok ? codeShown(hubValue, courses.data.value) : null,
    publishedName: published.name,
    publishedPending: published.isPending,
    session: student?.closure ?? null,
    formats: message && chooser.data?.ok ? chooser.data.value : null,
    retry: () => {
      if (page.isError) void page.refetch();
      if (hub.isError) void hub.refetch();
      if (courses.isError) void courses.refetch();
      if (feedback.isError) void feedback.refetch();
    },
    refetchPage: () => void page.refetch(),
  };
}
