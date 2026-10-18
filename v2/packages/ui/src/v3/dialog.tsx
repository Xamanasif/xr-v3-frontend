'use client';

import { useId, type ReactNode, type RefObject } from 'react';

import { useModalDialog } from '../overlays/modal-dialog.js';
import { Button } from './actions.js';
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
  readonly groups: readonly ConfirmDialogGroup[];
  readonly confirmLabel: ReactNode;
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
 * Opening focuses the title; Tab cycles inside the dialog; Esc or Cancel returns focus to the
 * button that opened it. A native dialog opened with showModal(), so the page behind is inert —
 * the board's `div` over an `aria-hidden` scrim left it reachable (V3P-01). The behaviour is the
 * shared `useModalDialog` of the v46 dialogs.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  groups,
  confirmLabel,
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
    initialFocus: 'title',
    submitOnEnter: false,
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
      </div>
      <div className="rk-dlg-foot">
        <Button ref={modal.cancelRef} size="lg" onClick={() => onCancel()}>
          {cancelLabel}
        </Button>
        <Button
          ref={modal.confirmRef}
          variant="primary"
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
