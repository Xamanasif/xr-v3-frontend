/**
 * The words of FA-18 Marking queue and FA-19 Mark a submission (B4-09), and of the FA-01 Overview
 * actions Phase 4B renders (B4-01), are the frozen boards’: each drawn phrase is found verbatim in
 * its board’s markup or script, the composed ones with the boards’ own sample values (or, where the
 * board composes them in its script, the script’s own pieces); the undrawn forms are provisional
 * entries of the state-copy register, each with its decision and no decision id in its words.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  answerTitle,
  assessmentOptionWords,
  automaticMarksWords,
  confirmedByLine,
  confirmEffect,
  confirmMarkLead,
  confirmTitle,
  feedbackLabel,
  inactiveSub,
  inactiveTitle,
  MARK_SUBMISSION,
  markHeaderWords,
  markHint,
  markLabel,
  MARKING_QUEUE,
  markOfWords,
  OVERVIEW_ACTIONS,
  questionNumberWords,
  releaseLine,
  rowActionLabel,
  submissionOverline,
  submittedLine,
  waitingCountWords,
  writtenNumbersWords,
  writtenQuestionTitle,
} from './marking';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_MARKING } from './state-copy-marking';

/** A board’s text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B4_09 = words('B4-09-Marking.dc.html');
const B4_01 = words('B4-01-Faculty-Overview.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const AFTER_DEADLINE = { option: 'after-deadline', on: '14 Nov 2026, 23:59' } as const;

describe('FA-18 Marking queue (B4-09 f0, f4, f5)', () => {
  it.each(strings(MARKING_QUEUE))('“%s” is on B4-09', (phrase) => {
    expect(B4_09).toContain(phrase);
  });

  it('the composed words are B4-09’s, with its sample values or its script’s own pieces', () => {
    expect(B4_09).toContain(
      assessmentOptionWords('Heat Exchanger — post-lab', 'Shell-and-Tube Heat Exchanger'),
    );
    expect(B4_09).toContain(writtenNumbersWords([4]));
    // The count is composed in the script (`mqView`): the singular whole, the plural’s tail.
    expect(B4_09).toContain(`'${waitingCountWords(1)}'`);
    expect(waitingCountWords(2)).toBe('2 written answers waiting');
    expect(waitingCountWords(0)).toBe('0 written answers waiting');
    expect(B4_09).toContain("' written answers waiting'");
    // The row action’s name (`r.aria`).
    expect(rowActionLabel('Rahul Verma', true)).toBe('View marks for Rahul Verma');
    expect(rowActionLabel('Rahul Verma', false)).toBe('Mark Rahul Verma');
    expect(B4_09).toContain("(r.done ? 'View marks for ' : 'Mark ') + r.who");
  });

  it('several written questions are the register’s', () => {
    expect(writtenNumbersWords([4, 5])).toBe('Questions 4, 5 · written answers');
    expect(B4_09).not.toContain('Questions 4, 5');
  });
});

describe('FA-19 Mark a submission (B4-09 f1 … f3, f7, f8)', () => {
  it.each(strings(MARK_SUBMISSION))('“%s” is on B4-09', (phrase) => {
    expect(B4_09).toContain(phrase);
  });

  it('the composed words are B4-09’s, with its sample values', () => {
    for (const phrase of [
      submissionOverline('Heat Exchanger — post-lab', 'Shell-and-Tube Heat Exchanger'),
      submittedLine('5 Nov 2026, 18:52', 1, 2),
      writtenQuestionTitle(4),
      answerTitle('Rahul Verma'),
      markLabel(4),
      markHint(10),
      feedbackLabel('Rahul'),
      confirmedByLine('7 Nov 2026, 10:15', 'Dr S. Ranganathan'),
      confirmTitle('Rahul Verma'),
      `${confirmMarkLead(4)}<strong>`,
      confirmEffect('Rahul', AFTER_DEADLINE),
    ]) {
      expect(B4_09).toContain(phrase);
    }
    // Composed in the script (`asView`): the marks, the section head and the release lines.
    expect(questionNumberWords(1)).toBe('Question 1');
    expect(B4_09).toContain("t: 'Question ' + a.n, m: a.got + ' of ' + a.of");
    expect(markOfWords(7, 10)).toBe('7 of 10');
    expect(automaticMarksWords(4, 6)).toBe('4 of 6 marks');
    expect(B4_09).toContain("c.autoGot + ' of ' + c.autoOf + ' marks'");
    expect(releaseLine('Rahul', AFTER_DEADLINE, null)).toBe(
      'Rahul sees the result after the deadline: 14 Nov 2026, 23:59, as set for this assessment.',
    );
    expect(B4_09).toContain(
      "D.first + ' sees the result after the deadline: ' + D.deadline + ', as set for this assessment.'",
    );
    expect(releaseLine('Rahul', AFTER_DEADLINE, '14 Nov 2026, 23:59')).toBe(
      'Released to Rahul on 14 Nov 2026, 23:59 — when the deadline passed.',
    );
    expect(B4_09).toContain(
      "'Released to ' + D.first + ' on ' + D.att.released + ' — when the deadline passed.'",
    );
  });

  it('the undrawn forms are the register’s', () => {
    expect(submittedLine('5 Nov 2026, 18:52', 1, null)).toBe(
      'Submitted 5 Nov 2026, 18:52 · attempt 1',
    );
    const onDate = { option: 'on-date', on: '20 Nov 2026, 09:00' } as const;
    const immediately = { option: 'immediately-after-marking', on: null } as const;
    expect(releaseLine('Rahul', onDate, null)).toBe(
      'Rahul sees the result on 20 Nov 2026, 09:00, as set for this assessment.',
    );
    expect(releaseLine('Rahul', immediately, null)).toBe(
      'Rahul sees the result as soon as the marks are confirmed, as set for this assessment.',
    );
    expect(releaseLine('Rahul', { option: null, on: null }, null)).toBe(
      'Rahul sees the result when it’s released.',
    );
    expect(releaseLine('Rahul', onDate, '20 Nov 2026, 09:00')).toBe(
      'Released to Rahul on 20 Nov 2026, 09:00 — on the date set for this assessment.',
    );
    expect(releaseLine('Rahul', immediately, '7 Nov 2026, 10:15')).toBe(
      'Released to Rahul on 7 Nov 2026, 10:15 — when the marks were confirmed.',
    );
    expect(confirmEffect('Rahul', onDate)).toBe(
      'Confirmed marks can’t be changed. Rahul sees the result when it’s released — on 20 Nov 2026, 09:00.',
    );
    expect(confirmEffect('Rahul', immediately)).toBe(
      'Confirmed marks can’t be changed. Rahul sees the result when it’s released — as soon as you confirm.',
    );
  });
});

describe('FA-01 Overview: the Phase-4B actions (B4-01 f0, f4)', () => {
  it.each(strings(OVERVIEW_ACTIONS))('“%s” is on B4-01', (phrase) => {
    expect(B4_01).toContain(phrase);
  });

  it('the composed words are B4-01’s, with its sample values; the undrawn forms the register’s', () => {
    expect(B4_01).toContain(markHeaderWords(1));
    expect(B4_01).toContain(inactiveTitle(2, 14));
    expect(B4_01).toContain(
      inactiveSub(['Imran Shaikh', 'Karthik Rao'], 'Shell-and-Tube Heat Exchanger'),
    );
    expect(markHeaderWords(3)).toBe('Mark 3 written answers');
    expect(inactiveTitle(1, 14)).toBe('1 student inactive for 14 days or more');
    expect(
      inactiveSub(
        ['Imran Shaikh', 'Karthik Rao', 'Divya Menon', 'Rahul Verma', 'Priya Natarajan'],
        'Shell-and-Tube Heat Exchanger',
      ),
    ).toBe('Imran Shaikh, Karthik Rao, Divya Menon and 2 more · Shell-and-Tube Heat Exchanger');
  });
});

describe('the state-copy entries of the marking group', () => {
  it.each(Object.entries(STATE_COPY_MARKING))(
    '%s is provisional, with its decision, and names no decision in its words',
    (id, entry) => {
      expect(id).toMatch(/^FA-(01|18|19)\./);
      expect(entry.screen).toBe(id.slice(0, 5));
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
      if (entry.words !== null) {
        expect(entry.words).not.toMatch(/\b(?:OD|T|PC|DEV|VD|ATT|M|DV)-?\d/);
        // Undrawn words are not on the board as they are (the drawn ones are in `marking.ts`).
        if (!['FA-19.no-answer', 'FA-19.saving'].includes(id)) {
          expect(B4_09).not.toContain(entry.words);
        }
      }
      // Registered in the one register.
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
    },
  );
});
