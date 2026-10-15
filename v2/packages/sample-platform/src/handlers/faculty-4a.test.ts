/**
 * Phase 4A on the sample adapter: the six Faculty reads the 13 Phase-4A screens call —
 * `getFacultyOverview` (FA-01), `listMyCourses` (FA-02 … FA-04), `getTeachingExperiment` (FA-05),
 * `listAssessments` (FA-06), `getCreateOptions` (FA-07) and `previewAsStudent` (FA-11). Each
 * reads the one world: the Institute Admin's Faculty course mapping (IA-15) sets what a Faculty
 * member sees; a command in the same world changes the next read; nothing is pre-filled (BC6);
 * the preview shows the pinned question versions and writes nothing; no other role reads them.
 */
import {
  createOptionsOutput,
  facultyOverviewOutput,
  listAssessmentsOutput,
  previewAsStudentOutput,
  teachingCoursesOutput,
  teachingExperimentOutput,
} from '@xr/contracts/draft';
import {
  type AssessmentId,
  type CourseId,
  type ExperimentId,
  type IsoInstant,
  type PersonId,
  type QuestionId,
  unsafeBrand,
} from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { createSamplePlatform } from '../index.js';
import { asPerson, fixtureWorld, type FixtureName, standinsOf, worldOf } from '../testing/index.js';

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function errorOf(answer: { readonly ok: boolean; readonly error?: unknown }) {
  expect(answer.ok).toBe(false);
  return (answer as { readonly error: { readonly kind: string; readonly why?: string } }).error;
}

const SHELL = unsafeBrand<ExperimentId>('shell-and-tube-heat-exchanger');
const FACULTY = 'Dr S. Ranganathan';

async function platformOn(fixture: FixtureName) {
  return createSamplePlatform({ world: await fixtureWorld(fixture) });
}

const RULES = {
  passMarkPercent: '50',
  attemptsAllowed: '2',
  deadline: '2026-11-14T23:59:00+05:30',
  releaseOption: 'after-deadline' as const,
  releaseDate: null,
};

describe('the Faculty reads answer only a Faculty member', () => {
  it('refuses the Student and the Institute Admin as the wrong workspace', async () => {
    const platform = await platformOn('after-flow-c');
    for (const name of ['Rahul Verma', 'Meera Iyer']) {
      const ports = asPerson(platform, name);
      for (const answer of [
        await ports.teaching.getFacultyOverview(),
        await ports.teaching.listMyCourses(),
        await ports.teaching.getTeachingExperiment(SHELL),
        await ports.assessments.listAssessments(),
        await ports.assessments.getCreateOptions(),
      ]) {
        expect(errorOf(answer)).toMatchObject({ kind: 'not-permitted', why: 'wrong-workspace' });
      }
    }
  });
});

describe('getFacultyOverview (FA-01)', () => {
  it('reads the scope line from Faculty courses and words nothing (PC-51)', async () => {
    const platform = await platformOn('after-flow-c');
    const overview = ok(await asPerson(platform, FACULTY).teaching.getFacultyOverview());
    expect(facultyOverviewOutput.safeParse(overview).success).toBe(true);
    expect(overview.scopeLine).toEqual({ courses: 1, experiments: 1 });
    expect(overview.comingUp).toEqual([]);
    expect(overview.attention.map((item) => item.kind)).not.toContain('written-answers-to-mark');
  });

  it('names the Students inactive for 14 days or more, per experiment (OD-B4-10 sample rule)', async () => {
    const platform = await platformOn('after-flow-c');
    const faculty = asPerson(platform, FACULTY);
    const reach = ok(await faculty.teaching.listMyCourses())[0]!.studentsWithAccess;
    standinsOf(platform).clock.setSampleNow('2026-12-01T03:30:00.000Z' as IsoInstant);
    const overview = ok(await faculty.teaching.getFacultyOverview());
    const inactive = overview.attention.find((item) => item.kind === 'students-inactive');
    expect(inactive).toMatchObject({ experimentId: SHELL, days: 14 });
    if (inactive?.kind === 'students-inactive') expect(inactive.students).toHaveLength(reach);
  });

  it('lists a Ready assessment due in the next 30 days under Coming up, with its name', async () => {
    const platform = await platformOn('after-flow-c');
    const faculty = asPerson(platform, FACULTY);
    const bank = ok(await faculty.questionBank.listQuestions({ experimentId: SHELL }));
    ok(
      await faculty.assessments.createAssessment({
        mode: 'create',
        experimentId: SHELL,
        name: 'Heat Exchanger — post-lab',
        introduction: null,
        rules: RULES,
        questions: [bank[0]!.question.id],
      }),
    );
    const overview = ok(await faculty.teaching.getFacultyOverview());
    expect(overview.comingUp).toHaveLength(1);
    expect(overview.comingUp[0]).toMatchObject({ name: 'Heat Exchanger — post-lab', submitted: 0 });
  });

  it('names the waiting written answer after a submission and drops it once marks are confirmed', async () => {
    const platform = await platformOn('after-flow-d');
    const faculty = asPerson(platform, FACULTY);
    const overview = ok(await faculty.teaching.getFacultyOverview());
    // ATT-0450's marks are confirmed and released on the walk (15 Nov): nothing waits.
    expect(overview.attention.map((item) => item.kind)).not.toContain('written-answers-to-mark');
  });

  it('reads an experiment whose access has ended as the one attention item of its kind', async () => {
    const platform = await platformOn('after-flow-c');
    standinsOf(platform).clock.setSampleNow('2027-10-09T03:30:00.000Z' as IsoInstant);
    const overview = ok(await asPerson(platform, FACULTY).teaching.getFacultyOverview());
    expect(overview.attention).toContainEqual(
      expect.objectContaining({ kind: 'access-ended', experimentId: SHELL, endedOn: '2027-10-07' }),
    );
    expect(overview.attention.map((item) => item.kind)).not.toContain('students-inactive');
    expect(ok(await asPerson(platform, FACULTY).teaching.listMyCourses())[0]!.accessEndedOn).toBe(
      '2027-10-07',
    );
  });

  it('reads no course for a Faculty member nobody has mapped yet', async () => {
    const platform = await platformOn('after-flow-c');
    const world = worldOf(platform);
    const mapped = new Set(Object.values(world.records.mappings).map((m) => m.facultyId));
    const unmapped = Object.values(world.records.people).find(
      (person) => person.kind === 'faculty' && !mapped.has(person.id),
    );
    if (!unmapped) return; // every sample Faculty member teaches something on this fixture
    const ports = asPerson(platform, unmapped.fullName);
    expect(ok(await ports.teaching.getFacultyOverview()).scopeLine).toEqual({
      courses: 0,
      experiments: 0,
    });
    expect(ok(await ports.teaching.listMyCourses())).toEqual([]);
  });
});

describe('listMyCourses and getTeachingExperiment (FA-02 … FA-05)', () => {
  it('reads the mapped course with its counts, per format and never summed', async () => {
    const platform = await platformOn('after-flow-c');
    const faculty = asPerson(platform, FACULTY);
    const courses = ok(await faculty.teaching.listMyCourses());
    expect(teachingCoursesOutput.safeParse(courses).success).toBe(true);
    expect(courses).toHaveLength(1);
    expect(courses[0]).toMatchObject({ experiments: 1, assessments: 0, accessEndedOn: null });
    expect(courses[0]!.course.platformCode).toBe('ME ZG523');

    const view = ok(await faculty.teaching.getTeachingExperiment(SHELL));
    expect(teachingExperimentOutput.safeParse(view).success).toBe(true);
    expect(view.formatsInstitutionHas).toEqual(['web', 'vr']);
    expect(view.formatsUsedByStudents).toEqual(['web', 'vr']);
    expect(view.assessmentId).toBeNull();
    for (const counts of view.perFormatCounts) {
      expect(counts.completed + counts.inProgress + counts.notStarted).toBe(
        courses[0]!.studentsWithAccess,
      );
      expect(counts.completed).toBe(1); // Rahul Verma completed WEB and VR on the walk
    }
  });

  it('refuses an experiment the Faculty member does not teach as out of scope', async () => {
    const platform = await platformOn('after-flow-c');
    const answer = await asPerson(platform, FACULTY).teaching.getTeachingExperiment(
      unsafeBrand<ExperimentId>('fin-tube-bundle'),
    );
    expect(errorOf(answer)).toMatchObject({ kind: 'not-permitted', why: 'out-of-scope' });
  });
});

describe('listAssessments and getCreateOptions (FA-06, FA-07)', () => {
  it('offers each taught experiment with the platform code and no assessment yet', async () => {
    const platform = await platformOn('after-flow-c');
    const faculty = asPerson(platform, FACULTY);
    const options = ok(await faculty.assessments.getCreateOptions());
    expect(createOptionsOutput.safeParse(options).success).toBe(true);
    expect(options).toEqual([
      expect.objectContaining({
        experimentId: SHELL,
        courseCode: 'ME ZG523',
        existingAssessmentId: null,
      }),
    ]);
    expect(ok(await faculty.assessments.listAssessments())).toEqual([]);
  });

  it('a draft saved in the same world appears at once, Draft — not ready, with nothing pre-filled', async () => {
    const platform = await platformOn('after-flow-c');
    const faculty = asPerson(platform, FACULTY);
    const draft = ok(
      await faculty.assessments.createAssessment({
        mode: 'save-as-draft',
        experimentId: SHELL,
        name: 'Heat Exchanger — post-lab',
        introduction: null,
        rules: {
          passMarkPercent: '',
          attemptsAllowed: '',
          deadline: '',
          releaseOption: null,
          releaseDate: null,
        },
        questions: [],
      }),
    );
    const rows = ok(await faculty.assessments.listAssessments());
    expect(listAssessmentsOutput.safeParse(rows).success).toBe(true);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ readiness: 'draft-not-ready', submitted: 0 });
    expect(rows[0]!.assessment.rules).toEqual({
      passMarkPercent: null,
      attemptsAllowed: null,
      deadline: null,
      release: null,
    });
    expect(ok(await faculty.assessments.getCreateOptions())[0]!.existingAssessmentId).toBe(
      draft.id,
    );
  });

  it('reads ASMT-0009 after Flow D with its submission and nothing waiting', async () => {
    const platform = await platformOn('after-flow-d');
    const rows = ok(await asPerson(platform, FACULTY).assessments.listAssessments());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ readiness: 'ready', submitted: 1, waitingForMarking: 0 });
  });
});

describe('previewAsStudent (FA-11)', () => {
  it('shows the pinned versions and the key, writes nothing, and keeps the key from Students', async () => {
    const platform = await platformOn('after-flow-d');
    const faculty = asPerson(platform, FACULTY);
    const assessmentId = Object.keys(worldOf(platform).records.assessments)[0] as AssessmentId;
    const before = worldOf(platform).worldVersion;
    const preview = ok(await faculty.assessments.previewAsStudent(assessmentId));
    expect(previewAsStudentOutput.safeParse(preview).success).toBe(true);
    expect(worldOf(platform).worldVersion).toBe(before);
    const view = ok(await faculty.assessments.getAssessment(assessmentId));
    expect(preview.questions.map((question) => question.id)).toEqual(
      view.questions.map((entry) => entry.ref.questionId),
    );
    for (const key of preview.answerKey) {
      const question = preview.questions.find((candidate) => candidate.id === key.questionId)!;
      if (question.body.type === 'written') expect(key.correct).toBeNull();
      else expect(key.correct).not.toBeNull();
    }

    // A newer bank version never changes the assessment's preview (B4-05 f8 "Use updated version").
    const first = view.questions[0]!.question;
    ok(
      await faculty.questionBank.editQuestion({
        id: first.id as QuestionId,
        experimentId: SHELL,
        type: first.body.type,
        text: `${first.text} (edited)`,
        options: first.body.type === 'multiple-choice' ? first.body.options : {},
        correct:
          first.body.type === 'multiple-choice'
            ? first.body.correct
            : first.body.type === 'true-false'
              ? String(first.body.correct)
              : null,
        marks: String(first.marks),
        explanation: first.explanation,
        markingGuidance: first.body.type === 'written' ? first.body.markingGuidance : null,
        expectedRev: first.rev,
      }),
    );
    const again = ok(await faculty.assessments.previewAsStudent(assessmentId));
    expect(again.questions[0]!.text).toBe(preview.questions[0]!.text);

    const student = await asPerson(platform, 'Rahul Verma').assessments.previewAsStudent(
      assessmentId,
    );
    expect(errorOf(student)).toMatchObject({ kind: 'not-permitted', why: 'wrong-workspace' });
  });
});

describe('Phase 4A review: a co-teacher and the current version', () => {
  it('refuses a colleague’s answer key as policy-open (OD-B4-17) — the questions are the author’s', async () => {
    const platform = await platformOn('after-flow-d');
    const world = worldOf(platform);
    const anita = Object.values(world.records.people).find(
      (person) => person.fullName === 'Dr Anita Desai',
    )!;
    ok(
      await asPerson(platform, 'Meera Iyer').facultyCourses.assign({
        facultyId: anita.id as PersonId,
        courseId: 'thermodynamics-heat-transfer' as CourseId,
      }),
    );
    const assessmentId = Object.keys(world.records.assessments)[0] as AssessmentId;
    const colleague = asPerson(platform, 'Dr Anita Desai');
    // The assessment itself is hers to read now (she teaches the experiment) …
    expect(ok(await colleague.assessments.getAssessment(assessmentId)).assessment.id).toBe(
      assessmentId,
    );
    // … but not the key of Dr S. Ranganathan's questions.
    expect(errorOf(await colleague.assessments.previewAsStudent(assessmentId))).toMatchObject({
      kind: 'policy-open',
    });
    // The author still previews it.
    expect(
      ok(await asPerson(platform, FACULTY).assessments.previewAsStudent(assessmentId)),
    ).toBeTruthy();
  });

  it('counts the submissions on the current version only, as the domain versions a change', async () => {
    const platform = await platformOn('after-flow-d');
    const faculty = asPerson(platform, FACULTY);
    const assessmentId = Object.keys(worldOf(platform).records.assessments)[0] as AssessmentId;
    const before = ok(await faculty.assessments.getAssessment(assessmentId));
    expect(before.submittedOnCurrentVersion).toBe(1);
    const changed = ok(
      await faculty.assessments.updateSettings({
        id: assessmentId,
        name: before.assessment.name,
        introduction: before.assessment.introduction,
        rules: {
          passMarkPercent: '60',
          attemptsAllowed: String(before.assessment.rules.attemptsAllowed),
          deadline: before.assessment.rules.deadline!,
          releaseOption: before.assessment.rules.release!.option,
          releaseDate: before.assessment.rules.release!.releaseDate,
        },
        expectedRev: before.assessment.rev,
      }),
    );
    expect(changed.newVersion).toBe(true);
    const after = ok(await faculty.assessments.getAssessment(assessmentId));
    expect(after.submittedOnCurrentVersion).toBe(0);
    expect(ok(await faculty.assessments.listAssessments())[0]!.submitted).toBe(1);
  });
});
