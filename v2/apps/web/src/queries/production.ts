'use client';

/**
 * First-publication reads (Phase 5; boards B5-01 … B5-08, B6-01 … B6-12): the Vendor's Overview
 * (VE-01), My experiments (VE-02), the editor (VE-03 … VE-06, VE-08, VE-09) and the record with its
 * history (VE-07, VE-13); the Academic Reviewer's Overview (RV-01), queue (RV-02), a submission to
 * review (RV-03 / RV-06) and Reviewed by me (RV-05); the Content Manager's Overview (CM-01), Ready
 * to publish (CM-02), a publication decision (CM-03), the Content library (CM-04), a published
 * experiment (CM-05) and the platform course codes (CM-09). Each read declares the record kinds
 * it is read from, so every role's command (save, submit, return, resubmit — and the routing
 * stand-in's system event that follows it — approve, publish, send back, save codes) refreshes
 * every other role's view in the same tab: one world, one record (BC14).
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { ExperimentId, SubmissionId } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

/** What a first-publication view is read from: submissions, experiments, corrections, structure, scopes. */
const DEPS = ['SUB', 'EXP', 'UPD', 'CRS', 'AREA', 'ROLE'] as const;

// ---- Vendor ----

export const vendorOverview = defineQuery({
  family: 'vendor',
  view: 'vendor-overview',
  deps: DEPS,
  read: (ports: ProductPorts) => ports.production.getVendorOverview(),
});

/** VE-01 (B5-01 f0 … f3). */
export function useVendorOverview(enabled = true) {
  return useXrQuery(vendorOverview, null, { enabled });
}

export type MyExperimentsStatus =
  | 'draft'
  | 'submitted'
  | 'with-academic-reviewer'
  | 'returned'
  | 'with-content-manager'
  | 'published';

export const myExperiments = defineQuery({
  family: 'SUB',
  view: 'vendor-my-experiments',
  deps: DEPS,
  read: (
    ports: ProductPorts,
    filter: { readonly status: MyExperimentsStatus | null; readonly search: string },
  ) =>
    ports.production.listMyExperiments({
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.search.trim() ? { search: filter.search } : {}),
    }),
});

/** VE-02 (B5-02): the Vendor's own experiments, newest change first. */
export function useMyExperiments(
  filter: { readonly status: MyExperimentsStatus | null; readonly search: string } = {
    status: null,
    search: '',
  },
  enabled = true,
) {
  return useXrQuery(myExperiments, filter, { enabled, keepPrevious: true });
}

export const experimentEditor = defineQuery({
  family: 'SUB',
  view: 'vendor-editor',
  deps: DEPS,
  read: (
    ports: ProductPorts,
    input: {
      readonly id: string | null;
      readonly step: 'course' | 'formats' | 'preview' | 'submit';
    },
  ) =>
    ports.production.getEditor({
      id: input.id as SubmissionId | null,
      step: input.step,
    }),
});

/** The editor (VE-03 … VE-06, VE-08, VE-09): the record (or none), the assigned courses, read-only. */
export function useExperimentEditor(
  id: string | null,
  step: 'course' | 'formats' | 'preview' | 'submit' = 'course',
  enabled = true,
) {
  return useXrQuery(experimentEditor, { id, step }, { enabled });
}

/**
 * No course is assigned to the Vendor — none yet, or every one withdrawn (owner decision PD-3):
 * the editor's read for a new experiment answers not permitted · out of scope.
 */
export function noCourseAssigned(
  answer:
    | { readonly ok: true }
    | { readonly ok: false; readonly error: { readonly kind: string; readonly why?: string } }
    | undefined,
): boolean {
  return (
    answer !== undefined &&
    !answer.ok &&
    answer.error.kind === 'not-permitted' &&
    answer.error.why === 'out-of-scope'
  );
}

export const vendorRecord = defineQuery({
  family: 'SUB',
  view: 'vendor-record',
  deps: DEPS,
  read: (ports: ProductPorts, id: string) => ports.production.getRecord(id as SubmissionId),
});

/** VE-07 / VE-13 and the editor's return notice (B5-06, B5-07): the record, its guards, the last return. */
export function useVendorRecord(id: string | null, enabled = true) {
  return useXrQuery(vendorRecord, id ?? '', { enabled: enabled && id !== null });
}

// ---- Academic Reviewer ----

export const reviewerOverview = defineQuery({
  family: 'reviewer',
  view: 'reviewer-overview',
  deps: DEPS,
  read: (ports: ProductPorts) => ports.production.getReviewerOverview(),
});

/** RV-01 (B6-01). */
export function useReviewerOverview(enabled = true) {
  return useXrQuery(reviewerOverview, null, { enabled });
}

export type ReviewQueueFilter = {
  readonly type: 'new' | 'update' | 'recheck' | null;
  readonly courseId: string | null;
  readonly search: string;
};

export const reviewQueue = defineQuery({
  family: 'SUB',
  view: 'review-queue',
  deps: DEPS,
  read: (ports: ProductPorts, filter: ReviewQueueFilter) =>
    ports.production.getReviewQueue({
      ...(filter.type ? { type: filter.type } : {}),
      ...(filter.courseId ? { courseId: filter.courseId as never } : {}),
      ...(filter.search.trim() ? { search: filter.search } : {}),
    }),
});

/** RV-02 (B6-02 f0, f2 … f5): oldest first. The sidebar counts the unfiltered read. */
export function useReviewQueue(
  filter: ReviewQueueFilter = { type: null, courseId: null, search: '' },
  enabled = true,
) {
  return useXrQuery(reviewQueue, filter, { enabled, keepPrevious: true });
}

export const submissionForReview = defineQuery({
  family: 'SUB',
  view: 'review-submission',
  deps: DEPS,
  read: (ports: ProductPorts, id: string) =>
    ports.production.getSubmissionForReview(id as SubmissionId),
});

/** RV-03 / RV-06 (B6-03): the submission, what changed, the previous return, a re-check, decided. */
export function useSubmissionForReview(id: string | null, enabled = true) {
  return useXrQuery(submissionForReview, id ?? '', { enabled: enabled && id !== null });
}

export const reviewedByMe = defineQuery({
  family: 'SUB',
  view: 'reviewed-by-me',
  deps: DEPS,
  read: (ports: ProductPorts) => ports.production.listReviewedByMe(),
});

/** RV-05 (B6-02 f1): the reviewer's own decisions, newest first, and where each record is now. */
export function useReviewedByMe(enabled = true) {
  return useXrQuery(reviewedByMe, null, { enabled });
}

// ---- Content Manager ----

export const contentManagerOverview = defineQuery({
  family: 'content-manager',
  view: 'content-manager-overview',
  deps: DEPS,
  read: (ports: ProductPorts) => ports.production.getContentManagerOverview(),
});

/** CM-01 (B6-05). */
export function useContentManagerOverview(enabled = true) {
  return useXrQuery(contentManagerOverview, null, { enabled });
}

export const readyToPublish = defineQuery({
  family: 'SUB',
  view: 'ready-to-publish',
  deps: DEPS,
  read: (ports: ProductPorts) => ports.production.listReadyToPublish(),
});

/** CM-02 (B6-06 f0, f2, f3). The sidebar counts the same read. */
export function useReadyToPublish(enabled = true) {
  return useXrQuery(readyToPublish, null, { enabled });
}

export const publicationDecision = defineQuery({
  family: 'SUB',
  view: 'publication-decision',
  deps: DEPS,
  read: (ports: ProductPorts, id: string) =>
    ports.production.getPublicationDecision(id as SubmissionId),
});

/** CM-03 (B6-07): the submission, the publication check and the catalogue preview. */
export function usePublicationDecision(id: string | null, enabled = true) {
  return useXrQuery(publicationDecision, id ?? '', { enabled: enabled && id !== null });
}

export const contentLibrary = defineQuery({
  family: 'SUB',
  view: 'content-library',
  deps: DEPS,
  read: (
    ports: ProductPorts,
    filter: {
      readonly tab: 'ready' | 'in-review' | 'with-vendor' | 'published';
      readonly search: string;
    },
  ) =>
    ports.production.getLibrary({
      tab: filter.tab,
      ...(filter.search.trim() ? { search: filter.search } : {}),
    }),
});

/** CM-04 (B6-06 f1, f4): the four tabs' counts and the chosen tab's rows. */
export function useContentLibrary(
  filter: {
    readonly tab: 'ready' | 'in-review' | 'with-vendor' | 'published';
    readonly search: string;
  },
  enabled = true,
) {
  return useXrQuery(contentLibrary, filter, { enabled, keepPrevious: true });
}

export const publishedExperiment = defineQuery({
  family: 'EXP',
  view: 'cm-published-experiment',
  deps: DEPS,
  read: (ports: ProductPorts, id: string) =>
    ports.corrections.getPublishedExperiment(id as ExperimentId),
});

/** CM-05 (B6-08): the live experiment, its open correction (if any) and whether she may join it. */
export function usePublishedExperiment(id: string | null, enabled = true) {
  return useXrQuery(publishedExperiment, id ?? '', { enabled: enabled && id !== null });
}

export const platformCourseCodes = defineQuery({
  family: 'CRS',
  view: 'platform-course-codes',
  deps: ['CRS', 'AREA', 'EXP'],
  read: (ports: ProductPorts) => ports.platformCourseCodes.list(),
});

/** CM-09 (B6-10): every course, its area, its published experiments and its platform code. */
export function usePlatformCourseCodes(enabled = true) {
  return useXrQuery(platformCourseCodes, null, { enabled });
}
