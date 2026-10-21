'use client';

import { type FocusEvent, useEffect, useId, type ReactNode, type RefObject } from 'react';

import { type ModalInitialFocus, useModalDialog } from '../overlays/modal-dialog.js';
import { joinClasses } from '../internal/classes.js';
import { Button, type ButtonVariant } from './actions.js';
import { Glyph } from './icons.js';

export interface ConfirmDialogGroup {
  /**
   * `now` (green ticks: "What happens now") or `later` (amber clocks: "Only after later events")
   * — rb-kit.css `rk-dlg-now`, `rk-dlg-later`.
   */
  readonly kind: 'now' | 'later';
  readonly title: ReactNode;
  readonly items: readonly ReactNode[];
}

export interface ConfirmDialogProps {
  readonly open: boolean;
  /** The question: "Approve the request from Godavari Institute of Technology?". */
  readonly title: ReactNode;
  /**
   * The line under the title, read as the dialog's description. Every dialog has one except the
   * Institute Admin export's name dialogs (IA-v1 "Create group", "Rename group": `G.hasBody`
   * false), which draw no line and no `aria-describedby`.
   */
  readonly description?: ReactNode;
  /** What the action does now and what happens only after later events. */
  readonly groups?: readonly ConfirmDialogGroup[];
  /**
   * More of the dialog's body after the groups (rb-kit.css `rk-dlg-body`): the fields a decision
   * asks for (a reason, a name and e-mail), a quoted reason, a refusal notice. The Super Admin
   * export (SA-v1) draws its form dialogs in the same frame, and always draws the body — a body
   * that is empty for now (`null`, a notice not shown) keeps it. Without groups and without this
   * prop the dialog has no body at all (the Vendor export's "Leave without saving?", `D.hasBody`).
   */
  readonly children?: ReactNode;
  /**
   * The body's bottom padding 12 px, as the Content Manager export (CM-v1) sets it inline on its
   * Withdraw dialog, whose body is one field (`rk-x-dlg-body-tight`, V3P-14). Off by default.
   */
  readonly tightBody?: boolean;
  /**
   * Where focus goes on opening: the title (default, SA-03), the first field of the body (a form
   * dialog: SA-07 Assign, SA-14 Add course, SA-16 Register), the confirm button (SA-11, SA-13:
   * the export's `dlg-ok`) or Cancel (the Institute Admin export's destructive dialogs without a
   * field: IA-14 "Remove … from this group?", IA-09 / IA-15 "Remove … from …?", `ia-dlg-cancel`).
   * After a refused confirm, focus goes to the first invalid field.
   */
  readonly initialFocus?: Extract<ModalInitialFocus, 'title' | 'field' | 'confirm' | 'cancel'>;
  /** Enter in a field confirms (a form dialog). */
  readonly submitOnEnter?: boolean;
  readonly confirmLabel: ReactNode;
  /**
   * The confirm button's tone: the gold `primary` (default: every Super Admin dialog, Submit and
   * Resubmit) or `navy` (the Vendor export's "Leave without saving", `rb-btn--navy`).
   */
  readonly confirmVariant?: Extract<ButtonVariant, 'primary' | 'navy'>;
  /**
   * A destructive confirmation (the Institute Admin export, IA-v1 COMPONENT-EXTENSIONS "Destructive
   * confirm": Withdraw access, Deactivate account, Remove from group, Remove course): the dialog is
   * an `alertdialog` and its confirm the red one (`ia-btn--danger`, drawn red only inside the
   * dialog) in place of `confirmVariant`. Off by default.
   */
  readonly destructive?: boolean;
  readonly cancelLabel?: ReactNode;
  /** While the command runs: presses are ignored and `busyLabel` replaces the confirm words. */
  readonly busy?: boolean;
  readonly busyLabel?: ReactNode;
  /**
   * While busy, the confirm also shows the Institute Admin export's busy look (`ia-btn--busy`: faded,
   * the progress cursor; IA-v1 `dlgContent` `btnCls`). Off by default: elsewhere only the words
   * change.
   */
  readonly busyLook?: boolean;
  /**
   * While busy, the dialog waits for the result (the Content Manager export's Publish, Send for
   * academic review and Withdraw; CM-v1 COMPONENT-EXTENSIONS "Behaviour notes"): Cancel is
   * disabled, Esc and every other close request are ignored, and focus is held on the dialog's
   * title (moved there when the command starts, and back there when a press would leave it
   * nowhere). Off by default: elsewhere Cancel stays enabled and the caller decides what a cancel
   * while busy does.
   */
  readonly holdWhileBusy?: boolean;
  readonly onConfirm: () => void;
  /** Cancel, Esc or a browser close request; the caller closes the dialog. */
  readonly onCancel: () => void;
  /** Where focus goes on close when the element that opened the dialog is gone. */
  readonly returnFocusFallback?: RefObject<HTMLElement | null>;
  /** Prefix of the title and description ids (`<prefix>-t`, `<prefix>-d`). */
  readonly idPrefix?: string;
}

/**
 * The Refined B confirmation (`dialog.rk-dialog`; rb-kit.css ConfirmDialog, SA-03): the title and
 * its line, "What happens now" against "Only after later events", Cancel and the gold confirm.
 * Opening focuses the title (or the first field, or the confirm button); Tab cycles inside the
 * dialog; Esc or Cancel returns focus to the button that opened it. With a body (`children`) it is
 * also every dialog of the Super Admin export (SA-v1 `sa-core.js` `dialogHtml`, the `SA.DLG`
 * bodies): its form dialogs — fields under the head, the first field focused, Enter confirming, a
 * refused confirm sending focus to the first invalid field — and its confirmations with a quoted
 * reason or a refusal notice in the body. The Vendor export (VE-v1) adds the navy confirm and a
 * dialog without a body ("Leave without saving?"); the Content Manager export (CM-v1) the hold
 * while its command runs (`holdWhileBusy`) and the Withdraw dialog's tight body (`tightBody`); the
 * Institute Admin export (IA-v1) the destructive `alertdialog` with its red confirm
 * (`destructive`), focus on Cancel, the busy look (`busyLook`) and the name dialogs without a
 * line (`description` left out). A native dialog opened with showModal(), so the page
 * behind is inert — the board's `div` over an `aria-hidden` scrim left it reachable (V3P-01). The
 * behaviour is the shared `useModalDialog` of the v46 dialogs.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  groups = [],
  children,
  tightBody = false,
  initialFocus = 'title',
  submitOnEnter = false,
  confirmLabel,
  confirmVariant = 'primary',
  destructive = false,
  cancelLabel = 'Cancel',
  busy = false,
  busyLabel,
  busyLook = false,
  holdWhileBusy = false,
  onConfirm,
  onCancel,
  returnFocusFallback,
  idPrefix,
}: ConfirmDialogProps) {
  const generated = useId();
  const prefix = idPrefix ?? generated;
  const titleId = `${prefix}-t`;
  const descriptionId = description === undefined ? undefined : `${prefix}-d`;
  const held = holdWhileBusy && busy;
  const modal = useModalDialog({
    open,
    busy,
    onConfirm,
    // Held: Cancel, Esc and the browser's close requests wait for the result.
    onCancel: () => {
      if (!held) onCancel();
    },
    returnFocusFallback,
    initialFocus,
    submitOnEnter,
    bodySelector: '.rk-dlg-body',
  });
  const { dialogRef, titleRef } = modal;
  // Held: focus moves to the title when the command starts (the export's `focus('…-t')` as it
  // sets busy), so it is never left on the disabled Cancel; and it stays in the open dialog — a
  // press on the disabled Cancel, which would leave focus nowhere, puts it back on the title.
  useEffect(() => {
    if (!held || !dialogRef.current?.open) return;
    titleRef.current?.focus();
  }, [held, dialogRef, titleRef]);
  const holdFocus = (event: FocusEvent<HTMLDialogElement>) => {
    const dialog = event.currentTarget;
    const next = event.relatedTarget;
    if (!held || !dialog.open || (next instanceof Node && dialog.contains(next))) return;
    // After the focus change that is under way: where it left the dialog, back to the title.
    queueMicrotask(() => {
      const active = dialog.ownerDocument.activeElement;
      if (!dialog.open || (active && active !== dialog && dialog.contains(active))) return;
      titleRef.current?.focus();
    });
  };
  return (
    <dialog
      ref={modal.dialogRef}
      className="rk-dialog"
      role={destructive ? 'alertdialog' : undefined}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onKeyDown={modal.onKeyDown}
      onBlur={holdFocus}
      onCancel={modal.onCancel}
      onClose={modal.onClose}
    >
      <div className="rk-dlg-head">
        <h2 id={titleId} ref={modal.titleRef} tabIndex={-1}>
          {title}
        </h2>
        {description === undefined ? null : <p id={descriptionId}>{description}</p>}
      </div>
      {groups.length > 0 || children !== undefined ? (
        <div className={joinClasses('rk-dlg-body', tightBody && 'rk-x-dlg-body-tight')}>
          {groups.map((group, index) => (
            <div
              key={index}
              className={`rk-dlg-group ${group.kind === 'now' ? 'rk-dlg-now' : 'rk-dlg-later'}`}
            >
              <h3>{group.title}</h3>
              <ul className="rk-dlg-list">
                {group.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Glyph name={group.kind === 'now' ? 'check' : 'clock'} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {children}
        </div>
      ) : null}
      <div className="rk-dlg-foot">
        <Button ref={modal.cancelRef} size="lg" disabled={held} onClick={() => onCancel()}>
          {cancelLabel}
        </Button>
        <Button
          ref={modal.confirmRef}
          variant={destructive ? 'default' : confirmVariant}
          size="lg"
          className={
            joinClasses(destructive && 'ia-btn--danger', busy && busyLook && 'ia-btn--busy') ||
            undefined
          }
          busy={busy}
          busyLabel={busyLabel}
          onClick={modal.confirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
