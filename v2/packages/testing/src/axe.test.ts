// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import {
  assertNoAxeViolations,
  ComponentAxeError,
  JSDOM_UNSUPPORTED_RULES,
  runAxe,
} from './axe.js';

function mount(html: string): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.append(container);
  return container;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('component axe checks (@xr/testing/axe)', () => {
  it('passes accessible markup', async () => {
    const container = mount(
      '<button type="button">Save draft</button><label for="t">Title</label><input id="t" />',
    );
    const results = await assertNoAxeViolations(container);
    expect(results.violations).toEqual([]);
  });

  it('fails an unnamed button and an unlabelled field, naming rule and node', async () => {
    const container = mount('<button type="button"></button><input id="untitled" />');
    const error = await assertNoAxeViolations(container).then(
      () => null,
      (failure: unknown) => failure,
    );
    expect(error).toBeInstanceOf(ComponentAxeError);
    const ids = (error as ComponentAxeError).violations.map((violation) => violation.id).sort();
    expect(ids).toEqual(['button-name', 'label']);
    expect((error as Error).message).toContain('#untitled');
  });

  it('switches off only the rules jsdom cannot judge, each with its reason', async () => {
    expect(JSDOM_UNSUPPORTED_RULES.map((rule) => rule.id)).toEqual([
      'color-contrast',
      'target-size',
    ]);
    expect(JSDOM_UNSUPPORTED_RULES.every((rule) => rule.reason.length > 0)).toBe(true);
    const results = await runAxe(mount('<p style="color:#fff;background:#fff">Low contrast</p>'));
    expect(results.violations).toEqual([]);
  });

  it('refuses to switch a rule off without a reason', async () => {
    await expect(
      runAxe(mount('<p>Text</p>'), { disableRules: [{ id: 'label', reason: '' }] }),
    ).rejects.toThrow('Disabling axe rule "label" needs a reason.');
  });
});
