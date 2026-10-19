/**
 * The Super Admin's Platform roles components (owner-approved export design/v3-refined-b/roles/SA-v1,
 * `project/sa-views-d.js` `V.holder`): the scope rows with the inline withdraw form (`sa-scopes`,
 * `sa-scope-row`, `InlineForm`). Markup against the export's classes and ARIA, the class contract
 * and the accessibility checks. The holders' e-mail line (`QuietLine` `flush`) and the panel's
 * button (`GoButton`) are in `sa.test.tsx`, the Register and Restore dialogs (`ConfirmDialog`) in
 * `dialog.test.tsx`.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import {
  assertNoAxeViolations,
  expectNoInternalReferences,
  expectV3ClassesOnly,
  saExportText,
} from '../testing/index.js';
import { Button } from './actions.js';
import { Field, Textarea } from './fields.js';
import { ButtonRow, InlineForm } from './sa.js';
import { ScopeItem, ScopeList } from './sa-roles.js';

const VIEWS = saExportText('sa-views-d.js');

describe('the scope rows (SA-17 “Can act on”, “Withdrawn”)', () => {
  it('draws the export’s list, row, title and quiet line; a course scope leads with its code chip', async () => {
    for (const piece of [
      '<ul class="sa-scopes">',
      '<li><div class="sa-scope-row"><div><p class="sa-scope-t">',
      '<p class="rk-small">Assigned ',
      '<div class="sa-inline">',
    ]) {
      expect(VIEWS).toContain(piece);
    }
    const { container } = render(
      <section aria-label="Can act on">
        <ScopeList>
          <ScopeItem
            code="ME ZG523"
            title="Thermodynamics & Heat Transfer"
            detail="Assigned 2 Jun 2026"
            action={
              <Button
                variant="ghost"
                aria-label="Withdraw scope ME ZG523 · Thermodynamics & Heat Transfer"
              >
                Withdraw
              </Button>
            }
          />
          <ScopeItem title="All experiments" detail="Assigned 2 Jun 2026" />
        </ScopeList>
      </section>,
    );
    const list = container.querySelector('ul.sa-scopes')!;
    const rows = [...list.querySelectorAll(':scope > li > div.sa-scope-row')];
    expect(rows).toHaveLength(2);
    expect(rows[0]!.querySelector('p.sa-scope-t > span.rk-code')?.textContent).toBe('ME ZG523');
    expect(rows[0]!.querySelector('p.sa-scope-t')?.textContent).toBe(
      'ME ZG523 Thermodynamics & Heat Transfer',
    );
    expect(rows[0]!.querySelector(':scope > div > p.rk-small')?.textContent).toBe(
      'Assigned 2 Jun 2026',
    );
    expect(rows[0]!.lastElementChild?.matches('button.rb-btn.rb-btn--ghost')).toBe(true);
    expect(
      screen.getByRole('button', {
        name: 'Withdraw scope ME ZG523 · Thermodynamics & Heat Transfer',
      }),
    ).toHaveTextContent('Withdraw');
    // No code: the name alone, no chip; no action: nothing after the text.
    expect(rows[1]!.querySelector('.rk-code')).toBeNull();
    expect(rows[1]!.children).toHaveLength(1);
    expectV3ClassesOnly(container);
    expectNoInternalReferences(container);
    await assertNoAxeViolations(container);
  });

  it('the open inline form sits below its row, in `sa-inline`, with the field and the buttons', async () => {
    function Example() {
      const [open, setOpen] = useState(true);
      return (
        <ScopeList>
          <ScopeItem
            code="ME ZG523"
            title="Thermodynamics & Heat Transfer"
            detail="Assigned 2 Jun 2026"
            action={open ? null : <Button variant="ghost">Withdraw</Button>}
          >
            {open ? (
              <InlineForm>
                <Field
                  id="wd-r"
                  label="Reason for withdrawing ME ZG523"
                  hint="Kept with the scope in the history."
                  error="Add a reason — it is kept in the history"
                >
                  <Textarea />
                </Field>
                <ButtonRow>
                  <Button variant="navy">Withdraw scope</Button>
                  <Button onClick={() => setOpen(false)}>Cancel</Button>
                </ButtonRow>
              </InlineForm>
            ) : null}
          </ScopeItem>
        </ScopeList>
      );
    }
    const { container } = render(<Example />);
    const item = container.querySelector('ul.sa-scopes > li')!;
    expect([...item.children].map((child) => child.className)).toEqual([
      'sa-scope-row',
      'sa-inline',
    ]);
    // The row has no action while its form is open.
    expect(item.querySelector('.sa-scope-row button')).toBeNull();
    const reason = screen.getByRole('textbox', { name: 'Reason for withdrawing ME ZG523' });
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(reason).toHaveAccessibleDescription(
      'Kept with the scope in the history. Add a reason — it is kept in the history',
    );
    expect(item.querySelector('.sa-inline > .sa-btnrow > .rb-btn--navy')?.textContent).toBe(
      'Withdraw scope',
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(container.querySelector('.sa-inline')).toBeNull();
    expect(screen.getByRole('button', { name: 'Withdraw' })).toBeVisible();
  });
});
