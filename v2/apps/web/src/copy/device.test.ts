/**
 * ST-18 My device's words (B3-07): each drawn phrase is found verbatim on the board; each composed
 * line takes the board's own form for its sample (DTR-0018); the transfer's state words for the
 * Student are the role-relative ones (B3-07 f4 … f6); undrawn words are provisional state-copy
 * entries with their decisions, and none of their words is on the board.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import { MY_DEVICE } from '../nav/nav-config';
import {
  DEVICE_HISTORY,
  DEVICE_REQUEST_FORM,
  DEVICE_TRANSFER_WORDS,
  MY_DEVICE_PAGE,
  usedForWords,
} from './device';
import { transferWords } from './flow-state-words';
import { STATE_COPY_DEVICE } from './state-copy-device';

const RAW = board('B3-07-My-Device.dc.html');
const B3_07 = `${RAW.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${RAW}`;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('ST-18 My device (B3-07)', () => {
  it.each(strings([MY_DEVICE_PAGE, DEVICE_REQUEST_FORM, DEVICE_TRANSFER_WORDS]))(
    '“%s” is on B3-07',
    (phrase) => {
      expect(B3_07).toContain(phrase);
    },
  );

  it('the account-menu entry is drawn as “My device” (f1) and opens this page', () => {
    expect(B3_07).toContain('href="B3-07-My-Device.dc.html"><svg');
    expect(B3_07).toContain(`${MY_DEVICE.label}</a>`);
    expect(MY_DEVICE.href).toBe('/student/device');
  });

  it('the composed lines take the board’s form for DTR-0018', () => {
    const old = 'ME lab VR headset, asset tag GIT-VR-03';
    const next = 'ME lab VR headset, asset tag GIT-VR-07';
    expect(usedForWords('VR', ['Shell-and-Tube Heat Exchanger'])).toBe(
      'Used for VR · Shell-and-Tube Heat Exchanger',
    );
    expect(B3_07).toContain('Used for VR · Shell-and-Tube Heat Exchanger');
    expect(usedForWords('VR', [])).toBe('Used for VR');
    // The board's canvas script builds the history lines from its sample (`D.stu`, `D.ia`).
    expect(DEVICE_HISTORY.requested('Rahul Verma')).toBe('Requested by Rahul Verma');
    expect(RAW).toContain("'Requested by ' + D.stu");
    expect(DEVICE_HISTORY.forwarded('Meera Iyer')).toBe('Forwarded to BITS by Meera Iyer');
    expect(RAW).toContain("'Forwarded to BITS by ' + D.ia");
    expect(RAW).toContain(`what: '${DEVICE_HISTORY.approved}'`);
    expect(DEVICE_HISTORY.fromTo(old, next)).toBe(`From ${old} to ${next}`);
    expect(RAW).toContain("'From ' + D.devOld + ' to ' + devNew");
    expect(DEVICE_HISTORY.nowAuthorised(next)).toBe(`The authorised device is now: ${next}`);
    expect(RAW).toContain("'The authorised device is now: ' + devNew");
  });

  it('the Student’s status words are the board’s (f4, f5, f6)', () => {
    const words = ['with-institute-admin', 'forwarded', 'approved'].map((state) =>
      transferWords(state as never, 'student'),
    );
    expect(words).toEqual(['With your Institute Admin', 'Forwarded to BITS', 'Approved']);
    expect(RAW).toContain(
      "const W = { none: '', sent: 'With your Institute Admin', fwd: 'Forwarded to BITS', appr: 'Approved' }",
    );
  });

  it('the undrawn words are provisional, wait on a decision and are not on the board', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_DEVICE)) {
      expect(entry.screen, id).toBe('ST-18');
      expect(entry.status, id).toBe('provisional');
      expect(entry.decisions.length, id).toBeGreaterThan(0);
      if (entry.words !== null) expect(B3_07, id).not.toContain(entry.words);
    }
    expect(STATE_COPY_DEVICE['ST-18.offered'].decisions).toEqual(['P3-06', 'O-08']);
    expect(STATE_COPY_DEVICE['ST-18.no-device'].decisions).toEqual(['P3-03', 'D20b']);
  });
});
