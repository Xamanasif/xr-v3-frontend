import { documentTitle } from '@/copy/product';

/**
 * The browser tab's title for the page on show (WCAG 2.4.2; Appendix F §3.3 "XR Learning
 * Platform" + per-page titles): a React `<title>`, which React hoists into the document head.
 * The workspace pages know their title only in the browser (the shell waits for the tab's session,
 * ADR-0004), so the title is rendered with the page rather than by the root layout's metadata —
 * a metadata title committed after hydration would replace it (WP-0.13). Exactly one renders at a
 * time: the session's loading state, the workspace shell, or the public not-found page.
 */
export function DocumentTitle({ title }: { readonly title: string }) {
  return <title>{documentTitle(title)}</title>;
}
