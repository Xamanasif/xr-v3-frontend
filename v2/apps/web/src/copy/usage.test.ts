/**
 * The words of IA-20 Usage are the frozen board B3-10's: each drawn phrase is found verbatim in its
 * markup, the composed ones with the board's own sample values; the words B3-10 does not draw are
 * provisional entries of the state-copy register.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import { STATE_COPY } from './state-copy';
import { STATE_COPY_USAGE } from './state-copy-usage';
import {
  accessPlanWords,
  COURSE_TABLE,
  courseSessionsHeader,
  DEFINITIONS,
  EXPERIMENT_SECTION,
  experimentTableCaption,
  NO_ACTIVITY,
  studentsWithAccessWords,
  USAGE_META,
  USAGE_PAGE,
  usageMetaLine,
} from './usage';

/** A board's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  const text = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
  return `${text}\n${raw}`;
}

const B3_10 = words('B3-10-IA-Usage.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('IA-20 Usage (B3-10 f0 … f4)', () => {
  const drawn = [
    ...strings(USAGE_PAGE),
    USAGE_META,
    ...strings(EXPERIMENT_SECTION),
    COURSE_TABLE.caption,
    ...strings(COURSE_TABLE.columns),
    ...strings(DEFINITIONS),
    ...strings(NO_ACTIVITY),
  ];

  it.each(drawn)('“%s” is on B3-10', (phrase) => {
    expect(B3_10).toContain(phrase);
  });

  it('the composed words follow the board with its own sample values', () => {
    const meta = usageMetaLine('24 Oct 2026');
    expect(meta).toBe('How your content is being used · figures up to 24 Oct 2026');
    expect(B3_10).toContain(`<div class="xr-phead-meta">${meta}</div>`);
    expect(accessPlanWords(['ACC-0107'])).toBe('access plan ACC-0107');
    expect(B3_10).toContain('<span class="xr-id">ME ZG523</span> · access plan ACC-0107');
    expect(studentsWithAccessWords(5)).toBe('students with access');
    expect(B3_10).toContain('<span class="xl-num">5</span> students with access');
    expect(experimentTableCaption('Shell-and-Tube Heat Exchanger')).toBe(
      'Usage by format for Shell-and-Tube Heat Exchanger',
    );
    expect(B3_10).toContain(
      '<caption class="xr-sr">Usage by format for Shell-and-Tube Heat Exchanger</caption>',
    );
    expect(courseSessionsHeader(['WEB', 'VR'])).toBe('Sessions (WEB · VR)');
    expect(B3_10).toContain('<th scope="col">Sessions (WEB · VR)</th>');
    expect(B3_10).toContain('<td data-label="Sessions (WEB · VR)">');
  });

  it('the definitions are B3-10’s four, in its order, each a dt and its dd', () => {
    const drawnList = /<dl class="xl-defs">([\s\S]*?)<\/dl>/.exec(
      board('B3-10-IA-Usage.dc.html'),
    )![1]!;
    const pairs = DEFINITIONS.terms.map(
      ({ term, definition }) => `<dt>${term}</dt><dd>${definition}</dd>`,
    );
    expect(drawnList.trim().replace(/>\s+</g, '><')).toBe(pairs.join(''));
  });

  it('the undrawn words and rules are provisional entries of the register', () => {
    expect(studentsWithAccessWords(1)).toBe(STATE_COPY['IA-20.students-one'].words);
    expect(accessPlanWords(['ACC-0107', 'ACC-0212'])).toBe('access plans ACC-0107 · ACC-0212');
    expect(COURSE_TABLE.perExperiment).toBe(STATE_COPY['IA-20.course-several'].words);
    expect(COURSE_TABLE.notHeld).toBe(STATE_COPY['IA-20.course-format-not-held'].words);
    for (const [key, entry] of Object.entries(STATE_COPY_USAGE)) {
      expect(key.startsWith('IA-20.'), key).toBe(true);
      expect(entry.screen).toBe('IA-20');
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
      // Decision ids are kept in the register, never in the words a screen shows (P1-14 / VD-10).
      if (entry.words !== null) expect(entry.words).not.toMatch(/\b[A-Z]{1,4}-\d{1,3}\b/);
    }
  });

  it('no word of the page counts licences, adds figures up or offers an export', () => {
    const all = [
      ...drawn,
      ...Object.values(STATE_COPY_USAGE).flatMap((entry) => (entry.words ? [entry.words] : [])),
    ].join('\n');
    expect(all).not.toMatch(/licen[cs]e|total|percent|%|export|download|feedback/i);
  });
});
