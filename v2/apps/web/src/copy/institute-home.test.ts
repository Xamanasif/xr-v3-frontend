/**
 * The words of IA-01, IA-02 and IA-03 are the owner-approved V3 export's (design/v3-refined-b/
 * roles/IA-v1, `project/Main.dc.html`): each drawn phrase is in its template or script verbatim,
 * and each composed line takes the script's form with the export's own sample values. Where the
 * export writes a reference (ACC-, REQ-, SACC-), the words name the thing by content instead — the
 * register's `IA-plan.no-reference` — and no word carries a reference.
 */
import { describe, expect, it } from 'vitest';

import { iaExport } from '@/test-support/boards';

import {
  ACCESS_PLAN_WORDS,
  activeSinceWords,
  addCodeLabel,
  addedOnLine,
  alsoInWords,
  badgeWords,
  CONTENT_ACCESS_WORDS,
  contentCountWords,
  courseWords,
  dayMonthWords,
  daysLeftWords,
  deviceLine,
  deviceTitle,
  endedLine,
  endedOnWords,
  endedStatusLine,
  endOfTermNote,
  endsOnTitle,
  endsStatusLine,
  firstNameOf,
  formatKeyLine,
  formatsOfLabel,
  giveAccessLabel,
  givenWhat,
  INSTITUTE_ACTIONS,
  itemsWords,
  longDay,
  noCodeLine,
  noCodeTitle,
  notGivenTitle,
  OVERVIEW_WORDS,
  pausedOnWords,
  pausedStatusLine,
  PLAN_NOTICES,
  PLAN_WORDS,
  planEndedTitle,
  planFormatsLabel,
  removeFilterLabel,
  renewalLine,
  REQUEST_APPROVED,
  requestApprovedWhat,
  searchChip,
  statusChip,
  studentsGivenLabel,
  studentsWords,
  termDescription,
  termLabel,
  viaGroupWords,
  viewPlanLabel,
  waitingNote,
  waitingTitle,
  whenBy,
  withdrawnNote,
  withoutAccessTitle,
} from './institute-home';
import { STATE_COPY_INSTITUTE_HOME } from './state-copy-institute-home';

const ROOT = iaExport('Main.dc.html');
const TEMPLATE = ROOT.slice(0, ROOT.indexOf('<script type="text/x-dc"'));
const SCRIPT = ROOT.slice(ROOT.indexOf('<script type="text/x-dc"'));
/** The template with its tags removed and `&amp;` read, then the raw source (attributes, script). */
const WORDS = `${TEMPLATE.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${ROOT}`;

const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|GRP|FMAP)-\d+/;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

/** The words written by content where the export writes a reference (`IA-plan.no-reference`). */
const BY_CONTENT = [
  OVERVIEW_WORDS.approvedLine,
  OVERVIEW_WORDS.approvedStatusLine,
  OVERVIEW_WORDS.endedTitle,
  CONTENT_ACCESS_WORDS.noContentLine,
  ACCESS_PLAN_WORDS.noPlanLine,
  ACCESS_PLAN_WORDS.fromRequest,
  ACCESS_PLAN_WORDS.gaveCaption,
  ACCESS_PLAN_WORDS.givenCaption,
  ACCESS_PLAN_WORDS.activatedNote,
  ACCESS_PLAN_WORDS.createdNote,
] as const;

const PLAN = { startsOn: '2026-10-08', endsOn: '2027-10-07' };

describe('the plan screens’ drawn words are the export’s', () => {
  const drawn = [
    ...strings(INSTITUTE_ACTIONS),
    ...strings(PLAN_WORDS),
    ...strings(PLAN_NOTICES),
    ...strings(OVERVIEW_WORDS),
    ...strings(CONTENT_ACCESS_WORDS),
    ...strings(ACCESS_PLAN_WORDS),
  ].filter((text) => !(BY_CONTENT as readonly string[]).includes(text));

  it.each(drawn)('“%s”', (text) => {
    expect(WORDS).toContain(text);
  });

  it('the words that replace a reference are the register’s, and carry none', () => {
    const rule = STATE_COPY_INSTITUTE_HOME['IA-plan.no-reference'].rule;
    for (const text of [
      OVERVIEW_WORDS.approvedStatusLine,
      OVERVIEW_WORDS.endedTitle,
      ACCESS_PLAN_WORDS.fromRequest,
      ACCESS_PLAN_WORDS.activatedNote,
      REQUEST_APPROVED,
    ]) {
      expect(rule).toContain(text);
    }
    // The rest of each line is the export's own.
    expect(OVERVIEW_WORDS.approvedLine).toBe(
      `${REQUEST_APPROVED} Experiments appear here when your institution’s access is active, after the payment is confirmed.`,
    );
    expect(TEMPLATE).toContain(
      'Experiments appear here when your institution’s access is active, after the payment is confirmed.',
    );
    expect(TEMPLATE).toContain(
      'Experiments appear here when BITS activates your institution’s access.',
    );
    expect(TEMPLATE).toContain('The plan appears here when the payment is confirmed.');
    expect(SCRIPT).toContain(
      "whatCap: 'Experiments in access plan ' + P.id + ', grouped by course, with the formats in your plan'",
    );
    expect(TEMPLATE).toContain(', grouped by experiment: one row per student</caption>');
    const registerWords = Object.values(STATE_COPY_INSTITUTE_HOME).flatMap((entry) =>
      entry.words === null ? [] : [entry.words],
    );
    for (const text of [...BY_CONTENT, ...registerWords]) {
      expect(text).not.toMatch(REFERENCE);
    }
  });
});

describe('IA-01 composed lines take the script’s forms', () => {
  it('the head’s status line, by content', () => {
    expect(endsStatusLine('2027-10-07')).toBe('Your access plan ends on 7 October 2027.');
    expect(endedStatusLine('2027-10-07')).toBe('Your access plan ended on 7 October 2027.');
    expect(pausedStatusLine('2 Mar 2027')).toBe(
      'Your access plan was paused by BITS on 2 Mar 2027.',
    );
    // The script's form around the reference: "… ends on " + fFull, "… paused by BITS on " + fDate.
    expect(SCRIPT).toContain("' ends on ' + this.fFull(P.end) + '.'");
    expect(SCRIPT).toContain("' · paused by BITS on ' + this.fDate(P.paused.at) + '.'");
    expect(SCRIPT).toContain("' ended on ' + this.fFull(P.end) + '.'");
    expect(SCRIPT).toContain("'Request REQ-0042 · access starts when the payment is confirmed.'");
  });

  it('the lead bands and the items', () => {
    expect(renewalLine('2027-10-07', '2027-09-22')).toBe(
      'Your plan ends on 7 October. The reminder is due; nothing is sent automatically.',
    );
    expect(SCRIPT).toContain(
      "d: 'Your plan ends on ' + this.fDM(P.end, x.asOf) + '. The reminder is due; nothing is sent automatically.'",
    );
    expect(endedLine('2027-10-07')).toBe(
      'Ended 7 Oct 2027 · students can’t open its experiments now.',
    );
    expect(SCRIPT).toContain(
      "d: 'Ended ' + this.fDate(P.end) + ' · students can’t open its experiments now.'",
    );
    expect([waitingTitle(1), waitingTitle(2)]).toEqual([
      'student is waiting for a licence',
      'students are waiting for a licence',
    ]);
    expect(SCRIPT).toContain(
      "t: (waitS.length === 1 ? 'student is' : 'students are') + ' waiting for a licence'",
    );
    expect([deviceTitle(1), deviceTitle(3)]).toEqual([
      'device request to forward to BITS',
      'device requests to forward to BITS',
    ]);
    expect(SCRIPT).toContain(
      "t: 'device ' + (dt.length === 1 ? 'request' : 'requests') + ' to forward to BITS'",
    );
    expect(deviceLine('Rahul Verma', 0, '2026-10-22', '2026-10-22')).toBe(
      'From Rahul Verma on 22 October. BITS decides after you forward it.',
    );
    expect(deviceLine('Imran Shaikh', 2, '2027-09-18', '2027-09-22')).toBe(
      'From Imran Shaikh and 2 others on 18 September. BITS decides after you forward it.',
    );
    expect(SCRIPT).toContain(
      "d: 'From ' + who + (dt.length > 1 ? ' and ' + this.plural(dt.length - 1, 'other') : '') + ' on ' + this.fDM(dt[0].at, x.asOf) + '. BITS decides after you forward it.'",
    );
    expect([withoutAccessTitle(1), withoutAccessTitle(5)]).toEqual([
      'student has no access yet',
      'students have no access yet',
    ]);
    expect(SCRIPT).toContain(
      "t: (none.length === 1 ? 'student has' : 'students have') + ' no access yet'",
    );
    expect(addedOnLine('2026-10-08', '2026-10-22')).toBe('Added on 8 October');
    expect(addedOnLine('2026-10-08', '2027-09-22')).toBe('Added on 8 October 2026');
    expect(SCRIPT).toContain("'Added on ' + this.fDM(ds[0], x.asOf)");
    expect([notGivenTitle(1), notGivenTitle(2)]).toEqual([
      'experiment hasn’t been given to any student',
      'experiments haven’t been given to any student',
    ]);
    expect(SCRIPT).toContain(
      "t: (notGiven.length === 1 ? 'experiment hasn’t' : 'experiments haven’t') + ' been given to any student'",
    );
    expect([noCodeTitle(1), noCodeTitle(2)]).toEqual([
      'course has no course code from your institution',
      'courses have no course code from your institution',
    ]);
    expect(SCRIPT).toContain(
      "t: (noCode.length === 1 ? 'course has' : 'courses have') + ' no course code from your institution'",
    );
    expect(noCodeLine('ME ZG523', 'Thermodynamics & Heat Transfer')).toBe(
      'ME ZG523 Thermodynamics & Heat Transfer',
    );
    expect(noCodeLine(null, 'Thermodynamics & Heat Transfer')).toBe(
      'Thermodynamics & Heat Transfer',
    );
    expect([itemsWords(1), itemsWords(3)]).toEqual(['1 item', '3 items']);
  });

  it('the dates in full, the year left out when it is this year (the script’s fFull, fDM)', () => {
    expect(longDay('2027-10-07')).toBe('7 October 2027');
    expect(dayMonthWords('2027-10-07', '2027-09-22')).toBe('7 October');
    expect(dayMonthWords('2027-10-07', null)).toBe('7 October 2027');
  });
});

describe('the term bar, the badges and the strip take the script’s forms', () => {
  it('the term bar', () => {
    expect(termLabel('yearly')).toBe('Yearly term');
    expect(termLabel('until-date')).toBe('Term');
    expect(TEMPLATE).toContain('<span class="ia-plan-lab">Yearly term</span>');
    expect(SCRIPT).toContain("termLab: P.term + ' term'");
    expect(daysLeftWords(350)).toBe('350 days left');
    expect(daysLeftWords(1)).toBe('1 day left');
    expect(pausedOnWords('2 Mar 2027')).toBe('Paused by BITS on 2 Mar 2027');
    expect(endedOnWords('2027-10-07')).toBe('Ended on 7 Oct 2027');
    for (const piece of [
      "left: this.plural(x.left, 'day') + ' left'",
      "left: 'Paused by BITS on ' + this.fDate(P.paused.at)",
      "left: 'Ended on ' + this.fDate(P.end)",
      "const span = 'Access term from ' + this.fFull(P.start) + ' to ' + this.fFull(P.end) + '. ';",
      "'The term starts today; '",
      "' days have passed; '",
      "aria: span + 'Paused by BITS on ' + this.fFull(P.paused.at) + '.'",
      "aria: span + 'The term ended on ' + this.fFull(P.end) + '.'",
    ]) {
      expect(SCRIPT).toContain(piece);
    }
    expect(termDescription(PLAN, { kind: 'live', passed: 14, total: 364, left: 350 })).toBe(
      'Access term from 8 October 2026 to 7 October 2027. 14 of 364 days have passed; 350 days are left.',
    );
    expect(termDescription(PLAN, { kind: 'live', passed: 0, total: 364, left: 364 })).toBe(
      'Access term from 8 October 2026 to 7 October 2027. The term starts today; 364 days are left.',
    );
    expect(termDescription(PLAN, { kind: 'paused', on: '2 March 2027' })).toBe(
      'Access term from 8 October 2026 to 7 October 2027. Paused by BITS on 2 March 2027.',
    );
    expect(termDescription(PLAN, { kind: 'ended' })).toBe(
      'Access term from 8 October 2026 to 7 October 2027. The term ended on 7 October 2027.',
    );
  });

  it('the badges in words', () => {
    expect(badgeWords('web', 'on')).toBe('WEB, Browser: In your plan');
    expect(badgeWords('ar', 'pub')).toBe('AR, Augmented reality: Published, not in your plan');
    expect(badgeWords('mr', 'none')).toBe('MR, Mixed reality: Not published');
    expect(SCRIPT).toContain("sr: c.code + ', ' + c.name + ': ' + c.state");
    expect(SCRIPT).toContain(
      "static get FN() { return { WEB: 'Browser', AR: 'Augmented reality', VR: 'Virtual reality', MR: 'Mixed reality' }; }",
    );
    expect(formatKeyLine(['web', 'vr'], ['ar'], ['mr'])).toBe(
      'WEB and VR in your plan · AR published, not in your plan · MR not published',
    );
    expect(SCRIPT).toContain("parts.push(this.listText(by('on')) + ' in your plan')");
    expect(formatsOfLabel('Shell')).toBe('Formats of Shell');
    expect(SCRIPT).toContain("fmAria: 'Formats of ' + W.cat[e].t");
    expect(planFormatsLabel(['web', 'vr'])).toBe('Formats from your access plan: WEB, VR');
    expect(SCRIPT).toContain(
      "fmAria: 'Formats from your access plan: ' + (fm.join(', ') || 'none')",
    );
  });

  it('the strip, the notes and the course head', () => {
    expect(endsOnTitle('2027-10-07')).toBe('Ends on 7 Oct 2027.');
    expect(TEMPLATE).toContain('<b>Ends on {{ V.P.endShort }}.</b>');
    expect(planEndedTitle('2027-10-07')).toBe('This plan ended on 7 Oct 2027.');
    expect(TEMPLATE).toContain('<b>This plan ended on {{ V.N.endShort }}.</b>');
    expect(viewPlanLabel(PLAN)).toBe('View access plan, 8 Oct 2026 – 7 Oct 2027');
    expect(courseWords('ME ZG523', 'Thermodynamics & Heat Transfer')).toBe(
      'ME ZG523 · Thermodynamics & Heat Transfer',
    );
    expect(TEMPLATE).toContain('<p class="ia-plan-exp-c">{{ e.code }} · {{ e.course }}</p>');
    expect(addCodeLabel('ME ZG523', 'Thermodynamics & Heat Transfer')).toBe(
      'Add your course code for ME ZG523 Thermodynamics & Heat Transfer',
    );
    expect(SCRIPT).toContain("addAria: 'Add your course code for ' + e.course + ' ' + CC.name");
  });
});

describe('IA-02 composed lines take the script’s forms', () => {
  it('rows, chips and the count', () => {
    expect(studentsWords(7)).toBe('7 students');
    expect(studentsGivenLabel(7, 'Shell')).toBe(
      '7 students given access to Shell. Open Student access',
    );
    expect(SCRIPT).toContain(
      "givenAria: this.stuCount(n) + ' given access to ' + e.t + '. Open Student access'",
    );
    expect(giveAccessLabel('Shell')).toBe('Give students access to Shell');
    expect(SCRIPT).toContain("giveAria: 'Give students access to ' + e.t");
    expect(searchChip(' Forced convection ')).toBe('Search: “Forced convection”');
    expect(SCRIPT).toContain("label: 'Search: “' + qRaw.trim() + '”'");
    expect(statusChip('ending')).toBe('Status: Ending soon');
    expect(SCRIPT).toContain("label: 'Status: ' + this.planSt(st)[1]");
    expect(removeFilterLabel('Status: Ending soon')).toBe('Remove filter Status: Ending soon');
    expect(SCRIPT).toContain("c.aria = 'Remove filter ' + c.label;");
    expect(contentCountWords(1, 1, 1, false)).toBe('1 experiment in 1 course');
    expect(contentCountWords(0, 1, 1, true)).toBe('0 of 1 experiment');
    expect(contentCountWords(3, 3, 2, false)).toBe('3 experiments in 2 courses');
    expect(SCRIPT).toContain(
      "count: chips.length ? list.length + ' of ' + this.plural(all.length, 'experiment') : this.plural(all.length, 'experiment') + ' in ' + this.plural(nCourses, 'course')",
    );
  });
});

describe('IA-03 composed lines take the script’s forms', () => {
  it('the head, the grouped rows and the history', () => {
    expect(activeSinceWords('8 Oct 2026, 15:05')).toBe('Active since 8 Oct 2026, 15:05');
    expect(TEMPLATE).toContain('<span>Active since {{ V.since }}</span>');
    expect(viaGroupWords('ME ZG523 — Sem II')).toBe('Group: ME ZG523 — Sem II');
    expect(SCRIPT).toContain("viaText: isInd ? 'Individually' : 'Group: ' + (G ? G.name : '')");
    expect(alsoInWords(['ME ZG523 — Sem II'])).toBe(
      'Also in ME ZG523 — Sem II, which has this experiment',
    );
    expect(SCRIPT).toContain("'Also in ' + otherG.name + ', which has this experiment'");
    expect(firstNameOf('Dr S. Ranganathan')).toBe('S.');
    expect(firstNameOf('Arun Kumar')).toBe('Arun');
    expect(waitingNote('Arun')).toBe('No licence is available for Arun on this plan right now.');
    expect(SCRIPT).toContain("waitText: 'No licence is available for ' + this.first(S.n) + ' on '");
    expect(requestApprovedWhat('External')).toBe('Request approved · External');
    expect(SCRIPT).toContain("w: 'Request approved · External'");
    expect(givenWhat('Rahul Verma', 'Shell', false)).toBe('Rahul Verma given Shell');
    expect(givenWhat('ME ZG523 — Sem II', 'Shell', true)).toBe(
      'Group ME ZG523 — Sem II given Shell',
    );
    expect(SCRIPT).toContain("w: 'Group ' + (G ? G.name : g.gid) + ' given ' + E");
    expect(withdrawnNote('Nikhil Bose', 'Shell')).toBe('Nikhil Bose · Shell');
    expect(whenBy('9 Oct 2026, 10:20', 'Meera Iyer')).toBe('9 Oct 2026, 10:20 · Meera Iyer');
    expect(SCRIPT).toContain("(h.by ? ' · ' + h.by : '')");
    expect(endOfTermNote('yearly')).toBe('End of the yearly term.');
    expect(SCRIPT).toContain("n: 'End of the yearly term.'");
  });
});

describe('no decision id, canvas label or reference is shown', () => {
  it('no product word carries one', () => {
    for (const text of [
      ...strings(OVERVIEW_WORDS),
      ...strings(CONTENT_ACCESS_WORDS),
      ...strings(ACCESS_PLAN_WORDS),
      ...strings(PLAN_NOTICES),
      ...strings(PLAN_WORDS),
    ]) {
      expect(text).not.toMatch(/\((?:T|D|OD)-[\w-]+\)/);
      expect(text).not.toMatch(/Sample|Restart|Preview/);
      expect(text).not.toMatch(REFERENCE);
    }
  });
});
