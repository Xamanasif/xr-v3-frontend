/**
 * SA-03 Request decision (board B1-11) on the real composition root and the spine-start sample
 * world. The page reads `getRequestForDecision` (opening it writes nothing: AD-14 / P1-04), the
 * panel's decisions are the port's commands with the request's revision, refusals are shown as
 * they come, and every change is the shared world's — read back through the ports.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type DecisionPage, messageFor } from '@xr/contracts/draft';
import { asPersonId, seamsOf, visitorPorts } from '@xr/sample-platform/testing';
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
    // B1-11 f14's one next step, rendered since SA-07 is built (Package 1D).
    expect(
      within(decision)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/admin/institutions/konark']);
    expect(within(decision).getByRole('link', { name: 'View institution' })).toBeInTheDocument();
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

describe('SA-03 — a decision keeps the revision it began with (P1-21; Package 1E)', () => {
  type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

  /**
   * The AD-14 review start recorded meanwhile (the CI-only seam, as the test-hook bridge's
   * `startReview`): the request stays under review with a newer revision, and this page shows it.
   */
  async function reviewStartedElsewhere(runtime: PlatformRuntime, sample: Sample, id: string) {
    const before = (await decisionOf(runtime, id)).request.rev;
    seamsOf(sample).recordReviewStarted(id);
    await act(() => runtime.invalidate([{ kind: 'REQ', id }]));
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'History' })).toHaveTextContent(
        'BITS started reviewing',
      ),
    );
    expect((await decisionOf(runtime, id)).request.rev).toBe(before + 1);
  }

  const heading = (decision: HTMLElement) =>
    within(decision).getByRole('heading', { name: 'Your decision' });

  it('Request more information composed before a change shown meanwhile: refused as stale, nothing written, the question kept', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    openDecision(runtime, 'REQ-0040');
    const decision = await panel();
    const user = userEvent.setup();
    // The decision begins: its revision is the one the page shows now.
    await user.click(within(decision).getByRole('radio', { name: /Request more information/ }));
    const question = within(decision).getByLabelText(
      'What do you need from the requester? (required)',
    );
    await user.type(question, 'Please confirm the size of the second section.');
    await reviewStartedElsewhere(runtime, sample, 'REQ-0040');
    const version = sample.worldVersion();
    await user.click(
      within(decision).getByRole('button', { name: 'Send request for information' }),
    );
    // The service refuses the revision the decision began with; nothing is written.
    await waitFor(() => expect(heading(decision)).toHaveFocus());
    expect(sample.worldVersion()).toBe(version);
    const page = await decisionOf(runtime, 'REQ-0040');
    expect(page.request.status).toBe('under-review');
    expect(page.request.informationRequest).toBeNull();
    // The panel shows the request as it is, with the decision being composed still in it.
    expect(within(decision).getByRole('radio', { name: /Request more information/ })).toBeChecked();
    expect(question).toHaveValue('Please confirm the size of the second section.');
    expect(within(decision).queryByRole('alert')).toBeNull();
    // Sent again, it goes with the revision now shown.
    await user.click(
      within(decision).getByRole('button', { name: 'Send request for information' }),
    );
    await waitFor(async () =>
      expect((await decisionOf(runtime, 'REQ-0040')).request.status).toBe('information-requested'),
    );
    await waitFor(() => expect(decision).toHaveTextContent('Information requested'));
  });

  it('a confirmation open while the request changes elsewhere: it keeps its revision; confirming is refused, nothing written', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    openDecision(runtime, 'REQ-0040');
    const decision = await panel();
    const user = userEvent.setup();
    await user.click(within(decision).getByRole('radio', { name: /Approve request/ }));
    await user.click(within(decision).getByRole('button', { name: 'Approve request' }));
    const dialog = await screen.findByRole('dialog', { name: 'Approve REQ-0040?' });
    const lines = [...dialog.querySelectorAll('li')].map((li) => li.textContent);
    await reviewStartedElsewhere(runtime, sample, 'REQ-0040');
    // Still open, naming the same decision.
    expect(dialog).toBeVisible();
    expect([...dialog.querySelectorAll('li')].map((li) => li.textContent)).toEqual(lines);
    const version = sample.worldVersion();
    await user.click(within(dialog).getByRole('button', { name: 'Approve request' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(heading(decision)).toHaveFocus());
    expect(sample.worldVersion()).toBe(version);
    const page = await decisionOf(runtime, 'REQ-0040');
    expect(page.request.status).toBe('under-review');
    expect(page.request.decision).toBeNull();
    // A new confirmation begins from the request as now shown, and is accepted.
    expect(within(decision).getByRole('radio', { name: /Approve request/ })).toBeChecked();
    await user.click(within(decision).getByRole('button', { name: 'Approve request' }));
    const again = await screen.findByRole('dialog', { name: 'Approve REQ-0040?' });
    await user.click(within(again).getByRole('button', { name: 'Approve request' }));
    await waitFor(async () =>
      expect((await decisionOf(runtime, 'REQ-0040')).request.status).toBe(
        'approved-payment-required',
      ),
    );
    await waitFor(() => expect(heading(decision)).toHaveFocus());
  });

  it('a smaller scope confirmed after a change shown meanwhile is refused as stale, and its scope is kept', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    openDecision(runtime, 'REQ-0040');
    const decision = await panel();
    const user = userEvent.setup();
    await user.click(within(decision).getByRole('radio', { name: /Approve a smaller scope/ }));
    await user.click(within(decision).getByRole('checkbox', { name: 'AR' }));
    const reason = within(decision).getByLabelText('Reason for the change (required)');
    await user.type(reason, 'AR is not part of the second section.');
    await reviewStartedElsewhere(runtime, sample, 'REQ-0040');
    await user.click(within(decision).getByRole('button', { name: 'Approve smaller scope' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Approve a smaller scope for REQ-0040?',
    });
    const version = sample.worldVersion();
    await user.click(within(dialog).getByRole('button', { name: 'Approve smaller scope' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(heading(decision)).toHaveFocus());
    expect(sample.worldVersion()).toBe(version);
    expect((await decisionOf(runtime, 'REQ-0040')).request.decision).toBeNull();
    expect(within(decision).getByRole('checkbox', { name: 'AR' })).not.toBeChecked();
    expect(reason).toHaveValue('AR is not part of the second section.');
  });

  it('decided in another session while the confirmation is open: nothing more is sent; the decided panel shows, focus on its heading', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    openDecision(runtime, 'REQ-0040');
    const decision = await panel();
    const user = userEvent.setup();
    await user.click(within(decision).getByRole('radio', { name: /Approve request/ }));
    await user.click(within(decision).getByRole('button', { name: 'Approve request' }));
    await screen.findByRole('dialog', { name: 'Approve REQ-0040?' });
    const opened = await decisionOf(runtime, 'REQ-0040');
    const elsewhere = await asPersonId(sample, SUPER_ADMIN).accessRequests.requestMoreInformation({
      id: opened.request.id,
      reason: 'Asked from another tab.',
      expectedRev: opened.request.rev,
    });
    if (!elsewhere.ok) throw new Error(elsewhere.error.kind);
    const version = sample.worldVersion();
    await act(() => runtime.invalidate(elsewhere.changed));
    await waitFor(() => expect(decision).toHaveTextContent('Information requested'));
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(heading(decision)).toHaveFocus());
    expect(sample.worldVersion()).toBe(version);
    expect((await decisionOf(runtime, 'REQ-0040')).request.decision).toBeNull();
  });

  /** A new institution's request (REQ-0042), sent by a visitor of this world, for these formats. */
  async function publicRequest(
    sample: Sample,
    experiments: Readonly<Record<string, readonly ('web' | 'vr')[]>>,
  ) {
    const visitor = visitorPorts(sample);
    for (const [experimentId, formats] of Object.entries(experiments)) {
      const added = visitor.selection.add({ experimentId: experimentId as never, formats });
      if (!added.ok) throw new Error(added.error.kind);
    }
    const sent = await visitor.accessRequests.submitPublicRequest({
      institutionName: 'Godavari Institute of Technology',
      contactPerson: 'Meera Iyer',
      email: 'meera.iyer@godavari.edu.in',
      phone: null,
      licencesRequested: '120',
      message: null,
      term: { kind: 'yearly' },
    });
    if (!sent.ok) throw new Error(sent.error.kind);
    return sent.value.reference;
  }

  it('the confirmation sends the decision it names, even when the page is read again with other facts meanwhile', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    const reference = await publicRequest(sample, { 'shell-and-tube-heat-exchanger': ['web'] });
    openDecision(runtime, reference);
    const decision = await panel();
    const user = userEvent.setup();
    await user.click(within(decision).getByRole('radio', { name: /Approve request/ }));
    await user.click(document.querySelector('label[for="decision-route-internal"]')!);
    await user.click(within(decision).getByRole('button', { name: 'Approve request' }));
    const dialog = await screen.findByRole('dialog', { name: `Approve ${reference}?` });
    const lines = [...dialog.querySelectorAll('li')].map((li) => li.textContent);
    expect(lines.join(' ')).toContain('Internal');
    // A newer read of the page that says other things — its route already External, its record
    // created — written into the cache (no Phase-1 command can change a request's own route while
    // it is open; this stands for any read that answers differently).
    act(() => {
      runtime.queryClient.setQueriesData<{ ok: true; value: DecisionPage }>(
        {
          predicate: (query) =>
            query.queryKey[2] === 'REQ' &&
            query.queryKey[3] === 'decision' &&
            query.queryKey[4] === reference,
        },
        (answer) =>
          answer && {
            ...answer,
            value: {
              ...answer.value,
              routeCommitted: 'external',
              whereItStands: { ...answer.value.whereItStands, institutionRecord: 'created' },
            },
          },
      );
    });
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Summary' })).toHaveTextContent('External'),
    );
    // The page shows the newer read; the confirmation names what it opened with, and sends it.
    expect([...dialog.querySelectorAll('li')].map((li) => li.textContent)).toEqual(lines);
    await user.click(within(dialog).getByRole('button', { name: 'Approve request' }));
    await waitFor(async () =>
      expect((await decisionOf(runtime, reference)).request.status).toBe('access-active'),
    );
    expect((await decisionOf(runtime, reference)).request.decision).toMatchObject({
      route: 'internal',
    });
  });

  it('an open policy (REQ-19: narrowing a request of several experiments): nothing written, the decision kept, focus back on its button — as before Package 1E', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    const reference = await publicRequest(sample, {
      'shell-and-tube-heat-exchanger': ['web', 'vr'],
      'distillation-column': ['web'],
    });
    openDecision(runtime, reference);
    const decision = await panel();
    const user = userEvent.setup();
    await user.click(within(decision).getByRole('radio', { name: /Approve a smaller scope/ }));
    await user.click(document.querySelector('label[for="decision-route-external"]')!);
    // The first experiment narrowed to WEB: a request of two experiments (REQ-19 is OPEN).
    const vr = within(decision).getByRole('checkbox', { name: 'VR' });
    await user.click(vr);
    const reason = within(decision).getByLabelText('Reason for the change (required)');
    await user.type(reason, 'One section for now.');
    const trigger = within(decision).getByRole('button', { name: 'Approve smaller scope' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', {
      name: `Approve a smaller scope for ${reference}?`,
    });
    const version = sample.worldVersion();
    await user.click(within(dialog).getByRole('button', { name: 'Approve smaller scope' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(sample.worldVersion()).toBe(version);
    expect((await decisionOf(runtime, reference)).request.status).toBe('under-review');
    expect(vr).not.toBeChecked();
    expect(reason).toHaveValue('One section for now.');
    expect(within(decision).queryByRole('alert')).toBeNull();
  });

  it('paused in another session while the confirmation is open: it goes, nothing is sent, focus on the panel’s heading', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    openDecision(runtime, 'REQ-0040');
    const decision = await panel();
    const user = userEvent.setup();
    await user.click(within(decision).getByRole('radio', { name: /Approve request/ }));
    await user.click(within(decision).getByRole('button', { name: 'Approve request' }));
    await screen.findByRole('dialog', { name: 'Approve REQ-0040?' });
    const detail = await runtime.ports.institutions.getInstitution('konark' as never);
    if (!detail.ok) throw new Error(detail.error.kind);
    const paused = await asPersonId(sample, SUPER_ADMIN).institutions.pauseInstitution({
      institutionId: 'konark' as never,
      reason: 'Licence review.',
      expectedRev: detail.value.institution.rev,
    });
    if (!paused.ok) throw new Error(paused.error.kind);
    const version = sample.worldVersion();
    await act(() => runtime.invalidate(paused.changed));
    await waitFor(() => expect(decision).toHaveTextContent('This institution is paused'));
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(heading(decision)).toHaveFocus());
    expect(sample.worldVersion()).toBe(version);
    expect((await decisionOf(runtime, 'REQ-0040')).request.status).toBe('under-review');
  });

  it('paused in another session while a question is being typed: the controls go, focus moves to the panel’s heading', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    openDecision(runtime, 'REQ-0040');
    const decision = await panel();
    const user = userEvent.setup();
    await user.click(within(decision).getByRole('radio', { name: /Request more information/ }));
    await user.type(
      within(decision).getByLabelText('What do you need from the requester? (required)'),
      'Please confirm',
    );
    const detail = await runtime.ports.institutions.getInstitution('konark' as never);
    if (!detail.ok) throw new Error(detail.error.kind);
    const paused = await asPersonId(sample, SUPER_ADMIN).institutions.pauseInstitution({
      institutionId: 'konark' as never,
      reason: 'Licence review.',
      expectedRev: detail.value.institution.rev,
    });
    if (!paused.ok) throw new Error(paused.error.kind);
    await act(() => runtime.invalidate(paused.changed));
    await waitFor(() => expect(decision).toHaveTextContent('This institution is paused'));
    expect(within(decision).queryAllByRole('textbox')).toHaveLength(0);
    await waitFor(() => expect(heading(decision)).toHaveFocus());
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
