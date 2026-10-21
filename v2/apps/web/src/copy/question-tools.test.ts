/**
 * The words of FA-16 Draft questions with assistance and FA-17 Import questions, and what FA-14's
 * Drafts to review tab shows of them, are the V3 export's (FA-v1 `Main.dc.html`): each drawn
 * phrase is found verbatim in its markup or script, each composed one takes the script's formula
 * with the records' values; what the export does not word is a provisional entry of the
 * state-copy register. The type words stay the product's "Multiple choice" (lead decision 1), and
 * no phrase names a question or a draft by its internal reference.
 */
import type { ValidationFailed } from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

import { board, faExport } from '@/test-support/boards';

import {
  addDraftLabel,
  ASSESSMENT_QUESTIONS_EMPTY_LINE,
  BANK_TOOLS,
  discardDraftLabel,
  DRAFT_QUESTIONS,
  draftsCountWords,
  draftSummaryTitle,
  draftsToReviewWords,
  IMPORT_QUESTIONS,
  importConfirmLine,
  importedLine,
  importFileRefusalWords,
  importIntoBankLine,
  importQuestionsButton,
  importQuietLine,
  importStepWords,
  inBankMetaWords,
  labBriefLine,
  leftToReview,
  noExplanationWords,
  parseProblem,
  QUESTION_TEMPLATE_DOWNLOAD,
  QUESTION_TEMPLATE_GUIDE,
  questionsWords,
  reviewDraftLabel,
  rowProblemWords,
} from './question-tools';
import { STATE_COPY, stateWords } from './state-copy';
import { STATE_COPY_QUESTION_TOOLS } from './state-copy-question-tools';

/** The export's text with tags removed and `&amp;` read, then its raw markup and script. */
function words(raw: string): string {
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const MAIN = words(faExport('Main.dc.html'));
const B4_05 = words(board('B4-05-Assessment-Summary-and-Questions.dc.html'));

/** An internal reference no Faculty page shows (the owner's identifier rule, 21 Oct 2026). */
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

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

describe('FA-16 Draft questions with assistance', () => {
  it.each(strings(DRAFT_QUESTIONS))('“%s” is in the export', (phrase) => {
    expect(MAIN).toContain(phrase);
  });

  it('the composed words follow the export’s formulas, with the records’ values', () => {
    expect(leftToReview(3)).toBe('3 drafts left to review');
    expect(leftToReview(1)).toBe('1 draft left to review');
    expect(leftToReview(0)).toBe('All reviewed');
    expect(MAIN).toContain(`this.plural(left, 'draft') + ' left to review' : 'All reviewed'`);
    expect(draftsToReviewWords(3)).toBe('3 drafts to review');
    expect(MAIN).toContain(`this.plural(dcards.length, 'draft') + ' to review'`);
    expect(draftsCountWords(3)).toBe('3 drafts');
    expect(MAIN).toContain('>3 drafts</label>');
    expect(MAIN).toContain('>5 drafts</label>');
    const text = 'What is the log mean temperature difference (LMTD) used for?';
    expect(reviewDraftLabel(text)).toBe(`Review and edit draft: ${text}`);
    expect(addDraftLabel(text)).toBe(`Add to bank: ${text}`);
    expect(discardDraftLabel(text)).toBe(`Discard draft: ${text}`);
    expect(MAIN).toContain(`revAria: 'Review and edit draft: ' + x.q.t`);
    expect(MAIN).toContain(`addAria: 'Add to bank: ' + x.q.t`);
    expect(MAIN).toContain(`disAria: 'Discard draft: ' + x.q.t`);
    expect(inBankMetaWords('Multiple choice')).toBe('In your question bank · Multiple choice');
    expect(MAIN).toContain(`(added ? 'In your question bank · ' : '')`);
    expect(labBriefLine('Lab brief — Shell-and-Tube Heat Exchanger', 'PDF document')).toBe(
      'Lab brief — Shell-and-Tube Heat Exchanger · PDF document',
    );
    expect(MAIN).toContain(`' · PDF document'`);
    expect(labBriefLine('Lab brief — Shell-and-Tube Heat Exchanger', null)).toBe(
      'Lab brief — Shell-and-Tube Heat Exchanger',
    );
    expect(draftSummaryTitle(3)).toBe('Check these choices');
    expect(draftSummaryTitle(1)).toBe('Check these choices');
    expect(MAIN).toContain('Check these choices');
  });

  it('the export’s own stand-in sentence names its preview: the product keeps the register’s', () => {
    expect(MAIN).toContain('Sample assistance in this preview.');
    expect(strings(DRAFT_QUESTIONS).join(' ')).not.toMatch(/this preview/);
    expect(stateWords('FA-16.sample-stand-in')).toMatch(/^Sample drafts: no drafting service/);
  });
});

describe('FA-14 drafts tab and FA-09', () => {
  it.each(strings(BANK_TOOLS))('“%s” is in the export', (phrase) => {
    expect(MAIN).toContain(phrase);
  });

  it('FA-09’s empty line is B4-05 f1’s', () => {
    expect(B4_05).toContain(ASSESSMENT_QUESTIONS_EMPTY_LINE);
  });
});

describe('FA-17 Import questions', () => {
  it.each(strings(IMPORT_QUESTIONS))('“%s” is in the export', (phrase) => {
    expect(MAIN).toContain(phrase);
  });

  it('the template’s columns are the export’s, with the product’s “multiple choice”; the download is the product’s', () => {
    for (const { column, what } of QUESTION_TEMPLATE_GUIDE) {
      expect(MAIN).toContain(`<dt>${column}</dt>`);
      if (column !== 'type') expect(MAIN).toContain(`<dd>${what}</dd>`);
    }
    // The export writes "single choice"; the domain's CSV parser reads "multiple choice" (lead
    // decision 1), so the template says what the parser accepts.
    expect(MAIN).toContain('<dd>single choice, true or false, or written answer</dd>');
    expect(QUESTION_TEMPLATE_GUIDE[0]!.what).toBe(
      'multiple choice, true or false, or written answer',
    );
    expect(decodeURIComponent(QUESTION_TEMPLATE_DOWNLOAD.href.split(',').slice(1).join(','))).toBe(
      'type,question,option_a,option_b,option_c,option_d,correct,marks,explanation,marking_guidance\n',
    );
    expect(MAIN).toContain(
      'data:text/csv;charset=utf-8,type%2Cquestion%2Coption_a%2Coption_b%2Coption_c%2Coption_d%2Ccorrect%2Cmarks%2Cexplanation%2Cmarking_guidance',
    );
    expect(importQuietLine('Shell-and-Tube Heat Exchanger')).toBe(
      'Questions go into your bank for Shell-and-Tube Heat Exchanger. They aren’t added to any assessment.',
    );
    expect(MAIN).toContain(
      `'Questions go into your bank for ' + e.t + '. They aren’t added to any assessment.'`,
    );
  });

  it('the steps, the confirmation and the result follow `vmImport`, with the records’ values', () => {
    expect(importStepWords(2)).toBe('Step 2 of 3');
    expect(MAIN).toContain(`'Step ' + m.step + ' of 3'`);
    expect(questionsWords(8)).toBe('8 questions');
    expect(questionsWords(1)).toBe('1 question');
    expect(importConfirmLine(8, 'post-lab-questions.csv')).toBe(
      '8 questions will be added to your bank from post-lab-questions.csv.',
    );
    expect(MAIN).toContain(
      `this.plural(rep.ok, 'question') + ' will be added to your bank from ' + m.file + '.'`,
    );
    expect(importIntoBankLine('Shell-and-Tube Heat Exchanger')).toBe(
      'They go into your question bank for Shell-and-Tube Heat Exchanger.',
    );
    expect(MAIN).toContain('They go into your question bank for {{ IM.expT }}.');
    expect(noExplanationWords(1)).toBe('One has no explanation — students would see none for it.');
    expect(MAIN).toContain(noExplanationWords(1)!);
    expect(noExplanationWords(0)).toBeNull();
    expect(noExplanationWords(3)).toBe('3 have no explanation — students would see none for them.');
    expect(MAIN).toContain(
      `rep.warnings + ' have no explanation — students would see none for them.'`,
    );
    expect(importQuestionsButton(8)).toBe('Import 8 questions');
    expect(MAIN).toContain(`'Import ' + this.plural(rep.ok, 'question')`);
    expect(importedLine(8)).toBe(
      '8 questions were added to your bank. None is in an assessment yet.',
    );
    expect(importedLine(1)).toBe(
      '1 question was added to your bank. None is in an assessment yet.',
    );
    expect(MAIN).toContain(
      `this.plural(ids.length, 'question') + (ids.length === 1 ? ' was' : ' were') + ' added to your bank. None is in an assessment yet.'`,
    );
    for (const count of [1, 8]) expect(importedLine(count)).not.toMatch(REFERENCE);
  });

  it('“What to fix”: the domain catalogue’s words with the row’s own values', () => {
    expect(parseProblem(problem('correct', { value: 'E', options: 'A–D' }))).toEqual({
      rule: 'correct',
      params: { value: 'E', options: 'A–D' },
    });
    expect(parseProblem('explanation-empty')).toEqual({ rule: 'explanation-empty', params: {} });
    expect(rowProblemWords(problem('correct', { value: 'E', options: 'A–D' }))).toBe(
      'correct is “E”, but the question has options A–D only.',
    );
    expect(MAIN).toContain(`'”, but the question has options A–D only.'`);
    expect(rowProblemWords(problem('explanation-empty'))).toBe(
      'explanation is empty. The question imports without one.',
    );
    expect(MAIN).toContain('explanation is empty. The question imports without one.');
    // The domain's words name the type the parser reads ("multiple choice (one correct)").
    expect(rowProblemWords(problem('type', { value: 'multi-select' }))).toBe(
      'type “multi-select” isn’t available. Use multiple choice (one correct), true or false, or written answer.',
    );
  });

  it('the rules the export states but does not word are the register’s; an unknown one too', () => {
    expect(rowProblemWords('question')).toBe(stateWords('FA-17.row.question'));
    expect(rowProblemWords('marks')).toBe(stateWords('FA-17.row.marks'));
    expect(rowProblemWords('options')).toBe(stateWords('FA-17.row.options'));
    expect(rowProblemWords('something-new')).toBe(stateWords('FA-17.row.other'));
    // A drawn rule reported without the value its words name: the general line, never a crash.
    expect(rowProblemWords('type')).toBe(stateWords('FA-17.row.other'));
  });

  it('the file refusals: the service’s “Choose a CSV file first”, else the register’s', () => {
    const refusal = (field: string, key: string, message: string | null) =>
      ({
        kind: 'validation-failed',
        fieldErrors: [{ field, key, message, params: {} }],
      }) as unknown as ValidationFailed;
    expect(
      importFileRefusalWords(refusal('fileName', 'FA-17.file.required', 'Choose a CSV file first')),
    ).toBe('Choose a CSV file first');
    expect(MAIN).toContain('Choose a CSV file first');
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
  it('are provisional entries of the one register, and their words name no decision or reference', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_QUESTION_TOOLS)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(['FA-14', 'FA-16', 'FA-17']).toContain(entry.screen);
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
      if (entry.words) {
        expect(entry.words).not.toMatch(/\b(?:OD|T|PC|DEV|VD|ND|P1|OD-B4)-\d/);
        expect(entry.words).not.toMatch(/\bSample:|\bemail\b|sample accounts?/i);
        expect(entry.words).not.toMatch(REFERENCE);
      }
    }
  });

  it('no phrase names a question or a draft by its reference', () => {
    for (const phrase of [
      ...strings(DRAFT_QUESTIONS),
      ...strings(BANK_TOOLS),
      ...strings(IMPORT_QUESTIONS),
    ]) {
      expect(phrase).not.toMatch(REFERENCE);
    }
  });
});
