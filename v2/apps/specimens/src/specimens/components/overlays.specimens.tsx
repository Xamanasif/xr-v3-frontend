import type { DialogAlign } from '@xr/ui';

import type { Specimen } from '../types';
import {
  AccountMenuSpecimen,
  DialogAlignSpecimen,
  DialogSpecimen,
  DrawerSpecimen,
  RailTooltipSpecimen,
} from './overlays';

const ALIGNS = [
  'centre',
  'start',
  'end',
  'decision',
  'marks',
] as const satisfies readonly DialogAlign[];

export const OVERLAY_SPECIMENS: Readonly<Record<string, Specimen>> = {
  'c-dialog': {
    title: 'Dialog: DL-1 confirm and destructive, DL-2 reason, DL-3 edit; busy, validation, focus',
    source:
      '10 "Try it · keyboard and pointer", "States · focus, validation, busy", "Keyboard path and phone layout"; B2-08 "Remove member (DL-1)"',
    render: () => <DialogSpecimen />,
  },
  ...Object.fromEntries(
    ALIGNS.map((align) => [
      `c-dialog-align-${align}`,
      {
        title: `Dialog open on load, align ${align} (PF-04; VD-08 provisional)`,
        source: '10 "Keyboard path and phone layout"; PF-04 alignment classes',
        render: () => <DialogAlignSpecimen align={align} />,
      } satisfies Specimen,
    ]),
  ),
  'c-drawer': {
    title: 'Drawer below 1024 (useDrawer, Menu, Close menu, scrim); rail tooltips 1024–1279',
    source: '06 "Drawer · Student · 375 px", "Behaviour"; 05 workspace shell; 12 "Patterns"',
    render: () => <DrawerSpecimen />,
  },
  'c-account-menu': {
    title: 'AccountMenu: disclosure in the top bar',
    source:
      '03 "Account menu"; 05 workspace shell (aria-controls); 12 "Patterns"; B3-07 "Entry · account menu (Rahul has VR)"',
    render: () => <AccountMenuSpecimen />,
  },
  'c-rail-tooltip': {
    title: 'RailTooltip: the 72 px rail, tooltips on hover and focus',
    source: '06 "Rail · Institute Admin · tooltip on hover and focus", "Behaviour"',
    render: () => <RailTooltipSpecimen />,
  },
};
