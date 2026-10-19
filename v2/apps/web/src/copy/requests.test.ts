/**
 * The words of SA-02, SA-03 and XS-01 are the frozen boards' (B1-10, B1-11) and the owner-approved
 * XS export's (sign-in; it keeps B1-09's words): each drawn
 * phrase is found verbatim in its board's markup or script; the field words equal the contract
 * catalogue's; and nothing undrawn is written here without a state-copy entry.
 */
import { describe, expect, it } from 'vitest';

import { board, xsExport } from '@/test-support/boards';

import {
  CONFIRM_LINES,
  DECISION_ACTIONS,
  DECISION_CHOICES,
  DECISION_PAGE,
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
const B1_10 = words('B1-10-SA-Requests.dc.html');
const B1_11 = words('B1-11-SA-Decision.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('SA-02 words are on B1-10', () => {
  it.each(strings(REQUESTS_PAGE).filter((text) => !['Search', 'Status', 'Type'].includes(text)))(
    '%s',
    (text) => {
      expect(B1_10).toContain(text);
    },
  );

  it.each(Object.values(REQUEST_TYPE_WORDS))('type “%s”', (text) => {
    expect(B1_10).toContain(text);
  });
});

describe('SA-03 words are on B1-11', () => {
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
    ...strings(NEXT_LINES),
    ...strings(CONFIRM_LINES),
    ...strings({
      label: STAND.label,
      keys: [STAND.institutionRecord, STAND.request, STAND.payment, STAND.access],
      values: [STAND.notCreated, STAND.exists, STAND.paymentNotNeeded, STAND.paymentWaiting],
    }),
  ];
  it.each(drawn.filter((text) => text.trim().length > 1))('%s', (text) => {
    expect(B1_11).toContain(text.trim());
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
