import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only auto-cleans when a GLOBAL `afterEach` exists; Vitest runs
// without globals here, so unmount rendered trees explicitly after every test.
afterEach(() => {
  cleanup();
});

// jsdom 30 has HTMLDialogElement but no showModal()/show()/close(). This test-only stand-in keeps
// the `open` state and fires `close` as a browser does, so component logic can run in jsdom.
// What only a browser does — top layer, inert page, focus containment, Esc → `cancel` — is
// tested in a real browser (apps/specimens, Playwright).
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
