/**
 * The words of IA-04 Student access and IA-05 Give students access are the frozen boards' (B2-04,
 * B2-05): each drawn phrase is found verbatim in its board's markup or script, and each composed
 * line takes its board script's own formula (`saView`, `gvView`), checked here with the board's
 * sample values. Nothing undrawn is written in `student-access.ts`.
 */
import { DRAWN_MESSAGES, SUMMARY_TITLES } from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  alreadyHasWords,
  alsoInGroupNotice,
  alsoInGroupWords,
  courseOptionWords,
  courseSummaryWords,
  firstName,
  formatsInWords,
  GIVE_ACCESS,
  groupChosenWords,
  groupWho,
  inheritedFromWords,
  licencesLineWords,
  memberCountWords,
  memberHasItWords,
  memberInactiveWords,
  membersCanOpenWords,
  memberWaitingWords,
  noLicenceWords,
  notInPlanHeading,
  planEndedLine,
  planEndedTitle,
  planStandingWords,
  removeChipLabel,
  requestAwaitingPaymentWords,
  rowCountWords,
  searchChip,
  seesItWords,
  selectedCountWords,
  showWithdrawnLabel,
  STATUS_FILTER,
  statusChip,
  STUDENT_ACCESS_PAGE,
  studentsChosenWords,
  summaryFormatsWords,
  VIA_FILTER,
  viaChip,
  viaGroupWords,
  WITHDRAW_DIALOG,
  withdrawAlsoTitle,
  withdrawLabel,
  withdrawnAlsoFlash,
  withdrawnOnlyFlash,
  withdrawnOnWords,
} from './student-access';

/** A board's text with tags as spaces, with tags removed, then its raw markup and script. */
function words(file: string): string {
  const raw = board(file).replaceAll('&amp;', '&');
  return `${raw.replace(/<[^>]+>/g, ' ')}\n${raw.replace(/<[^>]+>/g, '')}\n${raw}`;
}

const B2_04 = words('B2-04-Student-Access.dc.html');
const B2_05 = words('B2-05-Give-Students-Access.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('IA-04 words are on B2-04', () => {
  it.each(strings(STUDENT_ACCESS_PAGE))('%s', (text) => {
    expect(B2_04).toContain(text);
  });

  it.each(strings(WITHDRAW_DIALOG))('%s', (text) => {
    expect(B2_04).toContain(text);
  });

  it('the filters are B2-04’s, in its order', () => {
    expect(B2_04).toContain(
      '<option value="all">All statuses</option><option value="active">Active</option><option value="waiting">Waiting for a licence</option><option value="inactive">Student inactive</option>',
    );
    expect(STATUS_FILTER.map(([, label]) => label)).toEqual([
      'All statuses',
      'Active',
      'Waiting for a licence',
      'Student inactive',
    ]);
    expect(B2_04).toContain(
      '<option value="all">Individually or by group</option><option value="ind">Individually</option><option value="grp">Through a group</option>',
    );
    expect(VIA_FILTER.map(([, label]) => label)).toEqual([
      'Individually or by group',
      'Individually',
      'Through a group',
    ]);
  });

  it('the composed lines take B2-04’s script’s formulas', () => {
    expect(B2_04).toContain(
      "count: (chips.length ? list.length + ' of ' + shown : shown) + (shown === 1 ? ' student × experiment' : ' rows · one per student × experiment')",
    );
    expect(rowCountWords(8, 8, false)).toBe('8 rows · one per student × experiment');
    expect(rowCountWords(1, 8, true)).toBe('1 of 8 rows · one per student × experiment');
    expect(rowCountWords(1, 1, false)).toBe('1 student × experiment');

    expect(B2_04).toContain("label: 'Search: “' + s.q.trim() + '”'");
    expect(searchChip('Rahul')).toBe('Search: “Rahul”');
    expect(B2_04).toContain("label: 'Status: ' + LBL[s.st]");
    expect(statusChip('Waiting for a licence')).toBe('Status: Waiting for a licence');
    expect(B2_04).toContain("s.via === 'ind' ? 'Given individually' : 'Given through a group'");
    expect([viaChip('ind'), viaChip('grp')]).toEqual([
      'Given individually',
      'Given through a group',
    ]);
    expect(B2_04).toContain("c.aria = 'Remove ' + c.label");
    expect(removeChipLabel('Search: “Rahul”')).toBe('Remove Search: “Rahul”');
    expect(B2_04).toContain("wdLabel: 'Show withdrawn (' + nWd + ')'");
    expect(showWithdrawnLabel(1)).toBe('Show withdrawn (1)');

    expect(B2_04).toContain("'Group: ME ZG523 — Sem II'");
    expect(viaGroupWords('ME ZG523 — Sem II')).toBe('Group: ME ZG523 — Sem II');
    expect(B2_04).toContain("'Also in ' + r.alsoGrp + ', which has this experiment'");
    expect(alsoInGroupWords('ME ZG523 — Sem II')).toBe(
      'Also in ME ZG523 — Sem II, which has this experiment',
    );
    expect(B2_04).toContain("wdText: r.wdate ? 'Withdrawn ' + r.wdate");
    expect(withdrawnOnWords('12 Oct 2026')).toBe('Withdrawn 12 Oct 2026');
    expect(B2_04).toContain(
      "wdAria: r.alsoGrp ? 'Withdraw ' + r.n + '’s individual grant for ' + r.exp : 'Withdraw ' + r.n + '’s access to ' + r.exp",
    );
    expect(withdrawLabel('Rahul Verma', 'Shell-and-Tube Heat Exchanger', true)).toBe(
      'Withdraw Rahul Verma’s individual grant for Shell-and-Tube Heat Exchanger',
    );
    expect(withdrawLabel('Rahul Verma', 'Shell-and-Tube Heat Exchanger', false)).toBe(
      'Withdraw Rahul Verma’s access to Shell-and-Tube Heat Exchanger',
    );
  });

  it('the DL-2 dialog and its flashes take B2-04’s words', () => {
    expect(B2_04).toContain("'Withdraw ' + d.n + '’s individual grant?'");
    expect(withdrawAlsoTitle('Rahul Verma')).toBe('Withdraw Rahul Verma’s individual grant?');
    expect(B2_04).toContain(WITHDRAW_DIALOG.only.so('{{ a.dFirst }}'));
    const notice = alsoInGroupNotice('{{ a.dFirst }}', '{{ a.dGrp }}', '{{ a.dExp }}');
    expect(B2_04).toContain(`${notice.before}{{ a.dGsacc }}${notice.after}`);
    expect(withdrawnAlsoFlash('SACC-0310', 'Rahul Verma', 'ME ZG523 — Sem II', 'SACC-0311')).toBe(
      'Individual grant SACC-0310 withdrawn. Rahul is still in ME ZG523 — Sem II, and the group grant SACC-0311 is not changed.',
    );
    expect(B2_04).toContain(
      withdrawnAlsoFlash('SACC-0310', 'Rahul Verma', 'ME ZG523 — Sem II', 'SACC-0311'),
    );
    expect(B2_04).toContain(
      "'Access withdrawn. ' + who.sacc + ' was ' + who.n + '’s only grant for ' + who.exp + ', so ' + who.n.split(' ')[0] + ' can no longer open it. Their work is kept.'",
    );
    expect(withdrawnOnlyFlash('SACC-0310', 'Rahul Verma', 'Shell-and-Tube Heat Exchanger')).toBe(
      'Access withdrawn. SACC-0310 was Rahul Verma’s only grant for Shell-and-Tube Heat Exchanger, so Rahul can no longer open it. Their work is kept.',
    );
    expect(firstName('Rahul Verma')).toBe('Rahul');
  });

  it('the reason error is the contract catalogue’s drawn message', () => {
    expect(DRAWN_MESSAGES['IA-04.reason.required'].text).toBe(WITHDRAW_DIALOG.reasonRequired);
  });
});

describe('IA-05 words are on B2-05', () => {
  it.each(strings(GIVE_ACCESS))('%s', (text) => {
    expect(B2_05).toContain(text);
  });

  it('the steps and titles are the board script’s', () => {
    expect(B2_05).toContain("['Experiments', 'Students', 'Review and give access']");
    expect(B2_05).toContain(
      "{ 1: 'Choose experiments', 2: 'Choose students', 3: 'Review and give access', 4: 'Access given' }",
    );
    expect(SUMMARY_TITLES['IA-05'].one).toBe(GIVE_ACCESS.errorTitle);
  });

  it('the composed lines take B2-05’s forms', () => {
    expect(planStandingWords('Active', 120, '2027-10-07')).toBe(
      ' · Active · 120 licences · ends 7 Oct 2027',
    );
    expect(B2_05).toContain(`ACC-0107${planStandingWords('Active', 120, '2027-10-07')}`);
    expect(courseOptionWords('ME ZG523', 'Thermodynamics & Heat Transfer')).toBe(
      'ME ZG523 — Thermodynamics & Heat Transfer',
    );
    expect(B2_05).toContain(courseOptionWords('ME ZG523', 'Thermodynamics & Heat Transfer'));
    expect(B2_05).toContain(courseSummaryWords('ME ZG523', 'Thermodynamics & Heat Transfer'));
    expect(B2_05).toContain(notInPlanHeading('ME ZG523'));
    expect(B2_05).toContain(alreadyHasWords(['Shell-and-Tube Heat Exchanger']));
    expect(B2_05).toContain(
      "selCount: nSel === 1 ? '1 student selected' : nSel + ' students selected'",
    );
    expect([selectedCountWords(1), selectedCountWords(3)]).toEqual([
      '1 student selected',
      '3 students selected',
    ]);
    expect(B2_05).toContain(
      "sub: g.members.length ? g.members.length + ' members' : 'No members yet'",
    );
    expect([memberCountWords(7), memberCountWords(0)]).toEqual(['7 members', 'No members yet']);
    expect(B2_05).toContain(
      "selIds.slice(0, 3).map(id => stuById[id].n).join(', ') + (nSel > 3 ? ' and ' + (nSel - 3) + ' more' : '')",
    );
    expect(studentsChosenWords(['Rahul Verma'])).toBe('Rahul Verma');
    expect(studentsChosenWords(['A', 'B', 'C', 'D', 'E'])).toBe('A, B, C and 2 more');
    expect(studentsChosenWords([])).toBe('Not chosen yet');
    expect(B2_05).toContain("grp.name + ' (' + grp.members.length + ' members)'");
    expect(groupChosenWords('ME ZG523 — Sem II', 7)).toBe('ME ZG523 — Sem II (7 members)');
    expect(B2_05).toContain('"fmts": "WEB and VR"');
    expect(formatsInWords(['vr', 'web'])).toBe('WEB and VR');
    expect(B2_05).toContain("D.fmts + ' — from your access plan'");
    expect(summaryFormatsWords(['web', 'vr'])).toBe('WEB and VR — from your access plan');
    expect(summaryFormatsWords([])).toBe('—');
    expect(B2_05).toContain(inheritedFromWords('ACC-0107'));
    expect(B2_05).toContain(licencesLineWords('ACC-0107', 120, 'Yearly', '2027-10-07'));
    expect(B2_05).toContain("'Group ' + grp.name");
    expect(groupWho('ME ZG523 — Sem II')).toBe('Group ME ZG523 — Sem II');
  });

  it('the group’s members are stated as B2-05 f5 draws them', () => {
    expect(B2_05).toContain("now.length + ' members can open it straight away'");
    expect(membersCanOpenWords(4)).toBe('4 members can open it straight away');
    expect(B2_05).toContain("m.n + ' is waiting for a licence'");
    expect(memberWaitingWords('Arun Kumar')).toBe('Arun Kumar is waiting for a licence');
    expect(B2_05).toContain(
      "m.n + ' already has it individually (' + s.has[m.id] + '). That grant isn’t changed.'",
    );
    expect(memberHasItWords('Rahul Verma', 'SACC-0310')).toBe(
      'Rahul Verma already has it individually (SACC-0310). That grant isn’t changed.',
    );
    expect(B2_05).toContain("m.n + ' is inactive and can’t open experiments while inactive'");
    expect(memberInactiveWords('Sneha Reddy')).toBe(
      'Sneha Reddy is inactive and can’t open experiments while inactive',
    );
  });

  it('the result notes are B2-05 f3 and f11’s', () => {
    expect(seesItWords('Rahul Verma', ['web', 'vr'])).toBe(
      'Rahul sees it in My courses with WEB and VR.',
    );
    expect(B2_05).toContain(seesItWords('Rahul Verma', ['web', 'vr']));
    expect(noLicenceWords('Fatima Begum', 'ACC-0107')).toBe(
      'No licence is available for Fatima on ACC-0107 right now.',
    );
    expect(B2_05).toContain(noLicenceWords('Fatima Begum', 'ACC-0107'));
  });

  it('the message pages are B2-05 f16 and f17’s', () => {
    expect(B2_05).toContain(planEndedTitle('ACC-0107'));
    expect(B2_05).toContain(planEndedLine('2027-10-07'));
    expect(B2_05).toContain(
      `${GIVE_ACCESS.nothingHeld.line} ${requestAwaitingPaymentWords('REQ-0042')}`,
    );
  });

  it('the step checks’ words are the contract catalogue’s drawn messages', () => {
    for (const key of [
      'IA-05.experimentIds.required',
      'IA-05.students.required',
      'IA-05.group.required',
    ] as const) {
      expect(B2_05).toContain(DRAWN_MESSAGES[key].text);
    }
  });
});
