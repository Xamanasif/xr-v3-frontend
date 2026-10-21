/**
 * Phase-2 Package 2A, the Institution → Student access workflow, on the real composition root and
 * the sample world, in the owner-approved V3 design (design/v3-refined-b/roles/IA-v1): IA-04
 * Student access and IA-05 Give students access. Every row, status, standing, wait and refusal is
 * the ports' answer; the commands go out with the revision the page read and a refusal or failure
 * writes nothing. The cross-role effect is read back through the Student's own session. No page
 * names a record by its internal reference (identifier rule). Fixtures: `after-setup` (8 Oct 2026:
 * twelve students, Sneha Reddy inactive, the group ME ZG523 — Sem II, no grant), `after-flow-b`
 * (Rahul Verma's individual grant; Deccan paused), `later-sample` (the group's grant beside Rahul's
 * own — OD-B2-01 —, Nikhil's grant withdrawn, supplied waits for Arun Kumar and Fatima Begum).
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

/** Every internal record reference the Institute Admin's pages keep out of their words. */
const IA_REFERENCE = /\b(?:REQ|ACC|SACC|GRP|FMAP|UPD|DTR|SUP|SUB)-\d+/;

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
/** The grant rows on show (the experiment groups' head rows left out). */
const rowsOf = () => [...document.querySelectorAll<HTMLTableRowElement>('main tbody tr.ia-gt-row')];
const nameOf = (row: HTMLTableRowElement) => row.querySelector('td.ia-gt-who a')!.textContent;
/** The polite line that says how many rows show (`p.xr-sr[role=status]`). */
const liveLine = () => main().querySelector('section.ia-gm > p.xr-sr[role="status"]');
const segment = (name: RegExp) => screen.getByRole('button', { name });

/** The row of a student — one per student × experiment — optionally by how it was given. */
function rowOf(name: string, how?: string): HTMLTableRowElement {
  const row = rowsOf().find(
    (candidate) =>
      nameOf(candidate) === name &&
      (how === undefined || candidate.cells[1]?.textContent?.startsWith(how)),
  );
  if (!row) throw new Error(`No row for ${name}${how ? ` · ${how}` : ''}`);
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

// ---- IA-04 Student access --------------------------------------------------------------------

describe('IA-04 — the grants as the service lists them', () => {
  it('grouped by experiment, one row per student: who, how given, status in words', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    showStudentAccess(runtime);
    expect(await screen.findByRole('heading', { level: 1, name: 'Student access' })).toBeVisible();
    expect(main()).toHaveTextContent('Who can open which experiments');
    await waitFor(() => expect(rowsOf()).toHaveLength(1));
    expect(screen.getByRole('link', { name: 'Give students access' })).toHaveAttribute(
      'href',
      GIVE,
    );
    const head = main().querySelector('tr.ia-gt-grp')!;
    expect(head).toHaveTextContent('Shell-and-Tube Heat ExchangerME ZG523');
    expect(head).toHaveTextContent('1 student');
    expect(
      within(head as HTMLElement).getByRole('img', {
        name: 'Formats from your access plan: WEB, VR',
      }),
    ).toBeVisible();
    const row = rowOf('Rahul Verma');
    const cells = [...row.querySelectorAll('td')];
    expect(within(cells[0]!).getByRole('link', { name: 'Rahul Verma' })).toHaveAttribute(
      'href',
      `/institute/people/students/${RAHUL}`,
    );
    expect(cells[0]).toHaveTextContent('GIT-2026-0418');
    expect(cells[1]).toHaveTextContent('Individually9 Oct 2026');
    expect(within(cells[2]!).getByText('Active')).toBeVisible();
    expect(
      within(cells[3]!).getByRole('button', {
        name: 'Withdraw Rahul Verma’s access to Shell-and-Tube Heat Exchanger',
      }),
    ).toHaveTextContent('Withdraw…');
    expect(liveLine()).toHaveTextContent('1 row shown');
    // The status switch counts the rows on show; no Withdrawn segment without a withdrawn grant.
    expect(segment(/^Current/)).toHaveAttribute('aria-pressed', 'true');
    expect(segment(/^Current/)).toHaveTextContent('Current 1');
    expect(screen.queryByRole('button', { name: /^Withdrawn/ })).toBeNull();
    expect(main()).toHaveTextContent(
      'Group grants are changed on the group’s page. Formats come from your access plan; they are never chosen per student.',
    );
    // Nothing is counted against licences; no record is named by its id.
    expect(main()).not.toHaveTextContent(/licences? (left|used|available)/i);
    expect(main().textContent).not.toMatch(IA_REFERENCE);
  });

  it('“No student has access yet” before any grant', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    showStudentAccess(runtime);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'No student has access yet' }),
    ).toBeVisible();
    expect(main()).toHaveTextContent(
      'Use Give students access above to give students the experiments your institution holds. They see the formats in your access plan.',
    );
    expect(screen.getAllByRole('link', { name: 'Give students access' })).toHaveLength(1);
    expect(main().querySelector('.ia-gm-tools')).toBeNull();
  });

  it('loading, then failed + “Try again” reads the list again and puts focus on the title', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    faults(sample).failNext('StudentAccessService.listGrants');
    showStudentAccess(runtime);
    expect(await screen.findByText('Loading student access…')).toHaveAttribute('role', 'status');
    const failed = await screen.findByText('We couldn’t load student access');
    expect(failed.closest('[role="alert"]')).not.toBeNull();
    expect(main()).toHaveTextContent('Nothing has changed. Try again.');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Student access' })).toHaveFocus();
    await waitFor(() => expect(rowsOf()).toHaveLength(1));
  });
});

describe('IA-04 — search, How given and the status switch', () => {
  it('filters the rows on show; chips, “Showing x of y” and Clear filters follow', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    showStudentAccess(runtime);
    await waitFor(() => expect(rowsOf()).toHaveLength(9));
    // Nikhil's withdrawn grant is history, under Withdrawn.
    expect(liveLine()).toHaveTextContent('9 rows shown');
    expect(segment(/^Current/)).toHaveTextContent('Current 9');
    expect(segment(/^Withdrawn/)).toHaveTextContent('Withdrawn 1');
    expect(rowsOf().some((row) => nameOf(row) === 'Nikhil Bose')).toBe(false);

    await user.type(screen.getByLabelText('Search student access'), 'Rahul');
    expect(main()).toHaveTextContent('Showing 1 of 9');
    expect(rowsOf().map((row) => row.cells[1]!.textContent)).toEqual([
      expect.stringContaining('Also in ME ZG523 — Sem II, which has this experiment'),
    ]);
    await user.click(screen.getByRole('button', { name: 'Remove filter Search: “Rahul”' }));
    expect(screen.getByLabelText('Search student access')).toHaveFocus();

    await user.click(segment(/^Waiting for a licence/));
    expect(segment(/^Waiting for a licence/)).toHaveAttribute('aria-pressed', 'true');
    expect(rowsOf().map(nameOf)).toEqual(['Arun Kumar', 'Fatima Begum']);
    expect(liveLine()).toHaveTextContent('2 rows shown · Waiting for a licence');
    await user.selectOptions(screen.getByLabelText('How given'), 'grp');
    expect(rowsOf().map(nameOf)).toEqual(['Arun Kumar']);
    expect(main()).toHaveTextContent('Showing 1 of 2');
    expect(
      screen.getByRole('button', { name: 'Remove filter Given through a group' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(rowsOf()).toHaveLength(9);
    expect(segment(/^Current/)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Search student access')).toHaveFocus();

    await user.type(screen.getByLabelText('Search student access'), 'Ananya');
    expect(screen.getByText('No grants match these filters')).toBeVisible();
    expect(main()).toHaveTextContent('Try fewer filters or search by student ID.');
    await user.click(screen.getByRole('button', { name: 'Show all current grants' }));
    expect(rowsOf()).toHaveLength(9);
    expect(screen.getByLabelText('Search student access')).toHaveFocus();

    // A grant's id, never shown, still finds its row (HANDOFF §9).
    await user.type(screen.getByLabelText('Search student access'), 'SACC-0310');
    expect(rowsOf().map(nameOf)).toEqual(['Rahul Verma']);
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    await user.click(segment(/^Withdrawn/));
    const nikhil = rowOf('Nikhil Bose');
    expect(rowsOf()).toHaveLength(1);
    expect(nikhil).toHaveClass('is-muted');
    expect(within(nikhil).getByText('Withdrawn')).toBeVisible();
    expect(nikhil).toHaveTextContent(
      'Withdrawn 12 Oct 2026 · “Given by mistake — Nikhil is not in ME ZG523 this semester.”',
    );
    expect(within(nikhil).queryByRole('button')).toBeNull();
    expect(main().textContent).not.toMatch(IA_REFERENCE);
  });

  it('a group row and the overlap: the group (opening its page), “Also in …” — no Withdraw on a group grant', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    showStudentAccess(runtime);
    await waitFor(() => expect(rowsOf()).toHaveLength(9));
    // Rahul's own grant and the group's are one row: the group grant is "Also in …".
    expect(rowsOf().filter((row) => nameOf(row) === 'Rahul Verma')).toHaveLength(1);
    expect(rowOf('Rahul Verma').cells[1]).toHaveTextContent(
      'Individually9 Oct 2026Also in ME ZG523 — Sem II, which has this experiment',
    );
    const group = rowOf('Priya Natarajan');
    expect(group.cells[1]).toHaveTextContent('Group: ME ZG523 — Sem II12 Oct 2026');
    expect(within(group).getByRole('link', { name: 'Group: ME ZG523 — Sem II' })).toHaveAttribute(
      'href',
      '/institute/people/groups/GRP-0012',
    );
    expect(within(group).queryByRole('button')).toBeNull();
    const arun = rowOf('Arun Kumar');
    expect(within(arun).getByText('Waiting for a licence')).toBeVisible();
    expect(arun).toHaveTextContent(
      'No licence is available for Arun on your access plan right now.',
    );
    expect(within(rowOf('Sneha Reddy')).getByText('Student inactive')).toBeVisible();
  });
});

describe('IA-04 — Withdraw… (DL-2, reason required)', () => {
  it('the only grant: the reason is required, then the grant is withdrawn and moves to Withdrawn', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    showStudentAccess(runtime);
    await waitFor(() => expect(rowsOf()).toHaveLength(1));
    const trigger = screen.getByRole('button', {
      name: 'Withdraw Rahul Verma’s access to Shell-and-Tube Heat Exchanger',
    });
    await user.click(trigger);
    const dialog = await screen.findByRole('alertdialog', { name: 'Withdraw access?' });
    expect(dialog).toHaveTextContent(
      'This is Rahul Verma’s only grant for Shell-and-Tube Heat Exchanger, so Rahul will no longer be able to open it. Their work is kept, and the grant stays in the access history.',
    );
    const reason = within(dialog).getByLabelText(/^Reason/);
    await waitFor(() => expect(reason).toHaveFocus());
    expect(dialog).toHaveTextContent(
      'Kept in the access history, which your institution’s administrators can see.',
    );
    const confirm = within(dialog).getByRole('button', { name: 'Withdraw access' });
    expect(confirm).toHaveClass('ia-btn--danger');
    expect(dialog.textContent).not.toMatch(IA_REFERENCE);

    // No reason — the service's drawn error; nothing is written.
    const before = JSON.stringify(snapshot(sample));
    await user.click(confirm);
    await waitFor(() =>
      expect(within(dialog).getByText('Enter the reason for withdrawing access')).toBeVisible(),
    );
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(JSON.stringify(snapshot(sample))).toBe(before);

    // Cancel returns focus to the row's button.
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.click(trigger);
    const again = await screen.findByRole('alertdialog', { name: 'Withdraw access?' });
    await user.type(within(again).getByLabelText(/^Reason/), 'Given by mistake.');
    await user.click(within(again).getByRole('button', { name: 'Withdraw access' }));
    const flash = await screen.findByText(
      'Access withdrawn. That was Rahul Verma’s only grant for Shell-and-Tube Heat Exchanger, so Rahul can no longer open it. Their work is kept.',
    );
    await waitFor(() => expect(flash.closest('[tabindex="-1"]')).toHaveFocus());
    expect(flash.closest('[role="status"]')).toHaveTextContent('Done');
    const [grant] = await grantsOf(asPersonId(sample, MEERA));
    expect(grant!.grant).toMatchObject({
      state: 'withdrawn',
      withdrawal: { reason: 'Given by mistake.' },
    });
    // The row is history now: no current grant is left; it is under Withdrawn.
    await waitFor(() => expect(rowsOf()).toHaveLength(0));
    expect(screen.getByText('No current grants')).toBeVisible();
    expect(main()).toHaveTextContent(
      'Only withdrawn grants are left. They are listed under Withdrawn.',
    );
    await user.click(segment(/^Withdrawn/));
    expect(rowOf('Rahul Verma')).toHaveTextContent('Given by mistake.');
  });

  it('beside a group grant (later sample): only the individual grant, the group grant not changed — and no can / can’t (OD-B2-01)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'later-sample');
    showStudentAccess(runtime);
    await waitFor(() => expect(rowsOf()).toHaveLength(9));
    await user.click(
      screen.getByRole('button', {
        name: 'Withdraw Rahul Verma’s individual grant for Shell-and-Tube Heat Exchanger',
      }),
    );
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Withdraw Rahul Verma’s individual grant?',
    });
    expect(dialog).toHaveTextContent(
      'This withdraws the access you gave Rahul Verma individually on 9 Oct 2026. Their work is kept, and the grant stays in the access history.',
    );
    expect(dialog).toHaveTextContent('The group grant is not changed');
    expect(dialog).toHaveTextContent(
      'Rahul is also in ME ZG523 — Sem II, which has Shell-and-Tube Heat Exchanger through its own group grant. Withdrawing this individual grant doesn’t change the group grant.',
    );
    expect(dialog).not.toHaveTextContent(/no longer be able to open/);
    expect(dialog.textContent).not.toMatch(IA_REFERENCE);
    await user.type(within(dialog).getByLabelText(/^Reason/), 'Given individually by mistake.');
    await user.click(within(dialog).getByRole('button', { name: 'Withdraw individual grant' }));
    expect(
      await screen.findByText(
        'The individual grant for Rahul Verma was withdrawn. Rahul is still in ME ZG523 — Sem II, and its group grant is not changed.',
      ),
    ).toBeVisible();
    // The row stays — individual grant withdrawn, the group line kept; the group grant as it was.
    await waitFor(() =>
      expect(within(rowOf('Rahul Verma')).getByText('Individual grant withdrawn')).toBeVisible(),
    );
    expect(rowOf('Rahul Verma').cells[1]).toHaveTextContent(
      'Also in ME ZG523 — Sem II, which has this experiment · not changed',
    );
    expect(rowOf('Rahul Verma')).toHaveTextContent('Withdrawn');
    expect(
      (await grantsOf(asPersonId(sample, MEERA))).find(
        (row) => row.grant.id === 'SACC-0311' && row.student.id === RAHUL,
      )?.grant.state,
    ).toBe('active');
    expect(segment(/^Withdrawn/)).toHaveAttribute('aria-pressed', 'false');
    expect(segment(/^Withdrawn/)).toHaveTextContent('Withdrawn 1');
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
    const dialog = await screen.findByRole('alertdialog', { name: 'Withdraw access?' });
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

describe('IA-04 — read-only while the institution is paused', () => {
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
    expect(within(rowOf('Rahul Verma')).getByText('Active')).toBeVisible();
  });

  it('Deccan, paused with no grant: the notice and the empty state without Give access', async () => {
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'later-sample');
    showStudentAccess(runtime);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'No student has access yet' }),
    ).toBeVisible();
    expect(screen.getByText('Read-only while your institution’s access is paused')).toBeVisible();
    expect(main()).toHaveTextContent(
      'Giving access isn’t available right now. Students you give access later see the formats in your access plan.',
    );
    expect(screen.queryByRole('link', { name: 'Give students access' })).toBeNull();
  });

  it('the plan ended: the notice with Request renewal; rows read Access ended; no Give access', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    setSampleNow(sample, unsafeBrand<IsoInstant>('2027-10-20T04:30:00.000Z'));
    showStudentAccess(runtime);
    expect(await screen.findByText('Your access plan has ended')).toBeVisible();
    expect(main()).toHaveTextContent(
      'Students can’t open its experiments now. The list stays as a record of who had access.',
    );
    expect(screen.getByRole('link', { name: 'Request renewal' })).toHaveAttribute(
      'href',
      '/institute/requests',
    );
    await waitFor(() => expect(rowsOf()).toHaveLength(1));
    expect(within(rowOf('Rahul Verma')).getByText('Access ended')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Give students access' })).toBeNull();
  });
});

// ---- IA-05 Give students access ----------------------------------------------------------------

async function heading(name: string) {
  return screen.findByRole('heading', { level: 1, name });
}

const eyebrow = () => main().querySelector('.rk-eyebrow');
const steps = () =>
  within(screen.getByRole('list', { name: 'Steps' }))
    .getAllByRole('listitem')
    .map((step) => step.textContent);
/** "What will be created", line by line. */
const createdLines = () =>
  [...document.querySelectorAll('main ul.ia-lines > li')].map((line) => line.textContent);
/** The result's rows: who → what → status, the note and the link. */
const resultRows = () =>
  [...document.querySelectorAll('main li.rk-askrow')].map((row) => row.textContent);

describe('IA-05 — the primary journey', () => {
  it('Meera gives Rahul Shell-and-Tube in three steps; IA-04 lists it; Rahul’s home answers it', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const rahul = asPersonId(sample, RAHUL);
    expect(ok(await rahul.studentAccess.getMyHome())).toMatchObject({ noAccessYet: true });
    const { moves, view } = showGiveAccess(runtime);

    // Loading, then step 1.
    expect(await screen.findByText('Loading your access plan')).toHaveAttribute('role', 'status');
    expect(await heading('Choose experiments')).toBeVisible();
    await screen.findByRole('checkbox', { name: /Shell-and-Tube Heat Exchanger/ });
    expect(eyebrow()).toHaveTextContent('Step 1 of 3');
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent(
      'Student accessGive students access',
    );
    expect(steps()).toEqual(['1Experiments, current step', '2Students', '3Review and give access']);
    await waitFor(() =>
      expect(main()).toHaveTextContent('Active · 120 licences · ends 7 Oct 2027'),
    );
    expect(screen.getByLabelText('Course')).toHaveDisplayValue(
      'ME ZG523 — Thermodynamics & Heat Transfer',
    );
    expect(main()).toHaveTextContent('Available to your institution: WEBVR');
    expect(main()).toHaveTextContent('Also published in ME ZG523 — not in your access plan');
    expect(main()).toHaveTextContent('Fin-Tube BundleNot in your access plan · published as');
    expect(screen.queryByRole('checkbox', { name: /Fin-Tube Bundle/ })).toBeNull();
    // Formats are never chosen here (LD-1).
    expect(screen.queryByRole('checkbox', { name: /^(WEB|VR)$/ })).toBeNull();
    const selection = screen.getByRole('complementary', { name: 'Your selection' });
    expect(selection).toHaveTextContent('Access planYour access plan · ME ZG523');
    expect(selection).toHaveTextContent('ExperimentsNot chosen yet');

    // Continue with nothing ticked — the error summary takes focus; nothing moves.
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
    expect(within(selection).getByText('Shell-and-Tube Heat Exchanger')).toBeVisible();
    expect(selection).toHaveTextContent('FormatsWEB and VR — from your access plan');
    // Folded under the steps on narrow pages: the same facts in one line.
    expect(main().querySelector('details.ia-selsum summary')).toHaveTextContent(
      'Your selection1 experiment',
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(moves).toEqual([`push ${GIVE}?step=students`]);
    const students = await heading('Choose students');
    await waitFor(() => expect(students).toHaveFocus());
    expect(eyebrow()).toHaveTextContent('Step 2 of 3');
    expect(steps()).toEqual([
      'Experiments, done',
      '2Students, current step',
      '3Review and give access',
    ]);

    // Step 2: Sneha is inactive and can't be ticked; Rahul is.
    const sneha = screen.getByRole('checkbox', { name: /Sneha Reddy/ });
    expect(sneha).toBeDisabled();
    expect(sneha.closest('label')).toHaveTextContent('Inactive — can’t be given access');
    expect(
      screen.getByRole('checkbox', { name: /Rahul Verma/ }).closest('label'),
    ).toHaveTextContent('GIT-2026-0418 · ME ZG523 — Sem II');
    expect(screen.getByRole('button', { name: 'Students' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
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
    await screen.findByText('Rahul Verma → Shell-and-Tube Heat Exchanger → Active');
    expect(createdLines()).toEqual(['Rahul Verma → Shell-and-Tube Heat Exchanger → Active']);
    expect(JSON.stringify(snapshot(sample))).toBe(before);
    expect(main()).toHaveTextContent('Inherited from the access plan — not chosen here');
    expect(main()).toHaveTextContent(
      'Licences: Your access plan · 120 licences · Yearly, ends 7 Oct 2027',
    );
    // The selection is not repeated beside the review.
    expect(screen.getByRole('complementary', { name: 'Your selection' })).toBeEmptyDOMElement();
    await user.click(screen.getByRole('button', { name: 'Give access' }));

    // The result lists the grant (never by its id); the title takes focus.
    const done = await heading('Access given');
    await waitFor(() => expect(done).toHaveFocus());
    expect(eyebrow()).toHaveTextContent('Give students access');
    expect(resultRows()).toEqual([
      'Rahul Verma→Shell-and-Tube Heat Exchanger→ActiveRahul sees it in My courses with WEB and VR.Open Rahul Verma',
    ]);
    expect(main()).toHaveTextContent(
      'Access givenThey can open the experiment with the formats in your plan.',
    );
    expect(screen.getByRole('list', { name: 'Access given' })).toHaveTextContent(
      'Rahul Verma→Shell-and-Tube Heat Exchanger→Active',
    );
    expect(screen.getByRole('link', { name: 'Open Rahul Verma' })).toHaveAttribute(
      'href',
      `/institute/people/students/${RAHUL}`,
    );
    expect(screen.getByRole('link', { name: 'View Student access' })).toHaveAttribute(
      'href',
      '/institute/student-access',
    );
    expect(steps()).toEqual([
      'Experiments, done',
      'Students, done',
      'Review and give access, done',
    ]);
    expect(main().textContent).not.toMatch(IA_REFERENCE);

    // IA-04 lists it.
    view.unmount();
    showStudentAccess(runtime);
    await waitFor(() => expect(rowsOf()).toHaveLength(1));
    expect(within(rowOf('Rahul Verma')).getByText('Active')).toBeVisible();

    // The Student's own session answers the experiment.
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
    await screen.findByText('Rahul Verma → Shell-and-Tube Heat Exchanger → Active');
    expect(main()).toHaveTextContent(
      'Giving access to Rahul VermaChosen from their student record. You can change who in step 2.',
    );
    await user.click(screen.getByRole('button', { name: 'Give access' }));
    await heading('Access given');
    await user.click(screen.getByRole('button', { name: 'Give more access' }));
    expect(await heading('Choose experiments')).toBeVisible();
    expect(moves.at(-1)).toBe(`push ${GIVE}?step=experiments`);
    expect(screen.getByRole('checkbox', { name: /Shell-and-Tube/ })).not.toBeChecked();
    expect(screen.queryByText(/Chosen from their student record/)).toBeNull();
  });
});

describe('IA-05 — pre-filled, already given, groups and waits', () => {
  it('from the student record: the notice, and Rahul is chosen', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    showGiveAccess(runtime, `?student=${RAHUL}`);
    expect(await heading('Choose experiments')).toBeVisible();
    await screen.findByRole('checkbox', { name: /Shell-and-Tube/ });
    await waitFor(() =>
      expect(main()).toHaveTextContent(
        'Giving access to Rahul VermaChosen from their student record. You can change who in step 2.',
      ),
    );
    await user.click(screen.getByRole('checkbox', { name: /Shell-and-Tube/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await heading('Choose students')).toBeVisible();
    expect(await screen.findByRole('checkbox', { name: /Rahul Verma/ })).toBeChecked();
    expect(screen.getByText('1 student selected')).toBeVisible();
  });

  it('already has it: Rahul can’t be ticked again after his grant', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    showGiveAccess(runtime, `?experiment=${SHELL}&step=students`);
    expect(await heading('Choose students')).toBeVisible();
    const rahul = await screen.findByRole('checkbox', { name: /Rahul Verma/ });
    expect(rahul).toBeDisabled();
    expect(rahul.closest('label')).toHaveTextContent('Already has Shell-and-Tube Heat Exchanger');
  });

  it('a group: each member stated — already has it, inactive — then the group’s grant', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    showGiveAccess(runtime, `?group=GRP-0012&experiment=${SHELL}`);
    expect(await heading('Choose experiments')).toBeVisible();
    await waitFor(() =>
      expect(main()).toHaveTextContent(
        'Giving access to the group ME ZG523 — Sem IIChosen from the group page. You can change who in step 2.',
      ),
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
    expect(createdLines()).toEqual([
      '5 members can open it straight away',
      'Rahul Verma already has it individually. That grant isn’t changed.',
      'Sneha Reddy is inactive and can’t open experiments while inactive',
    ]);
    expect(main()).toHaveTextContent('GroupME ZG523 — Sem II (7 members)');
    await user.click(screen.getByRole('button', { name: 'Give access' }));
    await heading('Access given');
    expect(resultRows()).toEqual([
      'Group ME ZG523 — Sem II→Shell-and-Tube Heat Exchanger→ActiveRecorded for the group’s current members. Each member’s status is on the group page.Open the group',
    ]);
    expect(screen.getByRole('link', { name: 'Open the group' })).toHaveAttribute(
      'href',
      '/institute/people/groups/GRP-0012',
    );
    const grants = await grantsOf(asPersonId(sample, MEERA));
    expect(grants.find((row) => row.grant.id === 'SACC-0311')?.grant.target).toEqual({
      kind: 'group',
      groupId: 'GRP-0012',
    });
    expect(main().textContent).not.toMatch(IA_REFERENCE);
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

  it('waiting for a licence: only where the service supplies it — Arun Kumar on the later sample', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    showGiveAccess(runtime, `?student=per-0004&experiment=${SHELL}&step=review`);
    expect(await heading('Review and give access')).toBeVisible();
    expect(
      await screen.findByText('Arun Kumar → Shell-and-Tube Heat Exchanger → Waiting for a licence'),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Give access' }));
    await heading('Access given');
    expect(resultRows()).toEqual([
      'Arun Kumar→Shell-and-Tube Heat Exchanger→Waiting for a licenceNo licence is available for Arun on your access plan right now.Open Arun Kumar',
    ]);
    expect(main()).toHaveTextContent('Access givenEach grant and its status are listed below.');
  });
});

describe('IA-05 — failure, refusals and the empty states', () => {
  it('Give access fails: nothing changes, the summary says so, every choice is kept; again works', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    showGiveAccess(runtime, `?student=${RAHUL}&experiment=${SHELL}&step=review`);
    await screen.findByText('Rahul Verma → Shell-and-Tube Heat Exchanger → Active');
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

  it('no students yet: Add student and Import students', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'after-flow-a');
    showGiveAccess(runtime);
    expect(await heading('Choose experiments')).toBeVisible();
    await user.click(await screen.findByRole('checkbox', { name: /Transformer Tests/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'No students yet' })).toBeVisible();
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

  it('institution paused: the message in place of the flow, back to Student access and Help', async () => {
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'later-sample');
    showGiveAccess(runtime);
    const title = await heading('You can’t give access while your institution’s access is paused');
    expect(title).toBeVisible();
    const message = screen.getByRole('region', { name: title.textContent! });
    expect(message).toHaveTextContent(
      'Students keep their work. You can give access again when BITS lifts the pause.',
    );
    expect(within(message).getByRole('link', { name: 'Back to Student access' })).toHaveAttribute(
      'href',
      '/institute/student-access',
    );
    expect(within(message).getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '/institute/help',
    );
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
  });

  it('access plan ended: the end date; Request renewal and Content access', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    setSampleNow(sample, unsafeBrand<IsoInstant>('2027-10-20T04:30:00.000Z'));
    showGiveAccess(runtime);
    const title = await heading('Your access plan has ended');
    const message = screen.getByRole('region', { name: title.textContent! });
    expect(message).toHaveTextContent(
      'It ended on 7 October 2027, so its experiments can’t be given to students. Ask BITS for a renewal.',
    );
    expect(within(message).getByRole('link', { name: 'Content access' })).toHaveAttribute(
      'href',
      '/institute/content-access',
    );
    expect(within(message).getByRole('link', { name: 'Request renewal' })).toHaveAttribute(
      'href',
      '/institute/requests',
    );
    expect(within(message).getByRole('link', { name: 'Request renewal' })).toHaveClass(
      'rb-btn--navy',
    );
    expect(main().textContent).not.toMatch(IA_REFERENCE);
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
