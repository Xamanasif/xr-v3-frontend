/**
 * `ConfirmDialog` as the Super Admin export draws its dialogs (owner-approved export
 * design/v3-refined-b/roles/SA-v1, `project/sa-core.js` `dialogHtml`, `dlgList` and the `SA.DLG`
 * bodies): the form dialogs (SA-07 Assign / Pause / Restore, SA-14 Add area / course, SA-15 Rename /
 * Edit description / Move, SA-16 Register) open on their first field and confirm on Enter; the
 * confirmations (SA-11 Release / Hold / Lift hold, SA-13 Move status, SA-17 Restore scope) open on
 * their confirm button; a refusal or failure shows as a notice in the body (SA-11, SA-13, SA-14,
 * SA-15, SA-17, SA-21 Reopen). The SA-03 confirmation (focus on the title) is in
 * `structure.test.tsx`. jsdom's stand-ins for the native dialog; the browser behaviour (top layer,
 * inert page) is proven in apps/specimens/e2e/v3-foundation.spec.ts.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectNoInternalReferences,
  expectV3ClassesOnly,
  saExportText,
  veExportText,
} from '../testing/index.js';
import { Button } from './actions.js';
import { Quote } from './detail.js';
import { ConfirmDialog } from './dialog.js';
import { Field, Textarea, TextInput } from './fields.js';
import { Notice } from './notices.js';

const CORE = saExportText('sa-core.js');
const VIEWS = ['a', 'b', 'c', 'd'].map((part) => saExportText(`sa-views-${part}.js`)).join('\n');

function dialogOf(): HTMLDialogElement {
  return document.querySelector('dialog.rk-dialog') as HTMLDialogElement;
}

function openWith(name: string | RegExp) {
  const trigger = screen.getByRole('button', { name });
  trigger.focus();
  act(() => trigger.click());
  return { trigger, dialog: dialogOf() };
}

/** SA-16 "Register a Reviewer" (`SA.DLG.register`): a form dialog that checks its name. */
function Register({
  onConfirm = vi.fn(),
  busy = false,
  submitOnEnter = true,
}: {
  readonly onConfirm?: (name: string) => void;
  readonly busy?: boolean;
  readonly submitOnEnter?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  return (
    <>
      <Button variant="navy" icon="add" onClick={() => setOpen(true)}>
        Register a Reviewer
      </Button>
      <ConfirmDialog
        open={open}
        idPrefix="dlg"
        initialFocus="field"
        submitOnEnter={submitOnEnter}
        title="Register a Reviewer"
        description="Registering doesn’t send an invitation. You assign what they can act on next."
        confirmLabel="Register"
        busy={busy}
        busyLabel="Registering…"
        onConfirm={() => {
          if (!name.trim()) {
            setError('Enter the person’s name');
            return;
          }
          onConfirm(name);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      >
        <Field id="dlg-r-n" label="Name" error={error}>
          <TextInput value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field id="dlg-r-e" label="Work e-mail">
          <TextInput type="email" />
        </Field>
      </ConfirmDialog>
    </>
  );
}

describe('the export’s dialog frame (`sa-core.js` `dialogHtml`)', () => {
  it('head (the title that takes focus, its line), body, foot (Cancel, the gold confirm)', async () => {
    for (const piece of [
      '<div class="rk-dialog" id="sa-dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-d">',
      '<div class="rk-dlg-head"><h2 id="dlg-t" tabindex="-1">',
      '<div class="rk-dlg-body">',
      '<div class="rk-dlg-foot"><button type="button" class="rb-btn rb-btn--lg" id="dlg-cancel"',
      'class="rb-btn rb-btn--primary rb-btn--lg" id="dlg-ok"',
      '<div class="rk-dlg-group rk-dlg-now"><h3>What happens now</h3><ul class="rk-dlg-list">',
      '<div class="rk-dlg-group rk-dlg-later"><h3>Only after later events, or not from here</h3>',
    ]) {
      expect(CORE).toContain(piece);
    }
    const { container } = render(<Register />);
    const { dialog } = openWith('Register a Reviewer');
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('aria-labelledby')).toBe('dlg-t');
    expect(dialog.getAttribute('aria-describedby')).toBe('dlg-d');
    expect([...dialog.children].map((child) => child.className)).toEqual([
      'rk-dlg-head',
      'rk-dlg-body',
      'rk-dlg-foot',
    ]);
    expect(dialog.querySelector(':scope > .rk-dlg-head > h2#dlg-t')).toHaveAttribute(
      'tabindex',
      '-1',
    );
    expect(dialog.querySelector(':scope > .rk-dlg-head > p#dlg-d')).toHaveTextContent(
      'Registering doesn’t send an invitation.',
    );
    expect(dialog.querySelectorAll(':scope > .rk-dlg-body > .rk-field')).toHaveLength(2);
    const buttons = within(dialog).getAllByRole('button', { hidden: true });
    expect(buttons.map((button) => [button.textContent, button.className])).toEqual([
      ['Cancel', 'rb-btn rb-btn--lg'],
      ['Register', 'rb-btn rb-btn--primary rb-btn--lg'],
    ]);
    expectV3ClassesOnly(container);
    expectNoInternalReferences(dialog);
    await assertNoAxeViolations(dialog);
  });
});

describe('a form dialog (`initialFocus="field"`; SA-07, SA-14, SA-15, SA-16)', () => {
  it('opens on its first field, as the export’s `openDlg(…, focusId)` does', () => {
    expect(VIEWS).toContain(
      "SA.openDlg({ type: 'assignIA', id: d.id, name: '', email: '', opener: 'in-assign' }, 'dlg-ia-n')",
    );
    render(<Register />);
    const { dialog } = openWith('Register a Reviewer');
    expect(document.activeElement).toBe(
      within(dialog).getByRole('textbox', { name: 'Name', hidden: true }),
    );
  });

  it('a refused confirm focuses the first invalid field; Enter in a text field confirms', () => {
    const onConfirm = vi.fn();
    render(<Register onConfirm={onConfirm} />);
    const { trigger, dialog } = openWith('Register a Reviewer');
    const name = within(dialog).getByRole('textbox', { name: 'Name', hidden: true });
    act(() => within(dialog).getByRole('button', { name: 'Register', hidden: true }).click());
    expect(onConfirm).not.toHaveBeenCalled();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(document.activeElement).toBe(name);
    fireEvent.change(name, { target: { value: 'Dr S. Rao' } });
    fireEvent.keyDown(name, { key: 'Enter' });
    expect(onConfirm).toHaveBeenCalledWith('Dr S. Rao');
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('without `submitOnEnter` Enter in a field does not confirm (SA-07 Pause, Restore)', () => {
    const onConfirm = vi.fn();
    render(<Register onConfirm={onConfirm} submitOnEnter={false} />);
    const { dialog } = openWith('Register a Reviewer');
    const name = within(dialog).getByRole('textbox', { name: 'Name', hidden: true });
    fireEvent.change(name, { target: { value: 'Dr S. Rao' } });
    fireEvent.keyDown(name, { key: 'Enter' });
    expect(onConfirm).not.toHaveBeenCalled();
    expect(dialog.open).toBe(true);
  });

  it('busy: the confirm says what is happening and presses are ignored; Esc is Cancel', () => {
    const onConfirm = vi.fn();
    const { rerender } = render(<Register onConfirm={onConfirm} />);
    const { trigger, dialog } = openWith('Register a Reviewer');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);

    rerender(<Register onConfirm={onConfirm} busy />);
    act(() => trigger.click());
    const confirm = within(dialog).getAllByRole('button', { hidden: true }).at(-1)!;
    expect(confirm).toHaveTextContent('Registering…');
    expect(confirm).toHaveAttribute('aria-disabled', 'true');
    act(() => confirm.click());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('a body the caller renders only while open goes with it (SA-14, SA-15: Cancel, Esc)', () => {
    function AddArea() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Add area</Button>
          <ConfirmDialog
            open={open}
            initialFocus="field"
            submitOnEnter
            title="Add an engineering area"
            description="It appears in the public area explorer and the catalogue once it has courses."
            confirmLabel="Add area"
            onConfirm={() => undefined}
            onCancel={() => setOpen(false)}
          >
            {open ? (
              <>
                <Field label="Area name">
                  <TextInput />
                </Field>
                <Field label="Description (optional)">
                  <Textarea />
                </Field>
              </>
            ) : null}
          </ConfirmDialog>
        </>
      );
    }
    render(<AddArea />);
    const { trigger, dialog } = openWith('Add area');
    expect(document.activeElement).toBe(
      within(dialog).getByRole('textbox', { name: 'Area name', hidden: true }),
    );
    act(() => within(dialog).getByRole('button', { name: 'Cancel', hidden: true }).click());
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(dialog.querySelectorAll('.rk-field')).toHaveLength(0);
  });
});

describe('a confirmation (`initialFocus="confirm"`; SA-11, SA-13, SA-17)', () => {
  function Hold({
    onConfirm = vi.fn(),
    unavailable = false,
  }: {
    readonly onConfirm?: () => void;
    readonly unavailable?: boolean;
  }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Hold update</Button>
        <ConfirmDialog
          open={open}
          idPrefix="dlg"
          initialFocus="confirm"
          title="Hold the Distillation Column correction?"
          description="Version 1.2 stays live. The Content Manager sees your reason."
          groups={[
            { kind: 'now', title: 'What happens now', items: ['Version 1.2 stays live.'] },
            {
              kind: 'later',
              title: 'Only after later events, or not from here',
              items: ['No institution’s or student’s access changes.'],
            },
          ]}
          confirmLabel="Hold update"
          onConfirm={() => {
            onConfirm();
            if (!unavailable) setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        >
          <Quote by="Your reason">Wait for the lab to confirm the new build.</Quote>
          {unavailable ? (
            <Notice
              tone="warn"
              role="alert"
              title="It wasn’t held. Nothing was lost — try again."
            />
          ) : null}
        </ConfirmDialog>
      </>
    );
  }

  it('opens on the confirm button (`dlg-ok`); the groups, then the body; confirm runs once', async () => {
    expect(VIEWS).toContain(
      "SA.openDlg({ type: f.choice === 'hold' ? 'holdUpd' : 'releaseUpd', id: u.id, opener: 'up-go' }, 'dlg-ok')",
    );
    const onConfirm = vi.fn();
    render(<Hold onConfirm={onConfirm} />);
    const { trigger, dialog } = openWith('Hold update');
    const buttons = within(dialog).getAllByRole('button', { hidden: true });
    expect(document.activeElement).toBe(buttons[1]);
    const body = dialog.querySelector('.rk-dlg-body')!;
    expect([...body.children].map((child) => child.className)).toEqual([
      'rk-dlg-group rk-dlg-now',
      'rk-dlg-group rk-dlg-later',
      'rk-quote',
    ]);
    expect(body.querySelectorAll('.rk-dlg-now li svg, .rk-dlg-later li svg')).toHaveLength(2);
    expectV3ClassesOnly(dialog);
    await assertNoAxeViolations(dialog);
    act(() => buttons[1]!.click());
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('a failure stays in the open dialog as a notice in its body (SA-11, SA-21 Reopen)', () => {
    render(<Hold unavailable />);
    const { dialog } = openWith('Hold update');
    act(() => within(dialog).getByRole('button', { name: 'Hold update', hidden: true }).click());
    expect(dialog.open).toBe(true);
    const notice = dialog.querySelector('.rk-dlg-body > .rk-notice.rk-notice--warn')!;
    expect(notice).toHaveAttribute('role', 'alert');
    expect(notice).toHaveTextContent('It wasn’t held. Nothing was lost — try again.');
    expectV3ClassesOnly(dialog);
  });

  it('with no groups and an empty body, the body is empty (SA-11 Lift hold, SA-17 Restore scope)', () => {
    // The export always draws the body (`dialogHtml`: `'<div class="rk-dlg-body">' + (spec.body
    // || '')`); the screens pass their failure notice, absent until a command fails.
    expect(CORE).toContain(`'<div class="rk-dlg-body">' + (spec.body || '') + '</div>'`);
    function Restore() {
      const [open, setOpen] = useState(false);
      const unavailable = false;
      return (
        <>
          <Button onClick={() => setOpen(true)}>Restore</Button>
          <ConfirmDialog
            open={open}
            initialFocus="confirm"
            submitOnEnter
            title="Restore EEE ZC341 for Prof. A. Menon?"
            description="The same scope comes back. No reason is asked; the earlier withdrawal stays in the history."
            confirmLabel="Restore scope"
            onConfirm={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          >
            {unavailable ? <Notice tone="warn" role="alert" title="It wasn’t restored." /> : null}
          </ConfirmDialog>
        </>
      );
    }
    render(<Restore />);
    const { dialog } = openWith('Restore');
    expect(document.activeElement).toBe(
      within(dialog).getByRole('button', { name: 'Restore scope', hidden: true }),
    );
    expect(dialog.querySelector('.rk-dlg-body')?.childElementCount).toBe(0);
    expectV3ClassesOnly(dialog);
    expectNoInternalReferences(dialog);
  });
});

describe('the Vendor export’s dialogs (VE-v1 `Main.dc.html` `dlgView`)', () => {
  const MAIN = veExportText('Main.dc.html');

  function Leave() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>My experiments</Button>
        <ConfirmDialog
          open={open}
          idPrefix="ve-dlg"
          title="Leave without saving?"
          description="Your changes since you last saved will be lost. Save a draft first to keep them."
          cancelLabel="Keep editing"
          confirmLabel="Leave without saving"
          confirmVariant="navy"
          onConfirm={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </>
    );
  }

  it('“Leave without saving?”: no body, Keep editing and the navy confirm, as the export draws it', async () => {
    for (const piece of [
      '<sc-if value="{{ D.hasBody }}" hint-placeholder-val="{{ true }}">\n      <div class="rk-dlg-body">',
      "return { open: true, hasBody: false, title: 'Leave without saving?'",
      "cancelLabel: 'Keep editing', okLabel: 'Leave without saving', okCls: 'rb-btn rb-btn--navy rb-btn--lg'",
    ]) {
      expect(MAIN).toContain(piece);
    }
    const { container } = render(<Leave />);
    const { dialog, trigger } = openWith('My experiments');
    expect([...dialog.children].map((child) => child.className)).toEqual([
      'rk-dlg-head',
      'rk-dlg-foot',
    ]);
    expect(dialog.querySelector('.rk-dlg-body')).toBeNull();
    expect(document.activeElement).toBe(dialog.querySelector('h2#ve-dlg-t'));
    const buttons = within(dialog).getAllByRole('button', { hidden: true });
    expect(buttons.map((button) => [button.textContent, button.className])).toEqual([
      ['Keep editing', 'rb-btn rb-btn--lg'],
      ['Leave without saving', 'rb-btn rb-btn--navy rb-btn--lg'],
    ]);
    expectV3ClassesOnly(container);
    expectNoInternalReferences(dialog);
    await assertNoAxeViolations(dialog);
    act(() => buttons[0]!.click());
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('Submit for academic review: the groups in the body and the gold confirm (the default)', () => {
    expect(MAIN).toContain(
      "cancelLabel: isRev ? 'Keep editing' : 'Cancel', okLabel: isRev ? 'Resubmit' : 'Submit for academic review', okCls: 'rb-btn rb-btn--primary rb-btn--lg'",
    );
    function Submit() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Submit</Button>
          <ConfirmDialog
            open={open}
            title="Submit for academic review?"
            description="It does not publish anything."
            groups={[
              { kind: 'now', title: 'What happens now', items: ['It goes to the reviewer.'] },
              { kind: 'later', title: 'Only after later events', items: ['You can revise it.'] },
            ]}
            confirmLabel="Submit for academic review"
            onConfirm={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </>
      );
    }
    render(<Submit />);
    const { dialog } = openWith('Submit');
    expect([...dialog.children].map((child) => child.className)).toEqual([
      'rk-dlg-head',
      'rk-dlg-body',
      'rk-dlg-foot',
    ]);
    expect(
      within(dialog).getByRole('button', { name: 'Submit for academic review', hidden: true }),
    ).toHaveClass('rb-btn', 'rb-btn--primary', 'rb-btn--lg');
  });
});
