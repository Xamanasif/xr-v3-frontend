/**
 * Phase 3, ST-18 My device (B3-07 f0 … f9; B3-12 DTR-0018 across roles) and its XS-05 account-menu
 * entry, on the real composition root and the sample world: who is offered it (f1, f2; P3-06), the
 * drawn states along the chain — request, validation, "With your Institute Admin", "Forwarded to
 * BITS", "Approved", "can’t be forwarded yet", paused — the provisional undrawn ones (no device
 * recorded, more than one device), loading, failed and every answer of "Send request" (success,
 * validation, refusals, unavailable). The Institute Admin's forward and the Super Admin's approval
 * go through their own ports of the same one world; their receipts refresh this tab.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Result } from '@xr/contracts/draft';
import type { RecordRef } from '@xr/domain';
import { asPersonId, faults, fixtureWorld } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import {
  INACTIVE_STUDENT,
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
import { HelpHome } from '../shared/xs-07-help/help-home';
import { holdsHeadsetFormat, offersMyDevice } from './st-18-my-device/device-entry';
import { MyDevice } from './st-18-my-device/my-device';

afterEach(() => {
  forgetLastAddress();
});

const RAHUL = 'per-0002';
const MEERA = 'per-0001';
const ARUN = 'per-0004';
const IMRAN = 'per-0006';
const GIT_VR_03 = 'ME lab VR headset, asset tag GIT-VR-03';
const GIT_VR_07 = 'ME lab VR headset, asset tag GIT-VR-07';
const NOTE = 'GIT-VR-03 has gone for repair; the lab gave me GIT-VR-07.';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];
type World = Awaited<ReturnType<typeof fixtureWorld>>;

function render(
  runtime: PlatformRuntime,
  page: ReactNode = <MyDevice />,
  path = '/student/device',
) {
  const navigation = testNavigation(path);
  return renderInTab(
    <WorkspaceLayout workspace="student">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
}

const main = () => screen.getByRole('main');
const section = (name: string) => screen.getByRole('region', { name });

async function opened(runtime: PlatformRuntime) {
  render(runtime);
  return screen.findByRole('heading', { level: 1, name: 'My device' });
}

/** A fixture world a test adjusts (as Package 2B's tests do), with Rahul signed in. */
async function adjusted(fixture: 'after-flow-b', change: (world: World) => World) {
  return worldPlatform(RAHUL, change(await fixtureWorld(fixture)));
}

/** Another person's port command in the same world; its receipt refreshes this tab. */
async function asOther<T>(runtime: PlatformRuntime, run: () => Promise<Result<T>>): Promise<T> {
  const answer = await run();
  if (!answer.ok) throw new Error(`refused: ${answer.error.kind}`);
  await act(async () => {
    await runtime.invalidate(answer.changed as readonly RecordRef[]);
  });
  return answer.value;
}

async function forwardAsMeera(sample: Sample, runtime: PlatformRuntime) {
  const meera = asPersonId(sample, MEERA).operations;
  const requests = await meera.listDeviceRequests({ state: 'with-institute-admin' });
  if (!requests.ok) throw new Error('listDeviceRequests');
  const transfer = requests.value[0]!;
  await asOther(runtime, () =>
    meera.forwardDeviceTransfer({ id: transfer.id, expectedRev: transfer.rev }),
  );
}

async function approveAsArjun(sample: Sample, runtime: PlatformRuntime) {
  const arjun = asPersonId(sample, SUPER_ADMIN).operations;
  const transfers = await arjun.listDeviceTransfers({ state: 'forwarded' });
  if (!transfers.ok) throw new Error('listDeviceTransfers');
  const transfer = transfers.value[0]!;
  await asOther(runtime, () =>
    arjun.approveDeviceTransfer({ id: transfer.id, expectedRev: transfer.rev }),
  );
}

async function pauseGodavari(sample: Sample, runtime: PlatformRuntime, refresh = true) {
  const admin = asPersonId(sample, SUPER_ADMIN).institutions;
  const found = await admin.getInstitution('godavari' as never);
  if (!found.ok) throw new Error('getInstitution');
  const answer = await admin.pauseInstitution({
    institutionId: found.value.institution.id,
    reason: 'Licence review.',
    expectedRev: found.value.institution.rev,
  });
  if (!answer.ok) throw new Error(`pause refused: ${answer.error.kind}`);
  if (!refresh) return;
  await act(async () => {
    await runtime.invalidate(answer.changed);
    await runtime.session.refresh();
  });
}

/** Opens the form and sends it with what is given (B3-07 f0 → f3 → f4). */
async function sendRequest(newDevice: string, note = '') {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Request a device transfer' }));
  if (newDevice) await user.type(screen.getByRole('textbox', { name: 'New device' }), newDevice);
  if (note) {
    await user.type(
      screen.getByRole('textbox', { name: 'Anything your Institute Admin should know (optional)' }),
      note,
    );
  }
  await user.click(screen.getByRole('button', { name: 'Send request' }));
  return user;
}

function historyLines(): string[] {
  return [...section('Request history').querySelectorAll('li.xr-tl')].map(
    (item) => item.querySelector('.xr-tl-what')!.textContent!,
  );
}

// ---- who is offered "My device" (B3-07 f1, f2; state-copy ST-18.offered, P3-06) ----------------

describe('“My device” is offered to a Student holding AR, VR or MR (f1, f2)', () => {
  async function reads(personId: string, fixture: Parameters<typeof fixtureWorld>[0]) {
    const { runtime } = await tabPlatform(personId, fixture);
    const courses = await runtime.ports.studentAccess.listMyCourses();
    if (!courses.ok) throw new Error('listMyCourses');
    const rows = [];
    for (const course of courses.value) {
      const page = await runtime.ports.studentAccess.getMyCourse(course.courseId);
      if (page.ok) {
        for (const experiment of page.value.experiments)
          rows.push({ course: page.value.course, experiment });
      }
    }
    const device = await runtime.ports.operations.getMyDevice();
    if (!device.ok) throw new Error('getMyDevice');
    const experiments = { rows, earlierWork: false };
    return { experiments, device: device.value };
  }

  it('Rahul given VR (after Flow B): offered', async () => {
    const { experiments, device } = await reads(RAHUL, 'after-flow-b');
    expect(holdsHeadsetFormat(experiments)).toBe(true);
    expect(offersMyDevice(experiments, device)).toBe(true);
  });

  it('Rahul before his grant (after the setup): a seeded device alone does not offer it', async () => {
    const { experiments, device } = await reads(RAHUL, 'after-setup');
    expect(device.devices.map((entry) => entry.description)).toEqual([GIT_VR_03]);
    expect(offersMyDevice(experiments, device)).toBe(false);
  });

  it('Imran (state coverage): no experiment listed, but his open request DTR-0019 offers it', async () => {
    const { experiments, device } = await reads(IMRAN, 'state-coverage');
    expect(holdsHeadsetFormat(experiments)).toBe(false);
    expect(device.openTransfer?.transfer.id).toBe('DTR-0019');
    expect(offersMyDevice(experiments, device)).toBe(true);
  });

  it('a Student waiting for a licence does not hold VR yet; an inactive one keeps it (later sample)', async () => {
    const arun = await reads(ARUN, 'later-sample');
    expect(arun.experiments.rows[0]?.experiment.closure?.kind).toBe('waiting-for-a-licence');
    expect(offersMyDevice(arun.experiments, arun.device)).toBe(false);
    const sneha = await reads(INACTIVE_STUDENT, 'later-sample');
    expect(sneha.experiments.rows[0]?.experiment.closure?.kind).toBe('student-inactive');
    expect(offersMyDevice(sneha.experiments, sneha.device)).toBe(true);
  });

  async function menuItems() {
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^Account menu, Rahul Verma/ });
    await user.click(button);
    const menu = document.getElementById(button.getAttribute('aria-controls')!)!;
    return within(menu);
  }

  it('f1: the account menu offers “My device” first, to /student/device', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    render(runtime, <HelpHome />, '/student/help');
    await screen.findByRole('heading', { level: 1, name: 'Help & support' });
    await waitFor(async () => {
      expect(document.querySelector('.xr-acct-btn')).not.toBeNull();
    });
    // The entry appears once the shell's reads have answered.
    await waitFor(() => expect(runtime.queryClient.isFetching()).toBe(0));
    const menu = await menuItems();
    expect(menu.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'My device',
      'Help & support',
    ]);
    expect(menu.getByRole('link', { name: 'My device' })).toHaveAttribute(
      'href',
      '/student/device',
    );
  });

  it('f2: no headset format, no entry — never a disabled item', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-setup');
    render(runtime, <HelpHome />, '/student/help');
    await screen.findByRole('heading', { level: 1, name: 'Help & support' });
    await waitFor(() => expect(runtime.queryClient.isFetching()).toBe(0));
    const menu = await menuItems();
    expect(menu.getAllByRole('link').map((link) => link.textContent)).toEqual(['Help & support']);
    expect(menu.queryByText('My device')).toBeNull();
  });

  it('a direct visit without one is the in-shell not-found (P3-06), nothing current', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-setup');
    render(runtime);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'My device' })).toBeNull();
    expect(document.querySelector('.xr-side [aria-current="page"]')).toBeNull();
  });
});

// ---- the page along the chain (B3-07 f0, f3 … f6) ------------------------------------------------

describe('ST-18 along the chain — Rahul, DTR-0018 (f0, f3, f4, f5, f6)', () => {
  it('f0: the authorised device, what it is used for, the request, an empty history', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    await opened(runtime);
    expect(document.querySelector('.xr-top-title')).toHaveTextContent('My device');
    expect(document.querySelector('.xr-crumbs [aria-current="page"]')).toHaveTextContent(
      'My device',
    );
    // ST-18 is no sidebar destination: nothing is current (Appendix A §3.6).
    expect(document.querySelector('.xr-side [aria-current="page"]')).toBeNull();
    expect(main().querySelector('.xr-phead-meta')).toHaveTextContent(
      'The device authorised for your headset formats',
    );
    const device = section('Authorised device');
    expect(device.querySelector('.xr-section-head .xr-fmt--yours')).toHaveTextContent('VR');
    expect(device.querySelector('.xl-dev-name')).toHaveTextContent(GIT_VR_03);
    expect(device.querySelector('.xl-dev .xl-meta')).toHaveTextContent(
      'Used for VR · Shell-and-Tube Heat Exchanger',
    );
    expect(within(device).getByRole('button', { name: 'Request a device transfer' })).toHaveClass(
      'xr-btn--primary',
    );
    expect(screen.queryByRole('region', { name: 'Your transfer request' })).toBeNull();
    expect(section('Request history')).toHaveTextContent('No transfer requests yet.');
    expect(main()).not.toHaveTextContent(/ship|deliver|provision|decline/i);
  });

  it('f3: “New device” is the only required field — the service’s words, focus on the field; Cancel', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    await opened(runtime);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Request a device transfer' }));
    const field = screen.getByRole('textbox', { name: 'New device' });
    expect(field).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Request a device transfer' })).toBeNull();
    const form = section('Request a device transfer');
    expect(form.querySelector('.xr-ro')).toHaveTextContent(`Moving from${GIT_VR_03}`);
    expect(form).toHaveTextContent(
      'Describe it the way your lab or institution labels it — for example, its asset tag.',
    );
    expect(form).toHaveTextContent(
      'Your Institute Admin forwards the request to BITS, and BITS decides.',
    );
    await user.click(within(form).getByRole('button', { name: 'Send request' }));
    await waitFor(() => expect(field).toHaveAttribute('aria-invalid', 'true'));
    expect(form.querySelector('.xw-ferr')).toHaveTextContent('Describe the new device');
    expect(field).toHaveFocus();
    expect(form.querySelector('.xr-error-summary')).toBeNull();
    await user.type(field, 'G');
    expect(field).not.toHaveAttribute('aria-invalid');
    await user.click(within(form).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('region', { name: 'Request a device transfer' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Request a device transfer' })).toHaveFocus();
    // Nothing was sent.
    const mine = await runtime.ports.operations.getMyDevice();
    expect(mine.ok && mine.value.openTransfer).toBeNull();
  });

  it('f4 → f5 → f6: sent, forwarded by Meera, approved by BITS — the same DTR in this tab', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await opened(runtime);
    await sendRequest(GIT_VR_07, NOTE);

    // f4 "With your Institute Admin": the status replaces the button and takes focus.
    const request = await screen.findByRole('region', { name: 'Your transfer request' });
    await waitFor(() => expect(document.getElementById('device-status')).toHaveFocus());
    expect(request.querySelector('.xr-section-head .xr-id')).toHaveTextContent('DTR-0018');
    expect(request.querySelector('.xr-status--wait')).toHaveTextContent(
      'With your Institute Admin',
    );
    expect(request).toHaveTextContent(
      'Your Institute Admin forwards it to BITS. Nothing changes on your device yet.',
    );
    expect(request.querySelector('dl.xl-kv')).toHaveTextContent(`From${GIT_VR_03}To${GIT_VR_07}`);
    expect(screen.queryByRole('button', { name: 'Request a device transfer' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Request a device transfer' })).toBeNull();
    expect(historyLines()).toEqual(['Requested by Rahul Verma']);
    expect(section('Request history').querySelector('.xr-tl-note')).toHaveTextContent(
      `From ${GIT_VR_03} to ${GIT_VR_07}`,
    );
    // The Student's own note goes to the Institute Admin; it is not repeated here.
    expect(main()).not.toHaveTextContent(NOTE);

    // f5 "Forwarded to BITS" (Meera Iyer, B3-09).
    await forwardAsMeera(sample, runtime);
    await waitFor(() =>
      expect(request.querySelector('.xr-status--info')).toHaveTextContent('Forwarded to BITS'),
    );
    expect(request).toHaveTextContent('BITS decides. Nothing changes on your device yet.');
    expect(historyLines()).toEqual(['Forwarded to BITS by Meera Iyer', 'Requested by Rahul Verma']);
    expect(section('Authorised device').querySelector('.xl-dev-name')).toHaveTextContent(GIT_VR_03);

    // f6 "Approved" (B3-11): the authorised device is now the new one.
    await approveAsArjun(sample, runtime);
    await waitFor(() =>
      expect(request.querySelector('.xr-status--ok')).toHaveTextContent('Approved'),
    );
    expect(request).toHaveTextContent(
      'BITS approved the transfer. Your authorised device is updated above.',
    );
    expect(section('Authorised device').querySelector('.xl-dev-name')).toHaveTextContent(GIT_VR_07);
    expect(historyLines()).toEqual([
      'Approved by BITS',
      'Forwarded to BITS by Meera Iyer',
      'Requested by Rahul Verma',
    ]);
    expect(section('Request history').querySelector('.is-latest .xr-tl-note')).toHaveTextContent(
      `The authorised device is now: ${GIT_VR_07}`,
    );
    // Nothing is open any more: the service offers a new request (state-copy ST-18.after-approval).
    expect(screen.getByRole('button', { name: 'Request a device transfer' })).toBeVisible();
    expect(main()).not.toHaveTextContent(/Arjun Mehta|decline/i);
  });

  it('after the device flow (DTR-0018 approved on 24 Oct): the approved request and its history', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-device');
    await opened(runtime);
    expect(section('Authorised device').querySelector('.xl-dev-name')).toHaveTextContent(GIT_VR_07);
    const request = section('Your transfer request');
    expect(request.querySelector('.xr-status--ok')).toHaveTextContent('Approved');
    expect(historyLines()).toEqual([
      'Approved by BITS',
      'Forwarded to BITS by Meera Iyer',
      'Requested by Rahul Verma',
    ]);
    expect(
      [...section('Request history').querySelectorAll('.xr-tl-when')].map(
        (when) => when.textContent,
      ),
    ).toEqual(['24 Oct 2026, 12:30', '23 Oct 2026, 10:00', '22 Oct 2026, 09:10']);
  });

  it('“Send request” is sent once while busy (one DTR)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await opened(runtime);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Request a device transfer' }));
    await user.type(screen.getByRole('textbox', { name: 'New device' }), GIT_VR_07);
    const send = screen.getByRole('button', { name: 'Send request' });
    await user.dblClick(send);
    await screen.findByRole('region', { name: 'Your transfer request' });
    const requests = await asPersonId(sample, MEERA).operations.listDeviceRequests({});
    expect(requests.ok && requests.value.map((entry) => entry.id)).toEqual(['DTR-0018']);
  });
});

// ---- f7, f8 and the undrawn states -------------------------------------------------------------

describe('ST-18 when the request cannot move, and the undrawn states', () => {
  it('f7: no Institute Admin — the request is created and waits, “can’t be forwarded yet”', async () => {
    const { runtime } = await adjusted('after-flow-b', (world) => ({
      ...world,
      records: {
        ...world.records,
        institutions: {
          ...world.records.institutions,
          godavari: { ...world.records.institutions['godavari']!, instituteAdmin: null },
        },
      },
    }));
    await opened(runtime);
    await sendRequest(GIT_VR_07);
    const request = await screen.findByRole('region', { name: 'Your transfer request' });
    expect(request.querySelector('.xr-status--wait')).toHaveTextContent(
      'With your Institute Admin',
    );
    const notice = request.querySelector('.xr-notice--warn')!;
    expect(notice).toHaveAttribute('role', 'status');
    expect(notice.querySelector('.xr-notice-title')).toHaveTextContent(
      'This request can’t be forwarded yet',
    );
    expect(notice).toHaveTextContent(
      'Your institution has no Institute Admin right now. It stays here until one is assigned.',
    );
  });

  it('f8: paused — no new request, the drawn words and the shell’s banner', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await pauseGodavari(sample, runtime, false);
    await opened(runtime);
    const device = section('Authorised device');
    expect(device).toHaveTextContent(
      'You can’t request a transfer while your institution’s access is paused.',
    );
    expect(screen.queryByRole('button', { name: 'Request a device transfer' })).toBeNull();
    expect(document.querySelector('.rk-x-region--banner > .rk-banner')).toHaveTextContent(
      'Your institution’s access is paused — your work is kept.',
    );
  });

  it('an open request when the institution is paused: it waits, and says why (provisional)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await opened(runtime);
    await sendRequest(GIT_VR_07);
    const request = await screen.findByRole('region', { name: 'Your transfer request' });
    await pauseGodavari(sample, runtime);
    await waitFor(() =>
      expect(request.querySelector('.xr-notice--warn')).toHaveTextContent(
        'Your institution’s access is paused. It stays here until the access is restored.',
      ),
    );
    expect(section('Authorised device')).toHaveTextContent(
      'You can’t request a transfer while your institution’s access is paused.',
    );
  });

  it('VR given but no authorised device recorded: says so, offers nothing (P3-03, D20b)', async () => {
    const { runtime } = await adjusted('after-flow-b', (world) => ({
      ...world,
      records: { ...world.records, devices: {} },
    }));
    await opened(runtime);
    const device = section('Authorised device');
    expect(device).toHaveTextContent('No authorised device is recorded for you yet.');
    expect(device.querySelector('.xr-fmt')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Request a device transfer' })).toBeNull();
    expect(section('Request history')).toHaveTextContent('No transfer requests yet.');
  });

  it('more than one authorised device: each listed, no picker and no request (OD-B3-01)', async () => {
    const { runtime } = await adjusted('after-flow-b', (world) => {
      const vr = world.records.devices[`device:${RAHUL}|vr`]!;
      return {
        ...world,
        records: {
          ...world.records,
          devices: {
            ...world.records.devices,
            [`device:${RAHUL}|ar`]: {
              ...vr,
              format: 'ar',
              description: 'ME lab AR tablet, asset tag GIT-AR-01',
            },
          },
        },
      };
    });
    await opened(runtime);
    const device = section('Authorised device');
    expect([...device.querySelectorAll('.xl-dev-name')].map((name) => name.textContent)).toEqual([
      GIT_VR_03,
      'ME lab AR tablet, asset tag GIT-AR-01',
    ]);
    expect(device).toHaveTextContent(
      'A transfer can’t be requested here while more than one device is authorised for you.',
    );
    expect(within(device).queryAllByRole('button')).toEqual([]);
    expect(device.querySelector('select, [role="radio"]')).toBeNull();
  });

  it('state coverage: Imran’s DTR-0019, still with the institution', async () => {
    const { runtime } = await tabPlatform(IMRAN, 'state-coverage');
    await opened(runtime);
    expect(section('Authorised device').querySelector('.xl-dev .xl-meta')).toHaveTextContent(
      /^Used for VR$/,
    );
    const request = section('Your transfer request');
    expect(request.querySelector('.xr-id')).toHaveTextContent('DTR-0019');
    expect(request.querySelector('.xr-status--wait')).toHaveTextContent(
      'With your Institute Admin',
    );
    expect(historyLines()).toEqual(['Requested by Imran Shaikh']);
  });
});

// ---- loading, failed and the refusals of “Send request” -----------------------------------------

describe('ST-18 loading, failed, and every answer of “Send request”', () => {
  it('loading is announced; a failure says nothing changed; “Try again” reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    faults(sample).failNext('OperationsService.getMyDevice');
    render(runtime);
    expect(await screen.findByText('Loading your device')).toHaveAttribute('role', 'status');
    const failed = await screen.findByRole('heading', { name: 'We couldn’t load your device' });
    expect(failed.closest('.xr-empty')).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'My device' })).toBeVisible();
    expect(document.activeElement).toBe(main());
  });

  it('a request already open (another tab): the words, and the open request shows', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await opened(runtime);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Request a device transfer' }));
    // Sent meanwhile from another session of Rahul's (no receipt reaches this tab).
    const other = await asPersonId(sample, RAHUL).operations.requestDeviceTransfer({
      newDevice: GIT_VR_07,
      note: null,
    });
    expect(other.ok).toBe(true);
    await user.type(screen.getByRole('textbox', { name: 'New device' }), 'Another headset');
    await user.click(screen.getByRole('button', { name: 'Send request' }));
    const notice = await waitFor(() => {
      const found = document.getElementById('device-refused');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(notice).toHaveTextContent('You already have a transfer request open.');
    await waitFor(() => expect(notice).toHaveFocus());
    expect(await screen.findByRole('region', { name: 'Your transfer request' })).toHaveTextContent(
      GIT_VR_07,
    );
    expect(screen.queryByRole('region', { name: 'Request a device transfer' })).toBeNull();
  });

  it('paused meanwhile: the drawn paused words, and no request is offered', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await opened(runtime);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Request a device transfer' }));
    await pauseGodavari(sample, runtime, false);
    await user.type(screen.getByRole('textbox', { name: 'New device' }), GIT_VR_07);
    await user.click(screen.getByRole('button', { name: 'Send request' }));
    await waitFor(() =>
      expect(document.getElementById('device-refused')).toHaveTextContent(
        'You can’t request a transfer while your institution’s access is paused.',
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Request a device transfer' })).toBeNull(),
    );
  });

  it('unavailable: nothing changes — the form keeps what was typed and can be sent again', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await opened(runtime);
    faults(sample).failNext('OperationsService.requestDeviceTransfer');
    await sendRequest(GIT_VR_07);
    const field = screen.getByRole('textbox', { name: 'New device' });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Send request' })).not.toHaveClass('is-busy'),
    );
    expect(field).toHaveValue(GIT_VR_07);
    expect(document.getElementById('device-refused')).toBeNull();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Send request' }));
    expect(
      (await screen.findByRole('region', { name: 'Your transfer request' })).querySelector(
        '.xr-status--wait',
      ),
    ).toHaveTextContent('With your Institute Admin');
  });
});
