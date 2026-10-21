/**
 * The words of FA-18 Marking queue and FA-19 Mark a submission are the owner-approved Faculty
 * export's (V3 Refined B, FA-v1 `Main.dc.html`): each drawn phrase is found verbatim in its
 * template or script, the composed ones by the script's own formula with the export's values; the
 * question types stay the product's (“Multiple choice”: lead decision 1). The undrawn forms are
 * provisional entries of the state-copy register, each with its decision and no decision id in its
 * words.
 */
import { describe, expect, it } from 'vitest';

import { faExport } from '@/test-support/boards';

import {
  answerTitle,
  assessmentOptionWords,
  automaticMarksWords,
  choiceQuestionWords,
  confirmedByLine,
  confirmedOnWords,
  confirmLaterTitle,
  confirmMarkLine,
  confirmReleasePlan,
  confirmTitle,
  confirmTotalLine,
  doneTotalWords,
  feedbackLabel,
  liveTotalLine,
  liveTotalWords,
  MARK_SUBMISSION,
  markFieldSub,
  markHint,
  MARKING_QUEUE,
  markOfWords,
  markOutOf,
  oldestWaitingWords,
  passOutcomeWords,
  queueAttemptWords,
  queuePositionWords,
  questionNumberWords,
  resultReleaseLine,
  rowActionLabel,
  segmentCountWords,
  submissionOverline,
  submittedAgoWords,
  submittedLine,
  totalMarksWords,
  waitingCountWords,
  writtenNumbersWords,
  writtenQuestionHead,
} from './marking';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_MARKING } from './state-copy-marking';

/** The export's live root: its template's words (tags removed), then its raw source and script. */
const FA_RAW = faExport('Main.dc.html');
const FA = `${FA_RAW.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${FA_RAW}`;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const AFTER_DEADLINE = { option: 'after-deadline', on: '14 Nov 2026, 23:59' } as const;
const ON_DATE = { option: 'on-date', on: '20 Nov 2026, 09:00' } as const;
const IMMEDIATELY = { option: 'immediately-after-marking', on: null } as const;

describe('FA-18 Marking queue (FA-v1 FA-18, `vmQueue`)', () => {
  /**
   * The co-teacher's note says what the export's does in the product's words for co-teaching (“a
   * co-teaching colleague”, the state copy of FA-12, FA-19 and FA-21): B8-03 allows no role-name
   * variant, and the export writes “co-teachers”.
   */
  const COTEACH_EXPORT =
    'Written answers for assessments another Faculty member created aren’t shown to co-teachers while sharing between co-teachers is being decided.';

  it.each(strings({ ...MARKING_QUEUE, coteachNote: undefined }))(
    '“%s” is the export’s',
    (phrase) => {
      expect(FA).toContain(phrase);
    },
  );

  it('the co-teacher’s note is the export’s, in the product’s words for co-teaching', () => {
    expect(FA).toContain(COTEACH_EXPORT);
    expect(MARKING_QUEUE.coteachNote).toBe(
      COTEACH_EXPORT.replace('shown to co-teachers', 'shown to co-teaching colleagues').replace(
        'between co-teachers',
        'between colleagues',
      ),
    );
    expect(MARKING_QUEUE.coteachNote).not.toMatch(/\bteachers?\b/i);
  });

  it('the composed words are the script’s formulas, with the export’s values', () => {
    expect(FA).toContain("'1 written answer waiting'");
    expect(FA).toContain("' written answers waiting' : 'Nothing waiting'");
    expect(waitingCountWords(1)).toBe('1 written answer waiting');
    expect(waitingCountWords(2)).toBe('2 written answers waiting');
    expect(waitingCountWords(0)).toBe('Nothing waiting');
    expect(FA).toContain("'Oldest submitted today' : 'Oldest waiting ' + this.plural(d, 'day')");
    expect(oldestWaitingWords(2)).toBe('Oldest waiting 2 days');
    expect(oldestWaitingWords(1)).toBe('Oldest waiting 1 day');
    expect(oldestWaitingWords(0)).toBe('Oldest submitted today');
    expect(FA).toContain("d0 <= 0 ? 'Today' : this.plural(d0, 'day') + ' ago'");
    expect(submittedAgoWords(2)).toBe('2 days ago');
    expect(submittedAgoWords(1)).toBe('1 day ago');
    expect(submittedAgoWords(0)).toBe('Today');
    expect(FA).toContain("sub: 'Attempt ' + t.no + ' of ' + cfg.att");
    expect(queueAttemptWords(1, 2)).toBe('Attempt 1 of 2');
    expect(FA).toContain("t: (a.name || 'Untitled draft') + ' · ' + this.expo(a.exp).t");
    expect(
      assessmentOptionWords('Heat Exchanger — post-lab', 'Shell-and-Tube Heat Exchanger'),
    ).toBe('Heat Exchanger — post-lab · Shell-and-Tube Heat Exchanger');
    expect(FA).toContain("'Question ' + w[0].n + ' · written answer'");
    expect(writtenNumbersWords([4])).toBe('Question 4 · written answer');
    expect(FA).toContain("'Confirmed ' + t.confirmed");
    expect(confirmedOnWords('7 Nov 2026, 10:15')).toBe('Confirmed 7 Nov 2026, 10:15');
    expect(FA).toContain("(w ? 'Mark ' : 'View marks for ') + s.n");
    expect(rowActionLabel('Rahul Verma', true)).toBe('View marks for Rahul Verma');
    expect(rowActionLabel('Rahul Verma', false)).toBe('Mark Rahul Verma');
    expect(FA).toContain('<span class="xr-sr">, {{ MQ.nWait }}</span>');
    expect(segmentCountWords(2)).toBe(', 2');
  });

  it('the undrawn forms are the register’s', () => {
    expect(queueAttemptWords(1, null)).toBe('Attempt 1');
    expect(writtenNumbersWords([4, 5])).toBe('Questions 4 and 5 · written answers');
    expect(writtenNumbersWords([3, 4, 5])).toBe('Questions 3, 4 and 5 · written answers');
    expect(FA).toContain(
      "'Questions ' + this.names(w.map(x => String(x.n))) + ' · written answers'",
    );
  });
});

describe('FA-19 Mark a submission (FA-v1 FA-19, `vmMark`, `dlgMark`, `relPlan`, `relSentence`)', () => {
  it.each(strings(MARK_SUBMISSION))('“%s” is the export’s', (phrase) => {
    expect(FA).toContain(phrase);
  });

  it('the composed words are the script’s formulas, with the export’s values', () => {
    expect(submissionOverline('Heat Exchanger — post-lab', 'Shell-and-Tube Heat Exchanger')).toBe(
      'Heat Exchanger — post-lab · Shell-and-Tube Heat Exchanger',
    );
    expect(FA).toContain(
      "'Submitted ' + t.submitted + ' · attempt ' + t.no + ' of ' + cfg.att + (a.versions.length > 1 ? ' · version ' + t.ver : '')",
    );
    expect(submittedLine('5 Nov 2026, 18:52', 1, 2)).toBe(
      'Submitted 5 Nov 2026, 18:52 · attempt 1 of 2',
    );
    expect(submittedLine('5 Nov 2026, 18:52', 1, 2, 2)).toBe(
      'Submitted 5 Nov 2026, 18:52 · attempt 1 of 2 · version 2',
    );
    expect(FA).toContain("(qi + 1) + ' of ' + wq.length + ' waiting · oldest first'");
    expect(queuePositionWords(1, 2)).toBe('1 of 2 waiting · oldest first');
    expect(FA).toContain("this.plural(sc.of, 'mark') + ' in total'");
    expect(totalMarksWords(16)).toBe('16 marks in total');
    expect(FA).toContain("sc.auto + ' of ' + sc.autoOf + ' marks'");
    expect(automaticMarksWords(4, 6)).toBe('4 of 6 marks');
    // The type word is the product's (lead decision 1: “Multiple choice”, shared with Students).
    expect(FA).toContain("'Question ' + i.n + ' · ' + Component.TYPES[q.type]");
    expect(choiceQuestionWords(1, 'multiple-choice')).toBe('Question 1 · Multiple choice');
    expect(choiceQuestionWords(3, 'true-false')).toBe('Question 3 · True or false');
    expect(FA).toContain("i.got + ' of ' + i.of");
    expect(markOfWords(2, 2)).toBe('2 of 2');
    expect(FA).toContain("'Question ' + x.n + ' of ' + cfg.qs.length + ' · Written answer'");
    expect(writtenQuestionHead(4, 4)).toBe('Question 4 of 4 · Written answer');
    expect(FA).toContain("s.n + '’s answer'");
    expect(answerTitle('Rahul Verma')).toBe('Rahul Verma’s answer');
    expect(FA).toContain("'Question ' + x.n + ' · written answer, out of ' + x.q.marks");
    expect(markFieldSub(4, 10)).toBe('Question 4 · written answer, out of 10');
    expect(FA).toContain("'/ ' + x.q.marks");
    expect(markOutOf(10)).toBe('/ 10');
    expect(FA).toContain("'A whole number from 0 to ' + x.q.marks + '.'");
    expect(markHint(10)).toBe('A whole number from 0 to 10.');
    expect(FA).toContain("'Feedback for ' + first + ' (optional)'");
    expect(feedbackLabel('Rahul')).toBe('Feedback for Rahul (optional)');
    expect(FA).toContain("(okAll ? sc.auto + wsum : '—') + ' of ' + sc.of");
    expect(liveTotalWords(null, 16)).toBe('— of 16');
    expect(liveTotalWords(11, 16)).toBe('11 of 16');
    expect(FA).toContain(
      "' marked automatically + ' + (okAll ? wsum + ' written' : (wr.length === 1 ? 'the written mark'",
    );
    expect(FA).toContain("' · pass mark ' + sc.pm");
    expect(liveTotalLine(4, null, 8)).toBe(
      '4 marked automatically + the written mark · pass mark 8',
    );
    expect(liveTotalLine(4, 7, 8)).toBe('4 marked automatically + 7 written · pass mark 8');
    expect(FA).toContain("t.confirmed + ' · ' + this.person(t.by).name");
    expect(confirmedByLine('7 Nov 2026, 10:15', 'Dr S. Ranganathan')).toBe(
      '7 Nov 2026, 10:15 · Dr S. Ranganathan',
    );
    expect(FA).toContain("sc.total + ' of ' + sc.of + ' marks'");
    expect(doneTotalWords(11, 16)).toBe('11 of 16 marks');
    expect(FA).toContain("(sc.passed ? 'Passed' : 'Not passed') + ' · pass mark ' + sc.pm");
    expect(passOutcomeWords(true, 8)).toBe('Passed · pass mark 8');
    expect(passOutcomeWords(false, 8)).toBe('Not passed · pass mark 8');
    expect(FA).toContain("k: 'Question ' + x.n");
    expect(questionNumberWords(4)).toBe('Question 4');
  });

  it('the dialog’s words are the script’s (`dlgMark`, `relPlan`)', () => {
    expect(FA).toContain("'Confirm marks for ' + s.n + '?'");
    expect(confirmTitle('Rahul Verma')).toBe('Confirm marks for Rahul Verma?');
    expect(FA).toContain(
      "'Question ' + x.n + ' is marked ' + Number(k.marks[x.id]) + ' of ' + x.q.marks + '.'",
    );
    expect(confirmMarkLine(4, 7, 10)).toBe('Question 4 is marked 7 of 10.');
    expect(FA).toContain(
      "s.first + '’s total becomes ' + total + ' of ' + sc.of + ' marks — ' + (total >= sc.pm ? 'passed' : 'not passed') + ' (pass mark ' + sc.pm + ').'",
    );
    expect(confirmTotalLine('Rahul', 11, 16, true, 8)).toBe(
      'Rahul’s total becomes 11 of 16 marks — passed (pass mark 8).',
    );
    expect(confirmTotalLine('Rahul', 7, 16, false, 8)).toBe(
      'Rahul’s total becomes 7 of 16 marks — not passed (pass mark 8).',
    );
    expect(FA).toContain("'When ' + s.first + ' sees the result'");
    expect(confirmLaterTitle('Rahul')).toBe('When Rahul sees the result');
    expect(FA).toContain(
      "first + ' sees the result as soon as you confirm, as set for this assessment.'",
    );
    expect(confirmReleasePlan('Rahul', IMMEDIATELY, false)).toEqual({
      now: true,
      text: 'Rahul sees the result as soon as you confirm, as set for this assessment.',
    });
    expect(FA).toContain(
      "first + ' sees the result as soon as you confirm — ' + (cfg.rel === 'date' ? 'the release date' : 'the deadline') + ' has passed.'",
    );
    expect(confirmReleasePlan('Rahul', AFTER_DEADLINE, true)).toEqual({
      now: true,
      text: 'Rahul sees the result as soon as you confirm — the deadline has passed.',
    });
    expect(confirmReleasePlan('Rahul', ON_DATE, true).text).toBe(
      'Rahul sees the result as soon as you confirm — the release date has passed.',
    );
    expect(FA).toContain(
      "first + ' sees the result ' + (cfg.rel === 'date' ? 'on ' + when : 'after the deadline: ' + when) + ', as set for this assessment.'",
    );
    expect(confirmReleasePlan('Rahul', AFTER_DEADLINE, false)).toEqual({
      now: false,
      text: 'Rahul sees the result after the deadline: 14 Nov 2026, 23:59, as set for this assessment.',
    });
    expect(confirmReleasePlan('Rahul', ON_DATE, false)).toEqual({
      now: false,
      text: 'Rahul sees the result on 20 Nov 2026, 09:00, as set for this assessment.',
    });
  });

  it('the release lines once confirmed are the script’s (`relSentence`, FA-19 and FA-21)', () => {
    expect(FA).toContain(
      "'Result released to ' + first + ' when the deadline passed: ' + cfg.dl + '.'",
    );
    expect(resultReleaseLine('Rahul', AFTER_DEADLINE, true, null)).toBe(
      'Result released to Rahul when the deadline passed: 14 Nov 2026, 23:59.',
    );
    expect(FA).toContain(
      "'Result released to ' + first + ' on ' + cfg.reldate + ', as set for this assessment.'",
    );
    expect(resultReleaseLine('Rahul', ON_DATE, true, null)).toBe(
      'Result released to Rahul on 20 Nov 2026, 09:00, as set for this assessment.',
    );
    expect(FA).toContain(
      "'Result released to ' + first + ' when the marks were confirmed, ' + t.confirmed + '.'",
    );
    expect(resultReleaseLine('Rahul', IMMEDIATELY, true, '7 Nov 2026, 10:15')).toBe(
      'Result released to Rahul when the marks were confirmed, 7 Nov 2026, 10:15.',
    );
    expect(FA).toContain(
      "'Result not released to ' + first + ' yet — ' + (cfg.rel === 'date' ? 'on ' + cfg.reldate : 'after the deadline, ' + cfg.dl) + ', as set for this assessment.'",
    );
    expect(resultReleaseLine('Rahul', AFTER_DEADLINE, false, '7 Nov 2026, 10:15')).toBe(
      'Result not released to Rahul yet — after the deadline, 14 Nov 2026, 23:59, as set for this assessment.',
    );
    expect(resultReleaseLine('Rahul', ON_DATE, false, null)).toBe(
      'Result not released to Rahul yet — on 20 Nov 2026, 09:00, as set for this assessment.',
    );
  });

  it('the undrawn forms are the register’s', () => {
    expect(submittedLine('5 Nov 2026, 18:52', 1, null)).toBe(
      'Submitted 5 Nov 2026, 18:52 · attempt 1',
    );
    expect(resultReleaseLine('Rahul', IMMEDIATELY, false, null)).toBe(
      'Result not released to Rahul yet — immediately after marking, as set for this assessment.',
    );
    expect(resultReleaseLine('Rahul', { option: null, on: null }, false, null)).toBe(
      'Rahul sees the result when it’s released.',
    );
    expect(resultReleaseLine('Rahul', { option: null, on: null }, true, null)).toBe(
      'Result released to Rahul.',
    );
    expect(confirmReleasePlan('Rahul', { option: null, on: null }, false)).toEqual({
      now: false,
      text: 'Rahul sees the result when it’s released.',
    });
    expect(confirmTotalLine('Rahul', 11, 16, null, null)).toBe(
      'Rahul’s total becomes 11 of 16 marks.',
    );
    expect(passOutcomeWords(true, null)).toBeNull();
  });
});

describe('the state-copy entries of the marking group', () => {
  it.each(Object.entries(STATE_COPY_MARKING))(
    '%s is provisional, with its decision, and names no decision in its words',
    (id, entry) => {
      expect(id).toMatch(/^FA-(18|19)\./);
      expect(entry.screen).toBe(id.slice(0, 5));
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
      if (entry.words !== null) {
        expect(entry.words).not.toMatch(/\b(?:OD|T|PC|DEV|VD|ATT|M|DV)-?\d/);
        // Undrawn words are not in the export as they are (the drawn ones are in `marking.ts`).
        // Two of them the export also writes: “Saving…” (its drafting busy label) and the
        // colleague’s refusal title (the existing words, kept: HANDOFF §4 OD-B4-17).
        if (!['FA-19.saving', 'FA-19.policy-open.colleague.title'].includes(id)) {
          expect(FA).not.toContain(entry.words);
        }
      }
      // Registered in the one register.
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
    },
  );
});
