import { test } from '@playwright/test';

import { TEST_HOOKS_URL } from '../support';
import { declareFlowSkeletons } from './registry';

/**
 * Flow C — learning, runtime reports, per-format completion and feedback (B3-01 … B3-12): deferred full-UI tests (WP-0.14 (c); Appendix F §7.2). Every entry is `test.fixme`
 * until its screens exist; the behaviour is proved now at port level and on Phase-0 screens.
 */
test.use({ baseURL: TEST_HOOKS_URL });

test.describe('Flow C — learning, runtime reports, per-format completion and feedback (B3-01 … B3-12)', () => {
  declareFlowSkeletons('C');
});
