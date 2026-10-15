'use client';

/**
 * The Institute Admin's home and content reads (IA-01 Overview, IA-02 Content access, IA-03
 * Access plan; boards B2-01 … B2-03), through `InstitutionService` and — for the request a plan
 * came from — `AccessRequestService.getInstitutionRequest`. The port resolves who is asking from
 * the session: an Institute Admin reads only their own institution, and every status, item and
 * figure is the adapter's (`@xr/domain` through `@xr/sample-platform`). Licence figures are as
 * provided; nothing here counts licences (T-06 / D7).
 *
 * These screens send no command of their own: their actions open other pages (IA-05 Give
 * students access, IA-10 Add student, IA-06 People, IA-04 Student access). A receipt from any of
 * those (`changed: SACC, PER, GRP, CCODE …`) refreshes these reads through their `deps`.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { AccessPlanId, RequestId } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

/**
 * `getMyOverview` (IA-01): the institution, its status, the plan its status line names (with the
 * days left in its term) and the "Needs your attention" items — derived on every read from the
 * institution, its plans, grants, groups, students, course codes and the experiments.
 */
export const instituteOverview = defineQuery({
  family: 'institute',
  view: 'overview',
  deps: ['INST', 'ACC', 'SACC', 'PER', 'GRP', 'CCODE', 'EXP', 'CRS'],
  read: (ports: ProductPorts) => ports.institutions.getMyOverview(),
});

export function useInstituteOverview() {
  return useXrQuery(instituteOverview, null);
}

/**
 * `listContentAccess` (IA-02): per course, its plans (status, days left) and one row per plan
 * item — the formats in the plan, the published formats it leaves out and the students given it.
 */
export const contentAccess = defineQuery({
  family: 'ACC',
  view: 'content-access',
  deps: ['ACC', 'INST', 'SACC', 'GRP', 'CCODE', 'EXP', 'CRS'],
  read: (ports: ProductPorts) => ports.institutions.listContentAccess(),
});

export function useContentAccess() {
  return useXrQuery(contentAccess, null);
}

/**
 * `getAccessPlan` (IA-03): the plan, its status, what it holds, who has been given access (each
 * grant's plan-page status) and its grants for the history.
 */
export const accessPlan = defineQuery({
  family: 'ACC',
  view: 'institute-plan',
  deps: ['ACC', 'INST', 'SACC', 'GRP', 'PER', 'EXP', 'CRS'],
  // The address is untrusted text: existence and ownership are the adapter's answer.
  read: (ports: ProductPorts, planId: string) =>
    ports.institutions.getAccessPlan(planId as AccessPlanId),
});

export function useAccessPlan(planId: string) {
  return useXrQuery(accessPlan, planId);
}

/**
 * `getInstitutionRequest` (IA-03 history: "Request submitted", "Request approved · External"):
 * the request the plan came from, as the requesting institution's Institute Admin reads it
 * (REQ-28). Read only once the plan has named it.
 */
export const planRequest = defineQuery({
  family: 'REQ',
  view: 'institute-request',
  deps: ['REQ'],
  read: (ports: ProductPorts, requestId: string) =>
    ports.accessRequests.getInstitutionRequest(requestId as RequestId),
});

export function usePlanRequest(requestId: string | null) {
  return useXrQuery(planRequest, requestId ?? '', { enabled: requestId !== null });
}
