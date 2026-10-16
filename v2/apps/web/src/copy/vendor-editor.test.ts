/**
 * The words of the experiment editor (VE-03 … VE-06, VE-08, VE-09; boards B5-03, B5-04, B5-05,
 * B5-07) and of the returned notice are the frozen boards’: each drawn phrase is found verbatim in
 * its board’s markup or script, the composed ones with the boards’ own sample values (or, where
 * the board composes them in its script, the script’s own pieces); the undrawn forms are
 * provisional entries of the state-copy register, each with its decision and no decision id in
 * its words.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import { STATE_COPY } from './state-copy';
import { STATE_COPY_VENDOR_EDITOR } from './state-copy-vendor-editor';
import {
  changeSectionLabel,
  changesSavedWords,
  CHECK_STEP,
  COURSE_STEP,
  courseHint,
  courseWords,
  DONE,
  draftSavedWords,
  EDITOR,
  FORMATS_STEP,
  formatLabel,
  formatNotesLabel,
  formatPanelTitle,
  goToReferenceLabel,
  goToStepWords,
  idLineWords,
  joinedWords,
  missingCountWords,
  noLongerAssignedLine,
  noLongerAssignedTitle,
  overlineWords,
  PREVIEW_STEP,
  previewWords,
  READ_ONLY,
  recordMetaWords,
  referenceWords,
  removeDocumentLabel,
  removePackageFileLabel,
  resubmittedLine,
  RETURNED,
  returnedWhenWords,
  sectionStateWords,
  SUBMIT_DIALOG,
  submitEffect,
  submittedLead,
  subLineWords,
  withdrawnCourseHint,
} from './vendor-editor';

/** A board’s text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B5 = [
  'B5-03-Create-Course-and-Description.dc.html',
  'B5-04-Formats-and-Delivery.dc.html',
  'B5-05-Preview-Check-and-Submit.dc.html',
  'B5-07-Revise-and-Resubmit.dc.html',
]
  .map(words)
  .join('\n');
const B6_03 = words('B6-03-Review-a-Submission.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('the editor’s drawn words (B5-03, B5-04, B5-05, B5-07)', () => {
  it.each(
    strings([EDITOR, COURSE_STEP, FORMATS_STEP, PREVIEW_STEP, CHECK_STEP, SUBMIT_DIALOG, DONE]),
  )('“%s” is on the B5 boards', (phrase) => {
    expect(B5).toContain(phrase);
  });

  it.each(strings([READ_ONLY, RETURNED]))('“%s” is on B5-07', (phrase) => {
    expect(words('B5-07-Revise-and-Resubmit.dc.html')).toContain(phrase);
  });

  it('the composed words are the boards’, with their sample values', () => {
    for (const phrase of [
      courseHint('Northline Simulation Studio'),
      courseWords('ME ZG523', 'Thermodynamics & Heat Transfer'),
      formatPanelTitle('web'),
      formatLabel('ar'),
      formatNotesLabel('web'),
      subLineWords('SUB-0077', 'Conduction Through a Composite Wall'),
      noLongerAssignedTitle('MEL ZG512'),
      noLongerAssignedLine(
        'MEL ZG512 · Manufacturing Processes',
        'Northline Simulation Studio',
        '15 Aug 2026',
      ),
    ]) {
      expect(B5).toContain(phrase);
    }
    // Composed in the script (`vxView`), with its own pieces.
    expect(formatPanelTitle('vr')).toBe('Virtual reality (VR) · App package');
    expect(formatPanelTitle('mr')).toBe('Mixed reality (MR) · App package');
    expect(B5).toContain("title: LONG[f] + ' · App package'");
    expect(B5).toContain(
      "LONG = { AR: 'Augmented reality (AR)', VR: 'Virtual reality (VR)', MR: 'Mixed reality (MR)' }",
    );
    expect(formatNotesLabel('vr')).toBe('Notes for VR');
    expect(B5).toContain("notesLabel: 'Notes for ' + f");
    expect(missingCountWords(3)).toBe('3 things to finish before you can submit');
    expect(goToStepWords('formats')).toBe('Go to formats and delivery');
    expect(goToStepWords('preview')).toBe('Go to preview and documents');
    expect(B5).toContain("where: 'Go to ' + titles[stepOf(k)].toLowerCase()");
    expect(sectionStateWords(2)).toBe('2 missing');
    expect(sectionStateWords(0)).toBe('Provided');
    expect(B5).toContain("state: bad ? bad + ' missing' : 'Provided'");
    expect(
      previewWords(
        'Two-minute walkthrough',
        'https://media.northline.example/composite-wall-walkthrough',
      ),
    ).toBe('Two-minute walkthrough — https://media.northline.example/composite-wall-walkthrough');
    expect(B5).toContain(
      "o.cPreview = T(s.plabel) ? T(s.plabel) + (T(s.plink) ? ' — ' + T(s.plink) : '') : 'None'",
    );
    expect(
      joinedWords(['Lab handout — Composite Wall.pdf', 'Thermocouple positions.pdf'], 'None'),
    ).toBe('Lab handout — Composite Wall.pdf · Thermocouple positions.pdf');
    expect(B5).toContain("o.cDocs = s.docs.length ? s.docs.join(' · ') : 'None'");
    expect(submitEffect('Conduction Through a Composite Wall')).toBe(
      'This sends “Conduction Through a Composite Wall” to the Academic Reviewer. It does not publish anything.',
    );
    expect(B5).toContain(
      "'This sends “' + (T(s.name) || 'this experiment') + '” to the Academic Reviewer. It does not publish anything.'",
    );
    expect(returnedWhenWords('19 Aug 2026, 16:05', 'Prof. A. Menon')).toBe(
      '19 Aug 2026, 16:05 · Prof. A. Menon',
    );
    expect(B5).toContain("o.retWhen = r ? r.when + ' · ' + r.who : ''");
    expect(withdrawnCourseHint('MEL ZG512', 'Manufacturing Processes')).toBe(
      'You chose MEL ZG512 · Manufacturing Processes, which was withdrawn from your courses while you were editing.',
    );
    expect(B5).toContain(
      "'You chose ' + s.stale + ' · ' + (D.cname[s.stale] || '') + ', which was withdrawn from your courses while you were editing.'",
    );
    expect(draftSavedWords('11 Aug 2026, 17:40')).toBe('Draft saved · 11 Aug 2026, 17:40');
    expect(B5).toContain("'Draft saved · ' + D.at.saved");
    expect(B5).toContain(
      "s.id + (isRev ? ' · revision ' + s.rev + ' was returned' : s.mode === 'draft' ? ' · draft' : '')",
    );
    expect(B5).toContain(
      "(s.id || 'Not saved yet') + ' · ' + (s.course || '—') + (s.rev > 1 ? ' · revision ' + s.rev : '')",
    );
    expect(idLineWords('SUB-0077', 'edit', 1)).toBe('SUB-0077 · draft');
    expect(idLineWords('SUB-0077', 'revise', 1)).toBe('SUB-0077 · revision 1 was returned');
    expect(idLineWords(null, 'create', 1)).toBe('Not saved yet');
    expect(recordMetaWords('SUB-0083', 'MEL ZG512', 1)).toBe('SUB-0083 · MEL ZG512');
    expect(recordMetaWords('SUB-0077', 'ME ZG523', 2)).toBe('SUB-0077 · ME ZG523 · revision 2');
    // Composed in the script (`vxView`): the overline, the saved lines, the counts, the labels.
    expect(overlineWords('create', 1)).toBe('Create experiment · Step 1 of 4');
    expect(overlineWords('revise', 4)).toBe('Revise and resubmit · Step 4 of 4');
    expect(B5).toContain(
      "(isRev ? 'Revise and resubmit' : s.mode === 'draft' ? 'Edit draft' : 'Create experiment') + ' · Step ' + s.step + ' of 4'",
    );
    expect(changesSavedWords('26 Aug 2026, 11:12')).toBe(
      'Changes saved · 26 Aug 2026, 11:12 · not resubmitted yet',
    );
    expect(B5).toContain("'Changes saved · ' + D.at.revsave + ' · not resubmitted yet'");
    expect(missingCountWords(1)).toBe('1 thing to finish before you can submit');
    expect(B5).toContain(
      "aKeys.length + ' thing' + (aKeys.length === 1 ? '' : 's') + ' to finish before you can submit'",
    );
    expect(changeSectionLabel('course')).toBe('Change course and description');
    expect(B5).toContain("aria: 'Change ' + label.toLowerCase()");
    expect(removePackageFileLabel('vr')).toBe('Remove the VR package file');
    expect(B5).toContain("rmAria: 'Remove the ' + f + ' package file'");
    expect(removeDocumentLabel('Safety notes.pdf')).toBe('Remove Safety notes.pdf');
    expect(B5).toContain("aria: 'Remove ' + d");
    expect(previewWords(null, null)).toBe('None');
    expect(previewWords('Two-minute walkthrough', null)).toBe('Two-minute walkthrough');
    expect(submitEffect('')).toBe(
      'This sends “this experiment” to the Academic Reviewer. It does not publish anything.',
    );
    expect(submittedLead('SUB-0077', 'Conduction Through a Composite Wall')).toBe(
      'SUB-0077 · Conduction Through a Composite Wall is with the Academic Reviewer. Nothing is published. You can’t edit it while it is being reviewed.',
    );
    expect(B5).toContain(
      '{{ m.subLine }} is with the Academic Reviewer. Nothing is published. You can’t edit it while it is being reviewed.',
    );
    expect(resubmittedLine('SUB-0077', 'Conduction Through a Composite Wall')).toBe(
      'SUB-0077 · Conduction Through a Composite Wall · nothing is needed from you now.',
    );
    expect(B5).toContain('{{ m.subLine }} · nothing is needed from you now.');
  });

  it('the references are B6-03’s (the reviewer’s own words for them)', () => {
    for (const [reference, phrase] of [
      [
        { step: 'formats-and-delivery', format: 'vr', field: 'device-need' },
        'Formats & delivery · VR · Device need',
      ],
      [
        { step: 'formats-and-delivery', format: 'ar', field: 'install-notes' },
        'Formats & delivery · AR · Install notes',
      ],
      [
        { step: 'formats-and-delivery', format: 'web', field: 'web-link' },
        'Formats & delivery · WEB · Web link',
      ],
      [
        { step: 'formats-and-delivery', format: 'web', field: 'browser-and-computer' },
        'Formats & delivery · WEB · Browser and computer',
      ],
      [
        { step: 'formats-and-delivery', format: 'mr', field: 'package' },
        'Formats & delivery · MR · Package',
      ],
      [
        { step: 'course-and-description', format: null, field: 'summary' },
        'Course & description · Summary',
      ],
      [
        { step: 'course-and-description', format: null, field: 'description' },
        'Course & description · Description',
      ],
      [
        { step: 'preview-and-documents', format: null, field: 'preview-link' },
        'Preview & documents · Preview link',
      ],
    ] as const) {
      expect(referenceWords(reference)).toBe(phrase);
      expect(B6_03).toContain(phrase);
    }
    expect(
      goToReferenceLabel({ step: 'formats-and-delivery', format: 'vr', field: 'device-need' }),
    ).toBe('Go to Formats & delivery · VR · Device need');
    expect(B5).toContain("aria: 'Go to ' + x.t");
  });

  it('the undrawn forms are the register’s, with no decision id in their words', () => {
    expect(
      noLongerAssignedLine(
        'MEL ZG512 · Manufacturing Processes',
        'Northline Simulation Studio',
        null,
      ),
    ).toBe(
      'MEL ZG512 · Manufacturing Processes was withdrawn from Northline Simulation Studio. This draft is kept, read-only. BITS / WILP decides which courses are yours.',
    );
    for (const [id, entry] of Object.entries(STATE_COPY_VENDOR_EDITOR)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
      if (entry.words) {
        expect(entry.words, id).not.toMatch(/\b(?:VD|OD|PC|DEV|T)-[A-Z0-9-]+/);
        expect(entry.words, id).not.toMatch(/'/);
      }
    }
  });
});
