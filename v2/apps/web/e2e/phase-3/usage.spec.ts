import { expect, type Page, test } from '@playwright/test';

import { bootWorld, reachAndClick, reportRuntime, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, PAUSED_INSTITUTE_ADMIN } from '../support/workspace';

/**
 * IA-20 Usage in the V3 design (the owner-approved export design/v3-refined-b/roles/IA-v1,
 * `Main.dc.html` IA-20) on the test-hook build, at 1440, 1024, 768 and 375. Each drawn state passes
 * `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer
 * surface, no sideways scroll) and shows no internal reference. Worlds: after Flow B (Rahul given
 * Shell-and-Tube, nothing opened: the experiment's own "No activity yet"), after Flow C (WEB and VR
 * completed), after the device flow; the runtime's own reports (the CI seam) move the figures in
 * the same tab.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const MEERA = { personId: 'per-0001' };
const RAHUL = { personId: 'per-0002' };
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const COURSE_CAPTION = /^Usage by course\. /;

async function open(
  page: Page,
  fixture: string,
  person: { readonly personId: string },
  path: string,
): Promise<void> {
  await bootWorld(page, { fixture, session: person });
  await page.goto(path);
}

const main = (page: Page) => page.locator('main');
const viewSwitch = (page: Page) => page.getByRole('group', { name: 'View usage' });

/** Every internal record reference the Institute Admin's pages keep out of their words. */
const IA_REFERENCE = /\b(?:REQ|ACC|SACC|GRP|FMAP|UPD|DTR|SUP|SUB)-\d+/;

/** No internal reference in the page's words, names, placeholders or tab title (identifier rule). */
async function expectNoIaReferences(page: Page): Promise<void> {
  const found = await page.evaluate((source) => {
    const pattern = new RegExp(source);
    const named = [...document.querySelectorAll('[aria-label], [title], [placeholder]')].flatMap(
      (element) =>
        ['aria-label', 'title', 'placeholder'].map((name) => element.getAttribute(name) ?? ''),
    );
    return [document.querySelector('main')?.textContent ?? '', document.title, ...named].filter(
      (text) => pattern.test(text),
    );
  }, IA_REFERENCE.source);
  expect(found).toEqual([]);
}

/** A table's body rows as their cells' text, without the labels phones show (`ia-lt-lab`). */
async function cells(page: Page, name: string | RegExp): Promise<string[][]> {
  return page
    .getByRole('table', { name })
    .locator('tbody tr')
    .evaluateAll((rows) =>
      rows.map((row) =>
        [...row.querySelectorAll('td')].map((cell) => {
          const copy = cell.cloneNode(true) as HTMLElement;
          for (const label of copy.querySelectorAll('.ia-lt-lab')) label.remove();
          return copy.textContent ?? '';
        }),
      ),
    );
}

test.describe('IA-20 Usage', () => {
  test('by experiment and format: the figures per format, what they mean beside them', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', MEERA, '/institute/usage');
    const section = page.getByRole('region', { name: SHELL_NAME });
    await expect(section).toBeVisible();
    await expect(main(page).locator('.rk-head .rk-sub')).toHaveText(
      'How your content is being used · figures up to 27 Oct 2026',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/usage');
    await expect(
      viewSwitch(page).getByRole('button', { name: 'By experiment and format' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(section.locator('.ia-shead-sub')).toHaveText('ME ZG523');
    await expect(section.locator('.ia-shead-n')).toHaveText('1 student with access');
    expect(await cells(page, `Usage by format for ${SHELL_NAME}`)).toEqual([
      ['WEBBrowser', '1', '1', '1'],
      ['VRVirtual reality', '1', '1', '1'],
    ]);
    await expect(
      page.getByRole('region', { name: 'What the figures mean' }).locator('dt'),
    ).toHaveText(['Students with access', 'Started', 'Completed', 'Sessions']);
    // Phones: the figures sit three across, each with its label above it; the head row is hidden.
    const width = page.viewportSize()?.width ?? 1440;
    const label = section.locator('tbody tr:first-child td.ia-lt-num .ia-lt-lab').first();
    if (width < 768) {
      await expect(label).toBeVisible();
      await expect(label).toHaveText('Started');
    } else {
      await expect(section.locator('thead')).toBeVisible();
    }
    await checkState(page, 'Usage');
    await expectNoIaReferences(page);
  });

  test('by course: the view switch mirrors into the address; started and completed stay per format', async ({
    page,
  }) => {
    await open(page, 'after-flow-device', MEERA, '/institute/usage');
    await expect(page.getByRole('region', { name: SHELL_NAME })).toBeVisible();
    await reachAndClick(page, viewSwitch(page).getByRole('button', { name: 'By course' }));
    await expect(page).toHaveURL(/\/institute\/usage\?view=course$/);
    await expect(viewSwitch(page).getByRole('button', { name: 'By course' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const table = page.getByRole('table', { name: COURSE_CAPTION });
    await expect(table.locator('th')).toHaveText([
      'Course',
      'Experiments given',
      'Students with access',
      'Sessions by format',
    ]);
    expect(await cells(page, COURSE_CAPTION)).toEqual([
      ['Thermodynamics & Heat TransferME ZG523', '1', '1', 'WEB 1 · VR 1'],
    ]);
    await expect(page.getByRole('region', { name: SHELL_NAME })).toHaveCount(0);
    await checkState(page, 'Usage');
    await expectNoIaReferences(page);

    await reachAndClick(
      page,
      viewSwitch(page).getByRole('button', { name: 'By experiment and format' }),
    );
    await expect(page).toHaveURL(/\/institute\/usage$/);
    await expect(page.getByRole('region', { name: SHELL_NAME })).toBeVisible();
  });

  test('the course view by its address; an unknown view becomes the bare address', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', MEERA, '/institute/usage?view=course');
    await expect(page.getByRole('table', { name: COURSE_CAPTION })).toBeVisible();
    await page.goto('/institute/usage?view=charts');
    await expect(page).toHaveURL(/\/institute\/usage$/);
    await expect(page.getByRole('region', { name: SHELL_NAME })).toBeVisible();
  });

  test('no activity yet: the experiment says so, with “Open Student access” (IA-v1 st-ia20-empty)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', MEERA, '/institute/usage');
    const section = page.getByRole('region', { name: SHELL_NAME });
    await expect(section.getByRole('heading', { level: 3, name: 'No activity yet' })).toBeVisible();
    await expect(section.locator('.rk-state')).toContainText(
      'Figures appear when students open the experiments you’ve given them.',
    );
    await expect(viewSwitch(page)).toBeVisible();
    await expect(page.getByRole('region', { name: 'What the figures mean' })).toBeVisible();
    await expect(main(page).locator('.rk-head .rk-sub')).toHaveText(
      'How your content is being used',
    );
    await checkState(page, 'Usage');
    await expectNoIaReferences(page);
    await reachAndClick(page, section.getByRole('link', { name: 'Open Student access' }));
    await expect(page).toHaveURL(/\/institute\/student-access$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Student access' })).toBeVisible();
  });

  test('the runtime’s own reports move the figures in the same tab — per format, never summed', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', MEERA, '/institute/usage');
    await expect(page.getByRole('heading', { level: 3, name: 'No activity yet' })).toBeVisible();
    await reportRuntime(page, {
      person: RAHUL,
      experimentId: SHELL,
      format: 'web',
      kind: 'opened',
    });
    const caption = `Usage by format for ${SHELL_NAME}`;
    await expect(page.getByRole('table', { name: caption })).toBeVisible();
    await expect
      .poll(() => cells(page, caption))
      .toEqual([
        ['WEBBrowser', '1', '0', '1'],
        ['VRVirtual reality', '0', '0', '0'],
      ]);
    await reportRuntime(page, {
      person: RAHUL,
      experimentId: SHELL,
      format: 'web',
      kind: 'completed',
    });
    await expect
      .poll(() => cells(page, caption))
      .toEqual([
        ['WEBBrowser', '1', '1', '1'],
        ['VRVirtual reality', '0', '0', '0'],
      ]);
    await checkState(page, 'Usage');
  });

  test('a paused institution’s Institute Admin: the paused notice (IA-v1 st-ia20-paused)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', PAUSED_INSTITUTE_ADMIN, '/institute/usage');
    const notice = main(page).locator('.rk-notice--paused');
    await expect(notice).toContainText('Your institution’s access is paused');
    await expect(notice).toContainText('nobody counts as having access today');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/usage');
    await checkState(page, 'Usage');
    await expectNoIaReferences(page);
  });
});
