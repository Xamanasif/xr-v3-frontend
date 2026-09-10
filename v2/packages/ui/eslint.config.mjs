import { boundaries, browserGlobals, core, ignores, prettier, typescript } from '@xr/config/eslint';

export default [ignores, ...core, ...typescript, browserGlobals, prettier, boundaries('@xr/ui')];
