import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only auto-cleans when a GLOBAL `afterEach` exists; Vitest runs
// without globals here, so unmount rendered trees explicitly after every test.
afterEach(() => {
  cleanup();
});

// jsdom has HTMLDialogElement but no showModal()/show()/close() (as in @xr/ui's setup). This
// test-only stand-in keeps the `open` state and fires `close` as a browser does, so a screen's
// confirmation logic can run in jsdom; the top layer, inert page and focus containment are tested
// in a real browser (Playwright).
if (typeof HTMLDialogElement !== 'undefined' && !('showModal' in HTMLDialogElement.prototype)) {
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
    show(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
    close(this: HTMLDialogElement, returnValue?: string) {
      if (!this.hasAttribute('open')) return;
      this.removeAttribute('open');
      if (returnValue !== undefined) this.returnValue = returnValue;
      this.dispatchEvent(new Event('close'));
    },
  });
}
