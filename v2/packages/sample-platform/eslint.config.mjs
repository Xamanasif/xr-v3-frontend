import { boundaries, determinism, node } from '@xr/config/eslint';

// No Math.random or Date.now anywhere in this package — the ./testing export and the tests
// included (Appendix F §3.8; WP-0.11 acceptance 6): time comes from the sample clock, ids and
// nonces from injected deterministic sources.
export default [...node, boundaries('@xr/sample-platform'), { ...determinism, ignores: [] }];
