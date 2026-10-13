/**
 * Assessments, the question bank, attempts, marking and results (Appendix C M20–M22; matrix
 * ASMT-*, Q-*, ATT-*). Every rule is the assessment's own — nothing comes pre-filled (BC6);
 * objective marks come only from explicitly supplied values (DV-2); results release by the
 * assessment's own setting, derived from the clock.
 */
import { describe, expect, it } from 'vitest';

import {
  assessment,
  attempt,
  counterIds,
  expectOk,
  ids,
  QUESTIONS,
  question,
  refusalOf,
  RULES_READY,
  system,
  T,
  who,
} from '../testing/fixtures.js';
import type { OpenGate } from '../access/model.js';
import { assessmentReadiness, changeAssessment, createAssessment } from './assessment.js';
import {
  applyObjectiveMarks,
  assessmentForStudent,
  confirmMarks,
  pinnedQuestions,
  resultReleaseAt,
  resultView,
  saveAnswer,
  saveMark,
  startAttempt,
  submitAttempt,
} from './attempt.js';
import {
  ASSESSMENT_READINESS,
  ATTEMPT_STATES,
  ATTEMPT_TRANSITIONS,
  type Attempt,
  type AttemptCommand,
  type AttemptState,
  NO_RULES,
} from './model.js';
import {
  addDraftToBank,
  addQuestion,
  commitQuestionImport,
  deleteQuestion,
  draftRequestIssues,
  editQuestion,
  parseImportRow,
  type QuestionImportRow,
} from './question-bank.js';

const openGate: OpenGate = { canOpen: true, viaGrantIds: [ids.sacc310] };
const refs = QUESTIONS.map((entry) => ({ questionId: entry.id, questionVersion: 1 }));
const submitted = (overrides: Partial<Attempt> = {}) =>
  attempt({ state: 'submitted', submittedAt: T.nov5, ...overrides });
const marked = (written = 7, at = T.nov7): Attempt =>
  submitted({
    marking: {
      automatic: [{ questionId: ids.q101, awarded: 6, outOf: 6 }],
      written: [
        { questionId: ids.q102, mark: written, feedback: null, savedAt: at, savedBy: who.faculty },
      ],
      confirmed: { at, by: who.faculty },
    },
  });

describe('assessments (ASMT-01 … ASMT-06): nothing pre-filled; readiness derived', () => {
  const create = (overrides: Partial<Parameters<typeof createAssessment>[0]> = {}) =>
    createAssessment({
      existing: null,
      institutionId: ids.godavari,
      experimentId: ids.shell,
      taughtExperiments: [ids.shell],
      mode: 'create',
      name: 'Heat Exchanger — post-lab',
      introduction: null,
      rules: RULES_READY,
      questions: refs,
      actor: who.faculty,
      now: T.oct20,
      ids: counterIds(),
      ...overrides,
    });

  it('no defaults: every rule is null until the Faculty member sets it (BC6)', () => {
    expect(NO_RULES).toEqual({
      passMarkPercent: null,
      attemptsAllowed: null,
      deadline: null,
      release: null,
    });
    expect(refusalOf(create({ rules: NO_RULES, questions: [] }))).toEqual({
      kind: 'validation-failed',
      issues: [
        { field: 'passMarkPercent', rule: 'required' },
        { field: 'attemptsAllowed', rule: 'required' },
        { field: 'deadline', rule: 'required' },
        { field: 'release', rule: 'required' },
        { field: 'questions', rule: 'at-least-one-or-draft' },
      ],
    });
    const draft = expectOk(create({ mode: 'draft', rules: NO_RULES, questions: [] }));
    expect(ASSESSMENT_READINESS).toEqual(['draft-not-ready', 'ready']);
    expect(assessmentReadiness(draft)).toBe('draft-not-ready');
    expect(draft.readySince).toBeNull();
  });

  it('the field rules: 0–100, ≥ 1 attempt, a date for "On a date"', () => {
    expect(
      refusalOf(
        create({
          rules: {
            ...RULES_READY,
            passMarkPercent: 50.5,
            attemptsAllowed: 0,
            release: { option: 'on-date', releaseDate: null },
          },
        }),
      ),
    ).toEqual({
      kind: 'validation-failed',
      issues: [
        { field: 'passMarkPercent', rule: 'whole-number-0-100' },
        { field: 'attemptsAllowed', rule: 'whole-number-1-or-more' },
        { field: 'releaseDate', rule: 'required' },
      ],
    });
  });

  it('one per experiment per institution; only for an experiment the Faculty member teaches', () => {
    const made = expectOk(create());
    expect(made).toMatchObject({ id: 'ASMT-1001', version: 1, readySince: T.oct20 });
    expect(refusalOf(create({ existing: made }))).toEqual({
      kind: 'refused',
      code: 'assessment-exists',
    });
    expect(refusalOf(create({ taughtExperiments: [] }))).toEqual({
      kind: 'not-permitted',
      why: 'out-of-scope',
    });
  });

  it('a change after submissions makes a new version; earlier submissions keep theirs', () => {
    const current = assessment();
    const change = {
      assessment: current,
      name: current.name,
      introduction: null,
      rules: { ...RULES_READY, attemptsAllowed: 3 },
      questions: refs,
      actor: who.faculty,
      now: T.nov7,
      ids: counterIds(),
    };
    const versioned = expectOk(changeAssessment({ ...change, hasSubmissions: true }));
    expect(versioned).toMatchObject({ version: 2, versionSince: T.nov7 });
    expect(versioned.versions.map((entry) => [entry.version, entry.rules.attemptsAllowed])).toEqual(
      [
        [1, 2],
        [2, 3],
      ],
    );
    const edited = expectOk(changeAssessment({ ...change, hasSubmissions: false }));
    expect(edited.version).toBe(1);
    expect(
      refusalOf(changeAssessment({ ...change, rules: RULES_READY, hasSubmissions: false })),
    ).toEqual({ kind: 'invalid-state', current: 'unchanged' });
    expect(
      refusalOf(changeAssessment({ ...change, questions: [], hasSubmissions: false })),
    ).toEqual({
      kind: 'validation-failed',
      issues: [{ field: 'questions', rule: 'at-least-one' }],
    });
  });
});

describe('the question bank (Q-01 … Q-07)', () => {
  const add = {
    institutionId: ids.godavari,
    experimentId: ids.shell,
    taughtExperiments: [ids.shell],
    actor: who.faculty,
    now: T.oct20,
    ids: counterIds(),
  };
  it('three types; the drawn rules', () => {
    expect(
      refusalOf(
        addQuestion({
          ...add,
          text: ' ',
          body: { type: 'multiple-choice', options: { A: 'Only one' }, correct: 'B' },
          marks: 0,
          explanation: null,
        }),
      ),
    ).toEqual({
      kind: 'validation-failed',
      issues: [
        { field: 'text', rule: 'required' },
        { field: 'options', rule: 'at-least-two' },
        { field: 'correct', rule: 'choose-correct' },
        { field: 'marks', rule: 'whole-number-1-or-more' },
      ],
    });
    expect(
      expectOk(
        addQuestion({
          ...add,
          text: 'Fouling raises U.',
          body: { type: 'true-false', correct: false },
          marks: 2,
          explanation: null,
        }),
      ).origin,
    ).toBe('written');
  });

  it('editing saves a new version; an assessment keeps its pinned version', () => {
    const q101 = QUESTIONS[0]!;
    const edited = expectOk(
      editQuestion({
        question: q101,
        content: { text: 'Reworded', body: q101.body, marks: 8, explanation: null },
        actor: who.faculty,
        now: T.nov5,
        ids: counterIds(),
      }),
    );
    expect(edited.versions.map((entry) => [entry.version, entry.marks])).toEqual([
      [1, 6],
      [2, 8],
    ]);
    const pinned = pinnedQuestions(assessment().versions[0]!, [edited, QUESTIONS[1]!]);
    expect(
      pinned.map((entry) => [entry.questionId, entry.version.version, entry.version.marks]),
    ).toEqual([
      [ids.q101, 1, 6],
      [ids.q102, 1, 10],
    ]);
    const deleted = expectOk(
      deleteQuestion({ question: edited, actor: who.faculty, now: T.nov7, ids: counterIds() }),
    );
    expect(deleted.deleted).toEqual({ at: T.nov7, by: who.faculty });
    expect(
      refusalOf(
        editQuestion({
          question: deleted,
          content: { text: 'x', body: q101.body, marks: 1, explanation: null },
          actor: who.faculty,
          now: T.nov7,
          ids: counterIds(),
        }),
      ),
    ).toEqual({ kind: 'invalid-state', current: 'deleted' });
  });

  it('a draft never enters the bank on its own and carries no suggested marks', () => {
    expect(
      draftRequestIssues({ source: 'pasted-text', pastedText: '', types: [], howMany: 3 }),
    ).toEqual([
      { field: 'pastedText', rule: 'required' },
      { field: 'types', rule: 'at-least-one' },
    ]);
    const draft = {
      id: 'draft-1' as never,
      institutionId: ids.godavari,
      requestedBy: ids.ranganathan,
      experimentId: ids.shell,
      text: 'Why counter-flow?',
      body: { type: 'written' as const, markingGuidance: null },
      marks: null,
      explanation: null,
      requestedAt: T.oct20,
    };
    expect(
      refusalOf(
        addDraftToBank({
          ...add,
          draft,
          content: { text: draft.text, body: draft.body, marks: draft.marks, explanation: null },
        }),
      ),
    ).toEqual({
      kind: 'validation-failed',
      issues: [{ field: 'marks', rule: 'whole-number-1-or-more' }],
    });
    expect(
      expectOk(
        addDraftToBank({
          ...add,
          draft,
          content: { text: draft.text, body: draft.body, marks: 4, explanation: null },
        }),
      ).origin,
    ).toBe('reviewed-draft');
    // Q-05 "own drafts": another Faculty member's draft is not theirs to add.
    expect(
      refusalOf(
        addDraftToBank({
          ...add,
          draft: { ...draft, requestedBy: ids.kumar },
          content: { text: draft.text, body: draft.body, marks: 4, explanation: null },
        }),
      ),
    ).toEqual({ kind: 'not-permitted', why: 'not-own-record' });
  });

  it('import: the ten-column template, all or nothing, into the bank only', () => {
    const row = (n: number, overrides: Partial<QuestionImportRow> = {}): QuestionImportRow => ({
      row: n,
      type: 'Multiple choice',
      question: `Q${n}`,
      option_a: 'Parallel',
      option_b: 'Counter',
      option_c: '',
      option_d: '',
      correct: 'b',
      marks: '2',
      explanation: 'Counter-flow keeps ΔT high.',
      marking_guidance: '',
      ...overrides,
    });
    expect(parseImportRow(row(1, { explanation: '' })).problems).toEqual([
      { row: 1, question: 'Q1', problem: 'explanation-empty', severity: 'warning' },
    ]);
    expect(
      parseImportRow(row(2, { type: 'Essay', marks: '1.5' })).problems.map(
        (problem) => problem.problem,
      ),
    ).toEqual(['type', 'marks']);
    expect(commitQuestionImport({ ...add, rows: [row(1), row(2, { correct: 'D' })] }).ok).toBe(
      false,
    );
    const imported = expectOk(
      commitQuestionImport({
        ...add,
        rows: [row(1), row(2, { type: 'True or false', correct: 'TRUE' })],
      }),
    );
    expect(imported.map((entry) => [entry.origin, entry.body.type])).toEqual([
      ['import', 'multiple-choice'],
      ['import', 'true-false'],
    ]);
  });
});

function runAttempt(
  from: AttemptState,
  command: Exclude<AttemptCommand, 'startAttempt'>,
): AttemptState | null {
  const current = from === 'in-progress' ? attempt() : submitted();
  const base = { assessment: assessment(), questions: QUESTIONS, now: T.nov7 };
  const decision = (() => {
    switch (command) {
      case 'saveAnswer':
        return saveAnswer({
          ...base,
          attempt: current,
          questionId: ids.q101,
          value: { type: 'multiple-choice', choice: 'B' },
          actor: who.student,
        });
      case 'submitAttempt':
        return submitAttempt({ attempt: current, actor: who.student, now: T.nov7 });
      case 'applyObjectiveMarks':
        return applyObjectiveMarks({
          ...base,
          attempt: current,
          supplied: [{ questionId: ids.q101, awarded: 6 }],
          actor: system('system:objective-marks'),
        });
      case 'saveMark':
        return saveMark({
          ...base,
          attempt: current,
          questionId: ids.q102,
          mark: 7,
          feedback: null,
          actor: who.faculty,
        });
      case 'confirmMarks': {
        const withMark = {
          ...current,
          marking: {
            ...current.marking,
            automatic: [{ questionId: ids.q101, awarded: 6, outOf: 6 }],
            written: [
              {
                questionId: ids.q102,
                mark: 7,
                feedback: null,
                savedAt: T.nov7,
                savedBy: who.faculty,
              },
            ],
          },
        };
        return confirmMarks({ ...base, attempt: withMark, actor: who.faculty });
      }
    }
  })();
  return decision.ok ? decision.value.state : null;
}

describe('the attempt machine (acceptance 2): every drawn transition allowed, every other refused', () => {
  const commands = [...new Set(ATTEMPT_TRANSITIONS.map((row) => row.command))].filter(
    (command): command is Exclude<AttemptCommand, 'startAttempt'> => command !== 'startAttempt',
  );
  for (const from of ATTEMPT_STATES) {
    for (const command of commands) {
      const drawn = ATTEMPT_TRANSITIONS.filter(
        (row) => row.from === from && row.command === command,
      );
      it(`${from} · ${command}: ${drawn.length ? `→ ${drawn.map((row) => row.to).join(' | ')}` : 'refused'}`, () => {
        const to = runAttempt(from, command);
        if (drawn.length === 0) expect(to).toBeNull();
        else expect(drawn.map((row) => row.to)).toContain(to);
      });
    }
  }

  it('no timer, no release command, no re-marking (T-20, T-22; ATT-14)', () => {
    expect(ATTEMPT_TRANSITIONS.map((row) => row.command).join(' ')).not.toMatch(
      /release|timer|remark|autoSubmit/i,
    );
  });
});

describe('attempts (ATT-01 … ATT-06)', () => {
  const start = (overrides: Partial<Parameters<typeof startAttempt>[0]> = {}) =>
    startAttempt({
      assessment: assessment(),
      gate: openGate,
      attempts: [],
      questions: QUESTIONS,
      actor: who.student,
      now: T.nov20,
      ids: counterIds(),
      ...overrides,
    });

  it('"Attempt 1 of 2" on the current version', () => {
    expect(expectOk(start())).toMatchObject({
      attemptNumber: 1,
      assessmentVersion: 1,
      state: 'in-progress',
      answers: {},
    });
  });

  it('Try again only after a released result that did not pass, with an attempt left', () => {
    expect(refusalOf(start({ attempts: [attempt()] }))).toEqual({
      kind: 'invalid-state',
      current: 'attempt-in-progress',
    });
    expect(refusalOf(start({ attempts: [submitted()] }))).toEqual({
      kind: 'refused',
      code: 'previous-not-released',
    });
    expect(refusalOf(start({ attempts: [marked(7)] }))).toEqual({
      kind: 'refused',
      code: 'already-passed',
    });
    expect(expectOk(start({ attempts: [marked(0)] })).attemptNumber).toBe(2);
    expect(
      refusalOf(
        start({
          attempts: [marked(0), { ...marked(0), id: 'ATT-0451' as never, attemptNumber: 2 }],
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'no-attempts-left' });
  });

  it('not on a draft, through a closed gate, or for someone else’s attempts', () => {
    expect(refusalOf(start({ assessment: assessment({ rules: NO_RULES }) }))).toEqual({
      kind: 'invalid-state',
      current: 'draft-not-ready',
    });
    expect(refusalOf(start({ gate: { canOpen: false, reason: 'access-ended' } }))).toEqual({
      kind: 'refused',
      code: 'access-ended',
    });
    expect(
      refusalOf(start({ gate: { canOpen: false, reason: 'policy-open', decision: 'OD-B2-02' } })),
    ).toEqual({ kind: 'policy-open', decision: 'OD-B2-02' });
    expect(
      refusalOf(
        start({
          attempts: [marked(0, T.nov7)].map((entry) => ({ ...entry, studentId: ids.arun })),
        }),
      ),
    ).toEqual({ kind: 'not-permitted', why: 'not-own-record' });
  });

  it('answers of the question’s type; a wrong choice is stored as given', () => {
    const answered = expectOk(
      saveAnswer({
        attempt: attempt(),
        assessment: assessment(),
        questions: QUESTIONS,
        questionId: ids.q101,
        value: { type: 'multiple-choice', choice: 'A' },
        actor: who.student,
        now: T.nov5,
      }),
    );
    expect(answered.answers[ids.q101]).toEqual({ type: 'multiple-choice', choice: 'A' });
    expect(
      refusalOf(
        saveAnswer({
          attempt: attempt(),
          assessment: assessment(),
          questions: QUESTIONS,
          questionId: ids.q101,
          value: { type: 'written', text: 'x' },
          actor: who.student,
          now: T.nov5,
        }),
      ),
    ).toEqual({ kind: 'validation-failed', issues: [{ field: 'value', rule: 'type' }] });
    expect(
      refusalOf(submitAttempt({ attempt: attempt(), actor: who.faculty, now: T.nov5 })),
    ).toEqual({ kind: 'not-permitted', why: 'not-own-record' });
  });
});

describe('marking (ATT-07 … ATT-10, ATT-17, ATT-21): supplied objective marks; whole-number written marks', () => {
  const base = { assessment: assessment(), questions: QUESTIONS, now: T.nov7 };

  it('DV-2 (Phase-0 interim): objective marks are the supplied values — no answer is compared with a key', () => {
    const wrongAnswer = submitted({
      answers: { [ids.q101]: { type: 'multiple-choice', choice: 'A' } },
    });
    const applied = expectOk(
      applyObjectiveMarks({
        ...base,
        attempt: wrongAnswer,
        supplied: [{ questionId: ids.q101, awarded: 6 }],
        actor: system('system:objective-marks'),
      }),
    );
    expect(applied.marking.automatic).toEqual([{ questionId: ids.q101, awarded: 6, outOf: 6 }]);
    expect(
      expectOk(
        applyObjectiveMarks({
          ...base,
          attempt: submitted(),
          supplied: [],
          actor: system('system:objective-marks'),
        }),
      ).marking.automatic,
    ).toEqual([]);
    expect(
      refusalOf(
        applyObjectiveMarks({
          ...base,
          attempt: submitted(),
          supplied: [{ questionId: ids.q102, awarded: 1 }],
          actor: system('system:objective-marks'),
        }),
      ),
    ).toEqual({
      kind: 'validation-failed',
      issues: [{ field: ids.q102, rule: 'not-a-choice-question' }],
    });
    expect(
      refusalOf(
        applyObjectiveMarks({
          ...base,
          attempt: submitted(),
          supplied: [{ questionId: ids.q101, awarded: 7 }],
          actor: system('system:objective-marks'),
        }),
      ),
    ).toEqual({ kind: 'validation-failed', issues: [{ field: ids.q101, rule: 'out-of-range' }] });
    expect(
      refusalOf(
        applyObjectiveMarks({
          ...base,
          attempt: submitted(),
          supplied: [],
          actor: system('system:runtime-report') as never,
        }),
      ),
    ).toEqual({ kind: 'not-permitted', why: 'wrong-workspace' });
  });

  it('a written mark is a whole number 0 … marks; confirmed marks are read-only', () => {
    expect(
      refusalOf(
        saveMark({
          ...base,
          attempt: submitted(),
          questionId: ids.q102,
          mark: 7.5,
          feedback: null,
          actor: who.faculty,
        }),
      ),
    ).toEqual({
      kind: 'validation-failed',
      issues: [{ field: 'mark', rule: 'whole-number-0-to-marks' }],
    });
    expect(
      refusalOf(
        saveMark({
          ...base,
          attempt: submitted(),
          questionId: ids.q102,
          mark: 11,
          feedback: null,
          actor: who.faculty,
        }),
      ),
    ).toMatchObject({ kind: 'validation-failed' });
    expect(refusalOf(confirmMarks({ ...base, attempt: submitted(), actor: who.faculty }))).toEqual({
      kind: 'validation-failed',
      issues: [{ field: 'mark', rule: 'save-first' }],
    });
    expect(
      refusalOf(
        saveMark({
          ...base,
          attempt: marked(),
          questionId: ids.q102,
          mark: 8,
          feedback: null,
          actor: who.faculty,
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'marks-confirmed' });
  });

  it('without the supplied choice marks nothing is confirmed (ATT-07 undecided; DV-2)', () => {
    const writtenOnly = submitted({
      marking: {
        automatic: [],
        written: [
          { questionId: ids.q102, mark: 7, feedback: null, savedAt: T.nov7, savedBy: who.faculty },
        ],
        confirmed: null,
      },
    });
    expect(refusalOf(confirmMarks({ ...base, attempt: writtenOnly, actor: who.faculty }))).toEqual({
      kind: 'policy-open',
      decision: 'ATT-07',
    });
    // A confirmed record missing a choice mark shows no figure — no score is invented from it.
    const incomplete = {
      ...writtenOnly,
      marking: { ...writtenOnly.marking, confirmed: { at: T.nov7, by: who.faculty } },
    };
    expect(resultView({ ...base, attempt: incomplete, now: T.nov20 })).toEqual({
      kind: 'waiting-for-marking',
    });
  });

  it('zero or several written questions are not drawn: policy-open', () => {
    const second = question('Q-0103' as never, { type: 'written', markingGuidance: null }, 5);
    const several = assessment({
      versions: [
        {
          ...assessment().versions[0]!,
          questions: [...refs, { questionId: second.id, questionVersion: 1 }],
        },
      ],
    });
    expect(
      refusalOf(
        confirmMarks({
          ...base,
          assessment: several,
          questions: [...QUESTIONS, second],
          attempt: submitted(),
          actor: who.faculty,
        }),
      ),
    ).toEqual({ kind: 'policy-open', decision: 'ATT-17' });
    const choiceOnly = assessment({
      versions: [{ ...assessment().versions[0]!, questions: [refs[0]!] }],
    });
    expect(
      refusalOf(
        confirmMarks({ ...base, assessment: choiceOnly, attempt: submitted(), actor: who.faculty }),
      ),
    ).toEqual({ kind: 'policy-open', decision: 'M22-no-written-questions' });
  });
});

describe('results (ATT-13 SYSTEM, ATT-15): released by the assessment’s own setting; no figure before', () => {
  it('waiting → not released → released after the deadline', () => {
    expect(
      resultView({
        attempt: attempt(),
        assessment: assessment(),
        questions: QUESTIONS,
        now: T.nov7,
      }),
    ).toEqual({ kind: 'in-progress' });
    expect(
      resultView({
        attempt: submitted(),
        assessment: assessment(),
        questions: QUESTIONS,
        now: T.nov7,
      }),
    ).toEqual({ kind: 'waiting-for-marking' });
    expect(
      resultView({
        attempt: marked(),
        assessment: assessment(),
        questions: QUESTIONS,
        now: T.nov7,
      }),
    ).toEqual({ kind: 'not-released-yet', releaseRule: 'after-deadline' });
    expect(
      resultView({
        attempt: marked(),
        assessment: assessment(),
        questions: QUESTIONS,
        now: T.nov20,
      }),
    ).toEqual({
      kind: 'released',
      releasedAt: T.nov14,
      score: 13,
      outOf: 16,
      passMarkMarks: 8,
      passed: true,
      attemptsLeft: 1,
    });
  });

  it('the release moment per option; the pass mark keeps its exact fraction (rounding is open)', () => {
    expect(
      resultReleaseAt(
        { ...RULES_READY, release: { option: 'immediately-after-marking', releaseDate: null } },
        T.nov7,
      ),
    ).toBe(T.nov7);
    expect(resultReleaseAt(RULES_READY, T.nov20)).toBe(T.nov20);
    expect(
      resultReleaseAt(
        { ...RULES_READY, release: { option: 'on-date', releaseDate: T.nov20 } },
        T.nov7,
      ),
    ).toBe(T.nov20);
    expect(resultReleaseAt(NO_RULES, T.nov7)).toBeNull();
    const strict = assessment({
      rules: { ...RULES_READY, passMarkPercent: 55 },
      versions: [{ ...assessment().versions[0]!, rules: { ...RULES_READY, passMarkPercent: 55 } }],
    });
    const eight = resultView({
      attempt: submitted({
        marking: {
          automatic: [{ questionId: ids.q101, awarded: 2, outOf: 6 }],
          written: [
            {
              questionId: ids.q102,
              mark: 6,
              feedback: null,
              savedAt: T.nov7,
              savedBy: who.faculty,
            },
          ],
          confirmed: { at: T.nov7, by: who.faculty },
        },
      }),
      assessment: strict,
      questions: QUESTIONS,
      now: T.nov20,
    });
    expect(eight).toMatchObject({ kind: 'released', score: 8, passMarkMarks: 8.8, passed: false });
  });

  it('the Student’s list: a draft is never visible; starting follows the gate', () => {
    const view = (overrides: Partial<Parameters<typeof assessmentForStudent>[0]> = {}) =>
      assessmentForStudent({
        assessment: assessment(),
        hasExperiment: true,
        gate: openGate,
        attempts: [],
        questions: QUESTIONS,
        now: T.nov20,
        ...overrides,
      });
    expect(view()).toEqual({ visible: true, status: 'to-do', canStart: true });
    expect(view({ assessment: assessment({ rules: NO_RULES }) })).toEqual({ visible: false });
    expect(view({ hasExperiment: false })).toEqual({ visible: false });
    expect(
      view({ attempts: [marked()], gate: { canOpen: false, reason: 'institution-paused' } }),
    ).toEqual({ visible: true, status: 'released', canStart: false });
  });
});
