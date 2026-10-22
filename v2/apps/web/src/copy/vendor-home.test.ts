/**
 * The words of VE-01 Overview and VE-02 My experiments are the owner-approved Vendor export's
 * (V3 Refined B, design/v3-refined-b/roles/VE-v1 `project/Main.dc.html`): each drawn phrase is in
 * its markup or script verbatim, and each composed line takes the script's form with the records'
 * values — except that no line or name carries the submission's reference: where the script's
 * form writes one, it is left out (the owner's identifier rule for the Vendor, 22 Oct 2026;
 * state-copy `VE-02.no-reference`). The undrawn forms and rules are provisional entries of the
 * state-copy register, each with its decision and no decision id in its words.
 */
import { describe, expect, it } from 'vitest';

import { veExport } from '@/test-support/boards';

import { STATE_COPY } from './state-copy';
import { STATE_COPY_VENDOR_HOME } from './state-copy-vendor-home';
import {
  activityName,
  attentionCountWords,
  courseLine,
  courseWords,
  CREATE_EXPERIMENT,
  draftRowLine,
  editDraftRowName,
  experimentCountWords,
  experimentRowName,
  experimentsWords,
  finishDraftName,
  formatsName,
  HISTORY_WORDS,
  leadMeta,
  MY_EXPERIMENTS_SEARCH,
  MY_EXPERIMENTS_WORDS,
  onDay,
  READ_ONLY_DRAFT,
  resubmittedWords,
  RETURNED,
  RETURNED_BY_WORDS,
  returnedRowLine,
  reviseLabel,
  reviseName,
  reviseRowName,
  STATUS_LINES,
  STATUS_TABS,
  statusTabName,
  VENDOR_FAILED_WORDS,
  VENDOR_OVERVIEW_WORDS,
  withYouLine,
} from './vendor-home';

const MAIN = veExport('Main.dc.html');
/** The markup with its tags removed and `&amp;` read, then the raw source (attributes, script). */
const WORDS = `${MAIN.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${MAIN}`;

/** An internal reference (the owner's identifier rule for the Vendor, 22 Oct 2026; SA-v1 rule). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('VE-01 Overview words are the export’s', () => {
  it.each([
    ...strings(VENDOR_OVERVIEW_WORDS),
    ...strings(RETURNED_BY_WORDS),
    ...strings(HISTORY_WORDS),
    CREATE_EXPERIMENT,
  ])('“%s”', (phrase) => {
    expect(WORDS).toContain(phrase);
  });

  it('the studio band’s lines take the script’s forms', () => {
    expect(courseLine([courseWords('ME ZG523', 'Thermodynamics & Heat Transfer')])).toBe(
      'Your course: ME ZG523 · Thermodynamics & Heat Transfer',
    );
    expect(courseLine(['ME ZG523 · Thermo', 'Manufacturing Processes'])).toBe(
      'Your courses: ME ZG523 · Thermo, Manufacturing Processes',
    );
    expect(courseWords(null, 'Manufacturing Processes')).toBe('Manufacturing Processes');
    expect(MAIN).toContain(
      "courseLine: (courses.length === 1 ? 'Your course: ' : 'Your courses: ') + courses.join(', ')",
    );
    expect(MAIN).toContain(
      "const courses = Component.ASSIGNED.map(c => c + ' · ' + Component.COURSES[c]);",
    );
    expect(withYouLine(1, 1)).toBe('1 returned · 1 draft');
    expect(withYouLine(0, 2)).toBe('2 drafts');
    expect(withYouLine(0, 0)).toBe('Nothing waiting');
    expect(MAIN).toContain("if (nRet) mine.push(nRet + ' returned');");
    expect(MAIN).toContain("if (nDr) mine.push(nDr + (nDr === 1 ? ' draft' : ' drafts'));");
    expect(MAIN).toContain("s: mine.join(' · ') || 'Nothing waiting'");
  });

  it('“Needs your action” takes the script’s forms', () => {
    expect(attentionCountWords(2)).toBe('2 items');
    expect(attentionCountWords(1)).toBe('1 item');
    expect(attentionCountWords(0)).toBe('Nothing waiting');
    expect(MAIN).toContain(
      "attCount: n === 0 ? 'Nothing waiting' : n + (n === 1 ? ' item' : ' items')",
    );
    expect(leadMeta('academic-reviewer', 'Prof. A. Menon', '24 Aug 2026')).toBe(
      'Academic Reviewer · Prof. A. Menon · 24 Aug 2026',
    );
    expect(leadMeta('content-manager', '', '22 Aug 2026')).toBe('Content Manager · 22 Aug 2026');
    expect(MAIN).toContain("meta: r.ret.by + ' · ' + r.ret.who + ' · ' + r.ret.when.split(',')[0]");
    expect(reviseLabel('Forced Convection')).toBe('Revise “Forced Convection”');
    expect(MAIN).toContain("act: 'Revise “' + r.data.name + '”'");
    expect(reviseName('Forced Convection', 'academic-reviewer')).toBe(
      'Revise Forced Convection, returned by the Academic Reviewer',
    );
    expect(MAIN).toContain("aria: 'Revise ' + r.data.name + ', returned by the ' + r.ret.by");
    expect(returnedRowLine('academic-reviewer', onDay('24 Aug', false), false)).toBe(
      'By the Academic Reviewer on 24 Aug',
    );
    expect(returnedRowLine('content-manager', onDay('2 Oct', true), true)).toBe(
      'By the Content Manager today · your changes are saved, not resubmitted',
    );
    expect(MAIN).toContain(
      "sub: 'By the ' + r.ret.by + ' ' + this.onDay(r.ret.when) + (r.pending ? ' · your changes are saved, not resubmitted' : '')",
    );
    expect(MAIN).toContain("return d === 'Today' ? 'today' : 'on ' + d;");
    expect(draftRowLine(2, '25 Aug 2026')).toBe(
      'Saved at step 2 of 4 · 25 Aug 2026 · only you can see it',
    );
    expect(MAIN).toContain(
      "sub: 'Saved at step ' + (r.step || 1) + ' of 4 · ' + this.dl(r.last) + ' · only you can see it'",
    );
    expect(finishDraftName('Pin Fin Efficiency')).toBe('Finish the draft of Pin Fin Efficiency');
    expect(MAIN).toContain("aria: 'Finish the draft of ' + r.data.name");
  });

  it('Recent activity takes the script’s forms and the history’s words', () => {
    expect(activityName('Draft saved', 'Pin Fin Efficiency', '25 Aug 2026, 17:20')).toBe(
      'Draft saved, Pin Fin Efficiency, 25 Aug 2026, 17:20. Open the experiment record',
    );
    expect(MAIN).toContain(
      "aria: e.h.what + ', ' + e.r.data.name + ', ' + e.h.when + '. Open the experiment record'",
    );
    expect(resubmittedWords('2')).toBe('Submitted · revision 2');
    expect(MAIN).toContain("what: 'Submitted · revision ' + rev");
    for (const what of Object.values(HISTORY_WORDS)) expect(MAIN).toContain(`what: '${what}'`);
    // “Created” is never listed (the product has no such event either).
    expect(MAIN).toContain("if (h.what !== 'Created')");
  });
});

describe('VE-02 My experiments words are the export’s', () => {
  it.each([...strings(MY_EXPERIMENTS_WORDS), CREATE_EXPERIMENT, READ_ONLY_DRAFT, RETURNED])(
    '“%s”',
    (phrase) => {
      expect(WORDS).toContain(phrase);
    },
  );

  it('the tabs are the export’s, in its order, with the service’s filter values', () => {
    expect(STATUS_TABS.map(([, label]) => label)).toEqual([
      'All',
      'Returned',
      'Draft',
      'Submitted',
      'With Academic Reviewer',
      'With Content Manager',
      'Published',
    ]);
    expect(MAIN).toContain(
      "const tabName = { all: 'All', returned: 'Returned', draft: 'Draft', submitted: 'Submitted', with_rv: 'With Academic Reviewer', with_cm: 'With Content Manager', published: 'Published' };",
    );
    expect(MAIN).toContain(
      "['all', 'returned', 'draft', 'submitted', 'with_rv', 'with_cm', 'published']",
    );
    expect(STATUS_TABS.map(([key]) => key)).toEqual([
      'all',
      'returned',
      'draft',
      'submitted',
      'with-academic-reviewer',
      'with-content-manager',
      'published',
    ]);
    expect(statusTabName('Returned', 1)).toBe('Returned, 1 experiment');
    expect(MAIN).toContain("aria: tabName[k] + ', ' + one(c)");
  });

  it('the count, the names and the plain lines take the script’s forms', () => {
    expect(experimentsWords(6)).toBe('6 experiments');
    expect(experimentsWords(1)).toBe('1 experiment');
    expect(experimentCountWords(6, 6, false)).toBe('6 experiments');
    expect(experimentCountWords(1, 6, true)).toBe('1 of 6 experiments');
    expect(experimentCountWords(0, 1, true)).toBe('0 of 1 experiment');
    expect(MAIN).toContain("one = n => n + (n === 1 ? ' experiment' : ' experiments')");
    expect(MAIN).toContain(
      "count: filtered ? list.length + ' of ' + one(all.length) : one(all.length)",
    );
    expect(formatsName(['WEB', 'AR'])).toBe('Formats: WEB, AR');
    expect(formatsName([])).toBe('Formats: none chosen');
    expect(MAIN).toContain("fmtAria: 'Formats: ' + (fm.join(', ') || 'none chosen')");
    // The script's name without `r.id` (state-copy `VE-02.no-reference`).
    expect(experimentRowName('Forced Convection', 'Returned', '24 Aug 2026')).toBe(
      'Forced Convection, Returned, last change 24 Aug 2026. Open the experiment record',
    );
    expect(MAIN).toContain(
      "aria: r.data.name + ', ' + r.id + ', ' + Component.STL[r.st] + ', last change ' + this.dl(r.last) + '. Open the experiment record'",
    );
    expect(reviseRowName('Forced Convection')).toBe('Revise Forced Convection');
    expect(editDraftRowName('Pin Fin Efficiency')).toBe('Edit the draft of Pin Fin Efficiency');
    expect(MAIN).toContain("actAria: (isRet ? 'Revise ' : 'Edit the draft of ') + r.data.name");
    expect(STATUS_LINES.draft(2)).toBe('Saved at step 2 of 4 · only you can see it');
    expect(STATUS_LINES.withReviewer('on 18 Aug')).toBe('Submitted on 18 Aug');
    expect(STATUS_LINES.submitted(2, 'on 26 Aug')).toBe('Revision 2 · submitted on 26 Aug');
    expect(STATUS_LINES.withContentManager('on 14 Aug')).toBe('Approved on 14 Aug');
    expect(STATUS_LINES.published('30 Jul')).toBe('Live in the catalogue since 30 Jul');
    for (const piece of [
      "return 'Saved at step ' + (r.step || 1) + ' of 4 · only you can see it';",
      "return 'Revision ' + r.rev + ' · submitted ' + this.onDay(this.submittedOn(r));",
      "return 'Submitted ' + this.onDay(this.submittedOn(r));",
      "return 'Back for a re-check';",
      "return 'Approved ' + this.onDay(r.approved || '');",
      "return 'Live in the catalogue since ' + d(r.pub || '');",
    ]) {
      expect(MAIN).toContain(piece);
    }
    expect(MAIN).toContain(STATUS_LINES.recheck);
  });

  it('the search names no reference: the export’s words without “ID” (state-copy `VE-02.search`)', () => {
    // Recorded departures: the search is the service's (name, reference or course) and still
    // matches a reference typed into it; the field no longer names it.
    expect(MAIN).toContain('placeholder="Search by name, ID or course"');
    expect(MY_EXPERIMENTS_SEARCH.label).toBe('Search by name or course');
    expect(STATE_COPY_VENDOR_HOME['VE-02.search'].words).toBe(MY_EXPERIMENTS_SEARCH.label);
    expect(WORDS).toContain('Try a different name, ID or course, or clear the filters.');
    expect(MY_EXPERIMENTS_SEARCH.noMatchLine).toBe(
      'Try a different name or course, or clear the filters.',
    );
    expect(STATE_COPY_VENDOR_HOME['VE-02.no-match-line'].words).toBe(
      MY_EXPERIMENTS_SEARCH.noMatchLine,
    );
  });

  it('no word of the overview or the list carries a reference (state-copy `VE-02.no-reference`)', () => {
    const words = [
      ...strings(VENDOR_OVERVIEW_WORDS),
      ...strings(MY_EXPERIMENTS_WORDS),
      ...strings(MY_EXPERIMENTS_SEARCH),
      ...strings(STATUS_TABS),
      experimentRowName('Forced Convection', 'Returned', '24 Aug 2026'),
      reviseRowName('Forced Convection'),
      editDraftRowName('Pin Fin Efficiency'),
      activityName('Draft saved', 'Pin Fin Efficiency', '25 Aug 2026, 17:20'),
    ];
    for (const phrase of words) expect(phrase).not.toMatch(REFERENCE);
    const entry = STATE_COPY_VENDOR_HOME['VE-02.no-reference'];
    expect(entry.basis).toContain(
      'Owner’s identifier rule for the Vendor, 22 Oct 2026: no internal reference (SA-v1 rule',
    );
    expect(STATE_COPY['VE-02.no-reference']).toBe(entry);
  });

  it('the sort’s words: “Sort: newest first”, “…, last change, newest first. Change order”', () => {
    expect(MAIN).toContain(
      "sortLabel: L.desc ? 'last change, newest first' : 'last change, oldest first', sortShort: L.desc ? 'newest first' : 'oldest first'",
    );
    expect(MAIN).toContain('<span>Sort: {{ L.sortShort }}</span>');
    expect(MAIN).toContain('<span class="xr-sr">, {{ L.sortLabel }}. Change order</span>');
  });
});

describe('the failed formula (VE-02’s could not load)', () => {
  it.each(strings(VENDOR_FAILED_WORDS))('“%s” is drawn', (phrase) => {
    expect(WORDS).toContain(phrase);
  });
});

describe('the state-copy entries of the vendor-home group', () => {
  it.each(Object.entries(STATE_COPY_VENDOR_HOME))(
    '%s is provisional, with its decision, and names no decision in its words',
    (id, entry) => {
      expect(id).toMatch(/^VE-0[12]\./);
      expect(entry.screen).toBe(id.slice(0, 5));
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
      expect(entry.basis).toMatch(/^VE-v1 /);
      if (entry.words !== null) {
        expect(entry.words).not.toMatch(/\b(?:OD|T|PC|DEV|VD|ATT|M|DV)-?\d/);
      } else {
        expect(entry.rule.length).toBeGreaterThan(20);
      }
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
    },
  );

  it('the overview’s undrawn states are not the export’s; the list’s are drawn as they are', () => {
    expect(WORDS).not.toContain(STATE_COPY_VENDOR_HOME['VE-01.loading'].words);
    expect(WORDS).not.toContain(STATE_COPY_VENDOR_HOME['VE-01.failed'].words);
    expect(WORDS).toContain(STATE_COPY_VENDOR_HOME['VE-02.loading'].words);
    expect(WORDS).toContain(STATE_COPY_VENDOR_HOME['VE-02.failed'].words);
    // The read-only line is the export's without the day the course was withdrawn.
    expect(MAIN).toContain(
      "return 'Course withdrawn ' + this.onDay(r.withdrawn || '') + ' · read-only';",
    );
    expect(STATE_COPY_VENDOR_HOME['VE-02.read-only-line'].words).toBe(
      'Course withdrawn · read-only',
    );
  });
});
