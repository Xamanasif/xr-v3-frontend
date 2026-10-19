/**
 * The words of SA-01 Overview are the owner-approved Super Admin export's (design/v3-refined-b/
 * roles/SA-v1 `sa-views-a.js` `V.overview`, `sa-core.js` `SA.work`, and the sentence forms of its
 * sample records in `sa-data.js`): each drawn string is in the export's source, and each composed
 * line takes the export's form. No internal reference is ever written. (Moved here from the
 * B7-01 checks of `content-oversight.test.ts` and `institutions.test.ts`.)
 */
import { describe, expect, it } from 'vitest';

import { saExport } from '@/test-support/boards';

import {
  activeInstitutionsExtra,
  assignAdminName,
  assignScopeName,
  categoryAnnouncement,
  correctionPriorityLine,
  correctionTitle,
  dayFullMonth,
  endingActionName,
  endingPriorityLine,
  endingRowLine,
  endsIn,
  holderRowLine,
  holderRowTitle,
  noAdminRowLine,
  noAdminRowTitle,
  openReportName,
  openRequestName,
  openStuckName,
  OVERVIEW_CATEGORIES,
  OVERVIEW_GROUPS,
  OVERVIEW_PAGE,
  PRIORITY_KINDS,
  reportRowLine,
  requestRowLine,
  requestRowTitle,
  reviewCorrectionName,
  reviewTransferName,
  ROW_ACTIONS,
  stuckRowLine,
  stuckRowTitle,
  transferRowLine,
  transferRowTitle,
  updateRowLine,
  updateRowTitle,
  waitingSince,
  waitSince,
} from './overview';

const VIEWS = saExport('sa-views-a.js');
const SA = ['sa-views-a.js', 'sa-core.js', 'sa-data.js'].map(saExport).join('\n');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const INTERNAL = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d/;

describe('SA-01 words are the SA export’s', () => {
  it.each([
    ...strings(OVERVIEW_PAGE),
    ...strings(OVERVIEW_GROUPS),
    ...strings(ROW_ACTIONS),
    ...strings(PRIORITY_KINDS),
    ...OVERVIEW_CATEGORIES.map((category) => category.label),
  ])('%s', (text) => {
    expect(SA).toContain(text);
  });

  it('the figures, the category announcement and the waits take the export’s forms', () => {
    // 23 Oct 2026, 10:05 IST.
    const today = '2026-10-23T04:35:00.000Z';
    expect(activeInstitutionsExtra(1, 1)).toBe('1 paused, 1 awaiting payment.');
    expect(activeInstitutionsExtra(0, 2)).toBe('2 awaiting payment.');
    expect(activeInstitutionsExtra(0, 0)).toBeNull();
    expect(VIEWS).toContain(
      "paused ? paused + ' paused' : '', pay ? pay + ' awaiting payment' : ''",
    );
    expect(categoryAnnouncement('Requests', 3)).toBe('Requests, 3 items');
    expect(categoryAnnouncement('Support', 1)).toBe('Support, 1 item');
    expect(waitSince('2026-09-24T10:32:00.000Z', today)).toEqual({
      big: '29 days',
      small: 'since 24 Sep',
    });
    expect(waitSince('2026-10-23T03:00:00.000Z', today)).toEqual({ big: 'Today', small: '23 Oct' });
    expect(waitSince('2026-10-22T03:00:00.000Z', today)).toEqual({
      big: '1 day',
      small: 'since 22 Oct',
    });
    expect(waitSince('2026-09-30T03:00:00.000Z', today, 'sent')).toEqual({
      big: '23 days',
      small: 'sent 30 Sep',
    });
    expect(endsIn('2026-10-31', 8)).toEqual({ big: 'In 8 days', small: '31 Oct' });
    expect(endsIn('2026-10-23', 0)).toEqual({ big: 'Today', small: '23 Oct' });
    expect(waitingSince('2026-08-27T05:50:00.000Z')).toBe('Waiting since 27 Aug');
    expect(dayFullMonth('2026-09-24T10:32:00.000Z')).toBe('24 September');
    expect(CORE_FORMS.filter((form) => !SA.includes(form))).toEqual([]);
  });

  it('every row takes the export’s form, naming no internal reference', () => {
    const lines = [
      requestRowTitle('Konark Polytechnic', 'additional-licences'),
      requestRowTitle('BITS Pilani — Hyderabad Campus', 'renewal'),
      requestRowLine('additional-licences', { count: 1, firstName: 'Buck Converter Ripple' }, null),
      requestRowLine('renewal', { count: 3, firstName: null }, '2026-10-31'),
      openRequestName('additional-licences', 'Konark Polytechnic'),
      openRequestName('renewal', 'BITS Pilani — Hyderabad Campus'),
      updateRowTitle('Distillation Column', '1.2', '1.3'),
      updateRowLine('2026-08-27T05:50:00.000Z', '1.2'),
      reviewCorrectionName('Distillation Column'),
      correctionTitle('Distillation Column'),
      correctionPriorityLine('1.3', '2026-08-27T05:50:00.000Z', '1.2'),
      transferRowTitle('VR', 'Rahul Verma'),
      transferRowLine('Godavari Institute of Technology'),
      reviewTransferName('VR', 'Rahul Verma'),
      reportRowLine('Meera Iyer', 'Institute Admin'),
      openReportName('Usage page took a long time to load'),
      endingRowLine('2026-10-31', true),
      endingRowLine('2026-11-02', false),
      endingPriorityLine('2026-09-24T10:32:00.000Z', true),
      endingPriorityLine(null, false),
      endingActionName('BITS Pilani — Hyderabad Campus', true),
      endingActionName('Konark Polytechnic', false),
      noAdminRowTitle('Sahyadri Institute of Engineering'),
      noAdminRowLine(false, '2026-09-30T04:30:00.000Z'),
      assignAdminName('Sahyadri Institute of Engineering'),
      stuckRowTitle('DC Motor Speed Control'),
      stuckRowLine('EEE ZC341', '2026-10-02T04:00:00.000Z'),
      openStuckName('DC Motor Speed Control'),
      holderRowTitle('Dr K. Iyer'),
      holderRowLine('Academic Reviewer', '2026-10-20T04:30:00.000Z'),
      assignScopeName('Dr K. Iyer'),
    ];
    expect(lines).toEqual([
      'Konark Polytechnic asks for additional licences',
      'BITS Pilani — Hyderabad Campus asks to renew its access',
      'Additional licences for Buck Converter Ripple.',
      'Renewal for 3 experiments. Access ends on 31 October.',
      'Open the additional licences request from Konark Polytechnic',
      'Open the renewal request from BITS Pilani — Hyderabad Campus',
      'Distillation Column correction, version 1.2 to 1.3',
      'Approved by the Academic Reviewer on 27 August. Version 1.2 is still live.',
      'Review the Distillation Column correction',
      'Distillation Column correction',
      'Version 1.3 was approved by the Academic Reviewer on 27 August. Version 1.2 is still live.',
      'VR device transfer for Rahul Verma',
      'Godavari Institute of Technology. Forwarded by its Institute Admin.',
      'Review the VR device transfer for Rahul Verma',
      'Meera Iyer, Institute Admin',
      'Open the report: Usage page took a long time to load',
      'Access ends on 31 October. Renewal in progress.',
      'Access ends on 2 November. Reminder due; nothing is sent from here.',
      'Its renewal request has been under review since 24 September.',
      'The reminder is due. Nothing is sent from here.',
      'Open the renewal request from BITS Pilani — Hyderabad Campus',
      'View access ending for Konark Polytechnic',
      'Sahyadri Institute of Engineering has no Institute Admin',
      'Access active since 30 September. Nobody there can give students access.',
      'Assign an Institute Admin to Sahyadri Institute of Engineering',
      'DC Motor Speed Control is stuck in review',
      'EEE ZC341. With the Academic Reviewer since 2 October; no reviewer has this course in scope.',
      'Open DC Motor Speed Control in All content',
      'Dr K. Iyer has no scope yet',
      'Academic Reviewer, registered 20 October. Can’t act on anything yet.',
      'Assign scope to Dr K. Iyer',
    ]);
    for (const line of lines) expect(line).not.toMatch(INTERNAL);
  });
});

/** The export's own forms the composed lines follow (`SA.work`, `V.overview`). */
const CORE_FORMS = [
  "n === 0 ? 'Today' : plural(n, 'day')",
  "(verb || 'since') + ' ' + dm(fromIso)",
  "'In ' + plural(n, 'day')",
  "' correction, version ' + u.from + ' to ' + u.to",
  "'Approved by the Academic Reviewer on ' + dLong(u.apprIso) + '. Version '",
  "' is still live.'",
  "' device transfer for ' + t.student",
  "'. Forwarded by its Institute Admin.'",
  "'Access ends on ' + dLong(e) + '. Renewal in progress.'",
  "'. Reminder due; nothing is sent from here.'",
  "'Its renewal request has been under review since ' + dLong(ren.iso) + '.'",
  "' has no Institute Admin'",
  "'. Nobody there can give students access.'",
  "' is stuck in review'",
  "'; no reviewer has this course in scope.'",
  "' has no scope yet'",
  "'. Can’t act on anything yet.'",
  "'Open the report: ' + s.title",
  "'Assign an Institute Admin to ' + i.name",
  "'Assign scope to ' + h.name",
  "Waiting since ' + esc(p.when2.replace('since ', ''))",
];
