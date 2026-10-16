/**
 * The words of FA-20 Students, FA-22 Export CSV and FA-21 Student detail are the frozen B4-10
 * board's: each drawn phrase is found verbatim in its markup or script, the composed ones with the
 * board's own sample values (or the script's formula where only the script composes them); FA-03's
 * and FA-05's ways in are B4-02's and B4-03's. The words B4-10 does not draw are provisional
 * entries of the state-copy register.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  ASSESSMENT_WORDS,
  attemptTitle,
  completedOn,
  detailOverline,
  exportedColumns,
  exportedTitle,
  FORMAT_STATUS_WORDS,
  INACTIVE_OPTIONS,
  inactiveChip,
  inactiveTag,
  marksWords,
  noActivitySince,
  noActivitySinceAccess,
  noneSinceAccess,
  notReleasedLine,
  openedWords,
  openStudentLabel,
  PROGRESS_OPTIONS,
  progressChip,
  releasedLine,
  removeChipLabel,
  startedWords,
  STUDENT_DETAIL,
  studentCountWords,
  STUDENTS_COLUMNS,
  STUDENTS_LINKS,
  STUDENTS_PAGE,
  STUDENTS_STATES,
  studentsMetaLine,
  submittedWords,
} from './faculty-students';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_FACULTY_STUDENTS } from './state-copy-faculty-students';

/** A board's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&')}\n${raw}`;
}

const B4_10 = words('B4-10-Students-and-Follow-up.dc.html');
const B4_02 = words('B4-02-My-Courses-and-Experiments.dc.html');
const B4_03 = words('B4-03-Experiment-Teaching-View.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('FA-20 / FA-22 / FA-21 words (B4-10)', () => {
  const drawn = [
    STUDENTS_PAGE,
    STUDENTS_COLUMNS,
    FORMAT_STATUS_WORDS,
    ASSESSMENT_WORDS,
    STUDENTS_STATES,
    STUDENT_DETAIL,
    PROGRESS_OPTIONS.map((option) => option.label),
    INACTIVE_OPTIONS.map((option) => option.label),
  ];
  it.each(strings(drawn))('“%s” is on B4-10', (phrase) => {
    expect(B4_10).toContain(phrase);
  });

  it('the composed words are B4-10’s, with its sample values', () => {
    for (const phrase of [
      studentsMetaLine('7 Nov 2026'),
      noneSinceAccess('12 Oct 2026'),
      exportedColumns([
        'student',
        'student ID',
        'experiment',
        'WEB',
        'VR',
        'assessment',
        'result released to student',
        'last activity',
      ]),
      detailOverline('Shell-and-Tube Heat Exchanger', 'ME ZG523'),
      completedOn('14 Oct 2026'),
      noActivitySinceAccess('12 Oct 2026', 26),
      attemptTitle('Heat Exchanger — post-lab', 1, 2),
      submittedWords('5 Nov 2026, 18:52'),
      ` ${marksWords(11, 16)} · `,
      notReleasedLine('Rahul', { option: 'after-deadline', on: '14 Nov 2026, 23:59' }),
      openedWords('12 Oct 2026, 09:40'),
    ]) {
      expect(B4_10, phrase).toContain(phrase);
    }
  });

  it('the script’s formulas, with the values f0 … f2 show', () => {
    // count: rows.length + ' of ' + all.length + ' students'
    expect(B4_10).toContain("' of ' + all.length + ' students'");
    expect(studentCountWords(5, 5)).toBe('5 of 5 students');
    expect(studentCountWords(2, 5)).toBe('2 of 5 students');
    // chips: 'Progress: ' + PL[s.prog]; 'Inactive ' + s.inact + ' days or more'; 'Remove ' + label
    expect(B4_10).toContain("'Progress: ' + PL[s.prog]");
    expect(progressChip('Waiting for marking')).toBe('Progress: Waiting for marking');
    expect(B4_10).toContain("'Inactive ' + s.inact + ' days or more'");
    expect(inactiveChip(14)).toBe('Inactive 14 days or more');
    expect(B4_10).toContain("c.aria = 'Remove ' + c.label");
    expect(removeChipLabel('Inactive 14 days or more')).toBe('Remove Inactive 14 days or more');
    // rows: aria 'Open ' + r.n; inText 'Inactive ' + r.days + ' days' (tag from 14 days)
    expect(B4_10).toContain("aria: 'Open ' + r.n");
    expect(openStudentLabel('Rahul Verma')).toBe('Open Rahul Verma');
    expect(B4_10).toContain("inText: 'Inactive ' + r.days + ' days'");
    expect(B4_10).toContain('inactive: r.days >= 14');
    expect(inactiveTag(19)).toBe('Inactive 19 days');
    // expText: 'Exported students-shell-and-tube.csv · ' + rows + ' row' + (1 ? '' : 's')
    expect(B4_10).toContain("'Exported students-shell-and-tube.csv · ' + rows.length + ' row'");
    expect(exportedTitle('students-shell-and-tube.csv', 5)).toBe(
      'Exported students-shell-and-tube.csv · 5 rows',
    );
    expect(exportedTitle('students-shell-and-tube.csv', 1)).toBe(
      'Exported students-shell-and-tube.csv · 1 row',
    );
  });

  it('FA-03’s and FA-05’s ways in are B4-02’s and B4-03’s', () => {
    expect(B4_02).toContain(
      `<a class="xr-btn xr-btn--text" href="B4-10-Students-and-Follow-up.dc.html">${STUDENTS_LINKS.course}</a>`,
    );
    expect(B4_03).toContain(
      `<a href="B4-10-Students-and-Follow-up.dc.html">${STUDENTS_LINKS.experiment}</a>`,
    );
  });

  it('the undrawn words are the register’s provisional entries, never on the board', () => {
    expect(studentCountWords(1, 1)).toBe(STATE_COPY['FA-20.count-one'].words);
    expect(noActivitySince('19 Oct 2026', 19)).toBe('No activity since 19 Oct 2026 · 19 days');
    expect(startedWords('16 Nov 2026, 10:00')).toBe('started 16 Nov 2026, 10:00');
    expect(releasedLine('Rahul', '14 Nov 2026, 23:59')).toBe(
      'Result released to Rahul 14 Nov 2026, 23:59',
    );
    expect(notReleasedLine('Rahul', { option: 'on-date', on: '20 Nov 2026, 09:00' })).toBe(
      'Result not released to Rahul yet — on 20 Nov 2026, 09:00',
    );
    expect(notReleasedLine('Rahul', { option: 'immediately-after-marking', on: null })).toBe(
      'Result not released to Rahul yet — immediately after marking',
    );
    expect(notReleasedLine('Rahul', { option: null, on: null })).toBe(
      'Result not released to Rahul yet',
    );
    expect(attemptTitle('Heat Exchanger — post-lab', 1, null)).toBe(
      'Heat Exchanger — post-lab · attempt 1',
    );
    for (const [id, entry] of Object.entries(STATE_COPY_FACULTY_STUDENTS)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(entry.status, id).toBe('provisional');
      expect(entry.decisions.length, id).toBeGreaterThan(0);
      if (entry.words !== null) {
        expect(entry.words, id).not.toMatch(/\b(?:OD|T|PC|DEV|VD|BC|ATT)-?\d/);
      }
    }
  });
});
