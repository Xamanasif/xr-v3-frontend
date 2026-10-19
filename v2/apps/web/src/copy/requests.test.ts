/**
 * The words of SA-02 and SA-03 are the owner-approved Super Admin export's (design/v3-refined-b/
 * roles/SA-v1: `sa-views-a.js`, `sa-core.js`, and the sentence forms of its sample records in
 * `sa-data.js`); the words of XS-01 are the owner-approved XS export's (sign-in; it keeps B1-09's
 * words). Each drawn phrase is found verbatim in its export's source; the field words equal the
 * contract catalogue's; and nothing undrawn is written here without a state-copy entry.
 */
import { describe, expect, it } from 'vitest';

import { board, saExport, xsExport } from '@/test-support/boards';

import {
  CONFIRM_DIALOG,
  CONFIRM_LINES,
  DECISION_ACTIONS,
  DECISION_CHOICES,
  DECISION_ERRORS,
  DECISION_PAGE,
  FORMAT_WORDS,
  FOUR_EVENTS,
  NEXT_LINES,
  PAUSED_BLOCK,
  PENDING_HINTS,
  REASON_FIELD,
  REQUEST_TYPE_WORDS,
  REQUESTS_PAGE,
  ROUTE_CHOICE,
  SMALLER_SCOPE,
  STAND,
  confirmTitle,
  decidedMeta,
  requestRowLinkLabel,
} from './requests';
import { SIGN_IN, SIGN_IN_NOTICES } from './sign-in';

/**
 * A board's text with tags removed, followed by its raw markup: words drawn as attributes
 * (`placeholder`, `aria-label`) are found in the markup itself.
 */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ')}\n${raw}`;
}

const B1_09 = words('B1-09-Sign-In.dc.html');

/** The SA export's views, runtime and sample records, as one source of drawn words. */
const SA = ['sa-views-a.js', 'sa-core.js', 'sa-data.js'].map(saExport).join('\n');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('SA-02 words are the SA export’s (`V.requests`)', () => {
  it.each(strings(REQUESTS_PAGE))('%s', (text) => {
    expect(SA).toContain(text);
  });

  it.each(Object.values(REQUEST_TYPE_WORDS))('type “%s”', (text) => {
    expect(SA).toContain(text);
  });

  it('a row link names the request by its institution, never by its reference', () => {
    const name = requestRowLinkLabel(
      'Konark Polytechnic',
      'additional-licences',
      '2026-09-29T07:07:00.000Z',
      'Under review',
    );
    expect(name).toBe(
      'Konark Polytechnic, additional licences, received 29 Sep 2026, Under review. Open the request',
    );
    expect(SA).toContain(". Open the request') + '\">'");
  });
});

describe('SA-03 words are the SA export’s (`V.decision`, `SA.DLG.approveReq`)', () => {
  const { activePlanUnchanged, ...drawnNext } = NEXT_LINES;
  const drawn = [
    ...strings(DECISION_PAGE),
    ...strings(FOUR_EVENTS),
    ...strings(DECISION_CHOICES),
    ...strings(ROUTE_CHOICE),
    ...strings(SMALLER_SCOPE),
    ...strings(REASON_FIELD),
    ...strings(DECISION_ACTIONS),
    ...strings(PENDING_HINTS),
    ...strings(PAUSED_BLOCK),
    ...strings(drawnNext),
    ...strings(CONFIRM_LINES),
    ...strings(CONFIRM_DIALOG),
    ...strings(FORMAT_WORDS),
    ...strings(DECISION_ERRORS),
    ...strings({
      keys: [STAND.institutionRecord, STAND.request, STAND.payment, STAND.access],
      values: [
        STAND.notCreated,
        STAND.exists,
        STAND.informationRequested,
        STAND.paymentNotStarted,
        STAND.paymentNotNeeded,
        STAND.paymentWaiting,
        STAND.paymentNotConfirmed,
        STAND.accessNotActive,
        STAND.accessUnchanged,
      ],
    }),
  ];
  it.each(drawn.filter((text) => text.trim().length > 1))('%s', (text) => {
    expect(SA).toContain(text.trim());
  });

  it('an approval whose plan effect is open never claims the plan — written from the export’s own phrases', () => {
    expect(activePlanUnchanged).toBe(
      `${NEXT_LINES.active} The current plan isn’t changed from this page.`,
    );
    expect(SA).toContain('Institutional access is active.');
    expect(SA).toContain('The current plan isn’t changed from this page');
  });

  it('the confirmation and the decided line name the institution and the route in words', () => {
    expect(confirmTitle(false, false, 'Godavari Institute of Technology')).toBe(
      'Approve the request from Godavari Institute of Technology?',
    );
    expect(confirmTitle(false, true, 'BITS Pilani — Hyderabad Campus')).toBe(
      'Approve the renewal from BITS Pilani — Hyderabad Campus?',
    );
    expect(confirmTitle(true, false, 'Konark Polytechnic')).toBe(
      'Approve a smaller scope for Konark Polytechnic?',
    );
    for (const form of [
      "'Approve a smaller scope for '",
      "'Approve the renewal from '",
      "'Approve the request from '",
    ]) {
      expect(SA).toContain(form);
    }
    expect(
      decidedMeta({ kind: 'approval', at: '2026-10-08T04:35:00.000Z', route: 'external' }, null),
    ).toBe('Decided by you on 8 Oct 2026, 10:05, external');
    expect(decidedMeta({ kind: 'information', at: '2026-10-08T04:35:00.000Z' }, null)).toBe(
      'Sent by you on 8 Oct 2026, 10:05',
    );
    expect(SA).toContain("'Decided by you on ' + s.when + ', ' + rl(rt)");
    expect(SA).toContain("'Sent by you on ' + s.when");
  });
});

/**
 * The owner-approved Entry & shared export's sign-in (`XsSignIn`, design/v3-refined-b/roles/XS-v6),
 * read as B1-09 is: its text with tags removed, then its raw source. It keeps B1-09's words.
 */
const XS_SIGN_IN = (() => {
  const raw = xsExport('XsSignIn.dc.html');
  return `${raw.replace(/<[^>]+>/g, '')}\n${raw}`;
})();

describe('XS-01 / XS-03 / XS-04 words are the XS export’s', () => {
  const { backHref, requestAccessHref, formLabel, ...words } = SIGN_IN;
  const drawn = [
    ...strings(words),
    ...strings({
      wrong: SIGN_IN_NOTICES.wrongDetails,
      sso: SIGN_IN_NOTICES.ssoUnavailable,
      signedOut: SIGN_IN_NOTICES.signedOut,
      expired: [SIGN_IN_NOTICES.expired.title, SIGN_IN_NOTICES.expired.before],
    }),
  ];
  it.each(drawn.filter((text) => text.trim().length > 1))('%s', (text) => {
    expect(XS_SIGN_IN).toContain(text.trim());
  });

  it('the two ways out go where the XS link map sends them (PU-04, PU-08)', () => {
    expect([backHref, requestAccessHref]).toEqual(['/experiments', '/request-access']);
    expect(XS_SIGN_IN).toContain(
      'Back to experiments opens the public catalogue (PU-04), designed by the Public workstream.',
    );
    expect(XS_SIGN_IN).toContain(
      'Request institutional access opens the public request form (PU-08), designed by the Public workstream.',
    );
  });

  it('the form’s name and the inactive refusal (SES-09, no XS state) keep B1-09’s words', () => {
    expect(B1_09).toContain(formLabel);
    expect(B1_09).toContain(SIGN_IN_NOTICES.inactive.title);
    expect(B1_09).toContain(SIGN_IN_NOTICES.inactive.line);
  });
});
