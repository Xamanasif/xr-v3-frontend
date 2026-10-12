import { createPlaywrightConfig } from './src/playwright.js';

/**
 * Self-tests of the browser helpers on isolated fixture pages (`e2e/fixtures`), served by
 * route interception — no server and no product route. Same four approved widths as the
 * product suites.
 */
export default createPlaywrightConfig({ testDir: './e2e' });
