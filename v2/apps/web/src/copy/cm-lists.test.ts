/**
 * The words of CM-01 Overview (B6-05), CM-02 Ready to publish and CM-04 Content library (B6-06)
 * and CM-09 Course codes (B6-10, B6-11 f12) are the frozen boards’: each drawn phrase is found
 * verbatim in its board’s markup or script, the composed ones with the boards’ own sample values
 * (or, where the board composes them in its script, the script’s own pieces); the undrawn forms are
 * provisional entries of the state-copy register, each with its decision and no decision id in its
 * words.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  approvedWhere,
  blockerWords,
  changedCountWords,
  CM_OVERVIEW,
  codeFieldLabel,
  codesSavedWords,
  CONTENT_LIBRARY,
  COURSE_CODES,
  courseMeta,
  libraryCountWords,
  newSubmissionWhere,
  openDecisionLabel,
  openLabel,
  openUpdateTag,
  overviewStatusLine,
  PUBLICATION_CHECK_WORDS,
  publishedWhere,
  READY_TO_PUBLISH,
  readyCountWords,
  readySub,
  readyTitle,
  reasonExcerpt,
  recheckSub,
  recheckTitle,
  recheckWhere,
  returnedByReviewerWhere,
  revisionWhere,
  sentBackWhere,
  updateAwaitingSub,
  updateAwaitingTitle,
  updateInReviewSub,
  updateInReviewTitle,
  updateOnHoldSub,
  updateOnHoldTitle,
  updateReturnedSub,
  updateReturnedTitle,
} from './cm-lists';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_CM_LISTS } from './state-copy-cm-lists';

/** A board’s text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B6_05 = words('B6-05-CM-Overview.dc.html');
const B6_06 = words('B6-06-Ready-to-Publish-and-Library.dc.html');
const B6_07 = words('B6-07-Publication-Decision.dc.html');
const B6_10 = words('B6-10-Platform-Course-Codes.dc.html');
const B6_11 = words('B6-11-Critical-States.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

/** The sample world’s instants for the boards’ dates (Indian time). */
const AUG_14 = '2026-08-14T09:40:00.000Z';
const AUG_20 = '2026-08-20T04:30:00.000Z';
const AUG_21 = '2026-08-21T04:30:00.000Z';
const AUG_24 = '2026-08-24T04:30:00.000Z';
const AUG_25 = '2026-08-25T04:30:00.000Z';
const AUG_26 = '2026-08-26T04:30:00.000Z';
const REASON =
  'The proposed description says slip falls as the load rises. It rises. Please correct it before I approve.';

describe('CM-01 Overview (B6-05 f0 … f2)', () => {
  it.each(strings(CM_OVERVIEW))('“%s” is on B6-05', (phrase) => {
    expect(B6_05).toContain(phrase);
  });

  it('the status line: B6-05’s three facts, the correction count in its script’s two forms', () => {
    const line = overviewStatusLine({ ready: 2, corrections: 1, withOthers: 3 });
    expect(line.map((fact) => `${fact.n} ${fact.t}`).join(' · ')).toBe(
      '2 ready to publish · 1 correction needs you · 3 with others',
    );
    for (const fact of line) expect(B6_05).toContain(`'${fact.t}'`);
    expect(overviewStatusLine({ ready: 0, corrections: 0, withOthers: 0 })[1]!.t).toBe(
      'corrections need you',
    );
    expect(B6_05).toContain("'corrections need you'");
  });

  it('the ready rows, as f0 draws them', () => {
    expect(readyTitle('Transient Cooling')).toBe('Ready to publish: Transient Cooling');
    expect(B6_05).toContain("'Ready to publish: ' + cqAll[0].name");
    expect(
      readySub({ id: 'SUB-0074', courseCode: 'ME ZG523', approvedAt: AUG_14, oldestOf: 2 }),
    ).toBe('SUB-0074 · ME ZG523 · approved 14 Aug 2026 · oldest of 2');
    expect(B6_05).toContain("' · approved ' + cqAll[0].appr + ' · oldest of '");
    expect(readySub({ id: 'SUB-0070', courseCode: 'CHE ZG513', approvedAt: AUG_21 })).toBe(
      'SUB-0070 · CHE ZG513 · approved 21 Aug 2026',
    );
    // No platform code: the code is left out (state-copy `CM-lists.no-course-code`).
    expect(readySub({ id: 'SUB-0070', courseCode: null, approvedAt: AUG_21 })).toBe(
      'SUB-0070 · approved 21 Aug 2026',
    );
    expect(openDecisionLabel('Packed Bed Pressure Drop')).toBe(
      'Open decision for Packed Bed Pressure Drop',
    );
    expect(B6_05).toContain("aria: 'Open decision for ' + x.name");
  });

  it('the returned correction: the reason’s first sentence, cut with “…”', () => {
    expect(updateReturnedTitle('Induction Motor Loading', '1.1')).toBe(
      'Update returned: Induction Motor Loading 1.1',
    );
    expect(B6_05).toContain(updateReturnedTitle('Induction Motor Loading', '1.1'));
    expect(updateReturnedSub({ id: 'UPD-0006', returnedAt: AUG_26, reason: REASON })).toBe(
      'UPD-0006 · returned by the Academic Reviewer on 26 Aug 2026 · “The proposed description says slip falls as the load rises…”',
    );
    expect(B6_05).toContain(
      updateReturnedSub({ id: 'UPD-0006', returnedAt: AUG_26, reason: REASON }),
    );
    expect(reasonExcerpt('One sentence only.')).toBe('One sentence only.');
    expect(reasonExcerpt('No full stop')).toBe('No full stop');
  });

  it('“With others”: B6-05’s rows, the awaiting-release row from the register', () => {
    expect(B6_05).toContain(recheckTitle('Venturi Meter Calibration'));
    expect(B6_05).toContain(recheckSub('SUB-0071', AUG_25));
    expect(B6_05).toContain(updateInReviewTitle('Distillation Column', '1.3'));
    expect(B6_05).toContain(updateInReviewSub('UPD-0005', AUG_25));
    expect(B6_05).toContain(updateOnHoldTitle('Boiler Drum Level', '2.1'));
    expect(B6_05).toContain(updateOnHoldSub('UPD-0004', AUG_20, '2.0'));
    expect(updateAwaitingTitle('Distillation Column', '1.3')).toBe(
      'Distillation Column 1.3 — awaiting release decision',
    );
    expect(updateAwaitingSub('UPD-0005', AUG_26)).toBe(
      'UPD-0005 · the Academic Reviewer approved it on 26 Aug 2026',
    );
    expect(openLabel('Venturi Meter Calibration')).toBe('Open Venturi Meter Calibration');
    expect(B6_05).toContain("aria: (s.ltab === 'ready' ? 'Open decision for ' : 'Open ') + x.name");
  });
});

describe('CM-02 Ready to publish (B6-06 f0, f2, f3)', () => {
  it.each(strings(READY_TO_PUBLISH))('“%s” is on B6-06', (phrase) => {
    expect(B6_06).toContain(phrase);
  });

  it('the count and the blocked check, as f0 and f2 draw them and its script composes them', () => {
    expect(readyCountWords(3)).toBe('3 experiments approved and waiting · oldest first');
    expect(B6_06).toContain(
      "plural(cqAll.length, 'experiment') + ' approved and waiting · oldest first'",
    );
    expect(readyCountWords(1)).toBe('1 experiment approved and waiting · oldest first');
    expect(blockerWords(['learning-outcomes'])).toBe('1 to resolve: learning outcomes');
    expect(B6_06).toContain(blockerWords(['learning-outcomes']));
    expect(blockerWords(['learning-outcomes', 'catalogue-details'])).toBe('2 things to resolve');
    expect(B6_06).toContain("plural(x.block, 'thing') + ' to resolve'");
  });

  it.each(Object.values(PUBLICATION_CHECK_WORDS))('the check “%s” is B6-07’s', (name) => {
    expect(B6_07).toContain(`t: '${name}'`);
  });
});

describe('CM-04 Content library (B6-06 f1, f4)', () => {
  it.each(strings(CONTENT_LIBRARY))('“%s” is on B6-06', (phrase) => {
    expect(B6_06).toContain(phrase);
  });

  it('the count and every drawn “Where it is”', () => {
    expect(libraryCountWords('Ready', 3, 3)).toBe('Ready · 3 of 3');
    expect(B6_06).toContain("o.lCount = lShown.length + ' of ' + libSets[s.ltab].length");
    expect(approvedWhere(AUG_14, 0)).toBe('Approved 14 Aug 2026');
    expect(B6_06).toContain("st: 'Approved ' + x.appr");
    expect(approvedWhere(AUG_21, 1)).toBe('Approved 21 Aug 2026 · 1 to resolve');
    expect(B6_06).toContain("(x.block ? ' · 1 to resolve' : '')");
    expect(B6_06).toContain(newSubmissionWhere(AUG_24));
    expect(B6_06).toContain(recheckWhere(AUG_25));
    expect(B6_06).toContain(returnedByReviewerWhere(AUG_24));
    expect(revisionWhere(2)).toBe('Revision 2 · with the Academic Reviewer');
    expect(B6_06).toContain("'Revision ' + s.rev + ' · with the Academic Reviewer'");
    expect(B6_06).toContain("'You sent it back'");
    expect(sentBackWhere(AUG_26)).toBe('You sent it back · 26 Aug 2026');
    expect(publishedWhere('1.0', '2026-06-02T04:30:00.000Z', null)).toBe(
      'Version 1.0 · live since 2 Jun 2026',
    );
    for (const state of ['returned', 'in-academic-review', 'on-hold'] as const) {
      const tag = openUpdateTag(state)!;
      expect(B6_06).toContain(`"tag": "${tag}"`);
    }
    expect(B6_06).toContain("'Version ' + x.ver + ' · live since ' + x.since");
    expect(openUpdateTag('draft')).toBe('Update in progress');
    expect(openUpdateTag('awaiting-release-decision')).toBe('Update awaiting release decision');
    expect(openUpdateTag('released')).toBeNull();
  });
});

describe('CM-09 Course codes (B6-10 f0 … f2; B6-11 f12)', () => {
  it.each(strings(COURSE_CODES))('“%s” is on B6-10', (phrase) => {
    expect(B6_10).toContain(phrase);
  });

  it('the composed words are B6-10’s, with its sample values or its script’s pieces', () => {
    expect(codeFieldLabel('Fluid Mechanics')).toBe('Platform course code for Fluid Mechanics');
    expect(B6_10).toContain("label: 'Platform course code for ' + r.name");
    expect(courseMeta('Mechanical & Manufacturing', 3)).toBe(
      'Mechanical & Manufacturing · 3 published experiments',
    );
    expect(courseMeta('Electrical & Electronics', 1)).toBe(
      'Electrical & Electronics · 1 published experiment',
    );
    expect(B6_10).toContain(
      "n: r.n === 1 ? '1 published experiment' : r.n + ' published experiments'",
    );
    expect(B6_10).toContain('{{ r.area }} · {{ r.n }}');
    expect(changedCountWords(6)).toBe('6 changes not saved');
    expect(changedCountWords(1)).toBe('1 change not saved');
    expect(B6_10).toContain("nChanged + ' change' + (nChanged === 1 ? '' : 's') + ' not saved'");
    expect(codesSavedWords('2026-08-27T11:10:00.000Z')).toBe(
      'Codes saved · 27 Aug 2026, 16:40 · the catalogue shows them from now on',
    );
    expect(B6_10).toContain(
      "'Codes saved · ' + D.when + ' · the catalogue shows them from now on'",
    );
    expect(B6_10).toContain('"when": "27 Aug 2026, 16:40"');
    // The duplicate’s words and the summary’s title are the service catalogue’s (CM-09.code.taken),
    // as B6-10’s script composes them and B6-11 f12 draws them.
    expect(B6_10).toContain(
      "T(r.code) + ' is already the code for ' + c.rows[seen[k]].name + '. Each course needs its own code.'",
    );
    expect(B6_10).toContain('<strong>Check the codes</strong>');
    expect(B6_11).toContain('<strong>Check the codes</strong>');
  });
});

describe('the state-copy entries of the Content Manager lists', () => {
  const entries = Object.entries(STATE_COPY_CM_LISTS);

  it.each(entries)(
    '%s is provisional, waits on a decision, and is in the register',
    (id, entry) => {
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      const shown = [entry.words ?? ''].join(' ');
      expect(shown).not.toMatch(/\b(?:VD|OD|PC|CC|P0|P1|DEV)-[A-Z0-9-]+/);
      expect(shown).not.toMatch(/'/);
    },
  );
});
