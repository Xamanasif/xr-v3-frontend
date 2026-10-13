/**
 * After the spine, on the SAME world: the cross-cutting commands whose effects cross roles
 * (Appendix D §4.9) and the drawn alternates (Appendix D §4.2–§4.7: A "Request more information",
 * B5 withdraw, E-alt1…3, F2b return and F-alt withdraw). Hold and Lift hold run inside the spine
 * (F3). They come last so that no alternate takes a board reference the walk reserves, and each
 * uses the record its board draws where the seed holds it: SUB-0074 "Transient Cooling" for the
 * Content Manager's send-backs (B5-06 f5–f7), SUB-0085 for the stuck override (B7-06 f1/f5),
 * UPD-0006 for the returned and withdrawn update (B6-09 f2/f8), SACC-0310 for the withdrawal
 * (B2-04 f7, B2-13 f0–f3). Unresolved overlaps (DV-1) never enter this world.
 */
import type { AccessRequest, CorrectionUpdate, Submission } from '@xr/domain';
import { unsafeBrand } from '@xr/domain';

import { snapshotOf } from '../../world/records.js';
import { expect, type ProofContext, type ProofStep } from './harness.js';
import { bannersOf, DISTILLATION, formatPage, must, recordOf, SHELL } from './reads.js';

const SUB_0074 = unsafeBrand<Submission['id']>('SUB-0074');
const SUB_0077 = unsafeBrand<Submission['id']>('SUB-0077');
const UPD_0006 = unsafeBrand<CorrectionUpdate['id']>('UPD-0006');
const GODAVARI = unsafeBrand<AccessRequest['institutionId'] & string>('godavari');

/** Every Student's per-format progress the world holds (work is kept: invariant 4, explicitly). */
function progressOf(proof: ProofContext): string {
  const { activities, completions } = proof.world().records;
  return JSON.stringify([activities, completions]);
}

async function institutionRev(proof: ProofContext): Promise<number> {
  return (await must(proof.as('Arjun Mehta').institutions.getInstitution(GODAVARI), 'SA-07'))
    .institution.rev;
}

export const TAIL: readonly ProofStep[] = [
  {
    id: 'X-support',
    title:
      'The Super Admin resolves SUP-0213 with a note; Rahul reads Resolved and the note; no reporter Reopen',
    covers: ['cross-cutting support-resolve'],
    actor: 'Super Admin → Student',
    screens: 'SA-21 · XS-07 report detail',
    evidence: 'B7-09 f9 · f11 · board 07 · P0-30 · SUP-04',
    at: '2026-11-16 09:00',
    run: async (proof) => {
      const admin = proof.as('Arjun Mehta');
      const report = await must(
        proof.as('Rahul Verma').operations.getMyReport(unsafeBrand('SUP-0213')),
        'Rahul reads SUP-0213',
      );
      await proof.refused(
        'resolve without a note',
        () => admin.operations.resolveReport({ id: report.id, note: ' ', expectedRev: report.rev }),
        { kind: 'validation-failed' },
      );
      await must(
        admin.operations.resolveReport({
          id: report.id,
          note: 'Fixed — please try again.',
          expectedRev: report.rev,
        }),
        'SA-21 resolve',
      );
    },
    verify: async (proof) => {
      expect(proof.changedBy('OperationsService.resolveReport')).toEqual(['SUP:SUP-0213']);
      const read = await must(
        proof.as('Rahul Verma').operations.getMyReport(unsafeBrand('SUP-0213')),
        'XS-07 detail',
      );
      expect(
        [read.state, read.resolutions.at(-1)?.note],
        'The reporter reads Resolved and the note first',
      ).toEqual(['resolved', 'Fixed — please try again.']);
      await proof.refused(
        'the reporter reopens',
        () =>
          proof.as('Rahul Verma').operations.reopenReport({ id: read.id, expectedRev: read.rev }),
        { kind: 'not-permitted' },
      );
      await proof.refused(
        'the Institute Admin reads the Student’s report',
        () => proof.as('Meera Iyer').operations.getMyReport(unsafeBrand('SUP-0213')),
        { kind: 'policy-open', decision: 'SUP-07' },
      );
    },
  },
  {
    id: 'X-pause-restore',
    title:
      'Godavari paused then restored: every institution role sees the banner, writes are refused, work is kept',
    covers: ['cross-cutting pause-restore'],
    actor: 'Super Admin → Institute Admin · Faculty · Student',
    screens: 'SA-07 · XS-08 · IA-05 · ST-08 · SA-03',
    evidence: 'B7-04 f0–f3 · B7-03 f2 · B2-05 f15 · B3-03 f5 · B1-11 f14',
    at: '2026-11-16 10:00',
    run: async (proof) => {
      const admin = proof.as('Arjun Mehta');
      const before = progressOf(proof);
      const catalogue = JSON.stringify(
        await must(
          proof.stranger().catalogue.searchCatalogue({ text: '', sort: 'default' }),
          'PU-04',
        ),
      );
      await must(
        admin.institutions.pauseInstitution({
          institutionId: GODAVARI,
          reason: 'The institution asked us to pause access while it checks its student list.',
          expectedRev: await institutionRev(proof),
        }),
        'pause Godavari',
      );
      for (const name of ['Meera Iyer', 'Dr S. Ranganathan', 'Rahul Verma']) {
        expect(await bannersOf(proof.as(name), name), `${name} sees the paused banner`).toContain(
          'institution-paused',
        );
      }
      const plan = await must(
        proof.as('Meera Iyer').institutions.getAccessPlan(unsafeBrand('ACC-0107')),
        'IA-03',
      );
      await proof.refused(
        'the Institute Admin gives access while paused',
        () =>
          proof.as('Meera Iyer').studentAccess.giveAccess({
            experimentIds: [SHELL],
            target: { kind: 'student', studentId: proof.personId('Priya Natarajan') },
            expectedPlanRev: plan.plan.rev,
          }),
        { kind: 'refused', code: 'institution-paused' },
      );
      await proof.refused(
        'Rahul launches WEB while paused',
        () => proof.as('Rahul Verma').learning.launchWebFormat({ experimentId: SHELL }),
        { kind: 'refused', code: 'institution-paused' },
      );
      const page = await must(
        admin.accessRequests.getRequestForDecision(unsafeBrand('REQ-0058')),
        'SA-03 REQ-0058',
      );
      expect(
        page.existingAccess?.paused,
        'SA-03: that institution’s requests can’t be decided (B1-11 f14)',
      ).toBe(true);
      await proof.refused(
        'the Super Admin decides a paused institution’s request',
        () =>
          admin.accessRequests.approveRequest({
            id: unsafeBrand('REQ-0058'),
            route: null,
            expectedRev: page.request.rev,
          }),
        { kind: 'refused' },
      );
      const versionBefore = proof.world().worldVersion;
      const ingest = proof.standins.runtimeReport.reportActivity({
        studentId: proof.personId('Rahul Verma'),
        experimentId: SHELL,
        format: 'web',
        kind: 'session',
        at: proof.standins.clock.now(),
      });
      expect(
        [ingest.ok, proof.world().worldVersion],
        'Runtime ingest is refused while paused, writing nothing',
      ).toEqual([false, versionBefore]);
      expect(progressOf(proof), 'Work is kept while paused (invariant 4)').toBe(before);
      expect(
        JSON.stringify(
          await must(
            proof.stranger().catalogue.searchCatalogue({ text: '', sort: 'default' }),
            'PU-04',
          ),
        ),
        'A pause never touches the public catalogue (invariant 6)',
      ).toBe(catalogue);
      await must(
        admin.institutions.restoreInstitution({
          institutionId: GODAVARI,
          reason: 'The student list is checked.',
          expectedRev: await institutionRev(proof),
        }),
        'restore Godavari',
      );
    },
    verify: async (proof) => {
      expect(proof.committed().map((entry) => entry.method)).toEqual([
        'InstitutionService.pauseInstitution',
        'InstitutionService.restoreInstitution',
      ]);
      expect(
        proof
          .committed()
          .map((entry) => entry.changed.map((ref) => `${ref.kind}:${ref.id}`).sort()),
        'Pause and Restore write the institution and its plan only — no grant, person, activity or completion',
      ).toEqual([
        ['ACC:ACC-0107', 'INST:godavari'],
        ['ACC:ACC-0107', 'INST:godavari'],
      ]);
      for (const name of ['Meera Iyer', 'Dr S. Ranganathan', 'Rahul Verma']) {
        expect(await bannersOf(proof.as(name), name), `${name}: the banner is gone`).not.toContain(
          'institution-paused',
        );
      }
      expect((await formatPage(proof, 'web')).gate.canOpen, 'Rahul can open WEB again').toBe(true);
    },
  },
  {
    id: 'X-deactivate',
    title:
      'The Institute Admin deactivates then reactivates Rahul; the Super Admin overrides Sneha to Active — nothing else changes',
    covers: ['cross-cutting deactivate-student', 'cross-cutting override-student-status'],
    actor: 'Institute Admin · Super Admin → Student',
    screens: 'IA-07 · SA-07 (Change status) · XS-08 · IA-04',
    evidence: 'B2-06 · B1-09 f7 · B2-10 f7 · B2-04 f1 "Student inactive" · B7-03 f8',
    at: '2026-11-16 11:00',
    run: async (proof) => {
      const ia = proof.as('Meera Iyer');
      const rahul = proof.personId('Rahul Verma');
      const before = progressOf(proof);
      const others = JSON.stringify(
        ['Priya Natarajan', 'Dr S. Ranganathan'].map(
          (name) => snapshotOf(proof.world())[`PER:${proof.personId(name)}`],
        ),
      );
      const record = await must(ia.people.getStudent(rahul), 'IA-07');
      await proof.refused(
        'deactivate without a reason',
        () =>
          ia.people.deactivateStudent({ id: rahul, reason: ' ', expectedRev: record.student.rev }),
        { kind: 'validation-failed' },
      );
      const inactive = await must(
        ia.people.deactivateStudent({
          id: rahul,
          reason: 'Left the programme.',
          expectedRev: record.student.rev,
        }),
        'deactivate Rahul',
      );
      expect(
        await bannersOf(proof.as('Rahul Verma'), 'Rahul'),
        'The inactive banner (B1-09 f7)',
      ).toContain('account-inactive');
      await proof.refused(
        'Rahul launches WEB while inactive',
        () => proof.as('Rahul Verma').learning.launchWebFormat({ experimentId: SHELL }),
        { kind: 'refused', code: 'student-inactive' },
      );
      const grants = await must(ia.studentAccess.listGrants({ showWithdrawn: false }), 'IA-04');
      expect(
        grants.find((row) => row.grant.id === 'SACC-0310')?.display,
        'IA-04 "Student inactive"',
      ).toBe('student-inactive');
      expect(progressOf(proof), 'Deactivation keeps the work (invariant 4)').toBe(before);
      expect(
        JSON.stringify(
          ['Priya Natarajan', 'Dr S. Ranganathan'].map(
            (name) => snapshotOf(proof.world())[`PER:${proof.personId(name)}`],
          ),
        ),
        'Unrelated Student and Faculty records are untouched',
      ).toBe(others);
      await must(
        ia.people.reactivateStudent({ id: rahul, expectedRev: inactive.rev }),
        'reactivate Rahul',
      );
      const sneha = proof.personId('Sneha Reddy');
      const listed = (
        await must(proof.as('Arjun Mehta').institutions.getInstitution(GODAVARI), 'SA-07')
      ).people.studentList.find((row) => row.id === sneha);
      expect(listed?.status, 'SA-07 lists Sneha inactive (B7-03 f8)').toBe('inactive');
      // SA-07's student list carries no rev (contract gap reported for the owner); the record's
      // own rev is read from the world, as the Change status dialog will need it.
      const snehaRev = recordOf<{ rev: number }>(proof, 'people', sneha).rev;
      await must(
        proof.as('Arjun Mehta').institutions.overrideStudentStatus({
          studentId: sneha,
          to: 'active',
          reason: 'Re-joined the programme this term.',
          expectedRev: snehaRev,
        }),
        'SA-07 override Sneha',
      );
    },
    verify: async (proof) => {
      expect(
        await bannersOf(proof.as('Rahul Verma'), 'Rahul'),
        'Reactivated: no banner',
      ).not.toContain('account-inactive');
      expect((await formatPage(proof, 'web')).gate.canOpen).toBe(true);
      const sneha = await must(
        proof.as('Meera Iyer').people.getStudent(proof.personId('Sneha Reddy')),
        'IA-07 Sneha',
      );
      expect(
        sneha.student.accountStatus,
        'The Super Admin’s override reaches the Institute Admin',
      ).toBe('active');
      expect(await bannersOf(proof.as('Sneha Reddy'), 'Sneha')).not.toContain('account-inactive');
      expect(
        proof
          .committed()
          .every((entry) =>
            entry.changed.every((ref) => ref.kind === 'PER' || ref.kind === 'INST'),
          ),
        'Status changes write people (and the institution’s history) only',
      ).toBe(true);
    },
  },
  {
    id: 'X-session',
    title: 'Signing in and out on the tab’s own session keeps the one world',
    covers: ['cross-cutting session'],
    actor: 'Institute Admin (sign in) · nobody (sign out)',
    screens: 'XS-01 (Phase 1) · XS-05 Sign out',
    evidence: 'Appendix D §2.3 · ADR-0004 option A',
    at: '2026-11-16 12:00',
    run: async (proof) => {
      const tab = proof.platform.ports;
      const before = JSON.stringify(snapshotOf(proof.world()));
      const signedIn = await must(
        tab.session.signIn({
          method: 'email',
          email: 'meera.iyer@godavari.edu.in',
          password: 'any non-empty password',
        }),
        'sign in as Meera',
      );
      expect(signedIn.session.role).toBe('tenant_admin');
      await must(tab.session.signOut(), 'sign out');
      expect(await must(tab.session.getSession(), 'after sign-out')).toBeNull();
      expect(
        JSON.stringify(snapshotOf(proof.world())),
        'No world record changes on sign-in or sign-out',
      ).toBe(before);
    },
    verify: () => undefined,
  },
  {
    id: 'A-info',
    title:
      'A new public request; opening SA-03 starts nothing; "Request more information" — no exit (T-03)',
    covers: ['alternate A-request-more-information', 'interim AD-14'],
    interim: 'AD-14 / P1-04 — no review-start fact is supplied for this request',
    actor: 'Public visitor → Super Admin',
    screens: 'PU-07 → PU-09 · SA-03 · PU-10',
    evidence: 'B1-11 f6 · f12 · B1-08 f3 · B1-10 f0',
    at: '2026-11-16 13:00',
    run: async (proof) => {
      const visitor = proof.stranger();
      await must(
        visitor.selection.add({ experimentId: SHELL, formats: ['web'] }),
        'add to the selection',
      );
      const sent = await must(
        visitor.accessRequests.submitPublicRequest({
          institutionName: 'Krishna Valley College of Engineering',
          contactPerson: 'Lakshmi Rao',
          email: 'lakshmi.rao@kvce.edu.in',
          phone: null,
          licencesRequested: '40',
          message: null,
          term: { kind: 'yearly' },
        }),
        'send the request',
      );
      proof.carried.set('infoToken', sent.statusToken);
      proof.carried.set('infoReference', sent.reference);
      const admin = proof.as('Arjun Mehta');
      const page = await must(
        admin.accessRequests.getRequestForDecision(unsafeBrand(sent.reference)),
        'SA-03',
      );
      const status = await must(visitor.accessRequests.getRequestStatus(sent.statusToken), 'PU-10');
      expect(status.reviewStarted, 'AD-14: opening SA-03 does not start review').toBe(false);
      await proof.refused(
        'ask without saying what is needed',
        () =>
          admin.accessRequests.requestMoreInformation({
            id: page.request.id,
            reason: ' ',
            expectedRev: page.request.rev,
          }),
        { kind: 'validation-failed' },
      );
      const asked = await must(
        admin.accessRequests.requestMoreInformation({
          id: page.request.id,
          reason: 'Please confirm how many students will use VR in the first term.',
          expectedRev: page.request.rev,
        }),
        'request more information',
      );
      await proof.refused(
        'decide after information was requested',
        () =>
          admin.accessRequests.approveRequest({
            id: page.request.id,
            route: 'external',
            expectedRev: asked.request.rev,
          }),
        { kind: 'policy-open', decision: 'T-03' },
      );
      const seen = await must(visitor.accessRequests.getRequestStatus(sent.statusToken), 'PU-10');
      expect(
        [seen.status, seen.whatBitsAsked, seen.nextStep],
        'PU-10 "BITS needs more information", no reply field (B1-08 f3)',
      ).toEqual([
        'information-requested',
        'Please confirm how many students will use VR in the first term.',
        'none',
      ]);
    },
    verify: async (proof) => {
      const reference = proof.carried.get('infoReference')!;
      expect(reference, 'A new request takes the next free id, never a board reference').toBe(
        'REQ-0059',
      );
      const rows = await must(
        proof.as('Arjun Mehta').accessRequests.listRequests({ sort: 'received-newest' }),
        'SA-02',
      );
      expect(
        rows.find((row) => row.id === reference)?.status,
        'SA-02 "Information requested"',
      ).toBe('information-requested');
      expect(
        proof.world().records.institutions['krishna-valley-college-of-engineering'],
        'No institution record without an approval',
      ).toBeUndefined();
    },
  },
  {
    id: 'E-alt1',
    title:
      'The Content Manager sends SUB-0074 back to the Academic Reviewer for a re-check; the reviewer approves again',
    covers: ['alternate E-alt1'],
    actor: 'Content Manager → Academic Reviewer',
    screens: 'CM-03 (Send back) → RV-02 / RV-03 · VE-07',
    evidence: 'B6-11 f3 · f7 · B5-06 f7 · B6-02 f1 · B6-03 f3',
    at: '2026-11-17 10:00',
    run: async (proof) => {
      const cm = proof.as('Kavya Nair');
      const decision = await must(cm.production.getPublicationDecision(SUB_0074), 'CM-03 SUB-0074');
      await proof.refused(
        'send back without a reason',
        () =>
          cm.production.sendBack({
            id: SUB_0074,
            to: 'academic-reviewer',
            reason: '',
            expectedRev: decision.submission.rev,
          }),
        { kind: 'validation-failed' },
      );
      const back = await must(
        cm.production.sendBack({
          id: SUB_0074,
          to: 'academic-reviewer',
          reason: 'Please re-check the second outcome against the description.',
          expectedRev: decision.submission.rev,
        }),
        'send back to the reviewer',
      );
      expect([back.status.state, (back.status as { reason?: string }).reason]).toEqual([
        'with-academic-reviewer',
        'recheck',
      ]);
      const vendor = await must(proof.as('Anil Shetty').production.getRecord(SUB_0074), 'VE-07');
      expect(
        vendor.submission.status,
        'B5-06 f7 "Back with the Academic Reviewer for a re-check"',
      ).toMatchObject({ state: 'with-academic-reviewer', reason: 'recheck' });
      const queue = await must(
        proof.as('Prof. A. Menon').production.getReviewQueue({ type: 'recheck' }),
        'RV-02 re-checks',
      );
      expect(
        queue.some((item) => item.ref.id === 'SUB-0074'),
        'RV-02 "Back for a re-check"',
      ).toBe(true);
      const review = await must(
        proof.as('Prof. A. Menon').production.getSubmissionForReview(SUB_0074),
        'RV-03',
      );
      expect(
        (review.recheck as { reason?: string } | null)?.reason,
        'The Content Manager’s reason first on RV-03 (B6-11 f3)',
      ).toBe('Please re-check the second outcome against the description.');
      expect(
        (await must(cm.production.listReadyToPublish(), 'CM-02')).some(
          (row) => row.submission.id === SUB_0074,
        ),
      ).toBe(false);
      await must(
        proof.as('Prof. A. Menon').production.approveSubmission({
          id: SUB_0074,
          outcomes: review.submission.learningOutcomes.map((outcome) => outcome.text),
          expectedRev: review.submission.rev,
        }),
        're-approve',
      );
    },
    verify: async (proof) => {
      expect(proof.committed().map((entry) => entry.method)).toEqual([
        'ProductionService.sendBack',
        'ProductionService.approveSubmission',
      ]);
      const ready = await must(proof.as('Kavya Nair').production.listReadyToPublish(), 'CM-02');
      expect(
        ready.some((row) => row.submission.id === SUB_0074),
        'Back with the Content Manager',
      ).toBe(true);
    },
  },
  {
    id: 'E-alt2',
    title:
      'The Content Manager sends SUB-0074 back to the Vendor with a reference — "Returned by the Content Manager"',
    covers: ['alternate E-alt2'],
    actor: 'Content Manager → Vendor',
    screens: 'CM-03 (Send back) → VE-07 / VE-08 · RV-06',
    evidence: 'B6-11 f7 · B5-06 f6 · B5-07 f1 · OD-B6-05',
    at: '2026-11-17 11:00',
    run: async (proof) => {
      const cm = proof.as('Kavya Nair');
      const decision = await must(cm.production.getPublicationDecision(SUB_0074), 'CM-03');
      await must(
        cm.production.sendBack({
          id: SUB_0074,
          to: 'vendor',
          reason: 'The water-bath cooling curve is missing from the description.',
          references: [{ step: 'course-and-description', format: null, field: 'description' }],
          expectedRev: decision.submission.rev,
        }),
        'send back to the vendor',
      );
    },
    verify: async (proof) => {
      const vendor = await must(proof.as('Anil Shetty').production.getRecord(SUB_0074), 'VE-07');
      expect(vendor.submission.status, 'B5-06 f6 "Returned by the Content Manager"').toMatchObject({
        state: 'returned',
        by: 'content-manager',
      });
      expect((vendor.lastReturn as { reason?: string } | null)?.reason).toBe(
        'The water-bath cooling curve is missing from the description.',
      );
      const review = await must(
        proof.as('Prof. A. Menon').production.getSubmissionForReview(SUB_0074),
        'RV-06',
      );
      expect(
        [review.submission.status.state, review.decided],
        'RV-06 "With the vendor", read-only',
      ).toEqual(['returned', true]);
      await proof.refused(
        'publish a returned record',
        () =>
          proof
            .as('Kavya Nair')
            .production.publish({ id: SUB_0074, expectedRev: vendor.submission.rev }),
        { kind: 'invalid-state' },
      );
    },
  },
  {
    id: 'E-alt3',
    title:
      'The Super Admin moves the stuck SUB-0085 back to the vendor with a reason; Published is never a target',
    covers: ['alternate E-alt3'],
    actor: 'Super Admin',
    screens: 'SA-12 → SA-13 (Move status)',
    evidence: 'B7-06 f1 · f5 · B7-10 f6 · OD-B7-09',
    at: '2026-11-17 12:00',
    run: async (proof) => {
      const admin = proof.as('Arjun Mehta');
      const stuck = await must(admin.production.listAllContent({ status: 'stuck' }), 'SA-12 stuck');
      expect(
        stuck.map((row) => [row.ref.id, row.stuck, row.status.state]),
        'SA-12 "Stuck — nobody can act"',
      ).toEqual([['SUB-0085', true, 'with-academic-reviewer']]);
      const record = await must(
        admin.production.getContentRecord({ kind: 'SUB', id: unsafeBrand('SUB-0085') }),
        'SA-13',
      );
      await proof.refused(
        'move status without a reason',
        () =>
          admin.production.overrideStatus({
            id: unsafeBrand('SUB-0085'),
            reason: ' ',
            expectedRev: record.submission!.rev,
          }),
        { kind: 'validation-failed' },
      );
      await must(
        admin.production.overrideStatus({
          id: unsafeBrand('SUB-0085'),
          reason: 'No Academic Reviewer covers EEE ZC341 yet.',
          expectedRev: record.submission!.rev,
        }),
        'move status',
      );
      const published = await must(
        admin.production.getContentRecord({ kind: 'SUB', id: SUB_0077 }),
        'SA-13 SUB-0077',
      );
      await proof.refused(
        'override a published record',
        () =>
          admin.production.overrideStatus({
            id: SUB_0077,
            reason: 'Trying a published record.',
            expectedRev: published.submission!.rev,
          }),
        { kind: 'invalid-state' },
      );
    },
    verify: async (proof) => {
      const moved = proof.resultOf<Submission>('ProductionService.overrideStatus', 'first');
      expect(moved.status).toMatchObject({ state: 'returned', by: 'super-admin-override' });
      expect(proof.changedBy('ProductionService.overrideStatus')).toEqual(['SUB:SUB-0085']);
      const vendorName = Object.values(proof.world().records.holders).find(
        (holder) => holder.id === moved.vendorHolderId,
      )?.name;
      expect(vendorName, 'SUB-0085 belongs to a Vendor').toBeDefined();
      const vendor = await must(
        proof.as(vendorName!).production.getRecord(unsafeBrand('SUB-0085')),
        'the Vendor’s record',
      );
      expect(
        vendor.submission.status.state,
        'The Vendor can change and resubmit (B7-06; the Vendor wording is unresolved)',
      ).toBe('returned');
      expect(
        (
          await must(
            proof.as('Arjun Mehta').production.listAllContent({ status: 'stuck' }),
            'SA-12',
          )
        ).length,
      ).toBe(0);
    },
  },
  {
    id: 'F-alt',
    title:
      'F2b: the reviewer returns a new Distillation correction; F-alt: the Content Manager withdraws the returned UPD-0006; approved updates can’t be withdrawn',
    covers: ['alternate F-alt return', 'alternate F-alt withdraw'],
    actor: 'Content Manager · Academic Reviewer',
    screens: 'CM-05 → CM-08 → RV-04 (Return) · CM-08 (Withdraw update)',
    evidence: 'B6-04 f3 · B6-09 f2 · f8 · BR-111 · OD-B6-06',
    at: '2026-11-18 10:00',
    run: async (proof) => {
      const cm = proof.as('Kavya Nair');
      const reviewer = proof.as('Prof. A. Menon');
      // F2b — a new correction of Distillation Column (Prof. A. Menon reviews its course).
      const opened = await must(
        cm.corrections.openCorrection({ experimentId: DISTILLATION, entry: 'start-a-correction' }),
        'start a correction',
      );
      const draft = opened.update;
      const saved = await must(
        cm.corrections.saveCorrection({
          id: draft.id,
          proposed: {
            ...draft.proposed,
            description: `${draft.proposed.description} The reboiler duty is now given in kW.`,
          },
          whatChangesAndWhy: 'Gives the reboiler duty in kW, as the lab sheet does.',
          versionLabel: '1.4',
          expectedRev: draft.rev,
        }),
        'save the correction',
      );
      const sent = await must(
        cm.corrections.sendForAcademicReview({ id: saved.id, expectedRev: saved.rev }),
        'send for academic review',
      );
      await proof.refused(
        'return without a reason',
        () =>
          reviewer.corrections.returnUpdate({ id: sent.id, reason: ' ', expectedRev: sent.rev }),
        { kind: 'validation-failed' },
      );
      await must(
        reviewer.corrections.returnUpdate({
          id: sent.id,
          reason: 'Give the units in the description as well.',
          expectedRev: sent.rev,
        }),
        'F2b return',
      );
      proof.carried.set('returnedUpdate', sent.id);
      // F-alt — the seeded UPD-0006, returned to the Content Manager on 26 Aug, is withdrawn.
      const returned = (await must(cm.corrections.getUpdate(UPD_0006), 'CM-08 UPD-0006')).update;
      expect(returned.state, 'UPD-0006 is returned to the Content Manager (seed)').toBe('returned');
      proof.carried.set(
        'fAltLive',
        (await must(cm.corrections.getPublishedExperiment(returned.experimentId), 'CM-05'))
          .experiment.live.label,
      );
      proof.carried.set('fAltExperiment', returned.experimentId);
      await proof.refused(
        'withdraw without a reason',
        () =>
          cm.corrections.withdrawUpdate({ id: returned.id, reason: '', expectedRev: returned.rev }),
        { kind: 'validation-failed' },
      );
      await must(
        cm.corrections.withdrawUpdate({
          id: returned.id,
          reason: 'The correction moves to the next release.',
          expectedRev: returned.rev,
        }),
        'withdraw UPD-0006',
      );
    },
    verify: async (proof) => {
      const cm = proof.as('Kavya Nair');
      const returnedId = unsafeBrand<CorrectionUpdate['id']>(proof.carried.get('returnedUpdate')!);
      expect(returnedId, 'A new update takes the next free id').toBe('UPD-0008');
      const returned = (await must(cm.corrections.getUpdate(returnedId), 'CM-08')).update;
      expect(returned.state, 'B6-09 f2 "Returned by the Academic Reviewer" — editable again').toBe(
        'returned',
      );
      expect(
        (await must(cm.corrections.getPublishedExperiment(DISTILLATION), 'CM-05')).experiment.live
          .label,
        'Returning changes nothing live',
      ).toBe('1.3');
      expect(
        (await must(cm.corrections.getUpdate(UPD_0006), 'CM-08')).update.state,
        'B6-09 f8 "Withdrawn"',
      ).toBe('withdrawn');
      const page = await must(
        cm.corrections.getPublishedExperiment(unsafeBrand(proof.carried.get('fAltExperiment')!)),
        'CM-05',
      );
      expect(
        [page.openUpdate, page.experiment.live.label],
        'No open update; the live version is unchanged',
      ).toEqual([null, proof.carried.get('fAltLive')]);
      const queue = await must(
        proof.as('Prof. A. Menon').production.getReviewQueue({ type: 'update' }),
        'RV-02 updates',
      );
      expect(
        queue.some((item) => item.ref.id === 'UPD-0006' || item.ref.id === 'UPD-0008'),
        'Neither is waiting in RV-02',
      ).toBe(false);
      const held = (await must(cm.corrections.getUpdate(unsafeBrand('UPD-0004')), 'UPD-0004'))
        .update;
      await proof.refused(
        'withdraw an update after approval (BR-111)',
        () =>
          cm.corrections.withdrawUpdate({ id: held.id, reason: 'Trying.', expectedRev: held.rev }),
        { kind: 'invalid-state' },
      );
    },
  },
  {
    id: 'B-withdraw',
    title: 'The Institute Admin withdraws SACC-0310 — "no longer given", earlier work kept',
    covers: ['alternate B-withdraw'],
    actor: 'Institute Admin → Student',
    screens: 'IA-04 → "Withdraw…" (DL-2) · ST-01 · ST-02 · ST-19',
    evidence: 'B2-04 f7 · f5 · B2-13 f1–f3 · B2-12 f4',
    at: '2026-11-18 11:00',
    run: async (proof) => {
      const ia = proof.as('Meera Iyer');
      const rows = await must(ia.studentAccess.listGrants({ showWithdrawn: false }), 'IA-04');
      const row = rows.find((candidate) => candidate.grant.id === 'SACC-0310')!;
      expect(
        row.alsoInGroupGrant,
        'The spine holds no overlapping grant (DV-1 stays out of it)',
      ).toBeNull();
      await proof.refused(
        'withdraw without a reason',
        () =>
          ia.studentAccess.withdrawGrant({
            grantId: row.grant.id,
            reason: '',
            expectedRev: row.grant.rev,
          }),
        { kind: 'validation-failed' },
      );
      proof.carried.set('progressBeforeWithdraw', progressOf(proof));
      await must(
        ia.studentAccess.withdrawGrant({
          grantId: row.grant.id,
          reason: 'Given individually by mistake.',
          expectedRev: row.grant.rev,
        }),
        'withdraw SACC-0310',
      );
    },
    verify: async (proof) => {
      const rahul = `PER:${proof.personId('Rahul Verma')}`;
      expect(
        proof.changedBy('StudentAccessService.withdrawGrant'),
        'The grant, plus the plan’s and Rahul’s own history lines',
      ).toEqual(['ACC:ACC-0107', rahul, 'SACC:SACC-0310']);
      expect(
        proof.fieldsChanged('StudentAccessService.withdrawGrant', 'ACC:ACC-0107'),
        'Nothing about licences changes (T-06)',
      ).toEqual(['history', 'rev', 'updatedAt']);
      expect(proof.fieldsChanged('StudentAccessService.withdrawGrant', rahul)).toEqual([
        'history',
        'rev',
        'updatedAt',
      ]);
      const shown = await must(
        proof.as('Meera Iyer').studentAccess.listGrants({ showWithdrawn: true }),
        'IA-04 show withdrawn',
      );
      expect(
        shown.find((row) => row.grant.id === 'SACC-0310')?.display,
        'B2-04 f5 "Withdrawn", kept in history',
      ).toBe('withdrawn');
      const hub = await proof.as('Rahul Verma').studentAccess.getExperimentHub(SHELL);
      expect(hub.ok, 'ST-19 "You no longer have access to this experiment"').toBe(false);
      const courses = await must(proof.as('Rahul Verma').studentAccess.listMyCourses(), 'ST-02');
      expect(
        courses.some((course) => course.earlierWork),
        'ST-02 "Earlier work" kept',
      ).toBe(true);
      expect(progressOf(proof), 'Work is kept (invariant 4)').toBe(
        proof.carried.get('progressBeforeWithdraw'),
      );
      await proof.refused(
        'Rahul launches WEB after the withdrawal',
        () => proof.as('Rahul Verma').learning.launchWebFormat({ experimentId: SHELL }),
        { kind: 'refused' },
      );
      // The Faculty member still reads his work.
      const detail = await must(
        proof.as('Dr S. Ranganathan').teaching.getStudentDetail({
          studentId: proof.personId('Rahul Verma'),
          experimentId: SHELL,
        }),
        'FA-21',
      );
      expect(detail.attempts.map((attempt) => attempt.id)).toEqual(['ATT-0450']);
    },
  },
];
