/**
 * M23 Device transfer + authorised device, M24 Support report, M25 Platform role holder + scopes,
 * M26 Mock session, M27 read models (usage, access ending) — Appendix C §2. A device transfer is
 * an authorisation change only: nothing is shipped; approve only (T-32). Support reports carry no
 * saved title (P0-31). The session stores the person id; role and institution are re-resolved
 * from records on every call (M26).
 */
import {
  type AccessEndingRow,
  type AuthorisedDevice,
  DEVICE_TRANSFER_STATES,
  type DeviceTransfer,
  type MockSession,
  PLATFORM_HOLDER_ROLES,
  type PlatformRoleHolder,
  type RoleHolderEvent,
  type RoleScope,
  SCOPE_STATUSES,
  SHELL_BANNERS,
  SUPPORT_STATES,
  type ScopeTarget,
  type SupportReport,
  type UsageRow,
} from '@xr/domain';
import { z } from 'zod';

import {
  accessPlanId,
  actorRef,
  calendarDate,
  courseId,
  deviceTransferId,
  experimentId,
  historyOf,
  institutionId,
  isoInstant,
  packageFormat,
  personId,
  recordMeta,
  requestId,
  role,
  roleHolderId,
  scopeId,
  supportReportId,
  technology,
} from '../kernel/primitives.js';
import { typedAs, vocabulary } from '../kernel/typed.js';

export const ROLE_HOLDER_EVENTS = vocabulary<RoleHolderEvent>()([
  'registered',
  'scope-assigned',
  'scope-withdrawn',
  'scope-restored',
]);

export const deviceTransferState = z.enum(DEVICE_TRANSFER_STATES);
export const supportState = z.enum(SUPPORT_STATES);
export const scopeStatus = z.enum(SCOPE_STATUSES);
export const shellBanner = z.enum(SHELL_BANNERS);
export const platformRole = z.enum(PLATFORM_HOLDER_ROLES);

export const deviceTransfer = typedAs<DeviceTransfer>()(
  z.object({
    ...recordMeta,
    id: deviceTransferId,
    institutionId,
    studentId: personId,
    format: packageFormat,
    experimentId: experimentId.nullable(),
    fromDevice: z.string(),
    newDevice: z.string().min(1),
    note: z.string().nullable(),
    state: deviceTransferState,
    requestedAt: isoInstant,
    forwarded: z.object({ at: isoInstant, by: actorRef }).nullable(),
    approved: z.object({ at: isoInstant, by: actorRef }).nullable(),
    history: historyOf(['requested', 'forwarded', 'approved']),
  }),
);

export const authorisedDevice = typedAs<AuthorisedDevice>()(
  z.object({
    studentId: personId,
    format: packageFormat,
    description: z.string().min(1),
    usedFor: z.array(experimentId),
    since: isoInstant,
    viaTransferId: deviceTransferId.nullable(),
  }),
);

export const supportReport = typedAs<SupportReport>()(
  z.object({
    ...recordMeta,
    id: supportReportId,
    reporter: z.object({
      personId,
      role,
      displayName: z.string(),
      institutionId: institutionId.nullable(),
      organisation: z.string().nullable(),
    }),
    whatHappened: z.string().min(1),
    where: z.string().nullable(),
    screenshotFileName: z.string().nullable(),
    state: supportState,
    sentAt: isoInstant,
    resolutions: z.array(z.object({ at: isoInstant, by: actorRef, note: z.string().min(1) })),
    reopenings: z.array(z.object({ at: isoInstant, by: actorRef })),
    history: historyOf(['sent', 'resolved', 'reopened']),
  }),
);

export const scopeTarget = typedAs<ScopeTarget>()(
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('all') }),
    z.object({ kind: z.literal('course'), courseId }),
    z.object({ kind: z.literal('experiment'), experimentId }),
  ]),
);

export const roleScope = typedAs<RoleScope>()(
  z.object({
    id: scopeId,
    target: scopeTarget,
    assignedAt: isoInstant,
    assignedBy: actorRef,
    withdrawal: z.object({ at: isoInstant, by: actorRef, reason: z.string().min(1) }).nullable(),
    supersededAt: isoInstant.nullable(),
  }),
);

export const platformRoleHolder = typedAs<PlatformRoleHolder>()(
  z.object({
    ...recordMeta,
    id: roleHolderId,
    role: platformRole,
    name: z.string().min(1),
    workEmail: z.string().min(1),
    organisation: z.string().min(1),
    registeredAt: isoInstant,
    registeredBy: actorRef,
    scopes: z.array(roleScope),
    personId,
    history: historyOf(ROLE_HOLDER_EVENTS),
  }),
);

export const mockSession = typedAs<MockSession>()(
  z.object({
    sessionKey: z.string().min(1),
    personId,
    role,
    displayName: z.string().min(1),
    institutionId: institutionId.nullable(),
    institutionName: z.string().min(1).nullable(),
    organisation: z.string().nullable(),
    signedInAt: isoInstant,
    returnTo: z.string().nullable(),
  }),
);

/** IA-20 Usage: per experiment × format, never added up; no licence usage (B3-10). */
export const usageRow = typedAs<UsageRow>()(
  z.object({
    experimentId,
    studentsWithAccess: z.number().int().min(0),
    perFormat: z.array(
      z.object({
        format: technology,
        started: z.number().int().min(0),
        completed: z.number().int().min(0),
        sessions: z.number().int().min(0),
      }),
    ),
  }),
);

/** SA-22 Access ending: "Reminder due" is a status only — nothing is sent (T-31). */
export const accessEndingRow = typedAs<AccessEndingRow>()(
  z.object({
    institutionId,
    planId: accessPlanId,
    endsOn: calendarDate,
    daysLeft: z.number().int().min(0).nullable(),
    endedDaysAgo: z.number().int().min(1).nullable(),
    standing: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('renewal-in-progress'), requestId }),
      z.object({ kind: z.literal('reminder-due') }),
      z.object({ kind: z.literal('ended-no-renewal') }),
    ]),
  }),
);
