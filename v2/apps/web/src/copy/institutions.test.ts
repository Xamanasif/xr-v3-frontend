/**
 * The words of SA-01, SA-06 and SA-07 are the frozen boards' (B7-01, B7-02, B7-03): each drawn
 * phrase is found verbatim in its board's markup or script, and the five sentences the boards write
 * with internal decision ids are their board wording without the ids (P1-14 / VD-10), each still
 * traceable to that wording. Nothing undrawn is written here without a state-copy entry.
 */
import { DRAWN_MESSAGES } from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  accessEndsWords,
  ASSIGN_ERRORS,
  assignedFlash,
  ATTENTION_NO_ADMIN,
  attentionAwaitingPayment,
  attentionPaused,
  attentionRequest,
  DETAIL_PAGE,
  detailOverline,
  historyActivated,
  historyActivatedNote,
  historyApproved,
  historyApprovedNote,
  historyAssigned,
  historyLicencesRequested,
  historyPaused,
  historyRenewalRequested,
  historyRestored,
  historySentBy,
  INSTITUTION_TAB_WORDS,
  institutionCountWords,
  INSTITUTIONS_PAGE,
  instituteAdminLine,
  noPlanLine,
  openInstitutionLabel,
  openRequestWords,
  overriddenFlash,
  overrideConfirm,
  overrideReasonLabel,
  pausedFlash,
  pausedLine,
  pauseTitle,
  peopleWords,
  planDates,
  planLine,
  planSummaryWords,
  restoreBody,
  restoredFlash,
  restoreTitle,
  startedCompletedWords,
  STRIPPED,
} from './institutions';
import {
  GROUP_ROWS,
  OVERVIEW_PAGE,
  openRowLabel,
  overviewOverline,
  requestRowLine,
  requestRowTitle,
} from './overview';

/** A board's text with tags removed, then its raw markup (attributes and script strings). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ')}\n${raw}`;
}

const B7_01 = words('B7-01-SA-Overview.dc.html');
const B7_02 = words('B7-02-Institutions.dc.html');
const B7_03 = words('B7-03-Institution-Detail.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const STRIPPED_WORDS = new Set(Object.values(STRIPPED).map((sentence) => sentence.words));

describe('P1-14 / VD-10: five sentences without their decision ids, traceable to the boards', () => {
  it.each(Object.entries(STRIPPED))('%s', (_, sentence) => {
    const drawnOn = sentence.board.startsWith('B7-02') ? B7_02 : B7_03;
    expect(drawnOn).toContain(sentence.drawn);
    expect(sentence.ids.length).toBeGreaterThan(0);
    expect(sentence.words).not.toMatch(/\(T-\d{2}\)/);
    // The words are the drawn sentence with each " (T-nn)" taken out — nothing else changed.
    for (const id of sentence.ids) expect(sentence.drawn).toContain(` (${id})`);
    let restored: string = sentence.drawn;
    for (const id of sentence.ids) restored = restored.replace(` (${id})`, '');
    expect(sentence.words).toBe(restored);
  });

  it('names exactly the ids the owner listed, and T-09 on SA-06', () => {
    expect(new Set(Object.values(STRIPPED).flatMap((sentence) => sentence.ids))).toEqual(
      new Set(['T-06', 'T-08', 'T-09', 'T-11', 'T-25']),
    );
  });

  it('no product word on SA-06 or SA-07 carries a decision id', () => {
    for (const text of [
      ...strings(INSTITUTIONS_PAGE),
      ...strings(DETAIL_PAGE),
      assignedFlash('N. Joshi', 'Sahyadri Institute of Engineering'),
    ]) {
      expect(text).not.toMatch(/\((?:T|D)-?\d+\)/);
    }
  });
});

describe('SA-06 words are on B7-02', () => {
  const drawn = strings(INSTITUTIONS_PAGE).filter(
    (text) => !STRIPPED_WORDS.has(text) && text !== INSTITUTIONS_PAGE.columns.action,
  );
  it.each(drawn)('%s', (text) => {
    expect(B7_02).toContain(text);
  });

  it('the tabs are B7-02’s, in its order (its script `F`)', () => {
    expect(B7_02).toContain(
      "const F = [['all', 'All'], ['active', 'Access active'], ['ending', 'Ending soon'], ['paused', 'Paused'], ['payment', 'Awaiting payment'], ['noia', 'No Institute Admin']];",
    );
    expect(INSTITUTION_TAB_WORDS.map(([, label]) => label)).toEqual([
      'All',
      'Access active',
      'Ending soon',
      'Paused',
      'Awaiting payment',
      'No Institute Admin',
    ]);
  });

  it('the composed lines take B7-02’s script’s forms', () => {
    expect(institutionCountWords(7, 7)).toBe('7 of 7 institutions');
    expect(institutionCountWords(0, 1)).toBe('0 of 1 institution');
    expect(B7_02).toContain(
      "o.count = shown.length + ' of ' + plural(s.recs.length, 'institution')",
    );
    expect(planSummaryWords([{ id: 'ACC-0107', courseCount: 1, experimentCount: 1 }], 1)).toBe(
      'ACC-0107 · 1 course · 1 experiment',
    );
    expect(planSummaryWords([{ id: 'ACC-0098', courseCount: 1, experimentCount: 2 }], 2)).toBe(
      'ACC-0098 · 1 course · 2 experiments',
    );
    expect(planSummaryWords([], 1)).toBe('No access plan yet · 1 experiment requested');
    expect(B7_02).toContain(
      "'No access plan yet · ' + plural(r.exps.length, 'experiment') + ' requested'",
    );
    expect(accessEndsWords('2027-10-07', false)).toBe('Ends 7 Oct 2027');
    expect(accessEndsWords('2026-10-15', true)).toBe('Ended 15 Oct 2026');
    expect(accessEndsWords(null, false)).toBe('—');
    expect(B7_02).toContain("(r.st === 'ended' ? 'Ended ' + r.end : 'Ends ' + r.end) : '—'");
    expect(openInstitutionLabel('Godavari Institute of Technology')).toBe(
      'Open Godavari Institute of Technology',
    );
    expect(B7_02).toContain("aria: 'Open ' + r.name");
  });
});

describe('SA-07 words are on B7-03', () => {
  const drawn = strings(DETAIL_PAGE).filter(
    (text) =>
      !STRIPPED_WORDS.has(text) &&
      // Field labels and the column name for labelled rows, drawn as `data-label`.
      text.trim().length > 1,
  );
  it.each(drawn)('%s', (text) => {
    expect(B7_03).toContain(text);
  });

  it('the field errors are drawn and are the contract catalogue’s messages', () => {
    for (const [words, key] of [
      [ASSIGN_ERRORS.nameRequired, 'SA-07.name.required'],
      [ASSIGN_ERRORS.emailRequired, 'SA-07.workEmail.required'],
      [ASSIGN_ERRORS.emailFormat, 'SA-07.workEmail.format'],
      [DETAIL_PAGE.reasonRequired, 'SA-07.reason.required'],
    ] as const) {
      expect(B7_03).toContain(words);
      expect(DRAWN_MESSAGES[key].text).toBe(words);
    }
  });

  it('the composed lines take B7-03’s forms', () => {
    const godavari = 'Godavari Institute of Technology';
    expect(detailOverline('external', 'ACC-0107')).toBe(
      'External institution · access plan ACC-0107',
    );
    expect(detailOverline('external', null)).toBe('External institution');
    expect(B7_03).toContain(
      "o.overline = r.kind + ' institution' + (r.plan ? ' · access plan ' + r.plan : '')",
    );
    expect(instituteAdminLine('Meera Iyer')).toBe('Institute Admin: Meera Iyer');
    expect(instituteAdminLine(null)).toBe('Institute Admin: Not assigned');
    expect(openRequestWords('REQ-0042')).toBe('Open request REQ-0042');
    expect(
      planLine({
        id: 'ACC-0107',
        licences: 120,
        term: 'yearly',
        startsOn: '2026-10-08',
        endsOn: '2027-10-07',
      }),
    ).toBe('ACC-0107 · 120 licences · Yearly · 8 Oct 2026 – 7 Oct 2027');
    expect(B7_03).toContain(
      "o.planLine = r.plan ? r.plan + ' · ' + r.lic + ' licences · ' + r.term + ' · ' + r.start + ' – ' + r.end",
    );
    expect(noPlanLine('REQ-0037')).toBe(
      'No access plan yet — it is created when the payment for REQ-0037 is confirmed',
    );
    expect(planDates('2026-10-08', '2027-10-07')).toBe('8 Oct 2026 – 7 Oct 2027');
    expect(peopleWords(12, 3)).toBe('12 students · 3 Faculty');
    expect(peopleWords(0, 0)).toBe('0 students · 0 Faculty');
    expect(B7_03).toContain("o.people = r.students + ' students · ' + r.faculty + ' Faculty'");
    expect(startedCompletedWords(4, 2)).toBe('4 started · 2 completed');
    expect(
      pausedLine(
        '12 Oct 2026',
        'The institution asked us to pause access while it checks its student list.',
      ),
    ).toBe(
      'Paused on 12 Oct 2026 · “The institution asked us to pause access while it checks its student list.” Students can’t open experiments. Everyone’s work is kept.',
    );
    expect(B7_03).toContain("'Paused on ' + r.pausedOn + ' · “' + r.pauseReason + '”'");
    expect(B7_03).toContain('Students can’t open experiments. Everyone’s work is kept.');
    expect(pauseTitle(godavari)).toBe(`Pause access for ${godavari}?`);
    expect(restoreTitle(godavari)).toBe(`Restore access for ${godavari}?`);
    expect(restoreBody(godavari)).toBe(
      `Everyone at ${godavari} can work again on the experiments in its access plan. The pause and your reason stay in the history.`,
    );
    expect(B7_03).toContain(
      "o.restoreBody = 'Everyone at ' + r.name + ' can work again on the experiments in its access plan. The pause and your reason stay in the history.'",
    );
    expect(pausedFlash(godavari)).toBe(
      `Access paused. Everyone at ${godavari} now sees the paused banner.`,
    );
    expect(B7_03).toContain(
      "flash: 'Access paused. Everyone at ' + r.name + ' now sees the paused banner.'",
    );
    expect(restoredFlash(godavari)).toBe(`Access restored. ${godavari} can work again.`);
    expect(B7_03).toContain("flash: 'Access restored. ' + r.name + ' can work again.'");
    expect(assignedFlash('N. Joshi', 'Sahyadri Institute of Engineering')).toBe(
      'N. Joshi is now the Institute Admin for Sahyadri Institute of Engineering. Nothing is sent from here — how they first sign in is still open.',
    );
    expect(B7_03).toContain(
      "flash: T(c2.iaName) + ' is now the Institute Admin for ' + r.name + '. Nothing is sent from here — how they first sign in is still open (T-11).'",
    );
    expect(overrideReasonLabel('active')).toBe('Reason for changing the status to Active');
    expect(overrideConfirm('inactive')).toBe('Change to Inactive');
    expect(overriddenFlash('Sneha Reddy', 'active')).toBe('Sneha Reddy is now active.');
    expect(B7_03).toContain(
      "flash: c.stu[i].n + ' is now ' + (to === 'active' ? 'active' : 'inactive') + '.'",
    );
  });

  it('“Needs attention” and History rows are B7-03’s', () => {
    for (const text of [
      ATTENTION_NO_ADMIN,
      attentionPaused('12 Oct 2026'),
      attentionAwaitingPayment('REQ-0037'),
      attentionRequest('REQ-0040', 'additional-licences', 'Under review'),
      attentionRequest('REQ-0036', 'additional-licences', 'Payment not confirmed'),
      historyApproved('REQ-0042', 'external'),
      historyApproved('REQ-0039', 'internal'),
      historyApprovedNote('external'),
      historyApprovedNote('internal'),
      historyActivated('ACC-0107'),
      historyActivatedNote('external'),
      historyActivatedNote('internal'),
      historyAssigned('Meera Iyer'),
      historyPaused('Arjun Mehta'),
      historyLicencesRequested('REQ-0040'),
      historyRenewalRequested('REQ-0038'),
      historySentBy('Meera Iyer'),
    ]) {
      expect(B7_03).toContain(text);
    }
    expect(historyRestored('Arjun Mehta')).toBe('Access restored by Arjun Mehta');
    expect(B7_03).toContain("'Access restored by ' + D.sa");
  });
});

describe('SA-01 words are on B7-01', () => {
  it.each(strings(OVERVIEW_PAGE))('%s', (text) => {
    expect(B7_01).toContain(text);
  });

  it('the rows take B7-01’s forms', () => {
    expect(overviewOverline('Super Admin', 'Arjun Mehta')).toBe('Super Admin · Arjun Mehta');
    expect(B7_01).toContain('Super Admin · Arjun Mehta');
    const title = requestRowTitle('REQ-0040', 'Konark Polytechnic');
    expect(title).toBe('REQ-0040 · Konark Polytechnic');
    expect(requestRowLine('additional-licences', '2026-09-29T07:07:00.000Z')).toBe(
      'Additional licences · under review since 29 Sep 2026',
    );
    expect(openRowLabel(title)).toBe('Open: REQ-0040 · Konark Polytechnic');
    for (const text of [
      title,
      'Additional licences · under review since 29 Sep 2026',
      openRowLabel(title),
    ]) {
      expect(B7_01).toContain(text);
    }
    expect(GROUP_ROWS).toBe(4);
    expect(B7_01).toContain('each with at most four rows');
  });
});
