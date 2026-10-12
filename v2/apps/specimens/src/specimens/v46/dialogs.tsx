'use client';

import { useEffect, useRef } from 'react';

import { CLOSE, Icon } from './icon';

/** PF-04 alignment modifiers (product classes, `xr-x-*`). */
export type DialogAlign = 'centre' | 'start' | 'end' | 'decision' | 'marks';

const MODIFIER: Readonly<Record<DialogAlign, string>> = {
  centre: '',
  start: ' xr-x-dialog--start',
  end: ' xr-x-dialog--end',
  decision: ' xr-x-dialog--decision',
  marks: ' xr-x-dialog--marks',
};

/**
 * Stylesheet specimen (WP-0.5, PF-04): the board 10 "Keyboard path and phone layout" dialog
 * ("Return to vendor?") as a native `dialog.xr-dialog` opened with showModal() inside
 * `div.xr-app` — the contract the WP-0.6 Dialog follows. The canvas drew it as
 * `div.xr-dialog[role=dialog]` inside a frame-relative scrim; the product uses the top layer.
 * Opening it is the harness's job here; focus management is the component's (WP-0.6).
 */
export function V46Dialog({ align }: { readonly align: DialogAlign }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);
  return (
    <div className="xr-app" data-probe="app">
      <main className="xr-page">
        <h1 className="xr-h1">Review a submission</h1>
      </main>
      <dialog
        ref={dialog}
        className={`xr-dialog${MODIFIER[align]}`}
        aria-labelledby="specimen-dialog-title"
        data-probe="dialog"
      >
        <div className="xr-dialog-head">
          <p className="xr-dialog-title" id="specimen-dialog-title">
            Return to vendor?
          </p>
          <button type="button" className="xr-icon-btn" aria-label="Close">
            <Icon path={CLOSE} />
          </button>
        </div>
        <div className="xr-dialog-body">
          <div className="xr-field">
            <label className="xr-label" htmlFor="specimen-reason">
              Reason the vendor will see
            </label>
            <textarea id="specimen-reason" className="xr-textarea" />
          </div>
        </div>
        <div className="xr-dialog-foot">
          <button type="button" className="xr-btn xr-btn--text" data-probe="cancel">
            Cancel
          </button>
          <button type="button" className="xr-btn xr-btn--primary" data-probe="confirm">
            Return to vendor
          </button>
        </div>
      </dialog>
    </div>
  );
}
