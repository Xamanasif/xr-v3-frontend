/**
 * The words of IA-01, IA-02 and IA-03 are the frozen boards' (B2-01, B2-02, B2-03): each drawn
 * phrase is found verbatim in its board's markup or script, and each composed line takes the
 * board's form for the board's sample facts. Words no board draws are provisional entries of the
 * state-copy register (`state-copy-institute-home.ts`), checked there for a basis and a decision.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  ACCESS_PLAN_LABEL,
  ACCESS_PLAN_WORDS,
  accessPlanName,
  activatedNote,
  activeSinceWords,
  activeStatusLine,
  approvedStatusLine,
  approvedTitle,
  CONTENT_ACCESS_WORDS,
  contentCountWords,
  courseWords,
  endedStatusLine,
  endingSoonLine,
  endingSoonTitle,
  endingStatusLine,
  endOfTermNote,
  endsOnTitle,
  experimentsHeldCaption,
  giveAccessLabel,
  givenCaption,
  givenNote,
  givenWhat,
  givenWords,
  INSTITUTE_ACTIONS,
  itemsWords,
  licencesWords,
  noCodeTitle,
  noContentLine,
  nobodyLine,
  notGivenLine,
  notGivenTitle,
  notInPlanWords,
  OVERVIEW_WORDS,
  pausedStatusLine,
  PLAN_NOTICES,
  planBandLine,
  planEndedItemLine,
  planEndedItemTitle,
  planEndedTitle,
  planTitle,
  requestApprovedWhat,
  searchChip,
  statusChip,
  studentsGivenWords,
  termWords,
  viewPlanLabel,
  waitingTitle,
  whenBy,
  withoutAccessLine,
  withoutAccessTitle,
} from './institute-home';
import { STATE_COPY_INSTITUTE_HOME } from './state-copy-institute-home';

/** A board's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B2_01 = words('B2-01-IA-Overview.dc.html');
const B2_02 = words('B2-02-Content-Access.dc.html');
const B2_03 = words('B2-03-Access-Plan-and-Course-Codes.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const ACC = {
  id: 'ACC-0107',
  licences: 120,
  term: 'yearly' as const,
  startsOn: '2026-10-08',
  endsOn: '2027-10-07',
};

describe('IA-01 words are on B2-01', () => {
  it.each([...strings(OVERVIEW_WORDS), ...strings(INSTITUTE_ACTIONS)])('%s', (text) => {
    expect(B2_01).toContain(text);
  });

  it('the status lines take B2-01’s forms (f0, f1, f3, f4, f5)', () => {
    for (const line of [
      activeStatusLine(ACC),
      approvedStatusLine('REQ-0042'),
      endingStatusLine(ACC, 15),
      endedStatusLine(ACC),
      pausedStatusLine('ACC-0107', '2 Mar 2027'),
      approvedTitle('REQ-0042'),
    ]) {
      expect(B2_01).toContain(line);
    }
    expect(activeStatusLine(ACC)).toBe(
      'Access plan ACC-0107 · 120 licences · Yearly, ends 7 Oct 2027',
    );
    expect(endingStatusLine(ACC, 15)).toBe(
      'Access plan ACC-0107 · 120 licences · ends 7 Oct 2027 — 15 days left',
    );
  });

  it('the attention rows take B2-01’s forms (f0, f3, f4, f7)', () => {
    for (const line of [
      itemsWords(3),
      itemsWords(1),
      itemsWords(5),
      notGivenTitle('Shell-and-Tube Heat Exchanger'),
      notGivenLine('ME ZG523', 'ACC-0107'),
      withoutAccessTitle(12),
      withoutAccessTitle(3),
      withoutAccessLine('import', '2026-10-08'),
      withoutAccessLine('form', '2027-09-15'),
      noCodeTitle('ME ZG523'),
      endingSoonTitle('ACC-0107', 15),
      endingSoonLine('2027-10-07'),
      planEndedItemTitle('ACC-0107'),
      planEndedItemLine('2027-10-07'),
      waitingTitle(2),
    ]) {
      expect(B2_01).toContain(line);
    }
  });

  it('undrawn singulars are the register’s (IA-01.singular, IA-01.no-platform-code)', () => {
    expect(withoutAccessTitle(1)).toBe('1 student has no access yet');
    expect(waitingTitle(1)).toBe('1 student is waiting for a licence');
    expect(endingSoonTitle('ACC-0107', 1)).toBe('Access plan ACC-0107 ends in 1 day');
    expect(notGivenLine(null, 'ACC-0107')).toBe('access plan ACC-0107');
    for (const id of ['IA-01.singular', 'IA-01.no-platform-code'] as const) {
      expect(STATE_COPY_INSTITUTE_HOME[id].status).toBe('provisional');
    }
    expect(B2_01).not.toContain('1 student has no access yet');
  });
});

describe('IA-02 words are on B2-02', () => {
  it.each(strings(CONTENT_ACCESS_WORDS))('%s', (text) => {
    expect(B2_02).toContain(text);
  });

  it.each([
    ...strings(PLAN_NOTICES).slice(0, 4),
    ACCESS_PLAN_LABEL,
    INSTITUTE_ACTIONS.giveStudentsAccess,
  ])('%s', (text) => {
    expect(B2_02).toContain(text);
  });

  it('the composed lines take B2-02’s forms (f0, f3, f6) and its script’s', () => {
    for (const line of [
      planBandLine(ACC, null),
      planBandLine(ACC, 15),
      viewPlanLabel('ACC-0107'),
      accessPlanName('ACC-0107'),
      experimentsHeldCaption('ME ZG523'),
      giveAccessLabel('Shell-and-Tube Heat Exchanger'),
      notInPlanWords(['ar']),
      studentsGivenWords(1),
      studentsGivenWords(0),
      endsOnTitle('2027-10-07'),
      noContentLine('REQ-0042'),
    ]) {
      expect(B2_02).toContain(line);
    }
    expect(planBandLine(ACC, 15)).toBe(
      '120 licences · Yearly · 8 Oct 2026 – 7 Oct 2027 · 15 days left',
    );
    // The script's count, chips and students text.
    expect(contentCountWords(1, 1, 1, false)).toBe('1 experiment in 1 course');
    expect(contentCountWords(0, 1, 1, true)).toBe('0 of 1 experiment');
    expect(B2_02).toContain(
      "count: chips.length ? rows.length + ' of ' + Component.CAX.length + ' experiment' + (Component.CAX.length === 1 ? '' : 's') : Component.CAX.length + ' experiment' + (Component.CAX.length === 1 ? '' : 's') + ' in 1 course'",
    );
    expect(searchChip(' Distillation ')).toBe('Search: “Distillation”');
    expect(B2_02).toContain("chips.push({ label: 'Search: “' + s.q.trim() + '”'");
    expect(statusChip('ending')).toBe('Status: Ending soon');
    expect(B2_02).toContain(
      "label: 'Status: ' + (s.st === 'active' ? 'Active' : s.st === 'ending' ? 'Ending soon' : 'Ended')",
    );
    expect(studentsGivenWords(2)).toBe('2 students');
    expect(B2_02).toContain(
      "studentsText: n ? (n === 1 ? '1 student' : n + ' students') : 'None yet'",
    );
  });

  it('undrawn forms are the register’s (IA-02.count-courses, IA-02.not-in-plan)', () => {
    expect(contentCountWords(3, 3, 2, false)).toBe('3 experiments in 2 courses');
    expect(notInPlanWords(['ar', 'mr'])).toBe('AR and MR are published but not in your plan');
    expect(STATE_COPY_INSTITUTE_HOME['IA-02.count-courses'].status).toBe('provisional');
    expect(STATE_COPY_INSTITUTE_HOME['IA-02.not-in-plan'].status).toBe('provisional');
  });
});

describe('IA-03 words are on B2-03 (frames 0–5)', () => {
  const drawn = strings(ACCESS_PLAN_WORDS).filter(
    // "Status" and "Given" are column names drawn as `data-label` too.
    (text) => text.trim().length > 1,
  );
  it.each(drawn)('%s', (text) => {
    expect(B2_03).toContain(text);
  });

  it.each([PLAN_NOTICES.pausedTitle, PLAN_NOTICES.pausedLine, PLAN_NOTICES.planEndedLine])(
    '%s',
    (text) => {
      expect(B2_03).toContain(text);
    },
  );

  it('the composed lines take B2-03’s forms (f0 … f4)', () => {
    for (const line of [
      planTitle('ACC-0107'),
      activeSinceWords('8 Oct 2026, 15:05'),
      licencesWords(120),
      termWords(ACC, null),
      termWords(ACC, 15),
      courseWords('ME ZG523', 'Thermodynamics & Heat Transfer'),
      nobodyLine(['Shell-and-Tube Heat Exchanger']),
      givenCaption('ACC-0107'),
      givenWords('9 Oct 2026', null),
      planEndedTitle('2027-10-07'),
      activatedNote('REQ-0042', 'ACC-0107'),
      requestApprovedWhat('External'),
      givenWhat('Rahul Verma', 'Shell-and-Tube Heat Exchanger'),
      givenNote('SACC-0310', false),
      whenBy('9 Oct 2026, 10:20', 'Meera Iyer'),
      whenBy('2 Oct 2026, 10:14', 'Meera Iyer'),
      endOfTermNote('yearly'),
    ]) {
      expect(B2_03).toContain(line);
    }
    expect(termWords(ACC, 15)).toBe('Yearly · 8 Oct 2026 to 7 Oct 2027 · 15 days left');
  });

  it('undrawn forms are the register’s (IA-03.given-group, IA-03.history)', () => {
    expect(givenWords('12 Oct 2026', { groupName: 'ME ZG523 — Sem II' })).toBe(
      '12 Oct 2026 · through the group ME ZG523 — Sem II',
    );
    expect(givenNote('SACC-0311', true)).toBe('SACC-0311 · group grant');
    expect(nobodyLine(['A', 'B'])).toBe(
      'Choose students and give them A and B. They see the formats in this plan.',
    );
    for (const id of ['IA-03.given-group', 'IA-03.history', 'IA-03.history-ended'] as const) {
      expect(STATE_COPY_INSTITUTE_HOME[id].status).toBe('provisional');
    }
  });
});

describe('no decision id or canvas label is shown', () => {
  it('no product word carries a decision id or a sample label', () => {
    for (const text of [
      ...strings(OVERVIEW_WORDS),
      ...strings(CONTENT_ACCESS_WORDS),
      ...strings(ACCESS_PLAN_WORDS),
      ...strings(PLAN_NOTICES),
    ]) {
      expect(text).not.toMatch(/\((?:T|D|OD)-[\w-]+\)/);
      expect(text).not.toMatch(/Sample|Restart/);
    }
  });
});
