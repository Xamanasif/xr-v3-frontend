/**
 * Flow D — Faculty assessment → Student attempt → marking → result by the assessment's own setting
 * (flows.json D1–D4; Appendix D §4.5; B4-04 … B4-14). Every rule is set on the assessment — none
 * is pre-filled (BC6). Objective marks are supplied values only (DV-2). There is no Faculty release
 * control (B4-14 D4; flows.json D4 "FA-12 (release)" is a handoff defect).
 */
import type { Attempt, Question } from '@xr/domain';

import { check, deepEqual, errorOf, valueOf } from '../assert.js';
import { experimentNamed, keysOf } from '../helpers.js';
import type { CaseContext, ContractCase } from '../run.js';
import { DRAWN, SAMPLE } from '../sample.js';

const D_METHODS = [
  'CatalogueService.searchCatalogue',
  'QuestionBankService.listQuestions',
  'AssessmentService.createAssessment',
  'AssessmentService.getAssessment',
  'AssessmentService.listMyAssessments',
  'AssessmentService.startAttempt',
  'AssessmentService.saveAnswer',
  'AssessmentService.submitAttempt',
  'AssessmentService.getResult',
  'MarkingService.listQueue',
  'MarkingService.getAttemptForMarking',
  'MarkingService.saveMark',
  'MarkingService.confirmMarks',
] as const;

function answerFor(question: Question) {
  switch (question.body.type) {
    case 'multiple-choice': {
      const choice = (Object.keys(question.body.options) as ('A' | 'B' | 'C' | 'D')[])[0]!;
      return { type: 'multiple-choice' as const, choice };
    }
    case 'true-false':
      return { type: 'true-false' as const, value: true };
    case 'written':
      return {
        type: 'written' as const,
        text: 'Fouling adds a layer that resists heat transfer, so U falls.',
      };
  }
}

/** D1–D2 and the first marking step: an assessment, a submitted attempt, a provisional mark. */
async function assessAndSubmit(context: CaseContext) {
  const faculty = context.as('Dr S. Ranganathan');
  const student = context.as('Rahul Verma');
  const shell = await experimentNamed(context.publicPorts, SAMPLE.experiments.shellAndTube);
  const bank = valueOf(
    await faculty.questionBank.listQuestions({ experimentId: shell.experimentId }),
    'D1 the question bank',
  );
  const live = bank.map((row) => row.question).filter((question) => question.deleted === null);
  const written = live.find((question) => question.body.type === 'written');
  const choice = live.find((question) => question.body.type !== 'written');
  check(written && choice, 'D1: the bank holds a written and a choice question (B4-04)');

  const blank = await faculty.assessments.createAssessment({
    mode: 'create',
    experimentId: shell.experimentId,
    name: '',
    introduction: null,
    rules: {
      passMarkPercent: '',
      attemptsAllowed: '',
      deadline: '',
      releaseOption: null,
      releaseDate: null,
    },
    questions: [choice.id, written.id],
  });
  const ruleError = errorOf(blank, 'validation-failed', 'D1 create with nothing set');
  deepEqual(
    keysOf(ruleError),
    [
      'FA-07.name.required',
      'FA-07.passMarkPercent.range',
      'FA-07.attemptsAllowed.whole-number',
      'FA-07.deadline.required',
      'FA-07.releaseOption.required',
    ],
    'D1: nothing comes pre-filled — every rule is asked for (BC6; B4-04)',
  );
  check(ruleError.summaryTitle === 'Check this step', 'D1: the drawn summary title');

  const created = valueOf(
    await faculty.assessments.createAssessment({
      mode: 'create',
      experimentId: shell.experimentId,
      name: SAMPLE.assessment.name,
      introduction: null,
      rules: {
        passMarkPercent: SAMPLE.assessment.passMarkPercent,
        attemptsAllowed: SAMPLE.assessment.attemptsAllowed,
        deadline: SAMPLE.assessment.deadline,
        releaseOption: 'after-deadline',
        releaseDate: null,
      },
      questions: [choice.id, written.id],
    }),
    'D1 create the assessment',
  );
  check(DRAWN.assessment.test(created.id), 'D1: ASMT-nnnn');
  check(
    created.rules.passMarkPercent === 50 && created.rules.attemptsAllowed === 2,
    'D1: the rules are exactly this assessment’s own (BC6)',
  );
  const view = valueOf(await faculty.assessments.getAssessment(created.id), 'D1 FA-08');
  check(view.readiness === 'ready', 'D1: Ready');
  const mine = valueOf(await student.assessments.listMyAssessments(), 'D1 ST-11');
  check(
    mine.some((row) => row.assessment.id === created.id && row.result.kind === 'to-do'),
    'D1: Rahul sees it under To do',
  );

  let attempt: Attempt = valueOf(await student.assessments.startAttempt(created.id), 'D2 start');
  check(DRAWN.attempt.test(attempt.id) && attempt.attemptNumber === 1, 'D2: ATT-nnnn, attempt 1');
  for (const entry of view.questions) {
    attempt = valueOf(
      await student.assessments.saveAnswer({
        attemptId: attempt.id,
        questionId: entry.question.id,
        answer: answerFor(entry.question),
        expectedRev: attempt.rev,
      }),
      `D2 answer ${entry.question.id}`,
    );
  }
  attempt = valueOf(
    await student.assessments.submitAttempt({ attemptId: attempt.id, expectedRev: attempt.rev }),
    'D2 submit',
  );
  check(attempt.state === 'submitted', 'D2: Submitted · waiting for marking');
  const waiting = valueOf(await student.assessments.getResult(attempt.id), 'D2 ST-14');
  check(
    waiting.result.kind === 'waiting-for-marking' && waiting.review === null,
    'D2: no figure of any kind before marking',
  );

  const queue = valueOf(await faculty.marking.listQueue({ state: 'waiting' }), 'D3 FA-18');
  check(
    queue.some((row) => row.attempt.id === attempt.id),
    'D3: the attempt waits in the marking queue',
  );
  let marking = valueOf(await faculty.marking.getAttemptForMarking(attempt.id), 'D3 FA-19').attempt;
  const empty = await faculty.marking.saveMark({
    attemptId: attempt.id,
    questionId: written.id,
    mark: '',
    feedback: null,
    expectedRev: marking.rev,
  });
  deepEqual(
    keysOf(errorOf(empty, 'validation-failed', 'D3 save an empty mark')),
    ['FA-19.mark.required'],
    'D3: "Enter a mark for question <n>"',
  );
  marking = valueOf(
    await faculty.marking.saveMark({
      attemptId: attempt.id,
      questionId: written.id,
      mark: String(Math.min(written.marks, 7)),
      feedback: 'Clear explanation of fouling.',
      expectedRev: marking.rev,
    }),
    'D3 save a mark',
  );
  return { faculty, student, created, attempt: marking, written };
}

const flowD: ContractCase = {
  id: 'flow:D',
  title: 'Flow D — assessment, attempt, marks confirmed, result released by the setting (D1–D4)',
  group: 'flow',
  evidence: 'flows.json D1–D4 (D4 per B4-14, not FA-12); Appendix D §4.5; B4-04 … B4-14; BC6; DV-2',
  requires: {
    fixture: { kind: 'after-flow', flow: 'C' },
    methods: [...D_METHODS],
    seams: ['supplyObjectiveMarks'],
  },
  run: async (context) => {
    const { faculty, student, created, attempt, written } = await assessAndSubmit(context);
    context.seams.supplyObjectiveMarks!(attempt.id);
    const fresh = valueOf(
      await faculty.marking.getAttemptForMarking(attempt.id),
      'D3 FA-19',
    ).attempt;
    const confirmed = valueOf(
      await faculty.marking.confirmMarks({ attemptId: attempt.id, expectedRev: fresh.rev }),
      'D3 confirm marks',
    );
    check(confirmed.marking.confirmed !== null, 'D3: Marks confirmed (read-only afterwards)');
    const later = await faculty.marking.saveMark({
      attemptId: attempt.id,
      questionId: written.id,
      mark: '1',
      feedback: null,
      expectedRev: confirmed.rev,
    });
    check(
      errorOf(later, 'refused', 'D3 change a confirmed mark').code === 'marks-confirmed',
      'D3: "Confirmed marks can’t be changed."',
    );
    const held = valueOf(await student.assessments.getResult(attempt.id), 'D3 ST-14');
    check(
      held.result.kind === 'not-released-yet',
      'D3: Result not released yet — before the deadline',
    );
    check(
      !('releaseResult' in (faculty.marking as unknown as object)),
      'D4: there is no Faculty release control (B4-14)',
    );

    const deadline = created.rules.deadline;
    check(deadline, 'D1 set a deadline');
    context.standins.clock.setSampleNow(
      new Date(Date.parse(deadline) + 86_400_000).toISOString() as typeof deadline,
    );
    const released = valueOf(await student.assessments.getResult(attempt.id), 'D4 ST-14');
    check(
      released.result.kind === 'released',
      'D4: released by the assessment’s own setting, after the deadline',
    );
  },
};

const flowDObjectiveMarksInterim: ContractCase = {
  id: 'flow:D-objective-marks-interim',
  title: 'Flow D interim — without supplied objective marks, Confirm marks is open (DV-2, ATT-07)',
  group: 'flow',
  evidence: 'Appendix F §10.2 DV-2; WP-0.9 README "Phase-0 interims"; ATT-07 UNRESOLVED',
  requires: { fixture: { kind: 'after-flow', flow: 'C' }, methods: [...D_METHODS] },
  run: async (context) => {
    const { faculty, attempt } = await assessAndSubmit(context);
    const confirm = await faculty.marking.confirmMarks({
      attemptId: attempt.id,
      expectedRev: attempt.rev,
    });
    check(
      errorOf(confirm, 'policy-open', 'confirm without objective marks').decision === 'ATT-07',
      'No score is made from a missing mark: automatic marking is open (ATT-07)',
    );
  },
};

export const FLOW_D_CASES: readonly ContractCase[] = [flowD, flowDObjectiveMarksInterim];
