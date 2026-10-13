import { test } from '@playwright/test';

import { TEST_HOOKS_URL } from '../support';
import { declareFlowSkeletons } from './registry';

/**
 * Flow A — public request, Super Admin decision, institutional access (B1-05 … B1-13): deferred full-UI tests (WP-0.14 (c); Appendix F §7.2). Every entry is `test.fixme`
 * until its screens exist; the behaviour is proved now at port level and on Phase-0 screens.
 */
test.use({ baseURL: TEST_HOOKS_URL });

test.describe('Flow A — public request, Super Admin decision, institutional access (B1-05 … B1-13)', () => {
  declareFlowSkeletons('A');
});
