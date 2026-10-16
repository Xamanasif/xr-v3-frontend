/**
 * The words of RV-01 Overview, RV-02 Review queue and RV-05 Reviewed by me (B6-01, B6-02; B6-11
 * f13, f14; B6-12 f0) are the frozen boards’: each drawn phrase is found verbatim in its board’s
 * markup or script, the composed ones with the boards’ own sample values (or, where the board
 * composes them in its script, the script’s own pieces); the undrawn forms are provisional entries
 * of the state-copy register, each with its decision and no decision id in its words.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  approvedOnlyWords,
  attentionActionLabel,
  attentionCountWords,
  attentionSub,
  attentionTitle,
  decisionsCountWords,
  ITEM_TYPE_WORDS,
  oldestWords,
  openLabel,
  queueCountWords,
  REVIEW_QUEUE,
  REVIEWED_BY_ME,
  REVIEWER_OVERVIEW,
  reviewLabel,
  scopeWords,
  statusLineParts,
} from './reviewer-lists';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_REVIEWER_LISTS } from './state-copy-reviewer-lists';

/** A board’s text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B6_01 = words('B6-01-Reviewer-Overview.dc.html');
const B6_02 = words('B6-02-Review-Queue-and-Reviewed.dc.html');
const B6_11 = words('B6-11-Critical-States.dc.html');
const B6_12 = words('B6-12-Flow-5-Completion.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const RECHECK_REASON =
  'The second learning outcome mentions a Pitot tube, which this experiment does not use. Please check the outcomes.';

describe('RV-01 Overview (B6-01 f0 … f2)', () => {
  it.each(strings(REVIEWER_OVERVIEW))('“%s” is on B6-01', (phrase) => {
    expect(B6_01).toContain(phrase);
  });

  it('the composed words are B6-01’s, with its sample values or its script’s own pieces', () => {
    expect(B6_01).toContain(scopeWords(['ME ZG523', 'MEL ZG512', 'CHE ZG513']));
    expect(oldestWords('Flash Distillation')).toBe('Review the oldest — Flash Distillation');
    expect(B6_01).toContain("o.oldest = att.length ? 'Review the oldest — ' + qAll[0].name");
    // The status line (`rvLine`): the figures and their words.
    const parts = statusLineParts([
      { type: 'new' },
      { type: 'recheck' },
      { type: 'update' },
      { type: 'new' },
    ]);
    expect(parts).toEqual([
      { figure: '4 items', words: 'waiting' },
      { figure: '1', words: 're-check from the Content Manager' },
      { figure: '1', words: 'update' },
    ]);
    expect(B6_01).toContain(
      "o.rvLine = [[plural(qAll.length, 'item'), 'waiting'], [String(nRc), nRc === 1 ? 're-check from the Content Manager' : 're-checks from the Content Manager'], [String(nUp), nUp === 1 ? 'update' : 'updates']]",
    );
    expect(statusLineParts([]).map((part) => `${part.figure} ${part.words}`)).toEqual([
      '0 items waiting',
      '0 re-checks from the Content Manager',
      '0 updates',
    ]);
    expect(attentionCountWords(4)).toBe('4 items · oldest first');
    expect(attentionCountWords(1)).toBe('1 item · oldest first');
    expect(B6_01).toContain('{{ m.attCount }} · oldest first');
    // The rows (`att`): titles, lines and action names.
    expect(attentionTitle('new', 'Flash Distillation')).toBe('Review: Flash Distillation');
    expect(attentionTitle('recheck', 'Venturi Meter Calibration')).toBe(
      'Re-check: Venturi Meter Calibration',
    );
    expect(attentionTitle('update', 'Distillation Column')).toBe('Update: Distillation Column');
    for (const [type, item] of [
      [
        'new',
        {
          subLine: 'New submission · no learning outcomes yet',
          who: 'Meridian Virtual Labs',
          since: '24 Aug 2026',
          reason: null,
        },
      ],
      [
        'recheck',
        {
          subLine: 'Back from the Content Manager for a re-check',
          who: 'Meridian Virtual Labs',
          since: '25 Aug 2026',
          reason: RECHECK_REASON,
        },
      ],
      [
        'update',
        {
          subLine: 'Correction to the live version 1.2 → 1.3',
          who: 'Kavya Nair · Content Manager',
          since: '25 Aug 2026',
          reason: null,
        },
      ],
      [
        'new',
        {
          subLine: 'Resubmitted · revision 2',
          who: 'Northline Simulation Studio',
          since: '26 Aug 2026',
          reason: null,
        },
      ],
    ] as const) {
      // The board’s f0 frame text, rendered (`frame-index` sample rows).
      const line = attentionSub({ type, ...item });
      expect([
        'New submission · no learning outcomes yet · Meridian Virtual Labs · 24 Aug 2026',
        `Content Manager · 25 Aug 2026 · “${RECHECK_REASON}”`,
        'Correction to the live version 1.2 → 1.3 · from Kavya Nair · Content Manager · 25 Aug 2026',
        'Resubmitted · revision 2 · Northline Simulation Studio · 26 Aug 2026',
      ]).toContain(line);
    }
    expect(B6_01).toContain(
      "sub: x.type === 'update' ? x.sub + ' · from ' + x.who + ' · ' + x.since : x.type === 'recheck' ? 'Content Manager · ' + x.since + ' · “' + (x.reason || '') + '”' : x.sub + ' · ' + x.who + ' · ' + x.since",
    );
    expect(attentionActionLabel('new', 'Flash Distillation')).toBe('Review Flash Distillation');
    expect(attentionActionLabel('update', 'Distillation Column')).toBe(
      'Review update Distillation Column',
    );
    expect(B6_01).toContain("aria: (x.type === 'update' ? 'Review update ' : 'Review ') + x.name");
  });

  it('the undrawn forms are the register’s', () => {
    expect(
      attentionSub({
        type: 'recheck',
        subLine: '',
        who: 'Meridian Virtual Labs',
        since: '25 Aug 2026',
        reason: null,
      }),
    ).toBe('Content Manager · 25 Aug 2026');
    for (const id of [
      'RV-01.loading',
      'RV-01.failed',
      'RV-01.oldest',
      'RV-01.update-row',
      'RV-01.scope-all',
      'RV-01.recheck-reason',
    ] as const) {
      expect(STATE_COPY[id]).toMatchObject({ screen: 'RV-01', status: 'provisional' });
    }
    expect(B6_01).not.toContain('Loading your overview');
  });
});

describe('RV-02 Review queue (B6-02 f0, f2 … f5; B6-11 f13, f14; B6-12 f0)', () => {
  it.each(strings(REVIEW_QUEUE))('“%s” is on B6-02', (phrase) => {
    expect(B6_02).toContain(phrase);
  });

  it.each(strings(ITEM_TYPE_WORDS))('the type “%s” is on B6-02', (phrase) => {
    expect(B6_02).toContain(phrase);
  });

  it('B6-11 f13, f14 and B6-12 f0 draw the same words', () => {
    for (const phrase of [
      REVIEW_QUEUE.failedTitle,
      REVIEW_QUEUE.failedLine,
      REVIEW_QUEUE.emptyTitle,
      REVIEW_QUEUE.emptyLine,
      REVIEW_QUEUE.openReviewed,
    ]) {
      expect(B6_11).toContain(phrase);
    }
    for (const phrase of [REVIEW_QUEUE.lead, REVIEW_QUEUE.searchPlaceholder, REVIEW_QUEUE.review]) {
      expect(B6_12).toContain(phrase);
    }
  });

  it('the composed words are B6-02’s script’s', () => {
    expect(queueCountWords(4, 4)).toBe('4 of 4 items · oldest first');
    expect(queueCountWords(0, 1)).toBe('0 of 1 item · oldest first');
    expect(B6_02).toContain(
      "o.qCount = qShown.length + ' of ' + plural(qAll.length, 'item') + ' · oldest first'",
    );
    expect(reviewLabel('Flash Distillation')).toBe('Review Flash Distillation');
    expect(B6_02).toContain("aria: 'Review ' + x.name");
    expect(B6_02).toContain(
      "const TW = { new: 'New submission', update: 'Update', recheck: 'Re-check' }",
    );
  });

  it('the undrawn rules are the register’s', () => {
    for (const id of ['RV-02.filters', 'RV-02.update-row', 'RV-02.no-course-code'] as const) {
      expect(STATE_COPY[id]).toMatchObject({ screen: 'RV-02', status: 'provisional', words: null });
    }
  });
});

describe('RV-05 Reviewed by me (B6-02 f1)', () => {
  it.each(strings(REVIEWED_BY_ME))('“%s” is on B6-02', (phrase) => {
    expect(B6_02).toContain(phrase);
  });

  it('the composed words are B6-02’s script’s', () => {
    expect(decisionsCountWords(9, 9)).toBe('9 of 9 decisions');
    expect(decisionsCountWords(1, 1)).toBe('1 of 1 decision');
    expect(B6_02).toContain(
      "o.rbCount = rbShown.length + ' of ' + plural(rbAll.length, 'decision')",
    );
    expect(openLabel('Forced Convection')).toBe('Open Forced Convection');
    expect(B6_02).toContain("aria: 'Open ' + x.name");
  });

  it('the undrawn forms are the register’s, fragments of the drawn decisions', () => {
    expect(approvedOnlyWords(false)).toBe('Approved');
    expect(approvedOnlyWords(true)).toBe('Update approved');
    expect(B6_02).toContain('Approved — with the Content Manager');
    expect(B6_02).toContain('Update approved — released');
    for (const id of [
      'RV-05.loading',
      'RV-05.failed',
      'RV-05.approved',
      'RV-05.update-approved',
      'RV-05.update-row',
      'RV-05.type',
    ] as const) {
      expect(STATE_COPY[id]).toMatchObject({ screen: 'RV-05', status: 'provisional' });
    }
  });
});

describe('the register entries', () => {
  it.each(Object.entries(STATE_COPY_REVIEWER_LISTS))(
    '%s names no decision id in its words',
    (_, entry) => {
      if (entry.words !== null) expect(entry.words).not.toMatch(/\b[A-Z]{1,3}-[A-Z0-9]+-?\d*\b/);
      expect(entry.decisions.length).toBeGreaterThan(0);
    },
  );
});
