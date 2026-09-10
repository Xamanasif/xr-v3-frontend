import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only auto-cleans when a GLOBAL `afterEach` exists; Vitest runs
// without globals here, so unmount rendered trees explicitly after every test.
afterEach(() => {
  cleanup();
});
