/**
 * The public request (Phase-1 Package 1C; B1-06 PU-07, B1-07 PU-08 / PU-09, B1-08 PU-10 / PU-12 /
 * PU-13) on the real composition root and the spine-start sample world: every page reads and
 * writes through the service ports, the adapter decides who may see or pay (owner decisions DV-5 /
 * O-05 and TE-4), and the pages render its answers. Browser behaviour (focus walk, axe, widths,
 * one document, Back / Forward) is the Playwright suite's (`e2e/package-1c/`).
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RequesterRequestView } from '@xr/contracts/draft';
import type { ExperimentId, RequestId, RequestRouteId } from '@xr/domain';
import { asPerson, faults, planPayment, seamsOf, worldOf } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { clearRequestFlow, rememberSent } from '@/queries/request-flow';
import { SAMPLE_PASSWORD, signInAs, testPlatform } from '@/test-support/platform';
import { renderInTab, testNavigation } from '@/test-support/workspace';

import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { SelectionPage } from './pu-07-selection/selection';
import { RequestAccessPage } from './pu-08-request-access/request-access';
import { RequestSentPage } from './pu-09-request-sent/request-sent';
import { RequestStatusPage } from './pu-10-request-status/request-status';
import { PaymentPage } from './pu-12-payment/payment';
import { PublicFrame } from './shell/public-frame';

const SHELL = 'shell-and-tube-heat-exchanger' as ExperimentId;
const DISTILLATION = 'distillation-column' as ExperimentId;

type Platform = Awaited<ReturnType<typeof testPlatform>>;

afterEach(() => {
  forgetLastAddress();
  clearRequestFlow();
  window.sessionStorage.clear();
});

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function show(platform: Platform, page: ReactNode, pathname: string, search = '') {
  const navigation = testNavigation(pathname, search);
  const view = renderInTab(<PublicFrame pathname={pathname}>{page}</PublicFrame>, {
    runtime: platform.runtime,
    navigation,
  });
  return { navigation, ...view };
}

/** The drawn request (B1-07 f4), sent by this tab's visitor — the tab keeps its ticket. */
async function send(platform: Platform, formats: readonly ('web' | 'vr')[] = ['web', 'vr']) {
  ok(platform.runtime.ports.selection.add({ experimentId: SHELL, formats: [...formats] }));
  return ok(
    await platform.runtime.ports.accessRequests.submitPublicRequest({
      institutionName: 'Godavari Institute of Technology',
      contactPerson: 'Meera Iyer',
      email: 'meera.iyer@godavari.edu.in',
      phone: null,
      licencesRequested: '120',
      message: null,
      term: { kind: 'yearly' },
    }),
  );
}

async function decide(platform: Platform, reference: RequestId) {
  const admin = asPerson(platform.sample, 'Arjun Mehta');
  const page = ok(await admin.accessRequests.getRequestForDecision(reference));
  return { admin, rev: page.request.rev };
}

async function approveExternal(platform: Platform, reference: RequestId) {
  const { admin, rev } = await decide(platform, reference);
  return ok(
    await admin.accessRequests.approveRequest({
      id: reference,
      route: 'external',
      expectedRev: rev,
    }),
  );
}

async function statusOf(
  platform: Platform,
  routeId: RequestRouteId,
): Promise<RequesterRequestView> {
  return ok(await platform.runtime.ports.accessRequests.getRequestStatus(routeId));
}

const statusHead = () => document.querySelector('.xp-statushead') as HTMLElement;

/**
 * A page's H1 once its reads have answered. Matched on its text: PU-10's H1 is B1-08's
 * `<span class="xr-sr">Request </span>REQ-0042`, whose space jsdom's name computation drops.
 */
const heading = (name: string) =>
  screen.findByRole(
    'heading',
    { level: 1, name: (_accessible, element) => element.textContent === name },
    { timeout: 5000 },
  );

describe('PU-07 Your selection (B1-06)', () => {
  it('empty: points back to the catalogue; Continue to request is not offered', async () => {
    const platform = await testPlatform();
    show(platform, <SelectionPage />, '/selection');
    expect(await screen.findByRole('heading', { level: 1, name: 'Your selection' })).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Your selection is empty' }),
    ).toBeVisible();
    expect(
      within(document.querySelector('main')!).getByRole('link', { name: 'Browse experiments' }),
    ).toHaveAttribute('href', '/experiments');
    expect(screen.queryByRole('link', { name: 'Continue to request' })).toBeNull();
    expect(document.querySelector('.xp-bottombar')).toBeNull();
    // The request's stepper: step 1 current.
    const steps = screen.getByRole('list', { name: 'Request institutional access' });
    expect(within(steps).getAllByRole('listitem')[0]).toHaveAttribute('aria-current', 'step');
  });

  it('the continuity record: its published formats, the summary, the bottom bar; a lone format is locked', async () => {
    const user = userEvent.setup();
    const platform = await testPlatform();
    ok(platform.runtime.ports.selection.add({ experimentId: SHELL, formats: ['web', 'vr'] }));
    show(platform, <SelectionPage />, '/selection');
    const title = await screen.findByRole('link', { name: 'Shell-and-Tube Heat Exchanger' });
    expect(title).toHaveAttribute('href', '/experiments/shell-and-tube-heat-exchanger');
    expect(screen.getByText('ME ZG523 · Thermodynamics & Heat Transfer')).toBeVisible();
    const pills = screen.getByRole('group', { name: 'Formats for Shell-and-Tube Heat Exchanger' });
    expect(
      within(pills)
        .getAllByRole('checkbox')
        .map((box) => [box.parentElement?.textContent, (box as HTMLInputElement).checked]),
    ).toEqual([
      ['WEB · Browser', true],
      ['AR · Augmented reality', false],
      ['VR · Virtual reality', true],
    ]);
    const summary = screen.getByRole('complementary', { name: 'Summary' });
    expect(summary).toHaveTextContent('Experiments1Formats chosenWEB, VR');
    expect(within(summary).getByRole('link', { name: 'Continue to request' })).toHaveAttribute(
      'href',
      '/request-access',
    );
    expect(within(summary).getByRole('link', { name: 'Continue browsing' })).toHaveAttribute(
      'href',
      '/experiments',
    );
    // Below 1024 px the summary is the bottom bar, after the footer (B1-06 "Mobile 375").
    const bar = document.querySelector('.xp-bottombar')!;
    expect(bar).toHaveTextContent('1 experiment · 2 formats');
    expect(document.querySelector('footer.xp-foot')?.nextElementSibling).toBe(bar);
    // The header counts it (B1-06 `selAria`).
    expect(screen.getByRole('link', { name: 'Selection, 1 experiment' })).toHaveAttribute(
      'href',
      '/selection',
    );

    // Untick VR: WEB is the last format, so it is locked with the drawn hint.
    await user.click(within(pills).getByRole('checkbox', { name: 'VR · Virtual reality' }));
    const web = within(pills).getByRole('checkbox', { name: 'WEB · Browser' });
    expect(web).toBeChecked();
    expect(web).toBeDisabled();
    expect(web).toHaveAccessibleDescription(
      'At least one format stays chosen. To take this experiment out, use Remove.',
    );
    expect(platform.runtime.ports.selection.get().items[0]?.formats).toEqual(['web']);
    // AR is published: it can be added; the formats stay in drawn order.
    await user.click(within(pills).getByRole('checkbox', { name: 'AR · Augmented reality' }));
    expect(platform.runtime.ports.selection.get().items[0]?.formats).toEqual(['web', 'ar']);
    expect(web).toBeEnabled();
  });

  it('Remove keeps one Undo that puts the experiment back where it was; focus follows', async () => {
    const user = userEvent.setup();
    const platform = await testPlatform();
    ok(platform.runtime.ports.selection.add({ experimentId: SHELL, formats: ['web', 'vr'] }));
    ok(platform.runtime.ports.selection.add({ experimentId: DISTILLATION, formats: ['web'] }));
    show(platform, <SelectionPage />, '/selection');
    await user.click(
      await screen.findByRole('button', {
        name: 'Remove Shell-and-Tube Heat Exchanger from your selection',
      }),
    );
    const notice = document.querySelector('.xr-notice[role="status"]') as HTMLElement;
    expect(notice).toHaveTextContent(
      'Removed Shell-and-Tube Heat Exchanger from your selection.Undo',
    );
    await waitFor(() => expect(notice).toHaveFocus());
    expect(screen.queryByRole('link', { name: 'Shell-and-Tube Heat Exchanger' })).toBeNull();
    expect(document.querySelector('.xp-bottombar')).toHaveTextContent('1 experiment · 1 format');

    await user.click(within(notice).getByRole('button', { name: 'Undo' }));
    const back = await screen.findByRole('link', { name: 'Shell-and-Tube Heat Exchanger' });
    await waitFor(() => expect(back).toHaveFocus());
    // Back in its first place.
    expect(
      [...document.querySelectorAll('.xp-srow-title')].map((title) => title.textContent),
    ).toEqual(['Shell-and-Tube Heat Exchanger', 'Distillation Column']);
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();

    // A format change ends the Undo (B1-06 `undo: null`).
    await user.click(
      screen.getByRole('button', { name: 'Remove Distillation Column from your selection' }),
    );
    await user.click(screen.getByRole('checkbox', { name: 'AR · Augmented reality' }));
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });
});

describe('PU-07 “You have a request in progress” (owner decision 24 Oct 2026; ADR-0009 amendment)', () => {
  /** A browser's `localStorage` for the local prototype build's world and kept tickets (TE-6). */
  function browserStorage() {
    const items = new Map<string, string>();
    return {
      items,
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => void items.set(key, value),
      removeItem: (key: string) => void items.delete(key),
    };
  }

  /** The line's read has answered for this page (an absent line is then an answer, not a wait). */
  async function inProgressRead(platform: Platform) {
    await waitFor(() => {
      const read = platform.runtime.queryClient
        .getQueryCache()
        .findAll({ queryKey: ['xr'] })
        .find((query) => query.queryKey[3] === 'requests-in-progress');
      expect(read?.state.status).toBe('success');
    });
  }

  it('after a reload of the local prototype build: the request named by its institution, and the way to its status page', async () => {
    const local = browserStorage();
    const first = await testPlatform({ kept: { storage: local, lineage: 'lineage-first' } });
    const sent = await send(first);
    await approveExternal(first, sent.reference);

    // The reload: a new page load on this browser's storage, signed out.
    const reloaded = await testPlatform({ kept: { storage: local, lineage: 'lineage-next' } });
    expect(reloaded.runtime.capabilities.persistence).toBe('browser-snapshot');
    show(reloaded, <SelectionPage />, '/selection');
    const note = await screen.findByRole('note');
    expect(note).toHaveClass('xr-notice', 'xr-notice--quiet');
    expect(note).toHaveTextContent(
      'You have a request in progress for Godavari Institute of Technology. Check request status',
    );
    expect(within(note).getByRole('link', { name: 'Check request status' })).toHaveAttribute(
      'href',
      `/requests/${sent.routeId}`,
    );
    // Named by its institution only: no reference, address or ticket in the words.
    expect(note.querySelector('span')?.firstChild?.textContent).not.toMatch(/REQ-|rq-|tok-/);
    // The page it leads to opens for this tab: the same request, payment still to make.
    expect(await statusOf(reloaded, sent.routeId)).toMatchObject({
      reference: sent.reference,
      status: 'approved-payment-required',
      nextStep: 'continue-to-payment',
    });
    // The empty selection is shown as before, under the line.
    expect(
      screen.getByRole('heading', { level: 2, name: 'Your selection is empty' }),
    ).toBeVisible();
  });

  it('shows nothing in another browser, for a person signed in, or once access is active', async () => {
    const local = browserStorage();
    const first = await testPlatform({ kept: { storage: local, lineage: 'lineage-one' } });
    const sent = await send(first);

    // Another browser with a copy of the saved world, but no ticket: nothing.
    const other = browserStorage();
    other.items.set('xr.sample-world', local.items.get('xr.sample-world')!);
    const elsewhere = await testPlatform({ kept: { storage: other, lineage: 'lineage-two' } });
    const view = show(elsewhere, <SelectionPage />, '/selection');
    await inProgressRead(elsewhere);
    expect(screen.queryByRole('note')).toBeNull();
    view.unmount();

    // A person signed in to this browser holds none of the visitor's tickets.
    const signedIn = await testPlatform({ kept: { storage: local, lineage: 'lineage-three' } });
    await signInAs(signedIn.runtime, 'kavya.nair@wilp.example');
    const theirs = show(signedIn, <SelectionPage />, '/selection');
    await inProgressRead(signedIn);
    expect(screen.queryByRole('note')).toBeNull();
    theirs.unmount();

    // Approved on the Internal route: access is active, the request is no longer in progress.
    const { admin, rev } = await decide(first, sent.reference);
    ok(
      await admin.accessRequests.approveRequest({
        id: sent.reference,
        route: 'internal',
        expectedRev: rev,
      }),
    );
    const later = await testPlatform({ kept: { storage: local, lineage: 'lineage-four' } });
    expect((await statusOf(later, sent.routeId)).status).toBe('access-active');
    show(later, <SelectionPage />, '/selection');
    await inProgressRead(later);
    expect(screen.queryByRole('note')).toBeNull();
  });
});

describe('PU-08 Request institutional access (B1-07)', () => {
  it('an empty selection goes back to Your selection (P1-03)', async () => {
    const platform = await testPlatform();
    const { navigation } = show(platform, <RequestAccessPage />, '/request-access');
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('/selection', { replace: true }),
    );
  });

  it('Review request empty: the summary first with each error linked to its field; typing clears a line', async () => {
    const user = userEvent.setup();
    const platform = await testPlatform();
    ok(platform.runtime.ports.selection.add({ experimentId: SHELL, formats: ['web', 'vr'] }));
    const { navigation } = show(platform, <RequestAccessPage />, '/request-access');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Request institutional access' }),
    ).toBeVisible();
    // What you need: the selection itself, with "Change" back to it; never internal / external.
    expect(screen.getByText('Shell-and-Tube Heat Exchanger')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Change' })).toHaveAttribute('href', '/selection');
    expect(document.body).not.toHaveTextContent(/internal|external|price|payment/i);

    await user.click(screen.getByRole('button', { name: 'Review request' }));
    const summary = await screen.findByText('There are 5 problems with this request');
    const box = summary.closest('.xw-errsum') as HTMLElement;
    await waitFor(() => expect(box).toHaveFocus());
    expect(
      within(box)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Enter your institution’s name', '#request-institution'],
      ['Enter the contact person’s name', '#request-contact'],
      ['Enter an e-mail address', '#request-email'],
      ['Enter the number of licences you are requesting', '#request-licences'],
      ['Choose how long you need access', '#request-term-0'],
    ]);
    expect(screen.getByLabelText('Institution name')).toHaveAttribute('aria-invalid', 'true');
    expect(navigation.navigate).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Institution name'), 'Godavari Institute of Technology');
    expect(screen.getByText('There are 4 problems with this request')).toBeVisible();
    expect(screen.getByLabelText('Institution name')).not.toHaveAttribute('aria-invalid', 'true');

    // The drawn words for a malformed e-mail and licence count (B1-07 "Validation").
    await user.type(screen.getByLabelText('Contact person'), 'Meera Iyer');
    await user.type(screen.getByLabelText('E-mail'), 'meera.iyer@godavari');
    await user.type(screen.getByLabelText('Licences requested'), '120 licences');
    await user.click(screen.getByRole('button', { name: 'Review request' }));
    expect(await screen.findByText('There are 3 problems with this request')).toBeVisible();
    expect(screen.getAllByText('Enter an e-mail address like name@institution.edu')).toHaveLength(
      2,
    );
    expect(screen.getAllByText('Enter a whole number, like 120')).toHaveLength(2);
  });

  it('Until a fixed date asks for the end date', async () => {
    const user = userEvent.setup();
    const platform = await testPlatform();
    ok(platform.runtime.ports.selection.add({ experimentId: SHELL, formats: ['web'] }));
    show(platform, <RequestAccessPage />, '/request-access');
    await user.click(await screen.findByRole('radio', { name: /Until a fixed date/ }));
    expect(screen.getByLabelText('End date')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Review request' }));
    expect(
      within(document.querySelector('.xw-errsum') as HTMLElement).getByRole('link', {
        name: 'Enter the date access should end',
      }),
    ).toHaveAttribute('href', '#request-ends-on');
  });

  it('an end date that is not later than today: nothing is sent; back to the details (I1-C2)', async () => {
    const user = userEvent.setup();
    const platform = await testPlatform();
    ok(platform.runtime.ports.selection.add({ experimentId: SHELL, formats: ['web'] }));
    const details = show(platform, <RequestAccessPage />, '/request-access');
    await user.type(await screen.findByLabelText('Institution name'), 'Godavari Institute');
    await user.type(screen.getByLabelText('Contact person'), 'Meera Iyer');
    await user.type(screen.getByLabelText('E-mail'), 'meera.iyer@godavari.edu.in');
    await user.type(screen.getByLabelText('Licences requested'), '120');
    await user.click(screen.getByRole('radio', { name: /Until a fixed date/ }));
    await user.type(screen.getByLabelText('End date'), '2026-09-01');
    await user.click(screen.getByRole('button', { name: 'Review request' }));
    expect(details.navigation.navigate).toHaveBeenCalledWith('/request-access?step=review');
    details.unmount();

    const review = show(platform, <RequestAccessPage />, '/request-access', '?step=review');
    const before = worldOf(platform.sample).worldVersion;
    await user.click(await screen.findByRole('button', { name: 'Submit request' }));
    await waitFor(() =>
      expect(review.navigation.navigate).toHaveBeenCalledWith('/request-access?step=details'),
    );
    expect(worldOf(platform.sample).worldVersion).toBe(before);
    expect(platform.runtime.ports.selection.get().items).toHaveLength(1);
  });

  it('details → review → Submit: the request is sent once, the selection empties, PU-09 is next', async () => {
    const user = userEvent.setup();
    const platform = await testPlatform();
    ok(platform.runtime.ports.selection.add({ experimentId: SHELL, formats: ['web', 'vr'] }));
    const details = show(platform, <RequestAccessPage />, '/request-access');
    await user.type(
      await screen.findByLabelText('Institution name'),
      'Godavari Institute of Technology',
    );
    await user.type(screen.getByLabelText('Contact person'), 'Meera Iyer');
    await user.type(screen.getByLabelText('E-mail'), 'meera.iyer@godavari.edu.in');
    await user.type(screen.getByLabelText('Licences requested'), '120');
    await user.type(
      screen.getByLabelText(/Message to BITS/),
      'We would like to start with the heat exchanger lab for our ME ZG523 cohort this term, in the browser and in VR.',
    );
    await user.click(screen.getByRole('radio', { name: /Yearly/ }));
    await user.click(screen.getByRole('button', { name: 'Review request' }));
    expect(details.navigation.navigate).toHaveBeenCalledWith('/request-access?step=review');
    details.unmount();

    // The review step (the navigation is the test's: the address is given anew).
    const review = show(platform, <RequestAccessPage />, '/request-access', '?step=review');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Check your request' }),
    ).toBeVisible();
    const rows = [...document.querySelectorAll('.xp-review dt')].map((term) => [
      term.textContent,
      term.nextElementSibling?.textContent,
    ]);
    expect(rows).toEqual([
      ['Institution', 'Godavari Institute of Technology'],
      ['Contact person', 'Meera Iyer'],
      ['E-mail', 'meera.iyer@godavari.edu.in'],
      ['Phone', 'Not given'],
      ['Experiments and formats', 'Shell-and-Tube Heat Exchanger — WEB, VR'],
      ['Licences requested', '120'],
      ['Access term', 'Yearly'],
      [
        'Message to BITS',
        'We would like to start with the heat exchanger lab for our ME ZG523 cohort this term, in the browser and in VR.',
      ],
    ]);
    expect(screen.getByRole('button', { name: 'Edit contact person' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Edit message to BITS' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Change' })).toHaveAttribute('href', '/selection');

    const before = worldOf(platform.sample).worldVersion;
    await user.click(screen.getByRole('button', { name: 'Submit request' }));
    await waitFor(() =>
      expect(review.navigation.navigate).toHaveBeenCalledWith('/request-access/sent', {
        replace: true,
      }),
    );
    // One request reached the world; the selection was sent with it.
    expect(worldOf(platform.sample).worldVersion).toBe(before + 1);
    expect(worldOf(platform.sample).records.requests['REQ-0042']).toMatchObject({
      institutionName: 'Godavari Institute of Technology',
      licencesRequested: 120,
    });
    expect(platform.runtime.ports.selection.get().items).toEqual([]);
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Selection, empty' })).toBeVisible(),
    );
    review.unmount();

    // PU-09: the reference and one next action, at the request's opaque address.
    const sent = show(platform, <RequestSentPage />, '/request-access/sent');
    expect(screen.getByRole('heading', { level: 1, name: 'Request sent' })).toBeVisible();
    expect(document.querySelector('main')).toHaveTextContent(
      'Your reference is REQ-0042. Use it whenever you refer to this request.',
    );
    const check = screen.getByRole('link', { name: 'Check request status' });
    const routeId = worldOf(platform.sample).records.requests['REQ-0042']!.routeId;
    expect(check).toHaveAttribute('href', `/requests/${routeId}`);
    expect(check.getAttribute('href')).not.toContain('REQ-0042');
    expect(sent.navigation.navigate).not.toHaveBeenCalled();
  });

  it('the review step with details missing falls back to the details step (S4)', async () => {
    const platform = await testPlatform();
    ok(platform.runtime.ports.selection.add({ experimentId: SHELL, formats: ['web'] }));
    const { navigation } = show(platform, <RequestAccessPage />, '/request-access', '?step=review');
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('/request-access?step=details', {
        replace: true,
      }),
    );
  });

  it('Failed + retry: nothing was sent, every answer is kept; the retry sends it once', async () => {
    const user = userEvent.setup();
    const platform = await testPlatform();
    ok(platform.runtime.ports.selection.add({ experimentId: SHELL, formats: ['web', 'vr'] }));
    const details = show(platform, <RequestAccessPage />, '/request-access');
    await user.type(await screen.findByLabelText('Institution name'), 'Godavari Institute');
    await user.type(screen.getByLabelText('Contact person'), 'Meera Iyer');
    await user.type(screen.getByLabelText('E-mail'), 'meera.iyer@godavari.edu.in');
    await user.type(screen.getByLabelText('Licences requested'), '120');
    await user.click(screen.getByRole('radio', { name: /Monthly/ }));
    await user.click(screen.getByRole('button', { name: 'Review request' }));
    details.unmount();

    const review = show(platform, <RequestAccessPage />, '/request-access', '?step=review');
    faults(platform.sample).failNext('AccessRequestService.submitPublicRequest');
    const before = worldOf(platform.sample).worldVersion;
    await user.click(await screen.findByRole('button', { name: 'Submit request' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'We couldn’t send your requestNothing was sent. Your details are still here — try again.',
    );
    await waitFor(() => expect(alert).toHaveFocus());
    expect(worldOf(platform.sample).worldVersion).toBe(before);
    expect(platform.runtime.ports.selection.get().items).toHaveLength(1);
    expect(screen.getByText('Godavari Institute')).toBeVisible();
    expect(review.navigation.navigate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Submit request' }));
    await waitFor(() =>
      expect(review.navigation.navigate).toHaveBeenCalledWith('/request-access/sent', {
        replace: true,
      }),
    );
    expect(worldOf(platform.sample).worldVersion).toBe(before + 1);
  });
});

describe('PU-09 Request sent (B1-07 f8)', () => {
  it('a cold visit — nothing sent in this tab — goes to Your selection (P1-03)', async () => {
    const platform = await testPlatform();
    const { navigation } = show(platform, <RequestSentPage />, '/request-access/sent');
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('/selection', { replace: true }),
    );
  });

  it('forgets the request when the person signed in to the tab changes', async () => {
    const platform = await testPlatform();
    const sent = await send(platform);
    rememberSent(sent);
    show(platform, <RequestSentPage />, '/request-access/sent');
    expect(screen.getByRole('heading', { level: 1, name: 'Request sent' })).toBeVisible();
    await act(async () => {
      ok(
        await platform.runtime.ports.session.signIn({
          method: 'email',
          email: 'kavya.nair@wilp.example',
          password: SAMPLE_PASSWORD,
        }),
      );
      await platform.runtime.session.refresh();
    });
    await waitFor(() => expect(screen.queryByText(/REQ-0042/)).toBeNull());
  });
});

describe('PU-10 Request status and PU-13 Access active (B1-08)', () => {
  it('an address that names nothing, and the reference as an address: the public not-found page', async () => {
    const platform = await testPlatform();
    await send(platform);
    for (const address of ['rq-9999', 'REQ-0042']) {
      const view = show(platform, <RequestStatusPage routeId={address} />, `/requests/${address}`);
      expect(
        await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
      ).toBeVisible();
      expect(document.body).not.toHaveTextContent(/Godavari|REQ-0042|Meera/);
      view.unmount();
    }
  });

  it('another browser session — or another person signed in to this tab — sees nothing of it', async () => {
    const platform = await testPlatform();
    const sent = await send(platform);
    // Another tab of the same world would be another browser session: it holds no ticket.
    const other = await testPlatform({ world: worldOf(platform.sample) });
    const view = show(other, <RequestStatusPage routeId={sent.routeId} />, `/requests/x`);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
    view.unmount();

    // This tab, while someone else is signed in to it.
    ok(
      await platform.runtime.ports.session.signIn({
        method: 'email',
        email: 'kavya.nair@wilp.example',
        password: SAMPLE_PASSWORD,
      }),
    );
    await platform.runtime.session.refresh();
    const signedIn = show(
      platform,
      <RequestStatusPage routeId={sent.routeId} />,
      `/requests/${sent.routeId}`,
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
    expect(document.body).not.toHaveTextContent(/Godavari|REQ-0042|Meera/);
    signedIn.unmount();
  });

  it('Submitted → Under review (only from the AD-14 seam) → Information requested: one fact at a time', async () => {
    const platform = await testPlatform();
    const sent = await send(platform);
    show(platform, <RequestStatusPage routeId={sent.routeId} />, `/requests/${sent.routeId}`);
    expect(await heading('Request REQ-0042')).toBeVisible();
    expect(document.title).toBe('Request REQ-0042 · XR Learning Platform');
    expect(statusHead()).toHaveTextContent(
      'SubmittedUpdated 2 Oct 2026, 10:00We’ve received your requestBITS will review it. Nothing is needed from you right now.',
    );
    expect(within(statusHead()).queryByRole('link')).toBeNull();
    expect(within(statusHead()).queryByRole('button')).toBeNull();
    expect(
      [...document.querySelectorAll('.xp-compare tbody tr')].map((row) => row.textContent),
    ).toEqual([
      'Experiments and formatsShell-and-Tube Heat Exchanger — WEB, VRNot decided yet',
      'Licences120Not decided yet',
      'Access termYearlyNot decided yet',
    ]);

    // Opening SA-03 starts nothing (AD-14 / P1-04).
    await decide(platform, sent.reference);
    expect((await statusOf(platform, sent.routeId)).reviewStarted).toBe(false);
    // The test-only seam records it; the page reads it again.
    seamsOf(platform.sample).recordReviewStarted(sent.reference);
    await act(() => platform.runtime.invalidate([{ kind: 'REQ', id: sent.reference }]));
    await waitFor(() => expect(statusHead()).toHaveTextContent('Under review'));
    expect(statusHead()).toHaveTextContent(
      'BITS is reviewing your requestNothing is needed from you right now. This page changes when BITS decides.',
    );

    const { admin, rev } = await decide(platform, sent.reference);
    const asked = ok(
      await admin.accessRequests.requestMoreInformation({
        id: sent.reference,
        reason: 'Please confirm the cohort size for this term.',
        expectedRev: rev,
      }),
    );
    await act(() => platform.runtime.invalidate([{ kind: 'REQ', id: asked.request.id }]));
    await waitFor(() => expect(statusHead()).toHaveTextContent('Information requested'));
    expect(statusHead()).toHaveTextContent(
      'BITS needs more informationYour request stays open while BITS waits for this information.What BITS asked“Please confirm the cohort size for this term.”',
    );
    // No reply field (T-03).
    expect(document.querySelector('main textarea, main input')).toBeNull();
  });

  it('Approved with changes: the difference is marked and the reason shown; then payment', async () => {
    const platform = await testPlatform();
    const sent = await send(platform);
    const { admin, rev } = await decide(platform, sent.reference);
    ok(
      await admin.accessRequests.approveSmallerScope({
        id: sent.reference,
        route: 'external',
        items: [{ experimentId: SHELL, formats: ['web', 'vr'] }],
        licences: '80',
        term: 'yearly',
        reason: 'We can offer 80 licences this term.',
        expectedRev: rev,
      }),
    );
    show(platform, <RequestStatusPage routeId={sent.routeId} />, `/requests/${sent.routeId}`);
    await heading('Request REQ-0042');
    expect(statusHead()).toHaveTextContent(
      'Approved with changes. Payment is needed before access starts.BITS approved a smaller scope than you asked for. The reason is below.Why it changed“We can offer 80 licences this term.”',
    );
    const diff = document.querySelector('.xp-compare tr.is-diff')!;
    expect(diff).toHaveTextContent('Licences12080Changed');
    expect(document.querySelectorAll('.xp-compare tr.is-diff')).toHaveLength(1);
    expect(within(statusHead()).getByRole('link', { name: 'Continue to payment' })).toHaveAttribute(
      'href',
      `/requests/${sent.routeId}/payment`,
    );
  });

  it('the Institute Admin of the requesting institution reads it; the internal route has no payment step', async () => {
    const platform = await testPlatform();
    const request = worldOf(platform.sample).records.requests['REQ-0039']!;
    ok(
      await platform.runtime.ports.session.signIn({
        method: 'email',
        email: 'p.srinivas@hyderabad.bits-pilani.ac.in',
        password: SAMPLE_PASSWORD,
      }),
    );
    await platform.runtime.session.refresh();
    show(platform, <RequestStatusPage routeId={request.routeId} />, `/requests/${request.routeId}`);
    expect(await heading('Request REQ-0039')).toBeVisible();
    expect(statusHead()).toHaveTextContent('Access active');
    expect(statusHead()).toHaveTextContent('Access plan ACC-0098');
    expect(within(statusHead()).getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/sign-in',
    );
    const lines = [...document.querySelectorAll('.xr-tl')].map((line) => line.textContent);
    expect(lines.join(' ')).toContain('Access plan ACC-0098. No payment step.');
    expect(lines.join(' ')).not.toMatch(/Payment/);
  });
});

describe('PU-12 Payment (B1-08 f5) and the TE-4 sample payment provider', () => {
  it('a request with no payment step now goes to its status (PU-12.not-payable)', async () => {
    const platform = await testPlatform();
    const sent = await send(platform);
    const { navigation } = show(
      platform,
      <PaymentPage routeId={sent.routeId} />,
      `/requests/${sent.routeId}/payment`,
    );
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith(`/requests/${sent.routeId}`, {
        replace: true,
      }),
    );
  });

  it('what will be activated, never an amount, a method or a provider; Continue confirms through the stand-in', async () => {
    const user = userEvent.setup();
    const platform = await testPlatform();
    const sent = await send(platform);
    await approveExternal(platform, sent.reference);
    const { navigation } = show(
      platform,
      <PaymentPage routeId={sent.routeId} />,
      `/requests/${sent.routeId}/payment`,
    );
    expect(await heading('Pay for access')).toBeVisible();
    expect(screen.getByText('Payment · REQ-0042')).toBeVisible();
    expect(
      [...document.querySelectorAll('.xp-pay dt')].map((term) => [
        term.textContent,
        term.nextElementSibling?.textContent,
      ]),
    ).toEqual([
      ['Institution', 'Godavari Institute of Technology'],
      ['Experiments and formats', 'Shell-and-Tube Heat Exchanger — WEB, VR'],
      ['Licences', '120'],
      ['Access term', 'Yearly'],
      ['Request', 'REQ-0042'],
    ]);
    expect(document.querySelector('main')).not.toHaveTextContent(
      /₹|INR|amount|card|UPI|bank|provider|refund|mark paid/i,
    );
    expect(document.querySelectorAll('main input, main select, main textarea')).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Continue to payment' }));
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith(`/requests/${sent.routeId}`, {
        replace: true,
      }),
    );
    const after = await statusOf(platform, sent.routeId);
    expect(after).toMatchObject({ status: 'access-active', nextStep: 'sign-in' });
    expect(after.activatedPlanId).toBe('ACC-0107');
    // Three separate events: payment started, the provider's confirmation, activation.
    expect(after.history.map((entry) => entry.event)).toEqual([
      'submitted',
      'approved',
      'payment-started',
      'payment-confirmed',
      'access-active',
    ]);
  });

  it('a planned "not confirmed": Check again, never pay again; a planned "failed": Try payment again', async () => {
    const user = userEvent.setup();
    const platform = await testPlatform();
    const sent = await send(platform);
    await approveExternal(platform, sent.reference);
    planPayment(platform.sample, 'pending');
    const pay = show(
      platform,
      <PaymentPage routeId={sent.routeId} />,
      `/requests/${sent.routeId}/payment`,
    );
    await user.click(await screen.findByRole('button', { name: 'Continue to payment' }));
    await waitFor(() => expect(pay.navigation.navigate).toHaveBeenCalled());
    pay.unmount();

    const status = show(
      platform,
      <RequestStatusPage routeId={sent.routeId} />,
      `/requests/${sent.routeId}`,
    );
    await heading('Request REQ-0042');
    expect(statusHead()).toHaveTextContent(
      'Payment not confirmed yetAccess starts once the payment is confirmed. Check again later to see the result.',
    );
    expect(within(statusHead()).queryByRole('link')).toBeNull();
    const again = within(statusHead()).getByRole('button', { name: 'Check again' });
    expect(document.querySelector('.xr-tl.is-latest')).toHaveTextContent(
      'Payment started2 Oct 2026, 10:00Waiting for confirmation.',
    );
    // The provider reports a failure later; Check again reads it.
    const report = await import('@xr/sample-platform/testing').then(({ standinsOf }) =>
      standinsOf(platform.sample).paymentOutcome.report({
        requestId: sent.reference,
        outcome: 'failed',
      }),
    );
    expect(report.ok).toBe(true);
    await user.click(again);
    await waitFor(() => expect(statusHead()).toHaveTextContent('Payment failed'));
    expect(statusHead()).toHaveTextContent(
      'The payment didn’t go throughNothing has been activated. You can try the payment again.',
    );
    expect(within(statusHead()).getByRole('link', { name: 'Try payment again' })).toHaveAttribute(
      'href',
      `/requests/${sent.routeId}/payment`,
    );
    expect((await statusOf(platform, sent.routeId)).activatedPlanId).toBeNull();
    status.unmount();
  });

  it('a stale page: the service refuses, nothing is written, the page reads where the request stands', async () => {
    const user = userEvent.setup();
    const platform = await testPlatform();
    const sent = await send(platform);
    await approveExternal(platform, sent.reference);
    const { navigation } = show(
      platform,
      <PaymentPage routeId={sent.routeId} />,
      `/requests/${sent.routeId}/payment`,
    );
    await heading('Pay for access');
    // The same browser session starts it elsewhere first (another of its pages), left pending.
    planPayment(platform.sample, 'pending');
    const view = await statusOf(platform, sent.routeId);
    ok(
      await platform.runtime.ports.accessRequests.startPayment({
        request: view.routeId,
        expectedRev: view.rev,
      }),
    );
    const before = worldOf(platform.sample).worldVersion;
    await user.click(screen.getByRole('button', { name: 'Continue to payment' }));
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith(`/requests/${sent.routeId}`, {
        replace: true,
      }),
    );
    expect(worldOf(platform.sample).worldVersion).toBe(before);
    expect((await statusOf(platform, sent.routeId)).status).toBe('payment-not-confirmed');
  });

  it('another browser session cannot open the payment page, and its payment is refused', async () => {
    const platform = await testPlatform();
    const sent = await send(platform);
    const decided = await approveExternal(platform, sent.reference);
    const other = await testPlatform({ world: worldOf(platform.sample) });
    show(other, <PaymentPage routeId={sent.routeId} />, `/requests/${sent.routeId}/payment`);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
    expect(
      await other.runtime.ports.accessRequests.startPayment({
        request: sent.routeId,
        expectedRev: decided.request.rev,
      }),
    ).toEqual({ ok: false, error: { kind: 'not-found' } });
  });
});
