/**
 * The words more than one Faculty screen group draws are the owner-approved export's (V3 Refined B,
 * design/v3-refined-b/roles/FA-v1 `project/Main.dc.html`): each drawn phrase is in its markup or
 * script verbatim, and each composed line takes the script's form with sample values. The words
 * settled from two groups' modules are the same objects there and here. No line carries an
 * internal reference.
 */
import { describe, expect, it } from 'vitest';

import { faExport } from '@/test-support/boards';

import { READINESS_WORDS } from './assessment-words';
import {
  activityByFormatLabel,
  asOfWords,
  assessmentName,
  FA_ASSESSMENT_STATE_WORDS,
  FA_DEADLINE_WORDS,
  FA_EXPORT_WORDS,
  FA_FILTER_WORDS,
  FA_GUIDANCE_LABEL,
  FA_PROGRESS_WORDS,
  FA_SHOW_WORDS,
  FA_STEP_STATE_WORDS,
  FACULTY_FAILED_WORDS,
  faDaysLeftWords,
  faPlural,
  formatsHeldLabel,
  QUESTION_SOURCE_WORDS,
  removeFilterLabel,
  STUDENTS_WITH_ACCESS,
  UNTITLED_DRAFT,
  waitingForMarkingWords,
  writtenAnswersWaitingWords,
} from './fa-shared';
import { FACULTY_FAILED_WORDS as OVERVIEW_FAILED_WORDS } from './faculty-overview';
import { BANK_TOOLS } from './question-tools';

const MAIN = faExport('Main.dc.html');
/** The markup with its tags removed and `&amp;` read, then the raw source (attributes, script). */
const WORDS = `${MAIN.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&')}\n${MAIN}`;
const SCRIPT = MAIN.slice(MAIN.indexOf('<script type="text/x-dc"'));
const INTERNAL_REFERENCE = /\b(?:ASMT|ATT|Q|D|SUB|UPD|REQ|ACC|DTR|SUP)-\d+/;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('the settled cross-group words (moved, unchanged)', () => {
  it('are the same objects in their old modules', () => {
    expect(OVERVIEW_FAILED_WORDS).toBe(FACULTY_FAILED_WORDS);
    expect(BANK_TOOLS.draftWithAssistance).toBe(QUESTION_SOURCE_WORDS.draftWithAssistance);
    expect(BANK_TOOLS.import).toBe(QUESTION_SOURCE_WORDS.import);
  });

  it.each(strings({ FACULTY_FAILED_WORDS, QUESTION_SOURCE_WORDS }))(
    '“%s” is the export’s',
    (phrase) => {
      expect(WORDS).toContain(phrase);
    },
  );
});

describe('the V3 words more than one group draws', () => {
  const drawn = {
    FA_PROGRESS_WORDS,
    STUDENTS_WITH_ACCESS,
    FA_ASSESSMENT_STATE_WORDS,
    FA_DEADLINE_WORDS,
    FA_FILTER_WORDS,
    FA_GUIDANCE_LABEL,
    FA_EXPORT_WORDS,
    UNTITLED_DRAFT,
  };

  it.each(strings(drawn))('“%s” is in the export’s markup or script', (phrase) => {
    expect(WORDS).toContain(phrase);
  });

  it('the progress counts are the meter rows’ words', () => {
    expect(MAIN).toContain(
      `<p class="fa-prog-t"><span><b>{{ f.done }}</b> ${FA_PROGRESS_WORDS.completed}</span><span><b>{{ f.prog }}</b> ${FA_PROGRESS_WORDS.inProgress}</span><span><b>{{ f.none }}</b> ${FA_PROGRESS_WORDS.notStarted}</span></p>`,
    );
  });

  it('the step states are the script’s `sr`', () => {
    expect(SCRIPT).toContain(
      `sr: c.step > i ? '${FA_STEP_STATE_WORDS.done}' : c.step === i ? '${FA_STEP_STATE_WORDS.current}' : '${FA_STEP_STATE_WORDS.todo}'`,
    );
  });

  it('the list filters by state are FA-12’s and FA-18’s segments', () => {
    expect(MAIN).toContain(
      `<div class="fa-seg fa-seg--bar" role="group" aria-label="${FA_SHOW_WORDS.label}">`,
    );
    expect(MAIN).toContain(
      `<span>${FA_SHOW_WORDS.waiting}<span class="fa-seg-long">${FA_SHOW_WORDS.waitingLong}</span></span>`,
    );
    expect(MAIN).toContain(`${FA_SHOW_WORDS.all}<b aria-hidden="true">{{ SB.nAll }}</b>`);
    expect(MAIN).toContain(`${FA_SHOW_WORDS.marked}<b aria-hidden="true">{{ MQ.nDone }}</b>`);
  });

  it('the readiness words are the shared labels the export draws', () => {
    expect(SCRIPT).toContain(`label: '${READINESS_WORDS.ready.label}'`);
    expect(SCRIPT).toContain(`label: '${READINESS_WORDS['draft-not-ready'].label}'`);
  });
});

describe('the composed lines take the script’s forms', () => {
  it('plural, days left, the waiting lines', () => {
    expect(faPlural(1, 'student')).toBe('1 student');
    expect(faPlural(2, 'student has', 'students have')).toBe('2 students have');
    expect(faDaysLeftWords(7)).toBe('7 days left');
    expect(faDaysLeftWords(1)).toBe('1 day left');
    expect(faDaysLeftWords(0)).toBe('Due today');
    expect(faDaysLeftWords(0, 'short')).toBe('today');
    expect(SCRIPT).toContain("days === 0 ? 'Due today' : this.plural(days, 'day') + ' left'");
    expect(writtenAnswersWaitingWords(1)).toBe('1 written answer waiting for marking');
    expect(writtenAnswersWaitingWords(2)).toBe('2 written answers waiting for marking');
    expect(SCRIPT).toContain("this.plural(w, 'written answer') + ' waiting for marking'");
    expect(waitingForMarkingWords(2)).toBe('2 waiting for marking');
    expect(SCRIPT).toContain("wait: w + ' waiting for marking'");
  });

  it('the names of lists, badges and chips', () => {
    expect(activityByFormatLabel('Venturi Meter', '7 Nov 2026')).toBe(
      'Student activity by format for Venturi Meter, as of 7 Nov 2026',
    );
    expect(SCRIPT).toContain(
      "progAria: 'Student activity by format for ' + e.t + ', as of ' + W.clock.day",
    );
    expect(activityByFormatLabel('Venturi Meter')).toBe(
      'Student activity by format for Venturi Meter',
    );
    expect(SCRIPT).toContain("actAria: 'Student activity by format for ' + e.t,");
    expect(asOfWords('7 Nov 2026')).toBe('As of 7 Nov 2026');
    expect(SCRIPT).toContain("asOf: 'As of ' + W.clock.day");
    expect(formatsHeldLabel(['WEB', 'VR'])).toBe('Formats your institution has: WEB, VR');
    expect(SCRIPT).toContain("fmAria: 'Formats your institution has: ' + e.held.join(', ')");
    expect(removeFilterLabel({ label: 'Format: VR' })).toBe('Remove filter Format: VR');
    expect(SCRIPT).toContain("c.aria = 'Remove filter ' + c.label;");
  });

  it('an assessment is named by its name, or “Untitled draft” — never by its id', () => {
    expect(assessmentName('Heat Exchanger — post-lab')).toBe('Heat Exchanger — post-lab');
    expect(assessmentName('')).toBe('Untitled draft');
    expect(assessmentName('  ')).toBe('Untitled draft');
    expect(assessmentName(null)).toBe('Untitled draft');
    expect(SCRIPT).toContain("a.name || 'Untitled draft'");
  });

  it('no word names a record by its internal reference', () => {
    const all = [
      ...strings({
        FACULTY_FAILED_WORDS,
        QUESTION_SOURCE_WORDS,
        FA_PROGRESS_WORDS,
        FA_ASSESSMENT_STATE_WORDS,
        FA_DEADLINE_WORDS,
        FA_FILTER_WORDS,
        FA_GUIDANCE_LABEL,
        FA_EXPORT_WORDS,
        FA_SHOW_WORDS,
        FA_STEP_STATE_WORDS,
        STUDENTS_WITH_ACCESS,
        UNTITLED_DRAFT,
      }),
      assessmentName(''),
      activityByFormatLabel('Venturi Meter', '7 Nov 2026'),
      removeFilterLabel({ label: 'Format: VR' }),
    ];
    for (const phrase of all) expect(phrase).not.toMatch(INTERNAL_REFERENCE);
  });
});
