/**
 * The words of the Institute Admin's Requests (IA-17 and its request detail on B3-08, IA-18 and
 * IA-19 on B3-09) and of the Phase-2 actions they enable (B2-01, B2-02, B2-03, B2-05) are the
 * frozen boards': each drawn phrase is found verbatim in the board's markup or script, the
 * composed ones with the board's own sample values; the words the boards do not draw are
 * provisional entries of the state-copy register, and no decision id reaches visible words.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  approvedAsAskedWords,
  ASK_FORM,
  askedExperimentWords,
  authorisedNowWords,
  contactWords,
  DEVICE_REQUEST,
  DEVICE_REQUESTS,
  deviceRowLine,
  deviceRowTitle,
  experimentCourseWords,
  experimentRowMeta,
  experimentsInWords,
  forExperimentWords,
  formatWords,
  forwardedByWords,
  forwardedFlash,
  forwardEffect,
  forwardTitle,
  fromToWords,
  historyWhen,
  lastChangeWords,
  licencesWords,
  moreLicencesWords,
  quoted,
  renewalOfWords,
  renewChoiceWords,
  renewingTermWords,
  REQUEST_ACTIONS,
  REQUEST_DETAIL,
  REQUEST_HISTORY,
  requestedByWords,
  requestedWords,
  requestKindWords,
  REQUESTS_PAGE,
  requestWhatWords,
  reviewLabel,
  sentLine,
  sentWords,
  transferDateWords,
  transferKindWords,
  transferTitle,
} from './institute-requests';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_INSTITUTE_REQUESTS } from './state-copy-institute-requests';

/** A board's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B3_08 = words('B3-08-IA-Requests-to-BITS.dc.html');
const B3_09 = words('B3-09-IA-Device-Requests.dc.html');
const B2 = [
  'B2-01-IA-Overview.dc.html',
  'B2-02-Content-Access.dc.html',
  'B2-03-Access-Plan-and-Course-Codes.dc.html',
  'B2-05-Give-Students-Access.dc.html',
]
  .map(words)
  .join('\n');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

// Board sample instants (IST): 21 Oct 2026, 16:05; 22 Oct 2026, 09:10; 8 Oct 2026.
const SENT = '2026-10-21T10:35:00.000Z';
const DTR = '2026-10-22T03:40:00.000Z';
const ACTIVE = '2026-10-08T09:35:00.000Z';
const OLD = 'ME lab VR headset, asset tag GIT-VR-03';
const NEW = 'ME lab VR headset, asset tag GIT-VR-07';

describe('IA-17 Requests to BITS (B3-08)', () => {
  it.each([
    ...strings(REQUESTS_PAGE),
    ...strings(ASK_FORM),
    ...strings(REQUEST_DETAIL),
    ...strings(REQUEST_HISTORY),
  ])('“%s” is on B3-08', (phrase) => {
    expect(B3_08).toContain(phrase);
  });

  it('the composed words follow the board’s data and script', () => {
    for (const phrase of [
      requestKindWords('new-access'),
      requestKindWords('additional-licences'),
      requestWhatWords({
        type: 'new-access',
        experiments: ['Shell-and-Tube Heat Exchanger'],
        formats: ['vr', 'web'],
        licences: 120,
        term: { kind: 'yearly' },
        renewalOf: null,
      }),
      requestWhatWords({
        type: 'additional-licences',
        experiments: ['Shell-and-Tube Heat Exchanger'],
        formats: ['web', 'vr'],
        licences: 60,
        term: { kind: 'current-plan' },
        renewalOf: null,
      }),
      lastChangeWords(ACTIVE, ACTIVE),
      lastChangeWords(null, SENT),
      renewChoiceWords('ACC-0107'),
      experimentsInWords('ACC-0107'),
      experimentCourseWords('Shell-and-Tube Heat Exchanger', 'ME ZG523'),
      experimentRowMeta('ME ZG523', ['web', 'vr']),
      licencesWords(120),
      renewingTermWords('yearly', '2027-10-07'),
      contactWords('Meera Iyer', 'meera.iyer@godavari.edu.in'),
      sentWords(SENT),
      askedExperimentWords('Shell-and-Tube Heat Exchanger', 'ME ZG523', ['vr', 'web']),
      historyWhen(SENT, 'Meera Iyer'),
      quoted('Sem II has a larger batch than planned.'),
      approvedAsAskedWords(60),
      moreLicencesWords(60),
    ]) {
      expect(B3_08).toContain(phrase);
    }
    // The result's lead as the script writes it: sentWhat + '. Status: Under review. …'.
    expect(sentLine('60 more licences · Shell-and-Tube Heat Exchanger', 'Under review')).toBe(
      '60 more licences · Shell-and-Tube Heat Exchanger. Status: Under review. Each change shows here, in Requests.',
    );
    expect(B3_08).toContain('. Status: Under review. Each change shows here, in Requests.');
    expect(B3_08).toContain("'Renewal of ' + D.plan");
    expect(renewalOfWords('ACC-0107')).toBe('Renewal of ACC-0107');
    expect(formatWords(['vr', 'web', 'ar'])).toBe('WEB, AR and VR');
  });
});

describe('IA-18 and IA-19 Device requests (B3-09)', () => {
  it.each([...strings(DEVICE_REQUESTS), ...strings(DEVICE_REQUEST)])(
    '“%s” is on B3-09',
    (phrase) => {
      expect(B3_09).toContain(phrase);
    },
  );

  it('the composed words follow the board’s data and script', () => {
    for (const phrase of [
      transferKindWords('vr'),
      transferDateWords(DTR),
      reviewLabel('Rahul Verma'),
      transferTitle('vr', 'Rahul Verma'),
      requestedWords(DTR, 'Rahul Verma'),
      forExperimentWords('Shell-and-Tube Heat Exchanger'),
      forwardedFlash('Rahul Verma'),
      forwardTitle('DTR-0018'),
      forwardEffect('Rahul Verma', 'vr').before,
      forwardEffect('Rahul Verma', 'vr').after,
    ]) {
      expect(B3_09).toContain(phrase);
    }
    // History lines as the script composes them.
    expect(B3_09).toContain("'Requested by ' + D.stu");
    expect(requestedByWords('Rahul Verma')).toBe('Requested by Rahul Verma');
    expect(B3_09).toContain("'Forwarded to BITS by ' + D.ia");
    expect(forwardedByWords('Meera Iyer')).toBe('Forwarded to BITS by Meera Iyer');
    expect(B3_09).toContain("'From ' + D.devOld + ' to ' + devNew");
    expect(fromToWords(OLD, NEW)).toBe(`From ${OLD} to ${NEW}`);
    expect(B3_09).toContain("'The authorised device is now: ' + devNew");
    expect(authorisedNowWords(NEW)).toBe(`The authorised device is now: ${NEW}`);
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
});
