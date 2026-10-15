/**
 * Faculty teaching and assessment authoring (Phase 4A; B4-01 … B4-07; flows.json D1): what the
 * Institute Admin's Faculty course mapping gives a Faculty member is what their own reads show;
 * an assessment is created, set and filled on the one world, each read answering the record the
 * last command left; nothing is pre-filled (BC6); the preview is the pinned versions and the key,
 * creates no attempt and is the Faculty member's only — a Student never reads a draft.
 */
import type { Assessment } from '@xr/domain';

import { check, errorOf, valueOf } from '../assert.js';
import { experimentNamed } from '../helpers.js';
import type { ContractCase } from '../run.js';
import { SAMPLE } from '../sample.js';

const authoring: ContractCase = {
  id: 'teaching:authoring',
  title:
    'FA-01 … FA-11: the mapped course reaches the Faculty member; create → settings → questions → preview on one world',
  group: 'teaching',
  evidence:
    'B4-01 f0, B4-02 f0, B4-03 f0, B4-04 f1 … f7, B4-05 f0 / f6, B4-06 f0 / f5 / f6; flows.json D1; BC6; ASMT-14; T-18 … T-24',
  requires: {
    fixture: { kind: 'after-flow', flow: 'C' },
    methods: [
      'CatalogueService.searchCatalogue',
      'TeachingService.getFacultyOverview',
      'TeachingService.listMyCourses',
      'TeachingService.getTeachingExperiment',
      'AssessmentService.getCreateOptions',
      'AssessmentService.createAssessment',
      'AssessmentService.listAssessments',
      'AssessmentService.getAssessment',
      'AssessmentService.updateSettings',
      'AssessmentService.updateQuestions',
      'AssessmentService.previewAsStudent',
      'AssessmentService.listMyAssessments',
      'QuestionBankService.listQuestions',
      'QuestionBankService.addQuestion',
    ],
  },
  run: async (context) => {
    const faculty = context.as('Dr S. Ranganathan');
    const student = context.as('Rahul Verma');
    const shell = await experimentNamed(context.publicPorts, SAMPLE.experiments.shellAndTube);
    const experimentId = shell.experimentId;

    const overview = valueOf(await faculty.teaching.getFacultyOverview(), 'FA-01');
    check(overview.scopeLine.experiments >= 1, 'FA-01: the mapped course gives an experiment');
    const courses = valueOf(await faculty.teaching.listMyCourses(), 'FA-02');
    check(
      courses.some((row) => row.course.id === shell.courseId && row.experiments >= 1),
      'FA-02: the course Faculty courses maps is listed',
    );
    const teaching = valueOf(await faculty.teaching.getTeachingExperiment(experimentId), 'FA-05');
    check(teaching.assessmentId === null, 'FA-05: no assessment yet');

    const options = valueOf(await faculty.assessments.getCreateOptions(), 'FA-07 step 1');
    check(
      options.some((row) => row.experimentId === experimentId && row.existingAssessmentId === null),
      'FA-07: the taught experiment is offered, with no assessment yet',
    );

    // Saved as draft with a name only: nothing is pre-filled (BC6), and no Student sees it (ASMT-14).
    const draft: Assessment = valueOf(
      await faculty.assessments.createAssessment({
        mode: 'save-as-draft',
        experimentId,
        name: SAMPLE.assessment.name,
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
      'FA-07 save as draft',
    );
    check(
      draft.rules.passMarkPercent === null &&
        draft.rules.attemptsAllowed === null &&
        draft.rules.deadline === null &&
        draft.rules.release === null,
      'FA-07: a draft carries no rule it was not given (BC6)',
    );
    const listed = valueOf(await faculty.assessments.listAssessments(), 'FA-06');
    check(
      listed.some((row) => row.assessment.id === draft.id && row.readiness === 'draft-not-ready'),
      'FA-06: the draft is listed at once, Draft — not ready',
    );
    check(
      !valueOf(await student.assessments.listMyAssessments(), 'ST-11').some(
        (row) => row.assessment.id === draft.id,
      ),
      'ASMT-14: a Student never sees a draft',
    );

    const settings = valueOf(
      await faculty.assessments.updateSettings({
        id: draft.id,
        name: SAMPLE.assessment.name,
        introduction: null,
        rules: {
          passMarkPercent: SAMPLE.assessment.passMarkPercent,
          attemptsAllowed: SAMPLE.assessment.attemptsAllowed,
          deadline: SAMPLE.assessment.deadline,
          releaseOption: 'after-deadline',
          releaseDate: null,
        },
        expectedRev: draft.rev,
      }),
      'FA-10 save settings',
    );
    check(settings.assessment.rules.passMarkPercent === 50, 'FA-10: the typed pass mark is kept');

    const added = valueOf(
      await faculty.questionBank.addQuestion({
        experimentId,
        type: 'true-false',
        text: 'Fouling lowers the overall heat transfer coefficient U.',
        options: {},
        correct: 'true',
        marks: '2',
        explanation: null,
        markingGuidance: null,
      }),
      'FA-15 add a question',
    );
    const withQuestion = valueOf(
      await faculty.assessments.updateQuestions({
        id: draft.id,
        questions: [{ questionId: added.id, questionVersion: added.version }],
        expectedRev: settings.assessment.rev,
      }),
      'FA-09 add from the bank',
    );
    const view = valueOf(await faculty.assessments.getAssessment(draft.id), 'FA-08');
    check(view.readiness === 'ready', 'FA-08: rules and a question make it Ready');
    check(
      view.assessment.rev === withQuestion.assessment.rev && view.totalMarks === 2,
      'FA-08: the summary reads the record the last command left',
    );

    const preview = valueOf(await faculty.assessments.previewAsStudent(draft.id), 'FA-11');
    check(
      preview.questions.length === 1 &&
        preview.questions[0]!.id === added.id &&
        preview.answerKey[0]!.correct === 'true',
      'FA-11: the preview shows the assessment’s question and its key',
    );
    const after = valueOf(await faculty.assessments.listAssessments(), 'FA-06 after the preview');
    check(
      after.find((row) => row.assessment.id === draft.id)?.submitted === 0,
      'FA-11: previewing creates no attempt',
    );
    errorOf(
      await student.assessments.previewAsStudent(draft.id),
      'not-permitted',
      'FA-11: the answer key is never a Student’s',
    );
    check(
      valueOf(await student.assessments.listMyAssessments(), 'ST-11 once Ready').some(
        (row) => row.assessment.id === draft.id,
      ),
      'T-18 interim: Ready is visible to the Students who have the experiment (no FA-13 step)',
    );
  },
};

export const TEACHING_CASES: readonly ContractCase[] = [authoring];
