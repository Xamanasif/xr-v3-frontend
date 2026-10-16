/**
 * §3.10 AssessmentService + QuestionBankService and §3.11 MarkingService + TeachingService
 * (FA-06 … FA-21, ST-11 … ST-14; M20–M22; Flow D).
 *
 * Faculty own assessment creation and marking (BC6): every rule is the assessment's own and none
 * is pre-filled. A result releases by the assessment's own setting — there is no release control
 * (B4-14). Choice-question marks are supplied values only (DV-2): nothing here compares an answer
 * with a key, and without the supplied marks Confirm marks answers `policy-open` ATT-07. Faculty
 * read per-format progress but never a Student's feedback (FB-06).
 */
import {
  acceptMarkAsTyped,
  addDraftToBankInput,
  addQuestionInput,
  type AssessmentService,
  type AssessmentListRow,
  confirmMarksInput,
  type CreateOption,
  commitQuestionImportInput,
  createAssessmentInput,
  deleteQuestionInput,
  discardDraftInput,
  editQuestionInput,
  fieldError,
  type FacultyAttention,
  type FacultyStudentRow,
  listQueueInput,
  listQuestionsInput,
  listTeachingStudentsInput,
  type MarkingService,
  previewQuestionImportInput,
  type StudentProgressFilter,
  type QuestionBankService,
  QUESTION_IMPORT_FILE_KEYS,
  requestDraftsInput,
  saveAnswerInput,
  saveMarkInput,
  studentDetailInput,
  submitAttemptInput,
  type TeachingCourseRow,
  type TeachingService,
  updateQuestionsInput,
  updateSettingsInput,
  useUpdatedVersionInput,
  validationFailed,
} from '@xr/contracts/draft';
import {
  addDraftToBank,
  addQuestion,
  type Assessment,
  type AssessmentQuestionRef,
  assessmentReadiness,
  assessmentVersion,
  type Attempt,
  type CalendarDate,
  changeAssessment,
  commitQuestionImport,
  confirmMarks,
  courseCodeFor,
  createAssessment,
  currentMembers,
  deleteQuestion,
  editQuestion,
  type Experiment,
  type ExperimentId,
  experimentGate,
  facultyScope,
  FORMAT_DISPLAY_ORDER,
  formatProgressView,
  inactiveDays,
  type IsoInstant,
  laterOf,
  parseImportRow,
  pinnedQuestions,
  planTermState,
  type PersonId,
  type Question,
  type QuestionImportReport,
  type RecordRef,
  resultView,
  saveAnswer,
  saveMark,
  startAttempt,
  type StudentPerson,
  type SubjectOf,
  submitAttempt,
  type Technology,
} from '@xr/domain';

import type { Call } from '../platform/core.js';
import type { ResolvedPerson } from '../pipeline/actor.js';
import { command, type Op, read, refuse } from '../pipeline/runner.js';
import { accessFacts, grantsOf, heldExperiments, mappingsOf, plansOf } from '../world/queries.js';
import { courseCodeKey, formatKey, resourceKey, values } from '../world/records.js';
import {
  attemptSheetOf,
  importProblem,
  importProblemParams,
  confirmedScore,
  csvDate,
  csvDateTime,
  csvText,
  fileSlug,
  isColleagueAssessment,
  markChoiceQuestionsByKey,
  nextQuestionBatchId,
  numberedQuestions,
  parseQuestionFile,
  pinnedQuestionRecord,
  pinnedReleaseOf,
  pinnedSnapshot,
  releasedWords,
  releaseInstantOf,
  sampleDrafts,
  studentAttemptFactsOf,
  totalMarksOfSnapshot,
} from './assessment-4b.js';
import { factsFor, studentAssessmentView, studentOf } from './learner.js';
import { courseCardOf, publicPageOf } from './views.js';

function field(input: unknown, name: string): unknown {
  return typeof input === 'object' && input !== null
    ? (input as Record<string, unknown>)[name]
    : undefined;
}

function institutionIdOf(person: ResolvedPerson): string {
  if (!person.institutionId) refuse({ kind: 'not-permitted', why: 'wrong-workspace' });
  return person.institutionId;
}

function attemptsOf(op: Op, assessmentId: string, studentId?: string): Attempt[] {
  return values(op.records.attempts)
    .filter(
      (attempt) =>
        attempt.assessmentId === assessmentId &&
        (studentId === undefined || attempt.studentId === studentId),
    )
    .sort((a, b) => a.attemptNumber - b.attemptNumber);
}

function hasSubmissions(op: Op, assessment: Assessment): boolean {
  return attemptsOf(op, assessment.id).some(
    (attempt) => attempt.state === 'submitted' && attempt.assessmentVersion === assessment.version,
  );
}

function assessmentSubject(op: Op, assessment: Assessment): SubjectOf<'assessment'> {
  return {
    kind: 'assessment',
    assessment,
    experimentId: assessment.experimentId,
    institutionId: assessment.institutionId,
    hasSubmissions: hasSubmissions(op, assessment),
  };
}

/** The attempt subject: the Student's access is loaded only for a Student's own actions. */
function attemptSubject(
  op: Op,
  assessment: Assessment,
  attempt: Attempt | null,
  student: StudentPerson | null,
): SubjectOf<'attempt'> {
  const experiment = op.records.experiments[assessment.experimentId] ?? null;
  return {
    kind: 'attempt',
    assessment,
    questions: values(op.records.questions),
    attempts: student ? attemptsOf(op, assessment.id, student.id) : [],
    attempt,
    experiment,
    access: student
      ? accessFacts(op.records, op.seeded, student, op.core.overlap, assessment.experimentId)
      : null,
  };
}

function totalMarksOf(op: Op, assessment: Assessment, version = assessment.version): number {
  const snapshot = assessmentVersion(assessment, version);
  return snapshot
    ? pinnedQuestions(snapshot, values(op.records.questions)).reduce(
        (sum, entry) => sum + entry.version.marks,
        0,
      )
    : 0;
}

/** Distinct students an active grant of this experiment reaches in the institution (FA-08 "reach"). */
function reachOf(op: Op, institutionId: string, experimentId: string): number {
  const reached = new Set<string>();
  for (const grant of grantsOf(op.records, institutionId)) {
    if (grant.experimentId !== experimentId || grant.state !== 'active') continue;
    if (grant.target.kind === 'student') reached.add(grant.target.studentId);
    else {
      const group = op.records.groups[grant.target.groupId];
      if (group) currentMembers(group).forEach((id) => reached.add(id));
    }
  }
  return reached.size;
}

/** Question ids → pinned refs at each question's current version; each must be in this bank. */
function refsFor(
  op: Op,
  person: ResolvedPerson,
  institutionId: string,
  experimentId: string,
  questionIds: readonly string[],
): AssessmentQuestionRef[] {
  return questionIds.map((id) => {
    const question = op.found(op.records.questions[id]);
    if (
      question.institutionId !== institutionId ||
      question.experimentId !== experimentId ||
      question.deleted !== null ||
      !op.canSee(person, { kind: 'question', question })
    ) {
      refuse({ kind: 'not-found' });
    }
    return { questionId: question.id, questionVersion: question.version };
  });
}

function usedIn(op: Op, questionId: string): Assessment[] {
  return values(op.records.assessments).filter((assessment) =>
    assessment.questions.some((ref) => ref.questionId === questionId),
  );
}

export function assessmentPort(call: Call): AssessmentService {
  return {
    // FA-22 on FA-12 (B4-06 f10; Phase 4B): this assessment's submissions list, as FA-12 shows it —
    // "Columns: student, student ID, submitted, status, score, result released to student. It
    // contains this list only." Cells are escaped and formula-safe (`csvCell`).
    exportSubmissionsCsv: (id) =>
      read(call, 'AssessmentService.exportSubmissionsCsv', (op) => {
        const person = facultyOf(op.person());
        const assessment = op.found(op.records.assessments[op.idText(id)]);
        op.see(person, { kind: 'assessment', assessment });
        ownAssessmentOnly(person, assessment);
        const rows = submissionRows(op, assessment);
        return {
          fileName: `submissions-${assessment.id}.csv`,
          csv: csvText([
            ['student', 'student ID', 'submitted', 'status', 'score', 'result released to student'],
            ...rows.map((row) => [
              row.student.fullName,
              row.student.institutionStudentId,
              row.attempt.submittedAt ? csvDateTime(row.attempt.submittedAt) : '',
              row.attempt.marking.confirmed ? 'Marked' : 'Waiting for marking',
              row.score === null ? '' : `${row.score} of ${row.outOf}`,
              releasedWords(row.release, row.releasedAt),
            ]),
          ]),
        };
      }),

    // FA-06 (B4-04 f0, f9, f10; Phase 4A): the institution's assessments of the experiments the
    // Faculty member teaches, each with its readiness, who has submitted, its reach and how many
    // submissions wait for a written answer's marks.
    listAssessments: () =>
      read(call, 'AssessmentService.listAssessments', (op) => {
        const person = facultyOf(op.person());
        return values(op.records.assessments)
          .filter((assessment) => assessment.institutionId === person.institutionId)
          .filter((assessment) => op.canSee(person, { kind: 'assessment', assessment }))
          .sort(byName)
          .map((assessment): AssessmentListRow => ({
            assessment,
            readiness: assessmentReadiness(assessment),
            submitted: submittedStudents(op, assessment),
            reach: reachOf(op, assessment.institutionId, assessment.experimentId),
            // Written answers waiting for THIS Faculty member's marks: none on a co-teaching
            // colleague's assessment (ASMT-17, OD-B4-17; Phase 4B review), as FA-18 lists them.
            waitingForMarking: isColleagueAssessment(assessment, person.personId)
              ? 0
              : waitingForMarking(op, assessment).length,
          }));
      }),

    // FA-07 step 1 (B4-04 f1, f8; Phase 4A): the experiments the Faculty member teaches, each with
    // the code Faculty see (the platform code, `courseCodeFor`) and the assessment it already has
    // (one per experiment per institution, OD-B4-01 PROVISIONAL — the command refuses a second).
    getCreateOptions: () =>
      read(call, 'AssessmentService.getCreateOptions', (op) => {
        const person = facultyOf(op.person());
        return taughtExperimentRecords(op, person).map((experiment): CreateOption => ({
          experimentId: experiment.id,
          name: experiment.live.catalogue.name,
          courseCode: facultyCourseCode(op, person, experiment.courseId),
          existingAssessmentId:
            assessmentOfExperiment(op, person.institutionId, experiment.id)?.id ?? null,
        }));
      }),

    // FA-11 (B4-06 f5, f6; Phase 4A): the questions exactly as the assessment pins them now —
    // each question's pinned version, never a newer bank version (B4-05 f8 "Use updated
    // version" is the Faculty member's own step) — and the answer key with the marking guidance.
    // Faculty only: the key never reaches a Student. A read: it creates no attempt and saves
    // nothing (B4-04 f5, B4-06 f5).
    previewAsStudent: (id) =>
      read(call, 'AssessmentService.previewAsStudent', (op) => {
        const person = facultyOf(op.person());
        const assessment = op.found(op.records.assessments[op.idText(id)]);
        op.see(person, { kind: 'assessment', assessment });
        const pinned = pinnedQuestions(
          {
            version: assessment.version,
            since: assessment.versionSince,
            name: assessment.name,
            introduction: assessment.introduction,
            rules: assessment.rules,
            questions: assessment.questions,
          },
          values(op.records.questions),
        );
        // The key of each question is read under the question's own rule: a colleague's question
        // on a co-taught experiment is policy-open (OD-B4-17, Q-10), as `getQuestion` answers it.
        for (const { questionId } of pinned) {
          const record = op.records.questions[questionId];
          if (record) op.see(person, { kind: 'question', question: record });
        }
        const questions = pinned.flatMap(({ questionId, version }) => {
          const record = op.records.questions[questionId];
          if (!record) return [];
          return [
            {
              ...record,
              text: version.text,
              body: version.body,
              marks: version.marks,
              explanation: version.explanation,
              version: version.version,
            },
          ];
        });
        return {
          questions,
          answerKey: questions.map((question) => ({
            questionId: question.id,
            correct:
              question.body.type === 'multiple-choice'
                ? question.body.correct
                : question.body.type === 'true-false'
                  ? String(question.body.correct)
                  : null,
            markingGuidance:
              question.body.type === 'written' ? question.body.markingGuidance : null,
          })),
        };
      }),

    createAssessment: (input) =>
      command(call, 'AssessmentService.createAssessment', (op) => {
        const person = op.person();
        const institutionId = institutionIdOf(person);
        const rawExperiment = field(input, 'experimentId');
        if (typeof rawExperiment === 'string') {
          const existing = values(op.records.assessments).find(
            (candidate) =>
              candidate.institutionId === institutionId && candidate.experimentId === rawExperiment,
          );
          op.allow(
            person,
            field(input, 'mode') === 'save-as-draft'
              ? 'assessment.save-draft'
              : 'assessment.create',
            {
              kind: 'assessment',
              assessment: existing ?? null,
              experimentId: rawExperiment as Experiment['id'],
              institutionId: institutionId as Assessment['institutionId'],
              hasSubmissions: false,
            },
          );
        }
        const accepted = op.parse(createAssessmentInput, input);
        const refs = refsFor(op, person, institutionId, accepted.experimentId, accepted.questions);
        const existing =
          values(op.records.assessments).find(
            (candidate) =>
              candidate.institutionId === institutionId &&
              candidate.experimentId === accepted.experimentId,
          ) ?? null;
        const assessment = op.decide(
          createAssessment({
            existing,
            institutionId: institutionId as Assessment['institutionId'],
            experimentId: accepted.experimentId,
            taughtExperiments: person.taughtExperiments,
            mode: accepted.mode === 'create' ? 'create' : 'draft',
            name: accepted.name,
            introduction: accepted.introduction,
            rules: accepted.rules,
            questions: refs,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('assessments', assessment.id, assessment);
        return { value: assessment, decision: 'createAssessment', actor: person.ref };
      }),

    getAssessment: (id) =>
      read(call, 'AssessmentService.getAssessment', (op) => {
        // The Faculty record (FA-08 … FA-10): question bodies carry the key, so never a Student's
        // (Phase 4B review: the read policy shows a Ready assessment to its Students).
        const person = facultyOf(op.person());
        const assessment = op.found(op.records.assessments[op.idText(id)]);
        op.see(person, { kind: 'assessment', assessment });
        // Phase 4B protective refusal: a question a co-teaching colleague added is read under its
        // own rule (Q-10, OD-B4-17) — its key and marking guidance are never this read's.
        for (const ref of assessment.questions) {
          const record = op.records.questions[ref.questionId];
          if (record) op.see(person, { kind: 'question', question: record });
        }
        const total = totalMarksOf(op, assessment);
        return {
          assessment,
          readiness: assessmentReadiness(assessment),
          reach: reachOf(op, assessment.institutionId, assessment.experimentId),
          submittedOnCurrentVersion: new Set(
            attemptsOf(op, assessment.id)
              .filter(
                (attempt) =>
                  attempt.state === 'submitted' && attempt.assessmentVersion === assessment.version,
              )
              .map((attempt) => attempt.studentId),
          ).size,
          totalMarks: total,
          passMarkMarks:
            assessment.rules.passMarkPercent === null
              ? null
              : (assessment.rules.passMarkPercent * total) / 100,
          questions: assessment.questions.flatMap((ref) => {
            const question = op.records.questions[ref.questionId];
            if (!question) return [];
            return [
              {
                ref,
                question,
                newerVersion: question.version > ref.questionVersion ? question.version : null,
                deletedFromBank: question.deleted !== null,
              },
            ];
          }),
        };
      }),

    updateQuestions: (input) =>
      command(call, 'AssessmentService.updateQuestions', (op) => {
        const person = op.person();
        const assessment = op.found(op.records.assessments[op.idText(field(input, 'id'))]);
        op.allow(person, 'assessment.edit-questions', assessmentSubject(op, assessment));
        const accepted = op.parse(updateQuestionsInput, input);
        const refs = accepted.questions.map((ref) => {
          const question = op.found(op.records.questions[ref.questionId]);
          if (
            question.institutionId !== assessment.institutionId ||
            question.experimentId !== assessment.experimentId ||
            !question.versions.some((version) => version.version === ref.questionVersion)
          ) {
            refuse({ kind: 'not-found' });
          }
          return { questionId: question.id, questionVersion: ref.questionVersion };
        });
        op.rev(assessment, accepted.expectedRev);
        const next = op.decide(
          changeAssessment({
            assessment,
            name: assessment.name,
            introduction: assessment.introduction,
            rules: assessment.rules,
            questions: refs,
            hasSubmissions: hasSubmissions(op, assessment),
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('assessments', next.id, next);
        return {
          value: { assessment: next, newVersion: next.version > assessment.version },
          decision: 'changeAssessment',
          actor: person.ref,
        };
      }),

    useUpdatedVersion: (input) =>
      command(call, 'AssessmentService.useUpdatedVersion', (op) => {
        const person = op.person();
        const assessment = op.found(op.records.assessments[op.idText(field(input, 'id'))]);
        op.allow(person, 'assessment.edit-questions', assessmentSubject(op, assessment));
        const accepted = op.parse(useUpdatedVersionInput, input);
        const question = op.found(op.records.questions[accepted.questionId]);
        if (!assessment.questions.some((ref) => ref.questionId === question.id)) {
          refuse({ kind: 'invalid-state', current: 'not-in-assessment' });
        }
        op.rev(assessment, accepted.expectedRev);
        const next = op.decide(
          changeAssessment({
            assessment,
            name: assessment.name,
            introduction: assessment.introduction,
            rules: assessment.rules,
            questions: assessment.questions.map((ref) =>
              ref.questionId === question.id ? { ...ref, questionVersion: question.version } : ref,
            ),
            hasSubmissions: hasSubmissions(op, assessment),
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('assessments', next.id, next);
        return {
          value: { assessment: next, newVersion: next.version > assessment.version },
          decision: 'changeAssessment',
          actor: person.ref,
        };
      }),

    updateSettings: (input) =>
      command(call, 'AssessmentService.updateSettings', (op) => {
        const person = op.person();
        const assessment = op.found(op.records.assessments[op.idText(field(input, 'id'))]);
        op.allow(person, 'assessment.edit-settings', assessmentSubject(op, assessment));
        const accepted = op.parse(updateSettingsInput, input);
        op.rev(assessment, accepted.expectedRev);
        const next = op.decide(
          changeAssessment({
            assessment,
            name: accepted.name,
            introduction: accepted.introduction,
            rules: accepted.rules,
            questions: assessment.questions,
            hasSubmissions: hasSubmissions(op, assessment),
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('assessments', next.id, next);
        return {
          value: {
            assessment: next,
            newVersion: next.version > assessment.version,
            releaseChanged:
              JSON.stringify(next.rules.release) !== JSON.stringify(assessment.rules.release),
          },
          decision: 'changeAssessment',
          actor: person.ref,
        };
      }),

    // FA-12 (B4-06 f7 … f11; Phase 4B): the assessment's submitted attempts, oldest first, with
    // the confirmed score (ATT-19: none before) and the "result released to student" flag read from
    // each attempt's own version (PC-54, PC-57). The Faculty member's own assessment only (ATT-18).
    listSubmissions: (id) =>
      read(call, 'AssessmentService.listSubmissions', (op) => {
        const person = facultyOf(op.person());
        const assessment = op.found(op.records.assessments[op.idText(id)]);
        op.see(person, { kind: 'assessment', assessment });
        ownAssessmentOnly(person, assessment);
        return submissionRows(op, assessment);
      }),

    listMyAssessments: () =>
      read(call, 'AssessmentService.listMyAssessments', (op) => {
        const student = studentOf(op.person());
        return values(op.records.assessments)
          .filter((assessment) => assessment.institutionId === student.institutionId)
          .flatMap((assessment) => {
            const { view, attempts, result } = studentAssessmentView(op, student, assessment);
            if (!view.visible) return [];
            const experiment = op.records.experiments[assessment.experimentId];
            const latest = [...attempts].sort((a, b) => a.attemptNumber - b.attemptNumber).at(-1);
            const current = pinnedSnapshot(assessment);
            return [
              {
                assessment,
                experimentName: experiment?.live.catalogue.name ?? assessment.name,
                result,
                attemptsUsed: attempts.length,
                // PC-56: the code Students see, the current version's size, the latest attempt.
                courseCode: experiment ? studentCourseCode(op, student, experiment.courseId) : null,
                questionCount: current.questions.length,
                totalMarks: totalMarksOfSnapshot(op, current),
                latest: latest ? studentAttemptFactsOf(op, assessment, latest) : null,
              },
            ];
          });
      }),

    getAssessmentIntro: (id) =>
      read(call, 'AssessmentService.getAssessmentIntro', (op) => {
        const person = op.person();
        const student = studentOf(person);
        const assessment = op.found(op.records.assessments[op.idText(id)]);
        op.see(person, { kind: 'assessment', assessment });
        const experiment = op.records.experiments[assessment.experimentId] ?? null;
        const facts = factsFor(op, student, assessment.experimentId);
        if (!experiment || !facts) refuse({ kind: 'refused', code: 'not-given' });
        op.see(person, { kind: 'student-learning', experiment, access: facts });
        const { view, attempts } = studentAssessmentView(op, student, assessment);
        if (!view.visible) refuse({ kind: 'refused', code: 'not-given' });
        const total = totalMarksOf(op, assessment);
        const subject = attemptSubject(op, assessment, null, student);
        const canStart = op.canDo(
          person,
          attempts.length > 0 ? 'attempt.try-again' : 'attempt.start',
          subject,
        );
        // PC-55: the question mix of the version a new attempt would pin, the Student's own
        // attempts (figure-free until released) and the one in progress — never a key.
        const ordered = [...attempts].sort((a, b) => a.attemptNumber - b.attemptNumber);
        const inProgress = ordered.find((attempt) => attempt.state === 'in-progress') ?? null;
        const mix = numberedQuestions(op, pinnedSnapshot(assessment)).map(
          (entry) => entry.version.body.type,
        );
        return {
          assessment,
          totalMarks: total,
          passMarkMarks: ((assessment.rules.passMarkPercent ?? 0) * total) / 100,
          attemptsUsed: attempts.length,
          canStart,
          experimentName: experiment.live.catalogue.name,
          courseCode: studentCourseCode(op, student, experiment.courseId),
          questionTypes: {
            multipleChoice: mix.filter((type) => type === 'multiple-choice').length,
            trueFalse: mix.filter((type) => type === 'true-false').length,
            written: mix.filter((type) => type === 'written').length,
          },
          attempts: ordered.map((attempt) => studentAttemptFactsOf(op, assessment, attempt)),
          sheet: inProgress ? attemptSheetOf(op, assessment, inProgress) : null,
        };
      }),

    startAttempt: (id) =>
      command(call, 'AssessmentService.startAttempt', (op) => {
        const person = op.person();
        const student = studentOf(person);
        const assessment = op.found(op.records.assessments[op.idText(id)]);
        const subject = attemptSubject(op, assessment, null, student);
        op.allow(
          person,
          subject.attempts.length > 0 ? 'attempt.try-again' : 'attempt.start',
          subject,
        );
        const experiment = op.records.experiments[assessment.experimentId] ?? null;
        const attempt = op.decide(
          startAttempt({
            assessment,
            gate: subject.access
              ? experimentGate({ ...subject.access, experiment, now: op.now })
              : { canOpen: false, reason: 'not-given' },
            attempts: subject.attempts,
            questions: subject.questions,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          id,
        );
        op.tx.put('attempts', attempt.id, attempt);
        return { value: attempt, decision: 'startAttempt', actor: person.ref };
      }),

    saveAnswer: (input) =>
      command(call, 'AssessmentService.saveAnswer', (op) => {
        const person = op.person();
        const student = studentOf(person);
        const attempt = op.found(op.records.attempts[op.idText(field(input, 'attemptId'))]);
        const assessment = op.found(op.records.assessments[attempt.assessmentId]);
        op.allow(person, 'attempt.answer', attemptSubject(op, assessment, attempt, student));
        const accepted = op.parse(saveAnswerInput, input);
        op.rev(attempt, accepted.expectedRev);
        // "Unanswered allowed" (B4-12): no answer is a value nothing writes — no clearing rule is drawn.
        if (accepted.answer === null)
          return { value: attempt, decision: 'saveAnswer', actor: person.ref };
        const next = op.decide(
          saveAnswer({
            attempt,
            assessment,
            questions: values(op.records.questions),
            questionId: accepted.questionId,
            value: accepted.answer,
            actor: person.ref,
            now: op.now,
          }),
          input,
        );
        op.tx.put('attempts', next.id, next);
        return { value: next, decision: 'saveAnswer', actor: person.ref };
      }),

    submitAttempt: async (input) => {
      let marked: readonly RecordRef[] = [];
      const answer = await command(call, 'AssessmentService.submitAttempt', (op) => {
        const person = op.person();
        const student = studentOf(person);
        const attempt = op.found(op.records.attempts[op.idText(field(input, 'attemptId'))]);
        const assessment = op.found(op.records.assessments[attempt.assessmentId]);
        op.allow(person, 'attempt.submit', attemptSubject(op, assessment, attempt, student));
        const accepted = op.parse(submitAttemptInput, input);
        op.rev(attempt, accepted.expectedRev);
        const next = op.decide(submitAttempt({ attempt, actor: person.ref, now: op.now }), input);
        op.tx.put('attempts', next.id, next);
        return {
          value: next,
          decision: 'submitAttempt',
          actor: person.ref,
          // PC-60 (owner answer to P4-01, 16 Oct 2026): in a local prototype build the sample
          // platform's `system:objective-marks` stand-in marks the choice questions by the pinned
          // key — a system event of its own, after this command. The Student's receipt is the
          // submitted attempt as written here, before any mark (no figure, ATT-15).
          after: () => {
            if (call.core.objectiveMarks === 'answer-key-on-submit')
              marked = markChoiceQuestionsByKey(call.core, next.id);
          },
        };
      });
      return answer.ok && marked.length > 0
        ? { ...answer, changed: joinedRefs(answer.changed, marked) }
        : answer;
    },

    getResult: (attemptId) =>
      read(call, 'AssessmentService.getResult', (op) => {
        // ST-14: the Student's own result page (Faculty read attempts through marking, FA-19).
        const person = op.person();
        studentOf(person);
        const attempt = op.found(op.records.attempts[op.idText(attemptId)]);
        const assessment = op.found(op.records.assessments[attempt.assessmentId]);
        op.see(person, { kind: 'attempt', studentId: attempt.studentId, assessment });
        const questions = values(op.records.questions);
        const result = resultView({ attempt, assessment, questions, now: op.now });
        // PC-55: the attempt's pinned version — its name, attempts allowed and release terms.
        const pinnedVersion = pinnedSnapshot(assessment, attempt.assessmentVersion);
        const facts = {
          assessmentName: pinnedVersion.name,
          attemptNumber: attempt.attemptNumber,
          attemptsAllowed: pinnedVersion.rules.attemptsAllowed,
          submittedAt: attempt.submittedAt,
          release: pinnedReleaseOf(pinnedVersion.rules),
        };
        if (result.kind !== 'released') return { result, review: null, ...facts };
        const snapshot = assessmentVersion(assessment, attempt.assessmentVersion);
        const pinned = snapshot ? pinnedQuestions(snapshot, questions) : [];
        return {
          result,
          ...facts,
          review: pinned.map((entry, index) => {
            const body = entry.version.body;
            const automatic = attempt.marking.automatic.find(
              (m) => m.questionId === entry.questionId,
            );
            const written = attempt.marking.written.find((m) => m.questionId === entry.questionId);
            return {
              questionId: entry.questionId,
              yourAnswer: attempt.answers[entry.questionId] ?? null,
              // Shown after release (OD-B4-09); read for display, never to score anything.
              correct:
                body.type === 'multiple-choice'
                  ? body.correct
                  : body.type === 'true-false'
                    ? String(body.correct)
                    : null,
              explanation: entry.version.explanation,
              feedback: written?.feedback ?? null,
              awarded: automatic?.awarded ?? written?.mark ?? 0,
              outOf: entry.version.marks,
              number: index + 1,
              type: body.type,
              text: entry.version.text,
              options: body.type === 'multiple-choice' ? { ...body.options } : null,
              feedbackBy:
                written?.feedback && written.savedBy?.kind === 'person'
                  ? written.savedBy.displayName
                  : null,
            };
          }),
        };
      }),
  };
}

export function questionBankPort(call: Call): QuestionBankService {
  return {
    // FA-16 (B4-08 f0 … f4; Phase 4B): the sample drafting stand-in — no provider is named (T-23,
    // OD-B4-12). The drafts are held for the Faculty member's review (adapter state, never a world
    // record) and never enter the bank on their own (Q-06): nothing is written here.
    requestDrafts: (input) =>
      command(call, 'QuestionBankService.requestDrafts', (op) => {
        const person = facultyOf(op.person());
        const institutionId = person.institutionId as Question['institutionId'];
        const rawExperiment = field(input, 'experimentId');
        if (typeof rawExperiment === 'string') {
          op.allow(person, 'question.request-drafts', {
            kind: 'question-bank',
            experimentId: rawExperiment as Question['experimentId'],
            institutionId,
            question: null,
            draft: null,
          });
        }
        const accepted = op.parse(requestDraftsInput, input);
        const experiment = op.found(op.records.experiments[accepted.experimentId]);
        const drafts = sampleDrafts(call.core, {
          institutionId,
          requestedBy: person.personId,
          experimentId: experiment.id,
          experimentName: experiment.live.catalogue.name,
          source: accepted.source,
          pastedText: accepted.pastedText,
          types: accepted.types,
          howMany: accepted.howMany,
          now: op.now,
        });
        return {
          value: drafts,
          decision: 'requestDrafts',
          actor: person.ref,
          after: () => {
            for (const draft of drafts) call.core.drafts.set(draft.id, draft);
          },
        };
      }),

    // The Faculty member's own drafts for one experiment, oldest first (Q-05 "own drafts").
    listDrafts: (experimentId) =>
      read(call, 'QuestionBankService.listDrafts', (op) => {
        const person = facultyOf(op.person());
        teachingScope(person, experimentId);
        return [...call.core.drafts.values()].filter(
          (draft) =>
            draft.requestedBy === person.personId &&
            draft.institutionId === person.institutionId &&
            draft.experimentId === experimentId,
        );
      }),

    // "Add to bank" (Q-05): the reviewed content as the Faculty member typed it — the marks are
    // theirs to set; the question is "From a draft you reviewed" (origin `reviewed-draft`).
    addDraftToBank: (input) =>
      command(call, 'QuestionBankService.addDraftToBank', (op) => {
        const person = facultyOf(op.person());
        const draft = op.found(call.core.drafts.get(op.idText(field(input, 'draftId'))));
        op.allow(person, 'question.review-draft', {
          kind: 'question-bank',
          experimentId: draft.experimentId,
          institutionId: draft.institutionId,
          question: null,
          draft,
        });
        const accepted = op.parse(addDraftToBankInput, input);
        if (accepted.experimentId !== draft.experimentId) refuse({ kind: 'not-found' });
        const question = op.decide(
          addDraftToBank({
            draft,
            institutionId: person.institutionId as Question['institutionId'],
            taughtExperiments: person.taughtExperiments,
            content: {
              text: accepted.text,
              body: accepted.body,
              marks: accepted.marks,
              explanation: accepted.explanation,
            },
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('questions', question.id, question);
        return {
          value: question,
          decision: 'addDraftToBank',
          actor: person.ref,
          after: () => {
            call.core.drafts.delete(draft.id);
          },
        };
      }),

    // "Discard" (Q-05): the draft is dropped and leaves no trace — nothing is written.
    discardDraft: (input) =>
      command(call, 'QuestionBankService.discardDraft', (op) => {
        const person = facultyOf(op.person());
        const draft = op.found(call.core.drafts.get(op.idText(field(input, 'draftId'))));
        op.allow(person, 'question.review-draft', {
          kind: 'question-bank',
          experimentId: draft.experimentId,
          institutionId: draft.institutionId,
          question: null,
          draft,
        });
        op.parse(discardDraftInput, input);
        return {
          value: { discarded: true as const },
          decision: 'discardDraft',
          actor: person.ref,
          after: () => {
            call.core.drafts.delete(draft.id);
          },
        };
      }),

    // FA-17 step 2 (B4-08 f5, f6; Phase 4B): the service reads the chosen CSV file — the ten
    // template columns — and reports each row's problems; errors block (T-24 interim, all or
    // nothing), an empty explanation is a warning. The rows wait in the adapter for the commit.
    previewQuestionImport: (input) =>
      read(call, 'QuestionBankService.previewQuestionImport', (op) => {
        const person = facultyOf(op.person());
        const institutionId = person.institutionId as Question['institutionId'];
        const rawExperiment = field(input, 'experimentId');
        if (typeof rawExperiment === 'string') {
          op.allow(person, 'question.import', {
            kind: 'question-bank',
            experimentId: rawExperiment as Question['experimentId'],
            institutionId,
            question: null,
            draft: null,
          });
        }
        const accepted = op.parse(previewQuestionImportInput, input);
        const parsed = parseQuestionFile(accepted.csvText);
        if (parsed.kind !== 'rows') {
          refuse(
            validationFailed([fieldError('file', QUESTION_IMPORT_FILE_KEYS[parsed.kind])], null),
          );
        }
        const problems = parsed.rows.flatMap((row) =>
          parseImportRow(row).problems.map((problem) => ({
            row: problem.row,
            question: problem.question,
            problem: importProblem(problem.problem, row),
            severity: problem.severity,
          })),
        );
        const batchId = nextQuestionBatchId(call.core, accepted.fileName);
        call.core.questionImports.set(batchId, {
          batchId,
          institutionId,
          experimentId: accepted.experimentId,
          personId: person.personId,
          fileName: accepted.fileName,
          rows: parsed.rows,
        });
        const report: QuestionImportReport = {
          batchId: batchId as QuestionImportReport['batchId'],
          fileName: accepted.fileName,
          rowsChecked: parsed.rows.length,
          rows: problems,
          canImport: problems.every((problem) => problem.severity !== 'error'),
        };
        return report;
      }),

    // FA-17 step 3 (B4-08 f7, f8): every row or none (T-24); the questions go into the bank only —
    // never into an assessment.
    commitQuestionImport: (input) =>
      command(call, 'QuestionBankService.commitQuestionImport', (op) => {
        const person = facultyOf(op.person());
        const accepted = op.parse(commitQuestionImportInput, input);
        const batch = op.found(call.core.questionImports.get(accepted.batchId));
        if (batch.personId !== person.personId) refuse({ kind: 'not-found' });
        const institutionId = person.institutionId as Question['institutionId'];
        op.allow(person, 'question.import', {
          kind: 'question-bank',
          experimentId: batch.experimentId as Question['experimentId'],
          institutionId,
          question: null,
          draft: null,
        });
        const questions = op.decide(
          commitQuestionImport({
            rows: batch.rows,
            institutionId,
            experimentId: batch.experimentId as Question['experimentId'],
            taughtExperiments: person.taughtExperiments,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
          (issue) => {
            const row = batch.rows.find((entry) => `row ${entry.row}` === issue.field);
            return row ? importProblemParams(issue.rule, row) : {};
          },
        );
        for (const question of questions) op.tx.put('questions', question.id, question);
        return {
          value: { added: questions.map((question) => question.id) },
          decision: 'commitQuestionImport',
          actor: person.ref,
          after: () => {
            call.core.questionImports.delete(batch.batchId);
          },
        };
      }),

    listQuestions: (filter) =>
      read(call, 'QuestionBankService.listQuestions', (op) => {
        const person = op.person();
        const institutionId = institutionIdOf(person);
        // A Faculty member's experiment outside their teaching scope is out of scope (PC-16) —
        // checked before the input is (step 3 before step 4).
        teachingScope(person, field(filter, 'experimentId'));
        const accepted = op.parse(listQuestionsInput, filter);
        teachingScope(person, accepted.experimentId);
        return values(op.records.questions)
          .filter(
            (question) =>
              question.institutionId === institutionId &&
              question.experimentId === accepted.experimentId,
          )
          .filter((question) => op.canSee(person, { kind: 'question', question }))
          .filter((question) => !accepted.type || question.body.type === accepted.type)
          .filter((question) => accepted.includeDeleted === true || question.deleted === null)
          .map((question) => ({ question, usedIn: usedIn(op, question.id).length }));
      }),

    getQuestion: (id) =>
      read(call, 'QuestionBankService.getQuestion', (op) => {
        const person = op.person();
        const question = op.found(op.records.questions[op.idText(id)]);
        op.see(person, { kind: 'question', question });
        return { question, usedIn: usedIn(op, question.id).map((assessment) => assessment.id) };
      }),

    addQuestion: (input) =>
      command(call, 'QuestionBankService.addQuestion', (op) => {
        const person = op.person();
        const institutionId = institutionIdOf(person) as Question['institutionId'];
        const rawExperiment = field(input, 'experimentId');
        if (typeof rawExperiment === 'string') {
          op.allow(person, 'question.add', {
            kind: 'question-bank',
            experimentId: rawExperiment as Question['experimentId'],
            institutionId,
            question: null,
            draft: null,
          });
        }
        const accepted = op.parse(addQuestionInput, input);
        const question = op.decide(
          addQuestion({
            institutionId,
            experimentId: accepted.experimentId,
            taughtExperiments: person.taughtExperiments,
            text: accepted.text,
            body: accepted.body,
            marks: accepted.marks,
            explanation: accepted.explanation,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('questions', question.id, question);
        return { value: question, decision: 'addQuestion', actor: person.ref };
      }),

    editQuestion: (input) =>
      command(call, 'QuestionBankService.editQuestion', (op) => {
        const person = op.person();
        const question = op.found(op.records.questions[op.idText(field(input, 'id'))]);
        op.allow(person, 'question.edit', {
          kind: 'question-bank',
          experimentId: question.experimentId,
          institutionId: question.institutionId,
          question,
          draft: null,
        });
        const accepted = op.parse(editQuestionInput, input);
        op.rev(question, accepted.expectedRev);
        const next = op.decide(
          editQuestion({
            question,
            content: {
              text: accepted.text,
              body: accepted.body,
              marks: accepted.marks,
              explanation: accepted.explanation,
            },
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('questions', next.id, next);
        return {
          value: { question: next, newVersion: next.version > question.version },
          decision: 'editQuestion',
          actor: person.ref,
        };
      }),

    deleteQuestion: (input) =>
      command(call, 'QuestionBankService.deleteQuestion', (op) => {
        const person = op.person();
        const question = op.found(op.records.questions[op.idText(field(input, 'id'))]);
        op.allow(person, 'question.delete', {
          kind: 'question-bank',
          experimentId: question.experimentId,
          institutionId: question.institutionId,
          question,
          draft: null,
        });
        const accepted = op.parse(deleteQuestionInput, input);
        op.rev(question, accepted.expectedRev);
        const next = op.decide(
          deleteQuestion({ question, actor: person.ref, now: op.now, ids: op.ids }),
          input,
        );
        op.tx.put('questions', next.id, next);
        return { value: next, decision: 'deleteQuestion', actor: person.ref };
      }),
  };
}

/** Written questions pinned by an attempt's version, in order (for "question <n>"). */
function writtenOf(op: Op, assessment: Assessment, attempt: Attempt) {
  const snapshot = assessmentVersion(assessment, attempt.assessmentVersion);
  const pinned = snapshot ? pinnedQuestions(snapshot, values(op.records.questions)) : [];
  return pinned.map((entry, index) => ({ ...entry, number: index + 1 }));
}

export function markingPort(call: Call): MarkingService {
  return {
    // FA-18 (B4-09 f0, f4, f5; Phase 4B): written answers in the Faculty member's own assessments,
    // oldest first — a co-teaching colleague's are not this queue's (ASMT-17, OD-B4-17).
    listQueue: (filter) =>
      read(call, 'MarkingService.listQueue', (op) => {
        const person = facultyOf(op.person());
        const accepted = op.parse(listQueueInput, filter);
        return values(op.records.attempts)
          .filter((attempt) => attempt.state === 'submitted')
          .flatMap((attempt) => {
            const assessment = op.records.assessments[attempt.assessmentId];
            if (!assessment) return [];
            if (accepted.assessmentId && assessment.id !== accepted.assessmentId) return [];
            if (!op.canSee(person, { kind: 'attempt', studentId: attempt.studentId, assessment }))
              return [];
            if (isColleagueAssessment(assessment, person.personId)) return [];
            const written = writtenOf(op, assessment, attempt).filter(
              (entry) => entry.version.body.type === 'written',
            );
            if (written.length === 0) return [];
            const confirmed = attempt.marking.confirmed !== null;
            if (accepted.state === 'waiting' && confirmed) return [];
            if (accepted.state === 'marked' && !confirmed) return [];
            const student = op.records.people[attempt.studentId];
            if (student?.kind !== 'student' || !attempt.submittedAt) return [];
            return [
              {
                attempt,
                student,
                assessmentName: pinnedSnapshot(assessment, attempt.assessmentVersion).name,
                submittedAt: attempt.submittedAt,
                experimentName:
                  op.records.experiments[assessment.experimentId]?.live.catalogue.name ?? '',
                writtenNumbers: written.map((entry) => entry.number),
              },
            ];
          })
          .sort((a, b) =>
            a.submittedAt === b.submittedAt ? 0 : a.submittedAt < b.submittedAt ? -1 : 1,
          );
      }),

    // FA-19 (B4-09 f1 … f3, f7, f8; Phase 4B): the submitted attempt, its written questions as its
    // version pins them (with their marking guidance — Faculty only), the choice questions' marks
    // and the pinned release terms. A co-teaching colleague's assessment is policy-open (ASMT-17).
    getAttemptForMarking: (attemptId) =>
      read(call, 'MarkingService.getAttemptForMarking', (op) => {
        const person = facultyOf(op.person());
        const attempt = op.found(op.records.attempts[op.idText(attemptId)]);
        const assessment = op.found(op.records.assessments[attempt.assessmentId]);
        op.see(person, { kind: 'attempt', studentId: attempt.studentId, assessment });
        ownAssessmentOnly(person, assessment);
        if (attempt.state !== 'submitted') refuse({ kind: 'not-found' });
        const student = op.found(op.records.people[attempt.studentId]);
        if (student.kind !== 'student') refuse({ kind: 'not-found' });
        const snapshot = pinnedSnapshot(assessment, attempt.assessmentVersion);
        const numbered = numberedQuestions(op, snapshot);
        return {
          attempt,
          questions: numbered
            .filter((entry) => entry.version.body.type === 'written')
            .flatMap((entry) => {
              const question = pinnedQuestionRecord(op, entry);
              return question ? [question] : [];
            }),
          // Pre-rendered words (PC-13) are not invented here: the release fact is the screen's.
          releaseLine: null,
          student,
          assessmentName: snapshot.name,
          experimentName:
            op.records.experiments[assessment.experimentId]?.live.catalogue.name ?? '',
          attemptsAllowed: snapshot.rules.attemptsAllowed,
          release: pinnedReleaseOf(snapshot.rules),
          numbering: numbered.map((entry) => ({
            questionId: entry.questionId,
            number: entry.number,
            type: entry.version.body.type,
            marks: entry.version.marks,
          })),
        };
      }),

    saveMark: (input) =>
      command(call, 'MarkingService.saveMark', (op) => {
        const person = op.person();
        const attempt = op.found(op.records.attempts[op.idText(field(input, 'attemptId'))]);
        const assessment = op.found(op.records.assessments[attempt.assessmentId]);
        op.allow(person, 'marking.save-mark', attemptSubject(op, assessment, attempt, null));
        const accepted = op.parse(saveMarkInput, input);
        const entry = writtenOf(op, assessment, attempt).find(
          (candidate) =>
            candidate.questionId === accepted.questionId &&
            candidate.version.body.type === 'written',
        );
        let mark: number | null = null;
        if (entry) {
          const typed = acceptMarkAsTyped(accepted.mark, {
            number: entry.number,
            marks: entry.version.marks,
          });
          if (!typed.ok) refuse(validationFailed([typed.error], null));
          mark = typed.mark;
        }
        op.rev(attempt, accepted.expectedRev);
        const next = op.decide(
          saveMark({
            attempt,
            assessment,
            questions: values(op.records.questions),
            questionId: accepted.questionId,
            mark,
            feedback: accepted.feedback,
            actor: person.ref,
            now: op.now,
          }),
          input,
          () => ({ question: String(entry?.number ?? 1), max: String(entry?.version.marks ?? 0) }),
        );
        op.tx.put('attempts', next.id, next);
        return { value: next, decision: 'saveMark', actor: person.ref };
      }),

    confirmMarks: (input) =>
      command(call, 'MarkingService.confirmMarks', (op) => {
        const person = op.person();
        const attempt = op.found(op.records.attempts[op.idText(field(input, 'attemptId'))]);
        const assessment = op.found(op.records.assessments[attempt.assessmentId]);
        op.allow(person, 'marking.confirm', attemptSubject(op, assessment, attempt, null));
        const accepted = op.parse(confirmMarksInput, input);
        op.rev(attempt, accepted.expectedRev);
        const written = writtenOf(op, assessment, attempt).find(
          (entry) => entry.version.body.type === 'written',
        );
        const next = op.decide(
          confirmMarks({
            attempt,
            assessment,
            questions: values(op.records.questions),
            actor: person.ref,
            now: op.now,
          }),
          input,
          () => ({ question: String(written?.number ?? 1) }),
        );
        op.tx.put('attempts', next.id, next);
        return { value: next, decision: 'confirmMarks', actor: person.ref };
      }),
  };
}

/**
 * FA-20 row: per-format progress (never a Student's feedback, FB-06), the assessment, last activity.
 * The result of an assessment a co-teaching colleague created reads `policy-open` OD-B4-17 when a
 * `viewer` is named (Phase 4B protective refusal, PC-59).
 */
function facultyRow(
  op: Op,
  student: StudentPerson,
  experiment: Experiment,
  formats: readonly Technology[],
  viewer: PersonId | null = null,
): FacultyStudentRow {
  const institution = op.records.institutions[student.institutionId];
  const perFormat = formats.map((format) => {
    const key = formatKey(student.id, experiment.id, format);
    return formatProgressView({
      experimentId: experiment.id,
      format,
      activity: op.records.activities[key] ?? null,
      completion: op.records.completions[key] ?? null,
      feedback: 'not-offered',
      paused: institution?.pause !== null && institution?.pause !== undefined,
    });
  });
  const assessment = values(op.records.assessments).find(
    (candidate) =>
      candidate.institutionId === student.institutionId && candidate.experimentId === experiment.id,
  );
  const attempts = assessment ? attemptsOf(op, assessment.id, student.id) : [];
  const latest = attempts.at(-1);
  const result =
    assessment && latest
      ? resultView({
          attempt: latest,
          assessment,
          questions: values(op.records.questions),
          now: op.now,
        })
      : null;
  // OD-B4-10 sample rule (PC-22): the last opening of a format or of the assessment.
  let last: IsoInstant | null = null;
  for (const view of perFormat) {
    const activity = view.activity;
    for (const at of [
      activity?.firstOpenedAt,
      activity?.lastSavedAt,
      activity?.lastSessionReportedAt,
    ]) {
      if (at) last = last ? laterOf(last, at) : at;
    }
  }
  for (const attempt of attempts) {
    const at = attempt.submittedAt ?? attempt.startedAt;
    last = last ? laterOf(last, at) : at;
  }
  // B4-10 f0 "None since access was given (12 Oct 2026) · Inactive 26 days": with no activity
  // the days count from when the experiment was given (OD-B4-10 sample rule, PC-59; Phase 4B).
  const accessGivenAt = firstGivenAt(op, student, experiment.id);
  const days = inactiveDays(last ?? accessGivenAt, op.now);
  const withheld =
    assessment !== undefined && viewer !== null && isColleagueAssessment(assessment, viewer);
  return {
    studentId: student.id,
    institutionStudentId: student.institutionStudentId,
    perFormat,
    assessment: withheld
      ? { kind: 'policy-open' as const, decision: 'OD-B4-17' as const }
      : assessment
        ? (result ?? { kind: 'to-do' as const })
        : { kind: 'none-set' as const },
    resultReleased: !withheld && result?.kind === 'released',
    lastActivityAt: last,
    inactiveDays: days === null ? null : Math.max(0, days),
    name: student.fullName,
    accessGivenAt,
  };
}

/** When the experiment was first given to the Student by a grant that still reaches them (B4-10 f0). */
function firstGivenAt(op: Op, student: StudentPerson, experimentId: string): IsoInstant | null {
  let first: IsoInstant | null = null;
  for (const grant of grantsOf(op.records, student.institutionId)) {
    if (grant.experimentId !== experimentId || grant.state !== 'active') continue;
    const reaches =
      grant.target.kind === 'student'
        ? grant.target.studentId === student.id
        : (() => {
            const group = op.records.groups[grant.target.groupId];
            return group ? currentMembers(group).includes(student.id) : false;
          })();
    if (reaches && (first === null || grant.givenAt < first)) first = grant.givenAt;
  }
  return first;
}

/** Whether a grant ever gave the experiment to the Student (active or withdrawn; any membership). */
function everGiven(op: Op, student: StudentPerson, experimentId: string): boolean {
  return grantsOf(op.records, student.institutionId).some((grant) => {
    if (grant.experimentId !== experimentId) return false;
    if (grant.target.kind === 'student') return grant.target.studentId === student.id;
    const group = op.records.groups[grant.target.groupId];
    return group ? group.memberships.some((entry) => entry.studentId === student.id) : false;
  });
}

/** FA-20's Progress filter (PC-59): no format started · one in progress · one completed · waiting. */
function matchesProgress(
  row: FacultyStudentRow,
  progress: StudentProgressFilter | undefined,
): boolean {
  switch (progress) {
    case undefined:
      return true;
    case 'not-started':
      return row.perFormat.every((view) => view.status === 'not-started');
    case 'in-progress':
      return row.perFormat.some((view) => view.status === 'in-progress');
    case 'completed':
      return row.perFormat.some((view) => view.status === 'completed');
    case 'waiting-for-marking':
      return row.assessment.kind === 'waiting-for-marking';
  }
}

/** Students the experiment reaches in the Faculty member's institution (SACC-20: inside the scope). */
function reachedStudents(op: Op, institutionId: string, experimentId: string): StudentPerson[] {
  const ids = new Set<string>();
  for (const grant of grantsOf(op.records, institutionId)) {
    if (grant.experimentId !== experimentId || grant.state !== 'active') continue;
    if (grant.target.kind === 'student') ids.add(grant.target.studentId);
    else {
      const group = op.records.groups[grant.target.groupId];
      if (group) currentMembers(group).forEach((id) => ids.add(id));
    }
  }
  return [...ids].flatMap((id) => {
    const person = op.records.people[id];
    return person?.kind === 'student' ? [person] : [];
  });
}

function planFormatsOf(op: Op, institutionId: string, experimentId: string): Technology[] {
  const formats = new Set<Technology>();
  for (const plan of plansOf(op.records, institutionId)) {
    for (const item of plan.items) {
      if (item.experimentId === experimentId) item.formats.forEach((format) => formats.add(format));
    }
  }
  return (['web', 'ar', 'vr', 'mr'] as const).filter((format) => formats.has(format));
}

/** A Faculty member's experiment outside their teaching scope is out of scope (PC-16). */
function teachingScope(person: ResolvedPerson, experimentId: unknown): void {
  if (typeof experimentId !== 'string') return; // the input check answers a missing or wrong id
  if (!person.taughtExperiments.includes(experimentId as ExperimentId))
    refuse({ kind: 'not-permitted', why: 'out-of-scope' });
}

export function teachingPort(call: Call): TeachingService {
  return {
    // FA-22 on FA-20 (B4-10 f2; Phase 4B): the filtered list on screen — "Columns: student, student
    // ID, experiment, WEB, VR, assessment, result released to student, last activity. It contains
    // the filtered list only." One column per format the institution's plans give the experiment.
    exportStudentsCsv: (input) =>
      read(call, 'TeachingService.exportStudentsCsv', (op) => {
        const person = facultyOf(op.person());
        op.allow(person, 'faculty.export-students-list', { kind: 'faculty-students' });
        teachingScope(person, field(input, 'experimentId'));
        const accepted = op.parse(listTeachingStudentsInput, input);
        teachingScope(person, accepted.experimentId);
        const experiment = op.found(op.records.experiments[accepted.experimentId]);
        const formats = planFormatsOf(op, person.institutionId, experiment.id);
        const rows = studentRows(op, person, experiment, formats, accepted);
        return {
          fileName: `students-${fileSlug(experiment.live.catalogue.name)}.csv`,
          csv: csvText([
            [
              'student',
              'student ID',
              'experiment',
              ...formats.map((format) => format.toUpperCase()),
              'assessment',
              'result released to student',
              'last activity',
            ],
            ...rows.map((row) => [
              row.name,
              row.institutionStudentId,
              experiment.live.catalogue.name,
              ...formats.map((format) => {
                const view = row.perFormat.find((entry) => entry.format === format);
                if (!view || view.status === 'not-started') return 'Not started';
                if (view.status === 'in-progress') return 'In progress';
                return view.completion
                  ? `Completed ${csvDate(view.completion.completedAt)}`
                  : 'Completed';
              }),
              assessmentWords(row),
              row.resultReleased ? 'Yes' : 'No',
              row.lastActivityAt ? csvDate(row.lastActivityAt) : 'None',
            ]),
          ]),
        };
      }),

    // FA-01 (B4-01; Phase 4A; provisional register PC-51): the scope line, the attention facts
    // and the Ready assessments due in the next 30 days (at most 3, soonest first).
    getFacultyOverview: () =>
      read(call, 'TeachingService.getFacultyOverview', (op) => {
        const person = facultyOf(op.person());
        const scope = scopeOf(op, person);
        const experiments = taughtExperimentRecords(op, person);
        const attention: FacultyAttention[] = [];
        const assessments = values(op.records.assessments)
          .filter((assessment) => assessment.institutionId === person.institutionId)
          .filter((assessment) => op.canSee(person, { kind: 'assessment', assessment }))
          .sort(byName);
        for (const assessment of assessments) {
          // A co-teaching colleague's submissions are not this Faculty member's to mark or read
          // (ASMT-17, ATT-18 "own assessments"; Phase 4B review): FA-18 lists none of them.
          if (isColleagueAssessment(assessment, person.personId)) continue;
          const waiting = waitingForMarking(op, assessment);
          const oldest = waiting[0];
          const student = oldest ? op.records.people[oldest.studentId] : undefined;
          if (oldest?.submittedAt && student) {
            attention.push({
              kind: 'written-answers-to-mark',
              assessmentId: assessment.id,
              assessmentName: assessment.name,
              answers: waiting.length,
              oldest: { studentName: student.fullName, submittedAt: oldest.submittedAt },
            });
          }
        }
        const ended = new Map<string, CalendarDate>();
        for (const experiment of experiments) {
          const endedOn = accessEndedOn(op, person.institutionId, experiment.id);
          if (endedOn) ended.set(experiment.id, endedOn);
        }
        for (const experiment of experiments) {
          if (ended.has(experiment.id)) continue;
          // OD-B4-10 sample rule (PC-22) as FA-20's filter reads it: no activity counts as inactive.
          const formats = planFormatsOf(op, person.institutionId, experiment.id);
          const inactive = reachedStudents(op, person.institutionId, experiment.id).filter(
            (student) => {
              const days = facultyRow(op, student, experiment, formats).inactiveDays;
              return days === null || days >= INACTIVE_ATTENTION_DAYS;
            },
          );
          if (inactive.length > 0) {
            attention.push({
              kind: 'students-inactive',
              experimentId: experiment.id,
              experimentName: experiment.live.catalogue.name,
              days: INACTIVE_ATTENTION_DAYS,
              students: inactive.map((student) => ({
                studentId: student.id,
                name: student.fullName,
              })),
            });
          }
        }
        for (const experiment of experiments) {
          const endedOn = ended.get(experiment.id);
          if (!endedOn) continue;
          attention.push({
            kind: 'access-ended',
            experimentId: experiment.id,
            experimentName: experiment.live.catalogue.name,
            courseCode: facultyCourseCode(op, person, experiment.courseId),
            endedOn,
          });
        }
        const now = Date.parse(op.now);
        const comingUp = assessments
          .filter((assessment) => assessmentReadiness(assessment) === 'ready')
          .flatMap((assessment) => {
            const deadline = assessment.rules.deadline;
            if (deadline === null) return [];
            const at = Date.parse(deadline);
            if (at < now || at > now + COMING_UP_DAYS * 86_400_000) return [];
            return [
              {
                assessmentId: assessment.id,
                name: assessment.name,
                deadline,
                submitted: submittedStudents(op, assessment),
                reach: reachOf(op, assessment.institutionId, assessment.experimentId),
              },
            ];
          })
          .sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline))
          .slice(0, COMING_UP_AT_MOST);
        return {
          scopeLine: { courses: scope.courseIds.length, experiments: experiments.length },
          attention,
          comingUp,
        };
      }),

    // FA-02 / FA-03 / FA-04 (B4-02; Phase 4A): the courses Faculty courses (IA-15) map to the
    // Faculty member, with the experiments of each that the institution holds — the counts the
    // course row draws ("1 experiment · 5 students with access · 1 assessment") and the date the
    // institution's access to the course ended, once no live plan holds any of them (f7).
    listMyCourses: () =>
      read(call, 'TeachingService.listMyCourses', (op) => {
        const person = facultyOf(op.person());
        const taught = taughtExperimentRecords(op, person);
        return scopeOf(op, person)
          .courseIds.flatMap((courseId) => {
            const course = op.records.courses[courseId];
            return course ? [course] : [];
          })
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((course): TeachingCourseRow => {
            const experiments = taught.filter((experiment) => experiment.courseId === course.id);
            const reached = new Set<string>();
            for (const experiment of experiments) {
              reachedStudents(op, person.institutionId, experiment.id).forEach((student) =>
                reached.add(student.id),
              );
            }
            const endings = experiments.map((experiment) =>
              accessEndedOn(op, person.institutionId, experiment.id),
            );
            return {
              course: courseCardOf(op.records, course),
              experiments: experiments.length,
              studentsWithAccess: reached.size,
              assessments: experiments.filter((experiment) =>
                assessmentOfExperiment(op, person.institutionId, experiment.id),
              ).length,
              accessEndedOn:
                endings.length > 0 && endings.every((date) => date !== null)
                  ? endings.reduce((latest, date) => (date > latest ? date : latest))
                  : null,
            };
          });
      }),

    // FA-05 (B4-03; Phase 4A): the published page (outcomes and resources read-only), the formats
    // the institution's plans give it, the formats its Students have opened, per format how many
    // of the Students it reaches completed, are in progress or have not started (never one
    // figure across formats, BC4), and the institution's assessment.
    getTeachingExperiment: (experimentId) =>
      read(call, 'TeachingService.getTeachingExperiment', (op) => {
        const person = facultyOf(op.person());
        teachingScope(person, experimentId);
        const experiment = op.found(op.records.experiments[op.idText(experimentId)]);
        const formats = planFormatsOf(op, person.institutionId, experiment.id);
        const rows = reachedStudents(op, person.institutionId, experiment.id).map((student) =>
          facultyRow(op, student, experiment, formats),
        );
        // The formats the Students it reaches have started or completed — the same Students and
        // the same reading as the per-format counts (Phase 4A review).
        const used = new Set<Technology>();
        for (const row of rows) {
          for (const view of row.perFormat)
            if (view.status !== 'not-started') used.add(view.format);
        }
        return {
          experiment: publicPageOf(op.records, experiment),
          formatsInstitutionHas: formats,
          formatsUsedByStudents: FORMAT_DISPLAY_ORDER.filter((format) => used.has(format)),
          perFormatCounts: formats.map((format) => {
            const statuses = rows.map(
              (row) => row.perFormat.find((view) => view.format === format)?.status,
            );
            return {
              format,
              completed: statuses.filter((status) => status === 'completed').length,
              inProgress: statuses.filter((status) => status === 'in-progress').length,
              notStarted: statuses.filter((status) => status === 'not-started').length,
            };
          }),
          assessmentId: assessmentOfExperiment(op, person.institutionId, experiment.id)?.id ?? null,
          resources: experiment.resources.map((resource) => ({ title: resource.title })),
          asOf: op.now,
        };
      }),

    // FA-20 (B4-10 f0, f1, f6, f7; Phase 4B): the Students an experiment the Faculty member teaches
    // reaches, by name, with the Progress and "Inactive for" filters (PC-59; OD-B4-10 sample rule).
    listStudents: (input) =>
      read(call, 'TeachingService.listStudents', (op) => {
        const person = facultyOf(op.person());
        teachingScope(person, field(input, 'experimentId'));
        const accepted = op.parse(listTeachingStudentsInput, input);
        teachingScope(person, accepted.experimentId);
        const experiment = op.found(op.records.experiments[accepted.experimentId]);
        const formats = planFormatsOf(op, person.institutionId, experiment.id);
        return studentRows(op, person, experiment, formats, accepted);
      }),

    // FA-21 (B4-10 f3 … f5; Phase 4B): one Student on one taught experiment — per-format status,
    // the assessment's attempts with their confirmed scores and pinned release terms, and the
    // resources opened. A co-teaching colleague's assessment leaves the attempts out (PC-59).
    getStudentDetail: (input) =>
      read(call, 'TeachingService.getStudentDetail', (op) => {
        const person = facultyOf(op.person());
        const institutionId = person.institutionId;
        const student = op.found(op.records.people[op.idText(field(input, 'studentId'))]);
        if (student.kind !== 'student') refuse({ kind: 'not-found' });
        const experiment = op.found(
          op.records.experiments[op.idText(field(input, 'experimentId'))],
        );
        const facts = accessFacts(op.records, op.seeded, student, op.core.overlap, experiment.id);
        if (!facts) refuse({ kind: 'not-found' });
        op.see(person, { kind: 'student-learning', experiment, access: facts });
        op.parse(studentDetailInput, input);
        // FA-21 is a Student the experiment was given to (Phase 4B): one it was never given is not
        // found; after a withdrawal the Faculty member still reads their work (WP-0.14
        // B-withdraw, "earlier work kept").
        if (!everGiven(op, student, experiment.id)) refuse({ kind: 'not-found' });
        const assessment = values(op.records.assessments).find(
          (candidate) =>
            candidate.institutionId === institutionId && candidate.experimentId === experiment.id,
        );
        const withheld = assessment ? isColleagueAssessment(assessment, person.personId) : false;
        const attempts = assessment && !withheld ? attemptsOf(op, assessment.id, student.id) : [];
        return {
          row: facultyRow(
            op,
            student,
            experiment,
            planFormatsOf(op, institutionId, experiment.id),
            person.personId,
          ),
          resources: experiment.resources.map((resource) => ({
            title: resource.title,
            openedAt:
              op.records.resourcesOpened[resourceKey(student.id, resource.id)]?.firstOpenedAt ??
              null,
          })),
          attempts,
          experimentName: experiment.live.catalogue.name,
          courseCode: facultyCourseCode(op, person, experiment.courseId),
          assessment: assessment ? { assessmentId: assessment.id, name: assessment.name } : null,
          attemptFacts: assessment
            ? attempts.map((attempt) => {
                const snapshot = pinnedSnapshot(assessment, attempt.assessmentVersion);
                const result = resultView({
                  attempt,
                  assessment,
                  questions: values(op.records.questions),
                  now: op.now,
                });
                return {
                  attemptId: attempt.id,
                  attemptsAllowed: snapshot.rules.attemptsAllowed,
                  score: confirmedScore(attempt),
                  outOf: totalMarksOfSnapshot(op, snapshot),
                  release: pinnedReleaseOf(snapshot.rules),
                  releasedAt: result.kind === 'released' ? result.releasedAt : null,
                };
              })
            : [],
        };
      }),
  };
}

// ---- Phase 4B helpers (FA-12, FA-18 … FA-22, ST-11 … ST-14) ----

/**
 * Phase 4B protective refusal: an assessment a co-teaching colleague created answers `policy-open`
 * OD-B4-17 for its submissions, marking page and export (ATT-18 "own assessments"; ASMT-17 OPEN).
 */
function ownAssessmentOnly(person: ResolvedPerson, assessment: Assessment): void {
  if (isColleagueAssessment(assessment, person.personId))
    refuse({ kind: 'policy-open', decision: 'OD-B4-17' });
}

/** FA-12's rows: submitted attempts, oldest first, each read against its own version (PC-57). */
function submissionRows(op: Op, assessment: Assessment) {
  return attemptsOf(op, assessment.id)
    .filter((attempt) => attempt.state === 'submitted')
    .sort((a, b) =>
      (a.submittedAt ?? '') === (b.submittedAt ?? '')
        ? a.attemptNumber - b.attemptNumber
        : (a.submittedAt ?? '') < (b.submittedAt ?? '')
          ? -1
          : 1,
    )
    .flatMap((attempt) => {
      const student = op.records.people[attempt.studentId];
      if (student?.kind !== 'student') return [];
      const result = resultView({
        attempt,
        assessment,
        questions: values(op.records.questions),
        now: op.now,
      });
      const snapshot = pinnedSnapshot(assessment, attempt.assessmentVersion);
      const releaseAt = releaseInstantOf(assessment, attempt);
      return [
        {
          attempt,
          student,
          score: result.kind === 'waiting-for-marking' ? null : confirmedScore(attempt),
          releasedAt: result.kind === 'released' && releaseAt ? releaseAt : null,
          outOf: totalMarksOfSnapshot(op, snapshot),
          release: pinnedReleaseOf(snapshot.rules),
        },
      ];
    });
}

/** FA-20's rows for a taught experiment, filtered as the screen asks (list and CSV alike). */
function studentRows(
  op: Op,
  person: FacultyPerson,
  experiment: Experiment,
  formats: readonly Technology[],
  filter: { readonly inactiveForDays?: number; readonly progress?: StudentProgressFilter },
): FacultyStudentRow[] {
  return reachedStudents(op, person.institutionId, experiment.id)
    .map((student) => facultyRow(op, student, experiment, formats, person.personId))
    .filter(
      (row) =>
        filter.inactiveForDays === undefined ||
        row.inactiveDays === null ||
        row.inactiveDays >= filter.inactiveForDays,
    )
    .filter((row) => matchesProgress(row, filter.progress))
    .sort((a, b) => a.name.localeCompare(b.name) || a.studentId.localeCompare(b.studentId));
}

/** The CSV's assessment cell: the state Faculty see on the row, never a figure before release. */
function assessmentWords(row: FacultyStudentRow): string {
  switch (row.assessment.kind) {
    case 'none-set':
      return 'No assessment set';
    case 'to-do':
      return 'Not started';
    case 'in-progress':
      return 'Attempt in progress';
    case 'waiting-for-marking':
      return 'Waiting for marking';
    case 'not-released-yet':
      return 'Marked — not released yet';
    case 'released':
      return `${row.assessment.passed ? 'Passed' : 'Not passed'} · ${row.assessment.score} of ${row.assessment.outOf}`;
    case 'policy-open':
      return 'Not available';
  }
}

/** The code Students see (`courseCodeFor('student')`: the institution's code when it set one). */
function studentCourseCode(op: Op, student: StudentPerson, courseId: string): string | null {
  const course = op.records.courses[courseId];
  if (!course) return null;
  const institutionCode =
    op.records.courseCodes[courseCodeKey(student.institutionId, courseId)]?.code ?? null;
  return courseCodeFor('student', course.platformCode, institutionCode);
}

/** Two receipts' record references, each named once. */
function joinedRefs(
  first: readonly RecordRef[],
  second: readonly RecordRef[],
): readonly RecordRef[] {
  const seen = new Set(first.map((ref) => JSON.stringify(ref)));
  return [...first, ...second.filter((ref) => !seen.has(JSON.stringify(ref)))];
}

// ---- Phase 4A Faculty reads (FA-01 … FA-07, FA-11) ----

const INACTIVE_ATTENTION_DAYS = 14;
const COMING_UP_DAYS = 30;
const COMING_UP_AT_MOST = 3;

type FacultyPerson = ResolvedPerson & { readonly institutionId: string };

/** The Faculty reads are the Faculty member's own: any other role is in the wrong workspace. */
function facultyOf(person: ResolvedPerson): FacultyPerson {
  if (person.role !== 'faculty' || !person.institutionId) {
    refuse({ kind: 'not-permitted', why: 'wrong-workspace' });
  }
  return person as FacultyPerson;
}

function byName(a: Assessment, b: Assessment): number {
  return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
}

/** Faculty courses (IA-15) ∩ the institution's plans (FCM-04, `facultyScope`). */
function scopeOf(op: Op, person: FacultyPerson) {
  return facultyScope({
    facultyId: person.personId,
    mappings: mappingsOf(op.records, person.institutionId),
    heldExperiments: heldExperiments(op.records, person.institutionId),
  });
}

/** The experiments the Faculty member teaches, by course then name. */
function taughtExperimentRecords(op: Op, person: FacultyPerson): Experiment[] {
  return person.taughtExperiments
    .flatMap((id) => {
      const experiment = op.records.experiments[id];
      return experiment ? [experiment] : [];
    })
    .sort(
      (a, b) =>
        (op.records.courses[a.courseId]?.name ?? '').localeCompare(
          op.records.courses[b.courseId]?.name ?? '',
        ) || a.live.catalogue.name.localeCompare(b.live.catalogue.name),
    );
}

/** The code Faculty see (`courseCodeFor('faculty')`: the platform code, B4-02 "ME ZG523"). */
function facultyCourseCode(op: Op, person: FacultyPerson, courseId: string): string | null {
  const course = op.records.courses[courseId];
  if (!course) return null;
  const institutionCode =
    op.records.courseCodes[courseCodeKey(person.institutionId, courseId)]?.code ?? null;
  return courseCodeFor('faculty', course.platformCode, institutionCode);
}

function assessmentOfExperiment(
  op: Op,
  institutionId: string,
  experimentId: string,
): Assessment | null {
  return (
    values(op.records.assessments).find(
      (assessment) =>
        assessment.institutionId === institutionId && assessment.experimentId === experimentId,
    ) ?? null
  );
}

/** "1 of 5 submitted": distinct Students with a submitted attempt (any version). */
function submittedStudents(op: Op, assessment: Assessment): number {
  return new Set(
    attemptsOf(op, assessment.id)
      .filter((attempt) => attempt.state === 'submitted')
      .map((attempt) => attempt.studentId),
  ).size;
}

/** Submitted attempts with a written answer whose marks are not confirmed — oldest first. */
function waitingForMarking(op: Op, assessment: Assessment): Attempt[] {
  return attemptsOf(op, assessment.id)
    .filter((attempt) => attempt.state === 'submitted' && attempt.marking.confirmed === null)
    .filter((attempt) =>
      writtenOf(op, assessment, attempt).some((entry) => entry.version.body.type === 'written'),
    )
    .sort((a, b) =>
      (a.submittedAt ?? '') === (b.submittedAt ?? '')
        ? 0
        : (a.submittedAt ?? '') < (b.submittedAt ?? '')
          ? -1
          : 1,
    );
}

/**
 * The day the institution's access to an experiment ended: every plan holding it has ended — the
 * latest end (B4-01 f3, B4-02 f7 "Access ended on 7 Oct 2027"). `null` while a plan is live.
 */
function accessEndedOn(op: Op, institutionId: string, experimentId: string): CalendarDate | null {
  const holding = plansOf(op.records, institutionId).filter((plan) =>
    plan.items.some((item) => item.experimentId === experimentId),
  );
  if (holding.length === 0) return null;
  if (holding.some((plan) => planTermState(plan, op.now) !== 'ended')) return null;
  return holding
    .map((plan) => plan.endsOn)
    .reduce((latest, date) => (date > latest ? date : latest));
}
