import { CLOSE, HELP, HOME, Icon, MENU } from './icon';

/**
 * Stylesheet specimen (WP-0.5): the workspace shell with the drawer open, from board 06
 * "Drawer · Student · 375 px" (`.xr-app > .xr-shell.is-drawer > aside.xr-side + .xr-scrim +
 * .xr-main`). The canvas-only `is-focus` on "Close menu" is left out. Below 1024 app width the
 * drawer and scrim must be fixed to the viewport (PF-03); from 1024 the same markup is the
 * sidebar. Links in `.xr-side` take the gold focus ring (PF-07). The root fills the viewport
 * (PF-02). The long page body makes the document scroll, as product pages do.
 */
export function V46DrawerShell() {
  return (
    <div className="xr-app" data-probe="app">
      <div className="xr-shell is-drawer" data-probe="shell">
        <aside className="xr-side" aria-label="Student workspace" data-probe="side">
          <div className="xr-side-head">
            <div className="xr-side-top">
              <div className="xr-logo-ph">BITS Pilani / WILP logo — placeholder</div>
              <button type="button" className="xr-side-btn xr-drawer-close" aria-label="Close menu">
                <Icon path={CLOSE} />
              </button>
            </div>
            <span className="xr-product">XR Learning Platform</span>
          </div>
          <div className="xr-ws">
            <span className="xr-ws-label">Student</span>
            <span className="xr-ws-inst">Godavari Institute of Technology</span>
          </div>
          <nav aria-label="Student navigation">
            <ul className="xr-nav">
              <li>
                <a href="#main" aria-current="page" data-probe="nav-home">
                  <Icon path={HOME} />
                  <span className="xr-nav-text">Home</span>
                </a>
              </li>
            </ul>
          </nav>
          <div className="xr-side-foot">
            <ul className="xr-nav">
              <li>
                <a href="#main">
                  <Icon path={HELP} />
                  <span className="xr-nav-text">Help</span>
                </a>
              </li>
            </ul>
          </div>
        </aside>
        <div className="xr-scrim" aria-hidden="true" data-probe="scrim" />
        <div className="xr-main">
          <header className="xr-top">
            <button type="button" className="xr-menu-btn" aria-expanded="true">
              <Icon path={MENU} />
              <span>Menu</span>
            </button>
            <div className="xr-top-loc">
              <span className="xr-top-title">Home</span>
            </div>
          </header>
          <main className="xr-page" id="main" tabIndex={-1}>
            <span className="xr-overline">Student</span>
            <h1 className="xr-h1">Home</h1>
            <a href="#main" data-probe="page-link">
              A link on the light page
            </a>
            <div data-probe="spacer" aria-hidden="true" className="specimen-spacer" />
          </main>
        </div>
      </div>
    </div>
  );
}
