/**
 * SA-07's view of the port's answers (SA-v1 `V.institution`): the controls per drawn state (matrix
 * INST-04 … INST-09), "Also waiting for this institution" written from the requests the
 * institution's own record names and its forwarded device transfers, each plan's band from the
 * services' answers, and the History — the record's own events, newest first, by content —
 * checked on every institution of the walk after Flow C, against the sample world's own reads.
 */
import type { InstitutionDetail, ProductPorts, RequestRow } from '@xr/contracts/draft';
import type { InstitutionStatus } from '@xr/domain';
import { afterFlow, asPerson, assemblePlatform, fixtureWorld } from '@xr/sample-platform/testing';
import { describe, expect, it } from 'vitest';

import {
  dayOf,
  daysBetween,
  drawnControls,
  hasRequestUnderReview,
  historyLines,
  planViews,
  requestsNamed,
  waitingItems,
} from './institution-view';

async function adminPorts(): Promise<ProductPorts> {
  return asPerson(assemblePlatform({ world: await afterFlow('C') }), 'Arjun Mehta');
}

async function everything(ports: ProductPorts) {
  const rows = await ports.institutions.listInstitutions({ tab: 'all' });
  const requests = await ports.accessRequests.listRequests({ sort: 'received-newest' });
  if (!rows.ok || !requests.ok) throw new Error('reads');
  const details: InstitutionDetail[] = [];
  for (const row of rows.value) {
    const detail = await ports.institutions.getInstitution(row.id);
    if (!detail.ok) throw new Error(row.id);
    details.push(detail.value);
  }
  return { rows: rows.value, details, requests: requests.value };
}

describe('drawnControls — the drawn states, state by state', () => {
  it.each([
    ['access-active', true, { assign: true, pause: true, restore: false, adminLater: false }],
    ['ending-soon', true, { assign: true, pause: true, restore: false, adminLater: false }],
    ['access-paused', true, { assign: true, pause: false, restore: true, adminLater: false }],
    [
      'approved-payment-required',
      true,
      { assign: false, pause: false, restore: false, adminLater: true },
    ],
    ['access-ended', true, { assign: false, pause: false, restore: false, adminLater: false }],
    ['access-active', false, { assign: false, pause: true, restore: false, adminLater: false }],
    ['access-paused', false, { assign: false, pause: false, restore: true, adminLater: false }],
  ] as const)('%s, no Institute Admin: %s', (status, none, expected) => {
    const detail = {
      status: status as InstitutionStatus,
      institution: { instituteAdmin: none ? null : { name: 'A' } },
    } as unknown as InstitutionDetail;
    expect(drawnControls(detail)).toEqual(expected);
  });

  it('“Assign” shows exactly where the service flags “Needs one” (INST-04)', async () => {
    const { rows, details } = await everything(await adminPorts());
    for (const [index, row] of rows.entries()) {
      expect(drawnControls(details[index]!).assign, row.name).toBe(row.needsInstituteAdmin);
    }
  });
});

describe('waitingItems — “Also waiting for this institution”, from its own record (SA-v1 `att`)', () => {
  it('names the requests its history refers to that are under review, newest first, by content', async () => {
    const { details, requests } = await everything(await adminPorts());
    const byId = new Map<string, RequestRow>(requests.map((row) => [row.id, row]));
    for (const detail of details) {
      const named = requestsNamed(detail);
      expect(named).toContain(detail.institution.createdFromRequestId);
      for (const id of named) expect(byId.has(id), id).toBe(true);
      const listed = waitingItems(detail, requests).map((row) => row.key);
      const underReview = named
        .map((id) => byId.get(id)!)
        .filter((row) => row.status === 'under-review')
        .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1))
        .map((row) => row.id);
      expect(listed, detail.institution.name).toEqual(underReview);
    }
    const words = Object.fromEntries(
      details.map((detail) => [
        detail.institution.id,
        waitingItems(detail, requests).map((row) => [row.text, row.label, row.href]),
      ]),
    );
    expect(words).toEqual({
      godavari: [
        ['Additional licences request under review', 'Open request', '/admin/requests/REQ-0058'],
      ],
      bitshyd: [['Renewal request under review', 'Open request', '/admin/requests/REQ-0038']],
      vizag: [],
      sahyadri: [],
      konark: [
        ['Additional licences request under review', 'Open request', '/admin/requests/REQ-0040'],
      ],
      malnad: [],
      deccan: [],
    });
    // No internal reference in what is read (the links name the request by content).
    for (const detail of details) {
      for (const row of waitingItems(detail, requests)) {
        expect(`${row.text} ${row.label}`).not.toMatch(/\b(?:REQ|ACC|DTR)-\d/);
      }
    }
  });

  it('a device transfer forwarded to BITS follows its requests, naming the student and opening SA-19', async () => {
    const ports = asPerson(
      assemblePlatform({ world: await fixtureWorld('after-flow-e') }),
      'Arjun Mehta',
    );
    const { details, requests } = await everything(ports);
    const transfers = await ports.operations.listDeviceTransfers({ state: 'forwarded' });
    if (!transfers.ok) throw new Error('listDeviceTransfers');
    const godavari = details.find((detail) => detail.institution.id === 'godavari')!;
    expect(
      waitingItems(godavari, requests, transfers.value).map((row) => [
        row.text,
        row.label,
        row.href,
      ]),
    ).toEqual([
      ['Additional licences request under review', 'Open request', '/admin/requests/REQ-0058'],
      [
        'VR device transfer for Rahul Verma',
        'Review transfer',
        '/admin/operations/device-transfers/DTR-0018',
      ],
    ]);
    // Another institution's transfer is never listed.
    for (const detail of details.filter((item) => item.institution.id !== 'godavari')) {
      expect(
        waitingItems(detail, requests, transfers.value).map((row) => row.key),
        detail.institution.id,
      ).toEqual(waitingItems(detail, requests).map((row) => row.key));
    }
  });

  it('never lists another institution’s request', async () => {
    const { details, requests } = await everything(await adminPorts());
    const owner = new Map<string, string>();
    for (const detail of details) {
      for (const row of waitingItems(detail, requests)) {
        expect(owner.get(row.key), row.key).toBeUndefined();
        owner.set(row.key, detail.institution.id);
      }
    }
    const sahyadri = details.find((detail) => detail.institution.id === 'sahyadri')!;
    // Its additional licences wait for a payment, which is not recorded here: not waiting on you.
    expect(hasRequestUnderReview(sahyadri, requests)).toBe(false);
    const konark = details.find((detail) => detail.institution.id === 'konark')!;
    expect(hasRequestUnderReview(konark, requests)).toBe(true);
  });
});

describe('planViews — each plan’s band from the services’ answers (SA-v1 `planBand`)', () => {
  it('status, days and note from Operations › Access ending and the pause; the term passed', async () => {
    const ports = await adminPorts();
    const { details, requests } = await everything(ports);
    const ending = await ports.operations.listAccessEnding();
    if (!ending.ok) throw new Error('listAccessEnding');
    const rows = ending.value.map((view) => view.row);
    const views = Object.fromEntries(
      details.map((detail) => [
        detail.institution.id,
        planViews(detail, rows, requests, '2026-10-27').map((view) => [
          view.status,
          view.state,
          view.days,
          view.note,
        ]),
      ]),
    );
    expect(views).toEqual({
      godavari: [['access-active', 'live', 345, null]],
      bitshyd: [
        ['ending-soon', 'live', 4, { kind: 'renewal', requestId: 'REQ-0038', underReview: true }],
      ],
      vizag: [],
      sahyadri: [['access-active', 'live', 337, null]],
      konark: [['ending-soon', 'live', 6, { kind: 'reminder', notCovered: false }]],
      malnad: [['access-ended', 'ended', 12, { kind: 'ended' }]],
      deccan: [['paused', 'paused', 259, { kind: 'paused' }]],
    });
    const godavari = details.find((detail) => detail.institution.id === 'godavari')!;
    const [band] = planViews(godavari, rows, requests, '2026-10-27');
    // 19 of 364 days of 8 Oct 2026 – 7 Oct 2027 have passed on 27 Oct.
    expect(band!.elapsed).toBeCloseTo(19 / 364, 6);
    const malnad = details.find((detail) => detail.institution.id === 'malnad')!;
    expect(planViews(malnad, rows, requests, '2026-10-27')[0]!.elapsed).toBe(1);
    // The term passed stays within the track before a plan starts and after it ends.
    expect(planViews(godavari, rows, requests, '2026-01-01')[0]!.elapsed).toBe(0);
  });

  it('counts whole calendar days in the sample world’s Indian time', () => {
    expect(dayOf('2026-10-26T20:00:00.000Z')).toBe('2026-10-27');
    expect(dayOf('2026-10-27T04:30:00.000Z')).toBe('2026-10-27');
    expect(daysBetween('2026-10-23', '2026-10-31')).toBe(8);
    expect(daysBetween('2026-10-23', '2026-10-15')).toBe(-8);
  });
});

describe('historyLines — the record’s own events, newest first, by content', () => {
  it('words every event the walk records, with its recorded time', async () => {
    const { details } = await everything(await adminPorts());
    const godavari = details.find((detail) => detail.institution.id === 'godavari')!;
    expect(historyLines(godavari).map((line) => [line.what, line.when, line.note])).toEqual([
      [
        'Request for additional licences received',
        '21 Oct 2026, 16:05',
        'Meera Iyer, Institute Admin',
      ],
      [
        'Institute Admin assigned: Meera Iyer',
        '8 Oct 2026, 15:20',
        'meera.iyer@godavari.edu.in · Arjun Mehta',
      ],
      ['Institutional access activated', '8 Oct 2026, 15:05', 'Payment confirmed.'],
      ['Request approved, payment required', '8 Oct 2026, 11:20', 'External.'],
    ]);
    const deccan = details.find((detail) => detail.institution.id === 'deccan')!;
    expect(historyLines(deccan)[0]).toMatchObject({
      what: 'Access paused by Arjun Mehta',
      when: '12 Oct 2026, 09:40',
      note: '“The institution asked us to pause access while it checks its student list.”',
    });
    const bits = details.find((detail) => detail.institution.id === 'bitshyd')!;
    expect(historyLines(bits).map((line) => line.what)).toEqual([
      'Renewal request received',
      'Institute Admin assigned: Dr P. Srinivas',
      'Institutional access activated',
      'Request approved',
    ]);
    expect(historyLines(bits).at(-1)!.note).toBe('Internal.');
    expect(historyLines(bits).at(-2)!.note).toBe('Internal, no payment step.');
    // No internal reference in any line.
    for (const detail of details) {
      for (const line of historyLines(detail)) {
        expect(`${line.what} ${line.note ?? ''}`).not.toMatch(/\b(?:REQ|ACC|DTR)-\d/);
      }
    }
  });
});
