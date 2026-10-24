/**
 * The words of ST-12 Before you start (B4-11 f11 … f16) and ST-13 the attempt (B4-12 f0 … f6) are
 * the frozen boards': each drawn phrase is found verbatim in its board's markup or script, the
 * composed ones with the boards' own sample values; the words no board draws for these screens
 * are provisional entries of the state-copy register, each waiting on a decision.
 */
import type { PinnedRelease } from '@xr/contracts/draft';
import type { IsoInstant } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { board, stExport } from '@/test-support/boards';

import {
  allAnsweredWords,
  ATTEMPT_V3,
  attemptOfWords,
  INTRO_EYEBROW_AFTER,
  INTRO_V3,
  inProgressSavedLine,
  notReleasedYetLine,
  pendingWords,
  submittedWaitingLine,
  answeredCountWords,
  ATTEMPT_PAGE,
  attemptDocumentTitle,
  attemptMetaLine,
  attemptOverline,
  attemptsUsedWords,
  inProgressTitle,
  INTRO_PAGE,
  introOverline,
  markedNotReleasedLine,
  notPassedLine,
  notPassedTitle,
  passMarkMarksWords,
  passPercentWords,
  questionLabel,
  questionMarks,
  questionMixWords,
  resultAppearsWords,
  stripLinkLabel,
  submittedLine,
  submittedOnLine,
  unansweredWords,
} from './attempt';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_ATTEMPT } from './state-copy-attempt';

/** Text as it reads: the export's no-break spaces that keep a date on one line (`nbd`) read as
 * spaces. */
const plain = <T extends string | null | undefined>(text: T): T =>
  (text == null ? text : text.replace(/\u00a0/g, ' ')) as T;

/** A board's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B4_11 = words('B4-11-Student-Assessments.dc.html');
const B4_12 = words('B4-12-Assessment-Attempt.dc.html');
const B4_13 = words('B4-13-Assessment-Result.dc.html');

// The walk's instants (IST): ATT-0450 submitted 5 Nov 2026, 18:52; the deadline 14 Nov, 23:59.
const SUBMITTED = '2026-11-05T13:22:00.000Z';
const DEADLINE = '2026-11-14T18:29:00.000Z' as IsoInstant;
const AFTER_DEADLINE: PinnedRelease = { option: 'after-deadline', on: DEADLINE };

describe('ST-12 Before you start (B4-11 f11 … f16)', () => {
  it('draws every fixed phrase', () => {
    for (const [key, phrase] of Object.entries(INTRO_PAGE)) {
      if (key === 'overline' || key === 'notSet' || key === 'notReleasedTitle') continue;
      expect(B4_11, key).toContain(phrase);
    }
    expect(B4_11).toContain(INTRO_PAGE.notReleasedTitle);
    expect(B4_13).toContain(INTRO_PAGE.notReleasedTitle);
  });

  it('composes the board’s sample', () => {
    expect(introOverline('Shell-and-Tube Heat Exchanger')).toBe(
      'Shell-and-Tube Heat Exchanger · assessment',
    );
    expect(B4_11).toContain('Shell-and-Tube Heat Exchanger · assessment');
    const mix = questionMixWords({ multipleChoice: 2, trueFalse: 1, written: 1 });
    expect(mix).toBe('2 multiple choice · 1 true or false · 1 written answer');
    expect(B4_11).toContain(mix);
    expect(B4_11).toContain(`<dd>50%<span>${passMarkMarksWords(8, 16)}</span>`);
    expect(passPercentWords(50)).toBe('50%');
    expect(B4_11).toContain(`<span>${attemptsUsedWords(0)}</span>`);
    expect(B4_11).toContain(`<span>${attemptsUsedWords(1)}</span>`);
    expect(B4_11).toContain(inProgressTitle(1));
    expect(B4_11).toContain(plain(submittedOnLine(SUBMITTED, AFTER_DEADLINE)));
    expect(B4_11).toContain(notPassedTitle(1, 1));
    expect(B4_11).toContain(notPassedLine(1, 1));
    expect(B4_13).toContain(plain(markedNotReleasedLine(AFTER_DEADLINE)));
  });

  it('words the undrawn variants from the register', () => {
    expect(questionMixWords({ multipleChoice: 0, trueFalse: 3, written: 2 })).toBe(
      '3 true or false · 2 written answers',
    );
    expect(passMarkMarksWords(7.5, 15)).toBe('7.5 of 15 marks');
    expect(notPassedTitle(2, 0)).toBe('Not passed on attempt 2 · no attempts left');
    expect(notPassedTitle(1, 2)).toBe('Not passed on attempt 1 · 2 attempts left');
    expect(notPassedLine(2, 0)).toBe('Your result stays on your result page.');
    expect(notPassedLine(1, 2)).toBe(
      'You can try two more times. Your first result stays on your result page.',
    );
    expect(notPassedLine(2, 1)).toBe(
      'You can try once more. Your earlier results stay on your result page.',
    );
    expect(resultAppearsWords({ option: 'immediately-after-marking', on: null }, true)).toBe(
      'Your result appears once your answers are marked.',
    );
    expect(plain(resultAppearsWords({ option: 'on-date', on: DEADLINE }, false))).toBe(
      'Your result appears on 14 Nov 2026, 23:59.',
    );
    expect(resultAppearsWords({ option: null, on: null }, true)).toBeNull();
    expect(plain(markedNotReleasedLine({ option: 'on-date', on: DEADLINE }))).toBe(
      'Your answers have been marked. Results for this assessment are released on 14 Nov 2026, 23:59.',
    );
    expect(markedNotReleasedLine({ option: 'immediately-after-marking', on: null })).toBe(
      'Your answers have been marked.',
    );
  });
});

describe('ST-13 the attempt (B4-12 f0 … f6)', () => {
  it('draws every fixed phrase', () => {
    for (const [key, phrase] of Object.entries(ATTEMPT_PAGE)) expect(B4_12, key).toContain(phrase);
  });

  it('composes the board’s sample', () => {
    expect(attemptOverline('Shell-and-Tube Heat Exchanger', 1, 2)).toBe(
      'Shell-and-Tube Heat Exchanger · Attempt 1 of 2',
    );
    expect(B4_12).toContain("attemptText: 'Attempt ' + s.attemptNo + ' of 2'");
    expect(B4_12).toContain(plain(attemptMetaLine(4, 16, DEADLINE)));
    expect(B4_12).toContain("countText: nAns + ' of ' + D.qs.length + ' answered'");
    expect(answeredCountWords(0, 4)).toBe('0 of 4 answered');
    expect(B4_12).toContain(
      "aria: 'Question ' + q.n + (answered(q.n) ? ', answered' : ', not answered')",
    );
    expect(stripLinkLabel(3, false)).toBe('Question 3, not answered');
    expect(stripLinkLabel(1, true)).toBe('Question 1, answered');
    expect(B4_12).toContain("label: 'Question ' + q.n + ' of ' + D.qs.length + ' · ' + q.tname");
    expect(questionLabel(4, 4, 'written')).toBe('Question 4 of 4 · Written answer');
    expect(B4_12).toContain('"tname": "Written answer"');
    expect(B4_12).toContain('"tname": "True or false"');
    expect(B4_12).toContain('"tname": "Multiple choice"');
    expect(questionMarks(10)).toBe('10 marks');
    expect(B4_12).toContain(
      "missText: missing.length === 1 ? '1 question isn’t answered (question ' + missing[0] + ').' : missing.length + ' questions aren’t answered (' + missing.join(', ') + ').'",
    );
    expect(unansweredWords([3, 4])).toBe('2 questions aren’t answered (3, 4).');
    expect(unansweredWords([2])).toBe('1 question isn’t answered (question 2).');
    expect(B4_12).toContain(plain(submittedLine(SUBMITTED, true, AFTER_DEADLINE)));
  });

  it('words the undrawn variants from the register', () => {
    expect(attemptOverline('Shell-and-Tube Heat Exchanger', 1, null)).toBe(
      'Shell-and-Tube Heat Exchanger · Attempt 1',
    );
    expect(attemptMetaLine(1, 2, null)).toBe('1 question · 2 marks · no time limit');
    // No written question: the Faculty member confirms the automatic marks (24 Oct 2026).
    expect(plain(submittedLine(SUBMITTED, false, null))).toBe(
      'Submitted 5 Nov 2026, 18:52. Your faculty confirms the automatic marks.',
    );
    expect(plain(submittedLine(SUBMITTED, false, null))).not.toContain('written answers');
    expect(attemptDocumentTitle('Heat Exchanger — post-lab', false)).toBe(
      'Heat Exchanger — post-lab',
    );
    expect(attemptDocumentTitle('Heat Exchanger — post-lab', true)).toBe(
      'Answers submitted · Heat Exchanger — post-lab',
    );
  });
});

describe('the register entries of ST-12 and ST-13', () => {
  const entries = Object.entries(STATE_COPY_ATTEMPT);

  it('are part of the one register, provisional, each waiting on a decision', () => {
    for (const [id, entry] of entries) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY], id).toBe(entry);
      expect(['ST-12', 'ST-13'], id).toContain(entry.screen);
      expect(entry.status, id).toBe('provisional');
      expect(entry.decisions?.length, id).toBeGreaterThan(0);
    }
  });

  it('never show a decision id in their words', () => {
    for (const [id, entry] of entries) {
      expect(entry.words ?? '', id).not.toMatch(/\b(?:VD|OD|PC|T|M|BC|P\d)-?[A-Z0-9-]*\d\b/);
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

describe('V3: ST-12 Before you start and ST-13 the attempt (ST-v1 `introVM`, `attVM`)', () => {
  const deadline = '2026-11-14T18:29:00.000Z' as IsoInstant; // 14 Nov 2026, 23:59
  const submittedAt = '2026-11-05T13:22:00.000Z' as IsoInstant; // 5 Nov 2026, 18:52

  it('the fixed words are the export’s', () => {
    for (const words of Object.values(INTRO_V3)) expectStDrawn(words);
    for (const words of Object.values(ATTEMPT_V3)) expectStDrawn(words);
    expectStDrawn(`</a>${INTRO_EYEBROW_AFTER}</p>`);
  });

  it('composes the state lines as the export’s script does', () => {
    expect(inProgressSavedLine(2, 4)).toBe('Your answers are saved. 2 questions of 4 answered.');
    expect(inProgressSavedLine(1, 4)).toBe('Your answers are saved. One question of 4 answered.');
    expectStDrawn(
      `'Your answers are saved. ' + this.plural(answeredN, 'question').replace(/^1 question$/, 'One question') + ' of 4 answered.'`,
    );
    expect(
      plain(submittedWaitingLine(submittedAt, { option: 'after-deadline', on: deadline })),
    ).toBe(
      'You submitted on 5 Nov 2026, 18:52. Your result appears after the deadline: 14 Nov 2026, 23:59.',
    );
    expectStDrawn(
      `'You submitted on ' + this.nbd(a.submitted) + '. Your result appears after the deadline: ' + this.nbd(A.deadline) + '.'`,
    );
    expect(plain(notReleasedYetLine({ option: 'after-deadline', on: deadline }))).toBe(
      'Results for this assessment are released after the deadline: 14 Nov 2026, 23:59.',
    );
    expectStDrawn(
      `'Results for this assessment are released after the deadline: ' + this.nbd(A.deadline) + '.'`,
    );
    expect(plain(notReleasedYetLine({ option: 'on-date', on: deadline }))).toBe(
      'Results for this assessment are released on 14 Nov 2026, 23:59.',
    );
    expect(notReleasedYetLine({ option: 'immediately-after-marking', on: null })).toBeNull();
  });

  it('the attempt’s words and the submit dialog’s lines', () => {
    expect(attemptOfWords(1, 2)).toBe('Attempt 1 of 2');
    expectStDrawn(`'Attempt ' + (a.attempt || 1) + ' of ' + A.attempts`);
    expect(attemptOfWords(3, null)).toBe('Attempt 3');
    expect(allAnsweredWords(4)).toBe('All 4 questions are answered.');
    expectStDrawn('<p class="rk-next">All {{ AT.nq }} questions are answered.</p>');
    expect(pendingWords([3, 4])).toBe('2 questions aren’t answered (3, 4). You can still submit.');
    expectStDrawn('<span>{{ AT.missText }} You can still submit.</span>');
  });
});
