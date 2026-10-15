/**
 * Phase-2 Package 2A — regressions from the independent review: a Student waiting for a licence
 * reads the closure beside the formats it was given (PC-45; B3-02 "No licence is available for you
 * on ACC-0107 right now."), IA-01 counts the students waiting as IA-04 reads them (an inactive
 * student is not waiting), and a course whose institution code was cleared has no code.
 */
import { type PersonId, unsafeBrand } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { createSamplePlatform } from '../index.js';
import { asPerson, asPersonId, fixtureWorld } from '../testing/index.js';

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

const SHELL = 'shell-and-tube-heat-exchanger';

async function laterSample() {
  return createSamplePlatform({ world: await fixtureWorld('later-sample') });
}

async function studentNamed(platform: Awaited<ReturnType<typeof laterSample>>, name: string) {
  const rows = ok(await asPerson(platform, 'Meera Iyer').people.listStudents({ search: name }));
  const row = rows.find((candidate) => candidate.student.fullName === name);
  if (!row) throw new Error(`no student ${name}`);
  return row.student;
}

describe('a Student waiting for a licence (later sample, supplied waits only)', () => {
  it('reads the formats it was given beside the closure that names the plan', async () => {
    const platform = await laterSample();
    const fatima = await studentNamed(platform, 'Fatima Begum');
    const ports = asPersonId(platform, fatima.id as PersonId);
    const hub = ok(await ports.studentAccess.getExperimentHub(unsafeBrand(SHELL)));
    expect(hub.row.closure).toEqual({ kind: 'waiting-for-a-licence', planId: 'ACC-0107' });
    const rahul = asPerson(platform, 'Rahul Verma');
    const own = await rahul.studentAccess.getExperimentHub(unsafeBrand(SHELL));
    // Rahul's overlap is the open decision, never a closure.
    if (own.ok) expect(own.value.row.closure).toBeNull();
  });

  it('names no closure for an experiment the Student can open', async () => {
    const platform = await createSamplePlatform({ world: await fixtureWorld('after-flow-b') });
    const hub = ok(
      await asPerson(platform, 'Rahul Verma').studentAccess.getExperimentHub(unsafeBrand(SHELL)),
    );
    expect(hub.row.closure).toBeNull();
  });
});

describe('IA-01 “N students are waiting for a licence”', () => {
  it('counts the students IA-04 reads as waiting: a deactivated one is no longer waiting', async () => {
    const platform = await laterSample();
    const meera = asPerson(platform, 'Meera Iyer');
    const waitingOf = async () =>
      ok(await meera.institutions.getMyOverview()).attention.find(
        (item) => item.kind === 'students-waiting-for-a-licence',
      );
    const before = await waitingOf();
    const grants = ok(await meera.studentAccess.listGrants({ showWithdrawn: false }));
    const waitingRows = grants.filter((row) => row.display === 'waiting-for-a-licence');
    expect(before?.kind === 'students-waiting-for-a-licence' && before.students).toBe(
      new Set(waitingRows.map((row) => row.student.id)).size,
    );
    const arun = await studentNamed(platform, 'Arun Kumar');
    const record = ok(await meera.people.getStudent(arun.id));
    ok(
      await meera.people.deactivateStudent({
        id: arun.id,
        reason: 'Left the programme.',
        expectedRev: record.student.rev,
      }),
    );
    const after = await waitingOf();
    const stillWaiting = ok(await meera.studentAccess.listGrants({ showWithdrawn: false })).filter(
      (row) => row.display === 'waiting-for-a-licence',
    );
    expect(after?.kind === 'students-waiting-for-a-licence' ? after.students : 0).toBe(
      new Set(stillWaiting.map((row) => row.student.id)).size,
    );
    expect(stillWaiting.some((row) => row.student.id === arun.id)).toBe(false);
  });
});

describe('IA-01 “has no course code from your institution”', () => {
  it('reads a cleared code as no code', async () => {
    const platform = await createSamplePlatform({ world: await fixtureWorld('after-setup') });
    const meera = asPerson(platform, 'Meera Iyer');
    const codeItem = async () =>
      ok(await meera.institutions.getMyOverview()).attention.find(
        (item) => item.kind === 'course-without-code',
      );
    expect(await codeItem()).toBeUndefined();
    const listed = ok(await meera.institutions.listContentAccess());
    const row = listed[0]!;
    ok(
      await meera.institutionCourseCodes.set({
        courseId: row.course.id,
        code: null,
        semester: null,
        expectedRev: row.institutionCode!.rev,
      }),
    );
    expect(await codeItem()).toMatchObject({ kind: 'course-without-code' });
  });
});
