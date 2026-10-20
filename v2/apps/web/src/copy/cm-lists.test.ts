/**
 * The words of the Content Manager's lists — CM-01 Overview, CM-02 Ready to publish, CM-04 Content
 * library and CM-09 Platform course codes — are the owner-approved V3 export's
 * (design/v3-refined-b/roles/CM-v1 `project/Main.dc.html`): each drawn phrase is in its markup or
 * script verbatim, and each composed line takes the script's form (`ovVM`, `readyVM`, `libVM`,
 * `codesVM`) with the records' values. The undrawn forms and rules are provisional entries of the
 * state-copy register, each with its decision and no decision id in its words.
 */
import { describe, expect, it } from 'vitest';

import { cmExport } from '@/test-support/boards';

import {
  acrossCourses,
  areaCount,
  cardAge,
  cardByLine,
  cardIdLine,
  cardSummary,
  catalogueCourseLabel,
  catalogueLine,
  changedCountWords,
  CM_OVERVIEW,
  codedDetail,
  codeFieldLabel,
  codesSavedWords,
  CONTENT_LIBRARY,
  continueLabel,
  COURSE_CODES,
  courseBandCount,
  courseChip,
  courseLabel,
  daysWaiting,
  deskCheckWords,
  deskReadyLine,
  deskWhen,
  formatsLabel,
  fromSubmission,
  latestWords,
  libraryCaption,
  libraryCountWords,
  libraryPanelLabel,
  LIST_FAILED,
  liveUnderCourse,
  longestWaitTitle,
  noMatchTitle,
  oldestApproved,
  OPEN_DECISION,
  OPEN_LIBRARY,
  onTheWayDetail,
  openDecisionLabel,
  openSubmissionLabel,
  openUpdateLabel,
  PIPELINE_DESTINATIONS,
  PIPELINE_STAGES,
  pipelineTileLabel,
  publishedRowLabel,
  quotedReason,
  READY_TO_PUBLISH,
  readyCountWords,
  readyListLabel,
  readySortWords,
  recheckDetail,
  releaseDetail,
  reviewerOn,
  revisionWords,
  rowToResolve,
  searchChip,
  sentBackDetail,
  submissionRowLabel,
  updateAwaitingDetail,
  updateInReviewDetail,
  updateOnHoldDetail,
  updateTitle,
  versionWords,
  waitingDetail,
  waitWords,
} from './cm-lists';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_CM_LISTS } from './state-copy-cm-lists';

const MAIN = cmExport('Main.dc.html');
/** The markup with its tags removed and `&amp;` read, then the raw source (attributes, script). */
const WORDS = `${MAIN.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${MAIN}`;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  // A list item's `key` is an identifier, not words.
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([name, item]) => (name === 'key' ? [] : strings(item)));
  }
  return [];
}

/** The sample world's instants (Indian time). */
const AUG_14 = '2026-08-14T09:40:00.000Z';
const AUG_20 = '2026-08-20T04:30:00.000Z';
const AUG_25 = '2026-08-25T04:30:00.000Z';
const AUG_26 = '2026-08-26T04:30:00.000Z';
const AUG_27 = '2026-08-27T09:50:00.000Z';
const REASON =
  'The proposed description says slip falls as the load rises. It rises. Please correct it before I approve.';

describe('the words every list shares', () => {
  it.each([OPEN_DECISION, OPEN_LIBRARY, ...strings(LIST_FAILED)])(
    '“%s” is the export’s',
    (phrase) => {
      expect(WORDS).toContain(phrase);
    },
  );

  it('the composed names and lines take the script’s forms', () => {
    expect(openDecisionLabel('Transient Cooling')).toBe(
      'Open the publication decision for Transient Cooling',
    );
    expect(MAIN).toContain("aria: 'Open the publication decision for ' + x.name");
    expect(formatsLabel(['WEB', 'VR'])).toBe('Formats: WEB, VR');
    expect(MAIN).toContain("fmtAria: 'Formats: ' + x.fmts.join(', ')");
    expect(courseLabel('ME ZG523', 'Thermodynamics & Heat Transfer')).toBe(
      'ME ZG523 · Thermodynamics & Heat Transfer',
    );
    expect(courseLabel(null, 'Fluid Mechanics')).toBe('Fluid Mechanics');
    expect(MAIN).toContain("cLabel(c) { return c.code ? c.code + ' · ' + c.name : c.name; }");
    expect(daysWaiting(AUG_14, AUG_27)).toBe(13);
    expect(daysWaiting(AUG_27, AUG_14)).toBe(0);
    expect([waitWords(0), waitWords(1), waitWords(13)]).toEqual(['Today', '1 day', '13 days']);
    expect(MAIN).toContain("return n <= 0 ? 'Today' : n === 1 ? '1 day' : n + ' days';");
  });
});

describe('CM-01 Overview (`ovVM`)', () => {
  it.each([
    ...strings(CM_OVERVIEW),
    ...strings(PIPELINE_STAGES),
    ...strings(PIPELINE_DESTINATIONS),
  ])('“%s” is the export’s', (phrase) => {
    expect(WORDS).toContain(phrase);
  });

  it('the pipeline tiles: the oldest approval, the holds, the tile’s name', () => {
    expect(oldestApproved(AUG_14)).toBe('Oldest approved 14 Aug');
    expect(MAIN).toContain("'Oldest approved ' + this.short(ready[0].appr)");
    expect(releaseDetail(1)).toBe('Super Admin · 1 on hold');
    expect(releaseDetail(0)).toBe('Super Admin');
    expect(MAIN).toContain("cHold ? 'Super Admin · ' + cHold + ' on hold' : 'Super Admin'");
    expect(
      pipelineTileLabel({
        count: 3,
        title: 'Ready to publish',
        detail: 'Oldest approved 14 Aug',
        you: true,
        destination: 'Ready to publish',
      }),
    ).toBe('3 Ready to publish. Oldest approved 14 Aug. Your step. Open Ready to publish');
    expect(
      pipelineTileLabel({
        count: 1,
        title: 'With the vendor',
        detail: 'Vendor revising',
        you: false,
        destination: 'the Content library, With vendor',
      }),
    ).toBe('1 With the vendor. Vendor revising. Open the Content library, With vendor');
    expect(MAIN).toContain(
      "aria: n + ' ' + t + '. ' + d + '.' + (you ? ' Your step.' : '') + ' Open ' + dest",
    );
  });

  it('the decision desk: the wait, the line, the checks, the quote, the actions', () => {
    expect(deskWhen('approved', AUG_14)).toBe('approved 14 Aug');
    expect(MAIN).toContain("when2: 'approved ' + this.short(x.appr)");
    expect(deskWhen('returned', AUG_26)).toBe('returned 26 Aug');
    expect(deskWhen('saved', AUG_26)).toBe('saved 26 Aug');
    expect(MAIN).toContain("when2: (ret ? 'returned ' : 'saved ') + this.short(at)");
    expect(deskReadyLine('SUB-0074', 'ME ZG523', 'Northline Simulation Studio')).toBe(
      'SUB-0074 · ME ZG523 · Northline Simulation Studio',
    );
    expect(deskReadyLine('SUB-0074', null, 'Northline Simulation Studio')).toBe(
      'SUB-0074 · Northline Simulation Studio',
    );
    expect(MAIN).toContain("d: [x.id, this.cShort(c), this.vName(w, x.vendor)].join(' · ')");
    expect(deskCheckWords(4, 4)).toBe('4 of 4 checks met');
    expect(deskCheckWords(3, 4)).toBe('1 thing to resolve');
    expect(deskCheckWords(2, 4)).toBe('2 things to resolve');
    expect(MAIN).toContain(
      "chk: nb ? this.plural(nb, 'thing') + ' to resolve' : nOk + ' of 4 checks met'",
    );
    expect(quotedReason(REASON)).toBe(
      '“The proposed description says slip falls as the load rises. It rises. Please correct it before…”',
    );
    expect(quotedReason('It rises.')).toBe('“It rises.”');
    expect(MAIN).toContain("quote: ret ? '“' + this.clip(u.ret.reason, 96) + '”' : ''");
    expect(reviewerOn('Prof. A. Menon', AUG_26)).toBe('Prof. A. Menon, Academic Reviewer · 26 Aug');
    expect(MAIN).toContain(
      "who: ret ? u.ret.who + ', Academic Reviewer · ' + this.short(u.ret.when)",
    );
    expect(continueLabel('UPD-0006', 'Induction Motor Loading')).toBe(
      'Continue UPD-0006, correction to Induction Motor Loading',
    );
    expect(MAIN).toContain("aria: 'Continue ' + u.id + ', correction to ' + e.name");
  });

  it('with others: who has it now, in the script’s lines', () => {
    expect(updateTitle('Boiler Drum Level', '2.1')).toBe('Boiler Drum Level 2.1');
    expect(MAIN).toContain("t: e.name + ' ' + u.ver");
    expect(recheckDetail(AUG_25)).toBe('Academic Reviewer · re-check you asked for on 25 Aug');
    expect(MAIN).toContain(
      "d: 'Academic Reviewer · re-check you asked for on ' + this.short(x.recheck.when)",
    );
    expect(sentBackDetail('Meridian Virtual Labs', AUG_26)).toBe(
      'Meridian Virtual Labs · you sent it back on 26 Aug',
    );
    expect(MAIN).toContain(
      "d: this.vName(w, x.vendor) + ' · you sent it back on ' + this.short(x.ret.when)",
    );
    expect(updateInReviewDetail(AUG_25, '1.2')).toBe(
      'Academic Reviewer · sent 25 Aug · 1.2 stays live',
    );
    expect(updateAwaitingDetail(AUG_27, '1.2')).toBe(
      'Super Admin · approved 27 Aug · 1.2 stays live',
    );
    expect(updateOnHoldDetail(AUG_20, '2.0')).toBe('Super Admin · held 20 Aug · 2.0 stays live');
    for (const piece of [
      "'Academic Reviewer · sent ' + this.short(u.sent)",
      "'Super Admin · approved ' + this.short(u.appr)",
      "'Super Admin · held ' + this.short(u.hold.when)",
      "' · ' + e.ver + ' stays live'",
      "aria: 'Open ' + x.name",
      "aria: 'Open ' + u.id + ', ' + e.name",
    ]) {
      expect(MAIN).toContain(piece);
    }
    expect(openSubmissionLabel('Venturi Meter Calibration')).toBe('Open Venturi Meter Calibration');
    expect(openUpdateLabel('UPD-0004', 'Boiler Drum Level')).toBe(
      'Open UPD-0004, Boiler Drum Level',
    );
  });

  it('in the catalogue: the total’s line and each course’s name', () => {
    expect(catalogueLine(12, 5)).toBe('experiments live, in 5 courses');
    expect(catalogueLine(0, 0)).toBe('Nothing is published yet');
    expect(MAIN).toContain(
      "pubLine: exps.length ? 'experiments live, in ' + this.plural(nCourses, 'course') : 'Nothing is published yet'",
    );
    expect(catalogueCourseLabel('Thermodynamics & Heat Transfer', 3)).toBe(
      'Thermodynamics & Heat Transfer, 3 published experiments. Open in the Content library',
    );
    expect(catalogueCourseLabel('Power Electronics', 1)).toBe(
      'Power Electronics, 1 published experiment. Open in the Content library',
    );
    expect(MAIN).toContain(
      "aria: c.name + ', ' + this.plural(n, 'published experiment') + '. Open in the Content library'",
    );
  });
});

describe('CM-02 Ready to publish (`readyVM`)', () => {
  it.each(strings(READY_TO_PUBLISH))('“%s” is the export’s', (phrase) => {
    expect(WORDS).toContain(phrase);
  });

  it('the figures, the count, the order and the list’s name', () => {
    expect(waitingDetail(0)).toBe('All checks met');
    expect(waitingDetail(1)).toBe('1 experiment with something to resolve');
    expect(MAIN).toContain(
      "nSub: blocked ? this.plural(blocked, 'experiment') + ' with something to resolve' : 'All checks met'",
    );
    expect(longestWaitTitle(13)).toBe('days, the longest wait');
    expect(longestWaitTitle(1)).toBe('day, the longest wait');
    expect(MAIN).toContain(
      "waitT: days === 1 ? 'day, the longest wait' : 'days, the longest wait'",
    );
    expect(readyCountWords(3)).toBe('3 experiments approved and waiting');
    expect(readyCountWords(1)).toBe('1 experiment approved and waiting');
    expect(MAIN).toContain(
      "count: this.plural(rows.length, 'experiment') + ' approved and waiting'",
    );
    expect(readySortWords(false)).toEqual({
      long: 'Sort: approved, oldest first',
      short: 'Sort: oldest first',
    });
    expect(readySortWords(true).long).toBe('Sort: approved, newest first');
    expect(MAIN).toContain(
      "sortLabel: newest ? 'approved, newest first' : 'approved, oldest first', sortShort: newest ? 'newest first' : 'oldest first'",
    );
    expect(readyListLabel(false)).toBe('Approved experiments, oldest first');
    expect(MAIN).toContain(
      "listLabel: 'Approved experiments, ' + (newest ? 'newest first' : 'oldest first')",
    );
  });

  it('a card: its wait, identity line, approval line and summary', () => {
    expect(cardAge(13, AUG_14)).toEqual({
      value: '13',
      unit: 'days waiting',
      detail: 'since 14 Aug',
    });
    expect(cardAge(1, AUG_26).unit).toBe('day waiting');
    expect(cardAge(0, AUG_27)).toEqual({
      value: 'Today',
      unit: 'just approved',
      detail: 'at 15:20',
    });
    for (const piece of [
      "age: n ? String(n) : 'Today', ageT: n ? (n === 1 ? 'day waiting' : 'days waiting') : 'just approved'",
      "ageD: n ? 'since ' + this.short(x.appr) : 'at ' +",
    ]) {
      expect(MAIN).toContain(piece);
    }
    expect(cardIdLine('SUB-0077', 'Northline Simulation Studio', 2)).toBe(
      'SUB-0077 · Northline Simulation Studio · revision 2',
    );
    expect(cardIdLine('SUB-0074', 'Northline Simulation Studio', 1)).toBe(
      'SUB-0074 · Northline Simulation Studio',
    );
    expect(MAIN).toContain(
      "idLine: x.id + ' · ' + this.vName(w, x.vendor) + (x.rev > 1 ? ' · revision ' + x.rev : '')",
    );
    expect(cardByLine('Prof. A. Menon', 2)).toBe(
      'Approved by Prof. A. Menon · 2 learning outcomes',
    );
    expect(cardByLine('Prof. A. Menon', 0)).toBe(
      'Approved by Prof. A. Menon · no learning outcomes yet',
    );
    expect(MAIN).toContain(
      "byLine: 'Approved by Prof. A. Menon · ' + (x.outcomes.length ? this.plural(x.outcomes.length, 'learning outcome') : 'no learning outcomes yet')",
    );
    expect(cardSummary(0, 4)).toBe('All 4 checks met');
    expect(cardSummary(1, 4)).toBe('1 thing to resolve');
    expect(MAIN).toContain(
      "sum: nb ? this.plural(nb, 'thing') + ' to resolve' : 'All 4 checks met'",
    );
  });

  it('the latest in the catalogue: published or released, with the day', () => {
    expect(latestWords('1.0', '2026-07-30T04:30:00.000Z', 'first-publication')).toBe(
      'Published · version 1.0 · 30 Jul 2026',
    );
    expect(latestWords('1.1', '2026-08-05T04:30:00.000Z', 'correction-release')).toBe(
      'Version 1.1 released · 5 Aug 2026',
    );
    expect(MAIN).toContain("what: 'Published · version 1.0', when: '30 Jul 2026'");
    expect(MAIN).toContain("what: 'Version 1.1 released', when: '5 Aug 2026'");
    expect(MAIN).toContain("d: h.what + ' · ' + this.day(h.when)");
  });
});

describe('CM-04 Content library (`libVM`)', () => {
  it.each(strings(CONTENT_LIBRARY))('“%s” is the export’s', (phrase) => {
    expect(WORDS).toContain(phrase);
  });

  it('the search’s words are the export’s without “vendor”: the service does not match vendors', () => {
    // A recorded deviation (state copy): the search is ProductionService.getLibrary's (name, ID or
    // course code), as before the V3 migration (lead decision).
    expect(MAIN).toContain('placeholder="Experiment, ID, course or vendor"');
    expect(STATE_COPY_CM_LISTS['CM-04.search.placeholder'].words).toBe('Experiment, ID or course');
    expect(MAIN).toContain(
      'Try fewer filters, another view or a different spelling of the experiment, ID, course or vendor.',
    );
    expect(STATE_COPY_CM_LISTS['CM-04.search.no-match'].words).toBe(
      'Try fewer filters, another view or a different spelling of the experiment, ID or course.',
    );
  });

  it('the figures, the count, the caption, the bands and the chips', () => {
    expect(acrossCourses(12, 5)).toBe('Across 5 courses');
    expect(acrossCourses(0, 0)).toBe('Nothing published yet');
    expect(MAIN).toContain(
      "nCatSub: sets.published.length ? 'Across ' + this.plural(nCourses, 'course') : 'Nothing published yet'",
    );
    expect(onTheWayDetail(3, 2, 1)).toBe('3 ready · 2 in review · 1 with a vendor');
    expect(onTheWayDetail(0, 0, 0)).toBe('Nothing before the catalogue');
    expect(MAIN).toContain(
      "sets.ready.length + ' ready · ' + sets.review.length + ' in review · ' + sets.vendor.length + ' with a vendor'",
    );
    expect(libraryPanelLabel('published')).toBe('Experiments published');
    expect(MAIN).toContain("panelLabel: 'Experiments ' + NOUN[tab]");
    expect(libraryCountWords('ready', 3, 3, false)).toBe('3 ready to publish');
    expect(libraryCountWords('in-review', 1, 3, true)).toBe('1 of 3 in academic review');
    expect(MAIN).toContain(
      "count: chips.length ? shown.length + ' of ' + cur.length + ' ' + NOUN[tab] : cur.length + ' ' + NOUN[tab]",
    );
    expect(libraryCaption('ready', 3, 3, false)).toBe('Ready — 3');
    expect(libraryCaption('published', 1, 12, true)).toBe('Published — 1 of 12');
    expect(MAIN).toContain(
      "caption: tabLabel + ' — ' + (chips.length ? shown.length + ' of ' + cur.length : cur.length)",
    );
    expect(courseBandCount('ready', 2)).toBe('2 ready to publish');
    expect(MAIN).toContain("count: g.rows.length + ' ' + NOUN[tab]");
    expect(searchChip('venturi')).toBe('Search: “venturi”');
    expect(MAIN).toContain("label: 'Search: “' + this.T(ui.q) + '”'");
    expect(courseChip('ME ZG523 · Thermodynamics & Heat Transfer')).toBe(
      'Course: ME ZG523 · Thermodynamics & Heat Transfer',
    );
    expect(MAIN).toContain("label: 'Course: ' + this.cLabel(c)");
    expect(noMatchTitle('in-review')).toBe('Nothing in In review matches');
    expect(MAIN).toContain('Nothing in {{ L.tabLabel }} matches');
  });

  it('the rows: who and when, the status, the names of their links', () => {
    expect(revisionWords(2)).toBe('Revision 2');
    expect(MAIN).toContain("'Revision ' + x.rev");
    expect(versionWords('1.2')).toBe('Version 1.2');
    expect(MAIN).toContain("c3: 'Version ' + e.ver");
    expect(fromSubmission('SUB-0052')).toBe('From SUB-0052');
    expect(MAIN).toContain("meta: e.fromSub ? 'From ' + e.fromSub : ''");
    expect(rowToResolve(1)).toBe('1 to resolve');
    expect(MAIN).toContain("(nb ? nb + ' to resolve' : 'Ready to publish')");
    expect(submissionRowLabel('Transient Cooling', 'SUB-0074', 'Ready to publish', true)).toBe(
      'Transient Cooling, SUB-0074, ready to publish. Open the decision',
    );
    expect(
      submissionRowLabel(
        'Venturi Meter Calibration',
        'SUB-0071',
        'Back with the Academic Reviewer',
        false,
      ),
    ).toBe('Venturi Meter Calibration, SUB-0071, back with the academic reviewer. Open');
    expect(MAIN).toContain(
      "aria: x.name + ', ' + x.id + ', ' + (isReady ? 'ready to publish' : st.label.toLowerCase()) + '. ' + (isReady ? 'Open the decision' : 'Open')",
    );
    expect(publishedRowLabel('Boiler Drum Level', 'CHE ZG513', '2.0', 'Update on hold')).toBe(
      'Boiler Drum Level, CHE ZG513, version 2.0, published, update on hold. Open the published experiment',
    );
    expect(MAIN).toContain(
      "aria: e.name + ', ' + this.cShort(c) + ', version ' + e.ver + ', published' + (tag ? ', ' + tag.toLowerCase() : '') + '. Open the published experiment'",
    );
  });
});

describe('CM-09 Platform course codes (`codesVM`)', () => {
  it.each(strings(COURSE_CODES))('“%s” is the export’s', (phrase) => {
    expect(WORDS).toContain(phrase);
  });

  it('the composed words take the script’s forms', () => {
    expect(codedDetail(6, 1)).toBe('of 6 · 1 without a code');
    expect(codedDetail(6, 0)).toBe('of 6 · every course has one');
    expect(MAIN).toContain(
      "nCodedSub: blankSaved ? 'of ' + K.rows.length + ' · ' + blankSaved + ' without a code' : 'of ' + K.rows.length + ' · every course has one'",
    );
    expect(areaCount(3)).toBe('3 courses');
    expect(areaCount(1)).toBe('1 course');
    expect(MAIN).toContain("count: this.plural(rs.length, 'course')");
    expect(liveUnderCourse(3)).toBe('3 experiments live under this course');
    expect(liveUnderCourse(1)).toBe('1 experiment live under this course');
    expect(liveUnderCourse(0)).toBe('Nothing live yet');
    expect(MAIN).toContain(
      "nText: n ? this.plural(n, 'experiment') + ' live under this course' : 'Nothing live yet'",
    );
    expect(codeFieldLabel('Fluid Mechanics')).toBe('Platform course code for Fluid Mechanics');
    expect(MAIN).toContain("label: 'Platform course code for ' + c.name");
    expect(changedCountWords(1)).toBe('1 change not saved');
    expect(changedCountWords(6)).toBe('6 changes not saved');
    expect(MAIN).toContain(
      "nCh ? this.plural(nCh, 'change') + ' not saved' : 'No unsaved changes'",
    );
    expect(codesSavedWords('2026-08-27T11:10:00.000Z')).toBe(
      '27 Aug 2026, 16:40 · the catalogue shows them from now on',
    );
    expect(MAIN).toContain("K.saved = when + ' · the catalogue shows them from now on'");
    // The duplicate's words and the summary's title are the service catalogue's (CM-09.code.taken),
    // as the script composes them and draws them.
    expect(MAIN).toContain(
      "this.T(r.code) + ' is already the code for ' + this.course(s.w, K.rows[seen[k]].id).name + '. Each course needs its own code.'",
    );
    expect(MAIN).toContain('<p class="rk-errsum-t">Check the codes</p>');
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

  it('what the export now draws is no longer an undrawn entry', () => {
    for (const drawn of [
      'CM-02.loading',
      'CM-02.failed',
      'CM-04.loading',
      'CM-04.failed',
      'CM-04.sent-back',
      'CM-04.update-draft',
      'CM-04.update-awaiting',
      'CM-09.loading',
      'CM-09.failed',
      'CM-09.unavailable.title',
    ]) {
      expect(Object.keys(STATE_COPY_CM_LISTS)).not.toContain(drawn);
    }
  });
});
