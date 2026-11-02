/**
 * The Student's shared V3 words are the owner-approved export's own (ST-v1
 * `StudentFinal.dc.html`: its template and the script that fills it), and none names a record by
 * its internal reference (lead decision 3).
 */
import { describe, expect, it } from 'vitest';

import { stExport } from '@/test-support/boards';

import {
  keepTogether,
  NO_LICENCE_FOR_YOU,
  NO_LICENCE_TELL_MORE,
  notRightNowWords,
  openExperimentName,
  progressCaption,
  ST_ACCESS_WORDS,
  ST_ACTION_WORDS,
  ST_FACT_WORDS,
  ST_FORMAT_NAMES,
  ST_HOLD_WORDS,
  ST_LABELS,
  ST_OFF_WORDS,
  ST_OPEN_EXPERIMENT,
  ST_PROGRESS_COLUMNS,
  ST_PROGRESS_WORDS,
  ST_STATE_WORDS,
  stDateTime,
  stDay,
} from './st-shared';

/** Text as it reads: the export's no-break spaces that keep a date on one line (`nbd`) read as
 * spaces. */
const plain = <T extends string | null | undefined>(text: T): T =>
  (text == null ? text : text.replace(/\u00a0/g, ' ')) as T;

const MAIN = stExport('StudentFinal.dc.html');
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));
const SCRIPT = MAIN.slice(MAIN.indexOf('<script type="text/x-dc"'));
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT)-\d+/;

/** The template writes `&amp;` and the runtime's text holes; compare on the decoded text. */
const DRAWN = `${TEMPLATE.replace(/&amp;/g, '&')}\n${SCRIPT}`;

function expectDrawn(words: string) {
  expect(DRAWN.includes(words), `drawn in the export: ${words}`).toBe(true);
}

describe('the format chip’s words (`avail`, `offFormats`, `Component.FN`)', () => {
  it('names each format as the export does', () => {
    expect(SCRIPT).toContain(
      "static get FN() { return { WEB: 'Browser', AR: 'Augmented reality', VR: 'Virtual reality', MR: 'Mixed reality' }; }",
    );
    expect(ST_FORMAT_NAMES).toEqual({
      WEB: 'Browser',
      AR: 'Augmented reality',
      VR: 'Virtual reality',
      MR: 'Mixed reality',
    });
  });

  it('every access word and reason is the script’s', () => {
    for (const words of Object.values(ST_ACCESS_WORDS)) expect(SCRIPT).toContain(`'${words}'`);
    expect(SCRIPT).toContain(`'${ST_OFF_WORDS.notIncluded}'`);
    expect(SCRIPT).toContain(`'${ST_OFF_WORDS.notPublished}'`);
    expectDrawn(`>${ST_OFF_WORDS.title}<`);
  });
});

describe('the holds (`holdReason`, `progExp`)', () => {
  it('the licence wait names no plan (the export drops the plan from what it renders)', () => {
    expect(SCRIPT).toContain(`'${NO_LICENCE_FOR_YOU}'`);
    expect(SCRIPT).toContain(`'${NO_LICENCE_TELL_MORE}'`);
    expect(NO_LICENCE_FOR_YOU).not.toMatch(REFERENCE);
    expect(ST_HOLD_WORDS.waiting).toBe(NO_LICENCE_TELL_MORE);
    expect(SCRIPT).toContain(`return '${ST_HOLD_WORDS.paused}'`);
  });

  it('“not right now” is the script’s sentence for its sample (VR held, WEB opens)', () => {
    expect(SCRIPT).toContain(`return '${notRightNowWords('VR', 'WEB')}'`);
    expect(notRightNowWords('VR', null)).toBe('VR can’t be used at the moment.');
  });
});

describe('the per-format progress (`progExp`, `runWord`)', () => {
  it('the table’s heads and caption', () => {
    const head = TEMPLATE.slice(TEMPLATE.indexOf('<table class="sv-ptable">'));
    for (const words of [
      ST_PROGRESS_COLUMNS.format,
      ST_PROGRESS_COLUMNS.progress,
      ST_PROGRESS_COLUMNS.details,
    ]) {
      expect(head).toContain(`<th scope="col">${words}</th>`);
    }
    expect(head).toContain(`<span class="xr-sr">${ST_PROGRESS_COLUMNS.action}</span>`);
    expect(SCRIPT).toContain("capt: 'Your formats for ' + E.t + ': progress and actions'");
    expect(progressCaption('Shell-and-Tube Heat Exchanger')).toBe(
      'Your formats for Shell-and-Tube Heat Exchanger: progress and actions',
    );
  });

  it('the pill’s words and the dated facts take the script’s forms', () => {
    expect(SCRIPT).toContain("['xr-st xr-st--ok', 'Completed ' + this.dOnly(r.done)]");
    expect(SCRIPT).toContain("['xr-st xr-st--warn', 'In progress']");
    expect(SCRIPT).toContain("['xr-st', 'Not started']");
    expect(plain(ST_PROGRESS_WORDS.completed('2026-10-14T10:00:00.000Z'))).toBe(
      'Completed 14 Oct 2026',
    );
    expect(ST_PROGRESS_WORDS.inProgress).toBe('In progress');
    expect(ST_PROGRESS_WORDS.notStarted).toBe('Not started');

    for (const fixed of [ST_FACT_WORDS.webNotOpened, ST_FACT_WORDS.noSession('vr')]) {
      expect(SCRIPT).toContain(`facts.push('${fixed}')`);
    }
    for (const prefix of [
      "'First opened '",
      "'Last saved '",
      "'Reported by the simulation at '",
      "'First session reported '",
      "'Last session reported '",
      "'Reported from the headset at '",
      "'Feedback sent '",
    ]) {
      expect(SCRIPT).toContain(prefix);
    }
    const at = '2026-10-14T10:00:00.000Z'; // 15:30 IST
    expect(plain(ST_FACT_WORDS.firstOpened(at))).toBe('First opened 14 Oct 2026, 15:30');
    expect(plain(ST_FACT_WORDS.lastSaved(at))).toBe('Last saved 14 Oct 2026, 15:30');
    expect(ST_FACT_WORDS.reportedBySimulation(at)).toBe('Reported by the simulation at 15:30');
    expect(plain(ST_FACT_WORDS.firstSession(at))).toBe('First session reported 14 Oct 2026, 15:30');
    expect(plain(ST_FACT_WORDS.lastSession(at))).toBe('Last session reported 14 Oct 2026, 15:30');
    expect(ST_FACT_WORDS.reportedFromHeadset(at)).toBe('Reported from the headset at 15:30');
    // UX-02: AR runs in the phone app, not on a headset; VR and MR keep the export's words.
    expect(ST_FACT_WORDS.noSession('ar')).toBe('No AR app activity reported yet');
    expect(ST_FACT_WORDS.noSession('mr')).toBe('No headset session reported yet');
    expect(ST_FACT_WORDS.reportedFromHeadset(at, 'ar')).toBe('Reported from the AR app at 15:30');
    expect(plain(ST_FACT_WORDS.feedbackSent(at))).toBe('Feedback sent 14 Oct 2026');
  });

  it('the actions and their fuller names', () => {
    expect(SCRIPT).toContain("label: 'Continue ' + f");
    expect(SCRIPT).toContain("label: 'Open ' + f");
    expect(SCRIPT).toContain("label: 'Give feedback on ' + f");
    expect(SCRIPT).toContain("x.aria = x.label + ', ' + E.t;");
    expect(ST_ACTION_WORDS.continue('WEB')).toBe('Continue WEB');
    expect(ST_ACTION_WORDS.open('VR')).toBe('Open VR');
    expect(ST_ACTION_WORDS.feedback('WEB')).toBe('Give feedback on WEB');
    expect(ST_ACTION_WORDS.named('Continue WEB', 'Shell-and-Tube Heat Exchanger')).toBe(
      'Continue WEB, Shell-and-Tube Heat Exchanger',
    );
    expectDrawn(`>${ST_OPEN_EXPERIMENT}<`);
    expect(SCRIPT).toContain("aria: 'Open experiment ' + E.t");
    expect(openExperimentName('X')).toBe('Open experiment X');
  });
});

describe('dates kept on one line (`nbd`)', () => {
  it('every space of a date becomes a no-break space, as the export’s script does', () => {
    expect(SCRIPT).toContain(
      "nbd(s) { return String(s == null ? '' : s).replace(/ /g, '\\u00a0'); }",
    );
    expect(keepTogether('14 Oct 2026, 15:30')).toBe('14\u00a0Oct\u00a02026,\u00a015:30');
    const at = '2026-10-14T10:00:00.000Z'; // 15:30 IST
    expect(stDateTime(at)).toBe('14\u00a0Oct\u00a02026,\u00a015:30');
    expect(stDay(at)).toBe('14\u00a0Oct\u00a02026');
    expect(ST_FACT_WORDS.lastSaved(at)).toBe('Last saved 14\u00a0Oct\u00a02026,\u00a015:30');
    expect(ST_PROGRESS_WORDS.completed(at)).toBe('Completed 14\u00a0Oct\u00a02026');
  });
});

describe('the state words and labels', () => {
  it('are drawn', () => {
    expectDrawn(`<p class="sv-msg-d">${ST_STATE_WORDS.failedLine}</p>`);
    expectDrawn(`>${ST_STATE_WORDS.tryAgain}</button>`);
    expectDrawn(`>${ST_STATE_WORDS.clearFilters}</button>`);
    expectDrawn(`>${ST_STATE_WORDS.help}</a>`);
    expectDrawn(`<span class="sv-pas-k">${ST_LABELS.assessment}</span>`);
    expectDrawn(`<span class="sv-tag">${ST_LABELS.nextStep}</span>`);
  });

  it('no shared word names a record by its internal reference', () => {
    const all = [
      ...Object.values(ST_FORMAT_NAMES),
      ...Object.values(ST_ACCESS_WORDS),
      ...Object.values(ST_OFF_WORDS),
      ...Object.values(ST_HOLD_WORDS),
      ...Object.values(ST_PROGRESS_COLUMNS),
      ...Object.values(ST_STATE_WORDS),
      ...Object.values(ST_LABELS),
      NO_LICENCE_FOR_YOU,
      NO_LICENCE_TELL_MORE,
    ];
    for (const words of all) expect(words).not.toMatch(REFERENCE);
  });
});
