/**
 * The words of FA-12 Submissions with FA-22 Export CSV (B4-06 f7 … f11) and FA-08's Phase-4B
 * actions (B4-05 f0, f4) are the frozen boards': each drawn phrase is found verbatim in its
 * board's markup or script, the composed ones with the boards' own sample values; the words no
 * board draws are provisional entries of the state-copy register.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import { STATE_COPY, type StateCopyEntry } from './state-copy';
import { STATE_COPY_SUBMISSIONS } from './state-copy-submissions';
import {
  emptyLine,
  exportedWords,
  notReleasedWords,
  releasedWords,
  scoreWords,
  submittedCountWords,
  SUBMISSIONS_WORDS,
  SUMMARY_ACTIONS,
} from './submissions';

/** A board's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B4_05 = words('B4-05-Assessment-Summary-and-Questions.dc.html');
const B4_06 = words('B4-06-Settings-Preview-Submissions.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('FA-12 Submissions (B4-06 f7 … f11)', () => {
  it.each(strings(SUBMISSIONS_WORDS))('“%s” is on B4-06', (phrase) => {
    expect(B4_06).toContain(phrase);
  });

  it('the composed words are B4-06’s, with its sample values', () => {
    // The frames' own text (f7, f8, f9, f10, f11) as the script composes it.
    expect(submittedCountWords(2, 2)).toBe('2 submitted · 2 waiting for marking');
    expect(B4_06).toContain("rows.length + ' submitted · ' + nWait + ' waiting for marking'");
    expect(scoreWords(11, 16)).toBe('11 of 16');
    expect(B4_06).toContain("score: s.confirmed ? c.total + ' of ' + D.total : '—'");
    expect(releasedWords('14 Nov 2026, 23:59')).toBe('Released 14 Nov 2026, 23:59');
    expect(B4_06).toContain("'Released ' + D.att.released");
    expect(B4_06).toContain('"released": "14 Nov 2026, 23:59"');
    expect(exportedWords('submissions-ASMT-0009.csv', 2)).toBe(
      'Exported submissions-ASMT-0009.csv · 2 rows',
    );
    expect(exportedWords('submissions-ASMT-0009.csv', 1)).toBe(
      'Exported submissions-ASMT-0009.csv · 1 row',
    );
    expect(B4_06).toContain(
      "'Exported submissions-' + D.asmId + '.csv · ' + rows.length + ' row' + (rows.length === 1 ? '' : 's')",
    );
    expect(B4_06).toContain(emptyLine('Shell-and-Tube Heat Exchanger'));
    expect(notReleasedWords('after-deadline', null)).toBe('Not yet — after the deadline');
  });

  it('the undrawn release flags are provisional register words', () => {
    expect(notReleasedWords('immediately-after-marking', null)).toBe('Not yet — when marked');
    expect(notReleasedWords('on-date', '20 Nov 2026, 09:00')).toBe(
      'Not yet — on 20 Nov 2026, 09:00',
    );
    expect(notReleasedWords('on-date', null)).toBe('Not yet — on a date');
    expect(notReleasedWords(null, null)).toBe('Not yet');
  });
});

describe('FA-08 Summary’s Phase-4B actions (B4-05 f0, f4)', () => {
  it.each(strings(SUMMARY_ACTIONS))('“%s” is on B4-05', (phrase) => {
    expect(B4_05).toContain(phrase);
  });

  it('draws them as the Submissions section’s primary and secondary links', () => {
    expect(B4_05).toContain(
      `<a class="xr-btn xr-btn--primary" href="B4-09-Marking.dc.html">${SUMMARY_ACTIONS.markNext}</a><a class="xr-btn xr-btn--secondary" href="B4-06-Settings-Preview-Submissions.dc.html">${SUMMARY_ACTIONS.seeSubmissions}</a>`,
    );
  });
});

describe('the FA-12 state-copy entries', () => {
  it('are in the one register, provisional, with decisions; no decision id in the words', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_SUBMISSIONS) as [
      string,
      StateCopyEntry,
    ][]) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY], id).toBe(entry);
      expect(entry.status, id).toBe('provisional');
      expect(entry.decisions?.length, id).toBeGreaterThan(0);
      expect(entry.words ?? entry.rule, id).toBeTruthy();
      if (entry.words) expect(entry.words, id).not.toMatch(/\b(?:OD|T|PC|DEV|VD|M|BC|P\d)-?\d/);
    }
  });
});
