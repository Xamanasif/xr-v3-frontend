'use client';

/**
 * IA-20 Usage (Phase 3; board B3-10), through `OperationsService.getUsage`: per experiment ×
 * format, never summed and with no feedback column (P3-04 provisional: computed by the service from
 * the store with B3-10's one-line definitions). It reads the institution's grants, people and
 * groups (who has access), the runtime activity and the completions — so a grant, a runtime report
 * or a completion in the same tab refreshes it.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { CourseId } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

export const usage = defineQuery({
  family: 'RUN',
  view: 'institute-usage',
  deps: ['SACC', 'ACC', 'INST', 'PER', 'GRP', 'EXP', 'CRS', 'RUN', 'COMP'],
  read: (ports: ProductPorts, courseId: string | null) =>
    ports.operations.getUsage(courseId === null ? {} : { courseId: courseId as CourseId }),
});

export function useUsage(courseId: string | null = null, enabled = true) {
  return useXrQuery(usage, courseId, { enabled });
}
