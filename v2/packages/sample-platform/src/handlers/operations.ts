/**
 * §3.16 OperationsService — the device chain (ST-18, IA-18, IA-19, SA-18, SA-19; Device 1–3),
 * Help & support (XS-07, SA-21) and IA-20 usage.
 *
 * A device transfer is an authorisation change only: nothing is shipped; approve only — no
 * decline (T-32). "No Institute Admin" is not a refusal: the request is created and waits (B3-07
 * `dn`). Any signed-in person reports a problem; nobody resolves their own report (SUP-03), and
 * the reporter has no reopen control (SUP-04 open). Nothing is sent from the product (T-34).
 */
import {
  deviceTransferCommandInput,
  deviceTransferListInput,
  type OperationsService,
  reopenReportInput,
  reportProblemInput,
  requestDeviceTransferInput,
  resolveReportInput,
  usageInput,
} from '@xr/contracts/draft';
import {
  approveDeviceTransfer,
  type DeviceTransfer,
  forwardDeviceTransfer,
  forwardingBlocked,
  type Institution,
  reopenReport,
  reportProblem,
  requestDeviceTransfer,
  resolveReport,
  type SubjectOf,
} from '@xr/domain';

import type { Call } from '../platform/core.js';
import type { ResolvedPerson } from '../pipeline/actor.js';
import { command, type Op, read, refuse } from '../pipeline/runner.js';
import { deviceKey, values } from '../world/records.js';
import { deferred } from './deferred.js';
import { usageOf } from './institution.js';

function field(input: unknown, name: string): unknown {
  return typeof input === 'object' && input !== null
    ? (input as Record<string, unknown>)[name]
    : undefined;
}

function institutionOf(op: Op, person: ResolvedPerson): Institution {
  const institution = person.institutionId ? op.records.institutions[person.institutionId] : null;
  if (!institution) refuse({ kind: 'not-permitted', why: 'wrong-workspace' });
  return institution;
}

function deviceSubject(
  op: Op,
  institution: Institution,
  transfer: DeviceTransfer | null,
  studentId: string | null,
): SubjectOf<'device-transfer'> {
  return {
    kind: 'device-transfer',
    institution,
    transfer,
    devices: values(op.records.devices).filter(
      (device) => studentId === null || device.studentId === studentId,
    ),
    openTransfers: values(op.records.transfers).filter(
      (candidate) => candidate.institutionId === institution.id && candidate.state !== 'approved',
    ),
  };
}

function viewOf(op: Op, transfer: DeviceTransfer) {
  const institution = op.records.institutions[transfer.institutionId];
  return {
    transfer,
    forwardingBlocked: institution ? forwardingBlocked(transfer, institution) : null,
  };
}

/** The transfer a call names, and the reader's scope over it (`canRead`). */
function transferOf(op: Op, person: ResolvedPerson, rawId: unknown): DeviceTransfer {
  const transfer = op.found(op.records.transfers[op.idText(rawId)]);
  op.see(person, { kind: 'device-transfer', transfer });
  return transfer;
}

export function operationsPort(call: Call): OperationsService {
  return {
    listSupportReports: deferred('OperationsService.listSupportReports'),
    listAccessEnding: deferred('OperationsService.listAccessEnding'),
    getSuperAdminOverview: deferred('OperationsService.getSuperAdminOverview'),

    getMyDevice: () =>
      read(call, 'OperationsService.getMyDevice', (op) => {
        const person = op.person();
        const institution = institutionOf(op, person);
        const devices = values(op.records.devices).filter(
          (device) => device.studentId === person.personId,
        );
        const mine = values(op.records.transfers).filter(
          (transfer) => transfer.studentId === person.personId,
        );
        const open = mine.find((transfer) => transfer.state !== 'approved') ?? null;
        const lastApproved = mine
          .filter((transfer) => transfer.approved !== null)
          .sort((a, b) =>
            a.approved!.at === b.approved!.at ? 0 : a.approved!.at < b.approved!.at ? 1 : -1,
          )[0];
        const verdict = op.verdict(
          person,
          'device-transfer.request',
          deviceSubject(op, institution, null, person.personId),
        );
        return {
          devices,
          openTransfer: open ? viewOf(op, open) : null,
          lastTransfer: lastApproved ?? null,
          // More than one authorised device reaches OD-B3-01: the value carries it (PC-28).
          canRequest:
            !verdict.allowed &&
            verdict.refusal.kind === 'policy-open' &&
            verdict.refusal.decision === 'OD-B3-01'
              ? { policyOpen: 'OD-B3-01' as const }
              : verdict.allowed,
          blockedBy: institution.pause ? ('institution-paused' as const) : null,
        };
      }),

    requestDeviceTransfer: (input) =>
      command(call, 'OperationsService.requestDeviceTransfer', (op) => {
        const person = op.person();
        const institution = institutionOf(op, person);
        const subject = deviceSubject(op, institution, null, person.personId);
        op.allow(person, 'device-transfer.request', subject);
        const accepted = op.parse(requestDeviceTransferInput, input);
        const transfer = op.decide(
          requestDeviceTransfer({
            institution,
            devices: subject.devices,
            openTransfers: subject.openTransfers,
            newDevice: accepted.newDevice,
            note: accepted.note,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('transfers', transfer.id, transfer);
        return {
          value: viewOf(op, transfer),
          decision: 'requestDeviceTransfer',
          actor: person.ref,
        };
      }),

    listDeviceRequests: (filter) =>
      read(call, 'OperationsService.listDeviceRequests', (op) => {
        const person = op.person();
        const institution = institutionOf(op, person);
        const accepted = op.parse(deviceTransferListInput, filter);
        return values(op.records.transfers)
          .filter((transfer) => transfer.institutionId === institution.id)
          .filter((transfer) => op.canSee(person, { kind: 'device-transfer', transfer }))
          .filter((transfer) => !accepted.state || transfer.state === accepted.state);
      }),

    getDeviceRequest: (id) =>
      read(call, 'OperationsService.getDeviceRequest', (op) => {
        const person = op.person();
        return transferOf(op, person, id);
      }),

    forwardDeviceTransfer: (input) =>
      command(call, 'OperationsService.forwardDeviceTransfer', (op) => {
        const person = op.person();
        const transfer = transferOf(op, person, field(input, 'id'));
        const institution = op.found(op.records.institutions[transfer.institutionId]);
        op.allow(
          person,
          'device-transfer.forward',
          deviceSubject(op, institution, transfer, transfer.studentId),
        );
        const accepted = op.parse(deviceTransferCommandInput, input);
        op.rev(transfer, accepted.expectedRev);
        const next = op.decide(
          forwardDeviceTransfer({
            transfer,
            institution,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        // Irreversible: "You can’t take it back once it’s forwarded."
        op.tx.put('transfers', next.id, next);
        return { value: next, decision: 'forwardDeviceTransfer', actor: person.ref };
      }),

    listDeviceTransfers: (filter) =>
      read(call, 'OperationsService.listDeviceTransfers', (op) => {
        const person = op.person();
        const accepted = op.parse(deviceTransferListInput, filter);
        return values(op.records.transfers)
          .filter((transfer) => op.canSee(person, { kind: 'device-transfer', transfer }))
          .filter((transfer) => !accepted.state || transfer.state === accepted.state);
      }),

    approveDeviceTransfer: (input) =>
      command(call, 'OperationsService.approveDeviceTransfer', (op) => {
        const person = op.person();
        const transfer = transferOf(op, person, field(input, 'id'));
        const institution = op.found(op.records.institutions[transfer.institutionId]);
        op.allow(
          person,
          'device-transfer.approve',
          deviceSubject(op, institution, transfer, transfer.studentId),
        );
        const accepted = op.parse(deviceTransferCommandInput, input);
        op.rev(transfer, accepted.expectedRev);
        const key = deviceKey(transfer.studentId, transfer.format);
        const device = op.found(op.records.devices[key]);
        const outcome = op.decide(
          approveDeviceTransfer({ transfer, device, actor: person.ref, now: op.now, ids: op.ids }),
          input,
        );
        // Approve only — the Student's authorised device for the format becomes the new one.
        op.tx.put('transfers', outcome.transfer.id, outcome.transfer);
        op.tx.put('devices', key, outcome.device);
        return { value: outcome, decision: 'approveDeviceTransfer', actor: person.ref };
      }),

    reportProblem: (input) =>
      command(call, 'OperationsService.reportProblem', (op) => {
        const person = op.person();
        op.allow(person, 'support.report', { kind: 'support-report', report: null });
        const accepted = op.parse(reportProblemInput, input);
        const report = op.decide(
          reportProblem({
            whatHappened: accepted.whatHappened,
            where: accepted.where,
            screenshotFileName: accepted.screenshotFileName,
            institutionId: person.institutionId,
            organisation: person.organisation,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        // Nothing is sent from the product (T-34): "Your reference is SUP-nnnn".
        op.tx.put('reports', report.id, report);
        return { value: report, decision: 'reportProblem', actor: person.ref };
      }),

    listMyReports: () =>
      read(call, 'OperationsService.listMyReports', (op) => {
        const person = op.person();
        return values(op.records.reports).filter(
          (report) => report.reporter.personId === person.personId,
        );
      }),

    getMyReport: (id) =>
      read(call, 'OperationsService.getMyReport', (op) => {
        const person = op.person();
        const report = op.found(op.records.reports[op.idText(id)]);
        op.see(person, { kind: 'support-report', report });
        return report;
      }),

    resolveReport: (input) =>
      command(call, 'OperationsService.resolveReport', (op) => {
        const person = op.person();
        const report = op.found(op.records.reports[op.idText(field(input, 'id'))]);
        op.see(person, { kind: 'support-report', report });
        op.allow(person, 'support.resolve', { kind: 'support-report', report });
        const accepted = op.parse(resolveReportInput, input);
        op.rev(report, accepted.expectedRev);
        const next = op.decide(
          resolveReport({
            report,
            note: accepted.note,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('reports', next.id, next);
        return { value: next, decision: 'resolveReport', actor: person.ref };
      }),

    reopenReport: (input) =>
      command(call, 'OperationsService.reopenReport', (op) => {
        const person = op.person();
        const report = op.found(op.records.reports[op.idText(field(input, 'id'))]);
        op.see(person, { kind: 'support-report', report });
        op.allow(person, 'support.reopen', { kind: 'support-report', report });
        const accepted = op.parse(reopenReportInput, input);
        op.rev(report, accepted.expectedRev);
        const next = op.decide(
          reopenReport({ report, actor: person.ref, now: op.now, ids: op.ids }),
          input,
        );
        op.tx.put('reports', next.id, next);
        return { value: next, decision: 'reopenReport', actor: person.ref };
      }),

    getUsage: (input) =>
      read(call, 'OperationsService.getUsage', (op) => {
        const person = op.person();
        const institution = institutionOf(op, person);
        op.see(person, { kind: 'usage', institutionId: institution.id });
        const accepted = op.parse(usageInput, input);
        const rows = usageOf(op, institution).filter(
          (row) =>
            accepted.courseId === undefined ||
            op.records.experiments[row.experimentId]?.courseId === accepted.courseId,
        );
        // Per experiment × format, never summed; no feedback column (B3-10).
        return { figuresUpTo: op.now, rows: [...rows] };
      }),
  };
}
