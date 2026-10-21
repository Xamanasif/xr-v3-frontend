/**
 * Package 2B's words outside the agents' screen groups: IA-16 Course codes (B2-03 f6 … f10), ST-04
 * All experiments and the My courses tabs (B2-11 f2, f4, f15), and the actions Package 2B turns on
 * in Package-2A screens (B2-01 "Add course code", B2-02 "Add code", B2-04 "Change on the group",
 * B2-05 / B2-06 "Import students", B2-07 "Assign a course"). Each drawn phrase is found verbatim on
 * its board; each composed line takes the board's own form for the board's sample; undrawn words
 * are provisional state-copy entries with their decisions.
 */
import { describe, expect, it } from 'vitest';

import { board, iaExport } from '@/test-support/boards';

import {
  COURSE_CODES_TAB,
  missingCountWords,
  savedLine,
  saveWords,
  fieldNameEnd,
} from './course-codes';
import { fieldWords } from './field-words';
import { CONTENT_ACCESS_WORDS, OVERVIEW_WORDS } from './institute-home';
import { ADD_PERSON, PEOPLE_PAGE } from './institute-people';
import { STATE_COPY_PACKAGE_2B } from './state-copy-package-2b';
import {
  ALL_EXPERIMENTS_PAGE,
  allExperimentsCountWords,
  experimentSearchChip,
  formatChip,
  MY_COURSES_TABS,
} from './student';
import { GIVE_ACCESS, STUDENT_ACCESS_PAGE } from './student-access';

function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B2_01 = words('B2-01-IA-Overview.dc.html');
const B2_02 = words('B2-02-Content-Access.dc.html');
const B2_04 = words('B2-04-Student-Access.dc.html');
const B2_05 = words('B2-05-Give-Students-Access.dc.html');
const B2_06 = words('B2-06-People.dc.html');
const B2_07 = words('B2-07-Add-and-Import.dc.html');
const B2_11 = words('B2-11-My-Courses.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('IA-16 Course codes (the V3 export IA-v1, `Main.dc.html` IA-16, `vm16core`, `vm16`)', () => {
  const IA = iaExport('Main.dc.html');
  const IA_WORDS = `${IA.slice(0, IA.indexOf('<script type="text/x-dc"'))
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')}\n${IA}`;

  it.each(strings(COURSE_CODES_TAB))('“%s” is in the export', (phrase) => {
    expect(IA_WORDS).toContain(phrase);
  });

  it('the composed words take the script’s form for its sample', () => {
    expect(missingCountWords(0, 1)).toBe('Your institution’s code is added');
    expect(missingCountWords(1, 1)).toBe('Your institution’s code isn’t added yet');
    expect(IA).toContain(
      "const countText = one ? (c0.own ? 'Your institution’s code is added' : 'Your institution’s code isn’t added yet') : V.countText;",
    );
    expect(saveWords(1)).toBe('Save course code');
    expect(saveWords(2)).toBe('Save course codes');
    expect(IA).toContain("saveText: one ? 'Save course code' : 'Save course codes'");
    expect(savedLine([{ code: 'MEC-523', course: 'Thermodynamics & Heat Transfer' }])).toBe(
      'Course codes saved. Students and faculty at your institution see MEC-523 with Thermodynamics & Heat Transfer.',
    );
    expect(savedLine([])).toBe(
      'Course codes saved. No course has a code from your institution now.',
    );
    expect(IA).toContain(
      "const msg = named.length ? 'Course codes saved. Students and faculty at your institution see ' + this.listText(named) + '.' : 'Course codes saved. No course has a code from your institution now.';",
    );
    expect(IA).toContain(
      "label: 'Your course code for ' + cur.name, semLabel: 'Semester for ' + cur.name + ' (optional)'",
    );
    expect(`Your course code ${fieldNameEnd('Thermodynamics & Heat Transfer')}`).toBe(
      'Your course code for Thermodynamics & Heat Transfer',
    );
    expect(`Semester ${fieldNameEnd('Thermodynamics & Heat Transfer')} (optional)`).toBe(
      'Semester for Thermodynamics & Heat Transfer (optional)',
    );
  });

  it('the plural count is the script’s; the field names are provisional (IA-16.count-plural, IA-16.field-names)', () => {
    expect(missingCountWords(2, 3)).toBe('2 of 3 courses have no code from your institution');
    expect(missingCountWords(1, 3)).toBe('1 of 3 courses has no code from your institution');
    expect(missingCountWords(0, 3)).toBe('Every course has a code from your institution');
    expect(IA).toContain(
      "countText: nMiss ? nMiss + ' of ' + this.plural(rows.length, 'course') + (nMiss === 1 ? ' has' : ' have') + ' no code from your institution' : 'Every course has a code from your institution'",
    );
    expect(STATE_COPY_PACKAGE_2B['IA-16.count-plural'].status).toBe('provisional');
    expect(STATE_COPY_PACKAGE_2B['IA-16.field-names'].status).toBe('provisional');
  });
});

describe('ST-04 All experiments and the My courses tabs (B2-11 f2, f4, f15)', () => {
  it.each([...strings(ALL_EXPERIMENTS_PAGE), ...strings(MY_COURSES_TABS)])(
    '“%s” is on B2-11',
    (phrase) => {
      expect(B2_11).toContain(phrase);
    },
  );

  it('the count and chips follow B2-11’s script', () => {
    expect(allExperimentsCountWords(1, 1, false)).toBe('1 experiment given to you');
    expect(allExperimentsCountWords(0, 1, true)).toBe('0 of 1 experiment');
    expect(allExperimentsCountWords(2, 3, true)).toBe('2 of 3 experiments');
    expect(experimentSearchChip(' Fin-Tube ')).toBe('Search: “Fin-Tube”');
    expect(formatChip('web')).toBe('Format: WEB');
    // B2-11 `mxView`: "Search: “' + s.q.trim() + '”'", "'Format: ' + s.fmt".
    expect(B2_11).toContain('Search: “');
    expect(B2_11).toContain("'Format: '");
    expect(B2_11).toContain("' of ' + all.length + ' experiments'");
  });
});

describe('the actions Package 2B turns on', () => {
  it('each is on the board that draws it', () => {
    expect(B2_01).toContain(OVERVIEW_WORDS.addCourseCode);
    expect(B2_02).toContain(`>${CONTENT_ACCESS_WORDS.addCode}</a>`);
    expect(B2_04).toContain(`>${STUDENT_ACCESS_PAGE.changeOnGroup}</a>`);
    expect(B2_05).toContain(`>${GIVE_ACCESS.importStudents}</a>`);
    expect(B2_06).toContain(`>${PEOPLE_PAGE.importStudents}</a>`);
    expect(B2_06).toContain(`>${PEOPLE_PAGE.tabs.groups}</a>`);
    expect(B2_06).toContain(`>${PEOPLE_PAGE.tabs.facultyCourses}</a>`);
    expect(B2_07).toContain(`>${ADD_PERSON.assignCourse}</a>`);
  });
});

describe('the sample-mode identity safeguard’s words (PC-49)', () => {
  it('are provisional, wait on T-11 and P1-01, and reach the forms through `fieldWords`', () => {
    for (const id of ['IA-10.identity-taken', 'SA-07.identity-taken'] as const) {
      expect(STATE_COPY_PACKAGE_2B[id]).toMatchObject({
        status: 'provisional',
        decisions: ['T-11', 'P1-01'],
      });
    }
    expect(fieldWords({ key: 'IA-10.institutionEmail.identity-taken', message: null })).toBe(
      STATE_COPY_PACKAGE_2B['IA-10.identity-taken'].words,
    );
    expect(fieldWords({ key: 'SA-07.workEmail.identity-taken', message: null })).toBe(
      STATE_COPY_PACKAGE_2B['SA-07.identity-taken'].words,
    );
    expect(fieldWords({ key: 'IA-10.fullName.required', message: 'Enter the full name' })).toBe(
      'Enter the full name',
    );
    expect(fieldWords({ key: 'contract.invalid-input', message: null })).toBeNull();
  });
});
