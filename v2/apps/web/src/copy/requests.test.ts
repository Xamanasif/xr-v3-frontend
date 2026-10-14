/**
 * The words of SA-02, SA-03 and XS-01 are the frozen boards' (B1-09, B1-10, B1-11): each drawn
 * phrase is found verbatim in its board's markup or script; the field words equal the contract
 * catalogue's; and nothing undrawn is written here without a state-copy entry.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

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

describe('XS-01 / XS-03 / XS-04 words are on B1-09', () => {
  const drawn = [
    ...strings(SIGN_IN),
    ...strings({
      wrong: SIGN_IN_NOTICES.wrongDetails,
      sso: SIGN_IN_NOTICES.ssoUnavailable,
      signedOut: SIGN_IN_NOTICES.signedOut,
      inactive: SIGN_IN_NOTICES.inactive,
      expired: [SIGN_IN_NOTICES.expired.title, SIGN_IN_NOTICES.expired.before],
    }),
  ];
  it.each(drawn.filter((text) => text.trim().length > 1))('%s', (text) => {
    expect(B1_09).toContain(text.trim());
  });
});
