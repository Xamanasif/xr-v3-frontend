/**
 * The words of SA-20 Support, SA-21 Support report and SA-22 Access ending are the frozen boards':
 * B7-09 (f4 … f14), B7-10 f12, f13 and B7-03 for SA-07's access-ending row. Each fixed phrase is
 * found verbatim in the boards' markup or script; the composed ones are checked against the
 * boards' own samples (SUP-0213, SUP-0198, SUP-0189, BITS Hyderabad, Konark, Malnad) and the
 * script expressions that compose them. The two sentences B7-09 writes with a decision id are
 * shown without it (P1-14). Undrawn words are provisional register entries, not on the boards.
 */
import { describe, expect, it } from 'vitest';

import { OPERATIONS_TABS } from '@/nav/operations';
import { board } from '@/test-support/boards';

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
  OPERATIONS_6_META,
  openInstitutionLabel,
  openInstitutionWords,
  openReportLabel,
  openRequestLabel,
  planLine,
  quoted,
  REOPEN_EFFECT,
  reopenedByWords,
  reopenedFlash,
  reopenTitle,
  renewalLine,
  REPORT_HISTORY,
  REPORT_PAGE,
  resolvedFlash,
  resolvedOnWords,
  sentWords,
  STANDING_TONE,
  STRIPPED_OPERATIONS,
  SUPPORT_LIST,
  SUPPORT_STATUS,
} from './operations-6';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_OPERATIONS_6 } from './state-copy-operations-6';

/** A board's text with tags removed and entities read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  const text = raw
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
  return `${text}\n${raw}`;
}

const B7_09 = words('B7-09-Operations.dc.html');
const B7_10 = words('B7-10-Critical-States.dc.html');
const B7_03 = words('B7-03-Institution-Detail.dc.html');
const B3_11 = words('B3-11-SA-Device-Transfers.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('the Operations page and its three tabs (B7-09 f0, f4, f7)', () => {
  it('the tab words are B3-11’s and B7-09’s, in the order and at the addresses nav names them', () => {
    expect(OPERATIONS_TABS.map((tab) => OPERATIONS_PAGE.tabs[tab.key])).toEqual([
      'Device transfers',
      'Support',
      'Access ending',
    ]);
    for (const tab of OPERATIONS_TABS) {
      expect(tab.label).toBe(OPERATIONS_PAGE.tabs[tab.key]);
      expect(B7_09).toContain(`>${tab.label}</a>`);
      expect(B3_11).toContain(`>${tab.label}</a>`);
    }
  });

  it('Support and Access ending keep their frames’ meta; Device transfers keeps f0’s', () => {
    expect(B7_09).toContain(`<span class="xl-meta">${OPERATIONS_6_META}</span>`);
    expect(B7_09).toContain(`<div class="xr-phead-meta">${OPERATIONS_PAGE.meta}</div>`);
    expect(B7_10).toContain(OPERATIONS_6_META);
  });
});

describe('SA-20 Operations › Support (B7-09 f7, f13)', () => {
  it.each([
    ...strings(SUPPORT_LIST),
    ...Object.values(SUPPORT_STATUS).map((status) => status.words),
  ])('“%s” is on B7-09', (phrase) => {
    expect(B7_09).toContain(phrase);
  });

  it('the status tones are B7-09’s (`stk`)', () => {
    expect(B7_09).toContain('"stk": {"open": "info", "resolved": "ok", "reopened": "wait"}');
    expect(Object.fromEntries(Object.entries(SUPPORT_STATUS).map(([k, v]) => [k, v.tone]))).toEqual(
      { open: 'info', resolved: 'ok', reopened: 'wait' },
    );
  });

  it('the composed cells read as the board draws SUP-0213 and SUP-0207', () => {
    // `sent: 'Sent ' + x.sent` with SUP-0213's `"sent": "3 Oct 2026"`.
    expect(B7_09).toContain("sent: 'Sent ' + x.sent");
    expect(B7_09).toContain('"sent": "3 Oct 2026"');
    expect(sentWords('3 Oct 2026')).toBe('Sent 3 Oct 2026');
    expect(B7_09).toContain("aria: 'Open ' + x.id + ' ' + x.title");
    expect(openReportLabel('SUP-0213', 'X')).toBe('Open SUP-0213 X');
    expect(B7_09).toContain(
      `"who": "${fromWords('Rahul Verma', 'student', 'Godavari Institute of Technology')}"`,
    );
    expect(B7_09).toContain(`"who": "${fromWords('Kavya Nair', 'content_manager', null)}"`);
    expect(B7_09).toContain(
      `"who": "${fromWords('Meera Iyer', 'tenant_admin', 'Godavari Institute of Technology')}"`,
    );
  });
});

describe('SA-21 Support report (B7-09 f8 … f12, f14; B7-10 f12)', () => {
  it.each([...strings(REPORT_PAGE), ...strings(REPORT_HISTORY), REOPEN_EFFECT])(
    '“%s” is on B7-09',
    (phrase) => {
      expect(B7_09).toContain(phrase);
    },
  );

  it('the composed lines read as the board draws SUP-0198, SUP-0211 and SUP-0189', () => {
    expect(B7_09).toContain(
      quoted('The lab brief link was updated. It now opens the brief in a new tab.'),
    );
    // `Earlier note: {{ Sd.prevNote }}`, the quoted note of SUP-0211's resolution (`hist`).
    expect(B7_09).toContain('Earlier note: {{ Sd.prevNote }}');
    expect(B7_09).toContain(quoted('The import now finishes. Please try the file again.'));
    expect(earlierNoteWords('The import now finishes. Please try the file again.')).toBe(
      'Earlier note: “The import now finishes. Please try the file again.”',
    );
    expect(reopenTitle('SUP-0189')).toBe('Reopen SUP-0189?');
    // `rResolved = 'Resolved on ' + r.resolved + ' by ' + (r.by || D.sa)` for SUP-0198.
    expect(B7_09).toContain("'Resolved on ' + r.resolved + ' by ' + (r.by || D.sa)");
    expect(B7_09).toContain('"resolved": "23 Sep 2026"');
    expect(resolvedOnWords('23 Sep 2026', 'Arjun Mehta')).toBe(
      'Resolved on 23 Sep 2026 by Arjun Mehta',
    );
    expect(B7_09).toContain("'Reopen ' + r.id + '?'");
    expect(B7_09).toContain('>Open {{ Sd.rInst }}</a>');
    expect(openInstitutionWords('Godavari Institute of Technology')).toBe(
      'Open Godavari Institute of Technology',
    );
    // The flashes and the Super Admin's reopening (`resolve`, `doReopen`).
    expect(B7_09).toContain("flash: r.id + ' resolved. The reporter sees your note.'");
    expect(resolvedFlash('SUP-0213')).toBe('SUP-0213 resolved. The reporter sees your note.');
    expect(B7_09).toContain("flash: r.id + ' is open again. The reporter sees it is reopened.'");
    expect(reopenedFlash('SUP-0189')).toBe(
      'SUP-0189 is open again. The reporter sees it is reopened.',
    );
    expect(B7_09).toContain("['Reopened', w, 'By ' + D.sa + '.']");
    expect(reopenedByWords('Arjun Mehta')).toBe('By Arjun Mehta.');
  });

  it('the drawn note error is the contract’s (B7-09 f11; B7-10 f12)', () => {
    expect(B7_09).toContain('Add a note — the reporter sees it');
    expect(B7_10).toContain('Add a note — the reporter sees it');
  });
});

describe('SA-22 Operations › Access ending (B7-09 f4, f5, f6; B7-10 f13)', () => {
  it.each(strings(ACCESS_ENDING))('“%s” is on B7-09 and B7-10 f13', (phrase) => {
    expect(B7_09).toContain(phrase);
    if (!phrase.startsWith('No access') && !phrase.startsWith('Institutions whose'))
      expect(B7_10).toContain(phrase);
  });

  it('the composed cells read as the board draws BITS Hyderabad, Konark and Malnad', () => {
    for (const phrase of [
      asOfWords('23 Oct 2026'),
      planLine('ACC-0098', 'internal'),
      planLine('ACC-0091', 'external'),
      daysLeftWords(8),
      daysLeftWords(10),
      endedAgoWords(8),
      renewalLine('REQ-0038', 'Under review'),
      `aria-label="${openRequestLabel('REQ-0038')}"`,
      `aria-label="${openInstitutionLabel('Konark Polytechnic')}"`,
    ]) {
      expect(B7_09).toContain(phrase);
    }
    expect(renewalLine('REQ-0038', null)).toBe('REQ-0038');
    expect([daysLeftWords(1), endedAgoWords(1)]).toEqual(['1 day left', 'Ended 1 day ago']);
  });

  it('the chip tones are B7-09’s', () => {
    expect(STANDING_TONE).toEqual({
      'renewal-in-progress': 'info',
      'reminder-due': 'wait',
      'ended-no-renewal': 'off',
    });
    for (const [kind, tone] of Object.entries(STANDING_TONE)) {
      const words = ACCESS_ENDING.standing[kind as keyof typeof STANDING_TONE];
      expect(B7_09).toMatch(new RegExp(`xr-status--${tone}"><svg[^]*?</svg>${words}<`));
    }
  });
});

describe('P1-14: the two B7-09 sentences with a decision id are shown without it', () => {
  it.each(Object.entries(STRIPPED_OPERATIONS))('%s', (_key, sentence) => {
    expect(B7_09).toContain(sentence.drawn);
    expect(sentence.words).toBe(sentence.drawn.replace(` (${sentence.ids[0]})`, ''));
    expect(sentence.words).not.toMatch(/\b[A-Z]{1,3}-\d{2}\b/);
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
    if (entry.status === 'provisional') expect(entry.decisions?.length).toBeGreaterThan(0);
    // Decision ids never appear in visible copy; words use the typographic apostrophe.
    if (entry.words !== null) {
      expect(entry.words).not.toMatch(/\b[A-Z]{1,3}-\d{2}\b/);
      expect(entry.words).not.toContain("'");
    }
  });

  it('the undrawn words are not on the boards; the drawn ones are board 03’s', () => {
    for (const [, entry] of entries) {
      if (entry.words === null) continue;
      if (entry.status === 'drawn') {
        expect(words('03-Core-Components.dc.html')).toContain(entry.words);
        continue;
      }
      expect(B7_09).not.toContain(entry.words);
      expect(B7_10).not.toContain(entry.words);
    }
  });

  it('no visible words carry a decision id (P1-14)', () => {
    for (const phrase of [
      OPERATIONS_6_META,
      ...strings(SUPPORT_LIST),
      ...strings(REPORT_PAGE),
      ...strings(ACCESS_ENDING),
      REOPEN_EFFECT,
      STRIPPED_OPERATIONS.noResponseTarget.words,
      STRIPPED_OPERATIONS.reminderStatusOnly.words,
    ]) {
      expect(phrase).not.toMatch(/\b[A-Z]{1,3}-\d{2}\b/);
    }
  });
});
