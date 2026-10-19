/**
 * The words of SA-10 … SA-13 in the V3 Refined B design are the owner-approved Super Admin
 * export's (design/v3-refined-b/roles/SA-v1, `sa-views-c.js`, `sa-core.js`): each fixed phrase is
 * in its views, each composed one reads as the export composes it for its own sample. No internal
 * reference is part of any of them, and the release path never says “Publish”.
 */
import { describe, expect, it } from 'vitest';

import { saExport } from '@/test-support/boards';

import {
  accessPlanCell,
  ALL_CONTENT_LIST,
  approvedMeta,
  CONTENT_HEAD,
  CONTENT_RECORD_V3,
  contentCount,
  contentRowLabel,
  CORRECTION_STATUS,
  correctionsWaitingLine,
  correctionsWaitingTitle,
  correctionTag,
  DIALOG_GROUPS,
  heldFlash,
  heldMeta,
  HOLD_CONFIRM,
  holdChoiceLine,
  holdConfirmDescription,
  holdConfirmTitle,
  inWorkflowLine,
  LIFT_CONFIRM,
  LIFTED_FLASH,
  liftConfirmTitle,
  liveNowColumn,
  liveVersionLine,
  overrideConfirmNow,
  overrideConfirmTitle,
  statusMovedNote,
  statusMovedWhat,
  proposedColumn,
  RELEASE_CONFIRM,
  releaseChoiceLine,
  releaseConfirmNow,
  releaseConfirmTitle,
  releasedColumn,
  releasedFlash,
  releasedMeta,
  reviewLine,
  searchChip,
  statusChip,
  statusOption,
  stuckLine,
  UPDATE_DECISION,
  updateRowLabel,
  updatesCaption,
  UPDATES_LIST,
  versionsLine,
  versionsNote,
  WORKFLOW_STATUS,
} from './sa-content';

const VIEWS = saExport('sa-views-c.js');
const CORE = saExport('sa-core.js');
const EXPORT = `${VIEWS}\n${CORE}`;

/** Each piece is in the export's source (without printing the whole file on a miss). */
function inExport(...pieces: readonly string[]): void {
  expect(pieces.filter((piece) => !EXPORT.includes(piece))).toEqual([]);
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

/** Words these screens show that the export does not draw. */
const DRAWN_ELSEWHERE = new Set<string>([
  // Kept from Phase 6: the export draws no persisted “Hold lifted” notice (state-copy
  // `SA-11.lifted-notice`).
  UPDATE_DECISION.liftedTitle,
]);

describe('SA-10 Content updates (`V.updates`)', () => {
  it('every fixed phrase is in the export', () => {
    inExport(...strings(CONTENT_HEAD).filter((word) => !DRAWN_ELSEWHERE.has(word)));
    inExport(...strings(UPDATES_LIST).filter((word) => !DRAWN_ELSEWHERE.has(word)));
    inExport(...Object.values(CORRECTION_STATUS).map((status) => status.words));
    inExport('<span class="rk-strong">Academic Reviewer</span>');
  });

  it('the composed rows read as the export composes them', () => {
    expect(updatesCaption('waiting')).toBe('Corrections, Waiting for your decision');
    inExport('<caption>Corrections, ');
    expect(versionsLine('1.2', '1.3')).toBe('Version 1.2 → 1.3');
    inExport("Version ' + esc(u.from) + ' → ' + esc(u.to)");
    expect(versionsNote('1.2', null)).toBe('Version 1.2 stays live until released');
    expect(versionsNote('1.0', '5 Aug 2026')).toBe('Released 5 Aug 2026');
    inExport("'Released ' + (u.rel || '')", "' stays live until released'");
    expect(updateRowLabel('Distillation Column', '1.2', '1.3', 'Waiting for your decision')).toBe(
      'Distillation Column correction, version 1.2 to 1.3, Waiting for your decision. Open',
    );
    inExport(
      "u.name + ' correction, version ' + u.from + ' to ' + u.to + ', ' + UPD_LBL[u.st] + '. Open'",
    );
    expect(Object.values(CORRECTION_STATUS).map((status) => status.tone)).toEqual([
      'warn',
      'paused',
      'ok',
    ]);
    inExport("{ awaiting: 'warn', hold: 'paused', released: 'ok', returned: 'info' }");
  });
});

describe('SA-11 Release or hold an update (`V.update` and its confirmations)', () => {
  it('every fixed phrase is in the export', () => {
    inExport(...strings(UPDATE_DECISION).filter((word) => !DRAWN_ELSEWHERE.has(word)));
    inExport(...strings(DIALOG_GROUPS), ...strings(RELEASE_CONFIRM), ...strings(HOLD_CONFIRM));
    inExport(...strings(LIFT_CONFIRM), ...strings(LIFTED_FLASH));
  });

  it('the composed lines read as the export composes them', () => {
    expect(approvedMeta('Prof. A. Menon', '27 Aug 2026')).toBe(
      'Approved by Prof. A. Menon on 27 Aug 2026',
    );
    inExport("Approved by ' + esc(u.by) + ' on ' + esc(u.appr.split(',')[0])");
    expect([liveNowColumn('1.2'), proposedColumn('1.3'), releasedColumn('1.3')]).toEqual([
      'Live now · 1.2',
      'Proposed · 1.3',
      'Released · 1.3',
    ]);
    inExport("'Live now · ' + esc(u.from)", "'Proposed · ') + esc(u.to)", "'Released · '");
    expect(reviewLine('Prof. A. Menon', '27 Aug 2026, 11:20')).toBe(
      'Approved by Prof. A. Menon on 27 Aug 2026, 11:20. The full review history is below.',
    );
    inExport("'. The full review history is below.");
    expect(accessPlanCell(['WEB', 'VR'])).toBe('In its access plan · WEB, VR');
    inExport("'In its access plan · ' + e[2].join(', ')");
    expect(releaseChoiceLine('1.3')).toBe('Version 1.3 goes live for everyone.');
    expect(holdChoiceLine('1.2')).toBe('Version 1.2 stays live. You can lift the hold later.');
    inExport("' goes live for everyone.'", "' stays live. You can lift the hold later.'");
    expect(heldMeta('20 Aug 2026', 'Arjun Mehta')).toBe(
      'Put on hold on 20 Aug 2026 by Arjun Mehta',
    );
    expect(releasedMeta('5 Aug 2026', 'Arjun Mehta')).toBe('Released on 5 Aug 2026 by Arjun Mehta');
    inExport(
      "Put on hold on ' + esc(u.hold.when) + ' by Arjun Mehta",
      "Released on ' + esc(u.rel) + ' by Arjun Mehta",
    );
    expect(releaseConfirmTitle('1.3', 'Distillation Column')).toBe(
      'Release version 1.3 of Distillation Column?',
    );
    expect(releaseConfirmNow('1.3', '1.2')).toEqual([
      'Version 1.3 goes live for everyone: the public catalogue and every institution using it.',
      'Version 1.2 is kept in the history as Live before.',
    ]);
    inExport(
      "'Release version ' + u.to + ' of ' + u.name + '?'",
      "' goes live for everyone: the public catalogue and every institution using it.'",
      "' is kept in the history as Live before.'",
    );
    expect(holdConfirmTitle('Distillation Column')).toBe(
      'Hold the Distillation Column correction?',
    );
    expect(holdConfirmDescription('1.2')).toBe(
      'Version 1.2 stays live. The Content Manager sees your reason.',
    );
    expect(liftConfirmTitle('Distillation Column')).toBe(
      'Lift the hold on the Distillation Column correction?',
    );
    inExport(
      "'Hold the ' + u.name + ' correction?'",
      "' stays live. The Content Manager sees your reason.'",
      "'Lift the hold on the ' + u.name + ' correction?'",
    );
    expect(releasedFlash('1.3')).toEqual({
      title: 'Version 1.3 is live.',
      line: 'Everyone now sees the corrected experiment. No access changed.',
    });
    expect(heldFlash('1.2')).toEqual({
      title: 'The correction is on hold.',
      line: 'Version 1.2 stays live.',
    });
    inExport(
      "' is live.', 'Everyone now sees the corrected experiment. No access changed.'",
      "'The correction is on hold.', 'Version ' + u.from + ' stays live.'",
    );
  });
});

describe('SA-12 All content (`V.allContent`)', () => {
  it('every fixed phrase and every status is in the export', () => {
    inExport(...strings(ALL_CONTENT_LIST).filter((word) => word !== ALL_CONTENT_LIST.showStuck));
    inExport(
      ...Object.entries(WORKFLOW_STATUS)
        .filter(([key]) => key !== 'resubmitted')
        .map(([, status]) => status.words),
    );
    inExport(
      "CONT_KIND = { published: 'ok', stuck: 'err', review: 'info', cm: 'info', vendor: 'warn' }",
    );
  });

  it('the composed lines read as the export composes them', () => {
    expect(statusOption('All statuses', 19)).toBe('All statuses (19)');
    inExport("' (' + S.content.filter(");
    expect(contentCount(19, 19, false)).toBe('19 records · read-only');
    expect(contentCount(3, 19, true)).toBe('3 of 19 records · read-only');
    inExport("' of ' + SA.plural(S.content.length, 'record')", "' · read-only</p>'");
    expect(searchChip('Heat')).toBe('Search: “Heat”');
    expect(statusChip('Published')).toBe('Status: Published');
    inExport("'Search: “' + SA.T(L.q) + '”'", "'Status: ' + CF.find");
    expect(contentRowLabel('DC Motor Speed Control', 'Stuck — nobody can act')).toBe(
      'DC Motor Speed Control, Stuck — nobody can act. Open the record',
    );
    inExport("c.name + ', ' + SA.CONT_LBL[s] + '. Open the record'");
    expect(correctionTag('awaiting-release-decision')).toBe(
      'Correction waiting for your release decision',
    );
    expect(correctionTag('on-hold')).toBe('Correction on hold');
    expect(correctionTag('returned')).toBeNull();
    inExport("'Correction waiting for your release decision' : 'Correction on hold'");
    expect(correctionsWaitingTitle(1)).toBe('A correction is waiting for your release decision');
    expect(correctionsWaitingTitle(2)).toBe('2 corrections are waiting for your release decision');
    inExport("' corrections are waiting for your release decision'");
    expect(correctionsWaitingLine([{ name: 'Distillation Column', from: '1.2', to: '1.3' }])).toBe(
      'Distillation Column 1.2 → 1.3.',
    );
    inExport("u.name + ' ' + u.from + ' → ' + u.to).join(' · ')) + '.'");
  });
});

describe('SA-13 Content record (`V.record` and the override)', () => {
  it('every fixed phrase is in the export', () => {
    inExport(...strings(CONTENT_RECORD_V3));
  });

  it('the composed lines read as the export composes them', () => {
    expect(stuckLine('EEE ZC341')).toBe(
      'No Academic Reviewer has EEE ZC341 in scope, so this review can’t continue. Giving an Academic Reviewer EEE ZC341 in Platform roles lets the review continue. Use the override only when that isn’t possible.',
    );
    inExport(
      "' in scope, so this review can’t continue. Giving an Academic Reviewer ' + esc(c.course) + ' in Platform roles lets the review continue. Use the override only when that isn’t possible.'",
    );
    expect(inWorkflowLine('Prof. A. Menon · Academic Reviewer')).toBe(
      'Prof. A. Menon · Academic Reviewer can act on it. Nothing is needed from you.',
    );
    inExport("' can act on it. Nothing is needed from you.'");
    expect(liveVersionLine('1.2', '3 Jul 2026')).toBe('Version 1.2, live since 3 Jul 2026');
    inExport("'Version ' + esc(c.ver) + ', live since ' + esc(c.since)");
    expect(overrideConfirmTitle('DC Motor Speed Control')).toBe(
      'Return DC Motor Speed Control to the vendor?',
    );
    expect(overrideConfirmNow('Ritu Sharma · Meridian Virtual Labs')).toEqual([
      'Its status moves from “With the Academic Reviewer” to “Returned to the vendor”.',
      'Ritu Sharma · Meridian Virtual Labs can work on it again.',
    ]);
    inExport("'Return ' + c.name + ' to the vendor?'", "' can work on it again.'");
    expect(statusMovedWhat('Arjun Mehta')).toBe('Status moved by Arjun Mehta (override)');
    expect(statusMovedNote('No reviewer until November.')).toBe(
      '“No reviewer until November.” From “With the Academic Reviewer” to “Returned to the vendor”.',
    );
    inExport(
      "'Status moved by Arjun Mehta (override)'",
      "'” From “With the Academic Reviewer” to “Returned to the vendor”.'",
    );
  });
});

describe('the Content words as a whole', () => {
  const all = [
    CONTENT_HEAD,
    UPDATES_LIST,
    UPDATE_DECISION,
    DIALOG_GROUPS,
    RELEASE_CONFIRM,
    HOLD_CONFIRM,
    LIFT_CONFIRM,
    LIFTED_FLASH,
    ALL_CONTENT_LIST,
    WORKFLOW_STATUS,
    CONTENT_RECORD_V3,
  ].flatMap(strings);

  it('name no internal reference and never say “Publish” on the release path', () => {
    for (const words of all) expect(words).not.toMatch(/\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/);
    for (const words of strings([UPDATES_LIST, UPDATE_DECISION, RELEASE_CONFIRM, HOLD_CONFIRM])) {
      expect(words).not.toMatch(/\bPublish/);
    }
  });
});
