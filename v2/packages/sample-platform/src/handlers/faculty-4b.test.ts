/**
 * Phase 4B on the sample adapter (FA-12, FA-16 … FA-22, ST-11 … ST-14): Flow D on one world —
 * an assessment of the Faculty member's own, a Student's attempt, the choice questions marked by
 * the answer-key stand-in (PC-60, owner answer to P4-01), the written answer marked and confirmed,
 * the result shown only when the pinned version's release setting allows it — and the guards:
 * no key or figure reaches a Student early, no Faculty read answers a Student, a co-teaching
 * colleague's assessment is policy-open (OD-B4-17), the CSV exports are escaped and formula-safe,
 * drafts never enter the bank on their own and an import is all or nothing.
 */
import {
  assessmentIntroOutput,
  attemptForMarkingOutput,
  getResultOutput,
  listMyAssessmentsOutput,
  listQueueOutput,
  listSubmissionsOutput,
  listTeachingStudentsOutput,
  studentDetailOutput,
} from '@xr/contracts/draft';
import {
  type CourseId,
  type ExperimentId,
  type IsoInstant,
  type PersonId,
  type QuestionId,
  unsafeBrand,
} from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { createSamplePlatform } from '../index.js';
import { asPerson, fixtureWorld, setSampleNow, worldOf } from '../testing/index.js';
import { csvCell, csvText } from './assessment-4b.js';

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function errorOf(answer: { readonly ok: boolean; readonly error?: unknown }) {
  expect(answer.ok).toBe(false);
  return (
    answer as {
      readonly error: { readonly kind: string; readonly why?: string; readonly decision?: string };
    }
  ).error;
}

const SHELL = unsafeBrand<ExperimentId>('shell-and-tube-heat-exchanger');
const FACULTY = 'Dr S. Ranganathan';
const STUDENT = 'Rahul Verma';

type Release = 'immediately-after-marking' | 'after-deadline' | 'on-date';

async function platformOn(objectiveMarks: 'answer-key-on-submit' | 'supplied-only') {
  return createSamplePlatform({ world: await fixtureWorld('after-flow-c'), objectiveMarks });
}

/** D1: three questions (single choice, true or false, written) and an assessment of them. */
async function authored(
  platform: Awaited<ReturnType<typeof platformOn>>,
  release: Release = 'immediately-after-marking',
) {
  const faculty = asPerson(platform, FACULTY);
  const choice = ok(
    await faculty.questionBank.addQuestion({
      experimentId: SHELL,
      type: 'multiple-choice',
      text: 'What does effectiveness compare?',
      options: { A: 'q with q_max', B: 'C_min with C_max' },
      correct: 'A',
      marks: '2',
      explanation: 'ε = q ÷ q_max.',
      markingGuidance: null,
    }),
  );
  const trueFalse = ok(
    await faculty.questionBank.addQuestion({
      experimentId: SHELL,
      type: 'true-false',
      text: 'Fouling lowers U.',
      options: {},
      correct: 'true',
      marks: '2',
      explanation: 'Fouling adds a resistance.',
      markingGuidance: null,
    }),
  );
  const written = ok(
    await faculty.questionBank.addQuestion({
      experimentId: SHELL,
      type: 'written',
      text: 'Explain how fouling changes the performance.',
      options: {},
      correct: null,
      marks: '10',
      explanation: 'U and the duty fall.',
      markingGuidance: 'Look for: a resistance; U falls.',
    }),
  );
  const assessment = ok(
    await faculty.assessments.createAssessment({
      mode: 'create',
      experimentId: SHELL,
      name: 'Heat Exchanger — post-lab',
      introduction: null,
      rules: {
        passMarkPercent: '50',
        attemptsAllowed: '2',
        deadline: '2026-11-14T23:59:00+05:30',
        releaseOption: release,
        releaseDate: release === 'on-date' ? '2026-11-20T10:00:00+05:30' : null,
      },
      questions: [choice.id, trueFalse.id, written.id],
    }),
  );
  return { faculty, assessment, choice, trueFalse, written };
}

/** D2: Rahul answers the choice question rightly, the true-or-false wrongly, writes, and submits. */
async function attempted(
  platform: Awaited<ReturnType<typeof platformOn>>,
  ids: Awaited<ReturnType<typeof authored>>,
) {
  const student = asPerson(platform, STUDENT);
  let attempt = ok(await student.assessments.startAttempt(ids.assessment.id));
  for (const [questionId, answer] of [
    [ids.choice.id, { type: 'multiple-choice' as const, choice: 'A' as const }],
    [ids.trueFalse.id, { type: 'true-false' as const, value: false }],
    [ids.written.id, { type: 'written' as const, text: 'U falls, so less heat passes.' }],
  ] as const) {
    attempt = ok(
      await student.assessments.saveAnswer({
        attemptId: attempt.id,
        questionId,
        answer,
        expectedRev: attempt.rev,
      }),
    );
  }
  const submitted = ok(
    await student.assessments.submitAttempt({ attemptId: attempt.id, expectedRev: attempt.rev }),
  );
  return { student, submitted };
}

/** Every key anywhere in a value, for "no key reaches the Student" scans. */
function keysIn(value: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((entry) => keysIn(entry, found));
  else if (value && typeof value === 'object') {
    for (const [name, entry] of Object.entries(value)) {
      found.add(name);
      keysIn(entry, found);
    }
  }
  return found;
}

describe('Flow D with the answer-key stand-in (PC-60, P4-01 owner answer)', () => {
  it('marks the choice questions by the pinned key on submit, then Faculty confirm and the Student sees the released result', async () => {
    const platform = await platformOn('answer-key-on-submit');
    const ids = await authored(platform);
    const { student, submitted } = await attempted(platform, ids);
    // The Student's receipt is the submitted attempt before any mark (no figure, ATT-15).
    expect(submitted.state).toBe('submitted');
    expect(submitted.marking.automatic).toEqual([]);

    const faculty = ids.faculty;
    const marking = ok(await faculty.marking.getAttemptForMarking(submitted.id));
    expect(attemptForMarkingOutput.safeParse(marking).success).toBe(true);
    // "Marked automatically": the key compared for choice questions only, from the pinned version.
    expect(marking.attempt.marking.automatic).toEqual([
      { questionId: ids.choice.id, awarded: 2, outOf: 2 },
      { questionId: ids.trueFalse.id, awarded: 0, outOf: 2 },
    ]);
    expect(marking.student.fullName).toBe(STUDENT);
    expect(marking.numbering.map((entry) => entry.number)).toEqual([1, 2, 3]);
    expect(marking.questions.map((question) => question.id)).toEqual([ids.written.id]);
    expect(marking.release).toEqual({ option: 'immediately-after-marking', on: null });

    // Before confirmation: waiting in the queue, no score on the submissions list, nothing for Rahul.
    const queue = ok(await faculty.marking.listQueue({ state: 'waiting' }));
    expect(listQueueOutput.safeParse(queue).success).toBe(true);
    expect(queue.map((row) => [row.attempt.id, row.writtenNumbers])).toEqual([[submitted.id, [3]]]);
    const listed = ok(await faculty.assessments.listSubmissions(ids.assessment.id));
    expect(listSubmissionsOutput.safeParse(listed).success).toBe(true);
    expect(listed[0]).toMatchObject({ score: null, releasedAt: null, outOf: 14 });
    const early = ok(await student.assessments.getResult(submitted.id));
    expect(early.result.kind).toBe('waiting-for-marking');
    expect(early.review).toBeNull();

    const saved = ok(
      await faculty.marking.saveMark({
        attemptId: submitted.id,
        questionId: ids.written.id,
        mark: '7',
        feedback: 'Good use of your readings.',
        expectedRev: marking.attempt.rev,
      }),
    );
    const confirmed = ok(
      await faculty.marking.confirmMarks({ attemptId: submitted.id, expectedRev: saved.rev }),
    );
    expect(confirmed.marking.confirmed?.by).toMatchObject({ displayName: FACULTY });
    // Confirmed marks are read-only (T-20).
    expect(
      errorOf(
        await faculty.marking.saveMark({
          attemptId: submitted.id,
          questionId: ids.written.id,
          mark: '9',
          feedback: null,
          expectedRev: confirmed.rev,
        }),
      ),
    ).toMatchObject({ kind: 'refused' });

    const result = ok(await student.assessments.getResult(submitted.id));
    expect(getResultOutput.safeParse(result).success).toBe(true);
    expect(result.result).toMatchObject({ kind: 'released', score: 9, outOf: 14, passed: true });
    expect(result.review?.map((entry) => [entry.number, entry.awarded, entry.outOf])).toEqual([
      [1, 2, 2],
      [2, 0, 2],
      [3, 7, 10],
    ]);
    expect(result.review?.[2]).toMatchObject({
      feedback: 'Good use of your readings.',
      feedbackBy: FACULTY,
      type: 'written',
    });
    const after = ok(await faculty.assessments.listSubmissions(ids.assessment.id));
    expect(after[0]).toMatchObject({ score: 9, outOf: 14 });
    expect(after[0]!.releasedAt).not.toBeNull();
  });

  it('keeps the DV-2 interim without the stand-in: Confirm marks is policy-open ATT-07', async () => {
    const platform = await platformOn('supplied-only');
    const ids = await authored(platform);
    const { submitted } = await attempted(platform, ids);
    const marking = ok(await ids.faculty.marking.getAttemptForMarking(submitted.id));
    expect(marking.attempt.marking.automatic).toEqual([]);
    const saved = ok(
      await ids.faculty.marking.saveMark({
        attemptId: submitted.id,
        questionId: ids.written.id,
        mark: '5',
        feedback: null,
        expectedRev: marking.attempt.rev,
      }),
    );
    expect(
      errorOf(
        await ids.faculty.marking.confirmMarks({ attemptId: submitted.id, expectedRev: saved.rev }),
      ),
    ).toMatchObject({ kind: 'policy-open', decision: 'ATT-07' });
  });

  it('withholds the result until the pinned version’s release date, whatever the settings say later (P4-06)', async () => {
    const platform = await platformOn('answer-key-on-submit');
    const ids = await authored(platform, 'after-deadline');
    const { student, submitted } = await attempted(platform, ids);
    const marking = ok(await ids.faculty.marking.getAttemptForMarking(submitted.id));
    const saved = ok(
      await ids.faculty.marking.saveMark({
        attemptId: submitted.id,
        questionId: ids.written.id,
        mark: '8',
        feedback: null,
        expectedRev: marking.attempt.rev,
      }),
    );
    ok(await ids.faculty.marking.confirmMarks({ attemptId: submitted.id, expectedRev: saved.rev }));
    const held = ok(await student.assessments.getResult(submitted.id));
    expect(held.result).toEqual({ kind: 'not-released-yet', releaseRule: 'after-deadline' });
    expect(held.review).toBeNull();
    expect(held.release).toEqual({
      option: 'after-deadline',
      on: '2026-11-14T18:29:00.000Z',
    });
    expect(keysIn(held)).not.toContain('score');

    // A release change after the submission makes a new version; Rahul keeps his version's terms.
    const view = ok(await ids.faculty.assessments.getAssessment(ids.assessment.id));
    const changed = ok(
      await ids.faculty.assessments.updateSettings({
        id: ids.assessment.id,
        name: view.assessment.name,
        introduction: null,
        rules: {
          passMarkPercent: '50',
          attemptsAllowed: '2',
          deadline: '2026-11-14T23:59:00+05:30',
          releaseOption: 'immediately-after-marking',
          releaseDate: null,
        },
        expectedRev: view.assessment.rev,
      }),
    );
    expect(changed.newVersion).toBe(true);
    expect(ok(await student.assessments.getResult(submitted.id)).result.kind).toBe(
      'not-released-yet',
    );

    setSampleNow(platform, '2026-11-15T03:30:00.000Z' as IsoInstant);
    const released = ok(await student.assessments.getResult(submitted.id));
    expect(released.result).toMatchObject({ kind: 'released', score: 10, outOf: 14 });
  });
});

describe('what the Student reads (ST-11 … ST-14): never a key, never an early figure', () => {
  it('lists the assessment with its facts and gives the attempt sheet without the key', async () => {
    const platform = await platformOn('answer-key-on-submit');
    const ids = await authored(platform);
    const student = asPerson(platform, STUDENT);
    const rows = ok(await student.assessments.listMyAssessments());
    expect(listMyAssessmentsOutput.safeParse(rows).success).toBe(true);
    expect(rows[0]).toMatchObject({
      result: { kind: 'to-do' },
      questionCount: 3,
      totalMarks: 14,
      latest: null,
      // The code Students see: the institution's own when it set one (IA-16), as ST-02 shows it.
      courseCode: 'MEC-523',
    });
    const started = ok(await student.assessments.startAttempt(ids.assessment.id));
    const intro = ok(await student.assessments.getAssessmentIntro(ids.assessment.id));
    expect(assessmentIntroOutput.safeParse(intro).success).toBe(true);
    expect(intro.questionTypes).toEqual({ multipleChoice: 1, trueFalse: 1, written: 1 });
    expect(intro.sheet?.attemptId).toBe(started.id);
    expect(intro.sheet?.questions.map((question) => question.type)).toEqual([
      'multiple-choice',
      'true-false',
      'written',
    ]);
    const keys = keysIn(intro.sheet);
    for (const forbidden of ['correct', 'markingGuidance', 'explanation', 'marking', 'automatic'])
      expect(keys, forbidden).not.toContain(forbidden);
    expect(intro.attempts[0]).toMatchObject({
      state: 'in-progress',
      answered: 0,
      questionCount: 3,
    });
    // The attempt's own version's facts (Phase 4B review), apart from the current version's.
    expect(intro.attempts[0]!.pinned).toEqual({
      questionTypes: { multipleChoice: 1, trueFalse: 1, written: 1 },
      totalMarks: 14,
      passMarkPercent: 50,
      attemptsAllowed: 2,
      deadline: '2026-11-14T18:29:00.000Z',
    });
  });

  it('answers no Faculty read to a Student (keys, other Students, marks before release)', async () => {
    const platform = await platformOn('answer-key-on-submit');
    const ids = await authored(platform);
    const { student, submitted } = await attempted(platform, ids);
    for (const answer of [
      await student.assessments.getAssessment(ids.assessment.id),
      await student.assessments.listSubmissions(ids.assessment.id),
      await student.assessments.exportSubmissionsCsv(ids.assessment.id),
      await student.assessments.previewAsStudent(ids.assessment.id),
      await student.marking.listQueue({ state: 'all' }),
      await student.marking.getAttemptForMarking(submitted.id),
      await student.teaching.listStudents({ experimentId: SHELL }),
      await student.teaching.exportStudentsCsv({ experimentId: SHELL }),
      await student.teaching.getStudentDetail({
        studentId: submitted.studentId,
        experimentId: SHELL,
      }),
      await student.questionBank.listDrafts(SHELL),
    ]) {
      expect(errorOf(answer)).toMatchObject({ kind: 'not-permitted' });
    }
    // The result read is the Student's own page, not a Faculty read.
    expect(errorOf(await ids.faculty.assessments.getResult(submitted.id))).toMatchObject({
      kind: 'not-permitted',
      why: 'wrong-workspace',
    });
  });
});

describe('a co-teaching colleague (Phase 4B protective refusal, OD-B4-17)', () => {
  it('keeps the submissions, marking, export and results of someone else’s assessment closed', async () => {
    const platform = await platformOn('answer-key-on-submit');
    const ids = await authored(platform);
    const { submitted } = await attempted(platform, ids);
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
    for (const answer of [
      await colleague.assessments.getAssessment(ids.assessment.id),
      await colleague.assessments.listSubmissions(ids.assessment.id),
      await colleague.assessments.exportSubmissionsCsv(ids.assessment.id),
      await colleague.marking.getAttemptForMarking(submitted.id),
    ]) {
      expect(errorOf(answer)).toMatchObject({ kind: 'policy-open', decision: 'OD-B4-17' });
    }
    expect(ok(await colleague.marking.listQueue({ state: 'all' }))).toEqual([]);
    const rows = ok(await colleague.teaching.listStudents({ experimentId: SHELL }));
    expect(listTeachingStudentsOutput.safeParse(rows).success).toBe(true);
    const rahul = rows.find((row) => row.name === STUDENT)!;
    expect(rahul.assessment).toEqual({ kind: 'policy-open', decision: 'OD-B4-17' });
    expect(rahul.resultReleased).toBe(false);
    const detail = ok(
      await colleague.teaching.getStudentDetail({
        studentId: submitted.studentId,
        experimentId: SHELL,
      }),
    );
    expect(studentDetailOutput.safeParse(detail).success).toBe(true);
    expect(detail.attempts).toEqual([]);
    expect(detail.attemptFacts).toEqual([]);
    // Phase 4B review: her overview names no colleague's submission and her lists count none
    // waiting for her marks, so no action leads to an empty queue.
    const overview = ok(await colleague.teaching.getFacultyOverview());
    expect(overview.attention.map((item) => item.kind)).not.toContain('written-answers-to-mark');
    expect(
      ok(await colleague.assessments.listAssessments()).find(
        (row) => row.assessment.id === ids.assessment.id,
      )?.waitingForMarking,
    ).toBe(0);
    // The author still reads everything.
    expect(ok(await ids.faculty.assessments.listSubmissions(ids.assessment.id))).toHaveLength(1);
    expect(
      ok(await ids.faculty.teaching.getFacultyOverview()).attention.map((item) => item.kind),
    ).toContain('written-answers-to-mark');
  });
});

describe('FA-22 CSV exports: the list on screen, escaped and formula-safe', () => {
  it('quotes commas, quotes and line breaks, and defuses formula-looking cells', () => {
    expect(csvCell('Rahul Verma')).toBe('Rahul Verma');
    expect(csvCell('Verma, Rahul')).toBe('"Verma, Rahul"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('two\nlines')).toBe('"two\nlines"');
    for (const formula of ['=1+1', '+SUM(A1)', '-2+3', '@cmd', '\tx', '\rx'])
      expect(csvCell(formula).replace(/^"/, '').startsWith("'")).toBe(true);
    expect(
      csvText([
        ['a', 'b'],
        ['=x', 'y,z'],
      ]),
    ).toBe('a,b\r\n\'=x,"y,z"\r\n');
  });

  it('exports the submissions and the filtered Students list with the drawn columns', async () => {
    const platform = await platformOn('answer-key-on-submit');
    const ids = await authored(platform);
    await attempted(platform, ids);
    const submissions = ok(await ids.faculty.assessments.exportSubmissionsCsv(ids.assessment.id));
    expect(submissions.fileName).toBe(`submissions-${ids.assessment.id}.csv`);
    const lines = submissions.csv.trimEnd().split('\r\n');
    expect(lines[0]).toBe('student,student ID,submitted,status,score,result released to student');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Rahul Verma');
    expect(lines[1]).toContain('Waiting for marking');

    const all = ok(await ids.faculty.teaching.exportStudentsCsv({ experimentId: SHELL }));
    expect(all.fileName).toBe('students-shell-and-tube-heat-exchanger.csv');
    const header = all.csv.split('\r\n')[0]!;
    expect(header.startsWith('student,student ID,experiment,')).toBe(true);
    expect(header.endsWith('assessment,result released to student,last activity')).toBe(true);
    const waiting = ok(
      await ids.faculty.teaching.exportStudentsCsv({
        experimentId: SHELL,
        progress: 'waiting-for-marking',
      }),
    );
    const listed = ok(
      await ids.faculty.teaching.listStudents({
        experimentId: SHELL,
        progress: 'waiting-for-marking',
      }),
    );
    expect(listed.map((row) => row.name)).toEqual([STUDENT]);
    expect(waiting.csv.trimEnd().split('\r\n')).toHaveLength(1 + listed.length);
  });
});

describe('FA-16 drafts (the sample stand-in, T-23) and FA-17 import (T-24 interim)', () => {
  it('drafts for review only: nothing enters the bank until the Faculty member adds it', async () => {
    const platform = await platformOn('answer-key-on-submit');
    const faculty = asPerson(platform, FACULTY);
    const invalid = errorOf(
      await faculty.questionBank.requestDrafts({
        experimentId: SHELL,
        source: null,
        pastedText: null,
        types: [],
        howMany: null,
      }),
    );
    expect(invalid.kind).toBe('validation-failed');
    const bankBefore = ok(await faculty.questionBank.listQuestions({ experimentId: SHELL }));
    const drafts = ok(
      await faculty.questionBank.requestDrafts({
        experimentId: SHELL,
        source: 'lab-brief',
        pastedText: null,
        types: ['multiple-choice', 'true-false', 'written'],
        howMany: 3,
      }),
    );
    expect(drafts.map((draft) => draft.body.type)).toEqual([
      'multiple-choice',
      'true-false',
      'written',
    ]);
    expect(drafts.every((draft) => draft.marks === null)).toBe(true);
    expect(ok(await faculty.questionBank.listQuestions({ experimentId: SHELL }))).toHaveLength(
      bankBefore.length,
    );
    expect(ok(await faculty.questionBank.listDrafts(SHELL))).toHaveLength(3);

    const first = drafts[0]!;
    const added = ok(
      await faculty.questionBank.addDraftToBank({
        draftId: first.id,
        experimentId: SHELL,
        type: 'multiple-choice',
        text: first.text,
        options: first.body.type === 'multiple-choice' ? first.body.options : {},
        correct: first.body.type === 'multiple-choice' ? first.body.correct : null,
        marks: '2',
        explanation: first.explanation,
        markingGuidance: null,
      }),
    );
    expect(added.origin).toBe('reviewed-draft');
    ok(await faculty.questionBank.discardDraft({ draftId: drafts[1]!.id }));
    expect(ok(await faculty.questionBank.listDrafts(SHELL)).map((draft) => draft.id)).toEqual([
      drafts[2]!.id,
    ]);
    expect(ok(await faculty.questionBank.listQuestions({ experimentId: SHELL }))).toHaveLength(
      bankBefore.length + 1,
    );
    // Another Faculty member (who does not teach the experiment) never reads these drafts.
    expect(
      errorOf(await asPerson(platform, 'Dr Anita Desai').questionBank.listDrafts(SHELL)),
    ).toMatchObject({ kind: 'not-permitted' });
  });

  it('gives distinct drafts even when one type is asked for five times (Phase 4B review)', async () => {
    const platform = await platformOn('answer-key-on-submit');
    const faculty = asPerson(platform, FACULTY);
    for (const source of ['lab-brief', 'pasted-text'] as const) {
      const drafts = ok(
        await faculty.questionBank.requestDrafts({
          experimentId: SHELL,
          source,
          pastedText: source === 'pasted-text' ? 'Fouling lowers U. It adds a resistance.' : null,
          types: ['multiple-choice'],
          howMany: 5,
        }),
      );
      expect(new Set(drafts.map((draft) => draft.text)).size).toBe(5);
    }
  });

  it('checks the file, blocks on errors, then adds every row or none — never into an assessment', async () => {
    const platform = await platformOn('answer-key-on-submit');
    const faculty = asPerson(platform, FACULTY);
    const header =
      'type,question,option_a,option_b,option_c,option_d,correct,marks,explanation,marking_guidance';
    const broken = [
      header,
      'multiple choice,What does C_min stand for?,a,b,c,d,E,2,x,',
      'multi-select,Which statements about fouling are true?,a,b,,,A,2,x,',
      'written answer,State the units of U.,,,,,,5,,Look for W/m²K',
    ].join('\n');
    const report = ok(
      await faculty.questionBank.previewQuestionImport({
        experimentId: SHELL,
        fileName: 'post-lab-questions.csv',
        csvText: broken,
      }),
    );
    expect(report.canImport).toBe(false);
    expect(report.rowsChecked).toBe(3);
    expect(report.rows.map((row) => [row.row, row.problem, row.severity])).toEqual([
      [2, 'correct?value=E&options=A%E2%80%93D', 'error'],
      [3, 'type?value=multi-select', 'error'],
      [4, 'explanation-empty', 'warning'],
    ]);
    const before = ok(await faculty.questionBank.listQuestions({ experimentId: SHELL })).length;
    expect(
      errorOf(await faculty.questionBank.commitQuestionImport({ batchId: report.batchId })).kind,
    ).toBe('validation-failed');
    expect(ok(await faculty.questionBank.listQuestions({ experimentId: SHELL }))).toHaveLength(
      before,
    );

    const fixed = [
      header,
      'multiple choice,What does C_min stand for?,"the smaller rate, of the two",b,c,d,A,2,x,',
      'true or false,Fouling lowers U.,,,,,TRUE,2,Adds a resistance,',
      'written answer,State the units of U.,,,,,,5,,Look for W/m²K',
    ].join('\r\n');
    const good = ok(
      await faculty.questionBank.previewQuestionImport({
        experimentId: SHELL,
        fileName: 'post-lab-questions-corrected.csv',
        csvText: fixed,
      }),
    );
    expect(good.canImport).toBe(true);
    const done = ok(await faculty.questionBank.commitQuestionImport({ batchId: good.batchId }));
    expect(done.added).toHaveLength(3);
    const bank = ok(await faculty.questionBank.listQuestions({ experimentId: SHELL }));
    expect(bank).toHaveLength(before + 3);
    const imported = bank.filter((row) => done.added.includes(row.question.id as QuestionId));
    expect(imported.every((row) => row.question.origin === 'import' && row.usedIn === 0)).toBe(
      true,
    );
    expect(imported.map((row) => row.question.text)).toContain('What does C_min stand for?');
    // A committed file is gone: committing it again adds nothing.
    expect(
      errorOf(await faculty.questionBank.commitQuestionImport({ batchId: good.batchId })).kind,
    ).toBe('not-found');
  });

  it('refuses a file without the template columns or without rows', async () => {
    const platform = await platformOn('answer-key-on-submit');
    const faculty = asPerson(platform, FACULTY);
    for (const csvText of [
      'name,marks\nx,1',
      '',
      'type,question,option_a,option_b,option_c,option_d,correct,marks,explanation,marking_guidance\n',
    ]) {
      const error = errorOf(
        await faculty.questionBank.previewQuestionImport({
          experimentId: SHELL,
          fileName: 'x.csv',
          csvText,
        }),
      );
      expect(error.kind).toBe('validation-failed');
    }
  });
});

describe('FA-20 / FA-21 reads (PC-59)', () => {
  it('counts a Student with no activity as inactive from the day the experiment was given (B4-10 f0)', async () => {
    const platform = await platformOn('answer-key-on-submit');
    const faculty = asPerson(platform, FACULTY);
    const meera = asPerson(platform, 'Meera Iyer');
    const plan = Object.values(worldOf(platform).records.plans).find(
      (candidate) =>
        candidate.institutionId === 'godavari' &&
        candidate.items.some((item) => item.experimentId === SHELL),
    )!;
    ok(
      await meera.studentAccess.giveAccess({
        experimentIds: [SHELL],
        target: { kind: 'students', studentIds: ['per-0008' as PersonId] },
        expectedPlanRev: plan.rev,
      }),
    );
    const today = ok(await faculty.teaching.listStudents({ experimentId: SHELL }));
    const karthik = today.find((row) => row.name === 'Karthik Rao')!;
    expect(karthik.lastActivityAt).toBeNull();
    expect(karthik.accessGivenAt).not.toBeNull();
    expect(karthik.inactiveDays).toBe(0);
    // Given today: not inactive for 7 days or more yet.
    expect(
      ok(await faculty.teaching.listStudents({ experimentId: SHELL, inactiveForDays: 7 })).map(
        (row) => row.name,
      ),
    ).not.toContain('Karthik Rao');
    setSampleNow(platform, '2026-11-22T04:30:00.000Z' as IsoInstant);
    const later = ok(
      await faculty.teaching.listStudents({ experimentId: SHELL, inactiveForDays: 14 }),
    );
    expect(later.find((row) => row.name === 'Karthik Rao')?.inactiveDays).toBe(26);
  });

  it('answers the detail only for a Student the experiment was given to', async () => {
    const platform = await platformOn('answer-key-on-submit');
    const faculty = asPerson(platform, FACULTY);
    expect(
      errorOf(
        await faculty.teaching.getStudentDetail({
          studentId: 'per-0004' as PersonId,
          experimentId: SHELL,
        }),
      ).kind,
    ).toBe('not-found');
    expect(
      ok(
        await faculty.teaching.getStudentDetail({
          studentId: 'per-0002' as PersonId,
          experimentId: SHELL,
        }),
      ).row.name,
    ).toBe(STUDENT);
  });
});
