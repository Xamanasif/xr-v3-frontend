/**
 * The device-transfer chain (flows.json Device 1–3; Appendix D §4.8; B3-07, B3-09, B3-11) and the
 * cross-cutting commands whose effects reach other roles (Appendix D §4.9): Pause / Restore,
 * deactivating a Student, and a support report resolved by the Super Admin (board 07, B7-09).
 */
import { changedKinds, check, deepEqual, errorOf, valueOf } from '../assert.js';
import { experimentNamed, institutionIdOf, keysOf, personIdOf } from '../helpers.js';
import type { ContractCase } from '../run.js';
import { DRAWN, SAMPLE } from '../sample.js';

const device: ContractCase = {
  id: 'flow:Device',
  title: 'Device chain — request, forward, approve (Device 1–3)',
  group: 'flow',
  evidence: 'flows.json Device 1–3; Appendix D §4.8; B3-07, B3-09, B3-11; T-32',
  requires: {
    fixture: { kind: 'after-flow', flow: 'B' },
    methods: [
      'OperationsService.getMyDevice',
      'OperationsService.requestDeviceTransfer',
      'OperationsService.listDeviceRequests',
      'OperationsService.forwardDeviceTransfer',
      'OperationsService.approveDeviceTransfer',
    ],
  },
  run: async (context) => {
    const student = context.as('Rahul Verma');
    const ia = context.as('Meera Iyer');
    const admin = context.as('Arjun Mehta');
    const mine = valueOf(await student.operations.getMyDevice(), 'ST-18');
    check(
      mine.devices.some((entry) => entry.format === 'vr'),
      'Rahul has an authorised VR device',
    );
    check(mine.canRequest && mine.openTransfer === null, 'Rahul can request a transfer');
    const blank = await student.operations.requestDeviceTransfer({ newDevice: ' ', note: null });
    deepEqual(
      keysOf(errorOf(blank, 'validation-failed', 'Dv1 without a device')),
      ['ST-18.newDevice.required'],
      'Dv1: "Describe the new device"',
    );
    const view = valueOf(
      await student.operations.requestDeviceTransfer({
        newDevice: SAMPLE.device.newDevice,
        note: SAMPLE.device.note,
      }),
      'Dv1 request',
    );
    check(DRAWN.deviceTransfer.test(view.transfer.id), 'Dv1: DTR-nnnn');
    check(
      view.transfer.state === 'with-institute-admin' && view.transfer.format === 'vr',
      'Dv1: with the Institute Admin, for VR',
    );
    check(view.forwardingBlocked === null, 'Dv1: the institution has an Institute Admin');
    const second = await student.operations.requestDeviceTransfer({
      newDevice: SAMPLE.device.newDevice,
      note: null,
    });
    check(
      errorOf(second, 'refused', 'Dv1 a second request').code === 'transfer-already-open',
      'Dv1: no second request while one is open (OD-B3-03 assumption)',
    );
    const early = await admin.operations.approveDeviceTransfer({
      id: view.transfer.id,
      expectedRev: view.transfer.rev,
    });
    check(
      errorOf(early, 'refused', 'approve before forwarding').code === 'not-yet-forwarded',
      '"Approve appears only once it is forwarded." (B7-10 f14)',
    );
    const requests = valueOf(await ia.operations.listDeviceRequests({}), 'Dv2 IA-18');
    check(
      requests.some((entry) => entry.id === view.transfer.id),
      'Dv2: waiting on the Institute Admin',
    );
    const forwarded = valueOf(
      await ia.operations.forwardDeviceTransfer({
        id: view.transfer.id,
        expectedRev: view.transfer.rev,
      }),
      'Dv2 forward',
    );
    check(forwarded.state === 'forwarded', 'Dv2: Forwarded to BITS');
    const approved = valueOf(
      await admin.operations.approveDeviceTransfer({
        id: forwarded.id,
        expectedRev: forwarded.rev,
      }),
      'Dv3 approve',
    );
    check(
      approved.transfer.state === 'approved',
      'Dv3: Approved — approve only, no decline (T-32)',
    );
    check(
      approved.device.description === SAMPLE.device.newDevice,
      'Dv3: the authorised device is the new one',
    );
    const now = valueOf(await student.operations.getMyDevice(), 'ST-18 after');
    check(
      now.devices.some(
        (entry) => entry.format === 'vr' && entry.description === SAMPLE.device.newDevice,
      ),
      'Dv3: Rahul sees the new authorised device',
    );
  },
};

const pause: ContractCase = {
  id: 'cross:pause-restore',
  title: 'Pause and Restore reach every institution role; work and grants are untouched',
  group: 'flow',
  evidence: 'Appendix D §4.9; B7-04 f0–f3; B1-11 f14; INST-11; XS-08',
  requires: {
    fixture: { kind: 'after-flow', flow: 'B' },
    methods: [
      'CatalogueService.searchCatalogue',
      'SessionService.getSession',
      'InstitutionService.getInstitution',
      'InstitutionService.pauseInstitution',
      'InstitutionService.restoreInstitution',
      'StudentAccessService.listGrants',
      'LearningService.launchWebFormat',
    ],
  },
  run: async (context) => {
    const admin = context.as('Arjun Mehta');
    const ia = context.as('Meera Iyer');
    const student = context.as('Rahul Verma');
    const faculty = context.as('Dr S. Ranganathan');
    const shell = await experimentNamed(context.publicPorts, SAMPLE.experiments.shellAndTube);
    const institutionId = await institutionIdOf(ia, 'Meera Iyer');
    const detail = valueOf(await admin.institutions.getInstitution(institutionId), 'SA-07');
    const grantsBefore = valueOf(
      await ia.studentAccess.listGrants({ showWithdrawn: true }),
      'IA-04 before',
    );
    const blank = await admin.institutions.pauseInstitution({
      institutionId,
      reason: '',
      expectedRev: detail.institution.rev,
    });
    deepEqual(
      keysOf(errorOf(blank, 'validation-failed', 'pause without a reason')),
      ['SA-07.reason.required'],
      '"Add a reason — it is kept in the history" (B7-03 f7)',
    );
    const paused = await admin.institutions.pauseInstitution({
      institutionId,
      reason: SAMPLE.pauseReason,
      expectedRev: detail.institution.rev,
    });
    const institution = valueOf(paused, 'pause');
    check(institution.pause !== null, 'The institution is paused');
    check(
      !changedKinds(paused).some((kind) =>
        ['SACC', 'RUN', 'COMP', 'FB', 'PER', 'ATT'].includes(kind),
      ),
      'Pause touches no grant, activity, completion, feedback, person or attempt (work is kept)',
    );
    for (const [who, ports] of [
      ['Meera Iyer', ia],
      ['Rahul Verma', student],
      ['Dr S. Ranganathan', faculty],
    ] as const) {
      const session = valueOf(await ports.session.getSession(), `${who}'s session`);
      check(
        session?.banners.includes('institution-paused'),
        `${who} sees the paused banner (XS-08)`,
      );
    }
    const launch = await student.learning.launchWebFormat({ experimentId: shell.experimentId });
    check(
      errorOf(launch, 'refused', 'launch while paused').code === 'institution-paused',
      'Students can’t open experiments while paused (B7-04)',
    );
    const grantsAfter = valueOf(
      await ia.studentAccess.listGrants({ showWithdrawn: true }),
      'IA-04 after',
    );
    deepEqual(
      grantsAfter.map((row) => [row.grant.id, row.grant.state, row.grant.rev]),
      grantsBefore.map((row) => [row.grant.id, row.grant.state, row.grant.rev]),
      'Grants are untouched by a pause',
    );
    valueOf(
      await admin.institutions.restoreInstitution({
        institutionId,
        reason: 'The student list is confirmed.',
        expectedRev: institution.rev,
      }),
      'restore',
    );
    const session = valueOf(await student.session.getSession(), 'Rahul after the restore');
    check(!session?.banners.includes('institution-paused'), 'Restore removes the banner');
    valueOf(
      await student.learning.launchWebFormat({ experimentId: shell.experimentId }),
      'launch after the restore',
    );
  },
};

const deactivate: ContractCase = {
  id: 'cross:deactivate-student',
  title: 'Deactivating a Student reaches their shell and their open gate',
  group: 'flow',
  evidence: 'Appendix D §4.9; B2-06; B1-09 f7; B2-10; PER-13',
  requires: {
    fixture: { kind: 'after-flow', flow: 'B' },
    methods: [
      'CatalogueService.searchCatalogue',
      'SessionService.getSession',
      'PeopleService.getStudent',
      'PeopleService.deactivateStudent',
      'PeopleService.reactivateStudent',
      'LearningService.launchWebFormat',
    ],
  },
  run: async (context) => {
    const ia = context.as('Meera Iyer');
    const student = context.as('Rahul Verma');
    const shell = await experimentNamed(context.publicPorts, SAMPLE.experiments.shellAndTube);
    const rahul = await personIdOf(student, 'Rahul Verma');
    const record = valueOf(await ia.people.getStudent(rahul), 'IA-07').student;
    const blank = await ia.people.deactivateStudent({
      id: rahul,
      reason: ' ',
      expectedRev: record.rev,
    });
    deepEqual(
      keysOf(errorOf(blank, 'validation-failed', 'deactivate without a reason')),
      ['IA-07.reason.required'],
      '"Enter the reason for deactivating this account" (B2-06)',
    );
    const inactive = valueOf(
      await ia.people.deactivateStudent({
        id: rahul,
        reason: 'Left the programme.',
        expectedRev: record.rev,
      }),
      'deactivate',
    );
    check(inactive.accountStatus === 'inactive', 'Rahul is inactive');
    const session = valueOf(await student.session.getSession(), 'Rahul signed in while inactive');
    check(session?.banners.includes('account-inactive'), 'The inactive banner shows (B1-09 f7)');
    const launch = await student.learning.launchWebFormat({ experimentId: shell.experimentId });
    check(
      errorOf(launch, 'refused', 'launch while inactive').code === 'student-inactive',
      '"You can’t open experiments until your institution reactivates your account."',
    );
    const active = valueOf(
      await ia.people.reactivateStudent({ id: rahul, expectedRev: inactive.rev }),
      'reactivate',
    );
    check(
      active.accountStatus === 'active',
      'Rahul is active again; the experiments he was given open again',
    );
  },
};

const support: ContractCase = {
  id: 'cross:support-report',
  title:
    'Help & support — a Student reports; the Super Admin resolves; the reporter reads the note',
  group: 'flow',
  evidence: 'Board 07 (XS-07); B7-09 (SA-21); Appendix D §4.9; P0-30; SUP-04',
  requires: {
    fixture: { kind: 'after-flow', flow: 'B' },
    methods: [
      'OperationsService.reportProblem',
      'OperationsService.listMyReports',
      'OperationsService.getMyReport',
      'OperationsService.resolveReport',
      'OperationsService.reopenReport',
    ],
  },
  run: async (context) => {
    const student = context.as('Rahul Verma');
    const admin = context.as('Arjun Mehta');
    const blank = await student.operations.reportProblem({
      whatHappened: '  ',
      where: null,
      screenshotFileName: null,
    });
    const reportError = errorOf(blank, 'validation-failed', 'report without saying what happened');
    deepEqual(
      keysOf(reportError),
      ['XS-07.whatHappened.required'],
      '"Say what happened, so it can be looked into"',
    );
    check(
      reportError.summaryTitle === 'One thing needs fixing',
      'The drawn summary title (board 07)',
    );
    const report = valueOf(
      await student.operations.reportProblem({
        whatHappened: SAMPLE.support.whatHappened,
        where: SAMPLE.support.where,
        screenshotFileName: null,
      }),
      'report a problem',
    );
    check(
      DRAWN.supportReport.test(report.id) && report.state === 'open',
      '"Your reference is SUP-nnnn"',
    );
    const mine = valueOf(await student.operations.listMyReports(), 'My reports');
    check(
      mine.some((entry) => entry.id === report.id),
      'The report is in My reports',
    );
    const noNote = await admin.operations.resolveReport({
      id: report.id,
      note: '',
      expectedRev: report.rev,
    });
    deepEqual(
      keysOf(errorOf(noNote, 'validation-failed', 'resolve without a note')),
      ['SA-21.note.required'],
      '"Add a note — the reporter sees it"',
    );
    const resolved = valueOf(
      await admin.operations.resolveReport({
        id: report.id,
        note: SAMPLE.support.note,
        expectedRev: report.rev,
      }),
      'resolve',
    );
    check(resolved.state === 'resolved', 'Resolved');
    const read = valueOf(await student.operations.getMyReport(report.id), 'the reporter reads it');
    check(
      read.state === 'resolved' && read.resolutions[0]?.note === SAMPLE.support.note,
      'The reporter sees the note',
    );
    const reopen = await student.operations.reopenReport({
      id: report.id,
      expectedRev: resolved.rev,
    });
    check(!reopen.ok, 'The reporter has no reopen control (SUP-04 open; P0-30)');
  },
};

export const CROSS_ROLE_CASES: readonly ContractCase[] = [device, pause, deactivate, support];
