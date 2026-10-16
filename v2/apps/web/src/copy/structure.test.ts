/**
 * The words of SA-14 Academic structure and SA-15 Area / course record are the frozen B7-07
 * board’s: each drawn phrase is found verbatim in its markup or script, the composed ones with the
 * board’s own sample values (or, where the board composes them in its script, the script’s own
 * pieces); the two sentences with the decision id “(D3)” are shown without it (P1-14 / VD-10);
 * the undrawn forms are entries of the state-copy register, each with its decision and no
 * decision id in its words.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import { STATE_COPY } from './state-copy';
import { STATE_COPY_STRUCTURE } from './state-copy-structure';
import {
  ADD_AREA_DIALOG,
  ADD_COURSE_DIALOG,
  areaCourseLine,
  blockedWords,
  courseAddedNote,
  courseAddedWords,
  courseCountWords,
  courseOverline,
  DESCRIPTION_DIALOG,
  descriptionTitle,
  facultyUseWords,
  historyWhat,
  institutionUseWords,
  MOVE_PANEL,
  movedWords,
  movesWithItWords,
  moveTitle,
  openAreaLabel,
  openCourseLabel,
  publishedWords,
  RECORD_PAGE,
  RENAME_DIALOG,
  renamedNote,
  renameLabel,
  renameTitle,
  renameWarning,
  STRIPPED_STRUCTURE,
  STRUCTURE_PAGE,
  structureSummary,
  usesList,
} from './structure';

/** A board’s text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B7_07 = words('B7-07-Academic-Structure.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('SA-14 Academic structure (B7-07 f0, f7)', () => {
  const drawn = strings(STRUCTURE_PAGE);
  it.each(drawn)('“%s” is on B7-07', (phrase) => {
    expect(B7_07).toContain(phrase);
  });

  it('the header line: the script’s two counts and f0’s tail', () => {
    expect(structureSummary(3, 6)).toBe(
      '3 engineering areas · 6 courses · feeds the public explorer, the catalogue, Vendor course lists and student-import matching',
    );
    expect(B7_07).toContain(
      "plural(A.length, 'engineering area') + ' · ' + plural(C.length, 'course')",
    );
    expect(B7_07).toContain(
      '· feeds the public explorer, the catalogue, Vendor course lists and student-import matching',
    );
    expect(structureSummary(1, 1)).toMatch(/^1 engineering area · 1 course · /);
  });

  it('an area’s head and a course row, as f0 draws them', () => {
    expect(courseCountWords(3)).toBe('3 courses');
    expect(courseCountWords(1)).toBe('1 course');
    expect(B7_07).toContain("n: plural(cs.length, 'course')");
    expect(publishedWords(4)).toBe('4 published experiments');
    expect(publishedWords(1)).toBe('1 published experiment');
    expect(publishedWords(0)).toBe('no published experiments yet');
    expect(B7_07).toContain(
      "exps: c.exps ? plural(c.exps, 'published experiment') : 'no published experiments yet'",
    );
    expect(openAreaLabel('Chemical & Process')).toBe('Open area Chemical & Process');
    expect(B7_07).toContain("aria: 'Open area ' + a.name");
    expect(openCourseLabel('Fluid Mechanics')).toBe('Open Fluid Mechanics');
    expect(B7_07).toContain("aria: 'Open ' + c.name");
  });

  it.each([...strings(ADD_AREA_DIALOG), ...strings(ADD_COURSE_DIALOG)])(
    'the Add dialogs: “%s” is on B7-07',
    (phrase) => {
      expect(B7_07).toContain(phrase);
    },
  );

  it('a course added: the script’s flash with the area’s name', () => {
    expect(courseAddedWords('Chemical & Process')).toBe(
      'Course added to Chemical & Process. It has no platform code yet — the Content Manager adds it in Course codes.',
    );
    expect(B7_07).toContain(
      "'Course added to ' + aName(c0.area) + '. It has no platform code yet — the Content Manager adds it in Course codes.'",
    );
  });
});

describe('SA-15 Area / course record (B7-07 f1 … f6, f8; B7-10 f9)', () => {
  it.each(strings(RECORD_PAGE))('“%s” is on B7-07', (phrase) => {
    expect(B7_07).toContain(phrase);
  });

  it.each([...strings(RENAME_DIALOG), ...strings(DESCRIPTION_DIALOG), ...strings(MOVE_PANEL)])(
    'the dialogs and the move panel: “%s” is on B7-07',
    (phrase) => {
      expect(B7_07).toContain(phrase);
    },
  );

  it('the overline, the area’s course lines and the dialog titles', () => {
    expect(courseOverline('Chemical & Process')).toBe('Course · Chemical & Process');
    expect(B7_07).toContain("'Course · ' + aName(c.area)");
    expect(areaCourseLine('Process Instrumentation & Control', 'CHE ZG513')).toBe(
      'Process Instrumentation & Control · CHE ZG513',
    );
    expect(areaCourseLine('Fluid Mechanics', null)).toBe('Fluid Mechanics · no platform code yet');
    expect(B7_07).toContain("(x.code ? ' · ' + x.code : ' · no platform code yet')");
    expect(renameTitle('course')).toBe('Rename course');
    expect(renameTitle('area')).toBe('Rename area');
    expect(B7_07).toContain("'Rename ' + (isC ? 'course' : 'area')");
    expect(renameLabel('course')).toBe('Course name');
    expect(renameLabel('area')).toBe('Area name');
    expect(descriptionTitle('Chemical & Process')).toBe(
      'Edit the description of Chemical & Process',
    );
    expect(B7_07).toContain("'Edit the description of ' + o.dName");
    expect(moveTitle('Manufacturing Processes')).toBe(
      'Move Manufacturing Processes to another area',
    );
  });

  it('the rename warning: where the name shows, and what stays (f6)', () => {
    expect(renameWarning({ kind: 'course', platformCode: 'ME ZG523' })).toBe(
      'The new name shows in the public explorer, the catalogue, Vendor course lists and student-import matching. The platform code ME ZG523 and every institution’s own course code stay as they are.',
    );
    expect(renameWarning({ kind: 'course', platformCode: null })).toBe(
      'The new name shows in the public explorer, the catalogue, Vendor course lists and student-import matching. The platform code and every institution’s own course code stay as they are.',
    );
    expect(renameWarning({ kind: 'area' })).toBe(
      'The new name shows in the public explorer, the catalogue, Vendor course lists and student-import matching. Its courses stay in it.',
    );
    expect(B7_07).toContain(
      "o.renWarn = 'The new name shows in the public explorer, the catalogue, Vendor course lists and student-import matching. ' + (isC ? 'The platform code' + (c.code ? ' ' + c.code : '') + ' and every institution’s own course code stay as they are.' : 'Its courses stay in it.');",
    );
  });

  it('move blocked (f3; B7-10 f9): who is filed, and where it stays', () => {
    expect(blockedWords(12, 'Dr S. Ranganathan — Godavari', 'Mechanical & Manufacturing')).toBe(
      'People are filed against this course — 12 students · Dr S. Ranganathan — Godavari. It stays in Mechanical & Manufacturing.',
    );
    expect(B7_07).toContain("'People are filed against this course — ' + [c.students ? plural(");
    expect(B7_07).toContain("'. It stays in ' + aName(c.area) + '.'");
    expect(blockedWords(0, '1 Faculty member — Deccan', 'Electrical & Electronics')).toBe(
      'People are filed against this course — 1 Faculty member — Deccan. It stays in Electrical & Electronics.',
    );
  });

  it('move allowed (f4): what moves with it, in the script’s forms', () => {
    expect(movesWithItWords(2, 1, 0)).toBe(
      'Its 2 published experiments, 1 institution’s access move with it. The explorer and catalogue show it under the new area.',
    );
    expect(movesWithItWords(1, 0, 1)).toBe(
      'Its 1 published experiment and 1 Vendor’s course list move with it. The explorer and catalogue show it under the new area.',
    );
    expect(B7_07).toContain(
      "'Its ' + plural(c.exps, 'published experiment') + (c.insts.length ? ', ' + plural(c.insts.length, 'institution') + '’s access' : '') + (c.vendors.length ? ' and ' + plural(c.vendors.length, 'Vendor') + '’s course list' : '') + ' move with it. The explorer and catalogue show it under the new area.'",
    );
    expect(movesWithItWords(0, 0, 0)).toBe(
      'Nothing else uses it yet. The explorer and catalogue show it under the new area.',
    );
    expect(B7_07).toContain(
      "'Nothing else uses it yet. The explorer and catalogue show it under the new area.'",
    );
    // More than one: the plural possessive (state-copy `SA-15.moves-with-it`).
    expect(movesWithItWords(3, 2, 2)).toBe(
      'Its 3 published experiments, 2 institutions’ access and 2 Vendors’ course lists move with it. The explorer and catalogue show it under the new area.',
    );
    expect(movedWords('Manufacturing Processes', 'Electrical & Electronics')).toBe(
      'Manufacturing Processes is now in Electrical & Electronics.',
    );
    expect(B7_07).toContain("c.name + ' is now in ' + to + '.'");
  });

  it('“What uses this course”: the board’s values from the record’s facts', () => {
    expect(institutionUseWords('Godavari Institute of Technology', 'MEC-523', false)).toBe(
      'Godavari Institute of Technology (MEC-523)',
    );
    expect(B7_07).toContain('Godavari Institute of Technology (MEC-523)');
    expect(institutionUseWords('Malnad College of Engineering', null, true)).toBe(
      'Malnad College of Engineering (ended)',
    );
    expect(B7_07).toContain('Malnad College of Engineering (ended)');
    expect(institutionUseWords('Sahyadri Institute of Engineering', null, false)).toBe(
      'Sahyadri Institute of Engineering',
    );
    expect(institutionUseWords('Godavari Institute of Technology', 'MEC-523', true)).toBe(
      'Godavari Institute of Technology (MEC-523, ended)',
    );
    expect(facultyUseWords('Godavari', ['Dr S. Ranganathan'])).toBe('Dr S. Ranganathan — Godavari');
    expect(B7_07).toContain('Dr S. Ranganathan — Godavari');
    expect(facultyUseWords('BITS Pilani — Hyderabad Campus', ['A', 'B', 'C', 'D'])).toBe(
      '4 Faculty members — BITS Pilani — Hyderabad Campus',
    );
    expect(B7_07).toContain('4 Faculty members — BITS Pilani — Hyderabad Campus');
    expect(usesList([])).toBe('None');
    expect(
      usesList(['BITS Pilani — Hyderabad Campus', 'Malnad College of Engineering (ended)']),
    ).toBe('BITS Pilani — Hyderabad Campus · Malnad College of Engineering (ended)');
    expect(B7_07).toContain("c.insts.join(' · ') || 'None'");
  });

  it('History: each event as B7-07 words it', () => {
    expect(historyWhat('area-added', 'Arjun Mehta', null)).toBe('Area added by Arjun Mehta');
    expect(B7_07).toContain("'Area added by ' + D.sa");
    expect(historyWhat('course-added', 'Arjun Mehta', null)).toBe('Course added by Arjun Mehta');
    expect(B7_07).toContain('Course added by Arjun Mehta');
    expect(historyWhat('renamed', 'Arjun Mehta', 'Fluid Mechanics')).toBe('Renamed by Arjun Mehta');
    expect(B7_07).toContain("'Renamed by ' + D.sa");
    expect(historyWhat('description-changed', 'Arjun Mehta', null)).toBe(
      'Description changed by Arjun Mehta',
    );
    expect(B7_07).toContain("'Description changed by ' + D.sa");
    expect(historyWhat('course-moved', 'Arjun Mehta', null)).toBe('Moved by Arjun Mehta');
    expect(B7_07).toContain("'Moved by ' + D.sa");
    expect(historyWhat('platform-code-set', 'Kavya Nair', 'CHE ZG513')).toBe(
      'Platform code CHE ZG513 set by the Content Manager',
    );
    expect(B7_07).toContain('Platform code CHE ZG513 set by the Content Manager');
    // A cleared code is the register’s provisional words.
    expect(historyWhat('platform-code-set', 'Kavya Nair', null)).toBe(
      STATE_COPY['SA-15.history.code-cleared'].words,
    );
    expect(renamedNote('Thermodynamics & Heat Transfer')).toBe(
      'Was “Thermodynamics & Heat Transfer”.',
    );
    expect(B7_07).toContain("'Was “' + old + '”.'");
    expect(courseAddedNote('Mechanical & Manufacturing')).toBe(
      'Mechanical & Manufacturing · no platform code yet.',
    );
    expect(B7_07).toContain('Mechanical & Manufacturing · no platform code yet.');
    expect(courseAddedNote(null)).toBe('No platform code yet.');
  });
});

describe('P1-14 / VD-10: two sentences without “(D3)”, traceable to B7-07', () => {
  it.each(Object.entries(STRIPPED_STRUCTURE))('%s', (_, sentence) => {
    expect(B7_07).toContain(sentence.drawn);
    expect(sentence.ids).toEqual(['D3']);
    expect(sentence.words).toBe(sentence.drawn.replace(' (D3)', ''));
  });

  it('no product word on SA-14 or SA-15 carries a decision id', () => {
    for (const text of [
      ...strings(STRUCTURE_PAGE),
      ...strings(RECORD_PAGE),
      ...strings(ADD_AREA_DIALOG),
      ...strings(ADD_COURSE_DIALOG),
      ...strings(RENAME_DIALOG),
      ...strings(DESCRIPTION_DIALOG),
      ...strings(MOVE_PANEL),
      ...Object.values(STRIPPED_STRUCTURE).map((sentence) => sentence.words),
    ]) {
      expect(text).not.toMatch(/\((?:T|D|OD|PC)-?[\w-]*\d+\)/);
    }
  });
});

describe('the state-copy register for SA-14 and SA-15', () => {
  it.each(Object.entries(STATE_COPY_STRUCTURE))(
    '%s: a screen, a basis, a decision, no decision id in its words',
    (_, entry) => {
      expect(['SA-14', 'SA-15']).toContain(entry.screen);
      expect(entry.basis.length).toBeGreaterThan(10);
      expect(entry.decisions?.length).toBeGreaterThan(0);
      if (entry.words !== null) {
        expect(entry.words).not.toMatch(/\b(?:VD|OD|PC|P1|T)-\d/);
        expect(entry.words).not.toMatch(/\(D\d+\)/);
      }
    },
  );

  it('sample labels and decision ids are the owner’s decisions, not invented', () => {
    expect(STATE_COPY_STRUCTURE['SA-14.decision-ids'].status).toBe('owner-approved');
    expect(STATE_COPY_STRUCTURE['SA-15.sample-label'].status).toBe('owner-approved');
    expect(STATE_COPY_STRUCTURE['SA-15.move-rule'].decisions).toEqual(['OD-B7-12']);
  });
});
