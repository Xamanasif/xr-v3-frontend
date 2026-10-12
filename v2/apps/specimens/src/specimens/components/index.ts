import type { Specimen } from '../types';
import { FOUNDATION_ACTION_SPECIMENS } from './foundation-actions.specimens';
import { FOUNDATION_CONTENT_SPECIMENS } from './foundation-content.specimens';
import { FOUNDATION_STRUCTURE_SPECIMENS } from './foundation-structure.specimens';
import { FORMS_A_SPECIMENS } from './forms-a.specimens';
import { FORMS_B_SPECIMENS } from './forms-b.specimens';
import { DATA_SPECIMENS } from './data.specimens';
import { OVERLAY_SPECIMENS } from './overlays.specimens';
import { ROLE_SHELL_SPECIMENS } from './role-shells.specimens';
import { SHELL_SPECIMENS } from './shells.specimens';

/**
 * The @xr/ui component specimens (WP-0.6), one module per inventory group, and the WP-0.8 role
 * shells. Ids are prefixed `c-` so they never collide with the WP-0.5 stylesheet specimens
 * (`v46-*`).
 */
export const COMPONENT_SPECIMENS: Readonly<Record<string, Specimen>> = {
  ...FOUNDATION_ACTION_SPECIMENS,
  ...FOUNDATION_CONTENT_SPECIMENS,
  ...FOUNDATION_STRUCTURE_SPECIMENS,
  ...FORMS_A_SPECIMENS,
  ...FORMS_B_SPECIMENS,
  ...OVERLAY_SPECIMENS,
  ...DATA_SPECIMENS,
  ...SHELL_SPECIMENS,
  ...ROLE_SHELL_SPECIMENS,
};
