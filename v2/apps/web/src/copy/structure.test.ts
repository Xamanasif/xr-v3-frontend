/**
 * The words of SA-14 Academic structure and SA-15 Area / course record are the owner-approved Super
 * Admin export’s (V3 Refined B, design/v3-refined-b/roles/SA-v1 `sa-views-c.js`): each drawn
 * phrase is found verbatim in its views, the composed ones with the export’s own pieces. The
 * history’s events keep the frozen B7-07 wording (the export draws sample events). The undrawn
 * forms are entries of the state-copy register, each with its decision and no decision id in its
 * words; no word carries an internal reference.
 */
import { describe, expect, it } from 'vitest';

import { board, saExport } from '@/test-support/boards';

import { STATE_COPY } from './state-copy';
import { STATE_COPY_STRUCTURE } from './state-copy-structure';
import {
  ADD_AREA_DIALOG,
  ADD_COURSE_DIALOG,
  addedWords,
  AREA_PAGE,
  blockedWords,
  COURSE_PAGE,
  courseAddedNote,
  courseEyebrow,
  DESCRIPTION_DIALOG,
  descriptionTitle,
  facultyCountWords,
  facultyUseWords,
  historyWhat,
  institutionAfterWords,
  MOVE_DIALOG,
  movedNote,
  movedWords,
  moveTitle,
  openAreaLabel,
  peopleFiledWords,
  publishedWords,
  RENAME_DIALOG,
  renamedNote,
  renamedWords,
  renameTitle,
  STRUCTURE_PAGE,
  STRUCTURE_SHARED,
} from './structure';

/** The export’s views (`sa-views-c.js`) and its core (`sa-core.js`, the dialog frame). */
const VIEWS = saExport('sa-views-c.js');
const CORE = saExport('sa-core.js');

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

describe('SA-14 Academic structure (SA-v1 `V.structure`)', () => {
  it.each(strings(STRUCTURE_PAGE))('“%s” is in the export’s view', (phrase) => {
    expect(VIEWS).toContain(phrase);
  });

  it.each(
    strings({
      noCode: STRUCTURE_SHARED.noCode,
      noDescription: STRUCTURE_SHARED.noDescription,
      noCourses: STRUCTURE_SHARED.noCourses,
      history: STRUCTURE_SHARED.history,
      historyNote: STRUCTURE_SHARED.historyNote,
    }),
  )('shared: “%s” is in the export’s view', (phrase) => {
    expect(VIEWS).toContain(phrase);
  });

  it('Cancel and the separator are the export’s dialog and join', () => {
    expect(CORE).toContain(`>${STRUCTURE_SHARED.cancel}</button>`);
    expect(VIEWS).toContain(`.join('${STRUCTURE_SHARED.separator}')`);
  });

  it('a course row’s experiments: the export’s `SA.plural`', () => {
    expect(publishedWords(4)).toBe('4 published experiments');
    expect(publishedWords(1)).toBe('1 published experiment');
    expect(publishedWords(0)).toBe('0 published experiments');
    expect(VIEWS).toContain("SA.plural(n, 'published experiment')");
  });

  it('“Open area” is named with its visible words first (state-copy `SA-14.open-area-name`)', () => {
    expect(openAreaLabel('Chemical & Process')).toBe('Open area Chemical & Process');
    expect(openAreaLabel('Chemical & Process')).toContain(STRUCTURE_PAGE.openArea);
    // The export’s own name, which the product does not take (WCAG 2.5.3).
    expect(VIEWS).toContain('aria-label="Open the area \' + esc(a.name) + \'"');
    expect(STATE_COPY_STRUCTURE['SA-14.open-area-name'].words).toBeNull();
  });

  it.each([...strings(ADD_AREA_DIALOG), ...strings(ADD_COURSE_DIALOG)])(
    'the Add dialogs: “%s” is in the export’s view',
    (phrase) => {
      expect(VIEWS).toContain(phrase);
    },
  );

  it('added: the export’s flash, with the record’s name', () => {
    expect(addedWords('Civil & Structural')).toBe('Civil & Structural was added.');
    expect(VIEWS).toContain("SA.setFlash('structure', n + ' was added.', 'Add courses to it");
    expect(VIEWS).toContain(
      "n + ' was added.', 'The Content Manager adds its platform course code.'",
    );
  });

  it('the list states are the export’s (state-copy)', () => {
    for (const id of [
      'SA-14.loading',
      'SA-14.failed',
      'SA-14.failed.line',
      'SA-14.empty',
      'SA-14.empty.line',
    ] as const) {
      expect(`${VIEWS}\n${CORE}`).toContain(STATE_COPY[id].words);
    }
  });
});

describe('SA-15 Area record (SA-v1 `V.area`) and Course record (`V.course`)', () => {
  it.each([...strings(AREA_PAGE), ...strings(COURSE_PAGE)])(
    '“%s” is in the export’s view',
    (phrase) => {
      expect(VIEWS).toContain(phrase);
    },
  );

  it('the course head and the blocked notice, in the export’s forms', () => {
    expect(courseEyebrow('Mechanical & Manufacturing')).toBe('Course · Mechanical & Manufacturing');
    expect(VIEWS).toContain('<p class="rk-eyebrow">Course · \' + esc(area.name) + \'</p>');
    expect(blockedWords('12 students')).toBe(
      'People are filed against it: 12 students. Nothing moves.',
    );
    expect(VIEWS).toContain(
      '<p class="rk-notice-d">People are filed against it: \' + esc(c.people.note) + \'. Nothing moves.</p>',
    );
  });

  it('who is filed against it: the record’s facts (state-copy `SA-15.uses.people`)', () => {
    expect(
      peopleFiledWords(12, [
        facultyUseWords('Godavari Institute of Technology', ['Dr S. Ranganathan']),
      ]),
    ).toBe('12 students · Dr S. Ranganathan — Godavari Institute of Technology');
    expect(peopleFiledWords(1, [])).toBe('1 student');
    expect(peopleFiledWords(0, [facultyCountWords(2)])).toBe('2 Faculty members');
    expect(peopleFiledWords(0, [])).toBe('');
    expect(facultyUseWords('BITS Pilani — Hyderabad Campus', ['A', 'B', 'C', 'D'])).toBe(
      '4 Faculty members — BITS Pilani — Hyderabad Campus',
    );
    expect(B7_07).toContain('4 Faculty members — BITS Pilani — Hyderabad Campus');
  });

  it('an institution’s facts after its link (state-copy `SA-15.uses.institutions`)', () => {
    expect(institutionAfterWords('MEC-523', false)).toBe(' (MEC-523)');
    expect(institutionAfterWords(null, true)).toBe(' (ended)');
    expect(institutionAfterWords('MEC-523', true)).toBe(' (MEC-523, ended)');
    expect(institutionAfterWords(null, false)).toBe('');
    expect(B7_07).toContain('Godavari Institute of Technology (MEC-523)');
    expect(B7_07).toContain('Malnad College of Engineering (ended)');
  });
});

describe('SA-15 dialogs (SA-v1 `SA.DLG.area`, `SA.DLG.course`)', () => {
  it.each([...strings(RENAME_DIALOG), ...strings(DESCRIPTION_DIALOG), ...strings(MOVE_DIALOG)])(
    '“%s” is in the export’s view',
    (phrase) => {
      expect(VIEWS).toContain(phrase);
    },
  );

  it('the titles and flashes, in the export’s forms', () => {
    expect(renameTitle('Chemical & Process')).toBe('Rename Chemical & Process');
    expect(VIEWS).toContain("'Rename ' + a.name");
    expect(VIEWS).toContain("'Rename ' + c.name");
    expect(descriptionTitle('Fluid Mechanics')).toBe('Edit the description of Fluid Mechanics');
    expect(VIEWS).toContain("'Edit the description of ' + c.name");
    expect(moveTitle('Manufacturing Processes')).toBe(
      'Move Manufacturing Processes to another area?',
    );
    expect(VIEWS).toContain("'Move ' + c.name + ' to another area?'");
    expect(renamedWords('area', 'Chemical Engineering')).toBe(
      'The area is now called Chemical Engineering.',
    );
    expect(VIEWS).toContain("'The area is now called ' + n + '.'");
    expect(renamedWords('course', 'Heat Transfer')).toBe('The course is now called Heat Transfer.');
    expect(VIEWS).toContain("'The course is now called ' + n + '.'");
    expect(movedWords('Electrical & Electronics')).toBe(
      'The course moved to Electrical & Electronics.',
    );
    expect(VIEWS).toContain(
      "'The course moved to ' + S.areas.find(a => a.id === c.area).name + '.'",
    );
  });
});

describe('History: each event as B7-07 words it (the export draws sample events)', () => {
  it('the events, the notes', () => {
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
    expect(movedNote('Mechanical & Manufacturing', 'Electrical & Electronics')).toBe(
      'From Mechanical & Manufacturing to Electrical & Electronics.',
    );
    expect(courseAddedNote('Mechanical & Manufacturing')).toBe(
      'Mechanical & Manufacturing · no platform code yet.',
    );
    expect(B7_07).toContain('Mechanical & Manufacturing · no platform code yet.');
    expect(courseAddedNote(null)).toBe('No platform code yet.');
  });
});

describe('no decision id or internal reference in a word of SA-14 or SA-15', () => {
  it('every phrase', () => {
    for (const text of [
      ...strings(STRUCTURE_SHARED),
      ...strings(STRUCTURE_PAGE),
      ...strings(AREA_PAGE),
      ...strings(COURSE_PAGE),
      ...strings(ADD_AREA_DIALOG),
      ...strings(ADD_COURSE_DIALOG),
      ...strings(RENAME_DIALOG),
      ...strings(DESCRIPTION_DIALOG),
      ...strings(MOVE_DIALOG),
    ]) {
      expect(text).not.toMatch(/\((?:T|D|OD|PC)-?[\w-]*\d+\)/);
      expect(text).not.toMatch(/\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d/);
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
