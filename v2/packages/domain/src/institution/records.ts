/**
 * The institution and access-plan record constructors (Appendix C M01, M05). Internal to
 * `@xr/domain` — deliberately not exported from the package root: an institution is created only
 * by approving the first request of a new institution, and a plan only by activation (internal
 * approval or a confirmed payment). Nothing creates either directly (INST-02, T-09).
 */
import type { ActorRef } from '../roles.js';
import { historyEntry } from '../kernel/history.js';
import type { IdSource } from '../kernel/id-source.js';
import type { AccessPlanId, InstitutionId, RequestId } from '../kernel/ids.js';
import type { Provided } from '../kernel/provided.js';
import { newMeta, ref } from '../kernel/record.js';
import type { CalendarDate, IsoInstant } from '../kernel/time.js';
import type {
  AccessPlan,
  AccessPlanItem,
  AccessPlanTerm,
  Institution,
  InstitutionKind,
} from './model.js';

export interface NewInstitutionInput {
  readonly id: InstitutionId;
  readonly name: string;
  readonly kind: InstitutionKind;
  readonly fromRequest: RequestId;
  readonly actor: ActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

/** "1 Institution record — Created when you approve the first request from a new institution. A
 *  record is not access." (B1-11; matrix INST-01). Never created directly (INST-02, T-09). */
export function newInstitution(input: NewInstitutionInput): Institution {
  return {
    ...newMeta(input.now),
    id: input.id,
    name: input.name,
    kind: input.kind,
    createdFromRequestId: input.fromRequest,
    pause: null,
    instituteAdmin: null,
    history: [
      historyEntry({
        id: input.ids.next('history'),
        event: 'record-created',
        at: input.now,
        actor: input.actor,
        note: input.kind,
        visibleTo: ['super_admin'],
        refs: [ref('REQ', input.fromRequest)],
      }),
    ],
  };
}

export interface NewPlanInput {
  readonly id: AccessPlanId;
  readonly institutionId: InstitutionId;
  readonly fromRequest: RequestId;
  readonly items: readonly AccessPlanItem[];
  readonly licences: Provided<number>;
  readonly term: AccessPlanTerm;
  readonly startsOn: CalendarDate;
  readonly endsOn: CalendarDate;
  readonly actor: ActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

/** "Activation creates the access plan." (B1-11; ACC-01 internal, ACC-02 external by payment). */
export function newAccessPlan(input: NewPlanInput): AccessPlan {
  return {
    ...newMeta(input.now),
    id: input.id,
    institutionId: input.institutionId,
    sourceRequestId: input.fromRequest,
    items: input.items,
    licences: input.licences,
    term: input.term,
    startsOn: input.startsOn,
    endsOn: input.endsOn,
    activatedAt: input.now,
    history: [
      historyEntry({
        id: input.ids.next('history'),
        event: 'activated',
        at: input.now,
        actor: input.actor,
        visibleTo: ['tenant_admin', 'super_admin'],
        refs: [ref('REQ', input.fromRequest), ref('ACC', input.id)],
      }),
    ],
  };
}
