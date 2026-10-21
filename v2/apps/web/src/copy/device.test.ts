/**
 * ST-18 My device's words are the owner-approved V3 Student export's (ST-v1
 * `StudentFinal.dc.html`: the `device` region, `devVM`, `sendDev`, `msg('dev-not')`): each drawn
 * phrase is found verbatim; each composed line takes the script's own form for its sample; the
 * transfer's state words for the Student are the role-relative ones; no word names the transfer by
 * its record (lead decision 3); undrawn words are provisional state-copy entries with their
 * decisions, and none of their words is drawn in the export.
 */
import { describe, expect, it } from 'vitest';

import { stExport } from '@/test-support/boards';

import { MY_DEVICE } from '../nav/nav-config';
import {
  DEVICE_HOW,
  DEVICE_NOT_AVAILABLE,
  DEVICE_REQUEST_FORM,
  DEVICE_STEPS,
  DEVICE_TRANSFER_WORDS,
  earlierRequestWords,
  MY_DEVICE_PAGE,
  usedForLabel,
} from './device';
import { transferWords } from './flow-state-words';
import { STATE_COPY_DEVICE } from './state-copy-device';

const MAIN = stExport('StudentFinal.dc.html');
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));
const SCRIPT = MAIN.slice(MAIN.indexOf('<script type="text/x-dc"'));
const DRAWN = `${TEMPLATE.replace(/&amp;/g, '&')}\n${SCRIPT}`;
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT)-\d+/;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('ST-18 My device (ST-v1 `device`, `devVM`)', () => {
  it.each(
    strings([
      MY_DEVICE_PAGE,
      DEVICE_REQUEST_FORM,
      DEVICE_TRANSFER_WORDS,
      DEVICE_HOW,
      DEVICE_NOT_AVAILABLE,
      DEVICE_STEPS.label,
      DEVICE_STEPS.requested,
      DEVICE_STEPS.forwarded,
      DEVICE_STEPS.bitsDecides,
      DEVICE_STEPS.approved,
      DEVICE_STEPS.withInstituteAdmin,
      DEVICE_STEPS.waitingForInstituteAdmin,
      DEVICE_STEPS.withBitsNow,
      DEVICE_STEPS.notYet,
    ]).filter((phrase) => !['ask', 'forward', 'approve'].includes(phrase)),
  )('“%s” is drawn in the export', (phrase) => {
    expect(DRAWN).toContain(phrase);
  });

  it('“My device” is the account menu’s entry and opens this page', () => {
    expect(MY_DEVICE.label).toBe(MY_DEVICE_PAGE.title);
    expect(MY_DEVICE.href).toBe('/student/device');
  });

  it('the composed lines take the script’s form', () => {
    expect(TEMPLATE).toContain('<span class="xr-sr">Used for VR: </span>');
    expect(usedForLabel('VR')).toBe('Used for VR: ');
    expect(SCRIPT).toContain("D.ia + ' · ' + this.nbd(d.t.fwd || '')");
    expect(DEVICE_STEPS.by('Meera Iyer', '23 Oct 2026, 10:00')).toBe(
      'Meera Iyer · 23 Oct 2026, 10:00',
    );
    expect(SCRIPT).toContain(
      "aria: x.k + ', ' + (x.done ? 'done' : x.now ? 'current' : 'not yet') + (x.s ? ', ' + x.s : '')",
    );
    expect(DEVICE_STEPS.aria('Forwarded to BITS', 'done', 'Meera Iyer · 23 Oct 2026, 10:00')).toBe(
      'Forwarded to BITS, done, Meera Iyer · 23 Oct 2026, 10:00',
    );
    expect(DEVICE_STEPS.aria('BITS decides', 'next', 'Not yet')).toBe(
      'BITS decides, not yet, Not yet',
    );
    expect(DEVICE_STEPS.aria('BITS decides', 'now', 'With BITS now')).toBe(
      'BITS decides, current, With BITS now',
    );
    expect(SCRIPT).toContain("'Earlier request' + ' · approved ' + this.nbd(d.prev.when)");
    expect(earlierRequestWords('24 Oct 2026')).toBe('Earlier request · approved 24 Oct 2026');
    expect(SCRIPT).toContain(
      "explain: hasReq && d.noIA && d.stage === 'sent' ? 'Nothing changes on your device yet.'",
    );
  });

  it('the Student’s status words are the export’s', () => {
    const words = ['with-institute-admin', 'forwarded', 'approved'].map((state) =>
      transferWords(state as never, 'student'),
    );
    expect(words).toEqual(['With your Institute Admin', 'Forwarded to BITS', 'Approved']);
    for (const word of words) expect(SCRIPT).toContain(`'${word}'`);
  });

  it('no word names the transfer by its record (lead decision 3)', () => {
    expect(SCRIPT).toContain('hasRef: false');
    for (const phrase of strings([
      MY_DEVICE_PAGE,
      DEVICE_REQUEST_FORM,
      DEVICE_TRANSFER_WORDS,
      DEVICE_HOW,
      DEVICE_NOT_AVAILABLE,
    ])) {
      expect(phrase).not.toMatch(REFERENCE);
    }
  });

  it('the undrawn words are provisional, wait on a decision and are not drawn', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_DEVICE)) {
      expect(entry.screen, id).toBe('ST-18');
      expect(entry.status, id).toBe('provisional');
      expect(entry.decisions.length, id).toBeGreaterThan(0);
      if (entry.words !== null) {
        expect(DRAWN, id).not.toContain(entry.words);
        expect(entry.words, id).not.toMatch(REFERENCE);
      }
    }
    expect(STATE_COPY_DEVICE['ST-18.offered'].decisions).toEqual(['P3-06', 'O-08']);
    expect(STATE_COPY_DEVICE['ST-18.no-device'].decisions).toEqual(['P3-03', 'D20b']);
  });
});
