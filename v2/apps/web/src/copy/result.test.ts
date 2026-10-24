/**
 * The words of ST-14 Result are the frozen board's (B4-13): each drawn phrase is found verbatim in
 * the board's markup or script, and each composed line takes the board's own form for the board's
 * sample (ATT-0450: submitted 5 Nov 2026, 18:52; released after the deadline, 14 Nov 2026, 23:59).
 * Undrawn words live in the state-copy register (`state-copy-result.ts`), each provisional with
 * its decision.
 */
import type { IsoInstant } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { board, stExport } from '@/test-support/boards';

import {
  byQuestionWords,
  outOfWords,
  passMarkValueWords,
  RESULT_V3,
  retryLine,
  attemptsLeftWords,
  attemptWords,
  correctAnswerWords,
  feedbackFromWords,
  figure,
  notReleasedLine,
  ofMarksWords,
  passMarkWords,
  questionHeadWords,
  releasedWords,
  RESULT_PAGE,
  resultOverline,
  waitingLine,
  yourAnswerWords,
} from './result';
import { STATE_COPY_RESULT } from './state-copy-result';

/** Text as it reads: the export's no-break spaces that keep a date on one line (`nbd`) read as
 * spaces. */
const plain = <T extends string | null | undefined>(text: T): T =>
  (text == null ? text : text.replace(/\u00a0/g, ' ')) as T;

/** The board's text with tags removed, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B4_13 = words('B4-13-Assessment-Result.dc.html');

const SUBMITTED = '2026-11-05T13:22:00.000Z' as IsoInstant; // 5 Nov 2026, 18:52 IST
const DEADLINE = '2026-11-14T18:29:00.000Z' as IsoInstant; // 14 Nov 2026, 23:59 IST
const AFTER_DEADLINE = { option: 'after-deadline', on: DEADLINE } as const;

const OPTIONS = {
  A: 'The actual heat transfer with the largest heat transfer possible',
  B: 'The hot-side flow rate with the cold-side flow rate',
};

describe('ST-14 Result words (B4-13)', () => {
  it('every fixed word is on the board', () => {
    for (const [key, value] of Object.entries(RESULT_PAGE)) {
      expect(B4_13, key).toContain(value);
    }
  });

  it('the released result’s composed lines take the board’s form (f0, f3)', () => {
    expect(resultOverline('Heat Exchanger — post-lab')).toBe('Heat Exchanger — post-lab · result');
    expect(B4_13).toContain(resultOverline('Heat Exchanger — post-lab'));
    expect(ofMarksWords(11, 16)).toBe('11 of 16 marks');
    expect(ofMarksWords(2, 2)).toBe('2 of 2 marks');
    expect(ofMarksWords(7, 10)).toBe('7 of 10 marks');
    expect(passMarkWords(8, 16)).toBe('Pass mark 50% · 8 of 16 marks');
    expect(B4_13).toContain(passMarkWords(8, 16));
    expect(attemptWords(1, 2)).toBe('Attempt 1 of 2');
    expect(B4_13).toContain(attemptWords(1, 2));
    expect(plain(releasedWords(AFTER_DEADLINE, DEADLINE))).toBe(
      'Released 14 Nov 2026, 23:59, after the deadline',
    );
    expect(B4_13).toContain(plain(releasedWords(AFTER_DEADLINE, DEADLINE)));
    expect(attemptsLeftWords(1)).toBe('You have 1 attempt left.');
    expect(B4_13).toContain(attemptsLeftWords(1));
    expect(feedbackFromWords('Dr S. Ranganathan')).toBe('Feedback from Dr S. Ranganathan');
    expect(B4_13).toContain(feedbackFromWords('Dr S. Ranganathan'));
  });

  it('each answer’s head and words take the board’s form (f0)', () => {
    // The board's script composes the head as 'Question ' + n + ' · ' + tname.
    expect(questionHeadWords(1, 'multiple-choice')).toBe('Question 1 · Multiple choice');
    expect(questionHeadWords(3, 'true-false')).toBe('Question 3 · True or false');
    expect(questionHeadWords(4, 'written')).toBe('Question 4 · Written answer');
    for (const type of ['Multiple choice', 'True or false', 'Written answer'])
      expect(B4_13).toContain(`"tname": "${type}"`);
    expect(B4_13).toContain(`head: 'Question ' + q.n + ' · ' + q.tname`);
    expect(
      yourAnswerWords('multiple-choice', { type: 'multiple-choice', choice: 'B' }, OPTIONS),
    ).toBe(OPTIONS.B);
    expect(yourAnswerWords('multiple-choice', null, OPTIONS)).toBe('Not answered');
    expect(yourAnswerWords('true-false', { type: 'true-false', value: false }, null)).toBe('False');
    expect(yourAnswerWords('written', { type: 'written', text: '  ' }, null)).toBe('—');
    expect(yourAnswerWords('written', { type: 'written', text: 'Fouling…' }, null)).toBe(
      'Fouling…',
    );
    expect(correctAnswerWords('multiple-choice', 'A', OPTIONS)).toBe(OPTIONS.A);
    expect(correctAnswerWords('true-false', 'true', null)).toBe('True');
    expect(correctAnswerWords('written', null, null)).toBeNull();
  });

  it('waiting for marking and not released take the board’s lines (f1, f2, f4)', () => {
    const waiting = waitingLine(SUBMITTED, AFTER_DEADLINE);
    expect(plain(waiting)).toBe(
      'You submitted on 5 Nov 2026, 18:52. Your faculty marks written answers. Your result appears after the deadline: 14 Nov 2026, 23:59.',
    );
    expect(B4_13).toContain(plain(waiting));
    const notReleased = notReleasedLine(AFTER_DEADLINE);
    expect(plain(notReleased)).toBe(
      'Your answers have been marked. Results for this assessment are released after the deadline: 14 Nov 2026, 23:59.',
    );
    expect(B4_13).toContain(plain(notReleased));
  });

  it('the undrawn settings and forms are the register’s words', () => {
    const at = '2026-10-27T04:30:00.000Z' as IsoInstant; // 27 Oct 2026, 10:00 IST
    expect(plain(releasedWords({ option: 'immediately-after-marking', on: null }, at))).toBe(
      'Released 27 Oct 2026, 10:00, when marked',
    );
    expect(plain(releasedWords({ option: 'on-date', on: at }, at))).toBe(
      'Released 27 Oct 2026, 10:00, on the date set',
    );
    expect(plain(releasedWords({ option: 'on-date', on: SUBMITTED }, at))).toBe(
      'Released 27 Oct 2026, 10:00, when marked',
    );
    expect(plain(waitingLine(SUBMITTED, { option: 'immediately-after-marking', on: null }))).toBe(
      'You submitted on 5 Nov 2026, 18:52. Your faculty marks written answers. Your result appears when your answers are marked.',
    );
    expect(plain(waitingLine(SUBMITTED, { option: 'on-date', on: DEADLINE }))).toBe(
      'You submitted on 5 Nov 2026, 18:52. Your faculty marks written answers. Your result appears on 14 Nov 2026, 23:59.',
    );
    // No written question: the Faculty member confirms the automatic marks (24 Oct 2026).
    expect(
      plain(waitingLine(SUBMITTED, { option: 'immediately-after-marking', on: null }, false)),
    ).toBe(
      'You submitted on 5 Nov 2026, 18:52. Your faculty confirms the automatic marks. Your result appears when your answers are marked.',
    );
    expect(plain(notReleasedLine({ option: 'on-date', on: DEADLINE }))).toBe(
      'Your answers have been marked. Results for this assessment are released on 14 Nov 2026, 23:59.',
    );
    expect(attemptsLeftWords(2)).toBe('You have 2 attempts left.');
    expect(attemptWords(3, null)).toBe('Attempt 3');
    expect(ofMarksWords(1, 1)).toBe('1 of 1 mark');
    expect(feedbackFromWords(null)).toBe('Feedback from your faculty');
    expect(figure(7.5)).toBe('7.5');
    expect(passMarkWords(7.5, 15)).toBe('Pass mark 50% · 7.5 of 15 marks');
  });

  it('every register entry is provisional with a decision, and no decision id is in its words', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_RESULT)) {
      expect(entry.screen, id).toBe('ST-14');
      expect(entry.status, id).toBe('provisional');
      expect(entry.decisions.length, id).toBeGreaterThan(0);
      if (entry.words !== null) {
        for (const decision of entry.decisions) expect(entry.words, id).not.toContain(decision);
        expect(entry.words, id).not.toMatch(/\b(VD|OD|PC|ATT|T|M|P4)-?\d/);
      }
    }
  });
});

// ---- V3 (the owner-approved Student export ST-v1) -----------------------------------------------

const ST_MAIN = stExport('StudentFinal.dc.html');
const ST_TEMPLATE = ST_MAIN.slice(0, ST_MAIN.indexOf('<script type="text/x-dc"'));
const ST_SCRIPT = ST_MAIN.slice(ST_MAIN.indexOf('<script type="text/x-dc"'));
/** The template's text (`&amp;` decoded) and the script that fills it. */
const ST_DRAWN = `${ST_TEMPLATE.replace(/&amp;/g, '&')}\n${ST_SCRIPT}`;
/** No assessment, attempt or record id in a Student word (decision 3). */
const ST_REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT|Q)-\d+/;

function expectStDrawn(words: string) {
  expect(ST_DRAWN.includes(words), `drawn in the ST-v1 export: ${words}`).toBe(true);
  expect(words).not.toMatch(ST_REFERENCE);
}

describe('V3: ST-14 Result (ST-v1 `resultVM`)', () => {
  it('the fixed words are the export’s', () => {
    for (const words of Object.values(RESULT_V3)) expectStDrawn(words);
  });

  it('composes the score panel as the export’s script does', () => {
    expect(outOfWords(16)).toBe('of 16 marks');
    expectStDrawn(`total: 'of ' + A.total + ' marks'`);
    expect(outOfWords(1)).toBe('of 1 mark');
    expect(passMarkValueWords(8, 16)).toBe('50% · 8 of 16 marks');
    expectStDrawn(`passText: A.passpct + ' · ' + A.passm + ' of ' + A.total + ' marks'`);
    expect(byQuestionWords(4, 7, 10)).toEqual({
      label: 'Q4',
      mark: '7 of 10',
      name: 'Question 4: 7 of 10 marks',
    });
    expectStDrawn(`aria: 'Question ' + x.n + ': ' + x.markText`);
    expectStDrawn(`<span class="sv-byq-n">Q{{ b.n }}</span>`);
    expect(retryLine(1, 1)).toBe('You have 1 attempt left. Your first result stays here.');
    expectStDrawn(`' left. Your first result stays here.'`);
    expect(retryLine(2, 2)).toBe('You have 2 attempts left. Your earlier results stay here.');
  });
});
