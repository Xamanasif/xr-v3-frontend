// Opening a v46 board in the harness, proving it rendered completely, and enumerating its frames
// (Appendix E §9.1 steps 5–7). Product frames come from `derived/frame-index.json`; the Batch-0
// specimen boards are not in that index and are enumerated directly from the rendered DOM.
import { readFileSync } from 'node:fs';

import { FRAME_INDEX } from './paths.mjs';

/** Harness-only CSS for the cropped Batch 1–3 frames (START-HERE known exception 3). */
export const UNCROP_CSS = '.b1-frame{height:auto!important;overflow:visible!important}';

/**
 * Harness-only CSS: the canvas frames' presentation `min-height` (board 07's `f.h` 760–1060, the
 * 900 px canvas default) becomes the capture viewport height, which is what the product's
 * `.xr-app{min-height:100dvh}` (PF-02) gives at that viewport. Fixed frame heights are canvas
 * chrome (Appendix E §2.5 group 1, §10 item 2); a frame whose content is taller still grows.
 */
export function frameHeightCss(height) {
  return `.doc-frame > .xr-app, .doc-frame > .xr-app > .xr-shell { min-height: ${height}px !important; }`;
}

/** Frame-index entries of one board, in frame order. */
export function indexedFrames(boardFile) {
  const { frames } = JSON.parse(readFileSync(FRAME_INDEX, 'utf8'));
  return frames
    .filter((frame) => frame.board === boardFile)
    .sort((left, right) => left.frame - right.frame);
}

/** `<board>-f<index>-<caption slug>` (Appendix E §9.1 step 6). */
export function slug(text) {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
    .replace(/-+$/g, '');
}

export function frameName(boardId, index, caption) {
  return `${boardId}-f${index}-${slug(caption)}`;
}

/**
 * Loads a board from the scratch server and waits until the canvas runtime has finished:
 * `#dc-root` holds the rendered template, the runtime reports no streaming, web fonts are ready,
 * the DOM has been quiet for 300 ms, and no `{{` template marker is left in text or attributes.
 * `props` are canvas props (board 05's role and banner) applied through the runtime's own
 * `__dcSetProps` before the checks. Returns what the run report records.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function openBoard(
  page,
  origin,
  boardFile,
  { props, uncrop = false, frameMinHeight } = {},
) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${origin}/${boardFile}`);
  await page.waitForFunction(
    () => document.querySelector('#dc-root .sc-host')?.childElementCount > 0,
    null,
    { timeout: 60_000 },
  );
  if (props) {
    await page.evaluate((overrides) => {
      const runtime = /** @type {any} */ (window);
      runtime.__dcSetProps(runtime.__dcRootName(), overrides);
    }, props);
  }
  if (uncrop) await page.addStyleTag({ content: UNCROP_CSS });
  if (frameMinHeight) await page.addStyleTag({ content: frameHeightCss(frameMinHeight) });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    () => {
      const runtime = /** @type {any} */ (window);
      const name = runtime.__dcRootName?.();
      if (name && runtime.__dcStreaming?.(name)) return false;
      const state = /** @type {any} */ (window).__boardQuiet;
      if (!state) {
        const record = { last: performance.now() };
        new MutationObserver(() => {
          record.last = performance.now();
        }).observe(document.body, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        });
        /** @type {any} */ (window).__boardQuiet = record;
        return false;
      }
      return performance.now() - state.last > 300;
    },
    null,
    { timeout: 30_000, polling: 100 },
  );
  const facts = await page.evaluate(() => {
    const root = document.querySelector('#dc-root');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let markersInText = 0;
    while (walker.nextNode()) if (walker.currentNode.nodeValue.includes('{{')) markersInText += 1;
    let markersInAttributes = 0;
    for (const element of root.querySelectorAll('*')) {
      for (const attribute of element.attributes) {
        if (attribute.value.includes('{{')) markersInAttributes += 1;
      }
    }
    const faces = [...document.fonts].filter((face) => face.family.includes('Public Sans'));
    return {
      title: document.title,
      markersInText,
      markersInAttributes,
      publicSansReady: document.fonts.check('16px "Public Sans"', 'Ag'),
      publicSansLoadedFaces: faces.filter((face) => face.status === 'loaded').length,
      publicSansFailedFaces: faces.filter((face) => face.status === 'error').length,
    };
  });
  return { ...facts, errors };
}

/**
 * Direct enumeration of a Batch-0 specimen board (not in frame-index): every `.doc-frame` in
 * document order, captioned by the nearest `.doc-label` before it (else its section title), and
 * every `section.doc-sec` by its title. Returns `{ frames, sections }` of
 * `{ index, caption, section }`.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function enumerateBatch0(page) {
  return page.evaluate(() => {
    const root = document.querySelector('#dc-root');
    const all = [...root.querySelectorAll('.doc-label, .doc-frame, section.doc-sec')];
    const sectionOf = (element) =>
      element.closest('section.doc-sec')?.querySelector('.doc-sec-title')?.textContent.trim() ?? '';
    const frames = [];
    let label = '';
    for (const element of all) {
      if (element.classList.contains('doc-label')) label = element.textContent.trim();
      else if (element.classList.contains('doc-frame')) {
        frames.push({
          index: frames.length,
          caption: label || sectionOf(element),
          section: sectionOf(element),
        });
        label = '';
      } else label = '';
    }
    const sections = [...root.querySelectorAll('section.doc-sec')].map((section, index) => ({
      index,
      caption: section.querySelector('.doc-sec-title')?.textContent.trim() ?? '',
    }));
    return { frames, sections };
  });
}

/**
 * Changes a mounted board's canvas props in place (board 05: role, banner, startWithMenuOpen)
 * through the runtime's own `__dcSetProps`, then waits for the DOM to settle and re-checks that no
 * template marker is left in text or attributes (any left throws). Returns the marker count.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function setBoardProps(page, props) {
  await page.evaluate((overrides) => {
    const runtime = /** @type {any} */ (window);
    runtime.__dcSetProps(runtime.__dcRootName(), overrides);
    // The MutationObserver of openBoard keeps updating this same record.
    runtime.__boardQuiet.last = performance.now();
  }, props);
  await page.waitForFunction(
    () => performance.now() - /** @type {any} */ (window).__boardQuiet.last > 300,
    null,
    {
      timeout: 30_000,
      polling: 100,
    },
  );
  const result = await page.evaluate(() => {
    const root = document.querySelector('#dc-root');
    let markers = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) if (walker.currentNode.nodeValue.includes('{{')) markers += 1;
    for (const element of root.querySelectorAll('*')) {
      for (const attribute of element.attributes) if (attribute.value.includes('{{')) markers += 1;
    }
    return { markers };
  });
  if (result.markers > 0) {
    throw new Error(`${result.markers} template markers left after ${JSON.stringify(props)}`);
  }
  return result;
}
