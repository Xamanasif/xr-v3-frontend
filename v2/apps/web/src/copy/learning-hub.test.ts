/**
 * The words of the hub's Phase-3 parts are the frozen boards' (B2-12, B3-01, B3-02, B3-04; B3-12):
 * each drawn phrase is found verbatim in its board's markup, and each composed line takes the
 * board's own form for the board's sample. Undrawn words live in the state-copy register
 * (`state-copy-learning-hub.ts`), each provisional with its decision.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  completedBeforePauseWords,
  continueFormatWords,
  EXPERIMENT_PROGRESS_PAGE,
  feedbackSentWords,
  giveFeedbackOnWords,
  HUB_NEXT_STEP,
  HUB_TABS,
  lastSavedWords,
  lastSessionWords,
  notMadeForWords,
  openedWords,
  openFormatWords,
  openResourceLabel,
  RESOURCES_PAGE,
  resourceCountWords,
  retryResourceLabel,
  SIMULATION_PAGE,
} from './learning-hub';
import { STATE_COPY_LEARNING_HUB } from './state-copy-learning-hub';

/** A board's text with tags removed and `&amp;` read as `&`, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B2_12 = words('B2-12-Experiment-Hub.dc.html');
const B3_01 = words('B3-01-Hub-Resources-and-Progress.dc.html');
const B3_02 = words('B3-02-Simulation-Choose-Format.dc.html');
const B3_04 = words('B3-04-AR-VR-MR-Format.dc.html');
const B3_12 = words('B3-12-Flow-3-Continuity.dc.html');

// The sample's instants as the walk records them (IST): C1, C2, C3, the VR session.
const BRIEF_OPENED = '2026-10-12T04:10:00.000Z'; // 12 Oct 2026, 09:40
const WEB_SAVED = '2026-10-12T05:50:00.000Z'; // 12 Oct 2026, 11:20
const WEB_DONE = '2026-10-14T10:00:00.000Z'; // 14 Oct 2026, 15:30
const VR_SESSION = '2026-10-16T08:40:00.000Z'; // 16 Oct 2026, 14:10

describe('the hub’s tabs and Next step (B2-12)', () => {
  it('draws the tab words and the Next step lines', () => {
    for (const tab of Object.values(HUB_TABS)) {
      expect(B2_12).toContain(`class="xr-tab" href=`);
      expect(B2_12).toMatch(new RegExp(`>${tab}</a>`));
    }
    for (const line of Object.values(HUB_NEXT_STEP)) expect(B2_12).toContain(line);
    expect(B2_12).toContain(continueFormatWords('web'));
  });
});

describe('ST-06 Resources (B3-01 f0 … f7)', () => {
  it('draws every fixed phrase', () => {
    for (const phrase of Object.values(RESOURCES_PAGE)) expect(B3_01).toContain(phrase);
  });

  it('composes the board’s sample', () => {
    expect(B3_01).toContain(`<span class="xr-meta">${resourceCountWords(3)}</span>`);
    expect(B3_01).toContain(openedWords(BRIEF_OPENED).replace('Opened ', ''));
    expect(openedWords(BRIEF_OPENED)).toBe('Opened 12 Oct 2026, 09:40');
    expect(B3_01).toContain("'Open ' + r.t + ' in a new tab'");
    expect(openResourceLabel('Readings sheet')).toBe('Open Readings sheet in a new tab');
    expect(B3_01).toContain("'Try opening ' + r.t + ' again'");
    expect(retryResourceLabel('Readings sheet')).toBe('Try opening Readings sheet again');
    expect(resourceCountWords(1)).toBe('1 resource');
  });
});

describe('ST-07 Simulation — choose a format (B3-02 f0 … f7)', () => {
  it('draws every fixed phrase', () => {
    for (const phrase of Object.values(SIMULATION_PAGE)) expect(B3_02).toContain(phrase);
  });

  it('composes the board’s rows', () => {
    expect(B3_02).toContain(notMadeForWords('mr'));
    expect(B3_02).toContain(lastSavedWords(WEB_SAVED));
    expect(B3_04).toContain(lastSessionWords(VR_SESSION));
    for (const action of [
      openFormatWords('web'),
      openFormatWords('vr'),
      continueFormatWords('web'),
      giveFeedbackOnWords('web'),
      feedbackSentWords(WEB_DONE),
    ]) {
      expect(B3_02).toContain(action);
    }
    expect(B3_12).toContain(continueFormatWords('web'));
  });
});

describe('ST-10 Progress for this experiment (B3-01 f8 … f12)', () => {
  it('draws every fixed phrase and composed line', () => {
    for (const phrase of Object.values(EXPERIMENT_PROGRESS_PAGE)) expect(B3_01).toContain(phrase);
    expect(B3_01).toContain(completedBeforePauseWords(WEB_DONE));
    expect(B3_01).toContain(giveFeedbackOnWords('vr'));
    expect(B3_01).toContain(feedbackSentWords(WEB_DONE));
    expect(B3_01).toContain(openFormatWords('vr'));
    expect(B3_12).toContain(feedbackSentWords(WEB_DONE));
  });
});

describe('the hub’s state-copy entries', () => {
  it('are provisional, each with its decision, and cite a board or the register', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_LEARNING_HUB)) {
      expect(entry.status, id).toBe('provisional');
      expect(entry.decisions.length, id).toBeGreaterThan(0);
      expect(entry.basis, id).toMatch(/B\d-\d\d|Board \d\d|ST-\d\d/);
    }
  });

  it('borrow drawn words where they say so', () => {
    expect(B3_02).toContain(STATE_COPY_LEARNING_HUB['ST-06.waiting'].words);
    expect(words('B3-05-Progress.dc.html')).toContain(
      STATE_COPY_LEARNING_HUB['ST-10.loading'].words,
    );
    expect(words('B3-05-Progress.dc.html')).toContain(
      STATE_COPY_LEARNING_HUB['ST-10.failed'].words,
    );
  });
});
