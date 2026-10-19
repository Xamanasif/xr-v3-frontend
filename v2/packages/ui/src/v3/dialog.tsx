'use client';

import { useId, type ReactNode, type RefObject } from 'react';

import { type ModalInitialFocus, useModalDialog } from '../overlays/modal-dialog.js';
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
  /** The line under the title, read as the dialog's description. */
  readonly description: ReactNode;
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
   * Where focus goes on opening: the title (default, SA-03), the first field of the body (a form
   * dialog: SA-07 Assign, SA-14 Add course, SA-16 Register) or the confirm button (SA-11, SA-13:
   * the export's `dlg-ok`). After a refused confirm, focus goes to the first invalid field.
   */
  readonly initialFocus?: Extract<ModalInitialFocus, 'title' | 'field' | 'confirm'>;
  /** Enter in a field confirms (a form dialog). */
  readonly submitOnEnter?: boolean;
  readonly confirmLabel: ReactNode;
  /**
   * The confirm button's tone: the gold `primary` (default: every Super Admin dialog, Submit and
   * Resubmit) or `navy` (the Vendor export's "Leave without saving", `rb-btn--navy`).
   */
  readonly confirmVariant?: Extract<ButtonVariant, 'primary' | 'navy'>;
  readonly cancelLabel?: ReactNode;
  /** While the command runs: presses are ignored and `busyLabel` replaces the confirm words. */
  readonly busy?: boolean;
  readonly busyLabel?: ReactNode;
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
 * dialog without a body ("Leave without saving?"). A native dialog opened with showModal(), so the page
 * behind is inert — the board's `div` over an `aria-hidden` scrim left it reachable (V3P-01). The
 * behaviour is the shared `useModalDialog` of the v46 dialogs.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  groups = [],
  children,
  initialFocus = 'title',
  submitOnEnter = false,
  confirmLabel,
  confirmVariant = 'primary',
  cancelLabel = 'Cancel',
  busy = false,
  busyLabel,
  onConfirm,
  onCancel,
  returnFocusFallback,
  idPrefix,
}: ConfirmDialogProps) {
  const generated = useId();
  const prefix = idPrefix ?? generated;
  const titleId = `${prefix}-t`;
  const descriptionId = `${prefix}-d`;
  const modal = useModalDialog({
    open,
    busy,
    onConfirm,
    onCancel,
    returnFocusFallback,
    initialFocus,
    submitOnEnter,
    bodySelector: '.rk-dlg-body',
  });
  return (
    <dialog
      ref={modal.dialogRef}
      className="rk-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onKeyDown={modal.onKeyDown}
      onCancel={modal.onCancel}
      onClose={modal.onClose}
    >
      <div className="rk-dlg-head">
        <h2 id={titleId} ref={modal.titleRef} tabIndex={-1}>
          {title}
        </h2>
        <p id={descriptionId}>{description}</p>
      </div>
      {groups.length > 0 || children !== undefined ? (
        <div className="rk-dlg-body">
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
        <Button ref={modal.cancelRef} size="lg" onClick={() => onCancel()}>
          {cancelLabel}
        </Button>
        <Button
          ref={modal.confirmRef}
          variant={confirmVariant}
          size="lg"
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
