/**
 * The words of VE-07 Experiment record and VE-13 History (B5-06) are the frozen board’s: each drawn
 * phrase is found verbatim in its markup or script, the composed ones with the board’s own sample
 * values and its script’s pieces; the undrawn forms are provisional entries of the state-copy
 * register, each with its decision and no decision id in its words.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import { STATE_COPY } from './state-copy';
import { STATE_COPY_VENDOR_RECORD } from './state-copy-vendor-record';
import {
  courseWithdrawnLine,
  courseWithdrawnTitle,
  courseWords,
  documentsWords,
  formatsPublishedLine,
  HISTORY,
  previewWords,
  publishedNote,
  publishedTitle,
  RECORD,
  recordOverline,
  resubmittedWhat,
  returnedNote,
  RETURNING_ROLE,
  routedWhat,
  valueOrDash,
  withContentManagerLine,
} from './vendor-record';

/** A board’s text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B5_06 = words('B5-06-Experiment-Record-and-History.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('VE-07 Experiment record (B5-06 f0 … f10)', () => {
  it.each(strings({ RECORD, HISTORY, RETURNING_ROLE }))('“%s” is drawn on B5-06', (phrase) => {
    expect(B5_06).toContain(phrase);
  });

  it('the overline: id · course, the revision only after a resubmit (script `recMeta`)', () => {
    expect(recordOverline('SUB-0077', 'ME ZG523', 1)).toBe('SUB-0077 · ME ZG523');
    expect(recordOverline('SUB-0077', 'ME ZG523', 2)).toBe('SUB-0077 · ME ZG523 · revision 2');
    expect(recordOverline('SUB-0077', null, 1)).toBe('SUB-0077 · —');
    expect(B5_06).toContain("' · revision ' + s.rev");
  });

  it('Details: course, preview, documents and empty values as the script composes them', () => {
    expect(courseWords({ code: 'ME ZG523', name: 'Thermodynamics & Heat Transfer' })).toBe(
      'ME ZG523 · Thermodynamics & Heat Transfer',
    );
    expect(courseWords({ code: null, name: 'Manufacturing Processes' })).toBe(
      'Manufacturing Processes',
    );
    expect(courseWords(null)).toBe('Not chosen yet');
    expect(B5_06).toContain("s.course + ' · ' + (D.cname[s.course]");
    expect(
      previewWords({
        label: 'Two-minute walkthrough',
        link: 'https://media.northline.example/composite-wall-walkthrough',
      }),
    ).toBe('Two-minute walkthrough — https://media.northline.example/composite-wall-walkthrough');
    expect(B5_06).toContain("T(s.plabel) + (T(s.plink) ? ' — ' + T(s.plink) : '')");
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
    expect(B5_06).toContain("s.docs.join(' · ')");
    expect(documentsWords([])).toBe('None');
    expect(valueOrDash('  ')).toBe('—');
    expect(valueOrDash(null)).toBe('—');
    expect(valueOrDash(' 1.0 ')).toBe('1.0');
  });

  it('the banners with the record’s values (f5, f8, f9)', () => {
    expect(withContentManagerLine('14 Aug 2026')).toBe(
      'Approved by the Academic Reviewer on 14 Aug 2026. The Content Manager decides whether to publish it. Nothing is needed from you now.',
    );
    expect(B5_06).toContain('Approved by the Academic Reviewer on ');
    expect(B5_06).toContain(
      '. The Content Manager decides whether to publish it. Nothing is needed from you now.',
    );
    expect(publishedTitle('30 Jul 2026')).toBe('Published · 30 Jul 2026');
    expect(B5_06).toContain('Published · {{ m.pub }}');
    expect(formatsPublishedLine(['web', 'vr'])).toBe(
      'Formats published: WEB · VR. Changes to a published experiment are not made from the Vendor workspace.',
    );
    expect(B5_06).toContain(
      'Formats published: {{ m.cFmts }}. Changes to a published experiment are not made from the Vendor workspace.',
    );
    expect(courseWithdrawnTitle('MEL ZG512')).toBe('MEL ZG512 is no longer assigned to you');
    expect(B5_06).toContain('MEL ZG512 is no longer assigned to you');
    // Without the withdrawal day, which the record’s read does not carry (VE-07.course-withdrawn.line).
    expect(courseWithdrawnLine('Northline Simulation Studio', 'draft')).toBe(
      'Withdrawn from Northline Simulation Studio. This draft is kept, read-only. BITS / WILP decides which courses are yours.',
    );
    expect(B5_06).toContain(
      'Withdrawn from Northline Simulation Studio on 15 Aug 2026. This draft is kept, read-only. BITS / WILP decides which courses are yours.',
    );
    expect(courseWithdrawnLine('Northline Simulation Studio', 'returned')).toBe(
      'Withdrawn from Northline Simulation Studio. It is kept, read-only. BITS / WILP decides which courses are yours.',
    );
  });
});

describe('VE-13 History (B5-06 script `hist`)', () => {
  it('the resubmit and routing lines (f0, f4)', () => {
    expect(resubmittedWhat('2')).toBe('Submitted · revision 2');
    expect(routedWhat('2')).toBe('With Academic Reviewer · revision 2');
    expect(B5_06).toContain('Submitted · revision 2');
    expect(B5_06).toContain('With Academic Reviewer · revision 2');
  });

  it('a return’s note: the role and the reason’s first sentence (f3, f6)', () => {
    expect(returnedNote('academic-reviewer', 'Please clarify the VR device requirements.')).toBe(
      'Academic Reviewer: “Please clarify the VR device requirements.”',
    );
    expect(B5_06).toContain('Academic Reviewer: “Please clarify the VR device requirements.”');
    expect(
      returnedNote(
        'content-manager',
        'The summary runs to three sentences. Shorten it to one; the catalogue shows only the first line.',
      ),
    ).toBe('Content Manager: “The summary runs to three sentences…”');
    expect(B5_06).toContain('Content Manager: “The summary runs to three sentences…”');
    expect(returnedNote('academic-reviewer', '  No full stop  ')).toBe(
      'Academic Reviewer: “No full stop”',
    );
  });

  it('the publication’s note (f8), one format and three (state-copy VE-13.published-one)', () => {
    expect(publishedNote(['web', 'vr'])).toBe('WEB and VR are live in the catalogue.');
    expect(B5_06).toContain('WEB and VR are live in the catalogue.');
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
        // Undrawn words are not on the board as they are (the drawn ones are in `vendor-record.ts`).
        expect(B5_06).not.toContain(entry.words);
      }
      // Registered in the one register.
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
    },
  );
});
