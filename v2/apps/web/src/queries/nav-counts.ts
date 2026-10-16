'use client';

/**
 * The figures the workspace sidebar counts (board 06 `countText`; `nav/nav-config.ts`
 * `countWords`), read through the ports — the boards' sample numbers are never product data. A
 * count shows only on a built destination (`nav/sidebar-model.ts`), and only the reads of the
 * signed-in person's own workspace run.
 *
 * Built so far: the Super Admin's Requests — "requests under review" (B1-10 caption "Nav count 3 =
 * requests under review"), the rows `AccessRequestService.listRequests` answers with that status
 * (also SA-01's Requests group, Package 1D); the Faculty member's Marking (Phase 4B). Other
 * workspaces' counts arrive with their destinations.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { Role } from '@xr/domain';
import { useMemo } from 'react';

import { defineQuery, useXrQuery } from './use-xr-query';

export const requestsUnderReview = defineQuery({
  family: 'nav-counts',
  view: 'super-admin-requests',
  deps: ['REQ'],
  read: (ports: ProductPorts) =>
    ports.accessRequests.listRequests({ status: 'under-review', sort: 'received-newest' }),
});

/**
 * The requests under review themselves, newest first: the Super Admin's Overview lists them in its
 * Requests group (SA-01, Package 1D) from the very read the sidebar counts, so the group's figure
 * and the sidebar's can never differ.
 */
export function useRequestsUnderReview() {
  return useXrQuery(requestsUnderReview, null);
}

/**
 * Phase 4B: the Faculty member's Marking count — "2 written answers to mark" (B4-09 f0, B4-06 f7
 * sidebars) — the rows FA-18's queue answers as waiting, so the figure and the queue agree.
 */
export const writtenAnswersToMark = defineQuery({
  family: 'nav-counts',
  view: 'faculty-marking',
  deps: ['FMAP', 'ACC', 'INST', 'PER', 'CRS', 'EXP', 'SACC', 'GRP', 'ASMT', 'ATT', 'Q'],
  read: (ports: ProductPorts) => ports.marking.listQueue({ state: 'waiting' }),
});

/**
 * Phase 5: the Academic Reviewer's Review queue — "{n} waiting for review" (board 06 words; B6-01
 * f0 sidebar "4") — the very items RV-02 answers unfiltered; and the Content Manager's Ready to
 * publish — "{n} ready to publish" (B6-05 f0 sidebar "2") — the rows CM-02 answers.
 */
export const waitingForReview = defineQuery({
  family: 'nav-counts',
  view: 'reviewer-queue',
  deps: ['SUB', 'EXP', 'UPD', 'CRS', 'AREA', 'ROLE'],
  read: (ports: ProductPorts) => ports.production.getReviewQueue({}),
});

export const readyToPublishCount = defineQuery({
  family: 'nav-counts',
  view: 'content-manager-ready',
  deps: ['SUB', 'EXP', 'UPD', 'CRS', 'AREA', 'ROLE'],
  read: (ports: ProductPorts) => ports.production.listReadyToPublish(),
});

/** Count figures by destination key (zero or absent: no count is drawn). */
export function useNavCounts(role: Role): Readonly<Partial<Record<string, number>>> {
  const requests = useXrQuery(requestsUnderReview, null, { enabled: role === 'super_admin' });
  const marking = useXrQuery(writtenAnswersToMark, null, { enabled: role === 'faculty' });
  const queue = useXrQuery(waitingForReview, null, { enabled: role === 'academic_reviewer' });
  const ready = useXrQuery(readyToPublishCount, null, { enabled: role === 'content_manager' });
  const underReview =
    role === 'super_admin' && requests.data?.ok ? requests.data.value.length : undefined;
  const toMark = role === 'faculty' && marking.data?.ok ? marking.data.value.length : undefined;
  const toReview =
    role === 'academic_reviewer' && queue.data?.ok ? queue.data.value.length : undefined;
  const toPublish =
    role === 'content_manager' && ready.data?.ok ? ready.data.value.length : undefined;
  return useMemo(
    () => ({
      ...(underReview === undefined ? {} : { requests: underReview }),
      ...(toMark === undefined ? {} : { marking: toMark }),
      ...(toReview === undefined ? {} : { 'review-queue': toReview }),
      ...(toPublish === undefined ? {} : { 'ready-to-publish': toPublish }),
    }),
    [underReview, toMark, toReview, toPublish],
  );
}
