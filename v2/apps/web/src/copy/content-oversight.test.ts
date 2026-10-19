/**
 * The words of SA-12 All content and SA-13 Content record (B7-06) are the
 * frozen boards': each drawn string is on its board, and each composed line takes the board's form
 * for the board's own sample. Words the boards do not draw are state-copy entries.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  ALL_CONTENT,
  CONTENT_PAGE,
  CONTENT_RECORD,
  inWorkflowLine,
  liveVersionWords,
  noReviewerWhat,
  OVERRIDE_FROM,
  overriddenFlash,
  overriddenWhere,
  overrideNote,
  overrideTitle,
  overrideTo,
  overrideWhat,
  publishedWhere,
  recheckWhere,
  recordCountWords,
  recordOverline,
  releasedCorrectionNote,
  returnedWhere,
  scopeWithdrawnNote,
  STATUS_WORDS,
  staysLive,
  staysLiveUntilReleased,
  stuckAdvice,
  stuckBody,
  stuckTitle,
  stuckWhy,
  submittedNote,
  updateApprovedNote,
  updateApprovedWhat,
  updateHeldWhat,
  updatesWaitingTitle,
  updateTag,
  updateWaitingLine,
  versionReleasedWhat,
  withContentManagerWhere,
  withReviewerWhere,
} from './content-oversight';

/** A board's text with tags removed, then its raw markup (attributes and script strings). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ')}\n${raw}`;
}

const B7_06 = words('B7-06-All-Content.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('SA-12 / SA-13 words are on B7-06', () => {
  it.each([
    ...strings(CONTENT_PAGE),
    ...strings(ALL_CONTENT),
    ...strings(CONTENT_RECORD),
    ...strings(STATUS_WORDS),
  ])('%s', (text) => {
    expect(B7_06).toContain(text);
  });

  it('the composed lines take B7-06’s forms', () => {
    expect(stuckTitle(1)).toBe('1 record stuck — nobody can act');
    expect(stuckTitle(2)).toBe('2 records stuck — nobody can act');
    expect(
      stuckBody([{ reference: 'SUB-0085', name: 'DC Motor Speed Control', course: 'EEE ZC341' }]),
    ).toBe('SUB-0085 · DC Motor Speed Control (EEE ZC341). Open the record to see why.');
    expect(recordCountWords(19, 19)).toBe('19 of 19 records');
    expect(updatesWaitingTitle(1)).toBe(ALL_CONTENT.updateWaitingTitle);
    expect(updatesWaitingTitle(2)).toBe('2 corrections are waiting for your release decision');
    // As B7-06's frames read them (f0 … f8; script-composed lines checked against the frames).
    const framed: readonly (readonly [string, string])[] = [
      [
        updateWaitingLine('UPD-0005', 'Distillation Column', '1.2', '1.3'),
        'UPD-0005 · Distillation Column 1.2 → 1.3 — approved by the Academic Reviewer.',
      ],
      [
        publishedWhere('1.2', '2026-07-03T04:30:00.000Z'),
        'Published · version 1.2 · live since 3 Jul 2026',
      ],
      [
        withReviewerWhere('2026-10-02T04:00:00.000Z'),
        'With the Academic Reviewer since 2 Oct 2026',
      ],
      [
        recheckWhere('2026-08-25T04:30:00.000Z'),
        'Back with the Academic Reviewer for a re-check since 25 Aug 2026',
      ],
      [
        withContentManagerWhere('2026-08-14T09:40:00.000Z'),
        'With the Content Manager since 14 Aug 2026',
      ],
      [returnedWhere('2026-08-24T04:30:00.000Z'), 'Returned to the vendor on 24 Aug 2026'],
      [
        overriddenWhere('2026-10-23T05:35:00.000Z'),
        'Moved back to the vendor on 23 Oct 2026 (Super Admin override)',
      ],
      [
        updateTag('UPD-0005', 'awaiting-release-decision'),
        'Update UPD-0005 · approved — waiting for your release decision',
      ],
      [updateTag('UPD-0004', 'on-hold'), 'Update UPD-0004 · on hold'],
      [updateTag('UPD-0006', 'returned'), 'Update UPD-0006 · returned to the Content Manager'],
      [
        stuckAdvice('EEE ZC341'),
        'Giving an Academic Reviewer EEE ZC341 in Platform roles lets the review continue. Use the override only when that isn’t possible.',
      ],
      [
        inWorkflowLine('Prof. A. Menon · Academic Reviewer'),
        'Who can act: Prof. A. Menon · Academic Reviewer. Nothing to do here.',
      ],
      [staysLiveUntilReleased('1.2'), 'Version 1.2 stays live until you release it.'],
      [staysLive('2.0'), 'Version 2.0 stays live.'],
      [liveVersionWords('1.2', '2026-07-03T04:30:00.000Z'), '1.2 · since 3 Jul 2026'],
      [overrideTitle('SUB-0085'), 'Move SUB-0085 out of review?'],
      [OVERRIDE_FROM, 'With Academic Reviewer — nobody can act'],
      [
        overrideTo('Ritu Sharma · Meridian Virtual Labs'),
        'Returned to vendor — Ritu Sharma · Meridian Virtual Labs can change it and send it again',
      ],
      [
        overriddenFlash('SUB-0085', 'Ritu Sharma · Meridian Virtual Labs'),
        'SUB-0085 is now with the vendor. Ritu Sharma · Meridian Virtual Labs can act on it.',
      ],
      [noReviewerWhat('EEE ZC341'), 'No Academic Reviewer has EEE ZC341 in scope'],
      [
        scopeWithdrawnNote('Prof. A. Menon', 'EEE ZC341', '2026-10-01T04:30:00.000Z'),
        'Prof. A. Menon’s EEE ZC341 scope was withdrawn on 1 Oct 2026 (Platform roles).',
      ],
      [
        submittedNote(1, 'Ritu Sharma', 'Meridian Virtual Labs'),
        'Revision 1 · from Ritu Sharma, Meridian Virtual Labs',
      ],
      [versionReleasedWhat('1.2'), 'Version 1.2 released'],
      [releasedCorrectionNote('UPD-0002'), 'Correction UPD-0002 — released by the Super Admin.'],
      [
        updateApprovedWhat('UPD-0005', true),
        'UPD-0005 approved by the Academic Reviewer — waiting for the release decision',
      ],
      [
        updateApprovedNote('1.2', '1.3'),
        'Correction 1.2 → 1.3. Version 1.2 stays live until it is released.',
      ],
      [updateHeldWhat('UPD-0004', 'Arjun Mehta'), 'UPD-0004 put on hold by Arjun Mehta'],
      [overrideWhat('Arjun Mehta'), 'Status moved by Arjun Mehta — override'],
      [
        overrideNote('Stuck since 2 Oct.'),
        '“Stuck since 2 Oct.” From “With Academic Reviewer” to “Returned to vendor”.',
      ],
    ];
    for (const [line, frame] of framed) expect(line).toBe(frame);
    // The words the board writes out in full (not composed by its script).
    const drawn = framed
      .map(([, frame]) => frame)
      .filter(
        (frame) =>
          !/^(Move SUB|Returned to vendor —|SUB-0085 is now|Status moved|“|Moved back|Who can act:|Version \d\.\d stays|1\.2 · since|With Academic Reviewer —)/.test(
            frame,
          ),
      );
    for (const line of drawn) expect(B7_06).toContain(line);
    // Composed by B7-06's script (`stuckWhy`): the frame f1 reads it so.
    expect(
      stuckWhy('Nobody — no Academic Reviewer has EEE ZC341 in scope', '2026-10-02T04:00:00.000Z'),
    ).toBe(
      'Nobody — no Academic Reviewer has EEE ZC341 in scope. It has been waiting since 2 Oct 2026.',
    );
    expect(B7_06).toContain("r.who + '. It has been waiting since '");
    // B7-06 `rOver` (upper-cased by the sheet's overline).
    expect(recordOverline('SUB-0085', 'EEE ZC341', 'Electrical Machines')).toBe(
      'SUB-0085 · EEE ZC341 · Electrical Machines',
    );
    expect(recordOverline(null, 'CHE ZG513', 'Process Instrumentation & Control')).toBe(
      'CHE ZG513 · Process Instrumentation & Control',
    );
    expect(B7_06).toContain("(r.ref ? r.ref + ' · ' : '') + r.course + ' · ' + r.cname");
  });
});
