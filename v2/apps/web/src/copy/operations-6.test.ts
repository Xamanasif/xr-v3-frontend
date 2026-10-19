/**
 * The words of SA-20 Support, SA-21 Support report and SA-22 Access ending are the owner-approved
 * Super Admin export's (design/v3-refined-b/roles/SA-v1, `sa-views-d.js` `V.support`, `V.report`,
 * `SA.DLG.reopen`, `V.accessEnding`): each fixed phrase is found verbatim in its views, and the
 * composed ones are checked against the views' expressions. The report statuses are the
 * reporter's own words. SA-07's access-ending row keeps B7-03's words. No Super Admin word carries
 * an internal reference or a decision id.
 */
import { describe, expect, it } from 'vitest';

import { OPERATIONS_TABS } from '@/nav/operations';
import { board, saExport } from '@/test-support/boards';

import { supportWords, wordsOf } from './flow-state-words';
import { OPERATIONS_PAGE } from './operations';
import {
  ACCESS_ENDING,
  asOfWords,
  ATTENTION_ACCESS_ENDING,
  attentionReminderDue,
  daysLeftWords,
  earlierNoteWords,
  endedAgoWords,
  fromWords,
  lastActivityWords,
  openInstitutionLabel,
  openRequestLabel,
  quoted,
  renewalLine,
  reopenedByWords,
  REPORT_HISTORY,
  REPORT_PAGE,
  reporterLine,
  reporterWords,
  reportRowLabel,
  resolvedFlashLine,
  resolvedOnWords,
  sentWords,
  STANDING_TONE,
  SUPPORT_LIST,
  SUPPORT_STATUS,
} from './operations-6';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_OPERATIONS_6 } from './state-copy-operations-6';

const VIEWS = saExport('sa-views-d.js');
const CORE = saExport('sa-core.js');
const DATA = saExport('sa-data.js');
const LINK_MAP = saExport('../LINK-MAP.json');
const B7_03 = board('B7-03-Institution-Detail.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const INTERNAL = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

describe('the Operations tabs (SA-v1 `opsHead`)', () => {
  it('the tab words are the export’s, in its order and at the addresses nav names them', () => {
    expect(OPERATIONS_TABS.map((tab) => OPERATIONS_PAGE.tabs[tab.key])).toEqual([
      'Device transfers',
      'Support',
      'Access ending',
    ]);
    for (const tab of OPERATIONS_TABS) {
      expect(tab.label).toBe(OPERATIONS_PAGE.tabs[tab.key]);
      expect(VIEWS).toContain(`'${tab.label}', '#/operations/`);
    }
  });
});

describe('SA-20 Operations › Support (SA-v1 `V.support`)', () => {
  it.each(strings(SUPPORT_LIST))('“%s” is in the export’s views', (phrase) => {
    expect(VIEWS).toContain(phrase);
  });

  it('the statuses are the reporter’s words, in the export’s tones (`SUP`)', () => {
    expect(VIEWS).toContain(
      "const SUP = { open: ['info', 'Open'], reopened: ['warn', 'Reopened'], resolved: ['ok', 'Resolved'] };",
    );
    for (const state of ['open', 'resolved', 'reopened'] as const) {
      expect(SUPPORT_STATUS[state].words).toBe(wordsOf(supportWords(state)));
    }
    expect(Object.fromEntries(Object.entries(SUPPORT_STATUS).map(([k, v]) => [k, v.tone]))).toEqual(
      { open: 'info', resolved: 'ok', reopened: 'warn' },
    );
  });

  it('the composed cells follow the views’ expressions', () => {
    expect(VIEWS).toContain("Sent ' + esc(s.sent)");
    expect(sentWords('3 Oct 2026')).toBe('Sent 3 Oct 2026');
    expect(VIEWS).toContain("esc(s.title + ', ' + SUP[s.st][1] + '. Open the report')");
    expect(LINK_MAP).toContain(reportRowLabel('Student import stopped part-way', 'Reopened'));
    expect(VIEWS).toContain("esc(s.role + (s.instName ? ' · ' + s.instName : ''))");
    expect(reporterLine('tenant_admin', 'Godavari Institute of Technology')).toBe(
      'Institute Admin · Godavari Institute of Technology',
    );
    expect(reporterLine('content_manager', null)).toBe('Content Manager');
    // `actLabel` ("sent 30 Sep", "reopened 6 Oct"), its first letter raised.
    expect(DATA).toContain("actLabel: 'sent 30 Sep'");
    expect(DATA).toContain("actLabel: 'reopened 6 Oct'");
    expect(VIEWS).toContain('s.actLabel.replace(/^\\w/, c => c.toUpperCase())');
    expect(lastActivityWords('sent', '30 Sep')).toBe('Sent 30 Sep');
    expect(lastActivityWords('reopened', '6 Oct')).toBe('Reopened 6 Oct');
    expect(lastActivityWords('resolved', '23 Sep')).toBe('Resolved 23 Sep');
  });
});

describe('SA-21 Support report (SA-v1 `V.report`, `SA.DLG.reopen`)', () => {
  // "Resolving…" is the product's: the export's Resolve has no busy state.
  it.each([
    ...strings(REPORT_PAGE).filter((phrase) => phrase !== REPORT_PAGE.resolving),
    ...strings(REPORT_HISTORY),
  ])('“%s” is in the export’s views, its dialog helper or its sample history', (phrase) => {
    expect(`${VIEWS}\n${CORE}\n${DATA}`).toContain(phrase);
  });

  it('the composed lines follow the views’ expressions', () => {
    expect(VIEWS).toContain("esc(s.who + ', ' + s.role)");
    expect(reporterWords('Meera Iyer', 'tenant_admin')).toBe('Meera Iyer, Institute Admin');
    expect(VIEWS).toContain("esc(s.who + ' · ' + s.role + (s.instName ? ' · ' + s.instName : ''))");
    expect(fromWords('Rahul Verma', 'student', 'Godavari Institute of Technology')).toBe(
      'Rahul Verma · Student · Godavari Institute of Technology',
    );
    expect(fromWords('Kavya Nair', 'content_manager', null)).toBe('Kavya Nair · Content Manager');
    expect(VIEWS).toContain("Your earlier note: “' + esc(s.note) + '”");
    expect(earlierNoteWords('The import now finishes.')).toBe(
      'Your earlier note: “The import now finishes.”',
    );
    expect(VIEWS).toContain("Resolved on ' + esc(s.resolved)");
    expect(resolvedOnWords('23 Sep 2026')).toBe('Resolved on 23 Sep 2026');
    expect(VIEWS).toContain("s.who + ' sees your note on their report.'");
    expect(resolvedFlashLine('Meera Iyer')).toBe('Meera Iyer sees your note on their report.');
    expect(VIEWS).toContain("'“' + n + '”");
    expect(quoted('x')).toBe('“x”');
    expect(VIEWS).toContain("['Reopened', when, 'By Arjun Mehta.']");
    expect(reopenedByWords('Arjun Mehta')).toBe('By Arjun Mehta.');
    expect(DATA).toContain("['Reopened', '6 Oct 2026', 'By the reporter.']");
  });

  it('the note’s required error is the contract’s, as the export draws it', () => {
    expect(VIEWS).toContain('Add a note — the reporter sees it');
  });
});

describe('SA-22 Operations › Access ending (SA-v1 `V.accessEnding`)', () => {
  it.each(strings(ACCESS_ENDING))('“%s” is in the export’s views', (phrase) => {
    expect(VIEWS).toContain(phrase);
  });

  it('the composed cells follow the views’ expressions', () => {
    expect(VIEWS).toContain("As of ' + esc(S.A.short) + ' · soonest first");
    expect(asOfWords('23 Oct 2026')).toBe('As of 23 Oct 2026 · soonest first');
    expect(VIEWS).toContain("SA.plural(n, 'day') + ' left'");
    expect(VIEWS).toContain("'Ended ' + SA.plural(-n, 'day') + ' ago'");
    expect([daysLeftWords(8), daysLeftWords(1), endedAgoWords(8), endedAgoWords(1)]).toEqual([
      '8 days left',
      '1 day left',
      'Ended 8 days ago',
      'Ended 1 day ago',
    ]);
    expect(VIEWS).toContain('Request under review');
    expect(renewalLine('Under review')).toBe('Request under review');
    expect(LINK_MAP).toContain(openRequestLabel('BITS Pilani — Hyderabad Campus'));
    expect(LINK_MAP).toContain(openInstitutionLabel('Konark Polytechnic'));
  });

  it('the status tones are the export’s', () => {
    expect(STANDING_TONE).toEqual({
      'renewal-in-progress': 'info',
      'reminder-due': 'warn',
      'ended-no-renewal': 'ended',
    });
    expect(VIEWS).toContain("SA.pill('ended', 'Access ended')");
    expect(VIEWS).toContain("SA.pill('warn', 'Reminder due')");
    expect(VIEWS).toContain("renOpen ? 'info' : 'ok', renOpen ? 'Renewal in progress'");
  });
});

describe('SA-07 “Needs attention” — access ending (B7-03 `att`, konark)', () => {
  it('reads as B7-03 draws Konark and opens Operations › Access ending', () => {
    expect(B7_03).toContain(
      `["${attentionReminderDue('2 Nov 2026')}", "${ATTENTION_ACCESS_ENDING}", "sops"]`,
    );
  });
});

describe('the Phase-6 operations state-copy entries', () => {
  const entries = Object.entries(STATE_COPY_OPERATIONS_6);

  it.each(entries)('%s is in the one register, with its decisions', (id, entry) => {
    expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
    expect(['SA-07', 'SA-20', 'SA-21', 'SA-22']).toContain(entry.screen);
    expect(entry.decisions?.length).toBeGreaterThan(0);
    // Decision ids never appear in visible copy; words use the typographic apostrophe.
    if (entry.words !== null) {
      expect(entry.words).not.toMatch(/\b[A-Z]{1,3}-\d{2}\b/);
      expect(entry.words).not.toMatch(INTERNAL);
      expect(entry.words).not.toContain("'");
    }
  });

  it('the owner-approved words are the export’s', () => {
    for (const [, entry] of entries) {
      if (entry.words === null || entry.status !== 'owner-approved') continue;
      expect(VIEWS).toContain(entry.words);
    }
  });

  it('no visible words carry an internal reference or a decision id', () => {
    for (const phrase of [
      ...strings(SUPPORT_LIST),
      ...strings(REPORT_PAGE),
      ...strings(ACCESS_ENDING),
    ]) {
      expect(phrase).not.toMatch(/\b[A-Z]{1,3}-\d{2}\b/);
      expect(phrase).not.toMatch(INTERNAL);
    }
  });
});
