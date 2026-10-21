/**
 * The words of ST-01, ST-02, ST-03, ST-05 and ST-19 are the frozen boards' (B2-10, B2-11, B2-12,
 * B2-13; "Completed" B3-05): each drawn phrase is found verbatim in its board's markup, and each
 * composed line takes the board's own form for the board's sample. Undrawn words live in the
 * state-copy register (`state-copy-student.ts`), each provisional with its decision.
 */
import { describe, expect, it } from 'vitest';

import { board, stExport } from '@/test-support/boards';

import { NO_LICENCE_FOR_YOU } from './st-shared';

import { STATE_COPY_STUDENT } from './state-copy-student';
import {
  assessmentReadyWords,
  courseLine,
  deviceNeedsWords,
  endedTitle,
  experimentsGivenWords,
  formatList,
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
  progressInSentence,
  progressLabel,
  resourcesNoneOpenedWords,
  resourcesOpenedWords,
  simulationAvailabilityWords,
  simulationProgressWords,
  stepWords,
  STUDENT_WORDS,
  ALL_EXPERIMENTS_PAGE,
  assessmentDueLine,
  assessmentReadyItem,
  completedLine,
  continueInWords,
  COURSE_V3,
  courseLinkLabel,
  coverOpenLabel,
  experimentsCountWords,
  experimentsInCourseLabel,
  feedbackOpenTitle,
  HOME_V3,
  inProgressLine,
  MY_COURSES_TABS,
  MY_COURSES_V3,
  NOT_AVAILABLE_V3,
  notGivenShortLine,
  removeFilterLabel,
  resourcesItemWords,
  resourcesNoneLine,
  resultReleasedItem,
  setUpWords,
  waitingForYouLine,
  yourFormatsLabel,
} from './student';

/** Text as it reads: the export's no-break spaces that keep a date on one line (`nbd`) read as
 * spaces. */
const plain = <T extends string | null | undefined>(text: T): T =>
  (text == null ? text : text.replace(/\u00a0/g, ' ')) as T;

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
    expect(B2_10).toContain(assessmentReadyWords(SHELL));
    expect(B2_10).toContain(giveFeedbackWords('web'));
    expect(B2_10).toContain(formatWaitingWords('vr'));
    expect(B2_10).toContain(courseLine('ME ZG523', COURSE));
    expect(B2_10).toContain(courseLine('MEC-523', COURSE));
  });
});

describe('ST-02 and ST-03 words are on B2-11', () => {
  it.each(strings(MY_COURSES_PAGE))('%s', (text) => {
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
    for (const drawn of [B2_10, B2_11]) {
      expect(drawn).toContain(`${experimentsGivenWords(1)} · WEB and VR available`);
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
  it('is B3-02’s sentence without the plan (lead decision 3: named by content, never by its reference)', () => {
    expect(B3_02).toContain('No licence is available for you on ACC-0107 right now.');
    expect(B3_02.replace(/ on ACC-\d+/g, '')).toContain(NO_LICENCE_FOR_YOU);
    expect(NO_LICENCE_FOR_YOU).not.toMatch(/\b(?:ACC|SACC)-\d+/);
  });
});

// ---- V3: the owner-approved Student export (ST-v1 `StudentFinal.dc.html`) ----------------------

const ST_MAIN = stExport('StudentFinal.dc.html');
const ST_SPLIT = ST_MAIN.indexOf('<script type="text/x-dc"');
/** The export's template (decoded) and its script: each V3 word is drawn by one of them. */
const ST_DRAWN = `${ST_MAIN.slice(0, ST_SPLIT).replace(/&amp;/g, '&')}\n${ST_MAIN.slice(ST_SPLIT)}`;
const ST_REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT)-\d+/;

function expectInExport(phrase: string) {
  expect(ST_DRAWN.includes(phrase), `drawn in the export: ${phrase}`).toBe(true);
}

describe('the V3 words of ST-01 … ST-04 and ST-19 are the export’s', () => {
  it.each([
    ...strings(HOME_V3),
    ...strings(MY_COURSES_V3),
    ...strings(COURSE_V3),
    ...strings(NOT_AVAILABLE_V3),
  ])('“%s” is in StudentFinal.dc.html', (phrase) => {
    expectInExport(phrase);
    expect(phrase).not.toMatch(ST_REFERENCE);
  });

  it('the words kept from the boards are the export’s too', () => {
    for (const phrase of [
      HOME_PAGE.startHere,
      HOME_PAGE.noAccessTitle,
      HOME_PAGE.noAccessLine,
      HOME_PAGE.pausedTitle,
      HOME_PAGE.openExperimentShort,
      MY_COURSES_PAGE.meta,
      MY_COURSES_PAGE.noAccessTitle,
      MY_COURSES_PAGE.nothingNowTitle,
      MY_COURSES_PAGE.nothingNowLine,
      MY_COURSES_PAGE.failedTitle,
      ...strings(MY_COURSES_TABS),
      ALL_EXPERIMENTS_PAGE.searchLabel,
      ALL_EXPERIMENTS_PAGE.searchPlaceholder,
      ALL_EXPERIMENTS_PAGE.formatLabel,
      ALL_EXPERIMENTS_PAGE.allFormats,
      ALL_EXPERIMENTS_PAGE.clearFilters,
      ALL_EXPERIMENTS_PAGE.noMatchTitle,
      ALL_EXPERIMENTS_PAGE.failedTitle,
      STUDENT_WORDS.openCourse,
      STUDENT_WORDS.paused,
      NOT_AVAILABLE.title,
      NOT_AVAILABLE.notGivenTitle,
      NOT_AVAILABLE.noLongerTitle,
      NOT_AVAILABLE.back,
    ]) {
      expectInExport(phrase);
    }
  });

  it('the composed lines take the script’s forms', () => {
    // `nextStep`: 'Continue in your browser' / 'Continue on your headset', 'WEB is in progress.',
    // 'Feedback on ' + f + ' is open', 'Set up ' + f, f + ' is waiting for you.',
    // A.name + ' is due ' + deadline + '.'
    expect(continueInWords('web')).toBe('Continue in your browser');
    expect(continueInWords('vr')).toBe('Continue on your headset');
    expectInExport('Continue in your browser');
    expectInExport('Continue on your headset');
    expect(inProgressLine('web')).toBe('WEB is in progress.');
    expectInExport("'WEB is in progress. Last saved '");
    expect(feedbackOpenTitle('web')).toBe('Feedback on WEB is open');
    expectInExport("'Feedback on ' + fbDue + ' is open'");
    expect(completedLine('vr')).toBe('You completed VR.');
    expectInExport("'You completed ' + fbDue + ' on '");
    expect(setUpWords('vr')).toBe('Set up VR');
    expectInExport("'Set up ' + notStarted");
    expect(waitingForYouLine('vr')).toBe('VR is waiting for you.');
    expectInExport("notStarted + ' is waiting for you.'");
    expect(
      plain(assessmentDueLine('Heat Exchanger — post-lab', '2026-11-14T18:29:00.000Z')),
    ).toMatch(/^Heat Exchanger — post-lab is due 1[45] Nov 2026, \d\d:\d\d\.$/);
    expectInExport("A.name + ' is due '");
    // `homeVM`: "3 resources · none opened yet", resV, the assessment item, the course link.
    expect(resourcesNoneLine(3)).toBe('3 resources · none opened yet');
    expectInExport('3 resources · none opened yet');
    expect(resourcesItemWords(3, 0)).toBe('None opened yet · 3 to read');
    expectInExport('None opened yet · 3 to read');
    expect(resourcesItemWords(3, 1)).toBe('1 of 3 opened');
    expectInExport("open + ' of 3 opened'");
    expect(resourcesItemWords(3, 3)).toBe('All 3 opened');
    expectInExport('All 3 opened');
    expect(assessmentReadyItem(null)).toBe('Ready');
    expectInExport("'Ready · due '");
    expect(plain(resultReleasedItem('2026-11-14T10:00:00.000Z'))).toMatch(
      /^Result released 1[45] Nov 2026$/,
    );
    expectInExport("'Result released '");
    expect(courseLinkLabel(COURSE)).toBe(`${COURSE}, open course`);
    expectInExport("C.name + ', open course'");
    expect(coverOpenLabel(SHELL)).toBe(`Open experiment, ${SHELL}`);
    expectInExport("'Open experiment, ' + E.t");
    // `xcard`, `courseCard`, `coursesVM`, `msg('notgiven')`.
    expect(yourFormatsLabel(SHELL)).toBe(`Your formats for ${SHELL}`);
    expectInExport("'Your formats for ' + E.t");
    expect(experimentsInCourseLabel(COURSE)).toBe(`Experiments given to you in ${COURSE}`);
    expectInExport("'Experiments given to you in ' + C.name");
    expect(experimentsCountWords(1, 1, 1, false)).toBe('1 experiment in 1 course');
    expect(experimentsCountWords(0, 1, 1, true)).toBe('0 of 1 experiment');
    expect(experimentsCountWords(2, 3, 2, true)).toBe('2 of 3 experiments');
    expectInExport("this.plural(all.length, 'experiment') + ' in 1 course'");
    expectInExport("list.length + ' of ' + this.plural(all.length, 'experiment')");
    expect(removeFilterLabel('Format: WEB')).toBe('Remove filter Format: WEB');
    expectInExport("'Remove filter ' + c.label");
    expect(notGivenShortLine('Fin-Tube Bundle')).toBe(
      'Your institution hasn’t given you Fin-Tube Bundle.',
    );
    expectInExport("'Your institution hasn’t given you ' + exp.t + '.'");
  });

  it('the export’s stage words are never Student words (lead decision 1)', () => {
    for (const text of [
      ...strings(HOME_V3),
      ...strings(MY_COURSES_V3),
      ...strings(COURSE_V3),
      inProgressLine('web'),
      completedLine('web'),
    ]) {
      expect(text).not.toMatch(/\bstage\b/i);
    }
  });
});
