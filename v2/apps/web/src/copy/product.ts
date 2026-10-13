/**
 * The product's name as the boards write it (B8-03; every shell's `span.xr-product`), after each
 * page's own title in the browser tab (Appendix F §3.3 metadata: "XR Learning Platform" + per-page
 * titles).
 */
export const PRODUCT_NAME = 'XR Learning Platform';

/** The browser tab's title for a page (WCAG 2.4.2): "Help & support · XR Learning Platform". */
export function documentTitle(pageTitle: string): string {
  return pageTitle ? `${pageTitle} · ${PRODUCT_NAME}` : PRODUCT_NAME;
}
