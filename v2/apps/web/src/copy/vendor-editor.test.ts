/**
 * The words of the experiment editor (VE-03 … VE-06, VE-08, VE-09) and of the returned notice are
 * the owner-approved V3 Vendor export's (design/v3-refined-b/roles/VE-v1, `Main.dc.html`): each
 * drawn phrase is found verbatim in its markup or script, the composed ones with the script's own
 * pieces (`edView`, `dlgView`, `deliv`); the reference words the export does not compose are the
 * reviewer's (B6-03); the undrawn forms are provisional entries of the state-copy register, each
 * with its decision and no decision id in its words.
 */
import { describe, expect, it } from 'vitest';

import { board, veExport } from '@/test-support/boards';

import { STATE_COPY } from './state-copy';
import { STATE_COPY_VENDOR_EDITOR } from './state-copy-vendor-editor';
import {
  alreadySubmittedLine,
  attachFileLabel,
  changeSectionLabel,
  changesSavedWords,
  CHECK_STEP,
  COURSE_STEP,
  courseHint,
  courseWords,
  DONE,
  draftSavedWords,
  EDITOR,
  formatKind,
  formatName,
  formatNotesLabel,
  formatPartLabel,
  FORMATS_STEP,
  formatsCompleteWords,
  formatsNameWords,
  goToReferenceLabel,
  goToStepWords,
  idLineWords,
  joinedWords,
  lastSavedWords,
  LEAVE_DIALOG,
  missingCountWords,
  noLongerAssignedLine,
  noLongerAssignedTitle,
  outlineChangesSaved,
  outlineKicker,
  overlineWords,
  partsLabel,
  PREVIEW_STEP,
  previewWords,
  READ_ONLY,
  readOnlyEyebrow,
  referenceWords,
  REFUSAL,
  removeDocumentLabel,
  removePackageFileLabel,
  RETURNED,
  returnedWhenWords,
  reviseVisibility,
  revisionSentWords,
  sectionStateWords,
  stepButtonLabel,
  stillNeededWords,
  SUBMIT_DIALOG,
  submitEffect,
  subLineWords,
  todayAt,
  toFixWords,
  withdrawnCourseHint,
} from './vendor-editor';

/** The export's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
const MAIN = (() => {
  const raw = veExport('Main.dc.html');
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
})();

const B6_03 = (() => {
  const raw = board('B6-03-Review-a-Submission.dc.html');
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
})();

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('the editor’s drawn words (VE-v1 `Main.dc.html`)', () => {
  it.each(
    strings([
      EDITOR,
      COURSE_STEP,
      FORMATS_STEP,
      PREVIEW_STEP,
      CHECK_STEP,
      SUBMIT_DIALOG,
      LEAVE_DIALOG,
      DONE,
      REFUSAL,
      READ_ONLY,
      RETURNED,
    ]),
  )('“%s” is drawn by the export', (phrase) => {
    expect(MAIN).toContain(phrase);
  });

  it('the frame: eyebrow, id line, stepper and outline (`edView`)', () => {
    expect(overlineWords('create', 1)).toBe('Create experiment · Step 1 of 4');
    expect(overlineWords('revise', 4)).toBe('Revise and resubmit · Step 4 of 4');
    expect(MAIN).toContain("o.over = flowWord + ' · Step ' + ed.step + ' of 4'");
    expect(idLineWords(null, 'create', 1)).toBe('Not saved yet');
    expect(idLineWords('SUB-0087', 'edit', 1)).toBe('SUB-0087 · only you can see a draft');
    expect(idLineWords('SUB-0081', 'revise', 1)).toBe('SUB-0081 · revision 1 was returned');
    expect(MAIN).toContain(
      "o.idLine = !r ? 'Not saved yet' : isRev ? r.id + ' · revision ' + r.rev + ' was returned' : r.id + ' · only you can see a draft'",
    );
    expect(stepButtonLabel(1, 'Course and description', 'Not started')).toBe(
      'Step 1 of 4, Course and description, not started',
    );
    expect(MAIN).toContain(
      "aria: 'Step ' + i + ' of 4, ' + Component.TITLES[i] + ', ' + stateOf(i).toLowerCase()",
    );
    expect(partsLabel('Formats and delivery')).toBe('Parts of Formats and delivery');
    expect(MAIN).toContain("x.subAria = 'Parts of ' + Component.TITLES[i + 1]");
    expect(outlineKicker('SUB-0087', 'edit', 1)).toBe('SUB-0087 · draft');
    expect(outlineKicker('SUB-0081', 'revise', 1)).toBe('SUB-0081 · revision 1 returned');
    expect(MAIN).toContain(
      "isRev ? r.id + ' · revision ' + r.rev + ' returned' : r.id + ' · draft'",
    );
    expect(lastSavedWords('27 Aug 2026, 10:40')).toBe('Last saved 27 Aug 2026, 10:40');
    expect(MAIN).toContain("'Last saved ' + (r.savedAt");
    expect(outlineChangesSaved(todayAt('10:40'))).toBe(
      'Changes saved · 10:40 today · not resubmitted',
    );
    expect(MAIN).toContain(
      "'Changes saved · ' + r.pendingAt.split(', ')[1] + ' today · not resubmitted'",
    );
    expect(reviseVisibility(1)).toBe('Others see revision 1 as submitted until you resubmit.');
    expect(MAIN).toContain("'Others see revision ' + r.rev + ' as submitted until you resubmit.'");
    expect(stillNeededWords(2)).toBe('2 still needed');
    expect(MAIN).toContain("missing + ' still needed'");
    expect(toFixWords(3)).toBe('3 to fix');
    expect(MAIN).toContain("shown + ' to fix'");
    expect(draftSavedWords('27 Aug 2026, 10:40')).toBe('Draft saved · 27 Aug 2026, 10:40');
    expect(MAIN).toContain("saved = 'Draft saved · ' + t");
    expect(changesSavedWords('27 Aug 2026, 10:40')).toBe(
      'Changes saved · 27 Aug 2026, 10:40 · not resubmitted yet',
    );
    expect(MAIN).toContain("'Changes saved · ' + t + ' · not resubmitted yet'");
  });

  it('steps 1–3: the course, the formats, the blocks and the documents', () => {
    expect(MAIN).toContain(courseHint('Northline Simulation Studio'));
    expect(courseWords('ME ZG523', 'Thermodynamics & Heat Transfer')).toBe(
      'ME ZG523 · Thermodynamics & Heat Transfer',
    );
    expect(MAIN).toContain("t: c + ' · ' + Component.COURSES[c]");
    expect(withdrawnCourseHint('MEL ZG512', 'Manufacturing Processes')).toBe(
      'You chose MEL ZG512 · Manufacturing Processes, which was withdrawn from your courses while you were editing.',
    );
    expect(MAIN).toContain(
      "'You chose ' + ed.stale + ' · ' + (Component.COURSES[ed.stale] || '') + ', which was withdrawn from your courses while you were editing.'",
    );
    for (const format of ['web', 'ar', 'vr', 'mr'] as const) {
      expect(MAIN).toContain(`'${formatName(format)}'`);
      expect(MAIN).toContain(formatKind(format));
    }
    expect(formatPartLabel('ar')).toBe('AR · Augmented reality');
    expect(MAIN).toContain("label: f + ' · ' + Component.FSHORT[f]");
    expect(formatsCompleteWords(1, 2)).toBe('1 of 2 formats complete');
    expect(formatsCompleteWords(1, 1)).toBe('1 of 1 format complete');
    expect(MAIN).toContain(
      "doneF + ' of ' + chosenF.length + (chosenF.length === 1 ? ' format' : ' formats') + ' complete'",
    );
    expect(formatNotesLabel('vr')).toBe('Notes for VR');
    expect(MAIN).toContain("notesLabel: 'Notes for ' + f");
    expect(attachFileLabel('ar')).toBe('Attach the AR package file');
    expect(MAIN).toContain("p.attachAria = 'Attach the ' + p.code + ' package file'");
    expect(removePackageFileLabel('vr')).toBe('Remove the VR package file');
    expect(MAIN).toContain("rmAria: 'Remove the ' + f + ' package file'");
    expect(removeDocumentLabel('Safety notes.pdf')).toBe('Remove Safety notes.pdf');
    expect(MAIN).toContain("aria: 'Remove ' + n");
  });

  it('step 4: the missing items, the review sections and the summary values', () => {
    expect(missingCountWords(1)).toBe('1 thing to finish before you can submit');
    expect(missingCountWords(3)).toBe('3 things to finish before you can submit');
    expect(MAIN).toContain(
      "aKeys.length + (aKeys.length === 1 ? ' thing' : ' things') + ' to finish before you can submit'",
    );
    expect(goToStepWords('formats')).toBe('Go to formats and delivery');
    expect(MAIN).toContain("'Go to ' + Component.TITLES[this.stepOf(k)].toLowerCase()");
    expect(sectionStateWords(2)).toBe('2 missing');
    expect(sectionStateWords(0)).toBe('Provided');
    expect(MAIN).toContain("state: bad ? bad + ' missing' : 'Provided'");
    expect(changeSectionLabel('course')).toBe('Change course and description');
    expect(changeSectionLabel('preview')).toBe('Change preview and documents');
    expect(MAIN).toContain("aria: 'Change ' + label.toLowerCase()");
    expect(MAIN).toContain("aria: 'Change preview and documents'");
    expect(previewWords('Two-minute walkthrough', 'https://media.example/w')).toBe(
      'Two-minute walkthrough — https://media.example/w',
    );
    expect(previewWords('Two-minute walkthrough', null)).toBe('Two-minute walkthrough');
    expect(previewWords(null, null)).toBe('None');
    expect(MAIN).toContain(
      "o.cPreview = T(d.plabel) ? T(d.plabel) + (T(d.plink) ? ' — ' + T(d.plink) : '') : 'None'",
    );
    expect(joinedWords(['a.pdf', 'b.pdf'], 'None')).toBe('a.pdf · b.pdf');
    expect(MAIN).toContain("o.cDocs = d.docs.length ? d.docs.join(' · ') : 'None'");
  });

  it('the dialogs, the outcome and the refusals (`dlgView`, `edView`)', () => {
    expect(submitEffect('Natural Convection')).toBe(
      'This sends “Natural Convection” to the Academic Reviewer. It does not publish anything.',
    );
    expect(submitEffect('')).toBe(
      'This sends “this experiment” to the Academic Reviewer. It does not publish anything.',
    );
    expect(MAIN).toContain(
      "'This sends “' + name + '” to the Academic Reviewer. It does not publish anything.'",
    );
    expect(revisionSentWords(2)).toBe('Your changes are sent as revision 2.');
    expect(MAIN).toContain("'Your changes are sent as revision ' + ((r ? r.rev : 1) + 1) + '.'");
    expect(subLineWords('SUB-0087', 'Natural Convection')).toBe('SUB-0087 · Natural Convection');
    expect(MAIN).toContain("o.doneEyebrow = r.id + ' · ' + r.data.name");
    expect(MAIN).toContain("o.refEyebrow = r.id + ' · ' + r.data.name");
    expect(formatsNameWords(['WEB', 'VR'])).toBe('Formats: WEB, VR');
    expect(MAIN).toContain("o.doneFmtAria = 'Formats: ' + o.doneFmts.join(', ')");
    expect(alreadySubmittedLine('26 Aug 2026')).toBe(
      'It was submitted on 26 Aug 2026. You can’t edit it after it is submitted. If it is returned to you, you can revise it here.',
    );
    expect(MAIN).toContain(
      "'It was submitted on ' + on + '. You can’t edit it after it is submitted. If it is returned to you, you can revise it here.'",
    );
  });

  it('read-only: the head and the notice (`o.roEyebrow`, `o.roT`, `o.roD`)', () => {
    expect(readOnlyEyebrow('SUB-0083')).toBe('Experiment · SUB-0083');
    expect(MAIN).toContain("o.roEyebrow = 'Experiment · ' + r.id");
    expect(noLongerAssignedTitle('MEL ZG512')).toBe('MEL ZG512 is no longer assigned to you');
    expect(MAIN).toContain("o.roT = r.data.course + ' is no longer assigned to you'");
    expect(
      noLongerAssignedLine(
        'MEL ZG512 · Manufacturing Processes',
        'Northline Simulation Studio',
        '15 Aug 2026',
      ),
    ).toBe(
      'MEL ZG512 · Manufacturing Processes was withdrawn from Northline Simulation Studio on 15 Aug 2026. This draft is kept, read-only. BITS / WILP decides which courses are yours.',
    );
    expect(MAIN).toContain(
      "' was withdrawn from Northline Simulation Studio on ' + (r.withdrawn || '') + '. This draft is kept, read-only. BITS / WILP decides which courses are yours.'",
    );
  });

  it('the returned reason: when, who and the references (the reviewer’s own words, B6-03)', () => {
    expect(returnedWhenWords('24 Aug 2026, 09:30', 'Prof. A. Menon')).toBe(
      '24 Aug 2026, 09:30 · Prof. A. Menon',
    );
    expect(MAIN).toContain("o.retM = r.ret.when + ' · ' + r.ret.who");
    for (const [reference, phrase] of [
      [
        { step: 'formats-and-delivery', format: 'ar', field: 'device-need' },
        'Formats & delivery · AR · Device need',
      ],
      [
        { step: 'formats-and-delivery', format: 'ar', field: 'install-notes' },
        'Formats & delivery · AR · Install notes',
      ],
      [
        { step: 'course-and-description', format: null, field: 'summary' },
        'Course & description · Summary',
      ],
    ] as const) {
      expect(referenceWords(reference)).toBe(phrase);
      expect(MAIN).toContain(phrase);
    }
    for (const [reference, phrase] of [
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
    expect(MAIN).toContain("aria: 'Go to ' + x.t");
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

  it('no decision id and no sample label in the drawn words', () => {
    for (const phrase of strings([
      EDITOR,
      COURSE_STEP,
      FORMATS_STEP,
      PREVIEW_STEP,
      CHECK_STEP,
      SUBMIT_DIALOG,
      LEAVE_DIALOG,
      DONE,
      REFUSAL,
      READ_ONLY,
    ])) {
      expect(phrase).not.toMatch(/\b(?:VD|OD|PC|DEV|T)-[A-Z0-9-]+/);
      expect(phrase).not.toMatch(/sample file/i);
    }
  });
});
