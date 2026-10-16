/**
 * Phase 6 SA-14 Academic structure (boards B7-07 f0, f7; B7-12 f12 … f15) and SA-15 Area / course
 * record (B7-07 f1 … f6, f8; B7-10 f9) on the real composition root and the sample world, as Arjun
 * Mehta on `after-flow-e` (the B7 boards’ day). Every figure, name and refusal is the service’s
 * answer: a blank name or no area is caught before anything is sent, a taken or unchanged name is
 * the service’s, the move is blocked while people are filed against the course (the service’s
 * check), a dialog keeps the revision it opened with and a stale one is refused calmly. A renamed,
 * added or moved course reaches the public catalogue and the Content Manager’s Course codes.
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
const flash = () => main().querySelector('p.xa-save[role="status"]')!;
const heading = (name: string) =>
  screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
const historyWhats = () =>
  [...region('History').querySelectorAll('.xr-tl-what')].map((node) => text(node));
const usesOf = (name: string) => {
  const dl = region(name).querySelector('dl')!;
  return [...dl.querySelectorAll('dt')].map((dt) => [text(dt), text(dt.nextElementSibling)]);
};

async function courseOf(runtime: PlatformRuntime, id: string) {
  const answer = await runtime.ports.academicStructure.getCourse(id as CourseId);
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

// ---- SA-14 Academic structure ------------------------------------------------------------------

describe('SA-14 Academic structure — as drawn (B7-07 f0; B7-12 f12 … f15)', () => {
  it('the header line, the three areas in order, each course with its code or none yet', async () => {
    const { runtime } = await world();
    inAdmin(runtime, '/admin/structure', <AcademicStructure />);
    await heading('Academic structure');
    await waitFor(() => expect(main().querySelectorAll('section.xr-section')).toHaveLength(3));
    expect(text(main().querySelector('.xr-phead-meta'))).toBe(
      '3 engineering areas · 6 courses · feeds the public explorer, the catalogue, Vendor course lists and student-import matching',
    );
    const actions = main().querySelector('.xr-phead-actions')!;
    expect([...actions.querySelectorAll('button')].map((button) => text(button))).toEqual([
      'Add area',
      'Add course',
    ]);
    expect(actions.querySelector('.xr-btn--primary')).toHaveTextContent('Add course');
    const areas = [...main().querySelectorAll('section.xr-section')];
    expect(areas.map((area) => text(area.querySelector('.xr-section-head')))).toEqual([
      'Mechanical & Manufacturing Heat transfer, thermodynamics and manufacturing processes. 3 courses Open area',
      'Electrical & Electronics Electrical machines, transformers and power electronics. 2 courses Open area',
      'Chemical & Process Distillation, process control and flow measurement. 1 course Open area',
    ]);
    const mechanical = region('Mechanical & Manufacturing');
    expect([...mechanical.querySelectorAll('li.xr-row')].map((row) => text(row))).toEqual([
      'Thermodynamics & Heat Transfer ME ZG523 · 4 published experiments Open',
      'Manufacturing Processes MEL ZG512 · 2 published experiments Open',
      'Fluid Mechanics No platform code yet · no published experiments yet Open',
    ]);
    expect(mechanical.querySelector('.xr-row-sub .xr-id')).toHaveTextContent('ME ZG523');
    expect(
      within(mechanical).getByRole('link', { name: 'Open area Mechanical & Manufacturing' }),
    ).toHaveAttribute('href', '/admin/structure/areas/mechanical-manufacturing');
    expect(within(mechanical).getByRole('link', { name: 'Open Fluid Mechanics' })).toHaveAttribute(
      'href',
      '/admin/structure/courses/fluid-mechanics',
    );
    expect(text(main().querySelector('p.xl-open'))).toBe(
      'Platform course codes are maintained by the Content Manager and shown read-only here. Retiring an area or course is not available.',
    );
    // No Module level, no Retire, no artwork upload.
    expect(main()).not.toHaveTextContent(/Module|Retire |Upload/);
    expect(document.querySelector('.xr-top-title')).toHaveTextContent('Academic structure');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('loading is announced; a failed read says so and Try again reads it', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    faults(sample).failNext('AcademicStructureService.getStructure');
    inAdmin(runtime, '/admin/structure', <AcademicStructure />);
    expect(await screen.findByText('We couldn’t load the academic structure')).toBeVisible();
    expect(main()).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('region', { name: 'Chemical & Process' })).toBeVisible();
  });
});

describe('SA-14 — Add course (B7-07 f7) and Add area', () => {
  it('both errors at once and nothing sent; added with no platform code, for the Content Manager to code', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    inAdmin(runtime, '/admin/structure', <AcademicStructure />);
    await screen.findByRole('region', { name: 'Chemical & Process' });
    const version = sample.worldVersion();
    await user.click(screen.getByRole('button', { name: 'Add course' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a course' });
    const name = within(dialog).getByRole('textbox', { name: 'Course name' });
    expect(name).toHaveFocus();
    expect(
      within(dialog)
        .getAllByRole('radio')
        .map((radio) => radio.closest('label')!.textContent),
    ).toEqual(['Mechanical & Manufacturing', 'Electrical & Electronics', 'Chemical & Process']);
    expect(dialog).toHaveTextContent(
      'The platform course code is added by the Content Manager in Course codes.',
    );
    expect(within(dialog).getByRole('textbox', { name: 'Description (optional)' })).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Add course' }));
    expect(dialog).toHaveTextContent('Enter the course name');
    expect(dialog).toHaveTextContent('Choose the engineering area it belongs to');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(name).toHaveFocus());
    expect(sample.worldVersion()).toBe(version);
    // Only the area missing: focus goes to the first area.
    await user.type(name, 'Mass Transfer');
    expect(dialog).not.toHaveTextContent('Enter the course name');
    await user.click(within(dialog).getByRole('button', { name: 'Add course' }));
    await waitFor(() =>
      expect(
        within(dialog).getByRole('radio', { name: 'Mechanical & Manufacturing' }),
      ).toHaveFocus(),
    );
    await user.click(within(dialog).getByRole('radio', { name: 'Chemical & Process' }));
    expect(dialog).not.toHaveTextContent('Choose the engineering area it belongs to');
    await user.click(within(dialog).getByRole('button', { name: 'Add course' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(flash()).toHaveTextContent(
      'Course added to Chemical & Process. It has no platform code yet — the Content Manager adds it in Course codes.',
    );
    await waitFor(() => expect(flash()).toHaveFocus());
    await waitFor(() =>
      expect(text(main().querySelector('.xr-phead-meta'))).toMatch(
        /^3 engineering areas · 7 courses/,
      ),
    );
    expect(
      [...region('Chemical & Process').querySelectorAll('li.xr-row')].map((row) => text(row)),
    ).toEqual([
      'Process Instrumentation & Control CHE ZG513 · 3 published experiments Open',
      'Mass Transfer No platform code yet · no published experiments yet Open',
    ]);
    // The Content Manager’s Course codes list it, with no code yet (M-2: hers to add).
    const codes = await asPersonId(sample, KAVYA).platformCourseCodes.list();
    if (!codes.ok) throw new Error(codes.error.kind);
    const added = codes.value.find((row) => row.course.name === 'Mass Transfer');
    expect(added).toMatchObject({ areaName: 'Chemical & Process', publishedExperiments: 0 });
    expect(added?.course.platformCode).toBeNull();
    // The public explorer is unchanged: no published experiments (OD-B7-13).
    const area = await visitorPorts(sample).catalogue.getArea('chemical-process' as AreaId);
    if (!area.ok) throw new Error(area.error.kind);
    expect(area.value.courses.map((course) => course.name)).toEqual([
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
    expect(dialog).toHaveTextContent(
      'No artwork is added here — who supplies area artwork is still open.',
    );
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
    expect(flash()).toHaveTextContent('Area added. Add a course to start using it.');
    await waitFor(() => expect(flash()).toHaveFocus());
    const civil = await screen.findByRole('region', { name: 'Civil & Structural' });
    expect(text(civil)).toBe(
      'Civil & Structural No description yet. 0 courses Open area No courses yet. Add one to start using this area.',
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
});

// ---- SA-15 Course record -----------------------------------------------------------------------

describe('SA-15 Course record — as drawn (B7-07 f1, f8)', () => {
  it('Process Instrumentation & Control: the record, read-only code, what uses it, history', async () => {
    const { runtime } = await world();
    inAdmin(
      runtime,
      '/admin/structure/courses/process-instrumentation-control',
      <CourseRecord courseId="process-instrumentation-control" />,
    );
    await heading('Process Instrumentation & Control');
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', '/admin/structure');
    expect(text(main().querySelector('.xr-overline'))).toBe('Course · Chemical & Process');
    expect(
      [...main().querySelectorAll('.xw-actions > button')].map((button) => text(button)),
    ).toEqual(['Rename', 'Edit description', 'Move to another area']);
    expect(usesOf('Course')).toEqual([
      ['Engineering area', 'Chemical & Process'],
      [
        'Description',
        'Column, loop and metering experiments under realistic process lag and uncertainty.',
      ],
      ['Platform course code', 'CHE ZG513 Read-only · maintained by the Content Manager'],
    ]);
    expect(region('Course').querySelector('dd .xr-id')).toHaveTextContent('CHE ZG513');
    expect(usesOf('What uses this course')).toEqual([
      ['Published experiments', '3'],
      [
        'Institutions with access',
        'BITS Pilani — Hyderabad Campus · Malnad College of Engineering (ended)',
      ],
      ['Vendors with this course in scope', 'Meridian Virtual Labs'],
      ['Faculty mapped to it', 'None'],
      ['Students filed against it', '0'],
    ]);
    // Nobody is filed against it in the sample world: the service lets it move, so no note.
    expect(region('What uses this course')).not.toHaveTextContent('can’t be moved');
    // The canvas “Sample” label is not shown (T-36).
    expect(region('What uses this course').querySelector('.xr-section-head')).toHaveTextContent(
      /^What uses this course$/,
    );
    expect(historyWhats()).toEqual([
      'Platform code CHE ZG513 set by the Content Manager',
      'Course added by Arjun Mehta',
    ]);
    expect(
      [...region('History').querySelectorAll('.xr-tl-when')].map((node) => text(node)),
    ).toEqual(['2 Jun 2026', '2 Jun 2026']);
    expect(region('History').querySelector('.xr-tl-note')).toBeNull();
    // The shell: the crumbs name the course under Academic structure.
    const crumbs = screen.getByRole('list', { name: 'You are here' });
    expect(text(crumbs)).toMatch(/Academic structure\s*\/\s*Process Instrumentation & Control/);
  });

  it('Fluid Mechanics (f8): no platform code yet, nothing uses it, added by the Super Admin', async () => {
    const { runtime } = await world();
    inAdmin(
      runtime,
      '/admin/structure/courses/fluid-mechanics',
      <CourseRecord courseId="fluid-mechanics" />,
    );
    await heading('Fluid Mechanics');
    expect(usesOf('Course')[2]).toEqual([
      'Platform course code',
      'No platform code yet Read-only · maintained by the Content Manager',
    ]);
    expect(usesOf('What uses this course').map(([, value]) => value)).toEqual([
      '0',
      'None',
      'None',
      'None',
      '0',
    ]);
    expect(text(region('History').querySelector('li.xr-tl'))).toBe(
      'Course added by Arjun Mehta 24 Aug 2026 Mechanical & Manufacturing · no platform code yet.',
    );
  });

  it('an address that names no course is the in-shell not-found page', async () => {
    const { runtime } = await world();
    inAdmin(runtime, '/admin/structure/courses/zz-none', <CourseRecord courseId="zz-none" />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
  });
});

describe('SA-15 — Move to another area (B7-07 f3, f4; B7-10 f9)', () => {
  it('blocked while people are filed: who, where it stays, Close only; nothing written', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    inAdmin(
      runtime,
      '/admin/structure/courses/thermodynamics-heat-transfer',
      <CourseRecord courseId="thermodynamics-heat-transfer" />,
    );
    await heading('Thermodynamics & Heat Transfer');
    expect(usesOf('What uses this course')).toEqual([
      ['Published experiments', '4'],
      ['Institutions with access', 'Godavari Institute of Technology (MEC-523)'],
      ['Vendors with this course in scope', 'Northline Simulation Studio'],
      ['Faculty mapped to it', 'Dr S. Ranganathan — Godavari Institute of Technology'],
      ['Students filed against it', '12'],
    ]);
    expect(region('What uses this course')).toHaveTextContent(
      'Because people are filed against it, this course can’t be moved.',
    );
    const version = sample.worldVersion();
    const move = screen.getByRole('button', { name: 'Move to another area' });
    await user.click(move);
    const title = screen.getByRole('heading', {
      level: 2,
      name: 'Move Thermodynamics & Heat Transfer to another area',
    });
    await waitFor(() => expect(title).toHaveFocus());
    const panel = title.closest('.xw-inline-panel')!;
    expect(text(panel.querySelector('.xr-notice'))).toBe(
      'Can’t move this course People are filed against this course — 12 students · Dr S. Ranganathan — Godavari Institute of Technology. It stays in Mechanical & Manufacturing.',
    );
    expect(panel.querySelector('.xr-notice')).toHaveClass('xr-notice--err');
    expect(within(panel as HTMLElement).queryAllByRole('radio')).toHaveLength(0);
    expect(
      within(panel as HTMLElement)
        .getAllByRole('button')
        .map((button) => text(button)),
    ).toEqual(['Close']);
    await user.click(within(panel as HTMLElement).getByRole('button', { name: 'Close' }));
    expect(main().querySelector('.xw-inline-panel')).toBeNull();
    await waitFor(() => expect(move).toHaveFocus());
    expect(sample.worldVersion()).toBe(version);
  });

  it('allowed: every other area and what moves with it; an area is required; moved, it shows under its new area', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    inAdmin(
      runtime,
      '/admin/structure/courses/manufacturing-processes',
      <CourseRecord courseId="manufacturing-processes" />,
    );
    await heading('Manufacturing Processes');
    expect(region('What uses this course')).not.toHaveTextContent('can’t be moved');
    const version = sample.worldVersion();
    await user.click(screen.getByRole('button', { name: 'Move to another area' }));
    const title = screen.getByRole('heading', {
      level: 2,
      name: 'Move Manufacturing Processes to another area',
    });
    const panel = title.closest('.xw-inline-panel') as HTMLElement;
    const group = within(panel).getByRole('group', { name: 'Move to' });
    expect(
      within(group)
        .getAllByRole('radio')
        .map((radio) => radio.closest('label')!.textContent),
    ).toEqual(['Electrical & Electronics', 'Chemical & Process']);
    expect(panel).toHaveTextContent(
      'Its 2 published experiments, 1 institution’s access move with it. The explorer and catalogue show it under the new area.',
    );
    await user.click(within(panel).getByRole('button', { name: 'Move course' }));
    expect(panel).toHaveTextContent('Choose the area to move it to');
    await waitFor(() =>
      expect(within(panel).getByRole('radio', { name: 'Electrical & Electronics' })).toHaveFocus(),
    );
    expect(sample.worldVersion()).toBe(version);
    await user.click(within(panel).getByRole('radio', { name: 'Electrical & Electronics' }));
    expect(panel).not.toHaveTextContent('Choose the area to move it to');
    await user.click(within(panel).getByRole('button', { name: 'Move course' }));
    await waitFor(() => expect(main().querySelector('.xw-inline-panel')).toBeNull());
    expect(flash()).toHaveTextContent(
      'Manufacturing Processes is now in Electrical & Electronics.',
    );
    await waitFor(() => expect(flash()).toHaveFocus());
    await waitFor(() =>
      expect(text(main().querySelector('.xr-overline'))).toBe('Course · Electrical & Electronics'),
    );
    expect(historyWhats()[0]).toBe('Moved by Arjun Mehta');
    // B7-07 `doMove`: the note names both areas, from the entry's two area references.
    expect(text(region('History').querySelector('.xr-tl-note'))).toBe(
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
});

describe('SA-15 — refused calmly: changed meanwhile, failed for now', () => {
  it('a move keeps the revision the panel opened with: changed meanwhile, it is refused and the choice stays', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    inAdmin(
      runtime,
      '/admin/structure/courses/manufacturing-processes',
      <CourseRecord courseId="manufacturing-processes" />,
    );
    await heading('Manufacturing Processes');
    await user.click(screen.getByRole('button', { name: 'Move to another area' }));
    const panel = main().querySelector('.xw-inline-panel') as HTMLElement;
    await user.click(within(panel).getByRole('radio', { name: 'Chemical & Process' }));
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
    await user.click(within(panel).getByRole('button', { name: 'Move course' }));
    expect(await within(panel).findByText('This course changed since you opened it')).toBeVisible();
    expect(sample.worldVersion()).toBe(version);
    expect(within(panel).getByRole('radio', { name: 'Chemical & Process' })).toBeChecked();
    await user.click(within(panel).getByRole('button', { name: 'Move course' }));
    await waitFor(() => expect(main().querySelector('.xw-inline-panel')).toBeNull());
    expect(flash()).toHaveTextContent('Manufacturing Processes is now in Chemical & Process.');
  });

  it('a rename or an added course that fails for now says nothing was lost, and keeps what was typed', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    inAdmin(
      runtime,
      '/admin/structure/courses/fluid-mechanics',
      <CourseRecord courseId="fluid-mechanics" />,
    );
    await heading('Fluid Mechanics');
    faults(sample).failNext('AcademicStructureService.rename');
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rename course' });
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

  it('Add course failing for now keeps the dialog and what was chosen', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await world();
    inAdmin(runtime, '/admin/structure', <AcademicStructure />);
    await screen.findByRole('region', { name: 'Chemical & Process' });
    faults(sample).failNext('AcademicStructureService.addCourse');
    await user.click(screen.getByRole('button', { name: 'Add course' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a course' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Course name' }), 'Heat Engines');
    await user.click(within(dialog).getByRole('radio', { name: 'Mechanical & Manufacturing' }));
    await user.click(within(dialog).getByRole('button', { name: 'Add course' }));
    expect(
      await within(dialog).findByText('It wasn’t added. Nothing was lost — try again.'),
    ).toBeVisible();
    expect(within(dialog).getByRole('radio', { name: 'Mechanical & Manufacturing' })).toBeChecked();
    await user.click(within(dialog).getByRole('button', { name: 'Add course' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(flash()).toHaveTextContent('Course added to Mechanical & Manufacturing.');
  });
});

describe('SA-15 — Rename and Edit description (B7-07 f6)', () => {
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
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rename course' });
    const name = within(dialog).getByRole('textbox', { name: 'Course name' });
    expect(name).toHaveValue('Thermodynamics & Heat Transfer');
    expect(name).toHaveFocus();
    expect(name).toHaveAccessibleDescription(
      'The new name shows in the public explorer, the catalogue, Vendor course lists and student-import matching. The platform code ME ZG523 and every institution’s own course code stay as they are.',
    );
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
    const renamed = await heading('Heat Transfer & Thermodynamics');
    await waitFor(() => expect(renamed).toHaveFocus());
    expect(flash()).toHaveTextContent(
      'Renamed. The explorer, catalogue and Vendor course lists show the new name.',
    );
    expect(text(region('History').querySelector('li.xr-tl'))).toMatch(
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
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rename course' });
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
    await waitFor(() => expect(usesOf('Course')[1]![1]).toBe('Converter experiments.'));
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
    await user.click(screen.getByRole('button', { name: 'Edit description' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Edit the description of Fluid Mechanics',
    });
    const field = within(dialog).getByRole('textbox', { name: 'Description' });
    expect(field).toHaveValue(
      'Flow measurement and pipe-flow experiments (course added; no experiments yet).',
    );
    await user.clear(field);
    await user.type(field, 'Pipe-flow and flow-measurement experiments.');
    await user.click(within(dialog).getByRole('button', { name: 'Save description' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(flash()).toHaveTextContent('Description saved.');
    await waitFor(() => expect(flash()).toHaveFocus());
    await waitFor(() =>
      expect(usesOf('Course')[1]).toEqual([
        'Description',
        'Pipe-flow and flow-measurement experiments.',
      ]),
    );
    expect(historyWhats()[0]).toBe('Description changed by Arjun Mehta');
  });
});

// ---- SA-15 Area record -------------------------------------------------------------------------

describe('SA-15 Area record (B7-07 f5)', () => {
  it('Chemical & Process: description, its courses, no artwork and no Retire, history', async () => {
    const { runtime } = await world();
    inAdmin(
      runtime,
      '/admin/structure/areas/chemical-process',
      <AreaRecord areaId="chemical-process" />,
    );
    await heading('Chemical & Process');
    expect(text(main().querySelector('.xr-overline'))).toBe('Engineering area');
    expect(
      [...main().querySelectorAll('.xw-actions > button')].map((button) => text(button)),
    ).toEqual(['Rename', 'Edit description']);
    expect(usesOf('Engineering area')).toEqual([
      ['Description', 'Distillation, process control and flow measurement.'],
      ['Courses', 'Process Instrumentation & Control · CHE ZG513'],
    ]);
    expect(region('Engineering area').querySelector('ul.xv-los')).not.toBeNull();
    expect(region('Engineering area')).toHaveTextContent(
      'Areas have no artwork set here, and can’t be retired.',
    );
    expect(main()).not.toHaveTextContent('(D3)');
    expect(historyWhats()).toEqual(['Area added by Arjun Mehta']);
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
    const dialog = await screen.findByRole('dialog', { name: 'Rename area' });
    const name = within(dialog).getByRole('textbox', { name: 'Area name' });
    expect(name).toHaveAccessibleDescription(
      'The new name shows in the public explorer, the catalogue, Vendor course lists and student-import matching. Its courses stay in it.',
    );
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
    expect(historyWhats()[0]).toBe('Renamed by Arjun Mehta');
    const areas = await visitorPorts(sample).catalogue.listAreas();
    if (!areas.ok) throw new Error(areas.error.kind);
    expect(areas.value.map((area) => area.name)).toContain('Chemical & Process Engineering');
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
      expect(usesOf('Engineering area')[0]).toEqual([
        'Description',
        'Machines and power electronics.',
      ]),
    );
  });
});
