/**
 * The words of VE-01 Overview (B5-01) and VE-02 My experiments (B5-02) are the frozen boards’: each
 * drawn phrase is found verbatim in its board’s markup or script, the composed ones with the
 * boards’ own sample values or the script’s own pieces; the failed formula is B6-02’s; the undrawn
 * forms and rules are provisional entries of the state-copy register, each with its decision and no
 * decision id in its words.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import { STATE_COPY } from './state-copy';
import { STATE_COPY_VENDOR_HOME } from './state-copy-vendor-home';
import {
  attentionCountWords,
  CREATE_EXPERIMENT,
  draftSub,
  draftTitle,
  experimentCountWords,
  MY_EXPERIMENTS_WORDS,
  READ_ONLY_DRAFT,
  RETURNED,
  RETURNED_BY_WORDS,
  returnedSub,
  returnedTitle,
  reviseLabel,
  rowActionLabel,
  STATUS_FILTER_OPTIONS,
  STATUS_LINE,
  VENDOR_FAILED_WORDS,
  VENDOR_OVERVIEW_WORDS,
  WITH_WORDS,
} from './vendor-home';

/** A board’s text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B5_01 = words('B5-01-Vendor-Overview.dc.html');
const B5_02 = words('B5-02-My-Experiments.dc.html');
const B5_08 = words('B5-08-Flow-5-Continuity.dc.html');
const B6_02 = words('B6-02-Review-Queue-and-Reviewed.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const REASON =
  'The AR install notes don’t say which phones and tablets it runs on. Add the supported devices and the install steps.';

describe('VE-01 Overview (B5-01 f0 … f3; B5-08 f1)', () => {
  it.each([...strings(VENDOR_OVERVIEW_WORDS), CREATE_EXPERIMENT])('“%s” is on B5-01', (phrase) => {
    expect(B5_01).toContain(phrase);
  });

  it('the status line’s four labels, in B5-01’s order (`o.statusLine`)', () => {
    expect(STATUS_LINE.map(([, label]) => label)).toEqual([
      'Draft',
      'With Academic Reviewer',
      'With Content Manager',
      'Published',
    ]);
    expect(B5_01).toContain(
      "[['Draft', cnt('draft') + cnt('readonly')], ['With Academic Reviewer', cnt('with_rv')], ['With Content Manager', cnt('with_cm')], ['Published', cnt('published')]]",
    );
  });

  it('the attention rows are B5-01’s script pieces with the records’ values', () => {
    expect(returnedTitle('Forced Convection')).toBe('Returned: Forced Convection');
    expect(B5_01).toContain("title: 'Returned: ' + x.name");
    expect(returnedSub('academic-reviewer', '24 Aug 2026', REASON)).toBe(
      `Academic Reviewer · 24 Aug 2026 · “${REASON}”`,
    );
    expect(returnedSub('content-manager', '25 Aug 2026', 'Fix it.')).toBe(
      'Content Manager · 25 Aug 2026 · “Fix it.”',
    );
    expect(B5_01).toContain(
      "(x.by || 'Academic Reviewer') + ' · ' + x.when + ' · “' + x.reason + '”'",
    );
    for (const by of Object.values(RETURNED_BY_WORDS)) expect(B5_01).toContain(by);
    expect(reviseLabel('Forced Convection')).toBe('Revise “Forced Convection”');
    expect(B5_01).toContain("act: 'Revise “' + x.name + '”'");
    expect(draftTitle('Pin Fin Efficiency')).toBe('Draft to finish: Pin Fin Efficiency');
    expect(B5_01).toContain("title: 'Draft to finish: ' + x.name");
    expect(draftSub('25 Aug 2026')).toBe('Last saved 25 Aug 2026 · only you can see it');
    expect(B5_01).toContain("sub: 'Last saved ' + x.when + ' · only you can see it'");
    // The drawn frames’ own sample lines (B5-08 f1: the record Flow E creates).
    expect(B5_08).toContain('Conduction Through a Composite Wall');
  });

  it('the count: “2 items”, “1 item” (`o.attCount`)', () => {
    expect(attentionCountWords(2)).toBe('2 items');
    expect(attentionCountWords(3)).toBe('3 items');
    expect(attentionCountWords(1)).toBe('1 item');
    expect(B5_01).toContain("o.attCount = att.length + ' item' + (att.length === 1 ? '' : 's')");
  });
});

describe('VE-02 My experiments (B5-02 f0 … f5; B5-08 f3)', () => {
  it.each([
    ...strings(MY_EXPERIMENTS_WORDS),
    CREATE_EXPERIMENT,
    READ_ONLY_DRAFT,
    RETURNED,
    ...strings(WITH_WORDS),
  ])('“%s” is on B5-02', (phrase) => {
    expect(B5_02).toContain(phrase);
  });

  it('the Status filter’s options are B5-02’s, in its order', () => {
    expect(B5_02).toContain(
      `<option value="all">${MY_EXPERIMENTS_WORDS.allStatuses}</option>${STATUS_FILTER_OPTIONS.map(
        ([value, label]) =>
          `<option value="${
            {
              draft: 'draft',
              submitted: 'submitted',
              'with-academic-reviewer': 'with_rv',
              returned: 'returned',
              'with-content-manager': 'with_cm',
              published: 'published',
            }[value]
          }">${label}</option>`,
      ).join('')}`,
    );
  });

  it('the count and the row action’s name are B5-02’s script pieces', () => {
    expect(experimentCountWords(6, 6)).toBe('6 of 6 experiments');
    expect(experimentCountWords(1, 6)).toBe('1 of 6 experiments');
    expect(experimentCountWords(0, 1)).toBe('0 of 1 experiment');
    expect(B5_02).toContain(
      "o.count = shown.length + ' of ' + rows.length + ' experiment' + (rows.length === 1 ? '' : 's')",
    );
    expect(rowActionLabel(MY_EXPERIMENTS_WORDS.revise, 'Forced Convection')).toBe(
      'Revise Forced Convection',
    );
    expect(B5_02).toContain(
      "aria: ((x.st === 'returned' || x.st === 'returned_cm') ? 'Revise ' : x.st === 'draft' ? 'Edit draft ' : 'Open ') + x.name",
    );
  });

  it('the With words follow B5-02’s `withw` map', () => {
    expect(B5_02).toContain(
      `"withw": {"draft": "${WITH_WORDS.you}", "with_rv": "${WITH_WORDS.academicReviewer}", "returned": "${WITH_WORDS.you}", "submitted": "${WITH_WORDS.nobody}", "with_cm": "${WITH_WORDS.contentManager}"`,
    );
    expect(B5_02).toContain(`"readonly": "${READ_ONLY_DRAFT}"`);
  });
});

describe('the failed formula (B6-02, the Phase-5 boards’)', () => {
  it.each(strings(VENDOR_FAILED_WORDS))('“%s” is on B6-02', (phrase) => {
    expect(B6_02).toContain(phrase);
  });
});

describe('the state-copy entries of the vendor-home group', () => {
  it.each(Object.entries(STATE_COPY_VENDOR_HOME))(
    '%s is provisional, with its decision, and names no decision in its words',
    (id, entry) => {
      expect(id).toMatch(/^VE-0[12]\./);
      expect(entry.screen).toBe(id.slice(0, 5));
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
      if (entry.words !== null) {
        expect(entry.words).not.toMatch(/\b(?:OD|T|PC|DEV|VD|ATT|M|DV)-?\d/);
        // Undrawn words are not on the boards as they are (the drawn ones are in `vendor-home.ts`).
        expect(B5_01).not.toContain(entry.words);
        expect(B5_02).not.toContain(entry.words);
      } else {
        expect(entry.rule.length).toBeGreaterThan(20);
      }
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
    },
  );
});
