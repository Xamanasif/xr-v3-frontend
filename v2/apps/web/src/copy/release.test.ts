/**
 * The words of SA-10 Content › Updates and SA-11 Release or hold an update (B7-05, B7-10, B7-11)
 * are the frozen boards’: each drawn phrase is found verbatim in B7-05's markup or script, the
 * composed ones with the board's own sample values; the one sentence with a decision id is shown
 * without it (P1-14); the undrawn forms are provisional entries of the state-copy register, each
 * with its decision and no decision id in its words. “Publish” is never said on this path.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  accessCell,
  accessEndsNote,
  approvedByLine,
  approvedOnLine,
  DECISION_PAGE,
  decisionOverline,
  HISTORY,
  HOLD_DIALOG,
  HOLD_OPEN,
  holdEffect,
  holdLine,
  holdTitle,
  LIFT_DIALOG,
  liftedLine,
  liftTitle,
  liveLine,
  onHoldSinceLine,
  quoted,
  raisedLine,
  RELEASE_DIALOG,
  releasedLine,
  releasedNext,
  releasedOnLine,
  releaseEffect,
  releaseTitle,
  rowActionLabel,
  studentsCell,
  UPDATE_STATUS,
  updateName,
  UPDATES_PAGE,
} from './release';
import { STATE_COPY, type StateCopyEntry } from './state-copy';
import { STATE_COPY_RELEASE } from './state-copy-release';

/** A board's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B7_05 = words('B7-05-Content-Updates-Release-Hold.dc.html');

/** Each piece is in the board's markup or script (without printing the whole board on a miss). */
function onBoard(source: string, ...pieces: readonly string[]): void {
  for (const piece of pieces) expect(source.includes(piece), piece).toBe(true);
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('SA-10 words (B7-05 f0, f2, f3, f4)', () => {
  it('every fixed phrase is on the board', () => {
    onBoard(B7_05, ...strings(UPDATES_PAGE));
    onBoard(B7_05, ...Object.values(UPDATE_STATUS).map((status) => status.words));
  });

  it('the composed rows read as the board draws them (rendered frames; the script’s pieces)', () => {
    expect(updateName('Distillation Column', '1.2', '1.3')).toBe('Distillation Column · 1.2 → 1.3');
    onBoard(B7_05, "L.name + ' · '", "' → '");
    expect(approvedOnLine('27 Aug 2026')).toBe('Approved by the Academic Reviewer on 27 Aug 2026');
    expect(onHoldSinceLine('20 Aug 2026')).toBe('On hold since 20 Aug 2026');
    expect(releasedOnLine('5 Aug 2026')).toBe('Released on 5 Aug 2026');
    onBoard(B7_05, "'Approved by the Academic Reviewer on '", "'On hold since '", "'Released on '");
    onBoard(B7_05, 'On hold since 20 Aug 2026', 'Released on 5 Aug 2026');
    expect(rowActionLabel('Review', 'UPD-0005', 'Distillation Column · 1.2 → 1.3')).toBe(
      'Review UPD-0005 Distillation Column · 1.2 → 1.3',
    );
    onBoard(B7_05, "(x.st === 'awaiting' ? 'Review ' : 'Open ') + x.id + ' ' + x.name");
    // The board's status words for the three tabs (U7 `stw`) and their chips.
    expect(UPDATE_STATUS['awaiting-release-decision'].tone).toBe('wait');
    expect(UPDATE_STATUS['on-hold'].tone).toBe('paused');
    expect(UPDATE_STATUS.released.tone).toBe('ok');
  });
});

describe('SA-11 words (B7-05 f1, f5 … f11; B7-10 f0 … f4)', () => {
  it('every fixed phrase is on the board', () => {
    onBoard(B7_05, ...strings(DECISION_PAGE));
    onBoard(B7_05, ...strings({ ...RELEASE_DIALOG, ...HOLD_DIALOG, ...LIFT_DIALOG }));
    onBoard(B7_05, HISTORY.started, HISTORY.sent, HISTORY.liftedNote);
  });

  it('the header, the panel and the history read as the board draws them', () => {
    expect(decisionOverline('UPD-0005')).toBe('UPD-0005 · Correction to published content');
    onBoard(B7_05, "' · Correction to published content'");
    expect(liveLine('1.2', '3 Jul 2026', false)).toBe('Live now: version 1.2 · since 3 Jul 2026');
    expect(liveLine('1.3', '23 Oct 2026', true)).toBe(
      'Live now: version 1.3 · released 23 Oct 2026',
    );
    onBoard(
      B7_05,
      "'Live now: version ' + L.ver + (ust === 'released' ? ' · released ' + day(u.rel) : ' · since ' + L.since)",
    );
    expect(liftedLine('24 Oct 2026')).toBe(
      'The hold was lifted on 24 Oct 2026. It is waiting for your decision again.',
    );
    onBoard(
      B7_05,
      "'The hold was lifted on ' + day(u.lifted) + '. It is waiting for your decision again.'",
    );
    expect(raisedLine('Kavya Nair', 'Content Manager', '25 Aug 2026', '25 Aug 2026')).toBe(
      'Raised by Kavya Nair, Content Manager · started 25 Aug 2026 · sent for academic review 25 Aug 2026',
    );
    onBoard(
      B7_05,
      "'Raised by ' + D.cm + ', Content Manager · started ' + day(u.started) + ' · sent for academic review ' + day(u.sent)",
    );
    expect(raisedLine('Kavya Nair', 'Content Manager', '25 Aug 2026', null)).toBe(
      'Raised by Kavya Nair, Content Manager · started 25 Aug 2026',
    );
    expect(approvedByLine('Prof. A. Menon', '27 Aug 2026')).toBe(
      'Approved by Prof. A. Menon on 27 Aug 2026',
    );
    onBoard(B7_05, "'Approved by ' + D.rv + ' on ' + day(u.appr)");
    expect(accessCell('ACC-0098', ['WEB', 'VR'])).toBe('ACC-0098 · WEB + VR');
    expect(studentsCell(46)).toBe('46 students with access');
    expect(accessEndsNote('31 Oct 2026', 'REQ-0038')).toBe(
      'Access ends 31 Oct 2026 · renewal REQ-0038 under review',
    );
    onBoard(
      B7_05,
      '"plan": "ACC-0098 · WEB + VR"',
      '"students": "46 students with access"',
      '"note": "Access ends 31 Oct 2026 · renewal REQ-0038 under review"',
    );
    expect(studentsCell(1)).toBe('1 student with access');
    expect(studentsCell(0)).toBe('No students with access yet');
    expect(accessEndsNote('7 Oct 2027', null)).toBe('Access ends 7 Oct 2027');
    expect(holdLine('23 Oct 2026', 'Arjun Mehta')).toBe('On hold since 23 Oct 2026 · Arjun Mehta');
    onBoard(B7_05, "'On hold since ' + day(u.hold.when) + ' · ' + E.sa");
    expect(releasedLine('23 Oct 2026', 'Arjun Mehta')).toBe(
      'Released on 23 Oct 2026 · Arjun Mehta',
    );
    onBoard(B7_05, "'Released on ' + day(u.rel) + ' · ' + E.sa");
    expect(releasedNext('1.3')).toBe(
      'Version 1.3 is live for everyone. The history below keeps the earlier version and every decision.',
    );
    onBoard(
      B7_05,
      "' is live for everyone. The history below keeps the earlier version and every decision.'",
    );
    expect(quoted('Hold until …')).toBe('“Hold until …”');
    // The history (`uh`, `histAdd`).
    onBoard(
      B7_05,
      `"what": "${HISTORY.started}", "when": "25 Aug 2026, 15:40", "note": "${HISTORY.startedNote('1.2')}"`,
      `"what": "${HISTORY.sent}", "when": "25 Aug 2026, 16:00", "note": "${HISTORY.sentNote('Prof. A. Menon', '1.2')}"`,
      `"what": "${HISTORY.approved('Prof. A. Menon')}", "when": "27 Aug 2026, 11:20", "note": "${HISTORY.approvedNote('1.2')}"`,
      `"what": "${HISTORY.held('Arjun Mehta')}"`,
      `"what": "${HISTORY.lifted('Arjun Mehta')}", "when": "24 Oct 2026, 09:45", "note": "${HISTORY.liftedNote}"`,
      `"what": "${HISTORY.released('Arjun Mehta')}", "when": "23 Oct 2026, 10:30", "note": "${HISTORY.releasedNote('1.3')}"`,
    );
    expect(
      HISTORY.heldNote(
        'Hold until the Hyderabad lab has finished this month’s runs on version 1.2.',
        '1.2',
      ),
    ).toBe(
      '“Hold until the Hyderabad lab has finished this month’s runs on version 1.2.” Version 1.2 stays live.',
    );
    onBoard(B7_05, "'“' + T(c.sreason) + '” Version ' + c.live.ver + ' stays live.'");
  });

  it('the confirmations say exactly what goes live and for whom (never “Publish”)', () => {
    expect(releaseTitle('UPD-0005')).toBe('Release UPD-0005?');
    onBoard(B7_05, "'Release ' + (u ? u.id : '') + '?'");
    expect(releaseEffect('1.3', 'Distillation Column', '1.2')).toBe(
      'Version 1.3 of Distillation Column goes live for everyone — the public catalogue and every institution that uses it. Version 1.2 is no longer shown.',
    );
    onBoard(
      B7_05,
      "'Version ' + T(u.ver) + ' of ' + L.name + ' goes live for everyone — the public catalogue and every institution that uses it. Version ' + L.ver + ' is no longer shown.'",
    );
    expect(holdTitle('UPD-0005')).toBe('Hold UPD-0005?');
    onBoard(B7_05, "'Hold ' + (u ? u.id : '') + '?'");
    expect(holdEffect('1.2')).toBe(
      'Version 1.2 stays live. The update waits until you lift the hold. The Content Manager sees your reason.',
    );
    onBoard(
      B7_05,
      "'Version ' + L.ver + ' stays live. The update waits until you lift the hold. The Content Manager sees your reason.'",
    );
    expect(liftTitle('UPD-0005')).toBe('Lift the hold on UPD-0005?');
    onBoard(B7_05, "'Lift the hold on ' + (u ? u.id : '') + '?'");
  });

  it('the open hold sentence is shown without its decision id (P1-14)', () => {
    onBoard(B7_05, HOLD_OPEN.drawn);
    expect(HOLD_OPEN.ids).toEqual(['T-28']);
    expect(HOLD_OPEN.words).toBe(
      'What else a hold affects, and whether it blocks later corrections, is still open.',
    );
  });

  it('nothing on this path says “Publish”', () => {
    const all = [
      ...strings({ UPDATES_PAGE, DECISION_PAGE, RELEASE_DIALOG, HOLD_DIALOG, LIFT_DIALOG }),
      HOLD_OPEN.words,
      releaseEffect('1.3', 'Distillation Column', '1.2'),
      holdEffect('1.2'),
      ...(Object.values(STATE_COPY_RELEASE) as readonly StateCopyEntry[]).flatMap((entry) => [
        entry.words ?? '',
        entry.rule ?? '',
      ]),
    ];
    for (const phrase of all) expect(phrase).not.toMatch(/\bPublish/);
  });
});

describe('the release state-copy entries', () => {
  it('are in the one register, each provisional with a decision and no decision id in its words', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_RELEASE)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(['SA-10', 'SA-11']).toContain(entry.screen);
      expect(entry.status).toBe('provisional');
      expect(entry.decisions?.length).toBeGreaterThan(0);
      expect(entry.words ?? '').not.toMatch(/\b(?:T|VD|OD|PC|DEV)-\d/);
    }
  });
});
