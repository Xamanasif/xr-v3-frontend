/**
 * Phase 3 · the Super Admin's Operations: SA-18 Device transfers (B3-11 f0, f2, f3; B7-09 f0, f2)
 * and SA-19 Device transfer decision (B3-11 f1, f4, f5; B7-09 f1, f3; B7-10 f14), with the
 * device-transfer row of SA-07's "Needs attention" (B7-03 `att`), on the real composition root and
 * the sample world's DTR-0018 / DTR-0019. The list is the service's answer per state, the one
 * command is `approveDeviceTransfer` with the revision the confirmation opened on, refusals write
 * nothing, and the approval is read back through the Student's and the Institute Admin's own ports
 * (the same DTR record). There is no Decline (T-32).
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { asPersonId, buildWorld, faults, fixtureWorld, stepsTo } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { expandTarget } from '@/nav/link-targets';
import { P3_OPERATIONS_LINK_TARGETS } from '@/nav/link-targets-p3/operations';
import { resolveAddress } from '@/nav/routes';
import type { PlatformRuntime } from '@/platform/runtime';
import { board } from '@/test-support/boards';
import {
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
  worldPlatform,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { InstitutionDetail } from './sa-07-institution-detail/institution-detail';
import { DeviceTransfers } from './sa-18-device-transfers/device-transfers';
import { DeviceTransferDecision } from './sa-19-device-transfer/device-transfer-decision';

afterEach(() => {
  forgetLastAddress();
});

const B7_03 = board('B7-03-Institution-Detail.dc.html');
const RAHUL = 'per-0002';
const MEERA = 'per-0001';
const LIST = '/admin/operations/device-transfers';

type World = Awaited<ReturnType<typeof fixtureWorld>>;

/** The walk through Device 2 (23 Oct 2026, 10:00): DTR-0018 forwarded to BITS, not yet approved. */
let forwardedWorld: Promise<World> | null = null;
function forwarded(): Promise<World> {
  forwardedWorld ??= (async () => {
    const { steps, at } = stepsTo({ through: 'Dv2' });
    return buildWorld(await fixtureWorld('spine-start'), steps, { seedId: 'sa-19-dv2', at });
  })();
  return forwardedWorld;
}

async function forwardedPlatform() {
  return worldPlatform(SUPER_ADMIN, await forwarded());
}

function inAdmin(runtime: PlatformRuntime, path: string, page: ReactNode, search = '') {
  const navigation = testNavigation(path, search);
  const view = renderInTab(
    <WorkspaceLayout workspace="admin">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const topTitle = () => document.querySelector('.xr-top-title')?.textContent;
const currentNav = () => document.querySelector('.xr-nav a[aria-current="page"]');
const cells = (row: Element) => [...row.querySelectorAll('td')].map((cell) => cell.textContent);

async function transferOf(runtime: PlatformRuntime, id: string) {
  const answer = await runtime.ports.operations.listDeviceTransfers({});
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value.find((transfer) => transfer.id === id)!;
}

// ---- SA-18 Operations › Device transfers ----------------------------------------------------

describe('SA-18 — Operations › Device transfers (B3-11 f0, f2, f3)', () => {
  it('Forwarded to BITS: the drawn header, one tab, the Show links and DTR-0018’s row (f0)', async () => {
    const { runtime, sample } = await forwardedPlatform();
    const version = sample.worldVersion();
    inAdmin(runtime, LIST, <DeviceTransfers />);
    const table = await screen.findByRole('table', { name: 'Device transfers' });
    expect(screen.getByRole('heading', { level: 1, name: 'Operations' })).toBeVisible();
    expect(main().querySelector('.xr-phead-meta')).toHaveTextContent(
      'Device transfers, support reports and access ending',
    );
    expect(topTitle()).toBe('Operations');
    expect(currentNav()).toHaveTextContent('Operations');
    // The Operations tabs (Phase 6, B7-09 f0): three links on white, Device transfers current.
    const tabs = screen.getByRole('navigation', { name: 'Operations' });
    expect(tabs).toHaveClass('xr-tabs', 'xr-tabs--on-white');
    expect(
      within(tabs)
        .getAllByRole('link')
        .map((link) => [
          link.textContent,
          link.getAttribute('href'),
          link.getAttribute('aria-current'),
        ]),
    ).toEqual([
      ['Device transfers', LIST, 'page'],
      ['Support', '/admin/operations/support', null],
      ['Access ending', '/admin/operations/access-ending', null],
    ]);
    // Show: three links, the forwarded view current.
    const show = screen.getByRole('group', { name: 'Show' });
    expect(show).toHaveClass('xr-seg', 'xl-seg');
    expect(
      within(show)
        .getAllByRole('link')
        .map((link) => [
          link.textContent,
          link.getAttribute('href'),
          link.getAttribute('aria-current'),
        ]),
    ).toEqual([
      ['Forwarded to BITS', LIST, 'true'],
      ['Still with an institution', `${LIST}?show=with-institution`, null],
      ['Approved', `${LIST}?show=approved`, null],
    ]);
    // The table as drawn: five columns, the last one named for screen readers only.
    expect([...table.querySelectorAll('th')].map((th) => th.textContent)).toEqual([
      'Request',
      'Institution',
      'Forwarded',
      'Status',
      'Action',
    ]);
    expect(table.querySelector('th:last-child .xr-sr')).not.toBeNull();
    const rows = table.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(cells(row)).toEqual([
      'DTR-0018Rahul Verma · VR',
      'Godavari Institute of Technology',
      '23 Oct 2026, 10:00 · Meera Iyer',
      'Forwarded',
      'Review',
    ]);
    expect(within(row as HTMLElement).getByRole('link', { name: 'DTR-0018' })).toHaveAttribute(
      'href',
      `${LIST}/DTR-0018`,
    );
    expect(
      within(row as HTMLElement).getByRole('link', { name: 'Review DTR-0018' }),
    ).toHaveAttribute('href', `${LIST}/DTR-0018`);
    expect(row.querySelector('.xr-status')).toHaveClass('xr-status--wait');
    expect(
      [...row.querySelectorAll('td[data-label]')].map((cell) => cell.getAttribute('data-label')),
    ).toEqual(['Institution', 'Forwarded', 'Status']);
    // Opening the list writes nothing.
    expect(sample.worldVersion()).toBe(version);
  });

  it('Still with an institution: DTR-0019 read-only — no link, “Not yet”, no Review (f2)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'state-coverage');
    inAdmin(runtime, LIST, <DeviceTransfers />, '?show=with-institution');
    const table = await screen.findByRole('table', { name: 'Device transfers' });
    const show = screen.getByRole('group', { name: 'Show' });
    expect(within(show).getByRole('link', { name: 'Still with an institution' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    const rows = table.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(cells(rows[0]!)).toEqual([
      'DTR-0019Imran Shaikh · VR',
      'Godavari Institute of Technology',
      'Not yet',
      'Still with the institution',
      '',
    ]);
    expect(within(table).queryByRole('link')).toBeNull();
    expect(rows[0]!.querySelector('.xr-status')).toHaveClass('xr-status--off');
  });

  it('Approved: DTR-0018 opens its record; no Review (f3)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-device');
    inAdmin(runtime, LIST, <DeviceTransfers />, '?show=approved');
    const table = await screen.findByRole('table', { name: 'Device transfers' });
    const rows = table.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(cells(rows[0]!)).toEqual([
      'DTR-0018Rahul Verma · VR',
      'Godavari Institute of Technology',
      '23 Oct 2026, 10:00 · Meera Iyer',
      'Approved',
      '',
    ]);
    expect(
      within(table)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['DTR-0018']);
    expect(rows[0]!.querySelector('.xr-status')).toHaveClass('xr-status--ok');
  });

  it('each view that holds nothing says so (board-04 empty grammar, provisional)', async () => {
    const before = await tabPlatform(SUPER_ADMIN, 'after-flow-b');
    const first = inAdmin(before.runtime, LIST, <DeviceTransfers />);
    expect(
      await screen.findByRole('heading', { name: 'No device transfers waiting for BITS' }),
    ).toBeVisible();
    expect(main()).toHaveTextContent(
      'A transfer appears here when an Institute Admin forwards it.',
    );
    expect(screen.queryByRole('table')).toBeNull();
    first.view.unmount();

    const approved = await tabPlatform(SUPER_ADMIN, 'after-flow-b');
    const second = inAdmin(approved.runtime, LIST, <DeviceTransfers />, '?show=approved');
    expect(
      await screen.findByRole('heading', { name: 'No device transfers approved yet' }),
    ).toBeVisible();
    second.view.unmount();

    const decided = await tabPlatform(SUPER_ADMIN, 'after-flow-device');
    inAdmin(decided.runtime, LIST, <DeviceTransfers />, '?show=with-institution');
    expect(
      await screen.findByRole('heading', { name: 'No device transfers are with an institution' }),
    ).toBeVisible();
  });

  it('an unknown “show” is replaced by the list’s own address', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-device');
    const { navigation } = inAdmin(runtime, LIST, <DeviceTransfers />, '?show=declined');
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith(LIST));
    expect(
      within(screen.getByRole('group', { name: 'Show' })).getByRole('link', {
        name: 'Forwarded to BITS',
      }),
    ).toHaveAttribute('aria-current', 'true');
  });

  it('loading is announced; a failure has “Try again” and “Report a problem”', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-device');
    faults(sample).failNext('OperationsService.listDeviceTransfers');
    inAdmin(runtime, LIST, <DeviceTransfers />, '?show=approved');
    expect(await screen.findByText('Loading device transfers')).toHaveAttribute('role', 'status');
    expect(
      await screen.findByText('The device transfers didn’t load. Nothing was lost.'),
    ).toBeVisible();
    expect(main()).toHaveTextContent('Try again. If it keeps happening, report the problem.');
    expect(screen.getByRole('link', { name: 'Report a problem' })).toHaveAttribute(
      'href',
      '/admin/help/report',
    );
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      (await screen.findByRole('table', { name: 'Device transfers' })).querySelectorAll('tbody tr'),
    ).toHaveLength(1);
  });
});

// ---- SA-19 Device transfer decision ---------------------------------------------------------

function openTransfer(runtime: PlatformRuntime, id: string) {
  return inAdmin(runtime, `${LIST}/${id}`, <DeviceTransferDecision transferId={id} />);
}

async function panel(): Promise<HTMLElement> {
  return (await screen.findByRole('complementary', { name: 'Your decision' })) as HTMLElement;
}

describe('SA-19 — Device transfer decision (B3-11 f1, f4, f5; B7-10 f14)', () => {
  it('forwarded: the transfer, its history and the one action, from the world’s record (f1)', async () => {
    const { runtime, sample } = await forwardedPlatform();
    const version = sample.worldVersion();
    openTransfer(runtime, 'DTR-0018');
    await screen.findByRole('heading', { level: 1, name: 'VR device transfer for Rahul Verma' });
    const header = main().querySelector('.xr-phead')!;
    expect(header.querySelector('.xr-overline')).toHaveTextContent('Device transfer · DTR-0018');
    expect(header.querySelector('.xr-phead-meta')).toHaveTextContent(
      'ForwardedGodavari Institute of Technology',
    );
    expect(header.querySelector('.xr-status')).toHaveClass('xr-status--wait');
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', LIST);
    expect(main().querySelector('a.xr-back')).toHaveTextContent('Device transfers');
    expect(topTitle()).toBe('DTR-0018');
    expect(currentNav()).toHaveTextContent('Operations');
    const facts = screen.getByRole('region', { name: 'The transfer' });
    expect(
      [...facts.querySelectorAll('dt')].map((dt) => [
        dt.textContent,
        dt.nextElementSibling!.textContent,
      ]),
    ).toEqual([
      ['Student', 'Rahul Verma · GIT-2026-0418'],
      ['Institution', 'Godavari Institute of Technology'],
      ['Format', 'VR for Shell-and-Tube Heat Exchanger'],
      ['Moving from', 'ME lab VR headset, asset tag GIT-VR-03'],
      ['New device', 'ME lab VR headset, asset tag GIT-VR-07'],
      ['Student’s note', 'GIT-VR-03 has gone for repair; the lab gave me GIT-VR-07.'],
      ['Forwarded by', 'Meera Iyer, Institute Admin'],
    ]);
    expect(facts.querySelector('.xr-fmt.xr-fmt--yours.xr-fmt--compact')).toHaveTextContent('VR');
    const history = screen.getByRole('region', { name: 'History' });
    expect(
      [...history.querySelectorAll('li')].map((item) => [
        item.querySelector('.xr-tl-what')!.textContent,
        item.querySelector('.xr-tl-when')!.textContent,
        item.querySelector('.xr-tl-note')?.textContent ?? null,
      ]),
    ).toEqual([
      ['Forwarded to BITS by Meera Iyer', '23 Oct 2026, 10:00', null],
      [
        'Requested by Rahul Verma',
        '22 Oct 2026, 09:10',
        'From ME lab VR headset, asset tag GIT-VR-03 to ME lab VR headset, asset tag GIT-VR-07',
      ],
    ]);
    const decision = await panel();
    expect(decision).toHaveTextContent(
      'Approving moves Rahul Verma’s VR authorisation to the new device.',
    );
    expect(
      within(decision)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Approve transfer']);
    expect(screen.queryByRole('button', { name: /Decline/ })).toBeNull();
    expect(sample.worldVersion()).toBe(version);
  });

  it('Approve: DL-1 says what changes; Cancel writes nothing; confirmed, the same record reads Approved for every role (f4 → f5)', async () => {
    const { runtime, sample } = await forwardedPlatform();
    openTransfer(runtime, 'DTR-0018');
    const decision = await panel();
    const user = userEvent.setup();
    const version = sample.worldVersion();
    const approve = within(decision).getByRole('button', { name: 'Approve transfer' });
    await user.click(approve);
    let dialog = await screen.findByRole('dialog', { name: 'Approve DTR-0018?' });
    expect(dialog).toHaveTextContent(
      'Rahul Verma’s authorised device for VR becomes ME lab VR headset, asset tag GIT-VR-07. The student and Meera Iyer see “Approved”.',
    );
    expect(dialog.querySelector('strong')).toHaveTextContent(
      'ME lab VR headset, asset tag GIT-VR-07',
    );
    expect(within(dialog).getByRole('button', { name: 'Approve transfer' })).toHaveFocus();
    expect(within(dialog).queryByRole('textbox')).toBeNull();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(approve).toHaveFocus();
    expect(sample.worldVersion()).toBe(version);

    await user.click(approve);
    dialog = await screen.findByRole('dialog', { name: 'Approve DTR-0018?' });
    await user.click(within(dialog).getByRole('button', { name: 'Approve transfer' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.getElementById('transfer-status')).toHaveFocus());
    expect(document.getElementById('transfer-status')).toHaveTextContent('Approved');
    expect(main().querySelector('.xr-notice--ok[role="status"]')).toHaveTextContent(
      'Approved. Rahul Verma and Meera Iyer now see “Approved”.',
    );
    expect(decision).toHaveTextContent(
      /^Your decisionApproved on 23 Oct 2026, \d\d:\d\d by Arjun Mehta\.$/,
    );
    expect(within(decision).queryByRole('button')).toBeNull();
    const history = screen.getByRole('region', { name: 'History' });
    expect(history.querySelector('li.is-latest .xr-tl-what')).toHaveTextContent('Approved by BITS');
    expect(history.querySelector('li.is-latest .xr-tl-note')).toHaveTextContent(
      'The authorised device is now: ME lab VR headset, asset tag GIT-VR-07',
    );
    // One write, read back through the other roles' own ports: the same DTR record.
    expect(sample.worldVersion()).toBeGreaterThan(version);
    const mine = await asPersonId(sample, RAHUL).operations.getMyDevice();
    if (!mine.ok) throw new Error(mine.error.kind);
    expect(mine.value.devices.map((device) => device.description)).toEqual([
      'ME lab VR headset, asset tag GIT-VR-07',
    ]);
    expect(mine.value.lastTransfer?.state).toBe('approved');
    const theirs = await asPersonId(sample, MEERA).operations.getDeviceRequest('DTR-0018' as never);
    expect(theirs.ok && theirs.value.state).toBe('approved');
  });

  it('approved elsewhere while the confirmation is open: refused as stale, nothing more written, the current record shown (SA-19.moved-on)', async () => {
    const { runtime, sample } = await forwardedPlatform();
    openTransfer(runtime, 'DTR-0018');
    const decision = await panel();
    const user = userEvent.setup();
    await user.click(within(decision).getByRole('button', { name: 'Approve transfer' }));
    const dialog = await screen.findByRole('dialog', { name: 'Approve DTR-0018?' });
    const opened = await transferOf(runtime, 'DTR-0018');
    const elsewhere = await asPersonId(sample, SUPER_ADMIN).operations.approveDeviceTransfer({
      id: opened.id,
      expectedRev: opened.rev,
    });
    if (!elsewhere.ok) throw new Error(elsewhere.error.kind);
    const version = sample.worldVersion();
    // The page has not read the change yet: the confirmation still names what it opened on.
    expect(dialog).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Approve transfer' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() =>
      expect(within(decision).getByRole('heading', { name: 'Your decision' })).toHaveFocus(),
    );
    expect(sample.worldVersion()).toBe(version);
    await waitFor(() =>
      expect(decision).toHaveTextContent(/Approved on 23 Oct 2026, \d\d:\d\d by Arjun Mehta\./),
    );
    expect(main().querySelector('.xr-notice--ok')).toBeNull();
    expect(document.getElementById('transfer-status')).toHaveTextContent('Approved');
  });

  it('approved in another session while the panel is on show: the decided panel replaces it', async () => {
    const { runtime, sample } = await forwardedPlatform();
    openTransfer(runtime, 'DTR-0018');
    const decision = await panel();
    const opened = await transferOf(runtime, 'DTR-0018');
    const elsewhere = await asPersonId(sample, SUPER_ADMIN).operations.approveDeviceTransfer({
      id: opened.id,
      expectedRev: opened.rev,
    });
    if (!elsewhere.ok) throw new Error(elsewhere.error.kind);
    await act(() => runtime.invalidate(elsewhere.changed));
    await waitFor(() => expect(decision).toHaveTextContent(/Approved on 23 Oct 2026/));
    expect(within(decision).queryByRole('button')).toBeNull();
  });

  it('a command unavailable for now changes nothing: the confirmation stays open and can be sent again', async () => {
    const { runtime, sample } = await forwardedPlatform();
    openTransfer(runtime, 'DTR-0018');
    const decision = await panel();
    const user = userEvent.setup();
    await user.click(within(decision).getByRole('button', { name: 'Approve transfer' }));
    const dialog = await screen.findByRole('dialog', { name: 'Approve DTR-0018?' });
    const version = sample.worldVersion();
    faults(sample).failNext('OperationsService.approveDeviceTransfer');
    await user.click(within(dialog).getByRole('button', { name: 'Approve transfer' }));
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Approve transfer' })).not.toHaveAttribute(
        'aria-disabled',
      ),
    );
    expect(dialog).toBeVisible();
    expect(sample.worldVersion()).toBe(version);
    await user.click(within(dialog).getByRole('button', { name: 'Approve transfer' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect((await transferOf(runtime, 'DTR-0018')).state).toBe('approved');
  });

  it('approved: read-only with who and when (f5)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-device');
    openTransfer(runtime, 'DTR-0018');
    const decision = await panel();
    expect(decision).toHaveTextContent('Approved on 24 Oct 2026, 12:30 by Arjun Mehta.');
    expect(within(decision).queryByRole('button')).toBeNull();
    expect(main().querySelector('.xr-phead .xr-status')).toHaveClass('xr-status--ok');
    expect(main().querySelector('.xr-notice--ok')).toBeNull();
    const history = screen.getByRole('region', { name: 'History' });
    expect([...history.querySelectorAll('.xr-tl-what')].map((node) => node.textContent)).toEqual([
      'Approved by BITS',
      'Forwarded to BITS by Meera Iyer',
      'Requested by Rahul Verma',
    ]);
    expect(history.querySelector('.xr-tl-when')).toHaveTextContent('24 Oct 2026, 12:30');
  });

  it('still with the institution: “hasn’t reached BITS yet”, nothing to approve (B7-10 f14)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'state-coverage');
    openTransfer(runtime, 'DTR-0019');
    await screen.findByRole('heading', { level: 1, name: 'Device transfers' });
    expect(
      screen.getByRole('heading', { level: 2, name: 'DTR-0019 hasn’t reached BITS yet' }),
    ).toBeVisible();
    expect(main()).toHaveTextContent(
      'It is still with the institution. It appears here when the Institute Admin forwards it.',
    );
    expect(main().querySelector('a.xr-back')).toHaveTextContent('Operations');
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', LIST);
    expect(screen.queryByRole('button', { name: 'Approve transfer' })).toBeNull();
    expect(within(main()).queryByRole('complementary')).toBeNull();
    expect(topTitle()).toBe('DTR-0019');
  });

  it('an id the list does not hold is the in-shell not-found page', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-device');
    openTransfer(runtime, 'DTR-0099');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
  });

  it('loading is announced; a failure has “Try again”', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-device');
    faults(sample).failNext('OperationsService.listDeviceTransfers');
    openTransfer(runtime, 'DTR-0018');
    expect(await screen.findByText('Loading the device transfer')).toHaveAttribute(
      'role',
      'status',
    );
    expect(
      await screen.findByText('The device transfer didn’t load. Nothing was lost.'),
    ).toBeVisible();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'VR device transfer for Rahul Verma' }),
    ).toBeVisible();
  });
});

// ---- SA-07 "Needs attention": the forwarded transfer (B7-03 `att`) --------------------------

describe('SA-07 — a device transfer forwarded to BITS needs attention (B7-03 f0)', () => {
  it('lists DTR-0018 while forwarded, opening Operations; not once approved', async () => {
    const { runtime } = await forwardedPlatform();
    const first = inAdmin(
      runtime,
      '/admin/institutions/godavari',
      <InstitutionDetail institutionId="godavari" />,
    );
    await screen.findByRole('heading', { level: 1, name: 'Godavari Institute of Technology' });
    const attention = screen.getByRole('region', { name: 'Needs attention' });
    const row = [...attention.querySelectorAll('.xr-row')].find((item) =>
      item.textContent!.includes('DTR-0018'),
    )!;
    expect(row.querySelector('.xr-row-title')).toHaveTextContent(
      'DTR-0018 — device transfer forwarded on 23 Oct 2026',
    );
    expect(B7_03).toContain('DTR-0018 — device transfer forwarded on 23 Oct 2026');
    expect(within(row as HTMLElement).getByRole('link', { name: 'Operations' })).toHaveAttribute(
      'href',
      LIST,
    );
    first.view.unmount();

    const decided = await tabPlatform(SUPER_ADMIN, 'after-flow-device');
    inAdmin(
      decided.runtime,
      '/admin/institutions/godavari',
      <InstitutionDetail institutionId="godavari" />,
    );
    await screen.findByRole('heading', { level: 1, name: 'Godavari Institute of Technology' });
    expect(screen.getByRole('region', { name: 'Needs attention' })).not.toHaveTextContent('DTR-');
  });
});

// ---- The ledger rows of these screens --------------------------------------------------------

describe('the SA-18 / SA-19 link-target rows', () => {
  it('every target is built: SA-18 / SA-19, Help, and (Phase 6) Support and Access ending', () => {
    for (const entry of P3_OPERATIONS_LINK_TARGETS) {
      expect(entry.outcome, entry.action).not.toBe('not-rendered');
      if (entry.target === null) continue;
      const target = expandTarget(entry.target, '/admin').split('?')[0]!;
      expect(['screen', 'record-screen'], entry.action).toContain(resolveAddress(target).kind);
    }
    expect(resolveAddress('/admin/operations/access-ending').kind).toBe('record-screen');
    expect(resolveAddress('/admin/operations/support').kind).toBe('record-screen');
    expect(
      P3_OPERATIONS_LINK_TARGETS.filter((entry) => entry.role === 'primary').map(
        (entry) => `${entry.screen}: ${entry.action}`,
      ),
    ).toEqual(['SA-19: Approve transfer']);
  });
});
