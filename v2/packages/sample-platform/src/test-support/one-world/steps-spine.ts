/**
 * The spine of the one-world proof: every walk step, once, in board-date order (Appendix F §4.3),
 * grouped into proof steps that name the flows.json step (or the setup, background or interim
 * step) they prove. After each one the step's own checks read what every relevant role now sees
 * through that role's own port methods (Appendix D §4.2–§4.8 "Others now see"), try the drawn
 * absences as refusals that must write nothing, and look at the actual command results; the
 * harness then runs the twelve invariants and the history checks.
 *
 * The flows interleave as the boards date them: Flow E's Vendor steps start on 6 Oct, before A3;
 * Flow F's steps sit between C and D; the device chain between E and D.
 */
import type { AccessRequest, AttemptResult, Submission } from '@xr/domain';
import { unsafeBrand } from '@xr/domain';

import { ist } from '../../seed/book.js';
import { expect, type ProofStep } from './harness.js';
import {
  bannersOf,
  catalogueNamed,
  COMPOSITE_WALL,
  COMPOSITE_WALL_NEW,
  DISTILLATION,
  formatPage,
  hubFormats,
  must,
  SHELL,
} from './reads.js';

const REQ_0042 = unsafeBrand<AccessRequest['id']>('REQ-0042');
const SUB_0077 = unsafeBrand<Submission['id']>('SUB-0077');

/** The requester's PU-10 view of REQ-0042 at its address, through the visitor's own ticket (O-05). */
async function requesterView(proof: Parameters<ProofStep['verify']>[0]) {
  const route = proof.carried.get('requestRoute');
  if (!route) throw new Error('The REQ-0042 address was not carried from A2.');
  return must(proof.visitor.accessRequests.getRequestStatus(unsafeBrand(route)), 'PU-10 REQ-0042');
}

export const SPINE: readonly ProofStep[] = [
  // ---------------------------------------------------------------- Flow A (with E1 between)
  {
    id: 'A1-A2',
    title: 'Public selection, then the request REQ-0042 is sent',
    covers: ['flows.json A1', 'flows.json A2'],
    actor: 'Public visitor (institution contact)',
    screens: 'PU-01 → PU-04 → PU-06 → PU-07 → PU-08 → PU-09',
    evidence: 'B1-04 · B1-05 · B1-06 · B1-07 f8 · B1-08 f1 · B1-10 f0',
    walk: ['A2'],
    verify: async (proof) => {
      // A1 — the selection lives in the visitor's browser session: the add wrote no world record.
      const add = proof.calls().find((call) => call.method === 'SelectionService.add');
      expect(add, 'A1: the walk added Shell-and-Tube to the selection').toBeDefined();
      expect(add!.versionAfter, 'A1: the selection is not a world record (B1-06)').toBe(
        add!.versionBefore,
      );
      const listed = (await catalogueNamed(proof.stranger(), 'Shell-and-Tube'))[0]!;
      expect(
        listed.availableIn,
        'A1: "Available in" includes the WEB and VR the visitor selects (B1-05)',
      ).toEqual(expect.arrayContaining(['web', 'vr']));
      // A2 — the actual command result: REQ-0042 and nothing else.
      const sent = proof.resultOf<{ reference: string; statusToken: string }>(
        'AccessRequestService.submitPublicRequest',
      );
      expect(sent.reference, 'A2: the board reference').toBe('REQ-0042');
      expect(
        proof.changedBy('AccessRequestService.submitPublicRequest'),
        'A2: only the request is written (BC9)',
      ).toEqual(['REQ:REQ-0042']);
      expect(
        proof.visitor.selection.get().items,
        'A2: the selection is sent and empty again (B1-07)',
      ).toEqual([]);
      // The requester (PU-10): under review, "Submitted" until review starts (AD-14), nothing to do.
      const status = await requesterView(proof);
      expect([status.status, status.reviewStarted, status.nextStep]).toEqual([
        'under-review',
        false,
        'none',
      ]);
      // The Super Admin (SA-02 / SA-03): under review, route not set, no institution record yet.
      const admin = proof.as('Arjun Mehta');
      const row = (
        await must(admin.accessRequests.listRequests({ sort: 'received-newest' }), 'SA-02')
      ).find((candidate) => candidate.id === REQ_0042);
      expect([row?.status, row?.route], 'A2: SA-02 "Under review", route "Not set yet"').toEqual([
        'under-review',
        null,
      ]);
      expect(
        proof.world().records.institutions['godavari'],
        'A2: no institution until the first approval',
      ).toBeUndefined();
      // Unavailable: the visitor reads no staff list.
      await proof.refused(
        'the visitor lists requests',
        () => proof.visitor.accessRequests.listRequests({ sort: 'received-newest' }),
        { kind: 'not-signed-in' },
      );
    },
  },
  {
    id: 'bg-SUP-0207',
    title: 'Background — the Super Admin reopens SUP-0207 (B7-09)',
    covers: ['cross-cutting support-reopen'],
    actor: 'Super Admin',
    screens: 'SA-21',
    evidence: 'B7-09 f10 · board 07 frame s8',
    walk: ['bg-SUP-0207'],
    verify: async (proof) => {
      const reopened = proof.resultOf<{ state: string; reopenings: unknown[] }>(
        'OperationsService.reopenReport',
      );
      expect([reopened.state, reopened.reopenings.length]).toEqual(['reopened', 1]);
      const kavya = await must(
        proof.as('Kavya Nair').operations.getMyReport(unsafeBrand('SUP-0207')),
        'Kavya reads SUP-0207',
      );
      expect(kavya.state, 'The reporter reads it reopened').toBe('reopened');
      // Nobody else reads it as theirs.
      await proof.refused(
        'the Vendor reads Kavya’s report',
        () => proof.as('Anil Shetty').operations.getMyReport(unsafeBrand('SUP-0207')),
        { kind: 'not-permitted' },
      );
    },
  },
  {
    id: 'E1',
    title: 'The Vendor saves SUB-0077 and submits it for academic review',
    covers: ['flows.json E1'],
    actor: 'Vendor',
    screens: 'VE-02 → VE-03 … VE-06',
    evidence: 'B5-03 f6 · B5-05 f1 · B5-06 f2 · B6-12 f4 · B7-06 f4',
    walk: ['E1-save', 'E1-submit'],
    verify: async (proof) => {
      const draft = proof.resultOf<Submission>('ProductionService.saveDraft');
      expect([draft.id, draft.status.state], 'E1: "Draft saved · SUB-0077"').toEqual([
        'SUB-0077',
        'draft',
      ]);
      const sent = proof.resultOf<Submission>('ProductionService.submitForReview');
      expect([sent.status.state, sent.revision]).toEqual(['with-academic-reviewer', 1]);
      expect(
        proof.changedBy('ProductionService.submitForReview'),
        'E1: submitting writes the submission only',
      ).toEqual(['SUB:SUB-0077']);
      // Others now see: the reviewer's queue; the Super Admin "In the workflow"; nothing public.
      const queue = await must(proof.as('Prof. A. Menon').production.getReviewQueue({}), 'RV-02');
      expect(
        queue.some((item) => item.ref.kind === 'SUB' && item.ref.id === 'SUB-0077'),
        'E1: RV-02 lists it',
      ).toBe(true);
      const record = await must(
        proof.as('Arjun Mehta').production.getContentRecord({ kind: 'SUB', id: SUB_0077 }),
        'SA-13',
      );
      expect(
        [record.submission?.status.state, record.stuck],
        'E1: SA-13 "In the workflow"',
      ).toEqual(['with-academic-reviewer', false]);
      const ready = await must(proof.as('Kavya Nair').production.listReadyToPublish(), 'CM-02');
      expect(
        ready.some((row) => row.submission.id === SUB_0077),
        'E1: nothing reaches the Content Manager',
      ).toBe(false);
      expect(
        (await catalogueNamed(proof.stranger(), 'Composite Wall')).map((entry) => entry.name),
        'E1: submitting publishes nothing (BR-096)',
      ).toEqual([COMPOSITE_WALL]);
      // Unavailable: publishing, an override and a second submission.
      await proof.refused(
        'CM publishes SUB-0077 before approval',
        () => proof.as('Kavya Nair').production.publish({ id: SUB_0077, expectedRev: sent.rev }),
        { kind: 'invalid-state' },
      );
      await proof.refused(
        'SA overrides a record someone can act on',
        () =>
          proof.as('Arjun Mehta').production.overrideStatus({
            id: SUB_0077,
            reason: 'Moving it on.',
            expectedRev: sent.rev,
          }),
        { kind: 'refused', code: 'override-not-stuck' },
      );
    },
  },
  {
    id: 'A3-review-start',
    title:
      'Opening SA-03 never starts review; the review-start fact is supplied by the test-only seam',
    covers: ['interim AD-14'],
    interim: 'AD-14 / P1-04 — review-start fact supplied by the test-only seam',
    actor: 'Super Admin (read) · test seam',
    screens: 'SA-02 → SA-03 · PU-10',
    evidence: 'B1-08 f1 → f2 · B1-11 f0 · B1-13 timeline "BITS started reviewing"',
    at: '2026-10-08 11:10',
    run: async (proof) => {
      // Opening the decision page is a read: it never moves the request (AD-14).
      await must(
        proof.as('Arjun Mehta').accessRequests.getRequestForDecision(REQ_0042),
        'SA-03 REQ-0042',
      );
      expect(
        (await requesterView(proof)).reviewStarted,
        'AD-14: opening SA-03 does not start review',
      ).toBe(false);
      proof.seams.recordReviewStarted('REQ-0042');
    },
    verify: async (proof) => {
      const status = await requesterView(proof);
      expect(
        [status.status, status.reviewStarted],
        'AD-14 interim: the requester now reads "Under review" (B1-08 f2)',
      ).toEqual(['under-review', true]);
      const entries = proof.committed();
      expect(
        entries.map((entry) => [entry.method, entry.origin]),
        'AD-14: one test-seam commit, nothing else',
      ).toEqual([['seam.recordReviewStarted', 'test-seam']]);
      expect(entries[0]!.changed.map((ref) => `${ref.kind}:${ref.id}`)).toEqual(['REQ:REQ-0042']);
    },
  },
  {
    id: 'A3',
    title: 'The Super Admin approves REQ-0042 (external): approved — payment required',
    covers: ['flows.json A3'],
    actor: 'Super Admin',
    screens: 'SA-02 → SA-03',
    evidence: 'B1-10 f0 · B1-11 f9 · B1-08 f0 · B7-03 f3',
    walk: ['A3'],
    verify: async (proof) => {
      const outcome = proof.resultOf<{
        request: AccessRequest;
        institution: { id: string; kind: string } | null;
        plan: unknown;
        planEffect: { kind: string };
      }>('AccessRequestService.approveRequest');
      expect([
        outcome.request.status,
        outcome.institution?.id,
        outcome.institution?.kind,
        outcome.plan,
        outcome.planEffect.kind,
      ]).toEqual(['approved-payment-required', 'godavari', 'external', null, 'none']);
      expect(
        proof.changedBy('AccessRequestService.approveRequest'),
        'A3: the request and the institution only — no plan, no grant (BR-036, BC9)',
      ).toEqual(['INST:godavari', 'REQ:REQ-0042']);
      const status = await requesterView(proof);
      expect(
        [status.status, status.nextStep],
        'A3: PU-10 "Continue to payment" (B1-08 f0)',
      ).toEqual(['approved-payment-required', 'continue-to-payment']);
      const detail = await must(
        proof.as('Arjun Mehta').institutions.getInstitution(unsafeBrand('godavari')),
        'SA-07',
      );
      expect(detail.plans, 'A3: no access plan before payment').toEqual([]);
      expect(
        Object.keys(proof.world().records.grants).length,
        'A3: approval creates no Student grant',
      ).toBe(0);
      // Unavailable: a second decision, and any decline (T-02).
      await proof.refused(
        'approve twice',
        () =>
          proof.as('Arjun Mehta').accessRequests.approveRequest({
            id: REQ_0042,
            route: 'external',
            expectedRev: outcome.request.rev,
          }),
        { kind: 'invalid-state' },
      );
      expect(
        'declineRequest' in proof.as('Arjun Mehta').accessRequests,
        'A3: no Decline (T-02)',
      ).toBe(false);
    },
  },
  {
    id: 'A4',
    title: 'Payment confirmed: access active, ACC-0107 created — and no Student is given anything',
    covers: ['flows.json A4'],
    actor: 'Institution contact · payment provider stand-in',
    screens: 'PU-10 → PU-12 → PU-13',
    evidence: 'B1-08 f5 · f8 · B1-11 f10 · B7-03 f0',
    walk: ['A4-pay', 'A4-confirm'],
    verify: async (proof) => {
      const started = proof.resultOf<AccessRequest>('AccessRequestService.startPayment');
      expect(started.status, 'A4: nothing is active until the payment is confirmed').toBe(
        'payment-not-confirmed',
      );
      const paid = proof.calls().find((call) => call.method === 'standin.paymentOutcome.report')!;
      const effect = (
        paid.answer as { ok: true; value: { planEffect: { kind: string; planId?: string } } }
      ).value.planEffect;
      expect(effect, 'A4: only a confirmed payment activates, creating ACC-0107').toEqual({
        kind: 'plan-created',
        planId: 'ACC-0107',
      });
      const status = await requesterView(proof);
      expect(
        [status.status, status.activatedPlanId, status.nextStep],
        'A4: PU-13 "Access is active" → Sign in',
      ).toEqual(['access-active', 'ACC-0107', 'sign-in']);
      const detail = await must(
        proof.as('Arjun Mehta').institutions.getInstitution(unsafeBrand('godavari')),
        'SA-07',
      );
      expect(
        [detail.status, detail.institution.instituteAdmin],
        'A4: SA-07 Access active, "No Institute Admin" (B7-03)',
      ).toEqual(['access-active', null]);
      expect(
        Object.keys(proof.world().records.grants).length,
        'A4: activation grants no Student access (BR-026)',
      ).toBe(0);
      expect(
        'markPaid' in proof.as('Arjun Mehta').accessRequests,
        'A4: no "mark paid" (BR-037)',
      ).toBe(false);
    },
  },
  // ---------------------------------------------------------------- Flow B and the setup
  {
    id: 'B1',
    title: 'The Super Admin assigns Meera Iyer as Institute Admin',
    covers: ['flows.json B1'],
    actor: 'Super Admin',
    screens: 'SA-07 (Assign Institute Admin)',
    evidence: 'B7-03 f1 · f6 · B1-08 f8',
    walk: ['B1'],
    verify: async (proof) => {
      const institution = proof.resultOf<{
        instituteAdmin: { name: string } | null;
        rev: number;
        id: string;
      }>('InstitutionService.assignInstituteAdmin');
      expect(institution.instituteAdmin?.name).toBe('Meera Iyer');
      expect(
        proof
          .changedBy('InstitutionService.assignInstituteAdmin')
          .some((ref) => ref.startsWith('SACC:')),
        'B1: no Student access',
      ).toBe(false);
      const session = await must(proof.as('Meera Iyer').session.getSession(), 'Meera’s session');
      expect(
        [session?.session.role, session?.session.institutionName],
        'B1: she signs in to her institution (IA-01)',
      ).toEqual(['tenant_admin', 'Godavari Institute of Technology']);
      expect(
        await must(proof.as('Meera Iyer').session.checkWorkspace('institute'), 'IA workspace'),
      ).toBe('allowed');
      await proof.refused(
        'replace the Institute Admin',
        () =>
          proof.as('Arjun Mehta').institutions.assignInstituteAdmin({
            institutionId: unsafeBrand('godavari'),
            name: 'Someone Else',
            workEmail: 'someone.else@godavari.edu.in',
            expectedRev: institution.rev,
          }),
        { kind: 'policy-open', decision: 'INST-06' },
      );
      await proof.refused(
        'the Institute Admin opens the Super Admin workspace',
        () => proof.as('Meera Iyer').session.checkWorkspace('admin'),
        { kind: 'not-permitted' },
      );
    },
  },
  {
    id: 'setup-S1-S7',
    title:
      'Setup S1–S7: students imported, Sneha inactive, Faculty, FMAP-0021, GRP-0012, MEC-523, Rahul’s device',
    covers: ['cross-cutting people-setup'],
    actor: 'Institute Admin · fixture (S3-ravi, S7)',
    screens: 'IA-11 · IA-07 · IA-12 · IA-15 · IA-14 · IA-16',
    evidence: 'B2-06 · B2-07 · B2-08 · B2-09 · B2-03 f7 · Appendix F S1–S7',
    walk: ['S1', 'S2', 'S3', 'S3-ravi', 'S4', 'S5', 'S6', 'S7'],
    verify: async (proof) => {
      const imported = proof.resultOf<{ added: number } | unknown>(
        'PeopleService.commitStudentImport',
      );
      expect(imported).toBeDefined();
      // Institution access is not Student entitlement: every imported Student has nothing yet.
      for (const name of ['Rahul Verma', 'Priya Natarajan']) {
        const home = await must(proof.as(name).studentAccess.getMyHome(), `${name} ST-01`);
        expect(
          home.noAccessYet,
          `${name}: "Your institution hasn’t given you access yet" (B2-10 f0)`,
        ).toBe(true);
      }
      const sneha = await must(
        proof.as('Meera Iyer').people.getStudent(proof.personId('Sneha Reddy')),
        'IA-07 Sneha',
      );
      expect(sneha.student.accountStatus, 'S2: Sneha inactive').toBe('inactive');
      expect(await bannersOf(proof.as('Sneha Reddy'), 'Sneha')).toContain('account-inactive');
      expect(
        (await must(proof.as('Dr S. Ranganathan').session.getSession(), 'Faculty session'))?.session
          .role,
      ).toBe('faculty');
      // Fixture-supplied values carry a seed note and no product actor (PER-07, D20b).
      const supplied = proof.committed().filter((entry) => entry.origin === 'sample-fixture');
      expect(supplied.map((entry) => entry.method)).toEqual([
        'fixture.facultyInactive',
        'fixture.authorisedDevice',
      ]);
      expect(supplied.every((entry) => entry.actor === null)).toBe(true);
      // Still no grant of any kind after the setup.
      expect(Object.keys(proof.world().records.grants).length).toBe(0);
    },
  },
  {
    id: 'B2',
    title: 'The Institute Admin reads content access and ACC-0107 — read-only, nothing counted',
    covers: ['flows.json B2'],
    actor: 'Institute Admin',
    screens: 'IA-01 → IA-02 → IA-03',
    evidence: 'B2-01 f0 · B2-02 f0 · B2-03 f0',
    at: '2026-10-08 16:20',
    verify: async (proof) => {
      const ia = proof.as('Meera Iyer');
      const content = await must(ia.institutions.listContentAccess(), 'IA-02');
      const item = content
        .flatMap((row) => row.items)
        .find((entry) => entry.experimentId === SHELL);
      expect(
        [...(item?.formats ?? [])].sort(),
        'B2: the plan holds Shell-and-Tube with WEB · VR',
      ).toEqual(['vr', 'web']);
      const plan = await must(ia.institutions.getAccessPlan(unsafeBrand('ACC-0107')), 'IA-03');
      expect(
        [plan.status, plan.plan.licences, plan.studentsGiven],
        'B2: "Licences 120 — as approved by BITS"; nobody given yet',
      ).toEqual(['access-active', 120, 0]);
      expect('amendPlan' in ia.institutions, 'B2: no plan amendment (T-08)').toBe(false);
      // Content access ≠ Student access (BR-026).
      expect(
        (await must(proof.as('Rahul Verma').studentAccess.getMyHome(), 'ST-01')).noAccessYet,
      ).toBe(true);
    },
  },
  {
    id: 'B3',
    title: 'The Institute Admin gives Rahul Shell-and-Tube: SACC-0310 Active',
    covers: ['flows.json B3'],
    actor: 'Institute Admin',
    screens: 'IA-06 / IA-11 → IA-05',
    evidence: 'B2-05 f3 · B2-04 f0 · B2-03 f1 · B2-13 f0',
    walk: ['B3'],
    verify: async (proof) => {
      const given = proof.resultOf<{ grantId: string; display: string }[]>(
        'StudentAccessService.giveAccess',
      );
      expect(
        given.map((row) => [row.grantId, row.display]),
        'B3: "Access given · SACC-0310"',
      ).toEqual([['SACC-0310', 'active']]);
      const written = proof.changedBy('StudentAccessService.giveAccess');
      expect(
        written.filter((ref) => /^(RUN|COMP|FB|RES):/.test(ref)),
        'B3: a grant writes no activity, completion or feedback (invariant 8)',
      ).toEqual([]);
      expect(written, 'B3: the grant, plus the plan’s and Rahul’s own history lines').toEqual([
        'ACC:ACC-0107',
        `PER:${proof.personId('Rahul Verma')}`,
        'SACC:SACC-0310',
      ]);
      expect(
        proof.fieldsChanged('StudentAccessService.giveAccess', 'ACC:ACC-0107'),
        'B3: no licence arithmetic — the plan gains a history line only (T-06)',
      ).toEqual(['history', 'rev', 'updatedAt']);
      expect(
        proof.fieldsChanged(
          'StudentAccessService.giveAccess',
          `PER:${proof.personId('Rahul Verma')}`,
        ),
        'B3: Rahul’s record gains a history line only',
      ).toEqual(['history', 'rev', 'updatedAt']);
      const ia = proof.as('Meera Iyer');
      const plan = await must(ia.institutions.getAccessPlan(unsafeBrand('ACC-0107')), 'IA-03');
      expect(
        [plan.plan.licences, plan.studentsGiven],
        'B3: licences as provided — no counting (T-06)',
      ).toEqual([120, 1]);
      const grants = await must(ia.studentAccess.listGrants({ showWithdrawn: false }), 'IA-04');
      expect(grants.map((row) => [row.grant.id, row.student.fullName, row.display])).toEqual([
        ['SACC-0310', 'Rahul Verma', 'active'],
      ]);
      // Unavailable: twice, an inactive Student, a Student of another experiment's absence.
      await proof.refused(
        'give Rahul the experiment again',
        () =>
          ia.studentAccess.giveAccess({
            experimentIds: [SHELL],
            target: { kind: 'student', studentId: proof.personId('Rahul Verma') },
            expectedPlanRev: plan.plan.rev,
          }),
        { kind: 'refused', code: 'already-given' },
      );
      await proof.refused(
        'give the inactive Sneha access',
        () =>
          ia.studentAccess.giveAccess({
            experimentIds: [SHELL],
            target: { kind: 'student', studentId: proof.personId('Sneha Reddy') },
            expectedPlanRev: plan.plan.rev,
          }),
        { kind: 'refused' },
      );
      await proof.refused(
        'give an experiment outside the plan',
        () =>
          ia.studentAccess.giveAccess({
            experimentIds: [DISTILLATION],
            target: { kind: 'student', studentId: proof.personId('Priya Natarajan') },
            expectedPlanRev: plan.plan.rev,
          }),
        { kind: 'refused' },
      );
      // Other Students are unchanged.
      expect(
        (await must(proof.as('Priya Natarajan').studentAccess.getMyHome(), 'Priya ST-01'))
          .noAccessYet,
      ).toBe(true);
    },
  },
  {
    id: 'B4',
    title: 'Rahul sees the experiment and the formats given to him — Not started',
    covers: ['flows.json B4'],
    actor: 'Student',
    screens: 'ST-01 → ST-02 → ST-05',
    evidence: 'B2-10 f1 · B2-11 · B2-12 f0 · B2-10 f9 (MEC-523)',
    at: '2026-10-09 10:30',
    verify: async (proof) => {
      const student = proof.as('Rahul Verma');
      expect((await must(student.studentAccess.getMyHome(), 'ST-01')).noAccessYet).toBe(false);
      const courses = await must(student.studentAccess.listMyCourses(), 'ST-02');
      expect(
        courses.map((course) => [
          course.codeShown,
          course.experimentsGiven,
          [...course.formatsAvailable].sort(),
        ]),
        'B4: "1 experiment given to you · WEB and VR available" under MEC-523 (T-17)',
      ).toEqual([['MEC-523', 1, ['vr', 'web']]]);
      const formats = await hubFormats(proof);
      expect(
        [...formats].map(([format, entry]) => [format, entry.availability, entry.progress]),
      ).toEqual([
        ['web', 'available-to-you', 'not-started'],
        ['ar', 'not-included-for-your-institution', 'not-started'],
        ['vr', 'available-to-you', 'not-started'],
        ['mr', 'not-available-for-this-experiment', 'not-started'],
      ]);
      // An experiment that was never given: ST-19, nothing written.
      await proof.refused(
        'Rahul opens an experiment he was not given',
        () => student.studentAccess.getExperimentHub(DISTILLATION),
        { kind: 'refused' },
      );
      // The Faculty member who teaches the course sees him (FA-20), per format, no figures.
      const taught = await must(
        proof.as('Dr S. Ranganathan').teaching.listStudents({ experimentId: SHELL }),
        'FA-20',
      );
      expect(taught.map((row) => row.studentId)).toEqual([proof.personId('Rahul Verma')]);
    },
  },
  {
    id: 'bg-deccan-pause',
    title: 'Background — Deccan paused by the Super Admin; Godavari untouched',
    covers: ['cross-cutting pause-other-institution'],
    actor: 'Super Admin',
    screens: 'SA-07',
    evidence: 'B7-03 f2 · B7-04',
    walk: ['bg-deccan-pause'],
    verify: async (proof) => {
      expect(
        proof.changedBy('InstitutionService.pauseInstitution'),
        'Pause writes the institution and its plan only',
      ).toEqual(['ACC:ACC-0085', 'INST:deccan']);
      const deccanAdmin = proof.world().records.institutions['deccan']!.instituteAdmin!.name;
      expect(
        await bannersOf(proof.as(deccanAdmin), deccanAdmin),
        'Deccan’s Institute Admin sees the paused banner',
      ).toContain('institution-paused');
      expect(
        await bannersOf(proof.as('Rahul Verma'), 'Rahul'),
        'Another institution’s pause does not reach Godavari',
      ).not.toContain('institution-paused');
    },
  },
  // ---------------------------------------------------------------- Flow C (with E2-return, SUP-0213)
  {
    id: 'C1',
    title: 'Rahul opens the lab brief — "Opened", never progress',
    covers: ['flows.json C1'],
    actor: 'Student',
    screens: 'ST-05 → ST-06 → ST-07',
    evidence: 'B3-01 f0 · B4-10 (FA-21 "Opened")',
    walk: ['C1'],
    verify: async (proof) => {
      const written = proof.changedBy('LearningService.openResource');
      expect(
        written.every((ref) => ref.startsWith('RES:')),
        'C1: a resource is never progress or completion (T-13)',
      ).toBe(true);
      const resources = await must(proof.as('Rahul Verma').learning.listResources(SHELL), 'ST-06');
      expect(
        resources.filter((row) => row.openedAt !== null).map((row) => row.resource.id),
      ).toEqual(['res-shell-brief']);
      const detail = await must(
        proof.as('Dr S. Ranganathan').teaching.getStudentDetail({
          studentId: proof.personId('Rahul Verma'),
          experimentId: SHELL,
        }),
        'FA-21',
      );
      expect(
        detail.resources.filter((row) => row.openedAt !== null).length,
        'C1: Faculty sees "Opened 12 Oct 2026, 09:40"',
      ).toBe(1);
      expect(
        [...(await hubFormats(proof)).values()].every((entry) => entry.progress === 'not-started'),
      ).toBe(true);
    },
  },
  {
    id: 'C2-web-launch',
    title: 'Launch WEB stores nothing; the runtime reports WEB opened — In progress',
    covers: ['flows.json C2'],
    actor: 'Student · runtime (fixture)',
    screens: 'ST-07 → ST-08',
    evidence: 'B3-03 f1 → f0 · B3-12 f0',
    walk: ['C2-launch'],
    verify: async (proof) => {
      expect(
        proof.changedBy('LearningService.launchWebFormat'),
        'C2: the portal launch stores nothing (AD-16)',
      ).toEqual([]);
      const web = await formatPage(proof, 'web');
      expect(
        [web.progress.status, web.progress.feedback],
        'C2: WEB In progress — from runtime activity only; no feedback',
      ).toEqual(['in-progress', 'not-offered']);
      expect((await formatPage(proof, 'vr')).progress.status).toBe('not-started');
      const report = proof
        .committed()
        .find((entry) => entry.method === 'RuntimeReportPort.reportActivity')!;
      expect(report.actor, 'C2: activity is written by the runtime report only').toEqual({
        kind: 'system',
        system: 'system:runtime-report',
      });
      expect(
        'markComplete' in proof.as('Rahul Verma').learning ||
          'completeFormat' in proof.as('Rahul Verma').learning,
        'C2: no "I have finished" control (B3-03 f3)',
      ).toBe(false);
    },
  },
  {
    id: 'C2-web-saved',
    title: 'More WEB activity — still In progress: activity never marks Completed',
    covers: ['flows.json C2'],
    actor: 'Runtime (fixture)',
    screens: 'ST-08 · ST-15',
    evidence: 'B3-05 f1 · B3-01 f9',
    walk: ['C2-saved'],
    verify: async (proof) => {
      const web = await formatPage(proof, 'web');
      expect([web.progress.status, web.progress.completion]).toEqual(['in-progress', null]);
      expect(
        Object.keys(proof.world().records.completions).length,
        'C2: runtime activity writes no completion',
      ).toBe(0);
    },
  },
  {
    id: 'C2-web-completed',
    title: 'The simulation reports WEB complete — the system writes Completed for WEB only',
    covers: ['flows.json C2'],
    actor: 'System completion handler (fixture report)',
    screens: 'ST-08 · ST-10 · ST-15 · IA-20 · FA-20',
    evidence: 'B3-03 f3 · B3-01 f8 · B3-05 f0 · B3-12 f1',
    walk: ['C2-web-done'],
    verify: async (proof) => {
      const web = await formatPage(proof, 'web');
      expect(
        [web.progress.status, web.progress.completion?.reportedFrom, web.progress.feedback],
        'C2: "You’ve completed WEB" + "Give feedback on WEB"',
      ).toEqual(['completed', 'simulation', 'offered']);
      const vr = await formatPage(proof, 'vr');
      expect(
        [vr.progress.status, vr.progress.feedback],
        'C2: WEB never completes VR (per format, BC4)',
      ).toEqual(['not-started', 'not-offered']);
      const entry = proof
        .committed()
        .find((item) => item.method === 'RuntimeReportPort.reportCompletion')!;
      expect(entry.actor, 'C2: Completed is written by the system only (CompletionPolicy)').toEqual(
        { kind: 'system', system: 'system:runtime-report' },
      );
      expect(entry.changed.map((ref) => ref.kind).sort()).toEqual(['COMP']);
      // Others now see: the Institute Admin's usage and the Faculty's per-format words.
      const usage = await must(proof.as('Meera Iyer').operations.getUsage({}), 'IA-20');
      expect(
        JSON.stringify(usage).includes('"feedback'),
        'IA-20 has no feedback column (T-25)',
      ).toBe(false);
      const row = (
        await must(
          proof.as('Dr S. Ranganathan').teaching.listStudents({ experimentId: SHELL }),
          'FA-20',
        )
      )[0]!;
      expect(JSON.stringify(row)).toContain('completed');
    },
  },
  {
    id: 'C3-web',
    title: 'Rahul sends feedback on WEB — one record for WEB; VR offers nothing',
    covers: ['flows.json C3'],
    actor: 'Student',
    screens: 'ST-10 / ST-15 → ST-16 → ST-17',
    evidence: 'B3-06 f3 · B3-12 f2 · B3-01 f8',
    walk: ['C3-web'],
    verify: async (proof) => {
      expect(
        proof.changedBy('FeedbackService.sendFeedback').map((ref) => ref.split(':')[0]),
        'C3: only the feedback record',
      ).toEqual(['FB']);
      const student = proof.as('Rahul Verma');
      expect(
        (
          await must(
            student.feedback.getFeedbackState({ experimentId: SHELL, format: 'web' }),
            'ST-17',
          )
        ).state,
      ).toBe('sent');
      expect(
        (await must(student.feedback.getFeedbackState({ experimentId: SHELL, format: 'vr' }), 'VR'))
          .state,
        'C3: VR not started offers nothing',
      ).toBe('not-eligible');
      await proof.refused(
        'send WEB feedback twice',
        () =>
          student.feedback.sendFeedback({
            experimentId: SHELL,
            format: 'web',
            ratings: [5, 4, 4, 5, 4],
            comments: null,
          }),
        { kind: 'conflict', code: 'already-sent' },
      );
      await proof.refused(
        'feedback on VR before VR is Completed',
        () =>
          student.feedback.sendFeedback({
            experimentId: SHELL,
            format: 'vr',
            ratings: [5, 4, 4, 5, 4],
            comments: null,
          }),
        { kind: 'refused', code: 'format-not-completed' },
      );
      // Nobody else sees feedback: no staff read of it exists.
      const staffPorts = [
        proof.as('Meera Iyer'),
        proof.as('Dr S. Ranganathan'),
        proof.as('Arjun Mehta'),
      ];
      for (const ports of staffPorts)
        expect(
          'getFeedbackState' in ports.feedback &&
            (await ports.feedback.getFeedbackState({ experimentId: SHELL, format: 'web' })).ok,
        ).toBe(false);
    },
  },
  {
    id: 'E2-return',
    title: 'The Academic Reviewer returns SUB-0077 to the Vendor with a reason and a reference',
    covers: ['flows.json E2'],
    actor: 'Academic Reviewer',
    screens: 'RV-02 → RV-03',
    evidence: 'B6-03 · B5-06 f3 · B6-02 f1 "Returned to vendor · revision 1"',
    walk: ['E2-return'],
    verify: async (proof) => {
      const returned = proof.resultOf<Submission>('ProductionService.returnSubmission');
      expect([returned.status.state, (returned.status as { by?: string }).by]).toEqual([
        'returned',
        'academic-reviewer',
      ]);
      const record = await must(proof.as('Anil Shetty').production.getRecord(SUB_0077), 'VE-07');
      expect(
        (record.lastReturn as { reason?: string | null } | null)?.reason,
        'E2: the reason shows above the editor (B5-06 f3)',
      ).toBe('Please clarify the VR device requirements.');
      const decided = await must(proof.as('Prof. A. Menon').production.listReviewedByMe(), 'RV-05');
      expect(
        decided.some(
          (row) =>
            row.recordRef.id === 'SUB-0077' &&
            typeof row.nowState === 'object' &&
            row.nowState.state === 'returned',
        ),
        'E2: RV-05 lists it returned',
      ).toBe(true);
      await proof.refused(
        'the reviewer approves a returned record',
        () =>
          proof.as('Prof. A. Menon').production.approveSubmission({
            id: SUB_0077,
            outcomes: ['x'],
            expectedRev: returned.rev,
          }),
        { kind: 'invalid-state' },
      );
    },
  },
  {
    id: 'C2-vr-session',
    title: 'A VR session is reported from the headset — VR In progress, no launch button',
    covers: ['flows.json C2'],
    actor: 'Runtime (headset fixture)',
    screens: 'ST-09',
    evidence: 'B3-04 f0',
    walk: ['C2-vr-session'],
    verify: async (proof) => {
      const vr = await formatPage(proof, 'vr');
      expect([vr.progress.status, vr.progress.completion]).toEqual(['in-progress', null]);
      expect((await formatPage(proof, 'web')).progress.status, 'WEB stays Completed').toBe(
        'completed',
      );
    },
  },
  {
    id: 'SUP-0213',
    title: 'Rahul reports a problem from Help — SUP-0213, open',
    covers: ['cross-cutting support-report'],
    actor: 'Student',
    screens: 'XS-07',
    evidence: 'Board 07 · B7-09 f7',
    walk: ['SUP-0213'],
    verify: async (proof) => {
      const report = proof.resultOf<{ id: string; state: string }>(
        'OperationsService.reportProblem',
      );
      expect([report.id, report.state]).toEqual(['SUP-0213', 'open']);
      const mine = await must(proof.as('Rahul Verma').operations.listMyReports(), 'My reports');
      expect(mine.map((item) => item.id)).toContain('SUP-0213');
      await proof.refused(
        'the Faculty member reads Rahul’s report',
        () => proof.as('Dr S. Ranganathan').operations.getMyReport(unsafeBrand('SUP-0213')),
        { kind: 'not-permitted' },
      );
    },
  },
  {
    id: 'bg-k-iyer',
    title: 'Background — Dr K. Iyer registered as an Academic Reviewer with no scope',
    covers: ['cross-cutting role-holder'],
    actor: 'Super Admin',
    screens: 'SA-17',
    evidence: 'B7-08',
    walk: ['bg-k-iyer'],
    verify: async (proof) => {
      expect(
        proof
          .changedBy('PlatformRoleService.registerHolder')
          .every((ref) => ref.startsWith('ROLE:')),
      ).toBe(true);
      const queue = await must(
        proof.as('Dr K. Iyer').production.getReviewQueue({}),
        'RV-02 without scope',
      );
      expect(queue, 'A holder without scope sees no record').toEqual([]);
    },
  },
  {
    id: 'C2-vr-completed',
    title: 'The headset reports VR complete — Completed 20 Oct for VR',
    covers: ['flows.json C2'],
    actor: 'System completion handler (headset fixture)',
    screens: 'ST-09 · ST-10 · ST-15',
    evidence: 'B3-04 f2 · B3-12 f3 · B3-05 f2',
    walk: ['C2-vr-done'],
    verify: async (proof) => {
      const vr = await formatPage(proof, 'vr');
      expect([
        vr.progress.status,
        vr.progress.completion?.reportedFrom,
        vr.progress.feedback,
      ]).toEqual(['completed', 'headset', 'offered']);
      const web = await formatPage(proof, 'web');
      expect(
        web.progress.completion?.completedAt,
        'A second completion never moves the first one’s date',
      ).toBe(ist('2026-10-14 15:30'));
    },
  },
  {
    id: 'C3-vr',
    title: 'Rahul sends feedback on VR — a separate record',
    covers: ['flows.json C3'],
    actor: 'Student',
    screens: 'ST-16 → ST-17',
    evidence: 'B3-06 f4 · B3-01 f10',
    walk: ['C3-vr'],
    verify: async (proof) => {
      const feedback = Object.values(proof.world().records.feedback);
      expect(feedback.map((row) => row.format).sort(), 'Two records, one per format').toEqual([
        'vr',
        'web',
      ]);
    },
  },
  // ---------------------------------------------------------------- Flow F (start), D prep, E2 rest
  {
    id: 'F1',
    title:
      'The Content Manager opens UPD-0005, saves it and sends it for academic review — 1.2 stays live',
    covers: ['flows.json F1'],
    actor: 'Content Manager',
    screens: 'CM-05 → CM-06/07 → CM-08',
    evidence: 'B6-08 f1 · B6-09 f3 · B6-04 f0 · B6-13',
    walk: ['F1-open', 'F1-save', 'F1-send'],
    verify: async (proof) => {
      const opened = proof.resultOf<{ update: { id: string }; joined: boolean }>(
        'CorrectionService.openCorrection',
      );
      expect([opened.update.id, opened.joined]).toEqual(['UPD-0005', false]);
      const sent = proof.resultOf<{ state: string; rev: number }>(
        'CorrectionService.sendForAcademicReview',
      );
      expect(sent.state).toBe('in-academic-review');
      const cm = proof.as('Kavya Nair');
      const page = await must(cm.corrections.getPublishedExperiment(DISTILLATION), 'CM-05');
      expect(
        [page.experiment.live.label, page.openUpdate?.id],
        'F1: live 1.2 unchanged; "An update is in progress"',
      ).toEqual(['1.2', 'UPD-0005']);
      const review = await must(
        proof.as('Prof. A. Menon').corrections.getUpdateForReview(unsafeBrand('UPD-0005')),
        'RV-04',
      );
      expect(review.update.state).toBe('in-academic-review');
      expect(
        (await proof.as('Arjun Mehta').corrections.getUpdateDecision(unsafeBrand('UPD-0005'))).ok,
        'F1: the Super Admin never sees an update before approval (B7-10 f4)',
      ).toBe(false);
      await proof.refused(
        'open a second update',
        () =>
          cm.corrections.openCorrection({
            experimentId: DISTILLATION,
            entry: 'start-a-correction',
          }),
        { kind: 'refused', code: 'update-already-open' },
      );
      await proof.refused(
        'release before approval',
        () =>
          proof
            .as('Arjun Mehta')
            .corrections.releaseUpdate({ id: unsafeBrand('UPD-0005'), expectedRev: sent.rev }),
        { kind: 'invalid-state' },
      );
    },
  },
  {
    id: 'D-prep-bank',
    title: 'Faculty question bank Q-0101 … Q-0105 (D preparation)',
    covers: ['cross-cutting question-bank'],
    actor: 'Faculty',
    screens: 'FA-13 / FA-14',
    evidence: 'B4-07',
    walk: ['D0-Q-0101', 'D0-Q-0102', 'D0-Q-0103', 'D0-Q-0104', 'D0-Q-0105'],
    verify: async (proof) => {
      const bank = await must(
        proof.as('Dr S. Ranganathan').questionBank.listQuestions({ experimentId: SHELL }),
        'FA-13',
      );
      expect(bank.map((row) => row.question.id)).toEqual([
        'Q-0101',
        'Q-0102',
        'Q-0103',
        'Q-0104',
        'Q-0105',
      ]);
      expect(
        (await must(proof.as('Rahul Verma').assessments.listMyAssessments(), 'ST-11')).length,
        'Nothing reaches the Student before an assessment exists (B4-11 f5)',
      ).toBe(0);
    },
  },
  {
    id: 'E2-resubmit',
    title:
      'The Vendor revises and resubmits SUB-0077 (revision 2); the M-3 seam routes it back to the reviewer',
    covers: ['flows.json E2', 'interim M-3'],
    interim: 'M-3 / OD-B5-05 — resubmission routed by the test-only workflow seam',
    actor: 'Vendor · workflow seam',
    screens: 'VE-07 → VE-08 → RV-02',
    evidence: 'B5-07 f4 · B5-06 f4 · B6-03 f0 · B6-12 f1',
    walk: ['E2-revise', 'E2-resubmit', 'E2-route'],
    verify: async (proof) => {
      const revised = proof.resultOf<Submission>('ProductionService.saveRevision');
      expect(revised.status.state, 'E2: changes saved, not resubmitted yet').toBe('returned');
      const resubmitted = proof.resultOf<Submission>('ProductionService.resubmit');
      expect(
        [resubmitted.revision, resubmitted.status.state],
        'E2: "Submitted" — no gate promised (M-3)',
      ).toEqual([2, 'resubmitted']);
      const routed = proof.committed().find((entry) => entry.method === 'seam.routeResubmission');
      expect(routed?.origin, 'M-3 interim: routed by the test-only seam').toBe('test-seam');
      const review = await must(
        proof.as('Prof. A. Menon').production.getSubmissionForReview(SUB_0077),
        'RV-03',
      );
      expect(
        [review.submission.status.state, review.submission.revision, review.whatChanged.length > 0],
        'E2: RV-03 "Resubmitted · revision 2" with what changed first',
      ).toEqual(['with-academic-reviewer', 2, true]);
    },
  },
  {
    id: 'IA-17',
    title:
      'The Institute Admin asks for 60 more licences — REQ-0058; nothing changes until activation',
    covers: ['cross-cutting more-licences'],
    actor: 'Institute Admin',
    screens: 'IA-17 · SA-02',
    evidence: 'B3-08 · B7-03 f0',
    walk: ['IA-17'],
    verify: async (proof) => {
      const sent = proof.resultOf<{ reference: string }>(
        'AccessRequestService.submitAdditionalLicencesRequest',
      );
      expect(sent.reference).toBe('REQ-0058');
      const rows = await must(
        proof.as('Meera Iyer').accessRequests.listInstitutionRequests(),
        'IA-17',
      );
      expect(rows.some((row) => row.id === 'REQ-0058' && row.status === 'under-review')).toBe(true);
      const admin = await must(
        proof.as('Arjun Mehta').accessRequests.listRequests({ sort: 'received-newest' }),
        'SA-02',
      );
      expect(admin.find((row) => row.id === 'REQ-0058')?.status).toBe('under-review');
      const plan = await must(
        proof.as('Meera Iyer').institutions.getAccessPlan(unsafeBrand('ACC-0107')),
        'IA-03',
      );
      expect(plan.plan.licences, 'Nothing changes until activation (BR-043)').toBe(120);
    },
  },
  // ---------------------------------------------------------------- Device, F2, E3, E4, E5, F3, F4
  {
    id: 'Dv1',
    title: 'Rahul requests a device transfer — DTR-0018 with his Institute Admin',
    covers: ['flows.json Device 1'],
    actor: 'Student',
    screens: 'XS-05 "My device" → ST-18',
    evidence: 'B3-07 f4 · B3-09 f0 · B3-12 f8',
    walk: ['Dv1'],
    verify: async (proof) => {
      const view = proof.resultOf<{
        transfer: { id: string; state: string; rev: number };
        forwardingBlocked: string | null;
      }>('OperationsService.requestDeviceTransfer');
      expect([view.transfer.id, view.transfer.state, view.forwardingBlocked]).toEqual([
        'DTR-0018',
        'with-institute-admin',
        null,
      ]);
      const requests = await must(
        proof.as('Meera Iyer').operations.listDeviceRequests({}),
        'IA-18',
      );
      expect(requests.map((entry) => [entry.id, entry.state])).toEqual([
        ['DTR-0018', 'with-institute-admin'],
      ]);
      await proof.refused(
        'the Super Admin approves before it is forwarded',
        () =>
          proof.as('Arjun Mehta').operations.approveDeviceTransfer({
            id: unsafeBrand('DTR-0018'),
            expectedRev: view.transfer.rev,
          }),
        { kind: 'refused', code: 'not-yet-forwarded' },
      );
      await proof.refused(
        'a second open request',
        () =>
          proof
            .as('Rahul Verma')
            .operations.requestDeviceTransfer({ newDevice: 'Another headset', note: null }),
        { kind: 'refused', code: 'transfer-already-open' },
      );
      expect(
        proof
          .changedBy('OperationsService.requestDeviceTransfer')
          .every((ref) => ref.startsWith('DTR:')),
        'Authorisation only — nothing shipped (BR-073)',
      ).toBe(true);
    },
  },
  {
    id: 'D-prep-Q-0106',
    title: 'Faculty adds the written question Q-0106 (D preparation)',
    covers: ['cross-cutting question-bank'],
    actor: 'Faculty',
    screens: 'FA-14',
    evidence: 'B4-07',
    walk: ['D0-Q-0106'],
    verify: async (proof) => {
      const added = proof.resultOf<{ id: string }>('QuestionBankService.addQuestion');
      expect(added.id).toBe('Q-0106');
    },
  },
  {
    id: 'F2',
    title: 'The Academic Reviewer approves UPD-0005 — awaiting the Super Admin; 1.2 still live',
    covers: ['flows.json F2'],
    actor: 'Academic Reviewer',
    screens: 'RV-02 → RV-04',
    evidence: 'B6-04 f4 · B6-09 f5 · B7-05 f0 · B7-11 f3',
    walk: ['F2-approve'],
    verify: async (proof) => {
      expect(proof.resultOf<{ state: string }>('CorrectionService.approveUpdate').state).toBe(
        'awaiting-release-decision',
      );
      const decision = await must(
        proof.as('Arjun Mehta').corrections.getUpdateDecision(unsafeBrand('UPD-0005')),
        'SA-11',
      );
      expect(decision.update.state, 'F2: SA-10 "Waiting for your decision"').toBe(
        'awaiting-release-decision',
      );
      const cm = await must(
        proof.as('Kavya Nair').corrections.getUpdate(unsafeBrand('UPD-0005')),
        'CM-08',
      );
      expect(cm.update.state, 'F2: CM-08 "Awaiting release decision"').toBe(
        'awaiting-release-decision',
      );
      expect(
        (
          await must(
            proof.as('Kavya Nair').corrections.getPublishedExperiment(DISTILLATION),
            'CM-05',
          )
        ).experiment.live.label,
        'Approving does not change what is live (BR-112)',
      ).toBe('1.2');
    },
  },
  {
    id: 'E3',
    title:
      'The Academic Reviewer approves SUB-0077 with three learning outcomes — with the Content Manager',
    covers: ['flows.json E3'],
    actor: 'Academic Reviewer',
    screens: 'RV-03 (Approve)',
    evidence: 'B6-03 · B6-06 f0 · B6-12 f2 · B5-06 f5',
    walk: ['E3-approve'],
    verify: async (proof) => {
      const approved = proof.resultOf<Submission>('ProductionService.approveSubmission');
      expect(approved.status.state).toBe('with-content-manager');
      const ready = await must(proof.as('Kavya Nair').production.listReadyToPublish(), 'CM-02');
      expect(
        ready.some((row) => row.submission.id === SUB_0077),
        'E3: CM-02 "Ready to publish"',
      ).toBe(true);
      const vendor = await must(proof.as('Anil Shetty').production.getRecord(SUB_0077), 'VE-07');
      expect(vendor.submission.status.state, 'E3: Vendor "With Content Manager"').toBe(
        'with-content-manager',
      );
      expect(
        (await catalogueNamed(proof.stranger(), 'Composite Wall')).map((entry) => entry.name),
        'Approving does not publish it',
      ).toEqual([COMPOSITE_WALL]);
    },
  },
  {
    id: 'Dv2',
    title: 'The Institute Admin forwards DTR-0018 to BITS',
    covers: ['flows.json Device 2'],
    actor: 'Institute Admin',
    screens: 'IA-18 → IA-19',
    evidence: 'B3-09 f2 · B3-07 f5 · B3-11 f0',
    walk: ['Dv2'],
    verify: async (proof) => {
      const forwarded = proof.resultOf<{ state: string; rev: number }>(
        'OperationsService.forwardDeviceTransfer',
      );
      expect(forwarded.state).toBe('forwarded');
      const mine = await must(proof.as('Rahul Verma').operations.getMyDevice(), 'ST-18');
      expect(mine.openTransfer?.transfer.state, 'Dv2: Student "Forwarded to BITS"').toBe(
        'forwarded',
      );
      const transfers = await must(
        proof.as('Arjun Mehta').operations.listDeviceTransfers({}),
        'SA-18',
      );
      expect(
        transfers.find((entry) => entry.id === 'DTR-0018')?.state,
        'Dv2: SA-18 "Forwarded"',
      ).toBe('forwarded');
      await proof.refused(
        'the Institute Admin approves',
        () =>
          proof.as('Meera Iyer').operations.approveDeviceTransfer({
            id: unsafeBrand('DTR-0018'),
            expectedRev: forwarded.rev,
          }),
        { kind: 'not-permitted' },
      );
    },
  },
  {
    id: 'E4',
    title: 'The Content Manager publishes SUB-0077 — publishing gives no one access',
    covers: ['flows.json E4'],
    actor: 'Content Manager',
    screens: 'CM-02 → CM-03 (Publish)',
    evidence: 'B6-07 f4 · B6-11 f6/f8 · B7-06 f3 · B5-06 f8',
    walk: ['E4-publish'],
    verify: async (proof) => {
      const outcome = proof.resultOf<{ submission: Submission; experiment: { id: string } }>(
        'ProductionService.publish',
      );
      expect(outcome.submission.status.state).toBe('published');
      expect(
        proof
          .changedBy('ProductionService.publish')
          .map((ref) => ref.split(':')[0])
          .sort(),
        'E4: the submission and the new experiment only — no ACC, SACC or FMAP (BC9)',
      ).toEqual(['EXP', 'SUB']);
      const content = await must(proof.as('Meera Iyer').institutions.listContentAccess(), 'IA-02');
      const inPlan = content.flatMap((row) => row.items).map((item) => item.experimentId);
      expect(
        inPlan.includes(outcome.experiment.id as never),
        'E4: not in Godavari’s plan — "Not in your access plan"',
      ).toBe(false);
      await proof.refused(
        'Rahul opens the newly published experiment',
        () =>
          proof
            .as('Rahul Verma')
            .studentAccess.getExperimentHub(unsafeBrand(outcome.experiment.id)),
        { kind: 'refused' },
      );
      const vendor = await must(proof.as('Anil Shetty').production.getRecord(SUB_0077), 'VE-07');
      expect(vendor.submission.status.state, 'E4: Vendor "Published", read-only').toBe('published');
      await proof.refused(
        'publish twice',
        () =>
          proof
            .as('Kavya Nair')
            .production.publish({ id: SUB_0077, expectedRev: outcome.submission.rev }),
        { kind: 'invalid-state' },
      );
      await proof.refused(
        'the Super Admin overrides a published record',
        () =>
          proof.as('Arjun Mehta').production.overrideStatus({
            id: SUB_0077,
            reason: 'Trying a published record.',
            expectedRev: outcome.submission.rev,
          }),
        { kind: 'invalid-state' },
      );
    },
  },
  {
    id: 'E5',
    title:
      'The public catalogue lists "Conduction Through a Composite Wall" — beside, never merged with, "Composite Wall Conduction"',
    covers: ['flows.json E5'],
    actor: 'Public',
    screens: 'PU-05 / PU-06',
    evidence: 'B6-12 f5/f6 · B7-06 f3 · OD-B5-09',
    at: '2026-10-23 10:10',
    verify: async (proof) => {
      const listed = await catalogueNamed(proof.stranger(), 'Composite Wall');
      expect(listed.map((entry) => entry.name).sort()).toEqual(
        [COMPOSITE_WALL, COMPOSITE_WALL_NEW].sort(),
      );
      expect(
        new Set(listed.map((entry) => entry.experimentId)).size,
        'Two records, two ids (BC11)',
      ).toBe(2);
      const created = listed.find((entry) => entry.name === COMPOSITE_WALL_NEW)!;
      const page = await must(
        proof.stranger().catalogue.getExperiment(created.experimentId),
        'PU-06',
      );
      expect(
        [...page.availableIn].sort(),
        'Listed with the formats that passed governance',
      ).toEqual(['vr', 'web']);
    },
  },
  {
    id: 'F3-hold',
    title: 'The Super Admin holds UPD-0005 — 1.2 stays live; no Release while held',
    covers: ['flows.json F3', 'alternate Hold'],
    actor: 'Super Admin',
    screens: 'SA-10 → SA-11 (Hold)',
    evidence: 'B7-05 f5 · B6-09 f6 · B7-11',
    walk: ['F3-hold'],
    verify: async (proof) => {
      const held = proof.resultOf<{ state: string; rev: number }>('CorrectionService.holdUpdate');
      expect(held.state).toBe('on-hold');
      const cm = await must(
        proof.as('Kavya Nair').corrections.getUpdate(unsafeBrand('UPD-0005')),
        'CM-08',
      );
      expect(cm.update.state, 'CM-08 "On hold" with the reason').toBe('on-hold');
      expect(
        (
          await must(
            proof.as('Kavya Nair').corrections.getPublishedExperiment(DISTILLATION),
            'CM-05',
          )
        ).experiment.live.label,
      ).toBe('1.2');
      await proof.refused(
        'release while held',
        () =>
          proof
            .as('Arjun Mehta')
            .corrections.releaseUpdate({ id: unsafeBrand('UPD-0005'), expectedRev: held.rev }),
        { kind: 'refused', code: 'hold-must-be-lifted' },
      );
    },
  },
  {
    id: 'F3-lift',
    title: 'The Super Admin lifts the hold — waiting again; nothing goes live',
    covers: ['flows.json F3', 'alternate Lift hold'],
    actor: 'Super Admin',
    screens: 'SA-11 (Lift hold)',
    evidence: 'B7-05 f7',
    walk: ['F3-lift'],
    verify: async (proof) => {
      expect(proof.resultOf<{ state: string }>('CorrectionService.liftHold').state).toBe(
        'awaiting-release-decision',
      );
      expect(
        (
          await must(
            proof.as('Kavya Nair').corrections.getPublishedExperiment(DISTILLATION),
            'CM-05',
          )
        ).experiment.live.label,
        'Lifting never makes anything live',
      ).toBe('1.2');
    },
  },
  {
    id: 'F3-release',
    title:
      'The Super Admin releases UPD-0005 — 1.3 live everywhere; never "Publish"; no access changes',
    covers: ['flows.json F3'],
    actor: 'Super Admin',
    screens: 'SA-11 (Release update)',
    evidence: 'B7-05 f6 · B6-09 f7 · B7-11 f4',
    walk: ['F4-release'],
    verify: async (proof) => {
      const outcome = proof.resultOf<{
        update: { state: string };
        experiment: { live: { label: string } };
      }>('CorrectionService.releaseUpdate');
      expect([outcome.update.state, outcome.experiment.live.label]).toEqual(['released', '1.3']);
      expect(
        proof
          .changedBy('CorrectionService.releaseUpdate')
          .map((ref) => ref.split(':')[0])
          .sort(),
        'Release writes the update and the experiment only (BC9)',
      ).toEqual(['EXP', 'UPD']);
      expect('publishUpdate' in proof.as('Arjun Mehta').corrections, 'Never "Publish" (BC8)').toBe(
        false,
      );
    },
  },
  {
    id: 'F4',
    title: 'Live 1.3 for the Content Manager and the public; history keeps every version',
    covers: ['flows.json F4'],
    actor: 'Content Manager · public',
    screens: 'CM-05 / CM-08 · PU-06',
    evidence: 'B7-11 f4 · f7',
    at: '2026-10-24 10:00',
    verify: async (proof) => {
      const page = await must(
        proof.as('Kavya Nair').corrections.getPublishedExperiment(DISTILLATION),
        'CM-05',
      );
      expect([page.experiment.live.label, page.openUpdate]).toEqual(['1.3', null]);
      expect(
        page.experiment.versions.map((version) => version.label),
        'History keeps every version (BR-113)',
      ).toEqual(expect.arrayContaining(['1.0', '1.1', '1.2', '1.3']));
      const listed = (await catalogueNamed(proof.stranger(), 'Distillation Column'))[0]!;
      const publicPage = await must(
        proof.stranger().catalogue.getExperiment(listed.experimentId),
        'PU-06',
      );
      expect(JSON.stringify(publicPage)).toContain('reflux ratio raises the overhead purity');
    },
  },
  {
    id: 'Dv3',
    title: 'The Super Admin approves DTR-0018 — the authorised VR device changes; approve only',
    covers: ['flows.json Device 3'],
    actor: 'Super Admin',
    screens: 'SA-18 → SA-19',
    evidence: 'B3-11 f5 · B3-07 f6 · B3-09 f3',
    walk: ['Dv3'],
    verify: async (proof) => {
      const approved = proof.resultOf<{
        transfer: { state: string; rev: number };
        device: { description: string };
      }>('OperationsService.approveDeviceTransfer');
      expect([approved.transfer.state, approved.device.description]).toEqual([
        'approved',
        'ME lab VR headset, asset tag GIT-VR-07',
      ]);
      const mine = await must(proof.as('Rahul Verma').operations.getMyDevice(), 'ST-18');
      expect(mine.devices.find((device) => device.format === 'vr')?.description).toBe(
        'ME lab VR headset, asset tag GIT-VR-07',
      );
      const ia = await must(
        proof.as('Meera Iyer').operations.getDeviceRequest(unsafeBrand('DTR-0018')),
        'IA-19',
      );
      expect(ia.state, 'IA-19 "Decided · approved by BITS"').toBe('approved');
      await proof.refused(
        'approve twice',
        () =>
          proof.as('Arjun Mehta').operations.approveDeviceTransfer({
            id: unsafeBrand('DTR-0018'),
            expectedRev: approved.transfer.rev,
          }),
        { kind: 'invalid-state' },
      );
      expect(
        'declineDeviceTransfer' in proof.as('Arjun Mehta').operations,
        'No Decline (T-32)',
      ).toBe(false);
    },
  },
  // ---------------------------------------------------------------- Flow D
  {
    id: 'D1',
    title: 'Dr S. Ranganathan creates ASMT-0009 with its own rules — Ready; Rahul sees it To do',
    covers: ['flows.json D1'],
    actor: 'Faculty',
    screens: 'FA-06 → FA-07 → FA-08 … FA-12',
    evidence: 'B4-14 f0 · B4-06 f0 · B4-11 f0 · f7 · f10 · f11',
    walk: ['D1'],
    verify: async (proof) => {
      const created = proof.resultOf<{
        id: string;
        rules: { passMarkPercent: number | null; attemptsAllowed: number | null };
      }>('AssessmentService.createAssessment');
      expect(
        [created.id, created.rules.passMarkPercent, created.rules.attemptsAllowed],
        'D1: the rules are this assessment’s own (BC6)',
      ).toEqual(['ASMT-0009', 50, 2]);
      const view = await must(
        proof.as('Dr S. Ranganathan').assessments.getAssessment(unsafeBrand('ASMT-0009')),
        'FA-08',
      );
      expect(view.readiness).toBe('ready');
      const mine = await must(proof.as('Rahul Verma').assessments.listMyAssessments(), 'ST-11');
      expect(
        mine.map((row) => [row.assessment.id, row.result.kind]),
        'D1: ST-11 "To do"',
      ).toEqual([['ASMT-0009', 'to-do']]);
      const hub = await must(
        proof.as('Rahul Verma').studentAccess.getExperimentHub(SHELL),
        'ST-05',
      );
      expect(hub.assessment, 'D1: the hub’s Assessment tab').toMatchObject({
        id: 'ASMT-0009',
        result: { kind: 'to-do' },
      });
      expect(created.rules).not.toHaveProperty('default');
    },
  },
  {
    id: 'D2',
    title:
      'Rahul starts ATT-0450, answers and submits — waiting for marking, no figure of any kind',
    covers: ['flows.json D2'],
    actor: 'Student',
    screens: 'ST-11 → ST-12 → ST-13',
    evidence: 'B4-12 f4 · B4-11 f2 · B4-13 f1 · B4-06 f7 · B4-09 f0',
    walk: ['D2', 'D2-submit'],
    verify: async (proof) => {
      const attempt = proof.resultOf<{ id: string; state: string; rev: number }>(
        'AssessmentService.submitAttempt',
      );
      expect([attempt.id, attempt.state]).toEqual(['ATT-0450', 'submitted']);
      const result = await must(
        proof.as('Rahul Verma').assessments.getResult(unsafeBrand('ATT-0450')),
        'ST-14',
      );
      expect(
        [result.result.kind, result.review],
        'D2: "Submitted — waiting for marking", no score',
      ).toEqual(['waiting-for-marking', null]);
      const queue = await must(
        proof.as('Dr S. Ranganathan').marking.listQueue({ state: 'waiting' }),
        'FA-18',
      );
      expect(
        queue.map((row) => row.attempt.id),
        'D2: FA-18 "1 written answer to mark"',
      ).toEqual(['ATT-0450']);
      const submissions = await must(
        proof.as('Dr S. Ranganathan').assessments.listSubmissions(unsafeBrand('ASMT-0009')),
        'FA-12',
      );
      expect(submissions.map((row) => [row.attempt.id, row.score, row.releasedAt])).toEqual([
        ['ATT-0450', null, null],
      ]);
      await proof.refused(
        'submit twice',
        () =>
          proof.as('Rahul Verma').assessments.submitAttempt({
            attemptId: unsafeBrand('ATT-0450'),
            expectedRev: attempt.rev,
          }),
        { kind: 'invalid-state' },
      );
    },
  },
  {
    id: 'D3',
    title:
      'Objective marks supplied by the fixture, the written answer marked and the marks confirmed — result not released yet',
    covers: ['flows.json D3', 'interim DV-2'],
    interim: 'DV-2 / AD-38 — objective marks supplied by the fixture seam; no answer-key grading',
    actor: 'Faculty · objective-marks seam',
    screens: 'FA-01 → FA-18 → FA-19',
    evidence: 'B4-09 f2 · B4-11 f3 · B4-13 f2 · B4-06 f8',
    walk: ['D3-objective', 'D3-mark', 'D3-confirm'],
    verify: async (proof) => {
      const supplied = proof
        .committed()
        .find((entry) => entry.method === 'seam.supplyObjectiveMarks');
      expect(
        [supplied?.origin, supplied?.actor],
        'DV-2 interim: the marks come from the test-only seam, as the system',
      ).toEqual(['test-seam', { kind: 'system', system: 'system:objective-marks' }]);
      const confirmed = proof.resultOf<{ marking: { confirmed: unknown }; rev: number }>(
        'MarkingService.confirmMarks',
      );
      expect(confirmed.marking.confirmed, 'D3: Marks confirmed (B4-09 f2)').not.toBeNull();
      const result = await must(
        proof.as('Rahul Verma').assessments.getResult(unsafeBrand('ATT-0450')),
        'ST-14',
      );
      expect(
        [result.result.kind, result.review],
        'D3: "Result not released yet" — no figure',
      ).toEqual(['not-released-yet', null]);
      await proof.refused(
        'change a confirmed mark',
        () =>
          proof.as('Dr S. Ranganathan').marking.saveMark({
            attemptId: unsafeBrand('ATT-0450'),
            questionId: unsafeBrand('Q-0106'),
            mark: '1',
            feedback: null,
            expectedRev: confirmed.rev,
          }),
        { kind: 'refused', code: 'marks-confirmed' },
      );
      expect(
        'releaseResult' in proof.as('Dr S. Ranganathan').marking ||
          'releaseResult' in proof.as('Dr S. Ranganathan').assessments,
        'D4 handoff defect: no Faculty release control (B4-06, B4-14)',
      ).toBe(false);
    },
  },
  {
    id: 'D4',
    title: 'After the deadline the assessment’s own setting releases the result — "You passed"',
    covers: ['flows.json D4'],
    actor: 'System (the assessment’s release setting) → Student',
    screens: 'ST-14 · ST-11 Results · FA-12',
    evidence: 'B4-13 f0 · B4-11 f4 · B4-06 f9 · B4-14',
    walk: ['D5'],
    verify: async (proof) => {
      const result = await must(
        proof.as('Rahul Verma').assessments.getResult(unsafeBrand('ATT-0450')),
        'ST-14',
      );
      expect(result.result.kind, 'D4: released by the setting').toBe('released');
      expect(
        (result.result as AttemptResult & { passed?: boolean }).passed,
        'D4: "You passed" (B4-13 f0)',
      ).toBe(true);
      expect(
        proof.committed(),
        'D4: release is derived from the setting — no command, no write',
      ).toEqual([]);
      const submissions = await must(
        proof.as('Dr S. Ranganathan').assessments.listSubmissions(unsafeBrand('ASMT-0009')),
        'FA-12',
      );
      expect(submissions[0]!.releasedAt, 'D4: FA-12 "Released …"').not.toBeNull();
    },
  },
];
