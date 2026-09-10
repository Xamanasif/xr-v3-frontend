import { node } from './eslint/base.mjs';
import { boundaries } from './eslint/boundaries.mjs';

export default [...node, boundaries('@xr/config')];
