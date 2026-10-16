import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, switchIdentity, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * SA-14 Academic structure (boards B7-07 f0, f7; B7-12 f12 … f15) and SA-15 Area / course record
 * (B7-07 f1 … f6, f8; B7-10 f9), on the test-hook build at 1440, 1024, 768 and 375, as Arjun Mehta
 * on `after-flow-e` (the B7 boards’ day). Each drawn state passes `checkState` (axe WCAG A/AA, one
 * h1, visible focus targets, 24 × 24 targets, no developer surface, no sideways scroll).
 * Everything the screens do — Add course and Add area with their validation, Rename (the same
 * name, a taken one), Edit description, Move (blocked, then allowed), the rows’ and back links — is
 * done by real clicks and typing; the CI seam only sets up a change made elsewhere (a stale
 * revision) and switches the tab’s identity for the cross-role proofs, in the same tab and world:
 * a renamed course reaches the public course and area pages and the Content Manager’s Course
 * codes, an added course reaches Course codes with no code (not the public explorer, OD-B7-13), and
 * a moved course shows under its new area on the public area pages.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const ARJUN = { personId: 'sa-arjun-mehta' };
const KAVYA = { personId: 'per-kavya-nair' };

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/fca2accf-8a10-47fc-bc4c-75960334d92a/scratchpad/shots-product/structure';

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const region = (page: Page, name: string) => page.getByRole('region', { name, exact: true });
const flash = (page: Page) => main(page).locator('p.xa-save[role="status"]');
const historyWhats = (page: Page) => region(page, 'History').locator('.xr-tl-what');

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/**
 * A dialog frame drawn taller than the 1024 project’s viewport (B7-07 f6 1193 px, f7 1300 px): the
 * viewport takes the frame’s height for the comparison shot, so the whole dialog is in view.
 */
async function dialogShot(page: Page, name: string, frameHeight: number): Promise<void> {
  if (width(page) !== 1024) return;
  const viewport = page.viewportSize()!;
  await page.setViewportSize({ width: viewport.width, height: frameHeight });
  await shot(page, name);
  await page.setViewportSize(viewport);
}

/** A client-side navigation (a document load would rebuild the tab’s sample world, ADR-0004). */
async function push(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
  await page.waitForURL((url) => url.pathname === href.split('?')[0], { timeout: 60_000 });
}

/** A link or button reached and pressed: Enter after focus at 375 (wrapped rows), else a click. */
async function press(page: Page, target: Locator): Promise<void> {
  if (width(page) <= 375) {
    await target.focus();
    await page.keyboard.press('Enter');
  } else {
    await reachAndClick(page, target);
  }
}

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };

/** One port call as a sample person through the CI seam (set-up only), which must succeed. */
async function port<T>(
  page: Page,
  person: { readonly personId: string },
  portKey: string,
  method: string,
  input?: unknown,
): Promise<T> {
  const answer = await actAs<PortAnswer<T>>(page, person, { port: portKey, method, input });
  expect(answer.ok, `${portKey}.${method} ${JSON.stringify(answer)}`).toBe(true);
  return (answer as { readonly value: T }).value;
}

async function open(page: Page, path: string, title: string): Promise<void> {
  await bootWorld(page, { fixture: 'after-flow-e', session: ARJUN });
  await page.goto(path);
  await expect(heading(page, title)).toBeVisible({ timeout: 90_000 });
}

test.describe('SA-14 Academic structure', () => {
  test('as drawn (f0; B7-12 f12 … f15), Add course validation (f7), a course and an area added — CM-09 and the public explorer', async ({
    page,
  }) => {
    await open(page, '/admin/structure', 'Academic structure');
    await expect(main(page).locator('.xr-phead-meta')).toHaveText(
      '3 engineering areas · 6 courses · feeds the public explorer, the catalogue, Vendor course lists and student-import matching',
    );
    await expect(main(page).locator('section.xr-section h2')).toHaveText([
      'Mechanical & Manufacturing',
      'Electrical & Electronics',
      'Chemical & Process',
    ]);
    const mechanical = region(page, 'Mechanical & Manufacturing');
    await expect(mechanical.locator('.xr-row-sub')).toHaveText([
      'ME ZG523 · 4 published experiments',
      'MEL ZG512 · 2 published experiments',
      'No platform code yet · no published experiments yet',
    ]);
    await expect(main(page).locator('p.xl-open')).toHaveText(
      'Platform course codes are maintained by the Content Manager and shown read-only here. Retiring an area or course is not available.',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin/structure');
    await checkState(page, 'Academic structure');
    const frame = { 1440: 'f12', 1024: 'f13', 768: 'f14', 375: 'f15' }[width(page)] ?? 'fx';
    await shot(page, `b7-12-${frame}-structure`);

    // f7: Add course with nothing — both errors at once, nothing sent.
    const addCourse = main(page).locator('.xr-phead-actions').getByRole('button', {
      name: 'Add course',
    });
    await reachAndClick(page, addCourse);
    const dialog = page.getByRole('dialog', { name: 'Add a course' });
    const name = dialog.getByRole('textbox', { name: 'Course name' });
    await expect(name).toBeFocused();
    await reachAndClick(page, dialog.getByRole('button', { name: 'Add course' }));
    await expect(dialog).toContainText('Enter the course name');
    await expect(dialog).toContainText('Choose the engineering area it belongs to');
    await expect(name).toBeFocused();
    await checkState(page, 'Academic structure');
    await dialogShot(page, 'b7-07-f7-add-course-validation', 1300);
    await name.pressSequentially('Mass Transfer');
    await reachAndClick(page, dialog.getByText('Chemical & Process', { exact: true }));
    await reachAndClick(page, dialog.getByRole('button', { name: 'Add course' }));
    await expect(dialog).toBeHidden();
    await expect(flash(page)).toHaveText(
      'Course added to Chemical & Process. It has no platform code yet — the Content Manager adds it in Course codes.',
    );
    await expect(flash(page)).toBeFocused();
    await expect(region(page, 'Chemical & Process').locator('li.xr-row')).toHaveText([
      /^Process Instrumentation & ControlCHE ZG513 · 3 published experiments/,
      /^Mass TransferNo platform code yet · no published experiments yet/,
    ]);
    await expect(main(page).locator('.xr-phead-meta')).toContainText(
      '3 engineering areas · 7 courses',
    );
    await checkState(page, 'Academic structure');

    // Add area: a taken name is the service’s answer; then a new area with no courses.
    await reachAndClick(page, main(page).getByRole('button', { name: 'Add area' }));
    const areaDialog = page.getByRole('dialog', { name: 'Add an engineering area' });
    const areaName = areaDialog.getByRole('textbox', { name: 'Area name' });
    await areaName.pressSequentially('Electrical & Electronics');
    await reachAndClick(page, areaDialog.getByRole('button', { name: 'Add area' }));
    await expect(areaDialog).toContainText(
      'There is already an area called Electrical & Electronics',
    );
    await expect(areaName).toBeFocused();
    await checkState(page, 'Academic structure');
    await areaName.fill('Civil & Structural');
    await reachAndClick(page, areaDialog.getByRole('button', { name: 'Add area' }));
    await expect(areaDialog).toBeHidden();
    await expect(flash(page)).toHaveText('Area added. Add a course to start using it.');
    await expect(region(page, 'Civil & Structural')).toContainText(
      'No courses yet. Add one to start using this area.',
    );
    await checkState(page, 'Academic structure');

    // The new course’s record: no platform code yet, added by the Super Admin.
    const mark = await markDocument(page);
    await press(page, main(page).getByRole('link', { name: 'Open Mass Transfer' }));
    await expect(heading(page, 'Mass Transfer')).toBeVisible({ timeout: 60_000 });
    await expect(region(page, 'Course')).toContainText('No platform code yet');
    await expect(region(page, 'History').locator('li.xr-tl').first()).toContainText(
      'Chemical & Process · no platform code yet.',
    );
    await expectSameDocument(page, mark);

    // The Content Manager’s Course codes list it, with no code yet, for her to add (M-2).
    await switchIdentity(page, KAVYA);
    await push(page, '/content-manager/course-codes');
    await expect(heading(page, 'Course codes')).toBeVisible({ timeout: 60_000 });
    const row = main(page).locator('tbody tr', { hasText: 'Mass Transfer' });
    await expect(row).toContainText('Chemical & Process · 0 published experiments');
    await expect(row.getByRole('textbox')).toHaveValue('');
    // The public explorer is unchanged: no published experiments (OD-B7-13).
    await push(page, '/areas/chemical-process');
    await expect(heading(page, 'Chemical & Process')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.xp-course-name')).toHaveText(['Process Instrumentation & Control']);
    await push(page, '/areas');
    await expect(page.locator('main')).not.toContainText('Civil & Structural');
    await expectSameDocument(page, mark);
  });
});

test.describe('SA-15 Course record', () => {
  test('as drawn (f1, f2, f8), Rename validation (f6), renamed — the public pages and CM-09 follow', async ({
    page,
  }) => {
    await open(page, '/admin/structure', 'Academic structure');
    const mark = await markDocument(page);
    await press(
      page,
      main(page).getByRole('link', { name: 'Open Process Instrumentation & Control' }),
    );
    await expect(heading(page, 'Process Instrumentation & Control')).toBeVisible({
      timeout: 60_000,
    });
    await expect(page).toHaveURL(/\/admin\/structure\/courses\/process-instrumentation-control$/);
    await expect(main(page).locator('.xr-overline')).toHaveText('Course · Chemical & Process');
    await expect(region(page, 'Course').locator('dd .xr-id')).toHaveText('CHE ZG513');
    await expect(region(page, 'Course')).toContainText(
      'Read-only · maintained by the Content Manager',
    );
    await expect(region(page, 'What uses this course').locator('dd')).toHaveText([
      '3',
      'BITS Pilani — Hyderabad Campus · Malnad College of Engineering (ended)',
      'Meridian Virtual Labs',
      'None',
      '0',
    ]);
    await expect(historyWhats(page)).toHaveText([
      'Platform code CHE ZG513 set by the Content Manager',
      'Course added by Arjun Mehta',
    ]);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin/structure');
    await checkState(page, 'Process Instrumentation & Control');
    if (width(page) === 1440) await shot(page, 'b7-07-f1-course');

    // f8: back to the structure, then Fluid Mechanics — no platform code yet.
    await press(page, main(page).locator('a.xr-back'));
    await expect(heading(page, 'Academic structure')).toBeVisible({ timeout: 60_000 });
    await press(page, main(page).getByRole('link', { name: 'Open Fluid Mechanics' }));
    await expect(heading(page, 'Fluid Mechanics')).toBeVisible({ timeout: 60_000 });
    await expect(region(page, 'Course').locator('dd').nth(2)).toContainText('No platform code yet');
    await expect(region(page, 'History').locator('li.xr-tl')).toHaveText([
      /^Course added by Arjun Mehta\s*24 Aug 2026\s*Mechanical & Manufacturing · no platform code yet\.$/,
    ]);
    await checkState(page, 'Fluid Mechanics');
    if (width(page) === 1024) await shot(page, 'b7-07-f8-no-code');

    // f2 / f6: Thermodynamics & Heat Transfer; Rename to the same name is refused.
    await push(page, '/admin/structure/courses/thermodynamics-heat-transfer');
    await expect(heading(page, 'Thermodynamics & Heat Transfer')).toBeVisible({ timeout: 60_000 });
    await checkState(page, 'Thermodynamics & Heat Transfer');
    if (width(page) === 375) await shot(page, 'b7-07-f2-course-mobile');
    const rename = main(page).getByRole('button', { name: 'Rename' });
    await reachAndClick(page, rename);
    const dialog = page.getByRole('dialog', { name: 'Rename course' });
    const name = dialog.getByRole('textbox', { name: 'Course name' });
    await expect(name).toBeFocused();
    await expect(name).toHaveValue('Thermodynamics & Heat Transfer');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Save name' }));
    await expect(dialog).toContainText('Enter a different name — this is the current one');
    await expect(dialog).toContainText(
      'The platform code ME ZG523 and every institution’s own course code stay as they are.',
    );
    await expect(name).toBeFocused();
    await checkState(page, 'Thermodynamics & Heat Transfer');
    await dialogShot(page, 'b7-07-f6-rename-validation', 1193);
    await reachAndClick(page, dialog.getByRole('button', { name: 'Cancel' }));
    await expect(dialog).toBeHidden();
    await expect(rename).toBeFocused();

    // Power Electronics: renamed and its description edited.
    await push(page, '/admin/structure/courses/power-electronics');
    await expect(heading(page, 'Power Electronics')).toBeVisible({ timeout: 60_000 });
    await reachAndClick(page, main(page).getByRole('button', { name: 'Rename' }));
    await name.fill('Power Electronics & Drives');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Save name' }));
    await expect(dialog).toBeHidden();
    await expect(heading(page, 'Power Electronics & Drives')).toBeFocused();
    await expect(flash(page)).toHaveText(
      'Renamed. The explorer, catalogue and Vendor course lists show the new name.',
    );
    await expect(historyWhats(page).first()).toHaveText('Renamed by Arjun Mehta');
    await expect(region(page, 'History').locator('.xr-tl-note').first()).toHaveText(
      'Was “Power Electronics”.',
    );
    await checkState(page, 'Power Electronics & Drives');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Edit description' }));
    const describe = page.getByRole('dialog', {
      name: 'Edit the description of Power Electronics & Drives',
    });
    await describe
      .getByRole('textbox', { name: 'Description' })
      .fill('Converter and drive experiments that connect switching to measured waveforms.');
    await reachAndClick(page, describe.getByRole('button', { name: 'Save description' }));
    await expect(describe).toBeHidden();
    await expect(flash(page)).toHaveText('Description saved.');
    await expect(flash(page)).toBeFocused();
    await expect(region(page, 'Course').locator('dd').nth(1)).toHaveText(
      'Converter and drive experiments that connect switching to measured waveforms.',
    );

    // The public course and area pages show the new name (one world, same tab).
    await push(page, '/courses/power-electronics');
    await expect(heading(page, 'Power Electronics & Drives')).toBeVisible({ timeout: 60_000 });
    await push(page, '/areas/electrical-electronics');
    await expect(heading(page, 'Electrical & Electronics')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.xp-course-name')).toContainText(['Power Electronics & Drives']);
    // The Content Manager’s Course codes list it under the new name, its code unchanged.
    await switchIdentity(page, KAVYA);
    await push(page, '/content-manager/course-codes');
    await expect(heading(page, 'Course codes')).toBeVisible({ timeout: 60_000 });
    const row = main(page).locator('tbody tr', { hasText: 'Power Electronics & Drives' });
    await expect(row.getByRole('textbox')).toHaveValue('EEE ZG512');
    await expect(main(page).locator('tbody strong')).toHaveText([
      'Thermodynamics & Heat Transfer',
      'Manufacturing Processes',
      'Electrical Machines',
      'Power Electronics & Drives',
      'Process Instrumentation & Control',
      'Fluid Mechanics',
    ]);
    await expectSameDocument(page, mark);
  });

  test('Move: blocked while people are filed (f3; B7-10 f9), allowed without (f4) — the course under its new area on the public pages', async ({
    page,
  }) => {
    await open(
      page,
      '/admin/structure/courses/thermodynamics-heat-transfer',
      'Thermodynamics & Heat Transfer',
    );
    const mark = await markDocument(page);
    const uses = region(page, 'What uses this course');
    await expect(uses.locator('dd')).toHaveText([
      '4',
      'Godavari Institute of Technology (MEC-523)',
      'Northline Simulation Studio',
      'Dr S. Ranganathan — Godavari Institute of Technology',
      '12',
    ]);
    await expect(uses).toContainText(
      'Because people are filed against it, this course can’t be moved.',
    );
    const move = main(page).getByRole('button', { name: 'Move to another area' });
    await reachAndClick(page, move);
    const title = page.getByRole('heading', {
      level: 2,
      name: 'Move Thermodynamics & Heat Transfer to another area',
    });
    await expect(title).toBeFocused();
    const panel = main(page).locator('.xw-inline-panel');
    await expect(panel.locator('.xr-notice--err')).toHaveText(
      /Can’t move this course\s*People are filed against this course — 12 students · Dr S\. Ranganathan — Godavari Institute of Technology\. It stays in Mechanical & Manufacturing\./,
    );
    await expect(panel.getByRole('radio')).toHaveCount(0);
    await checkState(page, 'Thermodynamics & Heat Transfer');
    if (width(page) === 1024) await shot(page, 'b7-07-f3-move-blocked');
    await reachAndClick(page, panel.getByRole('button', { name: 'Close' }));
    await expect(panel).toHaveCount(0);
    await expect(move).toBeFocused();

    // f4: Manufacturing Processes — nobody filed; its experiments and access move with it.
    await push(page, '/admin/structure/courses/manufacturing-processes');
    await expect(heading(page, 'Manufacturing Processes')).toBeVisible({ timeout: 60_000 });
    await expect(region(page, 'What uses this course')).not.toContainText('can’t be moved');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Move to another area' }));
    const group = panel.getByRole('group', { name: 'Move to' });
    await expect(group.locator('.xr-choice-title')).toHaveText([
      'Electrical & Electronics',
      'Chemical & Process',
    ]);
    await expect(panel).toContainText(
      'Its 2 published experiments, 1 institution’s access move with it. The explorer and catalogue show it under the new area.',
    );
    await checkState(page, 'Manufacturing Processes');
    if (width(page) === 1024) await shot(page, 'b7-07-f4-move-allowed');
    await reachAndClick(page, panel.getByRole('button', { name: 'Move course' }));
    await expect(panel).toContainText('Choose the area to move it to');
    await reachAndClick(page, group.getByText('Electrical & Electronics', { exact: true }));
    await reachAndClick(page, panel.getByRole('button', { name: 'Move course' }));
    await expect(panel).toHaveCount(0);
    await expect(flash(page)).toHaveText(
      'Manufacturing Processes is now in Electrical & Electronics.',
    );
    await expect(flash(page)).toBeFocused();
    await expect(main(page).locator('.xr-overline')).toHaveText(
      'Course · Electrical & Electronics',
    );
    await expect(historyWhats(page).first()).toHaveText('Moved by Arjun Mehta');
    await checkState(page, 'Manufacturing Processes');

    // The public area pages show it under its new area (it has published experiments).
    await push(page, '/areas/electrical-electronics');
    await expect(heading(page, 'Electrical & Electronics')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.xp-course-name')).toContainText(['Manufacturing Processes']);
    await push(page, '/areas/mechanical-manufacturing');
    await expect(heading(page, 'Mechanical & Manufacturing')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.xp-course-name')).not.toContainText(['Manufacturing Processes']);
    await push(page, '/courses/manufacturing-processes');
    await expect(heading(page, 'Manufacturing Processes')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.xp-eyebrow')).toContainText('Electrical & Electronics');
    await expectSameDocument(page, mark);
  });
});

test.describe('SA-15 Area record', () => {
  test('as drawn (f5); a description changed elsewhere is refused calmly; Rename refuses a taken name', async ({
    page,
  }) => {
    await open(page, '/admin/structure', 'Academic structure');
    await press(page, main(page).getByRole('link', { name: 'Open area Chemical & Process' }));
    await expect(heading(page, 'Chemical & Process')).toBeVisible({ timeout: 60_000 });
    await expect(page).toHaveURL(/\/admin\/structure\/areas\/chemical-process$/);
    await expect(main(page).locator('.xr-overline')).toHaveText('Engineering area');
    await expect(main(page).locator('.xw-actions > button')).toHaveText([
      'Rename',
      'Edit description',
    ]);
    const area = region(page, 'Engineering area');
    await expect(area.locator('ul.xv-los li')).toHaveText([
      'Process Instrumentation & Control · CHE ZG513',
    ]);
    await expect(area).toContainText('Areas have no artwork set here, and can’t be retired.');
    await expect(historyWhats(page)).toHaveText(['Area added by Arjun Mehta']);
    await checkState(page, 'Chemical & Process');
    if (width(page) === 1024) await shot(page, 'b7-07-f5-area');

    // Edit description, while another session changes it first (set-up through the CI seam).
    await reachAndClick(page, main(page).getByRole('button', { name: 'Edit description' }));
    const dialog = page.getByRole('dialog', { name: 'Edit the description of Chemical & Process' });
    const field = dialog.getByRole('textbox', { name: 'Description' });
    await field.fill('Distillation, process control, flow measurement and mass transfer.');
    const read = await port<{ readonly area: { readonly id: string; readonly rev: number } }>(
      page,
      ARJUN,
      'academicStructure',
      'getArea',
      'chemical-process',
    );
    await port(page, ARJUN, 'academicStructure', 'editDescription', {
      kind: 'area',
      id: read.area.id,
      description: 'Distillation and process control.',
      expectedRev: read.area.rev,
    });
    await reachAndClick(page, dialog.getByRole('button', { name: 'Save description' }));
    await expect(dialog).toContainText('This area changed since you opened it');
    await expect(dialog).toContainText('It has been read again. Check it, then try again.');
    await expect(field).toHaveValue(
      'Distillation, process control, flow measurement and mass transfer.',
    );
    await expect(area.locator('dd').first()).toHaveText('Distillation and process control.');
    await checkState(page, 'Chemical & Process');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Save description' }));
    await expect(dialog).toBeHidden();
    await expect(flash(page)).toHaveText('Description saved.');
    await expect(area.locator('dd').first()).toHaveText(
      'Distillation, process control, flow measurement and mass transfer.',
    );

    // Rename: a taken name is the service’s answer, under the field.
    await reachAndClick(page, main(page).getByRole('button', { name: 'Rename' }));
    const rename = page.getByRole('dialog', { name: 'Rename area' });
    const name = rename.getByRole('textbox', { name: 'Area name' });
    await name.fill('Electrical & Electronics');
    await reachAndClick(page, rename.getByRole('button', { name: 'Save name' }));
    await expect(rename).toContainText('There is already an area called Electrical & Electronics');
    await expect(name).toBeFocused();
    await checkState(page, 'Chemical & Process');
    await page.keyboard.press('Escape');
    await expect(rename).toBeHidden();
    await expect(main(page).getByRole('button', { name: 'Rename' })).toBeFocused();
  });
});
