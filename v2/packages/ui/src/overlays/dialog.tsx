'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
} from 'react';

import { Button } from '../foundation/button.js';
import { IconButton } from '../foundation/icon-button.js';
import { joinClasses } from '../internal/classes.js';

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
  /** One sentence on the effect (board 10 "DL-1 · Confirm"), read as the dialog's description. */
  readonly effect: ReactNode;
  /**
   * The red `xr-btn--danger` confirm, and initial focus on Cancel (board 10 "DL-1 · Confirm ·
   * destructive · focus on Cancel"; VD-07: B2-08, B2-09 and B4-07 focus the danger button, the
   * product follows board 10 everywhere, with no per-screen override).
   */
  readonly destructive?: boolean;
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

type InitialFocus = 'confirm' | 'cancel' | 'field';

interface DialogFrameProps extends DialogCommonProps {
  readonly titleId: string;
  readonly describedBy: string | undefined;
  readonly initialFocus: InitialFocus;
  readonly danger: boolean;
  readonly submitOnEnter: boolean;
  /** The `div.xr-dialog-body` element. */
  readonly body: ReactNode;
}

const FIELDS =
  'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])';

const TAB_STOPS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([type="hidden"]):not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const NOT_TEXT_ENTRY = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

function rendered(element: HTMLElement): boolean {
  return typeof element.checkVisibility === 'function' ? element.checkVisibility() : true;
}

/** The dialog's Tab stops in order (Close, the fields, Cancel, the confirming button). */
function tabStops(dialog: HTMLElement): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>(TAB_STOPS)].filter(
    (element) => element.tabIndex >= 0 && rendered(element),
  );
}

function isTextEntry(target: EventTarget): boolean {
  return target instanceof HTMLInputElement && !NOT_TEXT_ENTRY.has(target.type);
}

/**
 * Initial focus by kind (board 10 "Keyboard path"): the first field (DL-2, DL-3; the confirming
 * button when there is none), the confirming button (DL-1), Cancel (destructive DL-1).
 */
function focusInitial(
  dialog: HTMLDialogElement,
  initialFocus: InitialFocus,
  cancel: HTMLButtonElement | null,
  confirm: HTMLButtonElement | null,
): void {
  const field =
    initialFocus === 'field'
      ? dialog.querySelector('.xr-dialog-body')?.querySelector<HTMLElement>(FIELDS)
      : null;
  (field ?? (initialFocus === 'cancel' ? cancel : confirm))?.focus();
}

/** Focus back to the element that opened the dialog or, when it is gone, to the fallback. */
function returnFocus(
  target: HTMLElement | null,
  fallback: RefObject<HTMLElement | null> | undefined,
): void {
  target?.focus();
  if (target && target.ownerDocument.activeElement === target) return;
  fallback?.current?.focus();
}

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
 * body, and `-foot` (Cancel first, the confirming action last).
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  /** The element focused when the dialog opened (the trigger). */
  const returnTarget = useRef<HTMLElement | null>(null);
  const fallback = useRef(returnFocusFallback);
  /** Open as far as this component is concerned (the browser may have closed it already). */
  const shown = useRef(false);
  /** Confirm presses, and the last one whose outcome (invalid field or not) was handled. */
  const [attempt, setAttempt] = useState(0);
  const handledAttempt = useRef(0);
  /** Counts closes the browser made on its own, so `open` is applied to the dialog again. */
  const [browserCloses, setBrowserCloses] = useState(0);

  useEffect(() => {
    fallback.current = returnFocusFallback;
  });

  // Open and close follow the `open` prop, with initial focus by kind; on close focus returns to
  // the trigger (board 10 "On close, focus returns to the trigger"), also when the browser had
  // already closed the dialog itself.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open && dialog.isConnected) {
        if (!shown.current) {
          const active = dialog.ownerDocument.activeElement;
          returnTarget.current =
            active instanceof HTMLElement && active !== dialog.ownerDocument.body ? active : null;
        }
        dialog.showModal();
        focusInitial(dialog, initialFocus, cancelRef.current, confirmRef.current);
      }
      shown.current = dialog.open;
    } else if (shown.current) {
      shown.current = false;
      if (dialog.open) dialog.close();
      returnFocus(returnTarget.current, fallback.current);
      returnTarget.current = null;
    }
  }, [open, initialFocus, browserCloses]);

  // Unmounted while open: focus still returns to the trigger. React has already removed the
  // dialog from the document; a dialog still connected is a StrictMode re-run, not an unmount.
  useEffect(() => {
    const dialog = dialogRef.current;
    const target = returnTarget;
    const fallbackRef = fallback;
    const wasShown = shown;
    return () => {
      if (!wasShown.current || dialog?.isConnected) return;
      wasShown.current = false;
      returnFocus(target.current, fallbackRef.current);
      target.current = null;
    };
  }, []);

  // A failed confirm: focus goes to the first invalid field, whose message is in its description
  // (board 10 "On submit with an error: focus goes to the first invalid field"). A confirm that
  // closed the dialog leaves focus with the trigger.
  useEffect(() => {
    if (busy || attempt === handledAttempt.current) return;
    handledAttempt.current = attempt;
    const dialog = dialogRef.current;
    if (!dialog?.open) return;
    dialog.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [attempt, busy]);

  const confirm = () => {
    if (busy) return;
    setAttempt((count) => count + 1);
    onConfirm();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    const dialog = event.currentTarget;
    if (event.key === 'Escape') {
      // Esc is Cancel. Preventing the keydown stops the native close request.
      event.preventDefault();
      event.stopPropagation();
      onCancel();
      return;
    }
    if (event.key === 'Tab') {
      // Focus-cycle guard (R-25): showModal() alone lets Tab leave for the browser chrome.
      const stops = tabStops(dialog);
      const first = stops[0];
      const last = stops[stops.length - 1];
      const active = dialog.ownerDocument.activeElement;
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      const outside = active === dialog || !(active instanceof Node) || !dialog.contains(active);
      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (
      event.key === 'Enter' &&
      submitOnEnter &&
      isTextEntry(event.target) &&
      !event.nativeEvent.isComposing
    ) {
      // DL-3: Enter in a field saves (board 10 "Enter in the field saves; Esc cancels").
      event.preventDefault();
      confirm();
    }
  };

  // Other close requests (e.g. the Android back gesture) arrive as `cancel`: also Cancel. One the
  // browser does not let the page refuse ends in `close`, handled below.
  const handleCancelEvent = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    if (event.nativeEvent.cancelable) onCancel();
  };

  // The browser closed the dialog while it should be open (a close request the page could not
  // refuse): that is Cancel. If the caller keeps `open`, the dialog opens again.
  const handleCloseEvent = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (!open || !shown.current || event.currentTarget.open) return;
    onCancel();
    setBrowserCloses((count) => count + 1);
  };

  return (
    <dialog
      ref={dialogRef}
      className={joinClasses('xr-dialog', ALIGN_CLASS[align], className)}
      aria-labelledby={titleId}
      aria-describedby={describedBy}
      onKeyDown={handleKeyDown}
      onCancel={handleCancelEvent}
      onClose={handleCloseEvent}
    >
      <div className="xr-dialog-head">
        <h2 id={titleId} className="xr-dialog-title">
          {title}
        </h2>
        <IconButton label="Close" icon="close" onClick={() => onCancel()} />
      </div>
      {body}
      <div className="xr-dialog-foot">
        {/* VD-06 (UNRESOLVED): board 10 draws Cancel as xr-btn--text; every product board draws
            xr-btn--secondary, the recorded provisional default. */}
        <Button ref={cancelRef} variant="secondary" onClick={() => onCancel()}>
          {cancelLabel}
        </Button>
        <Button
          ref={confirmRef}
          variant={danger ? 'danger' : 'primary'}
          busy={busy}
          busyLabel={busyLabel}
          onClick={confirm}
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
 * Body as drawn: `<div class="xr-dialog-body" id="d1-b"><p>…</p></div>`.
 */
export function ConfirmDialog({
  effect,
  destructive = false,
  idPrefix,
  ...common
}: ConfirmDialogProps) {
  const { titleId, descriptionId } = useDialogIds(idPrefix);
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
          <p>{effect}</p>
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
