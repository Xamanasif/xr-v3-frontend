/**
 * The words of the Academic Reviewer's lists — RV-01 Overview, RV-02 Review queue and RV-05
 * Reviewed by me — are the owner-approved V3 export's (design/v3-refined-b/roles/RV-v1
 * `project/RV.dc.html`): each drawn phrase is in its template or script verbatim, and each composed
 * line takes the script's form (`overviewVals`, `queueVals`, `reviewedVals`, `fromOf`, `focusOf`)
 * with the records' values — and no line or name carries an internal reference. The undrawn forms
 * and rules are provisional entries of the state-copy register, each with its decision and no
 * decision id in its words.
 */
import { describe, expect, it } from 'vitest';

import { rvExport } from '@/test-support/boards';

import {
  CLEAR_FILTERS,
  courseChip,
  decisionRowLabel,
  decisionsCountWords,
  decisionWords,
  deskActionLabel,
  formatsLabel,
  fromWords,
  LIST_FAILED,
  NO_OUTCOMES_YET,
  newSubmissionsDetail,
  overviewLead,
  overviewStateWords,
  QUEUE_TYPES,
  queueCountWords,
  queueRowLabel,
  queueTypeLabel,
  recentDecisionLabel,
  recentDecisionWords,
  recheckFocus,
  REVIEW_QUEUE,
  REVIEWED_BY_ME,
  REVIEWER_OVERVIEW,
  scopeCourseLabel,
  searchChip,
} from './reviewer-lists';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_REVIEWER_LISTS } from './state-copy-reviewer-lists';

/** The export's text with tags removed and entities read, then its raw markup and script. */
const RAW = rvExport('RV.dc.html');
const ROOT = `${RAW.replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&rsquo;/g, '’')}\n${RAW}`;

const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const RECHECK_REASON =
  'The second learning outcome mentions a Pitot tube, which this experiment does not use. Please check the outcomes.';

describe('the lists’ shared words', () => {
  it.each([...strings(LIST_FAILED), CLEAR_FILTERS, NO_OUTCOMES_YET])(
    '“%s” is in RV.dc.html',
    (phrase) => {
      expect(ROOT).toContain(phrase);
    },
  );

  it('the chips and the formats’ name take the script’s forms', () => {
    expect(searchChip(' dist ')).toBe('Search: “dist”');
    expect(ROOT).toContain("chips.push({ label: 'Search: “' + qRaw.trim() + '”'");
    expect(courseChip('CHE ZG513')).toBe('Course: CHE ZG513');
    expect(ROOT).toContain("chips.push({ label: 'Course: ' + course");
    expect(ROOT).toContain("chips.forEach(c => { c.aria = 'Remove filter ' + c.label; });");
    expect(formatsLabel(['WEB', 'VR'])).toBe('Formats: WEB, VR');
    expect(ROOT).toContain("fmtAria: 'Formats: ' + (R.fmts || []).join(', ')");
  });
});

describe('RV-01 Overview (`overviewVals`)', () => {
  it.each(strings(REVIEWER_OVERVIEW))('“%s” is in RV.dc.html', (phrase) => {
    expect(ROOT).toContain(phrase);
  });

  it.each(strings(QUEUE_TYPES))('the type words “%s” are in RV.dc.html', (phrase) => {
    expect(ROOT).toContain(phrase);
  });

  it('the composed lines take the script’s forms', () => {
    expect(overviewLead(4)).toBe('4 items are waiting for your academic decision, oldest first.');
    expect(overviewLead(1)).toBe('1 item is waiting for your academic decision.');
    expect(overviewLead(0)).toBe('Nothing is waiting for your decision.');
    expect(ROOT).toContain(
      "sub: n ? (n === 1 ? '1 item is waiting for your academic decision.' : n + ' items are waiting for your academic decision, oldest first.') : 'Nothing is waiting for your decision.'",
    );
    expect(newSubmissionsDetail(1)).toBe('From vendors · 1 is a resubmission');
    expect(newSubmissionsDetail(2)).toBe('From vendors · 2 are resubmissions');
    expect(newSubmissionsDetail(0)).toBe('From vendors');
    expect(ROOT).toContain(
      "d: 'From vendors' + (nResub ? ' · ' + nResub + (nResub === 1 ? ' is a resubmission' : ' are resubmissions') : '')",
    );
    expect(queueTypeLabel('New submissions', 2)).toBe(
      'New submissions: 2 items. Open them in the review queue',
    );
    expect(ROOT).toContain(
      "aria: t.t + ': ' + this.plural(t.n, 'item') + '. Open them in the review queue'",
    );
    expect(scopeCourseLabel('CHE ZG513', 'Process Instrumentation & Control')).toBe(
      'CHE ZG513 Process Instrumentation & Control. Open the review queue for this course',
    );
    expect(scopeCourseLabel('MEL ZG512', null)).toBe(
      'MEL ZG512. Open the review queue for this course',
    );
    expect(ROOT).toContain(
      "aria: code + ' ' + this.courseName(code) + '. Open the review queue for this course'",
    );
    expect(deskActionLabel(true, false, 'Flash Distillation')).toBe(
      'Start review: Flash Distillation',
    );
    expect(deskActionLabel(false, true, 'Distillation Column')).toBe(
      'Review the update to Distillation Column',
    );
    expect(deskActionLabel(false, false, 'Venturi Meter Calibration')).toBe(
      'Review Venturi Meter Calibration',
    );
    expect(ROOT).toContain(
      "aria: (i === 0 ? 'Start review: ' : upd ? 'Review the update to ' : 'Review ') + R.name",
    );
    expect(
      [true, false].flatMap((approved) =>
        [false, true].map((update) => recentDecisionWords(approved, update)),
      ),
    ).toEqual(['Approved', 'Update approved', 'Returned to vendor', 'Returned']);
    expect(ROOT).toContain(
      "const dec = h.dec === 'approved' ? (upd ? 'Update approved' : 'Approved') : (upd ? 'Returned' : 'Returned to vendor');",
    );
    expect(
      recentDecisionLabel(
        'Forced Convection',
        'Returned to vendor',
        '24 Aug 2026',
        'With the vendor to revise',
      ),
    ).toBe(
      'Forced Convection, returned to vendor on 24 Aug 2026. Now: With the vendor to revise. Open it',
    );
    expect(ROOT).toContain(
      "aria: R.name + ', ' + dec.toLowerCase() + ' on ' + h.when + '. Now: ' + st.now + '. Open it'",
    );
  });

  it('who sent it and what to look at (`fromOf`, `focusOf`)', () => {
    expect(fromWords({ kind: 'new', who: 'Meridian Virtual Labs' })).toBe(
      'Revision 1 · from Meridian Virtual Labs',
    );
    expect(ROOT).toContain("return 'Revision ' + (R.rev || 1) + ' · from ' + R.who;");
    expect(
      fromWords({
        kind: 'resubmission',
        who: 'Northline Simulation Studio',
        resubmitted: '26 Aug',
      }),
    ).toBe('Resubmitted 26 Aug · from Northline Simulation Studio');
    expect(ROOT).toContain(
      "return (R.resub ? 'Resubmitted ' + this.short(R.resub) + ' · ' : '') + 'from ' + R.who;",
    );
    expect(fromWords({ kind: 'update', person: 'Kavya Nair' })).toBe(
      'From Kavya Nair, Content Manager',
    );
    expect(ROOT).toContain("return 'From ' + R.who + ', Content Manager';");
    // A re-check: the reads hold neither the revision nor who sent it back (`RV-01.recheck-from`).
    expect(fromWords({ kind: 'recheck' })).toBe('Sent back by the Content Manager');
    expect(STATE_COPY['RV-01.recheck-from'].words).toBe(fromWords({ kind: 'recheck' }));
    expect(recheckFocus(RECHECK_REASON)).toBe(
      '“The second learning outcome mentions a Pitot tube, which this experiment…”',
    );
    expect(ROOT).toContain(
      "if (R.st === 'recheck') return { flag: '', text: '“' + this.excerpt(R.recheck.reason, 74) + '”' };",
    );
    expect(recheckFocus('Check the outcomes.')).toBe('“Check the outcomes.”');
    expect(ROOT).toContain(
      "excerpt(t, n) { t = String(t || ''); return t.length <= n ? t : t.slice(0, n).replace(/\\s+\\S*$/, '') + '…'; }",
    );
  });

  it('the undrawn forms are the register’s', () => {
    expect(overviewStateWords('loading')).toBe('Loading your overview');
    expect(overviewStateWords('failed')).toBe('We couldn’t load your overview');
    for (const id of [
      'RV-01.loading',
      'RV-01.failed',
      'RV-01.oldest',
      'RV-01.scope-all',
      'RV-01.recheck-from',
    ] as const) {
      expect(STATE_COPY[id]).toMatchObject({ screen: 'RV-01', status: 'provisional' });
    }
    expect(ROOT).not.toContain('Loading your overview');
  });
});

describe('RV-02 Review queue (`queueVals`)', () => {
  it.each(strings(REVIEW_QUEUE))('“%s” is in RV.dc.html', (phrase) => {
    expect(ROOT).toContain(phrase);
  });

  it('the composed lines take the script’s forms', () => {
    expect(queueCountWords(4, 4, false)).toBe('4 items · oldest first');
    expect(queueCountWords(1, 4, true)).toBe('1 of 4 items · oldest first');
    expect(queueCountWords(0, 1, true)).toBe('0 of 1 item · oldest first');
    expect(ROOT).toContain(
      "count: filtered ? list.length + ' of ' + this.plural(all.length, 'item') + ' · oldest first' : this.plural(all.length, 'item') + ' · oldest first'",
    );
    expect(queueRowLabel('Flash Distillation', 'New submission', null, '24 Aug 2026')).toBe(
      'Flash Distillation, new submission, waiting since 24 Aug 2026. Review it',
    );
    expect(queueRowLabel('Distillation Column', 'Update', '1.2 → 1.3', '25 Aug 2026')).toBe(
      'Distillation Column, update 1.2 → 1.3, waiting since 25 Aug 2026. Review it',
    );
    expect(ROOT).toContain(
      "aria: R.name + ', ' + this.kindOf(id).t.toLowerCase() + (this.kindOf(id).d ? ' ' + this.kindOf(id).d : '') + ', waiting since ' + R.since + '. Review it'",
    );
  });

  it('the undrawn rules are the register’s', () => {
    for (const id of ['RV-02.filters', 'RV-02.focus'] as const) {
      expect(STATE_COPY[id]).toMatchObject({ screen: 'RV-02', status: 'provisional', words: null });
    }
  });
});

describe('RV-05 Reviewed by me (`reviewedVals`)', () => {
  it.each(strings(REVIEWED_BY_ME))('“%s” is in RV.dc.html', (phrase) => {
    expect(ROOT).toContain(phrase);
  });

  it('the composed lines take the script’s forms', () => {
    expect(decisionsCountWords(9, 9, false)).toBe('9 decisions · newest first');
    expect(decisionsCountWords(4, 9, true)).toBe('4 of 9 decisions · newest first');
    expect(ROOT).toContain(
      "count: filtered ? list.length + ' of ' + this.plural(all.length, 'decision') + ' · newest first' : this.plural(all.length, 'decision') + ' · newest first'",
    );
    expect(
      [true, false].flatMap((approved) =>
        [false, true].map((update) => decisionWords(approved, update)),
      ),
    ).toEqual([
      'Approved',
      'Update approved',
      'Returned to vendor',
      'Returned to the Content Manager',
    ]);
    expect(ROOT).toContain(
      "const decLabel = h.dec === 'approved' ? (upd ? 'Update approved' : 'Approved') : (upd ? 'Returned to the Content Manager' : 'Returned to vendor');",
    );
    expect(decisionRowLabel('Forced Convection', 'Returned to vendor', '24 Aug 2026')).toBe(
      'Forced Convection, returned to vendor on 24 Aug 2026. Open it',
    );
    expect(ROOT).toContain(
      "aria: R.name + ', ' + decLabel.toLowerCase() + ' on ' + h.when + '. Open it'",
    );
  });

  it('the undrawn rules are the register’s', () => {
    for (const id of ['RV-05.type', 'RV-05.now'] as const) {
      expect(STATE_COPY[id]).toMatchObject({ screen: 'RV-05', status: 'provisional', words: null });
    }
  });
});

describe('no internal reference, and the register entries', () => {
  it('no word of the lists names a record by its reference', () => {
    for (const phrase of strings({
      LIST_FAILED,
      REVIEWER_OVERVIEW,
      QUEUE_TYPES,
      REVIEW_QUEUE,
      REVIEWED_BY_ME,
    })) {
      expect(phrase).not.toMatch(REFERENCE);
    }
  });

  it.each(Object.entries(STATE_COPY_REVIEWER_LISTS))(
    '%s names no decision id in its words',
    (_, entry) => {
      if (entry.words !== null) expect(entry.words).not.toMatch(/\b[A-Z]{1,3}-[A-Z0-9]+-?\d*\b/);
      expect(entry.decisions.length).toBeGreaterThan(0);
    },
  );
});
