/*
 * Plain data for the sidebar, kept out of the 'use client' sidebar.tsx: in a Server Component
 * every export of a 'use client' module is a client reference, so a server-side navigation check
 * such as `destinations.length > MAX_DESTINATIONS` would silently compare against a function.
 */

/**
 * The product name under the logo (`span.xr-product`; boards 05, 06, 07): plain, swappable text
 * (board 13 Q2), the same in every workspace.
 */
export const PRODUCT_NAME = 'XR Learning Platform';

/** Board 06 "Navigation rules": "At most 8 destinations plus Help." */
export const MAX_DESTINATIONS = 8;
