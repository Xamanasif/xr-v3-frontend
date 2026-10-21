/**
 * The words of CM-08 Updates (B6-09 f0; B6-13 f2; B7-11 f2) are the frozen boards’; RV-04 Review an
 * update (V3) takes the owner-approved Academic Reviewer export’s (RV-v1 `RV.dc.html`): each drawn
 * phrase is found verbatim in its source’s markup or script, the composed ones with the script’s own
 * pieces; the undrawn forms are provisional entries of the state-copy register, each with its
 * decision and no decision id in its words. No RV-04 word carries an internal reference, and a
 * correction is never called “Publish”.
 */
import { describe, expect, it } from 'vitest';

import { board, rvExport } from '@/test-support/boards';

import {
  APPROVE_DIALOG,
  approveUpdateTitle,
  awaitingNextWords,
  CHANGES_BLOCK,
  CHANGES_COLUMNS,
  changedFieldsTitle,
  changesNoteWords,
  columnWords,
  approvedBy,
  continuesUpdate,
  decidedByOn,
  goesLiveLater,
  LIVE_BLOCK,
  liveNoteWords,
  liveOutcomesTitle,
  livePathLine,
  liveSinceFact,
  NOT_SENT,
  quotedWords,
  RELEASED_COLUMNS,
  releasedNextWords,
  releasedOnWords,
  staysLiveLine,
  staysLiveTitle,
  unchangedLive,
  UPDATE_CARD,
  UPDATE_DECISION,
  UPDATE_HISTORY,
  UPDATE_OUTCOME,
  UPDATE_REFUSAL,
  updateActionLabel,
  updateLineWords,
  UPDATES_LIST,
  updatesCountWords,
  WHY_BLOCK,
  whyByWords,
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

/** The export's live role root (RV-v1 `RV.dc.html`): its markup and script, `&amp;` read. */
const RV = rvExport('RV.dc.html').replace(/&amp;/g, '&');
/** The internal references the owner's rule keeps out of every reviewer page. */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

describe('RV-04 Review an update (V3: RV-v1 `RV.dc.html`)', () => {
  it.each(
    strings([
      UPDATE_CARD,
      WHY_BLOCK,
      CHANGES_BLOCK,
      CHANGES_COLUMNS,
      LIVE_BLOCK,
      UPDATE_REFUSAL,
      UPDATE_OUTCOME,
      APPROVE_DIALOG,
    ]),
  )('“%s” is the export’s', (phrase) => {
    expect(RV).toContain(phrase);
  });

  it.each(
    strings(UPDATE_DECISION).filter((phrase) => phrase !== 'Approving…' && phrase !== 'Returning…'),
  )('the panel: “%s” is the export’s', (phrase) => {
    expect(RV).toContain(phrase);
  });

  it('the composed lines take the export’s forms (`itemVals` for an update)', () => {
    expect(liveSinceFact('1.2', '3 Jul')).toBe('1.2 · since 3 Jul');
    expect(RV).toContain("R.liveVer + (R.liveSince ? ' · since ' + this.short(R.liveSince) : '')");
    expect(whyByWords('Kavya Nair', '25 Aug 2026, 16:00')).toBe(
      'Kavya Nair, Content Manager · sent 25 Aug 2026, 16:00',
    );
    expect(RV).toContain("R.who + ', Content Manager · sent ' + (R.sent || '')");
    expect(changesNoteWords(3, '1.2')).toBe('3 changed fields · everything else stays as in 1.2');
    expect(changesNoteWords(1, '1.0')).toBe('1 changed field · everything else stays as in 1.0');
    expect(RV).toContain(
      "this.plural(R.cmp.length, 'changed field') + ' · everything else stays as in ' + R.liveVer",
    );
    expect(columnWords(CHANGES_COLUMNS.before, '1.2')).toBe('Live now · 1.2');
    expect(columnWords(CHANGES_COLUMNS.after, '1.3')).toBe('Proposed · 1.3');
    expect(RV).toContain('Live now · {{ I.liveVer }}');
    expect(RV).toContain('Proposed · {{ I.newVer }}');
    expect(liveNoteWords('1.2', '3 Jul 2026')).toBe('Version 1.2 · live since 3 Jul 2026');
    expect(RV).toContain("'Version ' + R.liveVer + (R.liveSince ? ' · live since ' + R.liveSince");
    expect(liveOutcomesTitle('1.2')).toBe('Learning outcomes in version 1.2');
    expect(RV).toContain('Learning outcomes in version {{ I.liveVer }}');
  });

  it('the panel’s composed lines (`ready`, `path`)', () => {
    expect(staysLiveTitle('1.2')).toBe('Version 1.2 stays live');
    expect(staysLiveLine('1.3')).toBe('until the Super Admin releases 1.3.');
    expect(RV).toContain(
      "t: 'Version ' + R.liveVer + ' stays live', d: 'until the Super Admin releases ' + R.newVer + '.'",
    );
    expect(changedFieldsTitle(3)).toBe('3 changed fields.');
    expect(changedFieldsTitle(1)).toBe('1 changed field.');
    expect(RV).toContain("t: this.plural(R.cmp.length, 'changed field') + '.'");
    expect(livePathLine('1.2')).toBe(
      'Version 1.2 stays live until a release. Releasing changes no one’s access.',
    );
    expect(RV).toContain(
      "d: 'Version ' + R.liveVer + ' stays live until a release. Releasing changes no one’s access.'",
    );
  });

  it('the Approve dialog is named by the experiment, never by its reference', () => {
    expect(approveUpdateTitle('Distillation Column')).toBe(
      'Approve the update to Distillation Column?',
    );
    expect(RV).toContain("'Approve the update to ' + R.name + '?'");
    expect(approveUpdateTitle('Distillation Column')).not.toMatch(REFERENCE);
    expect(goesLiveLater('1.3', '1.2')).toBe(
      'Version 1.3 goes live only if the Super Admin releases it. Version 1.2 stays live until then.',
    );
    expect(RV).toContain(
      "'Version ' + R.newVer + ' goes live only if the Super Admin releases it. Version ' + R.liveVer + ' stays live until then.'",
    );
  });

  it('the outcome block’s composed lines (`doneBlock` for an update)', () => {
    // Another reviewer's decision (undrawn; state-copy `RV-04.decided-by`): the export's forms
    // with the name in place of “you”.
    expect(decidedByOn('Prof. R. Iyer', '27 Aug 2026, 11:20')).toBe(
      'Decided by Prof. R. Iyer on 27 Aug 2026, 11:20',
    );
    expect(RV).toContain("'Decided by you on ' + src.when");
    expect(approvedBy('Prof. R. Iyer')).toBe('Approved by Prof. R. Iyer');
    expect(RV).toContain("'Approved by ' + by");
    expect(releasedOnWords('5 Aug 2026')).toBe('Released on 5 Aug 2026');
    expect(RV).toContain("v: 'Released on ' + R.relWhen");
    expect(unchangedLive('1.2')).toBe('1.2, unchanged');
    expect(RV).toContain("v: R.liveVer + ', unchanged'");
    expect(releasedNextWords('1.1')).toBe(
      'Version 1.1 is live. Releasing changed no one’s access.',
    );
    expect(RV).toContain("'Version ' + R.newVer + ' is live. Releasing changed no one’s access.'");
    expect(awaitingNextWords('1.2')).toBe(
      'Version 1.2 stays live. Release or hold is the Super Admin’s decision.',
    );
    expect(RV).toContain("'Release or hold is the Super Admin’s decision.'");
    expect(RV).toContain("'Version ' + R.liveVer + ' stays live. '");
  });

  it('the history keeps the boards’ steps (`uh`; B7-11 `histAdd`), as the export lists them', () => {
    expect(RV).toContain(UPDATE_HISTORY.sent);
    expect(RV).toContain(UPDATE_HISTORY.started);
    expect(UPDATE_HISTORY.sentNote('Prof. A. Menon', '1.2')).toBe(
      'To Prof. A. Menon. The live version 1.2 is unchanged.',
    );
    expect(RV).toContain('To Prof. A. Menon. The live version 1.2 is unchanged.');
    expect(UPDATE_HISTORY.startedNote('1.2')).toBe('Pre-filled with the live version 1.2.');
    expect(RV).toContain('Pre-filled with the live version 1.2.');
    expect(UPDATE_HISTORY.approved('Prof. A. Menon')).toBe('Approved by Prof. A. Menon');
    expect(UPDATE_HISTORY.approvedNote('1.2')).toBe(
      'With the Super Admin for a release decision. The live version stays 1.2 until then.',
    );
    expect(RV).toContain(
      "n: 'With the Super Admin for a release decision. The live version stays ' + R.liveVer + ' until then.'",
    );
    expect(UPDATE_HISTORY.returned('Prof. A. Menon')).toBe('Returned by Prof. A. Menon');
    expect(RV).toContain("w: 'Returned by ' + by");
    expect(quotedWords('Please also say it.')).toBe('“Please also say it.”');
    // The release is B7-11's (the export draws no released update page).
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

  it('not sent yet keeps the product’s words (B6-04 `rvNone`, B6-13 f4; lead decision 3)', () => {
    for (const phrase of strings(NOT_SENT)) {
      expect(B6_04).toContain(phrase);
      expect(B6_13).toContain(phrase);
    }
  });

  it('no reference and no “Publish” in any RV-04 word', () => {
    const all = [
      ...strings([
        UPDATE_CARD,
        WHY_BLOCK,
        CHANGES_BLOCK,
        LIVE_BLOCK,
        UPDATE_DECISION,
        UPDATE_REFUSAL,
        UPDATE_OUTCOME,
        APPROVE_DIALOG,
        NOT_SENT,
      ]),
      approveUpdateTitle('Distillation Column'),
      goesLiveLater('1.3', '1.2'),
      awaitingNextWords('1.2'),
      releasedNextWords('1.3'),
      livePathLine('1.2'),
    ];
    for (const phrase of all) {
      expect(phrase).not.toMatch(REFERENCE);
      expect(phrase).not.toMatch(/\bpublish(?:es|ing)?\b/i);
    }
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
