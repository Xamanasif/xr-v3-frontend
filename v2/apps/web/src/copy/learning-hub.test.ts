/**
 * The words of the hub's Phase-3 parts are the frozen boards' (B2-12, B3-01, B3-02, B3-04; B3-12):
 * each drawn phrase is found verbatim in its board's markup, and each composed line takes the
 * board's own form for the board's sample. Undrawn words live in the state-copy register
 * (`state-copy-learning-hub.ts`), each provisional with its decision.
 */
import { describe, expect, it } from 'vitest';

import { board, stExport } from '@/test-support/boards';

import {
  CHOOSER_V3,
  completedBeforePauseWords,
  continueFormatWords,
  EXPERIMENT_PROGRESS_PAGE,
  feedbackSentWords,
  giveFeedbackOnWords,
  HUB_ASSESSMENT_ACTIONS,
  HUB_HEAD,
  HUB_NEXT_STEP,
  HUB_OVERVIEW,
  HUB_TABS,
  hubTabsLabel,
  lastSavedWords,
  lastSessionWords,
  notMadeForWords,
  openedWords,
  openFormatWords,
  openResourceLabel,
  PROGRESS_TAB_V3,
  RESOURCES_PAGE,
  RESOURCES_V3,
  resourceCountWords,
  resourcesNoteWords,
  resourcesOpenedCount,
  resourcesOpenedLine,
  retryOpenResourceLabel,
  retryResourceLabel,
  SIMULATION_PAGE,
  yourHeadsetWords,
} from './learning-hub';
import { STATE_COPY_LEARNING_HUB } from './state-copy-learning-hub';

/** Text as it reads: the export's no-break spaces that keep a date on one line (`nbd`) read as
 * spaces. */
const plain = <T extends string | null | undefined>(text: T): T =>
  (text == null ? text : text.replace(/\u00a0/g, ' ')) as T;

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
    expect(B3_01).toContain(plain(openedWords(BRIEF_OPENED).replace('Opened ', '')));
    expect(plain(openedWords(BRIEF_OPENED))).toBe('Opened 12 Oct 2026, 09:40');
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
    expect(B3_02).toContain(plain(lastSavedWords(WEB_SAVED)));
    expect(B3_04).toContain(plain(lastSessionWords(VR_SESSION)));
    for (const action of [
      openFormatWords('web'),
      openFormatWords('vr'),
      continueFormatWords('web'),
      giveFeedbackOnWords('web'),
      feedbackSentWords(WEB_DONE),
    ]) {
      expect(B3_02).toContain(plain(action));
    }
    expect(B3_12).toContain(continueFormatWords('web'));
  });
});

describe('ST-10 Progress for this experiment (B3-01 f8 … f12)', () => {
  it('draws every fixed phrase and composed line', () => {
    for (const phrase of Object.values(EXPERIMENT_PROGRESS_PAGE)) expect(B3_01).toContain(phrase);
    expect(B3_01).toContain(plain(completedBeforePauseWords(WEB_DONE)));
    expect(B3_01).toContain(giveFeedbackOnWords('vr'));
    expect(B3_01).toContain(plain(feedbackSentWords(WEB_DONE)));
    expect(B3_01).toContain(openFormatWords('vr'));
    expect(B3_12).toContain(plain(feedbackSentWords(WEB_DONE)));
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

// ---- V3: the owner-approved Student export (ST-v1 `StudentFinal.dc.html`) -----------------------

const MAIN = stExport('StudentFinal.dc.html');
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));
const SCRIPT = MAIN.slice(MAIN.indexOf('<script type="text/x-dc"'));
/** The template writes `&amp;`; compare on the decoded text, then the script that fills it. */
const DRAWN = `${TEMPLATE.replace(/&amp;/g, '&')}\n${SCRIPT}`;
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT)-\d+/;

function expectDrawn(words: string) {
  expect(DRAWN.includes(words), `drawn in the export: ${words}`).toBe(true);
  expect(words).not.toMatch(REFERENCE);
}

describe('V3 — the hub’s head, tabs and Overview (`hubVM`, `overviewVM`)', () => {
  it('every fixed phrase is the export’s', () => {
    for (const words of [...Object.values(HUB_HEAD), ...Object.values(HUB_OVERVIEW)]) {
      expectDrawn(words);
    }
    for (const words of Object.values(HUB_ASSESSMENT_ACTIONS))
      expect(SCRIPT).toContain(`'${words}'`);
    expect(SCRIPT).toContain("tabsAria: E.t + ' sections'");
    expect(hubTabsLabel('Shell-and-Tube Heat Exchanger')).toBe(
      'Shell-and-Tube Heat Exchanger sections',
    );
    expect(SCRIPT).toContain("open + ' of 3 opened.'");
    expect(resourcesOpenedLine(1, 3)).toBe('1 of 3 opened.');
  });
});

describe('V3 — ST-06 Resources (`resVM`)', () => {
  it('every fixed phrase and composed line is the export’s', () => {
    for (const words of Object.values(RESOURCES_V3)) expectDrawn(words);
    expect(SCRIPT).toContain("'3 resources · each opens in a new tab'");
    expect(resourcesNoteWords(3)).toBe('3 resources · each opens in a new tab');
    expect(SCRIPT).toContain(
      "open === 0 ? 'None opened yet' : open >= 3 ? 'All 3 opened' : open + ' of 3 opened'",
    );
    expect([0, 1, 3].map((opened) => resourcesOpenedCount(opened, 3))).toEqual([
      'None opened yet',
      '1 of 3 opened',
      'All 3 opened',
    ]);
    expect(SCRIPT).toContain("(failed ? 'Try opening ' : 'Open ') + r.t + ' in a new tab'");
    expect(retryOpenResourceLabel('Readings sheet')).toBe(
      'Try opening Readings sheet in a new tab',
    );
    expect(openResourceLabel('Readings sheet')).toBe('Open Readings sheet in a new tab');
    for (const words of [
      RESOURCES_PAGE.noneTitle,
      RESOURCES_PAGE.failedTitle,
      RESOURCES_PAGE.notOpened,
      RESOURCES_PAGE.opening,
      RESOURCES_PAGE.openFailed,
      RESOURCES_PAGE.open,
    ]) {
      expectDrawn(words);
    }
  });
});

describe('V3 — ST-07 Simulation (`simVM`)', () => {
  it('every fixed phrase and composed line is the export’s', () => {
    for (const words of Object.values(CHOOSER_V3)) expectDrawn(words);
    expectDrawn(SIMULATION_PAGE.heading);
    expectDrawn(SIMULATION_PAGE.intro);
    expect(TEMPLATE).toContain('<span>Your headset: {{ f.device }}</span>');
    expect(yourHeadsetWords('ME lab VR headset, asset tag GIT-VR-03')).toBe(
      'Your headset: ME lab VR headset, asset tag GIT-VR-03',
    );
  });
});

describe('V3 — ST-10 Progress for this experiment (`progTabVM`, `progExp`)', () => {
  it('every fixed phrase is the export’s', () => {
    for (const words of Object.values(PROGRESS_TAB_V3)) expectDrawn(words);
    expectDrawn(EXPERIMENT_PROGRESS_PAGE.heading);
  });
});
