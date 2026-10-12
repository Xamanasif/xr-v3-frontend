import { boundaries, determinism, node } from '@xr/config/eslint';

// No Math.random or Date.now: time comes from the clock port (Appendix F §3.8, WP-0.4).
export default [...node, boundaries('@xr/domain'), determinism];
