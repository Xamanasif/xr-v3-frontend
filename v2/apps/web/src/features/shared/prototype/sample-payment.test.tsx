/**
 * B2B milestone I3 (owner decisions DP-05, DP-06, DP-07, DP-13, DP-15): the simulated payment
 * provider's page in the prototype profile — "Continue to payment" sends the payer there; Complete,
 * Make the payment fail and Leave it unconfirmed; a payment left waiting is listed in the prototype
 * tools and answered later; a failed payment is tried again; the request's history keeps every
 * attempt; nothing shows an amount, a method or a provider; an internal request never waits.
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ExperimentId } from '@xr/domain';
import { asPersonId } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { PaymentPage } from '@/features/public/pu-12-payment/payment';
import { testPlatform } from '@/test-support/platform';
import { renderInTab, testNavigation } from '@/test-support/workspace';

import { SamplePaymentPage } from './payment-page';
import { PrototypeToolsPage } from './tools-page';

const SHELL = 'shell-and-tube-heat-exchanger' as ExperimentId;

type Platform = Awaited<ReturnType<typeof testPlatform>>;

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

afterEach(() => window.sessionStorage.clear());

function show(platform: Platform, page: ReactNode, pathname: string, search = '') {
  const navigation = testNavigation(pathname, search);
  const view = renderInTab(page, { runtime: platform.runtime, navigation });
  return { navigation, ...view };
}

/** This tab's visitor sends a request; BITS approves it on the route given. */
async function sendApproved(platform: Platform, route: 'internal' | 'external' = 'external') {
  ok(platform.runtime.ports.selection.add({ experimentId: SHELL, formats: ['web'] }));
  const sent = ok(
    await platform.runtime.ports.accessRequests.submitPublicRequest({
      institutionName: 'Krishna Engineering College',
      contactPerson: 'R. Rao',
      email: 'r.rao@krishna.edu.in',
      phone: null,
      licencesRequested: '30',
      message: null,
      term: { kind: 'yearly' },
    }),
  );
  const admin = asPersonId(platform.sample, 'sa-arjun-mehta');
  const page = ok(await admin.accessRequests.getRequestForDecision(sent.reference));
  ok(
    await admin.accessRequests.approveRequest({
      id: sent.reference,
      route,
      expectedRev: page.request.rev,
    }),
  );
  return sent;
}

async function statusOf(platform: Platform, routeId: string) {
  return ok(await platform.runtime.ports.accessRequests.getRequestStatus(routeId as never));
}

/** Starts the payment through the port, as PU-12's command does, and refreshes what it changed. */
async function startPayment(platform: Platform, routeId: string) {
  const view = await statusOf(platform, routeId);
  const answer = await platform.runtime.ports.accessRequests.startPayment({
    request: routeId as never,
    expectedRev: view.rev,
  });
  if (!answer.ok) throw new Error(JSON.stringify(answer.error));
  await platform.runtime.invalidate(answer.changed);
}

describe('the prototype profile: Continue to payment opens the simulated provider page (DP-05)', () => {
  it('PU-12 sends the payer to the provider page, where the payment waits for their choice', async () => {
    const user = userEvent.setup();
    const platform = await testPlatform({ appEnvironment: 'prototype' });
    const sent = await sendApproved(platform);
    const { navigation } = show(
      platform,
      <PaymentPage routeId={sent.routeId} />,
      `/requests/${sent.routeId}/payment`,
    );
    await user.click(await screen.findByRole('button', { name: 'Continue to payment' }));
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith(
        `/prototype/payment?request=${sent.routeId}`,
        { replace: true },
      ),
    );
    expect((await statusOf(platform, sent.routeId)).status).toBe('payment-not-confirmed');
  });

  it('a local build keeps TE-4: the stand-in confirms, and the request status opens', async () => {
    const user = userEvent.setup();
    const platform = await testPlatform();
    const sent = await sendApproved(platform);
    const { navigation } = show(
      platform,
      <PaymentPage routeId={sent.routeId} />,
      `/requests/${sent.routeId}/payment`,
    );
    await user.click(await screen.findByRole('button', { name: 'Continue to payment' }));
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith(`/requests/${sent.routeId}`, {
        replace: true,
      }),
    );
    expect((await statusOf(platform, sent.routeId)).status).toBe('access-active');
  });
});

describe('the simulated payment provider page (DP-05, DP-07, DP-13)', () => {
  it('Complete the payment: confirmed, access active, then the request status', async () => {
    const user = userEvent.setup();
    const platform = await testPlatform({ appEnvironment: 'prototype' });
    const sent = await sendApproved(platform);
    await startPayment(platform, sent.routeId);
    const { navigation } = show(
      platform,
      <SamplePaymentPage routeId={sent.routeId} />,
      '/prototype/payment',
      `?request=${sent.routeId}`,
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Simulated payment' }),
    ).toBeVisible();
    expect(
      await screen.findByText('No money moves and no payment details are asked for.'),
    ).toBeVisible();
    expect(screen.getByText('Krishna Engineering College')).toBeVisible();
    expect(screen.getByText(sent.reference)).toBeVisible();
    expect(document.body).not.toHaveTextContent(/₹|INR|amount|card|UPI|bank|GST|price/i);
    expect(document.querySelectorAll('input, select, textarea')).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Complete the payment' }));
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith(`/requests/${sent.routeId}`, {
        replace: true,
      }),
    );
    const after = await statusOf(platform, sent.routeId);
    expect(after).toMatchObject({ status: 'access-active', nextStep: 'sign-in' });
    expect(after.activatedPlanId).toMatch(/^ACC-\d{4}$/);
  });

  it('Make the payment fail, then try again and complete: the history keeps every attempt', async () => {
    const user = userEvent.setup();
    const platform = await testPlatform({ appEnvironment: 'prototype' });
    const sent = await sendApproved(platform);
    await startPayment(platform, sent.routeId);
    const first = show(
      platform,
      <SamplePaymentPage routeId={sent.routeId} />,
      '/prototype/payment',
      `?request=${sent.routeId}`,
    );
    await user.click(await screen.findByRole('button', { name: 'Make the payment fail' }));
    await waitFor(() => expect(first.navigation.navigate).toHaveBeenCalled());
    const failed = await statusOf(platform, sent.routeId);
    expect([failed.status, failed.nextStep, failed.activatedPlanId]).toEqual([
      'payment-failed',
      'try-payment-again',
      null,
    ]);
    first.unmount();
    await startPayment(platform, sent.routeId);
    show(
      platform,
      <SamplePaymentPage routeId={sent.routeId} />,
      '/prototype/payment',
      `?request=${sent.routeId}`,
    );
    await user.click(await screen.findByRole('button', { name: 'Complete the payment' }));
    await waitFor(async () =>
      expect((await statusOf(platform, sent.routeId)).status).toBe('access-active'),
    );
    expect((await statusOf(platform, sent.routeId)).history.map((entry) => entry.event)).toEqual([
      'submitted',
      'approved',
      'payment-started',
      'payment-not-completed',
      'payment-started',
      'payment-confirmed',
      'access-active',
    ]);
  });

  it('Leave it unconfirmed: nothing is reported; the prototype tools list it, and it is answered later (DP-06)', async () => {
    const user = userEvent.setup();
    const platform = await testPlatform({ appEnvironment: 'prototype' });
    const sent = await sendApproved(platform);
    await startPayment(platform, sent.routeId);
    const page = show(
      platform,
      <SamplePaymentPage routeId={sent.routeId} />,
      '/prototype/payment',
      `?request=${sent.routeId}`,
    );
    await user.click(await screen.findByRole('button', { name: 'Leave it unconfirmed' }));
    expect(page.navigation.navigate).toHaveBeenCalledWith(`/requests/${sent.routeId}`, {
      replace: true,
    });
    expect((await statusOf(platform, sent.routeId)).status).toBe('payment-not-confirmed');
    page.unmount();

    show(platform, <PrototypeToolsPage />, '/prototype');
    expect(await screen.findByRole('heading', { level: 1, name: 'Prototype tools' })).toBeVisible();
    const choose = await screen.findByRole('link', { name: 'Choose the outcome' });
    expect(choose).toHaveAttribute('href', `/prototype/payment?request=${sent.routeId}`);
    expect(screen.getByText('Krishna Engineering College')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Reset demo data' })).toHaveAttribute(
      'href',
      '/prototype/reset',
    );
  });

  it('nothing is waiting: an internal request, or an address this session may not open, reveals nothing (DP-15)', async () => {
    const platform = await testPlatform({ appEnvironment: 'prototype' });
    const internal = await sendApproved(platform, 'internal');
    show(
      platform,
      <SamplePaymentPage routeId={internal.routeId} />,
      '/prototype/payment',
      `?request=${internal.routeId}`,
    );
    expect(await screen.findByText('No payment is waiting here')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Complete the payment' })).toBeNull();
  });

  it('the tools say when nothing is waiting', async () => {
    const platform = await testPlatform({ appEnvironment: 'prototype' });
    show(platform, <PrototypeToolsPage />, '/prototype');
    expect(
      await screen.findByText('No payment is waiting for an outcome in this browser.'),
    ).toBeVisible();
    expect(
      screen.getByText(
        'This browser doesn’t keep the records, so every page load starts from the beginning.',
      ),
    ).toBeVisible();
  });
});
