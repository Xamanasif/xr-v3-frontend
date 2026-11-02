/**
 * The V3 words of the Institute Admin's People screens are the owner-approved export's (V3 Refined
 * B, design/v3-refined-b/roles/IA-v1 `project/Main.dc.html`): each drawn phrase is in its markup or
 * script verbatim, and each composed line takes the script's form with the records' values (pinned
 * here with the export's own sample values). No phrase names a record by its internal reference.
 */
import { describe, expect, it } from 'vitest';

import { iaExport } from '@/test-support/boards';

import {
  ADD_PERSON_V3,
  addedLine,
  attentionCaption,
  backToWords,
  checkSummaryWords,
  cleanLine,
  coursesSetFoot,
  coursesTaughtCaption,
  FACULTY_COURSES_V3,
  FACULTY_RECORD_V3,
  FACULTY_V3,
  giveStudentAccessLabel,
  GROUPS_V3,
  IMPORT_V3,
  openFacultyLabel,
  ownCourseCodeLine,
  PEOPLE_V3,
  planFormatsLabel,
  rowNumberWords,
  STUDENTS_V3,
  studentsShownWords,
  tabCountWords,
  templateCodeExample,
  templateLine,
  willAddLine,
} from './ia-people';
import { removeFilterLabel, showingLabel } from './ia-shared';
import { rowsCheckedWords, rowsWithErrorsWords, readyWords } from './import-students';

const IA = iaExport('Main.dc.html');
const TEMPLATE = IA.slice(0, IA.indexOf('<script type="text/x-dc"'));
const SCRIPT = IA.slice(IA.indexOf('<script type="text/x-dc"'));
/** The markup with its tags removed and `&amp;` read, then the raw source (attributes, script). */
const WORDS = `${TEMPLATE.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${IA}`;
/** A record's internal reference (the identifier rule: never in a People word). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|GRP|FMAP)-\d+/;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const DRAWN = [
  ...strings(PEOPLE_V3),
  // UX-20: the search hint is shortened from the export's (tested below).
  ...strings(STUDENTS_V3).filter((phrase) => phrase !== STUDENTS_V3.searchPlaceholder),
  ...strings(FACULTY_V3),
  ...strings(GROUPS_V3),
  ...strings(FACULTY_COURSES_V3),
  ...strings(FACULTY_RECORD_V3),
  ...strings(ADD_PERSON_V3),
  ...strings(IMPORT_V3),
];

describe('the People screens’ V3 words are the export’s', () => {
  it.each(DRAWN)('“%s”', (phrase) => {
    expect(WORDS).toContain(phrase);
  });

  it('UX-20: the export’s search hint, shortened so it fits at 375 px; the name stays the export’s', () => {
    expect(WORDS).toContain('Search name, student ID or e-mail');
    expect(STUDENTS_V3.searchPlaceholder).toBe('Name, ID or e-mail');
    expect(WORDS).toContain(STUDENTS_V3.searchLabel);
  });

  it('no phrase names a record by its internal reference', () => {
    for (const phrase of DRAWN) expect(phrase).not.toMatch(REFERENCE);
  });
});

describe('the composed lines take the script’s form', () => {
  it('the tabs, the chips and the counts (`peopleHead`, `vm06`, `vm08`)', () => {
    expect(TEMPLATE).toContain('<span class="xr-sr">, {{ t.nText }}</span>');
    expect(tabCountWords('12 students')).toBe(', 12 students');
    expect(SCRIPT).toContain("c.aria = 'Remove filter ' + c.label");
    expect(removeFilterLabel('Search: “Meenakshi”')).toBe('Remove filter Search: “Meenakshi”');
    expect(SCRIPT).toContain("shownText: 'Showing ' + list.length + ' of ' + cur.n");
    expect(showingLabel(5, 12)).toBe('Showing 5 of 12');
    expect(SCRIPT).toContain("liveText: this.plural(list.length, 'student') + ' shown'");
    expect(studentsShownWords(5)).toBe('5 students shown');
    expect(studentsShownWords(1)).toBe('1 student shown');
    expect(SCRIPT).toContain("giveAria: 'Give ' + S.n + ' access'");
    expect(giveStudentAccessLabel('Ananya Das')).toBe('Give Ananya Das access');
    expect(SCRIPT).toContain("grpLab: gs.length ? (gs.length > 1 ? 'Groups: ' : 'Group: ') : ''");
  });

  it('the faculty and groups lists (`vm08`, `vm13`, `expBadges`)', () => {
    expect(SCRIPT).toContain("aria: 'Open faculty record: ' + F.n");
    expect(openFacultyLabel('Dr S. Ranganathan')).toBe('Open faculty record: Dr S. Ranganathan');
    expect(SCRIPT).toContain("fmAria: 'Formats from your plan: ' + (x.fmtsOf[e] || []).join(', ')");
    expect(planFormatsLabel(['WEB', 'VR'])).toBe('Formats from your plan: WEB, VR');
  });

  it('the faculty record (`vm09`)', () => {
    expect(TEMPLATE).toContain('<span>Added {{ V.added }}</span>');
    expect(addedLine('8 Oct 2026 · Meera Iyer')).toBe('Added 8 Oct 2026 · Meera Iyer');
    expect(TEMPLATE).toContain('Your course code {{ c.own }}');
    expect(ownCourseCodeLine('MEC-523')).toBe('Your course code MEC-523');
    expect(TEMPLATE).toContain('<caption>Courses taught by {{ V.n }}</caption>');
    expect(coursesTaughtCaption('Dr S. Ranganathan')).toBe('Courses taught by Dr S. Ranganathan');
    expect(TEMPLATE).toContain(
      'These courses set what {{ V.n }} sees in the Faculty workspace. They never give students access.',
    );
    expect(coursesSetFoot('Dr S. Ranganathan')).toBe(
      'These courses set what Dr S. Ranganathan sees in the Faculty workspace. They never give students access.',
    );
  });

  it('add a person (`vm10`)', () => {
    expect(TEMPLATE).toContain('>Back to {{ V.backT }}</a>');
    expect(backToWords('Students')).toBe('Back to Students');
    expect(SCRIPT).toContain(
      "sidHint: W.students.length ? 'Your institution’s ID, for example ' : 'Your institution’s ID for this student.'",
    );
  });

  it('import students (`vm11`, `checkRows`)', () => {
    expect(TEMPLATE).toContain(
      'One row per student. Every column is required: the student’s details (student_id, full_name, email), their programme, the course and its course_code — the BITS code (for example {{ V.exCode }}){{ V.exOwn }}.',
    );
    expect(SCRIPT).toContain(
      "exOwn: own ? ' or your institution’s code (' + own + ')' : ' or your institution’s own code for the course'",
    );
    const columns = ['student_id', 'full_name', 'email', 'programme', 'course', 'course_code'];
    expect(templateLine(columns, templateCodeExample('ME ZG523', 'MEC-523'))).toBe(
      'One row per student. Every column is required: the student’s details (student_id, full_name, email), their programme, the course and its course_code — the BITS code (for example ME ZG523) or your institution’s code (MEC-523).',
    );
    expect(templateCodeExample('ME ZG523', null)).toBe(
      'the BITS code (for example ME ZG523) or your institution’s own code for the course.',
    );
    expect(TEMPLATE).toContain(`<caption>${attentionCaption()}</caption>`);
    expect(TEMPLATE).toContain('>Row {{ p.row }}</span>');
    expect(rowNumberWords(6)).toBe('Row 6');
    expect(SCRIPT).toContain(
      "this.plural(rep.total, 'row') + ' checked · ' + rep.ok + ' ready to import · ' + this.plural(rep.errors, 'row') + ' with errors'",
    );
    expect(checkSummaryWords([rowsCheckedWords(13), readyWords(9), rowsWithErrorsWords(4)])).toBe(
      '13 rows checked · 9 ready to import · 4 rows with errors',
    );
    expect(SCRIPT).toContain(
      "'All ' + this.plural(rep.total, 'row') + ' have every required column, and nobody in the file is already in People.'",
    );
    expect(cleanLine(12)).toBe(
      'All 12 rows have every required column, and nobody in the file is already in People.',
    );
    expect(SCRIPT).toContain("' be added to People from ' + (I.file ? I.file.name : '') + '.'");
    expect(willAddLine('12 students', 'godavari-me-zg523-corrected.csv')).toBe(
      '12 students will be added to People from godavari-me-zg523-corrected.csv.',
    );
  });
});
