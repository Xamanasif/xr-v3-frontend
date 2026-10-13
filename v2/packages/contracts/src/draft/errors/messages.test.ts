/**
 * The copy catalogue against the frozen boards (ADR-0008 decision 6; Appendix C §5.4): every
 * drawn message, summary link and summary title is on its board verbatim; every key belongs to a
 * designed screen and is used; the import-report row rules cover what the domain reports; and
 * every message Appendix C §5.4 quotes is in the catalogue.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  V2,
  appendix,
  missingOnBoard,
  readSource,
  sourceFiles,
} from '../../test-support/sources.js';
import { SCREEN_PHASE } from '../ledger/screens.js';
import {
  DRAWN_MESSAGES,
  type DrawnMessage,
  MESSAGE_KEYS,
  QUESTION_IMPORT_ROW_KEYS,
  STUDENT_IMPORT_ROW_KEYS,
  SUMMARY_TITLES,
  UNDRAWN_RULES,
  fillPlaceholders,
  isDrawn,
  isMessageKey,
  messageFor,
  placeholdersOf,
  summaryTextFor,
  summaryTitleFor,
} from './messages.js';
import { REFUSALS } from './refusals.js';

const drawn = Object.entries(DRAWN_MESSAGES) as [string, DrawnMessage][];
const undrawn = Object.entries(UNDRAWN_RULES);

describe('drawn messages (verbatim on their boards)', () => {
  it('holds 124 field rules and 7 import-report row messages', () => {
    expect(drawn.filter(([key]) => !/\.row\./.test(key))).toHaveLength(124);
    expect(drawn.filter(([key]) => /\.row\./.test(key))).toHaveLength(7);
  });

  it.each(drawn)('%s is drawn on its board', (key, message) => {
    expect(key.startsWith(`${message.screen}.`)).toBe(true);
    expect(SCREEN_PHASE.has(message.screen), message.screen).toBe(true);
    expect(missingOnBoard(message.text, message.board)).toEqual([]);
    if (message.summaryText !== undefined) {
      expect(missingOnBoard(message.summaryText, message.board)).toEqual([]);
    }
  });

  it('draws every summary title on its board', () => {
    for (const [form, title] of Object.entries(SUMMARY_TITLES)) {
      expect(SCREEN_PHASE.has(form), form).toBe(true);
      expect(missingOnBoard(title.one, title.board), form).toEqual([]);
      if (title.many !== null) expect(missingOnBoard(title.many, title.board), form).toEqual([]);
    }
  });
});

describe('undrawn rules (no words invented)', () => {
  it('never shares a key with a drawn message, and records why no words exist', () => {
    for (const [key, rule] of undrawn) {
      expect(Object.hasOwn(DRAWN_MESSAGES, key), key).toBe(false);
      expect(rule.reason.length, key).toBeGreaterThan(20);
      expect(rule.source.length, key).toBeGreaterThan(5);
      if (key !== 'contract.invalid-input') {
        expect(key.startsWith(`${rule.screen}.`), key).toBe(true);
        expect(SCREEN_PHASE.has(rule.screen), key).toBe(true);
      }
    }
  });

  it('carries no words: messageFor answers null', () => {
    for (const [key] of undrawn) {
      expect(isMessageKey(key)).toBe(true);
      expect(messageFor(key as keyof typeof UNDRAWN_RULES)).toBeNull();
      expect(summaryTextFor(key as keyof typeof UNDRAWN_RULES)).toBeNull();
    }
  });
});

describe('every key is used', () => {
  const users = [
    ...sourceFiles('draft/ports'),
    join(V2, 'packages', 'contracts', 'src', 'draft', 'errors', 'domain-issues.ts'),
    join(V2, 'packages', 'contracts', 'src', 'draft', 'errors', 'field-errors.ts'),
  ]
    .map((file) => readSource(file))
    .join('\n');
  const rowKeys = new Set<string>([
    ...Object.values(STUDENT_IMPORT_ROW_KEYS),
    ...Object.values(QUESTION_IMPORT_ROW_KEYS),
  ]);

  it('by a schema, the domain-issue map or an import-report row — or is a form-level rule', () => {
    const unused = MESSAGE_KEYS.filter(
      (key) =>
        !users.includes(`'${key}'`) &&
        !rowKeys.has(key) &&
        !(isDrawn(key) && (DRAWN_MESSAGES[key] as DrawnMessage).formLevel),
    );
    expect(unused).toEqual([]);
  });

  it('keeps form-level rules out of every port input', () => {
    const formLevel = drawn.filter(([, message]) => message.formLevel).map(([key]) => key);
    expect(formLevel.length).toBeGreaterThan(0);
    for (const key of formLevel) expect(users.includes(`'${key}'`), key).toBe(false);
  });
});

describe('placeholders and summary titles', () => {
  it('fills values and refuses a missing one', () => {
    const text = DRAWN_MESSAGES['IA-13.name.taken'].text;
    expect(placeholdersOf(text)).toEqual(['name']);
    expect(fillPlaceholders(text, { name: 'Lab A' })).toBe('A group called “Lab A” already exists');
    expect(() => fillPlaceholders(text, {})).toThrow(/needs the value \{name\}/);
    expect(messageFor('IA-13.name.taken', { name: 'Lab A' })).toBe(
      'A group called “Lab A” already exists',
    );
  });

  it('uses the drawn summary-link words where the board draws them', () => {
    expect(summaryTextFor('ST-16.rating.required', { statement: '3' })).toBe(
      'Choose a rating for statement 3',
    );
    expect(messageFor('ST-16.rating.required', { statement: '3' })).toBe('Choose a rating');
  });

  it('counts the drawn title, and draws none for a form without one', () => {
    expect(summaryTitleFor('PU-08', 1)).toBe('There is 1 problem with this request');
    expect(summaryTitleFor('PU-08', 3)).toBe('There are 3 problems with this request');
    expect(summaryTitleFor('ST-16', 2)).toBe('2 ratings are missing');
    expect(summaryTitleFor('XS-07', 1)).toBe('One thing needs fixing');
    expect(summaryTitleFor('XS-07', 2)).toBeNull();
    expect(summaryTitleFor(null, 2)).toBeNull();
    expect(summaryTitleFor('PU-08', 0)).toBeNull();
  });
});

describe('import-report rows cover what the domain reports', () => {
  const domain = (path: string) =>
    readFileSync(join(V2, 'packages', 'domain', 'src', path), 'utf8');

  it('maps every student-import row rule of checkStudentImport', () => {
    const source = domain('people/decide.ts');
    const body = source.slice(
      source.indexOf('export function checkStudentImport'),
      source.indexOf('export interface CommitImportInput'),
    );
    const required = /for \(const field of \[([^\]]+)\]/
      .exec(body)![1]!
      .match(/'(\w+)'/g)!
      .map((field) => `${field.slice(1, -1)}:required`);
    const added = [...body.matchAll(/add\('(\w+)', '([\w-]+)'\)/g)].map(
      (match) => `${match[1]}:${match[2]}`,
    );
    expect(new Set(Object.keys(STUDENT_IMPORT_ROW_KEYS))).toEqual(new Set([...required, ...added]));
  });

  it('maps every question-import row problem of parseImportRow', () => {
    const source = domain('assessment/question-bank.ts');
    const body = source.slice(
      source.indexOf('export function parseImportRow'),
      source.indexOf('export function previewQuestionImport'),
    );
    const problems = [
      ...[...body.matchAll(/fail\('([\w-]+)'\)/g)].map((match) => match[1]!),
      ...[...body.matchAll(/problem: '([\w-]+)'/g)].map((match) => match[1]!),
    ];
    expect(new Set(Object.keys(QUESTION_IMPORT_ROW_KEYS))).toEqual(new Set(problems));
  });

  it('names a catalogue key for every row rule', () => {
    for (const key of [
      ...Object.values(STUDENT_IMPORT_ROW_KEYS),
      ...Object.values(QUESTION_IMPORT_ROW_KEYS),
    ]) {
      expect(isMessageKey(key), key).toBe(true);
    }
  });
});

describe('Appendix C §5.4 (the copy catalogue it quotes)', () => {
  const pattern = (template: string) =>
    new RegExp(
      `^${template.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\\?\{[a-zA-Z]+\\?\}/g, '.+?')}$`,
    );
  const candidates = [
    ...drawn.flatMap(([, message]) => [
      message.text,
      ...(message.summaryText ? [message.summaryText] : []),
    ]),
    ...Object.values(SUMMARY_TITLES).flatMap((title) => [
      title.one,
      ...(title.many ? [title.many] : []),
    ]),
    ...Object.values(REFUSALS).flatMap((entry) =>
      entry.lines.flatMap((line: { text: string; detail?: string }) => [
        line.text,
        ...(line.detail ? [line.detail, `${line.text} — ${line.detail}`] : []),
      ]),
    ),
  ].map(pattern);

  it('is held word for word, with values as placeholders', () => {
    const text = appendix('C');
    const section = text.slice(
      text.indexOf('### 5.4 Copy catalogue'),
      text.indexOf('## 6. NOT modelled'),
    );
    const quoted = [...section.matchAll(/"([^"]+)"/g)].map((match) =>
      match[1]!.replace(/<[^>]+>/g, 'X'),
    );
    expect(quoted.length).toBeGreaterThan(100);
    // B4-08's report draws "Error — blocks import" as a status chip (`xr-status--err`): a label for
    // the screen's copy table (Appendix F §6.7), not a field message.
    const labels = ['Error — blocks import'];
    const missing = quoted.filter(
      (words) => !labels.includes(words) && !candidates.some((candidate) => candidate.test(words)),
    );
    expect(missing).toEqual([]);
  });
});
