'use client';

import { useState } from 'react';

import { RV_BACK } from '@/copy/rv-shared';
import {
  REVIEW_QUEUE_ADDRESS,
  REVIEWED_BY_ME_ADDRESS,
  type ReviewerParent,
  reviewerParentOf,
} from '@/nav/reviewer';

/**
 * Which list an item page sits under (the export's `parentOf`): the Review queue while the item is
 * waiting for the reviewer's decision — or was when the page opened, so deciding on the page keeps
 * the reviewer under the queue — otherwise Reviewed by me. The breadcrumb, the browser tab, the
 * "Where" of Report a problem and the decided outcome's way back follow it; the current crumb is the
 * experiment's name, never the record's reference.
 */
export function useRvParent(itemId: string, waiting: boolean | null): ReviewerParent | null {
  const [first, setFirst] = useState<{ readonly id: string; readonly waiting: boolean } | null>(
    waiting === null ? null : { id: itemId, waiting },
  );
  // The first answer for this item fixes the parent (React's "adjust state while rendering").
  if (waiting !== null && (first === null || first.id !== itemId)) {
    setFirst({ id: itemId, waiting });
  }
  if (first !== null && first.id === itemId) return reviewerParentOf(first.waiting);
  return waiting === null ? null : reviewerParentOf(waiting);
}

/** The decided outcome's way back (`backLabel`): its words and address, by the parent. */
export function rvBackOf(parent: ReviewerParent): {
  readonly label: string;
  readonly href: string;
} {
  return parent === 'reviewed'
    ? { label: RV_BACK.reviewed, href: REVIEWED_BY_ME_ADDRESS }
    : { label: RV_BACK.queue, href: REVIEW_QUEUE_ADDRESS };
}
