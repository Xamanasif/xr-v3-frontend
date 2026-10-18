'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
  type SyntheticEvent,
} from 'react';

/**
 * Where focus goes when a modal dialog opens: the first field (DL-2, DL-3; the confirming button
 * when there is none), the confirming button (DL-1), Cancel (destructive DL-1) — board 10
 * "Keyboard path" — or the title (the V3 confirmation, `pack/references/v3/HANDOFF-original.md`
 * "Opening it focuses the title"; ADR-0010).
 */
export type ModalInitialFocus = 'confirm' | 'cancel' | 'field' | 'title';

export interface ModalDialogOptions {
  readonly open: boolean;
  readonly busy: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly returnFocusFallback?: RefObject<HTMLElement | null>;
  readonly initialFocus: ModalInitialFocus;
  /** DL-3: Enter in a text field confirms. */
  readonly submitOnEnter: boolean;
  /** Where the fields are, for `initialFocus: 'field'` (the dialog's body). */
  readonly bodySelector: string;
}

/** What a dialog frame spreads on its native `dialog` and its buttons. */
export interface ModalDialog {
  readonly dialogRef: RefObject<HTMLDialogElement | null>;
  readonly cancelRef: RefObject<HTMLButtonElement | null>;
  readonly confirmRef: RefObject<HTMLButtonElement | null>;
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
  /** The confirming press: ignored while busy; counts the attempt for the invalid-field focus. */
  readonly confirm: () => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLDialogElement>) => void;
  readonly onCancel: (event: SyntheticEvent<HTMLDialogElement>) => void;
  readonly onClose: (event: SyntheticEvent<HTMLDialogElement>) => void;
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

/** Initial focus by kind (`ModalInitialFocus`). */
function focusInitial(
  dialog: HTMLDialogElement,
  initialFocus: ModalInitialFocus,
  bodySelector: string,
  cancel: HTMLButtonElement | null,
  confirm: HTMLButtonElement | null,
  title: HTMLHeadingElement | null,
): void {
  if (initialFocus === 'title' && title) {
    title.focus();
    return;
  }
  const field =
    initialFocus === 'field'
      ? dialog.querySelector(bodySelector)?.querySelector<HTMLElement>(FIELDS)
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

/** Whether `element` comes before `stop` in document order. */
function precedes(element: Node, stop: Node): boolean {
  return Boolean(element.compareDocumentPosition(stop) & Node.DOCUMENT_POSITION_FOLLOWING);
}

/**
 * The behaviour every modal dialog of @xr/ui shares (board 10 "Try it · keyboard and pointer";
 * Appendix E §3.4, §5.3): the native `dialog` opened with showModal() (the page behind becomes
 * inert), initial focus by kind, the Tab-cycle guard (R-25), Esc and every browser close request
 * as Cancel, focus back to the trigger (or the fallback) on close or unmount, and focus on the
 * first invalid field after a failed confirm. The v46 frame (`dialog.tsx`) and the V3
 * confirmation (`v3/dialog.tsx`) render their own markup around it.
 */
export function useModalDialog({
  open,
  busy,
  onConfirm,
  onCancel,
  returnFocusFallback,
  initialFocus,
  submitOnEnter,
  bodySelector,
}: ModalDialogOptions): ModalDialog {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
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
        focusInitial(
          dialog,
          initialFocus,
          bodySelector,
          cancelRef.current,
          confirmRef.current,
          titleRef.current,
        );
      }
      shown.current = dialog.open;
    } else if (shown.current) {
      shown.current = false;
      if (dialog.open) dialog.close();
      returnFocus(returnTarget.current, fallback.current);
      returnTarget.current = null;
    }
  }, [open, initialFocus, bodySelector, browserCloses]);

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

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
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
      // Focus on an element before the first Tab stop (the V3 title, focused on open) is inside
      // the cycle too: Shift+Tab from it goes round to the last stop.
      const beforeFirst = !outside && active !== first && precedes(active, first);
      if (event.shiftKey && (active === first || outside || beforeFirst)) {
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
  const onCancelEvent = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    if (event.nativeEvent.cancelable) onCancel();
  };

  // The browser closed the dialog while it should be open (a close request the page could not
  // refuse): that is Cancel. If the caller keeps `open`, the dialog opens again.
  const onCloseEvent = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (!open || !shown.current || event.currentTarget.open) return;
    onCancel();
    setBrowserCloses((count) => count + 1);
  };

  return {
    dialogRef,
    cancelRef,
    confirmRef,
    titleRef,
    confirm,
    onKeyDown,
    onCancel: onCancelEvent,
    onClose: onCloseEvent,
  };
}
