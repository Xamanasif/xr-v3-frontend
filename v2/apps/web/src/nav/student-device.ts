import { MY_DEVICE } from './nav-config';

/**
 * ST-18 My device (board B3-07): its address (Appendix A register route) and its place in the
 * shell. The account menu opens it (XS-05 "My device", B3-07 f1); it is no sidebar destination, so
 * nothing in the sidebar is current on it (Appendix A §3.6, `active-item.ts`). The top bar reads
 * "My device" with that one crumb current (B3-07 f0).
 */
export const MY_DEVICE_ADDRESS = MY_DEVICE.href;

export const MY_DEVICE_TITLE = MY_DEVICE.label;

export interface MyDevicePlacement {
  readonly screen: 'ST-18';
  readonly title: string;
  readonly trail: readonly [];
}

export function myDevicePlacement(): MyDevicePlacement {
  return { screen: 'ST-18', title: MY_DEVICE_TITLE, trail: [] };
}
