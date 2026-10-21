/**
 * The words of FA-20 Students, FA-22 Export CSV and FA-21 Student detail are the owner-approved
 * Faculty export's (V3 Refined B, FA-v1 `Main.dc.html` FA-20, FA-21 and the script's
 * `vmStudents`, `vmStudent`, `stuAsm`, `lastAct`): each drawn phrase is found verbatim in its
 * template or script, the composed ones by the script's own formula with the export's values.
 * FA-03's and FA-05's ways in (the teaching group's) stay B4-02's and B4-03's. The words the export
 * does not draw are provisional entries of the state-copy register.
 */
import { describe, expect, it } from 'vitest';

import { faExport } from '@/test-support/boards';

import {
  ASSESSMENT_WORDS,
  asOfWords,
  attemptLine,
  detailOverline,
  dueWords,
  EXPORTED_ROWS,
  exportedColumns,
  exportedTitle,
  FORMAT_COUNT_WORDS,
  FORMAT_STATUS_WORDS,
  formatCellLabel,
  formatSummaryLabel,
  formatSummaryTitle,
  INACTIVE_OPTIONS,
  inactiveChip,
  inactiveTag,
  lastActivityLine,
  markedSubWords,
  noActivitySinceAccess,
  noneSinceAccess,
  notSubmittedLine,
  openedWords,
  openStudentLabel,
  PROGRESS_OPTIONS,
  progressChip,
  removeChipLabel,
  startedAttemptLine,
  STUDENT_DETAIL,
  studentCountWords,
  STUDENTS_COLUMNS,
  STUDENTS_PAGE,
  STUDENTS_STATES,
  studentsAsOfLine,
  studentsLead,
  submittedOnWords,
} from './faculty-students';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_FACULTY_STUDENTS } from './state-copy-faculty-students';

/** The export's live root: its template's words (tags removed), then its raw source and script. */
const FA_RAW = faExport('Main.dc.html');
const FA = `${FA_RAW.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${FA_RAW}`;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('FA-20 / FA-22 / FA-21 words (FA-v1)', () => {
  const drawn = [
    STUDENTS_PAGE,
    STUDENTS_COLUMNS,
    FORMAT_STATUS_WORDS,
    FORMAT_COUNT_WORDS,
    ASSESSMENT_WORDS,
    STUDENTS_STATES,
    STUDENT_DETAIL,
    EXPORTED_ROWS,
    PROGRESS_OPTIONS.map((option) => option.label),
    INACTIVE_OPTIONS.map((option) => option.label),
  ];
  it.each(strings(drawn))('“%s” is the export’s', (phrase) => {
    expect(FA).toContain(phrase);
  });

  it('the composed words are the script’s formulas, with the export’s values', () => {
    expect(FA).toContain(
      "'Students who have the experiments you teach, from Godavari Institute of Technology.'",
    );
    expect(studentsLead('Godavari Institute of Technology')).toBe(
      'Students who have the experiments you teach, from Godavari Institute of Technology.',
    );
    expect(studentsLead(null)).toBe('Students who have the experiments you teach.');
    expect(FA).toContain("'As of ' + W.clock.day + ' · progress in words, per format'");
    expect(studentsAsOfLine('7 Nov 2026')).toBe('As of 7 Nov 2026 · progress in words, per format');
    expect(FA).toContain("'All ' + this.plural(sumN, 'student') + ' with access, by format'");
    expect(formatSummaryTitle(5)).toBe('All 5 students with access, by format');
    expect(formatSummaryTitle(1)).toBe('All 1 student with access, by format');
    expect(FA).toContain("'Progress by format for all students with access to '");
    expect(formatSummaryLabel('Shell-and-Tube Heat Exchanger')).toBe(
      'Progress by format for all students with access to Shell-and-Tube Heat Exchanger',
    );
    expect(FA).toContain(
      "list.length + ' of ' + this.plural(scope.length, 'student') : this.plural(scope.length, 'student')",
    );
    expect(studentCountWords(5, 5, false)).toBe('5 students');
    expect(studentCountWords(2, 5, true)).toBe('2 of 5 students');
    expect(studentCountWords(1, 1, false)).toBe('1 student');
    expect(FA).toContain("'Progress: ' + PL[f.prog]");
    expect(progressChip('Waiting for marking')).toBe('Progress: Waiting for marking');
    expect(FA).toContain("'Inactive ' + f.inact + ' days or more'");
    expect(inactiveChip(14)).toBe('Inactive 14 days or more');
    expect(FA).toContain("'Remove filter ' + c.label");
    expect(removeChipLabel('Inactive 14 days or more')).toBe(
      'Remove filter Inactive 14 days or more',
    );
    expect(FA).toContain("aria: 'Open ' + s.n");
    expect(openStudentLabel('Rahul Verma')).toBe('Open Rahul Verma');
    expect(FA).toContain(
      "'Progress by format: ' + fm.map(c => c.code + ' ' + c.t.toLowerCase() + (c.d ? ' ' + c.d : '')).join(', ')",
    );
    expect(
      formatCellLabel([
        { code: 'WEB', status: 'Completed', date: '14 Oct 2026' },
        { code: 'VR', status: 'In progress', date: null },
      ]),
    ).toBe('Progress by format: WEB completed 14 Oct 2026, VR in progress');
    expect(FA).toContain("inText: 'Inactive ' + la.days + ' days'");
    expect(inactiveTag(19)).toBe('Inactive 19 days');
    expect(FA).toContain("'None since access was given (' + this.isoDay(s.access) + ')'");
    expect(noneSinceAccess('12 Oct 2026')).toBe('None since access was given (12 Oct 2026)');
    expect(FA).toContain("'Submitted ' + t.submitted, a, t");
    expect(submittedOnWords('5 Nov 2026, 18:52')).toBe('Submitted 5 Nov 2026, 18:52');
    expect(FA).toContain("'Due ' + cfg.dl");
    expect(dueWords('14 Nov 2026, 23:59')).toBe('Due 14 Nov 2026, 23:59');
    expect(FA).toContain(
      "sc.total + ' of ' + sc.of + ' · ' + (rel.done ? 'result released' : 'result not released yet')",
    );
    expect(markedSubWords(11, 16, false)).toBe('11 of 16 · result not released yet');
    expect(markedSubWords(11, 16, true)).toBe('11 of 16 · result released');
  });

  it('FA-22: the band’s words are the export’s', () => {
    expect(FA).toContain(
      "'Exported students-' + (fileExp ? this.slug(fileExp.t) : 'all-experiments') + '.csv · ' + this.plural(list.length, 'row')",
    );
    expect(exportedTitle('students-shell-and-tube-heat-exchanger.csv', 5)).toBe(
      'Exported students-shell-and-tube-heat-exchanger.csv · 5 rows',
    );
    expect(exportedTitle('students-shell-and-tube-heat-exchanger.csv', 1)).toBe(
      'Exported students-shell-and-tube-heat-exchanger.csv · 1 row',
    );
    expect(FA).toContain(
      'It contains the filtered list only, as it was when you exported it. Columns: student, student ID, experiment, {{ SL.fmCols }}, assessment, result released to student, last activity.',
    );
    expect(
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
    ).toBe(
      'It contains the filtered list only, as it was when you exported it. Columns: student, student ID, experiment, WEB, VR, assessment, result released to student, last activity.',
    );
  });

  it('FA-21: the head and the panel are the script’s', () => {
    expect(FA).toContain("e.t + ' · ' + cr.code");
    expect(detailOverline('Shell-and-Tube Heat Exchanger', 'ME ZG523')).toBe(
      'Shell-and-Tube Heat Exchanger · ME ZG523',
    );
    expect(FA).toContain("'Last activity ' + this.isoDay(s.last)");
    expect(lastActivityLine('5 Nov 2026')).toBe('Last activity 5 Nov 2026');
    expect(FA).toContain("'No activity since access was given (' + this.isoDay(s.access) + ')'");
    expect(noActivitySinceAccess('12 Oct 2026')).toBe(
      'No activity since access was given (12 Oct 2026)',
    );
    expect(FA).toContain("'as of ' + W.clock.day");
    expect(asOfWords('7 Nov 2026')).toBe('as of 7 Nov 2026');
    expect(FA).toContain("'Opened ' + o");
    expect(openedWords('12 Oct 2026, 09:40')).toBe('Opened 12 Oct 2026, 09:40');
    expect(FA).toContain(
      "'Attempt ' + t.no + ' of ' + this.verOf(a, t.ver).att + ' · submitted ' + t.submitted",
    );
    expect(attemptLine(1, 2, '5 Nov 2026, 18:52')).toBe(
      'Attempt 1 of 2 · submitted 5 Nov 2026, 18:52',
    );
    expect(FA).toContain(
      "this.plural(Number(cfg.att) || 0, 'attempt') + ' allowed. No attempt submitted yet.'",
    );
    expect(notSubmittedLine(2)).toBe('2 attempts allowed. No attempt submitted yet.');
  });

  it('the undrawn words are the register’s provisional entries, never in the export as they are', () => {
    expect(attemptLine(1, null, '5 Nov 2026, 18:52')).toBe(
      'Attempt 1 · submitted 5 Nov 2026, 18:52',
    );
    expect(startedAttemptLine(1, 2, '16 Nov 2026, 10:00')).toBe(
      'Attempt 1 of 2 · started 16 Nov 2026, 10:00',
    );
    expect(startedAttemptLine(2, null, '16 Nov 2026, 10:00')).toBe(
      'Attempt 2 · started 16 Nov 2026, 10:00',
    );
    expect(notSubmittedLine(null)).toBe('No attempt submitted yet.');
    // The words the export also writes elsewhere: “None” (any word), “None yet” and “No attempt
    // submitted yet.” (inside its own longer lines).
    const shared = ['FA-20.last-activity-none', 'FA-21.no-resources', 'FA-21.not-submitted'];
    for (const [id, entry] of Object.entries(STATE_COPY_FACULTY_STUDENTS)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(entry.status, id).toBe('provisional');
      expect(entry.decisions.length, id).toBeGreaterThan(0);
      if (entry.words !== null) {
        expect(entry.words, id).not.toMatch(/\b(?:OD|T|PC|DEV|VD|BC|ATT)-?\d/);
        if (!shared.includes(id)) expect(FA, id).not.toContain(entry.words);
      }
    }
  });
});
