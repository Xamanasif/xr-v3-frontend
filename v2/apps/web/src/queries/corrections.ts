'use client';

/**
 * The correction chain's reads (Phase 6; Flow F — boards B6-04, B6-08, B6-09, B6-11, B6-13, B7-05,
 * B7-10, B7-11): the Content Manager's Updates and one update (CM-08, with the drafts CM-06 and
 * CM-07 open), the Academic Reviewer's Review an update (RV-04) and the Super Admin's Updates and
 * Release or hold decision (SA-10, SA-11), through `CorrectionService`. One UPD record for the
 * three roles (BC14): each read declares the record kinds it is read from, so every role's command
 * (open, save, send, withdraw, approve, return, release, hold, lift hold) refreshes every other
 * role's view in the same tab. The commands are `useCommand(ports => ports.corrections.…)` in the
 * features; the service decides who may act and refuses a stale decision (`expectedRev`).
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { UpdateId, UpdateState } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

/** What a correction view is read from: updates, experiments, courses, scopes, submissions. */
const DEPS = ['UPD', 'EXP', 'CRS', 'ROLE', 'SUB'] as const;

export const myUpdates = defineQuery({
  family: 'UPD',
  view: 'cm-updates',
  deps: DEPS,
  read: (ports: ProductPorts, state: UpdateState | null) =>
    ports.corrections.listUpdates(state ? { state } : {}),
});

/** CM-08 (B6-09 f0): every correction she may see, newest change first, with who has it now. */
export function useMyUpdates(state: UpdateState | null = null, enabled = true) {
  return useXrQuery(myUpdates, state, { enabled, keepPrevious: true });
}

export const correctionUpdate = defineQuery({
  family: 'UPD',
  view: 'cm-update',
  deps: DEPS,
  read: (ports: ProductPorts, id: string) => ports.corrections.getUpdate(id as UpdateId),
});

/** CM-08 detail (B6-09 f1 … f8): the update and the changed fields beside the live ones. */
export function useCorrectionUpdate(id: string | null, enabled = true) {
  return useXrQuery(correctionUpdate, id ?? '', { enabled: enabled && id !== null });
}

export const updateForReview = defineQuery({
  family: 'UPD',
  view: 'rv-update',
  deps: DEPS,
  read: (ports: ProductPorts, id: string) => ports.corrections.getUpdateForReview(id as UpdateId),
});

/** RV-04 (B6-04 f0 … f4): the comparison, the live version and whether it is decided. */
export function useUpdateForReview(id: string | null, enabled = true) {
  return useXrQuery(updateForReview, id ?? '', { enabled: enabled && id !== null });
}

export type ReleaseTab = 'waiting-for-you' | 'on-hold' | 'released';

export const updatesForRelease = defineQuery({
  family: 'UPD',
  view: 'sa-updates',
  deps: DEPS,
  read: (ports: ProductPorts, tab: ReleaseTab) => ports.corrections.listUpdatesForRelease({ tab }),
});

/** SA-10 (B7-05 f0, f2, f3, f4): one tab's approved corrections (each tab read for its count). */
export function useUpdatesForRelease(tab: ReleaseTab, enabled = true) {
  return useXrQuery(updatesForRelease, tab, { enabled });
}

/** SA-11's read also names the institutions using the experiment (BC9: nothing changes for them). */
const DECISION_DEPS = ['UPD', 'EXP', 'CRS', 'ROLE', 'SUB', 'ACC', 'INST', 'SACC', 'PER'] as const;

export const updateDecision = defineQuery({
  family: 'UPD',
  view: 'sa-update-decision',
  deps: DECISION_DEPS,
  read: (ports: ProductPorts, id: string) => ports.corrections.getUpdateDecision(id as UpdateId),
});

/** SA-11 (B7-05 f1, f5 … f10): the comparison, the live line and the institutions using it. */
export function useUpdateDecision(id: string | null, enabled = true) {
  return useXrQuery(updateDecision, id ?? '', { enabled: enabled && id !== null });
}
