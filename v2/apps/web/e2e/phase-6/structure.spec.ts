import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, switchIdentity, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * SA-14 Academic structure and SA-15 Area / course record in the owner-approved Super Admin design
 * (V3 Refined B, design/v3-refined-b/roles/SA-v1 `sa-views-c.js` `V.structure`, `V.area`,
 * `V.course`), on the test-hook build at 1440, 1024, 768 and 375, as Arjun Mehta on
 * `after-flow-e`. Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible focus
 * targets, 24 × 24 targets, no developer surface, no sideways scroll). Everything the screens do —
 * Add course and Add area with their validation, Rename (the same name, a taken one), Edit
 * description, Move (blocked, then allowed), Add course from an area, the rows, crumbs and links —
 * is done by real clicks and typing; the CI seam only sets up a change made elsewhere (a stale
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
/** The flash (`div.rk-notice--ok[role=status]`, the export's `#sa-flash`). */
const flash = (page: Page) => main(page).locator('.rk-notice--ok[role="status"]');
const historyWhats = (page: Page) => region(page, 'History').locator('.rk-tl-w');
const rows = (scope: Locator) => scope.locator('a.sa-list-row');
/** The page head's actions (`div.rk-head-act`). */
const headActions = (page: Page) => main(page).locator('.rk-head-act');
/** The course page's panel (`aside.rk-aside`, named by its heading). */
const panel = (page: Page) => page.getByRole('complementary', { name: 'Change this course' });

/** A dialog’s opening animation (`rk-pop`) has finished, so a check reads its settled colours. */
async function settled(dialog: Locator): Promise<void> {
  await dialog.evaluate((element) =>
    Promise.all(
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => null)),
    ),
  );
}

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** A dialog shot at 1024 and 375 (the viewport, where the modal dialog is). */
async function dialogShot(page: Page, name: string): Promise<void> {
  if (width(page) !== 1024 && width(page) !== 375) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`) });
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
  test('as drawn (`V.structure`), Add course validation, a course and an area added — CM-09 and the public explorer', async ({
    page,
  }) => {
    await open(page, '/admin/structure', 'Academic structure');
    await expect(main(page).locator('.rk-head .rk-sub')).toHaveText(
      'Engineering areas and the courses in them. Platform course codes are maintained by the Content Manager and shown read-only here.',
    );
    await expect(headActions(page).getByRole('button')).toHaveText(['Add area', 'Add course']);
    await expect(main(page).locator('section.rk-course h2')).toHaveText([
      'Mechanical & Manufacturing',
      'Electrical & Electronics',
      'Chemical & Process',
    ]);
    const mechanical = region(page, 'Mechanical & Manufacturing');
    await expect(rows(mechanical)).toHaveText([
      /^Thermodynamics & Heat Transfer\s*ME ZG523\s*4 published experiments$/,
      /^Manufacturing Processes\s*MEL ZG512\s*2 published experiments$/,
      /^Fluid Mechanics\s*No platform code yet\s*0 published experiments$/,
    ]);
    await expect(main(page).locator('p.rk-ca-foot')).toHaveText(
      'Areas group courses; there is no module layer. Retiring an area or course is not available.',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin/structure');
    await checkState(page, 'Academic structure');
    await shot(page, 'structure');

    // Add course with nothing — both errors at once, nothing sent.
    await reachAndClick(page, headActions(page).getByRole('button', { name: 'Add course' }));
    const dialog = page.getByRole('dialog', { name: 'Add a course' });
    const name = dialog.getByRole('textbox', { name: 'Course name' });
    const area = dialog.getByRole('combobox', { name: 'Engineering area' });
    await expect(name).toBeFocused();
    await reachAndClick(page, dialog.getByRole('button', { name: 'Add course' }));
    await expect(dialog).toContainText('Enter the course name');
    await expect(dialog).toContainText('Choose the engineering area it belongs to');
    await expect(name).toBeFocused();
    await settled(dialog);
    await checkState(page, 'Academic structure');
    await dialogShot(page, 'structure-add-course-validation');
    await name.pressSequentially('Mass Transfer');
    await area.selectOption({ label: 'Chemical & Process' });
    await reachAndClick(page, dialog.getByRole('button', { name: 'Add course' }));
    await expect(dialog).toBeHidden();
    await expect(flash(page)).toHaveText(
      /^Mass Transfer was added\.\s*The Content Manager adds its platform course code\.$/,
    );
    await expect(flash(page)).toBeFocused();
    await expect(rows(region(page, 'Chemical & Process'))).toHaveText([
      /^Process Instrumentation & Control\s*CHE ZG513\s*3 published experiments$/,
      /^Mass Transfer\s*No platform code yet\s*0 published experiments$/,
    ]);
    await checkState(page, 'Academic structure');

    // Add area: a taken name is the service’s answer; then a new area with no courses.
    await reachAndClick(page, headActions(page).getByRole('button', { name: 'Add area' }));
    const areaDialog = page.getByRole('dialog', { name: 'Add an engineering area' });
    const areaName = areaDialog.getByRole('textbox', { name: 'Area name' });
    await areaName.pressSequentially('Electrical & Electronics');
    await reachAndClick(page, areaDialog.getByRole('button', { name: 'Add area' }));
    await expect(areaDialog).toContainText(
      'There is already an area called Electrical & Electronics',
    );
    await expect(areaName).toBeFocused();
    await settled(areaDialog);
    await checkState(page, 'Academic structure');
    await areaName.fill('Civil & Structural');
    await reachAndClick(page, areaDialog.getByRole('button', { name: 'Add area' }));
    await expect(areaDialog).toBeHidden();
    await expect(flash(page)).toHaveText(
      /^Civil & Structural was added\.\s*Add courses to it to start using it\.$/,
    );
    await expect(region(page, 'Civil & Structural')).toContainText(
      'No courses yet. Add one to start using this area.',
    );
    await checkState(page, 'Academic structure');

    // The new course’s record: no platform code yet, added by the Super Admin.
    const mark = await markDocument(page);
    await press(page, main(page).getByRole('link', { name: /^Mass Transfer/ }));
    await expect(heading(page, 'Mass Transfer')).toBeVisible({ timeout: 60_000 });
    await expect(region(page, 'Course')).toContainText('No platform code yet');
    await expect(region(page, 'History').locator('li').first()).toContainText(
      'Chemical & Process · no platform code yet.',
    );
    await expectSameDocument(page, mark);

    // The Content Manager’s Course codes list it, with no code yet (M-2).
    await switchIdentity(page, KAVYA);
    await push(page, '/content-manager/course-codes');
    await expect(heading(page, 'Course codes')).toBeVisible({ timeout: 60_000 });
    // CM-09 (V3, CM-v1): the courses grouped under their area's band; a course with nothing live.
    const codesArea = main(page).locator('tbody', {
      has: page.locator('tr.cm-area .cm-grp-name', { hasText: 'Chemical & Process' }),
    });
    const row = codesArea.locator('tr', { hasText: 'Mass Transfer' });
    await expect(row.locator('.cm-course-t')).toHaveText('Mass Transfer');
    await expect(row.locator('.cm-course-s')).toHaveText('Nothing live yet');
    await expect(row.locator('.cm-livecount')).toHaveText('0');
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
  test('as drawn (`V.course`), Rename validation, renamed and described — the public pages and CM-09 follow', async ({
    page,
  }) => {
    await open(page, '/admin/structure', 'Academic structure');
    const mark = await markDocument(page);
    await press(page, main(page).getByRole('link', { name: /^Process Instrumentation & Control/ }));
    await expect(heading(page, 'Process Instrumentation & Control')).toBeVisible({
      timeout: 60_000,
    });
    await expect(page).toHaveURL(/\/admin\/structure\/courses\/process-instrumentation-control$/);
    const crumbs = main(page).getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumbs.getByRole('link')).toHaveText(['Academic structure', 'Chemical & Process']);
    await expect(main(page).locator('.rk-head .rk-eyebrow')).toHaveText(
      'Course · Chemical & Process',
    );
    await expect(main(page).locator('.rk-head .rk-meta')).toHaveText(
      /^CHE ZG513\s*Platform course code, maintained by the Content Manager$/,
    );
    await expect(region(page, 'Course')).toContainText('Read-only here');
    await expect(region(page, 'What uses this course').locator('dd')).toHaveText([
      '3',
      'BITS Pilani — Hyderabad Campus, Malnad College of Engineering (ended)',
      'Ritu Sharma',
      'Nobody',
    ]);
    await expect(historyWhats(page)).toHaveText([
      'Platform code CHE ZG513 set by the Content Manager',
      'Course added by Arjun Mehta',
    ]);
    await expect(panel(page).getByRole('button')).toHaveText([
      'Rename',
      'Edit description',
      'Move to another area',
    ]);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin/structure');
    await checkState(page, 'Process Instrumentation & Control');

    // The crumb back to the structure, then Fluid Mechanics — no platform code yet.
    await press(page, crumbs.getByRole('link', { name: 'Academic structure' }));
    await expect(heading(page, 'Academic structure')).toBeVisible({ timeout: 60_000 });
    await press(page, main(page).getByRole('link', { name: /^Fluid Mechanics/ }));
    await expect(heading(page, 'Fluid Mechanics')).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('.rk-head .rk-meta')).toHaveText(
      /^No platform code yet\s*The Content Manager adds it in Course codes$/,
    );
    await expect(region(page, 'Course').locator('dd').nth(3)).toHaveText('No platform code yet');
    await expect(region(page, 'History').locator('li')).toHaveText([
      /^Course added by Arjun Mehta\s*24 Aug 2026\s*Mechanical & Manufacturing · no platform code yet\.$/,
    ]);
    await checkState(page, 'Fluid Mechanics');

    // Thermodynamics & Heat Transfer (the export’s course render): Rename to the same name.
    await push(page, '/admin/structure/courses/thermodynamics-heat-transfer');
    await expect(heading(page, 'Thermodynamics & Heat Transfer')).toBeVisible({ timeout: 60_000 });
    await checkState(page, 'Thermodynamics & Heat Transfer');
    await shot(page, 'structure-course');
    const rename = panel(page).getByRole('button', { name: 'Rename' });
    await reachAndClick(page, rename);
    const dialog = page.getByRole('dialog', { name: 'Rename Thermodynamics & Heat Transfer' });
    const name = dialog.getByRole('textbox', { name: 'Course name' });
    await expect(name).toBeFocused();
    await expect(name).toHaveValue('Thermodynamics & Heat Transfer');
    await expect(dialog).toContainText(
      'The new name shows in the public catalogue, vendor course lists and student-import matching. The platform course code doesn’t change.',
    );
    await reachAndClick(page, dialog.getByRole('button', { name: 'Save name' }));
    await expect(dialog).toContainText('Enter a different name — this is the current one');
    await expect(name).toBeFocused();
    await settled(dialog);
    await checkState(page, 'Thermodynamics & Heat Transfer');
    await dialogShot(page, 'structure-rename-validation');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Cancel' }));
    await expect(dialog).toBeHidden();
    await expect(rename).toBeFocused();

    // Power Electronics: renamed and its description edited.
    await push(page, '/admin/structure/courses/power-electronics');
    await expect(heading(page, 'Power Electronics')).toBeVisible({ timeout: 60_000 });
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Rename' }));
    const renameDialog = page.getByRole('dialog', { name: 'Rename Power Electronics' });
    await renameDialog
      .getByRole('textbox', { name: 'Course name' })
      .fill('Power Electronics & Drives');
    await reachAndClick(page, renameDialog.getByRole('button', { name: 'Save name' }));
    await expect(renameDialog).toBeHidden();
    await expect(heading(page, 'Power Electronics & Drives')).toBeVisible();
    await expect(flash(page)).toHaveText('The course is now called Power Electronics & Drives.');
    await expect(flash(page)).toBeFocused();
    await expect(historyWhats(page).first()).toHaveText('Renamed by Arjun Mehta');
    await expect(region(page, 'History').locator('.rk-tl-n').first()).toHaveText(
      'Was “Power Electronics”.',
    );
    await checkState(page, 'Power Electronics & Drives');
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Edit description' }));
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
    await expect(region(page, 'Course').locator('dd').nth(2)).toHaveText(
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
    // CM-09 (V3, CM-v1): the courses under their areas' bands, in the areas' order.
    await expect(main(page).locator('tbody tr.cm-area .cm-grp-name')).toHaveText([
      'Mechanical & Manufacturing',
      'Electrical & Electronics',
      'Chemical & Process',
    ]);
    await expect(main(page).locator('tbody .cm-course-t')).toHaveText([
      'Thermodynamics & Heat Transfer',
      'Manufacturing Processes',
      'Fluid Mechanics',
      'Electrical Machines',
      'Power Electronics & Drives',
      'Process Instrumentation & Control',
    ]);
    await expectSameDocument(page, mark);
  });

  test('Move: blocked while people are filed (`sa15-move-blocked`), allowed without — the course under its new area on the public pages', async ({
    page,
  }) => {
    await open(
      page,
      '/admin/structure/courses/thermodynamics-heat-transfer',
      'Thermodynamics & Heat Transfer',
    );
    const mark = await markDocument(page);
    await expect(region(page, 'What uses this course').locator('dd')).toHaveText([
      '4',
      'Godavari Institute of Technology (MEC-523)',
      'Anil Shetty',
      '12 students · Dr S. Ranganathan — Godavari Institute of Technology',
    ]);
    await expect(panel(page).locator('.rk-notice--off')).toHaveText(
      /^This course can’t be moved\s*People are filed against it: 12 students · Dr S\. Ranganathan — Godavari Institute of Technology\. Nothing moves\.$/,
    );
    await expect(panel(page).getByRole('button', { name: 'Move to another area' })).toHaveCount(0);
    await checkState(page, 'Thermodynamics & Heat Transfer');
    await shot(page, 'state-sa15-move-blocked');
    // Under 860 px the panel follows the record; “Go to changes” takes the reader to it.
    if (width(page) < 860) {
      // As the export's `goPanel`: the panel scrolls into view and its heading takes focus; the
      // address does not change.
      const before = page.url();
      await press(page, main(page).getByRole('link', { name: 'Go to changes' }));
      const heading = panel(page).getByRole('heading', { name: 'Change this course' });
      await expect(heading).toBeFocused();
      await expect(heading).toBeInViewport();
      expect(page.url()).toBe(before);
    }

    // Manufacturing Processes — nobody filed; the move dialog lists every other area.
    await push(page, '/admin/structure/courses/manufacturing-processes');
    await expect(heading(page, 'Manufacturing Processes')).toBeVisible({ timeout: 60_000 });
    await expect(panel(page)).toContainText(
      'Nobody is filed against it. Its experiments and the access plans that use it move with it.',
    );
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Move to another area' }));
    const dialog = page.getByRole('dialog', {
      name: 'Move Manufacturing Processes to another area?',
    });
    const to = dialog.getByRole('combobox', { name: 'Move to' });
    await expect(to).toBeFocused();
    await expect(to.locator('option')).toHaveText([
      'Choose an area',
      'Electrical & Electronics',
      'Chemical & Process',
    ]);
    await settled(dialog);
    await checkState(page, 'Manufacturing Processes');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Move course' }));
    await expect(dialog).toContainText('Choose the area to move it to');
    await expect(to).toBeFocused();
    await dialogShot(page, 'structure-move-validation');
    await to.selectOption({ label: 'Electrical & Electronics' });
    await reachAndClick(page, dialog.getByRole('button', { name: 'Move course' }));
    await expect(dialog).toBeHidden();
    await expect(flash(page)).toHaveText('The course moved to Electrical & Electronics.');
    await expect(flash(page)).toBeFocused();
    await expect(main(page).locator('.rk-head .rk-eyebrow')).toHaveText(
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
  test('as drawn (`V.area`); a description changed elsewhere is refused calmly; Rename refuses a taken name; Add course from the area', async ({
    page,
  }) => {
    await open(page, '/admin/structure', 'Academic structure');
    await press(page, main(page).getByRole('link', { name: 'Open area Chemical & Process' }));
    await expect(heading(page, 'Chemical & Process')).toBeVisible({ timeout: 60_000 });
    await expect(page).toHaveURL(/\/admin\/structure\/areas\/chemical-process$/);
    await expect(main(page).locator('.rk-head .rk-eyebrow')).toHaveText('Engineering area');
    await expect(main(page).locator('.rk-head .rk-sub')).toHaveText(
      'Distillation, process control and flow measurement.',
    );
    await expect(headActions(page).getByRole('button')).toHaveText(['Rename', 'Edit description']);
    const courses = region(page, 'Courses');
    await expect(rows(courses)).toHaveText([/^Process Instrumentation & Control\s*CHE ZG513$/]);
    await expect(main(page).locator('p.sa-footnote')).toHaveText(
      'Areas have no artwork set here, and can’t be retired.',
    );
    await expect(historyWhats(page)).toHaveText(['Area added by Arjun Mehta']);
    await checkState(page, 'Chemical & Process');
    await shot(page, 'structure-area');

    // Edit description, while another session changes it first (set-up through the CI seam).
    await reachAndClick(page, headActions(page).getByRole('button', { name: 'Edit description' }));
    const dialog = page.getByRole('dialog', { name: 'Edit the description of Chemical & Process' });
    const field = dialog.getByRole('textbox', { name: 'Description' });
    await expect(field).toBeFocused();
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
    await expect(main(page).locator('.rk-head .rk-sub')).toHaveText(
      'Distillation and process control.',
    );
    await settled(dialog);
    await checkState(page, 'Chemical & Process');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Save description' }));
    await expect(dialog).toBeHidden();
    await expect(flash(page)).toHaveText('Description saved.');
    await expect(main(page).locator('.rk-head .rk-sub')).toHaveText(
      'Distillation, process control, flow measurement and mass transfer.',
    );

    // Rename: a taken name is the service’s answer, under the field; Esc writes nothing.
    await reachAndClick(page, headActions(page).getByRole('button', { name: 'Rename' }));
    const rename = page.getByRole('dialog', { name: 'Rename Chemical & Process' });
    const name = rename.getByRole('textbox', { name: 'Area name' });
    await name.fill('Electrical & Electronics');
    await reachAndClick(page, rename.getByRole('button', { name: 'Save name' }));
    await expect(rename).toContainText('There is already an area called Electrical & Electronics');
    await expect(name).toBeFocused();
    await settled(rename);
    await checkState(page, 'Chemical & Process');
    await page.keyboard.press('Escape');
    await expect(rename).toBeHidden();
    await expect(headActions(page).getByRole('button', { name: 'Rename' })).toBeFocused();

    // Add course from the area: this area is chosen already; added, it is listed here.
    await reachAndClick(page, courses.getByRole('button', { name: 'Add course' }));
    const add = page.getByRole('dialog', { name: 'Add a course' });
    await expect(add.getByRole('combobox', { name: 'Engineering area' })).toHaveValue(
      'chemical-process',
    );
    await add.getByRole('textbox', { name: 'Course name' }).pressSequentially('Mass Transfer');
    await reachAndClick(page, add.getByRole('button', { name: 'Add course' }));
    await expect(add).toBeHidden();
    await expect(flash(page)).toHaveText(
      /^Mass Transfer was added\.\s*The Content Manager adds its platform course code\.$/,
    );
    await expect(rows(courses)).toHaveText([
      /^Process Instrumentation & Control\s*CHE ZG513$/,
      /^Mass Transfer\s*No platform code yet$/,
    ]);
    await checkState(page, 'Chemical & Process');

    // An address that names no record: the GL-04 message in the shell.
    await push(page, '/admin/structure/areas/zz-none');
    await expect(heading(page, 'This page isn’t available')).toBeVisible({ timeout: 60_000 });
    await checkState(page, 'This page isn’t available');
  });
});
