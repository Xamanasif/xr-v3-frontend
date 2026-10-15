/**
 * The words of ST-01, ST-02, ST-03, ST-05 and ST-19 are the frozen boards' (B2-10, B2-11, B2-12,
 * B2-13; "Completed" B3-05): each drawn phrase is found verbatim in its board's markup, and each
 * composed line takes the board's own form for the board's sample. Undrawn words live in the
 * state-copy register (`state-copy-student.ts`), each provisional with its decision.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import { STATE_COPY_STUDENT } from './state-copy-student';
import {
  assessmentReadyWords,
  continueExperimentWords,
  COURSE_PAGE,
  courseLine,
  deviceNeedsWords,
  EARLIER_WORK_KEPT,
  endedTitle,
  experimentsGivenWords,
  feedbackSubWords,
  formatList,
  formatsAvailableWords,
  formatWaitingSub,
  formatWaitingWords,
  giveFeedbackWords,
  greeting,
  HOME_PAGE,
  HUB_AVAILABILITY,
  HUB_PAGE,
  MY_COURSES_PAGE,
  noLongerLine,
  NOT_AVAILABLE,
  notGivenLine,
  openCourseLabel,
  openExperimentLabel,
  openExperimentWords,
  PAUSED_ROW,
  progressInSentence,
  progressLabel,
  resourcesNoneOpenedWords,
  resourcesOpenedWords,
  simulationAvailabilityWords,
  simulationProgressWords,
  stepWords,
  STUDENT_WORDS,
  upNextMeta,
  noLicenceForYouWords,
} from './student';

/** A board's text with tags removed and `&amp;` read as `&`, then its raw markup (attributes). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B2_10 = words('B2-10-Student-Home.dc.html');
const B2_11 = words('B2-11-My-Courses.dc.html');
const B2_12 = words('B2-12-Experiment-Hub.dc.html');
const B2_13 = words('B2-13-Flow-2-Continuity.dc.html');
const B3_02 = words('B3-02-Simulation-Choose-Format.dc.html');
const B3_05 = words('B3-05-Progress.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const SHELL = 'Shell-and-Tube Heat Exchanger';
const COURSE = 'Thermodynamics & Heat Transfer';

describe('ST-01 Home words are on B2-10', () => {
  it.each(strings(HOME_PAGE))('%s', (text) => {
    expect(B2_10).toContain(text);
  });

  it('the composed lines take B2-10’s forms', () => {
    expect(B2_10).toContain(greeting('Rahul'));
    expect(B2_13).toContain(greeting('Priya'));
    expect(B2_10).toContain(openExperimentWords(SHELL));
    expect(B2_10).toContain(continueExperimentWords(SHELL));
    expect(upNextMeta(3)).toBe('3 of at most 3');
    expect(B2_10).toContain(upNextMeta(3));
    expect(B2_10).toContain(assessmentReadyWords(SHELL));
    expect(B2_10).toContain(giveFeedbackWords('web'));
    expect(B2_10).toContain(feedbackSubWords(SHELL, 'web'));
    expect(B2_10).toContain(formatWaitingWords('vr'));
    expect(B2_10).toContain(formatWaitingSub(SHELL, 'vr', 'not-started'));
    expect(B2_10).toContain(courseLine('ME ZG523', COURSE));
    expect(B2_10).toContain(courseLine('MEC-523', COURSE));
    expect(B2_10).toContain(PAUSED_ROW);
    expect(B2_10).toContain(EARLIER_WORK_KEPT);
  });
});

describe('ST-02 and ST-03 words are on B2-11', () => {
  it.each([...strings(MY_COURSES_PAGE), ...strings(COURSE_PAGE)])('%s', (text) => {
    expect(B2_11).toContain(text);
  });

  it('the shared Student words are drawn', () => {
    for (const text of strings(STUDENT_WORDS)) {
      expect(`${B2_10}\n${B2_11}`).toContain(text);
    }
  });

  it('the row lines take B2-10’s and B2-11’s forms', () => {
    expect(experimentsGivenWords(1)).toBe('1 experiment given to you');
    expect(experimentsGivenWords(2)).toBe('2 experiments given to you');
    // B2-11 script: `all.length === 1 ? '1 experiment given to you' : all.length + ' experiments given to you'`.
    expect(B2_11).toContain("all.length + ' experiments given to you'");
    expect(formatsAvailableWords(['web', 'vr'])).toBe('WEB and VR available');
    for (const drawn of [B2_10, B2_11]) {
      expect(drawn).toContain(
        `${experimentsGivenWords(1)} · ${formatsAvailableWords(['web', 'vr'])}`,
      );
      expect(drawn).toContain(openCourseLabel(COURSE));
    }
    expect(B2_11).toContain(openExperimentLabel(SHELL));
    expect(formatList(['web'])).toBe('WEB');
    expect(formatList(['web', 'ar', 'vr'])).toBe('WEB, AR and VR');
  });

  it('the progress words are drawn (B2-10, B2-11; “Completed” B3-05, “WEB completed” B3-02)', () => {
    expect(B2_11).toContain(`WEB</strong> ${progressLabel('not-started')}`);
    expect(B2_10).toContain(`WEB</strong> ${progressLabel('in-progress')}`);
    expect(B3_05).toContain(`>${progressLabel('completed')}<`);
    expect(B2_12).toContain(progressInSentence('web', 'in-progress'));
    expect(B2_12).toContain(progressInSentence('vr', 'not-started'));
    expect(B3_02).toContain(progressInSentence('web', 'completed'));
  });
});

describe('ST-05 words are on B2-12', () => {
  it.each([...strings(HUB_PAGE), ...strings(HUB_AVAILABILITY)])('%s', (text) => {
    expect(B2_12).toContain(text);
  });

  it('the composed lines take B2-12’s forms', () => {
    expect(B2_12).toContain(stepWords(1));
    expect(B2_12).toContain(stepWords(2));
    expect(B2_12).toContain(stepWords(3));
    expect(B2_12).toContain(resourcesNoneOpenedWords(3));
    expect(simulationAvailabilityWords(['web', 'vr'], [])).toBe('WEB and VR are available to you.');
    expect(B2_12).toContain(
      `${simulationAvailabilityWords(['web', 'vr'], [])} ${simulationProgressWords([
        { format: 'web', progress: 'not-started' },
        { format: 'vr', progress: 'not-started' },
      ])}`,
    );
    expect(B2_12).toContain(
      `${simulationAvailabilityWords(['web'], ['vr'])} ${simulationProgressWords([
        { format: 'web', progress: 'not-started' },
        { format: 'vr', progress: 'not-started' },
      ])}`,
    );
    expect(B2_12).toContain(
      `${simulationProgressWords([
        { format: 'web', progress: 'in-progress' },
        { format: 'vr', progress: 'not-started' },
      ])} ${HUB_PAGE.eachFormatOwnProgress}`,
    );
    expect(B2_12).toContain(
      `WEB</strong> — ${deviceNeedsWords('Laptop or desktop with a current web browser')}`,
    );
    expect(B2_12).toContain(`VR</strong> — ${deviceNeedsWords('Supported VR headset')}`);
    expect(B2_12).toContain(courseLine('ME ZG523', COURSE));
  });

  it('the opened-resources line is provisional, not drawn (`ST-05.resources-opened`)', () => {
    expect(resourcesOpenedWords(3, 1)).toBe('3 resources · 1 opened. 2 more to read.');
    expect(resourcesOpenedWords(3, 3)).toBe('3 resources · all opened.');
    expect(B2_12).not.toContain(resourcesOpenedWords(3, 1));
    expect(STATE_COPY_STUDENT['ST-05.resources-opened'].status).toBe('provisional');
  });
});

describe('ST-19 words are on B2-11, B2-12 and B2-13', () => {
  const drawn = `${B2_11}\n${B2_12}\n${B2_13}`;
  it.each(strings(NOT_AVAILABLE))('%s', (text) => {
    expect(drawn).toContain(text);
  });

  it('each message names the experiment as drawn', () => {
    expect(B2_11).toContain(notGivenLine(SHELL));
    expect(B2_13).toContain(notGivenLine(SHELL));
    expect(B2_12).toContain(noLongerLine(SHELL));
    expect(B2_13).toContain(noLongerLine(SHELL));
    expect(B2_12).toContain(endedTitle(SHELL));
    // The top bar's title and crumb: "My courses / Not available".
    expect(B2_11).toContain(`<span class="xr-top-title">${NOT_AVAILABLE.title}</span>`);
  });
});

describe('the register of undrawn words', () => {
  it('every Student entry is provisional with its decision, and none is a drawn B2 phrase', () => {
    for (const entry of Object.values(STATE_COPY_STUDENT)) {
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
    }
  });

  it('no product word carries a decision id', () => {
    for (const text of [
      ...strings(HOME_PAGE),
      ...strings(MY_COURSES_PAGE),
      ...strings(COURSE_PAGE),
      ...strings(HUB_PAGE),
      ...strings(NOT_AVAILABLE),
      ...Object.values(STATE_COPY_STUDENT).flatMap((entry) =>
        entry.words === null ? [] : [entry.words],
      ),
    ]) {
      expect(text).not.toMatch(/\b(?:OD|SACC|GRP|DEV|VD|PC|T|D)-[A-Z0-9-]*\d/);
    }
  });
});

describe('the Student’s licence wait (PC-45)', () => {
  it('is B3-02’s sentence', () => {
    expect(B3_02).toContain(noLicenceForYouWords('ACC-0107'));
  });
});
