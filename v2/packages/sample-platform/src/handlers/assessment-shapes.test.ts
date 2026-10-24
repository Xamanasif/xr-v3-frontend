/**
 * Every Ready assessment shape can be marked and released (owner decisions of 24 Oct 2026, the
 * assessment P0 fix, audit CB-2; PC-74): on the sample adapter with the answer-key stand-in
 * (PC-60), one world per case —
 *  - choice-only: the submission is queued with no written question, its automatic marks wait for
 *    the Faculty member's confirmation (FA-06 / FA-01 count it apart from written answers), and
 *    once confirmed the Student's result follows the assessment's own release setting;
 *  - several written questions: queued with every written question's number; Confirm is refused
 *    until each written answer has a saved mark — each missing one named — then confirmed once and
 *    read-only (ATT-10);
 *  - without the stand-in (DV-2) a choice-only submission is still queued, and Confirm stays
 *    `policy-open` ATT-07;
 *  - the scope is unchanged: a co-teaching colleague sees none of them (OD-B4-17), a Student
 *    reads no queue and confirms nothing.
 */
import {
  attemptForMarkingOutput,
  facultyOverviewOutput,
  getResultOutput,
  listAssessmentsOutput,
  listQueueOutput,
} from '@xr/contracts/draft';
import {
  type CourseId,
  type ExperimentId,
  type PersonId,
  type QuestionId,
  unsafeBrand,
} from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { createSamplePlatform } from '../index.js';
import { asPerson, fixtureWorld, setSampleNow, worldOf } from '../testing/index.js';

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function errorOf(answer: { readonly ok: boolean; readonly error?: unknown }) {
  expect(answer.ok).toBe(false);
  return (answer as { readonly error: Record<string, unknown> }).error;
}

const SHELL = unsafeBrand<ExperimentId>('shell-and-tube-heat-exchanger');
const FACULTY = 'Dr S. Ranganathan';
const STUDENT = 'Rahul Verma';

type Release = 'immediately-after-marking' | 'after-deadline';
type Platform = Awaited<ReturnType<typeof platformOn>>;

async function platformOn(objectiveMarks: 'answer-key-on-submit' | 'supplied-only') {
  return createSamplePlatform({ world: await fixtureWorld('after-flow-c'), objectiveMarks });
}

/** The bank: a single choice (2), a true or false (2), and two written questions (10 and 5). */
async function bank(platform: Platform) {
  const faculty = asPerson(platform, FACULTY);
  const add = async (input: Record<string, unknown>) =>
    ok(
      await faculty.questionBank.addQuestion({
        experimentId: SHELL,
        options: {},
        correct: null,
        explanation: null,
        markingGuidance: null,
        ...input,
      } as never),
    );
  return {
    faculty,
    choice: await add({
      type: 'multiple-choice',
      text: 'What does effectiveness compare?',
      options: { A: 'q with q_max', B: 'C_min with C_max' },
      correct: 'A',
      marks: '2',
    }),
    trueFalse: await add({
      type: 'true-false',
      text: 'Fouling lowers U.',
      correct: 'true',
      marks: '2',
    }),
    first: await add({
      type: 'written',
      text: 'Describe the temperature profile you measured.',
      marks: '10',
      markingGuidance: 'Look for the readings.',
    }),
    second: await add({
      type: 'written',
      text: 'Which resistance contributed most, and why?',
      marks: '5',
    }),
  };
}

/** A Ready assessment of the given questions with its own release setting. */
async function ready(
  faculty: Awaited<ReturnType<typeof bank>>['faculty'],
  questions: readonly string[],
  release: Release,
  deadline = '2026-11-14T23:59:00+05:30',
) {
  return ok(
    await faculty.assessments.createAssessment({
      mode: 'create',
      experimentId: SHELL,
      name: 'Shell-and-Tube — quick check',
      introduction: null,
      rules: {
        passMarkPercent: '50',
        attemptsAllowed: '2',
        deadline,
        releaseOption: release,
        releaseDate: null,
      },
      questions: questions.map((id) => unsafeBrand<QuestionId>(id)),
    }),
  );
}

/** Rahul answers (the choice rightly, the true-or-false wrongly, any written) and submits. */
async function submit(
  platform: Platform,
  assessmentId: string,
  answers: readonly (readonly [string, unknown])[],
) {
  const student = asPerson(platform, STUDENT);
  let attempt = ok(await student.assessments.startAttempt(assessmentId as never));
  for (const [questionId, answer] of answers) {
    attempt = ok(
      await student.assessments.saveAnswer({
        attemptId: attempt.id,
        questionId,
        answer,
        expectedRev: attempt.rev,
      } as never),
    );
  }
  const submitted = ok(
    await student.assessments.submitAttempt({ attemptId: attempt.id, expectedRev: attempt.rev }),
  );
  return { student, submitted };
}

const CHOICE_ANSWERS = (ids: Awaited<ReturnType<typeof bank>>) =>
  [
    [ids.choice.id, { type: 'multiple-choice', choice: 'A' }],
    [ids.trueFalse.id, { type: 'true-false', value: false }],
  ] as const;

describe('choice-only (owner decision 24 Oct 2026: the Faculty member confirms the automatic marks)', () => {
  it('is queued with no written question, counted apart, confirmed by the Faculty member, and released at once', async () => {
    const platform = await platformOn('answer-key-on-submit');
    const ids = await bank(platform);
    const assessment = await ready(
      ids.faculty,
      [ids.choice.id, ids.trueFalse.id],
      'immediately-after-marking',
    );
    const { student, submitted } = await submit(platform, assessment.id, CHOICE_ANSWERS(ids));
    const faculty = ids.faculty;

    // FA-18: queued, waiting — no written question to mark.
    const queue = ok(await faculty.marking.listQueue({ state: 'waiting' }));
    expect(listQueueOutput.safeParse(queue).success).toBe(true);
    expect(queue.map((row) => [row.attempt.id, row.writtenNumbers])).toEqual([[submitted.id, []]]);
    // FA-06 / FA-01: a submission whose marks wait for confirmation — no written answer counted.
    const listed = ok(await faculty.assessments.listAssessments());
    expect(listAssessmentsOutput.safeParse(listed).success).toBe(true);
    expect(listed.find((row) => row.assessment.id === assessment.id)).toMatchObject({
      submitted: 1,
      waitingForMarking: 0,
      waitingToConfirm: 1,
    });
    const overview = ok(await faculty.teaching.getFacultyOverview());
    expect(facultyOverviewOutput.safeParse(overview).success).toBe(true);
    expect(overview.attention.filter((item) => item.kind !== 'students-inactive')).toEqual([
      {
        kind: 'marks-to-confirm',
        assessmentId: assessment.id,
        assessmentName: 'Shell-and-Tube — quick check',
        submissions: 1,
        oldest: { studentName: STUDENT, submittedAt: submitted.submittedAt },
      },
    ]);

    // FA-19: the automatic marks, no written question.
    const marking = ok(await faculty.marking.getAttemptForMarking(submitted.id));
    expect(attemptForMarkingOutput.safeParse(marking).success).toBe(true);
    expect(marking.questions).toEqual([]);
    expect(marking.numbering.map((entry) => entry.type)).toEqual(['multiple-choice', 'true-false']);
    expect(marking.attempt.marking.automatic).toEqual([
      { questionId: ids.choice.id, awarded: 2, outOf: 2 },
      { questionId: ids.trueFalse.id, awarded: 0, outOf: 2 },
    ]);
    // There is no written answer to save a mark for; the Student waits, with no figure.
    expect(
      errorOf(
        await faculty.marking.saveMark({
          attemptId: submitted.id,
          questionId: ids.choice.id,
          mark: '1',
          feedback: null,
          expectedRev: marking.attempt.rev,
        }),
      ),
    ).toMatchObject({ kind: 'invalid-state' });
    expect(ok(await student.assessments.getResult(submitted.id))).toMatchObject({
      result: { kind: 'waiting-for-marking' },
      review: null,
    });
    // The Student cannot confirm; the Faculty member can — once.
    expect(
      errorOf(
        await student.marking.confirmMarks({
          attemptId: submitted.id,
          expectedRev: marking.attempt.rev,
        }),
      ),
    ).toMatchObject({ kind: 'not-permitted' });
    const confirmed = ok(
      await faculty.marking.confirmMarks({
        attemptId: submitted.id,
        expectedRev: marking.attempt.rev,
      }),
    );
    expect(confirmed.marking.confirmed?.by).toMatchObject({ kind: 'person', displayName: FACULTY });
    expect(
      errorOf(
        await faculty.marking.confirmMarks({ attemptId: submitted.id, expectedRev: confirmed.rev }),
      ),
    ).toMatchObject({ kind: 'refused', code: 'marks-confirmed' });

    // Marked: off the waiting queue and the counts, on the marked one.
    expect(ok(await faculty.marking.listQueue({ state: 'waiting' }))).toEqual([]);
    expect(
      ok(await faculty.marking.listQueue({ state: 'marked' })).map((row) => row.attempt.id),
    ).toEqual([submitted.id]);
    expect(
      ok(await faculty.assessments.listAssessments()).find(
        (row) => row.assessment.id === assessment.id,
      ),
    ).toMatchObject({ waitingForMarking: 0, waitingToConfirm: 0 });
    expect(
      ok(await faculty.teaching.getFacultyOverview()).attention.map((item) => item.kind),
    ).not.toContain('marks-to-confirm');

    // Released immediately after marking: 2 of 4, pass mark 2 → passed; every answer reviewed.
    const result = ok(await student.assessments.getResult(submitted.id));
    expect(getResultOutput.safeParse(result).success).toBe(true);
    expect(result.result).toMatchObject({
      kind: 'released',
      score: 2,
      outOf: 4,
      passMarkMarks: 2,
      passed: true,
      attemptsLeft: 1,
    });
    expect(result.review?.map((entry) => [entry.number, entry.awarded, entry.outOf])).toEqual([
      [1, 2, 2],
      [2, 0, 2],
    ]);
  });

  it('follows an after-the-deadline setting: not released until the deadline, then released', async () => {
    const platform = await platformOn('answer-key-on-submit');
    const ids = await bank(platform);
    const assessment = await ready(
      ids.faculty,
      [ids.choice.id, ids.trueFalse.id],
      'after-deadline',
    );
    const { student, submitted } = await submit(platform, assessment.id, CHOICE_ANSWERS(ids));
    const marking = ok(await ids.faculty.marking.getAttemptForMarking(submitted.id));
    ok(
      await ids.faculty.marking.confirmMarks({
        attemptId: submitted.id,
        expectedRev: marking.attempt.rev,
      }),
    );
    expect(ok(await student.assessments.getResult(submitted.id)).result).toEqual({
      kind: 'not-released-yet',
      releaseRule: 'after-deadline',
    });
    setSampleNow(platform, '2026-11-15T09:00:00.000Z' as never);
    expect(ok(await student.assessments.getResult(submitted.id)).result).toMatchObject({
      kind: 'released',
      score: 2,
      outOf: 4,
    });
  });

  it('without the stand-in (DV-2) it is still queued, and Confirm stays policy-open ATT-07', async () => {
    const platform = await platformOn('supplied-only');
    const ids = await bank(platform);
    const assessment = await ready(
      ids.faculty,
      [ids.choice.id, ids.trueFalse.id],
      'immediately-after-marking',
    );
    const { submitted } = await submit(platform, assessment.id, CHOICE_ANSWERS(ids));
    expect(
      ok(await ids.faculty.marking.listQueue({ state: 'waiting' })).map(
        (row) => row.writtenNumbers,
      ),
    ).toEqual([[]]);
    const marking = ok(await ids.faculty.marking.getAttemptForMarking(submitted.id));
    expect(marking.attempt.marking.automatic).toEqual([]);
    expect(
      errorOf(
        await ids.faculty.marking.confirmMarks({
          attemptId: submitted.id,
          expectedRev: marking.attempt.rev,
        }),
      ),
    ).toMatchObject({ kind: 'policy-open', decision: 'ATT-07' });
  });
});

describe('several written questions (owner decision 24 Oct 2026: confirm once per attempt)', () => {
  it('is queued with every written question; Confirm names each one without a saved mark, then confirms once', async () => {
    const platform = await platformOn('answer-key-on-submit');
    const ids = await bank(platform);
    const assessment = await ready(
      ids.faculty,
      [ids.choice.id, ids.first.id, ids.second.id],
      'immediately-after-marking',
    );
    const { student, submitted } = await submit(platform, assessment.id, [
      [ids.choice.id, { type: 'multiple-choice', choice: 'A' }],
      [ids.first.id, { type: 'written', text: 'It fell linearly in each layer.' }],
      [ids.second.id, { type: 'written', text: 'The insulation, by its low k.' }],
    ]);
    const faculty = ids.faculty;
    expect(
      ok(await faculty.marking.listQueue({ state: 'waiting' })).map((row) => row.writtenNumbers),
    ).toEqual([[2, 3]]);
    expect(
      ok(await faculty.assessments.listAssessments()).find(
        (row) => row.assessment.id === assessment.id,
      ),
    ).toMatchObject({ waitingForMarking: 1, waitingToConfirm: 0 });
    // FA-01 counts the written answers themselves: two.
    expect(
      ok(await faculty.teaching.getFacultyOverview()).attention.find(
        (item) => item.kind === 'written-answers-to-mark',
      ),
    ).toMatchObject({ answers: 2 });
    const marking = ok(await faculty.marking.getAttemptForMarking(submitted.id));
    expect(marking.questions.map((question) => question.id)).toEqual([ids.first.id, ids.second.id]);

    // Nothing saved: one error per written question, by its number.
    const none = errorOf(
      await faculty.marking.confirmMarks({
        attemptId: submitted.id,
        expectedRev: marking.attempt.rev,
      }),
    );
    expect(none).toMatchObject({ kind: 'validation-failed' });
    expect(
      (none['fieldErrors'] as readonly { field: string; key: string; params: object }[]).map(
        (error) => [error.field, error.key, error.params],
      ),
    ).toEqual([
      [`marks.${ids.first.id}`, 'FA-19.mark.required', { question: '2' }],
      [`marks.${ids.second.id}`, 'FA-19.mark.required', { question: '3' }],
    ]);
    // One saved: Confirm still refused, naming the other.
    const one = ok(
      await faculty.marking.saveMark({
        attemptId: submitted.id,
        questionId: ids.first.id,
        mark: '8',
        feedback: 'Clear profile.',
        expectedRev: marking.attempt.rev,
      }),
    );
    // Each mark is checked against its own question's marks (the second is out of 5).
    expect(
      errorOf(
        await faculty.marking.saveMark({
          attemptId: submitted.id,
          questionId: ids.second.id,
          mark: '6',
          feedback: null,
          expectedRev: one.rev,
        }),
      ),
    ).toMatchObject({ kind: 'validation-failed' });
    const missing = errorOf(
      await faculty.marking.confirmMarks({ attemptId: submitted.id, expectedRev: one.rev }),
    );
    expect(
      (missing['fieldErrors'] as readonly { field: string; params: object }[]).map((error) => [
        error.field,
        error.params,
      ]),
    ).toEqual([[`marks.${ids.second.id}`, { question: '3' }]]);
    const both = ok(
      await faculty.marking.saveMark({
        attemptId: submitted.id,
        questionId: ids.second.id,
        mark: '3',
        feedback: null,
        expectedRev: one.rev,
      }),
    );
    const confirmed = ok(
      await faculty.marking.confirmMarks({ attemptId: submitted.id, expectedRev: both.rev }),
    );
    expect(confirmed.marking.confirmed).not.toBeNull();
    // ATT-10: read-only afterwards, for every written answer.
    for (const questionId of [ids.first.id, ids.second.id]) {
      expect(
        errorOf(
          await faculty.marking.saveMark({
            attemptId: submitted.id,
            questionId,
            mark: '1',
            feedback: null,
            expectedRev: confirmed.rev,
          }),
        ),
      ).toMatchObject({ kind: 'refused', code: 'marks-confirmed' });
    }
    // Released: 2 + 8 + 3 = 13 of 17, pass mark 8.5 → passed; each written answer's feedback.
    const result = ok(await student.assessments.getResult(submitted.id));
    expect(result.result).toMatchObject({
      kind: 'released',
      score: 13,
      outOf: 17,
      passMarkMarks: 8.5,
      passed: true,
    });
    expect(
      result.review?.map((entry) => [entry.number, entry.awarded, entry.outOf, entry.feedback]),
    ).toEqual([
      [1, 2, 2, null],
      [2, 8, 10, 'Clear profile.'],
      [3, 3, 5, null],
    ]);
  });
});

describe('the scope is unchanged (ASMT-17, OD-B4-17)', () => {
  it('a co-teaching colleague sees none of the shapes; their counts stay at zero', async () => {
    const platform = await platformOn('answer-key-on-submit');
    const ids = await bank(platform);
    const assessment = await ready(
      ids.faculty,
      [ids.choice.id, ids.trueFalse.id],
      'immediately-after-marking',
    );
    const { submitted } = await submit(platform, assessment.id, CHOICE_ANSWERS(ids));
    const anita = Object.values(worldOf(platform).records.people).find(
      (person) => person.fullName === 'Dr Anita Desai',
    )!;
    ok(
      await asPerson(platform, 'Meera Iyer').facultyCourses.assign({
        facultyId: anita.id as PersonId,
        courseId: 'thermodynamics-heat-transfer' as CourseId,
      }),
    );
    const colleague = asPerson(platform, 'Dr Anita Desai');
    expect(ok(await colleague.marking.listQueue({ state: 'all' }))).toEqual([]);
    expect(errorOf(await colleague.marking.getAttemptForMarking(submitted.id))).toMatchObject({
      kind: 'policy-open',
      decision: 'OD-B4-17',
    });
    expect(
      errorOf(await colleague.marking.confirmMarks({ attemptId: submitted.id, expectedRev: 1 })),
    ).toMatchObject({ kind: 'policy-open', decision: 'OD-B4-17' });
    expect(
      ok(await colleague.assessments.listAssessments()).find(
        (row) => row.assessment.id === assessment.id,
      ),
    ).toMatchObject({ waitingForMarking: 0, waitingToConfirm: 0 });
    expect(
      ok(await colleague.teaching.getFacultyOverview()).attention.map((item) => item.kind),
    ).not.toContain('marks-to-confirm');
  });
});
