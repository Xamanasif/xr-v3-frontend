'use client';

import { Icon } from '@xr/ui';
import { type KeyboardEvent, type ReactNode, useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

import { focusMain, useInertSiblings, usePublicRoot } from './public-frame';

/**
 * The public filter sheet (Appendix E §3.4 FilterSheet; B1-04 "Mobile 375 · filter sheet":
 * "Filters in a sheet fixed to the viewport; results update behind it"; PF-05): `div.xp-fsheet`
 * `role=dialog aria-modal` > `div.xp-fsheet-panel` (head with "Close filters", the facets, the
 * sticky foot). A modal: it renders into the public root, everything else there is inert while it
 * is open, Tab stays inside, Esc and the backdrop close it, and focus returns to the button that
 * opened it. It exists below 1024 px of the public root only, where the side panel is hidden.
 */
/** Whether an element is rendered (not `display: none` itself or through an ancestor). */
function shown(element: HTMLElement): boolean {
  return typeof element.checkVisibility === 'function' ? element.checkVisibility() : true;
}

export function FilterSheet({
  open,
  title,
  closeLabel,
  onClose,
  returnFocusTo,
  children,
  foot,
}: {
  readonly open: boolean;
  readonly title: string;
  readonly closeLabel: string;
  readonly onClose: () => void;
  /** The "Filters" button: focus goes back to it on close. A stable callback. */
  readonly returnFocusTo: () => HTMLElement | null;
  readonly children: ReactNode;
  readonly foot: ReactNode;
}) {
  const root = usePublicRoot();
  const sheet = useRef<HTMLDivElement | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  const keep = useCallback(() => sheet.current, []);
  useInertSiblings(root, open, keep);

  // Opening moves focus into the sheet; closing returns it to the button that opened it
  // (`returnFocusTo` is a stable callback of the page) — or, when the page widened and that button
  // is hidden with the sheet, to the page's main region, so focus is never left on nothing.
  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    return () => {
      const button = returnFocusTo();
      if (button && shown(button)) button.focus();
      else focusMain();
    };
  }, [open, returnFocusTo]);

  // The side panel takes over from 1024 px of the public root (B1-04 "Filters button only where
  // the side panel is hidden"): a sheet left open while the page widens closes.
  useEffect(() => {
    const node = root;
    if (!open || !node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width >= 1024) onClose();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [open, root, onClose]);

  if (!open || !root) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !sheet.current) return;
    const stops = [
      ...sheet.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ];
    const first = stops[0];
    const last = stops.at(-1);
    if (!first || !last) return;
    // From the sheet itself (a click on its text or padding focuses it) Tab enters at either end.
    const at = stops.indexOf(document.activeElement as HTMLElement);
    if (event.shiftKey && at <= 0) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (at === -1 || at === stops.length - 1)) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      ref={sheet}
      className="xp-fsheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      // A click on the sheet's text or padding keeps focus in the dialog, so Esc and the Tab
      // loop still work (not a Tab stop).
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="xp-fsheet-panel">
        <div className="xp-fsheet-head">
          <h2 id={titleId} className="xp-filters-title">
            {title}
          </h2>
          <button
            ref={closeButton}
            type="button"
            className="xr-icon-btn"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
        <div className="xp-fsheet-foot">{foot}</div>
      </div>
    </div>,
    root,
  );
}
