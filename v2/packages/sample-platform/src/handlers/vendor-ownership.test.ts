/**
 * Vendor ownership and course permission on the sample adapter — owner decisions of 27 Oct 2026
 * (Vendor ownership audit, correction A): PD-1 ownership is the person who created the record (a
 * colleague of the same studio meets "not your record", like any other Vendor); PD-2 for a Vendor,
 * "All experiments" means any existing course, now and later; PD-3 registration may start a
 * Vendor with "Any course", and no scope — none, or every one withdrawn — is never unrestricted;
 * PD-4 a one-experiment scope is never given to a Vendor and one already held grants nothing.
 */
import { editorOutput } from '@xr/contracts/draft';
import {
  type CourseId,
  type PlatformRoleHolder,
  type RoleHolderId,
  type ScopeId,
  type Submission,
  type SubmissionId,
  unsafeBrand,
} from '@xr/domain';
import { describe, expect, it, onTestFinished } from 'vitest';

import { createSamplePlatform, type SamplePlatform } from '../index.js';
import { asPerson, asPersonId, worldOf } from '../testing/index.js';

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function errorOf(answer: { readonly ok: boolean; readonly error?: unknown }) {
  expect(answer.ok).toBe(false);
  return (answer as { readonly error: { readonly kind: string } }).error;
}

const SA = 'Arjun Mehta';
const ANIL = 'Anil Shetty';
const NORTHLINE = 'Northline Simulation Studio';
const id = (value: string) => unsafeBrand<SubmissionId>(value);

function courseId(platform: SamplePlatform, code: string): CourseId {
  return Object.values(worldOf(platform).records.courses).find(
    (course) => course.platformCode === code,
  )!.id;
}

async function register(
  platform: SamplePlatform,
  name: string,
  organisation: string,
  anyCourse?: boolean,
): Promise<PlatformRoleHolder> {
  return ok(
    await asPerson(platform, SA).platformRoles.registerHolder({
      role: 'vendor',
      name,
      workEmail: `${name.toLowerCase()}@studio.example`,
      organisation,
      ...(anyCourse === undefined ? {} : { anyCourse }),
    }),
  );
}

async function assign(
  platform: SamplePlatform,
  holder: PlatformRoleHolder,
  target:
    | { readonly kind: 'all' }
    | { readonly kind: 'course'; readonly courseId: CourseId }
    | { readonly kind: 'experiment'; readonly experimentId: string },
) {
  return asPerson(platform, SA).platformRoles.assignScope({
    holderId: holder.id,
    target: target as never,
    expectedRev: worldOf(platform).records.holders[holder.id]!.rev,
  });
}

function holderNamed(platform: SamplePlatform, name: string): PlatformRoleHolder {
  return Object.values(worldOf(platform).records.holders).find((holder) => holder.name === name)!;
}

/** A Vendor's new experiment content under a course (enough for a draft save). */
function content(platform: SamplePlatform, course: CourseId, name: string) {
  const seed = worldOf(platform).records.submissions['SUB-0079' as SubmissionId] as Submission;
  return { ...seed.content, courseId: course, name };
}

describe('PD-1: a Vendor sees and opens only their own records', () => {
  it('a same-studio colleague and another studio meet the same answer: not your record', async () => {
    const platform = createSamplePlatform();
    const cora = await register(platform, 'Cora', NORTHLINE);
    ok(await assign(platform, cora, { kind: 'course', courseId: courseId(platform, 'ME ZG523') }));
    const colleague = asPersonId(platform, cora.personId);
    expect(ok(await colleague.production.listMyExperiments({}))).toEqual([]);
    const overview = ok(await colleague.production.getVendorOverview());
    expect(overview.hasExperiments).toBe(false);
    const ritu = asPerson(platform, 'Ritu Sharma');
    for (const record of ['SUB-0079', 'SUB-0081', 'SUB-0052', 'SUB-0083']) {
      for (const vendor of [colleague, ritu]) {
        expect(errorOf(await vendor.production.getRecord(id(record)))).toEqual({
          kind: 'not-permitted',
          why: 'not-own-record',
        });
        expect(
          errorOf(await vendor.production.getEditor({ id: id(record), step: 'course' })),
        ).toEqual({ kind: 'not-permitted', why: 'not-own-record' });
      }
    }
    // No write reaches Anil's returned record either.
    const anilReturned = worldOf(platform).records.submissions[id('SUB-0081')]!;
    expect(
      errorOf(
        await colleague.production.saveRevision({
          id: id('SUB-0081'),
          content: anilReturned.content as never,
          expectedRev: anilReturned.rev,
        }),
      ),
    ).toEqual({ kind: 'not-permitted', why: 'not-own-record' });
    // Anil still reads every one of his own, in every status.
    const anil = asPerson(platform, ANIL);
    expect(ok(await anil.production.listMyExperiments({})).map((row) => row.submission.id)).toEqual(
      ['SUB-0079', 'SUB-0081', 'SUB-0074', 'SUB-0083', 'SUB-0052'],
    );
  });
});

describe('PD-2: "All experiments" is any existing course for a Vendor', () => {
  it('Anil given All experiments keeps his records and may create under any course', async () => {
    const platform = createSamplePlatform();
    ok(await assign(platform, holderNamed(platform, ANIL), { kind: 'all' }));
    const anil = asPerson(platform, ANIL);
    const overview = ok(await anil.production.getVendorOverview());
    // The draft under the withdrawn MEL ZG512 is covered again by "any course": offered to finish.
    expect(overview.attention.map((row) => row.submissionId)).toEqual([
      'SUB-0081',
      'SUB-0083',
      'SUB-0079',
    ]);
    expect(ok(await anil.production.listMyExperiments({}))).toHaveLength(5);
    const record = ok(await anil.production.getRecord(id('SUB-0081')));
    expect(record.submission.id).toBe('SUB-0081');
    // Every existing course is offered, and the withdrawn-course draft opens editable again.
    const editor = ok(await anil.production.getEditor({ id: null, step: 'course' }));
    expect(editorOutput.safeParse(editor).success).toBe(true);
    expect(editor.assignedCourses).toHaveLength(
      Object.keys(worldOf(platform).records.courses).length,
    );
    const che = courseId(platform, 'CHE ZG513');
    const saved = ok(
      await anil.production.saveDraft({
        id: null,
        content: content(platform, che, 'Packed Column Absorption') as never,
        step: 'course',
        expectedRev: null,
      }),
    );
    expect(saved.content.courseId).toBe(che);
    expect(saved.vendorHolderId).toBe(holderNamed(platform, ANIL).id);
    // A course that does not exist is refused with the drawn course rule.
    const answer = await anil.production.saveDraft({
      id: null,
      content: content(platform, unsafeBrand<CourseId>('course-none'), 'Ghost Lab') as never,
      step: 'course',
      expectedRev: null,
    });
    expect(errorOf(answer).kind).toBe('validation-failed');
  });

  it('All experiments never reaches another Vendor’s record', async () => {
    const platform = createSamplePlatform();
    const alan = await register(platform, 'Alan', 'Harbour Labs', true);
    const vendor = asPersonId(platform, alan.personId);
    expect(ok(await vendor.production.listMyExperiments({}))).toEqual([]);
    for (const record of ['SUB-0081', 'SUB-0070', 'SUB-0086']) {
      expect(errorOf(await vendor.production.getRecord(id(record)))).toEqual({
        kind: 'not-permitted',
        why: 'not-own-record',
      });
    }
  });
});

describe('PD-3: registration may start with Any course; no scope is never unrestricted', () => {
  it('Any course at registration: the scope is written with it, in the history', async () => {
    const platform = createSamplePlatform();
    const holder = await register(platform, 'Nina', 'Delta Studio', true);
    expect(holder.scopes.map((scope) => scope.target)).toEqual([{ kind: 'all' }]);
    expect(holder.history.map((entry) => entry.event)).toEqual(['registered', 'scope-assigned']);
    const editor = ok(
      await asPersonId(platform, holder.personId).production.getEditor({
        id: null,
        step: 'course',
      }),
    );
    expect(editor.assignedCourses.length).toBeGreaterThan(1);
  });

  it('not chosen: no scope, nothing to start; other roles ignore the choice', async () => {
    const platform = createSamplePlatform();
    const sana = await register(platform, 'Sana', NORTHLINE, false);
    expect(sana.scopes).toEqual([]);
    const vendor = asPersonId(platform, sana.personId);
    expect(errorOf(await vendor.production.getEditor({ id: null, step: 'course' }))).toEqual({
      kind: 'not-permitted',
      why: 'out-of-scope',
    });
    expect(ok(await vendor.production.getVendorOverview()).hasExperiments).toBe(false);
    const reviewer = ok(
      await asPerson(platform, SA).platformRoles.registerHolder({
        role: 'academic_reviewer',
        name: 'Dr Q. Rao',
        workEmail: 'q.rao@wilp.example',
        organisation: 'BITS Pilani',
        anyCourse: true,
      }),
    );
    expect(reviewer.scopes).toEqual([]);
  });

  it('every scope withdrawn: own records stay readable, nothing new and no draft edits', async () => {
    const platform = createSamplePlatform();
    const holder = await register(platform, 'Ira', 'Delta Studio', true);
    const vendor = asPersonId(platform, holder.personId);
    const me = courseId(platform, 'ME ZG523');
    const draft = ok(
      await vendor.production.saveDraft({
        id: null,
        content: content(platform, me, 'Heat Pipe Bench') as never,
        step: 'course',
        expectedRev: null,
      }),
    );
    const current = worldOf(platform).records.holders[holder.id]!;
    ok(
      await asPerson(platform, SA).platformRoles.withdrawScope({
        holderId: unsafeBrand<RoleHolderId>(holder.id),
        scopeId: unsafeBrand<ScopeId>(current.scopes[0]!.id),
        reason: 'Contract paused',
        expectedRev: current.rev,
      }),
    );
    // Readable, read-only; not offered to finish; nothing new can start.
    const record = ok(await vendor.production.getRecord(draft.id));
    expect(record.guards.courseNoLongerAssigned).toBe(true);
    const editor = ok(await vendor.production.getEditor({ id: draft.id, step: 'course' }));
    expect(editor.readOnly).toBe(true);
    expect(editor.assignedCourses).toEqual([]);
    expect(ok(await vendor.production.getVendorOverview()).attention).toEqual([]);
    expect(errorOf(await vendor.production.getEditor({ id: null, step: 'course' }))).toEqual({
      kind: 'not-permitted',
      why: 'out-of-scope',
    });
    const refused = await vendor.production.saveDraft({
      id: draft.id,
      content: content(platform, me, 'Heat Pipe Bench v2') as never,
      step: 'course',
      expectedRev: worldOf(platform).records.submissions[draft.id]!.rev,
    });
    expect(errorOf(refused).kind).not.toBe('policy-open');
    expect(refused.ok).toBe(false);
  });
});

describe('PD-4: a one-experiment scope is never given to a Vendor', () => {
  it('refused for a Vendor, still assigned to a reviewer', async () => {
    const platform = createSamplePlatform();
    const anil = holderNamed(platform, ANIL);
    const experimentId = Object.keys(worldOf(platform).records.experiments)[0]!;
    const refused = await assign(platform, anil, { kind: 'experiment', experimentId });
    expect(errorOf(refused)).toMatchObject({ kind: 'validation-failed' });
    expect(
      ok(
        await assign(platform, holderNamed(platform, 'Prof. A. Menon'), {
          kind: 'experiment',
          experimentId,
        }),
      ).scopes.some((scope) => scope.target.kind === 'experiment'),
    ).toBe(true);
  });

  it('one already held (an earlier world) grants nothing and does not block a course scope', async () => {
    const platform = createSamplePlatform();
    const anil = holderNamed(platform, ANIL);
    const experimentId = Object.keys(worldOf(platform).records.experiments)[0]!;
    // As saved by an earlier build, before PD-4.
    const records = worldOf(platform).records as { holders: Record<string, PlatformRoleHolder> };
    // The seed's records may be shared with later tests: put Anil back afterwards.
    onTestFinished(() => {
      records.holders[anil.id] = anil;
    });
    records.holders[anil.id] = {
      ...anil,
      scopes: [
        ...anil.scopes,
        {
          id: unsafeBrand<ScopeId>('scope-old-experiment'),
          target: { kind: 'experiment', experimentId: unsafeBrand(experimentId) },
          assignedAt: anil.registeredAt,
          assignedBy: anil.registeredBy,
          withdrawal: null,
          supersededAt: null,
        },
      ],
    };
    const vendor = asPerson(platform, ANIL);
    const editor = ok(await vendor.production.getEditor({ id: null, step: 'course' }));
    expect(editor.assignedCourses.map((course) => course.platformCode)).toEqual(['ME ZG523']);
    expect(ok(await vendor.production.listMyExperiments({}))).toHaveLength(5);
  });
});

describe('PD-5: the Engineering area, then the course (correction B)', () => {
  const MECH = 'mechanical-manufacturing';
  const ELEC = 'electrical-electronics';
  const CHEM = 'chemical-process';

  it('Any course: every area with its courses, in the structure’s order, each course with its area', async () => {
    const platform = createSamplePlatform();
    const holder = await register(platform, 'Nina', 'Delta Studio', true);
    const editor = ok(
      await asPersonId(platform, holder.personId).production.getEditor({
        id: null,
        step: 'course',
      }),
    );
    expect(editorOutput.safeParse(editor).success).toBe(true);
    // The course hint says “any existing course” (PC-77).
    expect(editor.anyCourse).toBe(true);
    expect(editor.areas.map((area) => area.id)).toEqual([MECH, ELEC, CHEM]);
    expect(editor.assignedCourses.map((course) => [course.areaId, course.platformCode])).toEqual([
      [MECH, 'ME ZG523'],
      [MECH, 'MEL ZG512'],
      [MECH, null],
      [ELEC, 'EEE ZC341'],
      [ELEC, 'EEE ZG512'],
      [CHEM, 'CHE ZG513'],
    ]);
  });

  it('course-restricted: only the areas and courses the scopes cover (one area for Anil, two for Ritu)', async () => {
    const platform = createSamplePlatform();
    const anil = ok(
      await asPerson(platform, ANIL).production.getEditor({ id: null, step: 'course' }),
    );
    // Course scopes only: the hint states the restriction (PC-77).
    expect(anil.anyCourse).toBe(false);
    expect(anil.areas).toEqual([{ id: MECH, name: 'Mechanical & Manufacturing' }]);
    expect(anil.assignedCourses.map((course) => [course.areaId, course.platformCode])).toEqual([
      [MECH, 'ME ZG523'],
    ]);
    const ritu = ok(
      await asPerson(platform, 'Ritu Sharma').production.getEditor({ id: null, step: 'course' }),
    );
    expect(ritu.anyCourse).toBe(false);
    expect(ritu.areas.map((area) => area.id)).toEqual([ELEC, CHEM]);
    expect(ritu.assignedCourses.map((course) => course.platformCode)).toEqual([
      'EEE ZC341',
      'CHE ZG513',
    ]);
  });

  it('a moved course follows its new area; a draft under it keeps its course and is read with the new area', async () => {
    const platform = createSamplePlatform();
    const holder = await register(platform, 'Ira', 'Delta Studio', true);
    const vendor = asPersonId(platform, holder.personId);
    const che = courseId(platform, 'CHE ZG513');
    const draft = ok(
      await vendor.production.saveDraft({
        id: null,
        content: content(platform, che, 'Packed Column Absorption') as never,
        step: 'course',
        expectedRev: null,
      }),
    );
    ok(
      await asPerson(platform, SA).academicStructure.moveCourse({
        courseId: che,
        toAreaId: MECH as never,
        expectedRev: worldOf(platform).records.courses[che]!.rev,
      }),
    );
    const editor = ok(await vendor.production.getEditor({ id: draft.id, step: 'course' }));
    expect(editor.submission!.content.courseId).toBe(che);
    expect(editor.assignedCourses.find((course) => course.id === che)!.areaId).toBe(MECH);
    expect(editor.areas.map((area) => area.id)).toEqual([MECH, ELEC]);
    expect(editor.readOnly).toBe(false);
    // The record keeps the course only: no area field is written.
    expect(Object.keys(worldOf(platform).records.submissions[draft.id]!.content)).not.toContain(
      'areaId',
    );
  });

  it('a submission classified under another area reaches the reviewer covering that course, then the Content Manager', async () => {
    const platform = createSamplePlatform();
    const holder = await register(platform, 'Nina', 'Delta Studio', true);
    const vendor = asPersonId(platform, holder.personId);
    const che = courseId(platform, 'CHE ZG513');
    const sent = ok(
      await vendor.production.submitForReview({
        id: null,
        content: {
          courseId: che,
          name: 'Packed Column Absorption',
          summary: 'Absorption of a gas into a liquid in a packed column.',
          description: 'Learners vary the liquid flow and read the outlet concentration.',
          version: '1.0',
          formats: ['web'],
          delivery: {
            web: {
              format: 'web',
              webLink: 'https://labs.delta.example/packed-column',
              browserAndComputer: 'A current browser on a laptop or desktop.',
              notes: null,
            },
          },
          preview: { label: null, link: null },
          documents: [],
        } as never,
        expectedRev: null,
      }),
    );
    expect(sent.content.courseId).toBe(che);
    expect(sent.vendorHolderId).toBe(holder.id);
    // Prof. A. Menon covers CHE ZG513: it is in his queue.
    const reviewer = asPerson(platform, 'Prof. A. Menon');
    expect(
      ok(await reviewer.production.getReviewQueue({})).some((item) => item.ref.id === sent.id),
    ).toBe(true);
    const approved = ok(
      await reviewer.production.approveSubmission({
        id: sent.id,
        outcomes: ['Explain how liquid flow changes absorption.'],
        expectedRev: sent.rev,
      }),
    );
    expect(approved.status.state).toBe('with-content-manager');
    const ready = ok(await asPerson(platform, 'Kavya Nair').production.listReadyToPublish());
    expect(ready.find((row) => row.submission.id === sent.id)?.submission.content.courseId).toBe(
      che,
    );
    // Still the creator's alone among Vendors.
    expect(errorOf(await asPerson(platform, ANIL).production.getRecord(sent.id))).toEqual({
      kind: 'not-permitted',
      why: 'not-own-record',
    });
  });
});
