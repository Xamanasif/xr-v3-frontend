/**
 * The words of RV-03 Review a submission and RV-06 its decided state are the owner-approved
 * Academic Reviewer export's (V3, design/v3-refined-b/roles/RV-v1, `RV.dc.html`): each drawn phrase
 * is found verbatim in its template or script, the composed ones with the script's own pieces; the
 * undrawn forms are entries of the state-copy register, each with its decision, no decision id and
 * no internal reference in its words.
 */
import { describe, expect, it } from 'vitest';

import { board, rvExport } from '@/test-support/boards';

import {
  andList,
  APPROVE_DIALOG,
  approveGoes,
  approveTitle,
  BUSY_WORDS,
  changedFieldWords,
  changedInRevision,
  changedTitle,
  changedValueWords,
  DECISION_WORDS,
  DONE_WORDS,
  FORMAT_TITLES,
  HISTORY_WORDS,
  IDENTITY_WORDS,
  inThisSubmissionWords,
  notIncludedWords,
  OUTCOME_WORDS,
  outcomesStand,
  PAGE_MAP,
  PATH_WORDS,
  plural,
  previousReturnBy,
  READY_WORDS,
  readyChanges,
  readyOutcomes,
  readyWhole,
  recheckByWords,
  referenceOptions,
  referencesStand,
  referenceWords,
  resubmittedNoteWords,
  REVIEW_PAGE,
  revisionFact,
} from './reviewer-review';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_REVIEWER_REVIEW } from './state-copy-reviewer-review';

const RAW = rvExport('RV.dc.html');
/** The export's text with tags removed and `&amp;` read, then its raw markup and script. */
const RV = `${RAW.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${RAW}`;
const INTERNAL_REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('RV-03 Review a submission (RV-v1 item view)', () => {
  it.each(
    strings({
      REVIEW_PAGE,
      PAGE_MAP,
      IDENTITY_WORDS,
      DECISION_WORDS,
      READY_WORDS,
      PATH_WORDS,
      APPROVE_DIALOG,
      DONE_WORDS,
      FORMAT_TITLES,
    }).filter((phrase) => !['—', ' (file)'].includes(phrase)),
  )('“%s” is in the export', (phrase) => {
    expect(RV).toContain(phrase);
  });

  it('the busy words are the product’s (B6-03’s script; the export draws no busy look)', () => {
    for (const phrase of strings(BUSY_WORDS)) {
      expect(RV).not.toContain(phrase);
      expect(board('B6-03-Review-a-Submission.dc.html')).toContain(phrase);
    }
  });

  it('no word names an internal reference', () => {
    const all = strings({
      REVIEW_PAGE,
      PAGE_MAP,
      IDENTITY_WORDS,
      DECISION_WORDS,
      READY_WORDS,
      PATH_WORDS,
      APPROVE_DIALOG,
      DONE_WORDS,
    });
    expect(all.filter((phrase) => INTERNAL_REFERENCE.test(phrase))).toEqual([]);
  });

  it('the composed identity and section words take the script’s forms', () => {
    expect(RV).toContain(
      "R.rev > 1 && R.resub ? R.rev + ' · resubmitted ' + this.short(R.resub) : String(R.rev || 1)",
    );
    expect(revisionFact(2, '26 Aug')).toBe('2 · resubmitted 26 Aug');
    expect(revisionFact(1, null)).toBe('1');
    expect(RV).toContain("chgTitle: 'What changed in revision ' + R.rev");
    expect(changedTitle(2)).toBe('What changed in revision 2');
    expect(RV).toContain(
      "'Your reason when you returned revision ' + (R.rev - 1) + ' · ' + R.prevReturn.when",
    );
    expect(previousReturnBy(1, '19 Aug 2026', null)).toBe(
      'Your reason when you returned revision 1 · 19 Aug 2026',
    );
    expect(RV).toContain("by: 'Kavya Nair, Content Manager'");
    expect(recheckByWords('Kavya Nair')).toBe('Kavya Nair, Content Manager');
    expect(RV).toContain('Not included: {{ I.fmtOut }}');
    expect(notIncludedWords(['AR', 'MR'])).toBe('Not included: AR, MR');
    expect(RV).toContain("fmtInAria: 'In this submission: ' + this.andList(R.fmts || [])");
    expect(inThisSubmissionWords(['WEB', 'VR'])).toBe('In this submission: WEB and VR');
    expect(andList(['WEB', 'AR', 'VR'])).toBe('WEB, AR and VR');
    expect(RV).toContain('Changed in revision {{ I.rev }}');
    expect(changedInRevision(2)).toBe('Changed in revision 2');
  });

  it('a “What changed” row names the step, the format and the field as the references do', () => {
    expect(changedFieldWords('vr:device-need')).toBe('Formats & delivery · VR · Device need');
    expect(RV).toContain(changedFieldWords('vr:device-need'));
    expect(changedFieldWords('description')).toBe('Course & description · Description');
    expect(changedFieldWords('web:web-link')).toBe('Formats & delivery · WEB · Web link');
    expect(changedFieldWords('preview-link')).toBe('Preview & documents · Preview link');
    // Fields no reference names take the editor’s labels (state-copy `RV-03.what-changed-fields`).
    expect(changedFieldWords('name')).toBe('Course & description · Experiment name');
    expect(changedFieldWords('vr:package')).toBe('Formats & delivery · VR · Package reference');
    expect(changedFieldWords('documents')).toBe('Preview & documents · Documents');
    expect(changedValueWords('  ')).toBe('None');
    expect(changedValueWords('VR headset')).toBe('VR headset');
  });

  it('the outcome editor’s words are the export’s template and script', () => {
    expect(RV).toContain('aria-label="Move outcome {{ o.n }} up"');
    expect(RV).toContain('aria-label="Move outcome {{ o.n }} down"');
    expect(RV).toContain('aria-label="Edit outcome {{ o.n }}"');
    expect(RV).toContain('aria-label="Delete outcome {{ o.n }}"');
    expect(RV).toContain('>Outcome {{ o.n }}</label>');
    expect(RV).toContain("'Outcome ' + (i + 1) + ' moved up — it is now outcome ' + i + '.'");
    expect(RV).toContain("msg: 'Outcome ' + (i + 1) + ' deleted.'");
    expect(RV).toContain("msg: 'Outcome ' + (i + 1) + ' saved.'");
    expect(RV).toContain(
      "msg: 'Outcome added — ' + this.plural(lo.length + 1, 'outcome') + ' in the list.'",
    );
    expect(RV).toContain("msg: 'Outcome ' + (u.i + 1) + ' restored.'");
    expect(OUTCOME_WORDS.up(2)).toBe('Move outcome 2 up');
    expect(OUTCOME_WORDS.moved(2, true, 1)).toBe('Outcome 2 moved up — it is now outcome 1.');
    expect(OUTCOME_WORDS.moved(2, false, 3)).toBe('Outcome 2 moved down — it is now outcome 3.');
    expect(OUTCOME_WORDS.added(1)).toBe('Outcome added — 1 outcome in the list.');
    expect(OUTCOME_WORDS.added(3)).toBe('Outcome added — 3 outcomes in the list.');
    expect(plural(1, 'learning outcome')).toBe('1 learning outcome');
    for (const phrase of strings(OUTCOME_WORDS)) expect(RV).toContain(phrase);
  });

  it('the readiness, the confirmation and the path take the script’s forms', () => {
    expect(RV).toContain("t: this.plural(lo.length, 'learning outcome') + '.'");
    expect(readyOutcomes(3)).toBe('3 learning outcomes.');
    expect(RV).toContain(
      "d: 'You decide for every format together: ' + this.andList(R.fmts) + '.'",
    );
    expect(readyWhole(['WEB', 'VR'])).toBe('You decide for every format together: WEB and VR.');
    expect(RV).toContain("t: this.plural(R.changes.length, 'change') + ' since you returned it.'");
    expect(readyChanges(1)).toBe('1 change since you returned it.');
    expect(RV).toContain(
      "dlgTitle: upd ? 'Approve the update to ' + R.name + '?' : 'Approve “' + R.name + '”?'",
    );
    expect(approveTitle('Conduction Through a Composite Wall')).toBe(
      'Approve “Conduction Through a Composite Wall”?',
    );
    expect(RV).toContain(
      "(recheck ? 'It goes back to the Content Manager with its ' : 'It goes to the Content Manager with its ') + this.plural(nlo, 'learning outcome') + '.'",
    );
    expect(approveGoes(3, false)).toBe(
      'It goes to the Content Manager with its 3 learning outcomes.',
    );
    expect(approveGoes(1, true)).toBe(
      'It goes back to the Content Manager with its 1 learning outcome.',
    );
  });

  it('the references are the export’s, for the formats the submission has, grouped by section', () => {
    expect(RV).toContain(
      "{ k: 'VR_device', fmt: 'VR', g: 'Formats & delivery · VR ·', f: 'Device need' }",
    );
    const all = referenceOptions(['web', 'ar', 'vr', 'mr'], true);
    for (const option of all) {
      expect(RV).toContain(`g: '${option.group} ·', f: '${option.field}'`);
    }
    expect(referenceOptions(['web', 'vr'], true).map((option) => option.words)).toEqual([
      'Course & description · Summary',
      'Course & description · Description',
      'Formats & delivery · WEB · Web link',
      'Formats & delivery · WEB · Browser and computer',
      'Formats & delivery · VR · Package',
      'Formats & delivery · VR · Device need',
      'Formats & delivery · VR · Install notes',
      'Preview & documents · Preview link',
    ]);
    // The preview link is offered only when there is one (`r.k !== 'preview' || R.preview`).
    expect(RV).toContain("filter(r => r.k !== 'preview' || R.preview)");
    expect(referenceOptions(['web'], false).map((option) => option.key)).toEqual([
      'summary',
      'description',
      'web:web-link',
      'web:browser-and-computer',
    ]);
    expect(referenceOptions(['web', 'vr'], true)[5]).toMatchObject({
      group: 'Formats & delivery · VR',
      field: 'Device need',
      reference: { step: 'formats-and-delivery', format: 'vr', field: 'device-need' },
    });
    expect(
      referenceWords({ step: 'formats-and-delivery', format: 'vr', field: 'install-notes' }),
    ).toBe('Formats & delivery · VR · Install notes');
  });
});

describe('RV-06 decided and the review history', () => {
  it('the outcome’s composed words take the script’s forms', () => {
    expect(RV).toContain("this.plural(n, 'outcome') + (isPast ? '' : ', sent with your decision')");
    expect(outcomesStand(3, false)).toBe('3 outcomes');
    expect(outcomesStand(1, true)).toBe('1 outcome, sent with your decision');
    expect(RV).toContain(
      "src.refs && src.refs.length ? this.plural(src.refs.length, 'field') : 'None'",
    );
    expect(referencesStand(2)).toBe('2 fields');
    expect(referencesStand(0)).toBe('None');
  });

  it('the history’s words are the export’s, with its sample values', () => {
    expect(RV).toContain(HISTORY_WORDS.submitted);
    expect(RV).toContain(HISTORY_WORDS.submittedNote('Northline Simulation Studio'));
    expect(RV).toContain(HISTORY_WORDS.resubmitted(2));
    expect(RV).toContain(HISTORY_WORDS.returned('Prof. A. Menon'));
    expect(RV).toContain(HISTORY_WORDS.approved('Prof. A. Menon'));
    expect(RV).toContain(HISTORY_WORDS.approvedNote(2));
    expect(RV).toContain(HISTORY_WORDS.recheck('Kavya Nair'));
    expect(RV).toContain(HISTORY_WORDS.published('the Content Manager'));
  });

  it('the resubmission’s note: what changed (the export’s sample), else the revision’s line', () => {
    expect(resubmittedNoteWords('Northline Simulation Studio', 2, ['vr:device-need'])).toBe(
      'Northline Simulation Studio changed the VR device need.',
    );
    expect(RV).toContain('Northline Simulation Studio changed the VR device need.');
    expect(
      resubmittedNoteWords('Northline Simulation Studio', 2, [
        'summary',
        'description',
        'vr:device-need',
      ]),
    ).toBe('Northline Simulation Studio changed the summary, description and VR device need.');
    expect(resubmittedNoteWords('Northline Simulation Studio', 3, null)).toBe(
      'Revision 3 · from Northline Simulation Studio',
    );
  });
});

describe('the state-copy entries of RV-03 and RV-06', () => {
  it.each(Object.entries(STATE_COPY_REVIEWER_REVIEW))(
    '%s is registered, with its decision, and names no decision or internal reference in its words',
    (id, entry) => {
      expect(id).toMatch(/^RV-0[36]\./);
      expect(entry.screen).toBe(id.slice(0, 5));
      expect(entry.status).toBe('provisional');
      expect('decisions' in entry && entry.decisions.length).toBeGreaterThan(0);
      if (entry.words !== null) {
        expect(entry.words).not.toMatch(/\b(?:OD|T|PC|DEV|VD|ATT|M|DV|LD)-?\d/);
        expect(entry.words).not.toMatch(INTERNAL_REFERENCE);
        // The heading and the failed line are borrowed as they are: the export's screen title and
        // its lists' failed state (RV02-failed) — RV-v1 draws no failed item page.
        if (id !== 'RV-03.heading' && id !== 'RV-03.failed.line') {
          // Undrawn words are not in the export as they are (the drawn ones are in `reviewer-review.ts`).
          expect(RV).not.toContain(entry.words);
        }
      }
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
    },
  );
});
