/**
 * SA-07's view of the port's answers: the controls per drawn state follow B7-03's script (matrix
 * INST-04 … INST-09 as drawn), "Needs attention" is written from the requests the institution's
 * own record names, and the History is the record's own events, newest first — checked on every
 * institution of the walk after Flow C, against the sample world's own reads.
 */
import type { InstitutionDetail, ProductPorts, RequestRow } from '@xr/contracts/draft';
import type { InstitutionStatus } from '@xr/domain';
import { afterFlow, asPerson, assemblePlatform, fixtureWorld } from '@xr/sample-platform/testing';
import { describe, expect, it } from 'vitest';

import { attentionRows, drawnControls, historyLines, requestsNamed } from './institution-view';

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

describe('drawnControls — B7-03’s script, state by state', () => {
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

describe('attentionRows — from the institution’s own record (B7-03 `att`)', () => {
  it('names the requests its history refers to, open ones only, newest first', async () => {
    const { details, requests } = await everything(await adminPorts());
    const byId = new Map<string, RequestRow>(requests.map((row) => [row.id, row]));
    for (const detail of details) {
      const named = requestsNamed(detail);
      expect(named).toContain(detail.institution.createdFromRequestId);
      for (const id of named) expect(byId.has(id), id).toBe(true);
      const rows = attentionRows(detail, requests);
      const listed = rows.filter((row) => row.action.kind === 'link').map((row) => row.key);
      const open = named
        .map((id) => byId.get(id)!)
        .filter((row) => row.status !== 'access-active')
        .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1))
        .map((row) => row.id);
      expect(listed, detail.institution.name).toEqual(open);
    }
    const words = Object.fromEntries(
      details.map((detail) => [
        detail.institution.id,
        attentionRows(detail, requests).map((row) => row.text),
      ]),
    );
    expect(words).toEqual({
      godavari: ['REQ-0058 additional licences — under review'],
      bitshyd: ['REQ-0038 renewal — under review'],
      vizag: [
        'Approved — payment required (REQ-0037). Access starts when the payment is confirmed.',
      ],
      sahyadri: [
        'No Institute Admin yet — nobody can give students access',
        'REQ-0036 additional licences — payment not confirmed',
      ],
      konark: ['REQ-0040 additional licences — under review'],
      malnad: [],
      deccan: ['Access paused since 12 Oct 2026'],
    });
  });

  it('Phase 6: access ending with a reminder due comes first after a missing admin, opening SA-22 (B7-03 konark)', async () => {
    const ports = asPerson(
      assemblePlatform({ world: await fixtureWorld('after-flow-e') }),
      'Arjun Mehta',
    );
    const { details, requests } = await everything(ports);
    const ending = await ports.operations.listAccessEnding();
    if (!ending.ok) throw new Error('listAccessEnding');
    const rows = ending.value.map((view) => view.row);
    const rowsOf = (id: string) =>
      attentionRows(
        details.find((detail) => detail.institution.id === id)!,
        requests,
        [],
        rows,
      );
    // Konark: the reminder-due row as B7-03 draws it, then its request.
    expect(rowsOf('konark').map((row) => row.text)).toEqual([
      'Access ends 2 Nov 2026 — reminder due (nothing is sent from here)',
      'REQ-0040 additional licences — under review',
    ]);
    expect(rowsOf('konark')[0]!.action).toEqual({
      kind: 'link',
      href: '/admin/operations/access-ending',
      label: 'Operations › Access ending',
    });
    // A renewal in progress is its request's row; ended access needs nothing (B7-10 f8).
    expect(rowsOf('bitshyd').map((row) => row.text)).toEqual(['REQ-0038 renewal — under review']);
    expect(rowsOf('malnad')).toEqual([]);
    // No other institution gains a row.
    for (const detail of details.filter((item) => item.institution.id !== 'konark')) {
      expect(
        attentionRows(detail, requests, [], rows).map((row) => row.key),
        detail.institution.id,
      ).toEqual(attentionRows(detail, requests).map((row) => row.key));
    }
  });

  it('never lists another institution’s request', async () => {
    const { details, requests } = await everything(await adminPorts());
    const owner = new Map<string, string>();
    for (const detail of details) {
      for (const row of attentionRows(detail, requests)) {
        if (row.action.kind !== 'link') continue;
        expect(owner.get(row.key), row.key).toBeUndefined();
        owner.set(row.key, detail.institution.id);
      }
    }
  });
});

describe('historyLines — the record’s own events, newest first', () => {
  it('words every event the walk records, with its recorded time', async () => {
    const { details } = await everything(await adminPorts());
    const godavari = details.find((detail) => detail.institution.id === 'godavari')!;
    expect(historyLines(godavari).map((line) => [line.what, line.when, line.note])).toEqual([
      [
        'Request REQ-0058 received — additional licences',
        '21 Oct 2026, 16:05',
        'Meera Iyer, Institute Admin',
      ],
      [
        'Institute Admin assigned — Meera Iyer',
        '8 Oct 2026, 15:20',
        'meera.iyer@godavari.edu.in · Arjun Mehta',
      ],
      ['Access active · ACC-0107', '8 Oct 2026, 15:05', 'Payment confirmed.'],
      ['Request REQ-0042 approved — payment required', '8 Oct 2026, 11:20', 'External.'],
    ]);
    const deccan = details.find((detail) => detail.institution.id === 'deccan')!;
    expect(historyLines(deccan)[0]).toMatchObject({
      what: 'Access paused by Arjun Mehta',
      when: '12 Oct 2026, 09:40',
      note: '“The institution asked us to pause access while it checks its student list.”',
    });
    const bits = details.find((detail) => detail.institution.id === 'bitshyd')!;
    expect(historyLines(bits).map((line) => line.what)).toEqual([
      'Renewal REQ-0038 received',
      'Institute Admin assigned — Dr P. Srinivas',
      'Access active · ACC-0098',
      'Request REQ-0039 approved',
    ]);
    expect(historyLines(bits).at(-1)!.note).toBe('Internal.');
    expect(historyLines(bits).at(-2)!.note).toBe('Internal — no payment step.');
  });
});
