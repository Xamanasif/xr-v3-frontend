'use client';

/**
 * SA-19's second read (Phase 3, Device transfer decision; B3-11 f1): the institution a transfer
 * belongs to — its name and its people, for the Student's institution ID ("Rahul Verma ·
 * GIT-2026-0418") — through the SA-07 read `InstitutionService.getInstitution`, asked only once
 * the transfer has named its institution. The DTR record itself carries ids, not names.
 */
import { institutionDetail } from './institutions';
import { useXrQuery } from './use-xr-query';

export function useTransferInstitution(institutionId: string | null) {
  return useXrQuery(institutionDetail, institutionId ?? '', { enabled: institutionId !== null });
}
