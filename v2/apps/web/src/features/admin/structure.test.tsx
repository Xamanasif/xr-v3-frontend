/**
 * SA-14 Academic structure and SA-15 Area / course record in the owner-approved Super Admin
 * design (V3 Refined B, design/v3-refined-b/roles/SA-v1 `sa-views-c.js`) on the real composition
 * root and the sample world, as Arjun Mehta on `after-flow-e` (the B7 boards’ day). Every figure,
 * name and refusal is the service’s answer: a blank name or no area is caught before anything is
 * sent, a taken or unchanged name is the service’s, the move is blocked while people are filed
 * against the course (the service’s check), a dialog keeps the revision it opened with and a stale
 * one is refused calmly. A renamed, added or moved course reaches the public catalogue and the
 * Content Manager’s Course codes.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AreaId, CourseId } from '@xr/domain';
import { asPersonId, faults, visitorPorts } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import {
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { AcademicStructure } from './sa-14-structure/academic-structure';
import { AreaRecord } from './sa-15-structure-record/area-record';
import { CourseRecord } from './sa-15-structure-record/course-record';

afterEach(() => {
  forgetLastAddress();
});

const KAVYA = 'per-kavya-nair';

function inAdmin(runtime: PlatformRuntime, path: string, page: ReactNode) {
  const navigation = testNavigation(path);
  renderInTab(
    <WorkspaceLayout workspace="admin">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return navigation;
}

async function world() {
  return tabPlatform(SUPER_ADMIN, 'after-flow-e');
}

/** An element’s words, its text nodes joined by spaces (as a screen reader reads them). */
function text(element: Element | null): string {
  if (!element) return '';
  const parts: string[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    parts.push(node.textContent ?? '');
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

const main = () => screen.getByRole('main');
const region = (name: string) => screen.getByRole('region', { name });
/** The flash (`div.rk-notice--ok[role=status]`), or null. */
const flash = () => main().querySelector('.rk-notice--ok[role="status"]');
const heading = (name: string) =>
  screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
const historyWhats = () =>
  [...region('History').querySelectorAll('.rk-tl-w')].map((node) => text(node));
const rowsOf = (element: HTMLElement) =>
  [...element.querySelectorAll('a.sa-list-row')].map((row) => text(row));
const dlOf = (name: string) => {
  const dl = region(name).querySelector('dl')!;
  const flat = (node: Element | null) => (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
  return [...dl.querySelectorAll('dt')].map((dt) => [flat(dt), flat(dt.nextElementSibling)]);
};
/** The course page’s panel (`aside.rk-aside`, named by its heading). */
const panel = () => screen.getByRole('complementary', { name: 'Change this course' });
/** No REQ-, ACC-, UPD-, DTR-, SUP- or SUB- reference in text or accessible names (owner rule). */
function expectNoInternalReferences(root: Element) {
  const named = [...root.querySelectorAll('[aria-label]')].map((node) =>
    node.getAttribute('aria-label'),
  );
  for (const words of [root.textContent ?? '', ...named]) {
    expect(words).not.toMatch(/\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d/);
  }
}

async function courseOf(runtime: PlatformRuntime, id: string) {
  const answer = await runtime.ports.academicStructure.getCourse(id as CourseId);
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

// ---- SA-14 Academic structure ------------------------------------------------------------------

describe('SA-14 Academic structure — as the export draws it (`V.structure`)', () => {
  it('the head, the three areas in order, each course with its code or none yet, the foot', async () => {
    const { runtime } = await world();
    inAdmin(runtime, '/admin/structure', <AcademicStructure />);
    const title = await heading('Academic structure');
    expect(title).toHaveClass('rb-h1');
    expect(title).toHaveAttribute('tabindex', '-1');
    await waitFor(() => expect(main().querySelectorAll('section.rk-course')).toHaveLength(3));
    expect(text(main().querySelector('.rk-head .rk-sub'))).toBe(
      'Engineering areas and the courses in them. Platform course codes are maintained by the Content Manager and shown read-only here.',
    );
    expect(text(main().querySelector('.rk-head .rb-eyebrow-date'))).toMatch(
      /^\w+day \d+ \w+ 2026$/,
    );
    const actions = main().querySelector('.rk-head-act')!;
    expect([...actions.querySelectorAll('button')].map((button) => text(button))).toEqual([
      'Add area',
      'Add course',
    ]);
    expect(actions.querySelector('.rb-btn--navy')).toHaveTextContent('Add course');
    expect(main().querySelector('section.rk-surface')).toBe(
      screen.getByRole('region', { name: 'Engineering areas and courses' }),
    );
    const areas = [...main().querySelectorAll('section.rk-course')];
    expect(areas.map((area) => text(area.querySelector('.rk-course-h')))).toEqual([
      'Mechanical & Manufacturing Heat transfer, thermodynamics and manufacturing processes. Open area',
      'Electrical & Electronics Electrical machines, transformers and power electronics. Open area',
      'Chemical & Process Distillation, process control and flow measurement. Open area',
    ]);
    const mechanical = region('Mechanical & Manufacturing');
    expect(rowsOf(mechanical)).toEqual([
      'Thermodynamics & Heat Transfer ME ZG523 4 published experiments',
      'Manufacturing Processes MEL ZG512 2 published experiments',
      'Fluid Mechanics No platform code yet 0 published experiments',
    ]);
    expect(mechanical.querySelector('.sa-list-d .rk-code')).toHaveTextContent('ME ZG523');
    expect(mechanical.querySelector('.sa-list-d .rk-tag-warn')).toHaveTextContent(
      'No platform code yet',
    );
    expect(
      within(mechanical).getByRole('link', { name: 'Open area Mechanical & Manufacturing' }),
    ).toHaveAttribute('href', '/admin/structure/areas/mechanical-manufacturing');
    expect(within(mechanical).getByRole('link', { name: /^Fluid Mechanics/ })).toHaveAttribute(
      'href',
      '/admin/structure/courses/fluid-mechanics',
    );
    expect(text(main().querySelector('p.rk-ca-foot'))).toBe(
      'Areas group courses; there is no module layer. Retiring an area or course is not available.',
    );
    // No Module level, no Retire, no artwork upload, no editing a platform code.
    expect(main()).not.toHaveTextContent(/Module|Retire |Upload|artwork upload/);
    expect(main().querySelectorAll('input, textarea, select')).toHaveLength(0);
    expect(document.querySelector('aside.rb-rail a[aria-current="page"]')).toHaveAttribute(
      'href',
      '/admin/structure',
    );
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expectNoInternalReferences(main());
  });

  it('loading is announced; a failed read says so and Try again reads it', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    faults(sample).failNext('AcademicStructureService.getStructure');
    inAdmin(runtime, '/admin/structure', <AcademicStructure />);
    const failed = await screen.findByText('We couldn’t load the academic structure');
    expect(failed.closest('.rk-state')).toHaveAttribute('role', 'alert');
    expect(main()).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('region', { name: 'Chemical & Process' })).toBeVisible();
  });
});

describe('SA-14 — Add course and Add area (`SA.DLG.course`, `SA.DLG.area`)', () => {
  it('both errors at once and nothing sent; added with no platform code, for the Content Manager to code', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    inAdmin(runtime, '/admin/structure', <AcademicStructure />);
    await screen.findByRole('region', { name: 'Chemical & Process' });
    const version = sample.worldVersion();
    await user.click(screen.getByRole('button', { name: 'Add course' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a course' });
    expect(dialog).toHaveAccessibleDescription(
      'The platform course code is added by the Content Manager in Course codes.',
    );
    const name = within(dialog).getByRole('textbox', { name: 'Course name' });
    expect(name).toHaveFocus();
    const area = within(dialog).getByRole('combobox', { name: 'Engineering area' });
    expect(
      within(area)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual([
      'Choose an area',
      'Mechanical & Manufacturing',
      'Electrical & Electronics',
      'Chemical & Process',
    ]);
    expect(within(dialog).getByRole('textbox', { name: 'Description (optional)' })).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Add course' }));
    expect(dialog).toHaveTextContent('Enter the course name');
    expect(dialog).toHaveTextContent('Choose the engineering area it belongs to');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(area).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(name).toHaveFocus());
    expect(sample.worldVersion()).toBe(version);
    // Only the area missing: focus goes to it.
    await user.type(name, 'Mass Transfer');
    expect(dialog).not.toHaveTextContent('Enter the course name');
    await user.click(within(dialog).getByRole('button', { name: 'Add course' }));
    await waitFor(() => expect(area).toHaveFocus());
    await user.selectOptions(area, 'chemical-process');
    expect(dialog).not.toHaveTextContent('Choose the engineering area it belongs to');
    await user.click(within(dialog).getByRole('button', { name: 'Add course' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(flash()).not.toBeNull());
    expect(text(flash())).toBe(
      'Mass Transfer was added. The Content Manager adds its platform course code.',
    );
    await waitFor(() => expect(flash()).toHaveFocus());
    await waitFor(() =>
      expect(rowsOf(region('Chemical & Process'))).toEqual([
        'Process Instrumentation & Control CHE ZG513 3 published experiments',
        'Mass Transfer No platform code yet 0 published experiments',
      ]),
    );
    // The Content Manager’s Course codes list it, with no code yet (M-2: hers to add).
    const codes = await asPersonId(sample, KAVYA).platformCourseCodes.list();
    if (!codes.ok) throw new Error(codes.error.kind);
    const added = codes.value.find((row) => row.course.name === 'Mass Transfer');
    expect(added).toMatchObject({ areaName: 'Chemical & Process', publishedExperiments: 0 });
    expect(added?.course.platformCode).toBeNull();
    // The public explorer is unchanged: no published experiments (OD-B7-13).
    const chemical = await visitorPorts(sample).catalogue.getArea('chemical-process' as AreaId);
    if (!chemical.ok) throw new Error(chemical.error.kind);
    expect(chemical.value.courses.map((course) => course.name)).toEqual([
      'Process Instrumentation & Control',
    ]);
  });

  it('a taken area name is the service’s answer under the field; a new area shows with no courses', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    inAdmin(runtime, '/admin/structure', <AcademicStructure />);
    await screen.findByRole('region', { name: 'Chemical & Process' });
    const version = sample.worldVersion();
    await user.click(screen.getByRole('button', { name: 'Add area' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add an engineering area' });
    expect(dialog).toHaveAccessibleDescription(
      'It appears in the public area explorer and the catalogue once it has courses. No artwork is added here.',
    );
    expect(within(dialog).getByRole('textbox', { name: 'Description (optional)' })).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Add area' }));
    expect(dialog).toHaveTextContent('Enter the area name');
    const name = within(dialog).getByRole('textbox', { name: 'Area name' });
    await user.type(name, ' chemical & process ');
    await user.click(within(dialog).getByRole('button', { name: 'Add area' }));
    expect(
      await within(dialog).findByText('There is already an area called chemical & process'),
    ).toBeVisible();
    await waitFor(() => expect(name).toHaveFocus());
    expect(sample.worldVersion()).toBe(version);
    await user.clear(name);
    await user.type(name, 'Civil & Structural');
    await user.click(within(dialog).getByRole('button', { name: 'Add area' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(flash()).not.toBeNull());
    expect(text(flash())).toBe(
      'Civil & Structural was added. Add courses to it to start using it.',
    );
    await waitFor(() => expect(flash()).toHaveFocus());
    const civil = await screen.findByRole('region', { name: 'Civil & Structural' });
    expect(text(civil)).toBe(
      'Civil & Structural No description yet. Open area No courses yet. Add one to start using this area.',
    );
    // Not in the public explorer until it has published experiments (OD-B7-13).
    const areas = await visitorPorts(sample).catalogue.listAreas();
    if (!areas.ok) throw new Error(areas.error.kind);
    expect(areas.value.map((area) => area.name)).not.toContain('Civil & Structural');
  });

  it('Cancel and Esc write nothing; focus returns to the button that opened the dialog', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    inAdmin(runtime, '/admin/structure', <AcademicStructure />);
    await screen.findByRole('region', { name: 'Chemical & Process' });
    const version = sample.worldVersion();
    const addArea = screen.getByRole('button', { name: 'Add area' });
    await user.click(addArea);
    await user.type(screen.getByRole('textbox', { name: 'Area name' }), 'Mining');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(addArea).toHaveFocus();
    const addCourse = screen.getByRole('button', { name: 'Add course' });
    await user.click(addCourse);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(addCourse).toHaveFocus();
    expect(sample.worldVersion()).toBe(version);
  });

  it('Add course failing for now keeps the dialog and what was chosen', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    inAdmin(runtime, '/admin/structure', <AcademicStructure />);
    await screen.findByRole('region', { name: 'Chemical & Process' });
    faults(sample).failNext('AcademicStructureService.addCourse');
    await user.click(screen.getByRole('button', { name: 'Add course' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a course' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Course name' }), 'Heat Engines');
    const area = within(dialog).getByRole('combobox', { name: 'Engineering area' });
    await user.selectOptions(area, 'mechanical-manufacturing');
    await user.click(within(dialog).getByRole('button', { name: 'Add course' }));
    expect(
      await within(dialog).findByText('It wasn’t added. Nothing was lost — try again.'),
    ).toBeVisible();
    expect(area).toHaveValue('mechanical-manufacturing');
    await user.click(within(dialog).getByRole('button', { name: 'Add course' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(flash()).toHaveTextContent('Heat Engines was added.'));
  });
});

// ---- SA-15 Course record -----------------------------------------------------------------------

describe('SA-15 Course record — as the export draws it (`V.course`)', () => {
  it('Process Instrumentation & Control: crumbs, head, the record, what uses it, history, the panel', async () => {
    const { runtime } = await world();
    inAdmin(
      runtime,
      '/admin/structure/courses/process-instrumentation-control',
      <CourseRecord courseId="process-instrumentation-control" />,
    );
    const title = await heading('Process Instrumentation & Control');
    expect(title).toHaveClass('rk-title');
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(
      within(crumbs)
        .getAllByRole('link')
        .map((link) => [text(link), link.getAttribute('href')]),
    ).toEqual([
      ['Academic structure', '/admin/structure'],
      ['Chemical & Process', '/admin/structure/areas/chemical-process'],
    ]);
    expect(crumbs.querySelector('[aria-current="page"]')).toHaveTextContent(
      'Process Instrumentation & Control',
    );
    expect(text(main().querySelector('.rk-head .rk-eyebrow'))).toBe('Course · Chemical & Process');
    expect(text(main().querySelector('.rk-head .rk-meta'))).toBe(
      'CHE ZG513 Platform course code, maintained by the Content Manager',
    );
    expect(main().querySelector('.rk-head a.rk-goto')).toHaveAttribute(
      'href',
      '#structure-course-panel',
    );
    expect(dlOf('Course')).toEqual([
      ['Course', 'Process Instrumentation & Control'],
      ['Engineering area', 'Chemical & Process'],
      [
        'Description',
        'Column, loop and metering experiments under realistic process lag and uncertainty.',
      ],
      ['Platform course code', 'CHE ZG513 Read-only here'],
    ]);
    expect(
      within(region('Course')).getByRole('link', { name: 'Chemical & Process' }),
    ).toHaveAttribute('href', '/admin/structure/areas/chemical-process');
    expect(dlOf('What uses this course')).toEqual([
      ['Published experiments', '3'],
      ['Institutions', 'BITS Pilani — Hyderabad Campus, Malnad College of Engineering (ended)'],
      ['Vendors in scope', 'Ritu Sharma'],
      ['People filed against it', 'Nobody'],
    ]);
    const uses = region('What uses this course');
    expect(
      within(uses)
        .getAllByRole('link')
        .map((link) => [text(link), link.getAttribute('href')]),
    ).toEqual([
      ['BITS Pilani — Hyderabad Campus', expect.stringMatching(/^\/admin\/institutions\/[\w-]+$/)],
      ['Malnad College of Engineering', expect.stringMatching(/^\/admin\/institutions\/[\w-]+$/)],
      ['Ritu Sharma', '/admin/roles/role-ritu-sharma'],
    ]);
    expect(historyWhats()).toEqual([
      'Platform code CHE ZG513 set by the Content Manager',
      'Course added by Arjun Mehta',
    ]);
    expect([...region('History').querySelectorAll('.rk-tl-t')].map((node) => text(node))).toEqual([
      '2 Jun 2026',
      '2 Jun 2026',
    ]);
    expect(region('History').querySelector('.rk-tl-n')).toBeNull();
    expect(region('History').querySelector('li.is-latest')).toHaveTextContent(
      'Platform code CHE ZG513',
    );
    // The panel: Rename, Edit description; nobody filed, so the move is offered.
    expect(panel()).toHaveAttribute('id', 'structure-course-panel');
    expect(
      within(panel())
        .getAllByRole('button')
        .map((button) => text(button)),
    ).toEqual(['Rename', 'Edit description', 'Move to another area']);
    expect(panel()).toHaveTextContent(
      'Nobody is filed against it. Its experiments and the access plans that use it move with it.',
    );
    expect(panel()).toHaveTextContent(
      'The platform course code is maintained by the Content Manager. Retiring a course is not available.',
    );
    expect(main()).not.toHaveTextContent(/Retire |Module|Sample/);
    expectNoInternalReferences(main());
  });

  it('Fluid Mechanics: no platform code yet, nothing uses it, added by the Super Admin', async () => {
    const { runtime } = await world();
    inAdmin(
      runtime,
      '/admin/structure/courses/fluid-mechanics',
      <CourseRecord courseId="fluid-mechanics" />,
    );
    await heading('Fluid Mechanics');
    expect(text(main().querySelector('.rk-head .rk-meta'))).toBe(
      'No platform code yet The Content Manager adds it in Course codes',
    );
    expect(main().querySelector('.rk-head .rk-meta .rk-tag-warn')).not.toBeNull();
    expect(dlOf('Course')[3]).toEqual(['Platform course code', 'No platform code yet']);
    expect(dlOf('What uses this course').map(([, value]) => value)).toEqual([
      'None yet',
      'None',
      'None',
      'Nobody',
    ]);
    expect(text(region('History').querySelector('li'))).toBe(
      'Course added by Arjun Mehta 24 Aug 2026 Mechanical & Manufacturing · no platform code yet.',
    );
  });

  it('an address that names no course is the GL-04 “This page isn’t available” in the shell', async () => {
    const { runtime } = await world();
    inAdmin(runtime, '/admin/structure/courses/zz-none', <CourseRecord courseId="zz-none" />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'This page isn’t available' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to Overview' })).toHaveAttribute(
      'href',
      '/admin',
    );
  });
});

describe('SA-15 — Move to another area (`SA.DLG.course` move)', () => {
  it('blocked while people are filed: who, nothing moves, no move offered; nothing written', async () => {
    const { runtime, sample } = await world();
    inAdmin(
      runtime,
      '/admin/structure/courses/thermodynamics-heat-transfer',
      <CourseRecord courseId="thermodynamics-heat-transfer" />,
    );
    await heading('Thermodynamics & Heat Transfer');
    const version = sample.worldVersion();
    expect(dlOf('What uses this course')).toEqual([
      ['Published experiments', '4'],
      ['Institutions', 'Godavari Institute of Technology (MEC-523)'],
      ['Vendors in scope', 'Anil Shetty'],
      [
        'People filed against it',
        '12 students · Dr S. Ranganathan — Godavari Institute of Technology',
      ],
    ]);
    const notice = panel().querySelector('.rk-notice')!;
    expect(notice).toHaveClass('rk-notice--off');
    expect(notice).toHaveAttribute('role', 'status');
    expect(text(notice)).toBe(
      'This course can’t be moved People are filed against it: 12 students · Dr S. Ranganathan — Godavari Institute of Technology. Nothing moves.',
    );
    expect(text(notice.closest('.sa-act')!.querySelector('.sa-act-k'))).toBe(
      'Move to another area',
    );
    expect(within(panel()).queryByRole('button', { name: 'Move to another area' })).toBeNull();
    expect(
      within(panel())
        .getAllByRole('button')
        .map((button) => text(button)),
    ).toEqual(['Rename', 'Edit description']);
    expect(sample.worldVersion()).toBe(version);
  });

  it('allowed: every other area; an area is required; moved, it shows under its new area', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    inAdmin(
      runtime,
      '/admin/structure/courses/manufacturing-processes',
      <CourseRecord courseId="manufacturing-processes" />,
    );
    await heading('Manufacturing Processes');
    expect(panel().querySelector('.rk-notice')).toBeNull();
    const version = sample.worldVersion();
    const move = within(panel()).getByRole('button', { name: 'Move to another area' });
    await user.click(move);
    const dialog = await screen.findByRole('dialog', {
      name: 'Move Manufacturing Processes to another area?',
    });
    expect(dialog).toHaveAccessibleDescription(
      'Its published experiments and any access plans that use it move with it. Nobody is filed against it.',
    );
    const to = within(dialog).getByRole('combobox', { name: 'Move to' });
    expect(to).toHaveFocus();
    expect(
      within(to)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Choose an area', 'Electrical & Electronics', 'Chemical & Process']);
    await user.click(within(dialog).getByRole('button', { name: 'Move course' }));
    expect(dialog).toHaveTextContent('Choose the area to move it to');
    expect(to).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(to).toHaveFocus());
    expect(sample.worldVersion()).toBe(version);
    await user.selectOptions(to, 'electrical-electronics');
    expect(dialog).not.toHaveTextContent('Choose the area to move it to');
    await user.click(within(dialog).getByRole('button', { name: 'Move course' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() =>
      expect(text(flash())).toBe('The course moved to Electrical & Electronics.'),
    );
    await waitFor(() => expect(flash()).toHaveFocus());
    await waitFor(() =>
      expect(text(main().querySelector('.rk-head .rk-eyebrow'))).toBe(
        'Course · Electrical & Electronics',
      ),
    );
    expect(historyWhats()[0]).toBe('Moved by Arjun Mehta');
    // B7-07 `doMove`: the note names both areas, from the entry's two area references.
    expect(text(region('History').querySelector('.rk-tl-n'))).toBe(
      'From Mechanical & Manufacturing to Electrical & Electronics.',
    );
    expect((await courseOf(runtime, 'manufacturing-processes')).course.areaId).toBe(
      'electrical-electronics',
    );
    // Its published experiments go with it: the public area page lists it under the new area.
    const visitor = visitorPorts(sample);
    const electrical = await visitor.catalogue.getArea('electrical-electronics' as AreaId);
    if (!electrical.ok) throw new Error(electrical.error.kind);
    expect(electrical.value.courses.map((course) => course.name)).toContain(
      'Manufacturing Processes',
    );
    const mechanical = await visitor.catalogue.getArea('mechanical-manufacturing' as AreaId);
    if (!mechanical.ok) throw new Error(mechanical.error.kind);
    expect(mechanical.value.courses.map((course) => course.name)).not.toContain(
      'Manufacturing Processes',
    );
  });

  it('Cancel writes nothing and returns focus to “Move to another area”', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    inAdmin(
      runtime,
      '/admin/structure/courses/manufacturing-processes',
      <CourseRecord courseId="manufacturing-processes" />,
    );
    await heading('Manufacturing Processes');
    const version = sample.worldVersion();
    const move = within(panel()).getByRole('button', { name: 'Move to another area' });
    await user.click(move);
    const dialog = await screen.findByRole('dialog');
    await user.selectOptions(within(dialog).getByRole('combobox'), 'chemical-process');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(move).toHaveFocus();
    expect(sample.worldVersion()).toBe(version);
  });
});

describe('SA-15 — refused calmly: changed meanwhile, failed for now', () => {
  it('a move keeps the revision the dialog opened with: changed meanwhile, it is refused and the choice stays', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    inAdmin(
      runtime,
      '/admin/structure/courses/manufacturing-processes',
      <CourseRecord courseId="manufacturing-processes" />,
    );
    await heading('Manufacturing Processes');
    await user.click(within(panel()).getByRole('button', { name: 'Move to another area' }));
    const dialog = await screen.findByRole('dialog');
    const to = within(dialog).getByRole('combobox', { name: 'Move to' });
    await user.selectOptions(to, 'chemical-process');
    // Meanwhile another session edits the course’s description.
    const before = await courseOf(runtime, 'manufacturing-processes');
    const elsewhere = await asPersonId(sample, SUPER_ADMIN).academicStructure.editDescription({
      kind: 'course',
      id: before.course.id,
      description: 'Machining and casting experiments.',
      expectedRev: before.course.rev,
    });
    if (!elsewhere.ok) throw new Error(elsewhere.error.kind);
    const version = sample.worldVersion();
    await user.click(within(dialog).getByRole('button', { name: 'Move course' }));
    expect(
      await within(dialog).findByText('This course changed since you opened it'),
    ).toBeVisible();
    expect(dialog).toHaveTextContent('It has been read again. Check it, then try again.');
    expect(sample.worldVersion()).toBe(version);
    expect(to).toHaveValue('chemical-process');
    await user.click(within(dialog).getByRole('button', { name: 'Move course' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(text(flash())).toBe('The course moved to Chemical & Process.'));
  });

  it('a rename that fails for now says nothing was lost, and keeps what was typed', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    inAdmin(
      runtime,
      '/admin/structure/courses/fluid-mechanics',
      <CourseRecord courseId="fluid-mechanics" />,
    );
    await heading('Fluid Mechanics');
    faults(sample).failNext('AcademicStructureService.rename');
    await user.click(within(panel()).getByRole('button', { name: 'Rename' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rename Fluid Mechanics' });
    const name = within(dialog).getByRole('textbox', { name: 'Course name' });
    await user.clear(name);
    await user.type(name, 'Fluid Mechanics & Flow Measurement');
    await user.click(within(dialog).getByRole('button', { name: 'Save name' }));
    expect(
      await within(dialog).findByText('It wasn’t saved. Nothing was lost — try again.'),
    ).toBeVisible();
    expect(name).toHaveValue('Fluid Mechanics & Flow Measurement');
    await user.click(within(dialog).getByRole('button', { name: 'Save name' }));
    expect(await heading('Fluid Mechanics & Flow Measurement')).toBeVisible();
  });
});

describe('SA-15 — Rename and Edit description (`SA.DLG.course` rename, desc)', () => {
  it('the same name and a taken one are the service’s answers; a blank one is caught; renamed, the public pages follow', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    inAdmin(
      runtime,
      '/admin/structure/courses/thermodynamics-heat-transfer',
      <CourseRecord courseId="thermodynamics-heat-transfer" />,
    );
    await heading('Thermodynamics & Heat Transfer');
    const version = sample.worldVersion();
    await user.click(within(panel()).getByRole('button', { name: 'Rename' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Rename Thermodynamics & Heat Transfer',
    });
    expect(dialog).toHaveAccessibleDescription(
      'The new name shows in the public catalogue, vendor course lists and student-import matching. The platform course code doesn’t change.',
    );
    const name = within(dialog).getByRole('textbox', { name: 'Course name' });
    expect(name).toHaveValue('Thermodynamics & Heat Transfer');
    expect(name).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Save name' }));
    expect(
      await within(dialog).findByText('Enter a different name — this is the current one'),
    ).toBeVisible();
    await waitFor(() => expect(name).toHaveFocus());
    expect(name).toHaveAttribute('aria-invalid', 'true');
    await user.clear(name);
    await user.click(within(dialog).getByRole('button', { name: 'Save name' }));
    expect(dialog).toHaveTextContent('Enter a name');
    await user.type(name, 'electrical machines');
    await user.click(within(dialog).getByRole('button', { name: 'Save name' }));
    expect(
      await within(dialog).findByText('There is already a course called electrical machines'),
    ).toBeVisible();
    expect(sample.worldVersion()).toBe(version);
    await user.clear(name);
    await user.type(name, 'Heat Transfer & Thermodynamics');
    await user.click(within(dialog).getByRole('button', { name: 'Save name' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(await heading('Heat Transfer & Thermodynamics')).toBeVisible();
    await waitFor(() =>
      expect(text(flash())).toBe('The course is now called Heat Transfer & Thermodynamics.'),
    );
    await waitFor(() => expect(flash()).toHaveFocus());
    expect(text(region('History').querySelector('li'))).toMatch(
      /^Renamed by Arjun Mehta \d+ \w+ 2026 Was “Thermodynamics & Heat Transfer”\.$/,
    );
    // The public course page and the Content Manager’s Course codes read the new name.
    const course = await visitorPorts(sample).catalogue.getCourse(
      'thermodynamics-heat-transfer' as CourseId,
    );
    if (!course.ok) throw new Error(course.error.kind);
    expect(course.value.course.name).toBe('Heat Transfer & Thermodynamics');
    expect(course.value.course.platformCode).toBe('ME ZG523');
    const codes = await asPersonId(sample, KAVYA).platformCourseCodes.list();
    if (!codes.ok) throw new Error(codes.error.kind);
    expect(codes.value.map((row) => row.course.name)).toContain('Heat Transfer & Thermodynamics');
  });

  it('a dialog keeps the revision it opened with: changed meanwhile, it is refused calmly and kept open', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    inAdmin(
      runtime,
      '/admin/structure/courses/power-electronics',
      <CourseRecord courseId="power-electronics" />,
    );
    await heading('Power Electronics');
    await user.click(within(panel()).getByRole('button', { name: 'Rename' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rename Power Electronics' });
    const name = within(dialog).getByRole('textbox', { name: 'Course name' });
    await user.clear(name);
    await user.type(name, 'Power Electronics & Drives');
    // Meanwhile another session edits the course’s description.
    const before = await courseOf(runtime, 'power-electronics');
    const elsewhere = await asPersonId(sample, SUPER_ADMIN).academicStructure.editDescription({
      kind: 'course',
      id: before.course.id,
      description: 'Converter experiments.',
      expectedRev: before.course.rev,
    });
    if (!elsewhere.ok) throw new Error(elsewhere.error.kind);
    const version = sample.worldVersion();
    await user.click(within(dialog).getByRole('button', { name: 'Save name' }));
    expect(
      await within(dialog).findByText('This course changed since you opened it'),
    ).toBeVisible();
    expect(dialog).toHaveTextContent('It has been read again. Check it, then try again.');
    expect(name).toHaveValue('Power Electronics & Drives');
    expect(sample.worldVersion()).toBe(version);
    await waitFor(() => expect(dlOf('Course')[2]![1]).toBe('Converter experiments.'));
    // The next press sends with the current revision.
    await user.click(within(dialog).getByRole('button', { name: 'Save name' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(await heading('Power Electronics & Drives')).toBeVisible();
  });

  it('Edit description: saved, the flash takes focus, the history says so', async () => {
    const user = userEvent.setup();
    const { runtime } = await world();
    inAdmin(
      runtime,
      '/admin/structure/courses/fluid-mechanics',
      <CourseRecord courseId="fluid-mechanics" />,
    );
    await heading('Fluid Mechanics');
    await user.click(within(panel()).getByRole('button', { name: 'Edit description' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Edit the description of Fluid Mechanics',
    });
    expect(dialog).toHaveAccessibleDescription('The description shows in the public catalogue.');
    const field = within(dialog).getByRole('textbox', { name: 'Description' });
    expect(field).toHaveFocus();
    expect(field).toHaveValue(
      'Flow measurement and pipe-flow experiments (course added; no experiments yet).',
    );
    await user.clear(field);
    await user.type(field, 'Pipe-flow and flow-measurement experiments.');
    await user.click(within(dialog).getByRole('button', { name: 'Save description' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(text(flash())).toBe('Description saved.'));
    await waitFor(() => expect(flash()).toHaveFocus());
    await waitFor(() =>
      expect(dlOf('Course')[2]).toEqual([
        'Description',
        'Pipe-flow and flow-measurement experiments.',
      ]),
    );
    expect(historyWhats()[0]).toBe('Description changed by Arjun Mehta');
  });
});

// ---- SA-15 Area record -------------------------------------------------------------------------

describe('SA-15 Area record (`V.area`)', () => {
  it('Chemical & Process: crumb, head, its courses, no artwork and no Retire, history', async () => {
    const { runtime } = await world();
    inAdmin(
      runtime,
      '/admin/structure/areas/chemical-process',
      <AreaRecord areaId="chemical-process" />,
    );
    await heading('Chemical & Process');
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByRole('link', { name: 'Academic structure' })).toHaveAttribute(
      'href',
      '/admin/structure',
    );
    expect(text(main().querySelector('.rk-head .rk-eyebrow'))).toBe('Engineering area');
    expect(text(main().querySelector('.rk-head .rk-sub'))).toBe(
      'Distillation, process control and flow measurement.',
    );
    expect(
      [...main().querySelectorAll('.rk-head-act > button')].map((button) => text(button)),
    ).toEqual(['Rename', 'Edit description']);
    const courses = region('Courses');
    expect(rowsOf(courses)).toEqual(['Process Instrumentation & Control CHE ZG513']);
    expect(
      within(courses).getByRole('link', { name: /^Process Instrumentation & Control/ }),
    ).toHaveAttribute('href', '/admin/structure/courses/process-instrumentation-control');
    expect(within(courses).getByRole('button', { name: 'Add course' })).toHaveClass(
      'rb-btn--ghost',
    );
    expect(text(main().querySelector('p.sa-footnote'))).toBe(
      'Areas have no artwork set here, and can’t be retired.',
    );
    expect(main()).not.toHaveTextContent('(D3)');
    expect(historyWhats()).toEqual(['Area added by Arjun Mehta']);
    expect(text(region('History').querySelector('.rk-sec-h'))).toBe('History Newest first');
    expectNoInternalReferences(main());
  });

  it('Rename: a taken name is refused under the field; renamed, the public explorer follows', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    inAdmin(
      runtime,
      '/admin/structure/areas/chemical-process',
      <AreaRecord areaId="chemical-process" />,
    );
    await heading('Chemical & Process');
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rename Chemical & Process' });
    expect(dialog).toHaveAccessibleDescription(
      'The new name shows in the public explorer and catalogue, vendor course lists and student-import matching.',
    );
    const name = within(dialog).getByRole('textbox', { name: 'Area name' });
    await user.clear(name);
    await user.type(name, 'Electrical & Electronics');
    await user.click(within(dialog).getByRole('button', { name: 'Save name' }));
    expect(
      await within(dialog).findByText('There is already an area called Electrical & Electronics'),
    ).toBeVisible();
    await user.clear(name);
    await user.type(name, 'Chemical & Process Engineering');
    await user.click(within(dialog).getByRole('button', { name: 'Save name' }));
    expect(await heading('Chemical & Process Engineering')).toBeVisible();
    await waitFor(() =>
      expect(text(flash())).toBe('The area is now called Chemical & Process Engineering.'),
    );
    expect(historyWhats()[0]).toBe('Renamed by Arjun Mehta');
    const areas = await visitorPorts(sample).catalogue.listAreas();
    if (!areas.ok) throw new Error(areas.error.kind);
    expect(areas.value.map((area) => area.name)).toContain('Chemical & Process Engineering');
  });

  it('Add course from the area: the area is chosen already; added, it is listed here', async () => {
    const user = userEvent.setup();
    const { runtime } = await world();
    inAdmin(
      runtime,
      '/admin/structure/areas/chemical-process',
      <AreaRecord areaId="chemical-process" />,
    );
    await heading('Chemical & Process');
    const add = within(region('Courses')).getByRole('button', { name: 'Add course' });
    await user.click(add);
    const dialog = await screen.findByRole('dialog', { name: 'Add a course' });
    await waitFor(() =>
      expect(within(dialog).getByRole('combobox', { name: 'Engineering area' })).toHaveValue(
        'chemical-process',
      ),
    );
    await user.type(within(dialog).getByRole('textbox', { name: 'Course name' }), 'Mass Transfer');
    await user.click(within(dialog).getByRole('button', { name: 'Add course' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() =>
      expect(text(flash())).toBe(
        'Mass Transfer was added. The Content Manager adds its platform course code.',
      ),
    );
    await waitFor(() => expect(flash()).toHaveFocus());
    await waitFor(() =>
      expect(rowsOf(region('Courses'))).toEqual([
        'Process Instrumentation & Control CHE ZG513',
        'Mass Transfer No platform code yet',
      ]),
    );
  });

  it('changed elsewhere while the page is open: the page shows it after the receipt', async () => {
    const { runtime, sample } = await world();
    inAdmin(
      runtime,
      '/admin/structure/areas/electrical-electronics',
      <AreaRecord areaId="electrical-electronics" />,
    );
    await heading('Electrical & Electronics');
    const area = await runtime.ports.academicStructure.getArea('electrical-electronics' as AreaId);
    if (!area.ok) throw new Error(area.error.kind);
    const elsewhere = await asPersonId(sample, SUPER_ADMIN).academicStructure.editDescription({
      kind: 'area',
      id: area.value.area.id,
      description: 'Machines and power electronics.',
      expectedRev: area.value.area.rev,
    });
    if (!elsewhere.ok) throw new Error(elsewhere.error.kind);
    await act(() => runtime.invalidate(elsewhere.changed));
    await waitFor(() =>
      expect(text(main().querySelector('.rk-head .rk-sub'))).toBe(
        'Machines and power electronics.',
      ),
    );
  });

  it('an address that names no area is the GL-04 “This page isn’t available” in the shell', async () => {
    const { runtime } = await world();
    inAdmin(runtime, '/admin/structure/areas/zz-none', <AreaRecord areaId="zz-none" />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'This page isn’t available' }),
    ).toBeVisible();
  });
});
