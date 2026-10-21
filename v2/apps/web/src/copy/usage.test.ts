/**
 * The words of IA-20 Usage are the owner-approved V3 export's (design/v3-refined-b/roles/IA-v1,
 * `project/Main.dc.html` IA-20 and `vm20`): each drawn phrase is in its template or script
 * verbatim, the composed ones take the script's form with its own sample values; the words the
 * export does not draw are provisional entries of the state-copy register. No word carries a
 * reference.
 */
import { describe, expect, it } from 'vitest';

import { iaExport } from '@/test-support/boards';

import { STATE_COPY } from './state-copy';
import { STATE_COPY_USAGE } from './state-copy-usage';
import {
  COURSE_TABLE,
  DEFINITIONS,
  endedNoticeTitle,
  EXPERIMENT_SECTION,
  experimentTableCaption,
  NO_ACTIVITY,
  NO_USAGE,
  sessionsByFormat,
  studentsWithAccessWords,
  USAGE_META,
  USAGE_NOTICES,
  USAGE_PAGE,
  usageMetaLine,
} from './usage';

const ROOT = iaExport('Main.dc.html');
const TEMPLATE = ROOT.slice(0, ROOT.indexOf('<script type="text/x-dc"'));
const SCRIPT = ROOT.slice(ROOT.indexOf('<script type="text/x-dc"'));
const IA20 = TEMPLATE.slice(TEMPLATE.indexOf('{{ R.rIA20 }}'), TEMPLATE.indexOf('<!-- XS-07'));
/** The template with its tags removed and `&amp;` read, then the raw source. */
const WORDS = `${TEMPLATE.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${ROOT}`;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('IA-20 Usage (IA-v1 IA-20)', () => {
  const drawn = [
    ...strings(USAGE_PAGE),
    USAGE_META,
    ...strings(EXPERIMENT_SECTION),
    COURSE_TABLE.title,
    COURSE_TABLE.caption,
    ...strings(COURSE_TABLE.columns),
    ...strings(DEFINITIONS),
    ...strings(NO_ACTIVITY),
    NO_USAGE.title,
    ...strings(USAGE_NOTICES),
  ];

  it.each(drawn)('“%s” is in the export', (phrase) => {
    expect(WORDS).toContain(phrase);
  });

  it('the composed words follow the script with its own sample values', () => {
    expect(usageMetaLine('22 Oct 2026')).toBe(
      'How your content is being used · figures up to 22 Oct 2026',
    );
    expect(SCRIPT).toContain(
      "sub: 'How your content is being used' + (any ? ' · figures up to ' + this.fDate(x.asOf) : '')",
    );
    expect(studentsWithAccessWords(5)).toBe('5 students with access');
    expect(studentsWithAccessWords(1)).toBe('1 student with access');
    expect(SCRIPT).toContain("withText: this.plural(n, 'student') + ' with access'");
    expect(experimentTableCaption('Shell-and-Tube Heat Exchanger')).toBe(
      'Usage by format for Shell-and-Tube Heat Exchanger',
    );
    expect(IA20).toContain('<caption>Usage by format for {{ e.t }}</caption>');
    expect(
      sessionsByFormat([
        { code: 'WEB', sessions: 11 },
        { code: 'VR', sessions: 4 },
      ]),
    ).toBe('WEB 11 · VR 4');
    expect(SCRIPT).toContain("sess.push(f + ' ' + (v ? v.sessions : 0))");
    expect(SCRIPT).toContain("sessions: any ? sess.join(' · ') : 'No activity yet'");
  });

  it('the line before access is active and the ended notice name things by content', () => {
    expect(NO_USAGE.line).toBe(
      'Usage appears after BITS activates your access and you give students experiments. Your request to BITS is approved — payment required.',
    );
    expect(IA20).toContain(
      'Usage appears after BITS activates your access and you give students experiments.',
    );
    expect(endedNoticeTitle('7 Oct 2027')).toBe('Your access plan ended on 7 Oct 2027');
    expect(IA20).toContain(
      '<p class="rk-notice-t">Access plan {{ V.planId }} ended on {{ V.endText }}</p>',
    );
    expect(STATE_COPY['IA-20.ended'].rule).toContain('Your access plan ended on 7 Oct 2027');
  });

  it('the definitions are the export’s four, in its order, each a dt and its dd', () => {
    const drawnList = /<dl class="ia-sum ia-sum--defs">([\s\S]*?)<\/dl>/.exec(IA20)![1]!;
    const pairs = DEFINITIONS.terms.map(
      ({ term, definition }) => `<div><dt>${term}</dt><dd>${definition}</dd></div>`,
    );
    expect(drawnList.trim().replace(/>\s+</g, '><')).toBe(pairs.join(''));
  });

  it('the undrawn words and rules are provisional entries of the register', () => {
    expect(COURSE_TABLE.perExperiment).toBe(STATE_COPY['IA-20.course-several'].words);
    for (const [key, entry] of Object.entries(STATE_COPY_USAGE)) {
      expect(key.startsWith('IA-20.'), key).toBe(true);
      expect(entry.screen).toBe('IA-20');
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
      // Decision ids are kept in the register, never in the words a screen shows (P1-14 / VD-10).
      if (entry.words !== null) expect(entry.words).not.toMatch(/\b[A-Z]{1,4}-\d{1,3}\b/);
    }
  });

  it('no word of the page counts licences, adds figures up, offers an export or names a reference', () => {
    const all = [
      ...drawn,
      NO_USAGE.line,
      ...Object.values(STATE_COPY_USAGE).flatMap((entry) => (entry.words ? [entry.words] : [])),
    ].join('\n');
    expect(all).not.toMatch(/licen[cs]e|total|percent|%|export|download|feedback/i);
    expect(all).not.toMatch(/\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/);
  });
});
