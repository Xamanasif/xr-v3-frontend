/**
 * The words of CM-03 Publication decision (B6-07, B6-11) and CM-05 Published experiment (B6-08)
 * are the frozen boards’: each drawn phrase is found verbatim in its board’s markup or script, the
 * composed ones with the boards’ own sample values or, where the board composes them in its
 * script, the script’s own pieces; the undrawn forms are provisional entries of the state-copy
 * register, each with its decision and no decision id in its words.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  approvedCheckLine,
  approvedNote,
  approvedWhat,
  blockerLine,
  blockersTitle,
  CHECK_FIXES,
  CHECK_LINES,
  CHECK_TITLES,
  DECISION_PAGE,
  DECISION_PANEL,
  decisionMetaLine,
  decisionOverline,
  deliveryCheckLine,
  firstPublishedWhat,
  formatsSentence,
  HISTORY,
  liveSinceLine,
  outcomesCheckLine,
  PUBLISH_DIALOG,
  PUBLISHED_PAGE,
  publishedLine,
  publishedNote,
  publishedOverline,
  publishedWhat,
  publishedWhen,
  publishEffect,
  publishTitle,
  quoted,
  READ_ONLY,
  referenceWords,
  resubmittedWhat,
  returnedByReviewerWhat,
  reviewLine,
  SEND_BACK_DIALOG,
  sentBackMeta,
  sentBackToReviewerWhat,
  sentBackToVendorWhat,
  submissionsLine,
  submittedNote,
  toResolveChip,
  updateInProgressLine,
  updateInProgressTitle,
  updateStartedNote,
  updateStartedWhat,
  vendorChoiceSub,
  versionReleasedNote,
  versionReleasedWhat,
  WITH_THE_VENDOR,
} from './cm-decision';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_CM_DECISION } from './state-copy-cm-decision';

/** A board’s text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B6_07 = words('B6-07-Publication-Decision.dc.html');
const B6_08 = words('B6-08-Published-and-Correction-Entry.dc.html');

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

describe('CM-03 Publication decision (B6-07; B6-11 f4 … f8)', () => {
  it.each(
    strings([
      DECISION_PAGE,
      DECISION_PANEL,
      READ_ONLY,
      PUBLISH_DIALOG,
      SEND_BACK_DIALOG,
      CHECK_TITLES,
      CHECK_LINES,
      CHECK_FIXES,
      HISTORY,
      WITH_THE_VENDOR,
    ]),
  )('“%s” is on B6-07', (phrase) => {
    expect(B6_07).toContain(asDrawn(phrase));
  });

  it('the composed words are B6-07’s: its frames’ words, from its script’s own pieces', () => {
    // [the product’s words for the frame’s sample, the frame’s words, the script piece].
    const composed: readonly (readonly [string, string, string])[] = [
      [
        decisionOverline('SUB-0077'),
        'SUB-0077 · First publication',
        "s.id + ' · First publication'",
      ],
      [
        decisionMetaLine('Northline Simulation Studio', 'ME ZG523', {
          by: 'Prof. A. Menon',
          on: '27 Aug 2026',
        }),
        'Northline Simulation Studio · ME ZG523 · approved by Prof. A. Menon on 27 Aug 2026',
        "s.ven + ' · ' + s.course + (s.approved ? ' · approved by ' + D.rv + ' on ' + s.approved : '')",
      ],
      [
        decisionMetaLine('Northline Simulation Studio', 'ME ZG523', null),
        'Northline Simulation Studio · ME ZG523',
        "s.ven + ' · ' + s.course",
      ],
      [
        toResolveChip('Ready to publish', 1),
        'Ready to publish · 1 to resolve',
        "'Ready to publish · ' + nBlock + ' to resolve'",
      ],
      [
        approvedCheckLine('Prof. A. Menon', '27 Aug 2026'),
        'Prof. A. Menon · 27 Aug 2026',
        "D.rv + ' · ' + s.approved",
      ],
      [
        outcomesCheckLine(3),
        '3 outcomes · one set for every format',
        "plural(s.outcomes.length, 'outcome') + ' · one set for every format'",
      ],
      [
        deliveryCheckLine(['WEB', 'VR'], true),
        'WEB · VR — complete',
        "chosen.join(' · ') + (delivOk ? ' — complete' : ' — incomplete')",
      ],
      [
        reviewLine('Prof. A. Menon', '27 Aug 2026', 1),
        'Approved by Prof. A. Menon on 27 Aug 2026 — after 1 return with a reason',
        "'Approved by ' + D.rv + ' on ' + s.approved + (s.retCount ? ' — after ' + s.retCount + ' return with a reason' : '')",
      ],
      [
        submissionsLine('12 Aug 2026', '26 Aug 2026', 2),
        'Submitted 12 Aug 2026 · resubmitted 26 Aug 2026 (revision 2)',
        "'Submitted ' + s.submitted + ' · resubmitted ' + s.resubmitted + ' (revision ' + s.rev + ')' : 'Submitted ' + s.submitted",
      ],
      [
        submissionsLine('12 Aug 2026', null, 1),
        'Submitted 12 Aug 2026',
        "'Submitted ' + s.submitted",
      ],
      [
        blockersTitle(1),
        '1 thing to resolve before it can be published',
        "plural(nBlock, 'thing') + ' to resolve before it can be published'",
      ],
      [
        blockerLine(
          CHECK_TITLES['learning-outcomes'],
          CHECK_LINES.noOutcomes,
          CHECK_FIXES['learning-outcomes'],
        ),
        'Learning outcomes: none. Send it back to the Academic Reviewer to add them.',
        "c.t + ': ' + c.d.toLowerCase() + '. ' + c.fix",
      ],
      [
        publishedWhen('28 Aug 2026', '10:05', 'Kavya Nair'),
        '28 Aug 2026 · 10:05 · Kavya Nair',
        "s.pub + (cd && cd.when ? ' · ' + cd.when.split(', ')[1] : '') + ' · ' + D.cm",
      ],
      [
        publishedLine('ME ZG523', ['WEB', 'VR']),
        'In the public catalogue under ME ZG523 with WEB and VR. Publishing gave no one access.',
        "'In the public catalogue under ' + s.course + ' with ' + chosen.join(' and ') + '. Publishing gave no one access.'",
      ],
      [
        publishTitle('Conduction Through a Composite Wall'),
        'Publish “Conduction Through a Composite Wall”?',
        "'Publish “' + o.name + '”?'",
      ],
      [
        publishEffect('ME ZG523', ['WEB', 'VR']),
        'It will appear in the public catalogue under ME ZG523 with WEB and VR. Publishing gives no one access — institutions still need access before their students can open it.',
        "'It will appear in the public catalogue under ' + s.course + ' with ' + chosen.join(' and ') + '. Publishing gives no one access — institutions still need access before their students can open it.'",
      ],
      [
        vendorChoiceSub('Northline Simulation Studio'),
        'Northline Simulation Studio — to revise and resubmit',
        "s.ven + ' — to revise and resubmit'",
      ],
      [
        sentBackMeta('17 Nov 2026, 10:00', 'Kavya Nair', 'Please re-check.'),
        '17 Nov 2026, 10:00 · Kavya Nair · “Please re-check.”',
        "cd.when + ' · ' + D.cm + ' · “' + (cd.reason || '') + '”'",
      ],
      [
        sentBackToReviewerWhat('Kavya Nair'),
        'Sent back to the Academic Reviewer by Kavya Nair',
        "'Sent back to the Academic Reviewer by ' + D.cm",
      ],
      [
        sentBackToVendorWhat('Kavya Nair'),
        'Sent back to the vendor by Kavya Nair',
        "'Sent back to the vendor by ' + D.cm",
      ],
    ];
    for (const [product, frame, piece] of composed) {
      expect(product).toBe(frame);
      expect(B6_07).toContain(piece);
    }
    expect(deliveryCheckLine(['WEB', 'AR'], false)).toBe('WEB · AR — incomplete');
    // The history’s seeded entries and the reference options are on the board as written.
    for (const phrase of [
      submittedNote(1, 'Northline Simulation Studio'),
      returnedByReviewerWhat('Prof. A. Menon'),
      approvedWhat('Prof. A. Menon'),
      approvedNote(3),
      resubmittedWhat(2),
      publishedWhat('Kavya Nair'),
      publishedNote('ME ZG523', ['WEB', 'VR']),
      quoted('Please clarify the VR device requirements.'),
      referenceWords({ step: 'course-and-description', format: null, field: 'summary' }, null),
      referenceWords({ step: 'course-and-description', format: null, field: 'description' }, null),
      referenceWords({ step: 'formats-and-delivery', format: 'web', field: 'web-link' }, 'WEB'),
      referenceWords(
        { step: 'formats-and-delivery', format: 'web', field: 'browser-and-computer' },
        'WEB',
      ),
      referenceWords({ step: 'formats-and-delivery', format: 'mr', field: 'package' }, 'MR'),
      referenceWords({ step: 'formats-and-delivery', format: 'vr', field: 'device-need' }, 'VR'),
      referenceWords({ step: 'formats-and-delivery', format: 'ar', field: 'install-notes' }, 'AR'),
      referenceWords({ step: 'preview-and-documents', format: null, field: 'preview-link' }, null),
    ]) {
      expect(B6_07).toContain(asDrawn(phrase));
    }
  });

  it('the undrawn forms are the register’s', () => {
    expect(formatsSentence(['WEB'])).toBe('WEB');
    expect(formatsSentence(['WEB', 'VR'])).toBe('WEB and VR');
    expect(formatsSentence(['WEB', 'AR', 'VR'])).toBe('WEB, AR and VR');
    expect(reviewLine('Prof. A. Menon', '27 Aug 2026', 2)).toBe(
      'Approved by Prof. A. Menon on 27 Aug 2026 — after 2 returns with a reason',
    );
    expect(B6_07).not.toContain('returns with a reason');
  });
});

describe('CM-05 Published experiment (B6-08; B6-11 f9)', () => {
  it.each(strings(PUBLISHED_PAGE))('“%s” is on B6-08', (phrase) => {
    expect(B6_08).toContain(asDrawn(phrase));
  });

  it('the composed words are B6-08’s: its frames’ words, from its script’s own pieces', () => {
    for (const phrase of [
      versionReleasedWhat('1.2'),
      versionReleasedNote('UPD-0002', true),
      versionReleasedNote('UPD-0001', false),
      firstPublishedWhat('1.0'),
      updateInProgressLine('draft', '1.2'),
      updateInProgressLine('in-academic-review', '1.2'),
      updateInProgressLine('awaiting-release-decision', '1.2'),
    ]) {
      expect(B6_08).toContain(asDrawn(phrase));
    }
    const composed: readonly (readonly [string, string, string])[] = [
      [
        publishedOverline('CHE ZG513', '1.2'),
        'CHE ZG513 · Published · version 1.2',
        "D.dist.course + ' · Published · version ' + L.ver",
      ],
      [
        liveSinceLine('3 Jul 2026', 'Meridian Virtual Labs'),
        'Live since 3 Jul 2026 · Meridian Virtual Labs',
        'Live since {{ m.lSince }} · Meridian Virtual Labs',
      ],
      [
        updateInProgressTitle('UPD-0005', 'In academic review'),
        'An update is in progress — UPD-0005 · In academic review',
        "'An update is in progress — ' + (u ? u.id + ' · ' + D.stw[ust] : '')",
      ],
      [
        updateStartedWhat('UPD-0005', 'In academic review'),
        'UPD-0005 started — in academic review',
        "u.id + ' started — ' + D.stw[ust].toLowerCase()",
      ],
      [
        updateStartedNote('1.3'),
        'Version 1.3. The live version below is unchanged.',
        "'Version ' + (T(u.ver) || 'not set') + '. The live version below is unchanged.'",
      ],
      [
        updateInProgressLine('on-hold', '2.0'),
        'The Super Admin put it on hold. Version 2.0 stays live.',
        "'The Super Admin put it on hold. Version ' + L.ver + ' stays live.'",
      ],
    ];
    for (const [product, frame, piece] of composed) {
      expect(product).toBe(frame);
      expect(B6_08).toContain(piece);
    }
    expect(updateInProgressLine('returned', '1.0')).toBe(updateInProgressLine('draft', '1.0'));
    expect(updateStartedNote(null)).toBe('Version not set. The live version below is unchanged.');
    expect(liveSinceLine('18 Jun 2026', '')).toBe('Live since 18 Jun 2026');
  });
});

describe('the CM-03 / CM-05 state-copy entries', () => {
  const entries = Object.entries(STATE_COPY_CM_DECISION);

  it.each(entries)('%s is in the one register, provisional, with its decisions', (id, entry) => {
    expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
    expect(entry.status).toBe('provisional');
    expect(entry.decisions.length).toBeGreaterThan(0);
    // Decision ids never appear in visible copy; words use the typographic apostrophe.
    if (entry.words !== null) {
      expect(entry.words).not.toMatch(/\b(?:VD|OD|PC|DEV|T|M|P\d)-?\d/);
      expect(entry.words).not.toContain("'");
    }
  });

  it('the undrawn words are not on the boards', () => {
    for (const id of [
      'CM-03.loading',
      'CM-03.failed',
      'CM-03.published.view',
      'CM-03.stale.title',
      'CM-03.moved-on',
      'CM-05.loading',
      'CM-05.failed',
    ] as const) {
      const text = STATE_COPY_CM_DECISION[id].words;
      expect(B6_07).not.toContain(text);
      expect(B6_08).not.toContain(text);
    }
  });
});
