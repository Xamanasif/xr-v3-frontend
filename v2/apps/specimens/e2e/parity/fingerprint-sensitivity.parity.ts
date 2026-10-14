import type { Locator, Page } from '@playwright/test';

import {
  contentFingerprintOf,
  fingerprintOf,
} from '../../../../tools/board-capture/src/parity.mjs';
import { expect, test } from './support';

/**
 * The regression test of the two pinned fingerprints (WP-0.16 review of the WP-0.15 supplement).
 * A registered comparison whose captures differ in size has no pixel count, so only its pinned
 * fingerprints (`fingerprintOf`, `contentFingerprintOf`) stop it absorbing another change. Each
 * case changes one thing a person would see on a real `@xr/ui` control of the board 03 specimen
 * page — form values, placeholder words and colour, input padding, checked / selected / disabled
 * states, the native accent colour, a border style, a `::before` — and must change the
 * supplementary fingerprint; undoing it must give back exactly the first fingerprints (they are
 * deterministic). No board is opened and nothing is compared or pinned here.
 */
interface Case {
  readonly name: string;
  readonly item: string;
  /** Applies the change on the page and returns how to undo it. */
  readonly change: (page: Page) => Promise<() => Promise<unknown>>;
}

const RED = 'rgb(180, 35, 24)';

function setProperty(selector: string, property: string, value: unknown) {
  return async (page: Page) => {
    const control = page.locator(selector);
    const before = await control.evaluate(
      (element, [key, next]) => {
        const record = element as unknown as Record<string, unknown>;
        const previous = record[key as string];
        record[key as string] = next;
        return previous;
      },
      [property, value] as const,
    );
    return () =>
      control.evaluate(
        (element, [key, previous]) => {
          (element as unknown as Record<string, unknown>)[key as string] = previous;
        },
        [property, before] as const,
      );
  };
}

function setStyle(selector: string, declarations: string) {
  return async (page: Page) => {
    const element = page.locator(selector);
    const before = await element.evaluate((node, css) => {
      const previous = node.getAttribute('style');
      node.setAttribute('style', `${previous ?? ''};${css}`);
      return previous;
    }, declarations);
    return () =>
      element.evaluate((node, previous) => {
        if (previous === null) node.removeAttribute('style');
        else node.setAttribute('style', previous);
      }, before);
  };
}

function addRule(rule: string) {
  return async (page: Page) => {
    const handle = await page.addStyleTag({ content: rule });
    return () => handle.evaluate((node) => (node as Element).remove());
  };
}

const CASES: readonly Case[] = [
  {
    name: 'text input value',
    item: 'field-text-focused',
    change: setProperty('#c-in2', 'value', 'Rahul Verm'),
  },
  {
    name: 'placeholder words',
    item: 'field-text-empty',
    change: setProperty('#c-in1', 'placeholder', 'For example, Rahul Varma'),
  },
  {
    name: 'placeholder colour',
    item: 'field-text-empty',
    change: addRule(`#c-in1::placeholder { color: ${RED} }`),
  },
  {
    name: 'input padding (1 px)',
    item: 'field-text-empty',
    change: setStyle('#c-in1', 'padding-left: 15px'),
  },
  {
    name: 'disabled control',
    item: 'field-text-empty',
    change: setProperty('#c-in1', 'disabled', true),
  },
  {
    name: 'textarea value',
    item: 'field-textarea',
    change: setProperty('#c-ta', 'value', 'The VR simulation stopped loading at the third step.'),
  },
  {
    name: 'selected option',
    item: 'field-select',
    change: setProperty('#c-sel', 'selectedIndex', 1),
  },
  {
    name: 'checkbox checked',
    item: 'field-checkboxes',
    change: setProperty('[data-parity="field-checkboxes"] input >> nth=1', 'checked', true),
  },
  {
    name: 'radio checked',
    item: 'field-radios',
    // Checking B unchecks A (one radio group), so undoing it checks A again.
    change: async (page) => {
      const radios = page.locator('[data-parity="field-radios"] input');
      await radios.nth(1).evaluate((radio: HTMLInputElement) => (radio.checked = true));
      return () => radios.nth(0).evaluate((radio: HTMLInputElement) => (radio.checked = true));
    },
  },
  {
    name: 'checkbox accent colour',
    item: 'field-checkboxes',
    change: setStyle('[data-parity="field-checkboxes"] input >> nth=0', `accent-color: ${RED}`),
  },
  {
    name: 'border style (solid → dashed, same width and colour)',
    item: 'field-read-only',
    change: setStyle('[data-parity="field-read-only"] > .xr-ro', 'border-style: dashed'),
  },
  {
    name: 'timeline ::before colour',
    item: 'timeline',
    change: addRule(`[data-parity="timeline"] .xr-tl::before { background: ${RED} }`),
  },
];

/**
 * Waits until the change is drawn. The v46 reduced-motion rule gives every element
 * `transition-duration: .01ms` while `transition-property` stays `all`, so an animatable change
 * (padding, accent colour) is read as its old value until its transition ends; a transition that a
 * later change cancels rejects `finished` with an AbortError, which counts as settled.
 */
async function settled(page: Page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all(
      document.getAnimations().map((animation) => animation.finished.catch(() => null)),
    );
  });
}

async function fingerprints(root: Locator) {
  const [main, content] = await Promise.all([fingerprintOf(root), contentFingerprintOf(root)]);
  return { main: main.sha256 as string, content: content.sha256 as string };
}

test('fingerprints · every visible change to a control changes the pinned supplement', async ({
  page,
}) => {
  await page.goto('/p-03-components');
  await page.evaluate(() => document.fonts.ready);
  const rows: string[] = [];
  for (const { name, item, change } of CASES) {
    const root = page.locator(`[data-parity="${item}"] > *`).first();
    const first = await fingerprints(root);
    expect.soft(await fingerprints(root), `${name}: taken twice`).toEqual(first);
    const undo = await change(page);
    await settled(page);
    const changed = await fingerprints(root);
    await undo();
    await settled(page);
    const restored = await fingerprints(root);
    rows.push(
      `${name}: content ${changed.content === first.content ? 'SAME' : 'changed'}, main ${changed.main === first.main ? 'same' : 'changed'}`,
    );
    expect.soft(changed.content, `${name}: the supplement must see it`).not.toBe(first.content);
    expect.soft(restored, `${name}: undone gives the first fingerprints`).toEqual(first);
  }
  test.info().annotations.push({ type: 'fingerprint-sensitivity', description: rows.join('\n') });
  expect(rows).toHaveLength(CASES.length);
});
