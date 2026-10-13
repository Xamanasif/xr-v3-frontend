import { test } from '@playwright/test';

import { TEST_HOOKS_URL } from '../support';
import { declareFlowSkeletons } from './registry';

/**
 * Flow E — Vendor submission, Academic Reviewer approval, Content Manager publication (B5-03 … B6-12): deferred full-UI tests (WP-0.14 (c); Appendix F §7.2). Every entry is `test.fixme`
 * until its screens exist; the behaviour is proved now at port level and on Phase-0 screens.
 */
test.use({ baseURL: TEST_HOOKS_URL });

test.describe('Flow E — Vendor submission, Academic Reviewer approval, Content Manager publication (B5-03 … B6-12)', () => {
  declareFlowSkeletons('E');
});
