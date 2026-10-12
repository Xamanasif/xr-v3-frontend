/**
 * IdChip — markup contract and accessibility (Appendix E §3.1 IdChip: `xr-id`, monospace for
 * record IDs only). Sources: board 02 "Hierarchy in use" ("ACC-0107", drawn statically) and
 * "Typeface" ("Reference IDs · System monospace for record IDs only"), board 05 "GL-01 Workspace
 * Shell" (an ID inside a row line), B2-03 "After SACC-0310 · 9 Oct 2026" (`xr-sub xr-id`) and
 * B3-07 "ST-18 My device · 1440 · interactive · 22 Oct 2026" (`xr-meta xr-id`).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
} from '../testing/index.js';
import { IdChip } from './id-chip.js';

describe('IdChip markup contract', () => {
  it('renders exactly the ID board 02 draws above a record title', () => {
    const { container } = render(<IdChip>ACC-0107</IdChip>);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: '02', frame: 'Hierarchy in use' },
      '<span class="xr-id">ACC-0107</span>',
    );
  });

  it('the IDs board 02 lists are rendered as given, never reformatted', () => {
    expectBoardDraws(
      { board: '02', frame: 'Typeface' },
      'Reference IDs',
      'REQ-0042 · SACC-0310 · UPD-0005',
      'System monospace for record IDs only.',
    );
    render(
      <p>
        <IdChip>REQ-0042</IdChip> · <IdChip>SACC-0310</IdChip> · <IdChip>UPD-0005</IdChip>
      </p>,
    );
    expect(screen.getByText('REQ-0042')).toHaveClass('xr-id', { exact: true });
    expect(screen.getByText('SACC-0310').textContent).toBe('SACC-0310');
  });

  it('inside a row line (board 05 "SUP-0213 · sent 3 Oct …")', () => {
    expectBoardDraws(
      { board: '05', frame: 'GL-01 Workspace Shell' },
      '<span class="xr-row-sub"><span class="xr-id">SUP-0213</span> · sent 3 Oct · Shell-and-Tube Heat Exchanger · VR</span>',
    );
    const { container } = render(
      <span className="xr-row-sub">
        <IdChip>SUP-0213</IdChip> · sent 3 Oct · Shell-and-Tube Heat Exchanger · VR
      </span>,
    );
    expect(container.innerHTML).toBe(
      '<span class="xr-row-sub"><span class="xr-id">SUP-0213</span> · sent 3 Oct · Shell-and-Tube Heat Exchanger · VR</span>',
    );
  });

  it.each([
    [
      { board: 'B2-03', frame: 'After SACC-0310 · 9 Oct 2026' },
      'xr-sub',
      'SACC-0310',
      '<span class="xr-sub xr-id">SACC-0310</span>',
    ],
    [
      { board: 'B3-07', frame: 'ST-18 My device · 1440 · interactive · 22 Oct 2026' },
      'xr-meta',
      'DTR-0018',
      '<span class="xr-meta xr-id">DTR-0018</span>',
    ],
  ])('a board context class is drawn before `xr-id` (%o)', (source, context, id, drawn) => {
    const { container } = render(<IdChip className={context}>{id}</IdChip>);
    expectRenderedAsDrawn(container.firstElementChild!, source, drawn);
  });

  it('emits only stylesheet classes', () => {
    const { container } = render(
      <p>
        <IdChip>REQ-0042</IdChip>
        <IdChip className="xr-sub">GIT-2026-0418</IdChip>
      </p>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it('axe (WCAG 2.2 AA)', async () => {
    const { container } = render(
      <p>
        Your reference is <IdChip>SUP-0213</IdChip>. You can follow it in My reports.
      </p>,
    );
    await assertNoAxeViolations(container);
  });
});
