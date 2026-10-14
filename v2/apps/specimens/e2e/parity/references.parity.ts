import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Locator, Page, TestInfo } from '@playwright/test';

import {
  enumerateBatch0,
  frameName,
  indexedFrames,
  setBoardProps,
  slug,
} from '../../../../tools/board-capture/src/boards.mjs';
import {
  BATCH0_BOARDS,
  BOARD_05_BANNERS,
  BOARD_05_ROLES,
  LINKED_ERROR_SUMMARY,
} from '../../../../tools/board-capture/src/inventory.mjs';
import { installCaptureNetwork } from '../../../../tools/board-capture/src/network.mjs';
import { runDirectory, stableShot } from '../../../../tools/board-capture/src/parity.mjs';
import { verifiedVendor } from '../../../../tools/board-capture/src/vendor.mjs';
import { expect, test } from './support';

/**
 * The Phase-0 reference captures (WP-0.15; Appendix F §7.5 step 3): every Batch-0 specimen board
 * of the inventory rendered offline by the board-capture harness — frames and sections by direct
 * enumeration (counts pinned in inventory.mjs), board 05's 21 role × banner canvas states plus its
 * open account menu and Help state for every role, and B4-04 frame 3 (counted against
 * frame-index.json). Each capture is named `<board>-f<index>-<caption>` (`-s<index>-` for a
 * section) and listed with its source in `board-references/manifest.json`. Captures only: the
 * comparisons with the product are the other parity specs. Board pages load only localhost and
 * the vendored inputs; any other request fails the test.
 */
interface Captured {
  readonly name: string;
  readonly board: string;
  readonly kind: 'frame' | 'section' | 'state';
  readonly index: number;
  readonly caption: string;
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
}

const manifest: Captured[] = [];

async function capture(
  locator: Locator,
  entry: Omit<Captured, 'width' | 'height' | 'sha256'>,
): Promise<void> {
  const shot = await stableShot(locator);
  const directory = join(runDirectory(), 'board-references');
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, `${entry.name}.png`), shot);
  manifest.push({
    ...entry,
    width: shot.readUInt32BE(16),
    height: shot.readUInt32BE(20),
    sha256: createHash('sha256').update(shot).digest('hex'),
  });
}

function record(testInfo: TestInfo, facts: unknown) {
  testInfo.annotations.push({ type: 'reference-board', description: JSON.stringify(facts) });
}

test.afterAll(() => {
  if (manifest.length === 0) return;
  writeFileSync(
    join(runDirectory(), 'board-references', `manifest-${process.pid}.json`),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
});

for (const board of BATCH0_BOARDS.filter((entry) => entry.id !== '05')) {
  test(`board ${board.id} · frames and sections, by direct enumeration`, async ({
    openBoardPage,
  }, testInfo) => {
    const { page, facts, ledger } = await openBoardPage(board.file, {
      viewport: { width: board.width, height: 900 },
    });
    expect(facts.markersInText + facts.markersInAttributes, 'no template marker left').toBe(0);
    expect(facts.publicSansReady, 'Public Sans ready').toBe(true);
    expect(facts.publicSansFailedFaces).toBe(0);
    const { frames, sections } = await enumerateBatch0(page);
    expect(frames.length, `${board.file} .doc-frame count`).toBe(board.frames);
    expect(sections.length, `${board.file} section count`).toBe(board.sections);
    const frameElements = page.locator('#dc-root .doc-frame');
    for (const frame of frames) {
      await capture(frameElements.nth(frame.index), {
        name: frameName(board.id, frame.index, frame.caption),
        board: board.file,
        kind: 'frame',
        index: frame.index,
        caption: frame.caption,
      });
    }
    const sectionElements = page.locator('#dc-root section.doc-sec');
    for (const section of sections) {
      await capture(sectionElements.nth(section.index), {
        name: `${board.id}-s${section.index}-${slug(section.caption)}`,
        board: board.file,
        kind: 'section',
        index: section.index,
        caption: section.caption,
      });
    }
    expect(ledger.blocked, 'no request left the machine').toEqual([]);
    record(testInfo, {
      board: board.file,
      frames: frames.length,
      sections: sections.length,
      served: ledger.served.length,
      blocked: ledger.blocked.length,
    });
  });
}

test('board 05 · the 21 role × banner canvas states, the open menus and the Help states', async ({
  openBoardPage,
}, testInfo) => {
  const { page, facts, ledger } = await openBoardPage('05-Workspace-Shell.dc.html');
  expect(facts.markersInText + facts.markersInAttributes).toBe(0);
  const app = page.locator('#dc-root .xr-app');
  let index = 0;
  for (const role of BOARD_05_ROLES) {
    for (const banner of BOARD_05_BANNERS) {
      const after = await setBoardProps(page, { role, banner, startWithMenuOpen: false });
      expect(after.markers).toBe(0);
      await expect(page.locator('.xr-acct-btn')).toHaveAttribute(
        'aria-label',
        new RegExp(`, ${role}$`),
      );
      await expect(page.locator('.xr-banner')).toHaveCount(banner === 'None' ? 0 : 1);
      await capture(app, {
        name: frameName('05', index, `${role} ${banner}`),
        board: '05-Workspace-Shell.dc.html',
        kind: 'state',
        index,
        caption: `role = ${role} · banner = ${banner}`,
      });
      index += 1;
    }
  }
  for (const role of BOARD_05_ROLES) {
    await setBoardProps(page, { role, banner: 'None', startWithMenuOpen: true });
    await capture(app, {
      name: frameName('05', index, `${role} account menu open`),
      board: '05-Workspace-Shell.dc.html',
      kind: 'state',
      index,
      caption: `role = ${role} · startWithMenuOpen = true`,
    });
    index += 1;
  }
  for (const role of BOARD_05_ROLES) {
    await setBoardProps(page, { role, banner: 'None', startWithMenuOpen: false });
    await page.locator('aside.xr-side .xr-side-foot a').click();
    await expect(page.locator('header.xr-top .xr-top-title')).toHaveText('Help & support');
    await page.mouse.move(0, 0);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await capture(app, {
      name: frameName('05', index, `${role} help`),
      board: '05-Workspace-Shell.dc.html',
      kind: 'state',
      index,
      caption: `role = ${role} · Help (in the sidebar)`,
    });
    index += 1;
  }
  expect(index).toBe(21 + 7 + 7);
  expect(ledger.blocked).toEqual([]);
  record(testInfo, { board: '05-Workspace-Shell.dc.html', states: index });
});

test('B4-04 · the linked ErrorSummary frame, counted against frame-index.json', async ({
  openBoardPage,
}, testInfo) => {
  const indexed = indexedFrames(LINKED_ERROR_SUMMARY.file);
  expect(indexed).toHaveLength(LINKED_ERROR_SUMMARY.frames);
  const entry = indexed[LINKED_ERROR_SUMMARY.frame]!;
  expect(entry.caption).toBe(LINKED_ERROR_SUMMARY.caption);
  const { page, facts, ledger } = await openBoardPage(LINKED_ERROR_SUMMARY.file);
  expect(facts.markersInText).toBe(0);
  const frames = page.locator('.b1-frame');
  await expect(frames).toHaveCount(LINKED_ERROR_SUMMARY.frames);
  await capture(frames.nth(LINKED_ERROR_SUMMARY.frame), {
    name: frameName('B4-04', LINKED_ERROR_SUMMARY.frame, entry.caption),
    board: LINKED_ERROR_SUMMARY.file,
    kind: 'frame',
    index: LINKED_ERROR_SUMMARY.frame,
    caption: entry.caption,
  });
  expect(ledger.blocked).toEqual([]);
  record(testInfo, { board: LINKED_ERROR_SUMMARY.file, indexed: indexed.length });
});

test('the capture network: localhost and the vendored inputs only; everything else blocked', async ({
  browser,
}) => {
  const context = await browser.newContext();
  const ledger = await installCaptureNetwork(context, verifiedVendor().responses);
  const page: Page = await context.newPage();
  await page.goto(`${process.env['XR_BOARD_ORIGIN']}/support.js`);
  const outcome = await page.evaluate(async () => {
    const attempt = async (url: string) => {
      try {
        const response = await fetch(url, { mode: 'cors' });
        return { url, status: response.status, length: (await response.arrayBuffer()).byteLength };
      } catch {
        return { url, status: 'blocked' };
      }
    };
    return [
      await attempt('https://unpkg.com/react@18.3.1/umd/react.production.min.js'),
      await attempt('https://unpkg.com/react@18.3.0/umd/react.production.min.js'),
      await attempt('https://fonts.googleapis.com/css2?family=Inter&display=swap'),
      await attempt('https://example.com/'),
    ];
  });
  expect(outcome).toEqual([
    {
      url: 'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
      status: 200,
      length: 10751,
    },
    { url: 'https://unpkg.com/react@18.3.0/umd/react.production.min.js', status: 'blocked' },
    { url: 'https://fonts.googleapis.com/css2?family=Inter&display=swap', status: 'blocked' },
    { url: 'https://example.com/', status: 'blocked' },
  ]);
  expect(ledger.blocked).toHaveLength(3);
  expect(ledger.local).toBeGreaterThan(0);
  await context.close();
});
