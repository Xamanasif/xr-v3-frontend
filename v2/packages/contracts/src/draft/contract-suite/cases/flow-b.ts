/**
 * Flow B — campus distribution (flows.json B1–B4 and the B5 withdraw alternate; Appendix D §4.3;
 * B2-01 … B2-13; B7-03). Content access is not Student access (BR-026); formats are inherited from
 * the plan (LD-1); nothing is counted (T-06); a grant creates no runtime activity (invariant 8).
 */
import { changedKinds, check, deepEqual, errorOf, valueOf } from '../assert.js';
import { experimentNamed, keysOf, personIdOf } from '../helpers.js';
import type { ContractCase } from '../run.js';
import { DRAWN, SAMPLE, WALK } from '../sample.js';

const flowBInstitution: ContractCase = {
  id: 'flow:B1-B2',
  title: 'Flow B — assign the Institute Admin; content access is read-only (B1–B2)',
  group: 'flow',
  evidence: 'flows.json B1–B2; B7-03; B2-01 … B2-03; T-11; T-08',
  requires: {
    fixture: { kind: 'after-flow', flow: 'A' },
    methods: [
      'AccessRequestService.getRequestForDecision',
      'InstitutionService.getInstitution',
      'InstitutionService.assignInstituteAdmin',
      'InstitutionService.listContentAccess',
      'InstitutionService.getAccessPlan',
      'CatalogueService.searchCatalogue',
    ],
  },
  run: async (context) => {
    const admin = context.as('Arjun Mehta');
    const page = valueOf(
      await admin.accessRequests.getRequestForDecision(WALK.request),
      'REQ-0042 on SA-03',
    );
    check(page.request.activatedPlanId === WALK.plan, 'After Flow A, REQ-0042 activated ACC-0107');
    const institutionId = page.request.institutionId;
    check(institutionId, 'REQ-0042 names its institution');
    const detail = valueOf(await admin.institutions.getInstitution(institutionId), 'SA-07');
    check(detail.institution.instituteAdmin === null, 'B1: no Institute Admin yet');

    const badEmail = await admin.institutions.assignInstituteAdmin({
      institutionId,
      name: SAMPLE.request.contactPerson,
      workEmail: 'meera.iyer@godavari',
      expectedRev: detail.institution.rev,
    });
    deepEqual(
      keysOf(errorOf(badEmail, 'validation-failed', 'B1 with a partial e-mail')),
      ['SA-07.workEmail.format'],
      'B1: "Enter an e-mail address like name@institution.edu.in" (B7-03)',
    );
    const assigned = await admin.institutions.assignInstituteAdmin({
      institutionId,
      name: SAMPLE.request.contactPerson,
      workEmail: SAMPLE.request.email,
      expectedRev: detail.institution.rev,
    });
    const institution = valueOf(assigned, 'B1 assign the Institute Admin');
    check(
      institution.instituteAdmin?.name === 'Meera Iyer',
      'B1: Meera Iyer is the Institute Admin',
    );
    check(
      !changedKinds(assigned).includes('SACC'),
      'B1: assigning an Institute Admin gives no Student access',
    );
    const second = await admin.institutions.assignInstituteAdmin({
      institutionId,
      name: 'Someone Else',
      workEmail: 'someone.else@godavari.edu.in',
      expectedRev: institution.rev,
    });
    check(
      errorOf(second, 'policy-open', 'B1 replace the Institute Admin').decision === 'INST-06',
      'B1: replacing an Institute Admin is not designed (INST-06)',
    );

    const ia = context.as('Meera Iyer');
    const shell = await experimentNamed(context.publicPorts, SAMPLE.experiments.shellAndTube);
    const content = valueOf(await ia.institutions.listContentAccess(), 'B2 IA-02');
    const item = content
      .flatMap((row) => row.items)
      .find((entry) => entry.experimentId === shell.experimentId);
    check(
      item !== undefined && [...item.formats].sort().join() === 'vr,web',
      'B2: the plan holds Shell-and-Tube Heat Exchanger with WEB and VR',
    );
    const plan = valueOf(await ia.institutions.getAccessPlan(WALK.plan), 'B2 IA-03');
    check(
      plan.plan.licences === 120,
      'B2: "Licences 120 — as approved by BITS" (provided, never derived)',
    );
    check(
      plan.status === 'access-active' && plan.studentsGiven === 0,
      'B2: access active; no student given access yet',
    );
  },
};

const flowBStudents: ContractCase = {
  id: 'flow:B3-B4',
  title: 'Flow B — give a Student access; the Student sees it (B3–B4)',
  group: 'flow',
  evidence: 'flows.json B3–B4; B2-05; B2-10 … B2-13; LD-1; invariant 8',
  requires: {
    fixture: { kind: 'after-setup' },
    methods: [
      'CatalogueService.searchCatalogue',
      'SessionService.getSession',
      'StudentAccessService.getMyHome',
      'InstitutionService.getAccessPlan',
      'StudentAccessService.giveAccess',
      'StudentAccessService.listMyCourses',
      'StudentAccessService.getExperimentHub',
    ],
  },
  run: async (context) => {
    const ia = context.as('Meera Iyer');
    const student = context.as('Rahul Verma');
    const rahul = await personIdOf(student, 'Rahul Verma');
    const shell = await experimentNamed(context.publicPorts, SAMPLE.experiments.shellAndTube);
    const home = valueOf(await student.studentAccess.getMyHome(), 'ST-01 before');
    check(home.noAccessYet, 'B3: content access is not Student access (BR-026)');
    const plan = valueOf(await ia.institutions.getAccessPlan(WALK.plan), 'IA-03');

    const nothing = await ia.studentAccess.giveAccess({
      experimentIds: [],
      target: { kind: 'student', studentId: rahul },
      expectedPlanRev: plan.plan.rev,
    });
    const stepError = errorOf(nothing, 'validation-failed', 'B3 step 1 with nothing ticked');
    deepEqual(
      keysOf(stepError),
      ['IA-05.experimentIds.required'],
      'B3: "Choose at least one experiment"',
    );
    check(stepError.summaryTitle === 'Check this step', 'B3: the drawn summary title');

    const given = await ia.studentAccess.giveAccess({
      experimentIds: [shell.experimentId],
      target: { kind: 'student', studentId: rahul },
      expectedPlanRev: plan.plan.rev,
    });
    const results = valueOf(given, 'B3 give access');
    check(
      results.length === 1 && DRAWN.grant.test(results[0]!.grantId),
      'B3: one grant, SACC-nnnn',
    );
    check(results[0]!.display === 'active', 'B3: Active (no wait is supplied for Rahul)');
    check(
      !changedKinds(given).some((kind) => kind === 'RUN' || kind === 'COMP' || kind === 'FB'),
      'B3: a grant creates no runtime activity, completion or feedback (invariant 8)',
    );
    const after = valueOf(await ia.institutions.getAccessPlan(WALK.plan), 'IA-03 after');
    const again = await ia.studentAccess.giveAccess({
      experimentIds: [shell.experimentId],
      target: { kind: 'student', studentId: rahul },
      expectedPlanRev: after.plan.rev,
    });
    check(
      errorOf(again, 'refused', 'B3 give it twice').code === 'already-given',
      'B3: "Rahul can’t be ticked again" (B2-05)',
    );

    const now = valueOf(await student.studentAccess.getMyHome(), 'B4 ST-01');
    check(!now.noAccessYet, 'B4: Rahul sees the experiment');
    const courses = valueOf(await student.studentAccess.listMyCourses(), 'B4 ST-02');
    check(
      courses.some((course) => course.experimentsGiven === 1),
      'B4: "1 experiment given to you"',
    );
    const hub = valueOf(
      await student.studentAccess.getExperimentHub(shell.experimentId),
      'B4 ST-05',
    );
    const formats = new Map(hub.row.formats.map((entry) => [entry.format, entry]));
    for (const format of ['web', 'vr'] as const) {
      check(
        formats.get(format)?.availability === 'available-to-you',
        `B4: ${format.toUpperCase()} is available to Rahul`,
      );
      check(
        formats.get(format)?.progress === 'not-started',
        `B4: ${format.toUpperCase()} is not started`,
      );
    }
  },
};

const flowBWithdraw: ContractCase = {
  id: 'flow:B5-withdraw',
  title: 'Flow B alternate — withdraw an individual grant (B5)',
  group: 'flow',
  evidence: 'Appendix D §4.3 B5; B2-04; B2-13 f0–f3; OD-B2-01; SACC-14',
  requires: {
    fixture: { kind: 'after-flow', flow: 'B' },
    methods: [
      'CatalogueService.searchCatalogue',
      'StudentAccessService.listGrants',
      'StudentAccessService.withdrawGrant',
      'StudentAccessService.getExperimentHub',
    ],
  },
  run: async (context) => {
    const ia = context.as('Meera Iyer');
    const shell = await experimentNamed(context.publicPorts, SAMPLE.experiments.shellAndTube);
    const grants = valueOf(await ia.studentAccess.listGrants({ showWithdrawn: false }), 'IA-04');
    const row = grants.find((candidate) => candidate.grant.id === WALK.grant);
    check(row, 'After Flow B, SACC-0310 is listed');
    const blank = await ia.studentAccess.withdrawGrant({
      grantId: WALK.grant,
      reason: '',
      expectedRev: row.grant.rev,
    });
    deepEqual(
      keysOf(errorOf(blank, 'validation-failed', 'withdraw without a reason')),
      ['IA-04.reason.required'],
      '"Enter the reason for withdrawing access" (B2-04)',
    );
    const withdrawn = valueOf(
      await ia.studentAccess.withdrawGrant({
        grantId: WALK.grant,
        reason: 'Given individually by mistake.',
        expectedRev: row.grant.rev,
      }),
      'withdraw SACC-0310',
    );
    check(withdrawn.state === 'withdrawn', 'The grant is withdrawn and kept in history');
    const hub = await context.as('Rahul Verma').studentAccess.getExperimentHub(shell.experimentId);
    check(!hub.ok, 'Rahul no longer opens the experiment');
    if (!hub.ok) {
      const error = hub.error;
      check(
        (error.kind === 'refused' && error.code === 'no-longer-given') ||
          (error.kind === 'policy-open' && error.decision === 'SACC-14'),
        'ST-19 "no longer given" — or `policy-open` SACC-14 where what earlier work shows is open (WP-0.9)',
      );
    }
  },
};

export const FLOW_B_CASES: readonly ContractCase[] = [
  flowBInstitution,
  flowBStudents,
  flowBWithdraw,
];
