/**
 * The refusal registry against its sources: one entry per `@xr/domain` RefusalCode (the compile-
 * time `vocabulary` check ties the list to the union); the Appendix C §3.0 / M15 codes and exactly
 * six WP-0.9 additions, each provisional (register PC-01); every drawn line verbatim on its board;
 * every code reachable from at least one method's union.
 */
import { describe, expect, it } from 'vitest';

import { appendix, missingOnBoard } from '../../test-support/sources.js';
import { ledgerRows } from '../ledger/index.js';
import { PROVISIONAL_REGISTER } from '../provisional.js';
import {
  PROVISIONAL_REFUSAL_CODES,
  REFUSALS,
  REFUSAL_CODES,
  type RefusalEntry,
} from './refusals.js';

const entries = Object.entries(REFUSALS) as [string, RefusalEntry][];

/** The codes Appendix C names: §3.0 `RefusalCode` and M15 `OpenRefusal`. */
function appendixCCodes(): ReadonlySet<string> {
  const text = appendix('C');
  const block = (start: string) => {
    const from = text.indexOf(start);
    return text.slice(from, text.indexOf(';', from));
  };
  const codes = (source: string) =>
    [...source.matchAll(/'([a-z][a-z-]+)'/g)].map((match) => match[1]!);
  return new Set([
    ...codes(block('export type OpenRefusal =')),
    ...codes(block('export type RefusalCode =')),
  ]);
}

describe('the refusal registry', () => {
  it('has one entry per code, in the vocabulary’s order', () => {
    expect(Object.keys(REFUSALS)).toEqual([...REFUSAL_CODES]);
    expect(REFUSAL_CODES).toHaveLength(35);
  });

  it('takes every Appendix C code but `overlap-policy-open`, which WP-0.9 answers policy-open (DV-1)', () => {
    const documented = appendixCCodes();
    const fromAppendix = entries
      .filter(([, entry]) => entry.source === 'appendix-c')
      .map(([code]) => code);
    expect(new Set(fromAppendix)).toEqual(
      new Set([...documented].filter((code) => code !== 'overlap-policy-open')),
    );
    expect(documented.has('overlap-policy-open')).toBe(true);
  });

  it('adds exactly six WP-0.9 codes, none in Appendix C, all in the provisional register', () => {
    expect(PROVISIONAL_REFUSAL_CODES).toEqual([
      'experiment-not-in-plan',
      'already-given',
      'group-empty',
      'route-locked',
      'already-passed',
      'no-authorised-device',
    ]);
    const documented = appendixCCodes();
    const register = PROVISIONAL_REGISTER.find((item) => item.id === 'PC-01')!;
    for (const code of PROVISIONAL_REFUSAL_CODES) {
      expect(documented.has(code), code).toBe(false);
      expect(register.trace).toContainEqual({ kind: 'refusal-code', code });
    }
    expect(register.status).not.toBe('owner-approved-interim');
  });

  it.each(entries)(
    '%s: drawn lines are on their boards; a message has lines, an absence has none',
    (code, entry) => {
      expect(entry.evidence, code).toMatch(/B\d-\d\d|M\d\d|§|Board \d\d|^\d\d/);
      expect(entry.lines.length > 0, code).toBe(entry.presentation === 'message');
      for (const line of entry.lines) {
        expect(missingOnBoard(line.text, line.board), `${code}: ${line.text}`).toEqual([]);
        if (line.detail !== undefined) {
          expect(missingOnBoard(line.detail, line.board), `${code}: ${line.detail}`).toEqual([]);
        }
      }
    },
  );

  it('is reachable: every code is in at least one method’s union', () => {
    const declared = new Set(ledgerRows().flatMap((row) => row.refusals));
    expect(REFUSAL_CODES.filter((code) => !declared.has(code))).toEqual([]);
  });
});
