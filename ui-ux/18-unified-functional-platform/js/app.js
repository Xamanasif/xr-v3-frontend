/* ============================================================
   Unified Functional Platform — application bootstrap.
   Renders the prototype-controls strip, the active shell
   (public / Super Admin / Tenant Admin) and the routed screen.
   ============================================================ */

(function () {
  'use strict';

  var esc = XRSLP.util.esc;
  var ui = XRSLP.ui;
  var state = XRSLP.state;
  var data = XRSLP.data;
  var screens = XRSLP.screens;

  var firstRender = true;

  /* ---------- prototype controls strip (NOT product UI) ---------- */
  function protobar(area) {
    var sc = state.scenario();
    var options = Object.keys(data.SCENARIOS).map(function (key) {
      var s = data.SCENARIOS[key];
      return '<option value="' + key + '"' + (sc.id === key ? ' selected' : '') + '>' +
        esc(s.id + ' — ' + s.title + ' (' + s.institution.accessContext + ')') + '</option>';
    }).join('');
    return '<div class="protobar">' +
      '<span class="plabel">PROTOTYPE CONTROLS — NOT PRODUCT UI</span>' +
      '<nav aria-label="Prototype view switch — not product navigation">' +
      '<a href="#/catalogue"' + (area === 'public' ? ' aria-current="true"' : '') + '>Public</a>' +
      '<a href="#/platform/requests"' + (area === 'platform' ? ' aria-current="true"' : '') + '>Super Admin</a>' +
      '<a href="#/tenant"' + (area === 'tenant' ? ' aria-current="true"' : '') + '>Tenant Admin</a>' +
      '</nav>' +
      '<div class="pright">' +
      '<label for="proto-scenario">Requester scenario' +
      '<select id="proto-scenario">' + options + '</select></label>' +
      '<button type="button" id="proto-reset">Reset prototype data</button>' +
      '</div></div>';
  }

  function bindProtobar() {
    var sel = document.getElementById('proto-scenario');
    if (sel) {
      sel.addEventListener('change', function () {
        state.setScenario(sel.value);
        var sc = state.scenario();
        ui.toast('Requester scenario set to ' + sc.id + ' — ' + sc.institution.name + '.', 'info');
        render(true);
      });
    }
    var reset = document.getElementById('proto-reset');
    if (reset) {
      reset.addEventListener('click', function () {
        ui.openDialog({
          title: 'Reset prototype data?',
          bodyHTML: '<p>This restores the deterministic seed data: the selection, all requests, ' +
            'created tenants and tenant access records are cleared, and the requester scenario returns to A.</p>' +
            '<div class="consequence">' + ui.ic('info') +
            '<span>Prototype-only action. Storage key: <code>' + esc(state.STORAGE_KEY) + '</code></span></div>',
          okLabel: 'Reset data',
          onConfirm: function () {
            state.reset();
            XRSLP.router.go('#/');
            ui.toast('Prototype data reset to seed state.');
            render(true);
          }
        });
      });
    }
  }

  /* ---------- brand lockup ---------- */
  function brand(href) {
    return '<a class="brandlink" href="' + (href || '#/') + '"><span class="brand">' +
      '<img src="assets/bits-pilani-wilp-logo.png" alt="BITS Pilani WILP" ' +
      'onerror="this.closest(\'.brand\').classList.add(\'no-logo\'); this.remove()">' +
      '<span class="bdiv" aria-hidden="true"></span>' +
      '<span class="pname">XR Simulation Learning Platform</span></span></a>';
  }

  /* ---------- public shell ---------- */
  function publicShell(contentHTML, activeNav) {
    var selCount = state.selectionCount();
    var reqCount = state.requestsForScenario(state.scenario().id).length;
    function navItem(href, key, label, count) {
      return '<a href="' + href + '"' + (activeNav === key ? ' aria-current="page"' : '') + '>' +
        esc(label) +
        (count > 0 ? ' <span class="navcount" aria-hidden="true">' + count + '</span>' +
          '<span class="sr-only"> — ' + count + ' ' + (key === 'selection' ? XRSLP.util.plural(count, 'experiment') + ' selected' : XRSLP.util.plural(count, 'request')) + '</span>' : '') +
        '</a>';
    }
    return '<header class="pubbar"><div class="pubbar-inner">' +
      brand('#/') +
      '<nav class="pubnav" aria-label="Public navigation">' +
      navItem('#/catalogue', 'catalogue', 'Catalogue', 0) +
      navItem('#/requests', 'requests', 'Requests', reqCount) +
      navItem('#/selection', 'selection', 'Selection', selCount) +
      '</nav>' +
      '</div></header>' +
      '<main class="pubmain" id="main-content">' + contentHTML + '</main>' +
      '<footer class="pubfoot"><div class="pubfoot-inner">' +
      '<span>XR Simulation Learning Platform — unified functional prototype</span>' +
      '<span class="fspace"></span>' +
      '<span>Sample catalogue data for demonstration only</span>' +
      '</div></footer>';
  }

  /* ---------- workspace shell (platform + tenant) ---------- */
  function workspaceShell(opts) {
    var navHTML = opts.nav.map(function (n) {
      return '<a class="nitem" href="' + n.href + '"' + (n.active ? ' aria-current="page"' : '') + '>' +
        ui.ic(n.icon) + '<span>' + esc(n.label) + '</span>' +
        (n.count > 0 ? '<span class="ncount" aria-hidden="true">' + n.count + '</span>' +
          '<span class="sr-only"> — ' + n.count + ' ' + esc(n.countLabel || 'items') + '</span>' : '') +
        '</a>';
    }).join('');
    return '<div class="app">' +
      '<header class="topbar">' + brand(opts.homeHref) +
      '<div class="tspace"></div>' +
      (opts.chip ? '<span class="inst-chip">' + esc(opts.chip) + '</span>' : '') +
      '</header>' +
      '<div class="frame">' +
      '<nav class="snav" aria-label="' + esc(opts.navLabel) + '">' +
      '<div class="ws-ctx"><div class="wsk">' + esc(opts.wsKind) + '</div><div class="wsv">' + esc(opts.wsName) + '</div></div>' +
      navHTML +
      '</nav>' +
      '<main class="main" id="main-content"><div class="main-inner">' + opts.contentHTML + '</div></main>' +
      '</div></div>';
  }

  function platformShell(contentHTML, activeKey) {
    var submitted = state.requests().filter(function (r) { return r.status === state.STATUS.SUBMITTED; }).length;
    return workspaceShell({
      homeHref: '#/platform/requests',
      chip: null,
      navLabel: 'Super Admin navigation',
      wsKind: 'Super Admin',
      wsName: 'Platform administration',
      nav: [
        { href: '#/platform/requests', icon: 'doc', label: 'Access requests', active: activeKey === 'requests',
          count: submitted, countLabel: XRSLP.util.plural(submitted, 'request') + ' awaiting a decision' },
        { href: '#/platform/institutions', icon: 'building', label: 'Institutions', active: activeKey === 'institutions', count: 0 }
      ],
      contentHTML: contentHTML
    });
  }

  function tenantShell(contentHTML, tenant, activeKey) {
    return workspaceShell({
      homeHref: '#/tenant',
      chip: tenant ? tenant.name : null,
      navLabel: 'Tenant workspace navigation',
      wsKind: 'Institute Admin / Tenant Admin',
      wsName: tenant ? tenant.name : 'Institution workspace',
      nav: tenant ? [
        { href: '#/tenant/' + encodeURIComponent(tenant.id) + '/content-access', icon: 'layers',
          label: 'Content access', active: activeKey === 'content-access',
          count: state.accessForTenant(tenant.id).length,
          countLabel: 'active access ' + XRSLP.util.plural(state.accessForTenant(tenant.id).length, 'record') }
      ] : [],
      contentHTML: contentHTML
    });
  }

  /* ---------- render cycle ---------- */
  function render(keepFocus) {
    var route = XRSLP.router.match();
    if (route.redirect) { window.location.replace(route.redirect); return; }

    var screenFn = screens[route.screen] || screens.notFound;
    var result = screenFn(route.params);
    if (result.redirect) { window.location.replace(result.redirect); return; }

    var area = result.area || route.area;
    var shellHTML;
    if (area === 'platform') {
      shellHTML = platformShell(result.html, result.navKey);
    } else if (area === 'tenant') {
      shellHTML = tenantShell(result.html, result.tenant, result.navKey);
    } else {
      shellHTML = publicShell(result.html, result.navKey);
    }

    var root = document.getElementById('app-root');
    /* The skip link is the very first focusable element on the page,
       ahead of even the prototype-controls strip. */
    root.innerHTML = '<a class="skip-link" href="#main-content" id="skip-link">Skip to main content</a>' +
      protobar(area) + shellHTML;

    document.title = (result.title ? result.title + ' — ' : '') + 'XR Simulation Learning Platform (Prototype)';

    bindProtobar();
    var skip = document.getElementById('skip-link');
    if (skip) {
      skip.addEventListener('click', function (e) {
        e.preventDefault();
        ui.focusMain(false);
      });
    }
    if (result.after) { result.after(); }

    if (!firstRender && !keepFocus) {
      ui.focusMain(true);
      window.scrollTo(0, 0);
    }
    firstRender = false;
  }

  XRSLP.render = render;

  window.addEventListener('hashchange', function () { render(false); });
  render(true);
})();
