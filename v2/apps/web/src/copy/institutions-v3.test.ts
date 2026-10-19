/**
 * The V3 words of SA-06 Institutions and SA-07 Institution detail are the owner-approved Super
 * Admin export's (design/v3-refined-b/roles/SA-v1: `sa-views-b.js` `V.institutions`,
 * `V.institution`, its dialogs and flashes, `sa-core.js` for the shared fragments, `sa-data.js`
 * for the history lines' words): each drawn phrase is found verbatim there, and the composed
 * lines take the export's forms. None carries an internal reference (REQ-, ACC-, DTR-) or a
 * decision id. What the export does not draw is a state-copy entry (`SA-06.*`, `SA-07.*`).
 */
import { describe, expect, it } from 'vitest';

import { saExport } from '@/test-support/boards';

import {
  assignedTitle,
  endedOnWords,
  filterOptionWords,
  institutionEyebrow,
  institutionRowLabel,
  pausedBannerWords,
  pausedFlashLine,
  peopleCountsLine,
  planFormatsLabel,
  planKickerWords,
  planLicenceLine,
  planNameWords,
  restoredFlashLine,
  SA_HISTORY,
  SA_INSTITUTION,
  SA_INSTITUTION_FILTERS,
  SA_INSTITUTIONS,
  saHistoryApproved,
  saHistoryAssigned,
  saInstituteAdminLine,
  saInstitutionCountWords,
  saPlanSummaryWords,
  searchChipWords,
  statusChipWords,
  termDescription,
  termLabelWords,
  termLeftWords,
  waitingRequestWords,
  waitingTransferWords,
} from './institutions';

const VIEWS = saExport('sa-views-b.js');
const CORE = saExport('sa-core.js');
const DATA = saExport('sa-data.js');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

/** Undrawn words, each a state-copy entry. */
const UNDRAWN = new Set<string>([
  SA_INSTITUTIONS.notAssigned, // SA-06.admin-cell: an ended institution without one
]);

describe('SA-06 words are SA-v1’s (`V.institutions`)', () => {
  it.each(strings(SA_INSTITUTIONS).filter((text) => !UNDRAWN.has(text)))('%s', (text) => {
    expect(VIEWS + CORE).toContain(text);
  });

  it('the status options are the export’s, in its order (`FILTERS`)', () => {
    expect(VIEWS).toContain(
      "const FILTERS = [['all', 'All statuses'], ['active', 'Access active'], ['ending', 'Ending soon'], ['paused', 'Access paused'], ['payment', 'Approved — payment required'], ['ended', 'Access ended'], ['noia', 'No Institute Admin']];",
    );
    expect(SA_INSTITUTION_FILTERS.map(([, label]) => label)).toEqual([
      'All statuses',
      'Access active',
      'Ending soon',
      'Access paused',
      'Approved — payment required',
      'Access ended',
      'No Institute Admin',
    ]);
    expect(filterOptionWords('All statuses', 7)).toBe('All statuses (7)');
    expect(VIEWS).toContain(
      "esc(f[1]) + ' (' + all.filter(i => match(i, f[0])).length + ')</option>'",
    );
  });

  it('the composed lines take the export’s forms', () => {
    expect(saInstitutionCountWords(7, 7, false)).toBe('7 institutions');
    expect(saInstitutionCountWords(1, 7, true)).toBe('1 of 7 institutions');
    expect(saInstitutionCountWords(0, 1, true)).toBe('0 of 1 institution');
    expect(VIEWS).toContain(
      "(chips.length ? list.length + ' of ' + SA.plural(all.length, 'institution') : SA.plural(all.length, 'institution'))",
    );
    expect(searchChipWords('kulkarni')).toBe('Search: “kulkarni”');
    expect(statusChipWords('Access paused')).toBe('Status: Access paused');
    expect(VIEWS).toContain("chips.push(['q', 'Search: “' + SA.T(L.q) + '”'])");
    expect(VIEWS).toContain("chips.push(['f', 'Status: ' +");
    expect(institutionRowLabel('Sahyadri Institute of Engineering', 'Access active', true)).toBe(
      'Sahyadri Institute of Engineering, Access active, no Institute Admin. Open the institution',
    );
    expect(VIEWS).toContain(
      "esc(i.name + ', ' + SA.INST_LBL[st] + (SA.noIA(i) ? ', no Institute Admin' : '') + '. Open the institution')",
    );
    expect(saPlanSummaryWords([{ courseCount: 1, experimentCount: 1 }], 1)).toBe(
      '1 course · 1 experiment',
    );
    expect(
      saPlanSummaryWords(
        [
          { courseCount: 2, experimentCount: 3 },
          { courseCount: 1, experimentCount: 2 },
        ],
        0,
      ),
    ).toBe('3 courses · 5 experiments · 2 plans');
    expect(saPlanSummaryWords([], 1)).toBe('No access plan yet · 1 experiment requested');
    expect(VIEWS).toContain(
      "SA.plural(courses(i).length, 'course') + ' · ' + SA.plural(expCount(i), 'experiment') + (i.plans.length > 1 ? ' · ' + i.plans.length + ' plans' : '') : 'No access plan yet · ' + SA.plural((i.requested || []).length, 'experiment') + ' requested'",
    );
    expect(endedOnWords('2026-10-15')).toBe('Ended 15 Oct 2026');
    expect(VIEWS).toContain("'Ended ' + esc(SA.dmy(end))");
  });
});

describe('SA-07 words are SA-v1’s (`V.institution`, its dialogs and flashes)', () => {
  it.each(strings(SA_INSTITUTION))('%s', (text) => {
    expect(VIEWS + CORE).toContain(text);
  });

  it.each(Object.values(SA_HISTORY))('history: %s', (text) => {
    expect(DATA).toContain(text);
  });

  it('the composed lines take the export’s forms', () => {
    expect(institutionEyebrow('external')).toBe('External institution');
    expect(VIEWS).toContain("esc(i.kind) + ' institution</p>");
    expect(saInstituteAdminLine('Meera Iyer', false)).toBe('Institute Admin: Meera Iyer');
    expect(saInstituteAdminLine(null, false)).toBe('Institute Admin: not assigned');
    expect(saInstituteAdminLine(null, true)).toBe(
      'Institute Admin: assigned once access is active',
    );
    expect(VIEWS).toContain(
      "Institute Admin: ' + esc(ia || (st === 'payment' ? 'assigned once access is active' : 'not assigned'))",
    );
    expect(pausedBannerWords('12 Oct 2026')).toBe(
      'Access paused on 12 Oct 2026. Students can’t open experiments. Everyone’s work is kept.',
    );
    expect(VIEWS).toContain(
      "'. Students can’t open experiments. Everyone’s work is kept.</p></div>'",
    );
    expect(planKickerWords(0, 1)).toBe('Access plan');
    expect(planKickerWords(0, 2)).toBe('Access plan 1 of 2');
    expect(VIEWS).toContain(
      "(i.plans.length > 1 ? ' ' + (idx + 1) + ' of ' + i.plans.length : '')",
    );
    expect(planNameWords(1, 120)).toBe('1 experiment · 120 licences');
    expect(VIEWS).toContain("SA.plural(p.exps.length, 'experiment') + ' · ' + p.lic + ' licences'");
    expect(planLicenceLine(120)).toBe(
      '120 licences, as approved. How licences are counted is still open.',
    );
    expect(termLabelWords('yearly')).toBe('Yearly term');
    expect(termLabelWords('until-date')).toBe('Until a fixed date');
    expect(termLeftWords('live', 349)).toBe('349 days left');
    expect(termLeftWords('paused', 263)).toBe('Paused · 263 days left');
    expect(termLeftWords('ended', 8)).toBe('Ended 8 days ago');
    expect(VIEWS).toContain(
      "ended ? 'Ended ' + SA.plural(-left, 'day') + ' ago' : paused ? 'Paused · ' + SA.plural(left, 'day') + ' left' : SA.plural(left, 'day') + ' left'",
    );
    expect(termDescription('Yearly term', '8 Oct 2026', '7 Oct 2027', '349 days left')).toBe(
      'Yearly term from 8 Oct 2026 to 7 Oct 2027. 349 days left.',
    );
    expect(VIEWS).toContain(
      "p.term + ' term from ' + SA.dmy(p.startIso) + ' to ' + SA.dmy(p.endIso) + '. ' + leftTxt + '.'",
    );
    expect(planFormatsLabel(['WEB', 'VR'], ['WEB', 'AR', 'VR'])).toBe(
      'In the plan: WEB, VR. Published: WEB, AR, VR.',
    );
    expect(VIEWS).toContain(
      "'In the plan: ' + e[2].join(', ') + '. Published: ' + (e[3] || e[2]).join(', ') + '.'",
    );
    expect(peopleCountsLine(18, 1)).toBe('18 students and 1 Faculty.');
    expect(VIEWS).toContain("i.students + ' students and ' + i.faculty + ' Faculty.");
    expect(waitingRequestWords('additional-licences')).toBe(
      'Additional licences request under review',
    );
    expect(VIEWS).toContain("r.type + ' request under review'");
    expect(waitingTransferWords('vr', 'Rahul Verma')).toBe('VR device transfer for Rahul Verma');
    expect(VIEWS).toContain("t.fmt + ' device transfer for ' + t.student");
    const godavari = 'Godavari Institute of Technology';
    expect(assignedTitle('N. Joshi', godavari)).toBe(
      `N. Joshi is now the Institute Admin for ${godavari}.`,
    );
    expect(VIEWS).toContain("n + ' is now the Institute Admin for ' + i.name + '.'");
    expect(pausedFlashLine(godavari)).toBe(
      `Everyone at ${godavari} now sees the paused banner. Their work is kept.`,
    );
    expect(VIEWS).toContain(
      "'Everyone at ' + i.name + ' now sees the paused banner. Their work is kept.'",
    );
    expect(restoredFlashLine(godavari)).toBe(`${godavari} can work again.`);
    expect(VIEWS).toContain("i.name + ' can work again.'");
    expect(saHistoryApproved('external')).toBe('Request approved, payment required');
    expect(saHistoryApproved('internal')).toBe('Request approved');
    expect(saHistoryAssigned('Meera Iyer')).toBe('Institute Admin assigned: Meera Iyer');
    expect(VIEWS).toContain("'Institute Admin assigned: ' + n");
  });

  it('no V3 word carries an internal reference or a decision id', () => {
    for (const text of [
      ...strings(SA_INSTITUTIONS),
      ...strings(SA_INSTITUTION),
      ...strings(SA_HISTORY),
    ]) {
      expect(text).not.toMatch(/\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d|\((?:T|D)-?\d+\)/);
    }
  });
});
