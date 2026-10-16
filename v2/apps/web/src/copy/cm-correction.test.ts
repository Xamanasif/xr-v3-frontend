/**
 * The words of CM-05's correction entry (B6-08) and the CM-08 update page (B6-09, B6-11, B6-13,
 * B7-11) are the frozen boards': each drawn phrase is found verbatim in its board's markup or
 * script, the composed ones equal the frames' words with the boards' own sample values and use the
 * script's own pieces; the undrawn forms are provisional entries of the state-copy register, each
 * with its decision and no decision id in its words. A correction never says "Publish".
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  approvedNote,
  approvedWhat,
  awaitingLine,
  BACK_FROM_CORRECTION,
  CORRECTION_ENTRY,
  draftSavedLine,
  entryLabel,
  exampleVersionAfter,
  heldNote,
  heldWhat,
  inReviewLine,
  LIFTED_NOTE,
  liftedWhat,
  liveUnchanged,
  NO_UPDATE,
  packageReferenceLabel,
  quotedReason,
  releasedNote,
  releasedWhat,
  returnedMeta,
  returnedWhat,
  SEND_DIALOG,
  sendEffect,
  SENT_WHAT,
  sentNote,
  startedNote,
  startedWhat,
  UPDATE_NOTICES,
  UPDATE_PAGE,
  updateOverline,
  updateTitle,
  versionHint,
  versionMeta,
  WITHDRAW_DIALOG,
  WITHDRAWN_WHAT,
  withdrawnLine,
  withdrawnNote,
} from './cm-correction';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_CM_CORRECTION } from './state-copy-cm-correction';

/** A board's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B6_08 = words('B6-08-Published-and-Correction-Entry.dc.html');
const B6_09 = words('B6-09-Updates-Corrections.dc.html');
const B6_13 = words('B6-13-Flow-6-Steps-1-2.dc.html');
const B7_11 = words('B7-11-Flow-6-Release-and-Hold.dc.html');
const ALL = `${B6_08}\n${B6_09}\n${B6_13}\n${B7_11}`;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

/**
 * Words shown without the decision id the board writes into them (P1-14 / VD-10: “Strip the
 * suffix through a copy table and keep the sentence”): checked against the board's own wording.
 */
const DRAWN_WITH_ID: Readonly<Record<string, string>> = {
  'App package (provisional)': 'App package (provisional — T-14)',
  'App package fields are provisional.': 'App package fields are provisional (T-14).',
};
const asDrawn = (phrase: string) => DRAWN_WITH_ID[phrase] ?? phrase;

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

describe('CM-08 the update (B6-09; B6-11 f10, f11; B6-13 f0; B7-11 f3)', () => {
  it.each([
    ...strings(UPDATE_PAGE),
    ...strings(UPDATE_NOTICES),
    ...strings(SEND_DIALOG),
    WITHDRAW_DIALOG.title,
    WITHDRAW_DIALOG.reason,
    WITHDRAW_DIALOG.confirm,
    WITHDRAW_DIALOG.busy,
    SENT_WHAT,
    WITHDRAWN_WHAT,
  ])('“%s” is on B6-09', (phrase) => {
    expect(B6_09).toContain(asDrawn(phrase));
  });

  it.each(strings(NO_UPDATE))('“%s” is on B6-13 (f0)', (phrase) => {
    expect(B6_13).toContain(phrase);
  });

  it('the withdraw effect is the drawn first sentence only (state-copy `CM-08.withdraw-effect`)', () => {
    expect(B6_09).toContain(
      `${WITHDRAW_DIALOG.effect} The Academic Reviewer sees your reason if it was with them.`,
    );
  });

  it('the composed words are the frames’, from the scripts’ own pieces', () => {
    const composed: readonly (readonly [string, string, readonly string[]])[] = [
      [
        updateOverline('UPD-0005', 'Distillation Column', '1.2'),
        'UPD-0005 · correction to Distillation Column (live version 1.2)',
        ["u.id + ' · correction to ' + L.name + ' (live version ' + L.ver + ')'"],
      ],
      [updateTitle(null), 'Update to version …', ["'Update to version ' + (T(u.ver) || '…')"]],
      [updateTitle(' 1.3 '), 'Update to version 1.3', ["'Update to version ' + (T(u.ver) || '…')"]],
      [liveUnchanged('1.2'), 'Live version 1.2 unchanged', ['Live version {{ d.lVer }} unchanged']],
      [
        draftSavedLine('25 Aug 2026, 15:40'),
        'Draft saved · 25 Aug 2026, 15:40 · the live version is unchanged',
        ["'Draft saved · ' + now() + ' · the live version is unchanged'"],
      ],
      [
        returnedMeta('27 Aug 2026, 11:20', 'Prof. A. Menon'),
        '27 Aug 2026, 11:20 · Prof. A. Menon',
        ["u.ret.when + ' · ' + u.ret.who"],
      ],
      [
        awaitingLine('Prof. A. Menon', '27 Aug 2026', '1.2'),
        'Approved by Prof. A. Menon on 27 Aug 2026. The Super Admin decides whether to release it or put it on hold. Version 1.2 stays live until it is released.',
        [
          "'Approved by ' + D.rv + ' on ' + day(u.appr) + '. The Super Admin decides whether to release it or put it on hold. Version ' + L.ver + ' stays live until it is released.'",
        ],
      ],
      [
        withdrawnLine(
          '26 Aug 2026',
          'Raised by mistake — the Vendor is sending a corrected build first.',
        ),
        'Withdrawn on 26 Aug 2026: “Raised by mistake — the Vendor is sending a corrected build first.” The live version is unchanged. You can start a new correction from the published experiment.',
        [
          "'Withdrawn on ' + day(u.wd.when) + ': “' + u.wd.reason + '” The live version is unchanged. You can start a new correction from the published experiment.'",
        ],
      ],
      [versionMeta('1.3'), 'Version 1.3', ['Version {{ d.uVer }}']],
      [
        versionHint('1.2'),
        'For example 1.3. The live version is 1.2.',
        ['For example 1.3. The live version is 1.2.'],
      ],
      [packageReferenceLabel('vr'), 'VR · package reference', ["'VR · package reference'"]],
      [
        startedWhat('edit-catalogue-details'),
        'Correction started from Edit catalogue details',
        ["'Correction started from ' + (sec === 'cat' ? 'Edit catalogue details'"],
      ],
      [
        startedWhat('start-a-correction'),
        'Correction started from the published experiment',
        ['Correction started from the published experiment'],
      ],
      [
        startedNote('1.2'),
        'Pre-filled with the live version 1.2.',
        ["'Pre-filled with the live version ' + c.live.ver + '.'"],
      ],
      [
        returnedWhat('Prof. A. Menon'),
        'Returned by Prof. A. Menon',
        ["what: 'Returned by ' + D.rv"],
      ],
      [quotedReason('Please clarify.'), '“Please clarify.”', ["'“' + T(c.rreason) + '”'"]],
      [
        approvedWhat('Prof. A. Menon'),
        'Approved by Prof. A. Menon',
        ["what: 'Approved by ' + D.rv"],
      ],
      [
        approvedNote('1.2'),
        'With the Super Admin for a release decision. The live version stays 1.2 until then.',
        [
          "'With the Super Admin for a release decision. The live version stays ' + c.live.ver + ' until then.'",
        ],
      ],
      [
        sendEffect('1.2'),
        'It goes to the Academic Reviewer, then to the Super Admin, who decides when to release it. The live version 1.2 doesn’t change until it is released.',
        [
          "'It goes to the Academic Reviewer, then to the Super Admin, who decides when to release it. The live version ' + L.ver + ' doesn’t change until it is released.'",
        ],
      ],
      [
        withdrawnNote('Raised by mistake.'),
        '“Raised by mistake.” Nothing changed in the live version.',
        ["'“' + T(c.wreason) + '” Nothing changed in the live version.'"],
      ],
    ];
    for (const [product, frame, pieces] of composed) {
      expect(product).toBe(frame);
      for (const piece of pieces) expect(B6_09, piece).toContain(piece);
    }
    // B7-11's Super Admin entries in the Content Manager's history.
    const b711: readonly (readonly [string, string, string])[] = [
      [heldWhat('Arjun Mehta'), 'Put on hold by Arjun Mehta', "'Put on hold by ' + E.sa"],
      [
        heldNote('Checking the build.', '1.2'),
        '“Checking the build.” Version 1.2 stays live.',
        "'“' + T(c.sreason) + '” Version ' + c.live.ver + ' stays live.'",
      ],
      [liftedWhat('Arjun Mehta'), 'Hold lifted by Arjun Mehta', "'Hold lifted by ' + E.sa"],
      [LIFTED_NOTE, LIFTED_NOTE, "'Waiting for a decision again. Nothing went live.'"],
      [releasedWhat('Arjun Mehta'), 'Released by Arjun Mehta', "'Released by ' + E.sa"],
      [
        releasedNote('1.3'),
        'Version 1.3 is live for everyone.',
        "'Version ' + T(cu.ver) + ' is live for everyone.'",
      ],
    ];
    for (const [product, frame, piece] of b711) {
      expect(product).toBe(frame);
      expect(B7_11, piece).toContain(piece);
    }
  });

  it('the reviewer is not named where the record does not name them (state-copy `CM-08.reviewer-unnamed`)', () => {
    expect(inReviewLine('25 Aug 2026', '1.2')).toBe(
      'With the Academic Reviewer since 25 Aug 2026. Read-only while it is reviewed. The live version 1.2 is unchanged.',
    );
    expect(B6_09).toContain(
      "'With ' + D.rv + ' since ' + day(u.sent) + '. Read-only while it is reviewed. The live version ' + L.ver + ' is unchanged.'",
    );
    expect(sentNote('1.2')).toBe('To the Academic Reviewer. The live version 1.2 is unchanged.');
    expect(B6_09).toContain("'To ' + D.rv + '. The live version ' + c.live.ver + ' is unchanged.'");
  });

  it('the version hint’s example follows the live version (state-copy `CM-08.version-example`)', () => {
    expect(exampleVersionAfter('1.2')).toBe('1.3');
    expect(exampleVersionAfter('2.0')).toBe('2.1');
    expect(exampleVersionAfter('1.9')).toBe('1.10');
    expect(exampleVersionAfter('v2')).toBe('1.3');
    expect(versionHint('2.0')).toBe('For example 2.1. The live version is 2.0.');
  });

  it('a correction never says “Publish”', () => {
    const all = [
      ...strings(CORRECTION_ENTRY),
      ...strings(BACK_FROM_CORRECTION),
      ...strings(UPDATE_PAGE),
      ...strings(UPDATE_NOTICES),
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

  it('the undrawn words are not on the boards', () => {
    for (const id of [
      'CM-05.entry-busy',
      'CM-05.entry-refused',
      'CM-05.entry-unavailable',
      'CM-08.loading',
      'CM-08.failed',
      'CM-08.stale',
      'CM-08.moved-on',
      'CM-08.unavailable.save',
      'CM-08.unavailable.send',
      'CM-08.unavailable.withdraw',
    ] as const) {
      expect(ALL).not.toContain(STATE_COPY_CM_CORRECTION[id].words);
    }
  });
});
