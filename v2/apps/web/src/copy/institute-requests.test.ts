/**
 * The words of the Institute Admin's Requests in V3 — IA-17 Requests to BITS, its form, its result
 * and its request detail, IA-18 Device requests and IA-19 Device request — are the owner-approved
 * export's (IA-v1 `project/Main.dc.html`, template and script): each drawn phrase is found
 * verbatim in its markup or script, the composed ones equal the export's with sample values and
 * use the script's own pieces. Where the export names a request, an access plan or a device
 * request by its internal reference, the product names it by content (the owner's identifier
 * rule, state-copy `IA-17.no-reference`): those words are listed against the export's form. The
 * undrawn forms are provisional entries of the state-copy register, each with its decision and no
 * decision id in its words. The Phase-2 actions IA-17 and IA-18 enable on IA-01 … IA-05 keep their
 * B2 words.
 */
import { describe, expect, it } from 'vitest';

import { board, iaExport } from '@/test-support/boards';

import {
  approvedAsAskedWords,
  ASK_FORM,
  askedTermWords,
  authorisedNowWords,
  contactWords,
  decisionWords,
  DEVICE_REQUEST,
  DEVICE_REQUESTS,
  deviceRowLine,
  deviceRowTitle,
  experimentChoiceLine,
  experimentCourseWords,
  forExperimentWords,
  formatsLabel,
  formatWords,
  forwardedByWords,
  forwardedFlash,
  forwardEffect,
  forwardTitle,
  fromToWords,
  historyWhen,
  informationLine,
  lastChangeWords,
  licencesWords,
  moreLicencesWords,
  newAccessTitle,
  OPEN_RENEWAL_TITLE,
  openRenewalLine,
  openTransferLabel,
  paymentConfirmedWords,
  planActiveSinceWords,
  planCreatedWords,
  planFormatsLabel,
  quoted,
  RENEWAL_OF_YOUR_PLAN,
  renewingTermWords,
  REQUEST_ACTIONS,
  REQUEST_DETAIL,
  REQUEST_HISTORY,
  requestedByWords,
  requestedWords,
  requestKindWords,
  requestRowLabel,
  REQUESTS_PAGE,
  requestSentDayWords,
  requestWhatWords,
  reviewLabel,
  SENT_PAGE,
  sentLine,
  sentWords,
  transferDateWords,
  transferKindWords,
  transferTitle,
} from './institute-requests';
import { STAND } from './requests';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_INSTITUTE_REQUESTS } from './state-copy-institute-requests';

/** A source's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(raw: string): string {
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const IA = words(iaExport('Main.dc.html'));
const B3_09 = words(board('B3-09-IA-Device-Requests.dc.html'));
const B2 = [
  'B2-01-IA-Overview.dc.html',
  'B2-02-Content-Access.dc.html',
  'B2-03-Access-Plan-and-Course-Codes.dc.html',
  'B2-05-Give-Students-Access.dc.html',
]
  .map((file) => words(board(file)))
  .join('\n');

/** An internal reference (the owner's identifier rule). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

/** The words the product says instead of the export's referenced ones (IA-17.no-reference). */
const BY_CONTENT = {
  renew: ASK_FORM.renew,
  experimentsIn: ASK_FORM.experimentsIn,
  sentTitle: SENT_PAGE.title,
  viewPlan: REQUEST_DETAIL.viewPlan,
  planUnchanged: REQUEST_DETAIL.stand.planUnchanged,
  planCreated: REQUEST_HISTORY.planCreated,
  notRecorded: DEVICE_REQUEST.stand.notRecorded,
} as const;

const DRAWN = [
  ...strings(REQUESTS_PAGE),
  ...strings(ASK_FORM).filter((phrase) => phrase !== BY_CONTENT.renew),
  ...strings(SENT_PAGE).filter((phrase) => phrase !== BY_CONTENT.sentTitle),
  ...strings(REQUEST_DETAIL).filter(
    (phrase) =>
      phrase !== BY_CONTENT.viewPlan &&
      phrase !== BY_CONTENT.planUnchanged &&
      phrase !== REQUEST_DETAIL.stand.paymentNotNeeded &&
      // P1 register B: the export's “BITS has activated this request.” read as a plan change.
      phrase !== REQUEST_DETAIL.activeByBits,
  ),
  ...strings(REQUEST_HISTORY).filter((phrase) => phrase !== BY_CONTENT.planCreated),
  ...strings(DEVICE_REQUESTS),
  ...strings(DEVICE_REQUEST).filter((phrase) => phrase !== BY_CONTENT.notRecorded),
  OPEN_RENEWAL_TITLE,
  RENEWAL_OF_YOUR_PLAN.replace('your access plan', ''),
].filter((phrase) => phrase !== BY_CONTENT.experimentsIn);

// Sample instants (IST): 21 Oct 2026, 16:05; 22 Oct 2026, 09:10; 8 Oct 2026, 15:05.
const SENT = '2026-10-21T10:35:00.000Z';
const DTR = '2026-10-22T03:40:00.000Z';
const ACTIVE = '2026-10-08T09:35:00.000Z';
const OLD = 'ME lab VR headset, asset tag GIT-VR-03';
const NEW = 'ME lab VR headset, asset tag GIT-VR-07';

describe('IA-17 Requests to BITS, its form, its result and its detail (IA-v1)', () => {
  it.each(DRAWN)('“%s” is in the export', (phrase) => {
    expect(IA).toContain(phrase);
  });

  it('the composed words follow the export’s script', () => {
    expect(requestKindWords('new-access')).toBe('New access');
    expect(requestKindWords('additional-licences')).toBe('More licences');
    expect(requestKindWords('renewal')).toBe('Renewal');
    expect(IA).toContain("{ new: 'New access', renew: 'Renewal', more: 'More licences' }");
    expect(
      requestWhatWords({
        type: 'additional-licences',
        experiments: ['Shell-and-Tube Heat Exchanger'],
        formats: ['web', 'vr'],
        licences: 60,
        term: { kind: 'current-plan' },
        renewalOfKnownPlan: false,
      }),
    ).toBe('60 more licences · Shell-and-Tube Heat Exchanger');
    expect(IA).toContain("q.lic + ' more licences · ' + this.listText(names)");
    expect(
      requestWhatWords({
        type: 'new-access',
        experiments: ['Shell-and-Tube Heat Exchanger'],
        formats: ['vr', 'web'],
        licences: 120,
        term: { kind: 'yearly' },
        renewalOfKnownPlan: false,
      }),
    ).toBe('Shell-and-Tube Heat Exchanger · WEB and VR · 120 licences · Yearly');
    expect(IA).toContain('Shell-and-Tube Heat Exchanger · WEB and VR · 120 licences · Yearly');
    expect(
      requestWhatWords({
        type: 'renewal',
        experiments: ['Shell-and-Tube Heat Exchanger'],
        formats: ['web'],
        licences: 120,
        term: { kind: 'yearly' },
        renewalOfKnownPlan: true,
      }),
    ).toBe(RENEWAL_OF_YOUR_PLAN);
    expect(IA).toContain("'Renewal of ' + P.id");
    expect(lastChangeWords(SENT)).toBe('21 Oct 2026, 16:05');
    expect(askedTermWords({ kind: 'yearly' })).toBe('Yearly');
    expect(moreLicencesWords(60)).toBe('60 more licences');
    expect(IA).toContain("R.lic + ' more licences'");
    expect(sentLine('60 more licences · Shell-and-Tube Heat Exchanger', 'Under review')).toBe(
      '60 more licences · Shell-and-Tube Heat Exchanger. Status: Under review. Each change shows here, in Requests.',
    );
    expect(IA).toContain(
      '{{ V.sentWhat }}. Status: Under review. Each change shows here, in Requests.',
    );
    expect(experimentCourseWords('Shell-and-Tube Heat Exchanger', 'ME ZG523')).toBe(
      'Shell-and-Tube Heat Exchanger · ME ZG523',
    );
    expect(IA).toContain("W.cat[e].t + ' · ' + W.cat[e].course");
    expect(formatWords(['vr', 'web', 'ar'])).toBe('WEB, AR and VR');
    expect(formatWords(['vr', 'web'])).toBe('WEB and VR');
    expect(licencesWords(120)).toBe('120 licences');
    expect(IA).toContain("P.lic + ' licences'");
    expect(renewingTermWords('yearly', '2027-10-07')).toBe('Yearly · current plan ends 7 Oct 2027');
    expect(IA).toContain("' · current plan ' + (x.pst === 'ended' ? 'ended on ' : 'ends ')");
    expect(contactWords('Meera Iyer', 'meera.iyer@godavari.edu.in')).toBe(
      'Meera Iyer · meera.iyer@godavari.edu.in',
    );
    expect(IA).toContain("W.me.n + ' · ' + W.me.email");
    expect(newAccessTitle('Shell-and-Tube Heat Exchanger')).toBe(
      'New access · Shell-and-Tube Heat Exchanger',
    );
    expect(IA).toContain("'New access · ' + E.split(' · ')[0]");
    expect(sentWords(SENT)).toBe('Sent 21 Oct 2026, 16:05');
    expect(IA).toContain('<span>Sent {{ V.sent }}</span>');
    expect(formatsLabel(['vr', 'web'])).toBe('Formats: WEB, VR');
    expect(IA).toContain("fmAria: 'Formats: ' + fm.join(', ')");
    expect(
      informationLine(
        'Please confirm the batch size for Sem II before we review the request.',
        SENT,
      ),
    ).toBe(
      '“Please confirm the batch size for Sem II before we review the request.” · 21 Oct 2026, 16:05. Reply outside the platform; there is no reply form here.',
    );
    expect(IA).toContain(
      "'“' + info.n + '” · ' + this.fWhen(info.at) + '. Reply outside the platform; there is no reply form here.'",
    );
    expect(paymentConfirmedWords(ACTIVE)).toBe('Confirmed 8 Oct 2026, 15:05');
    expect(paymentConfirmedWords(null)).toBe('Confirmed');
    expect(IA).toContain("'Confirmed ' + this.fWhen(P.since)");
    expect(historyWhen(SENT, 'Meera Iyer')).toBe('21 Oct 2026, 16:05 · Meera Iyer');
    expect(IA).toContain("this.fWhen(h.at) + (h.by ? ' · ' + h.by : '')");
    expect(quoted('Sem II has a larger batch than planned.')).toBe(
      '“Sem II has a larger batch than planned.”',
    );
    expect(approvedAsAskedWords(60)).toBe('Approved as asked: 60 licences');
    expect(IA).toContain('Approved as asked: ');
    // An internal approval, which the export does not draw: the Super Admin's words for the same step.
    expect(REQUEST_DETAIL.stand.paymentNotNeeded).toBe(STAND.paymentNotNeeded);
  });

  it('names by content where the export names by reference (IA-17.no-reference)', () => {
    // The export's referenced form, then the product's words.
    expect(IA).toContain('Renew access plan {{ V.planId }}');
    expect(BY_CONTENT.renew).toBe('Renew your access plan');
    expect(IA).toContain('Experiments in {{ V.planId }}');
    expect(BY_CONTENT.experimentsIn).toBe('Experiments in your access plan');
    expect(IA).toContain("' · in ' + P.id");
    expect(experimentChoiceLine(['web', 'vr'])).toBe('WEB and VR · in your access plan');
    expect(IA).toContain("'Formats in ' + P.id + ': '");
    expect(planFormatsLabel(['vr', 'web'])).toBe('Formats in your access plan: WEB, VR');
    expect(IA).toContain('Request {{ V.sentId }} sent to BITS');
    expect(BY_CONTENT.sentTitle).toBe('Request sent to BITS');
    expect(IA).toContain('View access plan {{ V.planId }}');
    expect(BY_CONTENT.viewPlan).toBe('View your access plan');
    expect(IA).toContain("planWord + ' unchanged'");
    expect(BY_CONTENT.planUnchanged).toBe('Unchanged');
    expect(IA).toContain(
      "'Payment confirmed. Access plan ' + P.id + ' created ' + this.fWhen(P.since)",
    );
    expect(planCreatedWords(ACTIVE)).toBe(
      'Payment confirmed. Your access plan was created 8 Oct 2026, 15:05.',
    );
    expect(BY_CONTENT.planCreated).toBe('Your access plan was created.');
    expect(IA).toContain("P.id + ' active since ' + this.fWhen(P.since)");
    expect(planActiveSinceWords(ACTIVE)).toBe('Active since 8 Oct 2026, 15:05');
    expect(IA).toContain(
      "openRen.id + ' · ' + Component.RQ[openRen.st][1] + '. You can still send another request; BITS sees both.'",
    );
    expect(openRenewalLine(SENT, 'Under review')).toBe(
      'Renewal sent 21 Oct 2026 · Under review. You can still send another request; BITS sees both.',
    );
    expect(IA).toContain("aria: 'Open request ' + r.id + ', ' + st[1]");
    expect(requestSentDayWords(SENT)).toBe('Sent 21 Oct 2026');
    expect(requestRowLabel('More licences', SENT, 'Under review')).toBe(
      'More licences, sent 21 Oct 2026, Under review. Open the request',
    );
    expect(requestRowLabel('More licences', null, null)).toBe('More licences. Open the request');
    for (const phrase of [
      ...strings(BY_CONTENT),
      experimentChoiceLine(['web']),
      planFormatsLabel(['web']),
      planCreatedWords(ACTIVE),
      planActiveSinceWords(ACTIVE),
      openRenewalLine(SENT, 'Under review'),
      requestRowLabel('Renewal', SENT, 'Access active'),
    ]) {
      expect(phrase).not.toMatch(REFERENCE);
    }
  });
});

describe('IA-18 and IA-19 Device requests (IA-v1)', () => {
  it('the composed words follow the export’s script', () => {
    expect(transferKindWords('vr')).toBe('VR device transfer');
    expect(IA).toContain("what = D.fmt + ' device transfer'");
    expect(transferDateWords(DTR)).toBe('22 Oct 2026');
    expect(transferTitle('vr', 'Rahul Verma')).toBe('VR device transfer for Rahul Verma');
    expect(IA).toContain("title: D.fmt + ' device transfer for ' + S.n");
    expect(requestedWords(DTR, 'Rahul Verma')).toBe('Requested 22 Oct 2026, 09:10 by Rahul Verma');
    expect(IA).toContain("reqLine: 'Requested ' + this.fWhen(D.at) + ' by ' + S.n");
    expect(forExperimentWords('Shell-and-Tube Heat Exchanger')).toBe(
      'for Shell-and-Tube Heat Exchanger',
    );
    expect(IA).toContain('<span>for {{ V.exp }}</span>');
    expect(forwardedFlash('Rahul Verma')).toBe(
      'Rahul Verma sees “Forwarded to BITS”. BITS decides.',
    );
    expect(IA).toContain("S.n + ' sees “Forwarded to BITS”. BITS decides.'");
    expect(decisionWords('2026-10-24T07:00:00.000Z')).toBe('Approved · 24 Oct 2026, 12:30');
    expect(decisionWords(null)).toBe('Approved');
    expect(IA).toContain("'Approved' + (D.appr ? ' · ' + this.fWhen(D.appr.at) : '')");
    expect(requestedByWords('Rahul Verma')).toBe('Requested by Rahul Verma');
    expect(IA).toContain("w: 'Requested by ' + S.n");
    expect(forwardedByWords('Meera Iyer')).toBe('Forwarded to BITS by Meera Iyer');
    expect(IA).toContain("w: 'Forwarded to BITS by ' + D.fwd.by");
    expect(authorisedNowWords(NEW)).toBe(`The authorised device is now: ${NEW}`);
    expect(IA).toContain("n: 'The authorised device is now: ' + D.to");
    expect(forwardTitle('Rahul Verma')).toBe('Forward Rahul Verma’s device request to BITS?');
    expect(IA).toContain("title: 'Forward ' + S.n + '’s device request to BITS?'");
    expect(forwardEffect('Rahul Verma', 'vr', NEW)).toBe(
      `BITS decides whether Rahul Verma can move VR to ${NEW}. You can’t take it back once it’s forwarded.`,
    );
    expect(IA).toContain(
      "body: 'BITS decides whether ' + S.n + ' can move ' + D.fmt + ' to ' + D.to + '. You can’t take it back once it’s forwarded.'",
    );
    // Kept for the shared history rules (IA-01's device row reads them); IA-19 does not draw them.
    expect(B3_09).toContain("'From ' + D.devOld + ' to ' + devNew");
    expect(fromToWords(OLD, NEW)).toBe(`From ${OLD} to ${NEW}`);
  });

  it('names by content where the export names by reference (IA-17.no-reference)', () => {
    expect(IA).toContain("openAria: what + ' ' + D.id + ' from '");
    expect(openTransferLabel('vr', 'Rahul Verma', DTR)).toBe(
      'VR device transfer from Rahul Verma, 22 Oct 2026',
    );
    expect(IA).toContain("reviewAria: 'Review ' + (S ? S.n + '’s' : 'the') + ' request ' + D.id");
    expect(reviewLabel('Rahul Verma')).toBe('Review Rahul Verma’s request');
    expect(IA).toContain('{{ r.id }} · {{ r.date }}');
    for (const phrase of [
      openTransferLabel('vr', 'Rahul Verma', DTR),
      reviewLabel('Rahul Verma'),
      forwardTitle('Rahul Verma'),
      forwardEffect('Rahul Verma', 'vr', NEW),
      transferTitle('vr', 'Rahul Verma'),
    ]) {
      expect(phrase).not.toMatch(REFERENCE);
    }
  });
});

describe('the Phase-2 actions IA-17 and IA-18 enable (B2-01, B2-02, B2-03, B2-05)', () => {
  it.each(strings(REQUEST_ACTIONS))('“%s” is on the B2 boards', (phrase) => {
    expect(B2).toContain(phrase);
  });

  it('the device-request row (B2-01 f7)', () => {
    expect(B2).toContain(deviceRowTitle(1));
    expect(B2).toContain(deviceRowLine('Imran Shaikh', '2027-09-18T05:00:00.000Z'));
    expect(deviceRowTitle(3)).toBe('3 device requests to forward to BITS');
  });
});

describe('the state-copy entries', () => {
  it('are in the one register, provisional with a decision, and show no decision id', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_INSTITUTE_REQUESTS)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
      if (entry.words) expect(entry.words).not.toMatch(/\b[A-Z]{1,3}-?[A-Z0-9]*-\d\d\b/);
    }
  });

  it('the words the export draws for the lists’ empty states are the export’s', () => {
    expect(IA).toContain(STATE_COPY_INSTITUTE_REQUESTS['IA-17.empty.title'].words);
    expect(IA).toContain(STATE_COPY_INSTITUTE_REQUESTS['IA-17.empty.line'].words);
    expect(IA).toContain(STATE_COPY_INSTITUTE_REQUESTS['IA-18.empty.line'].words);
    expect(IA).toContain(STATE_COPY_INSTITUTE_REQUESTS['IA-17.kind-renewal'].words);
    expect(STATE_COPY_INSTITUTE_REQUESTS['IA-17.no-plan'].words).not.toMatch(REFERENCE);
  });
});
