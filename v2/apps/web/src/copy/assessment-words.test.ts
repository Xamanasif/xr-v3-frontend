/**
 * The shared Faculty assessment words (Phase 4A): the drawn words of B4-04 … B4-07, the undrawn
 * variants from the state-copy register, and the rules form's typed date and time read in Indian
 * time — blank stays blank (BC6) and anything unreadable is passed on as typed.
 */
import type { AssessmentRules } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import {
  instantToTyped,
  marksWords,
  QUESTION_TYPE_WORDS,
  questionsAndMarks,
  READINESS_WORDS,
  releaseValueWords,
  rulesChecklistLine,
  rulesSummaryLine,
  typedDateTimeToInstant,
} from './assessment-words';

const SET: AssessmentRules = {
  passMarkPercent: 50,
  attemptsAllowed: 2,
  deadline: '2026-11-14T18:29:00.000Z' as AssessmentRules['deadline'],
  release: { option: 'after-deadline', releaseDate: null },
};

const NONE: AssessmentRules = {
  passMarkPercent: null,
  attemptsAllowed: null,
  deadline: null,
  release: null,
};

describe('the shared assessment words', () => {
  it('names the three question types and the two readiness states as the boards draw them', () => {
    expect(Object.values(QUESTION_TYPE_WORDS)).toEqual([
      'Multiple choice',
      'True or false',
      'Written answer',
    ]);
    expect(READINESS_WORDS.ready).toEqual({ label: 'Ready', tone: 'ok' });
    expect(READINESS_WORDS['draft-not-ready']).toEqual({
      label: 'Draft — not ready',
      tone: 'wait',
    });
  });

  it('counts marks and questions with the drawn plurals and the provisional singulars', () => {
    expect(marksWords(2)).toBe('2 marks');
    expect(marksWords(1)).toBe('1 mark');
    expect(questionsAndMarks(4, 16)).toBe('4 questions · 16 marks');
    expect(questionsAndMarks(0, 0)).toBe('0 questions · 0 marks');
    expect(questionsAndMarks(1, 2)).toBe('1 question · 2 marks');
  });

  it('summarises the rules as B4-04 f4 and B4-05 f0 draw them', () => {
    expect(rulesSummaryLine(SET)).toBe(
      'Pass mark 50% · 2 attempts · due 14 Nov 2026, 23:59 · results: after the deadline',
    );
    expect(rulesChecklistLine(SET)).toBe(
      'Rules: pass mark 50%, 2 attempts, due 14 Nov 2026, 23:59, results after the deadline',
    );
    expect(releaseValueWords(SET.release)).toBe('After the deadline');
  });

  it('leaves out the rules that are not set and invents none (BC6)', () => {
    expect(rulesSummaryLine(NONE)).toBeNull();
    expect(rulesChecklistLine(NONE)).toBeNull();
    expect(releaseValueWords(null)).toBeNull();
    expect(rulesSummaryLine({ ...NONE, passMarkPercent: 40 })).toBe('Pass mark 40%');
    expect(rulesChecklistLine({ ...SET, deadline: null })).toBeNull();
  });

  it('reads a typed date and time in Indian time and shows it again the same way', () => {
    expect(typedDateTimeToInstant('14 Nov 2026, 23:59')).toBe('2026-11-14T23:59:00+05:30');
    expect(typedDateTimeToInstant(' 9 November 2026 9:05 ')).toBe('2026-11-09T09:05:00+05:30');
    expect(instantToTyped('2026-11-14T18:29:00.000Z')).toBe('14 Nov 2026, 23:59');
    expect(instantToTyped(null)).toBe('');
  });

  it('keeps blank blank and passes an unreadable value on as typed for the service to answer', () => {
    expect(typedDateTimeToInstant('   ')).toBe('');
    expect(typedDateTimeToInstant('next Friday')).toBe('next Friday');
    expect(typedDateTimeToInstant('31 Feb 2026, 10:00')).toBe('31 Feb 2026, 10:00');
    expect(typedDateTimeToInstant('14 Nov 2026, 24:00')).toBe('14 Nov 2026, 24:00');
  });
});
