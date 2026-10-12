import { CLOSE, Icon, MENU } from './icon';

/**
 * Stylesheet specimens (WP-0.5) of the public root `div.xp` (xr-public.css), from Batch 1:
 *
 * - `V46PublicPage`: header, a tall page and the B1-06 "Mobile 375" bottom bar ("Summary becomes
 *   a bottom bar with the next step"). PF-06 (`overflow: clip`) lets the bar stick to the viewport
 *   below 1024 xp; PF-02 gives the root the viewport height.
 * - `V46PublicMenu`: B1-01 "Mobile 375 · menu open" — `.xp-scrim` + `.xp-sheet` inside the header.
 *   PF-05 fixes the scrim to the viewport below the header (the canvas used `height: 2000px`).
 * - `V46PublicFilters`: B1-04 "Mobile 375 · filter sheet" — "Filters in a sheet fixed to the
 *   viewport; results update behind it." PF-05 makes `.xp-fsheet` viewport-fixed.
 */
function Header({ menuOpen }: { readonly menuOpen: boolean }) {
  return (
    <header className="xp-head" data-probe="head">
      <div className="xp-in xp-head-row">
        <a className="xp-brand" href="#top" aria-label="XR Learning Platform — home">
          <span className="xp-logo">BITS Pilani / WILP logo — placeholder</span>
          <span className="xp-brand-sep" aria-hidden="true" />
          <span className="xp-brand-name">XR Learning Platform</span>
        </a>
        <nav aria-label="Main">
          <ul className="xp-nav">
            <li>
              <a href="#browse">Browse experiments</a>
            </li>
          </ul>
        </nav>
        <div className="xp-head-end">
          <a className="xp-signin" href="#sign-in">
            Sign in
          </a>
          <button
            type="button"
            className="xp-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="specimen-sheet"
            data-probe="menu-btn"
          >
            <Icon path={menuOpen ? CLOSE : MENU} />
            <span>{menuOpen ? 'Close' : 'Menu'}</span>
          </button>
        </div>
      </div>
      {menuOpen ? (
        <>
          <div className="xp-scrim" aria-hidden="true" data-probe="scrim" />
          <div className="xp-sheet" id="specimen-sheet" data-probe="sheet">
            <div className="xp-in">
              <nav aria-label="Main">
                <ul className="xp-sheet-list">
                  <li>
                    <a href="#browse">Browse experiments</a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}

function Footer() {
  return (
    <footer className="xp-foot">
      <div className="xp-in">
        <p>XR Learning Platform</p>
      </div>
    </footer>
  );
}

export function V46PublicPage() {
  return (
    <div className="xp" data-probe="xp">
      <Header menuOpen={false} />
      <main className="xp-page">
        <div className="xp-in">
          <h1 className="xr-h1">Your selection</h1>
          <div className="specimen-spacer" aria-hidden="true" />
        </div>
      </main>
      <Footer />
      <div className="xp-bottombar" data-probe="bottombar">
        <span className="xp-bottombar-t">1 experiment · 2 formats</span>
        <a className="xr-btn xr-btn--primary xr-btn--sm" href="#request">
          Continue to request
        </a>
      </div>
    </div>
  );
}

export function V46PublicMenu() {
  return (
    <div className="xp" data-probe="xp">
      <Header menuOpen />
      <main className="xp-page">
        <div className="xp-in">
          <h1 className="xr-h1">Set the conditions.</h1>
          <div className="specimen-spacer" aria-hidden="true" />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function V46PublicFilters() {
  return (
    <div className="xp" data-probe="xp">
      <Header menuOpen={false} />
      <main className="xp-page">
        <div className="xp-in">
          <h1 className="xr-h1">Browse experiments</h1>
          <div className="specimen-spacer" aria-hidden="true" />
        </div>
      </main>
      <Footer />
      <div
        className="xp-fsheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="specimen-filters"
        data-probe="fsheet"
      >
        <div className="xp-fsheet-panel">
          <div className="xp-fsheet-head">
            <h2 id="specimen-filters" className="xp-filters-title">
              Filters
            </h2>
            <button type="button" className="xr-icon-btn" aria-label="Close filters">
              <Icon path={CLOSE} />
            </button>
          </div>
          <fieldset className="xp-fgroup">
            <legend>Format</legend>
            <div>
              <label className="xp-fopt" htmlFor="specimen-vr">
                <input type="checkbox" id="specimen-vr" defaultChecked />
                <span>VR</span>
              </label>
            </div>
          </fieldset>
          <div className="xp-fsheet-foot">
            <button type="button" className="xr-btn xr-btn--secondary">
              Clear all
            </button>
            <button type="button" className="xr-btn xr-btn--primary">
              Show 4 experiments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
