/* ============================================================
   Unified Functional Platform — hash router.
   Routes are declarative; each maps to a screen renderer that
   returns { title, html, after } for the active shell.
   ============================================================ */

window.XRSLP = window.XRSLP || {};

XRSLP.router = (function () {
  'use strict';

  /* area: which navigation shell hosts the screen.
     public   → public shell (no side nav)
     platform → Super Admin workspace shell
     tenant   → Tenant workspace shell */
  var ROUTES = [
    { pattern: [],                                  area: 'public',   screen: 'landing' },
    { pattern: ['catalogue'],                       area: 'public',   screen: 'catalogue' },
    { pattern: ['programme', ':id'],                area: 'public',   screen: 'programme' },
    { pattern: ['course', ':id'],                   area: 'public',   screen: 'course' },
    { pattern: ['experiment', ':id'],               area: 'public',   screen: 'experiment' },
    { pattern: ['selection'],                       area: 'public',   screen: 'selection' },
    { pattern: ['request'],                         area: 'public',   screen: 'requestForm' },
    { pattern: ['requests'],                        area: 'public',   screen: 'requestList' },
    { pattern: ['request-status', ':id'],           area: 'public',   screen: 'requestStatus' },
    { pattern: ['payment', ':id'],                  area: 'public',   screen: 'payment' },
    { pattern: ['platform'],                        redirect: '#/platform/requests' },
    { pattern: ['platform', 'requests'],            area: 'platform', screen: 'platformRequests' },
    { pattern: ['platform', 'requests', ':id'],     area: 'platform', screen: 'platformRequestDetail' },
    { pattern: ['platform', 'institutions'],        area: 'platform', screen: 'platformInstitutions' },
    { pattern: ['tenant'],                          area: 'tenant',   screen: 'tenantHome' },
    /* Tenant Admin workspace. Every destination below is implemented;
       the side navigation contains no link that leads nowhere. */
    { pattern: ['tenant', ':tenantId', 'overview'],           area: 'tenant', screen: 'tenantOverview' },
    { pattern: ['tenant', ':tenantId', 'content-access'],     area: 'tenant', screen: 'tenantContentAccess' },
    { pattern: ['tenant', ':tenantId', 'people'],             area: 'tenant', screen: 'tenantPeople' },
    { pattern: ['tenant', ':tenantId', 'people', 'add-faculty'], area: 'tenant', screen: 'tenantAddFaculty' },
    { pattern: ['tenant', ':tenantId', 'people', 'add-student'], area: 'tenant', screen: 'tenantAddStudent' },
    { pattern: ['tenant', ':tenantId', 'people', 'import'],   area: 'tenant', screen: 'tenantImport' },
    { pattern: ['tenant', ':tenantId', 'person', ':personId'], area: 'tenant', screen: 'tenantPerson' },
    { pattern: ['tenant', ':tenantId', 'groups'],             area: 'tenant', screen: 'tenantGroups' },
    { pattern: ['tenant', ':tenantId', 'groups', 'new'],      area: 'tenant', screen: 'tenantNewGroup' },
    { pattern: ['tenant', ':tenantId', 'group', ':groupId'],  area: 'tenant', screen: 'tenantGroup' },
    { pattern: ['tenant', ':tenantId', 'mappings'],           area: 'tenant', screen: 'tenantMappings' },
    { pattern: ['tenant', ':tenantId', 'assignments'],        area: 'tenant', screen: 'tenantAssignments' },
    { pattern: ['tenant', ':tenantId', 'assignments', 'new'], area: 'tenant', screen: 'tenantNewAssignment' },
    { pattern: ['tenant', ':tenantId', 'faculty-mapping'],    area: 'tenant', screen: 'tenantFacultyMapping' }
  ];

  function parseHash() {
    var h = window.location.hash || '#/';
    h = h.replace(/^#\/?/, '');
    if (!h) { return []; }
    return h.split('/').map(function (p) { return decodeURIComponent(p); }).filter(function (p) { return p !== ''; });
  }

  function match() {
    var parts = parseHash();
    for (var i = 0; i < ROUTES.length; i++) {
      var r = ROUTES[i];
      if (r.pattern.length !== parts.length) { continue; }
      var params = {};
      var ok = true;
      for (var j = 0; j < r.pattern.length; j++) {
        var seg = r.pattern[j];
        if (seg.charAt(0) === ':') { params[seg.slice(1)] = parts[j]; }
        else if (seg !== parts[j]) { ok = false; break; }
      }
      if (ok) {
        return { area: r.area, screen: r.screen, redirect: r.redirect, params: params, parts: parts };
      }
    }
    return { area: 'public', screen: 'notFound', params: {}, parts: parts };
  }

  function go(hash) { window.location.hash = hash; }

  return { match: match, go: go };
})();
