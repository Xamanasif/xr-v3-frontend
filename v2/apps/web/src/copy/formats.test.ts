/**
 * The words of ST-08 WEB simulation and ST-09 AR / VR / MR format are the frozen boards' (B3-03,
 * B3-04; "First opened" / "First session reported" B3-05): each drawn phrase is found verbatim in
 * its board's markup, and each composed line takes the board's own form for the board's sample.
 * Undrawn words and rules live in the state-copy register (`state-copy-formats.ts`), each
 * provisional with its decision.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import { FORMAT_WORDS } from './flow-state-words';
import {
  cantUseTitle,
  experimentLine,
  feedbackRecordedWords,
  feedbackSentWords,
  firstOpenedWords,
  firstSessionWords,
  FORMAT_PAGE,
  FORMAT_PANEL,
  formatTitle,
  lastSavedWords,
  lastSessionWords,
  madeForLine,
  noLicenceLine,
  notIncludedLine,
  notIncludedTitle,
  notPublishedTitle,
  reportedWords,
  setUpTitle,
  setupSteps,
  setupWords,
  simulationOverline,
  timeOf,
  WEB_PAGE,
} from './formats';
import { STATE_COPY_FORMATS } from './state-copy-formats';

/** A board's text with tags removed and `&amp;` read as `&`, then its raw markup (attributes). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B3_03 = words('B3-03-WEB-Simulation.dc.html');
const B3_04 = words('B3-04-AR-VR-MR-Format.dc.html');
const B3_05 = words('B3-05-Progress.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const SHELL = 'Shell-and-Tube Heat Exchanger';
/** The walk's instants (IST): WEB saved 12 Oct 11:20, completed 14 Oct 15:30, feedback 15:42. */
const SAVED = '2026-10-12T05:50:00.000Z';
const WEB_DONE = '2026-10-14T10:00:00.000Z';
const WEB_FEEDBACK = '2026-10-14T10:12:00.000Z';
const WEB_OPENED = '2026-10-12T04:35:00.000Z';
const VR_SESSION = '2026-10-16T08:40:00.000Z';
const VR_DONE = '2026-10-20T05:45:00.000Z';

describe('ST-08 WEB simulation words are on B3-03', () => {
  it.each(strings(WEB_PAGE))('%s', (text) => {
    expect(B3_03).toContain(text);
  });

  it.each(strings(FORMAT_PAGE))('%s', (text) => {
    expect(B3_03).toContain(text);
  });

  it('the composed lines take B3-03’s forms', () => {
    expect(B3_03).toContain(simulationOverline('web'));
    expect(B3_03).toContain(lastSavedWords(SAVED));
    expect(B3_03).toContain(reportedWords('simulation', WEB_DONE));
    expect(B3_03).toContain(feedbackSentWords(WEB_FEEDBACK));
    expect(B3_03).toContain(feedbackRecordedWords('web'));
    expect(B3_03).toContain(noLicenceLine('ACC-0107'));
    expect(B3_03).toContain(experimentLine(SHELL, 'ME ZG523'));
    expect(experimentLine(SHELL, null)).toBe(SHELL);
    expect(timeOf(WEB_DONE)).toBe('15:30');
  });

  it('the shared headings and actions (flow-state-words) are B3-03’s', () => {
    for (const text of [
      FORMAT_WORDS.launch('web'),
      FORMAT_WORDS.continue('web'),
      FORMAT_WORDS.completed('web'),
      FORMAT_WORDS.giveFeedback('web'),
      FORMAT_WORDS.seeFeedback,
      FORMAT_WORDS.paused,
    ]) {
      expect(B3_03).toContain(text);
    }
  });

  it('“First opened” before a save is B3-05’s', () => {
    expect(B3_05).toContain(firstOpenedWords(WEB_OPENED));
  });
});

describe('ST-09 AR / VR / MR format words are on B3-04', () => {
  it.each(strings(FORMAT_PANEL))('%s', (text) => {
    expect(B3_04).toContain(text);
  });

  it('the VR words and steps are B3-04 f0, f1, f2, f5', () => {
    const vr = setupWords('vr');
    for (const text of strings(vr).filter((line) => line !== '')) expect(B3_04).toContain(text);
    expect(B3_04).toContain(formatTitle('vr'));
    expect(B3_04).toContain(simulationOverline('vr'));
    expect(B3_04).toContain(setUpTitle('vr'));
    expect(B3_04).toContain(cantUseTitle('vr'));
    expect(B3_04).toContain(lastSessionWords(VR_SESSION));
    expect(B3_04).toContain(reportedWords('headset', VR_DONE));
    expect(B3_04).toContain(FORMAT_WORDS.completed('vr'));
    expect(B3_04).toContain(FORMAT_WORDS.giveFeedback('vr'));
    expect(B3_05).toContain(firstSessionWords(VR_SESSION));
  });

  it('the VR steps read as B3-04 f1 draws them, the published install note as step 2', () => {
    const steps = setupSteps(setupWords('vr'), [
      'Open the Shell-and-Tube Heat Exchanger app on the headset.',
    ]);
    expect(steps.map((step) => step.text)).toEqual([
      'Use your authorised VR headset.',
      'Open the Shell-and-Tube Heat Exchanger app on the headset.',
      'Work through the experiment on the headset.',
      'When the headset reports that you’ve finished, this page shows “Completed”.',
    ]);
    const drawn = B3_04.replace(/\s+/g, ' ');
    for (const step of steps) {
      expect(drawn).toContain(step.text);
      if (step.sub) expect(drawn).toContain(step.sub);
    }
    expect(steps[1]!.sub).toBe('If you can’t find it, contact your institution administrator.');
  });

  it('the AR words and steps are B3-04 f6’s (a wording pattern); blank published steps are left out', () => {
    const ar = setupWords('ar');
    for (const text of strings(ar).filter((line) => line !== '')) expect(B3_04).toContain(text);
    expect(B3_04).toContain(setUpTitle('ar'));
    const steps = setupSteps(ar, ['']);
    expect(steps.map((step) => step.text)).toEqual([
      'Use your authorised phone.',
      'Open the experiment in the phone app.',
      'When the app reports that you’ve finished, this page shows “Completed”.',
    ]);
  });

  it('MR takes the headset form (state-copy ST-09.mr-words)', () => {
    expect(setupWords('mr').needs).toBe('Needs an MR headset');
    expect(setupWords('mr').use.text).toBe('Use your authorised MR headset.');
    expect(setupSteps(setupWords('mr'), [])).toHaveLength(3);
  });

  it('the message pages take B3-04 f3 and f4’s forms', () => {
    expect(B3_04).toContain(formatTitle('ar'));
    expect(B3_04).toContain(formatTitle('mr'));
    expect(B3_04).toContain(notIncludedTitle('ar'));
    expect(B3_04).toContain(notIncludedLine('ar', ['web', 'vr']));
    expect(B3_04).toContain(notPublishedTitle('mr'));
    expect(B3_04).toContain(madeForLine(SHELL, ['web', 'ar', 'vr']));
    expect(B3_04).toContain(FORMAT_PAGE.backToSimulation);
  });
});

describe('the formats register entries', () => {
  it('are provisional, each with its decision, and name no decision id in their words', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_FORMATS)) {
      expect(['ST-08', 'ST-09'], id).toContain(entry.screen);
      expect(entry.status, id).toBe('provisional');
      expect(entry.decisions.length, id).toBeGreaterThan(0);
      if (entry.words) expect(entry.words, id).not.toMatch(/\b[A-Z]{1,4}-\d/);
    }
  });
});
