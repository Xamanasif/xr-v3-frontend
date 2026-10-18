'use client';

import { useId, type ReactNode, type RefObject } from 'react';

import { Button } from '../foundation/button.js';
import { IconButton } from '../foundation/icon-button.js';
import { joinClasses } from '../internal/classes.js';
import { useModalDialog, type ModalInitialFocus } from './modal-dialog.js';

/**
 * Where the dialog sits on wide screens (PF-04; the four `xr-x-dialog--*` classes were accepted by
 * the owner on 12 Oct 2026, the mapping itself stays PROVISIONAL under VD-08). Below 600 px of app
 * width every alignment is the bottom sheet board 10 draws ("Keyboard path and phone layout").
 * - `centre` (default): no modifier, the v46 `margin:auto`.
 * - `start`: 88 px from the top — header actions (canvas `xw-dlg-top`).
 * - `end`: 88 px from the bottom — the last control of a form, e.g. Submit (canvas `xa-dlg-end`).
 * - `decision`: beside the AR-4 decision panel, bottom-aligned below 908 (canvas `xg-dlg`).
 * - `marks`: confirm marks, bottom-aligned below 1024 (canvas `xw-dlg-top xa-dlg-auto`).
 */
export type DialogAlign = 'centre' | 'start' | 'end' | 'decision' | 'marks';

const ALIGN_CLASS: Readonly<Record<DialogAlign, string | null>> = {
  centre: null,
  start: 'xr-x-dialog--start',
  end: 'xr-x-dialog--end',
  decision: 'xr-x-dialog--decision',
  marks: 'xr-x-dialog--marks',
};

/** What every dialog kind (DL-1, DL-2, DL-3) takes. The dialog is controlled: no business logic. */
export interface DialogCommonProps {
  /** Opens the native `dialog.xr-dialog` with showModal() (the page behind becomes inert). */
  readonly open: boolean;
  /** `h2.xr-dialog-title`, the dialog's name (`aria-labelledby`): "Publish Shell-and-Tube Heat Exchanger?". */
  readonly title: ReactNode;
  /** The confirming action, last in the footer: verb + object ("Return to vendor"). */
  readonly confirmLabel: ReactNode;
  /**
   * What the confirm button says while busy ("Publishing…", "Withdrawing…", "Saving…"; board 10).
   * Give it whenever `busy` can be true.
   */
  readonly busyLabel?: ReactNode;
  /**
   * Busy (board 10 "States · focus, validation, busy": "While busy, buttons ignore repeat presses;
   * the label says what is happening"): the confirm is the busy Button (`is-busy`,
   * `aria-disabled="true"`, spinner, `busyLabel`) and ignores repeat presses, Enter in a DL-3
   * field included. Cancel and Close stay exactly as drawn — no board disables them while busy
   * (B2-06 "Student record · after SACC-0310 · interactive deactivate") — and still report
   * `onCancel`: whether a cancel during the action closes the dialog is the caller's decision.
   */
  readonly busy?: boolean;
  /** The confirming action was pressed (or Enter in a DL-3 field). Validation is the caller's. */
  readonly onConfirm: () => void;
  /**
   * Cancel, Close, Esc or a browser close request (board 10 "Esc is Cancel: nothing changes"). The
   * caller closes the dialog by setting `open` to false.
   */
  readonly onCancel: () => void;
  /** The quiet dismiss, first in the footer. Board text "Cancel"; B4-12 draws "Keep answering". */
  readonly cancelLabel?: ReactNode;
  /** PF-04 alignment on wide screens (VD-08 mapping PROVISIONAL). Centred by default. */
  readonly align?: DialogAlign;
  /**
   * Where focus goes on close when the element that opened the dialog is gone (for example its row
   * was removed): the flash notice on the page, `role="status"` with `tabIndex={-1}` (Appendix E
   * §5.3, the "FlashStatus" pattern).
   */
  readonly returnFocusFallback?: RefObject<HTMLElement | null>;
  /**
   * Prefix of the title and description ids (`<prefix>-t`, `<prefix>-b`, as board 10 names them
   * `d1-t` / `d1-b`). A generated id by default.
   */
  readonly idPrefix?: string;
  /** Board context classes (v46 classes only). */
  readonly className?: string;
}

export interface ConfirmDialogProps extends DialogCommonProps {
  /**
   * One sentence on the effect (board 10 "DL-1 · Confirm"), read as the dialog's description.
   * Give `effects` instead where the board lists the effect event by event.
   */
  readonly effect?: ReactNode;
  /**
   * The effect as a list, one line per event — what the action does and does not do yet (B1-11
   * f2 "Confirm · external", f3 "Confirm · internal": "Says what approving does — and does not
   * do"): `ul.xr-x-dialog-effects` in the body (PF-21; the board's `ul.doc-list` is a canvas
   * class). Exactly one of `effect` and `effects` is given.
   */
  readonly effects?: readonly ReactNode[];
  /**
   * The red `xr-btn--danger` confirm, and initial focus on Cancel (board 10 "DL-1 · Confirm ·
   * destructive · focus on Cancel"; VD-07: B2-08, B2-09 and B4-07 focus the danger button, the
   * product follows board 10 everywhere, with no per-screen override).
   */
  readonly destructive?: boolean;
  /**
   * A notice after the effect, inside the body (B2-09 f2 "Remove · written answers would have no
   * marker": `p` then `div.xr-notice--warn`). Phase-2 Package 2B.
   */
  readonly notice?: ReactNode;
}

export interface ReasonDialogProps extends DialogCommonProps {
  /**
   * The effect, saying who will see the reason (board 10 "DL-2 · Confirm with reason": "The
   * vendor sees your reason and can revise and resubmit."). Read as the dialog's description.
   */
  readonly effect: ReactNode;
  /**
   * The required reason field (`div.xr-field` with its label, `textarea.xr-textarea` and, after a
   * failed confirm, its error and `aria-invalid="true"`), built with the form components.
   */
  readonly children: ReactNode;
  /** The red confirm for withdraw-style actions ("Withdraw access"); focus still goes to the field. */
  readonly destructive?: boolean;
}

export interface EditDialogProps extends DialogCommonProps {
  /** Optional sentence above the fields (board 10 draws none for "Rename group"). */
  readonly effect?: ReactNode;
  /** One or two fields (board 10 "DL-3 · Small edit": "Two fields at most"). Enter in a field saves. */
  readonly children: ReactNode;
}

type InitialFocus = Exclude<ModalInitialFocus, 'title'>;

interface DialogFrameProps extends DialogCommonProps {
  readonly titleId: string;
  readonly describedBy: string | undefined;
  readonly initialFocus: InitialFocus;
  readonly danger: boolean;
  readonly submitOnEnter: boolean;
  /** The `div.xr-dialog-body` element. */
  readonly body: ReactNode;
}

/** The body every v46 kind draws: the first field is looked up there (DL-2, DL-3). */
const BODY = '.xr-dialog-body';

/** The title and description ids (`<prefix>-t`, `<prefix>-b`). */
function useDialogIds(idPrefix: string | undefined): { titleId: string; descriptionId: string } {
  const generated = useId();
  const prefix = idPrefix ?? generated;
  return { titleId: `${prefix}-t`, descriptionId: `${prefix}-b` };
}

/**
 * The native `dialog.xr-dialog` every kind shares (board 10 "Try it · keyboard and pointer";
 * Appendix E §3.4, §5.3): rendered where it is placed (inside `div.xr-app`, no portal, so the
 * `@container xr-app` rules apply), opened with showModal(), with `-head` (title + Close), the
 * body, and `-foot` (Cancel first, the confirming action last). The behaviour is
 * `useModalDialog` (`modal-dialog.ts`), shared with the V3 confirmation.
 */
function DialogFrame({
  open,
  title,
  confirmLabel,
  busyLabel,
  busy = false,
  onConfirm,
  onCancel,
  cancelLabel = 'Cancel',
  align = 'centre',
  returnFocusFallback,
  className,
  titleId,
  describedBy,
  initialFocus,
  danger,
  submitOnEnter,
  body,
}: DialogFrameProps) {
  const modal = useModalDialog({
    open,
    busy,
    onConfirm,
    onCancel,
    returnFocusFallback,
    initialFocus,
    submitOnEnter,
    bodySelector: BODY,
  });

  return (
    <dialog
      ref={modal.dialogRef}
      className={joinClasses('xr-dialog', ALIGN_CLASS[align], className)}
      aria-labelledby={titleId}
      aria-describedby={describedBy}
      onKeyDown={modal.onKeyDown}
      onCancel={modal.onCancel}
      onClose={modal.onClose}
    >
      <div className="xr-dialog-head">
        <h2 id={titleId} className="xr-dialog-title">
          {title}
        </h2>
        <IconButton label="Close" icon="close" onClick={() => onCancel()} />
      </div>
      {body}
      <div className="xr-dialog-foot">
        {/* VD-06, decided by the owner on 14 Oct 2026 (WP-0.15 closure, DEV-08): Cancel is
            xr-btn--secondary, as every product board draws it; board 10 draws xr-btn--text. */}
        <Button ref={modal.cancelRef} variant="secondary" onClick={() => onCancel()}>
          {cancelLabel}
        </Button>
        <Button
          ref={modal.confirmRef}
          variant={danger ? 'danger' : 'primary'}
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

/**
 * DL-1 Confirm (board 10): an action that is hard to undo or has an effect beyond this page, with
 * one sentence on the effect. Initial focus: the confirming button, or Cancel when destructive.
 * Body as drawn: `<div class="xr-dialog-body" id="d1-b"><p>…</p></div>`; with `effects`, B1-11's list
 * (`ul.xr-x-dialog-effects`, PF-21) in its place.
 */
export function ConfirmDialog({
  effect,
  effects,
  destructive = false,
  notice,
  idPrefix,
  ...common
}: ConfirmDialogProps) {
  const { titleId, descriptionId } = useDialogIds(idPrefix);
  if ((effect === undefined) === (effects === undefined)) {
    throw new Error('ConfirmDialog takes exactly one of `effect` and `effects`.');
  }
  return (
    <DialogFrame
      {...common}
      titleId={titleId}
      describedBy={descriptionId}
      initialFocus={destructive ? 'cancel' : 'confirm'}
      danger={destructive}
      submitOnEnter={false}
      body={
        <div className="xr-dialog-body" id={descriptionId}>
          {effects ? (
            <ul className="xr-x-dialog-effects">
              {effects.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          ) : (
            <p>{effect}</p>
          )}
          {notice}
        </div>
      }
    />
  );
}

/**
 * DL-2 Confirm with reason (board 10): return, send back, withdraw, pause, hold. The reason is
 * required and shown to the person affected; the effect sentence says who will see it. Initial
 * focus: the reason field. A failed confirm moves focus to the first invalid field.
 */
export function ReasonDialog({
  effect,
  children,
  destructive = false,
  idPrefix,
  ...common
}: ReasonDialogProps) {
  const { titleId, descriptionId } = useDialogIds(idPrefix);
  return (
    <DialogFrame
      {...common}
      titleId={titleId}
      describedBy={descriptionId}
      initialFocus="field"
      danger={destructive}
      submitOnEnter={false}
      body={
        <div className="xr-dialog-body">
          <p id={descriptionId}>{effect}</p>
          {children}
        </div>
      }
    />
  );
}

/**
 * DL-3 Small edit (board 10): one short value, two fields at most ("Rename group"). Initial focus:
 * the first field; Enter in a field saves; a failed save moves focus to the first invalid field.
 */
export function EditDialog({ effect, children, idPrefix, ...common }: EditDialogProps) {
  const { titleId, descriptionId } = useDialogIds(idPrefix);
  const described = effect !== undefined && effect !== null;
  return (
    <DialogFrame
      {...common}
      titleId={titleId}
      describedBy={described ? descriptionId : undefined}
      initialFocus="field"
      danger={false}
      submitOnEnter
      body={
        <div className="xr-dialog-body">
          {described ? <p id={descriptionId}>{effect}</p> : null}
          {children}
        </div>
      }
    />
  );
}
