/**
 * The words of CM-08 Updates (B6-09 f0; B6-13 f2; B7-11 f2) and RV-04 Review an update (B6-04 f0 …
 * f4; B6-13 f4; B7-11 f6) are the frozen boards’: each drawn phrase is found verbatim in its
 * board’s markup or script, the composed ones with the script’s own pieces; the sentence with a
 * decision id is shown without it (P1-14 / VD-10); the undrawn forms are provisional entries of
 * the state-copy register, each with its decision and no decision id in its words. A correction is
 * never called “Publish”.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  approvedMetaWords,
  approveUpdateEffect,
  approveUpdateTitle,
  awaitingNextWords,
  continuesUpdate,
  courseLineWords,
  liveSinceWords,
  quotedWords,
  returnedMetaWords,
  REVIEW_UPDATE,
  reviewUpdateMeta,
  reviewUpdateOverline,
  RELEASED_COLUMNS,
  reviewUpdateTitle,
  STRIPPED_UPDATE,
  UPDATE_DECISION,
  UPDATE_HISTORY,
  updateActionLabel,
  updateLineWords,
  UPDATES_LIST,
  updatesCountWords,
  WITH_WORDS,
} from './review-update';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_REVIEW_UPDATE } from './state-copy-review-update';

/** A board’s text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B6_04 = words('B6-04-Review-an-Update.dc.html');
const B6_09 = words('B6-09-Updates-Corrections.dc.html');
const B6_13 = words('B6-13-Flow-6-Steps-1-2.dc.html');
const B7_11 = words('B7-11-Flow-6-Release-and-Hold.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('CM-08 Updates (B6-09 f0)', () => {
  it.each(strings(UPDATES_LIST))('“%s” is on B6-09', (phrase) => {
    expect(B6_09).toContain(phrase);
  });

  it.each(strings(WITH_WORDS))('“With” — “%s” is B6-09’s `withw`', (phrase) => {
    expect(B6_09).toContain(`"${phrase}"`);
  });

  it('the composed words take B6-09’s script forms', () => {
    expect(updatesCountWords(4)).toBe('4 updates');
    expect(updatesCountWords(1)).toBe('1 update');
    expect(B6_09).toContain("o.uCount = plural(rows.length, 'update')");
    expect(updateLineWords('Distillation Column', '1.3')).toBe('Distillation Column · 1.3');
    expect(updateLineWords('Distillation Column', null)).toBe('Distillation Column · —');
    expect(updateLineWords('Distillation Column', '  ')).toBe('Distillation Column · —');
    expect(B6_09).toContain('{{ r.name }} · {{ r.ver }}');
    expect(B6_09).toContain("ver: T(u.ver) || '—'");
    // “Continue” while hers (draft, returned), else “Open”; the row action’s name.
    expect(continuesUpdate('draft')).toBe(true);
    expect(continuesUpdate('returned')).toBe(true);
    for (const state of [
      'in-academic-review',
      'awaiting-release-decision',
      'on-hold',
      'released',
      'withdrawn',
    ] as const) {
      expect(continuesUpdate(state)).toBe(false);
    }
    expect(updateActionLabel('returned', 'UPD-0006', 'Induction Motor Loading')).toBe(
      'Continue UPD-0006 Induction Motor Loading',
    );
    expect(updateActionLabel('on-hold', 'UPD-0004', 'Boiler Drum Level')).toBe(
      'Open UPD-0004 Boiler Drum Level',
    );
    expect(B6_09).toContain(
      "aria: (x.st === 'returned' || x.st === 'draft' ? 'Continue ' : 'Open ') + x.id + ' ' + x.name",
    );
  });
});

describe('RV-04 Review an update (B6-04 f0 … f4; B6-13 f4)', () => {
  it.each(strings(REVIEW_UPDATE))('“%s” is on B6-04', (phrase) => {
    expect(B6_04).toContain(phrase);
  });

  it('B6-13 f4 draws the same “nothing to decide” state', () => {
    for (const phrase of [
      REVIEW_UPDATE.heading,
      REVIEW_UPDATE.noneTitle,
      REVIEW_UPDATE.noneLine,
      REVIEW_UPDATE.openQueue,
    ]) {
      expect(B6_13).toContain(phrase);
    }
  });

  it.each(strings(UPDATE_DECISION))('the panel and dialogs: “%s” is on B6-04', (phrase) => {
    expect(B6_04).toContain(phrase);
  });

  it('the header takes B6-04’s forms (`rvOver`, the H1, `rvMeta`)', () => {
    expect(reviewUpdateOverline('UPD-0005')).toBe('UPD-0005 · Update (Content Manager correction)');
    expect(B6_04).toContain("(u ? u.id : 'UPD') + ' · Update (Content Manager correction)'");
    expect(reviewUpdateTitle('Distillation Column', '1.2', '1.3')).toBe(
      'Distillation Column · 1.2 → 1.3',
    );
    expect(B6_04).toContain('{{ m.lName }} · {{ m.lVer }} → {{ m.uVer }}');
    expect(reviewUpdateMeta('Kavya Nair', 'CHE ZG513', '1.2')).toBe(
      'From Kavya Nair · CHE ZG513 · live version 1.2',
    );
    expect(B6_04).toContain("'From ' + D.cm + ' · ' + D.dist.course + ' · live version ' + L.ver");
    // No course known: the course is left out (state-copy `RV-04.no-course-code`).
    expect(reviewUpdateMeta('Kavya Nair', null, '1.2')).toBe('From Kavya Nair · live version 1.2');
    expect(courseLineWords('CHE ZG513', 'Process Instrumentation & Control')).toBe(
      'CHE ZG513 · Process Instrumentation & Control',
    );
    expect(B6_04).toContain('{{ m.course }} · {{ m.cname }}');
    expect(courseLineWords(null, 'Fluid Mechanics')).toBe('Fluid Mechanics');
    expect(liveSinceWords('1.2', '3 Jul 2026')).toBe('1.2 · since 3 Jul 2026');
    expect(B6_04).toContain('{{ m.lVer }} · since {{ m.lSince }}');
  });

  it('DL-1 says approval goes to the Super Admin and releases nothing (`raTitle`, `raBody`)', () => {
    expect(approveUpdateTitle('UPD-0005')).toBe('Approve UPD-0005?');
    expect(B6_04).toContain("o.raTitle = 'Approve ' + (u ? u.id : '') + '?'");
    expect(approveUpdateEffect('1.2')).toBe(
      'It goes to the Super Admin, who decides when to release it. Version 1.2 stays live until then.',
    );
    expect(B6_04).toContain(
      "o.raBody = 'It goes to the Super Admin, who decides when to release it. Version ' + L.ver + ' stays live until then.'",
    );
    expect(B6_04).toContain(
      '“It goes to the Super Admin, who decides when to release it. Version 1.2 stays live until then.”',
    );
  });

  it('the decided panel (`rDecMeta`, `rDecNext`)', () => {
    expect(approvedMetaWords('27 Aug 2026', 'Prof. A. Menon')).toBe('27 Aug 2026 · Prof. A. Menon');
    expect(returnedMetaWords('27 Aug 2026', 'The corrected sentence is right.')).toBe(
      '27 Aug 2026 · “The corrected sentence is right.”',
    );
    expect(B6_04).toContain(
      "o.rDecMeta = ust === 'awaiting' && u ? day(u.appr) + ' · ' + D.rv : ust === 'returned' && u && u.ret ? day(u.ret.when) + ' · “' + u.ret.reason + '”' : ''",
    );
    expect(awaitingNextWords('1.2')).toBe(
      'Version 1.2 stays live. Release or hold is the Super Admin’s decision.',
    );
    expect(B6_04).toContain(
      "'Version ' + L.ver + ' stays live. Release or hold is the Super Admin’s decision.'",
    );
  });

  it('the history (`uh`; B7-11 `histAdd` for the release)', () => {
    expect(B6_04).toContain(UPDATE_HISTORY.sent);
    expect(UPDATE_HISTORY.sentNote('Prof. A. Menon', '1.2')).toBe(
      'To Prof. A. Menon. The live version 1.2 is unchanged.',
    );
    expect(B6_04).toContain('To Prof. A. Menon. The live version 1.2 is unchanged.');
    expect(UPDATE_HISTORY.approved('Prof. A. Menon')).toBe('Approved by Prof. A. Menon');
    expect(UPDATE_HISTORY.approvedNote('1.2')).toBe(
      'With the Super Admin for a release decision. The live version stays 1.2 until then.',
    );
    expect(B6_04).toContain(
      "what: 'Approved by ' + D.rv, when: w, note: 'With the Super Admin for a release decision. The live version stays ' + c.live.ver + ' until then.'",
    );
    expect(UPDATE_HISTORY.returned('Prof. A. Menon')).toBe('Returned by Prof. A. Menon');
    expect(B6_04).toContain("what: 'Returned by ' + D.rv");
    expect(quotedWords('Please also say it.')).toBe('“Please also say it.”');
    expect(UPDATE_HISTORY.released('Arjun Mehta')).toBe('Released by Arjun Mehta');
    expect(UPDATE_HISTORY.releasedNote('1.3')).toBe('Version 1.3 is live for everyone.');
    expect(B7_11).toContain(
      "histAdd(c, 'Released by ' + E.sa, 'Version ' + T(cu.ver) + ' is live for everyone.')",
    );
  });

  it('a released update’s columns are B7-05 f6’s (`cmpWas`)', () => {
    const b7_05 = words('B7-05-Content-Updates-Release-Hold.dc.html');
    for (const phrase of strings(RELEASED_COLUMNS)) expect(b7_05).toContain(phrase);
  });

  it('the open note is shown without its decision id (P1-14 / VD-10)', () => {
    const note = STRIPPED_UPDATE.openNote;
    expect(B6_04).toContain(note.drawn);
    expect(note.words).toBe(note.drawn.replace(' (T-28)', ''));
    expect(note.ids).toEqual(['T-28']);
    expect(note.words).not.toMatch(/T-\d/);
  });

  it('never says “Publish” (the published experiment is named, never the act)', () => {
    const all = [
      ...strings(REVIEW_UPDATE),
      ...strings(UPDATE_DECISION),
      ...strings(UPDATES_LIST),
      approveUpdateEffect('1.2'),
      awaitingNextWords('1.2'),
    ];
    for (const phrase of all) expect(phrase).not.toMatch(/\bpublish(?:es|ing)?\b/i);
  });
});

describe('the register entries', () => {
  const entries = Object.entries(STATE_COPY_REVIEW_UPDATE);

  it.each(entries)(
    '%s is provisional, waits on a decision, and is in the register',
    (id, entry) => {
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(entry.words ?? '').not.toMatch(/\b(?:VD|OD|PC|CC|P0|P1|DEV|UPD|T)-[A-Z0-9-]+/);
      expect(entry.words ?? '').not.toMatch(/\bpublish(?:es|ing)?\b/i);
    },
  );

  it('names its screens’ undrawn states', () => {
    for (const id of ['CM-08.list.loading', 'CM-08.list.failed'] as const) {
      expect(STATE_COPY[id]).toMatchObject({ screen: 'CM-08', status: 'provisional' });
    }
    for (const id of [
      'RV-04.loading',
      'RV-04.failed',
      'RV-04.not-sent',
      'RV-04.stale.title',
      'RV-04.moved-on',
      'RV-04.unavailable',
    ] as const) {
      expect(STATE_COPY[id]).toMatchObject({ screen: 'RV-04', status: 'provisional' });
    }
  });
});
