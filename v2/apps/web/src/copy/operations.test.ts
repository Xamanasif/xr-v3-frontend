/**
 * The words of the Operations head, SA-18 Device transfers and SA-19 Device transfer decision are
 * the owner-approved Super Admin export's (design/v3-refined-b/roles/SA-v1, `sa-views-d.js`
 * `opsHead`, `V.transfers`, `V.transfer`, `SA.DLG.approveDtr`; `sa-core.js` dialogs): each fixed
 * phrase is found verbatim in its views, and the composed ones are checked against the views'
 * expressions. The SA-07 device-transfer row keeps B7-03's words. No Super Admin word carries an
 * internal reference or a decision id.
 */
import { POLICY_WORD_TERMS } from '@xr/config/policy-terms';
import { describe, expect, it } from 'vitest';

import { board, saExport } from '@/test-support/boards';

import { TRANSFER_ACTIONS, transferWords, wordsOf } from './flow-state-words';
import {
  approvedFlashLine,
  approvedNextWords,
  approvedOnWords,
  approvingMovesWords,
  ATTENTION_OPERATIONS,
  attentionTransfer,
  confirmNowItems,
  confirmTitle,
  DECISION_PAGE,
  decisionTitle,
  forwardedByWords,
  formatValue,
  HISTORY_WORDS,
  OPERATIONS_PAGE,
  quotedNote,
  studentWords,
  transferKindWords,
  transferRowLabel,
  transfersCaption,
  TRANSFERS_LIST,
} from './operations';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_OPERATIONS } from './state-copy-operations';

const VIEWS = saExport('sa-views-d.js');
const CORE = saExport('sa-core.js');
const DATA = saExport('sa-data.js');
const B7_03 = board('B7-03-Institution-Detail.dc.html');

/** The export's own linked-control names (`LINK-MAP.json`). */
const LINK_MAP = saExport('../LINK-MAP.json');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const INTERNAL = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/**
 * The export's three device-transfer sentences that carry words the repository's business-rule
 * scan forbids in copy (B8-03 "Decline / Reject 0", "0 shipping words"): the product says the
 * same without them — "send" for "ship", and the "There is no Decline" clause left out (no Decline
 * is drawn, T-32). Product words → the export's (SA-INTEGRATION-RECORD, differences).
 */
const POLICY_REWORDED: Readonly<Record<string, string>> = {
  [TRANSFERS_LIST.foot]:
    'Approving moves a student’s authorisation to a new device. It doesn’t ship, collect or register a device. There is no Decline; a transfer BITS doesn’t approve stays Forwarded.',
  [DECISION_PAGE.noDecline]:
    'Nothing is shipped, collected or registered from here. There is no Decline; a transfer BITS doesn’t approve stays Forwarded.',
  [DECISION_PAGE.notShipped]: 'Nothing is shipped, collected or registered from here.',
};

const exportPhrase = (phrase: string): string => POLICY_REWORDED[phrase] ?? phrase;

describe('the export sentences reworded for the business-rule scan (B8-03)', () => {
  const policy = POLICY_WORD_TERMS.filter((term) =>
    ['decline-reject', 'shipping-words'].includes(term.id),
  );
  it.each(Object.entries(POLICY_REWORDED))(
    '“%s” rewords the export’s “%s”',
    (product, original) => {
      expect(`${VIEWS}\n${CORE}`).toContain(original);
      expect(policy.some((term) => term.pattern.test(original))).toBe(true);
      for (const term of policy) expect(product, term.id).not.toMatch(term.pattern);
    },
  );
});

describe('the Operations head and tabs (SA-v1 `opsHead`)', () => {
  it.each(strings(OPERATIONS_PAGE))('“%s” is in the export’s views', (phrase) => {
    expect(VIEWS).toContain(phrase);
  });
});

describe('SA-18 Operations › Device transfers (SA-v1 `V.transfers`)', () => {
  it.each(strings(TRANSFERS_LIST))('“%s” is in the export’s views', (phrase) => {
    expect(VIEWS).toContain(exportPhrase(phrase));
  });

  it('the composed words follow the views’ expressions', () => {
    expect(VIEWS).toContain("<caption>Device transfers, ' + esc(tabs.find");
    expect(transfersCaption('Approved')).toBe('Device transfers, Approved');
    expect(VIEWS).toContain("esc(t.fmt) + ' device transfer</span>");
    expect(transferKindWords('vr')).toBe('VR device transfer');
    expect(VIEWS).toContain(
      "esc(t.fmt + ' device transfer for ' + t.student + ', ' + DTR_LBL[t.st][1] + '. Open')",
    );
    expect(transferRowLabel('vr', 'Rahul Verma', 'Forwarded')).toBe(
      'VR device transfer for Rahul Verma, Forwarded. Open',
    );
    expect(LINK_MAP).toContain(transferRowLabel('vr', 'Rahul Verma', 'Forwarded'));
    expect(DATA).toContain(`fwdBy: '${forwardedByWords('Meera Iyer', 'Institute Admin')}'`);
  });

  it('the status words are the shared Super Admin words, as the export writes them', () => {
    for (const state of ['with-institute-admin', 'forwarded', 'approved'] as const) {
      expect(VIEWS).toContain(`'${wordsOf(transferWords(state, 'super_admin'))!}'`);
    }
  });
});

describe('SA-19 Device transfer decision (SA-v1 `V.transfer`, `SA.DLG.approveDtr`)', () => {
  it.each([...strings(DECISION_PAGE), TRANSFER_ACTIONS.approve])(
    '“%s” is in the export’s views or its dialog helper',
    (phrase) => {
      expect(`${VIEWS}\n${CORE}`).toContain(exportPhrase(phrase));
    },
  );

  it('the composed sentences follow the views’ expressions', () => {
    expect(VIEWS).toContain("esc(t.fmt + ' device transfer for ' + t.student)");
    expect(decisionTitle('vr', 'Rahul Verma')).toBe('VR device transfer for Rahul Verma');
    expect(VIEWS).toContain("t.student + (t.studentNo ? ' · ' + t.studentNo : '')");
    expect(studentWords('Rahul Verma', 'GIT-2026-0418')).toBe('Rahul Verma · GIT-2026-0418');
    expect(studentWords('Imran Shaikh', null)).toBe('Imran Shaikh');
    expect(VIEWS).toContain("t.fmt + (t.exp ? ' for ' + t.exp : '')");
    expect(formatValue('vr', 'Shell-and-Tube Heat Exchanger')).toBe(
      'VR for Shell-and-Tube Heat Exchanger',
    );
    expect(formatValue('vr', null)).toBe('VR');
    expect(VIEWS).toContain("'“' + t.note + '”'");
    expect(quotedNote('x')).toBe('“x”');
    expect(VIEWS).toContain(
      "Approving moves ' + esc(t.student) + '’s ' + esc(t.fmt) + ' authorisation to the new device.",
    );
    expect(approvingMovesWords('Rahul Verma', 'vr')).toBe(
      'Approving moves Rahul Verma’s VR authorisation to the new device.',
    );
    expect(VIEWS).toContain(
      "title: 'Approve the ' + t.fmt + ' device transfer for ' + t.student + '?'",
    );
    expect(confirmTitle('vr', 'Rahul Verma')).toBe(
      'Approve the VR device transfer for Rahul Verma?',
    );
    expect(VIEWS).toContain("t.student + '’s ' + t.fmt + ' authorisation moves from '");
    expect(VIEWS).toContain("t.student + ' and the Institute Admin see “Approved”.'");
    expect(confirmNowItems('Rahul Verma', 'vr', 'A', 'B')).toEqual([
      'Rahul Verma’s VR authorisation moves from A to B.',
      'Rahul Verma and the Institute Admin see “Approved”.',
    ]);
    expect(VIEWS).toContain("t.student + ' and the Institute Admin now see “Approved”.'");
    expect(approvedFlashLine('Rahul Verma')).toBe(
      'Rahul Verma and the Institute Admin now see “Approved”.',
    );
    expect(VIEWS).toContain("Approved on ' + esc(t.apprWhen) + ' by '");
    expect(approvedOnWords('24 Oct 2026, 12:30', 'Arjun Mehta')).toBe(
      'Approved on 24 Oct 2026, 12:30 by Arjun Mehta',
    );
    expect(VIEWS).toContain(
      "esc(t.student) + ' and the Institute Admin see “Approved”. This decision is read-only.",
    );
    expect(approvedNextWords('Rahul Verma')).toBe(
      'Rahul Verma and the Institute Admin see “Approved”. This decision is read-only.',
    );
  });

  it('the history lines are the export’s (`hist`, `trGo`)', () => {
    expect(VIEWS).toContain(
      "['Approved by Arjun Mehta', when, 'The ' + t.fmt + ' authorisation moved to the new device.']",
    );
    expect(HISTORY_WORDS.approved('Arjun Mehta')).toBe('Approved by Arjun Mehta');
    expect(HISTORY_WORDS.approvedNote('vr')).toBe('The VR authorisation moved to the new device.');
    expect(DATA).toContain(
      `['${HISTORY_WORDS.forwarded}', '23 Oct 2026, 10:00', '${HISTORY_WORDS.by('Meera Iyer', 'Institute Admin')}']`,
    );
    expect(DATA).toContain(
      `['${HISTORY_WORDS.requested}', '22 Oct 2026, 09:10', '${HISTORY_WORDS.by('Rahul Verma', 'Student')}']`,
    );
    expect(HISTORY_WORDS.by('Rahul Verma', null)).toBe('By Rahul Verma.');
  });
});

describe('SA-07 “Needs attention” — the device-transfer row (B7-03 `att`)', () => {
  it('reads as B7-03 draws DTR-0018 and opens Operations', () => {
    expect(B7_03).toContain(
      `["${attentionTransfer('DTR-0018', '23 Oct 2026')}", "${ATTENTION_OPERATIONS}", "sops"]`,
    );
  });
});

describe('the operations state-copy entries', () => {
  it('are in the one register, each for SA-18 or SA-19', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_OPERATIONS)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(['SA-18', 'SA-19']).toContain(entry.screen);
    }
  });

  it('the owner-approved words are the export’s', () => {
    for (const entry of Object.values(STATE_COPY_OPERATIONS)) {
      if (entry.status !== 'owner-approved' || entry.words === null) continue;
      expect(VIEWS).toContain(entry.words);
    }
  });

  it('no visible words carry an internal reference or a decision id', () => {
    for (const phrase of [
      ...strings(OPERATIONS_PAGE),
      ...strings(TRANSFERS_LIST),
      ...strings(DECISION_PAGE),
      ...Object.values(STATE_COPY_OPERATIONS).flatMap((entry) =>
        entry.words === null ? [] : [entry.words],
      ),
    ]) {
      expect(phrase).not.toMatch(/\b[A-Z]{1,3}-\d{2}\b/);
      expect(phrase).not.toMatch(INTERNAL);
    }
  });
});
