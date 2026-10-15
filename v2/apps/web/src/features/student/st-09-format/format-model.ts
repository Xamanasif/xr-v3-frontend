'use client';

import type { ExperimentHub } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';

import { useFeedbackState, useFormatPage } from '@/queries/learning';
import { useExperimentHub, useMyCourses, usePublishedName } from '@/queries/student';

import { notAvailableKind } from '../shared/student-view';
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
 * .getFeedbackState` for this format (BC5). A refusal of the hub or the page is ST-19's.
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

  return {
    failed: page.isError || hub.isError || courses.isError || (completed && feedback.isError),
    outcome,
    page: pageValue,
    hub: hubValue,
    code: hubValue && courses.data?.ok ? codeShown(hubValue, courses.data.value) : null,
    publishedName: published.name,
    publishedPending: published.isPending,
    retry: () => {
      if (page.isError) void page.refetch();
      if (hub.isError) void hub.refetch();
      if (courses.isError) void courses.refetch();
      if (feedback.isError) void feedback.refetch();
    },
    refetchPage: () => void page.refetch(),
  };
}
