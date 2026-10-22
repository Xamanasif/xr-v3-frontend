/**
 * The words of VE-07 Experiment record and VE-13 Submission and version history are the
 * owner-approved Vendor export's (design/v3-refined-b/roles/VE-v1, `Main.dc.html`): each drawn
 * phrase is found verbatim in its markup or script, the composed ones with the script’s own pieces
 * (`recView`, `deliv`, the `hist` entries) — except that no line carries the submission's
 * reference: where the script's form writes one, it is left out (the owner's identifier rule for
 * the Vendor, 22 Oct 2026; state-copy `VE-02.no-reference`); the undrawn forms are provisional
 * entries of the state-copy register, each with its decision and no decision id in its words.
 */
import { describe, expect, it } from 'vitest';

import { veExport } from '@/test-support/boards';

import { STATE_COPY } from './state-copy';
import { STATE_COPY_VENDOR_RECORD } from './state-copy-vendor-record';
import {
  courseWithdrawnLine,
  courseWithdrawnTitle,
  courseWords,
  documentsWords,
  formatsLabel,
  formatsPublishedLine,
  HISTORY,
  historyPrivateNote,
  INTRO,
  lastChangeMeta,
  previewWords,
  publishedNote,
  publishedTitle,
  RECORD,
  RECORD_EYEBROW,
  resubmittedWhat,
  returnedNote,
  returnedStandWords,
  RETURNING_ROLE,
  reviseGoToLabel,
  revisionMeta,
  savedChangesLine,
  valueOrDash,
  withContentManagerLine,
} from './vendor-record';

/** The export’s text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
const MAIN = (() => {
  const raw = veExport('Main.dc.html');
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
})();

/** An internal reference (the owner's identifier rule for the Vendor, 22 Oct 2026; SA-v1 rule). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('VE-07 Experiment record (VE-v1 `V.record`)', () => {
  it.each(strings({ RECORD, HISTORY, RETURNING_ROLE }))('“%s” is drawn by the export', (phrase) => {
    expect(MAIN).toContain(phrase);
  });

  it('the head: “Experiment”, the revision and the last change (`eyebrow`, `meta`)', () => {
    // The script's eyebrow without `r.id` (state-copy `VE-02.no-reference`).
    expect(RECORD_EYEBROW).toBe('Experiment');
    expect(MAIN).toContain("eyebrow: 'Experiment · ' + r.id");
    expect(RECORD_EYEBROW).not.toMatch(REFERENCE);
    for (const phrase of strings({ RECORD, HISTORY, RETURNING_ROLE })) {
      expect(phrase).not.toMatch(REFERENCE);
    }
    expect(revisionMeta(2)).toBe('Revision 2');
    expect(lastChangeMeta('24 Aug 2026')).toBe('Last change 24 Aug 2026');
    expect(MAIN).toContain(
      "concat(st === 'draft' || st === 'readonly' ? [] : ['Revision ' + r.rev]).concat(['Last change ' + this.dl(r.last)])",
    );
  });

  it('the returned-reason panel: the chips’ names and the changes saved (`refs`, `pendingText`)', () => {
    expect(reviseGoToLabel('Formats & delivery · AR · Device need')).toBe(
      'Revise: go to Formats & delivery · AR · Device need',
    );
    expect(MAIN).toContain("aria: 'Revise: go to ' + x.t");
    expect(savedChangesLine('27 Aug 2026, 10:40', 1)).toBe(
      'Saved 27 Aug 2026, 10:40. Only you can see them. Everyone else still sees revision 1 as it was submitted.',
    );
    expect(MAIN).toContain(
      "o.pendingText = 'Saved ' + r.pendingAt + '. Only you can see them. Everyone else still sees revision ' + r.rev + ' as it was submitted.';",
    );
    expect(historyPrivateNote('27 Aug 2026, 10:40')).toBe(
      'Your changes saved on 27 Aug 2026, 10:40 are not part of this history until you resubmit.',
    );
    expect(MAIN).toContain(
      "'Your changes saved on ' + r.pendingAt + ' are not part of this history until you resubmit.'",
    );
  });

  it('which version Details shows (`intro`)', () => {
    expect(INTRO.draft('25 Aug 2026, 17:20')).toBe(
      'Your draft as last saved on 25 Aug 2026, 17:20. Nothing here has been submitted.',
    );
    expect(MAIN).toContain(
      "o.intro = st === 'draft' ? 'Your draft as last saved' + (r.savedAt ? ' on ' + r.savedAt : '') + '. Nothing here has been submitted.'",
    );
    expect(INTRO.readOnly('12 Aug 2026, 14:00')).toBe(
      'Your draft as last saved on 12 Aug 2026, 14:00. It can’t be changed or submitted.',
    );
    expect(MAIN).toContain(
      "'Your draft as last saved on ' + (r.savedAt || this.dl(r.last)) + '. It can’t be changed or submitted.'",
    );
    expect(INTRO.published('30 Jul 2026')).toBe(
      'The published version, live in the catalogue since 30 Jul 2026.',
    );
    expect(MAIN).toContain("'The published version, live in the catalogue since ' + r.pub + '.'");
    expect(INTRO.submitted(1, '18 Aug 2026')).toBe(
      'Revision 1 as it was submitted on 18 Aug 2026.',
    );
    expect(INTRO.submitted(2, null)).toBe('Revision 2 as it was submitted.');
    expect(MAIN).toContain(
      "'Revision ' + r.rev + ' as it was submitted' + (on ? ' on ' + on : '') + '.'",
    );
    // The Vendor’s read holds the saved changes: Details shows them and says so.
    expect(INTRO.savedChanges('27 Aug 2026, 10:40')).toBe(
      'Your changes as last saved on 27 Aug 2026, 10:40. They are not resubmitted yet.',
    );
  });

  it('Details: course, preview, documents, the delivery’s sample file and empty values', () => {
    expect(courseWords({ code: 'ME ZG523', name: 'Thermodynamics & Heat Transfer' })).toBe(
      'ME ZG523 · Thermodynamics & Heat Transfer',
    );
    expect(MAIN).toContain("o.courseLong = d.course + ' · ' + (Component.COURSES[d.course]");
    expect(courseWords({ code: null, name: 'Manufacturing Processes' })).toBe(
      'Manufacturing Processes',
    );
    expect(courseWords(null)).toBe('Not chosen yet');
    expect(
      previewWords({
        label: 'Two-minute walkthrough',
        link: 'https://media.northline.example/composite-wall-walkthrough',
      }),
    ).toBe('Two-minute walkthrough — https://media.northline.example/composite-wall-walkthrough');
    expect(MAIN).toContain(
      "o.preview = T(d.plabel) ? T(d.plabel) + (T(d.plink) ? ' — ' + T(d.plink) : '') : 'None';",
    );
    expect(previewWords({ label: null, link: null })).toBe('None');
    // A link without a label is allowed (OD-B5-08): it shows (state-copy VE-07.preview-link-only).
    expect(previewWords({ label: null, link: 'https://media.example/a' })).toBe(
      'https://media.example/a',
    );
    expect(
      documentsWords([
        { fileName: 'Lab handout — Composite Wall.pdf' },
        { fileName: 'Thermocouple positions.pdf' },
      ]),
    ).toBe('Lab handout — Composite Wall.pdf · Thermocouple positions.pdf');
    expect(MAIN).toContain("o.docs = d.docs.length ? d.docs.join(' · ') : 'None';");
    expect(documentsWords([])).toBe('None');
    expect(valueOrDash('  ')).toBe('—');
    expect(valueOrDash(null)).toBe('—');
    expect(valueOrDash(' 1.0 ')).toBe('1.0');
    expect(formatsPublishedLine(['web', 'vr'])).toBe('Formats published: WEB · VR');
    expect(MAIN).toContain('Formats published: {{ R.fmtText }}');
    expect(MAIN).toContain("o.fmtText = o.fmts.join(' · ')");
  });

  it('“Where it stands”: the formats’ name and the return (`fmtAria`, `stand`)', () => {
    expect(formatsLabel(['web', 'ar'])).toBe('Formats: WEB, AR');
    expect(formatsLabel([])).toBe('Formats: none chosen');
    expect(MAIN).toContain("o.fmtAria = 'Formats: ' + (o.fmts.join(', ') || 'none chosen');");
    expect(returnedStandWords('24 Aug 2026', 'academic-reviewer')).toBe(
      '24 Aug 2026 · Academic Reviewer',
    );
    expect(MAIN).toContain("v: r.ret.when.split(',')[0] + ' · ' + r.ret.by");
  });

  it('the notices with the record’s values (HANDOFF §2 “Record notice”)', () => {
    expect(withContentManagerLine('14 Aug 2026')).toBe(
      'Approved by the Academic Reviewer on 14 Aug 2026. The Content Manager decides whether to publish it. Nothing is needed from you now.',
    );
    expect(MAIN).toContain(
      "'Approved by the Academic Reviewer on ' + r.approved + '. The Content Manager decides whether to publish it. Nothing is needed from you now.'",
    );
    expect(publishedTitle('30 Jul 2026')).toBe('Published · 30 Jul 2026');
    expect(MAIN).toContain("'Published · ' + r.pub");
    expect(courseWithdrawnTitle('MEL ZG512')).toBe('MEL ZG512 is no longer assigned to you');
    expect(MAIN).toContain("d.course + ' is no longer assigned to you'");
    // Without the withdrawal day, which the record’s read does not carry (VE-07.course-withdrawn.line).
    expect(courseWithdrawnLine('Northline Simulation Studio', 'draft')).toBe(
      'Withdrawn from Northline Simulation Studio. This draft is kept, read-only. BITS / WILP decides which courses are yours.',
    );
    expect(MAIN).toContain(
      "'Withdrawn from Northline Simulation Studio on ' + (r.withdrawn || '') + '. This draft is kept, read-only. BITS / WILP decides which courses are yours.'",
    );
    expect(courseWithdrawnLine('Northline Simulation Studio', 'returned')).toBe(
      'Withdrawn from Northline Simulation Studio. It is kept, read-only. BITS / WILP decides which courses are yours.',
    );
  });
});

describe('VE-13 History (the export’s `hist` entries)', () => {
  it('the resubmit entry: the neutral “Submitted · revision N”; no routing entry is drawn', () => {
    expect(resubmittedWhat('2')).toBe('Submitted · revision 2');
    expect(MAIN).toContain("what: 'Submitted · revision 2'");
    // v46's Vendor-facing routing entry is retired (HANDOFF §2, §7).
    expect(MAIN).not.toContain('With Academic Reviewer · revision');
    expect(MAIN).not.toContain('Routed by the approved workflow rule.');
  });

  it('a return’s note: the role and the reason’s first sentence', () => {
    expect(returnedNote('academic-reviewer', 'Please clarify the VR device requirements.')).toBe(
      'Academic Reviewer: “Please clarify the VR device requirements.”',
    );
    expect(MAIN).toContain('Academic Reviewer: “Please clarify the VR device requirements.”');
    expect(
      returnedNote(
        'content-manager',
        'The summary runs to three sentences. Shorten it to one; the catalogue shows only the first line.',
      ),
    ).toBe('Content Manager: “The summary runs to three sentences…”');
    expect(MAIN).toContain('Content Manager: “The summary runs to three sentences…”');
    expect(returnedNote('academic-reviewer', '  No full stop  ')).toBe(
      'Academic Reviewer: “No full stop”',
    );
  });

  it('the publication’s note, one format and three (state-copy VE-13.published-one)', () => {
    expect(publishedNote(['web', 'vr'])).toBe('WEB and VR are live in the catalogue.');
    expect(MAIN).toContain('WEB and VR are live in the catalogue.');
    expect(publishedNote(['web'])).toBe('WEB is live in the catalogue.');
    expect(publishedNote(['web', 'ar', 'vr'])).toBe('WEB, AR and VR are live in the catalogue.');
  });
});

describe('the state-copy entries of the vendor-record group', () => {
  it.each(Object.entries(STATE_COPY_VENDOR_RECORD))(
    '%s is provisional, with its decision, and names no decision in its words',
    (id, entry) => {
      expect(id).toMatch(/^VE-(07|13)\./);
      expect(entry.screen).toBe(id.slice(0, 5));
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
      if (entry.words !== null) {
        expect(entry.words).not.toMatch(/\b(?:OD|T|PC|DEV|VD|ATT|M|DV|SUB|LD)-?\d/);
        expect(entry.words).not.toMatch(/\bemail\b/i);
        // Undrawn words are not in the export as they are (the drawn ones are in `vendor-record.ts`).
        expect(MAIN).not.toContain(entry.words);
      }
      // Registered in the one register.
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
    },
  );
});
