/**
 * The words of ST-15 Progress and ST-16 / ST-17 Format feedback are the owner-approved V3 Student
 * export's (ST-v1 `StudentFinal.dc.html`: its template and the script that fills it) — each drawn
 * phrase found verbatim, each composed one with the script's own composition — and none names a
 * record by its internal reference (lead decision 3). The Home's Up next button stays B2-10's
 * (home's describe). What the export does not draw is a provisional entry of the state-copy
 * register, waiting on a named decision.
 */
import { describe, expect, it } from 'vitest';

import { board, stExport } from '@/test-support/boards';

import {
  answersHeading,
  answerWords,
  courseChip,
  experimentCount,
  FEEDBACK_NOT_OPEN,
  FEEDBACK_PAGE,
  feedbackTitle,
  PROGRESS_ASSESSMENT,
  PROGRESS_PAGE,
  progressCount,
  RATING_LABELS,
  removeFilterWords,
  sentLine,
  STATEMENT_INDEXES,
  statementLegend,
  STATUS_OPTIONS,
  statusChip,
  UP_NEXT_FEEDBACK,
} from './progress-feedback';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_PROGRESS_FEEDBACK } from './state-copy-progress-feedback';

/** Text as it reads: the export's no-break spaces that keep a date on one line (`nbd`) read as
 * spaces. */
const plain = <T extends string | null | undefined>(text: T): T =>
  (text == null ? text : text.replace(/\u00a0/g, ' ')) as T;

const MAIN = stExport('StudentFinal.dc.html');
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));
const SCRIPT = MAIN.slice(MAIN.indexOf('<script type="text/x-dc"'));
const DRAWN = `${TEMPLATE.replace(/&amp;/g, '&')}\n${SCRIPT}`;
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT)-\d+/;
const B2_10 = board('B2-10-Student-Home.dc.html');

/** IST instants of the walk (Rahul's learning). */
const AT = {
  vrFeedback: '2026-10-20T06:00:00.000Z', // 20 Oct 2026, 11:30
  deadline: '2026-11-14T18:29:00.000Z', // 14 Nov 2026, 23:59
  released: '2026-11-16T05:30:00.000Z', // 16 Nov 2026
};

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('ST-15 Progress (ST-v1 `progress`, `progVM`, `progExp`)', () => {
  it.each(strings(PROGRESS_PAGE))('“%s” is drawn in the export', (phrase) => {
    expect(DRAWN).toContain(phrase);
  });

  it('the Status options, the chips and the count are the export’s compositions', () => {
    const exportValue = { 'in-progress': 'prog', completed: 'done', 'not-started': 'none' };
    for (const [status, label] of STATUS_OPTIONS) {
      expect(TEMPLATE).toContain(`<option value="${exportValue[status]}">${label}</option>`);
    }
    expect(SCRIPT).toContain("label: 'Status: ' + { prog: 'In progress'");
    expect(statusChip('Completed')).toBe('Status: Completed');
    expect(SCRIPT).toContain("label: 'Course: ' + C.own");
    expect(courseChip('MEC-523')).toBe('Course: MEC-523');
    expect(SCRIPT).toContain("c.aria = 'Remove filter ' + c.label");
    expect(removeFilterWords('Status: Completed')).toBe('Remove filter Status: Completed');
    expect(SCRIPT).toContain("d: '1 experiment'");
    expect(experimentCount(1)).toBe('1 experiment');
    expect(experimentCount(2)).toBe('2 experiments');
    expect(SCRIPT).toContain(
      "V.count = chips.length ? (show ? 1 : 0) + ' of 1 experiment' : '1 experiment in 1 course'",
    );
    expect(progressCount(1, 1, 1, false)).toBe('1 experiment in 1 course');
    expect(progressCount(0, 1, 1, true)).toBe('0 of 1 experiment');
    expect(progressCount(1, 1, 1, true)).toBe('1 of 1 experiment');
  });

  it('the assessment line is `progExp`’s', () => {
    const name = 'Heat Exchanger — post-lab';
    expect(SCRIPT).toContain(`a.st === 'none' ? '${PROGRESS_ASSESSMENT.noneSet}'`);
    expect(SCRIPT).toContain("A.name + ' · to do · due ' + this.nbd(A.deadline)");
    expect(plain(PROGRESS_ASSESSMENT.toDo(name, AT.deadline))).toBe(
      `${name} · to do · due 14 Nov 2026, 23:59`,
    );
    expect(SCRIPT).toContain("A.name + ' · attempt in progress'");
    expect(PROGRESS_ASSESSMENT.inProgress(name)).toBe(`${name} · attempt in progress`);
    expect(SCRIPT).toContain("A.name + ' · submitted, waiting for marking'");
    expect(PROGRESS_ASSESSMENT.waiting(name)).toBe(`${name} · submitted, waiting for marking`);
    expect(SCRIPT).toContain("A.name + ' · marked, result not released yet'");
    expect(PROGRESS_ASSESSMENT.notReleased(name)).toBe(`${name} · marked, result not released yet`);
    expect(SCRIPT).toContain(
      "A.name + ' · ' + (sc >= A.passm ? 'passed' : 'not passed') + ' · ' + sc + ' of ' + A.total + ' marks · released '",
    );
    expect(plain(PROGRESS_ASSESSMENT.released(name, true, 12, 16, AT.released))).toBe(
      `${name} · passed · 12 of 16 marks · released 16 Nov 2026`,
    );
    expect(SCRIPT).toContain(
      `{ todo: '${PROGRESS_ASSESSMENT.open}', prog: '${PROGRESS_ASSESSMENT.continueAttempt}', ready: '${PROGRESS_ASSESSMENT.seeResult}' }`,
    );
  });

  it('the grant line names no grant (lead decision 3)', () => {
    expect(SCRIPT).toContain(`given: '${PROGRESS_PAGE.given}'`);
    for (const phrase of strings(PROGRESS_PAGE)) expect(phrase).not.toMatch(REFERENCE);
  });
});

describe('ST-16 / ST-17 Format feedback (ST-v1 `feedback`, `fbVM`, `msg(fb-not)`)', () => {
  it.each(strings(FEEDBACK_PAGE))('“%s” is drawn in the export', (phrase) => {
    expect(DRAWN).toContain(phrase);
  });

  it('the statements, the scale and the composed words are the export’s', () => {
    expect(STATEMENT_INDEXES).toHaveLength(5);
    for (const index of STATEMENT_INDEXES) {
      expect(SCRIPT).toContain(statementLegend(index).replace(/^\d\. /, ''));
    }
    expect(SCRIPT).toContain("t: n + '. ' + t");
    for (const label of Object.values(RATING_LABELS)) expect(SCRIPT).toContain(`'${label}'`);
    expect(SCRIPT).toContain("h1: sent ? 'Feedback on ' + f + ' sent' : 'Feedback on ' + f");
    expect(feedbackTitle('vr')).toBe('Feedback on VR');
    expect(TEMPLATE).toContain('Your answers · {{ FB.code }}');
    expect(answersHeading('web')).toBe('Your answers · WEB');
    expect(TEMPLATE).toContain('Sent {{ FB.when }}. Feedback can’t be changed after it’s sent.');
    expect(plain(sentLine(AT.vrFeedback))).toBe(
      'Sent 20 Oct 2026, 11:30. Feedback can’t be changed after it’s sent.',
    );
    expect(SCRIPT).toContain("v ? v + ' — ' + SC[v - 1]");
    expect(answerWords(4)).toBe('4 — Agree');
    expect(SCRIPT).toContain("V.commentText = sent.comments || '—'");
  });

  it('“isn’t open yet” is `msg(fb-not)`’s', () => {
    expect(SCRIPT).toContain("k: E.t + ' · Feedback'");
    expect(FEEDBACK_NOT_OPEN.kicker('Shell-and-Tube Heat Exchanger')).toBe(
      'Shell-and-Tube Heat Exchanger · Feedback',
    );
    expect(SCRIPT).toContain("'Feedback on ' + r.fmt + ' isn’t open yet'");
    expect(FEEDBACK_NOT_OPEN.title('vr')).toBe('Feedback on VR isn’t open yet');
    expect(SCRIPT).toContain(
      "'You can give feedback on ' + r.fmt + ' once ' + r.fmt + ' is recorded as completed. Each format has its own feedback.'",
    );
    expect(FEEDBACK_NOT_OPEN.line('web')).toBe(
      'You can give feedback on WEB once WEB is recorded as completed. Each format has its own feedback.',
    );
    expect(SCRIPT).toContain("p('Back to ' + (r.fmt === 'VR' ? 'VR' : 'WEB')");
    expect(FEEDBACK_NOT_OPEN.back('vr')).toBe('Back to VR');
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
      if (entry.words !== null) expect(entry.words, id).not.toMatch(REFERENCE);
    }
    expect(STATE_COPY_PROGRESS_FEEDBACK['ST-16.not-eligible'].decisions).toEqual(['T-12', 'T-25']);
  });
});
