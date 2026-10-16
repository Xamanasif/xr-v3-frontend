/**
 * §3.16 OperationsService — device transfers, support, access ending, usage, SA overview — ST-18,
 * IA-18…IA-20, SA-01, SA-18…SA-22, XS-07.
 *
 * A device transfer is an authorisation change only: nothing is shipped; approve only — no decline
 * (T-32). The form has two fields; the format and experiment come from the Student's authorised
 * device. "No Institute Admin" is not a refusal: the request is created and waits (B3-07 `dn`).
 * Help & support: any signed-in person reports a problem; there is no category field (P0-34) and
 * no saved title (P0-31). Nothing is sent from the product (T-34): "Reminder due" is a status only.
 */
import type { AuthorisedDevice, DeviceTransfer, SupportReport } from '@xr/domain';
import { optionalTrimmed, requiredTrimmed } from '@xr/validation';
import { z } from 'zod';

import {
  calendarDate,
  expectedRev,
  ids,
  institutionId,
  isoInstant,
  submissionId,
} from '../kernel/primitives.js';
import { institutionKind, institutionStatus } from '../records/institution.js';
import {
  accessEndingRow,
  authorisedDevice,
  deviceTransfer,
  deviceTransferState,
  platformRoleHolder,
  supportReport,
  supportState,
  usageRow,
} from '../records/operations.js';
import { correctionUpdate } from '../records/submission.js';
import { requestRow } from './access-request.js';
import type {
  InvalidState,
  NotFound,
  NotPermitted,
  NotSignedIn,
  PolicyOpen,
  Refused,
  StaleVersion,
  Unavailable,
  ValidationFailed,
} from '../errors/service-error.js';
import type { Answer, In, Out } from './common.js';
import { key } from './fields.js';

/** ST-18 (B3-07): "New device" and an optional note — nothing else. */
export const requestDeviceTransferInput = z.object({
  newDevice: requiredTrimmed(key('ST-18.newDevice.required')),
  note: optionalTrimmed(),
});

export const deviceTransferListInput = z.object({ state: deviceTransferState.optional() });
export const deviceTransferCommandInput = z.object({ id: ids.in.deviceTransfer, expectedRev });

/** XS-07 (board 07): "Where" is pre-filled from the page; the screenshot is a file name only — nothing is uploaded. */
export const reportProblemInput = z.object({
  whatHappened: requiredTrimmed(key('XS-07.whatHappened.required')),
  where: optionalTrimmed(),
  screenshotFileName: optionalTrimmed(),
});

export const supportListInput = z.object({ state: supportState.optional() });
export const resolveReportInput = z.object({
  id: ids.in.supportReport,
  note: requiredTrimmed(key('SA-21.note.required')),
  expectedRev,
});
export const reopenReportInput = z.object({ id: ids.in.supportReport, expectedRev });
export const usageInput = z.object({ courseId: ids.in.course.optional() });

/** A request that exists but cannot move yet — a read fact, never a refusal of the request. */
export const deviceTransferView = z.object({
  transfer: deviceTransfer,
  forwardingBlocked: z.enum(['no-institute-admin', 'institution-paused']).nullable(),
});

export const myDeviceOutput = z.object({
  devices: z.array(authorisedDevice),
  openTransfer: deviceTransferView.nullable(),
  lastTransfer: deviceTransfer.nullable(),
  /**
   * Whether "Request a transfer" is offered. A Student holding more than one authorised device
   * reaches the open decision OD-B3-01 (which device moves is not drawn): the value carries it,
   * never a default (provisional register PC-28).
   */
  canRequest: z.union([z.boolean(), z.object({ policyOpen: z.literal('OD-B3-01') })]),
  blockedBy: z.literal('institution-paused').nullable(),
});
export const deviceTransfersOutput = z.array(deviceTransfer);
export const approveDeviceTransferOutput = z.object({
  transfer: deviceTransfer,
  device: authorisedDevice,
});
export const supportReportsOutput = z.array(supportReport);
/**
 * SA-22 (B7-09 f4): each plan ending within 15 days or ended, with its institution's name and kind
 * ("ACC-0098 · Internal") — facts the row draws beside the domain's `AccessEndingRow` (Phase 6;
 * provisional register PC-68). Soonest first; ended plans after, the most recently ended first.
 */
export const accessEndingView = z.object({
  row: accessEndingRow,
  institutionName: z.string().min(1),
  institutionKind,
});
export const accessEndingOutput = z.array(accessEndingView);
/** IA-20: per experiment × format, never summed; no feedback column (B3-10). */
export const usageOutput = z.object({ figuresUpTo: isoInstant, rows: z.array(usageRow) });

/** One SA-01 group: how many items it holds and its first four (BR-138; B7-01 "at most four rows"). */
function overviewGroup<T extends z.ZodType>(row: T) {
  return z.object({ count: z.number().int().min(0), rows: z.array(row).max(4) });
}

/**
 * SA-01 (B7-01) as facts, not words (Phase 6; provisional register PC-67): the two figures and the
 * eight groups the board draws, each read from the same records and rules as the list it opens —
 * Requests (under review, newest first; a renewal names the end of the access it renews), corrections
 * waiting for the release decision (oldest approval first), device transfers forwarded to BITS
 * (oldest first), open and reopened support reports (oldest first), access ending within 15 days
 * (soonest first; ended access is not "waiting"), institutions without an Institute Admin
 * (SA-06's `needsInstituteAdmin`), stuck content (`isStuck`) and role holders with no active
 * scope. Appendix C gave each group pre-rendered `attentionRow` rows (PC-13).
 */
export const superAdminOverviewOutput = z.object({
  figures: z.object({
    /** "Access active or ending soon". */
    activeInstitutions: z.number().int().min(0),
    paused: z.number().int().min(0),
    awaitingPayment: z.number().int().min(0),
    /** "Live in the catalogue today". */
    publishedExperiments: z.number().int().min(0),
  }),
  requests: overviewGroup(z.object({ request: requestRow, accessEndsOn: calendarDate.nullable() })),
  updates: overviewGroup(
    z.object({
      update: correctionUpdate,
      experimentName: z.string().min(1),
      liveLabel: z.string().min(1),
      approvedAt: isoInstant.nullable(),
    }),
  ),
  deviceTransfers: overviewGroup(
    z.object({
      transfer: deviceTransfer,
      studentName: z.string().min(1),
      institutionName: z.string().min(1),
    }),
  ),
  support: overviewGroup(supportReport),
  accessEnding: overviewGroup(accessEndingView),
  institutionsWithoutAdmin: overviewGroup(
    z.object({
      institutionId,
      name: z.string().min(1),
      status: institutionStatus,
      /** When its access first became active (its first plan's activation); null before one. */
      accessSince: isoInstant.nullable(),
    }),
  ),
  stuckContent: overviewGroup(
    z.object({
      submissionId,
      name: z.string().min(1),
      courseCode: z.string().nullable(),
      since: isoInstant,
    }),
  ),
  holdersWithoutScope: overviewGroup(z.object({ holder: platformRoleHolder })),
});

export type DeviceTransferView = Out<typeof deviceTransferView>;

export interface OperationsService {
  // Device transfers
  getMyDevice(): Answer<Out<typeof myDeviceOutput>, NotSignedIn | NotPermitted | Unavailable>;
  /**
   * The format and experiment come from the authorised device. Policy-open: OD-B3-01 (more than
   * one authorised device). An Institute Admin is NOT required.
   */
  requestDeviceTransfer(
    input: In<typeof requestDeviceTransferInput>,
  ): Answer<
    DeviceTransferView,
    | ValidationFailed
    | NotSignedIn
    | NotPermitted
    | InvalidState
    | Refused<'institution-paused' | 'transfer-already-open' | 'no-authorised-device'>
    | PolicyOpen
    | Unavailable
  >;
  /** Institute Admin, own institution. */
  listDeviceRequests(
    filter: In<typeof deviceTransferListInput>,
  ): Answer<readonly DeviceTransfer[], NotSignedIn | NotPermitted | Unavailable>;
  getDeviceRequest(
    id: In<typeof ids.in.deviceTransfer>,
  ): Answer<DeviceTransfer, NotSignedIn | NotPermitted | NotFound | Unavailable>;
  /** Irreversible: "You can’t take it back once it’s forwarded." */
  forwardDeviceTransfer(
    input: In<typeof deviceTransferCommandInput>,
  ): Answer<
    DeviceTransfer,
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | Refused<'institution-paused'>
    | StaleVersion
    | Unavailable
  >;
  /** Super Admin. */
  listDeviceTransfers(
    filter: In<typeof deviceTransferListInput>,
  ): Answer<readonly DeviceTransfer[], NotSignedIn | NotPermitted | Unavailable>;
  /** Approve only. The Student's authorised device for that format becomes the new device. */
  approveDeviceTransfer(
    input: In<typeof deviceTransferCommandInput>,
  ): Answer<
    { readonly transfer: DeviceTransfer; readonly device: AuthorisedDevice },
    | NotSignedIn
    | NotPermitted
    | NotFound
    | Refused<'not-yet-forwarded'>
    | InvalidState
    | StaleVersion
    | Unavailable
  >;
  // Support (every workspace)
  reportProblem(
    input: In<typeof reportProblemInput>,
  ): Answer<SupportReport, ValidationFailed | NotSignedIn | Unavailable>;
  listMyReports(): Answer<readonly SupportReport[], NotSignedIn | Unavailable>;
  /** Policy-open: SUP-07 (an Institute Admin reading a report from their institution). */
  getMyReport(
    id: In<typeof ids.in.supportReport>,
  ): Answer<SupportReport, NotSignedIn | NotPermitted | NotFound | PolicyOpen | Unavailable>;
  listSupportReports(
    filter: In<typeof supportListInput>,
  ): Answer<readonly SupportReport[], NotSignedIn | NotPermitted | Unavailable>;
  /** Nobody resolves their own report (SUP-03 [P]). */
  resolveReport(
    input: In<typeof resolveReportInput>,
  ): Answer<
    SupportReport,
    | ValidationFailed
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | StaleVersion
    | Unavailable
  >;
  /** Policy-open: SUP-04 (who may reopen; a Super Admin reopening their own report). */
  reopenReport(
    input: In<typeof reopenReportInput>,
  ): Answer<
    SupportReport,
    NotSignedIn | NotPermitted | NotFound | InvalidState | StaleVersion | PolicyOpen | Unavailable
  >;
  // Access ending, usage, overview
  /** "Reminder due · Nothing is sent from here" (T-31). */
  listAccessEnding(): Answer<
    Out<typeof accessEndingOutput>,
    NotSignedIn | NotPermitted | Unavailable
  >;
  /** Institute Admin only (OD-B3-08). */
  getUsage(
    input: In<typeof usageInput>,
  ): Answer<Out<typeof usageOutput>, NotSignedIn | NotPermitted | Unavailable>;
  getSuperAdminOverview(): Answer<
    Out<typeof superAdminOverviewOutput>,
    NotSignedIn | NotPermitted | Unavailable
  >;
}
