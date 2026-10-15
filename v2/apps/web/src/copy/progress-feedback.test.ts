/**
 * The words of ST-15 Progress and ST-16 / ST-17 Format feedback are the frozen boards' B3-05 and
 * B3-06 (and B2-10 f5 for the Home's Up next button): each drawn phrase is found verbatim in their
 * markup or script, the composed ones with the board's own values; what no board draws is a
 * provisional entry of the state-copy register, waiting on a named decision.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  answersHeading,
  answerWords,
  beforePauseWords,
  courseChip,
  experimentCount,
  FEEDBACK_PAGE,
  feedbackSentWords,
  feedbackTitle,
  givenThroughWords,
  lastSavedWords,
  lastSessionWords,
  openFormatWords,
  PROGRESS_DETAILS,
  PROGRESS_PAGE,
  RATING_LABELS,
  sentLine,
  STATEMENT_INDEXES,
  statementLegend,
  STATUS_OPTIONS,
  statusChip,
  UP_NEXT_FEEDBACK,
} from './progress-feedback';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_PROGRESS_FEEDBACK } from './state-copy-progress-feedback';

/** A board's text with tags removed and entities read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B3_05 = words('B3-05-Progress.dc.html');
const B3_06 = words('B3-06-Format-Feedback.dc.html');
const B3_04 = words('B3-04-AR-VR-MR-Format.dc.html');
const B3_02 = words('B3-02-Simulation-Choose-Format.dc.html');
const B2_10 = words('B2-10-Student-Home.dc.html');

/** IST instants of the walk (B3-00 "Rahul’s learning"). */
const AT = {
  webOpened: '2026-10-12T04:35:00.000Z', // 12 Oct 2026, 10:05
  webSaved: '2026-10-12T05:50:00.000Z', // 12 Oct 2026, 11:20
  webDone: '2026-10-14T10:00:00.000Z', // 14 Oct 2026, 15:30
  webFeedback: '2026-10-14T10:12:00.000Z', // 14 Oct 2026, 15:42
  vrSession: '2026-10-16T08:40:00.000Z', // 16 Oct 2026, 14:10
  vrDone: '2026-10-20T05:45:00.000Z', // 20 Oct 2026, 11:15
  vrFeedback: '2026-10-20T06:00:00.000Z', // 20 Oct 2026, 11:30
};

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('ST-15 Progress (B3-05)', () => {
  it.each(strings(PROGRESS_PAGE))('“%s” is on B3-05', (phrase) => {
    expect(B3_05).toContain(phrase);
  });

  it('the Status options and the composed words are the board’s', () => {
    const boardValue = { 'in-progress': 'prog', completed: 'done', 'not-started': 'none' };
    for (const [status, label] of STATUS_OPTIONS) {
      expect(B3_05).toContain(`<option value="${boardValue[status]}">${label}</option>`);
    }
    // The chips as the script builds them ('Status: ' + LBL[s.st], 'Course: ' + s.crs).
    expect(B3_05).toContain("'Status: ' + LBL[s.st]");
    expect(statusChip('Not started')).toBe('Status: Not started');
    expect(B3_05).toContain("c.aria = 'Remove ' + c.label");
    expect(B3_05).toContain("'Course: ' + s.crs");
    expect(courseChip('ME ZG523')).toBe('Course: ME ZG523');
    expect(B3_05).toContain("count: show ? '1 experiment' : '0 experiments'");
    expect(experimentCount(1)).toBe('1 experiment');
    expect(experimentCount(0)).toBe('0 experiments');
    expect(B3_05).toContain(givenThroughWords('SACC-0310'));
    expect(B3_05).toContain(lastSavedWords(AT.webSaved));
    expect(B3_05).toContain(beforePauseWords('Completed 14 Oct 2026'));
    expect(B3_05).toContain(beforePauseWords('Not started'));
    expect(B3_05).toContain(feedbackSentWords(AT.webFeedback));
    expect(B3_05).toContain(feedbackSentWords(AT.vrFeedback));
    expect(B3_05).toContain(openFormatWords('vr'));
    expect(B3_02).toContain(openFormatWords('web'));
    expect(B3_04).toContain(lastSessionWords(AT.vrSession));
  });

  it('the details rows are the board’s', () => {
    expect(B3_05).toContain(
      `${PROGRESS_DETAILS.firstOpened(AT.webOpened)} · ${PROGRESS_DETAILS.completed(AT.webDone)}`,
    );
    expect(B3_05).toContain(
      `${PROGRESS_DETAILS.firstOpened(AT.webOpened)} · ${PROGRESS_DETAILS.lastSaved(AT.webSaved)}`,
    );
    expect(B3_05).toContain(
      `${PROGRESS_DETAILS.firstSession(AT.vrSession)} · ${PROGRESS_DETAILS.completed(AT.vrDone)}`,
    );
    expect(B3_05).toContain(`<dt>${PROGRESS_DETAILS.feedbackKey('web')}</dt>`);
    expect(B3_05).toContain(`<dd>${PROGRESS_DETAILS.sent(AT.webFeedback)}</dd>`);
  });
});

describe('ST-16 / ST-17 Format feedback (B3-06)', () => {
  it.each(strings(FEEDBACK_PAGE))('“%s” is on B3-06', (phrase) => {
    expect(B3_06).toContain(phrase);
  });

  it('the statements, the scale and the composed words are the board’s', () => {
    expect(STATEMENT_INDEXES).toHaveLength(5);
    for (const index of STATEMENT_INDEXES) {
      expect(B3_06).toContain(statementLegend(index).replace(/^\d\. /, ''));
    }
    expect(B3_06).toContain("t: n + '. ' + t");
    for (const label of Object.values(RATING_LABELS)) expect(B3_06).toContain(`"${label}"`);
    expect(B3_06).toContain(feedbackTitle('vr'));
    expect(B3_06).toContain(feedbackTitle('web'));
    expect(B3_06).toContain(answersHeading('vr'));
    expect(B3_06).toContain(answersHeading('web'));
    // 'Thank you. Sent {{ f.when }}. Feedback can’t be changed after it’s sent.' with f.when.
    expect(B3_06).toContain(
      'Thank you. Sent {{ f.when }}. Feedback can’t be changed after it’s sent.',
    );
    expect(sentLine(AT.vrFeedback)).toBe(
      'Thank you. Sent 20 Oct 2026, 11:30. Feedback can’t be changed after it’s sent.',
    );
    expect(B3_06).toContain("s.ans[i + 1] + ' — ' + D.scale[s.ans[i + 1] - 1]");
    expect(answerWords(4)).toBe('4 — Agree');
    expect(B3_06).toContain("commentText: s.comments.trim() || '—'");
  });
});

describe('ST-01 Up next (B2-10 f5)', () => {
  it('“Give feedback” is the Up next button B2-10 draws', () => {
    expect(B2_10).toContain(`href="B3-06-Format-Feedback.dc.html">${UP_NEXT_FEEDBACK}</a>`);
  });
});

describe('the register', () => {
  it('every entry is provisional and waits on a named decision', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_PROGRESS_FEEDBACK)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
    }
    expect(STATE_COPY_PROGRESS_FEEDBACK['ST-16.not-eligible'].decisions).toEqual(['T-12', 'T-25']);
  });
});
