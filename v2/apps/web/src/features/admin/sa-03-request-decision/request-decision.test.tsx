/**
 * SA-03 Request decision (board B1-11) on the real composition root and the spine-start sample
 * world. The page reads `getRequestForDecision` (opening it writes nothing: AD-14 / P1-04), the
 * panel's decisions are the port's commands with the request's revision, refusals are shown as
 * they come, and every change is the shared world's — read back through the ports.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messageFor } from '@xr/contracts/draft';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import { board } from '@/test-support/boards';
import {
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../../shared/workspace-frame/workspace-frame';
import { RequestDecision } from './request-decision';

afterEach(() => {
  forgetLastAddress();
});

const B1_11 = board('B1-11-SA-Decision.dc.html');

function openDecision(runtime: PlatformRuntime, requestId: string, page?: ReactNode) {
  const navigation = testNavigation(`/admin/requests/${requestId}`);
  renderInTab(
    <WorkspaceLayout workspace="admin">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>
        {page ?? <RequestDecision requestId={requestId} />}
      </TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return navigation;
}

async function decisionOf(runtime: PlatformRuntime, requestId: string) {
  const answer = await runtime.ports.accessRequests.getRequestForDecision(requestId as never);
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

async function panel(): Promise<HTMLElement> {
  return (await screen.findByRole('complementary', { name: 'Your decision' })) as HTMLElement;
}

describe('SA-03 — REQ-0038, a renewal (B1-11 f13, f16)', () => {
  it('the details as B1-11 draws them, from the world’s answer; opening the page writes nothing', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    const before = sample.worldVersion();
    const reviewStarted = (await decisionOf(runtime, 'REQ-0038')).request.reviewStartedAt;
    openDecision(runtime, 'REQ-0038');
    await screen.findByRole('heading', { level: 1, name: 'BITS Pilani — Hyderabad Campus' });
    const header = document.querySelector('.xr-phead')!;
    expect(header.querySelector('.xr-overline')).toHaveTextContent(
      'Institutional access request · REQ-0038',
    );
    expect(header.querySelector('.xr-phead-meta')).toHaveTextContent(
      'Under reviewReceived 26 Sep 2026, 16:02Renewal',
    );
    // The back link, the sidebar destination and (from 1024 px) the crumb all go to Requests.
    expect(document.querySelector('main a.xr-back')).toHaveAttribute('href', '/admin/requests');
    expect(document.querySelector('main a.xr-back')).toHaveTextContent('Requests');
    // Summary facts.
    const summary = screen.getByRole('region', { name: 'Summary' });
    expect([...summary.querySelectorAll('dt')].map((dt) => dt.textContent)).toEqual([
      'Experiments',
      'Licences requested',
      'Access term',
      'Internal or external',
    ]);
    expect([...summary.querySelectorAll('dd')].map((dd) => dd.textContent)).toEqual([
      '2',
      '80',
      'Monthly',
      'Internal',
    ]);
    // What they're asking for: requested against published formats.
    const asking = screen.getByRole('region', { name: 'What they’re asking for' });
    const rows = [...asking.querySelectorAll('tbody tr')].map((row) =>
      [...row.querySelectorAll('td')].map((cell) => cell.textContent),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]![1]).toBe('WEB, VR');
    expect(
      screen.getByRole('region', { name: 'Existing access' }).querySelector('p'),
    ).toHaveTextContent(
      'Access plan ACC-0098 · these 2 experiments · 80 licences · current term ends 31 Oct 2026.',
    );
    expect(screen.getByRole('region', { name: 'Message from the requester' })).toHaveTextContent(
      '“Renewal for the next academic year, same experiments.”',
    );
    const history = screen.getByRole('region', { name: 'History' });
    expect(history.querySelector('.xr-tl-what')).toHaveTextContent('Request submitted');
    expect(history.querySelector('.xr-tl-when')).toHaveTextContent(
      '26 Sep 2026, 16:02 · A. Menon, contact person',
    );
    expect(screen.getByText('What happens after you decide — four separate events')).toBeVisible();
    // Opening SA-03 changes nothing: no review start, no new world version (AD-14 / P1-04).
    expect(sample.worldVersion()).toBe(before);
    expect((await decisionOf(runtime, 'REQ-0038')).request.reviewStartedAt).toBe(reviewStarted);
    for (const words of [
      'Organisation and contact person',
      'What they’re asking for',
      'Existing access',
      'Message from the requester',
      'What happens after you decide — four separate events',
      'Request more information keeps the request open; none of the four events happen until it is approved.',
    ]) {
      expect(B1_11).toContain(words);
    }
  });

  it('a renewal’s smaller scope is unavailable, saying why; the route is shown read-only', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    openDecision(runtime, 'REQ-0038');
    const decision = await panel();
    const smaller = within(decision).getByRole('radio', { name: /Approve a smaller scope/ });
    expect(smaller).toBeDisabled();
    expect(smaller.closest('label')).toHaveClass('is-off');
    expect(decision).toHaveTextContent(
      'Not available for a renewal — the term continues the current plan.',
    );
    const user = userEvent.setup();
    await user.click(within(decision).getByRole('radio', { name: /Approve request/ }));
    expect(decision).toHaveTextContent(
      'Internal or external: Internal — set when this institution was first approved.',
    );
    expect(within(decision).queryByRole('group', { name: /Internal or external/ })).toBeNull();
  });

  it('Approve request: the internal confirmation, then the world’s change in the decided panel', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    openDecision(runtime, 'REQ-0038');
    const decision = await panel();
    const user = userEvent.setup();
    await user.click(within(decision).getByRole('radio', { name: /Approve request/ }));
    await user.click(within(decision).getByRole('button', { name: 'Approve request' }));
    const dialog = await screen.findByRole('dialog', { name: 'Approve REQ-0038?' });
    expect([...dialog.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'Approves the request. There is no payment step.',
      'Institutional access is activated now and the access plan is created.',
      'Students get access only when the institution’s administrator gives it.',
    ]);
    await user.click(within(dialog).getByRole('button', { name: 'Approve request' }));
    // The shared world moved: the port answers the decided request.
    await waitFor(async () =>
      expect((await decisionOf(runtime, 'REQ-0038')).request.status).toBe('access-active'),
    );
    await waitFor(() => expect(decision).toHaveTextContent('Access active'));
    expect(decision).toHaveTextContent(/Decided by you · .* · Internal/);
    const stand = decision.querySelector('dl.xp-stand')!;
    expect(stand).toHaveAttribute('aria-label', 'Where this request stands');
    expect([...stand.querySelectorAll('dt')].map((dt) => dt.textContent)).toEqual([
      'Institution record',
      'Request',
      'Payment',
      'Institutional access',
    ]);
    expect([...stand.querySelectorAll('dd')].map((dd) => dd.textContent)).toEqual([
      'Exists',
      'Approved · Internal',
      'Not needed (internal)',
      'Active',
    ]);
    expect(decision).toHaveTextContent(
      'Institutional access is active. The institution administrator can now give students access.',
    );
    expect(within(decision).getByRole('link', { name: 'Back to requests' })).toHaveAttribute(
      'href',
      '/admin/requests',
    );
    await waitFor(() =>
      expect(within(decision).getByRole('heading', { name: 'Your decision' })).toHaveFocus(),
    );
    // The history shows the approval (P1-11 interim: no plan was written, OD-B3-09).
    const history = screen.getByRole('region', { name: 'History' });
    expect(history).toHaveTextContent('Request approved · Internal');
    expect(history).toHaveTextContent('No payment step (internal).');
  });
});

describe('SA-03 — REQ-0040, more licences (B1-11 f5, f6, f8, f12)', () => {
  it('Request more information: the reason is required; then the request waits for the requester', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    openDecision(runtime, 'REQ-0040');
    const decision = await panel();
    const user = userEvent.setup();
    // Nothing chosen: "Choose a decision".
    await user.click(within(decision).getByRole('button', { name: 'Approve request' }));
    const errors = await within(decision).findByRole('alert');
    expect(errors).toHaveTextContent('Check your decision');
    expect(errors).toHaveTextContent(messageFor('SA-03.decision.required')!);
    await waitFor(() => expect(errors).toHaveFocus());
    await user.click(within(decision).getByRole('radio', { name: /Request more information/ }));
    expect(decision).toHaveTextContent('Add your question before sending.');
    await user.click(
      within(decision).getByRole('button', { name: 'Send request for information' }),
    );
    expect(await within(decision).findByRole('alert')).toHaveTextContent(
      messageFor('SA-03.informationReason.required')!,
    );
    await user.type(
      within(decision).getByLabelText('What do you need from the requester? (required)'),
      'Please confirm the size of the second section.',
    );
    await user.click(
      within(decision).getByRole('button', { name: 'Send request for information' }),
    );
    await waitFor(async () =>
      expect((await decisionOf(runtime, 'REQ-0040')).request.status).toBe('information-requested'),
    );
    await waitFor(() => expect(decision).toHaveTextContent('Information requested'));
    expect(decision).toHaveTextContent(/Sent by you · /);
    expect(decision).toHaveTextContent(
      'The request stays open. Your question is on the requester’s request status.',
    );
    expect([...decision.querySelectorAll('dl.xp-stand dd')].map((dd) => dd.textContent)).toEqual([
      'Exists',
      'Information requested',
      '—',
      'Not active',
    ]);
    expect(screen.getByRole('region', { name: 'History' })).toHaveTextContent(
      '“Please confirm the size of the second section.”',
    );
  });

  it('Approve a smaller scope: the difference, the reason, the external confirmation', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    openDecision(runtime, 'REQ-0040');
    const decision = await panel();
    const user = userEvent.setup();
    await user.click(within(decision).getByRole('radio', { name: /Approve a smaller scope/ }));
    // REQ-0040 asks for the "Current term", which the select does not offer: it shows Monthly and
    // the difference says so (state-copy SA-03.term-not-offered).
    expect(
      within(decision).getByText('Different from the request').closest('.xr-notice'),
    ).toHaveTextContent('Term: Current term → Monthly');
    expect(decision).toHaveTextContent(
      'Change at least one thing and give a reason before approving.',
    );
    // No reason (B1-11 f8).
    await user.click(within(decision).getByRole('button', { name: 'Approve smaller scope' }));
    const errors = await within(decision).findByRole('alert');
    expect([...errors.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      messageFor('SA-03.reason.required'),
    ]);
    await user.click(within(decision).getByRole('checkbox', { name: 'AR' }));
    const different = within(decision).getByText('Different from the request');
    expect(different.closest('.xr-notice')).toHaveTextContent('Formats: WEB, AR → WEB');
    await user.type(
      within(decision).getByLabelText('Reason for the change (required)'),
      'AR is not part of the second section.',
    );
    await user.click(within(decision).getByRole('button', { name: 'Approve smaller scope' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Approve a smaller scope for REQ-0040?',
    });
    expect([...dialog.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'Approves the request. Its status becomes Approved — payment required.',
      'Institutional access is not activated now. It is activated only after the payment is confirmed.',
      'The requester sees what changed and your reason.',
      'Students get access only when the institution’s administrator gives it.',
    ]);
    await user.click(within(dialog).getByRole('button', { name: 'Approve smaller scope' }));
    await waitFor(async () => {
      const page = await decisionOf(runtime, 'REQ-0040');
      expect(page.request.status).toBe('approved-payment-required');
      expect(page.request.decision).toMatchObject({
        kind: 'approved-smaller-scope',
        approvedItems: [{ formats: ['web'] }],
        reason: 'AR is not part of the second section.',
      });
    });
    await waitFor(() => expect(decision).toHaveTextContent('Approved — payment required'));
    expect(decision).toHaveTextContent(
      'The requester now sees Continue to payment on their request status.',
    );
  });

  it('a refusal no board words (licences above the request) is never silent', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    openDecision(runtime, 'REQ-0040');
    const decision = await panel();
    const user = userEvent.setup();
    const before = sample.worldVersion();
    await user.click(within(decision).getByRole('radio', { name: /Approve a smaller scope/ }));
    const licences = within(decision).getByLabelText('Licences to approve');
    await user.clear(licences);
    await user.type(licences, '80');
    await user.type(
      within(decision).getByLabelText('Reason for the change (required)'),
      'A larger section.',
    );
    await user.click(within(decision).getByRole('button', { name: 'Approve smaller scope' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Approve a smaller scope for REQ-0040?',
    });
    await user.click(within(dialog).getByRole('button', { name: 'Approve smaller scope' }));
    // The domain refuses (PC-06 not-smaller, no drawn words): "Check your decision" shows and
    // takes focus, the licences field is marked invalid, and nothing was written.
    const errors = await within(decision).findByRole('alert');
    expect(errors).toHaveTextContent('Check your decision');
    expect(errors.querySelector('ul')).toBeNull();
    await waitFor(() => expect(errors).toHaveFocus());
    expect(licences).toHaveAttribute('aria-invalid', 'true');
    expect(sample.worldVersion()).toBe(before);
    expect((await decisionOf(runtime, 'REQ-0040')).request.status).toBe('under-review');
    // Changing the licences clears the mark.
    await user.clear(licences);
    await user.type(licences, '40');
    expect(licences).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('Cancel closes the confirmation and changes nothing', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    openDecision(runtime, 'REQ-0040');
    const decision = await panel();
    const user = userEvent.setup();
    const before = sample.worldVersion();
    await user.click(within(decision).getByRole('radio', { name: /Approve request/ }));
    await user.click(within(decision).getByRole('button', { name: 'Approve request' }));
    const dialog = await screen.findByRole('dialog', { name: 'Approve REQ-0040?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(sample.worldVersion()).toBe(before);
    expect((await decisionOf(runtime, 'REQ-0040')).request.status).toBe('under-review');
  });

  it('a paused institution: no decision controls (B1-11 f14), after a real pause', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    const detail = await runtime.ports.institutions.getInstitution('konark' as never);
    if (!detail.ok) throw new Error(detail.error.kind);
    const paused = await runtime.withCommandId('test-pause-konark').institutions.pauseInstitution({
      institutionId: 'konark' as never,
      reason: 'Licence review.',
      expectedRev: detail.value.institution.rev,
    });
    expect(paused.ok).toBe(true);
    openDecision(runtime, 'REQ-0040');
    const decision = await panel();
    await waitFor(() => expect(decision).toHaveTextContent('This institution is paused'));
    expect(decision).toHaveTextContent(
      'Requests from a paused institution can’t be decided. You can decide this one once the pause ends.',
    );
    expect(within(decision).queryAllByRole('radio')).toHaveLength(0);
    expect(within(decision).queryAllByRole('button')).toHaveLength(0);
    expect(within(decision).queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByRole('region', { name: 'Existing access' })).toHaveTextContent(
      'The institution is paused.',
    );
    // The service refuses a decision too (the domain owns it): nothing is written.
    const page = await decisionOf(runtime, 'REQ-0040');
    const answer = await runtime.ports.accessRequests.approveRequest({
      id: page.request.id,
      route: null,
      expectedRev: page.request.rev,
    });
    expect(answer.ok ? null : answer.error).toEqual({
      kind: 'refused',
      code: 'institution-paused',
    });
  });
});

describe('SA-03 — decided and unknown requests', () => {
  it('REQ-0041 (information requested): the decided panel, no decision controls', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    openDecision(runtime, 'REQ-0041');
    const decision = await panel();
    await waitFor(() => expect(decision).toHaveTextContent('Information requested'));
    expect(within(decision).queryAllByRole('radio')).toHaveLength(0);
    expect(screen.getByRole('region', { name: 'Existing access' })).toHaveTextContent(
      'None. There is no institution record for Krishna College of Engineering yet. Approving this request creates the record — it does not activate access.',
    );
  });

  it('REQ-0037 (approved, payment required): the record this approval created', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    openDecision(runtime, 'REQ-0037');
    const decision = await panel();
    await waitFor(() => expect(decision).toHaveTextContent('Approved — payment required'));
    expect([...decision.querySelectorAll('dl.xp-stand dd')].map((dd) => dd.textContent)).toEqual([
      'Created · 22 Sep 2026, 15:00',
      'Approved · External',
      'Waiting — not confirmed',
      'Not active',
    ]);
    expect(screen.getByRole('region', { name: 'Existing access' })).toHaveTextContent(
      'Institution record created by this approval · 22 Sep 2026, 15:00. No institutional access yet — it is activated only after the payment is confirmed.',
    );
  });

  it('an unknown reference is the in-shell not-found (existence is not revealed)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    openDecision(runtime, 'REQ-9999');
    await screen.findByRole('heading', { name: 'We can’t find that page' });
  });
});
