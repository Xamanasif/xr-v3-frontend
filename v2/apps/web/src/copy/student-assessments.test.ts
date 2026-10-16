/**
 * The words of ST-11 Assessments, the hub's Assessment tab and Home's "Up next" assessment row are
 * the frozen board's (B4-11 f0 … f10): each drawn phrase is found verbatim in the board's markup
 * (its frames, or the board script that composes f0 … f6's rows), and each composed line takes the
 * board's own form for the board's sample. Undrawn words live in the state-copy register
 * (`state-copy-student-assessments.ts`), each provisional with its decision.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import { STATE_COPY_STUDENT_ASSESSMENTS } from './state-copy-student-assessments';
import {
  answersSavedLine,
  assessmentActionLabel,
  assessmentExperimentLine,
  assessmentTabWords,
  dueLine,
  HUB_ASSESSMENT_TAB,
  hubDueLine,
  hubSubmittedLine,
  questionCountWords,
  releasedLine,
  releaseTermsLine,
  STUDENT_ASSESSMENT_ACTIONS,
  STUDENT_ASSESSMENT_TAB_EMPTY,
  STUDENT_ASSESSMENT_TAB_WORDS,
  STUDENT_ASSESSMENTS_PAGE,
  submittedLine,
  UP_NEXT_OPEN_ASSESSMENT,
  upNextAssessmentSub,
  upNextAssessmentTitle,
} from './student-assessments';

/** A board's text with tags removed and entities read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, '’')}\n${raw}`;
}

const B4_11 = words('B4-11-Student-Assessments.dc.html');

// The board's sample instants (IST): the deadline (D1) and Rahul's submission (D2).
const DEADLINE = '2026-11-14T18:29:00.000Z'; // 14 Nov 2026, 23:59
const SUBMITTED = '2026-11-05T13:22:00.000Z'; // 5 Nov 2026, 18:52
const NAME = 'Heat Exchanger — post-lab';
const SHELL = 'Shell-and-Tube Heat Exchanger';

describe('ST-11 Assessments (B4-11 f0 … f6)', () => {
  it('draws the page, the tabs, the empty states and the actions', () => {
    for (const phrase of Object.values(STUDENT_ASSESSMENTS_PAGE)) expect(B4_11).toContain(phrase);
    for (const tab of Object.values(STUDENT_ASSESSMENT_TAB_WORDS))
      expect(B4_11).toContain(`>${tab} ({{`);
    for (const line of Object.values(STUDENT_ASSESSMENT_TAB_EMPTY)) expect(B4_11).toContain(line);
    for (const action of Object.values(STUDENT_ASSESSMENT_ACTIONS))
      expect(B4_11).toContain(`'${action}'`);
    expect(B4_11).toContain(`aria-label="{{ r.aria }}"`);
    expect(B4_11).toContain(`aria: act + ' ' + D.name`);
    expect(assessmentActionLabel('Open', NAME)).toBe(`Open ${NAME}`);
    expect(assessmentTabWords('to-do', 1)).toBe('To do (1)');
    expect(assessmentTabWords('submitted', 0)).toBe('Submitted (0)');
    expect(assessmentTabWords('results', 0)).toBe('Results (0)');
  });

  it('composes each row line as the board’s script does for its sample', () => {
    expect(assessmentExperimentLine(SHELL, 'ME ZG523')).toBe(`${SHELL} · ME ZG523`);
    expect(B4_11).toContain(`"exp": "${SHELL} · ME ZG523"`);
    expect(assessmentExperimentLine(SHELL, null)).toBe(SHELL);

    expect(dueLine(DEADLINE, 4)).toBe('Due 14 Nov 2026, 23:59 · 4 questions · no time limit');
    expect(B4_11).toContain(`'Due ' + D.deadline + ' · 4 questions · no time limit'`);
    expect(answersSavedLine(DEADLINE)).toBe('Answers saved · due 14 Nov 2026, 23:59');
    expect(B4_11).toContain(`'Answers saved · due ' + D.deadline`);
    expect(submittedLine(SUBMITTED)).toBe(
      'Submitted 5 Nov 2026, 18:52 · your faculty marks written answers',
    );
    expect(B4_11).toContain(`'Submitted ' + D.submitted + ' · your faculty marks written answers'`);
    expect(releaseTermsLine({ option: 'after-deadline', on: DEADLINE })).toBe(
      'Released after the deadline: 14 Nov 2026, 23:59',
    );
    expect(B4_11).toContain(`'Released after the deadline: ' + D.deadline`);
    expect(releasedLine(DEADLINE)).toBe('Released 14 Nov 2026, 23:59');
    expect(B4_11).toContain(`'Released ' + D.released`);
    // The board's sample dates are these instants.
    expect(B4_11).toContain(`"deadline": "14 Nov 2026, 23:59"`);
    expect(B4_11).toContain(`"submitted": "5 Nov 2026, 18:52"`);
  });

  it('words what the board does not draw from the register', () => {
    expect(questionCountWords(1)).toBe('1 question');
    expect(dueLine(null, 1)).toBe('1 question · no time limit');
    expect(answersSavedLine(null)).toBe('Answers saved');
    expect(releaseTermsLine({ option: 'on-date', on: '2026-11-20T03:30:00.000Z' })).toBe(
      'Released on a date: 20 Nov 2026, 09:00',
    );
    expect(releaseTermsLine({ option: 'immediately-after-marking', on: null })).toBe(
      'Released immediately after marking',
    );
  });
});

describe('the hub’s Assessment tab (B4-11 f7 … f9)', () => {
  it('draws the heading, the action and the empty state', () => {
    expect(B4_11).toContain(`>${HUB_ASSESSMENT_TAB.heading}</h2>`);
    expect(B4_11).toContain(
      `class="xr-btn xr-btn--primary" href="B4-11-Student-Assessments.dc.html">${HUB_ASSESSMENT_TAB.open}</a>`,
    );
    expect(B4_11).toContain(`>${HUB_ASSESSMENT_TAB.noneTitle}</h2>`);
    expect(B4_11).toContain(HUB_ASSESSMENT_TAB.noneLine);
  });

  it('composes f7’s and f9’s lines for the sample', () => {
    const due = hubDueLine(DEADLINE, 4, 16);
    expect(due).toBe('Due 14 Nov 2026, 23:59 · 4 questions · 16 marks · no time limit');
    expect(B4_11).toContain(`>${due}</span>`);
    const submitted = hubSubmittedLine(SUBMITTED, { option: 'after-deadline', on: DEADLINE });
    expect(submitted).toBe('Submitted 5 Nov 2026, 18:52 · your result appears after the deadline');
    expect(B4_11).toContain(`>${submitted}</span>`);
    expect(hubSubmittedLine(SUBMITTED, { option: 'on-date', on: '2026-11-20T03:30:00.000Z' })).toBe(
      'Submitted 5 Nov 2026, 18:52 · your result appears on 20 Nov 2026, 09:00',
    );
    expect(hubSubmittedLine(SUBMITTED, { option: 'immediately-after-marking', on: null })).toBe(
      'Submitted 5 Nov 2026, 18:52 · your result appears once your answers are marked',
    );
  });
});

describe('Home’s Up next (B4-11 f10)', () => {
  it('composes the row as f10 draws it', () => {
    const title = upNextAssessmentTitle(NAME);
    expect(title).toBe('Heat Exchanger — post-lab is ready');
    expect(B4_11).toContain(`>${title}</span>`);
    const sub = upNextAssessmentSub(SHELL, DEADLINE);
    expect(sub).toBe(`${SHELL} · assessment · due 14 Nov 2026, 23:59`);
    expect(B4_11).toContain(`>${sub}</span>`);
    expect(B4_11).toContain(
      `href="B4-11-Student-Assessments.dc.html">${UP_NEXT_OPEN_ASSESSMENT}</a>`,
    );
  });
});

describe('the register', () => {
  it('every entry is provisional with its decision; no decision id in visible words', () => {
    for (const entry of Object.values(STATE_COPY_STUDENT_ASSESSMENTS)) {
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
      expect(entry.words === null ? Boolean('rule' in entry && entry.rule) : true).toBe(true);
      if (entry.words) expect(entry.words).not.toMatch(/\b[A-Z]{1,3}-?\d/);
    }
  });
});
