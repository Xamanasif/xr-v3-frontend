/**
 * The words of IA-06, IA-07, IA-08 (B2-06) and IA-10 (B2-07) are the frozen boards': each drawn
 * phrase is found verbatim in its board's markup or script, the composed ones with the boards' own
 * sample values; the words no board draws for these screens are provisional entries of the
 * state-copy register.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  ADD_PERSON,
  ADDED_FACULTY_LINE,
  ADDED_STUDENT_LINE,
  ALSO_NOT_CHANGED,
  addedByWords,
  alsoInWords,
  courseLine,
  deactivateBody,
  deactivateTitle,
  DIRECTORY_STATUS_WORDS,
  FACULTY_TAB,
  facultyCountWords,
  firstName,
  formatsAnd,
  fromPlanWords,
  givenIndividuallyNote,
  givenIndividuallyWords,
  givenThroughGroupHistory,
  givenThroughGroupWords,
  givenWords,
  groupChip,
  groupGrantNotChanged,
  HISTORY_UNDRAWN,
  historyWhen,
  importedByWords,
  importedFromWords,
  inactiveGrantLine,
  inactiveSinceWords,
  inactiveUntilLine,
  individualWithdrawnWords,
  noExperimentsTitle,
  openStudentLabel,
  OTHER_GRANT_WORDS,
  PEOPLE_PAGE,
  quotedReason,
  reactivateBody,
  reactivateTitle,
  RECORD_GRANT_WORDS,
  RECORD_OVERLINE,
  RECORD_PAGE,
  searchChip,
  statusChip,
  studentCountWords,
  STUDENTS_TAB,
  waitingLine,
  withdrawnLine,
} from './institute-people';
import { STATE_COPY } from './state-copy';

/** A board's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B2_03 = words('B2-03-Access-Plan-and-Course-Codes.dc.html');
const B2_04 = words('B2-04-Student-Access.dc.html');
const B2_06 = words('B2-06-People.dc.html');
const B2_07 = words('B2-07-Add-and-Import.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('IA-06 / IA-08 People (B2-06 f0 … f7, f14)', () => {
  it.each([
    ...strings(PEOPLE_PAGE),
    ...strings(STUDENTS_TAB),
    ...strings(FACULTY_TAB),
    ...strings(DIRECTORY_STATUS_WORDS),
  ])('“%s” is on B2-06', (phrase) => {
    expect(B2_06).toContain(phrase);
  });

  it('the composed words follow the board’s script', () => {
    // B2-06 `plView` / `fcView`.
    expect(B2_06).toContain("list.length + ' of ' + all.length + ' students'");
    expect(B2_06).toContain("all.length + ' students'");
    expect(studentCountWords(12, 12, false)).toBe('12 students');
    expect(studentCountWords(1, 12, true)).toBe('1 of 12 students');
    expect(B2_06).toContain("rows.length + ' of ' + Component.FC.length + ' faculty members'");
    expect(facultyCountWords(3, 3, false)).toBe('3 faculty members');
    expect(facultyCountWords(1, 3, true)).toBe('1 of 3 faculty members');
    expect(B2_06).toContain("'Search: “' + s.q.trim() + '”'");
    expect(searchChip(' Meenakshi ')).toBe('Search: “Meenakshi”');
    expect(B2_06).toContain("'Status: ' + LBL[s.st]");
    expect(statusChip('inactive')).toBe('Status: Inactive');
    expect(B2_06).toContain("'Group: ' + D.groupName");
    expect(groupChip('ME ZG523 — Sem II')).toBe('Group: ME ZG523 — Sem II');
    expect(B2_06).toContain("'Open student record: ' + x.n");
    expect(openStudentLabel('Rahul Verma')).toBe('Open student record: Rahul Verma');
  });
});

describe('IA-07 Student record (B2-06 f8 … f13, f17)', () => {
  it.each([...strings(RECORD_PAGE), ...strings(RECORD_GRANT_WORDS), RECORD_OVERLINE])(
    '“%s” is on B2-06',
    (phrase) => {
      expect(B2_06).toContain(phrase);
    },
  );

  it('the composed words are B2-06’s, with its sample values', () => {
    expect(firstName('Rahul Verma')).toBe('Rahul');
    for (const phrase of [
      noExperimentsTitle('Rahul Verma'),
      fromPlanWords('ACC-0107'),
      alsoInWords('ME ZG523 — Sem II'),
      waitingLine('Arun Kumar', 'ACC-0107'),
      inactiveGrantLine('Sneha Reddy'),
      withdrawnLine('12 Oct 2026', 'Given individually by mistake.'),
      courseLine('ME ZG523', 'Thermodynamics & Heat Transfer'),
      importedByWords('8 Oct 2026', 'Meera Iyer'),
      historyWhen('8 Oct 2026, 16:10', 'Meera Iyer'),
      importedFromWords('godavari-me-zg523.csv'),
      givenWords('Shell-and-Tube Heat Exchanger'),
      givenThroughGroupHistory('Shell-and-Tube Heat Exchanger', 'ME ZG523 — Sem II'),
      givenIndividuallyNote('SACC-0310', ['vr', 'web'], 'ACC-0107'),
      individualWithdrawnWords('SACC-0310'),
      `${quotedReason('Given individually by mistake.')}${groupGrantNotChanged('SACC-0311')}`,
      quotedReason('On leave this semester.'),
      inactiveSinceWords('10 Oct 2026', 'Meera Iyer', 'On leave this semester.'),
      deactivateTitle('Rahul Verma'),
      deactivateBody('Rahul Verma'),
      reactivateTitle('Rahul Verma'),
      reactivateBody('Rahul Verma'),
    ]) {
      expect(B2_06, phrase).toContain(phrase);
    }
    // "How given": the words, then the grant's ID in `span.xr-id` (raw markup).
    expect(B2_06).toContain(
      `${givenIndividuallyWords('9 Oct 2026')}<span class="xr-id">SACC-0310</span>`,
    );
    expect(B2_06).toContain(
      `${givenThroughGroupWords('ME ZG523 — Sem II', '12 Oct 2026')}<span class="xr-id">SACC-0311</span>`,
    );
    expect(B2_06).toContain(`· <span class="xr-id">SACC-0311</span>${ALSO_NOT_CHANGED}`);
    expect(formatsAnd(['vr', 'web'])).toBe('WEB and VR');
  });

  it('the grant words B2-06 does not draw are the sibling boards’ (state-copy IA-07.grant-words)', () => {
    expect(B2_04).toContain(OTHER_GRANT_WORDS.withdrawn);
    expect(B2_04).toContain(OTHER_GRANT_WORDS['access-ended']);
    expect(B2_03).toContain(OTHER_GRANT_WORDS.paused);
    expect(STATE_COPY['IA-07.grant-words'].status).toBe('provisional');
  });

  it('the undrawn words are provisional entries of the register', () => {
    expect(addedByWords('8 Oct 2026', 'Meera Iyer')).toBe('8 Oct 2026 · added by Meera Iyer');
    expect(inactiveUntilLine('Sneha Reddy')).toBe(
      'Sneha can’t open experiments until their account is reactivated.',
    );
    expect(B2_06).not.toContain(inactiveUntilLine('Sneha Reddy'));
    expect(B2_06).toContain('Sneha can’t open experiments until her account is reactivated.');
    for (const id of ['IA-07.details', 'IA-07.inactive.line', 'IA-07.history'] as const) {
      expect(STATE_COPY[id].status).toBe('provisional');
    }
    expect(Object.values(HISTORY_UNDRAWN)).toEqual([
      'Account reactivated',
      'Account status changed',
    ]);
    expect(B2_06).toContain('Account reactivated.');
    expect(STATE_COPY['IA-07.no-experiments.line'].words).toBe(
      'Give this student access to choose experiments from your access plan. They’ll see the formats the plan includes.',
    );
  });
});

describe('IA-10 Add a student / Add a faculty member (B2-07 f0 … f4)', () => {
  it.each([...strings(ADD_PERSON), ADDED_STUDENT_LINE, ADDED_FACULTY_LINE])(
    '“%s” is on B2-07',
    (phrase) => {
      expect(B2_07).toContain(phrase);
    },
  );
});
