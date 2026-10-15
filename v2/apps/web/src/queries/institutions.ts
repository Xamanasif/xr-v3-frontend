'use client';

/**
 * Institutions for the Super Admin (SA-06 Institutions, SA-07 Institution detail; boards B7-02,
 * B7-03), through `InstitutionService`. The port resolves who is asking from the session: only the
 * Super Admin may list institutions and read one institution's whole picture, and every status,
 * flag and refusal is the adapter's (`@xr/domain` through `@xr/sample-platform`). The screens pass
 * a tab, a search and inputs, and render the answers.
 *
 * The actions are commands — `useCommand(ports => ports.institutions.assignInstituteAdmin)` (also
 * `pauseInstitution`, `restoreInstitution`, `overrideStudentStatus`) — each sent with the revision
 * the page read (`expectedRev`); their receipts (`changed: INST, ACC` or `PER`) refresh these reads.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { InstitutionId } from '@xr/domain';

import type { InstitutionTabId } from '@/copy/institutions';

import { defineQuery, useXrQuery } from './use-xr-query';

/**
 * `listInstitutions`: the rows of one B7-02 tab, matching the search. The rows are read from the
 * institutions, their plans, the requests they came from and the experiments' courses.
 */
export const institutionRows = defineQuery({
  family: 'INST',
  view: 'super-admin-list',
  deps: ['INST', 'ACC', 'REQ', 'EXP'],
  read: (
    ports: ProductPorts,
    params: { readonly tab: InstitutionTabId; readonly search: string },
  ) =>
    ports.institutions.listInstitutions({
      tab: params.tab,
      ...(params.search.trim() ? { search: params.search } : {}),
    }),
});

/** The rows of a tab for a search; the previous rows stay on show while new ones load. */
export function useInstitutionRows(tab: InstitutionTabId, search: string) {
  return useXrQuery(institutionRows, { tab, search }, { keepPrevious: true });
}

/**
 * A tab's figure (B7-02 "All 7 · Access active 4 …"): how many institutions the service lists in
 * that tab — the search does not change the figures (B7-02 script: `n` counts every record).
 */
export function useInstitutionTab(tab: InstitutionTabId) {
  return useXrQuery(institutionRows, { tab, search: '' });
}

/**
 * `getInstitution`: the institution, its status, plans, people (each student with its record's
 * revision) and the per-format institution report (SA-07).
 */
export const institutionDetail = defineQuery({
  family: 'INST',
  view: 'super-admin-detail',
  deps: ['INST', 'ACC', 'PER', 'SACC', 'GRP', 'RUN', 'COMP', 'EXP'],
  // The address is untrusted text: existence and format are the adapter's answer (lenient ids).
  read: (ports: ProductPorts, institutionId: string) =>
    ports.institutions.getInstitution(institutionId as InstitutionId),
});

export function useInstitutionDetail(institutionId: string) {
  return useXrQuery(institutionDetail, institutionId);
}
