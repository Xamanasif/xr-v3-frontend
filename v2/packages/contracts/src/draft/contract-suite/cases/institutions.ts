/**
 * Institutions for the Super Admin (Phase-1 Package 1D; B7-02 SA-06, B7-03 SA-07, B7-04):
 * `listInstitutions` tells the same story as each institution's `getInstitution` — status,
 * Institute Admin, plans — and its status tabs and search are the board's (B7-02 script `match`).
 * Assign, Pause and Restore show in the list at once and every refusal writes nothing; the list
 * and the whole picture are the Super Admin's alone (INST-03; the methods' audience is SA-06's and
 * SA-07's workspace). SA-07 lists each student with its own record revision, which a status
 * override sends; a stale one is refused (PC-37).
 *
 * The fixture is the walk after Flow C (opening 27 Oct 2026): its seven institutions stand as the
 * B7 boards draw them on 23 Oct 2026 — Godavari active, BITS Pilani — Hyderabad Campus and Konark
 * ending soon, Sahyadri active without an Institute Admin, Vizag awaiting payment, Deccan paused
 * since 12 Oct, Malnad ended on 15 Oct.
 */
import { type InstitutionId, type InstitutionStatus, unsafeBrand } from '@xr/domain';

import type { InstitutionRow, MethodId, ProductPorts } from '../../ports/index.js';
import { INSTITUTION_TABS } from '../../ports/institution.js';
import { changedKinds, check, deepEqual, errorOf, valueOf } from '../assert.js';
import { institutionIdOf, keysOf } from '../helpers.js';
import type { ContractCase } from '../run.js';
import { DRAWN, SAMPLE } from '../sample.js';

type Tab = (typeof INSTITUTION_TABS)[number];

const READS: readonly MethodId[] = [
  'InstitutionService.listInstitutions',
  'InstitutionService.getInstitution',
];

/**
 * B7-02 f0's tab counts on the 23 Oct 2026 boards: All 7 · Access active 4 · Ending soon 2 ·
 * Paused 1 · Awaiting payment 1 · No Institute Admin 1 (no "Access ended" tab is drawn).
 */
const DRAWN_COUNTS: Readonly<Partial<Record<Tab, number>>> = {
  all: 7,
  'access-active': 4,
  'ending-soon': 2,
  'access-paused': 1,
  'approved-payment-required': 1,
  'no-institute-admin': 1,
};

/** The states in which an Institute Admin may be assigned (INST-04). */
const ASSIGNABLE: readonly InstitutionStatus[] = ['access-active', 'ending-soon', 'access-paused'];

/** B7-02 `match`: "Access active" also holds the institutions ending soon. */
function inTab(row: InstitutionRow, tab: Tab): boolean {
  if (tab === 'all') return true;
  if (tab === 'access-active')
    return row.status === 'access-active' || row.status === 'ending-soon';
  if (tab === 'no-institute-admin') return row.needsInstituteAdmin;
  return row.status === tab;
}

/** "Institution, access plan or Institute Admin", ignoring case and surrounding spaces. */
function matches(row: InstitutionRow, search: string): boolean {
  const wanted = search.trim().toLocaleLowerCase('en');
  // As B7-02's script: name, plan references and Institute Admin as one line.
  return [row.name, ...row.plans.map((plan) => plan.id), row.instituteAdminName ?? '']
    .join(' ')
    .toLocaleLowerCase('en')
    .includes(wanted);
}

async function rowsOf(
  ports: ProductPorts,
  tab: Tab,
  search?: string,
): Promise<readonly InstitutionRow[]> {
  return valueOf(
    await ports.institutions.listInstitutions(search === undefined ? { tab } : { tab, search }),
    `SA-06 ${tab}${search === undefined ? '' : ` searching “${search}”`}`,
  );
}

const listing: ContractCase = {
  id: 'institutions:list',
  title: 'SA-06 lists every institution as SA-07 reads it, with the drawn tabs and search (B7-02)',
  group: 'institution',
  evidence:
    'B7-02 f0–f6 (tabs All 7 · Access active 4 · Ending soon 2 · Paused 1 · Awaiting payment 1 · No Institute Admin 1; search “Institution, access plan or Institute Admin”; “Needs one”; “ACC-0107 · 1 course · 1 experiment”; “No access plan yet · 1 experiment requested”); B7-03; matrix INST-03, INST-04; PC-36',
  requires: {
    fixture: { kind: 'after-flow', flow: 'C' },
    methods: [
      ...READS,
      'CatalogueService.searchCatalogue',
      'AccessRequestService.getRequestForDecision',
    ],
  },
  run: async (context) => {
    const admin = context.as('Arjun Mehta');
    const all = await rowsOf(admin, 'all');
    deepEqual(
      new Set(all.map((row) => row.id)).size,
      all.length,
      'each institution is listed once',
    );
    const catalogue = valueOf(
      await context.publicPorts.catalogue.searchCatalogue({ sort: 'default' }),
      'the published catalogue',
    ).entries;
    const courseOf = new Map(catalogue.map((entry) => [entry.experimentId, entry.courseId]));
    let newer: string | null = null;
    for (const row of all) {
      const detail = valueOf(await admin.institutions.getInstitution(row.id), `SA-07 ${row.name}`);
      deepEqual(
        [row.name, row.kind, row.status],
        [detail.institution.name, detail.institution.kind, detail.status],
        `${row.name}: the row reads as SA-07 does`,
      );
      deepEqual(
        row.instituteAdminName,
        detail.institution.instituteAdmin?.name ?? null,
        `${row.name}: its Institute Admin`,
      );
      deepEqual(
        row.needsInstituteAdmin,
        detail.institution.instituteAdmin === null && ASSIGNABLE.includes(detail.status),
        `${row.name}: “Needs one” exactly while an Institute Admin may be assigned (INST-04)`,
      );
      deepEqual(
        row.plans.map((plan) => plan.id).sort(),
        detail.plans.map((plan) => plan.id).sort(),
        `${row.name}: its access plans`,
      );
      for (const plan of row.plans) {
        check(DRAWN.plan.test(plan.id), `${plan.id} has the drawn form`);
        const held = detail.plans.find((candidate) => candidate.id === plan.id)!;
        deepEqual(plan.experimentCount, held.items.length, `${plan.id}: its experiments`);
        deepEqual(
          plan.courseCount,
          new Set(held.items.map((item) => courseOf.get(item.experimentId))).size,
          `${plan.id}: the courses of its experiments`,
        );
      }
      deepEqual(
        row.accessEndsOn,
        detail.plans
          .map((plan) => plan.endsOn)
          .sort()
          .at(-1) ?? null,
        `${row.name}: when its access ends`,
      );
      const origin = valueOf(
        await admin.accessRequests.getRequestForDecision(detail.institution.createdFromRequestId),
        `${row.name}: the request it was created from`,
      );
      deepEqual(
        row.requestedExperimentCount,
        origin.request.items.length,
        `${row.name}: the experiments its first request asked for`,
      );
      check(
        newer === null || detail.institution.createdAt <= newer,
        `${row.name}: the institution created last comes first (PC-36)`,
      );
      newer = detail.institution.createdAt;
    }

    for (const tab of INSTITUTION_TABS) {
      const rows = await rowsOf(admin, tab);
      deepEqual(
        rows.map((row) => row.id),
        all.filter((row) => inTab(row, tab)).map((row) => row.id),
        `the ${tab} tab holds its rows, in the list's order (B7-02 \`match\`)`,
      );
      const drawn = DRAWN_COUNTS[tab];
      if (drawn !== undefined) {
        deepEqual(rows.length, drawn, `the ${tab} tab counts ${drawn}, as B7-02 f0 draws it`);
      }
    }

    const somePlan = all.flatMap((row) => row.plans)[0];
    const someAdmin = all.find((row) => row.instituteAdminName !== null)?.instituteAdminName;
    check(somePlan && someAdmin, 'the list names an access plan and an Institute Admin');
    const planned = all.find((row) => row.plans.length > 0)!;
    for (const search of [
      `  ${all[0]!.name.toLocaleUpperCase('en')} `,
      somePlan.id.toLowerCase(),
      someAdmin,
      'polytechnic',
      // Across two of them, as B7-02 joins them: the name's last word and the plan reference.
      `${planned.name.split(' ').at(-1)!} ${planned.plans[0]!.id}`,
    ]) {
      const found = await rowsOf(admin, 'all', search);
      deepEqual(
        found.map((row) => row.id),
        all.filter((row) => matches(row, search)).map((row) => row.id),
        `searching “${search}” finds the institutions it names (name, access plan, Institute Admin)`,
      );
      check(found.length > 0, `“${search}” finds an institution`);
    }
    deepEqual(
      (await rowsOf(admin, 'all', 'Narmada')).length,
      0,
      'B7-02 f4 “No match”: nothing is called Narmada',
    );
    const paused = await rowsOf(admin, 'access-paused');
    const notPaused = all.find((row) => !paused.some((candidate) => candidate.id === row.id))!;
    deepEqual(
      (await rowsOf(admin, 'access-paused', notPaused.name)).length,
      0,
      'the search applies within the chosen tab',
    );
    context.note(
      `${all.length} institutions; ${INSTITUTION_TABS.map((tab) => `${tab} ${all.filter((row) => inTab(row, tab)).length}`).join(', ')}`,
    );
  },
};

const scope: ContractCase = {
  id: 'institutions:scope',
  title: 'Only the Super Admin lists the institutions and reads one institution’s whole picture',
  group: 'institution',
  evidence:
    'Matrix INST-03 (Super Admin: every institution, and one institution’s plan, people, report and history); the methods’ audience is SA-06’s and SA-07’s workspace (ledger screens; Appendix F §4.5 step 2); B7-02; B7-03',
  requires: {
    fixture: { kind: 'after-flow', flow: 'C' },
    methods: [...READS, 'SessionService.getSession'],
  },
  run: async (context) => {
    const admin = context.as('Arjun Mehta');
    const own = await institutionIdOf(context.as('Meera Iyer'), 'Meera Iyer');
    check((await rowsOf(admin, 'all')).length > 0, 'the Super Admin lists the institutions');
    for (const who of [
      'Meera Iyer',
      'Rahul Verma',
      'Dr S. Ranganathan',
      'Anil Shetty',
      'Prof. A. Menon',
      'Kavya Nair',
    ] as const) {
      const ports = context.as(who);
      errorOf(
        await ports.institutions.listInstitutions({ tab: 'all' }),
        'not-permitted',
        `${who} lists the institutions`,
      );
      errorOf(
        await ports.institutions.getInstitution(own),
        'not-permitted',
        `${who} reads the whole picture of an institution — their own included`,
      );
    }
    errorOf(
      await admin.institutions.getInstitution(unsafeBrand<InstitutionId>('no-such-institution')),
      'not-found',
      'SA-07 for an address that names no institution',
    );
  },
};

const actions: ContractCase = {
  id: 'institutions:actions',
  title: 'Assign, Pause and Restore show in the list at once; the refusals write nothing',
  group: 'institution',
  evidence:
    'B7-02 f1 (“Pause, Restore and Assign Institute Admin work here; every result is kept in the history”); B7-03 f1 … f7 (“No Institute Admin until access is active; no status action”; “Read-only: no Pause, no Restore”; both assign errors at once); matrix INST-04 … INST-09; T-11',
  requires: {
    fixture: { kind: 'after-flow', flow: 'C' },
    methods: [
      ...READS,
      'InstitutionService.assignInstituteAdmin',
      'InstitutionService.pauseInstitution',
      'InstitutionService.restoreInstitution',
    ],
  },
  run: async (context) => {
    const admin = context.as('Arjun Mehta');
    const all = await rowsOf(admin, 'all');
    const needing = all.filter((row) => row.needsInstituteAdmin);
    check(needing.length === 1, 'B7-02: one institution needs an Institute Admin');
    const target = needing[0]!;
    const detail = valueOf(await admin.institutions.getInstitution(target.id), 'SA-07');
    const both = await admin.institutions.assignInstituteAdmin({
      institutionId: target.id,
      name: ' ',
      workEmail: 'n.joshi@sahyadri',
      expectedRev: detail.institution.rev,
    });
    deepEqual(
      keysOf(errorOf(both, 'validation-failed', 'assign with no name and a partial e-mail')),
      ['SA-07.name.required', 'SA-07.workEmail.format'],
      'B7-03 f6: both errors at once, on the fields',
    );
    const email = 'institute.admin@example.edu.in';
    const ahead = await admin.institutions.assignInstituteAdmin({
      institutionId: target.id,
      name: 'N. Joshi',
      workEmail: email,
      expectedRev: detail.institution.rev + 1,
    });
    errorOf(ahead, 'stale-version', 'assign with a revision the record does not have');
    const assigned = await admin.institutions.assignInstituteAdmin({
      institutionId: target.id,
      name: 'N. Joshi',
      workEmail: email,
      expectedRev: detail.institution.rev,
    });
    valueOf(assigned, 'assign the Institute Admin');
    deepEqual(changedKinds(assigned), ['INST'], 'assigning changes the institution only (T-11)');
    const row = (await rowsOf(admin, 'all')).find((candidate) => candidate.id === target.id)!;
    deepEqual(
      [row.instituteAdminName, row.needsInstituteAdmin],
      ['N. Joshi', false],
      'the list names the Institute Admin at once; “Needs one” is gone',
    );
    deepEqual(
      (await rowsOf(admin, 'no-institute-admin')).length,
      0,
      'the No Institute Admin tab is empty',
    );
    errorOf(
      await admin.institutions.pauseInstitution({
        institutionId: target.id,
        reason: SAMPLE.pauseReason,
        expectedRev: detail.institution.rev,
      }),
      'stale-version',
      'pause with the revision read before the Institute Admin was assigned',
    );

    const active = (await rowsOf(admin, 'access-active'))[0];
    check(active, 'an institution has access');
    const before = valueOf(await admin.institutions.getInstitution(active.id), 'SA-07 active');
    const paused = valueOf(
      await admin.institutions.pauseInstitution({
        institutionId: active.id,
        reason: SAMPLE.pauseReason,
        expectedRev: before.institution.rev,
      }),
      'pause',
    );
    check(
      (await rowsOf(admin, 'access-paused')).some((candidate) => candidate.id === active.id) &&
        !(await rowsOf(admin, 'access-active')).some((candidate) => candidate.id === active.id),
      'a paused institution moves from Access active to Paused at once',
    );
    errorOf(
      await admin.institutions.pauseInstitution({
        institutionId: active.id,
        reason: SAMPLE.pauseReason,
        expectedRev: paused.rev,
      }),
      'invalid-state',
      'pause an institution that is already paused (another tab paused it first)',
    );
    valueOf(
      await admin.institutions.restoreInstitution({
        institutionId: active.id,
        reason: 'The student list is confirmed.',
        expectedRev: paused.rev,
      }),
      'restore',
    );
    deepEqual(
      (await rowsOf(admin, 'all')).find((candidate) => candidate.id === active.id)?.status,
      active.status,
      'Restore brings back the status the institution had',
    );

    for (const tab of ['access-ended', 'approved-payment-required'] as const) {
      const quiet = (await rowsOf(admin, tab))[0];
      check(quiet, `an institution in ${tab}`);
      const record = valueOf(await admin.institutions.getInstitution(quiet.id), `SA-07 ${tab}`);
      for (const [step, answer] of [
        [
          'pause',
          await admin.institutions.pauseInstitution({
            institutionId: quiet.id,
            reason: SAMPLE.pauseReason,
            expectedRev: record.institution.rev,
          }),
        ],
        [
          'restore',
          await admin.institutions.restoreInstitution({
            institutionId: quiet.id,
            reason: 'Restore.',
            expectedRev: record.institution.rev,
          }),
        ],
      ] as const) {
        errorOf(answer, 'invalid-state', `${quiet.name} (${tab}): no ${step} (INST-09)`);
      }
    }
    const awaiting = (await rowsOf(admin, 'approved-payment-required'))[0]!;
    const waiting = valueOf(await admin.institutions.getInstitution(awaiting.id), 'SA-07 awaiting');
    check(
      errorOf(
        await admin.institutions.assignInstituteAdmin({
          institutionId: awaiting.id,
          name: 'K. Rao',
          workEmail: 'k.rao@example.edu.in',
          expectedRev: waiting.institution.rev,
        }),
        'refused',
        'assign before access is active',
      ).code === 'access-not-active',
      '“The Institute Admin is assigned once access is active” (B7-03 f3; INST-05, OD-B7-11)',
    );
  },
};

const revision: ContractCase = {
  id: 'institutions:student-revision',
  title:
    'SA-07 lists each student with its record’s revision; an override sends it and a stale one is refused',
  group: 'institution',
  evidence:
    'B7-03 f0, f8 (People: “Change status”, an override with a reason, inline); matrix PER-11, PER-05 / PER-06; Phase-0 handover owner item “SA-07 student list lacks rev for overrideStudentStatus”; PC-37',
  requires: {
    fixture: { kind: 'after-flow', flow: 'C' },
    methods: [
      'InstitutionService.getInstitution',
      'InstitutionService.overrideStudentStatus',
      'SessionService.getSession',
    ],
  },
  run: async (context) => {
    const admin = context.as('Arjun Mehta');
    const institutionId = await institutionIdOf(context.as('Meera Iyer'), 'Meera Iyer');
    const before = valueOf(await admin.institutions.getInstitution(institutionId), 'SA-07');
    const inactive = before.people.studentList.find((student) => student.status === 'inactive');
    const active = before.people.studentList.find((student) => student.status === 'active');
    check(inactive && active, 'B7-03: the institution lists active and inactive students');
    deepEqual(
      keysOf(
        errorOf(
          await admin.institutions.overrideStudentStatus({
            studentId: inactive.id,
            to: 'active',
            reason: '   ',
            expectedRev: inactive.rev,
          }),
          'validation-failed',
          'override without a reason',
        ),
      ),
      ['SA-07.reason.required'],
      '“Add a reason — it is kept in the history” (B7-03 f8)',
    );
    errorOf(
      await admin.institutions.overrideStudentStatus({
        studentId: active.id,
        to: 'active',
        reason: 'Already active.',
        expectedRev: active.rev,
      }),
      'invalid-state',
      'an override to the status the student already has',
    );
    errorOf(
      await context.as('Meera Iyer').institutions.overrideStudentStatus({
        studentId: inactive.id,
        to: 'active',
        reason: 'Re-enrolled.',
        expectedRev: inactive.rev,
      }),
      'not-permitted',
      'the override is the Super Admin’s (PER-11); the Institute Admin uses IA-07',
    );
    const changed = await admin.institutions.overrideStudentStatus({
      studentId: inactive.id,
      to: 'active',
      reason: 'Re-enrolled for Sem II.',
      expectedRev: inactive.rev,
    });
    const student = valueOf(changed, 'override with the revision SA-07 listed');
    deepEqual(changedKinds(changed), ['PER'], 'an override changes the student record only');
    check(
      student.accountStatus === 'active' && student.rev > inactive.rev,
      'the student is active, at a new revision',
    );
    const after = valueOf(await admin.institutions.getInstitution(institutionId), 'SA-07 after');
    deepEqual(
      after.people.studentList
        .filter((listed) => listed.id === inactive.id)
        .map((listed) => [listed.status, listed.rev]),
      [['active', student.rev]],
      'SA-07 lists the new status with the record’s new revision',
    );
    errorOf(
      await admin.institutions.overrideStudentStatus({
        studentId: inactive.id,
        to: 'inactive',
        reason: 'Left again.',
        expectedRev: inactive.rev,
      }),
      'stale-version',
      'an override with the revision read before the change (another tab)',
    );
    context.note(`${after.people.studentList.length} students listed with their revisions`);
  },
};

export const INSTITUTION_CASES: readonly ContractCase[] = [listing, scope, actions, revision];
