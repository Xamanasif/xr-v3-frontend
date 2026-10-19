/**
 * The Super Admin's Operations in the V3 design (SA-v1 `V.transfers`, `V.transfer`): SA-18 Device
 * transfers and SA-19 Device transfer decision, with the device-transfer row of SA-07's "Needs
 * attention" (B7-03 `att`), on the real composition root and the sample world's DTR-0018 /
 * DTR-0019. The list is the service's answer per state, the one command is
 * `approveDeviceTransfer` with the revision the confirmation opened on, refusals write nothing,
 * and the approval is read back through the Student's and the Institute Admin's own ports (the
 * same DTR record). There is no Decline (T-32), and no DTR reference is shown or named.
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
const currentNav = () => document.querySelector('aside.rb-rail .rb-nav a[aria-current="page"]');
const cells = (row: Element) => [...row.querySelectorAll('td')].map((cell) => cell.textContent);
const INTERNAL = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/** No internal reference in the page's words, names or descriptions (SA-v1 HANDOFF). */
function expectNoReferences(root: Element = main()) {
  expect(root.textContent).not.toMatch(INTERNAL);
  for (const element of root.querySelectorAll('[aria-label], [title], [aria-describedby]')) {
    expect(element.getAttribute('aria-label') ?? '').not.toMatch(INTERNAL);
    expect(element.getAttribute('title') ?? '').not.toMatch(INTERNAL);
  }
  expect(document.title).not.toMatch(INTERNAL);
}

/** The view switch's buttons as their words and whether each is pressed. */
function switchState() {
  return within(screen.getByRole('group', { name: 'Show device transfers' }))
    .getAllByRole('button')
    .map((button) => [button.textContent, button.getAttribute('aria-pressed')]);
}

async function transferOf(runtime: PlatformRuntime, id: string) {
  const answer = await runtime.ports.operations.listDeviceTransfers({});
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value.find((transfer) => transfer.id === id)!;
}

// ---- SA-18 Operations › Device transfers ----------------------------------------------------

describe('SA-18 — Operations › Device transfers (SA-v1 `V.transfers`)', () => {
  it('Forwarded to BITS: the head, the tabs, the counted views and the forwarded transfer, named by content', async () => {
    const { runtime, sample } = await forwardedPlatform();
    const version = sample.worldVersion();
    inAdmin(runtime, LIST, <DeviceTransfers />);
    const table = await screen.findByRole('table', { name: 'Device transfers, Forwarded to BITS' });
    const h1 = screen.getByRole('heading', { level: 1, name: 'Operations' });
    expect(h1).toHaveAttribute('tabindex', '-1');
    expect(h1).toHaveClass('rb-h1');
    expect(main()).toHaveTextContent(
      'Device transfers, support reports and access that is ending.',
    );
    expect(document.title).toBe('Operations · XR Learning Platform');
    expect(currentNav()).toHaveTextContent('Operations');
    // The Operations tabs: three links, Device transfers current.
    const tabs = screen.getByRole('navigation', { name: 'Operations' });
    expect(tabs).toHaveClass('rk-tabs', 'sa-tabs');
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
    // The view switch (`sa-seg`): pressed buttons with the service's counts.
    expect(screen.getByRole('group', { name: 'Show device transfers' }).parentElement).toHaveClass(
      'rb-switchbar',
      'sa-seg',
    );
    await waitFor(() =>
      expect(switchState()).toEqual([
        ['Forwarded to BITS 1', 'true'],
        ['Still with an institution 0', 'false'],
        ['Approved 0', 'false'],
      ]),
    );
    // The table as drawn: five columns, every row opening its transfer.
    expect([...table.querySelectorAll('th')].map((th) => th.textContent)).toEqual([
      'Student and format',
      'Institution',
      'Forwarded by',
      'Forwarded',
      'Status',
    ]);
    const rows = table.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(cells(row)).toEqual([
      'Rahul VermaVR device transfer',
      'Godavari Institute of Technology',
      'Meera Iyer, Institute Admin',
      'Forwarded 23 Oct 2026',
      'Forwarded',
    ]);
    expect(
      within(row as HTMLElement).getByRole('link', {
        name: 'VR device transfer for Rahul Verma, Forwarded. Open',
      }),
    ).toHaveAttribute('href', `${LIST}/DTR-0018`);
    expect(row.querySelector('.xr-st')).toHaveClass('xr-st--info');
    expect(main()).toHaveTextContent(
      'Approving moves a student’s authorisation to a new device. It doesn’t send, collect or register a device. A transfer BITS doesn’t approve stays Forwarded.',
    );
    expectNoReferences();
    // Opening the list writes nothing.
    expect(sample.worldVersion()).toBe(version);
  });

  it('Still with an institution: the transfer opens its record; “Not forwarded yet”, “Not yet”', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'state-coverage');
    inAdmin(runtime, LIST, <DeviceTransfers />, '?show=with-institution');
    const table = await screen.findByRole('table', {
      name: 'Device transfers, Still with an institution',
    });
    expect(
      within(screen.getByRole('group', { name: 'Show device transfers' })).getByRole('button', {
        name: /^Still with an institution/,
      }),
    ).toHaveAttribute('aria-pressed', 'true');
    const rows = table.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(cells(rows[0]!)).toEqual([
      'Imran ShaikhVR device transfer',
      'Godavari Institute of Technology',
      'Not forwarded yet',
      'Forwarded Not yet',
      'Still with the institution',
    ]);
    expect(
      within(table).getByRole('link', {
        name: 'VR device transfer for Imran Shaikh, Still with the institution. Open',
      }),
    ).toHaveAttribute('href', `${LIST}/DTR-0019`);
    expect(rows[0]!.querySelector('.xr-st')).toHaveClass('rk-st-ended');
    expectNoReferences();
  });

  it('Approved: the approved transfer opens its record', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-device');
    inAdmin(runtime, LIST, <DeviceTransfers />, '?show=approved');
    const table = await screen.findByRole('table', { name: 'Device transfers, Approved' });
    const rows = table.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(cells(rows[0]!)).toEqual([
      'Rahul VermaVR device transfer',
      'Godavari Institute of Technology',
      'Meera Iyer, Institute Admin',
      'Forwarded 23 Oct 2026',
      'Approved',
    ]);
    expect(
      within(table)
        .getAllByRole('link')
        .map((link) => [link.getAttribute('aria-label'), link.getAttribute('href')]),
    ).toEqual([['VR device transfer for Rahul Verma, Approved. Open', `${LIST}/DTR-0018`]]);
    expect(rows[0]!.querySelector('.xr-st')).toHaveClass('xr-st--ok');
  });

  it('choosing a view shows it and mirrors it in the address (replaced)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-device');
    const { navigation } = inAdmin(runtime, LIST, <DeviceTransfers />);
    expect(await screen.findByText('Nothing is waiting for your approval')).toBeVisible();
    const user = userEvent.setup();
    const approved = within(screen.getByRole('group', { name: 'Show device transfers' })).getByRole(
      'button',
      { name: /^Approved/ },
    );
    await user.click(approved);
    expect(navigation.replace).toHaveBeenLastCalledWith(`${LIST}?show=approved`);
    expect(approved).toHaveAttribute('aria-pressed', 'true');
    expect(approved).toHaveFocus();
    expect(
      (await screen.findByRole('table', { name: 'Device transfers, Approved' })).querySelectorAll(
        'tbody tr',
      ),
    ).toHaveLength(1);
  });

  it('each view that holds nothing says so (the export’s empty views)', async () => {
    const before = await tabPlatform(SUPER_ADMIN, 'after-flow-b');
    const first = inAdmin(before.runtime, LIST, <DeviceTransfers />);
    expect(await screen.findByText('Nothing is waiting for your approval')).toHaveClass(
      'rk-state-t',
    );
    expect(main()).toHaveTextContent(
      'Transfers appear here when an Institute Admin forwards a student’s request.',
    );
    expect(screen.queryByRole('table')).toBeNull();
    first.view.unmount();

    const approved = await tabPlatform(SUPER_ADMIN, 'after-flow-b');
    const second = inAdmin(approved.runtime, LIST, <DeviceTransfers />, '?show=approved');
    expect(await screen.findByText('No transfer has been approved yet')).toBeVisible();
    second.view.unmount();

    const decided = await tabPlatform(SUPER_ADMIN, 'after-flow-device');
    inAdmin(decided.runtime, LIST, <DeviceTransfers />, '?show=with-institution');
    expect(await screen.findByText('No transfer is still with an institution')).toBeVisible();
  });

  it('an unknown “show” is replaced by the list’s own address', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-device');
    const { navigation } = inAdmin(runtime, LIST, <DeviceTransfers />, '?show=declined');
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith(LIST));
    expect(
      within(screen.getByRole('group', { name: 'Show device transfers' })).getByRole('button', {
        name: /^Forwarded to BITS/,
      }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('loading is announced over skeleton rows; a failure has “Try again”', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-device');
    faults(sample).failNext('OperationsService.listDeviceTransfers');
    inAdmin(runtime, LIST, <DeviceTransfers />, '?show=approved');
    expect(await screen.findByText('Loading device transfers…')).toHaveAttribute('role', 'status');
    expect(await screen.findByText('We couldn’t load the device transfers')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Nothing has changed. Try again.');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      (await screen.findByRole('table', { name: 'Device transfers, Approved' })).querySelectorAll(
        'tbody tr',
      ),
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

const APPROVE_TITLE = 'Approve the VR device transfer for Rahul Verma?';

describe('SA-19 — Device transfer decision (SA-v1 `V.transfer`)', () => {
  it('forwarded: the crumbs, the head, the transfer, its history and the one action, from the world’s record', async () => {
    const { runtime, sample } = await forwardedPlatform();
    const version = sample.worldVersion();
    openTransfer(runtime, 'DTR-0018');
    const h1 = await screen.findByRole('heading', {
      level: 1,
      name: 'VR device transfer for Rahul Verma',
    });
    expect(h1).toHaveAttribute('tabindex', '-1');
    expect(h1).toHaveClass('rk-title');
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(
      within(crumbs)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Operations', LIST],
      ['Device transfers', LIST],
    ]);
    expect(crumbs.querySelector('[aria-current="page"]')).toHaveTextContent('Rahul Verma');
    const head = main().querySelector('.rk-head')!;
    expect(head.querySelector('.rk-eyebrow')).toHaveTextContent('Device transfer');
    expect(head.querySelector('.rk-meta')).toHaveTextContent(
      'ForwardedGodavari Institute of Technology',
    );
    expect(head.querySelector('.xr-st')).toHaveClass('xr-st--info', 'rk-st-lg');
    expect(head.querySelector('a.rk-goto')).toHaveAttribute('href', '#transfer-decision');
    expect(document.title).toBe('VR device transfer for Rahul Verma · XR Learning Platform');
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
      ['Student’s note', '“GIT-VR-03 has gone for repair; the lab gave me GIT-VR-07.”'],
      ['Forwarded by', 'Meera Iyer, Institute Admin'],
    ]);
    const history = screen.getByRole('region', { name: 'History' });
    expect(history).toHaveTextContent('Newest first');
    expect(
      [...history.querySelectorAll('li')].map((item) => [
        item.querySelector('.rk-tl-w')!.textContent,
        item.querySelector('.rk-tl-t')!.textContent,
        item.querySelector('.rk-tl-n')?.textContent ?? null,
      ]),
    ).toEqual([
      ['Forwarded to BITS', '23 Oct 2026, 10:00', 'By Meera Iyer, Institute Admin.'],
      ['Transfer requested', '22 Oct 2026, 09:10', 'By Rahul Verma, Student.'],
    ]);
    const decision = await panel();
    expect(decision).toHaveTextContent(
      'Approving moves Rahul Verma’s VR authorisation to the new device.',
    );
    expect(decision).toHaveTextContent(
      'Nothing is sent, collected or registered from here. A transfer BITS doesn’t approve stays Forwarded.',
    );
    expect(
      within(decision)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Approve transfer']);
    expect(within(decision).getByRole('button', { name: 'Approve transfer' })).toHaveClass(
      'rb-btn--primary',
      'rk-go',
    );
    expect(screen.queryByRole('button', { name: /Decline/ })).toBeNull();
    expectNoReferences();
    expect(sample.worldVersion()).toBe(version);
  });

  it('Approve: the confirmation says what moves now; Cancel writes nothing; confirmed, the flash takes focus and the same record reads Approved for every role', async () => {
    const { runtime, sample } = await forwardedPlatform();
    openTransfer(runtime, 'DTR-0018');
    const decision = await panel();
    const user = userEvent.setup();
    const version = sample.worldVersion();
    const approve = within(decision).getByRole('button', { name: 'Approve transfer' });
    await user.click(approve);
    let dialog = await screen.findByRole('dialog', { name: APPROVE_TITLE });
    expect(dialog).toHaveAccessibleDescription(
      'Approving is not a refusal, so no reason is asked.',
    );
    expect(dialog).toHaveTextContent(
      'What happens nowRahul Verma’s VR authorisation moves from ME lab VR headset, asset tag GIT-VR-03 to ME lab VR headset, asset tag GIT-VR-07.Rahul Verma and the Institute Admin see “Approved”.',
    );
    expect(dialog).toHaveTextContent(
      'Only after later events, or not from hereNothing is sent, collected or registered from here.',
    );
    await waitFor(() =>
      expect(within(dialog).getByRole('heading', { name: APPROVE_TITLE })).toHaveFocus(),
    );
    expect(within(dialog).queryByRole('textbox')).toBeNull();
    expectNoReferences(dialog);
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(approve).toHaveFocus();
    expect(sample.worldVersion()).toBe(version);

    await user.click(approve);
    dialog = await screen.findByRole('dialog', { name: APPROVE_TITLE });
    await user.click(within(dialog).getByRole('button', { name: 'Approve transfer' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const flash = await waitFor(() => {
      const element = document.getElementById('transfer-flash');
      expect(element).toHaveFocus();
      return element!;
    });
    expect(flash).toHaveClass('rk-notice', 'rk-notice--ok');
    expect(flash).toHaveAttribute('role', 'status');
    expect(flash).toHaveTextContent(
      'Approved.Rahul Verma and the Institute Admin now see “Approved”.',
    );
    expect(main().querySelector('.rk-head .xr-st')).toHaveTextContent('Approved');
    const done = decision.querySelector('.rk-done')!;
    expect(done.querySelector('.rk-done-meta')).toHaveTextContent(
      /^Approved on 23 Oct 2026, \d\d:\d\d by Arjun Mehta$/,
    );
    expect(done).toHaveTextContent(
      'Rahul Verma and the Institute Admin see “Approved”. This decision is read-only.',
    );
    expect(within(decision).queryByRole('button')).toBeNull();
    expect(
      within(decision).getByRole('link', { name: 'Back to device transfers' }),
    ).toHaveAttribute('href', LIST);
    const history = screen.getByRole('region', { name: 'History' });
    expect(history.querySelector('li.is-latest .rk-tl-w')).toHaveTextContent(
      'Approved by Arjun Mehta',
    );
    expect(history.querySelector('li.is-latest .rk-tl-n')).toHaveTextContent(
      'The VR authorisation moved to the new device.',
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

  it('approved elsewhere while the confirmation is open: refused, nothing more written, the current record under the refusal notice (SA-19.moved-on)', async () => {
    const { runtime, sample } = await forwardedPlatform();
    openTransfer(runtime, 'DTR-0018');
    const decision = await panel();
    const user = userEvent.setup();
    await user.click(within(decision).getByRole('button', { name: 'Approve transfer' }));
    const dialog = await screen.findByRole('dialog', { name: APPROVE_TITLE });
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
    const refusal = within(decision).getByRole('alert');
    expect(refusal).toHaveClass('rk-notice', 'rk-notice--warn');
    expect(refusal).toHaveTextContent(
      'This device transfer changed since you opened itIt has been read again. Check it, then decide again.',
    );
    await waitFor(() =>
      expect(decision.querySelector('.rk-done-meta')).toHaveTextContent(
        /Approved on 23 Oct 2026, \d\d:\d\d by Arjun Mehta/,
      ),
    );
    expect(document.getElementById('transfer-flash')).toBeNull();
    expect(main().querySelector('.rk-head .xr-st')).toHaveTextContent('Approved');
    // "Check it again" closes the notice; focus moves to the page's heading.
    await user.click(within(refusal).getByRole('button', { name: 'Check it again' }));
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'VR device transfer for Rahul Verma' }),
      ).toHaveFocus(),
    );
    expect(within(decision).queryByRole('alert')).toBeNull();
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
    expect(within(decision).queryByRole('alert')).toBeNull();
  });

  it('a command unavailable for now changes nothing: the confirmation stays open and can be sent again', async () => {
    const { runtime, sample } = await forwardedPlatform();
    openTransfer(runtime, 'DTR-0018');
    const decision = await panel();
    const user = userEvent.setup();
    await user.click(within(decision).getByRole('button', { name: 'Approve transfer' }));
    const dialog = await screen.findByRole('dialog', { name: APPROVE_TITLE });
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

  it('approved: read-only with who and when', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-device');
    openTransfer(runtime, 'DTR-0018');
    const decision = await panel();
    expect(decision.querySelector('.rk-done-meta')).toHaveTextContent(
      'Approved on 24 Oct 2026, 12:30 by Arjun Mehta',
    );
    expect(decision.querySelector('.rk-done .xr-st')).toHaveClass('xr-st--ok', 'rk-st-lg');
    expect(within(decision).queryByRole('button')).toBeNull();
    expect(main().querySelector('.rk-head .xr-st')).toHaveClass('xr-st--ok');
    expect(document.getElementById('transfer-flash')).toBeNull();
    const history = screen.getByRole('region', { name: 'History' });
    expect([...history.querySelectorAll('.rk-tl-w')].map((node) => node.textContent)).toEqual([
      'Approved by Arjun Mehta',
      'Forwarded to BITS',
      'Transfer requested',
    ]);
    expect(history.querySelector('.rk-tl-t')).toHaveTextContent('24 Oct 2026, 12:30');
    expectNoReferences();
  });

  it('still with the institution: the record, and the panel says it is not BITS’s to decide yet', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'state-coverage');
    openTransfer(runtime, 'DTR-0019');
    await screen.findByRole('heading', { level: 1, name: 'VR device transfer for Imran Shaikh' });
    expect(main().querySelector('.rk-head .xr-st')).toHaveClass('rk-st-ended');
    expect(main().querySelector('.rk-head .xr-st')).toHaveTextContent('Still with the institution');
    const decision = await panel();
    const notice = decision.querySelector('.rk-notice')!;
    expect(notice).toHaveClass('rk-notice--off');
    expect(notice).toHaveAttribute('role', 'status');
    expect(notice).toHaveTextContent(
      'Not BITS’s to decide yetIt is still with the institution. It appears in Forwarded when the Institute Admin forwards it.',
    );
    expect(screen.queryByRole('button', { name: 'Approve transfer' })).toBeNull();
    expect(screen.getByRole('region', { name: 'The transfer' })).not.toHaveTextContent(
      'Forwarded by',
    );
    expectNoReferences();
  });

  it('an id the list does not hold is the “not available” message in place', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-device');
    openTransfer(runtime, 'DTR-0099');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'This page isn’t available' }),
    ).toBeVisible();
    await waitFor(() => expect(document.title).toBe('Not available · XR Learning Platform'));
    expectNoReferences();
  });

  it('loading is announced; a failure has “Try again”', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-device');
    faults(sample).failNext('OperationsService.listDeviceTransfers');
    openTransfer(runtime, 'DTR-0018');
    expect(await screen.findByText('Loading the device transfer…')).toHaveAttribute(
      'role',
      'status',
    );
    expect(await screen.findByText('We couldn’t load the device transfer')).toBeVisible();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'VR device transfer for Rahul Verma' }),
    ).toBeVisible();
  });
});

// ---- SA-07 "Also waiting for this institution": the forwarded transfer (SA-v1 `att`) ----------

describe('SA-07 — a device transfer forwarded to BITS is waiting for the institution (SA-v1 `att`)', () => {
  it('lists it while forwarded, by content, opening its decision (SA-19); not once approved', async () => {
    const { runtime } = await forwardedPlatform();
    const first = inAdmin(
      runtime,
      '/admin/institutions/godavari',
      <InstitutionDetail institutionId="godavari" />,
    );
    await screen.findByRole('heading', { level: 1, name: 'Godavari Institute of Technology' });
    const waiting = screen
      .getByRole('complementary', { name: 'What you can do' })
      .querySelector('.sa-attn') as HTMLElement;
    const row = [...waiting.querySelectorAll('li')].find((item) =>
      item.textContent!.includes('device transfer'),
    )!;
    expect(row).toHaveTextContent('VR device transfer for Rahul VermaReview transfer');
    expect(row).not.toHaveTextContent('DTR-');
    expect(within(row).getByRole('link', { name: 'Review transfer' })).toHaveAttribute(
      'href',
      `${LIST}/DTR-0018`,
    );
    first.view.unmount();

    const decided = await tabPlatform(SUPER_ADMIN, 'after-flow-device');
    inAdmin(
      decided.runtime,
      '/admin/institutions/godavari',
      <InstitutionDetail institutionId="godavari" />,
    );
    await screen.findByRole('heading', { level: 1, name: 'Godavari Institute of Technology' });
    expect(screen.getByRole('complementary', { name: 'What you can do' })).not.toHaveTextContent(
      'device transfer',
    );
  });
});

// ---- The ledger rows of these screens --------------------------------------------------------

describe('the SA-18 / SA-19 link-target rows', () => {
  it('every target is built: SA-18 / SA-19, and Support and Access ending', () => {
    for (const entry of P3_OPERATIONS_LINK_TARGETS) {
      expect(entry.outcome, entry.action).not.toBe('not-rendered');
      if (entry.target === null || entry.target.startsWith('#')) continue;
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
    for (const entry of P3_OPERATIONS_LINK_TARGETS) expect(entry.action).not.toMatch(INTERNAL);
  });
});
