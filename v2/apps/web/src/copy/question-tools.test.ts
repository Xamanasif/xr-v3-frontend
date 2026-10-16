/**
 * The words of FA-16 Draft questions with assistance and FA-17 Import questions (B4-08), and what
 * FA-14 (B4-07) and FA-09 (B4-05) show of them, are the frozen boards': each drawn phrase is found
 * verbatim in its board's markup or script, the composed ones with the boards' own sample values;
 * what no board words is a provisional entry of the state-copy register.
 */
import type { ValidationFailed } from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  addDraftLabel,
  addedToBank,
  ASSESSMENT_QUESTIONS_EMPTY_LINE,
  BANK_TOOLS,
  discardDraftLabel,
  DRAFT_QUESTIONS,
  draftSummaryTitle,
  errorCountWords,
  IMPORT_CONFIRM_LINE,
  IMPORT_QUESTIONS,
  importedLine,
  importFileRefusalWords,
  importQuestionsButton,
  importQuietLine,
  importStepWords,
  labBriefLine,
  leftToReview,
  noExplanationWords,
  parseProblem,
  QUESTION_TEMPLATE_DOWNLOAD,
  QUESTION_TEMPLATE_LINE,
  questionsWords,
  readyCountWords,
  rowProblemWords,
  rowsWords,
  warningCountWords,
} from './question-tools';
import { STATE_COPY, stateWords } from './state-copy';
import { STATE_COPY_QUESTION_TOOLS } from './state-copy-question-tools';

/** A board's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B4_08 = words('B4-08-Draft-with-Assistance-and-Import.dc.html');
const B4_07 = words('B4-07-Question-Bank-and-Editor.dc.html');
const B4_05 = words('B4-05-Assessment-Summary-and-Questions.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

/** The problem string the service reports (`importProblem`: the rule, then URL parameters). */
function problem(rule: string, params: Readonly<Record<string, string>> = {}): string {
  const query = new URLSearchParams(params).toString();
  return query ? `${rule}?${query}` : rule;
}

describe('FA-16 Draft questions with assistance (B4-08 f0 … f4)', () => {
  it.each(strings(DRAFT_QUESTIONS))('“%s” is on B4-08', (phrase) => {
    expect(B4_08).toContain(phrase);
  });

  it('the composed words follow the board’s formulas, with its sample values', () => {
    expect(leftToReview(3)).toBe('3 left to review');
    expect(B4_08).toContain(`' left to review'`);
    expect(addedToBank('Q-0107')).toBe('Added to your question bank as Q-0107.');
    expect(B4_08).toContain(`'Added to your question bank as Q-010' + (7 + s.added.length) + '.'`);
    const text = 'What is the log mean temperature difference (LMTD) used for?';
    expect(addDraftLabel(text)).toBe(`Add draft “${text}” to your question bank`);
    expect(B4_08).toContain(`'Add draft “' + d.t + '” to your question bank'`);
    expect(discardDraftLabel(text)).toBe(`Discard draft “${text}”`);
    expect(B4_08).toContain(`'Discard draft “' + d.t + '”'`);
    expect(B4_08).toContain(
      labBriefLine('Lab brief — Shell-and-Tube Heat Exchanger', 'PDF document'),
    );
    expect(labBriefLine('Lab brief — Shell-and-Tube Heat Exchanger', null)).toBe(
      'Lab brief — Shell-and-Tube Heat Exchanger',
    );
    expect(draftSummaryTitle(3)).toBe('Check these choices');
    expect(draftSummaryTitle(1)).toBe('Check these choices');
    expect(B4_08).toContain('Check these choices');
  });
});

describe('FA-14 drafting and importing (B4-07 f0, f1, f7) and FA-09 (B4-05 f1)', () => {
  it.each(strings(BANK_TOOLS).filter((phrase) => phrase !== BANK_TOOLS.discarded))(
    '“%s” is on B4-07',
    (phrase) => {
      expect(B4_07).toContain(phrase);
    },
  );

  it('the bank’s discard message is B4-07’s; FA-16’s is B4-08’s', () => {
    expect(B4_07).toContain(BANK_TOOLS.discarded);
    expect(B4_08).toContain(DRAFT_QUESTIONS.discarded);
    expect(B4_07).toContain(`'Added to your question bank as Q-010'`);
  });

  it('FA-09’s empty line is B4-05 f1’s', () => {
    expect(B4_05).toContain(ASSESSMENT_QUESTIONS_EMPTY_LINE);
  });
});

describe('FA-17 Import questions (B4-08 f5 … f9)', () => {
  it.each(strings(IMPORT_QUESTIONS))('“%s” is on B4-08', (phrase) => {
    expect(B4_08).toContain(phrase);
  });

  it('the template line, its columns and its download are the board’s', () => {
    const line = QUESTION_TEMPLATE_LINE.map((run) =>
      typeof run === 'string' ? run : `<strong>${run.column}</strong>`,
    ).join('');
    expect(B4_08).toContain(line);
    expect(B4_08).toContain(
      `href="${QUESTION_TEMPLATE_DOWNLOAD.href}" download="${QUESTION_TEMPLATE_DOWNLOAD.fileName}"`,
    );
    expect(decodeURIComponent(QUESTION_TEMPLATE_DOWNLOAD.href.split(',').slice(1).join(','))).toBe(
      'type,question,option_a,option_b,option_c,option_d,correct,marks,explanation,marking_guidance\n',
    );
    expect(B4_08).toContain(importQuietLine('Shell-and-Tube Heat Exchanger'));
  });

  it('the counts, the confirmation and the result follow `imView`, with its sample values', () => {
    expect(importStepWords(2)).toBe('Step 2 of 3');
    expect(B4_08).toContain(`'Step ' + s.step + ' of 3'`);
    expect([rowsWords(8), readyCountWords(6), errorCountWords(2), warningCountWords(1)]).toEqual([
      '8 rows',
      '6 ready',
      '2 with errors',
      '1 with a warning',
    ]);
    for (const formula of [
      `rep.total + ' rows'`,
      `rep.ok + ' ready'`,
      `rep.errors + ' with errors'`,
      `rep.warnings + ' with a warning'`,
    ]) {
      expect(B4_08).toContain(formula);
    }
    // One of each: the register's (`FA-17.count-one`).
    expect([rowsWords(1), errorCountWords(1), warningCountWords(2)]).toEqual([
      '1 row',
      '1 with an error',
      '2 with warnings',
    ]);
    expect(questionsWords(8)).toBe('8 questions');
    expect(B4_08).toContain(
      `{{ i.ok }} questions</strong>${IMPORT_CONFIRM_LINE.middle}<strong style="color:#12173F">{{ i.file }}</strong>${IMPORT_CONFIRM_LINE.end}`,
    );
    expect(B4_08).toContain(noExplanationWords(1)!);
    expect(noExplanationWords(0)).toBeNull();
    expect(noExplanationWords(3)).toBe('3 have no explanation — students would see none for them.');
    expect(importQuestionsButton(8)).toBe('Import 8 questions');
    expect(B4_08).toContain(`'Import ' + rep.ok + ' questions'`);
    const ids = ['Q-0110', 'Q-0111', 'Q-0112', 'Q-0113', 'Q-0114', 'Q-0115', 'Q-0116', 'Q-0117'];
    expect(B4_08).toContain(importedLine(ids).replace('8 questions', '{{ i.ok }} questions'));
    expect(importedLine(['Q-0110'])).toBe(
      '1 question was added to your bank as Q-0110. It isn’t in an assessment yet.',
    );
  });

  it('“What to fix”: the catalogue’s drawn words with the row’s own values (f6)', () => {
    expect(parseProblem(problem('correct', { value: 'E', options: 'A–D' }))).toEqual({
      rule: 'correct',
      params: { value: 'E', options: 'A–D' },
    });
    expect(parseProblem('explanation-empty')).toEqual({ rule: 'explanation-empty', params: {} });
    const drawn = [
      rowProblemWords(problem('correct', { value: 'E', options: 'A–D' })),
      rowProblemWords(problem('type', { value: 'multi-select' })),
      rowProblemWords(problem('explanation-empty')),
    ];
    expect(drawn).toEqual([
      'correct is “E”, but the question has options A–D only.',
      'type “multi-select” isn’t available. Use multiple choice (one correct), true or false, or written answer.',
      'explanation is empty. The question imports without one.',
    ]);
    for (const phrase of drawn) expect(B4_08).toContain(phrase);
  });

  it('the rules B4-08 states but does not word are the register’s; an unknown one too', () => {
    expect(rowProblemWords('question')).toBe(stateWords('FA-17.row.question'));
    expect(rowProblemWords('marks')).toBe(stateWords('FA-17.row.marks'));
    expect(rowProblemWords('options')).toBe(stateWords('FA-17.row.options'));
    expect(rowProblemWords('something-new')).toBe(stateWords('FA-17.row.other'));
    // A drawn rule reported without the value its words name: the general line, never a crash.
    expect(rowProblemWords('type')).toBe(stateWords('FA-17.row.other'));
  });

  it('the file refusals: the drawn “Choose a CSV file first”, else the register’s', () => {
    const refusal = (field: string, key: string, message: string | null) =>
      ({
        kind: 'validation-failed',
        fieldErrors: [{ field, key, message, params: {} }],
      }) as unknown as ValidationFailed;
    expect(
      importFileRefusalWords(refusal('fileName', 'FA-17.file.required', 'Choose a CSV file first')),
    ).toBe('Choose a CSV file first');
    expect(B4_08).toContain('Choose a CSV file first');
    expect(importFileRefusalWords(refusal('file', 'FA-17.file.columns', null))).toBe(
      stateWords('FA-17.file.columns'),
    );
    expect(importFileRefusalWords(refusal('file', 'FA-17.file.no-rows', null))).toBe(
      stateWords('FA-17.file.no-rows'),
    );
    expect(importFileRefusalWords(refusal('other', 'x', 'y'))).toBeNull();
  });
});

describe('the register entries of FA-16, FA-17 and FA-14’s Drafts tab', () => {
  it('are provisional entries of the one register, and their words name no decision', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_QUESTION_TOOLS)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(['FA-14', 'FA-16', 'FA-17']).toContain(entry.screen);
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
      if (entry.words) {
        expect(entry.words).not.toMatch(/\b(?:OD|T|PC|DEV|VD|ND|P1|OD-B4)-\d/);
        expect(entry.words).not.toMatch(/\bSample:|\bemail\b|sample accounts?/i);
      }
    }
  });

  it('the stand-in is named in plain words: sample drafts, no drafting service', () => {
    expect(stateWords('FA-16.sample-stand-in')).toMatch(/^Sample drafts: no drafting service/);
  });
});
