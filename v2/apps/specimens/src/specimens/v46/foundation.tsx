/**
 * Stylesheet specimen (WP-0.5): the page body and the single-layer cascade of the 8 v46 sheets.
 * Static board markup only — no product component (those arrive in WP-0.6).
 *
 * - Delete buttons: B6-09 `<button class="xr-btn xr-btn--text xg-del">` (69 uses on 11 boards).
 *   Disabled or busy, `.xr-btn[disabled],.xr-btn[aria-disabled="true"]` (xr-foundation.css,
 *   specificity 0,2,0) must beat `.xg-del` (xr-govern.css, 0,1,0): Appendix E §2.2.
 * - Heading: `.xr-h1` and its phone scale below 600 app width (Appendix E §1.2 T-6).
 */
export function V46Foundation() {
  return (
    <div className="xr-app" data-probe="app">
      <main className="xr-page">
        <h1 className="xr-h1" data-probe="h1">
          Updates and corrections
        </h1>
        <p className="xr-meta">Stylesheet specimen</p>
        <button type="button" className="xr-btn xr-btn--text xg-del" data-probe="delete">
          Withdraw
        </button>
        <button
          type="button"
          className="xr-btn xr-btn--text xg-del"
          aria-disabled="true"
          data-probe="delete-aria-disabled"
        >
          Withdraw
        </button>
        <button
          type="button"
          className="xr-btn xr-btn--text xg-del"
          disabled
          data-probe="delete-disabled"
        >
          Withdraw
        </button>
      </main>
    </div>
  );
}
