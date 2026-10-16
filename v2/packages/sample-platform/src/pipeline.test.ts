/**
 * The eight-step command pipeline (Appendix F §4.5; WP-0.11 §4, acceptance 4): a refusal writes
 * nothing, a repeated command id answers its first receipt, a stale revision is refused, each
 * commit moves the world version by one and records its history, the change bus publishes the
 * exact refs, and the actor is resolved from the records on every call — in the session the call
 * was made in.
 */
import { DELIVERED_METHODS, ledgerRows, type ProductPorts } from '@xr/contracts/draft';
import { type CourseId, type QuestionId, unsafeBrand } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { deferred } from './handlers/deferred.js';
import { createSamplePlatform } from './index.js';
import type { ChangeEvent } from './index.js';
import {
  afterFlow,
  asPerson,
  faults,
  internalsOf,
  ist,
  personIdOf,
  setSampleNow,
  snapshot,
  worldOf,
} from './testing/index.js';

async function platformAfterB() {
  return createSamplePlatform({ world: await afterFlow('B') });
}

function frozen(platform: ReturnType<typeof createSamplePlatform>) {
  const world = worldOf(platform);
  return JSON.stringify({
    records: world.records,
    worldVersion: world.worldVersion,
    history: world.history,
    idSource: world.idSource,
    processed: world.processedCommandIds,
  });
}

async function grantRow(ia: ProductPorts) {
  const rows = await ia.studentAccess.listGrants({ showWithdrawn: false });
  if (!rows.ok) throw new Error('listGrants refused');
  return rows.value.find((row) => row.grant.id === 'SACC-0310')!;
}

describe('a refusal writes nothing', () => {
  it('leaves the world deep-equal: no record, no id, no history, no version', async () => {
    const platform = await platformAfterB();
    const ia = asPerson(platform, 'Meera Iyer');
    const row = await grantRow(ia);
    const before = frozen(platform);
    const blank = await ia.studentAccess.withdrawGrant({
      grantId: row.grant.id,
      reason: ' ',
      expectedRev: row.grant.rev,
    });
    expect(blank.ok).toBe(false);
    const wrongRole = await asPerson(platform, 'Rahul Verma').studentAccess.withdrawGrant({
      grantId: row.grant.id,
      reason: 'Not mine to withdraw.',
      expectedRev: row.grant.rev,
    });
    expect(wrongRole).toMatchObject({ ok: false, error: { kind: 'not-permitted' } });
    expect(frozen(platform)).toBe(before);
  });

  it('reads and previews never write', async () => {
    const platform = await platformAfterB();
    const before = frozen(platform);
    const student = asPerson(platform, 'Rahul Verma');
    await student.studentAccess.getMyHome();
    await student.learning.getMyProgress();
    const ia = asPerson(platform, 'Meera Iyer');
    await ia.studentAccess.previewGiveAccess({
      experimentIds: [unsafeBrand('shell-and-tube-heat-exchanger')],
      target: { kind: 'student', studentId: personIdOf(worldOf(platform), 'Priya Natarajan') },
    });
    await asPerson(platform, 'Arjun Mehta').accessRequests.getRequestForDecision(
      unsafeBrand('REQ-0038'),
    );
    expect(frozen(platform)).toBe(before);
  });
});

describe('command ids and revisions', () => {
  it('answers a repeated command id with its first receipt and applies the change once', async () => {
    const platform = await platformAfterB();
    const row = await grantRow(asPerson(platform, 'Meera Iyer'));
    // The tab's own session signs in as Meera, then sends the same command twice.
    const signIn = await platform.ports.session.signIn({
      method: 'email',
      email: 'meera.iyer@godavari.edu.in',
      password: 'any non-empty password',
    });
    expect(signIn.ok).toBe(true);
    const commandId = platform.newCommandId();
    const input = {
      grantId: row.grant.id,
      reason: 'Given individually by mistake.',
      expectedRev: row.grant.rev,
    };
    const version = platform.worldVersion();
    const first = await platform.withCommandId(commandId).studentAccess.withdrawGrant(input);
    const second = await platform.withCommandId(commandId).studentAccess.withdrawGrant(input);
    expect(first.ok && second.ok).toBe(true);
    expect(second).toEqual(first);
    expect(platform.worldVersion()).toBe(version + 1);
    await expect(
      platform.withCommandId(commandId).people.deactivateStudent({
        id: personIdOf(worldOf(platform), 'Priya Natarajan'),
        reason: 'Left.',
        expectedRev: 1,
      }),
    ).rejects.toThrow(/already used/);
  });

  it('refuses a stale revision with the current one and changes nothing', async () => {
    const platform = await platformAfterB();
    const ia = asPerson(platform, 'Meera Iyer');
    const row = await grantRow(ia);
    const before = frozen(platform);
    const stale = await ia.studentAccess.withdrawGrant({
      grantId: row.grant.id,
      reason: 'Given individually by mistake.',
      expectedRev: row.grant.rev + 5,
    });
    expect(stale).toEqual({
      ok: false,
      error: { kind: 'stale-version', currentRev: row.grant.rev },
    });
    expect(frozen(platform)).toBe(before);
  });

  it('moves the record revision and the world version by one, with one history entry naming the changes', async () => {
    const platform = await platformAfterB();
    const ia = asPerson(platform, 'Meera Iyer');
    const row = await grantRow(ia);
    const events: ChangeEvent[] = [];
    const unsubscribe = platform.subscribe((event) => events.push(event));
    const version = platform.worldVersion();
    const history = worldOf(platform).history.length;
    const answer = await ia.studentAccess.withdrawGrant({
      grantId: row.grant.id,
      reason: 'Given individually by mistake.',
      expectedRev: row.grant.rev,
    });
    unsubscribe();
    if (!answer.ok) throw new Error('withdraw refused');
    expect(answer.value.rev).toBe(row.grant.rev + 1);
    expect(platform.worldVersion()).toBe(version + 1);
    const world = worldOf(platform);
    expect(world.history).toHaveLength(history + 1);
    const entry = world.history.at(-1)!;
    expect(entry).toMatchObject({
      worldVersion: version + 1,
      method: 'StudentAccessService.withdrawGrant',
      origin: 'command',
    });
    expect(entry.changed).toEqual(answer.changed);
    expect(events).toEqual([{ worldVersion: version + 1, changed: answer.changed }]);
    // The snapshot changed exactly where `changed` says.
    expect(snapshot(platform)[`SACC:${row.grant.id}`]).toMatchObject({ state: 'withdrawn' });
  });
});

describe('receipts survive a no-op, a planned failure and a new platform', () => {
  const DRAFT = {
    courseId: unsafeBrand<CourseId>('thermodynamics-heat-transfer'),
    name: 'Fin-Tube Bundle (draft)',
    summary: null,
    description: null,
    version: null,
    formats: [],
    delivery: {},
    preview: { label: null, link: null },
    documents: [],
  } as const;

  async function signedInAs(email: string) {
    const platform = createSamplePlatform({ world: await afterFlow('A') });
    const signIn = await platform.ports.session.signIn({
      method: 'email',
      email,
      password: 'any non-empty password',
    });
    if (!signIn.ok) throw new Error('sign-in refused');
    return platform;
  }

  it('answers a repeated command id of a no-op command with its first receipt, never running it again', async () => {
    const platform = createSamplePlatform({ world: await afterFlow('C') });
    setSampleNow(platform, ist('2026-10-27 10:00'));
    const created = await asPerson(platform, 'Dr S. Ranganathan').assessments.createAssessment({
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
    const signIn = await platform.ports.session.signIn({
      method: 'email',
      email: 'rahul.verma@godavari.edu.in',
      password: 'any non-empty password',
    });
    if (!signIn.ok) throw new Error('sign-in refused');
    const attempt = await platform.ports.assessments.startAttempt(created.value.id);
    if (!attempt.ok) throw new Error('start refused');
    const commandId = platform.newCommandId();
    // ST-13: an unanswered question saves nothing (no clearing rule is drawn).
    const blank = {
      attemptId: attempt.value.id,
      questionId: unsafeBrand<QuestionId>('Q-0101'),
      answer: null,
      expectedRev: attempt.value.rev,
    };
    const version = platform.worldVersion();
    const first = await platform.withCommandId(commandId).assessments.saveAnswer(blank);
    expect(first).toMatchObject({ ok: true, changed: [] });
    expect(platform.worldVersion()).toBe(version);
    // The attempt moves on, so running the same input again would now be stale.
    const answered = await platform.ports.assessments.saveAnswer({
      ...blank,
      answer: { type: 'multiple-choice', choice: 'A' },
    });
    expect(answered.ok).toBe(true);
    expect(await platform.withCommandId(commandId).assessments.saveAnswer(blank)).toEqual(first);
    expect(await platform.ports.assessments.saveAnswer(blank)).toMatchObject({
      ok: false,
      error: { kind: 'stale-version' },
    });
  });

  it('answers the receipt before a planned failure, which waits for the next new call', async () => {
    const platform = await signedInAs('anil.shetty@northline.example');
    const commandId = platform.newCommandId();
    const input = { id: null, content: DRAFT, step: 'course', expectedRev: null } as const;
    const first = await platform.withCommandId(commandId).production.saveDraft(input);
    if (!first.ok) throw new Error('draft refused');
    faults(platform).failNext('ProductionService.saveDraft');
    expect(await platform.withCommandId(commandId).production.saveDraft(input)).toEqual(first);
    expect(await platform.ports.production.saveDraft(input)).toEqual({
      ok: false,
      error: { kind: 'unavailable' },
    });
  });

  it('refuses a write to an existing record that names no revision as stale', async () => {
    const platform = await signedInAs('anil.shetty@northline.example');
    const created = await platform.ports.production.saveDraft({
      id: null,
      content: DRAFT,
      step: 'course',
      expectedRev: null,
    });
    if (!created.ok) throw new Error('draft refused');
    const before = frozen(platform);
    for (const write of [
      platform.ports.production.saveDraft({
        id: created.value.id,
        content: { ...DRAFT, summary: 'Changed without the revision.' },
        step: 'course',
        expectedRev: null,
      }),
      platform.ports.production.submitForReview({
        id: created.value.id,
        content: DRAFT,
        expectedRev: null,
      }),
    ]) {
      expect(await write).toEqual({
        ok: false,
        error: { kind: 'stale-version', currentRev: created.value.rev },
      });
    }
    expect(frozen(platform)).toBe(before);
  });

  it('continues command ids past every receipt a world keeps', async () => {
    const platform = createSamplePlatform({ world: await afterFlow('C') });
    const signIn = await platform.ports.session.signIn({
      method: 'email',
      email: 'rahul.verma@godavari.edu.in',
      password: 'any non-empty password',
    });
    if (!signIn.ok) throw new Error('sign-in refused');
    // Ids minted and never used, then a no-op (the lab brief is already opened, B3-01): its
    // receipt is kept with no history entry.
    for (let index = 0; index < 3; index += 1) platform.newCommandId();
    const kept = platform.newCommandId();
    const again = await platform
      .withCommandId(kept)
      .learning.openResource({ resourceId: unsafeBrand('res-shell-brief') });
    expect(again).toMatchObject({ ok: true, changed: [] });
    const next = createSamplePlatform({ world: worldOf(platform) });
    expect(Object.keys(worldOf(next).processedCommandIds)).toContain(kept);
    expect(worldOf(next).history.map((entry) => entry.commandId)).not.toContain(kept);
    const minted = Array.from({ length: 5 }, () => next.newCommandId());
    expect(minted).not.toContain(kept);
  });
});

describe('a call runs in the session it was made in', () => {
  it('takes sign-out in turn: a call made before it still runs as the signed-in person', async () => {
    const platform = await platformAfterB();
    const signIn = await platform.ports.session.signIn({
      method: 'email',
      email: 'meera.iyer@godavari.edu.in',
      password: 'any non-empty password',
    });
    expect(signIn.ok).toBe(true);
    const listed = platform.ports.studentAccess.listGrants({ showWithdrawn: false });
    const signedOut = platform.ports.session.signOut();
    expect((await listed).ok).toBe(true);
    expect((await signedOut).ok).toBe(true);
    expect(await platform.ports.session.getSession()).toMatchObject({ ok: true, value: null });
  });

  it('never runs a queued call as a person who signed in after it was made', async () => {
    const platform = await platformAfterB();
    const meera = await platform.ports.session.signIn({
      method: 'email',
      email: 'meera.iyer@godavari.edu.in',
      password: 'any non-empty password',
    });
    if (!meera.ok) throw new Error('sign-in refused');
    const context = internalsOf(platform).context;
    const session = context.session;
    context.session = null;
    const anonymous = platform.ports.studentAccess.listGrants({ showWithdrawn: false });
    context.session = session;
    expect(await anonymous).toEqual({ ok: false, error: { kind: 'not-signed-in' } });
    const ended = platform.ports.studentAccess.listGrants({ showWithdrawn: false });
    context.session = null;
    expect(await ended).toEqual({ ok: false, error: { kind: 'not-signed-in' } });
  });
});

describe('the actor comes from the records on every call', () => {
  it('applies a role-record change to the very next call (scope withdrawn → refused)', async () => {
    const platform = createSamplePlatform({ world: await afterFlow('A') });
    const admin = asPerson(platform, 'Arjun Mehta');
    const vendor = asPerson(platform, 'Anil Shetty');
    const holder = worldOf(platform).records.holders['role-anil-shetty']!;
    const scope = holder.scopes.find(
      (candidate) => candidate.target.kind === 'course' && candidate.withdrawal === null,
    )!;
    const withdrawn = await admin.platformRoles.withdrawScope({
      holderId: holder.id,
      scopeId: scope.id,
      reason: 'Thermodynamics content moves in-house.',
      expectedRev: holder.rev,
    });
    expect(withdrawn.ok).toBe(true);
    const draft = await vendor.production.saveDraft({
      id: null,
      content: {
        courseId: unsafeBrand('thermodynamics-heat-transfer'),
        name: 'Another wall',
        summary: null,
        description: null,
        version: null,
        formats: [],
        delivery: {},
        preview: { label: null, link: null },
        documents: [],
      },
      step: 'course',
      expectedRev: null,
    });
    expect(draft).toMatchObject({ ok: false, error: { kind: 'not-permitted' } });
  });

  it('answers wrong-workspace when a role calls another workspace’s method (no caller-supplied role)', async () => {
    const platform = await platformAfterB();
    const answer = await asPerson(platform, 'Rahul Verma').production.listAllContent({});
    expect(answer).toEqual({ ok: false, error: { kind: 'not-permitted', why: 'wrong-workspace' } });
  });
});

describe('fault injection and later-phase methods', () => {
  it('answers unavailable for a planned failure, then recovers (tests only)', async () => {
    const platform = await platformAfterB();
    const ia = asPerson(platform, 'Meera Iyer');
    faults(platform).failNext('StudentAccessService.listGrants');
    expect(await ia.studentAccess.listGrants({ showWithdrawn: false })).toEqual({
      ok: false,
      error: { kind: 'unavailable' },
    });
    expect((await ia.studentAccess.listGrants({ showWithdrawn: false })).ok).toBe(true);
  });

  it('builds the 139 WP-0.11 methods and every later one — the 3 Package-1B ones, the Package-1D one, the 4 Package-2A ones, the 5 Package-2B ones, the Phase-3 one, the 6 Phase-4A ones, the 8 Phase-4B ones, the 7 Phase-5 ones and the 9 Phase-6 ones', async () => {
    const platform = await platformAfterB();
    const ports = platform.ports as unknown as Record<
      string,
      Record<string, (...args: unknown[]) => Promise<unknown>>
    >;
    const rows = ledgerRows();
    const later = rows.filter((row) => row.mock !== 'WP-0.11');
    expect(rows.length - later.length).toBe(139);
    expect(later).toHaveLength(44);
    const delivered = later.filter((row) =>
      (DELIVERED_METHODS as readonly string[]).includes(row.id),
    );
    expect(delivered.map((row) => row.id)).toEqual([
      'CatalogueService.listAreas',
      'CatalogueService.getArea',
      'CatalogueService.getCourse',
      'InstitutionService.listInstitutions',
      'InstitutionService.getMyOverview',
      'PeopleService.listStudents',
      'PeopleService.previewStudentImport',
      'PeopleService.listFaculty',
      'PeopleService.getFaculty',
      'GroupService.listGroups',
      'GroupService.getGroup',
      'FacultyCourseService.list',
      'InstitutionCourseCodeService.list',
      'LearningService.getSimulationChooser',
      'AssessmentService.listAssessments',
      'AssessmentService.getCreateOptions',
      'AssessmentService.previewAsStudent',
      'AssessmentService.exportSubmissionsCsv',
      'QuestionBankService.requestDrafts',
      'QuestionBankService.listDrafts',
      'QuestionBankService.addDraftToBank',
      'QuestionBankService.discardDraft',
      'QuestionBankService.previewQuestionImport',
      'QuestionBankService.commitQuestionImport',
      'TeachingService.getFacultyOverview',
      'TeachingService.listMyCourses',
      'TeachingService.getTeachingExperiment',
      'TeachingService.exportStudentsCsv',
      'ProductionService.getVendorOverview',
      'ProductionService.listMyExperiments',
      'ProductionService.getEditor',
      'ProductionService.getReviewerOverview',
      'ProductionService.getContentManagerOverview',
      'ProductionService.getLibrary',
      'CorrectionService.listUpdates',
      'CorrectionService.listUpdatesForRelease',
      'AcademicStructureService.getArea',
      'AcademicStructureService.getCourse',
      'PlatformCourseCodeService.list',
      'PlatformRoleService.listHolders',
      'PlatformRoleService.getHolder',
      'OperationsService.listSupportReports',
      'OperationsService.listAccessEnding',
      'OperationsService.getSuperAdminOverview',
    ]);
    for (const row of delivered) {
      // Delivered by Packages 1B, 1D, 2A, 2B and Phases 3 … 6: answered (a Result), never rejected.
      await expect(ports[row.portKey]![row.method]!(undefined), row.id).resolves.toHaveProperty(
        'ok',
      );
    }
    // Phase 6 completes the ledger: no method is left to a later phase.
    expect(later.filter((row) => !delivered.includes(row))).toEqual([]);
  });

  it('never stubs a built method: `deferred` refuses a WP-0.11 or delivered method', () => {
    expect(() => deferred('CorrectionService.releaseUpdate')).toThrow(/WP-0.11 method/);
    expect(() => deferred('CorrectionService.listUpdatesForRelease')).toThrow(/was delivered/);
    expect(() => deferred('OperationsService.getSuperAdminOverview')).toThrow(/was delivered/);
  });
});
