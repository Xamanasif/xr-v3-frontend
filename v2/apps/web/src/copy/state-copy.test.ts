/**
 * The state-copy register (VD-12; WP-0.13 acceptance 2): drawn words are on the boards they cite;
 * every provisional entry waits on a named decision; P0-31's title rule is marked provisional.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import { STATE_COPY, stateWords, type StateCopyEntry } from './state-copy';

const BOARDS: Readonly<Record<string, string>> = {
  '03': '03-Core-Components.dc.html',
  '04': '04-Status-Format-States.dc.html',
  '07': '07-Help-Support.dc.html',
  '08': '08-System-Messages.dc.html',
};

const entries = Object.entries(STATE_COPY) as [string, StateCopyEntry][];

describe('the state-copy register', () => {
  it.each(entries)('%s: words or a rule, a basis, a status', (_, entry) => {
    expect(entry.words === null ? Boolean(entry.rule) : entry.words.length > 0).toBe(true);
    expect(entry.basis.length).toBeGreaterThan(10);
    if (entry.status === 'provisional') expect(entry.decisions?.length).toBeGreaterThan(0);
  });

  it.each(entries.filter(([, entry]) => entry.status === 'drawn'))(
    '%s: drawn words are on the board they cite',
    (_, entry) => {
      const code = /^Board (\d\d)/.exec(entry.basis)?.[1];
      expect(code, 'a drawn entry cites its board first').toBeDefined();
      const text = board(BOARDS[code!]!).replace(/<[^>]+>/g, ' ');
      expect(text).toContain(entry.words!);
    },
  );

  it('P0-31: the report title rule is marked provisional', () => {
    expect(STATE_COPY['XS-07.report-title']).toMatchObject({
      status: 'provisional',
      decisions: ['P0-31'],
      words: null,
    });
  });

  it('stateWords gives an entry’s words', () => {
    expect(stateWords('XS-07.reports.loading')).toBe('Loading your reports');
  });
});
