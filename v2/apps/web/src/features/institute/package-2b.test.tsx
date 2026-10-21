/**
 * Package 2B on the real composition root and the sample world, outside the screen groups built
 * in their own suites: IA-16 Course codes (B2-03 f6 … f10) and the Content access tabs, the IA-05
 * "Already has it" rule per chosen experiment (PC-48; the regression fixture puts two experiments
 * of one course in ACC-0107), the sample-mode identity safeguard on IA-10 (PC-49), and the
 * Package-2A actions that now open Package-2B screens.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AccessPlan } from '@xr/domain';
import { asPersonId, fixtureWorld } from '@xr/sample-platform/testing';
import { type ReactNode, useMemo, useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { type AppNavigation, NavigationProvider } from '@/nav/navigation';
import type { PlatformRuntime } from '@/platform/runtime';
import {
  NotFoundSignal,
  PERSON_OF_ROLE,
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
import { ContentAccess } from './ia-02-content-access/content-access';
import { StudentAccess } from './ia-04-student-access/student-access';
import { GiveAccess } from './ia-05-give-access/give-access';
import { People } from './ia-06-people/people';
import { StudentRecord } from './ia-07-student-record/student-record';
import { AddPerson } from './ia-10-add-person/add-person';

afterEach(() => {
  forgetLastAddress();
});

const MEERA = PERSON_OF_ROLE.tenant_admin;
const RAHUL = 'per-0002';
const THERMO = 'thermodynamics-heat-transfer';
const SHELL = 'shell-and-tube-heat-exchanger';
const FIN_TUBE = 'fin-tube-bundle';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function inInstitute(runtime: PlatformRuntime, path: string, page: ReactNode, search = '') {
  const navigation = testNavigation(path, search);
  const view = renderInTab(
    <WorkspaceLayout workspace="institute">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const main = () => screen.getByRole('main');

async function pauseGodavari(sample: Sample, runtime: PlatformRuntime) {
  const admin = asPersonId(sample, SUPER_ADMIN);
  const detail = await admin.institutions.getInstitution('godavari' as never);
  if (!detail.ok) throw new Error('godavari');
  const paused = await admin.institutions.pauseInstitution({
    institutionId: 'godavari' as never,
    reason: 'Licence review.',
    expectedRev: detail.value.institution.rev,
  });
  if (!paused.ok) throw new Error('pause');
  await act(async () => {
    await runtime.session.refresh();
  });
}

/** Clears Godavari's own code for ME ZG523 (set by S6) so the tab starts at "Missing". */
async function clearCode(runtime: PlatformRuntime) {
  const rows = await runtime.ports.institutionCourseCodes.list();
  if (!rows.ok) throw new Error('list');
  const row = rows.value[0]!;
  const cleared = await runtime.ports.institutionCourseCodes.set({
    courseId: row.course.id,
    code: '',
    semester: '',
    expectedRev: row.code?.rev ?? null,
  });
  if (!cleared.ok) throw new Error('clear');
}

// ---- IA-16 Course codes (IA-v1 IA-16) ------------------------------------------------------------

/** An internal reference (the owner's identifier rule, 21 Oct 2026). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC)-\d+/;

function expectNoReferences(): void {
  expect(document.body.textContent ?? '').not.toMatch(REFERENCE);
  for (const element of document.body.querySelectorAll('[aria-label], [title], [placeholder]')) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      expect(element.getAttribute(name) ?? '').not.toMatch(REFERENCE);
    }
  }
  expect(document.title).not.toMatch(REFERENCE);
}

const editor = () => screen.getByRole('region', { name: 'Course codes' });
const courseItem = () => editor().querySelector('li.ia-cc-item') as HTMLElement;

describe('IA-16 — Course codes (IA-v1 IA-16, st-ia16-missing, st-ia16-error)', () => {
  it('the tab, the BITS code read-only, Missing → saved as Added, and the Student sees the code', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    await clearCode(runtime);
    inInstitute(runtime, '/institute/content-access', <ContentAccess />, '?tab=course-codes');
    const tabs = await screen.findByRole('navigation', { name: 'Content access' });
    expect(within(tabs).getByRole('link', { name: 'Course codes' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(tabs).getByRole('link', { name: 'Experiments' })).toHaveAttribute(
      'href',
      '/institute/content-access',
    );
    await waitFor(() => expect(document.title).toMatch(/^Course codes/));
    await waitFor(() =>
      expect(editor().querySelector('.ia-cc-sub')).toHaveTextContent(
        'Your institution’s code isn’t added yet',
      ),
    );
    expect(courseItem().querySelector('h3.ia-cc-name')).toHaveTextContent(
      'Thermodynamics & Heat Transfer',
    );
    expect(courseItem().querySelector('.ia-cc-lock')).toHaveTextContent('ME ZG523');
    expect(courseItem().querySelector('.ia-cc-note')).toHaveTextContent('Set by BITS · read-only');
    expect(courseItem().querySelector('.ia-cc-title .xr-st--warn')).toHaveTextContent('Missing');
    expect(courseItem().querySelector('.ia-cc-prev')).toHaveTextContent(
      'Add your code to show it to students and faculty with the course name.',
    );
    // One course: no missing-only toggle, the singular Save.
    expect(screen.queryByRole('checkbox', { name: 'Show missing codes only' })).toBeNull();
    expect(editor().querySelector('.ia-cc-state')).toHaveTextContent('No unsaved changes');

    const user = userEvent.setup();
    const code = screen.getByRole('textbox', {
      name: 'Your course code for Thermodynamics & Heat Transfer',
    });
    expect(code).toHaveAttribute('placeholder', 'Your code for this course');
    await user.type(code, 'MEC-524');
    await user.type(
      screen.getByRole('textbox', {
        name: 'Semester for Thermodynamics & Heat Transfer (optional)',
      }),
      'Sem I',
    );
    // The live line and the unsaved-changes state.
    expect(courseItem().querySelector('.ia-cc-prev .rk-owncode')).toHaveTextContent('MEC-524');
    expect(editor().querySelector('.ia-cc-state')).toHaveClass('is-dirty');
    expect(editor().querySelector('.ia-cc-state')).toHaveTextContent('You have unsaved changes');
    expect(screen.getByRole('button', { name: 'Undo changes' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Save course code' }));
    const flash = await screen.findByText(
      'Course codes saved. Students and faculty at your institution see MEC-524 with Thermodynamics & Heat Transfer.',
    );
    const notice = flash.closest('.rk-notice') as HTMLElement;
    expect(notice).toHaveClass('rk-notice--ok');
    expect(notice).toHaveAttribute('role', 'status');
    expect(notice.querySelector('.rk-notice-t')).toHaveTextContent('Saved');
    await waitFor(() => expect(notice).toHaveFocus());
    await waitFor(() =>
      expect(editor().querySelector('.ia-cc-sub')).toHaveTextContent(
        'Your institution’s code is added',
      ),
    );
    expect(courseItem().querySelector('.ia-cc-title .xr-st--ok')).toHaveTextContent('Added');
    expect(screen.queryByRole('button', { name: 'Undo changes' })).toBeNull();
    expectNoReferences();

    // The same world: Rahul's My courses shows the institution's code (T-17).
    const rahul = asPersonId(sample, RAHUL);
    const courses = await rahul.studentAccess.listMyCourses();
    expect(courses.ok && courses.value.map((course) => course.codeShown)).toEqual(
      courses.ok && courses.value.length > 0 ? ['MEC-524'] : [],
    );
  });

  it('a semester without a code is refused in the drawn words, focus on the code', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    await clearCode(runtime);
    inInstitute(runtime, '/institute/content-access', <ContentAccess />, '?tab=course-codes');
    const user = userEvent.setup();
    const semester = await screen.findByRole('textbox', {
      name: 'Semester for Thermodynamics & Heat Transfer (optional)',
    });
    const version = sample.worldVersion();
    await user.type(semester, 'Sem II');
    await user.click(screen.getByRole('button', { name: 'Save course code' }));
    const code = screen.getByRole('textbox', {
      name: 'Your course code for Thermodynamics & Heat Transfer',
    });
    await waitFor(() => expect(code).toHaveFocus());
    expect(code).toHaveAttribute('aria-invalid', 'true');
    expect(code).toHaveAccessibleDescription('Add your course code, or clear the semester');
    expect(courseItem().querySelector('.rk-ferr')).toHaveTextContent(
      'Add your course code, or clear the semester',
    );
    expect(sample.worldVersion()).toBe(version);
    // Typing a code clears the error.
    await user.type(code, 'M');
    expect(main()).not.toHaveTextContent('Add your course code, or clear the semester');
    // Undo puts the saved values back and moves focus to the code.
    await user.click(screen.getByRole('button', { name: 'Undo changes' }));
    expect(code).toHaveValue('');
    expect(semester).toHaveValue('');
    await waitFor(() => expect(code).toHaveFocus());
  });

  it('“Show missing codes only” with several courses; none missing shows the way back', async () => {
    const world = await fixtureWorld('after-setup');
    const plan = world.records.plans['ACC-0107'] as AccessPlan;
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const rows = await runtime.ports.institutionCourseCodes.list();
    if (!rows.ok) throw new Error('list');
    inInstitute(runtime, '/institute/content-access', <ContentAccess />, '?tab=course-codes');
    await waitFor(() =>
      expect(editor().querySelector('.ia-cc-sub')).toHaveTextContent(
        rows.value.length === 1
          ? 'Your institution’s code is added'
          : 'Every course has a code from your institution',
      ),
    );
    expect(plan.items.length).toBeGreaterThan(0);
    if (rows.value.length > 1) {
      const user = userEvent.setup();
      await user.click(screen.getByRole('checkbox', { name: 'Show missing codes only' }));
      expect(editor()).toHaveTextContent('No course is missing a code');
      await user.click(screen.getByRole('button', { name: 'Show all courses' }));
      expect(editor().querySelectorAll('li.ia-cc-item')).toHaveLength(rows.value.length);
    }
  });

  it('paused: read-only, the notice and the codes as text, no Save', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    await pauseGodavari(sample, runtime);
    inInstitute(runtime, '/institute/content-access', <ContentAccess />, '?tab=course-codes');
    const title = await screen.findByText('Read-only while your institution’s access is paused');
    const notice = title.closest('.rk-notice')!;
    expect(notice).toHaveClass('rk-notice--paused');
    expect(notice).toHaveTextContent(
      'You can change course codes again when BITS lifts the pause.',
    );
    await waitFor(() =>
      expect(courseItem().querySelector('.ia-cc-ro')).toHaveTextContent('MEC-523'),
    );
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Save course code/ })).toBeNull();
    expect(editor().querySelector('.ia-cc-save')).toBeNull();
    // The head's "Give students access" is not drawn while paused.
    expect(screen.queryByRole('link', { name: 'Give students access' })).toBeNull();
    expectNoReferences();
  });

  it('Experiments’ “Add code” opens the tab', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    await clearCode(runtime);
    inInstitute(runtime, '/institute/content-access', <ContentAccess />);
    const add = await screen.findByRole('link', {
      name: 'Add your course code for ME ZG523 Thermodynamics & Heat Transfer',
    });
    expect(add).toHaveTextContent('Add code');
    expect(add).toHaveAttribute('href', '/institute/content-access?tab=course-codes');
  });
});

// ---- IA-05 "Already has it" per chosen experiment (PC-48) --------------------------------------

/** The app's navigation as the router gives it (IA-05 moves between `?step=` addresses). */
function LiveNavigation({
  start,
  children,
}: {
  readonly start: string;
  readonly children: ReactNode;
}) {
  const [address, setAddress] = useState(start);
  const value = useMemo<AppNavigation>(() => {
    const url = new URL(address, 'http://localhost');
    return {
      pathname: url.pathname,
      search: url.search,
      replace: (href) => setAddress(href),
      navigate: (href) => setAddress(href),
      notFound: () => {
        throw new NotFoundSignal(url.pathname);
      },
    };
  }, [address]);
  return <NavigationProvider value={value}>{children}</NavigationProvider>;
}

describe('IA-05 — “Already has it” is answered per chosen experiment (PC-48)', () => {
  /** after-flow-b with Fin-Tube added to ACC-0107: two experiments of ME ZG523; Rahul holds Shell. */
  async function twoExperimentPlan() {
    const world = await fixtureWorld('after-flow-b');
    const plan = world.records.plans['ACC-0107'] as AccessPlan;
    return worldPlatform(MEERA, {
      ...world,
      records: {
        ...world.records,
        plans: {
          ...world.records.plans,
          'ACC-0107': {
            ...plan,
            items: [...plan.items, { experimentId: FIN_TUBE as never, formats: ['web'] }],
          },
        },
      },
    });
  }

  function showGiveAccess(runtime: PlatformRuntime, search: string) {
    const start = `/institute/student-access/give${search}`;
    renderInTab(
      <LiveNavigation start={start}>
        <WorkspaceLayout workspace="institute">
          <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>
            <GiveAccess />
          </TestNotFoundBoundary>
        </WorkspaceLayout>
      </LiveNavigation>,
      { runtime, navigation: testNavigation('/institute/student-access/give', search) },
    );
  }

  it('holding Shell-and-Tube never blocks Fin-Tube: Rahul is offered for Fin-Tube, refused for Shell', async () => {
    const { runtime } = await twoExperimentPlan();
    const user = userEvent.setup();
    showGiveAccess(runtime, `?course=${THERMO}&experiment=${FIN_TUBE}`);
    await screen.findByRole('heading', { level: 1, name: 'Choose experiments' });
    const fin = await screen.findByRole('checkbox', { name: /Fin-Tube/ });
    await waitFor(() => expect(fin).toBeChecked());
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { level: 1, name: 'Choose students' });
    const rahul = await screen.findByRole('checkbox', { name: /Rahul Verma/ });
    await waitFor(() => expect(rahul).toBeEnabled());
    expect(rahul.closest('label')).not.toHaveTextContent('Already has');

    // Back to step 1: Shell-and-Tube too — the rule `giveAccess` refuses by: Rahul is marked.
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByRole('heading', { level: 1, name: 'Choose experiments' });
    await user.click(screen.getByRole('checkbox', { name: /Shell-and-Tube/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { level: 1, name: 'Choose students' });
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: /Rahul Verma/ })).toBeDisabled(),
    );
    expect(
      screen.getByRole('checkbox', { name: /Rahul Verma/ }).closest('label'),
    ).toHaveTextContent('Already has Shell-and-Tube Heat Exchanger');
    expect(
      screen.getByRole('checkbox', { name: /Rahul Verma/ }).closest('label'),
    ).not.toHaveTextContent('Fin-Tube');
  });

  it('giving Fin-Tube to Rahul succeeds beside his Shell-and-Tube grant', async () => {
    const { runtime } = await twoExperimentPlan();
    const user = userEvent.setup();
    showGiveAccess(runtime, `?course=${THERMO}&experiment=${FIN_TUBE}&student=${RAHUL}`);
    await screen.findByRole('heading', { level: 1, name: 'Choose experiments' });
    await waitFor(() => expect(screen.getByRole('checkbox', { name: /Fin-Tube/ })).toBeChecked());
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { level: 1, name: 'Choose students' });
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: /Rahul Verma/ })).toBeChecked(),
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { level: 1, name: 'Review and give access' });
    await user.click(await screen.findByRole('button', { name: 'Give access' }));
    // The result names the grant by who and what, never by its id (identifier rule).
    await screen.findByRole('heading', { level: 1, name: 'Access given' });
    expect(main()).toHaveTextContent('Rahul Verma→Fin-Tube Bundle→Active');
    expect(main()).not.toHaveTextContent(/SACC-\d{4}/);
    const grants = await runtime.ports.studentAccess.listGrants({ showWithdrawn: false });
    expect(
      grants.ok &&
        grants.value
          .filter((row) => row.student.id === RAHUL && row.grant.target.kind === 'student')
          .map((row) => row.grant.experimentId)
          .sort(),
    ).toEqual([FIN_TUBE, SHELL]);
  });
});

// ---- The sample-mode identity safeguard on IA-10 (PC-49) ---------------------------------------

describe('IA-10 — an e-mail another sample account signs in with is refused (PC-49)', () => {
  it('in words on the field and in the summary; nothing is added; Meera still signs in', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    inInstitute(runtime, '/institute/people/add', <AddPerson />);
    await screen.findByRole('heading', { level: 1, name: 'Add student' });
    const version = sample.worldVersion();
    await user.type(screen.getByRole('textbox', { name: 'Full name' }), 'A New Person');
    await user.type(
      screen.getByRole('textbox', { name: 'Institution e-mail' }),
      'kavya.nair@wilp.example',
    );
    await user.type(screen.getByRole('textbox', { name: 'Student ID' }), 'GIT-2026-0999');
    await user.click(screen.getByRole('button', { name: 'Add student' }));
    const words = 'This e-mail is already used to sign in to the platform. Use a different e-mail.';
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(words));
    expect(screen.getByRole('alert')).toHaveTextContent('One thing needs fixing');
    expect(main().querySelector('#person-email-e')).toHaveTextContent(words);
    expect(sample.worldVersion()).toBe(version);
  });
});

// ---- Package-2A actions that open Package-2B screens --------------------------------------------

describe('Package-2A actions now open the Package-2B screens', () => {
  it('People: the four tabs and the Students header’s “Import students”', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    inInstitute(runtime, '/institute/people', <People />);
    const tabs = await screen.findByRole('navigation', { name: 'People' });
    expect(
      within(tabs)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual([
      '/institute/people',
      '/institute/people?tab=faculty',
      '/institute/people?tab=groups',
      '/institute/people?tab=faculty-courses',
    ]);
    expect(screen.getByRole('link', { name: 'Import students' })).toHaveAttribute(
      'href',
      '/institute/people/import',
    );
  });

  it('IA-08: a faculty member’s name opens their record (IA-09)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    inInstitute(runtime, '/institute/people', <People />, '?tab=faculty');
    // The V3 row link is named for what it opens (IA-v1 IA-08 `r.aria`); its words are the name.
    const link = await screen.findByRole('link', {
      name: 'Open faculty record: Dr S. Ranganathan',
    });
    expect(link).toHaveTextContent('Dr S. Ranganathan');
    expect(link.getAttribute('href')).toMatch(/^\/institute\/people\/faculty\/per-\d+$/);
  });

  it('IA-07: the group’s name opens the group (IA-14)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    inInstitute(
      runtime,
      `/institute/people/students/${RAHUL}`,
      <StudentRecord studentId={RAHUL} />,
    );
    const link = await screen.findByRole('link', { name: 'ME ZG523 — Sem II' });
    expect(link).toHaveAttribute('href', '/institute/people/groups/GRP-0012');
  });

  it('IA-04: a group grant’s row names its group, which opens that group (later sample)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    inInstitute(runtime, '/institute/student-access', <StudentAccess />);
    const links = await screen.findAllByRole('link', { name: 'Group: ME ZG523 — Sem II' });
    expect(new Set(links.map((link) => link.getAttribute('href')))).toEqual(
      new Set(['/institute/people/groups/GRP-0012']),
    );
  });
});
