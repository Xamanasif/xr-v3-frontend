/* ============================================================
   Unified Functional Platform — state layer.

   Persistence: localStorage, isolated namespace `xrslp-unified-v1`
   (deliberately NOT any historical batch key; those use
   sessionStorage `xrslp-batch0N-proto-v1`).

   Conceptually separate records (kept as named collections, not one
   anonymous blob):
     · selection      — the selection basket (never an entitlement)
     · draft          — the request being prepared (state DRAFT)
     · requests[]     — institutional access requests
     · tenants[]      — tenant records (seeded internal + created)
     · access[]       — tenant content access records
     · scenarioId     — active prototype requester scenario (A | B)

   Request state machine (STK31-18 / 19 / 20):

     DRAFT → SUBMITTED ─┬─(internal / BITS Community)─▶ ACTIVE
                        └─(external / Subscription)──▶ APPROVED_PAYMENT_REQUIRED
                                                            │ prototype payment
                                                            ▼ simulation
                                                          ACTIVE

   Approval consequences:
     · internal:  approve → ACTIVE → tenant access record created
     · external:  approve → APPROVED_PAYMENT_REQUIRED (NO access yet);
                  payment completion → ACTIVE → tenant (created if
                  missing) + tenant access record.
   Published ≠ entitled: catalogue data (data.js), the selection, the
   request, and tenant access are four separate records — nothing here
   collapses them into one boolean.
   ============================================================ */

window.XRSLP = window.XRSLP || {};

XRSLP.state = (function () {
  'use strict';

  var data = XRSLP.data;
  var util = XRSLP.util;

  var STORAGE_KEY = 'xrslp-unified-v1';

  var STATUS = {
    DRAFT: 'DRAFT',
    SUBMITTED: 'SUBMITTED',
    APPROVED_PAYMENT_REQUIRED: 'APPROVED_PAYMENT_REQUIRED',
    ACTIVE: 'ACTIVE'
  };

  var STATUS_META = {
    DRAFT:                     { label: 'Draft',                       badge: 'b-neutral', icon: 'edit' },
    SUBMITTED:                 { label: 'Submitted',                   badge: 'b-info',    icon: 'clock' },
    APPROVED_PAYMENT_REQUIRED: { label: 'Approved — payment required', badge: 'b-warning', icon: 'card' },
    ACTIVE:                    { label: 'Active',                      badge: 'b-success', icon: 'check' }
  };

  function initialState() {
    return {
      version: 1,
      scenarioId: 'A',
      selection: [],          /* [{ experimentId, technologies: [] }] */
      draft: null,            /* { institutionName, contactName, contactEmail, quantity, term } */
      requests: [],
      tenants: data.SEED_TENANTS.map(function (t) {
        return JSON.parse(JSON.stringify(t));
      }),
      access: [],
      seq: { request: 0, access: 0 }
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { return null; }
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1) { return null; }
      return parsed;
    } catch (e) { return null; }
  }

  var S = load() || initialState();

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); }
    catch (e) { /* storage unavailable — prototype continues in memory */ }
  }

  function reset() {
    S = initialState();
    save();
  }

  /* ---------- scenario ---------- */
  function scenario() { return data.SCENARIOS[S.scenarioId] || data.SCENARIOS.A; }
  function setScenario(id) {
    if (data.SCENARIOS[id]) { S.scenarioId = id; save(); }
  }

  /* ---------- selection basket (CART ≠ ENTITLEMENT) ---------- */
  function selectionItems() { return S.selection; }
  function selectionCount() { return S.selection.length; }
  function selectionGet(experimentId) {
    return S.selection.filter(function (i) { return i.experimentId === experimentId; })[0] || null;
  }
  function selectionAdd(experimentId, technologies) {
    if (!technologies || !technologies.length) { return false; }
    var existing = selectionGet(experimentId);
    if (existing) { existing.technologies = data.sortTech(technologies); }
    else { S.selection.push({ experimentId: experimentId, technologies: data.sortTech(technologies) }); }
    save();
    return true;
  }
  function selectionSetTech(experimentId, technologies) {
    var item = selectionGet(experimentId);
    if (!item || !technologies.length) { return false; }
    item.technologies = data.sortTech(technologies);
    save();
    return true;
  }
  function selectionRemove(experimentId) {
    S.selection = S.selection.filter(function (i) { return i.experimentId !== experimentId; });
    save();
  }
  function selectionClear() { S.selection = []; save(); }

  /* ---------- request draft (state DRAFT — preserved across refresh) ---------- */
  function draft() { return S.draft; }
  function draftSave(fields) { S.draft = fields; save(); }
  function draftClear() { S.draft = null; save(); }

  /* ---------- requests ---------- */
  function requests() { return S.requests; }
  function request(id) {
    return S.requests.filter(function (r) { return r.id === id; })[0] || null;
  }
  function requestsForScenario(scenarioId) {
    return S.requests.filter(function (r) { return r.scenarioId === scenarioId; });
  }

  function submitRequest(form) {
    /* One request record per submission; the selection snapshot is
       copied so later basket edits cannot mutate a submitted request. */
    var sc = scenario();
    S.seq.request += 1;
    var now = new Date().toISOString();
    var req = {
      id: 'REQ-' + util.pad3(S.seq.request),
      scenarioId: sc.id,
      institution: {
        name: form.institutionName,
        kind: sc.institution.kind,
        accessContext: sc.institution.accessContext,
        contactName: form.contactName,
        contactEmail: form.contactEmail
      },
      paymentRequired: sc.institution.paymentRequired,
      items: S.selection.map(function (i) {
        return { experimentId: i.experimentId, technologies: i.technologies.slice() };
      }),
      quantity: form.quantity,
      term: form.term,
      status: STATUS.SUBMITTED,
      submittedAt: now,
      approvedAt: null,
      activatedAt: null,
      tenantId: null,
      history: [
        { at: now, event: 'Request submitted', who: form.institutionName }
      ]
    };
    S.requests.push(req);
    S.selection = [];
    S.draft = null;
    save();
    return req;
  }

  /* ---------- approval + activation consequences ---------- */

  function approveRequest(id) {
    var req = request(id);
    if (!req || req.status !== STATUS.SUBMITTED) { return null; }
    var now = new Date().toISOString();
    req.approvedAt = now;
    if (req.paymentRequired) {
      req.status = STATUS.APPROVED_PAYMENT_REQUIRED;
      req.history.push({ at: now, event: 'Approved — payment required before activation', who: 'Super Admin' });
    } else {
      req.status = STATUS.ACTIVE;
      req.history.push({ at: now, event: 'Approved', who: 'Super Admin' });
      activateRequest(req, now);
    }
    save();
    return req;
  }

  function completePayment(id) {
    var req = request(id);
    if (!req || req.status !== STATUS.APPROVED_PAYMENT_REQUIRED) { return null; }
    var now = new Date().toISOString();
    req.history.push({ at: now, event: 'Payment completion simulated (prototype only)', who: req.institution.name });
    req.status = STATUS.ACTIVE;
    activateRequest(req, now);
    save();
    return req;
  }

  function activateRequest(req, nowIso) {
    /* Tenant: reuse the seeded tenant for the internal scenario; create
       a tenant for a new external institution if one does not exist. */
    var sc = XRSLP.data.SCENARIOS[req.scenarioId];
    var tenant = null;
    if (sc && sc.seedTenantId) { tenant = tenantById(sc.seedTenantId); }
    if (!tenant) { tenant = tenantByName(req.institution.name); }
    if (!tenant) {
      tenant = {
        id: 'tenant-' + util.slug(req.institution.name),
        name: req.institution.name,
        kind: req.institution.kind,
        accessContext: req.institution.accessContext,
        status: 'active',
        origin: 'Created from approved request ' + req.id,
        createdOn: nowIso
      };
      S.tenants.push(tenant);
    }
    req.tenantId = tenant.id;
    req.activatedAt = nowIso;
    req.history.push({ at: nowIso, event: 'Tenant access activated for ' + tenant.name, who: 'Platform' });

    /* Tenant content access record — what the tenant now holds.
       The origin actor is the Super Admin (STK31-24): activation flows
       from the Super Admin approval of this request. */
    S.seq.access += 1;
    var termDef = XRSLP.data.term(req.term);
    S.access.push({
      id: 'ACC-' + util.pad3(S.seq.access),
      tenantId: tenant.id,
      requestId: req.id,
      items: req.items.map(function (i) {
        return { experimentId: i.experimentId, technologies: i.technologies.slice() };
      }),
      quantity: req.quantity,
      term: req.term,
      accessContext: req.institution.accessContext,
      recordedBy: 'Super Admin — request approval',
      startsOn: nowIso,
      endsOn: termDef ? util.addMonths(nowIso, termDef.months) : null
    });
  }

  /* ---------- tenants + access ---------- */
  function tenants() { return S.tenants; }
  function tenantById(id) {
    return S.tenants.filter(function (t) { return t.id === id; })[0] || null;
  }
  function tenantByName(name) {
    var n = String(name || '').trim().toLowerCase();
    return S.tenants.filter(function (t) { return t.name.toLowerCase() === n; })[0] || null;
  }
  function accessForTenant(tenantId) {
    return S.access.filter(function (a) { return a.tenantId === tenantId; });
  }
  function accessAll() { return S.access; }

  /* Derived access-term state: Active · Expiring soon (T-15) · Expired.
     The 15-day expiry reminder itself is a REQUIRED platform capability
     (STK31-28) whose delivery channel is pending (ND-16) — this derived
     in-product state is recommended supporting UX, not the reminder. */
  function accessTermState(rec) {
    if (!rec.endsOn) { return { key: 'active', label: 'Active' }; }
    var days = util.daysUntil(rec.endsOn);
    if (days == null) { return { key: 'active', label: 'Active' }; }
    if (days < 0) { return { key: 'expired', label: 'Expired' }; }
    if (days <= 15) { return { key: 'expiring', label: 'Expiring soon' }; }
    return { key: 'active', label: 'Active' };
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    STATUS: STATUS, STATUS_META: STATUS_META,
    save: save, reset: reset,
    scenario: scenario, setScenario: setScenario,
    selectionItems: selectionItems, selectionCount: selectionCount, selectionGet: selectionGet,
    selectionAdd: selectionAdd, selectionSetTech: selectionSetTech,
    selectionRemove: selectionRemove, selectionClear: selectionClear,
    draft: draft, draftSave: draftSave, draftClear: draftClear,
    requests: requests, request: request, requestsForScenario: requestsForScenario,
    submitRequest: submitRequest, approveRequest: approveRequest, completePayment: completePayment,
    tenants: tenants, tenantById: tenantById,
    accessForTenant: accessForTenant, accessAll: accessAll, accessTermState: accessTermState
  };
})();
