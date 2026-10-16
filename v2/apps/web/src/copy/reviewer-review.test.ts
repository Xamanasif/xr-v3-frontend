/**
 * The words of RV-03 Review a submission and RV-06 its decided state (B6-03, B6-11, B6-12) are the
 * frozen boards’: each drawn phrase is found verbatim in its board’s markup or script, the composed
 * ones with the boards’ own sample values (or, where the board composes them in its script, the
 * script’s own pieces); the two sentences with decision ids are shown without them and keep their
 * frozen wording; the undrawn forms are entries of the state-copy register, each with its decision
 * and no decision id in its words.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  approveEffect,
  approveTitle,
  changedFieldWords,
  changedTitle,
  changedValueWords,
  courseWords,
  DECIDED_WORDS,
  DECISION_WORDS,
  decidedWhenWords,
  headerMetaWords,
  HISTORY_WORDS,
  OUTCOME_WORDS,
  overlineWords,
  plural,
  previousReturnWords,
  publishedNextWords,
  quoted,
  recheckWhenWords,
  referenceOptions,
  resubmittedNoteWords,
  REVIEW_PAGE,
  STRIPPED_REVIEW,
} from './reviewer-review';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_REVIEWER_REVIEW } from './state-copy-reviewer-review';

/** A board’s text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B6_03 = words('B6-03-Review-a-Submission.dc.html');
const B6_11 = words('B6-11-Critical-States.dc.html');
const B6_12 = words('B6-12-Flow-5-Completion.dc.html');
const B5_EDITOR = [
  words('B5-03-Create-Course-and-Description.dc.html'),
  words('B5-04-Formats-and-Delivery.dc.html'),
  words('B5-05-Preview-Check-and-Submit.dc.html'),
].join('\n');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('RV-03 Review a submission (B6-03 f0 … f5)', () => {
  it.each(strings(REVIEW_PAGE).filter((phrase) => phrase.trim() !== ''))(
    '“%s” is on B6-03',
    (phrase) => {
      expect(B6_03).toContain(phrase);
    },
  );

  it.each(strings(DECISION_WORDS))('“%s” is on B6-03', (phrase) => {
    expect(B6_03).toContain(phrase);
  });

  it('the decision words are B6-11’s and B6-12’s too', () => {
    for (const phrase of [
      DECISION_WORDS.panelTitle,
      DECISION_WORDS.approve.sub,
      DECISION_WORDS.return.sub,
      DECISION_WORDS.wholeExperiment,
      DECISION_WORDS.returnTitle,
      DECISION_WORDS.returnEffect,
      DECISION_WORDS.reasonLabel,
      DECISION_WORDS.refsHint,
    ]) {
      expect(B6_11).toContain(phrase);
    }
    expect(B6_12).toContain(DECISION_WORDS.approve.sub);
  });

  it('the two sentences with decision ids are shown without them, as drawn otherwise', () => {
    for (const entry of Object.values(STRIPPED_REVIEW)) {
      expect(B6_03).toContain(entry.drawn);
      expect(entry.words).not.toMatch(/T-\d{2}/);
      expect(entry.drawn).toContain(entry.ids[0]);
    }
    expect(STRIPPED_REVIEW.packageTitle.words).toBe('App package (provisional)');
    expect(STRIPPED_REVIEW.deliveryOnly.drawn.replace(' (T-30)', '')).toBe(
      STRIPPED_REVIEW.deliveryOnly.words,
    );
  });

  it('the composed header and section words are B6-03’s, with its sample values', () => {
    expect(overlineWords('SUB-0077', false)).toBe('SUB-0077 · New submission');
    expect(overlineWords('SUB-0071', true)).toBe('SUB-0071 · Re-check');
    expect(B6_03).toContain("(st === 'recheck' ? 'Re-check' : 'New submission')");
    expect(
      headerMetaWords(
        'Northline Simulation Studio',
        courseWords('ME ZG523', 'Thermodynamics & Heat Transfer'),
      ),
    ).toBe('Northline Simulation Studio · ME ZG523 · Thermodynamics & Heat Transfer');
    expect(B6_03).toContain("o.rvMeta = s.ven + ' · ' + s.course + ' · ' + o.cname");
    expect(B6_03).toContain("s.recheck.when + ' · ' + s.recheck.who");
    expect(recheckWhenWords('25 Aug 2026, 10:42', 'Kavya Nair')).toBe(
      '25 Aug 2026, 10:42 · Kavya Nair',
    );
    expect(B6_03).toContain("o.chgTitle = 'What changed in revision ' + s.rev");
    expect(changedTitle(2)).toBe('What changed in revision 2');
    expect(B6_03).toContain(
      "'You returned revision ' + (s.rev - 1) + ' on ' + s.prevRet.when + ': “' + s.prevRet.reason + '”'",
    );
    expect(
      previousReturnWords(1, '19 Aug', 'Please clarify the VR device requirements.', null),
    ).toBe('You returned revision 1 on 19 Aug: “Please clarify the VR device requirements.”');
  });

  it('a “What changed” row names the step, the format and the field as the references do', () => {
    expect(changedFieldWords('vr:device-need')).toBe('Formats & delivery · VR · Device need');
    expect(B6_03).toContain(changedFieldWords('vr:device-need'));
    expect(changedFieldWords('description')).toBe('Course & description · Description');
    expect(changedFieldWords('web:web-link')).toBe('Formats & delivery · WEB · Web link');
    expect(changedFieldWords('preview-link')).toBe('Preview & documents · Preview link');
    // Fields no reference names take the editor’s labels (state-copy `RV-03.what-changed-fields`).
    expect(changedFieldWords('name')).toBe('Course & description · Experiment name');
    expect(changedFieldWords('vr:package')).toBe('Formats & delivery · VR · Package reference');
    expect(changedFieldWords('documents')).toBe('Preview & documents · Documents');
    for (const label of ['Experiment name', 'Version', 'Package label', 'Package reference']) {
      expect(B5_EDITOR).toContain(label);
    }
    expect(changedValueWords('  ')).toBe('None');
    expect(changedValueWords('VR headset')).toBe('VR headset');
  });

  it('the outcome editor’s words are B6-03’s script’s', () => {
    expect(B6_03).toContain("'Move outcome ' + (i + 1) + ' up'");
    expect(B6_03).toContain("'Move outcome ' + (i + 1) + ' down'");
    expect(B6_03).toContain("'Edit outcome ' + (i + 1)");
    expect(B6_03).toContain("'Delete outcome ' + (i + 1)");
    expect(B6_03).toContain("edLabel: 'Outcome ' + (i + 1)");
    expect(B6_03).toContain(
      "'Outcome ' + (i + 1) + ' moved ' + (d < 0 ? 'up' : 'down') + ' — it is now outcome ' + (j + 1) + '.'",
    );
    expect(B6_03).toContain("g_loMsg: 'Outcome ' + (i + 1) + ' deleted.'");
    expect(B6_03).toContain("g_loMsg: 'Outcome ' + (i + 1) + ' saved.'");
    expect(B6_03).toContain(
      "g_loMsg: 'Outcome added — ' + plural(c.g_lo.length + 1, 'outcome') + ' in the list.'",
    );
    expect(B6_03).toContain("g_loMsg: 'Outcome ' + (u.i + 1) + ' restored.'");
    expect(OUTCOME_WORDS.upLabel(2)).toBe('Move outcome 2 up');
    expect(OUTCOME_WORDS.moved(2, true, 1)).toBe('Outcome 2 moved up — it is now outcome 1.');
    expect(OUTCOME_WORDS.added(1)).toBe('Outcome added — 1 outcome in the list.');
    expect(OUTCOME_WORDS.added(3)).toBe('Outcome added — 3 outcomes in the list.');
    expect(B6_03).toContain(`aria-label="${OUTCOME_WORDS.listLabel}"`);
    expect(plural(1, 'learning outcome')).toBe('1 learning outcome');
  });

  it('DL-1 is B6-11 f0’s, with its sample values', () => {
    // Composed in the script (`aTitle`, `aBody`) from the name and the outcome count.
    expect(B6_11).toContain("'Approve “' + o.name + '”?'");
    expect(B6_11).toContain(
      "'It goes to the Content Manager with its ' + plural(s.g_lo.length, 'learning outcome') + '. Approving does not publish it.'",
    );
    expect(approveTitle('Conduction Through a Composite Wall')).toBe(
      'Approve “Conduction Through a Composite Wall”?',
    );
    expect(approveEffect(3)).toBe(
      'It goes to the Content Manager with its 3 learning outcomes. Approving does not publish it.',
    );
    expect(approveEffect(1)).toBe(
      'It goes to the Content Manager with its 1 learning outcome. Approving does not publish it.',
    );
  });

  it('the references are B6-03’s, for the formats the submission has, in its order', () => {
    const all = referenceOptions(['web', 'ar', 'vr', 'mr']);
    for (const option of all) expect(B6_03).toContain(`"t": "${option.words}"`);
    expect(referenceOptions(['web', 'vr']).map((option) => option.words)).toEqual([
      'Course & description · Summary',
      'Course & description · Description',
      'Formats & delivery · WEB · Web link',
      'Formats & delivery · WEB · Browser and computer',
      'Formats & delivery · VR · Package',
      'Formats & delivery · VR · Device need',
      'Formats & delivery · VR · Install notes',
      'Preview & documents · Preview link',
    ]);
    // B6-11 f1 lists the same eight for SUB-0077 (WEB, VR).
    for (const option of referenceOptions(['web', 'vr'])) expect(B6_11).toContain(option.words);
    expect(referenceOptions(['web', 'vr'])[5]).toMatchObject({
      step: 'formats-and-delivery',
      format: 'vr',
      field: 'device-need',
    });
  });
});

describe('RV-06 decided and the review history (B6-03 f4, script)', () => {
  it.each(strings(DECIDED_WORDS))('“%s” is on B6-03', (phrase) => {
    expect(B6_03).toContain(phrase);
  });

  it('the composed decided and history words are B6-03’s, with its sample values or its script’s pieces', () => {
    expect(B6_03).toContain("dec.when + ' · ' + D.rv");
    expect(decidedWhenWords('14 Aug 2026, 15:10', 'Prof. A. Menon')).toBe(
      '14 Aug 2026, 15:10 · Prof. A. Menon',
    );
    expect(B6_03).toContain("'The Content Manager published it on ' + s.pub + '.'");
    expect(publishedNextWords('29 Aug 2026')).toBe(
      'The Content Manager published it on 29 Aug 2026.',
    );
    expect(B6_03).toContain(quoted('Please clarify the VR device requirements.'));
    expect(B6_03).toContain(HISTORY_WORDS.submitted);
    expect(B6_03).toContain(HISTORY_WORDS.submittedNote('Northline Simulation Studio'));
    expect(B6_03).toContain(HISTORY_WORDS.resubmitted(2));
    expect(B6_03).toContain(HISTORY_WORDS.returned('Prof. A. Menon'));
    expect(B6_03).toContain(HISTORY_WORDS.approved('Prof. A. Menon'));
    expect(B6_03).toContain(HISTORY_WORDS.approvedNote(2));
    expect(B6_03).toContain(HISTORY_WORDS.recheck('Kavya Nair'));
    expect(B6_03).toContain("'Sent back to the vendor by ' + D.cm");
    expect(B6_03).toContain("'Published by ' + D.cm");
    expect(B6_03).toContain(
      "'In the public catalogue under ' + c.course + ' with ' + chosen.join(' and ') + '. No one was given access.'",
    );
    expect(HISTORY_WORDS.publishedNote('ME ZG523', ['WEB', 'VR'])).toBe(
      'In the public catalogue under ME ZG523 with WEB and VR. No one was given access.',
    );
  });

  it('the resubmission’s note: what changed (the board’s sample), else the revision’s line', () => {
    expect(resubmittedNoteWords('Northline Simulation Studio', 2, ['vr:device-need'])).toBe(
      'Northline Simulation Studio changed the VR device need.',
    );
    expect(B6_03).toContain('Northline Simulation Studio changed the VR device need.');
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
    '%s is registered, with its decision, and names no decision in its words',
    (id, entry) => {
      expect(id).toMatch(/^RV-0[36]\./);
      expect(entry.screen).toBe(id.slice(0, 5));
      // Every entry is provisional: the one borrowed line, “Nothing has changed. Try again.”, is
      // B6-02 f3’s (the queue’s failed state), not B6-03’s.
      expect(entry.status).toBe('provisional');
      expect('decisions' in entry && entry.decisions.length).toBeGreaterThan(0);
      if (id === 'RV-03.failed.line')
        expect(words('B6-02-Review-Queue-and-Reviewed.dc.html')).toContain(entry.words);
      if (entry.words !== null) {
        expect(entry.words).not.toMatch(/\b(?:OD|T|PC|DEV|VD|ATT|M|DV|LD)-?\d/);
        if (id !== 'RV-03.heading' && id !== 'RV-03.failed.line') {
          // Undrawn words are not on the board as they are (the drawn ones are in `reviewer-review.ts`).
          expect(B6_03).not.toContain(entry.words);
        }
      }
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
    },
  );
});
