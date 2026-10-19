/**
 * The Super Admin's Operations components (owner-approved export design/v3-refined-b/roles/SA-v1,
 * `project/sa-views-d.js` `V.accessEnding`): SA-22's list head and row name. Markup against the
 * export's classes and ARIA, the class contract and the accessibility checks. What SA-18 … SA-21
 * share with other screens — the view switch (`SwitchToolbar`), the quiet cell line (`QuietLine`),
 * the section note (`SectionNote`), the decided panel (`DecisionOutcome`) and the panel's one
 * decision (`GoButton`) — is in `sa.test.tsx`.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { assertNoAxeViolations, expectV3ClassesOnly, saExportText } from '../testing/index.js';
import { QuietLine } from './sa.js';
import { OperationsRowHead, OperationsSectionHead } from './sa-operations.js';
import { StatusPill } from './status.js';

const VIEWS = saExportText('sa-views-d.js');

describe('SA-22 Access ending (`V.accessEnding`)', () => {
  it('the list head with its note, the row head with its quiet line, the quiet line under a status', async () => {
    for (const piece of [
      '<div class="rk-sec-h sa-pad"><h2 class="rb-h2">Ending within 15 days, or recently ended</h2><p class="rk-note">As of',
      '<th scope="row" data-label="Institution"><a href="#/institutions/\' + x.i.id + \'">\' + esc(x.i.name) + \'</a><span class="rk-small">',
    ]) {
      expect(VIEWS).toContain(piece);
    }
    const { container } = render(
      <section className="rk-surface" aria-label="Access ending within 15 days, or recently ended">
        <OperationsSectionHead
          title="Ending within 15 days, or recently ended"
          titleId="ae-h"
          note="As of 23 Oct 2026 · soonest first"
        />
        <table className="sa-table sa-table--rows">
          <caption className="xr-sr">Access ending</caption>
          <thead>
            <tr>
              <th scope="col">Institution</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                <OperationsRowHead
                  href="/admin/institutions/konark"
                  name="Konark Polytechnic"
                  detail="External"
                />
              </th>
              <td data-label="Status">
                <StatusPill tone="warn">Reminder due</StatusPill>
                <QuietLine>Nothing is sent from here</QuietLine>
              </td>
            </tr>
          </tbody>
        </table>
      </section>,
    );
    const head = container.querySelector('.rk-sec-h')!;
    expect(head.className).toBe('rk-sec-h sa-pad');
    expect(head.querySelector('h2')).toHaveClass('rb-h2');
    expect(head.querySelector('h2')).toHaveAttribute('id', 'ae-h');
    // `rk-note` is defined by no sheet: the plain paragraph it renders as.
    expect(head.querySelector('p')).toHaveTextContent('As of 23 Oct 2026 · soonest first');
    expect(head.querySelector('p')!.className).toBe('');
    const name = screen.getByRole('link', { name: 'Konark Polytechnic' });
    expect(name).toHaveAttribute('href', '/admin/institutions/konark');
    expect(name.className).toBe('');
    expect(name.nextElementSibling).toHaveClass('rk-small');
    expect(screen.getByText('Nothing is sent from here').className).toBe('rk-small');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});
