/**
 * The words of FA-12 Submissions with FA-22 Export CSV and FA-08's Submissions panel actions are
 * the owner-approved export's (FA-v1 `project/Main.dc.html`, template and script `vmSubmissions`,
 * `release`, `score`): each drawn phrase is found verbatim in its markup or script, the composed
 * ones equal the export's with its sample values and use the script's own pieces. The words the
 * export does not draw are provisional entries of the state-copy register. A submission is named
 * by its student and "Attempt 1 of 2", never its reference (the owner's identifier rule).
 */
import { describe, expect, it } from 'vitest';

import { faExport } from '@/test-support/boards';

import { STATE_COPY, type StateCopyEntry } from './state-copy';
import { STATE_COPY_SUBMISSIONS } from './state-copy-submissions';
import {
  attemptWords,
  automaticWords,
  emptyLine,
  exportedWords,
  notReleasedSubWords,
  outcomeWords,
  releasedSubWords,
  rowLinkLabel,
  scoreWords,
  submissionsCaption,
  submittedCountWords,
  SUBMISSIONS_WORDS,
  SUMMARY_ACTIONS,
  waitingScoreWords,
} from './submissions';

/** The export's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
const RAW = faExport('Main.dc.html');
const EXPORT = `${RAW.replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')}\n${RAW}`;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('FA-12 Submissions (FA-v1)', () => {
  it.each(strings({ ...SUBMISSIONS_WORDS, exportedColumns: undefined }))(
    '“%s” is in the export',
    (phrase) => {
      expect(EXPORT).toContain(phrase);
    },
  );

  it('the export confirmation says what the service’s file holds, and names no reference', () => {
    // The export's line claims the filtered list; the service's file holds every submission.
    expect(EXPORT).toContain(
      'It contains this list only, as it was when you exported it. Columns: student, student ID, submitted, status, score, result released to student.',
    );
    expect(SUBMISSIONS_WORDS.exportedColumns).toBe(
      'It contains every submission to this assessment, as it was when you exported it. Columns: student, student ID, submitted, status, score, result released to student.',
    );
    // The export names the file; the confirmation names the assessment (the service's file name
    // holds its reference). The export's row count formula is kept.
    expect(exportedWords('Heat Exchanger — post-lab', 2)).toBe(
      'Exported the submissions of Heat Exchanger — post-lab as a CSV file · 2 rows',
    );
    expect(exportedWords('Heat Exchanger — post-lab', 1)).toBe(
      'Exported the submissions of Heat Exchanger — post-lab as a CSV file · 1 row',
    );
    expect(EXPORT).toContain("'.csv · ' + this.plural(rows.length, 'row')");
    expect(exportedWords('Heat Exchanger — post-lab', 2)).not.toMatch(/\b[A-Z]{2,5}-\d{4}\b/);
  });

  it('the composed words are the export’s, with its sample values and the script’s pieces', () => {
    expect(submittedCountWords(2, 1)).toBe('2 submissions · 1 waiting for marking');
    expect(submittedCountWords(1, 0)).toBe('1 submission · 0 waiting for marking');
    expect(EXPORT).toContain(
      "count: this.plural(all.length, 'submission') + ' · ' + nW + ' waiting for marking'",
    );
    expect(attemptWords(1, 2, null)).toBe('Attempt 1 of 2');
    expect(attemptWords(1, 2, 1)).toBe('Attempt 1 of 2 · version 1');
    expect(EXPORT).toContain(
      "sub: 'Attempt ' + t.no + ' of ' + cfgT.att + (multi ? ' · version ' + t.ver : '')",
    );
    expect(rowLinkLabel(true, 'Priya Natarajan')).toBe('Mark Priya Natarajan');
    expect(rowLinkLabel(false, 'Rahul Verma')).toBe('View marks for Rahul Verma');
    expect(EXPORT).toContain("aria: (w ? 'Mark ' : 'View marks for ') + s.n");
    expect(scoreWords(11, 16)).toBe('11 of 16');
    expect(waitingScoreWords(16)).toBe('— of 16');
    expect(EXPORT).toContain("autoPart: '— of ' + sc.of");
    expect(automaticWords(4, 6)).toBe('Marked automatically: 4 of 6');
    expect(EXPORT).toContain("autoNote: 'Marked automatically: ' + sc.auto + ' of ' + sc.autoOf");
    expect(outcomeWords(true, 8)).toBe('Passed · pass mark 8');
    expect(outcomeWords(false, 8)).toBe('Not passed · pass mark 8');
    expect(EXPORT).toContain("(sc.passed ? 'Passed' : 'Not passed') + ' · pass mark ' + sc.pm");
    expect(submissionsCaption('Heat Exchanger — post-lab')).toBe(
      'Submissions for Heat Exchanger — post-lab',
    );
    expect(EXPORT).toContain('<caption>Submissions for {{ AR.name }}</caption>');
    // The release beneath "Released" / "Not yet": the export's `release` texts without the head.
    expect(releasedSubWords('14 Nov 2026, 23:59', 'after-deadline')).toBe(
      '14 Nov 2026, 23:59, after the deadline',
    );
    expect(EXPORT).toContain("'Released ' + cfg.dl + ', after the deadline'");
    expect(notReleasedSubWords('after-deadline', '14 Nov 2026, 23:59')).toBe(
      'after the deadline, 14 Nov 2026, 23:59',
    );
    expect(EXPORT).toContain("'Not yet — after the deadline, ' + cfg.dl");
    expect(notReleasedSubWords('immediately-after-marking', null)).toBe('after marking');
    expect(EXPORT).toContain("'Not yet — after marking'");
    expect(notReleasedSubWords('on-date', '20 Nov 2026, 09:00')).toBe('on 20 Nov 2026, 09:00');
    expect(EXPORT).toContain("'Not yet — on ' + cfg.reldate");
    // A release not set yet: "Not yet" alone (a Ready assessment always has one, BC6).
    expect(notReleasedSubWords(null, null)).toBeNull();
    expect(emptyLine('Shell-and-Tube Heat Exchanger')).toBe(
      'Students who have Shell-and-Tube Heat Exchanger see this assessment in Assessments. Their submissions appear here.',
    );
    expect(EXPORT).toContain(
      "'Students who have ' + e.t + ' see this assessment in Assessments. Their submissions appear here.'",
    );
  });
});

describe('FA-08 Summary’s panel actions (FA-v1)', () => {
  it.each(strings(SUMMARY_ACTIONS))('“%s” is in the export', (phrase) => {
    expect(EXPORT).toContain(phrase);
  });

  it('draws them as the Submissions panel’s primary and plain buttons', () => {
    expect(RAW).toContain(
      `<a class="rb-btn rb-btn--primary rk-go" href="#FA-19" onClick="{{ AS.markNext }}">${SUMMARY_ACTIONS.markNext}</a>`,
    );
    expect(RAW).toContain(
      `<a class="rb-btn" href="#FA-12" onClick="{{ AR.tg.sub }}">${SUMMARY_ACTIONS.seeSubmissions}</a>`,
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
