/**
 * Rules this package must hold beyond the contract cases: the E-alt3 exception (listAllContent is
 * a Super Admin read under the existing rule, and the override reaches the stuck record), RV-03's
 * "What changed in revision n", AD-14, the stand-ins' limits (TE-3, TE-4, M-3), BC9 and the
 * Student's rows, which follow the domain's read verdict and format gate (SACC-12, SACC-14).
 */
import { type ExperimentId, unsafeBrand } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { createSamplePlatform, seed } from './index.js';
import {
  afterFlow,
  asPerson,
  ist,
  laterSample,
  personIdOf,
  setSampleNow,
  standinsOf,
  stateCoverage,
  visitorPorts,
  worldOf,
} from './testing/index.js';

describe('E-alt3 — listAllContent (owner exception) and the stuck-record override', () => {
  it('lists every non-draft submission and the published experiments; drafts stay the Vendor’s', async () => {
    const platform = createSamplePlatform({ world: await stateCoverage() });
    const admin = asPerson(platform, 'Arjun Mehta');
    const before = worldOf(platform).worldVersion;
    const all = await admin.production.listAllContent({});
    if (!all.ok) throw new Error('listAllContent refused');
    const refs = all.value.map((row) => `${row.ref.kind}:${row.ref.id}`);
    expect(refs).not.toContain('SUB:SUB-0079');
    expect(refs).not.toContain('SUB:SUB-0083');
    expect(refs).toContain('SUB:SUB-0077');
    expect(refs).toContain('EXP:composite-wall-conduction');
    expect(worldOf(platform).worldVersion).toBe(before);
    const stuck = await admin.production.listAllContent({ status: 'stuck' });
    if (!stuck.ok) throw new Error('stuck filter refused');
    expect(stuck.value.map((row) => row.ref.id)).toEqual(['SUB-0085']);
    expect(stuck.value[0]?.whoCanAct).toBe('Nobody — no Academic Reviewer has EEE ZC341 in scope');
  });

  it('moves the stuck record back to the Vendor with a reason kept in the history; nothing else changes', async () => {
    const platform = createSamplePlatform({ world: seed() });
    const admin = asPerson(platform, 'Arjun Mehta');
    const record = await admin.production.getContentRecord({
      kind: 'SUB',
      id: unsafeBrand('SUB-0085'),
    });
    if (!record.ok || !record.value.submission) throw new Error('SA-13 refused');
    expect(record.value.stuck).toBe(true);
    const moved = await admin.production.overrideStatus({
      id: record.value.submission.id,
      reason: 'No Academic Reviewer covers EEE ZC341 yet.',
      expectedRev: record.value.submission.rev,
    });
    if (!moved.ok) throw new Error('override refused');
    expect(moved.value.status).toMatchObject({ state: 'returned', by: 'super-admin-override' });
    expect(moved.changed).toEqual([{ kind: 'SUB', id: 'SUB-0085' }]);
    const after = await admin.production.listAllContent({ status: 'stuck' });
    expect(after.ok && after.value).toEqual([]);
  });

  it('names an open correction only once the Super Admin may see it (UPD-18, UPD-26)', async () => {
    const admin = asPerson(createSamplePlatform({ world: seed() }), 'Arjun Mehta');
    const all = await admin.production.listAllContent({});
    if (!all.ok) throw new Error('listAllContent refused');
    const openUpdate = (id: string) => all.value.find((row) => row.ref.id === id)?.openUpdate;
    // UPD-0006 is back with the Content Manager; UPD-0004 is on hold (the Super Admin's decision).
    expect(openUpdate('induction-motor-loading')).toBeNull();
    expect(openUpdate('boiler-drum-level')).toBe('UPD-0004');
    const record = await admin.production.getContentRecord({
      kind: 'EXP',
      id: unsafeBrand('induction-motor-loading'),
    });
    expect(record.ok && record.value.experiment?.openUpdateId).toBeNull();
    const held = await admin.production.getContentRecord({
      kind: 'EXP',
      id: unsafeBrand('boiler-drum-level'),
    });
    expect(held.ok && held.value.experiment?.openUpdateId).toBe('UPD-0004');
  });

  it('is a Super Admin read only: no other role reaches it', async () => {
    const platform = createSamplePlatform({ world: seed() });
    for (const name of ['Kavya Nair', 'Prof. A. Menon', 'Anil Shetty']) {
      expect(await asPerson(platform, name).production.listAllContent({})).toEqual({
        ok: false,
        error: { kind: 'not-permitted', why: 'wrong-workspace' },
      });
    }
  });
});

describe('RV-03 — what changed in revision 2 (B6-03)', () => {
  it('shows only the field the Vendor changed, with the value it was sent with', async () => {
    const walked = createSamplePlatform({ world: await afterFlow('E') });
    const view = await asPerson(walked, 'Prof. A. Menon').production.getSubmissionForReview(
      unsafeBrand('SUB-0077'),
    );
    if (!view.ok) throw new Error('RV-03 refused');
    expect(view.value.whatChanged).toEqual([
      {
        field: 'vr:device-need',
        was: 'VR headset',
        now: 'Standalone VR headset — no PC or cable needed — and about 2 × 2 m of clear floor',
      },
    ]);
    expect(view.value.previousReturn?.reason).toBe('Please clarify the VR device requirements.');
  });
});

describe('AD-14 — opening SA-03 never starts review', () => {
  it('leaves "BITS started reviewing" unset after the Super Admin reads the request', async () => {
    const platform = createSamplePlatform({ world: seed() });
    const visitor = visitorPorts(platform);
    await visitor.selection.add({
      experimentId: unsafeBrand('shell-and-tube-heat-exchanger'),
      formats: ['web'],
    });
    const sent = await visitor.accessRequests.submitPublicRequest({
      institutionName: 'Godavari Institute of Technology',
      contactPerson: 'Meera Iyer',
      email: 'meera.iyer@godavari.edu.in',
      phone: null,
      licencesRequested: '120',
      message: null,
      term: { kind: 'yearly' },
    });
    if (!sent.ok) throw new Error('request refused');
    expect(sent.value.reference).toBe('REQ-0042');
    await asPerson(platform, 'Arjun Mehta').accessRequests.getRequestForDecision(
      unsafeBrand('REQ-0042'),
    );
    expect(worldOf(platform).records.requests['REQ-0042']?.reviewStartedAt).toBeNull();
  });
});

describe('the stand-ins report only what their writer could', () => {
  it('refuses a runtime report for a format the Student cannot open, and writes nothing', async () => {
    const platform = createSamplePlatform({ world: await afterFlow('B') });
    const standins = standinsOf(platform);
    const before = worldOf(platform).worldVersion;
    const ar = standins.runtimeReport.reportActivity({
      studentId: personIdOf(worldOf(platform), 'Rahul Verma'),
      experimentId: unsafeBrand('shell-and-tube-heat-exchanger'),
      format: 'ar',
      kind: 'opened',
      at: ist('2026-10-12 10:05'),
    });
    expect(ar).toEqual({ ok: false, error: { kind: 'invalid-state', current: 'format-not-open' } });
    const priya = standins.runtimeReport.reportCompletion({
      studentId: personIdOf(worldOf(platform), 'Priya Natarajan'),
      experimentId: unsafeBrand('shell-and-tube-heat-exchanger'),
      format: 'web',
      at: ist('2026-10-12 10:05'),
      from: 'simulation',
    });
    expect(priya.ok).toBe(false);
    expect(worldOf(platform).worldVersion).toBe(before);
  });

  it('confirms no payment for a request that is not waiting for one (TE-4)', async () => {
    const platform = createSamplePlatform({ world: seed() });
    const answer = standinsOf(platform).paymentOutcome.report({
      requestId: unsafeBrand('REQ-0038'),
      outcome: 'confirmed',
    });
    expect(answer).toEqual({
      ok: false,
      error: { kind: 'invalid-state', current: 'under-review' },
    });
  });

  it('routes a resubmission only to the Academic Reviewer, and only through the seam (M-3)', () => {
    const platform = createSamplePlatform({ world: seed() });
    const routing = standinsOf(platform).workflowRouting;
    const submission = worldOf(platform).records.submissions['SUB-0086']!;
    expect(routing.route(submission)).toEqual({ reason: 'resubmission' });
  });
});

describe('BC9 — publishing and releasing give no one access', () => {
  it('writes only the submission, the update and the experiment when publishing or releasing', async () => {
    // Each history entry lists exactly the records its command changed (the pipeline's `changed`).
    const world = await afterFlow('D');
    const decisions = world.history.filter(
      (entry) =>
        entry.method === 'ProductionService.publish' ||
        entry.method === 'CorrectionService.releaseUpdate',
    );
    expect(decisions.map((entry) => entry.method)).toEqual([
      'ProductionService.publish',
      'CorrectionService.releaseUpdate',
    ]);
    for (const entry of decisions) {
      expect(entry.changed.map((ref) => ref.kind).sort()).toEqual(
        entry.method === 'ProductionService.publish' ? ['EXP', 'SUB'] : ['EXP', 'UPD'],
      );
    }
  });
});

describe('ST-13 — an unanswered question', () => {
  it('saves nothing for a null answer: no clearing rule is drawn', async () => {
    const platform = createSamplePlatform({ world: await afterFlow('C') });
    setSampleNow(platform, ist('2026-10-27 10:00'));
    const faculty = asPerson(platform, 'Dr S. Ranganathan');
    const created = await faculty.assessments.createAssessment({
      mode: 'create',
      experimentId: unsafeBrand('shell-and-tube-heat-exchanger'),
      name: 'Heat Exchanger — post-lab',
      introduction: null,
      rules: {
        passMarkPercent: '50',
        attemptsAllowed: '2',
        deadline: '2026-11-14T23:59:00+05:30',
        releaseOption: 'after-deadline',
        releaseDate: null,
      },
      questions: [unsafeBrand('Q-0101'), unsafeBrand('Q-0106')],
    });
    if (!created.ok) throw new Error('create refused');
    const student = asPerson(platform, 'Rahul Verma');
    const attempt = await student.assessments.startAttempt(created.value.id);
    if (!attempt.ok) throw new Error('start refused');
    const version = worldOf(platform).worldVersion;
    const saved = await student.assessments.saveAnswer({
      attemptId: attempt.value.id,
      questionId: unsafeBrand('Q-0101'),
      answer: null,
      expectedRev: attempt.value.rev,
    });
    expect(saved).toMatchObject({ ok: true, changed: [] });
    expect(worldOf(platform).worldVersion).toBe(version);
  });
});

describe('Student rows follow the domain read verdict and format gate (SACC-12, SACC-14)', () => {
  const shell = unsafeBrand<ExperimentId>('shell-and-tube-heat-exchanger');

  it('shows a Student whose only grant was withdrawn no row, words or progress (SACC-14)', async () => {
    const nikhil = asPerson(createSamplePlatform({ world: await laterSample() }), 'Nikhil Bose');
    expect(await nikhil.studentAccess.listMyCourses()).toMatchObject({ ok: true, value: [] });
    expect(await nikhil.studentAccess.getMyHome()).toMatchObject({
      ok: true,
      value: { myCourses: [], noAccessYet: true, continue: null },
    });
    expect(
      await nikhil.studentAccess.getMyCourse(unsafeBrand('thermodynamics-heat-transfer')),
    ).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
    expect(await nikhil.learning.getMyProgress()).toMatchObject({ ok: true, value: [] });
    expect(await nikhil.studentAccess.getExperimentHub(shell)).toEqual({
      ok: false,
      error: { kind: 'policy-open', decision: 'SACC-14' },
    });
  });

  it('keeps only the earlier-work flag after the only grant is withdrawn (B2-10, B2-11)', async () => {
    const platform = createSamplePlatform({ world: await afterFlow('C') });
    const ia = asPerson(platform, 'Meera Iyer');
    const grants = await ia.studentAccess.listGrants({ showWithdrawn: false });
    const row = grants.ok ? grants.value.find((entry) => entry.grant.id === 'SACC-0310') : null;
    if (!row) throw new Error('SACC-0310 is not listed');
    const withdrawn = await ia.studentAccess.withdrawGrant({
      grantId: row.grant.id,
      reason: 'Given individually by mistake.',
      expectedRev: row.grant.rev,
    });
    expect(withdrawn.ok).toBe(true);
    const rahul = asPerson(platform, 'Rahul Verma');
    const courses = await rahul.studentAccess.listMyCourses();
    expect(courses.ok && courses.value).toMatchObject([
      { experimentsGiven: 0, formatsAvailable: [], earlierWork: true },
    ]);
    const course = await rahul.studentAccess.getMyCourse(
      unsafeBrand('thermodynamics-heat-transfer'),
    );
    expect(course.ok && course.value.experiments).toEqual([]);
    expect(await rahul.studentAccess.getMyHome()).toMatchObject({
      ok: true,
      value: { continue: null, upNext: [], noAccessYet: false },
    });
  });

  it('routes an open experiment through the grants the gate uses, individual and group', async () => {
    const rahul = asPerson(createSamplePlatform({ world: await laterSample() }), 'Rahul Verma');
    const hub = await rahul.studentAccess.getExperimentHub(shell);
    if (!hub.ok) throw new Error('ST-05 refused');
    expect(hub.value.grantIds).toEqual(['SACC-0310', 'SACC-0311']);
    expect(hub.value.row.formats.map((row) => [row.format, row.availability])).toEqual([
      ['web', 'available-to-you'],
      ['ar', 'not-included-for-your-institution'],
      ['vr', 'available-to-you'],
      ['mr', 'not-available-for-this-experiment'],
    ]);
    const progress = await rahul.learning.getMyProgress();
    expect(progress.ok && progress.value.map((row) => row.grantId)).toEqual(['SACC-0310']);
  });

  it('keeps a waiting Student’s row read-only: the formats given, the gate closed (B3-02, B3-03)', async () => {
    const fatima = asPerson(createSamplePlatform({ world: await laterSample() }), 'Fatima Begum');
    const hub = await fatima.studentAccess.getExperimentHub(shell);
    if (!hub.ok) throw new Error('ST-05 refused');
    expect(hub.value.grantIds).toEqual(['SACC-0314']);
    expect(hub.value.row.formats.map((row) => row.availability)).toEqual([
      'available-to-you',
      'not-included-for-your-institution',
      'available-to-you',
      'not-available-for-this-experiment',
    ]);
    const page = await fatima.learning.getFormatPage({ experimentId: shell, format: 'web' });
    expect(page.ok && page.value.gate).toEqual({ canOpen: false, reason: 'waiting-for-a-licence' });
    const courses = await fatima.studentAccess.listMyCourses();
    expect(courses.ok && courses.value).toMatchObject([
      { experimentsGiven: 0, formatsAvailable: [], earlierWork: false },
    ]);
    const progress = await fatima.learning.getMyProgress();
    expect(progress.ok && progress.value.map((row) => row.grantId)).toEqual(['SACC-0314']);
  });
});

describe('policy and scope come before the input check (step 3 before step 4)', () => {
  it('answers out-of-scope for an experiment the Faculty member does not teach, whatever else is wrong', async () => {
    const platform = createSamplePlatform({ world: await afterFlow('C') });
    const faculty = asPerson(platform, 'Dr S. Ranganathan');
    const outside = unsafeBrand<ExperimentId>('boiler-drum-level');
    const malformed = { experimentId: outside, type: 'not-a-type' } as unknown as Parameters<
      typeof faculty.questionBank.listQuestions
    >[0];
    expect(await faculty.questionBank.listQuestions(malformed)).toEqual({
      ok: false,
      error: { kind: 'not-permitted', why: 'out-of-scope' },
    });
    const unlisted = { experimentId: outside, inactiveForDays: 3 } as unknown as Parameters<
      typeof faculty.teaching.listStudents
    >[0];
    expect(await faculty.teaching.listStudents(unlisted)).toEqual({
      ok: false,
      error: { kind: 'not-permitted', why: 'out-of-scope' },
    });
  });
});
