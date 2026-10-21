'use client';

import type { AccessPlanStatus, GrantDisplayStatus, InstitutionStatus } from '@xr/domain';
import { StatusPill } from '@xr/ui/v3';

import {
  grantStatusView,
  type IaStatusView,
  institutionStatusView,
  planStatusView,
} from '../shared/status-model';

/**
 * The plan screens' status pills in the V3 grammar (`span.xr-st`, the export's `instSt`, `planSt`
 * and `RST`): the tone and the role-relative words of the shared status model
 * (`shared/status-model.ts`).
 */
function Pill({ view }: { readonly view: IaStatusView }) {
  return <StatusPill tone={view.tone}>{view.words}</StatusPill>;
}

export function InstitutionPill({ status }: { readonly status: InstitutionStatus }) {
  return <Pill view={institutionStatusView(status)} />;
}

export function PlanPill({ status }: { readonly status: AccessPlanStatus }) {
  return <Pill view={planStatusView(status)} />;
}

export function GrantPill({ display }: { readonly display: GrantDisplayStatus }) {
  return <Pill view={grantStatusView(display)} />;
}
