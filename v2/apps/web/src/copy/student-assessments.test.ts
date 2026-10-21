/**
 * The words of ST-11 Assessments, the hub's Assessment tab and Home's "Up next" assessment row are
 * the frozen board's (B4-11 f0 … f10): each drawn phrase is found verbatim in the board's markup
 * (its frames, or the board script that composes f0 … f6's rows), and each composed line takes the
 * board's own form for the board's sample. Undrawn words live in the state-copy register
 * (`state-copy-student-assessments.ts`), each provisional with its decision.
 */
import { describe, expect, it } from 'vitest';

import { board, stExport } from '@/test-support/boards';

import { STATE_COPY_STUDENT_ASSESSMENTS } from './state-copy-student-assessments';
import {
  assessmentActionName,
  elsewhereWords,
  hubFactsLine,
  markedReleaseLine,
  ST_ASSESSMENTS_V3,
  ST_HUB_ASSESSMENT_V3,
  ST_ROW_LINES,
  WHEN_KICKERS,
  whenWords,
  answersSavedLine,
  assessmentActionLabel,
  assessmentExperimentLine,
  assessmentTabWords,
  HUB_ASSESSMENT_TAB,
  hubDueLine,
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

/** Text as it reads: the export's no-break spaces that keep a date on one line (`nbd`) read as
 * spaces. */
const plain = <T extends string | null | undefined>(text: T): T =>
  (text == null ? text : text.replace(/\u00a0/g, ' ')) as T;

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

    expect(B4_11).toContain(`'Due ' + D.deadline + ' · 4 questions · no time limit'`);
    expect(plain(answersSavedLine(DEADLINE))).toBe('Answers saved · due 14 Nov 2026, 23:59');
    expect(B4_11).toContain(`'Answers saved · due ' + D.deadline`);
    expect(plain(submittedLine(SUBMITTED))).toBe(
      'Submitted 5 Nov 2026, 18:52 · your faculty marks written answers',
    );
    expect(B4_11).toContain(`'Submitted ' + D.submitted + ' · your faculty marks written answers'`);
    expect(plain(releaseTermsLine({ option: 'after-deadline', on: DEADLINE }))).toBe(
      'Released after the deadline: 14 Nov 2026, 23:59',
    );
    expect(B4_11).toContain(`'Released after the deadline: ' + D.deadline`);
    expect(plain(releasedLine(DEADLINE))).toBe('Released 14 Nov 2026, 23:59');
    expect(B4_11).toContain(`'Released ' + D.released`);
    // The board's sample dates are these instants.
    expect(B4_11).toContain(`"deadline": "14 Nov 2026, 23:59"`);
    expect(B4_11).toContain(`"submitted": "5 Nov 2026, 18:52"`);
  });

  it('words what the board does not draw from the register', () => {
    expect(questionCountWords(1)).toBe('1 question');
    expect(answersSavedLine(null)).toBe('Answers saved');
    expect(plain(releaseTermsLine({ option: 'on-date', on: '2026-11-20T03:30:00.000Z' }))).toBe(
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
    expect(plain(due)).toBe('Due 14 Nov 2026, 23:59 · 4 questions · 16 marks · no time limit');
    expect(B4_11).toContain(plain(`>${due}</span>`));
  });
});

describe('Home’s Up next (B4-11 f10)', () => {
  it('composes the row as f10 draws it', () => {
    const title = upNextAssessmentTitle(NAME);
    expect(title).toBe('Heat Exchanger — post-lab is ready');
    expect(B4_11).toContain(`>${title}</span>`);
    const sub = upNextAssessmentSub(SHELL, DEADLINE);
    expect(plain(sub)).toBe(`${SHELL} · assessment · due 14 Nov 2026, 23:59`);
    expect(B4_11).toContain(plain(`>${sub}</span>`));
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

describe('V3: ST-11 Assessments and the hub’s Assessment tab (ST-v1 `alistVM`, `asmtTabVM`)', () => {
  it('the fixed words are the export’s', () => {
    for (const words of Object.values(ST_ASSESSMENTS_V3)) expectStDrawn(words);
    for (const words of Object.values(WHEN_KICKERS)) expectStDrawn(`'${words}'`);
    for (const words of Object.values(ST_HUB_ASSESSMENT_V3)) expectStDrawn(words);
    expectStDrawn('<nav class="rk-tabs sv-tabs" aria-label="Assessments">');
    expectStDrawn(`aria: M[3] + ', ' + A.name`);
    expect(assessmentActionName('Open', NAME)).toBe(`Open, ${NAME}`);
  });

  it('composes the lines as the export’s script does for its sample', () => {
    expect(ST_ROW_LINES.toDo(4, 16)).toBe('4 questions · 16 marks · no time limit');
    expectStDrawn(`todo: '4 questions · 16 marks · no time limit'`);
    expectStDrawn(`prog: '${ST_ROW_LINES.inProgress}'`);
    expectStDrawn(`ready: '${ST_ROW_LINES.released}'`);
    expect(plain(ST_ROW_LINES.waiting(SUBMITTED))).toBe(
      'Submitted 5 Nov 2026, 18:52 · your faculty marks written answers',
    );
    expectStDrawn(`'Submitted ' + this.nbd(a.submitted) + ' · your faculty marks written answers'`);
    expect(markedReleaseLine({ option: 'after-deadline', on: DEADLINE })).toBe(
      'Marked · released after the deadline',
    );
    expectStDrawn(`notrel: 'Marked · released after the deadline'`);
    expect(plain(markedReleaseLine({ option: 'on-date', on: DEADLINE }))).toBe(
      'Marked · released on 14 Nov 2026, 23:59',
    );
    expect(
      hubFactsLine({ questionCount: 4, totalMarks: 16, passMarkPercent: 50, attemptsAllowed: 2 }),
    ).toBe('4 questions · 16 marks · pass mark 50% · 2 attempts · no time limit');
    expectStDrawn(
      `'4 questions · ' + A.total + ' marks · pass mark ' + A.passpct + ' · ' + A.attempts + ' attempts · no time limit'`,
    );
    expect(
      hubFactsLine({ questionCount: 1, totalMarks: 1, passMarkPercent: null, attemptsAllowed: 1 }),
    ).toBe('1 question · 1 mark · 1 attempt · no time limit');
  });

  it('says where the assessment is when a tab has none', () => {
    expect(elsewhereWords(['To do'], 1)).toBe('Your assessment is under To do.');
    expectStDrawn(`todo: 'Your assessment is under To do.'`);
    expectStDrawn(`res: 'Your released result is under Results.'`);
    expect(elsewhereWords(['To do', 'Results'], 2)).toBe(
      'Your assessments are under To do and Results.',
    );
    expect(elsewhereWords(['Results'], 3)).toBe('Your assessments are under Results.');
  });

  it('the date block: the day, the time and how far away, counted on the session’s day', () => {
    const today = '2026-11-05T04:30:00.000Z'; // 5 Nov 2026, 10:00 (IST)
    expect(whenWords(DEADLINE, today)).toEqual({
      day: '14 Nov',
      time: '23:59 · in 9 days',
      soon: false,
    });
    expectStDrawn(`'in ' + diff + ' days'`);
    expect(whenWords(DEADLINE, '2026-11-13T04:30:00.000Z')).toEqual({
      day: '14 Nov',
      time: '23:59 · tomorrow',
      soon: true,
    });
    expect(whenWords(DEADLINE, '2026-11-14T04:30:00.000Z').time).toBe('23:59 · today');
    expect(whenWords(DEADLINE, '2026-11-15T04:30:00.000Z')).toEqual({
      day: '14 Nov',
      time: '23:59 · yesterday',
      soon: false,
    });
    expect(whenWords(DEADLINE, '2026-11-17T04:30:00.000Z').time).toBe('23:59 · 3 days ago');
    for (const words of ["'today'", "'tomorrow'", "'yesterday'", "' days ago'"])
      expectStDrawn(words);
    // A release is never drawn ivory; without a day to count from, the time alone.
    expect(whenWords(DEADLINE, '2026-11-13T04:30:00.000Z', false).soon).toBe(false);
    expect(whenWords(DEADLINE, null)).toEqual({ day: '14 Nov', time: '23:59', soon: false });
  });
});
