/**
 * Textarea — markup contract, states and accessibility (Appendix E §3.2 Textarea). Sources: board
 * 03 "Textarea · select · file" (hint) and "Decision panel and editable table" (invalid reason);
 * board 10 "Try it · keyboard and pointer" (DL-2 reason).
 */
import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  type BoardSource,
} from '../testing/index.js';
import { Field } from './field.js';
import { Textarea } from './textarea.js';

const TEXTAREA: BoardSource = { board: '03', frame: 'Textarea · select · file' };
const DECISION: BoardSource = { board: '03', frame: 'Decision panel and editable table' };
const DIALOG: BoardSource = { board: '10', frame: 'Try it · keyboard and pointer' };

describe('Textarea markup contract', () => {
  it('renders exactly as drawn, described by its hint (board 03 "What happened?")', () => {
    const { container } = render(
      <Textarea
        id="c-ta"
        aria-describedby="c-ta-h"
        defaultValue="The VR simulation stopped loading at the second step."
      />,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      TEXTAREA,
      '<textarea id="c-ta" class="xr-textarea" aria-describedby="c-ta-h">The VR simulation stopped loading at the second step.</textarea>',
    );
  });

  it('invalid reason: aria-invalid and the error id, as the decision panel draws it', () => {
    expectBoardDraws(
      DECISION,
      '<textarea id="c-dr" class="xr-textarea"',
      'aria-invalid="true" aria-describedby="c-dr-e"></textarea><span id="c-dr-e" class="xr-error">',
      'Add a reason so the vendor knows what to change',
    );
    render(
      <Field
        id="c-dr"
        label="Reason for returning"
        error="Add a reason so the vendor knows what to change"
      >
        <Textarea />
      </Field>,
    );
    const reason = screen.getByRole('textbox', { name: 'Reason for returning' });
    expect(reason).toHaveClass('xr-textarea', { exact: true });
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(reason).toHaveAttribute('aria-describedby', 'c-dr-e');
    expect(reason).toHaveAccessibleDescription('Add a reason so the vendor knows what to change');
  });

  it('the DL-2 reason (board 10): aria-invalid only when invalid', () => {
    expectBoardDraws(
      DIALOG,
      '<textarea id="d2-r" class="xr-textarea"',
      'aria-invalid="{{ reasonInvalid }}" aria-describedby="d2-err"',
    );
    const { rerender } = render(<Textarea aria-label="Reason the vendor will see" />);
    const reason = screen.getByRole('textbox', { name: 'Reason the vendor will see' });
    expect(reason).not.toHaveAttribute('aria-invalid');
    rerender(<Textarea aria-label="Reason the vendor will see" invalid />);
    expect(reason).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('Textarea behaviour', () => {
  it('is controlled: value + onChange; the ref reaches the textarea', () => {
    const onChange = vi.fn();
    const ref = createRef<HTMLTextAreaElement>();
    const { rerender } = render(
      <Textarea aria-label="What happened?" value="" onChange={onChange} ref={ref} />,
    );
    const textarea = screen.getByRole('textbox', { name: 'What happened?' });
    expect(ref.current).toBe(textarea);
    fireEvent.change(textarea, { target: { value: 'The VR simulation stopped loading.' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    rerender(
      <Textarea
        aria-label="What happened?"
        value="The VR simulation stopped loading."
        onChange={onChange}
        ref={ref}
      />,
    );
    expect(textarea).toHaveValue('The VR simulation stopped loading.');
  });
});

describe('Textarea classes and accessibility', () => {
  it('emits only stylesheet classes', () => {
    const { container } = render(
      <div>
        <Textarea aria-label="What happened?" />
        <Textarea aria-label="Reason" invalid />
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it.each([
    ['default', <Textarea aria-label="What happened?" />],
    [
      'hint',
      <Field label="What happened?" hint="Say what you were doing and what you saw.">
        <Textarea />
      </Field>,
    ],
    [
      'invalid',
      <Field label="Reason for returning" error="Add a reason so the vendor knows what to change">
        <Textarea />
      </Field>,
    ],
  ])('axe: %s', async (_state, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});
