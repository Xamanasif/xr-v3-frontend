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
  var SCHEMA_VERSION = 4;

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
      assignments: [],
      /* Implementation 03 — the learning records. */
      resourceActivity: [],
      simulationActivity: [],
      attempts: []
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
      resourceActivity: [],
      simulationActivity: [],
      attempts: [],
      /* Which REAL student record the prototype is currently viewing
         as. Prototype-only; it is not authentication and grants
         nothing (Implementation 03). */
      protoStudentId: null,
      /* When this seed was created. Assessment answer-visibility
         policies are authored as day offsets and resolve against it,
         so a fresh reset always behaves the same way relative to
         "now". */
      seededAt: new Date().toISOString(),
      /* `event` is a monotonic ordering counter. Wall-clock timestamps
         are display-only: several records can share a millisecond, so
         allocation ordering must never depend on them. */
      seq: { request: 0, access: 0, person: 0, group: 0, membership: 0, mapping: 0, facultyMap: 0, assignment: 0, event: 0,
             resourceAct: 0, simAct: 0, attempt: 0 }
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

  /* Migration is additive only, at every version. An Implementation-01
     state (`version: 1`) or an Implementation-02 state
     (`schemaVersion: 2`) keeps every request, tenant, access, person,
     group, mapping and assignment record it already holds, and simply
     gains the collections the newer build adds. Nothing is ever
     discarded here — only an explicit "Reset prototype data" does
     that. */
  function migrate(parsed) {
    var stored = parsed.schemaVersion || parsed.version || 1;
    if (stored > SCHEMA_VERSION) { return null; }   /* newer than this build — fall back to seed */

    var blank = emptyCollections();
    Object.keys(blank).forEach(function (key) {
      if (!Array.isArray(parsed[key])) { parsed[key] = blank[key]; }
    });
    if (!parsed.seq || typeof parsed.seq !== 'object') { parsed.seq = {}; }
    ['request', 'access', 'person', 'group', 'membership', 'mapping', 'facultyMap', 'assignment', 'event',
     'resourceAct', 'simAct', 'attempt']
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
    /* SCHEMA 3 → 4: the assessment attempt stopped being keyed by
       technology. An attempt written by the schema-3 build carries
       `technology`; that value is a real observation of the route the
       Student came in from, so it is MOVED to `sourceTechnology` rather
       than discarded. Nothing else about the attempt changes, and a
       Student who took the same assessment twice under the old model
       keeps both attempts as history. */
    parsed.attempts.forEach(function (a) {
      if (a.sourceTechnology === undefined) {
        a.sourceTechnology = a.technology || null;
      }
      delete a.technology;
      /* The stored outcome string was renamed when STK31-31's owner was
         put into the label. */
      if (a.outcome === 'PENDING_EVALUATION') { a.outcome = 'PENDING_FACULTY_REVIEW'; }
    });

    /* An Implementation-02 state has no seed timestamp. Stamping it at
       migration time is the honest choice: the assessment visibility
       offsets then run from the moment this build first opened the
       existing data, and nothing already recorded is touched. */
    if (typeof parsed.seededAt !== 'string') { parsed.seededAt = new Date().toISOString(); }
    /* A stale prototype-student pointer must never resolve to a
       fabricated person. */
    if (typeof parsed.protoStudentId !== 'string') { parsed.protoStudentId = null; }
    else if (!parsed.people.some(function (p) { return p.id === parsed.protoStudentId && p.role === 'student'; })) {
      parsed.protoStudentId = null;
    }
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
    var end = new Date(rec.endsOn).getTime();
    if (isNaN(end)) { return { key: 'active', label: 'Active' }; }
    /* Compare the instant, never the day count. `daysUntil` rounds up, so a
       record that expired an hour ago yields Math.ceil(-0.04) === -0 — and
       `-0 < 0` is FALSE in JavaScript, which kept an expired record readable
       as Active for up to a day and let entitlement derived from it stay
       effective. The expiry boundary is the timestamp itself. */
    if (end <= Date.now()) { return { key: 'expired', label: 'Expired' }; }
    var days = util.daysUntil(rec.endsOn);
    if (days != null && days <= 15) { return { key: 'expiring', label: 'Expiring soon' }; }
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


  /* ============================================================
     IMPLEMENTATION 03 — THE LEARNING RECORDS

     Three new conceptual records, all browser state only. None of
     them is an entitlement, and none of them can create one:

       resourceActivity[]    ResourceActivity   — EXPERIMENT-level
       simulationActivity[]  SimulationActivity — TECHNOLOGY-level
       attempts[]            AssessmentAttempt  — EXPERIMENT-level

     ── WHY THE ASSESSMENT IS EXPERIMENT-LEVEL ────────────────────
     `STK31-36` adds a technology axis to PROGRESS. It says nothing
     about assessment identity, and no source establishes a separately
     configured or separately attempted assessment per technology
     variant. The sources point the other way:

       · `13_BATCH_01_05_EXACT_CORRECTION_MAP.md` Part B —
         "Faculty assigns assessments to **Experiments**"; `B08`
         Assessment Introduction and `B09` Assessment Attempt are
         both **KEEP**, and only `B12` Progress and `S13` XR Device
         Access gain the technology axis.
       · `14_UNIFIED_SCREEN_REQUIREMENTS.md` area G — `U-LRN-05/06/07`
         are **KEEP**; `U-LRN-08` Result is MODIFY "+ Faculty-owned
         evaluation, + visibility policy" with NO technology
         dimension; only `U-LRN-09` Progress gains "+ technology axis".
       · `17_CONCEPTUAL_DATA_AND_STATE_MODEL.md` record 24 —
         Assessment "Gains the answer/explanation visibility policy"
         and nothing else; record 26 — "**Progress** gains a
         per-technology axis", naming Progress out of
         Attempt · Result · Progress.

     `09_…` §3 rule 4 ("simulation and assessment **state** are
     technology-level unless a source says otherwise") is about how a
     progress surface REPORTS assessment, and carries its own hedge —
     and the two sources above are the source that says otherwise
     about identity.

     So a Student sits ONE assessment for an Experiment, however many
     technologies their institution licensed. The attempt records
     `sourceTechnology` — which simulation route led into it — as an
     observation, never as a second identity.

     ⛔ No API, endpoint, payload or schema is proposed by any of this
     (STK31-35). These are prototype browser records.
     ============================================================ */

  var SIM_STATUS = { NOT_STARTED: 'NOT_STARTED', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED' };
  var RES_STATUS = { NOT_STARTED: 'NOT_STARTED', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED' };

  /* Batch 01's XR access vocabulary, kept mechanism-neutral (PM-05 /
     QT-01 stay open BY INSTRUCTION). Only the states a real prototype
     action can actually produce are modelled — `delivery failed` and
     `availability unknown` exist in the model but nothing here can
     honestly produce them, so no control claims to. */
  var DELIVERY_STATE = {
    NOT_REQUESTED: 'not-requested',
    PENDING: 'pending',
    READY: 'ready'
  };

  /* ---------- PROTOTYPE-ONLY student selection ----------
     Real authentication is not implemented in this slice (U-AUTH-01/06
     are a later build item). This records WHICH REAL TenantUser record
     the prototype is currently viewing as. It is not an account
     switcher and grants nothing. */
  function protoStudentId() { return S.protoStudentId || null; }
  function setProtoStudent(personId) {
    S.protoStudentId = personId || null;
    save();
    return S.protoStudentId;
  }
  /* Resolves to a REAL student record or null — never a fabricated one. */
  function protoStudent() {
    var p = S.protoStudentId ? personById(S.protoStudentId) : null;
    return (p && p.role === 'student') ? p : null;
  }

  /* When the prototype data was seeded. Assessment visibility policies
     are authored as day offsets in data.js; they resolve against this,
     so a fresh reset always produces the same relative behaviour. */
  function seededAt() { return S.seededAt || null; }

  /* ============================================================
     THE ONE SHARED ENTITLEMENT SELECTOR.

     The Student workspace CONSUMES the Implementation-02 derivation
     and never re-derives it. There is exactly one entitlement engine
     (`entitlementsForStudent`); everything below is a read model over
     its output.
     ============================================================ */
  function getEffectiveStudentEntitlements(studentId) {
    return entitlementsForStudent(studentId).filter(function (e) { return e.effective; });
  }

  /* Reason order matters: the Student is told the MOST explanatory cause
     first. An inactive account explains everything else. Below that, a hold
     on a record whose term is still running is the accurate, actionable
     story — telling the Student their institution's access "has ended"
     because some OTHER record expired would be plainly wrong. */
  var BLOCK_PRIORITY = ['student-inactive', 'allocation-held', 'access-expired'];

  /* The Student-facing read model. Entitlements are grouped by
     EXPERIMENT — a Student thinks in experiments, not access records,
     and §32 of the brief keeps ACC-nnn, licence quantities and the
     administrative assignment source out of the Student surface
     entirely. Technologies are the UNION across the entitlements that
     are effective, so a second access record can only ever ADD a
     technology, never silently remove one. */
  function studentExperiments(personId) {
    var ents = entitlementsForStudent(personId);
    var byExp = {}, order = [];
    ents.forEach(function (e) {
      if (!byExp[e.experimentId]) {
        byExp[e.experimentId] = {
          experimentId: e.experimentId,
          technologies: [],          /* entitled AND effective */
          blockedTechnologies: [],   /* present only through a non-effective entitlement */
          effective: false,
          blockedBy: null,
          entitlements: []
        };
        order.push(byExp[e.experimentId]);
      }
      var row = byExp[e.experimentId];
      row.entitlements.push(e);
      var target = e.effective ? row.technologies : row.blockedTechnologies;
      e.technologies.forEach(function (t) {
        if (target.indexOf(t) === -1) { target.push(t); }
      });
      if (e.effective) { row.effective = true; }
    });
    order.forEach(function (row) {
      row.technologies = data.sortTech(row.technologies);
      /* A technology that is reachable effectively is not "blocked". */
      row.blockedTechnologies = data.sortTech(row.blockedTechnologies.filter(function (t) {
        return row.technologies.indexOf(t) === -1;
      }));
      if (!row.effective) {
        var reasons = row.entitlements.map(function (e) { return e.blockedBy; });
        for (var i = 0; i < BLOCK_PRIORITY.length; i++) {
          if (reasons.indexOf(BLOCK_PRIORITY[i]) !== -1) { row.blockedBy = BLOCK_PRIORITY[i]; break; }
        }
        if (!row.blockedBy) { row.blockedBy = reasons[0] || null; }
      }
    });
    order.sort(function (x, y) {
      var cx = data.contextOf(x.experimentId), cy = data.contextOf(y.experimentId);
      var nx = cx ? cx.course.name + ' ' + cx.experiment.name : x.experimentId;
      var ny = cy ? cy.course.name + ' ' + cy.experiment.name : y.experimentId;
      return nx < ny ? -1 : nx > ny ? 1 : 0;
    });
    return order;
  }

  function studentExperiment(personId, experimentId) {
    return studentExperiments(personId).filter(function (r) {
      return r.experimentId === experimentId;
    })[0] || null;
  }

  /* THE authorisation gate for technology-specific access (brief §17 /
     §46). Everything that could open a simulation asks this — the UI
     and the state writers both — so hand-editing the route to a
     technology the Student was never granted cannot produce an
     authorised launch state. */
  function studentEntitledTechnologies(personId, experimentId) {
    var row = studentExperiment(personId, experimentId);
    return (row && row.effective) ? row.technologies.slice() : [];
  }
  function studentCanRun(personId, experimentId, technology) {
    return studentEntitledTechnologies(personId, experimentId).indexOf(technology) !== -1;
  }

  /* ============================================================
     RESOURCE ACTIVITY — Experiment-level
     ============================================================ */

  function resourceActivity(personId, experimentId, resourceId) {
    return S.resourceActivity.filter(function (r) {
      return r.personId === personId && r.experimentId === experimentId && r.resourceId === resourceId;
    })[0] || null;
  }
  function resourceStatus(personId, experimentId, resourceId) {
    var rec = resourceActivity(personId, experimentId, resourceId);
    return rec ? rec.status : RES_STATUS.NOT_STARTED;
  }
  function ensureResourceActivity(personId, experimentId, resourceId) {
    var rec = resourceActivity(personId, experimentId, resourceId);
    if (rec) { return rec; }
    var p = personById(personId);
    if (!p) { return null; }
    S.seq.resourceAct += 1;
    rec = {
      id: 'RES-' + util.pad3(S.seq.resourceAct),
      tenantId: p.tenantId, personId: personId,
      experimentId: experimentId, resourceId: resourceId,
      status: RES_STATUS.NOT_STARTED,
      openedAt: null, completedAt: null
    };
    S.resourceActivity.push(rec);
    return rec;
  }
  /* Opening a resource is itself progress: it is a real action and it
     is the only thing that distinguishes "not started" from
     "in progress" at the resource level. */
  function openResource(personId, experimentId, resourceId) {
    if (!studentEntitledTechnologies(personId, experimentId).length) { return null; }
    var rec = ensureResourceActivity(personId, experimentId, resourceId);
    if (!rec) { return null; }
    if (rec.status === RES_STATUS.NOT_STARTED) {
      rec.status = RES_STATUS.IN_PROGRESS;
      rec.openedAt = new Date().toISOString();
    }
    save();
    return rec;
  }
  function setResourceComplete(personId, experimentId, resourceId, done) {
    if (!studentEntitledTechnologies(personId, experimentId).length) { return null; }
    var rec = ensureResourceActivity(personId, experimentId, resourceId);
    if (!rec) { return null; }
    var now = new Date().toISOString();
    if (done) {
      rec.status = RES_STATUS.COMPLETED;
      if (!rec.openedAt) { rec.openedAt = now; }
      rec.completedAt = now;
    } else {
      /* Reversible — un-marking returns the item to "opened", never to
         "never seen", because it was in fact seen. */
      rec.status = RES_STATUS.IN_PROGRESS;
      rec.completedAt = null;
      if (!rec.openedAt) { rec.openedAt = now; }
    }
    save();
    return rec;
  }
  function resourceProgress(personId, experimentId) {
    var list = data.resourcesFor(experimentId);
    var completed = 0, started = 0;
    list.forEach(function (r) {
      var st = resourceStatus(personId, experimentId, r.id);
      if (st === RES_STATUS.COMPLETED) { completed += 1; started += 1; }
      else if (st === RES_STATUS.IN_PROGRESS) { started += 1; }
    });
    return { total: list.length, completed: completed, started: started };
  }

  /* ============================================================
     SIMULATION ACTIVITY — technology-level

     ⚠ Nothing here downloads, installs, hosts or launches anything.
     There is no package, no binary, no external URL and no runtime.
     These records represent the STATES a real delivery would move
     through, driven only by explicit prototype actions.
     ============================================================ */

  function simulationActivity(personId, experimentId, technology) {
    return S.simulationActivity.filter(function (s) {
      return s.personId === personId && s.experimentId === experimentId && s.technology === technology;
    })[0] || null;
  }
  function simulationStatus(personId, experimentId, technology) {
    var rec = simulationActivity(personId, experimentId, technology);
    return rec ? rec.status : SIM_STATUS.NOT_STARTED;
  }
  function ensureSimulation(personId, experimentId, technology) {
    if (!studentCanRun(personId, experimentId, technology)) { return null; }
    var rec = simulationActivity(personId, experimentId, technology);
    if (rec) { return rec; }
    var p = personById(personId);
    if (!p) { return null; }
    var tech = data.TECHNOLOGIES[technology];
    S.seq.simAct += 1;
    rec = {
      id: 'SIM-' + util.pad3(S.seq.simAct),
      tenantId: p.tenantId, personId: personId,
      experimentId: experimentId, technology: technology,
      status: SIM_STATUS.NOT_STARTED,
      /* Hosted experiences need no device authorisation; package
         technologies do (STK31-37). */
      deliveryState: (tech && tech.delivery === 'hosted')
        ? DELIVERY_STATE.READY : DELIVERY_STATE.NOT_REQUESTED,
      startedAt: null, completedAt: null,
      timeSpentSeconds: 0, launches: 0
    };
    S.simulationActivity.push(rec);
    return rec;
  }
  /* AR / VR / MR only — asks for the authorised package on a device. */
  function requestSimulationAccess(personId, experimentId, technology) {
    var rec = ensureSimulation(personId, experimentId, technology);
    if (!rec || rec.deliveryState !== DELIVERY_STATE.NOT_REQUESTED) { return null; }
    rec.deliveryState = DELIVERY_STATE.PENDING;
    rec.requestedAt = new Date().toISOString();
    save();
    return rec;
  }
  /* PROTOTYPE ONLY: stands in for the delivery event a real
     entitlement-aware mechanism would produce. It is labelled as a
     simulation everywhere it is offered. */
  function simulatePackageReady(personId, experimentId, technology) {
    var rec = ensureSimulation(personId, experimentId, technology);
    if (!rec || rec.deliveryState !== DELIVERY_STATE.PENDING) { return null; }
    rec.deliveryState = DELIVERY_STATE.READY;
    rec.readyAt = new Date().toISOString();
    save();
    return rec;
  }
  function startSimulation(personId, experimentId, technology) {
    var rec = ensureSimulation(personId, experimentId, technology);
    if (!rec || rec.deliveryState !== DELIVERY_STATE.READY) { return null; }
    if (rec.status === SIM_STATUS.COMPLETED) { return rec; }
    var now = new Date().toISOString();
    if (rec.status === SIM_STATUS.NOT_STARTED) {
      rec.status = SIM_STATUS.IN_PROGRESS;
      rec.startedAt = now;
    }
    rec.launches += 1;
    save();
    return rec;
  }
  /* Completion is what a real integration would RETURN, carrying a
     technology identifier (STK31-35 / STK31-36). Here the Student
     records it, and time spent is derived from the real interval
     between starting and completing — never a decorative number. */
  function completeSimulation(personId, experimentId, technology) {
    var rec = ensureSimulation(personId, experimentId, technology);
    if (!rec || rec.status !== SIM_STATUS.IN_PROGRESS) { return null; }
    var now = new Date().toISOString();
    rec.status = SIM_STATUS.COMPLETED;
    rec.completedAt = now;
    var ms = new Date(now).getTime() - new Date(rec.startedAt || now).getTime();
    rec.timeSpentSeconds = Math.max(0, Math.round(ms / 1000));
    save();
    return rec;
  }

  /* ============================================================
     ASSESSMENT ATTEMPTS — technology-level

     Recording is UNCONDITIONAL (Batch 02's FRD 11.2.1/11.2.2 rule,
     preserved): every started attempt is counted, and `attemptLimit`
     gates only STARTING a new one.
     ============================================================ */

  var ATTEMPT_STATUS = { IN_PROGRESS: 'in-progress', SUBMITTED: 'submitted' };
  /* `PENDING_REVIEW` is the stored outcome of an attempt containing a
     written answer. STK31-31 settles who resolves it: FACULTY is the only
     human role responsible for descriptive-answer evaluation, so the
     Student-facing label for this state names Faculty review rather than
     an anonymous evaluator. The Faculty review workspace itself is a later
     slice — nothing here grades, scores or times that review. */
  var OUTCOME = { PASSED: 'PASSED', NOT_PASSED: 'NOT_PASSED', PENDING_REVIEW: 'PENDING_FACULTY_REVIEW' };

  function attemptById(id) {
    return S.attempts.filter(function (a) { return a.id === id; })[0] || null;
  }
  /* Keyed by Student + Experiment. `sourceTechnology` is carried on the
     record but is NOT part of its identity. */
  function attemptsFor(personId, experimentId) {
    return S.attempts.filter(function (a) {
      return a.personId === personId && a.experimentId === experimentId;
    });
  }
  function currentAttempt(personId, experimentId) {
    return attemptsFor(personId, experimentId).filter(function (a) {
      return a.status === ATTEMPT_STATUS.IN_PROGRESS;
    })[0] || null;
  }
  function latestSubmittedAttempt(personId, experimentId) {
    var subs = attemptsFor(personId, experimentId).filter(function (a) {
      return a.status === ATTEMPT_STATUS.SUBMITTED;
    });
    return subs.length ? subs[subs.length - 1] : null;
  }

  /* The assessment belongs to the Experiment, so its gate is the
     Experiment's effective entitlement — not one technology's. */
  function studentCanOpenExperiment(personId, experimentId) {
    return studentEntitledTechnologies(personId, experimentId).length > 0;
  }

  /* Why a new attempt cannot be started — always a reason, never a
     silently disabled control. */
  function attemptBlock(personId, experimentId) {
    if (!studentCanOpenExperiment(personId, experimentId)) { return 'not-entitled'; }
    var asm = data.assessmentFor(experimentId);
    if (!asm) { return 'no-assessment'; }
    var used = attemptsFor(personId, experimentId).length;
    if (asm.attemptLimit && used >= asm.attemptLimit) { return 'attempt-limit'; }
    var last = latestSubmittedAttempt(personId, experimentId);
    if (last && last.outcome === OUTCOME.PENDING_REVIEW) { return 'pending-faculty-review'; }
    if (last && last.outcome === OUTCOME.PASSED) { return 'already-passed'; }
    return null;
  }

  /* Which simulation route the Student came in from — an observation,
     recorded because it is a real fact, never an identity. Null when
     they have not run a simulation yet. */
  function latestSimulationTechnology(personId, experimentId) {
    var best = null, bestAt = '';
    S.simulationActivity.forEach(function (sim) {
      if (sim.personId !== personId || sim.experimentId !== experimentId) { return; }
      var at = sim.completedAt || sim.startedAt || sim.readyAt || sim.requestedAt || '';
      if (at >= bestAt) { bestAt = at; best = sim.technology; }
    });
    return best;
  }

  function startAttempt(personId, experimentId) {
    /* The entitlement gate is hoisted ABOVE the resume shortcut on purpose.
       Resuming an attempt that is already open is legitimate when the block
       is `attempt-limit` (the open attempt counts toward `used`, so testing
       the whole block first would refuse to resume), but it is never
       legitimate once the entitlement is gone — a Tenant Admin can remove
       the assignment, or the access term end, while an attempt is open.
       Only the entitlement clause runs before the resume. */
    if (!studentCanOpenExperiment(personId, experimentId)) { return null; }
    var open = currentAttempt(personId, experimentId);
    if (open) { return open; }
    if (attemptBlock(personId, experimentId)) { return null; }
    var p = personById(personId);
    var asm = data.assessmentFor(experimentId);
    S.seq.attempt += 1;
    var rec = {
      id: 'ATT-' + util.pad3(S.seq.attempt),
      tenantId: p.tenantId, personId: personId,
      experimentId: experimentId,
      sourceTechnology: latestSimulationTechnology(personId, experimentId),
      assessmentId: asm.id,
      attemptNo: attemptsFor(personId, experimentId).length + 1,
      status: ATTEMPT_STATUS.IN_PROGRESS,
      answers: {},
      startedAt: new Date().toISOString(),
      submittedAt: null,
      score: null,
      outcome: null
    };
    S.attempts.push(rec);
    save();
    return rec;
  }

  /* Every answer change is persisted immediately, which is what makes
     an attempt survive a refresh. */
  function saveAnswer(attemptId, questionId, value) {
    var a = attemptById(attemptId);
    if (!a || a.status !== ATTEMPT_STATUS.IN_PROGRESS) { return null; }
    /* An attempt can only be STARTED while entitled, but entitlement can
       be withdrawn while one is open — a Tenant Admin removing the
       assignment, or the access term ending, mid-attempt. The writer
       applies the same gate as the screen, so a page already on screen
       cannot keep writing after access is gone. */
    if (!studentCanOpenExperiment(a.personId, a.experimentId)) { return null; }
    if (value === null || value === undefined || value === '') { delete a.answers[questionId]; }
    else { a.answers[questionId] = value; }
    save();
    return a;
  }
  function answeredCount(attempt) {
    var asm = data.assessmentById(attempt.assessmentId);
    if (!asm) { return 0; }
    return asm.questions.filter(function (q) {
      var v = attempt.answers[q.id];
      return v !== undefined && v !== null && v !== '';
    }).length;
  }
  function unansweredQuestions(attempt) {
    var asm = data.assessmentById(attempt.assessmentId);
    if (!asm) { return []; }
    return asm.questions.filter(function (q) {
      var v = attempt.answers[q.id];
      return v === undefined || v === null || v === '';
    });
  }

  /* Submission is idempotent by construction: only an `in-progress`
     attempt can be submitted, so a double click, a resubmitted form
     and a refreshed page all produce exactly one result. */
  function submitAttempt(attemptId) {
    var a = attemptById(attemptId);
    if (!a || a.status !== ATTEMPT_STATUS.IN_PROGRESS) { return null; }
    if (!studentCanOpenExperiment(a.personId, a.experimentId)) { return null; }
    var asm = data.assessmentById(a.assessmentId);
    if (!asm) { return null; }

    var earned = 0, total = 0;
    asm.questions.forEach(function (q) {
      if (q.type === 'descriptive') { return; }
      var pts = q.points || 1;
      total += pts;
      var given = a.answers[q.id];
      if (q.type === 'mcq' && given === q.answer) { earned += pts; }
      if (q.type === 'tf' && given === q.answer) { earned += pts; }
    });

    a.status = ATTEMPT_STATUS.SUBMITTED;
    a.submittedAt = new Date().toISOString();
    a.score = {
      earned: earned, total: total,
      percent: total > 0 ? Math.round((earned / total) * 100) : null
    };
    /* A descriptive answer has no machine outcome. STK31-31 gives the
       pending state its owner — Faculty — and the Faculty evaluation
       queue is a later slice, so the attempt stays pending here rather
       than being auto-graded. Auto-review is never auto-final. */
    if (data.hasDescriptive(asm)) {
      a.outcome = OUTCOME.PENDING_REVIEW;
    } else {
      a.outcome = (a.score.percent !== null && a.score.percent >= (asm.passMark || 0))
        ? OUTCOME.PASSED : OUTCOME.NOT_PASSED;
    }
    save();
    return a;
  }

  /* ---------- answer / explanation visibility policy (STK31-32) ----------
     Three CONFIRMED general options and no invented fourth. The BITS /
     Taxila rule is NOT modelled (ND-10) and nothing here claims it.
     D-25 is untouched: the key is never exposed during an attempt,
     whatever this returns. */
  function assessmentRelease(assessment) {
    var out = { mode: null, label: '', releaseAt: null, released: false, sentence: '' };
    if (!assessment || !assessment.policy) { return out; }
    var pol = assessment.policy;
    out.mode = pol.mode;
    out.label = data.policyLabel(pol.mode);
    if (pol.mode === 'SHOW_IMMEDIATELY') {
      out.released = true;
      out.sentence = 'Your score and the explanations are shown as soon as you submit.';
      return out;
    }
    var base = seededAt() || new Date().toISOString();
    out.releaseAt = util.addDays(base, pol.offsetDays || 0);
    out.released = new Date(out.releaseAt).getTime() <= Date.now();
    out.sentence = pol.mode === 'AFTER_DEADLINE'
      ? 'Your answers and the explanations become available after the assessment deadline on ' +
        util.fmtDate(out.releaseAt) + '.'
      : 'Your answers and the explanations become available on ' + util.fmtDate(out.releaseAt) + '.';
    return out;
  }

  /* ============================================================
     PROGRESS — DERIVED, never stored, and now per technology.

     PM-09 confirmed Batch 02's derivation. STK31-36 adds the
     technology axis: three assigned technology experiences must not
     collapse into one ambiguous completion state.
     ============================================================ */

  /* Both derived, never stored — so renaming them carries no migration. */
  var ASSESS_STATE = {
    NONE: 'NONE', NOT_STARTED: 'NOT_STARTED', IN_PROGRESS: 'IN_PROGRESS',
    PENDING_REVIEW: 'PENDING_FACULTY_REVIEW', PASSED: 'PASSED', NOT_PASSED: 'NOT_PASSED'
  };
  var TECH_PROGRESS = {
    NOT_STARTED: 'NOT_STARTED', IN_PROGRESS: 'IN_PROGRESS',
    PENDING_REVIEW: 'PENDING_FACULTY_REVIEW', COMPLETED: 'COMPLETED'
  };

  /* ONE assessment state per Experiment, whatever the Student was
     licensed in. */
  function assessmentState(personId, experimentId) {
    var asm = data.assessmentFor(experimentId);
    if (!asm) { return ASSESS_STATE.NONE; }
    if (currentAttempt(personId, experimentId)) { return ASSESS_STATE.IN_PROGRESS; }
    var last = latestSubmittedAttempt(personId, experimentId);
    if (!last) { return ASSESS_STATE.NOT_STARTED; }
    if (last.outcome === OUTCOME.PENDING_REVIEW) { return ASSESS_STATE.PENDING_REVIEW; }
    if (last.outcome === OUTCOME.PASSED) { return ASSESS_STATE.PASSED; }
    return ASSESS_STATE.NOT_PASSED;
  }

  /* One technology's state. Resources are Experiment-level, so the
     same resource progress appears on every technology row — exactly
     the shape the learning-progress model draws.

     PM-09 confirmed Batch 02's derivation, which is a FOUR-part rule:
     resources + simulation + assessment pass, and never complete while
     a result is pending. STK31-36 adds the technology axis to it; it
     does not remove a part. So learning resources do not GATE the
     simulation — nothing in any source makes them a blocker — but they
     ARE required for completion.

     ⚠ An Experiment that carries NO resources must never be held short
     of completion by a requirement that cannot be met. Batch 02's rule
     ANDs `resourcesDone` unconditionally and only works because its one
     resource-free module is seeded complete; that fragility is not
     copied. */
  function technologyProgress(personId, experimentId, technology) {
    var sim = simulationActivity(personId, experimentId, technology);
    var simStatus = sim ? sim.status : SIM_STATUS.NOT_STARTED;
    /* Experiment-level, exactly like the resources: the same assessment
       state appears against every technology row, because there is one
       assessment. Only the SIMULATION differs by technology. */
    var assess = assessmentState(personId, experimentId);
    var res = resourceProgress(personId, experimentId);
    var resourcesComplete = res.total === 0 || res.completed === res.total;
    var learningDone = simStatus === SIM_STATUS.COMPLETED &&
      (assess === ASSESS_STATE.NONE || assess === ASSESS_STATE.PASSED);
    var status;
    if (learningDone && resourcesComplete) {
      status = TECH_PROGRESS.COMPLETED;
    } else if (assess === ASSESS_STATE.PENDING_REVIEW &&
               simStatus === SIM_STATUS.COMPLETED && resourcesComplete) {
      /* Pending Faculty review only describes a technology that has
         nothing else outstanding. The assessment is shared across the
         Experiment, so claiming it for a technology whose simulation has
         not been run would hide real outstanding work behind someone
         else's pending result — and an Experiment NEVER completes while
         a result is pending either way. */
      status = TECH_PROGRESS.PENDING_REVIEW;
    } else if (simStatus === SIM_STATUS.NOT_STARTED && res.started === 0 &&
               (assess === ASSESS_STATE.NONE || assess === ASSESS_STATE.NOT_STARTED)) {
      status = TECH_PROGRESS.NOT_STARTED;
    } else {
      status = TECH_PROGRESS.IN_PROGRESS;
    }
    return {
      technology: technology,
      simulation: sim,
      simulationStatus: simStatus,
      deliveryState: sim ? sim.deliveryState : null,
      assessment: assess,
      attempt: latestSubmittedAttempt(personId, experimentId) ||
               currentAttempt(personId, experimentId),
      status: status,
      /* True when the simulation and assessment are done and the ONLY
         thing left is the resource list — so the Student is never left
         wondering why a finished-looking technology is not complete. */
      waitingOnResources: learningDone && !resourcesComplete
    };
  }

  /* Latest real activity timestamp for one Experiment — used for
     "last activity", which is never shown unless something happened. */
  function lastActivityAt(personId, experimentId) {
    var stamps = [];
    S.resourceActivity.forEach(function (r) {
      if (r.personId === personId && r.experimentId === experimentId) {
        if (r.completedAt) { stamps.push(r.completedAt); }
        if (r.openedAt) { stamps.push(r.openedAt); }
      }
    });
    S.simulationActivity.forEach(function (s) {
      if (s.personId === personId && s.experimentId === experimentId) {
        [s.completedAt, s.startedAt, s.readyAt, s.requestedAt].forEach(function (t) {
          if (t) { stamps.push(t); }
        });
      }
    });
    S.attempts.forEach(function (a) {
      if (a.personId === personId && a.experimentId === experimentId) {
        if (a.submittedAt) { stamps.push(a.submittedAt); }
        if (a.startedAt) { stamps.push(a.startedAt); }
      }
    });
    if (!stamps.length) { return null; }
    stamps.sort();
    return stamps[stamps.length - 1];
  }

  /* One Experiment's progress across the technologies passed in.
     The caller supplies the technology list, which is ALWAYS the
     entitled set — progress is never reported for a technology the
     Student was not assigned. */
  /* `opts.historical` reports work whose ASSIGNMENT NO LONGER EXISTS. The
     assigned technology set is gone with it, so the only technologies left
     to report on are the ones the Student actually touched — and a roll-up
     over those would overstate: a Student who finished VR of an assigned
     VR + AR would read as "Completed 100%" once the assignment was removed,
     because AR is no longer in the list to hold it back. Historical work is
     therefore reported WITHOUT a completion verdict and WITHOUT a
     percentage: what is shown is what actually happened. */
  function experimentProgress(personId, experimentId, technologies, opts) {
    opts = opts || {};
    var techs = (technologies || []).slice();
    var asm = data.assessmentFor(experimentId);
    var res = resourceProgress(personId, experimentId);
    var rows = techs.map(function (t) { return technologyProgress(personId, experimentId, t); });

    var status;
    if (opts.historical) {
      status = null;
    } else if (!rows.length) {
      /* No technology to report on — the state can only come from the
         Experiment-level resources. Reporting NOT_STARTED here while the
         resources were finished would contradict the figures beside it. */
      status = (res.total && res.completed === res.total) ? TECH_PROGRESS.COMPLETED
             : res.started ? TECH_PROGRESS.IN_PROGRESS
             : TECH_PROGRESS.NOT_STARTED;
    } else if (rows.every(function (r) { return r.status === TECH_PROGRESS.COMPLETED; })) {
      status = TECH_PROGRESS.COMPLETED;
    } else if (rows.some(function (r) { return r.status === TECH_PROGRESS.PENDING_REVIEW; }) &&
               rows.every(function (r) {
                 return r.status === TECH_PROGRESS.PENDING_REVIEW || r.status === TECH_PROGRESS.COMPLETED;
               })) {
      status = TECH_PROGRESS.PENDING_REVIEW;
    } else if (rows.every(function (r) { return r.status === TECH_PROGRESS.NOT_STARTED; })) {
      status = TECH_PROGRESS.NOT_STARTED;
    } else {
      status = TECH_PROGRESS.IN_PROGRESS;
    }

    /* Percentage from EXPLICIT completed learning steps only — never a
       decorative figure. The steps are: each Experiment-level resource
       once, one SIMULATION step per entitled technology, and — where an
       assessment is configured — ONE assessment step for the Experiment,
       counted once however many technologies were licensed. A result
       pending Faculty review contributes nothing, which is what keeps
       "never complete while a result is pending" true of the number as
       well as of the label. */
    var assessState = assessmentState(personId, experimentId);
    var stepsTotal = res.total + rows.length + (asm ? 1 : 0);
    var stepsDone = res.completed + (asm && assessState === ASSESS_STATE.PASSED ? 1 : 0);
    rows.forEach(function (r) {
      if (r.simulationStatus === SIM_STATUS.COMPLETED) { stepsDone += 1; }
    });

    return {
      experimentId: experimentId,
      technologies: rows,
      resources: res,
      assessment: asm,
      status: status,
      historical: !!opts.historical,
      steps: opts.historical ? null : { total: stepsTotal, done: stepsDone },
      percent: opts.historical ? null : (stepsTotal > 0 ? Math.round((stepsDone / stepsTotal) * 100) : 0),
      lastActivityAt: lastActivityAt(personId, experimentId)
    };
  }

  /* Has this Student done ANYTHING against this Experiment? Used to
     tell "no longer available" apart from "never touched" after an
     assignment source is removed. */
  function hasActivity(personId, experimentId) {
    return !!lastActivityAt(personId, experimentId);
  }
  /* Experiments the Student has activity against but holds NO
     entitlement record for at all — the assignment source was removed.
     Nothing is deleted; the work is shown as past activity, clearly
     separated from current access (brief §50). */
  function studentPastExperiments(personId) {
    var current = {};
    entitlementsForStudent(personId).forEach(function (e) { current[e.experimentId] = true; });
    var seen = {}, out = [];
    function note(experimentId) {
      if (current[experimentId] || seen[experimentId]) { return; }
      seen[experimentId] = true;
      out.push(experimentId);
    }
    S.resourceActivity.forEach(function (r) { if (r.personId === personId) { note(r.experimentId); } });
    S.simulationActivity.forEach(function (s) { if (s.personId === personId) { note(s.experimentId); } });
    S.attempts.forEach(function (a) { if (a.personId === personId) { note(a.experimentId); } });
    return out;
  }
  /* Technologies this Student has recorded activity against for one
     Experiment, whatever the current entitlement says. Past activity is
     reported from what actually happened. */
  /* Simulation activity only: it is the one genuinely technology-scoped
     learning record. An attempt belongs to the Experiment, so it does not
     make a technology "worked on". */
  function technologiesWithActivity(personId, experimentId) {
    var set = {};
    S.simulationActivity.forEach(function (s) {
      if (s.personId === personId && s.experimentId === experimentId) { set[s.technology] = true; }
    });
    return data.sortTech(Object.keys(set));
  }

  /* Whole-workspace roll-up for Student Home and Progress. */
  function studentProgressSummary(personId) {
    var rows = studentExperiments(personId);
    var out = {
      entitled: 0, notStarted: 0, inProgress: 0, awaiting: 0, completed: 0,
      unavailable: 0, items: []
    };
    rows.forEach(function (row) {
      if (!row.effective) { out.unavailable += 1; return; }
      out.entitled += 1;
      var prog = experimentProgress(personId, row.experimentId, row.technologies);
      out.items.push({ row: row, progress: prog });
      if (prog.status === TECH_PROGRESS.COMPLETED) { out.completed += 1; }
      else if (prog.status === TECH_PROGRESS.PENDING_REVIEW) { out.awaiting += 1; }
      else if (prog.status === TECH_PROGRESS.IN_PROGRESS) { out.inProgress += 1; }
      else { out.notStarted += 1; }
    });
    return out;
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
    coursesWithoutMapping: coursesWithoutMapping,

    /* ---- Implementation 03 — Student / learning ---- */
    SIM_STATUS: SIM_STATUS, RES_STATUS: RES_STATUS, DELIVERY_STATE: DELIVERY_STATE,
    ATTEMPT_STATUS: ATTEMPT_STATUS, OUTCOME: OUTCOME,
    ASSESS_STATE: ASSESS_STATE, TECH_PROGRESS: TECH_PROGRESS,

    protoStudentId: protoStudentId, setProtoStudent: setProtoStudent, protoStudent: protoStudent,
    seededAt: seededAt,

    getEffectiveStudentEntitlements: getEffectiveStudentEntitlements,
    studentExperiments: studentExperiments, studentExperiment: studentExperiment,
    studentEntitledTechnologies: studentEntitledTechnologies, studentCanRun: studentCanRun,

    resourceActivity: resourceActivity, resourceStatus: resourceStatus,
    openResource: openResource, setResourceComplete: setResourceComplete,
    resourceProgress: resourceProgress,

    simulationActivity: simulationActivity, simulationStatus: simulationStatus,
    requestSimulationAccess: requestSimulationAccess, simulatePackageReady: simulatePackageReady,
    startSimulation: startSimulation, completeSimulation: completeSimulation,

    attemptById: attemptById, attemptsFor: attemptsFor,
    currentAttempt: currentAttempt, latestSubmittedAttempt: latestSubmittedAttempt,
    attemptBlock: attemptBlock, startAttempt: startAttempt,
    studentCanOpenExperiment: studentCanOpenExperiment,
    latestSimulationTechnology: latestSimulationTechnology,
    saveAnswer: saveAnswer, submitAttempt: submitAttempt,
    answeredCount: answeredCount, unansweredQuestions: unansweredQuestions,
    assessmentRelease: assessmentRelease, assessmentState: assessmentState,

    technologyProgress: technologyProgress, experimentProgress: experimentProgress,
    lastActivityAt: lastActivityAt, hasActivity: hasActivity,
    studentPastExperiments: studentPastExperiments,
    technologiesWithActivity: technologiesWithActivity,
    studentProgressSummary: studentProgressSummary
  };
})();
