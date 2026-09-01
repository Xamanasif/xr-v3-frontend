/* ============================================================
   Unified Functional Platform — state layer.

   Persistence: localStorage, isolated namespace `xrslp-unified-v1`
   (deliberately NOT any historical batch key; those use
   sessionStorage `xrslp-batch0N-proto-v1`).

   ── SCHEMA VERSION 2 (Implementation 02) ──────────────────────
   The namespace is unchanged. `schemaVersion` inside the stored
   object carries the evolution instead, so an Implementation-01
   browser state upgrades in place: missing collections are created
   empty and NOTHING existing is destroyed. Only an explicit
   “Reset prototype data” restores the deterministic seed.

   Conceptually separate records (named collections, not one blob):

     Implementation 01
     · selection        — the selection basket (never an entitlement)
     · draft            — the request being prepared (state DRAFT)
     · requests[]       — institutional access requests
     · tenants[]        — tenant records (seeded internal + created)
     · access[]         — TenantContentAccess: what the TENANT holds

     Implementation 02
     · people[]         — TenantUser (Faculty + Student profiles)
     · groups[]         — StudentGroup
     · memberships[]    — GroupMembership
     · courseMappings[] — TenantCourseMapping (LOCAL code + OPTIONAL semester)
     · facultyMappings[]— FacultyAssignment (Faculty → Course / Experiment)
     · assignments[]    — ExperimentAssignment (Student or Group)

   StudentEntitlement is DERIVED, never stored — the model
   `17_CONCEPTUAL_DATA_AND_STATE_MODEL.md` §4 requires
   (“DERIVED LEARNER ELIGIBILITY ← never stored”). Deriving it is
   also the only way the multi-source rules below stay correct:
   one effective entitlement, several assignment sources, and
   removing one source never removes an entitlement another source
   still supports.

   ── THE THREE ALTITUDES (must never collapse) ────────────────
        PUBLISHED            catalogue content (data.js)
             ≠
        TENANT ACCESS        access[]      — Super Admin allocates (STK31-24)
             ≠
        STUDENT ENTITLEMENT  derived       — Tenant Admin assigns   (STK31-25)

   Request state machine (STK31-18 / 19 / 20) — unchanged:

     DRAFT → SUBMITTED ─┬─(internal / BITS Community)─▶ ACTIVE
                        └─(external / Subscription)──▶ APPROVED_PAYMENT_REQUIRED
                                                            │ prototype payment
                                                            ▼ simulation
                                                          ACTIVE
   ============================================================ */

window.XRSLP = window.XRSLP || {};

XRSLP.state = (function () {
  'use strict';

  var data = XRSLP.data;
  var util = XRSLP.util;

  var STORAGE_KEY = 'xrslp-unified-v1';
  var SCHEMA_VERSION = 2;

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

  /* Provenance of a person record (ND-04). There is no ERP route in
     this slice; the value is left open so a sync path can join later
     without changing the surface. */
  var SOURCE_META = {
    seed:   'Prototype seed',
    manual: 'Manual entry',
    csv:    'CSV import'
  };

  /* ---------------- initial / seed state ---------------- */

  function emptyCollections() {
    return {
      people: [],
      groups: [],
      memberships: [],
      courseMappings: [],
      facultyMappings: [],
      assignments: []
    };
  }

  function initialState() {
    var S0 = {
      schemaVersion: SCHEMA_VERSION,
      scenarioId: 'A',
      selection: [],          /* [{ experimentId, technologies: [] }] */
      draft: null,            /* { institutionName, contactName, contactEmail, quantity, term } */
      requests: [],
      tenants: data.SEED_TENANTS.map(function (t) {
        return JSON.parse(JSON.stringify(t));
      }),
      access: [],
      people: [],
      groups: [],
      memberships: [],
      courseMappings: [],
      facultyMappings: [],
      assignments: [],
      /* `event` is a monotonic ordering counter. Wall-clock timestamps
         are display-only: several records can share a millisecond, so
         allocation ordering must never depend on them. */
      seq: { request: 0, access: 0, person: 0, group: 0, membership: 0, mapping: 0, facultyMap: 0, assignment: 0, event: 0 }
    };
    seedTenantOperations(S0);
    return S0;
  }

  /* Seeded Faculty / Students / Groups / local mappings for the seeded
     internal tenant.

     ⚠ Deliberately seeds NO access record and NO assignment: a fresh
     reset still has zero tenant access and zero student entitlement,
     so Implementation 01's two scenarios stay exactly as documented
     and “tenant access ≠ student entitlement” stays visible. */
  function seedTenantOperations(S0) {
    var tenantId = data.SEED_TENANT_ID;
    if (!S0.tenants.filter(function (t) { return t.id === tenantId; }).length) { return; }
    var now = new Date().toISOString();
    var byStudentId = {};

    data.SEED_PEOPLE.forEach(function (p) {
      S0.seq.person += 1;
      S0.seq.event += 1;
      var rec = {
        id: 'USR-' + util.pad3(S0.seq.person),
        tenantId: tenantId,
        role: p.role,
        name: p.name,
        email: p.email,
        status: 'active',
        source: 'seed',
        createdAt: now,
        activatedAt: now,
        activationSeq: S0.seq.event,
        deactivatedAt: null
      };
      if (p.role === 'faculty') {
        rec.facultyId = p.facultyId || '';
      } else {
        rec.studentId = p.studentId;
        rec.groupingId = p.groupingId;
        rec.courseId = p.courseId;
        rec.localCourseCode = p.localCourseCode || '';
        rec.semester = p.semester || '';
        rec.organisation = p.organisation || '';
        rec.planTerms = p.planTerms || '';
        byStudentId[p.studentId] = rec.id;
      }
      S0.people.push(rec);
    });

    data.SEED_GROUPS.forEach(function (g) {
      S0.seq.group += 1;
      var gid = 'GRP-' + util.pad3(S0.seq.group);
      S0.groups.push({
        id: gid, tenantId: tenantId, name: g.name,
        description: g.description || '', createdAt: now
      });
      (g.members || []).forEach(function (sid) {
        var personId = byStudentId[sid];
        if (!personId) { return; }
        S0.seq.membership += 1;
        S0.memberships.push({
          id: 'GM-' + util.pad3(S0.seq.membership),
          tenantId: tenantId, groupId: gid, personId: personId, addedAt: now
        });
      });
    });

    data.SEED_COURSE_MAPPINGS.forEach(function (m) {
      S0.seq.mapping += 1;
      S0.courseMappings.push({
        id: 'MAP-' + util.pad3(S0.seq.mapping),
        tenantId: tenantId, courseId: m.courseId,
        localCode: m.localCode || '', semester: m.semester || '',
        updatedAt: now
      });
    });
  }

  /* ---------------- load + migrate ---------------- */

  /* Migration is additive only. An Implementation-01 state (`version: 1`)
     keeps every request, tenant and access record it already holds and
     simply gains the empty Implementation-02 collections. */
  function migrate(parsed) {
    var stored = parsed.schemaVersion || parsed.version || 1;
    if (stored > SCHEMA_VERSION) { return null; }   /* newer than this build — fall back to seed */

    var blank = emptyCollections();
    Object.keys(blank).forEach(function (key) {
      if (!Array.isArray(parsed[key])) { parsed[key] = blank[key]; }
    });
    if (!parsed.seq || typeof parsed.seq !== 'object') { parsed.seq = {}; }
    ['request', 'access', 'person', 'group', 'membership', 'mapping', 'facultyMap', 'assignment', 'event']
      .forEach(function (k) {
        if (typeof parsed.seq[k] !== 'number') { parsed.seq[k] = 0; }
      });
    if (!Array.isArray(parsed.requests)) { parsed.requests = []; }
    if (!Array.isArray(parsed.access)) { parsed.access = []; }
    if (!Array.isArray(parsed.selection)) { parsed.selection = []; }
    if (!Array.isArray(parsed.tenants) || !parsed.tenants.length) {
      parsed.tenants = data.SEED_TENANTS.map(function (t) { return JSON.parse(JSON.stringify(t)); });
    }
    /* Backfill the monotonic ordering fields for any record written by
       an earlier build: array order is the creation order. */
    parsed.people.forEach(function (p) {
      if (typeof p.activationSeq !== 'number') { parsed.seq.event += 1; p.activationSeq = parsed.seq.event; }
    });
    parsed.assignments.forEach(function (a) {
      if (typeof a.eventSeq !== 'number') { parsed.seq.event += 1; a.eventSeq = parsed.seq.event; }
    });
    parsed.schemaVersion = SCHEMA_VERSION;
    delete parsed.version;
    parsed.migratedFrom = stored < SCHEMA_VERSION ? stored : (parsed.migratedFrom || null);
    return parsed;
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { return null; }
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') { return null; }
      return migrate(parsed);
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

  /* Monotonic ordering stamp — independent of the clock. */
  function nextEvent() { S.seq.event += 1; return S.seq.event; }

  function migratedFrom() { return S.migratedFrom || null; }

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
       from the Super Admin approval of this request.

       ⚠ Activation creates NO student entitlement. Holding content is
       not the same as any student having it (STK31-25). */
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
  function accessById(id) {
    return S.access.filter(function (a) { return a.id === id; })[0] || null;
  }

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
  /* An expired access record grants nothing downstream (§42 of the
     Implementation-02 brief): entitlement derived from it stops being
     effective. Nothing is deleted — the record and its assignments stay
     for traceability.

     `accessIsLive` answers ONE question: is the access TERM still
     running? That is the right question for entitlement effectiveness,
     and it is deliberately NOT the same question as "can the Tenant
     Admin assign from this record" — see accessAssignability below. */
  function accessIsLive(rec) { return !!rec && accessTermState(rec).key !== 'expired'; }
  function liveAccessForTenant(tenantId) {
    return accessForTenant(tenantId).filter(accessIsLive);
  }

  /* ---------- ONE definition of "assignable" ----------
     Every screen that offers, blocks or explains assignment reads this
     and nothing else. Previously each surface re-derived its own answer,
     so a record could be counted by the navigation and the Content
     access page while the Assignments page silently treated it as
     absent — the two screens contradicting each other with no
     explanation anywhere.

     A record is assignable only when it:
       · belongs to this tenant
       · is still within its access term
       · carries at least one approved Experiment
       · carries at least one approved technology variant
       · carries a usable approved user/licence quantity

     The function returns the REASON it is not assignable (or null when
     it is), so the UI can always say why instead of showing an empty
     screen that disagrees with the rest of the workspace. */
  var ASSIGNABILITY_REASON = {
    'missing':         'the access record no longer exists',
    'other-tenant':    'the record belongs to another institution',
    'expired':         'its access term has expired',
    'no-experiments':  'it carries no approved experiments',
    'no-technologies': 'it carries no approved technology variants',
    'no-quantity':     'it carries no approved user/licence quantity'
  };

  function accessAssignability(rec, tenantId) {
    if (!rec) { return 'missing'; }
    if (tenantId && rec.tenantId !== tenantId) { return 'other-tenant'; }
    if (!accessIsLive(rec)) { return 'expired'; }
    var items = Array.isArray(rec.items) ? rec.items : [];
    if (!items.length) { return 'no-experiments'; }
    var hasTech = items.some(function (i) {
      return Array.isArray(i.technologies) && i.technologies.length > 0;
    });
    if (!hasTech) { return 'no-technologies'; }
    if (typeof rec.quantity !== 'number' || !(rec.quantity > 0)) { return 'no-quantity'; }
    return null;
  }
  function accessIsAssignable(rec, tenantId) { return accessAssignability(rec, tenantId) === null; }
  function assignableAccessForTenant(tenantId) {
    return accessForTenant(tenantId).filter(function (rec) {
      return accessIsAssignable(rec, tenantId);
    });
  }
  /* Records the tenant holds that cannot currently be assigned from,
     each with its reason — so no screen ever has to stay silent. */
  function unassignableAccessForTenant(tenantId) {
    return accessForTenant(tenantId).map(function (rec) {
      return { record: rec, reason: accessAssignability(rec, tenantId) };
    }).filter(function (x) { return x.reason !== null; });
  }
  function assignabilityText(reason) { return ASSIGNABILITY_REASON[reason] || 'it is not currently assignable'; }
  /* The technologies the tenant actually holds for one experiment under
     one access record. This is the ONLY source of technology variants
     for an assignment — the Tenant Admin never widens or narrows it
     (STK31-24). */
  function accessTechnologies(rec, experimentId) {
    if (!rec) { return []; }
    var item = rec.items.filter(function (i) { return i.experimentId === experimentId; })[0];
    return item ? item.technologies.slice() : [];
  }
  function accessHasExperiment(rec, experimentId) {
    return !!rec && rec.items.some(function (i) { return i.experimentId === experimentId; });
  }
  /* Canonical Courses reachable through one access record. */
  function accessCourseIds(rec) {
    var seen = {}, out = [];
    if (!rec) { return out; }
    rec.items.forEach(function (i) {
      var ctx = data.contextOf(i.experimentId);
      if (ctx && ctx.course && !seen[ctx.course.id]) { seen[ctx.course.id] = true; out.push(ctx.course.id); }
    });
    return out;
  }
  /* Every canonical Course the tenant can reach through ANY live record. */
  function tenantCourseIds(tenantId) {
    var seen = {}, out = [];
    liveAccessForTenant(tenantId).forEach(function (rec) {
      accessCourseIds(rec).forEach(function (cid) {
        if (!seen[cid]) { seen[cid] = true; out.push(cid); }
      });
    });
    return out;
  }

  /* ============================================================
     TENANT PEOPLE — TenantUser (Faculty + Student)
     One Student/Learner role and one Institute Admin / Tenant Admin
     role (STK31-01 / STK31-02): `role` here distinguishes Faculty from
     Student inside a tenant, it does not create new formal roles.
     ============================================================ */

  function people() { return S.people; }
  function peopleForTenant(tenantId) {
    return S.people.filter(function (p) { return p.tenantId === tenantId; });
  }
  function personById(id) {
    return S.people.filter(function (p) { return p.id === id; })[0] || null;
  }
  function facultyForTenant(tenantId) {
    return peopleForTenant(tenantId).filter(function (p) { return p.role === 'faculty'; });
  }
  function studentsForTenant(tenantId) {
    return peopleForTenant(tenantId).filter(function (p) { return p.role === 'student'; });
  }
  function activeStudentsForTenant(tenantId) {
    return studentsForTenant(tenantId).filter(function (p) { return p.status === 'active'; });
  }
  function personByEmail(tenantId, email) {
    var e = data.norm(email);
    return peopleForTenant(tenantId).filter(function (p) { return data.norm(p.email) === e; })[0] || null;
  }
  function studentByStudentId(tenantId, studentId) {
    var v = data.norm(studentId);
    return studentsForTenant(tenantId).filter(function (p) { return data.norm(p.studentId) === v; })[0] || null;
  }

  function addFaculty(tenantId, fields) {
    S.seq.person += 1;
    var now = new Date().toISOString();
    var rec = {
      id: 'USR-' + util.pad3(S.seq.person),
      tenantId: tenantId, role: 'faculty',
      name: String(fields.name || '').trim(),
      email: String(fields.email || '').trim(),
      facultyId: String(fields.facultyId || '').trim(),
      status: 'active',
      source: fields.source || 'manual',
      createdAt: now, activatedAt: now, activationSeq: nextEvent(), deactivatedAt: null
    };
    S.people.push(rec);
    save();
    return rec;
  }

  function addStudent(tenantId, fields) {
    S.seq.person += 1;
    var now = new Date().toISOString();
    var rec = {
      id: 'USR-' + util.pad3(S.seq.person),
      tenantId: tenantId, role: 'student',
      studentId: String(fields.studentId || '').trim(),
      name: String(fields.name || '').trim(),
      email: String(fields.email || '').trim(),
      groupingId: fields.groupingId || '',
      courseId: fields.courseId || '',
      localCourseCode: String(fields.localCourseCode || '').trim(),
      /* OPTIONAL everywhere and never promoted to mandatory (STK31-11). */
      semester: String(fields.semester || '').trim(),
      /* OPTIONAL (STK31-26). */
      organisation: String(fields.organisation || '').trim(),
      /* OPTIONAL — mandatory status unresolved (ND-03). Contextual
         administrative information ONLY: it never overrides the
         tenant's approved access record. */
      planTerms: String(fields.planTerms || '').trim(),
      status: 'active',
      source: fields.source || 'manual',
      createdAt: now, activatedAt: now, activationSeq: nextEvent(), deactivatedAt: null
    };
    S.people.push(rec);
    save();
    return rec;
  }

  /* Reversible status only — no destructive delete anywhere (STK31-22 /
     ND-15). An inactive student keeps every assignment record for
     traceability but holds no effective entitlement. */
  function setStudentStatus(personId, status) {
    var p = personById(personId);
    if (!p || p.role !== 'student') { return null; }
    var now = new Date().toISOString();
    if (status === 'inactive') {
      p.status = 'inactive';
      p.deactivatedAt = now;
    } else {
      p.status = 'active';
      /* Re-stamping activation is what keeps reactivation safe: the
         reactivated student re-enters the allocation queue at the BACK,
         so reactivation can never displace a student who is currently
         entitled, and can never push a record past its approved
         quantity. See README — judgement call. */
      p.activatedAt = now;
      p.activationSeq = nextEvent();
      p.deactivatedAt = null;
    }
    save();
    return p;
  }

  /* ---------- StudentCourseMembership ----------
     The confirmed CSV/manual field set gives each Student exactly one
     Programme and one Course, so the academic placement lives on the
     Student record and this is its named read model. */
  function studentCourseMembership(personId) {
    var p = personById(personId);
    if (!p || p.role !== 'student') { return null; }
    var course = p.courseId ? data.course(p.courseId) : null;
    var grouping = p.groupingId ? data.grouping(p.groupingId) : null;
    var mapping = p.courseId ? courseMapping(p.tenantId, p.courseId) : null;
    return {
      personId: p.id,
      grouping: grouping,
      course: course,
      /* the student's own local code wins; otherwise the tenant mapping */
      localCode: p.localCourseCode || (mapping ? mapping.localCode : ''),
      semester: p.semester || (mapping ? mapping.semester : ''),
      tenantMapping: mapping
    };
  }

  /* ============================================================
     STUDENT GROUPS + membership
     Groups are an operational assignment convenience. Membership by
     itself grants NOTHING — only an ExperimentAssignment does.
     A student may belong to more than one group.
     ============================================================ */

  function groupsForTenant(tenantId) {
    return S.groups.filter(function (g) { return g.tenantId === tenantId; });
  }
  function groupById(id) {
    return S.groups.filter(function (g) { return g.id === id; })[0] || null;
  }
  function groupByName(tenantId, name) {
    var n = data.norm(name);
    return groupsForTenant(tenantId).filter(function (g) { return data.norm(g.name) === n; })[0] || null;
  }
  function createGroup(tenantId, fields) {
    S.seq.group += 1;
    var rec = {
      id: 'GRP-' + util.pad3(S.seq.group),
      tenantId: tenantId,
      name: String(fields.name || '').trim(),
      description: String(fields.description || '').trim(),
      createdAt: new Date().toISOString()
    };
    S.groups.push(rec);
    save();
    return rec;
  }
  function renameGroup(groupId, name, description) {
    var g = groupById(groupId);
    if (!g) { return null; }
    g.name = String(name || '').trim();
    g.description = String(description || '').trim();
    save();
    return g;
  }
  function membersOfGroup(groupId) {
    var ids = S.memberships.filter(function (m) { return m.groupId === groupId; })
      .map(function (m) { return m.personId; });
    return ids.map(personById).filter(Boolean);
  }
  function memberIdsOfGroup(groupId) {
    return S.memberships.filter(function (m) { return m.groupId === groupId; })
      .map(function (m) { return m.personId; });
  }
  function groupsOfPerson(personId) {
    var ids = S.memberships.filter(function (m) { return m.personId === personId; })
      .map(function (m) { return m.groupId; });
    return ids.map(groupById).filter(Boolean);
  }
  function isMember(groupId, personId) {
    return S.memberships.some(function (m) { return m.groupId === groupId && m.personId === personId; });
  }
  function addToGroup(groupId, personId) {
    var g = groupById(groupId), p = personById(personId);
    if (!g || !p || p.role !== 'student' || p.tenantId !== g.tenantId) { return false; }
    if (isMember(groupId, personId)) { return false; }
    S.seq.membership += 1;
    S.memberships.push({
      id: 'GM-' + util.pad3(S.seq.membership),
      tenantId: g.tenantId, groupId: groupId, personId: personId,
      addedAt: new Date().toISOString()
    });
    save();
    return true;
  }
  function removeFromGroup(groupId, personId) {
    var before = S.memberships.length;
    S.memberships = S.memberships.filter(function (m) {
      return !(m.groupId === groupId && m.personId === personId);
    });
    if (S.memberships.length !== before) { save(); return true; }
    return false;
  }

  /* ============================================================
     TENANT COURSE MAPPING — local code + OPTIONAL semester.
     The canonical Course is never modified (STK31-10): this record
     sits beside it.
     ============================================================ */

  function courseMappingsForTenant(tenantId) {
    return S.courseMappings.filter(function (m) { return m.tenantId === tenantId; });
  }
  function courseMapping(tenantId, courseId) {
    return S.courseMappings.filter(function (m) {
      return m.tenantId === tenantId && m.courseId === courseId;
    })[0] || null;
  }
  function setCourseMapping(tenantId, courseId, localCode, semester) {
    var existing = courseMapping(tenantId, courseId);
    var now = new Date().toISOString();
    if (existing) {
      existing.localCode = String(localCode || '').trim();
      existing.semester = String(semester || '').trim();
      existing.updatedAt = now;
      save();
      return existing;
    }
    S.seq.mapping += 1;
    var rec = {
      id: 'MAP-' + util.pad3(S.seq.mapping),
      tenantId: tenantId, courseId: courseId,
      localCode: String(localCode || '').trim(),
      semester: String(semester || '').trim(),
      updatedAt: now
    };
    S.courseMappings.push(rec);
    save();
    return rec;
  }
  function clearCourseMapping(tenantId, courseId) {
    var before = S.courseMappings.length;
    S.courseMappings = S.courseMappings.filter(function (m) {
      return !(m.tenantId === tenantId && m.courseId === courseId);
    });
    if (S.courseMappings.length !== before) { save(); return true; }
    return false;
  }

  /* ============================================================
     FACULTY MAPPING — Faculty → Course context and/or Experiment,
     inside the tenant's approved access only.

     ⚠ Faculty mapping deliberately does NOT consume the Student /
     Learner licence allocation. STK31-27 describes the quantity as
     users/students on the institutional request, and no source says
     a Faculty mapping consumes it. Recorded as a judgement call.
     ============================================================ */

  function facultyMappingsForTenant(tenantId) {
    return S.facultyMappings.filter(function (f) { return f.tenantId === tenantId && f.status === 'active'; });
  }
  function facultyMappingsFor(personId) {
    return S.facultyMappings.filter(function (f) { return f.personId === personId && f.status === 'active'; });
  }
  function facultyMappingExists(tenantId, personId, accessId, courseId, experimentId) {
    return S.facultyMappings.some(function (f) {
      return f.status === 'active' && f.tenantId === tenantId && f.personId === personId &&
        f.accessId === accessId && f.courseId === courseId &&
        (f.experimentId || null) === (experimentId || null);
    });
  }
  function mapFaculty(tenantId, personId, accessId, courseId, experimentId) {
    var rec = accessById(accessId);
    if (!accessIsAssignable(rec, tenantId)) { return null; }
    if (accessCourseIds(rec).indexOf(courseId) === -1) { return null; }
    if (experimentId && !accessHasExperiment(rec, experimentId)) { return null; }
    if (facultyMappingExists(tenantId, personId, accessId, courseId, experimentId)) { return null; }
    S.seq.facultyMap += 1;
    var out = {
      id: 'FMAP-' + util.pad3(S.seq.facultyMap),
      tenantId: tenantId, personId: personId, accessId: accessId,
      courseId: courseId, experimentId: experimentId || null,
      status: 'active',
      createdAt: new Date().toISOString(), removedAt: null
    };
    S.facultyMappings.push(out);
    save();
    return out;
  }
  function removeFacultyMapping(id) {
    var f = S.facultyMappings.filter(function (x) { return x.id === id; })[0];
    if (!f || f.status !== 'active') { return false; }
    f.status = 'removed';
    f.removedAt = new Date().toISOString();
    save();
    return true;
  }

  /* ============================================================
     EXPERIMENT ASSIGNMENT — the ONLY thing that creates student
     entitlement (STK31-25). Target is a Student or a Group.
     ============================================================ */

  function assignmentsForTenant(tenantId) {
    return S.assignments.filter(function (a) { return a.tenantId === tenantId; });
  }
  function activeAssignments(tenantId) {
    return assignmentsForTenant(tenantId).filter(function (a) { return a.status === 'active'; });
  }
  function assignmentById(id) {
    return S.assignments.filter(function (a) { return a.id === id; })[0] || null;
  }
  function assignmentsForAccess(tenantId, accessId) {
    return activeAssignments(tenantId).filter(function (a) { return a.accessId === accessId; });
  }
  /* Which people does one assignment reach? Group membership is
     resolved here — that resolution is the ONLY thing a group does. */
  function assignmentReach(a) {
    if (a.targetType === 'student') { return [a.targetId]; }
    if (a.targetType === 'group') { return memberIdsOfGroup(a.targetId); }
    return [];
  }
  function assignmentTargetLabel(a) {
    if (a.targetType === 'student') {
      var p = personById(a.targetId);
      return p ? p.name : 'Student';
    }
    var g = groupById(a.targetId);
    return g ? g.name : 'Group';
  }
  function assignmentExists(tenantId, accessId, experimentId, targetType, targetId) {
    return activeAssignments(tenantId).some(function (a) {
      return a.accessId === accessId && a.experimentId === experimentId &&
        a.targetType === targetType && a.targetId === targetId;
    });
  }

  /* ---------- LICENCE / USER ALLOCATION ----------
     STK31-27 gives the approved quantity a legitimate origin — the
     approved request — and forbids any universal cap.

     ⚠ JUDGEMENT CALL. The stakeholder confirmed the quantity, not a
     counting algorithm. This prototype interprets it as:

       the maximum number of UNIQUE ACTIVE STUDENTS entitled through
       ONE access record.

     A student is counted ONCE per access record however many
     Experiments they receive under it, and Experiment assignments are
     never counted as separate licences.

     Ordering (only reachable through reactivation): candidates are
     ranked by max(first active assignment under this record,
     student's last activation), so a reactivated student re-enters at
     the back and never displaces a currently entitled student. Anyone
     beyond the approved quantity is HELD — visible, never silently
     entitled. */
  function accessAllocation(accessId) {
    var rec = accessById(accessId);
    var out = { approved: 0, assigned: 0, remaining: 0, over: 0, entitledIds: [], heldIds: [], live: false };
    if (!rec) { return out; }
    out.approved = rec.quantity || 0;
    out.live = accessIsLive(rec);

    var first = {};   /* personId → earliest active assignment ordering stamp under this record */
    assignmentsForAccess(rec.tenantId, accessId).forEach(function (a) {
      var stamp = typeof a.eventSeq === 'number' ? a.eventSeq : 0;
      assignmentReach(a).forEach(function (pid) {
        var p = personById(pid);
        if (!p || p.role !== 'student' || p.status !== 'active') { return; }
        if (first[pid] == null || stamp < first[pid]) { first[pid] = stamp; }
      });
    });

    function rank(pid) {
      var p = personById(pid);
      var act = (p && typeof p.activationSeq === 'number') ? p.activationSeq : 0;
      return Math.max(first[pid], act);
    }
    var ids = Object.keys(first);
    ids.sort(function (x, y) {
      var rx = rank(x), ry = rank(y);
      if (rx !== ry) { return rx - ry; }
      return x < y ? -1 : x > y ? 1 : 0;
    });

    out.assigned = ids.length;
    out.entitledIds = ids.slice(0, out.approved);
    out.heldIds = ids.slice(out.approved);
    out.over = out.heldIds.length;
    out.remaining = Math.max(0, out.approved - out.assigned);
    return out;
  }

  /* Tenant-wide roll-up across LIVE access records. Approved licences
     are per record, so the totals are a sum of real per-record values —
     never a platform-level cap. */
  function tenantAllocation(tenantId) {
    var totals = { approved: 0, assigned: 0, remaining: 0, over: 0, records: 0 };
    var uniq = {};
    liveAccessForTenant(tenantId).forEach(function (rec) {
      var al = accessAllocation(rec.id);
      totals.records += 1;
      totals.approved += al.approved;
      totals.assigned += al.assigned;
      totals.remaining += al.remaining;
      totals.over += al.over;
      al.entitledIds.forEach(function (id) { uniq[id] = true; });
    });
    totals.uniqueEntitledStudents = Object.keys(uniq).length;
    return totals;
  }

  /* ---------- assignment preview + enforcement ----------
     Returns exactly what the Tenant Admin must be told BEFORE the
     assignment happens, and what blocks it. Group assignments are
     all-or-nothing: no partial assignment (§33 of the brief). */
  function previewAssignment(tenantId, accessId, experimentId, targetType, targetIds) {
    var rec = accessById(accessId);
    var out = {
      ok: false, reason: null,
      alloc: null, newStudentIds: [], countedStudentIds: [], inactiveStudentIds: [],
      duplicateTargets: [], alreadyEntitled: [], emptyGroups: [], technologies: []
    };
    if (!rec || rec.tenantId !== tenantId) { out.reason = 'no-access'; return out; }
    var blocked = accessAssignability(rec, tenantId);
    if (blocked) { out.reason = blocked === 'expired' ? 'access-expired' : 'not-assignable'; out.blockedBy = blocked; return out; }
    if (!accessHasExperiment(rec, experimentId)) { out.reason = 'not-approved'; return out; }
    if (!targetIds || !targetIds.length) { out.reason = 'no-target'; return out; }

    out.technologies = accessTechnologies(rec, experimentId);
    var alloc = accessAllocation(accessId);
    out.alloc = alloc;
    var counted = {};
    alloc.entitledIds.concat(alloc.heldIds).forEach(function (id) { counted[id] = true; });

    var newIds = {}, seenTarget = {};
    targetIds.forEach(function (tid) {
      if (seenTarget[tid]) { return; }
      seenTarget[tid] = true;
      if (assignmentExists(tenantId, accessId, experimentId, targetType, tid)) {
        out.duplicateTargets.push(tid);
        return;
      }
      var reach = targetType === 'group' ? memberIdsOfGroup(tid) : [tid];
      if (targetType === 'group' && !reach.length) { out.emptyGroups.push(tid); }
      reach.forEach(function (pid) {
        var p = personById(pid);
        if (!p || p.role !== 'student') { return; }
        if (p.status !== 'active') {
          if (out.inactiveStudentIds.indexOf(pid) === -1) { out.inactiveStudentIds.push(pid); }
          return;
        }
        if (counted[pid]) {
          if (out.countedStudentIds.indexOf(pid) === -1) { out.countedStudentIds.push(pid); }
        } else {
          newIds[pid] = true;
        }
        /* Already effectively entitled to this experiment through some
           other source? Reported, never silently duplicated. */
        var already = entitlementSources(pid, accessId, experimentId);
        if (already.length && out.alreadyEntitled.filter(function (x) { return x.personId === pid; }).length === 0) {
          out.alreadyEntitled.push({ personId: pid, sources: already });
        }
      });
    });
    out.newStudentIds = Object.keys(newIds);

    if (out.duplicateTargets.length === seenTarget.length) { /* noop — handled below */ }
    var realTargets = Object.keys(seenTarget).length - out.duplicateTargets.length;
    if (realTargets <= 0) { out.reason = 'duplicate'; return out; }
    /* An individual assignment that reaches no active student is refused
       outright — an inactive student cannot receive a new assignment
       (§40 of the brief). A group with no active members is different:
       the group may gain members later, so it is allowed and reported. */
    if (targetType === 'student' && !out.newStudentIds.length && !out.countedStudentIds.length) {
      out.reason = 'inactive-target'; return out;
    }
    if (out.newStudentIds.length > alloc.remaining) { out.reason = 'over-allocation'; return out; }
    out.ok = true;
    return out;
  }

  /* Commits an assignment only when previewAssignment says ok.
     Duplicate targets are skipped, never re-created. */
  function assignExperiment(tenantId, accessId, experimentId, targetType, targetIds) {
    var pre = previewAssignment(tenantId, accessId, experimentId, targetType, targetIds);
    if (!pre.ok) { return { ok: false, preview: pre, created: [] }; }
    var now = new Date().toISOString();
    var created = [];
    var seen = {};
    targetIds.forEach(function (tid) {
      if (seen[tid]) { return; }
      seen[tid] = true;
      if (assignmentExists(tenantId, accessId, experimentId, targetType, tid)) { return; }
      S.seq.assignment += 1;
      var rec = {
        id: 'ASG-' + util.pad3(S.seq.assignment),
        tenantId: tenantId,
        accessId: accessId,
        experimentId: experimentId,
        targetType: targetType,
        targetId: tid,
        /* Snapshot of the approved variants at assignment time; the
           access record stays authoritative for what is rendered. */
        technologies: accessTechnologies(accessById(accessId), experimentId),
        assignedBy: 'Tenant Admin',
        status: 'active',
        createdAt: now,
        eventSeq: nextEvent(),
        removedAt: null
      };
      S.assignments.push(rec);
      created.push(rec);
    });
    save();
    return { ok: true, preview: pre, created: created };
  }

  /* Reversible: the record is retained with status `removed` so the
     history of who was assigned what survives (STK31-22 / ND-15).
     Effective entitlement disappears only when the LAST supporting
     source is gone. */
  function removeAssignment(id) {
    var a = assignmentById(id);
    if (!a || a.status !== 'active') { return false; }
    a.status = 'removed';
    a.removedAt = new Date().toISOString();
    save();
    return true;
  }

  /* ============================================================
     STUDENT ENTITLEMENT — DERIVED, never stored.

     Effective for a student + experiment + access record when ALL hold:
       · the student is ACTIVE
       · the access record is not expired
       · the student is within that record's approved allocation
       · at least one ACTIVE assignment under that record reaches them

     One effective entitlement, however many assignment sources feed it.
     ============================================================ */

  /* Active assignment sources reaching one student for one experiment
     under one access record. Does NOT apply the student-status or
     allocation gates — used by the preview to explain duplicates. */
  function entitlementSources(personId, accessId, experimentId) {
    var p = personById(personId);
    if (!p) { return []; }
    return activeAssignments(p.tenantId).filter(function (a) {
      return a.accessId === accessId && a.experimentId === experimentId &&
        assignmentReach(a).indexOf(personId) !== -1;
    }).map(function (a) {
      return {
        assignmentId: a.id,
        type: a.targetType,
        targetId: a.targetId,
        label: assignmentTargetLabel(a),
        createdAt: a.createdAt
      };
    });
  }

  function entitlementsForStudent(personId) {
    var p = personById(personId);
    if (!p || p.role !== 'student') { return []; }
    var byKey = {}, out = [];
    activeAssignments(p.tenantId).forEach(function (a) {
      if (assignmentReach(a).indexOf(personId) === -1) { return; }
      var rec = accessById(a.accessId);
      if (!rec) { return; }
      var key = a.accessId + '::' + a.experimentId;
      if (!byKey[key]) {
        var alloc = accessAllocation(a.accessId);
        var withinAllocation = alloc.entitledIds.indexOf(personId) !== -1;
        var blocked =
          p.status !== 'active' ? 'student-inactive' :
          !accessIsLive(rec) ? 'access-expired' :
          !withinAllocation ? 'allocation-held' : null;
        byKey[key] = {
          accessId: a.accessId,
          accessRecord: rec,
          experimentId: a.experimentId,
          technologies: accessTechnologies(rec, a.experimentId),
          sources: [],
          effective: !blocked,
          blockedBy: blocked
        };
        out.push(byKey[key]);
      }
      byKey[key].sources.push({
        assignmentId: a.id, type: a.targetType, targetId: a.targetId,
        label: assignmentTargetLabel(a), createdAt: a.createdAt
      });
    });
    out.sort(function (x, y) {
      var cx = data.contextOf(x.experimentId), cy = data.contextOf(y.experimentId);
      var nx = (cx ? cx.course.name + ' ' + cx.experiment.name : x.experimentId);
      var ny = (cy ? cy.course.name + ' ' + cy.experiment.name : y.experimentId);
      return nx < ny ? -1 : nx > ny ? 1 : 0;
    });
    return out;
  }

  function effectiveEntitlementCount(personId) {
    return entitlementsForStudent(personId).filter(function (e) { return e.effective; }).length;
  }

  /* Students currently holding EFFECTIVE entitlement for one experiment
     under one access record — “how many students are assigned?” */
  function entitledStudentsFor(accessId, experimentId) {
    var rec = accessById(accessId);
    if (!rec) { return []; }
    var alloc = accessAllocation(accessId);
    if (!accessIsLive(rec)) { return []; }
    var set = {};
    assignmentsForAccess(rec.tenantId, accessId).forEach(function (a) {
      if (a.experimentId !== experimentId) { return; }
      assignmentReach(a).forEach(function (pid) {
        if (alloc.entitledIds.indexOf(pid) !== -1) { set[pid] = true; }
      });
    });
    return Object.keys(set);
  }

  /* Students with at least one effective entitlement anywhere. */
  function entitledStudentIds(tenantId) {
    var set = {};
    liveAccessForTenant(tenantId).forEach(function (rec) {
      var alloc = accessAllocation(rec.id);
      assignmentsForAccess(tenantId, rec.id).forEach(function (a) {
        assignmentReach(a).forEach(function (pid) {
          if (alloc.entitledIds.indexOf(pid) !== -1) { set[pid] = true; }
        });
      });
    });
    return Object.keys(set);
  }

  /* ---------- operational attention (all real states) ---------- */
  function unassignedStudents(tenantId) {
    var entitled = entitledStudentIds(tenantId);
    return activeStudentsForTenant(tenantId).filter(function (p) {
      return entitled.indexOf(p.id) === -1;
    });
  }
  function accessWithoutAssignments(tenantId) {
    return liveAccessForTenant(tenantId).filter(function (rec) {
      return assignmentsForAccess(tenantId, rec.id).length === 0;
    });
  }
  function coursesWithoutMapping(tenantId) {
    return tenantCourseIds(tenantId).filter(function (cid) {
      var m = courseMapping(tenantId, cid);
      return !m || !m.localCode;
    });
  }

  return {
    STORAGE_KEY: STORAGE_KEY, SCHEMA_VERSION: SCHEMA_VERSION,
    STATUS: STATUS, STATUS_META: STATUS_META, SOURCE_META: SOURCE_META,
    save: save, reset: reset, migratedFrom: migratedFrom,
    scenario: scenario, setScenario: setScenario,
    selectionItems: selectionItems, selectionCount: selectionCount, selectionGet: selectionGet,
    selectionAdd: selectionAdd, selectionSetTech: selectionSetTech,
    selectionRemove: selectionRemove, selectionClear: selectionClear,
    draft: draft, draftSave: draftSave, draftClear: draftClear,
    requests: requests, request: request, requestsForScenario: requestsForScenario,
    submitRequest: submitRequest, approveRequest: approveRequest, completePayment: completePayment,
    tenants: tenants, tenantById: tenantById,
    accessForTenant: accessForTenant, accessAll: accessAll, accessById: accessById,
    accessTermState: accessTermState, accessIsLive: accessIsLive, liveAccessForTenant: liveAccessForTenant,
    accessAssignability: accessAssignability, accessIsAssignable: accessIsAssignable,
    assignableAccessForTenant: assignableAccessForTenant,
    unassignableAccessForTenant: unassignableAccessForTenant, assignabilityText: assignabilityText,
    accessTechnologies: accessTechnologies, accessHasExperiment: accessHasExperiment,
    accessCourseIds: accessCourseIds, tenantCourseIds: tenantCourseIds,

    people: people, peopleForTenant: peopleForTenant, personById: personById,
    facultyForTenant: facultyForTenant, studentsForTenant: studentsForTenant,
    activeStudentsForTenant: activeStudentsForTenant,
    personByEmail: personByEmail, studentByStudentId: studentByStudentId,
    addFaculty: addFaculty, addStudent: addStudent, setStudentStatus: setStudentStatus,
    studentCourseMembership: studentCourseMembership,

    groupsForTenant: groupsForTenant, groupById: groupById, groupByName: groupByName,
    createGroup: createGroup, renameGroup: renameGroup,
    membersOfGroup: membersOfGroup, memberIdsOfGroup: memberIdsOfGroup,
    groupsOfPerson: groupsOfPerson, isMember: isMember,
    addToGroup: addToGroup, removeFromGroup: removeFromGroup,

    courseMappingsForTenant: courseMappingsForTenant, courseMapping: courseMapping,
    setCourseMapping: setCourseMapping, clearCourseMapping: clearCourseMapping,

    facultyMappingsForTenant: facultyMappingsForTenant, facultyMappingsFor: facultyMappingsFor,
    mapFaculty: mapFaculty, removeFacultyMapping: removeFacultyMapping,
    facultyMappingExists: facultyMappingExists,

    assignmentsForTenant: assignmentsForTenant, activeAssignments: activeAssignments,
    assignmentById: assignmentById, assignmentsForAccess: assignmentsForAccess,
    assignmentReach: assignmentReach, assignmentTargetLabel: assignmentTargetLabel,
    assignmentExists: assignmentExists,
    previewAssignment: previewAssignment, assignExperiment: assignExperiment,
    removeAssignment: removeAssignment,

    accessAllocation: accessAllocation, tenantAllocation: tenantAllocation,
    entitlementsForStudent: entitlementsForStudent, entitlementSources: entitlementSources,
    effectiveEntitlementCount: effectiveEntitlementCount,
    entitledStudentsFor: entitledStudentsFor, entitledStudentIds: entitledStudentIds,
    unassignedStudents: unassignedStudents, accessWithoutAssignments: accessWithoutAssignments,
    coursesWithoutMapping: coursesWithoutMapping
  };
})();
