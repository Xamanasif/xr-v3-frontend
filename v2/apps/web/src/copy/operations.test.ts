/**
 * The words of SA-18 Device transfers and SA-19 Device transfer decision are the frozen boards':
 * B3-11 (and its re-use on B7-09), B7-10 f14 for a transfer that has not reached BITS, and B7-03
 * for SA-07's device-transfer row. Each fixed phrase is found verbatim in the boards' markup or
 * script; the composed ones are checked against the boards' own sample record (DTR-0018) and the
 * script expressions that compose them. Undrawn words are provisional register entries.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import { TRANSFER_ACTIONS, transferWords, wordsOf } from './flow-state-words';
import {
  approvedFlash,
  approvedOnWords,
  approvingMovesWords,
  ATTENTION_OPERATIONS,
  attentionTransfer,
  confirmEffectParts,
  confirmTitle,
  DECISION_PAGE,
  decisionTitle,
  formatForWords,
  forwardedByWords,
  forwardedCell,
  HISTORY_WORDS,
  NOT_YET_WITH_BITS,
  OPERATIONS_PAGE,
  reviewLabel,
  transferSubLine,
  TRANSFERS_LIST,
} from './operations';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_OPERATIONS } from './state-copy-operations';

/** A board's text with tags removed and entities read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  const text = raw
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
  return `${text}\n${raw}`;
}

const B3_11 = words('B3-11-SA-Device-Transfers.dc.html');
const B7_09 = words('B7-09-Operations.dc.html');
const B7_10 = words('B7-10-Critical-States.dc.html');
const B7_03 = words('B7-03-Institution-Detail.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('SA-18 Operations › Device transfers (B3-11 f0, f2, f3)', () => {
  it.each([...strings(OPERATIONS_PAGE), ...strings(TRANSFERS_LIST)])(
    '“%s” is on B3-11 and on its B7-09 re-use',
    (phrase) => {
      expect(B3_11).toContain(phrase);
      expect(B7_09).toContain(phrase);
    },
  );

  it('the composed cells follow the board’s rows and script', () => {
    expect(B3_11).toContain(`aria-label="${reviewLabel('DTR-0018')}"`);
    expect(B3_11).toContain(transferSubLine('Rahul Verma', 'vr'));
    expect(B3_11).toContain(transferSubLine('Imran Shaikh', 'vr'));
    // `fwdText: D.t.fwd + ' · ' + D.ia` with D.t.fwd "23 Oct 2026, 10:00" and D.ia "Meera Iyer".
    expect(forwardedCell('23 Oct 2026, 10:00', 'Meera Iyer')).toBe(
      '23 Oct 2026, 10:00 · Meera Iyer',
    );
    expect(B3_11).toContain("D.t.fwd + ' · ' + D.ia");
    expect(B3_11).toContain(forwardedCell('14 Oct 2026', 'Meera Iyer'));
  });

  it('the status words are the shared Super Admin words (Appendix D §5.4)', () => {
    for (const state of ['with-institute-admin', 'forwarded', 'approved'] as const) {
      expect(B3_11).toContain(wordsOf(transferWords(state, 'super_admin'))!);
    }
  });
});

describe('SA-19 Device transfer decision (B3-11 f1, f4, f5; B7-10 f14)', () => {
  it.each([...strings(DECISION_PAGE), TRANSFER_ACTIONS.approve])('“%s” is on B3-11', (phrase) => {
    expect(B3_11).toContain(phrase);
  });

  it('the composed sentences read as the board draws DTR-0018', () => {
    for (const phrase of [
      decisionTitle('vr', 'Rahul Verma'),
      `VR${formatForWords('Shell-and-Tube Heat Exchanger')}`,
      forwardedByWords('Meera Iyer', 'Institute Admin'),
      approvingMovesWords('Rahul Verma', 'vr'),
      approvedOnWords('24 Oct 2026, 12:30', 'Arjun Mehta'),
      confirmTitle('DTR-0018'),
      approvedFlash('Rahul Verma', 'Meera Iyer'),
    ]) {
      expect(B3_11).toContain(phrase);
    }
    const effect = confirmEffectParts('Rahul Verma', 'vr', 'Meera Iyer');
    expect(B3_11).toContain(`${effect.before.trimEnd()} {{ d.devNew }}${effect.after}`);
  });

  it('the history lines follow the board’s script (`hist`)', () => {
    expect(B3_11).toContain(`what: '${HISTORY_WORDS.approved}'`);
    expect(B3_11).toContain(`'${HISTORY_WORDS.approvedNote('')}' + devNew`);
    expect(B3_11).toContain(`'${HISTORY_WORDS.forwarded('')}' + D.ia`);
    expect(B3_11).toContain(`'${HISTORY_WORDS.requested('')}' + D.stu`);
    expect(HISTORY_WORDS.requestedNote('A', 'B')).toBe('From A to B');
    expect(B3_11).toContain("'From ' + D.devOld + ' to ' + devNew");
  });

  it('a transfer that has not reached BITS reads as B3-11 `beforeSA` and B7-10 f14', () => {
    for (const phrase of [
      NOT_YET_WITH_BITS.back,
      NOT_YET_WITH_BITS.title,
      NOT_YET_WITH_BITS.heading('DTR-0018'),
      NOT_YET_WITH_BITS.line,
    ]) {
      expect(B3_11).toContain(phrase);
      expect(B7_10).toContain(phrase);
    }
  });
});

describe('SA-07 “Needs attention” — the device-transfer row (B7-03 `att`)', () => {
  it('reads as B7-03 draws DTR-0018 and opens Operations', () => {
    expect(B7_03).toContain(
      `["${attentionTransfer('DTR-0018', '23 Oct 2026')}", "${ATTENTION_OPERATIONS}", "sops"]`,
    );
  });
});

describe('the operations state-copy entries', () => {
  it('are in the one register, each for SA-18 or SA-19', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_OPERATIONS)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(['SA-18', 'SA-19']).toContain(entry.screen);
    }
  });

  it('no visible words carry a decision id (P1-14)', () => {
    for (const phrase of [
      ...strings(OPERATIONS_PAGE),
      ...strings(TRANSFERS_LIST),
      ...strings(DECISION_PAGE),
      ...Object.values(STATE_COPY_OPERATIONS).flatMap((entry) =>
        entry.words === null ? [] : [entry.words],
      ),
    ]) {
      expect(phrase).not.toMatch(/\b[A-Z]{1,3}-\d{2}\b/);
    }
  });
});
