/**
 * Phase-2 Package 2A, the Institution → Student access workflow, on the real composition root and
 * the sample world: IA-04 Student access (B2-04) and IA-05 Give students access (B2-05). Every
 * row, status, standing, wait and refusal is the ports' answer; the commands go out with the
 * revision the page read and a refusal or failure writes nothing. The cross-role effect is read
 * back through the Student's own session. Fixtures: `after-setup` (8 Oct 2026: twelve students,
 * Sneha Reddy inactive, GRP-0012, no grant), `after-flow-b` (SACC-0310 given to Rahul Verma; Deccan
 * paused), `later-sample` (the group grant SACC-0311 beside Rahul's SACC-0310 — OD-B2-01 —,
 * SACC-0312 withdrawn, supplied waits for Arun Kumar and Fatima Begum).
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ProductPorts } from '@xr/contracts/draft';
import { type ExperimentId, type InstitutionId, type IsoInstant, unsafeBrand } from '@xr/domain';
import { asPersonId, faults, setSampleNow, snapshot } from '@xr/sample-platform/testing';
import { type ReactNode, useMemo, useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { type AppNavigation, NavigationProvider } from '@/nav/navigation';
import type { PlatformRuntime } from '@/platform/runtime';
import {
  NotFoundSignal,
  PAUSED_INSTITUTE_ADMIN,
  PERSON_OF_ROLE,
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { StudentAccess } from './ia-04-student-access/student-access';
import { GiveAccess } from './ia-05-give-access/give-access';

afterEach(() => {
  forgetLastAddress();
});

const MEERA = PERSON_OF_ROLE.tenant_admin;
const RAHUL = 'per-0002';
const SHELL = unsafeBrand<ExperimentId>('shell-and-tube-heat-exchanger');
const GIVE = '/institute/student-access/give';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

/** IA-04 at its address, in the institute workspace. */
function showStudentAccess(runtime: PlatformRuntime) {
  const navigation = testNavigation('/institute/student-access');
  return renderInTab(
    <WorkspaceLayout workspace="institute">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>
        <StudentAccess />
      </TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
}

/**
 * The app's navigation as the router gives it: `navigate` moves to the address (the step lives in
 * `?step=`), and the page stays mounted as Next.js keeps a page across its own query changes.
 */
function LiveNavigation({
  start,
  moves,
  children,
}: {
  readonly start: string;
  readonly moves: string[];
  readonly children: ReactNode;
}) {
  const [address, setAddress] = useState(start);
  const value = useMemo<AppNavigation>(() => {
    const url = new URL(address, 'http://localhost');
    const go = (href: string, replace: boolean) => {
      moves.push(`${replace ? 'replace' : 'push'} ${href}`);
      setAddress(href);
    };
    return {
      pathname: url.pathname,
      search: url.search,
      replace: (href) => go(href, true),
      navigate: (href, options) => go(href, options?.replace === true),
      notFound: () => {
        throw new NotFoundSignal(url.pathname);
      },
    };
  }, [address, moves]);
  return <NavigationProvider value={value}>{children}</NavigationProvider>;
}

/** IA-05 at an address, with a navigation that moves between its steps. */
function showGiveAccess(runtime: PlatformRuntime, search = '') {
  const moves: string[] = [];
  const view = renderInTab(
    <LiveNavigation start={`${GIVE}${search}`} moves={moves}>
      <WorkspaceLayout workspace="institute">
        <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>
          <GiveAccess />
        </TestNotFoundBoundary>
      </WorkspaceLayout>
    </LiveNavigation>,
    { runtime, navigation: testNavigation(GIVE, search) },
  );
  return { moves, view };
}

const main = () => screen.getByRole('main');
const rowsOf = () => [...document.querySelectorAll<HTMLTableRowElement>('main tbody tr')];
const count = () => document.querySelector('.xr-toolbar-status [role="status"]');

/** The row of a student and a grant (the grant ID under "How given"). */
function rowOf(name: string, grantId: string): HTMLTableRowElement {
  const row = rowsOf().find(
    (candidate) =>
      candidate.querySelector('td.is-primary a')?.textContent === name &&
      candidate.cells[3]?.querySelector(':scope > .xr-sub .xr-id')?.textContent === grantId,
  );
  if (!row) throw new Error(`No row for ${name} · ${grantId}`);
  return row;
}

async function grantsOf(ports: ProductPorts) {
  return ok(await ports.studentAccess.listGrants({ showWithdrawn: true }));
}

async function pauseGodavari(sample: Sample) {
  const arjun = asPersonId(sample, SUPER_ADMIN);
  const detail = ok(
    await arjun.institutions.getInstitution(unsafeBrand<InstitutionId>('godavari')),
  );
  ok(
    await arjun.institutions.pauseInstitution({
      institutionId: detail.institution.id,
      reason: 'The institution asked us to pause access while it checks its student list.',
      expectedRev: detail.institution.rev,
    }),
  );
}

// ---- IA-04 Student access (B2-04) ----------------------------------------------------------

describe('IA-04 — the grants as the service lists them (B2-04 f0)', () => {
  it('one row per student × experiment: who, what, formats from the plan, how given, status', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    showStudentAccess(runtime);
    expect(await screen.findByRole('heading', { level: 1, name: 'Student access' })).toBeVisible();
    expect(main()).toHaveTextContent('Who can open which experiments');
    await waitFor(() => expect(rowsOf()).toHaveLength(1));
    expect(screen.getByRole('link', { name: 'Give students access' })).toHaveAttribute(
      'href',
      GIVE,
    );
    const row = rowOf('Rahul Verma', 'SACC-0310');
    const cells = [...row.querySelectorAll('td')];
    expect(within(cells[0]!).getByRole('link', { name: 'Rahul Verma' })).toHaveAttribute(
      'href',
      `/institute/people/students/${RAHUL}`,
    );
    expect(cells[0]).toHaveTextContent('GIT-2026-0418');
    expect(cells[1]).toHaveTextContent('Shell-and-Tube Heat ExchangerME ZG523');
    expect([...cells[2]!.querySelectorAll('.xr-fmt')].map((chip) => chip.textContent)).toEqual([
      'WEB',
      'VR',
    ]);
    expect(cells[2]).toHaveAttribute('data-label', 'Formats (from your plan)');
    expect(cells[3]).toHaveTextContent('Individually9 Oct 2026 · SACC-0310');
    expect(within(cells[4]!).getByText('Active')).toBeVisible();
    expect(
      within(cells[5]!).getByRole('button', {
        name: 'Withdraw Rahul Verma’s access to Shell-and-Tube Heat Exchanger',
      }),
    ).toHaveTextContent('Withdraw…');
    expect(count()).toHaveTextContent('1 student × experiment');
    expect(screen.queryByText(/Show withdrawn/)).toBeNull();
    // Nothing is counted against licences and no group control is drawn (IA-14 is not built).
    expect(main()).not.toHaveTextContent(/licences? (left|used|available)/i);
    expect(screen.queryByRole('link', { name: 'Change on the group' })).toBeNull();
  });

  it('“No student has access yet” before any grant (B2-04 f8)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    showStudentAccess(runtime);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'No student has access yet' }),
    ).toBeVisible();
    expect(main()).toHaveTextContent(
      'Give students the experiments your institution holds. They see the formats in your access plan.',
    );
    expect(screen.getAllByRole('link', { name: 'Give students access' })).toHaveLength(2);
    expect(document.querySelector('.xr-toolbar')).toBeNull();
  });

  it('loading, then failed + “Try again” reads the list again (B2-04 f10, f11)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    faults(sample).failNext('StudentAccessService.listGrants');
    showStudentAccess(runtime);
    expect(await screen.findByText('Loading student access')).toHaveAttribute('role', 'status');
    expect(
      await screen.findByRole('heading', { level: 2, name: 'We couldn’t load student access' }),
    ).toBeVisible();
    expect(main()).toHaveTextContent('Nothing has changed. Try again.');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(rowsOf()).toHaveLength(1));
  });
});

describe('IA-04 — search, filters and history (B2-04 f1, f5, f9)', () => {
  it('filters the rows on show; chips, count and Clear filters follow', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    showStudentAccess(runtime);
    await waitFor(() => expect(rowsOf()).toHaveLength(10));
    // SACC-0312 (withdrawn) is history behind the toggle.
    expect(count()).toHaveTextContent('10 rows · one per student × experiment');
    expect(rowsOf().some((row) => row.textContent!.includes('SACC-0312'))).toBe(false);

    await user.type(screen.getByLabelText('Search'), 'Rahul');
    expect(count()).toHaveTextContent('2 of 10 rows · one per student × experiment');
    expect(rowsOf().map((row) => row.cells[3]!.textContent)).toEqual([
      expect.stringContaining('Individually'),
      expect.stringContaining('Group: ME ZG523 — Sem II'),
    ]);
    await user.click(screen.getByRole('button', { name: 'Remove Search: “Rahul”' }));
    expect(screen.getByLabelText('Search')).toHaveFocus();

    await user.selectOptions(screen.getByLabelText('Status'), 'waiting');
    expect(rowsOf().map((row) => row.querySelector('td.is-primary a')!.textContent)).toEqual([
      'Arun Kumar',
      'Fatima Begum',
    ]);
    expect(screen.getByText('Status: Waiting for a licence')).toBeVisible();
    await user.selectOptions(screen.getByLabelText('How given'), 'grp');
    expect(rowsOf().map((row) => row.querySelector('td.is-primary a')!.textContent)).toEqual([
      'Arun Kumar',
    ]);
    expect(count()).toHaveTextContent('1 of 10 rows · one per student × experiment');
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(rowsOf()).toHaveLength(10);

    await user.type(screen.getByLabelText('Search'), 'Ananya');
    expect(
      screen.getByRole('heading', { level: 2, name: 'No rows match these filters' }),
    ).toBeVisible();
    await user.click(
      within(document.querySelector('.xr-empty')!).getByRole('button', { name: 'Clear filters' }),
    );
    expect(rowsOf()).toHaveLength(10);
    expect(screen.getByLabelText('Search')).toHaveFocus();

    await user.click(screen.getByRole('checkbox', { name: 'Show withdrawn (1)' }));
    const nikhil = rowOf('Nikhil Bose', 'SACC-0312');
    expect(within(nikhil).getByText('Withdrawn')).toBeVisible();
    expect(nikhil).toHaveTextContent('Withdrawn 12 Oct 2026');
    expect(nikhil).toHaveTextContent('Given by mistake — Nikhil is not in ME ZG523 this semester.');
    expect(within(nikhil).queryByRole('button')).toBeNull();
  });

  it('a group row and the overlap: the group, its grant and “Also in …” — no Withdraw on a group grant', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    showStudentAccess(runtime);
    await waitFor(() => expect(rowsOf()).toHaveLength(10));
    const own = rowOf('Rahul Verma', 'SACC-0310');
    expect(own.cells[3]).toHaveTextContent(
      'Also in ME ZG523 — Sem II, which has this experiment · SACC-0311',
    );
    const group = rowOf('Priya Natarajan', 'SACC-0311');
    expect(group.cells[3]).toHaveTextContent('Group: ME ZG523 — Sem II12 Oct 2026 · SACC-0311');
    expect(within(group).queryByRole('button')).toBeNull();
    expect(
      within(rowOf('Arun Kumar', 'SACC-0311')).getByText('Waiting for a licence'),
    ).toBeVisible();
    expect(within(rowOf('Sneha Reddy', 'SACC-0311')).getByText('Student inactive')).toBeVisible();
  });
});

describe('IA-04 — Withdraw… (DL-2, reason required; B2-04 f0, f3, f7)', () => {
  it('the only grant: the reason is required, then the grant is withdrawn and hidden behind “Show withdrawn”', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    showStudentAccess(runtime);
    await waitFor(() => expect(rowsOf()).toHaveLength(1));
    const trigger = screen.getByRole('button', {
      name: 'Withdraw Rahul Verma’s access to Shell-and-Tube Heat Exchanger',
    });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Withdraw access?' });
    expect(dialog).toHaveTextContent(
      'SACC-0310 is Rahul Verma’s only grant for Shell-and-Tube Heat Exchanger, so Rahul will no longer be able to open it. Their work is kept, and the grant stays in the access history.',
    );
    const reason = within(dialog).getByLabelText(/^Reason/);
    expect(reason).toHaveFocus();
    expect(dialog).toHaveTextContent(
      'Kept in the access history, which your institution’s administrators can see.',
    );

    // f3: no reason — the service's drawn error; nothing is written.
    const before = JSON.stringify(snapshot(sample));
    await user.click(within(dialog).getByRole('button', { name: 'Withdraw access' }));
    await waitFor(() =>
      expect(within(dialog).getByText('Enter the reason for withdrawing access')).toBeVisible(),
    );
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(JSON.stringify(snapshot(sample))).toBe(before);

    // Cancel returns focus to the row's button.
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.click(trigger);
    const again = await screen.findByRole('dialog', { name: 'Withdraw access?' });
    await user.type(within(again).getByLabelText(/^Reason/), 'Given by mistake.');
    await user.click(within(again).getByRole('button', { name: 'Withdraw access' }));
    const flash = await screen.findByText(
      'Access withdrawn. SACC-0310 was Rahul Verma’s only grant for Shell-and-Tube Heat Exchanger, so Rahul can no longer open it. Their work is kept.',
    );
    await waitFor(() => expect(flash.closest('[tabindex="-1"]')).toHaveFocus());
    const [grant] = await grantsOf(asPersonId(sample, MEERA));
    expect(grant!.grant).toMatchObject({
      state: 'withdrawn',
      withdrawal: { reason: 'Given by mistake.' },
    });
    // The row is history now (B2-04 f0 caption).
    await waitFor(() => expect(rowsOf()).toHaveLength(0));
    await user.click(screen.getByRole('checkbox', { name: 'Show withdrawn (1)' }));
    expect(rowOf('Rahul Verma', 'SACC-0310')).toHaveTextContent('Given by mistake.');
  });

  it('beside a group grant (later sample): only the individual grant, the group grant not changed — and no can / can’t (OD-B2-01)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'later-sample');
    showStudentAccess(runtime);
    await waitFor(() => expect(rowsOf()).toHaveLength(10));
    await user.click(
      screen.getByRole('button', {
        name: 'Withdraw Rahul Verma’s individual grant for Shell-and-Tube Heat Exchanger',
      }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Withdraw Rahul Verma’s individual grant?',
    });
    expect(dialog).toHaveTextContent(
      'This withdraws SACC-0310, the grant given to Rahul Verma individually. Their work is kept, and the grant stays in the access history.',
    );
    expect(dialog).toHaveTextContent(
      'Rahul is also in ME ZG523 — Sem II, which has Shell-and-Tube Heat Exchanger through its own grant, SACC-0311. Withdrawing this individual grant doesn’t change the group grant.',
    );
    expect(dialog).not.toHaveTextContent(/no longer be able to open/);
    await user.type(within(dialog).getByLabelText(/^Reason/), 'Given individually by mistake.');
    await user.click(within(dialog).getByRole('button', { name: 'Withdraw individual grant' }));
    expect(
      await screen.findByText(
        'Individual grant SACC-0310 withdrawn. Rahul is still in ME ZG523 — Sem II, and the group grant SACC-0311 is not changed.',
      ),
    ).toBeVisible();
    // f4: the row stays — individual grant withdrawn, the group line kept; the group grant as it was.
    await waitFor(() =>
      expect(
        within(rowOf('Rahul Verma', 'SACC-0310')).getByText('Individual grant withdrawn'),
      ).toBeVisible(),
    );
    expect(rowOf('Rahul Verma', 'SACC-0310').cells[3]).toHaveTextContent(
      'Also in ME ZG523 — Sem II',
    );
    expect(within(rowOf('Rahul Verma', 'SACC-0311')).getByText('Active')).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'Show withdrawn (1)' })).not.toBeChecked();
    expect(main()).not.toHaveTextContent(/can (still|no longer) open/);

    // The Student's own gate for the experiment is the open decision itself — neither granted nor
    // refused — and that answer writes nothing (DV-1 interim).
    const rahul = asPersonId(sample, RAHUL);
    const before = JSON.stringify(snapshot(sample));
    const page = await rahul.learning.getFormatPage({ experimentId: SHELL, format: 'web' });
    expect(page.ok ? page.value.gate : page.error).toMatchObject({
      kind: 'policy-open',
      decision: 'OD-B2-01',
    });
    expect(JSON.stringify(snapshot(sample))).toBe(before);
  });

  it('a failure keeps the dialog and the reason; nothing is withdrawn', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    showStudentAccess(runtime);
    await waitFor(() => expect(rowsOf()).toHaveLength(1));
    await user.click(screen.getByRole('button', { name: /^Withdraw Rahul Verma/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Withdraw access?' });
    await user.type(within(dialog).getByLabelText(/^Reason/), 'Given by mistake.');
    faults(sample).failNext('StudentAccessService.withdrawGrant');
    await user.click(within(dialog).getByRole('button', { name: 'Withdraw access' }));
    expect(
      await within(dialog).findByText('Access wasn’t withdrawn. Nothing was changed. Try again.'),
    ).toBeVisible();
    expect(within(dialog).getByLabelText(/^Reason/)).toHaveValue('Given by mistake.');
    const [grant] = await grantsOf(asPersonId(sample, MEERA));
    expect(grant!.grant.state).toBe('active');
  });
});

describe('IA-04 — read-only while the institution is paused (B2-04 f12)', () => {
  it('rows stay readable; no Give students access, no Withdraw…', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    await pauseGodavari(sample);
    showStudentAccess(runtime);
    await waitFor(() => expect(rowsOf()).toHaveLength(1));
    expect(
      await screen.findByText('Read-only while your institution’s access is paused'),
    ).toBeVisible();
    expect(main()).toHaveTextContent(
      'You can’t give or withdraw access until BITS lifts the pause.',
    );
    expect(screen.queryByRole('link', { name: 'Give students access' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Withdraw/ })).toBeNull();
    expect(within(rowOf('Rahul Verma', 'SACC-0310')).getByText('Active')).toBeVisible();
  });

  it('Deccan, paused with no grant: the notice and the empty state without Give access', async () => {
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'later-sample');
    showStudentAccess(runtime);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'No student has access yet' }),
    ).toBeVisible();
    expect(screen.getByText('Read-only while your institution’s access is paused')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Give students access' })).toBeNull();
  });
});

// ---- IA-05 Give students access (B2-05) --------------------------------------------------------

async function heading(name: string) {
  return screen.findByRole('heading', { level: 1, name });
}

describe('IA-05 — the primary journey (B2-05 f0 → f3; B2-13 f0)', () => {
  it('Meera gives Rahul Shell-and-Tube in three steps; IA-04 lists SACC-0310; Rahul’s home answers it', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const rahul = asPersonId(sample, RAHUL);
    expect(ok(await rahul.studentAccess.getMyHome())).toMatchObject({ noAccessYet: true });
    const { moves, view } = showGiveAccess(runtime);

    // Loading (f18), then step 1.
    expect(await screen.findByText('Loading your access plan')).toHaveAttribute('role', 'status');
    expect(await heading('Choose experiments')).toBeVisible();
    await screen.findByRole('checkbox', { name: /Shell-and-Tube Heat Exchanger/ });
    expect(main().querySelector('.xr-overline')).toHaveTextContent('Step 1 of 3');
    const steps = screen.getByRole('list', { name: 'Give students access' });
    expect(
      within(steps)
        .getAllByRole('listitem')
        .map((step) => step.textContent),
    ).toEqual(['Step 1Experiments', 'Step 2Students', 'Step 3Review and give access']);
    await waitFor(() =>
      expect(main()).toHaveTextContent('ACC-0107 · Active · 120 licences · ends 7 Oct 2027'),
    );
    expect(screen.getByLabelText('Course')).toHaveDisplayValue(
      'ME ZG523 — Thermodynamics & Heat Transfer',
    );
    expect(main()).toHaveTextContent('Available to your institution:WEBVR');
    expect(main()).toHaveTextContent('Also published in ME ZG523 — not in your access plan');
    expect(main()).toHaveTextContent('Fin-Tube BundleNot in your access plan');
    expect(screen.queryByRole('checkbox', { name: /Fin-Tube Bundle/ })).toBeNull();
    // Formats are never chosen here (LD-1).
    expect(screen.queryByRole('checkbox', { name: /^(WEB|VR)$/ })).toBeNull();

    // f10: Continue with nothing ticked — the drawn summary takes focus; nothing moves.
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveTextContent('Check this step');
    expect(
      within(summary).getByRole('link', { name: 'Choose at least one experiment' }),
    ).toBeVisible();
    await waitFor(() => expect(summary).toHaveFocus());
    expect(moves).toEqual([]);

    await user.click(screen.getByRole('checkbox', { name: /Shell-and-Tube Heat Exchanger/ }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(
      within(screen.getByRole('complementary', { name: 'Your selection' })).getByText(
        'Shell-and-Tube Heat Exchanger',
      ),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(moves).toEqual([`push ${GIVE}?step=students`]);
    const students = await heading('Choose students');
    await waitFor(() => expect(students).toHaveFocus());
    expect(main().querySelector('.xr-overline')).toHaveTextContent('Step 2 of 3');

    // Step 2: Sneha is inactive and can't be ticked (f9); Rahul is.
    const sneha = screen.getByRole('checkbox', { name: /Sneha Reddy/ });
    expect(sneha).toBeDisabled();
    expect(sneha.closest('.xw-pick-row')).toHaveTextContent('Inactive — can’t be given access');
    expect(
      screen.getByRole('checkbox', { name: /Rahul Verma/ }).closest('label'),
    ).toHaveTextContent('GIT-2026-0418 · ME ZG523 — Sem II');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Choose at least one student, or switch to a group',
    );
    await user.type(screen.getByLabelText('Search students'), 'GIT-2026-0418');
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    await user.click(screen.getByRole('checkbox', { name: /Rahul Verma/ }));
    expect(screen.getByText('1 student selected')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(moves.at(-1)).toBe(`push ${GIVE}?step=review`);

    // Step 3: exactly what will be created — the service's preview, which writes nothing.
    expect(await heading('Review and give access')).toBeVisible();
    const before = JSON.stringify(snapshot(sample));
    const created = await screen.findByText('Rahul Verma', { selector: '.xw-result strong' });
    expect(created.closest('li')).toHaveTextContent(
      'Rahul Verma→Shell-and-Tube Heat Exchanger→Active',
    );
    expect(JSON.stringify(snapshot(sample))).toBe(before);
    expect(main()).toHaveTextContent('Inherited from ACC-0107 — not chosen here');
    expect(main()).toHaveTextContent(
      'Access plan ACC-0107 · 120 licences · Yearly, ends 7 Oct 2027',
    );
    await user.click(screen.getByRole('button', { name: 'Give access' }));

    // The result names the new grant (f3); the title takes focus.
    const done = await heading('Access given');
    await waitFor(() => expect(done).toHaveFocus());
    const result = screen.getByRole('list', { name: 'Access given' });
    expect(result).toHaveTextContent(
      'Rahul Verma→Shell-and-Tube Heat Exchanger→SACC-0310ActiveRahul sees it in My courses with WEB and VR.',
    );
    expect(screen.getByRole('link', { name: 'View Student access' })).toHaveAttribute(
      'href',
      '/institute/student-access',
    );
    expect(screen.queryByRole('list', { name: 'Give students access' })).toBeNull();

    // IA-04 lists it.
    view.unmount();
    showStudentAccess(runtime);
    await waitFor(() => expect(rowsOf()).toHaveLength(1));
    expect(within(rowOf('Rahul Verma', 'SACC-0310')).getByText('Active')).toBeVisible();

    // The Student's own session answers the experiment (B2-13 f0 → B2-10).
    const home = ok(await rahul.studentAccess.getMyHome());
    expect(home.noAccessYet).toBe(false);
    expect(home.myCourses).toMatchObject([
      { courseId: 'thermodynamics-heat-transfer', experimentsGiven: 1 },
    ]);
    const course = ok(
      await rahul.studentAccess.getMyCourse(unsafeBrand('thermodynamics-heat-transfer')),
    );
    expect(course.experiments.map((row) => row.name)).toEqual(['Shell-and-Tube Heat Exchanger']);
  });

  it('“Give more access” starts again at step 1 with nothing chosen', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const { moves } = showGiveAccess(runtime, `?student=${RAHUL}&experiment=${SHELL}&step=review`);
    expect(await heading('Review and give access')).toBeVisible();
    await screen.findByText('Rahul Verma', { selector: '.xw-result strong' });
    expect(main()).toHaveTextContent(
      'Giving access to Rahul Verma — chosen from their student record.',
    );
    await user.click(screen.getByRole('button', { name: 'Give access' }));
    await heading('Access given');
    await user.click(screen.getByRole('button', { name: 'Give more access' }));
    expect(await heading('Choose experiments')).toBeVisible();
    expect(moves.at(-1)).toBe(`push ${GIVE}?step=experiments`);
    expect(screen.getByRole('checkbox', { name: /Shell-and-Tube/ })).not.toBeChecked();
    expect(screen.queryByText(/chosen from their student record/)).toBeNull();
  });
});

describe('IA-05 — pre-filled, already given, groups and waits (B2-05 f4, f5, f9, f11, f13)', () => {
  it('from the student record (f13): the notice, and Rahul is chosen', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    showGiveAccess(runtime, `?student=${RAHUL}`);
    expect(await heading('Choose experiments')).toBeVisible();
    await screen.findByRole('checkbox', { name: /Shell-and-Tube/ });
    await waitFor(() =>
      expect(main()).toHaveTextContent(
        'Giving access to Rahul Verma — chosen from their student record.',
      ),
    );
    await user.click(screen.getByRole('checkbox', { name: /Shell-and-Tube/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await heading('Choose students')).toBeVisible();
    expect(await screen.findByRole('checkbox', { name: /Rahul Verma/ })).toBeChecked();
    expect(screen.getByText('1 student selected')).toBeVisible();
  });

  it('already has it (f9): Rahul can’t be ticked again after SACC-0310', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    showGiveAccess(runtime, `?experiment=${SHELL}&step=students`);
    expect(await heading('Choose students')).toBeVisible();
    const rahul = await screen.findByRole('checkbox', { name: /Rahul Verma/ });
    expect(rahul).toBeDisabled();
    expect(rahul.closest('.xw-pick-row')).toHaveTextContent(
      'Already has Shell-and-Tube Heat Exchanger',
    );
  });

  it('a group (f4, f5): each member stated — already has it, inactive — then SACC-0311 for the group', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    showGiveAccess(runtime, `?group=GRP-0012&experiment=${SHELL}`);
    expect(await heading('Choose experiments')).toBeVisible();
    await waitFor(() =>
      expect(main()).toHaveTextContent('Giving access to the group ME ZG523 — Sem II.'),
    );
    await user.click(await screen.findByRole('button', { name: 'Continue' }));
    expect(await heading('Choose students')).toBeVisible();
    expect(await screen.findByRole('button', { name: 'A group' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('radio', { name: /ME ZG523 — Sem II/ })).toBeChecked();
    expect(main()).toHaveTextContent(
      'Giving access to a group gives it to the group’s current members. Each member’s status is shown before you confirm.',
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await heading('Review and give access')).toBeVisible();
    await waitFor(() =>
      expect(main()).toHaveTextContent(
        'Group ME ZG523 — Sem II → Shell-and-Tube Heat Exchanger → Active',
      ),
    );
    const lines = [...document.querySelectorAll('.xw-result .xw-grow')].map(
      (line) => line.textContent,
    );
    expect(lines).toEqual([
      '5 members can open it straight away',
      'Rahul Verma already has it individually (SACC-0310). That grant isn’t changed.',
      'Sneha Reddy is inactive and can’t open experiments while inactive',
    ]);
    await user.click(screen.getByRole('button', { name: 'Give access' }));
    await heading('Access given');
    expect(screen.getByRole('list', { name: 'Access given' })).toHaveTextContent(
      'Group ME ZG523 — Sem II→Shell-and-Tube Heat Exchanger→SACC-0311ActiveRecorded for the group’s current members. Each member’s status is on the group page.',
    );
    const grants = await grantsOf(asPersonId(sample, MEERA));
    expect(grants.find((row) => row.grant.id === 'SACC-0311')?.grant.target).toEqual({
      kind: 'group',
      groupId: 'GRP-0012',
    });
  });

  it('a group with no group chosen: “Choose a group”', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    showGiveAccess(runtime, `?experiment=${SHELL}&step=students`);
    expect(await heading('Choose students')).toBeVisible();
    await user.click(await screen.findByRole('button', { name: 'A group' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose a group');
  });

  it('waiting for a licence (f11): only where the service supplies it — Arun Kumar on the later sample', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    showGiveAccess(runtime, `?student=per-0004&experiment=${SHELL}&step=review`);
    expect(await heading('Review and give access')).toBeVisible();
    const line = (await screen.findByText('Arun Kumar', { selector: '.xw-result strong' })).closest(
      'li',
    );
    expect(line).toHaveTextContent(
      'Arun Kumar→Shell-and-Tube Heat Exchanger→Waiting for a licence',
    );
    await user.click(screen.getByRole('button', { name: 'Give access' }));
    await heading('Access given');
    const result = screen.getByRole('list', { name: 'Access given' });
    expect(result).toHaveTextContent('Waiting for a licence');
    expect(result).toHaveTextContent('No licence is available for Arun on ACC-0107 right now.');
  });
});

describe('IA-05 — failure, refusals and the empty states (B2-05 f12, f14–f17)', () => {
  it('Give access fails (f12): nothing changes, the summary says so, every choice is kept; again works', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    showGiveAccess(runtime, `?student=${RAHUL}&experiment=${SHELL}&step=review`);
    await screen.findByText('Rahul Verma', { selector: '.xw-result strong' });
    const before = JSON.stringify(snapshot(sample));
    faults(sample).failNext('StudentAccessService.giveAccess');
    await user.click(screen.getByRole('button', { name: 'Give access' }));
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveTextContent('Check this step');
    expect(summary).toHaveTextContent('Access wasn’t given. Nothing was changed. Try again.');
    expect(JSON.stringify(snapshot(sample))).toBe(before);
    expect(screen.getByRole('heading', { level: 1, name: 'Review and give access' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Give access' }));
    expect(await heading('Access given')).toBeVisible();
  });

  it('no students yet (f14): Add student and Import students (IA-11 since Package 2B)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'after-flow-a');
    showGiveAccess(runtime);
    expect(await heading('Choose experiments')).toBeVisible();
    await user.click(await screen.findByRole('checkbox', { name: /Transformer Tests/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByRole('heading', { level: 3, name: 'No students yet' })).toBeVisible();
    expect(main()).toHaveTextContent(
      'Add students to People first. Adding them doesn’t give them any experiments.',
    );
    expect(screen.getByRole('link', { name: 'Add student' })).toHaveAttribute(
      'href',
      '/institute/people/add',
    );
    expect(screen.getByRole('link', { name: 'Import students' })).toHaveAttribute(
      'href',
      '/institute/people/import',
    );
  });

  it('institution paused (f15): the message page, back to Student access and Help', async () => {
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'later-sample');
    showGiveAccess(runtime);
    expect(
      await heading('You can’t give access while your institution’s access is paused'),
    ).toBeVisible();
    expect(main()).toHaveTextContent(
      'Students keep their work. You can give access again when BITS lifts the pause.',
    );
    expect(screen.getByRole('link', { name: 'Back to Student access' })).toHaveAttribute(
      'href',
      '/institute/student-access',
    );
    expect(within(main()).getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '/institute/help',
    );
  });

  it('access plan ended (f16): its id and end date; Request renewal (IA-17 since Phase 3) and Content access', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    setSampleNow(sample, unsafeBrand<IsoInstant>('2027-10-20T04:30:00.000Z'));
    showGiveAccess(runtime);
    expect(await heading('Access plan ACC-0107 has ended')).toBeVisible();
    expect(main()).toHaveTextContent(
      'It ended on 7 Oct 2027, so its experiments can’t be given to students. Ask BITS for a renewal.',
    );
    expect(screen.getByRole('link', { name: 'Content access' })).toHaveAttribute(
      'href',
      '/institute/content-access',
    );
    expect(screen.getByRole('link', { name: 'Request renewal' })).toHaveAttribute(
      'href',
      '/institute/requests',
    );
    expect(screen.getByRole('link', { name: 'Request renewal' })).toHaveClass('xr-btn--primary');
  });

  it('a step’s address without its choices goes back to the first step not complete', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const { moves } = showGiveAccess(runtime, '?step=review');
    expect(await heading('Choose experiments')).toBeVisible();
    expect(moves).toEqual([`replace ${GIVE}?step=experiments`]);
  });

  it('the options cannot be read: failed + Try again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    faults(sample).failNext('StudentAccessService.getGiveAccessOptions');
    showGiveAccess(runtime);
    expect(await screen.findByText('We couldn’t load your access plan')).toBeVisible();
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Try again' }));
    });
    expect(await screen.findByRole('checkbox', { name: /Shell-and-Tube/ })).toBeVisible();
  });
});
