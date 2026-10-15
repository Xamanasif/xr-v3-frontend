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
  addQuestionInput,
  type AssessmentService,
  type AssessmentListRow,
  confirmMarksInput,
  type CreateOption,
  createAssessmentInput,
  deleteQuestionInput,
  editQuestionInput,
  type FacultyAttention,
  type FacultyStudentRow,
  listQueueInput,
  listQuestionsInput,
  listTeachingStudentsInput,
  type MarkingService,
  type QuestionBankService,
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
  addQuestion,
  type Assessment,
  type AssessmentQuestionRef,
  assessmentReadiness,
  assessmentVersion,
  type Attempt,
  type CalendarDate,
  changeAssessment,
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
  pinnedQuestions,
  planTermState,
  type Question,
  resultReleaseAt,
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
import { deferred } from './deferred.js';
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
    exportSubmissionsCsv: deferred('AssessmentService.exportSubmissionsCsv'),

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
            waitingForMarking: waitingForMarking(op, assessment).length,
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
        const person = op.person();
        const assessment = op.found(op.records.assessments[op.idText(id)]);
        op.see(person, { kind: 'assessment', assessment });
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

    listSubmissions: (id) =>
      read(call, 'AssessmentService.listSubmissions', (op) => {
        const person = op.person();
        const assessment = op.found(op.records.assessments[op.idText(id)]);
        op.see(person, { kind: 'assessment', assessment });
        return attemptsOf(op, assessment.id)
          .filter((attempt) => attempt.state === 'submitted')
          .flatMap((attempt) => {
            const student = op.records.people[attempt.studentId];
            if (student?.kind !== 'student') return [];
            const result = resultView({
              attempt,
              assessment,
              questions: values(op.records.questions),
              now: op.now,
            });
            const snapshot = assessmentVersion(assessment, attempt.assessmentVersion);
            const confirmed = attempt.marking.confirmed;
            const score =
              confirmed && result.kind !== 'waiting-for-marking'
                ? attempt.marking.automatic.reduce((sum, mark) => sum + mark.awarded, 0) +
                  attempt.marking.written.reduce((sum, mark) => sum + (mark.mark ?? 0), 0)
                : null;
            const releaseAt =
              confirmed && snapshot ? resultReleaseAt(snapshot.rules, confirmed.at) : null;
            return [
              {
                attempt,
                student,
                score,
                releasedAt: result.kind === 'released' && releaseAt ? releaseAt : null,
              },
            ];
          });
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
            return [
              {
                assessment,
                experimentName: experiment?.live.catalogue.name ?? assessment.name,
                result,
                attemptsUsed: attempts.length,
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
        return {
          assessment,
          totalMarks: total,
          passMarkMarks: ((assessment.rules.passMarkPercent ?? 0) * total) / 100,
          attemptsUsed: attempts.length,
          canStart,
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

    submitAttempt: (input) =>
      command(call, 'AssessmentService.submitAttempt', (op) => {
        const person = op.person();
        const student = studentOf(person);
        const attempt = op.found(op.records.attempts[op.idText(field(input, 'attemptId'))]);
        const assessment = op.found(op.records.assessments[attempt.assessmentId]);
        op.allow(person, 'attempt.submit', attemptSubject(op, assessment, attempt, student));
        const accepted = op.parse(submitAttemptInput, input);
        op.rev(attempt, accepted.expectedRev);
        const next = op.decide(submitAttempt({ attempt, actor: person.ref, now: op.now }), input);
        op.tx.put('attempts', next.id, next);
        return { value: next, decision: 'submitAttempt', actor: person.ref };
      }),

    getResult: (attemptId) =>
      read(call, 'AssessmentService.getResult', (op) => {
        const person = op.person();
        const attempt = op.found(op.records.attempts[op.idText(attemptId)]);
        const assessment = op.found(op.records.assessments[attempt.assessmentId]);
        op.see(person, { kind: 'attempt', studentId: attempt.studentId, assessment });
        const questions = values(op.records.questions);
        const result = resultView({ attempt, assessment, questions, now: op.now });
        if (result.kind !== 'released') return { result, review: null };
        const snapshot = assessmentVersion(assessment, attempt.assessmentVersion);
        const pinned = snapshot ? pinnedQuestions(snapshot, questions) : [];
        return {
          result,
          review: pinned.map((entry) => {
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
            };
          }),
        };
      }),
  };
}

export function questionBankPort(call: Call): QuestionBankService {
  return {
    requestDrafts: deferred('QuestionBankService.requestDrafts'),
    listDrafts: deferred('QuestionBankService.listDrafts'),
    addDraftToBank: deferred('QuestionBankService.addDraftToBank'),
    discardDraft: deferred('QuestionBankService.discardDraft'),
    previewQuestionImport: deferred('QuestionBankService.previewQuestionImport'),
    commitQuestionImport: deferred('QuestionBankService.commitQuestionImport'),

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
    listQueue: (filter) =>
      read(call, 'MarkingService.listQueue', (op) => {
        const person = op.person();
        const accepted = op.parse(listQueueInput, filter);
        return values(op.records.attempts)
          .filter((attempt) => attempt.state === 'submitted')
          .flatMap((attempt) => {
            const assessment = op.records.assessments[attempt.assessmentId];
            if (!assessment) return [];
            if (accepted.assessmentId && assessment.id !== accepted.assessmentId) return [];
            if (!op.canSee(person, { kind: 'attempt', studentId: attempt.studentId, assessment }))
              return [];
            if (!writtenOf(op, assessment, attempt).some((e) => e.version.body.type === 'written'))
              return [];
            const confirmed = attempt.marking.confirmed !== null;
            if (accepted.state === 'waiting' && confirmed) return [];
            if (accepted.state === 'marked' && !confirmed) return [];
            const student = op.records.people[attempt.studentId];
            if (student?.kind !== 'student' || !attempt.submittedAt) return [];
            return [
              {
                attempt,
                student,
                assessmentName: assessment.name,
                submittedAt: attempt.submittedAt,
              },
            ];
          })
          .sort((a, b) =>
            a.submittedAt === b.submittedAt ? 0 : a.submittedAt < b.submittedAt ? -1 : 1,
          );
      }),

    getAttemptForMarking: (attemptId) =>
      read(call, 'MarkingService.getAttemptForMarking', (op) => {
        const person = op.person();
        const attempt = op.found(op.records.attempts[op.idText(attemptId)]);
        const assessment = op.found(op.records.assessments[attempt.assessmentId]);
        op.see(person, { kind: 'attempt', studentId: attempt.studentId, assessment });
        return {
          attempt,
          questions: writtenOf(op, assessment, attempt).flatMap((entry) => {
            const question = op.records.questions[entry.questionId];
            return question ? [question] : [];
          }),
          // Pre-rendered words (PC-13) are not invented here: the release fact is the screen's.
          releaseLine: null,
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

/** FA-20 row: per-format progress (never a Student's feedback, FB-06), the assessment, last activity. */
function facultyRow(
  op: Op,
  student: StudentPerson,
  experiment: Experiment,
  formats: readonly Technology[],
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
  const days = inactiveDays(last, op.now);
  return {
    studentId: student.id,
    institutionStudentId: student.institutionStudentId,
    perFormat,
    assessment: assessment ? (result ?? { kind: 'to-do' as const }) : { kind: 'none-set' as const },
    resultReleased: result?.kind === 'released',
    lastActivityAt: last,
    inactiveDays: days === null ? null : Math.max(0, days),
  };
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
    exportStudentsCsv: deferred('TeachingService.exportStudentsCsv'),

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

    listStudents: (input) =>
      read(call, 'TeachingService.listStudents', (op) => {
        const person = op.person();
        const institutionId = institutionIdOf(person);
        teachingScope(person, field(input, 'experimentId'));
        const accepted = op.parse(listTeachingStudentsInput, input);
        teachingScope(person, accepted.experimentId);
        const experiment = op.found(op.records.experiments[accepted.experimentId]);
        const formats = planFormatsOf(op, institutionId, experiment.id);
        return reachedStudents(op, institutionId, experiment.id)
          .map((student) => facultyRow(op, student, experiment, formats))
          .filter(
            (row) =>
              accepted.inactiveForDays === undefined ||
              row.inactiveDays === null ||
              row.inactiveDays >= accepted.inactiveForDays,
          );
      }),

    getStudentDetail: (input) =>
      read(call, 'TeachingService.getStudentDetail', (op) => {
        const person = op.person();
        const institutionId = institutionIdOf(person);
        const student = op.found(op.records.people[op.idText(field(input, 'studentId'))]);
        if (student.kind !== 'student') refuse({ kind: 'not-found' });
        const experiment = op.found(
          op.records.experiments[op.idText(field(input, 'experimentId'))],
        );
        const facts = accessFacts(op.records, op.seeded, student, op.core.overlap, experiment.id);
        if (!facts) refuse({ kind: 'not-found' });
        op.see(person, { kind: 'student-learning', experiment, access: facts });
        op.parse(studentDetailInput, input);
        const assessment = values(op.records.assessments).find(
          (candidate) =>
            candidate.institutionId === institutionId && candidate.experimentId === experiment.id,
        );
        return {
          row: facultyRow(op, student, experiment, planFormatsOf(op, institutionId, experiment.id)),
          resources: experiment.resources.map((resource) => ({
            title: resource.title,
            openedAt:
              op.records.resourcesOpened[resourceKey(student.id, resource.id)]?.firstOpenedAt ??
              null,
          })),
          attempts: assessment ? attemptsOf(op, assessment.id, student.id) : [],
        };
      }),
  };
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
