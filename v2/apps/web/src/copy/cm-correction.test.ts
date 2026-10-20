/**
 * The words of the correction group: CM-05's correction entry (B6-08) and, in V3, CM-08 Updates and
 * the correction page with its CM-06 / CM-07 arrivals — the owner-approved export's (CM-v1
 * `project/Main.dc.html`): each drawn phrase is found verbatim in its markup or script, the composed
 * ones equal the export's with sample values and use the script's own pieces; the undrawn forms are
 * provisional entries of the state-copy register, each with its decision and no decision id in its
 * words. A correction never says "Publish".
 */
import { describe, expect, it } from 'vitest';

import { board, cmExport } from '@/test-support/boards';

import {
  ARRIVAL_GO,
  arrivalJoinBody,
  arrivalJoinTitle,
  arrivalNewBody,
  arrivalNewTitle,
  approvedMeanwhileLine,
  approvedNote,
  approvedWhat,
  awaitingLine,
  BACK_FROM_CORRECTION,
  changesWords,
  comparisonCaption,
  CORRECTION_ENTRY,
  draftLine,
  entryLabel,
  exampleVersionAfter,
  fieldsWords,
  heldNote,
  heldNoteBy,
  heldWhat,
  holdLine,
  holdReason,
  inReviewLine,
  lastSavedWords,
  LIFTED_NOTE,
  liftedLine,
  liftedWhat,
  liveUnchanged,
  liveUntilReleased,
  NO_UPDATE,
  packageHint,
  packageReferenceLabel,
  PENDING_PARTS,
  pendingLine,
  quotedReason,
  releasedFact,
  releasedLine,
  releasedNote,
  releasedOutcome,
  releasedWhat,
  returnedBy,
  returnedLine,
  returnedMeta,
  returnedNoteBy,
  returnedWhat,
  savedLine,
  SEND_DIALOG,
  sendStaysLive,
  sendTitle,
  SENT_AGAIN_WHAT,
  SENT_WHAT,
  sentNote,
  STALE_NOTICE,
  startedFact,
  startedNote,
  startedWhat,
  STATE_NOTICE,
  TRACKER,
  TRACKER_GROUPS,
  trackerActionLabel,
  trackerCount,
  trackerMeta,
  UPDATE_BAND,
  UPDATE_FACTS,
  UPDATE_PANEL,
  UPDATE_SHEET,
  updateEyebrow,
  UPDATES_HEAD,
  updateTitle,
  versionHint,
  versionNote,
  WITHDRAW_DIALOG,
  WITHDRAWN_WHAT,
  withdrawnLine,
  withdrawnNote,
  withdrawnNoteBy,
  withdrawnOutcome,
  withdrawTitle,
} from './cm-correction';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_CM_CORRECTION } from './state-copy-cm-correction';

/** A file's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function wordsOf(raw: string): string {
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B6_08 = wordsOf(board('B6-08-Published-and-Correction-Entry.dc.html'));
const CM = wordsOf(cmExport('Main.dc.html'));

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('CM-05 the correction entry (B6-08)', () => {
  it.each([...strings(CORRECTION_ENTRY), ...strings(BACK_FROM_CORRECTION)])(
    '“%s” is on B6-08',
    (phrase) => {
      expect(B6_08).toContain(phrase);
    },
  );

  it('each entry by the service’s name', () => {
    expect(entryLabel('start-a-correction')).toBe('Start a correction');
    expect(entryLabel('edit-catalogue-details')).toBe('Edit catalogue details');
    expect(entryLabel('edit-delivery-link')).toBe('Edit delivery link');
  });
});

/** Words drawn by the export that the product says differently (state-copy entries name why). */
const NOT_DRAWN = new Set<string>([
  // The reviewer is not named where the record does not name them (`CM-08.reviewer-unnamed`).
  SEND_DIALOG.reviewerCanReview,
]);

describe('CM-08 Updates and the correction (CM-v1)', () => {
  it.each(
    [
      ...strings(UPDATES_HEAD),
      ...strings(TRACKER_GROUPS),
      ...strings(TRACKER),
      ...strings(UPDATE_BAND),
      ...strings(UPDATE_FACTS),
      ...strings(ARRIVAL_GO),
      ...strings(UPDATE_SHEET),
      ...strings(UPDATE_PANEL),
      ...strings(PENDING_PARTS),
      ...strings(STATE_NOTICE),
      ...strings(STALE_NOTICE),
      ...strings(SEND_DIALOG),
      ...strings(WITHDRAW_DIALOG),
      SENT_WHAT,
      SENT_AGAIN_WHAT,
      WITHDRAWN_WHAT,
      LIFTED_NOTE,
    ].filter((phrase) => !NOT_DRAWN.has(phrase)),
  )('“%s” is in the export', (phrase) => {
    expect(CM).toContain(phrase);
  });

  it('the composed words are the export’s, from the script’s own pieces', () => {
    const composed: readonly (readonly [string, string, readonly string[]])[] = [
      [
        trackerCount(4),
        '4 corrections you raised, most recent change first',
        ["this.plural(rows.length, 'correction') + ' you raised, most recent change first'"],
      ],
      [
        trackerMeta('UPD-0006', 'EEE ZC341 · Electrical Machines', '26 Aug'),
        'UPD-0006 · EEE ZC341 · Electrical Machines · last change 26 Aug',
        ["u.id + ' · ' + this.cLabel(c) + ' · last change ' + this.short(u.last)"],
      ],
      [
        trackerActionLabel(true, 'UPD-0006', 'Induction Motor Loading', 'Returned'),
        'Continue UPD-0006, Induction Motor Loading, returned',
        [
          "(cont ? 'Continue ' : 'Open ') + u.id + ', ' + e.name + ', ' + U[u.st].label.toLowerCase()",
        ],
      ],
      [
        returnedNoteBy('Prof. A. Menon', '26 Aug'),
        'Prof. A. Menon, Academic Reviewer · 26 Aug',
        ["u.ret.who + ', Academic Reviewer · ' + this.short(u.ret.when)"],
      ],
      [
        heldNoteBy('Arjun Mehta', '20 Aug'),
        'Arjun Mehta, Super Admin · 20 Aug',
        ["u.hold.by + ', Super Admin · ' + this.short(u.hold.when)"],
      ],
      [
        withdrawnNoteBy('27 Aug'),
        'Your reason · 27 Aug',
        ["'Your reason · ' + this.short(u.wd.when)"],
      ],
      [quotedReason('It rises.'), '“It rises.”', ["'“' + u.ret.reason + '”'"]],
      [
        releasedOutcome('Arjun Mehta', '5 Aug 2026', '1.1'),
        'Released by Arjun Mehta, Super Admin, on 5 Aug 2026. Version 1.1 is live for everyone.',
        [
          "'Released by ' + u.rel.by + ', Super Admin, on ' + this.day(u.rel.when) + '. Version ' + v + ' is live for everyone.'",
        ],
      ],
      [
        withdrawnOutcome('27 Aug 2026'),
        'Withdrawn on 27 Aug 2026. Nothing changed in the live version.',
        ["'Withdrawn on ' + this.day(u.wd.when) + '. Nothing changed in the live version.'"],
      ],
      [
        updateEyebrow('UPD-0006'),
        'UPD-0006 · Correction to a published experiment',
        ["id + ' · Correction to a published experiment'"],
      ],
      [
        updateTitle('Induction Motor Loading'),
        'Update to Induction Motor Loading',
        ["'Update to ' + e.name"],
      ],
      [
        liveUntilReleased('1.0'),
        '1.0, unchanged until released',
        ["e.ver + ', unchanged until released'"],
      ],
      [liveUnchanged('1.0'), '1.0, unchanged', ["e.ver + ', unchanged'"]],
      [fieldsWords(2), '2 fields', ["this.plural(nCh, 'field')"]],
      [fieldsWords(1), '1 field', ["this.plural(nCh, 'field')"]],
      [
        startedFact('24 Aug 2026', 'edit-catalogue-details'),
        '24 Aug 2026 · from Edit catalogue details',
        ["this.day(u.started) + ' · from ' + u.entry", "'Edit catalogue details'"],
      ],
      [
        startedFact('27 Aug 2026', 'start-a-correction'),
        '27 Aug 2026 · from the published experiment',
        ["'the published experiment'"],
      ],
      [
        releasedFact('5 Aug 2026', 'Arjun Mehta'),
        '5 Aug 2026 · Arjun Mehta',
        ["this.day(u.rel.when) + ' · ' + u.rel.by"],
      ],
      [
        arrivalNewTitle('edit-catalogue-details'),
        'New correction draft, from Edit catalogue details',
        ["'New correction draft, from ' + entFrom"],
      ],
      [
        arrivalNewTitle('edit-delivery-link'),
        'New correction draft, from Edit a delivery link',
        ["'Edit a delivery link'"],
      ],
      [
        arrivalNewTitle('start-a-correction'),
        'New correction draft, from Start a correction',
        ["'Start a correction'"],
      ],
      [
        arrivalNewBody('edit-delivery-link', '1.0'),
        'The delivery details are pre-filled with live version 1.0. Change the link and say why. The live link keeps working until the Super Admin releases the update.',
        [
          "'The delivery details are pre-filled with live version ' + e.ver + '. Change the link and say why. The live link keeps working until the Super Admin releases the update.'",
        ],
      ],
      [
        arrivalNewBody('edit-catalogue-details', '1.0'),
        'Every field is pre-filled with live version 1.0. Change only what needs correcting and say why. Nothing changes in the catalogue until the Super Admin releases it.',
        [
          "'Every field is pre-filled with live version ' + e.ver + '. Change only what needs correcting and say why. Nothing changes in the catalogue until the Super Admin releases it.'",
        ],
      ],
      [arrivalJoinTitle('UPD-0006'), 'Your edit joins UPD-0006', ["'Your edit joins ' + id"]],
      [
        arrivalJoinBody('edit-delivery-link'),
        'This experiment already has an open correction, so your delivery change goes into it. One correction at a time per experiment.',
        [
          "'This experiment already has an open correction, so your ' + (entK === 'del' ? 'delivery change goes' : entK === 'cat' ? 'catalogue changes go' : 'changes go') + ' into it. One correction at a time per experiment.'",
        ],
      ],
      [
        returnedMeta('26 Aug 2026, 10:00', 'Prof. A. Menon'),
        '26 Aug 2026, 10:00 · Prof. A. Menon',
        ["u.ret.when + ' · ' + u.ret.who"],
      ],
      [
        returnedBy('Prof. A. Menon'),
        'Prof. A. Menon, Academic Reviewer',
        ["u.ret.who + ', Academic Reviewer'"],
      ],
      [
        versionHint('1.0'),
        'For example 1.1. The live version is 1.0.',
        ['For example {{ E.verExample }}. The live version is {{ E.liveVer }}.'],
      ],
      [packageReferenceLabel('vr'), 'VR · package reference', ["f + ' · package reference'"]],
      [
        packageHint('IML-VR-1.0'),
        'App package fields are provisional. The live reference is IML-VR-1.0.',
        [
          "'App package fields are provisional. The live reference is ' + this.liveVal(e, 'pk:' + f) + '.'",
        ],
      ],
      [versionNote('1.1'), 'Version 1.1', ['Version {{ E.f.ver }}']],
      [
        comparisonCaption('Current and proposed'),
        'Current and proposed, changed fields only',
        ['{{ E.cmpTitle }}, changed fields only'],
      ],
      [
        savedLine('27 Aug 2026, 16:05'),
        '27 Aug 2026, 16:05 · the live version is unchanged',
        ["when + ' · the live version is unchanged'"],
      ],
      [changesWords(2), '2 fields changed', ["this.plural(ch.length, 'field') + ' changed'"]],
      [changesWords(0), 'None yet', ["'None yet'"]],
      [
        lastSavedWords('24 Aug 2026', true),
        '24 Aug 2026 · you have unsaved changes',
        ["(u.dirty ? ' · you have unsaved changes' : '')"],
      ],
      [lastSavedWords(null, false), 'Not saved yet', ["'Not saved yet'"]],
      [
        pendingLine([PENDING_PARTS.why, PENDING_PARTS.version, PENDING_PARTS.change]),
        'Before you send it: say what changes and why, add a new version label, change at least one field.',
        ["'Before you send it: ' + parts.join(', ') + '.'"],
      ],
      [
        draftLine('1.0'),
        'Version 1.0 stays live. Send it for academic review when it’s ready.',
        ["'Version ' + e.ver + ' stays live. Send it for academic review when it’s ready.'"],
      ],
      [
        returnedLine('Prof. A. Menon', '26 Aug 2026', '1.0'),
        'Prof. A. Menon returned it on 26 Aug 2026. Change it and send it for academic review again. Version 1.0 stays live.',
        [
          "'Prof. A. Menon returned it on ' + this.day(u.ret.when) + '. ' : '') + 'Change it and send it for academic review again. Version ' + e.ver + ' stays live.'",
        ],
      ],
      [
        awaitingLine('Prof. A. Menon', '27 Aug 2026', '1.2'),
        'Approved by Prof. A. Menon on 27 Aug 2026. The Super Admin decides whether to release it or put it on hold. Version 1.2 stays live until it is released.',
        [
          "'Approved by Prof. A. Menon on ' + this.day(u.appr) + '. The Super Admin decides whether to release it or put it on hold. Version ' + e.ver + ' stays live until it is released.'",
        ],
      ],
      [
        liftedLine('27 Aug 2026'),
        'The hold was lifted on 27 Aug 2026. Nothing went live; it is waiting for the Super Admin’s decision again.',
        [
          "'The hold was lifted on ' + this.day(u.lifted) + '. Nothing went live; it is waiting for the Super Admin’s decision again.'",
        ],
      ],
      [
        holdLine('20 Aug 2026', '2.0'),
        'The Super Admin put this update on hold on 20 Aug 2026. Version 2.0 stays live.',
        [
          "'The Super Admin put this update on hold on ' + this.day(u.hold.when) + '. Version ' + e.ver + ' stays live.'",
        ],
      ],
      [
        holdReason('Hold until the vendor fixes it.', 'Arjun Mehta'),
        '“Hold until the vendor fixes it.” — Arjun Mehta, Super Admin',
        ["'“' + u.hold.reason + '” — ' + u.hold.by + ', Super Admin'"],
      ],
      [
        releasedLine('1.1', '5 Aug 2026', '1.0'),
        'Version 1.1 is live for everyone since 5 Aug 2026. The history keeps version 1.0 and every decision.',
        [
          "'Version ' + this.T(u.ver) + ' is live for everyone since ' + this.day(u.rel.when) + '. The history keeps version ' + u.from + ' and every decision.'",
        ],
      ],
      [
        withdrawnLine('27 Aug 2026'),
        'Withdrawn on 27 Aug 2026. The live version is unchanged. You can start a new correction from the published experiment.',
        [
          "'Withdrawn on ' + this.day(u.wd.when) + '. The live version is unchanged. You can start a new correction from the published experiment.'",
        ],
      ],
      [
        approvedMeanwhileLine('16:20'),
        'The Academic Reviewer approved it at 16:20, so it can’t be withdrawn or changed now. Release or hold is the Super Admin’s decision. Nothing was changed by your action.',
        [
          "'The Academic Reviewer approved it' + (extA ? ' at ' + extA.when.split(', ')[1] : '') + ', so it can’t be withdrawn or changed now. Release or hold is the Super Admin’s decision.'",
          '{{ E.staleText }} Nothing was changed by your action.',
        ],
      ],
      [
        sendTitle('UPD-0006'),
        'Send UPD-0006 for academic review?',
        ['Send {{ E.id }} for academic review?'],
      ],
      [
        sendStaysLive('1.0'),
        'Version 1.0 stays live — nothing changes for the public or for students.',
        ["'Version ' + e.ver + ' stays live — nothing changes for the public or for students.'"],
      ],
      [withdrawTitle('UPD-0006'), 'Withdraw UPD-0006?', ['Withdraw {{ E.id }}?']],
      [
        startedWhat('edit-catalogue-details'),
        'Correction started from Edit catalogue details',
        ["'Correction started from ' + from"],
      ],
      [
        startedWhat('start-a-correction'),
        'Correction started from the published experiment',
        ["'the published experiment'"],
      ],
      [
        startedNote('1.0'),
        'Pre-filled with the live version 1.0.',
        ["'Pre-filled with the live version ' + e.ver + '.'"],
      ],
      [
        returnedWhat('Prof. A. Menon'),
        'Returned by Prof. A. Menon',
        ["'Returned by Prof. A. Menon'"],
      ],
      [
        approvedWhat('Prof. A. Menon'),
        'Approved by Prof. A. Menon',
        ["'Approved by Prof. A. Menon'"],
      ],
      [
        approvedNote('1.0'),
        'With the Super Admin for a release decision. The live version stays 1.0 until then.',
        [
          "'With the Super Admin for a release decision. The live version stays ' + e.ver + ' until then.'",
        ],
      ],
      [heldWhat('Arjun Mehta'), 'Put on hold by Arjun Mehta', ["'Put on hold by Arjun Mehta'"]],
      [
        heldNote('Checking the build.', '2.0'),
        '“Checking the build.” Version 2.0 stays live.',
        ["'“' + reason + '” Version ' + e.ver + ' stays live.'"],
      ],
      [liftedWhat('Arjun Mehta'), 'Hold lifted by Arjun Mehta', ["'Hold lifted by Arjun Mehta'"]],
      [releasedWhat('Arjun Mehta'), 'Released by Arjun Mehta', ["'Released by Arjun Mehta'"]],
      [
        releasedNote('1.1'),
        'Version 1.1 is live for everyone.',
        ["'Version ' + e.ver + ' is live for everyone.'"],
      ],
      [
        withdrawnNote('Raised by mistake.'),
        '“Raised by mistake.” Nothing changed in the live version.',
        ["'“' + reason + '” Nothing changed in the live version.'"],
      ],
    ];
    for (const [product, drawn, pieces] of composed) {
      expect(product).toBe(drawn);
      for (const piece of pieces) expect(CM, piece).toContain(piece);
    }
  });

  it('the reviewer is not named where the record does not name them (state-copy `CM-08.reviewer-unnamed`)', () => {
    expect(inReviewLine('27 Aug 2026', '1.0')).toBe(
      'With the Academic Reviewer since 27 Aug 2026. Read-only while it is reviewed. The live version 1.0 is unchanged.',
    );
    expect(CM).toContain(
      "'With Prof. A. Menon since ' + this.day(u.sent) + '. Read-only while it is reviewed. The live version ' + e.ver + ' is unchanged.'",
    );
    expect(sentNote('1.0')).toBe('To the Academic Reviewer. The live version 1.0 is unchanged.');
    expect(CM).toContain("'To Prof. A. Menon. The live version ' + e.ver + ' is unchanged.'");
    expect(SEND_DIALOG.reviewerCanReview).toBe(
      'The Academic Reviewer can review it. It becomes read-only for you while it is reviewed.',
    );
    expect(CM).toContain(
      "'Prof. A. Menon can review it. It becomes read-only for you while it is reviewed.'",
    );
    // The returned line drops its first sentence when the record names no reviewer.
    expect(returnedLine(null, null, '1.0')).toBe(
      'Change it and send it for academic review again. Version 1.0 stays live.',
    );
  });

  it('the version hint’s example follows the live version (state-copy `CM-08.version-example`)', () => {
    expect(exampleVersionAfter('1.0')).toBe('1.1');
    expect(exampleVersionAfter('1.2')).toBe('1.3');
    expect(exampleVersionAfter('2.0')).toBe('2.1');
    expect(exampleVersionAfter('1.9')).toBe('1.10');
    expect(exampleVersionAfter('v2')).toBe('1.3');
    expect(versionHint('2.0')).toBe('For example 2.1. The live version is 2.0.');
    expect(packageHint(null)).toBe('App package fields are provisional.');
  });

  it('a correction never says “Publish”', () => {
    const all = [
      ...strings(CORRECTION_ENTRY),
      ...strings(BACK_FROM_CORRECTION),
      ...strings(UPDATES_HEAD),
      ...strings(TRACKER_GROUPS),
      ...strings(TRACKER),
      ...strings(UPDATE_BAND),
      ...strings(UPDATE_FACTS),
      ...strings(UPDATE_SHEET),
      ...strings(UPDATE_PANEL),
      ...strings(STATE_NOTICE),
      ...strings(STALE_NOTICE),
      ...strings(SEND_DIALOG),
      ...strings(WITHDRAW_DIALOG),
      ...strings(NO_UPDATE),
    ];
    for (const phrase of all) expect(phrase).not.toMatch(/publish(?!ed experiment)/i);
  });
});

describe('the CM-05 / CM-08 correction state-copy entries', () => {
  const entries = Object.entries(STATE_COPY_CM_CORRECTION);

  it.each(entries)('%s is in the one register, provisional, with its decisions', (id, entry) => {
    expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
    expect(entry.status).toBe('provisional');
    expect(entry.decisions.length).toBeGreaterThan(0);
    // Decision ids never appear in visible copy; words use the typographic apostrophe.
    if (entry.words !== null) {
      expect(entry.words).not.toMatch(/\b(?:VD|OD|PC|DEV|UPD|T|M|P\d)-?\d/);
      expect(entry.words).not.toContain("'");
    }
  });

  it('the undrawn words are not in the export', () => {
    for (const id of [
      'CM-05.entry-busy',
      'CM-05.entry-refused',
      'CM-05.entry-unavailable',
      'CM-08.loading',
      'CM-08.failed',
      'CM-08.stale',
      'CM-08.moved-on',
      'CM-08.unavailable.send',
      'CM-08.unavailable.withdraw',
    ] as const) {
      const words = STATE_COPY_CM_CORRECTION[id].words;
      expect(words).not.toBeNull();
      expect(CM).not.toContain(words);
    }
  });
});
