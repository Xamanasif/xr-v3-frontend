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
  confirmMarksInput,
  createAssessmentInput,
  deleteQuestionInput,
  editQuestionInput,
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
  changeAssessment,
  confirmMarks,
  createAssessment,
  currentMembers,
  deleteQuestion,
  editQuestion,
  type Experiment,
  type ExperimentId,
  experimentGate,
  formatProgressView,
  inactiveDays,
  type IsoInstant,
  laterOf,
  pinnedQuestions,
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
import { accessFacts, grantsOf, plansOf } from '../world/queries.js';
import { formatKey, resourceKey, values } from '../world/records.js';
import { deferred } from './deferred.js';
import { factsFor, studentAssessmentView, studentOf } from './learner.js';

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
    listAssessments: deferred('AssessmentService.listAssessments'),
    getCreateOptions: deferred('AssessmentService.getCreateOptions'),
    previewAsStudent: deferred('AssessmentService.previewAsStudent'),
    exportSubmissionsCsv: deferred('AssessmentService.exportSubmissionsCsv'),

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
    getFacultyOverview: deferred('TeachingService.getFacultyOverview'),
    listMyCourses: deferred('TeachingService.listMyCourses'),
    getTeachingExperiment: deferred('TeachingService.getTeachingExperiment'),
    exportStudentsCsv: deferred('TeachingService.exportStudentsCsv'),

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
