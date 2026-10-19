/**
 * Public Sans with the weight range the Refined B and XS sheets use (400–800, so 650 and 800
 * render as drawn) — the V3 boards' and the XS export's own link (ADR-0010). Rendered only where a
 * V3 surface is — the sign-in page and the workspaces, whose shared XS surfaces are V3 — never by
 * the root layout, so the locked public landing keeps exactly its fonts. React hoists the link into
 * the document head once (`precedence`).
 */
export function V3Fonts() {
  return (
    // eslint-disable-next-line @next/next/no-page-custom-font -- a V3 surface's own font range
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400..800&display=swap"
      precedence="v3-fonts"
    />
  );
}
