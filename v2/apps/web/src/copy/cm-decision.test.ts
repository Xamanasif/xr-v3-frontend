/**
 * The words of CM-03 Publication decision and CM-05 Published experiment are the owner-approved
 * Content Manager export's (design/v3-refined-b/roles/CM-v1, `project/Main.dc.html`): each drawn
 * phrase is found verbatim in its markup or script, the composed ones with the script's own pieces
 * (`decVM`, `checksOf`, `pubVM`, the sample `sh` and `hist` entries); the undrawn forms are
 * provisional entries of the state-copy register, each with its decision and no decision id in its
 * words. No words carry an internal reference (owner visual-review correction, 20 Oct 2026, the SA-v1
 * rule): where the export composes one in (`x.id`, `u.id`, `rel.id`, the sample `hist`), the product
 * takes the export's words without it.
 */
import { describe, expect, it } from 'vitest';

import { cmExport } from '@/test-support/boards';

import { CONTENT_LIBRARY } from './cm-lists';
import {
  approvedCheckLine,
  approvedNote,
  approvedWhat,
  blockerLine,
  blockersTitle,
  CHECK_FIXES,
  CHECK_LINES,
  CHECK_STATE,
  CHECK_TITLES,
  CORRECTIONS_PANEL,
  correctionsReleased,
  courseLabel,
  DECISION_PAGE,
  DECISION_PANEL,
  DECISION_RESULT,
  deliveryCheckLine,
  firstPublishedWhat,
  formatsLabel,
  formatsList,
  formatsSentence,
  fromVendor,
  gateVerdict,
  HISTORY,
  listedUnder,
  liveVersionLine,
  openUpdateStatus,
  outcomesCheckLine,
  packageDetail,
  PUBLISH_DIALOG,
  PUBLISHED_PAGE,
  publishedByYou,
  publishedNote,
  publishedOverline,
  publishedWhat,
  publishTitle,
  publishWhere,
  quoted,
  READ_ONLY,
  recheckLine,
  recheckReviewLine,
  referenceWords,
  releasedLine,
  requiredLabel,
  releasedTitle,
  resubmittedWhat,
  returnedByReviewerLine,
  returnedByReviewerWhat,
  returnedReviewLine,
  revisionFact,
  reviewLine,
  sentBackByYou,
  sentBackToReviewerWhat,
  sentBackToVendorNote,
  sentBackToVendorWhat,
  sentToVendorLine,
  STALE_NOTICE,
  staleLine,
  submissionsLine,
  submittedNote,
  updateHeldNote,
  updateHeldWhat,
  updateProgressLine,
  updateStartedNote,
  updateStartedWhat,
  vendorChoiceSub,
  versionAfterFormats,
  versionReleasedNote,
  versionReleasedWhat,
  withReviewer,
} from './cm-decision';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_CM_DECISION } from './state-copy-cm-decision';

/** The export's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
const MAIN = (() => {
  const raw = cmExport('Main.dc.html');
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
})();

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

/** An internal reference (REQ-, ACC-, UPD-, DTR-, SUP-, SUB-): never in the words. */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/** [the product's words for a sample, the export's words for it, the script piece that forms them]. */
type Composed = readonly (readonly [string, string, string])[];

function expectComposed(composed: Composed): void {
  for (const [product, drawn, piece] of composed) {
    expect(product).toBe(drawn);
    expect(MAIN).toContain(piece);
  }
}

describe('CM-03 Publication decision (CM-v1 `v.decision`, `decVM`)', () => {
  it.each(
    strings([
      DECISION_PAGE,
      DECISION_PANEL,
      READ_ONLY,
      PUBLISH_DIALOG,
      DECISION_RESULT,
      STALE_NOTICE,
      CHECK_TITLES,
      CHECK_LINES,
      CHECK_FIXES,
      CHECK_STATE,
      HISTORY,
    ]),
  )('“%s” is drawn by the export', (phrase) => {
    expect(MAIN).toContain(phrase);
  });

  it('the band: the record kind, the vendor, the facts, the gate’s verdict', () => {
    expectComposed([
      [
        DECISION_PAGE.overline,
        'First publication',
        // The export's record kind, after its submission reference (left out).
        "over: x.id + ' · First publication'",
      ],
      [
        fromVendor('Northline Simulation Studio'),
        'From Northline Simulation Studio',
        '<span>From {{ D.vendor }}</span>',
      ],
      [formatsList(['WEB', 'VR']), 'WEB · VR', "v: x.fmts.join(' · ')"],
      [revisionFact(2), 'Revision 2', "{ k: 'Submission', v: 'Revision ' + x.rev, cls: '' }"],
      [formatsLabel(['WEB', 'VR']), 'Formats: WEB, VR', "fmtAria: 'Formats: ' + x.fmts.join(', ')"],
      [
        gateVerdict('open', 4, 0),
        'All 4 met · ready to publish',
        "(nb ? this.plural(nb, 'check') + ' not met · publishing is blocked' : 'All 4 met · ready to publish')",
      ],
      [
        gateVerdict('open', 4, 1),
        '1 check not met · publishing is blocked',
        "this.plural(nb, 'check') + ' not met · publishing is blocked'",
      ],
      [
        gateVerdict('published', 4, 0),
        'All 4 were met when it was published',
        "const gateLine = pub ? 'All 4 were met when it was published'",
      ],
    ]);
    expect(gateVerdict('open', 4, 2)).toBe('2 checks not met · publishing is blocked');
  });

  it('the check rows, the blockers and the summary lines', () => {
    expectComposed([
      [
        approvedCheckLine('Prof. A. Menon', '27 Aug 2026'),
        'Prof. A. Menon · 27 Aug 2026',
        "d: appr ? 'Prof. A. Menon · ' + x.appr",
      ],
      [
        outcomesCheckLine(3),
        '3 outcomes · one set for every format',
        "this.plural(x.outcomes.length, 'outcome') + ' · one set for every format'",
      ],
      [
        deliveryCheckLine(['WEB', 'VR'], true),
        'WEB · VR — complete',
        "fm.join(' · ') + (delivOk ? ' — complete' : ' — incomplete')",
      ],
      [
        blockersTitle(1),
        '1 thing to resolve before it can be published',
        "this.plural(nb, 'thing') + ' to resolve before it can be published'",
      ],
      [
        blockerLine(
          CHECK_TITLES['learning-outcomes'],
          CHECK_LINES.noOutcomes,
          CHECK_FIXES['learning-outcomes'],
        ),
        'Learning outcomes: none. Send it back to the Academic Reviewer to add them.',
        "k.t + ': ' + k.d.toLowerCase() + '. ' + k.fix",
      ],
      [
        submissionsLine('12 Aug 2026', '26 Aug 2026', 2),
        'Submitted 12 Aug 2026 · resubmitted 26 Aug 2026 (revision 2)',
        "'Submitted ' + x.submitted + ' · resubmitted ' + x.resubmitted + ' (revision ' + x.rev + ')' : 'Submitted ' + x.submitted",
      ],
      [
        submissionsLine('12 Aug 2026', null, 1),
        'Submitted 12 Aug 2026',
        "'Submitted ' + x.submitted",
      ],
      [
        reviewLine('Prof. A. Menon', '27 Aug 2026', 1),
        'Approved by Prof. A. Menon on 27 Aug 2026 — after 1 return with a reason',
        "'Approved by Prof. A. Menon on ' + x.appr + (x.retCount ? ' — after ' + this.plural(x.retCount, 'return') + ' with a reason' : '')",
      ],
      [
        recheckReviewLine('Prof. A. Menon', '27 Aug 2026', '27 Aug 2026'),
        'Approved by Prof. A. Menon on 27 Aug 2026; you sent it back for a re-check on 27 Aug 2026',
        "'Approved by Prof. A. Menon on ' + x.apprOld + '; you sent it back for a re-check on ' + this.day(x.recheck.when)",
      ],
      [
        returnedReviewLine('Prof. A. Menon', '24 Aug 2026'),
        'Returned to the vendor by Prof. A. Menon on 24 Aug 2026',
        "'Returned to the vendor by Prof. A. Menon on ' + this.day(x.ret.when)",
      ],
      [
        packageDetail('Composite Wall — VR build 1.0', 'NSS-CW-VR-1.0'),
        'Composite Wall — VR build 1.0 · NSS-CW-VR-1.0',
        "x.pk[f].label + ' · ' + (x.pk[f].ref || x.pk[f].file)",
      ],
    ]);
    expect(deliveryCheckLine(['WEB', 'AR'], false)).toBe('WEB · AR — incomplete');
  });

  it('the decision panel: the reason, the vendor choice, the references, the read-only notices', () => {
    expectComposed([
      [
        requiredLabel(DECISION_PANEL.reasonForVendor),
        'Reason the vendor will see (required)',
        "+ ' (required)',",
      ],
      [
        vendorChoiceSub('Northline Simulation Studio'),
        'Northline Simulation Studio — to revise and resubmit',
        "d: ven.name + ' — to revise and resubmit'",
      ],
      [
        recheckLine('25 Aug 2026', 'Please re-check.'),
        'You sent it back on 25 Aug 2026: “Please re-check.” It comes back here if the Academic Reviewer approves it again.',
        "'You sent it back on ' + this.day(x.recheck.when) + ': “' + x.recheck.reason + '” It comes back here if the Academic Reviewer approves it again.'",
      ],
      [
        returnedByReviewerLine('24 Aug 2026'),
        'The Academic Reviewer returned it with a reason on 24 Aug 2026. It comes back to the Academic Reviewer when the vendor resubmits.',
        "'The Academic Reviewer returned it with a reason' + (x.ret ? ' on ' + this.day(x.ret.when) : '') + '. It comes back to the Academic Reviewer when the vendor resubmits.'",
      ],
      [
        sentToVendorLine('27 Aug 2026'),
        'You sent it back on 27 Aug 2026. It comes back to the Academic Reviewer when the vendor resubmits.',
        "'You sent it back' + (x.ret ? ' on ' + this.day(x.ret.when) : '') + '. It comes back to the Academic Reviewer when the vendor resubmits.'",
      ],
    ]);
    for (const reference of [
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
      expect(MAIN).toContain(`t: '${reference}'`);
    }
    expect(returnedByReviewerLine(null)).toBe(
      'The Academic Reviewer returned it with a reason. It comes back to the Academic Reviewer when the vendor resubmits.',
    );
  });

  it('the Publish dialog, the result and the stale notice', () => {
    expectComposed([
      [
        publishTitle('Conduction Through a Composite Wall'),
        'Publish “Conduction Through a Composite Wall”?',
        "pTitle: 'Publish “' + x.name + '”?'",
      ],
      [
        publishWhere(courseLabel('ME ZG523', 'Thermodynamics & Heat Transfer'), ['WEB', 'VR']),
        'It appears in the public catalogue under ME ZG523 · Thermodynamics & Heat Transfer with WEB and VR.',
        "'It appears in the public catalogue under ' + this.cLabel(c) + ' with ' + this.fand(x.fmts) + '.'",
      ],
      [
        publishedByYou('27 Aug 2026, 16:05'),
        'Published by you on 27 Aug 2026, 16:05',
        "'Published by you on ' + done.when",
      ],
      [
        sentBackByYou('27 Aug 2026, 16:05'),
        'Sent back by you on 27 Aug 2026, 16:05',
        "'Sent back by you on ' + done.when",
      ],
      [
        listedUnder('ME ZG523', ['WEB', 'VR']),
        'Listed under ME ZG523 with WEB and VR',
        "v: 'Listed under ' + this.cShort(c) + ' with ' + this.fand(x.fmts)",
      ],
      [
        withReviewer('Prof. A. Menon'),
        'Prof. A. Menon, Academic Reviewer',
        "{ k: 'Now with', v: 'Prof. A. Menon, Academic Reviewer' }",
      ],
      [
        quoted('Please re-check.'),
        '“Please re-check.”',
        "doneQuote: done && done.reason ? '“' + done.reason + '”' : ''",
      ],
      [
        staleLine('Conduction Through a Composite Wall', '16:05'),
        'Conduction Through a Composite Wall was published from another tab or window at 16:05. Nothing was changed by your decision.',
        "x.name + ' was published from another tab or window' + (this.extOf(s, id) ? ' at ' + this.extOf(s, id).when.split(', ')[1] : '') + '.'",
      ],
    ]);
    expect(MAIN).toContain('{{ D.staleText }} Nothing was changed by your decision.');
    expect(formatsSentence(['WEB'])).toBe('WEB');
    expect(formatsSentence(['WEB', 'AR', 'VR'])).toBe('WEB, AR and VR');
    expect(MAIN).toContain(
      "fand(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : (a[0] || ''); }",
    );
    expect(courseLabel(null, 'Process Instrumentation & Control')).toBe(
      'Process Instrumentation & Control',
    );
  });

  it('the history’s entries', () => {
    for (const phrase of [
      submittedNote(1, 'Northline Simulation Studio'),
      returnedByReviewerWhat('Prof. A. Menon'),
      approvedWhat('Prof. A. Menon'),
      approvedNote(3),
      resubmittedWhat(2),
      quoted('Please clarify the VR device requirements.'),
    ]) {
      expect(MAIN).toContain(phrase);
    }
    expectComposed([
      [publishedWhat('Kavya Nair'), 'Published by Kavya Nair', "what: 'Published by Kavya Nair'"],
      [
        publishedNote(courseLabel('ME ZG523', 'Thermodynamics & Heat Transfer'), ['WEB', 'VR']),
        'In the public catalogue under ME ZG523 · Thermodynamics & Heat Transfer with WEB and VR. No one was given access.',
        "note: 'In the public catalogue under ' + this.cLabel(c) + ' with ' + this.fand(x.fmts) + '. No one was given access.'",
      ],
      [
        sentBackToReviewerWhat('Kavya Nair'),
        'Sent back to the Academic Reviewer by Kavya Nair',
        "what: 'Sent back to the Academic Reviewer by Kavya Nair'",
      ],
      [
        sentBackToVendorWhat('Kavya Nair'),
        'Sent back to the vendor by Kavya Nair',
        "what: 'Sent back to the vendor by Kavya Nair'",
      ],
      [
        sentBackToVendorNote('Add the temperatures.', ['Course & description · Summary']),
        '“Add the temperatures.” Refers to: Course & description · Summary.',
        "note: '“' + reason + '”' + (refs.length ? ' Refers to: ' + refs.join('; ') + '.' : '')",
      ],
    ]);
    expect(sentBackToVendorNote('Add the temperatures.', [])).toBe('“Add the temperatures.”');
  });
});

describe('CM-05 Published experiment (CM-v1 `v.published`, `pubVM`)', () => {
  it.each(strings([PUBLISHED_PAGE, CORRECTIONS_PANEL]))('“%s” is drawn by the export', (phrase) => {
    expect(MAIN).toContain(phrase);
  });

  it('the band, the live entry and the corrections fact', () => {
    expectComposed([
      [
        publishedOverline('CHE ZG513'),
        'CHE ZG513 · Published experiment',
        "over: this.cShort(c) + ' · Published experiment'",
      ],
      [versionAfterFormats('1.2'), '· version 1.2', '<span>· version {{ P.ver }}</span>'],
      [
        liveVersionLine('1.2', '3 Jul 2026'),
        '1.2, since 3 Jul 2026',
        '<dd>{{ P.ver }}, since {{ P.since }}</dd>',
      ],
      [
        openUpdateStatus('on-hold'),
        'Update on hold',
        // The Content library's chip words for the open correction (`libVM` `tag`), in place of
        // the export's “u.id + ' · ' + label” (`corrFact`).
        "hold: 'Update on hold'",
      ],
      [
        correctionsReleased(2),
        '2 corrections released',
        "this.plural(nRel, 'correction') + ' released'",
      ],
      [
        courseLabel('CHE ZG513', 'Process Instrumentation & Control'),
        'CHE ZG513 · Process Instrumentation & Control',
        "v: c.code ? c.code + ' · ' + c.name : c.name",
      ],
    ]);
    expect(correctionsReleased(1)).toBe('1 correction released');
    expect(MAIN).toContain("const corrFact = u ? u.id + ' · ' + label");
    // One wording for the open correction on CM-04 and CM-05.
    for (const state of [
      'draft',
      'returned',
      'in-academic-review',
      'awaiting-release-decision',
      'on-hold',
    ] as const) {
      expect(openUpdateStatus(state)).toBe(CONTENT_LIBRARY.updateTags[state]);
    }
    expect(
      ['draft', 'returned', 'in-academic-review', 'awaiting-release-decision', 'on-hold'].map(
        (state) => openUpdateStatus(state as never),
      ),
    ).toEqual([
      'Update draft in progress',
      'Update returned to you',
      'Update in academic review',
      'Update awaiting release',
      'Update on hold',
    ]);
  });

  it('the Corrections panel’s lines by the open update’s state', () => {
    // The export's lead is the reference and the status; the product's is the status alone, in the
    // open correction's words.
    expect(MAIN).toContain("const lead = u ? u.id + ' · ' + label + '. ' : '';");
    expectComposed([
      [
        updateProgressLine('draft', '1.2'),
        'Update draft in progress. Edits to this experiment join that update.',
        "'Edits to this experiment join that update.'",
      ],
      [
        updateProgressLine('returned', '1.0'),
        'Update returned to you. It was returned to you with a reason. Edits to this experiment join that update.',
        "'It was returned to you with a reason. Edits to this experiment join that update.'",
      ],
      [
        updateProgressLine('in-academic-review', '1.2'),
        'Update in academic review. It is with the Academic Reviewer. You can start another correction once it is decided.',
        "'It is with the Academic Reviewer. You can start another correction once it is decided.'",
      ],
      [
        updateProgressLine('awaiting-release-decision', '1.0'),
        'Update awaiting release. The Academic Reviewer approved it. The Super Admin decides when to release it. Version 1.0 stays live.',
        "'The Academic Reviewer approved it. The Super Admin decides when to release it. Version ' + e.ver + ' stays live.'",
      ],
      [
        updateProgressLine('on-hold', '2.0'),
        'Update on hold. The Super Admin put it on hold. Version 2.0 stays live.',
        "'The Super Admin put it on hold. Version ' + e.ver + ' stays live.'",
      ],
    ]);
  });

  it('the released notice and the history', () => {
    expectComposed([
      [
        releasedTitle('1.1'),
        'Version 1.1 is live',
        "relTitle: rel ? 'Version ' + e.ver + ' is live' : ''",
      ],
      [
        releasedLine('27 Aug 2026', '1.0'),
        'The Super Admin released the correction on 27 Aug 2026. The history keeps version 1.0 and every decision. Nobody’s access changed.',
        // The export's words with “the correction” in place of its reference (`rel.id`).
        "'The Super Admin released ' + rel.id + ' on ' + this.day(rel.rel.when) + '. The history keeps version ' + rel.from + ' and every decision. Nobody’s access changed.'",
      ],
      [
        updateStartedWhat('In academic review'),
        'Update started — in academic review',
        "what: u.id + ' started — ' + label.toLowerCase()",
      ],
      [
        updateStartedNote('1.3'),
        'Version 1.3. The live version below is unchanged.',
        "note: 'Version ' + (this.T(u.ver) || 'not set yet') + '. The live version below is unchanged.'",
      ],
      [updateHeldWhat(), 'Update on hold', "what: u.id + ' on hold'"],
      [
        updateHeldNote('2.0', 'Hold until the vendor fixes it.'),
        'Version 2.0 stays live. Reason: “Hold until the vendor fixes it.”',
        "note: 'Version ' + e.ver + ' stays live. Reason: “' + u.hold.reason + '”'",
      ],
      [
        versionReleasedWhat('1.1'),
        'Version 1.1 released',
        "what: 'Version ' + e.ver + ' released'",
      ],
      // The export's release notes without the reference and its dash.
      [
        versionReleasedNote(true),
        'Correction released by the Super Admin.',
        "note: 'Correction ' + u.id + ' — released by the Super Admin.'",
      ],
      [versionReleasedNote(false), 'Correction.', "note: 'Correction UPD-0001.'"],
      [firstPublishedWhat('1.0'), 'Published · version 1.0', "what: 'Published · version 1.0'"],
      [
        PUBLISHED_PAGE.firstPublicationNote,
        'First publication by the Content Manager.',
        "note: 'First publication by the Content Manager.'",
      ],
    ]);
    expect(updateStartedNote(null)).toBe(
      'Version not set yet. The live version below is unchanged.',
    );
  });
});

describe('no internal reference in the CM-03 / CM-05 words (owner correction, 20 Oct 2026)', () => {
  it('no fixed phrase and no composed line carries a reference', () => {
    const composed = [
      ...strings([
        DECISION_PAGE,
        DECISION_PANEL,
        READ_ONLY,
        PUBLISH_DIALOG,
        DECISION_RESULT,
        STALE_NOTICE,
        CHECK_TITLES,
        CHECK_LINES,
        CHECK_FIXES,
        HISTORY,
        PUBLISHED_PAGE,
        CORRECTIONS_PANEL,
      ]),
      ...(
        ['draft', 'returned', 'in-academic-review', 'awaiting-release-decision', 'on-hold'] as const
      ).flatMap((state) => [openUpdateStatus(state), updateProgressLine(state, '1.2')]),
      releasedLine('27 Aug 2026', '1.0'),
      updateStartedWhat('Draft'),
      updateHeldWhat(),
      versionReleasedNote(true),
      versionReleasedNote(false),
    ];
    for (const words of composed) expect(words).not.toMatch(REFERENCE);
  });

  it('the register’s words for these screens carry none either', () => {
    for (const entry of Object.values(STATE_COPY_CM_DECISION)) {
      if (entry.words !== null) expect(entry.words).not.toMatch(REFERENCE);
    }
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

  it('the undrawn words are not the export’s', () => {
    for (const id of [
      'CM-03.loading',
      'CM-03.failed',
      'CM-03.published-by',
      'CM-03.stale.changed',
      'CM-03.moved-on',
      'CM-03.unavailable.publish',
      'CM-03.unavailable.send',
      'CM-05.loading',
      'CM-05.failed',
    ] as const) {
      const words = STATE_COPY_CM_DECISION[id].words;
      expect(MAIN).not.toContain(
        words
          .replace(/\{\w+\}/g, '')
          .trim()
          .slice(0, 24),
      );
    }
    expect(staleLine('Transient Cooling', null)).toBe(
      'Transient Cooling was changed from another tab or window. Nothing was changed by your decision.',
    );
  });
});
