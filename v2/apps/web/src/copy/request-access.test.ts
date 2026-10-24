/**
 * The public request's words are the frozen boards' (B1-06 Your selection, B1-07 Request access,
 * B1-08 Request status and Payment; Package 1C): each drawn phrase is found verbatim in its board's
 * markup or script, the composed lines follow the boards' formulas, and nothing names a cart, a
 * checkout, a price, an amount, a payment method or provider, or "mark paid". What no board words
 * comes from the state-copy register (`state-copy.test.ts`).
 */
import type { RequesterRequestView } from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  NEXT_ACTION,
  PAYMENT,
  REQUEST_ACCESS,
  REQUEST_FORM,
  REQUEST_REVIEW,
  REQUEST_SENT,
  REQUEST_STATUS,
  REQUEST_STEPS,
  SELECTION,
  SELECTION_LINK,
  TERM_CHOICES,
  editLabel,
  experimentCount,
  formatCount,
  formatOption,
  formatsLegend,
  itemsLine,
  paymentLead,
  removeLabel,
  removedWords,
  requestInProgressWords,
  requesterHistory,
  selectionBarWords,
  selectionLinkName,
  statusHead,
  updatedWords,
} from './request-access';
import { STATE_COPY } from './state-copy';

/** A board's text with tags removed (entities read), then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  const text = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ');
  return `${text}\n${raw.replace(/&amp;/g, '&')}`;
}

const B1_06 = words('B1-06-Selection.dc.html');
const B1_07 = words('B1-07-Request-Access.dc.html');
const B1_08 = words('B1-08-Request-Status.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

/** Words no page of the public request may use (B1-06 "Words", B1-08 "Payment (PU-12)"). */
const NEVER =
  /\b(?:cart|basket|checkout|check out|buy|price|prices|₹|INR|amount|card|UPI|net ?banking|refund|mark paid|paid)\b/i;

describe('PU-07 Your selection is B1-06’s', () => {
  it.each([...strings(SELECTION), SELECTION_LINK, REQUEST_ACCESS])('%s', (text) => {
    expect(B1_06).toContain(text);
  });

  it('the stepper is the request’s four steps (B1-06, B1-07 `ol.xr-steps`)', () => {
    expect(B1_06).toContain(`aria-label="${REQUEST_STEPS.label}"`);
    for (const step of REQUEST_STEPS.steps) {
      expect(B1_06).toContain(`<span class="xr-step-label">${step}</span>`);
      expect(B1_07).toContain(`<span class="xr-step-label">${step}</span>`);
    }
  });

  it('the composed lines follow the board’s formulas', () => {
    expect(B1_06).toContain("plural(n, 'experiment')");
    expect(experimentCount(1)).toBe('1 experiment');
    expect(experimentCount(2)).toBe('2 experiments');
    expect(formatCount(1)).toBe('1 format');
    expect(formatCount(3)).toBe('3 formats');
    expect(selectionBarWords(1, 2)).toBe('1 experiment · 2 formats');
    expect(selectionLinkName(0)).toBe('Selection, empty');
    expect(selectionLinkName(1)).toBe('Selection, 1 experiment');
    expect(B1_06).toContain(
      "selAria: n ? 'Selection, ' + plural(n, 'experiment') : 'Selection, empty'",
    );
    expect(removedWords('Shell-and-Tube Heat Exchanger')).toBe(
      'Removed Shell-and-Tube Heat Exchanger from your selection.',
    );
    expect(B1_06).toContain("'Removed ' + ");
    expect(B1_06).toContain(" + ' from your selection.'");
    expect(removeLabel('Shell-and-Tube Heat Exchanger')).toBe(
      'Remove Shell-and-Tube Heat Exchanger from your selection',
    );
    expect(B1_06).toContain("'Remove ' + ");
    expect(formatsLegend('Shell-and-Tube Heat Exchanger')).toBe(
      'Formats for Shell-and-Tube Heat Exchanger',
    );
    expect(B1_06).toContain("'Formats for ' + ");
    expect(formatOption('web')).toBe('WEB · Browser');
    expect(formatOption('vr')).toBe('VR · Virtual reality');
    expect(B1_06).toContain("f + ' · ' + FN[f]");
  });

  it('never a cart, a checkout or a price', () => {
    for (const text of strings(SELECTION)) expect(text).not.toMatch(NEVER);
  });

  it('the request in progress line is the owner’s words, named by the institution (state-copy `PU-07.request-in-progress`)', () => {
    expect(STATE_COPY['PU-07.request-in-progress']).toMatchObject({
      words: 'You have a request in progress',
      status: 'owner-approved',
    });
    expect(requestInProgressWords('Godavari Institute of Technology')).toBe(
      'You have a request in progress for Godavari Institute of Technology.',
    );
    expect(requestInProgressWords('Godavari Institute of Technology')).not.toMatch(NEVER);
    // Its link is PU-09's own "Check request status" (B1-07).
    expect(B1_07).toContain(REQUEST_SENT.checkStatus);
  });
});

describe('PU-08 Request institutional access and PU-09 Request sent are B1-07’s', () => {
  it.each([...strings(REQUEST_FORM), ...strings(REQUEST_REVIEW), ...strings(REQUEST_SENT)])(
    '%s',
    (text) => {
      expect(B1_07).toContain(text);
    },
  );

  it('the four access terms and their sub-lines, in drawn order', () => {
    expect(B1_07).toContain(
      "['Monthly', 'Quarterly', 'Yearly', 'Until a fixed date'].map((t, i) =>",
    );
    expect(TERM_CHOICES.map((choice) => choice.title)).toEqual([
      'Monthly',
      'Quarterly',
      'Yearly',
      'Until a fixed date',
    ]);
    for (const choice of TERM_CHOICES) expect(B1_07).toContain(choice.sub);
  });

  it('“Edit …” names its answer; the acronym BITS keeps its case (PROVISIONAL, PU-08.edit-label)', () => {
    expect(B1_07).toContain("editLabel: 'Edit ' + r.k.toLowerCase()");
    expect(editLabel('Contact person')).toBe('Edit contact person');
    expect(editLabel('E-mail')).toBe('Edit e-mail');
    expect(editLabel('Message to BITS')).toBe('Edit message to BITS');
  });

  it('asks nothing about internal or external, payment or prices', () => {
    for (const text of [...strings(REQUEST_FORM), ...strings(REQUEST_REVIEW)]) {
      expect(text).not.toMatch(NEVER);
      expect(text).not.toMatch(/\b(?:internal|external)\b/i);
    }
  });
});

describe('PU-10 Request status, PU-13 Access active and PU-12 Payment are B1-08’s', () => {
  it.each([...strings(REQUEST_STATUS), ...strings(PAYMENT), ...strings(NEXT_ACTION)])(
    '%s',
    (text) => {
      expect(B1_08).toContain(text);
    },
  );

  it('the composed lines follow the board', () => {
    expect(paymentLead('Godavari Institute of Technology')).toBe(
      'Access for Godavari Institute of Technology starts after the payment is confirmed.',
    );
    expect(B1_08).toContain(
      'Access for Godavari Institute of Technology starts after the payment is confirmed.',
    );
    expect(updatedWords('2026-10-08T05:50:00.000Z')).toBe('Updated 8 Oct 2026, 11:20');
    expect(B1_08).toContain('Updated 8 Oct 2026, 11:20');
    expect(
      itemsLine(
        [
          { experimentId: 'a' as never, formats: ['web', 'ar'] },
          { experimentId: 'b' as never, formats: ['web', 'vr'] },
        ],
        (id) => (id === 'a' ? 'Composite Wall Conduction' : 'Fin-Tube Bundle'),
      ),
    ).toBe('Composite Wall Conduction — WEB, AR; Fin-Tube Bundle — WEB, VR');
    expect(B1_08).toContain('Composite Wall Conduction — WEB, AR; Fin-Tube Bundle — WEB, VR');
  });

  const view = (over: Partial<RequesterRequestView>): RequesterRequestView =>
    ({
      reference: 'REQ-0042',
      routeId: 'rq-0011',
      rev: 3,
      institutionName: 'Godavari Institute of Technology',
      status: 'under-review',
      reviewStarted: false,
      updatedAt: '2026-10-02T04:44:00.000Z',
      asked: {
        items: [{ experimentId: 'shell-and-tube-heat-exchanger', formats: ['web', 'vr'] }],
        licences: 120,
        term: { kind: 'yearly' },
      },
      approved: null,
      whatBitsAsked: null,
      whyItChanged: null,
      nextStep: 'none',
      activatedPlanId: null,
      history: [],
      ...over,
    }) as RequesterRequestView;

  it.each([
    ['under-review', { reviewStarted: false }],
    ['under-review', { reviewStarted: true }],
    ['information-requested', {}],
    ['approved-payment-required', {}],
    ['approved-payment-required', { whyItChanged: 'Fewer licences this term.' }],
    ['payment-not-confirmed', {}],
    ['payment-failed', {}],
    ['access-active', {}],
  ] as const)('the status head of %s %j is drawn', (status, over) => {
    const head = statusHead(view({ status, ...over }));
    expect(B1_08).toContain(head.title);
    expect(B1_08).toContain(head.text);
    expect(`${head.title} ${head.text}`).not.toMatch(NEVER);
  });

  it('“Approved” never reads as “active”; “Payment started” never as “paid”', () => {
    const approved = statusHead(view({ status: 'approved-payment-required' }));
    expect(approved.title).not.toMatch(/active/i);
    const pending = statusHead(view({ status: 'payment-not-confirmed' }));
    expect(pending.title).toBe('Payment not confirmed yet');
    expect(`${pending.title} ${pending.text}`).not.toMatch(/\bpaid\b/i);
  });

  it('the history lines are B1-08’s, newest first; a payment start gives way to its outcome', () => {
    const at = '2026-10-08T09:22:00.000Z';
    const entry = (id: string, event: string, note: string | null = null) => ({
      id,
      event,
      at,
      actor: { kind: 'system', id: 'system:x' },
      note,
    });
    const lines = requesterHistory(
      view({
        status: 'access-active',
        history: [
          {
            id: 'h1',
            event: 'submitted',
            at: '2026-10-02T04:44:00.000Z',
            actor: { kind: 'requester', name: 'Meera Iyer' },
            note: null,
          },
          entry('h2', 'review-started'),
          entry('h3', 'approved'),
          entry('h4', 'payment-started'),
          entry('h5', 'payment-confirmed'),
          entry('h6', 'access-active', 'ACC-0107'),
        ] as never,
      }),
    );
    expect(lines.map((line) => line.what)).toEqual([
      'Access active',
      'Payment confirmed',
      'Approved — payment needed',
      'BITS started reviewing',
      'Request submitted',
    ]);
    for (const line of lines) {
      expect(B1_08).toContain(line.what);
      if (line.note) expect(B1_08).toContain(line.note);
    }
    expect(lines.at(-1)?.when).toBe('2 Oct 2026, 10:14 · Meera Iyer, contact person');
    expect(B1_08).toContain('2 Oct 2026, 10:14 · Meera Iyer, contact person');

    const waiting = requesterHistory(
      view({
        status: 'payment-not-confirmed',
        history: [entry('h3', 'approved'), entry('h4', 'payment-started')] as never,
      }),
    );
    expect(waiting[0]).toMatchObject({
      what: 'Payment started',
      note: 'Waiting for confirmation.',
    });
    expect(B1_08).toContain('Waiting for confirmation.');

    const internal = requesterHistory(
      view({
        status: 'access-active',
        history: [entry('h3', 'approved'), entry('h6', 'access-active', 'ACC-0098')] as never,
      }),
    );
    expect(internal.map((line) => [line.what, line.note])).toEqual([
      ['Access active', 'Access plan ACC-0098. No payment step.'],
      ['Approved', 'Approved as requested.'],
    ]);
  });

  it('PU-12 names no amount, method or provider, and no “mark paid”', () => {
    for (const text of strings(PAYMENT)) expect(text).not.toMatch(NEVER);
    for (const text of strings(NEXT_ACTION)) expect(text).not.toMatch(/pay again|mark/i);
  });
});
