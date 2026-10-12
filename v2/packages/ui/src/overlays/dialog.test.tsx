/**
 * Dialog (DL-1 ConfirmDialog, DL-2 ReasonDialog, DL-3 EditDialog) — markup contract, behaviour and
 * accessibility (Appendix E §3.4 Dialog, §5.3; Appendix F WP-0.6 acceptance 2–4). Sources: board 10
 * "Try it · keyboard and pointer" (the three native dialogs), "States · focus, validation, busy"
 * ("DL-1 · Confirm · destructive · focus on Cancel") and "Keyboard path and phone layout"; B2-08
 * "Remove member (DL-1)" (product-board Cancel and danger confirm, VD-06); B2-06 "Student record ·
 * after SACC-0310 · interactive deactivate" (the busy footer as the product boards draw it); B5-03
 * "VE-03 Create experiment · step 1 · 1440 · interactive · 10 Aug 2026" (the effect sentence as the
 * description).
 *
 * jsdom has no top layer, no inert page and no Esc → `cancel` (vitest.setup.ts only toggles
 * `open`), so Tab containment, initial focus, Esc and focus return are proven again in a real
 * browser: apps/specimens/e2e/components-overlays.spec.ts.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Icon } from '../foundation/icon.js';
import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import { ConfirmDialog, EditDialog, ReasonDialog, type DialogAlign } from './dialog.js';

const TRY_IT: BoardSource = { board: '10', frame: 'Try it · keyboard and pointer' };
const STATES: BoardSource = { board: '10', frame: 'States · focus, validation, busy' };
const DESTRUCTIVE: BoardSource = {
  board: '10',
  frame: 'DL-1 · Confirm · destructive · focus on Cancel',
};
const KEYBOARD: BoardSource = { board: '10', frame: 'Keyboard path and phone layout' };
const REMOVE_MEMBER: BoardSource = { board: 'B2-08', frame: 'Remove member (DL-1)' };
const DEACTIVATE: BoardSource = {
  board: 'B2-06',
  frame: 'Student record · after SACC-0310 · interactive deactivate',
};
const CLOSE_ICON =
  '<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>';

const PUBLISH_EFFECT =
  'It will appear in the public catalogue with WEB and VR. Institutions still need access before their students can open it.';

/** Board wiring attributes (`ref`, `onClick`, … bound to `{{ }}`) are canvas runtime, not markup. */
function withoutWiring(excerpt: string): string {
  return excerpt.replace(/\s(?:ref|onClick|onKeyDown|onChange)="\{\{[^}]*\}\}"/g, '');
}

/** The rendered element equals the cited board excerpt once its canvas wiring is removed. */
function expectDrawnWithoutWiring(element: Element, source: BoardSource, excerpt: string): void {
  expectBoardDraws(source, excerpt);
  expect(normaliseMarkup(element.outerHTML)).toBe(normaliseMarkup(withoutWiring(excerpt)));
}

const noop = () => undefined;

function dialogIn(container: HTMLElement): HTMLDialogElement {
  const dialog = container.querySelector('dialog');
  if (!dialog) throw new Error('no dialog rendered');
  return dialog;
}

/** Board 10 DL-2 field ("Return to vendor?"), drawn with plain board markup for these tests. */
function ReasonField({
  value,
  onChange,
  error,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error?: string;
}) {
  return (
    <div className="xr-field">
      <label className="xr-label" htmlFor="d2-r">
        Reason the vendor will see
      </label>
      <textarea
        id="d2-r"
        className="xr-textarea"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'd2-err' : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <span id="d2-err" className="xr-error">
          <Icon name="failed" />
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** Board 10 DL-3 field ("Rename group"). */
function NameField({
  value,
  onChange,
  error,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error?: string;
}) {
  return (
    <div className="xr-field">
      <label className="xr-label" htmlFor="d3-n">
        Group name
      </label>
      <input
        id="d3-n"
        className="xr-input"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'd3-err' : undefined}
      />
      {error ? (
        <span id="d3-err" className="xr-error">
          <Icon name="failed" />
          {error}
        </span>
      ) : null}
    </div>
  );
}

function Publish({
  open = true,
  busy = false,
  destructive = false,
  align,
  onConfirm = noop,
  onCancel = noop,
}: {
  readonly open?: boolean;
  readonly busy?: boolean;
  readonly destructive?: boolean;
  readonly align?: DialogAlign;
  readonly onConfirm?: () => void;
  readonly onCancel?: () => void;
}) {
  return destructive ? (
    <ConfirmDialog
      open={open}
      idPrefix="d1"
      destructive
      title="Remove Priya Natarajan from Section A?"
      effect="You can add her to the group again later."
      confirmLabel="Remove from group"
      busy={busy}
      align={align}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  ) : (
    <ConfirmDialog
      open={open}
      idPrefix="d1"
      title="Publish Shell-and-Tube Heat Exchanger?"
      effect={PUBLISH_EFFECT}
      confirmLabel="Publish"
      busyLabel="Publishing…"
      busy={busy}
      align={align}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

describe('Dialog markup contract (board 10)', () => {
  it('DL-1: the native dialog, its head and its body render as board 10 draws them', () => {
    const { container } = render(<Publish />);
    const dialog = dialogIn(container);
    expectBoardDraws(
      TRY_IT,
      '<dialog class="xr-dialog" ref="{{ d1 }}" aria-labelledby="d1-t" aria-describedby="d1-b" onKeyDown="{{ onKey }}">',
    );
    expect(dialog.getAttribute('class')).toBe('xr-dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'd1-t');
    expect(dialog).toHaveAttribute('aria-describedby', 'd1-b');
    const [head, body, foot] = [...dialog.children];
    expectDrawnWithoutWiring(
      head!,
      TRY_IT,
      '<div class="xr-dialog-head"><h2 id="d1-t" class="xr-dialog-title">Publish Shell-and-Tube Heat Exchanger?</h2><button type="button" class="xr-icon-btn" aria-label="Close" onClick="{{ cancel }}"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg></button></div>',
    );
    expectDrawnWithoutWiring(
      body!,
      TRY_IT,
      `<div class="xr-dialog-body" id="d1-b"><p>${PUBLISH_EFFECT}</p></div>`,
    );
    expect(foot).toHaveClass('xr-dialog-foot');
    expect(dialog.children).toHaveLength(3);
  });

  it('DL-1 footer: Cancel first (xr-btn--secondary, VD-06), the confirming action last', () => {
    const { container } = render(<Publish />);
    const foot = dialogIn(container).querySelector('.xr-dialog-foot')!;
    const [cancel, confirm] = [...foot.children];
    // VD-06 (UNRESOLVED): board 10 draws Cancel as --text; every product board as --secondary.
    expectBoardDraws(
      TRY_IT,
      '<button type="button" class="xr-btn xr-btn--text" onClick="{{ cancel }}">Cancel</button>',
    );
    expectDrawnWithoutWiring(
      cancel!,
      REMOVE_MEMBER,
      '<button type="button" class="xr-btn xr-btn--secondary" onClick="{{ d.cancel }}">Cancel</button>',
    );
    expectDrawnWithoutWiring(
      confirm!,
      TRY_IT,
      '<button type="button" class="xr-btn xr-btn--primary" ref="{{ d1p }}" onClick="{{ submit1 }}">Publish</button>',
    );
    expect(foot.children).toHaveLength(2);
  });

  it('destructive DL-1: the red xr-btn--danger confirm', () => {
    const { container } = render(<Publish destructive />);
    expectBoardDraws(DESTRUCTIVE, "btn: 'Remove from group'", "btnCls: 'xr-btn--danger'");
    const confirm = dialogIn(container).querySelector('.xr-dialog-foot')!.lastElementChild!;
    expectBoardDraws(
      REMOVE_MEMBER,
      'class="xr-btn xr-btn--danger" onClick="{{ d.doRm }}">Remove from group</button>',
    );
    expect(normaliseMarkup(confirm.outerHTML)).toBe(
      '<button type="button" class="xr-btn xr-btn--danger">Remove from group</button>',
    );
  });

  it('busy, as the product boards draw it: the confirm is busy and aria-disabled; Close and Cancel are unchanged', () => {
    const { container } = render(
      <ReasonDialog
        open
        destructive
        busy
        busyLabel="Deactivating…"
        title="Deactivate Rahul Verma’s account?"
        effect="Rahul will see that the account is inactive and won’t be able to open any experiments until you reactivate it. Work and access history are kept."
        confirmLabel="Deactivate account"
        onConfirm={noop}
        onCancel={noop}
      >
        <ReasonField value="Left the programme." onChange={noop} />
      </ReasonDialog>,
    );
    const dialog = dialogIn(container);
    const [cancel, confirm] = [...dialog.querySelector('.xr-dialog-foot')!.children];
    expectDrawnWithoutWiring(
      dialog.querySelector('.xr-dialog-head .xr-icon-btn')!,
      DEACTIVATE,
      `<button type="button" class="xr-icon-btn" aria-label="Close" onClick="{{ d.cancel }}">${CLOSE_ICON}</button>`,
    );
    expectDrawnWithoutWiring(
      cancel!,
      DEACTIVATE,
      '<button type="button" class="xr-btn xr-btn--secondary" onClick="{{ d.cancel }}">Cancel</button>',
    );
    expectRenderedAsDrawn(
      confirm!,
      DEACTIVATE,
      '<button type="button" class="xr-btn xr-btn--danger is-busy" aria-disabled="true"><span class="xr-spin" aria-hidden="true"></span>Deactivating…</button>',
    );
  });

  it('busy DL-1: the board 10 confirm with aria-disabled in place of its aria-busy (the Button contract)', () => {
    const { container } = render(<Publish busy />);
    const confirm = dialogIn(container).querySelector('.xr-dialog-foot')!.lastElementChild!;
    // Board 10 draws aria-busy on its busy confirm; the product boards (B2-04, B2-06, B2-13 …) and
    // the Button contract use aria-disabled (Appendix E §5.1 "the button is aria-disabled").
    const drawn =
      '<button type="button" class="xr-btn xr-btn--primary is-busy" aria-busy="true"><span class="xr-spin" aria-hidden="true"></span>Publishing…</button>';
    expectBoardDraws(TRY_IT, drawn);
    expect(normaliseMarkup(confirm.outerHTML)).toBe(
      normaliseMarkup(drawn.replace('aria-busy="true"', 'aria-disabled="true"')),
    );
  });

  it('DL-2: the effect sentence (who will see the reason) is the description, then the field', () => {
    expectBoardDraws(
      TRY_IT,
      '<div class="xr-dialog-body"> <p>{{ d2Body }}</p> <div class="xr-field">',
      "d2Body: isWithdraw ? 'He will no longer be able to open Shell-and-Tube Heat Exchanger.' : 'The vendor sees your reason and can revise and resubmit.'",
    );
    // B5-03 describes its dialog by the effect paragraph: aria-describedby="Cn-sd" on the <p>.
    expectBoardDraws(
      {
        board: 'B5-03',
        frame: 'VE-03 Create experiment · step 1 · 1440 · interactive · 10 Aug 2026',
      },
      'aria-labelledby="Cn-st" aria-describedby="Cn-sd"',
      '<div class="xr-dialog-body"><p style="margin:0 0 8px" id="Cn-sd">',
    );
    const { container } = render(
      <ReasonDialog
        open
        idPrefix="d2"
        title="Return to vendor?"
        effect="The vendor sees your reason and can revise and resubmit."
        confirmLabel="Return to vendor"
        busyLabel="Returning…"
        onConfirm={noop}
        onCancel={noop}
      >
        <ReasonField value="" onChange={noop} />
      </ReasonDialog>,
    );
    const dialog = dialogIn(container);
    expect(dialog).toHaveAttribute('aria-describedby', 'd2-b');
    const body = dialog.querySelector('.xr-dialog-body')!;
    expect(normaliseMarkup(body.outerHTML)).toBe(
      normaliseMarkup(
        '<div class="xr-dialog-body"><p id="d2-b">The vendor sees your reason and can revise and resubmit.</p><div class="xr-field"><label class="xr-label" for="d2-r">Reason the vendor will see</label><textarea id="d2-r" class="xr-textarea"></textarea></div></div>',
      ),
    );
    expect(screen.getByRole('dialog', { name: 'Return to vendor?' })).toHaveAccessibleDescription(
      'The vendor sees your reason and can revise and resubmit.',
    );
  });

  it('DL-2 destructive ("Withdraw access") uses the red confirm', () => {
    expectBoardDraws(TRY_IT, "d2BtnCls: isWithdraw ? 'xr-btn--danger' : 'xr-btn--primary'");
    render(
      <ReasonDialog
        open
        destructive
        title="Withdraw Rahul Verma’s access?"
        effect="He will no longer be able to open Shell-and-Tube Heat Exchanger."
        confirmLabel="Withdraw access"
        busyLabel="Withdrawing…"
        onConfirm={noop}
        onCancel={noop}
      >
        <ReasonField value="" onChange={noop} />
      </ReasonDialog>,
    );
    expect(screen.getByRole('button', { name: 'Withdraw access' }).className).toBe(
      'xr-btn xr-btn--danger',
    );
  });

  it('DL-3: no description unless a sentence is given; the body holds the field', () => {
    expectBoardDraws(TRY_IT, '<h2 id="d3-t" class="xr-dialog-title">Rename group</h2>');
    const { container, rerender } = render(
      <EditDialog
        open
        idPrefix="d3"
        title="Rename group"
        confirmLabel="Save"
        busyLabel="Saving…"
        onConfirm={noop}
        onCancel={noop}
      >
        <NameField value="ME ZG523 · Sem II · Section A" onChange={noop} />
      </EditDialog>,
    );
    const dialog = dialogIn(container);
    expect(dialog).toHaveAttribute('aria-labelledby', 'd3-t');
    expect(dialog).not.toHaveAttribute('aria-describedby');
    expect(dialog.querySelector('.xr-dialog-body')!.firstElementChild).toHaveClass('xr-field');
    rerender(
      <EditDialog
        open
        idPrefix="d3"
        title="Rename group"
        effect="Students see the new name."
        confirmLabel="Save"
        onConfirm={noop}
        onCancel={noop}
      >
        <NameField value="ME ZG523 · Sem II · Section A" onChange={noop} />
      </EditDialog>,
    );
    expect(dialog).toHaveAttribute('aria-describedby', 'd3-b');
    expect(dialog.querySelector('#d3-b')).toHaveTextContent('Students see the new name.');
  });

  it.each([
    ['centre', 'xr-dialog'],
    ['start', 'xr-dialog xr-x-dialog--start'],
    ['end', 'xr-dialog xr-x-dialog--end'],
    ['decision', 'xr-dialog xr-x-dialog--decision'],
    ['marks', 'xr-dialog xr-x-dialog--marks'],
  ] as const)(
    'align %s → %s (PF-04, owner-accepted classes; VD-08 mapping provisional)',
    (align, classes) => {
      const { container } = render(<Publish align={align} />);
      expect(dialogIn(container).getAttribute('class')).toBe(classes);
      expectStylesheetClassesOnly(container);
    },
  );

  it('emits only stylesheet classes in every kind and state', () => {
    const { container } = render(
      <div>
        <Publish busy />
        <Publish destructive />
        <ReasonDialog
          open
          title="Return to vendor?"
          effect="The vendor sees your reason and can revise and resubmit."
          confirmLabel="Return to vendor"
          onConfirm={noop}
          onCancel={noop}
        >
          <ReasonField
            value=""
            onChange={noop}
            error="Add a reason so the vendor knows what to change"
          />
        </ReasonDialog>
        <EditDialog open title="Rename group" confirmLabel="Save" onConfirm={noop} onCancel={noop}>
          <NameField value="" onChange={noop} error="Enter a group name" />
        </EditDialog>
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });
});

/** A page with the trigger, as board 10 "Try it" wires it: the caller owns open, busy and errors. */
function TryIt({
  kind,
  onConfirm,
  onCancel,
  fallback = false,
  removeTriggerOnConfirm = false,
}: {
  readonly kind: 'confirm' | 'destructive' | 'reason' | 'edit';
  readonly onConfirm?: () => void;
  readonly onCancel?: () => void;
  readonly fallback?: boolean;
  readonly removeTriggerOnConfirm?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [triggerShown, setTriggerShown] = useState(true);
  const flash = useRef<HTMLDivElement>(null);
  const cancel = () => {
    onCancel?.();
    setOpen(false);
  };
  const confirm = () => {
    onConfirm?.();
    if ((kind === 'reason' || kind === 'edit') && !value.trim()) {
      setError(
        kind === 'reason'
          ? 'Add a reason so the vendor knows what to change'
          : 'Enter a group name',
      );
      return;
    }
    if (removeTriggerOnConfirm) setTriggerShown(false);
    setOpen(false);
  };
  const common = {
    open,
    onCancel: cancel,
    onConfirm: confirm,
    returnFocusFallback: fallback ? flash : undefined,
  };
  let dialog: ReactNode;
  if (kind === 'reason') {
    dialog = (
      <ReasonDialog
        {...common}
        title="Return to vendor?"
        effect="The vendor sees your reason and can revise and resubmit."
        confirmLabel="Return to vendor"
      >
        <ReasonField value={value} onChange={setValue} error={error} />
      </ReasonDialog>
    );
  } else if (kind === 'edit') {
    dialog = (
      <EditDialog {...common} title="Rename group" confirmLabel="Save">
        <NameField value={value} onChange={setValue} error={error} />
      </EditDialog>
    );
  } else {
    dialog = (
      <ConfirmDialog
        {...common}
        destructive={kind === 'destructive'}
        title={
          kind === 'destructive'
            ? 'Remove Priya Natarajan from Section A?'
            : 'Publish Shell-and-Tube Heat Exchanger?'
        }
        effect={
          kind === 'destructive' ? 'You can add her to the group again later.' : PUBLISH_EFFECT
        }
        confirmLabel={kind === 'destructive' ? 'Remove from group' : 'Publish'}
      />
    );
  }
  return (
    <div className="xr-app">
      {triggerShown ? (
        <button type="button" className="xr-btn xr-btn--secondary" onClick={() => setOpen(true)}>
          Open the dialog
        </button>
      ) : null}
      <div role="status" tabIndex={-1} ref={flash}>
        {triggerShown ? '' : 'Priya Natarajan was removed from Section A.'}
      </div>
      {dialog}
    </div>
  );
}

/** Opens the dialog the way a keyboard user does: focus the trigger, then activate it. */
function openFromTrigger(): HTMLButtonElement {
  const trigger = screen.getByRole('button', { name: 'Open the dialog' }) as HTMLButtonElement;
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
}

describe('Dialog behaviour (board 10 "Keyboard path and phone layout")', () => {
  it('opens with showModal() and closes when the caller says so', () => {
    expectBoardDraws(KEYBOARD, 'The page behind becomes inert.');
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    const { container, rerender } = render(<Publish open={false} />);
    const dialog = dialogIn(container);
    expect(dialog.open).toBe(false);
    rerender(<Publish open />);
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(dialog.open).toBe(true);
    rerender(<Publish open={false} />);
    expect(dialog.open).toBe(false);
    showModal.mockRestore();
  });

  it.each([
    ['confirm', 'Publish'],
    ['destructive', 'Cancel'],
  ] as const)('initial focus, %s DL-1 → %s', (kind, name) => {
    expectBoardDraws(
      KEYBOARD,
      'Focus moves into the dialog: first field (DL-2, DL-3), primary button (DL-1), or Cancel (destructive DL-1).',
    );
    render(<TryIt kind={kind} />);
    openFromTrigger();
    expect(screen.getByRole('button', { name })).toHaveFocus();
  });

  it.each([
    ['reason', 'Reason the vendor will see'],
    ['edit', 'Group name'],
  ] as const)('initial focus, %s → the first field', (kind, label) => {
    render(<TryIt kind={kind} />);
    openFromTrigger();
    expect(screen.getByLabelText(label)).toHaveFocus();
  });

  it('a DL-2 without a field focuses the confirming button (board 10: "or the primary button when there is none")', () => {
    expectBoardDraws(
      STATES,
      'other confirmations focus the first field, or the primary button when there is none',
    );
    render(
      <ReasonDialog
        open
        title="Return to vendor?"
        effect="The vendor sees your reason and can revise and resubmit."
        confirmLabel="Return to vendor"
        onConfirm={noop}
        onCancel={noop}
      >
        {null}
      </ReasonDialog>,
    );
    expect(screen.getByRole('button', { name: 'Return to vendor' })).toHaveFocus();
  });

  it('Esc is Cancel: onCancel, nothing else, and focus returns to the trigger', () => {
    expectBoardDraws(KEYBOARD, 'is Cancel: nothing changes.');
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<TryIt kind="confirm" onCancel={onCancel} onConfirm={onConfirm} />);
    const trigger = openFromTrigger();
    const notPrevented = fireEvent.keyDown(screen.getByRole('button', { name: 'Publish' }), {
      key: 'Escape',
    });
    expect(notPrevented).toBe(false);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it('the native cancel event (a close request) is Cancel and does not close the dialog itself', () => {
    const onCancel = vi.fn();
    const { container } = render(<Publish onCancel={onCancel} />);
    const dialog = dialogIn(container);
    const event = new Event('cancel', { cancelable: true });
    act(() => {
      dialog.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Close and Cancel call onCancel', () => {
    const onCancel = vi.fn();
    render(<Publish onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('busy: repeat presses are ignored; Esc, Close and Cancel still reach the caller', () => {
    expectBoardDraws(
      KEYBOARD,
      'While busy, buttons ignore repeat presses; the label says what is happening.',
    );
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { rerender } = render(<Publish onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    rerender(<Publish busy onConfirm={onConfirm} onCancel={onCancel} />);
    const busy = screen.getByRole('button', { name: 'Publishing…' });
    fireEvent.click(busy);
    fireEvent.click(busy);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    // No board disables Cancel or Close while busy; whether to close is the caller's decision.
    expect(fireEvent.keyDown(busy, { key: 'Escape' })).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(3);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('busy DL-3: Enter in the field does not save again', () => {
    const onConfirm = vi.fn();
    render(
      <EditDialog
        open
        busy
        busyLabel="Saving…"
        title="Rename group"
        confirmLabel="Save"
        onConfirm={onConfirm}
        onCancel={noop}
      >
        <NameField value="Lab batch B" onChange={noop} />
      </EditDialog>,
    );
    fireEvent.keyDown(screen.getByLabelText('Group name'), { key: 'Enter' });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Tab and Shift+Tab cycle inside the dialog (focus-cycle guard, R-25)', () => {
    expectBoardDraws(
      KEYBOARD,
      'cycle through Close, the field, Cancel and the confirming button — and never leave the dialog.',
    );
    render(<TryIt kind="reason" />);
    openFromTrigger();
    const close = screen.getByRole('button', { name: 'Close' });
    const field = screen.getByLabelText('Reason the vendor will see');
    const confirm = screen.getByRole('button', { name: 'Return to vendor' });
    // Middle stops: the browser moves focus (not prevented).
    expect(fireEvent.keyDown(field, { key: 'Tab' })).toBe(true);
    // Last → first, first → last.
    confirm.focus();
    expect(fireEvent.keyDown(confirm, { key: 'Tab' })).toBe(false);
    expect(close).toHaveFocus();
    expect(fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })).toBe(false);
    expect(confirm).toHaveFocus();
  });

  it.each([
    [
      'reason',
      'Return to vendor',
      'Reason the vendor will see',
      'Add a reason so the vendor knows what to change',
    ],
    ['edit', 'Save', 'Group name', 'Enter a group name'],
  ] as const)(
    '%s: a failed confirm moves focus to the first invalid field, described by its message',
    (kind, confirmName, label, message) => {
      expectBoardDraws(
        KEYBOARD,
        'On submit with an error: focus goes to the first invalid field; the message is read with it.',
      );
      const onConfirm = vi.fn();
      render(<TryIt kind={kind} onConfirm={onConfirm} />);
      openFromTrigger();
      const confirm = screen.getByRole('button', { name: confirmName });
      confirm.focus();
      fireEvent.click(confirm);
      const field = screen.getByLabelText(label);
      expect(field).toHaveFocus();
      expect(field).toHaveAttribute('aria-invalid', 'true');
      expect(field).toHaveAccessibleDescription(message);
      // Pressing again with the same error still returns focus to the field.
      confirm.focus();
      fireEvent.click(confirm);
      expect(field).toHaveFocus();
      expect(onConfirm).toHaveBeenCalledTimes(2);
    },
  );

  it('DL-3: Enter in the field saves; in a DL-2 textarea it does not', () => {
    expectBoardDraws(STATES, 'Enter in the field saves; Esc cancels.');
    const onConfirm = vi.fn();
    const { unmount } = render(<TryIt kind="edit" onConfirm={onConfirm} />);
    openFromTrigger();
    expect(fireEvent.keyDown(screen.getByLabelText('Group name'), { key: 'Enter' })).toBe(false);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    unmount();
    const onReason = vi.fn();
    render(<TryIt kind="reason" onConfirm={onReason} />);
    openFromTrigger();
    expect(
      fireEvent.keyDown(screen.getByLabelText('Reason the vendor will see'), { key: 'Enter' }),
    ).toBe(true);
    expect(onReason).not.toHaveBeenCalled();
  });

  it('on close focus returns to the trigger', () => {
    expectBoardDraws(KEYBOARD, 'On close, focus returns to the trigger');
    render(<TryIt kind="confirm" />);
    const trigger = openFromTrigger();
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(trigger).toHaveFocus();
  });

  it('when the trigger is gone, focus goes to the caller-given fallback (the flash notice)', () => {
    render(<TryIt kind="destructive" fallback removeTriggerOnConfirm />);
    openFromTrigger();
    fireEvent.click(screen.getByRole('button', { name: 'Remove from group' }));
    expect(screen.queryByRole('button', { name: 'Open the dialog' })).toBeNull();
    expect(screen.getByRole('status')).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Priya Natarajan was removed from Section A.',
    );
  });

  it('a close the dialog did not ask for (a forced close request) is Cancel, and focus returns', () => {
    const onCancel = vi.fn();
    const { container } = render(<TryIt kind="confirm" onCancel={onCancel} />);
    const trigger = openFromTrigger();
    const dialog = dialogIn(container);
    act(() => {
      dialog.close();
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(dialog.open).toBe(false);
    expect(trigger).toHaveFocus();
  });

  it('a non-cancelable close request is reported once, by the close that follows it', () => {
    const onCancel = vi.fn();
    const { container } = render(<Publish onCancel={onCancel} />);
    const dialog = dialogIn(container);
    act(() => {
      dialog.dispatchEvent(new Event('cancel', { cancelable: false }));
      dialog.close();
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('a forced close the caller does not accept (it keeps `open`): the dialog opens again', () => {
    const onCancel = vi.fn();
    const { container } = render(<Publish busy onCancel={onCancel} />);
    const dialog = dialogIn(container);
    act(() => {
      dialog.close();
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(dialog.open).toBe(true);
  });

  it('a confirm that closes the dialog leaves focus on the trigger, even with an invalid field left over', () => {
    function StaleError() {
      const [open, setOpen] = useState(false);
      return (
        <div className="xr-app">
          <button type="button" onClick={() => setOpen(true)}>
            Open the dialog
          </button>
          <EditDialog
            open={open}
            title="Rename group"
            confirmLabel="Save"
            onConfirm={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          >
            <NameField value="Lab batch B" onChange={noop} error="Enter a group name" />
          </EditDialog>
        </div>
      );
    }
    render(<StaleError />);
    const trigger = openFromTrigger();
    expect(screen.getByLabelText('Group name')).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(trigger).toHaveFocus();
  });

  it('unmounted while open, focus still returns to the trigger', () => {
    function Page({ shown }: { readonly shown: boolean }) {
      const [open, setOpen] = useState(false);
      return (
        <div className="xr-app">
          <button type="button" onClick={() => setOpen(true)}>
            Open the dialog
          </button>
          {shown ? (
            <ConfirmDialog
              open={open}
              title="Publish Shell-and-Tube Heat Exchanger?"
              effect={PUBLISH_EFFECT}
              confirmLabel="Publish"
              onConfirm={noop}
              onCancel={noop}
            />
          ) : null}
        </div>
      );
    }
    const { rerender } = render(<Page shown />);
    const trigger = openFromTrigger();
    expect(screen.getByRole('button', { name: 'Publish' })).toHaveFocus();
    rerender(<Page shown={false} />);
    expect(trigger).toHaveFocus();
  });
});

describe('Dialog accessibility (axe, WCAG 2.2 AA)', () => {
  it.each([
    ['DL-1', <Publish key="a" />],
    ['DL-1 busy', <Publish key="b" busy />],
    ['DL-1 destructive', <Publish key="c" destructive />],
    [
      'DL-2 validation',
      <ReasonDialog
        key="d"
        open
        title="Return to vendor?"
        effect="The vendor sees your reason and can revise and resubmit."
        confirmLabel="Return to vendor"
        onConfirm={noop}
        onCancel={noop}
      >
        <ReasonField
          value=""
          onChange={noop}
          error="Add a reason so the vendor knows what to change"
        />
      </ReasonDialog>,
    ],
    [
      'DL-2 busy',
      <ReasonDialog
        key="e"
        open
        destructive
        busy
        busyLabel="Withdrawing…"
        title="Withdraw Rahul Verma’s access?"
        effect="He will no longer be able to open Shell-and-Tube Heat Exchanger."
        confirmLabel="Withdraw access"
        onConfirm={noop}
        onCancel={noop}
      >
        <ReasonField value="Moved to a different course group." onChange={noop} />
      </ReasonDialog>,
    ],
    [
      'DL-3',
      <EditDialog
        key="f"
        open
        title="Rename group"
        confirmLabel="Save"
        onConfirm={noop}
        onCancel={noop}
      >
        <NameField value="ME ZG523 · Sem II · Section A" onChange={noop} />
      </EditDialog>,
    ],
    [
      'DL-3 validation',
      <EditDialog
        key="g"
        open
        title="Rename group"
        confirmLabel="Save"
        onConfirm={noop}
        onCancel={noop}
      >
        <NameField value="" onChange={noop} error="Enter a group name" />
      </EditDialog>,
    ],
    ['closed', <Publish key="h" open={false} />],
  ])('%s', async (_state, element) => {
    const { container } = render(<div className="xr-app">{element}</div>);
    await assertNoAxeViolations(container);
  });
});
