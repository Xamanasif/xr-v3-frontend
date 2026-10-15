/**
 * The words of IA-09 Faculty record (B2-06 f15, f16) and IA-15 Faculty courses (B2-09) are the
 * frozen boards': each drawn phrase is found verbatim in its board's markup or script, the composed
 * ones with the boards' own sample values; the words no board draws for these screens are
 * provisional entries of the state-copy register.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  assignedFlash,
  assignedWords,
  assignToLabel,
  courseCode,
  courseOptionWords,
  coursesSetLine,
  FACULTY_COURSES,
  FACULTY_RECORD,
  facultyAddedWords,
  lastName,
  noCoursesLine,
  noMarkerLine,
  removeBody,
  removeCourseLabel,
  removedFlash,
  removeTitle,
} from './faculty';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_FACULTY } from './state-copy-faculty';

/** A board's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B2_06 = words('B2-06-People.dc.html');
const B2_09 = words('B2-09-Faculty-Courses.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('IA-09 Faculty record (B2-06 f15, f16)', () => {
  it.each(strings(FACULTY_RECORD))('“%s” is on B2-06', (phrase) => {
    expect(B2_06).toContain(phrase);
  });

  it('the composed words are B2-06’s, with its sample values', () => {
    expect(lastName('Dr Anita Desai')).toBe('Desai');
    expect(lastName(' Dr S. Ranganathan ')).toBe('Ranganathan');
    for (const phrase of [
      coursesSetLine('Dr S. Ranganathan'),
      noCoursesLine('Dr Anita Desai'),
      facultyAddedWords('8 Oct 2026', 'Meera Iyer'),
    ]) {
      expect(B2_06, phrase).toContain(phrase);
    }
    // "Assigned": the words, then the mapping's ID in `span.xr-id` (raw markup).
    expect(B2_06).toContain(
      `${assignedWords('9 Oct 2026', 'Meera Iyer')}<span class="xr-id">FMAP-0021</span>`,
    );
    // The table's last column header is for screen readers only.
    expect(B2_06).toContain(`<span class="xr-sr">${FACULTY_RECORD.columns.action}</span>`);
  });

  it('with no person on the record, the date stands alone (state-copy IA-09.details)', () => {
    expect(assignedWords('9 Oct 2026', null)).toBe('9 Oct 2026 · ');
    expect(facultyAddedWords('8 Oct 2026', null)).toBe('8 Oct 2026');
    expect(STATE_COPY['IA-09.details'].status).toBe('provisional');
  });
});

describe('IA-15 Faculty courses (B2-09)', () => {
  it.each(strings(FACULTY_COURSES))('“%s” is on B2-09', (phrase) => {
    expect(B2_09).toContain(phrase);
  });

  it('the composed words follow the board’s script and frames', () => {
    // `pickAria`, the course `aria`, the flashes, the option and the dialog.
    expect(B2_09).toContain("pickAria: 'Assign a course to ' + f.n");
    expect(assignToLabel('Dr S. Ranganathan')).toBe('Assign a course to Dr S. Ranganathan');
    expect(B2_09).toContain("aria: 'Remove ' + c + ' from ' + f.n");
    expect(removeCourseLabel('ME ZG523', 'Dr S. Ranganathan')).toBe(
      'Remove ME ZG523 from Dr S. Ranganathan',
    );
    expect(B2_09).toContain(assignedFlash('Dr S. Ranganathan', 'ME ZG523'));
    expect(B2_09).toContain(
      "flash: f.n + ' now teaches ' + s.course + '. It appears in their Faculty workspace.'",
    );
    expect(B2_09).toContain("flash: s.dlg.c + ' was removed from ' + d.f.n + '.'");
    expect(removedFlash('ME ZG523', 'Dr S. Ranganathan')).toBe(
      'ME ZG523 was removed from Dr S. Ranganathan.',
    );
    expect(B2_09).toContain(courseOptionWords('ME ZG523', 'Thermodynamics & Heat Transfer'));
    expect(B2_09).toContain('Remove {{ w.dCourse }} from {{ w.dName }}?');
    expect(removeTitle('ME ZG523', 'Dr S. Ranganathan')).toBe(
      'Remove ME ZG523 from Dr S. Ranganathan?',
    );
    expect(B2_09).toContain('{{ w.dCourse }} will no longer appear in their Faculty workspace.');
    expect(removeBody('ME ZG523')).toBe(
      'ME ZG523 will no longer appear in their Faculty workspace.',
    );
    expect(B2_09).toContain(noMarkerLine(1, 'ME ZG523'));
    expect(B2_09).toContain(`<span class="xr-sr">${FACULTY_COURSES.columns.action}</span>`);
  });

  it('a course without a code is named by its name (state-copy IA-15.reads)', () => {
    expect(courseCode({ name: 'Thermodynamics & Heat Transfer', platformCode: 'ME ZG523' })).toBe(
      'ME ZG523',
    );
    expect(courseCode({ name: 'Fluid Mechanics', platformCode: null })).toBe('Fluid Mechanics');
    expect(courseOptionWords(null, 'Fluid Mechanics')).toBe('Fluid Mechanics');
  });

  it('the plural warning is provisional (state-copy IA-15.no-marker.plural)', () => {
    const plural = noMarkerLine(3, 'ME ZG523');
    expect(B2_09).not.toContain(plural);
    expect(STATE_COPY['IA-15.no-marker.plural'].rule).toContain(
      'written answers in <code> are waiting for marking',
    );
    expect(plural).toBe(
      '3 written answers in ME ZG523 are waiting for marking, and no other faculty member teaches the course. They will wait without a marker until you assign one.',
    );
  });
});

describe('the Faculty state-copy entries', () => {
  it('are in the one register, each for IA-09 or IA-15', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_FACULTY)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(['IA-09', 'IA-15']).toContain(entry.screen);
      expect(id.startsWith(`${entry.screen}.`)).toBe(true);
    }
  });

  it('the words no board draws are not on B2-06 or B2-09', () => {
    for (const entry of Object.values(STATE_COPY_FACULTY)) {
      if (entry.status === 'drawn' || entry.words === null) continue;
      expect(B2_06).not.toContain(entry.words);
      expect(B2_09).not.toContain(entry.words);
    }
  });
});
